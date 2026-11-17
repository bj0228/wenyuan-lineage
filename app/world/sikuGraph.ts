/**
 * 读 `public/siku/graph.json`：二十六部全文长出来的图谱。
 *
 * 这张图不是手写的。`lineage.ts` 的 BOOKS（36 条）与 IDEAS（73 条）、
 * `sikuLineage.ts` 的 SIKU_EDGES 都是人定的——准，但与书里实际写了什么无关，
 * 加一部书、改一次抽取，表也不会跟着动。此处的节点与边全由 `scripts/siku_graph.py`
 * 从语料算出：概念是真正显著的词，书—概念的权是这部书里这个词的 tf-idf 分量，
 * 书—书的边是概念向量的余弦。
 *
 * 每条书—概念的边还挂着两三条段落 id（`siku:<bookId>:<n>:<i>`，与
 * `canonSource.toPassages` 同源），所以图上任一结点都点得回原文——图谱与文本
 * 不再是两张各说各话的皮。
 *
 * 载入之前一切查询都返回空，与 `sikuTerms` / `hasVectors` 同一个路子：
 * 同步那一遍先画出能画的，异步到了再覆盖，不拿 await 卡住首屏。
 */

import { asset } from "./assetPath";

export type GraphBook = {
  id: string;
  title: string;
  author: string;
  group: string;
  category: string;
  dynasty: string;
  segs: number;
  authorIds: string[];
};

export type GraphConcept = {
  /** 词 */
  t: string;
  /** 见于几段 */
  df: number;
  /** log(段数 / (1 + df)) */
  idf: number;
  /** 字数 */
  n: number;
  /**
   * 通行于几部书。离线那边按此分层选节点：≥6 部的算「通义」（仁、道、法、礼、
   * 义、孝、兵、名——诸书皆讲），其余算「宗旨」（兼爱、非攻、白马非马、循名
   * 责实、捭阖、六虱——一书独有）。每部书两类各有配额，故二者不互相挤。
   * 渲染时可据此分开画：通义是骨架，宗旨是各家的面目。
   */
  b: number;
  /**
   * 1 = 人工校订过的（lineage 的 IDEAS 或选本的标注词），0 = 从文本新发现的。
   * 两类都该上图，但可以分开画：已验证的是骨架，新发现的是待审的枝叶。
   */
  s: 0 | 1;
};

/** [bookId, 词, 权, 这部书里有几段提到, 出处段落 id] */
type BookConceptEdge = [string, string, number, number, string[]];
/** [bookId, 人名, 提及段数, 出处段落 id] */
type BookPersonEdge = [string, string, number, string[]];
/** [词, 词, 互信息（bit）] */
type ConceptEdge = [string, string, number];
/** [bookId, bookId, 余弦] */
type BookEdge = [string, string, number];

type GraphFile = {
  segs: number;
  books: GraphBook[];
  authors: { id: string; books: string[] }[];
  concepts: GraphConcept[];
  bookConcept: BookConceptEdge[];
  /**
   * 概念的全书分布，与 `concepts` 等长，每项是 [书序, 段数]，书序即 `books` 的下标。
   * 与 bookConcept 不是一回事：那是边（只连每部书的三十个要目），这是分布（这个
   * 词散在哪几部、各几段）。「仁」通 21 部而边只有 4 条，问「哪些书提到」得看这里。
   */
  conceptBooks: [number, number][][];
  bookPerson: BookPersonEdge[];
  conceptConcept: ConceptEdge[];
  bookBook: BookEdge[];
};

/** 一条书—概念的边，已拆成好用的形状 */
export type ConceptLink = {
  bookId: string;
  term: string;
  /** 这部书里这个词的分量，按书归一后在 0–1 之间 */
  weight: number;
  /**
   * 这部书里有几段提到。与 `loci.length` 不是一回事——出处只留两三条（离线那边
   * 的 PROVENANCE），段数是全数：《管子》讲「道」是 335 段，出处仍只挂 3 条。
   */
  segs: number;
  /** 出处段落 id，可直接喂给按 id 取段的那一路 */
  loci: string[];
};

/**
 * 一条书—人的边：这部书提到了谁，提了几段。
 *
 * 这是诸子互引的网络——《孟子》驳杨朱墨翟、《庄子》辩惠施、《韩非子》述商鞅——
 * 也就是 `sikuLineage.ts` 那张手写的 传/承/采/驳 边表所要表达的事，只是此处
 * 每一条都有原文为证。自提不算（《孟子》满篇「孟子曰」是体例，不是引述）。
 */
