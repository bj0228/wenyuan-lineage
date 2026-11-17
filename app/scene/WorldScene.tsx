"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { LVBUWEI, scholarMap } from "../world/characters";
import { regions, regionMap, worldXZ } from "../world/regions";
import { currentElement, type Presence, type Climate, type Season, type Weather } from "../world/schedule";
import { computePositions, groundLift, nearbyOf, type Override } from "../world/placement";
import { buildings } from "./Buildings";
import BuildingModel from "./BuildingModel";
import { baseRadius, tagHeight } from "./modelMeta";
import WorldEnv from "./WorldEnv";
import Figure from "./Figure";
import WeatherFx from "./WeatherFx";
import { useT } from "../i18n/lang";

type Props = {
  world: Record<string, Presence>;
  tick: number;
  climate: Climate;
  selectedId: string;
  overrides: Record<string, Override>;
  onGroundClick: (x: number, z: number) => void;
  onSelect: (id: string) => void;
  /** 游学咨询中的人物 id（其头顶显复诵气泡） */
  questConsultId?: string | null;
  /** 复诵气泡正文 */
  questSpeech?: string | null;
  /** 收起复诵气泡 */
  onCloseSpeech?: () => void;
  /** 进入区域内部（仅市井等可入区用）：点「入市井」钮触发 */
  onEnterRegion?: (id: string) => void;
};

/** 季节色相 tint（淡染于绢底，定基调） */
const SEASON_TINT: Record<Season, string> = {
  春: "#cfe0a0", 夏: "#bcd49a", 秋: "#e6c878", 冬: "#d8d8d6",
};
/** 天气压染色 ＋ 与绢底混合强度 ＋ 日光折扣 ＋ 雾近/远（雾/雨更遮远） */
const WEATHER_TINT: Record<Weather, string> = {
  晴: "#d8c9a6", 阴: "#9aa0a4", 雨: "#7c8794", 雪: "#f4f4f2", 雾: "#cfd2cf",
};
const WEATHER_BLEND: Record<Weather, number> = { 晴: 0, 阴: 0.2, 雨: 0.45, 雪: 0.4, 雾: 0.5 };
const WEATHER_LIGHT: Record<Weather, number> = { 晴: 1, 阴: 0.9, 雨: 0.8, 雪: 0.95, 雾: 0.65 };
const WEATHER_FOG: Record<Weather, [number, number]> = {
  晴: [70, 210], 阴: [60, 190], 雨: [50, 160], 雪: [55, 175], 雾: [40, 130],
};

/** 区域地面基座与匾额 */
function RegionMarker({ id, tick, onEnterRegion }: { id: string; tick: number; onEnterRegion?: (id: string) => void }) {
  const r = regionMap[id];
  const [x, z] = worldXZ(r.x, r.y);
  const Building = buildings[id];
  const enterable = id === "shijing" && onEnterRegion;
  // 基面与匾额都随这一座的实际尺寸走(modelMeta 由 Blender 导出时生成):
  // 原先一律 ⌀28 的土盘比哪座建筑都大,十六个盘子摊开便是满地空土;
  // 现下基面贴着外廓留一圈,匾额悬到各自屋脊之上。
  const br = baseRadius(id);
  const th = tagHeight(id);
  const t = useT();
  return (
    <group position={[x, 0, z]} rotation={[0, r.facing, 0]}>
      {/* 夯土基面 */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[br, 40]} />
        <meshStandardMaterial color="#8d8259" roughness={1} />
      </mesh>
      {/* Blender 建的那版,载入前/载入失败时退回过程式几何 */}
      <BuildingModel id={id} fallback={<Building tick={tick} />} />
      <Html position={[0, th, 0]} center distanceFactor={38} zIndexRange={[6, 0]} pointerEvents="none">
        <div className="place-tag">
          <b>{t(r.name)}</b>
          <span>{t(r.sub)}</span>
        </div>
      </Html>
      {enterable && (
        <Html position={[0, th - 2.3, 0]} center distanceFactor={38} zIndexRange={[7, 0]} pointerEvents="auto">
          <button
            className="enter-region-btn"
            onClick={(e) => { e.stopPropagation(); onEnterRegion!(id); }}
            title={t("进入{region}", { region: t(r.name) })}
          >
            {t("入{region} →", { region: t(r.name) })}
          </button>
        </Html>
      )}
    </group>
  );
}

