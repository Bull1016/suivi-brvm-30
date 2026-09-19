import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queryParam, checkRateLimit } from "../../../../lib/brvm/http.js";
import { companyDescription } from "../../../../lib/brvm/service.js";

/** Returns a cached, generated, or fallback description for a listed company. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const platformIp = req.headers["x-vercel-forwarded-for"];
  const callerIp = (Array.isArray(platformIp) ? platformIp[0] : platformIp) || req.socket.remoteAddress;
  if (!(await checkRateLimit(callerIp))) {
    return res.status(429).json({ success: false, message: "Trop de requêtes. Veuillez patienter une minute." });
  }

  const symbol = queryParam(req.query.symbol);
  const country = queryParam(req.query.country);
  if (!symbol || !country) {
    return res.status(400).json({ success: false, message: "Symbole ou pays manquant." });
  }

  try {
    const result = await companyDescription(symbol, country);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Impossible de générer la description.",
    });
  }
}

export const config = {
  maxDuration: 60,
};
