import { SlashCommandBuilder } from "discord.js";

const respuestas = [
  "Sí",
  "No",
  "Tal vez",
  "Mañana sin falta",
  "Definitivamente",
  "No cuentes con ello",
  "Es posible",
  "Pregunta de nuevo más tarde"
];

const data = new SlashCommandBuilder()
  .setName("8ball")
  .setDescription("Haz una pregunta y obtén una respuesta del 8ball.")
  .addStringOption(option =>
    option.setName("pregunta")
      .setDescription("La pregunta que quieres hacer al 8ball.")
      .setRequired(true)
  );

async function execute(interaction) {
  const pregunta = interaction.options.getString("pregunta");
  const respuesta = respuestas[Math.floor(Math.random() * respuestas.length)];

  await interaction.reply(`🎱 **Pregunta:** ${pregunta}\n**Respuesta:** ${respuesta}`);
}

export default {
  data,
  execute
};