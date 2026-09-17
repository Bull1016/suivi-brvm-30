import { BRVM_SECTORS, DEFAULT_SYMBOL_SECTOR_MAP } from "./constants.js";
import { processStockDividends } from "./process.js";
import { SCRAPE_HEADERS, type DividendHistory, type StockData } from "./types.js";

/** Fetches a response body while keeping the abort timeout active until it is read. */
async function fetchHtmlWithTimeout(
  url: string,
  timeoutMs: number = 15000
): Promise<{ response: Response; html: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: SCRAPE_HEADERS,
      signal: controller.signal,
    });
    const html = await response.text();
    return { response, html };
  } finally {
    clearTimeout(timeoutId);
  }
}

export type ScrapedQuote = {
  symbol: string;
  country: string;
  currentPrice: number;
  high: number;
  low: number;
  variation: number;
};

/** Builds a symbol-to-sector map by scraping each BRVM sector page. */
export async function fetchBRVMSectors(): Promise<Record<string, string>> {
  const sectorIds = [194, 195, 196, 197, 198, 199, 200];
  const newMap: Record<string, string> = { ...DEFAULT_SYMBOL_SECTOR_MAP };
  let successfulParses = 0;

  await Promise.all(
    sectorIds.map(async (id) => {
      try {
        const { response, html } = await fetchHtmlWithTimeout(
          `https://www.brvm.org/fr/cours-actions/${id}`
        );
        if (!response.ok) return;
        const sectorName = BRVM_SECTORS[id];
        const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
        const stockTable = tables.find((t) => t.includes("Symbole") && t.includes("Nom"));
        if (!stockTable) return;
        const trMatches = stockTable.match(/<tr[\s\S]*?<\/tr>/gi) || [];
        for (const tr of trMatches) {
          if (tr.includes("<th")) continue;
          const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
          if (tdMatches.length < 2) continue;
          const symText = tdMatches[0].replace(/<[^>]*>/g, "").trim();
          const symMatch = symText.match(/^([A-Z0-9]{3,6})\b/);
          if (!symMatch) continue;
          const sym = symMatch[1];
          newMap[sym] = sectorName;
          if (sym === "ONTBF") newMap["ONTB"] = sectorName;
          if (sym === "CBIBF") newMap["CBIB"] = sectorName;
        }
        successfulParses++;
      } catch (e) {
        console.error(`Failed to fetch sector ${id}:`, e);
      }
    })
  );

  if (successfulParses === 0) {
    throw new Error("Aucune page de secteur n'a pu être parsée avec succès.");
  }

  return newMap;
}

/** Extracts valid dividend records from a Sika Finance quote page. */
export function parseDividendsFromHtml(html: string): DividendHistory[] {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  let dividendTableHtml = "";

  for (const table of tables) {
    if (table.includes("Année") && table.includes("Montant") && table.includes("Rendement")) {
      dividendTableHtml = table;
      break;
    }
  }

  if (!dividendTableHtml) {
    return [];
  }

  const trMatches = dividendTableHtml.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
  const dividends: DividendHistory[] = [];

  for (const tr of trMatches) {
    const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (tdMatches.length === 3) {
      const yearText = tdMatches[0].replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
      const amountText = tdMatches[1]
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, "")
        .replace(",", ".")
        .trim();

      const year = parseInt(yearText, 10);
      const amount = parseFloat(amountText);

      if (!Number.isNaN(year) && !Number.isNaN(amount) && year >= 2000 && year <= 2030) {
        dividends.push({
          year,
          amount,
          paid: amount > 0,
        });
      }
    }
  }

  return dividends;
}

/** Scrapes current BRVM quotations from the Sika Finance market table. */
export async function scrapeSikaQuotes(): Promise<ScrapedQuote[]> {
  const sikaUrl = "https://www.sikafinance.com/marches/aaz";
  const { response, html } = await fetchHtmlWithTimeout(sikaUrl);

  if (!response.ok) {
    throw new Error(`Sika Finance AAZ returned HTTP status ${response.status}`);
  }

  /** Normalizes text extracted from a quotation table cell. */
  const cleanCellText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/&#x[0-9a-f]+;/gi, "")
      .replace(/&nbsp;/g, "")
      .replace(/\s+/g, "")
      .trim();
  };

  const trMatches = html.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
  const scrapedStocks: ScrapedQuote[] = [];

  for (const tr of trMatches) {
    const hrefMatch = tr.match(/href="\/marches\/cotation_([A-Z0-9]+)\.([a-z]{2})"/i);
    if (!hrefMatch) continue;
    const symbol = hrefMatch[1].toUpperCase();
    const country = hrefMatch[2].toLowerCase();
    const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (tdMatches.length < 8) continue;

    const highText = cleanCellText(tdMatches[2].replace(/<[^>]*>/g, ""));
    const lowText = cleanCellText(tdMatches[3].replace(/<[^>]*>/g, ""));
    const priceText = cleanCellText(tdMatches[6].replace(/<[^>]*>/g, ""));
    const varText = cleanCellText(tdMatches[7].replace(/<[^>]*>/g, "")).replace("%", "");

    const currentPrice = parseFloat(priceText);
    const high = parseFloat(highText) || currentPrice;
    const low = parseFloat(lowText) || currentPrice;
    const variation = parseFloat(varText) || 0;

    if (!Number.isNaN(currentPrice)) {
      scrapedStocks.push({
        symbol,
        country,
        currentPrice,
        high,
        low,
        variation,
      });
    }
  }

  return scrapedStocks;
}

/** Merges scraped quotations into the existing stock collection. */
export function mergeScrapedQuotes(
  existing: StockData[],
  scraped: ScrapedQuote[],
  sectorMap: Record<string, string>
): StockData[] {
  return existing.map((existingStock) => {
    const quote = scraped.find(
      (s) => s.symbol.toUpperCase() === existingStock.symbol.toUpperCase()
    );
    if (!quote) {
      return processStockDividends(existingStock, sectorMap);
    }
    return processStockDividends(
      {
        ...existingStock,
        currentPrice: quote.currentPrice || existingStock.currentPrice,
        high: quote.high || quote.currentPrice || existingStock.high,
        low: quote.low || quote.currentPrice || existingStock.low,
        variation: quote.variation !== undefined ? quote.variation : existingStock.variation,
        source: "scraped",
      },
      sectorMap
    );
  });
}

/** Fills a parsed dividend history into the five-year rolling window. */
export function dividendsForRollingWindow(parsed: DividendHistory[]): DividendHistory[] {
  const lastYear = new Date().getFullYear() - 1;
  const targetYears = Array.from({ length: 5 }, (_, i) => lastYear - i);
  return targetYears.map((year) => {
    const found = parsed.find((d) => d.year === year);
    return found ? { year, amount: found.amount, paid: found.paid } : { year, amount: 0, paid: false };
  });
}

/** Scrapes and normalizes dividend history for one listed stock. */
export async function scrapeStockDividends(symbol: string, country: string): Promise<DividendHistory[]> {
  const url = `https://www.sikafinance.com/marches/cotation_${symbol}.${country}`;
  const { response, html } = await fetchHtmlWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch cotation detail: HTTP ${response.status}`);
  }
  const parsed = parseDividendsFromHtml(html);
  if (parsed.length === 0) {
    throw new Error("Aucun tableau de dividendes n'a pu être extrait de la page.");
  }
  return dividendsForRollingWindow(parsed);
}
