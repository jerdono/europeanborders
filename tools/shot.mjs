// Screenshot a local page with Playwright: node tools/shot.mjs <file.html> <out.png> [w] [h] [waitMs]
import { chromium } from 'playwright';
import { statSync } from 'node:fs';
import path from 'node:path';

const [, , file, out, w = 1600, h = 1200, waitMs = 1500] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on('console', m => { if (m.type() === 'error') console.error('[console.error]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto('file://' + path.resolve(file));
await page.waitForTimeout(+waitMs);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log('saved', out, statSync(out).size, 'bytes');
