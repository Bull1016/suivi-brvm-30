import { GoogleGenAI, Type } from "@google/genai";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

let ai: GoogleGenAI | null | undefined;

/** Returns the lazily initialized Gemini client when an API key is configured. */
export function getGemini(): GoogleGenAI | null {
  if (ai !== undefined) return ai;
  if (!process.env.GEMINI_API_KEY) {
    ai = null;
    return ai;
  }
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  return ai;
}

/** Generates a French company description with Gemini when the client is available. */
export async function generateCompanyDescription(
  companyName: string,
  symbol: string,
  country: string
): Promise<string | null> {
  const client = getGemini();
  if (!client) return null;

  const prompt = `Provide a professional, realistic, and highly informative company description in French of 1 to 3 paragraphs for the BRVM-listed company "${companyName}" (symbol: ${symbol}, country: ${country.toUpperCase()}). Describe its primary business sector (e.g. banking, telecommunications, agriculture, energy, etc.), its history, its services, and its position on the regional market. Return ONLY a JSON object with a single 'description' string property.`;

  const geminiResponse = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
        },
        required: ["description"],
      },
    },
  });

  const resultObj = JSON.parse(geminiResponse.text?.trim() || "{}") as { description?: string };
  if (resultObj.description && resultObj.description.trim().length > 10) {
    return resultObj.description.trim();
  }
  return null;
}

/**
 * Extracts the BRVM 30 composition from an official avis PDF.
 * The result is intentionally untyped: it is always validated mechanically
 * before being turned into a candidate (see `validateCompositionPayload`).
 */
export async function extractCompositionFromAvis(pdfUrl: string): Promise<unknown> {
  const client = getGemini();
  if (!client) {
    throw new Error("GEMINI_API_KEY n'est pas configurée.");
  }

  const prompt = `Tu lis un avis officiel de la BRVM (Bourse Régionale des Valeurs Mobilières) disponible ici : ${pdfUrl}.
Extrait la nouvelle composition de l'indice BRVM 30 annoncée par cet avis.
Règles strictes :
- Retourne exactement 30 titres, sans invention : si le document ne contient pas la liste complète, retourne seulement ce que tu lis réellement.
- Le symbole est le code BRVM du titre (ex. SNTS, SGBC), en majuscules, sans espace.
- Le pays est le code ISO à deux lettres en minuscules (ci, sn, bf, tg, bj, ml, ne).
- Le secteur doit être exactement l'un de : "Consommation de Base", "Consommation Discrétionnaire", "Énergie", "Industriels", "Services Financiers", "Services Publics", "Télécommunications".
- "avis" est le numéro d'avis tel qu'imprimé (ex. "191-2026") et "date" sa date au format AAAA-MM-JJ.`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      tools: [{ urlContext: { url: pdfUrl } }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          avis: { type: Type.STRING },
          date: { type: Type.STRING },
          stocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                name: { type: Type.STRING },
                country: { type: Type.STRING },
                sector: { type: Type.STRING },
              },
              required: ["symbol", "name", "country", "sector"],
            },
          },
        },
        required: ["avis", "date", "stocks"],
      },
    },
  });

  const text = response.text?.trim() || "";
  if (!text) {
    throw new Error("Gemini n'a extrait aucune composition de l'avis.");
  }

  return JSON.parse(text) as unknown;
}

/** Generates a sourced Markdown analysis for a BRVM bulletin. */
export async function analyzeBulletinWithGemini(dateCode: string, pdfUrl: string) {
  const client = getGemini();
  if (!client) {
    throw new Error("GEMINI_API_KEY n'est pas configurée.");
  }

  const prompt = `Tu es un analyste financier de la Bourse Régionale des Valeurs Mobilières (BRVM).
Analyse le Bulletin Officiel de la Cote (BOC) du ${dateCode} disponible ici : ${pdfUrl}.
Rédige en français un rapport structuré (markdown) couvrant :
- indices (BRVM Composite, BRVM 30) et variations
- volumes et valeurs échangés
- principales hausses / baisses
- obligations et détachements de dividendes s'ils sont mentionnés
- faits saillants de la séance
Cite uniquement des informations cohérentes avec un BOC BRVM.`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }, { urlContext: { url: pdfUrl } }],
    },
  });

  const analysis = response.text?.trim() || "";
  if (!analysis) {
    throw new Error("Gemini n'a renvoyé aucune analyse.");
  }

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources: { title: string; uri: string }[] = [];
  for (const chunk of chunks) {
    const web = (chunk as { web?: { title?: string; uri?: string } }).web;
    if (web?.uri) {
      sources.push({ title: web.title || web.uri, uri: web.uri });
    }
  }

  return { analysis, sources };
}
