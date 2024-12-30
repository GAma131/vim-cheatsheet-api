const axios = require("axios");
const cheerio = require("cheerio");

const scrapeVimCheatSheet = async () => {
  const url = "https://vim.rtorr.com/"; // URL de la cheat sheet de Vim

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const sections = [];

    let lastSectionTitle = ""; // Mantiene el último título de sección encontrado

    $(".commands-container").each((index, container) => {
      // Ignorar contenedores con la clase .well
      if ($(container).hasClass("well")) {
        console.log("Ignorando contenedor .well");
        return; // Saltar este contenedor, pero continuar con los demás
      }

      // Buscar las listas ul dentro del contenedor actual
      $(container)
        .find("ul")
        .each((index, element) => {
          // Intentar obtener el título de la sección
          const sectionTitle = $(element).prev("h2").text().trim();
          if (sectionTitle) {
            lastSectionTitle = sectionTitle; // Actualizar el último título válido
          }

          // Si no hay título, usar el último título válido
          const currentTitle = sectionTitle || lastSectionTitle;
          if (!currentTitle) {
            console.log("No hay título de sección válido, omitiendo este ul.");
            return;
          }

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
            console.log(`Sección encontrada: ${currentTitle}`);
            sections.push({ sectionTitle: currentTitle, commands });
          }
        });
    });

    return sections;
  } catch (error) {
    console.error(`Error scraping Vim Cheat Sheet from ${url}:`, error.message);
    throw error; // Mantener el lanzamiento del error para controlarlo externamente
  }
};

module.exports = { scrapeVimCheatSheet };
