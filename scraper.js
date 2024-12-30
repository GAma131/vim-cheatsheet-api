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
              const liClone = $(li).clone();

              // Extraer el comando usando las etiquetas <kbd>
              const command = liClone
                .find("kbd")
                .map((_, kbd) => $(kbd).text().trim())
                .get()
                .join(" + ")
                .replace(/\s+/g, " "); // Unir teclas y eliminar espacios adicionales

              // Remover las etiquetas <kbd> para procesar solo el texto de la descripción
              liClone.find("kbd").remove();

              // Extraer y limpiar la descripción
              let description = liClone.text().trim();

              // Eliminar separadores no deseados al inicio o en medio
              description = description
                .replace(/^[\s+\-]+/, "") // Quitar `+` o `-` al inicio
                .replace(/\s+[\+\-]\s+/g, " ") // Quitar `+` o `-` entre palabras
                .trim();

              // Manejar el caso especial del comando "R"
              if (command === "R" && description.includes("ESC")) {
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

          let description = liClone.text().trim();

          // Eliminar separadores no deseados al inicio o en medio
          description = description
            .replace(/^[\s+\-]+/, "") // Quitar `+` o `-` al inicio
            .replace(/\s+[\+\-]\s+/g, " ") // Quitar `+` o `-` entre palabras
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
