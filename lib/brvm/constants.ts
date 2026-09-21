import type { DividendHistory } from "./types.js";
import composition from "../../data/brvm30-composition.json" with { type: "json" };

type SeedStock = {
  name: string;
  symbol: string;
  country: string;
  currentPrice: number;
  high: number;
  low: number;
  variation: number;
  sector?: string;
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

export const BRVM_30_COMPOSITION = composition;

export const DEFAULT_SYMBOL_SECTOR_MAP: Record<string, string> = Object.fromEntries(
  composition.stocks.map((s) => [s.symbol, s.sector])
);

// Master Fallback Dataset of the BRVM 30 stocks (Avis BRVM n°191-2026 au 01/07/2026)
export const DEFAULT_BRVM_30_STOCKS: SeedStock[] = [
  {
    name: "Sonatel Sénégal",
    symbol: "SNTS",
    country: "sn",
    currentPrice: 31005,
    high: 31010,
    low: 31005,
    variation: -0.02,
    sector: "Télécommunications",
    dividends: [
      { year: 2025, amount: 1740, paid: true },
      { year: 2024, amount: 1655, paid: true },
      { year: 2023, amount: 1575, paid: true },
      { year: 2022, amount: 1500, paid: true },
      { year: 2021, amount: 1400, paid: true }
    ]
  },
  {
    name: "Société Générale Côte d'Ivoire",
    symbol: "SGBC",
    country: "ci",
    currentPrice: 37950,
    high: 38200,
    low: 37950,
    variation: -0.39,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 2293.28, paid: true },
      { year: 2024, amount: 1639, paid: true },
      { year: 2023, amount: 1547, paid: true },
      { year: 2022, amount: 1107, paid: true },
      { year: 2021, amount: 1004.93, paid: true }
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
    sector: "Services Financiers",
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
    currentPrice: 69,
    high: 74,
    low: 69,
    variation: -6.76,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 0.92, paid: true },
      { year: 2024, amount: 0, paid: false },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0.6, paid: true },
      { year: 2021, amount: 0.9, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Bénin",
    symbol: "BOAB",
    country: "bj",
    currentPrice: 8520,
    high: 8545,
    low: 8520,
    variation: -0.29,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 585, paid: true },
      { year: 2024, amount: 468, paid: true },
      { year: 2023, amount: 353, paid: true },
      { year: 2022, amount: 273, paid: true },
      { year: 2021, amount: 218, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Burkina Faso",
    symbol: "BOABF",
    country: "bf",
    currentPrice: 7145,
    high: 7145,
    low: 6905,
    variation: 3.55,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 397, paid: true },
      { year: 2024, amount: 428, paid: true },
      { year: 2023, amount: 352, paid: true },
      { year: 2022, amount: 224, paid: true },
      { year: 2021, amount: 185, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Côte d'Ivoire",
    symbol: "BOAC",
    country: "ci",
    currentPrice: 10895,
    high: 10895,
    low: 10800,
    variation: 0.93,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 594.5, paid: true },
      { year: 2024, amount: 459, paid: true },
      { year: 2023, amount: 342, paid: true },
      { year: 2022, amount: 270, paid: true },
      { year: 2021, amount: 187, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Niger",
    symbol: "BOAN",
    country: "ne",
    currentPrice: 5400,
    high: 5400,
    low: 5205,
    variation: 2.86,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 209.25, paid: true },
      { year: 2023, amount: 380.72, paid: true },
      { year: 2022, amount: 354.56, paid: true },
      { year: 2021, amount: 343.13, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Sénégal",
    symbol: "BOAS",
    country: "sn",
    currentPrice: 7945,
    high: 7945,
    low: 7900,
    variation: 0.57,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 450, paid: true },
      { year: 2024, amount: 350, paid: true },
      { year: 2023, amount: 200, paid: true },
      { year: 2022, amount: 125, paid: true },
      { year: 2021, amount: 107.34, paid: true }
    ]
  },
  {
    name: "Bank Of Africa Mali",
    symbol: "BOAM",
    country: "ml",
    currentPrice: 5630,
    high: 5630,
    low: 5350,
    variation: 5.23,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 305.04, paid: true },
      { year: 2024, amount: 237.15, paid: true },
      { year: 2023, amount: 96, paid: true },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Société Ivoirienne de Banque",
    symbol: "SIBC",
    country: "ci",
    currentPrice: 9100,
    high: 9100,
    low: 9100,
    variation: 0,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 374, paid: true },
      { year: 2024, amount: 330, paid: true },
      { year: 2023, amount: 247.5, paid: true },
      { year: 2022, amount: 247.5, paid: true },
      { year: 2021, amount: 202.5, paid: true }
    ]
  },
  {
    name: "Ecobank Côte d'Ivoire",
    symbol: "ECOC",
    country: "ci",
    currentPrice: 16245,
    high: 16245,
    low: 16245,
    variation: 0.03,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 781, paid: true },
      { year: 2024, amount: 708, paid: true },
      { year: 2023, amount: 594, paid: true },
      { year: 2022, amount: 549, paid: true },
      { year: 2021, amount: 420.3, paid: true }
    ]
  },
  {
    name: "NSIA Banque Côte d'Ivoire",
    symbol: "NSBC",
    country: "ci",
    currentPrice: 23390,
    high: 23390,
    low: 23015,
    variation: 0,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 675.98, paid: true },
      { year: 2024, amount: 671, paid: true },
      { year: 2023, amount: 455, paid: true },
      { year: 2022, amount: 363.86, paid: true },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Compagnie Ivoirienne d'Electricité",
    symbol: "CIEC",
    country: "ci",
    currentPrice: 5375,
    high: 5375,
    low: 5200,
    variation: 3.37,
    sector: "Services Publics",
    dividends: [
      { year: 2025, amount: 205.92, paid: true },
      { year: 2024, amount: 158.4, paid: true },
      { year: 2023, amount: 171, paid: true },
      { year: 2022, amount: 157.5, paid: true },
      { year: 2021, amount: 153.16, paid: true }
    ]
  },
  {
    name: "Société des Caoutchoucs de Grand-Béréby",
    symbol: "SOGC",
    country: "ci",
    currentPrice: 8380,
    high: 8380,
    low: 8300,
    variation: 3.46,
    sector: "Consommation de Base",
    dividends: [
      { year: 2025, amount: 501.6, paid: true },
      { year: 2024, amount: 528, paid: true },
      { year: 2023, amount: 207, paid: true },
      { year: 2022, amount: 554.33, paid: true },
      { year: 2021, amount: 558, paid: true }
    ]
  },
  {
    name: "Société Africaine de Plantations d'Hévéas",
    symbol: "SPHC",
    country: "ci",
    currentPrice: 7500,
    high: 7500,
    low: 7450,
    variation: 1.35,
    sector: "Consommation de Base",
    dividends: [
      { year: 2025, amount: 430.32, paid: true },
      { year: 2024, amount: 324, paid: true },
      { year: 2023, amount: 65, paid: true },
      { year: 2022, amount: 294.3, paid: true },
      { year: 2021, amount: 365.4, paid: true }
    ]
  },
  {
    name: "CFAO Motors Côte d'Ivoire",
    symbol: "CFAC",
    country: "ci",
    currentPrice: 1660,
    high: 1670,
    low: 1660,
    variation: -0.6,
    sector: "Consommation Discrétionnaire",
    dividends: [
      { year: 2025, amount: 55.44, paid: true },
      { year: 2024, amount: 7.04, paid: true },
      { year: 2023, amount: 15.88, paid: true },
      { year: 2022, amount: 28.67, paid: true },
      { year: 2021, amount: 69.47, paid: true }
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
    sector: "Industriels",
    dividends: [
      { year: 2025, amount: 200, paid: true },
      { year: 2024, amount: 180, paid: true },
      { year: 2023, amount: 165, paid: true },
      { year: 2022, amount: 150, paid: true },
      { year: 2021, amount: 135, paid: true }
    ]
  },
  {
    name: "TotalEnergies Marketing Côte d'Ivoire",
    symbol: "TTLC",
    country: "ci",
    currentPrice: 3000,
    high: 3000,
    low: 2990,
    variation: 0.33,
    sector: "Énergie",
    dividends: [
      { year: 2025, amount: 140, paid: true },
      { year: 2024, amount: 195.67, paid: true },
      { year: 2023, amount: 200, paid: true },
      { year: 2022, amount: 175.53, paid: true },
      { year: 2021, amount: 159.29, paid: true }
    ]
  },
  {
    name: "Oragroup Togo",
    symbol: "ORGT",
    country: "tg",
    currentPrice: 2750,
    high: 2750,
    low: 2725,
    variation: 1.1,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 0, paid: false },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Banque Internationale pour l'Industrie et le Commerce Bénin",
    symbol: "BICB",
    country: "bj",
    currentPrice: 7500,
    high: 7500,
    low: 7400,
    variation: 0.0,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 450, paid: true },
      { year: 2024, amount: 400, paid: true },
      { year: 2023, amount: 350, paid: true },
      { year: 2022, amount: 300, paid: true },
      { year: 2021, amount: 250, paid: true }
    ]
  },
  {
    name: "Erium Côte d'Ivoire (ex-Air Liquide CI)",
    symbol: "SIVC",
    country: "ci",
    currentPrice: 850,
    high: 880,
    low: 840,
    variation: 0.0,
    sector: "Industriels",
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 0, paid: false },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Eviosys Packaging Siem Côte d'Ivoire",
    symbol: "SEMC",
    country: "ci",
    currentPrice: 700,
    high: 720,
    low: 690,
    variation: 0.0,
    sector: "Industriels",
    dividends: [
      { year: 2025, amount: 45, paid: true },
      { year: 2024, amount: 40, paid: true },
      { year: 2023, amount: 35, paid: true },
      { year: 2022, amount: 30, paid: true },
      { year: 2021, amount: 25, paid: true }
    ]
  },
  {
    name: "NEI-CEDA Côte d'Ivoire",
    symbol: "NEIC",
    country: "ci",
    currentPrice: 600,
    high: 620,
    low: 580,
    variation: 0.0,
    sector: "Consommation Discrétionnaire",
    dividends: [
      { year: 2025, amount: 35, paid: true },
      { year: 2024, amount: 30, paid: true },
      { year: 2023, amount: 25, paid: true },
      { year: 2022, amount: 20, paid: true },
      { year: 2021, amount: 15, paid: true }
    ]
  },
  {
    name: "Orange Côte d'Ivoire",
    symbol: "ORAC",
    country: "ci",
    currentPrice: 11500,
    high: 11600,
    low: 11400,
    variation: 0.88,
    sector: "Télécommunications",
    dividends: [
      { year: 2025, amount: 800, paid: true },
      { year: 2024, amount: 750, paid: true },
      { year: 2023, amount: 700, paid: true },
      { year: 2022, amount: 650, paid: true },
      { year: 2021, amount: 600, paid: true }
    ]
  },
  {
    name: "Société Africaine de Crédit Automobile (SAFCA CI)",
    symbol: "SAFC",
    country: "ci",
    currentPrice: 1050,
    high: 1080,
    low: 1020,
    variation: 0.0,
    sector: "Services Financiers",
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 0, paid: false },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Société d'Etudes et de Travaux pour l'Afrique (SETAO CI)",
    symbol: "STAC",
    country: "ci",
    currentPrice: 800,
    high: 820,
    low: 780,
    variation: 0.0,
    sector: "Industriels",
    dividends: [
      { year: 2025, amount: 60, paid: true },
      { year: 2024, amount: 55, paid: true },
      { year: 2023, amount: 50, paid: true },
      { year: 2022, amount: 45, paid: true },
      { year: 2021, amount: 40, paid: true }
    ]
  },
  {
    name: "Société Ivoirienne de Tabacs (SITAB CI)",
    symbol: "STBC",
    country: "ci",
    currentPrice: 6800,
    high: 6900,
    low: 6700,
    variation: 0.0,
    sector: "Consommation de Base",
    dividends: [
      { year: 2025, amount: 550, paid: true },
      { year: 2024, amount: 500, paid: true },
      { year: 2023, amount: 450, paid: true },
      { year: 2022, amount: 400, paid: true },
      { year: 2021, amount: 350, paid: true }
    ]
  },
  {
    name: "Sucrivoire Côte d'Ivoire",
    symbol: "SCRC",
    country: "ci",
    currentPrice: 950,
    high: 980,
    low: 920,
    variation: 0.0,
    sector: "Consommation de Base",
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 0, paid: false },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  },
  {
    name: "Uniwax Côte d'Ivoire",
    symbol: "UNXC",
    country: "ci",
    currentPrice: 520,
    high: 540,
    low: 500,
    variation: 0.0,
    sector: "Consommation Discrétionnaire",
    dividends: [
      { year: 2025, amount: 0, paid: false },
      { year: 2024, amount: 0, paid: false },
      { year: 2023, amount: 0, paid: false },
      { year: 2022, amount: 0, paid: false },
      { year: 2021, amount: 0, paid: false }
    ]
  }
];
