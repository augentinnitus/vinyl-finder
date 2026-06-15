const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "imusic",
  name: "iMusic",
  baseUrl: "https://imusic.co",
};

async function searchImusic(query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = `${SHOP.baseUrl}/vinyl/search?query=${encodeURIComponent(trimmed)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $(".media.search-teaser").each((_, el) => {
    if (results.length >= limit) return false;

    const teaser = $(el);
    const link = teaser.find('a[href*="/music/"]').first();
    const href = link.attr("href");
    const title = (link.attr("title") || link.find("img").attr("alt") || "").replace(/\s+/g, " ").trim();
    if (!title || !href || seen.has(href)) return;
    if (!isVinylFormat(title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const price = teaser.find(".btn.price").first().text().replace(/\s+/g, " ").trim() || null;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price,
      format: "Vinyl / LP",
      url: href.startsWith("http") ? href : `${SHOP.baseUrl}${href}`,
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

module.exports = { searchImusic, SHOP };
