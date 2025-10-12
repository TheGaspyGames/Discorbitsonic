import { SlashCommandBuilder } from "discord.js";
import { sendCommandLog } from "../../utils/utilities.js";

const cooldowns = new Map();
const cooldownTime = 60 * 60 * 1000; // 1 hora en milisegundos

const frases = [
  "@usuario fue hackeado por el FBI.",
  "@usuario intentó prender la PC sin conectar el cable.",
  "@usuario se cayó del Wi-Fi.",
  "@usuario olvidó guardar la partida y perdió todo.",
  "@usuario intentó abrir un .exe en el microondas."
];

const data = new SlashCommandBuilder()
  .setName("trollear")
  .setDescription("Envía un mensaje troll a un usuario.")
  .addUserOption(option =>
    option.setName("usuario")
      .setDescription("El usuario objetivo.")
      .setRequired(true)
  );

async function execute(interaction) {
  await sendCommandLog(interaction.client, "trollear", interaction.user);

  const target = interaction.options.getUser("usuario");
  const userId = interaction.user.id;
  const isAdmin = interaction.member.permissions.has(["Administrator"]);

  if (!isAdmin && cooldowns.has(userId)) {
    const remainingTime = cooldowns.get(userId) - Date.now();
    if (remainingTime > 0) {
      return interaction.reply({
        content: `⏳ Tranquilo, espera una hora antes de volver a trolear.`,
        ephemeral: true
      });
    }
  }

  const frase = frases[Math.floor(Math.random() * frases.length)].replace("@usuario", `<@${target.id}>`);
  await interaction.reply(frase);

  if (!isAdmin) {
    cooldowns.set(userId, Date.now() + cooldownTime);
    setTimeout(() => cooldowns.delete(userId), cooldownTime);
  }
}

export default {
  data,
  execute
};