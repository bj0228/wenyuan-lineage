import type { WorldId } from "./worlds";

/**
 * 母题 —— 跨世界唯一可比的那一层。
 *
 * **与 themes.ts 的 `IDEAS` 必须分清**，这是整个跨世界设计的枢纽：
 *
 *   `IDEAS` 是**命题式**的——「仁」「法」「兼爱」。它们是一家之说对世界下的判断，
 *   只在同一个思想传统内部有效。拿「兼爱」去问孙悟空，他既不赞成也不反对，
 *   因为他根本不在这套话语里；强问的结果只会是替他代拟一套墨家腔。
 *
 *   `Motif` 是**叙事式**的——「出走」「弑父」「幻灭」「天命与僭越」。它们不是判断，
 *   是处境。任何世界的人都会撞上处境：孔子周游列国是出走，悟空离花果山求道也是
 *   出走；两人对同一处境各有各的应对，这就可比了。
 *
 * 所以：**同世界之内辩论命题，跨世界之间评议母题**（见 worlds.ts）。
 *
 * `anchors` 是手工策展的——母题之所以是母题，正在于「哪一句算这个母题」需要判断，
 * 这不是检索能定的。`candidates` 是留给日后自动发现的口子：模型扫全库提出候选，
 * 标明来源，人工审过才搬进 anchors。宁可少而准，不可多而滥。
 */
export type MotifAnchor = {
  worldId: WorldId;
  /**
   * 锚点指法，二者择一：
   *  - `passageId`：手写语料（canon.ts）的 id 是稳定的，直接指。
   *  - `quote`：生成语料（xiyou-passages.ts）的 id 形如 `xy-wukong-3`，序号由抽取时的
   *    排序决定，改一次择句规则就全变。故西游锚点一律记**原句片段**，由
   *    `resolveAnchor()` 回查。策展人记得住的本来也是句子，不是 id。
   *
   * 西方那十五条（west-passages.ts）虽也是自译本里截出的，但 id 手定不随脚本动，
   * 故仍径指 `passageId`。
   */
  passageId?: string;
  quote?: string;
  /** 此句何以当得起这个母题——一句话，评议时作提示给模型 */
  note: string;
};

export type Motif = {
  id: string;
  name: string;
  /** 一句话说清这是个什么处境。2026-10-15 起不再上签面，只喂给模型作评议的立足点。 */
  hint: string;
  anchors: MotifAnchor[];
  /**
   * 扩展口：日后由模型扫全库提出的候选锚点，标来源；
   * 人工审核后转入 anchors，未审者不参与评议。
   */
  candidates?: { worldId: WorldId; passageId: string; source: "llm" | "manual"; note?: string }[];
};

/**
 * 十二母题。择取之准：**每一轴都真有话可说**。
 *
 * `hint` 自 2026-10-15 起不再显示：签面只写题名与三轴出场者。一个词摆在那里，
 * 看的人自己往里填自己的事；一行题解反倒把它说窄了。但这一行仍留着，评议时随
 * 题名一并喂给模型——那是模型的立足点，不是人的阅读负担，故仍用日常话写，别端着。
 * 锚点的 `note` 是另一回事：那是说「此句何以当得起这个母题」，要贴着原文的口吻。
 * 像「科举」这样只战国没有、「成佛」这样只西游有的，不立为母题——
 * 一头空着的母题，评议就成了单口。
 *
 * 2026-10-15 补第三轴（世界文学）的十五条锚点：十二母题皆已三轴俱全。
 * 先前西方七人只能到席而无句可凭，与另两轴不对等——评议时他们只好凭印象说话，
 * 而另两边句句有出处。现在三轴各有原文，同一处境三种解法摆在一处才算成立。
 */
