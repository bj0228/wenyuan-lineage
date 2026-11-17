import { useSyncExternalStore } from "react";

/** 一枚印章：游学题／经义小考所得，存于 localStorage，公告栏点开展开来由。 */
export type Seal = {
  id: string;
  /** 真实日期 YYYY-MM-DD（按日去重游学题用） */
  date: string;
  /** 得印时的世界时辰（如「申时」），作风味 */
  shichen: string;
  /** 来由：小考 / 游学 */
  source: "小考" | "游学";
  /** 标注：如 游学·论语·颜渊 / 小考·道德经·八章 */
  label: string;
  /** 题面稳定 id（passageId 或 passageId:题型），小考按题去重防刷 */
  qid?: string;
  /** 得印时的世界日序号（游学题按世界日去重；小考按 qid 去重、不记此字段） */
  worldDay?: number;
  /** epoch ms，排序用 */
  createdAt: number;
};

const STORAGE_KEY = "zhuzi-seals";
/** SSR / 首次 hydration 用的稳定空快照——服务端无 window 读不得 localStorage */
const EMPTY_SEALS: Seal[] = [];
/** 同标签页写入后通知订阅者（storage 事件只跨标签页、不回响本页） */
const SEALS_EVENT = "zhuzi-seals:change";

/**
 * 快照缓存：仅当 localStorage 原始串变化时才重新解析，保证返回引用稳定——
 * 否则 useSyncExternalStore 每次渲染拿到的都是新引用，会触发无限重渲。
 */
let cachedRaw: string | null = null;
let cachedSeals: Seal[] = EMPTY_SEALS;

function read(): Seal[] {
  if (typeof window === "undefined") return EMPTY_SEALS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSeals;
    cachedRaw = raw;
    if (!raw) { cachedSeals = EMPTY_SEALS; return cachedSeals; }
    const data = JSON.parse(raw) as Seal[];
    cachedSeals = Array.isArray(data) ? data.sort((a, b) => b.createdAt - a.createdAt) : EMPTY_SEALS;
    return cachedSeals;
  } catch {
    cachedSeals = EMPTY_SEALS;
    return cachedSeals;
  }
}

function persist(seals: Seal[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seals));
  } catch {
    /* 配额满或被禁用，静默放弃持久化（内存态仍可用） */
  }
}

/** 写入后派发同页事件，令本页订阅者重新取快照 */
function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SEALS_EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(SEALS_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SEALS_EVENT, callback);
  };
}

/**
 * 印章存取 hook：以 useSyncExternalStore 接 localStorage——
 * SSR 与首次 hydration 均返回稳定空快照（EMPTY_SEALS），故服务端 ×0 与客户端首帧 ×0 一致，
 * 不触发 hydration mismatch；hydration 完成后再读真实存档（×N），无 setState-in-effect。
 * 仅在显式 add 时写回并派发同页事件令订阅者刷新。
 * 返回 [seals（按 createdAt 降序）, { add }]。
 */
export function useSeals() {
  const seals = useSyncExternalStore(subscribe, read, () => EMPTY_SEALS);

  function add(seal: Seal) {
    const next = [seal, ...read()].sort((a, b) => b.createdAt - a.createdAt);
    persist(next);
    notify(); // raw 已变，read() 将重新解析、返回新引用触发刷新
  }

  return [seals, { add }] as const;
}

/**
 * 由来源/标注/时辰造一枚印章（id 与 createdAt 在此生成）。
 * 调用方在事件回调中调用（非 render 期），故 new Date()/crypto 安全。
 */
export function buildSeal(params: {
  date: string;
  shichen: string;
  source: Seal["source"];
  label: string;
  qid?: string;
  /** 游学题记此字段以按世界日去重；小考不传（按 qid 去重） */
  worldDay?: number;
}): Seal {
  const now = new Date();
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
    date: params.date,
    shichen: params.shichen,
    source: params.source,
    label: params.label,
    qid: params.qid,
    worldDay: params.worldDay,
    createdAt: now.getTime(),
  };
}
