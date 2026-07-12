// Apply verification corrections (research/fix_*.json) to the era files in place.
// Usage: node tools/apply_fixes.mjs [--dry]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dry = process.argv.includes('--dry');
const fixes = readdirSync('research').filter(f => /^fix_.*\.json$/.test(f)).sort();
let applied = 0, skipped = 0;

for (const ff of fixes) {
  let fx;
  try { fx = JSON.parse(readFileSync('research/' + ff, 'utf8')); }
  catch (e) { console.error(`SKIP ${ff}: parse error ${e.message}`); continue; }
  const target = 'research/' + fx.file;
  let d;
  try { d = JSON.parse(readFileSync(target, 'utf8')); }
  catch (e) { console.error(`SKIP ${ff}: target ${fx.file} unreadable`); continue; }

  for (const c of fx.corrections || []) {
    if (c.confidence && !['high', 'medium'].includes(c.confidence)) { skipped++; continue; }
    const sl = d.slices.find(s => s.year === c.year);
    if (!sl) { console.error(`  ${ff}: no slice ${c.year} in ${fx.file}`); skipped++; continue; }
    for (const ent of c.addEntities || []) {
      if (!sl.entities.some(e => e.id === ent.id)) sl.entities.push(ent);
    }
    for (const id of c.removeEntities || []) {
      const e = sl.entities.find(x => x.id === id);
      if (e) { // reassignments must cover its regions; leftover regions go nowhere — flag
        if (e.regions?.length) {
          const reassigned = new Set(Object.keys(c.assign || {}));
          const orphans = e.regions.filter(r => !reassigned.has(r));
          if (orphans.length) { console.error(`  ${ff} ${c.year}: removing ${id} would orphan ${orphans.join(',')} — skipped`); skipped++; continue; }
        }
        sl.entities = sl.entities.filter(x => x.id !== id);
      }
    }
    for (const [region, newOwner] of Object.entries(c.assign || {})) {
      const to = sl.entities.find(e => e.id === newOwner);
      if (!to) { console.error(`  ${ff} ${c.year}: assign ${region}→${newOwner} but entity absent — skipped`); skipped++; continue; }
      for (const e of sl.entities) {
        const k = (e.regions || []).indexOf(region);
        if (k >= 0) e.regions.splice(k, 1);
      }
      to.regions = to.regions || []; to.regions.push(region);
      applied++;
    }
    for (const [id, patch] of Object.entries(c.update || {})) {
      const e = sl.entities.find(x => x.id === id);
      if (!e) { console.error(`  ${ff} ${c.year}: update ${id} absent — skipped`); skipped++; continue; }
      Object.assign(e, patch); applied++;
    }
    if (c.events) { sl.events = c.events; applied++; }
    if (c.label) { sl.label = c.label; applied++; }
    if (c.connectivity != null) { sl.connectivity = c.connectivity; applied++; }
  }
  for (const s of fx.sources || []) (d.sources = d.sources || []).push(s);
  if (!dry) writeFileSync(target, JSON.stringify(d, null, 1));
  console.log(`${ff}: done`);
}
console.log(`applied=${applied} skipped=${skipped}${dry ? ' (dry run)' : ''}`);
