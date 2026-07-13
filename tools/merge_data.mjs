// Merge era research files into data/compiled.json + a human review report.
// Usage: node tools/merge_data.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const R = JSON.parse(readFileSync('data/regions.json', 'utf8'));
const CODES = R.regions.map(r => r.code);
const CODESET = new Set(CODES);
const regionNames = Object.fromEntries(R.regions.map(r => [r.code, r.name]));

const CULTURES = new Set(['hellenic','italic','celtic','germanic','slavic','baltic','uralic','steppe','turkic','iranic','semitic_levantine','arab','berber','egyptian','anatolian','caucasian','pre_ie','paleo_balkan']);

// id aliases — fill in as agent outputs reveal drift
const ALIAS = {
  east_rome: 'byzantium', eastern_rome: 'byzantium', byzantine_empire: 'byzantium',
  western_rome: 'west_rome', roman_empire: 'rome', roman_republic: 'rome',
  francia: 'franks', frankish_kingdom: 'franks', carolingian_empire: 'franks',
  ottoman_empire: 'ottoman', ottomans: 'ottoman',
  golden_horde_khanate: 'golden_horde',
  al_andalus_umayyad: 'al_andalus', cordoba: 'al_andalus',
  holy_roman_empire: 'hre',
  russia_federation: 'russia', soviet_union: 'ussr',
  poland_kingdom: 'poland', hungary_kingdom: 'hungary',
  achaemenid: 'persia_achaemenid', achaemenid_persia: 'persia_achaemenid', persia: 'persia_achaemenid',
  sassanids: 'sassanid', sasanian: 'sassanid', sasanian_empire: 'sassanid',
  seljuks: 'seljuk', seljuk_empire: 'seljuk',
  mamluks: 'mamluk', mamluk_sultanate: 'mamluk',
  abbasids: 'abbasid', umayyads: 'umayyad', fatimids: 'fatimid',
  hospitallers: 'knights_hospitaller', knights_of_malta: 'knights_hospitaller',
  knights_of_rhodes: 'knights_hospitaller',
};
const canon = id => ALIAS[id] || id;

const files = readdirSync('research').filter(f => /^era\d+.*\.json$/.test(f)).sort();
const report = [];
const allSlices = [];
const allSources = [];
const fileOf = new Map(); // year -> file

for (const f of files) {
  let d;
  try { d = JSON.parse(readFileSync('research/' + f, 'utf8')); }
  catch (e) { report.push(`FATAL ${f}: JSON parse failed: ${e.message}`); continue; }
  for (const s of d.sources || []) allSources.push(s);
  for (const sl of d.slices || []) {
    // canonicalize ids
    for (const e of sl.entities || []) e.id = canon(e.id);
    for (const rel of sl.relations || []) { rel.a = canon(rel.a); rel.b = canon(rel.b); }
    // validate coverage
    const seen = new Map();
    for (const e of sl.entities || []) {
      if (e.culture && !CULTURES.has(e.culture)) {
        report.push(`WARN ${f} ${sl.year}: entity ${e.id} unknown culture '${e.culture}' -> pre_ie`);
        e.culture = 'pre_ie';
      }
      e.regions = (e.regions || []).filter(r => {
        if (!CODESET.has(r)) { report.push(`WARN ${f} ${sl.year}: ${e.id} unknown region '${r}' dropped`); return false; }
        return true;
      });
      for (const r of e.regions) {
        if (seen.has(r)) report.push(`ERROR ${f} ${sl.year}: region ${r} assigned to both ${seen.get(r)} and ${e.id}`);
        seen.set(r, e.id);
      }
    }
    const missing = CODES.filter(c => !seen.has(c));
    if (missing.length) report.push(`ERROR ${f} ${sl.year}: unassigned regions: ${missing.join(',')}`);
    if (fileOf.has(sl.year)) report.push(`ERROR ${f}: duplicate year ${sl.year} (also in ${fileOf.get(sl.year)})`);
    fileOf.set(sl.year, f);
    allSlices.push(sl);
  }
}
allSlices.sort((a, b) => a.year - b.year);

// entity registry consistency
const registry = new Map();
for (const sl of allSlices) for (const e of sl.entities || []) {
  if (!registry.has(e.id)) registry.set(e.id, { founded: new Set(), culture: new Set(), type: new Set(), names: new Set() });
  const r = registry.get(e.id);
  if (e.founded != null) r.founded.add(e.founded);
  r.culture.add(e.culture); r.type.add(e.type); r.names.add(e.name);
}
for (const [id, r] of registry) {
  if (r.founded.size > 1) report.push(`NOTE founded-drift ${id}: ${[...r.founded].join(', ')}`);
  if (r.culture.size > 1) report.push(`NOTE culture-drift ${id}: ${[...r.culture].join(', ')}`);
}
// harmonize founded: use the MINIMUM founded seen unless a re-establishment (gap in presence)
const presence = new Map(); // id -> [slice indexes]
allSlices.forEach((sl, i) => { for (const e of sl.entities) { if (!presence.has(e.id)) presence.set(e.id, []); presence.get(e.id).push(i); } });
for (const [id, idxs] of presence) {
  const r = registry.get(id);
  if (r.founded.size > 1) {
    // continuous presence -> take min founded everywhere
    let contiguous = true;
    for (let k = 1; k < idxs.length; k++) if (idxs[k] !== idxs[k - 1] + 1) { contiguous = false; break; }
    if (contiguous) {
      const min = Math.min(...r.founded);
      for (const i of idxs) { const e = allSlices[i].entities.find(x => x.id === id); if (e) e.founded = min; }
    }
  }
}

