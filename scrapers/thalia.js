const cheerio = require("cheerio");
const { isVinylFormat, titleMatchesQuery, findImageUrl } = require("./utils");

const SHOP = {
  id: "thalia",
  name: "Thalia",
  baseUrl: "https://www.thalia.de",
};

const THALIA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "sec-ch-ua": '"Chromium";v="131", "Google Chrome";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "upgrade-insecure-requests": "1",
};

function buildThaliaSearchUrl(query) {
  const params = new URLSearchParams({
    sq: query.trim(),
    filterPATHROOT: "3738",
    filterMedienart: "Schallplatte",
  });
  return `${SHOP.baseUrl}/suche?${params.toString()}`;
}

function collectCookies(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");
  }

  const header = response.headers.get("set-cookie");
  return header ? header.split(";")[0] : "";
}

async function warmThaliaSession() {
  const response = await fetch(SHOP.baseUrl, {
    headers: THALIA_HEADERS,
    redirect: "follow",
  });

  return {
    cookies: collectCookies(response),
    ok: response.ok,
    status: response.status,
  };
}

async function fetchThaliaHtml(url) {
  const session = await warmThaliaSession();
  const response = await fetch(url, {
    headers: {
      ...THALIA_HEADERS,
      Referer: `${SHOP.baseUrl}/`,
      "sec-fetch-site": "same-origin",
      ...(session.cookies ? { Cookie: session.cookies } : {}),
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} für ${url}`);
  }

  return response.text();
}

function isThaliaVinyl(title = "", format = "") {
  const combined = `${title} ${format}`;
  if (/\b(cd|dvd|blu-?ray|ebook|hörbuch|taschenbuch|buch)\b/i.test(combined)) {
    return isVinylFormat(title);
  }
  return isVinylFormat(title) || /schallplatte/i.test(combined);
}

function linkOnlyResult(searchUrl, message) {
  return {
    shop: SHOP.id,
    shopName: SHOP.name,
    searchUrl,
    status: "link_only",
    message,
    results: [],
  };
}

async function searchThalia(query, limit = 12) {
  const trimmed = query.trim();
  const searchUrl = buildThaliaSearchUrl(trimmed);

  let html;
  try {
    html = await fetchThaliaHtml(searchUrl);
  } catch (error) {
    if (/HTTP 403/.test(error.message)) {
      return linkOnlyResult(
        searchUrl,
        "Thalia blockiert automatisierte Abfragen (403). Bitte die Schallplatten-Suche direkt auf thalia.de öffnen."
      );
    }
    throw error;
  }

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
      imageUrl: findImageUrl($, article, SHOP.baseUrl),
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

module.exports = { searchThalia, SHOP, buildThaliaSearchUrl };
