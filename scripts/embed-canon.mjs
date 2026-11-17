#!/usr/bin/env node
/**
 * 典籍语义向量预计算：
 * 1) 读三份可引语料（诸子 canon.ts、西游 xiyou-passages.ts、西方 west-passages.ts）全部
 *    passage，调 DashScope 向量模型生成向量，并入 app/world/canon-vectors.ts
 *    （打包进 bundle，供同步 retrieve）。
 * 2) 读 app/world/canonFull.ts 全文（书→章→句），逐句 embed，按书分片写
 *    /public/canon-vec/{bookId}.json + index.json（全文，外挂静态 JSON，供异步 retrieveFull）。
 *
 * 用法：DASHSCOPE_API_KEY=你的key npm run embed:canon（须用 tsx 跑，见 embedCanonFull 处注）
 * 先看抽得全不全：npx tsx scripts/embed-canon.mjs --dry（只抽取不调 API，报每份语料的条数与
 * 几条样例。正则抽取是会漏的——语料里添一条格式略异的便悄悄少一条向量，故花钱之前先干跑。）
 * 只补全文那一半：npx tsx scripts/embed-canon.mjs --full（816 条可引典已在 canon-vectors.ts 里时，
 * 不必为了补 /public/canon-vec/ 而把它们重算一遍——同一个模型算两遍结果一样，钱却要再花一次。）
 * 未运行时 canon-vectors.ts 为空对象、/public/canon-vec/ 不存在，retrieve 与 retrieveFull 自动降级纯关键词检索。
 *
 * **三份语料必须一并 embed**，不能只做诸子那一份：`retrieve()` 按 `CANON_VECTORS[p.id]`
 * 逐条查表，查不到的条目只剩关键词分。若只embed诸子，母题层三轴里西游、西方两轴便
 * 仍是纯字面检索，而诸子那轴已有语义分——同一次并置里两套尺度，跨世界对照就不成
 * 其为对照了。三份同源同模型，才比得上。
 *
 * **换向量模型就得全部重算**：库里的向量与查询向量必须同出一模，否则余弦无从比较；
 * 维数若还不同，canon.ts 的 `cosine()` 长度不等即返 0，语义检索会静默失效而不报错。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** 三份可引语料，与 canon.ts 的 `retrievePool` 所并者同——那边并进检索池，这边并进向量表。 */
const PASSAGE_FILES = [
  { label: "诸子", path: resolve(__dirname, "../app/world/canon.ts") },
  { label: "西游", path: resolve(__dirname, "../app/world/xiyou-passages.ts") },
  { label: "西方", path: resolve(__dirname, "../app/world/west-passages.ts") },
];
const OUT_PATH = resolve(__dirname, "../app/world/canon-vectors.ts");
const VEC_DIR = resolve(__dirname, "../public/canon-vec");
const EMBED_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings";
const MODEL = "qwen3.7-text-embedding-flash";
/** 该模型单批上限 25（32 即报 batch size invalid）。 */
const BATCH = 25;

const apiKey = process.env.DASHSCOPE_API_KEY;
/** 干跑：只抽取、报数、给样例，不调 API，故不要 Key。 */
const DRY = process.argv.includes("--dry");
/** 只补全文分片，不动已算好的 canon-vectors.ts（缘由见开篇用法）。 */
const FULL_ONLY = process.argv.includes("--full");
if (!apiKey && !DRY) {
  console.error("✗ 未设置 DASHSCOPE_API_KEY 环境变量");
  process.exit(1);
}

/**
 * 从语料源码中正则抽取每条 passage 的 id/text/gloss/keywords。
 *
 * 三份语料字段次序一致（id 在前，text→gloss→keywords 依次在后），西方那份在 text 前
 * 多一个 `en`，被 `[^}]*?` 跳过即可。`gloss` 空串亦匹配得到（西游那份白话一律留空），
 * 拼串时自然略去。
 */
function extractPassages(src) {
  // 匹配 `{ id: "...", ... keywords: [...] },` 形态的对象（含跨行注释后的条目）
  const re = /\{\s*id:\s*"([^"]+)"[^}]*?text:\s*"((?:[^"\\]|\\.)*)"[^}]*?gloss:\s*"((?:[^"\\]|\\.)*)"[^}]*?keywords:\s*\[([^\]]*)\][^}]*?\}/gs;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, id, text, gloss, kwRaw] = m;
    const keywords = kwRaw.split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    // 拼串作 embedding 输入：原文＋白话＋关键词，语义信息最丰
    const input = `${unesc(text)} ${unesc(gloss)} ${keywords.join(" ")}`.replace(/\s+/g, " ").trim();
    out.push({ id, input });
  }
  return out;
}

function unesc(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, " ").replace(/\\u[0-9a-fA-F]{4}/g, " ");
}

async function embedBatch(texts) {
  const r = await fetch(EMBED_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: texts, dimensions: 1024 }),
  });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`embed 请求失败 ${r.status}: ${detail.slice(0, 300)}`);
  }
  const data = await r.json();
  return data.data.map((d) => d.embedding);
}

