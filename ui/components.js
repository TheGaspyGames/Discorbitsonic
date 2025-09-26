import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";

/**
 * Confirmation view component for role addition
 */
export class ConfirmView {
  constructor(role) {
    this.role = role;
    this.value = null;
    this.components = this.buildComponents();
  }

  buildComponents() {
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Sí')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('No')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
      .addComponents(confirmButton, cancelButton);

    return [row];
  }

  async handleInteraction(interaction) {
    if (interaction.customId === 'confirm') {
      this.value = true;
      await interaction.update({
        content: `Confirmado. El proceso para añadir el rol ${this.role.name} ha comenzado.`,
        components: []
      });
      return true;
    } else if (interaction.customId === 'cancel') {
      this.value = false;
      await interaction.update({
        content: `Cancelado. No se añadirá el rol ${this.role.name}.`,
        components: []
      });
      return false;
    }
    return null;
  }
}

export default { ConfirmView };