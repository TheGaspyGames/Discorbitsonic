// index.js
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import dotenv from "dotenv";
import { setupServerLogs } from "./utils/logsystem.js";
import { monitorYouTubeLive } from "./youtube/youtubeLive.js";

// Cargar .env
dotenv.config();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar config.json
const configPath = path.join("/data/data/com.termux/files/home/discorbitsonic", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Crear cliente con intents y partials necesarios
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
    Partials.GuildMember
  ]
});

client.commands = new Collection();

// ================================
// ⚡ Cargar comandos slash
// ================================
const commands = [];
const commandFolders = ["commands/public", "commands/admin"];

for (const folder of commandFolders) {
  const folderPath = path.join(__dirname, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

  // Agregar mensajes de depuración para verificar rutas y módulos
  for (const file of commandFiles) {
    try {
      const commandPath = path.resolve(folderPath, file); // Usar path.resolve para rutas absolutas
      console.log(`🔍 Cargando comando desde: ${commandPath}`); // Depuración
      const command = (await import(commandPath)).default;

      if (command?.data?.name && command?.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`✅ Comando cargado: ${command.data.name}`); // Depuración
      } else {
        console.warn(`⚠️ El comando en ${file} no tiene las propiedades necesarias (data y execute).`);
      }
    } catch (error) {
      console.error(`❌ Error al cargar el comando ${file}:`, error);
    }
  }
}

// ================================
// ⚡ Registrar comandos en Discord
// ================================
client.once("ready", async () => {
  try {
    const guild = client.guilds.cache.get(config.TARGET_GUILD_ID);
    if (!guild) {
      console.error("❌ Servidor objetivo no encontrado. Verifica TARGET_GUILD_ID en config.json.");
      return;
    }

    await guild.commands.set(commands);
    console.log(`✅ ${commands.length} comandos sincronizados correctamente en el servidor objetivo.`);
  } catch (error) {
    console.error("❌ Error al sincronizar comandos en el servidor objetivo:", error);
  }
});

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
// ⚡ Logs premium (webhook desde .env)
// ================================
setupServerLogs(client);

// ================================
// Login con token del .env
// ================================
client.login(process.env.DISCORD_TOKEN);

setInterval(() => monitorYouTubeLive(client), 30_000);
