"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { currentElement } from "../world/schedule";
import { tileTexture, woodTexture, plasterTexture, stoneTexture, latticeTexture, thatchTexture, tileNormal, woodNormal, stoneNormal, withRepeat } from "./textures";

/** 改明度：amount 正变亮、负变暗（同 Figure.tsx/DebateTable.tsx 之 shade） */
export function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0.02, amount);
  return `#${c.getHexString()}`;
}

/** 四角飞檐翘角姿态：绕"切向轴"上抬外角，模块级预算一次（确定性、无 random） */
const CORNER_TILTS: { sx: number; sz: number; q: THREE.Quaternion }[] = [
  { sx: -1, sz: -1, q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, -1).normalize(), 0.34) },
  { sx: 1, sz: -1, q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 1).normalize(), 0.34) },
  { sx: -1, sz: 1, q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-1, 0, -1).normalize(), 0.34) },
  { sx: 1, sz: 1, q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(-1, 0, 1).normalize(), 0.34) },
];

/** 飞檐翘角：方檐四角上翘薄板（不投影，纯几何） */
function CornerTilts({ w, d, y, color }: { w: number; d: number; y: number; color: string }) {
  const c = shade(color, -0.04);
  const ext = 0.18;
  return (
    <>
      {CORNER_TILTS.map(({ sx, sz, q }, i) => (
        <mesh key={i} position={[sx * (w / 2 + ext), y + 0.05, sz * (d / 2 + ext)]} quaternion={[q.x, q.y, q.z, q.w]}>
          <boxGeometry args={[0.5, 0.06, 0.5]} />
          <meshStandardMaterial color={c} roughness={0.82} flatShading />
        </mesh>
      ))}
    </>
  );
}

/** 宝顶：攒尖/庑殿灰瓦顶之顶饰（球＋刺＋珠），不投影 */
export function Finial({ x, y, z, color }: { x: number; y: number; z: number; color: string }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color={shade(color, 0.08)} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <coneGeometry args={[0.1, 0.32, 6]} />
        <meshStandardMaterial color={shade(color, -0.06)} roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color={shade(color, 0.12)} metalness={0.45} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** 宫灯：暖自发光球灯＋顶帽＋悬绳，暮夜在 ACES 下极出彩，不投影 */
export function Lantern({ x, y, z, color = "#e6a23c" }: { x: number; y: number; z: number; color?: string }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.4, 4]} />
        <meshStandardMaterial color="#3a3326" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.15, 14, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.15} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <coneGeometry args={[0.19, 0.16, 6]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.13, 0.1, 6]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

