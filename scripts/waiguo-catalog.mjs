#!/usr/bin/env node
/**
 * 汇总 worldlit 双语目录：中文卷（books/<id>）+ 英文原书（books/<id>-en）→ catalog.json。
 * 每书一个条目，editions: [{lang:"zh", id}, {lang:"en", id}]。
 * 机翻中译（odyssey-zh/quixote-zh/faust-zh）尚未完成时按现有章数收。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const WL = join(ROOT, "public/worldlit");
const nCh = (id) => {
  const d = join(WL, "books", id);
  // meta.json 是「此卷就绪」的凭据：机翻中断的半成品（如 faust-zh 12/28）没有
  // meta，阅读面进不去，目录也不收——免得书架上挂一个点了 404 的中译卷。
  if (!existsSync(d) || !existsSync(join(d, "meta.json"))) return 0;
  return readdirSync(d).filter((f) => /^\d+\.json$/.test(f)).length;
};

// 阅读面定义：id → 中文卷名/著者/译者/年代/国度/note。
// classical: true 即文言卷（林纾、严复、早年鲁迅），边批卡上多亮一颗「译为白话」——
// 不是所有中译都需要：朱生豪、AI 译本本身就是白话，译了也是白译
const ZH = {
  hamlet: { name: "哈姆莱特", author: "莎士比亚", translator: "朱生豪 译", era: "1601", origin: "英国" },
  zhongxia: { name: "仲夏夜之梦", author: "莎士比亚", translator: "朱生豪 译", era: "1595", origin: "英国" },
  tianyan: { name: "天演论", author: "赫胥黎", translator: "严复 译", era: "1898", origin: "英国", classical: true },
  chahua: { name: "茶花女", author: "小仲马", translator: "林纾、王寿昌 译", era: "1899", origin: "法国", classical: true },
  yuejie: { name: "月界旅行", author: "凡尔纳", translator: "鲁迅 译", era: "1903", origin: "法国", classical: true },
  odyssey: { name: "奥德赛", author: "荷马", translator: "AI 译（据 Butler 英译本，未经校订）", era: "约前8世纪", origin: "希腊" },
  quixote: { name: "堂吉诃德", author: "塞万提斯", translator: "AI 译（据 Ormsby 英译本，未经校订）", era: "1605", origin: "西班牙" },
  faust: { name: "浮士德", author: "歌德", translator: "AI 译（据 Taylor 英译本，未经校订）", era: "1808", origin: "德国" },
};

const BOOKS = [
  { id: "odyssey", zhId: "odyssey-zh", enId: "odyssey" },
  { id: "tianyan", zhId: "tianyan", enId: "tianyan-en" },
  { id: "quixote", zhId: "quixote-zh", enId: "quixote" },
  { id: "hamlet", zhId: "hamlet", enId: "hamlet-en" },
  { id: "faust", zhId: "faust-zh", enId: "faust" },
  { id: "chahua", zhId: "chahua", enId: "camille-en" },
  { id: "yuejie", zhId: "yuejie", enId: "moon-en" },
  { id: "zhongxia", zhId: "zhongxia", enId: "midsummer-en" },
];

// Public-domain English editions imported by worldlit-import-open.mjs.  They have no
// Chinese translation unless separately reviewed, so each contributes one English volume.
const OPEN = JSON.parse(readFileSync(join(ROOT, "scripts/worldlit-open-books.json"), "utf8"));

const catalog = [];
for (const b of BOOKS) {
  const z = ZH[b.id];
  if (!z) continue;
  const editions = [];
  if (nCh(b.zhId)) editions.push({ lang: "zh", id: b.zhId, chapters: nCh(b.zhId), ...(z.classical ? { classical: true } : {}) });
  if (nCh(b.enId)) editions.push({ lang: "en", id: b.enId, chapters: nCh(b.enId) });
  if (!editions.length) continue;
  catalog.push({ id: b.id, name: z.name, author: z.author, translator: z.translator, era: z.era, origin: z.origin, editions });
  console.log(`${b.id}: zh=${nCh(b.zhId)} en=${nCh(b.enId)}`);
}
for (const b of OPEN) {
  if (catalog.some((x) => x.id === b.id)) continue;
  const enId = `${b.id}-en`;
  const chapters = nCh(enId);
  if (!chapters) continue;
  const meta = JSON.parse(readFileSync(join(WL, "books", enId, "meta.json"), "utf8"));
  const historicalZhId = b.id === "wealth-nations" ? "wealth-nations-yanfu-zh-20261108" : null;
  const historicalZh = historicalZhId ? nCh(historicalZhId) : 0;
  catalog.push({
    id: b.id,
    name: meta.name,
    author: meta.author,
    translator: historicalZh ? `严复《原富》历史中译节选 · ${b.translator} 英文原书` : `${b.translator} · English public-domain edition`,
    era: meta.era,
    origin: meta.origin,
    editions: [
      ...(historicalZh ? [{ lang: "zh", id: historicalZhId, chapters: historicalZh, classical: true, partial: true }] : []),
      { lang: "en", id: enId, chapters },
    ],
  });
  console.log(`${b.id}: en=${chapters}`);
}
writeFileSync(join(WL, "catalog.json"), JSON.stringify(catalog, null, 1));
writeFileSync(join(WL, "catalog-20261108-zh-chapter.json"), JSON.stringify(catalog, null, 1));
console.log("catalog:", catalog.length, "书");
