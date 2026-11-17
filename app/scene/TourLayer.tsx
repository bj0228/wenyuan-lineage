"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useT } from "../i18n/lang";
import { XMEDIA_ON } from "../world/feature-flags";
import type { TourChapter } from "../world/tour";

/**
 * 新手导览：在真实功能元件上挂气泡指引，首次进入自动开讲。
 *
 * 不复制一套假界面，而是按 CSS 选择器量**真实 DOM** 的位置来定位气泡与高亮圈，
 * 故界面改版后气泡自动跟着跑，不会指到空处。
 *
 * 几处重功能（辩论、典籍检索、图谱）只「指着说」说不明白，故做成**实演**：
 * 导览替用户把辩论台开起来、把检索词填进去、把图谱点开，让他眼见其运作；
 * 这类步骤把 `act` 声明为动作，并以 `hole` 让高亮框内可点，用户能当场自己试。
 *
 * 一个系统，五册导览。系统不是五个并列的页面，而是**一底四叠**：罗盘是底，
 * 四库、长卷、世文、母题、影音都是浮在其上的全屏层（见 page.tsx 的 curWorld 顶注）。
 * 故导览不做一条长路，而作五册独立的章，各在自己那一层在场时才开：
 *
 *   一 · 四库        sikuOpen
 *   二 · 先秦诸子    curWorld === "zhanguo"（原来那 18 步）
 *   三 · 西游        curWorld === "xiyou"
 *   四 · 西方        wlOpen
 *   五 · 跨世界三块  curWorld === "compass"、且前四册见过（收束章）
 *
 * 一屏只讲一册。量框、定位、遮罩分片、实演、键盘、零面积跳过，全是层的本事，与章无关。
 *
 * 三件麻烦事各有处置：
 *   1. 侧栏功能分散在四个页签 —— 步骤声明 panel，开讲前先请 page 切过去；
 *   2. 侧栏面板内部可滚 —— 量之前先 scrollIntoView，等滚动落定再量；
 *   3. 窄屏下顶栏信息／世界纪事被 display:none —— 量到零面积即按当前方向自动跳过该步。
 */

export type TourPanel = "profile" | "debate" | "canon" | "yulu";

/**
 * 四库内部那几层的意图：部 / 类 / 检索词 / 开哪部书 / 退回总目。
 *
 * 四库的 group、category、entry 都是 `SikuLayer` 自己的 useState，page 够不着，
 * 故照辩论台 `preset` 的老路数：由外面递进一个「该切成什么样」的意图，
 * 层内按 `n` 认新帖（同一帖重复递不会重放）。
 *
 * 一帖须自足：同一刻只认一帖（后递的盖掉先递的），故「取某部之某类」这种
 * 要动两处状态的，必须写成一帖、不能先递部再递类——倒着走时正要这么复位。
 */
export type SikuAskBody =
  | { kind: "reset" }
  | { kind: "group"; group: string }
  | { kind: "category"; group?: string; category: string }
  | { kind: "query"; query: string }
  | { kind: "book"; bookId: string };
export type SikuAsk = SikuAskBody & { n: number };

/** 世文那一层的同一种意图：开哪部书（可一并指定摊哪一面）/ 换面 / 退回书架 */
export type WlAskBody =
  | { kind: "shelf" }
  | { kind: "book"; bookId: string; lang?: "zh" | "en" | "both" }
  | { kind: "lang"; lang: "zh" | "en" | "both" };
export type WlAsk = WlAskBody & { n: number };

/** 导览可请求 page 执行的实演动作 */
export type TourAct =
  | { kind: "openDebate" } // 开辩论台并预置辩题与席位
  | { kind: "startDebate" } // 替用户击鼓开辩，圆桌自行走起来
  | { kind: "closeDebate" }
  | { kind: "canonQuery" } // 往典籍检索框填入示例议题
  | { kind: "clearCanon" }
  | { kind: "openGraph" }
  | { kind: "closeGraph" }
  | { kind: "openSiku" }
  | { kind: "closeSiku" }
  | { kind: "siku"; ask: SikuAskBody }
  | { kind: "openWorldLit" }
  | { kind: "closeWorldLit" }
  | { kind: "wl"; ask: WlAskBody }
  | { kind: "openScroll" }
  | { kind: "closeScroll" }
  | { kind: "openMotif" }
  | { kind: "closeMotif" }
  | { kind: "openMedia" }
  | { kind: "closeMedia" }
  | { kind: "enter"; world: "zhanguo" | "xiyou" | "west" };

type Place = "top" | "bottom" | "left" | "right" | "inside";

