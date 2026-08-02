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

export const DEFAULT_SYMBOL_SECTOR_FALLBACK: Record<string, string> = {
  SNTS: "Télécommunications",
  SGBC: "Services Financiers",
  CBIB: "Services Financiers",
  CBIBF: "Services Financiers",
  ETIT: "Services Financiers",
  BOAB: "Services Financiers",
  BOABF: "Services Financiers",
  BOAC: "Services Financiers",
  BOAN: "Services Financiers",
  BOAS: "Services Financiers",
  BOAM: "Services Financiers",
  ONTB: "Télécommunications",
  ONTBF: "Télécommunications",
  SIBC: "Services Financiers",
  ECOC: "Services Financiers",
  NSBC: "Services Financiers",
  PALC: "Consommation de Base",
  TTLC: "Énergie",
  TTLS: "Énergie",
  CIEC: "Services Publics",
  SDCC: "Services Publics",
  SOGC: "Consommation de Base",
  SPHC: "Consommation de Base",
  NTLC: "Consommation de Base",
  BICC: "Services Financiers",
  CFAC: "Consommation Discrétionnaire",
  BNBC: "Consommation Discrétionnaire",
  SDVC: "Industriels",
  SHEC: "Énergie",
  ABJC: "Consommation Discrétionnaire",
  SLBC: "Consommation de Base",
  FTSC: "Industriels",
  ORGT: "Services Financiers"
};
