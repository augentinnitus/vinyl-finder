const cheerio = require("cheerio");
const { USER_AGENT, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "glitterhouse",
  name: "Glitterhouse",
  baseUrl: "https://mailorder.glitterhouse.com",
};

function isGlitterhouseVinyl(text = "") {
  if (/\b(cd|mc|dvd|book|buch|tape|kassette)\b/i.test(text)) return false;
  return /\b(lp|7"|12"|10"|dolp|piclp|2-lp|3-lp|2xlp|3xlp|single)\b/i.test(text);
}

async function fetchGlitterhouseSearch(query) {
  const body = new URLSearchParams({
    filter_what: query.trim(),
    filter_where: "artist",
    set_filter: "finden / find",
  });

  const response = await fetch(`${SHOP.baseUrl}/suchergebnisse.html`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml",
    },
    body,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} für Glitterhouse-Suche`);
  }

  return response.text();
}

async function searchGlitterhouse(query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = `${SHOP.baseUrl}/suchergebnisse.html`;
  const html = await fetchGlitterhouseSearch(trimmed);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $(".product_box").each((_, el) => {
    if (results.length >= limit) return false;

    const box = $(el);
    const detailLink = box.find("a.none[href*='/album/']").first();
    const href = detailLink.attr("href");
    if (!href || seen.has(href)) return;

    const banderol = box.find(".product_banderol a.none").first();
    const artist = banderol.find("h3").text().replace(/\s+/g, " ").trim();
    const detailText = banderol
      .clone()
      .children("h3")
      .remove()
      .end()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const title = artist && detailText ? `${artist} – ${detailText}` : artist || detailText;
    if (!title) return;
    if (!isGlitterhouseVinyl(detailText || title)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(href);
    const price = box.find(".product_banderol").text().match(/[\d]+,\d{2}\s*€/)?.[0] || null;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price,
      format: "Vinyl / LP",
      url: href,
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

module.exports = { searchGlitterhouse, SHOP };
