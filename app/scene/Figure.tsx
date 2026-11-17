"use client";

import { useRef, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Scholar } from "../world/characters";
import type { Mood } from "../world/schedule";
import { useLang, useT } from "../i18n/lang";
import { useTActionBare } from "../i18n/action";

type Props = {
  scholar: Scholar;
  /** 目标落位，由 WorldScene 按日程计算；Figure 内部平滑插值，不直接跳变 */
  target: [number, number, number];
  action: string;
  mood: Mood;
  active: boolean;
  /** 在被选中者的"附近"阈值内，脚下加一圈翠色环，提示可发起对话/辩论 */
  nearby?: boolean;
  onSelect: () => void;
  /** 同区域内的序号，用来错开动画相位 */
  phase: number;
  /** 静止时的朝向（弧度）：谈时面向搭档，辩时面向区域中心，其余为 0 */
  facingAngle: number;
  /** 头顶「当德」之徽（仅邹衍）：色随五行相胜轮转；缺省不显 */
  crest?: { color: string; glyph?: string };
  /** 游学咨询时头顶复诵气泡（复诵原典＋《书·篇》、不附白话）；缺省不显 */
  speech?: string;
  /** 收起头顶复诵气泡 */
  onCloseSpeech?: () => void;
  /**
   * 整体倍率（缺省 1），乘在 FIGURE_SCALE 之上。两个世界共用小人：西游的
   * 建筑整体放大一档后人物随乘，免动 FIGURE_SCALE 波及战国那张长卷。
   */
  scale?: number;
};

/** 小人整体放大倍数：微缩长卷里人物仍需一眼可辨 */
const FIGURE_SCALE = 1.55;

/** 足迹：扁圆落世界坐标、按龄渐隐回收。池大小、渐隐秒、每足间距、峰值透明度。 */
const PRINT_COUNT = 8;
const PRINT_FADE = 4.2;
const PRINT_STEP = 0.5;
const PRINT_ALPHA = 0.7;

const MOODS: Record<Mood, { label: string; glyph: string }> = {
  think: { label: "思", glyph: "◌" },
  talk: { label: "谈", glyph: "❞" },
  debate: { label: "辩", glyph: "✦" },
};

/**
 * 头顶那一字的英文说法。
 *
 * 不直接把「思」收进词表：那一个字在典籍图谱里已另有所指（节点类型「思」＝思想，
 * 作 Idea），此处却是心绪（在想）。一句中文两处异义，`lang.ts` 的办法是在中文侧
 * 分辨——故此处另记三个中文词作键，只走英文一路；中文仍渲染 `m.label`，
 * 那一字一笔不动。
 */
const MOOD_WORD: Record<Mood, string> = {
  think: "凝神",
  talk: "交谈",
  debate: "辩说",
};

/** 稍暗的同色，用于衣缘与发髻 */
function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0.02, -amount);
  return `#${c.getHexString()}`;
}

/**
 * 卡通微缩小人：大头小身的 Q 版比例，
 * 身体为上窄下宽的袍服（圆台），配交领、广袖、发髻与足履。
 * 位置由 useFrame 平滑插值到 target，不在 JSX 层设置 position 以避免
 * React reconciler 在 target 变化时瞬移小人。
 */
