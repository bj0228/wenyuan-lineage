/**
 * 目录去重：同一部书录了两遍的，只留一条。
 *
 * 为何要这一道：`public/siku/catalog.json` 是从上游那份 Catalog.json 原样抽来的
 * （见 siku_extract.py），而上游一书两录的地方不少，分三样：
 *
 *   一、**繁简两本**。正史一类最多：《晋书》与《晉書》、《辽史》与《遼史》、
 *       《旧五代史》与《舊五代史》……谱录里的茶书亦然（《茶录》与《茶錄》）。
 *       一部书因排印之繁简而在卷上占两个位置，而代、部、类、著者无一处异。
 *   二、**逐字全同**。《宋史》《金史》《明史》《前汉纪》《论书》之类，同一条著录重出，
 *       连题名的字都不差——纯是数据的重复。
 *   三、**同名异类**。《九州春秋》既入野史又入别杂史、《南岳小录》既入野史又入地理、
 *       《夏商野史》既入史部野史又入子部小说：一部书填了两个类目。此类须**代、
 *       著者两项全同**才并（两项不同者，可能真是两部同名之书，不敢并）。
 *
 * 判繁简用的是本仓自己那张折字表（`app/world/hanVariants.ts`，由 han_variants.mjs
 * 自语料生成，一千四百余条、逐字一对一），不另立一份手抄的对照表——两处对不上，
 * 检索与去重就会各说各话。
 *
 * 留哪一条，依次取：
 *   1. **有正文的那一条**（带 bookId 者，分片目录与它相系，不能动）；
 *   2. **类目不作「野史」的那一条**。四库史部本无「野史」一类（正史、编年、纪事本末、
 *      别史、杂史、诏令奏议、传记、史钞、载记、时令、地理、职官、政书、目录、史评），
 *      上游那七十条「野史」是它自设的一个兜底之类；一书两填而其一落在此，另一处
 *      （地理、载记、别杂史……）才是指得实的类。故《南岳小录》归地理、《江南野史》归载记。
 *   3. **著录在先**的那一条。
 * 题名照所留那条的原样，繁体题名不改字——那是原书的排印，检索那边有折字表，
 * 打简体也检得到。
 *
 * 为何不把去重写进 siku_extract.py：那支脚本在另一台机器上跑（SRC 在 /root 下），
 * 且它只管抽取，不作判断；去重要用本仓的折字表，判据也须随目录改动而复核。
 * 故另立此脚本，可反复跑（幂等），并备 `--check` 一式只校不写，供 CI 与改表之后自检。
 *
 * 用法：
 *   node scripts/siku-dedup.mjs            并重，写回 catalog.json
 *   node scripts/siku-dedup.mjs --check     只报不写；目录里尚有重出则以非零退出
 */

import { readFileSync, writeFileSync } from "node:fs";

const CATALOG = "public/siku/catalog.json";
const VARIANTS = "app/world/hanVariants.ts";
const check = process.argv.includes("--check");

// ── 折字表：自 hanVariants.ts 取那两条等长的字串 ──
const vsrc = readFileSync(VARIANTS, "utf8");
const grab = (name) => {
  const m = vsrc.match(new RegExp(`export const ${name} = "([^"]*)"`));
  if (!m) throw new Error(`${VARIANTS} 里取不到 ${name}`);
  return m[1];
};
const TRAD = grab("TRAD");
const SIMP = grab("SIMP");
if ([...TRAD].length !== [...SIMP].length) throw new Error("折字表两行不等长，han_variants.mjs 须重跑");
const FOLD = new Map();
{
  const t = [...TRAD];
  const s = [...SIMP];
  for (let i = 0; i < t.length; i++) FOLD.set(t[i], s[i]);
}
const fold = (s) => [...s].map((c) => FOLD.get(c) ?? c).join("");

const all = JSON.parse(readFileSync(CATALOG, "utf8"));
const n0 = all.length;

