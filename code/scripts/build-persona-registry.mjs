import fs from "node:fs/promises";

const cbdb = JSON.parse(await fs.readFile("scripts/cache/cbdb-authors.json", "utf8"));
const catalog = JSON.parse(await fs.readFile("public/siku/catalog.json", "utf8"));
const personaFiles = ["app/world/characters.ts", "app/world/historical-personas.ts", "app/world/xiyou-personas.ts", "app/world/west-personas.ts"];
const existing = new Set();
for (const file of personaFiles) {
  const text = await fs.readFile(file, "utf8");
  for (const m of text.matchAll(/\bname:\s*"([^"]+)"/g)) existing.add(m[1]);
}

const norm = (s) => String(s ?? "").replace(/[：:].*$/, "").replace(/[（(].*?[）)]/g, "").replace(/\s+/g, "").trim();
const badName = /未詳|不详|佚名|失名|无名|某氏|孔子弟子|編者|编者/;
const genericWork = /^(文集|诗集|奏议|语录|别集|全集|集|稿|录)$/;
const catalogByTitle = new Map(catalog.map((b) => [norm(b.title), b]));
const people = new Map();
for (const row of cbdb) {
  const name = String(row.person ?? "").trim();
  if (!name || existing.has(name) || badName.test(name) || name.length < 2 || name.length > 8 || !(row.pid > 0)) continue;
  const p = people.get(row.pid) ?? { pid: row.pid, name, birth: null, death: null, indexYear: null, works: [] };
  if (row.birth > 0) p.birth = row.birth;
  if (row.death > 0) p.death = row.death;
  if (row.idx > 0) p.indexYear = row.idx;
  const title = String(row.title ?? "").replace(/:[^:]*$/, "").trim();
  if (title && !p.works.includes(title) && !genericWork.test(norm(title))) p.works.push(title);
  people.set(row.pid, p);
}

const yearOf = (p) => p.birth || p.indexYear || p.death || 0;
const dynastyOf = (year) => year <= 0 ? "年代未详" : year < 220 ? "汉及以前" : year < 420 ? "魏晋" : year < 589 ? "南北朝" : year < 907 ? "隋唐" : year < 960 ? "五代" : year < 1279 ? "宋" : year < 1368 ? "元" : year < 1644 ? "明" : year < 1912 ? "清" : "近现代";
const priorityNames = [
  "司馬遷","班固","范曄","陳壽","屈原","賈誼","司馬相如","王羲之","謝靈運","陶弘景",
  "王勃","陳子昂","孟浩然","王維","岑參","韓愈","柳宗元","劉禹錫","白居易","杜牧",
  "李商隱","李煜","范仲淹","歐陽修","王安石","司馬光","周敦頤","程顥","程頤","沈括",
  "黃庭堅","李清照","陸游","辛棄疾","朱熹","文天祥","關漢卿","馬致遠","施耐庵","羅貫中",
  "吳承恩","湯顯祖","李時珍","李贄","徐霞客","顧炎武","黃宗羲","方以智","王夫之","納蘭性德",
  "戴震","紀昀","袁枚","龔自珍","魏源","曾國藩","康有為","梁啟超","王國維","章太炎",
  "蔡元培","魯迅","胡適","陳寅恪","錢穆"
];
const priority = new Map(priorityNames.map((name, i) => [name, i]));
const pool = [...people.values()]
  .filter((p) => p.works.length > 0 && yearOf(p) > 0)
  .sort((a, b) => (b.works.length - a.works.length) || (yearOf(a) - yearOf(b)) || (a.pid - b.pid));
const prioritized = pool.filter((p) => priority.has(p.name)).sort((a,b) => priority.get(a.name) - priority.get(b.name));
const candidates = [...prioritized, ...pool.filter((p) => !priority.has(p.name))].slice(0, 1415);

// 全量人物目录按需读取；年代无考者仍可检索，不据此虚构其时代或所在地。
const directoryPeople = new Map();
for (const row of cbdb) {
  if (!(row.pid > 0)) continue;
  const p = directoryPeople.get(row.pid) ?? { pid: row.pid, name: String(row.person ?? "").trim(), birth: null, death: null, indexYear: null, works: [] };
  if (row.birth > 0) p.birth = row.birth;
  if (row.death > 0) p.death = row.death;
  if (row.idx > 0) p.indexYear = row.idx;
  const title = String(row.title ?? "").replace(/:[^:]*$/, "").trim();
  if (title && title !== "0" && !p.works.includes(title)) p.works.push(title);
  directoryPeople.set(row.pid, p);
}
const completeDirectory = [...directoryPeople.values()]
  .sort((a, b) => (yearOf(a) ? 0 : 1) - (yearOf(b) ? 0 : 1) || yearOf(a) - yearOf(b) || a.pid - b.pid)
  .map((p) => ({ id: `cbdb-${p.pid}`, name: p.name, year: yearOf(p) || null, dynasty: dynastyOf(yearOf(p)), works: p.works.slice(0, 5) }));
await fs.writeFile("public/data/persona-directory.json", JSON.stringify(completeDirectory));

if (candidates.length !== 1415) throw new Error(`need 1415 candidates, got ${candidates.length}`);

const esc = (s) => JSON.stringify(String(s));
const lines = candidates.map((p, i) => {
  const tier = i < 65 ? "core" : i < 565 ? "work" : "context";
  const year = yearOf(p);
  const dynasty = dynastyOf(year);
  const works = p.works.slice(0, 4);
  const glyph = [...p.name][0];
  const life = [p.birth, p.death].filter(Boolean).join("—");
  const workText = works.length ? `著述见《${works[0]}》等。` : "";
  const evidenceRule = tier === "context" ? "仅按时代、人物资料与当前事件语境发言，不虚构本人引文。" : "依据人物资料与著述目录发言；没有原文证据时不作直接引语。";
  return `  { id: "cbdb-${p.pid}", name: ${esc(p.name)}, courtesy: "", school: ${esc(`${dynasty}文化人物`)}, color: "${["#75584b","#5e6d79","#6f6250","#596e62","#755f76"][i%5]}", glyph: ${esc(glyph)}, quote: ${esc(works[0] ? `代表著述：《${works[0]}》` : "史传有名")}, intro: ${esc(`${dynasty}${life ? `（${life}）` : ""}人物。${workText}${evidenceRule}`)}, home: "文明长卷", idle: "检视生平与著述", voice: { opening: "此事须放回我所处的时代来看。", bridge: "据我的经历与著述目录，", closing: "若无原文可证，便不应强作引语。" }, themes: ${JSON.stringify([...new Set([dynasty, ...works.slice(0,3)])])}, kind: "thinker", worldId: "zhonghua", retrievalWorldId: "zhanguo", profileTier: "${tier}", representativeWorks: ${JSON.stringify(works)}, birthYear: ${p.birth ?? year}, deathYear: ${p.death ?? "undefined"} },`;
});

const output = `import type { Persona } from "./characters";\n\n/** Generated from the local CBDB work-author cache; regenerate with scripts/build-persona-registry.mjs. */\nexport const generatedPersonas: Persona[] = [\n${lines.join("\n")}\n];\n`;
await fs.writeFile("app/world/generated-personas.ts", output);
await fs.writeFile("public/data/persona-registry-summary.json", JSON.stringify({ total: 1500, directory: completeDirectory.length, existingCore: 85, generated: 1415, tiers: { core: 150, work: 500, context: 850 }, generatedAt: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ existing: existing.size, generated: candidates.length, prioritized: prioritized.length, tiers: { core: 150, work: 500, context: 850 } }, null, 2));
