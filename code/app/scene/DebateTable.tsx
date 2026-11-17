"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { scholarMap, type Scholar } from "../world/characters";
import { DEBATE_ROUNDS } from "../world/dialogue";
import { useT } from "../i18n/lang";

/** 同 Figure.tsx 的 shade：袍缘/发髻用稍暗同色 */
function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0.02, -amount);
  return `#${c.getHexString()}`;
}

type SeatPos = { id: string; x: number; z: number };
type Phase = "setup" | "speaking" | "between" | "done";

/**
 * 圆桌围坐的小人：复刻 Figure 的 Q 版袍服造型，但静态站位、面朝圆心，
 * 不带行走/名牌动作逻辑。发言者脚下加同色环、轻微起伏与摆头以示正在言说。
 */
const MOOD: Record<string, string> = {
  "平": "#5c6e63",
  "愠": "#983e30",
  "疑": "#b8842b",
  "定": "#3a5a7a",
  "待": "#9a8e7b",
};

function DebateFigure({
  scholar,
  pos,
  speaking,
  roundLabel,
  emotion,
}: {
  scholar: Scholar;
  pos: SeatPos;
  speaking: boolean;
  roundLabel: string;
  emotion: string;
}) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const facing = Math.atan2(-pos.x, -pos.z); // 面向圆心
  const robe = shade(scholar.color, 0.06);
  const trim = shade(scholar.color, 0.22);
  const moodColor = MOOD[emotion] ?? "#9a8e7b";
  const t = useT();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (head.current) {
      const swing = speaking ? 0.4 : 0.16;
      const speed = speaking ? 1.3 : 0.5;
      head.current.rotation.y = Math.sin(t * speed + pos.x) * swing;
      head.current.rotation.x = speaking ? Math.sin(t * 1.6) * 0.06 : 0.1 + Math.sin(t * 0.4) * 0.04;
    }
    if (body.current) {
      body.current.position.y = speaking ? Math.abs(Math.sin(t * 2.2)) * 0.1 : Math.sin(t * 0.7 + pos.z) * 0.025;
    }
  });

  return (
    <group position={[pos.x, 0, pos.z]}>
      {/* 发言者脚下色环 */}
      {speaking && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.4, 32]} />
          <meshBasicMaterial color={scholar.color} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
      <group ref={body} rotation={[0, facing, 0]} scale={1.35}>
        {/* 袍身 */}
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.78, 1.24, 14]} />
          <meshStandardMaterial color={robe} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.79, 0.82, 0.12, 14]} />
          <meshStandardMaterial color={trim} roughness={0.9} />
        </mesh>
        {/* 交领 */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.12, 1.06, 0.34]} rotation={[0.12, 0, s * 0.5]} castShadow>
            <boxGeometry args={[0.34, 0.44, 0.06]} />
            <meshStandardMaterial color={trim} roughness={0.85} />
          </mesh>
        ))}
        {/* 腰带 */}
        <mesh position={[0, 0.78, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.56, 0.14, 14]} />
          <meshStandardMaterial color="#e8dcc0" roughness={0.8} />
        </mesh>
        {/* 广袖 */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.56, 0.86, 0]} rotation={[0, 0, s * 0.32]} castShadow>
            <cylinderGeometry args={[0.19, 0.34, 0.72, 10]} />
            <meshStandardMaterial color={robe} roughness={0.88} />
          </mesh>
        ))}
        {/* 拱手 */}
        <mesh position={[0, 0.92, 0.42]} castShadow>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color="#e7c39c" roughness={0.9} />
        </mesh>
        {/* 头 */}
        <group ref={head} position={[0, 1.52, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.46, 20, 18]} />
            <meshStandardMaterial color="#f0cfa6" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.12, -0.05]} castShadow>
            <sphereGeometry args={[0.475, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color="#2f2a24" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.52, -0.04]} castShadow>
            <sphereGeometry args={[0.17, 12, 10]} />
            <meshStandardMaterial color="#2f2a24" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.54, -0.04]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
            <meshStandardMaterial color={trim} metalness={0.3} roughness={0.6} />
          </mesh>
          {[-0.15, 0.15].map((x) => (
            <mesh key={x} position={[x, 0.04, 0.42]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color="#2b2520" />
            </mesh>
          ))}
          <mesh position={[0, -0.26, 0.34]} castShadow>
            <capsuleGeometry args={[0.09, 0.22, 3, 8]} />
            <meshStandardMaterial color="#4a4038" roughness={1} />
          </mesh>
        </group>
        {/* 足履 */}
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.05, 0.12]} castShadow>
            <boxGeometry args={[0.26, 0.1, 0.4]} />
            <meshStandardMaterial color="#413830" roughness={1} />
          </mesh>
        ))}
        {/* 名牌 */}
        <Html position={[0, 2.5, 0]} center zIndexRange={[9, 0]} pointerEvents="none">
          <div className={`deb-seat-name ${speaking ? "on" : ""}`} style={{ "--accent": scholar.color } as React.CSSProperties}>
            <b>{t(scholar.name)}</b>
            {speaking && <i>{t(roundLabel)}</i>}
          </div>
        </Html>
        {/* 情绪徽（浮于头顶）：一枚 26px 的圆章，两种语文都照中文那一字——
            圆章里搁不下拉丁词，而此刻辩到哪一轮（陈述/反驳/质询/总结）名牌上已有，
            与书脊题签、街上幌子同例：此处是图，不是字。 */}
        <Html position={[0, 3.15, 0]} center zIndexRange={[9, 0]} pointerEvents="none">
          <div className={`deb-emotion ${speaking ? "on" : ""}`} style={{ "--mood": moodColor } as React.CSSProperties}>{emotion}</div>
        </Html>
      </group>
    </group>
  );
}

