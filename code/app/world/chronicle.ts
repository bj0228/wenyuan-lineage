/**
 * 纪时记事 —— 「历史大事件」层的取数与算日。
 *
 * 语料出自 `scripts/chronicle-extract.mjs`：把四库正文与世界文学原书里自带日期的
 * 记事挑出来，落到 `public/chronicle/`。一万七千余条，自然不能进 bundle，故照四库
 * 与世界文学的老规矩按需 fetch——按月一片（十二片）、按干支日一片（六十片），
 * 一次只取用得上的那一片，约数十 KB。
 *
 * ## 两种历，不并作一种
 *
 * 这一层最要紧的一件事是别把两种历混成一种：
 *
 *  - **中土**纪的是阴阳历月 + 干支日：「冬，十一月，丁卯，光禄勋于永为御史大夫」。
 *    其「十一月」是朔望月，非公历十一月。也有一部分直接写着日号（「五月初三日」），
 *    多在小说家言、释家传记与笔记里——`day` 一栏记的就是这个。
 *  - **西书**纪的是公历月 + 日号：「On the 20th of October」。
 *
 * 农历十月与公历十月并非一事，大致差一个月。故本层不提供「农历月↔公历月」的换算，
 * 界面上两轴分栏、各标其历，错位之处由读者自己看见——那本就是这个项目要给人看的
 * 一处边界，糊成一种反而把东西弄丢了。
 *
 * ## 「历史上的今天」凭什么接得上
 *
 * 公历今日与史书里的农历日子无法直接相认，但有一条线是真连着的：**干支日**。
 * 六十日一轮的干支纪日自殷商以来连绵未断、不受历法改易影响（汉改太初历、唐改麟德历、
 * 明清改时宪历，纪日干支一天也没断过），故今日之干支可由儒略日号精确推得，
 * 与《资治通鉴》里某个「壬申」是同一个干支日——这不是比附，是同一条日序上的同一格。
 *
 * 于是「历史上的今天」两轴各走各的路：中土一侧按**今日农历月**取，月内再取**同
 * 日号或同干支之日**；西书一侧按**今日公历月日**取（史上同月同日）。两条都站得住，
 * 并在一屏上看。
 *
 * 农历月由运行环境自带的农历换得（见 `lunarOfDate`），干支由儒略日号算得。月这道
 * 筛子非收不可；只收干支，六十日一轮的干支会把十二个月的同名之日一并捞来，答出
 * 一条七月的事而牌面写着「今天」。月内再分一层：原话里写着日号的（「五月初三日」）
 * 先认日号，史部只记干支的便认干支，两样都是「同月之中的同一日」。
 *
 * 唯一要说清的是：月名相同，历法未必相同——《春秋》用周正，其正月比后世农历正月
 * 早约两个月。故这一层只认月名相同，不作改历，并把这句话写在界面上（见
 * ChronicleLayer 的历法小注）。
 *
 * ## 第三种：公历近现代一轴
 *
 * 四库那一轴止于后周显德六年（959），再往下便没有书可抽——而读者所在的今天是公历，
 * 近现代的事也只报公历。故另立一轴（`ModernRecord`，片名 `n01..n12`，由
 * `scripts/chronicle-modern.mjs` 抽得），与上面两轴并列，**仍不作换算**：
 * 农历一轴标农历，公历两轴标公历，页首与栏头各写各的历。
 *
 * 这一轴不点回原书（本就无书），只放事由与一段描写，另留维基出处由读者回查；
 * 每条皆经两源对签（日页所列之年月日 × 该事自己的 Wikidata 日期声明，全同才收）。
 */

import { asset } from "./assetPath";

// ── 干支纪日 ──────────────────────────────────────────────────────

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";

/** 六十甲子，序号 1..60（甲子为 1）。干支相配只取同奇偶者，故六十而非一百二十。 */
export const SEXAGENARY: string[] = Array.from({ length: 60 }, (_, i) => GAN[i % 10] + ZHI[i % 12]);

/**
 * 干支的拉丁转写（拼音去调）。
 *
 * 六十名不入词表：它是十干十二支相配算出来的，一条条抄进去便要抄六十行，且改一处
 * 拼法得改六十处。故按两表相拼，与 SEXAGENARY 同一个算法。
 *
 * 转写而不意译：「乙亥」不是「第十二日」，它是纪日的名，英文里只有音可借。
 */
const GAN_EN = ["jia", "yi", "bing", "ding", "wu", "ji", "geng", "xin", "ren", "gui"];
const ZHI_EN = ["zi", "chou", "yin", "mao", "chen", "si", "wu", "wei", "shen", "you", "xu", "hai"];

/** 干支日名作拉丁转写：「乙亥」→ "yi-hai"。非六十甲子之一者照原样返回。 */
export function ganzhiEn(gz: string): string {
  const i = SEXAGENARY.indexOf(gz);
  if (i < 0) return gz;
  return `${GAN_EN[i % 10]}-${ZHI_EN[i % 12]}`;
}

/**
 * 儒略日号（proleptic Gregorian，中午计）。标准算法，不依赖 Date 的时区。
 */