/** 同一部书留哪一条：有正文者先，次取类目不作「野史」者，次取著录在先者。 */
const better = (a, b) => {
  if (!!a.bookId !== !!b.bookId) return a.bookId ? a : b;
  const ay = a.category === "野史";
  const by = b.category === "野史";
  if (ay !== by) return ay ? b : a;
  return a; // a 著录在先
};

const drop = new Set(); // 要去的那些条（按下标）
const report = [];

// ── 一、同部同类，题名折后相同 ──
{
  const g = new Map();
  all.forEach((e, i) => {
    const k = `${e.group} ${e.category} ${fold(e.title)}`;
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(i);
  });
  for (const [, idx] of g) {
    if (idx.length < 2) continue;
    let keep = idx[0];
    for (const i of idx.slice(1)) keep = better(all[keep], all[i]) === all[keep] ? keep : i;
    for (const i of idx) if (i !== keep) drop.add(i);
    const titles = idx.map((i) => all[i].title);
    const same = new Set(titles).size === 1;
    report.push(
      `  ${all[keep].group}/${all[keep].category}  留《${all[keep].title}》` +
        (all[keep].bookId ? `（可读 ${all[keep].bookId}）` : "") +
        `，去 ${idx.length - 1} 条 ${same ? "〔逐字全同〕" : `〔繁简两本：${titles.join("、")}〕`}`,
    );
  }
}

// ── 二、同代同著者，而类目填了两处（部同不同皆并） ──
{
  const g = new Map();
  all.forEach((e, i) => {
    if (drop.has(i)) return;
    const k = `${e.dynasty} ${e.author} ${fold(e.title)}`;
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(i);
  });
  for (const [, idx] of g) {
    if (idx.length < 2) continue;
    let keep = idx[0];
    for (const i of idx.slice(1)) keep = better(all[keep], all[i]) === all[keep] ? keep : i;
    for (const i of idx) if (i !== keep) drop.add(i);
    const where = (i) => `${all[i].group}部「${all[i].category}」`;
    report.push(
      `  《${all[keep].title}》留 ${where(keep)}，` +
        `去 ${idx.filter((i) => i !== keep).map(where).join("、")} 那几条〔同名异类〕`,
    );
  }
}

// 一道硬校：凡带正文者（bookId/chapters）不得去——分片目录与它相系，去了书就读不得
for (const i of drop) {
  if (all[i].bookId || all[i].chapters) {
    throw new Error(`去不得：《${all[i].title}》带正文（${all[i].bookId ?? ""}），留去之序有误`);
  }
}

const kept = all.filter((_, i) => !drop.has(i));
const nRead = kept.filter((e) => e.bookId).length;

console.log(`目录 ${n0} 部，重出 ${drop.size} 条，并作 ${kept.length} 部（可读 ${nRead} 部）`);
for (const line of report.sort()) console.log(line);

// 并后须名名独一（关系表以「目:书名」作端点，重名便认不定一枚）
const dupAfter = new Map();
for (const e of kept) {
  const k = `${e.category}/${e.title}`;
  dupAfter.set(k, (dupAfter.get(k) ?? 0) + 1);
}
const still = [...dupAfter].filter(([, n]) => n > 1);
if (still.length) {
  console.log("\n并后仍有同类同名者（题名异而非繁简之别，不敢擅并，留此备考）：");
  for (const [k, n] of still) console.log(`  ${k} ×${n}`);
}

if (check) {
  if (drop.size) {
    console.log("\n✗ 目录里尚有重出之条，跑一遍 node scripts/siku-dedup.mjs 并之");
    process.exit(1);
  }
  console.log("\n✓ 目录无重出");
} else if (drop.size) {
  writeFileSync(CATALOG, JSON.stringify(kept), "utf8");
  console.log(`\n✓ 已写回 ${CATALOG}`);
} else {
  console.log("\n✓ 目录无重出，未改动");
}
