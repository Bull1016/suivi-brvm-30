import type { VercelRequest, VercelResponse } from "@vercel/node";
import { queryParam } from "../../../lib/brvm/http";
import { getBulletinAnalysis, saveBulletinAnalysis } from "../../../lib/brvm/store";
import { analyzeBulletinWithGemini } from "../../../lib/brvm/gemini";
import { validateBulletinUrlForDateCode } from "../../../lib/brvm/bulletins";

/** Returns a cached or newly generated analysis for the requested BRVM bulletin. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  const dateCode = queryParam(req.query.date);
  const url = queryParam(req.query.url);
  if (!dateCode || !url) {
    return res.status(400).json({
      success: false,
      message: "Date ou URL du bulletin manquante.",
    });
  }

  try {
    const cached = await getBulletinAnalysis(dateCode);
    if (cached) {
      return res.status(200).json({
        success: true,
        analysis: cached.analysis,
        sources: cached.sources,
        source: "cache",
      });
    }

    if (!validateBulletinUrlForDateCode(url, dateCode)) {
      return res.status(400).json({
        success: false,
        message: "L'URL fournie ne correspond pas à la date du bulletin.",
      });
    }

    const result = await analyzeBulletinWithGemini(dateCode, url);
    await saveBulletinAnalysis(dateCode, result);
    return res.status(200).json({
      success: true,
      analysis: result.analysis,
      sources: result.sources,
    });
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