export type PersonLink = {
  bookId: string;
  person: string;
  /** 提及的段数 */
  segs: number;
  loci: string[];
};

/** 一个相邻的概念或相近的书 */
export type Neighbor = { id: string; weight: number };

/**
 * 一个词在某部书里占的段数。出自全分布，不是边——故「哪些书提到」答得全。
 * `loci` 只有恰好也是该书要目时才有（边上挂的那两三条出处），余者为空。
 */
export type ConceptSpot = { bookId: string; title: string; segs: number; loci: string[] };

type Index = {
  file: GraphFile;
  books: Map<string, GraphBook>;
  concepts: Map<string, GraphConcept>;
  byBook: Map<string, ConceptLink[]>;
  byConcept: Map<string, ConceptLink[]>;
  byBookPerson: Map<string, PersonLink[]>;
  byPerson: Map<string, PersonLink[]>;
  conceptNb: Map<string, Neighbor[]>;
  bookNb: Map<string, Neighbor[]>;
  spread: Map<string, ConceptSpot[]>;
  byAuthor: Map<string, string[]>;
};

let idx: Index | null = null;
let inflight: Promise<Index | null> | null = null;

function build(file: GraphFile): Index {
  // 标注元组，否则 .map 推出来是 (string | GraphBook)[][]，Map 的构造签名要
  // readonly [K, V][]，strict 下过不去。
  const books = new Map(file.books.map((b): [string, GraphBook] => [b.id, b]));
  const concepts = new Map(file.concepts.map((c): [string, GraphConcept] => [c.t, c]));

  const byBook = new Map<string, ConceptLink[]>();
  const byConcept = new Map<string, ConceptLink[]>();
  for (const [bookId, term, weight, segs, loci] of file.bookConcept) {
    const link: ConceptLink = { bookId, term, weight, segs, loci };
    const a = byBook.get(bookId);
    if (a) a.push(link);
    else byBook.set(bookId, [link]);
    const b = byConcept.get(term);
    if (b) b.push(link);
    else byConcept.set(term, [link]);
  }
  // 离线那边已按权排好，但书—概念是按书排的；按概念取时要再排一次，
  // 才答得出「哪部书最讲兼爱」。
  for (const list of byConcept.values()) list.sort((x, y) => y.weight - x.weight);

  const byBookPerson = new Map<string, PersonLink[]>();
  const byPerson = new Map<string, PersonLink[]>();
  for (const [bookId, person, segs, loci] of file.bookPerson) {
    const link: PersonLink = { bookId, person, segs, loci };
    const a = byBookPerson.get(bookId);
    if (a) a.push(link);
    else byBookPerson.set(bookId, [link]);
    const b = byPerson.get(person);
    if (b) b.push(link);
    else byPerson.set(person, [link]);
  }
  for (const list of byBookPerson.values()) list.sort((x, y) => y.segs - x.segs);
  for (const list of byPerson.values()) list.sort((x, y) => y.segs - x.segs);

  const conceptNb = new Map<string, Neighbor[]>();
  const push = (m: Map<string, Neighbor[]>, k: string, v: Neighbor) => {
    const a = m.get(k);
    if (a) a.push(v);
    else m.set(k, [v]);
  };
  // 边是无向的，只存了一份；两头都要挂上
  for (const [a, b, w] of file.conceptConcept) {
    push(conceptNb, a, { id: b, weight: w });
    push(conceptNb, b, { id: a, weight: w });
  }
  for (const list of conceptNb.values()) list.sort((x, y) => y.weight - x.weight);

  const bookNb = new Map<string, Neighbor[]>();
  for (const [a, b, w] of file.bookBook) {
    push(bookNb, a, { id: b, weight: w });
    push(bookNb, b, { id: a, weight: w });
  }
  for (const list of bookNb.values()) list.sort((x, y) => y.weight - x.weight);

  const byAuthor = new Map(file.authors.map((a): [string, string[]] => [a.id, a.books]));

  // 全书分布：与 concepts 等长的那张表展开成「词 → 诸书各几段」。出处顺带从边上
  // 挂过来——边只连要目，故多数格子无出处，那不是缺漏：分布答的是「几段」，
  // 出处是边的附赠。
  const spread = new Map<string, ConceptSpot[]>();
  file.concepts.forEach((c, i) => {
    const dist = file.conceptBooks[i] ?? [];
    const lociOf = new Map((byConcept.get(c.t) ?? []).map((l): [string, string[]] => [l.bookId, l.loci]));
    spread.set(
      c.t,
      dist.map(([bi, segs]) => {
        const b = file.books[bi];
        return { bookId: b?.id ?? "", title: b?.title ?? "", segs, loci: lociOf.get(b?.id ?? "") ?? [] };
      }),
    );
  });

  return { file, books, concepts, byBook, byConcept, byBookPerson, byPerson, conceptNb, bookNb, spread, byAuthor };
}

