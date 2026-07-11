import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Ensure the local data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const STOCKS_CACHE_FILE = path.join(DATA_DIR, "stocks_cache.json");

// Helper interface for local dividend history
interface DividendHistory {
  year: number;
  amount: number;
  paid: boolean;
}

// Master Fallback Dataset of the BRVM 30 stocks
const DEFAULT_BRVM_30_STOCKS = [
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
    symbol: "CBIB",
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
    symbol: "ONTB",
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
    symbol: "SDVC",
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
    name: "Servair Abidjan",
    symbol: "SHEC",
    country: "ci",
    currentPrice: 1800,
    high: 1840,
    low: 1780,
    variation: 1.12,
    dividends: [
      { year: 2025, amount: 150, paid: true },
      { year: 2024, amount: 120, paid: true },
      { year: 2023, amount: 0, paid: false }, // Streak broken here! Under 3 years consecutive starting 2025
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
      { year: 2023, amount: 0, paid: false }, // Streak broken here too! Under 3 years
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
      { year: 2025, amount: 0, paid: false }, // No dividend in 2025 -> Streak is 0
      { year: 2024, amount: 150, paid: true },
      { year: 2023, amount: 140, paid: true },
      { year: 2022, amount: 130, paid: true },
      { year: 2021, amount: 120, paid: true }
    ]
  }
];

// Calculate streak and latest dividend details according to specified rules
function processStockDividends(stock: any) {
  const dividends: DividendHistory[] = stock.dividends;
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const startYear = lastYear - 4;

  // We check starting from lastYear and going backwards
  const sorted = [...dividends].sort((a, b) => b.year - a.year);
  let consecutiveYears = 0;
  for (const div of sorted) {
    if (div.year <= lastYear && div.year >= startYear) {
      if (div.paid) {
        consecutiveYears++;
      } else {
        break; // Streak is broken!
      }
    }
  }

  // Display rules:
  // If consecutive years starting from lastYear backwards is >= 3, then streak is consecutiveYears.
  // Else, reported streak is 0.
  const streak = consecutiveYears >= 3 ? consecutiveYears : 0;

  // Amount of the last dividend paid (currentYear - 1)
  const lastYearDiv = dividends.find(d => d.year === lastYear);
  const latestDividend = lastYearDiv && lastYearDiv.paid ? lastYearDiv.amount : 0;

  return {
    ...stock,
    streak,
    latestDividend,
    lastUpdated: new Date().toISOString(),
    source: stock.source || "fallback"
  };
}

// Prepare baseline data
let memoryStocks = DEFAULT_BRVM_30_STOCKS.map(processStockDividends);
let lastSyncTime = new Date().toISOString();
let isSyncingState = false;

// Function to clean HTML for Gemini context optimization
function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to parse dividends from Sika Finance's cotation page HTML
function parseDividendsFromHtml(html: string): { year: number; amount: number; paid: boolean }[] {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  let dividendTableHtml = "";
  
  for (const table of tables) {
    if (table.includes("Année") && table.includes("Montant") && table.includes("Rendement")) {
      dividendTableHtml = table;
      break;
    }
  }
  
  if (!dividendTableHtml) {
    console.log("No table with Année, Montant, Rendement found.");
    return [];
  }

  const trMatches = dividendTableHtml.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
  const dividends: { year: number; amount: number; paid: boolean }[] = [];

  for (const tr of trMatches) {
    const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (tdMatches.length === 3) {
      const yearText = tdMatches[0].replace(/<[^>]*>/g, "").replace(/\s+/g, "").trim();
      const amountText = tdMatches[1].replace(/<[^>]*>/g, "").replace(/\s+/g, "").replace(",", ".").trim();
      
      const year = parseInt(yearText);
      const amount = parseFloat(amountText);

      if (!isNaN(year) && !isNaN(amount) && year >= 2000 && year <= 2030) {
        dividends.push({
          year,
          amount,
          paid: amount > 0
        });
      }
    }
  }

  return dividends;
}

