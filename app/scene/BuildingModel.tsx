"use client";

/**
 * Blender 建筑:把 `zhuzi-world-blender` 里按战国形制建成的十六座,
 * 以 glTF 载入替换 Buildings.tsx 的过程式几何。
 *
 * 模型在导出时已经归一过(平面居中、底面贴 y=0、按身份折算占地),
 * 故此处不需要任何位移缩放的魔法数,原样挂在区域组里即可。
 *
 * 两层兜底,保证场景永远有东西可看:
 *   - 还没下载完 → Suspense 退回过程式建筑(用户先看到形,再换成精细的那版)
 *   - 下载失败/文件缺失 → 错误边界同样退回过程式建筑,不白屏
 */

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { asset } from "../world/assetPath";

/** 已导出 .glb 的区域;没在表里的仍走过程式 */
export const MODELED = new Set([
  "academy", "workshop", "hall", "jixia", "water", "zongheng", "mingjia", "daoshan",
  "plaza", "guanxing", "shapan", "tianshe", "chidao", "shijing", "dukou", "zhaoxian",
]);

/** 解码器自托管在 public/draco/,不走 CDN —— 离线与内网都能跑 */
const DRACO = asset("/draco/");

function Gltf({ id }: { id: string }) {
  const { scene } = useGLTF(asset(`/models/${id}.glb`), DRACO);
  // useGLTF 对同一 url 返回同一个对象,直接挂会在重挂载时互相抢;
  // clone 只复制节点,几何与材质仍是共享的,开销很小。
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

class Fallback extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function BuildingModel({ id, fallback }: { id: string; fallback: ReactNode }) {
  if (!MODELED.has(id)) return <>{fallback}</>;
  return (
    <Fallback fallback={fallback}>
      <Suspense fallback={fallback}>
        <Gltf id={id} />
      </Suspense>
    </Fallback>
  );
}