/** 匾额：深漆板＋金边内嵌，悬门上，不投影 */
export function Plaque({ x, y, z, w = 1.7, rot = 0, accent = "#b58a3c" }: { x: number; y: number; z: number; w?: number; rot?: number; accent?: string }) {
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh>
        <boxGeometry args={[w, 0.46, 0.09]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[w - 0.14, 0.32, 0.02]} />
        <meshStandardMaterial color={accent} metalness={0.45} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** 檐口/飞檐：主枋＋上高光板＋下压深＋四角翘起 */
export function Eave({ w, d, y, color = "#6b543a" }: { w: number; d: number; y: number; color?: string }) {
  return (
    <group>
      <mesh position={[0, y, 0]} castShadow>
        <boxGeometry args={[w, 0.32, d]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* 上高光椽板 */}
      <mesh position={[0, y + 0.2, 0]}>
        <boxGeometry args={[w + 0.22, 0.1, d + 0.22]} />
        <meshStandardMaterial color={shade(color, 0.06)} roughness={0.85} />
      </mesh>
      {/* 下压深枋 */}
      <mesh position={[0, y - 0.18, 0]}>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color={shade(color, -0.1)} roughness={0.9} />
      </mesh>
      <CornerTilts w={w + 0.2} d={d + 0.2} y={y} color={color} />
    </group>
  );
}

/* ── 写实共用构件：过程化贴图＋曲面飞檐＋结构木作（Stage 1 主殿用，Stage 2 推全体） ── */

/** 瓦顶攒尖（方/近方屋）：高段 frustum 贴瓦垄＋瓦当檐口带＋宝顶 */
export function TiledPyramidRoof({ w, d, h, y, color = "#5d6158" }: { w: number; d: number; h: number; y: number; color?: string }) {
  const tile = useMemo(() => withRepeat(tileTexture(color), Math.max(2, w / 1.6), Math.max(1, h / 1.2)), [color, w, h]);
  const ntile = useMemo(() => withRepeat(tileNormal(), Math.max(2, w / 1.6), Math.max(1, h / 1.2)), [w, h]);
  const edge = useMemo(() => withRepeat(tileTexture(shade(color, -0.12)), Math.max(2, (w + 0.3) / 1.6), 1), [color, w]);
  const nedge = useMemo(() => withRepeat(tileNormal(), Math.max(2, (w + 0.3) / 1.6), 1), [w]);
  return (
    <group>
      <mesh position={[0, y + h / 2, 0]} scale={[w / 2, 1, d / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 1, h, 4, 1]} />
        <meshStandardMaterial map={tile} normalMap={ntile} normalScale={[0.8, 0.8]} color="#ffffff" roughness={0.78} />
      </mesh>
      {/* 瓦当滴水边：略宽压深 */}
      <mesh position={[0, y + 0.04, 0]} scale={[(w + 0.3) / 2, 1, (d + 0.3) / 2]}>
        <cylinderGeometry args={[1, 1, 0.18, 4]} />
        <meshStandardMaterial map={edge} normalMap={nedge} normalScale={[0.6, 0.6]} color="#ffffff" roughness={0.82} />
      </mesh>
      <Finial x={0} y={y + h + 0.06} z={0} color={color} />
    </group>
  );
}

/** 曲面飞檐双坡顶（长方形殿）：檐端上翘曲线 ExtrudeGeometry＋瓦贴图＋正脊＋鸱尾。
 *  局部：截面在 X-Y（span 跨 X、檐端翘起、中起脊），沿 +Z 挤出 length → 脊沿 local Z。
 *  rot=π/2 使脊转至 world X（殿门正对之「正面坡」朝前），即大殿正脊平行于前檐。 */
export function CurvedGableRoof({ span, length, height, y, color = "#5d6158", rot = 0 }: { span: number; length: number; height: number; y: number; color?: string; rot?: number }) {
  const tile = useMemo(() => withRepeat(tileTexture(color), Math.max(2, span / 1.6), Math.max(2, length / 1.6)), [color, span, length]);
  const ntile = useMemo(() => withRepeat(tileNormal(), Math.max(2, span / 1.6), Math.max(2, length / 1.6)), [span, length]);
  const dark = shade(color, -0.12);
  // 檐端卷杀翘起：真实中国飞檐檐口先平出再急翘，非直跳
  const lift = Math.min(0.5, height * 0.3);
  const eave = Math.min(span * 0.16, 1.0);
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-span / 2, 0);
    // 檐口卷杀：先缓起，近檐端急翘
    s.lineTo(-span / 2 + eave, lift * 0.16);
    s.quadraticCurveTo(-span / 2, lift, -span / 2, lift * 0.9);
    // 向脊：先缓后急
    s.quadraticCurveTo(-span / 2 * 0.34, height * 0.6, 0, height);
    s.quadraticCurveTo(span / 2 * 0.34, height * 0.6, span / 2, lift * 0.9);
    s.quadraticCurveTo(span / 2, lift, span / 2 - eave, lift * 0.16);
    s.lineTo(span / 2, 0);
    s.lineTo(-span / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false, steps: 1, curveSegments: 16 });
    g.translate(0, 0, -length / 2);
    g.computeVertexNormals();
    return g;
  }, [span, height, lift, length, eave]);
  return (
    <group position={[0, y, 0]} rotation={[0, rot, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={tile} normalMap={ntile} normalScale={[0.8, 0.8]} color="#ffffff" roughness={0.76} />
      </mesh>
      {/* 正脊（沿 local Z = 脊向） */}
      <mesh position={[0, height + 0.04, 0]} castShadow>
        <boxGeometry args={[0.26, 0.2, length + 0.28]} />
        <meshStandardMaterial color={dark} roughness={0.85} flatShading />
      </mesh>
      {/* 鸱尾：脊两端翘吻，沿 local Z 外翘 */}
      {[-(length + 0.28) / 2, (length + 0.28) / 2].map((ez, i) => (
        <mesh key={i} position={[0, height + 0.18, ez]} rotation={[i ? 0.4 : -0.4, 0, 0]} castShadow>
          <coneGeometry args={[0.2, 0.46, 4]} />
          <meshStandardMaterial color={dark} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** 木柱：石础＋木纹柱身＋柱头斗拱（方斗＋横拱＋小斗） */
export function WoodColumn({ x, z, h, r = 0.22, color = "#8a5b3f" }: { x: number; z: number; h: number; r?: number; color?: string }) {
  const wood = useMemo(() => withRepeat(woodTexture(color), 1, Math.max(1, h / 1.4)), [color, h]);
  const nwood = useMemo(() => withRepeat(woodNormal(), 1, Math.max(1, h / 1.4)), [h]);
  const stone = useMemo(() => withRepeat(stoneTexture("#9a907c"), 1, 1), []);
  const nstone = useMemo(() => withRepeat(stoneNormal(), 1, 1), []);
  const cap = shade(color, -0.06);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[r * 1.55, r * 1.65, 0.16, 16]} />
        <meshStandardMaterial map={stone} normalMap={nstone} normalScale={[0.5, 0.5]} color="#ffffff" roughness={1} />
      </mesh>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h, 16]} />
        <meshStandardMaterial map={wood} normalMap={nwood} normalScale={[0.6, 0.6]} color="#ffffff" roughness={0.66} metalness={0.06} />
      </mesh>
      {/* 斗拱：方斗 */}
      <mesh position={[0, h + 0.09, 0]}>
        <boxGeometry args={[r * 2.4, 0.18, r * 2.4]} />
        <meshStandardMaterial color={cap} roughness={0.8} />
      </mesh>
      {/* 横拱 */}
      <mesh position={[0, h + 0.24, 0]}>
        <boxGeometry args={[r * 3.4, 0.14, r * 0.95]} />
        <meshStandardMaterial color={shade(color, -0.02)} roughness={0.8} />
      </mesh>
      {/* 小斗 */}
      <mesh position={[0, h + 0.34, 0]}>
        <boxGeometry args={[r * 1.4, 0.1, r * 1.4]} />
        <meshStandardMaterial color={cap} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 列柱：沿给定 xs 在 z 排一列木柱 */
export function Colonnade({ xs, z, h, r = 0.22, color = "#8a5b3f" }: { xs: number[]; z: number; h: number; r?: number; color?: string }) {
  return <>{xs.map((x, i) => <WoodColumn key={i} x={x} z={z} h={h} r={r} color={color} />)}</>;
}

/** 墙皮：box 贴灰泥贴图 */
export function TexturedWall({ w, h, d, y, color = "#c2ad84" }: { w: number; h: number; d: number; y: number; color?: string }) {
  const tex = useMemo(() => withRepeat(plasterTexture(color), Math.max(1, w / 2.4), Math.max(1, h / 2.4)), [color, w, h]);
  return (
    <mesh position={[0, y, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial map={tex} color="#ffffff" roughness={1} />
    </mesh>
  );
}

/** 门板：木纹门板＋门框＋可选门钉（金球网格），自含门框 */
export function PaneledDoor({ x, y, z, w = 2.4, h = 2.2, color = "#7a3f28", studs = false, rot = 0 }: { x: number; y: number; z: number; w?: number; h?: number; color?: string; studs?: boolean; rot?: number }) {
  const wood = useMemo(() => withRepeat(woodTexture(color), Math.max(1, w / 1.4), Math.max(1, h / 1.4)), [color, w, h]);
  const frame = shade(color, -0.12);
  const t = 0.16;
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial map={wood} color="#ffffff" roughness={0.85} />
      </mesh>
      <mesh position={[-w / 2 - t / 2, 0, -0.02]}>
        <boxGeometry args={[t, h, 0.1]} />
        <meshStandardMaterial color={frame} roughness={0.85} />
      </mesh>
      <mesh position={[w / 2 + t / 2, 0, -0.02]}>
        <boxGeometry args={[t, h, 0.1]} />
        <meshStandardMaterial color={frame} roughness={0.85} />
      </mesh>
      <mesh position={[0, h / 2 + t / 2, -0.02]}>
        <boxGeometry args={[w + t * 2, t, 0.1]} />
        <meshStandardMaterial color={frame} roughness={0.85} />
      </mesh>
      {studs &&
        Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => (
            <mesh key={`${r}-${c}`} position={[-0.4 + c * 0.2, -0.55 + r * 0.55, 0.08]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color="#b58a3c" metalness={0.5} roughness={0.4} />
            </mesh>
          )),
        )}
    </group>
  );
}

/** 格扇窗：窗框＋格棂贴图（贴图带 alpha，材质 transparent） */
export function LatticeWindow({ x, y, z, w = 1.2, h = 1.4, rot = 0 }: { x: number; y: number; z: number; w?: number; h?: number; rot?: number }) {
  const lat = useMemo(() => withRepeat(latticeTexture("#6b4a2a"), Math.max(1, w / 1.2), Math.max(1, h / 1.4)), [w, h]);
  const frame = "#6b4a2a";
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={lat} color="#ffffff" transparent roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-w / 2 - 0.04, 0, -0.02]}>
        <boxGeometry args={[0.08, h + 0.08, 0.06]} />
        <meshStandardMaterial color={frame} roughness={0.8} />
      </mesh>
      <mesh position={[w / 2 + 0.04, 0, -0.02]}>
        <boxGeometry args={[0.08, h + 0.08, 0.06]} />
        <meshStandardMaterial color={frame} roughness={0.8} />
      </mesh>
      <mesh position={[0, h / 2 + 0.04, -0.02]}>
        <boxGeometry args={[w + 0.08, 0.08, 0.06]} />
        <meshStandardMaterial color={frame} roughness={0.8} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.04, -0.02]}>
        <boxGeometry args={[w + 0.08, 0.08, 0.06]} />
        <meshStandardMaterial color={frame} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 石基：石贴图台基＋阶条石压边（主殿用） */
export function StoneBase({ w, d, h = 0.5, y = 0, color = "#a89a80" }: { w: number; d: number; h?: number; y?: number; color?: string }) {
  const stone = useMemo(() => withRepeat(stoneTexture(color), Math.max(2, w / 2.4), Math.max(2, d / 2.4)), [color, w, d]);
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, h / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={stone} color="#ffffff" roughness={0.95} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <boxGeometry args={[w + 0.24, 0.1, d + 0.24]} />
        <meshStandardMaterial color={shade(color, -0.1)} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** 踏步：阶陛数级，石贴图 */
export function Steps({ x, y, z, w = 4.4, n = 3, rot = 0, color = "#aaa089" }: { x: number; y: number; z: number; w?: number; n?: number; rot?: number; color?: string }) {
  const stone = useMemo(() => withRepeat(stoneTexture(color), Math.max(1, w / 3), 1), [color, w]);
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[0, 0.22 + i * 0.22, i * 0.55]} receiveShadow castShadow>
          <boxGeometry args={[w, 0.44, 0.7]} />
          <meshStandardMaterial map={stone} color="#ffffff" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** 石栏板：下坊＋上栏＋望柱（替 Railing，主殿高台用） */
export function Balustrade({ x, y, z, w, rot = 0, color = "#bfb394" }: { x: number; y: number; z: number; w: number; rot?: number; color?: string }) {
  const n = Math.max(3, Math.round(w / 0.7));
  const stone = useMemo(() => withRepeat(stoneTexture(color), Math.max(2, w / 2), 1), [color, w]);
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[w, 0.1, 0.16]} />
        <meshStandardMaterial color={shade(color, -0.06)} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[w, 0.1, 0.14]} />
        <meshStandardMaterial map={stone} color="#ffffff" roughness={0.9} />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const px = n === 1 ? 0 : -w / 2 + (w * i) / (n - 1);
        return (
          <mesh key={i} position={[px, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.07, 0.4, 8]} />
            <meshStandardMaterial color={shade(color, -0.04)} roughness={0.95} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Stage 2 构件：圆锥瓦/茅顶、贴图石圆柱、贴图木/石方箱 ── */

/** 圆锥顶（攒尖/茅顶）：瓦或茅贴图＋檐口压边＋（瓦顶）宝顶。
 *  茅顶合古制不设脊吻（finial=false）。sides=4 方攒尖、6/7/8 多面攒尖。 */
export function TiledConeRoof({ r, h, sides, y, color = "#5d6158", thatch = false, finial = true, rot = 0 }: { r: number; h: number; sides: number; y: number; color?: string; thatch?: boolean; finial?: boolean; rot?: number }) {
  const tex = useMemo(() => withRepeat(thatch ? thatchTexture(color) : tileTexture(color), Math.max(2, r / 1.2), Math.max(1, h / 1.2)), [color, r, h, thatch]);
  const ntex = useMemo(() => withRepeat(tileNormal(), Math.max(2, r / 1.2), Math.max(1, h / 1.2)), [r, h]);
  return (
    <group position={[0, y, 0]} rotation={[0, rot, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[r, h, sides]} />
        <meshStandardMaterial map={tex} normalMap={thatch ? null : ntex} normalScale={[0.7, 0.7]} color="#ffffff" roughness={thatch ? 1 : 0.78} flatShading={thatch} />
      </mesh>
      {/* 檐口压边：瓦当或茅束收口 */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[r + 0.06, r + 0.06, 0.16, sides]} />
        <meshStandardMaterial color={shade(color, thatch ? -0.08 : -0.12)} roughness={0.9} flatShading />
      </mesh>
      {finial && !thatch && <Finial x={0} y={h + 0.04} z={0} color={color} />}
    </group>
  );
}

/** 石面圆柱：圆坛/束腰台/井圈等 */
export function StoneCyl({ rt, rb, h, y, color = "#a89a80", sides = 32 }: { rt: number; rb: number; h: number; y: number; color?: string; sides?: number }) {
  const tex = useMemo(() => withRepeat(stoneTexture(color), Math.max(2, Math.max(rt, rb) / 2), Math.max(1, h / 2)), [color, rt, rb, h]);
  return (
    <mesh position={[0, y, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[rt, rb, h, sides]} />
      <meshStandardMaterial map={tex} color="#ffffff" roughness={0.95} />
    </mesh>
  );
}

/** 木面方箱：案/桌/桩/货箱/柱梁 */
export function WoodBox({ w, h, d, x = 0, y, z = 0, color = "#8a7150", rot = 0 }: { w: number; h: number; d: number; x?: number; y: number; z?: number; color?: string; rot?: number }) {
  const tex = useMemo(() => withRepeat(woodTexture(color), Math.max(1, w / 1.6), Math.max(1, h / 1.6)), [color, w, h]);
  return (
    <mesh position={[x, y, z]} rotation={[0, rot, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial map={tex} color="#ffffff" roughness={0.9} />
    </mesh>
  );
}

/** 石面方箱：方碑/华表柱/演讲席/里程碑 */
export function StoneBox({ w, h, d, x = 0, y, z = 0, color = "#9a8a6a", rot = 0 }: { w: number; h: number; d: number; x?: number; y: number; z?: number; color?: string; rot?: number }) {
  const tex = useMemo(() => withRepeat(stoneTexture(color), Math.max(1, w / 2), Math.max(1, h / 2)), [color, w, h]);
  return (
    <mesh position={[x, y, z]} rotation={[0, rot, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial map={tex} color="#ffffff" roughness={0.95} />
    </mesh>
  );
}

/** 杏坛：开敞讲亭，无墙、六柱、重檐，坛前置讲席 */
function Academy() {
  return (
    <group>
      <StoneBase w={11} d={11} h={0.6} color="#c0b394" />
      <TexturedWall w={9} h={0.7} d={9} y={0.95} color="#c3b596" />
      <group position={[0, 1.3, 0]}>
        <Colonnade xs={[-3.2, 0, 3.2]} z={3.2} h={3.4} r={0.22} color="#9c4f36" />
        <Colonnade xs={[-3.2, 0, 3.2]} z={-3.2} h={3.4} r={0.22} color="#9c4f36" />
        <Eave w={9.4} d={9.4} y={3.5} />
        <TiledPyramidRoof w={11} d={11} h={2.1} y={3.65} color="#5d6158" />
        {/* 重檐 */}
        <Eave w={6.4} d={6.4} y={5.6} color="#63503a" />
        <TiledPyramidRoof w={7.4} d={7.4} h={1.7} y={5.7} color="#5d6158" />
      </group>
      {/* 讲席与蒲团 */}
      <mesh position={[0, 1.5, -1.2]} castShadow>
        <boxGeometry args={[1.8, 0.35, 1.1]} />
        <meshStandardMaterial color="#7b6244" roughness={0.9} />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 1.42, 1.8]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.18, 12]} />
          <meshStandardMaterial color="#9d8b6a" roughness={1} />
        </mesh>
      ))}
      {/* 宫灯：重檐前角悬挂 */}
      <Lantern x={-3.0} y={4.2} z={3.0} />
      <Lantern x={3.0} y={4.2} z={3.0} />
      {/* 悬匾：前柱间 */}
      <Plaque x={0} y={3.9} z={3.3} w={1.7} />
      <Apricot x={-5.4} z={4.6} />
      <Apricot x={5.6} z={-4.2} />
    </group>
  );
}

/** 杏树：杏坛得名之物 */
function Apricot({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.34, 3, 7]} />
        <meshStandardMaterial color="#6a5237" roughness={1} />
      </mesh>
      {[[0, 3.5, 0, 1.7], [0.8, 3.1, 0.4, 1.1], [-0.7, 3.2, -0.5, 1.2]].map(([px, py, pz, r], i) => (
        <mesh key={i} position={[px, py, pz]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={i === 0 ? "#c49aa2" : "#b58a92"} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** 墨家工坊：夯土矮墙 + 双坡瓦顶 + 院中器械、木料与炉火 */
function Workshop() {
  return (
    <group>
      <StoneBase w={12} d={10} h={0.4} color="#ab9e83" />
      {/* 主屋 */}
      <group position={[-1.6, 0.4, 0]}>
        <TexturedWall w={7} h={3.6} d={6.4} y={1.8} color="#c2ad84" />
        {/* 双坡曲面瓦顶 */}
        <CurvedGableRoof span={7.2} length={7.8} height={2.3} y={4.5} color="#5d6158" rot={Math.PI / 2} />
        <Eave w={7.8} d={7.2} y={3.65} color="#4e463a" />
        {/* 敞口木门 */}
        <PaneledDoor x={0} y={1.3} z={3.25} w={2.4} h={2.6} color="#7a3f28" />
      </group>
      {/* 工棚：四柱敞棚 */}
      <group position={[4, 0.4, 1.2]}>
        <Colonnade xs={[-1.8, 1.8]} z={1.8} h={2.8} r={0.16} color="#7b6446" />
        <Colonnade xs={[-1.8, 1.8]} z={-1.8} h={2.8} r={0.16} color="#7b6446" />
        <WoodBox w={5} h={0.3} d={5} y={3} color="#6d6a4e" />
      </group>
      {/* 连弩车 */}
      <group position={[3.6, 0.4, -2.6]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[2.4, 0.5, 1.4]} />
          <meshStandardMaterial color="#7a6142" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, 0.25]} castShadow>
          <boxGeometry args={[3.2, 0.16, 0.16]} />
          <meshStandardMaterial color="#5d4c33" />
        </mesh>
        {[-0.6, 0.6].map((z) => (
          <mesh key={z} position={[0.8, 0.35, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.16, 10]} />
            <meshStandardMaterial color="#4f4130" />
          </mesh>
        ))}
      </group>
      {/* 木料堆 */}
      <group position={[-5, 0.4, 3.2]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.25 + i * 0.42, i % 2 ? 0.1 : -0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 3, 7]} />
            <meshStandardMaterial color="#8c7350" roughness={1} />
          </mesh>
        ))}
      </group>
      {/* 炉 */}
      <group position={[-5.2, 0.4, -2.4]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.9, 1.2, 10]} />
          <meshStandardMaterial color="#6b5545" roughness={1} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.42, 10, 8]} />
          <meshStandardMaterial color="#d98a3d" emissive="#c2521c" emissiveIntensity={1.4} />
        </mesh>
      </group>
    </group>
  );
}