type Step = {
  id: string;
  title: string;
  body: string;
  /** 高亮目标选择器；命中多个时取并集框（如顶栏三枚按钮算一处） */
  target?: string;
  /** 本步需要侧栏切到哪个页签 */
  panel?: TourPanel;
  /** 气泡优先摆放方向；inside = 浮在目标框内居中（用于占满半屏的地图） */
  place?: Place;
  /** 进入本步时请 page 实演的动作；可给一串，按序执行（如先收辩论台再开图谱） */
  act?: TourAct | TourAct[];
  /**
   * 自后一步倒回本步时，先执行的收场动作。
   *
   * 实演的动作是单向的：往前走「开四库」，往后退可没人替他关。不收掉后一步开出来的
   * 那一层，气泡就会在那一层上照着本步的坐标画框——看着像「点上一步界面不动，只换了个框」。
   * 故凡后一步会新开一层的，本步都要在此声明怎么退回来；本步自己的 `act` 随后照常重放
   * （那些 act 都是「把界面切成某样」的意图，重放即复位）。
   */
  back?: TourAct | TourAct[];
  /** 高亮框内留孔可点：实演步骤让用户当场自己操作 */
  hole?: boolean;
  /**
   * 留孔步骤里用户自己动了手的凭据：此选择器一出现便自行进下一步。
   *
   * 「可直接操作」的步子若只认「下一步」那一下，用户照着话点了真元件反倒没反应——
   * 界面已经换了，气泡还停在原处讲上一句。故给一个凭据：它出现即视作他已办到，
   * 下一步的 `act` 便不再重演一遍（免得刚开好的层又被重挂一次）。
   */
  advanceOn?: string;
  /** 目标尚未出现时最多等多少帧（实演要等浮层挂载、LLM 出字） */
  wait?: number;
};

/** 册二 · 先秦诸子：原来那 18 步，一字未改（只末步的入口字样随册目改了） */
const ZHANGUO: Step[] = [
  {
    id: "welcome",
    title: "初入天下",
    body: "这是一片贴近历史的先秦世界：十六处地界、二十一位诸子各依行程往来问学。",
  },
  {
    id: "map",
    target: ".scene",
    place: "inside",
    hole: true,
    title: "世界地图",
    body: "拖动旋转视角，滚轮远近缩放。点人物即选中他，点空地则令选中之人前往该处——两个相邻的人可以产生对话。",
  },
  {
    id: "clock",
    target: ".world-status, .sound-btn",
    place: "bottom",
    title: "时辰自行流转",
    body: "时辰、节气、天色随机变化，诸子按各自行程移位办事。按右侧 ❙❙ 可暂停世界，细看变化。",
  },
  {
    id: "bulletin",
    target: ".bulletin-board",
    place: "right",
    title: "每日一道游学题",
    body: "吕公招贤榜每个世界日换一题。领题 → 寻对应诸子问学 → 回禀作答，答对得印章一枚。累积多个印章可以解锁不同称号。",
  },
  {
    id: "worldlog",
    target: ".world-log",
    place: "left",
    title: "世界纪事",
    body: "人物动线和行程将滚动记录在此。",
  },
  {
    id: "tabs",
    target: ".tabs",
    place: "bottom",
    title: "主操作台",
    body: "人物看其生平行程并与之交谈，辩论席摆圆桌开辩，典籍查原文出处，语录存你收录的妙语。",
  },
  {
    id: "strip",
    panel: "profile",
    target: ".scholar-strip",
    place: "bottom",
    hole: true,
    title: "诸子名录",
    body: "横向滑动选择不同的人物。被选中者的生平、此刻所为、今日行程与典籍依据，都会显示在下方。",
  },
  {
    id: "talk",
    panel: "profile",
    target: ".profile-panel .actions",
    place: "top",
    title: "与他交谈",
    body: "答语由其本家典籍原文检索生成，引文都标出处。谈话中右键诸子的发言，可译成白话。",
  },
  {
    id: "roster",
    panel: "profile",
    target: ".roster",
    place: "top",
    title: "附近的人",
    body: "这里列出此人附近的人物。点一位即可令两人对谈；两人以上在侧，便能就地发起一场争鸣。",
  },

  // —— 实演一：多人辩论，真开一场 ——
  {
    id: "debate-intro",
    panel: "debate",
    target: ".debate-panel .debate-start",
    place: "bottom",
    // 自入席一步倒回来：辩论台是全屏浮层，不收掉它，侧栏这一钮便在它底下
    back: { kind: "closeDebate" },
    title: "百家争鸣",
    body: "可选择不同的人物与辩题开始百家争鸣，点击“下一步”",
  },
  {
    id: "debate-setup",
    act: { kind: "openDebate" },
    target: ".debate-setup .seat-list",
    place: "left",
    wait: 150,
    title: "入席：择人与定题",
    body: "已为你预置辩题「天下何以致治？」，并请孔子、墨子、韩非三人入席——儒、墨、法三家对同一问题答法迥异，最见锋芒。席位最多四人，「客」即你自己，入席便能亲自陈词。",
  },
  {
    id: "debate-run",
    act: { kind: "startDebate" },
    target: ".debate-arena, .debate-stage",
    place: "inside",
    hole: true,
    wait: 300,
    title: "击鼓开辩",
    body: "四轮依次推进：陈述 · 反驳 · 质询 · 总结；诸子围坐，当下这位正在作答——答语皆自其本家典籍检出、引文标明出处。右键任一段发言可译为白话。",
  },
  {
    id: "debate-advance",
    target: ".debate-arena .debate-controls, .debate-stage .debate-controls",
    place: "top",
    hole: true,
    wait: 300,
    // 自图谱一步倒回来：那一步把辩论台收了，此处须重开一台并自行击鼓，否则无台可指
    back: [{ kind: "openDebate" }, { kind: "startDebate" }],
    title: "点「继续」请下一位",
    body: "每位说完点一下，便进下一人。一轮末可插话，影响下一轮诸子所答；辩毕有观点关系图与胜负评断，还能把这场藏入竹简。了解流程后请点「下一步」",
  },

  // —— 实演三：典籍图谱，真点开 ——
  {
    id: "graph",
    // 辩论台是全屏浮层，不收掉它，后面指向侧栏的气泡会被它盖住
    act: [{ kind: "closeDebate" }, { kind: "clearCanon" }],
    panel: "canon",
    target: ".kg-thumb",
    place: "top",
    // 自环图一步倒回来：图谱也是全屏浮层，须先收掉
    back: { kind: "closeGraph" },
    title: "典籍图谱",
    body: "十六部典籍与诸概念如何牵连，一图尽览。这就点开进去看——点「下一步」。",
  },
  {
    id: "graph-in",
    act: { kind: "openGraph" },
    target: ".kg-graph-wrap, .kg-svg",
    place: "inside",
    hole: true,
    wait: 150,
    title: "环图：顺藤看百家牵连",
    body: "人物的师承渊源、典籍的注解征引、思想的承变对立，十种关系按色分线。点任一节点看详情，可顺藤跳焦点；顶部按类隐显，也可按辩题检索。试着点一个节点。",
  },

  {
    id: "lineage",
    act: { kind: "closeGraph" },
    target: ".lineage-btn",
    place: "bottom",
    title: "脉络 · 母题",
    body: "「百家脉络」看学派源流演变；「母题」把诸子与别世界的人物放到同一处境下，各出其解。",
  },
  {
    id: "user",
    target: ".user-btn",
    place: "bottom",
    title: "游学档案",
    body: "印章、称号、与各位诸子的交情深浅都记在此处。交情愈厚会影响诸子与你的对话态度。",
  },
  {
    id: "done",
    title: "本册讲完",
    body: "导览共五册：四库、诸子、西游、西方、跨世界三块，走到哪一层讲哪一册。想重看，回进门那一屏，点题名旁那枚圆钮「导」，一册一行，可单着重看。",  },
];

