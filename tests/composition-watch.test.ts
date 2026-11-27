import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_COMPOSITION_RETRY_DELAY_SECONDS,
  buildCandidateId,
  checkCompositionUpdate,
  confirmCompositionUpdate,
  getCompositionAvisUrl,
  getCompositionRetryDelaySeconds,
  mergeCompositionEntries,
  validateCompositionPayload,
} from "../lib/brvm/composition-watch";
import type { CompositionControlUpdate } from "../lib/brvm/store";
import type { BrvmState, CompositionEntry, StockData } from "../lib/brvm/types";

const AVIS_URL = "https://www.brvm.org/sites/default/files/avis-192-2026.pdf";
const NEW_AVIS = "192-2026";
const NOW = new Date("2026-09-10T10:00:00.000Z");

/** Builds a 30-entry payload derived from the official composition, with one new symbol. */
function buildPayload(avis = NEW_AVIS, overrides: Partial<Record<string, string>> = {}) {
  const base = Array.from({ length: 30 }, (_, index) => {
    const symbol = index === 0 ? "ZZZZ" : `SYM${String(index).padStart(2, "0")}`;
    return { symbol, name: `Société ${symbol}`, country: "ci", sector: "Services Financiers" };
  });
  return { avis, date: "2026-10-01", stocks: base.map((s) => ({ ...s, ...overrides })) };
}

function buildStock(symbol: string, overrides: Partial<StockData> = {}): StockData {
  return {
    name: `Nom ${symbol}`,
    symbol,
    country: "ci",
    sector: "Services Financiers",
    currentPrice: 1234,
    high: 1300,
    low: 1200,
    variation: 1.5,
    dividends: [],
    streak: 0,
    latestDividend: 0,
    lastUpdated: "2026-09-01T00:00:00.000Z",
    source: "scraped",
    ...overrides,
  };
}

function buildState(overrides: Partial<BrvmState> = {}): BrvmState {
  return {
    stocks: [buildStock("SNTS"), buildStock("SGBC")],
    lastSync: "2026-09-01T00:00:00.000Z",
    compositionVersion: "191-2026",
    ...overrides,
  };
}

function buildPending(stocks?: CompositionEntry[]) {
  return {
    id: "candidate-42",
    url: AVIS_URL,
    avis: NEW_AVIS,
    date: "2026-10-01",
    archivedPdfUrl: AVIS_URL,
    stocks: stocks ?? (buildPayload().stocks as CompositionEntry[]),
  };
}

/** Builds isolated state/control harnesses so tests never touch Redis or module-level memory. */
function buildHarness(initial: BrvmState) {
  let state = initial;
  const saved: BrvmState[] = [];
  const controlUpdates: CompositionControlUpdate[] = [];

  return {
    saved,
    controlUpdates,
    deps: {
      getState: async () => state,
      saveState: async (next: BrvmState) => {
        state = next;
        saved.push(next);
      },
      updateControl: async (update: CompositionControlUpdate) => {
        controlUpdates.push(update);
        const next: BrvmState = { ...state };
        if (update.lastAnalyzedAvisUrl !== undefined) next.lastAnalyzedAvisUrl = update.lastAnalyzedAvisUrl;
        if (update.lastCompositionCheckUrl !== undefined) next.lastCompositionCheckUrl = update.lastCompositionCheckUrl;
        if (update.lastCompositionCheckAt !== undefined) next.lastCompositionCheckAt = update.lastCompositionCheckAt;
        if (update.lastUnchangedAvisUrl !== undefined) next.lastUnchangedAvisUrl = update.lastUnchangedAvisUrl;
        if (update.pendingComposition !== undefined) {
          if (update.pendingComposition === null) delete next.pendingComposition;
          else next.pendingComposition = update.pendingComposition;
        }
        state = next;
        return next;
      },
      now: () => NOW,
      downloadAvisPdf: vi.fn(async () => undefined),
      extractComposition: vi.fn(async () => buildPayload()),
    },
  };
}

