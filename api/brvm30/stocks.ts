import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listStocks } from "../../lib/brvm/service";

/** Returns the current BRVM stock state and synchronization metadata. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const body = await listStocks();
    return res.status(200).json(body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Impossible de charger les cotations.",
    });
  }
}
