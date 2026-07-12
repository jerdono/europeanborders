/* Borders — an animated history of Europe & the Mediterranean.
   Geometry: fixed 122-region Voronoi tessellation clipped to the Natural Earth coastline.
   Data: time slices assigning every region to an entity; borders, border age and
   change intensity are computed from the assignments. */

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------------- culture palette ---------------- */
// family: [hue, sat, light] anchors per theme
const FAMILIES = {
  hellenic:          { label: 'Hellenic',        dark: [214, 52, 56] },
  italic:            { label: 'Italic · Romance', dark: [13, 58, 52],  light: [13, 55, 44] },
  celtic:            { label: 'Celtic',          dark: [130, 38, 45] },
  germanic:          { label: 'Germanic',        dark: [42, 55, 55],  light: [42, 52, 46] },
  slavic:            { label: 'Slavic',          dark: [168, 42, 44] },
  baltic:            { label: 'Baltic',          dark: [276, 36, 58] },
  uralic:            { label: 'Uralic',          dark: [322, 45, 55] },
  steppe:            { label: 'Steppe nomad',    dark: [27, 45, 48],  light: [27, 44, 42] },
  turkic:            { label: 'Turkic',          dark: [352, 55, 48] },
  iranic:            { label: 'Iranic',          dark: [84, 35, 48],  light: [84, 33, 41] },
  semitic_levantine: { label: 'Levantine',       dark: [318, 30, 42] },
  arab:              { label: 'Arab · Islamic',  dark: [152, 45, 38] },
  berber:            { label: 'Berber',          dark: [33, 40, 58],  light: [33, 38, 50] },
  egyptian:          { label: 'Egyptian',        dark: [48, 60, 58],  light: [48, 55, 48] },
  anatolian:         { label: 'Anatolian',       dark: [20, 40, 58],  light: [20, 38, 50] },
  caucasian:         { label: 'Caucasian',       dark: [190, 45, 42] },
  pre_ie:            { label: 'Pre-Indo-European', dark: [100, 16, 50] },
  paleo_balkan:      { label: 'Paleo-Balkan',    dark: [262, 25, 52] },
};
function familyHSL(key, th) {
  const [h, s, l] = (FAMILIES[key] || FAMILIES.pre_ie).dark;
  return th === 'dark' ? [h, s, l] : [h, Math.max(s - 6, 10), Math.min(l + 21, 76)];
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
function entityColor(ent, theme, byCulture) {
  let [h, s, l] = familyHSL(ent.culture, theme);
  if (!byCulture) {
    const hs = hashStr(ent.id);
    h += ((hs % 21) - 10);
    s += (((hs >> 5) % 15) - 7);
    l += (((hs >> 9) % 17) - 8);
  }
  if (ent.type !== 'state') { s *= 0.52; l = theme === 'dark' ? l * 0.9 : Math.min(l * 1.06 + 3, 80); }
  return `hsl(${h} ${clamp(s, 8, 75)}% ${clamp(l, 20, 78)}%)`;
}

const THEME_CANVAS = {
  dark: {
    sea: '#0c1522', seaEdge: '#080e18', landNeutral: '#232c3d', coast: 'rgba(190,208,240,.34)',
    river: 'rgba(122,162,222,.30)', lake: '#0c1522', ink: '#e9e3d3', inkSoft: 'rgba(233,227,211,.72)',
    halo: 'rgba(5,10,18,.85)', border: 'rgba(10,14,22,.85)', borderOld: 'rgba(233,227,211,.55)',
    war: '#ff6b5e', trade: '#d4b36a', grid: 'rgba(150,175,215,.05)',
    hatch: 'rgba(8,12,20,.5)', bubble: '#d4b36a',
    ageRamp: ['#ffd087', '#d4b36a', '#8d7a4e', 'rgba(233,227,211,.5)'],
  },
  light: {
    sea: '#d8e2ea', seaEdge: '#c9d6e2', landNeutral: '#efe9db', coast: 'rgba(60,72,96,.45)',
    river: 'rgba(90,130,180,.45)', lake: '#d8e2ea', ink: '#29241a', inkSoft: 'rgba(41,36,26,.75)',
    halo: 'rgba(246,242,232,.9)', border: 'rgba(46,40,28,.68)', borderOld: 'rgba(46,40,28,.85)',
    war: '#b3362f', trade: '#8a6a2f', grid: 'rgba(60,80,110,.06)',
    hatch: 'rgba(80,70,50,.35)', bubble: '#8a6a2f',
    ageRamp: ['#c46a10', '#8a6a2f', '#6d5b33', 'rgba(46,40,28,.8)'],
  },
};

/* ---------------- state ---------------- */
let G = null, DATA = null;           // geometry, compiled data
let slices = [], years = [];
let owners = [];                     // per slice: Map(code -> entity)
let entMaps = [];                    // per slice: Map(id -> entity)
let edgeAge = [], edgePair = [];     // per slice arrays aligned with G.edges
let changeScore = [];                // per slice (0 for first)
let anchors = [];                    // per slice: Map(id -> [x,y])
let areas = [];                      // per slice: Map(id -> mapArea)
let cellArea = {}, cellCentroid = {};
let cellPaths = {}, landPath = null;

let theme = 'dark';
let mode = 'linear';                 // linear | recency | change
let speed = 1;
let playing = false;
let tcum = 0;                        // seconds along the tour
let durations = {}, cumTime = {}, totalTime = {};
const TOUR_SECONDS = 300;

let curIdx = -1;                     // slice index currently baked into fillsA
let displayIdx = -1;                 // slice index driving the panels
let hover = null;                    // {code, ent}
let pinned = null;                   // entity id pinned in detail panel
let overlays = { labels: true, population: false, relations: true, borderage: false };
let colorMode = 'political';

let mapC, mapX, stripC, stripX;
let fillsA, fillsB, base, landMask;  // offscreen canvases (map-native resolution)
let stripBG = null;
let view = { s: 1, ox: 0, oy: 0, w: 0, h: 0, dpr: 1 };
let zoom = 1, panX = 0, panY = 0;    // user view transform on top of the base fit
let lastFrame = 0, dashPhase = 0;

/* ---------------- boot ---------------- */
async function boot() {
  // built single-file mode embeds the data; dev mode fetches it
  const [g, d] = window.__GEOMETRY__
    ? [window.__GEOMETRY__, window.__COMPILED__]
    : await Promise.all([
      fetch('geometry.json').then(r => r.json()),
      fetch('compiled.json').then(r => r.ok ? r.json() : Promise.reject()).catch(() => fetch('placeholder.json').then(r => r.json())),
    ]);
  G = g; DATA = d;
  try { await Promise.all([
    document.fonts.load('600 40px "EB Garamond"'),
    document.fonts.load('500 20px "EB Garamond"'),
    document.fonts.load('italic 400 20px "EB Garamond"'),
  ]); } catch (e) {}

  theme = document.documentElement.dataset.theme ||
    (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.dataset.theme = theme;

  mapC = $('#map'); mapX = mapC.getContext('2d');
  stripC = $('#strip'); stripX = stripC.getContext('2d');

  precomputeGeometry();
  precomputeSlices();
  computePacing();
  buildStatic();
  buildLegend();
  buildAbout();
  bindUI();
  new ResizeObserver(resize).observe($('#stage'));
  new ResizeObserver(resizeStrip).observe($('#timeline'));
  resize(); resizeStrip();

  setSlice(0, true);
  requestAnimationFrame(frame);
}

/* ---------------- precompute ---------------- */
function precomputeGeometry() {
  for (const [code, poly] of Object.entries(G.cells)) {
    // land-clipped area/centroid from the build step (so ocean-facing cells
    // don't drag anchors out to sea); fall back to the seat point
    cellArea[code] = (G.landAreas && G.landAreas[code]) || 1;
    cellCentroid[code] = (G.landCentroids && G.landCentroids[code]) || G.seats[code];
    const p = new Path2D();
    poly.forEach((pt, i) => i ? p.lineTo(pt[0], pt[1]) : p.moveTo(pt[0], pt[1]));
    p.closePath(); cellPaths[code] = p;
  }
  landPath = new Path2D();
  for (const ring of G.land) {
    ring.forEach((pt, i) => i ? landPath.lineTo(pt[0], pt[1]) : landPath.moveTo(pt[0], pt[1]));
    landPath.closePath();
  }
}

function precomputeSlices() {
  slices = [...DATA.slices].sort((a, b) => a.year - b.year);
  years = slices.map(s => s.year);
  const E = G.edges;
  let prevOwner = null, prevPair = null, prevAge = null;
  slices.forEach((sl, i) => {
    const own = new Map(), em = new Map(), anch = new Map(), ar = new Map();
    for (const ent of sl.entities) {
      em.set(ent.id, ent);
      for (const r of ent.regions || []) own.set(r, ent);
    }
    // anchors + areas (area-weighted centroid of held cells)
    for (const ent of sl.entities) {
      let A = 0, x = 0, y = 0;
      for (const r of ent.regions || []) {
        const a = cellArea[r] || 0, c = cellCentroid[r];
        A += a; x += c[0] * a; y += c[1] * a;
      }
      if (A > 0) {
        let ax = x / A, ay = y / A;
        // if centroid falls in a cell not owned (odd shapes), snap to biggest owned cell
        const holder = regionAt(ax, ay);
        if (!holder || own.get(holder) !== ent) {
          let best = null, bestA = -1;
          for (const r of ent.regions) if (cellArea[r] > bestA) { bestA = cellArea[r]; best = r; }
          if (best) { ax = cellCentroid[best][0]; ay = cellCentroid[best][1]; }
        }
        anch.set(ent.id, [ax, ay]); ar.set(ent.id, A);
      }
    }
    owners.push(own); entMaps.push(em); anchors.push(anch); areas.push(ar);

    // border pairs + ages
    const pair = new Array(E.length), age = new Array(E.length).fill(0);
    for (let e = 0; e < E.length; e++) {
      const oa = own.get(E[e].a), ob = own.get(E[e].b);
      pair[e] = (oa && ob && oa !== ob) ? (oa.id < ob.id ? oa.id + '|' + ob.id : ob.id + '|' + oa.id) : null;
      if (pair[e] && prevPair && prevPair[e] === pair[e]) age[e] = prevAge[e] + (sl.year - slices[i - 1].year);
    }
    edgePair.push(pair); edgeAge.push(age);

    // change score vs previous slice
    if (i === 0) changeScore.push(0);
    else {
      let ch = 0;
      for (const code of Object.keys(G.cells)) {
        const a = prevOwner.get(code), b = own.get(code);
        if ((a && a.id) !== (b && b.id)) ch++;
      }
      const prevIds = new Set([...entMaps[i - 1].keys()]), curIds = new Set([...em.keys()]);
      let births = 0, deaths = 0;
      for (const id of curIds) if (!prevIds.has(id)) births++;
      for (const id of prevIds) if (!curIds.has(id)) deaths++;
      changeScore.push(ch + 1.5 * Math.min(births + deaths, 10));
    }
    prevOwner = own; prevPair = pair; prevAge = age;
  });
}

function computePacing() {
  const n = slices.length;
  const NOW = 2026;
  for (const m of ['linear', 'recency', 'change']) {
    const d = [];
    for (let i = 0; i < n - 1; i++) {
      const dy = years[i + 1] - years[i];
      if (m === 'linear') d.push(dy);
      else if (m === 'recency') d.push(Math.log((NOW - years[i]) / (NOW - years[i + 1])));
      else d.push(Math.pow(changeScore[i + 1], 0.85) + 1.5);
    }
    const sum = d.reduce((a, b) => a + b, 0);
    const secs = d.map(v => Math.max(v / sum * TOUR_SECONDS, 0.35));
    const cum = [0];
    for (const s of secs) cum.push(cum[cum.length - 1] + s);
    durations[m] = secs; cumTime[m] = cum; totalTime[m] = cum[cum.length - 1];
  }
}

/* ---------------- static art ---------------- */
function buildStatic() {
  const P = THEME_CANVAS[theme];
  landMask = new OffscreenCanvas(G.W, G.H);
  const lx = landMask.getContext('2d');
  lx.fillStyle = '#fff'; lx.fill(landPath);

  base = new OffscreenCanvas(G.W, G.H);
  const bx = base.getContext('2d');
  // sea with a soft deep-edge vignette
  bx.fillStyle = P.sea; bx.fillRect(0, 0, G.W, G.H);
  const vg = bx.createRadialGradient(G.W * .48, G.H * .44, G.H * .25, G.W * .48, G.H * .44, G.H * .95);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, theme === 'dark' ? 'rgba(3,6,12,.55)' : 'rgba(140,160,180,.25)');
  bx.fillStyle = vg; bx.fillRect(0, 0, G.W, G.H);
  // graticule
  bx.strokeStyle = theme === 'dark' ? 'rgba(150,175,215,.07)' : 'rgba(60,80,110,.09)';
  bx.lineWidth = 1;
  for (const line of (G.graticule || [])) {
    bx.beginPath(); line.forEach((pt, i) => i ? bx.lineTo(pt[0], pt[1]) : bx.moveTo(pt[0], pt[1])); bx.stroke();
  }
  // sea names — engraved-atlas letterspaced caps
  bx.fillStyle = theme === 'dark' ? 'rgba(150,178,220,.30)' : 'rgba(70,95,125,.38)';
  bx.textAlign = 'center'; bx.textBaseline = 'middle';
  for (const l of (G.seaLabels || [])) {
    bx.save(); bx.translate(l.x, l.y); bx.rotate((l.angle || 0) * Math.PI / 180);
    bx.font = `500 ${l.size}px "EB Garamond", Georgia, serif`;
    bx.fillText(l.name.split('').join('  '), 0, 0);
    bx.restore();
  }
  // neutral land beneath the political fills
  bx.fillStyle = P.landNeutral; bx.fill(landPath);

  fillsA = new OffscreenCanvas(G.W, G.H);
  fillsB = new OffscreenCanvas(G.W, G.H);
}

function makeHatch(P) {
  const c = new OffscreenCanvas(7, 7), x = c.getContext('2d');
  x.strokeStyle = P.hatch; x.lineWidth = 1;
  x.beginPath(); x.moveTo(-2, 9); x.lineTo(9, -2); x.stroke();
  return x.canvas;
}

/* render one slice's political surface into an offscreen canvas */
function renderSlice(cv, idx) {
  const P = THEME_CANVAS[theme];
  const x = cv.getContext('2d');
  x.clearRect(0, 0, G.W, G.H);
  const own = owners[idx];
  const byCulture = colorMode === 'cultures';

  for (const code of Object.keys(G.cells)) {
    const ent = own.get(code);
    if (!ent) continue;
    x.fillStyle = entityColor(ent, theme, byCulture);
    x.fill(cellPaths[code]);
  }
  // hatch over non-state societies
  const hatch = x.createPattern(makeHatch(P), 'repeat');
  for (const code of Object.keys(G.cells)) {
    const ent = own.get(code);
    if (ent && ent.type !== 'state') { x.fillStyle = hatch; x.fill(cellPaths[code]); }
  }
  // interior borders (contested ones are drawn live in frame())
  const E = G.edges, pair = edgePair[idx], age = edgeAge[idx];
  for (let e = 0; e < E.length; e++) {
    if (!pair[e]) continue;
    const oa = own.get(E[e].a), ob = own.get(E[e].b);
    if (isContested(idx, e)) continue;
    const bothStates = oa.type === 'state' && ob.type === 'state';
    x.beginPath();
    E[e].path.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]));
    if (overlays.borderage && bothStates) {
      const a = age[e];
      const r = P.ageRamp;
      x.strokeStyle = a < 30 ? r[0] : a < 120 ? r[1] : a < 400 ? r[2] : r[3];
      x.lineWidth = a < 30 ? 2.6 : a < 120 ? 2.2 : a < 400 ? 2.0 : 2.6;
      x.setLineDash(a < 30 ? [5, 3] : []);
    } else if (bothStates) {
      x.strokeStyle = P.border;
      x.lineWidth = clamp(1.2 + Math.sqrt(age[e]) / 9, 1.2, 3.0);
      x.setLineDash([]);
    } else {
      x.strokeStyle = P.border; x.lineWidth = 1; x.setLineDash([2, 4]);
    }
    x.stroke(); x.setLineDash([]);
  }
  // clip to land, fade the eastern edge (off-scope land beyond the map's brief)
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(landMask, 0, 0);
  x.globalCompositeOperation = 'destination-out';
  const gr1 = x.createLinearGradient(G.W - 260, 0, G.W, 0);
  gr1.addColorStop(0, 'rgba(0,0,0,0)'); gr1.addColorStop(1, 'rgba(0,0,0,.45)');
  x.fillStyle = gr1; x.fillRect(G.W - 260, 0, 260, G.H);
  x.globalCompositeOperation = 'source-over';
}

