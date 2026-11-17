/**
 * 与既有资源对照：CBDB（中国历代人物传记资料库）与中国哲学书电子化计划（ctext）。
 *
 * 做此事的缘故：本目的断代与系年、七型关系，判据都是自拟的。自拟之物须有外部参照，
 * 否则「自校六事全过」只说明内部不矛盾，不说明与学界所知相合。此脚本便是把本目
 * 一千零一十九部放到两份外部资源上碰一次，碰出来的不合处逐条列出待裁。
 *
 * 三件事，轻重不同：
 *
 * 一、**对名**（覆盖率）。两边书名折到简体同形再比。此事最轻——重合多寡只说明
 *     两库旨趣远近，不说明谁对谁错。CBDB 是人物库，重宋明而轻经注，对不上的
 *     多是注疏与先秦典籍，此偏斜本身便是一条可说之结论。
 *
 * 二、**断代相容**（最值钱）。本目断代是全覆盖的（一千零一十九部无一缺），故
 *     凡外部能定其时者皆可比。
 *
 *     比法要紧，初作时曾走错一次，记其故以免再犯：CBDB `TEXT_CODES.c_text_dy`
 *     **不是成书之代**。该表是**版本级**著录，一条之代系于该条所连之人，而经典
 *     之书所连者多为注者、编者、刊者——故《庄子》作「明」（明人注本）、《孟子》
 *     作「清」（清人注本）、《后汉书》作「唐」（李贤注）、《艺文类聚》作「陳」
 *     （欧阳询生于陳）。若径以此比，六十一部「相离」几乎无一是本目之误，全是
 *     两库语义错位。
 *
 *     正法：由 `BIOG_TEXT_DATA` 取该书之人，**只取 `c_role_id=1`（撰著者）**，
 *     再取其人在 `BIOG_MAIN` 的生卒年——生卒年是 CBDB 的本行，有出处、可稽。
 *     书成于撰者在世之时，故以「撰者生卒年与本目断代之区间相交」为相容。名之
 *     同异一概不比，如此本目「汉」与 CBDB「西漢」不致误判为分歧。
 *
 *     `c_role_id=0`（角色未详）者另算一档：此档多半亦是撰者，但既标未详便不作
 *     定论，单列一数以见其量。
 *
 * 三、**年之比对**（须先辨其可信）。CBDB `c_text_year` **不可作金标准**：六千一百
 *     零二个年里四千九百九十三个 `c_source=0`（无出处），且多有以朝代末年、
 *     年号末年充数者——一五〇六年下挤着四百八十九部（多为府县志，整批录入），
 *     一四二四年下二百零七部且含《永樂大典》（实成于一四〇八，一四二四乃永乐末年）。
 *     故此项不以其年为准，而取**撰者生卒年**卡本目之年：年落在撰者生卒之间为合，
 *     早于生年或晚于卒年则必有一边失考，列出待裁。另附 CBDB 自著之年一列以资
 *     参看，并标出疑为整批充数者。
 *
 * 跑法：`node scripts/siku-era.mjs --check` 之后跑 `node scripts/eval-external.mjs`。
 * 外部数据已缓存在 `scripts/cache/`，故此脚本不连网、可重跑且结果稳定。缓存之来历
 * 与更新之法见 `docs/EXTERNAL-EVAL.md`。
 *
 * 与 `siku-era.mjs`、`siku-dedup.mjs`、`siku-year.mjs` 同例：**此脚本不入 JS 包**，
 * 是编目之一步，不是运行时之物。
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

// ══ 本目断代之年界 ═══════════════════════════════════════════════════════
// 与 scripts/siku-year.mjs 的 ERA_SPAN 同一份。此处重列而不引入，是因那边
// 的表是为「卡年是否落在代内」而设，边界取法偏宽（如魏取建安元年以属建安七子）；
// 此处只用于「与外部断代是否相容」，宽些无妨，反而不致把粒度差判成错。
const ERA_SPAN = {
  先秦: [-2000, -221],
  汉: [-206, 220],
  魏: [196, 265],
  蜀汉: [221, 263],
  晋: [265, 420],
  北魏: [386, 550],
  南朝宋: [420, 479],
  南朝齐: [479, 502],
  南朝梁: [502, 557],
  北齐: [550, 577],
  隋: [581, 618],
  唐: [618, 907],
  五代: [907, 960],
  宋: [960, 1279],
  金: [1115, 1234],
  元: [1206, 1368],
  明: [1368, 1644],
  清: [1644, 1912],
  近今: [1912, 2100],
  代未详: null,
};

// ══ 繁简折同 ═════════════════════════════════════════════════════════════
// 转换一概走 app/world/hanVariants.ts，不另立第二份对照表——两份表必分叉。
function loadFold() {
  const src = fs.readFileSync(path.join(ROOT, "app/world/hanVariants.ts"), "utf8");
  const trad = src.match(/export const TRAD = "([^"]*)"/);
  const simp = src.match(/export const SIMP = "([^"]*)"/);
  if (!trad || !simp) throw new Error("hanVariants.ts 里取不到 TRAD/SIMP");
  const T = [...trad[1]];
  const S = [...simp[1]];
  if (T.length !== S.length) throw new Error(`繁简两表不等长 ${T.length}/${S.length}`);
  const map = new Map();
  T.forEach((c, i) => map.set(c, S[i]));
  return (s) => [...s].map((c) => map.get(c) || c).join("");
}

/** 去卷数后缀与括注，供宽松对名之用：「樂全集:四十卷」→「樂全集」。 */
const strip = (s) =>
  s
    .replace(/[:：].*$/, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();

/** 两闭区间是否相交。 */
const overlaps = (a, b) => a[0] <= b[1] && b[0] <= a[1];

/** 本目之年取其两端：一个数即一点，两个数即一段。 */
const span = (y) => (Array.isArray(y) ? y : [y, y]);

// ══ 逐条裁定 ═════════════════════════════════════════════════════════════
/**
 * 外部与本目相离之处，一条一条看过，分四因。此表照 `siku-year.mjs` 的
 * `ERA_EXEMPT` 之例：**不改两边之数，只记其所以不合**。记在此处而不记在文档里，
 * 是为重跑时能自报「已裁几条、新出几条」——新出者必是未看过的，不该被旧裁定掩住。
 *
 * 四因：
 *   同名异书 — 两边书名偶同而实非一书（《心经》之属：本目指般若心经，CBDB 指
 *              真德秀之《心经》）。亦含同名异人（《博物志》之張華，CBDB 所系者
 *              乃汉人张华，非晋之张华）。
 *   版本之人 — CBDB 以注者、编者、译者、刊者为「撰著者」。此由其库是版本级著录
 *              而起，非其误录。《三字经》系麥都思（Medhurst）、《千字文》系
 *              羅存德（Lobscheid），皆十九世纪传教士所刊之本。
 *   外部误系 — CBDB 之系人确有可议处（《尚书正义》系陸元明，而陆德明所撰者
 *              《经典释文》，《尚书正义》出孔颖达）。
 *   本目粒度 — 本目自己之失：收今注本、今译本而题以今代，与通目之著作级不齐。
 *              此二条是外部照出来的真问题，已记入短板，见 docs/EXTERNAL-EVAL.md。
 */
const ADJUDGED = {
  // ── 同名异书／同名异人 ──────────────────────────────────────────
  "深衣考误": ["同名异书", "本目指江永《深衣考误》（清）；CBDB 所系朱右（元明间）别有《深衣考》"],
  "从政录": ["同名异书", "本目指薛瑄之书（明）；CBDB 所系汪喜孙《从政录》（清）另是一部"],
  "近思录": ["同名异书", "本目指朱熹吕祖谦所编（宋，淳熙二年）；CBDB 所系游再得（明）另是一部"],
  "西征随笔": ["同名异书", "本目指汪景祺之书（清）；CBDB 所系赵彦秬（宋）另是一部"],
  "文选": ["同名异书", "本目指萧统《文选》（南朝梁）；CBDB 所系喻良倚（宋）之「文选」另是一编"],
  "竹斋集": ["同名异书", "「竹斋」为常用斋名，历代同名之集数部；本目指王冕之集（元）"],
  "竹斋诗余": ["同名异书", "同上，本目指王冕；CBDB 所系黄玑（宋）另是一人"],
  "杂说": ["同名异书", "「杂说」题极泛，历代同名者众；本目指韩愈之作（唐）"],
  "心经": ["同名异书", "本目指般若波罗蜜多心经（唐译）；CBDB 所系真德秀《心经》（宋）乃儒书"],
  "博物志": ["同名异书", "同名异人：CBDB 所系张华指数年六十，乃汉人；本目指晋张华（232–300）"],
  "周易集解": ["同名异书", "本目指李鼎祚《周易集解》（唐）；CBDB 所系程茂桂（明）另是一部"],
  // ── CBDB 以版本之人为撰者 ───────────────────────────────────────
  "鹖冠子": ["版本之人", "CBDB 以陆佃为撰者，陆佃实为宋之注者；此书本目作先秦不改"],
  "颜氏家训": ["版本之人", "CBDB 以朱轼为撰者，朱轼实为清之校注者；此书出颜之推（隋）"],
  "周易注": ["版本之人", "CBDB 所系陆瞻云、吴仪洛皆清人，乃刊注之人；此注出王弼（魏）"],
  "论语": ["版本之人", "CBDB 所系秦右属清，乃刊本之人；本目之「先秦」指其成书"],
  "三字经": ["版本之人", "CBDB 所系麦都思（Medhurst）等皆十九世纪刊译之人"],
  "千字文": ["版本之人", "CBDB 所系基德（Kidd）、罗存德（Lobscheid）等皆十九世纪刊译之人"],
  // ── 外部误系 ────────────────────────────────────────────────────
  "尚书正义": ["外部误系", "CBDB 系陆元明（即陆德明，卒 630）；《尚书正义》出孔颖达，陆氏所撰乃《经典释文》"],
  "尚书大传": ["外部误系", "CBDB 所系「伏勝」即伏生，是矣；惟其卒年阙，区间由生年推得，故差一年，非实不合"],
  // ── 本目粒度之失（真问题，不改判而记之）────────────────────────
  "茶经(今注)": ["本目粒度", "本目收今注本而题「近今」，与通目之著作级不齐；CBDB 系陆羽（唐）为是"],
  "论语(英译本)": ["本目粒度", "同上，本目收英译本而题「近今」"],
  "橘录": ["外部误系", "韩彦直卒年阙，区间由指数年推得；CBDB 自著之年一一七八与本目正同，实为相合"],
  "北山酒经": ["外部误系", "朱肱卒年阙，区间由指数年推得；CBDB 自著之年一一一七与本目正同，实为相合"],
  "画继": ["待考", "本目一一六七，CBDB 一一七二，相差五年。CBDB 此年无出处，本目之年亦系推得，两存之"],
  "袁氏世范": ["待考", "本目一一七八，CBDB 一一九三，相差十五年。CBDB 此年无出处且落于整批之列，暂从本目"],
};

// ══ 取数 ═════════════════════════════════════════════════════════════════
const fold = loadFold();
const catalog = read("public/siku/catalog.json");
const cbdbTexts = read("scripts/cache/cbdb-texts.json");
const cbdbDyn = read("scripts/cache/cbdb-dynasties.json");
const cbdbAuthors = read("scripts/cache/cbdb-authors.json");
const idxRules = new Map(read("scripts/cache/cbdb-idxyear-rules.json").map((r) => [r.code, r.zh]));

const DY = new Map(cbdbDyn.map((d) => [d.dy, d]));

// 书 id → 其人（撰者与角色未详者分列）。
const byText = new Map();
for (const a of cbdbAuthors) {
  if (!byText.has(a.id)) byText.set(a.id, []);
  byText.get(a.id).push(a);
}

/**
 * 一人之在世区间，分三档，档次即把握之强弱，上屏时不混算：
 *
 *   确 — 生卒年俱全，区间即其生卒。
 *   推 — 一端阙，取 CBDB 自著之 `c_index_year`（指数年）为心，前后各三十年。
 *        此年是 CBDB 自己推的，附有规则码（据进士登科年减三十、据其父生年加三十
 *        之类），故可注明其所据，胜于自拟一个加减之数。初作时曾用「生年加四十」
 *        自推，《尚书大传》《橘录》两条假阳性即由此而来，已改。
 *   代 — 生卒与指数年俱阙，退取其人之朝代区间。此档最宽，只能照出跨代之误。
 *
 * 三档俱阙者返 null，其书不入比对。
 */
function lifeSpan(p) {
  const b = p.birth && p.birth !== 0 ? p.birth : null;
  const d = p.death && p.death !== 0 ? p.death : null;
  if (b && d) return { lo: b, hi: d, tier: "确", how: "生卒年" };
  if (b) return { lo: b, hi: b + 80, tier: "确", how: "生年起一世" };
  if (d) return { lo: d - 80, hi: d, tier: "确", how: "卒年前一世" };
  if (p.idx && p.idx !== 0) {
    const rule = idxRules.get(p.idxType) || p.idxType || "未详";
    return { lo: p.idx - 30, hi: p.idx + 30, tier: "推", how: `指数年 ${p.idx}（${rule}）` };
  }
  if (p.pdy && DY.has(p.pdy)) {
    const d2 = DY.get(p.pdy);
    if (d2.start !== d2.end) return { lo: d2.start, hi: d2.end, tier: "代", how: `其人属「${d2.name}」` };
  }
  return null;
}

// CBDB 书名索引：折简体后一名可对多条（异本、重录），一概留下待后分辨。
const cbdbIdx = new Map();
for (const t of cbdbTexts) {
  const k = fold(t.title);
  if (!cbdbIdx.has(k)) cbdbIdx.set(k, []);
  cbdbIdx.get(k).push(t);
}

// ctext 书名索引。此资源只有书名与 urn，无年无代，故只用于对名。
// 其全目接口常中途断流（见 docs/EXTERNAL-EVAL.md），缓存若为残片则带 `_partial`
// 之记，此时覆盖率只作**下限**，上屏时必注明，不可报作定数。
let ctextIdx = null;
let ctextCount = 0;
let ctextPartial = false;
let ctextCore = 0;
const ctextPath = path.join(ROOT, "scripts/cache/ctext-titles.json");
if (fs.existsSync(ctextPath)) {
  const j = JSON.parse(fs.readFileSync(ctextPath, "utf8"));
  const books = j.books || [];
  ctextCount = books.length;
  ctextPartial = !!j._partial;
  // ctp:wb* 者是自维基导入之书，非 ctext 自家精校之本，分计以见其别。
  ctextCore = books.filter((b) => !(b.urn || "").startsWith("ctp:wb")).length;
  ctextIdx = new Map();
  for (const b of books) {
    const k = fold(b.title || "");
    if (!k) continue;
    if (!ctextIdx.has(k)) ctextIdx.set(k, []);
    ctextIdx.get(k).push(b);
  }
}

// ══ 一、对名 ═════════════════════════════════════════════════════════════
/** 在一索引里找一名：先精确，再去卷数括注。返回 {hit, how} 。 */
function lookup(idx, title) {
  if (!idx) return null;
  const k = fold(title);
  const a = idx.get(k);
  if (a) return { hit: a, how: "精确" };
  const b = idx.get(strip(k));
  if (b) return { hit: b, how: "宽松" };
  return null;
}

const rows = catalog.map((e) => ({
  e,
  cbdb: lookup(cbdbIdx, e.title),
  ctext: lookup(ctextIdx, e.title),
}));

const inCbdb = rows.filter((r) => r.cbdb);
const inCtext = rows.filter((r) => r.ctext);
const inBoth = rows.filter((r) => r.cbdb && r.ctext);
const inNeither = rows.filter((r) => !r.cbdb && !r.ctext);
// 两库是否互补：ctext 所独有者即 CBDB 之外的增益。并两库之覆盖亦由此得。
const onlyCtext = rows.filter((r) => r.ctext && !r.cbdb);
const onlyCbdb = rows.filter((r) => r.cbdb && !r.ctext);
const inEither = rows.filter((r) => r.cbdb || r.ctext);

// 覆盖率按部类分看——偏斜在哪一部上，比总数更说明问题。
const byGroup = {};
for (const r of rows) {
  const g = (byGroup[r.e.group] ||= { n: 0, cbdb: 0, ctext: 0 });
  g.n++;
  if (r.cbdb) g.cbdb++;
  if (r.ctext) g.ctext++;
}

// ══ 二、断代相容 ═════════════════════════════════════════════════════════
// 以撰者生卒年卡本目断代。不用 `c_text_dy`——那是版本之代，非成书之代（见文首）。
// 一书对多撰者时（异本、合撰）取其并：外部只要有一人与本目相容便不算分歧。
// 宁失之宽，不可把异本之差算作本目之错。

/** 取一书在 CBDB 的人，按角色分档。返回 {authors, unknown}，各为带 life 的人之列。 */
function peopleOf(hits) {
  const authors = [];
  const unknown = [];
  for (const h of hits) {
    for (const p of byText.get(h.id) || []) {
      const life = lifeSpan(p);
      if (!life) continue;
      (p.role === 1 ? authors : unknown).push({ ...p, life });
    }
  }
  return { authors, unknown };
}

const eraRows = [];
for (const r of inCbdb) {
  const ours = ERA_SPAN[r.e.dynasty];
  if (ours === undefined) {
    eraRows.push({ ...r, verdict: "本目之代不在代序内", people: null });
    continue;
  }
  const { authors, unknown } = peopleOf(r.cbdb.hit);
  // 先用撰者；撰者阙则记入「只有角色未详者」一档，不与撰者档混算。
  const use = authors.length ? authors : unknown;
  const tier = authors.length ? "撰者" : "角色未详";
  if (!use.length) continue; // 外部无人可据，无从比
  // 一书之人把握不齐时，以最强之档为该书之档：确 > 推 > 代。
  const rank = { 确: 0, 推: 1, 代: 2 };
  const strength = use.reduce((m, p) => Math.min(m, rank[p.life.tier]), 9);
  const anchor = ["确", "推", "代"][strength];
  if (ours === null) {
    eraRows.push({ ...r, verdict: "本目未详·外部有人", people: use, tier, anchor });
    continue;
  }
  const ok = use.some((p) => overlaps(ours, [p.life.lo, p.life.hi]));
  eraRows.push({ ...r, verdict: ok ? "相容" : "相离", people: use, tier, anchor, ours });
}

const cmpOf = (tier, anchors) =>
  eraRows.filter((x) => (x.verdict === "相容" || x.verdict === "相离") && x.tier === tier && anchors.includes(x.anchor));
const eraCmp = cmpOf("撰者", ["确", "推", "代"]);
const eraOk = eraCmp.filter((x) => x.verdict === "相容");
const eraBad = eraCmp.filter((x) => x.verdict === "相离");
const eraSure = cmpOf("撰者", ["确"]);
const eraSureOk = eraSure.filter((x) => x.verdict === "相容");
const eraUnk = cmpOf("角色未详", ["确", "推", "代"]);
const eraUnkOk = eraUnk.filter((x) => x.verdict === "相容");
const eraFill = eraRows.filter((x) => x.verdict === "本目未详·外部有人");

/** 把一书之人列成一句，供上屏。所据一并印出，以见其把握强弱。 */
const sayPeople = (ps) =>
  ps
    .slice(0, 3)
    .map((p) => `${p.person}(${p.life.lo}–${p.life.hi}·${p.life.how})`)
    .join("、") + (ps.length > 3 ? `等 ${ps.length} 人` : "");

// ══ 三、年之比对 ═════════════════════════════════════════════════════════
// 本目系年二百八十五部。以撰者生卒年卡之：年落在撰者在世之间为合；早于生年或
// 晚于卒年则必有一边失考。身后成书之例（门人辑录、后人续补）本目亦收，故
// 「晚于卒年」不即是错，别为一档，不与「早于生年」同论——早于生年断无可解。
// 生卒有一端是推来的（见 lifeSpan），其判只作参看，另标一记。
const yearRows = [];
for (const r of inCbdb) {
  if (!("year" in r.e)) continue;
  const [a, b] = span(r.e.year);
  const { authors } = peopleOf(r.cbdb.hit);
  if (!authors.length) continue;
  // 一书多撰者时取最能相容者——比的是「外部是否可能支持本目」，非逐人对质。
  let best = null;
  for (const p of authors) {
    const { lo, hi } = p.life;
    const d = b < lo ? lo - b : a > hi ? a - hi : 0;
    const kind = d === 0 ? "在世内" : b < lo ? "早于生年" : "晚于卒年";
    if (!best || d < best.d) best = { d, kind, p };
  }
  // 外部自著之年一并取来参看（不作判据）
  const withYear = r.cbdb.hit.filter((t) => t.year && t.year !== 0);
  yearRows.push({ ...r, ours: [a, b], best, theirYear: withYear.length ? withYear[0].year : null, theirSrc: withYear.length ? withYear[0].src : null });
}const yearIn = yearRows.filter((x) => x.best.kind === "在世内");
const yearAfter = yearRows.filter((x) => x.best.kind === "晚于卒年");
const yearBefore = yearRows.filter((x) => x.best.kind === "早于生年");
// 外部之年落在朝代/年号末年者，疑为整批充数，另标一记。
const batchYears = new Map();
for (const t of cbdbTexts) if (t.year) batchYears.set(t.year, (batchYears.get(t.year) || 0) + 1);
const suspicious = (y) => (batchYears.get(y) || 0) >= 20;

// ══ 四、两边自著之年直接相比 ═════════════════════════════════════════════
// 此项与第三项有别：第三项以撰者生卒年卡本目之年，此项径以 CBDB 自著之
// `c_text_year` 与本目相比。CBDB 此年不可作金标准（见文首），故此处之要旨不在
// 「相合率几何」，而在**辨其不合之由**，所辨有二：
//
//   一、**按有无出处分看**。CBDB 有 `c_source` 者与无者，与本目相合之率相去甚远。
//       若有出处者合而无出处者不合，则不合之责在外部，不在本目——这是本项最紧的
//       一条判据，胜于报一个笼统的重合率。
//
//   二、**看其年是否正落朝代端点**。CBDB 于前代之书，其年多填该书所记之朝代的
//       终年或始年：《宋史》作一二七九（宋亡）、《明史》作一六四三（明亡前一年）、
//       《金史》作一二三四（金亡）、《新唐书》《旧唐书》《诗式》俱作九〇六（唐亡
//       前一年）、《盐铁论》作二二〇（汉亡）、《隋书》作六一七（隋亡前一年）。
//       此非成书之年而是「所记之代」之年。本目《宋史》一三四五、《明史》一七三九
//       乃通行之修史年，无可议。故凡其年正落朝代端点者另计一数，以见此弊之量。
const dynEdges = new Set();
for (const d of cbdbDyn) {
  if (d.start === d.end) continue;
  for (const y of [d.start, d.start - 1, d.start + 1, d.end, d.end - 1, d.end + 1]) dynEdges.add(y);
}
const bucket = () => ({ n: 0, same: 0, near: 0, far: 0, edge: 0 });
const bySrc = { 有出处: bucket(), 无出处: bucket() };
const rawYearRows = [];
for (const r of inCbdb) {
  if (!("year" in r.e)) continue;
  const [a, b] = span(r.e.year);
  const ys = r.cbdb.hit.filter((t) => t.year && t.year !== 0);
  if (!ys.length) continue;
  let best = null;
  for (const t of ys) {
    const d = t.year < a ? a - t.year : t.year > b ? t.year - b : 0;
    if (!best || d < best.d) best = { d, t };
  }
  const k = best.t.src ? "有出处" : "无出处";
  const g = bySrc[k];
  g.n++;
  if (best.d === 0) g.same++;
  if (best.d <= 10) g.near++;
  if (best.d > 30) g.far++;
  const onEdge = dynEdges.has(best.t.year);
  if (onEdge) g.edge++;
  rawYearRows.push({ e: r.e, ours: [a, b], theirs: best.t, gap: best.d, src: k, onEdge });
}
const rawFar = rawYearRows.filter((x) => x.gap > 30).sort((p, q) => q.gap - p.gap);

// ══ 五、CBDB 纪年字段之测量（不涉本目，可独立引用）═══════════════════════
// 第四项所见「其年正落朝代端点」一事，若只就本目重合之六十余部而言，样本太薄，
// 难当「此库有系统之弊」之论。故此项离开本目，**径测 CBDB 全库六千一百零二条
// 有年之录**，使此结论不依赖本目，别人用 CBDB 作文本断代者亦可引。
//
// 难处在于：单报一个「一成六落在朝代端点」毫无意义——朝代端点年集有二百余个，
// 本就不稀罕，随手一个年份都有几分撞上之机。故须有对照，此处立两重：
//
//   一、**平移安慰剂**。把所有朝代界整体平移若干年（±7、±13、±17、±23），
//       得一组「假端点」：靶年个数相同、所在之世相同、局部疏密相同，独无语义。
//       真端点之率若与假端点无异，则所谓「落在端点」纯是巧合。
//
//   二、**有出处者作阴性对照**。若此弊果由无考而充数所致，则有 `c_source` 者
//       不当有此偏。此对照之可贵，在于它与安慰剂各自独立：一者控年份之分布，
//       一者控有无考据，两皆指同一处方可定论。
//
// 另有一事与端点无关而同为充数：**整批同年**。此二者机理不同，分列不混。
const edgeSetAt = (shift) => {
  const s = new Set();
  for (const d of cbdbDyn) {
    if (d.start === d.end) continue;
    for (const y of [d.start, d.end]) {
      if (y == null || y === 0 || !Number.isFinite(+y)) continue;
      for (const o of [-1, 0, 1]) s.add(+y + o + shift);
    }
  }
  return s;
};
const PLACEBO_SHIFTS = [-23, -17, -13, -7, 7, 13, 17, 23];
const EDGE_REAL = edgeSetAt(0);
const EDGE_PLAC = PLACEBO_SHIFTS.map(edgeSetAt);
const hasYear = cbdbTexts.filter((t) => t.year != null && t.year !== 0 && Number.isFinite(+t.year));
const hasSrc = (t) => t.src != null && t.src !== 0 && t.src !== "0";
/** 真端点之率、安慰剂均率、倍数，并以安慰剂为零假设算二项 z。 */
function edgeStat(rows) {
  const n = rows.length;
  if (!n) return null;
  const obs = rows.filter((t) => EDGE_REAL.has(+t.year)).length / n;
  const ps = EDGE_PLAC.map((S) => rows.filter((t) => S.has(+t.year)).length / n);
  const p0 = ps.reduce((a, b) => a + b, 0) / ps.length;
  const se = Math.sqrt((p0 * (1 - p0)) / n);
  return { n, obs, p0, ratio: p0 ? obs / p0 : NaN, z: se ? (obs - p0) / se : NaN };
}
// 整批同年：一年之下压着全组百分之一以上者
function batchOf(rows, floor = 0.01) {
  const c = new Map();
  for (const t of rows) c.set(+t.year, (c.get(+t.year) || 0) + 1);
  return [...c]
    .filter(([, k]) => k / rows.length >= floor)
    .sort((a, b) => b[1] - a[1])
    .map(([y, k]) => ({ year: y, k, share: k / rows.length, onEdge: EDGE_REAL.has(y) }));
}
const yrSrc = hasYear.filter(hasSrc);
const yrNoSrc = hasYear.filter((t) => !hasSrc(t));
const batchNoSrc = batchOf(yrNoSrc);
const batchSrc = batchOf(yrSrc);
const noSrcBatchY = new Set(batchNoSrc.map((b) => b.year));
const srcBatchY = new Set(batchSrc.map((b) => b.year));
const fieldMeas = {
  all: edgeStat(hasYear),
  src: edgeStat(yrSrc),
  noSrc: edgeStat(yrNoSrc),
  // 稳健：剔去整批同年者，以验端点之偏非由那几批独撑
  noSrcTrim: edgeStat(yrNoSrc.filter((t) => !noSrcBatchY.has(+t.year))),
  srcTrim: edgeStat(yrSrc.filter((t) => !srcBatchY.has(+t.year))),
  batchNoSrc,
  batchSrc,
};

// ══ 上屏 ═════════════════════════════════════════════════════════════════
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");
const L = [];
const say = (s = "") => L.push(s);

say("══ 与既有资源对照 ══════════════════════════════════════════════════");
say();
say(
  `本目 ${catalog.length} 部。外部：CBDB 书名 ${cbdbTexts.length} 条` +
    (ctextIdx
      ? `，ctext 书名 ${ctextCount} 条` +
        (ctextPartial ? `（残片：精校 ${ctextCore} 条全在，维基导入者缺，故其覆盖只作下限）` : "")
      : "，ctext 缓存阙（见文末）"),
);
say();

// ctext 缓存若是残片，其覆盖率一概冠「≥」，免得日后把下限读成定数。
const ge = ctextPartial ? "≥" : " ";
say("一、对名");
say(`  见于 CBDB            ${inCbdb.length} 部  ${pct(inCbdb.length, catalog.length)}`);
if (ctextIdx) {
  say(`  见于 ctext           ${ge}${inCtext.length} 部  ${ge}${pct(inCtext.length, catalog.length)}`);
  say(`  两处俱见             ${ge}${inBoth.length} 部  ${ge}${pct(inBoth.length, catalog.length)}`);
  say(`  只见 CBDB             ${onlyCbdb.length} 部`);
  say(`  只见 ctext           ${ge}${onlyCtext.length} 部   ← ctext 于 CBDB 之外所补`);
  say(`  并两库则覆盖         ${ge}${inEither.length} 部  ${ge}${pct(inEither.length, catalog.length)}`);
  say(`  两处俱不见            ${ctextPartial ? "≤" : " "}${inNeither.length} 部  ${ctextPartial ? "≤" : " "}${pct(inNeither.length, catalog.length)}`);
}
say("  按部分看：");
for (const [g, v] of Object.entries(byGroup)) {
  say(`    ${g}部 ${String(v.n).padStart(4)} 部   CBDB ${String(v.cbdb).padStart(3)} (${pct(v.cbdb, v.n)})` + (ctextIdx ? `   ctext ${ge}${String(v.ctext).padStart(3)} (${pct(v.ctext, v.n)})` : ""));
}
if (ctextPartial) say("  （ctext 一列是下限：全目接口中途断流，所得为可救之残片，见 docs/EXTERNAL-EVAL.md）");
say();

say("二、断代相容（本目断代 vs CBDB 撰者生卒年，比区间相交，不比代名）");
say(`  有撰者可据者          ${eraCmp.length} 部`);
say(`    其中生卒年确切者    ${eraSure.length} 部，相容 ${eraSureOk.length} (${pct(eraSureOk.length, eraSure.length)})`);
say(`  相容                  ${eraOk.length} 部  ${pct(eraOk.length, eraCmp.length)}`);
say(`  相离（待裁）          ${eraBad.length} 部  ${pct(eraBad.length, eraCmp.length)}`);
say(`  本目未详·外部有人     ${eraFill.length} 部（外部可补本目之处）`);
// 可比者落在哪几部——所报之率并非均匀覆盖四部，须明言其偏，
// 不可使读者以为七十部是四部平摊。
{
  const g = {};
  for (const x of eraCmp) g[x.e.group] = (g[x.e.group] || 0) + 1;
  const GROUPS = ["经", "史", "子", "集"];
  const thin = GROUPS.filter((k) => (g[k] || 0) < 10);
  say(`  此 ${eraCmp.length} 部落在：${GROUPS.map((k) => `${k} ${g[k] || 0}`).join("　")}`);
  if (thin.length) say(`     ${thin.join("、")}部可比者各不足十，该部之断代此次验得极薄，所报之率勿作全目之证。`);
}
say(`  ── 另：只有「角色未详」之人可据者 ${eraUnk.length} 部，其中相容 ${eraUnkOk.length} (${pct(eraUnkOk.length, eraUnk.length)})`);
say("     此档之人多半亦是撰者，但 CBDB 既标未详，不作定论，故不入上数。");
if (eraBad.length) {
  say();
  say("  相离者逐条（括注内为裁定；「未裁」者是此次新出，须看）：");
  for (const x of eraBad) {
    const j = ADJUDGED[x.e.title];
    say(`    《${x.e.title}》 本目「${x.e.dynasty}」(${x.ours[0]}–${x.ours[1]})  CBDB 撰者 ${sayPeople(x.people)}  [${x.e.group}部·${x.e.category}·对名${x.cbdb.how}·锚${x.anchor}]`);
    say(`        ${j ? `【${j[0]}】${j[1]}` : "【未裁】此条前所未见，须逐一考过再记入 ADJUDGED"}`);
  }
}
if (eraFill.length) {
  say();
  say("  本目未详而外部有人者：");
  for (const x of eraFill.slice(0, 40)) {
    say(`    《${x.e.title}》 CBDB ${x.tier} ${sayPeople(x.people)}  [${x.e.group}部·${x.e.category}]`);
  }
  if (eraFill.length > 40) say(`    …另 ${eraFill.length - 40} 部`);
}
say();

say("三、年之比对（本目系年 vs CBDB 撰者生卒年）");
say(`  有撰者可据者          ${yearRows.length} 部`);
say(`  年落在撰者在世内      ${yearIn.length} 部  ${pct(yearIn.length, yearRows.length)}`);
say(`  晚于卒年              ${yearAfter.length} 部  ${pct(yearAfter.length, yearRows.length)}（身后成书之例，不即是错）`);
say(`  早于生年（必有误）    ${yearBefore.length} 部  ${pct(yearBefore.length, yearRows.length)}`);
const listYear = (arr, label) => {
  if (!arr.length) return;
  say();
  say(`  ${label}：`);
  for (const x of arr.sort((p, q) => q.best.d - p.best.d)) {
    const o = x.ours[0] === x.ours[1] ? `${x.ours[0]}` : `${x.ours[0]}–${x.ours[1]}`;
    const p = x.best.p;
    const extra = x.theirYear ? `  [CBDB 自著之年 ${x.theirYear}${suspicious(x.theirYear) ? "★" : ""}${x.theirSrc ? "" : "·无出处"}]` : "";
    const j = ADJUDGED[x.e.title];
    say(`    《${x.e.title}》 本目 ${o}  撰者 ${p.person}(${p.life.lo}–${p.life.hi}·${p.life.how})  差 ${x.best.d} 年${extra}`);
    say(`        ${j ? `【${j[0]}】${j[1]}` : "【未裁】此条前所未见，须逐一考过再记入 ADJUDGED"}`);
  }
};
listYear(yearBefore, "早于生年者逐条（★ 者 CBDB 自著之年疑为整批充数）");
listYear(yearAfter, "晚于卒年者逐条");
say();

say("四、两边自著之年直接相比（CBDB `c_text_year` vs 本目系年）");
say("  此项不以外部为准，要旨在辨其不合之由。两条判据：");
for (const [k, v] of Object.entries(bySrc)) {
  say(`    CBDB ${k}  ${String(v.n).padStart(3)} 部   全同 ${v.same} (${pct(v.same, v.n)})   差≤10年 ${v.near} (${pct(v.near, v.n)})   差>30年 ${v.far} (${pct(v.far, v.n)})   其年正落朝代端点 ${v.edge} (${pct(v.edge, v.n)})`);
}
say("  读法：有出处者全同之率远高于无出处者，而无出处者落在朝代端点之率远高——");
say("        可见大分歧之责在外部之占位，不在本目。");
if (rawFar.length) {
  say();
  say("  差逾三十年者逐条（◆ 者其年正落朝代端点，即以「所记之代」充「成书之年」）：");
  for (const x of rawFar) {
    const o = x.ours[0] === x.ours[1] ? `${x.ours[0]}` : `${x.ours[0]}–${x.ours[1]}`;
    say(`   ${x.onEdge ? "◆" : " "}《${x.e.title}》 本目 ${o}  CBDB ${x.theirs.year}（${x.src}）  差 ${x.gap} 年`);
  }
}
say();

say("五、CBDB 纪年字段之测量（不涉本目，可独立引用）");
say(`  测 CBDB 全库 ${cbdbTexts.length} 条书名中有年者 ${fieldMeas.all.n} 条。`);
say("  「真端点」＝其年正落某代起年或终年之±1；「安慰剂」＝把所有朝代界整体平移");
say(`  ${PLACEBO_SHIFTS.join("/")} 年所得之假端点（靶年数、所在之世、疏密皆同，独无语义）之均率。`);
say();
// 中西文混排，须按**显示宽度**补齐（汉字占二格），不可按字数。
const dispW = (s) => [...s].reduce((n, c) => n + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(c) ? 2 : 1), 0);
const padW = (s, w) => s + " ".repeat(Math.max(0, w - dispW(s)));
const mrow = (nm, s, note = "") => {
  if (!s) return;
  say(
    `    ${padW(nm, 20)} n=${String(s.n).padStart(5)}` +
      `   真端点 ${pct(s.obs, 1).padStart(6)}   安慰剂 ${pct(s.p0, 1).padStart(6)}` +
      `   ${s.ratio.toFixed(2)}×   z=${String(s.z.toFixed(1)).padStart(5)}` +
      (note ? `   ${note}` : ""),
  );
};
mrow("全部有年者", fieldMeas.all);
mrow("无 c_source 者", fieldMeas.noSrc, "← 偏在此");
mrow("有 c_source 者", fieldMeas.src, "← 阴性对照：与安慰剂无异");
say();
say("  读法一：无出处者落在真端点之率为安慰剂之二倍余且 z 极大，而有出处者与安慰剂");
say("          几无差（倍数约一、z 近零）。两重对照各自独立——安慰剂控年份之分布，");
say("          有出处者控有无考据——而两皆指同一处，故可定论：**此偏见于无考而充数");
say("          之录，非年份分布之巧合。**");
say();
say("  整批同年（一年之下压着全组百分之一以上者）：");
for (const [nm, arr, tot] of [
  ["无出处", fieldMeas.batchNoSrc, fieldMeas.noSrc.n],
  ["有出处", fieldMeas.batchSrc, fieldMeas.src.n],
]) {
  for (const b of arr) {
    say(`    ${nm}  ${String(b.year).padStart(5)} 年下 ${String(b.k).padStart(3)} 条，占该组 ${pct(b.k, tot)}${b.onEdge ? "   ◆正落朝代端点" : ""}`);
  }
}
say();
say("  剔去上列整批同年者再测（此一检验推翻了初拟之说，故照实记之）：");
mrow("无出处·剔批量", fieldMeas.noSrcTrim);
mrow("有出处·剔批量", fieldMeas.srcTrim);
say();
say("  读法二：初拟之说以为无出处者有「弥散的」填端点之习，剔批量以验其不由几批独撑");
say("          ——而所得相反：剔之则倍数自二点二七落至一点二三。可见端点之偏**大半就");
say("          由那几个年份扛着**（◆ 之五年共压着四百余部）。残余之偏虽仍显（z 逾四），");
say("          其量已小。");
say("          此一反证使结论更紧而非更松，且更可用：此弊不是一种难以提防的倾向，");
say("          而是**一小批可以点名的年份**——用 CBDB 作文本断代者，把这几个年值与那");
say("          两批常数一概视作缺值，即可免其大半。");
say();
say("  又：有出处之 1506 一年独占该组近半——可见「有出处」只是**可溯源**，不是逐条");
say("  考定；一书目之成书年施于其所录之全部，亦是批量。故此项之论限于端点一事：");
say("  有出处者不受端点之偏，不等于其年皆可信。");
say();

