/*
  landing.js: the intro page (index.html).

  WHAT IT DOES
    1. Fills in every number on the page from the generated data (data/core.js, data/sim.js).
    2. Draws one map on a full-screen <canvas> and moves it as the page scrolls.

  HOW THE MAP WORKS
    - Every shape (state lines, Texas counties, rivers, canals) is turned once from
      longitude/latitude into flat kilometres (the same Albers map projection the platform
      uses) and stored as a ready-to-draw path.
    - The page is a list of "beats". Each beat has a camera position (CAMERA below). The
      scroll position says which two beats we are between, and the camera glides from one
      to the other.
    - Layers fade in and out with the scroll too: drought colours, canals in red, and at
      the end the canals turning white as they are "sealed".
    - Blue dots flow down the Rio Grande all the time. Red dots drift off unsealed canals.
      The dots are decoration; the numbers beside them are the data.
*/
(function () {
  "use strict";
  const HG = window.HG, SIM = window.HG_SIM || {};
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const num = (v, digits) => Number(v).toLocaleString("en-US", { maximumFractionDigits: digits || 0, minimumFractionDigits: digits || 0 });
  const niceDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  /* ---------- 1. The numbers ---------- */
  const GALLONS_IN_AN_OLYMPIC_POOL = 660430;   // 2,500 cubic metres
  const inDrought = HG.texas.filter((c) => c.dm != null && c.dm >= 2).length;            // D1 or worse
  const amistadFalcon = (HG.river.find((c) => c.reservoir === "Amistad-Falcon") || {}).reservoirPct;
  const test = SIM.pre2020 && SIM.pre2020.test.preSeason;
  // Water that can leak in a day from every rankable canal inside a district, if all run full.
  // This is every Texas Rio Grande district, El Paso and Hudspeth included (they draw on
  // Elephant Butte, not on Amistad and Falcon), and the page's sentence says so:
  // length x wetted width x the leak rate of the soil under it (gallons per square foot per day).
  const a = HG.plan.assumptions, FEET_PER_KM = 3280.84;
  let leakGallons = 0, leakKm = 0;
  HG.canals.forEach((c) => { if (c[8] != null && c[7] >= 0) { leakGallons += c[4] * FEET_PER_KM * a.wetted_width_ft * c[5]; leakKm += c[4]; } });

  $("nDrought").dataset.to = inDrought; $("nRes").textContent = amistadFalcon + "%"; $("week").textContent = niceDate(HG.week);
  $("nGal").dataset.to = Math.round(leakGallons / 1e6); $("nPools").textContent = num(Math.round(leakGallons / GALLONS_IN_AN_OLYMPIC_POOL / 10) * 10); $("nKm").textContent = num(leakKm);
  $("nSeal").dataset.to = HG.plan.cost_to_treat_everything_usd / 1e6;
  // The three-month forecast's one scored test (HG.quarter.test). It is said to beat its best
  // simple rule only if the whole interval of the cost gap is below zero. Lower cost is not a
  // higher share right, so the sentence gives both.
  const q = HG.quarter && HG.quarter.test, share = (v) => num(v * 100, 1) + "%";
  const quarterSentence = q && q.costGapHigh < 0
    ? " A second forecast, three months ahead, beat the best simple rule on cost by " + num(Math.abs(q.costChange) * 100, 1) + "% on " + num(q.counties) +
      " unseen counties: it missed " + num(q.missed) + " drought seasons against " + num(q.missedRule) + ", with " + num(q.falseAlarms) + " false alarms against " + num(q.falseAlarmsRule) +
      ". Its share right was lower, " + share(q.shareRight) + " against " + share(q.shareRightRule) + "."
    : "";
  // Round 7 tested the same idea once on eastern counties. The sentence follows the interval, so a loss reads as a loss.
  const e = HG.quarter && HG.quarter.east;
  const eastSentence = e
    ? (e.costGapLow > 0 ? " In the East it did not hold: on " + num(e.counties) + " eastern counties it cost " + num(e.costChange * 100, 1) + "% more than that rule at the same costs, so the edge is a western result."
      : e.costGapHigh < 0 ? " It held in the East too, on " + num(e.counties) + " eastern counties."
      : " On " + num(e.counties) + " eastern counties it tied that rule.")
    : "";
  $("howForecast").textContent = "A random forest reads the weekly Drought Monitor and the El Niño index." +
    (test ? " Frozen at the end of 2019 and tested on the years since, its January to March warnings caught " + test.forecast.caught + " of " + test.forecast.droughtSeasons + " drought seasons." : "") +
    quarterSentence + eastSentence;
  $("howRank").textContent = num(HG.canals.length) + " canal segments, each matched to the soil under it. Leak rate times drought chance gives the sealing order, with a cost, a crew time and the water kept for every one.";
  $("limitModel").textContent = test
    ? "The six-month forecast is accurate but not special: the simple rule \"already in moderate drought\" caught " + test.d1Rule.caught + " of the same " + test.d1Rule.droughtSeasons + " seasons. We show both."
    : "The six-month forecast only narrowly matches the simple rule \"already in moderate drought\".";

  /* Numbers count up the first time their beat comes into view. */
  function countUp(el) {
    const to = Number(el.dataset.to), digits = Number(el.dataset.digits || 0), t0 = performance.now(), ms = reduced ? 1 : 1500;
    (function tick(now) {
      const u = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - u, 4);
      el.textContent = num(to * e, digits);
      if (u < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      en.target.querySelectorAll("[data-count]").forEach(countUp);
      seen.unobserve(en.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll(".beat").forEach((b) => seen.observe(b));

  /* ---------- 2. The map ---------- */
  const canvas = $("map"), ctx = canvas.getContext("2d");
  const COLOR = { ground: "#05090b", line: "#3d565e", texas: "#e9efec", river: "#38c8f5", red: "#ff4d5e", white: "#ffffff", green: "#2fd9b6",
                  dm: ["#101b1f", "#5d5a35", "#8b7426", "#a55a1c", "#a8323f", "#7a1029"] };   // drought classes None, D0 .. D4, dimmed for a dark map

  // Albers equal-area projection: longitude/latitude to kilometres on a flat sheet.
  const RAD = Math.PI / 180, P1 = 29.5 * RAD, P2 = 45.5 * RAD, L0 = -96 * RAD, P0 = 37.5 * RAD, EARTH = 6371;
  const AN = (Math.sin(P1) + Math.sin(P2)) / 2, AC = Math.cos(P1) ** 2 + 2 * AN * Math.sin(P1), R0 = Math.sqrt(AC - 2 * AN * Math.sin(P0)) / AN;
  function project(lon, lat) {
    const rho = Math.sqrt(AC - 2 * AN * Math.sin(lat * RAD)) / AN, th = AN * (lon * RAD - L0);
    return [EARTH * rho * Math.sin(th), -EARTH * (R0 - rho * Math.cos(th))];
  }
  const flat = (line) => line.map((p) => project(p[0], p[1]));
  function pathOf(lines, close) {
    const path = new Path2D();
    lines.forEach((l) => { l.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]))); if (close) path.closePath(); });
    return path;
  }
  const boxOf = (lon0, lat0, lon1, lat1) => { const a = project(lon0, lat0), b = project(lon1, lat1), c = project(lon0, lat1), d = project(lon1, lat0);
    return [Math.min(a[0], c[0]), Math.min(b[1], c[1], d[1]), Math.max(b[0], d[0]), Math.max(a[1], d[1])]; };

  // Shapes, built once.
  const states = pathOf(HG.base.states.map(flat));
  const texas = pathOf(HG.base.texasEdge.map(flat), true);
  const counties = COLOR.dm.map((_, cls) => pathOf([].concat.apply([], HG.texas.filter((c) => (c.dm || 0) === cls).map((c) => c.rings.map(flat))), true));
  const otherRivers = pathOf(HG.rivers.filter((r) => r.name !== "Rio Grande").map((r) => flat(r.line)));
  // The Rio Grande, piece by piece, with each piece's length so dots can travel along it.
  const river = HG.rivers.filter((r) => r.name === "Rio Grande").map((r) => {
    const pts = flat(r.line), at = [0];
    for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, at, km: at[at.length - 1], path: pathOf([pts]) };
  });
  const riverKm = river.reduce((s, r) => s + r.km, 0);
  // Canals in 30 groups from west to east, so they can be drawn (and later sealed) in a sweep.
  const GROUPS = 30;
  const sorted = HG.canals.map((c) => flat(c[10])).sort((a, b) => a[0][0] - b[0][0]);
  const canalGroups = [];
  for (let g = 0; g < GROUPS; g++) {
    const lines = sorted.slice(Math.floor(sorted.length * g / GROUPS), Math.floor(sorted.length * (g + 1) / GROUPS));
    canalGroups.push({ lines, path: pathOf(lines) });
  }
  const lakes = HG.lakes.map((l) => ({ name: l.name, pct: l.pct, xy: project(l.lon, l.lat) }));

  // Where the camera looks at each stop: a box in longitude and latitude.
  const CAMERA = [
    boxOf(-107.2, 25.4, -93.2, 36.8),     // 0 Texas and its drought
    boxOf(-98.62, 25.82, -97.12, 26.72),  // 1 the canals of the Lower Valley
    boxOf(-98.5, 25.86, -97.2, 26.66),    // 2 the same canals being sealed
  ];

  let W = 0, H = 0, dpr = 1, beat = 0, clock = 0, last = 0, onScreen = false;
  const cam = { x: 0, y: 0, k: 1 };
  function resize() { W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = W * dpr; canvas.height = H * dpr; }
  addEventListener("resize", resize); resize();

  const smooth = (v, a, b) => { const u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
  /* Fit a box into the part of the screen the text leaves free (text sits left on even beats, right on odd). */
  function fit(box, side, high) {
    const wide = W > 760, free = wide ? 0.56 : 1, w = W * free, h = H * (wide ? 0.8 : 0.5);
    const k = Math.min(w / (box[2] - box[0]), h / (box[3] - box[1])) * 0.92;
    const cx = wide ? (side > 0 ? W * (1 - free / 2) - W * 0.02 : W * free / 2 + W * 0.02) : W / 2, cy = wide ? H / 2 : H * (high || 0.32);
    return { k, x: (box[0] + box[2]) / 2 - (cx - W / 2) / k, y: (box[1] + box[3]) / 2 - (cy - H / 2) / k };
  }
  const SIDE = [1, -1, 1];      // +1 = map on the right (text on the left)
  const HIGH = [0.32, 0.32, 0.27];   // on a phone: how far down the screen the map's middle sits. The last beat has the most text, so its map sits higher.

  /* Scroll position as a beat number: 0 at the first Texas stop, 2 at the last. */
  const beats = Array.from(document.querySelectorAll(".beat"));
  const main = document.getElementById("texas");
  function readScroll() {
    // A beat's offsetTop is measured from the top of <main>, not of the page (the opening and the
    // stories sit above it), so the same amount is taken off the scroll position before the two are compared.
    const mid = scrollY + innerHeight / 2 - main.offsetTop;
    let b = 0;
    beats.forEach((el, i) => { const top = el.offsetTop, c = top + el.offsetHeight / 2; if (mid >= c) b = i; });
    const here = beats[b], next = beats[b + 1];
    if (next) { const c0 = here.offsetTop + here.offsetHeight / 2, c1 = next.offsetTop + next.offsetHeight / 2; b += Math.max(0, Math.min(1, (mid - c0) / (c1 - c0))); }
    beat = b;
    // The map is only on screen while <main> is: after the stories, and before "How it works".
    onScreen = scrollY + innerHeight > main.offsetTop && scrollY < main.offsetTop + main.offsetHeight;
  }
  addEventListener("scroll", readScroll, { passive: true }); readScroll();
  addEventListener("pointermove", (e) => { document.body.style.setProperty("--mx", e.clientX + "px"); document.body.style.setProperty("--my", e.clientY + "px"); }, { passive: true });

  /* ---------- Moving dots ---------- */
  const flow = [];                         // blue dots on the river: { piece, s (km along it) }
  for (let i = 0; i < 150; i++) { const r = river[Math.floor(Math.random() * river.length)]; flow.push({ r, s: Math.random() * r.km }); }
  function along(r, s) {
    let i = 1; while (i < r.at.length - 1 && r.at[i] < s) i++;
    const u = (s - r.at[i - 1]) / ((r.at[i] - r.at[i - 1]) || 1), a = r.pts[i - 1], b = r.pts[i];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  }
  let leaks = [];                          // red dots off unsealed canals: { x, y, dx, dy, life }
  function spawnLeak(firstUnsealed, lastDrawn) {
    if (lastDrawn <= firstUnsealed) return;
    const g = canalGroups[firstUnsealed + Math.floor(Math.random() * (lastDrawn - firstUnsealed))];
    const line = g.lines[Math.floor(Math.random() * g.lines.length)], p = line[Math.floor(Math.random() * line.length)], a = Math.random() * 6.283;
    leaks.push({ x: p[0], y: p[1], dx: Math.cos(a), dy: Math.sin(a), life: 1 });
  }

  /* ---------- One frame ---------- */
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; clock += dt;
    if (!onScreen) { requestAnimationFrame(frame); return; }           // nothing to draw while the opening, the stories or the last section cover the map
    // Camera: glide between the two beats we are between, holding still near each one.
    const i = Math.min(CAMERA.length - 2, Math.floor(beat)), u = smooth(beat - i, 0.2, 0.8);
    const a = fit(CAMERA[i], SIDE[i], HIGH[i]), b = fit(CAMERA[i + 1], SIDE[i + 1], HIGH[i + 1]);
    const target = { k: a.k * Math.pow(b.k / a.k, u), x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    const ease = reduced ? 1 : Math.min(1, dt * 5);                  // a little lag, so the camera feels weighted
    cam.k += (target.k - cam.k) * ease; cam.x += (target.x - cam.x) * ease; cam.y += (target.y - cam.y) * ease;
    if (!last || cam.k === 1) Object.assign(cam, target);

    // How strongly each layer shows, from the scroll position.
    const intro = 1;                                                  // the river is always drawn (the opening already told its story)
    const zoomed = smooth(beat, 0.35, 0.95);
    const drought = 1 - 0.8 * zoomed, sweep = 1;
    const lakeShow = 1 - smooth(beat, 0.3, 0.6);
    const canalsDrawn = Math.round(GROUPS * smooth(beat, 0.5, 1.0));
    const canalsSealed = Math.round(GROUPS * smooth(beat, 1.4, 1.95));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = COLOR.ground; ctx.fillRect(0, 0, W, H);
    ctx.setTransform(dpr * cam.k, 0, 0, dpr * cam.k, dpr * (W / 2 - cam.x * cam.k), dpr * (H / 2 - cam.y * cam.k));
    const px = 1 / cam.k;                                             // one screen pixel, in map kilometres
    ctx.lineJoin = ctx.lineCap = "round";

    // Drought colours, revealed in a sweep from west to east.
    if (drought > 0.01) {
      const tb = CAMERA[0];
      ctx.save(); ctx.beginPath(); ctx.rect(tb[0] - 200, tb[1] - 200, (tb[2] - tb[0] + 400) * sweep, tb[3] - tb[1] + 400); ctx.clip();
      counties.forEach((path, cls) => { ctx.globalAlpha = drought * 0.9; ctx.fillStyle = COLOR.dm[cls]; ctx.fill(path, "evenodd"); });
      ctx.restore();
    }
    ctx.globalAlpha = 0.5 * (1 - 0.6 * zoomed); ctx.strokeStyle = COLOR.line; ctx.lineWidth = 0.8 * px; ctx.stroke(states);
    ctx.globalAlpha = 0.7; ctx.strokeStyle = COLOR.texas; ctx.lineWidth = 1.1 * px; ctx.stroke(texas);
    ctx.globalAlpha = 0.28; ctx.strokeStyle = COLOR.river; ctx.lineWidth = 0.9 * px; ctx.stroke(otherRivers);

    // The Rio Grande: a soft glow under a bright line. It draws itself once, from the source down.
    let before = 0;
    river.forEach((r) => {
      const from = before / riverKm, to = (before + r.km) / riverKm; before += r.km;
      const part = Math.max(0, Math.min(1, (intro - from) / (to - from)));
      if (part <= 0) return;
      ctx.setLineDash([r.km * part, r.km * 2]);
      ctx.globalAlpha = 0.22; ctx.strokeStyle = COLOR.river; ctx.lineWidth = 9 * px; ctx.stroke(r.path);
      ctx.globalAlpha = 1; ctx.lineWidth = 2.2 * px; ctx.stroke(r.path);
      ctx.setLineDash([]);
    });

    // Canals: red where unsealed, white where sealed.
    for (let g = 0; g < canalsDrawn; g++) {
      const sealed = g < canalsSealed;
      // The green glow is only drawn on the few groups just sealed: it is costly, and the eye is there anyway.
      if (sealed && g >= canalsSealed - 3) { ctx.globalAlpha = 0.3; ctx.strokeStyle = COLOR.green; ctx.lineWidth = 6 * px; ctx.stroke(canalGroups[g].path); }
      ctx.globalAlpha = sealed ? 1 : 0.85; ctx.strokeStyle = sealed ? COLOR.white : COLOR.red; ctx.lineWidth = (sealed ? 1.3 : 1.1) * px; ctx.stroke(canalGroups[g].path);
    }

    if (!reduced) {
      // Water moving down the river. The dots keep a steady speed on screen at every zoom.
      ctx.fillStyle = COLOR.white;
      flow.forEach((d) => {
        d.s += dt * 70 * px; if (d.s > d.r.km) d.s = 0;
        const p = along(d.r, d.s);
        ctx.globalAlpha = 0.9 * intro; ctx.beginPath(); ctx.arc(p[0], p[1], 1.5 * px, 0, 7); ctx.fill();
      });
      // Water leaking out of canals that are drawn but not yet sealed.
      if (canalsDrawn > canalsSealed) for (let n = 0; n < 4; n++) if (leaks.length < 320 && Math.random() < dt * 60) spawnLeak(canalsSealed, canalsDrawn);
      ctx.fillStyle = COLOR.red;
      leaks.forEach((d) => {
        d.life -= dt * 0.8; const far = (1 - d.life) * 12 * px;
        ctx.globalAlpha = Math.max(0, d.life); ctx.beginPath(); ctx.arc(d.x + d.dx * far, d.y + d.dy * far, 1.6 * px, 0, 7); ctx.fill();
      });
      leaks = leaks.filter((d) => d.life > 0);
    }

    // Reservoirs: a ring that fills to how full each one is, with its reading beside it.
    if (lakeShow > 0.01) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fill = 1;
      lakes.forEach((l) => {
        const x = (l.xy[0] - cam.x) * cam.k + W / 2, y = (l.xy[1] - cam.y) * cam.k + H / 2;
        ctx.globalAlpha = lakeShow; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.stroke();
        ctx.strokeStyle = l.pct < 25 ? COLOR.red : COLOR.river; ctx.beginPath(); ctx.arc(x, y, 17, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (l.pct / 100) * fill); ctx.stroke();
        ctx.font = "500 12px 'IBM Plex Mono', monospace"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f2f5f1";
        ctx.fillText(l.name.toUpperCase() + "  " + (l.pct * fill).toFixed(1) + "%", x + 28, y);
      });
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
