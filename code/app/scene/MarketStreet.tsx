"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ItemId } from "../world/inventory";
import {
  StoneBase,
  StoneBox,
  StoneCyl,
  WoodBox,
  WoodColumn,
  TexturedWall,
  TiledConeRoof,
  CurvedGableRoof,
  Colonnade,
  Balustrade,
  LatticeWindow,
  Plaque,
  Lantern,
} from "./Buildings";

/** 招牌贴图：木底＋金/深漆双框＋墨字店名，按「店名:边色」缓存。 */
const signCache = new Map<string, THREE.CanvasTexture>();
/**
 * 招牌上的墨字：两种语文都照中文画。
 *
 * 这一枚是街上挂着的木板幌子，墨字是画上去的景物，不是界面上的字——
 * 与四库书脊上的竖写题签同例（见 SikuScrollLayer）。英文名在侧栏的店头
 * （MarketView 的 ShopPanel）与读屏文里，点哪一间铺卖什么，那里说得明白。
 */
function signTexture(name: string, accent: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const key = `${name}:${accent}`;
  const cached = signCache.get(key);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 140;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, 0, 140);
  g.addColorStop(0, "#ead8b0"); g.addColorStop(1, "#d6bd8c");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 140);
  ctx.strokeStyle = accent; ctx.lineWidth = 9; ctx.strokeRect(5, 5, 246, 130);
  ctx.strokeStyle = "#4a2e16"; ctx.lineWidth = 2.5; ctx.strokeRect(13, 13, 230, 114);
  ctx.fillStyle = "#241208";
  ctx.font = "bold 60px \"Songti SC\",\"STSong\",\"SimSun\",serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(name, 128, 73);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  signCache.set(key, tex);
  return tex;
}

/** 檐下悬挂招牌：横梁贴檐、两吊绳、双面墨字板；点板即选购。
 *  按古制悬于铺面前檐下，可自街面仰望见之。 */
