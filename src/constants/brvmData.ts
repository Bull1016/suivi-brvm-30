import composition from "../../data/brvm30-composition.json" with { type: "json" };

export interface SectorDetail {
  id: number;
  url: string;
  badgeBg: string;
  textHex: string;
  icon: string;
}

export const SECTOR_CONFIG: Record<string, SectorDetail> = {
  "Consommation de Base": {
    id: 194,
    url: "https://www.brvm.org/fr/cours-actions/194",
    badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-700",
    textHex: "#065f46",
    icon: "🌾"
  },
  "Consommation Discrétionnaire": {
    id: 195,
    url: "https://www.brvm.org/fr/cours-actions/195",
    badgeBg: "bg-purple-100 text-purple-900 border-purple-700",
    textHex: "#581c87",
    icon: "🛍️"
  },
  "Énergie": {
    id: 196,
    url: "https://www.brvm.org/fr/cours-actions/196",
    badgeBg: "bg-amber-100 text-amber-900 border-amber-700",
    textHex: "#78350f",
    icon: "⚡"
  },
  "Industriels": {
    id: 197,
    url: "https://www.brvm.org/fr/cours-actions/197",
    badgeBg: "bg-stone-200 text-stone-900 border-stone-700",
    textHex: "#292524",
    icon: "🏭"
  },
  "Services Financiers": {
    id: 198,
    url: "https://www.brvm.org/fr/cours-actions/198",
    badgeBg: "bg-blue-100 text-blue-900 border-blue-700",
    textHex: "#1e3a8a",
    icon: "🏦"
  },
  "Services Publics": {
    id: 199,
    url: "https://www.brvm.org/fr/cours-actions/199",
    badgeBg: "bg-teal-100 text-teal-900 border-teal-700",
    textHex: "#134e4a",
    icon: "💧"
  },
  "Télécommunications": {
    id: 200,
    url: "https://www.brvm.org/fr/cours-actions/200",
    badgeBg: "bg-rose-100 text-rose-900 border-rose-700",
    textHex: "#881337",
    icon: "📡"
  }
};

export const COUNTRIES_MAP: Record<string, { name: string; flag: string }> = {
  ci: { name: "Côte d'Ivoire", flag: "🇨🇮" },
  sn: { name: "Sénégal", flag: "🇸🇳" },
  bf: { name: "Burkina Faso", flag: "🇧🇫" },
  bj: { name: "Bénin", flag: "🇧🇯" },
  tg: { name: "Togo", flag: "🇹🇬" },
  ml: { name: "Mali", flag: "🇲🇱" },
  ne: { name: "Niger", flag: "🇳🇪" }
};

export const DEFAULT_SYMBOL_SECTOR_FALLBACK: Record<string, string> = Object.fromEntries(
  composition.stocks.map((s) => [s.symbol, s.sector])
);
