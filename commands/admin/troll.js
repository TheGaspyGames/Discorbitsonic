import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from "discord.js";
import { sendCommandLog } from "../../utils/utilities.js";

const OWNER_ID = "684395420004253729";

const data = new SlashCommandBuilder()
  .setName("troll")
  .setDescription("Envia un gif troll al ejecutar el comando.");

async function execute(interaction) {
  if (interaction.user.id !== OWNER_ID) {
    await interaction.reply({
      content: "https://media.tenor.com/cmKzEULWN3QAAAAM/trollface.gif",
      ephemeral: true
    });
    return;
  }

  // Obtener lista de usuarios elegibles (todos menos bots)
  const guildMembers = interaction.guild.members.cache.filter(member => !member.user.bot);
  const options = guildMembers.map(member => ({
    label: member.user.username,
    value: member.id
  }));

  // Crear menú de selección
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("troll_select")
    .setPlaceholder("Selecciona un usuario para trolear")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({
    content: "Selecciona un usuario para enviarle un aviso troll:",
    components: [row],
    ephemeral: true
  });

  // Manejar la interacción del menú
  const filter = i => i.customId === "troll_select" && i.user.id === OWNER_ID;
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

  collector.on("collect", async i => {
    const selectedUserId = i.values[0];
    const target = interaction.guild.members.cache.get(selectedUserId);

    if (!target) {
      await i.reply({ content: "❌ No se pudo obtener el usuario seleccionado.", ephemeral: true });
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
      "Interacción frecuente con los mismos usuarios",
      "Uso de bots o herramientas automatizadas",
      "Mensajes eliminados rápidamente después de ser enviados",
      "Participación en discusiones sensibles",
      "Uso de lenguaje o jerga específica",
      "Coincidencia en la configuración de perfiles",
      "Frecuencia de conexión en horarios inusuales",
      "Interacción con cuentas recientemente creadas",
      "Participación en múltiples servidores con los mismos usuarios",
      "Uso de enlaces o contenido sospechoso",
      "Respuestas automáticas o predecibles"
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

    try {
      await target.send({
        content: "🚨 **Aviso de Seguridad Discord (IA)** 🚨",
        embeds: [embed]
      });
      await i.reply({
        content: `El aviso de seguridad ha sido enviado al MD de <@${target.id}>.`,
        ephemeral: true
      });
    } catch (error) {
      console.error("❌ Error al enviar el mensaje directo:", error);
      await i.reply({
        content: `❌ No se pudo enviar el aviso al MD de <@${target.id}>. Puede que tenga los MD desactivados.`,
        ephemeral: true
      });
    }
  });

  collector.on("end", collected => {
    if (collected.size === 0) {
      interaction.followUp({ content: "⏳ El tiempo para seleccionar un usuario ha expirado.", ephemeral: true });
    }
  });
}

export default {
  data,
  execute
};