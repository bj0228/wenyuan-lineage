"use client";

/**
 * Blender 建的那张环境 —— 替下 `Terrain.tsx` 与 `Streetscape.tsx` 的过程式几何。
 *
 * 两边本是同一张图的两遍画法:过程式那版是现写的三角函数地面、一条平铺水带、
 * 一座圆环拱桥、百来株锥体树;Blender 那版按同一套坐标与同一条高度公式重建,
 * 河刻了谷、桥起了券、驰道贴着地势织成缎带,又添田垄、路亭、里程碑、货摊、
 * 牌坊、灯柱与远塔,树石也从一百五十件密到五百余件,连远山都披了林。
 *
 * 一个 .glb 里是两个节点:
 *   - `terrain` 带顶点色(草青↔夯土、河滩湿土、山脊裸岩都烘在顶点上),受影不投影
 *   - `props`  三十一个 primitive(按材质分),既投影也受影
 * 地形不投影是有意的:它本就是承影的那张面,自投自受会在坡面上织出一片摩尔纹。
 *
 * 兜底与十六座建筑同一套路(见 BuildingModel.tsx):没下载完或下载失败,
 * 都退回过程式的那版,场里不会空成一张白纸。
 */

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Terrain from "./Terrain";
import Streetscape from "./Streetscape";
import { asset } from "../world/assetPath";

/** 解码器自托管在 public/draco/,不走 CDN */
const DRACO = asset("/draco/");

function Gltf() {
  const { scene } = useGLTF(asset("/models/world_env.glb"), DRACO);
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      // 地形是承影的那张面:只受影不投影,免得坡面自投自受织出摩尔纹
      const isTerrain = m.name === "terrain" || m.parent?.name === "terrain";
      m.castShadow = !isTerrain;
      m.receiveShadow = true;
    });
    return o;
  }, [scene]);
  return <primitive object={obj} />;
}

class Fallback extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function WorldEnv() {
  const procedural = (
    <>
      <Terrain />
      <Streetscape />
    </>
  );
  return (
    <Fallback fallback={procedural}>
      <Suspense fallback={procedural}>
        <Gltf />
      </Suspense>
    </Fallback>
  );
}
