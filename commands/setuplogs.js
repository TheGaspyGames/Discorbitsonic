import { SlashCommandBuilder, PermissionsBitField, ChannelType, Colors } from "discord.js";
import { sendLogMessage } from "../utilities.js";
import { configManager } from "../configManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setuplogs")
    .setDescription("Configura y activa logs que costaron 500 euros del servidor")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal donde enviar los logs")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Solo administradores pueden usar este comando.", ephemeral: true });
    }

    const channel = interaction.options.getChannel("canal");

    // Guardar canal en configManager para persistencia
    await configManager.set("SERVER_LOG_CHANNEL_ID", channel.id);

    await interaction.reply({ content: `✅ Canal de logs configurado: ${channel}`, ephemeral: true });

    const guild = interaction.guild;
    const client = guild.client;

    /** =======================
     *  EVENTOS DE LOGS DEL SERVIDOR
     *  =======================
     */
    const logChannelId = channel.id;

    // Canales
    client.on("channelCreate", ch => sendLogMessage(client, "📁 Canal Creado", `Nombre: ${ch.name}\nTipo: ${ch.type}`, Colors.Blue, logChannelId));
    client.on("channelUpdate", (oldC, newC) => {
      const changes = [];
      if (oldC.name !== newC.name) changes.push(`Nombre: \`${oldC.name}\` → \`${newC.name}\``);
      if (oldC.topic !== newC.topic) changes.push(`Tema: \`${oldC.topic ?? "N/A"}\` → \`${newC.topic ?? "N/A"}\``);
      if (oldC.permissionOverwrites.cache.size !== newC.permissionOverwrites.cache.size) changes.push("Permisos cambiados");
      if (changes.length) sendLogMessage(client, "✏️ Canal Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
    });
    client.on("channelDelete", ch => sendLogMessage(client, "🗑 Canal Eliminado", `Nombre: ${ch.name}\nTipo: ${ch.type}`, Colors.Red, logChannelId));

    // Roles
    client.on("roleCreate", r => sendLogMessage(client, "🎨 Rol Creado", `Nombre: ${r.name}\nColor: ${r.hexColor}`, Colors.Blue, logChannelId));
    client.on("roleUpdate", (oldR, newR) => {
      const changes = [];
      if (oldR.name !== newR.name) changes.push(`Nombre: \`${oldR.name}\` → \`${newR.name}\``);
      if (oldR.color !== newR.color) changes.push(`Color: \`${oldR.hexColor}\` → \`${newR.hexColor}\``);
      if (oldR.permissions.bitfield !== newR.permissions.bitfield) changes.push("Permisos cambiaron");
      if (changes.length) sendLogMessage(client, "✏️ Rol Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
    });
    client.on("roleDelete", r => sendLogMessage(client, "🗑 Rol Eliminado", `Nombre: ${r.name}`, Colors.Red, logChannelId));

    // Miembros (nicknames/roles/avatar)
    client.on("guildMemberUpdate", (oldM, newM) => {
      const changes = [];
      if (oldM.nickname !== newM.nickname) changes.push(`Nick: \`${oldM.nickname ?? oldM.user.username}\` → \`${newM.nickname ?? newM.user.username}\``);
      if (oldM.roles.cache.size !== newM.roles.cache.size) changes.push("Roles modificados");
      if (changes.length) sendLogMessage(client, "✏️ Miembro Actualizado", `${newM.user.tag}\n` + changes.join("\n"), Colors.Yellow, logChannelId);
    });

    // Cambios en usuario (avatar/username)
    client.on("userUpdate", (oldU, newU) => {
      if (oldU.avatar !== newU.avatar)
        sendLogMessage(client, "🖼 Avatar Cambiado", `Usuario: ${newU.tag}\nNuevo Avatar: ${newU.displayAvatarURL({ dynamic: true })}`, Colors.Purple, logChannelId);
      if (oldU.username !== newU.username)
        sendLogMessage(client, "✏️ Username Cambiado", `Usuario: ${oldU.tag}\nNuevo username: ${newU.username}`, Colors.Yellow, logChannelId);
    });

    // Entradas, salidas y expulsiones
    client.on("guildMemberAdd", m => sendLogMessage(client, "✅ Miembro Entró", `Usuario: ${m.user.tag}`, Colors.Green, logChannelId));

    client.on("guildMemberRemove", async m => {
      try {
        const fetchedLogs = await m.guild.fetchAuditLogs({
          limit: 1,
          type: 20 // MEMBER_KICK
        });
        const kickLog = fetchedLogs.entries.first();

        if (kickLog && kickLog.target.id === m.id && Date.now() - kickLog.createdTimestamp < 5000) {
          const { executor, reason } = kickLog;
          sendLogMessage(
            client,
            "⛔ Miembro Expulsado",
            `Usuario: ${m.user.tag}\nExpulsado por: ${executor.tag}\nRazón: ${reason ?? "No especificada"}`,
            Colors.Red,
            logChannelId
          );
        } else {
          sendLogMessage(client, "❌ Miembro Salió", `Usuario: ${m.user.tag}`, Colors.Red, logChannelId);
        }
      } catch (err) {
        console.error("Error al comprobar expulsión:", err);
        sendLogMessage(client, "❌ Miembro Salió", `Usuario: ${m.user.tag}`, Colors.Red, logChannelId);
      }
    });

    // Mensajes eliminados/editados
    client.on("messageDelete", m => {
      if (m.partial) return;
      sendLogMessage(client, "🗑 Mensaje Eliminado", `Autor: ${m.author.tag}\nCanal: ${m.channel.name}\nContenido: ${m.content ?? "[No hay contenido]"}`, Colors.Red, logChannelId);
    });
    client.on("messageUpdate", (oldM, newM) => {
      if (oldM.content === newM.content) return;
      sendLogMessage(client, "✏️ Mensaje Editado", `Autor: ${newM.author.tag}\nCanal: ${newM.channel.name}\nAntes: ${oldM.content}\nDespués: ${newM.content}`, Colors.Yellow, logChannelId);
    });

    // Baneos / desbaneos con auditoría
    client.on("guildBanAdd", async ban => {
      try {
        const fetchedLogs = await ban.guild.fetchAuditLogs({
          limit: 1,
          type: 22 // MEMBER_BAN_ADD
        });
        const banLog = fetchedLogs.entries.first();

        if (banLog && banLog.target.id === ban.user.id && Date.now() - banLog.createdTimestamp < 5000) {
          const { executor, reason } = banLog;
          sendLogMessage(client, "🔨 Miembro Baneado", `Usuario: ${ban.user.tag}\nBaneado por: ${executor.tag}\nRazón: ${reason ?? "No especificada"}`, Colors.Red, logChannelId);
        } else {
          sendLogMessage(client, "🔨 Miembro Baneado", `Usuario: ${ban.user.tag}`, Colors.Red, logChannelId);
        }
      } catch (err) {
        console.error("Error al comprobar ban:", err);
        sendLogMessage(client, "🔨 Miembro Baneado", `Usuario: ${ban.user.tag}`, Colors.Red, logChannelId);
      }
    });

    client.on("guildBanRemove", async ban => {
      try {
        const fetchedLogs = await ban.guild.fetchAuditLogs({
          limit: 1,
          type: 23 // MEMBER_BAN_REMOVE
        });
        const unbanLog = fetchedLogs.entries.first();

        if (unbanLog && unbanLog.target.id === ban.user.id && Date.now() - unbanLog.createdTimestamp < 5000) {
          const { executor, reason } = unbanLog;
          sendLogMessage(client, "✅ Miembro Desbaneado", `Usuario: ${ban.user.tag}\nDesbaneado por: ${executor.tag}\nRazón: ${reason ?? "No especificada"}`, Colors.Green, logChannelId);
        } else {
          sendLogMessage(client, "✅ Miembro Desbaneado", `Usuario: ${ban.user.tag}`, Colors.Green, logChannelId);
        }
      } catch (err) {
        console.error("Error al comprobar desban:", err);
        sendLogMessage(client, "✅ Miembro Desbaneado", `Usuario: ${ban.user.tag}`, Colors.Green, logChannelId);
      }
    });

    // Cambios en el servidor
    client.on("guildUpdate", (oldG, newG) => {
      const changes = [];
      if (oldG.name !== newG.name) changes.push(`Nombre: \`${oldG.name}\` → \`${newG.name}\``);
      if (oldG.icon !== newG.icon) changes.push("Icono cambiado");
      if (changes.length) sendLogMessage(client, "🏰 Servidor Actualizado", changes.join("\n"), Colors.Yellow, logChannelId);
    });

    console.log(`[LOGS] Logs profesionales de 500 euros activados en ${guild.name}, canal: ${channel.name}`);
  }
};
