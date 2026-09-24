import { DEFAULT_SYMBOL_SECTOR_MAP } from "./constants.js";
import type { DividendHistory, StockData, DividendStatus } from "./types.js";

const UNKNOWN_COUNTRY_CODE = "xx";

/** Keeps supported country values safe for persistence and rendering. */
export function normalizeCountryCode(country: unknown): string {
  return typeof country === "string" && /^[a-z]{2}$/.test(country)
    ? country
    : UNKNOWN_COUNTRY_CODE;
}

/** Derives sector, dividend streak, dividend status, latest dividend, and metadata for a stock. */
export function processStockDividends(
  stock: Omit<StockData, "streak" | "latestDividend" | "lastUpdated" | "source" | "sector" | "dividendStatus"> &
    Partial<Pick<StockData, "streak" | "latestDividend" | "lastUpdated" | "source" | "sector" | "dividendStatus">>,
  sectorMap: Record<string, string> = DEFAULT_SYMBOL_SECTOR_MAP
): StockData {
  const dividends: DividendHistory[] = stock.dividends ?? [];
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const startYear = lastYear - 4;

  let consecutiveYears = 0;
  for (let year = lastYear; year >= startYear; year--) {
    const dividend = dividends.find((d) => d.year === year);
    if (!dividend || !dividend.paid) {
      break;
    }
    consecutiveYears++;
  }

  let streakUpToPrevYear = 0;
  for (let year = lastYear - 1; year >= startYear; year--) {
    const dividend = dividends.find((d) => d.year === year);
    if (!dividend || !dividend.paid) break;
    streakUpToPrevYear++;
  }

  const lastYearDiv = dividends.find((d) => d.year === lastYear);
  const prevYearDiv = dividends.find((d) => d.year === lastYear - 1);

  let dividendStatus: DividendStatus = "aucun";
  const cutoffDate = new Date(`${lastYear + 1}-06-30T00:00:00.000Z`);
  const now = new Date();

  if (consecutiveYears > 0) {
    dividendStatus = "a_jour";
  } else if ((!lastYearDiv || !lastYearDiv.paid) && streakUpToPrevYear > 0) {
    if (now > cutoffDate) {
      dividendStatus = "interrompu";
      consecutiveYears = 0;
    } else {
      dividendStatus = "en_attente";
      consecutiveYears = streakUpToPrevYear;
    }
  } else if (dividends.some((d) => d.paid)) {
    dividendStatus = "interrompu";
  } else {
    dividendStatus = "aucun";
  }

  const latestDividend =
    lastYearDiv && lastYearDiv.paid
      ? lastYearDiv.amount
      : prevYearDiv && prevYearDiv.paid
      ? prevYearDiv.amount
      : 0;

  const sector =
    stock.sector ||
    sectorMap[stock.symbol] ||
    DEFAULT_SYMBOL_SECTOR_MAP[stock.symbol] ||
    "Non classé";

  return {
    name: stock.name,
    symbol: stock.symbol,
    country: normalizeCountryCode(stock.country),
    currentPrice: stock.currentPrice,
    high: stock.high,
    low: stock.low,
    variation: stock.variation,
    dividends,
    sector,
    streak: consecutiveYears,
    dividendStatus,
    latestDividend,
    lastUpdated: new Date().toISOString(),
    source: stock.source === "pending" ? "pending" : stock.source || "fallback",
  };
}