/** 法家政厅：高台重檐大殿，阶陛、朱柱、门钉大门、格扇、门阙，形制最为严整 */
function Hall() {
  return (
    <group>
      {/* 三级高台 */}
      <StoneBase w={15} d={13} h={0.5} color="#aca189" />
      <TexturedWall w={13} h={0.7} d={11} y={0.85} color="#a89d84" />
      <TexturedWall w={11.4} h={0.6} d={9.6} y={1.5} color="#b3a88e" />
      {/* 阶陛 */}
      <Steps x={0} y={0.5} z={5.4} w={4.4} n={3} color="#aaa089" />
      {/* 殿身 */}
      <group position={[0, 1.8, 0]}>
        <TexturedWall w={9.6} h={4} d={8} y={2} color="#bda98a" />
        {/* 廊柱：前 5 根朱柱 */}
        <Colonnade xs={[-4.2, -2.1, 0, 2.1, 4.2]} z={4.3} h={4} r={0.28} color="#9a3f30" />
        <Eave w={11.4} d={9.8} y={4.1} color="#4a4438" />
        <CurvedGableRoof span={11} length={13} height={2.6} y={4.25} color="#5d6158" rot={Math.PI / 2} />
        <Eave w={7.6} d={6.4} y={6.7} color="#413c33" />
        <CurvedGableRoof span={7.4} length={8.6} height={2} y={6.8} color="#5d6158" rot={Math.PI / 2} />
        {/* 门钉大门 */}
        <PaneledDoor x={0} y={1.1} z={4.06} w={2.4} h={2.2} color="#7a3f28" studs />
        {/* 两侧格扇窗 */}
        <LatticeWindow x={-3.2} y={1.4} z={4.06} />
        <LatticeWindow x={3.2} y={1.4} z={4.06} />
        {/* 宫灯：前柱头悬挂（四盏，中留匾） */}
        <Lantern x={-4.2} y={3.6} z={4.3} />
        <Lantern x={-2.1} y={3.6} z={4.3} />
        <Lantern x={2.1} y={3.6} z={4.3} />
        <Lantern x={4.2} y={3.6} z={4.3} />
        {/* 匾额：殿门上方 */}
        <Plaque x={0} y={3.4} z={4.05} w={2.4} />
      </group>
      {/* 高台前栏：阶陛两侧 */}
      <Balustrade x={-5.4} y={1.85} z={6.0} w={3.4} color="#b6a284" />
      <Balustrade x={5.4} y={1.85} z={6.0} w={3.4} color="#b6a284" />
      {/* 门阙一对 */}
      {[-6.2, 6.2].map((x) => (
        <group key={x} position={[x, 0.5, 6.6]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <boxGeometry args={[1.6, 4.4, 1.6]} />
            <meshStandardMaterial color="#b6a284" roughness={0.95} />
          </mesh>
          <TiledPyramidRoof w={2.6} d={2.6} h={1} y={4.4} color="#5d6158" />
        </group>
      ))}
    </group>
  );
}

/** 稷下学宫：环形辩坛，围坐石阶，中央高台，四周立旗 */
function Jixia() {
  const seats = useMemo(() => Array.from({ length: 3 }, (_, i) => i), []);
  return (
    <group>
      <StoneCyl rt={11} rb={11.4} h={0.4} y={0.2} color="#b8ab8d" sides={32} />
      {/* 三圈坐阶，逐层收进抬高 */}
      {seats.map((i) => (
        <StoneCyl key={i} rt={9.4 - i * 1.7} rb={9.8 - i * 1.7} h={0.45} y={0.5 + i * 0.42} color={i % 2 ? "#c2b593" : "#b6a98a"} sides={32} />
      ))}
      {/* 中央论坛高台 */}
      <StoneCyl rt={4} rb={4.3} h={0.6} y={1.9} color="#bfb494" sides={24} />
      {/* 台上四柱撑顶盖 */}
      <group position={[0, 2.2, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return <WoodColumn key={i} x={Math.cos(a) * 3} z={Math.sin(a) * 3} h={3} r={0.2} color="#8d5a3c" />;
        })}
      </group>
      <TiledConeRoof r={5} h={1.8} sides={8} y={5.6} color="#5d6158" />
      {/* 旗 */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const [x, z] = [Math.cos(a) * 10.4, Math.sin(a) * 10.4];
        const colors = ["#9c3f2f", "#334d47", "#31716e", "#44495c", "#b25b37", "#795548"];
        return (
          <group key={i} position={[x, 0.4, z]}>
            <mesh position={[0, 2.2, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 4.4, 6]} />
              <meshStandardMaterial color="#6b5940" />
            </mesh>
            <mesh position={[0.55, 3.5, 0]} castShadow>
              <boxGeometry args={[1.1, 1.4, 0.06]} />
              <meshStandardMaterial color={colors[i]} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** 濠水之畔：水面、木栈、茅亭、芦荻与游鱼 */
function Water() {
  return (
    <group>
      {/* 水面 */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 40]} />
        <meshStandardMaterial color="#5f8a86" roughness={0.15} metalness={0.35} transparent opacity={0.92} />
      </mesh>
      {/* 岸线 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[11.6, 13.4, 40]} />
        <meshStandardMaterial color="#a89a7c" roughness={1} />
      </mesh>
      {/* 木栈道 */}
      <group position={[0, 0, 4]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0.35, -i * 1.5]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.16, 1.3]} />
            <meshStandardMaterial color="#8a7150" roughness={1} />
          </mesh>
        ))}
      </group>
      {/* 茅亭 */}
      <group position={[0, 0, -3.4]}>
        <StoneCyl rt={3.2} rb={3.4} h={0.6} y={0.3} color="#9d8a68" sides={16} />
        <group position={[0, 0.5, 0]}>
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return <WoodColumn key={i} x={Math.cos(a) * 2.3} z={Math.sin(a) * 2.3} h={2.8} r={0.15} color="#7d6647" />;
          })}
        </group>
        <TiledConeRoof r={3.6} h={2} sides={7} y={4} color="#8a7442" thatch />
      </group>
      {/* 芦荻 */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        const r = 10.2 + (i % 3) * 0.7;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <mesh position={[0, 1.1, 0]} rotation={[0, 0, (i % 5) * 0.05 - 0.1]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 2.2, 5]} />
              <meshStandardMaterial color="#7f8b5c" />
            </mesh>
            <mesh position={[0, 2.3, 0]} castShadow>
              <capsuleGeometry args={[0.14, 0.5, 3, 6]} />
              <meshStandardMaterial color="#b9a678" roughness={1} />
            </mesh>
          </group>
        );
      })}
      {/* 游鱼 */}
      {[[2.5, 1.5], [-3, -1], [1, -3.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, i]} >
          <circleGeometry args={[0.42, 3]} />
          <meshStandardMaterial color="#d9a05b" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** 纵横棋局：方坛上置低棋桌，散落黑白子，两侧对坐蒲团，旁立纵横旗 */
function Zongheng() {
  return (
    <group>
      <StoneBase w={11} d={11} h={0.5} color="#b8a988" />
      {/* 棋桌 */}
      <WoodBox w={5.2} h={0.4} d={4.6} y={0.85} color="#caa97e" />
      <WoodBox w={4.8} h={0.06} d={4.2} y={1.07} color="#b58d5e" />
      {/* 棋枰格线 */}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i}>
          <mesh position={[0, 1.1, -2 + i * 0.5]}>
            <boxGeometry args={[4, 0.02, 0.04]} />
            <meshStandardMaterial color="#6b5237" />
          </mesh>
          <mesh position={[-2 + i * 0.5, 1.1, 0]}>
            <boxGeometry args={[0.04, 0.02, 4]} />
            <meshStandardMaterial color="#6b5237" />
          </mesh>
        </group>
      ))}
      {/* 黑子 */}
      {[[-1.4, -0.8], [0.6, 0.2], [-0.2, -1.2], [1.2, -0.4]].map(([x, z], i) => (
        <mesh key={"b" + i} position={[x, 1.16, z]} castShadow>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color="#1c1a16" roughness={0.6} />
        </mesh>
      ))}
      {/* 白子 */}
      {[[1.4, 0.8], [-0.6, 1.0], [0.2, 1.4], [-1.2, 0.6]].map(([x, z], i) => (
        <mesh key={"w" + i} position={[x, 1.16, z]} castShadow>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color="#efe6cf" roughness={0.6} />
        </mesh>
      ))}
      {/* 两侧蒲团 */}
      {[-3.4, 3.4].map((z) => (
        <mesh key={z} position={[0, 0.75, z]} castShadow>
          <cylinderGeometry args={[0.6, 0.6, 0.22, 14]} />
          <meshStandardMaterial color="#8a6f4a" roughness={1} />
        </mesh>
      ))}
      {/* 纵横旗 */}
      <group position={[4.6, 0.5, -3.6]}>
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 4, 6]} />
          <meshStandardMaterial color="#6b5940" />
        </mesh>
        <mesh position={[0.6, 3.2, 0]} castShadow>
          <boxGeometry args={[1.2, 1.4, 0.06]} />
          <meshStandardMaterial color="#6b4a8a" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** 名家论辩台：双层圆坛，两方讲席相对，中立方碑，周绕短柱 */
