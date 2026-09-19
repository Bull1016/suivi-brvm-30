import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isCronAuthorized } from "../../lib/brvm/http.js";
import { syncDividendsBatch } from "../../lib/brvm/service.js";

/** Synchronizes the next dividend batch when invoked manually or by an authorized cron. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  if (!isCronAuthorized(req)) {
    console.warn("Cron invocation unauthorized: missing or invalid CRON_SECRET authorization header.");
    return res.status(401).json({ success: false, message: "Non autorisé. Jeton CRON_SECRET invalide." });
  }

  try {
    const result = await syncDividendsBatch(2);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Cron dividend sync failed:", error);
    return res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export const config = {
  maxDuration: 60,
};
