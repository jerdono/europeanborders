// Build self-contained outputs:
//   dist/index.html    — full standalone document (repo / GitHub Pages)
//   dist/artifact.html — body-content only (for the claude.ai Artifact wrapper)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

const html = readFileSync('web/index.html', 'utf8');
let css = readFileSync('web/style.css', 'utf8');
const js = readFileSync('web/app.js', 'utf8');
const geometry = readFileSync('web/geometry.json', 'utf8');
let compiled;
try { compiled = readFileSync('web/compiled.json', 'utf8'); }
catch { compiled = readFileSync('web/placeholder.json', 'utf8'); console.warn('!! compiled.json missing — built with placeholder data'); }

// inline fonts as data URIs
for (const f of ['ebg_normal_600', 'ebg_normal_500', 'ebg_italic_400']) {
  const b64 = readFileSync(`web/fonts/${f}.woff2`).toString('base64');
  css = css.replace(`url(fonts/${f}.woff2)`, `url(data:font/woff2;base64,${b64})`);
}
// drop the unused 500-italic face declaration if its file wasn't inlined
css = css.replace(/@font-face \{[^}]*ebg_italic_500[^}]*\}\n?/, '');

const bodyInner = html
  .replace(/^[\s\S]*?<body>/, '')
  .replace(/<\/body>[\s\S]*$/, '')
  .replace('<script src="app.js" type="module"></script>', '');

const dataScript = `<script>window.__GEOMETRY__=${geometry};window.__COMPILED__=${compiled};</script>`;
const appScript = `<script type="module">${js}</script>`;
const styleTag = `<style>${css}</style>`;

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Borders — Europe &amp; the Mediterranean, 3000 BCE to today</title>
${styleTag}
</head>
<body>
${bodyInner}
${dataScript}
${appScript}
</body>
</html>`;

// body-only variant for the claude.ai Artifact wrapper (title hoisted by the browser)
const artifact = `<title>Borders — Europe &amp; the Mediterranean, 3000 BCE to today</title>
${styleTag}
${bodyInner}
${dataScript}
${appScript}`;

writeFileSync('dist/index.html', full);
writeFileSync('index.html', full);
writeFileSync('dist/artifact.html', artifact);
writeFileSync('dist/borders-timeline.html', artifact);
console.log(`dist/index.html ${(full.length / 1048576).toFixed(2)}MB · dist/borders-timeline.html ${(artifact.length / 1048576).toFixed(2)}MB`);
