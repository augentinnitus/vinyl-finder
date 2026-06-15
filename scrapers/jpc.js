const cheerio = require("cheerio");
const { isVinylFormat, titleMatchesQuery, findImageUrl } = require("./utils");

const SHOP = {
  id: "jpc",
  name: "jpc.de",
  baseUrl: "https://www.jpc.de",
};

async function searchJpc(query, limit = 12) {
  const trimmed = query.trim();
  const body = new URLSearchParams({
    fastsearch: trimmed,
    pd_orderby: "score",
    rubric: "vinyl",
  });

  const response = await fetch(`${SHOP.baseUrl}/jpcng/home/search`, {
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Language": "de-DE,de;q=0.9",
    },
    body: body.toString(),
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} für jpc.de`);
  }

  const html = await response.text();
  const finalUrl = response.url;
  const $ = cheerio.load(html);
  const results = [];

  $("[id^='result-searchng-product']").each((_, el) => {
    if (results.length >= limit) return false;

    const card = $(el);
    const link = card.find("h3 a").first();
    const href = link.attr("href");
    const artist = card.find(".by").first().text().replace(/\s+/g, " ").trim();
    const album = card.find(".title").first().text().replace(/\s+/g, " ").trim();
    const medium = card.find(".medium").first().text().replace(/\s+/g, " ").trim();
    const price = card.find(".price b").first().text().replace(/\s+/g, " ").trim();

    if (!href || !album) return;
    if (!isVinylFormat(medium || album)) return;

    const title = artist ? `${artist} – ${album}` : album;
    if (!titleMatchesQuery(title, trimmed)) return;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price: price || null,
      format: medium || "LP",
      url: href.startsWith("http") ? href : `${SHOP.baseUrl}${href}`,
      imageUrl: findImageUrl($, card, SHOP.baseUrl),
    });
  });

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl: finalUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer mit passendem Titel gefunden.",
    results,
  };
}

module.exports = { searchJpc, SHOP };
