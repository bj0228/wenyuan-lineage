import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assets = path.join(root, 'docs/figures/figure2-assets');
const output = path.join(root, 'docs/figures/figure2-demonstration-horizontal.png');

const W = 3200;
const H = 1800;
const leftX = 42;
const leftW = 1250;
const rightX = 1326;
const rightW = 1832;
const topY = 36;
const topH = 780;
const bottomY = 850;
const bottomH = 910;
const headerH = 82;

const palette = {
  bg: '#f7f3e9',
  paper: '#fffdf8',
  ink: '#2e2923',
  muted: '#756b5f',
  line: '#d8ccb8',
  red: '#a34836',
  teal: '#4f746d',
  violet: '#66518f',
  gold: '#ad7a36',
};

function esc(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function header(x, y, width, letter, title, subtitle, accent) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="${headerH}" rx="22" fill="#f3ede1"/>
    <rect x="${x}" y="${y}" width="12" height="${headerH}" rx="6" fill="${accent}"/>
    <rect x="${x + 24}" y="${y + 16}" width="52" height="50" rx="14" fill="${accent}"/>
    <text x="${x + 50}" y="${y + 51}" text-anchor="middle" font-size="30" font-weight="700" fill="white">${letter}</text>
    <text x="${x + 94}" y="${y + 43}" font-size="38" font-weight="700" fill="${palette.ink}">${esc(title)}</text>
    <text x="${x + 96}" y="${y + 69}" font-size="20" font-weight="500" fill="${palette.muted}" letter-spacing="0.5">${esc(subtitle)}</text>`;
}

function panel(x, y, width, height) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="26" fill="${palette.paper}" stroke="${palette.line}" stroke-width="2" filter="url(#shadow)"/>`;
}

function frame(x, y, width, height, label, accent) {
  const labelWidth = Math.max(150, 24 + label.length * 13);
  return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="#f3eee3" stroke="${palette.line}" stroke-width="2"/>
    <rect x="${x + 16}" y="${y + 14}" width="${labelWidth}" height="38" rx="19" fill="${accent}" opacity="0.94"/>
    <text x="${x + 16 + labelWidth / 2}" y="${y + 40}" text-anchor="middle" font-size="20" font-weight="700" fill="white" letter-spacing="1.2">${esc(label.toUpperCase())}</text>`;
}

async function rounded(file, width, height, fit = 'cover', position = 'centre') {
  const radius = 16;
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="white"/></svg>`);
  return sharp(file)
    .resize(width, height, { fit, position, background: '#f1ebdf' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="9" stdDeviation="12" flood-color="#5d4d39" flood-opacity="0.13"/>
    </filter>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.red}"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="${palette.bg}"/>

  ${panel(leftX, topY, leftW, topH)}
  ${panel(leftX, bottomY, leftW, bottomH)}
  ${panel(rightX, topY, rightW, topH)}
  ${panel(rightX, bottomY, rightW, bottomH)}

  ${header(leftX, topY, leftW, 'a', 'Situated encounter', 'WORLD OF THE MASTERS', palette.red)}
  ${header(leftX, bottomY, leftW, 'b', 'Spatiotemporal lineage', 'PLACE, PERIOD, AND RELATION', palette.teal)}
  ${header(rightX, topY, rightW, 'c', 'Evidence-grounded debate', 'HUNDRED SCHOOLS · RESPONSE + SOURCE', palette.violet)}
  ${header(rightX, bottomY, rightW, 'd', 'Cross-world motif', 'DISCIPLINE AND FREEDOM', palette.gold)}

  ${frame(66, 136, 918, 640, 'living world', palette.red)}
  ${frame(1006, 136, 262, 640, 'persona', palette.red)}

  ${frame(66, 950, 1202, 350, 'geography', palette.teal)}
  ${frame(66, 1322, 1202, 408, 'lineage scroll', palette.teal)}

  ${frame(1350, 136, 884, 360, 'debate scene', palette.violet)}
  ${frame(2256, 136, 878, 360, 'cited evidence', palette.violet)}
  ${frame(1350, 518, 1784, 258, 'generated response', palette.violet)}

  <path d="M 2198 316 C 2230 316, 2230 316, 2252 316" fill="none" stroke="${palette.violet}" stroke-width="5" opacity="0.65" marker-end="url(#arrow-red)"/>

  ${frame(1350, 950, 1784, 132, 'shared object', palette.gold)}
  <text x="1378" y="1047" font-size="42" font-weight="700" fill="${palette.ink}">规训与自由</text>
  <text x="1640" y="1047" font-size="30" font-weight="600" fill="${palette.gold}">Discipline and Freedom</text>
  <line x1="1950" y1="1037" x2="3090" y2="1037" stroke="${palette.gold}" stroke-width="3" opacity="0.35"/>
  ${frame(1350, 1104, 550, 626, 'pre-qin strategist', palette.gold)}
  ${frame(1922, 1104, 550, 626, 'tang emperor', palette.gold)}
  ${frame(2494, 1104, 640, 626, 'western poet', palette.gold)}

  <circle cx="1292" cy="425" r="20" fill="${palette.bg}" stroke="${palette.red}" stroke-width="3"/>
  <path d="M 1282 425 L 1302 425 M 1296 418 L 1303 425 L 1296 432" fill="none" stroke="${palette.red}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="1292" cy="1294" r="20" fill="${palette.bg}" stroke="${palette.teal}" stroke-width="3"/>
  <path d="M 1282 1294 L 1302 1294 M 1296 1287 L 1303 1294 L 1296 1301" fill="none" stroke="${palette.teal}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const placements = [
  { file: 'world.png', x: 82, y: 198, w: 886, h: 560, fit: 'cover' },
  { file: 'world-persona.png', x: 1022, y: 198, w: 230, h: 560, fit: 'cover', position: 'top' },
  { file: 'map.png', x: 82, y: 1012, w: 1170, h: 272, fit: 'cover' },
  { file: 'lineage-scroll.png', x: 82, y: 1384, w: 1170, h: 330, fit: 'cover' },
  { file: 'debate-stage.png', x: 1366, y: 198, w: 852, h: 282, fit: 'cover' },
  { file: 'debate-evidence.png', x: 2272, y: 198, w: 846, h: 282, fit: 'cover', position: 'top' },
  { file: 'debate-answer.png', x: 1366, y: 566, w: 1752, h: 194, fit: 'cover', position: 'centre' },
  { file: 'motif-suqin.png', x: 1366, y: 1166, w: 518, h: 548, fit: 'contain', position: 'top' },
  { file: 'motif-tang.png', x: 1938, y: 1166, w: 518, h: 548, fit: 'contain', position: 'top' },
  { file: 'motif-dante.png', x: 2510, y: 1166, w: 608, h: 548, fit: 'contain', position: 'top' },
];

const composites = [{ input: Buffer.from(svg), left: 0, top: 0 }];
for (const p of placements) {
  composites.push({
    input: await rounded(path.join(assets, p.file), p.w, p.h, p.fit, p.position ?? 'centre'),
    left: p.x,
    top: p.y,
  });
}

await sharp({ create: { width: W, height: H, channels: 4, background: palette.bg } })
  .composite(composites)
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(output);
