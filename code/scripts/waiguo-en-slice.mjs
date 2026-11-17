#!/usr/bin/env node
/**
 * Gutenberg 英文公版 → 章章 JSON（机翻底本，不入 public/，产出到 /tmp/waiguo-en/）。
 *
 * 只切三本：奥德赛（Butler 译，BOOK I..XXIV）、堂吉诃德（Ormsy 译，正文标头
 * 「CHAPTER 罗马.」126 章，数字自 LII 重起处为下卷）、浮士德（Taylor 译第一部，
 * 前置三篇 + 目录 SCENE I..XXV，正文以全大写标题行分景）。
 * PG 括号说明（*** START/END OF THE PROJECT GUTENBERG EBOOK ***）外的头尾一律剥去。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const WORK = "/tmp/waiguo-en";
mkdirSync(WORK, { recursive: true });

const strip = (s) => {
  const a = s.indexOf("*** START OF THE PROJECT GUTENBERG EBOOK");
  const b = s.indexOf("*** END OF THE PROJECT GUTENBERG EBOOK");
  return s.slice(a === -1 ? 0 : s.indexOf("\n", a) + 1, b === -1 ? undefined : b).trim();
};

/** 散文重排：PG 底本一律 72 字硬换行，直接渲染便「每行十来个词」。
 *  以空行分段，段内的硬换行以空格并回一句；插图残行（p007.jpg (150K)、
 *  [Illustration …]）整行剔除。诗体/剧本不走此路——但见 reflowPlays。 */
const reflow = (s) =>
  s
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .flatMap((blk) => {
      const ls = blk
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^\S+\.(jpg|gif|png)\s*\(\d+K?\)$/i.test(l) && !/^\[Illustration/i.test(l) && l !== "Full Size");
      return ls.length ? [ls.join(" ").replace(/\s+([,.;:!?])/g, "$1")] : [];
    })
    .join("\n\n");

/** 剧本混排：莎剧/诗剧里素体诗与散文相间，且 PG 不在二者之间留空行——
 *  波洛涅斯一段话能从诗行拐进散文。故按行判：散文按 ~72 列硬折，折满之行
 *  不以句末标点收束，其后行即其续，并接；诗行受格律约束，不过六十来字，
 *  折不进去，行线保留（faust 的对句 "…trample!/…example!" 以句号收束，
 *  也不误并）。说话人标签短，天然自成一行。 */
