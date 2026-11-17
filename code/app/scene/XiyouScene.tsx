"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { xiyouXZ } from "../world/regions";
import { xiyouRegions, xiyouAllRegions, xiyouRegionMap, XIYOU_PARTY, XIYOU_JOINS } from "../world/xiyou-regions";
import { xiyouPersonas, xiyouPersonaMap } from "../world/xiyou-personas";
import { xiyouBaseRadius, xiyouTagHeight, XIYOU_MODELED } from "./xiyouModelMeta";
import { asset } from "../world/assetPath";
import Figure from "./Figure";

/**
 * 西游世界的三维图：一条取经路，十三处依次缀于其上。
 *
 * 与战国图的分别不在画法而在拓扑（见 xiyou-regions.ts 顶注）：战国十六区是并置的散点，
 * 故那边画的是「天下」；取经路有严格次第，走过的不再回头，故这边画的是**一条线**——
 * 路面本身是主角，十三处只是路上的驻点。已过者作褪色，当下一处作高亮，未至者作留白，
 * 一眼能看出走到了哪。
 *
 * 路上十三处已换成 Blender 模型（唐代＋神魔志怪形制，`zhuzi-world-blender` 生成），
 * 载入前/失败退回占位形制；界外五处仍用占位，它们的形制在规格书之外，未建模。
 * 占位形制因此不是将就，是接口——缺模型的地方它顶上。
 */

/** 路面取样点：十三处之间以 Catmull-Rom 插值取中间点，连成蜿蜒的一条。 */
function routeCurve(): THREE.CatmullRomCurve3 {
  const pts = xiyouRegions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((r) => {
      const [x, z] = xiyouXZ(r.x, r.y);
      return new THREE.Vector3(x, 0.06, z);
    });
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.4);
}

/** 可复现的伪随机（与 Terrain.tsx 同一款 LCG）：环境每次重渲不跳变 */
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * 环境之一：沿途林木。沿路两侧撒树，避让十三处的基面（模型各有其院落，
 * 树长进人家院里就穿帮了）。火焰山一带换成焦黑枯木——树也烤死了，这是
 * 「八百里火焰」在环境上的说法。
 */
function useRoadsideTrees(curve: THREE.CatmullRomCurve3) {
  return useMemo(() => {
    const rand = lcg(20261022);
    const trees: { pos: [number, number, number]; h: number; w: number; burnt: boolean; tilt: number }[] = [];
    // 十三处基面圆心，撒树时避让
    const stops = xiyouAllRegions.map((r) => {
      const [x, z] = xiyouXZ(r.x, r.y);
      return { id: r.id, x, z, r: xiyouBaseRadius(r.id) + 3 };
    });
    const nearFire = (x: number, z: number) => {
      const [fx, fz] = xiyouXZ(xiyouRegionMap.huoyanshan.x, xiyouRegionMap.huoyanshan.y);
      return Math.hypot(x - fx, z - fz) < 34;
    };
    const N = 240;
    for (let i = 0; i < N; i++) {
      const t = rand();
      const p = curve.getPoint(t);
      // 沿法线偏到路两侧 7~26m（路是贴地带子宽 7，基面半径各处 9~17）
      const tan = curve.getTangent(t);
      const side = rand() > 0.5 ? 1 : -1;
      const off = 7 + rand() * 19;
      const x = p.x - tan.z * side * off;
      const z = p.z + tan.x * side * off;
      const clash = stops.some((s) => Math.hypot(x - s.x, z - s.z) < s.r + 2);
      if (clash) continue;
      trees.push({
        pos: [x, 0, z],
        h: 3.4 + rand() * 4.2,
        w: 0.22 + rand() * 0.16,
        burnt: nearFire(x, z),
        tilt: (rand() - 0.5) * 0.12,
      });
    }
    return trees;
  }, [curve]);
}

/** 树与枯木各是一棵 instancedMesh 的料；一次 draw call，240 棵不当回事 */
function Trees({ items }: { items: ReturnType<typeof useRoadsideTrees> }) {
  const alive = useMemo(() => items.filter((t) => !t.burnt), [items]);
  const burnt = useMemo(() => items.filter((t) => t.burnt), [items]);
  return (
    <>
      <InstancedTrees items={alive} trunk="#6a5438" crown="#6f7a4a" />
      <InstancedTrees items={burnt} trunk="#3a322c" crown="#3a322c" bare />
    </>
  );
}

function InstancedTrees({
  items, trunk, crown, bare = false,
}: {
  items: { pos: [number, number, number]; h: number; w: number; tilt: number }[];
  trunk: string;
  crown: string;
  bare?: boolean;
}) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!trunks.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((t, i) => {
      q.setFromAxisAngle(up, t.tilt);
      m.compose(
        new THREE.Vector3(...t.pos),
        q,
        new THREE.Vector3(t.w, t.h, t.w),
      );
      trunks.current!.setMatrixAt(i, m);
      if (crowns.current) {
        m.compose(
          new THREE.Vector3(t.pos[0], t.pos[1] + t.h * 0.72, t.pos[2]),
          q,
          new THREE.Vector3(t.h * 0.42, t.h * 0.6, t.h * 0.42),
        );
        crowns.current.setMatrixAt(i, m);
      }
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
  }, [items]);
  const crownGeo = useMemo(() => {
    // 一颗 icosahedron 顶点稍压扁再随机化太贵，直接用低段 ico，flatShading 出棱角
    const g = new THREE.IcosahedronGeometry(1, 0);
    g.scale(1, 1.25, 1);
    return g;
  }, []);
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, items.length]} castShadow>
        <cylinderGeometry args={[0.7, 1, 1, 5]} />
        <meshStandardMaterial color={trunk} roughness={1} flatShading />
      </instancedMesh>
      {!bare && (
        <instancedMesh ref={crowns} args={[undefined, undefined, items.length]} castShadow>
          <primitive object={crownGeo} attach="geometry" />
          <meshStandardMaterial color={crown} roughness={1} flatShading />
        </instancedMesh>
      )}
    </group>
  );
}

