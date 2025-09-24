import { SlashCommandBuilder } from 'discord.js';
import { exec } from 'child_process';
import fs from 'fs';

const repoDir = '/storage/emulated/0/Download/discorbitsonic-main/Bitsonic';
const gitRepo = 'https://github.com/TheGaspyGames/Discorbitsonic.git';
const pm2Name = 'bitsonic';
const ownerId = '684395420004253729';

export default {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Actualiza el bot desde Git y lo reinicia'),
  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ content: '❌ Solo el owner puede usar este comando.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // Si la carpeta NO existe, clonar el repo
    if (!fs.existsSync(repoDir)) {
      await interaction.followUp({ content: '📥 Carpeta no encontrada. Clonando repo…', ephemeral: true });
      exec(`git clone ${gitRepo} "${repoDir}"`, async (err, stdout, stderr) => {
        if (err) {
          return interaction.followUp({ content: `❌ Error al clonar repo:\n\`\`\`${stderr}\`\`\``, ephemeral: true });
        }
        await interaction.followUp({ content: '✅ Repo clonado. Instalando dependencias…', ephemeral: true });
        installAndRestart(interaction);
      });
    } else {
      // Si existe, hacer pull
      exec(`cd "${repoDir}" && git fetch && git pull`, async (err, stdout, stderr) => {
        if (err) {
          return interaction.editReply(`❌ Error al actualizar:\n\`\`\`${stderr}\`\`\``);
        }

        if (stdout.includes('Already up to date') || stdout.includes('Ya está actualizado')) {
          return interaction.editReply('✅ El bot ya está actualizado.');
        }

        await interaction.followUp({ content: '📦 Cambios encontrados. Instalando dependencias…', ephemeral: true });
        installAndRestart(interaction);
      });
    }
  },
};

// Función para instalar dependencias y reiniciar
function installAndRestart(interaction) {
  exec(`cd "${repoDir}" && npm install`, async (err2, stdout2, stderr2) => {
    if (err2) {
      return interaction.followUp({ content: `❌ Error al instalar dependencias:\n\`\`\`${stderr2}\`\`\``, ephemeral: true });
    }

    await interaction.followUp({ content: '✅ Dependencias instaladas. Reiniciando bot…', ephemeral: true });

    exec(`pm2 restart ${pm2Name}`, async (err3, stdout3, stderr3) => {
      if (err3) {
        return interaction.followUp({ content: `❌ Error al reiniciar con pm2:\n\`\`\`${stderr3}\`\`\``, ephemeral: true });
      }

      await interaction.followUp({ content: '♻️ Bot actualizado y reiniciado con éxito.', ephemeral: true });
    });
  });
}
