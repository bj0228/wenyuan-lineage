/**
 * 四库里的检索：人、书、卷、文四路。
 *
 * 从前这一层只检目录（书名／著者／类／朝代，见 siku.ts 的 `searchCatalog`）——
 * 检得的是「架上有这部书」，不是「这句话在哪一卷」。读者要找「天下皆知美之为美」，
 * 或要知道「鼓盆」出自何处，目录是答不出来的。故在目录之外另开三路：
 *
 *   其人：诸子与著者。名、字、学派一并认，带出其所著所录的书与可检的正文条数。
 *   其卷：二万九千余卷的卷名篇目，一千零二部可读之书全覆盖。回目本就是中国书的索引，
 *         「桃园结义」四字落在《三国演义》第一回，这一路便答得出。
 *   其文：正文片段。限已切的可检语料（见下），检得即可点开那一部那一卷。
 *
 * 正文共一亿八千余万字，整副全文索引不能送进浏览器。因此 `quotable-all/search.json`
 * 从每部书均匀抽取少量发现片段，覆盖全部可读书；命中后仍回到原书原章读完整正文。
 * 这一层明确称“抽样检索”，不把抽样冒充全文索引。
 *
 * 繁简：语料各依原书排印，十部作繁体。检索时两边各折一道（见 hanVariants.ts），
 * 「恒」检得「恆」。折表逐字对逐字，折后与原文等长，故匹配位置可直接回指原文，
 * 取前后文作摘要、标朱都不会错位。
 *
 * 载入分两程，重的那一程只在真要检正文时才走：
 *   一程：全库证据总目 + 合卷章目；
 *   二程：一份全库抽样正文（约数兆），按需载入。
 */

import { loadMeta, entryOfBook, type SikuEntry, type SikuMeta } from "./siku";
import { scholars } from "./characters";
import { fold } from "./hanVariants";
import { asset } from "./assetPath";

// —— 繁简折字 ——
//
// `fold` 已移至 hanVariants.ts（折字表旁），典籍检索那一路同用。此处仍旧转出，
// 本文件的旧调用方（及引 `fold` 自此者）不必改。
export { fold };

/**
 * 检索词：按空白切开，各词皆须命中（AND）。
 *
 * 「仁 义」两字分检，是为了「仁」与「义」同在一段而不必紧邻——古书里这两字
 * 常隔着几句相望。单字亦许检，古文一字一义，检「孝」是正当的。
 */
export function queryTerms(q: string): string[] {
  return fold(q)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
}

// —— 可引语料的总目 ——

type QRow = {
  bookId: string;
  title: string;
  author?: string;
  authorIds?: string[];
  items: number;
  worldId?: string;
};

type AllQRow = QRow & { lineageId?: string };
type TocIndex = { books: { bookId: string; chapters: SikuMeta["chapters"] }[] };
type SearchCorpus = { books: { bookId: string; items: QFile["items"] }[] };

/**
 * 《西游记》的可引语料按人物切成十余片（xy-wukong 等，见 xiyou_dialogue.py），
 * 分片名不是四库的书名，直接检出来点不开。故一律归到《西游记》那一部之下——
 * 片里的 `n` 本就是该回的章序（与 books/xiyouji 的分片序号同一套），归并后
 * 照样点得开那一回。归并后只剩人物对白，不含叙述文，这一点界面上说明。
 */
function sikuBookIdOf(bookId: string): string {
  return bookId.startsWith("xy-") ? "xiyouji" : bookId;
}

/** 一部可检之书：目录上的著录 + 可引片段数。 */
export type SearchBook = {
  entry: SikuEntry;
  /** 该书在可引语料里的分片名（《西游记》有十余个） */
  shards: string[];
  /** 可引片段数 */
  items: number;
  /** 著者诸子之 id（可引语料总目所记） */
  authorIds: string[];
};

export type SearchIndex = {
  /** 可检正文之书，按片段多寡排 */
  books: SearchBook[];
  /** 卷目：书 × 卷名（fname 为折简的卷名，省得每次检索重折） */
  chapters: { entry: SikuEntry; n: number; name: string; fname: string }[];
  /** 可读之书的部数，界面上说明正文检索覆盖到几部时要用 */
  readableCount: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  // 线上应用挂在 `/zhuzi-world-v1` 下；与正文读取同样经 asset() 补部署前缀。
  // 本地 basePath 为空时仍是原来的 `/siku/...`。
  const r = await fetch(asset(url));
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
}

