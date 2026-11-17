#!/usr/bin/env node
/**
 * 《西游记》对白抽取 —— 把百回本正文里的 `X道：「……」` 抽成可引的 Passage。
 *
 * 为什么能这么抽:已核实百回本对白占正文 46.7%,且格式极规整——说话人紧贴
 * 「道」字之前,引语成对括起。这意味着悟空说的每一句都**有回目可考**,不是代拟。
 * 这一点是西游世界能成立的前提:诸子引典是论证,西游引对白是性格表现,但两者
 * 同样要「句句有本」,否则就只是让模型扮演一只猴子。
 *
 * 源:与四库同一个导出(`SiKuQuanShu.json` 里 title=《西游记》的 102 条)。
 * 产出:`app/world/xiyou-passages.ts`,与 canon.ts 的 Passage 同形,带
 *       `speaker` / `workId` / `worldId: "xiyou"` / `locus`(回目)。
 *
 * 用法(在存有导出的服务器上跑):
 *   node scripts/xiyou-extract.mjs --src <导出目录> --out app/world/xiyou-passages.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const argOf = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const SRC = argOf("src", "/root/gpufree-data/sikuquanshu_export_20250918_162216");
const OUT = argOf("out", "app/world/xiyou-passages.ts");
const BOOK_TITLE = argOf("title", "《西游记》");

/**
 * 人名归一化。西游一人多号是常态——孙悟空在不同场合是「大圣」「行者」「猴王」
 * 「孙大圣」「老孙」，若不归并，每个称呼各成一人,检索就散了。
 *
 * 只收八位主要人物:其余妖魔各出一两回,语料太薄,立不起人格。
 * 次序要紧:长名在前,免得「孙行者」先被「行者」吃掉——下面以最长匹配取胜。
 */
const ALIASES = {
  wukong: ["孙大圣", "孙行者", "孙悟空", "齐天大圣", "美猴王", "大圣", "行者", "猴王", "悟空", "老孙"],
  tangseng: ["唐三藏", "三藏法师", "唐长老", "玄奘", "三藏", "长老", "唐僧", "师父"],
  bajie: ["猪八戒", "猪悟能", "八戒", "呆子", "老猪", "天蓬"],
  shaseng: ["沙和尚", "沙悟净", "沙僧", "悟净"],
  guanyin: ["观音菩萨", "观世音菩萨", "南海菩萨", "观音", "菩萨"],
  rulai: ["如来佛祖", "释迦牟尼", "如来", "佛祖"],
  yudi: ["玉皇大帝", "玉皇大天尊", "玉帝", "玉皇"],
  niumowang: ["牛魔王", "平天大圣", "老牛", "牛王"],
};

/** 别名 → personaId,按别名长度降序,保证最长匹配先命中。 */
const ALIAS_TABLE = Object.entries(ALIASES)
  .flatMap(([id, names]) => names.map((n) => ({ id, name: n })))
  .sort((a, b) => b.name.length - a.name.length);

/**
 * 说话人识别:在「道」字之前的一小段里找别名。
 * 这一小段常带修饰(「大圣笑道」「行者闻言大怒道」),故不能等值比对,只能包含匹配;
 * 又因为「八戒道」与「那怪对八戒道」语义不同——后者是对八戒说、说话人另有其人——
 * 故带「对/向/与/问」等指向词的,只取指向词之前的部分认人。
 */
const REDIRECT = /[对向与同问教叫]/;
function speakerOf(prefix) {
  let seg = prefix;
  // 「X 对 Y 道」:说话人在指向词之前
  const m = seg.split(REDIRECT);
  if (m.length > 1 && m[0].trim()) seg = m[0];
  for (const { id, name } of ALIAS_TABLE) if (seg.includes(name)) return id;
  return null;
}

/**
 * 对白正则:捕 ①「道」前最多 14 字作说话人线索 ②引号内 4–160 字的话。
 * 引号三种写法都收(弯引号／直角引号／直引号),库中三种并存。
 */
