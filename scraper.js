const axios = require("axios");
const cheerio = require("cheerio");

const scrapeVimCheatSheet = async () => {
  const url = "https://vim.rtorr.com/";

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const sections = [];
    const sectionMap = new Map();
    const tips = [];

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
              // Construir el comando
              const command = $(li)
                .contents()
                .map((_, el) => {
                  if (el.type === "tag" && el.name === "kbd") {
                    return $(el).text().trim();
                  }
                  if (el.type === "text") {
                    const text = $(el).text().trim();
                    if (text === "+" || text.toLowerCase() === "or") {
                      return ` ${text} `;
                    }
                  }
                  return "";
                })
                .get()
                .join("")
                .replace(/\s+/g, " ");

              // Extraer la descripción correctamente
              const description = $(li)
                .clone()
                .children("kbd") // Removemos <kbd> del clon
                .remove()
                .end()
                .text()
                .split("-") // Dividir usando el guión
                .slice(1)
                .join("-")
                .trim();

              // Si el comando incluye "ESC" en un lugar incorrecto, lo ajustamos
              if (command.includes("ESC")) {
                const adjustedCommand = command.replace(/\bESC\b/, "").trim(); // Remover ESC del comando
                const adjustedDescription = description.includes("ESC")
                  ? description
                  : `ESC ${description}`.trim(); // Agregar ESC a la descripción si no está

                return {
                  command: adjustedCommand,
                  description: adjustedDescription,
                };
              }

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
              if (el.type === "text") {
                const text = $(el).text().trim();
                if (text === "+" || text.toLowerCase() === "or") {
                  return ` ${text} `;
                }
              }
              return "";
            })
            .get()
            .join("")
            .replace(/\s+/g, " ");

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

          if (command.includes("ESC")) {
            const adjustedCommand = command.replace(/\bESC\b/, "").trim();
            const adjustedDescription = description.includes("ESC")
              ? description
              : `ESC ${description}`.trim();

            return {
              command: adjustedCommand,
              description: adjustedDescription,
            };
          }

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
