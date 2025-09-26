import { WebhookClient, EmbedBuilder, Colors } from "discord.js";
import dotenv from "dotenv";

dotenv.config(); // <-- lee .env

export function setupServerLogs(client) {
  // lee directamente variables del .env
  const premiumLogsEnabled = process.env.PREMIUM_LOGS_ENABLED === "true";
  const premiumWebhookUrl = process.env.PREMIUM_WEBHOOK_URL;

  if (!premiumLogsEnabled) {
    console.log("Logs premium desactivados (PREMIUM_LOGS_ENABLED=false).");
    return;
  }

  let webhookClient = null;
  if (premiumWebhookUrl) {
    webhookClient = new WebhookClient({ url: premiumWebhookUrl });
    console.log("Logsystem: usando PREMIUM_WEBHOOK_URL.");
  }

  const sendLog = async (title, description, color = Colors.Blue) => {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (webhookClient) {
      try {
        await webhookClient.send({ username: "Discorbitsonic Logs", embeds: [embed] });
      } catch (e) {
        console.error("Error enviando embed por webhook:", e);
      }
    }
  };

  // aquí van tus eventos (messageDelete, messageUpdate, etc.)
  client.on("messageDelete", message => {
    if (!message?.guild || message.author?.bot) return;
    sendLog("🗑 Mensaje eliminado",
      `**Usuario:** ${message.author?.tag ?? "?"} (${message.author?.id ?? "?"})\n**Canal:** <#${message.channel?.id ?? "?"}>\n**Mensaje:** ${message.content || "[No disponible]"}`,
      Colors.Red);
  });

  client.on("messageUpdate", (oldMessage, newMessage) => {
    if (!newMessage?.guild || newMessage.author?.bot) return;
    sendLog("✏️ Mensaje editado",
      `**Usuario:** ${newMessage.author?.tag ?? "?"} (${newMessage.author?.id ?? "?"})\n**Canal:** <#${newMessage.channel?.id ?? "?"}>\n**Antes:** ${oldMessage?.content || "[No disponible]"}\n**Después:** ${newMessage?.content || "[No disponible]"}`,
      Colors.Yellow);
  });

  client.on("guildBanAdd", ban => {
    if (!ban?.user) return;
    sendLog("⛔ Usuario baneado",
      `**Usuario:** ${ban.user.tag} (${ban.user.id}) fue baneado`,
      Colors.DarkRed);
  });

  client.on("guildBanRemove", ban => {
    if (!ban?.user) return;
    sendLog("♻️ Usuario desbaneado",
      `**Usuario:** ${ban.user.tag} (${ban.user.id}) fue desbaneado`,
      Colors.Green);
  });

  client.on("guildMemberAdd", member => {
    sendLog("✅ Nuevo miembro",
      `**Usuario:** ${member.user.tag} (${member.id}) se unió al servidor`,
      Colors.Green);
  });

  client.on("guildMemberRemove", member => {
    sendLog("❌ Miembro salido",
      `**Usuario:** ${member.user.tag} (${member.id}) salió o fue expulsado del servidor`,
      Colors.Red);

    // Detectar kick en audit logs
    member.guild.fetchAuditLogs({ type: 20, limit: 1 })
      .then(audit => {
        const entry = audit.entries.first();
        if (entry && entry.target?.id === member.id) {
          sendLog("👢 Usuario expulsado",
            `**Usuario:** ${member.user?.tag || member.id}\n**Ejecutor:** ${entry.executor?.tag || "No disponible"}`,
            Colors.Orange);
        }
      }).catch(() => {});
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(r => r.name).join(", ") || "Ninguno";
    const newRoles = newMember.roles.cache.map(r => r.name).join(", ") || "Ninguno";
    if (oldRoles !== newRoles) {
      sendLog("🛡 Rol actualizado",
        `**Usuario:** ${newMember.user.tag} (${newMember.id})\n**Antes:** ${oldRoles}\n**Después:** ${newRoles}`,
        Colors.Orange);
    }
  });

  client.on("messageReactionAdd", (reaction, user) => {
    if (user.bot) return;
    sendLog("➕ Reacción añadida",
      `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message?.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji?.name || "[No disponible]"}`);
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (user.bot) return;
    sendLog("➖ Reacción eliminada",
      `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message?.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji?.name || "[No disponible]"}`);
  });

  console.log("Logsystem (webhook premium) inicializado.");
}
