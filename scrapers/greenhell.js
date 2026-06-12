const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat } = require("./utils");

const SHOP = {
  id: "greenhell",
  name: "Green Hell",
  baseUrl: "https://greenhell.de",
};

async function searchGreenHell(query, limit = 12) {
  const encoded = encodeURIComponent(query.trim());
  const searchUrl = `${SHOP.baseUrl}/?suche=${encoded}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];

  $(".product-wrapper[itemtype='https://schema.org/Product']").each((_, el) => {
    if (results.length >= limit) return false;

    const root = $(el);
    const link = root.find(".productbox-title a").first();
    const title = link.text().replace(/\s+/g, " ").trim();
    const href = link.attr("href");
    if (!title || !href) return;

    const rawPrice =
      root.find(".productbox-price .second-range-price").first().text() ||
      root.find(".productbox-price").first().text();
    const price = rawPrice.replace(/\s+/g, " ").replace(/\*/g, "").trim() || null;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price: price || null,
      url: href.startsWith("http") ? href : `${SHOP.baseUrl}${href}`,
      format: "Vinyl / LP",
    });
  });

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer gefunden.",
    results,
  };
}

module.exports = { searchGreenHell, SHOP };
