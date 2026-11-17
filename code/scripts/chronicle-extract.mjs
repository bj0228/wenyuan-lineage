/**
 * 纪时记事抽取 —— 从四库正文与世界文学原书里，把「某月某日发生了什么」挑出来，
 * 产出 public/chronicle/ 下的分片，供「历史大事件」层按今日／按月令取用。
 *
 * ## 为何要抽，而不是现写一份大事年表
 *
 * 手写年表是另一本书，与这个项目无关：此处要的是**典籍自己记的日子**。
 * 《资治通鉴》「夏，四月，辛卯，山河十将马少良下嵖岈山」——季、月、日干支、
 * 事主、事由俱全，本就是一条大事记；《左传》「冬十有二月，祭伯来」亦然。
 * 既然书里有，就不该另造一份。故这一层的全部内容都有出处可点回去。
 *
 * ## 两轴各记各的日子，不强行对齐
 *
 * 中土史籍纪的是**阴阳历月 + 干支日**（「十一月，丁卯」）；西书纪的是
 * **公历月 + 日号**（「the 26th of October」）。二者不是一回事：农历十月
 * 并不等于公历十月，大致晚一个月。这件事不能糊过去，故：
 *
 *  - 按**月令**browse 时，中土一侧标明是农历月（正月…十二月），西书一侧标公历月，
 *    界面上分两栏、各挂各的名目，由读者自己看出错位——这本就是一处值得看见的边界。
 *  - 「历史上的今天」里，中土一侧**以干支日相接**：干支六十日一轮、自古连绵未断，
 *    今日之干支可由儒略日精确推得（见 world/chronicle.ts），故「今日壬申」与史上
 *    某个壬申日是同一个干支日，这是真接得上的一条线，不是比附。西书一侧则直接
 *    按公历月日对。两条线各自成立，拼在一屏上看。
 *
 * ## 年份从哪来
 *
 * 通鉴每年起头有「泰始三年丁未，公元四六七年」一行（全书 1387 处），公元年白给；
 * 春秋三传以「◇隐公元年」分年，无公元年，便据实只记鲁公纪年。其余列传体史书
 * （汉书、后汉书、三国志）年份散在文中、无稳定锚点，故只记月日与事，年留空——
 * 宁可缺一个字段，不可猜一个年份。
 *
 * 跑法：node scripts/chronicle-extract.mjs
 */

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SIKU = path.join(ROOT, "public/siku");
const LIT = path.join(ROOT, "public/worldlit");
const OUT = process.env.CHRON_OUT ? process.env.CHRON_OUT : path.join(ROOT, "public/chronicle");

// ── 干支 ──────────────────────────────────────────────────────────

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";
/** 六十甲子，序号 1..60（甲子为 1）。干支相配只取同奇偶者，故六十而非一百二十。 */
const SEXAGENARY = [];
for (let i = 0; i < 60; i++) SEXAGENARY.push(GAN[i % 10] + ZHI[i % 12]);
const GZ_INDEX = new Map(SEXAGENARY.map((g, i) => [g, i + 1]));

// ── 汉字数字 ──────────────────────────────────────────────────────

