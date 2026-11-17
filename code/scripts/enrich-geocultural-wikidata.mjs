/**
 * Add high-confidence geographic anchors from Wikidata.
 *
 * A book is accepted only when its Chinese label or alias exactly matches the
 * catalog title after traditional/simplified folding, and the entity exposes
 * either a creation/publication place or an author with a recorded place.
 * QIDs, properties and source URLs are retained on every accepted record.
 */
import fs from "node:fs";

const ROOT = new URL("../", import.meta.url);
const atlasPath = new URL("public/data/geocultural-index.json", ROOT);
const cachePath = new URL("scripts/cache/wikidata-geography.json", ROOT);
const variants = fs.readFileSync(new URL("app/world/hanVariants.ts", ROOT), "utf8");
const trad = [...(variants.match(/export const TRAD = "([^"]+)"/)?.[1] ?? "")];
const simp = [...(variants.match(/export const SIMP = "([^"]+)"/)?.[1] ?? "")];
const foldMap = new Map(trad.map((char, index) => [char, simp[index]]));
const fold = (value) => [...String(value ?? "")]
  .map((char) => foldMap.get(char) ?? char).join("").toLowerCase();
const norm = (value) => fold(value)
  .replace(/[《》〈〉\s·•，,：:；;。.!！?？“”"'‘’（）()【】\[\]{}]/g, "")
  .replace(/[一二三四五六七八九十百千〇零0-9]+卷.*$/, "")
  .trim();

const data = JSON.parse(fs.readFileSync(atlasPath, "utf8"));
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : { searches: {}, entities: {} };
cache.searches ||= {};
cache.entities ||= {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchJson(url, attempts = 4, options = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, {
      ...options,
      headers: { "user-agent": "WenyuanXunmai/1.0 (academic cultural exploration demo)", ...(options.headers ?? {}) },
    });
    if (response.ok) return response.json();
    if (attempt === attempts) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    await sleep(response.status === 429 ? 12_000 : 500 * attempt);
  }
}

async function mapLimit(items, limit, mapper) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const unresolved = data.unresolved.books;
const missingSearches = [...new Set(unresolved.map((book) => book.title))]
  .filter((title) => !cache.searches[title]);
let searched = 0;
const titleChunks = [];
for (let index = 0; index < missingSearches.length; index += 10) titleChunks.push(missingSearches.slice(index, index + 10));
const searchChunk = async (chunk) => {
  // Exact Chinese Wikipedia pages provide stable Wikidata QIDs in batches.
  // Redirects and normalized titles are resolved before the result is stored.
  const params = new URLSearchParams({
    action: "query", titles: chunk.join("|"), redirects: "1", prop: "pageprops",
    format: "json", origin: "*",
  });
  const result = await fetchJson("https://zh.wikipedia.org/w/api.php", 4, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: params,
  });
  const aliases = new Map();
  for (const row of [...(result.query?.normalized ?? []), ...(result.query?.redirects ?? [])]) aliases.set(row.from, row.to);
  const pages = new Map(Object.values(result.query?.pages ?? {}).map((page) => [page.title, page]));
  const resolveTitle = (title) => {
    let current = title;
    for (let index = 0; index < 4 && aliases.has(current); index += 1) current = aliases.get(current);
    return current;
  };
  for (const title of chunk) {
    const page = pages.get(resolveTitle(title));
    cache.searches[title] = page?.pageprops?.wikibase_item
      ? [{ id: page.pageprops.wikibase_item, label: page.title, description: "中文维基百科同名条目", aliases: [] }]
      : [];
    searched += 1;
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache));
  await sleep(2_200);
};
if (process.env.SKIP_WIKIDATA_SEARCH !== "1") {
  try {
    await mapLimit(titleChunks, 1, searchChunk);
  } catch (error) {
    console.warn(`Wikimedia title lookup paused; continuing with ${Object.keys(cache.searches).length} cached titles.`, error.message);
  }
}

cache.wikisourceSearches ||= {};
const missingWikisource = [...new Set(unresolved.map((book) => book.title))]
  .filter((title) => !(title in cache.wikisourceSearches) && !(cache.searches[title]?.length));
const wikisourceChunks = [];
for (let index = 0; index < missingWikisource.length; index += 10) wikisourceChunks.push(missingWikisource.slice(index, index + 10));
const searchWikisourceChunk = async (chunk) => {
  const params = new URLSearchParams({
    action: "query", titles: chunk.join("|"), redirects: "1", prop: "pageprops",
    format: "json", origin: "*",
  });
  const result = await fetchJson("https://zh.wikisource.org/w/api.php", 4, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: params,
  });
  const aliases = new Map();
  for (const row of [...(result.query?.normalized ?? []), ...(result.query?.redirects ?? [])]) aliases.set(row.from, row.to);
  const pages = new Map(Object.values(result.query?.pages ?? {}).map((page) => [page.title, page]));
  const resolveTitle = (title) => {
    let current = title;
    for (let index = 0; index < 4 && aliases.has(current); index += 1) current = aliases.get(current);
    return current;
  };
  for (const title of chunk) {
    const page = pages.get(resolveTitle(title));
    const hit = page?.pageprops?.wikibase_item
      ? [{ id: page.pageprops.wikibase_item, label: page.title, description: "中文维基文库同名文本", aliases: [] }]
      : [];
    cache.wikisourceSearches[title] = hit;
    if (!cache.searches[title]?.length && hit.length) cache.searches[title] = hit;
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache));
  await sleep(1_400);
};
if (process.env.SKIP_WIKIDATA_SEARCH !== "1") {
  try {
    await mapLimit(wikisourceChunks, 1, searchWikisourceChunk);
  } catch (error) {
    console.warn(`Wikisource title lookup paused; continuing with cached records.`, error.message);
  }
}
fs.writeFileSync(cachePath, JSON.stringify(cache));

