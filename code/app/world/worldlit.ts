/**
 * 世界文学书架 —— 与四库（world/siku.ts）并立的另一条轴。
 *
 * 同一套分片形状（books/<id>/meta.json + <n>.json），不同的目录：每书一条，
 * `editions` 列中英两卷——中译卷（名译或 AI 译）与英文原书卷（Gutenberg／
 * wikisource 公版底本）。阅读层据此给读者一面「中译 / 原书」的切换。
 *
 * 分片由 `scripts/waiguo-slice.mjs`（EPUB 名译）、`scripts/waiguo-en-slice.mjs`
 * （Gutenberg 英文）、`scripts/waiguo-tianyan-slice.mjs`（wikisource 讲座）、
 * `scripts/waiguo-translate.mjs`（AI 中译）产出，`scripts/waiguo-catalog.mjs`
 * 汇成 catalog.json。全部按需 fetch，bundle 不进一字。
 */

import { asset } from "./assetPath";

/** 目录条目：一书之下有中英两版。 */
export type WorldLitEntry = {
  id: string;
  name: string;
  author: string;
  translator: string;
  era: string;
  origin: string;
  editions: { lang: "zh" | "en"; id: string; chapters: number; classical?: boolean; partial?: boolean }[];
};

/** 书级元信息 + 章目录（与 SikuMeta 同构，少 group/category）。 */
export type WorldLitMeta = {
  id: string;
  name: string;
  author: string;
  translator?: string;
  era?: string;
  origin?: string;
  note?: string;
  originalTitle?: string;
  /** Exact edition provenance; imported public-domain texts must remain auditable. */
  source?: {
    platform: string;
    ebookId?: string;
    url: string;
    licenseUrl?: string;
    rights?: string;
  };
  /** 剧本卷：诗行短，阅读面换窄栏台本排法（见 globals.css 的 .wl-play）。 */
  layout?: "play";
  /** `title` 是卷题/章题，卷次（name）之外的那一行：如奥德赛「第一卷」之下的
   *  「众神议事——密涅瓦出访伊萨卡——忒勒马科斯向求婚人发难」。底本自带者才有。 */
  chapters: { n: number; name: string; title?: string }[];
};

/** 单章正文（与 SikuChapter 同构）。 */
export type WorldLitChapter = { n: number; name: string; title?: string; content: string };

let catalogCache: WorldLitEntry[] | null = null;
let catalogPending: Promise<WorldLitEntry[]> | null = null;
export const WORLDLIT_DATA_VERSION = "20261108-zh-chapter";
const metaCache = new Map<string, WorldLitMeta>();
const chapterCache = new Map<string, WorldLitChapter>();

export function loadCatalog(): Promise<WorldLitEntry[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (catalogPending) return catalogPending;
  catalogPending = fetch(asset(`/worldlit/catalog-${WORLDLIT_DATA_VERSION}.json`), { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`catalog ${r.status}`);
      return r.json() as Promise<WorldLitEntry[]>;
    })
    .then((j) => {
      catalogCache = j;
      return j;
    })
    .finally(() => {
      catalogPending = null;
    });
  return catalogPending;
}

export async function loadMeta(bookId: string): Promise<WorldLitMeta> {
  const hit = metaCache.get(bookId);
  if (hit) return hit;
  const r = await fetch(asset(`/worldlit/books/${bookId}/meta.json`));
  if (!r.ok) throw new Error(`meta ${r.status}`);
  const j = (await r.json()) as WorldLitMeta;
  metaCache.set(bookId, j);
  return j;
}

export async function loadChapter(bookId: string, n: number): Promise<WorldLitChapter> {
  const key = `${bookId}/${n}`;
  const hit = chapterCache.get(key);
  if (hit) return hit;
  const r = await fetch(asset(`/worldlit/books/${bookId}/${n}.json`));
  if (!r.ok) throw new Error(`chapter ${r.status}`);
  const j = (await r.json()) as WorldLitChapter;
  chapterCache.set(key, j);
  return j;
}

/** 章键（世界文学的边批用）：`wl:{卷}:{章}`。 */
export function chapterKey(bookId: string, n: number): string {
  return `wl:${bookId}:${n}`;
}

/** 片段锚与键——与四库同法（见 siku.ts 的 snippetAnchor），前缀换成 wl。 */
export function snippetAnchor(snippet: string): string {
  const s = snippet.replace(/\s+/g, "");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(36)}${s.length.toString(36)}`;
}

export function snippetKeys(chapKey: string, anchor: string) {
  const base = `${chapKey}@${anchor}`;
  return { annot: base, vernacular: `${base}#白话`, text: `${base}#锚` };
}