const DIGIT = { 零: 0, 〇: 0, "○": 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

/**
 * 汉字数字转阿拉伯。两种读法都要认：
 *  - 位值读法「二十二」「一百三十」——通鉴年号纪年（「泰始三年」）用这个
 *  - 逐字读法「二二」「四六七」——公元纪年那一行用这个（「公元四六七年」）
 * 以含不含「十／百」判别，不含者逐字拼。
 */
function cnNum(s) {
  if (!s) return null;
  if (s === "元") return 1;
  if (!/[十百千]/.test(s)) {
    let out = "";
    for (const ch of s) {
      if (!(ch in DIGIT)) return null;
      out += String(DIGIT[ch]);
    }
    return out ? parseInt(out, 10) : null;
  }
  // 位值读法
  let total = 0;
  let cur = 0;
  for (const ch of s) {
    if (ch in DIGIT) cur = DIGIT[ch];
    else if (ch === "十") {
      total += (cur || 1) * 10;
      cur = 0;
    } else if (ch === "百") {
      total += (cur || 1) * 100;
      cur = 0;
    } else if (ch === "千") {
      total += (cur || 1) * 1000;
      cur = 0;
    } else return null;
  }
  return total + cur;
}

// ── 月名 ──────────────────────────────────────────────────────────

/**
 * 月名归一化为 1..12。「十有一月」「十有二月」是春秋经传的写法，与十一月、
 * 十二月同指；「正月」即一月。闰月另记 lun 旗标，月份承前（「闰月」单出时无从
 * 判断闰的是哪一月，故取其前一条记事的月份，并标明是闰月）。
 */
const MONTH_ALIAS = new Map([
  ["正月", 1], ["一月", 1], ["二月", 2], ["三月", 3], ["四月", 4], ["五月", 5], ["六月", 6],
  ["七月", 7], ["八月", 8], ["九月", 9], ["十月", 10],
  ["十一月", 11], ["十有一月", 11], ["十二月", 12], ["十有二月", 12],
]);
/** 长名先行，否则「十一月」会被「一月」先吃掉。 */
const MONTH_NAMES = [...MONTH_ALIAS.keys()].sort((a, b) => b.length - a.length);
const MONTH_LABEL = ["", "正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

// ── 中土一轴：四库正文 ────────────────────────────────────────────

const SEASON = "春夏秋冬";

/**
 * 通鉴纪年行：「泰始三年丁未，公元四六七年」／「阳朔三年己亥，公元前二二年」。
 *
 * 年号名与年数一并捕获（`始皇帝三十七`），再由 splitEra 从右往左切出年数——
 * 分两组写不行：年号名与年数同是汉字，懒惰匹配会把年号名让给年数（「始皇帝
 * 三十七年」只剩「三十七年」），贪婪又会把年数吃进年号名。
 */
const RE_ERA_CE = new RegExp(
  `([^\\s　，。、；：]{1,16})年(?:[${GAN}][${ZHI}])?[，,]\\s*公元(前)?([一二三四五六七八九十百零〇○]{1,8})年`,
  "g"
);

/** 纪年头的夹注符号（◎○◇△●等）与空白，不是年号的一部分。 */
function cleanEra(s) {
  return s.replace(/^[◎○◇△●■□▲※\s　]+/, "").trim();
}

/**
 * 「始皇帝三十七」→ { label: "始皇帝三十七年", num: 37 }。
 * 从右往左取最长的汉字数字后缀作年数，其余作年号名；全是数字者（无年号，如
 * 通鉴开篇的「元年」）年号名留空。
 */
function splitEra(raw) {
  const s = cleanEra(raw);
  let i = s.length;
  while (i > 0 && /[元一二三四五六七八九十百]/.test(s[i - 1])) i--;
  const name = s.slice(0, i);
  const numStr = s.slice(i);
  if (!numStr) return { label: `${s}年`, num: null };
  return { label: `${name}${numStr}年`, num: cnNum(numStr) };
}
/** 春秋三传分年标记：「◇隐公元年」 */
const RE_ERA_LU = /◇([^\s　]{0,8}?公)(元|[一二三四五六七八九十]{1,6})年/g;

/**
 * 一条记事：季（可省）+ 月 + 日（可省）+ 事。
 *
 * 「夏，四月，辛卯，……」「夏四月辛巳，……」两种句读都要认，故分隔符一律可省。
 * 朔望二字两处都会出现——「七月，壬申朔」在干支之后，「二月，辛卯朔」亦然，
 * 而「十月朔」则在月之后，故干支前后各留一个位置，取到者即是。
 *
 * 「日」有两套写法：干支日（辛卯）与日号（初五、十五、二十五、廿五、7）。
 * 日号古书里极常见而干支往往不载，只收干支便把「某月某日事」整批漏掉；
 * 两者可有一可俱有，故各占一位、各自可省。
 */
const NO_DAY = process.env.NO_DAY === "1";
const RE_DAY =
  "(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|[一二三四五六七八九十]{1,3}|[0-9]{1,2})日" +
  "(?!中|之|所|乃|起|前|后|内|间|已|未)"; // 挡「二十日乃至」「三日之内」这类计日之数
const RE_REC = new RegExp(
  `(?:([${SEASON}])[，、]?\\s*)?(${MONTH_NAMES.join("|")}|闰月)[，、]?\\s*(朔|望)?[，、]?\\s*(${NO_DAY ? "" : RE_DAY})?\\s*([${GAN}][${ZHI}])?\\s*(朔|望)?[，、]?\\s*([^。！？\\n]{4,64})`,
  "g"
);

/**
 * 日号转 1..31。先试阿拉伯数字，再去「初」、辨「廿」，余者交 cnNum。
 * 廿读作二十（「廿五」= 25），故单字其后不足十字者按个数加二十。
 */
function dayNum(tok) {
  if (!tok) return null;
  let s = tok.replace(/日$/, "");
  if (/^[0-9]{1,2}$/.test(s)) {
    const n = parseInt(s, 10);
    return n >= 1 && n <= 31 ? n : null;
  }
  if (s.startsWith("初")) s = s.slice(1);
  if (s === "元") return 1;
  if (s.startsWith("廿")) {
    const rest = s.slice(1);
    const n = rest ? cnNum(rest) : 0;
    return n != null && n >= 0 && n <= 9 ? 20 + n : null;
  }
  const n = cnNum(s);
  return n != null && n >= 1 && n <= 31 ? n : null;
}

/**
 * 「日」是不是日号。
 *
 * 古籍里「N日」有两种读法，须分开：初五、廿五、十一日以上，断是日号；
 * 单字日（一日……九日）却常是别的词的后半——「暖似一日」「生日的那位姑娘」
 * 「天上的日头」「素日相契」——当它作日号，同一天便凭空多出一批假记事。
 *
 * 单字日靠两侧字合判：
 *  左——必紧承月名（中间至多容下朔、望、干支），间隔过远便不在纪日句里；
 *  右——「日」后的字不能是与日黏成词的字（的、头、暖、风、夜、本、后……）。
 * 初、廿两式中的汉字不用查右字，它们是日号专字，不作他用。
 */
/**
 * 计量之数：「至十三日止」「一连三日」「凡见百一十三日」「休三日」——日数而非日号。
 * 紧接「至／到」或后接「止／已上／以来」者，是起讫；后接动词而前无实指者，是时长。
 */
const RE_DAY_SPAN_BEFORE = /(?:至|到|凡|历|經|经|计|凡见|共)[^。，]{0,4}$/;
// 「三日」起头而正文以「至乎九日」收尾者，是起讫的起点（「正月三日至乎九日，三公卦也」）
const RE_DAY_SPAN_AFTER = /^(?:止|已|毕|畢|讫|訖|而止|至(?:乎)?[一二三四五六七八九十廿]{1,3}日)/;

/** 「日」后黏成别词的几种：生日的那位、日头、日暖风和、日日夜夜、日子。
 *  单字「日」不在此列——日蚀、日晕的记录正以「日」起句。
 *  「生的」「的话」是句子被日号切断后剩下的半截，不是事文。 */
const RE_DAY_GLUED = /^(?:的|头|暖|冷|热|风|夜|子|日日|久|常|本|后|前|甚|光|影|间|话|生的)/;

/** 正文以「时，」「时节，」起头者，日号只是时间状语的一部分（「三月三日时，千花万花拆」）。 */
const RE_DAY_ADVERBIAL = /^(?:时|时节)[，,]/;
function dayStands(tok, after, before) {
  if (RE_DAY_SPAN_BEFORE.test(before) || RE_DAY_SPAN_AFTER.test(after)) return false;
  const core = tok.replace(/日$/, "");
  if (/^初/.test(core) || /^廿/.test(core)) return true;
  if (/^[0-9]{2}$/.test(core)) return true;
  const n = cnNum(core);
  if (n == null) return false;
  // 月名：单字日必承月名，多字日也查一查，为好拦下面「一月三十日」那类
  const MONTHS = /正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|闰月/g;
  let last = -1;
  let monthStart = -1;
  for (const mm of before.matchAll(MONTHS)) {
    last = mm.index + mm[0].length;
    monthStart = mm.index;
  }
  if (last < 0) return n >= 10;
  const between = before.slice(last);
  if (between.replace(/[，、\s]|朔|望|[${GAN}][${ZHI}]/g, "").length > 0) return n >= 10;
  // 「月」是时长而非月份，或月名只是比方，都不是纪日之月：
  //   「恐是一月三十日」「且一月三十日」（说一个月的日数）、「化如正月一日」（打比方）。
  const beforeMonth = before.slice(0, monthStart);
  if (/(?:恐是|且|凡|共|期以|计|積|积|滿|满|过|歷|历|如|譬如)[，、\s]*$/.test(beforeMonth)) return false;
  if (n >= 10) return true;
  // 右字：黏成词者不是日号
  if (RE_DAY_GLUED.test(after)) return false;
  return true;
}

/**
 * 星野坐标：「正月二日燕、赵分」「正月二日，燕、越之分野也」。
 * 这里的日号与月份的用处都是天上分野的坐标，不是某日之事——汉书五行志一系尤其多。
 * 整条不取，不只是让出日号：正文本身也只是坐标，算不得记事。
 */
const RE_DIVISION =
  /^(?:[齐鲁燕赵魏韩楚秦周郑宋卫吴越晋梁陈蔡曹滕邾莒薛许虢虞宿纪随邓巴蜀庸郯徐舒荆扬兖豫青并幽冀雍益交凉]{1,2}州?之?、?){1,2}(?:分野也?|分也?)$/;

/** 正文以「的话」「时节，」「时，」起头者，句子在日号处被切断，剩的是半截附加语
 *  （「此是三月初一日的话，日暖风和」「正是六月初四日时节，天气未及晌午」）。 */
const RE_BODY_FRAGMENT = /^(?:的话|时节|时|前后|之时)[，,]/;

/** 校勘记、异文注之属，不是纪事。只用于新收的日号一路，免得扰动既有的干支一路。 */
const RE_COLLATE = /〔|校补|原文作|御覽引|御览引|刊本|一作|校畢|校毕|校訂|校订|校了|題記|题记|摺本|底本|影印|卷[一二三四五六七八九十]+於後/;

/** 校勘题记的日号（「四月二十日桌薌山人識」「九月十七日承康樂寺僧正…」）：整条不是纪事。 */

/** 卷目夹注、总目一类，不是记事。 */
function isNotEvent(text) {
  if (/^[）)】]/.test(text)) return true;
  if (/凡[一二三四五六七八九十百]+年/.test(text)) return true;
  if (/^起[^，]{0,8}，尽/.test(text)) return true;
  if (/[（(][^）)]*$/.test(text) && /^[^（(]*[）)]/.test(text)) return true;
  // 括号未闭或以括号收尾的残片
  if (/^[^（(]{0,20}[）)]/.test(text) && !/[，。]/.test(text.slice(0, 12))) return true;
  return false;
}

/** 事文收尾：截到第一个句末标点之前已由正则保证，此处再去掉尾随的空白与半截引号。 */
function tidy(text) {
  let s = text.replace(/[\s　]+/g, "").trim();
  s = s.replace(/^[，、：:]+/, "");
  // 去掉无配对的收尾引号／括号
  const opens = (s.match(/[“「『（(]/g) || []).length;
  const closes = (s.match(/[”」』）)]/g) || []).length;
  if (closes > opens) s = s.replace(/[”」』）)]+$/, "");
  return s;
}

