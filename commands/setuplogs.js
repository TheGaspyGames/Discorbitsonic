import { SlashCommandBuilder, PermissionsBitField, Colors } from "discord.js";
import { sendLogMessage } from "../utilities.js";
import { configManager } from "../configManager.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setuplogs")
    .setDescription("Activa logs completos del servidor de forma profesional"),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Solo administradores pueden usar este comando.", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const client = guild.client;

    // Canal de logs persistente para eventos del servidor
    let logChannelId = configManager.get("SERVER_LOG_CHANNEL_ID");
    let logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;

    if (!logChannel) {
      logChannel = await guild.channels.create({
        name: "server-logs",
        type: 0, // GUILD_TEXT
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.SendMessages] }
        ]
      });
      await configManager.set("SERVER_LOG_CHANNEL_ID", logChannel.id);
    }

    await interaction.editReply(`✅ Canal de logs configurado: ${logChannel}`);

    /** =======================
     *  EVENTOS DE LOGS DEL SERVIDOR
     *  =======================
     */

    // Canales
    client.on("channelCreate", ch => sendLogMessage(client, "📁 Canal Creado", `Nombre: ${ch.name}\nTipo: ${ch.type}`, Colors.Blue, logChannel.id));
    client.on("channelUpdate", (oldC, newC) => {
      const changes = [];
      if (oldC.name !== newC.name) changes.push(`Nombre: \`${oldC.name}\` → \`${newC.name}\``);
      if (oldC.topic !== newC.topic) changes.push(`Tema: \`${oldC.topic ?? "N/A"}\` → \`${newC.topic ?? "N/A"}\``);
      if (oldC.permissionOverwrites.cache.size !== newC.permissionOverwrites.cache.size) changes.push("Permisos cambiados");
      if (changes.length) sendLogMessage(client, "✏️ Canal Actualizado", changes.join("\n"), Colors.Yellow, logChannel.id);
    });
    client.on("channelDelete", ch => sendLogMessage(client, "🗑 Canal Eliminado", `Nombre: ${ch.name}\nTipo: ${ch.type}`, Colors.Red, logChannel.id));

    // Roles
    client.on("roleCreate", r => sendLogMessage(client, "🎨 Rol Creado", `Nombre: ${r.name}\nColor: ${r.hexColor}`, Colors.Blue, logChannel.id));
    client.on("roleUpdate", (oldR, newR) => {
      const changes = [];
      if (oldR.name !== newR.name) changes.push(`Nombre: \`${oldR.name}\` → \`${newR.name}\``);
      if (oldR.color !== newR.color) changes.push(`Color: \`${oldR.hexColor}\` → \`${newR.hexColor}\``);
      if (oldR.permissions.bitfield !== newR.permissions.bitfield) changes.push("Permisos cambiaron");
      if (changes.length) sendLogMessage(client, "✏️ Rol Actualizado", changes.join("\n"), Colors.Yellow, logChannel.id);
    });
    client.on("roleDelete", r => sendLogMessage(client, "🗑 Rol Eliminado", `Nombre: ${r.name}`, Colors.Red, logChannel.id));

    // Miembros
    client.on("guildMemberAdd", m => sendLogMessage(client, "✅ Miembro Entró", `Usuario: ${m.user.tag}`, Colors.Green, logChannel.id));
    client.on("guildMemberRemove", m => sendLogMessage(client, "❌ Miembro Salió", `Usuario: ${m.user.tag}`, Colors.Red, logChannel.id));

    client.on("guildMemberUpdate", (oldM, newM) => {
      const changes = [];
      if (oldM.nickname !== newM.nickname) changes.push(`Nick: \`${oldM.nickname ?? oldM.user.username}\` → \`${newM.nickname ?? newM.user.username}\``);
      if (oldM.roles.cache.size !== newM.roles.cache.size) changes.push("Roles modificados");
      if (changes.length) sendLogMessage(client, "✏️ Miembro Actualizado", `${newM.user.tag}\n` + changes.join("\n"), Colors.Yellow, logChannel.id);
    });

    client.on("userUpdate", (oldU, newU) => {
      if (oldU.avatar !== newU.avatar)
        sendLogMessage(client, "🖼 Avatar Cambiado", `Usuario: ${newU.tag}\nNuevo Avatar: ${newU.displayAvatarURL({ dynamic: true })}`, Colors.Purple, logChannel.id);
      if (oldU.username !== newU.username)
        sendLogMessage(client, "✏️ Username Cambiado", `Usuario: ${oldU.tag}\nNuevo username: ${newU.username}`, Colors.Yellow, logChannel.id);
    });

    client.on("messageDelete", m => {
      if (m.partial) return;
      sendLogMessage(client, "🗑 Mensaje Eliminado", `Autor: ${m.author.tag}\nCanal: ${m.channel.name}\nContenido: ${m.content ?? "[No hay contenido]"}`, Colors.Red, logChannel.id);
    });
    client.on("messageUpdate", (oldM, newM) => {
      if (oldM.content === newM.content) return;
      sendLogMessage(client, "✏️ Mensaje Editado", `Autor: ${newM.author.tag}\nCanal: ${newM.channel.name}\nAntes: ${oldM.content}\nDespués: ${newM.content}`, Colors.Yellow, logChannel.id);
    });

    client.on("guildBanAdd", ban => sendLogMessage(client, "🔨 Miembro Baneado", `Usuario: ${ban.user.tag}`, Colors.Red, logChannel.id));
    client.on("guildBanRemove", ban => sendLogMessage(client, "✅ Miembro Desbaneado", `Usuario: ${ban.user.tag}`, Colors.Green, logChannel.id));

    client.on("guildUpdate", (oldG, newG) => {
      const changes = [];
      if (oldG.name !== newG.name) changes.push(`Nombre: \`${oldG.name}\` → \`${newG.name}\``);
      if (oldG.icon !== newG.icon) changes.push("Icono cambiado");
      if (changes.length) sendLogMessage(client, "🏰 Servidor Actualizado", changes.join("\n"), Colors.Yellow, logChannel.id);
    });

    console.log(`[LOGS] Logs profesionales de 500 euros activados en ${guild.name}, canal: ${logChannel.name}`);
  }
};
