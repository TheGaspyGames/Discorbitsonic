import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Muestra el avatar de un usuario")
  .addUserOption(option =>
    option.setName("usuario").setDescription("El usuario para mostrar el avatar").setRequired(true)
  );

async function execute(interaction) {
  const user = interaction.options.getUser("usuario");
  const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 512 });
  await interaction.reply({ content: `Avatar de ${user.username}: ${avatarUrl}`, ephemeral: false });
}

export default {
  data,
  execute,
};