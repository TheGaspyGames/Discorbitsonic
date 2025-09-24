import { Events, EmbedBuilder, Colors, ChannelType } from "discord.js";
import { sendErrorReport, setLiveActivity, filterIPAddresses } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

export async function registerEvents(client) {

  // ========================
  // READY EVENT
  // ========================
  client.once(Events.ClientReady, async c => {
    try {
      // Salir de guilds no autorizadas
      for (const guild of client.guilds.cache.values()) {
        if (guild.id !== configManager.get("TARGET_GUILD_ID")) {
          console.log(`Leaving non-target guild: ${guild.name}`);
          await guild.leave();
        }
      }

      // Limpiar comandos globales
      await client.application.commands.set([]);
      console.log("Global commands cleared");

      // Sincronizar comandos en el guild objetivo
      const guild = client.guilds.cache.get(configManager.get("TARGET_GUILD_ID"));
      if (guild) {
        await guild.commands.set(client.commands.map(cmd => cmd.data));
        console.log(`✅ Synced ${client.commands.size} commands to target guild: ${guild.name}`);
      } else {
        console.warn("⚠️ Target guild not found. Check TARGET_GUILD_ID.");
      }

      await setLiveActivity(client);

    } catch (error) {
      console.error("Ready event error:", error);
      await sendErrorReport(client, `Ready event failed: ${error}`);
    }
  });

  // ========================
  // INTERACTIONS (SLASH COMMANDS)
  // ========================
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (!interaction.guild || interaction.guild.id !== configManager.get("TARGET_GUILD_ID")) {
      try {
        await interaction.reply({
          content: "❌ Este bot solo funciona en el servidor autorizado.",
          ephemeral: true
        });
      } catch {}
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error en comando ${interaction.commandName}:`, error);
      await sendErrorReport(client, error.toString(), interaction.commandName, interaction.user.id);

      const reply = {
        content: "❌ Ha ocurrido un error inesperado. El administrador ha sido notificado.",
        ephemeral: true
      };
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      } catch {}
    }
  });

  // ========================
  // MEMBER JOIN / LEAVE EVENTS (ACTIVITY UPDATE)
  // ========================
  client.on(Events.GuildMemberAdd, async member => {
    if (member.guild.id === configManager.get("TARGET_GUILD_ID") && !member.user.bot) {
      await setLiveActivity(client);
    }
  });

  client.on(Events.GuildMemberRemove, async member => {
    if (member.guild.id === configManager.get("TARGET_GUILD_ID") && !member.user.bot) {
      await setLiveActivity(client);
    }
  });

  client.on(Events.GuildCreate, async guild => {
    if (guild.id === configManager.get("TARGET_GUILD_ID")) {
      console.log(`Joined target guild: ${guild.name}`);
      await setLiveActivity(client);
      try {
        await guild.commands.set(client.commands.map(cmd => cmd.data));
      } catch (error) {
        console.error(`Failed to sync commands to target guild: ${error}`);
        await sendErrorReport(client, `Failed to sync commands to target guild: ${error}`);
      }
    } else {
      try {
        let channel = null;
        if (guild.systemChannel && guild.systemChannel.permissionsFor(guild.members.me)?.has(['SendMessages'])) {
          channel = guild.systemChannel;
        } else {
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
            .setDescription("Este bot solo funciona en el servidor autorizado. Se autoabandonará.")
            .setColor(Colors.Red);
          await channel.send({ embeds: [embed] });
        }
        await guild.leave();
      } catch (error) {
        console.error(`Error leaving non-target guild ${guild.name}:`, error);
      }
    }
  });

  client.on(Events.GuildDelete, async guild => {
    if (guild.id === configManager.get("TARGET_GUILD_ID")) {
      console.log(`Removed from target guild: ${guild.name}`);
      await setLiveActivity(client);
    }
  });

  // ========================
  // DM MONITORING
  // ========================
  client.on(Events.MessageCreate, async message => {
    if (message.channel.type === ChannelType.DM && message.author.id !== client.user.id) {
      try {
        if (!configManager.get('DM_MONITORING_ENABLED')) return;
        if (message.author.id === configManager.get('DM_EXCLUDED_USER_ID')) return;

        // Aquí podrías enviar log de DM si tienes LOG_CHANNEL_ID
      } catch (error) {
        console.error(`Error logging DM: ${error}`);
        await sendErrorReport(client, `Error logging DM from ${message.author.username}: ${error}`, "DM_Logging");
      }
    }
  });

  // ========================
  // GLOBAL ERROR HANDLER
  // ========================
  client.on(Events.Error, async error => {
    console.error("Discord client error:", error);
    await sendErrorReport(client, `Discord client error: ${error}`);
  });

}
