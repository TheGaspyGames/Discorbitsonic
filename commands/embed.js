
import { SlashCommandBuilder, EmbedBuilder, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Envía los requisitos para ser Media en un canal seleccionado.");

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Obtener canales de texto disponibles
  const channels = interaction.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText && c.viewable && c.permissionsFor(interaction.client.user).has(["SendMessages", "ViewChannel"]))
    .map(c => ({ label: `#${c.name}`, value: c.id }));

  if (channels.length === 0) {
    return interaction.reply({ content: "❌ No hay canales de texto disponibles para enviar el embed.", ephemeral: true });
  }

  // Menú de selección de canal
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("select_channel_embed")
    .setPlaceholder("Selecciona el canal donde enviar el embed...")
    .addOptions(channels.slice(0, 25)); // Discord permite máx 25 opciones

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({
    content: "Selecciona el canal donde enviar el embed de requisitos para Media:",
    components: [row],
    ephemeral: true
  });

  // Esperar selección
  const select = await interaction.channel.awaitMessageComponent({
    filter: i => i.user.id === interaction.user.id && i.customId === "select_channel_embed",
    componentType: ComponentType.StringSelect,
    time: 60_000
  }).catch(() => null);

  if (!select) return;

  const channelId = select.values[0];
  const channel = interaction.guild.channels.cache.get(channelId);
  if (!channel) {
    return select.reply({ content: "❌ Canal no encontrado.", ephemeral: true });
  }

  // Embed de requisitos para Media
  const embed = new EmbedBuilder()
    .setTitle("Requerimientos para Ser Media")
    .setDescription(
      "YouTube: tener como mínimo 200 Subs y una media de visitas de 30.\n\n" +
      "Twitch: tener como mínimo 250 seguidores y una media de espectadores de 10.\n\n" +
      "TikTok: tener mínimo 500 seguidores y una media de 1000 visitas por video.\n\n" +
      "si cumplen con los requisitos crear Ticket en : <#ID_TICKETS_CHANNEL> y pasar captura, pruebas de su canal.\n\nGracias"
    )
    .setColor(0x23272A);

  await channel.send({ embeds: [embed] });
  await select.update({ content: `✅ Embed enviado a <#${channel.id}>`, components: [] });

  // Log de uso
  await sendCommandLog(interaction.client, "embed", interaction.user, `Canal: #${channel.name}`);
}

export default {
  data,
  execute
};