function Mingjia() {
  return (
    <group>
      <StoneCyl rt={7} rb={7.6} h={0.6} y={0.3} color="#b3a78a" sides={32} />
      <StoneCyl rt={6} rb={6.4} h={0.5} y={0.75} color="#bfb294" sides={32} />
      {/* 两方讲席相对 */}
      {[-3.4, 3.4].map((z) => (
        <group key={z} position={[0, 1.1, z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, 0.5, 14]} />
            <meshStandardMaterial color="#8a6f4a" roughness={1} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <boxGeometry args={[1.4, 0.9, 0.5]} />
            <meshStandardMaterial color="#7a6240" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* 中立方碑 */}
      <StoneBox w={1.2} h={2.4} d={0.4} y={1.6} color="#9a8a6a" />
      <StoneBox w={1.5} h={0.3} d={0.7} y={2.9} color="#7d6a4a" />
      {/* 周绕短柱 */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 6.6, 1.2, Math.sin(a) * 6.6]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.7, 6]} />
            <meshStandardMaterial color="#8a7556" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

/** 道家山林：青松数株、怪石、一道细流、茅庵，中置论道蒲团 */
function Daoshan() {
  return (
    <group>
      <StoneBase w={12} d={12} h={0.4} color="#9a9072" />
      {/* 松 */}
      {[[-4.2, 3.4, 1.7], [4.6, -2.8, 1.5], [-3.0, -4.0, 1.3], [3.8, 4.2, 1.2]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0.4, z]} scale={r * 0.7}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 3.2, 7]} />
            <meshStandardMaterial color="#5a4632" roughness={1} />
          </mesh>
          {[[0, 3.4, 0, 1.6], [0.7, 2.9, 0.4, 1.0], [-0.6, 3.0, -0.4, 1.1]].map(([px, py, pz, cr], j) => (
            <mesh key={j} position={[px, py, pz]} castShadow>
              <coneGeometry args={[cr, 1.6, 7]} />
              <meshStandardMaterial color={i % 2 ? "#3a5a44" : "#356b4e"} roughness={0.95} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* 怪石 */}
      {[[2.0, 1.2, 0.8], [-2.6, -1.0, 1.0], [0.4, -2.8, 0.7]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.4 + r * 0.6, z]} rotation={[0, i, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#7a7363" roughness={1} flatShading />
        </mesh>
      ))}
      {/* 细流 */}
      <mesh position={[0, 0.44, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.06, 11]} />
        <meshStandardMaterial color="#5f8a86" roughness={0.2} metalness={0.3} transparent opacity={0.85} />
      </mesh>
      {/* 茅庵 */}
      <group position={[4.6, 0.4, 4.0]}>
        <TexturedWall w={2.6} h={1.4} d={2.2} y={0.7} color="#b3a07c" />
        <TiledConeRoof r={2.1} h={1.2} sides={4} y={1.6} color="#7d6647" thatch rot={Math.PI / 4} />
      </group>
      {/* 论道蒲团 */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.2, 14]} />
        <meshStandardMaterial color="#8a6f4a" roughness={1} />
      </mesh>
    </group>
  );
}