/**
 * 环境之二：远山。只作地平线的收笔——压得矮、颜色贴雾色，远看是「天地相接
 * 处有一线起伏」，近看不能抢十三处的戏。建筑是主角，山是背景。
 */
function FarMountains() {
  const mounts = useMemo(() => {
    const rand = lcg(62026102);
    const out: { pos: [number, number, number]; r: number; h: number; tone: number }[] = [];
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2 + rand() * 0.12;
      const d = 150 + rand() * 30;
      out.push({
        pos: [Math.cos(a) * d, 0, Math.sin(a) * d],
        r: 12 + rand() * 14,
        h: 7 + rand() * 10,
        tone: rand(),
      });
    }
    return out;
  }, []);
  return (
    <group>
      {mounts.map((m, i) => (
        <mesh key={i} position={[m.pos[0], m.h / 2 - 2, m.pos[2]]} rotation={[0, i * 0.7, 0]}>
          <coneGeometry args={[m.r, m.h, 5]} />
          <meshStandardMaterial
            color={m.tone > 0.5 ? "#cabfa4" : "#c3b79b"}
            roughness={1}
            flatShading
            fog
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 环境之三：云。神魔志怪的天该有云，大团、慢移。云脚离地四五十米——
 * 建筑放大一档后雷音脊到 29 米，云再压低就穿进殿顶了；这个高度取经人
 * 抬头仍看得见，但够不到任何一处屋脊。半透明、不投影（投影会压脏地面）。
 */
function Clouds() {
  const puffs = useMemo(() => {
    const rand = lcg(10222026);
    const out: { pos: [number, number, number]; s: number; drift: number }[] = [];
    for (let c = 0; c < 9; c++) {
      const cx = (rand() - 0.5) * 200;
      const cz = (rand() - 0.5) * 200;
      const cy = 46 + rand() * 12;
      for (let j = 0; j < 3 + Math.floor(rand() * 3); j++) {
        out.push({
          pos: [cx + (rand() - 0.5) * 16, cy + (rand() - 0.5) * 3, cz + (rand() - 0.5) * 10],
          s: 5 + rand() * 8,
          drift: 0.4 + rand() * 0.5,
        });
      }
    }
    return out;
  }, []);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.position.x += dt * 0.8;
  });
  return (
    <group ref={g}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[p.s, 10, 8]} />
          <meshStandardMaterial
            color="#f5ead2"
            roughness={1}
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 演示镜头：约 54° 的高斜侧望——不俯到 90°（正顶上把建筑压成一片顶面，
 * 「有点太俯了」），俯而不垂，顶面立面都读得出。且**随行**：每到一处，镜头
 * 缓摇到那一处的斜上方，十拍摇下来画面自己在往西挪，演示像一场「走」。
 * 四众的走不归镜头管：Figure 本就自当前位置平滑走向 target（且面向行进方向、
 * 落脚印），目标一换到下一处，他们自然从原地起步——不必在镜头这边代劳。
 * OrbitControls 演示期间禁用，免得手一滑把镜头摇走；停演缓摇回原视角还给你。
 *
 * 手动看图的换处改**只转目光**：只把 controls.target 移过去，镜头原地不动——
 * 图转过来，看图人自摆的视角不许没收。这也让匾额的定尺（Html 已去 distanceFactor，
 * 见 Stop 处注释）名副其实：纵使镜头真飞，匾也不随远近改大改小。
 */
/** 随行悬停位：锚点（当下这一处）往南退 115m、抬 160m，约 54° 俯角 */
const DEMO_OFF = new THREE.Vector3(0, 160, 115);

function DemoCamera({ demo, stopId }: { demo: boolean; stopId: string }) {
  const camera = useThree((s) => s.camera);
  // makeDefault 的 OrbitControls（drei）挂在 state.controls 上
  const controls = useThree((s) => s.controls) as unknown as
    | { target: THREE.Vector3; enabled: boolean; update: () => void }
    | null;
  const saved = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3 } | null>(null);
  /** 已对过位的一处：手动换处才平移，首挂与停演不算 */
  const seen = useRef<string | null>(null);
  const anim = useRef<{
    t0: number; dur: number;
    from: THREE.Vector3; fromT: THREE.Vector3; to: THREE.Vector3; toT: THREE.Vector3;
  } | null>(null);
  const fly = (to: THREE.Vector3, toT: THREE.Vector3, dur: number) => {
    if (!controls) return;
    anim.current = {
      t0: performance.now(), dur,
      from: camera.position.clone(), fromT: controls.target.clone(),
      to: to.clone(), toT: toT.clone(),
    };
  };
  useEffect(() => {
    if (!controls) return;
    if (demo) {
      const first = !saved.current;
      if (first) saved.current = { pos: camera.position.clone(), tgt: controls.target.clone() };
      const r = xiyouRegionMap[stopId];
      const [sx, sz] = xiyouXZ(r.x, r.y);
      // 随行摇镜：首拍从原视角摇得慢些，此后每拍一换，镜头跟着西挪
      fly(
        new THREE.Vector3(sx + DEMO_OFF.x, DEMO_OFF.y, sz + DEMO_OFF.z),
        new THREE.Vector3(sx, 0, sz),
        first ? 1500 : 2200,
      );
      controls.enabled = false;
      seen.current = stopId; // 演示一路换处皆已对位，停演那拍不得再算手动换处
      return;
    }
    if (saved.current) {
      fly(saved.current.pos, saved.current.tgt, 900);
      controls.enabled = true;
      saved.current = null;
      return;
    }
    // 手动换处：只把**目光**转过去，人不动（见顶注）。摇完在 useFrame 交还控制权
    if (seen.current === null) {
      seen.current = stopId; // 首挂：图自己张开来就好，不必先摇一下
      return;
    }
    if (seen.current === stopId) return;
    seen.current = stopId;
    const r = xiyouRegionMap[stopId];
    const [sx, sz] = xiyouXZ(r.x, r.y);
    const toT = new THREE.Vector3(sx, controls.target.y, sz);
    fly(camera.position.clone(), toT, 1100);
    controls.enabled = false;
  }, [demo, stopId, camera, controls]);
  useFrame(() => {
    const a = anim.current;
    if (!a || !controls) return;
    const k = Math.min(1, (performance.now() - a.t0) / a.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    camera.position.lerpVectors(a.from, a.to, e);
    controls.target.lerpVectors(a.fromT, a.toT, e);
    controls.update();
    if (k >= 1) {
      anim.current = null;
      // 手动平移只在摇完时交还；演示的禁用/启用走 effect，不经此路
      if (!demo && !saved.current) controls.enabled = true;
    }
  });
  return null;
}

/**
 * 路：按次第分成「已过／未至」两截，已过者深赭、未至者淡土。
 * 大地是素面，路若比地色还淡（旧版半透明贴地色）就等于没有——十三处放大后
 * 更是如此。故两截都压得住地色；分别只靠深浅，不靠有无。
 * 铺法是**贴地的带子**，不是管子：旧版 tubeGeometry 圆管一截，高斜镜头一挂
 * 立刻显出圆筒的鼓形（用户原话「圆筒一样的管」），人走在路上也像钻在管里。
 * 路的本相是地上一道，不是地上一根。曲线由父层传入（树与人物落位也用它）。
 */
/** 平路基：沿曲线每隔一站两侧各铺半宽，织成一条贴地带子（索引三角面） */
function ribbonGeo(curve: THREE.CatmullRomCurve3, width: number, y: number, seg = 220): THREE.BufferGeometry {
  const pts = curve.getSpacedPoints(seg); // 弧长均分，带宽处不宽处不匀
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const p = pts[i];
    // 切向取邻点差（首尾各退一位），路侧法线即其垂线
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(seg, i + 1)];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * width * 0.5;
    const nz = (dx / l) * width * 0.5;
    pos.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz);
    if (i < seg) {
      const k = i * 2;
      // 缠向必须面朝上：从上往下看逆时针才是正面（材质默认 FrontSide）。
      // 上一版缠反了，整条路背对镜头被剔除——「怎么没路了」。
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function Route({ passed, curve }: { passed: number; curve: THREE.CatmullRomCurve3 }) {
  // 曲线按处数等分；passed 为已过的处数，故切分点取其比例
  const frac = Math.max(0, Math.min(1, (passed - 1) / (xiyouRegions.length - 1)));
  const done = useMemo(() => {
    if (frac <= 0) return null;
    const pts = curve.getPoints(220).slice(0, Math.max(2, Math.round(220 * frac)));
    return new THREE.CatmullRomCurve3(pts);
  }, [curve, frac]);
  const road = useMemo(() => ribbonGeo(curve, 7, 0.16), [curve]);
  // 已过的一截略宽、略抬，作深赭一道压在土路上，免得两条带贴面打架
  const walked = useMemo(() => (done ? ribbonGeo(done, 7.8, 0.28) : null), [done]);

  return (
    <>
      <mesh receiveShadow geometry={road}>
        <meshStandardMaterial color="#a08a5e" roughness={1} transparent opacity={0.95} />
      </mesh>
      {walked && (
        <mesh receiveShadow geometry={walked}>
          <meshStandardMaterial color="#8f5c2a" roughness={0.95} />
        </mesh>
      )}
    </>
  );
}

/**
 * 到达的一圈涟漪：换处即从那一处基面荡开一圈朱砂，淡出即止——演示一拍一记，
 * 手动跳处也记这一拍。「到过」是这条路最后剩下的东西：路条上是一粒暗点，
 * 图上便给一圈淡红，从殿脚下荡开，像是这一处认下了队伍来过。
 */
function ArrivalPulse({ stopId }: { stopId: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const startedAt = useRef(-1e9);
  useEffect(() => {
    const r = xiyouRegionMap[stopId];
    const m = ring.current;
    if (!r || !m) return;
    const [x, z] = xiyouXZ(r.x, r.y);
    m.position.set(x, 0.5, z);
    startedAt.current = performance.now();
  }, [stopId]);
  useFrame(() => {
    const m = ring.current;
    const mt = mat.current;
    if (!m || !mt) return;
    const e = (performance.now() - startedAt.current) / 2200;
    if (e >= 1) {
      m.visible = false;
      return;
    }
    m.visible = true;
    const k = 1 - (1 - e) ** 3; // easeOutCubic：起手快，荡开渐缓
    m.scale.setScalar(2 + k * (xiyouBaseRadius(stopId) + 12));
    mt.opacity = 0.4 * (1 - e * e);
  });
  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.93, 1, 56]} />
      <meshBasicMaterial ref={mat} color="#9b3f32" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/**
 * 界外五处的「到达一折」：五处是悟空一个人的前史（前七回），每一处都该有
 * 它自己的样子——花果山石卵迸裂（从石头里蹦出来）、三星洞金星升起、凌霄
 * 火光冲天、兜率宫丹焰盘旋、南海水纹荡开。与 ArrivalPulse 同例：换处即演，
 * 演示一拍一折，手动跳处也演；路上十三处不演此折（路上的记认是那一圈朱砂
 * 涟漪，界外的记认是这一折）。
 *
 * 全用 meshBasic 透明贴面、depthWrite 关掉——是「记」，不是「物」，不进
 * 拾取、不受光。各折的参数按序号定死（不用 Math.random），两次进场看到
 * 的是同一折。
 */
const OFF_FX = {
  huaguo: { kind: "shards", y: 9.5 }, // 石卵在山顶迸开
  xieyue: { kind: "stars", y: 5.5 }, // 洞口三星升起
  lingxiao: { kind: "pillars", y: 1.2 }, // 台前火光冲天
  doushuai: { kind: "embers", y: 1.5 }, // 炉前丹焰盘旋
  nanhai: { kind: "ripples", y: 0.55 }, // 水面水纹三圈
} as const;

/** 各折的用色：石灰／星金／朱砂火／丹火／水玉 */
const OFF_FX_COLOR: Record<string, string> = {
  shards: "#8d8578",
  stars: "#d9b45a",
  pillars: "#9b3f32",
  embers: "#c4531f",
  ripples: "#7fa8a0",
};

function OffArrivalFx({ stopId }: { stopId: string }) {
  const root = useRef<THREE.Group>(null);
  const kinds = useRef<Record<string, THREE.Group | null>>({});
  const parts = useRef<Record<string, (THREE.Mesh | null)[]>>({});
  const site = useRef<string | null>(null);
  const t0 = useRef(-1e9);
  useEffect(() => {
    const r = xiyouRegionMap[stopId];
    if (!r?.offRoute || !(stopId in OFF_FX)) {
      site.current = null;
      return;
    }
    const [x, z] = xiyouXZ(r.x, r.y);
    if (root.current) root.current.position.set(x, 0, z);
    site.current = stopId;
    t0.current = performance.now();
  }, [stopId]);

  useFrame(() => {
    const dur = 2.2;
    const e = (performance.now() - t0.current) / (dur * 1000);
    for (const g of Object.values(kinds.current)) if (g) g.visible = false;
    const s = site.current;
    if (!s || e >= 1 || !root.current) return;
    const cfg = OFF_FX[s as keyof typeof OFF_FX];
    const g = kinds.current[cfg.kind];
    const ms = parts.current[cfg.kind] ?? [];
    if (!g) return;
    g.visible = true;
    const t = e * dur;
    ms.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshBasicMaterial;
      // 水纹那几片自己管显隐（错开起跑），其余各片到了这里就该在场
      m.visible = cfg.kind !== "ripples";
      switch (cfg.kind) {
        // 石卵迸裂：十块碎石从山顶抛物线撒开，落了地便不再沉
        case "shards": {
          const a = i * 0.63 + 0.4;
          const sp = 13 + (i % 3) * 3.5;
          const up = 17 + (i % 4) * 2.6;
          m.position.set(Math.cos(a) * sp * t, cfg.y + up * t - 4.9 * t * t, Math.sin(a) * sp * t);
          if (m.position.y < 0.35) m.position.y = 0.35;
          m.rotation.set(t * (3 + (i % 5) * 1.2), t * 2.1, 0);
          m.scale.setScalar(Math.max(0.05, 1 - e * 0.55));
          mat.opacity = 1 - e;
          break;
        }
        // 三星升起：三粒金星盘着升，愈高愈淡
        case "stars": {
          const a = i * 2.1 + t * 0.9;
          const r = 4.5 + i * 1.8 - t * 0.5;
          m.position.set(Math.cos(a) * r, cfg.y + (7 + i * 1.6) * t, Math.sin(a) * r);
          m.rotation.set(t * 1.4, t * 1.9, 0);
          m.scale.setScalar(0.85 + Math.sin(t * 7 + i * 2) * 0.25);
          mat.opacity = e < 0.7 ? 0.95 : 0.95 * (1 - (e - 0.7) / 0.3);
          break;
        }
        // 火光冲天：三道火柱错开起，边升边细，明灭一下便散
        case "pillars": {
          const h = 4 + t * 11;
          m.position.set((i - 1) * 6, cfg.y + h / 2, 0);
          m.scale.set(1 - e * 0.6, h, 1 - e * 0.6);
          mat.opacity = 0.55 * (1 - e) * (0.8 + 0.2 * Math.sin(t * 18 + i * 2));
          break;
        }
        // 丹焰盘旋：八卦炉的火——绕着炉心一边转一边升
        case "embers": {
          const a = i * 0.449 + t * 2.6;
          const r = 2.5 + (i % 5) * 1.2 + t * 3;
          m.position.set(Math.cos(a) * r, cfg.y + t * (6.5 + (i % 4) * 1.8), Math.sin(a) * r);
          m.rotation.set(t * (2 + (i % 3)), t * 1.7, t);
          m.scale.setScalar(Math.max(0.05, 0.6 - e * 0.25));
          mat.opacity = 1 - e;
          break;
        }
        // 水纹荡开：三圈错开，一圈追着一圈；贴着水面平铺
        case "ripples": {
          m.rotation.set(-Math.PI / 2, 0, 0);
          const ej = (t - i * 0.28) / 1.65;
          if (ej < 0 || ej >= 1) return;
          m.visible = true;
          m.scale.setScalar(2 + ej * 22);
          mat.opacity = 0.5 * (1 - ej);
          break;
        }
      }
    });
  });

  const batch = (kind: string, n: number, children: (i: number) => ReactNode) => (
    <group
      ref={(g) => {
        kinds.current[kind] = g;
      }}
      visible={false}
    >
      {Array.from({ length: n }, (_, i) => (
        <mesh
          key={i}
          visible={false}
          ref={(m) => {
            parts.current[kind] = parts.current[kind] ?? [];
            parts.current[kind][i] = m;
          }}
        >
          {children(i)}
          <meshBasicMaterial color={OFF_FX_COLOR[kind]} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group ref={root}>
      {batch("shards", 10, () => (
        <dodecahedronGeometry args={[1.3, 0]} />
      ))}
      {batch("stars", 3, () => (
        <octahedronGeometry args={[1.1, 0]} />
      ))}
      {batch("pillars", 3, () => (
        <coneGeometry args={[1.6, 1, 8, 1, true]} />
      ))}
      {batch("embers", 14, () => (
        <tetrahedronGeometry args={[0.8, 0]} />
      ))}
      {batch("ripples", 3, () => (
        <ringGeometry args={[0.92, 1, 48]} />
      ))}
    </group>
  );
}

/**
 * 一处的占位形制。路上十三处各有其象（阙/山/庄/河/观/岭/坛/渡/宫/焰/塔/骨/莲），
 * 界外五处别有五象（洞/星/殿/炉/岛）；此处只据 `icon` 分类作粗形，取其轮廓可辨即止——
 * 细处留给 Blender。
 */
function Placeholder({ icon, color, tall }: { icon: string; color: string; tall: number }) {
  switch (icon) {
    case "山":
    case "岭":
      return (
        <mesh position={[0, tall / 2, 0]} castShadow>
          <coneGeometry args={[4.2, tall, 5]} />
          <meshStandardMaterial color={color} roughness={1} flatShading />
        </mesh>
      );
    case "河":
    case "渡":
      return (
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5.4, 28]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
        </mesh>
      );
    case "焰":
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[(i - 1) * 2.4, tall * (0.5 - i * 0.08), 0]} castShadow>
              <coneGeometry args={[1.5, tall * (1 - i * 0.16), 6]} />
              <meshStandardMaterial color={i === 1 ? "#c4531f" : color} roughness={0.8} flatShading />
            </mesh>
          ))}
        </group>
      );
    case "塔":
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, 1 + i * (tall / 4.4), 0]} castShadow>
              <boxGeometry args={[4.4 - i * 0.8, tall / 5, 4.4 - i * 0.8]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          ))}
        </group>
      );
    case "莲":
      return (
        <group>
          <mesh position={[0, tall * 0.55, 0]} castShadow>
            <sphereGeometry args={[2.6, 18, 14]} />
            <meshStandardMaterial color="#e2c268" roughness={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[0, tall * 0.2, 0]} castShadow>
            <cylinderGeometry args={[4.2, 5, tall * 0.4, 8]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        </group>
      );
    case "骨":
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.26) * 3, 0.9, Math.sin(i * 1.26) * 3]} castShadow>
              <sphereGeometry args={[0.95, 10, 8]} />
              <meshStandardMaterial color="#ddd6c4" roughness={1} />
            </mesh>
          ))}
          <mesh position={[0, tall * 0.35, 0]} castShadow>
            <cylinderGeometry args={[3, 3.6, tall * 0.7, 6]} />
            <meshStandardMaterial color={color} roughness={1} flatShading />
          </mesh>
        </group>
      );
    // —— 以下五形皆界外之地，各有其象，不与路上十三处相混 ——
    case "洞":
      // 花果山水帘洞：山一座，洞门当中，门前一道飞瀑垂下作帘
      return (
        <group>
          <mesh position={[0, tall / 2, 0]} castShadow>
            <coneGeometry args={[4.6, tall, 6]} />
            <meshStandardMaterial color={color} roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 1.5, 3.1]} castShadow>
            <boxGeometry args={[2.6, 3, 1.2]} />
            <meshStandardMaterial color="#3a3028" roughness={1} />
          </mesh>
          <mesh position={[0, 3.1, 3.9]}>
            <planeGeometry args={[4, 5.6]} />
            <meshStandardMaterial color="#cfe3e0" roughness={0.3} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case "星":
      // 斜月三星洞：三星者三柱，斜月者一弧；洞在其后
      return (
        <group>
          {[-1, 0, 1].map((i) => (
            <mesh key={i} position={[i * 2.5, tall * 0.3 + (i === 0 ? 0.6 : 0), 1.8]} castShadow>
              <cylinderGeometry args={[0.52, 0.72, tall * 0.6 + (i === 0 ? 1.2 : 0), 7]} />
              <meshStandardMaterial color="#cfc6ab" roughness={1} />
            </mesh>
          ))}
          <mesh position={[0, tall * 0.5, -2.2]} rotation={[0, 0, 0.5]} castShadow>
            <torusGeometry args={[3.2, 0.42, 8, 22, Math.PI * 1.15]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.4, -2.2]} castShadow>
            <boxGeometry args={[3.4, 2.8, 2.4]} />
            <meshStandardMaterial color="#4a4238" roughness={1} />
          </mesh>
        </group>
      );
    case "殿":
      // 凌霄宝殿：云作基，殿身广，重檐作金——天上之物，形制须比人间宽一档
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[(i - 1) * 4.4, 0.5, (i % 2 === 0 ? 1 : -1) * 1.6]}>
              <sphereGeometry args={[3.4, 14, 10]} />
              <meshStandardMaterial color="#efe6d2" roughness={0.9} transparent opacity={0.85} />
            </mesh>
          ))}
          <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[11, 1.2, 7.4]} />
            <meshStandardMaterial color="#b6a883" roughness={1} />
          </mesh>
          <mesh position={[0, 3 + tall * 0.3, 0]} castShadow>
            <boxGeometry args={[9, tall * 0.6, 6]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 3 + tall * 0.72, 0]} castShadow>
            <coneGeometry args={[7.8, tall * 0.34, 4]} />
            <meshStandardMaterial color="#d8a93f" roughness={0.5} metalness={0.35} flatShading />
          </mesh>
        </group>
      );
    case "炉":
      // 兜率宫八卦炉：三足、鼎身、炉盖，盖上一缕未散之烟
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos(i * 2.1) * 2.6, 0.8, Math.sin(i * 2.1) * 2.6]} castShadow>
              <cylinderGeometry args={[0.45, 0.6, 1.6, 6]} />
              <meshStandardMaterial color="#6a5a44" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 1.6 + tall * 0.26, 0]} castShadow>
            <cylinderGeometry args={[3.6, 3.1, tall * 0.52, 8]} />
            <meshStandardMaterial color={color} roughness={0.75} metalness={0.25} />
          </mesh>
          <mesh position={[0, 1.6 + tall * 0.6, 0]} castShadow>
            <coneGeometry args={[3.9, tall * 0.2, 8]} />
            <meshStandardMaterial color="#8d6b3a" roughness={0.6} metalness={0.3} flatShading />
          </mesh>
          <mesh position={[0, 1.6 + tall * 0.82, 0]}>
            <sphereGeometry args={[1.1, 12, 9]} />
            <meshStandardMaterial color="#e6dcc6" roughness={1} transparent opacity={0.55} />
          </mesh>
        </group>
      );
    case "岛":
      // 南海落伽山：一片水，当中一岛，岛上净瓶杨柳
      return (
        <group>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[6.6, 30]} />
            <meshStandardMaterial color="#7fa7a2" roughness={0.3} metalness={0.12} />
          </mesh>
          <mesh position={[0, tall * 0.28, 0]} castShadow>
            <coneGeometry args={[3.4, tall * 0.56, 7]} />
            <meshStandardMaterial color={color} roughness={1} flatShading />
          </mesh>
          <mesh position={[0, tall * 0.68, 0]} castShadow>
            <cylinderGeometry args={[0.9, 1.3, tall * 0.3, 10]} />
            <meshStandardMaterial color="#f2efe4" roughness={0.45} />
          </mesh>
          <mesh position={[0.1, tall * 0.92, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.08, 0.12, 2.6, 5]} />
            <meshStandardMaterial color="#6f8a4a" roughness={1} />
          </mesh>
        </group>
      );
    default:
      // 阙/庄/观/坛/宫：一律作台基＋屋身＋坡顶的粗形
      return (
        <group>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[9, 1, 7]} />
            <meshStandardMaterial color="#9c8f6c" roughness={1} />
          </mesh>
          <mesh position={[0, 1 + tall * 0.33, 0]} castShadow>
            <boxGeometry args={[7.2, tall * 0.66, 5.4]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1 + tall * 0.78, 0]} castShadow>
            <coneGeometry args={[6.4, tall * 0.42, 4]} />
            <meshStandardMaterial color="#5a4a3a" roughness={0.85} flatShading />
          </mesh>
        </group>
      );
  }
}

