"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCatalog, SIKU_GROUPS, eraKey, yearText, type SikuEntry } from "../world/siku";
import { loadCatalog as loadWorldLitCatalog, type WorldLitEntry } from "../world/worldlit";
import { withReadableWesternBooks, type WesternCanonEntry } from "../world/westernCanon";
import { westernEdges, WESTERN_REVIEW_STATS } from "../world/westernLineage";
import { SIKU_REL, sikuEdges, relsByBook, cunmuKey, type SikuEdge, type SikuRelType } from "../world/sikuLineage";
import { useLang, useT } from "../i18n/lang";

/**
 * 四库脉络长卷 —— 罗盘页「四库脉络」点开的全屏横滚图。
 *
 * 与诸子那张 LineageMap 是两回事、两种轴：
 * - 那张横轴是人物生年、纵是十家道带，画的师承与主张；
 * - 这张横轴是朝代（先秦→清），纵只有经史子集四道，一部可读书一枚书脊。
 *
 * 原先四道只各自铺书，书与书之间、部与部之间一线不连，看着是四排货架而不是「脉络」。
 * 故改作三事：
 *   1. 书作**立着的书脊**，题名竖写在脊上，一步仅二十八，一段四道挤得拢，
 *      四部才像一架书，不像四条分开的带子；
 *   2. 段内按**类**排次（儒道法兵杂……），同类相邻，脊下以横括标类名——
 *      关系多在同类之内，排在一处线就不至于乱穿；
 *   3. 补上**关系线**（见 world/sikuLineage.ts）：传注、承学、取材、非难、并称、相续、依托
 *      七色七型，跨部之线加粗，正是「四部之间有何牵连」的答案。
 *      点一枚书脊即聚焦：其一跳关系亮起、余者压暗，右栏列出每条关系的依据，
 *      可顺藤点跳到相关那部书，也可就此入书读正文。
 *
 * 节点＝**著录之全数**，一千零一十九部尽入此卷，同宽同题，别在浓淡：
 *   - 可读之书（当前一千零二部，带 bookId）脊色实，双击入书读正文；
 *   - 仅著录之书（当前十七部，源数据无正文）脊色淡，点之只见著录。
 * 先前此卷只铺可读那七十余部，四库遂像一架七十本的小书架；而「著录千余部、
 * 可读数十部」本是四库的本分——目录在前，读哪一部在后。千余部同在一卷，
 * 那一疏一密才看得出来：唐宋明清何以书多，先秦何以书少而线密。
 *
 * 存目之书无代（抽取脚本只给可读之书填 dynasty），其代由 `scripts/siku-era.mjs`
 * 手定一表补入目录，断代之例载于该脚本卷首；判据不全者归卷末「代未详」一段。
 * 关系线可系可读书与存目书，但每条须有可说明的判据；新增的题名结构边另标“题名可证”，
 * 其余仍按人工考订写明依据。只有确实没有正文的著录项不进入人物引用。
 *
 * 数据走 loadCatalog()（约 140KB，罗盘层已取过一次则共用缓存），取不到退空态文案。
 */

/** 部序与部色。色值与 .sk-vol[data-g] 的 --vol 同源（globals.css），此处画 SVG 用。 */
const GROUPS = ["经", "史", "子", "集", "西"] as const;
const GROUP_COLOR: Record<string, { vol: string; deep: string }> = {
  经: { vol: "#76855f", deep: "#5c6a48" },
  史: { vol: "#8e4737", deep: "#6e3629" },
  子: { vol: "#4f6b78", deep: "#3c525f" },
  集: { vol: "#7b7162", deep: "#60594c" },
  西: { vol: "#8b6c45", deep: "#684e31" },
};

/**
 * 朝代之序。目录之代共二十，依时间排定——与 `scripts/siku-era.mjs` 的 ERA_ORDER
 * 同一张表（那边补代、这边铺段，两处须一致；万一混入表外之值，缀于卷尾）。
 *
 * 末二段不是朝代：「近今」收清亡以后之书（《清史稿》、民国通俗演义、今人辑本），
 * 「代未详」收判据不全、不敢强断者（伪托而不知托者何代、同题而不着撰人、
 * 本不在中土代序内的高丽朝鲜之书）。宁留此一段，不替它编一个代。
 */
const DYNASTY_ORDER = [
  "先秦", "汉", "魏", "蜀汉", "晋", "北魏", "南朝宋", "南朝齐", "南朝梁",
  "北齐", "隋", "唐", "五代", "宋", "金", "元", "明", "清", "近今", "代未详",
];
/** 各段起讫（约数）。时间要落在图上，不只落在朝代名里。末二段无年可纪，各缀一句其例。 */
const DYNASTY_SPAN: Record<string, string> = {
  先秦: "三代以降", 汉: "前206–220", 魏: "220–266", 蜀汉: "221–263", 晋: "265–420",
  北魏: "386–534", 南朝宋: "420–479", 南朝齐: "479–502", 南朝梁: "502–557",
  北齐: "550–577", 隋: "581–618", 唐: "618–907", 五代: "907–960", 宋: "960–1279",
  金: "1115–1234", 元: "1271–1368", 明: "1368–1644", 清: "1644–1911",
  近今: "1912 以降", 代未详: "成书之年无考",
};

/**
 * 段内书的排次：先按类（依四库原次），同类再按书名。表外之类缀于该部之末。
 *
 * 一千余部铺开后，此表须收**目录所有四十余类**：从前只列了可读之书所在的
 * 十五类，余者 catRank 一概返 99，于是同段里诸类按字序乱插，类名横括碎作一片。
 */