export default function WorldScene({ world, tick, climate, selectedId, overrides, onGroundClick, onSelect, questConsultId, questSpeech, onCloseSpeech, onEnterRegion }: Props) {
  // 人物落位/朝向/状态/近邻由 placement 统一推算；手动落点经 overrides 注入
  const placements = useMemo(() => computePositions(world, overrides), [world, overrides]);
  // 此处 `t` 已被下方的时辰占去，故译者取名 `tr`
  const tr = useT();
  // 被选中者周围的近邻，用于脚下高亮提示"可对话/可辩论"
  const nearbySet = useMemo(() => new Set(nearbyOf(placements, selectedId)), [placements, selectedId]);

  // 长卷不画天光云影，只借日照角度投出斜影；昼夜以绢色深浅区分
  const t = ((tick % 96) + 96) % 96;
  const dayFrac = t / 96;
  const sunAngle = (dayFrac - 0.25) * Math.PI * 2;
  const sunY = Math.sin(sunAngle) * 60;
  const sunPos: [number, number, number] = [Math.cos(sunAngle) * 70, Math.max(14, sunY), 28];
  const night = sunY < 4;
  const dusk = sunY >= 4 && sunY < 22;
  // 绢底：日间为陈绢米黄，薄暮转赭，入夜压成灰青；再以季节色相淡染、按天气压暗或泛白
  const timeSilk = new THREE.Color(night ? "#4a4a48" : dusk ? "#c9a878" : "#d8c9a6");
  const timeSun = new THREE.Color(night ? "#9a9c96" : dusk ? "#e6c08c" : "#fbf3de");
  const blend = WEATHER_BLEND[climate.weather];
  const silkC = timeSilk.clone().lerp(new THREE.Color(SEASON_TINT[climate.season]), 0.22).lerp(new THREE.Color(WEATHER_TINT[climate.weather]), blend);
  const silk = `#${silkC.getHexString()}`;
  const sunColor = `#${timeSun.clone().lerp(new THREE.Color(WEATHER_TINT[climate.weather]), blend * 0.7).getHexString()}`;
  const lightFactor = WEATHER_LIGHT[climate.weather];
  const [fogNear, fogFar] = WEATHER_FOG[climate.weather];

  return (
    <Canvas
      shadows="soft"
      dpr={[1, 1.8]}
      camera={{ position: [0, 32, 48], fov: 40 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.02 }}
    >
      <color attach="background" args={[silk]} />
      {/* 雾同绢色，远处自然褪入纸面，仿长卷留白 */}
      <fog attach="fog" args={[silk, fogNear, fogFar]} />

      <Suspense fallback={null}>
        {/* 顶光偏纸白，底部回弹赭色，整体压在低饱和区间 */}
        <hemisphereLight args={["#efe6cf", "#8a7a5c", night ? 0.42 : 0.66]} />
        <directionalLight
          position={sunPos}
          intensity={(night ? 0.5 : 1.35) * lightFactor}
          color={sunColor}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          shadow-camera-far={200}
          shadow-bias={-0.0006}
        />

        {/* 环境:Blender 建的那张地形/河谷/石桥/驰道/街具/林木,
            载入前或载入失败时退回过程式的 Terrain＋Streetscape */}
        <WorldEnv />
        {/* 天气粒子：雨丝/雪花/秋日落叶，按气候按需挂卸 */}
        <WeatherFx weather={climate.weather} season={climate.season} />
        {/* 不可见地面：点空地让选中人物走过去（用 onClick 而非 onPointerDown，
            以区分点击移动与拖动旋转相机） */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onGroundClick(e.point.x, e.point.z);
          }}
        >
          <planeGeometry args={[220, 220]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {regions.map((r) => <RegionMarker key={r.id} id={r.id} tick={tick} onEnterRegion={onEnterRegion} />)}

        {placements.map((p) => {
          const el = p.id === "zou" ? currentElement(tick) : null;
          return (
            <Figure
              key={p.id}
              scholar={scholarMap[p.id]}
              target={p.target}
              action={world[p.id].action}
              mood={p.mood}
              active={selectedId === p.id}
              nearby={nearbySet.has(p.id)}
              onSelect={() => onSelect(p.id)}
              phase={p.phase}
              facingAngle={p.facingAngle}
              /* 邹衍头顶那枚短牌：中文作「土德」，英文作 "Earth ascendant" */
              crest={el ? { color: el.color, glyph: tr("{element}德", { element: tr(el.name) }) } : undefined}
              speech={questConsultId === p.id ? (questSpeech ?? undefined) : undefined}
              onCloseSpeech={questConsultId === p.id ? onCloseSpeech : undefined}
            />
          );
        })}

        {/* 主持人吕不韦：静态驻招贤馆/编简阁中心，不随日程移动、不受 override 影响；
            由 page 注入其静态 presence（action/mood），集会时与门客同框（门客往来成景） */}
        {(() => {
          const r = regionMap["zhaoxian"];
          const [lx, lz] = worldXZ(r.x, r.y);
          const lvb = world["lvbuwei"];
          return (
            <Figure
              scholar={LVBUWEI}
              target={[lx, groundLift("zhaoxian"), lz]}
              action={lvb?.action ?? "集门客论学"}
              mood={lvb?.mood ?? "think"}
              active={selectedId === "lvbuwei"}
              nearby={false}
              onSelect={() => onSelect("lvbuwei")}
              phase={99}
              facingAngle={0}
            />
          );
        })()}
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, 2, 0]}
        minDistance={30}
        maxDistance={105}
        maxPolarAngle={Math.PI / 2.25}
        enablePan
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}

