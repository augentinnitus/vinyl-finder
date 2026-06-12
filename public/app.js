const form = document.getElementById("search-form");
const input = document.getElementById("band-input");
const button = document.getElementById("search-button");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const resultsMeta = document.getElementById("results-meta");
const shopPanels = document.getElementById("shop-panels");

const params = new URLSearchParams(window.location.search);
if (params.get("q")) {
  input.value = params.get("q");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("q", query);
  window.history.replaceState({}, "", nextUrl);

  await runSearch(query);
});

if (input.value.trim()) {
  runSearch(input.value.trim());
}

async function runSearch(query) {
  setLoading(true);
  clearResults();

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Suche fehlgeschlagen.");
    }

    renderResults(data);
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? "Suche läuft…" : "Suchen";

  if (isLoading) {
    showStatus("Durchsuche Mailorder-Shops nach Vinyl…", "loading");
  } else {
    statusEl.hidden = true;
  }
}

function showStatus(message, type = "loading") {
  statusEl.hidden = false;
  statusEl.className = `status status--${type}`;
  statusEl.textContent = message;
}

function clearResults() {
  resultsEl.hidden = true;
  shopPanels.innerHTML = "";
}

function renderResults(data) {
  resultsEl.hidden = false;
  resultsTitle.textContent = `Treffer für „${data.query}“`;
  resultsMeta.textContent = `${data.totalResults} Vinyl-Angebot${data.totalResults === 1 ? "" : "e"} gefunden`;

  shopPanels.innerHTML = data.shops.map(renderShopPanel).join("");

  if (!data.totalResults) {
    showStatus("Keine Vinyl-Treffer gefunden. Probiere einen anderen Schreibweise oder öffne die Shop-Suche direkt.", "loading");
  }
}

function renderShopPanel(shop) {
  const countLabel =
    shop.status === "ok"
      ? `${shop.results.length} Treffer`
      : shop.status === "link_only"
        ? "Direktlink"
        : shop.status === "empty"
          ? "Keine Treffer"
          : "Fehler";

  const message = shop.message
    ? `<div class="shop-panel__message shop-panel__message--${shop.status === "error" ? "error" : "warn"}">${escapeHtml(shop.message)}</div>`
    : "";

  const list =
    shop.results.length > 0
      ? `<ul class="result-list">${shop.results.map(renderResultItem).join("")}</ul>`
      : "";

  const searchLink = shop.searchUrl
    ? `<a href="${escapeHtml(shop.searchUrl)}" target="_blank" rel="noopener noreferrer">Alle Treffer im Shop</a>`
    : "";

  return `
    <article class="shop-panel">
      <div class="shop-panel__head">
        <div class="shop-panel__title">
          <span class="shop-dot" aria-hidden="true"></span>
          <h3>${escapeHtml(shop.shopName)}</h3>
        </div>
        <div class="shop-panel__meta">${countLabel}</div>
        <div class="shop-panel__actions">${searchLink}</div>
      </div>
      ${message}
      ${list}
    </article>
  `;
}

function renderResultItem(item) {
  const meta = [item.format, item.price].filter(Boolean).join(" · ");

  return `
    <li class="result-item">
      <div>
        <p class="result-item__title">${escapeHtml(item.title)}</p>
        ${meta ? `<p class="result-item__meta">${escapeHtml(meta)}</p>` : ""}
      </div>
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Zum Angebot</a>
    </li>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
