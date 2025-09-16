import { Events } from "discord.js";
import config from "../config.json" assert { type: "json" };

export function registerEvents(client) {
  client.once(Events.ClientReady, async c => {
    console.log(`✅ Bot conectado como ${c.user.tag}`);

    // Limpiar comandos globales y registrar solo en el servidor objetivo
    const guild = client.guilds.cache.get(config.TARGET_GUILD_ID);
    if (guild) {
      await guild.commands.set(client.commands.map(cmd => cmd.data));
      console.log("✅ Slash commands registrados en el servidor objetivo");
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: "❌ Error al ejecutar el comando.", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Error al ejecutar el comando.", ephemeral: true });
      }
    }
  });
}