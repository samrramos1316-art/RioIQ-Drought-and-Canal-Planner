/*
  opening.js: the opening of the intro page. A title page, then the Rio Grande from its
  source to the sea, travelled by scrolling.

    Title page   the project's name over a photograph of the river; the map opens through the letter o
    Seven stops  source to sea; at each, one pressure on the river is named, with its source.
                 Each stop shows a real photo of the place, credited under it
    One step up  the camera rises, the Texas reach lights up, and the page hands over to
                 the rest of index.html (the live numbers, the canals, the platform)

  This file holds no forecast and no model output. It is geography (data/river.js) and
  facts from named reports, each linked beside the sentence it supports.

  How it moves: one pinned screen inside a tall section. One animation loop reads how far
  the reader has scrolled and writes positions straight to the page. Scrolling back simply
  runs the same sums in reverse, so there is no separate "backwards" state to get wrong.
*/
(function () {
  "use strict";
  const map = window.HG_RIVER;
  const root = document.getElementById("top");
  if (!map || !root) return;

  /* ---------- The words. Edit them here. ---------- */
  const TITLE = {
    label: "Veritas AI hackathon · AI + Climate",
    // The name, in two parts so the second can be set differently. The map opens out of
    // the letter at `eye` (a position in the first part).
    name: ["Rio", "IQ"], eye: 2,
    line: "A planning tool for the irrigation districts on the Texas Rio Grande. It forecasts drought three and six months ahead, maps every canal, and puts the canals in a modelled order for sealing.",
    cue: "Scroll to follow the river",
    photo: { src: "photos/opening-santa-elena.jpg", what: "Santa Elena Canyon, Big Bend, Texas. Mexico is on the left bank.",
             by: "Carol M. Highsmith, Library of Congress", url: "https://commons.wikimedia.org/wiki/File:The_sheer_faces_of_Santa_Elena_Canyon,_deep_in_Big_Bend_National_Park_in_Brewster_County,_Texas,_frame_the_Rio_Grande_River._Mexico_is_to_the_left,_the_United_States_to_the_right_LCCN2014630611.tif" },
  };
  const WORDS = { pressures: "Pressures on the river", source: "Source", reached: "river counties passed",
                  dry: "Forgotten Reach · often dry" };
  // id ties a chapter to a point on the river in data/river.js. The last one has no point:
  // it is the view of the whole river.
  // photo: [file in photos/, what it shows, who made it and the licence, where it came from].
  // The four Texas ones are the aerial close-ups the platform already uses (public domain, USGS).
  // The other three were downloaded from Wikimedia Commons on 2026-11-15; the link is the file's page there.
  const USGS = "USGS The National Map, public domain", USGS_URL = "https://www.usgs.gov/programs/national-geospatial-program/national-map";
  const CHAPTERS = [
    { id: "source", kicker: "San Juan Mountains, Colorado", title: "The river starts as snow in Colorado",
      body: ["Winter snow in the San Juan Mountains becomes the river’s summer flow. In spring 2026 the snowpack at the headwaters was 13% of normal, and the states on the river expected some of the lowest flows on record."],
      pressure: "Low snowpack", ghost: "SNOW",
      photo: ["opening-source.jpg", "The Rio Grande below Creede, Colorado", "Tim Engleman, CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File:Rio_grande_below_Creede_CO.jpg"],
      source: ["Inside Climate News, April 2026", "https://sourcenm.com/2026/04/22/facing-drought-and-low-snowpack-rio-grande-states-expect-a-challenging-year/"] },
    { id: "middle", kicker: "Albuquerque, New Mexico", title: "In July 2022 the river ran dry in Albuquerque",
      body: ["Five miles of riverbed dried up, for the first time in 40 years. Crews netted endangered silvery minnows out of the last pools."],
      pressure: "A dry riverbed", ghost: "DRY BED",
      photo: ["opening-albuquerque.jpg", "Albuquerque from space, July 2022", "NASA, public domain", "https://commons.wikimedia.org/wiki/File:Rio_Grande_Ariel_July_2022.png"],
      source: ["NASA Earth Observatory; Associated Press", "https://earthobservatory.nasa.gov/images/150244/rio-grande-runs-dry-then-wet"] },
    { id: "butte", kicker: "Elephant Butte Reservoir, New Mexico", title: "The main reservoir is almost empty",
      body: ["Elephant Butte stores the river for the farms downstream. In summer 2026 it held about 1.4% of its capacity, the least since 1971."],
      pressure: "Empty storage", ghost: "1.4%",
      photo: ["opening-elephant-butte.jpg", "Elephant Butte from space, 27 July 2026", "NASA Earth Observatory, public domain", "https://commons.wikimedia.org/wiki/File:Elephant_Butte_Reservoir_Runs_Low_(1277091_-_oli2_20260727_lrg).jpg"],
      source: ["NASA Earth Observatory", "https://science.nasa.gov/earth/earth-observatory/elephant-butte-reservoir-runs-low/"] },
    { id: "pass", kicker: "El Paso · Ciudad Juárez", title: "From El Paso to the sea, the river is the border",
      body: ["Texas is on one bank and Mexico is on the other. Near Fort Quitman, a short way downstream, the U.S. Geological Survey estimates the river carries about 5% of its natural flow."],
      pressure: "Two countries share it", ghost: "BORDER", photo: ["48141-drought.jpg", "El Paso County from the air", USGS, USGS_URL],
      source: ["U.S. Geological Survey, Scientific Investigations Report 2021-5138", "https://pubs.usgs.gov/publication/sir20215138"] },
    { id: "reach", kicker: "Fort Quitman to Presidio, Texas", title: "Below Fort Quitman the river almost disappears",
      body: ["This stretch is called the Forgotten Reach: about 200 miles with little water in it. At Presidio the Rio Conchos flows in from Mexico and supplies most of the river below."],
      pressure: "A stretch with no water", ghost: "FORGOTTEN", photo: ["48229-drought.jpg", "Hudspeth County from the air", USGS, USGS_URL],
      source: ["Inside Climate News, October 2024", "https://insideclimatenews.org/news/23102024/holding-out-hope-drying-rio-grande/"] },
    { id: "lower", kicker: "Lower Rio Grande Valley, Texas", title: "In 2024 the last sugar mill in Texas closed",
      body: ["It had run since 1973 and more than 500 people worked there. The mill said it could not get enough irrigation water. Farms here get their river water through canals."],
      pressure: "Farms short of water", ghost: "HARVEST", photo: ["48215-drought.jpg", "Hidalgo County from the air", USGS, USGS_URL],
      source: ["Texas Public Radio, February 2024", "https://www.tpr.org/environment/2024-02-26/the-last-sugar-mill-in-texas-shuts-down-because-of-ongoing-water-issues-with-mexico"] },
    { id: "gulf", kicker: "Boca Chica, Gulf of Mexico", title: "In 2001 the river did not reach the sea",
      body: ["Its mouth silted shut 500 feet from the shore. It was the first time on record that the Rio Grande stopped short of the Gulf."],
      pressure: "A river that stops short", ghost: "THE GULF", photo: ["48061-drought.jpg", "Cameron County from the air", USGS, USGS_URL],
      source: ["Christian Science Monitor, May 2001", "https://csmonitor.com/2001/0521/p3s1.html"] },
    { id: "texas", kicker: "Where RioIQ works", title: "RioIQ covers the Texas stretch",
      body: ["Fourteen Texas counties sit on the river. Their irrigation districts move its water to farms through canals, and unlined canals leak into the soil.",
             "RioIQ shows each district a modelled order for sealing its canals and what that would cost."],
      ghost: "RIOIQ",
      links: [["See who runs short of water", "#people", ""], ["Open the platform", "app.html", "ghost"]] },   // #people: the stories, the next section down
  ];

  /* ---------- Small helpers ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const station = (id) => map.stations.find((st) => st.id === id);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const two = (n) => String(n).padStart(2, "0");
  /* Build an HTML element: h("p", {class: "x"}, "text" or [children]). Text is never read as HTML. */
  function h(tag, attrs, kids) {
    const node = document.createElement(tag);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    [].concat(kids == null ? [] : kids).forEach((kid) => node.append(kid));
    return node;
  }
  function s(parent, tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    parent.appendChild(node);
    return node;
  }
  function toLatLon(x, y) {
    const k = map.proj.k, lon = ((x - map.proj.tx) / k) * (180 / Math.PI);
    const lat = (2 * Math.atan(Math.exp(-(y - map.proj.ty) / k)) - Math.PI / 2) * (180 / Math.PI);
    return lat.toFixed(2) + "°N  " + Math.abs(lon).toFixed(2) + "°W";
  }

  const N = CHAPTERS.length;
  const STOPS = CHAPTERS.map((c) => (station(c.id) ? station(c.id).frac : 1));
  const LAST_PLACE = N - 2;          // the last chapter that is a place on the river
  const HERO_END = 0.085;            // share of the scroll spent on the title page
  const SPAN = (1 - HERO_END) / N;   // share of the scroll per chapter
  const TRAVEL = 0.5;                // first part of a chapter is the trip; the rest is the stop
  const DROPLETS = 9;
  // The word only swells a little as the map opens through it. (Scaling it up far enough
  // to "fall through" a letter left browsers with a broken copy of it on the way back.)
  const SWELL = 1.9;

  root.style.height = (100 + N * 56) + "svh";   // a little over half a screen of scrolling per chapter

  /* ---------- 1. Build the title page ---------- */
  const first = TITLE.name[0];
  const eye = h("span", {}, first.slice(TITLE.eye, TITLE.eye + 1));     // the letter the map opens from
  const word = h("h1", { class: "word", "aria-label": TITLE.name.join("") }, [
    h("span", { "aria-hidden": "true" }, [first.slice(0, TITLE.eye), eye, first.slice(TITLE.eye + 1)]),
    h("em", { "aria-hidden": "true" }, TITLE.name[1]),
  ]);
  const backdrop = h("img", { class: "backdrop", src: TITLE.photo.src, alt: TITLE.photo.what, width: 1800, height: 1201, decoding: "async" });
  const wordWrap = h("div", { class: "wordWrap" }, [h("p", { class: "lbl titleLabel" }, TITLE.label), word]);
  const rest = h("div", { class: "rest" }, [
    h("p", { class: "line" }, TITLE.line),
    h("p", { class: "credit" }, [TITLE.photo.what + " Photo: ", h("a", { href: TITLE.photo.url, target: "_blank", rel: "noopener" }, TITLE.photo.by), "."]),
    h("p", { class: "lbl cue" }, [h("span", { "aria-hidden": "true" }), TITLE.cue]),
  ]);
  const title = h("div", { class: "title" }, [backdrop, h("div", { class: "shade" }), wordWrap, rest]);

  /* ---------- 2. Build the map ---------- */
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Animated map of the Rio Grande from its headwaters in Colorado, through New Mexico, along the Texas and Mexico border to the Gulf, with its tributaries, reservoirs and the counties along it.");
  const cam = s(svg, "g");
  s(cam, "path", { d: map.mexico, class: "mexico" });
  map.states.forEach((st) => s(cam, "path", { d: st.d, class: "state" + (st.name === "Texas" ? " tx" : "") }));
  map.labels.concat(map.states.map((st) => ({ name: st.name.toUpperCase(), at: st.at })))
    .forEach((l) => s(cam, "text", { x: l.at[0], y: l.at[1], class: "regionName" }, l.name));
  const countyEls = map.counties.map((c, i) => s(cam, "path", { d: c.d, class: "county" + (c.state === "Texas" ? " tx" : ""), "data-i": i }));
  const timed = [];                  // everything that appears when the river reaches it
  const timedAt = (node, frac) => { node.dataset.frac = frac; timed.push(node); return node; };
  map.tributaries.forEach((tr) => timedAt(s(cam, "path", { d: tr.d, pathLength: 1, class: "tributary" }), tr.frac));
  s(cam, "path", { d: map.river, class: "riverGhost" });
  const glowPath = s(cam, "path", { d: map.river, pathLength: 1, class: "riverGlow" });
  const river = s(cam, "path", { d: map.river, pathLength: 1, class: "riverCore" });
  const dry = s(cam, "path", { d: map.dryReach.d, pathLength: 1, class: "riverDry" });
  const drops = [];
  for (let i = 0; i < DROPLETS; i++) {
    const g = s(cam, "g"); g.style.opacity = 0;
    s(g, "circle", { class: "unscale drop", r: 2.2 });
    drops.push(g);
  }
  map.reservoirs.forEach((r) => {
    const g = timedAt(s(cam, "g", { class: "mark reservoir", transform: "translate(" + r.at[0] + " " + r.at[1] + ")" }), r.frac);
    const u = s(g, "g", { class: "unscale" });
    s(u, "rect", { x: -5, y: -5, width: 10, height: 10, transform: "rotate(45)" });
    s(u, "text", { x: 0, y: 22 }, r.name + " Reservoir");
  });
  map.places.forEach((pl) => {
    const g = timedAt(s(cam, "g", { class: "mark place", transform: "translate(" + pl.at[0] + " " + pl.at[1] + ")" }), pl.frac);
    const u = s(g, "g", { class: "unscale" });
    s(u, "circle", { r: 2.6 });
    s(u, "text", { x: 9, y: 4 }, pl.name);
  });
  const reachAt = station("reach").at;
  s(s(timedAt(s(cam, "g", { class: "mark dryLabel", transform: "translate(" + reachAt[0] + " " + reachAt[1] + ")" }), map.dryReach.from + 0.03),
      "g", { class: "unscale" }), "text", { x: 14, y: -12 }, WORDS.dry);
  const head = s(cam, "g");
  const headIn = s(head, "g", { class: "unscale head" });
  s(headIn, "circle", { class: "pulse", r: 18 });
  s(headIn, "circle", { class: "pulse pulse2", r: 18 });
  s(headIn, "circle", { class: "dot", r: 5.5 });

  const ghost = h("p", { class: "ghostWord" });
  const ghostDrift = h("div", { class: "ghostDrift", "aria-hidden": "true" }, ghost);
  const mapLayer = h("div", { class: "mapLayer" }, [ghostDrift, svg]);

  /* ---------- 3. Build the panels, the list of pressures, the readout and the rail ---------- */
  const panels = CHAPTERS.map((c, i) => {
    const kids = [
      h("p", { class: "lbl kick" }, [h("span", {}, two(i + 1) + "/" + two(N)), c.kicker]),
      h("h2", {}, c.title),
    ].concat(c.body.map((text) => h("p", { class: "body" }, text)));
    if (c.source) kids.push(h("p", { class: "src" }, [WORDS.source + ": ",
      h("a", { href: c.source[1], target: "_blank", rel: "noopener" }, c.source[0])]));
    if (c.links) kids.push(h("p", { class: "goLinks" }, c.links.map((l) =>
      h("a", { class: "btn " + l[2], href: l[1] }, l[0]))));
    // Panels that are not showing are hidden from keyboards and screen readers too.
    return h("article", { class: "chapter", inert: "" }, kids);
  });
  const pressureCount = h("b", {}, "00");
  const pressureItems = CHAPTERS.map((c) => h("li", {}, c.pressure || ""));
  const pressures = h("aside", { class: "pressures", "aria-label": WORDS.pressures }, [
    h("p", { class: "lbl" }, [WORDS.pressures + " ", pressureCount]), h("ol", {}, pressureItems)]);
  const coords = h("p", { class: "coords" }), count = h("b", {}, "00"), latest = h("p", { class: "latest" });
  const readout = h("div", { class: "lbl readout", "aria-hidden": "true" }, [
    coords, h("p", {}, [count, "/" + map.counties.length + " " + WORDS.reached]), latest]);
  const railButtons = CHAPTERS.map((c, i) => {
    const b = h("button", { type: "button" }, [
      h("span", { class: "srOnly" }, (i + 1) + ". " + c.title),
      h("span", { class: "railTip", "aria-hidden": "true" }, c.kicker.split(" · ")[0])]);
    b.addEventListener("click", () => goTo(i));
    return b;
  });
  const rail = h("nav", { class: "rail", "aria-label": "Chapters of the journey" }, h("ol", {}, railButtons.map((b) => h("li", {}, b))));
  // A round window onto the ground at the stops we hold an aerial photo for, tied to the
  // river's head by a thin line.
  const lensImgs = CHAPTERS.map((c) => c.photo
    ? h("img", { src: "photos/" + c.photo[0], alt: c.photo[1], loading: "lazy", decoding: "async" }) : null);
  const lensCap = h("figcaption", { class: "lbl" });
  const lens = h("figure", { class: "lens" }, [h("div", { class: "glass" }, lensImgs.filter(Boolean)), lensCap]);
  const leader = h("div", { class: "leader", "aria-hidden": "true" });
  const tip = h("p", { class: "tip" });
  const glow = h("div", { class: "glow", "aria-hidden": "true" });
  const stage = h("div", { class: "pin" }, [title, mapLayer, h("div", { class: "panels" }, panels), leader, lens, pressures, readout, rail, tip,
    glow, h("div", { class: "grain", "aria-hidden": "true" })]);
  root.append(stage);

  /* ---------- 4. The title page arrives (once, not tied to scrolling) ---------- */
  if (!still) {
    const ease = "cubic-bezier(.16,1,.3,1)";
    backdrop.animate([{ opacity: 0, transform: "scale(1.12)" }, { opacity: 1, transform: "scale(1.04)" }], { duration: 2200, easing: ease, fill: "backwards" });
    wordWrap.animate([{ opacity: 0, transform: "translateY(40px)" }, { opacity: 1, transform: "none" }], { duration: 1300, delay: 250, easing: ease, fill: "backwards" });
    rest.animate([{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], { duration: 1100, delay: 700, easing: ease, fill: "backwards" });
  }

  /* ---------- 5. The loop ---------- */
  const total = river.getTotalLength();
  let vw = 0, vh = 0, k0 = 1, kz = 1, anchor = [0, 0], anchorOut = [0, 0];
  let iris = [0, 0], irisReach = 0;      // where the map opens from, and the radius that covers the screen
  let camNow = null, lit = 0, shown = -2, raf = 0, running = false, lastTime = 0;

  function measure() {
    vw = stage.clientWidth; vh = stage.clientHeight;
    const wide = vw >= 1024;
    k0 = wide ? Math.min((vw * 0.5) / map.width, (vh * 0.8) / map.height) : Math.min((vw * 0.94) / map.width, (vh * 0.26) / map.height);
    kz = (wide ? Math.min((vw * 0.5) / map.width, (vh * 0.8) / map.height) : Math.min((vw * 0.94) / map.width, (vh * 0.42) / map.height)) * (wide ? 4.2 : 4.6);
    anchor = wide ? [vw * 0.67, vh * 0.52] : [vw * 0.5, vh * 0.27];
    anchorOut = wide ? anchor : [vw * 0.5, vh * 0.2];            // on a phone the last panel is tall, so the overview sits higher
    // Layout offsets, not on-screen rectangles, so this is right at any moment of the scroll.
    const x = eye.offsetLeft + eye.offsetWidth / 2, y = eye.offsetTop + eye.offsetHeight * 0.62;
    word.style.transformOrigin = x + "px " + y + "px";
    iris = [wordWrap.offsetLeft + word.offsetLeft + x, wordWrap.offsetTop + word.offsetTop + y];
    irisReach = Math.hypot(Math.max(iris[0], vw - iris[0]), Math.max(iris[1], vh - iris[1])) + 4;
    // The lens: beside the river's head, clear of the text.
    const r = wide ? Math.min(150, vh * 0.17) : 54;
    const at = wide ? [vw * 0.5, vh * 0.76] : [vw - r - 16, vh * 0.27 + r + 46];
    lens.style.width = lens.style.height = 2 * r + "px";
    lens.style.left = at[0] - r + "px"; lens.style.top = at[1] - r + "px";
    const dx = at[0] - anchor[0], dy = at[1] - anchor[1], len = Math.hypot(dx, dy);
    leader.style.left = anchor[0] + "px"; leader.style.top = anchor[1] + "px";
    leader.style.width = Math.max(0, len - r) + "px";
    leader.style.transform = "rotate(" + Math.atan2(dy, dx) + "rad)";
  }

  function showChapter(i) {
    const c = CHAPTERS[i];
    stage.classList.toggle("whole", i > LAST_PLACE);
    panels.forEach((p, n) => { p.classList.toggle("on", n === i); p.inert = n !== i; });
    let named = 0;
    pressureItems.forEach((li, n) => {
      const on = n <= i && !!CHAPTERS[n].pressure;
      li.classList.toggle("on", on); li.classList.toggle("now", n === i);
      if (on) named++;
    });
    pressureCount.textContent = two(named);
    pressures.classList.toggle("on", i >= 0 && i <= LAST_PLACE);
    readout.classList.toggle("on", i >= 0);
    rail.classList.toggle("on", i >= 0);
    railButtons.forEach((b, n) => {
      b.className = n === i ? "now" : n < i ? "done" : "";
      if (n === i) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    lensImgs.forEach((img, n) => { if (img) img.classList.toggle("on", n === i); });
    lensCap.replaceChildren();
    if (c && c.photo) lensCap.append(c.photo[1], h("br"), h("a", { href: c.photo[3], target: "_blank", rel: "noopener" }, c.photo[2]));
    // One word, swapped in place. (Keeping the old ones around to fade out stacked a dozen
    // screen-sized words on a fast scroll.)
    ghost.classList.remove("on");
    ghost.textContent = c ? c.ghost : "";
    if (c) { void ghost.offsetWidth; ghost.classList.add("on"); }
  }

  function tick(time) {
    const rect = root.getBoundingClientRect();
    const p = clamp01(-rect.top / (rect.height - vh));

    // 1. Title page: the map opens over it as a circle growing out of a letter.
    const fall = seg(p, 0, HERO_END);
    title.style.visibility = fall >= 1 ? "hidden" : "visible";
    if (fall < 1) {
      const fade = String(1 - seg(fall, 0.02, 0.3));
      rest.style.opacity = fade;
      backdrop.style.scale = String(1 + 0.18 * fall);            // the photo pushes in as the map opens
      word.style.transform = "scale(" + (1 + (SWELL - 1) * (still ? 0 : Math.pow(seg(fall, 0.04, 1), 1.6))) + ")";
    }
    const open = Math.pow(seg(fall, 0.08, 1), 2.2);
    mapLayer.style.clipPath = fall >= 1 ? "none" : "circle(" + (irisReach * open).toFixed(1) + "px at " + iris[0] + "px " + iris[1] + "px)";

    // 2. Which chapter, and how far through it.
    const raw = (p - HERO_END) / SPAN;
    const i = p < HERO_END ? -1 : Math.min(N - 1, Math.floor(raw));
    const u = i < 0 ? 0 : clamp01(raw - i);
    const trip = i <= 0 ? 1 : easeInOut(seg(u, 0, TRAVEL));
    const from = i <= 0 ? 0 : STOPS[i - 1], to = i < 0 ? 0 : STOPS[i];
    const t = lerp(from, to, trip);

    // 3. The river, its head and the water running down it.
    glowPath.style.strokeDashoffset = river.style.strokeDashoffset = String(1 - t);
    dry.style.strokeDashoffset = String(1 - seg(t, map.dryReach.from, map.dryReach.to));
    const pt = river.getPointAtLength(total * t);
    head.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")");
    if (!still && t > 0.002) drops.forEach((el, n) => {
      const along = ((time / 6000 + n / DROPLETS) % 1) * t;
      const d = river.getPointAtLength(total * along);
      el.setAttribute("transform", "translate(" + d.x + " " + d.y + ")");
      const parched = along > map.dryReach.from && along < map.dryReach.to ? 0.15 : 1;   // water thins out through the Forgotten Reach
      el.style.opacity = String(Math.min(1, along * 40, (t - along) * 40) * parched);
    });

    // 4. The camera. It lifts as it travels and settles in close at each stop; after the
    //    sea it rises until the whole river is in view.
    const out = i > LAST_PLACE ? easeInOut(seg(u, 0, 0.6)) : 0;
    const hop = i > 0 && i <= LAST_PLACE ? Math.sin(Math.PI * trip) * Math.min(0.62, 0.3 + (to - from) * 1.6) : 0;
    const arrive = i < 0 ? seg(fall, 0.1, 1) * 0.5 : i === 0 ? 0.5 + seg(u, 0, 0.5) * 0.5 : 1;
    const dive = 1 + 1.4 * (1 - easeOut(arrive));
    const want = { x: lerp(pt.x, map.width / 2, out), y: lerp(pt.y, map.height / 2, out), k: lerp(kz * (1 - hop) * dive, k0, out) };
    const dt = Math.min(200, time - lastTime);
    lastTime = time;
    const follow = still || !camNow ? 1 : 1 - Math.exp(-dt / 95);   // by the clock, so a slow frame does not slow the camera
    camNow = camNow ? { x: lerp(camNow.x, want.x, follow), y: lerp(camNow.y, want.y, follow), k: lerp(camNow.k, want.k, follow) } : want;
    cam.setAttribute("transform", "translate(" + lerp(anchor[0], anchorOut[0], out) + " " + lerp(anchor[1], anchorOut[1], out) +
      ") scale(" + camNow.k + ") translate(" + (-camNow.x) + " " + (-camNow.y) + ")");
    stage.style.setProperty("--k", String(camNow.k));

    // 5. Counties, towns, tributaries and reservoirs appear as the river reaches them.
    const reach = t + 0.006, before = lit;
    while (lit < map.counties.length && t > 0 && map.counties[lit].frac <= reach) countyEls[lit++].classList.add("lit");
    while (lit > 0 && (t === 0 || map.counties[lit - 1].frac > reach)) countyEls[--lit].classList.remove("lit");
    if (lit !== before) {
      count.textContent = two(lit);
      const c = map.counties[lit - 1];
      latest.textContent = c ? c.name + " County, " + c.state : "";
    }
    timed.forEach((el) => el.classList.toggle("lit", t > 0 && Number(el.dataset.frac) <= reach));
    coords.textContent = toLatLon(pt.x, pt.y);

    // 6. The photo window opens once the river has arrived, and the photo drifts while it is read.
    const hasPhoto = i >= 0 && !!CHAPTERS[i].photo;
    const look = hasPhoto ? seg(u, TRAVEL - 0.12, TRAVEL + 0.06) * (1 - seg(u, 0.94, 1)) : 0;
    lens.style.opacity = leader.style.opacity = String(look);
    lens.style.transform = "scale(" + (0.82 + 0.18 * easeOut(look)) + ")";
    if (hasPhoto) lensImgs[i].style.transform = "scale(1.25) translate(" + lerp(4, -4, u) + "%, " + lerp(-3, 3, u) + "%)";

    // 7. The big word behind the map drifts across as the chapter is read.
    ghostDrift.style.transform = "translate3d(" + lerp(5, -9, u) + "vw, 0, 0)";

    if (i !== shown) { shown = i; showChapter(i); }
    if (running) raf = requestAnimationFrame(tick);
  }

  /* Scroll so that chapter i is at rest on screen. Used by the chapter rail. */
  function goTo(i) {
    window.scrollTo({ top: root.offsetTop + (root.offsetHeight - window.innerHeight) * (HERO_END + SPAN * (i + 0.8)) });
  }

  /* ---------- 6. Wiring ---------- */
  cam.addEventListener("pointermove", (ev) => {
    const i = ev.target.dataset && ev.target.dataset.i;
    if (i == null) { tip.style.display = "none"; return; }
    const c = map.counties[i];
    tip.textContent = c.name + " County, " + c.state;
    tip.style.left = ev.clientX + "px"; tip.style.top = ev.clientY + "px"; tip.style.display = "block";
  });
  cam.addEventListener("pointerleave", () => { tip.style.display = "none"; });
  if (!still) window.addEventListener("pointermove", (ev) => {
    const x = (ev.clientX / vw) * 2 - 1, y = (ev.clientY / vh) * 2 - 1;
    backdrop.style.transform = "translate3d(" + (-x * 14) + "px, " + (-y * 10) + "px, 0) scale(1.04)";   // the photo leans away from the pointer
    glow.style.transform = "translate3d(" + (ev.clientX - 260) + "px, " + (ev.clientY - 260) + "px, 0)";
  }, { passive: true });

  // The loop only runs while the opening is on screen.
  new IntersectionObserver((entries) => {
    const on = entries[0].isIntersecting;
    if (on && !running) { running = true; raf = requestAnimationFrame(tick); }
    else if (!on) { running = false; cancelAnimationFrame(raf); tip.style.display = "none"; }
  }).observe(root);
  // Phones fire "resize" whenever the address bar shows or hides, which is every time the
  // reader scrolls back up. Only a real change of size counts.
  window.addEventListener("resize", () => {
    if (stage.clientWidth === vw && stage.clientHeight === vh) return;
    measure(); camNow = null;
  });
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);   // letter positions shift when the display font arrives
})();
