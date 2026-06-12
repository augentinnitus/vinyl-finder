const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

function formatShopifyPrice(cents) {
  if (typeof cents !== "number") return null;
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function parseShopifyProducts(html) {
  const match = html.match(/var meta = (\{[\s\S]*?\});\s*(?:var cdn|for \(var attr in meta)/);
  if (!match) return [];

  try {
    const meta = JSON.parse(match[1]);
    return Array.isArray(meta.products) ? meta.products : [];
  } catch {
    return [];
  }
}

async function searchShopifyStore(shop, query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = `${shop.baseUrl}/search?q=${encodeURIComponent(trimmed)}&type=product`;
  const html = await fetchHtml(searchUrl);
  const results = [];
  const products = parseShopifyProducts(html);

  for (const product of products) {
    if (results.length >= limit) break;

    const variant = product.variants?.[0];
    const title = variant?.name || product.handle?.replace(/-/g, " ") || "";
    if (!title || !isVinylFormat(title)) continue;
    if (!titleMatchesQuery(title, trimmed)) continue;

    results.push({
      shop: shop.id,
      shopName: shop.name,
      title,
      price: formatShopifyPrice(variant?.price),
      format: "Vinyl / LP",
      url: `${shop.baseUrl}/products/${product.handle}`,
    });
  }

  return {
    shop: shop.id,
    shopName: shop.name,
    searchUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer mit passendem Titel gefunden.",
    results,
  };
}

module.exports = {
  formatShopifyPrice,
  parseShopifyProducts,
  searchShopifyStore,
};
