const SHOP = {
  id: "hhv",
  name: "HHV",
  baseUrl: "https://www.hhv.de",
};

function buildHhvSearchUrl(query) {
  const encoded = encodeURIComponent(query.trim());
  return `${SHOP.baseUrl}/katalog/filter/suche-S11?af=true&term=${encoded}`;
}

async function searchHhv(query) {
  const searchUrl = buildHhvSearchUrl(query);

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: "link_only",
    message:
      "HHV blockiert automatisierte Abfragen. Öffne die Suche direkt im Shop – dort findest du das komplette Vinyl-Sortiment.",
    results: [],
  };
}

module.exports = { searchHhv, SHOP };
