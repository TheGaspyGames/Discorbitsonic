import { SlashCommandBuilder, EmbedBuilder, Colors } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Muestra información sobre todos los comandos disponibles.");

async function execute(interaction) {
  // Log del uso del comando
  await sendCommandLog(interaction.client, "help", interaction.user);

  const embed = new EmbedBuilder()
    .setTitle("📋 Comandos Disponibles")
    .setColor(Colors.Blue)
    .setDescription("Aquí tienes todos los comandos disponibles en el bot:");

  // Recorre todos los comandos cargados
  interaction.client.commands.forEach(cmd => {
    embed.addFields({
      name: `/${cmd.data.name}`,
      value: cmd.data.description || "Sin descripción",
      inline: false
    });
  });

  embed.setFooter({ text: "Sistema de Moderación Automático" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default {
  data,
  execute
};
