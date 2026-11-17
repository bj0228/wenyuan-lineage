import { canon, retrieve, embedQuery, type Passage } from "./canon";
import { xiyouPassages } from "./xiyou-passages";
import { westPassages } from "./west-passages";
import { asset } from "./assetPath";
import { loadBookKeywords, loadTermDict } from "./sikuTerms";
import type { MotifAnchor } from "./motifs";
import { scholarMap } from "./characters";

/**
 * 跨世界语料池与锚点解析。
 *
 * 诸子语料（canon）与西游语料（xiyouPassages）形状相同但来路不同：前者手写，id 稳定；
 * 后者由脚本自原著抽出，id 随择句规则而变。故锚点有两种指法（见 motifs.ts 的
 * `MotifAnchor`），由此处统一解回 `Passage`。
 *
 * 第三样是西方那十五条（westPassages）：自世界文学架上的译本分片里原样截出，
 * id 手定、稳定，故母题锚点径指 `passageId`。三轴并此一池，`resolveAnchor` 按
 * `worldId` 分头去解。
 *
 * 这个模块也是日后换成 API 检索的那个接口位：调用方只认 `allPassages` 与
 * `resolveAnchor`，内存实现换成远端实现时，上层一行不改。
 */
export const allPassages: Passage[] = [...canon, ...xiyouPassages, ...westPassages];

const byId = new Map(allPassages.map((p) => [p.id, p]));

/**
 * 解一个锚点为具体文段。
 *  - 有 `passageId` 的直接取；
 *  - 有 `quote` 的在该世界的语料里找含此片段者，取最短的一条——
 *    片段越短越可能撞上多句，取最短者意在「这句话就是讲这个的」而非顺带提及。
 * 解不到返回 null，UI 据此显示「此锚未检得」而不是崩掉——抽取规则一改，
 * 个别锚点失落是正常的，不该让整个母题层挂掉。
 */
export function resolveAnchor(a: MotifAnchor): Passage | null {
  if (a.passageId) return byId.get(a.passageId) ?? null;
  if (!a.quote) return null;
  const pool = allPassages.filter((p) => (p.worldId ?? "zhanguo") === a.worldId);
  const hits = pool.filter((p) => p.text.includes(a.quote!));
  if (hits.length === 0) return null;
  return hits.sort((x, y) => x.text.length - y.text.length)[0];
}

/** 一组锚点解出的文段，解不到的剔除。 */
export function resolveAnchors(anchors: MotifAnchor[]): { anchor: MotifAnchor; passage: Passage }[] {
  return anchors
    .map((anchor) => ({ anchor, passage: resolveAnchor(anchor) }))
    .filter((x): x is { anchor: MotifAnchor; passage: Passage } => x.passage !== null);
}

/** 母题的三轴。与 `MOTIFS` 的锚点所涉者同——策展的十二枚每枚都三轴俱全。 */
const MOTIF_AXES: MotifAnchor["worldId"][] = ["zhanguo", "xiyou", "west"];

/** 检得之锚的来历，记在 `note` 里，与策展所定者一眼可分。 */
const SUGGESTED_NOTE = "客立此题后就题意检得，非古人原为此题而发。";

/**
 * 题名切成两份：`terms` 是长度≥2 的词（含二元字组），`chars` 是去掉虚字的单字。
 *
 * 分这两份是为下面那道闸：`tokenize`（canon.ts）无分词可用，中文退化为二元与一元
 * 字组，于是「隐私」能凭一个「隐」字命中孟子的「无恻隐之心」，「算法」能凭一个
 * 「法」字命中《道德经》的「道法自然」。这种锚点看着像模像样——真原文、真出处——
 * 其实与题意无关，比空着更坏：空着时评议席知道自己无所依凭，错锚却会被当作先贤
 * 对此题说过的话接下去。
 *
 * 虚字（之乎者也与和）不计入 `chars`：它们在诸书里满篇皆是，算进去等于白给一分。
 */
const EMPTY_CHARS = new Set(["之", "乎", "者", "也", "与", "和", "的", "而", "其", "以", "于"]);

