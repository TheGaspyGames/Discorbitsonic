import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendCommandLog } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("addrole")
  .setDescription("Añade un rol a los miembros que no lo tienen.")
  .addRoleOption(option =>
    option.setName("rol").setDescription("El rol a añadir").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Log command usage
  await sendCommandLog(interaction.client, "addrole", interaction.user, `Rol: ${interaction.options.getRole("rol").name}`);

  const role = interaction.options.getRole("rol");

  await interaction.reply({ content: `⏳ Añadiendo rol **${role.name}**...`, ephemeral: true });

  let count = 0;
  for (const member of interaction.guild.members.cache.values()) {
    if (!member.user.bot && !member.roles.cache.has(role.id)) {
      try {
        await member.roles.add(role);
        count++;
      } catch {
        // Silenciar errores individuales (por ejemplo, falta de permisos)
      }
    }
  }

  await interaction.followUp({
    content: `✅ Rol **${role.name}** añadido a ${count} miembros.`,
    ephemeral: true
  });
}

// 👇 Export en formato compatible con tu loader dinámico
export default {
  data,
  execute
};
