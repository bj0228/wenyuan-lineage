#!/usr/bin/env node
/**
 * 三本机翻书：奥德赛/堂吉诃德/浮士德 英文底本 → 中文（Doubao-Seed-2.0-pro，京东云模型服务）。
 *
 * 用法：node scripts/waiguo-translate.mjs <bookId>            # 翻全书（可断点续传）
 *      node scripts/waiguo-translate.mjs <bookId> <章节号>   # 只翻指定章
 * 底本：/tmp/waiguo-en/<bookId>/{meta.json,<n>.json}
 * 产出：public/worldlit/books/<bookId>-zh/…（meta 的 translator 注明机翻）
 *
 * key 只走 JDCLOUD_API_KEY 环境变量，绝不落盘。
 * 每章按 ~9000 英文字符分块，块序号写入译文段间，译文末尾 QC 标记行由脚本剥除。
 * 译文里的 markdown 残渣（行首 # 前缀、** 加粗、--- 分隔线）也一律剥除——
 * 堂吉诃德 126 章里模型漏过 18 处 ###、6 处 **（2026-10-15 由
 * scripts/quixote-title-fix.mjs 手工清的），在源头堵住，重译便不再漏。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BOOK = process.argv[2];
const FLAGS = process.argv.slice(3).filter((a) => a.startsWith("--"));
const ONLY = process.argv.slice(3).find((a) => /^\d+$/.test(a)) ? +process.argv.slice(3).find((a) => /^\d+$/.test(a)) : null;
/** 已有的章默认跳过（断点续传）；--force 则连已有的也重译（旧译文先存 .bak） */
const FORCE = FLAGS.includes("--force");
if (!["odyssey", "quixote", "faust"].includes(BOOK)) {
  console.error("用法: waiguo-translate.mjs <odyssey|quixote|faust> [章号] [--force]");
  process.exit(1);
}
const KEY = process.env.JDCLOUD_API_KEY;
if (!KEY) { console.error("缺少 JDCLOUD_API_KEY"); process.exit(1); }
const URL = "https://modelservice.jdcloud.com/v1/chat/completions";

const SRC = join("/tmp/waiguo-en", BOOK);
const OUT = join(process.cwd(), "public/worldlit/books", BOOK + "-zh");

// —— 各书著录与译名表 ——
const GLOSS = {
  odyssey: {
    name: "奥德赛", author: "荷马", translator: "AI 译（据 Samuel Butler 英译本，未经校订）",
    era: "约前8世纪", origin: "希腊",
    note: "据 Samuel Butler 公版英译本由 AI 译出，未经人工校订；诗体从权，不押韵。",
    titleKey: ["Odysseus", "Telemachus", "Penelope", "Jove/Jupiter", "Neptune", "Minerva", "Mercury", "Apollo", "Juno", "Calypso", "Circe", "Nestor", "Menelaus", "Helen", "Agamemnon", "Achilles", "Ithaca", "Pylos", "Lacedaemon", "Phaeacians", "Suitors", "Eumaeus", "Euryclea", "Argo", "Scylla", "Charybdis", "Sirens", "Polyphemus"],
    titleCn: "尤利西斯/忒勒马科斯/珀涅罗珀/朱庇特/涅普顿/密涅瓦/墨丘利/阿波罗/朱诺/卡吕普索/喀耳刻/涅斯托耳/墨涅拉俄斯/海伦/阿伽门农/阿喀琉斯/伊萨卡/皮洛斯/拉栖代蒙/法厄阿基亚人/求婚人/欧迈俄斯/欧律克勒娅/阿尔戈/斯库拉/卡律布狄斯/塞壬/波吕斐摩斯",
  },
  quixote: {
    name: "堂吉诃德", author: "塞万提斯", translator: "AI 译（据 John Ormsby 英译本，未经校订）",
    era: "1605", origin: "西班牙",
    note: "据 John Ormsby 公版英译本由 AI 译出，未经人工校订。",
    titleKey: "Don Quixote|Sancho Panza|Rocinante|Dapple|Dulcinea del Toboso|Toboso|Aldonza Lorenzo|Samson Carrasco|Nicolas|Perez|Gines de Pasamonte|Maritornes|Andrew|Cardenio|Dorothea|Ferdinand|Luscinda|Avalos|Grajales|Ricote|Carrascos",
    titleCn: "堂吉诃德|桑丘·潘沙|罗西南特|灰毛儿|杜尔西内娅·台尔·托波索|托波索|阿尔东莎·罗任索|参孙·加尔拉斯果|尼古拉斯|佩雷斯|希内斯·德·帕萨蒙特|马利托内斯|安德烈斯|卡德尼奥|多若泰|费尔南多|露辛达|阿瓦洛斯|格拉哈莱斯|里科特|加尔拉斯果",
  },
  faust: {
    name: "浮士德", author: "歌德", translator: "AI 译（据 Bayard Taylor 英译本，未经校订）",
    era: "1808", origin: "德国",
    note: "据 Bayard Taylor 公版英译本（第一部）由 AI 译出，未经人工校订；诗体从权，不押韵。",
    titleKey: "Faust|Mephistopheles|Margaret|Gretchen|Wagner|Martha|Valentine|Lisbeth|Helen|Homunculus",
    titleCn: "浮士德|靡菲斯特|玛格丽特|甘泪卿|瓦格纳|玛尔特|瓦伦廷|莉丝贝|海伦|何蒙古鲁士",
  },
};
const g = GLOSS[BOOK];

