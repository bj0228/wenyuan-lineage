/**
 * 四库全书分类层 —— 经史子集四部、四十余类、一千余部的目录轴，与选中书的正文按需取。
 *
 * 诸子那套语料（canon.ts / canonFull.ts）是打进 bundle 的，因为只有数百条、要给
 * 对谈作即时引典。四库不能照办：目录 1019 部、正文 2.42 亿字。故全部走 fetch——
 * 目录一次（约 200KB，进四库层时才取），正文一章一次（约 7KB）。bundle 不涨一字。
 *
 * 产出这些分片的是 `scripts/siku-extract.mjs`（在存有 689MB 导出的服务器上跑），
 * 落到 `public/siku/`。未被选中切正文的书在目录里仍然可见，只是没有 `bookId`——
 * 前端据此分「可读」与「仅著录」，这是四库的本分：先有目录，才谈得上读哪一部。
 */

import { asset } from "./assetPath";

/**
 * 稳定 URL 的目录曾被浏览器缓存为“77 部可读”的旧版。数据扩容后给目录请求显式换代，
 * 让已有用户无需清站点数据也能取得 1002 部可读的新目录。下一次改目录结构时再升此值。
 */
export const SIKU_DATA_VERSION = "20261106-fulltext-1002";

/** 目录条目。`bookId` 存在即表示这部书的正文已切片、可读。 */
export type SikuEntry = {
  group: string;
  category: string;
  title: string;
  author: string;
  dynasty: string;
  /**
   * 文脉图使用的稳定端点。原 77 部沿用既有 `bookId`；后来补切正文的书仍沿用
   * 先前存目阶段的 `目:书名`，避免一加正文就让既有关系边失去端点。
   */
  lineageId?: string;
  /** 可读书的分片目录名；无此字段者仅著录 */
  bookId?: string;
  /** 可读书的章数 */
  chapters?: number;
  /**
   * 成书之年（公元，前作负）。一个数是一年，两个数是一段（含两端）。
   *
   * **考得出才有**，考不出便无此字段——不是漏了，是判据不足。全目一千零一十九部里
   * 系年者二百八十五部，余者上屏时那一处留空，不印问号亦不印「未详」。编此表的
   * 条例与各条依据都在 `scripts/siku-year.mjs`。
   */
  year?: number | [number, number];
};

/** 书级元信息 + 章目录（`books/<id>/meta.json`）。 */
export type SikuMeta = {
  id: string;
  title: string;
  group: string;
  category: string;
  author: string;
  dynasty: string;
  chapters: { n: number; name: string; chars: number }[];
};

/** 单章正文（`books/<id>/<n>.json`）。 */
export type SikuChapter = { n: number; name: string; content: string };

/**
 * 代名送译时取哪个词条。
 *
 * 词表以中文原串作键，故单字的代名会与同形的别义相撞：女真之「金」与五行之「金」
 * （邹衍头顶那枚「当德」之徽，译作 Metal）是同一个裸键。数据里仍写「金」——那是
 * 目录的原字，不可改——只在英文下换取「金代」一条。
 *
 * 必须带 lang：中文下 `t` 是恒等，若一概换键，中文版就会印出「金代」二字，
 * 而中文版的字面一个也不许动。故中文下原样返回，只有英文走别名。
 * 凡上屏显示 `dynasty` 之处都该过这一道。
 */
export const eraKey = (d: string, lang: string) => (lang === "en" && d === "金" ? "金代" : d);

/**
 * 成书之年写成一行字。无年返回空串，由调用处决定是整行不印还是留白。
 *
 * 为何只印公元而不印年号：年号要印得对，得逐条知道那一年属哪个帝的哪个号，
 * 而年表所据的依据里年号本已写明（见 `scripts/siku-year.mjs` 每条之后那一句），
 * 上屏再印一道，一来挤，二来一旦与依据不合便是两处打架。故屏上只印公元。
 *
 * 英文下走词表：「前 91 年」作 "91 BC"，一段作 "104–91 BC"；跨公元前后的一段
 * （无此例，备而不用）两端各带各的纪元。中文下 `t` 恒等，印出来仍是中文原样。
 */
