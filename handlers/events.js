// handlers/events.js
import { Colors } from "discord.js";
import { configManager } from "../utils/configManager.js";
import { sendLogMessage, sendCommandLog } from "../utils/utilities.js";

// Obtener canal de logs (ajusta para multi-guild si quieres)
async function getLogChannelId(guildId) {
  // para multi-guild: return await configManager.get(`${guildId}_SERVER_LOG_CHANNEL_ID`);
  return await configManager.get("SERVER_LOG_CHANNEL_ID");
}

export function registerEvents(client) {

  // ========================
  // INTERACCIONES (comandos slash)
  // ========================
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`[COMMANDS] Comando no encontrado: ${interaction.commandName}`);
      return interaction.reply({ content: "❌ Comando no encontrado.", ephemeral: true });
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[COMMANDS] Error ejecutando ${interaction.commandName}:`, err);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "❌ Error al ejecutar el comando.", ephemeral: true });
        } else {
          await interaction.reply({ content: "❌ Error al ejecutar el comando.", ephemeral: true });
        }
      } catch (e) {
        console.error("No se pudo enviar respuesta de error:", e);
      }
    }
  });

  // ========================
  // CANALES
  // ========================
  client.on("channelCreate", async (channel) => {
    const logChannelId = await getLogChannelId(channel.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "📁 Canal Creado", `Nombre: ${channel.name}\nTipo: ${channel.type}`, Colors.Blue, logChannelId);
  });

  client.on("channelUpdate", async (oldChannel, newChannel) => {
    const logChannelId = await getLogChannelId(newChannel.guild?.id);
    if (!logChannelId) return;
    const changes = [];
    if (oldChannel.name !== newChannel.name) changes.push(`Nombre: \`${oldChannel.name}\` → \`${newChannel.name}\``);
    if (oldChannel.topic !== newChannel.topic) changes.push(`Tema: \`${oldChannel.topic ?? "N/A"}\` → \`${newChannel.topic ?? "N/A"}\``);
    if (oldChannel.permissionOverwrites.cache.size !== newChannel.permissionOverwrites.cache.size) changes.push("Permisos cambiaron");
    if (changes.length) sendLogMessage(client, "✏️ Canal Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
  });

  client.on("channelDelete", async (channel) => {
    const logChannelId = await getLogChannelId(channel.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "🗑 Canal Eliminado", `Nombre: ${channel.name}\nTipo: ${channel.type}`, Colors.Red, logChannelId);
  });

  // ========================
  // ROLES
  // ========================
  client.on("roleCreate", async (role) => {
    const logChannelId = await getLogChannelId(role.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "🎨 Rol Creado", `Nombre: ${role.name}\nColor: ${role.hexColor}`, Colors.Blue, logChannelId);
  });

  client.on("roleUpdate", async (oldRole, newRole) => {
    const logChannelId = await getLogChannelId(newRole.guild?.id);
    if (!logChannelId) return;
    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`Nombre: \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.color !== newRole.color) changes.push(`Color: \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) changes.push("Permisos cambiaron");
    if (changes.length) sendLogMessage(client, "✏️ Rol Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
  });

  client.on("roleDelete", async (role) => {
    const logChannelId = await getLogChannelId(role.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "🗑 Rol Eliminado", `Nombre: ${role.name}`, Colors.Red, logChannelId);
  });

  // ========================
  // MIEMBROS
  // ========================
  client.on("guildMemberAdd", async (member) => {
    const logChannelId = await getLogChannelId(member.guild.id);
    if (!logChannelId) return;
    sendLogMessage(client, "✅ Miembro Entró", `Usuario: ${member.user.tag}`, Colors.Green, logChannelId);
  });

  client.on("guildMemberRemove", async (member) => {
    const logChannelId = await getLogChannelId(member.guild.id);
    if (!logChannelId) return;
    sendLogMessage(client, "❌ Miembro Salió", `Usuario: ${member.user.tag}`, Colors.Red, logChannelId);
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const logChannelId = await getLogChannelId(newMember.guild.id);
    if (!logChannelId) return;
    const changes = [];
    if (oldMember.nickname !== newMember.nickname)
      changes.push(`Nick: \`${oldMember.nickname ?? oldMember.user.username}\` → \`${newMember.nickname ?? newMember.user.username}\``);
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) changes.push("Roles modificados");
    if (changes.length) sendLogMessage(client, "✏️ Miembro Actualizado", `${newMember.user.tag}\n${changes.join("\n")}`, Colors.Yellow, logChannelId);
  });

  // ========================
  // USUARIOS (global)
  // ========================
  client.on("userUpdate", async (oldUser, newUser) => {
    const logChannelId = await getLogChannelId(null);
    if (!logChannelId) return;
    if (oldUser.avatar !== newUser.avatar)
      sendLogMessage(client, "🖼 Avatar Cambiado", `Usuario: ${newUser.tag}\nNuevo Avatar: ${newUser.displayAvatarURL({ dynamic: true })}`, Colors.Purple, logChannelId);
    if (oldUser.username !== newUser.username)
      sendLogMessage(client, "✏️ Username Cambiado", `Usuario: ${oldUser.tag}\nNuevo username: ${newUser.username}`, Colors.Yellow, logChannelId);
  });

  // ========================
  // MENSAJES
  // ========================
  client.on("messageDelete", async (message) => {
    if (message.partial || !message.author || !message.channel) return;
    const logChannelId = await getLogChannelId(message.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "🗑 Mensaje Eliminado", `Autor: ${message.author.tag}\nCanal: ${message.channel.name}\nContenido: ${message.content ?? "[Sin contenido]"}`, Colors.Red, logChannelId);
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (oldMessage.partial || oldMessage.content === newMessage.content) return;
    const logChannelId = await getLogChannelId(newMessage.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "✏️ Mensaje Editado", `Autor: ${newMessage.author.tag}\nCanal: ${newMessage.channel.name}\nAntes: ${oldMessage.content}\nDespués: ${newMessage.content}`, Colors.Yellow, logChannelId);
  });

  // ========================
  // BANEOS
  // ========================
  client.on("guildBanAdd", async (ban) => {
    const logChannelId = await getLogChannelId(ban.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "🔨 Miembro Baneado", `Usuario: ${ban.user.tag}`, Colors.Red, logChannelId);
  });

  client.on("guildBanRemove", async (ban) => {
    const logChannelId = await getLogChannelId(ban.guild?.id);
    if (!logChannelId) return;
    sendLogMessage(client, "✅ Miembro Desbaneado", `Usuario: ${ban.user.tag}`, Colors.Green, logChannelId);
  });

  // ========================
  // GUILD
  // ========================
  client.on("guildUpdate", async (oldGuild, newGuild) => {
    const logChannelId = await getLogChannelId(newGuild.id);
    if (!logChannelId) return;
    const changes = [];
    if (oldGuild.name !== newGuild.name) changes.push(`Nombre: \`${oldGuild.name}\` → \`${newGuild.name}\``);
    if (oldGuild.icon !== newGuild.icon) changes.push("Icono cambiado");
    if (changes.length) sendLogMessage(client, "🏰 Servidor Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
  });

  console.log("[LOGS] Listeners de logs activados ✅");
}