const CAT_ORDER: Record<string, string[]> = {
  经: ["十三经", "十三经注疏", "经学其他"],
  史: ["正史", "编年", "别杂史", "野史", "载记", "传记", "史评", "地理", "职官", "政书", "目录"],
  子: [
    "儒家", "道家", "法家", "兵家", "农家", "杂家", "释家", "术数",
    "医家", "科技", "艺术", "书画", "谱录", "类书", "蒙学",
  ],
  集: ["楚辞", "别集", "总集", "词", "曲", "诗文评", "小说"],
  西: [],
};
const catRank = (group: string, cat: string) => {
  const i = (CAT_ORDER[group] ?? []).indexOf(cat);
  return i < 0 ? 99 : i;
};

// —— 版面定数。左列（.sk-scroll-lanes）的段高以行内样式引用同一批常量，故只此一处 ——
const HEAD_H = 56; // 顶部朝代行高（左列同高的空白垫块与之对齐）
const BAND_H = 170; // 一道四库之带的高：脊上三十留给同道之弧，脊下十四留给类名
/**
 * 一书一步二十八（脊宽十九，相邻留九，如架上挨着的书）——**一千零一十九部同宽**。
 *
 * 先前存目之书作窄册（一步八、册宽五、无题），为的是压卷长：全作二十八则一万五千余。
 * 但窄册有两样坏处：一是无题，五像素写不下一个字，九百余部在卷上成了一片灰条，
 * 要悬停一枚才知是什么书；二是两等并列，看着像可读之书才是「书」、存目之书是它的背景，
 * 而目录里这一千零一十九部本是同一份著录，无分主客。故改为同宽同题：
 * 一部书在卷上占多少地方，不取决于我们切了它的正文没有。
 *
 * 卷长因此一万五千二百余。横向一卷本就该长——它是卷不是屏，卷有卷的量；
 * 真要找某一部书，用的是四库那一层的检索（按人、按名、按关键词），不是在这张卷上拉。
 * 可读与存目之别改由**笔色与题色**分：可读者实色实题，存目者淡一成、题作淡墨，
 * 并在脊下留一道浅痕（见 .sk-spine.cunmu）——疏密之别改作浓淡之别，不再是宽窄之别。
 */
const STEP = 28;
const SEG_PAD = 46; // 段首内让（朝代名落此，不与首书相挤）
/** 一段至少这么宽：容得下最长的那个代名（英文「Five Dynasties」约百二十） */
const SEG_MIN = 124;
const SPINE_W = 19;
const SPINE_H = 112;
const SPINE_TOP = 30; // 脊顶距带顶：这三十是同道之弧的余地
const CAT_Y = SPINE_TOP + SPINE_H + 14; // 类名横括之位
const PAD_R = 60; // 卷尾余白
/** 竖写题名至多几字（脊高容得下的行数） */
const TITLE_MAX = 7;
/** 类名横括：一类不足此数者不书其名——一千余部之后类名太密，密则一个也读不着 */
const CAT_RUN_MIN = 34;

/**
 * 一枚节点。`id` 可读之书即 bookId（关系线与 onOpenBook 皆凭此），
 * 存目之书则是就地编的一个记号（见 buildLayout）——它只用来认 React key 与
 * 聚焦哪一枚，不进 URL、不去 fetch。`open` 即「点得开吗」。
 */
type ScrollEntry = {
  title: string;
  author: string;
  dynasty: string;
  category: string;
  group: string;
  chapters?: number;
  year?: number | [number, number];
  origin?: string;
};
type Node = {
  id: string;
  bookId?: string;
  kind: "siku" | "west";
  e: ScrollEntry;
  gi: number;
  cx: number;
  top: number;
  open: boolean;
};
type CatRun = { gi: number; cat: string; x1: number; x2: number };
type Layout = {
  nodes: Node[];
  byId: Map<string, Node>;
  runs: CatRun[];
  segs: { name: string; x: number; w: number; count: number }[];
  W: number;
  H: number;
  total: number;
  /** 其中可读者几部——与著录之数并举，一句话说清此卷的两等 */
  readable: number;
  western: number;
};

const EMPTY: Layout = { nodes: [], byId: new Map(), runs: [], segs: [], W: 0, H: HEAD_H + GROUPS.length * BAND_H + 20, total: 0, readable: 0, western: 0 };

/** 西书沿同一公元纪年落入中国朝代段，只作同期并置，不据此推定文脉影响。 */
function dynastyAt(year: number | undefined): string {
  if (year == null) return "代未详";
  if (year < -206) return "先秦";
  if (year <= 220) return "汉";
  if (year <= 266) return "魏";
  if (year <= 420) return "晋";
  if (year <= 479) return "南朝宋";
  if (year <= 502) return "南朝齐";
  if (year <= 557) return "南朝梁";
  if (year <= 618) return "隋";
  if (year <= 907) return "唐";
  if (year <= 960) return "五代";
  if (year <= 1279) return "宋";
  if (year <= 1368) return "元";
  if (year <= 1644) return "明";
  if (year <= 1911) return "清";
  return "近今";
}


