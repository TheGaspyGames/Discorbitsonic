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

  client.on("messageDelete", message => {
    if (message.author?.bot) return;
    sendLog("🗑 Mensaje eliminado", `**Usuario:** ${message.author.tag} (${message.author.id})\n**Canal:** <#${message.channel.id}>\n**Mensaje:** ${message.content || "[No disponible]"}`, Colors.Red);
  });

  client.on("messageUpdate", (oldMessage, newMessage) => {
    if (newMessage.author?.bot) return;
    sendLog("✏️ Mensaje editado", `**Usuario:** ${newMessage.author.tag} (${newMessage.author.id})\n**Canal:** <#${newMessage.channel.id}>\n**Antes:** ${oldMessage.content}\n**Después:** ${newMessage.content}`, Colors.Yellow);
  });

  client.on("guildMemberAdd", member => {
    sendLog("✅ Nuevo miembro", `**Usuario:** ${member.user.tag} (${member.id}) se unió al servidor`, Colors.Green);
  });

  client.on("guildMemberRemove", member => {
    sendLog("❌ Miembro salido", `**Usuario:** ${member.user.tag} (${member.id}) salió o fue expulsado del servidor`, Colors.Red);
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache.map(r => r.name).join(", ");
    const newRoles = newMember.roles.cache.map(r => r.name).join(", ");
    if (oldRoles !== newRoles) {
      sendLog("🛡 Rol actualizado", `**Usuario:** ${newMember.user.tag} (${newMember.id})\n**Antes:** ${oldRoles || "Ninguno"}\n**Después:** ${newRoles || "Ninguno"}`, Colors.Orange);
    }
  });

  client.on("messageReactionAdd", (reaction, user) => {
    if (user.bot) return;
    sendLog("➕ Reacción añadida", `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji.name}`);
  });

  client.on("messageReactionRemove", (reaction, user) => {
    if (user.bot) return;
    sendLog("➖ Reacción eliminada", `**Usuario:** ${user.tag} (${user.id})\n**Mensaje:** ${reaction.message.content || "[No disponible]"}\n**Emoji:** ${reaction.emoji.name}`);
  });
}
