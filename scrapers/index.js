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
const { dedupeResults } = require("./utils");

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
];

async function searchAllShops(query, limitPerShop = 10) {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Bitte einen Band- oder Künstlernamen eingeben.");
  }

  const shopResults = await Promise.all(
    SHOPS.map(async (shop) => {
      try {
        return await shop.search(trimmed, limitPerShop);
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
  );

  const allResults = dedupeResults(shopResults.flatMap((entry) => entry.results));

  return {
    query: trimmed,
    searchedAt: new Date().toISOString(),
    totalResults: allResults.length,
    shops: shopResults,
    results: allResults,
  };
}

module.exports = { searchAllShops, SHOPS };
