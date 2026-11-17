import { scholars } from "./characters";
import { isIndoor, shelterOf } from "./regions";

export type ScheduleEvent = {
  id: string;
  /** 起止时刻，单位为世界时的“刻”，一日 96 刻，每刻 15 分 */
  start: number;
  end: number;
  region: string;
  /** 参与人物，第一位为发起者 */
  actors: string[];
  title: string;
  /** 人物在该事件中的动作描述，缺省用 title */
  action?: Record<string, string>;
  /** 事件正在发生时，旁观者在地图上看到的一句话 */
  scene: string;
  topic?: string;
};

const H = (hour: number, quarter = 0) => hour * 4 + quarter;

/** 预设日程：15 个事件，覆盖一日 12 时辰。 */
export const schedule: ScheduleEvent[] = [
  {
    id: "dawn-lecture",
    start: H(5),
    end: H(7),
    region: "academy",
    actors: ["kong"],
    title: "杏坛晨讲",
    action: { kong: "正在讲学" },
    scene: "孔子据席而讲，弟子执简随录。",
    topic: "为学次第",
  },
  {
    id: "dawn-craft",
    start: H(5),
    end: H(8),
    region: "workshop",
    actors: ["mo"],
    title: "试机关",
    action: { mo: "正在试验守城机关" },
    scene: "墨子调试连弩，绳枢吱呀作响。",
  },
  {
    id: "dawn-law",
    start: H(5, 2),
    end: H(9),
    region: "hall",
    actors: ["han"],
    title: "修订法令",
    action: { han: "正在修订法令" },
    scene: "韩非以朱笔勘定条目，一字不肯苟且。",
  },
  {
    id: "daoshan-water",
    start: H(6),
    end: H(9),
    region: "daoshan",
    actors: ["laozi", "zhuang"],
    title: "山林观水",
    action: { laozi: "正在观水悟道", zhuang: "正在临流看鱼" },
    scene: "老子观水之就下，庄子笑看鱼乐。",
    topic: "道法自然",
  },
  {
    id: "nature-debate",
    start: H(8),
    end: H(11),
    region: "jixia",
    actors: ["meng", "xun"],
    title: "人性之辩",
    action: { meng: "正与荀子论人性", xun: "正与孟子论人性" },
    scene: "孟子言善端，荀子言化性，两席相对不下。",
    topic: "人性本善，还是本恶？",
  },
  {
    id: "market-round",
    start: H(9),
    end: H(11),
    region: "workshop",
    actors: ["mo", "han"],
    title: "较工与法",
    action: { mo: "正在核算工料", han: "正在核查工籍" },
    scene: "墨子算材用之费，韩非问赏罚之据。",
    topic: "治国应当重礼，还是重法？",
  },
  {
    id: "noon-rest",
    start: H(11),
    end: H(12, 2),
    region: "academy",
    actors: ["kong", "meng"],
    title: "午间进食",
    action: { kong: "正在与孟子共食", meng: "正在与孔子共食" },
    scene: "食不语，庭中日影正中。",
  },
  {
    id: "noon-water",
    start: H(11),
    end: H(13),
    region: "water",
    actors: ["zhuang", "mo"],
    title: "水畔偶遇",
    action: { zhuang: "正与墨子闲谈", mo: "正与庄子闲谈" },
    scene: "庄子笑墨子太劳，墨子答天下方急。",
    topic: "有用与无用",
  },
  {
    id: "afternoon-ritual",
    start: H(13),
    end: H(15),
    region: "academy",
    actors: ["kong", "xun"],
    title: "习礼",
    action: { kong: "正在演习礼仪", xun: "正在观礼记录" },
    scene: "揖让进退各有其节，荀子录其度数。",
    topic: "礼之为用",
  },
  {
    id: "afternoon-court",
    start: H(13),
    end: H(16),
    region: "hall",
    actors: ["han", "meng"],
    title: "议政",
    action: { han: "正在陈说法术", meng: "正在争民本" },
    scene: "韩非陈势，孟子言民为贵，堂上气氛紧绷。",
    topic: "君与民孰重？",
  },
  {
    id: "defense-drill",
    start: H(15),
    end: H(16),
    region: "workshop",
    actors: ["mo"],
    title: "守城演练",
    action: { mo: "正在布置守具" },
    scene: "墨者列于城垣，号令齐整。",
    topic: "战争是否存在正当性？",
  },
  {
    id: "great-debate",
    start: H(16),
    end: H(19),
    region: "jixia",
    actors: ["kong", "meng", "xun", "mo", "han"],
    title: "稷下百家争鸣",
    action: {
      kong: "正在主论",
      meng: "正在申说仁政",
      xun: "正在申说礼法",
      mo: "正在申说兼爱",
      han: "正在申说法度",
    },
    scene: "百家列座，鼓声一响，众说并起。",
    topic: "天下何以致治？",
  },
  {
    id: "dusk-walk",
    start: H(17),
    end: H(20),
    region: "water",
    actors: ["zhuang"],
    title: "薄暮独游",
    action: { zhuang: "正在踏影独行" },
    scene: "庄子影随水动，若不知身在何处。",
  },
  {
    id: "night-reading",
    start: H(19),
    end: H(22),
    region: "academy",
    actors: ["kong", "xun", "meng"],
    title: "夜读",
    action: { kong: "正在校书", xun: "正在著文", meng: "正在默诵" },
    scene: "灯下竹简层叠，翻动声细碎。",
  },
  {
    id: "night-law",
    start: H(20),
    end: H(23),
    region: "hall",
    actors: ["han", "mo"],
    title: "夜案",
    action: { han: "正在断疑狱", mo: "正在旁听记录" },
    scene: "韩非按律断案，墨子记其得失。",
    topic: "赏罚之信",
  },
  {
    id: "zongheng-am",
    start: H(8),
    end: H(11),
    region: "zongheng",
    actors: ["suqin", "zhangyi"],
    title: "纵横晨局",
    action: { suqin: "正在推演合纵", zhangyi: "正在推演连横" },
    scene: "苏秦布合纵之局，张仪以连横破之。",
    topic: "合纵连横孰利？",
  },
  {
    id: "mingjia-horse",
    start: H(9),
    end: H(12),
    region: "mingjia",
    actors: ["gongsun", "huishi"],
    title: "白马之辩",
    action: { gongsun: "正在持白马之辩", huishi: "正在以合同异难之" },
    scene: "公孙龙指白马立离坚白，惠施以合同异相难。",
    topic: "白马非马？",
  },
  {
    id: "plaza-suqin",
    start: H(11),
    end: H(13),
    region: "plaza",
    actors: ["suqin"],
    title: "合纵游说",
    action: { suqin: "正在广场演说" },
    scene: "苏秦立于广场，陈合纵之利，听者云集。",
    topic: "合纵连横",
  },
  {
    id: "daoshan-dao",
    start: H(13),
    end: H(16),
    region: "daoshan",
    actors: ["laozi", "zhuang"],
    title: "论道",
    action: { laozi: "正在陈道德之要", zhuang: "正在以齐物应之" },
    scene: "二人对坐论道，言简而意远。",
    topic: "道与言",
  },
  {
    id: "mingjia-name",
    start: H(14),
    end: H(17),
    region: "mingjia",
    actors: ["gongsun", "huishi"],
    title: "名实之辩",
    action: { gongsun: "正在正名责实", huishi: "正在辨同异之极" },
    scene: "二人正名责实，言辞锋出，观者如堵。",
    topic: "名与实孰先？",
  },
  {
    id: "zongheng-pm",
    start: H(14),
    end: H(17),
    region: "zongheng",
    actors: ["suqin", "zhangyi"],
    title: "再演纵横",
    action: { suqin: "正在复陈合纵", zhangyi: "正在复陈连横" },
    scene: "复布天下之局，二人各执一说。",
    topic: "王霸之术",
  },
  {
    id: "plaza-laozi",
    start: H(16),
    end: H(18),
    region: "plaza",
    actors: ["laozi"],
    title: "陈道德",
    action: { laozi: "正在广场演说" },
    scene: "老子寡言而立，偶陈道德，过客驻足。",
    topic: "道",
  },
  {
    id: "plaza-huishi",
    start: H(19),
    end: H(21),
    region: "plaza",
    actors: ["huishi"],
    title: "历物之意",
    action: { huishi: "正在广场演说" },
    scene: "惠施历数万物之理，听者或骇或笑。",
    topic: "合同异",
  },
  {
    id: "daoshan-fable",
    start: H(20),
    end: H(23),
    region: "daoshan",
    actors: ["laozi", "zhuang"],
    title: "寓言交流",
    action: { laozi: "正在以正言若反之旨应之", zhuang: "正在述寓言" },
    scene: "庄子述寓言，老子以正言若反之意应之。",
    topic: "言之与意",
  },
  {
    id: "plaza-zhangyi",
    start: H(21),
    end: H(23),
    region: "plaza",
    actors: ["zhangyi"],
    title: "连横游说",
    action: { zhangyi: "正在广场演说" },
    scene: "张仪陈连横之便，辞锋凌厉。",
    topic: "连横",
  },
  {
    id: "zou-guanxing",
    start: H(5),
    end: H(7),
    region: "guanxing",
    actors: ["zou"],
    title: "观星推德",
    action: { zou: "正在推演五德之序" },
    scene: "观星台上，邹衍仰观星象，推五行相胜之序以论时运。",
    topic: "五德终始",
  },
  {
    id: "sunwu-yanzhen",
    start: H(9),
    end: H(11),
    region: "shapan",
    actors: ["sunwu"],
    title: "沙盘演阵",
    action: { sunwu: "正在沙盘推演阵法" },
    scene: "沙盘前，孙武以旗布阵，论虚实奇正之势。",
    topic: "兵势",
  },
  {
    id: "sunwu-han-qiangbing",
    start: H(11),
    end: H(13),
    region: "shapan",
    actors: ["sunwu", "han"],
    title: "强兵之辩",
    action: { sunwu: "正与韩非论不战屈人", han: "正与孙武论富国强兵" },
    scene: "孙武言不战而屈人，韩非主富国强兵、耕战为本。",
    topic: "富国强兵",
  },
  {
    id: "sunwu-mo-zhanhe",
    start: H(13),
    end: H(15),
    region: "shapan",
    actors: ["sunwu", "mo"],
    title: "战和之辩",
    action: { sunwu: "正与墨子论慎战全胜", mo: "正与孙武陈非攻之义" },
    scene: "沙盘之侧，孙武论慎战全胜，墨子陈非攻之义。",
    topic: "战与和",
  },
  {
    id: "zou-guanxing-night",
    start: H(19),
    end: H(22),
    region: "guanxing",
    actors: ["zou"],
    title: "夜观星象",
    action: { zou: "正在夜观星象推时运" },
    scene: "入夜星盘承月，邹衍推阴阳消息之机以论当德。",
    topic: "阴阳消息",
  },
  {
    id: "dukou-ferry",
    start: H(5),
    end: H(6),
    region: "dukou",
    actors: ["laozi", "zhuang"],
    title: "大河临渡",
    action: { laozi: "正在临渡观水之就下", zhuang: "正在渡口看鱼乐" },
    scene: "老庄晨过渡口，大河奔涌，老子叹水之就下，庄子笑看渡头鱼乐。",
    topic: "上善若水",
  },
  {
    id: "chidao-travel",
    start: H(6),
    end: H(8),
    region: "chidao",
    actors: ["suqin", "zhangyi"],
    title: "驰道启程",
    action: { suqin: "正在取道驰道赴诸侯之约", zhangyi: "正在取道驰道赴秦廷之约" },
    scene: "苏秦张仪策马驰道，关隘旌旗相望，各怀纵横之策。",
    topic: "纵横游说",
  },
  {
    id: "shijing-meng",
    start: H(6),
    end: H(8),
    region: "shijing",
    actors: ["meng"],
    title: "市井言义利",
    action: { meng: "正在市井与商贾言义利" },
    scene: "孟子过市井，闻商贾论利，乃申「何必曰利，亦有仁义而已」之旨。",
    topic: "义与利",
  },
  {
    id: "zhaoxian-assembly",
    start: H(6),
    end: H(8),
    region: "zhaoxian",
    actors: ["xun", "gongsun", "sunwu"],
    title: "招贤馆集会",
    action: {
      xun: "正在招贤馆陈礼法之要",
      gongsun: "正在招贤馆持名实之辩",
      sunwu: "正在招贤馆论兵家慎战之旨",
    },
    scene: "荀子、公孙龙、孙武会于招贤馆，吕不韦居中集门客论学，三家各陈其说。",
    topic: "兼收并蓄",
  },
  {
    id: "tianshe-mo",
    start: H(16),
    end: H(18),
    region: "tianshe",
    actors: ["mo"],
    title: "过田舍问农",
    action: { mo: "正在田舍问农人以节用" },
    scene: "墨子暮至田舍，观农者之劳，问稼穑之费，申节用、养民之旨。",
    topic: "节用与民生",
  },
  // —— 四库补全之十一子（2026-10-15）：各入其家惯聚之地，日程取其学之要 ——
  {
    id: "guanzhong-qingzhong",
    start: H(8),
    end: H(10),
    region: "chidao",
    actors: ["guanzhong", "shangyang"],
    title: "驰道论轻重",
    action: { guanzhong: "正在与商鞅论轻重富国之术", shangyang: "正在与管仲论耕战之法" },
    scene: "管仲商鞅并行驰道，论富国之术——轻重九府与耕战壹赏，古今之政于焉相接。",
    topic: "富国之道",
  },
  {
    id: "wenzi-daoshan",
    start: H(7),
    end: H(9),
    region: "daoshan",
    actors: ["wenzi", "laozi"],
    title: "道山问道",
    action: { wenzi: "正在道山侍坐问道", laozi: "正在道山为文子言道德之要" },
    scene: "文子侍坐老子于道山，问道德之意，老子举水以喻——柔弱胜刚强。",
    topic: "道德之意",
  },
  {
    id: "bingjia-shapan",
    start: H(9),
    end: H(11),
    region: "shapan",
    actors: ["rangju", "wuqi", "weiliao"],
    title: "沙盘会兵家",
    action: { rangju: "正在沙盘申军礼仁本之义", wuqi: "正在沙盘论文德武备", weiliao: "正在沙盘论天官人事" },
    scene: "田穰苴、吴起、尉缭会于沙盘，各陈兵要——军礼、教戒、刑名，兵家三支并陈。",
    topic: "兵家三要",
  },
  {
    id: "mingjia-dengxi",
    start: H(10),
    end: H(12),
    region: "mingjia",
    actors: ["dengxi", "yinwen", "gongsun"],
    title: "名家演两可",
    action: { dengxi: "正在名家馆操两可之辩", yinwen: "正在名家馆检形正名", gongsun: "正在名家馆持白马之辩" },
    scene: "邓析、尹文、公孙龙会于名家馆，两可、正名、白马，名辩三代同堂。",
    topic: "名辩三代",
  },
  {
    id: "fa-shen-shen",
    start: H(14),
    end: H(16),
    region: "hall",
    actors: ["shenbuhai", "shendao", "han"],
    title: "法家论术势",
    action: { shenbuhai: "正在讲堂陈循名责实之术", shendao: "正在讲堂论势位之要", han: "正在讲堂合法术势而论之" },
    scene: "申不害、慎到、韩非会于讲堂，术、势、法三支相济，韩非集其成。",
    topic: "法术势",
  },
  {
    id: "taigong-liutao",
    start: H(15),
    end: H(17),
    region: "shapan",
    actors: ["lvwang", "huangshigong"],
    title: "韬略相承",
    action: { lvwang: "正在沙盘演文伐发机之韬", huangshigong: "正在沙盘演柔弱制刚之略" },
    scene: "太公与黄石公会于沙盘，一文伐一发机、一柔一刚，韬略二系相与印证。",
    topic: "韬与略",
  },
];

