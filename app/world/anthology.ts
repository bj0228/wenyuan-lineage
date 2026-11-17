import { useState } from "react";
import { scholarMap } from "./characters";
import type { Verdict } from "./dialogue";

/** 语录中一段诸子发言（已扁平化人物元信息，脱离 scholars 引用即可独立存档/导出） */
export type AnthologyTurn = {
  scholarId: string;
  name: string;
  school: string;
  glyph: string;
  color: string;
  text: string;
  /** 辩中若已右键译为白话则带上，竹简上一并誊抄 */
  vernacular?: string;
  citations: { book: string; chapter: string }[];
  verdict?: Verdict;
  /** 下判的模型 id：导出的语录要能自证判词出自异源校验官，而非发言者自家模型 */
  verdictModel?: string;
  /** 该判是否属异源外证。false＝异源不可用、退回本家自审 */
  verdictCross?: boolean;
};

/** 语录一轮：陈述/反驳/质询/总结 */
export type AnthologyRound = {
  round: "陈述" | "反驳" | "质询" | "总结";
  turns: AnthologyTurn[];
};

export type AnthologyParticipant = {
  id: string;
  name: string;
  school: string;
  glyph: string;
  color: string;
};

/** 一场圆桌辩论的竹简语录条目 */
export type AnthologyEntry = {
  id: string;
  /** 真实日期 YYYY-MM-DD（"按日期命名"） */
  date: string;
  /** 收录时的世界时辰（如"申时"），作风味 */
  shichen: string;
  topic: string;
  kind: "圆桌辩论";
  participants: AnthologyParticipant[];
  rounds: AnthologyRound[];
  /** 末轮主持人吕不韦的收束（若有） */
  hostLine?: string;
  /** epoch ms，排序用 */
  createdAt: number;
};

const STORAGE_KEY = "zhuzi-yulu";

function load(): AnthologyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as AnthologyEntry[];
    if (!Array.isArray(data)) return [];
    return data.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function persist(entries: AnthologyEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* 配额满或被禁用，静默放弃持久化（内存态仍可用） */
  }
}

/**
 * 语录存取 hook：挂载时从 localStorage 读（避免 SSR/hydration 不一致），
 * 仅在显式增删时写回（不在初始 load 时误写空数组覆盖既有数据）。
 * 返回 [entries（按 createdAt 降序）, { add, remove, clear }]。
 */
export function useAnthology() {
  // 惰性初值：挂载即从 localStorage 读。语录面板默认不渲染（panel="profile"），
  // SSR 与 hydration 的 DOM 一致、无水合不匹配；切到「语录」tab 时数据已就绪。
  // 不在 effect 里同步 setState（react-hooks/set-state-in-effect）。
  const [entries, setEntries] = useState<AnthologyEntry[]>(() => load());

  function add(entry: AnthologyEntry) {
    setEntries((prev) => {
      const next = [entry, ...prev.filter((e) => e.id !== entry.id)].sort((a, b) => b.createdAt - a.createdAt);
      persist(next);
      return next;
    });
  }

  function remove(id: string) {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
  }

  function clear() {
    setEntries([]);
    persist([]);
  }

  return [entries, { add, remove, clear }] as const;
}

const ROUND_ORDER: ("陈述" | "反驳" | "质询" | "总结")[] = ["陈述", "反驳", "质询", "总结"];

/**
 * 由 DebateStage 的 turns/seated/topic 构造一条语录。turns 按 round 归轮、保留顺序；
 * 每段发言扁平化人物元信息（name/school/glyph/color）使条目独立可存、可导出。
 */
export function buildEntry(params: {
  topic: string;
  seatedIds: string[];
  turns: {
    round: "陈述" | "反驳" | "质询" | "总结";
    scholarId: string;
    text: string;
    vernacular?: string;
    citations: { book: string; chapter: string }[];
    verdict?: Verdict;
    verdictModel?: string;
    verdictCross?: boolean;
  }[];
  hostLine?: string;
  shichen: string;
}): AnthologyEntry {
  const { topic, seatedIds, turns, hostLine, shichen } = params;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const participants: AnthologyParticipant[] = seatedIds.map((id) => {
    const s = scholarMap[id];
    return { id, name: s?.name ?? id, school: s?.school ?? "", glyph: s?.glyph ?? "·", color: s?.color ?? "#888" };
  });

  const rounds: AnthologyRound[] = ROUND_ORDER.map((round) => {
    const turnsOfRound = turns.filter((t) => t.round === round);
    if (!turnsOfRound.length) return null;
    return {
      round,
      turns: turnsOfRound.map((t) => {
        const s = scholarMap[t.scholarId];
        return {
          scholarId: t.scholarId,
          name: s?.name ?? "诸子",
          school: s?.school ?? "",
          glyph: s?.glyph ?? "·",
          color: s?.color ?? "#888",
          text: t.text,
          vernacular: t.vernacular,
          citations: t.citations,
          verdict: t.verdict,
          verdictModel: t.verdictModel,
          verdictCross: t.verdictCross,
        };
      }),
    };
  }).filter(Boolean) as AnthologyRound[];

  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    date: `${yyyy}-${mm}-${dd}`,
    shichen,
    topic,
    kind: "圆桌辩论",
    participants,
    rounds,
    hostLine,
    createdAt: now.getTime(),
  };
}