function julianDay(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

/**
 * 某公历日的干支。序号 1..60，名如「壬申」。
 *
 * 锚点以 (JDN + 49) mod 60 定，取的是连绵未断的那条日序；
 * 可验：1949-10-01 得甲子，与通行万年历相合。
 */
export function ganzhiOfDate(y: number, m: number, d: number): { index: number; name: string } {
  const i = ((julianDay(y, m, d) + 49) % 60 + 60) % 60;
  return { index: i + 1, name: SEXAGENARY[i] };
}

// ── 农历月日 ──────────────────────────────────────────────────────

/** 农历月日。`leap` 为闰月（如闰六月，ICU 写作 `6bis`）。 */
export type LunarDate = { month: number; day: number; leap: boolean };

/** 探针：丙午年正月初一。用来验运行环境真给的是农历，不是悄悄退回公历。 */
const LUNAR_PROBE = { y: 2026, m: 2, d: 17 };

let lunarFmt: Intl.DateTimeFormat | null | undefined;

function readLunar(f: Intl.DateTimeFormat, y: number, m: number, d: number): LunarDate | null {
  // 钉死 UTC 正午再换算：如此所换的就是 (y,m,d) 这一个日子本身，不受运行时区
  // 把日期推前推后（实测 UTC+14 与 UTC-11 下所得相同）。
  const parts = f.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
  const rawMonth = parts.find((p) => p.type === "month")?.value;
  const day = Number(parts.find((p) => p.type === "day")?.value);
  if (!rawMonth || !Number.isFinite(day)) return null;
  const leap = /bis$/.test(rawMonth);
  const month = Number(rawMonth.replace(/bis$/, ""));
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { month, day, leap };
}

/**
 * 公历日 → 农历月日。取用运行环境自带的农历（ICU 的 `ca-chinese`）。
 *
 * 不自嵌万年历表：那是两百来个十六进制数，错一个数便错一整年，而错处只在某几日
 * 才露出来，极难发觉。ICU 的农历由 Unicode 维护、浏览器与 Node 都带，实测可信：
 * 二〇二〇至二〇二七八个春节皆落正月初一、二〇二三至二〇二六中秋皆落八月十五、
 * 端午皆落五月初五，二〇二五闰六月与二〇二八闰五月亦认得出。
 *
 * 环境若不带农历（旧浏览器的精简 ICU 会悄悄退回公历，不报错），以探针验出后返回
 * null——由调用处改写口径，只说干支，不谎称农历（见 `zhSameDay`）。
 */
export function lunarOfDate(y: number, m: number, d: number): LunarDate | null {
  if (lunarFmt === undefined) {
    try {
      const f = new Intl.DateTimeFormat("en-u-ca-chinese", {
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
      });
      const probe = readLunar(f, LUNAR_PROBE.y, LUNAR_PROBE.m, LUNAR_PROBE.d);
      lunarFmt = probe && probe.month === 1 && probe.day === 1 && !probe.leap ? f : null;
    } catch {
      lunarFmt = null;
    }
  }
  return lunarFmt ? readLunar(lunarFmt, y, m, d) : null;
}

/**
 * 今日：公历月日 + 干支 + 农历月日 + 甲子轮次。调用处须在客户端（用了 new Date）。
 *
 * `cycle` 是自儒略日起算的第几轮六十甲子。同一干支六十日一回，若日签只取分数最高
 * 那条，六十日后便是同一条；以轮次取模换人，六十日一轮换着看，而仍是定值
 * （同一日进来两次所见相同，不随机）。
 */
export function todayMark(): {
  year: number;
  month: number;
  day: number;
  ganzhi: string;
  gzIndex: number;
  cycle: number;
  lunar: LunarDate | null;
} {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const gz = ganzhiOfDate(y, m, d);
  return {
    year: y,
    month: m,
    day: d,
    ganzhi: gz.name,
    gzIndex: gz.index,
    cycle: Math.floor((julianDay(y, m, d) + 49) / 60),
    lunar: lunarOfDate(y, m, d),
  };
}

// ── 月名 ──────────────────────────────────────────────────────────

/** 农历月名（中土一轴用）。一月作「正月」，依史书本文。 */
export const LUNAR_MONTHS = ["", "正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
/**
 * 农历月名的英文写法。
 *
 * 不作 "October"——那是公历十月，与农历十月差着约一个月，译成月名便把两种历
 * 混为一谈了。故作 "Lunar 10"：既短得进得去卡面那一行小字，也说明白这是第几个
 * 朔望月、不是公历的某月。
 */
export const LUNAR_MONTHS_EN = ["", "Lunar 1", "Lunar 2", "Lunar 3", "Lunar 4", "Lunar 5", "Lunar 6", "Lunar 7", "Lunar 8", "Lunar 9", "Lunar 10", "Lunar 11", "Lunar 12"];
/** 公历月名（西书一轴用）。与农历月名分开摆，免得看成一回事。 */
export const SOLAR_MONTHS = ["", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
export const EN_MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CN_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** 日号作中文：26 → 二十六。西书一轴的日号本是阿拉伯数字，中文界面读着别扭。 */
export function dayToCn(d: number): string {
  if (d <= 10) return d === 10 ? "十" : CN_DIGITS[d];
  if (d < 20) return `十${CN_DIGITS[d - 10]}`;
  if (d === 20) return "二十";
  if (d < 30) return `二十${CN_DIGITS[d - 20]}`;
  if (d === 30) return "三十";
  return `三十${CN_DIGITS[d - 30]}`;
}

/** 公元年作中文：507 → 公元五〇七年；-210 → 公元前二一〇年。 */
export function yearLabel(y: number): string {
  const neg = y < 0;
  const n = Math.abs(y);
  const digits = String(n).split("").map((c) => CN_DIGITS[Number(c)]).join("");
  return `公元${neg ? "前" : ""}${digits}年`;
}

/** 公元年作英文：507 → AD 507；-210 → 210 BC。中文那个把数字也写成汉字
 *  （公元五〇七年），英文界面里读不得，故另出一路，由显示处按语文择一。 */
export function yearLabelEn(y: number): string {
  return y < 0 ? `${-y} BC` : `AD ${y}`;
}

// ── 记事 ──────────────────────────────────────────────────────────

/** 中土一轴：四库正文里自带日期的记事。月为农历月，日为干支或日号。 */
export type ZhRecord = {
  axis: "zh";
  id: string;
  /** 经史子集 */
  group: string;
  bookId: string;
  book: string;
  chapter: number;
  chapterName: string;
  /** 农历月 1..12 */
  month: number;
  /** 闰月（「闰月」单出时月份承前，故另立旗标） */
  leap: boolean;
  season: string | null;
  /** 朔／望 */
  phase: string | null;
  /** 日号 1..31（「五月初三日」「三月二日」）；只记干支不记日号者为 null */
  day: number | null;
  /** 日干支，如「丁卯」；史书未记日者为 null */
  ganzhi: string | null;
  gzIndex: number | null;
  /** 公元年；仅通鉴一类有纪年锚点的书有，余者 null（宁缺不猜） */
  year: number | null;
  /** 年号纪年，如「天监六年」「隐公元年」 */
  era: string | null;
  text: string;
  score: number;
  /** 他书同记此事者（见 `mergeSameEvent`）。出分片时无此键，并条时才挂上。 */
  also?: ZhRecord[];
};

/** 西方一轴：世界文学原书与中译卷里的日期记事。月为公历月，日为日号。 */
export type WestRecord = {
  axis: "west";
  id: string;
  /** 这条出自原书还是中译卷 */
  lang: "en" | "zh";
  bookId: string;
  /** 分片卷名（点回原书用这个，不是 bookId） */
  edition: string;
  book: string;
  author: string;
  chapter: number;
  chapterName: string;
  chapterTitle: string | null;
  /** 公历月 1..12 */
  month: number;
  monthEn: string;
  monthZh: string;
  /** 日号 1..31；只记月不记日者为 null */
  day: number | null;
  text: string;
  score: number;
};

export type ChronicleRecord = ZhRecord | WestRecord;

/**
 * 公历近现代一条。
 *
 * 与上两轴不同处：**无书可点**（四库止于 959，西书亦非史书），故不存 bookId／chapter，
 * 只存事由（`event`）、一段描写（`desc`，取自该事维基导言首一二句）与出处链接。
 * `side` 分中土／西方两栏；`year/month/day` 皆公历，且已经两源对签。
 */
export type ModernRecord = {
  axis: "modern";
  side: "zh" | "west";
  year: number;
  month: number;
  day: number;
  /** 事由题名（中文；无中文名时为该页原题） */
  title: string;
  titleEn: string | null;
  /** 日页上那一句事由 */
  event: string;
  eventEn: string;
  /** 一段描写 */
  desc: string;
  descEn: string;
  /** 维基数据号与出处链接，读者可自行回查 */
  qid: string;
  url: string;
  urlEn: string | null;
  /** 跨语言条目数，用作排序的「要紧程度」 */
  links: number;
  /** 中英两种日页都列着这一件 */
  both: boolean;
  id: string;
};

export type MonthShard = { month: number; label: string; en: string; records: ChronicleRecord[] };
export type ModernShard = { month: number; label: string; en: string; records: ModernRecord[] };
export type GanzhiShard = { index: number; ganzhi: string; records: ZhRecord[] };

export type ChronicleIndex = {
  generated: string;
  total: number;
  zhTotal: number;
  westTotal: number;
  months: { month: number; label: string; en: string; zh: number; west: number }[];
  ganzhi: Record<string, number>;
  books: { bookId: string; title: string; group: string; n: number }[];
  notes: {
    calendar: string;
    calendarModern?: string;
    dropped: Record<string, number>;
    missingBooks: string[];
  };
  /** 公历近现代一轴的总目（抽取脚本另添的一节；旧片无此节，故可选） */
  modern?: {
    generated: string;
    total: number;
    zh: number;
    west: number;
    cnFrom: number;
    westFrom: number;
    source: string;
    licence: string;
    months: { month: number; zh: number; west: number }[];
  };
};

// ── 取数：各片一次取尽并缓存（照 siku.ts／worldlit.ts 的路子） ──

let indexCache: ChronicleIndex | null = null;
let indexPending: Promise<ChronicleIndex> | null = null;
const monthCache = new Map<number, MonthShard>();
const monthPending = new Map<number, Promise<MonthShard>>();
const gzCache = new Map<number, GanzhiShard>();
const gzPending = new Map<number, Promise<GanzhiShard>>();
const modCache = new Map<number, ModernShard>();
const modPending = new Map<number, Promise<ModernShard>>();

async function fetchJSON<T>(path: string, what: string): Promise<T> {
  const r = await fetch(asset(path));
  if (!r.ok) throw new Error(`${what} ${r.status}`);
  return (await r.json()) as T;
}

/** 总目：各月各干支的条数、取事之书、历法小注。约 6KB。 */
export function loadIndex(): Promise<ChronicleIndex> {
  if (indexCache) return Promise.resolve(indexCache);
  if (indexPending) return indexPending;
  indexPending = fetchJSON<ChronicleIndex>("/chronicle/index.json", "chronicle index")
    .then((j) => {
      indexCache = j;
      return j;
    })
    .finally(() => {
      indexPending = null;
    });
  return indexPending;
}

/** 某月一片：中土农历该月 + 西书公历该月，两轴同在一片，由界面分栏。 */
export function loadMonth(m: number): Promise<MonthShard> {
  const hit = monthCache.get(m);
  if (hit) return Promise.resolve(hit);
  const pending = monthPending.get(m);
  if (pending) return pending;
  const p = fetchJSON<MonthShard>(`/chronicle/m${String(m).padStart(2, "0")}.json`, `chronicle m${m}`)
    .then((j) => {
      monthCache.set(m, j);
      return j;
    })
    .finally(() => {
      monthPending.delete(m);
    });
  monthPending.set(m, p);
  return p;
}

/** 某干支日一片（只中土一轴有干支）。序号 1..60。 */
export function loadGanzhi(index: number): Promise<GanzhiShard> {
  const hit = gzCache.get(index);
  if (hit) return Promise.resolve(hit);
  const pending = gzPending.get(index);
  if (pending) return pending;
  const p = fetchJSON<GanzhiShard>(`/chronicle/g${String(index).padStart(2, "0")}.json`, `chronicle g${index}`)
    .then((j) => {
      gzCache.set(index, j);
      return j;
    })
    .finally(() => {
      gzPending.delete(index);
    });
  gzPending.set(index, p);
  return p;
}

/** 公历某月一片近现代之事（中土西方两栏同在一片，由界面分栏）。 */
export function loadModernMonth(m: number): Promise<ModernShard> {
  const hit = modCache.get(m);
  if (hit) return Promise.resolve(hit);
  const pending = modPending.get(m);
  if (pending) return pending;
  const p = fetchJSON<ModernShard>(`/chronicle/n${String(m).padStart(2, "0")}.json`, `chronicle n${m}`)
    .then((j) => {
      modCache.set(m, j);
      return j;
    })
    .finally(() => {
      modPending.delete(m);
    });
  modPending.set(m, p);
  return p;
}

/** 十二片近现代并作一处（只检索时用；全轴不过数千条，比四库那一轴小得多）。 */
export function loadAllModern(): Promise<ModernRecord[]> {
  return Promise.all(Array.from({ length: 12 }, (_, i) => loadModernMonth(i + 1))).then((ss) =>
    ss.flatMap((s) => s.records),
  );
}

// ── 挑事 ──────────────────────────────────────────────────────────

export function isZh(r: ChronicleRecord): r is ZhRecord {
  return r.axis === "zh";
}
export function isWest(r: ChronicleRecord): r is WestRecord {
  return r.axis === "west";
}

/**
 * 同一件事只出一条。
 *
 * 两处重出：一是《春秋》三传本是一经三注，同年同月同日记同一件事——哀公五年秋九月
 * 癸酉「齐侯杵臼卒」，左传、谷梁如此写，公羊作「齐侯处臼卒」，差着一个通假字，一屏
 * 十条里三条是同一件，看着便像出了错；二是《资治通鉴》多钞前史，与《汉书》《三国志
 * 注》常字字相同。另有同一书内的重出：《汉书》成帝纪历年正月「行幸甘泉，郊泰畤」，
 * 字面全同而年份各异，一日之内十四条一模一样，读着也只是重复。
 *
 * 并条之法：先按「月·闰·日号·干支」分格（日子不同便不是一件事，断不并），格内再比：
 * - 异书之间：字面全同、差一字（异文通假）、或短者为长者所含（左传叙详、公羊只一句）
 *   皆作一件；且年号与公元年须相容（一方缺可，两方有而不同者不并）。
 * - 「日有食之」「大赦」一类四五字的成语式记事，纵然字同也须年号或公元年对得上才并，
 *   不然《汉书》的一次日食会并到《左传》文公元年那一次上去——两次日食差着五百年。
 * - 同一书内：只并字面全同者，并后不标「又见」（同一书「又见」自己，读着不通）。
 *
 * 并后留分数最高者作正条（同分则取字多的，左传叙事详于二传），他书挂在 `also` 上。
 */
export function mergeSameEvent(rs: ZhRecord[]): ZhRecord[] {
  const key = (r: ZhRecord) => `${r.month}|${r.leap ? "闰" : ""}|${r.day ?? ""}|${r.ganzhi ?? ""}`;
  const norm = (s: string) => s.replace(/[^一-鿿]/g, "");
  const cells = new Map<string, { head: ZhRecord; norm: string; kin: ZhRecord[] }[]>();
  const order: ZhRecord[] = [];
  for (const r of rs) {
    const k = key(r);
    const n = norm(r.text);
    let cell = cells.get(k);
    if (!cell) {
      cell = [];
      cells.set(k, cell);
    }
    const hit = cell.find((c) => {
      const h = c.head;
      // 年号或公元年两方皆有而不同：两件事，不论字面如何
      if (h.era && r.era && h.era !== r.era) return false;
      if (h.year != null && r.year != null && h.year !== r.year) return false;
      const anchored = (!!h.era && h.era === r.era) || (h.year != null && h.year === r.year);
      if (h.bookId === r.bookId) return c.norm === n;
      if (!sameEvent(c.norm, n)) return false;
      return Math.min(c.norm.length, n.length) >= 7 || anchored;
    });
    if (hit) {
      hit.kin.push(r);
      continue;
    }
    cell.push({ head: r, norm: n, kin: [] });
    order.push(r);
  }
  const pick = new Map<ZhRecord, ZhRecord>();
  for (const cell of cells.values()) {
    for (const c of cell) {
      if (!c.kin.length) continue;
      const all = [c.head, ...c.kin].sort(
        (a, b) => b.score - a.score || b.text.length - a.text.length || (a.id < b.id ? -1 : 1),
      );
      const head = all[0];
      // 「又见」只列他书，且一书只列一次
      const books = new Set<string>();
      const also = all.slice(1).filter((o) => {
        if (o.bookId === head.bookId || books.has(o.bookId)) return false;
        books.add(o.bookId);
        return true;
      });
      pick.set(c.head, also.length ? { ...head, also } : head);
    }
  }
  return order.map((r) => pick.get(r) ?? r);
}

/** 两句是否记同一件事：全同、差一字、或短句为长句所含（长出不过十字）。 */
function sameEvent(a: string, b: string): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  if (l.length - s.length <= 1) {
    // 一字之差即可（「杵臼」与「处臼」之类的异文通假），两字以上便作两事
    let i = 0;
    let j = 0;
    let slack = 1;
    while (i < s.length && j < l.length) {
      if (s[i] === l[j]) {
        i++;
        j++;
        continue;
      }
      if (slack-- === 0) return false;
      if (s.length === l.length) i++;
      j++;
    }
    return true;
  }
  return s.length >= 5 && l.length <= s.length + 10 && l.includes(s);
}

/**
 * 一书不多占：按书轮转着取，免得一屏全是《资治通鉴》。
 *
 * 通鉴八千余条、后汉书两千条，若只按分数排，「今日」一屏十条里九条出自通鉴，
 * 看着就不像「四库」而像「通鉴摘抄」。故按书分组后轮转摊派：每轮各书出一条
 * （组内仍依分数），轮完再来一轮。
 */
export function spreadByBook<T extends { book: string; score: number }>(rs: T[], limit: number): T[] {
  const byBook = new Map<string, T[]>();
  rs.forEach((r) => {
    const arr = byBook.get(r.book);
    if (arr) arr.push(r);
    else byBook.set(r.book, [r]);
  });
  // 书序：事多者先（其书本就是纪事之书），组内分数高者先
  const groups = [...byBook.values()].sort((a, b) => b.length - a.length);
  groups.forEach((g) => g.sort((a, b) => b.score - a.score));
  const out: T[] = [];
  for (let round = 0; out.length < limit; round++) {
    let moved = false;
    for (const g of groups) {
      if (round < g.length) {
        out.push(g[round]);
        moved = true;
        if (out.length >= limit) break;
      }
    }
    if (!moved) break; // 各书都取尽了
  }
  return out;
}

/** 西书一轴按「今日公历月日」取：先同月同日，不足则补同月他日。 */
export function westForToday(records: ChronicleRecord[], day: number, limit: number): WestRecord[] {
  const west = records.filter(isWest);
  const sameDay = west.filter((r) => r.day === day).sort((a, b) => b.score - a.score);
  if (sameDay.length >= limit) return spreadByBook(sameDay, limit);
  const rest = west.filter((r) => r.day !== day).sort((a, b) => b.score - a.score);
  return [...sameDay, ...spreadByBook(rest, limit - sameDay.length)];
}

/**
 * 公历一轴的「今日」：只认同月同日，不补他日。
 *
 * 西书那一栏同日不足时会补同月他日（八部书里写日期的本就不多，不补便常是空栏）；
 * 这一轴不补——公历一轴每日都有事可报，补了反倒把「今天」说松了。
 */
export function modernForToday(
  records: ModernRecord[],
  side: "zh" | "west",
  month: number,
  day: number,
  limit: number,
): ModernRecord[] {
  return records
    .filter((r) => r.side === side && r.month === month && r.day === day)
    .sort((a, b) => b.links - a.links || b.year - a.year)
    .slice(0, limit);
}

/** 月令一屏：公历该月，按要紧程度与日序列。 */
export function modernForMonth(records: ModernRecord[], side: "zh" | "west", limit: number): ModernRecord[] {
  return records
    .filter((r) => r.side === side)
    .sort((a, b) => b.links - a.links || a.day - b.day)
    .slice(0, limit)
    .sort((a, b) => a.day - b.day || a.year - b.year);
}

/**
 * 检索公历一轴。
 *
 * 此轴所纪惟公历年月日与一句事由，故四样条件都办得通（干支一样办不通，与西书同）：
 * 年、月、日号按数对，字面检题名、事由与描写（中英两面都检）。
 */
export function searchModern(records: ModernRecord[], q: ChronQuery, side: "zh" | "west", limit: number) {
  const hit = records.filter((r) => {
    if (r.side !== side) return false;
    if (q.years.length && !q.years.includes(r.year)) return false;
    if (q.months.length && !q.months.includes(r.month)) return false;
    if (q.days.length && !q.days.includes(r.day)) return false;
    if (q.words.length) {
      const h = `${r.title} ${r.titleEn ?? ""} ${r.event} ${r.eventEn} ${r.desc} ${r.descEn}`.toLowerCase();
      if (!q.words.every((w) => h.includes(w.toLowerCase()))) return false;
    }
    return true;
  });
  hit.sort((a, b) => b.links - a.links || a.month - b.month || a.day - b.day);
  return { rows: hit.slice(0, limit), total: hit.length };
}

/**
 * 中土一轴按「农历同月 + 同干支日」挑出候选。
 *
 * 干支片里是史上所有这一干支之日，十二个月的都在。若不收月份，公历十月二十五日
 * 问「历史上的今天」，会答出一条「秋，七月，壬申朔，王含等水陆五万奄至江宁南岸」
 * ——干支一格不错（那日确是壬申，且是七月初一，故曰朔），可月份差着两三个月，
 * 牌面却写着「今天」，读着便成了「今天是七月」。故须以今日农历月再筛一道。
 *
 * 月 × 干支共七百二十格，实测无一格空（最少一条、中位十一条），故此筛不致空屏。
 * 纵有一格真空了，或运行环境不带农历（`lunarOfDate` 返回 null），则退回不收月份
 * 的那一堆，并以 `monthMatched: false` 告知界面改写口径——只说「史上壬申日」，
 * 不谎称同月同日。
 *
 * 农历月之外再分一层：同月之中，先取日号相同者（「五月初三日」），无则取干支相同
 * 者。日号是「某月某日」的原话，比干支更贴题；干支那一半留着，因为多数史部记事只
 * 记干支不记日号，若两样并作一堆摊，小说里一条「五月初三」会淹在几十条同月的干支
 * 记事里。两样都无者退到同月这一层，`dayMatched: false` 时界面只说「农历九月」，
 * 不加「这一日」。
 *
 * 另有一处史实须在界面标明：月名虽同，历法未必同。《春秋》用周正，其「正月」为
 * 建子之月，比后世农历正月早约两个月；秦及汉初以十月为岁首，然月名不改，错位较小。
 * 故先秦经书的月份与今农历月严格说不是一格，这一层只认月名相同，不作改历。
 */
export function zhSameDay(
  records: ZhRecord[],
  lunarMonth: number | null,
  lunarDay: number | null = null,
  ganzhi: string | null = null,
): { pool: ZhRecord[]; monthMatched: boolean; dayMatched: boolean } {
  if (lunarMonth) {
    const same = records.filter((r) => r.month === lunarMonth);
    if (same.length) {
      // 日号比干支紧：干支六十日一轮、同月里至多一轮，日号却是原话里点明的那一日。
      // 两样都有时不再合在一堆里摊——先把写着日号的拣出来，史部不记日号的那些
      // 干支条便退下去；一件日号条也没有时，才回到干支那一道。
      const byDay = lunarDay != null ? same.filter((r) => r.day === lunarDay) : [];
      if (byDay.length) return { pool: byDay, monthMatched: true, dayMatched: true };
      const hit = same.filter((r) => ganzhi != null && r.ganzhi === ganzhi);
      if (hit.length) return { pool: hit, monthMatched: true, dayMatched: true };
      return { pool: same, monthMatched: true, dayMatched: false };
    }
  }
  return { pool: records, monthMatched: false, dayMatched: false };
}

/** 「今日」一屏的中土一栏：先按农历月与日收紧，再按书轮转摊派。 */
export function zhForToday(
  records: ZhRecord[],
  lunarMonth: number | null,
  limit: number,
  lunarDay: number | null = null,
  ganzhi: string | null = null,
): { rows: ZhRecord[]; total: number; monthMatched: boolean; dayMatched: boolean } {
  const { pool, monthMatched, dayMatched } = zhSameDay(records, lunarMonth, lunarDay, ganzhi);
  // 并条在摊派之前：三传同记一事若各算一条，轮转时反倒三书各出一条，一屏三重
  const one = mergeSameEvent(pool);
  return { rows: spreadByBook(one, limit), total: one.length, monthMatched, dayMatched };
}

/**
 * 日签那一条：今日之事取哪一件。
 *
 * 分数最高者当然最像「大事」，但同一干支六十日一回，若永取第一条，两个月后日签
 * 还是同一句。故取前十二条，按甲子轮次取模换人：每日所见为定值（刷新不变），
 * 而六十日后再逢此干支时换另一条。
 */
export function headline(records: ZhRecord[], cycle: number): ZhRecord | null {
  if (!records.length) return null;
  const top = [...records].sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1)).slice(0, 12);
  return top[((cycle % top.length) + top.length) % top.length];
}

