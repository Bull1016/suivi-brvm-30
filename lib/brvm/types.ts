export type DividendStatus = "a_jour" | "en_attente" | "interrompu" | "aucun";

export interface DividendHistory {
  year: number;
  amount: number;
  paid: boolean;
}

export interface StockData {
  name: string;
  symbol: string;
  country: string;
  sector: string;
  currentPrice: number;
  high: number;
  low: number;
  variation: number;
  dividends: DividendHistory[];
  streak: number;
  dividendStatus?: DividendStatus;
  latestDividend: number;
  lastUpdated: string;
  source: "scraped" | "fallback" | "pending";
}

/** One entry of an official BRVM 30 composition avis (avis n°191-2026 and successors). */
export interface CompositionEntry {
  symbol: string;
  name: string;
  country: string;
  sector: string;
}

/**
 * Candidate composition extracted from an official avis.
 * Kept isolated from the served stocks until a human confirms it (see RAPPORT, section 3.3).
 */
export interface PendingComposition {
  id: string;
  url: string;
  avis: string;
  date: string;
  archivedPdfUrl: string;
  stocks: CompositionEntry[];
}

export interface BrvmState {
  stocks: StockData[];
  lastSync: string;
  compositionVersion?: string;
  /** URL of the composition avis that was confirmed and activated. */
  lastAnalyzedAvisUrl?: string;
  /** URL associated with the latest composition analysis attempt (successful or not). */
  lastCompositionCheckUrl?: string;
  /** Persistent timestamp of the latest composition analysis attempt, kept even on failure. */
  lastCompositionCheckAt?: string;
  /**
   * URL whose successful extraction showed a composition identical to the active one.
   * Stored so the same avis is never sent to the model twice.
   */
  lastUnchangedAvisUrl?: string;
  /** Candidate composition awaiting explicit human confirmation. */
  pendingComposition?: PendingComposition;
}

export interface BulletinItem {
  dateStr: string;
  dateCode: string;
  url: string;
}

export interface BulletinAnalysis {
  analysis: string;
  sources: { title: string; uri: string }[];
}

export const SCRAPE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

export const DEFAULT_BRVM30_PDF = process.env.BRVM_30_URL || 
  "https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf";
