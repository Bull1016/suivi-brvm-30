import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { DEFAULT_BRVM_30_STOCKS, DEFAULT_SYMBOL_SECTOR_MAP } from "./constants.js";
import { normalizeCountryCode, processStockDividends } from "./process.js";
import type { BrvmState, StockData } from "./types.js";

const KEY_STATE = "brvm:state";
const KEY_SYNCING = "brvm:syncing";
const KEY_DESCRIPTIONS = "brvm:descriptions";
const KEY_SECTORS = "brvm:sectors";
const KEY_DIV_CURSOR = "brvm:div-cursor";
/** Builds the Redis key for a dated bulletin analysis. */
const KEY_BULLETIN = (dateCode: string) => `brvm:bulletin:${dateCode}`;

const SYNCING_TTL_SECONDS = 90;
const COMPOSITION_VERSION = "191-2026";

let memoryState: BrvmState | null = null;
let memoryDescriptions: Record<string, string> = {};
let memorySectors: Record<string, string> | null = null;
let memoryDivCursor = 0;
const memoryBulletins = new Map<string, { analysis: string; sources: { title: string; uri: string }[] }>();

let redisClient: Redis | null | undefined;

/** Ensures persisted stock country values remain safe for every consumer. */
function normalizeStateCountries(state: BrvmState): BrvmState {
  let changed = false;
  const stocks = state.stocks.map((stock) => {
    const country = normalizeCountryCode(stock.country);
    if (country === stock.country) return stock;
    changed = true;
    return { ...stock, country };
  });
  return changed ? { ...state, stocks } : state;
}

/** Returns the cached Redis client when persistence credentials are configured. */
function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    redisClient = new Redis({ url, token });
    return redisClient;
  }

  redisClient = null;
  return null;
}

/** Builds the initial stock collection from repository defaults. */
function seedStocksFromDefaults(): StockData[] {
  return DEFAULT_BRVM_30_STOCKS.map((s) => processStockDividends(s));
}

/** Reads and parses a JSON seed file from supported runtime locations. */
function readJsonFile<T>(relativePath: string): T | null {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), "..", relativePath),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
      }
    } catch (err) {
      console.error(`Failed to read ${filePath}:`, err);
    }
  }
  return null;
}

/** Loads the initial stock state from cache data or repository defaults. */
function loadSeedState(): BrvmState {
  const cached = readJsonFile<{ stocks?: StockData[]; lastSyncTime?: string; lastSync?: string; compositionVersion?: string }>(
    "data/stocks_cache.json"
  );
  if (cached?.stocks && Array.isArray(cached.stocks) && cached.stocks.length > 0) {
    const lastSyncTime = typeof cached.lastSyncTime === "string" ? cached.lastSyncTime.trim() : "";
    const legacyLastSync = typeof cached.lastSync === "string" ? cached.lastSync.trim() : "";
    return {
      stocks: cached.stocks.map((s) => processStockDividends(s)),
      lastSync: lastSyncTime || legacyLastSync,
      compositionVersion: cached.compositionVersion || COMPOSITION_VERSION,
    };
  }
  return {
    stocks: seedStocksFromDefaults(),
    lastSync: "",
    compositionVersion: COMPOSITION_VERSION,
  };
}

/** Reconciles a persisted state with the official BRVM 30 composition (Avis 191-2026). */
export function reconcileState(stored: BrvmState): BrvmState {
  const seedStocks = seedStocksFromDefaults();
  const seedMap = new Map(seedStocks.map((s) => [s.symbol, s]));

  const ALIASES: Record<string, string> = {
    CBIB: "CBIBF",
    ONTB: "ONTBF",
    SDVC: "SDSC",
  };

  const existingMap = new Map<string, StockData>();
  for (const stock of stored?.stocks || []) {
    let sym = (stock.symbol || "").toUpperCase();
    if (ALIASES[sym]) sym = ALIASES[sym];
    if (seedMap.has(sym)) {
      existingMap.set(sym, stock);
    }
  }

  const reconciledStocks: StockData[] = seedStocks.map((seed) => {
    const existing = existingMap.get(seed.symbol);
    if (!existing) return seed;

    const merged = {
      ...seed,
      ...existing,
      symbol: seed.symbol,
      name: seed.name,
      country: seed.country,
      sector: seed.sector || existing.sector,
      dividends: existing.dividends?.length ? existing.dividends : seed.dividends,
    };
    return processStockDividends(merged);
  });

  return {
    stocks: reconciledStocks,
    lastSync: stored?.lastSync || "",
    compositionVersion: COMPOSITION_VERSION,
  };
}

/** Loads repository-provided company descriptions for the in-memory cache. */
function loadSeedDescriptions(): Record<string, string> {
  return readJsonFile<Record<string, string>>("data/company_descriptions.json") ?? {};
}

