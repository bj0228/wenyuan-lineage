import { useSyncExternalStore } from "react";

/**
 * 人物长期记忆：诸子与客（用户）此前的问答要点，存于 localStorage，跨会话持久。
 * 仿 seals.ts 的 useSyncExternalStore + 模块级快照缓存 + EMPTY SSR 快照模式。
 * 每位诸子保留最近若干条，注入对话上下文使诸子能承接前缘、不重复。
 */

export type MemoryEntry = {
  id: string;
  scholarId: string;
  /** 客所问之议题（问句原文或其要） */
  topic: string;
  /** 诸子回答正文摘录（前 ~50 字），作记忆要点 */
  excerpt: string;
  /** 得记时的世界时辰（如「申时」），作风味 */
  shichen: string;
  /** 世界日序号 */
  worldDay: number;
  /** epoch ms，排序用 */
  createdAt: number;
};

const STORAGE_KEY = "zhuzi-memory";
/** 每位诸子保留最近条数（环形截断） */
const PER_SCHOLAR = 8;
const EMPTY: MemoryEntry[] = [];
const EVENT = "zhuzi-memory:change";

let cachedRaw: string | null = null;
let cached: MemoryEntry[] = EMPTY;

function read(): MemoryEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) { cached = EMPTY; return cached; }
    const data = JSON.parse(raw) as MemoryEntry[];
    cached = Array.isArray(data) ? data.sort((a, b) => a.createdAt - b.createdAt) : EMPTY;
    return cached;
  } catch {
    cached = EMPTY;
    return cached;
  }
}

function persist(entries: MemoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* 配额满或被禁用，静默放弃 */
  }
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** 中文二元/一元分词（与 canon.ts 同思路），用于 recallMemory 的议题重合度排序 */
function tokensOf(s: string): string[] {
  const out = new Set<string>();
  for (const seg of s.replace(/[，。？！、；：“”‘’（）,.?!;:()\s]+/g, " ").split(" ").filter(Boolean)) {
    for (let i = 0; i < seg.length; i++) {
      const uni = seg[i];
      if (/[一-龥]/.test(uni)) out.add(uni);
      if (i + 1 < seg.length) out.add(seg.slice(i, i + 2));
    }
  }
  return [...out];
}

/**
 * 记录一条记忆：诸子回答落定后调用。每位诸子只保留最近 PER_SCHOLAR 条（按 createdAt 截断）。
 * 调用方在事件回调中调用（非 render 期），故 new Date()/crypto 安全。
 */
export function recordMemory(scholarId: string, topic: string, excerpt: string, shichen: string, worldDay: number) {
  const now = new Date();
  const entry: MemoryEntry = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    scholarId,
    topic: topic.slice(0, 60),
    excerpt: excerpt.slice(0, 50),
    shichen,
    worldDay,
    createdAt: now.getTime(),
  };
  const all = read();
  const others = all.filter((e) => e.scholarId !== scholarId);
  // 该子保留最近 PER_SCHOLAR 条（含新条目；已按 createdAt 升序）
  const own = [...all.filter((e) => e.scholarId === scholarId), entry].slice(-PER_SCHOLAR);
  persist([...others, ...own]);
  notify();
}

/**
 * 召回该诸子与议题最相关的记忆：按议题 token 与 excerpt/topic 的重合度排序，
 * 无命中则退回最近 limit 条。供 composeXxxLLM 注入 payload.memory。
 */
export function recallMemory(scholarId: string, topic: string, limit = 3): MemoryEntry[] {
  const own = read().filter((e) => e.scholarId === scholarId);
  if (!own.length) return [];
  const terms = tokensOf(topic);
  if (!terms.length) return own.slice(-limit).reverse();
  const scored = own.map((e) => {
    const hay = tokensOf(`${e.topic}${e.excerpt}`);
    let score = 0;
    for (const t of terms) if (hay.includes(t)) score += 1;
    return { e, score, createdAt: e.createdAt };
  });
  const hit = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);
  const pool = hit.length ? hit : scored.sort((a, b) => b.createdAt - a.createdAt);
  return pool.slice(0, limit).map((s) => s.e);
}

/**
 * 记忆存取 hook：SSR 与首帧返回稳定空快照，hydration 后读真实存档。
 * 返回 [entries（按 createdAt 升序）, {}]——记忆主要由 recordMemory/recallMemory 命令式操作，
 * hook 仅供 UI（如记忆指示器）订阅刷新。
 */
export function useMemory() {
  const entries = useSyncExternalStore(subscribe, read, () => EMPTY);
  return [entries] as const;
}
