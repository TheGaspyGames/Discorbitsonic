import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendCommandLog } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("msg")
  .setDescription("Envía un mensaje en el canal actual.")
  .addStringOption(option =>
    option.setName("content").setDescription("El mensaje a enviar").setRequired(true)
  );

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Log command usage
  await sendCommandLog(interaction.client, "msg", interaction.user);

  const content = interaction.options.getString("content");
  await interaction.channel.send(content);
  await interaction.reply({ content: "✅ Mensaje enviado.", ephemeral: true });
}

export default {
  data,
  execute
};