/**
 * 西游的 Blender 建筑：与战国的 `BuildingModel` 同一套双层兜底
 * （载入前 Suspense 退回占位形制，载入失败错误边界同样退回），只两处不同：
 * 取的 glb 带 `xy_` 前缀（两个世界的模型同放一个 models/ 目录，前缀防同名互盖）；
 * 尺寸表换 `xiyouModelMeta`（取经路挤，占地尺子与战国不同）。
 */
const DRACO = asset("/draco/");

function XyGltf({ id }: { id: string }) {
  const { scene } = useGLTF(asset(`/models/xy_${id}.glb`), DRACO);
  // useGLTF 同一 url 返回同一对象，clone 只复制节点，几何与材质仍共享（与战国那边同理）
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
    });
    return o;
  }, [scene]);
  return <primitive object={obj} />;
}

class XyFallback extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function XiyouModel({ id, fallback }: { id: string; fallback: ReactNode }) {
  if (!XIYOU_MODELED.has(id)) return <>{fallback}</>;
  return (
    <XyFallback fallback={fallback}>
      <Suspense fallback={fallback}>
        <XyGltf id={id} />
      </Suspense>
    </XyFallback>
  );
}

/**
 * 一处：夯土基面 ＋ 占位形制 ＋ 可点的匾额。已过者褪色，当下者高亮。
 * 界外五处别作一色（青），匾上不标次第而标「界外」——它们不在那一串数里。
 */
