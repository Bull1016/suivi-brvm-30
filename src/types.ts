/**
 * Shared types for the BRVM Tracking Application
 */

export interface DividendHistory {
  year: number;
  amount: number;
  paid: boolean;
}

export interface StockData {
  name: string;
  symbol: string;
  country: string;
  currentPrice: number;
  high: number;
  low: number;
  variation: number;
  dividends: DividendHistory[];
  streak: number; // consecutive years of dividends paid starting from 2025 backwards
  latestDividend: number; // dividend for 2025 (currentYear - 1)
  lastUpdated: string;
  source: "scraped" | "fallback";
}

export interface BRVMResponse {
  success: boolean;
  stocks: StockData[];
  lastSync: string;
  isSyncing: boolean;
  message?: string;
}