// ── 全库一取（只检索时用） ────────────────────────────────────────

/**
 * 十二月片并作一处，即全库一万七千余条。
 *
 * 每条记事必有月份，故十二片恰是全库的一个划分，无重无漏（可验：各片之和等于
 * index.total）。生 JSON 约 5.5MB、压后不足 1MB——不小，故只在用户真要检索时取：
 * 「今日」只要一片干支（约 40KB），「月令」只要一片月（约 450KB），都不走这里。
 */
let allCache: ChronicleRecord[] | null = null;
let allPending: Promise<ChronicleRecord[]> | null = null;

export function loadAll(): Promise<ChronicleRecord[]> {
  if (allCache) return Promise.resolve(allCache);
  if (allPending) return allPending;
  allPending = Promise.all(Array.from({ length: 12 }, (_, i) => loadMonth(i + 1)))
    .then((shards) => {
      const all = shards.flatMap((s) => s.records);
      allCache = all;
      return all;
    })
    .finally(() => {
      allPending = null;
    });
  return allPending;
}

// ── 检索：按日期、人名、地名、事由查一条记事 ──────────────────────

/** 中文数目作数：「二十五」「廿五」「五〇七」「二一〇」「210」皆可。 */
function cnNum(s: string): number | null {
  const t = s.replace(/廿/g, "二十").replace(/[〇○零]/g, "0");
  if (/^\d+$/.test(t)) return Number(t);
  const digit = (ch: string) => (ch === "0" ? 0 : CN_DIGITS.indexOf(ch));
  // 逐字读法（「五〇七」「二一〇」）：无十百千者按位列读
  if (!/[十百千]/.test(t)) {
    let n = 0;
    for (const ch of t) {
      const d = digit(ch);
      if (d < 0) return null;
      n = n * 10 + d;
    }
    return n;
  }
  // 位值读法（「二十五」「一百二十」）
  let total = 0;
  let cur = 0;
  for (const ch of t) {
    if (ch === "十" || ch === "百" || ch === "千") {
      const unit = ch === "十" ? 10 : ch === "百" ? 100 : 1000;
      total += (cur === 0 ? 1 : cur) * unit;
      cur = 0;
      continue;
    }
    const d = digit(ch);
    if (d < 0) return null;
    cur = d;
  }
  return total + cur;
}