// Scrape BRVM data from Sika Finance using ultra-reliable local regex parsing
async function performScrapeAndSync() {
  if (isSyncingState) return;
  isSyncingState = true;
  console.log("Starting synchronization with Sika Finance...");

  try {
    const sikaUrl = "https://www.sikafinance.com/marches/aaz";
    const res = await fetch(sikaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });

    if (!res.ok) {
      throw new Error(`Sika Finance AAZ returned HTTP status ${res.status}`);
    }

    const html = await res.text();
    
    // Decode HTML helper and remove spaces
    const cleanCellText = (text: string) => {
      if (!text) return "";
      return text
        .replace(/&#x[0-9a-f]+;/gi, "") // remove hex entities
        .replace(/&nbsp;/g, "")
        .replace(/\s+/g, "") // remove all whitespace
        .trim();
    };

    // Find all table rows
    const trMatches = html.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
    const scrapedStocks: any[] = [];

    for (const tr of trMatches) {
      // Check if this row is a stock quotation row
      const hrefMatch = tr.match(/href="\/marches\/cotation_([A-Z0-9]+)\.([a-z]{2})"/i);
      if (hrefMatch) {
        const symbol = hrefMatch[1].toUpperCase();
        const country = hrefMatch[2].toLowerCase();

        // Extract all <td> cell contents
        const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
        if (tdMatches.length >= 8) {
          const highText = cleanCellText(tdMatches[2].replace(/<[^>]*>/g, ""));
          const lowText = cleanCellText(tdMatches[3].replace(/<[^>]*>/g, ""));
          const priceText = cleanCellText(tdMatches[6].replace(/<[^>]*>/g, ""));
          const varText = cleanCellText(tdMatches[7].replace(/<[^>]*>/g, "")).replace("%", "");

          const currentPrice = parseFloat(priceText);
          const high = parseFloat(highText) || currentPrice;
          const low = parseFloat(lowText) || currentPrice;
          const variation = parseFloat(varText) || 0;

          if (!isNaN(currentPrice)) {
            scrapedStocks.push({
              symbol,
              country,
              currentPrice,
              high,
              low,
              variation
            });
          }
        }
      }
    }

    console.log(`Successfully scraped ${scrapedStocks.length} stocks from Sika Finance via Regex.`);

    if (scrapedStocks.length > 0) {
      // Merge scraped data into our memoryStocks array
      memoryStocks = memoryStocks.map((existingStock) => {
        const scraped = scrapedStocks.find(
          (s) => s.symbol.toUpperCase() === existingStock.symbol.toUpperCase()
        );

        if (scraped) {
          console.log(`Updating ${existingStock.symbol}: Price ${existingStock.currentPrice} -> ${scraped.currentPrice}`);
          return {
            ...existingStock,
            currentPrice: scraped.currentPrice || existingStock.currentPrice,
            high: scraped.high || scraped.currentPrice || existingStock.high,
            low: scraped.low || scraped.currentPrice || existingStock.low,
            variation: scraped.variation !== undefined ? scraped.variation : existingStock.variation,
            source: "scraped",
            lastUpdated: new Date().toISOString()
          };
        }
        return existingStock;
      });

      lastSyncTime = new Date().toISOString();
      // Save cache to disk
      fs.writeFileSync(STOCKS_CACHE_FILE, JSON.stringify({
        stocks: memoryStocks,
        lastSyncTime
      }, null, 2));
    }

  } catch (error) {
    console.error("Synchronization failed:", error);
  } finally {
    isSyncingState = false;
  }
}

