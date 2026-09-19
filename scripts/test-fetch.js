async function test() {
  try {
    const sikaUrl = "https://www.sikafinance.com/marches/societe/BOAB.bj";
    console.log("Fetching: " + sikaUrl);
    const res = await fetch(sikaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    console.log("Response status: " + res.status);
    const html = await res.text();
    console.log("Response HTML length: " + html.length);
    console.log("Snippet: " + html.substring(0, 1000));
  } catch (e) {
    console.error("Error: ", e);
  }
}
test();
