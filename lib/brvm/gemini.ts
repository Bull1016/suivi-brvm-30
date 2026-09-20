import { GoogleGenAI, Type } from "@google/genai";

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
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
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
    model: "gemini-3.8-live",
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
    model: "gemini-3.8-live",
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
