import type { BulletinItem } from "./types";
import { SCRAPE_HEADERS } from "./types";

const BULLETIN_PAGES = [
  "https://www.brvm.org/fr/bulletins-officiels-de-la-cote",
  "https://www.brvm.org/fr/bulletins-officiels-de-la-cote-boc",
  "https://www.brvm.org/fr/bulletins",
];

/** Resolves a bulletin link against the BRVM website. */
function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `https://www.brvm.org${href}`;
  return `https://www.brvm.org/${href}`;
}

/** Normalizes a candidate bulletin date to its eight-digit code. */
function formatDateCode(raw: string): string | null {
  const compact = raw.replace(/\D/g, "");
  if (compact.length !== 8) return null;

  const year = parseInt(compact.slice(0, 4), 10);
  const month = parseInt(compact.slice(4, 6), 10);
  const day = parseInt(compact.slice(6, 8), 10);

  // Validate calendar date ranges
  if (year < 2000 || year > 2030) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Additional validation for specific months
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Adjust for leap years
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeapYear && month === 2) {
    if (day > 29) return null;
  } else {
    if (day > daysInMonth[month - 1]) return null;
  }

  return compact;
}

/** Formats an eight-digit bulletin date code for display. */
function formatDateStr(dateCode: string): string {
  const validated = formatDateCode(dateCode);
  if (!validated) return dateCode; // Return original if invalid
  const y = validated.slice(0, 4);
  const m = validated.slice(4, 6);
  const d = validated.slice(6, 8);
  return `${d}/${m}/${y}`;
}

/** Validates that a URL matches the expected date code format. */
export function validateBulletinUrlForDateCode(url: string, dateCode: string): boolean {
  const validatedCode = formatDateCode(dateCode);
  if (!validatedCode) return false;
  
  const urlLower = url.toLowerCase();
  const codeLower = validatedCode.toLowerCase();
  
  // Check if the date code appears in the URL
  return urlLower.includes(codeLower);
}

/** Scrapes and returns the 30 most recent official BRVM bulletins. */
export async function scrapeOfficialBulletins(): Promise<BulletinItem[]> {
  const found = new Map<string, BulletinItem>();
  let anyPageSucceeded = false;

  for (const page of BULLETIN_PAGES) {
    try {
      const res = await fetch(page, { 
        headers: SCRAPE_HEADERS,
        signal: AbortSignal.timeout(10000)
      });
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
            const constructedDate = `${codeMatch[3]}${codeMatch[2]}${codeMatch[1]}`;
            dateCode = formatDateCode(constructedDate);
          } else if (codeMatch.length >= 4 && codeMatch[1]?.length === 4) {
            const constructedDate = `${codeMatch[1]}${codeMatch[2]}${codeMatch[3]}`;
            dateCode = formatDateCode(constructedDate);
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
      anyPageSucceeded = true;
      if (found.size > 0) break;
    } catch (err) {
      console.error(`Failed to scrape bulletins from ${page}:`, err);
    }
  }

  if (!anyPageSucceeded) {
    throw new Error("Aucune source de bulletin n'a pu être contactée avec succès.");
  }

  return [...found.values()].sort((a, b) => b.dateCode.localeCompare(a.dateCode)).slice(0, 30);
}
