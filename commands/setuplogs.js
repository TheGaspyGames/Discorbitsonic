import { SlashCommandBuilder } from "discord.js";
import { sendSetupLog } from "../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("setuplogs")
  .setDescription("Configura o prueba los logs de setup. Solo propietario puede usarlo.");

async function execute(interaction) {
  const OWNER_ID = "684395420004253729"; // tu ID
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ No tienes permisos para ejecutar este comando.", ephemeral: true });
  }

  await interaction.reply({ content: "✅ Enviando log de prueba...", ephemeral: true });

  await sendSetupLog(
    interaction.client,
    "📝 Test de Logs",
    `Este es un mensaje de prueba enviado por ${interaction.user.tag} (\`${interaction.user.id}\`)`
  );
}

export default {
  data,
  execute
};
