import { SlashCommandBuilder } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";

const AUTHORIZED_USER_ID = "684395420004253729"; // Solo este usuario puede reiniciar

const data = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Reinicia el bot (solo el admin autorizado).");

async function execute(interaction) {
  if (interaction.user.id !== AUTHORIZED_USER_ID) {
    return interaction.reply({ content: "❌ No estás autorizado para usar este comando.", ephemeral: true });
  }

  await sendCommandLog(interaction.client, "restart", interaction.user);

  await interaction.reply({ content: "🔄 Reiniciando el bot...", ephemeral: true });

  console.log("🔄 Reiniciando por comando autorizado...");
  process.exit(0); // PM2 o tu gestor de procesos lo levantará de nuevo
}

export default { data, execute };
