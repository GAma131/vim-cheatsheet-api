const cors = require("cors");
const express = require("express");
const { scrapeVimCheatSheet } = require("./scraper");

const app = express();
const PORT = 3000;

app.use(cors());
app.get("/api/vim-cheatsheet", async (req, res) => {
  try {
    const data = await scrapeVimCheatSheet();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving data." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
