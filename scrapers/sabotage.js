const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat } = require("./utils");

const SHOP = {
  id: "sabotage",
  name: "Sabotage Records",
  baseUrl: "https://sabotagerecords-shop.net",
};

function formatShopifyPrice(cents) {
  if (typeof cents !== "number") return null;
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function parseShopifyProducts(html) {
  const match = html.match(/var meta = (\{[\s\S]*?\});\s*var cdn/);
  if (!match) return [];

  try {
    const meta = JSON.parse(match[1]);
    return Array.isArray(meta.products) ? meta.products : [];
  } catch {
    return [];
  }
}

async function searchSabotage(query, limit = 12) {
  const searchUrl = `${SHOP.baseUrl}/search?q=${encodeURIComponent(query.trim())}&type=product`;
  const html = await fetchHtml(searchUrl);
  const results = [];
  const products = parseShopifyProducts(html);

  for (const product of products) {
    if (results.length >= limit) break;

    const variant = product.variants?.[0];
    const title = variant?.name || product.handle?.replace(/-/g, " ") || "";
    if (!title || !isVinylFormat(title)) continue;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price: formatShopifyPrice(variant?.price),
      format: "Vinyl / LP",
      url: `${SHOP.baseUrl}/products/${product.handle}`,
    });
  }

  if (!results.length) {
    const $ = cheerio.load(html);
    $("li.grid__item").each((_, el) => {
      if (results.length >= limit) return false;

      const card = $(el);
      const link = card.find(".card__heading a").first();
      const title = link.text().replace(/\s+/g, " ").trim();
      const href = link.attr("href");
      if (!title || !href || !isVinylFormat(title)) return;

      const price = card.find(".price-item--regular").first().text().replace(/\s+/g, " ").trim() || null;

      results.push({
        shop: SHOP.id,
        shopName: SHOP.name,
        title,
        price,
        format: "Vinyl / LP",
        url: href.startsWith("http") ? href : `${SHOP.baseUrl}${href}`,
      });
    });
  }

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer gefunden.",
    results,
  };
}

module.exports = { searchSabotage, SHOP };
