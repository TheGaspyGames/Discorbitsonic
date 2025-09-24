import { Events, EmbedBuilder, Colors, ChannelType } from "discord.js";
import config from "../config.json" with { type: "json" };
import { sendErrorReport, sendLogMessage, setLiveActivity, filterIPAddresses } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

export function registerEvents(client) {
  // Ready event - enhanced initialization
  client.once(Events.ClientReady, async c => {
    try {
      // Leave any non-target guilds
      for (const guild of client.guilds.cache.values()) {
        if (guild.id !== config.TARGET_GUILD_ID) {
          console.log(`Leaving non-target guild: ${guild.name} (${guild.id})`);
          await guild.leave();
        }
      }

      // Clear and remove any old global commands
      console.log('Clearing old global commands...');
      client.application.commands.set([]);
      console.log('Global commands cleared');

      // Sync commands only to target guild
      const guild = client.guilds.cache.get(config.TARGET_GUILD_ID);
      if (guild) {
        await guild.commands.set(client.commands.map(cmd => cmd.data));
        console.log(`✅ Bot conectado como ${c.user.tag}`);
        console.log(`✅ Synced ${client.commands.size} command(s) to target guild`);
        console.log('Bot is running successfully with slash commands enabled!');
      } else {
        console.warn("⚠️ Guild no encontrado. Verifica TARGET_GUILD_ID.");
      }

      // Set live activity
      await setLiveActivity(client);

      // Send connection log
      await sendLogMessage(
        client,
        "🟢 Bot Conectado",
        `Bot iniciado exitosamente como ${client.user.username}\n• Comandos sincronizados: ${client.commands.size}\n• Servidor objetivo: ${config.TARGET_GUILD_ID}\n• Intents activos: miembros, contenido de mensajes, servidores`,
        Colors.Green
      );

    } catch (error) {
      const errorMsg = `Failed to sync commands: ${error}`;
      console.log(errorMsg);
      console.log('Bot is running but slash commands may not work.');
      await sendErrorReport(client, errorMsg, "Command Sync");

      // Still send basic connection log even if sync failed
      await sendLogMessage(
        client,
        "⚠️ Bot Conectado (Advertencia)",
        `Bot conectado como ${client.user.username} pero hubo problemas sincronizando comandos\nError: ${filterIPAddresses(error.toString())}`,
        Colors.Orange
      );
    }
  });

  // Enhanced interaction handling with guild restriction
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Guild restriction check
    if (!interaction.guild || interaction.guild.id !== config.TARGET_GUILD_ID) {
      try {
        await interaction.reply({
          content: "❌ Este bot solo funciona en el servidor autorizado.",
          ephemeral: true
        });
      } catch (error) {
        // Ignore if we can't respond
      }
      return;
    }

    const command = interaction.client.commands.get(interaction.commandName);
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

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      } catch (followupError) {
        // Ignore if we can't respond
      }
    }
  });

  // Member join event - update activity
  client.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id === config.TARGET_GUILD_ID && !member.user.bot) {
      await setLiveActivity(client);
    }
  });

  // Member leave event - update activity
  client.on(Events.GuildMemberRemove, async member => {
    if (member.guild.id === config.TARGET_GUILD_ID && !member.user.bot) {
      await setLiveActivity(client);
    }
  });

  // Guild join event - only stay in target guild
  client.on(Events.GuildCreate, async guild => {
    if (guild.id === config.TARGET_GUILD_ID) {
      console.log(`Joined target guild: ${guild.name}`);
      await sendLogMessage(
        client,
        "🟢 Unión al Servidor Objetivo",
        `Bot añadido exitosamente al servidor: **${guild.name}**\nID: \`${guild.id}\`\nMiembros: ${guild.memberCount}`,
        Colors.Green
      );
      
      // Sync commands to target guild
      try {
        await guild.commands.set(client.commands.map(cmd => cmd.data));
        console.log(`Commands synced to target guild: ${guild.name}`);
      } catch (error) {
        console.log(`Failed to sync commands to target guild: ${error}`);
        await sendErrorReport(client, `Failed to sync commands to target guild: ${error}`);
      }
      await setLiveActivity(client);
    } else {
      console.log(`Joining non-target guild: ${guild.name} (${guild.id}) - sending notice and leaving`);
      
      // Send message to a channel before leaving
      try {
        let channel = null;
        if (guild.systemChannel && guild.systemChannel.permissionsFor(guild.members.me)?.has(['SendMessages'])) {
          channel = guild.systemChannel;
        } else {
          // Try to find any channel we can send messages to
          for (const ch of guild.channels.cache.values()) {
            if (ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me)?.has(['SendMessages'])) {
              channel = ch;
              break;
            }
          }
        }

        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle("❌ Servidor No Autorizado")
            .setDescription("Este bot solo funciona en el servidor autorizado. El bot abandonará este servidor automáticamente.")
            .setColor(Colors.Red)
            .addFields({
              name: "Información",
              value: "Si necesitas usar este bot, contacta al administrador del bot.",
              inline: false
            });

          await channel.send({ embeds: [embed] });
          console.log(`Sent notice message to ${guild.name}`);
          await sendLogMessage(
            client,
            "⚠️ Servidor No Autorizado",
            `Bot añadido a servidor no autorizado: **${guild.name}**\nID: \`${guild.id}\`\nAcción: Mensaje enviado y salida automática`,
            Colors.Orange
          );
        } else {
          console.log(`Could not find a channel to send notice in ${guild.name}`);
        }
      } catch (error) {
        console.log(`Failed to send notice to ${guild.name}: ${error}`);
      }

      // Leave the guild
      try {
        await guild.leave();
        console.log(`Left non-target guild: ${guild.name}`);
        await sendLogMessage(
          client,
          "🚪 Salida de Servidor No Autorizado",
          `Bot salió del servidor: **${guild.name}**\nID: \`${guild.id}\`\nRazón: No es el servidor objetivo`,
          Colors.Greyple
        );
      } catch (error) {
        console.log(`Failed to leave guild ${guild.name}: ${error}`);
      }
    }
  });

  // Guild leave event
  client.on(Events.GuildDelete, async guild => {
    if (guild.id === config.TARGET_GUILD_ID) {
      console.log(`Removed from target guild: ${guild.name}`);
      await sendLogMessage(
        client,
        "🔴 Expulsado del Servidor Objetivo",
        `Bot removido del servidor: **${guild.name}**\nID: \`${guild.id}\`\nEstado: Esperando nueva invitación`,
        Colors.Red
      );
      await setLiveActivity(client);
    } else {
      console.log(`Left non-target guild: ${guild.name}`);
    }
  });

  // DM monitoring event
  client.on(Events.MessageCreate, async message => {
    // Only process DMs to the bot (not from the bot)
    if (message.channel.type === ChannelType.DM && message.author.id !== client.user.id) {
      try {
        // Check if DM monitoring is enabled
        const dmMonitoringEnabled = configManager.get('DM_MONITORING_ENABLED');
        if (!dmMonitoringEnabled) {
          return;
        }

        // Check if this is from the excluded user
        const excludedUserId = configManager.get('DM_EXCLUDED_USER_ID');
        const isExcludedUser = message.author.id === excludedUserId;

        // Skip logging if this is the excluded user
        if (isExcludedUser) {
          return;
        }

        // Create DM log embed
        const embed = new EmbedBuilder()
          .setTitle("📬 Mensaje Directo Recibido")
          .setColor(Colors.Blue)
          .addFields({
            name: "👤 Usuario",
            value: `${message.author} (${message.author.username})\nID: \`${message.author.id}\``,
            inline: true
          });

        // Message content
        embed.addFields({
          name: "📝 Contenido",
          value: message.content.length > 0 ? message.content.substring(0, 1000) : "*Sin texto*",
          inline: false
        });

        // Add attachments info if any
        if (message.attachments.size > 0) {
          const attachmentInfo = Array.from(message.attachments.values())
            .slice(0, 3)
            .map(att => `• ${att.name} (${att.size} bytes)`)
            .join('\n');
          
          let finalAttachmentInfo = attachmentInfo;
          if (message.attachments.size > 3) {
            finalAttachmentInfo += `\n... y ${message.attachments.size - 3} más`;
          }
          
          embed.addFields({
            name: "📎 Archivos Adjuntos",
            value: finalAttachmentInfo,
            inline: false
          });
        }

        embed.setFooter({ text: `Recibido el ${message.createdAt.toLocaleString()}` });

        // Send to log channel
        const logChannelId = configManager.get('LOG_CHANNEL_ID');
        if (logChannelId) {
          const logChannel = client.channels.cache.get(logChannelId);
          if (logChannel) {
            await logChannel.send({ embeds: [embed] });
          }
        }

      } catch (error) {
        console.log(`Error logging DM: ${error}`);
        await sendErrorReport(client, `Error logging DM from ${message.author.username}: ${error}`, "DM_Logging");
      }
    }
  });

  // Global error handler
  client.on(Events.Error, async error => {
    console.log(`Discord client error: ${error}`);
    await sendErrorReport(client, `Discord client error: ${error}`);
  });
}
