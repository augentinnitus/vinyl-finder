const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchHtml(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      Accept: "text/html,application/xhtml+xml",
      ...options.headers,
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} für ${url}`);
  }

  return response.text();
}

function isVinylFormat(text = "") {
  const normalized = text.toLowerCase();
  if (!normalized) return false;

  const vinylPattern =
    /\b(\d+\s*x?\s*)?(lp|lps|vinyl|12"|7"|10"|single\s*7"|picture\s*disc|pic\s*disc)\b/i;
  const nonVinylPattern = /\b(cd|dvd|blu-?ray|shm-?cd|sacd|tape|kassette|book|buch)\b/i;

  if (vinylPattern.test(normalized)) return true;
  if (nonVinylPattern.test(normalized)) return false;
  return false;
}

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function queryParts(query = "") {
  return normalizeText(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function titleMatchesQuery(title = "", query = "") {
  const parts = queryParts(query);
  if (!parts.length) return false;
  const normalizedTitle = title.toLowerCase();
  return parts.every((part) => normalizedTitle.includes(part));
}

function titleMatchesSearch(title = "", { band = "", album = "" } = {}) {
  const parts = [...queryParts(band), ...queryParts(album)];
  if (!parts.length) return false;
  const normalizedTitle = title.toLowerCase();
  return parts.every((part) => normalizedTitle.includes(part));
}

function parsePriceEuro(price = "") {
  const match = normalizeText(price)
    .replace(/\s/g, "")
    .match(/(\d+)[,.](\d{2})/);
  if (!match) return null;
  return Number(`${match[1]}.${match[2]}`);
}

function resolveImageUrl(baseUrl, src = "") {
  const trimmed = String(src).trim();
  if (!trimmed || /^data:/i.test(trimmed)) return null;
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return null;
  }
}

function findImageUrl($, root, baseUrl) {
  const img = root
    .find("img[src], img[data-src], img[data-lazy-src]")
    .filter((_, el) => {
      const src =
        $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
      return src && !/logo|icon|pixel|spacer|blank|placeholder/i.test(src);
    })
    .first();

  const src = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src");
  return resolveImageUrl(baseUrl, src);
}

function buildDiscogsUrl(band = "", album = "") {
  const query = album ? `${band} ${album}`.trim() : band.trim();
  return `https://www.discogs.com/de/search/?q=${encodeURIComponent(query)}&type=release`;
}

function dedupeResults(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.shop}|${item.url}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  USER_AGENT,
  fetchHtml,
  isVinylFormat,
  normalizeText,
  titleMatchesQuery,
  titleMatchesSearch,
  parsePriceEuro,
  resolveImageUrl,
  findImageUrl,
  buildDiscogsUrl,
  dedupeResults,
};
