import { useSyncExternalStore } from "react";

/** 用户（游学者）：字徽固定「客」，名可自改、存 localStorage，顶栏头像按钮显之。 */

const STORAGE_KEY = "zhuzi-user";
/** 默认名；SSR / 首次 hydration 用的稳定快照——服务端无 window 读不得 localStorage。
 *  导出是给显示处用的：唯有名字还是这个默认值时才可取英文（见顶栏头像与档案面板）；
 *  客自取之名不翻——取名「孔子」的人不该在英文模式下变成 Confucius。 */
export const USER_DEFAULT_NAME = "游学者";
const DEFAULT_NAME = USER_DEFAULT_NAME;
const EMPTY_USER: { name: string } = { name: DEFAULT_NAME };
/** 同标签页写入后通知订阅者（storage 事件只跨标签页、不回响本页） */
const USER_EVENT = "zhuzi-user:change";

/** 用户头像字徽（诸子皆以字徽示人，用户亦然，唯用「客」字别之） */
export const USER_GLYPH = "客";

/**
 * 快照缓存：仅当 localStorage 原始串变化时才重新解析，保证返回引用稳定——
 * 否则 useSyncExternalStore 每次渲染拿到的都是新引用，会触发无限重渲。
 */
let cachedRaw: string | null = null;
let cachedUser: { name: string } = EMPTY_USER;

function read(): { name: string } {
  if (typeof window === "undefined") return EMPTY_USER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedUser;
    cachedRaw = raw;
    if (!raw) { cachedUser = EMPTY_USER; return cachedUser; }
    const data = JSON.parse(raw);
    cachedUser = data && typeof data.name === "string" && data.name.trim()
      ? { name: data.name.trim().slice(0, 12) }
      : EMPTY_USER;
    return cachedUser;
  } catch {
    cachedUser = EMPTY_USER;
    return cachedUser;
  }
}

function persist(u: { name: string }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {
    /* 配额满或被禁用，静默放弃持久化（内存态仍可用） */
  }
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(USER_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(USER_EVENT, callback);
  };
}

/**
 * 用户名存取 hook：以 useSyncExternalStore 接 localStorage——
 * SSR 与首次 hydration 均返回稳定快照（EMPTY_USER），故服务端「游学者」与客户端首帧一致，
 * 不触发 hydration mismatch；hydration 完成后再读真实存档。返回 [{ name }, { setName }]。
 */
export function useUser() {
  const user = useSyncExternalStore(subscribe, read, () => EMPTY_USER);

  function setName(name: string) {
    const n = name.trim().slice(0, 12) || DEFAULT_NAME;
    persist({ name: n });
    notify();
  }

  return [user, { setName }] as const;
}
