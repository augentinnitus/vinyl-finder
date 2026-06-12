const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "wanda",
  name: "Wanda Records",
  baseUrl: "https://mailorder.wandarecords.de",
};

async function searchWanda(query, limit = 12) {
  const trimmed = query.trim();
  const params = new URLSearchParams({
    main_page: "advanced_search_result",
    keyword: trimmed,
  });
  const searchUrl = `${SHOP.baseUrl}/index.php?${params.toString()}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("h3.itemTitle a").each((_, el) => {
    if (results.length >= limit) return false;

    const link = $(el);
    const title = link.text().replace(/\s+/g, " ").trim();
    const href = link.attr("href");
    if (!title || !href || seen.has(href)) return;
    if (!isVinylFormat(title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const row = link.closest("tr");
    const price = row.text().match(/€\s*[\d.,]+/)?.[0]?.replace(/\s+/g, "") || null;

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

module.exports = { searchWanda, SHOP };
