import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../docs/figures/figure1-system-overview-v3.png', import.meta.url));
const output = fileURLToPath(new URL('../docs/figures/figure1-system-overview-v3-updated.png', import.meta.url));
const svgOutput = fileURLToPath(new URL('../docs/figures/figure1-system-overview-v3-updated-overlay.svg', import.meta.url));
const W = 1837;
const H = 856;
const purple = '#6f159e';
const dark = '#17151a';
const line = '#4b494d';
const paleBlue = '#edf7ff';
const palePurple = '#f4ecfb';

const out = [];
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rect = (x,y,w,h,fill,stroke='none',sw=0,r=0) => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
const text = (x,y,value,size=24,weight=600,anchor='middle',fill=dark) => out.push(`<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${esc(value)}</text>`);
const twoLines = (x,y,a,b,size=20,weight=600,gap=24) => { text(x,y,a,size,weight); text(x,y+gap,b,size,weight); };

out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
out.push(`<defs><linearGradient id="purpleHead" x1="0" x2="1"><stop stop-color="#e9daf7"/><stop offset=".55" stop-color="#d7c2ef"/><stop offset="1" stop-color="#eadcf7"/></linearGradient><linearGradient id="flow" x1="0" x2="1"><stop stop-color="#faf3ff"/><stop offset="1" stop-color="#e9e0fa"/></linearGradient></defs>`);

// (a) Preserve the original scroll and network; update only the module semantics.
rect(54,20,486,46,'#ffffff');
text(297,52,'(a) Spatiotemporal Lineage Organization',25,700);

rect(122,84,330,31,'#e7d9f5');
text(287,108,'Timeline & Geographic Map',23,700);
out.push(`<g transform="translate(446 91) scale(.42)" fill="none" stroke="${purple}" stroke-width="6"><path d="M44 3 C20 3 8 19 8 38 C8 63 44 91 44 91 C44 91 80 63 80 38 C80 19 68 3 44 3 Z"/><circle cx="44" cy="37" r="12"/></g>`);

rect(126,233,137,58,paleBlue);
twoLines(195,257,'Chinese Texts','(1,019)',20,600,23);
rect(381,233,135,58,paleBlue);
twoLines(448,257,'Western Works','(78)',20,600,23);

rect(39,505,482,153,'#ffffff');
rect(132,510,314,38,'#e6d8f4');
text(289,538,'Seven Reviewed Relations',22,700);
const legendItems = [
  [45,554,150,'Exegesis','#7d2aaa'],
  [204,554,150,'Inheritance','#c7afe8'],
  [363,554,155,'Borrowing','#82bde8'],
  [80,592,170,'Critique','#ea99c2'],
  [270,592,170,'Pairing','#c7afe8'],
  [80,630,170,'Continuation','#82bde8'],
  [270,630,190,'False Ascription','#ef9ad4']
];
for (const [x,y,w,label,color] of legendItems) {
  rect(x,y,w,30,'#f5eefb','none',0,15);
  out.push(`<circle cx="${x+17}" cy="${y+15}" r="9" fill="${color}"/>`);
  text(x+w/2+8,y+21,label,15,600);
}

// (b) Preserve the three original portraits and update the constraint vocabulary.
rect(675,105,122,56,paleBlue);
twoLines(736,126,'Textual','Evidence',21,600,24);
rect(675,213,122,56,paleBlue);
twoLines(736,234,'Reviewed','Lineage',20,600,24);
rect(675,320,122,59,paleBlue);
twoLines(736,341,'Spatiotemporal','World',18,600,23);

rect(898,183,247,160,'#d7c4ea');
twoLines(1022,247,'Cultural Persona','Agent',30,700,40);

rect(803,410,376,51,'#ffffff');
const constraintPills = [
  [804,412,119,'Knowledge'], [934,412,116,'Time'], [1061,412,118,'Region']
];
for (const [x,y,w,label] of constraintPills) {
  rect(x,y,w,46,'#eadcf5','#c29be3',2,18);
  text(x+w/2,y+30,label,19,500);
}

// (c) Keep the original three-column interaction structure and update its objects and actions.
rect(1298,106,103,58,paleBlue);
text(1350,143,'Text',24,600);
rect(1480,101,111,67,paleBlue);
twoLines(1536,126,'Historical &', 'Contemporary Event',15,600,20);
rect(1690,102,104,66,paleBlue);
twoLines(1742,128,'Cultural','Motif',21,600,24);

rect(1242,326,165,70,palePurple);
twoLines(1325,350,'Independent','Commentary',18,600,22);
rect(1427,326,156,70,palePurple);
twoLines(1505,350,'Directed','Questioning',18,600,22);
rect(1617,326,175,70,palePurple);
twoLines(1705,350,'Multi-Persona','Discussion',17,600,22);

// Redraw the traceable-response card with the four current evidence channels.
rect(1254,457,532,221,'#ffffff',purple,4,20);
rect(1257,460,526,52,'url(#purpleHead)','none',0,17);
text(1520,496,'Traceable Response',29,700);
const traceRows = [
  ['“','Supporting Passages'],
  ['↗','Lineage Relations'],
  ['文','Translation'],
  ['✓','Consistency Assessment (LLM Judge)']
];
traceRows.forEach(([icon,label],i)=>{
  const y=520+i*38;
  rect(1285,y,442,31,paleBlue,'#8bc4ee',1.5,9);
  text(1330,y+24,icon,25,700,'middle',purple);
  text(1518,y+23,label,i===3?17:20,600);
});

// Preserve the horizontal visual grammar while making the workflow names explicit.
rect(14,716,1808,58,'url(#flow)',purple,3,29);
text(918,753,'Explore Texts   →   Trace Lineages   →   Select an Object   →   Engage Personas   →   Inspect Evidence',25,700,'middle',purple);

out.push('</svg>');
const overlay = out.join('');
await fs.writeFile(svgOutput, overlay);
await sharp(source)
  .composite([{ input: Buffer.from(overlay), left: 0, top: 0 }])
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(output);
console.log(`Wrote ${output}`);
