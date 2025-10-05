import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
const cooldowns = new Map();
const cooldownTime = 60 * 60 * 1000; // 1 hora en milisegundos

const data = new SlashCommandBuilder()
  .setName("fakeban")
  .setDescription("Simula un baneo divertido de un usuario.")
  .addUserOption(option =>
    option.setName("usuario")
      .setDescription("El usuario objetivo.")
      .setRequired(true)
  );

async function execute(interaction) {
  const target = interaction.options.getUser("usuario");
  const userId = interaction.user.id;
  const isAdmin = interaction.member.permissions.has(["Administrator", "ManageGuild"]);

  if (!isAdmin && cooldowns.has(userId)) {
    const remainingTime = cooldowns.get(userId) - Date.now();
    if (remainingTime > 0) {
      return interaction.reply({
        content: `⏳ Espera antes de volver a usar este comando.`,
        ephemeral: true
      });
    }
  }

  const embed = new EmbedBuilder()
    .setTitle("🚨 Usuario Fake Baneado")
    .setDescription(`🚨 <@${target.id}> fue baneado por respirar aire sin permiso.`)
    .setColor("Red")
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  if (!isAdmin) {
    cooldowns.set(userId, Date.now() + cooldownTime);
    setTimeout(() => cooldowns.delete(userId), cooldownTime);
  }
}

export default {
  data,
  execute
};