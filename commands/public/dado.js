import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("dado")
  .setDescription("Lanza un dado y obtén un número aleatorio.")
  .addIntegerOption(option =>
    option.setName("caras")
      .setDescription("Número de caras del dado (por defecto 6).")
      .setRequired(false)
  );

async function execute(interaction) {
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