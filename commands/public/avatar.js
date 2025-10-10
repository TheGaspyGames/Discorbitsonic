import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Muestra el avatar de un usuario")
  .addUserOption(option =>
    option.setName("usuario").setDescription("El usuario para mostrar el avatar").setRequired(true)
  );

async function execute(interaction) {
  const user = interaction.options.getUser("usuario");
  const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 512 });

  const embed = new EmbedBuilder()
    .setTitle(`Avatar de ${user.username}`)
    .setImage(avatarUrl)
    .setColor("Blue")
    .setDescription("Aquí está el avatar del usuario.");

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

export default {
  data,
  execute,
};