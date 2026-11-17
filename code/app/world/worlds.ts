import type { Region } from "./regions";
import { regions as zhanguoRegions } from "./regions";
import type { Persona } from "./characters";
import { scholars } from "./characters";
import { xiyouAllRegions } from "./xiyou-regions";
import { xiyouPersonas } from "./xiyou-personas";
import { westPersonas } from "./west-personas";
import { historicalPersonas } from "./historical-personas";
import { generatedPersonas } from "./generated-personas";

/**
 * 世界注册表 —— 把「先秦诸子」从单例变成一个有名字的世界，再并上「西游」。
 *
 * 三层模型 Persona ──role──> Work ──contains──> Passage 之上还有一层：世界。
 * 世界是这三层共同的边界，因为跨界之后，辩论本身就不成立了——
 *
 *   **同世界之内才辩论，跨世界只能评议。**
 *
 * 孔子与韩非争「以德治还是以法治」，是同一个论题下的对立，可以往复。孔子与孙悟空
 * 之间没有共同论题——悟空不持一家之说，他甚至不在论证。强把两人摆上辩席，只会
 * 逼模型替悟空代拟一套他从未说过的道理。所以跨世界走另一条路：同一**母题**之下，
 * 各出各的解，互相评议而不互相驳斥（见 motifs.ts 与 MotifLayer.tsx）。
 *
 * 战国诸子与 16 区不写 `worldId`，`worldOf()` 以 `?? "zhanguo"` 兜底——
 * 现有数据一字未改，这是接入新世界的硬要求。
 */
export type WorldId = "zhanguo" | "zhonghua" | "xiyou" | "west";

export type World = {
  id: WorldId;
  name: string;
  era: string;
  hint: string;
  /**
   * 地图拓扑。`scatter` 诸区并置、无先后（战国）；
   * `route` 诸处有严格次第，过而不返（西游取经路）。
   * 渲染栈共用，只是 route 多画一条连缀的路线。
   */
  mapKind: "scatter" | "route";
  regions: Region[];
  personas: Persona[];
};

export const WORLDS: World[] = [
  {
    id: "zhanguo",
    name: "先秦诸子",
    era: "春秋战国",
    hint: "百家并起，各执一端；同席可辩，往复不休。",
    mapKind: "scatter",
    regions: zhanguoRegions,
    personas: scholars,
  },
  {
    id: "xiyou",
    name: "西游",
    era: "唐·神魔",
    hint: "一路向西，十三处皆难；人物不立说，只在处境里应对。",
    mapKind: "route",
    // 路上十三处之外，另有界外五处（花果山、斜月三星洞、凌霄殿、兜率宫、南海）——
    // 前七回与观音、玉帝、老君、须菩提诸人皆在其中，是世界之地，只是不在次第里。
    regions: xiyouAllRegions,
    personas: xiyouPersonas,
  },
];

/**
 * 世界文学那一轴 —— 有名有句，无地无日程。
 *
 * 母题层要三轴并置（战国／西游／西方），而三轴要对等：每轴各有其人、各有其锚点
 * 原句。前二轴是 `World`（有 16 区、有取经十三难，人在图上走、按日程行止），
 * 西方这一轴没有地方——七位是作者，不是住在某处的人物；他们的「处境」是各自那部书。
 *
 * 故此处单列一条轴目，只备名目（名、纪年、提示）供母题层标签与提示词用，
 * **不入 `WORLDS`**：世界切换、罗盘四方、地图、日程一概不受其扰。
 * 但并进 `worldMap`，因为凡按 id 查世界名的地方（母题层的轴标）都该查得到——
 * 查不到就只能把 id「west」原样印在卡上。
 */
export const WEST_AXIS: World = {
  id: "west",
  name: "世界文学",
  era: "荷马至近代",
  hint: "从古希腊至近现代，各在自己的代表作中发言，在共同问题下对读。",
  mapKind: "scatter",
  regions: [],
  personas: westPersonas,
};

/** 汉至近代的中国文化人物轴：用于评议，不进入地图与日程。 */
export const CHINA_AXIS: World = {
  id: "zhonghua",
  name: "历代中国",
  era: "汉至近今",
  hint: "沿中国典籍文脉展开，让不同时代的作者依据自身著述参与评议。",
  mapKind: "scatter",
  regions: [],
  personas: [...historicalPersonas, ...generatedPersonas],
};

/** 所有可进入事件、母题、典籍与选文评议的角色分组。 */
export const REVIEW_AXES: World[] = [WORLDS[0], CHINA_AXIS, WORLDS[1], WEST_AXIS];

export const worldMap: Record<string, World> = Object.fromEntries(
  REVIEW_AXES.map((w) => [w.id, w]),
);

