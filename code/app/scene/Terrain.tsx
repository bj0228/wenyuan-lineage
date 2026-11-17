"use client";

/**
 * 过程式环境 —— `WorldEnv.tsx` 的兜底那层:Blender 那张 `world_env.glb`
 * 没下载完或载入失败时顶上,场里不至于空成一张白纸。
 *
 * 高度一概查 `app/world/terrain.ts`,与 Blender 那边同一条公式 ——
 * 早先这里、`Streetscape.tsx` 与 placement 各存一份,河是平铺的、远山无封顶,
 * 换成 Blender 那版之后人物便浮在半空。
 */

import { useMemo } from "react";
import * as THREE from "three";
import { regions, worldXZ } from "../world/regions";
import { baseRadius } from "./modelMeta";
import { terrainHeight, riverSurfaceY } from "../world/terrain";

/** 起伏地形：按公用高度函数抬起顶点，区域周边压平以便安置建筑。 */
function Ground() {
  const geometry = useMemo(() => {
    // 与 Blender 那张同为 200 见方,免得切换时远山忽有忽无
    const g = new THREE.PlaneGeometry(200, 200, 100, 100);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#9c9464" roughness={1} flatShading />
    </mesh>
  );
}

/** 河流：沿曲线铺一条半透明水带，水面贴着被挖低的河床逐点走 */
function River() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-52, 0, -18),
      new THREE.Vector3(-24, 0, -6),
      new THREE.Vector3(-2, 0, 2),
      new THREE.Vector3(18, 0, 8),
      new THREE.Vector3(40, 0, 22),
      new THREE.Vector3(54, 0, 34),
    ]);
    const pts = curve.getPoints(120);
    const shape: THREE.Vector3[] = [];
    const width = 4.2;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const n = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
      const side = new THREE.Vector3(-n.z, 0, n.x).multiplyScalar(width);
      p.y = riverSurfaceY(p.x, p.z);
      shape.push(p.clone().add(side), p.clone().sub(side));
    }
    const g = new THREE.BufferGeometry();
    const verts: number[] = [];
    for (let i = 0; i < shape.length - 2; i += 2) {
      const [a, b, c, d] = [shape[i], shape[i + 1], shape[i + 2], shape[i + 3]];
      verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      verts.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#7d8b84" roughness={0.5} metalness={0.05} transparent opacity={0.82} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** 石桥：跨河一道拱桥 */
function Bridge() {
  const y = riverSurfaceY(16.5, 7);
  return (
    <group position={[16.5, y, 7]} rotation={[0, 0.42, 0]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <torusGeometry args={[3.4, 0.42, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#8d7351" roughness={1} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.3, 2.6]} />
        <meshStandardMaterial color="#9c8259" roughness={1} />
      </mesh>
      {[-1.35, 1.35].map((z) => (
        <mesh key={z} position={[0, 2.28, z]} castShadow>
          <boxGeometry args={[7.4, 0.6, 0.18]} />
          <meshStandardMaterial color="#a88e64" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** 树木与山石：按固定种子散布，避开建筑基址与河道，贴地形起伏 */
function Scatter() {
  const items = useMemo(() => {
    // 排除圈按各座占地来(与 Blender 那边同一张表),不再一律 15
    const flat = regions.map((r) => {
      const [fx, fz] = worldXZ(r.x, r.y);
      return { fx, fz, rr: baseRadius(r.id) };
    });
    // 固定种子的线性同余，保证每次渲染散布一致
    const state = { seed: 20240807 };
    const rand = () => {
      state.seed = (state.seed * 1103515245 + 12345) & 0x7fffffff;
      return state.seed / 0x7fffffff;
    };
    const out: { x: number; z: number; y: number; s: number; kind: "pine" | "broad" | "rock" }[] = [];
    for (let i = 0; i < 420; i++) {
      const x = (rand() - 0.5) * 170;
      const z = (rand() - 0.5) * 170;
      if (flat.some((f) => Math.hypot(x - f.fx, z - f.fz) < f.rr)) continue;
      // 粗略避开河道走向
      if (Math.abs(z - (x * 0.42 + 2)) < 8) continue;
      out.push({
        x, z,
        y: terrainHeight(x, z),
        s: 0.7 + rand() * 0.7,
        kind: rand() < 0.45 ? "pine" : rand() < 0.8 ? "broad" : "rock",
      });
    }
    return out;
  }, []);

  return (
    <>
      {items.map((it, i) => (
        <group key={i} position={[it.x, it.y, it.z]} scale={it.s}>
          {it.kind === "pine" && (
            <>
              <mesh position={[0, 1.1, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.26, 2.2, 6]} />
                <meshStandardMaterial color="#6b5439" roughness={1} />
              </mesh>
              {[0, 1, 2].map((k) => (
                <mesh key={k} position={[0, 2.3 + k * 0.9, 0]} castShadow>
                  <coneGeometry args={[1.5 - k * 0.35, 1.5, 7]} />
                  <meshStandardMaterial color={k === 2 ? "#4a5742" : "#3a4535"} roughness={0.95} flatShading />
                </mesh>
              ))}
            </>
          )}
          {it.kind === "broad" && (
            <>
              <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.3, 2.4, 6]} />
                <meshStandardMaterial color="#70573a" roughness={1} />
              </mesh>
              <mesh position={[0, 3.1, 0]} castShadow>
                <icosahedronGeometry args={[1.6, 0]} />
                <meshStandardMaterial color="#55603f" roughness={0.95} flatShading />
              </mesh>
            </>
          )}
          {it.kind === "rock" && (
            <mesh position={[0, 0.5, 0]} rotation={[0.3, i, 0.2]} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.95, 0]} />
              <meshStandardMaterial color="#8e897a" roughness={1} flatShading />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

/** 田垄：谷地一侧的耕地条纹，添些人烟 */
function Fields() {
  const y = terrainHeight(-26, 26) + 0.12;
  return (
    <group position={[-26, y, 26]} rotation={[-Math.PI / 2, 0, 0.3]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[i * 1.7 - 5, 0, 0]}>
          <planeGeometry args={[1.3, 15]} />
          <meshStandardMaterial color={i % 2 ? "#a99b5e" : "#bcae6c"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export default function Terrain() {
  return (
    <>
      <Ground />
      <River />
      <Bridge />
      <Fields />
      <Scatter />
    </>
  );
}
