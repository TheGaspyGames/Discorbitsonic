import { SlashCommandBuilder } from "discord.js";
import { exec } from "child_process";

const data = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Actualiza el bot desde GitHub y reinicia (solo propietario)");

async function execute(interaction) {
  const OWNER_ID = "684395420004253729"; // tu ID real
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Solo el propietario puede usar este comando.", ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const repoPath = "/data/data/com.termux/files/home/storage/downloads/Discorbitsonic"; // ruta de tu repo
  const processName = "bitsonic"; // nombre de pm2

  // Primero hacemos un fetch y check si hay cambios
  exec(`cd "${repoPath}" && git fetch`, (fetchErr) => {
    if (fetchErr) {
      return interaction.editReply(`⚠️ Error al actualizar: \n\`\`\`${fetchErr.message}\`\`\``);
    }

    // Comprobamos si hay diferencias
    exec(`cd "${repoPath}" && git status -uno`, (statusErr, stdout) => {
      if (statusErr) {
        return interaction.editReply(`⚠️ Error al comprobar actualizaciones:\n\`\`\`${statusErr.message}\`\`\``);
      }

      if (stdout.includes("up to date") || stdout.includes("nada que actualizar")) {
        return interaction.editReply("✅ Ya estás en la actualización más reciente.");
      }

      // Hay nueva actualización
      interaction.editReply({ content: "⬇️ Descargando última actualización...", ephemeral: true });

      // Hacemos pull
      exec(`cd "${repoPath}" && git reset --hard && git pull https://github.com/TheGaspyGames/Discorbitsonic.git`, (pullErr, pullStdout, pullStderr) => {
        if (pullErr) {
          return interaction.editReply(`⚠️ Error al hacer git pull:\n\`\`\`${pullErr.message}\`\`\``);
        }

        // Reinicio
        interaction.editReply({ content: "🔄 Reiniciando bot...", ephemeral: true });

        exec(`pm2 restart ${processName}`, (pm2Err, pm2Stdout, pm2Stderr) => {
          if (pm2Err) {
            return interaction.followUp({ content: `⚠️ Error al reiniciar pm2:\n\`\`\`${pm2Err.message}\`\`\``, ephemeral: true });
          }

          interaction.followUp({ content: "✅ Bot actualizado y reiniciado correctamente.", ephemeral: true });
        });
      });
    });
  });
}

export { data, execute };