/** 册一 · 四库：六步。目录是异步载入的，前几步 wait 放长，宁可不出现也不指空框 */
const SIKU: Step[] = [
  // ── 头四步在盘面上讲：进门第一屏得先说清这是整个系统。故不自四库门楼起讲，
  //    而自「左边一盘、右边一图、上头三枚签牌」起讲，讲完了才推门入四库。
  {
    id: "world",
    title: "一 · 四库全书",
    body: XMEDIA_ON
      ? "进门这一屏就是整个系统的一幅总图：左边一盘四库——经史子集四部，各领一个世界；右边一图海图——外国经典不入四部，另立一轴，从水路去；上头三枚签牌，是横贯这套系统的三条路：库、题、媒。先认这三处，再推门入四库。"
      : "进门这一屏就是整个系统的一幅总图：左边一盘四库——经史子集四部，各领一个世界；右边一图海图——外国经典不入四部，另立一轴，从水路去；上头的签牌，是横贯这套系统的几条路：库与题。先认这几处，再推门入四库。",
  },
  {
    id: "dial",
    target: ".cp-dial",
    place: "right",
    wait: 60,
    title: "左：四库全书罗盘",
    body: "盘心是四库总目，四隅经、史、子、集各领一个世界——战国的诸子、西游的一路，都由这一盘进去。盘外一圈二十四山、内环八卦，是罗盘的样子；盘下一行据脚，鼠标停到盘上何处，便说何处是什么。",
  },
  {
    id: "sea",
    target: ".cp-sea",
    place: "left",
    wait: 60,
    title: "右：世界文学八港",
    body: "海图以八部已策展的世界文学作航路入口：帆船循红虚线驶去，泊下一港即开其书；右下角的全库书架另收已经接入正文的西方典籍。中土之书走陆路入四库，西书走水路入海图，故这一轴与四库并列，不是四库的一角。",
  },
  {
    id: "links",
    target: ".cp-top-links",
    place: "bottom",
    wait: 60,
    title: XMEDIA_ON ? "上：三枚签牌" : "上：签牌",
    body: XMEDIA_ON
      ? "库——文明长卷，看四库书与书的牵连，也看中西典籍的同期对照；题——跨世界评议，同一处境诸世界各出其解；媒——跨媒介点评，影音按部铺开。这三块不在任何一世界之内，横着走过去看，是这套系统的第三条路（册五细讲）。"
      : "库——文明长卷，看四库书与书的牵连，也看中西典籍的同期对照；题——跨世界评议，同一处境诸世界各出其解。这两块不在任何一世界之内，横着走过去看（册五细讲）。",
  },
  {
    id: "hub",
    target: ".ln-hub",
    place: "right",
    hole: true,
    // 自门楼倒回盘面：四库还浮着，盘心便在它底下，须先收掉
    back: { kind: "closeSiku" },
    // 他照着话自己点了盘心，四库的门楼一出现即进下一步（下一步便不再重开一次）
    advanceOn: ".sk-groups",
    title: "盘心即四库之门",
    body: "盘心这一处写着「四库」，点它便入四库总目：经史子集四部由此进。也可以直接点「下一步」，由我替你推门。",
  },
  // ── 以下才是四库那一层里面 ──
  {
    id: "enter",
    act: { kind: "openSiku" },
    target: ".sk-groups",
    place: "bottom",
    wait: 120,
    title: "四部门楼",
    body: "一千零一十九部著录、一千零二部可读全文，都在四道门里。经、史、子、集各是一座门楼，门色即部色——经绿、史红、子青、集墨，此色一路贯到函套与书脊。悬停时两扉自中缝微启，推门进去便是那一部的类与书。",
  },
  {
    id: "hans",
    // 子部·道家收着庄子，末步要开的那部书正从这里往下走，路数最顺
    act: { kind: "siku", ask: { kind: "group", group: "子" } },
    target: ".sk-han",
    place: "bottom",
    wait: 60,
    title: "函套：部下面是类",
    body: "已替你推开子部之门。一眼看去，一部之下又分类目，每一格是一座函套：函签竖书类名，右口露出的几枚书脊是「这一函装了多少部」的约略，不作精确刻度。",
  },
  {
    id: "vols",
    // 带上部：自检索一步倒回来时部已被清，只递类便落不到书架上
    act: { kind: "siku", ask: { kind: "category", group: "子", category: "道家" } },
    target: ".sk-vol",
    place: "bottom",
    wait: 80,
    title: "立书：函里一部部的书",
    body: "已替你抽出道家这一函。书立着排，书脊竖题书名与著者，与函签同一笔意。可读全文者自带书影；存目者只见著录，点是点不开的。",
  },
  {
    id: "search",
    act: { kind: "siku", ask: { kind: "query", query: "鼓盆" } },
    target: ".sk-search",
    place: "bottom",
    wait: 90,
    title: "检索：一路查到底",
    body: "已替你打入「鼓盆」二字。检索分四路并出：其人、其书、其卷、其文——打一个人名，先出其人，其人之下再系其书；打一段文，直落到那本书那一卷那一段原文。四库最要紧的一件便是这里。",
  },
  {
    id: "reader",
    act: { kind: "siku", ask: { kind: "book", bookId: "zhuangzi" } },
    target: ".sk-reader",
    place: "left",
    wait: 150,
    title: "翻开一章：原文一字不改",
    body: "已替你翻开《庄子》。左栏是卷目，中栏是原文，右边是边批栏——读时拖选一句即落批，诸子与后世读者都可来批。原文永不改写、不替换：英文版另附一栏今译，书上的字照旧。",
  },
];

