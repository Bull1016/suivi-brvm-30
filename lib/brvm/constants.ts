import type { DividendHistory } from "./types.js";

type SeedStock = {
  name: string;
  symbol: string;
  country: string;
  currentPrice: number;
  high: number;
  low: number;
  variation: number;
  dividends: DividendHistory[];
};

export const BRVM_SECTORS: Record<number, string> = {
  194: "Consommation de Base",
  195: "Consommation Discrétionnaire",
  196: "Énergie",
  197: "Industriels",
  198: "Services Financiers",
  199: "Services Publics",
  200: "Télécommunications"
};

export const DEFAULT_SYMBOL_SECTOR_MAP: Record<string, string> = {
  SNTS: "Télécommunications",
  SGBC: "Services Financiers",
  CBIBF: "Services Financiers",
  ETIT: "Services Financiers",
  BOAB: "Services Financiers",
  BOABF: "Services Financiers",
  BOAC: "Services Financiers",
  BOAN: "Services Financiers",
  BOAS: "Services Financiers",
  BOAM: "Services Financiers",
  ONTBF: "Télécommunications",
  SIBC: "Services Financiers",
  ECOC: "Services Financiers",
  NSBC: "Services Financiers",
  PALC: "Consommation de Base",
  TTLC: "Énergie",
  TTLS: "Énergie",
  CIEC: "Services Publics",
  SDCC: "Services Publics",
  SOGC: "Consommation de Base",
  SPHC: "Consommation de Base",
  NTLC: "Consommation de Base",
  BICC: "Services Financiers",
  CFAC: "Consommation Discrétionnaire",
  BNBC: "Consommation Discrétionnaire",
  SDSC: "Industriels",
  SHEC: "Énergie",
  SLBC: "Consommation de Base",
  FTSC: "Industriels",
  ORGT: "Services Financiers"
};


