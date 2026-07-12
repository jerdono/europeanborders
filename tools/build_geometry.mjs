// Build static geometry for the border-history map:
//  - Lambert conformal conic projection of Natural Earth land/rivers/lakes, clipped to the map window
//  - Voronoi cells for the 122 region seeds (in projected space)
//  - Shared border segments between every adjacent region pair
// Output: web/geometry.json
import { readFileSync, writeFileSync } from 'node:fs';
import { geoConicConformal } from 'd3-geo';
import { Delaunay } from 'd3-delaunay';

const R = JSON.parse(readFileSync('data/regions.json', 'utf8'));
const LAND = JSON.parse(readFileSync('data/ne_50m_land.json', 'utf8'));
const RIVERS = JSON.parse(readFileSync('data/ne_50m_rivers.json', 'utf8'));
const LAKES = JSON.parse(readFileSync('data/ne_50m_lakes.json', 'utf8'));

const BBOX = R.bbox; // lon -12..46, lat 26..71.5
const W = 1520;

const proj = geoConicConformal()
  .parallels([36, 58])
  .rotate([-17, 0]) // center meridian 17E
  .center([0, 49]);

// Fit: project a dense sample of the bbox boundary, then scale/translate to width W.
function bboxSamples() {
  const pts = [];
  const { lonMin, lonMax, latMin, latMax } = BBOX;
  for (let lon = lonMin; lon <= lonMax; lon += 0.5) { pts.push([lon, latMin], [lon, latMax]); }
  for (let lat = latMin; lat <= latMax; lat += 0.5) { pts.push([lonMin, lat], [lonMax, lat]); }
  return pts;
}
proj.scale(1000).translate([0, 0]);
let raw = bboxSamples().map(p => proj(p));
let minX = Math.min(...raw.map(p => p[0])), maxX = Math.max(...raw.map(p => p[0]));
let minY = Math.min(...raw.map(p => p[1])), maxY = Math.max(...raw.map(p => p[1]));
const k = W / (maxX - minX);
const H = Math.round((maxY - minY) * k);
proj.scale(1000 * k).translate([-minX * k, -minY * k]);

const rnd = v => Math.round(v * 10) / 10;
const P = ll => { const p = proj(ll); return [rnd(p[0]), rnd(p[1])]; };

// Sutherland–Hodgman clip of a ring against the canvas rect
function clipRing(ring) {
  const edges = [
    p => p[0] >= 0, p => p[0] <= W, p => p[1] >= 0, p => p[1] <= H,
  ];
  const inter = [
    (a, b) => [0, a[1] + (b[1] - a[1]) * (0 - a[0]) / (b[0] - a[0])],
    (a, b) => [W, a[1] + (b[1] - a[1]) * (W - a[0]) / (b[0] - a[0])],
    (a, b) => [a[0] + (b[0] - a[0]) * (0 - a[1]) / (b[1] - a[1]), 0],
    (a, b) => [a[0] + (b[0] - a[0]) * (H - a[1]) / (b[1] - a[1]), H],
  ];
  let out = ring;
  for (let e = 0; e < 4; e++) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      const curIn = edges[e](cur), prevIn = edges[e](prev);
      if (curIn) { if (!prevIn) out.push(inter[e](prev, cur)); out.push(cur); }
      else if (prevIn) out.push(inter[e](prev, cur));
    }
    if (!out.length) return [];
  }
  return out.map(p => [rnd(p[0]), rnd(p[1])]);
}
function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) { const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length]; a += x1 * y2 - x2 * y1; }
  return Math.abs(a / 2);
}
// crude lon/lat bbox prefilter so we don't project the whole world
function ringTouchesBbox(ring) {
  return ring.some(([lon, lat]) => lon >= BBOX.lonMin - 3 && lon <= BBOX.lonMax + 3 && lat >= BBOX.latMin - 3 && lat <= BBOX.latMax + 3);
}

const landRings = [];
for (const f of LAND.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) {
    if (!ringTouchesBbox(ring)) continue;
    // drop Iceland etc. — land wholly west of the map window that only appears
    // because the conic canvas corners extend past lon -12
    if (ring.every(([lon, lat]) => lon < -11 && lat > 55)) continue;
    const clipped = clipRing(ring.map(P));
    if (clipped.length >= 3 && ringArea(clipped) > 4) landRings.push(clipped);
  }
}

