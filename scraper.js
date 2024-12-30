const axios = require("axios");
const cheerio = require("cheerio");

const scrapeVimCheatSheet = async () => {
  const url = "https://vim.rtorr.com/";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const sections = [];
    const sectionMap = new Map(); // Usamos un mapa para agrupar comandos por sección

    let lastSectionTitle = "";

    $(".commands-container:not(.well)").each((_, container) => {
      $(container)
        .find("ul")
        .each((_, ul) => {
          const sectionTitle = $(ul).prev("h2").text().trim() || lastSectionTitle;
          if (!sectionTitle) return;

          lastSectionTitle = sectionTitle;
          const commands = $(ul)
            .find("li")
            .map((_, li) => {
              const command = $(li).find("kbd").text().trim();
              const description = $(li).text().split("-").slice(1).join("-").trim();
              return command && description ? { command, description } : null;
            })
            .get();

          if (commands.length) {
            if (!sectionMap.has(sectionTitle)) {
              sectionMap.set(sectionTitle, []);
            }
            sectionMap.get(sectionTitle).push(...commands);
          }
        });
    });

    // Convertir el mapa en un array de secciones
    sectionMap.forEach((commands, sectionTitle) => {
      sections.push({ sectionTitle, commands });
    });

    return sections;
  } catch (error) {
    console.error(`Error scraping Vim Cheat Sheet from ${url}:`, error.message);
    throw error;
  }
};

module.exports = { scrapeVimCheatSheet };