// Master Fallback Dataset of the BRVM 30 stocks
export const DEFAULT_BRVM_30_STOCKS: SeedStock[] = [
  {
    name: "Sonatel Sénégal",
    symbol: "SNTS",
    country: "sn",
    currentPrice: 19450,
    high: 19600,
    low: 19300,
    variation: 0.78,
    dividends: [
      { year: 2025, amount: 1750, paid: true },
      { year: 2024, amount: 1575, paid: true },
      { year: 2023, amount: 1400, paid: true },
      { year: 2022, amount: 1200, paid: true },
      { year: 2021, amount: 1100, paid: true }
    ]
  },
  {
    name: "Société Générale Côte d'Ivoire",
    symbol: "SGBC",
    country: "ci",
    currentPrice: 20800,
    high: 21000,
    low: 20700,
    variation: 0.48,
    dividends: [
      { year: 2025, amount: 1250, paid: true },
      { year: 2024, amount: 1100, paid: true },
      { year: 2023, amount: 1000, paid: true },
      { year: 2022, amount: 950, paid: true },
      { year: 2021, amount: 800, paid: true }
    ]
  },
  {
    name: "Coris Bank International",
    symbol: "CBIBF",
    country: "bf",
    currentPrice: 10500,
    high: 10600,
    low: 10450,
    variation: -0.19,
    dividends: [
      { year: 2025, amount: 900, paid: true },
      { year: 2024, amount: 850, paid: true },
      { year: 2023, amount: 800, paid: true },
      { year: 2022, amount: 750, paid: true },
      { year: 2021, amount: 700, paid: true }
    ]
  },
  {
    name: "Ecobank Transnational Inc.",
    symbol: "ETIT",
    country: "tg",
    currentPrice: 17,
    high: 18,
    low: 17,
    variation: 0.00,
    dividends: [
      { year: 2025, amount: 5, paid: true },
      { year: 2024, amount: 4, paid: true },
      { year: 2023, amount: 4, paid: true },
      { year: 2022, amount: 3, paid: true },
      { year: 2021, amount: 2, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Bénin",
    symbol: "BOAB",
    country: "bj",
    currentPrice: 7100,
    high: 7200,
    low: 7050,
    variation: 1.14,
    dividends: [
      { year: 2025, amount: 560, paid: true },
      { year: 2024, amount: 520, paid: true },
      { year: 2023, amount: 480, paid: true },
      { year: 2022, amount: 450, paid: true },
      { year: 2021, amount: 410, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Burkina Faso",
    symbol: "BOABF",
    country: "bf",
    currentPrice: 7400,
    high: 7500,
    low: 7350,
    variation: -0.67,
    dividends: [
      { year: 2025, amount: 600, paid: true },
      { year: 2024, amount: 550, paid: true },
      { year: 2023, amount: 500, paid: true },
      { year: 2022, amount: 460, paid: true },
      { year: 2021, amount: 420, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Côte d'Ivoire",
    symbol: "BOAC",
    country: "ci",
    currentPrice: 8450,
    high: 8550,
    low: 8350,
    variation: 0.59,
    dividends: [
      { year: 2025, amount: 480, paid: true },
      { year: 2024, amount: 440, paid: true },
      { year: 2023, amount: 400, paid: true },
      { year: 2022, amount: 360, paid: true },
      { year: 2021, amount: 320, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Niger",
    symbol: "BOAN",
    country: "ne",
    currentPrice: 6250,
    high: 6300,
    low: 6200,
    variation: 0.00,
    dividends: [
      { year: 2025, amount: 510, paid: true },
      { year: 2024, amount: 480, paid: true },
      { year: 2023, amount: 450, paid: true },
      { year: 2022, amount: 410, paid: true },
      { year: 2021, amount: 380, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Sénégal",
    symbol: "BOAS",
    country: "sn",
    currentPrice: 4300,
    high: 4400,
    low: 4250,
    variation: 1.18,
    dividends: [
      { year: 2025, amount: 320, paid: true },
      { year: 2024, amount: 300, paid: true },
      { year: 2023, amount: 280, paid: true },
      { year: 2022, amount: 250, paid: true },
      { year: 2021, amount: 220, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Mali",
    symbol: "BOAM",
    country: "ml",
    currentPrice: 4900,
    high: 5000,
    low: 4850,
    variation: -1.01,
    dividends: [
      { year: 2025, amount: 380, paid: true },
      { year: 2024, amount: 350, paid: true },
      { year: 2023, amount: 320, paid: true },
      { year: 2022, amount: 300, paid: true },
      { year: 2021, amount: 270, paid: true }
    ]
  },
  {
    name: "Onatel Burkina Faso",
    symbol: "ONTBF",
    country: "bf",
    currentPrice: 2450,
    high: 2500,
    low: 2400,
    variation: 0.41,
    dividends: [
      { year: 2025, amount: 380, paid: true },
      { year: 2024, amount: 340, paid: true },
      { year: 2023, amount: 310, paid: true },
      { year: 2022, amount: 280, paid: true },
      { year: 2021, amount: 250, paid: true }
    ]
  },
  {
    name: "Société Ivoirienne de Banque",
    symbol: "SIBC",
    country: "ci",
    currentPrice: 6500,
    high: 6600,
    low: 6450,
    variation: 0.77,
    dividends: [
      { year: 2025, amount: 450, paid: true },
      { year: 2024, amount: 410, paid: true },
      { year: 2023, amount: 380, paid: true },
      { year: 2022, amount: 350, paid: true },
      { year: 2021, amount: 310, paid: true }
    ]
  },
  {
    name: "Ecobank Côte d'Ivoire",
    symbol: "ECOC",
    country: "ci",
    currentPrice: 7900,
    high: 8000,
    low: 7850,
    variation: -0.63,
    dividends: [
      { year: 2025, amount: 620, paid: true },
      { year: 2024, amount: 580, paid: true },
      { year: 2023, amount: 530, paid: true },
      { year: 2022, amount: 490, paid: true },
      { year: 2021, amount: 450, paid: true }
    ]
  },
  {
    name: "NSIA Banque Côte d'Ivoire",
    symbol: "NSBC",
    country: "ci",
    currentPrice: 6800,
    high: 6900,
    low: 6750,
    variation: 0.00,
    dividends: [
      { year: 2025, amount: 350, paid: true },
      { year: 2024, amount: 320, paid: true },
      { year: 2023, amount: 290, paid: true },
      { year: 2022, amount: 260, paid: true },
      { year: 2021, amount: 230, paid: true }
    ]
  },
  {
    name: "Palm Côte d'Ivoire",
    symbol: "PALC",
    country: "ci",
    currentPrice: 12500,
    high: 12800,
    low: 12400,
    variation: 1.63,
    dividends: [
      { year: 2025, amount: 1400, paid: true },
      { year: 2024, amount: 1250, paid: true },
      { year: 2023, amount: 1100, paid: true },
      { year: 2022, amount: 950, paid: true },
      { year: 2021, amount: 800, paid: true }
    ]
  },
  {
    name: "Total Côte d'Ivoire",
    symbol: "TTLC",
    country: "ci",
    currentPrice: 2150,
    high: 2200,
    low: 2100,
    variation: -1.38,
    dividends: [
      { year: 2025, amount: 210, paid: true },
      { year: 2024, amount: 190, paid: true },
      { year: 2023, amount: 175, paid: true },
      { year: 2022, amount: 160, paid: true },
      { year: 2021, amount: 145, paid: true }
    ]
  },
  {
    name: "Total Sénégal",
    symbol: "TTLS",
    country: "sn",
    currentPrice: 2700,
    high: 2750,
    low: 2680,
    variation: 0.37,
    dividends: [
      { year: 2025, amount: 280, paid: true },
      { year: 2024, amount: 260, paid: true },
      { year: 2023, amount: 240, paid: true },
      { year: 2022, amount: 220, paid: true },
      { year: 2021, amount: 200, paid: true }
    ]
  },
  {
    name: "Compagnie Ivoirienne d'Electricité",
    symbol: "CIEC",
    country: "ci",
    currentPrice: 2200,
    high: 2250,
    low: 2180,
    variation: -0.45,
    dividends: [
      { year: 2025, amount: 180, paid: true },
      { year: 2024, amount: 165, paid: true },
      { year: 2023, amount: 150, paid: true },
      { year: 2022, amount: 135, paid: true },
      { year: 2021, amount: 120, paid: true }
    ]
  },
  {
    name: "SODECI Côte d'Ivoire",
    symbol: "SDCC",
    country: "ci",
    currentPrice: 5350,
    high: 5400,
    low: 5300,
    variation: 0.94,
    dividends: [
      { year: 2025, amount: 320, paid: true },
      { year: 2024, amount: 290, paid: true },
      { year: 2023, amount: 260, paid: true },
      { year: 2022, amount: 240, paid: true },
      { year: 2021, amount: 210, paid: true }
    ]
  },
  {
    name: "Société des Caoutchoucs de Grand-Béréby",
    symbol: "SOGC",
    country: "ci",
    currentPrice: 3800,
    high: 3900,
    low: 3750,
    variation: 0.00,
    dividends: [
      { year: 2025, amount: 3600, paid: true },
      { year: 2024, amount: 3200, paid: true },
      { year: 2023, amount: 2800, paid: true },
      { year: 2022, amount: 2500, paid: true },
      { year: 2021, amount: 2200, paid: true }
    ]
  },
  {
    name: "Société Africaine de Plantations d'Hévéas",
    symbol: "SPHC",
    country: "ci",
    currentPrice: 3100,
    high: 3200,
    low: 3050,
    variation: -1.59,
    dividends: [
      { year: 2025, amount: 250, paid: true },
      { year: 2024, amount: 220, paid: true },
      { year: 2023, amount: 190, paid: true },
      { year: 2022, amount: 170, paid: true },
      { year: 2021, amount: 150, paid: true }
    ]
  },
  {
    name: "Nestlé Côte d'Ivoire",
    symbol: "NTLC",
    country: "ci",
    currentPrice: 8500,
    high: 8700,
    low: 8450,
    variation: 1.19,
    dividends: [
      { year: 2025, amount: 650, paid: true },
      { year: 2024, amount: 580, paid: true },
      { year: 2023, amount: 520, paid: true },
      { year: 2022, amount: 470, paid: true },
      { year: 2021, amount: 420, paid: true }
    ]
  },
  {
    name: "BICICI Côte d'Ivoire",
    symbol: "BICC",
    country: "ci",
    currentPrice: 9200,
    high: 9400,
    low: 9100,
    variation: 0.55,
    dividends: [
      { year: 2025, amount: 550, paid: true },
      { year: 2024, amount: 500, paid: true },
      { year: 2023, amount: 460, paid: true },
      { year: 2022, amount: 420, paid: true },
      { year: 2021, amount: 380, paid: true }
    ]
  },
  {
    name: "CFAO Motors Côte d'Ivoire",
    symbol: "CFAC",
    country: "ci",
    currentPrice: 850,
    high: 870,
    low: 840,
    variation: -0.58,
    dividends: [
      { year: 2025, amount: 35, paid: true },
      { year: 2024, amount: 30, paid: true },
      { year: 2023, amount: 28, paid: true },
      { year: 2022, amount: 25, paid: true },
      { year: 2021, amount: 22, paid: true }
    ]
  },
  {
    name: "Bernabé Côte d'Ivoire",
    symbol: "BNBC",
    country: "ci",
    currentPrice: 1350,
    high: 1380,
    low: 1320,
    variation: 0.00,
    dividends: [
      { year: 2025, amount: 120, paid: true },
      { year: 2024, amount: 110, paid: true },
      { year: 2023, amount: 100, paid: true },
      { year: 2022, amount: 90, paid: true },
      { year: 2021, amount: 80, paid: true }
    ]
  },
  {
    name: "Africa Global Logistics CI (ex-Bolloré)",
    symbol: "SDSC",
    country: "ci",
    currentPrice: 1950,
    high: 2000,
    low: 1920,
    variation: 0.51,
    dividends: [
      { year: 2025, amount: 200, paid: true },
      { year: 2024, amount: 180, paid: true },
      { year: 2023, amount: 165, paid: true },
      { year: 2022, amount: 150, paid: true },
      { year: 2021, amount: 135, paid: true }
    ]
  },
  {
    name: "Vivo Energy Côte d'Ivoire",
    symbol: "SHEC",
    country: "ci",
    currentPrice: 1800,
    high: 1840,
    low: 1780,
    variation: 1.12,
    dividends: [
      { year: 2025, amount: 150, paid: true },
      { year: 2024, amount: 120, paid: true },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Solibra Côte d'Ivoire",
    symbol: "SLBC",
    country: "ci",
    currentPrice: 85000,
    high: 86000,
    low: 84000,
    variation: -0.29,
    dividends: [
      { year: 2025, amount: 4500, paid: true },
      { year: 2024, amount: 4000, paid: true },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 3500, paid: true },
      { year: 2021, amount: 3000, paid: true }
    ]
  },
  {
    name: "Filtisac Côte d'Ivoire",
    symbol: "FTSC",
    country: "ci",
    currentPrice: 1400,
    high: 1430,
    low: 1380,
    variation: 0.00,
    dividends: [
      { year: 2025, amount: 110, paid: true },
      { year: 2024, amount: 100, paid: true },
      { year: 2023, amount: 90, paid: true },
      { year: 2022, amount: 80, paid: true },
      { year: 2021, amount: 75, paid: true }
    ]
  },
  {
    name: "Oragroup Togo",
    symbol: "ORGT",
    country: "tg",
    currentPrice: 2800,
    high: 2850,
    low: 2750,
    variation: -0.71,
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 150, paid: true },
      { year: 2023, amount: 140, paid: true },
      { year: 2022, amount: 130, paid: true },
      { year: 2021, amount: 120, paid: true }
    ]
  }
];

