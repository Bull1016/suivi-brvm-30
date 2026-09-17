import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isCronAuthorized } from "../../lib/brvm/http.js";
import { syncQuotations } from "../../lib/brvm/service.js";

/** Synchronizes BRVM quotations for manual requests or authorized cron invocations. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || "GET";

  if (method === "GET") {
    if (!isCronAuthorized(req)) {
      return res.status(401).json({ success: false, message: "Non autorisé." });
    }
  } else if (method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const result = await syncQuotations();
  return res.status(result.status).json(result.body);
}

export const config = {
  maxDuration: 60,
};