function buildLayout(catalog: SikuEntry[] | null, worldCatalog: WesternCanonEntry[] | null): Layout {
  const books = catalog ?? [];
  const western = worldCatalog ?? [];
  if (!books.length && !western.length) return EMPTY;
  // 代序里没有的 dynasty 兜底缀尾（siku-era.mjs 已把目录之代补齐并自校，
  // 防的是日后目录变更而两处表未同改）
  const extra = [...new Set(books.map((e) => e.dynasty))].filter((d) => !DYNASTY_ORDER.includes(d));
  const order = [...DYNASTY_ORDER, ...extra];

  /**
   * 存目之书的记号，挨次取：名独一者 `目:名`；一名数见而其类可别者 `目:类/名`；
   * 同类又同名者，**头一条**仍取 `目:类/名`，其后各条退回著录之次（`存目#312`）。
   * 前两样与关系表同出 `cunmuKey()`。
   *
   * 要用书名作号，是因为关系表得指得着它：一千余部手写的线若以著录之次为端点，
   * 目录一增删便全指错了书。名则不动——重出之条并去之后（见 `scripts/siku-dedup.mjs`），一千零一十九部名名独一。
   * 跨类重名的十几处（《南岳小录》野史／地理、《夏商野史》野史／小说之类）缀类即别。
   *
   * 「头一条为正」这一例，是查过那三十处重名才定的：它们**逐字全同**（部、类、代、著者、
   * 有无正文无一处异），即同一部书在目录里著录了两遍，并非两部不同的书（《宋史》等七部
   * 正史、书画五部同题《论书》皆然）。既是同一部书，线系在头一条上便不算连错；
   * 若判它们「认不定一枚」而一概不入表，二十四史那条断限相接的链会在七处断开，
   * 而断开的理由不过是目录里多著录了一遍——那是数据的重复，不是书的歧义。
   */
  const seq = new Map<SikuEntry, number>(books.map((e, i) => [e, i]));
  const titleN = new Map<string, number>();
  const catFirst = new Map<string, SikuEntry>();
  for (const e of books) {
    titleN.set(e.title, (titleN.get(e.title) ?? 0) + 1);
    const ck = `${e.category}/${e.title}`;
    if (!catFirst.has(ck)) catFirst.set(ck, e);
  }
  const cunmuId = (e: SikuEntry) => {
    if ((titleN.get(e.title) ?? 0) === 1) return cunmuKey(e.title);
    const ck = `${e.category}/${e.title}`;
    if (catFirst.get(ck) === e) return cunmuKey(e.title, e.category);
    return `存目#${seq.get(e)}`;
  };

  const westByEra = new Map<string, WesternCanonEntry[]>();
  for (const e of western) {
    const era = dynastyAt(e.year);
    westByEra.set(era, [...(westByEra.get(era) ?? []), e]);
  }

  const H = HEAD_H + GROUPS.length * BAND_H + 20;
  const segs: Layout["segs"] = [];
  const nodes: Node[] = [];
  const runs: CatRun[] = [];
  let x = 0;
  for (const name of order) {
    const inEra = books.filter((e) => e.dynasty === name);
    const westInEra = (westByEra.get(name) ?? []).sort((a, b) => a.year - b.year);
    if (!inEra.length && !westInEra.length) continue;
    const byGroup: Array<Array<SikuEntry | WesternCanonEntry>> = GROUPS.map((g) => {
      if (g === "西") return westInEra;
      return inEra
        .filter((e) => e.group === g)
        .sort(
          (a, b) =>
            catRank(g, a.category) - catRank(g, b.category) ||
            a.category.localeCompare(b.category, "zh") ||
            // 同类之内可读者在前：那几部是此卷的眼目，挨着类名的一头站着才找得见
            (a.bookId ? 0 : 1) - (b.bookId ? 0 : 1) ||
            a.title.localeCompare(b.title, "zh"),
        );
    });
    // 段宽按该段最宽的那一道定，不按总书数：四道各自铺各自的书，
    // 合起来算宽则段空出大半，分头算宽又会使同段四道长短不齐、段界对不上。
    const laneW = byGroup.map((it) => it.length * STEP);
    // 段宽另有下限：代名就是这张卷的横轴，一段窄到写不下自己的名字便失了轴的用处。
    // 金、北齐、隋各只二三部，按步算段宽才五十余，英文的 "Five Dynasties"、
    // "Jin (Jurchen)" 尤其长。故按名之长留出地方——宁可那几段空些，不可无名。
    const usable = Math.max(SEG_MIN, ...laneW);
    const w = SEG_PAD + usable;
    segs.push({ name, x, w, count: inEra.length + westInEra.length });
    byGroup.forEach((items, gi) => {
      if (!items.length) return;
      // 各道在本段内摊满段宽：书少的那一道便疏些，段界四道仍对得齐
      const step = usable / items.length;
      const top = HEAD_H + gi * BAND_H + SPINE_TOP;
      const mid = items.map((_, i) => x + SEG_PAD + i * step + step / 2);
      items.forEach((raw, i) => {
        const isWest = gi === GROUPS.indexOf("西");
        const e: ScrollEntry = isWest
          ? {
              title: (raw as WesternCanonEntry).name,
              author: (raw as WesternCanonEntry).author,
              dynasty: name,
              category: (raw as WesternCanonEntry).category,
              group: "西",
              year: (raw as WesternCanonEntry).year,
              origin: (raw as WesternCanonEntry).origin,
            }
          : {
              title: (raw as SikuEntry).title,
              author: (raw as SikuEntry).author,
              dynasty: (raw as SikuEntry).dynasty,
              category: (raw as SikuEntry).category,
              group: (raw as SikuEntry).group,
              chapters: (raw as SikuEntry).chapters,
              year: (raw as SikuEntry).year,
            };
        const bookId = isWest ? (raw as WesternCanonEntry).worldLitId : (raw as SikuEntry).bookId;
        nodes.push({
          // 存目之书无 bookId，就地给一个记号（见上 cunmuId）。此号不进 URL、不去 fetch。
          id: isWest
            ? `wl:${(raw as WesternCanonEntry).id}`
            : (raw as SikuEntry).lineageId ?? bookId ?? cunmuId(raw as SikuEntry),
          bookId,
          kind: isWest ? "west" : "siku",
          e,
          gi,
          cx: mid[i],
          top,
          open: !!bookId,
        });
      });
      // 同类相邻者归一括：类名写在括下，一眼看出这一段这一道有几类。
      // 一千余部之后，括短于 CAT_RUN_MIN 者不书其名——否则类名彼此叠成一条墨线。
      let s = 0;
      for (let i = 1; i <= items.length; i++) {
        const category = (item: SikuEntry | WesternCanonEntry) => item.category;
        if (i === items.length || category(items[i]) !== category(items[s])) {
          const x1 = mid[s];
          const x2 = mid[i - 1];
          if (x2 - x1 >= CAT_RUN_MIN && gi < 4) runs.push({ gi, cat: category(items[s]), x1, x2 });
          s = i;
        }
      }
    });
    x += w;
  }
  return {
    nodes,
    byId: new Map(nodes.map((n) => [n.id, n])),
    runs,
    segs,
    W: x + PAD_R,
    H,
    total: books.length,
    readable: books.filter((e) => e.bookId).length,
    western: western.length,
  };
}

