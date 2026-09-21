import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queryParam } from "../../../lib/brvm/http.js";
import { syncDividendsForSymbol } from "../../../lib/brvm/service.js";

/** Synchronizes dividend history for the requested BRVM symbol. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const platformIp = req.headers["x-vercel-forwarded-for"];
  const callerIp = (Array.isArray(platformIp) ? platformIp[0] : platformIp) || req.socket.remoteAddress;

  const symbol = queryParam(req.query.symbol);
  if (!symbol) {
    return res.status(400).json({ success: false, message: "Symbole manquant." });
  }

  try {
    const result = await syncDividendsForSymbol(symbol, callerIp);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la synchronisation des dividendes.",
    });
  }
}

export const config = {
  maxDuration: 60,
};
