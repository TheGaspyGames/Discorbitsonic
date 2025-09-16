import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import config from "../config.json" assert { type: "json" };

const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Crea un embed personalizado.")
  .addChannelOption(option =>
    option.setName("canal").setDescription("Canal destino").setRequired(true)
  )
  .addStringOption(option =>
    option.setName("contenido").setDescription("Contenido del embed").setRequired(true)
  )
  .addStringOption(option =>
    option.setName("titulo").setDescription("Título")
  )
  .addStringOption(option =>
    option.setName("color").setDescription("Color hex (#000000)")
  )
  .addStringOption(option =>
    option.setName("footer").setDescription("Texto de pie")
  )
  .addStringOption(option =>
    option.setName("autor").setDescription("Autor")
  );

async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  const canal = interaction.options.getChannel("canal");
  const contenido = interaction.options.getString("contenido");
  const titulo = interaction.options.getString("titulo");
  const color = interaction.options.getString("color") || "#000000";
  const footer = interaction.options.getString("footer");
  const autor = interaction.options.getString("autor");

  const embed = new EmbedBuilder()
    .setDescription(contenido)
    .setColor(parseInt(color.replace("#", ""), 16));

  if (titulo) embed.setTitle(titulo);
  if (footer) embed.setFooter({ text: footer });
  if (autor) embed.setAuthor({ name: autor });

  await canal.send({ embeds: [embed] });
  await interaction.reply({
    content: `✅ Embed enviado a ${canal}`,
    ephemeral: true
  });
}

export default {
  data,
  execute
};
