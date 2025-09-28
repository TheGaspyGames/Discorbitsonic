import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendCommandLog } from "../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Muestra información sobre los comandos disponibles.");

async function execute(interaction) {
  // Log command usage
  await sendCommandLog(interaction.client, "help", interaction.user);


  const embed = new EmbedBuilder()
    .setTitle("📋 Comandos Disponibles")
    .setColor("Blue")
    .addFields(
      // Slash commands
      { name: "🔍 /revisar", value: "Analiza un usuario para detectar posibles cuentas alternativas o sospechosas en el servidor, mostrando coincidencias de IP, creación y actividad reciente.", inline: false },
      { name: "👤 /addrole [rol]", value: "Asigna el rol especificado a todos los miembros que aún no lo tengan. Útil para sincronizar roles masivamente.", inline: false },
      { name: "💬 /msg [contenido]", value: "Envía un mensaje anónimo en el canal actual. El autor no será revelado a otros usuarios.", inline: false },
      { name: "📩 /mdsg [usuario] [mensaje]", value: "Envía un mensaje privado (DM) a un usuario específico desde el bot. Útil para avisos o notificaciones discretas.", inline: false },
      { name: "🎭 /troll", value: "Envía un gif troll divertido en el canal. Ideal para bromas ligeras entre usuarios.", inline: false },
      { name: "📝 /embed", value: "Crea y personaliza un embed visualmente atractivo, permitiendo editar título, descripción, color, imágenes, autor y pie de página antes de enviarlo a un canal.", inline: false },
      { name: "🏓 /ping", value: "Muestra la latencia actual del bot y la conexión con Discord, útil para diagnosticar problemas de lag.", inline: false },
      { name: "🔧 /logsetup", value: "Configura el sistema de logs premium, permitiendo establecer el canal y webhook donde se enviarán los registros de eventos importantes.", inline: false },
      { name: "🔄 /update", value: "Actualiza el bot a la última versión disponible desde el repositorio, reiniciando si es necesario.", inline: false },
      { name: "⬆️ /updgit", value: "Fuerza una actualización del bot desde GitHub y muestra los últimos cambios en un embed.", inline: false },      // Prefijo !
      { name: "💻 !updgit", value: "Fuerza una actualización del bot desde GitHub y muestra los últimos cambios en un embed (comando rápido por prefijo).", inline: false },
      { name: "🔧 !setpremiumlogs", value: "Activa o actualiza los logs premium en el servidor usando el prefijo, útil para administradores.", inline: false },
      { name: "ℹ️ Extra", value: `Rol ignorado por el sistema: <@&${config.IGNORED_ROLE_ID}>`, inline: false }
    )
    .setFooter({ text: "Sistema de Moderación Automático y Utilidades" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default {
  data,
  execute
};
