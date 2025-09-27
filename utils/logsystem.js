// utils/logsystem.js
import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
import fs from "fs";
import path from "path";

// Leer config.json con fs
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
  webhookClient.send("🚀 Logs premium activados y webhook funcionando desde logsystem.js");

  async function sendLog(title, description, color = Colors.Blurple) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();
    await webhookClient.send({ embeds: [embed] });
    console.log(`📤 Enviado log: ${title}`);
  }

  // Eventos (igual que antes)
  client.on("messageDelete", async (message) => {
    if (!message.partial && message.author?.bot) return;
    sendLog("🗑️ Mensaje eliminado",
      `**Autor:** ${message.author?.tag || "Desconocido"}\n**Canal:** <#${message.channel.id}>\n**Contenido:**\n${message.content || "(sin contenido)"}`,
      Colors.Red);
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    console.log("💬 Evento messageUpdate detectado");
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    sendLog("✏️ Mensaje editado",
      `**Autor:** ${oldMessage.author.tag}\n**Canal:** <#${oldMessage.channel.id}>\n**Antes:** ${oldMessage.content}\n**Después:** ${newMessage.content}`,
      Colors.Orange);
  });

  client.on("guildMemberAdd", (member) => {
    console.log("👋 Evento guildMemberAdd detectado");
    sendLog("👋 Nuevo miembro",
      `**Usuario:** ${member.user.tag} (${member.id})`,
      Colors.Green);
  });

  client.on("guildMemberRemove", (member) => {
    console.log("🚪 Evento guildMemberRemove detectado");
    sendLog("🚪 Miembro salió",
      `**Usuario:** ${member.user.tag} (${member.id})`,
      Colors.DarkGrey);
  });

  client.on("guildMemberRemove", async (member) => {
    try {
      const audit = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
      const entry = audit.entries.first();
      if (entry && entry.target.id === member.id) {
        console.log("👢 Kick detectado vía audit log");
        sendLog("👢 Miembro expulsado",
          `**Usuario:** ${member.user.tag} (${member.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}`,
          Colors.Yellow);
      }
    } catch (err) {
      console.error("❌ Error audit logs kick:", err);
    }
  });

  client.on("guildBanAdd", async (ban) => {
    console.log("⛔ Evento guildBanAdd detectado");
    try {
      const audit = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
      const entry = audit.entries.first();
      if (entry && entry.target.id === ban.user.id) {
        return sendLog("⛔ Usuario baneado",
          `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}`,
          Colors.DarkRed);
      }
    } catch (err) {
      console.error("❌ Error audit logs ban:", err);
    }
    sendLog("⛔ Usuario baneado", `**Usuario:** ${ban.user.tag} (${ban.user.id})`, Colors.DarkRed);
  });

  client.on("guildBanRemove", async (ban) => {
    console.log("✅ Evento guildBanRemove detectado");
    try {
      const audit = await ban.guild.fetchAuditLogs({ type: 23, limit: 1 });
      const entry = audit.entries.first();
      if (entry && entry.target.id === ban.user.id) {
        return sendLog("✅ Usuario desbaneado",
          `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}`,
          Colors.Green);
      }
    } catch (err) {
      console.error("❌ Error audit logs unban:", err);
    }
    sendLog("✅ Usuario desbaneado", `**Usuario:** ${ban.user.tag} (${ban.user.id})`, Colors.Green);
  });
}
