const cheerio = require("cheerio");
const { fetchHtml } = require("./utils");

const SHOP = {
  id: "kink",
  name: "Kink Records",
  baseUrl: "https://www.kink-records.de/catalog",
};

function titleFromKinkUrl(url = "") {
  const match = url.match(/\/([^/]+)::\d+\.html/i);
  if (!match) return null;
  return match[1].replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

async function searchKink(query, limit = 12) {
  const queryLower = query.trim().toLowerCase();
  const params = new URLSearchParams({
    main_page: "advanced_search_result",
    keywords: query.trim(),
    categories_id: "22",
    inc_subcat: "1",
  });
  const searchUrl = `${SHOP.baseUrl}/index.php?${params.toString()}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("a")
    .filter((_, el) => $(el).text().trim() === "Details")
    .each((_, el) => {
      if (results.length >= limit) return false;

      const details = $(el);
      const href = details.attr("href");
      if (!href || seen.has(href)) return;
      if (!/\/Tontraeger\/Vinyl\//i.test(href)) return;

      const title = (titleFromKinkUrl(href) || "").trim();
      if (!title || !title.toLowerCase().includes(queryLower)) return;

      seen.add(href);
      const container = details.closest("tr, .productListing, .row").first();
      const price = container.text().match(/\d+,\d{2}\s*EUR/)?.[0] || null;

      results.push({
        shop: SHOP.id,
        shopName: SHOP.name,
        title,
        price,
        format: "Vinyl / LP",
        url: href.startsWith("http") ? href : `${SHOP.baseUrl}/${href.replace(/^\//, "")}`,
      });
    });

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer mit passendem Titel gefunden.",
    results,
  };
}

module.exports = { searchKink, SHOP };