/** 册三 · 西游：五步，只指着说，不实演（换一处动三维场景与取经进度，实演代价大、回报小） */
const XIYOU: Step[] = [
  {
    id: "intro",
    title: "三 · 西游",
    body: "此处另成一图：取经路十八处，界外五处是悟空前史。与诸子那屏不同，这一屏讲的是「行到何处」，不是「何人何言」。",
  },
  {
    id: "scene",
    target: ".xy-scene",
    place: "inside",
    hole: true,
    title: "路与图",
    body: "拖转视角看这一片山河，滚轮远近。路线上每一处标着章回：点一处即到一处，三维场景随之处处不同。",
  },
  {
    id: "here",
    target: ".xy-here-card",
    place: "left",
    title: "此处",
    body: "这一格说清脚下：此回何难、今日谁在侧、此处一句原书的话，末了是这一处的试炼。点右上一点可翻回前史，看师徒相遇之前的事。",
  },
  {
    id: "route",
    target: ".xy-route-bar",
    place: "top",
    title: "路条：往西，或回前史",
    body: "路条管次序：在西行路上按「下一处」即往西去；走入界外诸处，路条改走「前史」的次第，不再按取经路排。",
  },
  {
    id: "parley",
    target: ".xy-parley-btn",
    place: "left",
    title: "聚义评议",
    body: "此处几个人同席，各依自家天性出一句，评议这一难。与诸子的圆桌辩论同一路数，只是席上坐的是取经人、妖与神。",
  },
];

/** 册四 · 西方：六步，从架面到书页再到影音 */
const WESTLIT: Step[] = [
  {
    id: "intro",
    title: "四 · 西方",
    body: "外国经典不入四库，另立一轴。海图八港是精选导览，全库书架则收入所有已经接入正文的西方典籍；有可靠旧译者可切换中英两卷，其余先提供可追溯的英文公版正文。",
  },
  {
    id: "shelf",
    target: ".sk-grid",
    place: "bottom",
    wait: 90,
    // 自开书一步倒回来：书还摊着，架面不在场，先退回架上
    back: { kind: "wl", ask: { kind: "shelf" } },
    title: "书架",
    body: "每一部标着著者、年代与两卷章数。中译在前、原书在后；两卷章数不等者（如《茶花女》）只可择一面读，章目对齐者（如《哈姆莱特》）才摊得开对照面。",
  },
  {
    id: "pick",
    // 带上「摊中译这一面」：自对照一步倒回来时，面也要跟着退回来
    act: { kind: "wl", ask: { kind: "book", bookId: "hamlet", lang: "zh" } },
    target: ".sk-reader",
    place: "left",
    wait: 150,
    title: "点开一部",
    body: "已替你翻开《哈姆莱特》。西式排印与四库的线装书刻意不同：双细线框、章首大字母下沉、章目居左。这一部的章目按场切齐，故下一步能摊开中英对照。",
  },
  {
    id: "lang",
    act: { kind: "wl", ask: { kind: "lang", lang: "both" } },
    target: ".wl-lang",
    place: "right",
    wait: 60,
    title: "中译 · 原书 · 对照",
    body: "已替你切到对照面：左中文、右英文，一页两栏同进退。这三层的分别正在于此——原文不替换，译与注另立一面；读书时哪一面都看得见，不是选一个换掉另一个。",
  },
  {
    id: "margin",
    target: ".sk-margin",
    place: "left",
    title: "边批",
    body: "与四库边批同一套账：拖选一句即落批。诸子可批西书，西贤亦可来批——庄子批一句《堂吉诃德》，与塞万提斯自家来批，各是一种读法。",
  },
  ...(XMEDIA_ON ? [{
    id: "media",
    target: ".wl-media",
    place: "top",
    title: "后世影音",
    body: "这一部的演绎挂在这里：戏、片、动画，点一条入点评席，由诸位人物对着那一幕各说一句。书读到哪里，影音跟到哪本书。",
  } as Step] : []),
];

