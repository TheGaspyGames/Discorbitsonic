// utils/logsystem.js
import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

// Variables del .env
const webhookUrl = process.env.PREMIUM_WEBHOOK_URL;
const premiumEnabled = process.env.PREMIUM_LOGS_ENABLED === "true";

const webhookClient = webhookUrl && premiumEnabled ? new WebhookClient({ url: webhookUrl }) : null;

export function setupServerLogs(client) {
  // -------------------------------
  // Usuario entra o sale de canal de voz
  // -------------------------------
  client.on("voiceStateUpdate", (oldState, newState) => {
    // Entró a un canal de voz
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
    // Salió de un canal de voz
    else if (oldState.channel && !newState.channel) {
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
      .setFooter({
        text: "Premium Logs 500€",
        iconURL: "https://media.tenor.com/eWbZcoL6GokAAAAj/teto-teto-kasane.gif" // Cambia por tu icono premium
      })
      .setAuthor({
        name: "LOGS PREMIUM 500€",
        iconURL: "https://media.tenor.com/eWbZcoL6GokAAAAj/teto-teto-kasane.gif"
      });
    if (fields.length) embed.addFields(fields);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    await webhookClient.send({ embeds: [embed] });
  }

  // -------------------------------
  // Mensajes eliminados / editados
  // -------------------------------
  client.on("messageDelete", async (message) => {
    if (!message.partial && message.author?.bot) return;
    sendLog(
      "🗑️ Mensaje eliminado",
      `Un mensaje fue eliminado en el servidor.`,
      Colors.Red,
      [
        { name: "Autor", value: message.author?.tag || "Desconocido", inline: true },
        { name: "Canal", value: `<#${message.channel.id}>`, inline: true },
        { name: "Contenido", value: message.content || "(sin contenido)", inline: false }
      ],
      { thumbnail: message.author?.displayAvatarURL?.() }
    );
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    sendLog(
      "✏️ Mensaje editado",
      `Un mensaje fue editado en el servidor.`,
      Colors.Orange,
      [
        { name: "Autor", value: oldMessage.author.tag, inline: true },
        { name: "Canal", value: `<#${oldMessage.channel.id}>`, inline: true },
        { name: "Antes", value: oldMessage.content, inline: false },
        { name: "Después", value: newMessage.content, inline: false }
      ],
      { thumbnail: oldMessage.author.displayAvatarURL?.() }
    );
  });

  // -------------------------------
  // Usuarios entran o salen / kick
  // -------------------------------
  client.on("guildMemberAdd", (member) => {
    sendLog(
      "👋 Nuevo miembro",
      `Un usuario se ha unido al servidor.`,
      Colors.Green,
      [
        { name: "Usuario", value: `${member.user.tag} (${member.id})`, inline: true }
      ],
      { thumbnail: member.user.displayAvatarURL?.() }
    );
  });

  client.on("guildMemberRemove", async (member) => {
    try {
      const audit = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }); // Kick
      const entry = audit.entries.first();
      // Si fue kick, solo loguear el kick y no el 'salió'
      if (entry && entry.target.id === member.id && Date.now() - entry.createdTimestamp < 5000) {
        sendLog(
          "👢 Miembro expulsado",
          `Un usuario fue expulsado del servidor.`,
          Colors.Yellow,
          [
            { name: "Usuario", value: `${member.user.tag} (${member.id})`, inline: true },
            { name: "Ejecutor", value: entry.executor?.tag || "Desconocido", inline: true },
            { name: "Razón", value: entry.reason || "No especificada", inline: false }
          ],
          { thumbnail: member.user.displayAvatarURL?.() }
        );
      } else {
        sendLog(
          "🚪 Miembro salió",
          `Un usuario salió del servidor.`,
          Colors.DarkGrey,
          [
            { name: "Usuario", value: `${member.user.tag} (${member.id})`, inline: true }
          ],
          { thumbnail: member.user.displayAvatarURL?.() }
        );
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
        `Un usuario fue baneado del servidor.`,
        Colors.DarkRed,
        [
          { name: "Usuario", value: `${ban.user.tag} (${ban.user.id})`, inline: true },
          { name: "Ejecutor", value: entry?.executor?.tag || "Desconocido", inline: true },
          { name: "Razón", value: entry?.reason || "No especificada", inline: false }
        ],
        { thumbnail: ban.user.displayAvatarURL?.() }
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
        `Un usuario fue desbaneado del servidor.`,
        Colors.Green,
        [
          { name: "Usuario", value: `${ban.user.tag} (${ban.user.id})`, inline: true },
          { name: "Ejecutor", value: entry?.executor?.tag || "Desconocido", inline: true },
          { name: "Razón", value: entry?.reason || "No especificada", inline: false }
        ],
        { thumbnail: ban.user.displayAvatarURL?.() }
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
          `Se han modificado los roles de un usuario.`,
          Colors.Green,
          [
            { name: "Usuario", value: newMember.user.tag, inline: true },
            { name: "Roles añadidos", value: addedRoles.size ? addedRoles.map(r => r.name).join(", ") : "Ninguno", inline: true },
            { name: "Roles removidos", value: removedRoles.size ? removedRoles.map(r => r.name).join(", ") : "Ninguno", inline: true },
            { name: "Ejecutor", value: entry?.executor?.tag || "Desconocido", inline: true },
            { name: "Razón", value: entry?.reason || "No especificada", inline: false }
          ],
          { thumbnail: newMember.user.displayAvatarURL?.() }
        );
      }

      if (oldMember.nickname !== newMember.nickname && oldMember.user.displayAvatarURL() === newMember.user.displayAvatarURL()) {
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

      if (oldMember.user.displayAvatarURL() !== newMember.user.displayAvatarURL()) {
        sendLog(
          "🖼️ Avatar de usuario cambiado",
          `Un usuario cambió su avatar.`,
          Colors.Orange,
          [
            { name: "Usuario", value: newMember.user.tag, inline: true },
            { name: "Avatar anterior", value: oldMember.user.displayAvatarURL(), inline: true },
            { name: "Avatar nuevo", value: newMember.user.displayAvatarURL(), inline: true }
          ],
          { thumbnail: newMember.user.displayAvatarURL?.() }
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
      `Se ha creado un nuevo rol en el servidor.`,
      Colors.Green,
      [
        { name: "Rol", value: `${role.name} (<@&${role.id}>)`, inline: true },
        { name: "Ejecutor", value: entry?.executor?.tag || "Desconocido", inline: true },
        { name: "Permisos", value: role.permissions.toArray().join(", "), inline: false },
        { name: "Razón", value: entry?.reason || "No especificada", inline: false }
      ]
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
      `Un rol fue eliminado del servidor.`,
      Colors.Red,
      [
        { name: "Rol", value: role.name, inline: true },
        { name: "Ejecutor", value: entry?.executor?.tag || "Desconocido", inline: true },
        { name: "Permisos", value: role.permissions.toArray().join(", "), inline: false },
        { name: "Razón", value: entry?.reason || "No especificada", inline: false }
      ]
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
        "Se han modificado los permisos de un rol.",
        Colors.Orange,
        [
          { name: "Rol", value: `${newRole.name} (<@&${newRole.id}>)`, inline: true },
          { name: "Ejecutor", value: entry?.executor?.tag || "Desconocido", inline: true },
          { name: "Antes", value: oldRole.permissions.toArray().join(", "), inline: false },
          { name: "Después", value: newRole.permissions.toArray().join(", "), inline: false },
          { name: "Razón", value: entry?.reason || "No especificada", inline: false }
        ]
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
          `El icono del servidor ha sido actualizado.`,
          Colors.Orange,
          [
            { name: "Servidor", value: newGuild.name, inline: true }
          ],
          { thumbnail: newGuild.iconURL?.() }
        );
      }
    } catch (err) {
      console.error("❌ Error guildUpdate:", err);
    }
  });
}
