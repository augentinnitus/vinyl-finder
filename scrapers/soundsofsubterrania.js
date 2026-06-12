const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "soundsofsubterrania",
  name: "Sounds of Subterrania",
  baseUrl: "https://shop.soundsofsubterrania.com",
  websiteUrl: "https://neu.soundsofsubterrania.com",
};

function isExcludedProduct(title = "") {
  return /\b(cd|dvd|shirt|hoodie|poster|buch|book|ticket|tape|kassette)\b/i.test(title);
}

async function searchSoundsOfSubterrania(query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = `${SHOP.baseUrl}/?s=${encodeURIComponent(trimmed)}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];

  $("article.product.type-product").each((_, el) => {
    if (results.length >= limit) return false;

    const article = $(el);
    const link = article.find("h2.entry-title a").first();
    const title = link.text().replace(/\s+/g, " ").trim();
    const href = link.attr("href");
    if (!title || !href) return;
    if (!titleMatchesQuery(title, trimmed)) return;
    if (isExcludedProduct(title) && !isVinylFormat(title)) return;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price: null,
      format: isVinylFormat(title) ? title.match(/\b(LP|7"|12"|10"|2xLP|3xLP)\b/i)?.[0] || "Vinyl" : "Vinyl",
      url: href,
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

module.exports = { searchSoundsOfSubterrania, SHOP };
