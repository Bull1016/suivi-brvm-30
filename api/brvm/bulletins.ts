import type { VercelRequest, VercelResponse } from "@vercel/node";
import { scrapeOfficialBulletins } from "../../lib/brvm/bulletins";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Méthode non autorisée." });
  }

  try {
    const bulletins = await scrapeOfficialBulletins();
    return res.status(200).json({
      success: true,
      bulletins,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger les bulletins de la cote.",
    });
  }
}

export const config = {
  maxDuration: 60,
};