export function yearText(
  year: number | [number, number] | undefined,
  t: (zh: string, vars?: Record<string, string | number>) => string,
): string {
  if (year === undefined) return "";
  const one = (y: number) => (y < 0 ? t("前{year}年", { year: -y }) : t("{year}年", { year: y }));
  if (typeof year === "number") return one(year);
  const [a, b] = year;
  if (a === b) return one(a);
  // 同在公元前：只在末尾出一次纪元，作「前 104–91 年」／"104–91 BC"
  if (a < 0 && b < 0) return t("前{a}–{b}年", { a: -a, b: -b });
  if (a > 0 && b > 0) return t("{a}–{b}年", { a, b });
  return `${one(a)}–${one(b)}`;
}

/**
 * 四部之序依四库原次（经史子集），不按字母也不按部头大小。
 * `hint` 取《四库全书总目》之意，一句说清这一部收的是什么。
 */
export const SIKU_GROUPS: { id: string; name: string; hint: string }[] = [
  { id: "经", name: "经部", hint: "十三经及其传注，诸子立论之所本" },
  { id: "史", name: "史部", hint: "正史、编年、杂史，纪事之属" },
  { id: "子", name: "子部", hint: "诸子百家、兵农医术、释道杂说" },
  { id: "集", name: "集部", hint: "楚辞、别集、总集、词曲、诗文评" },
];

// —— 取数：目录一次取尽并缓存；正文按章取，各自缓存 ——

let catalogCache: SikuEntry[] | null = null;
let catalogPending: Promise<SikuEntry[]> | null = null;
const metaCache = new Map<string, SikuMeta>();
const chapterCache = new Map<string, SikuChapter>();

