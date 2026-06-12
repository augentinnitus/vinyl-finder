const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "giveemhell",
  name: "Give Em Hell",
  baseUrl: "https://give-em-hell.com",
};

function isExcludedProduct(title = "") {
  return /\b(button|shirt|hoodie|patch|poster|sticker|mug|cap|beanie|tote)\b/i.test(title);
}

async function searchGiveEmHell(query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = `${SHOP.baseUrl}/?s=${encodeURIComponent(trimmed)}&post_type=product`;
  const html = await fetchHtml(searchUrl);

  if (!html.includes("search-results")) {
    return {
      shop: SHOP.id,
      shopName: SHOP.name,
      searchUrl,
      status: "empty",
      message: "Keine Vinyl-Treffer mit passendem Titel gefunden.",
      results: [],
    };
  }

  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("li.product.type-product").each((_, el) => {
    if (results.length >= limit) return false;

    const card = $(el);
    const titleLink = card.find(".fusion-title-heading a, .fusion-rollover-title-link").first();
    const wrapper = card.find("a.fusion-link-wrapper[href*='/produkt/']").first();
    const title =
      titleLink.text().replace(/\s+/g, " ").trim() ||
      card.find(".fusion-title-heading").first().text().replace(/\s+/g, " ").trim() ||
      wrapper.attr("aria-label")?.replace(/\s+/g, " ").trim() ||
      "";
    const href = titleLink.attr("href") || wrapper.attr("href");
    if (!title || !href || seen.has(href)) return;
    if (isExcludedProduct(title) && !isVinylFormat(title)) return;
    if (!isVinylFormat(title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const price = card.find(".price, .woocommerce-Price-amount").first().text().replace(/\s+/g, " ").trim() || null;

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

module.exports = { searchGiveEmHell, SHOP };
