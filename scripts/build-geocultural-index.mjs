/**
 * Build the full person–book geography index used by GeoculturalMapLayer.
 *
 * People use CBDB's index address and CHGIS coordinates. Chinese books are
 * placed when a same-title CBDB text record can be connected to a responsible
 * person and an evidence-bearing address. Index addresses are preferred; when
 * they are absent, CBDB's ranked biographical addresses provide the fallback.
 * Every placed book retains the text id, person id, role and address type used
 * for the decision. Western books are grouped by the origin in westernCanon.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pinyin } from "pinyin-pro";

const ROOT = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, ROOT), "utf8");
const readJson = (path) => JSON.parse(read(path));
const romanize = (value) => pinyin(String(value || ""), { toneType: "none", type: "array", nonZh: "consecutive" })
  .join(" ").replace(/\s*([:：,，;；()（）/／])\s*/g, "$1 ").replace(/\s+/g, " ").trim()
  .replace(/(^|[\s(/])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`);

const dbPath = process.argv[2] || new URL("scripts/cache/cbdb-full/cbdb_20261107.sqlite3", ROOT).pathname;
if (!fs.existsSync(dbPath)) throw new Error(`CBDB SQLite not found: ${dbPath}`);

const queryJson = (sql, maxBuffer = 192 * 1024 * 1024) => JSON.parse(
  execFileSync("sqlite3", [dbPath], {
    input: `.mode json\n${sql}`,
    maxBuffer,
  }).toString() || "[]",
);

const rankedAddressCte = `
with ranked_addr as (
  select d.c_personid as pid,d.c_addr_id as addrId,d.c_addr_type as addrType,
    row_number() over (
      partition by d.c_personid
      order by case d.c_addr_type
        when 1 then 1 when 16 then 2 when 6 then 3 when 4 then 4
        when 2 then 5 when 13 then 6 when 14 then 7 when 8 then 8
        when 5 then 9 else 50 end,
        d.c_addr_id
    ) as rn
  from BIOG_ADDR_DATA d
  join ADDR_CODES a on a.c_addr_id=d.c_addr_id
  where a.x_coord is not null and a.y_coord is not null
), person_addr as (
  select b.c_personid as pid,b.c_name_chn as name,b.c_index_year as year,
    b.c_birthyear as birth,b.c_deathyear as death,
    coalesce(ia.c_addr_id,fa.c_addr_id) as addrId,
    coalesce(ia.c_name_chn,fa.c_name_chn) as place,
    coalesce(ia.x_coord,fa.x_coord) as lon,
    coalesce(ia.y_coord,fa.y_coord) as lat,
    case when ia.c_addr_id is not null then 1 else ra.addrType end as addrType,
    case when ia.c_addr_id is not null then 'CBDB索引地址'
      when ra.addrType=16 then 'CBDB户籍地'
      when ra.addrType=6 then 'CBDB实际居住地'
      when ra.addrType=4 then 'CBDB最后所知地'
      when ra.addrType=2 then 'CBDB迁住地'
      when ra.addrType=13 then 'CBDB八旗地址'
      when ra.addrType=14 then 'CBDB另一籍贯'
      when ra.addrType=8 then 'CBDB出生地'
      when ra.addrType=5 then 'CBDB祖籍'
      else 'CBDB人物地址' end as addrSource
  from BIOG_MAIN b
  left join ADDR_CODES ia on ia.c_addr_id=nullif(b.c_index_addr_id,0)
    and ia.x_coord is not null and ia.y_coord is not null
  left join ranked_addr ra on ra.pid=b.c_personid and ra.rn=1
  left join ADDR_CODES fa on fa.c_addr_id=ra.addrId
)`;

const generatedText = read("app/world/generated-personas.ts");
const generated = [...generatedText.matchAll(/\{ id: "cbdb-(\d+)", name: "([^"]+)"[\s\S]*?school: "([^"]+)"[\s\S]*?representativeWorks: (\[[^\]]*\])[\s\S]*?birthYear: ([^,}]+)/g)]
  .map((m) => ({
    pid: Number(m[1]),
    id: `cbdb-${m[1]}`,
    name: m[2],
    school: m[3],
    works: JSON.parse(m[4]),
    year: Number.parseInt(m[5], 10) || null,
  }));

const authorRows = readJson("scripts/cache/cbdb-authors.json");
const catalog = readJson("public/siku/catalog.json");
const relevantPids = [...new Set([...generated.map((p) => p.pid), ...authorRows.filter((r) => r.pid > 0).map((r) => r.pid)])];

const addressRows = queryJson(`${rankedAddressCte}
select * from person_addr where pid in (${relevantPids.join(",")});`);
const addressByPid = new Map(addressRows.map((r) => [r.pid, r]));

const variants = read("app/world/hanVariants.ts");
const trad = [...variants.match(/export const TRAD = "([^"]+)"/)?.[1] ?? ""];
const simp = [...variants.match(/export const SIMP = "([^"]+)"/)?.[1] ?? ""];
const foldMap = new Map(trad.map((c, i) => [c, simp[i]]));
const unfoldMap = new Map(simp.map((c, i) => [c, trad[i]]));
const fold = (value) => [...String(value ?? "")].map((c) => foldMap.get(c) ?? c).join("").toLowerCase();
const unfold = (value) => [...String(value ?? "")].map((c) => unfoldMap.get(c) ?? c).join("");
const normTitle = (value) => fold(value)
  .replace(/:[^:]*$/, "")
  .replace(/[《》〈〉\s·•，,：:；;。.!！?？“”\"'‘’（）()【】\[\]{}]/g, "")
  .replace(/[一二三四五六七八九十百千〇零0-9]+卷.*$/, "")
  .trim();

const splitTitles = (value) => String(value ?? "")
  .split(/[;；|]/)
  .map((title) => title.trim())
  .filter(Boolean);

const ROLE_LABEL = new Map([
  [1, "撰著者"], [2, "编辑者"], [3, "编纂者"], [4, "出版者"],
  [5, "捐助者"], [7, "翻译者"], [8, "注疏者"], [9, "注释者"],
  [10, "校对者"], [11, "所收作品作者"], [12, "编辑助理"], [0, "相关人物"],
]);
const ROLE_SCORE = new Map([
  [1, 120], [3, 100], [2, 92], [7, 86], [8, 82], [9, 78],
  [10, 60], [11, 52], [4, 45], [12, 35], [5, 25], [0, 20],
]);

const textPeople = queryJson(`${rankedAddressCte}
select t.c_textid as textId,t.c_title_chn as title,t.c_title_alt_chn as altTitle,
  t.c_text_year as textYear,d.c_personid as pid,d.c_role_id as role,
  p.name as person,p.year,p.birth,p.death,p.addrId,p.place,p.lon,p.lat,
  p.addrType,p.addrSource
from TEXT_CODES t
join BIOG_TEXT_DATA d on d.c_textid=t.c_textid
join person_addr p on p.pid=d.c_personid
where p.lon is not null and p.lat is not null;`);

const textPeopleByTitle = new Map();
for (const row of textPeople) {
  for (const rawTitle of [row.title, ...splitTitles(row.altTitle)]) {
    const key = normTitle(rawTitle);
    if (!key) continue;
    const list = textPeopleByTitle.get(key) ?? [];
    list.push({ ...row, matchedTitle: rawTitle, primaryTitle: rawTitle === row.title });
    textPeopleByTitle.set(key, list);
  }
}
const catalogTitleKeys = new Set(catalog.map((book) => normTitle(book.title)).filter((key) => key.length >= 2));
const compositeTextMatches = (book) => {
  const target = normTitle(book.title);
  if (target.length < 4) return [];
  const out = [];
  for (const [candidateTitle, rows] of textPeopleByTitle) {
    if (candidateTitle === target) continue;
    const parts = [];
    if (candidateTitle.includes(target)) {
      const remainder = candidateTitle.replace(target, "");
      if (catalogTitleKeys.has(remainder)) parts.push(remainder);
    }
    // CBDB also records combined editions such as 《論語孟子集注》: the
    // second title is inserted between the target's stem and shared suffix.
    for (let split = 2; split <= target.length - 2; split += 1) {
      const prefix = target.slice(0, split);
      const suffix = target.slice(split);
      if (!candidateTitle.startsWith(prefix) || !candidateTitle.endsWith(suffix)) continue;
      const remainder = candidateTitle.slice(prefix.length, candidateTitle.length - suffix.length);
      if (catalogTitleKeys.has(remainder)) parts.push(remainder);
    }
    for (const remainder of new Set(parts)) {
      for (const row of rows) out.push({ ...row, compositeTitle: candidateTitle, compositePart: remainder });
    }
  }
  return out;
};

const RESPONSIBLE_ROLES = new Set([1, 2, 3, 7, 8, 9, 10]);
const titleVariantSuffix = /^(?:[\p{Script=Han}]{0,4})?(?:注|疏|正义|集注|章句|解经|校注|全译|译注|辑证|集解|笺证|疏证|注释|考证|评注|补注|新注|今注|补|续|续集|别本|新本)$/u;
const variantTextMatches = (book) => {
  const target = normTitle(book.title);
  if (target.length < 4) return [];
  const out = [];
  for (const [candidateTitle, rows] of textPeopleByTitle) {
    if (candidateTitle === target) continue;
    let suffix = "";
    if (target.startsWith(candidateTitle)) suffix = target.slice(candidateTitle.length);
    else if (candidateTitle.startsWith(target)) suffix = candidateTitle.slice(target.length);
    else continue;
    if (!suffix || suffix.length > 6 || !titleVariantSuffix.test(suffix)) continue;
    for (const row of rows) {
      if (!RESPONSIBLE_ROLES.has(row.role)) continue;
      if (!chronologyCompatible(book, row)) continue;
      out.push({ ...row, variantTitle: candidateTitle, variantSuffix: suffix });
    }
  }
  return out;
};

const textPublications = queryJson(`
select t.c_textid as textId,t.c_title_chn as title,t.c_title_alt_chn as altTitle,
  i.c_pub_year as pubYear,i.c_pub_loc as pubPlace,
  a.c_addr_id as addrId,a.c_name_chn as place,a.x_coord as lon,a.y_coord as lat
from TEXT_CODES t
join TEXT_INSTANCE_DATA i on i.c_textid=t.c_textid
join ADDR_CODES a on a.c_name_chn=i.c_pub_loc
where trim(coalesce(i.c_pub_loc,''))<>''
  and a.x_coord is not null and a.y_coord is not null;`);
const publicationsByTitle = new Map();
for (const row of textPublications) {
  for (const rawTitle of [row.title, ...splitTitles(row.altTitle)]) {
    const key = normTitle(rawTitle);
    if (!key) continue;
    const list = publicationsByTitle.get(key) ?? [];
    list.push({ ...row, matchedTitle: rawTitle, primaryTitle: rawTitle === row.title });
    publicationsByTitle.set(key, list);
  }
}

const eraOfYear = (year) => {
  if (!year) return "年代未详";
  if (year < -221) return "先秦";
  if (year < 220) return "秦汉";
  if (year < 589) return "魏晋南北朝";
  if (year < 907) return "隋唐";
  if (year < 1368) return "宋元";
  if (year < 1912) return "明清";
  return "近现代";
};
const eraOfDynasty = (dynasty) => {
  if (/先秦|商|周|春秋|战国/.test(dynasty)) return "先秦";
  if (/秦|汉/.test(dynasty)) return "秦汉";
  if (/魏|晋|南朝|北朝|南北朝/.test(dynasty)) return "魏晋南北朝";
  if (/隋|唐|五代/.test(dynasty)) return "隋唐";
  if (/宋|辽|金|元/.test(dynasty)) return "宋元";
  if (/明|清/.test(dynasty)) return "明清";
  if (/近|民国|现代|当代/.test(dynasty)) return "近现代";
  return "年代未详";
};

const yearRangeOfBook = (book) => {
  if (Number.isFinite(book.year)) return [book.year, book.year];
  if (Array.isArray(book.year) && book.year.length === 2) return book.year;
  const ranges = {
    先秦: [-2000, -221], 汉: [-206, 220], 魏: [220, 266], 蜀汉: [221, 263],
    晋: [266, 420], 北魏: [386, 535], 北齐: [550, 577], 南朝宋: [420, 479],
    南朝齐: [479, 502], 南朝梁: [502, 557], 隋: [581, 618], 唐: [618, 907],
    五代: [907, 960], 宋: [960, 1279], 金: [1115, 1234], 元: [1271, 1368],
    明: [1368, 1644], 清: [1644, 1912], 近今: [1912, 2026],
  };
  return ranges[book.dynasty] ?? null;
};

const sameEra = (book, row) => {
  const bookEra = eraOfDynasty(book.dynasty);
  const personYear = row.birth || row.year || row.death;
  return personYear && bookEra === eraOfYear(personYear);
};

const chronologyCompatible = (book, row) => {
  const range = yearRangeOfBook(book);
  if (!range) return false;
  if (Number.isFinite(row.textYear) && row.textYear >= range[0] - 50 && row.textYear <= range[1] + 80) return true;
  const birth = row.birth || row.year;
  const death = row.death || row.year;
  if (birth && death && death >= range[0] - 80 && birth <= range[1] + 80) return true;
  return sameEra(book, row);
};

const candidateScore = (book, candidate) => {
  let score = ROLE_SCORE.get(candidate.role) ?? 0;
  if (candidate.primaryTitle) score += 16;
  const range = yearRangeOfBook(book);
  if (range && candidate.textYear >= range[0] - 30 && candidate.textYear <= range[1] + 30) score += 28;
  if (range && candidate.birth && candidate.death && candidate.death >= range[0] - 80 && candidate.birth <= range[1] + 80) score += 18;
  else if (sameEra(book, candidate)) score += 10;
  const namedAuthor = fold(book.author || "").replace(/[（(].*$/, "");
  if (candidate.person && namedAuthor.includes(fold(candidate.person))) score += 80;
  if (candidate.addrType === 1) score += 8;
  return score;
};

const authorNamesOf = (author) => String(author ?? "")
  .replace(/[（(][^）)]*[）)]/g, "")
  .replace(/旧题|集录|法海录|编著|编纂|编|辑|注|译|撰|等/g, "")
  .split(/[、，,；;与及/]/)
  .map((name) => name.trim())
  .filter((name) => /^[\u3400-\u9fff]{2,6}$/.test(name));

const catalogAuthorNames = [...new Set(catalog.flatMap((book) => authorNamesOf(book.author)))];
const sqlQuote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const queriedAuthorNames = [...new Set(catalogAuthorNames.flatMap((name) => [name, unfold(name)]))];
const authorPeople = queriedAuthorNames.length ? queryJson(`${rankedAddressCte}
select p.*,
  (select count(*) from BIOG_MAIN b2 where b2.c_name_chn=p.name) as nameCount
from person_addr p
where p.lon is not null and p.lat is not null
  and p.name in (${queriedAuthorNames.map(sqlQuote).join(",")});`) : [];
const authorPeopleByName = new Map();
for (const person of authorPeople) {
  const key = fold(person.name);
  const list = authorPeopleByName.get(key) ?? [];
  list.push(person);
  authorPeopleByName.set(key, list);
}

const authorMatch = (book) => {
  const range = yearRangeOfBook(book);
  const candidates = authorNamesOf(book.author).flatMap((name) =>
    (authorPeopleByName.get(fold(name)) ?? []).map((person) => ({ name, person })),
  );
  return candidates
    .map(({ name, person }) => {
      const lifeYear = person.birth || person.year || person.death;
      const compatible = Boolean(range && lifeYear && lifeYear >= range[0] - 100 && lifeYear <= range[1] + 100);
      const unique = person.nameCount === 1;
      const score = 90 + (compatible ? 35 : 0) + (unique ? 18 : 0) + (person.addrType === 1 ? 8 : 0);
      return { name, person, compatible, unique, score };
    })
    .filter((candidate) => candidate.compatible || candidate.unique)
    .sort((a, b) => b.score - a.score || a.person.pid - b.person.pid)[0] ?? null;
};

const publicationMatch = (book) => {
  const range = yearRangeOfBook(book);
  return (publicationsByTitle.get(normTitle(book.title)) ?? [])
    .map((row) => ({
      row,
      score: 72 + (row.primaryTitle ? 12 : 0) +
        (range && row.pubYear >= range[0] - 30 && row.pubYear <= range[1] + 120 ? 24 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.row.textId - b.row.textId)[0] ?? null;
};

const places = new Map();
const ensurePlace = (addr) => {
  const id = `cbdb-place-${addr.addrId}`;
  if (!places.has(id)) places.set(id, {
    id,
    name: addr.place || "地点未详",
    nameEn: romanize(addr.place || "地点未详"),
    lon: addr.lon,
    lat: addr.lat,
    people: [],
    books: [],
  });
  return places.get(id);
};

const unresolvedPeople = [];
for (const p of generated) {
  const addr = addressByPid.get(p.pid);
  const personWorks = p.works.slice(0, 4);
  const person = { id: p.id, name: p.name, nameEn: romanize(p.name), era: eraOfYear(p.year), year: p.year, works: personWorks, worksEn: personWorks.map(romanize), source: addr?.addrSource || "CBDB人物地址" };
  if (addr && Number.isFinite(addr.lon) && Number.isFinite(addr.lat)) ensurePlace(addr).people.push(person);
  else unresolvedPeople.push(person);
}

const unresolvedBooks = [];
for (const book of catalog) {
  const exactRows = textPeopleByTitle.get(normTitle(book.title)) ?? [];
  const compositeRows = exactRows.length ? [] : compositeTextMatches(book);
  const variantRows = exactRows.length || compositeRows.length ? [] : variantTextMatches(book);
  const candidateRows = exactRows.length ? exactRows : compositeRows.length ? compositeRows : variantRows;
  const matches = candidateRows
    .map((row) => ({ row, addr: row, score: candidateScore(book, row) }))
    .sort((a, b) => b.score - a.score || (a.row.pid - b.row.pid));
  const directAuthor = matches.length ? null : authorMatch(book);
  const publication = matches.length || directAuthor ? null : publicationMatch(book);
  const best = matches[0];
  const roleLabel = best ? (ROLE_LABEL.get(best.row.role) ?? "相关人物") : null;
  const item = {
    id: book.bookId || book.lineageId || `title:${book.title}`,
    title: book.title,
    titleEn: romanize(book.title),
    author: book.author || "著者未详",
    authorEn: romanize(book.author || "著者未详"),
    era: eraOfDynasty(book.dynasty),
    dynasty: book.dynasty,
    group: book.group,
    relation: best?.row.variantTitle ? "题名变体人物关联地" : best?.row.role === 1 || directAuthor ? "撰著者索引地" : best ? "相关人物索引地" : publication ? "版本刊刻地" : "地点待考",
    readable: Boolean(book.bookId),
    ...(best ? {
      locationTextId: best.row.textId,
      locationPersonId: `cbdb-${best.row.pid}`,
      locationPerson: best.row.person,
      locationPersonEn: romanize(best.row.person),
      locationRole: roleLabel,
      locationAddressType: best.row.addrSource,
      locationEvidence: `CBDB文本《${best.row.title}》—${roleLabel}${best.row.person}—${best.row.addrSource}${best.row.place}`,
      locationScore: best.score,
      ...(best.row.compositeTitle ? { locationMatch: `合卷题名包含《${book.title}》` } : {}),
      ...(best.row.variantTitle ? { locationMatch: `规范化题名《${book.title}》↔《${best.row.title}》` } : {}),
    } : directAuthor ? {
      locationPersonId: `cbdb-${directAuthor.person.pid}`,
      locationPerson: directAuthor.person.name,
      locationPersonEn: romanize(directAuthor.person.name),
      locationRole: "目录著者",
      locationAddressType: directAuthor.person.addrSource,
      locationEvidence: `目录著者${directAuthor.person.name}—${directAuthor.person.addrSource}${directAuthor.person.place}`,
      locationScore: directAuthor.score,
    } : publication ? {
      locationTextId: publication.row.textId,
      locationRole: "版本刊刻地",
      locationAddressType: "CBDB版本出版地",
      locationEvidence: `CBDB文本《${publication.row.title}》—版本出版地${publication.row.place}`,
      locationScore: publication.score,
    } : {}),
  };
  if (best) ensurePlace(best.addr).books.push(item);
  else if (directAuthor) ensurePlace(directAuthor.person).books.push(item);
  else if (publication) ensurePlace(publication.row).books.push(item);
  else unresolvedBooks.push(item);
}

const originCoords = {
  "美索不达米亚": [44.4, 33.3], "古代以色列": [35.2, 31.8], "希腊": [23.7, 38.0],
  "希腊化世界": [29.0, 31.2], "罗马": [12.5, 41.9], "地中海世界": [18.0, 36.0],
  "北非／罗马": [10.2, 36.8], "意大利": [12.6, 42.7], "英格兰": [-1.5, 52.5],
  "法国": [2.2, 46.2], "尼德兰": [4.8, 52.1], "波兰": [19.1, 52.1],
  "英国": [-2.0, 54.0], "西班牙": [-3.7, 40.4], "爱尔兰": [-8.0, 53.2],
  "德国": [10.5, 51.1], "德国／英国": [4.2, 52.5], "美国": [-98.5, 39.5],
  "俄国": [37.6, 55.8], "英国／中国": [67.0, 38.0], "奥地利": [14.5, 47.5],
  "英国／美国": [-39.0, 50.0],
};
const westernText = read("app/world/westernCanon.ts");
const westernBooks = [...westernText.matchAll(/\{ id: "([^"]+)", name: "([^"]+)", author: "([^"]+)", year: (-?\d+), era: "([^"]+)", origin: "([^"]+)", category: "([^"]+)"/g)]
  .map((m) => ({ id: m[1], title: m[2], author: m[3], year: Number(m[4]), era: eraOfYear(Number(m[4])), date: m[5], origin: m[6], category: m[7] }));
const westernOrigins = [...new Set(westernBooks.map((b) => b.origin))].map((origin) => ({
  id: `west-${origin}`,
  name: origin,
  lon: originCoords[origin]?.[0] ?? 0,
  lat: originCoords[origin]?.[1] ?? 0,
  books: westernBooks.filter((b) => b.origin === origin),
}));

const placeRows = [...places.values()].sort((a, b) => (b.people.length + b.books.length) - (a.people.length + a.books.length));
const mappedPeople = placeRows.reduce((n, p) => n + p.people.length, 0);
const mappedBooks = placeRows.reduce((n, p) => n + p.books.length, 0);
const output = {
  generatedAt: new Date().toISOString(),
  summary: {
    activePeople: 1500,
    generatedPeople: generated.length,
    mappedPeople,
    unresolvedPeople: unresolvedPeople.length,
    historicalPlaces: placeRows.length,
    chineseBooks: catalog.length,
    mappedChineseBooks: mappedBooks,
    unresolvedChineseBooks: unresolvedBooks.length,
    westernBooks: westernBooks.length,
    westernOrigins: westernOrigins.length,
    allBooks: catalog.length + westernBooks.length,
  },
  places: placeRows,
  unresolved: { people: unresolvedPeople, books: unresolvedBooks },
  westernOrigins,
};
fs.writeFileSync(new URL("public/data/geocultural-index.json", ROOT), JSON.stringify(output));
console.log(JSON.stringify(output.summary, null, 2));
