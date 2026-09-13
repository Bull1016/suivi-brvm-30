import { DEFAULT_BRVM30_PDF } from "./types";
import { processStockDividends } from "./process";
import {
  fetchBRVMSectors,
  mergeScrapedQuotes,
  scrapeSikaQuotes,
  scrapeStockDividends,
} from "./scrape";
import {
  getDescription,
  getDivCursor,
  getSectorMap,
  getState,
  isSyncing,
  saveDescription,
  saveSectorMap,
  saveState,
  setDivCursor,
  setSyncing,
} from "./store";
import { generateCompanyDescription } from "./gemini";
import type { StockData } from "./types";

function brvm30Url() {
  return process.env.BRVM_30_URL || DEFAULT_BRVM30_PDF;
}

export async function listStocks() {
  const [state, syncing] = await Promise.all([getState(), isSyncing()]);
  return {
    success: true,
    stocks: state.stocks,
    lastSync: state.lastSync,
    isSyncing: syncing,
    brvm30Url: brvm30Url(),
  };
}

export async function syncQuotations() {
  if (await isSyncing()) {
    return {
      status: 409 as const,
      body: {
        success: false,
        message: "La synchronisation est déjà en cours.",
      },
    };
  }

  await setSyncing(true);
  try {
    const [state, sectorMap, scraped] = await Promise.all([
      getState(),
      fetchBRVMSectors().catch(async () => getSectorMap()),
      scrapeSikaQuotes(),
    ]);

    await saveSectorMap(sectorMap);

    if (scraped.length === 0) {
      throw new Error("Aucune cotation n'a pu être extraite de Sika Finance.");
    }

    const stocks = mergeScrapedQuotes(state.stocks, scraped, sectorMap);
    const lastSync = new Date().toISOString();
    await saveState({ stocks, lastSync });

    return {
      status: 200 as const,
      body: {
        success: true,
        message: "Synchronisation des cotations terminée.",
        stocks,
        lastSync,
        isSyncing: false,
        brvm30Url: brvm30Url(),
      },
    };
  } catch (error) {
    return {
      status: 500 as const,
      body: {
        success: false,
        message: `La synchronisation a échoué: ${(error as Error).message}`,
      },
    };
  } finally {
    await setSyncing(false);
  }
}

export async function syncDividendsForSymbol(symbol: string) {
  const state = await getState();
  const sectorMap = await getSectorMap();
  const stockIndex = state.stocks.findIndex(
    (s) => s.symbol.toUpperCase() === symbol.toUpperCase()
  );
  if (stockIndex === -1) {
    return {
      status: 404 as const,
      body: { success: false, message: "Action non trouvée." },
    };
  }

  const stock = state.stocks[stockIndex];
  try {
    const dividends = await scrapeStockDividends(stock.symbol, stock.country);
    const updatedStock = processStockDividends(
      { ...stock, dividends, source: "scraped" },
      sectorMap
    );
    const stocks = [...state.stocks];
    stocks[stockIndex] = updatedStock;
    await saveState({ stocks, lastSync: state.lastSync });
    return {
      status: 200 as const,
      body: {
        success: true,
        message: `Historique des dividendes de ${stock.symbol} mis à jour avec succès !`,
        stock: updatedStock,
      },
    };
  } catch (error) {
    return {
      status: 500 as const,
      body: {
        success: false,
        message: `La synchronisation des dividendes a échoué: ${(error as Error).message}`,
      },
    };
  }
}

export async function syncDividendsBatch(batchSize = 2) {
  const state = await getState();
  if (state.stocks.length === 0) {
    return { success: true, updated: [] as string[], cursor: 0 };
  }
  const start = (await getDivCursor()) % state.stocks.length;
  const updated: string[] = [];
  const stocks = [...state.stocks];
  const sectorMap = await getSectorMap();

  for (let i = 0; i < batchSize; i++) {
    const index = (start + i) % stocks.length;
    const stock = stocks[index];
    try {
      const dividends = await scrapeStockDividends(stock.symbol, stock.country);
      stocks[index] = processStockDividends(
        { ...stock, dividends, source: "scraped" },
        sectorMap
      );
      updated.push(stock.symbol);
    } catch (error) {
      console.error(`Dividend batch sync failed for ${stock.symbol}:`, error);
    }
  }

  await saveState({ stocks, lastSync: state.lastSync });
  await setDivCursor((start + batchSize) % state.stocks.length);
  return { success: true, updated, cursor: (start + batchSize) % state.stocks.length };
}

export async function companyDescription(symbol: string, country: string) {
  const targetSymbol = symbol.toUpperCase();
  const targetCountry = country.toLowerCase();
  const cacheKey = `${targetSymbol}.${targetCountry}`;

  const cached = await getDescription(cacheKey);
  if (cached) {
    return {
      success: true,
      description: cached,
      source: "cache",
    };
  }

  const state = await getState();
  const stock = state.stocks.find((s: StockData) => s.symbol.toUpperCase() === targetSymbol);
  const companyName = stock ? stock.name : targetSymbol;

  let finalDescription = "";
  let source = "fallback";
  try {
    const generated = await generateCompanyDescription(companyName, targetSymbol, targetCountry);
    if (generated) {
      finalDescription = generated;
      source = "ai-generation";
    }
  } catch (error) {
    console.error(`Gemini description generation failed for ${targetSymbol}:`, error);
  }

  if (!finalDescription) {
    finalDescription = `Aucune description détaillée n'est actuellement disponible en ligne pour l'entreprise ${companyName} (${targetSymbol}). Il s'agit d'une entreprise majeure cotée à la BRVM représentant le secteur d'activité lié à son profil d'activité d'origine.`;
  }

  await saveDescription(cacheKey, finalDescription);
  return {
    success: true,
    description: finalDescription,
    source,
  };
}
