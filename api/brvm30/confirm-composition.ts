import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isCronAuthorized } from "../../lib/brvm/http.js";
import { confirmComposition } from "../../lib/brvm/service.js";

/**
 * Activates a composition candidate extracted from an official avis.
 * Never triggered by the public "Actualiser" button: it requires the CRON_SECRET
 * authorization header, so only an authenticated operator can change the index composition.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  if (!isCronAuthorized(req)) {
    console.warn("Composition confirmation unauthorized: invalid CRON_SECRET authorization header.");
    return res.status(401).json({ success: false, message: "Non autorisé. Jeton CRON_SECRET invalide." });
  }

  const rawId = req.body?.id;
  const id = typeof rawId === "string" ? rawId.trim() : "";

  try {
    const result = await confirmComposition(id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Composition confirmation error:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la confirmation de la composition." });
  }
}

export const config = {
  maxDuration: 60,
};