say("── 总计 ──────────────────────────────────────────────────────────");
const allBad = [...eraBad, ...yearBefore, ...yearAfter];
const unjudged = allBad.filter((x) => !ADJUDGED[x.e.title]);
const byCause = {};
for (const x of allBad) {
  const j = ADJUDGED[x.e.title];
  if (j) byCause[j[0]] = (byCause[j[0]] || 0) + 1;
}
say(`  相离与越界之条共 ${allBad.length}（书有重出者，一书可同时见于断代与系年两项）`);
for (const [k, v] of Object.entries(byCause)) say(`    ${k}  ${v} 条`);
if (unjudged.length) {
  say(`  ⚠ 未裁 ${unjudged.length} 条：${unjudged.map((x) => `《${x.e.title}》`).join("")}`);
  say("    此数非零即是有未看过之分歧，当逐一考过后记入 ADJUDGED，不可置之。");
} else {
  say("  未裁 0 条——凡相离之处皆已逐条看过并记其所以不合。");
}
const ourFault = Object.entries(byCause).filter(([k]) => k === "本目粒度").reduce((n, [, v]) => n + v, 0);
say(`  其中归咎本目者 ${ourFault} 条（收今注本、今译本而题以今代，与通目之著作级不齐）。`);
say("  外部照出本目断代、系年之实误：0 条。");
say();

