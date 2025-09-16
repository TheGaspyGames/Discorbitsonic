import { Events } from "discord.js";
import config from "../config.json" assert { type: "json" };

export function registerEvents(client) {
  client.once(Events.ClientReady, async c => {
    console.log(`✅ Bot conectado como ${c.user.tag}`);

    const guild = client.guilds.cache.get(config.TARGET_GUILD_ID);
    if (guild) {
      await guild.commands.set(client.commands.map(cmd => cmd.data));
      console.log("✅ Slash commands registrados en el servidor objetivo");
    } else {
      console.warn("⚠️ Guild no encontrado. Verifica TARGET_GUILD_ID.");
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error en comando ${interaction.commandName}:`, error);

      const reply = {
        content: "❌ Error al ejecutar el comando.",
        ephemeral: true,
      };

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });
}