async function readJSON(p) {
  return JSON.parse(await readFile(p, "utf8"));
}

/** 取某 offset 之前最近的纪年标记。 */
function eraBefore(marks, offset) {
  let hit = null;
  for (const m of marks) {
    if (m.offset > offset) break;
    hit = m;
  }
  return hit;
}

async function extractSiku(stats) {
  const catalog = await readJSON(path.join(SIKU, "catalog.json"));
  const readable = catalog.filter((e) => e.bookId);
  const records = [];

  for (const entry of readable) {
    const dir = path.join(SIKU, "books", entry.bookId);
    if (!existsSync(dir)) {
      stats.missingBooks.push(entry.bookId);
      continue;
    }
    const files = (await readdir(dir)).filter((f) => /^\d+\.json$/.test(f));
    let bookCount = 0;
    for (const f of files) {
      const ch = await readJSON(path.join(dir, f));
      const text = ch.content || "";
      if (!text) continue;

      // 这一章的纪年标记（两种体例各扫一遍，按 offset 合并排序）
      const marks = [];
      for (const m of text.matchAll(RE_ERA_CE)) {
        const ce = cnNum(m[3]);
        if (ce == null) continue;
        const era = splitEra(m[1]);
        marks.push({
          offset: m.index,
          year: m[2] ? -ce : ce, // 公元前记为负年
          label: era.label,
        });
      }
      for (const m of text.matchAll(RE_ERA_LU)) {
        marks.push({ offset: m.index, year: null, label: `${m[1]}${m[2]}年` });
      }
      marks.sort((a, b) => a.offset - b.offset);

      let lastMonth = null;
      for (const m of text.matchAll(RE_REC)) {
        const rawMonth = m[2];
        let month;
        let leap = false;
        if (rawMonth === "闰月") {
          if (lastMonth == null) continue; // 无从判断闰的是哪一月，弃
          month = lastMonth;
          leap = true;
          stats.leap++;
        } else {
          month = MONTH_ALIAS.get(rawMonth);
          lastMonth = month;
        }
        let body = tidy(m[7]);
        if (RE_DIVISION.test(body)) {
          stats.droppedDivision++;
          continue;
        }
        let day = m[4] ? dayNum(m[4]) : null;
        // 日号可退：数字不成立（「九十九日」）、或「正月一日」后紧接的不是事
        // （「三日之内」的日数是计日之数），一律退回事文，宁可不标日也不标错日。
        const dayAt = m[4] ? m.index + m[0].indexOf(m[4]) : m.index;
        const before = text
          .slice(Math.max(0, m.index - 24), dayAt)
          .replace(/[\s　]/g, "");
        // 半截附加语：日号是真的，但后文不成事，整条弃
        if (m[4] && day != null && RE_BODY_FRAGMENT.test(body)) {
          stats.droppedFragment++;
          continue;
        }
        if (m[4] && (day == null || !dayStands(m[4], body, before))) day = null;
        if (m[4] && day == null) body = tidy(m[4] + body).slice(0, 64);
        else if (m[4]) {
          // 校勘题记只在此一日号之后查，免得把前文的「校对」字样算进来
          if (RE_COLLATE.test(text.slice(dayAt, dayAt + m[4].length + 30))) {
            stats.droppedCollate++;
            continue;
          }
        }
        // 日号吃字后事文可能不足四字，如有干支／日号可依凭，两字的事文也留得住
        if (body.length < 4 && day != null && !m[5]) {
          body = tidy(m[4] + body).slice(0, 64);
          day = null;
        }
        if (!body || body.length < 4) {
          stats.droppedShort++;
          continue;
        }
        if (isNotEvent(body)) {
          stats.droppedNotEvent++;
          continue;
        }
        const era = eraBefore(marks, m.index);
        const gz = m[5] || null;
        if (day != null) stats.withDay++;
        if (gz) stats.withGz++;
        records.push({
          axis: "zh",
          group: entry.group,
          bookId: entry.bookId,
          book: entry.title,
          chapter: ch.n,
          chapterName: ch.name,
          month,
          leap,
          season: m[1] || null,
          phase: m[3] || m[6] || null, // 朔／望，月后与干支后都可能出现
          day,
          ganzhi: gz,
          gzIndex: gz ? GZ_INDEX.get(gz) ?? null : null,
          year: era?.year ?? null,
          era: era?.label ?? null,
          text: body,
        });
        bookCount++;
      }
    }
    if (bookCount) stats.byBook.push({ bookId: entry.bookId, title: entry.title, group: entry.group, n: bookCount });
  }
  return records;
}

