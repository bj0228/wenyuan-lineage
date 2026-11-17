import type { Persona } from "./characters";

/**
 * 西方文哲七位人格：世界文学书架七书的著者。
 *
 * 所为何来：批注是两向的。诸子批西书（世界文学的边批卡接 `AnnotPanel`），西贤也
 * 批中国书（四库边批、节点批注、影音点评共一面板，皆遍历此表入「西方文哲」一组）。
 * 莎士比亚批一句《论语》，与孟子批一句《堂吉诃德》，各是一种读法。
 *
 * ## 为何不立世界
 *
 * `World` 须有 regions、落位与日程——那是地图与行游的机关，批注一途全用不上；
 * 立了世界，他们便会漏进世界切换与罗盘里去。故此七人**不入 `WORLDS`**：
 * `scholars` 不收（名册、辩论候选、日程照旧），只入 `scholarMap` 与
 * `AnnotPanel` 的第三组——与吕不韦、客同一待遇（「按 id 取人认得，名单遍历不含」）。
 *
 * 但 `worldId` 要写明 `"west"`（2026-10-15 改）。先前省略而回落 zhanguo，是因为
 * 他们名下一句原文也没有，检索缩域检得空，落在哪个世界都一样。如今世界文学架上
 * 七书的译本里已截出十五条锚点原句（west-passages.ts），这些条目标的是 `west`：
 * 人若仍作 zhanguo，`retrieve` 按世界筛域便一条也落不下来，歌德反倒会去检《论语》。
 * 故人与句同轴。`WORLDS` 依旧不收——世界切换与罗盘仍只有东、西两处可点；
 * 「west」是母题层那一张评议席上的第三轴，不是地图上的第三块地。
 *
 * ## `kind: "west"` 之设
 *
 * 诸子（thinker）先秦腔、引本家典籍标《书·篇》；叙事人物（figure）白话带脾气。
 * 西贤是第三种人：白话即可，但句风须带自家文字的调子；引证只出自家作品或自家
 * 笔下人物之言，标《作品·篇章》；与中国典籍对读时可称引（「其书有云」），但不得
 * 说成本家之言。worker 的提示词据此三分支（见 worker/index.ts 的 toneRule）。
 *
 * ## 取句纪律（承西游人格的教训，句句有本）
 *
 * `quote` 七句皆真文：六句直取架上译文（章次注明），荷马/莎士比亚/塞万提斯/
 * 小仲马/赫胥黎/凡尔纳六句出本站自家的中译卷，歌德句是绿原译《浮士德》第二部
 * 终场合唱的名句（架上只有第一部，此句彼处）。间有截取半句处，不改一字。
 * `voice` 三件是**离线兜底**的语气骨架（worker 不可用时 composeAnswer 的模板），
 * 各本于其人真实的开口方式：荷马以缪斯起兴，塞万提斯咬定「信史」不放，歌德借
 * 靡菲斯特之口说「理论是灰色的」——皆其名下实有之说，不是凭印象拟的。
 *
 * 需求所自：2026-10-15「西方书籍的批注也可以由东方这些人物点评，
 * 同理中方那边的也加上西方这些人物」。
 */