// era-boundary continuity
for (let i = 1; i < allSlices.length; i++) {
  const fa = fileOf.get(allSlices[i - 1].year), fb = fileOf.get(allSlices[i].year);
  const oa = new Map(), ob = new Map();
  for (const e of allSlices[i - 1].entities) for (const r of e.regions) oa.set(r, e.id);
  for (const e of allSlices[i].entities) for (const r of e.regions) ob.set(r, e.id);
  let ch = 0; const changes = [];
  for (const c of CODES) if (oa.get(c) !== ob.get(c)) { ch++; changes.push(`${c}:${oa.get(c)}→${ob.get(c)}`); }
  if (fa !== fb) {
    report.push(`BOUNDARY ${allSlices[i - 1].year}(${fa}) → ${allSlices[i].year}(${fb}): ${ch} regions change` +
      (ch > 30 ? `  <<< REVIEW\n    ${changes.join('\n    ')}` : ''));
  } else if (ch > 60) {
    report.push(`BIGJUMP within ${fb}: ${allSlices[i - 1].year} → ${allSlices[i].year}: ${ch} regions change`);
  }
}

// relations referencing absent entities
for (const sl of allSlices) {
  const ids = new Set(sl.entities.map(e => e.id));
  const before = (sl.relations || []).length;
  sl.relations = (sl.relations || []).filter(r => ids.has(r.a) && ids.has(r.b));
  if (sl.relations.length < before) report.push(`NOTE ${sl.year}: dropped ${before - sl.relations.length} relations with missing entities`);
}

// population sanity vs benchmarks
let bench = null;
if (existsSync('research/theme_population.json')) {
  bench = JSON.parse(readFileSync('research/theme_population.json', 'utf8'));
  const interp = y => {
    const c = bench.checkpoints;
    if (y <= c[0].year) return c[0].mapPopulation;
    for (let i = 1; i < c.length; i++) if (y <= c[i].year) {
      const f = (y - c[i - 1].year) / (c[i].year - c[i - 1].year);
      return c[i - 1].mapPopulation + f * (c[i].mapPopulation - c[i - 1].mapPopulation);
    }
    return c[c.length - 1].mapPopulation;
  };
  for (const sl of allSlices) {
    const sum = sl.entities.filter(e => !e.extendsBeyondMap).reduce((a, e) => a + (e.population || 0), 0);
    const expect = interp(sl.year);
    const ratio = sum / expect;
    if (ratio < 0.45 || ratio > 2.2)
      report.push(`POP ${sl.year}: in-map entity sum ${sum.toFixed(1)}M vs benchmark ~${expect.toFixed(0)}M (×${ratio.toFixed(2)})`);
  }
}

// connectivity fill from theme curve when missing
let conn = null;
if (existsSync('research/theme_connectivity.json')) {
  conn = JSON.parse(readFileSync('research/theme_connectivity.json', 'utf8'));
  const interp = y => {
    const c = conn.curve;
    if (y <= c[0].year) return c[0].connectivity;
    for (let i = 1; i < c.length; i++) if (y <= c[i].year) {
      const f = (y - c[i - 1].year) / (c[i].year - c[i - 1].year);
      return Math.round(c[i - 1].connectivity + f * (c[i].connectivity - c[i - 1].connectivity));
    }
    return c[c.length - 1].connectivity;
  };
  for (const sl of allSlices) if (sl.connectivity == null) {
    sl.connectivity = interp(sl.year);
    report.push(`NOTE ${sl.year}: connectivity filled from theme curve (${sl.connectivity})`);
  }
}

// trade-system arcs per slice (region-pair arcs for active systems)
if (conn) {
  for (const sl of allSlices) {
    const active = (conn.tradeSystems || []).filter(t => sl.year >= t.start && sl.year <= t.end);
    const arcs = [];
    for (const t of active) for (const [a, b] of (t.arcs || []))
      if (CODESET.has(a) && CODESET.has(b)) arcs.push([a, b, t.name]);
    if (arcs.length) sl.tradeArcs = arcs.slice(0, 14);
  }
}

// aggregate sources (dedup by url)
const seenUrl = new Set(); const sources = [];
for (const s of allSources) {
  const k = (s.url || s.title || '').trim();
  if (!k || seenUrl.has(k)) continue;
  seenUrl.add(k); sources.push(s);
}

const out = {
  meta: { built: new Date().toISOString(), sourceCount: sources.length, sources },
  regionNames,
  slices: allSlices,
  famousBorders: conn?.famousBorders || [],
  tradeSystems: conn?.tradeSystems || [],
  benchmarks: bench?.checkpoints || [],
};
writeFileSync('data/compiled.json', JSON.stringify(out));
writeFileSync('web/compiled.json', JSON.stringify(out));
writeFileSync('data/merge_report.txt', report.join('\n') || 'clean');
const errs = report.filter(r => r.startsWith('ERROR') || r.startsWith('FATAL')).length;
console.log(`slices=${allSlices.length} files=${files.length} sources=${sources.length} reportLines=${report.length} errors=${errs}`);
console.log(`compiled ${(JSON.stringify(out).length / 1024).toFixed(0)}KB -> data/compiled.json + web/compiled.json`);