function isContested(idx, e) {
  const E = G.edges, own = owners[idx];
  const oa = own.get(E[e].a), ob = own.get(E[e].b);
  if (!oa || !ob || oa === ob) return false;
  const ca = oa.contestedRegions || [], cb = ob.contestedRegions || [];
  return ca.includes(E[e].b) || cb.includes(E[e].a) || ca.includes(E[e].a) || cb.includes(E[e].b) ||
    (slices[idx].relations || []).some(r => r.type === 'war' &&
      ((r.a === oa.id && r.b === ob.id) || (r.a === ob.id && r.b === oa.id)));
}

/* ---------------- frame loop ---------------- */
function frame(ts) {
  const dt = lastFrame ? Math.min((ts - lastFrame) / 1000, 0.1) : 0;
  lastFrame = ts; dashPhase += dt * 14;
  if (playing) {
    tcum += dt * speed;
    if (tcum >= totalTime[mode]) { tcum = totalTime[mode]; setPlaying(false); }
  }
  const { i, p } = locate();
  if (i !== curIdx) { setSlice(i); }
  const dispI = p > 0.92 && i < slices.length - 1 ? i + 1 : i;
  if (dispI !== displayIdx) updatePanels(dispI);
  $('#yearnum').textContent = fmtYear(Math.round(lerp(years[i], years[Math.min(i + 1, years.length - 1)], p)));

  drawMap(i, p);
  drawStripNeedle();
  requestAnimationFrame(frame);
}

