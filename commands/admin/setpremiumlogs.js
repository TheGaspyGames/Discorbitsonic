// commands/setpremiumlogs.js
import fs from "fs";
import path from "path";
import { isAuthorized } from "../../utils/utilities.js";
import { SlashCommandBuilder } from "discord.js";
import { configManager } from "../../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("setpremiumlogs")
  .setDescription("Activa o actualiza los logs premium en el servidor.");

async function execute(interaction) {
  // Comprobar que se ejecuta en servidor
  if (!interaction.guild) {
    return interaction.reply("❌ Este comando solo puede usarse dentro de un servidor.");
  }

  // Pasar el id del autor a isAuthorized
  if (!isAuthorized({ user: { id: interaction.user.id } })) {
    return interaction.reply({ content: "❌ No estás autorizado para activar los logs premium.", ephemeral: true });
  }

  const configPath = "./config.json";
  const config = configManager.get("PREMIUM_LOGS_ENABLED");

  await configManager.setMultiple({
    PREMIUM_ID: interaction.channel.id,
    PREMIUM_LOGS_ENABLED: true
  });

  await interaction.reply(`✅ Logs premium activados correctamente en el canal <#${interaction.channel.id}>.`);
}

export default {
  data,
  execute
};
