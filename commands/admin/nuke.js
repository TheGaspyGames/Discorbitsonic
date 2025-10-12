import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { sendCommandLog } from "../../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("nuke")
  .setDescription("Elimina y recrea un canal con el mismo nombre y permisos.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

async function execute(interaction) {
  await sendCommandLog(interaction.client, "nuke", interaction.user);

  const channel = interaction.channel;
  const channelName = channel.name;
  const channelPermissions = channel.permissionOverwrites.cache;

  try {
    // Clonar el canal
    const newChannel = await channel.clone();

    // Eliminar el canal original
    await channel.delete();

    // Configurar permisos en el nuevo canal
    for (const [id, overwrite] of channelPermissions) {
      await newChannel.permissionOverwrites.create(id, overwrite);
    }

    // Enviar mensaje en el nuevo canal
    const embed = new EmbedBuilder()
      .setTitle("💥 Canal Reiniciado")
      .setDescription(`El canal **${channelName}** ha sido reiniciado correctamente.`)
      .setColor("Red")
      .setTimestamp();

    await newChannel.send({ embeds: [embed] });
    await interaction.reply({ content: "✅ Canal reiniciado correctamente.", ephemeral: true });
  } catch (error) {
    console.error("Error al ejecutar el comando nuke:", error);
    await interaction.reply({ content: "❌ Ocurrió un error al intentar reiniciar el canal.", ephemeral: true });
  }
}

export default {
  data,
  execute
};