function locate() {
  const cum = cumTime[mode];
  let i = 0;
  while (i < cum.length - 2 && tcum >= cum[i + 1]) i++;
  const p = slices.length < 2 ? 0 : clamp((tcum - cum[i]) / (cum[i + 1] - cum[i] || 1), 0, 1);
  return { i, p };
}

function setSlice(i, force) {
  if (i === curIdx && !force) return;
  if (i === curIdx + 1 && !force) {
    [fillsA, fillsB] = [fillsB, fillsA];   // B already holds i
    renderSlice(fillsB, Math.min(i + 1, slices.length - 1));
  } else {
    renderSlice(fillsA, i);
    renderSlice(fillsB, Math.min(i + 1, slices.length - 1));
  }
  curIdx = i;
}

function drawMap(i, p) {
  const P = THEME_CANVAS[theme];
  const { s, ox, oy, dpr } = view;
  mapX.setTransform(1, 0, 0, 1, 0, 0);
  mapX.fillStyle = P.seaEdge;
  mapX.fillRect(0, 0, mapC.width, mapC.height);
  mapX.setTransform(s * dpr, 0, 0, s * dpr, ox * dpr, oy * dpr);

  mapX.drawImage(base, 0, 0);
  mapX.drawImage(fillsA, 0, 0);
  const fade = smooth((p - 0.72) / 0.28);
  if (fade > 0 && i < slices.length - 1) {
    mapX.globalAlpha = fade; mapX.drawImage(fillsB, 0, 0); mapX.globalAlpha = 1;
  }

  // hydro + coast on top of fills
  mapX.strokeStyle = P.river; mapX.lineWidth = 1.1;
  for (const line of G.rivers) {
    mapX.beginPath(); line.forEach((pt, k) => k ? mapX.lineTo(pt[0], pt[1]) : mapX.moveTo(pt[0], pt[1])); mapX.stroke();
  }
  mapX.fillStyle = P.lake;
  for (const ring of G.lakes) {
    mapX.beginPath(); ring.forEach((pt, k) => k ? mapX.lineTo(pt[0], pt[1]) : mapX.moveTo(pt[0], pt[1])); mapX.closePath(); mapX.fill();
  }
  mapX.strokeStyle = P.coast; mapX.lineWidth = 1; mapX.stroke(landPath);

  // annotation layers switch to the incoming slice mid-crossfade
  const ai = (p >= 0.86 && i < slices.length - 1) ? i + 1 : i;

  // live layer: contested borders pulse
  mapX.save(); mapX.clip(landPath);
  const E = G.edges;
  const pulse = 0.55 + 0.45 * Math.sin(dashPhase * 0.9);
  for (let e = 0; e < E.length; e++) {
    if (!edgePair[ai][e] || !isContested(ai, e)) continue;
    mapX.beginPath();
    E[e].path.forEach((pt, k) => k ? mapX.lineTo(pt[0], pt[1]) : mapX.moveTo(pt[0], pt[1]));
    mapX.strokeStyle = P.war; mapX.lineWidth = 2 + pulse; mapX.setLineDash([6, 5]);
    mapX.lineDashOffset = -dashPhase * 2;
    mapX.globalAlpha = 0.55 + 0.4 * pulse; mapX.stroke();
    mapX.globalAlpha = 1; mapX.setLineDash([]);
  }
  // hover highlight
  if (hover && owners[ai].get(hover.code)) {
    const ent = owners[ai].get(hover.code);
    mapX.fillStyle = theme === 'dark' ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.35)';
    for (const r of ent.regions) mapX.fill(cellPaths[r]);
  }
  mapX.restore();

  if (overlays.relations) drawRelations(ai);
  if (overlays.population) drawBubbles(ai);
  if (overlays.labels) drawLabels(ai);
}