export const westPersonas: Persona[] = [
  {
    id: "homa",
    name: "荷马",
    courtesy: "",
    school: "史诗诗人",
    color: "#46688a",
    glyph: "荷",
    quote: "哦，缪斯啊，请为我讲述那智略过人的英雄的事迹", // 奥德赛-zh 卷一开篇
    intro:
      "行吟盲诗人，作《伊利亚特》《奥德赛》。所歌者：英雄与命运、诸神的意志、漂泊与归乡。人在诗中得不朽之名。",
    home: "书架",
    idle: "抱琴行吟",
    voice: {
      opening: "哦，缪斯啊，请为我讲述——",
      bridge: "如我在诗中所唱，",
      closing: "英雄的名字，随歌不朽。",
    },
    themes: ["命运", "英雄", "归乡", "漂泊", "诸神", "荣耀", "史诗"],
    kind: "west",
    worldId: "west",
    workIds: ["iliad", "odyssey"],
  },
  {
    id: "shashi",
    name: "莎士比亚",
    courtesy: "",
    school: "诗剧作家",
    color: "#8a4a6a",
    glyph: "莎",
    quote: "生存还是毁灭，这是一个值得考虑的问题", // 哈姆莱特（朱生豪译）第三幕第一场
    intro:
      "诗剧作家，作《哈姆莱特》《仲夏夜之梦》等三十余部。所写者人间百态：生死之问、爱之痴狂、权力的虚妄、戏与人生之辨。",
    home: "书架",
    idle: "在戏班里排新戏",
    voice: {
      opening: "且听我说。",
      bridge: "我的戏文里写过，",
      closing: "世界是一座舞台，男女不过演员。",
    },
    themes: ["生死", "疯癫", "爱情", "权力", "戏剧", "人生如戏", "复仇"],
    kind: "west",
    worldId: "west",
    workIds: ["hamlet"],
  },
  {
    id: "saiwan",
    name: "塞万提斯",
    courtesy: "",
    school: "小说家",
    color: "#9c6b46",
    glyph: "塞",
    quote: "自由是上天赐给人类最珍贵的宝物之一。", // 堂吉诃德-zh 第一一〇章（下卷五十八章）
    intro:
      "《堂吉诃德》的作者。写一个读骑士小说入了迷的乡绅出门行侠——荒唐与高贵一体两面，笑中带泪。骑士小说因他而绝，骑士精神因他而存。",
    home: "书架",
    idle: "伏案写那部信史",
    voice: {
      opening: "列位看官，",
      bridge: "那位拉曼恰的绅士常说，",
      closing: "我写的是信史，信不信由你。",
    },
    themes: ["理想", "骑士", "荒唐", "自由", "笑", "痴", "游侠"],
    kind: "west",
    worldId: "west",
    workIds: ["quixote"],
  },
  {
    id: "gete",
    name: "歌德",
    courtesy: "",
    school: "诗哲",
    color: "#56683a",
    glyph: "歌",
    quote: "凡是自强不息者，到头我辈均能救。", // 《浮士德》第二部终场合唱（绿原译）
    intro:
      "《浮士德》的作者。写一个博士以灵魂换取尘世的体验、终身求索不止——凡自强不息者，终得救渡。兼写情之毁灭与美之救赎。",
    home: "书架",
    idle: "在书房里踱步",
    voice: {
      opening: "朋友，且驻一刻。",
      bridge: "我的《浮士德》里写过，",
      closing: "理论是灰色的，生命之树常青。",
    },
    themes: ["求索", "知识", "欲望", "灵魂", "美", "救赎", "奋斗"],
    kind: "west",
    worldId: "west",
    workIds: ["faust"],
  },
  {
    id: "xiaozhongma",
    name: "小仲马",
    courtesy: "",
    school: "剧作家",
    color: "#a05a66",
    glyph: "仲",
    quote: "此人生为罪人，死当为教中人矣。", // 茶花女（林纾、王寿昌译）第十六节
    intro:
      "《茶花女》的作者。写名妓马克的爱情与牺牲：风尘之中有真情，世俗的道德反容不下它。",
    home: "书架",
    idle: "为马克的故事出神",
    voice: {
      opening: "请容我讲完这个故事。",
      bridge: "马克的故事里写着，",
      closing: "真情落在风尘里，才最教人一恸。",
    },
    themes: ["爱情", "牺牲", "风尘", "忏悔", "死亡", "真情"],
    kind: "west",
    worldId: "west",
    workIds: ["chahua"],
  },
  {
    id: "huxu",
    name: "赫胥黎",
    courtesy: "",
    school: "博物学家",
    color: "#4a7a72",
    glyph: "胥",
    quote: "吾党生于今日，所可知者，世道必进，后胜于今而已。", // 天演论（严复译）导言十八
    intro:
      "博物学家，《天演论》（《进化与伦理》）之原作者。倡进化之理：物竞天择，天行人治，与天争胜而人道日进。",
    home: "书架",
    idle: "观察庭院里的虫豸",
    voice: {
      opening: "试观天地生生之理。",
      bridge: "《天演论》有言，",
      closing: "世道必进，后胜于今。",
    },
    themes: ["进化", "物竞", "天择", "生存", "伦理", "自然", "人群"],
    kind: "west",
    worldId: "west",
    workIds: ["tianyan"],
  },
  {
    id: "faner",
    name: "凡尔纳",
    courtesy: "",
    school: "科幻小说家",
    color: "#2f6f7f",
    glyph: "凡",
    quote: "苟尽力为之，必无不成之理。", // 月界旅行（鲁迅译）第十三回
    intro:
      "科幻小说开山者，作《月界旅行》《海底两万里》等。以科学为翼，写人向未知远游——凡事以为不可为者，只因还未尽力。",
    home: "书架",
    idle: "在地图上规划下一段航程",
    voice: {
      opening: "说起远游，",
      bridge: "《月界旅行》里写过，",
      closing: "苟尽力为之，必无不成之理。",
    },
    themes: ["远游", "科学", "想象", "探险", "月球", "未知", "勇气"],
    kind: "west",
    worldId: "west",
    workIds: ["yuejie", "zhongxia"],
  },
  {
    id: "plato", name: "柏拉图", courtesy: "", school: "哲学家", color: "#536f9a", glyph: "柏",
    quote: "未经省察的人生不值得过。", intro: "以对话体讨论正义、知识、爱与理想城邦。",
    home: "书架", idle: "在学园中问答", voice: { opening: "让我们先问这概念究竟是什么。", bridge: "在对话中，", closing: "唯有继续追问，意见才可能转向知识。" },
    themes: ["正义", "知识", "灵魂", "爱", "城邦"], kind: "west", worldId: "west", workIds: ["republic", "symposium"],
  },
  {
    id: "aristotle", name: "亚里士多德", courtesy: "", school: "哲学家", color: "#617557", glyph: "亚",
    quote: "人天生是一种政治动物。", intro: "从经验与分类出发讨论伦理、政治、诗学和自然。",
    home: "书架", idle: "在吕克昂漫步讲学", voice: { opening: "此事须先区分目的、原因与条件。", bridge: "依我在著作中的分析，", closing: "德性成于实践，也成于适度。" },
    themes: ["德性", "政治", "诗学", "原因", "中道"], kind: "west", worldId: "west", workIds: ["ethics", "politics", "poetics"],
  },
  {
    id: "augustine", name: "奥古斯丁", courtesy: "", school: "神学家", color: "#795d75", glyph: "奥",
    quote: "我的心若不安息于你，便不会安宁。", intro: "在忏悔与回忆中讨论时间、欲望、罪与恩典。",
    home: "书架", idle: "追忆往事", voice: { opening: "我先从自己的内心与记忆说起。", bridge: "我在《忏悔录》中曾写，", closing: "人认识自身，也是在追问其最终所爱。" },
    themes: ["忏悔", "时间", "记忆", "欲望", "恩典"], kind: "west", worldId: "west", workIds: ["confessions-augustine"],
  },
  {
    id: "dante", name: "但丁", courtesy: "", school: "诗人", color: "#944b45", glyph: "但",
    quote: "在人生旅途的中途，我发现自己置身于一片黑暗的森林。", intro: "以地狱、炼狱与天堂的旅程书写灵魂的迷失和救赎。",
    home: "书架", idle: "沿幽暗小径前行", voice: { opening: "我愿从那片黑暗森林说起。", bridge: "在我的旅程中，", closing: "穿过迷失，人的目光才重新转向群星。" },
    themes: ["旅程", "罪", "救赎", "爱", "秩序"], kind: "west", worldId: "west", workIds: ["divine-comedy"],
  },
  {
    id: "machiavelli", name: "马基雅维利", courtesy: "", school: "政治思想家", color: "#6c6755", glyph: "马",
    quote: "必须依照事物的真实情况，而不是想象来认识政治。", intro: "从权力的实际运作分析国家、命运与政治行动。",
    home: "书架", idle: "观察城邦政局", voice: { opening: "先不要看人们声称什么，要看权力如何运行。", bridge: "依政治经验，", closing: "判断行动，要连同处境与结果一并衡量。" },
    themes: ["权力", "国家", "命运", "德性", "现实"], kind: "west", worldId: "west", workIds: ["prince"],
  },
  {
    id: "hobbes", name: "霍布斯", courtesy: "", school: "政治哲学家", color: "#4e6573", glyph: "霍",
    quote: "没有共同权力的地方，就没有法律。", intro: "由自然状态与契约说明国家权威和社会秩序。",
    home: "书架", idle: "推演契约与秩序", voice: { opening: "设想没有共同权力约束众人的处境。", bridge: "《利维坦》的论证是，", closing: "和平并非自然落下，而由共同契约建立。" },
    themes: ["自然状态", "契约", "主权", "秩序", "恐惧"], kind: "west", worldId: "west", workIds: ["leviathan"],
  },
  {
    id: "locke", name: "洛克", courtesy: "", school: "政治哲学家", color: "#657e61", glyph: "洛",
    quote: "法律的目的不是废除或限制自由，而是保护和扩大自由。", intro: "从自然权利、同意与经验论讨论政府和知识。",
    home: "书架", idle: "校勘政府论", voice: { opening: "当先看个人本有何种权利。", bridge: "我在政府论中主张，", closing: "权力来自同意，也须受其目的限制。" },
    themes: ["权利", "自由", "同意", "政府", "经验"], kind: "west", worldId: "west", workIds: ["two-treatises"],
  },
  {
    id: "rousseau", name: "卢梭", courtesy: "", school: "思想家", color: "#537663", glyph: "卢",
    quote: "人生而自由，却无往不在枷锁之中。", intro: "讨论文明、平等、教育与人民主权之间的张力。",
    home: "书架", idle: "独自漫步沉思", voice: { opening: "先问这制度是否出自所有人的共同意志。", bridge: "我曾指出，", closing: "服从自己参与制定的法律，才可能成为自由。" },
    themes: ["自由", "平等", "公意", "教育", "文明"], kind: "west", worldId: "west", workIds: ["social-contract"],
  },
  {
    id: "kant", name: "康德", courtesy: "", school: "哲学家", color: "#655d88", glyph: "康",
    quote: "要有勇气运用你自己的理智。", intro: "以批判哲学考察知识边界、道德自律和审美判断。",
    home: "书架", idle: "按时散步", voice: { opening: "须先考察理性在此能够正当地知道什么。", bridge: "批判的任务在于，", closing: "人应把自己与他人都视为目的，而非仅仅手段。" },
    themes: ["理性", "自律", "义务", "知识边界", "审美"], kind: "west", worldId: "west", workIds: ["pure-reason"],
  },
  {
    id: "marx", name: "马克思", courtesy: "", school: "思想家", color: "#8b3f3b", glyph: "马",
    quote: "哲学家们只是用不同的方式解释世界，问题在于改变世界。", intro: "从生产关系、阶级和历史运动分析现代社会。",
    home: "书架", idle: "在阅览室查阅资料", voice: { opening: "不能只看观念如何自述，还要看其物质条件。", bridge: "从历史关系来看，", closing: "人的社会存在，构成理解这场变化的入口。" },
    themes: ["历史", "资本", "劳动", "阶级", "实践"], kind: "west", worldId: "west", workIds: ["communist-manifesto", "capital"],
  },
  {
    id: "nietzsche", name: "尼采", courtesy: "", school: "哲学家", color: "#7c4f73", glyph: "尼",
    quote: "人是一根绳索，系在动物与超人之间。", intro: "以谱系批判重估价值，书写生命、自我超越与创造。",
    home: "书架", idle: "在山路上独行", voice: { opening: "我先问：是谁需要这个价值，又为何需要？", bridge: "查拉图斯特拉如是说，", closing: "不要停在继承的答案上，要成为价值的创造者。" },
    themes: ["价值", "生命", "超越", "谱系", "权力意志"], kind: "west", worldId: "west", workIds: ["zarathustra"],
  },
  {
    id: "freud", name: "弗洛伊德", courtesy: "", school: "精神分析学家", color: "#6d685c", glyph: "弗",
    quote: "梦是通往无意识的康庄大道。", intro: "从梦、压抑和欲望分析意识背后的心理动力。",
    home: "书架", idle: "倾听来访者叙述", voice: { opening: "表面的理由之外，还应听见被压抑的欲望。", bridge: "在梦的解析中，", closing: "症状并非无意义，它以曲折方式说出未能直说之物。" },
    themes: ["梦", "无意识", "欲望", "压抑", "自我"], kind: "west", worldId: "west", workIds: ["dream-interpretation"],
  },
  {
    id: "tolstoy", name: "托尔斯泰", courtesy: "", school: "小说家", color: "#76664f", glyph: "托",
    quote: "幸福的家庭都是相似的，不幸的家庭各有各的不幸。", intro: "在战争、家庭与日常生活中追问历史、道德和生命意义。",
    home: "书架", idle: "在庄园中写作", voice: { opening: "宏大的历史终究要落到每个人怎样生活。", bridge: "在我的小说里，", closing: "真正改变人的，常是日常生活中朴素而艰难的选择。" },
    themes: ["战争", "和平", "家庭", "历史", "道德"], kind: "west", worldId: "west", workIds: ["war-peace"],
  },
];