/** 公共广场：开阔石板地，中央立华表，前置演讲席，四角石灯 */
function Plaza() {
  return (
    <group>
      <StoneBase w={14} d={14} h={0.4} color="#b8ad8e" />
      <StoneBox w={13} h={0.3} d={13} y={0.55} color="#c2b593" />
      {/* 中央华表 */}
      <group position={[0, 0.7, 0]}>
        <StoneCyl rt={0.22} rb={0.28} h={4.8} y={2.4} color="#7d6a4a" sides={10} />
        <mesh position={[0, 4.8, 0]} castShadow>
          <sphereGeometry args={[0.3, 12, 10]} />
          <meshStandardMaterial color="#b58a3c" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0.8, 4.4, 0]} castShadow>
          <boxGeometry args={[1.6, 0.2, 0.2]} />
          <meshStandardMaterial color="#7d6a4a" />
        </mesh>
      </group>
      {/* 演讲席 */}
      <StoneBox w={2.4} h={0.9} d={1.6} x={0} y={1.0} z={-3.4} color="#9a8a6a" />
      {/* 四角石灯 */}
      {[[-5.4, -5.4], [5.4, -5.4], [-5.4, 5.4], [5.4, 5.4]].map(([x, z], i) => (
        <group key={i} position={[x, 0.7, z]}>
          <StoneCyl rt={0.18} rb={0.22} h={1.2} y={0.6} color="#8a7556" sides={8} />
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color="#e6c08c" emissive="#c2853c" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** 观星台：束腰高台＋浑仪星盘，顶端发光之星随当德换色（currentElement） */
function Stargazer({ tick = 0 }: { tick?: number } = {}) {
  const el = currentElement(tick);
  return (
    <group>
      <StoneBase w={9} d={9} h={0.5} color="#9a8f76" />
      {/* 束腰高台：两层收分圆柱 */}
      <StoneCyl rt={2.2} rb={2.8} h={2.4} y={1.4} color="#b3a384" sides={20} />
      <StoneCyl rt={1.7} rb={2.0} h={1.8} y={3.1} color="#a89878" sides={20} />
      {/* 顶层观星台面 */}
      <StoneCyl rt={2.4} rb={1.9} h={0.7} y={4.3} color="#c2b08c" sides={20} />
      {/* 四柱撑顶 */}
      <group position={[0, 4.1, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return <WoodColumn key={i} x={Math.cos(a) * 1.9} z={Math.sin(a) * 1.9} h={1.6} r={0.14} color="#7d6647" />;
        })}
      </group>
      {/* 顶盖：八角攒尖瓦顶（当德星为顶饰，不另设宝顶） */}
      <TiledConeRoof r={2.6} h={1.4} sides={8} y={6.0} color="#5d6158" finial={false} />
      {/* 浑仪：三环相交 */}
      <group position={[0, 5.2, 0]}>
        <mesh castShadow>
          <torusGeometry args={[1.1, 0.06, 8, 32]} />
          <meshStandardMaterial color="#8a6b3a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[1.1, 0.06, 8, 32]} />
          <meshStandardMaterial color="#8a6b3a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[1.1, 0.06, 8, 32]} />
          <meshStandardMaterial color="#8a6b3a" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
      {/* 四柱暖宫灯：与冷色当德星成冷暖对照 */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return <Lantern key={i} x={Math.cos(a) * 1.9} y={4.6} z={Math.sin(a) * 1.9} />;
      })}
      {/* 顶台环栏：望柱＋横栏，绕顶台一周 */}
      <group position={[0, 4.3, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[2.35, 0.04, 8, 24]} />
          <meshStandardMaterial color="#8a7556" roughness={0.9} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.35, 0.16, Math.sin(a) * 2.35]}>
              <cylinderGeometry args={[0.05, 0.06, 0.3, 6]} />
              <meshStandardMaterial color="#8a7556" roughness={0.9} />
            </mesh>
          );
        })}
      </group>
      {/* 顶端当德之星：随当德换色，与邹衍头顶徽同源 */}
      <mesh position={[0, 6.8, 0]}>
        <sphereGeometry args={[0.32, 16, 14]} />
        <meshStandardMaterial color={el.color} emissive={el.color} emissiveIntensity={1.6} />
      </mesh>
      {/* 台前星盘：扁圆盘斜置 */}
      <mesh position={[0, 4.65, 2.0]} rotation={[-Math.PI / 2.4, 0, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.12, 24]} />
        <meshStandardMaterial color="#6b5a3a" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** 兵家沙盘：低阔木案＋台面沙纹＋四角旗阵，分染两色表奇正 */
