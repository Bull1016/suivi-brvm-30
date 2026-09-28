import {
  BRVM_30_SECTOR_NAMES,
  BRVM_30_SIZE,
  BRVM_COUNTRY_CODES,
  DEFAULT_SYMBOL_SECTOR_MAP,
  REPOSITORY_COMPOSITION_VERSION,
  SYMBOL_ALIASES,
} from "./constants.js";
import { extractCompositionFromAvis } from "./gemini.js";
import { normalizeCountryCode, processStockDividends } from "./process.js";
import { getState, saveState, updateCompositionControl } from "./store.js";
import type { CompositionControlUpdate } from "./store.js";
import { SCRAPE_HEADERS } from "./types.js";
import type { BrvmState, CompositionEntry, PendingComposition, StockData } from "./types.js";

/** Delay applied between two analysis attempts for the same avis URL. */
export const DEFAULT_COMPOSITION_RETRY_DELAY_SECONDS = 3600;

/** A composition avis is a few hundred kilobytes; anything larger is not a PDF of the expected kind. */
const MAX_AVIS_BYTES = 20 * 1024 * 1024;

/** Returns the official composition avis URL monitored by the application. */
export function getCompositionAvisUrl(): string {
  return (process.env.BRVM_30_AVIS_URL || "").trim();
}