/** 册五 · 跨世界三块：在罗盘上开。末三步各开一层，须由下一步收起。
 *  影音一步与签牌上的「媒」字随 XMEDIA_ON 暂藏（feature-flags）：藏时不讲影音，
 *  末步改到母题收尾。开回 true 即原四步复见。 */
const CROSSWORLD: Step[] = [
  {
    id: "links",
    target: ".cp-top-links",
    place: "bottom",
    title: "三枚签牌",
    body: XMEDIA_ON
      ? "朱砂印一字，牌上大字是去处、小字是这去处做什么：库——文明长卷，看四库文脉与中西同期对照；题——跨世界评议，同一处境诸世界各出其解；媒——跨媒介点评，影音按部铺开。"
      : "朱砂印一字，牌上大字是去处、小字是这去处做什么：库——文明长卷，看四库文脉与中西同期对照；题——跨世界评议，同一处境诸世界各出其解。",
  },
  {
    id: "scroll",
    act: [{ kind: "closeSiku" }, { kind: "openScroll" }],
    target: ".sk-scroll-lanes",
    place: "right",
    wait: 120,
    back: { kind: "closeMotif" },
    title: "文明长卷：文脉与中西同期对照",
    body: "已替你展开长卷。各代的书沿朝代排开，书的牵连以线相连，关系按色分七型：传注、承学、取材、非难、并称、相续、依托——七型不重，各管一件传过去的东西（解释、学说、文与事、争、并举、断限、名）。横着读一部书在历代的去处，与竖着读一本书的正文，是两种看法。",
  },
  {
    id: "motif",
    act: [{ kind: "closeScroll" }, { kind: "openMotif" }],
    target: ".mo-grid",
    place: "bottom",
    wait: 120,
    back: { kind: "closeMedia" },
    title: "跨世界评议：同一处境",
    body: XMEDIA_ON
      ? "已替你换到母题一屏。十二个母题——生死、义利、家国……把诸子与别世界的人物放到同一处境下，各出其解。这是系统里唯一一处让不同世界正面相遇的地方。"
      : "已替你换到母题一屏。十二个母题——生死、义利、家国……把诸子与别世界的人物放到同一处境下，各出其解。这是系统里唯一一处让不同世界正面相遇的地方。五册到此讲完——想重看哪一册，回进门那一屏，点题名旁那枚圆钮「导」。",
  },
  // XMEDIA_ON 开回时恢复原先的影音一步（类型注记稳住字面量宽度）
  ...(XMEDIA_ON ? [{
    id: "media",
    act: [{ kind: "closeMotif" }, { kind: "openMedia" }] as Step["act"],
    target: ".xm-cols",
    place: "top" as Place,
    wait: 120,
    title: "跨媒介点评：影音按部铺开",
    body: "已替你换到影音一屏。四库四部与西方两行铺开，点一条入点评席。五册到此讲完——想重看哪一册，回进门那一屏，点它题名旁那枚圆钮「导」。",
  } as Step] : []),
];

/** 册一自门楼一步起讲时的起点：四库已开着（盘面不在场），头几步讲不了 */
export const SIKU_FROM_GATES = SIKU.findIndex((s) => s.target === ".sk-groups");

const CHAPTERS: Record<TourChapter, { title: string; steps: Step[] }> = {
  siku: { title: "册一 · 四库全书", steps: SIKU },
  zhanguo: { title: "册二 · 先秦诸子", steps: ZHANGUO },
  xiyou: { title: "册三 · 西游", steps: XIYOU },
  westlit: { title: "册四 · 西方", steps: WESTLIT },
  crossworld: { title: XMEDIA_ON ? "册五 · 跨世界三块" : "册五 · 跨世界", steps: CROSSWORLD },
};