function SandTable() {
  return (
    <group>
      <StoneBase w={11} d={9} h={0.4} color="#9a8d72" />
      {/* 低阔木案 */}
      <WoodBox w={8} h={0.6} d={5.2} y={0.7} color="#b09a6e" />
      {/* 沙盘台面 */}
      <mesh position={[0, 1.04, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.16, 4.8]} />
        <meshStandardMaterial color="#cdb88c" roughness={1} />
      </mesh>
      {/* 沙纹：数道细垄，表地形 */}
      {[-1.6, -0.8, 0, 0.8, 1.6].map((x) => (
        <mesh key={x} position={[x, 1.13, 0]}>
          <boxGeometry args={[0.1, 0.04, 4.4]} />
          <meshStandardMaterial color="#b59f70" roughness={1} />
        </mesh>
      ))}
      {/* 山势：盘中几方小石 */}
      {[[-1.4, 0.6, 0.5], [1.2, -0.8, 0.4], [0.2, 1.2, 0.35]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 1.2, z]} castShadow>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#7a7363" roughness={1} flatShading />
        </mesh>
      ))}
      {/* 四角旗阵：奇正二色 */}
      {[[-3.2, -2.0], [3.2, 2.0], [3.2, -2.0], [-3.2, 2.0]].map(([x, z], i) => {
        const color = i % 2 ? "#9c3f2f" : "#334d47";
        return (
          <group key={i} position={[x, 0.4, z]}>
            <mesh position={[0, 1.4, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 2.8, 6]} />
              <meshStandardMaterial color="#6b5940" />
            </mesh>
            <mesh position={[0.42, 2.3, 0]} castShadow>
              <boxGeometry args={[0.84, 1.0, 0.05]} />
              <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** 农家田舍：茅舍＋田垄＋篱笆＋谷堆＋农具 */
function Farmhouse() {
  return (
    <group>
      <StoneBase w={11} d={11} h={0.4} color="#9a8f72" />
      {/* 茅舍：夯土身＋茅顶 */}
      <group position={[0, 0.4, 0]}>
        <TexturedWall w={4.6} h={2.0} d={3.6} y={1.0} color="#b3a07c" />
        <TiledConeRoof r={3.6} h={1.4} sides={4} y={2.45} color="#9c8a52" thatch rot={Math.PI / 4} />
        {/* 木门 */}
        <PaneledDoor x={0} y={0.7} z={1.81} w={1.4} h={1.4} color="#5a4a32" />
      </group>
      {/* 田垄：数条细垄，绕舍前 */}
      {[-3.5, -2.4, 3.2, 4.3].map((z, i) => (
        <mesh key={i} position={[0, 0.42, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[9, 0.5]} />
          <meshStandardMaterial color={i % 2 ? "#8a7a4a" : "#7d6c3e"} roughness={1} />
        </mesh>
      ))}
      {/* 篱笆：数根细柱围舍 */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r = 5.2;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.7, Math.sin(a) * r]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 5]} />
            <meshStandardMaterial color="#6b5a3a" roughness={1} />
          </mesh>
        );
      })}
      {/* 谷堆：圆锥 */}
      <mesh position={[3.6, 0.7, -3.2]} castShadow>
        <coneGeometry args={[1.4, 1.6, 8]} />
        <meshStandardMaterial color="#c9a85a" roughness={1} flatShading />
      </mesh>
      {/* 农具：斜倚的锄 */}
      <group position={[-3.4, 0.4, 3.4]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.9, 0]} rotation={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.4, 5]} />
          <meshStandardMaterial color="#6b5a3a" roughness={1} />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]} castShadow>
          <boxGeometry args={[0.5, 0.2, 0.1]} />
          <meshStandardMaterial color="#5a4a32" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}

