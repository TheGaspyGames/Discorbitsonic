import { Client, GatewayIntentBits } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config'; // carga variables de entorno desde .env

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Registrar slash commands automáticamente ===
import { deployCommands } from "./deploy-commands.js";
await deployCommands(); // registra todos los comandos antes de loguear el bot

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

// ================================
// Cargar comandos
// ================================
client.commands = new Map();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  try {
    const filePath = path.join(commandsPath, file);
    let commandModule;

    if (file.endsWith(".js")) {
      // Intentar importar como ESM
      try {
        commandModule = await import(`file://${filePath}`);
        commandModule = commandModule.default ?? commandModule;
      } catch (esmError) {
        // Si falla, intentar CommonJS
        commandModule = require(filePath);
      }
    }

    if (!commandModule?.data || !commandModule?.execute) {
      console.warn(`⚠️ Comando ignorado (mal exportado): ${file}`);
      continue;
    }

    client.commands.set(commandModule.data.name, commandModule);
    console.log(`✅ Comando cargado: ${commandModule.data.name}`);

  } catch (error) {
    console.error(`❌ Error cargando comando ${file}: ${error}`);
  }
}

// ================================
// Registrar eventos
// ================================
import { registerEvents } from "./handlers/events.js";
registerEvents(client);

// ================================
// Monitor de caída de internet
// ================================
import https from "https";
const CHANNEL_ID = process.env.CHANNEL_ID; // ID de canal para alertas
let isOffline = false;
let offlineStart = null;

function checkInternet() {
  return new Promise((resolve) => {
    https
      .get("https://www.google.com", (res) => {
        resolve(res.statusCode === 200);
      })
      .on("error", () => resolve(false));
  });
}

// Intervalo de chequeo cada 10 segundos
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
}, 10 * 1000);

// ================================
// Login del bot
// ================================
client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log(`Bot iniciado con éxito como ${client.user?.tag ?? "Desconocido"}`);
});
