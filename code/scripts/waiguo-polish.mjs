#!/usr/bin/env node
/**
 * 机翻三书的扫尾：把译文里漏下的夹生货清掉。
 *
 * 用法：node scripts/waiguo-polish.mjs <odyssey|quixote|faust> [--dry]
 *
 * 清三样（都是 2026-10-15 全书体检查出来的）：
 *  1. markdown 残渣 —— 行首 ##、**加粗**、--- 分隔线。waiguo-translate.mjs 里的
 *     cleanse() 已在源头拦住，但浮士德 22/25/26 三章译在 cleanse 之前，漏了出来。
 *  2. 浮士德未译的说话人名 —— 8/9/10/15/16 五景里 147 行还是 MEPHISTOPHELES、
 *     SIEBEL 这样的全大写英文。同书别处早有定译，按表直换，不必劳动模型。
 *  3. 零星未译的英文词 —— 奥德赛 9 处、堂吉诃德 133 处，如「狂风的 fury 平息了」。
 *     带上下文交模型补一个中文词；塞万提斯那边有些英文是原著故意的（佩德罗把
 *     eclipse 说成 cris、译注里并举 sarna/Sarra），模型答 = 便原样留着。
 *
 * key 只走 JDCLOUD_API_KEY 环境变量，绝不落盘。改动前每章存 .bak。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BOOK = process.argv[2];
const DRY = process.argv.includes("--dry");
if (!["odyssey", "quixote", "faust"].includes(BOOK)) {
  console.error("用法: waiguo-polish.mjs <odyssey|quixote|faust> [--dry]");
  process.exit(1);
}
const KEY = process.env.JDCLOUD_API_KEY;
if (!KEY && !DRY) { console.error("缺少 JDCLOUD_API_KEY"); process.exit(1); }
const URL = "https://modelservice.jdcloud.com/v1/chat/completions";
const DIR = join(process.cwd(), "public/worldlit/books", BOOK + "-zh");
const EN = join(process.cwd(), "public/worldlit/books", BOOK);
const BOOKCN = { odyssey: "奥德赛", quixote: "堂吉诃德", faust: "浮士德" }[BOOK];

/** 浮士德剧中人：英文全大写台头 → 同书已用的定译 */
const SPEAKERS = {
  MEPHISTOPHELES: "靡菲斯特", FAUST: "浮士德", MARGARET: "玛格丽特", MARTHA: "玛尔特",
  WAGNER: "瓦格纳", VALENTINE: "瓦伦廷", LISBETH: "莉丝贝",
  SIEBEL: "西贝尔", FROSCH: "弗罗施", BRANDER: "布兰德", ALTMAYER: "阿尔特迈尔",
  CHORUS: "合唱队", "THE WITCH": "女巫", "THE ANIMALS": "群猿",
  "THE HE-APE": "公猿", "THE SHE-APE": "母猿", "HE-APE AND SHE-APE": "公猿与母猿",
};

const N = JSON.parse(readFileSync(join(DIR, "meta.json"), "utf8")).chapters.length;
/** 西文词。带重音符的拉丁字母也算在词里（borceguí、maravedí），不然词断在
 *  í 之前，后头的中文夹注便认不出来，上面 deliberate 的第一条就拦不住。 */
