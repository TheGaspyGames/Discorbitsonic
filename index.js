import { Client, GatewayIntentBits, Colors } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';
import https from "https";
import { configManager } from "./utils/configManager.js";
import { sendCommandLog, sendErrorReport, sendLogMessage } from "./utils/utilities.js";
import { exec } from "child_process";

// Obtener el directorio actual en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear cliente de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// ===== CARGA DE COMANDOS SLASH =====
client.commands = new Map();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.existsSync(commandsPath) ? fs.readdirSync(commandsPath).filter(f => f.endsWith(".js")) : [];

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    const commandModule = (await import(`file://${filePath}`)).default;
    if (!commandModule?.data || !commandModule?.execute) {
      console.warn(`⚠️ Comando ignorado (falta data o execute): ${file}`);
      continue;
    }
    client.commands.set(commandModule.data.name, commandModule);
    console.log(`✅ Comando cargado: ${commandModule.data.name}`);
  } catch (err) {
    console.error(`❌ Error cargando comando ${file}:`, err);
  }
}

// ===== FUNCIONES DE LOG DEL BOT =====
async function logBotOnline() {
  console.log(`✅ Bot online como ${client.user.tag}`);
  const logChannelId = configManager.get("BOT_LOG_CHANNEL_ID");
  if (!logChannelId) return;
  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;
  await channel.send(`✅ Bot online como **${client.user.tag}**`);
}

async function logBotError(error) {
  console.error("❌ Error del bot:", error);
  const logChannelId = configManager.get("BOT_LOG_CHANNEL_ID");
  if (!logChannelId) return;
  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;
  await channel.send(`❌ Error del bot: \`\`\`${error}\`\`\``);
}

async function logDM(message) {
  const logChannelId = configManager.get("BOT_LOG_CHANNEL_ID");
  if (!logChannelId) return;
  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;
  await channel.send(`💌 DM recibido de **${message.author.tag}**:\n${message.content}`);
}

async function logCommandExecution(user, commandName, message) {
  const logChannelId = configManager.get("BOT_LOG_CHANNEL_ID");
  if (!logChannelId) return;
  const channel = await client.channels.fetch(logChannelId).catch(() => null);
  if (!channel) return;
  await channel.send(`⚡ Comando ejecutado: **${commandName}** por **${user.tag}** en ${message.channel.name}`);
}

// ===== COMANDOS POR PREFIJO (!) =====
const PREFIX = "!";
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Log de DM
  if (message.channel.type === 1) return logDM(message);

  // Comandos por prefijo
  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (!configManager.isAuthorized(message.author.id)) return;

  switch (command) {
    case "setuplogs":
      {
        const logChannel = message.mentions.channels.first();
        if (!logChannel) return message.reply("❌ Debes mencionar un canal para logs.");
        await configManager.set("SERVER_LOG_CHANNEL_ID", logChannel.id);
        await logCommandExecution(message.author, "setuplogs", message);
        message.reply(`✅ Logs configurados en ${logChannel}`);
      }
      break;

    case "restart":
      {
        await logCommandExecution(message.author, "restart", message);
        message.reply("♻️ Reiniciando bot...");
        exec("pm2 restart bitsonic");
      }
      break;
  }
});

// ===== MONITOR DE INTERNET =====
const CHANNEL_ID = process.env.CHANNEL_ID;
let isOffline = false;
let offlineStart = null;

function checkInternet() {
  return new Promise((resolve) => {
    https.get("https://www.google.com", res => resolve(res.statusCode === 200))
      .on("error", () => resolve(false));
  });
}

setInterval(async () => {
  const online = await checkInternet();

  if (!online && !isOffline) {
    isOffline = true;
    offlineStart = new Date();
    console.log("🚨 Internet caído:", offlineStart.toLocaleString("es-CL", { timeZone: "America/Santiago" }));
  }

  if (online && isOffline) {
    const offlineEnd = new Date();
    const durationMs = offlineEnd - offlineStart;
    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    const startTime = offlineStart.toLocaleString("es-CL", { timeZone: "America/Santiago" });
    const message = `✅ El Internet volvió!\n⏱ Tiempo caído: ${hours}h ${minutes}m ${seconds}s\n🕒 Hora de inicio de caída: ${startTime} (GMT-3)`;

    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (channel) channel.send(message);
    } catch (err) {
      console.error("❌ Error al enviar mensaje de alerta:", err);
    }

    isOffline = false;
    offlineStart = null;
  }
}, 10000);

// ===== INTERACTIONS / SLASH COMMANDS =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await interaction.deferReply({ ephemeral: true });
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
});

// ===== LOGIN Y SINCRONIZACIÓN DE SLASH COMMANDS =====
client.once("ready", async () => {
  await logBotOnline();

  try {
    const guildId = process.env.GUILD_ID;
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(Array.from(client.commands.values()).map(c => c.data.toJSON()));
    console.log(`✅ Comandos sincronizados en el servidor ${guild.name}`);
  } catch (err) {
    console.error("❌ Error sincronizando comandos:", err);
    await logBotError(err);
  }
});

// ===== ERRORES GLOBALES =====
process.on("unhandledRejection", async (error) => {
  console.error("❌ Unhandled Rejection:", error);
  await logBotError(error);
});

process.on("uncaughtException", async (error) => {
  console.error("❌ Uncaught Exception:", error);
  await logBotError(error);
});

client.login(process.env.DISCORD_TOKEN);
