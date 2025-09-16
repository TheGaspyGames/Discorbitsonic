import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import config from "../config.json" assert { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("addrole")
  .setDescription("Añade un rol a los miembros que no lo tienen.")
  .addRoleOption(option =>
    option.setName("rol").setDescription("El rol a añadir").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  const role = interaction.options.getRole("rol");

  await interaction.reply({ content: `⏳ Añadiendo rol **${role.name}**...`, ephemeral: true });

  let count = 0;
  for (const member of interaction.guild.members.cache.values()) {
    if (!member.user.bot && !member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
      count++;
    }
  }

  await interaction.followUp({ content: `✅ Rol **${role.name}** añadido a ${count} miembros.`, ephemeral: true });
}