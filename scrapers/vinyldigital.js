const { createLinkOnlySearch } = require("./linkonly");

const SHOP = {
  id: "vinyldigital",
  name: "Vinyl Digital",
  baseUrl: "https://www.vinyl-digital.com",
};

const searchVinylDigital = createLinkOnlySearch(
  SHOP,
  (query) => `${SHOP.baseUrl}/de/search?sSearch=${encodeURIComponent(query.trim())}`,
  "Vinyl Digital blockiert automatisierte Abfragen. Öffne die Suche direkt im Shop."
);

module.exports = { searchVinylDigital, SHOP };
