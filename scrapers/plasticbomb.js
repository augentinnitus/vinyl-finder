const cheerio = require("cheerio");
const { USER_AGENT } = require("./utils");

const SHOP = {
  id: "plasticbomb",
  name: "Plastic Bomb",
  baseUrl: "https://plasticbombshop.de",
};

async function searchPlasticBomb(query, limit = 12) {
  const searchUrl = `${SHOP.baseUrl}/search/?qs=${encodeURIComponent(query.trim())}`;
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "de-DE,de;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} für Plastic Bomb`);
  }

  const finalUrl = response.url;
  const html = await response.text();

  if (!finalUrl.includes("/search/")) {
    return {
      shop: SHOP.id,
      shopName: SHOP.name,
      searchUrl,
      status: "empty",
      message:
        "Der Shop leitet die Suche manchmal direkt auf eine Produktseite um. Bitte die Suche im Shop öffnen.",
      results: [],
    };
  }

  const $ = cheerio.load(html);
  const results = [];

  $(".product-wrapper[itemtype='https://schema.org/Product']").each((_, el) => {
    if (results.length >= limit) return false;

    const root = $(el);
    const link = root.find(".productbox-title a").first();
    const title = link.text().replace(/\s+/g, " ").trim();
    const href = link.attr("href");
    if (!title || !href) return;

    const rawPrice =
      root.find(".productbox-price .second-range-price").first().text() ||
      root.find(".productbox-price").first().text();
    const price = rawPrice.replace(/\s+/g, " ").replace(/\*/g, "").trim() || null;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price,
      format: "Vinyl / LP",
      url: href.startsWith("http") ? href : `${SHOP.baseUrl}${href}`,
    });
  });

  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl: finalUrl,
    status: results.length ? "ok" : "empty",
    message: results.length ? null : "Keine Vinyl-Treffer gefunden.",
    results,
  };
}

module.exports = { searchPlasticBomb, SHOP };
