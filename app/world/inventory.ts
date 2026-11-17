import { useSyncExternalStore } from "react";

/**
 * 道具/铜钱：市井购得之物（束脩/醴酒/竹简…）与铜钱通货，存于 localStorage。
 * 仿 seals.ts/user.ts 的 useSyncExternalStore + 模块级快照缓存 + EMPTY SSR 快照模式，
 * 服务端与首帧 hydration 均返回稳定空快照、不触 hydration mismatch。
 */

export type ItemId = "shuxiu" | "jiu" | "zhu" | "cha" | "geng" | "buyu";

export type ItemDef = {
  id: ItemId;
  name: string;
  glyph: string;
  price: number;
  desc: string;
};

/** 道具目录：束脩为求学之贽（孔子「自行束脩以上，吾未尝无诲焉」），余皆市井常物 */
export const ITEMS: ItemDef[] = [
  { id: "shuxiu", name: "束脩", glyph: "🥩", price: 8, desc: "干肉一束，求学之贽。孔子曰：自行束脩以上，吾未尝无诲焉。" },
  { id: "jiu", name: "醴酒", glyph: "🍶", price: 6, desc: "甘酒薄醴，酒以行礼。" },
  { id: "zhu", name: "竹简", glyph: "📜", price: 12, desc: "空白简牍，可录所闻。" },
  { id: "cha", name: "茗茶", glyph: "🍵", price: 5, desc: "煎汤涤烦，解渴清神。" },
  { id: "geng", name: "藜羹", glyph: "🍲", price: 4, desc: "藜藿之羹，贫者之食。" },
  { id: "buyu", name: "鲜鱼", glyph: "🐟", price: 7, desc: "临渊羡鱼，不如退而结网。" },
];

export const ITEM_MAP: Record<ItemId, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, ItemDef>;

export type InventoryState = { coins: number; items: Record<string, number> };

export type InventoryApi = {
  /** 购入：铜钱足则扣钱+入货，返回是否成功 */
  buy: (def: ItemDef) => boolean;
  /** 奉贽消费 1 件：成功返回该道具定义，无存货返回 null */
  offer: (id: ItemId) => ItemDef | null;
  /** 增减铜钱（答题兑钱/招贤馆日给；负值则扣至 0） */
  addCoins: (n: number) => void;
  /** 是否持有 n 件（默认 1） */
  has: (id: ItemId, n?: number) => boolean;
};

const STORAGE_KEY = "zhuzi-inventory";
/** 开局盘缠：游学者入世即有 100 文铜钱 */
const INITIAL_COINS = 100;
/** SSR / 首次 hydration 用的稳定空快照——服务端无 window 读不得 localStorage */
const EMPTY: InventoryState = { coins: 0, items: {} };
/** 同标签页写入后通知订阅者（storage 事件只跨标签页、不回响本页） */
const INV_EVENT = "zhuzi-inventory:change";

/**
 * 快照缓存：仅当 localStorage 原始串变化时才重新解析，保证返回引用稳定——
 * 否则 useSyncExternalStore 每次渲染拿到的都是新引用，会触发无限重渲。
 */
let cachedRaw: string | null = null;
let cachedInv: InventoryState = EMPTY;

function read(): InventoryState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedInv;
    cachedRaw = raw;
    if (!raw) { cachedInv = { coins: INITIAL_COINS, items: {} }; return cachedInv; }
    const data = JSON.parse(raw) as Partial<InventoryState>;
    const coins = typeof data.coins === "number" && data.coins >= 0 ? Math.floor(data.coins) : INITIAL_COINS;
    const items: Record<string, number> = {};
    if (data.items && typeof data.items === "object") {
      for (const [k, v] of Object.entries(data.items)) {
        if (typeof v === "number" && v > 0) items[k] = Math.floor(v);
      }
    }
    cachedInv = { coins, items };
    return cachedInv;
  } catch {
    cachedInv = EMPTY;
    return cachedInv;
  }
}

function persist(s: InventoryState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* 配额满或被禁用，静默放弃持久化（内存态仍可用） */
  }
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INV_EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(INV_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(INV_EVENT, callback);
  };
}

/**
 * 道具/铜钱存取 hook：useSyncExternalStore 接 localStorage——
 * SSR 与首帧均返回稳定空快照（EMPTY），hydration 后读真实存档。
 * 返回 [{ coins, items }, { buy, offer, addCoins, has }]。
 * buy/offer/addCoins 在事件回调中调用（非 render 期），故直接读+写+通知。
 */
export function useInventory() {
  const inv = useSyncExternalStore(subscribe, read, () => EMPTY);

  function snapshot(): InventoryState {
    const r = read();
    return { coins: r.coins, items: { ...r.items } };
  }

  function buy(def: ItemDef): boolean {
    const s = snapshot();
    if (s.coins < def.price) return false;
    s.coins -= def.price;
    s.items[def.id] = (s.items[def.id] ?? 0) + 1;
    persist(s);
    notify();
    return true;
  }

  /** 奉贽时消费 1 件；成功返回该道具定义，失败（无存货）返回 null */
  function offer(id: ItemId): ItemDef | null {
    const s = snapshot();
    if ((s.items[id] ?? 0) <= 0) return null;
    s.items[id] -= 1;
    if (s.items[id] <= 0) delete s.items[id];
    persist(s);
    notify();
    return ITEM_MAP[id] ?? null;
  }

  function addCoins(n: number): void {
    const s = snapshot();
    s.coins = Math.max(0, s.coins + n);
    persist(s);
    notify();
  }

  function has(id: ItemId, n = 1): boolean {
    return (read().items[id] ?? 0) >= n;
  }

  return [inv, { buy, offer, addCoins, has }] as [InventoryState, InventoryApi];
}
