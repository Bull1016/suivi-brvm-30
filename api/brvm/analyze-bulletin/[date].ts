import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queryParam, checkRateLimit } from "../../../lib/brvm/http.js";
import { analyzeBulletin } from "../../../lib/brvm/service.js";

/** Returns a cached or newly generated analysis for the requested BRVM bulletin. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const platformIp = req.headers["x-vercel-forwarded-for"];
  const callerIp = (Array.isArray(platformIp) ? platformIp[0] : platformIp) || req.socket.remoteAddress;
  if (!(await checkRateLimit(callerIp))) {
    return res.status(429).json({ success: false, message: "Trop de requêtes. Veuillez patienter une minute." });
  }

  const dateCode = queryParam(req.query.date);
  const url = queryParam(req.query.url);

  try {
    const result = await analyzeBulletin(dateCode, url);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Erreur lors de la génération de l'analyse.",
    });
  }
}

export const config = {
  maxDuration: 60,
};