function drawRelations(i) {
  const P = THEME_CANVAS[theme];
  // trade-system arcs (region-pair arcs from the great trade networks) — faint under the entity arcs
  for (const [a, b] of (slices[i].tradeArcs || [])) {
    const A = cellCentroid[a], B = cellCentroid[b];
    if (!A || !B) continue;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / d * d * 0.14, cy = my + dx / d * d * 0.14;
    mapX.beginPath(); mapX.moveTo(A[0], A[1]); mapX.quadraticCurveTo(cx, cy, B[0], B[1]);
    mapX.strokeStyle = P.trade; mapX.lineWidth = 0.9; mapX.globalAlpha = .32;
    mapX.setLineDash([2, 5]); mapX.lineDashOffset = -dashPhase * 2;
    mapX.stroke(); mapX.setLineDash([]); mapX.globalAlpha = 1;
  }
  const rels = (slices[i].relations || []).slice().sort((a, b) => (a.type === 'war' ? -1 : 1) - (b.type === 'war' ? -1 : 1)).slice(0, 10);
  for (const r of rels) {
    const A = anchors[i].get(r.a), B = anchors[i].get(r.b);
    if (!A || !B) continue;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1;
    const cx = mx - dy / d * d * 0.18, cy = my + dx / d * d * 0.18;
    mapX.beginPath(); mapX.moveTo(A[0], A[1]); mapX.quadraticCurveTo(cx, cy, B[0], B[1]);
    if (r.type === 'war') {
      mapX.strokeStyle = P.war; mapX.lineWidth = 1.6; mapX.globalAlpha = .8; mapX.setLineDash([]);
    } else {
      mapX.strokeStyle = P.trade; mapX.lineWidth = 1.2; mapX.globalAlpha = .65;
      mapX.setLineDash([7, 6]); mapX.lineDashOffset = -dashPhase * 3;
    }
    mapX.stroke(); mapX.setLineDash([]); mapX.globalAlpha = 1;
    // endpoint ticks
    for (const pt of [A, B]) {
      mapX.beginPath(); mapX.arc(pt[0], pt[1], 2.2, 0, 7);
      mapX.fillStyle = r.type === 'war' ? P.war : P.trade; mapX.fill();
    }
  }
}

