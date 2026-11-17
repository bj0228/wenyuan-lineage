import type { Scholar } from "./characters";
import { GEO_PLACES } from "./culturalGeography";
import { asset } from "./assetPath";

/**
 * 人物回答的知识边界。
 *
 * historical：把人物放回其时代，题目与证据都按当时可知范围解释；
 * comparative：允许用户把后世事件/母题作为外部材料交给人物，但人物不能假装生前已知。
 */
export type KnowledgeMode = "historical" | "comparative";

export type BookBoundaryMeta = {
  bookId: string;
  lineageId?: string;
  title: string;
  dynasty: string;
};

export type KnowledgeBoundary = {
  mode: KnowledgeMode;
  birthYear?: number;
  deathYear?: number;
  regions: string[];
  regionalNote?: string;
};

type GeoIndex = {
  places?: {
    name: string;
    nameEn?: string;
    people?: { id: string; name: string }[];
    books?: { id: string; title: string }[];
  }[];
};

/** 只补核心人工人格；自动扩展的 1,415 人已自带生卒年。 */
const LIFESPAN_BY_NAME: Record<string, [number, number]> = {
  孔子: [-551, -479], 孟子: [-372, -289], 荀子: [-313, -238], 墨子: [-468, -376],
  庄子: [-369, -286], 韩非: [-280, -233], 商鞅: [-390, -338], 孙武: [-545, -470],
  孙膑: [-380, -316], 曾子: [-505, -435], 子思: [-483, -402], 管仲: [-723, -645],
  吴起: [-440, -381], 申不害: [-385, -337], 慎到: [-395, -315], 邓析: [-545, -501],
  董仲舒: [-179, -104], 王充: [27, 97], 刘勰: [465, 522], 钟嵘: [468, 518],
  陶渊明: [365, 427], 李白: [701, 762], 杜甫: [712, 770], 司马光: [1019, 1086],
  苏轼: [1037, 1101], 朱熹: [1130, 1200], 王阳明: [1472, 1529], 顾炎武: [1613, 1682],
  王夫之: [1619, 1692], 蒲松龄: [1640, 1715], 曹雪芹: [1715, 1763],
  章学诚: [1738, 1801], 王国维: [1877, 1927],
};

/**
 * 典籍只有朝代而无精确成书年时，用朝代最早年作保守闸门：只有整部书明确晚于人物
 * 去世，才拒绝进入证据池；朝代重叠或年代未详时不作过度推断。
 */
const DYNASTY_START: Record<string, number> = {
  先秦: -3000, 汉: -206, 魏: 220, 蜀汉: 221, 晋: 265,
  北魏: 386, 南朝宋: 420, 南朝齐: 479, 南朝梁: 502, 北齐: 550,
  隋: 581, 唐: 618, 五代: 907, 宋: 960, 金: 1115, 元: 1271,
  明: 1368, 清: 1644, 近今: 1912,
};

let geoPromise: Promise<GeoIndex> | null = null;

function loadGeoIndex(): Promise<GeoIndex> {
  if (typeof window === "undefined") return Promise.resolve({});
  if (!geoPromise) {
    geoPromise = fetch(asset("/data/geocultural-index.json"))
      .then((r) => (r.ok ? (r.json() as Promise<GeoIndex>) : {}))
      .catch(() => ({}));
  }
  return geoPromise;
}

function plainTitle(s: string): string {
  return s.replace(/[《》]/g, "").replace(/（[^）]*）\s*$/, "").trim();
}

function lifespanOf(persona: Scholar): { birthYear?: number; deathYear?: number } {
  const fallback = LIFESPAN_BY_NAME[persona.name];
  return {
    birthYear: persona.birthYear ?? fallback?.[0],
    deathYear: persona.deathYear ?? fallback?.[1],
  };
}

/** 明确晚于人物生命终点的书不能作为该人物已经掌握的证据。 */
export function isBookTemporallyReachable(persona: Scholar, book: BookBoundaryMeta | undefined): boolean {
  if (!book) return true;
  const { deathYear, birthYear } = lifespanOf(persona);
  const cutoff = deathYear ?? (birthYear != null ? birthYear + 80 : undefined);
  const bookStart = DYNASTY_START[book.dynasty];
  if (cutoff == null || bookStart == null) return true;
  return bookStart <= cutoff;
}

type GeoFacts = {
  personaPlaces: Set<string>;
  bookPlaces: Map<string, Set<string>>;
  bookTitlesAtPlace: Map<string, Set<string>>;
};

async function geoFacts(persona: Scholar): Promise<GeoFacts> {
  const personaPlaces = new Set<string>();
  const bookPlaces = new Map<string, Set<string>>();
  const bookTitlesAtPlace = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, key: string, place: string) => {
    const s = m.get(key) ?? new Set<string>();
    s.add(place);
    m.set(key, s);
  };

  // 策展地点为核心人物提供可解释的文化语境。
  for (const place of GEO_PLACES) {
    for (const record of place.records) {
      if (record.people.includes(persona.name)) personaPlaces.add(`${place.name}（${place.region}）`);
      for (const title of record.books) add(bookTitlesAtPlace, plainTitle(title), `${place.name}（${place.region}）`);
    }
  }

  // 扩展人物与 1,019 部书使用同一份地图索引；地点仅作关联信号，不冒充传播证据。
  const geo = await loadGeoIndex();
  for (const place of geo.places ?? []) {
    const placeName = place.name;
    if ((place.people ?? []).some((p) => p.id === persona.id || p.name === persona.name)) personaPlaces.add(placeName);
    for (const book of place.books ?? []) {
      add(bookPlaces, book.id, placeName);
      add(bookTitlesAtPlace, plainTitle(book.title), placeName);
    }
  }
  return { personaPlaces, bookPlaces, bookTitlesAtPlace };
}

function overlap(a: Set<string>, b: Set<string> | undefined): number {
  if (!b) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n += 1;
  return n;
}

/**
 * 地域只改变候选来源书的优先次序。返回值越高表示人物与该书在地图上共享的地点越多；
 * 0 仍可引用，因地图没有覆盖到不等于历史上不可能接触。
 */
export async function rankBooksByRegionalAffinity<T extends { edgeFrom: string; meta?: BookBoundaryMeta }>(
  persona: Scholar,
  books: T[],
): Promise<T[]> {
  if (books.length < 2) return books;
  const facts = await geoFacts(persona);
  const scored = books.map((item, order) => {
    const byId = facts.bookPlaces.get(item.meta?.bookId ?? item.edgeFrom) ?? facts.bookPlaces.get(item.edgeFrom);
    const byTitle = item.meta ? facts.bookTitlesAtPlace.get(plainTitle(item.meta.title)) : undefined;
    return { item, order, score: overlap(facts.personaPlaces, byId) + overlap(facts.personaPlaces, byTitle) };
  });
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((x) => x.item);
}

export async function buildKnowledgeBoundary(persona: Scholar, mode: KnowledgeMode): Promise<KnowledgeBoundary> {
  const life = lifespanOf(persona);
  const facts = await geoFacts(persona);
  const regions = [...facts.personaPlaces].slice(0, 4);
  return {
    mode,
    ...life,
    regions,
    regionalNote: regions.length
      ? `地图记录将${persona.name}与${regions.join("、")}相关联；这些地点用于调节语境与材料优先级，不等同于已证实的传播路线。`
      : undefined,
  };
}
