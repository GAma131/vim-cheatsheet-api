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
              const liClone = $(li).clone(); // Clonamos el elemento <li>

              // Extraer el comando usando únicamente las etiquetas <kbd>
              const command = liClone
                .find("kbd")
                .map((_, kbd) => $(kbd).text().trim())
                .get()
                .join(" + ") // Unir comandos con separadores
                .replace(/\s+/g, " "); // Eliminar espacios innecesarios

              // Remover <kbd> del clon para procesar el resto del texto como descripción
              liClone.find("kbd").remove();

              // Extraer la descripción restante
              let description = liClone
                .text()
                .replace(/^-/, "") // Quitar guión inicial
                .trim();

              // Manejar el caso especial del comando "R"
              if (command === "R" && description.includes("until ESC is pressed.")) {
                description = "replace more than one character, until ESC is pressed.";
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
          const liClone = $(li).clone();

          const command = liClone
            .find("kbd")
            .map((_, kbd) => $(kbd).text().trim())
            .get()
            .join(" + ")
            .replace(/\s+/g, " ");

          liClone.find("kbd").remove();

          const description = liClone
            .text()
            .replace(/^-/, "")
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
