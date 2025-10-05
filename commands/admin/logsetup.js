import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../../config.json" with { type: "json" };
import { sendCommandLog } from "../../utils/utilities.js";
import { configManager } from "../../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("logsetup")
  .setDescription("Configura el sistema de logs.")
  .addChannelOption(option => option.setName("canal").setDescription("Canal para logs").setRequired(true))
  .addBooleanOption(option => option.setName("command_logging").setDescription("Activar log de comandos"))
  .addBooleanOption(option => option.setName("dm_monitoring").setDescription("Activar log de DMs"));

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Log command usage
  await sendCommandLog(interaction.client, "logsetup", interaction.user, `Canal: ${interaction.options.getChannel("canal").name}`);

  const canal = interaction.options.getChannel("canal");
  const commandLogging = interaction.options.getBoolean("command_logging") ?? true;
  const dmMonitoring = interaction.options.getBoolean("dm_monitoring") ?? true;
  
  // Update configuration using configManager
  await configManager.setMultiple({
    LOG_CHANNEL_ID: canal.id,
    COMMAND_LOGGING_ENABLED: commandLogging,
    DM_MONITORING_ENABLED: dmMonitoring
  });

  const embed = new EmbedBuilder()
    .setTitle("🔧 Sistema de Logs Configurado")
    .setColor("Green")
    .addFields(
      { name: "📍 Canal", value: canal.toString(), inline: true },
      { name: "⚙️ Command logging", value: commandLogging ? "✅ ON" : "❌ OFF", inline: true },
      { name: "📬 DM Monitoring", value: dmMonitoring ? "✅ ON" : "❌ OFF", inline: true }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export default {
  data,
  execute
};