/** 导览只说“这里能做什么、下一步怎么做”，背景解释留在功能页内。 */
const SHORT_COPY: Partial<Record<TourChapter, Record<string, { title?: string; body: string }>>> = {
  zhanguo: {
    welcome: { title: "先秦人物世界", body: "二十一位诸子会依各自行程，在十六处地点往来问学。" },
    map: { title: "地图", body: "拖动旋转，滚轮缩放；点人物选择，点地点让他前往。" },
    clock: { title: "时间", body: "时辰与天色持续变化，人物按行程活动；右侧按钮可暂停。" },
    bulletin: { title: "游学题", body: "领题、访人、回禀；答对即可获得印章。" },
    worldlog: { title: "世界纪事", body: "这里记录人物的移动与活动。" },
    tabs: { title: "操作台", body: "从这里切换人物、辩论、典籍与语录。" },
    strip: { title: "人物名录", body: "滑动选择人物，下方显示他的资料与典籍依据。" },
    talk: { title: "交谈", body: "向人物提问；回答会标出引用，古文可切换白话。" },
    roster: { title: "附近人物", body: "选择邻近人物，让他们对谈或加入争鸣。" },
    "debate-intro": { title: "百家争鸣", body: "把不同人物请到同一议题中，观察立场如何交锋。" },
    "debate-setup": { title: "定题入席", body: "选择人物并输入辩题，也可以使用推荐题目。" },
    "debate-run": { title: "开始辩论", body: "击鼓后人物依次发言，观点会保留各自知识边界。" },
    "debate-advance": { title: "继续", body: "点“继续”邀请下一位回应上一轮观点。" },
    graph: { title: "典籍图谱", body: "从人物与典籍进入关系图，查看思想与文本的联系。" },
    "graph-in": { title: "沿关系探索", body: "点任一节点，以它为中心继续展开。" },
    lineage: { title: "文脉与母题", body: "这里汇集人物的学脉、影响与核心议题。" },
    user: { title: "游学档案", body: "你的印章、称号和探索记录保存在这里。" },
    done: { title: "完成", body: "先秦世界已介绍完毕，接下来可以自由探索。" },
  },
  siku: {
    world: { title: "四库与世界", body: "左侧进入四库，右侧进入西方典籍，上方连接跨文化功能。" },
    dial: { title: "四库罗盘", body: "点经、史、子、集进入对应门类。" },
    sea: { title: "世界文学", body: "点港口浏览代表性西方典籍，也可进入完整书架。" },
    links: { title: "跨文化入口", body: "从这里进入文明长卷与跨世界评议。" },
    hub: { title: "四库入口", body: "点盘心进入四库全书。" },
    enter: { title: "四部门楼", body: "经、史、子、集各自展开为类目与典籍。" },
    hans: { title: "类目", body: "每一部按类展开，点函套继续查看书目。" },
    vols: { title: "典籍", body: "点书进入正文，相关文脉也会随书显示。" },
    search: { title: "检索", body: "可按书名、作者、卷目或正文检索。" },
    reader: { title: "阅读", body: "正文保持原文，翻译、批注与评议分层显示。" },
  },
  xiyou: {
    intro: { title: "西游世界", body: "沿取经路线探索十八处关目，也可回看悟空前史。" },
    scene: { title: "路线地图", body: "拖动和缩放地图；点地点即可进入对应章回。" },
    here: { title: "地点卡", body: "这里显示本回人物、原文、事件与试炼。" },
    route: { title: "前后行程", body: "用路条前往下一处，或按前史顺序回看。" },
    parley: { title: "人物评议", body: "邀请本回人物从各自立场评议此事。" },
  },
  westlit: {
    intro: { title: "西方典籍", body: "在书架中浏览已接入的西方经典与中英文正文。" },
    shelf: { title: "书架", body: "每本书标出作者、年代与可读版本，点书即可打开。" },
    pick: { title: "阅读器", body: "这里以章节阅读正文，并保留原书的篇章结构。" },
    lang: { title: "中英切换", body: "可查看中文、英文，章目对齐时还能双语对照。" },
    margin: { title: "边批", body: "拖选一句，即可邀请中西人物作批。" },
    media: { title: "后世演绎", body: "这里汇集与本书相关的戏剧、电影和动画。" },
  },
  crossworld: {
    links: { title: "跨文化入口", body: XMEDIA_ON ? "进入文明长卷、跨世界评议或跨媒介点评。" : "进入文明长卷或跨世界评议。" },
    scroll: { title: "文明长卷", body: "按年代浏览中西典籍，并沿七类文脉关系追踪影响。" },
    motif: { title: "跨世界评议", body: "选择共同母题，让不同世界的人物独立评议、互问或讨论。" },
    media: { title: "跨媒介点评", body: "选择影音片段，让相关人物围绕具体场景点评。" },
  },
};

/** 高亮框外扩 */
const PAD = 9;
/** 气泡与高亮框的间距 */
const GAP = 14;
/** 气泡宽度，与 globals.css 的 .tour-bubble 保持一致 */
const BW = 302;
/** 首帧尚未量到真实气泡高度时的估值 */
const BH_GUESS = 178;
/** 贴边留白 */
const EDGE = 12;
/** 等目标出现的默认帧数上限 */
const WAIT = 40;

type Box = { top: number; left: number; right: number; bottom: number };

/** 量目标框：多个元件取并集，零面积者（窄屏下被 display:none）忽略。
 *  比视口还高的元件（如可滚的典籍检索结果列）会把高亮圈顶出屏外，故末了夹回视口内。 */
function unionBox(selector: string): Box | null {
  let box: Box | null = null;
  document.querySelectorAll(selector).forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) return;
    box = box
      ? {
          top: Math.min(box.top, b.top),
          left: Math.min(box.left, b.left),
          right: Math.max(box.right, b.right),
          bottom: Math.max(box.bottom, b.bottom),
        }
      : { top: b.top, left: b.left, right: b.right, bottom: b.bottom };
  });
  if (!box) return null;
  const b: Box = box;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clipped: Box = {
    top: Math.max(PAD, Math.min(b.top, vh - PAD)),
    left: Math.max(PAD, Math.min(b.left, vw - PAD)),
    right: Math.min(vw - PAD, Math.max(b.right, PAD)),
    bottom: Math.min(vh - PAD, Math.max(b.bottom, PAD)),
  };
  // 夹过头成了负面积（元件整个滚出视野）：视作量不到，交由上层等待或跳过
  if (clipped.right - clipped.left < 2 || clipped.bottom - clipped.top < 2) return null;
  return clipped;
}

type Pos = { top: number; left: number; place: Place; caret: number };

