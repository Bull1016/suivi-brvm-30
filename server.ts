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
const HOST = process.env.HOST || "0.0.0.0";
const TRUST_PROXY = Number(process.env.TRUST_PROXY ?? "1");

if (TRUST_PROXY && !process.env.REVERSE_PROXY) {
  console.warn("WARN: trust proxy is enabled without an explicit reverse-proxy flag; ensure Express sits behind a trusted proxy layer.");
}
app.set("trust proxy", TRUST_PROXY || 0);

const getCallerIp = (req: express.Request) => req.ip || req.socket.remoteAddress || "127.0.0.1";

app.use(express.json());

app.get("/api/brvm30/stocks", async (_req, res) => {
  try {
    const body = await listStocks();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    res.json(body);
  } catch (error) {
    console.error(error);
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ success: false, message: "Impossible de charger les cotations." });
  }
});

app.post("/api/brvm30/sync", async (req, res) => {
  try {
    const callerIp = getCallerIp(req);
    if (!(await checkRateLimit(`sync:${callerIp}`))) {
      return res.status(429).json({ success: false, message: "Trop de requêtes. Veuillez patienter avant la prochaine synchronisation." });
    }
    const result = await syncQuotations();
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur lors de la synchronisation." });
  }
});

app.post("/api/brvm30/sync-dividends/:symbol", async (req, res) => {
  try {
    const callerIp = getCallerIp(req);
    const result = await syncDividendsForSymbol(req.params.symbol, callerIp);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur lors de la synchronisation des dividendes." });
  }
});

app.get("/api/brvm30/company-description/:symbol/:country", async (req, res) => {
  try {
    const callerIp = getCallerIp(req);
    const result = await companyDescription(req.params.symbol, req.params.country, callerIp);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Impossible de générer la description." });
  }
});

app.get("/api/brvm/bulletins", async (_req, res) => {
  try {
    const bulletins = await scrapeOfficialBulletins();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.json({ success: true, bulletins });
  } catch (error) {
    console.error(error);
    res.setHeader("Cache-Control", "no-store");
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
    const callerIp = getCallerIp(req);
    const result = await analyzeBulletin(dateCode, url, callerIp);
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

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
