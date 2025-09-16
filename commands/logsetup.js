import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config.json" assert { type: "json" };

let LOG_CHANNEL_ID = null;
let COMMAND_LOGGING_ENABLED = false;
let DM_MONITORING_ENABLED = false;

export const data = new SlashCommandBuilder()
  .setName("logsetup")
  .setDescription("Configura el sistema de logs.")
  .addChannelOption(option => option.setName("canal").setDescription("Canal para logs").setRequired(true))
  .addBooleanOption(option => option.setName("command_logging").setDescription("Activar log de comandos"))
  .addBooleanOption(option => option.setName("dm_monitoring").setDescription("Activar log de DMs"));

export async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  const canal = interaction.options.getChannel("canal");
  COMMAND_LOGGING_ENABLED = interaction.options.getBoolean("command_logging") || false;
  DM_MONITORING_ENABLED = interaction.options.getBoolean("dm_monitoring") || false;
  LOG_CHANNEL_ID = canal.id;

  const embed = new EmbedBuilder()
    .setTitle("🔧 Sistema de Logs Configurado")
    .setColor("Green")
    .addFields(
      { name: "📍 Canal", value: canal.toString(), inline: true },
      { name: "⚙️ Command logging", value: COMMAND_LOGGING_ENABLED ? "✅ ON" : "❌ OFF", inline: true },
      { name: "📬 DM Monitoring", value: DM_MONITORING_ENABLED ? "✅ ON" : "❌ OFF", inline: true }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}