// Gentle, throttled background sync of dividend history for all stocks
async function syncAllDividendsInBackground() {
  console.log("Starting background dividend synchronization for all stocks...");
  for (let i = 0; i < memoryStocks.length; i++) {
    const stock = memoryStocks[i];
    const url = `https://www.sikafinance.com/marches/cotation_${stock.symbol}.${stock.country}`;
    try {
      // 500ms delay to avoid rate-limiting Sika Finance
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      if (res.ok) {
        const html = await res.text();
        const parsedDividends = parseDividendsFromHtml(html);
        if (parsedDividends.length > 0) {
          const lastYear = new Date().getFullYear() - 1;
          const targetYears = Array.from({ length: 5 }, (_, i) => lastYear - i);
          const updatedDividends = targetYears.map((year) => {
            const found = parsedDividends.find((d) => d.year === year);
            return found ? { year, amount: found.amount, paid: found.paid } : { year, amount: 0, paid: false };
          });
          
          memoryStocks[i] = processStockDividends({
            ...stock,
            dividends: updatedDividends,
            source: "scraped"
          });
          console.log(`Successfully synced dividends for ${stock.symbol}`);
        }
      }
    } catch (e) {
      console.error(`Failed background dividend sync for ${stock.symbol}:`, e);
    }
  }
  
  try {
    fs.writeFileSync(STOCKS_CACHE_FILE, JSON.stringify({
      stocks: memoryStocks,
      lastSyncTime
    }, null, 2));
    console.log("Finished background dividend sync for all stocks and saved cache.");
  } catch (err) {
    console.error("Failed to write updated dividend cache:", err);
  }
}

// Load cache from disk if available
if (fs.existsSync(STOCKS_CACHE_FILE)) {
  try {
    const cachedData = JSON.parse(fs.readFileSync(STOCKS_CACHE_FILE, "utf-8"));
    if (cachedData && Array.isArray(cachedData.stocks)) {
      memoryStocks = cachedData.stocks;
      lastSyncTime = cachedData.lastSyncTime || lastSyncTime;
      console.log("Loaded stocks cache from disk.");
    }
  } catch (err) {
    console.error("Failed to load stocks cache file:", err);
  }
}

// Perform initial boot sync asynchronously to load fresh prices and dividends right away
performScrapeAndSync().then(() => {
  console.log("Initial startup quotation sync completed successfully.");
  // Follow up by synchronizing all dividend history in the background to guarantee accuracy
  syncAllDividendsInBackground();
});

// Background auto-refresh every 5 minutes
setInterval(() => {
  console.log("Background auto-updating stocks (every 5 mins)...");
  performScrapeAndSync();
}, 5 * 60 * 1000);

// API Endpoints
app.get("/api/brvm30/stocks", (req, res) => {
  res.json({
    success: true,
    stocks: memoryStocks,
    lastSync: lastSyncTime,
    isSyncing: isSyncingState,
    brvm30Url: process.env.BRVM_30_URL || "https://www.sikafinance.com/docs/brvm-30-composition-de-l-indice-brvm-30.pdf"
  });
});

app.post("/api/brvm30/sync", async (req, res) => {
  if (isSyncingState) {
    return res.status(409).json({
      success: false,
      message: "La synchronisation est déjà en cours."
    });
  }
  
  performScrapeAndSync().then(() => {
    console.log("Async synchronization completed.");
    syncAllDividendsInBackground();
  });

  res.json({
    success: true,
    message: "Synchronisation démarrée avec succès en arrière-plan."
  });
});

// Endpoint to refresh a single stock's dividend history by scraping its Sika Finance details page
app.post("/api/brvm30/sync-dividends/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const stockIndex = memoryStocks.findIndex(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  
  if (stockIndex === -1) {
    return res.status(404).json({ success: false, message: "Action non trouvée." });
  }

  const stock = memoryStocks[stockIndex];
  const url = `https://www.sikafinance.com/marches/cotation_${stock.symbol}.${stock.country}`;
  console.log(`Syncing dividends for ${stock.symbol} from ${url}...`);

  try {
    const responseHtml = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    if (!responseHtml.ok) {
      throw new Error(`Failed to fetch cotation detail: HTTP ${responseHtml.status}`);
    }

    const html = await responseHtml.text();
    const parsedDividends = parseDividendsFromHtml(html);

    if (parsedDividends.length > 0) {
      const lastYear = new Date().getFullYear() - 1;
      const targetYears = Array.from({ length: 5 }, (_, i) => lastYear - i);
      const updatedDividends = targetYears.map((year) => {
        const found = parsedDividends.find((newD: any) => newD.year === year);
        return found ? { year, amount: found.amount, paid: found.paid } : { year, amount: 0, paid: false };
      });

      const updatedStock = processStockDividends({
        ...stock,
        dividends: updatedDividends,
        source: "scraped"
      });

      memoryStocks[stockIndex] = updatedStock;

      // Save cache to disk
      fs.writeFileSync(STOCKS_CACHE_FILE, JSON.stringify({
        stocks: memoryStocks,
        lastSyncTime
      }, null, 2));

      return res.json({
        success: true,
        message: `Historique des dividendes de ${stock.symbol} mis à jour avec succès !`,
        stock: updatedStock
      });
    }

    throw new Error("Aucun tableau de dividendes n'a pu être extrait de la page.");

  } catch (error) {
    console.error(`Dividend sync failed for ${stock.symbol}:`, error);
    return res.status(500).json({
      success: false,
      message: `La synchronisation des dividendes a échoué: ${(error as Error).message}`
    });
  }
});