/** Returns the persisted stock state, seeding or reconciling it when necessary. */
export async function getState(): Promise<BrvmState> {
  const redis = getRedis();
  if (redis) {
    const stored = await redis.get<BrvmState>(KEY_STATE);
    if (stored?.stocks?.length) {
      if (stored.compositionVersion !== COMPOSITION_VERSION || stored.stocks.length !== 30) {
        const reconciled = reconcileState(stored);
        await redis.set(KEY_STATE, reconciled);
        memoryState = reconciled;
        return reconciled;
      }
      const normalized = normalizeStateCountries(stored);
      if (normalized !== stored) await redis.set(KEY_STATE, normalized);
      memoryState = normalized;
      return normalized;
    }
    const seeded = loadSeedState();
    await redis.set(KEY_STATE, seeded);
    memoryState = seeded;
    return seeded;
  }

  if (!memoryState) {
    memoryState = loadSeedState();
  }
  if (memoryState.compositionVersion !== COMPOSITION_VERSION || memoryState.stocks.length !== 30) {
    memoryState = reconcileState(memoryState);
  }
  return memoryState;
}

/** Saves stock state to memory and the configured Redis store. */
export async function saveState(state: BrvmState): Promise<void> {
  const normalized = normalizeStateCountries({
    ...state,
    compositionVersion: COMPOSITION_VERSION,
  });
  memoryState = normalized;
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY_STATE, normalized);
  }
}

/** Reports whether a quotation synchronization lock is active. */
export async function isSyncing(): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const flag = await redis.get<string>(KEY_SYNCING);
    return flag === "1";
  }
  return false;
}

/** Creates or clears the quotation synchronization lock. */
export async function setSyncing(value: boolean): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  if (value) {
    await redis.set(KEY_SYNCING, "1", { ex: SYNCING_TTL_SECONDS });
  } else {
    await redis.del(KEY_SYNCING);
  }
}

/** Returns the persisted symbol-to-sector map or its default value. */
export async function getSectorMap(): Promise<Record<string, string>> {
  const redis = getRedis();
  if (redis) {
    const stored = await redis.get<Record<string, string>>(KEY_SECTORS);
    if (stored && Object.keys(stored).length > 0) {
      memorySectors = stored;
      return stored;
    }
  }
  return memorySectors ?? { ...DEFAULT_SYMBOL_SECTOR_MAP };
}

/** Saves the symbol-to-sector map to memory and Redis. */
export async function saveSectorMap(map: Record<string, string>): Promise<void> {
  memorySectors = map;
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY_SECTORS, map);
  }
}

/** Returns a cached company description by its normalized key. */
export async function getDescription(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) {
    const fromRedis = await redis.hget<string>(KEY_DESCRIPTIONS, key);
    if (fromRedis) return fromRedis;
  }

  if (Object.keys(memoryDescriptions).length === 0) {
    memoryDescriptions = loadSeedDescriptions();
    const redis2 = getRedis();
    if (redis2 && Object.keys(memoryDescriptions).length > 0) {
      await redis2.hset(KEY_DESCRIPTIONS, memoryDescriptions);
    }
  }

  return memoryDescriptions[key] ?? null;
}

/** Saves a company description to memory and Redis. */
export async function saveDescription(key: string, description: string): Promise<void> {
  memoryDescriptions[key] = description;
  const redis = getRedis();
  if (redis) {
    await redis.hset(KEY_DESCRIPTIONS, { [key]: description });
  }
}

/** Returns the cursor for the next dividend synchronization batch. */
export async function getDivCursor(): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const value = await redis.get<number>(KEY_DIV_CURSOR);
    return Number(value ?? 0);
  }
  return memoryDivCursor;
}

/** Persists the cursor for the next dividend synchronization batch. */
export async function setDivCursor(index: number): Promise<void> {
  memoryDivCursor = index;
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY_DIV_CURSOR, index);
  }
}

/** Returns a cached analysis for the requested bulletin date. */
export async function getBulletinAnalysis(dateCode: string) {
  const redis = getRedis();
  if (redis) {
    return await redis.get<{ analysis: string; sources: { title: string; uri: string }[] }>(
      KEY_BULLETIN(dateCode)
    );
  }
  return memoryBulletins.get(dateCode) ?? null;
}

/** Saves a bulletin analysis to memory and Redis. */
export async function saveBulletinAnalysis(
  dateCode: string,
  payload: { analysis: string; sources: { title: string; uri: string }[] }
): Promise<void> {
  memoryBulletins.set(dateCode, payload);
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY_BULLETIN(dateCode), payload);
  }
}

/** Reports whether Redis persistence is configured. */
export function hasRedis(): boolean {
  return getRedis() !== null;
}
