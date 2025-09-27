// utils/logsystem.js
import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// Variables del .env
const webhookUrl = process.env.PREMIUM_WEBHOOK_URL;
const premiumEnabled = process.env.PREMIUM_LOGS_ENABLED === "true";

const webhookClient = webhookUrl && premiumEnabled ? new WebhookClient({ url: webhookUrl }) : null;

export function setupServerLogs(client) {
  if (!webhookClient) {
    console.log("🔕 Logs premium desactivados o webhook no configurado");
    return;
  }

  async function sendLog(title, description, color = Colors.Blurple) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();
    await webhookClient.send({ embeds: [embed] });
  }

  // -------------------------------
  // Mensajes eliminados / editados
  // -------------------------------
  client.on("messageDelete", async (message) => {
    if (!message.partial && message.author?.bot) return;
    sendLog(
      "🗑️ Mensaje eliminado",
      `**Autor:** ${message.author?.tag || "Desconocido"}\n**Canal:** <#${message.channel.id}>\n**Contenido:** ${message.content || "(sin contenido)"}`,
      Colors.Red
    );
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    sendLog(
      "✏️ Mensaje editado",
      `**Autor:** ${oldMessage.author.tag}\n**Canal:** <#${oldMessage.channel.id}>\n**Antes:** ${oldMessage.content}\n**Después:** ${newMessage.content}`,
      Colors.Orange
    );
  });

  // -------------------------------
  // Usuarios entran o salen / kick
  // -------------------------------
  client.on("guildMemberAdd", (member) => {
    sendLog("👋 Nuevo miembro", `**Usuario:** ${member.user.tag} (${member.id})`, Colors.Green);
  });

  client.on("guildMemberRemove", async (member) => {
    try {
      const audit = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }); // Kick
      const entry = audit.entries.first();
      if (entry && entry.target.id === member.id) {
        sendLog(
          "👢 Miembro expulsado",
          `**Usuario:** ${member.user.tag} (${member.id})\n**Ejecutor:** ${entry.executor?.tag || "Desconocido"}\n**Razón:** ${entry.reason || "No especificada"}`,
          Colors.Yellow
        );
      } else {
        sendLog("🚪 Miembro salió", `**Usuario:** ${member.user.tag} (${member.id})`, Colors.DarkGrey);
      }
    } catch (err) {
      console.error("Error audit logs kick:", err);
    }
  });

  // -------------------------------
  // Ban / Unban
  // -------------------------------
  client.on("guildBanAdd", async (ban) => {
    try {
      const audit = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }); // MEMBER_BAN_ADD
      const entry = audit.entries.first();
      sendLog(
        "⛔ Usuario baneado",
        `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Ejecutor:** ${entry?.executor?.tag || "Desconocido"}\n**Razón:** ${entry?.reason || "No especificada"}`,
        Colors.DarkRed
      );
    } catch (err) {
      console.error("Error audit logs ban:", err);
    }
  });

  client.on("guildBanRemove", async (ban) => {
    try {
      const audit = await ban.guild.fetchAuditLogs({ type: 23, limit: 1 }); // MEMBER_BAN_REMOVE
      const entry = audit.entries.first();
      sendLog(
        "✅ Usuario desbaneado",
        `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Ejecutor:** ${entry?.executor?.tag || "Desconocido"}\n**Razón:** ${entry?.reason || "No especificada"}`,
        Colors.Green
      );
    } catch (err) {
      console.error("Error audit logs unban:", err);
    }
  });

  // -------------------------------
  // Roles y nick / username / avatar
  // -------------------------------
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
      const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
      const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

      if (addedRoles.size || removedRoles.size) {
        const audit = await newMember.guild.fetchAuditLogs({ type: 25, limit: 1 }); // MEMBER_ROLE_UPDATE
        const entry = audit.entries.first();
        sendLog(
          "🛠️ Roles modificados",
          `**Usuario:** ${newMember.user.tag}\n**Roles añadidos:** ${addedRoles.size ? addedRoles.map(r => r.name).join(", ") : "Ninguno"}\n**Roles removidos:** ${removedRoles.size ? removedRoles.map(r => r.name).join(", ") : "Ninguno"}\n**Ejecutor:** ${entry?.executor?.tag || "Desconocido"}\n**Razón:** ${entry?.reason || "No especificada"}`,
          Colors.Green
        );
      }

      if (oldMember.nickname !== newMember.nickname) {
        sendLog(
          "✏️ Nick cambiado",
          `**Usuario:** ${newMember.user.tag}\n**Antes:** ${oldMember.nickname || "(sin nick)"}\n**Después:** ${newMember.nickname || "(sin nick)"}`,
          Colors.Orange
        );
      }

      if (oldMember.user.username !== newMember.user.username) {
        sendLog(
          "🖋️ Nombre de Discord cambiado",
          `**Antes:** ${oldMember.user.username}\n**Después:** ${newMember.user.username}`,
          Colors.Orange
        );
      }

      if (oldMember.user.displayAvatarURL() !== newMember.user.displayAvatarURL()) {
        sendLog(
          "🖼️ Avatar de usuario cambiado",
          `**Usuario:** ${newMember.user.tag}`,
          Colors.Orange
        );
      }
    } catch (err) {
      console.error("❌ Error guildMemberUpdate:", err);
    }
  });
  
