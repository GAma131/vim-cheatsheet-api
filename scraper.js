const axios = require("axios");
const cheerio = require("cheerio");

const scrapeVimCheatSheet = async () => {
  const url = "https://vim.rtorr.com/";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const sections = [];
    const sectionMap = new Map(); // Usamos un mapa para agrupar comandos por sección
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
              // Capturamos comandos formados por múltiples <kbd> y símbolos
              const command = $(li)
                .contents() // Obtiene todos los nodos hijos, incluyendo texto
                .map((_, el) => {
                  if (el.type === "tag" && el.name === "kbd") {
                    return $(el).text().trim(); // Texto dentro de <kbd>
                  }
                  if (el.type === "text" && $(el).text().trim().includes("+")) {
                    return $(el).text().trim(); // Símbolos intermedios
                  }
                  return ""; // Ignorar otros tipos de nodos
                })
                .get()
                .join("");

              // Extraemos la descripción correctamente
              const description = $(li)
                .clone() // Clonamos el elemento para no modificar el DOM original
                .children("kbd") // Eliminamos las etiquetas <kbd>
                .remove()
                .end()
                .text()
                .split("-") // Separar usando el guión
                .slice(1)
                .join("-")
                .trim();

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

    // Procesar los comandos de las clases .well
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
              if (el.type === "text" && $(el).text().trim().includes("+")) {
                return $(el).text().trim();
              }
              return "";
            })
            .get()
            .join("");

          const description = $(li)
            .clone()
            .children("kbd")
            .remove()
            .end()
            .text()
            .split("-")
            .slice(1)
            .join("-")
            .trim();

          return command && description ? { command, description } : null;
        })
        .get();

      if (commands.length) {
        tips.push(...commands);
      }
    });

    // Convertir el mapa en un array de secciones
    sectionMap.forEach((commands, sectionTitle) => {
      sections.push({ sectionTitle, commands });
    });

    // Agregar la sección Tips si hay comandos en las clases .well
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
