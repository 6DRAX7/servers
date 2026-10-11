const express = require("express");
const fetch = require("node-fetch");
const app = express();

const ALLOWED = ["80603660664031", "129203155256146"];

const CACHE_TTL = 60 * 1000; // 60s
const cache = {}; // placeId -> {time, servers}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://www.roblox.com/",
};

async function fetchServers(pid) {
  const url = `https://games.roblox.com/v1/games/${pid}/servers/Public?limit=100`;
  const r = await fetch(url, { headers: HEADERS });
  if (r.status !== 200) {
    return { ok: false, status: r.status };
  }
  const data = await r.json();
  const servers = (data.data || []).map(s => ({
    id: s.id,
    players: s.playing,
    max: s.maxPlayers,
    ping: s.ping || 0,
  }));
  return { ok: true, servers };
}

app.get("/servers/:placeId", async (req, res) => {
  const pid = req.params.placeId;
  if (!ALLOWED.includes(pid)) return res.status(403).json({ error: "not allowed" });

  const now = Date.now();
  const c = cache[pid];
  if (c && now - c.time < CACHE_TTL) {
    return res.json({ servers: c.servers });
  }

  // Try up to 3 times with backoff (429 / empty)
  let last = { ok: false, status: 0 };
  for (let i = 0; i < 3; i++) {
    try {
      last = await fetchServers(pid);
    } catch (e) {
      last = { ok: false, status: 500 };
    }
    if (last.ok && last.servers.length > 0) break;
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }

  if (last.ok) {
    cache[pid] = { time: now, servers: last.servers };
    return res.json({ servers: last.servers });
  }

  // On failure, serve stale cache if we have any
  if (c) return res.json({ servers: c.servers });
  return res.status(last.status || 500).json({ error: "roblox error" });
});

app.listen(process.env.PORT || 3000, () => console.log("up"));
