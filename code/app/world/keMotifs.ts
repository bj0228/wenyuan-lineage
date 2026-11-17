import { useSyncExternalStore } from "react";
import type { Motif, MotifAnchor } from "./motifs";

/**
 * 客自立之题 —— 母题总目里由你自己添的那几枚签。
 *
 * 策展的十二枚母题是「三轴皆有话可说」才立的（见 motifs.ts），每枚都挂着各世界的
 * 锚点原文。客自立的题起初没有锚点，也不强配：你想出的处境未必在哪部书里有现成的
 * 一句，而诸子与悟空照样能就它各说各的。故 `anchors` 可缺，评议席由你从诸世界
 * 请人，请谁来就开谁那一栏——这正是并栏版面能容下的一种用法。
 *
 * 要锚点时另有一路：卷首「参考锚点」一按，三轴各检一条最合的落进 `anchors`
 * （见 canonSource 的 `suggestAnchors`）。检得的是候选不是定论，可撤——
 * motifs.ts 开篇说「哪一句算这个母题，检索定不了」，那句话此处仍然作数：
 * 定的人还是你，检索只是把三轴的备选摆到你面前。
 *
 * 存 localStorage，与印章、批注、学派同处；无账号，刷新还在。
 */
export type KeMotif = {
  id: string;
  name: string;
  /** 这处境是什么——一句话，既给自己看，也作评议时模型的立足点 */
  hint: string;
  createdAt: number;
  /**
   * 此题的锚点。缺省即无锚（先前存下的客题皆无此字段，读出来是 undefined，
   * 照 `asMotif` 作空数组，故不必迁移旧数据）。
   */
  anchors?: MotifAnchor[];
};

const STORAGE_KEY = "zhuzi-ke-motifs";
/** SSR / 首次 hydration 用的稳定空快照——服务端无 window 读不得 localStorage */
const EMPTY: KeMotif[] = [];
const EVENT = "zhuzi-ke-motifs:change";

/** 快照缓存：原始串未变则返回同一引用，否则 useSyncExternalStore 会无限重渲 */
let cachedRaw: string | null = null;
let cached: KeMotif[] = EMPTY;

function read(): KeMotif[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) { cached = EMPTY; return cached; }
    const data = JSON.parse(raw) as KeMotif[];
    cached = Array.isArray(data) ? data.sort((a, b) => a.createdAt - b.createdAt) : EMPTY;
    return cached;
  } catch {
    cached = EMPTY;
    return cached;
  }
}

function persist(list: KeMotif[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* 配额满或被禁用，静默放弃持久化 */
  }
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/** 客题转为 `Motif`：形状与策展的十二枚一致，只是锚点或有或无。 */
export function asMotif(k: KeMotif): Motif {
  return { id: k.id, name: k.name, hint: k.hint, anchors: k.anchors ?? [] };
}

/**
 * 客题存取 hook。返回 [按立题先后排的客题, { add, remove, setAnchors }]。
 * 与 seals.ts 同一副做法：SSR 与首帧均取稳定空快照，不触发 hydration mismatch。
 */
export function useKeMotifs() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);

  function add(name: string, hint: string): KeMotif {
    const now = Date.now();
    const k: KeMotif = {
      id: `ke-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : now.toString(36)}`,
      name: name.trim().slice(0, 12),
      hint: hint.trim().slice(0, 60),
      createdAt: now,
    };
    persist([...read(), k]);
    notify();
    return k;
  }

  function remove(id: string) {
    persist(read().filter((k) => k.id !== id));
    notify();
  }

  /** 落锚：传空数组即撤锚，回到无锚那条路（评议席仍开，只是无句可凭）。 */
  function setAnchors(id: string, anchors: MotifAnchor[]) {
    persist(read().map((k) => (k.id === id ? { ...k, anchors } : k)));
    notify();
  }

  return [list, { add, remove, setAnchors }] as const;
}