/** 有旧数据回退时仍要限并发，不能把请求一齐撒出去。 */
async function mapLimit<T, R>(xs: T[], limit: number, f: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(xs.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, xs.length) }, async () => {
    for (;;) {
      const k = i++;
      if (k >= xs.length) return;
      out[k] = await f(xs[k]);
    }
  });
  await Promise.all(workers);
  return out;
}

let indexCache: SearchIndex | null = null;
let indexInflight: Promise<SearchIndex> | null = null;

/**
 * 一程：全库证据总目 + 合卷章目。章目随正文抽取一同重建，避免为 1002 部书发出
 * 1002 个 meta 请求；旧部署没有合卷索引时才退回逐书读取。
 */
export function loadSearchIndex(catalog: SikuEntry[]): Promise<SearchIndex> {
  if (indexCache) return Promise.resolve(indexCache);
  if (indexInflight) return indexInflight;
  indexInflight = (async () => {
    const readable = catalog.filter((e) => e.bookId);
    const [rows, allRows, toc] = await Promise.all([
      fetchJson<QRow[]>("/siku/quotable/index.json").catch(() => [] as QRow[]),
      fetchJson<AllQRow[]>("/siku/quotable-all/index.json").catch(() => [] as AllQRow[]),
      fetchJson<TocIndex>("/siku/toc-index.json").catch(() => ({ books: [] } as TocIndex)),
    ]);

    // 全库抽样先铺底，旧的诸子精编语料再补人物归属与更准确的片段计数。
    const byBook = new Map<string, SearchBook>();
    for (const r of allRows) {
      const entry = entryOfBook(catalog, r.bookId);
      if (!entry) continue;
      byBook.set(r.bookId, { entry, shards: [], items: r.items, authorIds: [] });
    }
    for (const r of rows) {
      const id = sikuBookIdOf(r.bookId);
      const entry = entryOfBook(catalog, id);
      if (!entry) continue; // 目录上无此书，检出来也点不开
      const b = byBook.get(id) ?? { entry, shards: [], items: 0, authorIds: [] };
      b.shards.push(r.bookId);
      b.items = Math.max(b.items, r.items);
      for (const a of r.authorIds ?? []) if (!b.authorIds.includes(a)) b.authorIds.push(a);
      byBook.set(id, b);
    }
    const books = [...byBook.values()].sort((a, b) => b.items - a.items);

    const chapters: SearchIndex["chapters"] = [];
    const tocByBook = new Map(toc.books.map((b) => [b.bookId, b.chapters]));
    if (!toc.books.length) {
      const metas = await mapLimit(readable, 8, (e) => loadMeta(e.bookId!).catch(() => null));
      metas.forEach((m, k) => {
        if (!m) return;
        for (const c of m.chapters) chapters.push({ entry: readable[k], n: c.n, name: c.name, fname: fold(c.name) });
      });
    } else {
      for (const entry of readable) {
        for (const c of tocByBook.get(entry.bookId!) ?? []) {
          chapters.push({ entry, n: c.n, name: c.name, fname: fold(c.name) });
        }
      }
    }

    indexCache = { books, chapters, readableCount: readable.length };
    return indexCache;
  })();
  return indexInflight;
}

// —— 二程：正文片段 ——

type QFile = { bookId: string; items: { n: number; chapter: string; text: string }[] };

/** 一条片段：正文、所在卷、所属书，并一份折简的正文备检。 */
export type Passage = { book: SearchBook; n: number; chapter: string; text: string; ftext: string };

let passCache: Passage[] | null = null;
let passInflight: Promise<Passage[]> | null = null;

/**
 * 取各书的可引片段，折简备检。`onStep` 报已取几部，界面上好说一句「正在取第几部」——
 * 三点八兆要等上几秒，不出声读者会以为检索坏了。
 */
export function loadPassages(index: SearchIndex, onStep?: (done: number, total: number) => void): Promise<Passage[]> {
  if (passCache) return Promise.resolve(passCache);
  if (passInflight) return passInflight;
  passInflight = (async () => {
    const corpus = await fetchJson<SearchCorpus>("/siku/quotable-all/search.json").catch(() => null);
    if (corpus) {
      const byId = new Map(index.books.map((b) => [b.entry.bookId!, b]));
      const out: Passage[] = [];
      let done = 0;
      for (const file of corpus.books) {
        const book = byId.get(file.bookId);
        if (book) {
          for (const it of file.items) {
            const text = it.text.trim();
            if (text) out.push({ book, n: it.n, chapter: it.chapter, text, ftext: fold(text) });
          }
        }
        done += 1;
        if (done % 50 === 0 || done === corpus.books.length) onStep?.(done, corpus.books.length);
      }
      passCache = out;
      return out;
    }

    // 旧部署回退：仍读取原先的诸子可引分片。
    const shards = index.books.flatMap((b) => b.shards.map((s) => ({ shard: s, book: b })));
    let done = 0;
    const parts = await mapLimit(shards, 6, async ({ shard, book }) => {
      const out: Passage[] = [];
      try {
        const f = await fetchJson<QFile>(`/siku/quotable/${shard}.json`);
        for (const it of f.items) {
          const text = it.text.trim();
          if (!text) continue;
          out.push({ book, n: it.n, chapter: it.chapter, text, ftext: fold(text) });
        }
      } catch {
        /* 一个分片取不到不该带翻整副检索 */
      }
      done += 1;
      onStep?.(done, shards.length);
      return out;
    });
    passCache = parts.flat();
    return passCache;
  })();
  return passInflight;
}