export default function Figure({ scholar, target, action, mood, active, nearby, onSelect, phase, facingAngle, crest, speech, onCloseSpeech, scale = 1 }: Props) {
  const group = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  // 当前 xz 位置，独立于 React 渲染，由 useFrame 每帧更新
  const posXZ = useRef<[number, number]>([target[0], target[2]]);
  // 足迹池：PRINT_COUNT 个平铺扁圆，作平移 group 的兄弟节点（不被带动）；
  // 落点记世界坐标、按龄渐隐回收（仿 WeatherFx 粒子回收）；raycast 禁用免拦空地点击。
  const printGroupRef = useRef<(THREE.Group | null)[]>([]);
  const printState = useRef(
    Array.from({ length: PRINT_COUNT }, () => ({ x: 0, z: 0, rot: 0, bornAt: -999 })),
  );
  const printCursor = useRef(0);
  const distSinceStep = useRef(0);
  const lastPos = useRef<[number, number]>([target[0], target[2]]);
  const foot = useRef(false);

  // 初始化足迹：useLayoutEffect 于 commit 后、首帧 paint 前同步执行，
  // 将 8 槽皆置不可见、材质透明度归 0，免 mount 时闪现于原点。
  // 其后 opacity/visible 由 useFrame 独占——JSX 不含二者，故 r3f 重渲染时不再覆写（否则会把 useFrame 设的透明度重置回 JSX 初值）。
  useLayoutEffect(() => {
    for (let i = 0; i < PRINT_COUNT; i++) {
      const g = printGroupRef.current[i];
      if (!g) continue;
      g.visible = false;
      const mesh = g.children[0] as THREE.Mesh | undefined;
      if (mesh) (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }, []);
  const robe = shade(scholar.color, 0.06);
  const trim = shade(scholar.color, 0.22);
  const m = MOODS[mood];
  const t = useT();
  const lang = useLang();
  const tActionBare = useTActionBare();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + phase * 1.7;
    if (group.current) {
      // xz 向目标插值（步行），y 直接跳到目标地面高度并叠加呼吸起伏。
      // dt 感知的指数插值：RATE 为 60fps 下每帧逼近比例，按 delta 换算使快慢不随刷新率漂移
      // （否则 144Hz 显示器会比 60Hz 快逾两倍，即旧版「太快」之一因）；RATE 0.022 较旧 0.038 更缓、呈徐行。
      const RATE = 0.022;
      const k = 1 - Math.pow(1 - RATE, Math.min(delta, 0.05) * 60);
      posXZ.current[0] += (target[0] - posXZ.current[0]) * k;
      posXZ.current[1] += (target[2] - posXZ.current[1]) * k;

      group.current.position.x = posXZ.current[0];
      group.current.position.z = posXZ.current[1];
      group.current.position.y = target[1] + Math.sin(t * 1.6) * 0.045 + (active ? 0.32 : 0);

      // 朝向：行进中面向移动方向；静止后渐转至事件朝向；选中时缓慢自转
      const dx = target[0] - posXZ.current[0];
      const dz = target[2] - posXZ.current[1];
      const walking = Math.sqrt(dx * dx + dz * dz) > 0.25;

      if (active) {
        group.current.rotation.y += 0.004;
      } else if (walking) {
        group.current.rotation.y = Math.atan2(dx, dz);
      } else {
        // 平滑插值到目标朝向，归一化角差到 [-π, π]
        const diff = ((facingAngle - group.current.rotation.y) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        group.current.rotation.y += diff * 0.06;
      }

      // 足迹：行走时每移 PRINT_STEP 落一足（左右交替、垂直于行进向偏移），
      // 各足按龄渐隐回收。行进向 (sinθ,cosθ)，其左垂直向 (cosθ,-sinθ)。
      const moved = Math.hypot(posXZ.current[0] - lastPos.current[0], posXZ.current[1] - lastPos.current[1]);
      lastPos.current[0] = posXZ.current[0];
      lastPos.current[1] = posXZ.current[1];
      if (walking) {
        distSinceStep.current += moved;
        if (distSinceStep.current >= PRINT_STEP) {
          const rot = group.current.rotation.y;
          const side = foot.current ? 1 : -1;
          const slot = printState.current[printCursor.current];
          slot.x = posXZ.current[0] + Math.cos(rot) * 0.15 * side;
          slot.z = posXZ.current[1] + -Math.sin(rot) * 0.15 * side;
          slot.rot = rot + (foot.current ? 0.25 : -0.25);
          slot.bornAt = state.clock.elapsedTime;
          foot.current = !foot.current;
          printCursor.current = (printCursor.current + 1) % PRINT_COUNT;
          distSinceStep.current = 0;
        }
      }
      for (let i = 0; i < PRINT_COUNT; i++) {
        const g = printGroupRef.current[i];
        if (!g) continue;
        const slot = printState.current[i];
        if (slot.bornAt < 0) {
          g.visible = false;
          continue;
        }
        const age = state.clock.elapsedTime - slot.bornAt;
        const op = Math.max(0, 1 - age / PRINT_FADE) * PRINT_ALPHA;
        const mesh = g.children[0] as THREE.Mesh | undefined;
        if (op <= 0.001 || !mesh) {
          g.visible = false;
          continue;
        }
        g.visible = true;
        g.position.set(slot.x, 0.03, slot.z);
        g.rotation.y = slot.rot;
        (mesh.material as THREE.MeshBasicMaterial).opacity = op;
      }
    }
    // 思时低头缓摇，谈辩时摆幅加大、节律加快
    if (head.current) {
      const swing = mood === "debate" ? 0.42 : mood === "talk" ? 0.34 : 0.2;
      const speed = mood === "debate" ? 1.5 : mood === "talk" ? 1.1 : 0.55;
      head.current.rotation.y = Math.sin(t * speed) * swing;
      head.current.rotation.x = mood === "think" ? 0.16 + Math.sin(t * 0.5) * 0.05 : Math.sin(t * speed * 1.3) * 0.07;
    }
  });

  return (
    <>
    <group
      ref={group}
      scale={FIGURE_SCALE * scale}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      {/* 选中光环 */}
      {active && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.25, 28]} />
          <meshBasicMaterial color={scholar.color} transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 附近光环：在被选中者阈值内，提示可对话/可辩论 */}
      {nearby && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.32, 1.56, 28]} />
          <meshBasicMaterial color="#567565" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 袍身 */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.78, 1.24, 14]} />
        <meshStandardMaterial color={robe} roughness={0.85} />
      </mesh>
      {/* 下摆压边 */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.79, 0.82, 0.12, 14]} />
        <meshStandardMaterial color={trim} roughness={0.9} />
      </mesh>
      {/* 交领：两片斜置薄板 */}
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
      {/* 拱手：袖前合抱的双手 */}
      <mesh position={[0, 0.92, 0.42]} castShadow>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshStandardMaterial color="#e7c39c" roughness={0.9} />
      </mesh>

      {/* 头：Q 版放大 */}
      <group ref={head} position={[0, 1.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.46, 20, 18]} />
          <meshStandardMaterial color="#f0cfa6" roughness={0.85} />
        </mesh>
        {/* 头发与发髻 */}
        <mesh position={[0, 0.12, -0.05]} castShadow>
          <sphereGeometry args={[0.475, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color="#2f2a24" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.52, -0.04]} castShadow>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color="#2f2a24" roughness={0.95} />
        </mesh>
        {/* 冠簪 */}
        <mesh position={[0, 0.54, -0.04]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color={trim} metalness={0.3} roughness={0.6} />
        </mesh>
        {/* 眼、须 */}
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

      {/* 头顶状态：思 / 谈 / 辩 */}
      <Html position={[0, 2.5, 0]} center distanceFactor={26} zIndexRange={[9, 0]} pointerEvents="none">
        <div className={`mood-bubble ${mood}`}>
          <i>{m.glyph}</i>
          <b>{lang === "en" ? t(MOOD_WORD[mood]) : m.label}</b>
        </div>
      </Html>

      {/* 名牌与动作气泡 */}
      <Html position={[0, 2.06, 0]} center distanceFactor={26} zIndexRange={[8, 0]} pointerEvents="none">
        <div className={`fig-tag ${active ? "on" : ""}`} style={{ "--accent": scholar.color } as React.CSSProperties}>
          <b>{t(scholar.name)}</b>
          {/* 「正在…」那一句是拼出来的，照 i18n/action.ts 的支路译（中文仍逐字同前） */}
          <span>{tActionBare(action)}</span>
        </div>
      </Html>

      {/* 头顶「当德」之徽（仅邹衍）：发光小球随当德换色，与观星台顶端星同源 */}
      {crest && (
        <>
          <mesh position={[0, 2.9, 0]}>
            <sphereGeometry args={[0.24, 16, 14]} />
            <meshStandardMaterial color={crest.color} emissive={crest.color} emissiveIntensity={1.5} />
          </mesh>
          {crest.glyph && (
            <Html position={[0, 3.32, 0]} center distanceFactor={26} zIndexRange={[9, 0]} pointerEvents="none">
              <span
                style={{
                  display: "inline-block",
                  color: "#f5efe2",
                  background: "rgba(28,24,18,0.82)",
                  border: `1px solid ${crest.color}`,
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: "16px",
                  whiteSpace: "nowrap",
                  boxShadow: `0 0 6px ${crest.color}88`,
                } as React.CSSProperties}
              >
                {crest.glyph}
              </span>
            </Html>
          )}
        </>
      )}

      {/* 游学咨询头顶复诵气泡：复诵原典＋《书·篇》、不附白话（留作回禀考查）；×可收起。
          宽版对话气泡：署名＋正文，顶边以本子色相呼应，故其为「对话」而非答案弹出。 */}
      {speech && (
        <Html position={[0, 3.7, 0]} center distanceFactor={26} zIndexRange={[20, 0]} pointerEvents="auto">
          <div className="speech-bubble" style={{ "--accent": scholar.color } as React.CSSProperties} role="dialog" aria-label={t("{name}复诵", { name: t(scholar.name) })}>
            <b className="speech-name">{t(scholar.name)}</b>
            {/* 气泡里是复诵的典籍原文，两种语文都照原样——原文不替换（见 i18n/lang.ts 顶注） */}
            <p>{speech}</p>
            {onCloseSpeech && (
              <button className="speech-close" onClick={(e) => { e.stopPropagation(); onCloseSpeech(); }} aria-label={t("收起")}>×</button>
            )}
          </div>
        </Html>
      )}
    </group>

      {/* 足迹池：平移 group 的兄弟节点（不被带动），各扁圆落世界坐标、按龄渐隐回收；
          raycast 禁用以免拦住「点空地令诸子前往」的地面拾取。 */}
      {Array.from({ length: PRINT_COUNT }, (_, i) => (
        <group key={i} ref={(el) => { printGroupRef.current[i] = el; }}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => {}}>
            <planeGeometry args={[0.46, 0.28]} />
            <meshBasicMaterial color="#43381f" transparent depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}
