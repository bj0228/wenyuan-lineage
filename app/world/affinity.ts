import { useSyncExternalStore } from "react";

/**
 * 关系/好感度系统：用户↔诸子（userAff）与诸子↔诸子（pairAff），
 * 存于 localStorage，影响诸子口吻亲疏与驳难分寸。
 * 仿 inventory.ts 的 useSyncExternalStore + 模块级快照缓存 + EMPTY SSR 模式。
 */

export type AffinityState = {
  /** 用户对某子的好感度，-5..+5，初值 0 */
  userAff: Record<string, number>;
  /** 诸子两两好感度，key 为 "a|b"（a<b 字典序），初值按学派关系种子 */
  pairAff: Record<string, number>;
};

export type AffinityApi = {
  bumpUser: (scholarId: string, delta: number) => void;
  bumpPair: (a: string, b: string, delta: number) => void;
};

const STORAGE_KEY = "zhuzi-affinity";
const MIN = -5;
const MAX = 5;
const EMPTY: AffinityState = { userAff: {}, pairAff: {} };
const EVENT = "zhuzi-affinity:change";

/** 学派关系种子：同家相善、对立家相左。仅作初始值，之后由互动演进。 */
const SAME_SCHOOL: [string, string][] = [
  // 儒家三人
  ["kong", "meng"], ["kong", "xun"], ["meng", "xun"],
  // 道家三人（老子、庄子、文子）
  ["laozi", "zhuang"], ["laozi", "wenzi"], ["zhuang", "wenzi"],
  // 名家四人（邓析为先声）
  ["gongsun", "huishi"], ["dengxi", "gongsun"], ["dengxi", "huishi"], ["yinwen", "gongsun"],
  // 纵横家二人
  ["suqin", "zhangyi"],
  // 法家五人（管仲先声、商韩集大成、申慎各主术势）
  ["guanzhong", "shangyang"], ["guanzhong", "han"], ["shangyang", "han"],
  ["shenbuhai", "shendao"], ["shenbuhai", "han"], ["shendao", "han"],
  // 兵家七人
  ["sunwu", "sunbin"], ["rangju", "sunwu"], ["rangju", "wuqi"], ["wuqi", "sunbin"],
  ["lvwang", "rangju"], ["weiliao", "sunbin"], ["huangshigong", "weiliao"],
];
const OPPOSING: [string, string, number][] = [
  // 儒↔法：礼法之争
  ["kong", "han", -2], ["meng", "han", -2], ["xun", "han", -1], // 荀子近法家，故仅 -1
  // 墨非攻 ↔ 兵家好战
  ["mo", "sunwu", -1],
  // 墨节用 ↔ 法重刑赏
  ["mo", "han", -1],
  // 道不重言辩 ↔ 名家
  ["zhuang", "gongsun", -1], ["laozi", "huishi", -1],
  // 纵横重利势 ↔ 儒重义
  ["suqin", "meng", -1], ["zhangyi", "kong", -1],
];

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function seedPairAff(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const [a, b] of SAME_SCHOOL) m[pairKey(a, b)] = 2;
  for (const [a, b, v] of OPPOSING) m[pairKey(a, b)] = v;
  return m;
}

let cachedRaw: string | null = null;
let cached: AffinityState = EMPTY;

function read(): AffinityState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) { cached = { userAff: {}, pairAff: seedPairAff() }; return cached; }
    const data = JSON.parse(raw) as Partial<AffinityState>;
    cached = {
      userAff: data.userAff && typeof data.userAff === "object" ? { ...data.userAff } : {},
      pairAff: data.pairAff && typeof data.pairAff === "object" ? { ...data.pairAff } : seedPairAff(),
    };
    return cached;
  } catch {
    cached = EMPTY;
    return cached;
  }
}

function persist(s: AffinityState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* 静默放弃 */
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

function clamp(n: number): number {
  return Math.max(MIN, Math.min(MAX, n));
}

/** 用户↔某子好感度（未记录为 0） */
export function userAffOf(scholarId: string): number {
  return read().userAff[scholarId] ?? 0;
}

/** 两子间好感度（未记录则查种子，仍无则 0） */
export function pairAffOf(a: string, b: string): number {
  const s = read();
  return s.pairAff[pairKey(a, b)] ?? 0;
}

/** 描述好感度的亲疏档位（注入 LLM 系统提示用） */
export function affinityDesc(n: number): string {
  if (n >= 3) return "相善，可推心置腹";
  if (n >= 1) return "初熟，言可稍亲";
  if (n === 0) return "初识，礼数如常";
  if (n >= -2) return "微有龃龉，言辞持重";
  return "相左，多有辩难";
}

/**
 * 好感度 hook：SSR 与首帧返回稳定空快照，hydration 后读真实存档。
 * 返回 [state, { bumpUser, bumpPair }]。
 */
export function useAffinity() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);

  function bumpUser(scholarId: string, delta: number) {
    const s = read();
    const next = { ...s, userAff: { ...s.userAff, [scholarId]: clamp((s.userAff[scholarId] ?? 0) + delta) } };
    persist(next);
    notify();
  }

  function bumpPair(a: string, b: string, delta: number) {
    const s = read();
    const k = pairKey(a, b);
    const next = { ...s, pairAff: { ...s.pairAff, [k]: clamp((s.pairAff[k] ?? 0) + delta) } };
    persist(next);
    notify();
  }

  return [state, { bumpUser, bumpPair }] as [AffinityState, AffinityApi];
}