const exactIds = [...new Set(unresolved.flatMap((book) => {
  const target = norm(book.title);
  return (cache.searches[book.title] ?? []).filter((hit) =>
    [hit.label, ...(hit.aliases ?? [])].some((label) => norm(label) === target),
  ).map((hit) => hit.id);
}))];

const directProperties = [["P1071", "成书地"], ["P291", "版本出版地"]];
const authorProperties = [["P19", "作者出生地"], ["P551", "作者居住地"], ["P937", "作者活动地"]];
cache.anchors ||= {};
const qid = (value) => String(value ?? "").match(/Q\d+$/)?.[0];
const missingAnchorIds = exactIds.filter((id) => !(id in cache.anchors));
const anchorChunks = [];
for (let index = 0; index < missingAnchorIds.length; index += 80) anchorChunks.push(missingAnchorIds.slice(index, index + 80));
await mapLimit(anchorChunks, 2, async (chunk) => {
  const values = chunk.map((id) => `wd:${id}`).join(" ");
  const query = `
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?item ?property ?author ?place ?coord ?authorLabel ?placeLabel WHERE {
  VALUES ?item { ${values} }
  { ?item wdt:P1071 ?place . BIND("P1071" AS ?property) }
  UNION { ?item wdt:P291 ?place . BIND("P291" AS ?property) }
  UNION { ?item wdt:P50 ?author . ?author wdt:P19 ?place . BIND("P19" AS ?property) }
  UNION { ?item wdt:P50 ?author . ?author wdt:P551 ?place . BIND("P551" AS ?property) }
  UNION { ?item wdt:P50 ?author . ?author wdt:P937 ?place . BIND("P937" AS ?property) }
  ?place wdt:P625 ?coord .
  OPTIONAL { ?author rdfs:label ?authorLabel . FILTER(LANG(?authorLabel)="zh") }
  OPTIONAL { ?place rdfs:label ?placeLabel . FILTER(LANG(?placeLabel)="zh") }
}`;
  const params = new URLSearchParams({ query });
  const result = await fetchJson("https://qlever.dev/api/wikidata", 3, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8", accept: "application/sparql-results+json" },
    body: params,
  });
  for (const id of chunk) cache.anchors[id] = [];
  for (const binding of result.results?.bindings ?? []) {
    const itemId = qid(binding.item?.value);
    const placeId = qid(binding.place?.value);
    const coordinate = String(binding.coord?.value ?? "").match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
    if (!itemId || !placeId || !coordinate) continue;
    cache.anchors[itemId].push({
      property: binding.property?.value,
      authorId: qid(binding.author?.value) || null,
      authorLabel: binding.authorLabel?.value || null,
      placeId,
      placeLabel: binding.placeLabel?.value || placeId,
      lon: Number(coordinate[1]), lat: Number(coordinate[2]),
    });
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache));
});