/**
 * 月名诸般写法 → 月序。农历名（正月）、公历中文名（一月）、英文全名与三字缩写、
 * 阿拉伯数字（10月）并收：用户怎么写都认，至于这「十月」算农历还是公历，
 * 由两栏各按本轴之历解（界面上写明了）。
 */
const MONTH_WORDS = new Map<string, number>();
LUNAR_MONTHS.forEach((n, i) => i && MONTH_WORDS.set(n, i));
SOLAR_MONTHS.forEach((n, i) => i && MONTH_WORDS.set(n, i));
EN_MONTHS.forEach((n, i) => {
  if (!i) return;
  MONTH_WORDS.set(n.toLowerCase(), i);
  MONTH_WORDS.set(n.slice(0, 3).toLowerCase(), i);
});
for (let i = 1; i <= 12; i++) MONTH_WORDS.set(`${i}月`, i);
/** 长名先试，否则「十二月」会先被「二月」咬掉一截。 */
const MONTH_KEYS = [...MONTH_WORDS.keys()].sort((a, b) => b.length - a.length);

/** 检索条件。各项之间是「并且」，项内诸值是「或者」。 */
export type ChronQuery = {
  raw: string;
  /** 干支日名，如「壬申」——只中土一轴有 */
  ganzhi: string[];
  /** 月序 1..12——两轴各按本轴之历解 */
  months: number[];
  /** 日号 1..31——两轴皆有：中土是「五月初三日」的「初三」，西书是「the 20th」 */
  days: number[];
  /** 公元年，负为公元前——只中土一轴（且仅有纪年锚点之书）有 */
  years: number[];
  /** 余下的字面：人名、地名、书名、年号、事由，皆照字面找 */
  words: string[];
};