/** 五行之德，依相胜之序（土→木→金→火→水）。邹衍头顶徽与观星台顶端星色同源。 */
export const ELEMENTS = [
  { name: "土", virtue: "稼穑", color: "#c8a23a" },
  { name: "木", virtue: "曲直", color: "#4a7a5a" },
  { name: "金", virtue: "从革", color: "#d8d4c8" },
  { name: "火", virtue: "炎上", color: "#b5402a" },
  { name: "水", virtue: "润下", color: "#2a3340" },
] as const;

/** 当德：依相胜序随世界时辰轮转，8 刻一换（一日 96 刻恰转两轮余）。 */
export function currentElement(tick: number) {
  const t = ((tick % 96) + 96) % 96;
  return ELEMENTS[Math.floor(t / 8) % 5];
}

/** 人物此刻的状态，用于头顶气泡：独处为思，二人为谈，三人以上为辩 */
export type Mood = "think" | "talk" | "debate";

export type Presence = {
  scholarId: string;
  region: string;
  action: string;
  mood: Mood;
  event?: ScheduleEvent;
};

function moodOf(event?: ScheduleEvent): Mood {
  if (!event) return "think";
  if (event.actors.length >= 3) return "debate";
  if (event.actors.length === 2) return "talk";
  return "think";
}

