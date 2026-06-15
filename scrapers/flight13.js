const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery, findImageUrl } = require("./utils");

const SHOP = {
  id: "flight13",
  name: "Flight 13",
  baseUrl: "https://www.flight13.com",
};

function pickVinylPrice(priceText = "") {
  const match = priceText.match(/(?:LP[^€\d]*|7"[^€\d]*|10"[^€\d]*)\d+,\d{2}€/i);
  return match?.[0]?.replace(/\*$/, "").trim() || null;
}

async function searchFlight13(query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = `${SHOP.baseUrl}/suchen?q=${encodeURIComponent(trimmed)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("article.article.highlight").each((_, el) => {
    if (results.length >= limit) return false;

    const article = $(el);
    const link = article.find("a.article-link").first();
    const href = link.attr("href");
    const alt = article.find("img.cover").attr("alt") || "";
    const heading = link.find("h3").text().replace(/\s+/g, " ").trim();
    const title = alt || heading;
    if (!title || !href || seen.has(href)) return;
    if (!isVinylFormat(title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const price = pickVinylPrice(article.find(".price").text().replace(/\s+/g, " "));

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price,
      format: "Vinyl / LP",
      url: href.startsWith("http") ? href : `${SHOP.baseUrl}${href}`,
      imageUrl: findImageUrl($, article, SHOP.baseUrl),
    });
  });

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer mit passendem Titel gefunden.",
    results,
  };
}

module.exports = { searchFlight13, SHOP };