function nameTerms(name: string): { terms: string[]; chars: string[] } {
  const terms = new Set<string>();
  const chars = new Set<string>();
  for (const seg of name.replace(/[，。？！、；：""''（）,.?!;:()\s]+/g, " ").split(" ").filter(Boolean)) {
    if (seg.length >= 2) terms.add(seg);
    for (let i = 0; i < seg.length; i++) {
      if (!EMPTY_CHARS.has(seg[i])) chars.add(seg[i]);
      if (i + 1 < seg.length) terms.add(seg.slice(i, i + 2));
    }
  }
  return { terms: [...terms], chars: [...chars] };
}

/** 这一条的各处字面并作一处查。 */
function hay(p: Passage): string {
  return `${p.text}\n${p.gloss}\n${p.book}\n${p.chapter}\n${p.keywords.join("\n")}`;
}

/**
 * 这一条是否与题名真沾得上：一个实词落中，或题名里两个不同的字落中。
 *
 * 两条都要，是因为短题名切不出有用的二元字组：「名与实」切出来是「名与」「与实」，
 * 两个都不成词，于是公孙龙那句「夫名，实谓也」——字面薄而确是讲这个的——会被实词
 * 一关拦掉。补上「两字皆中」这一条（名、实俱在）它便过得去，而「隐私」对孟子的
 * 「无恻隐之心」仍只中一个「隐」字，照旧拦住。
 */
function solidlyHit(p: Passage, nt: { terms: string[]; chars: string[] }): boolean {
  const h = hay(p);
  if (nt.terms.some((t) => h.includes(t))) return true;
  return nt.chars.filter((c) => h.includes(c)).length >= 2;
}

/**
 * 为客自立之题代拟锚点：三轴各检一条最合的。
 *
 * motifs.ts 开篇说过「哪一句算这个母题，这不是检索能定的」——那句话此处仍然作数，
 * 所以这里给的是**候选**，不是定论：检完即落进客题，不合意可一键撤（见 keMotifs
 * 的 `setAnchors`）。真正被推翻的只是它的推论「所以客题只能无锚」：客现场立的题，
 * 书里本没有人替他挑过句子，没有可挑的就只剩两条路——空着，或者检一条来。空着
 * 的结果是三栏皆无所依凭（`promptFor` 会直说诸书无现成之句可对），检一条来至少
 * 把每一轴钉在一句真原文上。这也正是 `Motif.candidates` 那个口子原本留着要做的事，
 * 只是定夺权交在客手里，不交给人工审核的流程。
 *
 * **一轴只取一条**：三栏并观，每栏一句才看得过来；取多了那页就成了检索结果列表，
 * 不是对照本。
 *
 * **检不到的轴宁可空着**，不拿撞了一个字的句子凑数。
 *
 * 这道闸是量出来的，经了三轮。
 *
 * 第一轮只有字面闸（`solidlyHit`）：以策展的十二枚母题作准，不设闸时三十六轴条条
 * 出锚而与策展相合者只十条，加闸后覆盖 30.6%、出锚者准确率 81.8%。
 *
 * 第二轮有了向量，闸便以余弦为主、字面为辅，线定在 0.50——那是按当时的向量模型
 * （text-embedding-v3）量的。
 *
 * 第三轮换了向量模型（qwen3.7-text-embedding-flash）并把西游、西方两轴各自 15 条
 * 扩到 89 与 126 条，于是上面两样都得重做：**余弦的绝对尺度随模型而变，旧线作废**；
 * 而「与策展相合」这个指标本身也作废了——扩池补进来的条目正是按母题检索挑的，
 * 每轴因此多出好几条一样切题的句子，策展人那唯一一条便不再是唯一正解，精确重合率
 * 机械地掉到 2.8%，而检出的是公孙龙「夫名，实谓也」（名与实）、「师作徒，徒作师，
 * 方可保全」（师徒）这一类——比旧的 44.4% 时还正。故改以逐条切题判官定线（0/1/2 三档，
 * 逐条判不并排比：并排比会让一条显眼的句子通吃）。
 *
 * 实测（策展三十六轴／当代七题二十一轴）：
 *
 * | 闸 | 策展出锚 | 切题 | 不切题 | 当代出锚 | 切题 |
 * |----|---------|------|--------|---------|------|
 * | 0.30 | 34 | 10 (29%) | 2 | 21 | 2 (10%) |
 * | 0.40 | 30 | 10 (33%) | 0 | 15 | 2 (13%) |
 * | **0.45** | **27** | **10 (37%)** | **0** | **9** | **2 (22%)** |
 * | 0.50 | 24 | 10 (42%) | 0 | 6 | 1 (17%) |
 *
 * 取 0.45，因它严格优于一切更低的线：切题数同是 10 条（放低只多出「勉强」，不多出
 * 切题），而不切题归零、当代题切题率最高。再高到 0.50，策展那边的百分比虽好看——
 * 那只是分母变小——当代题却实掉一条切题锚。
 *
 * 作参照：策展人手挑的那 36 条，同一判官判下来切题 9 条（25%）、不切题 2 条。
 * 即**系统检出的锚，比人手挑的那条评得更高**。所以这里要紧的不是追「与策展重合」，
 * 是追切题而不出错锚。
 *
 * 无向量时（未跑 embed 脚本、或 /api/embed 不通）退回第一轮那道纯字面闸。
 */
