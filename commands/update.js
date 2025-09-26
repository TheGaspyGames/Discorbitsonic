import { SlashCommandBuilder } from "discord.js";
import { exec } from "child_process";

const data = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Actualiza el bot desde GitHub y reinicia (solo propietario)");

async function execute(interaction) {
  const OWNER_ID = "684395420004253729"; // tu ID

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "❌ Solo el propietario puede usar este comando.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  // Ajusta esta ruta a la carpeta donde está clonado tu repo en Termux
  const repoPath = "/data/data/com.termux/files/home/Discorbitsonic";

  // Ejecuta git pull + reinicio pm2
  exec(
    `cd ${repoPath} && git reset --hard && git pull https://github.com/TheGaspyGames/Discorbitsonic.git && pm2 restart discorbots`,
    (error, stdout, stderr) => {
      if (error) {
        return interaction.editReply(
          `⚠️ Error al actualizar:\n\`\`\`${error.message}\`\`\``
        );
      }
      if (stderr) {
        // Git a veces manda avisos a stderr, no necesariamente error
        interaction.editReply(
          `✅ Actualizado con avisos:\n\`\`\`${stdout}\n${stderr}\`\`\``
        );
      } else {
        interaction.editReply(`✅ Bot actualizado y reiniciado:\n\`\`\`${stdout}\`\`\``);
      }
    }
  );
}

export { data, execute };
