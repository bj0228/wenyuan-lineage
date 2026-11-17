/**
 * 全文那一池的「词」与「权」：离线 `scripts/siku_terms.py` 的产出，运行期按需取。
 *
 * ## 这两样东西补的是什么
 *
 * 二十六部全文切成的一万余段，`keywords` 原是空数组——当初有意留空，因为没有可靠
 * 的词：文言用现代词典切只会切出一地碎片。于是全文这一池只能靠原文子串命中，凡含
 * 此词者一概得同一个分，名次实按 id 排（见 `canon.ts` 密度分那段注）。选本那七百
 * 余条有人工标注词，一命中六分，全文一分也沾不上。
 *
 * 离线那一道给的就是这两样：
 *
 * - **词**（`terms/<bookId>.json`）：每段六个关键词，灌进 `Passage.keywords`，
 *   全文便与选本同样享那六分的精确命中分。
 * - **权**（`terms/_dict.json`）：每词的 df 与 IDF。「君子」见于六百二十五段，
 *   「非攻」只见于九段，两者不该同重。IDF 须通池统计，故在抽取时算定，不逐题现算。
 *
 * ## 为何权重只用在密度分上
 *
 * 密度分上限一分（`canon.ts`），只够拆同分之局，拆不动真有高下的两条。IDF 加在
 * 这一分之内，便不会动到选本那边已然可用的名次——那七百余条的排法是反复校过的，
 * 不该为全文这一池的改动而变。词的轻重在此只作「同分时谁更切题」之断。
 *
 * ## 载入之时
 *
 * 词随书来（`canonSource.fetchBook` 同时取 quotable 与 terms 两份），故段落一成形
 * 便已带词。权是一份九十余 K 的总表，与书并行取；取到之前 `termWeight` 一律返回 1，
 * 即「不加不减」——首屏那一趟同步检索照旧即时出结果，与向量表那边同一个路数。
 */
import { asset } from "./assetPath";

/** `_dict.json`：`terms` 的值是 `[df, idf*100]`，整数存，省体积。 */
type TermDict = { segs: number; terms: Record<string, [number, number]> };

/**
 * IDF 的中位档，用作归一化的分母。
 *
 * 一万零九百余段里见于约一百二十段的词，IDF 约 4.5，权重正好一倍。比它罕见的加重，
 * 比它常见的减轻，上下各掐住——不设限的话「齐物」（df=1，IDF 8.6）会把同段里
 * 其余的词全压没。
 */
const IDF_MID = 450;
const W_MIN = 0.5;
const W_MAX = 1.8;

let dict: TermDict | null = null;
let inflight: Promise<TermDict | null> | null = null;

/**
 * 取词权总表。取过便留着，取不到也不反复重试（记一笔空表）。
 *
 * 服务端渲染时直接返回 null：这是运行期的补充索引，不该让首屏等它。
 */
export function loadTermDict(): Promise<TermDict | null> {
  if (dict) return Promise.resolve(dict);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (inflight) return inflight;
  inflight = fetch(asset("/siku/terms/_dict.json"))
    .then(async (r) => (r.ok ? ((await r.json()) as TermDict) : null))
    .catch(() => null)
    .then((d) => {
      // 取不到便记一张空表：此后 termWeight 一律返回 1，不再发请求
      dict = d ?? { segs: 0, terms: {} };
      inflight = null;
      return dict;
    });
  return inflight;
}

/** 词表是否已在手。总表未到时检索照常走，只是不加权。 */
export function hasTermDict(): boolean {
  return dict !== null && dict.segs > 0;
}

/**
 * 一词的轻重。总表未到、或此词不在表内，一律返回 1（不加不减）。
 *
 * 不在表内的不减权是要紧的：选本那边的标注词、西游那一池的词都不在这张表里
 * （它只统二十六部诸子），一减便把那两处的名次也搅了。
 */
export function termWeight(term: string): number {
  if (!dict) return 1;
  const e = dict.terms[term];
  if (!e) return 1;
  const w = e[1] / IDF_MID;
  return w < W_MIN ? W_MIN : w > W_MAX ? W_MAX : w;
}

/** 一词见于几段。图谱那边按此定节点的分量；不在表内作 0。 */
export function termDf(term: string): number {
  return dict?.terms[term]?.[0] ?? 0;
}

/** 词表全词，按显著度降序（离线那边已排好）。图谱取前若干个作概念节点。 */
export function allTerms(): string[] {
  return dict ? Object.keys(dict.terms) : [];
}

// —————————————————————— 每段关键词 ——————————————————————

/** `terms/<bookId>.json`：`kw` 与分片 `items` 同序等长，非正文段落留空数组。 */
type BookKeywords = { bookId: string; kw: string[][] };

const kwCache = new Map<string, string[][]>();
const kwInflight = new Map<string, Promise<string[][]>>();

/**
 * 取一部书的每段关键词。
 *
 * 返回的数组与分片 `items` **同序等长**，第 i 条对第 i 段——那个 i 是过滤前在原
 * 文件里的下标，与段落 id `siku:<bookId>:<n>:<i>` 里的 i 是同一个。取不到返回空
 * 数组，`toPassages` 那边便照旧留空 keywords，检索退回纯子串命中。
 */
export function loadBookKeywords(bookId: string): Promise<string[][]> {
  const cached = kwCache.get(bookId);
  if (cached) return Promise.resolve(cached);
  if (typeof window === "undefined") return Promise.resolve([]);
  const pending = kwInflight.get(bookId);
  if (pending) return pending;
  const p = fetch(asset(`/siku/terms/${bookId}.json`))
    .then(async (r) => {
      if (!r.ok) return [];
      const d = (await r.json()) as BookKeywords;
      return Array.isArray(d?.kw) ? d.kw : [];
    })
    .catch(() => [] as string[][])
    .then((kw) => {
      kwCache.set(bookId, kw);
      kwInflight.delete(bookId);
      return kw;
    });
  kwInflight.set(bookId, p);
  return p;
}
