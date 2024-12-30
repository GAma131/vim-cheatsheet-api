const axios = require("axios");
const cheerio = require("cheerio");

const scrapeVimCheatSheet = async () => {
  const url = "https://vim.rtorr.com/";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const sections = []; // Lista final de secciones
    const tips = []; // Array para almacenar los comandos de la clase .well

    let lastSectionTitle = "";

    // Procesar comandos generales
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
              // Capturar comando incluyendo texto y símbolos entre <kbd>
              const command = $(li)
                .contents()
                .map((_, el) => {
                  if (el.type === "tag" && el.name === "kbd") {
                    return $(el).text().trim();
                  }
                  if (el.type === "text") {
                    return $(el).text().trim();
                  }
                  return "";
                })
                .get()
                .join("");

              // Capturar descripción encerrada en comillas
              const descriptionMatch = $(li).text().match(/"([^"]+)"/);
              const description = descriptionMatch ? descriptionMatch[1].trim() : "";

              return command && description ? { command, description } : null;
            })
            .get();

          if (commands.length) {
            sections.push({ sectionTitle, commands });
          }
        });
    });

    // Procesar los comandos de las clases .well (Tips)
    $(".commands-container.well").each((_, container) => {
      const commands = $(container)
        .find("li")
        .map((_, li) => {
          const command = $(li)
            .contents()
            .map((_, el) => {
              if (el.type === "tag" && el.name === "kbd") {
                return $(el).text().trim();
              }
              if (el.type === "text") {
                return $(el).text().trim();
              }
              return "";
            })
            .get()
            .join("");

          const descriptionMatch = $(li).text().match(/"([^"]+)"/);
          const description = descriptionMatch ? descriptionMatch[1].trim() : "";

          return command && description ? { command, description } : null;
        })
        .get();

      if (commands.length) {
        tips.push(...commands);
      }
    });

    // Agregar la sección Tips si hay comandos
    if (tips.length) {
      sections.push({ sectionTitle: "Tips", commands: tips });
    }

    return sections;
  } catch (error) {
    console.error(`Error scraping Vim Cheat Sheet from ${url}:`, error.message);
    throw error;
  }
};

module.exports = { scrapeVimCheatSheet };
