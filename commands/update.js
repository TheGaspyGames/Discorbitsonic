import { SlashCommandBuilder } from "discord.js";
import { exec } from "child_process";

const data = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Actualiza el bot desde GitHub y reinicia (solo propietario)");

async function execute(interaction) {
  const OWNER_ID = "684395420004253729"; // tu ID real

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "❌ Solo el propietario puede usar este comando.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  // Ruta de Android emulated
  const repoPath = "/storage/emulated/0/Download/Discorbitsonic";

  // Comando completo
  const command = `
    cd "${repoPath}" || exit 1
    git reset --hard
    git pull https://github.com/TheGaspyGames/Discorbitsonic.git
    pm2 restart discorbots
  `;

  exec(command, { shell: "/bin/bash" }, (error, stdout, stderr) => {
    if (error) {
      return interaction.editReply(
        `⚠️ Error al actualizar:\n\`\`\`${error.message}\`\`\``
      );
    }

    interaction.editReply(
      `✅ Bot actualizado y reiniciado:\n\`\`\`${stdout}${stderr}\`\`\``
    );
  });
}

export { data, execute };