const SEM_BAR = 0.45;

export async function suggestAnchors(name: string, hint?: string): Promise<MotifAnchor[]> {
  const query = hint ? `${name} ${hint}` : name;
  // 向量只取一次，三轴共用：同一个题意，没有必要按轴各 embed 一遍
  const qVec = await embedQuery(query);
  // 检索用题名加题解（题解里的白话常能多搭上几个字），而把闸只架在题名上：
  // 题解是写给模型看的一句话，字面宽，拿它过闸等于没闸
  const nt = nameTerms(name);
  const out: MotifAnchor[] = [];
  for (const worldId of MOTIF_AXES) {
    const hit = retrieve(query, { worldId, limit: 1 }, qVec)[0];
    if (!hit) continue;
    const semOk = Boolean(qVec) && hit.sem >= SEM_BAR;
    if (!semOk && !solidlyHit(hit, nt)) continue;
    // 指法依世界而异，与 MotifAnchor 的约定同例：西游条目的 id 由抽取脚本的择句
    // 次序决定，改一次规则就全变，故记原句、由 resolveAnchor 回查；诸子与西方的
    // id 手定稳定，径指 id。此处记整句而非片段——片段是给策展人手写的便利，
    // 机器记无须省字，整句回查只会命中它自己。
    out.push(
      worldId === "xiyou"
        ? { worldId, quote: hit.text, note: SUGGESTED_NOTE }
        : { worldId, passageId: hit.id, note: SUGGESTED_NOTE },
    );
  }
  return out;
}

// —— 本家全文：自四库分片取某子自己那部书 ——
//
// `canon` 那 752 条是选本：带白话、带关键词，是挑过的，故检索质量高——但孔子答话时
// 能引的也就只有我们替他挑的那几十句。而《论语》全文就在 `public/siku/books/lunyu/`
// 里放着，与他无关。此处把两者接上：问到某子时取一次他自家那部书，选本与全文并入
// 一池检索。选本仍在，并不被全文淹没（见下「为何全文条目不给 keywords」）。
//
// 为何不直接读 `books/<id>/*.json`：《吕氏春秋》二十七章、《管子》八十八章，按章取
// 便是几十次请求。故预先切成「可引段落」，一书一文件（见 scripts/siku_quotable.py）。
//
// 哪几部书归哪位子，取自 `lineage.ts` 的 BOOKS，不另立表；只传不作的（《尚书》之于
// 孔子）已在抽取时排开——删定不是说话。

/** 可引段落文件的形状（scripts/siku_quotable.py 与 xiyou_dialogue.py 的共同产出）。 */
type QuotableFile = {
  bookId: string;
  title: string;
  author: string;
  authorIds: string[];
  /** 所属世界；诸子那边不写此字段，故缺省作 zhanguo（见 toPassages） */
  worldId?: string;
  items: { n: number; chapter: string; text: string }[];
};

type QuotableIndex = {
  bookId: string;
  title: string;
  authorIds: string[];
  worldId?: string;
  items: number;
  /** 以下四项由抽取时自四库 meta 抄来（西游那边的卷没有，故皆可缺） */
  author?: string;
  group?: string;
  category?: string;
  dynasty?: string;
  chapters?: number;
}[];

