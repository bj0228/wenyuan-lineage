#!/usr/bin/env node
/**
 * 维基文库 EPUB → 世界文学书架章 JSON。
 *
 * 输入：public/waiguo/*.epub（维基文库「下载为 EPUB」产物，繁体）
 * 输出：public/worldlit/catalog.json + books/<id>/meta.json + <n>.json
 *       形状与四库 books（world/siku.ts 读的）同构：{n,name,content}，
 *       阅读层一套逻辑可吃两种书。
 *
 * 繁体原书转简体排印（opencc-js，--no-save 安装），卷首注「转简排印」以存其真。
 * 幕/场的舞台提示（<small>/<sub>）转全角括号，以别于台词正文。
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import OpenCC from "opencc-js";

const t2s = OpenCC.Converter({ from: "tw", to: "cn" });
const ROOT = new URL("..", import.meta.url).pathname; // 项目根
const WAIGUO = join(ROOT, "public/waiguo");
const OUT = join(ROOT, "public/worldlit");
const WORK = "/tmp/waiguo-work";

// —— 各书著录：id、书名、著译者、EPUB 文件、章文件取舍 ——
// skip: 不入正章的 nav 页（封面/关于/子页根）；天演论的 c0 同此。
const BOOKS = [
  {
    id: "hamlet", file: "漢姆萊脫.epub", name: "哈姆莱特",
    author: "莎士比亚", translator: "朱生豪 译", era: "1601",
    origin: "英国", note: "朱生豪译本（1944 年前定稿），据维基文库繁体本转简排印。",
    skip: ["封面", "关于", "漢姆萊脫"],
    scenes: { expect: 20 }, // 按场切齐英文面：五幕 5+2+4+7+2=20
  },
  {
    id: "zhongxia", file: "莎士比亞戲劇全集_(朱生豪).epub", name: "仲夏夜之梦",
    author: "莎士比亚", translator: "朱生豪 译", era: "1595",
    origin: "英国", note: "朱生豪译本，据维基文库繁体本转简排印。",
    skip: ["封面", "关于", "莎士比亚戏剧全集 (朱生豪)", "仲夏夜之梦"],
    scenes: { expect: 9, mergeLast: true }, // 2+2+2+2+1 与英文面同构；朱译末幕两场并一
  },
  {
    id: "tianyan", file: "天演論.epub", name: "天演论",
    author: "赫胥黎", translator: "严复 译", era: "1898",
    origin: "英国", note: "严复译述并加按语，据维基文库繁体本转简排印。「物竞天择」一语自此书入华。",
    skip: ["封面", "关于", "天演論"],
  },
  {
    id: "chahua", file: "巴黎茶花女遺事.epub", name: "茶花女",
    author: "小仲马", translator: "林纾、王寿昌 译", era: "1899",
    origin: "法国", note: "林纾口述、王寿昌笔译《巴黎茶花女遗事》，第一部风靡中国的西洋小说；据维基文库繁体本转简排印。",
    skip: ["封面", "关于", "巴黎茶花女遺事"],
  },
  {
    id: "yuejie", file: "月界旅行.epub", name: "月界旅行",
    author: "凡尔纳", translator: "鲁迅 译", era: "1903",
    origin: "法国", note: "鲁迅据日本井上勤译本转译（1903），中国科幻小说译作之始；据维基文库繁体本转简排印。",
    skip: ["封面", "关于", "月界旅行"],
  },
];

// nav.xhtml → [{href, title}]（维基文库 EPUB 的 toc 是单层/两层 <ol>，两级都收）
function readNav(opsDir) {
  const nav = readFileSync(join(opsDir, "nav.xhtml"), "utf8");
  const out = [];
  const re = /<a\s[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g;
  let m;
  while ((m = re.exec(nav))) out.push({ href: m[1].replace(/^.*\//, ""), title: m[2].trim() });
  return out;
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));
}

// XHTML → 正文纯文本。规则见文件头注释。
function xhtmlToText(raw) {
  let s = raw;
  s = s.replace(/<head[\s\S]*?<\/head>/g, "");
  s = s.replace(/<table[\s\S]*?<\/table>/g, ""); // ws-header 导航表等
  s = s.replace(/<style[\s\S]*?<\/style>/g, "");
  s = s.replace(/<span[^>]*>/g, "").replace(/<\/span>/g, "");
  s = s.replace(/<a\s[^>]*>/g, "").replace(/<\/a>/g, "");
  s = s.replace(/<sup[^>]*>/g, "").replace(/<\/sup>/g, "");
  s = s.replace(/<sub[^>]*>([^<]*)<\/sub>/g, "（$1）");
  s = s.replace(/<small[^>]*>([^<]*)<\/small>/g, "（$1）");
  s = s.replace(/<br\s*\/?>/g, "\n");
  s = s.replace(/<\/(p|h[1-6]|blockquote|li|div)>/g, "\n\n");
  s = s.replace(/<\/section>/g, "\n\n");
  s = s.replace(/<[^>]+>/g, ""); // 其余标签一律剥壳留肉
  s = decode(s);
  s = s.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n");
  s = s.replace(/([一-鿿，。；：？！、—（）「」『』《》]) +(?=[一-鿿，。；：？！、—（）「」『』《》])/g, "$1"); // 软换行残留的半角空格，夹在汉字之间的一律去掉（全角空格保留）
  s = s.replace(/（\s*）/g, ""); // small/sub 转出的空括号（内里原是图符或空）
  s = s.replace(/\n{3,}/g, "\n\n").replace(/^\s+|\s+$/g, "");
  return s;
}

// 第01節 → 第一节（中文数字）
const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
function cnNum(n) {
  if (n <= 10) return CN[n];
  if (n < 20) return "十" + CN[n - 10];
  return CN[Math.floor(n / 10)] + "十" + (n % 10 ? CN[n % 10] : "");
}
function chapterName(t) {
  const m = t.match(/^第0*(\d+)節?$/);
  return m ? "第" + cnNum(+m[1]) + "节" : t;
}

/** 剧本按场再切：幕内「第X场」独行（朱生豪本或括在全角括号里）为界。
 *  英文原书面按场分章（waiguo-en-slice.mjs 的 playScenes），中译若按幕切，
 *  两面目录 5 对 20 便错了位；这里切齐，章名同构「第X幕第Y场」。
 *  mergeLast：末幕诸场并作一章——朱译《仲夏夜之梦》把迫克收场诗独立成
 *  第二场，而英文底本第五幕只一景；并回则两面 1:1，场标行仍留在文内。 */
