/**
 * 新手导览的「看过没有」——一章一册，五册各记各的。
 *
 * 存的是一串 chapter id（逗号分隔）。旧版存的是 "1"/"0"，只当过「战国那一程」看过与否；
 * 读见 "1" 便当作只看过 zhanguo，老读者不会被拉着重走战国，却也不缺后补的四册。
 *
 * 存 localStorage，不落库（见 README：客户端状态一律 localStorage）。
 */

import { useSyncExternalStore } from "react";

export type TourChapter = "siku" | "zhanguo" | "xiyou" | "westlit" | "crossworld";

export const TOUR_CHAPTERS: TourChapter[] = ["siku", "zhanguo", "xiyou", "westlit", "crossworld"];

const STORAGE_KEY = "zhuzi-tour-seen";
const SERVER_DEFAULT = true;
const EVENT = "zhuzi-tour:change";

/** 旧值 "1" 只能判定「战国看过」，其余四册仍是新的 */
const LEGACY_SEEN: TourChapter[] = ["zhanguo"];

let cachedRaw: string | null | undefined = undefined;
let cachedSeen: Set<TourChapter> = new Set(LEGACY_SEEN);
/** 服务端与首轮水合看到的那一份：全部算看过 */
const SERVER_SNAPSHOT: Set<TourChapter> = new Set(TOUR_CHAPTERS);

function parse(raw: string | null): Set<TourChapter> {
  if (raw === null || raw === "0" || raw === "") return new Set();
  if (raw === "1") return new Set(LEGACY_SEEN);
  const out = new Set<TourChapter>();
  for (const part of raw.split(",")) {
    const id = part.trim() as TourChapter;
    if (TOUR_CHAPTERS.includes(id)) out.add(id);
  }
  return out;
}

function snapshot(): Set<TourChapter> {
  if (typeof window === "undefined") return new Set(LEGACY_SEEN);
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSeen = parse(raw);
  }
  return cachedSeen;
}

function persist(next: Set<TourChapter>) {
  const raw = TOUR_CHAPTERS.filter((c) => next.has(c)).join(",");
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* 私密窗口之类写不进去：本程照看，下次重来 */
  }
  cachedRaw = raw;
  cachedSeen = next;
}

function notify() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** 某册看过没有。服务端与本程首渲一律算「看过」——免得水合前后闪一屏导览 */
export function readSeen(ch: TourChapter): boolean {
  if (typeof window === "undefined") return SERVER_DEFAULT;
  return snapshot().has(ch);
}

/** 五册里还有没有没看过的（用来决定「册目」那一条要不要标新） */
export function anyUnseen(): boolean {
  if (typeof window === "undefined") return false;
  const seen = snapshot();
  return TOUR_CHAPTERS.some((c) => !seen.has(c));
}

export function markSeen(ch: TourChapter): void {
  const next = new Set(snapshot());
  next.add(ch);
  persist(next);
  notify();
}

/** 略过全册：五册一并记作已看 */
export function markAllSeen(): void {
  persist(new Set(TOUR_CHAPTERS));
  notify();
}

/** 重看：不带参数即四册全清（连同旧值），带了便只清那一册 */
export function resetTour(ch?: TourChapter): void {
  if (!ch) {
    persist(new Set());
    notify();
    return;
  }
  const next = new Set(snapshot());
  next.delete(ch);
  persist(next);
  notify();
}

/** 订阅用：返回整份已看清单（只在此处整份换新，值没变便不换，免得白重渲） */
export function useTourSeen(): Set<TourChapter> {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER_SNAPSHOT);
}
