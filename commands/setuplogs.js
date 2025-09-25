import { configManager } from "../utils/configManager.js";
import { sendSetupLog } from "../utils/utilities.js";

export default {
  name: "setuplogs",
  description: "Configura el canal de logs del servidor.",
  prefix: "!",

  async execute(message, args, client) {
    if (!configManager.isAuthorized(message.author.id)) {
      return message.reply("❌ No estás autorizado para usar este comando.");
    }

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ Debes mencionar un canal válido para los logs.");

    configManager.set("SERVER_LOG_CHANNEL_ID", channel.id);

    await sendSetupLog(client, "✅ Logs configurados", `Canal de logs configurado: ${channel.name}`, channel.id);

    message.reply(`✅ Logs del servidor configurados en ${channel}`);
  }
};