const DIALOGUE = /([^。！？；\n「」“”"]{0,14})道[：:]\s*[「“"]([^「」“”"]{4,160})[」”"]/g;

/** 回目名里的序号,用作 locus。 */
function locusOf(chapter, i) {
  const s = String(chapter || "").trim();
  return s || `第${i + 1}回`;
}

/**
 * 关键词:取句中出现的「母题词」与高频实词。
 * 不做分词器——库里没有,也不值得为八个人引一个。用一张与 personas 的 `themes`
 * 对齐的词表扫一遍,命中即收;长词命中后要剔掉被它包含的短词,否则
 * 「师父」会连带收进一个「父」,检索时两头都算命中,权重就虚高了。
 *
 * 词表须覆盖母题层要对照的那些点——尤其「皇帝」「天宫」「轮流」这类:
 * 悟空「皇帝轮流做」正是「天命与僭越」母题的锚点,若词表漏了,这条最该被
 * 检出的句子反而一个关键词都没有。
 */
const MOTIF_WORDS = [
  // 天命与僭越
  "天命", "天条", "天宫", "皇帝", "玉帝", "轮流", "名号", "名分", "封", "官", "权", "位", "反", "闹", "江山", "让",
  // 真假与变化
  "真", "假", "变", "化", "幻", "心", "意", "眼", "识",
  // 神魔
  "魔", "妖", "怪", "佛", "仙", "神", "菩萨", "法力",
  // 师徒与亲缘
  "师父", "师兄", "徒弟", "兄弟", "结义", "义", "情", "恩", "仇", "父", "子",
  // 戒律与果报
  "经", "法", "戒", "禅", "善", "恶", "罪", "罚", "劫", "难", "命", "因果", "慈悲",
  // 欲与退
  "吃", "食", "色", "欲", "贪", "懒", "退", "散火", "行李",
  // 路
  "走", "归", "路", "西天", "取经", "家乡",
  // 降伏
  "降", "伏", "打", "杀", "救", "度", "保", "护", "自在", "紧箍", "棒",
];
function keywordsOf(text) {
  const hits = MOTIF_WORDS.filter((w) => text.includes(w));
  // 长词在前;剔掉被已收长词包含的短词（「师父」既收，便不再收「父」）
  const sorted = hits.sort((a, b) => b.length - a.length);
  const kept = [];
  for (const w of sorted) {
    if (kept.some((k) => k.includes(w))) continue;
    kept.push(w);
    if (kept.length >= 8) break;
  }
  return kept;
}

/** 转义成 TS 字符串字面量。 */
const q = (s) => JSON.stringify(String(s ?? ""));

function main() {
  const corpusPath = join(SRC, "SiKuQuanShu.json");
  if (!existsSync(corpusPath)) {
    console.error(`源文件不在:${corpusPath}`);
    process.exit(1);
  }

  console.log("读正文(689MB,约需半分钟)……");
  const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
  const chapters = corpus.filter((d) => d.title === BOOK_TITLE);
  if (chapters.length === 0) {
    console.error(`库中无 ${BOOK_TITLE}`);
    process.exit(1);
  }
  console.log(`  ${BOOK_TITLE} ${chapters.length} 回`);

  const byPersona = new Map();
  let scanned = 0;
  chapters.forEach((doc, ci) => {
    const locus = locusOf(doc.chapter, ci);
    const content = String(doc.content || "");
    DIALOGUE.lastIndex = 0;
    let m;
    while ((m = DIALOGUE.exec(content)) !== null) {
      scanned += 1;
      const who = speakerOf(m[1]);
      if (!who) continue;
      const text = m[2].trim();
      // 太短的应答（「是」「晓得」）与纯呼名无引用价值
      if (text.length < 6) continue;
      if (!byPersona.has(who)) byPersona.set(who, []);
      byPersona.get(who).push({ text, locus, ci });
    }
  });

  /**
   * 择句:一人取至多 40 条。标准是「可引」——
   *  ① 去重(同一句在不同回重复出现的,留首见)
   *  ② 长度 12–120 字之间者优先(太短无内容,太长是独白)
   *  ③ 命中母题词多者优先——这正是跨世界评议时要拿来对照的那些句子
   */
  const PER_PERSONA = 40;
  const out = [];
  for (const [who, list] of byPersona) {
    const seen = new Set();
    const uniq = list.filter((x) => {
      const k = x.text.slice(0, 24);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const ranked = uniq
      .map((x) => {
        const kw = keywordsOf(x.text);
        const lenScore = x.text.length >= 12 && x.text.length <= 120 ? 2 : 0;
        return { ...x, kw, score: kw.length * 2 + lenScore };
      })
      .sort((a, b) => b.score - a.score || a.ci - b.ci)
      .slice(0, PER_PERSONA)
      .sort((a, b) => a.ci - b.ci); // 回目次序排版，读起来是一条线
    ranked.forEach((x, i) => {
      out.push({
        id: `xy-${who}-${i + 1}`,
        book: "西游记",
        chapter: x.locus,
        owner: who,
        speaker: who,
        workId: "bk-xiyouji",
        worldId: "xiyou",
        locus: x.locus,
        text: x.text,
        gloss: "",
        keywords: x.kw,
      });
    });
    console.log(`  ${who} 得 ${ranked.length} 条(共扫出 ${list.length})`);
  }

  const header = `import type { Passage } from "./canon";

/**
 * 西游人物可引之言 —— 由 \`scripts/xiyou-extract.mjs\` 自百回本正文抽出，非代拟。
 *
 * 每条都带回目（\`locus\`），因为这正是西游语料的立身之处：悟空说「皇帝轮流做」
 * 是第七回闹天宫时说的，脱了那个处境就只是一句狂言。诸子引典只需书与篇，
 * 叙事人物引言必须连处境一起引。
 *
 * \`gloss\` 留空——原著是白话，不烦再译；留这个字段只为与 \`Passage\` 同形。
 *
 * 此文件为生成物，勿手改；要改抽取规则（别名表、择句标准）改脚本后重跑。
 */
export const xiyouPassages: Passage[] = [
`;
  const body = out
    .map(
      (p) =>
        `  { id: ${q(p.id)}, book: ${q(p.book)}, chapter: ${q(p.chapter)}, owner: ${q(p.owner)}, speaker: ${q(p.speaker)}, workId: ${q(p.workId)}, worldId: ${q(p.worldId)}, locus: ${q(p.locus)}, text: ${q(p.text)}, gloss: "", keywords: ${JSON.stringify(p.keywords)} },`,
    )
    .join("\n");
  writeFileSync(OUT, `${header}${body}\n];\n`);

  console.log(`\n扫出对白 ${scanned} 处,认得说话人者入选 ${out.length} 条 → ${OUT}`);
}

main();
