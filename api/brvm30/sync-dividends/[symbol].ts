import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queryParam } from "../../../lib/brvm/http";
import { syncDividendsForSymbol } from "../../../lib/brvm/service";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const symbol = queryParam(req.query.symbol);
  if (!symbol) {
    return res.status(400).json({ success: false, message: "Symbole manquant." });
  }

  const result = await syncDividendsForSymbol(symbol);
  return res.status(result.status).json(result.body);
}

export const config = {
  maxDuration: 60,
};
