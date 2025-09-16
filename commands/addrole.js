import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import config from "../config.json" assert { type: "json" };

const data = new SlashCommandBuilder()
  .setName("addrole")
  .setDescription("Añade un rol a los miembros que no lo tienen.")
  .addRoleOption(option =>
    option.setName("rol").setDescription("El rol a añadir").setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

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