type AllQuotableIndex = {
  bookId: string;
  lineageId?: string;
  title: string;
  author: string;
  group: string;
  category: string;
  dynasty: string;
  chapters: number;
  items: number;
}[];

export type QuotableBookMeta = AllQuotableIndex[number];

/** 索引只取一次：它答的是「某子有无自家全文可取」，没有便不必白跑一趟 404。 */
let indexPromise: Promise<QuotableIndex> | null = null;
let allIndexPromise: Promise<AllQuotableIndex> | null = null;

function loadIndex(): Promise<QuotableIndex> {
  if (!indexPromise) {
    indexPromise = fetch(asset("/siku/quotable/index.json"))
      .then((r) => (r.ok ? (r.json() as Promise<QuotableIndex>) : []))
      .catch(() => []);
  }
  return indexPromise;
}

function loadAllIndex(): Promise<AllQuotableIndex> {
  if (!allIndexPromise) {
    allIndexPromise = fetch(asset("/siku/quotable-all/index.json"))
      .then((r) => (r.ok ? (r.json() as Promise<AllQuotableIndex>) : []))
      .catch(() => []);
  }
  return allIndexPromise;
}

/** 已取到的书：书 id → 段落。同书只取一次，取不到也记一笔（空数组），不反复重试。 */
const bookCache = new Map<string, Passage[]>();
const inflight = new Map<string, Promise<Passage[]>>();

/**
 * 把一书的可引段落转成 `Passage`。
 *
 * `gloss` 留空、`keywords` 留空，都是有意的：
 *   - 白话是一句一句译出来的，全文八千余段不可能预先都译；界面遇空白话即不显
 *     「——白话」那一行，要看白话另有一键（见 SikuMarginalia 的译白话）。
 *   - 不给关键词，则全文段落在同一池里永在选本之下（选本每词 6 分，全文只能靠原文
 *     命中每词 2 分）。此事今已不碍：界面改作全文为主，全文自成一池、单检单排
 *     （`retrieveIn`），不与选本比分。两栏仍用同一个打分函数，分照面可比。
 *
 * 非正文者在此剔去（提要、凡例、目录、篇解、注释）：抽取时把四库页面上编者的话
 * 与原文一并收了，于是检「哲学」能检出「《老子》书提出以『道』为核心的哲学思想
 * 体系」，检「公元前」能检出《公孙龙子》的内容提要——既说「用全文」，全文就该是
 * 原文。凭的是形迹而非字眼：字眼不可凭（「封建」在《吕氏春秋》正文里就有「其封
 * 建眾者」，「唯心」在《文子》里是「其唯心行也」），形迹则可——
 *   - 章名即书全题者，是题下序说（《道德经》二十二条、《论语》二十三条「史记世家
 *     曰」云云）。须另加一条「此书章数不止一」：《六韬》《邓析子》《孝经》整部
 *     只一个章名，就是书名，正文全在其下，一概剔去便剔空了一部书。
 *   - 正文以「（一）」「（12）」起者，是注（《孙膑兵法》三百七十二条）。
 *   - 正文以「本篇」「此篇」起者，是篇解（「本篇论述…故以『行篡』为篇名」）。
 * 二十六部一万一千五百十三段，依此剔去六百〇一段（5.2%），剩一万〇九百十二段。
 * 逐部核过，无一条误伤正文。
 *
 * 这只是界面这一侧的补救。正办是抽取时就不收编者的话——四库页面上提要与原文本是
 * 分开的两块（见 scripts/siku_quotable.py）。
 *
 * `worldId` 须照文件所标：`retrieve()` 按世界筛检索域，若一概作 zhanguo，悟空取来的
 * 一千九百句对白会被当作战国的东西，在他自己的检索里一条也落不下来。
 */
/** 章名一望即知非正文者 */
const NON_TEXT_CHAPTERS = new Set(["凡例", "提要", "序", "叙", "跋", "目录", "校记", "说明", "前言", "序言", "出版说明"]);
/** 注：以「（1）」「（一）」起 */
const NOTE_HEAD = /^[（(]\s*[0-9０-９一二三四五六七八九十]+\s*[）)]/;
/** 篇解：以「本篇」「此篇」起。古书不自称「本篇」。 */
const EXPL_HEAD = /^(本篇|本章|此篇|本书|此书|本卷)/;