const QUERY_SEP = /[\s　,，、;；。!！?？:：·.…—\-+|「」『』《》〈〉()（）[\]"'“”‘’]+/;

/**
 * 把一句话拆成日期条件与关键词。
 *
 * 「十月二十五日 曹操」→ 月=10、日=25、词=[曹操]
 * 「壬申」→ 干支=[壬申]
 * 「公元前二一〇年 始皇」→ 年=[-210]、词=[始皇]
 * 「October 20 Verne」→ 月=10、日=20、词=[verne]
 *
 * 拆法是「认出便挖掉」：先年、再月、再日，各自认出的字面从串上抹去，剩下的才作
 * 关键词。次序要紧——否则「十月」里的「十」会先被日号规则吃掉。
 */
export function parseQuery(raw: string): ChronQuery {
  const q: ChronQuery = { raw, ganzhi: [], months: [], days: [], years: [], words: [] };
  let s = raw;
  const blank = (at: number, len: number) => {
    s = s.slice(0, at) + " ".repeat(len) + s.slice(at + len);
  };

  // 一、干支日（六十名，两字一组，不与月日相犯）
  SEXAGENARY.forEach((gz) => {
    for (let at = s.indexOf(gz); at >= 0; at = s.indexOf(gz, at + 1)) {
      if (!q.ganzhi.includes(gz)) q.ganzhi.push(gz);
      blank(at, gz.length);
    }
  });

  // 二、公元年（「公元前二一〇年」「公元507年」「507年」）。
  // 先认后抹：认的时候要分正负，抹的时候整段抹净——按捕获位逐段抹易出偏差。
  const reCE = /公元(前)?\s*([\d〇○零一二三四五六七八九十百千]{1,8})年?|(?:^|[^\d])(\d{3,4})年/g;
  for (let m = reCE.exec(s); m; m = reCE.exec(s)) {
    const n = cnNum(m[2] ?? m[3] ?? "");
    if (n == null || n <= 0) continue;
    const y = m[1] ? -n : n;
    if (!q.years.includes(y)) q.years.push(y);
  }
  s = s.replace(/公元(前)?\s*[\d〇○零一二三四五六七八九十百千]{1,8}年?/g, (x) => " ".repeat(x.length));
  s = s.replace(/\d{3,4}年/g, (x) => " ".repeat(x.length));

  // 三、月名（长名先行）
  const low = () => s.toLowerCase();
  MONTH_KEYS.forEach((key) => {
    const m = MONTH_WORDS.get(key)!;
    for (let at = low().indexOf(key); at >= 0; at = low().indexOf(key, at + 1)) {
      if (!q.months.includes(m)) q.months.push(m);
      blank(at, key.length);
    }
  });

  // 四、日号（「初三」「廿五」、中文「二十五日」、英文「20th」、径写「25日」）
  // 初／廿两式先认：cnNum 不认「初三」的「初」，留着会被当成关键词。
  const reDayEarly = /初([一二三四五六七八九十])日?|廿([一二三四五六七八九十]?)日?/g;
  for (let m = reDayEarly.exec(s); m; m = reDayEarly.exec(s)) {
    const n = m[1] ? cnNum(m[1]) : m[2] ? 20 + cnNum(m[2])! : 20;
    if (n != null && n >= 1 && n <= 31 && !q.days.includes(n)) q.days.push(n);
  }
  s = s.replace(reDayEarly, (x) => " ".repeat(x.length));
  const reDayCn = /([\d〇○零一二三四五六七八九十廿]{1,4})日/g;
  for (let m = reDayCn.exec(s); m; m = reDayCn.exec(s)) {
    const n = cnNum(m[1]);
    if (n != null && n >= 1 && n <= 31 && !q.days.includes(n)) q.days.push(n);
  }
  s = s.replace(reDayCn, (x) => " ".repeat(x.length));
  const reDayEn = /\b(\d{1,2})(?:st|nd|rd|th)\b/gi;
  for (let m = reDayEn.exec(s); m; m = reDayEn.exec(s)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 31 && !q.days.includes(n)) q.days.push(n);
  }
  s = s.replace(reDayEn, (x) => " ".repeat(x.length));
  // 「October 20」「10月 25」：月份既已认出，身边那个一两位数就是日号
  // （不带 st/nd/rd/th 的写法很常见）。未认出月份时则不敢作此解——
  // 孤零零一个「20」更可能是人要找的字面。
  if (q.months.length && !q.days.length) {
    const reBare = /(?:^|[^\d])(\d{1,2})(?![\d])/g;
    for (let m = reBare.exec(s); m; m = reBare.exec(s)) {
      const n = Number(m[1]);
      if (n >= 1 && n <= 31 && !q.days.includes(n)) q.days.push(n);
    }
    if (q.days.length) s = s.replace(/(^|[^\d])\d{1,2}(?![\d])/g, (x) => " ".repeat(x.length));
  }

  // 五、剩下的都作关键词。英文一概下划作小写，中文照字面（其本无大小写）
  q.words = s
    .split(QUERY_SEP)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && w !== "的" && w !== "年" && w !== "月" && w !== "日");

  return q;
}

