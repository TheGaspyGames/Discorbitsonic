import { EmbedBuilder, Colors } from "discord.js";
import { configManager } from "./configManager.js";

async function sendServerLog(client, title, description, color = Colors.Blue) {
  const logChannel = await client.channels.fetch(configManager.get("SERVER_LOG_CHANNEL_ID")).catch(() => null);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(description)
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}

export const logBan = (client, user) =>
  sendServerLog(client, "🔨 Usuario Baneado", `Usuario: ${user.tag}`, Colors.Red);

export const logUnban = (client, user) =>
  sendServerLog(client, "✅ Usuario Desbaneado", `Usuario: ${user.tag}`, Colors.Green);

export const logKick = (client, user, reason) =>
  sendServerLog(client, "👢 Usuario Expulsado", `Usuario: ${user.tag}\nRazón: ${reason || "No especificada"}`, Colors.Orange);

export const logRoleUpdate = (client, oldRole, newRole, changes) =>
  sendServerLog(client, "✏️ Rol Actualizado", `Rol: ${newRole.name}\nCambios:\n${changes.join("\n")}`, Colors.Yellow);

export const logChannelUpdate = (client, oldChannel, newChannel, changes) =>
  sendServerLog(client, "✏️ Canal Actualizado", `Canal: ${newChannel.name}\nCambios:\n${changes.join("\n")}`, Colors.Yellow);

export const logServerUpdate = (client, changes) =>
  sendServerLog(client, "🏰 Servidor Actualizado", changes.join("\n"), Colors.Yellow);

export const logUserUpdate = (client, oldUser, newUser, changes) =>
  sendServerLog(client, "👤 Usuario Actualizado", `Usuario: ${newUser.tag}\nCambios:\n${changes.join("\n")}`, Colors.Yellow);

export const logMemberUpdate = (client, oldMember, newMember, changes) =>
  sendServerLog(client, "📝 Miembro Actualizado", `Usuario: ${newMember.user.tag}\nCambios:\n${changes.join("\n")}`, Colors.Yellow);

export const logMessageUpdate = (client, oldMessage, newMessage) => {
  if (!oldMessage.content || oldMessage.content === newMessage.content) return;
  const description = `Autor: ${newMessage.author.tag}\nCanal: ${newMessage.channel?.name ?? "Desconocido"}\n\n**Antes:** ${oldMessage.content}\n**Ahora:** ${newMessage.content}`;
  sendServerLog(client, "✏️ Mensaje Editado", description, Colors.Yellow);
};
