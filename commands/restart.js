import { SlashCommandBuilder } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Reinicia el bot (solo usuario autorizado).");

async function execute(interaction) {
  // ID autorizado desde tu config
  const authorizedId = configManager.get("OWNER_ID") || "684395420004253729";

  if (interaction.user.id !== authorizedId) {
    return interaction.reply({
      content: "❌ No tienes permisos para reiniciar el bot.",
      ephemeral: true
    });
  }

  // Log del uso del comando
  await sendCommandLog(interaction.client, "restart", interaction.user);

  // Aviso al usuario
  await interaction.reply({
    content: "♻️ Reiniciando el bot...",
    ephemeral: true
  });

  console.log(`[BOT] Reinicio solicitado por ${interaction.user.tag}`);

  // Terminar proceso; PM2 u otro gestor lo reiniciará automáticamente
  process.exit(0);
}

export default {
  data,
  execute
};
