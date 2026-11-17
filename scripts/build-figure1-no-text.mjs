import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const figures = path.join(root, 'docs/figures');
const source = path.join(figures, 'figure1-system-overview-v4-horizontal.svg');
const svgOutput = path.join(figures, 'figure1-framework-no-text.svg');
const pngOutput = path.join(figures, 'figure1-framework-no-text.png');

const svg = fs.readFileSync(source, 'utf8')
  .replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, '')
  .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '')
  .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g, '');

fs.writeFileSync(svgOutput, svg);
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(pngOutput);

console.log(svgOutput);
console.log(pngOutput);