function splitScenes(acts, { expect, mergeLast = false }) {
  const out = [];
  for (const ai of acts.keys()) {
    const act = acts[ai];
    const isLastAct = ai === acts.length - 1;
    const lines = act.content.split("\n");
    const marks = [];
    lines.forEach((l, i) => {
      const m = l.trim().match(/^[（(]?(第[一二三四五六七八九十]+场[　 ][^\n）)]*)[）)]?$/);
      if (m) marks.push({ i, label: m[1].trim() });
    });
    if (!marks.length) { out.push(act); continue; }
    for (const mk of marks) lines[mk.i] = mk.label; // 括号包裹的场标也剥壳，与余面一律
    const bounds = marks.map((mk, k) => [mk.i, k + 1 < marks.length ? marks[k + 1].i : lines.length]);
    let scenes = marks.map((mk, k) => ({
      name: `${act.name}第${cnNum(k + 1)}场`,
      content: lines.slice(bounds[k][0], bounds[k][1]).join("\n"),
    }));
    const pre = lines.slice(0, marks[0].i).join("\n").trim(); // 场标前的幕引子，归首场
    if (pre) scenes[0].content = pre + "\n\n" + scenes[0].content;
    if (mergeLast && isLastAct && scenes.length > 1) {
      // 末幕并章：文内保留后场的场标行，只在目录上并作一场
      scenes = [{ name: scenes[0].name, content: scenes.map((s) => s.content).join("\n\n") }];
    }
    out.push(...scenes);
  }
  if (expect !== undefined && out.length !== expect)
    throw new Error(`按场切分得 ${out.length} 场，应为 ${expect} 场`);
  return out.map((c, i) => ({ ...c, n: i + 1 }));
}

const catalog = [];
for (const cfg of BOOKS) {
  const dir = join(WORK, cfg.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execSync(`unzip -o -q ${JSON.stringify(join(WAIGUO, cfg.file))} -d ${JSON.stringify(dir)}`);
  const ops = join(dir, "OPS");
  const nav = readNav(ops).filter((e) => e.href.endsWith(".xhtml") && !e.href.startsWith("about") && !e.href.startsWith("title") && !e.href.startsWith("nav"));
  const acts = [];
  for (const e of nav) {
    const title = chapterName(t2s(e.title));
    if (cfg.skip.some((s) => e.title === s || t2s(e.title) === s)) continue;
    if (!existsSync(join(ops, e.href))) continue;
    const text = xhtmlToText(readFileSync(join(ops, e.href), "utf8"));
    if (!text.trim()) continue;
    acts.push({ n: acts.length + 1, name: title, content: t2s(text) });
  }
  const chapters = cfg.scenes ? splitScenes(acts, cfg.scenes) : acts;
  const bookDir = join(OUT, "books", cfg.id);
  rmSync(bookDir, { recursive: true, force: true });
  mkdirSync(bookDir, { recursive: true });
  for (const ch of chapters) writeFileSync(join(bookDir, `${ch.n}.json`), JSON.stringify(ch, null, 1));
  const meta = {
    id: cfg.id, name: cfg.name, author: cfg.author, translator: cfg.translator,
    era: cfg.era, origin: cfg.origin, note: cfg.note,
    layout: cfg.scenes ? "play" : undefined, // 按场切的都是剧本
    chapters: chapters.map(({ n, name }) => ({ n, name })),
  };
  writeFileSync(join(bookDir, "meta.json"), JSON.stringify(meta, null, 1));
  catalog.push({
    id: cfg.id, name: cfg.name, author: cfg.author, translator: cfg.translator,
    era: cfg.era, origin: cfg.origin, status: "full", chapters: chapters.length,
  });
  console.log(`${cfg.id}: ${chapters.length} 章 ← ${cfg.file}`);
  console.log(`  首章: ${chapters[0]?.name} | 末章: ${chapters[chapters.length - 1]?.name} | 全书 ${chapters.reduce((a, c) => a + c.content.length, 0)} 字`);
}

rmSync(join(OUT, "catalog.json"), { force: true });
writeFileSync(join(OUT, "catalog.json"), JSON.stringify(catalog, null, 1));
console.log("catalog:", catalog.map((b) => b.id).join(", "));
