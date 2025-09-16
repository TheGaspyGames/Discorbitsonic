import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("troll")
  .setDescription("Envía un gif troll.");

async function execute(interaction) {
  await interaction.reply({
    content: "https://media.tenor.com/cmKzEULWN3QAAAAM/trollface.gif",
    ephemeral: true
  });
}

export default {
  data,
  execute
};