describe("Composition watch (rapport, section 3.1-3.3)", () => {
  const originalUrl = process.env.BRVM_30_AVIS_URL;
  const originalDelay = process.env.COMPOSITION_RETRY_DELAY_SECONDS;

  beforeEach(() => {
    process.env.BRVM_30_AVIS_URL = AVIS_URL;
    delete process.env.COMPOSITION_RETRY_DELAY_SECONDS;
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.BRVM_30_AVIS_URL;
    else process.env.BRVM_30_AVIS_URL = originalUrl;
    if (originalDelay === undefined) delete process.env.COMPOSITION_RETRY_DELAY_SECONDS;
    else process.env.COMPOSITION_RETRY_DELAY_SECONDS = originalDelay;
    vi.restoreAllMocks();
  });

  it("reads its configuration from the environment with a 3600 s default", () => {
    expect(getCompositionAvisUrl()).toBe(AVIS_URL);
    expect(getCompositionRetryDelaySeconds()).toBe(DEFAULT_COMPOSITION_RETRY_DELAY_SECONDS);

    process.env.COMPOSITION_RETRY_DELAY_SECONDS = "60";
    expect(getCompositionRetryDelaySeconds()).toBe(60);

    process.env.COMPOSITION_RETRY_DELAY_SECONDS = "0";
    expect(getCompositionRetryDelaySeconds()).toBe(DEFAULT_COMPOSITION_RETRY_DELAY_SECONDS);

    process.env.COMPOSITION_RETRY_DELAY_SECONDS = "not-a-number";
    expect(getCompositionRetryDelaySeconds()).toBe(DEFAULT_COMPOSITION_RETRY_DELAY_SECONDS);
  });

  it("rejects malformed extractions instead of activating them", () => {
    const tooShort = validateCompositionPayload({ avis: NEW_AVIS, date: "2026-10-01", stocks: [] });
    expect(tooShort.valid).toBe(false);
    expect(tooShort.errors.some((e) => e.includes("exactement 30"))).toBe(true);

    const badFields = validateCompositionPayload({
      avis: NEW_AVIS,
      date: "2026-10-01",
      stocks: buildPayload().stocks.map((s, i) =>
        i === 0 ? { ...s, country: "fr", sector: "Informatique" } : s
      ),
    });
    expect(badFields.valid).toBe(false);
    expect(badFields.errors.some((e) => e.includes("pays non reconnu"))).toBe(true);
    expect(badFields.errors.some((e) => e.includes("secteur inconnu"))).toBe(true);

    const duplicated = validateCompositionPayload({
      avis: NEW_AVIS,
      date: "2026-10-01",
      stocks: buildPayload().stocks.map((s, i) => (i === 1 ? { ...s, symbol: "ZZZZ" } : s)),
    });
    expect(duplicated.valid).toBe(false);
    expect(duplicated.errors.some((e) => e.includes("Symbole dupliqué"))).toBe(true);

    const badAvis = validateCompositionPayload({ ...buildPayload(), avis: "avis 192" });
    expect(badAvis.valid).toBe(false);
    expect(badAvis.errors.some((e) => e.includes("avis illisible"))).toBe(true);

    const valid = validateCompositionPayload(buildPayload());
    expect(valid.valid).toBe(true);
    expect(valid.errors).toEqual([]);
    expect(valid.entries).toHaveLength(30);
    expect(valid.avis).toBe(NEW_AVIS);
  });

  it("does nothing when the avis URL is missing, unchanged or already confirmed", async () => {
    const withoutUrl = buildHarness(buildState());
    delete process.env.BRVM_30_AVIS_URL;
    expect(await checkCompositionUpdate(withoutUrl.deps)).toBeNull();
    expect(withoutUrl.deps.downloadAvisPdf).not.toHaveBeenCalled();

    process.env.BRVM_30_AVIS_URL = AVIS_URL;
    const confirmed = buildHarness(buildState({ lastAnalyzedAvisUrl: AVIS_URL }));
    expect(await checkCompositionUpdate(confirmed.deps)).toBeNull();
    expect(confirmed.deps.downloadAvisPdf).not.toHaveBeenCalled();

    const unchanged = buildHarness(buildState({ lastUnchangedAvisUrl: AVIS_URL }));
    expect(await checkCompositionUpdate(unchanged.deps)).toBeNull();
    expect(unchanged.deps.extractComposition).not.toHaveBeenCalled();
  });

  it("extracts and stores a candidate without touching the active composition", async () => {
    const harness = buildHarness(buildState());
    const candidate = await checkCompositionUpdate(harness.deps);

    expect(harness.deps.downloadAvisPdf).toHaveBeenCalledWith(AVIS_URL);
    expect(candidate?.avis).toBe(NEW_AVIS);
    expect(candidate?.url).toBe(AVIS_URL);
    expect(candidate?.archivedPdfUrl).toBe(AVIS_URL);
    expect(candidate?.stocks).toHaveLength(30);
    expect(candidate?.id).toBe(buildCandidateId(AVIS_URL, NOW));

    // The attempt is persisted before the download, the candidate only after validation.
    expect(harness.controlUpdates[0]).toEqual({
      lastCompositionCheckUrl: AVIS_URL,
      lastCompositionCheckAt: NOW.toISOString(),
    });
    expect(harness.controlUpdates.at(-1)?.pendingComposition?.avis).toBe(NEW_AVIS);
    // No stock write: the served composition stays untouched until confirmation.
    expect(harness.saved).toEqual([]);
  });

  it("reuses an existing candidate for the same URL without calling the model again", async () => {
    const pending = buildPending();
    const harness = buildHarness(buildState({ pendingComposition: pending }));

    const result = await checkCompositionUpdate(harness.deps);
    expect(result).toEqual(pending);
    expect(harness.deps.extractComposition).not.toHaveBeenCalled();
    expect(harness.controlUpdates).toEqual([]);
  });

  it("skips an analysis during the retry delay, then runs it once elapsed", async () => {
    process.env.COMPOSITION_RETRY_DELAY_SECONDS = "3600";

    const recent = buildHarness(
      buildState({
        lastCompositionCheckUrl: AVIS_URL,
        lastCompositionCheckAt: "2026-09-10T09:30:00.000Z",
      })
    );
    expect(await checkCompositionUpdate(recent.deps)).toBeNull();
    expect(recent.deps.downloadAvisPdf).not.toHaveBeenCalled();

    const expired = buildHarness(
      buildState({
        lastCompositionCheckUrl: AVIS_URL,
        lastCompositionCheckAt: "2026-09-10T08:00:00.000Z",
      })
    );
    expect(await checkCompositionUpdate(expired.deps)).not.toBeNull();
    expect(expired.deps.downloadAvisPdf).toHaveBeenCalledTimes(1);

    // A new URL is analysed immediately, whatever the previous attempt was.
    const otherUrl = buildHarness(
      buildState({
        lastCompositionCheckUrl: "https://www.brvm.org/sites/default/files/avis-191-2026.pdf",
        lastCompositionCheckAt: "2026-09-10T09:59:00.000Z",
      })
    );
    expect(await checkCompositionUpdate(otherUrl.deps)).not.toBeNull();
  });

  it("keeps the retry timestamp after a download, model or validation failure", async () => {
    const downloadFailure = buildHarness(buildState());
    downloadFailure.deps.downloadAvisPdf = vi.fn(async () => {
      throw new Error("HTTP 500");
    });
    expect(await checkCompositionUpdate(downloadFailure.deps)).toBeNull();
    expect(downloadFailure.deps.extractComposition).not.toHaveBeenCalled();
    expect(downloadFailure.controlUpdates).toHaveLength(2);
    expect(downloadFailure.controlUpdates[1].lastCompositionCheckUrl).toBe(AVIS_URL);

    const modelFailure = buildHarness(buildState());
    modelFailure.deps.extractComposition = vi.fn(async () => {
      throw new Error("GEMINI_API_KEY n'est pas configurée.");
    });
    expect(await checkCompositionUpdate(modelFailure.deps)).toBeNull();
    expect(modelFailure.controlUpdates.at(-1)?.lastCompositionCheckUrl).toBe(AVIS_URL);

    const invalidExtraction = buildHarness(buildState());
    invalidExtraction.deps.extractComposition = vi.fn(async () => ({
      avis: NEW_AVIS,
      date: "2026-10-01",
      stocks: [],
    }));
    expect(await checkCompositionUpdate(invalidExtraction.deps)).toBeNull();
    expect(invalidExtraction.controlUpdates.at(-1)?.lastCompositionCheckUrl).toBe(AVIS_URL);
    expect(invalidExtraction.controlUpdates.every((u) => u.pendingComposition === undefined)).toBe(true);
  });

  it("records an unchanged avis so the same URL is never sent to the model twice", async () => {
    const unchanged = buildHarness(buildState());
    unchanged.deps.extractComposition = vi.fn(async () => buildPayload("191-2026"));

    expect(await checkCompositionUpdate(unchanged.deps)).toBeNull();
    expect(unchanged.controlUpdates.at(-1)?.lastUnchangedAvisUrl).toBe(AVIS_URL);

    const next = buildHarness(buildState({ lastUnchangedAvisUrl: AVIS_URL }));
    expect(await checkCompositionUpdate(next.deps)).toBeNull();
    expect(next.deps.extractComposition).not.toHaveBeenCalled();
  });

  it("merges a confirmed composition without inventing market data", () => {
    const active = [
      buildStock("SNTS", { name: "Sonatel Sénégal", source: "scraped" }),
      buildStock("OUTD", { name: "Titre sortant" }),
    ];
    const entries: CompositionEntry[] = [
      { symbol: "SNTS", name: "Sonatel", country: "sn", sector: "Télécommunications" },
      { symbol: "NEWC", name: "Nouvelle Cote", country: "bf", sector: "Industriels" },
    ];

    const merged = mergeCompositionEntries(active, entries);
    expect(merged.map((s) => s.symbol)).toEqual(["SNTS", "NEWC"]);

    // Existing ticker: quote and dividend history are preserved, country/sector come from the avis.
    const kept = merged[0];
    expect(kept.source).toBe("scraped");
    expect(kept.currentPrice).toBe(1234);
    expect(kept.country).toBe("sn");
    expect(kept.sector).toBe("Télécommunications");

    // New ticker: no invented price, no invented dividend, clearly marked as pending.
    const added = merged[1];
    expect(added.source).toBe("pending");
    expect(added.currentPrice).toBe(0);
    expect(added.dividends).toEqual([]);
    expect(added.latestDividend).toBe(0);
    expect(added.sector).toBe("Industriels");
    expect(added.country).toBe("bf");
  });

  it("activates a candidate only for the matching id and keeps the active state otherwise", async () => {
    const candidate = buildPending([
      { symbol: "SNTS", name: "Sonatel", country: "sn", sector: "Télécommunications" },
      ...(buildPayload().stocks.slice(1) as CompositionEntry[]),
    ]);

    const empty = buildHarness(buildState());
    expect((await confirmCompositionUpdate("candidate-42", empty.deps)).status).toBe(404);
    expect((await confirmCompositionUpdate("", empty.deps)).status).toBe(400);

    const stale = buildHarness(buildState({ pendingComposition: candidate }));
    expect((await confirmCompositionUpdate("other-id", stale.deps)).status).toBe(409);
    expect(stale.saved).toEqual([]);

    const invalid = buildHarness(
      buildState({ pendingComposition: buildPending(candidate.stocks.slice(0, 3)) })
    );
    expect((await confirmCompositionUpdate("candidate-42", invalid.deps)).status).toBe(422);
    expect(invalid.saved).toEqual([]);

    const harness = buildHarness(buildState({ pendingComposition: candidate }));
    const result = await confirmCompositionUpdate("candidate-42", harness.deps);
    expect(result.status).toBe(200);
    expect(harness.saved).toHaveLength(1);

    const saved = harness.saved[0];
    expect(saved.compositionVersion).toBe(NEW_AVIS);
    expect(saved.lastAnalyzedAvisUrl).toBe(AVIS_URL);
    expect(saved.pendingComposition).toBeUndefined();
    expect(saved.stocks).toHaveLength(30);
    expect(saved.stocks.find((s) => s.symbol === "SNTS")?.currentPrice).toBe(1234);
    expect(saved.stocks.find((s) => s.symbol === "SYM01")?.source).toBe("pending");
  });
});