// -------------------------------
// Creación de rol
// -------------------------------
client.on("roleCreate", async (role) => {
  try {
    const audit = await role.guild.fetchAuditLogs({ type: 29, limit: 1 }); // ROLE_CREATE
    const entry = audit.entries.first();
    sendLog(
      "🆕 Nuevo rol creado",
      `**Rol:** ${role.name} (<@&${role.id}>)\n**Ejecutor:** ${entry?.executor?.tag || "Desconocido"}\n**Permisos:** ${role.permissions.toArray().join(", ")}\n**Razón:** ${entry?.reason || "No especificada"}`,
      Colors.Green
    );
  } catch (err) {
    console.error("❌ Error roleCreate:", err);
  }
});

  // -------------------------------
// Eliminación de rol
// -------------------------------
client.on("roleDelete", async (role) => {
  try {
    const audit = await role.guild.fetchAuditLogs({ type: 31, limit: 1 }); // ROLE_DELETE
    const entry = audit.entries.first();
    sendLog(
      "❌ Rol eliminado",
      `**Rol:** ${role.name}\n**Ejecutor:** ${entry?.executor?.tag || "Desconocido"}\n**Permisos:** ${role.permissions.toArray().join(", ")}\n**Razón:** ${entry?.reason || "No especificada"}`,
      Colors.Red
    );
  } catch (err) {
    console.error("❌ Error roleDelete:", err);
  }
});
  

// -------------------------------
// Permisos de rol modificados
// -------------------------------
client.on("roleUpdate", async (oldRole, newRole) => {
  try {
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      const audit = await newRole.guild.fetchAuditLogs({ type: 30, limit: 1 }); // ROLE_UPDATE
      const entry = audit.entries.first();
      sendLog(
        "🔧 Permisos de rol modificados",
        `**Rol:** ${newRole.name} (<@&${newRole.id}>)\n**Ejecutor:** ${entry?.executor?.tag || "Desconocido"}\n**Razón:** ${entry?.reason || "No especificada"}\n**Antes:** ${oldRole.permissions.toArray().join(", ")}\n**Después:** ${newRole.permissions.toArray().join(", ")}`,
        Colors.Orange
      );
    }
  } catch (err) {
    console.error("❌ Error roleUpdate:", err);
  }
});


  // -------------------------------
  // Cambios de icono del servidor
  // -------------------------------
  client.on("guildUpdate", async (oldGuild, newGuild) => {
    try {
      if (oldGuild.iconURL() !== newGuild.iconURL()) {
        sendLog(
          "🖼️ Icono del servidor cambiado",
          `**Servidor:** ${newGuild.name}`,
          Colors.Orange
        );
      }
    } catch (err) {
      console.error("❌ Error guildUpdate:", err);
    }
  });
}
