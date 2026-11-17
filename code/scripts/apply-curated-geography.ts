/** Attach catalog books to evidence-bearing cultural activities in GEO_PLACES. */
import fs from "node:fs";
import { GEO_PLACES } from "../app/world/culturalGeography";
import { fold } from "../app/world/hanVariants";

const path = new URL("../public/data/geocultural-index.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const norm = (value: string) => fold(String(value || ""))
  .replace(/[《》〈〉\s·•，,：:；;。.!！?？“”"'‘’（）()【】\[\]{}]/g, "")
  .toLowerCase();

type RecordHit = { place: (typeof GEO_PLACES)[number]; record: (typeof GEO_PLACES)[number]["records"][number] };
const recordsByTitle = new Map<string, RecordHit[]>();
for (const place of GEO_PLACES) {
  for (const record of place.records) {
    for (const title of record.books) {
      const key = norm(title);
      const list = recordsByTitle.get(key) ?? [];
      list.push({ place, record });
      recordsByTitle.set(key, list);
    }
  }
}

const placeById = new Map<string, any>(data.places.map((place: { id: string }) => [place.id, place]));
const remaining = [];
let mapped = 0;
for (const book of data.unresolved.books) {
  const hits = recordsByTitle.get(norm(book.title)) ?? [];
  // Ambiguous records remain unresolved unless every record points to one place.
  const placeIds = [...new Set(hits.map((hit) => hit.place.id))];
  if (placeIds.length !== 1) {
    remaining.push(book);
    continue;
  }
  const hit = hits[0];
  const id = `curated-${hit.place.id}`;
  let atlasPlace = placeById.get(id);
  if (!atlasPlace) {
    atlasPlace = {
      id,
      name: hit.place.name,
      historical: hit.place.historical,
      region: hit.place.region,
      lon: hit.place.lon,
      lat: hit.place.lat,
      people: [],
      books: [],
      source: "史地策展记录",
    };
    data.places.push(atlasPlace);
    placeById.set(id, atlasPlace);
  }
  atlasPlace.books.push({
    ...book,
    relation: "史地活动关联地",
    locationRole: hit.record.activity,
    locationAddressType: "史地策展记录",
    locationEvidence: `《${book.title}》—${hit.record.date}${hit.place.historical || hit.place.name}${hit.record.activity}：${hit.record.note}`,
    locationScore: 88,
    locationReviewStatus: "人工策展记录",
  });
  mapped += 1;
}

data.unresolved.books = remaining;
data.summary.mappedChineseBooks += mapped;
data.summary.unresolvedChineseBooks = remaining.length;
data.summary.historicalPlaces = data.places.length;
fs.writeFileSync(path, JSON.stringify(data));
console.log(JSON.stringify({ mapped, mappedChineseBooks: data.summary.mappedChineseBooks, unresolvedChineseBooks: remaining.length }, null, 2));
