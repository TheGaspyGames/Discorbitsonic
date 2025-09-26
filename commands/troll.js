import { SlashCommandBuilder } from "discord.js";
import { sendCommandLog } from "../utils/utilities.js";

const data = new SlashCommandBuilder()
  .setName("troll")
  .setDescription("Envía un gif troll.");

async function execute(interaction) {
  // Log command usage
  await sendCommandLog(interaction.client, "troll", interaction.user);

  await interaction.reply({
    content: "https://media.tenor.com/cmKzEULWN3QAAAAM/trollface.gif",
    ephemeral: true
  });
}

export default {
  data,
  execute
};
