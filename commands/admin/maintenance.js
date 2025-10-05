import { configManager } from "../utils/configManager.js";
import { ActivityType } from "discord.js";

let maintenanceMode = false;
let severeMaintenanceMode = false;

export async function maintenanceCommand(message, args) {
  const authorizedId = configManager.get("AUTHORIZED_USER_IDS")[0];

  if (message.author.id !== authorizedId) {
    return message.reply("❌ No tienes permisos para usar este comando.");
  }

  if (args[0] === "grave") {
    severeMaintenanceMode = !severeMaintenanceMode;
    maintenanceMode = severeMaintenanceMode; // Grave implica modo normal también

    if (severeMaintenanceMode) {
      message.client.user.setActivity("Mantenimiento grave", {
        type: ActivityType.Playing,
        name: "El bot se encuentra en mantenimiento grave"
      });
      return message.reply("⚠️ Mantenimiento grave activado. Todas las funciones y comandos están desactivados.");
    } else {
      message.client.user.setActivity(null);
      return message.reply("✅ Mantenimiento grave desactivado. El bot vuelve a la normalidad.");
    }
  } else {
    maintenanceMode = !maintenanceMode;

    if (maintenanceMode) {
      message.client.user.setActivity("Bot en Mantenimiento", {
        type: ActivityType.Playing,
        name: "El bot se encuentra en mantenimiento"
      });
      return message.reply("⚠️ Mantenimiento activado. Solo los usuarios autorizados pueden usar comandos.");
    } else {
      message.client.user.setActivity(null);
      return message.reply("✅ Mantenimiento desactivado. El bot vuelve a la normalidad.");
    }
  }
}

export function isCommandAllowed(userId) {
  const authorizedId = configManager.get("AUTHORIZED_USER_IDS")[0];

  if (severeMaintenanceMode) {
    return userId === authorizedId; // Solo el autorizado puede usar comandos
  }

  if (maintenanceMode) {
    return userId === authorizedId; // Solo el autorizado puede usar comandos
  }

  return true; // Si no hay mantenimiento, todos pueden usar comandos
}