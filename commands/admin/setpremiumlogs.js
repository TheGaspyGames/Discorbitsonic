// commands/setpremiumlogs.js
import fs from "fs";
import path from "path";
import { isAuthorized } from "../utils/utilities.js";

export async function setPremiumLogsCommand(message) {
  // Comprobar que se ejecuta en servidor
  if (!message.guild) {
    return message.reply("❌ Este comando solo puede usarse dentro de un servidor.");
  }

  // Pasar el id del autor a isAuthorized
  if (!isAuthorized({ user: { id: message.author.id } })) {
    return message.reply("❌ No estás autorizado para activar los logs premium.");
  }

  const configPath = path.join(process.cwd(), "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // Actualiza la variable PREMIUM_ID con el canal actual
  config.PREMIUM_ID = message.channel.id;
  config.PREMIUM_LOGS_ENABLED = true;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

  message.reply(`✅ Logs premium activados correctamente en el canal <#${message.channel.id}>.`);
}
