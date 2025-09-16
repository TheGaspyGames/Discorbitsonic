import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" assert { type: "json" };

export const data = new SlashCommandBuilder()
  .setName("revisar")
  .setDescription("Revisa cuentas del servidor para detectar posibles cuentas alternativas.");

export async function execute(interaction) {
  if (!config.AUTHORIZED_USER_IDS.includes(interaction.user.id.toString())) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  await interaction.reply({ content: "🔍 Revisando miembros...", ephemeral: true });

  const members = await interaction.guild.members.fetch();
  const suspicious = [];

  const now = Date.now();
  for (const member of members.values()) {
    if (member.user.bot) continue;
    if (member.roles.cache.has(config.IGNORED_ROLE_ID)) continue;

    const accountAgeDays = (now - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    const flags = [];

    if (accountAgeDays < 150) flags.push("🔴 Cuenta con menos de 5 meses.");
    else if (accountAgeDays < 365) flags.push("🟡 Cuenta con menos de 1 año.");

    if (flags.length) {
      suspicious.push({ member, flags });
    }
  }

  if (suspicious.length) {
    let text = `**🚩 Se detectaron ${suspicious.length} cuentas sospechosas:**\n`;
    suspicious.forEach(s => {
      text += `\n👤 ${s.member.user.tag} (${s.member.id})\n${s.flags.join("\n")}\n---\n`;
    });
    await interaction.user.send(text);
    await interaction.followUp({ content: "📩 Resultados enviados a tu DM.", ephemeral: true });
  } else {
    await interaction.followUp({ content: "✅ No se encontraron cuentas sospechosas.", ephemeral: true });
  }
}