function drawBubbles(i) {
  const P = THEME_CANVAS[theme];
  const list = slices[i].entities.filter(e => e.population > 0 && anchors[i].get(e.id))
    .sort((a, b) => b.population - a.population);
  mapX.textAlign = 'center'; mapX.textBaseline = 'middle';
  list.forEach((e, k) => {
    const [x, y] = anchors[i].get(e.id);
    const r = 2 + Math.sqrt(e.population) * 3.4;
    mapX.beginPath(); mapX.arc(x, y, r, 0, 7);
    mapX.fillStyle = P.bubble; mapX.globalAlpha = .13; mapX.fill();
    mapX.globalAlpha = .8; mapX.lineWidth = 1.1; mapX.strokeStyle = P.bubble; mapX.stroke();
    mapX.globalAlpha = 1;
    if (k < 8 && r > 9) {
      mapX.font = `600 ${clamp(r * .55, 9, 15)}px system-ui`;
      mapX.fillStyle = P.ink;
      mapX.fillText(fmtPop(e.population), x, y);
    }
  });
}

function drawLabels(i) {
  const P = THEME_CANVAS[theme];
  const byCulture = colorMode === 'cultures';
  const list = slices[i].entities
    .filter(e => areas[i].get(e.id) > 220)
    .sort((a, b) => areas[i].get(b.id) - areas[i].get(a.id));
  const placed = [];
  mapX.textAlign = 'center'; mapX.textBaseline = 'middle';
  for (const e of list.slice(0, 44)) {
    const A = areas[i].get(e.id), [x, y] = anchors[i].get(e.id);
    const size = clamp(9 + Math.sqrt(A) / 10, 10.5, 30);
    const name = byCulture ? (FAMILIES[e.culture]?.label || e.culture) : e.name;
    mapX.font = `italic 400 ${size}px "EB Garamond", Georgia, serif`;
    const w = mapX.measureText(name).width;
    const rect = [x - w / 2 - 3, y - size / 2 - 2, x + w / 2 + 3, y + size / 2 + 2];
    if (placed.some(q => !(rect[2] < q[0] || rect[0] > q[2] || rect[3] < q[1] || rect[1] > q[3]))) continue;
    placed.push(rect);
    mapX.lineWidth = Math.max(2.5, size / 6); mapX.strokeStyle = P.halo;
    mapX.lineJoin = 'round';
    mapX.strokeText(name, x, y);
    mapX.fillStyle = e.type === 'state' ? P.ink : P.inkSoft;
    mapX.fillText(name, x, y);
    if (e.capitalRegion && G.seats[e.capitalRegion] && e.type === 'state' && A > 2000) {
      const s = G.seats[e.capitalRegion];
      mapX.beginPath(); mapX.arc(s[0], s[1] + 8, 1.8, 0, 7);
      mapX.fillStyle = P.inkSoft; mapX.fill();
    }
  }
}

/* ---------------- timeline strip ---------------- */
function eraBands() {
  const bands = [];
  let start = 0;
  for (let i = 1; i <= slices.length; i++) {
    if (i === slices.length || slices[i].eraName !== slices[start].eraName) {
      bands.push({ name: slices[start].eraName, from: start, to: i - 1 });
      start = i;
    }
  }
  return bands;
}

function renderStripBG() {
  const w = stripC.width, h = stripC.height, dpr = view.dpr;
  const P = THEME_CANVAS[theme];
  stripBG = new OffscreenCanvas(w, h);
  const x = stripBG.getContext('2d');
  x.scale(dpr, dpr);
  const W = w / dpr, H = h / dpr;
  const X = idx => (cumTime[mode][idx] / totalTime[mode]) * W;

  x.fillStyle = theme === 'dark' ? '#0d1626' : '#ece6d8'; x.fillRect(0, 0, W, H);
  // era bands
  const bands = eraBands();
  bands.forEach((b, k) => {
    const x0 = X(b.from), x1 = X(Math.min(b.to + 1, slices.length - 1));
    x.fillStyle = k % 2 ? 'rgba(128,140,170,.07)' : 'rgba(128,140,170,.015)';
    x.fillRect(x0, 0, x1 - x0, H);
    if (x1 - x0 > 60) {
      x.font = '500 9px system-ui'; x.fillStyle = theme === 'dark' ? 'rgba(168,176,192,.6)' : 'rgba(90,84,70,.7)';
      x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText((b.name || '').toUpperCase(), x0 + 4, 3);
    }
  });
  // change-intensity area
  const maxCh = Math.max(...changeScore, 1);
  x.beginPath(); x.moveTo(0, H);
  for (let i = 0; i < slices.length; i++) {
    const cx = X(i), cy = H - (Math.pow(changeScore[i] / maxCh, 0.6)) * (H - 15);
    x.lineTo(cx, cy);
  }
  x.lineTo(W, H); x.closePath();
  const gr = x.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, theme === 'dark' ? 'rgba(212,179,106,.5)' : 'rgba(138,106,47,.45)');
  gr.addColorStop(1, 'rgba(212,179,106,.04)');
  x.fillStyle = gr; x.fill();
  // year ticks
  x.font = '500 9px system-ui'; x.textAlign = 'center'; x.textBaseline = 'bottom';
  x.fillStyle = theme === 'dark' ? 'rgba(109,120,144,.9)' : 'rgba(141,134,119,1)';
  const marks = [-3000, -2000, -1000, -500, 1, 500, 1000, 1250, 1500, 1750, 1900, 1950, 2000, 2025];
  for (const yr of marks) {
    let i = years.findIndex(v => v >= yr);
    if (i < 0) continue;
    // interpolate x between slices for the exact year
    const i0 = Math.max(0, i - 1);
    const f = years[i] === years[i0] ? 0 : (yr - years[i0]) / (years[i] - years[i0]);
    const cx = lerp(X(i0), X(i), clamp(f, 0, 1));
    x.strokeStyle = 'rgba(128,140,170,.25)';
    x.beginPath(); x.moveTo(cx, H - 12); x.lineTo(cx, H); x.stroke();
    x.fillText(fmtYear(yr, true), clamp(cx, 14, W - 16), H - 12);
  }
}

