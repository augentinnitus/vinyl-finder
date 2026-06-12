const express = require("express");
const path = require("path");
const { searchAllShops } = require("./scrapers");

const app = express();
const PORT = process.env.PORT || 3847;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 20);

  if (!query) {
    return res.status(400).json({ error: "Parameter q fehlt." });
  }

  try {
    const data = await searchAllShops(query, limit);
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
