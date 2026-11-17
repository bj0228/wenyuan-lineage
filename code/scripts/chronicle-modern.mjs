#!/usr/bin/env node
/**
 * 近现代纪事抽取：公历一轴。
 *
 * 四库那一轴止于后周显德六年（959），再往下便没有书可抽；而读者所在的今天是公历，
 * 近现代的事也只报公历。故另立一轴，与农历干支那一轴分栏并列，两种历不并作一种。
 *
 * 「可靠」在此不是口说，是两道独立来源对签：
 *   一、中文维基「历史上的今天」逐日条目（人手策选的逐年一句话，出自各日页面）；
 *   二、Wikidata 上该条主角自己的日期声明（P585 事件日／P569 生／P570 卒，日精度）。
 * 两边所报年月日**全同**才收；不同即为冲突，一概弃去并记在审计档里。单边有、另一边
 * 无日期声明的，也弃——宁可少收，不可错收。
 *
 * 每条都留着 QID 与维基链接，读者可自行回查；界面不另存原文，只放事由与一段描写，
 * 描写取自该条主角维基导言首一二句（CC BY-SA，故界面须标出处）。
 *
 * 用法：
 *   node scripts/chronicle-modern.mjs            # 全年 366 日
 *   node scripts/chronicle-modern.mjs --days 6   # 试跑：均匀取六日
 *   node scripts/chronicle-modern.mjs --dry      # 只算不写分片
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "chronicle");
const CACHE = path.join(ROOT, ".cache", "chronicle-modern");
const AUDIT = path.join(ROOT, "scripts", "out");
const UA = "wenyuan-xunmai/1.0 (academic demo; chronicle axis build)";

/** 中土近代自道光二十年鸦片战争起；西方自法国大革命起。改这两个数即改收录起点。 */
const CN_FROM = 1840;
const WEST_FROM = 1789;
/** 每日每栏至多收几条（按跨语言条目数排序取前几名，免得一日堆上几十条） */
const CAP_PER_DAY = 6;
/** 描写截到几字（中文按字，英文按词后截） */
const DESC_MAX = 110;

/** 中土各代政权。満洲国与汪政权之事亦在中土地面上，一并归此栏。 */
const CN = new Set([
  "Q148", // 中华人民共和国
  "Q13426199", // 中华民国（1912–1949）
  "Q8733", // 清朝
  "Q865", // 台湾
  "Q8646", // 香港
  "Q14773", // 澳门
  "Q164092", // 满洲国
  "Q1339766", // 汪精卫政权
  "Q11866", // 中华民国大陆时期（异名）
]);
/** 西方诸国：欧洲（由 P30 查定）另加英裔四国与几个已亡的西方政权 */
const WEST_SEED = new Set([
  "Q30", // 美国
  "Q16", // 加拿大
  "Q408", // 澳大利亚
  "Q664", // 新西兰
  "Q43287", // 德意志帝国
  "Q7318", // 纳粹德国
  "Q15180", // 苏联
  "Q34266", // 俄罗斯帝国
  "Q28513", // 奥匈帝国
  "Q38872", // 普鲁士
  "Q70802", // 法兰西第三共和国
  "Q58715", // 法兰西第一帝国
  "Q71084", // 法兰西第二帝国
  "Q153943", // 魏玛共和国
  "Q174193", // 大英帝国
  "Q161885", // 奥地利帝国
]);

