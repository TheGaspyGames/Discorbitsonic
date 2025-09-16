import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Muestra la latencia del bot.");

export async function execute(interaction) {
  const latency = Date.now() - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  const embed = new EmbedBuilder()
    .setTitle("🏓 Pong!")
    .setDescription(`Latencia: **${latency}ms**\nAPI: **${apiLatency}ms**`)
    .setColor(latency < 100 ? 0x00ff00 : latency < 200 ? 0xffa500 : 0xff0000);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}