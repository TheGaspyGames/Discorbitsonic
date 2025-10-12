// utils/logsystem.js
import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const webhookUrl = process.env.PREMIUM_WEBHOOK_URL;
const premiumEnabled = process.env.PREMIUM_LOGS_ENABLED === "true";
const webhookClient = webhookUrl && premiumEnabled ? new WebhookClient({ url: webhookUrl }) : null;

export function setupServerLogs(client) {
  if (!webhookClient) {
    console.log("🔕 Logs premium desactivados o webhook no configurado");
    return;
  }

  async function sendLog(title, description, color = Colors.Blurple, fields = [], options = {}) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: "Sistema de Logs", iconURL: "https://media.tenor.com/eWbZcoL6GokAAAAj/teto-teto-kasane.gif" });

    if (fields.length) embed.addFields(fields);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);

    await webhookClient.send({ embeds: [embed] });
  }

  client.on("guildMemberAdd", async (member) => {
    sendLog(
      "👋 Usuario se unió al servidor",
      `${member.user.tag} se ha unido al servidor.`,
      Colors.Green,
      [
        { name: "Usuario", value: `${member.user.tag} (${member.id})`, inline: true }
      ],
      { thumbnail: member.user.displayAvatarURL?.() }
    );
  });

  client.on("guildMemberRemove", async (member) => {
    sendLog(
      "🚪 Usuario salió del servidor",
      `${member.user.tag} ha salido del servidor.`,
      Colors.DarkGrey,
      [
        { name: "Usuario", value: `${member.user.tag} (${member.id})`, inline: true }
      ],
      { thumbnail: member.user.displayAvatarURL?.() }
    );
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
      sendLog(
        "✏️ Nick cambiado",
        `Un usuario cambió su apodo.`,
        Colors.Orange,
        [
          { name: "Usuario", value: newMember.user.tag, inline: true },
          { name: "Antes", value: oldMember.nickname || "(sin nick)", inline: true },
          { name: "Después", value: newMember.nickname || "(sin nick)", inline: true }
        ],
        { thumbnail: newMember.user.displayAvatarURL?.() }
      );
    }

    if (oldMember.user.username !== newMember.user.username) {
      sendLog(
        "✏️ Nombre de usuario cambiado",
        `Un usuario cambió su nombre de Discord.`,
        Colors.Orange,
        [
          { name: "Usuario", value: newMember.user.tag, inline: true },
          { name: "Antes", value: oldMember.user.username, inline: true },
          { name: "Después", value: newMember.user.username, inline: true }
        ],
        { thumbnail: newMember.user.displayAvatarURL?.() }
      );
    }

    if (oldMember.user.displayAvatarURL() !== newMember.user.displayAvatarURL()) {
      sendLog(
        "🖼️ Avatar cambiado",
        `Un usuario cambió su avatar.`,
        Colors.Orange,
        [
          { name: "Usuario", value: newMember.user.tag, inline: true },
          { name: "Avatar anterior", value: `[Ver anterior](${oldMember.user.displayAvatarURL()})`, inline: true },
          { name: "Avatar nuevo", value: `[Ver nuevo](${newMember.user.displayAvatarURL()})`, inline: true }
        ],
        { thumbnail: newMember.user.displayAvatarURL?.() }
      );
    }
  });

  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (!oldState.channel && newState.channel) {
      sendLog(
        "🔊 Usuario se unió a un canal de voz",
        `${newState.member.user.tag} se unió a <#${newState.channel.id}>`,
        Colors.Green,
        [
          { name: "Usuario", value: `${newState.member.user.tag} (${newState.member.id})`, inline: true },
          { name: "Canal", value: `<#${newState.channel.id}>`, inline: true }
        ],
        { thumbnail: newState.member.user.displayAvatarURL?.() }
      );
    }

    if (oldState.channel && !newState.channel) {
      sendLog(
        "🔈 Usuario salió de un canal de voz",
        `${oldState.member.user.tag} salió de <#${oldState.channel.id}>`,
        Colors.Orange,
        [
          { name: "Usuario", value: `${oldState.member.user.tag} (${oldState.member.id})`, inline: true },
          { name: "Canal", value: `<#${oldState.channel.id}>`, inline: true }
        ],
        { thumbnail: oldState.member.user.displayAvatarURL?.() }
      );
    }
  });

  client.on("inviteCreate", async (invite) => {
    sendLog(
      "📨 Invitación creada",
      `Se creó una invitación para el canal <#${invite.channel.id}> con código ${invite.code}.`,
      Colors.Blue,
      [
        { name: "Invitador", value: invite.inviter.tag, inline: true },
        { name: "Canal", value: `<#${invite.channel.id}>`, inline: true },
        { name: "Código", value: invite.code, inline: true }
      ]
    );
  });

  client.on("guildBanAdd", async (ban) => {
    sendLog(
      "⛔ Usuario baneado",
      `Un usuario fue baneado del servidor.`,
      Colors.DarkRed,
      [
        { name: "Usuario", value: `${ban.user.tag} (${ban.user.id})`, inline: true }
      ],
      { thumbnail: ban.user.displayAvatarURL?.() }
    );
  });

  client.on("guildMemberRemove", async (member) => {
    const audit = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
    const entry = audit.entries.first();
    if (entry && entry.target.id === member.id) {
      sendLog(
        "👢 Usuario expulsado",
        `Un usuario fue expulsado del servidor.`,
        Colors.Yellow,
        [
          { name: "Usuario", value: `${member.user.tag} (${member.id})`, inline: true },
          { name: "Ejecutor", value: entry.executor.tag, inline: true }
        ],
        { thumbnail: member.user.displayAvatarURL?.() }
      );
    }
  });

  // Agregar más eventos según sea necesario...
}
