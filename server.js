const express = require("express");
const fetch = require("node-fetch");
const app = express();

const ALLOWED = ["80603660664031", "129203155256146"];

const UNIVERSE_OF = {
  "80603660664031": "10765221743",
  "129203155256146": "10765221743",
};

app.get("/servers/:placeId", async (req, res) => {
  const pid = req.params.placeId;
  if (!ALLOWED.includes(pid)) return res.status(403).json({ error: "not allowed" });

  const universeId = UNIVERSE_OF[pid];
  if (!universeId) return res.status(400).json({ error: "no universe mapping" });

  try {
    const r = await fetch(
      `https://apis.roblox.com/cloud/v2/universes/${universeId}/places/${pid}/instances?maxPageSize=100`,
      { headers: { "x-api-key": process.env.ROBLOX_API_KEY } }
    );
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "roblox error", detail: data });
    }

    const servers = (data.instances || []).map(s => ({
      id: s.id,
      players: s.playerCount || 0,
      max: s.maxPlayers || 12,
      ping: s.ping || 0,
    }));

    res.json({ servers });
  } catch (e) {
    res.status(500).json({ error: "fetch failed", detail: String(e) });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("up"));
