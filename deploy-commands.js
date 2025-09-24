// deploy-commands.js
import { REST, Routes } from "discord.js";
import 'dotenv/config';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployCommands() {
  const commands = [];
  const foldersPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = (await import(`file://${path.join(foldersPath, file)}`)).default;
    if (command?.data) commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`📡 Registrando ${commands.length} comandos…`);
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), // para globales
      { body: commands }
    );
    console.log('✅ Comandos registrados correctamente');
  } catch (error) {
    console.error(error);
  }
}