/** 按优先方向挑一处放得下气泡的位置，放不下就退而求其次，最后夹回视口内 */
function placeBubble(box: Box, prefer: Place | undefined, bh: number): Pos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = (box.left + box.right) / 2;
  const cy = (box.top + box.bottom) / 2;
  const clampX = (x: number) => Math.max(EDGE, Math.min(x, vw - BW - EDGE));
  const clampY = (y: number) => Math.max(EDGE, Math.min(y, vh - bh - EDGE));

  if (prefer === "inside") {
    // 浮在目标框内：偏下摆，免得压住正中的内容（圆桌、图谱）
    const inTop = Math.min(box.bottom - bh - 18, Math.max(box.top + 18, cy + 40));
    return { top: clampY(inTop), left: clampX(cx - BW / 2), place: "inside", caret: -1 };
  }

  const order: Place[] = prefer
    ? [prefer, "bottom", "top", "right", "left"]
    : ["bottom", "top", "right", "left"];
  for (const p of order) {
    if (p === "bottom" && box.bottom + PAD + GAP + bh <= vh - EDGE) {
      const left = clampX(cx - BW / 2);
      return { top: box.bottom + PAD + GAP, left, place: p, caret: cx - left };
    }
    if (p === "top" && box.top - PAD - GAP - bh >= EDGE) {
      const left = clampX(cx - BW / 2);
      return { top: box.top - PAD - GAP - bh, left, place: p, caret: cx - left };
    }
    if (p === "right" && box.right + PAD + GAP + BW <= vw - EDGE) {
      const top = clampY(cy - bh / 2);
      return { top, left: box.right + PAD + GAP, place: p, caret: cy - top };
    }
    if (p === "left" && box.left - PAD - GAP - BW >= EDGE) {
      const top = clampY(cy - bh / 2);
      return { top, left: box.left - PAD - GAP - BW, place: p, caret: cy - top };
    }
  }
  // 四面都挤不下（极小窗口）：浮在目标框内，不再画指向小角
  return { top: clampY(cy - bh / 2), left: clampX(cx - BW / 2), place: "inside", caret: -1 };
}

