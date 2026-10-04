const express = require("express");
const fetch = require("node-fetch");
const app = express();

const ALLOWED = ["80603660664031"]; // placeId-ове, които може да питат

app.get("/servers/:placeId", async (req, res) => {
  const pid = req.params.placeId;
  if (!ALLOWED.includes(pid)) return res.status(403).json({ error: "not allowed" });
  try {
    const r = await fetch(
      `https://games.roblox.com/v1/games/${pid}/servers/Public?limit=100`
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
