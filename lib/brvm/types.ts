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
  source: "scraped" | "fallback";
}

export interface BrvmState {
  stocks: StockData[];
  lastSync: string;
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