function drawStripNeedle() {
  if (!stripBG) return;
  const w = stripC.width, h = stripC.height, dpr = view.dpr;
  stripX.setTransform(1, 0, 0, 1, 0, 0);
  stripX.clearRect(0, 0, w, h);
  stripX.drawImage(stripBG, 0, 0);
  stripX.scale(dpr, dpr);
  const W = w / dpr, H = h / dpr;
  const nx = (tcum / totalTime[mode]) * W;
  const P = THEME_CANVAS[theme];
  stripX.strokeStyle = P.trade; stripX.lineWidth = 1.5;
  stripX.beginPath(); stripX.moveTo(nx, 0); stripX.lineTo(nx, H); stripX.stroke();
  stripX.beginPath(); stripX.moveTo(nx - 4, 0); stripX.lineTo(nx + 4, 0); stripX.lineTo(nx, 6); stripX.closePath();
  stripX.fillStyle = P.trade; stripX.fill();
}

/* ---------------- panels ---------------- */
function updatePanels(i) {
  displayIdx = i;
  const sl = slices[i];
  $('#eraname').textContent = sl.eraName || '';
  $('#slicelabel').textContent = sl.label || '';
  $('#eventlist').innerHTML = (sl.events || []).map(e => `<li>${esc(e)}</li>`).join('');
  const conn = sl.connectivity ?? 0;
  $('#connfill').style.width = conn + '%';
  $('#connval').textContent = conn;
  $('#connnote').textContent = sl.connectivityNote || '';

  const tops = sl.entities.filter(e => e.type === 'state' && e.population > 0)
    .sort((a, b) => b.population - a.population).slice(0, 6);
  const maxP = tops[0]?.population || 1;
  $('#powerlist').innerHTML = tops.map(e => `
    <li class="pw" data-id="${esc(e.id)}">
      <span class="pw-sw" style="background:${entityColor(e, theme, false)}"></span>
      <span class="pw-name">${esc(e.name)}</span>
      <span class="pw-val">${fmtPop(e.population)}</span>
      <span class="pw-bar-wrap"><span class="pw-bar" style="width:${(e.population / maxP * 100).toFixed(1)}%;background:${entityColor(e, theme, false)}"></span></span>
    </li>`).join('');
  document.querySelectorAll('.pw').forEach(el => el.addEventListener('click', () => { pinned = el.dataset.id; showDetail(); }));
  showDetail();
}

function showDetail() {
  const box = $('#detail');
  const sl = slices[displayIdx];
  const ent = pinned ? entMaps[displayIdx].get(pinned) : null;
  if (!ent) { box.hidden = true; return; }
  box.hidden = false;
  $('#detailname').textContent = ent.name;
  const age = ent.founded != null ? sl.year - ent.founded : null;
  const fam = FAMILIES[ent.culture]?.label || ent.culture;
  const rels = (sl.relations || []).filter(r => r.a === ent.id || r.b === ent.id);
  $('#detailbody').innerHTML = `
    <span class="chip">${esc(ent.type)}</span>
    <span class="chip">${esc(fam)}${ent.cultureName ? ' · ' + esc(ent.cultureName) : ''}</span>
    <span class="chip ${ent.stability === 'contested' || ent.stability === 'collapsing' ? 'warm' : ''}">${esc(ent.stability || '—')}</span>
    ${age != null && age >= 0 ? `<div class="stat"><span>Age of state</span><b>${age.toLocaleString()} yrs${ent.founded != null ? ' (since ' + fmtYear(ent.founded, true) + ')' : ''}</b></div>` : ''}
    ${ent.population ? `<div class="stat"><span>Population</span><b>${fmtPop(ent.population)}</b></div>` : ''}
    ${ent.wealth ? `<div class="stat"><span>Wealth (for its era)</span><b class="wealthdots">${'●'.repeat(ent.wealth)}<span class="off">${'●'.repeat(5 - ent.wealth)}</span></b></div>` : ''}
    ${ent.capital ? `<div class="stat"><span>Capital</span><b>${esc(ent.capital)}</b></div>` : ''}
    ${ent.regions ? `<div class="stat"><span>Regions held</span><b>${ent.regions.length}</b></div>` : ''}
    ${ent.note ? `<p style="font-style:italic">${esc(ent.note)}</p>` : ''}
    ${rels.length ? '<p>' + rels.map(r => `${r.type === 'war' ? '⚔' : r.type === 'trade' ? '⇄' : '🤝'} ${esc(otherName(r, ent.id))}${r.note ? ' — ' + esc(r.note) : ''}`).join('<br>') + '</p>' : ''}
  `;
}
function otherName(r, id) {
  const other = r.a === id ? r.b : r.a;
  return entMaps[displayIdx].get(other)?.name || other;
}

