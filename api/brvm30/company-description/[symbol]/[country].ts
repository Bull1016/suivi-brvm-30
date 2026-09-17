import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queryParam } from "../../../../lib/brvm/http.js";
import { companyDescription } from "../../../../lib/brvm/service.js";

/** Returns a cached, generated, or fallback description for a listed company. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const symbol = queryParam(req.query.symbol);
  const country = queryParam(req.query.country);
  if (!symbol || !country) {
    return res.status(400).json({ success: false, message: "Symbole ou pays manquant." });
  }

  try {
    const body = await companyDescription(symbol, country);
    return res.status(200).json(body);
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