/** 这一问里到底给了哪几项条件。 */
function facetsOf(q: ChronQuery): string[] {
  const f: string[] = [];
  if (q.ganzhi.length) f.push("ganzhi");
  if (q.years.length) f.push("years");
  if (q.months.length) f.push("months");
  if (q.days.length) f.push("days");
  if (q.words.length) f.push("words");
  return f;
}

/**
 * 一轴能表的条件。中土的日有两套写法：日号（五月初三日）与干支（癸酉），故两样都能筛；
 * 西书有日号而无干支、亦无公元纪年。
 */
const EXPRESSIBLE: Record<"zh" | "west", string[]> = {
  zh: ["ganzhi", "years", "months", "days", "words"],
  west: ["months", "days", "words"],
};

function hay(r: ChronicleRecord): string {
  const base = `${r.text}\n${r.book}\n${r.chapterName}`;
  return isZh(r) ? `${base}\n${r.era ?? ""}\n${r.group}` : `${base}\n${r.author}\n${r.chapterTitle ?? ""}`;
}

/**
 * 另给的可检字面。
 *
 * 西书一轴的书名作者在片里只存中文（「月界旅行」「凡尔纳」），英文名出自界面词表
 * 而不在数据里；故英文读者检「Verne」本检不着。界面调用时把 `t(书名)`、`t(作者)`
 * 一并交进来，便两种名都检得着——词表的事归界面，数据层不认识 i18n。
 */
