import { DEFAULT_SYMBOL_SECTOR_MAP } from "./constants.js";
import type { DividendHistory, StockData, DividendStatus } from "./types.js";

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

  const totalPaidYears = dividends.filter((d) => d.paid).length;
  let dividendStatus: DividendStatus = "aucun";
  if (consecutiveYears > 0) {
    dividendStatus = "a_jour";
  } else if (totalPaidYears > 0) {
    dividendStatus = "interrompu";
  } else {
    dividendStatus = "aucun";
  }

  const lastYearDiv = dividends.find((d) => d.year === lastYear);
  const latestDividend = lastYearDiv && lastYearDiv.paid ? lastYearDiv.amount : 0;
  const sector =
    stock.sector ||
    sectorMap[stock.symbol] ||
    DEFAULT_SYMBOL_SECTOR_MAP[stock.symbol] ||
    "Services Financiers";

  return {
    name: stock.name,
    symbol: stock.symbol,
    country: stock.country,
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
    source: stock.source || "fallback",
  };
}
