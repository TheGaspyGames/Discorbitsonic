import fs from "fs";
import path from "path";
import { isAuthorized } from "../utils/utilities.js";

export async function setPremiumLogsCommand(message) {
  if (!isAuthorized(message)) {
    return message.reply("❌ No estás autorizado para activar los logs premium.");
  }

  const configPath = path.join(process.cwd(), "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  config.PREMIUM_LOGS_ENABLED = true;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  message.reply(`✅ Logs premium activados correctamente en el canal <#${config.PREMIUM_ID}>.`);
}
