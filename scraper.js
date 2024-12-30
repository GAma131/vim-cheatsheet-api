const axios = require("axios");
const cheerio = require("cheerio");

const scrapeVimCheatSheet = async () => {
  const url = "https://vim.rtorr.com/"; // URL de la cheat sheet de Vim

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const sections = [];

    // Recorrer las secciones principales de la página
    $(".commands-container")
      .not(".well") // Ignorar cualquier .commands-container con la clase .well
      .find("ul")
      .each((index, element) => {
        const sectionTitle = $(element).prev("h2").text().trim();
        console.log(sectionTitle);
        if (!sectionTitle) return; // Validar que exista un título de sección

        const commands = [];

        // Recorrer los comandos dentro de la sección
        $(element)
          .find("li")
          .each((i, li) => {
            const command = $(li).find("kbd").text().trim();
            const text = $(li).text();
            const dashIndex = text.indexOf("-");
            const description =
              dashIndex !== -1 ? text.substring(dashIndex + 1).trim() : "";

            // Validar que se encontró un comando y descripción
            if (command && description) {
              commands.push({ command, description });
            }
          });

        if (commands.length > 0) {
          sections.push({ sectionTitle, commands });
        }
      });
    return sections;
  } catch (error) {
    console.error(`Error scraping Vim Cheat Sheet from ${url}:`, error.message);
    throw error; // Mantener el lanzamiento del error para controlarlo externamente
  }
};

module.exports = { scrapeVimCheatSheet };