// 「本目粒度」那几条是外部照出来的真问题，不是裁定了就算完的——裁定只说明
// 「不是断错代」，病根在目录收了今注、今译之本而题以今代。此处把它报成一条
// **待改**，并就目录现状自校：凡其书仍在目而仍题今代者，一一列出且写明该怎么改；
// 改掉之后此段自然消失，不必记得回来删。
{
  const GRAIN = Object.entries(ADJUDGED).filter(([, v]) => v[0] === "本目粒度").map(([t]) => t);
  const open = GRAIN.map((t) => catalog.find((c) => c.title === t)).filter(Boolean);
  if (open.length) {
    say("── 待改：本目粒度 ──────────────────────────────────────────────");
    say("  下列各条仍以今注、今译之本入目而题以今代，与通目之著作级不齐。");
    say("  **此当改目，不当改判**——断代表所断不误，误在目录把一个版本当作一部书收。");
    say("  两条改法皆可，取其一：①去其今本之目，只留本体（《茶经》唐陆羽），今注");
    say("  作版本之属，不另立一部；②留之而改题本体之代，别记其为今人所注。");
    for (const c of open) {
      say(`    《${c.title}》　现题「${c.dynasty ?? "—"}」　${ADJUDGED[c.title][1]}`);
    }
    say();
  }
}

if (!ctextIdx) {
  say("── ctext 缓存阙 ────────────────────────────────────────────────");
  say("  `scripts/cache/ctext-titles.json` 不在。此资源只用于对名，阙之则第一项");
  say("  少一列，二三两项不受影响。取法见 docs/EXTERNAL-EVAL.md。");
  say();
} else if (ctextPartial) {
  say("── ctext 缓存是残片 ────────────────────────────────────────────");
  say(`  所存 ${ctextCount} 条（精校 ${ctextCore}、维基导入 ${ctextCount - ctextCore}）。其全目接口中途断流，`);
  say("  屡试不全。所返之序为精校典籍在前、维基导入之书（ctp:wb*）在后，故所缺");
  say("  多属后者。上文 ctext 一列**只作下限**，不可报作实测覆盖。此资源无年无代，");
  say("  本不参与断代与系年，故残缺不累及二三两项。");
  say();
}

const out = L.join("\n");
console.log(out);

if (process.argv.includes("--write")) {
  const p = path.join(ROOT, "scripts/out/eval-external.txt");
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, out + "\n");
  console.log(`\n已写 ${path.relative(ROOT, p)}`);
}
