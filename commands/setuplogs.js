import { SlashCommandBuilder, PermissionFlagsBits, Colors } from "discord.js";
import { sendLogMessage } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("setuplogs")
  .setDescription("Configura el canal de logs del servidor.")
  .addChannelOption(option =>
    option.setName("canal")
      .setDescription("El canal donde se enviarán los logs")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const logChannel = interaction.options.getChannel("canal");

  await configManager.set("LOG_CHANNEL_ID", logChannel.id);

  await sendLogMessage(interaction.client, "✅ Logs activados", `Los logs del servidor se enviarán en ${logChannel}`, Colors.Green, logChannel.id);

  await interaction.editReply(`✅ Canal de logs configurado: ${logChannel}`);
}

export default { data, execute };