/**
 * 3D 圆桌辩论场景：束腰圆木案 + 围坐小人 + 发言者高亮 + 可旋转相机。
 * 作为全页辩论叠加层中的 3D 舞台，取代原先的 CSS 圆环。
 */
export default function DebateTable({
  seatedIds,
  speakerIndex,
  phase,
  roundIndex,
  roundLabel,
  emotionOf,
}: {
  seatedIds: string[];
  speakerIndex: number;
  phase: Phase;
  roundIndex: number;
  /** 当前轮名（含动态延展轮）；未传则回退核心四轮之 roundIndex */
  roundLabel?: string;
  emotionOf: Record<string, string>;
}) {
  const seats = useMemo<SeatPos[]>(
    () =>
      seatedIds.map((id, i) => {
        const n = seatedIds.length;
        const a = (i / n) * Math.PI * 2 - Math.PI / 2; // 自正上方起均分
        const R = 4.6; // 桌台半径 3.2 之外
        return { id, x: Math.cos(a) * R, z: Math.sin(a) * R };
      }),
    [seatedIds],
  );
  const speakingId = phase === "speaking" ? seatedIds[speakerIndex] ?? null : null;
  const roundLabelResolved = roundLabel ?? DEBATE_ROUNDS[roundIndex];

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.8]}
      camera={{ position: [0, 6.5, 10.5], fov: 40 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.02 }}
    >
      <color attach="background" args={["#dcd1b7"]} />
      <fog attach="fog" args={["#dcd1b7", 16, 38]} />
      <hemisphereLight args={["#efe6cf", "#8a7a5c", 0.72]} />
      <directionalLight
        position={[6, 12, 5]}
        intensity={1.25}
        color="#fbf3de"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0006}
      />
      {/* 地坪圆毯 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[13, 48]} />
        <meshStandardMaterial color="#c9bd9c" roughness={1} />
      </mesh>
      {/* 束腰圆木案 */}
      <group>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.6, 0.85, 1.1, 20]} />
          <meshStandardMaterial color="#6b5a3e" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.18, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.2, 3.3, 0.24, 40]} />
          <meshStandardMaterial color="#7a6747" roughness={0.8} />
        </mesh>
      </group>
      {seats.map((s) => (
        <DebateFigure
          key={s.id}
          scholar={scholarMap[s.id]}
          pos={s}
          speaking={speakingId === s.id}
          roundLabel={roundLabelResolved}
          emotion={emotionOf[s.id] ?? "待"}
        />
      ))}
      <OrbitControls
        makeDefault
        target={[0, 1.1, 0]}
        minDistance={9}
        maxDistance={17}
        maxPolarAngle={Math.PI / 2.15}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
