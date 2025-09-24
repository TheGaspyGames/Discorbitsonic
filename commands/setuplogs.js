import {
  SlashCommandBuilder,
  PermissionsBitField,
  Colors
} from "discord.js";
import { sendCommandLog, sendLogMessage } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("setuplogs")
  .setDescription("Configura el canal de logs del servidor.")
  .addChannelOption(opt =>
    opt.setName("canal")
      .setDescription("Canal donde se enviarán los logs")
      .setRequired(true)
  );

async function execute(interaction) {
  // Solo admins
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Solo administradores pueden usar este comando.", ephemeral: true });
  }

  // Canal elegido
  const logChannel = interaction.options.getChannel("canal");
  if (!logChannel) {
    return interaction.reply({ content: "❌ Debes elegir un canal.", ephemeral: true });
  }

  // Guardar en configManager
  await configManager.set("SERVER_LOG_CHANNEL_ID", logChannel.id);

  // Log del uso del comando
  await sendCommandLog(interaction.client, "setuplogs", interaction.user, `Canal: ${logChannel.name}`);

  await interaction.reply({ content: `✅ Logs configurados en ${logChannel}`, ephemeral: true });

  const client = interaction.client;

  // ========================
  // SUSCRIPCIÓN A EVENTOS
  // ========================
  const logChannelId = logChannel.id;

  // Canales
  client.on("channelCreate", ch =>
    sendLogMessage(client, "📁 Canal Creado", `Nombre: ${ch.name}\nTipo: ${ch.type}`, Colors.Blue, logChannelId)
  );

  client.on("channelUpdate", (oldC, newC) => {
    const changes = [];
    if (oldC.name !== newC.name) changes.push(`Nombre: \`${oldC.name}\` → \`${newC.name}\``);
    if (oldC.topic !== newC.topic) changes.push(`Tema: \`${oldC.topic ?? "N/A"}\` → \`${newC.topic ?? "N/A"}\``);
    if (oldC.permissionOverwrites.cache.size !== newC.permissionOverwrites.cache.size) changes.push("Permisos cambiaron");
    if (changes.length)
      sendLogMessage(client, "✏️ Canal Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
  });

  client.on("channelDelete", ch =>
    sendLogMessage(client, "🗑 Canal Eliminado", `Nombre: ${ch.name}\nTipo: ${ch.type}`, Colors.Red, logChannelId)
  );

  // Roles
  client.on("roleCreate", r =>
    sendLogMessage(client, "🎨 Rol Creado", `Nombre: ${r.name}\nColor: ${r.hexColor}`, Colors.Blue, logChannelId)
  );

  client.on("roleUpdate", (oldR, newR) => {
    const changes = [];
    if (oldR.name !== newR.name) changes.push(`Nombre: \`${oldR.name}\` → \`${newR.name}\``);
    if (oldR.color !== newR.color) changes.push(`Color: \`${oldR.hexColor}\` → \`${newR.hexColor}\``);
    if (oldR.permissions.bitfield !== newR.permissions.bitfield) changes.push("Permisos cambiaron");
    if (changes.length)
      sendLogMessage(client, "✏️ Rol Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
  });

  client.on("roleDelete", r =>
    sendLogMessage(client, "🗑 Rol Eliminado", `Nombre: ${r.name}`, Colors.Red, logChannelId)
  );

  // Miembros
  client.on("guildMemberAdd", m =>
    sendLogMessage(client, "✅ Miembro Entró", `Usuario: ${m.user.tag}`, Colors.Green, logChannelId)
  );

  client.on("guildMemberRemove", m =>
    sendLogMessage(client, "❌ Miembro Salió", `Usuario: ${m.user.tag}`, Colors.Red, logChannelId)
  );

  client.on("guildMemberUpdate", (oldM, newM) => {
    const changes = [];
    if (oldM.nickname !== newM.nickname)
      changes.push(`Nick: \`${oldM.nickname ?? oldM.user.username}\` → \`${newM.nickname ?? newM.user.username}\``);
    if (oldM.roles.cache.size !== newM.roles.cache.size) changes.push("Roles modificados");
    if (changes.length)
      sendLogMessage(client, "✏️ Miembro Actualizado", `${newM.user.tag}\n` + changes.join("\n"), Colors.Yellow, logChannelId);
  });

  client.on("userUpdate", (oldU, newU) => {
    if (oldU.avatar !== newU.avatar)
      sendLogMessage(client, "🖼 Avatar Cambiado", `Usuario: ${newU.tag}\nNuevo Avatar: ${newU.displayAvatarURL({ dynamic: true })}`, Colors.Purple, logChannelId);
    if (oldU.username !== newU.username)
      sendLogMessage(client, "✏️ Username Cambiado", `Usuario: ${oldU.tag}\nNuevo username: ${newU.username}`, Colors.Yellow, logChannelId);
  });

  // Mensajes
  client.on("messageDelete", m => {
    if (m.partial) return;
    sendLogMessage(client, "🗑 Mensaje Eliminado", `Autor: ${m.author.tag}\nCanal: ${m.channel.name}\nContenido: ${m.content ?? "[Sin contenido]"}`, Colors.Red, logChannelId);
  });

  client.on("messageUpdate", (oldM, newM) => {
    if (oldM.content === newM.content) return;
    sendLogMessage(client, "✏️ Mensaje Editado", `Autor: ${newM.author.tag}\nCanal: ${newM.channel.name}\nAntes: ${oldM.content}\nDespués: ${newM.content}`, Colors.Yellow, logChannelId);
  });

  // Baneos
  client.on("guildBanAdd", ban =>
    sendLogMessage(client, "🔨 Miembro Baneado", `Usuario: ${ban.user.tag}`, Colors.Red, logChannelId)
  );

  client.on("guildBanRemove", ban =>
    sendLogMessage(client, "✅ Miembro Desbaneado", `Usuario: ${ban.user.tag}`, Colors.Green, logChannelId)
  );

  // Servidor
  client.on("guildUpdate", (oldG, newG) => {
    const changes = [];
    if (oldG.name !== newG.name) changes.push(`Nombre: \`${oldG.name}\` → \`${newG.name}\``);
    if (oldG.icon !== newG.icon) changes.push("Icono cambiado");
    if (changes.length)
      sendLogMessage(client, "🏰 Servidor Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
  });

  console.log(`[LOGS] Logs activados en ${interaction.guild.name}, canal: ${logChannel.name}`);
}

export default {
  data,
  execute
};
