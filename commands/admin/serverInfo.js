import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Muestra información del servidor"),

  async execute(interaction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({ content: "❌ No se pudo obtener información del servidor.", ephemeral: true });
    }

    // Obtener usuarios
    const members = await guild.members.fetch();
    const totalMembers = members.size;

    // Obtener roles
    const roles = guild.roles.cache;
    const roleList = roles.map(role => `${role.name} (${role.id})`).join("\n");

    // Filtrar usuarios con el rol específico
    const staffRoleId = "1177722501275594842";
    const staffMembers = members.filter(member => member.roles.cache.has(staffRoleId));
    const totalStaff = staffMembers.size;

    // Contar canales
    const channels = guild.channels.cache;
    const totalChannels = channels.size;

    // Responder con la información
    const embed = {
      color: 0x0099ff,
      title: "Información del servidor",
      fields: [
        { name: "Usuarios totales", value: `${totalMembers}`, inline: true },
        { name: "Roles disponibles", value: `${roles.size}`, inline: true },
        { name: "Staffs (Rol: ${staffRoleId})", value: `${totalStaff}`, inline: true },
        { name: "Canales totales", value: `${totalChannels}`, inline: true },
        { name: "Lista de roles", value: roleList || "No hay roles", inline: false }
      ],
      timestamp: new Date(),
      footer: {
        text: "Sistema de información del servidor"
      }
    };

    await interaction.reply({ embeds: [embed] });
  }
};