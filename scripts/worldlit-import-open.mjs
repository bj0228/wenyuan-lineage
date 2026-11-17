#!/usr/bin/env node
/**
 * Import conservatively selected public-domain English editions from Project Gutenberg.
 *
 * Each output book keeps its exact source URL, ebook number, edition/translator and license
 * note in meta.json.  We deliberately do not import a modern Chinese translation merely
 * because the underlying work is old: a translation is a separate copyrighted work.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "public/worldlit/books");
const manifest = JSON.parse(readFileSync(join(ROOT, "scripts/worldlit-open-books.json"), "utf8"));
const canonSrc = readFileSync(join(ROOT, "app/world/westernCanon.ts"), "utf8");

const canon = new Map();
for (const line of canonSrc.split("\n")) {
  const m = line.match(/\{ id: "([^"]+)", name: "([^"]+)", author: "([^"]+)", year: (-?\d+), era: "([^"]+)", origin: "([^"]+)", category: "([^"]+)"/);
  if (m) canon.set(m[1], { id: m[1], name: m[2], author: m[3], year: Number(m[4]), era: m[5], origin: m[6], category: m[7] });
}

const stripGutenberg = (s) => {
  s = s.replace(/\r\n?/g, "\n");
  const a = s.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const b = s.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (a >= 0) s = s.slice(s.indexOf("\n", a) + 1);
  if (b >= 0) s = s.slice(0, b);
  return s.trim();
};

const cleanHeading = (s) => s.trim().replace(/[_*]/g, "").replace(/\s+/g, " ").slice(0, 180);
const headingType = (line) => {
  const s = cleanHeading(line);
  if (!s || s.length > 130) return null;
  const m = s.match(/^(BOOK|CHAPTER|PART|CANTO|ACT|SECTION|LETTER|ESSAY|LECTURE|VOLUME|TREATISE|PROPOSITION|SCENE)\b/i);
  if (m) return m[1].toUpperCase();
  if (/^THE\s+(?:FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH)\s+BOOK\b/i.test(s)) return "BOOK";
  if (/^[IVXLCDM]+\.\s+\S/.test(s)) return "SECTION";
  return null;
};

function reflow(body) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.split("\n").map((x) => x.trim()).filter(Boolean).join(" "))
    .map((p) => p.replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 1)
    .join("\n\n");
}

function splitText(raw) {
  const text = stripGutenberg(raw);
  const lines = text.split("\n");
  const candidates = new Map();
  lines.forEach((line, i) => {
    const type = headingType(line);
    if (!type) return;
    // A heading must be visually isolated; this drops most TOC rows embedded in prose.
    const before = i === 0 || !lines[i - 1].trim();
    const after = i + 1 === lines.length || !lines[i + 1].trim() || lines[i + 1].trim().length < 140;
    if (before && after) candidates.set(type, [...(candidates.get(type) ?? []), i]);
  });
  const priority = ["CHAPTER", "BOOK", "CANTO", "LETTER", "LECTURE", "SECTION", "PART", "ACT", "ESSAY", "TREATISE", "VOLUME", "PROPOSITION", "SCENE"];
  const eligible = priority.map((type) => [type, candidates.get(type) ?? []]).filter(([, xs]) => xs.length >= 2);
  const maxSpan = Math.max(0, ...eligible.map(([, xs]) => xs.at(-1) - xs[0]));
  // Prefer semantic chapter heads, but never choose a short table-of-contents family when
  // another heading family spans the actual body (e.g. Zarathustra's roman-numbered sections).
  const chosen = eligible.find(([, xs]) => xs.at(-1) - xs[0] >= maxSpan * 0.75);
  let chapters = [];
  if (chosen) {
    const [, allIdx] = chosen;
    // Gutenberg often prints a dense table of contents before the same headings in the body.
    // Detect that short-gap run and begin after its final large jump into the real text.
    let idx = allIdx;
    const gaps = allIdx.slice(1).map((x, i) => x - allIdx[i]);
    if (gaps.slice(0, Math.min(12, gaps.length)).filter((g) => g <= 5).length >= Math.min(6, gaps.length)) {
      const jump = gaps.findIndex((g, i) => i >= 3 && g >= 20);
      if (jump >= 0 && allIdx.length - jump - 1 >= 2) idx = allIdx.slice(jump + 1);
    }
    // Repeated TOCs create many tiny slices. Prefer the last monotonic run whose median body is substantial.
    const viable = idx.filter((at, k) => {
      const end = k + 1 < idx.length ? idx[k + 1] : lines.length;
      return end - at > 3;
    });
    const use = viable.length >= 2 ? viable : idx;
    chapters = use.map((at, k) => {
      const end = k + 1 < use.length ? use[k + 1] : lines.length;
      return { n: k + 1, name: cleanHeading(lines[at]), content: reflow(lines.slice(at + 1, end).join("\n")) };
    }).filter((c) => c.content.length >= 120);
  }
  if (chapters.length < 2) {
    // Works without explicit chapter heads remain readable: split at paragraph boundaries,
    // never in the middle of a sentence or line.
    const paras = reflow(text).split("\n\n");
    let buf = [], size = 0;
    for (const p of paras) {
      if (size >= 28000 && buf.length) {
        chapters.push({ n: chapters.length + 1, name: `Part ${chapters.length + 1}`, content: buf.join("\n\n") });
        buf = []; size = 0;
      }
      buf.push(p); size += p.length;
    }
    if (buf.length) chapters.push({ n: chapters.length + 1, name: `Part ${chapters.length + 1}`, content: buf.join("\n\n") });
  }
  // A few editions use only BOOK headings around extremely long books. Keep the semantic
  // heading, but subdivide an unwieldy body at paragraph boundaries for browser reading.
  const readable = [];
  for (const chapter of chapters) {
    if (chapter.content.length <= 90000) { readable.push(chapter); continue; }
    const paras = chapter.content.split("\n\n");
    let buf = [], size = 0, part = 1;
    for (const p of paras) {
      if (size >= 45000 && buf.length) {
        readable.push({ ...chapter, name: `${chapter.name} · ${part++}`, content: buf.join("\n\n") });
        buf = []; size = 0;
      }
      buf.push(p); size += p.length;
    }
    if (buf.length) readable.push({ ...chapter, name: part > 1 ? `${chapter.name} · ${part}` : chapter.name, content: buf.join("\n\n") });
  }
  return readable.map((c, i) => ({ ...c, n: i + 1 }));
}

const only = process.argv.slice(2);
const jobs = only.length ? manifest.filter((x) => only.includes(x.id)) : manifest;
const failed = [];
let cursor = 0;

async function worker() {
  while (cursor < jobs.length) {
    const item = jobs[cursor++];
    const c = canon.get(item.id);
    if (!c) { failed.push([item.id, "canonical metadata missing"]); continue; }
    const url = `https://www.gutenberg.org/cache/epub/${item.gutenbergId}/pg${item.gutenbergId}.txt`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Wenyuan-Xunmai academic demo (single-edition importer)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      if (!raw.includes("Project Gutenberg")) throw new Error("not a Gutenberg text");
      const chapters = splitText(raw);
      if (!chapters.length || chapters.reduce((n, x) => n + x.content.length, 0) < 3000) throw new Error("too little body text");
      const bookId = `${item.id}-en`;
      const dir = join(OUT, bookId);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      for (const ch of chapters) writeFileSync(join(dir, `${ch.n}.json`), JSON.stringify(ch, null, 1));
      const meta = {
        id: bookId,
        name: c.name,
        originalTitle: item.enTitle,
        author: c.author,
        translator: item.translator,
        era: c.era,
        origin: c.origin,
        note: `English public-domain edition: ${item.enTitle}; ${item.translator}. Source: Project Gutenberg eBook #${item.gutenbergId}.`,
        source: {
          platform: "Project Gutenberg",
          ebookId: String(item.gutenbergId),
          url,
          licenseUrl: "https://www.gutenberg.org/policy/license",
          rights: "Edition marked by Project Gutenberg as not restricted by U.S. copyright law; verify local jurisdiction before redistribution."
        },
        chapters: chapters.map(({ n, name }) => ({ n, name }))
      };
      writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 1));
      const chars = chapters.reduce((n, x) => n + x.content.length, 0);
      console.log(`OK ${item.id}: ${chapters.length} chapters, ${chars} chars`);
    } catch (e) {
      failed.push([item.id, String(e?.message ?? e)]);
      console.error(`FAIL ${item.id}: ${e?.message ?? e}`);
    }
  }
}

await Promise.all(Array.from({ length: 3 }, () => worker()));
console.log(`Imported ${jobs.length - failed.length}/${jobs.length}`);
if (failed.length) {
  console.log("Failed:", JSON.stringify(failed));
  process.exitCode = 2;
}
