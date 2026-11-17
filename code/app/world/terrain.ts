import { regions, worldXZ } from "./regions";
import { modelMeta } from "../scene/modelMeta";

/**
 * 地形高度 —— 场景里一切"贴地"的东西都查这里:人物站立高度、点击落位、
 * 驰道缎带、河面。
 *
 * **这套公式与 `zhuzi-world-blender/pipeline/world_env.py` 的 `terrain_h` 逐字对齐。**
 * 那边按同一公式把地形烘成了 `public/models/world_env.glb`,此处若与之不符,
 * 人物就会浮在半空或陷进土里。改一处必改两处(Python 那份是出处)。
 *
 * 比早先那版多了两件事:
 * - **远山封顶**。原来是 `(d−42)*0.2` 一路往上,地形放到 200 见方之后
 *   边上会长出一堵天;现下封到 15,再加两道低频起伏,山脊才有高低错落。
 * - **河谷下切**。原来河是一张固定高度的缎带铺在起伏的地上,地高处河水钻进土里、
 *   地低处河床悬成一道墙。现下河先在地形上刻出谷,水面再按河床逐点走。
 */

/** 河心控制点(three 的 x/z),两端放到 ±100 之外,免得河在画内断流 */
const RIVER_CTRL: [number, number][] = [
  [-104, -46], [-78, -32], [-52, -18], [-24, -6], [-2, 2],
  [18, 8], [40, 22], [54, 34], [76, 52], [104, 74],
];
const RIVER_W = 4.2;   // 水面半宽
const BANK_R = 11.0;   // 河谷外缘:自此向内渐次下切
const DEPTH = 1.55;    // 河床比原地面低多少
const WATER_D = 0.95;  // 水深(水面比河床高多少)

/** 均匀 Catmull-Rom,端点各复制一次。与 Python 侧的 catmull 同形。 */
function catmull(pts: [number, number][], n: number): [number, number][] {
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  const segs = pts.length - 1;
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * segs;
    const k = Math.min(Math.floor(t), segs - 1);
    const u = t - k;
    const u2 = u * u;
    const u3 = u2 * u;
    const [p0, p1, p2, p3] = [P[k], P[k + 1], P[k + 2], P[k + 3]];
    out.push([0, 1].map((j) =>
      0.5 * (2 * p1[j]
        + (-p0[j] + p2[j]) * u
        + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2
        + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)
    ) as [number, number]);
  }
  return out;
}

const RIVER_PTS = catmull(RIVER_CTRL, 260);

/** 基址中心与整平内外半径。半径出自 modelMeta（由 Blender 导出时生成）。 */
const SITES = regions.map((r) => {
  const [fx, fz] = worldXZ(r.x, r.y);
  const m = modelMeta[r.id];
  return { fx, fz, ri: m ? m.flatIn : 7, ro: m ? m.flatOut : 15 };
});

function smooth(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** 到河心线的距离与最近采样点序号 */
function riverNear(x: number, z: number): [number, number] {
  let best = Infinity;
  let bi = 0;
  for (let i = 0; i < RIVER_PTS.length; i++) {
    const dx = x - RIVER_PTS[i][0];
    const dz = z - RIVER_PTS[i][1];
    const d = dx * dx + dz * dz;
    if (d < best) {
      best = d;
      bi = i;
    }
  }
  return [Math.sqrt(best), bi];
}

/** 河谷下切量:河心满额,到 BANK_R 平滑收零,免得谷缘出现折痕 */
function carve(d: number) {
  if (d >= BANK_R) return 0;
  if (d <= RIVER_W) return DEPTH;
  return DEPTH * (1 - smooth((d - RIVER_W) / (BANK_R - RIVER_W)));
}

/** 未计河谷的原地形:低频起伏 + 边缘远山 + 基址压平 */
export function baseHeight(x: number, z: number) {
  let h =
    Math.sin(x * 0.055) * Math.cos(z * 0.048) * 1.9 +
    Math.sin(x * 0.13 + 1.2) * Math.cos(z * 0.11) * 0.75 +
    Math.sin((x + z) * 0.02) * 1.2;
  const d = Math.hypot(x, z);
  if (d > 42) {
    const rise = Math.min(15, (d - 42) * 0.26);
    const a = Math.atan2(z, x);
    h += rise * (1 + 0.3 * Math.sin(a * 3) + 0.18 * Math.sin(a * 7 + 2.1));
  }
  // 基址压平:整平圈按各座占地来,大院子就平一大片
  for (const s of SITES) {
    const fd = Math.hypot(x - s.fx, z - s.fz);
    if (fd < s.ro) h *= Math.min(1, Math.max(0.06, (fd - s.ri) / (s.ro - s.ri)));
  }
  return h;
}

/** 地面高度：点击落位、人物站立高度与实际地形一致 */
export function terrainHeight(x: number, z: number) {
  return baseHeight(x, z) - carve(riverNear(x, z)[0]);
}

/** 水面高度:贴着被挖低的河床走,故不会浮也不会沉 */
export function riverSurfaceY(x: number, z: number) {
  const [, i] = riverNear(x, z);
  const [rx, rz] = RIVER_PTS[i];
  return baseHeight(rx, rz) - DEPTH + WATER_D;
}
