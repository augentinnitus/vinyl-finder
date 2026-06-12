const { createLinkOnlySearch } = require("./linkonly");

const SHOP = {
  id: "roughtrade",
  name: "Rough Trade",
  baseUrl: "https://www.roughtrade.com/de",
};

const searchRoughTrade = createLinkOnlySearch(
  SHOP,
  (query) => `${SHOP.baseUrl}/search?q=${encodeURIComponent(query.trim())}`,
  "Rough Trade blockiert automatisierte Abfragen. Öffne die Suche direkt im Shop."
);

module.exports = { searchRoughTrade, SHOP };
