/*
  twin.js: the picture of the simulation. The same district (or group of districts), twice.

      left    DO NOTHING            drawn in grey: nothing is done to the canals
      right   ACT ON THE FORECAST   drawn in green: canals are sealed when the forecast warns

  Both sides get the same reservoir, the same weather and the same weeks. A line divides them.

  HOW TO READ IT (the picture is kept deliberately simple)
    - The first thing to see is the two colours: the grey side is doing nothing, the green side
      is acting. Under each heading is one large figure: crops lost so far, or crops saved so far.
    - Each district shape is a gauge. It fills from the bottom for the share of the water farms
      asked for that reached them this week (grey on the left, green on the right). The brown
      part is water that did not arrive. More fill on the right means sealing got more water through.
    - Canals are thin, quiet lines: red while they leak and white once they are sealed.
    - At the top is the one thing that drives everything: how full the reservoir is.
    - Under each side are two small figures: the share of water arriving, and the water leaked
      or saved, in gallons.

  Every number comes from sim/engine.js. Nothing in the picture is measured in the field.

  window.HGTwin.create({ canvas, stage, onTick }) returns { load, play, pause, seek, playing, readTheme }.
*/
(function () {
  "use strict";
  const GALLONS_PER_ACRE_FOOT = 325851;

  function create(opt) {
    const canvas = opt.canvas, stage = opt.stage, ctx = canvas.getContext("2d");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SECONDS = 34;                       // how long the whole run takes to play
    let W = 0, H = 0, dpr = 1, data = null, at = 0, playing = false, last = 0;
    let shape = null;                         // the districts as flat shapes
    let panels = [];                          // the two drawing areas, rebuilt on resize
    const shown = [1, 1];                     // the fill level drawn on each side (it glides to the real value)
    const C = {};

    function readTheme() {
      const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      Object.assign(C, { map: css("--map"), card: css("--card"), text: css("--ink"), head: css("--head"), muted: css("--muted"),
                         rule: css("--line"), accent: css("--blue"), hl: css("--hl"), low: css("--low"), watch: css("--watch"),
                         warning: css("--warning"), wet: css("--wet"), dry: css("--dry"), idle: css("--idle"), sealed: css("--sealed"), serif: css("--serif"), sans: css("--sans") });
    }
    readTheme();

    /* ---------- The districts as flat shapes ----------
       Longitude and latitude become kilometres east and south of each district's centre.
       One district keeps its real shape. Several are laid out in a grid, each scaled to
       fill its own cell, so small districts stay readable (they are not to scale). */
    function build(d) {
      const flatPart = (part) => {
        let lon0 = 0, lat0 = 0, n = 0;
        part.rings.forEach((r) => r.forEach((p) => { lon0 += p[0]; lat0 += p[1]; n++; }));
        lon0 /= n; lat0 /= n;
        const kx = 111.32 * Math.cos(lat0 * Math.PI / 180), ky = 110.57;
        const flat = (line) => line.map((p) => [(p[0] - lon0) * kx, -(p[1] - lat0) * ky]);
        const rings = part.rings.map(flat); let half = 0;
        rings.forEach((r) => r.forEach((p) => { half = Math.max(half, Math.abs(p[0]), Math.abs(p[1])); }));
        return { rings, half, canals: part.canals.map((c) => ({ pts: flat(c.line), funded: c.funded, ranked: c.ranked })) };
      };
      const parts = d.parts.slice().sort((a, b) => (b.km || 0) - (a.km || 0)).map(flatPart);
      const many = parts.length > 1, cols = Math.ceil(Math.sqrt(parts.length * 0.8));
      const box = [1e9, 1e9, -1e9, -1e9];
      parts.forEach((part, k) => {
        const f = many ? 0.44 / part.half : 1, ox = many ? k % cols : 0, oy = many ? Math.floor(k / cols) : 0;
        const move = (line) => line.map((q) => [q[0] * f + ox, q[1] * f + oy]);
        part.rings = part.rings.map(move);
        part.canals.forEach((c) => { c.pts = move(c.pts); });
        part.top = 1e9; part.bottom = -1e9;                          // how tall this district is, for its gauge
        part.rings.forEach((r) => r.forEach((p) => {
          part.top = Math.min(part.top, p[1]); part.bottom = Math.max(part.bottom, p[1]);
          box[0] = Math.min(box[0], p[0]); box[1] = Math.min(box[1], p[1]); box[2] = Math.max(box[2], p[0]); box[3] = Math.max(box[3], p[1]);
        }));
      });
      return { parts, box };
    }

    /* ---------- Layout: two sides, left and right (one above the other on a phone) ----------
       From the top of the stage down: the page's buttons, the date and the reservoir bar, the two
       sides, one line for the closing sentence, then the page's caption and play bar. */
    function layout() {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      if (!shape) return;
      // top: on a phone the scenario buttons have a row of their own (css/site.css), so everything starts lower.
      // bottom: room for the play bar and, above it, the caption the page puts on the picture (two lines on a phone).
      // line: the strip kept free under the two sides for the closing sentence.
      const narrow = W < 620, top = narrow ? 126 : 112, bottom = narrow ? 96 : 82, line = narrow ? 36 : 40, side = narrow ? 10 : 14;
      const high = H - top - bottom - line;
      const boxes = narrow
        ? [0, 1].map((k) => ({ x: side, y: top + k * (high / 2), w: W - 2 * side, h: high / 2 }))
        : [0, 1].map((k) => ({ x: side + k * ((W - 2 * side) / 2), y: top, w: (W - 2 * side) / 2, h: high }));
      panels = boxes.map((b) => {
        // head: the heading and the large figure. foot: the two small figures.
        // On a phone the districts sit on the left and every figure on the right, so there is no foot.
        const pad = narrow ? 10 : 18, head = narrow ? 30 : 112, foot = narrow ? 8 : 70;
        const mw = narrow ? b.w * 0.4 : b.w - 2 * pad, mh = b.h - head - foot;
        const k = Math.min(mw / (shape.box[2] - shape.box[0]), mh / (shape.box[3] - shape.box[1])) * 0.94;
        const cx = (shape.box[0] + shape.box[2]) / 2, cy = (shape.box[1] + shape.box[3]) / 2, mx = narrow ? pad + mw / 2 : b.w / 2;
        const sx = (x) => (x - cx) * k + mx, sy = (y) => (y - cy) * k + head + mh / 2;     // relative to the side's corner
        const path = (lines, close) => { const p = new Path2D(); lines.forEach((l) => { l.forEach((q, i) => (i ? p.lineTo(sx(q[0]), sy(q[1])) : p.moveTo(sx(q[0]), sy(q[1])))); if (close) p.closePath(); }); return p; };
        const canals = [].concat.apply([], shape.parts.map((part) => part.canals));
        return Object.assign({ narrow, pad, head, foot, mw, mh, line,
          parts: shape.parts.map((part) => ({ path: path(part.rings, true), top: sy(part.top), bottom: sy(part.bottom) })),
          outline: path([].concat.apply([], shape.parts.map((part) => part.rings)), true),
          all: path(canals.filter((c) => c.ranked).map((c) => c.pts)),          // canals the model can rank
          other: path(canals.filter((c) => !c.ranked).map((c) => c.pts)),       // canals with no soil reading
          funded: path(canals.filter((c) => c.funded).map((c) => c.pts)) }, b);
      });
    }
    new ResizeObserver(layout).observe(stage);

    /* ---------- The week being shown ---------- */
    const index = () => Math.min(data.weeks.length - 1, Math.floor(at));
    /* Share of the water farms asked for that reached them. null = outside the irrigation season. */
    function arrives(w, s) { return w.demand > 0 ? Math.max(0, 1 - (s.missing - s.recovered) / w.demand) : null; }

    /* ---------- Words and numbers ---------- */
    function text(s, x, y, size, color, o) {
      o = o || {};
      ctx.font = (o.weight || 400) + " " + size + "px " + (o.serif ? C.serif : C.sans);
      ctx.textAlign = o.align || "left"; ctx.textBaseline = "middle"; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
      ctx.fillStyle = color; ctx.fillText(s, x, y);
    }
    const money = (v) => (v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + " billion" : v >= 1e6 ? "$" + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1) + " million" : "$" + Math.round(v).toLocaleString("en-US"));
    function gallons(acreFeet) {
      const g = acreFeet * GALLONS_PER_ACRE_FOOT;
      return g >= 1e9 ? (g / 1e9).toFixed(g >= 1e10 ? 0 : 1) + " billion gallons" : g >= 1e6 ? Math.round(g / 1e6) + " million gallons" : Math.round(g).toLocaleString("en-US") + " gallons";
    }

    /* One side of the picture. k = 0 is "do nothing" (grey), k = 1 is "act on the forecast" (green). */
    function drawSide(p, k, w, dt) {
      const s = k ? w.right : w.left, sum = k ? w.sumR : w.sumL, share = arrives(w, s), right = k === 1;
      const tone = right ? C.wet : C.idle, off = share == null;        // off: outside the irrigation season
      ctx.save(); ctx.translate(p.x, p.y);
      // The acting side sits on a faint wash of its own green, so the two sides differ before anything is read.
      if (right) { ctx.globalAlpha = 0.1; ctx.fillStyle = C.wet; ctx.fillRect(0, 0, p.w, p.h); }
      // The heading, in large plain words.
      text(right ? "Act on the forecast" : "Do nothing", p.pad, p.narrow ? 15 : 22, p.narrow ? 16 : 22, right ? C.low : C.text, { weight: 600, serif: true });
      if (right && s.sealed) text("canals sealed", p.w - p.pad, p.narrow ? 15 : 22, 12.5, C.low, { weight: 600, align: "right" });

      // 1. Each district is a gauge: filled from the bottom up for the water that arrived, in
      //    this side's colour. The level glides to its new value so it does not jump week to week.
      const want = off ? 1 : share;
      shown[k] = reduced ? want : shown[k] + (want - shown[k]) * Math.min(1, dt * 6);
      for (const part of p.parts) {
        ctx.save(); ctx.clip(part.path, "evenodd");
        const height = part.bottom - part.top, level = part.bottom - height * shown[k];
        ctx.globalAlpha = off ? 0.4 : 1;                             // faded outside the season: fields are resting
        ctx.fillStyle = C.dry; ctx.fillRect(0, part.top - 2, p.w, height + 4);
        ctx.fillStyle = tone; ctx.fillRect(0, level, p.w, part.bottom - level + 2);
        ctx.restore();
      }
      // 2. Canals, kept quiet: thin red lines while they leak, thin white ones once sealed.
      ctx.lineJoin = ctx.lineCap = "round";
      ctx.globalAlpha = 0.16; ctx.strokeStyle = C.map; ctx.lineWidth = 0.5; ctx.stroke(p.other);
      ctx.globalAlpha = off ? 0.2 : 0.42; ctx.strokeStyle = C.warning; ctx.lineWidth = 0.6; ctx.stroke(p.all);
      if (s.sealed) { ctx.globalAlpha = 0.55; ctx.strokeStyle = C.sealed; ctx.lineWidth = 0.6; ctx.stroke(p.funded); }
      // 3. Each district's outline, so every shape can be told apart: heavier and green on the acting side.
      ctx.globalAlpha = 1; ctx.strokeStyle = right ? C.low : C.muted; ctx.lineWidth = right ? 1.8 : 1.1; ctx.stroke(p.outline);

      // 4. The figures. One large one (crops), then two small ones.
      const big = right ? ["Crops saved so far", money(Math.max(0, w.sumL.loss - w.sumR.loss)), C.low] : ["Crops lost so far", money(sum.loss), C.warning];
      const small = [
        [p.narrow ? "Water reaching farms" : "Share of the water farms asked for that arrives", off ? "off season" : Math.round(share * 100) + "%", off ? C.muted : C.text],
        right ? ["Water saved from leaking", gallons(sum.saved), C.low] : ["Water leaked out of canals", gallons(sum.leak), C.warning],
      ];
      if (p.narrow) {
        const x = p.pad + p.mw + 14;                                 // the figures sit to the right of the districts
        text(big[1], x, p.head + 12, 21, big[2], { weight: 600, serif: true }); text(big[0], x, p.head + 32, 11.5, C.muted);
        small.forEach((r, n) => { const y = p.head + 56 + n * 36; text(r[0], x, y, 11.5, C.muted); text(r[1], x, y + 15, 13.5, r[2], { weight: 600 }); });
      } else {
        text(big[1], p.pad, 62, 36, big[2], { weight: 600, serif: true }); text(big[0], p.pad, 92, 13.5, C.muted);
        small.forEach((r, n) => {
          const y = p.h - p.foot + 20 + n * 30;
          ctx.globalAlpha = 1; ctx.fillStyle = C.rule; ctx.fillRect(p.pad, y - 15, p.w - 2 * p.pad, 1);
          text(r[1], p.w - p.pad, y, 15, r[2], { weight: 600, align: "right" });
          // The first label is long. Where it would run into its value, the short form is used.
          const room = p.w - 2 * p.pad - 12 - ctx.measureText(r[1]).width;
          ctx.font = "400 13.5px " + C.sans;
          text(!n && ctx.measureText(r[0]).width > room ? "Water reaching farms" : r[0], p.pad, y, 13.5, C.muted);
        });
      }
      ctx.restore();
    }

    function draw(dt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
      if (!data || !panels.length) return;
      const i = index(), w = data.weeks[i], narrow = panels[0].narrow, y = narrow ? 100 : 78;
      // The driver, at the top: the date, and how full the reservoir is, as a bar with the
      // level marked below which farms start getting less than they asked for.
      const month = new Date(w.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
      text(month, 14, y, narrow ? 20 : 26, C.head, { weight: 600, serif: true });
      const bw = narrow ? W - 150 : Math.min(360, W * 0.34), bx = W - 14 - bw, short = w.pct < data.fullAt;
      ctx.globalAlpha = 1; ctx.fillStyle = C.card; ctx.fillRect(bx, y - 2, bw, 10);
      ctx.fillStyle = short ? C.warning : C.accent; ctx.fillRect(bx, y - 2, bw * Math.max(0, Math.min(1, w.pct / 100)), 10);
      ctx.fillStyle = C.text; ctx.fillRect(bx + bw * data.fullAt / 100, y - 6, 1.5, 18);
      text("Reservoir " + Math.round(w.pct) + "% full" + (short && !narrow ? ": farms get less water" : ""), bx, y - 16, 13.5, short ? C.warning : C.text, { weight: 600 });
      panels.forEach((p, k) => drawSide(p, k, w, dt));
      // The divider between the two sides, and a rule above and below them.
      const a = panels[0], b = panels[1];
      ctx.globalAlpha = 1; ctx.fillStyle = C.muted;
      if (narrow) ctx.fillRect(a.x, b.y - 1, a.w, 2); else ctx.fillRect(b.x - 1, a.y, 2, a.h);
      ctx.fillStyle = C.rule; ctx.fillRect(a.x, a.y, b.x + b.w - a.x, 1); ctx.fillRect(a.x, b.y + b.h, b.x + b.w - a.x, 1);
      // The result, once the run has finished: one sentence on the line kept free under the two sides.
      if (i >= data.weeks.length - 1) {
        // Said as what happened in this one run, not as a saving: the crops kept, and the sealant
        // bill too when it was the larger of the two. The page's caption on the picture says the
        // run is illustrative; it is shown whenever the picture is.
        const kept = w.sumL.loss - w.sumR.loss, spend = w.sumR.spend - w.sumL.spend, none = kept < 1000;
        const label = none ? "In this illustrative run, sealing early kept no measurable amount of crops."
          : "In this illustrative run, sealing early kept " + money(kept) + " of crops" + (spend > kept ? " and cost " + money(spend) + " in sealant." : ".");
        const color = none ? C.muted : spend > kept ? C.warning : C.low;
        // On a phone the sentence is cut in two near its middle, so it can stay at a readable size.
        let lines = [label];
        if (narrow) { const cut = label.lastIndexOf(" ", Math.ceil(label.length / 2) + 4); lines = [label.slice(0, cut), label.slice(cut + 1)]; }
        const widest = () => Math.max.apply(null, lines.map((l) => ctx.measureText(l).width));
        let size = narrow ? 13 : 18;
        ctx.font = "600 " + size + "px " + C.serif;
        while (widest() > W - 2 * 14 && size > 10) { size -= 1; ctx.font = "600 " + size + "px " + C.serif; }   // keep the lines inside the picture
        const ty = b.y + b.h + a.line / 2 + 1;
        lines.forEach((l, n) => text(l, W / 2, ty + (n - (lines.length - 1) / 2) * (size + 3), size, color, { weight: 600, align: "center", serif: true }));
      }
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (data && stage.offsetParent !== null && canvas.offsetParent !== null) {
        if (playing) {
          at = Math.min(data.weeks.length - 1, at + dt * data.weeks.length / SECONDS);
          if (at >= data.weeks.length - 1) playing = false;
          opt.onTick(index(), playing);
        }
        draw(dt);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      /* next: { parts: [{ rings, km, canals: [{ line, ranked, funded }] }], fullAt,
                 weeks: [{ date, pct, demand, left, right, sumL, sumR }] }
         left / right are the engine's weekly rows; sumL / sumR are running totals with
         loss ($), spend ($), saved, recovered and leak (acre-feet). */
      load(next) { data = next; shape = build(next); at = 0; shown[0] = shown[1] = 1; playing = false; layout(); opt.onTick(0, false); },
      play() {
        if (!data) return;
        // People who ask for less motion get the result at once: the last week, with no animation.
        if (reduced) { at = data.weeks.length - 1; playing = false; opt.onTick(index(), false); return; }
        if (at >= data.weeks.length - 1) at = 0; playing = true; opt.onTick(index(), true);   // tell the page at once, so the button reads Pause
      },
      pause() { playing = false; if (data) opt.onTick(index(), false); },
      seek(i) { at = i; if (data) opt.onTick(index(), playing); },
      playing: () => playing,
      readTheme() { readTheme(); layout(); },
    };
  }

  window.HGTwin = { create };
})();
