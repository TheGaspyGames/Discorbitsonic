import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getRecentCommits } from "../utils/utilities.js";

// Mapa para guardar estado por canal
const autoUpdateChannels = new Map(); // canalId -> { message, lastCommitSha }

export async function updGitCommand(message, args, updGitEmbeds) {
  const channelId = message.channel.id;

  if (autoUpdateChannels.has(channelId)) {
    return message.reply("✅ El modo auto-updates ya está activado en este canal.");
  }

  message.reply("🚀 Modo auto-updates activado! El bot ahora actualizará automáticamente los commits recientes.");

  // Iniciamos el auto-update loop para este canal
  const autoUpdate = async () => {
    try {
      const commits = await getRecentCommits();
      if (!commits.length) return;

      // Comparamos si hay commits nuevos
      const lastCommitSha = autoUpdateChannels.get(channelId)?.lastCommitSha;
      if (commits[0].sha === lastCommitSha) return; // No hay commits nuevos

      // Creamos embed
      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle("Actualizaciones recientes del repositorio")
        .setDescription("Aquí se muestran los commits más recientes de Discorbitsonic:")
        .addFields(commits.map(c => ({
          name: c.commit.author.date,
          value: c.commit.message
        })));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("yes_update").setLabel("Sí").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("no_update").setLabel("No").setStyle(ButtonStyle.Danger)
      );

      let sentMessage = updGitEmbeds.get(channelId);

      if (sentMessage) {
        await sentMessage.edit({ embeds: [embed], components: [row] });
      } else {
        sentMessage = await message.channel.send({ embeds: [embed], components: [row] });
        updGitEmbeds.set(channelId, sentMessage);
      }

      // Guardamos el último SHA
      autoUpdateChannels.set(channelId, { message: sentMessage, lastCommitSha: commits[0].sha });

      // Collector para botones
      const collector = sentMessage.createMessageComponentCollector({ time: 60000 });
      collector.on("collect", i => {
        if (i.customId === "yes_update") i.reply({ content: "Actualización confirmada ✅", ephemeral: true });
        if (i.customId === "no_update") i.reply({ content: "No se marcará la actualización ❌", ephemeral: true });
      });
    } catch (err) {
      console.error("Error en auto-update de commits:", err);
    }
  };

  // Ejecutamos inmediatamente y luego cada 30s
  await autoUpdate();
  const interval = setInterval(autoUpdate, 30 * 1000);

  // Guardamos el interval para poder cancelarlo si quieres más tarde
  autoUpdateChannels.set(channelId, { ...autoUpdateChannels.get(channelId), interval });
}
