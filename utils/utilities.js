import { EmbedBuilder, Colors, ActivityType } from "discord.js";
import { configManager } from "./configManager.js";

/** ----------------- UTILITIES ----------------- **/

export function calculateSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;

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

export function splitMessage(text, maxLength = 2000) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > maxLength) {
    let splitPoint = remaining.lastIndexOf('\n', maxLength);
    if (splitPoint === -1) splitPoint = maxLength;
    chunks.push(remaining.substring(0, splitPoint));
    remaining = remaining.substring(splitPoint).trimStart();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

export function filterIPAddresses(text) {
  const ipv4Pattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  return text.replace(ipv4Pattern, '[IP_FILTERED]');
}

export function isAuthorized(userId) {
  return configManager.isAuthorized(userId);
}

/** ----------------- LOGGING ----------------- **/

export async function sendLogMessage(client, title, description, color = Colors.Blue, channelId = null) {
  try {
    const logChannelId = channelId ?? configManager.get('LOG_CHANNEL_ID');
    if (!logChannelId) return;
    const channel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(filterIPAddresses(description))
      .setColor(color)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.log(`❌ Failed to send log message: ${err}`);
  }
}

export async function sendCommandLog(client, commandName, user, interaction = null, additionalInfo = null) {
  if (!configManager.get('COMMAND_LOGGING_ENABLED')) return;

  try {
    const logChannelId = configManager.get('LOG_CHANNEL_ID');
    if (!logChannelId) return;
    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("⚡ Comando Usado")
      .setColor(Colors.Green)
      .setTimestamp()
      .addFields(
        { name: "👤 Usuario", value: `${user.tag} (\`${user.id}\`)`, inline: true },
        { name: "🔧 Comando", value: `\`/${commandName}\``, inline: true },
        { name: "💬 Contenido del mensaje", value: filterIPAddresses(interaction?.content ?? "[Slash command]").slice(0, 1024), inline: false },
        { name: "📌 Canal", value: interaction?.channel?.name ?? "Desconocido", inline: true }
      );

    if (additionalInfo) embed.addFields({ name: "📝 Información Adicional", value: additionalInfo, inline: false });
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.log(`❌ Failed to send command log: ${error}`);
  }
}

/** ----------------- RESTO DE TU CÓDIGO (error, setup, activity) ----------------- **/
// Aquí mantienes tus sendErrorReport, sendSetupLog, cloneUserActivity, etc. como los tenías


// Nuevo logging de setup / info / eventos
export async function sendSetupLog(client, title, message, color = Colors.Blue, channelId = null) {
  try {
    const logChannelId = channelId ?? configManager.get('SETUP_LOG_CHANNEL_ID');
    if (!logChannelId) return;
    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(filterIPAddresses(message))
      .setTimestamp()
      .addFields({ name: "📌 Canal", value: logChannel.name ?? "Desconocido", inline: true });

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.log(`❌ Failed to send setup log: ${error}`);
  }
}

/** ----------------- ACTIVITY ----------------- **/

export async function cloneUserActivity(client, guild, ownerId) {
  try {
    const owner = await guild.members.fetch(ownerId).catch(() => null);
    if (!owner) return;
    const activity = owner.presence?.activities?.[0];
    if (!activity) return;

    const activityOptions = {
      [ActivityType.Playing]: { name: activity.name, type: ActivityType.Playing },
      [ActivityType.Listening]: { name: activity.details ?? activity.name, type: ActivityType.Listening },
      [ActivityType.Streaming]: { name: activity.name, type: ActivityType.Streaming, url: activity.url },
      [ActivityType.Watching]: { name: activity.name, type: ActivityType.Watching },
    }[activity.type] ?? { name: activity.name, type: ActivityType.Playing };

    await client.user.setActivity(activityOptions);
  } catch (error) {
    console.log(`❌ Failed to clone user activity: ${error}`);
    await sendErrorReport(client, `Error clonando actividad: ${error}`);
  }
}

export async function setLiveActivity(client, defaultActivity = "geometry dash") {
  try {
    await client.user.setActivity(defaultActivity, { type: ActivityType.Playing });
    console.log(`Activity set: playing ${defaultActivity}`);
  } catch (error) {
    console.log(`❌ Error updating activity: ${error}`);
    await sendErrorReport(client, `Error updating live activity: ${error}`);
  }
}

export function autoCloneActivity(client, guild, ownerId, defaultActivity = "geometry dash") {
  setInterval(async () => {
    const owner = await guild.members.fetch(ownerId).catch(() => null);
    if (owner?.presence?.activities?.[0]) {
      await cloneUserActivity(client, guild, ownerId);
    } else {
      await setLiveActivity(client, defaultActivity);
    }
  }, 5000);
}