const DESCRIPTIONS_CACHE_FILE = path.join(DATA_DIR, "company_descriptions.json");

// Endpoint to fetch and parse company description from Sika Finance (with dynamic fallback using Gemini)
app.get("/api/brvm30/company-description/:symbol/:country", async (req, res) => {
  const { symbol, country } = req.params;
  const targetSymbol = symbol.toUpperCase();
  const targetCountry = country.toLowerCase();
  const cacheKey = `${targetSymbol}.${targetCountry}`;

  // 1. Check file cache
  if (fs.existsSync(DESCRIPTIONS_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(DESCRIPTIONS_CACHE_FILE, "utf-8"));
      if (cache[cacheKey]) {
        return res.json({
          success: true,
          description: cache[cacheKey],
          source: "cache"
        });
      }
    } catch (e) {
      console.error("Error reading descriptions cache", e);
    }
  }

  // Find the company's full name from our memory stocks if possible
  const stock = memoryStocks.find(s => s.symbol.toUpperCase() === targetSymbol);
  const companyName = stock ? stock.name : targetSymbol;

  let finalDescription = "";

  if (ai) {
    console.log(`Generating high-quality company description for ${companyName} (${targetSymbol}) using Gemini...`);
    try {
      const prompt = `Provide a professional, realistic, and highly informative company description in French of 1 to 3 paragraphs for the BRVM-listed company "${companyName}" (symbol: ${targetSymbol}, country: ${targetCountry.toUpperCase()}). Describe its primary business sector (e.g. banking, telecommunications, agriculture, energy, etc.), its history, its services, and its position on the regional market. Return ONLY a JSON object with a single 'description' string property.`;
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING }
            },
            required: ["description"]
          }
        }
      });

      const resultObj = JSON.parse(geminiResponse.text?.trim() || "{}");
      if (resultObj.description && resultObj.description.trim().length > 10) {
        finalDescription = resultObj.description.trim();
      }
    } catch (fallbackError) {
      console.error(`Gemini description generation failed for ${targetSymbol}:`, fallbackError);
    }
  }

  // Baseline fallback if Gemini failed or isn't initialized
  if (!finalDescription) {
    finalDescription = `Aucune description détaillée n'est actuellement disponible en ligne pour l'entreprise ${companyName} (${targetSymbol}). Il s'agit d'une entreprise majeure cotée à la BRVM représentant le secteur d'activité lié à son profil d'activité d'origine.`;
  }

  // Save back to cache file
  try {
    let cache: Record<string, string> = {};
    if (fs.existsSync(DESCRIPTIONS_CACHE_FILE)) {
      try {
        cache = JSON.parse(fs.readFileSync(DESCRIPTIONS_CACHE_FILE, "utf-8"));
      } catch (e) {
        // ignore parsing error, overwrite
      }
    }
    cache[cacheKey] = finalDescription;
    fs.writeFileSync(DESCRIPTIONS_CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`Saved description for ${cacheKey} to cache.`);
  } catch (cacheWriteError) {
    console.error("Failed to write to descriptions cache file:", cacheWriteError);
  }

  return res.json({
    success: true,
    description: finalDescription,
    source: "ai-generation"
  });
});


// Serve static files in production or development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
