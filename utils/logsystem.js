import { WebhookClient, EmbedBuilder, Colors } from "discord.js";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "config.json");

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.error("No se pudo leer config.json:", e);
    return {};
  }
}

export function setupServerLogs(client) {
  const config = readConfig();

  if (!config.PREMIUM_LOGS_ENABLED) {
    console.log("Logs premium desactivados (PREMIUM_LOGS_ENABLED=false).");
    return;
  }

  if (!config.PREMIUM_ID && !config.PREMIUM_WEBHOOK_URL && !(config.PREMIUM_WEBHOOK_ID && config.PREMIUM_WEBHOOK_TOKEN)) {
    console.log("❌ PREMIUM_ID o webhook no definidos en config.json - logs premium no iniciados.");
    return;
  }

  // Inicializar WebhookClient si hay webhook configurado
  let webhookClient = null;
  try {
    if (config.PREMIUM_WEBHOOK_URL) {
      webhookClient = new WebhookClient({ url: config.PREMIUM_WEBHOOK_URL });
      console.log("Logsystem: usando PREMIUM_WEBHOOK_URL.");
    } else if (config.PREMIUM_WEBHOOK_ID && config.PREMIUM_WEBHOOK_TOKEN) {
      webhookClient = new WebhookClient({ id: config.PREMIUM_WEBHOOK_ID, token: config.PREMIUM_WEBHOOK_TOKEN });
      console.log("Logsystem: usando PREMIUM_WEBHOOK_ID + TOKEN.");
    }
  } catch (e) {
    console.error("Error creando WebhookClient:", e);
    webhookClient = null;
  }

  const sendViaWebhook = async (embed) => {
    if (!webhookClient) return false;
    try {
      await webhookClient.send({ username: "Discorbitsonic Logs", embeds: [embed] });
      return true;
    } catch (e) {
      console.error("Error enviando embed por webhook:", e);
      return false;
    }
  };

  const sendLog = async (title, description, color = Colors.Blue) => {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    // Intentar webhook primero
    if (await sendViaWebhook(embed)) return;

    // Fallback: enviar como bot al canal PREMIUM_ID (si existe)
    try {
      const cfg = readConfig(); // re-lectura por si cambió
      if (!cfg.PREMIUM_ID) return;
      const channel = await client.channels.fetch(cfg.PREMIUM_ID).catch(() => null);
      if (!channel) return;
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error("Error enviando log por channel.send:", err);
    }
  };

  // ---------- Eventos ----------
  client.on("messageDelete", message => {
    if (!message?.guild) return;
    if (message.author?.bot) return;
    sendLog("🗑 Mensaje eliminado",
      `**Usuario:** ${message.author?.tag ?? "Desconocido"} (${message.author?.id ?? "?"})\n**Canal:** <#${message.channel?.id ?? "?"}>\n**Mensaje:** ${message.content || "[No disponible]"}`,
      Colors.Red);
  });

  client.on("messageUpdate", (oldMessage, newMessage) => {
    if (!newMessage?.guild) return;
    if (newMessage.author?.bot) return;
    sendLog("✏️ Mensaje editado",
      `**Usuario:** ${newMessage.author?.tag ?? "Desconocido"} (${newMessage.author?.id ?? "?"})\n**Canal:** <#${newMessage.channel?.id ?? "?"}>\n**Antes:** ${oldMessage?.content || "[No disponible]"}\n**Después:** ${newMessage?.content || "[No disponible]"}`,
      Colors.Yellow);
  });

  client.on("guildMemberAdd", member => {
    if (!member?.user) return;
    sendLog("✅ Nuevo miembro",
      `**Usuario:** ${member.user.tag} (${member.id}) se unió al servidor`,
      Colors.Green);
  });

  client.on("guildMemberRemove", member => {
    if (!member?.user) return;
    sendLog("❌ Miembro salido",
      `**Usuario:** ${member.user.tag} (${member.id}) salió o fue expulsado del servidor`,
      Colors.Red);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (!oldMember?.roles || !newMember?.roles || !newMember?.user) return;
    const oldRoles = oldMember.roles.cache.map(r => r.name).join(", ") || "Ninguno";
    const newRoles = newMember.roles.cache.map(r => r.name).join(", ") || "Ninguno";
    if (oldRoles !== newRoles) {
      sendLog("🛡 Rol actualizado",
        `**Usuario:** ${newMember.user.tag} (${newMember.id})\n**Antes:** ${oldRoles}\n**Después:** ${newRoles}`,
        Colors.Orange);
    }
  });

  client.on("messageReactionAdd", (reaction, user) => {
    if (!user || user.bot) return;
    sendLog("➕ Reacción añadida",
      `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message?.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji?.name || "[No disponible]"}`);
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (!user || user.bot) return;
    sendLog("➖ Reacción eliminada",
      `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message?.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji?.name || "[No disponible]"}`);
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

  client.on("guildMemberRemove", member => {
    // intentar detectar kick por audit logs
    try {
      if (!member?.guild || !member?.id) return;
      member.guild.fetchAuditLogs({ type: 20, limit: 1 }) // 20 = MEMBER_KICK
        .then(audit => {
          const entry = audit.entries.first();
          if (entry && entry.target && entry.target.id === member.id) {
            sendLog("👢 Usuario expulsado",
              `**Usuario:** ${member.user?.tag || member.id} (${member.id})\n**Ejecutor:** ${entry.executor?.tag || "No disponible"}`,
              Colors.Orange);
          }
        }).catch(()=>{});
    } catch(e){}
  });

  console.log("Logsystem (webhook mode) inicializado.");
}