/** 取全目录（约 200KB）。并发调用共用同一个请求。 */
export function loadCatalog(): Promise<SikuEntry[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (catalogPending) return catalogPending;
  catalogPending = fetch(asset(`/siku/catalog.json?v=${SIKU_DATA_VERSION}`), { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error(`catalog ${r.status}`);
      return r.json() as Promise<SikuEntry[]>;
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

/** 取一部书的元信息与章目录。 */
export async function loadMeta(bookId: string): Promise<SikuMeta> {
  const hit = metaCache.get(bookId);
  if (hit) return hit;
  const r = await fetch(asset(`/siku/books/${bookId}/meta.json`));
  if (!r.ok) throw new Error(`meta ${r.status}`);
  const j = (await r.json()) as SikuMeta;
  metaCache.set(bookId, j);
  return j;
}

/** 取一章正文。 */
export async function loadChapter(bookId: string, n: number): Promise<SikuChapter> {
  const key = `${bookId}/${n}`;
  const hit = chapterCache.get(key);
  if (hit) return hit;
  const r = await fetch(asset(`/siku/books/${bookId}/${n}.json`));
  if (!r.ok) throw new Error(`chapter ${r.status}`);
  const j = (await r.json()) as SikuChapter;
  chapterCache.set(key, j);
  return j;
}

// —— 目录上的切分与检索 ——

/** 某部之下的类及其部数，按部数多寡排。 */
export function categoriesOf(catalog: SikuEntry[], group: string): { name: string; count: number; readable: number }[] {
  const m = new Map<string, { count: number; readable: number }>();
  for (const e of catalog) {
    if (e.group !== group) continue;
    const name = e.category || "未分类";
    const c = m.get(name) ?? { count: 0, readable: 0 };
    c.count += 1;
    if (e.bookId) c.readable += 1;
    m.set(name, c);
  }
  return [...m.entries()]
    .map(([name, c]) => ({ name, ...c }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh"));
}

/** 某类之下的书，可读者排在前。 */
export function booksOf(catalog: SikuEntry[], group: string, category: string): SikuEntry[] {
  return catalog
    .filter((e) => e.group === group && (e.category || "未分类") === category)
    .sort((a, b) => (a.bookId ? 0 : 1) - (b.bookId ? 0 : 1) || a.title.localeCompare(b.title, "zh"));
}

/**
 * 按书名／著者检索目录；可读者优先。限 60 条，够铺满一屏即可。
 *
 * `tr` 是词表（英文模式下传 `t`，中文模式下不传）：英文模式里读者打的是
 * "Zhuangzi"，架上写的是「庄子」，不把英文那一面也认一道，便什么也检不着。
 * 中文模式下取词是恒等函数，两面同形，检索结果与从前逐字相同。
 */
export function searchCatalog(
  catalog: SikuEntry[],
  query: string,
  limit = 60,
  tr: (s: string) => string = (s) => s,
): SikuEntry[] {
  const q = query.trim();
  if (!q) return [];
  const lq = q.toLowerCase();
  const has = (field: string) => field.includes(q) || tr(field).toLowerCase().includes(lq);
  const hits = catalog.filter(
    (e) => has(e.title) || has(e.author) || has(e.category) || has(e.dynasty),
  );
  hits.sort(
    (a, b) =>
      (a.bookId ? 0 : 1) - (b.bookId ? 0 : 1) ||
      (has(a.title) ? 0 : 1) - (has(b.title) ? 0 : 1) ||
      a.title.length - b.title.length,
  );
  return hits.slice(0, limit);
}

/** 按分片名取目录条目。自世界图上点回目进来时手上只有 `bookId`，须凭它反查著录。 */
export function entryOfBook(catalog: SikuEntry[], bookId: string): SikuEntry | null {
  return catalog.find((e) => e.bookId === bookId) ?? null;
}

/**
 * 按回次在章目里定位，返回章序 `n`；认不出返 null。
 *
 * 为何不把 `n` 直接写死在地图的数据里：**`n` 是分片的序号，不是回次**。
 * 导出里篇序本是乱的（《西游记》第二条即「第一百回」），抽取时按回次排过一遍才归正
 * （见 `siku_extract.py` 的 `chap_order`）；排法一改，`n` 便整体挪位。回次是书上写定的，
 * 分片序号是我们生成的——拿前者去对后者，重抽一次也不会错位。
 *
 * 用 `startsWith` 而不用 `includes`：「第一回」见于「第一百回」之中，
 * 用 `includes` 会把第一百回认作第一回。章名一律以回次起首，故前缀之法是稳的。
 *
 * 但前缀之法有一处会咬人：某章之名恰是另一章之名的前缀时，先撞上哪个全凭章目次序。
 * 《国语》章目按字面排过，「國 語 卷 第 十 一」在「國 語 卷 第 十」之前，于是问
 * 「卷第十」反得卷十一。故**先求全等，无全等者才退作前缀**——地图上传来的短回次
 * （「第二十七回」对「第二十七回 尸魔三戏唐三藏」）仍照旧认得，而带全名进来的
 * （如纪时记事给的 chapterName）从此一字不差地落在本章。
 */
export function chapterByLabel(meta: SikuMeta, label: string): number | null {
  const want = label.trim();
  if (!want) return null;
  const exact = meta.chapters.find((c) => c.name.trim() === want);
  if (exact) return exact.n;
  const hit = meta.chapters.find((c) => c.name.trim().startsWith(want));
  return hit ? hit.n : null;
}

// —— 选句批注与白话：片段的落库键 ——
//
// 正文右边那条空白本是留白，不是闲地：古人读书，批就写在那儿。故选中一句即可
// 在边上挂两样东西——自己的（或请诸子的）批注，与一道白话。
//
// 两样都落在既有的 `zhuzi-annotations` 里（见 annotations.ts），不另开存储。
// 键的分法：
//   `siku:{书}:{章}@{锚}`        批注本身（客自注或诸子注，交给 AnnotPanel）
//   `siku:{书}:{章}@{锚}#白话`   该片段的白话
//   `siku:{书}:{章}@{锚}#锚`     片段原文（只写一次）
// 之所以要末一条：锚是哈希，回头重开这一章时，光凭锚复不出原句，正文里也就无从
// 标出哪一句被批过。把原文一并存下，重开即能复原。

/** 一章正文的键前缀。 */
export function chapterKey(bookId: string, n: number): string {
  return `siku:${bookId}:${n}`;
}

/**
 * 片段锚：由片段本身算出的短键，同一句再选中仍得同一个锚，故批注能认回原处。
 *
 * 用 FNV-1a 而不用首几字：《史记》《通鉴》里同样开头的句子不在少数，截字会撞；
 * 而整句入键又太长。哈希之外再缀长度，撞的概率低到不必再防。
 */
export function snippetAnchor(snippet: string): string {
  const s = snippet.replace(/\s+/g, "");
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(36)}${s.length.toString(36)}`;
}

/** 某片段三类记录的键。 */
export function snippetKeys(chapKey: string, anchor: string) {
  const base = `${chapKey}@${anchor}`;
  return { annot: base, vernacular: `${base}#白话`, text: `${base}#锚` };
}

/** 目录统计，供四库层首屏显"几部几类，其中几部可读"。 */
export function catalogStats(catalog: SikuEntry[]): { total: number; readable: number; groups: Record<string, number> } {
  const groups: Record<string, number> = {};
  let readable = 0;
  for (const e of catalog) {
    groups[e.group] = (groups[e.group] ?? 0) + 1;
    if (e.bookId) readable += 1;
  }
  return { total: catalog.length, readable, groups };
}
