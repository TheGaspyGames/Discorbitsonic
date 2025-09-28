# Discorbitsonic

Discorbitsonic es un bot avanzado para Discord, diseñado para ofrecer funcionalidades de administración, utilidades, logs premium, integración con YouTube Live y más. Está desarrollado en Node.js usando la librería [discord.js](https://discord.js.org/).

## Características principales
- **Comandos de administración y utilidades** (roles, mensajes, embeds, ayuda, etc.)
- **Logs premium** (webhook configurable para eventos importantes)
- **Monitor de caídas de internet** (avisa en un canal cuando el bot pierde y recupera conexión)
- **Integración con YouTube Live** (monitoriza transmisiones en vivo)
- **Sistema modular de comandos y eventos**

## Requisitos
- Node.js 18+
- Un bot de Discord y su token
- (Opcional) Webhook para logs premium

## Instalación
1. Clona este repositorio:
   ```sh
   git clone https://github.com/tuusuario/Discorbitsonic.git
   cd Discorbitsonic
   ```
2. Instala las dependencias:
   ```sh
   npm install
   ```
3. Crea un archivo `.env` en la raíz con el siguiente contenido:
   ```env
   DISCORD_TOKEN=tu_token_de_discord
   LOGS_WEBHOOK_URL=tu_webhook_url (opcional)
   ```
4. Configura `config.json` según tus necesidades (por ejemplo, el ID del canal de logs):
   ```json
   {
     "LOG_CHANNEL_ID": "ID_DEL_CANAL_DE_LOGS"
   }
   ```
5. Inicia el bot:
   ```sh
   node index.js
   ```

## Estructura del proyecto
- `index.js`: Punto de entrada principal del bot.
- `commands/`: Comandos disponibles (slash y prefijo).
- `handlers/`: Manejadores de eventos de Discord.
- `utils/`: Utilidades y sistemas de logs.
- `ui/`: Componentes de interfaz (embeds, etc.).
- `youtube/`: Integración con YouTube Live.
- `config.json`: Configuración general.

## Comandos principales
- **Slash commands**: Se cargan automáticamente desde la carpeta `commands/`.
- **Prefijo**: `!`
  - `!updgit`: Actualiza el bot desde Git y muestra el resultado en un embed.
  - `!setpremiumlogs`: Configura los logs premium en el servidor.

## Monitor de caídas de internet
El bot detecta automáticamente cuando pierde conexión a internet y notifica en el canal configurado cuánto tiempo estuvo caído.

## Logs premium
Puedes configurar un webhook para recibir logs avanzados de eventos importantes del servidor.

## Integración con YouTube Live
El bot monitoriza transmisiones en vivo de YouTube y puede enviar notificaciones a Discord.

## Contribuir
¡Las contribuciones son bienvenidas! Abre un issue o pull request para sugerencias o mejoras.

## Licencia
MIT
