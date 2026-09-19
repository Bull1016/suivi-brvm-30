import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
dotenv.config();

function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/style="[^"]*"/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function test() {
  console.log("GEMINI_API_KEY length: " + (process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0));
  const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
  if (!ai) {
    console.error("No API key configured!");
    return;
  }

  const sikaUrl = "https://www.sikafinance.com/marches/societe/BOAB.bj";
  try {
    const sikaRes = await fetch(sikaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    if (sikaRes.ok) {
      const html = await sikaRes.text();
      const cleaned = cleanHtml(html);
      console.log("Cleaned HTML length:", cleaned.length);

      console.log("Calling Gemini to extract description...");
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: `Extract the descriptive text or summary about the company (such as its core activity, business description, background, presentation) from this Sika Finance HTML in French. Synthesize it into 1 to 3 elegant, informative, and professional paragraphs of company summary. Avoid system noise, advertisements, or menu labels. Respond with a simple JSON object containing a single 'description' string property.` },
          { text: cleaned }
        ],
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

      console.log("Gemini Response text:", geminiResponse.text);
    } else {
      console.log("Res not ok:", sikaRes.status);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}
test();