/** 载入图谱。只取一次，SSR 下直接作罢。取不到也不重试——图谱缺了页面照旧。 */
export function loadGraph(): Promise<Index | null> {
  if (idx) return Promise.resolve(idx);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (inflight) return inflight;
  inflight = fetch(asset("/siku/graph.json"))
    .then(async (r) => (r.ok ? ((await r.json()) as GraphFile) : null))
    .catch(() => null)
    .then((f) => {
      idx = f
        ? build(f)
        : build({
            segs: 0,
            books: [],
            authors: [],
            concepts: [],
            bookConcept: [],
            conceptBooks: [],
            bookPerson: [],
            conceptConcept: [],
            bookBook: [],
          });
      inflight = null;
      return idx;
    });
  return inflight;
}

/** 图谱到没到。没到时下面各项都返回空，调用处照同步那一遍先画。 */
export function hasGraph(): boolean {
  return idx !== null && idx.file.books.length > 0;
}

/** 这张图是从多少段文本里长出来的 */
export function graphSegs(): number {
  return idx?.file.segs ?? 0;
}

/** 全部书节点 */
export function graphBooks(): GraphBook[] {
  return idx?.file.books ?? [];
}

/** 全部概念节点，按离线算定的次序 */
export function graphConcepts(): GraphConcept[] {
  return idx?.file.concepts ?? [];
}

export function graphBook(bookId: string): GraphBook | null {
  return idx?.books.get(bookId) ?? null;
}

export function graphConcept(term: string): GraphConcept | null {
  return idx?.concepts.get(term) ?? null;
}

/** 这部书讲哪些概念，按分量降序 */
export function conceptsOfBook(bookId: string, limit = 0): ConceptLink[] {
  const list = idx?.byBook.get(bookId) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/** 哪些书讲这个概念，按分量降序——「兼爱」头一个必是《墨子》 */
export function booksOfConcept(term: string, limit = 0): ConceptLink[] {
  const list = idx?.byConcept.get(term) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/**
 * 这个词散在哪几部书、各几段，按段数降序。
 *
 * 与 `booksOfConcept` 之别正是「分布」与「边」之别：那边只连每部书的三十个要目，
 * 答「哪部书最讲兼爱」；这边是全分布，答「哪些书提到仁」——前者给 4 部，后者 23 部。
 */
export function conceptSpread(term: string, limit = 0): ConceptSpot[] {
  const list = idx?.spread.get(term) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/** 这部书提到了谁，按提及段数降序 */export function personsOfBook(bookId: string, limit = 0): PersonLink[] {
  const list = idx?.byBookPerson.get(bookId) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/** 谁被哪些书提到，按提及段数降序——「杨朱」头一个该是《孟子》 */
export function booksMentioning(person: string, limit = 0): PersonLink[] {
  const list = idx?.byPerson.get(person) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/** 图上出现过的人名 */
export function graphPersons(): string[] {
  return idx ? [...idx.byPerson.keys()] : [];
}

/** 与这个概念相邻的概念，按互信息降序 */
export function relatedConcepts(term: string, limit = 0): Neighbor[] {
  const list = idx?.conceptNb.get(term) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/** 与这部书相近的书，按余弦降序 */
export function similarBooks(bookId: string, limit = 0): Neighbor[] {
  const list = idx?.bookNb.get(bookId) ?? [];
  return limit > 0 ? list.slice(0, limit) : list;
}

/** 这部书讲这个概念的出处段落 id。拿去按 id 取段，即是原文。 */
export function conceptLoci(bookId: string, term: string): string[] {
  const list = idx?.byBook.get(bookId);
  if (!list) return [];
  for (const l of list) if (l.term === term) return l.loci;
  return [];
}

/** 这位的书。authorIds 与 `Passage.owner` / lineage 的 scholar id 同一套。 */
export function booksOfAuthor(scholarId: string): string[] {
  return idx?.byAuthor.get(scholarId) ?? [];
}
