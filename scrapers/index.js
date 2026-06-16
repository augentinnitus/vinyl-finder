const { searchGreenHell } = require("./greenhell");
const { searchJpc } = require("./jpc");
const { searchHhv } = require("./hhv");
const { searchKink } = require("./kink");
const { searchPlasticBomb } = require("./plasticbomb");
const { searchSoundsOfSubterrania } = require("./soundsofsubterrania");
const { searchSabotage } = require("./sabotage");
const { searchBisAufsMesser } = require("./bisaufsmesser");
const { searchWanda } = require("./wanda");
const { searchSoundflat } = require("./soundflat");
const { searchGlitterhouse } = require("./glitterhouse");
const { searchCoretex } = require("./coretex");
const { searchRoughTrade } = require("./roughtrade");
const { searchKulturkaufhaus } = require("./kulturkaufhaus");
const { searchFlight13 } = require("./flight13");
const { searchImusic } = require("./imusic");
const { searchThalia } = require("./thalia");
const { searchVinylDigital } = require("./vinyldigital");
const { searchElfenart } = require("./elfenart");
const { dedupeResults, titleMatchesSearch, buildDiscogsUrl } = require("./utils");

const SHOPS = [
  { id: "greenhell", name: "Green Hell", search: searchGreenHell },
  { id: "jpc", name: "jpc.de", search: searchJpc },
  { id: "hhv", name: "HHV", search: searchHhv },
  { id: "kink", name: "Kink Records", search: searchKink },
  { id: "plasticbomb", name: "Plastic Bomb", search: searchPlasticBomb },
  { id: "soundsofsubterrania", name: "Sounds of Subterrania", search: searchSoundsOfSubterrania },
  { id: "sabotage", name: "Sabotage Records", search: searchSabotage },
  { id: "bisaufsmesser", name: "Bis Aufs Messer", search: searchBisAufsMesser },
  { id: "wanda", name: "Wanda Records", search: searchWanda },
  { id: "soundflat", name: "Soundflat", search: searchSoundflat },
  { id: "glitterhouse", name: "Glitterhouse", search: searchGlitterhouse },
  { id: "coretex", name: "Coretex Records", search: searchCoretex },
  { id: "roughtrade", name: "Rough Trade", search: searchRoughTrade },
  { id: "kulturkaufhaus", name: "Dussmann Kulturkaufhaus", search: searchKulturkaufhaus },
  { id: "flight13", name: "Flight 13", search: searchFlight13 },
  { id: "imusic", name: "iMusic", search: searchImusic },
  { id: "thalia", name: "Thalia", search: searchThalia },
  { id: "vinyldigital", name: "Vinyl Digital", search: searchVinylDigital },
  { id: "elfenart", name: "Elfenart Mailorder", search: searchElfenart },
];

function refineShopResult(shopResult, search) {
  const results = shopResult.results.filter((item) =>
    titleMatchesSearch(item.title, search)
  );

  let status = shopResult.status;
  let message = shopResult.message;

  if (status === "ok" && !results.length) {
    status = "empty";
    message = search.album
      ? "Keine Vinyl-Treffer mit passendem Band- und Albumnamen gefunden."
      : "Keine Vinyl-Treffer mit passendem Titel gefunden.";
  }

  return {
    ...shopResult,
    status,
    message,
    results,
  };
}

async function searchAllShops({ band, album }, limitPerShop = 10) {
  const trimmedBand = band.trim();
  const trimmedAlbum = (album || "").trim();

  if (!trimmedBand) {
    throw new Error("Bitte einen Band- oder Künstlernamen eingeben.");
  }

  const shopQuery = trimmedAlbum ? `${trimmedBand} ${trimmedAlbum}` : trimmedBand;
  const search = { band: trimmedBand, album: trimmedAlbum };

  const shopResults = (
    await Promise.all(
      SHOPS.map(async (shop) => {
        try {
          const result = await shop.search(shopQuery, limitPerShop);
          return refineShopResult(result, search);
        } catch (error) {
          return {
            shop: shop.id,
            shopName: shop.name,
            searchUrl: null,
            status: "error",
            message: error.message || "Shop konnte nicht abgefragt werden.",
            results: [],
          };
        }
      })
    )
  );

  const allResults = dedupeResults(shopResults.flatMap((entry) => entry.results));

  return {
    band: trimmedBand,
    album: trimmedAlbum || null,
    query: shopQuery,
    searchedAt: new Date().toISOString(),
    totalResults: allResults.length,
    discogsUrl: buildDiscogsUrl(trimmedBand, trimmedAlbum),
    shops: shopResults,
    results: allResults,
  };
}

module.exports = { searchAllShops, SHOPS };
