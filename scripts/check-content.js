import fs from "fs";

async function test() {
  const sikaUrl = "https://www.sikafinance.com/marches/societe/BOAB.bj";
  try {
    const sikaRes = await fetch(sikaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    const html = await sikaRes.text();
    console.log("HTML length:", html.length);
    
    // Look for text around "présentation" or "société" or "activité"
    const lower = html.toLowerCase();
    const index = lower.indexOf("présentation");
    if (index !== -1) {
      console.log("Found 'présentation' at index:", index);
      console.log(html.substring(index - 100, index + 800));
    } else {
      console.log("'présentation' NOT found.");
    }

    const index2 = lower.indexOf("activité");
    if (index2 !== -1) {
      console.log("Found 'activité' at index:", index2);
      console.log(html.substring(index2 - 100, index2 + 800));
    }

    const index3 = lower.indexOf("profil");
    if (index3 !== -1) {
      console.log("Found 'profil' at index:", index3);
      console.log(html.substring(index3 - 100, index3 + 800));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