export type ExtraHay = (r: ChronicleRecord) => string;

function hitsWords(r: ChronicleRecord, words: string[], extra?: ExtraHay): boolean {
  if (!words.length) return true;
  const h = `${hay(r)}\n${extra ? extra(r) : ""}`.toLowerCase();
  return words.every((w) => h.includes(w));
}

/** 检索所得：两栏各自的条目、总数，以及某项条件在此轴上不适用的交代。 */
export type SearchResult = {
  zh: ZhRecord[];
  west: WestRecord[];
  zhTotal: number;
  westTotal: number;
  /** 此轴整栏不适用的缘由（如向西书问干支）；null 为适用 */
  zhNA: string | null;
  westNA: string | null;
  /** 此轴未能照办的条件名（如中土无日号），界面上据此出一行小注 */
  zhDropped: string[];
  westDropped: string[];
};

/**
 * 按条件检索全库。
 *
 * 两轴各走各的历，故同一问在两栏上未必问得通：向西书问「壬申」是问不通的
 * （西书不纪干支），向四库问公元年份也问不通（四库纪年用年号）。此处不含糊
 * 过去，分两种办法：
 *
 *  - 若此轴尚有别的条件可办（如「壬申 曹操」里的干支之于西书），便按能办的办，
 *    把办不了的那项列在 `zhDropped`，界面上注一行「干支只筛四库一侧」；
 *  - 若此轴一项也办不了（如只问「壬申」之于西书），便整栏不出，于 `westNA`
 *    说明缘由——与其摆一屏不相干的条目，不如说清这一问在此轴上不成立。
 */
