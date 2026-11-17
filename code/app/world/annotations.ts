import { useSyncExternalStore } from "react";
import type { Retrieved } from "./canon";

/** 典籍批注：客自注或请诸子批注，存于 localStorage，镜像 seals.ts 范式。 */
export type Annotation = {
  id: string;
  /** 批注对象：canonFull 的 verseId（书-章-句） */
  verseId: string;
  /** 批注者：留空=客自注，有值=诸子 id */
  scholar?: string;
  text: string;
  /** 中译。西方一席用英文评议，译文附在原话之下；中文发言无此字段。 */
  trans?: string;
  /** 回答实际绑定的原文证据；旧批注没有此字段，照常显示。 */
  citations?: Retrieved[];
  /**
   * 一致性校验档位：发言落库在前、校验是另一次请求，故校毕由 `patchVerdict`
   * 补写于此。旧批注与校验未应者无此字段，界面不显徽记。判档之准随人格之属
   * 而分（见 worker 的三档提示词），此处只存档位与一句理由，不存 kind。
   */
  verdict?: "合规" | "存疑" | "矛盾";
  /** 校验理由一句，悬停与档位含义一并显示 */
  verdictNote?: string;
  /** 下判的模型 id（异源校验官，见 worker 的 QWEN_VERIFY_MODEL）。旧批注无此字段。 */
  verdictModel?: string;
  /** 该判是否属异源外证。false＝异源不可用、退回本家自审 */
  verdictCross?: boolean;
  createdAt: number;
};

const STORAGE_KEY = "zhuzi-annotations";
const EMPTY: Annotation[] = [];
const EVENT = "zhuzi-annotations:change";

let cachedRaw: string | null = null;
let cached: Annotation[] = EMPTY;

function read(): Annotation[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) { cached = EMPTY; return cached; }
    const data = JSON.parse(raw) as Annotation[];
    cached = Array.isArray(data) ? data.sort((a, b) => b.createdAt - a.createdAt) : EMPTY;
    return cached;
  } catch {
    cached = EMPTY;
    return cached;
  }
}

function persist(list: Annotation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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

export type AnnotationApi = {
  /** 落库一条批注，返回其 id——校验徽记要按 id 回填（add 在前、verify 在后）。 */
  add: (verseId: string, text: string, scholar?: string, trans?: string, citations?: Retrieved[]) => string | undefined;
  remove: (id: string) => void;
  /** 校验完成（或确认无果）后补写判定；verdict 传空即只清校验中状态。
   *  `meta` 记下判之模型与是否异源外证，一并落库，重开页面徽记仍能自证其所出。 */
  patchVerdict: (
    id: string,
    verdict?: "合规" | "存疑" | "矛盾",
    note?: string,
    meta?: { model?: string; crossModel?: boolean; text?: string; clearTrans?: boolean; citations?: Retrieved[] },
  ) => void;
};

/** 全量批注（按 createdAt 降序）。 */
export function useAnnotations(): [Annotation[], AnnotationApi] {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  function add(verseId: string, text: string, scholar?: string, trans?: string, citations?: Retrieved[]): string | undefined {
    const t = text.trim();
    if (!t) return;
    const now = new Date();
    const ann: Annotation = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${now.getTime()}-${Math.random().toString(36).slice(2)}`,
      verseId,
      scholar,
      text: t,
      trans: trans?.trim() || undefined,
      citations: citations?.length ? citations : undefined,
      createdAt: now.getTime(),
    };
    persist([ann, ...read()]);
    notify();
    return ann.id;
  }
  function remove(id: string) {
    persist(read().filter((a) => a.id !== id));
    notify();
  }
  function patchVerdict(
    id: string,
    verdict?: "合规" | "存疑" | "矛盾",
    note?: string,
    meta?: { model?: string; crossModel?: boolean; text?: string; clearTrans?: boolean; citations?: Retrieved[] },
  ) {
    const hit = read().find((a) => a.id === id);
    if (!hit) return;
    persist(
      read().map((a) =>
        a.id === id
          ? {
              ...a,
              text: meta?.text?.trim() || a.text,
              trans: meta?.clearTrans ? undefined : a.trans,
              verdict: verdict ?? undefined,
              verdictNote: verdict ? (note ?? "").trim() || undefined : undefined,
              verdictModel: verdict ? meta?.model : undefined,
              verdictCross: verdict ? meta?.crossModel : undefined,
              citations: meta?.citations ?? a.citations,
            }
          : a,
      ),
    );
    notify();
  }
  return [list, { add, remove, patchVerdict }];
}

/** 按 verseId 取其批注列表（派生 hook，供句读卡片用）。 */
export function useVerseAnnotations(verseId: string): [Annotation[], AnnotationApi] {
  const [all, api] = useAnnotations();
  const mine = all.filter((a) => a.verseId === verseId);
  return [mine, api];
}

/** 脉络/典籍图谱节点批注：以 `node:{nodeId}` 为 key 复用同一存储，不另开。
 *  verseId 形如 "node:bk-lunyu"、"node:id-ren"、"node:kong"。 */
export function useNodeAnnotations(nodeId: string): [Annotation[], AnnotationApi] {
  return useVerseAnnotations(`node:${nodeId}`);
}
