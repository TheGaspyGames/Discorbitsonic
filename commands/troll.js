import { ContextMenuCommandBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";

const OWNER_ID = "684395420004253729";

const data = new SlashCommandBuilder()
  .setName("troll")
  .setDescription("envia un gif troll divertido en el canal.");

async function execute(interaction) {
  // Solo el owner puede usar el troll real
  if (interaction.user.id !== OWNER_ID) {
    await sendCommandLog(interaction.client, "troll", interaction.user);
    await interaction.reply({
      content: "https://media.tenor.com/cmKzEULWN3QAAAAM/trollface.gif",
      ephemeral: true
    });
    return;
  }

  // Obtener usuario objetivo
  const target = interaction.targetUser;
  if (!target) {
    await interaction.reply({ content: "❌ No se pudo obtener el usuario.", ephemeral: true });
    return;
  }

  // Motivos variados para el aviso troll
  const motivos = [
    "Mensajes enviados en horarios similares a otras cuentas",
    "Coincidencia en el uso de emojis y frases específicas",
    "Participación en los mismos canales de texto",
    "Reacciones idénticas en mensajes recientes",
    "Conexión desde ubicaciones geográficas similares",
    "Patrón de actividad en eventos y sorteos",
    "Frecuencia de mensajes muy parecida a otras cuentas",
    "Uso de avatares o nombres similares",
    "Respuestas rápidas a los mismos temas",
    "Interacción frecuente con los mismos usuarios"
  ];
  // Elegir 3 motivos al azar
  const motivosElegidos = motivos.sort(() => 0.5 - Math.random()).slice(0, 3);
  const randomNum = Math.floor(Math.random() * 6) + 1;
  const embed = new EmbedBuilder()
    .setTitle("🚨 Aviso de Seguridad Discord (IA)")
    .setColor("Red")
    .setDescription(
      `Se ha detectado que tu cuenta presenta **patrones de comportamiento similares** a otras cuentas en el servidor.\n\n` +
      `Posibles multicuentas detectadas: **${randomNum}**\n` +
      `Motivos:\n- ${motivosElegidos.join("\n- ")}\n\n` +
      `Este aviso fue generado automáticamente por un sistema de IA. Si crees que es un error, contacta a un moderador.`
    )
    .setFooter({ text: "Sistema de Moderación Automático - Discord AI" });

  await sendCommandLog(interaction.client, "troll", interaction.user, `Target: ${target.tag}`);
  await interaction.reply({
    content: `<@${target.id}>`,
    embeds: [embed],
    ephemeral: false
  });
}

export default {
  data,
  execute
};
