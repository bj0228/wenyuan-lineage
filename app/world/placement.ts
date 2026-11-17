import { scholars } from "./characters";
import { regionMap, regions, worldXZ } from "./regions";
import type { Mood, Presence } from "./schedule";

/** "附近"的距离阈值（世界单位）。地图 108 见方，同区人物相距约 13，跨区 >30；
 *  6 约等于同区相邻，可据此发起对话/辩论。 */
export const PROXIMITY = 6;

export type Pos = {
  id: string;
  target: [number, number, number];
  /** 同区域内序号，用来错开动画相位 */
  phase: number;
  /** 静止时的朝向（弧度） */
  facingAngle: number;
  mood: Mood;
  region: string;
  /** 距离在阈值内的其他人物 id */
  nearbyIds: string[];
};

/** 手动落点：用户点地图给某人物设定的目标 xz。 */
export type Override = { x: number; z: number };

/** 各区基址抬升高度，使小人立于台面而非陷入台阶 */
export function groundLift(regionId: string) {
  switch (regionId) {
    case "academy":
      return 1.65;
    case "hall":
      return 2.1;
    case "jixia":
      return 0.95;
    case "workshop":
      return 0.4;
    case "zongheng":
      return 0.5;
    case "mingjia":
      return 1.0;
    case "daoshan":
      return 0.4;
    case "plaza":
      return 0.7;
    case "guanxing":
      return 0.6;
    case "shapan":
      return 0.4;
    case "tianshe":
      return 0.4;
    case "chidao":
      return 0.5;
    case "shijing":
      return 0.35;
    case "dukou":
      return 0.2;
    case "zhaoxian":
      return 0.7;
    default:
      return 0.35;
  }
}

/** 落点 xz 距离最近的区域 id（用于被移动者的显示区域与抬升高度） */
export function nearestRegionId(x: number, z: number): string {
  let best = regions[0].id;
  let bestD = Infinity;
  for (const r of regions) {
    const [cx, cz] = worldXZ(r.x, r.y);
    const d = Math.hypot(cx - x, cz - z);
    if (d < bestD) {
      bestD = d;
      best = r.id;
    }
  }
  return best;
}

/**
 * 由日程 `world` 与手动落点 `overrides` 推算每位人物的落位、朝向、状态与近邻。
 * 无 override 时与原 WorldScene 内联的 placements 行为一致（回归基线）。
 * 有 override 的人物脱离日程 slot，按落点定位，mood 由近邻数重算、朝向最近邻。
 */
export function computePositions(
  world: Record<string, Presence>,
  overrides: Record<string, Override>,
): Pos[] {
  // 区域→人 列表：被移动者不占日程 slot，其余人重新流式落位
  const regionLists: Record<string, string[]> = {};
  for (const s of scholars) {
    if (overrides[s.id]) continue;
    const r = world[s.id].region;
    if (!regionLists[r]) regionLists[r] = [];
    regionLists[r].push(s.id);
  }
  for (const list of Object.values(regionLists)) list.sort();

  // 各人原始落位
  const raw = scholars.map((s, idx) => {
    const ov = overrides[s.id];
    if (ov) {
      const rid = nearestRegionId(ov.x, ov.z);
      return {
        id: s.id,
        target: [ov.x, groundLift(rid), ov.z] as [number, number, number],
        phase: idx,
        region: rid,
        overridden: true,
        nearbyIds: [] as string[],
      };
    }
    const p = world[s.id];
    const r = regionMap[p.region];
    const i = regionLists[r.id].indexOf(s.id);
    const slot = r.slots[i % r.slots.length];
    const [bx, bz] = worldXZ(r.x, r.y);
    return {
      id: s.id,
      target: [bx + slot.dx * 0.62, groundLift(r.id), bz + slot.dy * 0.62] as [number, number, number],
      phase: i,
      region: r.id,
      overridden: false,
      nearbyIds: [] as string[],
    };
  });

  const targetMap: Record<string, [number, number, number]> = {};
  raw.forEach((p) => {
    targetMap[p.id] = p.target;
  });

  // 每人的近邻 id 列表（xz 距离 ≤ 阈值，排除自身）
  raw.forEach((p) => {
    const [px, , pz] = p.target;
    p.nearbyIds = raw
      .filter((o) => o.id !== p.id && Math.hypot(targetMap[o.id][0] - px, targetMap[o.id][2] - pz) <= PROXIMITY)
      .map((o) => o.id);
  });

  // 朝向与状态：被移动者按近邻重算，其余沿用日程
  return raw.map((p) => {
    const presence = world[p.id];
    let mood: Mood = presence.mood;
    let facingAngle = 0;

    if (p.overridden) {
      const n = p.nearbyIds.length;
      mood = n >= 2 ? "debate" : n === 1 ? "talk" : "think";
      if (n >= 1) {
        // 朝向最近的那一位
        const nearest = p.nearbyIds
          .map((id) => ({
            id,
            d: Math.hypot(targetMap[id][0] - p.target[0], targetMap[id][2] - p.target[2]),
          }))
          .sort((a, b) => a.d - b.d)[0];
        const [tx, , tz] = targetMap[nearest.id];
        const [px, , pz] = p.target;
        facingAngle = Math.atan2(tx - px, tz - pz);
      }
    } else if (presence.mood === "talk" && presence.event) {
      const otherId = presence.event.actors.find((a) => a !== p.id);
      if (otherId && targetMap[otherId]) {
        const [tx, , tz] = targetMap[otherId];
        const [px, , pz] = p.target;
        facingAngle = Math.atan2(tx - px, tz - pz);
      }
    } else if (presence.mood === "debate") {
      const r = regionMap[presence.region];
      const [cx, cz] = worldXZ(r.x, r.y);
      const [px, , pz] = p.target;
      facingAngle = Math.atan2(cx - px, cz - pz);
    }

    return {
      id: p.id,
      target: p.target,
      phase: p.phase,
      facingAngle,
      mood,
      region: p.region,
      nearbyIds: p.nearbyIds,
    };
  });
}

/** 某人物的近邻 id 列表（供侧栏"附近的人"与对话/辩论入口使用）。 */
export function nearbyOf(positions: Pos[], id: string): string[] {
  return positions.find((p) => p.id === id)?.nearbyIds ?? [];
}
