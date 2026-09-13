import type { BulletinItem } from "./types";
import { SCRAPE_HEADERS } from "./types";

const BULLETIN_PAGES = [
  "https://www.brvm.org/fr/bulletins-officiels-de-la-cote",
  "https://www.brvm.org/fr/bulletins-officiels-de-la-cote-boc",
  "https://www.brvm.org/fr/bulletins",
];

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://www.brvm.org${href}`;
  return `https://www.brvm.org/${href}`;
}

function formatDateCode(raw: string): string | null {
  const compact = raw.replace(/\D/g, "");
  if (compact.length === 8) return compact;
  return null;
}

function formatDateStr(dateCode: string): string {
  const y = dateCode.slice(0, 4);
  const m = dateCode.slice(4, 6);
  const d = dateCode.slice(6, 8);
  return `${d}/${m}/${y}`;
}

export async function scrapeOfficialBulletins(): Promise<BulletinItem[]> {
  const found = new Map<string, BulletinItem>();

  for (const page of BULLETIN_PAGES) {
    try {
      const res = await fetch(page, { headers: SCRAPE_HEADERS });
      if (!res.ok) continue;
      const html = await res.text();
      const hrefRegex = /href=["']([^"']+\.pdf[^"']*)["']/gi;
      let match: RegExpExecArray | null;
      while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1].replace(/&amp;/g, "&");
        const url = absoluteUrl(href);
        const codeMatch =
          url.match(/(\d{8})/) ||
          href.match(/(\d{2})[._-](\d{2})[._-](\d{4})/) ||
          href.match(/(\d{4})[._-](\d{2})[._-](\d{2})/);
        let dateCode: string | null = null;
        if (codeMatch) {
          if (codeMatch[1]?.length === 8) {
            dateCode = formatDateCode(codeMatch[1]);
          } else if (codeMatch.length >= 4 && codeMatch[3]?.length === 4) {
            dateCode = `${codeMatch[3]}${codeMatch[2]}${codeMatch[1]}`;
          } else if (codeMatch.length >= 4 && codeMatch[1]?.length === 4) {
            dateCode = `${codeMatch[1]}${codeMatch[2]}${codeMatch[3]}`;
          }
        }
        if (!dateCode) continue;
        if (!found.has(dateCode)) {
          found.set(dateCode, {
            dateCode,
            dateStr: formatDateStr(dateCode),
            url,
          });
        }
      }
      if (found.size > 0) break;
    } catch (err) {
      console.error(`Failed to scrape bulletins from ${page}:`, err);
    }
  }

  return [...found.values()].sort((a, b) => b.dateCode.localeCompare(a.dateCode)).slice(0, 30);
}
