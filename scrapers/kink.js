const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat } = require("./utils");

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
  const params = new URLSearchParams({
    main_page: "advanced_search_result",
    keywords: query.trim(),
    search_in_description: "1",
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

      const container = details.closest("tr, .productListing, .row").first();
      const titleFromAlt = container.find("img[alt]").first().attr("alt");
      if (!/\/Tontraeger\/Vinyl\//i.test(href)) return;

      const title = (titleFromAlt || titleFromKinkUrl(href) || "").trim();
      if (!title) return;

      seen.add(href);
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

  const queryLower = query.trim().toLowerCase();
  const titleMatches = results.filter((item) => item.title.toLowerCase().includes(queryLower));
  const finalResults = (titleMatches.length ? titleMatches : results).slice(0, limit);

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: finalResults.length ? "ok" : "empty",
    message: finalResults.length ? null : "Keine Vinyl-Treffer gefunden.",
    results: finalResults,
  };
}

module.exports = { searchKink, SHOP };
