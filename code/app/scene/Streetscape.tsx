"use client";

/**
 * 过程式街景 —— 与 `Terrain.tsx` 同为 `WorldEnv.tsx` 的兜底那层。
 * 高度查公用的 `app/world/terrain.ts`,此处不再自存一份公式。
 */

import { useMemo } from "react";
import * as THREE from "three";
import { terrainHeight } from "../world/terrain";
import {
  WoodColumn,
  StoneBox,
  WoodBox,
  TiledPyramidRoof,
  TiledConeRoof,
  Lantern,
  Plaque,
} from "./Buildings";

/** 石铺驰道：沿给定航点贴地形织一条缎带（左/右顶点随地形抬升）。 */
function Causeway() {
  const geo = useMemo(() => {
    const W: [number, number][] = [
      [0, -29.4], // 纵横棋局
      [11, -3.7], // 公共广场
      [15, 4], // 桥北
    ];
    const samples: [number, number][] = [];
    for (let i = 0; i < W.length - 1; i++) {
      const [ax, az] = W[i];
      const [bx, bz] = W[i + 1];
      const segLen = Math.hypot(bx - ax, bz - az);
      const steps = Math.max(3, Math.round(segLen / 1.1));
      for (let s = 0; s < steps; s++) samples.push([ax + (bx - ax) * (s / steps), az + (bz - az) * (s / steps)]);
    }
    samples.push(W[W.length - 1]);

    const halfW = 1.35;
    const verts: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i < samples.length; i++) {
      const [x, z] = samples[i];
      let tx: number, tz: number;
      if (i < samples.length - 1) { tx = samples[i + 1][0] - x; tz = samples[i + 1][1] - z; }
      else { tx = x - samples[i - 1][0]; tz = z - samples[i - 1][1]; }
      const tl = Math.hypot(tx, tz) || 1;
      tx /= tl; tz /= tl;
      const nx = tz, nz = -tx; // 路面法向（左右）
      const y = terrainHeight(x, z) + 0.06;
      verts.push(x + nx * halfW, y, z + nz * halfW);
      verts.push(x - nx * halfW, y, z - nz * halfW);
      if (i < samples.length - 1) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial color="#bfb286" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* 路心一道深石压线，示车辙 */}
      <mesh geometry={geo} scale={[0.96, 1, 1]} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#a89a72" roughness={1} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

/** 路亭：四柱＋方攒尖瓦顶＋石阶＋长凳，供行人歇脚。 */
function WaysidePavilion({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, rot, 0]}>
      <StoneBox w={3.8} h={0.16} d={3.8} y={0.08} color="#9a8e70" />
      <WoodColumn x={-1.4} z={-1.4} h={2.8} r={0.15} color="#6a4a2a" />
      <WoodColumn x={1.4} z={-1.4} h={2.8} r={0.15} color="#6a4a2a" />
      <WoodColumn x={-1.4} z={1.4} h={2.8} r={0.15} color="#6a4a2a" />
      <WoodColumn x={1.4} z={1.4} h={2.8} r={0.15} color="#6a4a2a" />
      <TiledPyramidRoof w={3.6} d={3.6} h={1.3} y={2.8} color="#5d6158" />
      <WoodBox w={2.2} h={0.14} d={0.5} y={0.55} z={1.0} color="#7a5a3a" />
      <WoodBox w={0.12} h={0.5} d={0.5} x={-0.85} y={0.28} z={1.0} color="#6a4a2a" />
      <WoodBox w={0.12} h={0.5} d={0.5} x={0.85} y={0.28} z={1.0} color="#6a4a2a" />
    </group>
  );
}

/** 里程碑：石桩＋铭文板，示道里。 */
function Milestone({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, rot, 0]}>
      <StoneBox w={0.32} h={1.1} d={0.32} y={0.55} color="#9a8e70" />
      <mesh position={[0, 0.92, 0.17]}>
        <boxGeometry args={[0.22, 0.42, 0.02]} />
        <meshStandardMaterial color="#3a3326" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** 货摊小车：车身＋双轮＋布棚＋杂货，游贩随街。 */
