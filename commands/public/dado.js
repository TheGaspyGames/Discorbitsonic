import { SlashCommandBuilder } from "discord.js";
import { sendCommandLog } from "../../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("dado")
  .setDescription("Lanza un dado y obtén un número aleatorio.")
  .addIntegerOption(option =>
    option.setName("caras")
      .setDescription("Número de caras del dado (por defecto 6).")
      .setRequired(false)
  );

async function execute(interaction) {
  await sendCommandLog(interaction.client, "dado", interaction.user);

  const caras = interaction.options.getInteger("caras") || 6;

  if (caras < 1) {
    return interaction.reply({
      content: "❌ El número de caras debe ser al menos 1.",
      ephemeral: true
    });
  }

  const resultado = Math.floor(Math.random() * caras) + 1;
  await interaction.reply(`🎲 Has lanzado un dado de ${caras} caras y ha salido: **${resultado}**`);
}

export default {
  data,
  execute
};