// —— 检索 ——

/** 摘要的分段：`hit` 为真者标朱。 */
export type Part = { s: string; hit: boolean };

/**
 * 摘要：以首个命中为中心取一窗，窗内各词皆标朱。
 *
 * 片段本多在二三百字内，短者整条出；长者截一窗，两端缀「……」。截窗按折后的位置算，
 * 折表逐字对逐字，故位置在原文上同样有效，截出来不会偏。
 */
export function excerpt(text: string, ftext: string, terms: string[], window = 118): Part[] {
  let at = -1;
  for (const t of terms) {
    const k = ftext.indexOf(t);
    if (k >= 0 && (at < 0 || k < at)) at = k;
  }
  let from = 0;
  let to = text.length;
  if (text.length > window) {
    from = Math.max(0, (at < 0 ? 0 : at) - Math.floor(window / 3));
    to = Math.min(text.length, from + window);
    from = Math.max(0, Math.min(from, text.length - window));
  }
  const slice = text.slice(from, to);
  const fslice = ftext.slice(from, to);

  // 标朱：各词的命中处一并收起，重叠者并为一段
  const spans: [number, number][] = [];
  for (const t of terms) {
    if (!t) continue;
    let k = fslice.indexOf(t);
    while (k >= 0 && spans.length < 40) {
      spans.push([k, k + t.length]);
      k = fslice.indexOf(t, k + t.length);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const sp of spans) {
    const last = merged[merged.length - 1];
    if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]);
    else merged.push([...sp]);
  }

  const parts: Part[] = [];
  let p = 0;
  const lead = from > 0 ? "……" : "";
  for (const [a, b] of merged) {
    if (a > p) parts.push({ s: slice.slice(p, a), hit: false });
    parts.push({ s: slice.slice(a, b), hit: true });
    p = b;
  }
  if (p < slice.length) parts.push({ s: slice.slice(p), hit: false });
  if (lead) parts.unshift({ s: lead, hit: false });
  if (to < text.length) parts.push({ s: "……", hit: false });
  return parts;
}

export type TextHit = {
  entry: SikuEntry;
  n: number;
  chapter: string;
  text: string;
  parts: Part[];
};

/**
 * 其文：片段里各词皆中者。
 *
 * 一部书至多列六条——《管子》一千六百余条，不限则一部书便塞满一屏，
 * 「这句话还见于别处吗」就看不见了。短者在前：引得动的句子多是短句，
 * 长段落多半是把整章抄了下来。
 */
export function searchPassages(passages: Passage[], query: string, limit = 40): { hits: TextHit[]; total: number } {
  const ts = queryTerms(query);
  if (!ts.length) return { hits: [], total: 0 };
  const found = passages.filter((p) => ts.every((t) => p.ftext.includes(t)));
  found.sort((a, b) => a.text.length - b.text.length);
  const perBook = new Map<string, number>();
  const hits: TextHit[] = [];
  for (const p of found) {
    const id = p.book.entry.bookId!;
    const k = perBook.get(id) ?? 0;
    if (k >= 6) continue;
    perBook.set(id, k + 1);
    hits.push({ entry: p.book.entry, n: p.n, chapter: p.chapter, text: p.text, parts: excerpt(p.text, p.ftext, ts) });
    if (hits.length >= limit) break;
  }
  return { hits, total: found.length };
}

export type ChapterHit = { entry: SikuEntry; n: number; name: string; parts: Part[] };

/** 其卷：卷名篇目里各词皆中者。可读之书全覆盖，故「桃园结义」这类回目检得出。 */
export function searchChapters(index: SearchIndex, query: string, limit = 24): { hits: ChapterHit[]; total: number } {
  const ts = queryTerms(query);
  if (!ts.length) return { hits: [], total: 0 };
  const found = index.chapters.filter((c) => ts.every((t) => c.fname.includes(t)));
  const hits = found
    .slice(0, limit)
    .map((c) => ({ entry: c.entry, n: c.n, name: c.name, parts: excerpt(c.name, c.fname, ts, 48) }));
  return { hits, total: found.length };
}