// Lakes: keep the big historically visible ones
const lakeRings = [];
for (const f of LAKES.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = poly[0];
    if (!ringTouchesBbox(ring)) continue;
    const clipped = clipRing(ring.map(P));
    if (clipped.length >= 3 && ringArea(clipped) > 60) lakeRings.push(clipped);
  }
}

// Rivers: keep major ones by name
const KEEP_RIVERS = new Set(['Danube', 'Rhine', 'Rhône', 'Rhone', 'Elbe', 'Oder', 'Vistula', 'Dnieper', 'Dniester', 'Don', 'Volga', 'Po', 'Ebro', 'Tagus', 'Loire', 'Seine', 'Nile', 'Euphrates', 'Tigris', 'Douro', 'Duero', 'Guadalquivir', 'Garonne', 'Thames', 'Tiber', 'Dvina', 'Neman', 'Daugava', 'Kuban', 'Prut', 'Sava', 'Tisza', 'Bug', 'Southern Bug', 'Guadiana', 'Kizil Irmak', 'Kızılırmak', 'Halys', 'Orontes', 'Jordan', 'Severn', 'Shannon', 'Meuse', 'Moselle', 'Main', 'Inn', 'Drava', 'Morava', 'Maritsa', 'Vardar', 'Struma', 'Aliakmon', 'Arno', 'Adige', 'Neva', 'Volkhov', 'Onega', 'Pechora', 'Mezen', 'Glomma', 'Torne', 'Kemi', 'Oulu', 'Medjerda', 'Moulouya', 'Sebou', 'Chelif', 'Drin', 'Neretva', 'Kura', 'Aras', 'Araks', 'Rioni', 'Çoruh', 'Coruh']);
const riverLines = [];
for (const f of RIVERS.features) {
  if (!f.geometry) continue;
  const name = f.properties?.name || f.properties?.name_en || '';
  if (!KEEP_RIVERS.has(name)) continue;
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const line of lines) {
    if (!ringTouchesBbox(line)) continue;
    // project + clip line to canvas (simple: keep in-canvas points, split runs)
    let run = [];
    for (const ll of line) {
      const p = P(ll);
      if (p[0] >= -5 && p[0] <= W + 5 && p[1] >= -5 && p[1] <= H + 5) run.push(p);
      else { if (run.length > 1) riverLines.push(run); run = []; }
    }
    if (run.length > 1) riverLines.push(run);
  }
}

// ---- Voronoi over region seeds (projected) ----
const codes = R.regions.map(r => r.code);
const seedsXY = R.regions.map(r => proj(r.seed));
const delaunay = Delaunay.from(seedsXY);
const voronoi = delaunay.voronoi([0, 0, W, H]);

const cells = {};
codes.forEach((code, i) => {
  const poly = voronoi.cellPolygon(i);
  cells[code] = poly ? poly.map(p => [rnd(p[0]), rnd(p[1])]) : [];
});

// Border segments between adjacent cells: shared vertices (tolerance match)
const keyOf = p => `${Math.round(p[0] * 2)}:${Math.round(p[1] * 2)}`; // 0.5px tolerance
const edges = [];
for (let i = 0; i < codes.length; i++) {
  for (const j of delaunay.neighbors(i)) {
    if (j <= i) continue;
    const pi = cells[codes[i]], pj = cells[codes[j]];
    if (!pi.length || !pj.length) continue;
    const setJ = new Set(pj.map(keyOf));
    const shared = pi.filter(p => setJ.has(keyOf(p)));
    // dedupe
    const uniq = []; const seen = new Set();
    for (const p of shared) { const k2 = keyOf(p); if (!seen.has(k2)) { seen.add(k2); uniq.push(p); } }
    if (uniq.length >= 2) edges.push({ a: codes[i], b: codes[j], path: uniq });
  }
}

const seats = {};
codes.forEach((code, i) => { seats[code] = [rnd(seedsXY[i][0]), rnd(seedsXY[i][1])]; });