/** 秦驰道/关隘：关隘门柱＋驰道路面＋里程碑＋路亭 */
function QinRoad() {
  return (
    <group>
      <StoneBase w={13} d={9} h={0.4} color="#9a8f74" />
      {/* 驰道路面：石铺长扁条 */}
      <StoneBox w={12.6} h={0.12} d={4.4} y={0.42} color="#b0a486" />
      {/* 车辙 */}
      {[-1.0, 1.0].map((z) => (
        <mesh key={z} position={[0, 0.49, z]} receiveShadow>
          <boxGeometry args={[12, 0.04, 0.16]} />
          <meshStandardMaterial color="#8a7e60" roughness={1} />
        </mesh>
      ))}
      {/* 关隘：两根石门柱＋木横楣＋曲面门顶＋垛口 */}
      <group position={[0, 0.4, 0]}>
        {[-2.6, 2.6].map((x) => (
          <StoneBox key={x} w={1.0} h={3.6} d={1.0} x={x} y={1.8} color="#a8946e" />
        ))}
        <WoodBox w={6.4} h={0.5} d={1.2} y={3.7} color="#8a7556" />
        {/* 飞檐：补一道翘角檐口，关隘顶不至裸秃 */}
        <Eave w={7.2} d={2.0} y={3.85} color="#6b543a" />
        <CurvedGableRoof span={2.0} length={7.4} height={1.0} y={3.95} rot={Math.PI / 2} color="#5d6158" />
        {[-1.8, -0.6, 0.6, 1.8].map((x) => (
          <StoneBox key={x} w={0.5} h={0.4} d={0.5} x={x} y={4.2} color="#9a8460" />
        ))}
      </group>
      {/* 里程碑 */}
      <StoneBox w={0.3} h={1.0} d={0.3} x={3.6} y={0.9} z={2.4} color="#9a8a6a" />
      {/* 路亭：四柱攒尖瓦顶 */}
      <group position={[-4.4, 0.4, 2.6]}>
        <Colonnade xs={[-0.8, 0.8]} z={-0.8} h={2.2} r={0.18} color="#7d6647" />
        <Colonnade xs={[-0.8, 0.8]} z={0.8} h={2.2} r={0.18} color="#7d6647" />
        <TiledConeRoof r={1.9} h={0.8} sides={4} y={2.4} color="#6d6a4e" rot={Math.PI / 4} />
      </group>
    </group>
  );
}

