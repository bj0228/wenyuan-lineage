/** Project reviewed Chinese and Western book relations onto the geography index. */
import fs from "node:fs";
import { FORMAL_SIKU_EDGES, SIKU_REL } from "../app/world/sikuLineage";
import { WESTERN_LINEAGE_CANDIDATES } from "../app/world/westernLineage";
import { WESTERN_CANON } from "../app/world/westernCanon";

const path = new URL("../public/data/geocultural-index.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const worldlitCatalogPath = new URL("../public/worldlit/catalog-20261108-zh-chapter.json", import.meta.url);
const worldlitCatalog = JSON.parse(fs.readFileSync(worldlitCatalogPath, "utf8"));
const readableWesternIds = new Set<string>(worldlitCatalog.map((book: { id: string }) => book.id));
const worldLitIdByCanonical = new Map(WESTERN_CANON.map((book) => [book.id, book.worldLitId || book.id]));
const norm = (s: string) => String(s || "").replace(/^目:/, "").replace(/^wl:/, "").replace(/^.*\//, "").replace(/[《》〈〉\s（）()]/g, "").toLowerCase();

type Anchor = { placeId: string; place: string; lon: number; lat: number; bookId: string; title: string; era: string };
const chineseById = new Map<string, Anchor>();
const chineseByTitle = new Map<string, Anchor>();
for (const place of data.places) {
  for (const book of place.books) {
    const anchor = { placeId: place.id, place: place.name, lon: place.lon, lat: place.lat, bookId: book.id, title: book.title, era: book.era };
    chineseById.set(book.id, anchor);
    chineseByTitle.set(norm(book.title), anchor);
  }
}
const resolveChinese = (key: string) => chineseById.get(key) || chineseByTitle.get(norm(key));

const chinese = FORMAL_SIKU_EDGES.flatMap((edge, index) => {
  const from = resolveChinese(edge.from); const to = resolveChinese(edge.to);
  if (!from || !to || from.placeId === to.placeId) return [];
  return [{
    id: `cn-${index}-${edge.from}-${edge.to}`, scope: "china", from, to, type: edge.type,
    label: SIKU_REL[edge.type].label, note: edge.note, color: SIKU_REL[edge.type].color,
    dash: SIKU_REL[edge.type].dash, arrow: SIKU_REL[edge.type].arrow,
  }];
});

const westByBook = new Map<string, Anchor>();
for (const origin of data.westernOrigins) {
  for (const book of origin.books) {
    book.worldLitId = worldLitIdByCanonical.get(book.id) || book.id;
    book.readable = readableWesternIds.has(book.worldLitId);
    westByBook.set(`wl:${book.id}`, {
      placeId: origin.id, place: origin.name, lon: origin.lon, lat: origin.lat, bookId: book.id, title: book.title, era: book.era,
    });
  }
}
const western = WESTERN_LINEAGE_CANDIDATES.flatMap((edge, index) => {
  if (edge.review.status !== "accepted") return [];
  const from = westByBook.get(edge.from); const to = westByBook.get(edge.to);
  if (!from || !to || from.placeId === to.placeId) return [];
  return [{
    id: `west-${index}-${edge.from}-${edge.to}`, scope: "world", from, to, type: edge.type,
    label: SIKU_REL[edge.type].label, note: edge.note, color: SIKU_REL[edge.type].color,
    dash: SIKU_REL[edge.type].dash, arrow: SIKU_REL[edge.type].arrow,
  }];
});

data.routes = { chinese, western };
data.summary.mappedChineseRelations = chinese.length;
data.summary.mappedWesternRelations = western.length;
data.summary.readableWesternBooks = data.westernOrigins.flatMap((origin: { books: Array<{ readable?: boolean }> }) => origin.books).filter((book: { readable?: boolean }) => book.readable).length;
fs.writeFileSync(path, JSON.stringify(data));
console.log(JSON.stringify({ chinese: chinese.length, western: western.length, readableWesternBooks: data.summary.readableWesternBooks }, null, 2));
