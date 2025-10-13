/**
 * Fetches recent commits from the GitHub repo (para !updgit)
 */
/**
 * Dummy para setLiveActivity (no implementado)
 */
export function setLiveActivity() {}
import { EmbedBuilder, Colors } from "discord.js";
import config from "/data/data/com.termux/files/home/discorbitsonic/config.json" with { type: "json" };
import { configManager } from "./configManager.js";
import pm2 from "pm2";
import pmx from "pmx";


/**
 * Calculates similarity between two strings using a simple algorithm
 */
export function calculateSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Helper function to calculate Levenshtein distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Splits a long message into multiple chunks to respect Discord's character limit
 */
export function splitMessage(text, maxLength = 2000) {
  const chunks = [];
  let remainingText = text;
  
  while (remainingText.length > maxLength) {
    let splitPoint = remainingText.lastIndexOf('\n', maxLength);
    if (splitPoint === -1) {
      splitPoint = maxLength;
    }
    chunks.push(remainingText.substring(0, splitPoint));
    remainingText = remainingText.substring(splitPoint).trimStart();
  }
  
  if (remainingText.length > 0) {
    chunks.push(remainingText);
  }
  
  return chunks;
}

/**
 * Filters out IP addresses from text for privacy
 */
export function filterIPAddresses(text) {
  const ipv4Pattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  return text.replace(ipv4Pattern, '[IP_FILTERED]');
}

/**
 * Checks if user is authorized to use admin commands
 */
export function isAuthorized(interaction) {
  return configManager.isAuthorized(interaction.user.id);
}

/**
 * Sends an error report to the log channel
 */
export async function sendErrorReport(client, errorMessage, commandName = null, userId = null) {
  const filteredMessage = filterIPAddresses(errorMessage);
  
  const embed = new EmbedBuilder()
    .setTitle("🚨 Error Report")
    .setColor(Colors.Red)
    .setDescription(`**Error:** ${filteredMessage}`)
    .setTimestamp();
  
  if (commandName) {
    embed.addFields({ name: "Command", value: commandName, inline: true });
  }
  
  if (userId) {
    embed.addFields({ name: "User ID", value: userId.toString(), inline: true });
  }
  
  try {
    const logChannelId = configManager.get('LOG_CHANNEL_ID');
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.log(`Failed to send error report to log channel: ${error}`);
  }
}

/**
 * Sends a log message to the designated log channel
 */
export async function sendLogMessage(client, title, message, color = Colors.Blue) {
  try {
    const logChannelId = configManager.get('LOG_CHANNEL_ID');
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        const filteredMessage = filterIPAddresses(message);
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(filteredMessage)
          .setColor(color)
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.log(`Failed to send log message: ${error}`);
  }
}

/**
 * Sends a command usage log to the designated log channel when enabled
 */
export async function sendCommandLog(client, commandName, user, additionalInfo = null) {
  if (!configManager.get('COMMAND_LOGGING_ENABLED')) return;
  
  try {
    const logChannelId = configManager.get('LOG_CHANNEL_ID');
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle("⚡ Comando Usado")
          .setColor(Colors.Blue)
          .setTimestamp()
          .addFields(
            { name: "👤 Usuario", value: `${user} (${user.username})\nID: \`${user.id}\``, inline: true },
            { name: "🔧 Comando", value: `\`/${commandName}\``, inline: true }
          );
        
        if (additionalInfo) {
          embed.addFields({ name: "📝 Información Adicional", value: additionalInfo, inline: false });
        }
        
        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.log(`Failed to send command log: ${error}`);
  }
}

/**
 * Fetches recent commits from the GitHub repo (for !updgit)
 */
export async function getRecentCommits() {
  try {
    const res = await fetch("https://api.github.com/repos/TheGaspyGames/Discorbitsonic/commits");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.slice(0, 2); // Solo los 2 commits más recientes
  } catch (error) {
    console.error("Error al obtener los commits:", error);
    return [];
  }
}

/**
 * Obtiene métricas del servidor
 */
async function getServerMetrics(guild) {
  const totalUsers = guild.memberCount;
  const totalRoles = guild.roles.cache.size;
  const totalChannels = guild.channels.cache.size;

  const pm2Metrics = await new Promise((resolve, reject) => {
    // 1. INICIAR LA CONEXIÓN con el demonio de PM2
    pm2.connect(function(err) {
      if (err) {
        console.error("Error al conectar con PM2:", err);
        return reject(err);
      }

      // 2. OBTENER LA LISTA DE PROCESOS
      pm2.list((err, list) => {
        // 3. DESCONECTARSE (liberar el recurso)
        pm2.disconnect();

        if (err) {
          console.error("Error al listar procesos de PM2:", err);
          return reject(err);
        }

        const metrics = list.map(proc => ({ 
          name: proc.name, 
          status: proc.pm2_env.status,
          // Puedes añadir más métricas como memoria o cpu:
          // cpu: proc.monit.cpu,
          // memory: proc.monit.memory 
        }));
        
        resolve(metrics);
      });
    });
  });

  return {
    totalUsers,
    totalRoles,
    totalChannels,
  };
}

/**
 * Envía métricas del servidor al canal de logs
 */
export async function sendServerMetrics(client, guild) {
  try {
    const metrics = await getServerMetrics(guild);

    const embed = new EmbedBuilder()
      .setTitle("📊 Métricas del Servidor")
      .setColor(Colors.Blue)
      .addFields(
        { name: "Usuarios Totales", value: `${metrics.totalUsers}`, inline: true },
        { name: "Roles Totales", value: `${metrics.totalRoles}`, inline: true },
        { name: "Canales Totales", value: `${metrics.totalChannels}`, inline: true }
      )
      .setTimestamp();

    const logChannelId = configManager.get('LOG_CHANNEL_ID');
    if (logChannelId) {
      const logChannel = client.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error("❌ Error al enviar métricas del servidor:", error);
  }
}

/**
 * Configura métricas personalizadas para PM2
 */
export function setupServerMetrics(client) {
  const metrics = pmx.probe();

  // Métrica: Usuarios totales
  const totalUsersMetric = metrics.metric({
    name: "Usuarios totales",
    value: () => client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
  });

  // Métrica: Roles totales
  const totalRolesMetric = metrics.metric({
    name: "Roles totales",
    value: () => client.guilds.cache.reduce((acc, guild) => acc + guild.roles.cache.size, 0)
  });

  // Métrica: Staffs con rol específico
  const staffRoleId = "1177722501275594842";
  const totalStaffMetric = metrics.metric({
    name: "Staffs (Rol específico)",
    value: () => client.guilds.cache.reduce((acc, guild) => {
      const members = guild.members.cache.filter(member => member.roles.cache.has(staffRoleId));
      return acc + members.size;
    }, 0)
  });

  // Métrica: Canales totales
  const totalChannelsMetric = metrics.metric({
    name: "Canales totales",
    value: () => client.guilds.cache.reduce((acc, guild) => acc + guild.channels.cache.size, 0)
  });

  console.log("✅ Métricas personalizadas para PM2 configuradas.");
}

export { getServerMetrics };
