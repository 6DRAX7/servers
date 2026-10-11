const express = require("express");
const fetch = require("node-fetch");
const app = express();

const ALLOWED = ["80603660664031", "129203155256146"]; // placeId-ове, които може да питат

app.get("/raw/:placeId", async (req, res) => {
  const pid = req.params.placeId;
  try {
    const r = await fetch(
      `https://games.roblox.com/v1/games/${pid}/servers/Public?limit=100`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept": "application/json"
        }
      }
    );
    const text = await r.text();
    res.json({ status: r.status, body: text.slice(0, 500) });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/servers/:placeId", async (req, res) => {
  const pid = req.params.placeId;
  if (!ALLOWED.includes(pid)) return res.status(403).json({ error: "not allowed" });
  try {
    const r = await fetch(
      `https://games.roblox.com/v1/games/${pid}/servers/Public?limit=100`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept": "application/json"
        }
      }
    );
    const data = await r.json();
    const servers = (data.data || []).map(s => ({
      id: s.id,
      players: s.playing,
      max: s.maxPlayers,
      ping: s.ping,
    }));
    res.json({ servers });
  } catch (e) {
    res.status(500).json({ error: "fetch failed" });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("up"));