// ---- land-clipped area + centroid per cell (scanline raster) ----
// land raster at step S using even-odd scanline fill over all rings
const S = 2;
const GW = Math.ceil(W / S), GH = Math.ceil(H / S);
const landGrid = new Uint8Array(GW * GH);
for (let gy = 0; gy < GH; gy++) {
  const y = gy * S + S / 2;
  const xs = [];
  for (const ring of landRings) {
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
    }
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) {
    const g0 = Math.max(0, Math.ceil((xs[k] - S / 2) / S)), g1 = Math.min(GW - 1, Math.floor((xs[k + 1] - S / 2) / S));
    for (let g = g0; g <= g1; g++) landGrid[gy * GW + g] = 1;
  }
}
function pointInConvex(poly, x, y) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
    const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    if (c !== 0) { const s2 = c > 0 ? 1 : -1; if (sign === 0) sign = s2; else if (s2 !== sign) return false; }
  }
  return true;
}
const landAreas = {}, landCentroids = {};
for (const code of codes) {
  const poly = cells[code];
  if (!poly.length) { landAreas[code] = 0; landCentroids[code] = seats[code]; continue; }
  const minGX = Math.max(0, Math.floor(Math.min(...poly.map(p => p[0])) / S));
  const maxGX = Math.min(GW - 1, Math.ceil(Math.max(...poly.map(p => p[0])) / S));
  const minGY = Math.max(0, Math.floor(Math.min(...poly.map(p => p[1])) / S));
  const maxGY = Math.min(GH - 1, Math.ceil(Math.max(...poly.map(p => p[1])) / S));
  let n = 0, sx = 0, sy = 0;
  for (let gy = minGY; gy <= maxGY; gy++) for (let gx = minGX; gx <= maxGX; gx++) {
    if (!landGrid[gy * GW + gx]) continue;
    const x = gx * S + S / 2, y = gy * S + S / 2;
    if (pointInConvex(poly, x, y)) { n++; sx += x; sy += y; }
  }
  landAreas[code] = n * S * S;
  landCentroids[code] = n ? [rnd(sx / n), rnd(sy / n)] : seats[code];
}

// ---- graticule (10°) + sea labels ----
const graticule = [];
for (let lon = -10; lon <= 45; lon += 10) {
  const line = [];
  for (let lat = 26; lat <= 71.5; lat += 1) line.push(P([lon, lat]));
  graticule.push(line);
}
for (let lat = 30; lat <= 70; lat += 10) {
  const line = [];
  for (let lon = -12; lon <= 46; lon += 1) line.push(P([lon, lat]));
  graticule.push(line);
}
const seaLabels = [
  { name: 'ATLANTIC OCEAN', ll: [-9.8, 46.5], size: 15, angle: -70 },
  { name: 'MEDITERRANEAN SEA', ll: [10.5, 38.6], size: 14, angle: 0 },
  { name: 'NORTH SEA', ll: [3.2, 56.6], size: 11, angle: 0 },
  { name: 'NORWEGIAN SEA', ll: [2.0, 66.5], size: 11, angle: 0 },
  { name: 'BALTIC SEA', ll: [19.6, 58.2], size: 10, angle: -55 },
  { name: 'BLACK SEA', ll: [33.8, 43.4], size: 12, angle: 0 },
  { name: 'IONIAN SEA', ll: [18.6, 37.2], size: 9, angle: 0 },
  { name: 'AEGEAN', ll: [24.9, 38.7], size: 8, angle: -70 },
  { name: 'ADRIATIC', ll: [15.3, 43.0], size: 8, angle: -40 },
  { name: 'TYRRHENIAN SEA', ll: [11.9, 39.9], size: 9, angle: 0 },
  { name: 'BAY OF BISCAY', ll: [-4.5, 45.6], size: 9, angle: 0 },
].map(l => { const p = P(l.ll); return { name: l.name, x: p[0], y: p[1], size: l.size, angle: l.angle }; });

const out = { W, H, land: landRings, lakes: lakeRings, rivers: riverLines, cells, edges, seats, landAreas, landCentroids, graticule, seaLabels };
writeFileSync('web/geometry.json', JSON.stringify(out));
console.log(`W=${W} H=${H} landRings=${landRings.length} lakes=${lakeRings.length} riverSegs=${riverLines.length} cells=${codes.length} edges=${edges.length}`);
console.log(`size=${(JSON.stringify(out).length / 1024).toFixed(0)}KB`);
// sanity: every cell non-empty
const empty = codes.filter(c => !cells[c].length);
if (empty.length) console.error('EMPTY CELLS:', empty.join(','));