export const DEFAULT_WORLD: WorldId = "zhanguo";

// —— 四方：入口处的指南针 ——

export type Bearing = "东" | "南" | "西" | "北";

/** 四库之部。部居罗盘四隅，自书架到世界皆由此出（见 CompassLayer 的盘隅）。 */
export type Part = "经" | "史" | "子" | "集";

/**
 * 指南针上的一方。
 *
 * 四方不是随手指派的标签，各有其地理之据（见 `why`）：取经向西，太史公南游，
 * 稷下在齐之东，魏都邺城在北。方位既合其事，入口便不只是一张菜单——
 * 点「西」就是西行，这一下与世界本身是一回事。
 *
 * `worldId` 为 null 者未启：盘面上照样占一方、照样写明来路，只是不可点。
 * 空着比藏着好——四方缺二，一眼看得出后面还有什么。
 */
export type CompassPoint = {
  bearing: Bearing;
  /** 已开之世界取其 id；未启者 null */
  worldId: WorldId | null;
  name: string;
  era: string;
  hint: string;
  /** 何以居此方 */
  why: string;
  /** 其书在四库何部何类——四方皆自这一架书里出来 */
  siku: string;
};

export const COMPASS: CompassPoint[] = [
  {
    bearing: "东",
    worldId: "zhanguo",
    name: "先秦诸子",
    era: "春秋战国",
    hint: "十六区并置，二十一人各自行止；相遇即可开辩。",
    why: "稷下学宫在齐，齐居东海之滨，诸子东游而论。",
    siku: "子部 · 儒家／道家／法家诸说",
  },
  {
    bearing: "南",
    worldId: null,
    name: "史记",
    era: "汉 · 太史公",
    hint: "究天人之际，通古今之变；百三十篇，纪传之祖。",
    why: "太史公二十而南游江淮，上会稽、探禹穴，遍历而后成书。",
    siku: "史部 · 正史 · 《三家注史记》一百三十卷",
  },
  {
    bearing: "西",
    worldId: "xiyou",
    name: "西游",
    era: "唐 · 神魔",
    hint: "一路向西，十三处皆难；人物不立说，只在处境里应对。",
    why: "取经自东土向西，一路不回头。",
    siku: "集部 · 小说 · 《西游记》一百回",
  },
  {
    bearing: "北",
    worldId: null,
    name: "三国",
    era: "汉末 · 魏蜀吴",
    hint: "九州分据，谋士各事其主；同一局势，各算一本账。",
    why: "魏都邺城、许都皆在北，挟天子者居此。",
    siku: "史部 · 正史 · 《三国志》／集部 · 小说 · 《三国演义》",
  },
];

/** 盘面按正北起、顺时针排（北→东→南→西），供指南针逐方铺画。 */
export const compassOf = (b: Bearing): CompassPoint => COMPASS.find((c) => c.bearing === b)!;

/** 人格所属世界。省略 `worldId` 者即战国——战国诸子皆走此路。 */
export function worldOf(p: Persona): WorldId {
  return (p.worldId as WorldId) ?? "zhanguo";
}

/** 人格之属。省略 `kind` 者即 thinker。worker 提示词据此分支。 */
export function kindOf(p: Persona): "thinker" | "figure" | "west" {
  return p.kind ?? "thinker";
}

/**
 * 跨所有世界的人格表，供母题层按 id 取人（不论他在哪个世界）。
 *
 * 并上西方七位（2026-10-15）：母题层的评议席要请得动他们，而请人是按 id 取的。
 * 这一表不被罗盘、地图、日程、辩论候选用——那几处走 `WORLDS` 或 `scholars`，
 * 故七人入此表不会漏到世界里去。
 */
export const allPersonas: Persona[] = REVIEW_AXES.flatMap((w) => w.personas);
export const allPersonaMap: Record<string, Persona> = Object.fromEntries(
  allPersonas.map((p) => [p.id, p]),
);

/**
 * 两个人格是否同世界——不同世界者不得同席辩论，只可就母题评议。
 *
 * 西方七位彼此同轴（皆 `west`），按此判断算「同世界」，但辩席上永不会出现他们：
 * 对辩候选取自 `scholars` 与各世界的 personas 名单，`WEST_AXIS` 不在其中。
 * 真要让莎士比亚与歌德对辩，是另一件事，须先给西方这一轴立起论题——现在没有。
 */
export function sameWorld(a: string, b: string): boolean {
  const pa = allPersonaMap[a];
  const pb = allPersonaMap[b];
  if (!pa || !pb) return false;
  return worldOf(pa) === worldOf(pb);
}
