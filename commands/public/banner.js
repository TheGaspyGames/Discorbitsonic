import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("banner")
  .setDescription("Muestra el banner de un usuario")
  .addUserOption(option =>
    option.setName("usuario").setDescription("El usuario para mostrar el banner").setRequired(true)
  );

async function execute(interaction) {
  const user = interaction.options.getUser("usuario");
  const userFetch = await interaction.client.users.fetch(user.id, { force: true });
  const bannerUrl = userFetch.bannerURL({ dynamic: true, size: 512 });

  const embed = new EmbedBuilder()
    .setTitle(`Banner de ${user.username}`)
    .setImage(bannerUrl || null)
    .setColor("Blue")
    .setDescription(bannerUrl ? "Aquí está el banner del usuario." : "El usuario no tiene un banner configurado.");

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

export default {
  data,
  execute,
};