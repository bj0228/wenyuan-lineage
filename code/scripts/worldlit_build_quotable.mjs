import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const catalog = JSON.parse(await fs.readFile(path.join(root, "public/worldlit/catalog.json"), "utf8"));
const outDir = path.join(root, "public/worldlit/quotable");
await fs.mkdir(outDir, { recursive: true });

const splitLong = (text, max = 900) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return [clean];
  const pieces = clean.split(/(?<=[。！？.!?])\s+/);
  const out = [];
  let buf = "";
  for (const piece of pieces) {
    if (buf && (buf + " " + piece).length > max) { out.push(buf); buf = piece; }
    else buf = buf ? `${buf} ${piece}` : piece;
  }
  if (buf) out.push(buf);
  return out;
};

const index = [];
for (const book of catalog) {
  const edition = book.editions.find((e) => e.lang === "zh") ?? book.editions.find((e) => e.lang === "en");
  if (!edition) continue;
  const items = [];
  for (let n = 1; n <= edition.chapters; n += 1) {
    try {
      const chapter = JSON.parse(await fs.readFile(path.join(root, `public/worldlit/books/${edition.id}/${n}.json`), "utf8"));
      const paras = String(chapter.content ?? "").split(/\n\s*\n+/).flatMap((p) => splitLong(p)).filter((p) => p.length >= 45);
      for (const text of paras) items.push({ n, chapter: chapter.name || `Chapter ${n}`, text });
    } catch { /* an edition may have a missing fragment */ }
  }
  const cap = 240;
  const sampled = items.length <= cap ? items : Array.from({ length: cap }, (_, i) => items[Math.floor(i * (items.length - 1) / (cap - 1))]);
  const file = { bookId: book.id, title: book.name, author: book.author, authorIds: [], worldId: "west", items: sampled };
  await fs.writeFile(path.join(outDir, `${book.id}.json`), JSON.stringify(file));
  index.push({ bookId: book.id, title: book.name, author: book.author, editionId: edition.id, lang: edition.lang, items: sampled.length });
}
await fs.writeFile(path.join(outDir, "index.json"), JSON.stringify(index, null, 2));
console.log(`built ${index.length} books, ${index.reduce((n, b) => n + b.items, 0)} passages`);