/** 关系线：同道者自脊顶拱过去，跨道者自脊底垂下（或自脊顶兜上）。 */
function edgePath(a: Node, b: Node): string {
  if (a.gi === b.gi) {
    const r = Math.min(26, 9 + Math.abs(b.cx - a.cx) * 0.2);
    return `M${a.cx},${a.top} C${a.cx},${a.top - r} ${b.cx},${b.top - r} ${b.cx},${b.top}`;
  }
  const down = b.gi > a.gi;
  const ay = down ? a.top + SPINE_H : a.top;
  const by = down ? b.top : b.top + SPINE_H;
  const k = (by - ay) * 0.5;
  return `M${a.cx},${ay} C${a.cx},${ay + k} ${b.cx},${by - k} ${b.cx},${by}`;
}

const REL_KEYS = Object.keys(SIKU_REL) as SikuRelType[];

/** 关系在详情栏里的说法：同一种关系，自上游看与自下游看是两句话。 */
function relWord(type: SikuRelType, dir: "in" | "out"): string {
  switch (type) {
    case "传": return dir === "in" ? "传注所本" : "下有传注";
    case "承": return dir === "in" ? "承自" : "下启";
    case "采": return dir === "in" ? "取材自" : "为其所取";
    case "驳": return dir === "in" ? "见难于" : "难及";
    case "续": return dir === "in" ? "续自" : "下续";
    case "托": return dir === "in" ? "依托于" : "为其所托";
    default: return "并称";
  }
}

