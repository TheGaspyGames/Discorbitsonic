import { EmbedBuilder, Colors } from "discord.js";
import fs from "fs";
import path from "path";

export function setupServerLogs(client) {
  const configPath = path.join(process.cwd(), "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  if (!config.PREMIUM_LOGS_ENABLED) return;
  if (!config.PREMIUM_ID) return console.log("❌ PREMIUM_ID no definido en config.json");

  const sendLog = async (title, description, color = Colors.Blue) => {
    try {
      const channel = await client.channels.fetch(config.PREMIUM_ID);
      if (!channel) return;
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    } catch(err) {
      console.error("Error enviando log:", err);
    }
  };

  // Mensajes eliminados y editados
  client.on("messageDelete", message => {
    if (!message?.author || message.author.bot) return;
    sendLog("🗑 Mensaje eliminado", `**Usuario:** ${message.author.tag} (${message.author.id})\n**Canal:** <#${message.channel?.id || "No disponible"}>\n**Mensaje:** ${message.content || "[No disponible]"}`, Colors.Red);
  });

  client.on("messageUpdate", (oldMessage, newMessage) => {
    if (!newMessage?.author || newMessage.author.bot) return;
    sendLog("✏️ Mensaje editado", `**Usuario:** ${newMessage.author.tag} (${newMessage.author.id})\n**Canal:** <#${newMessage.channel?.id || "No disponible"}>\n**Antes:** ${oldMessage?.content || "[No disponible]"}\n**Después:** ${newMessage?.content || "[No disponible]"}`, Colors.Yellow);
  });

  // Miembros que entran o salen
  client.on("guildMemberAdd", member => {
    if (!member?.user) return;
    sendLog("✅ Nuevo miembro", `**Usuario:** ${member.user.tag} (${member.id}) se unió al servidor`, Colors.Green);
  });

  client.on("guildMemberRemove", member => {
    if (!member?.user) return;
    sendLog("❌ Miembro salido", `**Usuario:** ${member.user.tag} (${member.id}) salió o fue expulsado del servidor`, Colors.Red);
  });

  // Actualización de roles
  client.on("guildMemberUpdate", (oldMember, newMember) => {
    if (!oldMember?.roles || !newMember?.roles || !newMember?.user) return;
    const oldRoles = oldMember.roles.cache.map(r => r.name).join(", ") || "Ninguno";
    const newRoles = newMember.roles.cache.map(r => r.name).join(", ") || "Ninguno";
    if (oldRoles !== newRoles) {
      sendLog("🛡 Rol actualizado", `**Usuario:** ${newMember.user.tag} (${newMember.id})\n**Antes:** ${oldRoles}\n**Después:** ${newRoles}`, Colors.Orange);
    }
  });

  // Reacciones
  client.on("messageReactionAdd", (reaction, user) => {
    if (!user || user.bot) return;
    sendLog("➕ Reacción añadida", `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message?.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji?.name || "[No disponible]"}`);
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (!user || user.bot) return;
    sendLog("➖ Reacción eliminada", `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message?.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji?.name || "[No disponible]"}`);
  });

  // ============================
  // Baneos, unbaneos y kicks
  // ============================
  client.on("guildBanAdd", async (ban) => {
    if (!ban?.user) return;
    sendLog("⛔ Usuario baneado", `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Servidor:** ${ban.guild?.name || "No disponible"}`, Colors.Red);
  });

  client.on("guildBanRemove", async (ban) => {
    if (!ban?.user) return;
    sendLog("✅ Usuario desbaneado", `**Usuario:** ${ban.user.tag} (${ban.user.id})\n**Servidor:** ${ban.guild?.name || "No disponible"}`, Colors.Green);
  });

  client.on("guildMemberRemove", member => {
    if (!member?.user || !member.guild) return;
    // Para diferenciar un kick de un leave natural, habría que usar audit logs
    member.guild.fetchAuditLogs({ type: "MEMBER_KICK", limit: 1 }).then(audit => {
      const kick = audit.entries.first();
      if (kick && kick.target.id === member.id) {
        sendLog("👢 Usuario expulsado", `**Usuario:** ${member.user.tag} (${member.id})\n**Ejecutor:** ${kick.executor?.tag || "No disponible"}`, Colors.Orange);
      }
    }).catch(() => {});
  });
}
