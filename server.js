const express = require("express");
const path = require("path");
const { searchAllShops } = require("./scrapers");

const app = express();
const PORT = process.env.PORT || 3847;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/search", async (req, res) => {
  const band = String(req.query.band || req.query.q || "").trim();
  const album = String(req.query.album || "").trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

  if (!band) {
    return res.status(400).json({ error: "Parameter band oder q fehlt." });
  }

  try {
    const data = await searchAllShops({ band, album }, limit);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message || "Suche fehlgeschlagen." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Vinyl Finder läuft auf http://localhost:${PORT}`);
});