export default function SikuScrollLayer({
  onClose,
  onOpenBook,
  onOpenWorldBook,
}: {
  onClose: () => void;
  /** 点书直落 SikuLayer 该书（bookId 即分片名） */
  onOpenBook: (bookId: string) => void;
  /** 西典已有正文者直落世界文学阅读层；仅著录者不显示阅读入口。 */
  onOpenWorldBook: (bookId: string) => void;
}) {
  const t = useT();
  const lang = useLang();
  const [catalog, setCatalog] = useState<SikuEntry[] | null>(null);
  const [worldCatalog, setWorldCatalog] = useState<WorldLitEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  /** 关系类型隐显：默认全开 */
  const [off, setOff] = useState<Set<SikuRelType>>(new Set());
  /** 只看跨部之线——四部如何牵连，这一钮直说 */
  const [crossOnly, setCrossOnly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    Promise.all([loadCatalog(), loadWorldLitCatalog()]).then(
      ([c, w]) => {
        if (!live) return;
        setCatalog(c);
        setWorldCatalog(w);
      },
      () => live && setErr(t("目录未载入——四库或西方典籍目录尚未生成或未随构建上传。")),
    );
    return () => {
      live = false;
    };
  }, [t]);

  const western = useMemo(() => worldCatalog ? withReadableWesternBooks(worldCatalog) : null, [worldCatalog]);
  const L = useMemo(() => buildLayout(catalog, western), [catalog, western]);
  const chineseEdges = useMemo(() => sikuEdges(new Set(L.byId.keys())), [L]);
  const westEdges = useMemo(() => westernEdges(new Set(L.byId.keys())), [L]);
  const edges = useMemo(() => [...chineseEdges, ...westEdges], [chineseEdges, westEdges]);
  const rels = useMemo(() => relsByBook(edges), [edges]);
  /** 各部牵出的跨部之线数——左列报个数，省得以为四部仍不相干 */
  const crossBy = useMemo(() => {
    const m: Record<string, number> = { 经: 0, 史: 0, 子: 0, 集: 0 };
    for (const e of edges) {
      const a = L.byId.get(e.from), b = L.byId.get(e.to);
      if (!a || !b || a.gi === b.gi) continue;
      m[GROUPS[a.gi]]++;
      m[GROUPS[b.gi]]++;
    }
    return m;
  }, [edges, L]);
  const shown = useMemo(
    () =>
      edges.filter((e) => {
        if (off.has(e.type)) return false;
        if (crossOnly && L.byId.get(e.from)!.gi === L.byId.get(e.to)!.gi) return false;
        return true;
      }),
    [edges, off, crossOnly, L],
  );

  /** 高亮以聚焦者为先，无聚焦则随指针 */
  const active = focus ?? hover;
  const lit = useMemo(() => {
    if (!active) return null;
    const s = new Set<string>([active]);
    for (const r of rels.get(active) ?? []) s.add(r.other);
    return s;
  }, [active, rels]);

  /** 顺藤点跳：把那部书滚到眼前再聚焦，不然点了像没反应 */
  const jump = useCallback(
    (id: string) => {
      setFocus(id);
      const n = L.byId.get(id);
      const box = scrollRef.current;
      if (!n || !box) return;
      box.scrollTo({ left: Math.max(0, n.cx - box.clientWidth / 2), behavior: "smooth" });
    },
    [L],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (focus) setFocus(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, onClose]);

  const fo = focus ? L.byId.get(focus) : null;

  return (
    <div className="sk-scroll-stage" onClick={onClose} role="dialog" aria-label={t("中西文明典籍长卷")} aria-modal="true">
      <div className="sk-scroll-card" onClick={(e) => e.stopPropagation()}>
        <header className="sk-scroll-head">
          <div>
            <p className="eyebrow">{t("中西文明典籍")}</p>
            <h2>
              {t("文明长卷 · 中西五道")}
              <small>
                {catalog
                  ? t("四库 {total} 部、西典 {western} 部同期铺展；四库 {zhEdges} 条、西典 {westEdges} 条文脉关系", {
                      total: L.total,
                      western: L.western,
                      zhEdges: chineseEdges.length,
                      westEdges: westEdges.length,
                    })
                  : t("目录载入中…")}
              </small>
            </h2>
          </div>
          {/* 卷题：章学诚《校雠通义》序那两句——这张长卷做的正是这件事（辨其学术之章、考其源流之镜）。
              窄屏隐去，不与题名争地方。 */}
          <p className="sk-scroll-epi">
            <b>{t("辨章学术，考镜源流")}</b>
            <em>{t("章学诚《校雠通义》")}</em>
          </p>
          <button className="stage-close" onClick={onClose} aria-label={t("关闭")}>×</button>
        </header>

        {err ? (
          <div className="sk-scroll-empty">{err}</div>
        ) : (
          <div className="sk-scroll-body">
            <div className="sk-scroll-x" ref={scrollRef}>
              {/* 部名与图共用同一个纵向滚动面；横向展卷时左列 sticky 留在手边。 */}
              <aside className="sk-scroll-lanes" style={{ height: L.H }}>
                <div style={{ height: HEAD_H, flex: "0 0 auto" }} />
                {[...SIKU_GROUPS, { id: "西", name: "西方典籍", hint: "按公元年代与中土典籍同期并置" }].map((g) => (
                  <div key={g.id} className="sk-scroll-lane" style={{ height: BAND_H, color: GROUP_COLOR[g.id].deep }}>
                    <i style={{ background: GROUP_COLOR[g.id].vol }} />
                    <b>{t(g.name)}</b>
                    <span>{t(g.hint)}</span>
                    <em>{g.id === "西"
                      ? t("{books} 部 · 正式关系 {edges} 条 · 驳回 {rejected} 候选", {
                          books: L.western,
                          edges: westEdges.length,
                          rejected: WESTERN_REVIEW_STATS.rejected,
                        })
                      : t("牵出跨部 {n} 线", { n: crossBy[g.id] ?? 0 })}</em>
                  </div>
                ))}
              </aside>
              <svg width={L.W} height={L.H} className="sk-scroll-svg" role="img"
                onClick={() => setFocus(null)}
                aria-label={t("中西文明典籍长卷：横轴依公元年代展开，纵为经史子集与西方典籍五道；七类关系连接各自传统中具有可靠依据的典籍")}>
                <defs>
                  {/* 记号 id 用 REL_KEYS 里的位置，与下面 markerEnd 的 indexOf 同一套；
                      若按「有箭头的那几种」另行编号，并称之后诸型便对不上号 */}
                  {REL_KEYS.filter((k) => SIKU_REL[k].arrow).map((k) => (
                    <marker key={k} id={`sk-ar-${REL_KEYS.indexOf(k)}`} viewBox="0 0 8 8" refX="7.2" refY="4"
                      markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
                      <path d="M0.4,1 L7.2,4 L0.4,7 Z" fill={SIKU_REL[k].color} />
                    </marker>
                  ))}
                </defs>

                {/* 四道带：各部淡染一成，带界细线如古纸接缝 */}
                {GROUPS.map((g, i) => (
                  <rect key={g} x={0} y={HEAD_H + i * BAND_H} width={L.W} height={BAND_H}
                    fill={GROUP_COLOR[g].vol} fillOpacity={0.07} />
                ))}
                {GROUPS.map((g, i) => (
                  <line key={`d${g}`} x1={0} x2={L.W}
                    y1={HEAD_H + (i + 1) * BAND_H} y2={HEAD_H + (i + 1) * BAND_H}
                    className="sk-band-line" />
                ))}
                <line x1={0} x2={L.W} y1={HEAD_H} y2={HEAD_H} className="sk-band-line" />

                {/* 段界虚线与段首朝代名、起讫年号、部数。
                    全目铺开后段有极窄者（金、北齐、隋各二三部，段宽才五十余），
                    起讫那一行写不下便探进隔段的名里去，读成「1115–1234 12部1368 · 48 部」。
                    故两行各自量过段宽：写不下的不写，全文一律留在段首的 <title> 里，
                    悬停仍看得见——与类名横括「短于三十四者不书其名」同一个办法。 */}
                {L.segs.map((s) => {
                  const name = t(eraKey(s.name, lang));
                  const sub = t("{span} · {n} 部", { span: t(DYNASTY_SPAN[s.name] ?? ""), n: s.count });
                  // 一字之宽：中文连字距约七点八，拉丁约五点二（名作十五号，起讫作九点五号）
                  const wOf = (txt: string, px: number) => txt.length * px * (lang === "en" ? 0.56 : 1);
                  const room = s.w - 14 - 6;
                  return (
                    <g key={s.name}>
                      <title>{t("{era}：{sub}", { era: name, sub })}</title>
                      <line x1={s.x} x2={s.x} y1={8} y2={L.H - 14} className="sk-seg-line" />
                      {wOf(name, 15) <= room && (
                        <text x={s.x + 14} y={34} className="sk-seg-name">{name}</text>
                      )}
                      {wOf(sub, 9.5) <= room && (
                        <text x={s.x + 14} y={50} className="sk-seg-sub">{sub}</text>
                      )}
                    </g>
                  );
                })}

                {/* 类名横括：同段同道里同类的几部书归一括，括下书类名 */}
                {L.runs.map((r, i) => {
                  const y = HEAD_H + r.gi * BAND_H + CAT_Y;
                  return (
                    <g key={`r${i}`} className="sk-cat-run">
                      <path d={`M${r.x1 - 7},${y - 5} L${r.x1 - 7},${y} L${r.x2 + 7},${y} L${r.x2 + 7},${y - 5}`} />
                      <text x={(r.x1 + r.x2) / 2} y={y + 11} textAnchor="middle">{t(r.cat)}</text>
                    </g>
                  );
                })}

                {/* 关系线：七色七型，跨部者加粗。聚焦时与之无涉者淡到近无 */}
                <g className="sk-edges">
                  {shown.map((e: SikuEdge, i) => {
                    const a = L.byId.get(e.from)!;
                    const b = L.byId.get(e.to)!;
                    const st = SIKU_REL[e.type];
                    const cross = a.gi !== b.gi;
                    const on = !lit || lit.has(e.from) || lit.has(e.to);
                    const hot = !!lit && lit.has(e.from) && lit.has(e.to) && (e.from === active || e.to === active);
                    return (
                      <path
                        key={`${e.from}-${e.to}-${i}`}
                        d={edgePath(a, b)}
                        fill="none"
                        stroke={st.color}
                        strokeWidth={(cross ? 1.9 : 1.15) + (hot ? 0.8 : 0)}
                        strokeDasharray={st.dash === "none" ? undefined : st.dash}
                        markerEnd={st.arrow ? `url(#sk-ar-${REL_KEYS.indexOf(e.type)})` : undefined}
                        opacity={hot ? 0.95 : on ? (lit ? 0.5 : cross ? 0.42 : 0.26) : 0.05}
                      >
                        <title>
                          {t("{from} —{rel}→ {to}：{note}", {
                            from: t(a.e.title),
                            rel: t(st.label),
                            to: t(b.e.title),
                            note: t(e.note),
                          })}
                        </title>
                      </path>
                    );
                  })}
                </g>

                {/* 书脊：一千零一十九部一例画，题名竖写脊上。
                    可读与存目之别不在大小，在浓淡：存目者脊色淡一成、题作淡墨、脊下一道浅痕
                    （见 .sk-spine.cunmu），双击与键盘的「开」一概不给——那是点不开的书。
                    两者同画一遍，故卷上先后只依目次，不分主客。 */}
                {L.nodes.map((n) => {
                  const dim = !!lit && !lit.has(n.id);
                  // 竖写只取正名：括注（如「道德经（老子）」的括号）竖排里括号不转向，难看，
                  // 故脊上去括，全名仍在 tooltip 与 aria-label 里。
                  // 脊上题名两种语文都作中文竖写：这一枚画的是书脊本身，竖排拉丁字母读不成，
                  // 与四库书函上那条题签（.sk-vol-slip）同例；英文名在悬停、读屏与右栏里。
                  const chars = [...n.e.title.replace(/[（(][^）)]*[）)]/g, "").replace(/\s+/g, "")];
                  const text = chars.length > TITLE_MAX ? [...chars.slice(0, TITLE_MAX - 1), "…"] : chars;
                  const col = GROUP_COLOR[GROUPS[n.gi]];
                  return (
                    <g key={n.id}
                      className={`sk-spine${n.open ? "" : " cunmu"}${focus === n.id ? " on" : ""}${dim ? " dim" : ""}`}
                      role="button" tabIndex={0}
                      aria-label={n.open
                        ? t("{title}，{dynasty}，{author}", {
                            title: t(n.e.title),
                            dynasty: t(eraKey(n.e.dynasty, lang)),
                            author: t(n.e.author || "撰人阙名"),
                          })
                        : t("{title}，{dynasty}，{author}，存目未切正文", {
                            title: t(n.e.title),
                            dynasty: t(eraKey(n.e.dynasty, lang)),
                            author: t(n.e.author || "撰人阙名"),
                          })}
                      onMouseEnter={() => setHover(n.id)}
                      onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                      onClick={(ev) => { ev.stopPropagation(); setFocus((f) => (f === n.id ? null : n.id)); }}
                      onDoubleClick={(ev) => {
                        ev.stopPropagation();
                        if (!n.open || !n.bookId) return;
                        if (n.kind === "west") onOpenWorldBook(n.bookId);
                        else onOpenBook(n.bookId);
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") setFocus(n.id);
                        else if (ev.key === " " && n.open && n.bookId) {
                          ev.preventDefault();
                          if (n.kind === "west") onOpenWorldBook(n.bookId);
                          else onOpenBook(n.bookId);
                        }
                      }}>
                      <title>
                        {n.open
                          ? t("{title} · {dynasty} · {author} · {chapters} 章 · {rels} 条关系", {
                              title: t(n.e.title),
                              dynasty: t(eraKey(n.e.dynasty, lang)),
                              author: t(n.e.author || "撰人阙名"),
                              chapters: n.e.chapters ?? "?",
                              rels: (rels.get(n.id) ?? []).length,
                            })
                          : t("{title} · {dynasty} · {author} · 存目 · {rels} 条关系", {
                              title: t(n.e.title),
                              dynasty: t(eraKey(n.e.dynasty, lang)),
                              author: t(n.e.author || "撰人阙名"),
                              rels: (rels.get(n.id) ?? []).length,
                            })}
                      </title>
                      <rect className="sk-spine-body" x={n.cx - SPINE_W / 2} y={n.top} width={SPINE_W} height={SPINE_H}
                        rx={1.6} fill={col.vol} />
                      {/* 订线两道：书脊上下各一，线装书的样子 */}
                      <line x1={n.cx - SPINE_W / 2 + 3} x2={n.cx + SPINE_W / 2 - 3} y1={n.top + 6} y2={n.top + 6}
                        stroke={col.deep} strokeWidth={0.9} opacity={0.6} />
                      <line x1={n.cx - SPINE_W / 2 + 3} x2={n.cx + SPINE_W / 2 - 3} y1={n.top + SPINE_H - 6} y2={n.top + SPINE_H - 6}
                        stroke={col.deep} strokeWidth={0.9} opacity={0.6} />
                      {/* 存目者脊下一道浅痕：未切之书在架上是一道空处，不是一部书 */}
                      {!n.open && (
                        <line className="sk-spine-cut" x1={n.cx - SPINE_W / 2} x2={n.cx + SPINE_W / 2}
                          y1={n.top + SPINE_H + 3} y2={n.top + SPINE_H + 3} />
                      )}
                      <text className="sk-spine-title" x={n.cx} y={n.top + 20} textAnchor="middle">
                        {text.map((c, i) => (
                          <tspan key={i} x={n.cx} dy={i === 0 ? 0 : 13}>{c}</tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}

                {/* 名签：悬停（或聚焦）那一枚的书名，就地浮一张小纸条。
                    脊上竖题去了括注、长过七字者截作省略号，签上写的是**全名**，另具代与类。
                    不靠 SVG 原生 `<title>`——那是系统小黄条，要停住一秒才冒，手过脊上便看不着。
                    画在最后一道，压住所有书脊与关系线；近卷尾者签改向左伸，不出卷外。 */}
                {(() => {
                  const n = active ? L.byId.get(active) : null;
                  if (!n) return null;
                  const label = t(n.e.title);
                  const yr = yearText(n.e.year, t);
                  const base = n.open
                    ? t("{dynasty} · {category}", { dynasty: t(eraKey(n.e.dynasty, lang)), category: t(n.e.category) })
                    : t("{dynasty} · {category} · 存目", { dynasty: t(eraKey(n.e.dynasty, lang)), category: t(n.e.category) });
                  // 年缀在副行之末，无年则副行照旧——签是浮在卷上的，多一行会盖住书脊
                  const sub = yr ? t("{base} · {y}", { base, y: yr }) : base;
                  // 签宽按两行里长的那行估：中文一字约七，拉丁一字母约四点二
                  const wide = Math.max(label.length, sub.length * 0.86);
                  const w = Math.min(290, 22 + wide * (lang === "en" ? 4.6 : 7.4));
                  const flip = n.cx + w + 16 > L.W;
                  const x = flip ? n.cx - w - 9 : n.cx + 9;
                  const y = n.top + 2;
                  return (
                    <g className="sk-tag" pointerEvents="none">
                      <rect x={x} y={y} width={w} height={34} rx={1.5} />
                      <line x1={x} x2={x} y1={y} y2={y + 34}
                        stroke={GROUP_COLOR[GROUPS[n.gi]].vol} strokeWidth={2.4} />
                      <text className="sk-tag-t" x={x + 8} y={y + 14}>{label}</text>
                      <text className="sk-tag-s" x={x + 8} y={y + 27}>{sub}</text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* 右栏：聚焦一书则列其著录，可读者并列其一跳关系、可就此入书 */}
            {fo && (
              <aside className="sk-scroll-side">
                <div className="sk-side-head">
                  <i style={{ background: GROUP_COLOR[GROUPS[fo.gi]].vol }} />
                  <b>{t(fo.e.title)}</b>
                  <button className="sk-side-x" onClick={() => setFocus(null)} aria-label={t("取消聚焦")}>×</button>
                </div>
                <p className="sk-side-meta">
                  {t("{dynasty} · {author}", {
                    dynasty: t(eraKey(fo.e.dynasty, lang)),
                    author: t(fo.e.author || "撰人阙名"),
                  })}
                  <br />
                  {/* 成书之年：考得出的二百八十五部才有这一行，余者整行不印——
                      既不印问号也不印「年未详」，留白本身就是「此处无据」。 */}
                  {yearText(fo.e.year, t) && (
                    <>
                      <span className="sk-side-year">
                        {t("成书 {y}", { y: yearText(fo.e.year, t) })}
                      </span>
                      <br />
                    </>
                  )}
                  {fo.open
                    ? fo.kind === "west"
                      ? t("{origin} · {category} · 正文可读", {
                          origin: t(fo.e.origin || "西方"),
                          category: t(fo.e.category),
                        })
                      : t("{part}部 · {category} · {n} 章", {
                          part: t(fo.e.group),
                          category: t(fo.e.category),
                          n: fo.e.chapters ?? "?",
                        })
                    : t("{part}部 · {category} · 存目", {
                        part: t(fo.kind === "west" ? (fo.e.origin || "西方") : fo.e.group),
                        category: t(fo.e.category),
                      })}
                </p>
                {/* 存目之书未切正文，不出「入此书」那一钮——给个点不开的钮是骗人。
                    代以一句交代：源数据确无正文者只见于目。 */}
                {fo.open && fo.bookId ? (
                  <button className="sk-side-open" onClick={() => fo.kind === "west" ? onOpenWorldBook(fo.bookId!) : onOpenBook(fo.bookId!)}>{t("入此书 · 读其正文 →")}</button>
                ) : (
                  <p className="sk-side-cunmu">{t("此书已收入代表性目录，正文尚未接入。")}</p>
                )}
                {/* 关系不分可读与存目：一部注疏点不开正文，却正是它所释之经的下游，
                    那一条线与那一句依据，是此卷对它要说的全部话。先前这一段锁在
                    `fo.open` 里（其时存目之书本无线），今既系了线，便须开给它看。 */}
                {fo.kind === "west" ? (
                  <>
                    <div className="sk-side-sec">{t("西典关系 · {n} 条", { n: (rels.get(fo.id) ?? []).length })}</div>
                    {(rels.get(fo.id) ?? []).length === 0 && <p className="sk-side-none">{t("此书暂无通过审定的关系；主题相似不自动视作文脉传承。")}</p>}
                  </>
                ) : (
                  <>
                    <div className="sk-side-sec">{t("一跳关系 · {n} 条", { n: (rels.get(fo.id) ?? []).length })}</div>
                    {(rels.get(fo.id) ?? []).length === 0 && <p className="sk-side-none">{t("此书尚未系线。")}</p>}
                  </>
                )}
                <ul className="sk-side-rels">
                  {(rels.get(fo.id) ?? []).map((r, i) => {
                    const o = L.byId.get(r.other);
                    if (!o) return null;
                    const st = SIKU_REL[r.type];
                    return (
                      <li key={i}>
                        <button onClick={() => jump(r.other)}>
                          <i style={{ background: st.color }} />
                          <span className="sk-rel-word">{t(relWord(r.type, r.dir))}</span>
                          <b>
                            《{t(o.e.title)}》<em>{t(o.e.group)}</em>
                          </b>
                        </button>
                        <small>
                          {r.basis === "title" ? `${t("题名可证")} · `
                            : r.basis === "zongmu" ? `${t("总目明证")} · `
                            : r.basis === "primary" ? `${t("原文可证")} · `
                            : r.basis === "scholarly" ? `${t("学术来源")} · ` : ""}
                          {t(r.note)}
                          {r.evidence && (
                            <cite>
                              {r.evidence.quote && <>「{t(r.evidence.quote)}」</>}
                              {r.evidence.summary && <span>{t(r.evidence.summary)}</span>}
                              {r.evidence.url
                                ? <a href={r.evidence.url} target="_blank" rel="noreferrer">{t(r.evidence.source)} ↗</a>
                                : <em>{t(r.evidence.source)}</em>}
                            </cite>
                          )}
                        </small>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}
          </div>
        )}

        <footer className="sk-scroll-legend">
          {SIKU_GROUPS.map((g) => (
            <span key={g.id} className="legend-item">
              <i className="legend-swatch" style={{ background: GROUP_COLOR[g.id].vol }} />
              {t(g.name)}
            </span>
          ))}
          <span className="legend-item">
            <i className="legend-swatch" style={{ background: GROUP_COLOR.西.vol }} />
            {t("西方典籍")}
          </span>
          <span className="sk-legend-sep" aria-hidden />
          {/* 浓淡之别须在图例里交代：不然读者只见深浅，不知淡的那些是什么 */}
          <span className="legend-item sk-legend-tier">
            <svg width="20" height="12" aria-hidden>
              <rect x="1" y="0" width="7" height="12" rx="1" fill="#7b7162" />
              <rect x="11" y="0" width="7" height="12" rx="1" fill="#7b7162" opacity="0.52" />
              <line x1="11" x2="18" y1="11.4" y2="11.4" stroke="#28221a" strokeWidth="1"
                strokeDasharray="2 2" opacity="0.3" />
            </svg>
            {t("实脊可读 · 淡脊仅著录")}
          </span>
          <span className="sk-legend-sep" aria-hidden />
          {REL_KEYS.map((k) => {
            const st = SIKU_REL[k];
            return (
              <button
                key={k}
                className={`sk-rel-chip${off.has(k) ? " off" : ""}`}
                title={t(st.hint)}
                aria-pressed={!off.has(k)}
                onClick={() =>
                  setOff((s) => {
                    const t = new Set(s);
                    if (!t.delete(k)) t.add(k);
                    return t;
                  })
                }
              >
                <svg width="22" height="8" aria-hidden>
                  <line x1="1" y1="4" x2="21" y2="4" stroke={st.color} strokeWidth="1.8"
                    strokeDasharray={st.dash === "none" ? undefined : st.dash} />
                </svg>
                {t(st.label)}
              </button>
            );
          })}
          <button className={`sk-rel-chip cross${crossOnly ? " on" : ""}`} onClick={() => setCrossOnly((v) => !v)}
            title={t("只画经史子集四部之间的线，部内之线暂隐")}>
            {t("只看跨部")}
          </button>
          <span className="legend-hint">{t("横向展卷 → 点脊看著录 · 双击可读之书进入正文 · 西典与四库按年代同期并置")}</span>
        </footer>
      </div>
    </div>
  );
}