function HangingSign({
  name, accent, beamY, boardY, onPick, active,
}: {
  name: string; accent: string; beamY: number; boardY: number; onPick: () => void; active: boolean;
}) {
  const tex = useMemo(() => signTexture(name, accent), [name, accent]);
  const cordTop = beamY;
  const cordBot = boardY + 0.46;
  const cordLen = cordTop - cordBot;
  const cordCY = (cordTop + cordBot) / 2;
  return (
    <group>
      {/* 横梁：贴于前檐下 */}
      <WoodBox w={2.2} h={0.12} d={0.14} y={beamY} z={2.34} color="#5a3a24" />
      {/* 两吊绳 */}
      <mesh position={[-0.7, cordCY, 2.36]}>
        <cylinderGeometry args={[0.012, 0.012, cordLen, 6]} />
        <meshStandardMaterial color="#2a1a0e" roughness={1} />
      </mesh>
      <mesh position={[0.7, cordCY, 2.36]}>
        <cylinderGeometry args={[0.012, 0.012, cordLen, 6]} />
        <meshStandardMaterial color="#2a1a0e" roughness={1} />
      </mesh>
      {/* 招牌板身 */}
      <mesh position={[0, boardY, 2.32]} castShadow>
        <boxGeometry args={[1.72, 0.92, 0.08]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.9} />
      </mesh>
      {/* 正面墨字板：可点选购 */}
      <mesh
        position={[0, boardY, 2.365]}
        onClick={(e) => { e.stopPropagation(); onPick(); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = ""; }}
      >
        <planeGeometry args={[1.6, 0.82]} />
        <meshStandardMaterial map={tex} emissive={active ? "#3a2a10" : "#000000"} emissiveIntensity={active ? 0.25 : 0} roughness={0.8} />
      </mesh>
      {/* 背面 */}
      <mesh position={[0, boardY, 2.275]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.6, 0.82]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 一间街市铺面：石基 + 墙身 + 瓦/茅顶 + 前廊木柱 + 招牌 + 宫灯。
 *  局部以「正面向 +Z」建模，再以 group 旋转摆向（北侧 rot=0 朝南、南侧 rot=π 朝北），皆面街。
 *  每店另配 ShopDecor：依其业（肉/鱼/酒/茶/书/杂货）置店前实物，形制各异。 */
function Shop({
  def,
  rot,
  onPick,
  active,
}: {
  def: ShopDef;
  rot: number;
  onPick: (id: string) => void;
  active: boolean;
}) {
  const roofColor = def.roof;
  const tall = !!def.tall;
  return (
    <group rotation={[0, rot, 0]}>
      <StoneBase w={5.6} d={5.2} h={0.4} color="#9a8f74" />
      {/* 身：酒楼两层高，余皆一层 */}
      <TexturedWall w={5.0} h={tall ? 4.4 : 3.0} d={4.2} y={tall ? 2.4 : 1.7} color={def.facade} />
      {/* 顶：茅肆/鱼摊用茅顶，酒楼用歇山顶，余瓦攒尖 */}
      {def.thatch ? (
        <TiledConeRoof r={3.6} h={1.7} sides={def.sides ?? 4} y={tall ? 4.6 : 3.2} color={roofColor} thatch rot={Math.PI / 4} />
      ) : tall ? (
        <CurvedGableRoof span={5.4} length={5.6} height={1.4} y={4.65} rot={Math.PI / 2} color={roofColor} />
      ) : (
        <TiledConeRoof r={3.5} h={1.5} sides={def.sides ?? 4} y={3.2} color={roofColor} rot={Math.PI / 4} />
      )}
      {/* 酒楼：腰间一道深漆楼层面，示两层；前廊二楼栏台 */}
      {tall && (
        <>
          <WoodBox w={5.06} h={0.16} d={4.26} y={2.45} color="#5a3a24" />
          <Balustrade x={0} y={4.0} z={2.12} w={4.6} color="#9a7a4a" />
        </>
      )}
      {/* 书坊/杂货铺：墙身开一二棂窗，示居舍 */}
      {def.id === "shufang" && (
        <>
          <LatticeWindow x={-1.5} y={1.7} z={2.12} w={1.0} h={1.2} />
          <LatticeWindow x={1.5} y={1.7} z={2.12} w={1.0} h={1.2} />
        </>
      )}
      {def.id === "zahuo" && <LatticeWindow x={1.6} y={1.7} z={2.12} w={1.0} h={1.2} />}
      {/* 前廊四柱：朝街一侧(z+) 立两柱、后侧两柱，成一面廊 */}
      <Colonnade xs={[-1.9, 1.9]} z={1.7} h={tall ? 4.0 : 2.8} r={0.18} color="#7d6647" />
      <Colonnade xs={[-1.9, 1.9]} z={-1.7} h={tall ? 4.0 : 2.8} r={0.18} color="#7d6647" />
      {/* 招牌：悬于前檐下，朝街，点板即选购 */}
      <HangingSign
        name={def.name} accent={def.accent}
        beamY={tall ? 3.95 : 2.95} boardY={tall ? 2.85 : 1.85}
        onPick={() => onPick(def.id)} active={active}
      />
      {/* 宫灯一对，挂前廊两角 */}
      <Lantern x={-1.9} y={tall ? 3.6 : 2.6} z={1.7} color={def.lantern} />
      <Lantern x={1.9} y={tall ? 3.6 : 2.6} z={1.7} color={def.lantern} />
      {/* 选中：阶前翠环提示 */}
      {active && (
        <mesh position={[0, 0.06, 2.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 1.7, 28]} />
          <meshBasicMaterial color="#c8a04a" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* 店前实物：依业置器，形制各异 */}
      <ShopDecor id={def.id} />
      {/* 整铺可点：覆一不可见体量，点墙/顶/幌子皆开选购 */}
      <mesh
        position={[0, tall ? 2.6 : 1.9, 0.2]}
        onClick={(e) => { e.stopPropagation(); onPick(def.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = ""; }}
      >
        <boxGeometry args={[5.6, tall ? 5.0 : 3.8, 5.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** 店前实物：依业置器——肉铺挂肉、鱼摊陈鱼、酒楼堆坛、茶肆列壶、书坊积简、杂货铺货箱布袋。
 *  皆置于店前 local +z（朝街），group 旋 rot 后两侧皆面街。 */
function ShopDecor({ id }: { id: string }) {
  switch (id) {
    case "zahuo": // 杂货铺：木柜台 + 布袋 + 货箱 + 陶罐
      return (
        <group>
          <WoodBox w={3.4} h={1.0} d={0.7} y={0.5} z={2.25} color="#8a6a3a" />
          <mesh position={[-0.9, 1.18, 2.2]} castShadow>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshStandardMaterial color="#cdb88a" roughness={1} />
          </mesh>
          <mesh position={[0.9, 1.12, 2.35]} castShadow>
            <sphereGeometry args={[0.26, 12, 10]} />
            <meshStandardMaterial color="#b9a070" roughness={1} />
          </mesh>
          <WoodBox w={0.8} h={0.7} d={0.7} x={-1.5} y={0.35} z={2.5} color="#7a5a32" />
          <mesh position={[1.5, 0.55, 2.4]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.55, 12]} />
            <meshStandardMaterial color="#8a5a3a" roughness={0.9} />
          </mesh>
        </group>
      );
    case "jiulou": // 酒楼：前台堆酒坛 + 招旗
      return (
        <group>
          <mesh position={[-1.5, 0.55, 2.4]} castShadow>
            <cylinderGeometry args={[0.3, 0.34, 1.1, 14]} />
            <meshStandardMaterial color="#5a3a24" roughness={0.85} />
          </mesh>
          <mesh position={[-1.0, 0.55, 2.5]} castShadow>
            <cylinderGeometry args={[0.3, 0.34, 1.1, 14]} />
            <meshStandardMaterial color="#6a4a2c" roughness={0.85} />
          </mesh>
          <mesh position={[-1.25, 1.5, 2.45]} castShadow>
            <cylinderGeometry args={[0.3, 0.34, 1.1, 14]} />
            <meshStandardMaterial color="#5a3a24" roughness={0.85} />
          </mesh>
          <mesh position={[1.7, 1.6, 2.3]}>
            <cylinderGeometry args={[0.04, 0.04, 3.2, 6]} />
            <meshStandardMaterial color="#5a3a24" />
          </mesh>
          <mesh position={[1.95, 2.45, 2.3]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshStandardMaterial color="#c85a3a" side={THREE.DoubleSide} roughness={0.9} />
          </mesh>
        </group>
      );
    case "chasi": // 茶肆：矮茶案 + 茶壶 + 小炉
      return (
        <group>
          <WoodBox w={2.8} h={0.85} d={0.6} y={0.42} z={2.25} color="#8a6a3a" />
          <mesh position={[-0.6, 0.96, 2.2]} castShadow>
            <sphereGeometry args={[0.18, 12, 10]} />
            <meshStandardMaterial color="#7a3a2a" roughness={0.5} />
          </mesh>
          <mesh position={[0.4, 0.92, 2.3]} castShadow>
            <sphereGeometry args={[0.15, 12, 10]} />
            <meshStandardMaterial color="#5a6a4a" roughness={0.5} />
          </mesh>
          <mesh position={[1.0, 0.5, 2.3]} castShadow>
            <boxGeometry args={[0.4, 0.6, 0.4]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
          </mesh>
          <mesh position={[1.0, 1.0, 2.3]}>
            <cylinderGeometry args={[0.08, 0.1, 0.6, 8]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        </group>
      );
    case "roupu": // 肉铺：木架挂肉 + 砧墩
      return (
        <group>
          <WoodBox w={0.14} h={2.0} d={0.14} x={-1.4} y={1.0} z={2.35} color="#5a3a24" />
          <WoodBox w={0.14} h={2.0} d={0.14} x={1.4} y={1.0} z={2.35} color="#5a3a24" />
          <WoodBox w={3.0} h={0.14} d={0.14} y={2.0} z={2.35} color="#5a3a24" />
          <mesh position={[-0.9, 1.55, 2.35]} castShadow>
            <boxGeometry args={[0.16, 0.7, 0.14]} />
            <meshStandardMaterial color="#9a3a2a" roughness={0.85} />
          </mesh>
          <mesh position={[-0.3, 1.5, 2.35]} castShadow>
            <boxGeometry args={[0.16, 0.8, 0.14]} />
            <meshStandardMaterial color="#a8402e" roughness={0.85} />
          </mesh>
          <mesh position={[0.4, 1.6, 2.35]} castShadow>
            <boxGeometry args={[0.16, 0.6, 0.14]} />
            <meshStandardMaterial color="#9a3a2a" roughness={0.85} />
          </mesh>
          <mesh position={[1.0, 1.5, 2.35]} castShadow>
            <boxGeometry args={[0.16, 0.8, 0.14]} />
            <meshStandardMaterial color="#a8402e" roughness={0.85} />
          </mesh>
          <WoodBox w={1.2} h={0.9} d={1.0} y={0.45} z={2.1} color="#6a4a2a" />
        </group>
      );
    case "yutai": // 鱼摊：冰案 + 银鱼 + 木桶
      return (
        <group>
          <WoodBox w={3.2} h={0.7} d={0.9} y={0.35} z={2.3} color="#7a8a8e" />
          <mesh position={[-0.9, 0.78, 2.3]} rotation={[0, 0.3, 0]} castShadow scale={[1, 0.18, 0.4]}>
            <sphereGeometry args={[0.55, 12, 10]} />
            <meshStandardMaterial color="#c8cdd0" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[-0.2, 0.78, 2.4]} castShadow scale={[1, 0.18, 0.4]}>
            <sphereGeometry args={[0.5, 12, 10]} />
            <meshStandardMaterial color="#b8c0c4" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0.5, 0.78, 2.3]} rotation={[0, -0.2, 0]} castShadow scale={[1, 0.18, 0.4]}>
            <sphereGeometry args={[0.6, 12, 10]} />
            <meshStandardMaterial color="#c0c6ca" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[1.4, 0.55, 2.4]} castShadow>
            <cylinderGeometry args={[0.3, 0.34, 1.0, 12]} />
            <meshStandardMaterial color="#6a4a2a" roughness={0.9} />
          </mesh>
        </group>
      );
    case "shufang": // 书坊：书案 + 竹简卷 + 书册堆 + 立简架
      return (
        <group>
          <WoodBox w={2.6} h={0.8} d={0.6} y={0.4} z={2.25} color="#7a5a3a" />
          <mesh position={[-0.7, 0.95, 2.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1.2, 10]} />
            <meshStandardMaterial color="#c8a854" roughness={0.9} />
          </mesh>
          <mesh position={[-0.4, 1.12, 2.25]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1.0, 10]} />
            <meshStandardMaterial color="#b89844" roughness={0.9} />
          </mesh>
          <mesh position={[0.6, 0.92, 2.25]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.7]} />
            <meshStandardMaterial color="#5a3a24" roughness={0.85} />
          </mesh>
          <mesh position={[0.6, 1.27, 2.25]} castShadow>
            <boxGeometry args={[0.5, 0.3, 0.7]} />
            <meshStandardMaterial color="#7a3a2a" roughness={0.85} />
          </mesh>
          <WoodBox w={0.1} h={1.4} d={0.1} x={1.3} y={0.7} z={2.4} color="#5a3a24" />
          <WoodBox w={0.6} h={0.1} d={0.1} x={1.3} y={1.3} z={2.4} color="#5a3a24" />
        </group>
      );
    default:
      return null;
  }
}

export type ShopDef = {
  id: string;
  name: string;
  glyph: string;
  facade: string;
  roof: string;
  accent: string;
  lantern: string;
  thatch?: boolean;
  tall?: boolean;
  /** 攒尖顶边数：4=方攒尖、6=六面攒尖（更圆，区分肉铺/鱼摊） */
  sides?: number;
  items: ItemId[];
  /** 街市内坐标与朝向：南北两排对望，北排 rot=0、南排 rot=π */
  x: number;
  z: number;
  rot: number;
};

/** 街市六店：北三南三，各配道具子集（束脩在杂货铺与肉铺皆可购得）。
 *  屋顶/业物各异：杂货铺方瓦攒尖、酒楼两层歇山、茶肆茅顶、肉铺六面瓦攒尖、鱼摊六面茅顶、书坊方瓦攒尖带棂窗。 */
export const SHOPS: ShopDef[] = [
  { id: "zahuo", name: "杂货铺", glyph: "杂", facade: "#b3a07c", roof: "#5d6158", accent: "#b58a3c", lantern: "#e6a23c", sides: 4, items: ["shuxiu", "zhu", "cha"], x: -12, z: -7, rot: 0 },
  { id: "jiulou", name: "酒楼", glyph: "酒", facade: "#9c4f3f", roof: "#5d6158", accent: "#d4a23a", lantern: "#f0a23c", tall: true, items: ["jiu", "geng"], x: 0, z: -7, rot: 0 },
  { id: "chasi", name: "茶肆", glyph: "茶", facade: "#7a8a5a", roof: "#6a6a3e", accent: "#b5c8a0", lantern: "#e6a23c", thatch: true, sides: 4, items: ["cha", "geng"], x: 12, z: -7, rot: 0 },
  { id: "roupu", name: "肉铺", glyph: "肉", facade: "#a8786a", roof: "#5d6158", accent: "#c85a3a", lantern: "#e6a23c", sides: 6, items: ["shuxiu", "buyu"], x: -12, z: 7, rot: Math.PI },
  { id: "yutai", name: "鱼摊", glyph: "鱼", facade: "#7a8a8e", roof: "#6a6a3e", accent: "#7ec0c8", lantern: "#e6a23c", thatch: true, sides: 6, items: ["buyu"], x: 0, z: 7, rot: Math.PI },
  { id: "shufang", name: "书坊", glyph: "书", facade: "#9a8870", roof: "#5d6158", accent: "#b58a3c", lantern: "#e6a23c", sides: 4, items: ["zhu"], x: 12, z: 7, rot: Math.PI },
];

/* ── 街市背景景物：行道树／街口牌坊／水井／路边摊棚／灯柱／远墙天际线 ──
 *  皆为静态装饰，填实街景、衬长卷纵深感；不与铺面争主，远者由雾化入纸。 */

/** 行道树：木干＋两层锥冠 */
function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.0, 8]} />
        <meshStandardMaterial color="#6a4a2a" roughness={1} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[1.3, 2.4, 9]} />
        <meshStandardMaterial color="#5a6a3a" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[0.9, 1.6, 9]} />
        <meshStandardMaterial color="#66774a" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

