import { SlashCommandBuilder } from "discord.js";
import { configManager } from "../../utils/configManager.js";

let maintenanceMode = false;
let severeMaintenanceMode = false;

const data = new SlashCommandBuilder()
  .setName("mantenimiento")
  .setDescription("Activa o desactiva el modo de mantenimiento del bot.")
  .addBooleanOption(option =>
    option.setName("grave")
      .setDescription("Activar mantenimiento grave.")
      .setRequired(false)
  );

async function execute(interaction) {
  const authorizedId = configManager.get("AUTHORIZED_USER_IDS")[0];

  if (interaction.user.id !== authorizedId) {
    return interaction.reply({ content: "❌ No tienes permisos para usar este comando.", ephemeral: true });
  }

  const grave = interaction.options.getBoolean("grave") || false;

  if (grave) {
    severeMaintenanceMode = !severeMaintenanceMode;
    maintenanceMode = severeMaintenanceMode; // Grave implica modo normal también

    if (severeMaintenanceMode) {
      interaction.client.user.setActivity("Mantenimiento grave", { type: "PLAYING" });
      return interaction.reply("⚠️ Mantenimiento grave activado. Todas las funciones y comandos están desactivados.");
    } else {
      interaction.client.user.setActivity(null);
      return interaction.reply("✅ Mantenimiento grave desactivado. El bot vuelve a la normalidad.");
    }
  } else {
    maintenanceMode = !maintenanceMode;

    if (maintenanceMode) {
      interaction.client.user.setActivity("Bot en Mantenimiento", { type: "PLAYING" });
      return interaction.reply("⚠️ Mantenimiento activado. Solo los usuarios autorizados pueden usar comandos.");
    } else {
      interaction.client.user.setActivity(null);
      return interaction.reply("✅ Mantenimiento desactivado. El bot vuelve a la normalidad.");
    }
  }
}

export default {
  data,
  execute
};