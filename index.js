import { Client, GatewayIntentBits, Colors } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';
import https from "https";
import { configManager } from "./utils/configManager.js";
import { sendCommandLog, sendLogMessage } from "./utils/utilities.js";

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// -----------------------------
// Cargar comandos de slash
// -----------------------------
client.commands = new Map();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    let commandModule = (await import(`file://${filePath}`)).default;
    if (!commandModule?.data || !commandModule?.execute) continue;
    client.commands.set(commandModule.data.name, commandModule);
    console.log(`✅ Comando cargado: ${commandModule.data.name}`);
  } catch (err) {
    console.error(`❌ Error cargando comando ${file}: ${err}`);
  }
}

// -----------------------------
// Eventos de prefijo (!)
// -----------------------------
const PREFIX = "!";

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Solo usuarios autorizados
  if (!configManager.isAuthorized(message.author.id)) return;

  switch (command) {
    case "setuplogs":
      {
        const logChannel = message.mentions.channels.first();
        if (!logChannel) return message.reply("❌ Debes mencionar un canal para logs.");
        await configManager.set("SERVER_LOG_CHANNEL_ID", logChannel.id);
        await sendCommandLog(client, "setuplogs", message.author, message, `Canal: ${logChannel.name}`);
        message.reply(`✅ Logs configurados en ${logChannel}`);
        console.log(`[LOGS] Logs activados en ${message.guild.name}, canal: ${logChannel.name}`);
      }
      break;

    case "restart":
      {
        await sendCommandLog(client, "restart", message.author, message, "Reiniciando bot");
        message.reply("♻️ Reiniciando bot...");
        console.log(`[BOT] Reiniciando por comando de ${message.author.tag}`);
        process.exit(0); // PM2 o Termux reiniciará automáticamente
      }
      break;
  }
});

// -----------------------------
// Monitor de caída de internet
// -----------------------------
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

// -----------------------------
// Login y sincronización de comandos
// -----------------------------
client.once("ready", async () => {
  console.log(`Bot iniciado como ${client.user.tag}`);

  // Sincronizar comandos por guild para pruebas rápidas
  try {
    const guildId = process.env.GUILD_ID; // Pon tu guild de pruebas en .env
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(Array.from(client.commands.values()).map(c => c.data.toJSON()));
    console.log(`✅ Comandos sincronizados en el servidor ${guild.name}`);
  } catch (err) {
    console.error("❌ Error sincronizando comandos:", err);
  }
});

client.login(process.env.DISCORD_TOKEN);