/* ---------------- legend / about ---------------- */
function buildLegend() {
  $('#legendbody').innerHTML = Object.entries(FAMILIES).map(([k, f]) => {
    const [h, s, l] = familyHSL(k, theme);
    return `<span class="lg-item"><span class="lg-sw" style="background:hsl(${h} ${s}% ${l}%)"></span>${esc(f.label)}</span>`;
  }).join('');
}

function buildAbout() {
  const nSources = (DATA.meta?.sourceCount) || (DATA.meta?.sources?.length) || 0;
  const fb = DATA.famousBorders || [];
  $('#aboutbody').innerHTML = `
    <p><em>Borders</em> animates five millennia of political geography across Europe, the full
    Mediterranean rim and the Near-Eastern fringe — from the first states of the Bronze Age to the
    present day, across ${slices.length} dated snapshots.</p>
    <h3>How to read it</h3>
    <p>Color families are <b>cultural worlds</b> (all Celtic societies share greens, the Hellenic world
    blues, and so on) — watch whole regions change culture beneath the border churn. Hard outlines are
    state borders: the <b>older</b> a border, the heavier its line. <b>Pulsing red</b> edges are live war
    fronts. Hatched territory is a shared culture without a state. The <b>Connection</b> meter tracks how
    freely goods, people and ideas can move — its opposite is war and fragmentation.</p>
    <h3>Three speeds of time</h3>
    <p><b>Linear</b> runs at constant years-per-second. <b>Focus on now</b> gives each order of magnitude
    of "years ago" equal screen time, so the recent past unfolds slowly while the deep past flies.
    <b>Equal change</b> spends screen time in proportion to how much the map is actually changing —
    turbulent decades run slow, quiet centuries blink past. The timeline strip re-stretches to match:
    the gold needle always travels at constant speed.</p>
    <h3>Honesty box</h3>
    <p>Territory is expressed on a fixed lattice of 122 historical regions, so borders are stylised to
    region resolution and every date shows a defensible <i>reading</i>, not a survey line. Populations are
    scholarly estimates (McEvedy &amp; Jones, HYDE, Scheidel, Maddison and others) and carry wide error
    bars, especially before 1500. Wealth is an ordinal 1–5 <i>for its own era</i>.</p>
    ${fb.length ? `<h3>Long-lived borders</h3><ul>${fb.slice(0, 10).map(b =>
      `<li><b>${esc(b.name)}</b> — since ${fmtYear(b.established, true)}${b.note ? '. ' + esc(b.note) : ''}</li>`).join('')}</ul>` : ''}
    <h3>Sources</h3>
    <p>Compiled from ${nSources || 'many'} sources gathered by a fleet of research agents — era-by-era
    Wikipedia and Britannica corpora, university atlases, McEvedy &amp; Jones' <i>Atlas of World Population
    History</i>, the Maddison Project, and specialist literature. Full list in the repository:
    <code>research/*.json</code>.</p>
  `;
}

/* ---------------- UI ---------------- */
function bindUI() {
  $('#playbtn').addEventListener('click', () => setPlaying(!playing));
  document.querySelectorAll('.modebtn').forEach(b => b.addEventListener('click', () => {
    // keep the current year fixed while re-basing the clock into the new mode
    const { i, p } = locate();
    mode = b.dataset.mode;
    document.querySelectorAll('.modebtn').forEach(x => x.classList.toggle('active', x === b));
    tcum = cumTime[mode][i] + p * (cumTime[mode][i + 1] - cumTime[mode][i] || 0);
    renderStripBG();
  }));
  $('#speed').addEventListener('change', e => speed = +e.target.value);
  document.querySelectorAll('.ovbtn').forEach(b => b.addEventListener('click', () => {
    const ov = b.dataset.ov;
    if (ov === 'political' || ov === 'cultures') {
      colorMode = ov;
      document.querySelectorAll('.ovbtn[data-ov="political"],.ovbtn[data-ov="cultures"]').forEach(x =>
        x.classList.toggle('active', x.dataset.ov === ov));
      rebake();
    } else {
      overlays[ov] = !overlays[ov];
      b.classList.toggle('active', overlays[ov]);
      if (ov === 'borderage') rebake();
    }
  }));
  $('#legendtoggle').addEventListener('click', () => $('#legend').classList.toggle('collapsed'));
  $('#themebtn').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    buildStatic(); rebake(); buildLegend(); renderStripBG(); updatePanels(displayIdx);
  });
  $('#aboutbtn').addEventListener('click', () => $('#about').hidden = false);
  $('#aboutclose').addEventListener('click', () => $('#about').hidden = true);
  $('#about').addEventListener('click', e => { if (e.target.id === 'about') $('#about').hidden = true; });

  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); }
    if (e.key === 'ArrowRight') jumpSlice(1);
    if (e.key === 'ArrowLeft') jumpSlice(-1);
    if (e.key === '1' || e.key === '2' || e.key === '3')
      document.querySelectorAll('.modebtn')[+e.key - 1].click();
  });

  stripC.addEventListener('pointerdown', e => { scrub(e); stripC.setPointerCapture(e.pointerId); });
  stripC.addEventListener('pointermove', e => { if (e.buttons) scrub(e); });

  mapC.addEventListener('pointermove', onHover);
  mapC.addEventListener('pointerleave', () => { hover = null; $('#tooltip').hidden = true; });

  // zoom at cursor + drag pan (drag suppresses the click-to-pin)
  let dragging = false, moved = 0, lastPt = null;
  mapC.addEventListener('wheel', e => {
    e.preventDefault();
    const r = mapC.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const before = [(cx - view.ox) / view.s, (cy - view.oy) / view.s];
    zoom = clamp(zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18), 1, 6);
    applyView();
    if (zoom > 1) {
      panX = cx - before[0] * view.s; panY = cy - before[1] * view.s;
      applyView();
    }
  }, { passive: false });
  mapC.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; lastPt = [e.clientX, e.clientY];
    mapC.setPointerCapture(e.pointerId);
  });
  mapC.addEventListener('pointermove', e => {
    if (!dragging || !lastPt) return;
    const dx = e.clientX - lastPt[0], dy = e.clientY - lastPt[1];
    moved += Math.abs(dx) + Math.abs(dy);
    if (zoom > 1 && moved > 4) { panX += dx; panY += dy; applyView(); }
    lastPt = [e.clientX, e.clientY];
  });
  mapC.addEventListener('pointerup', e => {
    dragging = false;
    if (moved <= 4) {
      if (hover) {
        const ent = owners[curIdx].get(hover.code);
        pinned = (pinned === ent?.id) ? null : ent?.id;
      } else pinned = null;
      showDetail();
    }
  });
  mapC.addEventListener('dblclick', () => { zoom = 1; applyView(); });
}