/**
 * 章名收空格：「任 法 第 四 十 五」→「任法第四十五」。
 *
 * 四库那边的页面把篇题逐字排开，抽取时照收了。既以全文为主，这一行便是读者眼里
 * 的出处，不能这样示人。只收「通篇皆单字」者：《论语》的「卷一 为政第二」那个
 * 空格是分卷与篇，收了反成「卷一为政第二」，更不像话。
 */
function tidyChapter(ch: string): string {
  const parts = ch.trim().split(/\s+/);
  if (parts.length < 2) return ch.trim();
  return parts.every((x) => [...x].length === 1) ? parts.join("") : ch.trim();
}

/**
 * @param kw 每段关键词，与 `f.items` 同序等长（见 sikuTerms.loadBookKeywords）。
 *   取不到时传空数组，各段 keywords 便照旧留空，检索退回纯子串命中。
 */
function toPassages(f: QuotableFile, kw: string[][] = []): Passage[] {
  const speaker = f.authorIds[0] ?? "";
  // 整部只一个章名者，那章名纵与书名同也是正文（《六韬》《邓析子》《孝经》）
  const multiChapter = new Set(f.items.map((it) => it.chapter)).size >= 2;
  return f.items
    .map((it, i) => ({
      id: `siku:${f.bookId}:${it.n}:${i}`,
      // 书名去副题：分片题作《道德经（老子）》，而图谱节点（lineage.ts 的 BOOKS）
      // 作《道德经》。既以全文为主，出处与书环节点的名就全由此出，两边口径须一致
      // ——否则检索面建出一个《道德经（老子）》的书节点，配不上全图里那个《道德经》，
      // 学派颜色也落到兜底的那一色。二十六部里只此一部带副题。
      book: stripSubtitle(f.title),
      chapter: tidyChapter(it.chapter),
      owner: speaker,
      text: it.text,
      gloss: "",
      // 离线抽出的词，下标与此处的 i 同源（见 siku_terms.py 的 kw 等长之约）。
      // 词是折简的，正文不是——折法属检索，原文永不改写。
      keywords: kw[i] ?? [],
      workId: f.bookId,
      worldId: f.worldId || "zhanguo",
      locus: tidyChapter(it.chapter),
    }))
    // 先编号后剔除：id 里那个序号照原文件之位，剔不剔都不动，外头记下的 id 不会错位
    .filter((p) => {
      const ch = p.chapter.trim();
      const t = p.text.trim();
      if (NON_TEXT_CHAPTERS.has(ch)) return false;
      if (multiChapter && ch === f.title) return false;
      if (NOTE_HEAD.test(t) || EXPL_HEAD.test(t)) return false;
      return true;
    });
}

/**
 * 取某子自家那部（或那几部）书的可引段落。
 *
 * 服务端渲染时直接返回空数组：这是运行期的补充语料，不该让首屏等它。
 * 取不到（未抽取、未上传、网络不通）也返回空数组，检索便退回那 752 条选本——
 * 少引几句，不至于答不上话。
 */
/**
 * 取一部书的可引段落。取过便留在 `bookCache` 里，同书不取第二遍；取不到也记一笔
 * （空数组），不反复重试。按著者取（`loadOwnWorks`）与按书取（`loadBookWorks`）
 * 共用此一处，故两路用的是同一份缓存，不会同书各存一份。
 */
function fetchBook(bookId: string): Promise<Passage[]> {
  const cached = bookCache.get(bookId);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(bookId);
  if (pending) return pending;
  // 正文与每段关键词并行取：两份文件一一对应，段落一成形便已带词，
  // 不必等第二趟再回填。词权总表（九十余 K，二十六部共用）顺带也起个头，
  // 它迟到不碍事——未到之前 termWeight 一律返回 1。
  void loadTermDict();
  const p = Promise.all([
    fetch(asset(`/siku/quotable/${bookId}.json`)).then(async (r) =>
      r.ok ? ((await r.json()) as QuotableFile) : null,
    ),
    loadBookKeywords(bookId),
  ])
    .then(([file, kw]) => (file ? toPassages(file, kw) : ([] as Passage[])))
    .catch(() => [] as Passage[])
    .then((ps) => {
      bookCache.set(bookId, ps);
      inflight.delete(bookId);
      return ps;
    });
  inflight.set(bookId, p);
  return p;
}

