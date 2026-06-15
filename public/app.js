const form = document.getElementById("search-form");
const bandInput = document.getElementById("band-input");
const albumInput = document.getElementById("album-input");
const button = document.getElementById("search-button");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const resultsMeta = document.getElementById("results-meta");
const shopPanels = document.getElementById("shop-panels");
const discogsPanel = document.getElementById("discogs-panel");
const priceOverview = document.getElementById("price-overview");
const sortSelect = document.getElementById("sort-select");
const filterSelect = document.getElementById("filter-select");
const historyEl = document.getElementById("search-history");
const shoppingListModal = document.getElementById("shopping-list-modal");
const shoppingListMeta = document.getElementById("shopping-list-meta");
const shoppingListPanels = document.getElementById("shopping-list-panels");
const clearShoppingListButton = document.getElementById("clear-shopping-list");
const exportShoppingListButton = document.getElementById("export-shopping-list");
const closeShoppingListButton = document.getElementById("close-shopping-list");

const HISTORY_KEY = "vinyl-finder-history";
let lastData = null;

const params = new URLSearchParams(window.location.search);
if (params.get("band") || params.get("q")) {
  bandInput.value = params.get("band") || params.get("q");
}
if (params.get("album")) {
  albumInput.value = params.get("album");
}
if (params.get("sort")) {
  sortSelect.value = params.get("sort");
}
if (params.get("filter")) {
  filterSelect.value = params.get("filter");
}

renderHistory();
renderShoppingList();

clearShoppingListButton.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  closeShoppingListModal();
  renderHistory();
  renderShoppingList();
});

exportShoppingListButton.addEventListener("click", exportShoppingListAsTxt);

closeShoppingListButton.addEventListener("click", closeShoppingListModal);

shoppingListModal.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closeShoppingListModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isShoppingListModalOpen()) {
    closeShoppingListModal();
  }
});

shoppingListPanels.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-item]");
  if (!button) return;

  event.preventDefault();
  removeShoppingListItem(button.dataset.shop, button.dataset.url);
  renderShoppingList();
  renderHistory();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const band = bandInput.value.trim();
  const album = albumInput.value.trim();
  if (!band) return;

  updateUrl({ band, album });
  await runSearch({ band, album });
});

sortSelect.addEventListener("change", () => {
  updateUrl({
    band: bandInput.value.trim(),
    album: albumInput.value.trim(),
  });
  if (lastData) renderResults(lastData);
});

filterSelect.addEventListener("change", () => {
  updateUrl({
    band: bandInput.value.trim(),
    album: albumInput.value.trim(),
  });
  if (lastData) renderResults(lastData);
});

if (bandInput.value.trim()) {
  runSearch({
    band: bandInput.value.trim(),
    album: albumInput.value.trim(),
  });
}