const args = process.argv.slice(2);
const argN = (k, d) => {
  const i = args.indexOf(k);
  return i < 0 ? d : Number(args[i + 1]);
};
const DAYS = argN("--days", 0);
/** 只跑指定几日，如 --on 07-07,05-04。核验与试跑用。 */
const ON = (() => {
  const i = args.indexOf("--on");
  return i < 0 ? null : args[i + 1].split(",").map((x) => x.split("-").map(Number));
})();
const DRY = args.includes("--dry");

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(AUDIT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 带重试与磁盘缓存的取文。维基两处接口都认 UA，取不到便歇一歇再来。 */
async function getJSON(url, cacheKey) {
  const f = cacheKey ? path.join(CACHE, cacheKey) : null;
  if (f && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (r.status === 429 || r.status >= 500) throw new Error(`http ${r.status}`);
      if (!r.ok) throw new Error(`http ${r.status}`);
      const j = await r.json();
      if (f) fs.writeFileSync(f, JSON.stringify(j));
      return j;
    } catch (e) {
      last = e;
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error(`取不到 ${url}：${last?.message}`);
}

const h16 = (xs) => crypto.createHash("sha1").update(xs.join(",")).digest("hex").slice(0, 16);

/** 查不通的实体（拆到二十五个仍不通者）。记下来，末了的审计档里有数。 */
const skipped = [];

/**
 * 分批查 Wikidata：一批查不通便对半拆了再查。
 *
 * 四百个实体一问，赶上服务端忙时便是 504；重试四次仍不通，整轮就此断在半路
 * （实测断在第五十余批）。拆成两百、一百……总有一档查得通，比整轮作废合算；
 * 拆到二十五个仍不通，才记下这二十五个略过——这些实体便查不着日期声明，
 * 其条目随后会落进「两源对不上」一堆，宁可少收。
 *
 * 缓存名仍是 `wd3-<这一批的哈希>-<问号>.json`，故已查好的批次不必重走。
 */
async function queryIds(list, make, tag) {
  try {
    const r = await sparql(make(list), `wd3-${h16(list)}-${tag}.json`);
    return r.results.bindings;
  } catch (e) {
    if (list.length <= 25) {
      skipped.push(...list);
      console.log(`   !! ${tag} 这 ${list.length} 个实体查不通，略过（${String(e.message).slice(0, 48)}）`);
      return [];
    }
    const half = Math.ceil(list.length / 2);
    console.log(`   .. ${tag} ${list.length} 个查不通，拆作两半再试`);
    return [...(await queryIds(list.slice(0, half), make, tag)), ...(await queryIds(list.slice(half), make, tag))];
  }
}

async function sparql(query, cacheKey) {
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  return getJSON(url, cacheKey);
}

const qid = (uri) => (uri ? uri.replace(/^.*\/entity\//, "") : null);
const pad = (n) => String(n).padStart(2, "0");

/** 一年中的每一日（含 2 月 29）。按公历，不涉农历。 */
function allDays() {
  const len = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const out = [];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= len[m - 1]; d++) out.push([m, d]);
  if (ON) return ON;
  if (!DAYS) return out;
  const step = Math.max(1, Math.floor(out.length / DAYS));
  return out.filter((_, i) => i % step === 0).slice(0, DAYS);
}

/**
 * 维基「历史上的今天」某日某类条目。`text` 便是人手写定的一句事由。
 *
 * 中英两种日页都取：一来两边所列互有出入，合起来才齐；二来条目所挂的 `pages`
 * 时常漏掉事件本体（中文 10 月 10 日那条写着武昌起义，`pages` 里却只有「1911年」
 * 与「共进会」），英文那边却挂着 Wuchang Uprising——缺了英文一路，许多大事认不出主角。
 * 三来英文页自带英文导言，英文界面的描写不必另取。
 */
async function feedDay(lang, kind, m, d) {
  const u = `https://${lang}.wikipedia.org/api/rest_v1/feed/onthisday/${kind}/${pad(m)}/${pad(d)}`;
  const j = await getJSON(u, `otd-${lang}-${kind}-${pad(m)}${pad(d)}.json`);
  return j[kind] ?? [];
}

const isYearPage = (title) => /^(前)?\d{1,4}年(代)?$/.test(title ?? "") || /^\d{1,4}(s| BC)?$/.test(title ?? "");

function trimDesc(s) {
  if (!s) return "";
  const one = s.replace(/\s+/g, " ").trim();
  // 取头一两句：中文以。！？断，英文以 . 断
  const m = one.match(/^[\s\S]{10,}?[。！？](?:[\s\S]{10,}?[。！？])?/) ?? one.match(/^[\s\S]{10,}?\.(?:\s|$)/);
  let out = m ? m[0] : one;
  if (out.length > DESC_MAX) out = out.slice(0, DESC_MAX).replace(/[，、,\s][^，、,\s]*$/, "") + "……";
  return out.trim();
}

/** 限并发跑一串活儿。维基两处接口都不喜欢一拥而上。 */
async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      for (;;) {
        const k = i++;
        if (k >= items.length) return;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

// ── 一、逐日取条目，攒出候选 ─────────────────────────────────────────────
const days = allDays();
console.log(`[1/5] 取中英两种日页：${days.length} 日 × 2 语 × 2 类`);
const entries = [];
const qids = new Set();
let feedN = 0;
await pool(days, 4, async ([m, d]) => {
  const got = [];
  for (const lang of ["zh", "en"]) {
    for (const kind of ["events", "selected"]) {
      let evs;
      try {
        evs = await feedDay(lang, kind, m, d);
      } catch {
        evs = []; // 某日某类取不到便略过，不中断全盘；末了的统计会显出短少
      }
      for (const e of evs) {
        const y = Number(e.year);
        if (!Number.isFinite(y)) continue;
        const pages = (e.pages ?? [])
          .filter((p) => p.wikibase_item && !isYearPage(p.normalizedtitle))
          // 一条日页事由后头挂着的头两篇才是主角，再往后多是顺带提到的地名、人名。
          // 五篇全查要向 Wikidata 问四万个实体，一轮一个多钟头还动辄把端点问崩；
          // 取两篇，实体少掉近半，收下的条数几乎不减——本就只按条目数取每日前几条。
          .slice(0, 2)
          .map((p) => ({
            qid: p.wikibase_item,
            title: p.normalizedtitle ?? p.title,
            extract: p.extract ?? "",
            url: p.content_urls?.desktop?.page ?? null,
          }));
        if (!pages.length) continue;
        got.push({ lang, m, d, y, text: (e.text ?? "").replace(/\s+/g, " ").trim(), pages });
      }
    }
  }
  entries.push(...got);
  for (const e of got) for (const p of e.pages) qids.add(p.qid);
  if (++feedN % 30 === 0) console.log(`   …${feedN}/${days.length} 日，候选 ${entries.length} 条`);
});
console.log(`   条目 ${entries.length}（中文 ${entries.filter((e) => e.lang === "zh").length}），待查实体 ${qids.size}`);

// ── 二、向 Wikidata 查这些实体的日期声明、国别、条目数、英文名 ────────────
console.log("[2/5] 查 Wikidata 日期声明与国别");
const info = new Map(); // qid → {links, zh, en, enTitle, zhTitle, dates:Set, countries:Set}
const ids = [...qids];
const BATCH = 400;
// 条目数与两种标签一问。篇名不并在这一问里：四百个实体再带两个 OPTIONAL 的站链
// 连接，查询规划器便走岔，实测每批必 504。篇名另作一问（见 QW），不用 OPTIONAL。
const Q1 = (list) => `
SELECT ?it ?links ?zh ?en WHERE {
  VALUES ?it { ${list.map((q) => `wd:${q}`).join(" ")} }
  ?it wikibase:sitelinks ?links .
  OPTIONAL { ?it rdfs:label ?zh . FILTER(lang(?zh) = "zh") }
  OPTIONAL { ?it rdfs:label ?en . FILTER(lang(?en) = "en") }
}`;
// 中英两种维基篇名：一个实连接加一道筛，比两个 OPTIONAL 便宜得多
const QW = (list) => `
SELECT ?it ?site ?page WHERE {
  VALUES ?it { ${list.map((q) => `wd:${q}`).join(" ")} }
  ?page schema:about ?it ; schema:isPartOf ?site .
  FILTER(?site IN (<https://zh.wikipedia.org/>, <https://en.wikipedia.org/>))
}`;
// 日期声明五式并收：事件多写 P585（发生于），但战役、运动一类常只写 P580（始于）
// 与 P582（终于）——七七事变、霸王行动便是如此；人物则是 P569 生、P570 卒。
// 只认 P585 会把这些真事当作「无日期」弃掉。
const QD = (list) => `
SELECT ?it ?d ?prec WHERE {
  VALUES ?it { ${list.map((q) => `wd:${q}`).join(" ")} }
  { ?it p:P585/psv:P585 ?v } UNION { ?it p:P580/psv:P580 ?v } UNION { ?it p:P582/psv:P582 ?v }
  UNION { ?it p:P569/psv:P569 ?v } UNION { ?it p:P570/psv:P570 ?v }
  ?v wikibase:timeValue ?d ; wikibase:timePrecision ?prec .
}`;
const Q2 = (list) => `
SELECT ?it ?c WHERE {
  VALUES ?it { ${list.map((q) => `wd:${q}`).join(" ")} }
  { ?it wdt:P17 ?c } UNION { ?it wdt:P27 ?c } UNION { ?it wdt:P495 ?c }
  UNION { ?it wdt:P276/wdt:P17 ?c } UNION { ?it wdt:P131/wdt:P17 ?c }
}`;
// 缓存键按这一批的实体算哈希，不按批次序号——序号会骗人：候选实体数一变
// （某日日页前次取失败、这次取着了），分批边界便移位，`wd2-0-400` 名字照旧
// 而内容已是另外四百个实体，取回来的日期声明便对错了实体，一整轮全成了「两源对不上」。
for (let i = 0; i < ids.length; i += BATCH) {
  const chunk = ids.slice(i, i + BATCH);
  const a = await queryIds(chunk, Q1, "a");
  const w = await queryIds(chunk, QW, "w");
  const dd = await queryIds(chunk, QD, "d");
  const b = await queryIds(chunk, Q2, "b");
  for (const r of a) {
    const id = qid(r.it.value);
    let v = info.get(id);
    if (!v)
      info.set(
        id,
        (v = { links: 0, zh: null, en: null, enTitle: null, zhTitle: null, dates: new Set(), countries: new Set() }),
      );
    v.links = Number(r.links?.value ?? 0);
    if (r.zh) v.zh = r.zh.value;
    if (r.en) v.en = r.en.value;
  }
  for (const r of w) {
    const v = info.get(qid(r.it.value));
    if (!v) continue;
    const title = decodeURIComponent(r.page.value.replace(/^.*\/wiki\//, "")).replace(/_/g, " ");
    if (r.site.value.includes("zh.wikipedia")) v.zhTitle = title;
    else v.enTitle = title;
  }
  for (const r of dd) {
    if (Number(r.prec?.value) !== 11) continue; // 只认日精度：精到年月的对不上「某月某日」
    const v = info.get(qid(r.it.value));
    if (v) v.dates.add(r.d.value.slice(0, 10));
  }
  for (const r of b) {
    const id = qid(r.it.value);
    const v = info.get(id);
    const c = qid(r.c.value);
    // P17 可写作「不知」「无值」，查回来是个空结点，不是 Q 号——漏掉它便拼出坏的 SPARQL
    if (v && /^Q\d+$/.test(c)) v.countries.add(c);
  }
  console.log(`   …${Math.min(i + BATCH, ids.length)}/${ids.length}`);
}

// 欧洲诸国由 P30 查定，免得逐个手列
console.log("[3/5] 查国别所属洲");
const countryIds = [...new Set([...info.values()].flatMap((v) => [...v.countries]))];
const west = new Set(WEST_SEED);
for (let i = 0; i < countryIds.length; i += BATCH) {
  const chunk = countryIds.slice(i, i + BATCH);
  const r = await queryIds(
    chunk,
    (list) => `SELECT ?it WHERE { VALUES ?it { ${list.map((q) => `wd:${q}`).join(" ")} } ?it wdt:P30 wd:Q46 . }`,
    "cont",
  );
  for (const b of r) west.add(qid(b.it.value));
}
console.log(`   西方国别 ${west.size} 个`);

// ── 四、对签：日页所列之日与该事自家日期声明全同才收 ────────────────────
/** 弃条分类：unverified = 所列各页无一页自家日期声明与此日相同（故不敢收） */
const drop = { unverified: 0, unclass: 0, early: 0 };
const unverified = [];
/** 以「主角 + 年月日」为一条。中英两页所列同一件事便并作一条，各出其面的事由与描写。 */
const merged = new Map();
for (const e of entries) {
  const want = `${e.y}-${pad(e.m)}-${pad(e.d)}`;
  // 主角：自家日期声明与所列之日全同的那一页。多页都中便取跨语条目数多的。
  const subs = e.pages.filter((p) => info.get(p.qid)?.dates.has(want));
  if (!subs.length) {
    // 两源未对上便不收。多半是该事条目上没写日精度的日期声明（维基日页有、Wikidata 无），
    // 也有少数是两边所记之日确实不同——此处不分辨，一概弃，只在审计档里留样。
    drop.unverified++;
    if (unverified.length < 300)
      unverified.push({
        lang: e.lang,
        feed: want,
        text: e.text.slice(0, 60),
        pages: e.pages.map((p) => ({ qid: p.qid, title: p.title, dates: [...(info.get(p.qid)?.dates ?? [])] })),
      });
    continue;
  }
  subs.sort((x, y) => (info.get(y.qid).links ?? 0) - (info.get(x.qid).links ?? 0));
  // 挨着试：跨语条目最多的那一页未必写了国别（二战中诸国合办之役便常是空的），
  // 一个不中便弃整条，连带把七七事变、诺曼底登陸这样的大事一并弃了。
  let sub = null;
  let side = null;
  let early = false;
  for (const cand of subs) {
    const cs = [...info.get(cand.qid).countries];
    // 两边的国都挂着时按多数定栏：一战的参战国里有中华民国，若见 CN 便归中土，
    // 「近现代 · 中土」一栏头条就成了第一次世界大战——那不是中土一国之事。
    // 反过来，七七事变挂着中华民国与日本（日本不在西方之列），仍归中土。
    const nc = cs.filter((c) => CN.has(c)).length;
    const nw = cs.filter((c) => west.has(c)).length;
    const sd = nc && nc >= nw ? "zh" : nw ? "west" : null;
    if (!sd) continue;
    if (e.y < (sd === "zh" ? CN_FROM : WEST_FROM)) {
      early = true;
      continue;
    }
    sub = cand;
    side = sd;
    break;
  }
  if (!sub) {
    if (early) drop.early++;
    else drop.unclass++;
    continue;
  }
  const v = info.get(sub.qid);
  const key = `${sub.qid}|${want}`;
  let r = merged.get(key);
  if (!r) {
    merged.set(
      key,
      (r = {
        side,
        month: e.m,
        day: e.d,
        year: e.y,
        title: v.zh ?? sub.title,
        titleEn: v.en ?? null,
        event: null,
        eventEn: null,
        desc: "",
        descEn: "",
        qid: sub.qid,
        url: null,
        urlEn: v.enTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(v.enTitle.replace(/ /g, "_"))}` : null,
        links: v.links,
        /** 两语日页都列着这一件：三方相符，比两方又紧一等 */
        both: false,
      }),
    );
  } else if (r.event && e.lang === "en" ? true : r.eventEn && e.lang === "zh") r.both = true;
  if (e.lang === "zh") {
    if (!r.event) r.event = e.text;
    if (!r.desc) r.desc = trimDesc(sub.extract);
    if (!r.url) r.url = sub.url;
  } else {
    if (!r.eventEn) r.eventEn = e.text;
    if (!r.descEn) r.descEn = trimDesc(sub.extract);
  }
  r.both = !!(r.event && r.eventEn);
}
const kept = [...merged.values()];
console.log(`[4/5] 对签：收 ${kept.length} 件（中英两页并列者 ${kept.filter((r) => r.both).length}），弃 ${JSON.stringify(drop)}`);

// 中文面没有事由的（只见于英文日页），以英文事由顶上；反之亦然。描写同理。
for (const r of kept) {
  r.event ??= r.eventEn;
  r.eventEn ??= r.event;
  if (!r.desc) r.desc = r.descEn;
  if (!r.descEn) r.descEn = r.desc;
  r.url ??= r.urlEn ?? `https://www.wikidata.org/wiki/${r.qid}`;
}

/**
 * 补中文描写：只见于英文日页的那些条，`desc` 会落作英文——中文面上便成了夹生话。
 *
 * 其中文维基篇名由 Wikidata 的 zh 站链得知（有中文条目者才有），据此另取一段中文
 * 导言。日页上那一句事由取不到中文（中文日页本就没列这一件），仍出英文；
 * 但题名与描写两样是中文的，中文读者便读得下去。
 */
const CJK = /[\u4e00-\u9fff]/;
const needZh = kept.filter((r) => !CJK.test(r.desc ?? "") && info.get(r.qid)?.zhTitle);
console.log(`[4b] 补中文描写：${needZh.length} 条`);
let zhGot = 0;
await pool(needZh, 4, async (r) => {
  const title = info.get(r.qid).zhTitle;
  try {
    const j = await getJSON(
      `https://zh.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      `zhsum-${r.qid}.json`,
    );
    const d = trimDesc(j.extract ?? "");
    if (d && CJK.test(d)) {
      r.desc = d;
      r.title = j.titles?.normalized ?? title;
      r.url = j.content_urls?.desktop?.page ?? r.url;
      zhGot++;
    }
  } catch {
    // 取不着便仍出英文：少一段中文描写，不至于整条不要
  }
});
console.log(`   得 ${zhGot} 条`);

// 每日每栏取跨语条目数最多的前几条
const byDay = new Map();
for (const r of kept) {
  const k = `${r.side}-${r.month}-${r.day}`;
  if (!byDay.has(k)) byDay.set(k, []);
  byDay.get(k).push(r);
}
const final = [];
for (const [, list] of byDay) {
  list.sort((a, b) => b.links - a.links || b.year - a.year);
  final.push(...list.slice(0, CAP_PER_DAY));
}
final.sort((a, b) => a.month - b.month || a.day - b.day || a.year - b.year);
final.forEach((r, i) => (r.id = `mod-${i}`));

// ── 核对几件众所共知的事，看管线有没有把日期搬错 ──────────────────────────
const CHECKS = [
  ["七七事变", "Q219230", 1937, 7, 7],
  ["五四运动", "Q279790", 1919, 5, 4],
  ["武昌起义", "Q339291", 1911, 10, 10],
  ["西安事变", "Q244941", 1936, 12, 12],
  ["霸王行动", "Q8641370", 1944, 6, 6],
  ["攻占巴士底狱", "Q6539", 1789, 7, 14],
];
const checks = CHECKS.map(([name, q, y, m, d]) => {
  const row = final.find((r) => r.qid === q);
  // 同日同年另有一条顶着也算过：同一件事维基常有大小两篇（武昌起义之上有辛亥革命、
  // 攻占巴士底狱之上有法国大革命），择主角时跨语条目多的那篇胜出，每日又只收前六条，
  // 伞篇便把细篇顶了下去。此检要查的是**日期有没有搬错**，不是哪一篇胜出。
  const alt = row ? null : final.find((r) => r.year === y && r.month === m && r.day === d);
  const got = row ?? alt;
  return {
    name,
    qid: q,
    want: `${y}-${pad(m)}-${pad(d)}`,
    got: got ? `${got.year}-${pad(got.month)}-${pad(got.day)}` : null,
    ok: !!got && got.year === y && got.month === m && got.day === d,
    by: row ? "本条" : alt ? `伞篇顶替：${alt.title}（${alt.qid}）` : null,
    side: got?.side ?? null,
    dayRows: final.filter((r) => r.month === m && r.day === d).length,
  };
});
// 另一道整体核验：收下的每一条，其年月日须确在该主角自己的日期声明之内。
// 这是全盘的可靠性不变式——上头六件只是抽样，这一条查的是全部。
const mismatched = final.filter(
  (r) => !info.get(r.qid)?.dates.has(`${r.year}-${pad(r.month)}-${pad(r.day)}`),
);

const stat = {
  generated: new Date().toISOString().slice(0, 10),
  days: days.length,
  entries: entries.length,
  entities: qids.size,
  kept: kept.length,
  final: final.length,
  zh: final.filter((r) => r.side === "zh").length,
  west: final.filter((r) => r.side === "west").length,
  dropped: drop,
  cnFrom: CN_FROM,
  westFrom: WEST_FROM,
  capPerDay: CAP_PER_DAY,
  withDescEn: final.filter((r) => r.descEn).length,
  withDescZh: final.filter((r) => CJK.test(r.desc)).length,
  skippedEntities: skipped.length,
  bothFeeds: final.filter((r) => r.both).length,
  mismatched: mismatched.length,
  yearSpan: final.length ? [Math.min(...final.map((r) => r.year)), Math.max(...final.map((r) => r.year))] : null,
  checks,
};
console.log(JSON.stringify(stat, null, 1));
fs.writeFileSync(
  path.join(AUDIT, "chronicle-modern-audit.json"),
  JSON.stringify({ ...stat, unverified }, null, 1),
);

// 逐日覆盖：两栏各有几日无事，摆明白，免得界面上看着像坏了
const cover = { zh: {}, west: {} };
for (const r of final) {
  const k = `${pad(r.month)}-${pad(r.day)}`;
  cover[r.side][k] = (cover[r.side][k] ?? 0) + 1;
}
for (const s of ["zh", "west"]) {
  const n = Object.keys(cover[s]).length;
  console.log(`   ${s}：有事之日 ${n}/${days.length}，每日均 ${(final.filter((r) => r.side === s).length / Math.max(1, n)).toFixed(1)} 条`);
}

if (DRY || DAYS) {
  console.log(DRY ? "（--dry：不写分片）" : "（试跑若干日：不写分片）");
  process.exit(0);
}

// ── 写分片：按公历月分十二片，与农历那十二片分名（n 对 m） ────────────────
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ZH_MONTHS = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
for (let m = 1; m <= 12; m++) {
  const recs = final.filter((r) => r.month === m).map((r) => ({ axis: "modern", ...r }));
  fs.writeFileSync(
    path.join(OUT, `n${pad(m)}.json`),
    JSON.stringify({ month: m, label: ZH_MONTHS[m - 1], en: EN_MONTHS[m - 1], records: recs }),
  );
}

// 索引上添公历一轴的数目，并把历法那一句注明白
const idx = JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8"));
idx.modern = {
  generated: stat.generated,
  total: final.length,
  zh: stat.zh,
  west: stat.west,
  cnFrom: CN_FROM,
  westFrom: WEST_FROM,
  source: "zh.wikipedia 历史上的今天 × Wikidata 日期声明（两源对签）",
  licence: "CC BY-SA 4.0（维基文本）／CC0（Wikidata 日期）",
  months: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    zh: final.filter((r) => r.month === i + 1 && r.side === "zh").length,
    west: final.filter((r) => r.month === i + 1 && r.side === "west").length,
  })),
};
idx.notes.calendarModern =
  "近现代两栏为公历（中土自一八四〇年、西方自一七八九年起），与四库农历一轴不并作一种。" +
  "每条皆经两源对签：维基逐日条目所列之年月日，须与 Wikidata 上该事自己的日期声明全同，不同者弃。";
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(idx));
console.log(`写毕：n01..n12.json（${final.length} 条），index.json 已添 modern 一节`);
