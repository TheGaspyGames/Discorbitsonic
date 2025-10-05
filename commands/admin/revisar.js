import { SlashCommandBuilder } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendCommandLog } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("revisar")
  .setDescription("Revisa cuentas del servidor para detectar posibles cuentas alternativas.");

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Log command usage
  await sendCommandLog(interaction.client, "revisar", interaction.user);

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

export default {
  data,
  execute
};