function MarketCart({ x, z, rot = 0, cloth }: { x: number; z: number; rot?: number; cloth: string }) {
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, rot, 0]}>
      <WoodBox w={1.6} h={0.7} d={1.0} y={0.6} color="#7a5a3a" />
      <WoodBox w={1.7} h={0.1} d={1.1} y={1.0} color="#8a6a3a" />
      <mesh position={[-0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.12, 14]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.12, 14]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.7, 1.0, 0]}><cylinderGeometry args={[0.04, 0.04, 1.4, 6]} /><meshStandardMaterial color="#5a3a24" /></mesh>
      <mesh position={[0.7, 1.0, 0]}><cylinderGeometry args={[0.04, 0.04, 1.4, 6]} /><meshStandardMaterial color="#5a3a24" /></mesh>
      <mesh position={[0, 1.66, 0]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[1.9, 0.06, 1.25]} />
        <meshStandardMaterial color={cloth} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.45, 1.16, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#b58a3c" /></mesh>
      <mesh position={[0, 1.16, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#8a5a3a" /></mesh>
      <mesh position={[0.45, 1.16, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#5a6a3a" /></mesh>
    </group>
  );
}

/** 街口牌坊：双柱＋横梁＋小瓦顶＋金匾，标街口。 */
function Paifang({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, terrainHeight(x, z), z]} rotation={[0, rot, 0]}>
      <WoodColumn x={0} z={-2.4} h={5.0} r={0.3} color="#6a4a2a" />
      <WoodColumn x={0} z={2.4} h={5.0} r={0.3} color="#6a4a2a" />
      <WoodBox w={0.5} h={0.45} d={5.2} y={4.8} color="#6a4a2a" />
      <WoodBox w={0.4} h={0.28} d={5.6} y={4.3} color="#7a5a3a" />
      <TiledConeRoof r={1.8} h={0.85} sides={4} y={5.1} color="#5d6158" rot={Math.PI / 4} />
      <Plaque x={0} y={4.55} z={0} w={1.6} accent="#d4a23a" />
    </group>
  );
}

/** 灯柱：石础＋木杆＋宫灯，沿街照明。 */
function LanternPost({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, terrainHeight(x, z), z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 0.24, 10]} />
        <meshStandardMaterial color="#7a6a4a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 3.0, 8]} />
        <meshStandardMaterial color="#3a3326" roughness={0.8} metalness={0.2} />
      </mesh>
      <Lantern x={0} y={3.1} z={0} color="#e6a23c" />
    </group>
  );
}

/** 远塔：层塔剪影，置于远山，衬城邑天际。 */
function DistantPagoda({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, terrainHeight(x, z), z]} scale={s}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.8, 1.0, 4, 8]} />
        <meshStandardMaterial color="#8a7a5a" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow>
        <coneGeometry args={[1.6, 1.0, 8]} />
        <meshStandardMaterial color="#5d6158" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 5.9, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 1.6, 8]} />
        <meshStandardMaterial color="#84765a" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 7.0, 0]} castShadow>
        <coneGeometry args={[1.1, 0.8, 8]} />
        <meshStandardMaterial color="#56585a" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

/** 主世界街景总成：驰道＋路亭＋里程碑＋货摊＋牌坊＋灯柱＋远塔。 */
export default function Streetscape() {
  return (
    <group>
      <Causeway />
      {/* 路亭三处：广场东、桥南、秦驰道旁 */}
      <WaysidePavilion x={19} z={-7} rot={-0.3} />
      <WaysidePavilion x={20} z={10} rot={0.5} />
      <WaysidePavilion x={-18} z={-41} rot={1.2} />
      {/* 里程碑：沿广场北段驰道 */}
      <Milestone x={2} z={-20} rot={0.1} />
      <Milestone x={5} z={-17} rot={0.1} />
      <Milestone x={8} z={-13} rot={0.1} />
      {/* 货摊小车：游贩随街 */}
      <MarketCart x={17} z={-12} rot={-0.2} cloth="#c85a3a" />
      <MarketCart x={19} z={-14} rot={0.3} cloth="#5a7a8a" />
      <MarketCart x={6} z={-24} rot={1.4} cloth="#7a5a2a" />
      {/* 街口牌坊：广场北驰道入口 */}
      <Paifang x={7} z={-30} rot={0.3} />
      {/* 灯柱：沿驰道六盏 */}
      <LanternPost x={3} z={-25} />
      <LanternPost x={5} z={-22} />
      <LanternPost x={8} z={-18} />
      <LanternPost x={10} z={-13} />
      <LanternPost x={14} z={-8} />
      <LanternPost x={18.5} z={0} />
      {/* 远塔：南北远山，衬天际 */}
      <DistantPagoda x={0} z={-50} s={1.1} />
      <DistantPagoda x={28} z={-46} />
      <DistantPagoda x={-20} z={46} s={1.05} />
    </group>
  );
}