export function runSearch(all: ChronicleRecord[], q: ChronQuery, limit: number, extra?: ExtraHay): SearchResult {
  const facets = facetsOf(q);
  const plan = (axis: "zh" | "west") => {
    const usable = facets.filter((f) => EXPRESSIBLE[axis].includes(f));
    const dropped = facets.filter((f) => !EXPRESSIBLE[axis].includes(f));
    return { usable, dropped };
  };
  const zhPlan = plan("zh");
  const westPlan = plan("west");

  const zhHit = (r: ZhRecord) =>
    (!zhPlan.usable.includes("ganzhi") || (r.ganzhi != null && q.ganzhi.includes(r.ganzhi))) &&
    (!zhPlan.usable.includes("years") || (r.year != null && q.years.includes(r.year))) &&
    (!zhPlan.usable.includes("months") || q.months.includes(r.month)) &&
    (!zhPlan.usable.includes("days") || (r.day != null && q.days.includes(r.day))) &&
    (!zhPlan.usable.includes("words") || hitsWords(r, q.words, extra));

  const westHit = (r: WestRecord) =>
    (!westPlan.usable.includes("months") || q.months.includes(r.month)) &&
    (!westPlan.usable.includes("days") || (r.day != null && q.days.includes(r.day))) &&
    (!westPlan.usable.includes("words") || hitsWords(r, q.words, extra));

  const zhAll = zhPlan.usable.length ? mergeSameEvent(all.filter(isZh).filter(zhHit)) : [];
  const westAll = westPlan.usable.length ? all.filter(isWest).filter(westHit) : [];

  return {
    zh: spreadByBook(zhAll, limit),
    west: spreadByBook(westAll, limit),
    zhTotal: zhAll.length,
    westTotal: westAll.length,
    zhNA: zhPlan.usable.length ? null : zhPlan.dropped.join(","),
    westNA: westPlan.usable.length ? null : westPlan.dropped.join(","),
    zhDropped: zhPlan.usable.length ? zhPlan.dropped : [],
    westDropped: westPlan.usable.length ? westPlan.dropped : [],
  };
}