const reflowPlays = (s) =>
  s
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((blk) => {
      const out = [];
      let cur = "";
      for (const raw of blk.split("\n")) {
        const l = raw.trim();
        if (!l) continue;
        if (cur && cur.length >= 60 && !/[.!?]["')”»]*$/.test(cur)) cur += " " + l;
        else {
          if (cur) out.push(cur);
          cur = l;
        }
      }
      if (cur) out.push(cur);
      return out.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const cnNum = (n) =>
  n <= 10 ? CN[n] : n < 20 ? "十" + CN[n - 10] : n < 100 ? CN[Math.floor(n / 10)] + "十" + (n % 10 ? CN[n % 10] : "") : String(n);
const ROMAN_V = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const romanVal = (r) => {
  let t = 0;
  for (let i = 0; i < r.length; i++) {
    const v = ROMAN_V[r[i]] ?? 0;
    t += v < (ROMAN_V[r[i + 1]] ?? 0) ? -v : v;
  }
  return t;
};

function save(id, chapters, layout) {
  const dir = join(WORK, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const ch of chapters) writeFileSync(join(dir, `${ch.n}.json`), JSON.stringify(ch, null, 1));
  // layout:"play" —— 剧本卷的印记，阅读面据此换窄栏台本排法
  writeFileSync(
    join(dir, "meta.json"),
    JSON.stringify({ id, layout, chapters: chapters.map(({ n, name }) => ({ n, name })) }, null, 1),
  );
  console.log(id + ":", chapters.length, "章", "| 首:", chapters[0].name, "| 末:", chapters[chapters.length - 1].name,
    "| 英文字符", chapters.reduce((a, c) => a + c.content.length, 0));
}

// —— 奥德赛：^BOOK [ROMAN] 分卷 ——
{
  const raw = strip(readFileSync("/tmp/odyssey-en.txt", "utf8")).replace(/\r\n?/g, "\n");
  // Butler 的译注以「[N] [……]」原始括号块堆在末卷之后（中译面未译它们），一并去之
  const notesAt = raw.search(/^\[1\] \[/m);
  const lines = (notesAt === -1 ? raw : raw.slice(0, notesAt)).split("\n");
  const idx = [];
  lines.forEach((l, i) => /^BOOK [IVXLC]+$/.test(l.trim()) && idx.push([i, l.trim()]));
  const chapters = idx.map(([i, h], k) => ({
    n: k + 1,
    name: `第${cnNum(k + 1)}卷`,
    content: reflow(lines.slice(i + 1, k + 1 < idx.length ? idx[k + 1][0] : lines.length).join("\n").trim()),
  }));
  if (chapters.length !== 24) throw new Error("odyssey 卷数不对: " + chapters.length);
  save("odyssey", chapters);
}

// —— 堂吉诃德：正文 「CHAPTER 罗马.」独行；罗马数字自 52 重起为下卷 ——
{
  const lines = strip(readFileSync("/tmp/donquixote-en.txt", "utf8")).split("\n");
  const idx = [];
  lines.forEach((l, i) => /^CHAPTER [IVXLC]+\.$/.test(l.trim()) && idx.push([i, l.trim()]));
  if (idx.length !== 126) throw new Error("堂吉诃德章数不对: " + idx.length);
  const chapters = idx.map(([i, h]) => ({ i, num: romanVal(h.slice(8, -1)) }));
  // 找重起点：上一章 ≥ 50 而本章序数小于上一章（LII 之后重起 I 为下卷）
  const splitAt = chapters.findIndex((c, k) => k > 0 && c.num < chapters[k - 1].num && chapters[k - 1].num >= 50);
  if (splitAt === -1) throw new Error("堂吉诃德上下卷分界未找到");
  const out = chapters.map((c, k) => ({
    n: k + 1,
    name: (k >= splitAt ? "下卷" : "上卷") + `第${cnNum(c.num)}章`,
    content: reflow(lines.slice(c.i + 1, k + 1 < chapters.length ? chapters[k + 1].i : lines.length).join("\n").trim()),
  }));
  const part1 = out.filter((c) => c.name.startsWith("上卷")).length;
  if (part1 !== 52) throw new Error("上卷章数不对: " + part1);
  save("quixote", out);
}

// —— 名译四书的英文原书：哈姆雷特/仲夏夜之梦（ACT+SCENE 分场）、茶花女（Chapter N）、
//    月界旅行（CHAPTER N.，仅 From the Earth to the Moon 28 章，续编 Round the Moon 不切）——
//    产出到 /tmp/waiguo-en/<id>-en/，供典籍页「英文原书」面使用。
{
  // 剧本通用：ACT 行定幕、SCENE 行定场（每幕 SCENE 重新从 I 起；哈姆雷特只标场号）
  const playScenes = (file) => {
    const lines = strip(readFileSync(file, "utf8")).replace(/\r/g, "").split("\n");
    const scenes = [];
    let act = 0;
    lines.forEach((l, i) => {
      const t = l.trim();
      const a = t.match(/^ACT ([IVX]+)/);
      if (a) act = romanVal(a[1]);
      const m = t.match(/^SCENE ([IVX]+)\. (.+)$/);
      if (m) scenes.push({ i, act, scene: romanVal(m[1]), title: m[2] });
    });
    return { lines, scenes };
  };
  const actCn = ["一", "二", "三", "四", "五", "六", "七"];
  const sceneName = (s) => `第${actCn[s.act - 1]}幕第${cnNum(s.scene)}场`;

  // 哈姆雷特：幕场分明
  {
    const { lines, scenes } = playScenes("/tmp/hamlet-en.txt");
    if (scenes.length !== 20) throw new Error("hamlet-en 场数不对: " + scenes.length);
    const out = scenes.map((s, k) => ({
      n: k + 1, name: sceneName(s),
      content: reflowPlays(lines.slice(s.i + 1, k + 1 < scenes.length ? scenes[k + 1].i : lines.length).join("\n").trim()),
    }));
    save("hamlet-en", out, "play");
  }
  // 仲夏夜之梦
  {
    const { lines, scenes } = playScenes("/tmp/midsummer-en.txt");
    if (scenes.length !== 9) throw new Error("midsummer-en 场数不对: " + scenes.length); // 2+2+2+2+1 场
    const out = scenes.map((s, k) => ({
      n: k + 1, name: sceneName(s),
      content: reflowPlays(lines.slice(s.i + 1, k + 1 < scenes.length ? scenes[k + 1].i : lines.length).join("\n").trim()),
    }));
    save("midsummer-en", out, "play");
  }
  // 茶花女：^Chapter N$ 独行。目录区同行也作「 Chapter I」（行首带空格），故匹配
  // 不许 trim——一 trim 便把目录行当章头，1–26 章全切在目录行之间成了空章。
  {
    const lines = strip(readFileSync("/tmp/camille-en.txt", "utf8")).replace(/\r/g, "").split("\n");
    const all = [];
    lines.forEach((l, i) => {
      const m = l.match(/^Chapter ([IVXLC]+)$/);
      if (m) all.push({ i, num: romanVal(m[1]) });
    });
    const idx = [];
    let expect = 1;
    for (const c of all) if (c.num === expect) { idx.push(c.i); expect++; }
    if (idx.length !== 27) throw new Error("camille-en 章数不对: " + idx.length);
    const out = idx.map((i, k) => ({
      n: k + 1, name: `第${cnNum(k + 1)}章`,
      content: reflow(lines.slice(i + 1, k + 1 < idx.length ? idx[k + 1] : lines.length).join("\n").trim()),
    }));
    if (out.some((c) => c.content.length < 200)) throw new Error("camille-en 有空章：章头八成又吃进目录了");
    save("camille-en", out);
  }
  // 月界旅行：^CHAPTER N.$（截至 Round the Moon 前）
  {
    const lines = strip(readFileSync("/tmp/moon-en.txt", "utf8")).replace(/\r/g, "").split("\n");
    const end = lines.findIndex((l) => l.includes("A SEQUEL TO"));
    const idx = [];
    lines.forEach((l, i) => i < end && /^CHAPTER [IVXLC]+\.$/.test(l.trim()) && idx.push(i));
    if (idx.length !== 28) throw new Error("moon-en 章数不对: " + idx.length);
    const out = idx.map((i, k) => ({
      n: k + 1, name: `第${cnNum(k + 1)}章`,
      content: reflow(lines.slice(i + 1, k + 1 < idx.length ? idx[k + 1] : end).join("\n").trim()),
    }));
    save("moon-en", out);
  }
}

// —— 浮士德（第一部）：正文标头 = 独行罗马序数 + 空行 + 全大写标题行 ——
// 前置三篇无序数：献诗/舞台序幕是 [Illustration: =题名=] 标记，天上序幕是全大写独行。
// Taylor 译者的 PREFACE 与德文 AN GOETHE 不属歌德正文，略去。
{
  const lines = strip(readFileSync("/tmp/faust-en.txt", "utf8")).replace(/\r/g, "").split("\n");
  // 25 景：序数行位置（>1000 避开目录区），标题取其后首个非空行
  const numIdx = [];
  lines.forEach((l, i) => i > 900 && /^[IVX]+$/.test(l.trim()) && numIdx.push(i));
  if (numIdx.length !== 25) throw new Error("浮士德景数不对: " + numIdx.length);
  const titleAt = (i) => {
    for (let k = i + 1; k < lines.length; k++) if (lines[k].trim()) return k;
    return i + 1;
  };
  const mark = (re) => lines.findIndex((l) => re.test(l));
  const iDed = mark(/^\[Illustration: =Dedication=\]$/);
  const iPre = mark(/^\[Illustration: =Prelude at the Theatre=\]$/);
  const iPro = lines.findIndex((l, i) => i > 600 && l.trim() === "PROLOGUE IN HEAVEN" && lines[i - 1].trim() === "");
  if (iDed === -1 || iPre === -1 || iPro === -1) throw new Error("浮士德前置未找到");
  // 前置：正文里每篇标题至下一篇开头之间的诗行；跳过篇首的 [Illustration] 杂行
  const pre = [
    { name: "献诗", from: iDed, to: iPre },
    { name: "舞台序幕", from: iPre, to: iPro },
    { name: "天上序幕", from: iPro, to: numIdx[0] },
  ];
  const SCENE_CN = [
    "夜", "城门外", "书斋", "书斋", "奥尔巴赫酒窖", "巫厨", "街头", "黄昏", "散策", "邻家",
    "街", "园中", "园亭", "林窟", "玛格丽特闺房", "玛尔特园中", "井边", "城楼", "夜",
    "教堂", "瓦尔普吉斯之夜", "仙王仙后金婚", "阴晦的日子", "夜", "囚狱",
  ];
  const out = [];
  pre.forEach((p) =>
    out.push({
      n: out.length + 1, name: p.name,
      content: reflowPlays(lines.slice(p.from + 1, p.to).join("\n").replace(/\[Illustration[^\]]*\]/g, "").trim()),
    }),
  );
  numIdx.forEach((i, k) => {
    const t = titleAt(i);
    out.push({
      n: out.length + 1,
      name: `第${cnNum(k + 1)}景　${SCENE_CN[k]}`,
      content: reflowPlays(lines.slice(t + 1, k + 1 < numIdx.length ? numIdx[k + 1] : lines.length).join("\n").trim()),
    });
  });
  save("faust", out, "play");
}
