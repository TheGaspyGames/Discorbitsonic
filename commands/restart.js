import { SlashCommandBuilder } from "discord.js";
import { sendSetupLog } from "../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("restart")
  .setDescription("Reinicia el bot. Solo el propietario puede usarlo.");

async function execute(interaction) {
  const OWNER_ID = "684395420004253729"; // tu ID
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ No tienes permisos para ejecutar este comando.", ephemeral: true });
  }

  await interaction.reply({ content: "🔄 Reiniciando bot...", ephemeral: true });

  // Log del reinicio
  await sendSetupLog(interaction.client, "🔄 Reinicio de Bot", `Reinicio solicitado por ${interaction.user.tag} (\`${interaction.user.id}\`)`);

  // Reinicio con PM2
  process.exit(0);
}

export default {
  data,
  execute
};
