// utils/logsystem.js
import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
import fs from "fs";
import path from "path";

// Leer config.json
const configPath = path.join(process.cwd(), "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Configuración del webhook
const webhookUrl = config.PREMIUM_WEBHOOK_URL;
const premiumEnabled = config.PREMIUM_LOGS_ENABLED;

const webhookClient = webhookUrl && premiumEnabled ? new WebhookClient({ url: webhookUrl }) : null;

export function setupServerLogs(client) {
  if (!webhookClient) {
    console.log("🔕 Logs premium desactivados o webhook no configurado");
    return;
  }

  console.log("✅ Logsystem iniciado, webhook activo");
  // Mensaje de prueba al iniciar
  webhookClient.send("🚀 Logs premium activados y webhook funcionando desde logsystem.js");

  async function sendLog(title, description, color = Colors.Blurple) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();
    try {
      await webhookClient.send({ embeds: [embed] });
      console.log(`📤 Enviado log: ${title}`);
    } catch (err) {
      console.error("❌ Error al enviar log:", err);
    }
  }

  // Mensaje eliminado
  client.on("messageDelete", async (message) => {
    if (message.author?.bot) return;
    sendLog(
      "🗑️ Mensaje eliminado",
      `**Autor:** ${message.author?.tag || "Desconocido"}\n**Canal:** <#${message.channel.id}>\n**Contenido:**\n${message.content || "(sin contenido)"}`,
      Colors.Red
    );
  });

  // Mensaje editado
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    sendLog(
      "✏️ Mensaje editado",
      `**Autor:** ${oldMessage.author.tag}\n**Canal:** <#${oldMessage.channel.id}>\n**Antes:** ${oldMessage.content}\n**Después:** ${newMessage.content}`,
      Colors.Orange
    );
  });

  // Nuevo miembro
  client.on("guildMemberAdd", (member) => {
    sendLog("👋 Nuevo miembro", `**Usuario:** ${member.user.tag} (${member.id})`, Colors.Green);
  });

  // Miembro salió
  client.on("guildMemberRemove", (member) => {
    sendLog("🚪 Miembro salió", `**Usuario:** ${member.user.tag} (${member.id})`, Colors.DarkGrey);
  });

  // Kick detectado vía audit log
  client.on("guildMemberRemove", async (member) => {
    try {
      const audit = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }); // MEMBER_KICK
      const entry = audit.entries.first();
      if (entry && entry.target.id === member.id) {
        sendLog(
          "👢 Miembro expulsado",
          `**Usuario:** ${member.user.tag} (${member.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}`,
          Colors.Yellow
        );
      }
    } catch (err) {
      console.error("❌ Error audit logs kick:", err);
    }
  });

  // Ban
  client.on("guildBanAdd", async (ban) => {
    try {
      const audit = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
      const entry = audit.entries.first();
      if (entry && entry.target.id === ban.user.id) {
        return sendLog(
          "⛔ Usuario baneado",
          `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}`,
          Colors.DarkRed
        );
      }
    } catch (err) {
      console.error("❌ Error audit logs ban:", err);
    }
    sendLog("⛔ Usuario baneado", `**Usuario:** ${ban.user.tag} (${ban.user.id})`, Colors.DarkRed);
  });

  // Unban
  client.on("guildBanRemove", async (ban) => {
    try {
      const audit = await ban.guild.fetchAuditLogs({ type: 23, limit: 1 });
      const entry = audit.entries.first();
      if (entry && entry.target.id === ban.user.id) {
        return sendLog(
          "✅ Usuario desbaneado",
          `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}`,
          Colors.Green
        );
      }
    } catch (err) {
      console.error("❌ Error audit logs unban:", err);
    }
    sendLog("✅ Usuario desbaneado", `**Usuario:** ${ban.user.tag} (${ban.user.id})`, Colors.Green);
  });
}