// ── 西方一轴：世界文学原书 ────────────────────────────────────────

const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EN_MONTH_NO = new Map(EN_MONTHS.map((m, i) => [m, i + 1]));
const MONTH_ZH = ["", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

/**
 * 「月 + 日号」两种语序，英文小说里都常见：
 *   the 26th of October ／ October 26
 * 另有无日号的「in October」一类，也收——那是「十月里的事」，正是要找的时间节点。
 */
const RE_EN_DAY_FIRST = new RegExp(`\\b(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+of\\s+(${EN_MONTHS.join("|")})\\b`, "g");
const RE_EN_MONTH_FIRST = new RegExp(`\\b(${EN_MONTHS.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "g");
const RE_EN_BARE = new RegExp(`\\b(?:in|In|of|during|until|till|since|by|from|before|after)\\s+(?:the\\s+month\\s+of\\s+)?(${EN_MONTHS.join("|")})\\b`, "g");

/**
 * "May" 是英文里最大的假阳性：《奥德赛》《哈姆莱特》里的 May 几乎全是助动词
 * （"May heaven requite..."），一个月份也没有。故 May 只在两种情形下算月份：
 * 带日号，或前有介词（in May / of May）。此函数只管后一种的二次确认：
 * 助动词 May 作句首时后接动词原形与人称，前面不会是介词，故介词式已足够干净。
 */
function suspiciousMay(month, hasDay) {
  return month === 5 && !hasDay;
}

/** 句子边界：从命中处往两边各取一句，作为事文。 */
function sentenceAround(text, start, end) {
  let a = start;
  let b = end;
  for (let i = 0; i < 220 && a > 0; i++) {
    const ch = text[a - 1];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") break;
    a--;
  }
  for (let i = 0; i < 300 && b < text.length; i++) {
    const ch = text[b];
    b++;
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") break;
  }
  return text.slice(a, b).replace(/\s+/g, " ").trim();
}

/** 中译卷里的月份：「十月」「十月二十六日」。「正月」不收——中译一般作「一月」，
 *  若出现多是译者用了中历说法，归到公历月会错历，故宁缺。 */
const RE_ZH_DATE = new RegExp(`(${MONTH_NAMES.filter((n) => n !== "正月").join("|")})(?:\\s*([一二三四五六七八九十廿百\\d]{1,4})日)?`, "g");

/** 中译文里「月」字的常见非日期用法：三个月之后、一月以来、岁月、月光。 */
function notAZhDate(text, after) {
  if (/^(?:之后|之内|之间|之前|以后|以来|以前|左右|余|馀|多|许|后|前|间|内)/.test(after)) return true;
  if (/[个]月$/.test(text)) return true;
  return false;
}

/** 中译卷：抽「X月X日」与「X月」记事，一律作公历月（译自西历）。 */
function extractZhEdition(text, push) {
  for (const m of text.matchAll(RE_ZH_DATE)) {
    const month = MONTH_ALIAS.get(m[1]);
    if (!month) continue;
    const before = text.slice(Math.max(0, m.index - 2), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 4);
    if (/[个]$/.test(before)) continue; // 三个月
    if (notAZhDate(m[0], after)) continue;
    const day = m[2] ? cnNum(m[2]) ?? parseInt(m[2], 10) : null;
    push(month, Number.isFinite(day) && day >= 1 && day <= 31 ? day : null, m.index, m.index + m[0].length, "zh");
  }
}

/** 中译卷事文的句子边界（中文句读）。 */
function zhSentenceAround(text, start, end) {
  let a = start;
  let b = end;
  for (let i = 0; i < 120 && a > 0; i++) {
    const ch = text[a - 1];
    if ("。！？\n".includes(ch)) break;
    a--;
  }
  for (let i = 0; i < 160 && b < text.length; i++) {
    const ch = text[b];
    b++;
    if ("。！？\n".includes(ch)) break;
  }
  return text.slice(a, b).replace(/[\s　]+/g, "").trim();
}

async function extractLit(stats) {
  const catalog = await readJSON(path.join(LIT, "catalog.json"));
  const records = [];

  for (const entry of catalog) {
    for (const ed of entry.editions) {
      const dir = path.join(LIT, "books", ed.id);
      if (!existsSync(dir)) {
        stats.missingBooks.push(ed.id);
        continue;
      }
      const files = (await readdir(dir)).filter((f) => /^\d+\.json$/.test(f));
      let bookCount = 0;
      for (const f of files) {
        const ch = await readJSON(path.join(dir, f));
        const text = ch.content || "";
        if (!text) continue;
        const seen = new Set();

        const push = (month, day, start, end, lang = "en") => {
          if (lang === "en" && suspiciousMay(month, day != null)) {
            stats.droppedMay++;
            return;
          }
          const key = `${ch.n}:${start}`;
          if (seen.has(key)) return;
          seen.add(key);
          const body = lang === "en" ? sentenceAround(text, start, end) : zhSentenceAround(text, start, end);
          if (body.length < (lang === "en" ? 12 : 8)) {
            stats.droppedShort++;
            return;
          }
          records.push({
            axis: "west",
            lang,
            bookId: entry.id,
            edition: ed.id,
            book: entry.name,
            author: entry.author,
            chapter: ch.n,
            chapterName: ch.name,
            chapterTitle: ch.title ?? null,
            month,
            monthEn: EN_MONTHS[month - 1],
            monthZh: MONTH_ZH[month],
            day,
            text: body,
          });
          bookCount++;
        };

        if (ed.lang === "zh") {
          extractZhEdition(text, push);
          continue;
        }

        for (const m of text.matchAll(RE_EN_DAY_FIRST)) {
          const day = parseInt(m[1], 10);
          const month = EN_MONTH_NO.get(m[2]);
          if (day >= 1 && day <= 31) push(month, day, m.index, m.index + m[0].length);
        }
        for (const m of text.matchAll(RE_EN_MONTH_FIRST)) {
          const month = EN_MONTH_NO.get(m[1]);
          const day = parseInt(m[2], 10);
          // 「October 1865」是年不是日，故大于 31 者作无日号处理
          if (day >= 1 && day <= 31) push(month, day, m.index, m.index + m[0].length);
          else push(month, null, m.index, m.index + m[0].length);
        }
        for (const m of text.matchAll(RE_EN_BARE)) {
          const month = EN_MONTH_NO.get(m[1]);
          push(month, null, m.index, m.index + m[0].length);
        }
      }
      if (bookCount) stats.byBook.push({ bookId: ed.id, title: `${entry.name}（${ed.lang === "zh" ? "中译" : "原书"}）`, group: "西", n: bookCount });
    }
  }
  return records;
}

// ── 产出 ──────────────────────────────────────────────────────────

/**
 * 取事最整者在前：有年、有干支、事文长短适中者优先。
 * 「历史上的今天」一屏只放得下几条，挑的该是读得出所以然的那几条。
 */
function score(r) {
  let s = 0;
  if (r.axis === "zh") {
    if (r.year != null) s += 4;
    if (r.ganzhi) s += 3;
    if (r.day != null) s += 2; // 有日号者，「同日」之说才立得住
    if (r.season) s += 1;
    if (r.era) s += 1;
    if (r.text.length >= 12 && r.text.length <= 48) s += 2;
    if (r.group === "史") s += 2; // 史部纪事本就是正主
  } else {
    if (r.day != null) s += 5;
    if (r.text.length >= 40) s += 2;
  }
  return s;
}

async function main() {
  const stats = {
    leap: 0,
    droppedShort: 0,
    droppedNotEvent: 0,
    droppedMay: 0,
    droppedCollate: 0,
    droppedDivision: 0,
    droppedFragment: 0,
    withDay: 0,
    withGz: 0,
    missingBooks: [],
    byBook: [],
  };

  console.log("扫四库正文……");
  const zh = await extractSiku(stats);
  console.log(`  中土记事 ${zh.length} 条`);
  console.log("扫世界文学原书……");
  const west = await extractLit(stats);
  console.log(`  西书记事 ${west.length} 条`);

  const all = [...zh, ...west];
  all.forEach((r, i) => {
    r.id = `${r.axis}-${i}`;
    r.score = score(r);
  });

  await mkdir(OUT, { recursive: true });

  // 按月分片（中土农历月与西书公历月各挂一栏，由界面分列）
  const monthCounts = [];
  for (let m = 1; m <= 12; m++) {
    const inMonth = all.filter((r) => r.month === m).sort((a, b) => b.score - a.score);
    const zhN = inMonth.filter((r) => r.axis === "zh").length;
    const westN = inMonth.filter((r) => r.axis === "west").length;
    monthCounts.push({ month: m, label: MONTH_LABEL[m], en: EN_MONTHS[m - 1], zh: zhN, west: westN });
    await writeFile(
      path.join(OUT, `m${String(m).padStart(2, "0")}.json`),
      JSON.stringify({ month: m, label: MONTH_LABEL[m], en: EN_MONTHS[m - 1], records: inMonth })
    );
  }

  // 按干支日分片（只中土一轴有干支；六十日一轮，文件名用序号避开中文名）
  const gzCounts = {};
  for (let i = 1; i <= 60; i++) {
    const gz = SEXAGENARY[i - 1];
    const hits = zh.filter((r) => r.gzIndex === i).sort((a, b) => b.score - a.score);
    gzCounts[gz] = hits.length;
    await writeFile(
      path.join(OUT, `g${String(i).padStart(2, "0")}.json`),
      JSON.stringify({ index: i, ganzhi: gz, records: hits })
    );
  }

  // 西书按公历月日分片，供「历史上的今天」直接按今日取（一月一文件已够小，复用月分片）
  const index = {
    generated: new Date().toISOString().slice(0, 10),
    total: all.length,
    zhTotal: zh.length,
    westTotal: west.length,
    zhWithDay: stats.withDay,
    zhWithGanzhi: stats.withGz,
    months: monthCounts,
    ganzhi: gzCounts,
    books: stats.byBook.sort((a, b) => b.n - a.n),
    notes: {
      calendar: "中土一轴为阴阳历月与干支日；西书一轴为公历月日。农历十月≠公历十月，相差约一月，界面分栏并各标其历。",
      dropped: {
        leapFolded: stats.leap,
        tooShort: stats.droppedShort,
        notEvent: stats.droppedNotEvent,
        mayModal: stats.droppedMay,
        collate: stats.droppedCollate,
        division: stats.droppedDivision,
        fragment: stats.droppedFragment,
      },
      missingBooks: stats.missingBooks,
    },
  };
  await writeFile(path.join(OUT, "index.json"), JSON.stringify(index, null, 1));

  console.log("\n—— 产出 ——");
  console.log(`总计 ${all.length} 条（中土 ${zh.length} / 西书 ${west.length}）`);
  console.log("按月：", monthCounts.map((m) => `${m.label}=${m.zh}+${m.west}`).join(" "));
  const gzTop = Object.entries(gzCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log("干支日最多者：", gzTop.map(([g, n]) => `${g}=${n}`).join(" "));
  console.log(`干支日最少者：${Math.min(...Object.values(gzCounts))} 条；六十日全有记事者：${Object.values(gzCounts).filter((n) => n > 0).length}/60`);
  console.log(`日号 ${stats.withDay} 条，干支 ${stats.withGz} 条（两者可并有）`);
  console.log("丢弃：", JSON.stringify(index.notes.dropped));
  console.log("取事最多之书：", stats.byBook.slice(0, 8).map((b) => `${b.title}(${b.n})`).join(" "));
  if (stats.missingBooks.length) console.log("缺分片之书：", stats.missingBooks.join(" "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