/** 市井：棚肆＋摊位＋幌子＋水井 */
function Market() {
  const stallColors = ["#9c3f2f", "#a07a2a", "#4f7a3a", "#8a6b2a"];
  return (
    <group>
      <StoneBase w={13} d={11} h={0.4} color="#9a8e70" />
      {/* 棚肆四座：四柱＋斜帆篷＋摊位案＋货堆 */}
      {[[-3.5, -2], [3.5, -2], [-3.5, 2.6], [3.5, 2.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0.4, z]}>
          <Colonnade xs={[-1.7, 1.7]} z={-1.7} h={2.4} r={0.18} color="#7d6647" />
          <Colonnade xs={[-1.7, 1.7]} z={1.7} h={2.4} r={0.18} color="#7d6647" />
          <mesh position={[0, 2.6, 0]} rotation={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[4, 0.16, 3.8]} />
            <meshStandardMaterial color={stallColors[i]} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          <WoodBox w={2.6} h={0.7} d={0.9} y={0.85} z={0.8} color="#8a7150" />
          <mesh position={[0, 1.4, 0.8]} castShadow>
            <sphereGeometry args={[0.4, 8, 6]} />
            <meshStandardMaterial color={stallColors[(i + 2) % 4]} roughness={1} />
          </mesh>
        </group>
      ))}
      {/* 幌子：细柱＋悬挂招牌 */}
      {[-5.8, 5.8].map((x, i) => (
        <group key={x} position={[x, 0.4, 0]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 4.4, 6]} />
            <meshStandardMaterial color="#6b5940" />
          </mesh>
          <mesh position={[0.6, 3.4, 0]} castShadow>
            <boxGeometry args={[1.2, 0.9, 0.06]} />
            <meshStandardMaterial color={i ? "#9c3f2f" : "#4f7a3a"} roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* 市井水井 */}
      <group position={[0, 0.4, 4.6]}>
        <StoneCyl rt={0.7} rb={0.7} h={0.7} y={0.5} color="#7d7464" />
        <WoodBox w={0.16} h={1.6} d={0.16} y={1.6} color="#6b5a3a" />
        <WoodBox w={1.4} h={0.16} d={1.4} y={2.2} color="#8a7150" />
        <TiledConeRoof r={1.1} h={0.6} sides={4} y={2.5} color="#6d6a4e" rot={Math.PI / 4} />
      </group>
    </group>
  );
}

/** 大河渡口：大河水面＋岸线＋码头栈桥＋渡船＋货箱 */
function Ferry() {
  return (
    <group>
      {/* 大河水面：比濠水之畔（半径 12）更大 */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#4f7e84" roughness={0.12} metalness={0.45} transparent opacity={0.92} />
      </mesh>
      {/* 岸线 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[13.4, 15.2, 48]} />
        <meshStandardMaterial color="#9a8c6e" roughness={1} />
      </mesh>
      {/* 码头栈桥：数块木板伸入水面 */}
      <group position={[0, 0, -6]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <WoodBox key={i} w={3.0} h={0.16} d={1.3} y={0.35} z={-i * 1.5} color="#8a7150" />
        ))}
      </group>
      {/* 渡船：梯形船身＋桅杆＋帆 */}
      <group position={[2.4, 0, 2.2]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.5, 0.3, 6]} />
          <meshStandardMaterial color="#7a6142" roughness={1} flatShading />
        </mesh>
        <WoodBox w={2.6} h={0.5} d={1.0} y={0.6} color="#8a7150" />
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 3.2, 6]} />
          <meshStandardMaterial color="#6b5a3a" roughness={1} />
        </mesh>
        <mesh position={[0.5, 2.6, 0]} castShadow>
          <boxGeometry args={[0.06, 1.8, 1.6]} />
          <meshStandardMaterial color="#e4dcc4" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* 货箱 */}
      {[[3.6, -3.0, 0], [-4.2, 2.6, 1]].map(([x, z, r], i) => (
        <WoodBox key={i} w={1.0} h={0.8} d={0.7} x={x} y={0.5} z={z} rot={r} color="#7a6142" />
      ))}
    </group>
  );
}

/** 招贤馆/编简阁：正堂（瓦顶＋门钉＋格扇）＋编简阁细高楼＋竹简层叠＋门客蒲团 */
function GuestHall() {
  return (
    <group>
      <StoneBase w={13} d={11} h={0.5} color="#b0a486" />
      {/* 正堂：身＋柱＋顶，比法家政厅小 */}
      <group position={[-1.5, 0.5, 0]}>
        <TexturedWall w={6} h={3.2} d={5.4} y={1.6} color="#c2ad84" />
        {/* 四角朱柱 */}
        <Colonnade xs={[-2.6, 2.6]} z={2.9} h={3.2} r={0.2} color="#9c4f36" />
        <Colonnade xs={[-2.6, 2.6]} z={-2.9} h={3.2} r={0.2} color="#9c4f36" />
        <Eave w={7.4} d={6.8} y={3.3} color="#4e463a" />
        <CurvedGableRoof span={6.6} length={7.8} height={2} y={3.45} color="#5d6158" rot={Math.PI / 2} />
        {/* 门钉大门 */}
        <PaneledDoor x={0} y={1.1} z={2.78} w={2.4} h={2.2} color="#7a3f28" studs />
        {/* 两侧格扇窗 */}
        <LatticeWindow x={-1.8} y={1.4} z={2.78} w={1} h={1.2} />
        <LatticeWindow x={1.8} y={1.4} z={2.78} w={1} h={1.2} />
        {/* 宫灯：正堂前檐两盏 */}
        <Lantern x={-2.6} y={2.6} z={2.7} />
        <Lantern x={2.6} y={2.6} z={2.7} />
        {/* 匾额：门上 */}
        <Plaque x={0} y={2.45} z={2.85} w={1.7} />
      </group>
      {/* 编简阁：细高两层楼＋竹简层叠＋瓦顶攒尖 */}
      <group position={[4.4, 0.5, -0.5]}>
        <TexturedWall w={3.0} h={4.8} d={3.0} y={2.4} color="#bda98a" />
        {/* 楼层分隔 */}
        <mesh position={[0, 2.4, 1.51]} castShadow>
          <boxGeometry args={[3.0, 0.2, 0.1]} />
          <meshStandardMaterial color="#8a7556" roughness={1} />
        </mesh>
        {/* 竹简层叠：数道横置细条 */}
        {[1.2, 1.7, 2.2, 2.7, 3.2, 3.7].map((yy, i) => (
          <mesh key={i} position={[0, yy, 1.52]} castShadow>
            <boxGeometry args={[2.4, 0.16, 0.08]} />
            <meshStandardMaterial color={i % 2 ? "#9a7a3a" : "#8a6a2a"} roughness={1} />
          </mesh>
        ))}
        <TiledPyramidRoof w={3.4} d={3.4} h={1.2} y={4.8} color="#5d6158" />
      </group>
      {/* 门客蒲团数枚，围于正堂前（中心留给静态吕不韦） */}
      {[[2.0, 3.2], [-3.5, 3.0], [1.6, -3.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 14]} />
          <meshStandardMaterial color="#9d8b6a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export const buildings: Record<string, (props?: { tick?: number }) => React.ReactElement> = {
  academy: Academy,
  workshop: Workshop,
  hall: Hall,
  jixia: Jixia,
  water: Water,
  zongheng: Zongheng,
  mingjia: Mingjia,
  daoshan: Daoshan,
  plaza: Plaza,
  guanxing: Stargazer,
  shapan: SandTable,
  tianshe: Farmhouse,
  chidao: QinRoad,
  shijing: Market,
  dukou: Ferry,
  zhaoxian: GuestHall,
};
