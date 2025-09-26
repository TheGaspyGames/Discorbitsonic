import { exec } from "child_process";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getRecentCommits, isAuthorized } from "../utils/utilities.js";

const autoUpdateChannels = new Map();

export async function updGitCommand(message, args, updGitEmbeds) {
  const channelId = message.channel.id;

  if (autoUpdateChannels.has(channelId)) {
    return message.reply("✅ El modo auto-updates ya está activado en este canal.");
  }

  message.reply("🚀 Modo auto-updates activado! El bot ahora actualizará automáticamente los commits recientes.");

  const autoUpdate = async () => {
    try {
      const commits = await getRecentCommits();
      if (!commits.length) return;

      const lastCommitSha = autoUpdateChannels.get(channelId)?.lastCommitSha;
      if (commits[0].sha === lastCommitSha) return;

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

      autoUpdateChannels.set(channelId, { message: sentMessage, lastCommitSha: commits[0].sha });

      const collector = sentMessage.createMessageComponentCollector({ time: 60000 });
      collector.on("collect", async i => {
        // Solo usuario autorizado puede aplicar update
        if (i.customId === "yes_update") {
          if (!isAuthorized(i)) {
            return i.reply({ content: "❌ No estás autorizado para aplicar la actualización.", ephemeral: true });
          }

          i.reply({ content: "⬇️ Descargando y aplicando actualización...", ephemeral: true });

          // Ejecutar git pull
          exec("git pull", (err, stdout, stderr) => {
            if (err) {
              console.error("Error aplicando update:", err);
              sentMessage.edit({ content: "❌ Error aplicando la actualización!", components: [] });
              return;
            }
            console.log(stdout);
            sentMessage.edit({ content: "✅ Actualización aplicada correctamente!", components: [] });
          });
        }

        if (i.customId === "no_update") {
          i.reply({ content: "No se aplicará la actualización ❌", ephemeral: true });
        }
      });

    } catch (err) {
      console.error("Error en auto-update de commits:", err);
    }
  };

  await autoUpdate();
  const interval = setInterval(autoUpdate, 30 * 1000);
  autoUpdateChannels.set(channelId, { ...autoUpdateChannels.get(channelId), interval });
}
