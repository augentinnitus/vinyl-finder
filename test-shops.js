const { searchAllShops } = require("./scrapers");

const query = process.argv[2] || "Terrorgruppe";

searchAllShops(query, 5)
  .then((data) => {
    console.log(`Query: ${data.query}, total: ${data.totalResults}`);
    for (const shop of data.shops) {
      console.log(
        `- ${shop.shopName}: ${shop.status} (${shop.results.length})`,
        shop.results[0]?.title || shop.message || ""
      );
    }
  })
  .catch(console.error);
