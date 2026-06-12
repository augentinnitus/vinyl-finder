const { createLinkOnlySearch } = require("./linkonly");

const SHOP = {
  id: "kulturkaufhaus",
  name: "Dussmann Kulturkaufhaus",
  baseUrl: "https://www.kulturkaufhaus.de",
};

const searchKulturkaufhaus = createLinkOnlySearch(
  SHOP,
  (query) =>
    `${SHOP.baseUrl}/de/musik/vinyl?query=${encodeURIComponent(query.trim())}`,
  "Dussmann nutzt eine clientseitige Suche. Öffne die Vinyl-Abteilung und suche dort direkt."
);

module.exports = { searchKulturkaufhaus, SHOP };
