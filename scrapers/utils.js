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
  dedupeResults,
};
