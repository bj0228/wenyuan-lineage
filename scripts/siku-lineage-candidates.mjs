#!/usr/bin/env node
/**
 * 从《四库全书总目提要》发现“书 A → 书 B”的待审候选。
 *
 * 此脚本只负责召回，不直接改 sikuLineage.ts：提要里“据《汉书》”有时只是说明作者
 * 生平，并不表示目标书取材《汉书》。候选必须人工核对完整上下文，确认七类之一后，
 * 才能携 evidence 收入正式关系表。
 */
import { readFile, writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://raw.githubusercontent.com/garychowcmu/daizhigev20/master/%E5%8F%B2%E8%97%8F/%E7%9B%AE%E5%BD%95/%E5%9B%9B%E5%BA%93%E5%85%A8%E4%B9%A6%E6%80%BB%E7%9B%AE%E6%8F%90%E8%A6%81.txt";
const CATALOG_PATH = new URL("../public/siku/catalog.json", import.meta.url);
const OUTPUT_PATH = new URL("../public/siku/lineage-candidates.json", import.meta.url);

const HAN_MAP = new Map(Object.entries({
  國: "国", 書: "书", 傳: "传", 註: "注", 經: "经", 說: "说", 義: "义",
  禮: "礼", 詩: "诗", 漢: "汉", 續: "续", 補: "补", 輯: "辑", 證: "证",
  學: "学", 語: "语", 論: "论", 記: "记", 選: "选", 藝: "艺", 類: "类",
  龍: "龙", 齊: "齐", 東: "东", 後: "后", 舊: "旧", 風: "风", 華: "华",
  廣: "广", 釋: "释", 應: "应", 爾: "尔", 樂: "乐", 劉: "刘",
}));

function norm(value) {
  return [...value]
    .map((ch) => HAN_MAP.get(ch) ?? ch)
    .join("")
    .replace(/[《》〈〉\s·•—_（）()\[\]【】\-]/g, "");
}

const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
const byTitle = new Map();
for (const entry of catalog) {
  const key = norm(entry.title);
  if (key.length > 1 && !byTitle.has(key)) byTitle.set(key, entry);
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`总目下载失败：HTTP ${response.status}`);
const raw = await response.text();

const rules = [
  ["传", /(?:为之作|作|撰|有)[^。；]{0,10}(?:注|疏|解|笺|章句)[^。；]{0,10}《([^》]+)》[^。；]{0,35}/g],
  ["采", /(?:此取|乃取|多取|悉取|杂取|采自|取自|本於|本于|援据|引用|采摭|采录)[^。；]{0,24}《([^》]+)》[^。；]{0,35}/g],
  ["承", /(?:仿|祖述|沿|踵|本其体|法其)[^。；]{0,18}《([^》]+)》[^。；]{0,35}/g],
  ["驳", /(?:驳|辨|纠|攻)[^。；]{0,18}《([^》]+)》[^。；]{0,35}/g],
  ["并", /(?:与|同)[^。；]{0,12}《([^》]+)》[^。；]{0,12}(?:并称|并行|并传|相配)[^。；]{0,25}/g],
  ["续", /(?:续|接)[^。；]{0,12}《([^》]+)》[^。；]{0,35}/g],
  ["托", /(?:伪托|依托|托名|妄题)[^。；]{0,18}《([^》]+)》[^。；]{0,35}/g],
];

/** 已完成的人工复核。未列入者保留 pending，避免脚本重跑覆盖审定结论。 */
const reviews = new Map([
  ["驳|南史|北史", ["rejected", "提要作者以《南史》作外证，不是《北史》主动非难《南史》"]],
  ["驳|楚辞|楚辞补註", ["rejected", "辨的是篇目归属，主关系仍是为《楚辞》作传注"]],
  ["传|文选|春秋左传", ["rejected", "这里只是以李善注《文选》作体例比喻"]],
  ["驳|沧浪诗话|钝吟杂录", ["accepted", "明确纠严羽诗论之谬"]],
  ["采|楚辞|尔雅注疏", ["accepted-normalized", "证据所述对象是《尔雅》正文，正式边已改指《尔雅》"]],
  ["采|尔雅|尔雅注疏", ["accepted", "《尔雅注疏》以《尔雅》为所释原典，正式表已有传注边"]],
  ["采|管子|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["采|国语|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["采|列子|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["采|吕氏春秋|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["采|穆天子传|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["采|山海经|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["采|庄子|尔雅注疏", ["accepted-normalized", "正式边改指《尔雅》正文"]],
  ["驳|孔丛子|公孙龙子", ["rejected", "两书记事互异，不等于后书主动非难前书"]],
  ["续|弘明集|广弘明集", ["accepted", "提要明言续《弘明集》"]],
  ["驳|后汉书|敬斋古今黈", ["rejected", "《后汉书》被用作支持证据，并非被驳对象"]],
  ["驳|列子|敬斋古今黈", ["accepted", "明确辨正《列子》相关训释"]],
  ["驳|论语|敬斋古今黈", ["accepted", "明确辨正《论语》文本解释"]],
  ["驳|千字文|敬斋古今黈", ["accepted", "明确驳作者旧说"]],
  ["驳|山海经|敬斋古今黈", ["rejected", "《山海经》只是辨误所用外证"]],
  ["驳|史記|敬斋古今黈", ["accepted", "明确辨《史记》一处文字"]],
  ["承|汉书|梁书", ["accepted", "提要明言仿《汉书》题署体例"]],
  ["承|列女传|列仙传", ["accepted", "提要明言仿《列女传》"]],
  ["承|东京梦华录|梦粱录", ["accepted", "提要明言仿其体例，正式表已有边"]],
  ["续|汉书|容斋随笔", ["rejected", "命中的是书中所谈《续汉书志》，并非《容斋随笔》续《汉书》"]],
  ["传|论语|尚书正义", ["rejected", "只是提要转述孔安国注《论语》的异文"]],
  ["并|文心雕龙|诗品", ["accepted", "提要明言两书并称"]],
  ["续|崇文总目|世说新语", ["rejected", "“续”属于邻近书名残片，非两书相续"]],
  ["续|宋史|宋朝事实", ["rejected", "正文说与《宋史》互相参订，并非续修《宋史》"]],
  ["采|南史|宋书", ["accepted", "今本《宋书》确以《南史》补阙"]],
  ["承|周易|太玄经", ["accepted", "提要明言仿《周易》"]],
  ["驳|唐会要|文献通考", ["accepted", "明确指出《唐会要》相关制度记载之缺"]],
  ["传|世说新语|吴越春秋", ["rejected", "“有遗意”只是文风类比，不能证明传注"]],
  ["采|论语|新语", ["accepted", "提要明言援据《论语》"]],
  ["驳|庄子|艺文类聚", ["rejected", "是第三方辨《艺文类聚》误引，并非该书驳《庄子》"]],
  ["驳|唐会要|中说", ["rejected", "是总目用《唐会要》辨《中说》年代，不是《中说》驳前书"]],
  ["驳|周礼|周礼注疏", ["rejected", "提要讨论前人攻《周礼》，注疏本身不是发难者"]],
  ["采|北史|周书", ["accepted", "提要明言取《北史》补亡"]],
  ["驳|吕氏春秋|竹书纪年", ["accepted", "提要明言《竹书纪年》驳《吕氏春秋》"]],
]);

const found = new Map();
for (const segment of raw.split(/(?=△《)/)) {
  const firstLine = segment.slice(0, Math.max(0, segment.indexOf("\n")) || 200);
  const headings = [...firstLine.matchAll(/《([^》]+)》/g)];
  const target = headings.map((m) => byTitle.get(norm(m[1]))).find(Boolean);
  if (!target) continue;

  for (const [type, pattern] of rules) {
    pattern.lastIndex = 0;
    for (const match of segment.matchAll(pattern)) {
      const source = byTitle.get(norm(match[1]));
      if (!source || source.title === target.title) continue;
      const evidence = match[0].replace(/\s+/g, "");
      const key = `${source.title}|${target.title}|${type}`;
      if (!found.has(key)) {
        const review = reviews.get(`${type}|${source.title}|${target.title}`);
        found.set(key, {
          from: source.title,
          to: target.title,
          type,
          evidence,
          evidenceSource: `《四库全书总目提要·${target.title}提要》`,
          status: review?.[0] ?? "pending",
          reviewNote: review?.[1],
        });
      }
    }
  }
}

const candidates = [...found.values()].sort((a, b) =>
  a.to.localeCompare(b.to, "zh-CN") || a.from.localeCompare(b.from, "zh-CN"),
);
await writeFile(
  OUTPUT_PATH,
  `${JSON.stringify({ source: SOURCE_URL, count: candidates.length, candidates }, null, 2)}\n`,
  "utf8",
);
const reviewCounts = Object.fromEntries(
  ["accepted", "accepted-normalized", "rejected", "pending"].map((status) => [
    status,
    candidates.filter((candidate) => candidate.status === status).length,
  ]),
);
console.log(`已生成 ${candidates.length} 条候选：${OUTPUT_PATH.pathname}`);
console.log(`复核状态：${JSON.stringify(reviewCounts)}`);
