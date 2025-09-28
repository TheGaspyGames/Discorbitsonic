import { exec } from "child_process";
import fs from "fs";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import config from "../config.json" with { type: "json" };
import { getRecentCommits, isAuthorized } from "../utils/utilities.js";

const autoUpdateChannels = new Map();
const AUTO_UPDATE_FILE = "./autoUpdateChannel.json";
const GIT_PATH = "~/storage/downloads/discorbitsonic";
const PM2_PROCESS = "bitsonic";

// Cargar canal guardado
let savedChannelId = null;
try {
  if (fs.existsSync(AUTO_UPDATE_FILE)) {
    const data = JSON.parse(fs.readFileSync(AUTO_UPDATE_FILE, "utf8"));
    if (data && data.channelId) savedChannelId = data.channelId;
  }
} catch (e) {
  console.error("Error leyendo canal auto-update:", e);
}

export async function updGitCommand(message, args, updGitEmbeds) {
  // Verificar LOG_CHANNEL_ID
  if (config.LOG_CHANNEL_ID !== "1417241762661138502") {
    return message.reply("❌ Auto-updates solo se pueden activar si el LOG_CHANNEL_ID es el correcto.");
  }


  let channelId = message.channel.id;
  // Si ya hay un canal guardado, usarlo siempre
  if (savedChannelId) channelId = savedChannelId;

  if (autoUpdateChannels.has(channelId)) {
    return message.reply("✅ El modo auto-updates ya está activado en este canal.");
  }

  // Guardar canal para siempre
  try {
    fs.writeFileSync(AUTO_UPDATE_FILE, JSON.stringify({ channelId }), "utf8");
    savedChannelId = channelId;
  } catch (e) {
    console.error("No se pudo guardar el canal de auto-update:", e);
  }

  message.reply(`🚀 Modo auto-updates activado en <#${channelId}>! El bot ahora actualizará automáticamente los commits recientes.`);

  const autoUpdate = async () => {
    try {
      const commits = await getRecentCommits();
      if (!commits.length) return;

      const lastCommitSha = autoUpdateChannels.get(channelId)?.lastCommitSha;
      if (commits[0].sha === lastCommitSha) return;

      const embed = new EmbedBuilder()
        .setColor(0x00ff99)
        .setTitle("Actualizaciones recientes del repositorio")
        .setDescription("Aquí se muestran los commits más recientes de Discorbitsonic:")
        .addFields(commits.map(c => ({
          name: c.commit.author.date,
          value: c.commit.message
        })));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("yes_update").setLabel("Sí").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("no_update").setLabel("No").setStyle(ButtonStyle.Danger)
      );

      let sentMessage = updGitEmbeds.get(channelId);

      if (sentMessage) {
        await sentMessage.edit({ embeds: [embed], components: [row] });
      } else {
        sentMessage = await message.channel.send({ embeds: [embed], components: [row] });
        updGitEmbeds.set(channelId, sentMessage);
      }

      autoUpdateChannels.set(channelId, { message: sentMessage, lastCommitSha: commits[0].sha });

      const collector = sentMessage.createMessageComponentCollector({ time: 60000 });
      collector.on("collect", async i => {
        if (i.customId === "yes_update") {
          if (!isAuthorized(i)) {
            return i.reply({ content: "❌ No estás autorizado para aplicar la actualización.", ephemeral: true });
          }

          // Verificar si ya está en la última versión (SHA)
          const currentSha = autoUpdateChannels.get(channelId)?.lastCommitSha;
          let localSha = null;
          // Expansión robusta de ~ para rutas home (Termux, Unix, Windows)
          let path = GIT_PATH;
          if (path.startsWith("~")) {
            let home = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
            // Si es Termux y HOME no está definida, usar ruta por defecto
            if (!home && process.platform === "android") {
              home = "/data/data/com.termux/files/home";
            }
            path = home + path.slice(1);
          }
          // Normalizar separadores para Windows/Unix
          path = require("path").resolve(path);
          console.log("[updgit] Ruta final para git:", path);
          const fs = await import('fs');
          if (!fs.existsSync(path)) {
            return i.reply({ content: `❌ La carpeta del repositorio no existe: ${path}\nVerifica la ruta antes de actualizar.`, ephemeral: true });
          }
          try {
            // Obtener SHA local
            await new Promise((resolve, reject) => {
              exec(`cd "${path}" && git rev-parse HEAD`, (err, stdout, stderr) => {
                if (err) return reject(err);
                localSha = stdout.trim();
                resolve();
              });
            });
          } catch (e) {
            return i.reply({ content: `❌ No se pudo verificar la versión local: ${e.message}\nRuta usada: ${path}`, ephemeral: true });
          }
          if (localSha && currentSha && localSha === currentSha) {
            return i.reply({ content: `⚠️ Ya estás en la última versión (${localSha.slice(0,7)}), no se puede actualizar.`, ephemeral: true });
          }

          i.reply({ content: "⬇️ Descargando y aplicando actualización...", ephemeral: true });

          // Verificar de nuevo la existencia antes de ejecutar git reset/pull
          if (!fs.existsSync(path)) {
            sentMessage.edit({ content: `❌ No se puede actualizar porque la carpeta no existe: ${path}`, components: [] });
            return;
          }

          exec(`cd "${path}" && git reset --hard && git pull`, (err, stdout, stderr) => {
            if (err) {
              console.error("Error aplicando update:", err, stderr);
              sentMessage.edit({ content: `❌ Error aplicando la actualización!\n${stderr || err.message}\nRuta usada: ${path}`, components: [] });
              return;
            }
            console.log(stdout);
            sentMessage.edit({ content: "✅ Actualización aplicada correctamente! Reiniciando bot...", components: [] });
            // Reiniciar con pm2
            exec(`pm2 restart ${PM2_PROCESS}`, (err2, stdout2, stderr2) => {
              if (err2) {
                console.error("Error reiniciando pm2:", err2, stderr2);
                sentMessage.channel.send(`❌ Error reiniciando el bot con pm2: ${stderr2 || err2.message}`);
                return;
              }
              sentMessage.channel.send("♻️ Bot reiniciado correctamente con pm2!");
            });
          });
        }

        if (i.customId === "no_update") {
          i.reply({ content: "No se aplicará la actualización ❌", ephemeral: true });
        }
      });

    } catch (err) {
      console.error("Error en auto-update de commits:", err);
    }
  };

  await autoUpdate();
  const interval = setInterval(autoUpdate, 30 * 1000);
  autoUpdateChannels.set(channelId, { ...autoUpdateChannels.get(channelId), interval });
}
