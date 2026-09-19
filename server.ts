import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  companyDescription,
  listStocks,
  syncDividendsForSymbol,
  syncQuotations,
  analyzeBulletin,
} from "./lib/brvm/service.js";
import { scrapeOfficialBulletins } from "./lib/brvm/bulletins.js";
import { checkRateLimit } from "./lib/brvm/http.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

app.get("/api/brvm30/stocks", async (_req, res) => {
  try {
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    res.json(await listStocks());
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Impossible de charger les cotations." });
  }
});

app.post("/api/brvm30/sync", async (_req, res) => {
  try {
    const result = await syncQuotations();
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur lors de la synchronisation." });
  }
});

app.post("/api/brvm30/sync-dividends/:symbol", async (req, res) => {
  try {
    const result = await syncDividendsForSymbol(req.params.symbol);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur lors de la synchronisation des dividendes." });
  }
});

app.get("/api/brvm30/company-description/:symbol/:country", async (req, res) => {
  try {
    if (!(await checkRateLimit(req))) {
      return res.status(429).json({ success: false, message: "Trop de requêtes. Veuillez patienter une minute." });
    }
    const result = await companyDescription(req.params.symbol, req.params.country);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Impossible de générer la description." });
  }
});

app.get("/api/brvm/bulletins", async (_req, res) => {
  try {
    const bulletins = await scrapeOfficialBulletins();
    res.json({ success: true, bulletins });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: (error as Error).message || "Impossible de charger les bulletins de la cote.",
    });
  }
});

app.get("/api/brvm/analyze-bulletin/:date", async (req, res) => {
  const dateCode = req.params.date;
  const url = typeof req.query.url === "string" ? req.query.url : "";

  try {
    if (!(await checkRateLimit(req))) {
      return res.status(429).json({ success: false, message: "Trop de requêtes. Veuillez patienter une minute." });
    }
    const result = await analyzeBulletin(dateCode, url);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Erreur lors de la génération de l'analyse.",
    });
  }
});

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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