const WORD = /[A-Za-z][A-Za-z’'À-ɏ-]{2,}/g;
const SPEAKER_RE = new RegExp(
  "^(" + Object.keys(SPEAKERS).sort((a, b) => b.length - a.length).join("|") + ")(?=[（(]|\\s*$)",
  "gm",
);
const ANYWHERE_RE = new RegExp(
  "\\b(?:" + Object.keys(SPEAKERS).sort((a, b) => b.length - a.length).join("|") + ")\\b",
  "g",
);

/** 手改的几处：模型两轮都判作「原著故意的外语」留着不动，其实是它自己译坏了。
 *  堂五三「法国十二Peer」漏译 the Twelve Peers of France；堂五六更奇，
 *  redondillas 被拆成「红ondillas」，前半音译后半照抄，原句又本就绕
 *  （decimas or redondillas），索性整句重写。两处都按英文底本核过。 */
const HAND = {
  quixote: [
    ["法国十二Peer", "法国十二武士"],
    ["要是写成十行诗或者五行的红ondillas体，又少三个字母", "要是写成五行一节，也就是所谓的十行诗或四行诗体，又少三个字母"],
  ],
};

/** 带上下文问模型：这个夹生的英文词该作什么中文 */
async function askWords(items, retry = 0) {
  const sys = [
    `你在校订《${BOOKCN}》的中译稿。译文里残留了未译的英文词，请逐条给出该处应有的中文。`,
    "每条格式「序号|中文」，一行一条，只给替换那一个词或短语，不要整句，不要解释。",
    "若该英文是原文有意保留的（外来语玩笑、译注中并举的原词、专名的西文拼写），这一条答「序号|=」，表示原样不动。",
  ].join("\n");
  const user = items.map((it, i) => `${i + 1}. 【${it.w}】上下文：…${it.ctx}…`).join("\n");
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
    body: JSON.stringify({
      model: "Doubao-Seed-2.0-pro",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    if (retry < 4) { await new Promise((r) => setTimeout(r, 3000 * (retry + 1))); return askWords(items, retry + 1); }
    throw new Error(`HTTP ${res.status}`);
  }
  const txt = (await res.json()).choices?.[0]?.message?.content ?? "";
  const map = new Map();
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*(\d+)\s*[|｜]\s*(.+?)\s*$/);
    if (m) map.set(+m[1], m[2]);
  }
  if (map.size < items.length && retry < 4) {
    await new Promise((r) => setTimeout(r, 2000)); return askWords(items, retry + 1);
  }
  return map;
}

/** 换词留下的空格：原先「狂风的 fury 平息了」换成中文，两侧空格还在，成了
 *  「狂风的 肆虐 平息了」。汉字之间的单空格一律收掉——但剧本的人物表那种
 *  整行只有名字、以空格相隔的（「靡菲斯特 浮士德」）不能动，故带标点的行才收。 */
const collapse = (c) =>
  c.split("\n")
    .map((l) => (/[，。！？、；：“”「」（）]/.test(l) ? l.replace(/([一-龥]) +(?=[一-龥])/g, "$1") : l))
    .join("\n");

// —— 一、逐章扫残渣与说话人名（不用模型，先改） ——
const files = [];
for (let n = 1; n <= N; n++) {
  const p = join(DIR, `${n}.json`);
  if (!existsSync(p)) continue;
  const j = JSON.parse(readFileSync(p, "utf8"));
  const before = j.content;
  let c = before
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^-{3,}[ \t]*\n?/gm, "");
  // 台头或是独占一行（MARGARET），或是带着舞台提示（MEPHISTOPHELES（对浮士德）），
  // 长名在前，免得 THE HE-APE 先被 THE 吃掉半截。剧中人名在别处（如括号里的
  // 「（在FROSCH面前钻个洞）」）也一并换掉——这些名字够独特，不会误伤。
  if (BOOK === "faust")
    c = c.replace(SPEAKER_RE, (m, name) => SPEAKERS[name] + m.slice(name.length))
         .replace(ANYWHERE_RE, (m) => SPEAKERS[m]);
  for (const [from, to] of HAND[BOOK] ?? []) c = c.split(from).join(to);
  // 换词留下的空格要等换完才收得净，这里先收一遍，换词之后再收一遍
  c = collapse(c);
  files.push({ n, p, j, c, changedPlain: c !== before });
}
const plain = files.filter((f) => f.changedPlain).map((f) => f.n);
console.log(`残渣/台头：${plain.length ? "第 " + plain.join("、") + " 章" : "无"}`);

