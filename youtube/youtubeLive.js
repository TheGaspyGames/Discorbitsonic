import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

let lastLiveVideoId = null;

export async function monitorYouTubeLive(client) {
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      // Canal offline
      if (client.user.presence?.activities[0]?.type === "STREAMING") {
        client.user.setActivity(null); // Quita la actividad
        console.log("YouTube offline, actividad removida");
      }
      return;
    }

    const live = data.items[0];
    if (live.id.videoId === lastLiveVideoId) return; // Ya estaba activo

    lastLiveVideoId = live.id.videoId;
    const title = live.snippet.title;
    const url = `https://www.youtube.com/watch?v=${live.id.videoId}`;

    // Actualiza actividad del bot
    client.user.setActivity(title, {
      type: "STREAMING",
      url: url
    });

    console.log(`🔴 YouTube en vivo: ${title}`);
  } catch (err) {
    console.error("Error monitoreando YouTube:", err);
  }
}