/** 街口牌坊：两柱＋横梁＋小瓦顶＋金匾 */
function StreetGate({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <WoodColumn x={0} z={-3.7} h={5.4} r={0.3} color="#6a4a2a" />
      <WoodColumn x={0} z={3.7} h={5.4} r={0.3} color="#6a4a2a" />
      <WoodBox w={0.55} h={0.5} d={8.4} y={5.2} color="#6a4a2a" />
      <WoodBox w={0.4} h={0.32} d={8.8} y={4.7} color="#7a5a3a" />
      <TiledConeRoof r={2.4} h={0.9} sides={4} y={5.5} color="#5d6158" rot={Math.PI / 4} />
      <Plaque x={0} y={5.05} z={0} w={1.8} accent="#d4a23a" />
    </group>
  );
}

/** 市井水井：石井圈＋井架横梁＋吊桶 */
function Well({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <StoneCyl rt={0.55} rb={0.65} h={0.55} y={0.28} color="#9a8e70" />
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.18, 24]} />
        <meshStandardMaterial color="#26221c" roughness={1} />
      </mesh>
      <WoodBox w={0.18} h={1.9} d={0.18} x={-0.55} y={1.0} color="#6a4a2a" />
      <WoodBox w={0.18} h={1.9} d={0.18} x={0.55} y={1.0} color="#6a4a2a" />
      <WoodBox w={1.5} h={0.18} d={0.18} y={1.95} color="#6a4a2a" />
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.32, 8]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** 路边摊棚：四柱＋布棚＋货案杂货 */
function RoadStall({ x, z, cloth }: { x: number; z: number; cloth: string }) {
  return (
    <group position={[x, 0, z]}>
      <WoodColumn x={-1.1} z={-0.6} h={2.0} r={0.1} color="#6a4a2a" />
      <WoodColumn x={1.1} z={-0.6} h={2.0} r={0.1} color="#6a4a2a" />
      <WoodColumn x={-1.1} z={0.6} h={1.7} r={0.1} color="#6a4a2a" />
      <WoodColumn x={1.1} z={0.6} h={1.7} r={0.1} color="#6a4a2a" />
      <mesh position={[0, 2.05, 0]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[2.8, 0.08, 1.7]} />
        <meshStandardMaterial color={cloth} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <WoodBox w={2.2} h={0.9} d={1.0} y={0.45} color="#8a6a3a" />
      <mesh position={[-0.6, 1.0, 0]} castShadow><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#b58a3c" /></mesh>
      <mesh position={[0, 1.0, 0]} castShadow><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#8a5a3a" /></mesh>
      <mesh position={[0.6, 1.0, 0]} castShadow><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#5a6a3a" /></mesh>
    </group>
  );
}