/** 一日 96 刻 */
export const TICKS_PER_DAY = 96;

const SHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export function formatWorldTime(tick: number) {
  const t = ((tick % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY;
  const hour = Math.floor(t / 4);
  const minute = (t % 4) * 15;
  const shichen = SHICHEN[Math.floor(((hour + 1) % 24) / 2)];
  return {
    clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    shichen: `${shichen}时`,
    phase: hour < 5 ? "夜阑" : hour < 8 ? "破晓" : hour < 11 ? "上午" : hour < 13 ? "日中" : hour < 17 ? "午后" : hour < 20 ? "薄暮" : "入夜",
  };
}

function activeEvents(tick: number) {
  const t = ((tick % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY;
  return schedule.filter((e) => t >= e.start && t < e.end);
}

/** 季节与天气：随世界时间自动轮转（page 持 30s 气候时钟），影响绢色、粒子与户外人物动作。 */
export type Season = "春" | "夏" | "秋" | "冬";
export type Weather = "晴" | "阴" | "雨" | "雪" | "雾";
export type Climate = { season: Season; weather: Weather; step: number };

export const SEASONS: Season[] = ["春", "夏", "秋", "冬"];
export const INITIAL_CLIMATE: Climate = { season: "春", weather: "晴", step: 0 };

/** 各季节天气加权，顺序为 晴/阴/雨/雪/雾。该季不至者权重 0。 */
const WEATHER_WEIGHTS: Record<Season, [number, number, number, number, number]> = {
  春: [3, 4, 5, 0, 1], // 春多雨阴
  夏: [5, 2, 4, 0, 0], // 夏晴雨多
  秋: [4, 3, 1, 0, 4], // 秋晴雾多
  冬: [2, 3, 0, 4, 1], // 冬雪阴多
};
const WEATHERS: Weather[] = ["晴", "阴", "雨", "雪", "雾"];

function pickWeather(season: Season, prev: Weather): Weather {
  // 60% 沿用上一刻（黏性，免天气跳来跳去、不至频频变天）；否则按当季加权随机
  if (Math.random() < 0.6) return prev;
  const w = WEATHER_WEIGHTS[season];
  const total = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEATHERS.length; i++) {
    r -= w[i];
    if (r <= 0) return WEATHERS[i];
  }
  return "晴";
}

/** 气候时钟每步推进：step+1；每 4 步换季（≈2 分钟/季）；天气按季加权黏性重抽。 */
export function advanceClimate(c: Climate): Climate {
  const step = c.step + 1;
  const season = SEASONS[Math.floor(step / 4) % 4];
  const weather = pickWeather(season, c.weather);
  return { season, weather, step };
}

/** 户外 adverse 天气下，给动作文字加天气前缀（室内/晴阴不改）。 */
const WEATHER_PREFIX: Record<"雨" | "雪" | "雾", string> = { 雨: "冒雨", 雪: "踏雪", 雾: "雾中" };
export function climateAction(action: string, weather: Weather, region: string): string {
  if (weather === "晴" || weather === "阴") return action;
  if (isIndoor(region)) return action;
  const prefix = WEATHER_PREFIX[weather];
  return prefix ? `正在${prefix}${action.replace(/^正在/, "")}` : action;
}

/** 按当前时刻推算每位人物所处区域与动作；无日程则回到常驻地。
 *  若传入 adverse 气候（雨/雪），户外人物就近避入有顶区域并改动作；雾天仅加「雾中」前缀不迁区；
 *  天晴则自动复原（重算无气候覆盖即回原区域与原动作）。 */
export function worldStateAt(tick: number, climate?: Climate): Record<string, Presence> {
  const events = activeEvents(tick);
  const state: Record<string, Presence> = {};
  for (const s of scholars) {
    const event = events.find((e) => e.actors.includes(s.id));
    const base: Presence = event
      ? { scholarId: s.id, region: event.region, action: event.action?.[s.id] ?? `正在${event.title}`, mood: moodOf(event), event }
      : { scholarId: s.id, region: s.home, action: `正在${s.idle}`, mood: "think" };
    if (!climate) {
      state[s.id] = base;
      continue;
    }
    const w = climate.weather;
    if (w === "晴" || w === "阴") {
      state[s.id] = base;
      continue;
    }
    if (w === "雾") {
      // 雾：仅加前缀、不迁区（室内者 climateAction 原样返回）
      state[s.id] = { ...base, action: climateAction(base.action, w, base.region) };
      continue;
    }
    // 雨/雪：室内者不动；户外者就近避入有顶区域
    if (isIndoor(base.region)) {
      state[s.id] = base;
      continue;
    }
    state[s.id] = {
      scholarId: s.id,
      region: shelterOf(base.region),
      action: w === "雪" ? "正在舍中避雪" : "正在檐下避雨",
      mood: "think",
      event: undefined,
    };
  }
  return state;
}

export function eventsInRegion(tick: number, region: string) {
  return activeEvents(tick).filter((e) => e.region === region);
}

/** 该人物当日剩余日程，用于人物面板展示行程表。 */
export function agendaFor(scholarId: string) {
  return schedule
    .filter((e) => e.actors.includes(scholarId))
    .sort((a, b) => a.start - b.start);
}

/** 下一个日程；当日已过则回到当日首事。人物无任何日程时返回 undefined。 */
export function nextEventFor(scholarId: string, tick: number): ScheduleEvent | undefined {
  const t = ((tick % TICKS_PER_DAY) + TICKS_PER_DAY) % TICKS_PER_DAY;
  const own = agendaFor(scholarId);
  return own.find((e) => e.start > t) ?? own[0];
}
