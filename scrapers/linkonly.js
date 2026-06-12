function createLinkOnlySearch(shop, buildSearchUrl, message) {
  return async function searchLinkOnly(query) {
    const searchUrl = buildSearchUrl(query);

    return {
      shop: shop.id,
      shopName: shop.name,
      searchUrl,
      status: "link_only",
      message,
      results: [],
    };
  };
}

module.exports = { createLinkOnlySearch };
