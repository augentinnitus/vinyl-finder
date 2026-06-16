const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery, findImageUrl } = require("./utils");

const SHOP = {
  id: "elfenart",
  name: "Elfenart Mailorder",
  baseUrl: "https://elfenart.de",
};

function cleanTitle(text = "") {
  return text
    .replace(/\u00ad/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*[\d]+,\d{2}\s*€.*$/i, "")
    .replace(/\s*zzgl\.\s*Versandkosten.*$/i, "")
    .trim();
}

async function searchElfenart(query, limit = 12) {
  const trimmed = query.trim();
  const params = new URLSearchParams({
    s: trimmed,
    post_type: "product",
  });
  const searchUrl = `${SHOP.baseUrl}/?${params.toString()}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("li.product").each((_, el) => {
    if (results.length >= limit) return false;

    const root = $(el);
    const link = root
      .find("a.woocommerce-LoopProduct-link, a.woocommerce-loop-product__link")
      .first();
    const href = link.attr("href");
    const title = cleanTitle(link.text());
    if (!title || !href || seen.has(href)) return;
    if (!isVinylFormat(title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const price =
      root
        .find(".price .amount, .price")
        .first()
        .text()
        .match(/[\d]+,\d{2}\s*€/)?.[0]
        ?.replace(/\s+/g, " ") || null;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price,
      format: "Vinyl / LP",
      url: href,
      imageUrl: findImageUrl($, root, SHOP.baseUrl),
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

module.exports = { searchElfenart, SHOP };
