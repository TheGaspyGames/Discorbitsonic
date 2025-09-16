import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" assert { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("mdsg")
  .setDescription("Envía un mensaje privado a un usuario.")
  .addUserOption(option => option.setName("usuario").setDescription("Usuario objetivo").setRequired(true))
  .addStringOption(option => option.setName("mensaje").setDescription("Contenido del mensaje").setRequired(true));

export async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  const user = interaction.options.getUser("usuario");
  const msg = interaction.options.getString("mensaje");

  try {
    await user.send(msg);
    await interaction.reply({ content: `✅ Mensaje enviado a ${user.tag}`, ephemeral: true });
  } catch {
    await interaction.reply({ content: `❌ No se pudo enviar mensaje a ${user.tag}`, ephemeral: true });
  }
}