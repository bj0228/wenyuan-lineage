#!/usr/bin/env node
/**
 * 天演论英文底本（赫胥黎 1893 罗马尼斯讲座 Evolution and Ethics）：
 * en.wikisource Page: 名空间 61 页 wikitext → /tmp/waiguo-en/tianyan-en/ 章章 JSON。
 *
 * 结构：p6 书名页 / p8-9 版权页 / p10-46 讲座正文（按语义节切，节名取 running header）
 * / p47-66 NOTES（整体作一章）。wikitext 提纯：剥 noinclude/模板/链接语法。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const PAGES = "/tmp/eande-pages";
const WORK = "/tmp/waiguo-en/tianyan-en";

// 节界（起始页号 + 中文名），依据各页 running header 的语义分段
const SECTIONS = [
  { from: 10, name: "开场：豆茎喻（Evolution and Ethics）" },
  { from: 12, name: "演化的过程（The Process of Evolution）" },
  { from: 14, name: "苦难的演化（The Evolution of Suffering）" },
  { from: 16, name: "古代的演化思想（Evolution in Antiquity）" },
  { from: 18, name: "文化的复仇（The Nemesis of Culture）" },
  { from: 20, name: "伦理与宇宙（Ethics and the Cosmos）" },
  { from: 22, name: "神义论与宇宙义论（Theodicies and Cosmodicies）" },
  { from: 24, name: "性格的流转（The Transmigration of Character）" },
  { from: 26, name: "自我克制的救赎（Salvation by Self-Abnegation）" },
  { from: 28, name: "佛教形而上学（Buddhist Metaphysics）" },
  { from: 30, name: "希腊的演化思想（Evolution in Greece）" },
  { from: 32, name: "斯多葛的超验有神论（Transcendental Theism of the Stoa）" },
  { from: 34, name: "凡存在皆合理？（Whatever Is, Is Right）" },
  { from: 36, name: "斯多葛伦理与演化（Stoical Ethics and Evolution）" },
  { from: 38, name: "现代悲观与乐观（Modern Pessimism and Optimism）" },
  { from: 40, name: "适者生存的谬误（The Fallacy of the Fittest）" },
  { from: 42, name: "国家的主张（The Claims of the State）" },
  { from: 44, name: "与宇宙自然的搏斗（The Battle with Cosmic Nature）" },
  { from: 47, name: "注释（Notes）" },
];

// wikitext → 纯文本
function pageText(n) {
  let s = readFileSync(join(PAGES, `p${n}.wiki`), "utf8");
  s = s.replace(/<noinclude>[\s\S]*?<\/noinclude>/g, ""); // 页眉页脚
  s = s.replace(/<includeonly>|<\/includeonly>/g, "");
  s = s.replace(/\{\{rh[^}]*\}\}/g, "").replace(/\{\{[Rr]unning [Hh]eader[^}]*\}\}/g, "");
  s = s.replace(/\{\{dhr\}\}/g, "\n\n");
  s = s.replace(/\{\{anchor\|[^}]*\}\}/g, "");
  // 排版模板剥壳留肉（可能嵌套，循环到不动为止）：{{center|…}} {{smaller|…}} {{sc|…}} 等
  for (let i = 0; i < 8; i++) {
    const next = s.replace(/\{\{(?:center|float center|sc|smaller|smaller block|larger|x-larger|xx-larger|x-smaller|big|Smallcaps|nop|block center|fine|italic|bold|right|left|align)\|([\s\S]*?)\}\}/g, "$1");
    if (next === s) break;
    s = next;
  }
  s = s.replace(/\[\[#[^|\]]*(\|[^[\]]*)?\]\]/g, ""); // 注释锚点链接
  s = s.replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, "$2"); // [[a|b]] → b
  s = s.replace(/\[\[([^\]]*)\]\]/g, "$1"); // [[a]] → a
  s = s.replace(/'''''([^']+)'''''/g, "$1").replace(/'''([^']+)'''/g, "$1").replace(/''([^']+)''/g, "$1");
  s = s.replace(/<sup>([^<]*)<\/sup>/g, "（$1）").replace(/<sub>([^<]*)<\/sub>/g, "$1");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/g, " ").replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  s = s.replace(/\{\{[^}]*\}\}/g, ""); // 兜底：残余单层模板
  return s.trim();
}

const all = {};
for (let n = 10; n <= 66; n++) all[n] = pageText(n);

// 章节切分：SECTIONS[i] 的内容 = 从 from 页到下一个节的 from 页（减 1）
const chapters = SECTIONS.map((sec, i) => {
  const to = i + 1 < SECTIONS.length ? SECTIONS[i + 1].from - 1 : 66;
  const text = [];
  for (let n = sec.from; n <= to; n++) if (all[n]) text.push(all[n]);
  return { name: sec.name, content: text.join("\n\n").trim() };
}).filter((c) => c.content);

mkdirSync(WORK, { recursive: true });
rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
chapters.forEach((c, k) => {
  c.n = k + 1;
  writeFileSync(join(WORK, `${c.n}.json`), JSON.stringify(c, null, 1));
});
writeFileSync(join(WORK, "meta.json"), JSON.stringify({
  id: "tianyan-en",
  chapters: chapters.map(({ n, name }) => ({ n, name })),
}, null, 1));
console.log("tianyan-en:", chapters.length, "节");
chapters.forEach((c) => console.log(`  ${c.n}. ${c.name} — ${c.content.length} 字符`));
