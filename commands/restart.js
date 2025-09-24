import { SlashCommandBuilder, EmbedBuilder, Colors } from "discord.js";
import { sendCommandLog } from "../utilities.js";

const OWNER_ID = "684395420004253729"; // Solo esta ID puede usar el comando

export default {
  data: new SlashCommandBuilder()
    .setName("restart")
    .setDescription("Reinicia el bot (solo el propietario puede usarlo)."),

  async execute(interaction) {
    // Comprobación de permisos
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({ content: "❌ No tienes permiso para ejecutar este comando.", ephemeral: true });
    }

    // Log del comando
    await sendCommandLog(interaction.client, "restart", interaction.user);

    // Mensaje antes de reiniciar
    const embed = new EmbedBuilder()
      .setTitle("🔄 Reiniciando Bot")
      .setDescription("El bot se está reiniciando...")
      .setColor(Colors.Yellow)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Reinicio
    console.log("💥 Reiniciando bot por solicitud del propietario...");
    process.exit(0); // PM2 lo volverá a iniciar automáticamente
  }
};
