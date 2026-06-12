const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "soundflat",
  name: "Soundflat",
  baseUrl: "https://www.soundflat.de",
};

async function searchSoundflat(query, limit = 12) {
  const trimmed = query.trim();
  const slug = encodeURIComponent(trimmed.toLowerCase());
  const searchUrl = `${SHOP.baseUrl}/suche/${slug}/?search=${encodeURIComponent(trimmed)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("#product-search h4.name a, .product-layout h4.name a").each((_, el) => {
    if (results.length >= limit) return false;

    const link = $(el);
    const title = link.text().replace(/\s+/g, " ").trim();
    const href = link.attr("href");
    if (!title || !href || seen.has(href)) return;
    if (!isVinylFormat(title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const price = link.closest(".product-layout, .caption").find("p.price").first().text().trim() || null;

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

module.exports = { searchSoundflat, SHOP };
