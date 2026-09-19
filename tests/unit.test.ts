import { describe, it, expect } from "vitest";
import { processStockDividends } from "../lib/brvm/process";
import { parseDividendsFromHtml } from "../lib/brvm/scrape";
import { validateBulletinUrlForDateCode } from "../lib/brvm/bulletins";
import { DEFAULT_BRVM_30_STOCKS, DEFAULT_SYMBOL_SECTOR_MAP } from "../lib/brvm/constants";
import stocksCache from "../data/stocks_cache.json";

describe("BRVM Unit Tests", () => {
  it("processStockDividends calculates streak and status correctly", () => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const sampleStock = {
      name: "Test Stock",
      symbol: "TEST",
      country: "ci",
      currentPrice: 1000,
      high: 1050,
      low: 950,
      variation: 1.5,
      dividends: [
        { year: lastYear, amount: 100, paid: true },
        { year: lastYear - 1, amount: 90, paid: true },
        { year: lastYear - 2, amount: 80, paid: true },
        { year: lastYear - 3, amount: 70, paid: true },
        { year: lastYear - 4, amount: 60, paid: true },
      ],
    };

    const processed = processStockDividends(sampleStock);
    expect(processed.streak).toBe(5);
    expect(processed.latestDividend).toBe(100);
    expect(processed.dividendStatus).toBe("a_jour");
  });

  it("parseDividendsFromHtml parses valid HTML tables correctly", () => {
    const sampleHtml = `
      <table>
        <thead><tr><th>Année</th><th>Montant</th><th>Rendement</th></tr></thead>
        <tbody>
          <tr><td>2024</td><td>150,00</td><td>5%</td></tr>
          <tr><td>2023</td><td>120,00</td><td>4%</td></tr>
        </tbody>
      </table>
    `;

    const dividends = parseDividendsFromHtml(sampleHtml);
    expect(dividends.length).toBe(2);
    expect(dividends[0]).toEqual({ year: 2024, amount: 150, paid: true });
    expect(dividends[1]).toEqual({ year: 2023, amount: 120, paid: true });
  });

  it("validateBulletinUrlForDateCode validates official bulletin URLs", () => {
    const dateCode = "20260728";
    const validUrl = "https://www.brvm.org/sites/default/files/bulletins/boc_20260728.pdf";
    const invalidUrl = "https://www.fake-site.com/boc_20260728.pdf";

    expect(validateBulletinUrlForDateCode(validUrl, dateCode)).toBe(true);
    expect(validateBulletinUrlForDateCode(invalidUrl, dateCode)).toBe(false);
  });

  it("Seed BRVM 30 stocks match sector map and cache consistency", () => {
    expect(DEFAULT_BRVM_30_STOCKS.length).toBe(30);

    const seedSymbols = DEFAULT_BRVM_30_STOCKS.map((s) => s.symbol);
    const cacheSymbols = stocksCache.stocks.map((s) => s.symbol);

    // Verify all seed symbols are mapped in sector map
    for (const symbol of seedSymbols) {
      expect(DEFAULT_SYMBOL_SECTOR_MAP[symbol]).toBeDefined();
    }

    // Verify seed and cache symbol parity
    expect(seedSymbols.sort()).toEqual(cacheSymbols.sort());
  });
});
