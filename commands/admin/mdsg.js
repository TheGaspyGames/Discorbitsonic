import { SlashCommandBuilder } from "discord.js";
import config from "../../config.json" with { type: "json" };
import { sendCommandLog } from "../../utils/utilities.js";
import { configManager } from "../../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("mdsg")
  .setDescription("Envía un mensaje privado a un usuario.")
  .addUserOption(option =>
    option.setName("usuario").setDescription("Usuario objetivo").setRequired(true)
  )
  .addStringOption(option =>
    option.setName("mensaje").setDescription("Contenido del mensaje").setRequired(true)
  );

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Log command usage
  await sendCommandLog(interaction.client, "mdsg", interaction.user, `Destinatario: ${interaction.options.getUser("usuario").username}`);

  const user = interaction.options.getUser("usuario");
  const msg = interaction.options.getString("mensaje");

  try {
    await user.send(msg);
    await interaction.reply({ content: `✅ Mensaje enviado a ${user.tag}`, ephemeral: true });
  } catch {
    await interaction.reply({ content: `❌ No se pudo enviar mensaje a ${user.tag}`, ephemeral: true });
  }
}

export default {
  data,
  execute
};
