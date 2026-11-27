import { fetchBRVMSectors } from "../lib/brvm/scrape.js";
import { DEFAULT_SYMBOL_SECTOR_MAP } from "../lib/brvm/constants.js";

const symbols = ["BICB", "SIVC", "SEMC", "NEIC", "ORAC", "SAFC", "STAC", "STBC", "SCRC", "UNXC"];

const map = await fetchBRVMSectors();
for (const symbol of symbols) {
  const scraped = map[symbol];
  const coded = DEFAULT_SYMBOL_SECTOR_MAP[symbol];
  const status = !scraped ? "MISSING" : scraped === coded ? "OK" : "MISMATCH";
  console.log(`${symbol}\tcoded=${coded}\tscraped=${scraped ?? "-"}\t${status}`);
}
