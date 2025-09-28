
import { SlashCommandBuilder, EmbedBuilder, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";
import { configManager } from "../utils/configManager.js";

const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Crea y envía un embed personalizado a un canal seleccionado.");

async function execute(interaction) {
  if (!configManager.isAuthorized(interaction.user.id)) {
    return interaction.reply({ content: "❌ No tienes permisos.", ephemeral: true });
  }

  // Obtener canales de texto disponibles
  const channels = interaction.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText && c.viewable && c.permissionsFor(interaction.client.user).has(["SendMessages", "ViewChannel"]))
    .map(c => ({ label: `#${c.name}`, value: c.id }));

  if (channels.length === 0) {
    return interaction.reply({ content: "❌ No hay canales de texto disponibles para enviar el embed.", ephemeral: true });
  }

  // Menú de selección de canal
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("select_channel_embed")
    .setPlaceholder("Selecciona el canal donde enviar el embed...")
    .addOptions(channels.slice(0, 25));


  // Botones en español y como la imagen
  const btnEditarContenido = new ButtonBuilder()
    .setCustomId("edit_content_embed")
    .setLabel("Editar Contenido")
    .setStyle(ButtonStyle.Primary);

  const btnEditarColor = new ButtonBuilder()
    .setCustomId("edit_color_embed")
    .setLabel("Editar Color")
    .setStyle(ButtonStyle.Secondary);

  const btnEditarImagenes = new ButtonBuilder()
    .setCustomId("edit_images_embed")
    .setLabel("Editar Imágenes")
    .setStyle(ButtonStyle.Secondary);

  const btnEditarAutor = new ButtonBuilder()
    .setCustomId("edit_author_embed")
    .setLabel("Editar Autor")
    .setStyle(ButtonStyle.Secondary);

  const btnEditarFooter = new ButtonBuilder()
    .setCustomId("edit_footer_embed")
    .setLabel("Editar Pie de página")
    .setStyle(ButtonStyle.Secondary);

  const btnEnviar = new ButtonBuilder()
    .setCustomId("send_embed")
    .setLabel("Enviar")
    .setStyle(ButtonStyle.Success);

  const btnCancelar = new ButtonBuilder()
    .setCustomId("cancel_embed")
    .setLabel("Cancelar")
    .setStyle(ButtonStyle.Danger);

  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(btnEditarContenido, btnEditarColor, btnEditarImagenes);
  const row3 = new ActionRowBuilder().addComponents(btnEditarAutor, btnEditarFooter);
  const row4 = new ActionRowBuilder().addComponents(btnEnviar, btnCancelar);

  // Estado temporal del embed
  let embedData = {
    title: "Embed personalizado",
    description: "Aqui podras crear tu embed a gusto con un simple comando a tu disposicion.",
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTolYyrw3hYP4OEB9AqcxpLyl0oSplbLkizTg&s",
    color: 0x23272A
  };
  let selectedChannelId = channels[0].value;


  // Función para construir la vista previa del embed
  function buildPreviewEmbed() {
    const preview = new EmbedBuilder().setColor(embedData.color || 0x23272A);
    if (embedData.title) preview.setTitle(embedData.title);
    if (embedData.description) preview.setDescription(embedData.description);
    if (embedData.url) preview.setURL(embedData.url);
    if (embedData.image) preview.setImage(embedData.image);
    if (embedData.thumbnail) preview.setThumbnail(embedData.thumbnail);
    if (embedData.author_name) preview.setAuthor({
      name: embedData.author_name,
      url: embedData.author_url || undefined,
      iconURL: embedData.author_icon || undefined
    });
    if (embedData.footer_text) preview.setFooter({
      text: embedData.footer_text,
      iconURL: embedData.footer_icon || undefined
    });
    return preview;
  }

  await interaction.reply({
    content: "Selecciona el canal y edita el contenido del embed:",
    components: [row1, row2, row3, row4],
    embeds: [buildPreviewEmbed()],
    ephemeral: true
  });

  const msg = await interaction.fetchReply();

  const collector = msg.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 5 * 60_000
  });

  collector.on("collect", async i => {
    if (i.customId === "select_channel_embed") {
      selectedChannelId = i.values[0];
      await i.update({
        content: "Selecciona el canal y edita el contenido del embed:",
        components: [row1, row2, row3, row4],
        embeds: [buildPreviewEmbed()],
        ephemeral: true
      });
    }
    if (i.customId === "edit_content_embed") {
      // Modal para editar contenido
      const modal = new ModalBuilder()
        .setCustomId("modal_edit_embed_content")
        .setTitle("Creador de Embed: Contenido");

      const titleInput = new TextInputBuilder()
        .setCustomId("embed_title")
        .setLabel("Título")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.title || "");

      const descInput = new TextInputBuilder()
        .setCustomId("embed_description")
        .setLabel("Descripción")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(4000)
        .setValue(embedData.description || "");

      const urlInput = new TextInputBuilder()
        .setCustomId("embed_url")
        .setLabel("URL")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.url || "");

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(urlInput)
      );
      await i.showModal(modal);
    }
    if (i.customId === "edit_color_embed") {
      // Modal para editar color
      const modal = new ModalBuilder()
        .setCustomId("modal_edit_embed_color")
        .setTitle("Creador de Embed: Color");

      const colorInput = new TextInputBuilder()
        .setCustomId("embed_color")
        .setLabel("Color Hex, Decimal o nombre (\"verde claro\")")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.color ? embedData.color.toString() : "");

      modal.addComponents(new ActionRowBuilder().addComponents(colorInput));
      await i.showModal(modal);
    }
    if (i.customId === "edit_images_embed") {
      // Modal para editar imágenes
      const modal = new ModalBuilder()
        .setCustomId("modal_edit_embed_images")
        .setTitle("Creador de Embed: Imágenes");

      const imageInput = new TextInputBuilder()
        .setCustomId("embed_image")
        .setLabel("URL de la imagen")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.image || "");

      const thumbInput = new TextInputBuilder()
        .setCustomId("embed_thumbnail")
        .setLabel("URL de la miniatura")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.thumbnail || "");

      modal.addComponents(
        new ActionRowBuilder().addComponents(imageInput),
        new ActionRowBuilder().addComponents(thumbInput)
      );
      await i.showModal(modal);
    }
    if (i.customId === "edit_author_embed") {
      // Modal para editar autor
      const modal = new ModalBuilder()
        .setCustomId("modal_edit_embed_author")
        .setTitle("Creador de Embed: Autor");

      const nameInput = new TextInputBuilder()
        .setCustomId("embed_author_name")
        .setLabel("Nombre")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.author_name || "");

      const urlInput = new TextInputBuilder()
        .setCustomId("embed_author_url")
        .setLabel("URL")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.author_url || "");

      const iconInput = new TextInputBuilder()
        .setCustomId("embed_author_icon")
        .setLabel("URL del icono")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.author_icon || "");

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(urlInput),
        new ActionRowBuilder().addComponents(iconInput)
      );
      await i.showModal(modal);
    }
    if (i.customId === "edit_footer_embed") {
      // Modal para editar pie de página
      const modal = new ModalBuilder()
        .setCustomId("modal_edit_embed_footer")
        .setTitle("Creador de Embed: Pie de página");

      const textInput = new TextInputBuilder()
        .setCustomId("embed_footer_text")
        .setLabel("Texto")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.footer_text || "");

      const iconInput = new TextInputBuilder()
        .setCustomId("embed_footer_icon")
        .setLabel("URL del icono")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.footer_icon || "");

      modal.addComponents(
        new ActionRowBuilder().addComponents(textInput),
        new ActionRowBuilder().addComponents(iconInput)
      );
      await i.showModal(modal);
    }
    if (i.customId === "send_embed") {
      const channel = interaction.guild.channels.cache.get(selectedChannelId);
      if (!channel) {
        await i.reply({ content: "❌ Canal no encontrado.", ephemeral: true });
        return;
      }
      const embed = buildPreviewEmbed();
      await channel.send({ embeds: [embed] });
      await i.update({ content: `✅ Embed enviado a <#${channel.id}>`, components: [] });
      collector.stop();
      await sendCommandLog(interaction.client, "embed", interaction.user, `Canal: #${channel.name}`);
    }
    if (i.customId === "cancel_embed") {
      await i.update({ content: "❌ Operación cancelada.", components: [] });
      collector.stop();
    }
  });

  // Modal submit handler
  interaction.client.on("interactionCreate", async modalInt => {
    if (!modalInt.isModalSubmit()) return;
    if (modalInt.user.id !== interaction.user.id) return;
    let updated = false;
    // Contenido
    if (modalInt.customId === "modal_edit_embed_content") {
      embedData.title = modalInt.fields.getTextInputValue("embed_title");
      embedData.description = modalInt.fields.getTextInputValue("embed_description");
      embedData.url = modalInt.fields.getTextInputValue("embed_url");
      updated = true;
      await modalInt.reply({ content: "✅ Contenido del embed actualizado. Puedes enviarlo o seguir editando.", ephemeral: true });
    }
    // Color
    if (modalInt.customId === "modal_edit_embed_color") {
      let colorValue = modalInt.fields.getTextInputValue("embed_color").trim();
      if (colorValue.startsWith("#")) {
        embedData.color = parseInt(colorValue.replace("#", ""), 16);
      } else if (/^\d+$/.test(colorValue)) {
        embedData.color = parseInt(colorValue, 10);
      } else {
        // Intentar nombre de color
        try {
          const { default: colornames } = await import("colornames");
          const colorHex = colornames(colorValue);
          embedData.color = colorHex ? parseInt(colorHex.replace("#", ""), 16) : 0x23272A;
        } catch {
          embedData.color = 0x23272A;
        }
      }
      updated = true;
      await modalInt.reply({ content: "✅ Color del embed actualizado.", ephemeral: true });
    }
    // Imágenes
    if (modalInt.customId === "modal_edit_embed_images") {
      embedData.image = modalInt.fields.getTextInputValue("embed_image");
      embedData.thumbnail = modalInt.fields.getTextInputValue("embed_thumbnail");
      updated = true;
      await modalInt.reply({ content: "✅ Imágenes del embed actualizadas.", ephemeral: true });
    }
    // Autor
    if (modalInt.customId === "modal_edit_embed_author") {
      embedData.author_name = modalInt.fields.getTextInputValue("embed_author_name");
      embedData.author_url = modalInt.fields.getTextInputValue("embed_author_url");
      embedData.author_icon = modalInt.fields.getTextInputValue("embed_author_icon");
      updated = true;
      await modalInt.reply({ content: "✅ Autor del embed actualizado.", ephemeral: true });
    }
    // Pie de página
    if (modalInt.customId === "modal_edit_embed_footer") {
      embedData.footer_text = modalInt.fields.getTextInputValue("embed_footer_text");
      embedData.footer_icon = modalInt.fields.getTextInputValue("embed_footer_icon");
      updated = true;
      await modalInt.reply({ content: "✅ Pie de página del embed actualizado.", ephemeral: true });
    }
    // Actualizar la vista previa si hubo cambios
    if (updated) {
      try {
        await msg.edit({
          content: "Selecciona el canal y edita el contenido del embed:",
          components: [row1, row2, row3, row4],
          embeds: [buildPreviewEmbed()]
        });
      } catch {}
    }
  });
}

export default {
  data,
  execute
};