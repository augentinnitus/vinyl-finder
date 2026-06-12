const { createLinkOnlySearch } = require("./linkonly");

const SHOP = {
  id: "coretex",
  name: "Coretex Records",
  baseUrl: "https://coretexrecords.com",
};

const searchCoretex = createLinkOnlySearch(
  SHOP,
  (query) => `${SHOP.baseUrl}/search?q=${encodeURIComponent(query.trim())}`,
  "Coretex blockiert automatisierte Abfragen. Öffne die Suche direkt im Shop."
);

module.exports = { searchCoretex, SHOP };
