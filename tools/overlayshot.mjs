import { chromium } from 'playwright';
const OUT = process.argv[2] || '/tmp/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
async function shot(name, scheme, year, sel) {
  const p = await b.newPage({ viewport: { width: 1600, height: 980 }, colorScheme: scheme });
  await p.goto('http://localhost:8077/index.html'); await p.waitForTimeout(2600);
  await p.evaluate(y => window.__scrubYear(y), year);
  if (sel) await p.click(sel);
  await p.waitForTimeout(700);
  await p.screenshot({ path: OUT + name }); await p.close();
  console.log('shot', name);
}
await shot('ov_cultures.png', 'dark', 1200, '.ovbtn[data-ov="cultures"]');
await shot('ov_borderage.png', 'dark', 1789, '.ovbtn[data-ov="borderage"]');
await shot('ov_pop_light.png', 'light', 1600, '.ovbtn[data-ov="population"]');
await b.close();
