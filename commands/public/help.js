import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: "json" };
import { sendCommandLog } from "../../utils/utilities.js";

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
      { name: "🔍 /revisar", value: "Analiza un usuario para detectar posibles cuentas alternativas o sospechosas en el servidor.", inline: false },
      { name: "👤 /addrole [rol]", value: "Asigna el rol especificado a todos los miembros que aún no lo tengan.", inline: false },
      { name: "💬 /msg [contenido]", value: "Envía un mensaje anónimo en el canal actual.", inline: false },
      { name: "📩 /mdsg [usuario] [mensaje]", value: "Envía un mensaje privado (DM) a un usuario específico desde el bot.", inline: false },
      { name: "🎭 /troll", value: "Envía un gif troll divertido en el canal.", inline: false },
      { name: "📝 /embed", value: "Crea y personaliza un embed visualmente atractivo.", inline: false },
      { name: "🏓 /ping", value: "Muestra la latencia actual del bot y la conexión con Discord.", inline: false },
      { name: "🔧 /logsetup", value: "Configura el sistema de logs premium.", inline: false },
      { name: "🔄 /update", value: "Actualiza el bot a la última versión disponible desde el repositorio.", inline: false },
      { name: "⬆️ /updgit", value: "Fuerza una actualización del bot desde GitHub y muestra los últimos cambios.", inline: false },
      // Prefijo !
      { name: "💻 !updgit", value: "Fuerza una actualización del bot desde GitHub (comando rápido por prefijo).", inline: false },
      { name: "🔧 !setpremiumlogs", value: "Activa o actualiza los logs premium en el servidor usando el prefijo.", inline: false },
      { name: "💣 !nuke", value: "Elimina y recrea un canal con el mismo nombre y permisos.", inline: false },
      { name: "⚙️ !mantenimiento", value: "Activa o desactiva el modo de mantenimiento del bot.", inline: false },
      { name: "ℹ️ Extra", value: `Rol ignorado por el sistema: <@&${config.IGNORED_ROLE_ID}>`, inline: false }
    )
    .setFooter({ text: "Sistema de Moderación Automático y Utilidades" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default {
  data,
  execute
};
