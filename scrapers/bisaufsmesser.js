const { searchShopifyStore } = require("./shopify");

const SHOP = {
  id: "bisaufsmesser",
  name: "Bis Aufs Messer",
  baseUrl: "https://bisaufsmesser.com",
};

async function searchBisAufsMesser(query, limit = 12) {
  return searchShopifyStore(SHOP, query, limit);
}

module.exports = { searchBisAufsMesser, SHOP };
