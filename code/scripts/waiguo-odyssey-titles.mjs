#!/usr/bin/env node
/**
 * 奥德赛卷题补译 —— 把 Butler 英译每卷卷首那行「题解」扶正为卷题，中英两卷各得其题。
 *
 * 缘起：Butler 在每卷 `BOOK I` 之下另起一行全大写的内容提要
 * （THE GODS IN COUNCIL—MINERVA'S VISIT TO ITHACA—…），那是他给这一卷安的题。
 * 切片脚本（waiguo-en-slice.mjs）只认 `^BOOK [罗马]` 作卷界，卷名一律写作「第N卷」，
 * 提要便留在正文首段里；中译脚本（waiguo-translate.mjs）的史诗分支又没交代章题怎么办，
 * 机器遂把这行长提要当作可省的装饰，二十四卷里只偶然留下三卷（三、五、十八）。
 * 于是中译面无题可看，英文面的题又还是英文——「奥德赛的题目没翻成中文」即此。
 *
 * 此脚本：
 *   1. 从英文卷首段取出那行提要，剥去 Butler 的脚注号（如 `THE VISIT TO THE DEAD.88`）；
 *   2. 二十四题一次性交 Doubao 译出（译名表与 waiguo-translate.mjs 同一份，题文不另起炉灶）；
 *   3. 提要自正文首段提出，改落 `title` 字段（章文件与 meta 同写），正文首段归还正文——
 *      阅读面的 drop cap 便落在真正的开篇第一字上，不再落在标题上。
 *
 * 只动奥德赛中英两卷，别书不涉。key 只走 JDCLOUD_API_KEY 环境变量，绝不落盘。
 * 用法：JDCLOUD_API_KEY=… node scripts/waiguo-odyssey-titles.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry");
const EN = join(process.cwd(), "public/worldlit/books/odyssey");
const ZH = join(process.cwd(), "public/worldlit/books/odyssey-zh");
const N = 24;

/** waiguo-translate.mjs 里奥德赛那份译名表，照抄——卷题与正文须同名同姓 */
const GLOSS =
  "Odysseus/Ulysses=尤利西斯、Telemachus=忒勒马科斯、Penelope=珀涅罗珀、Jove/Jupiter=朱庇特、" +
  "Neptune=涅普顿、Minerva=密涅瓦、Mercury=墨丘利、Apollo=阿波罗、Juno=朱诺、Calypso=卡吕普索、" +
  "Circe=喀耳刻、Nestor=涅斯托耳、Menelaus=墨涅拉俄斯、Helen=海伦、Agamemnon=阿伽门农、" +
  "Achilles=阿喀琉斯、Ithaca=伊萨卡、Pylos=皮洛斯、Lacedaemon=拉栖代蒙、Phaeacians=法厄阿基亚人、" +
  "Suitors=求婚人、Eumaeus=欧迈俄斯、Euryclea=欧律克勒娅、Scylla=斯库拉、Charybdis=卡律布狄斯、" +
  "Sirens=塞壬、Polyphemus=波吕斐摩斯、Scheria=斯刻里亚、Laestrygones=莱斯特律戈涅斯、" +
  "Aeolus=埃俄洛斯、Irus=伊罗斯、Eurymachus=欧律马科斯、Philoetius=菲洛提乌斯、Laertes=拉埃耳忒斯、" +
  "Theoclymenus=忒俄克吕墨诺斯、Melanthius=墨兰透斯、Amphinomus=安菲诺摩斯、Nausicaa=娜乌西卡娅、" +
  "Alcinous=阿尔喀诺俄斯、Hades=哈得斯、Diana=狄安娜";

/** 中译面偶然保留了提要的三卷（卷首段即是题）——提出来换成正式卷题，不叫它在正文里重出 */
const ZH_LEAD_TITLE = [3, 5, 18];

const paras = (s) => s.replace(/\r\n?/g, "\n").split(/\n{2,}/);

// —— 一、取英文卷题 ——
const titles = [];
for (let n = 1; n <= N; n++) {
  const ch = JSON.parse(readFileSync(join(EN, `${n}.json`), "utf8"));
  const ps = paras(ch.content);
  const head = ps[0].trim();
  if (/[a-z]/.test(head) || head.includes("\n") || ps.length < 2)
    throw new Error(`第${n}卷英文首段不像卷题：${head.slice(0, 60)}`);
  titles.push({
    n,
    name: ch.name,
    // 剥脚注号（THE VISIT TO THE DEAD.88）与句末点；Butler 第九卷那处「—-」是底本的误排
    en: head.replace(/\.?\d+$/, "").replace(/\.$/, "").replace(/—-/g, "—").trim(),
    body: ps.slice(1).join("\n\n"),
  });
}
console.log(`英文卷题 ${titles.length} 条，首「${titles[0].en}」末「${titles[N - 1].en}」`);

