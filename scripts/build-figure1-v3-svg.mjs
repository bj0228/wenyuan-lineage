import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const figures = path.join(root, 'docs/figures');
const basePath = path.join(figures, 'figure1-system-overview-v3.png');
const overlayPath = path.join(figures, 'figure1-system-overview-v3-updated-overlay.svg');
const outputPath = path.join(figures, 'figure1-system-overview-v3-updated.svg');
const pngPath = path.join(figures, 'figure1-system-overview-v3-updated.png');

const base64 = fs.readFileSync(basePath).toString('base64');
const overlay = fs.readFileSync(overlayPath, 'utf8');
const inner = overlay
  .replace(/^\s*<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replaceAll('False Ascription', 'Attribution')
  .replaceAll('Contemporary Event', 'Modern Events');

const finalUpdate = `
  <g id="precise-agent-constraints">
    <rect x="804" y="412" width="119" height="46" rx="18" fill="#eadcf5" stroke="#c29be3" stroke-width="2"/>
    <text x="863.5" y="431" font-family="Arial, Helvetica, sans-serif" font-size="13.5" font-weight="600" text-anchor="middle" fill="#17151a">Knowledge</text>
    <text x="863.5" y="447" font-family="Arial, Helvetica, sans-serif" font-size="13.5" font-weight="600" text-anchor="middle" fill="#17151a">Boundary</text>
    <rect x="934" y="412" width="116" height="46" rx="18" fill="#eadcf5" stroke="#c29be3" stroke-width="2"/>
    <text x="992" y="431" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#17151a">Temporal</text>
    <text x="992" y="447" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#17151a">Reachability</text>
    <rect x="1061" y="412" width="118" height="46" rx="18" fill="#eadcf5" stroke="#c29be3" stroke-width="2"/>
    <text x="1120" y="431" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#17151a">Geographic</text>
    <text x="1120" y="447" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#17151a">Context</text>
  </g>
  <g id="llm-judge-revision-loop">
    <rect x="1254" y="457" width="532" height="240" rx="20" fill="#ffffff" stroke="#6f159e" stroke-width="4"/>
    <rect x="1257" y="460" width="526" height="52" rx="17" fill="url(#purpleHead)"/>
    <text x="1520" y="496" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="700" text-anchor="middle" fill="#17151a">Traceable Response</text>

    <rect x="1285" y="520" width="442" height="29" rx="9" fill="#edf7ff" stroke="#8bc4ee" stroke-width="1.5"/>
    <text x="1330" y="542" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#6f159e">“</text>
    <text x="1518" y="541" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600" text-anchor="middle" fill="#17151a">Supporting Passages</text>

    <rect x="1285" y="554" width="442" height="29" rx="9" fill="#edf7ff" stroke="#8bc4ee" stroke-width="1.5"/>
    <text x="1330" y="576" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" text-anchor="middle" fill="#6f159e">↗</text>
    <text x="1518" y="575" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600" text-anchor="middle" fill="#17151a">Lineage Relations</text>

    <rect x="1285" y="588" width="442" height="29" rx="9" fill="#edf7ff" stroke="#8bc4ee" stroke-width="1.5"/>
    <text x="1330" y="610" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" text-anchor="middle" fill="#6f159e">文</text>
    <text x="1518" y="609" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="600" text-anchor="middle" fill="#17151a">Translation</text>

    <rect x="1285" y="622" width="442" height="32" rx="9" fill="#f1e7fb" stroke="#9d72d0" stroke-width="1.7"/>
    <text x="1330" y="645" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#6f159e">↻</text>
    <text x="1518" y="644" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="#17151a">LLM Judge &amp; Auto-Revision</text>

    <rect x="1285" y="661" width="132" height="25" rx="12" fill="#e4f3e8"/>
    <text x="1351" y="678" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#327048">✓ → memory</text>
    <rect x="1423" y="661" width="132" height="25" rx="12" fill="#fff2d9"/>
    <text x="1489" y="678" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#9a681e">△ revise ×1</text>
    <rect x="1561" y="661" width="166" height="25" rx="12" fill="#f9e2e2"/>
    <text x="1644" y="678" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" text-anchor="middle" fill="#9b3c3c">✕ revise ×2 / safe</text>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1837" height="856" viewBox="0 0 1837 856">
  <title>Wenyuan Lineage system overview</title>
  <desc>Horizontal system overview with spatiotemporal lineage organization, triple-constrained cultural agents, and object-driven multi-role interaction.</desc>
  <image id="v3-base" x="0" y="0" width="1837" height="856" preserveAspectRatio="none" href="data:image/png;base64,${base64}"/>
  <g id="editable-v3-updates">
    ${inner}
  </g>
  ${finalUpdate}
</svg>`;

fs.writeFileSync(outputPath, svg);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngPath);
console.log(outputPath);
console.log(pngPath);