export default function TourLayer({
  chapter,
  startAt = 0,
  onNeedPanel,
  onAct,
  onDone,
}: {
  /** 讲哪一册。五册各是各的步子表，互不相干 */
  chapter: TourChapter;
  /**
   * 自第几步起讲。册一的头几步在盘面上讲，若四库已开着（如自战国的书架入四库），
   * 盘面不在场，那几步便无处可指——此时自门楼一步起讲。
   */
  startAt?: number;
  /** 请 page 把侧栏切到该页签（并关掉谈话态），否则量不到目标 */
  onNeedPanel: (panel: TourPanel) => void;
  /** 请 page 实演某动作（开辩论台、填检索词、开图谱……） */
  onAct: (act: TourAct) => void;
  /** 看完或跳过本册 */
  onDone: () => void;
}) {
  const t = useT();
  const STEPS = CHAPTERS[chapter].steps;
  const [i, setI] = useState(() => Math.min(Math.max(0, startAt), STEPS.length - 1));
  const [box, setBox] = useState<Box | null>(null);
  const [bh, setBh] = useState(BH_GUESS);
  const [shown, setShown] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  /** 当前前进方向：自动跳过隐藏步骤时沿用，免得倒着走时被弹回去 */
  const dirRef = useRef<1 | -1>(1);
  /** 供测量 effect 回调最新的跳步逻辑（effect 只依赖 i，闭包里的 go 会过期） */
  const skipRef = useRef<() => void>(() => {});
  /** 下一步的 act 免演一次：用户自己已把那件事办到了（见 advanceOn） */
  const noActRef = useRef(false);

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const go = useCallback(
    (dir: 1 | -1) => {
      dirRef.current = dir;
      const next = i + dir;
      if (next >= STEPS.length) {
        onDone();
        return;
      }
      setI(Math.max(0, next));
    },
    [i, onDone, STEPS.length],
  );
  skipRef.current = () => go(dirRef.current);

  // 切步：先切页签、发动作，再等元件挂上并滚入视野，然后量框
  useEffect(() => {
    const s = STEPS[i];
    if (s.panel) onNeedPanel(s.panel);
    // 倒着回来：先收掉后一步开出来的那一层，否则气泡只会在那一层上照本步的坐标画框
    if (dirRef.current === -1 && s.back) (Array.isArray(s.back) ? s.back : [s.back]).forEach(onAct);
    if (s.act && !noActRef.current) (Array.isArray(s.act) ? s.act : [s.act]).forEach(onAct);
    noActRef.current = false;
    if (!s.target) {
      setBox(null);
      setShown(true);
      return;
    }
    setShown(false);
    // 先撤掉上一步的框：量到新目标前若留着旧框，高亮圈会短暂指着上一处元件
    setBox(null);
    const selector = s.target;
    const limit = s.wait ?? WAIT;
    let tries = 0;
    let scrolled = false;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(selector);
      if (el && !scrolled) {
        // 侧栏面板内部可滚，先把目标滚进视野，下一帧再量
        scrolled = true;
        el.scrollIntoView({ block: "center", inline: "nearest" });
      } else if (el) {
        const b = unionBox(selector);
        if (b) {
          setBox(b);
          setShown(true);
          return;
        }
      }
      // 等满仍量不到：元件不存在或被窄屏隐藏，按当前方向跳过此步
      if (++tries > limit) {
        skipRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, onNeedPanel, onAct, STEPS]);

  // 量真实气泡高度，修正首帧按估值算出的位置
  useLayoutEffect(() => {
    const h = bubbleRef.current?.offsetHeight;
    if (h && Math.abs(h - bh) > 1) setBh(h);
  }, [i, bh, shown]);

  // 窗口缩放或页面滚动后重新量框（capture 以捕获侧栏内部滚动）
  useEffect(() => {
    if (!step.target) return;
    const selector = step.target;
    const remeasure = () => {
      const b = unionBox(selector);
      if (b) setBox(b);
    };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [step.target]);

  // 实演步骤里用户会真点界面，元件位置随之变（如辩论台从 setup 切到圆桌）：
  // 留孔的步骤持续跟量，气泡不至于指错地方。
  useEffect(() => {
    if (!step.hole || !step.target) return;
    const selector = step.target;
    const id = window.setInterval(() => {
      const b = unionBox(selector);
      if (b) setBox((prev) => {
        if (prev && Math.abs(prev.top - b.top) < 2 && Math.abs(prev.left - b.left) < 2
            && Math.abs(prev.right - b.right) < 2 && Math.abs(prev.bottom - b.bottom) < 2) return prev;
        return b;
      });
    }, 420);
    return () => window.clearInterval(id);
  }, [step.hole, step.target]);

  /**
   * 留孔步骤里用户自己动了手：凭据一出现即自行进下一步。
   *
   * 「点盘心即入四库」这类话说了，他真点了，界面就已经换了——气泡若还停在原处讲上一句，
   * 看着就像点了没用。故盯着凭据：它出现便进下一步，并记一笔「下一步不必重演」，
   * 免得刚开好的那一层又被重挂一次、白闪一下。
   *
   * 本步刚进来时凭据就在（如自后一步倒回、收场动作还没落地）不算：须先见它不在，
   * 再见它出现，才算是这位客自己点出来的。
   */
  useEffect(() => {
    const sel = step.advanceOn;
    if (!sel) return;
    let gone = false;
    const id = window.setInterval(() => {
      const hit = !!document.querySelector(sel);
      if (!hit) {
        gone = true;
        return;
      }
      if (!gone) return;
      window.clearInterval(id);
      noActRef.current = true;
      go(1);
    }, 260);
    return () => window.clearInterval(id);
  }, [step.advanceOn, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDone();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      }
      // 留孔步骤里用户要在界面上打字（辩题、插话），故不抢 Enter/空格
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onDone]);

  const pos = box ? placeBubble(box, step.place, bh) : null;
  const centered = !box;

  return (
    <div className="tour-root" role="dialog" aria-modal="false" aria-label={t("新手导览")}>
      {/* 遮罩：挡住误触，不做点击推进（免得看了一半被手滑跳过）。
          留孔步骤用四条边框分片遮罩，中间透出真元件让用户亲自操作。 */}
      {centered ? (
        <div className="tour-mask dim" />
      ) : step.hole && box ? (
        <>
          <div className="tour-mask part" style={{ top: 0, left: 0, right: 0, height: Math.max(0, box.top - PAD) }} />
          <div className="tour-mask part" style={{ top: Math.max(0, box.bottom + PAD), left: 0, right: 0, bottom: 0 }} />
          <div className="tour-mask part" style={{ top: Math.max(0, box.top - PAD), left: 0, width: Math.max(0, box.left - PAD), height: box.bottom - box.top + PAD * 2 }} />
          <div className="tour-mask part" style={{ top: Math.max(0, box.top - PAD), left: Math.max(0, box.right + PAD), right: 0, height: box.bottom - box.top + PAD * 2 }} />
        </>
      ) : (
        <div className="tour-mask" />
      )}

      {box && (
        <div
          className={`tour-ring${step.hole ? " live" : ""}`}
          style={{
            top: box.top - PAD,
            left: box.left - PAD,
            width: box.right - box.left + PAD * 2,
            height: box.bottom - box.top + PAD * 2,
          }}
        >
          {step.hole && <span className="tour-live-tag">{t("可直接操作")}</span>}
        </div>
      )}

      <div
        ref={bubbleRef}
        className={`tour-bubble${shown ? " in" : ""}${centered ? " mid" : ""}`}
        style={
          centered
            ? undefined
            : { top: pos!.top, left: pos!.left, visibility: shown ? "visible" : "hidden" }
        }
      >
        {pos && pos.caret >= 0 && (
          <span
            className={`tour-caret ${pos.place}`}
            style={
              pos.place === "top" || pos.place === "bottom"
                ? { left: Math.max(16, Math.min(pos.caret, BW - 16)) }
                : { top: Math.max(16, Math.min(pos.caret, bh - 16)) }
            }
            aria-hidden
          />
        )}
        <div className="tour-meta">
          <span className="tour-step">
            <em>{t(CHAPTERS[chapter].title)}</em>
            {i + 1} / {STEPS.length}
          </span>
          <button className="tour-skip" onClick={onDone}>
            {t("跳过")}
          </button>
        </div>
        <h4>{t(SHORT_COPY[chapter]?.[step.id]?.title ?? step.title)}</h4>
        <p>{t(SHORT_COPY[chapter]?.[step.id]?.body ?? step.body)}</p>
        <div className="tour-dots" aria-hidden>
          {STEPS.map((s, n) => (
            <i key={s.id} className={n === i ? "on" : n < i ? "past" : ""} />
          ))}
        </div>
        <div className="tour-acts">
          {i > 0 && (
            <button className="tour-prev" onClick={() => go(-1)}>
              {t("‹ 上一步")}
            </button>
          )}
          <button className="tour-next" onClick={() => go(1)}>
            {last ? t("开始游历") : t("下一步")} <span aria-hidden>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
