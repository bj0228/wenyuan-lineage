import { useSyncExternalStore } from "react";

/** 称号：答题连对达阈值即解锁，存 localStorage，用户面板称号墙陈列。 */
export type Title = {
  id: string;
  /** 称号名（如「初学」「博闻强识」） */
  name: string;
  /** 一句释名 */
  desc: string;
  /** 解锁所需连对题数 */
  threshold: number;
};

/** 称号阶梯：按 threshold 升序；连对达阈值即解锁对应称号（不可逆）。 */
export const TITLES: Title[] = [
  { id: "chu-xue", name: "初学", desc: "连对一题，始入经义之门。", threshold: 1 },
  { id: "xiao-cheng", name: "小有所成", desc: "连对三题，渐识先贤之旨。", threshold: 3 },
  { id: "jian-jing", name: "渐入佳境", desc: "连对五题，典籍略无滞碍。", threshold: 5 },
  { id: "bo-wen", name: "博闻强识", desc: "连对八题，闻见广而识之审。", threshold: 8 },
  { id: "tong-ru", name: "通儒达士", desc: "连对十二题，通经致用。", threshold: 12 },
  { id: "zong-shi", name: "一代宗师", desc: "连对二十题，蔚为一家之言。", threshold: 20 },
];

const STORAGE_KEY = "zhuzi-titles";
/** SSR / 首次 hydration 用的稳定空快照——服务端无 window 读不得 localStorage */
const EMPTY_TITLES: string[] = [];
/** 同标签页写入后通知订阅者（storage 事件只跨标签页、不回响本页） */
const TITLES_EVENT = "zhuzi-titles:change";

/**
 * 快照缓存：仅当 localStorage 原始串变化时才重新解析，保证返回引用稳定——
 * 否则 useSyncExternalStore 每次渲染拿到的都是新引用，会触发无限重渲。
 */
let cachedRaw: string | null = null;
let cachedTitles: string[] = EMPTY_TITLES;

function read(): string[] {
  if (typeof window === "undefined") return EMPTY_TITLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedTitles;
    cachedRaw = raw;
    if (!raw) { cachedTitles = EMPTY_TITLES; return cachedTitles; }
    const data = JSON.parse(raw);
    cachedTitles = Array.isArray(data) ? data.filter((x) => typeof x === "string") : EMPTY_TITLES;
    return cachedTitles;
  } catch {
    cachedTitles = EMPTY_TITLES;
    return cachedTitles;
  }
}

function persist(titles: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
  } catch {
    /* 配额满或被禁用，静默放弃持久化（内存态仍可用） */
  }
}

/** 写入后派发同页事件，令本页订阅者重新取快照 */
function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TITLES_EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(TITLES_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TITLES_EVENT, callback);
  };
}

/**
 * 称号存取 hook：以 useSyncExternalStore 接 localStorage——
 * SSR 与首次 hydration 均返回稳定空快照（EMPTY_TITLES），故服务端 ×空 与客户端首帧 ×空 一致，
 * 不触发 hydration mismatch；hydration 完成后再读真实存档。返回 [已解锁 id 数组, { unlock }]。
 */
export function useTitles() {
  const titles = useSyncExternalStore(subscribe, read, () => EMPTY_TITLES);

  function unlock(id: string) {
    if (read().includes(id)) return false;
    const next = [...read(), id];
    persist(next);
    notify();
    return true;
  }

  return [titles, { unlock }] as const;
}

/** 由已解锁 id 数组返回当前最高称号（threshold 最大者）；无一已解则 null。 */
export function highestTitle(unlocked: readonly string[]): Title | null {
  let best: Title | null = null;
  for (const t of TITLES) {
    if (unlocked.includes(t.id) && (!best || t.threshold > best.threshold)) best = t;
  }
  return best;
}

/** 连对 n 题时本次应解锁的称号（threshold===n 且未在已解集合内）；无则 null。 */
export function titleForStreak(n: number, unlocked: readonly string[]): Title | null {
  const t = TITLES.find((x) => x.threshold === n);
  if (t && !unlocked.includes(t.id)) return t;
  return null;
}
