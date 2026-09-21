import { describe, it, expect } from "vitest";
import { normalizeCountryCode, processStockDividends } from "../lib/brvm/process";
import { parseDividendsFromHtml, mergeScrapedQuotes } from "../lib/brvm/scrape";
import { validateBulletinUrlForDateCode } from "../lib/brvm/bulletins";
import { DEFAULT_BRVM_30_STOCKS, DEFAULT_SYMBOL_SECTOR_MAP, BRVM_30_COMPOSITION } from "../lib/brvm/constants";
import { reconcileState } from "../lib/brvm/store";
import { checkRateLimit } from "../lib/brvm/http";
import stocksCache from "../data/stocks_cache.json";

describe("BRVM Unit Tests", () => {
  it("Conformity to official BRVM 30 composition (Avis n°191-2026)", () => {
    expect(BRVM_30_COMPOSITION.avis).toBe("191-2026");
    expect(BRVM_30_COMPOSITION.stocks.length).toBe(30);

    const compositionSymbols = BRVM_30_COMPOSITION.stocks.map((s) => s.symbol).sort();
    const seedSymbols = DEFAULT_BRVM_30_STOCKS.map((s) => s.symbol).sort();
    const cacheSymbols = stocksCache.stocks.map((s) => s.symbol).sort();

    expect(seedSymbols).toEqual(compositionSymbols);
    expect(cacheSymbols).toEqual(compositionSymbols);

    // Verify all 30 composition symbols have defined sectors
    for (const sym of compositionSymbols) {
      expect(DEFAULT_SYMBOL_SECTOR_MAP[sym]).toBeDefined();
    }
  });

  it("processStockDividends handles all status categories: a_jour, en_attente, interrompu, aucun", () => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1; // e.g. 2025

    // Case 1: a_jour
    const stockAJour = processStockDividends({
      name: "Stock A",
      symbol: "STKA",
      country: "ci",
      currentPrice: 1000,
      high: 1050,
      low: 950,
      variation: 1.0,
      dividends: [
        { year: lastYear, amount: 100, paid: true },
        { year: lastYear - 1, amount: 90, paid: true },
        { year: lastYear - 2, amount: 80, paid: true },
        { year: lastYear - 3, amount: 70, paid: true },
        { year: lastYear - 4, amount: 60, paid: true },
      ],
    });
    expect(stockAJour.dividendStatus).toBe("a_jour");
    expect(stockAJour.streak).toBe(5);
    expect(stockAJour.latestDividend).toBe(100);

    // Case 2: en_attente (lastYear dividend missing/unpaid, but previous years paid)
    const stockEnAttente = processStockDividends({
      name: "Stock B",
      symbol: "STKB",
      country: "ci",
      currentPrice: 1000,
      high: 1050,
      low: 950,
      variation: 0,
      dividends: [
        { year: lastYear, amount: 0, paid: false },
        { year: lastYear - 1, amount: 90, paid: true },
        { year: lastYear - 2, amount: 80, paid: true },
        { year: lastYear - 3, amount: 70, paid: true },
      ],
    });
    expect(stockEnAttente.dividendStatus).toBe("en_attente");
    expect(stockEnAttente.streak).toBe(3);
    expect(stockEnAttente.latestDividend).toBe(90);

    // Case 3: interrompu (past paid dividends, broken streak)
    const stockInterrompu = processStockDividends({
      name: "Stock C",
      symbol: "STKC",
      country: "ci",
      currentPrice: 1000,
      high: 1050,
      low: 950,
      variation: 0,
      dividends: [
        { year: lastYear, amount: 0, paid: false },
        { year: lastYear - 1, amount: 0, paid: false },
        { year: lastYear - 2, amount: 80, paid: true },
      ],
    });
    expect(stockInterrompu.dividendStatus).toBe("interrompu");
    expect(stockInterrompu.streak).toBe(0);

    // Case 4: aucun
    const stockAucun = processStockDividends({
      name: "Stock D",
      symbol: "STKD",
      country: "ci",
      currentPrice: 1000,
      high: 1050,
      low: 950,
      variation: 0,
      dividends: [],
    });
    expect(stockAucun.dividendStatus).toBe("aucun");
    expect(stockAucun.streak).toBe(0);
  });

  it("reconcileState converts legacy Redis state and symbols seamlessly", () => {
    const legacyState = {
      stocks: [
        {
          name: "Coris Bank",
          symbol: "CBIB", // Legacy symbol without F
          country: "bf",
          currentPrice: 9500,
          high: 9600,
          low: 9400,
          variation: 1.0,
          dividends: [{ year: 2024, amount: 800, paid: true }],
          streak: 1,
          latestDividend: 800,
          lastUpdated: "2025-01-01T00:00:00.000Z",
          source: "scraped" as const,
          sector: "Services Financiers",
        },
        {
          name: "Non BRVM 30 Stock",
          symbol: "ABJC", // Symbol no longer in BRVM 30
          country: "ci",
          currentPrice: 500,
          high: 500,
          low: 500,
          variation: 0,
          dividends: [],
          streak: 0,
          latestDividend: 0,
          lastUpdated: "2025-01-01T00:00:00.000Z",
          source: "scraped" as const,
          sector: "Industriels",
        },
      ],
      lastSync: "2025-01-01T00:00:00.000Z",
    };

    const reconciled = reconcileState(legacyState);
    expect(reconciled.compositionVersion).toBe("191-2026");
    expect(reconciled.stocks.length).toBe(30);

    // CBIB converted to CBIBF and preserved existing price
    const cbibf = reconciled.stocks.find((s) => s.symbol === "CBIBF");
    expect(cbibf).toBeDefined();
    expect(cbibf?.currentPrice).toBe(9500);

    // ABJC removed from state
    const abjc = reconciled.stocks.find((s) => s.symbol === "ABJC");
    expect(abjc).toBeUndefined();
  });

  it("normalizes invalid country values to the globe fallback code", () => {
    expect(normalizeCountryCode("ci")).toBe("ci");
    expect(normalizeCountryCode("CIV")).toBe("xx");
    expect(normalizeCountryCode(null)).toBe("xx");
    expect(normalizeCountryCode(undefined)).toBe("xx");
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

  it("checkRateLimit isolates keys and enforces thresholds", async () => {
    const testKey1 = "test-rate-key-1";
    const testKey2 = "test-rate-key-2";

    // Key 1: 10 calls allowed
    for (let i = 0; i < 10; i++) {
      expect(await checkRateLimit(testKey1, 10)).toBe(true);
    }
    // 11th call denied
    expect(await checkRateLimit(testKey1, 10)).toBe(false);

    // Key 2 is independent and still allowed
    expect(await checkRateLimit(testKey2, 10)).toBe(true);
  });

  it("mergeScrapedQuotes updates matching stock quotes accurately", () => {
    const seed = DEFAULT_BRVM_30_STOCKS.map((s) => processStockDividends(s));
    const scraped = [
      {
        symbol: "SNTS",
        name: "Sonatel Sénégal",
        country: "sn",
        currentPrice: 32000,
        high: 32500,
        low: 31800,
        variation: 2.5,
      },
    ];

    const merged = mergeScrapedQuotes(seed, scraped, DEFAULT_SYMBOL_SECTOR_MAP);
    const snts = merged.find((s) => s.symbol === "SNTS");

    expect(snts?.currentPrice).toBe(32000);
    expect(snts?.source).toBe("scraped");
  });
});