function setPlaying(v) {
  playing = v;
  if (playing && tcum >= totalTime[mode] - 0.01) tcum = 0;
  $('#playbtn').textContent = playing ? '❚❚' : '▶';
}
function jumpSlice(d) {
  const { i } = locate();
  const j = clamp(i + d, 0, slices.length - 1);
  tcum = cumTime[mode][j] + 0.001;
}
function scrub(e) {
  const r = stripC.getBoundingClientRect();
  tcum = clamp((e.clientX - r.left) / r.width, 0, 1) * totalTime[mode];
}
function rebake() { renderSlice(fillsA, curIdx); renderSlice(fillsB, Math.min(curIdx + 1, slices.length - 1)); }

function onHover(e) {
  const r = mapC.getBoundingClientRect();
  const mx = (e.clientX - r.left - view.ox) / view.s;
  const my = (e.clientY - r.top - view.oy) / view.s;
  const code = regionAt(mx, my);
  hover = code ? { code } : null;
  const tt = $('#tooltip');
  if (!code) { tt.hidden = true; return; }
  const i = curIdx;
  const ent = owners[i].get(code);
  if (!ent) { tt.hidden = true; return; }
  const held = tenure(i, code);
  const regionName = (DATA.regionNames && DATA.regionNames[code]) || code;
  const age = ent.founded != null ? slices[i].year - ent.founded : null;
  tt.innerHTML = `
    <div class="tt-region">${esc(regionName)}</div>
    <div class="tt-name">${esc(ent.name)}</div>
    <div class="tt-row">${esc(FAMILIES[ent.culture]?.label || ent.culture)} · ${esc(ent.stability || '')}</div>
    ${ent.population ? `<div class="tt-row">pop <b>${fmtPop(ent.population)}</b>${ent.wealth ? ` · wealth <b>${'●'.repeat(ent.wealth)}</b>` : ''}</div>` : ''}
    ${age != null && age >= 0 ? `<div class="tt-row">state for <b>${age.toLocaleString()} yrs</b></div>` : ''}
    ${held ? `<div class="tt-row">held here since <b>${fmtYear(held, true)}</b></div>` : ''}
  `;
  tt.hidden = false;
  const tw = tt.offsetWidth, th = tt.offsetHeight;
  tt.style.left = clamp(e.clientX - r.left + 14, 4, r.width - tw - 6) + 'px';
  tt.style.top = clamp(e.clientY - r.top + 12, 4, r.height - th - 6) + 'px';
}

function tenure(i, code) {
  const id = owners[i].get(code)?.id;
  if (!id) return null;
  let j = i;
  while (j > 0 && owners[j - 1].get(code)?.id === id) j--;
  return j === i && i === 0 ? null : years[j];
}

function regionAt(x, y) {
  for (const [code, path] of Object.entries(cellPaths)) {
    const c = cellCentroid[code];
    if (Math.abs(c[0] - x) > 400 || Math.abs(c[1] - y) > 400) continue;
    if (mapX && mapX.isPointInPath(path, x, y)) return code;
  }
  return null;
}

/* ---------------- layout ---------------- */
function resize() {
  const st = $('#stage');
  const w = st.clientWidth, h = st.clientHeight;
  const dpr = clamp(devicePixelRatio || 1, 1, 1.6);
  view.dpr = dpr; view.w = w; view.h = h;
  mapC.width = w * dpr; mapC.height = h * dpr;
  applyView();
}
function applyView() {
  const w = view.w, h = view.h;
  const s0 = Math.min(w / G.W, h / G.H);
  const s = s0 * zoom;
  // clamp pan so the map never leaves more than a third of the stage empty
  const minX = w - G.W * s - (w * .33), maxX = w * .33;
  const minY = h - G.H * s - (h * .33), maxY = h * .33;
  panX = clamp(panX, minX, maxX); panY = clamp(panY, minY, maxY);
  view.s = s;
  view.ox = zoom === 1 ? (w - G.W * s) / 2 : panX;
  view.oy = zoom === 1 ? (h - G.H * s) / 2 : panY;
  if (zoom === 1) { panX = view.ox; panY = view.oy; }
}
function resizeStrip() {
  const dpr = view.dpr || 1;
  const w = stripC.clientWidth, h = stripC.clientHeight;
  if (!w || !h) return;
  stripC.width = w * dpr; stripC.height = h * dpr;
  renderStripBG();
}

/* ---------------- format ---------------- */
function fmtYear(y) {
  if (y < 0) return Math.abs(y) + ' BCE';
  if (y < 1000) return y + ' CE';
  return String(y);
}
function fmtPop(m) {
  if (m >= 1000) return (m / 1000).toFixed(1) + 'B';
  if (m >= 10) return Math.round(m) + 'M';
  if (m >= 1) return m.toFixed(1).replace(/\.0$/, '') + 'M';
  return Math.round(m * 1000) + 'k';
}
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// test hook: jump to a fraction of the tour
window.__scrub = f => { tcum = clamp(f, 0, 1) * totalTime[mode]; };

boot();
