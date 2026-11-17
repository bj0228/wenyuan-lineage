import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const W = 3200;
const H = 1350;
const purple = '#6f159e';
const purple2 = '#9d72d0';
const blue = '#6aaee8';
const dark = '#25232a';
const line = '#49474b';
const paleBlue = '#edf7ff';
const palePurple = '#f4ecfb';
const paleRose = '#fff1f7';

const sourceV4 = fileURLToPath(new URL('../docs/figures/figure1-system-overview-v4.png', import.meta.url));
const portraitData = await Promise.all([
  { left: 130, top: 804, width: 230, height: 118 },
  { left: 415, top: 804, width: 230, height: 118 },
  { left: 700, top: 804, width: 230, height: 118 },
].map((crop) => sharp(sourceV4)
  .extract(crop)
  .png()
  .toBuffer()
  .then((buffer) => buffer.toString('base64'))));

const out = [];
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rect = (x,y,w,h,fill='white',stroke=purple,sw=3,r=24,extra='') => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`);
const text = (x,y,s,size=42,weight=500,anchor='middle',fill=dark,extra='') => out.push(`<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}" ${extra}>${esc(s)}</text>`);
const lines = (x,y,arr,size=38,weight=600,anchor='middle',fill=dark,gap=1.08) => arr.forEach((s,i)=>text(x,y+i*size*gap,s,size,weight,anchor,fill));
const arrow = (x1,y1,x2,y2,sw=7,color=line) => out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" marker-end="url(#arrow)"/>`);
const bookIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M0 8 Q28 -2 52 14 V62 Q28 48 0 58 Z"/><path d="M104 8 Q76 -2 52 14 V62 Q76 48 104 58 Z"/><line x1="52" y1="14" x2="52" y2="62"/></g>`);
const pinIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6"><path d="M44 3 C20 3 8 19 8 38 C8 63 44 91 44 91 C44 91 80 63 80 38 C80 19 68 3 44 3 Z"/><circle cx="44" cy="37" r="12"/></g>`);
const calendarIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6" stroke-linecap="round"><rect x="3" y="12" width="88" height="70" rx="8"/><line x1="3" y1="34" x2="91" y2="34"/><line x1="25" y1="2" x2="25" y2="22"/><line x1="69" y1="2" x2="69" y2="22"/></g>`);
const chatIcon = (x,y,s=1,q=false) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6" stroke-linejoin="round"><path d="M4 5 H92 V58 H48 L25 78 V58 H4 Z"/>${q?'<text x="48" y="48" font-family="Arial" font-size="44" font-weight="700" text-anchor="middle" fill="'+purple+'" stroke="none">?</text>':'<circle cx="31" cy="32" r="4" fill="'+purple+'"/><circle cx="48" cy="32" r="4" fill="'+purple+'"/><circle cx="65" cy="32" r="4" fill="'+purple+'"/>'}</g>`);
const groupIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6"><circle cx="48" cy="20" r="14"/><circle cx="15" cy="30" r="11"/><circle cx="81" cy="30" r="11"/><path d="M20 73 C20 49 76 49 76 73"/><path d="M-2 67 C-2 49 30 47 34 58"/><path d="M98 67 C98 49 66 47 62 58"/></g>`);
const networkIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" stroke="${purple}" stroke-width="6" fill="white"><line x1="48" y1="12" x2="13" y2="67"/><line x1="48" y1="12" x2="83" y2="67"/><line x1="13" y1="67" x2="83" y2="67"/><circle cx="48" cy="12" r="10"/><circle cx="13" cy="67" r="10"/><circle cx="83" cy="67" r="10"/></g>`);
const docIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6"><rect x="6" y="2" width="72" height="88" rx="8"/><line x1="22" y1="26" x2="62" y2="26"/><line x1="22" y1="45" x2="62" y2="45"/><line x1="22" y1="64" x2="55" y2="64"/></g>`);
const templeIcon = (x,y,s=1) => out.push(`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${purple}" stroke-width="6" stroke-linecap="round"><path d="M4 30 L48 5 L92 30 Z"/><line x1="12" y1="82" x2="84" y2="82"/><line x1="5" y1="92" x2="91" y2="92"/><line x1="22" y1="35" x2="22" y2="80"/><line x1="48" y1="35" x2="48" y2="80"/><line x1="74" y1="35" x2="74" y2="80"/></g>`);

out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
out.push(`<defs><linearGradient id="head" x1="0" x2="1"><stop stop-color="#ead9f8"/><stop offset="0.52" stop-color="#d8c2f0"/><stop offset="1" stop-color="#e8d5f5"/></linearGradient><linearGradient id="soft" x1="0" x2="1"><stop stop-color="#f2eafa"/><stop offset="1" stop-color="#edf7ff"/></linearGradient><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#5e3c72" flood-opacity=".15"/></filter><marker id="arrow" markerWidth="16" markerHeight="16" refX="12" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L12,6 L0,12 Z" fill="${line}"/></marker></defs>`);
out.push(`<rect width="${W}" height="${H}" fill="#ffffff"/>`);

const panels = [{x:30,w:1010,title:'(a) Spatiotemporal Lineage Organization'},{x:1095,w:1010,title:'(b) Triple-Constrained Cultural Agents'},{x:2160,w:1010,title:'(c) Object-Driven Multi-Role Interaction'}];
for (const p of panels) {
  rect(p.x,30,p.w,1170,'#ffffff','#2f2d32',4,38,'stroke-dasharray="14 10"');
  rect(p.x+22,50,p.w-44,92,'url(#head)','none',0,40);
  text(p.x+p.w/2,112,p.title,47,700);
}

// Panel A
rect(75,180,445,110,paleBlue,blue,3,24); bookIcon(92,210,.62); text(350,246,'Chinese Texts (1,019)',33,700);
rect(550,180,445,110,paleBlue,blue,3,24); bookIcon(567,210,.62); text(825,246,'Western Works (78)',33,700);
arrow(300,305,300,365,6); arrow(770,305,770,365,6);
rect(75,375,445,105,palePurple,purple2,3,22); text(315,420,'Historical',32,500); text(315,458,'Timeline',39,700);
out.push(`<line x1="110" y1="442" x2="198" y2="442" stroke="${purple}" stroke-width="5"/><circle cx="130" cy="442" r="8" fill="white" stroke="${purple}" stroke-width="4"/><circle cx="176" cy="442" r="8" fill="white" stroke="${purple}" stroke-width="4"/>`);
rect(550,375,445,105,palePurple,purple2,3,22); pinIcon(590,385,.7); text(790,438,'Geographic Map',38,700);

// lineage graph
out.push(`<g stroke-width="9" fill="none" stroke-linecap="round"><line x1="245" y1="660" x2="130" y2="570" stroke="#7b55bf"/><line x1="245" y1="660" x2="125" y2="755" stroke="#ef8fbc"/><line x1="245" y1="660" x2="360" y2="552" stroke="#7b55bf"/><line x1="245" y1="660" x2="390" y2="680" stroke="#7ab8e8"/><line x1="245" y1="660" x2="345" y2="790" stroke="#a981d5"/></g>`);
for (const [cx,cy,c] of [[245,660,purple],[130,570,'#7ab8e8'],[125,755,'#ef8fbc'],[360,552,'#ef8fbc'],[390,680,'#a981d5'],[345,790,'#7ab8e8']]) { out.push(`<circle cx="${cx}" cy="${cy}" r="52" fill="white" stroke="${c}" stroke-width="6"/>`); bookIcon(cx-30,cy-20,.58); }
text(690,535,'Seven Reviewed Relations',40,700);
const rels=[['Exegetical Commentary','#7f2cb2'],['Intellectual Inheritance','#bfa8e8'],['Textual Borrowing','#77b9e8'],['Critique','#e993bf'],['Canonical Pairing','#c8afe9'],['Continuation','#aa82d5'],['False Ascription','#ef9bd7']];
rels.forEach(([name,c],i)=>{const x=500,y=580+i*45; out.push(`<circle cx="${x}" cy="${y}" r="10" fill="${c}"/>`); text(x+22,y+8,name,21,600,'start');});
rect(72,905,925,112,'url(#soft)',blue,3,23); text(534,953,'Direction  •  Evidence  •  Provenance',34,700); text(534,994,'Confidence  •  Review Status',34,700);
rect(120,1055,825,90,palePurple,purple2,3,45); text(532,1111,'Inspect an evidence-bearing lineage',35,700);

// Panel B
const bx=[1128,1454,1780];
for (let i=0;i<3;i++) rect(bx[i],180,290,120,paleBlue,blue,3,22);
docIcon(1148,203,.58); lines(1288,228,['Textual','Evidence'],29,700);
networkIcon(1470,207,.55); lines(1615,228,['Reviewed','Lineage'],29,700);
templeIcon(1794,205,.55); lines(1948,228,['Spatiotemporal','World'],26,700);
arrow(1273,315,1550,420,5); arrow(1599,315,1599,420,5); arrow(1925,315,1650,420,5);
rect(1270,430,655,125,'url(#head)',purple,5,28,'filter="url(#shadow)"'); text(1598,506,'Cultural Persona Agent',48,700);
arrow(1598,560,1598,645,6);
const cons=[['Knowledge','Boundary'],['Temporal','Reachability'],['Geographic','Context']];
cons.forEach((arr,i)=>{const x=1130+i*325; rect(x,655,290,104,palePurple,purple2,3,20); lines(x+145,697,arr,30,700);});
// Persona cards
const persons=['Mencius','Rousseau','Marx'];
persons.forEach((name,i)=>{const x=1180+i*320; rect(x,805,255,205,'#fbf7fd',purple2,3,28); out.push(`<image x="${x+17}" y="817" width="221" height="113" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${portraitData[i]}"/>`); text(x+128,975,name,35,700);});
rect(1170,1055,855,90,palePurple,purple2,3,45); text(1598,1093,'Identity  •  Time  •  Region  •  Knowledge',30,700); text(1598,1128,'are checked before generation',28,600);

// Panel C
const ox=[2195,2517,2839];
for (let i=0;i<3;i++) rect(ox[i],180,295,120,paleBlue,blue,3,22);
bookIcon(2215,213,.55); text(2395,252,'Text',34,700);
calendarIcon(2535,210,.55); lines(2720,229,['Historical &','Contemporary Event'],20,700);
out.push(`<g transform="translate(2860 213) scale(.58)"><path d="M0 58 C25 19 63 25 66 56 C92 26 133 35 127 70 C122 100 83 100 63 77 C43 102 1 95 0 58 Z" fill="none" stroke="${purple}" stroke-width="8"/></g>`); text(3035,252,'Cultural Motif',27,700);
arrow(2342,315,2342,390,5); arrow(2665,315,2665,390,5); arrow(2987,315,2987,390,5);
for (let i=0;i<3;i++) rect(ox[i],400,295,135,palePurple,purple2,3,24);
chatIcon(2217,430,.52); lines(2388,455,['Independent','Commentary'],28,700);
chatIcon(2535,429,.52,true); lines(2710,455,['Directed','Questioning'],28,700);
groupIcon(2854,430,.52); lines(3028,455,['Multi-Persona','Discussion'],26,700);
arrow(2342,550,2665,630,5); arrow(2665,550,2665,630,5); arrow(2987,550,2665,630,5);
rect(2255,640,820,405,'white',purple,6,30,'filter="url(#shadow)"'); rect(2257,642,816,84,'url(#head)','none',0,27); text(2665,699,'Traceable Response',45,700);
const trace=[['“','Supporting Passages'],['↗','Lineage Relations'],['文','Translation'],['✓','Consistency Assessment (LLM Judge)']];
trace.forEach(([ic,label],i)=>{const y=758+i*68; rect(2300,y,730,54,paleBlue,blue,2,16); text(2365,y+40,ic,38,700,'middle',purple); text(2700,y+38,label,i===3?26:31,700);});
rect(2240,1055,850,90,palePurple,purple2,3,45); text(2665,1111,'Read the answer together with its grounds',31,700);

// Inter-panel arrows and workflow
arrow(1048,615,1080,615,8); arrow(2113,615,2145,615,8);
rect(30,1230,3140,90,'url(#soft)',purple,4,45);
text(1600,1288,'Explore Texts   →   Trace Lineages   →   Select an Object   →   Engage Personas   →   Inspect Evidence',39,700,'middle',purple);
out.push('</svg>');

const svg = out.join('');
const base = fileURLToPath(new URL('../docs/figures/figure1-system-overview-v4-horizontal', import.meta.url));
await fs.writeFile(`${base}.svg`, svg);
await sharp(Buffer.from(svg)).png({compressionLevel:9, quality:100}).toFile(`${base}.png`);
console.log(`Wrote ${base}.svg and .png`);