function Stop({
  id,
  state,
  selected,
  onSelect,
}: {
  id: string;
  state: "passed" | "here" | "ahead" | "off";
  selected: boolean;
  onSelect: () => void;
}) {
  const r = xiyouRegionMap[id];
  const [x, z] = xiyouXZ(r.x, r.y);
  const color =
    state === "here" ? "#b8742c" : state === "passed" ? "#8a8070" : state === "off" ? "#7d8a93" : "#a39c88";
  const tall = 6.5;
  // 基面与匾额都随这一处的实际尺寸走（xiyouModelMeta 由 Blender 导出时生成），
  // 与战国图同法；缺 meta 的处（界外五处本就没建模）退回旧常数
  const br = xiyouBaseRadius(id);
  const th = xiyouTagHeight(id);

  return (
    <group position={[x, 0, z]} rotation={[0, r.facing, 0]}>
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <circleGeometry args={[br, 36]} />
        <meshStandardMaterial
          color={state === "here" ? "#9a8a60" : state === "off" ? "#8a8878" : "#8d8259"}
          roughness={1}
          transparent
          opacity={state === "ahead" ? 0.55 : 1}
        />
      </mesh>
      <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <XiyouModel id={id} fallback={<Placeholder icon={r.icon} color={color} tall={tall} />} />
      </group>
      {/* 匾额**屏幕定尺**，不吃 distanceFactor：drei 的 Html 挂载那帧写的
          transform 不带 scale（视同 1），而 useFrame 只在投影挪动 ≥ε 时才重写
          transform——故进场静看时匾额多大就多大，镜头一动（换处、演示、亲手
          拖拽）才第一次补上 distanceFactor 的缩放，全图匾额一齐缩成芝麻
          （「一点就变小」的真因不在镜头飞没飞，在这一行迟到的 scale）。
          定尺后与纸图题字一律：进场多大，走到头还多大。 */}
      <Html position={[0, th, 0]} center zIndexRange={[6, 0]}>
        <button
          className={`xy-tag${state === "here" ? " here" : ""}${selected ? " on" : ""}${state === "ahead" ? " ahead" : ""}${state === "off" ? " off" : ""}`}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          {/* 标次第者只路上十三处；界外之地纵然选中（state 转作 here），也仍标「外」——
              否则匾上会跳出一个 0 来，那是 order 的缺省，不是一个次第 */}
          <i>{r.offRoute ? "外" : r.order}</i>
          <b>{r.name}</b>
          <span>{r.sub}</span>
        </button>
      </Html>
    </group>
  );
}

