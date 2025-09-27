// index.js
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import dotenv from "dotenv";
import { setupServerLogs } from "./utils/logsystem.js";

// Cargar .env
dotenv.config();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar config.json (solo para otras cosas, no para logs premium)
const configPath = path.join(process.cwd(), "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Crear cliente con intents y partials necesarios para logs premium
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember // ← añadido para kicks/bans/unbans
  ]
});

client.commands = new Collection();

// ================================
// ⚡ Cargar comandos slash
// ================================
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const commandModule = await import(`./commands/${file}`);
  const command = commandModule.default ?? commandModule;
  if (command.data?.name) client.commands.set(command.data.name, command);
}

// ================================
// ⚡ Cargar eventos
// ================================
import { registerEvents } from "./handlers/events.js";
registerEvents(client);

// ================================
// 🚨 Monitor de caída de internet
// ================================
const CHANNEL_ID = config.LOG_CHANNEL_ID;
let isOffline = false;
let offlineStart = null;

function checkInternet() {
  return new Promise((resolve) => {
    https
      .get("https://www.google.com", (res) => resolve(res.statusCode === 200))
      .on("error", () => resolve(false));
  });
}

setInterval(async () => {
  const online = await checkInternet();

  if (!online && !isOffline) {
    isOffline = true;
    offlineStart = new Date();
    console.log(
      "🚨 Internet caído:",
      offlineStart.toLocaleString("es-CL", { timeZone: "America/Santiago" })
    );
  }

  if (online && isOffline) {
    const offlineEnd = new Date();
    const durationMs = offlineEnd - offlineStart;

    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    const startTime = offlineStart.toLocaleString("es-CL", { timeZone: "America/Santiago" });

    const message = `✅ Internet volvió!\n⏱ Tiempo caído: ${hours}h ${minutes}m ${seconds}s\n🕒 Hora de inicio de caída: ${startTime} (GMT-3)`;

    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (channel) await channel.send(message);
    } catch (err) {
      console.error("❌ Error al enviar mensaje de alerta:", err);
    }

    isOffline = false;
    offlineStart = null;
  }
}, 10 * 1000);

// ================================
// ⚡ Comandos de prefijo
// ================================
const prefix = "!";
const updGitEmbeds = new Map();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "updgit") {
    const { updGitCommand } = await import("./commands/updgit.js");
    await updGitCommand(message, args, updGitEmbeds);
  }

  if (command === "setpremiumlogs") {
    const { setPremiumLogsCommand } = await import("./commands/setpremiumlogs.js");
    await setPremiumLogsCommand(message);
  }
});

// ================================
// ⚡ Logs premium (webhook desde .env)
// ================================
setupServerLogs(client);

// ================================
// Login con token del .env
// ================================
client.login(process.env.DISCORD_TOKEN);