// —— 读底本 ——
const meta = JSON.parse(readFileSync(join(SRC, "meta.json"), "utf8"));
const chapters = meta.chapters.filter((c) => !ONLY || c.n === ONLY);

// —— 章内分块（按空行聚合，~9000 字符） ——
function chunkChapter(content) {
  const paras = content.split(/\n\n+/);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length > 9000) { chunks.push(cur); cur = p; }
    else cur = cur ? cur + "\n\n" + p : p;
  }
  if (cur.trim()) chunks.push(cur);
  return chunks;
}

// —— 译文清洗：模型嘴上说「只输出译文正文」，手上爱漏 markdown ——
function cleanse(t) {
  return t
    .replace(/^#{1,6}[ \t]+/gm, "") // 行首标题前缀：拆掉 #，留文字
    .replace(/\*\*/g, "") // **加粗**：拆标记留文字
    .replace(/^-{3,}[ \t]*\n?/gm, "") // --- 分隔线：整行拿走
    .replace(/\n{3,}/g, "\n\n"); // 拿走后叠起的空行收拢
}

// —— 调用 doubao ——
const glossLine = Array.isArray(g.titleKey)
  ? g.titleKey.map((k, i) => `${k}=${g.titleCn.split("/")[i]}`).join("、")
  : g.titleKey.split("|").map((k, i) => `${k}=${g.titleCn.split("|")[i]}`).join("、");

async function translateChunk(text, chName, idx, total, retry = 0) {
  const sys = [
    `你是严谨的文学翻译家。把英文《${g.name}》（${g.author}著）${chName}译成简体中文。`,
    `人名地名译名表（严格遵守）：${glossLine}。`,
    BOOK === "faust"
      ? "这是诗剧：保持舞台提示格式，台词行对行翻译，诗行保持分行，不押韵，不删行。剧中人名顶格。"
      : BOOK === "odyssey"
        ? // 从前这一条没交代卷题，Butler 每卷卷首那行全大写题解便被机器当装饰删了
          // （二十四卷只偶存三卷），中译面遂无题可看；补此一句，重跑才留得住。
          // 既有的二十四条卷题已由 scripts/waiguo-odyssey-titles.mjs 补齐并提为 title 字段。
          "这是史诗：分段与原文对应，行文庄重流畅，不押韵。卷首若有全大写的内容提要（卷题），照译为一行中文题，不得删去，不得并入正文。"
        : "这是小说：分段与原文对应，行文流畅。开头的章题（如有）保留原样。直译优先，俚语归化。",
    // 从前这两条没写死，模型便或者合并段落（二十四卷里四卷整卷挤成一段），
    // 或者译到半途收手（存下的中译普遍只及原文一半）——都是静默的，下面逐块验收。
    "段落必须与原文一一对应：原文有几个自然段，译文就有几个自然段，段间留一个空行，不得合并。",
    "必须译完整段原文，一句不得省略、概括或跳过，不得中途收尾。",
    "只输出译文正文，不要任何解释、标题或前后缀。",
  ].join("\n");
  const body = JSON.stringify({
    model: "Doubao-Seed-2.0-pro",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
    body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (retry < 5 && (res.status >= 500 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, 3000 * (retry + 1)));
      return translateChunk(text, chName, idx, total, retry + 1);
    }
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  const fin = j.choices?.[0]?.finish_reason;
  const out = cleanse((j.choices?.[0]?.message?.content ?? "").trim());

  // —— 逐块验收：空、腰斩、并段，都重译，连试六次不成才认败 ——
  // （英译汉的字数比常在 0.25–0.40；低于 0.18 必是译到半截收了手。）
  const srcParas = text.split(/\n{2,}/).filter((p) => p.trim()).length;
  const outParas = out.split(/\n{2,}/).filter((p) => p.trim()).length;
  const bad =
    !out ? "空译文"
    : fin === "length" ? "出参被截断"
    : out.length < text.length * 0.18 ? `偏短（${out.length}/${text.length}）`
    : srcParas >= 4 && outParas < Math.ceil(srcParas * 0.7) ? `并了段（原${srcParas}段→译${outParas}段）`
    : null;
  if (bad) {
    if (retry >= 5) throw new Error(`${chName} 第${idx}/${total}块反复${bad}，已放弃`);
    process.stdout.write(` ✗${bad}，重译…`);
    await new Promise((r) => setTimeout(r, 2000 * (retry + 1)));
    return translateChunk(text, chName, idx, total, retry + 1);
  }
  return out;
}

/** 两串字面重合度——用来认出译文开头那行是不是卷题的重出 */
function overlap(a, b) {
  const s = new Set([...b]);
  let hit = 0;
  for (const c of a) if (s.has(c)) hit++;
  return hit / Math.max(1, a.length);
}

/** 旧译文里的卷题（title 字段）—— 重译不该把它丢了 */
function oldTitle(n) {
  const p = join(OUT, `${n}.json`);
  if (!existsSync(p)) return undefined;
  try { return JSON.parse(readFileSync(p, "utf8")).title; } catch { return undefined; }
}

// —— 主流程：逐章逐块，已存在的章跳过（断点续传），--force 则重译 ——
mkdirSync(OUT, { recursive: true });
let done = 0, skipped = 0;
for (const ch of chapters) {
  const chPath = join(OUT, `${ch.n}.json`);
  const had = existsSync(chPath);
  if (had && !ONLY && !FORCE) { skipped++; continue; }
  const title = oldTitle(ch.n);
  if (had) writeFileSync(chPath + ".bak", readFileSync(chPath)); // 重译先留旧本
  const src = JSON.parse(readFileSync(join(SRC, `${ch.n}.json`), "utf8"));
  const chunks = chunkChapter(src.content);
  const parts = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`  ${ch.n}.${i + 1}/${chunks.length} …`);
    const t = await translateChunk(chunks[i], ch.name, i + 1, chunks.length);
    parts.push(t);
    process.stdout.write(` 完成（${t.length} 字）\n`);
  }
  let content = parts.join("\n\n");
  // 卷题既已单列为 title（目录与正文题都取它），正文开头那行重出的题须拿掉，
  // 否则一卷之内题现两遍。认法：首段短，且与 title 字面大半重合。
  if (title) {
    const first = content.split(/\n{2,}/)[0]?.trim() ?? "";
    if (first && first.length <= title.length * 1.6 && overlap(first, title) > 0.6)
      content = content.slice(content.indexOf(first) + first.length).replace(/^\s+/, "");
  }
  writeFileSync(chPath, JSON.stringify({ n: ch.n, name: ch.name, title, content }, null, 1));
  done++;
  console.log(`✓ ${ch.n} ${ch.name}（${chunks.length} 块，${content.length} 字，原文 ${src.content.length}）`);
}

// 写 meta（含已翻章的并集；ONLY 模式不重写 meta）
if (!ONLY) {
  const doneChs = meta.chapters.filter((c) => existsSync(join(OUT, `${c.n}.json`)));
  writeFileSync(join(OUT, "meta.json"), JSON.stringify({
    id: BOOK + "-zh", name: g.name, author: g.author, translator: g.translator,
    era: g.era, origin: g.origin, note: g.note,
    layout: BOOK === "faust" ? "play" : undefined, // 浮士德是诗剧，台本排法
    // 卷题随章带出（奥德赛每卷底本自带），从前这里只写 {n,name}，一重跑便把题抹了
    chapters: doneChs.map(({ n, name }) => {
      const t = oldTitle(n);
      return t ? { n, name, title: t } : { n, name };
    }),
  }, null, 1));
  console.log(`${BOOK}: 新译 ${done} 章，跳过 ${skipped} 章，合计 ${doneChs.length}/${meta.chapters.length}`);
}
