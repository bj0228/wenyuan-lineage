import { useSyncExternalStore } from "react";

/**
 * 世界日序号：世界里时辰轮转一轮（96 刻 ≈ 3.2 分）即 +1，持久化于 localStorage，
 * 跨刷新续计、不会归零。游学题以「'wd-'+序号」为种——一世界日一题、轮转即换。
 *
 * 以 useSyncExternalStore 接 localStorage：SSR 与首次 hydration 均返回 0（稳定快照），
 * 故公告栏游学题于服务端 ×0/idle 与客户端首帧一致、不触 hydration mismatch；
 * hydration 完成后再读真实序号。tick 归零（一轮尽）时由 page 调 bumpWorldDay() 推进。
 */
const STORAGE_KEY = "zhuzi-worldday";
const SERVER_DEFAULT = 0;
/** 同标签页写入后通知订阅者（storage 事件只跨标签页、不回响本页） */
const EVENT = "zhuzi-worldday:change";

/**
 * 快照缓存：仅当 localStorage 原始串变化时才重新解析，保证返回引用稳定值——
 * 否则 useSyncExternalStore 每次渲染拿到新值会触发无限重渲。
 */
let cachedRaw: string | null = null;
let cachedDay = SERVER_DEFAULT;

function read(): number {
  if (typeof window === "undefined") return SERVER_DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedDay;
    cachedRaw = raw;
    const n = raw ? parseInt(raw, 10) : 0;
    cachedDay = Number.isFinite(n) && n >= 0 ? n : 0;
    return cachedDay;
  } catch {
    cachedDay = 0;
    return cachedDay;
  }
}

function persist(n: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    /* 配额满或被禁用，静默放弃持久化（内存态仍可用） */
  }
}

/** 写入后派发同页事件，令本页订阅者重新取快照 */
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

/** 当前世界日序号（0 起，时辰轮转一轮 +1、持久化跨刷新）。SSR/首帧恒为 0，hydration 后读真实值。 */
export function useWorldDay(): number {
  return useSyncExternalStore(subscribe, read, () => SERVER_DEFAULT);
}

/** 时辰轮转一轮时由 page 调用：序号 +1、持久化、通知订阅者刷新（游学题随之换题）。 */
export function bumpWorldDay(): void {
  const next = read() + 1;
  persist(next);
  notify(); // raw 已变，read() 将重新解析、返回新值触发刷新
}

/** 游学题日种串：'wd-'+序号，供 dailyQuestFor 确定性挑题。 */
export function worldDayKey(n: number): string {
  return `wd-${n}`;
}
