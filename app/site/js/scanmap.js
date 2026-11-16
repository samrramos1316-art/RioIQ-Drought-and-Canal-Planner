/*
  scanmap.js: the platform's map, drawn by hand on a <canvas> (no map library, no map tiles).

  It follows the look of the team's scan page (the visuals folder): a dark chart in an
  equal-area projection, latitude and longitude lines, the river with a moving dash, canals
  coloured by class, and a "scan" that sweeps across the country, locks on Texas and builds
  the picture one layer at a time.

  HOW IT WORKS
    project()   turns longitude and latitude into flat kilometres (Albers equal-area conic)
    cam         the camera: where the centre of the screen is, and how many pixels per km
    S           "layer strengths" from 0 to 1. The scan animates these numbers; draw() reads them
    draw()      redraws everything, about 60 times a second
    runScan()   the animation: a list of steps that each move the camera and raise a layer

  window.HGMap.create(options) returns the map. platform.js tells it what to show with set().
*/
(function () {
  "use strict";
  const HG = window.HG, U = window.HGU;

  /* ---------- Projection: Albers equal-area conic, in kilometres ---------- */
  const RAD = Math.PI / 180, P1 = 29.5 * RAD, P2 = 45.5 * RAD, L0 = -96 * RAD, P0 = 37.5 * RAD, EARTH = 6371;
  const AN = (Math.sin(P1) + Math.sin(P2)) / 2, AC = Math.cos(P1) ** 2 + 2 * AN * Math.sin(P1), R0 = Math.sqrt(AC - 2 * AN * Math.sin(P0)) / AN;
  function project(lon, lat) {
    const rho = Math.sqrt(AC - 2 * AN * Math.sin(lat * RAD)) / AN, th = AN * (lon * RAD - L0);
    return [EARTH * rho * Math.sin(th), -EARTH * (R0 - rho * Math.cos(th))];
  }
  function unproject(x, y) {
    const a = x / EARTH, b = R0 + y / EARTH, rho = Math.hypot(a, b);
    return [(L0 + Math.atan2(a, b) / AN) / RAD, Math.asin((AC - rho * rho * AN * AN) / (2 * AN)) / RAD];
  }
  /* A list of [lon, lat] points becomes one flat array x0, y0, x1, y1 ... in kilometres. */
  function flat(points) {
    const out = new Float32Array(points.length * 2);
    for (let i = 0; i < points.length; i++) { const p = project(points[i][0], points[i][1]); out[2 * i] = p[0]; out[2 * i + 1] = p[1]; }
    return out;
  }
  function boxOf(lines) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const l of lines) for (let i = 0; i < l.length; i += 2) { if (l[i] < x0) x0 = l[i]; if (l[i] > x1) x1 = l[i]; if (l[i + 1] < y0) y0 = l[i + 1]; if (l[i + 1] > y1) y1 = l[i + 1]; }
    return [x0, y0, x1, y1];
  }
  const llBox = (w, s, e, n) => boxOf([Float32Array.from([...project(w, s), ...project(e, n), ...project(w, n), ...project(e, s)])]);

  /* ---------- Decode the data once ---------- */
  const CITIES = [["El Paso", -106.49, 31.76], ["Presidio", -104.37, 29.56], ["Del Rio", -100.90, 29.36], ["Eagle Pass", -100.50, 28.71],
                  ["Laredo", -99.51, 27.51], ["McAllen", -98.23, 26.20], ["Brownsville", -97.50, 25.90]];
  const G = {
    states: HG.base.states.map(flat),
    texas: HG.base.texasEdge.map(flat),
    dots: (() => { const d = HG.base.dots, o = new Float32Array(d.length); for (let i = 0; i < d.length; i += 2) { const p = project(d[i], d[i + 1]); o[i] = p[0]; o[i + 1] = p[1]; } return o; })(),
    rivers: HG.rivers.map((r) => {
      let pts = flat(r.line);
      if (pts[1] > pts[pts.length - 1]) {            // make every reach run north to south, so it draws downstream
        const f = new Float32Array(pts.length);
        for (let i = 0; i < pts.length; i += 2) { f[i] = pts[pts.length - 2 - i]; f[i + 1] = pts[pts.length - 1 - i]; }
        pts = f;
      }
      return { name: r.name, main: r.name === "Rio Grande", pts };
    }),
    counties: HG.texas.map((c) => {
      const rings = c.rings.map(flat), box = boxOf(rings);
      return { c, fips: c.fips, name: c.name, cls: c.dm == null ? 0 : c.dm, rings, box, xy: [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2], river: U.riverByFips[c.fips] || null };
    }),
    districts: HG.districts.map((d, i) => { const rings = d.rings.map(flat), box = boxOf(rings); return { d, i, rings, box, size: (box[2] - box[0]) * (box[3] - box[1]) }; }),
    lakes: HG.lakes.map((l) => ({ name: l.name, pct: l.pct, xy: project(l.lon, l.lat) })),
    cities: CITIES.map(([name, lon, lat]) => ({ name, xy: project(lon, lat) })),
  };
  const LEVELS = HG.levels;                                  // Low, Watch, Inspect first, Drain, Unknown soil
  G.canals = U.canals.map((c) => {
    const pts = flat(c.line);
    return { c, pts, box: boxOf([pts]), level: Math.max(0, LEVELS.indexOf(c.level)),
             soilClass: c.rate == null ? 2 : c.rate >= 7.48 ? 1 : 0 };   // 0 tight soil, 1 leaky soil, 2 unknown
  }).sort((a, b) => a.box[0] - b.box[0]);                    // west to east, the order the scan reveals them
  G.canals.forEach((s, i) => { s.order = i / G.canals.length; });
  const segOf = new Map(G.canals.map((s) => [s.c.id, s]));
  const FOCUS = G.counties.filter((c) => c.river).sort((a, b) => a.xy[0] - b.xy[0]);   // river counties, upstream to downstream
  FOCUS.forEach((c, i) => { c.rank = i; });
  const TXBOX = boxOf(G.texas);
  const VIEW = { us: boxOf(G.states), texas: TXBOX, corridor: llBox(-106.8, 25.7, -97.0, 32.1), valley: llBox(-98.75, 25.8, -97.1, 26.75),
                 maverick: llBox(-100.75, 28.35, -100.2, 28.95), elpaso: llBox(-106.7, 31.1, -105.3, 32.05) };
  // Where the Lower Valley's districts are: the view the Simulation step opens on to pick them.
  // (A district counts if its box touches the Lower Valley view.)
  const inValley = G.districts.filter((d) => d.box[2] >= VIEW.valley[0] && d.box[0] <= VIEW.valley[2] && d.box[3] >= VIEW.valley[1] && d.box[1] <= VIEW.valley[3]);
  if (inValley.length) VIEW.districts = boxOf([].concat(...inValley.map((d) => d.rings)));
  else VIEW.districts = VIEW.valley;
  // The three canal networks, named as a whole when the map is too far out to name canals.
  const NETWORKS = [["El Paso Valley", ["48141", "48229"], 14, -34], ["Eagle Pass", ["48323", "48271", "48465"], 16, 26],
                    ["Lower Rio Grande Valley", ["48061", "48215", "48489", "48427"], -250, 44]].map(([name, fips, dx, dy]) => {
    const segs = G.canals.filter((s) => fips.indexOf(s.c.fips) >= 0), b = boxOf(segs.map((s) => s.pts));
    return { name, km: segs.reduce((t, s) => t + s.c.km, 0), n: segs.length, xy: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], dx, dy };
  });
  // Named canals: every segment that shares a name in one county counts as one canal (for labels).
  const NAMED = (() => {
    const by = new Map();
    for (const s of G.canals) {
      if (s.c.name === "Unnamed canal") continue;
      const k = s.c.name + "|" + s.c.fips;
      if (!by.has(k)) by.set(k, { name: s.c.name, km: 0, segs: [] });
      const g = by.get(k); g.km += s.c.km; g.segs.push(s);
    }
    return [...by.values()].map((g) => { g.box = boxOf(g.segs.map((s) => s.pts)); g.segs.sort((a, b) => b.c.km - a.c.km); return g; }).sort((a, b) => b.km - a.km);
  })();
  // A coarse grid over the canals, so finding the canal under the mouse is quick.
  const CELL = 4, grid = new Map();
  for (const s of G.canals) for (let gx = Math.floor(s.box[0] / CELL); gx <= Math.floor(s.box[2] / CELL); gx++) for (let gy = Math.floor(s.box[1] / CELL); gy <= Math.floor(s.box[3] / CELL); gy++) {
    const k = gx + "," + gy; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(s);
  }

  const fmt = (n, d) => U.num(n, d);
  const ease = { io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), out: (t) => 1 - Math.pow(1 - t, 4), lin: (t) => t };
  const rgba = (hex, a) => "rgba(" + parseInt(hex.slice(1, 3), 16) + "," + parseInt(hex.slice(3, 5), 16) + "," + parseInt(hex.slice(5, 7), 16) + "," + a + ")";

  function create(opt) {
    const stage = opt.stage, canvas = opt.canvas, ctx = canvas.getContext("2d");
    const hud = opt.hud, tip = opt.tip, coords = opt.coords;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cam = { x: 0, y: 0, k: 1 };
    // Layer strengths. The scan animates these; after the scan they all sit at their end values.
    const S = { us: 0.2, dots: 0, sweep: -1, tx: 1, fill: 1, scanX: -1, rivers: 1, canals: 1, soil: 0, lev: 1, risk: 1, lakes: 1, reticle: 0, pulse: 0 };
    // What platform.js asked for: see set() below.
    // pick is the Simulation step's "choose districts" mode. In it, sel is the Set of chosen
    // district numbers, ok the Set that can be chosen, and solo the Set that can only run alone.
    const want = { mode: "now", scope: -1, funded: null, county: null, canal: null, lakes: null, pick: false, sel: null, ok: null, solo: null };
    let W = 0, H = 0, dpr = 1, kTexas = 1, hover = null, scanning = false, skip = false, flying = 0, lastNow = 0, dragFrom = null;

    /* Every colour comes from the stylesheet, so dark and light themes share this one drawing routine. */
    const C = {}, DCOL = [], SOILCOL = [];
    let SERIF = "";
    function readTheme() {
      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      Object.assign(C, { river: css("--river"), Low: css("--low"), Watch: css("--watch"), "Inspect first": css("--inspect"), Drain: css("--drain"),
        "Unknown soil": css("--unknown"), Warning: css("--warning"), text: css("--ink"), muted: css("--muted"), rule: css("--line"), map: css("--map"),
        casing: css("--casing"), flow: css("--flow"), hl: css("--hl"), cline: css("--cline"), fund: css("--fund") });
      DCOL.splice(0, 9, css("--dm0"), css("--dm1"), css("--dm2"), css("--dm3"), css("--dm4"), css("--dm5"));
      SOILCOL.splice(0, 9, C.Low, C["Inspect first"], C["Unknown soil"]);
      SERIF = css("--serif");
    }
    readTheme();

    /* ---------- Camera ---------- */
    /* A fitted view is centred on the stage, except that while the legend is shown (bottom left,
       wide screens) the picture moves right by up to 48 px, and only by the width it has to spare,
       so the legend does not cover the Amistad marker and nothing is cut off on the right. */
    const legendShown = () => { const l = stage.querySelector("#legend"); return !!(l && l.getClientRects().length); };
    function fit(box, pad) {
      pad = pad || 0.9;
      const k = Math.min(W / (box[2] - box[0]), H / (box[3] - box[1])) * pad;
      const bias = legendShown() ? Math.min(48, Math.max(0, (W - (box[2] - box[0]) * k) / 2)) : 0;
      return { x: (box[0] + box[2]) / 2 - bias / k, y: (box[1] + box[3]) / 2, k };
    }
    function resize() {
      const r = stage.getBoundingClientRect(), first = W === 0, old = kTexas;
      if (!r.width || !r.height) return;
      W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      kTexas = fit(TXBOX).k;
      if (first) Object.assign(cam, fit(TXBOX)); else cam.k *= kTexas / old;
    }
    const toWorld = (sx, sy) => [(sx - W / 2) / cam.k + cam.x, (sy - H / 2) / cam.k + cam.y];
    const toScreen = (x, y) => [(x - cam.x) * cam.k + W / 2, (y - cam.y) * cam.k + H / 2];
    const world = () => ctx.setTransform(cam.k * dpr, 0, 0, cam.k * dpr, (W / 2 - cam.x * cam.k) * dpr, (H / 2 - cam.y * cam.k) * dpr);
    const screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* ---------- Drawing helpers ---------- */
    function path(pts, frac) {
      const n = Math.max(2, Math.floor((pts.length / 2) * (frac == null ? 1 : frac))) * 2;
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < n; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    }
    function stroke(lines, color, px, alpha, frac) {
      if (alpha <= 0.003 || !lines.length) return;
      ctx.beginPath(); for (const l of lines) path(l, frac);
      ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = px / cam.k; ctx.stroke();
    }
    // Labels never overlap: each one claims a box, and later labels that collide are skipped.
    let taken = [];
    const widths = new Map();
    function label(text, x, y, color, size, o) {
      o = o || {};
      const s = toScreen(x, y), font = (o.weight || 500) + " " + size + "px " + SERIF, key = font + text;
      ctx.font = font;
      if (!widths.has(key)) widths.set(key, ctx.measureText(text).width);
      const w = widths.get(key), ax = o.align === "left" ? s[0] + (o.dx || 0) : s[0] - w / 2, cy = s[1] + (o.dy || 0);
      const box = [ax - 2, cy - size / 2 - 1, ax + w + 2, cy + size / 2 + 1];
      if (box[2] < 0 || box[0] > W || box[3] < 0 || box[1] > H) return false;
      if (!o.force) for (const t of taken) if (box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1]) return false;
      taken.push(box);
      ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.lineWidth = 3; ctx.strokeStyle = C.map; ctx.strokeText(text, ax, cy); ctx.fillStyle = color; ctx.fillText(text, ax, cy);
      return true;
    }
    // How far the Texas scan front has passed a county: 0 not reached, 1 fully resolved.
    const reached = (c) => (S.scanX < 0 ? S.fill : Math.max(0, Math.min(1, (S.scanX - c.xy[0]) / 60)));

    function graticule() {   // lines of latitude and longitude, labelled where they leave the frame
      const span = W / cam.k, step = span > 2500 ? 5 : span > 900 ? 2 : span > 350 ? 1 : span > 120 ? 0.5 : span > 45 ? 0.2 : 0.1;
      const a = unproject(...toWorld(0, H)), b = unproject(...toWorld(W, 0)), c = unproject(...toWorld(0, 0)), d = unproject(...toWorld(W, H));
      const w = Math.min(a[0], c[0]), e = Math.max(b[0], d[0]), s = Math.min(a[1], d[1]), n = Math.max(b[1], c[1]);
      const marks = [];
      world(); ctx.beginPath();
      for (let lon = Math.ceil(w / step) * step; lon <= e; lon += step) {
        let prev = null;
        for (let i = 0; i <= 24; i++) { const p = project(lon, s + ((n - s) * i) / 24); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); const q = toScreen(p[0], p[1]); if (prev && prev[1] > H - 12 && q[1] <= H - 12) marks.push([Math.abs(lon).toFixed(step < 1 ? 1 : 0) + "°W", q[0], H - 9]); prev = q; }
      }
      for (let lat = Math.ceil(s / step) * step; lat <= n; lat += step) {
        let prev = null;
        for (let i = 0; i <= 24; i++) { const p = project(w + ((e - w) * i) / 24, lat); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); const q = toScreen(p[0], p[1]); if (prev && prev[0] < 8 && q[0] >= 8) marks.push([lat.toFixed(step < 1 ? 1 : 0) + "°N", 24, q[1]]); prev = q; }
      }
      ctx.strokeStyle = C.rule; ctx.globalAlpha = 0.34 * S.tx; ctx.lineWidth = 0.6 / cam.k; ctx.stroke();
      screen(); ctx.font = "11px " + SERIF; ctx.fillStyle = C.muted; ctx.globalAlpha = 0.6 * S.tx; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const [t, x, y] of marks) if ((x > 340 || y < H - 190) && x < W - 150 && y > 64) ctx.fillText(t, x, y);
    }
    function scaleBar() {
      const target = 110 / cam.k, nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a)), px = nice * cam.k, x = W - 70 - px, y = H - 26;
      ctx.globalAlpha = 0.8 * S.tx; ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.lineTo(x + px, y - 4); ctx.stroke();
      ctx.font = "11px " + SERIF; ctx.fillStyle = C.muted; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(nice + " km", x + px / 2, y - 9);
    }

    /* ---------- One frame ---------- */
    function draw(now) {
      screen(); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H); taken = [];
      const rel = cam.k / kTexas, zoom = Math.min(3.2, Math.max(1, Math.pow(rel, 0.35)));
      const v0 = toWorld(0, 0), v1 = toWorld(W, H), inView = (b) => b[2] >= v0[0] && b[0] <= v1[0] && b[3] >= v0[1] && b[1] <= v1[1];
      const inScope = (s) => want.scope < 0 || s.c.district === want.scope;
      ctx.lineJoin = ctx.lineCap = "round"; ctx.setLineDash([]);
      if (S.tx > 0.003) graticule();
      world();

      // The national grid: one dot per county, and state lines. Dots behind the sweep front light up.
      if (S.dots > 0.003) {
        const d = 1.7 / cam.k, front = S.sweep >= 0 ? toWorld(S.sweep * W, 0)[0] : -1e9;
        for (const pass of [0, 1]) {
          ctx.fillStyle = pass ? C.river : C.muted; ctx.globalAlpha = S.dots * (pass ? 0.95 : 0.28); ctx.beginPath();
          for (let i = 0; i < G.dots.length; i += 2) if ((G.dots[i] < front) === !!pass) ctx.rect(G.dots[i] - d / 2, G.dots[i + 1] - d / 2, d, d);
          ctx.fill();
        }
      }
      stroke(G.states, C.muted, 0.8, S.us);

      // Every Texas county. Fill = this week's Drought Monitor class, or the 6-month forecast tier.
      const shown = S.tx > 0.003 ? G.counties.filter((c) => inView(c.box)) : [];
      const picking = !!want.pick;                              // choosing districts: they lead, everything else steps back
      const fillA = Math.max(0.12, 0.5 - 0.12 * Math.log2(Math.max(1, rel))) * (picking ? 0.45 : 1);   // fills thin out as you zoom in, so canals stay readable
      for (const c of shown) {
        const r = reached(c);
        let color = null;
        if (want.mode === "forecast") color = c.river ? C[c.river.tier] : null;
        else if (c.cls > 0) color = DCOL[c.cls];
        if (r > 0.003 && color) { ctx.beginPath(); for (const ring of c.rings) { path(ring); ctx.closePath(); } ctx.fillStyle = color; ctx.globalAlpha = S.tx * r * fillA * (c.river ? 1 : 0.8); ctx.fill(); }
      }
      ctx.beginPath(); for (const c of shown) for (const ring of c.rings) path(ring);
      ctx.strokeStyle = C.cline; ctx.globalAlpha = 0.8 * S.tx; ctx.lineWidth = 0.6 / cam.k; ctx.stroke();
      stroke(G.texas, C.text, 1.4, S.tx * 0.92);

      // The 14 river counties: outline = forecast tier, drawn upstream to downstream during the scan.
      if (S.risk > 0.003) for (const c of FOCUS) {
        const a = Math.max(0, Math.min(1, S.risk * FOCUS.length - c.rank));
        if (a > 0) stroke(c.rings, C[c.river.tier], 2.3, a * S.tx * (picking ? 0.3 : want.scope < 0 ? 1 : 0.45));
      }
      // Choosing districts for the simulation: every district is a shape you can tap.
      //   chosen                 filled in the strong green, with a bright outline
      //   can be chosen          a faint fill and a plain outline
      //   runs alone             the same, with a dashed outline (it draws on a different reservoir)
      //   nothing to seal there  a faint dashed outline and no fill
      if (picking) {
        const kindOf = (d) => (want.sel && want.sel.has(d.i) ? "on" : want.ok && want.ok.has(d.i) ? "can" : want.solo && want.solo.has(d.i) ? "solo" : "no");
        const here = G.districts.filter((d) => inView(d.box)), of = (kind) => [].concat(...here.filter((d) => kindOf(d) === kind).map((d) => d.rings));
        // Each district is filled on its own. (Filled together, the ground two neighbours share would be left bare.)
        const fill = (d, color, alpha) => { ctx.beginPath(); for (const ring of d.rings) { path(ring); ctx.closePath(); } ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.fill("evenodd"); };
        for (const d of here) { const kind = kindOf(d); if (kind === "can" || kind === "solo") fill(d, C.text, 0.1); }
        for (const d of here) if (kindOf(d) === "on") fill(d, C.Low, 0.62);
        ctx.setLineDash([3 / cam.k, 4 / cam.k]); stroke(of("no"), C.muted, 0.8, 0.4);
        ctx.setLineDash([7 / cam.k, 4 / cam.k]); stroke(of("solo"), C.text, 1.1, 0.7);
        ctx.setLineDash([]); stroke(of("can"), C.text, 1.1, 0.7);
        stroke(of("on"), C.map, 4, 0.9); stroke(of("on"), C.Low, 2, 1);
        if (hover && hover.district) { stroke(hover.district.rings, C.map, 5.5, 0.9); stroke(hover.district.rings, C.hl, 2.4, 1); }   // the one under the pointer
      } else if (S.lev > 0.3 && rel > 1.6) {
        ctx.setLineDash([4 / cam.k, 3 / cam.k]);
        stroke([].concat(...G.districts.filter((d) => d.i !== want.scope && inView(d.box)).map((d) => d.rings)), C.muted, 1, 0.55 * S.lev);
        ctx.setLineDash([]);
      }
      if (want.scope >= 0) { const d = G.districts[want.scope]; stroke(d.rings, C.map, 5, 0.9); stroke(d.rings, C.hl, 2.2, 1); }
      if (want.county) { const c = G.counties.find((x) => x.fips === want.county); if (c) { stroke(c.rings, C.hl, 4.2, 0.9); stroke(c.rings, c.river ? C[c.river.tier] : C.muted, 2, 1); } }

      // Rivers, with a moving dash on the main stem to show which way the water runs.
      const side = G.rivers.filter((r) => !r.main).map((r) => r.pts), main = G.rivers.filter((r) => r.main).map((r) => r.pts);
      stroke(side, C.river, 1.2 * zoom, 0.5 * Math.min(1, S.rivers * 1.5), S.rivers);
      stroke(main, C.casing, 5.2 * zoom, Math.min(1, S.rivers * 1.5), S.rivers);
      stroke(main, C.river, 3 * zoom, Math.min(1, S.rivers * 1.5), S.rivers);
      if (!reduced && S.rivers > 0.99) {
        ctx.setLineDash([7 / cam.k, 17 / cam.k]); ctx.lineDashOffset = -((now || 0) * 0.02) / cam.k;
        stroke(main, C.flow, 1.1 * zoom, 0.7); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      }

      // Canals. During the scan: plain water, then soil class, then the final priority class.
      // With a budget plan on screen: the funded canals glow and the rest step back.
      if (S.canals > 0.003) {
        const seen = G.canals.filter((s) => s.order <= S.canals && inView(s.box));
        const mine = seen.filter(inScope), others = want.scope < 0 ? [] : seen.filter((s) => !inScope(s));
        stroke(others.map((s) => s.pts), C.muted, 0.6 * zoom, 0.3);
        const aPlain = (1 - S.soil) * (1 - S.lev), aSoil = S.soil * (1 - S.lev);
        if (aPlain > 0.003) stroke(mine.map((s) => s.pts), C.river, 0.8 * zoom, 0.7 * aPlain);
        if (aSoil > 0.003) [0, 2, 1].forEach((k) => { ctx.setLineDash(k === 2 ? [3 / cam.k, 3 / cam.k] : []); stroke(mine.filter((s) => s.soilClass === k).map((s) => s.pts), SOILCOL[k], (k === 1 ? 1.2 : 0.75) * zoom, aSoil * 0.9); });
        ctx.setLineDash([]);
        if (picking) stroke(mine.map((s) => s.pts), C.muted, 0.5 * zoom, 0.38 * S.lev);   // canals stay, as thin grey lines
        else if (S.lev > 0.003) {
          if (want.funded) {
            stroke(mine.filter((s) => !want.funded.has(s.c.id)).map((s) => s.pts), C.muted, 0.7 * zoom, 0.45 * S.lev);
            const paid = mine.filter((s) => want.funded.has(s.c.id)).map((s) => s.pts);
            stroke(paid, C.fund, 5 * zoom, 0.22 * S.lev); stroke(paid, C.fund, 2 * zoom, S.lev);
          } else {
            const width = [0.7, 0.9, 2.1, 0.7, 0.7];            // Inspect first is drawn thickest
            [0, 4, 3, 1, 2].forEach((i) => {
              const lines = mine.filter((s) => s.level === i).map((s) => s.pts);
              ctx.setLineDash(i === 4 ? [3 / cam.k, 3 / cam.k] : []);
              if (i === 2 && S.pulse > 0.003) stroke(lines, C.hl, (width[i] + 5 * S.pulse) * zoom, 0.55 * S.pulse * S.lev);
              stroke(lines, C[LEVELS[i]], width[i] * zoom, S.lev * (i === 2 ? 1 : 0.82));
            });
            ctx.setLineDash([]);
          }
        }
      }
      for (const s of [want.canal != null ? segOf.get(want.canal) : null, hover && hover.canal]) if (s) { stroke([s.pts], C.hl, 5.2 * zoom, 0.95); stroke([s.pts], want.funded && want.funded.has(s.c.id) ? C.fund : C[LEVELS[s.level]], 2.4 * zoom, 1); }
      if (S.scanX >= 0) {   // the Texas scan front: a bright line with a soft glow behind it
        const w = 46, g = ctx.createLinearGradient(S.scanX - w, 0, S.scanX, 0);
        g.addColorStop(0, rgba(C.river, 0)); g.addColorStop(1, rgba(C.river, 0.22));
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(S.scanX - w, TXBOX[1] - 30, w, TXBOX[3] - TXBOX[1] + 60);
        ctx.fillStyle = C.river; ctx.fillRect(S.scanX - 1 / cam.k, TXBOX[1] - 30, 2 / cam.k, TXBOX[3] - TXBOX[1] + 60);
      }

      /* ----- From here on, screen pixels: markers and labels ----- */
      screen(); ctx.globalAlpha = 1;
      if (S.lakes > 0.003) for (const r of G.lakes) {   // reservoirs as round storage gauges
        const s = toScreen(r.xy[0], r.xy[1]), pct = want.lakes && want.lakes[r.name] != null ? want.lakes[r.name] : r.pct;
        if (s[0] < -40 || s[0] > W + 40 || s[1] < -40 || s[1] > H + 40) continue;
        ctx.globalAlpha = Math.min(1, S.lakes * 2); ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.arc(s[0], s[1], 11, 0, 7); ctx.fillStyle = C.map; ctx.fill(); ctx.strokeStyle = C.rule; ctx.stroke();
        ctx.beginPath(); ctx.arc(s[0], s[1], 11, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * 2 * Math.PI * S.lakes); ctx.strokeStyle = C.river; ctx.stroke();
        taken.push([s[0] - 14, s[1] - 14, s[0] + 14, s[1] + 14]);
        label(r.name + " " + fmt(pct * S.lakes, 1) + "% full", r.xy[0], r.xy[1], C.text, 12.5, { align: "left", dx: 18, weight: 600, force: true, alpha: Math.min(1, S.lakes * 2) });
      }
      if (S.tx > 0.5 && !(scanning && S.rivers < 0.9)) {
        for (const c of G.cities) { const s = toScreen(c.xy[0], c.xy[1]); if (s[0] < 0 || s[0] > W || s[1] < 0 || s[1] > H) continue; ctx.globalAlpha = 0.95; ctx.fillStyle = C.text; ctx.fillRect(s[0] - 2.5, s[1] - 2.5, 5, 5); taken.push([s[0] - 4, s[1] - 4, s[0] + 4, s[1] + 4]); label(c.name, c.xy[0], c.xy[1], C.text, 11.5, { align: "left", dx: 7, alpha: 0.95 }); }
        const named = new Set();
        for (const r of [...G.rivers].sort((a, b) => b.pts.length - a.pts.length)) {
          if (!r.name || named.has(r.name) || (!r.main && rel > 6)) continue;
          const m = Math.floor(r.pts.length / (r.main ? 3.1 : 4)) * 2;
          if (label(r.name, r.pts[m], r.pts[m + 1], C.river, r.main ? 14 : 11.5, { dy: -12, weight: r.main ? 650 : 500, alpha: r.main ? 1 : 0.8 })) named.add(r.name);
        }
      }
      if (S.tx > 0.5) {   // county names: river counties first, then every other county that fits
        const size = Math.max(10.5, Math.min(15, 10.5 * Math.pow(rel, 0.3)));
        for (const c of FOCUS) if (inView(c.box)) label(c.name, c.xy[0], c.xy[1], C.text, size + 1.5, { weight: 650, force: rel > 1.5 && rel < 30 });
        for (const c of shown) if (!c.river) label(c.name, c.xy[0], c.xy[1], C.muted, size, { alpha: 0.5 + 0.4 * reached(c) });
        if (rel > 2.2 && !want.pick) for (const c of FOCUS) if (S.risk * FOCUS.length - c.rank >= 1 && inView(c.box)) label("6-month chance " + U.pct(c.river.pSeason), c.xy[0], c.xy[1], C[c.river.tier], size, { dy: size + 4 });
        label("MEXICO", ...project(-102.6, 27.9), C.muted, 12, { alpha: 0.45 }); label("Gulf of Mexico", ...project(-95.4, 27.2), C.river, 12, { alpha: 0.5 });
      }
      if (S.canals > 0.9 && !want.pick && !(scanning && S.rivers < 0.9)) {   // canal labels (left out while choosing districts): networks from far away, each canal by name up close
        if (rel < 3.2) for (const n of NETWORKS) label(n.name + ": " + fmt(n.n) + " canal segments, " + fmt(n.km) + " km", n.xy[0], n.xy[1], C.river, 14.5, { align: "left", dx: n.dx, dy: n.dy, weight: 700, force: true });
        else {
          let n = 0;
          const minKm = rel > 40 ? 0 : rel > 14 ? 2 : 6;
          for (const g of NAMED) {
            if (n > 90) break;
            if (g.km < minKm || !inView(g.box)) continue;
            const s = g.segs.find((x) => inView(x.box)); if (!s) continue;
            const m = Math.floor(s.pts.length / 4) * 2;
            if (label(g.name, s.pts[m], s.pts[m + 1], want.funded ? C.text : C[LEVELS[s.level]], rel > 14 ? 13.5 : 12.5, { dy: -9, weight: 700 })) n++;
          }
        }
      }
      ctx.globalAlpha = 1;
      if (S.tx > 0.5) scaleBar();
      if (S.sweep >= 0 && S.sweep <= 1) {   // the national sweep front
        const x = S.sweep * W, g = ctx.createLinearGradient(x - 160, 0, x, 0);
        g.addColorStop(0, rgba(C.river, 0)); g.addColorStop(1, rgba(C.river, 0.16));
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - 160, 0, 160, H); ctx.fillStyle = C.river; ctx.fillRect(x - 1, 0, 2, H);
      }
      if (S.reticle > 0.003) {   // corner brackets closing in on Texas
        const b = TXBOX, grow = 1.06 * (1 + (1 - S.reticle) * 0.5), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
        const p0 = toScreen(cx + (b[0] - cx) * grow, cy + (b[1] - cy) * grow), p1 = toScreen(cx + (b[2] - cx) * grow, cy + (b[3] - cy) * grow), a = Math.min(26, (p1[0] - p0[0]) / 5);
        ctx.globalAlpha = Math.min(1, S.reticle * 1.4); ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.beginPath();
        for (const [x, y, dx, dy] of [[p0[0], p0[1], 1, 1], [p1[0], p0[1], -1, 1], [p0[0], p1[1], 1, -1], [p1[0], p1[1], -1, -1]]) { ctx.moveTo(x + dx * a, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * a); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    /* ---------- Animation: tweens move numbers smoothly from one value to another ---------- */
    const PACE = 0.5;                       // 1 is the long cut; smaller is quicker
    const tweens = new Set();
    function frame(now) {
      for (const t of [...tweens]) t(now);
      if (scanning && !skip && !reduced && !flying && S.tx > 0.9) cam.k *= Math.pow(1.000035, Math.min(50, now - lastNow));   // slow push-in while a shot holds
      lastNow = now;
      if (W && stage.offsetParent !== null) draw(now);       // skip drawing while the map is hidden
      requestAnimationFrame(frame);
    }
    function tween(obj, to, ms, fn, onStep) {
      fn = fn || ease.io;
      return new Promise((done) => {
        const from = {}; for (const k in to) from[k] = obj[k];
        let t0 = null;
        const step = (now) => {
          if (t0 === null) t0 = now;
          const u = skip || reduced ? 1 : Math.min(1, (now - t0) / (scanning ? ms * PACE : ms)), e = fn(u);
          for (const k in to) obj[k] = from[k] + (to[k] - from[k]) * e;
          if (onStep) onStep(e);
          if (u >= 1) { tweens.delete(step); done(); }
        };
        tweens.add(step);
      });
    }
    const wait = (ms) => new Promise((r) => (skip || reduced ? r() : setTimeout(r, ms * PACE)));
    function fly(box, ms, pad) {   // zoom is interpolated on a log scale so the push-in feels even
      const t = fit(box, pad), from = { x: cam.x, y: cam.y, k: cam.k }, m = { u: 0 };
      flying++;
      return tween(m, { u: 1 }, ms || 1100, ease.io, (e) => { cam.k = from.k * Math.pow(t.k / from.k, e); cam.x = from.x + (t.x - from.x) * e; cam.y = from.y + (t.y - from.y) * e; }).then(() => { flying--; });
    }
    /* The box that frames the current scope: one district, or all of Texas. */
    function scopeBox() {
      if (want.scope < 0) return TXBOX;
      const b = G.districts[want.scope].box, m = Math.max(4, (b[2] - b[0]) * 0.18, (b[3] - b[1]) * 0.18);
      return [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
    }

    /* ---------- The scan ---------- */
    function say(phase, sub) { hud.phase.textContent = phase; hud.line1.textContent = sub || ""; hud.line2.textContent = ""; }
    const live = (text) => { hud.line2.textContent = text; };
    // A smooth curve through the river counties, for the flight downstream.
    function along(pts, t) {
      const n = pts.length - 1, i = Math.min(n - 1, Math.floor(t)), u = t - i, a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(n, i + 2)];
      const cr = (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u * u + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u * u * u);
      return [cr(0), cr(1)];
    }
    async function runScan() {
      if (scanning) return;
      // The whole scan runs at about a third of its original length (roughly 20 seconds).
      const Q = 0.32, tw = (o, to, ms, e, cb) => tween(o, to, ms * Q, e, cb), fl = (box, ms, x) => fly(box, ms * Q, x), wt = (ms) => wait(ms * Q);
      scanning = true; skip = false; hover = null; tip.classList.remove("on");
      document.body.classList.add("scanning");
      const nTexas = G.counties.length, mine = G.canals.filter((s) => want.scope < 0 || s.c.district === want.scope);
      const km = mine.reduce((t, s) => t + s.c.km, 0), canalBox = want.scope < 0 ? VIEW.valley : scopeBox();
      const bar = (i) => { opt.bar.style.width = (i / 6) * 100 + "%"; };

      say("Domain", "the mainland United States"); bar(0);
      await Promise.all([tw(S, { rivers: 0, canals: 0, lakes: 0, tx: 0, risk: 0, lev: 0, soil: 0, fill: 0 }, 600), fl(VIEW.us, 1600, 0.9), tw(S, { us: 0.5, dots: 1 }, 1600)]);
      await wt(400); S.sweep = 0;
      await tw(S, { sweep: 1.02 }, 3200, ease.lin, (e) => live(fmt(Math.round(HG.base.nCounties * Math.min(1, e))) + " of " + fmt(HG.base.nCounties) + " counties indexed"));
      S.sweep = -1; live("locking on the Rio Grande reach in Texas");
      await tw(S, { reticle: 1 }, 1100, ease.out); await wt(400);
      await Promise.all([fl(TXBOX, 2600), tw(S, { us: 0.2, dots: 0, tx: 1 }, 2600), tw(S, { reticle: 0 }, 2200)]);

      say("Drought right now", "U.S. Drought Monitor, week of " + U.niceDate(HG.week)); bar(1);
      S.scanX = TXBOX[0] - 10;
      await tw(S, { scanX: TXBOX[2] + 70 }, 5200, ease.lin, () => { const done = G.counties.filter((c) => c.xy[0] < S.scanX); live(done.length + " of " + nTexas + " counties read, " + done.filter((c) => c.cls >= 3).length + " in severe drought or worse"); });
      S.scanX = -1; S.fill = 1; await wt(900);

      say("River and reservoirs", "river lines, and how full the reservoirs are"); bar(2);
      await Promise.all([fl(VIEW.corridor, 2600), tw(S, { rivers: 1 }, 3200, ease.io, (e) => live(Math.round(G.rivers.length * e) + " of " + G.rivers.length + " river reaches traced"))]);
      await tw(S, { lakes: 1 }, 1800, ease.out, (e) => live(G.lakes.map((l) => l.name + " " + fmt(l.pct * e, 1) + "%").join("   ")));
      await wt(900);

      say("Canals", "every mapped canal, ditch and drain"); bar(3);
      await fl(canalBox, 2800);
      await tw(S, { canals: 1 }, 3600, ease.lin, (e) => live(fmt(Math.round(mine.length * e)) + " canal segments, " + fmt(km * e) + " km"));
      await wt(900);

      say("Soil under each canal", "sandy soil leaks fastest; clay holds water"); bar(4);
      await tw(S, { soil: 1 }, 2400, ease.io, (e) => live("seepage rate set for " + fmt(Math.round(mine.filter((s) => s.soilClass !== 2).length * e)) + " segments"));
      await wt(1500);

      // The flight downstream: the camera follows the river while each county's forecast appears.
      say("6-month forecast", "chance of a drought season, county by county"); bar(5);
      const pts = FOCUS.map((c) => c.xy), last = pts.length - 1, m = { u: 0 }, r = 190;
      await fl([pts[0][0] - r, pts[0][1] - r * 0.6, pts[0][0] + r, pts[0][1] + r * 0.6], 2400, 1);
      flying++;
      await tw(m, { u: 1 }, 9000, ease.io, (e) => {
        const t = e * last, c = FOCUS[Math.round(t)]; const p = along(pts, t); cam.x = p[0]; cam.y = p[1]; S.risk = (t + 1.2) / FOCUS.length;
        live(c.name + " County: " + U.pct(c.river.pSeason) + ", " + c.river.tier);
      });
      flying--; S.risk = 1; await wt(600);

      say("A modelled sealing order", "forecast and soil combined, canal by canal"); bar(6);
      await fl(canalBox, 2600);
      await tw(S, { lev: 1 }, 2200, ease.io, (e) => live(fmt(Math.round(mine.length * e)) + " segments ranked"));
      for (let i = 0; i < 2; i++) { await tw(S, { pulse: 1 }, 500, ease.out); await tw(S, { pulse: 0 }, 700, ease.io); }
      await wt(600);
      await fl(scopeBox(), 2200);
      endScan();
    }
    function endScan() {
      scanning = false; skip = false; S.sweep = S.scanX = -1;
      Object.assign(S, { us: 0.2, dots: 0, tx: 1, fill: 1, rivers: 1, canals: 1, soil: 0, lev: 1, risk: 1, lakes: 1, reticle: 0, pulse: 0 });
      document.body.classList.remove("scanning"); opt.bar.style.width = "0";
      if (opt.onScanEnd) opt.onScanEnd();
    }

    /* ---------- Finding what is under the mouse ---------- */
    function nearestCanal(wx, wy, maxPx) {
      let best = null, bestD = (maxPx / cam.k) ** 2;
      for (const s of grid.get(Math.floor(wx / CELL) + "," + Math.floor(wy / CELL)) || []) {
        if (want.scope >= 0 && s.c.district !== want.scope) continue;
        const p = s.pts;
        for (let i = 0; i < p.length - 2; i += 2) {
          const ax = p[i], ay = p[i + 1], dx = p[i + 2] - ax, dy = p[i + 3] - ay, len = dx * dx + dy * dy;
          const t = len ? Math.max(0, Math.min(1, ((wx - ax) * dx + (wy - ay) * dy) / len)) : 0;
          const d = (wx - ax - t * dx) ** 2 + (wy - ay - t * dy) ** 2;
          if (d < bestD) { bestD = d; best = s; }
        }
      }
      return best;
    }
    function inRing(x, y, r) { let inside = false; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) if ((r[i + 1] > y) !== (r[j + 1] > y) && x < ((r[j] - r[i]) * (y - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) inside = !inside; return inside; }
    /* Is the point inside this district? A point counts as inside when it is inside an odd number
       of the district's rings, so a hole in a district is outside it (the same rule the fill uses). */
    const inDistrict = (d, x, y) => x >= d.box[0] && x <= d.box[2] && y >= d.box[1] && y <= d.box[3] && d.rings.filter((r) => inRing(x, y, r)).length % 2 === 1;
    function pick(sx, sy) {
      const w = toWorld(sx, sy), rel = cam.k / kTexas;
      // When the page is asking the user to pick districts (want.pick), only districts can be
      // tapped, at any zoom: a tap on a canal or on county land inside a district means that
      // district. Where two districts overlap, the smaller one wins, so it can still be reached.
      if (want.pick) {
        const under = G.districts.filter((d) => inDistrict(d, w[0], w[1])).sort((a, b) => a.size - b.size);
        return under.length ? { district: under[0] } : null;
      }
      const canal = rel > 4 ? nearestCanal(w[0], w[1], 7) : null;
      if (canal) return { canal };
      const district = rel > 2.5 ? G.districts.find((d) => d.i !== want.scope && inDistrict(d, w[0], w[1])) : null;
      if (district) return { district };
      const county = G.counties.find((c) => w[0] >= c.box[0] && w[0] <= c.box[2] && w[1] >= c.box[1] && w[1] <= c.box[3] && c.rings.some((r) => inRing(w[0], w[1], r)));
      return county ? { county } : null;
    }
    function showTip(h, sx, sy) {
      const html = opt.tipHtml(h.canal ? { canal: h.canal.c } : h.district ? { district: h.district.i } : { county: h.county.fips });
      if (!html) { tip.classList.remove("on"); return; }
      tip.innerHTML = html; tip.classList.add("on");
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = Math.max(8, Math.min(W - tw - 8, sx + 16)) + "px"; tip.style.top = Math.max(8, Math.min(H - th - 8, sy + 16)) + "px";
    }
    canvas.addEventListener("pointerdown", (e) => {
      if (scanning) return;
      // A finger wobbles more than a mouse, so a touch may move further and still count as a tap.
      dragFrom = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false, slack: e.pointerType === "mouse" ? 4 : 10 };
      try { canvas.setPointerCapture(e.pointerId); } catch (error) { /* not every browser allows it; the tap still works */ }
      // A finger has no hover, so work out what is under the tap here.
      const r = canvas.getBoundingClientRect(); hover = pick(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, ll = unproject(...toWorld(sx, sy));
      coords.textContent = Math.abs(ll[1]).toFixed(3) + "°N  " + Math.abs(ll[0]).toFixed(3) + "°W";
      if (scanning) return;
      if (dragFrom) {
        const dx = e.clientX - dragFrom.x, dy = e.clientY - dragFrom.y;
        if (Math.abs(dx) + Math.abs(dy) > dragFrom.slack) { dragFrom.moved = true; canvas.classList.add("drag"); tip.classList.remove("on"); }
        if (dragFrom.moved) { cam.x = dragFrom.cx - dx / cam.k; cam.y = dragFrom.cy - dy / cam.k; return; }
        return;                                                // pressed but not yet a drag: keep what was under the press
      }
      hover = pick(sx, sy);
      // While choosing districts, one that cannot be chosen shows the "no" cursor.
      const blocked = want.pick && hover && !(want.ok && want.ok.has(hover.district.i)) && !(want.solo && want.solo.has(hover.district.i));
      canvas.style.cursor = hover ? (blocked ? "not-allowed" : "pointer") : "";
      if (hover) showTip(hover, sx, sy); else tip.classList.remove("on");
    });
    canvas.addEventListener("pointerup", (e) => {
      if (dragFrom && !dragFrom.moved && hover) {
        if (hover.canal) opt.onCanal(hover.canal.c); else if (hover.district) opt.onDistrict(hover.district.i); else opt.onCounty(hover.county.fips);
      }
      dragFrom = null; canvas.classList.remove("drag");
      if (e.pointerType !== "mouse") { hover = null; tip.classList.remove("on"); }   // a lifted finger is not hovering over anything
    });
    canvas.addEventListener("pointercancel", () => { dragFrom = null; hover = null; canvas.classList.remove("drag"); });   // the browser took the gesture over
    canvas.addEventListener("pointerleave", () => { if (!dragFrom) { hover = null; tip.classList.remove("on"); } });
    function zoomAt(factor, sx, sy) {
      if (sx == null) { sx = W / 2; sy = H / 2; }
      const w = toWorld(sx, sy), k = Math.max(kTexas * 0.4, Math.min(kTexas * 600, cam.k * factor));
      cam.x = w[0] - (sx - W / 2) / k; cam.y = w[1] - (sy - H / 2) / k; cam.k = k;
    }
    canvas.addEventListener("wheel", (e) => { if (scanning) return; e.preventDefault(); const r = canvas.getBoundingClientRect(); zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    canvas.addEventListener("dblclick", (e) => { if (scanning) return; const r = canvas.getBoundingClientRect(); zoomAt(2, e.clientX - r.left, e.clientY - r.top); });

    new ResizeObserver(resize).observe(stage);
    resize();
    requestAnimationFrame(frame);

    return {
      /* Tell the map what to show. Any of: mode ("now" | "forecast"), scope (district number or -1),
         funded (a Set of canal ids, or null), county (fips or null), canal (id or null), lakes ({name: % full}),
         and for choosing districts: pick (true or false), sel, ok and solo (Sets of district numbers). */
      set(changes) { Object.assign(want, changes); },
      fitScope(ms) { return fly(scopeBox(), ms == null ? 1100 : ms); },
      flyTo(name) { if (!scanning && VIEW[name]) fly(VIEW[name], 1100); },
      flyToCanal(id) { const s = segOf.get(id); if (!s) return; const m = Math.max(3, (s.box[2] - s.box[0]), (s.box[3] - s.box[1])); fly([s.box[0] - m, s.box[1] - m, s.box[2] + m, s.box[3] + m], 900); },
      zoom(f) { if (!scanning) zoomAt(f); },
      runScan, skip() { skip = true; }, isScanning: () => scanning,
      readTheme,
    };
  }

  window.HGMap = { create };
})();