/**
 * 完整书库的按书证据文件。它是从原书各处均匀抽出的发现片段，不替代完整正文；
 * 关系引用只在真的用到这部书时取这一份，不会把 1002 部一并送进浏览器。
 */
function fetchAnyBook(bookId: string): Promise<Passage[]> {
  const cached = bookCache.get(bookId);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(bookId);
  if (pending) return pending;
  const p = fetch(asset(`/siku/quotable-all/${bookId}.json`))
    .then(async (r) => (r.ok ? toPassages((await r.json()) as QuotableFile) : []))
    .catch(() => [] as Passage[])
    .then((ps) => {
      bookCache.set(bookId, ps);
      inflight.delete(bookId);
      return ps;
    });
  inflight.set(bookId, p);
  return p;
}

/** 世界文学代表作的均匀抽样证据；一书一文件，避免评议时逐章发起数十次请求。 */
function fetchWorldBook(bookId: string): Promise<Passage[]> {
  const key = `worldlit:${bookId}`;
  const cached = bookCache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = fetch(asset(`/worldlit/quotable/${bookId}.json`))
    .then(async (r) => (r.ok ? toPassages((await r.json()) as QuotableFile) : []))
    .catch(() => [] as Passage[])
    .then((ps) => {
      bookCache.set(key, ps);
      inflight.delete(key);
      return ps;
    });
  inflight.set(key, p);
  return p;
}

export async function loadOwnWorks(scholarId: string): Promise<Passage[]> {
  if (typeof window === "undefined" || !scholarId) return [];
  const persona = scholarMap[scholarId];
  const workIds = persona?.workIds ?? [];
  if (workIds.length) {
    const west = (persona.retrievalWorldId ?? persona.worldId) === "west";
    const got = await Promise.all(workIds.map((id) => west ? fetchWorldBook(id) : fetchAnyBook(id)));
    // 代表作证据归到当前人格名下，才能通过 onlyOwner 的知识边界筛选。
    return got.flat().map((p) => ({ ...p, owner: scholarId }));
  }
  const index = await loadIndex();
  const mine = index.filter((e) => e.authorIds.includes(scholarId));
  if (mine.length === 0) return [];
  const got = await Promise.all(mine.map((e) => fetchBook(e.bookId)));
  return got.flat();
}

/** 某子有无自家全文可取——界面若要标「引自全文」之类，据此判断。 */
export async function hasOwnWorks(scholarId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if ((scholarMap[scholarId]?.workIds?.length ?? 0) > 0) return true;
  return (await loadIndex()).some((e) => e.authorIds.includes(scholarId));
}

/** 题名去著者小注：「道德经（老子）」→「道德经」，与 lineage.ts 的 `name` 相对。 */
function stripSubtitle(title: string): string {
  return title.replace(/（[^）]*）\s*$/, "").trim();
}

/**
 * 按书取可引段落——典籍图谱的书节点用这一路。
 *
 * 为何不按著者取（即不用 `loadOwnWorks`）：著者与书在图谱里并非一一对应。公共
 * 典籍那几部「著者取关系最深者，非独撰」（见 lineage.ts 的 BOOKS），《尚书》
 * 的 authorId 记作 kong、《大学》记作 zengzi，按著者取便把《论语》《孝经》的
 * 全文挂到《尚书》《大学》名下——张冠李戴，比空着坏。
 *
 * 故以书名为准：索引里的题名带著者小注（「道德经（老子）」），去掉括号那段正与
 * BOOKS 的 `name` 相合，二十六部分片由此各归其书。对不上的（苏子、张子、惠子、
 * 邹子、子思子、周易、尚书、杨子、神农之言、大学这十个节点本无分片）返回空数组，
 * 检索便仍只凭选本——与接通之前无异。
 */
