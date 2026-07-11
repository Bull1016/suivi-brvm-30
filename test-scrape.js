import dotenv from "dotenv";
dotenv.config();

async function test() {
  const sikaUrl = "https://www.sikafinance.com/marches/aaz";
  try {
    console.log("Fetching: " + sikaUrl);
    const res = await fetch(sikaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      }
    });
    console.log("Status: " + res.status);
    const html = await res.text();
    console.log("HTML length: " + html.length);
    console.log("Contains 'PALC': " + html.includes("PALC"));
    console.log("Contains 'Palm': " + html.includes("Palm"));
  } catch (e) {
    console.error("Scrape test failed:", e);
  }
}
test();
