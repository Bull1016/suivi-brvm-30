/**
 * Shared types for the BRVM Tracking Application
 */

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
  streak: number; // actual count of consecutive years of dividends paid starting from lastYear (currentYear - 1) backwards
  dividendStatus?: DividendStatus;
  latestDividend: number; // dividend for lastYear (currentYear - 1)
  lastUpdated: string;
  source: "scraped" | "fallback" | "pending";
}

export interface CompositionEntry {
  symbol: string;
  name: string;
  country: string;
  sector: string;
}

/** Composition extracted from an official avis, awaiting human confirmation. */
export interface PendingComposition {
  id: string;
  url: string;
  avis: string;
  date: string;
  archivedPdfUrl: string;
  stocks: CompositionEntry[];
}

export interface BRVMResponse {
  success: boolean;
  stocks: StockData[];
  lastSync: string;
  isSyncing: boolean;
  message?: string;
  brvm30Url?: string;
  compositionVersion?: string;
  /** Similar to `brvm30Url`, but here it's the pending composition awaiting confirmation. */
  compositionUpdate?: PendingComposition | null;
}
