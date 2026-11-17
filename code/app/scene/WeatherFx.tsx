"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Season, Weather } from "../world/schedule";

/**
 * 天气粒子层（Canvas 内）：雨为雨丝、雪为雪花、秋日晴阴为落叶。
 * 体积覆盖 ±60 x/z、0–55 y，含整个可视场。位置出界即回顶循环。
 * 雨/雪优先于落叶；晴阴且非秋不显。各子组件按需挂卸，无天气时零开销。
 *
 * 实现注：
 *  - 几何由 useMemo 持有（供 JSX 直接挂载，不在 render 期读 ref）。
 *  - 初始/回收坐标用确定性伪随机 srand（Math.sin 杂凑，纯函数），
 *    不用 Math.random 以避 react-hooks/purity（render 期不得调不纯函数）；
 *    回收以 Math.floor(elapsed) 作盐，使各帧回收位置仍错落而不雷同。
 *  - useFrame 内每帧改写 BufferAttribute 的位置数组并置 needsUpdate，
 *    此为 three.js 粒子动画的标准做法，但会被 react-hooks/immutability
 *    （视 useMemo 派生值为不可变）所阻，故就地 scoped 禁用该规则。
 */

const BOUND_X = 60;
const BOUND_Z = 60;
const TOP_Y = 55;

/** 确定性伪随机，返回 [-1, 1)。纯函数（仅 Math.sin/Math.floor），可安全用于 render 期。 */
function srand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}
/** [0, 1) 的确定性伪随机。 */
function srand01(i: number, salt: number): number {
  return (srand(i, salt) + 1) * 0.5;
}

/** 雨丝：300 段竖直短线，快速下落。 */
function Rain() {
  const N = 300;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(N * 2 * 3);
    for (let i = 0; i < N; i++) {
      const x = srand(i, 1) * BOUND_X;
      const z = srand(i, 2) * BOUND_Z;
      const y = srand01(i, 3) * TOP_Y;
      a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = z;
      a[i * 6 + 3] = x; a[i * 6 + 4] = y - 0.8; a[i * 6 + 5] = z;
    }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useFrame((state, dt) => {
    /* eslint-disable react-hooks/immutability -- three.js 粒子须每帧改写 BufferAttribute 位置数组 */
    const arr = geo.attributes.position.array as Float32Array;
    const bucket = Math.floor(state.clock.elapsedTime);
    const speed = 26 * Math.min(dt, 0.05);
    for (let i = 0; i < N; i++) {
      arr[i * 6 + 1] -= speed;
      arr[i * 6 + 4] -= speed;
      if (arr[i * 6 + 1] < 0) {
        const x = srand(i + bucket, 1) * BOUND_X;
        const z = srand(i + bucket, 2) * BOUND_Z;
        arr[i * 6] = x; arr[i * 6 + 1] = TOP_Y; arr[i * 6 + 2] = z;
        arr[i * 6 + 3] = x; arr[i * 6 + 4] = TOP_Y - 0.8; arr[i * 6 + 5] = z;
      }
    }
    geo.attributes.position.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
  });
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color="#9fb0bd" transparent opacity={0.55} />
    </lineSegments>
  );
}

/** 雪花：250 白点，慢落 ＋ 横向飘摆。 */
function Snow() {
  const N = 250;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      a[i * 3] = srand(i, 1) * BOUND_X;
      a[i * 3 + 1] = srand01(i, 2) * TOP_Y;
      a[i * 3 + 2] = srand(i, 3) * BOUND_Z;
    }
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useFrame((state, dt) => {
    /* eslint-disable react-hooks/immutability -- 同 Rain：粒子须每帧改写位置数组 */
    const arr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const bucket = Math.floor(t);
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] -= 4 * d;
      arr[i * 3] += Math.sin(t * 0.8 + i) * 0.02;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3] = srand(i + bucket, 1) * BOUND_X;
        arr[i * 3 + 1] = TOP_Y;
        arr[i * 3 + 2] = srand(i + bucket, 3) * BOUND_Z;
      }
    }
    geo.attributes.position.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
  });
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#f4f6f8" size={0.22} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

const LEAF_COLORS = ["#c8551f", "#d98b2b", "#b23a1a", "#e0a32a", "#8a3a14"];

/** 秋日落叶：80 彩色点（橙/赭/红/黄），飘坠 ＋ 双向摆动。 */
function Leaves() {
  const N = 80;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      pos[i * 3] = srand(i, 1) * BOUND_X;
      pos[i * 3 + 1] = srand01(i, 2) * TOP_Y;
      pos[i * 3 + 2] = srand(i, 3) * BOUND_Z;
      c.set(LEAF_COLORS[i % LEAF_COLORS.length]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useFrame((state, dt) => {
    /* eslint-disable react-hooks/immutability -- 同 Rain：粒子须每帧改写位置数组 */
    const arr = geo.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    const bucket = Math.floor(t);
    for (let i = 0; i < N; i++) {
      arr[i * 3 + 1] -= 3 * d;
      arr[i * 3] += Math.sin(t * 0.6 + i * 1.3) * 0.05;
      arr[i * 3 + 2] += Math.cos(t * 0.5 + i) * 0.03;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3] = srand(i + bucket, 1) * BOUND_X;
        arr[i * 3 + 1] = TOP_Y;
        arr[i * 3 + 2] = srand(i + bucket, 3) * BOUND_Z;
      }
    }
    geo.attributes.position.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
  });
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.34} sizeAttenuation vertexColors transparent opacity={0.92} depthWrite={false} />
    </points>
  );
}

export default function WeatherFx({ weather, season }: { weather: Weather; season: Season }) {
  if (weather === "雨") return <Rain />;
  if (weather === "雪") return <Snow />;
  if (season === "秋" && (weather === "晴" || weather === "阴")) return <Leaves />;
  return null;
}