type Props = {
  /** 当下所在之处的 id；其前者作已过，其后者作未至 */
  stopId: string;
  /**
   * 路上走到了第几处（1–13）。
   *
   * 不由 `stopId` 自己推，因为界外五处的 `order` 为 0：看一眼凌霄殿不该把取经路的进度
   * 抹掉，路会整条褪回起点，像是从未走过。故由上层记住最后一次在路上的次第，
   * 图与路条共用这一个数，两处才不会各说各的。
   */
  passed: number;
  /** 选中的人物 id */
  selectedId: string;
  /**
   * 自动演示进行中：镜头接管为高斜随行（54° 俯而不垂，逐处西挪，见 DemoCamera）、
   * 雾推远，界面退灰在 CSS 侧。四众的走由 Figure 自身的插值完成——目标换到
   * 下一处，自然从原地起步。演示是「拿来看的」，地图要占满整个注意力。
   */
  demo?: boolean;
  onSelectStop: (id: string) => void;
  onSelectPersona: (id: string) => void;
};

/** 图上一个人物的落位 */
type Spot = { id: string; pos: [number, number, number]; phase: number };

export default function XiyouScene({ stopId, passed, selectedId, demo = false, onSelectStop, onSelectPersona }: Props) {
  const here = xiyouRegionMap[stopId] ?? xiyouRegions[0];
  const curve = useMemo(() => routeCurve(), []);
  const roadsideTrees = useRoadsideTrees(curve);

  // 四众随队行至当下一处——但「随队」自有次第（XIYOU_JOINS）：走到谁跟前谁才入队，
  // 未入队者在其入队之处候着。守一处者（牛魔王守火焰山、镇元子守五庄观、如来
  // 坐雷音……）各在其地，不随队走。守谁不写死：凡 home 落在图上某处者皆是——
  // 新添一人只需给他一个 home，此处不必再改。
  const figures = useMemo(() => {
    const [hx, hz] = xiyouXZ(here.x, here.y);
    // 界外五处（学道、称王、反天宫、受炼、求告）皆是行者独行所至，四众未曾同去；
    // 故在那里只摆他一个，摆上师父师弟反而是添一段书上没有的事。
    const comers = here.offRoute ? ["wukong"] : XIYOU_PARTY;
    // 界外是他的独行与前史，不问取经路走到哪；路上则要问——passed 未到他入队
    // 之处者仍候在原地，不当已随队。
    const joined = here.offRoute
      ? comers
      : comers.filter((id) => passed >= xiyouRegionMap[XIYOU_JOINS[id]].order);
    // 四众的落位不再用 slots：那是给战国的门阙院落备的——院是空的，人站得进去；
    // 西游的模型是实心殿宇，slots 离圆心三五米，人便站进了殿身（用户已见「穿模」）。
    // 改立「路旁一列」：按过路走向（前一处→后一处）求路侧法线，立基面外三米、
    // 取面南一侧（镜头所在），沿路向排开。行至一处，人在檐下阶前；两处之间走的
    // 也是两列路旁点之间的连线，不穿任何一处的殿身。
    const roadside = (i: number, n: number): [number, number, number] => {
      // 基面外再退一档：人物 scale 3 后袍径近 8m，+3 时袍缘只差 0.4m 就蹭上墙
      const stand = xiyouBaseRadius(here.id) + 4;
      if (here.offRoute) return [hx, 0.4, hz + stand]; // 界外路不经过，立南面即可
      const prev = xiyouRegions.find((r) => r.order === here.order - 1);
      const next = xiyouRegions.find((r) => r.order === here.order + 1);
      const [ax, az] = prev ? xiyouXZ(prev.x, prev.y) : [hx, hz];
      const [bx, bz] = next ? xiyouXZ(next.x, next.y) : [2 * hx - ax, 2 * hz - az];
      const len = Math.hypot(bx - ax, bz - az) || 1;
      const dx = (bx - ax) / len;
      const dz = (bz - az) / len;
      let nx = -dz;
      let nz = dx;
      if (nz < 0) {
        nx = -nx;
        nz = -nz;
      } // 路侧恒取面南（镜头一侧）
      // 列距按袍径定：scale 3 后袍径约 7.6m，列距 2.4m 等于叠着走（用户「叠在
      // 一起」）。8.5m 一人，袍缘恰不相犯，一列四人也不过 25m，路旁站得下。
      const row = (i - (n - 1) / 2) * 8.5;
      return [hx + nx * stand + dx * row, 0.4, hz + nz * stand + dz * row];
    };
    const party: Spot[] = joined.map((id, i) => ({
      id,
      pos: roadside(i, joined.length),
      phase: i,
    }));
    // 外缘环（基面半径 + 2.5 米）摆两类人：候着入队的四众成员，与守一处的居停者。
    // 基面随模型大小收放（长安 ⌀17，白虎岭 ⌀9），外缘跟着走，不写死一个数。
    // 从前居停者遇「正在其家」便跳过，于是走到火焰山牛魔王反倒不见了——人在自家
    // 门口消失，没有道理。今不跳过，只沿环错开；候队者同理。队伍永不可能到一处
    // 而其人未入队（入队即在那一处），故候者与四众的 slots 落位不相犯。
    const ringed: Spot[] = [];
    const perHome = new Map<string, number>();
    const onRing = (rid: string): [number, number, number] => {
      const r = xiyouRegionMap[rid];
      const [rx, rz] = xiyouXZ(r.x, r.y);
      const k = perHome.get(rid) ?? 0;
      perHome.set(rid, k + 1);
      // 同在一环者（火焰山上牛魔王与铁扇、凌霄殿上玉帝与金星）沿环分开站
      const a = -1.0 + k * 0.78;
      const ring = xiyouBaseRadius(rid) + 2.5;
      return [rx + Math.cos(a) * ring, 0.4, rz + Math.sin(a) * ring];
    };
    for (const id of comers) {
      if (joined.includes(id)) continue;
      ringed.push({ id, pos: onRing(XIYOU_JOINS[id]), phase: 3 + ringed.length });
    }
    for (const p of xiyouPersonas) {
      if (XIYOU_PARTY.includes(p.id)) continue; // 四众随队/候着，上面已摆（界外只摆行者，见上）
      if (!p.home || !xiyouRegionMap[p.home]) continue;
      ringed.push({ id: p.id, pos: onRing(p.home), phase: 7 + ringed.length });
    }
    return [...party, ...ringed];
  }, [here, passed]);

  // 人物画法各处一律，抽出来使 render 里的地形读得清爽
  const renderFigure = (f: Spot) => {
    const p = xiyouPersonaMap[f.id];
    if (!p) return null;
    return (
      <Figure
        key={f.id}
        scholar={p}
        target={f.pos}
        action={p.idle}
        mood="think"
        active={selectedId === f.id}
        nearby={false}
        onSelect={() => onSelectPersona(f.id)}
        phase={f.phase}
        facingAngle={0}
        // 人物给足一档：1.8 只比 1.5 大两成，远机位上折成几个像素，
        // 看的人感觉不出（用户原话「没放大」）。山水图里人物本就该比
        // 尺度的真身醒目，直接翻倍（1.5→3.0），过了再收。
        scale={3}
      />
    );
  };

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.8]}
      camera={{ position: [4, 118, 158], fov: 42 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.04 }}
    >
      {/* 西游的底色不取战国的陈绢米黄，取金赭——神魔志怪，日色要浓一档 */}
      <color attach="background" args={["#d9c49a"]} />
      {/* 高斜随行镜头悬在 ~200m，原雾距 180–460 会把画面远端泡进雾里，演示时推远一档 */}
      <fog attach="fog" args={demo ? ["#d9c49a", 320, 720] : ["#d9c49a", 180, 460]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#f3e8ce", "#8a6a44", 0.68]} />
        <directionalLight
          position={[82, 122, 56]}
          intensity={1.4}
          color="#fbf0d6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-160}
          shadow-camera-right={160}
          shadow-camera-top={160}
          shadow-camera-bottom={-160}
          shadow-camera-far={460}
          shadow-bias={-0.0006}
        />

        {/* 大地：一张素面，路与十三处浮其上 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[240, 240]} />
          <meshStandardMaterial color="#c6b78e" roughness={1} />
        </mesh>

        {/* 环境：远山定地平线、云定天、沿路的树定尺度 */}
        <FarMountains />
        <Clouds />
        <Route passed={passed} curve={curve} />
        <ArrivalPulse stopId={stopId} />
        <OffArrivalFx stopId={stopId} />
        <Trees items={roadsideTrees} />

        {xiyouAllRegions.map((r) => (
          <Stop
            key={r.id}
            id={r.id}
            state={
              r.offRoute
                ? r.id === stopId ? "here" : "off"
                : // 身在界外时，路上当下那一处也算走过的——不然去天上看一眼，
                  // 刚到的那一处会跟着褪成未至，像是又退回去了
                  r.order < passed ? "passed" : r.order === passed ? (here.offRoute ? "passed" : "here") : "ahead"
            }
            selected={r.id === stopId}
            onSelect={() => onSelectStop(r.id)}
          />
        ))}

        {figures.map(renderFigure)}
      </Suspense>

      <OrbitControls
        makeDefault
        target={[2, 4, 4]}
        minDistance={50}
        maxDistance={330}
        maxPolarAngle={Math.PI / 2.2}
        enablePan
        enableDamping
        dampingFactor={0.08}
      />
      {/* 演示模式：镜头高斜随行、雾推远（见 DemoCamera 顶注）。四众的走由
          Figure 自身的插值完成——target 换到下一处，自然从原地起步西行。 */}
      <DemoCamera demo={demo} stopId={stopId} />
    </Canvas>
  );
}