const propertyRelation = new Map([...directProperties, ...authorProperties]);
const propertyPriority = new Map(["P1071", "P291", "P19", "P551", "P937"].map((property, index) => [property, index]));
const coarsePlaces = new Set(["中国", "中國", "中华人民共和国", "中華人民共和國"]);
const personLabelCorrections = new Map([["玉实甫", "王实甫"]]);
const matchesByBook = new Map();
for (const book of unresolved) {
  const target = norm(book.title);
  const hits = (cache.searches[book.title] ?? [])
    .filter((hit) => [hit.label, ...(hit.aliases ?? [])].some((label) => norm(label) === target));
  const hit = hits[0];
  if (!hit) continue;
  const anchor = [...(cache.anchors[hit.id] ?? [])]
    .sort((a, b) => (propertyPriority.get(a.property) ?? 99) - (propertyPriority.get(b.property) ?? 99))[0];
  if (!anchor || coarsePlaces.has(anchor.placeLabel)) continue;
  const namedAuthor = book.author && book.author !== "著者未详" ? norm(book.author) : "";
  if (namedAuthor && anchor.authorLabel && !namedAuthor.includes(norm(anchor.authorLabel))) continue;
  // Author-derived anchors for this Chinese/East-Asian catalog must remain in
  // the region; this prevents homonymous Western works from being imported.
  if (anchor.authorId && !(anchor.lon >= 70 && anchor.lon <= 145 && anchor.lat >= 10 && anchor.lat <= 60)) continue;
  matchesByBook.set(book.id, { hit, anchor });
}

const placeById = new Map(data.places.map((place) => [place.id, place]));
const remaining = [];
let mapped = 0;
for (const book of unresolved) {
  const match = matchesByBook.get(book.id);
  if (!match) {
    remaining.push(book);
    continue;
  }
  const { hit, anchor } = match;
  const relation = propertyRelation.get(anchor.property) || "规范实体关联地";
  const placeLabel = fold(anchor.placeLabel);
  const personLabel = personLabelCorrections.get(fold(anchor.authorLabel)) || fold(anchor.authorLabel);
  const atlasPlaceId = `wikidata-place-${anchor.placeId}`;
  let atlasPlace = placeById.get(atlasPlaceId);
  if (!atlasPlace) {
    atlasPlace = {
      id: atlasPlaceId,
      name: placeLabel,
      nameEn: placeLabel,
      lon: anchor.lon,
      lat: anchor.lat,
      people: [], books: [], source: "Wikidata规范实体",
      sourceId: anchor.placeId,
      sourceUrl: `https://www.wikidata.org/wiki/${anchor.placeId}`,
    };
    data.places.push(atlasPlace);
    placeById.set(atlasPlaceId, atlasPlace);
  }
  atlasPlace.books.push({
    ...book,
    relation,
    locationWorkId: hit.id,
    locationPersonId: anchor.authorId,
    locationPerson: personLabel || undefined,
    locationPersonEn: personLabel || undefined,
    locationPlaceId: anchor.placeId,
    locationRole: relation,
    locationAddressType: `Wikidata ${anchor.property}`,
    locationEvidence: `Wikidata ${hit.id}《${book.title}》—${relation}${placeLabel}`,
    locationSourceUrl: `https://www.wikidata.org/wiki/${hit.id}`,
    locationScore: anchor.authorId ? 82 : 94,
    locationReviewStatus: "规范实体精确题名匹配",
  });
  mapped += 1;
}

data.unresolved.books = remaining;
data.summary.mappedChineseBooks += mapped;
data.summary.unresolvedChineseBooks = remaining.length;
data.summary.historicalPlaces = data.places.length;
fs.writeFileSync(atlasPath, JSON.stringify(data));
console.log(JSON.stringify({ searched, exactEntities: exactIds.length, matchedWorks: matchesByBook.size, mapped, mappedChineseBooks: data.summary.mappedChineseBooks, unresolvedChineseBooks: remaining.length }, null, 2));
