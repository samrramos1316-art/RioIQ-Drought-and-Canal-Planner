/*
  api/live.js: today's reservoir storage, for the platform's "live" reading.

  Why this exists: Water Data for Texas publishes a daily file for each reservoir, but its
  server does not let a web page in a browser read it. This small function runs on the host
  (Vercel) instead, reads the three files, and hands the page a short answer:

      { systems: { "Amistad-Falcon": { pct, date }, "Elephant Butte": { pct, date } } }

  No key is needed. If a source fails, that system is left out and the page keeps the
  reading saved by the last pipeline refresh.
*/
const SOURCE = "https://www.waterdatafortexas.org/reservoirs/individual/";
// Amistad and Falcon are run as one system, so their storage is added together.
const SYSTEMS = { "Amistad-Falcon": ["amistad", "falcon"], "Elephant Butte": ["elephant-butte"] };

const TIMEOUT_MS = 15000;  // give up on a slow source instead of hanging the request (a cold start can take several seconds)

/* The newest COMPLETE row of a reservoir file: its date, usable storage and usable capacity
   (acre-feet). The newest row is sometimes published with a blank field; a blank would be read
   as zero, so rows are walked back from the end until both numbers are really there. */
async function latest(name) {
  const reply = await fetch(SOURCE + name + ".csv", { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!reply.ok) throw new Error(name + " " + reply.status);
  const lines = (await reply.text()).split("\n").filter((line) => line && line[0] !== "#");
  const header = lines[0].split(",");
  const at = (column) => header.indexOf(column);
  for (let i = lines.length - 1; i >= 1; i--) {
    const row = lines[i].split(",");
    const storage = row[at("conservation_storage")], capacity = row[at("conservation_capacity")];
    const filled = (text) => text != null && text.trim() !== "" && isFinite(Number(text));
    if (filled(storage) && filled(capacity) && Number(capacity) > 0) {
      return { date: row[at("date")], storage: Number(storage), capacity: Number(capacity) };
    }
  }
  throw new Error(name + " has no complete row");
}

module.exports = async (request, response) => {
  const systems = {};
  for (const system in SYSTEMS) {
    try {
      const lakes = await Promise.all(SYSTEMS[system].map(latest));
      const storage = lakes.reduce((sum, lake) => sum + lake.storage, 0);
      const capacity = lakes.reduce((sum, lake) => sum + lake.capacity, 0);
      if (capacity > 0 && isFinite(storage)) {
        systems[system] = { pct: Math.round(1000 * storage / capacity) / 10, date: lakes[0].date };
      }
    } catch (error) { /* leave this system out; the page falls back to the saved reading */ }
  }
  // The source updates once a day, so a good answer is kept for an hour. An answer with a
  // system missing is kept for only a minute, so one failed read does not last an hour.
  const complete = Object.keys(systems).length === Object.keys(SYSTEMS).length;
  response.setHeader("Cache-Control", complete ? "s-maxage=3600, stale-while-revalidate=86400" : "s-maxage=60");
  response.status(200).json({ systems, source: "Water Data for Texas (Texas Water Development Board)" });
};
