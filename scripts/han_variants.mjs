/**
 * 生成「繁→简」折字表（app/world/hanVariants.ts）。
 *
 * 为何要这张表：四库的分片是各书自己的排印，繁简不一——《庄子》《管子》《孟子》
 * 《吕氏春秋》《道德经》《文子》等十部作繁体，《论语》《墨子》《荀子》《韩非子》
 * 等作简体。读者在检索栏里打「恒道」，繁体那边写的是「恆道」，不折一道便检不到。
 *
 * 为何只生成一张字表、不在构建时把语料整体转简：正文要照原书出字（典籍原文不替换），
 * 若再存一份简体的检索用文，三点八兆的语料便翻一倍。故只把语料里**真出现过**的
 * 繁体字收成一张表（几千字里通常数百条），折叠放在运行时做，一万字一瞬而已。
 *
 * 表是逐字对逐字的（一对一），折后与原文等长，故匹配位置可直接回指原文，
 * 取前后文作摘要不会错位。opencc 里一对多（如「乾」）的条目一律弃去。
 *
 * 用法（opencc-js 以 --no-save 装，不入 package.json 的依赖）：
 *   npm i --no-save opencc-js && node scripts/han_variants.mjs
 * 语料换过（重跑 siku_quotable.py）之后再跑一遍即可；不跑也只是少折几个字，不会出错。
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import OpenCC from "opencc-js";

const QUOTABLE = "public/siku/quotable";
const CATALOG = "public/siku/catalog.json";
const OUT = "app/world/hanVariants.ts";

const t2s = OpenCC.Converter({ from: "tw", to: "cn" });

// 一、把语料与目录里出现过的汉字收齐
const chars = new Set();
const eat = (s) => {
  for (const c of s) if (/[㐀-鿿豈-﫿]/.test(c)) chars.add(c);
};
for (const f of readdirSync(QUOTABLE)) {
  if (!f.endsWith(".json") || f === "index.json") continue;
  const d = JSON.parse(readFileSync(join(QUOTABLE, f), "utf8"));
  for (const it of d.items) eat(it.text);
  eat(d.title || "");
  eat(d.author || "");
}
for (const e of JSON.parse(readFileSync(CATALOG, "utf8"))) {
  eat(e.title || "");
  eat(e.author || "");
  eat(e.category || "");
}

// 二、逐字问 opencc；只收一对一且确有变化的
const trad = [];
const simp = [];
for (const c of [...chars].sort()) {
  const s = t2s(c);
  if (s.length !== 1 || s === c) continue;
  trad.push(c);
  simp.push(s);
}

const body = `/**
 * 繁→简折字表：检索时两边各折一道，繁体排印的书才检得到。
 *
 * 本文件由 scripts/han_variants.mjs 自语料生成，勿手改。
 * 只收四库语料与目录里真出现过、且繁简一对一的字（${trad.length} 条），
 * 故折后与原文等长，匹配位置可直接回指原文。
 */

/** 繁体字，与 SIMP 逐字相对 */
export const TRAD = ${JSON.stringify(trad.join(""))};
/** 对应的简体字 */
export const SIMP = ${JSON.stringify(simp.join(""))};
`;

writeFileSync(OUT, body);
console.log(`chars ${chars.size} → variants ${trad.length} → ${OUT}`);
