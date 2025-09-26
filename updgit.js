import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getRecentCommits } from "../utils/utilities.js";

export async function updGitCommand(message, args, updGitEmbeds) {
  const commits = await getRecentCommits();
  if (!commits.length) return message.channel.send("No se encontraron commits recientes.");

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

  // Revisar si ya hay un embed enviado en este canal
  let sentMessage = updGitEmbeds.get(message.channel.id);
  if (sentMessage) {
    await sentMessage.edit({ embeds: [embed], components: [row] });
  } else {
    sentMessage = await message.channel.send({ embeds: [embed], components: [row] });
    updGitEmbeds.set(message.channel.id, sentMessage);
  }

  const collector = sentMessage.createMessageComponentCollector({ time: 60000 });
  collector.on("collect", i => {
    if (i.customId === "yes_update") i.reply({ content: "Actualización confirmada ✅", ephemeral: true });
    if (i.customId === "no_update") i.reply({ content: "No se marcará la actualización ❌", ephemeral: true });
  });
}
