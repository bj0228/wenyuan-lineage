import { canon, type Passage } from "./canon";
import { scholarMap } from "./characters";
import { regionMap } from "./regions";

/** 游学题候选：有主之典籍，且其主在 scholarMap 有档案、home 落 regionMap（能"往某地问某人"）。
 *  公共典籍（owner===""）与档案不全者（如 guigu/zisi/wenwang 仅入 canon 不入 scholarMap）不入游学题，
 *  否则 dailyQuestFor 读 scholar.home / region.name 会崩。 */
const POOL: Passage[] = canon.filter((p) => {
  if (p.owner === "") return false;
  const s = scholarMap[p.owner];
  if (!s || !s.home) return false;
  return !!regionMap[s.home];
});

export type QOpt = { text: string; correct: boolean };

/** 确定性 hash：种子数 → [0,1)。纯函数（仅 Math.sin/Math.floor），可安全用于 render 期。 */
export function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 字符串确定性 hash → [0,1)（用于按日期/题面挑题）。 */
export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h += s.charCodeAt(i) * (i + 1);
  return rnd(h);
}

/** 从数组按种子确定性挑一项（不调 Math.random）。 */
export function pick<T>(arr: T[], seed: number): T {
  return arr[Math.min(arr.length - 1, Math.floor(rnd(seed) * arr.length))];
}

/** 确定性洗牌（仅 Math.sin/Math.floor）。 */
export function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(seed * 31 + i * 7) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type DailyQuest = {
  passageId: string;
  scholarId: string;
  book: string;
  chapter: string;
  text: string;
  gloss: string;
  /** 题面 */
  question: string;
  /** 去哪问谁。整句（「可往楚之漆园问庄子」）不入词表——地名人名各有千百种拼法，
   *  故另出其两半，显示处按 t("可往{region}问{scholar}") 合（见 BulletinBoard）。 */
  hint: string;
  /** 提示里的地名；兜底那一支无处可指，作空 */
  hintRegion: string;
  /** 提示里的人名；兜底那一支作空 */
  hintScholar: string;
};

/**
 * 游学题：以世界日序号串（'wd-N'，时辰轮转一轮 +1）为种，从有主典籍中确定性挑一条；
 * 一世界日一题、轮转即换。题面问「此句何义」，提示往某区域问某子。
 */
export function dailyQuestFor(seedStr: string): DailyQuest {
  if (POOL.length === 0) {
    // 兜底：POOL 为空时回退到任一有主典籍，避免白屏（home/region 缺则用占位）
    const p = canon.find((x) => x.owner !== "") ?? canon[0];
    return {
      passageId: p.id, scholarId: p.owner, book: p.book, chapter: p.chapter,
      text: p.text, gloss: p.gloss, question: `「${p.text}」此句何义？`,
      hint: "可往学宫问诸子",
      hintRegion: "",
      hintScholar: "",
    };
  }
  const p = POOL[Math.min(POOL.length - 1, Math.floor(hashStr(seedStr) * POOL.length))];
  const scholar = scholarMap[p.owner];
  const region = regionMap[scholar.home];
  return {
    passageId: p.id,
    scholarId: p.owner,
    book: p.book,
    chapter: p.chapter,
    text: p.text,
    gloss: p.gloss,
    question: `「${p.text}」此句何义？`,
    hint: `可往${region.name}问${scholar.name}`,
    hintRegion: region.name,
    hintScholar: scholar.name,
  };
}

/**
 * 回禀四选一的选项：正解为该句 gloss，三歧为他句 gloss，确定性洗牌（按题面稳定）。
 * 纯函数，可在 render 期调用。
 */
export function huibingChoicesFor(passageId: string): QOpt[] {
  const correct = canon.find((p) => p.id === passageId);
  if (!correct) return [];
  const others = canon.filter((p) => p.id !== passageId && p.gloss !== correct.gloss);
  const seed = hashStr(passageId) * 1000;
  const d1 = pick(others, seed + 1);
  const d2 = pick(others.filter((p) => p.gloss !== d1.gloss), seed + 2);
  const d3 = pick(others.filter((p) => p.gloss !== d1.gloss && p.gloss !== d2.gloss), seed + 3);
  return shuffle(
    [
      { text: correct.gloss, correct: true },
      { text: d1.gloss, correct: false },
      { text: d2.gloss, correct: false },
      { text: d3.gloss, correct: false },
    ],
    seed + 9,
  );
}
