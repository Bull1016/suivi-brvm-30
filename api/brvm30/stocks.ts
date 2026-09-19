import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listStocks } from "../../lib/brvm/service.js";

/** Returns the current BRVM stock state and synchronization metadata. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const body = await listStocks();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(body);
  } catch (error) {
    console.error(error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({
      success: false,
      message: "Impossible de charger les cotations.",
    });
  }
}
