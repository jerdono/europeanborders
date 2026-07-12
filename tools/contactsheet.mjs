// Render the map at many years for review: node tools/contactsheet.mjs out_dir year1 year2 ...
// Uses the dev server on :8077. Each shot scrubs to the slice nearest the year.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [, , outDir, ...yrs] = process.argv;
mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1600, height: 980 }, colorScheme: 'dark' });
p.on('pageerror', e => console.error('[pageerror]', e.message.slice(0, 200)));
await p.goto('http://localhost:8077/index.html');
await p.waitForTimeout(2800);
for (const y of yrs) {
  await p.evaluate(yy => window.__scrubYear(yy), +y);
  await p.waitForTimeout(650);
  await p.screenshot({ path: `${outDir}/y${String(y).replace('-', 'm')}.png` });
  console.log('shot', y);
}
await b.close();