// —— 二、余下的英文词，带上下文批量问模型 ——
/** 原著故意留的外语不该问也不该动。四种形状（都是 2026-10-15 实地撞出来的）：
 *   1. 后头跟着中文夹注            olla（罐子）
 *   2. 整个被引号/括号/书名号围着    ‘ cris ’、（Amicable）、《Le Bagatelle》
 *   3. 落在带「注」的夹注里          （注：原文 clue 双关「线索」与「线团」）
 *   4. 两个以上拉丁词连成一串        nulla est retentio、omnis saturatio mala
 *  头一轮问模型时没这几道拦，它把第 119 章「比如‘almohaza（马梳）’」里的外语当
 *  重出删了，只剩个空括号「比如‘（马梳）’」；故改为程序先拦，不交模型裁。 */
function deliberate(c, at, w) {
  const end = at + w.length;
  if (/^[（(][^）)]{0,24}?[一-龥]/.test(c.slice(end))) return true; // 一
  const before = c[c.slice(0, at).replace(/[ \t]+$/, "").length - 1] ?? "";
  const after = c.slice(end).replace(/^[ \t]+/, "")[0] ?? "";
  if ("‘“「《（(".includes(before) && "’”」》）)".includes(after)) return true; // 二
  const open = c.lastIndexOf("（", at), close = c.lastIndexOf("）", at);
  if (open > close && /^（[^）]{0,6}注/.test(c.slice(open, at))) return true; // 三
  return /[A-Za-z][A-Za-z’'-]* $/.test(c.slice(Math.max(0, at - 30), at)) ||
         /^ [A-Za-z][A-Za-z’'-]/.test(c.slice(end)); // 四
}

const items = [];
for (const f of files)
  for (const m of f.c.matchAll(WORD)) {
    if (deliberate(f.c, m.index, m[0])) continue;
    items.push({ n: f.n, w: m[0], at: m.index, ctx: f.c.slice(Math.max(0, m.index - 30), m.index + m[0].length + 20).replace(/\n/g, " ") });
  }
console.log(`夹生英文词：${items.length} 处，涉 ${new Set(items.map((i) => i.n)).size} 章（原著故意留的外语已跳过）`);

if (DRY) {
  for (const it of items.slice(0, 40)) console.log(`  第${it.n}章 ${it.w} ← …${it.ctx}…`);
  process.exit(0);
}

const fixes = new Map(); // `${n}@${at}` → 中文
for (let i = 0; i < items.length; i += 25) {
  const batch = items.slice(i, i + 25);
  process.stdout.write(`  问 ${i + 1}-${i + batch.length}/${items.length} …`);
  const map = await askWords(batch);
  let kept = 0;
  batch.forEach((it, k) => {
    const v = map.get(k + 1);
    if (!v || v === "=" || v === "-") { kept++; return; }
    if (/[A-Za-z]{3}/.test(v)) { kept++; return; } // 模型又还回英文，不采
    fixes.set(`${it.n}@${it.at}`, v);
  });
  console.log(` 改 ${batch.length - kept}，留 ${kept}`);
}

// —— 三、按位置从后往前替换，写回（先存 .bak） ——
let touched = 0;
for (const f of files) {
  const mine = items.filter((it) => it.n === f.n && fixes.has(`${it.n}@${it.at}`)).sort((a, b) => b.at - a.at);
  let c = f.c;
  for (const it of mine) c = c.slice(0, it.at) + fixes.get(`${it.n}@${it.at}`) + c.slice(it.at + it.w.length);
  // 新换上的中文两侧还留着原先夹英文词的空格（「狂风的 肆虐 平息了」），再收一遍
  if (mine.length) c = collapse(c);
  if (c === f.j.content) continue;
  writeFileSync(f.p + ".bak", readFileSync(f.p));
  writeFileSync(f.p, JSON.stringify({ ...f.j, content: c }, null, 1));
  touched++;
  console.log(`✓ 第${f.n}章：残渣/台头${f.changedPlain ? "有" : "无"}，换词 ${mine.length}`);
}
console.log(`${BOOK}: 改了 ${touched} 章`);
