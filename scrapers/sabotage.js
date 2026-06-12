const { searchShopifyStore } = require("./shopify");

const SHOP = {
  id: "sabotage",
  name: "Sabotage Records",
  baseUrl: "https://sabotagerecords-shop.net",
};

async function searchSabotage(query, limit = 12) {
  return searchShopifyStore(SHOP, query, limit);
}

module.exports = { searchSabotage, SHOP };