export const MOTIFS: Motif[] = [
  {
    id: "chuzou",
    name: "出走",
    hint: "离开家，去找一件自己也说不清的东西。为什么非走不可，走的人往往答不上来。",
    anchors: [
      { worldId: "zhanguo", passageId: "lunyu-jishi", note: "周游十四年而不得用，仍以文德自任——出走者不肯认此路为错。" },
      { worldId: "xiyou", quote: "拜他为师", note: "石猴渡海求道，所求者长生，实则是不甘在花果山终老。" },
      { worldId: "west", passageId: "w-faust-chuzou", note: "四门学问读到尽头，才动身：浮士德的出走不是没路可走，是路都走完了还不算知道。" },
    ],
  },
  {
    id: "tianming",
    name: "天命与僭越",
    hint: "你的位置是生下来就定了，还是可以争？认了的安分过日子，不认的迟早要反。",
    anchors: [
      { worldId: "zhanguo", passageId: "xunzi-tianlun", note: "天行有常，不为尧存——天不干预人事，故位非天予。" },
      { worldId: "zhanguo", passageId: "mengzi-jinxin-14", note: "民贵君轻——君位既可轻，便有了可易之理。" },
      { worldId: "xiyou", quote: "皇帝轮流做", note: "「皇帝轮流做」：不辩天命之有无，直接要换人坐。" },
      { worldId: "west", passageId: "w-hamlet-tianming", note: "时代颠倒，而扳正它的差事落在一个不想接的人身上——认命与僭越在他身上是一件事。" },
      { worldId: "west", passageId: "w-tianyan-zhengtian", note: "与天争胜：天不可独任，要以人力把住天。严复译此语时，正是要换一个民族的命。" },
    ],
  },
  {
    id: "mingshi",
    name: "名与实",
    hint: "一个名号管不管得住底下那个东西。名字叫错了，事情就全乱了。",
    anchors: [
      { worldId: "zhanguo", passageId: "lunyu-zilu-3", note: "名不正则言不顺——名是秩序的起点。" },
      { worldId: "xiyou", quote: "齐天大圣", note: "以「弼马温」「齐天大圣」羁縻大圣：天庭治世之术，全在给名。" },
      { worldId: "west", passageId: "w-quixote-mingshi", note: "替一个不知情的村姑造一个公主的名号——名一立，实便得照着名走。" },
    ],
  },
  {
    id: "zhenjia",
    name: "真与假",
    hint: "分不清真假的时候，拿什么来判断？光靠眼睛显然不够。",
    anchors: [
      { worldId: "zhanguo", passageId: "zhuangzi-qiwu", note: "是非各执一端而无穷——真假本就不可定。" },
      { worldId: "xiyou", quote: "全无一点慈悲好善之心", note: "肉眼凡胎识不破白骨三变——分不清不是蠢，是器官的限度。" },
      { worldId: "west", passageId: "w-zhongxia-zhenjia", note: "醒来才知爱过的是头驴。醒了算假，可当时那份真也不是演的。" },
      { worldId: "west", passageId: "w-quixote-zhenjia", note: "同一座客店，别人看是客店，他看是城堡——所见不同，不全是眼睛的事。" },
    ],
  },
  {
    id: "shitu",
    name: "师徒",
    hint: "教的人和学的人之间到底算什么：传本事，管着你，还是互相成全。",
    anchors: [
      { worldId: "zhanguo", passageId: "lunyu-shuer-shuxiu", note: "束脩以上皆诲——师徒之始在一点微礼，不在身份。" },
      { worldId: "xiyou", quote: "保唐僧", note: "紧箍咒之下的师徒：管束先于传授，却终成全。" },
      { worldId: "west", passageId: "w-odyssey-shitu", note: "门托耳受人之托看顾人家的儿子——西文「导师」一词即自此人得名：师之始在受托，不在学问。" },
    ],
  },
  {
    id: "guixiang",
    name: "归途",
    hint: "走到头之后回哪儿去。拿到手的东西，常常不是出发时想要的那个。",
    anchors: [
      { worldId: "zhanguo", passageId: "zhuangzi-qiuwu", note: "濠梁观鱼：不问归处，当下即是。" },
      { worldId: "xiyou", quote: "本乡", note: "「宁恋本乡一捻土」——西行一路，心里始终朝东。" },
      { worldId: "west", passageId: "w-odyssey-guixiang", note: "独目巨人的诅咒不是不许他回家，是准他回家：迟归、孑然、到家仍不得安。" },
    ],
  },
  {
    id: "xisheng",
    name: "牺牲",
    hint: "为了一件更大的事，把自己或者别人搭进去。值不值，谁说了算。",
    anchors: [
      { worldId: "zhanguo", passageId: "mozi-feigong", note: "杀一人不义，攻国杀万人反无人非——牺牲的账从来算不平。" },
      { worldId: "xiyou", quote: "善念", note: "一路之难多是安排：度人者先设局，局中人以身受之。" },
      { worldId: "west", passageId: "w-chahua-xisheng", note: "退出那段情是为成全他；成全之后病中无人可托——牺牲者多半等不到被认领。" },
    ],
  },
  {
    id: "guixun",
    name: "规训与自由",
    hint: "别人加给你的约束，是在帮你还是在害你。那个箍是硬戴上的，还是自己长出来的。",
    anchors: [
      { worldId: "zhanguo", passageId: "xunzi-lilun", note: "礼起于欲而无度量分界则争——约束是为免争，非为驯人。" },
      { worldId: "zhanguo", passageId: "zhuangzi-qiwu", note: "齐物之下无可规训者，是非本不定。" },
      { worldId: "xiyou", quote: "紧箍", note: "紧箍：唯一能制大圣的，不是法力，是一句咒。" },
      { worldId: "west", passageId: "w-tianyan-guixun", note: "自营是人之所以胜万物，也是人之所以相残：同一件东西，前半是本钱，后半是祸根。" },
    ],
  },
  {
    id: "yuwang",
    name: "欲与节",
    hint: "想要的东西该不该给自己，给到什么程度算够。",
    anchors: [
      { worldId: "zhanguo", passageId: "mozi-jieyong", note: "去无用之费——节的理由是利，不是德。" },
      { worldId: "xiyou", quote: "散火", note: "八戒之贪不掩其真：他说的退意，是全队最诚实的一句。" },
      { worldId: "west", passageId: "w-faust-yuwang", note: "赌约只一条：哪一刻他肯说「停一停」，哪一刻他就输了自己——节即是死。" },
    ],
  },
  {
    id: "wutuobang",
    name: "乌托邦",
    hint: "好世界应该是什么样子。说得越具体，越显得不可能。",
    anchors: [
      { worldId: "zhanguo", passageId: "mozi-jianai", note: "视人之国若其国——兼爱是最早的一张蓝图。" },
      { worldId: "xiyou", quote: "水帘洞", note: "花果山水帘洞：不耕不税不受天管，一个猴子的桃源。" },
      { worldId: "west", passageId: "w-tianyan-wutuobang", note: "好世界不从章程来，从民力、民智、民德三样根上来——严复对蓝图的回答是先问根。" },
      { worldId: "west", passageId: "w-yuejie-wutuobang", note: "福地、乐园，遍觅尘球竟成幻想——鲁迅译此书时，把乌托邦交给了科学。" },
    ],
  },
  {
    id: "huanmie",
    name: "幻灭",
    hint: "追了半天拿到手，才发现根本不是那么回事。",
    anchors: [
      { worldId: "zhanguo", passageId: "lunyu-weilinggong", note: "己所不欲勿施于人——最低的一条，也最难行。" },
      { worldId: "xiyou", quote: "真经", note: "无字真经：取到了，才知道还要人事。" },
      { worldId: "west", passageId: "w-quixote-huanmie", note: "临终把名号退回去：我不是堂吉诃德，我是阿隆索·吉哈诺——醒悟与死同时到。" },
    ],
  },
  {
    id: "jueyi",
    name: "结义与绝交",
    hint: "交情能不能撑过利益冲突的那一天。",
    anchors: [
      { worldId: "zhanguo", passageId: "mengzi-lianghui-1", note: "王何必曰利——义利一分，交情便有了裂缝。" },
      { worldId: "xiyou", quote: "害子之情", note: "七大圣结义在前，火焰山相搏在后：旧情不敌子仇。" },
      { worldId: "west", passageId: "w-hamlet-jueyi", note: "王子不受「仆人」这个称呼：我同你以朋友相称——结义有时只是拒绝一个名分。" },
    ],
  },
];

export const motifMap: Record<string, Motif> = Object.fromEntries(MOTIFS.map((m) => [m.id, m]));

/** 某母题在某世界的锚点。一头为空者，评议时该世界不出场。 */
export function anchorsIn(motif: Motif, worldId: WorldId): MotifAnchor[] {
  return motif.anchors.filter((a) => a.worldId === worldId);
}

/** 此母题涉及的世界，按 anchors 实际所有。 */
export function worldsOf(motif: Motif): WorldId[] {
  return [...new Set(motif.anchors.map((a) => a.worldId))];
}
