#!/usr/bin/env node
/**
 * 为完整四库正文生成两份浏览器运行时索引：
 *
 * 1. toc-index.json：1002 部可读书的章目合卷，避免检索时发出上千个 meta 请求；
 * 2. quotable-all/：每书一份均匀抽样的原文证据，供文脉关系引用按书加载；另有
 *    search.json 收较小的全库样本，供“其文”跨库字面检索。
 *
 * 原始章节仍是唯一的完整正文。这里的片段只做发现与引用入口，每条都保留 n，点击后
 * 会回到原书原章。抽样按全文位置均匀取，不让卷首或短篇书独占。
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SIKU = path.join(ROOT, "public", "siku");
const BOOKS = path.join(SIKU, "books");
const OUT = path.join(SIKU, "quotable-all");
const PER_BOOK = 120;
const PER_BOOK_SEARCH = 18;
const MAX_CHARS = 260;
const MIN_CHARS = 18;

function clean(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function chunks(content) {
  const paras = String(content ?? "")
    .split(/\n+/)
    .map(clean)
    .filter((s) => s.length >= MIN_CHARS);
  const out = [];
  for (const para of paras) {
    if (para.length <= MAX_CHARS) {
      out.push(para);
      continue;
    }
    for (let at = 0; at < para.length; at += MAX_CHARS) {
      const s = para.slice(at, at + MAX_CHARS).trim();
      if (s.length >= MIN_CHARS) out.push(s);
    }
  }
  return out;
}

function evenly(xs, limit) {
  if (xs.length <= limit) return xs;
  const out = [];
  for (let i = 0; i < limit; i += 1) {
    out.push(xs[Math.floor((i * (xs.length - 1)) / Math.max(1, limit - 1))]);
  }
  return out;
}

const catalog = JSON.parse(await fs.readFile(path.join(SIKU, "catalog.json"), "utf8"));
const readable = catalog.filter((e) => e.bookId);
await fs.mkdir(OUT, { recursive: true });

const toc = [];
const qindex = [];
const searchBooks = [];
let passages = 0;

for (let k = 0; k < readable.length; k += 1) {
  const entry = readable[k];
  const dir = path.join(BOOKS, entry.bookId);
  const meta = JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8"));
  toc.push({ bookId: entry.bookId, chapters: meta.chapters });

  const candidates = [];
  for (const c of meta.chapters) {
    const chapter = JSON.parse(await fs.readFile(path.join(dir, `${c.n}.json`), "utf8"));
    for (const text of chunks(chapter.content)) candidates.push({ n: c.n, chapter: c.name, text });
  }
  const items = evenly(candidates, PER_BOOK);
  const file = {
    bookId: entry.bookId,
    lineageId: entry.lineageId,
    title: entry.title,
    author: entry.author,
    authorIds: [],
    items,
  };
  await fs.writeFile(path.join(OUT, `${entry.bookId}.json`), JSON.stringify(file));
  qindex.push({
    bookId: entry.bookId,
    lineageId: entry.lineageId,
    title: entry.title,
    author: entry.author,
    group: entry.group,
    category: entry.category,
    dynasty: entry.dynasty,
    chapters: entry.chapters,
    items: items.length,
  });
  searchBooks.push({ bookId: entry.bookId, items: evenly(items, PER_BOOK_SEARCH) });
  passages += items.length;
  if ((k + 1) % 100 === 0) process.stdout.write(`\r${k + 1}/${readable.length}`);
}

await fs.writeFile(path.join(SIKU, "toc-index.json"), JSON.stringify({ books: toc }));
await fs.writeFile(path.join(OUT, "index.json"), JSON.stringify(qindex));
await fs.writeFile(path.join(OUT, "search.json"), JSON.stringify({ books: searchBooks }));
process.stdout.write(`\r${readable.length}/${readable.length}\n`);
console.log(`generated toc for ${toc.length} books and ${passages} per-book evidence passages`);
