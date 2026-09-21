import { DEFAULT_BRVM30_PDF } from "./types.js";
import { processStockDividends } from "./process.js";
import {
  fetchBRVMSectors,
  mergeScrapedQuotes,
  scrapeSikaQuotes,
  scrapeStockDividends,
} from "./scrape.js";
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
} from "./store.js";
import { generateCompanyDescription, analyzeBulletinWithGemini } from "./gemini.js";
import { scrapeOfficialBulletins, validateBulletinUrlForDateCode } from "./bulletins.js";
import { getBulletinAnalysis, saveBulletinAnalysis } from "./store.js";
import { checkRateLimit } from "./http.js";
import type { StockData } from "./types.js";

/** Returns the configured BRVM 30 composition document URL. */
function brvm30Url() {
  return process.env.BRVM_30_URL || DEFAULT_BRVM30_PDF;
}

/** Returns stocks together with their synchronization status and metadata. */
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

/** Scrapes current quotations and persists the refreshed stock state. */
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

  const currentState = await getState();
  if (currentState.lastSync) {
    const elapsed = Date.now() - new Date(currentState.lastSync).getTime();
    if (!isNaN(elapsed) && elapsed < 2 * 60 * 1000) {
      const waitSeconds = Math.ceil((120000 - elapsed) / 1000);
      return {
        status: 429 as const,
        body: {
          success: false,
          message: `Veuillez patienter ${waitSeconds} seconde(s) avant la prochaine synchronisation.`,
          nextAllowedAt: new Date(new Date(currentState.lastSync).getTime() + 120000).toISOString(),
        },
      };
    }
  }

  await setSyncing(true);
  try {
    const [state, scraped] = await Promise.all([
      getState(),
      scrapeSikaQuotes(),
    ]);

    let sectorMap;
    try {
      sectorMap = await fetchBRVMSectors();
      await saveSectorMap(sectorMap);
    } catch (e) {
      console.error("Failed to fetch sectors, using cached map:", e);
      sectorMap = await getSectorMap();
    }

    if (scraped.length === 0) {
      throw new Error("Aucune cotation n'a pu être extraite de Sika Finance.");
    }

    const stocks = mergeScrapedQuotes(state.stocks, scraped, sectorMap);
    const scrapedCount = stocks.filter((s) => s.source === "scraped").length;
    const minRequired = Math.ceil(stocks.length * 0.9); // At least 90% (27/30)

    if (scrapedCount < minRequired) {
      throw new Error(`Moins de ${minRequired} titres appariés (${scrapedCount}/${stocks.length}). Synchronisation annulée.`);
    }

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

/** Refreshes and persists dividend history for one stock symbol. */
export async function syncDividendsForSymbol(symbol: string, callerIp?: string) {
  if (callerIp) {
    const allowed = await checkRateLimit(`divs:${callerIp}`);
    if (!allowed) {
      return {
        status: 429 as const,
        body: { success: false, message: "Trop de requêtes. Veuillez patienter une minute." },
      };
    }
  }

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

/** Refreshes a cursor-based batch of stock dividend histories. */
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

/** Returns a cached, AI-generated, or fallback company description. Checks rate limit ONLY on cache miss. */
export async function companyDescription(symbol: string, country: string, callerIp?: string) {
  const targetSymbol = symbol.toUpperCase();
  const targetCountry = country.toLowerCase();

  const state = await getState();
  const stock = state.stocks.find(
    (s: StockData) => s.symbol.toUpperCase() === targetSymbol && s.country.toLowerCase() === targetCountry
  );

  if (!stock) {
    return {
      status: 404 as const,
      body: {
        success: false,
        message: "Action ou pays non trouvé dans l'indice BRVM 30.",
      },
    };
  }

  const cacheKey = `${targetSymbol}.${targetCountry}`;
  const cached = await getDescription(cacheKey);
  if (cached) {
    return {
      status: 200 as const,
      body: {
        success: true,
        description: cached,
        source: "cache",
      },
    };
  }

  // Rate limit checked only on cache miss before calling Gemini AI
  if (callerIp) {
    const allowed = await checkRateLimit(`desc:${callerIp}`);
    if (!allowed) {
      return {
        status: 429 as const,
        body: { success: false, message: "Trop de requêtes. Veuillez patienter une minute." },
      };
    }
  }

  let finalDescription = "";
  let source = "fallback";
  try {
    const generated = await generateCompanyDescription(stock.name, targetSymbol, targetCountry);
    if (generated) {
      finalDescription = generated;
      source = "ai-generation";
    }
  } catch (error) {
    console.error(`Gemini description generation failed for ${targetSymbol}:`, error);
  }

  if (!finalDescription) {
    finalDescription = `Aucune description détaillée n'est actuellement disponible en ligne pour l'entreprise ${stock.name} (${targetSymbol}). Il s'agit d'une entreprise majeure cotée à la BRVM représentant le secteur ${stock.sector}.`;
  } else {
    await saveDescription(cacheKey, finalDescription);
  }
  return {
    status: 200 as const,
    body: {
      success: true,
      description: finalDescription,
      source,
    },
  };
}

/** Evaluates and returns analysis for an official BRVM bulletin. Checks rate limit ONLY on cache miss. */
export async function analyzeBulletin(dateCode: string, url: string, callerIp?: string) {
  if (!dateCode || !url) {
    return {
      status: 400 as const,
      body: { success: false, message: "Date ou URL du bulletin manquante." },
    };
  }

  const cached = await getBulletinAnalysis(dateCode);
  if (cached) {
    return {
      status: 200 as const,
      body: {
        success: true,
        analysis: cached.analysis,
        sources: cached.sources,
        source: "cache",
      },
    };
  }

  if (!validateBulletinUrlForDateCode(url, dateCode)) {
    return {
      status: 400 as const,
      body: { success: false, message: "L'URL fournie ne correspond pas à la date du bulletin." },
    };
  }

  // Validate URL is in official scraped bulletins
  try {
    const officialBulletins = await scrapeOfficialBulletins();
    const normalizedUrl = new URL(url).href;
    const isOfficial = officialBulletins.some(
      (b) => b.dateCode === dateCode && new URL(b.url).href === normalizedUrl
    );
    if (!isOfficial) {
      return {
        status: 400 as const,
        body: { success: false, message: "L'URL spécifiée ne fait pas partie des bulletins officiels scannés." },
      };
    }
  } catch (e) {
    console.error("Could not verify official bulletin list:", e);
    return {
      status: 503 as const,
      body: { success: false, message: "Impossible de vérifier la liste des bulletins officiels." },
    };
  }

  // Rate limit checked only on cache miss before calling Gemini AI
  if (callerIp) {
    const allowed = await checkRateLimit(`boc:${callerIp}`);
    if (!allowed) {
      return {
        status: 429 as const,
        body: { success: false, message: "Trop de requêtes. Veuillez patienter une minute." },
      };
    }
  }

  const result = await analyzeBulletinWithGemini(dateCode, url);
  await saveBulletinAnalysis(dateCode, result);
  return {
    status: 200 as const,
    body: {
      success: true,
      analysis: result.analysis,
      sources: result.sources,
    },
  };
}