export type PersonHit = {
  /** 常称（诸子取其号，馀者取著者本名） */
  name: string;
  /** 字、本名、别称——认得出哪一个都算检着 */
  alias: string[];
  /** 学派或所属之部类 */
  note: string;
  /** 其所著所录（目录上的著录） */
  entries: SikuEntry[];
  /** 可检正文条数 */
  items: number;
  /** 诸子之 id，有则可知此人在百家图谱里亦有一席 */
  scholarId?: string;
};

/**
 * 其人：诸子与著者。
 *
 * 为何单开这一路，而不只靠目录里的著者字段：目录记的是本名（《庄子》著者作「庄周」、
 * 《道德经》作「李耳」），读者打的多是号（庄子、老子）。诸子名录里有名有字，
 * 可引语料的总目里又记着「这一部是哪位诸子的」（authorIds），两头一接，
 * 打「老子」便能带出署着「李耳」的那一部。
 *
 * 一人之书从三路收齐：语料总目所系、目录著者含其名者、书名含其名者（《道德经（老子）》
 * 一类，书名里本就带着人）。
 */
export function searchPeople(
  catalog: SikuEntry[],
  index: SearchIndex | null,
  query: string,
  limit = 6,
  tr: (s: string) => string = (s) => s,
): PersonHit[] {
  const q = fold(query.trim());
  if (!q) return [];
  /** 中文一面与英文一面各认一道；中文模式下取词是恒等函数，两面同形。 */
  const hit = (s: string) => !!s && (fold(s).includes(q) || fold(tr(s)).includes(q));
  const out: PersonHit[] = [];
  const taken = new Set<string>();

  const booksOfNames = (names: string[], ids: string[]): SikuEntry[] => {
    const seen = new Set<SikuEntry>();
    for (const b of index?.books ?? []) {
      if (b.authorIds.some((a) => ids.includes(a))) seen.add(b.entry);
    }
    for (const e of catalog) {
      if (names.some((n) => n && (e.author.includes(n) || e.title.includes(n)))) seen.add(e);
    }
    return [...seen].sort((a, b) => (a.bookId ? 0 : 1) - (b.bookId ? 0 : 1) || a.title.localeCompare(b.title, "zh"));
  };
  const itemsOf = (entries: SikuEntry[]) =>
    (index?.books ?? []).filter((b) => entries.includes(b.entry)).reduce((s, b) => s + b.items, 0);

  // 一、诸子名录：名、字、学派皆认。字多单字（庄子字周），单字之字须打全，
  //     不然检「子」便把诸子尽数带出来了。
  for (const s of scholars) {
    const hitName = hit(s.name);
    const hitAlias =
      s.courtesy !== "未详" && (s.courtesy.length > 1 ? fold(s.courtesy).includes(q) : fold(s.courtesy) === q);
    const hitSchool = q.length > 1 && hit(s.school);
    if (!hitName && !hitAlias && !hitSchool) continue;
    const ids = [s.id];
    const alias = s.courtesy !== "未详" ? [s.courtesy] : [];
    // 语料总目所系之书，其著者本名亦作此人之别称（李耳、庄周之类）
    for (const b of index?.books ?? []) {
      if (b.authorIds.includes(s.id) && b.entry.author && !alias.includes(b.entry.author)) alias.push(b.entry.author);
    }
    const entries = booksOfNames([s.name, ...alias], ids);
    out.push({ name: s.name, alias, note: s.school, entries, items: itemsOf(entries), scholarId: s.id });
    taken.add(s.name);
    for (const a of alias) taken.add(a);
    if (out.length >= limit) return out;
  }

  // 二、目录里的著者。一名之下或有数部，合为一卡，不叫同一人在结果里出现十遍。
  const byAuthor = new Map<string, SikuEntry[]>();
  for (const e of catalog) {
    if (!hit(e.author)) continue;
    if (taken.has(e.author)) continue;
    const a = byAuthor.get(e.author) ?? [];
    a.push(e);
    byAuthor.set(e.author, a);
  }
  for (const [name, entries] of [...byAuthor.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (out.length >= limit) break;
    const groups = [...new Set(entries.map((e) => e.group))];
    out.push({
      name,
      alias: [],
      note: groups.join("、"),
      entries: entries.sort((a, b) => (a.bookId ? 0 : 1) - (b.bookId ? 0 : 1)),
      items: itemsOf(entries),
    });
  }
  return out;
}
