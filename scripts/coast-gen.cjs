const fs = require("fs");

// 窗口：lon [-100,50]、上缘 70N，下缘由墨卡托自己定（约 38.9S）——与
// app/world/atlantic-coast.ts 里已出的那一版同窗，改窗须经 env 覆盖后重出整份数据，
// 否则脚本与数据各说各的。
//
// 曾试过收到欧洲一隅（lon[-26,34]、62N–24N，即波特兰海图历来真画的那一块），
// 岸线能放大两倍半；但《月界旅行》泊在佛罗里达（西经 82°），收窗即落到图外，
// 故仍取全景。欲再试，跑 `LON0=-26 LON1=34 LAT_TOP=62 H=818 node scripts/coast-gen.cjs`。
const LON0 = +process.env.LON0 || -100, LON1 = +process.env.LON1 || 50;
const W = +process.env.W || 900, H = +process.env.H || 850;
const LAT_TOP = +process.env.LAT_TOP || 70;
const K = W / ((LON1 - LON0) * Math.PI / 180);
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const Y0 = K * mercY(LAT_TOP);
const LAT_MIN = (() => { // 反解底边纬度
  const t = (Y0 - H) / K;
  return (2 * Math.atan(Math.exp(t)) - Math.PI / 2) * 180 / Math.PI;
})();
const px = (lon) => (lon - LON0) * (Math.PI / 180) * K;
const py = (lat) => Y0 - K * mercY(Math.max(-85, Math.min(85, lat)));

console.error("lat range", LAT_TOP, LAT_MIN.toFixed(2), "K", K.toFixed(2));

// —— 经纬窗裁剪（Sutherland–Hodgman，在经纬度空间做）——
function clip(poly, inside, intersect) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[(i + poly.length - 1) % poly.length], b = poly[i];
    const ia = inside(a), ib = inside(b);
    if (ib) { if (!ia) out.push(intersect(a, b)); out.push(b); }
    else if (ia) out.push(intersect(a, b));
  }
  return out;
}
const PAD = 2;
function clipRing(ring) {
  let r = ring;
  const edges = [
    [(p) => p[0] >= LON0 - PAD, (a, b) => { const t = (LON0 - PAD - a[0]) / (b[0] - a[0]); return [LON0 - PAD, a[1] + (b[1] - a[1]) * t]; }],
    [(p) => p[0] <= LON1 + PAD, (a, b) => { const t = (LON1 + PAD - a[0]) / (b[0] - a[0]); return [LON1 + PAD, a[1] + (b[1] - a[1]) * t]; }],
    [(p) => p[1] <= LAT_TOP + PAD, (a, b) => { const t = (LAT_TOP + PAD - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, LAT_TOP + PAD]; }],
    [(p) => p[1] >= LAT_MIN - PAD, (a, b) => { const t = (LAT_MIN - PAD - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, LAT_MIN - PAD]; }],
  ];
  for (const [ins, itx] of edges) { r = clip(r, ins, itx); if (!r.length) return []; }
  return r;
}

// —— 道格拉斯-普克化简（在屏幕像素空间）——
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let max = 0, idx = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
/** 闭环化简：首尾同点时 RDP 的基线退化，须先在环上找一对最远点断开成两段 */
function simplifyRing(pts, eps) {
  const a = pts[0];
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]);
    if (d > fd) { fd = d; far = i; }
  }
  if (far < 2) return pts;
  const s1 = rdp(pts.slice(0, far + 1), eps);
  const s2 = rdp(pts.slice(far), eps);
  return [...s1.slice(0, -1), ...s2.slice(0, -1)];
}
const area = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
const fmt = (n) => (Math.round(n * 10) / 10).toString();

const gj = JSON.parse(fs.readFileSync(process.argv[2] || "/tmp/ne50_land.json", "utf8"));
const rings = [];
for (const f of gj.features) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) {
    for (let r = 0; r < poly.length; r++) {       // 0 外环，其余为内环（湖）——此处只取外环
      if (r > 0) continue;
      const cl = clipRing(poly[r].map((p) => [p[0], p[1]]));
      if (cl.length < 4) continue;
      let pts = cl.map(([lon, lat]) => [px(lon), py(lat)]);
      pts = simplifyRing(pts, Number(process.argv[3] || 0.55));
      if (pts.length < 4) continue;
      const A = area(pts);
      if (A < 6) continue;
      rings.push({ A, d: "M" + pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join("L") + "Z" });
    }
  }
}
rings.sort((a, b) => b.A - a.A);
console.error("rings:", rings.length, "bytes:", rings.reduce((s, r) => s + r.d.length, 0));
fs.writeFileSync("/tmp/coast_out.json", JSON.stringify({ latMin: LAT_MIN, K, Y0, rings: rings.map((r) => ({ a: Math.round(r.A), d: r.d })) }, null, 0));
console.error("top areas:", rings.slice(0, 12).map((r) => Math.round(r.A)).join(","));
