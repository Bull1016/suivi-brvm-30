import * as cheerio from "cheerio";
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
        const $ = cheerio.load(html);

        $("table").each((_, table) => {
          const text = $(table).text();
          if (text.includes("Symbole") && text.includes("Nom")) {
            $(table).find("tr").each((_, tr) => {
              if ($(tr).find("th").length > 0) return;
              const tds = $(tr).find("td");
              if (tds.length >= 2) {
                const symText = $(tds[0]).text().trim();
                const symMatch = symText.match(/^([A-Z0-9]{3,6})\b/);
                if (symMatch) {
                  newMap[symMatch[1]] = sectorName;
                }
              }
            });
          }
        });
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
  if (!html) return [];
  const $ = cheerio.load(html);
  const dividends: DividendHistory[] = [];
  const maxYear = new Date().getFullYear() + 1;

  $("table").each((_, table) => {
    const text = $(table).text();
    if (text.includes("Année") && text.includes("Montant")) {
      $(table).find("tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length === 3) {
          const yearText = $(tds[0]).text().replace(/\s+/g, "").trim();
          const amountText = $(tds[1]).text().replace(/\s+/g, "").replace(",", ".").trim();
          const year = parseInt(yearText, 10);
          const amount = parseFloat(amountText);

          if (!Number.isNaN(year) && !Number.isNaN(amount) && year >= 2000 && year <= maxYear) {
            dividends.push({ year, amount, paid: amount > 0 });
          }
        }
      });
    }
  });

  return dividends;
}

/** Scrapes current BRVM quotations from the Sika Finance market table. */
export async function scrapeSikaQuotes(): Promise<ScrapedQuote[]> {
  const sikaUrl = "https://www.sikafinance.com/marches/aaz";
  const { response, html } = await fetchHtmlWithTimeout(sikaUrl);

  if (!response.ok) {
    throw new Error(`Sika Finance AAZ returned HTTP status ${response.status}`);
  }

  const $ = cheerio.load(html);
  const scrapedStocks: ScrapedQuote[] = [];

  $("tr").each((_, tr) => {
    const href = $(tr).find('a[href*="/marches/cotation_"]').attr("href");
    if (!href) return;
    const match = href.match(/cotation_([A-Z0-9]+)\.([a-z]{2})/i);
    if (!match) return;

    const symbol = match[1].toUpperCase();
    const country = match[2].toLowerCase();
    const tds = $(tr).find("td");
    if (tds.length < 8) return;

    const cleanText = (elem: cheerio.Cheerio<any>) =>
      elem.text().replace(/\s+/g, "").replace(/&nbsp;/g, "").replace("%", "").trim();

    const highText = cleanText($(tds[2]));
    const lowText = cleanText($(tds[3]));
    const priceText = cleanText($(tds[6]));
    const varText = cleanText($(tds[7]));

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
  });

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
