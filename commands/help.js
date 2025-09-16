import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config.json" assert { type: "json" };

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Muestra información sobre los comandos disponibles.");

async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("📋 Comandos Disponibles")
    .setColor("Blue")
    .addFields(
      { name: "🔍 /revisar", value: "Revisa posibles cuentas alternativas en el servidor.", inline: false },
      { name: "👤 /addrole [rol]", value: "Añade un rol a todos los miembros que no lo tienen.", inline: false },
      { name: "💬 /msg [contenido]", value: "Envía un mensaje anónimo en el canal actual.", inline: false },
      { name: "📩 /mdsg [usuario] [mensaje]", value: "Envía un mensaje privado a un usuario específico.", inline: false },
      { name: "🎭 /troll", value: "Envía un gif troll.", inline: false },
      { name: "📝 /embed", value: "Crea un embed personalizado.", inline: false },
      { name: "🏓 /ping", value: "Muestra la latencia del bot.", inline: false },
      { name: "🔧 /logsetup", value: "Configura el sistema de logs.", inline: false },
      { name: "ℹ️ Extra", value: `Rol ignorado: <@&${config.IGNORED_ROLE_ID}>`, inline: false }
    )
    .setFooter({ text: "Sistema de Moderación Automático" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default {
  data,
  execute
};