async function runSearch({ band, album }) {
  setLoading(true);
  clearResults();

  try {
    const query = new URLSearchParams({ band });
    if (album) query.set("album", album);

    const response = await fetch(`/api/search?${query.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Suche fehlgeschlagen.");
    }

    saveSearch({ band, album }, data);
    renderHistory();
    renderShoppingList();
    renderResults(data);
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
}

function updateUrl({ band, album }) {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("band", band);
  if (album) {
    nextUrl.searchParams.set("album", album);
  } else {
    nextUrl.searchParams.delete("album");
  }
  nextUrl.searchParams.delete("q");
  nextUrl.searchParams.set("sort", sortSelect.value);
  nextUrl.searchParams.set("filter", filterSelect.value);
  window.history.replaceState({}, "", nextUrl);
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
  discogsPanel.hidden = true;
  discogsPanel.innerHTML = "";
  priceOverview.hidden = true;
  priceOverview.innerHTML = "";
  lastData = null;
}

function renderResults(data) {
  lastData = data;
  resultsEl.hidden = false;

  const label = data.album ? `„${data.band}“ – „${data.album}“` : `„${data.band}“`;
  resultsTitle.textContent = `Treffer für ${label}`;

  const visibleShops = getVisibleShops(data.shops);
  const visibleCount = visibleShops.reduce((sum, shop) => sum + shop.results.length, 0);
  resultsMeta.textContent = `${visibleCount} Vinyl-Angebot${visibleCount === 1 ? "" : "e"} gefunden`;

  renderDiscogsPanel(data);
  renderPriceOverview(visibleShops);
  shopPanels.innerHTML =
    sortSelect.value === "shop"
      ? visibleShops.map(renderShopPanel).join("")
      : "";

  if (!visibleCount) {
    showStatus(
      data.album
        ? "Keine Vinyl-Treffer mit passendem Band- und Albumnamen gefunden. Probiere eine andere Schreibweise oder öffne die Shop-Suche direkt."
        : "Keine Vinyl-Treffer gefunden. Probiere eine andere Schreibweise oder öffne die Shop-Suche direkt.",
      "loading"
    );
  }
}

function getVisibleShops(shops) {
  const includeLinks = filterSelect.value === "all";

  return shops
    .filter((shop) => includeLinks || shop.status !== "link_only")
    .map((shop) => ({
      ...shop,
      results: sortItems(shop.results),
    }));
}

function sortItems(items) {
  const sorted = [...items];

  if (sortSelect.value === "price-asc") {
    sorted.sort((a, b) => comparePrice(a.price, b.price));
  } else if (sortSelect.value === "price-desc") {
    sorted.sort((a, b) => comparePrice(b.price, a.price));
  }

  return sorted;
}

function comparePrice(left, right) {
  const a = parsePriceEuro(left);
  const b = parsePriceEuro(right);
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function parsePriceEuro(price) {
  if (!price) return null;
  const match = String(price)
    .replace(/\s/g, "")
    .match(/(\d+)[,.](\d{2})/);
  if (!match) return null;
  return Number(`${match[1]}.${match[2]}`);
}

function renderDiscogsPanel(data) {
  if (!data.discogsUrl) {
    discogsPanel.hidden = true;
    return;
  }

  discogsPanel.hidden = false;
  discogsPanel.innerHTML = `
    <div class="discogs-panel__content">
      <div>
        <p class="discogs-panel__eyebrow">Referenz</p>
        <h3>Discogs</h3>
        <p class="discogs-panel__text">
          Pressungen, Erscheinungsjahre und alternative Schreibweisen auf Discogs prüfen.
        </p>
      </div>
      <a href="${escapeHtml(data.discogsUrl)}" target="_blank" rel="noopener noreferrer">
        Auf Discogs suchen
      </a>
    </div>
  `;
}

function renderPriceOverview(shops) {
  if (sortSelect.value === "shop") {
    priceOverview.hidden = true;
    priceOverview.innerHTML = "";
    return;
  }

  const flatResults = sortItems(shops.flatMap((shop) => shop.results));

  if (!flatResults.length) {
    priceOverview.hidden = true;
    priceOverview.innerHTML = "";
    return;
  }

  priceOverview.hidden = false;
  priceOverview.innerHTML = `
    <div class="price-overview__head">
      <h3>${sortSelect.value === "price-asc" ? "Günstigste Angebote" : "Teuerste Angebote"}</h3>
      <p>Alle Shops, sortiert nach Preis</p>
    </div>
    <ul class="result-list">${flatResults.map((item) => renderResultItem(item, { showShop: true })).join("")}</ul>
  `;
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

function renderResultItem(item, { showShop = false, showSearch = false, removable = false } = {}) {
  const meta = [item.format, item.price].filter(Boolean).join(" · ");
  const cover = item.imageUrl
    ? `<img class="result-item__cover" src="${escapeHtml(item.imageUrl)}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'result-item__cover result-item__cover--placeholder'}))">`
    : `<div class="result-item__cover result-item__cover--placeholder" aria-hidden="true"></div>`;

  const removeButton = removable
    ? `<button type="button" class="result-item__remove" data-remove-item data-shop="${escapeHtml(item.shop)}" data-url="${escapeHtml(item.url)}" aria-label="Aus Einkaufsliste entfernen" title="Entfernen">×</button>`
    : "";

  const actions = removable
    ? `<div class="result-item__actions">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Zum Angebot</a>
        ${removeButton}
      </div>`
    : `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Zum Angebot</a>`;

  return `
    <li class="result-item${removable ? " result-item--shopping" : ""}">
      ${cover}
      <div class="result-item__body">
        <p class="result-item__title">${escapeHtml(item.title)}</p>
        ${showShop && item.shopName ? `<p class="result-item__shop">${escapeHtml(item.shopName)}</p>` : ""}
        ${showSearch && item.searchLabel ? `<p class="result-item__search">${escapeHtml(item.searchLabel)}</p>` : ""}
        ${meta ? `<p class="result-item__meta">${escapeHtml(meta)}</p>` : ""}
      </div>
      ${actions}
    </li>
  `;
}

function formatSearchLabel({ band, album }) {
  return album ? `${band} – ${album}` : band;
}

function extractHistoryItems(data, band, album) {
  return data.shops
    .filter((shop) => shop.status === "ok" && shop.results.length > 0)
    .flatMap((shop) =>
      shop.results.map((result) => ({
        shop: shop.shop,
        shopName: shop.shopName,
        title: result.title,
        price: result.price || null,
        format: result.format || null,
        url: result.url,
        imageUrl: result.imageUrl || null,
        searchLabel: formatSearchLabel({ band, album }),
      }))
    );
}

function saveSearch({ band, album }, data) {
  const history = loadHistory().filter(
    (entry) => entry.band !== band || entry.album !== (album || "")
  );
  history.unshift({
    band,
    album: album || "",
    searchedAt: data.searchedAt,
    items: extractHistoryItems(data, band, album),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function removeShoppingListItem(shop, url) {
  const history = loadHistory().map((entry) => ({
    ...entry,
    items: Array.isArray(entry.items)
      ? entry.items.filter((item) => !(item.shop === shop && item.url === url))
      : entry.items,
  }));

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function buildShoppingListByShop(history) {
  const shopMap = new Map();

  for (const entry of history.slice(0, 10)) {
    if (!Array.isArray(entry.items)) continue;

    for (const item of entry.items) {
      if (!shopMap.has(item.shop)) {
        shopMap.set(item.shop, {
          shop: item.shop,
          shopName: item.shopName,
          items: [],
          seen: new Set(),
        });
      }

      const group = shopMap.get(item.shop);
      if (group.seen.has(item.url)) continue;

      group.seen.add(item.url);
      group.items.push(item);
    }
  }

  return [...shopMap.values()]
    .filter((group) => group.items.length > 0)
    .sort((a, b) => a.shopName.localeCompare(b.shopName, "de"));
}

function renderShoppingList() {
  const openShops = [...shoppingListPanels.querySelectorAll("details.shop-panel--shopping[open]")].map(
    (panel) => panel.dataset.shop
  );
  const history = loadHistory();
  const groups = buildShoppingListByShop(history);
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);

  if (!totalItems) {
    shoppingListPanels.innerHTML = "";
    closeShoppingListModal();
    renderHistory();
    return;
  }

  shoppingListMeta.textContent = `${totalItems} Platte${totalItems === 1 ? "" : "n"} in ${groups.length} Shop${groups.length === 1 ? "" : "s"}`;

  shoppingListPanels.innerHTML = groups
    .map((group) => {
      const list = `<ul class="result-list">${group.items
        .map((item) => renderResultItem(item, { showSearch: true, removable: true }))
        .join("")}</ul>`;

      return `
        <details class="shop-panel shop-panel--shopping" data-shop="${escapeHtml(group.shop)}">
          <summary class="shop-panel__head shop-panel__toggle">
            <div class="shop-panel__title">
              <span class="shop-dot" aria-hidden="true"></span>
              <h3>${escapeHtml(group.shopName)}</h3>
            </div>
            <div class="shop-panel__meta">${group.items.length} Treffer</div>
            <span class="shop-panel__chevron" aria-hidden="true"></span>
          </summary>
          <div class="shop-panel__body">
            ${list}
          </div>
        </details>
      `;
    })
    .join("");

  for (const shopId of openShops) {
    const panel = shoppingListPanels.querySelector(`details[data-shop="${shopId}"]`);
    if (panel) panel.open = true;
  }
}

function renderHistory() {
  const history = loadHistory();
  const groups = buildShoppingListByShop(history);
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);

  if (!history.length) {
    historyEl.hidden = true;
    historyEl.innerHTML = "";
    return;
  }

  historyEl.hidden = false;
  historyEl.innerHTML = `
    <span class="search-history__label">Zuletzt gesucht</span>
    ${history
      .map((entry) => {
        const label = entry.album ? `${entry.band} – ${entry.album}` : entry.band;
        return `<button type="button" class="search-history__chip" data-band="${escapeHtml(entry.band)}" data-album="${escapeHtml(entry.album)}">${escapeHtml(label)}</button>`;
      })
      .join("")}
    ${
      totalItems
        ? `<button type="button" class="search-history__chip search-history__chip--list" id="jump-to-shopping-list">Einkaufsliste (${totalItems})</button>`
        : ""
    }
  `;

  historyEl.querySelectorAll(".search-history__chip:not(.search-history__chip--list)").forEach((chip) => {
    chip.addEventListener("click", () => {
      bandInput.value = chip.dataset.band || "";
      albumInput.value = chip.dataset.album || "";
      form.requestSubmit();
    });
  });

  const jumpButton = document.getElementById("jump-to-shopping-list");
  if (jumpButton) {
    jumpButton.addEventListener("click", openShoppingListModal);
  }
}

function isShoppingListModalOpen() {
  return shoppingListModal.classList.contains("is-open");
}

function openShoppingListModal() {
  const groups = buildShoppingListByShop(loadHistory());
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  if (!totalItems) return;

  renderShoppingList();
  shoppingListModal.hidden = false;
  shoppingListModal.classList.add("is-open");
  document.body.classList.add("modal-open");
  closeShoppingListButton.focus();
}

function closeShoppingListModal() {
  shoppingListModal.classList.remove("is-open");
  shoppingListModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function formatShoppingListTxt(groups) {
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  const exportedAt = new Date().toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const lines = [
    "Vinyl Finder – Einkaufsliste",
    `Exportiert am ${exportedAt}`,
    "",
    `${totalItems} Platte${totalItems === 1 ? "" : "n"} in ${groups.length} Shop${groups.length === 1 ? "" : "s"}`,
    "",
  ];

  for (const group of groups) {
    lines.push(group.shopName);
    lines.push("-".repeat(group.shopName.length));

    for (const item of group.items) {
      lines.push(item.title);

      const meta = [item.format, item.price].filter(Boolean).join(" · ");
      if (meta) lines.push(meta);
      if (item.searchLabel) lines.push(`Suche: ${item.searchLabel}`);
      lines.push(item.url);
      lines.push("");
    }

    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportShoppingListAsTxt() {
  const groups = buildShoppingListByShop(loadHistory());
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  if (!totalItems) return;

  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`einkaufsliste-${dateStamp}.txt`, formatShoppingListTxt(groups));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
