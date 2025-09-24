import { Events, EmbedBuilder, Colors, ChannelType, PermissionsBitField } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendErrorReport, sendLogMessage, setLiveActivity, filterIPAddresses } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

export async function registerEvents(client) {
  // =========================
  // CLIENT READY
  // =========================
  client.once(Events.ClientReady, async c => {
    try {
      // Dejar guilds no objetivo
      for (const guild of client.guilds.cache.values()) {
        if (guild.id !== config.TARGET_GUILD_ID) {
          console.log(`Leaving non-target guild: ${guild.name} (${guild.id})`);
          await guild.leave();
        }
      }

      // Sincronización de comandos
      const guild = client.guilds.cache.get(config.TARGET_GUILD_ID);
      if (!guild) return console.warn("⚠️ Guild no encontrado. Verifica TARGET_GUILD_ID.");

      console.log("🟢 Sincronizando comandos...");
      const commandData = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
      await guild.commands.set([]); // limpiar viejos comandos
      await guild.commands.set(commandData); // agregar nuevos
      console.log(`✅ Sincronizados ${commandData.length} comandos en guild objetivo`);

      await setLiveActivity(client);

      // Log de conexión
      await sendLogMessage(
        client,
        "🟢 Bot Conectado",
        `Bot iniciado como ${client.user.username}\n• Comandos sincronizados: ${client.commands.size}\n• Servidor objetivo: ${config.TARGET_GUILD_ID}\n• Intents activos: miembros, contenido de mensajes, servidores`,
        Colors.Green
      );

    } catch (error) {
      const errorMsg = `Failed to sync commands: ${error}`;
      console.error(errorMsg);
      await sendErrorReport(client, errorMsg, "Command Sync");
    }
  });

  // =========================
  // INTERACTION CREATE
  // =========================
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guild || interaction.guild.id !== config.TARGET_GUILD_ID) {
      return interaction.reply({ content: "❌ Este bot solo funciona en el servidor autorizado.", ephemeral: true });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error en comando ${interaction.commandName}:`, error);
      await sendErrorReport(client, error.toString(), interaction.commandName, interaction.user.id);

      const reply = {
        content: "❌ Ha ocurrido un error inesperado. El administrador ha sido notificado.",
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  });

  // =========================
  // GUILD EVENTS
  // =========================
  client.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id === config.TARGET_GUILD_ID && !member.user.bot) await setLiveActivity(client);
  });

  client.on(Events.GuildMemberRemove, async member => {
    if (member.guild.id === config.TARGET_GUILD_ID && !member.user.bot) await setLiveActivity(client);
  });

  client.on(Events.GuildCreate, async guild => {
    if (guild.id !== config.TARGET_GUILD_ID) {
      try {
        let channel = guild.systemChannel || guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me)?.has(['SendMessages']));
        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle("❌ Servidor No Autorizado")
            .setDescription("Este bot solo funciona en el servidor autorizado. Abandonando automáticamente.")
            .setColor(Colors.Red);
          await channel.send({ embeds: [embed] });
        }
      } catch {}
      await guild.leave();
      return;
    }

    console.log(`Joined target guild: ${guild.name}`);
    await sendLogMessage(client, "🟢 Unión al Servidor Objetivo", `Bot añadido al servidor: **${guild.name}**`, Colors.Green);
    
    // Sincroniza comandos al unir
    const commandData = Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
    await guild.commands.set(commandData);
    await setLiveActivity(client);
  });

  client.on(Events.GuildDelete, async guild => {
    if (guild.id === config.TARGET_GUILD_ID) {
      console.log(`Removed from target guild: ${guild.name}`);
      await sendLogMessage(client, "🔴 Expulsado del Servidor Objetivo", `Bot removido del servidor: **${guild.name}**`, Colors.Red);
      await setLiveActivity(client);
    }
  });

  // =========================
  // DM MONITORING
  // =========================
  client.on(Events.MessageCreate, async message => {
    if (message.channel.type !== ChannelType.DM || message.author.id === client.user.id) return;

    if (!configManager.get('DM_MONITORING_ENABLED')) return;
    if (message.author.id === configManager.get('DM_EXCLUDED_USER_ID')) return;

    try {
      const embed = new EmbedBuilder()
        .setTitle("📬 Mensaje Directo Recibido")
        .setColor(Colors.Blue)
        .addFields({ name: "👤 Usuario", value: `${message.author} (${message.author.username})\nID: \`${message.author.id}\`` });
      
      embed.addFields({ name: "📝 Contenido", value: message.content.length > 0 ? message.content.substring(0,1000) : "*Sin texto*" });

      if (message.attachments.size > 0) {
        const attachmentInfo = Array.from(message.attachments.values()).map(a => `• ${a.name} (${a.size} bytes)`).slice(0, 3).join("\n");
        embed.addFields({ name: "📎 Archivos Adjuntos", value: attachmentInfo });
      }

      const logChannelId = configManager.get('LOG_CHANNEL_ID');
      if (logChannelId) {
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error(`Error logging DM: ${error}`);
      await sendErrorReport(client, `Error logging DM: ${error}`, "DM_Logging");
    }
  });

  // =========================
  // GLOBAL ERROR HANDLER
  // =========================
  client.on(Events.Error, async error => {
    console.error(`Discord client error: ${error}`);
    await sendErrorReport(client, `Discord client error: ${error}`);
  });
}