// —— 二、一次性译出 ——
async function translateTitles(list) {
  const KEY = process.env.JDCLOUD_API_KEY;
  if (!KEY) throw new Error("缺少 JDCLOUD_API_KEY");
  const sys = [
    "你是严谨的文学翻译家。下面是 Samuel Butler 英译《奥德赛》各卷卷首的内容提要（卷题），把它们译成简体中文。",
    `人名地名译名表（严格遵守）：${GLOSS}。`,
    "卷题要求：简练如目录标题，不加句号；原题以破折号分段者，译文用中文破折号「——」照分；",
    "不得增字解释，不得合并或拆分条目。",
    "按「序号|译文」逐行输出，共 24 行，不输出任何其他文字。",
  ].join("\n");
  const user = list.map((t) => `${t.n}|${t.en}`).join("\n");
  for (let retry = 0; ; retry++) {
    const res = await fetch("https://modelservice.jdcloud.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + KEY },
      body: JSON.stringify({
        model: "Doubao-Seed-2.0-pro",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      if (retry < 4 && (res.status >= 500 || res.status === 429)) {
        await new Promise((r) => setTimeout(r, 3000 * (retry + 1)));
        continue;
      }
      throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json();
    const out = (j.choices?.[0]?.message?.content ?? "").trim();
    const map = new Map();
    for (const line of out.split("\n")) {
      const m = line.match(/^\s*(\d+)\s*[|｜]\s*(.+?)\s*$/);
      if (m) map.set(+m[1], m[2].replace(/[。．.]$/, ""));
    }
    const miss = list.filter((t) => !map.get(t.n)).map((t) => t.n);
    if (!miss.length) return map;
    if (retry >= 4) throw new Error("卷题译文缺：" + miss.join(","));
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const zhTitles = DRY
  ? new Map(titles.map((t) => [t.n, "（dry）" + t.en]))
  : await translateTitles(titles);
for (const t of titles) console.log(`  ${t.n} ${t.en}\n     → ${zhTitles.get(t.n)}`);

// —— 三、落盘：章文件与 meta 各得 title，提要不再占正文 ——
function writeMeta(dir, list) {
  const p = join(dir, "meta.json");
  if (!existsSync(p)) throw new Error("缺 meta.json：" + p);
  const m = JSON.parse(readFileSync(p, "utf8"));
  const byN = new Map(list.map((c) => [c.n, c.title]));
  m.chapters = m.chapters.map((c) => ({ n: c.n, name: c.name, title: byN.get(c.n) ?? c.title }));
  if (!DRY) writeFileSync(p, JSON.stringify(m, null, 1));
}

const enList = [];
for (const t of titles) {
  enList.push({ n: t.n, title: t.en });
  if (!DRY)
    writeFileSync(
      join(EN, `${t.n}.json`),
      JSON.stringify({ n: t.n, name: t.name, title: t.en, content: t.body }, null, 1),
    );
}
writeMeta(EN, enList);

const zhList = [];
for (const t of titles) {
  const p = join(ZH, `${t.n}.json`);
  if (!existsSync(p)) continue; // 中译卷未译全时只补已有的
  const ch = JSON.parse(readFileSync(p, "utf8"));
  const title = zhTitles.get(t.n);
  let ps = paras(ch.content);
  if (ZH_LEAD_TITLE.includes(t.n)) {
    const head = ps[0].trim();
    if (head.length > 90 || head.includes("\n"))
      throw new Error(`第${t.n}卷中译首段不像卷题，长 ${head.length}：${head.slice(0, 40)}`);
    ps = ps.slice(1);
  }
  zhList.push({ n: t.n, title });
  if (!DRY)
    writeFileSync(
      p,
      JSON.stringify({ n: t.n, name: ch.name, title, content: ps.join("\n\n") }, null, 1),
    );
}
writeMeta(ZH, zhList);

console.log(
  `${DRY ? "[dry] " : ""}英文卷 ${enList.length} 卷、中译卷 ${zhList.length} 卷已补卷题；提要已自正文首段提出。`,
);
