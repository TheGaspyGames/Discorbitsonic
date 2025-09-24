import { Client, GatewayIntentBits, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.json" with { type: "json" };
import https from "https"; // 👈 agregado para chequear internet

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

client.commands = new Collection();

// Cargar comandos
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const commandModule = await import(`./commands/${file}`);
  const command = commandModule.default ?? commandModule;
  client.commands.set(command.data.name, command);
}

// Cargar eventos
import { registerEvents } from "./handlers/events.js";
registerEvents(client);

// ================================
// 🚨 Monitor de caída de internet
// ================================
const CHANNEL_ID = "1417241762661138502";
let isOffline = false;
let offlineStart = null;

// Función para chequear internet
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
    // Internet caído
    isOffline = true;
    offlineStart = new Date();
    console.log("🚨 Internet caído:", offlineStart.toLocaleString("es-CL", { timeZone: "America/Santiago" }));
  }

  if (online && isOffline) {
    // Internet volvió
    const offlineEnd = new Date();
    const durationMs = offlineEnd - offlineStart;

    const seconds = Math.floor((durationMs / 1000) % 60);
    const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    const startTime = offlineStart.toLocaleString("es-CL", { timeZone: "America/Santiago" });

    const message = `✅ Internet volvió!\n⏱ Tiempo caído: ${hours}h ${minutes}m ${seconds}s\n🕒 Hora de inicio de caída: ${startTime} (GMT-3)`;

    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      channel.send(message);
    } catch (err) {
      console.error("❌ Error al enviar mensaje de alerta:", err);
    }

    // Resetear estado
    isOffline = false;
    offlineStart = null;
  }
}, 10 * 1000);

// ================================

// Login
client.login("MTIzNTAzMDI1MDY0MDExMzcxNQ.GeyzsC.h6ek2cBiHOp_yWlDfO85YvR6_aWorWsJn36YMg");