/** Returns the retry delay between two failed attempts for the same URL (default 3600 s). */
export function getCompositionRetryDelaySeconds(): number {
  const raw = Number(process.env.COMPOSITION_RETRY_DELAY_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_COMPOSITION_RETRY_DELAY_SECONDS;
}

export interface CompositionValidationResult {
  valid: boolean;
  errors: string[];
  avis: string;
  date: string;
  entries: CompositionEntry[];
}

/**
 * Mechanically validates a composition extracted from an official avis.
 * An extracted composition is never applied unless this check passes.
 */
export function validateCompositionPayload(payload: unknown): CompositionValidationResult {
  const errors: string[] = [];
  const record = (payload ?? {}) as Record<string, unknown>;

  const avis = typeof record.avis === "string" ? record.avis.trim() : "";
  if (!/^\d{1,4}-\d{4}$/.test(avis)) {
    errors.push(`Numéro d'avis illisible ("${avis}").`);
  }

  const date = typeof record.date === "string" ? record.date.trim() : "";
  if (!date || Number.isNaN(Date.parse(date))) {
    errors.push(`Date d'avis illisible ("${date}").`);
  }

  const rawStocks = Array.isArray(record.stocks) ? (record.stocks as unknown[]) : [];
  if (rawStocks.length !== BRVM_30_SIZE) {
    errors.push(
      `La composition doit contenir exactement ${BRVM_30_SIZE} titres (reçu ${rawStocks.length}).`
    );
  }

  const entries: CompositionEntry[] = [];
  const seen = new Set<string>();

  rawStocks.forEach((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const symbol = typeof item.symbol === "string" ? item.symbol.trim().toUpperCase() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const country = normalizeCountryCode(item.country);
    const sector = typeof item.sector === "string" ? item.sector.trim() : "";

    if (!/^[A-Z0-9]{2,10}$/.test(symbol)) {
      errors.push(`Entrée ${index + 1} : symbole invalide ("${symbol}").`);
      return;
    }
    if (seen.has(symbol)) {
      errors.push(`Symbole dupliqué dans la composition extraite : ${symbol}.`);
      return;
    }
    seen.add(symbol);

    if (!name) errors.push(`${symbol} : nom manquant.`);
    if (!BRVM_COUNTRY_CODES.includes(country)) {
      errors.push(`${symbol} : pays non reconnu ("${String(item.country ?? "")}").`);
    }
    if (!BRVM_30_SECTOR_NAMES.includes(sector)) {
      errors.push(`${symbol} : secteur inconnu ("${sector}").`);
    }

    entries.push({ symbol, name, country, sector });
  });

  return { valid: errors.length === 0, errors, avis, date, entries };
}

/** Downloads an avis so a broken link is detected before spending a model call. */
export async function downloadAvisPdf(url: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(url, { headers: SCRAPE_HEADERS, signal: controller.signal });
  clearTimeout(timeoutId);
  if (!response.ok) {
    throw new Error(`Téléchargement de l'avis impossible (HTTP ${response.status}).`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_AVIS_BYTES) {
    throw new Error(`Document d'avis trop volumineux (${contentLength} octets).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("Document d'avis vide.");
  }
  if (buffer.byteLength > MAX_AVIS_BYTES) {
    throw new Error(`Document d'avis trop volumineux (${buffer.byteLength} octets).`);
  }
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error("Le document téléchargé n'est pas un PDF.");
  }
}

export interface CompositionWatchDeps {
  getState?: () => Promise<BrvmState>;
  saveState?: (state: BrvmState) => Promise<void>;
  updateControl?: (update: CompositionControlUpdate) => Promise<BrvmState>;
  downloadAvisPdf?: (url: string) => Promise<void>;
  extractComposition?: (url: string) => Promise<unknown>;
  now?: () => Date;
  createId?: (url: string, at: Date) => string;
}

/** Builds a stable, URL-scoped identifier for a candidate composition. */
export function buildCandidateId(url: string, at: Date): string {
  const slug = url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);
  return `${at.toISOString().slice(0, 10)}-${slug}`;
}

/** Returns the elapsed seconds since a stored ISO timestamp, or null when unusable. */
function elapsedSecondsSince(timestamp: string | undefined, now: Date): number | null {
  if (!timestamp) return null;
  const parsed = new Date(timestamp).getTime();
  if (Number.isNaN(parsed)) return null;
  return (now.getTime() - parsed) / 1000;
}

/**
 * Detects whether the configured avis URL changed and, if so, extracts a candidate composition.
 *
 * Never touches the served stocks, `compositionVersion` or `lastAnalyzedAvisUrl`: the candidate
 * stays isolated until an explicit, authenticated confirmation. Any failure is logged and leaves
 * the active composition untouched so quotation synchronization can continue.
 */
export async function checkCompositionUpdate(
  deps: CompositionWatchDeps = {}
): Promise<PendingComposition | null> {
  const url = getCompositionAvisUrl();
  if (!url) return null;

  const readState = deps.getState ?? getState;
  const writeControl = deps.updateControl ?? updateCompositionControl;
  const download = deps.downloadAvisPdf ?? downloadAvisPdf;
  const extract = deps.extractComposition ?? extractCompositionFromAvis;
  const now = deps.now ?? (() => new Date());

  const state = await readState();

  // 1-2. The URL was already confirmed: nothing to analyse, no model cost.
  if (state.lastAnalyzedAvisUrl === url) return null;

  // 3. Already analysed and found identical to the active composition.
  if (state.lastUnchangedAvisUrl === url) return null;

  // 4. A candidate for this URL is already waiting: reuse it without re-running the model.
  if (state.pendingComposition?.url === url) return state.pendingComposition;

  // 5. Same URL analysed recently: respect the retry delay.
  if (state.lastCompositionCheckUrl === url) {
    const elapsed = elapsedSecondsSince(state.lastCompositionCheckAt, now());
    if (elapsed !== null && elapsed < getCompositionRetryDelaySeconds()) return null;
  }

  // Persist the attempt before downloading so an early crash cannot loop on the same URL.
  const attemptedAt = now();
  await writeControl({
    lastCompositionCheckUrl: url,
    lastCompositionCheckAt: attemptedAt.toISOString(),
  });

  try {
    await download(url);
    const payload = await extract(url);
    const validation = validateCompositionPayload(payload);

    if (!validation.valid) {
      console.error(`Composition extraite rejetée (${url}) : ${validation.errors.join(" | ")}`);
      await writeControl({ lastCompositionCheckUrl: url, lastCompositionCheckAt: now().toISOString() });
      return null;
    }

    const activeVersion = state.compositionVersion || REPOSITORY_COMPOSITION_VERSION;
    if (validation.avis === activeVersion) {
      // The avis describes the composition already served: nothing to confirm.
      await writeControl({
        lastUnchangedAvisUrl: url,
        lastCompositionCheckUrl: url,
        lastCompositionCheckAt: now().toISOString(),
      });
      return null;
    }

    const candidate: PendingComposition = {
      id: (deps.createId ?? buildCandidateId)(url, attemptedAt),
      url,
      avis: validation.avis,
      date: validation.date,
      // No object storage is configured, so the source PDF URL is the archived reference.
      archivedPdfUrl: url,
      stocks: validation.entries,
    };

    await writeControl({ pendingComposition: candidate });
    return candidate;
  } catch (error) {
    console.error(`Analyse de la composition impossible (${url}) :`, error);
    await writeControl({ lastCompositionCheckUrl: url, lastCompositionCheckAt: now().toISOString() });
    return null;
  }
}

export interface CompositionConfirmationResult {
  status: 200 | 400 | 404 | 409 | 422;
  body: {
    success: boolean;
    message: string;
    stocks?: StockData[];
    compositionVersion?: string;
    avis?: string;
  };
}

/**
 * Rebuilds the served stock list from a confirmed composition.
 * Existing tickers keep their market data; new tickers are added as `pending`
 * so no price or dividend is ever invented (see R-01).
 */
export function mergeCompositionEntries(
  activeStocks: StockData[],
  entries: CompositionEntry[]
): StockData[] {
  const existingBySymbol = new Map<string, StockData>();
  for (const stock of activeStocks) {
    const raw = (stock.symbol || "").toUpperCase();
    existingBySymbol.set(SYMBOL_ALIASES[raw] ?? raw, stock);
  }

  return entries.map((entry) => {
    const sectorMap = { ...DEFAULT_SYMBOL_SECTOR_MAP, [entry.symbol]: entry.sector };
    const existing = existingBySymbol.get(entry.symbol);

    if (existing) {
      return processStockDividends(
        {
          ...existing,
          name: entry.name || existing.name,
          country: entry.country,
          sector: entry.sector,
          source: existing.source,
        },
        sectorMap
      );
    }

    return processStockDividends(
      {
        name: entry.name || entry.symbol,
        symbol: entry.symbol,
        country: entry.country,
        currentPrice: 0,
        high: 0,
        low: 0,
        variation: 0,
        dividends: [],
        sector: entry.sector,
        source: "pending",
      },
      sectorMap
    );
  });
}

/**
 * Activates a pending composition candidate after an explicit, authenticated decision.
 * Rejects unknown or stale identifiers and keeps the active state on any failure.
 */
export async function confirmCompositionUpdate(
  id: string,
  deps: CompositionWatchDeps = {}
): Promise<CompositionConfirmationResult> {
  if (!id || typeof id !== "string") {
    return { status: 400, body: { success: false, message: "Identifiant de composition manquant." } };
  }

  const readState = deps.getState ?? getState;
  const writeState = deps.saveState ?? saveState;
  const state = await readState();
  const candidate = state.pendingComposition;

  if (!candidate) {
    return {
      status: 404,
      body: { success: false, message: "Aucune composition n'est en attente de confirmation." },
    };
  }

  if (candidate.id !== id) {
    return {
      status: 409,
      body: {
        success: false,
        message:
          "Cette composition a été remplacée par une version plus récente. Rechargez les données.",
      },
    };
  }

  const validation = validateCompositionPayload(candidate);
  if (!validation.valid) {
    return {
      status: 422,
      body: {
        success: false,
        message: `Composition candidate invalide : ${validation.errors.join(" ")}`,
      },
    };
  }

  const stocks = mergeCompositionEntries(state.stocks, validation.entries);
  const next: BrvmState = {
    ...state,
    stocks,
    compositionVersion: validation.avis,
    lastAnalyzedAvisUrl: candidate.url,
  };
  delete next.pendingComposition;
  delete next.lastUnchangedAvisUrl;

  await writeState(next);

  return {
    status: 200,
    body: {
      success: true,
      message: `Composition ${validation.avis} activée.`,
      stocks,
      compositionVersion: validation.avis,
      avis: validation.avis,
    },
  };
}

