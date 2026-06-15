const cheerio = require("cheerio");
const { fetchHtml, isVinylFormat, titleMatchesQuery } = require("./utils");

const SHOP = {
  id: "thalia",
  name: "Thalia",
  baseUrl: "https://www.thalia.de",
};

function isThaliaVinyl(title = "", format = "") {
  const combined = `${title} ${format}`;
  if (/\b(cd|dvd|blu-?ray|ebook|hörbuch|taschenbuch|buch)\b/i.test(combined)) {
    return isVinylFormat(title);
  }
  return isVinylFormat(title) || /schallplatte/i.test(combined);
}

async function searchThalia(query, limit = 12) {
  const trimmed = query.trim();
  const params = new URLSearchParams({
    sq: trimmed,
    filterPATHROOT: "3738",
    filterMedienart: "Schallplatte",
  });
  const searchUrl = `${SHOP.baseUrl}/suche?${params.toString()}`;
  const html = await fetchHtml(searchUrl);
  const $ = cheerio.load(html);
  const results = [];
  const seen = new Set();

  $("li.tm-produktliste__eintrag").each((_, el) => {
    if (results.length >= limit) return false;

    const article = $(el);
    const title = article.find(".tm-artikeldetails__titel").first().text().replace(/\s+/g, " ").trim();
    const link = article.find("a.tm-produkt-link").first().attr("href");
    const format = article.find(".tm-artikeldetails__formatbezeichnung").text().replace(/\s+/g, " ").trim();
    if (!title || !link || seen.has(link)) return;
    if (!isThaliaVinyl(title, format)) return;
    if (!titleMatchesQuery(title, trimmed)) return;

    seen.add(link);
    const price = article.find(".tm-preis-wrapper__preis").first().text().replace(/\s+/g, " ").trim() || null;

    results.push({
      shop: SHOP.id,
      shopName: SHOP.name,
      title,
      price,
      format: "Schallplatte",
      url: link.startsWith("http") ? link : `${SHOP.baseUrl}${link}`,
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

module.exports = { searchThalia, SHOP };
