import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" assert { type: "json" };

const data = new SlashCommandBuilder()
  .setName("msg")
  .setDescription("Envía un mensaje en el canal actual.")
  .addStringOption(option =>
    option.setName("content").setDescription("El mensaje a enviar").setRequired(true)
  );

async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  const content = interaction.options.getString("content");
  await interaction.channel.send(content);
  await interaction.reply({ content: "✅ Mensaje enviado.", ephemeral: true });
}

export default {
  data,
  execute
};