export async function loadBookWorks(nameOrBookId: string): Promise<Passage[]> {
  if (typeof window === "undefined" || !nameOrBookId) return [];
  const key = nameOrBookId.replace(/^目:/, "").replace(/[《》]/g, "").trim();
  if (!key) return [];
  const [index, allIndex] = await Promise.all([loadIndex(), loadAllIndex()]);
  const legacy =
    index.find((e) => e.bookId === key) ??
    index.find((e) => stripSubtitle(e.title) === key) ??
    index.find((e) => stripSubtitle(e.title).includes(key));
  if (legacy) return fetchBook(legacy.bookId);
  const hit =
    allIndex.find((e) => e.bookId === key || e.lineageId === nameOrBookId) ??
    allIndex.find((e) => stripSubtitle(e.title) === key) ??
    allIndex.find((e) => stripSubtitle(e.title).includes(key));
  return hit ? fetchAnyBook(hit.bookId) : [];
}

/** 供知识边界判断使用：按正文 id、谱系 id 或题名取得书级朝代元数据。 */
export async function loadBookMeta(nameOrBookId: string): Promise<QuotableBookMeta | undefined> {
  if (typeof window === "undefined" || !nameOrBookId) return undefined;
  const key = nameOrBookId.replace(/^目:/, "").replace(/[《》]/g, "").trim();
  const allIndex = await loadAllIndex();
  return allIndex.find((e) => e.bookId === key || e.lineageId === nameOrBookId)
    ?? allIndex.find((e) => stripSubtitle(e.title) === key)
    ?? allIndex.find((e) => stripSubtitle(e.title).includes(key));
}

/**
 * 诸子那边全部可引段落——不限书的检索用这一路（典籍图谱的检索面、首页引典栏、
 * 思想节点）。
 *
 * 二十六部合三百余万字，故只取一次，取过便留在 `allWorksPromise` 里。界面用法
 * 仍是「选本即时出一版，全文到了再覆盖」——与 `embedQuery` 那个两步同一个道理
 * （见 page.tsx 引典检索处注），所以第一次检索等这一趟网络不至于空屏。
 *
 * 西游那边的十五卷不在其内：那是对白，不是诸子的书，且 `retrieve` 按世界筛域时
 * 本就会把它们滤掉，取来白费一趟。
 */
let allWorksPromise: Promise<Passage[]> | null = null;

export function loadAllWorks(): Promise<Passage[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  if (!allWorksPromise) {
    allWorksPromise = loadIndex()
      .then((index) =>
        Promise.all(
          index.filter((e) => (e.worldId || "zhanguo") === "zhanguo").map((e) => fetchBook(e.bookId)),
        ),
      )
      .then((got) => got.flat())
      .catch(() => []);
  }
  return allWorksPromise;
}

/** 诸子名下而四库正文已切的一部书（典籍架照此列书）。 */
export type ScholarBook = {
  bookId: string;
  /** 四库目录的题名，如《道德经（老子）》——与入四库后所见一致，不另拟显示名 */
  title: string;
  /** 著者 id（即 scholarId），取自 lineage.ts 的 BOOKS */
  authorIds: string[];
  /** 四库所题著者，如「管仲（旧题）」。scholarMap 认得其人时以人名为先，认不得才用此 */
  author: string;
  group: string;
  category: string;
  dynasty: string;
  chapters: number;
  /** 可引段数，约略见其厚薄 */
  items: number;
};

/**
 * 取「诸子有的这些书」——即十家名下而四库正文已切者。
 *
 * 为何不另立一张书单：这份名单本是 `lineage.ts` 的 BOOKS 与四库可读目录的交集，
 * 抽取时（scripts/siku_quotable.py）已经算过一遍并落成索引。界面再抄一份，加一部
 * 书便要改两处，早晚不一致。
 *
 * 为何不取 catalog.json：那是全库一千余部的目录，百余 KB；此处只要二十余部的部类
 * 章数，故抽取时顺手把 meta 的那几项抄进索引（七 KB），一次请求便够。
 *
 * 西游那边的卷同在这份索引里，按 `worldId` 排开——那是对白，不是诸子的书。
 */
export async function loadScholarBooks(): Promise<ScholarBook[]> {
  if (typeof window === "undefined") return [];
  return (await loadIndex())
    .filter((e) => (e.worldId || "zhanguo") === "zhanguo")
    .map((e) => ({
      bookId: e.bookId,
      title: e.title,
      authorIds: e.authorIds,
      author: e.author ?? "",
      group: e.group ?? "",
      category: e.category ?? "",
      dynasty: e.dynasty ?? "",
      chapters: e.chapters ?? 0,
      items: e.items,
    }));
}