/** 灯柱：石础＋木杆＋宫灯 */
function LampPost({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.24, 10]} />
        <meshStandardMaterial color="#7a6a4a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 3.2, 8]} />
        <meshStandardMaterial color="#3a3326" roughness={0.8} metalness={0.2} />
      </mesh>
      <Lantern x={0} y={3.3} z={0} color="#e6a23c" />
    </group>
  );
}

/** 远墙天际线：长矮墙＋几处屋脊剪影，衬城邑纵深（雾化入纸） */
function Backdrop({ z }: { z: number }) {
  const roofs: [number, number, number, string][] = [
    [-20, 2.4, 2.2, "#6a6056"], [-8, 2.9, 2.6, "#5d6158"],
    [6, 2.7, 2.4, "#62585a"], [18, 2.4, 2.2, "#6a6056"],
  ];
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 1.0, 0]} receiveShadow>
        <boxGeometry args={[64, 2.0, 0.6]} />
        <meshStandardMaterial color="#9a8a6a" roughness={1} />
      </mesh>
      {roofs.map(([rx, ry, r, c], i) => (
        <mesh key={i} position={[rx, ry, 0]} castShadow>
          <coneGeometry args={[r, 1.6, 4]} />
          <meshStandardMaterial color={c} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** 街市背景总成 */
function StreetDress() {
  return (
    <group>
      <StreetGate x={-21} />
      <StreetGate x={21} />
      {/* 行道树：店后两侧，错位避铺中 */}
      <Tree x={-16} z={-10} />
      <Tree x={-4} z={-10} s={1.1} />
      <Tree x={8} z={-10} s={0.9} />
      <Tree x={-8} z={10} s={1.05} />
      <Tree x={4} z={10} s={0.95} />
      <Tree x={16} z={10} />
      {/* 水井：北街沿、杂货与酒楼之间 */}
      <Well x={-6} z={-3.3} />
      {/* 路边摊棚：南街沿、酒楼与鱼摊之间，南远端 */}
      <RoadStall x={6} z={2.6} cloth="#c85a3a" />
      <RoadStall x={17} z={2.4} cloth="#5a7a8a" />
      {/* 灯柱：沿街沿四盏 */}
      <LampPost x={-15} z={-3.6} />
      <LampPost x={-3} z={-3.6} />
      <LampPost x={3} z={3.6} />
      <LampPost x={15} z={3.6} />
      {/* 远墙天际线：南北各一道，衬城邑 */}
      <Backdrop z={-11.5} />
      <Backdrop z={11.5} />
    </group>
  );
}

export default function MarketStreet({
  activeShop,
  onPickShop,
}: {
  activeShop: string | null;
  onPickShop: (id: string) => void;
}) {
  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.8]}
      camera={{ position: [0, 8, 18], fov: 42 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <color attach="background" args={["#d8c9a6"]} />
      <fog attach="fog" args={["#d8c9a6", 28, 80]} />
      <Suspense fallback={null}>
        {/* 静态昼光：顶光偏纸白、底回弹赭 */}
        <hemisphereLight args={["#efe6cf", "#8a7a5c", 0.7]} />
        <directionalLight
          position={[10, 18, 8]}
          intensity={1.35}
          color="#fbf3de"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-far={80}
          shadow-bias={-0.0006}
        />
        {/* 绢底地面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[120, 60]} />
          <meshStandardMaterial color="#c9b896" roughness={1} />
        </mesh>
        {/* 石铺驰道：沿 X 长街 */}
        <StoneBox w={40} h={0.12} d={8} y={0.04} color="#b0a486" />
        {/* 街两侧矮阶压边 */}
        <StoneBox w={40} h={0.18} d={0.6} y={0.06} z={-4.0} color="#9a8e70" />
        <StoneBox w={40} h={0.18} d={0.6} y={0.06} z={4.0} color="#9a8e70" />
        {/* 背景景物：牌坊／行道树／水井／摊棚／灯柱／远墙 */}
        <StreetDress />
        {SHOPS.map((s) => (
          <group key={s.id} position={[s.x, 0, s.z]}>
            <Shop def={s} rot={s.rot} onPick={onPickShop} active={activeShop === s.id} />
          </group>
        ))}
      </Suspense>
      <OrbitControls
        makeDefault
        target={[0, 1.5, 0]}
        minDistance={9}
        maxDistance={32}
        maxPolarAngle={Math.PI / 2.1}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
