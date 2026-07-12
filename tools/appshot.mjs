// Screenshot the app at given tour positions: node tools/appshot.mjs out_prefix scheme pos1 pos2 ...
// pos = fraction of total tour time (0..1)
import { chromium } from 'playwright';
const [, , prefix, scheme = 'dark', ...positions] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1680, height: 1000 }, colorScheme: scheme });
p.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text().slice(0, 220)); });
p.on('pageerror', e => console.error('[pageerror]', e.message.slice(0, 300)));
await p.goto('http://localhost:8077/index.html');
await p.waitForTimeout(2600);
for (const pos of (positions.length ? positions : ['0'])) {
  await p.evaluate(f => { window.__scrub && window.__scrub(f); }, +pos);
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${prefix}_${scheme}_${pos}.png` });
}
await b.close();
console.log('done');