async function main() {
  if (FULL_ONLY) {
    await embedCanonFull();
    return;
  }
  // 三份语料各自抽取，按 id 并作一池。id 跨文件不重（诸子无前缀、西游 xy-、西方 w-），
  // 万一重了后来者覆盖前者并报一句——宁可吵一声，不要静悄悄盖掉一条。
  const passages = [];
  const seen = new Set();
  for (const f of PASSAGE_FILES) {
    const src = readFileSync(f.path, "utf-8");
    const got = extractPassages(src);
    if (!got.length) {
      console.error(`✗ 未能从 ${f.label} 抽取任何条目（${f.path}）`);
      process.exit(1);
    }
    // 正则抽得的条数要与源码里的条目数对得上：对不上说明有条目格式略异被跳过了，
    // 而那种漏是不报错的——它只是将来某一条永远没有语义分。宁可此处吵一声。
    const declared = (src.match(/\{\s*id:\s*"/g) || []).length;
    if (got.length !== declared) {
      console.warn(`  ⚠ ${f.label}：源码里 ${declared} 条，抽到 ${got.length} 条，漏了 ${declared - got.length} 条（格式与正则不合）`);
    }
    for (const p of got) {
      if (seen.has(p.id)) console.warn(`  ⚠ id 重复，后者覆盖前者：${p.id}`);
      seen.add(p.id);
    }
    console.log(`▸ ${f.label} ${got.length} 条` + (DRY && got[0] ? `\n    例：${got[0].id} — ${got[0].input.slice(0, 50)}` : ""));
    passages.push(...got);
  }
  if (DRY) {
    console.log(`\n干跑：共 ${passages.length} 条可引典，约 ${Math.ceil(passages.length / 10)} 批。未调 API，未写文件。`);
    return;
  }
  console.log(`▸ 共 ${passages.length} 条可引典，开始生成向量（每批 10 条）…`);

  const vectors = {};
  for (let i = 0; i < passages.length; i += BATCH) {
    const batch = passages.slice(i, i + BATCH);
    const embeds = await embedBatch(batch.map((p) => p.input));
    batch.forEach((p, j) => { vectors[p.id] = embeds[j]; });
    process.stdout.write(`  ✓ ${Math.min(i + BATCH, passages.length)}/${passages.length}\n`);
  }

  // 写入 canon-vectors.ts：每行一个 id，向量以 JSON 串内联。
  //
  // 存五位小数而非原样：向量模型返回的是全精度双精度数，`join(",")` 一个数
  // 占二十字符上下，816 条 × 1024 维便是十六 MB，而 canon-vectors.ts 由 canon.ts 直接
  // import、落在主 chunk 里（构建本已在警告 500 kB）。归一化向量各分量在 ±0.05 量级，
  // 截到五位小数的绝对误差 5e-6，于余弦相似的排序无影响，体积则减去六成。
  const lines = Object.entries(vectors).map(
    ([id, vec]) => `  ${JSON.stringify(id)}: [${vec.map((x) => +x.toFixed(5)).join(",")}],`,
  );
  const file =
    `/* 由 scripts/embed-canon.mjs 自动生成，勿手改。${passages.length} 条 × 1024 维（诸子＋西游＋西方三轴）。*/\n` +
    `export const CANON_VECTORS: Record<string, number[]> = {\n${lines.join("\n")}\n};\n`;
  writeFileSync(OUT_PATH, file, "utf-8");
  console.log(`✓ 已写入 ${OUT_PATH}（${passages.length} 条可引典向量）`);

  await embedCanonFull();
}

/**
 * 全文向量分片：逐句 embed（input = text + gloss），按书分片写 JSON。
 *
 * 径直 import `canonFull.ts` 取 CANON_FULL，不再从源码里抠数组字面量。
 * 原先是正则定位 `CANON_FULL: CanonBook[] =` 再括号配对截出字面量、`eval` 求值，
 * 实跑报 `Unexpected token ']'`——括号配对不认字符串与注释，语料里一个方括号便
 * 错位。故本函数一直是失败的，全文那 51 句从来没有向量，`retrieveFull` 的语义
 * 分始终是空的。import 得来的是模块自己求值的结果，没有这一类脆处。
 *
 * 因此本脚本须用 tsx 跑（见 package.json 的 embed:canon）：.mjs 里 import .ts，
 * 要靠 tsx 转译。
 */
async function embedCanonFull() {
  const { CANON_FULL: books } = await import("../app/world/canonFull.ts");
  if (!books?.length) { console.log("▸ canonFull 为空，跳过全文向量。"); return; }
  console.log(`▸ 全文：${books.length} 部书，${books.reduce((n, b) => n + b.chapters.reduce((m, c) => m + c.verses.length, 0), 0)} 句，开始分片 embed…`);

  mkdirSync(VEC_DIR, { recursive: true });
  const manifest = [];
  for (const book of books) {
    const verses = book.chapters.flatMap((c) => c.verses.map((v) => ({ verseId: `${book.id}-${c.id}-${v.id}`, text: v.text, gloss: v.gloss ?? "" })));
    const vectors = {};
    for (let k = 0; k < verses.length; k += BATCH) {
      const batch = verses.slice(k, k + BATCH);
      const embeds = await embedBatch(batch.map((v) => `${v.text} ${v.gloss}`.trim()));
      // 同样截五位小数（缘由见上）。这边是外挂 JSON、按书分片取，体积不压主 chunk，
      // 但一样要走网络，照同一个规矩存。
      batch.forEach((v, j) => { vectors[v.verseId] = embeds[j].map((x) => +x.toFixed(5)); });
      process.stdout.write(`  [${book.name}] ${Math.min(k + BATCH, verses.length)}/${verses.length}\n`);
    }
    const outFile = resolve(VEC_DIR, `${book.id}.json`);
    writeFileSync(outFile, JSON.stringify({ bookId: book.id, book: book.name, vectors }), "utf-8");
    manifest.push({ bookId: book.id, book: book.name, chunks: verses.length });
  }
  writeFileSync(resolve(VEC_DIR, "index.json"), JSON.stringify(manifest), "utf-8");
  console.log(`✓ 全文向量分片写入 ${VEC_DIR}（${manifest.length} 部书）`);
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
