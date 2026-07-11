import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
dotenv.config();

async function test() {
  const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
  if (!ai) {
    console.error("No API key configured!");
    return;
  }

  const symbol = "BOAB";
  const name = "Bank of Africa Bénin";
  const country = "BJ";

  console.log(`Generating description for ${name} (${symbol})...`);
  try {
    const prompt = `Provide a professional, detailed, and informative company description in French of 2 to 3 paragraphs for the BRVM-listed company "${name}" (symbol: ${symbol}, country: ${country.toUpperCase()}). Describe its primary business sector (e.g. banking, telecommunications, agriculture), its history, its products/services, and its significance in the WAEMU (UEMOA) regional market. Return ONLY a JSON object with a single 'description' string property.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING }
          },
          required: ["description"]
        }
      }
    });

    console.log("Success! Response:");
    console.log(JSON.parse(response.text));
  } catch (e) {
    console.error("Failed:", e);
  }
}
test();
