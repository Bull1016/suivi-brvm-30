import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isCronAuthorized } from "../../lib/brvm/http";
import { syncDividendsBatch } from "../../lib/brvm/service";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  if (req.method === "GET" && !isCronAuthorized(req)) {
    return res.status(401).json({ success: false, message: "Non autorisé." });
  }

  const result = await syncDividendsBatch(2);
  return res.status(200).json(result);
}

export const config = {
  maxDuration: 60,
};
