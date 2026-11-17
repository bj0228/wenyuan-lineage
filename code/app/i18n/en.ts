/**
 * 界面词表（英文）—— key 即源码里那句中文本身。
 *
 * 为何以中文原文作 key、为何中文模式是恒等函数，见 `lang.ts` 顶注。此处只管收词。
 *
 * ## 收什么、不收什么
 *
 * **收**：按钮、栏目、标题、提示、空态、占位符；以及在界面上当标签用的专名——
 * 人名、学派、区域、部类、朝代、器物、称号。专名虽出自数据文件（characters.ts、
 * regions.ts…），但它们是**界面家具**：若人名仍作「孔子」而按钮已作 "Talk with him"，
 * 英文模式便是半成品。以中文作 key 的好处正在此——数据文件一字不必动，
 * 渲染处包一层 `t()` 即可。
 *
 * **不收**：典籍原文与其白话、诸子生平长文、章节正文。原文永不替换（见 lang.ts），
 * 诸子说出的话另有一条路（运行时英译，见 `Said.tsx`）。
 *
 * ## 译法三例
 *
 *  1. **专名用通行译名**：孔子作 Confucius、墨子作 Mozi、《论语》作 Analects——
 *     汉学界已有定译的一律从之，不另造。无定译者（杏坛、招贤馆）取其义而非音，
 *     读者要的是「这是什么地方」，不是这三个字怎么念。
 *  2. **部类取四库英译通例**：经史子集作 Classics／Histories／Masters／Belles-lettres。
 *  3. **印章字不译**：单字朱印（脈、盘、客、库、题）是图不是字，译了反而认不出
 *     ——故词表里没有它们，`t()` 原样返回，英文模式下仍是那一枚印。
 */
export const EN: Record<string, string> = {
  "与": "and",
  "中庸": "The Doctrine of the Mean",
  "周易正义": "Correct Meaning of the Book of Changes",
  "尚书正义": "Correct Meaning of the Book of Documents",
  "周礼注疏": "Commentary and Subcommentary on the Rites of Zhou",
  "仪礼注疏": "Commentary and Subcommentary on the Book of Etiquette and Ceremonial",
  "礼记正义": "Correct Meaning of the Book of Rites",
  "春秋左传正义": "Correct Meaning of the Zuo Commentary",
  "春秋公羊传注疏": "Commentary and Subcommentary on the Gongyang Commentary",
  "春秋谷梁传注疏": "Commentary and Subcommentary on the Guliang Commentary",
  "论语注疏": "Commentary and Subcommentary on the Analects",
  "孝经注疏": "Commentary and Subcommentary on the Classic of Filial Piety",

  // ── 一、门面与外壳 ───────────────────────────────────────────
  "文渊寻脉": "Wen Yuan Lineage",
  "山是书山，河是航线：罗盘领四库、海图通万国书，走进诸子世界与先贤对谈、观百家争鸣。":
    "Mountains of books, sea lanes of texts: a compass opens the Four Treasuries, a chart opens the world's literature. Step into the world of the philosophers, talk with them, watch a hundred schools contend.",
  "经史子集，各有一世界": "Classics, Histories, Masters, Belles-lettres — a world in each",
  "天下一隅 · 先秦思想沙盒": "A corner of the realm · pre-Qin thought sandbox",
  "正在铺展天下……": "Unrolling the realm…",
  "先秦诸子": "Pre-Qin Philosophers",
  "西游": "Journey to the West",
  "史记": "Records of the Grand Historian",
  "三国": "Three Kingdoms",
  "世界文学": "World Literature",
  "历代中国": "Later Chinese Traditions",
  "汉至近今": "Han to the modern age",
  "搜索人物、时代或著述……": "Search people, periods, or works…",
  "核心人物 · 150": "Core personas · 150",
  "著作关联 · 350": "Work-linked personas · 350",
  "历史语境 · 500": "Contextual figures · 500",
  "全部人物 · 1000": "All personas · 1,000",
  "换世界 · 盘面": "Switch world · compass",
  "回盘面换世界": "Back to the compass to switch worlds",
  "盘面 · 换一个世界": "Compass · switch to another world",
  "世界运行中": "World running",
  "已暂停": "Paused",
  "暂停世界": "Pause the world",
  "继续世界": "Resume the world",
  "百家脉络": "Lineages",
  "百家演变脉络": "Lineage of the hundred schools",
  "母题": "Motifs",
  "母题跨世界评议": "Motifs · cross-world commentary",
  "母题·跨世界评议": "Motifs · cross-world commentary",
  "跨媒介": "Cross-media",
  "跨媒介点评": "Cross-media commentary",
  "影音·跨媒介点评": "Screen · cross-media commentary",
  "游学者档案": "Traveling student's dossier",
  "我的档案": "My dossier",
  "百家微缩地图": "Miniature map of the hundred schools",
  "世界纪事": "World chronicle",
  "静候事起……": "Awaiting events…",
  "正在活动": "Active",
  "可发起对话": "Open to dialogue",
  "{n} 区域 · {m} 人物自主往来": "{n} regions · {m} figures moving on their own",

  // ── 二、侧栏四页签与人物档案 ─────────────────────────────────
  "人物": "Figures",
  // 图谱上第四种节点：无传世之书、只见于他人记载的人
  "幽灵": "Ghost",
  "辩论席": "Debate",
  "典籍": "Canon",
  "语录": "Sayings",
  "诸子名录": "Roster of philosophers",
  "驻馆": "Resident",
  "吕不韦 · 驻招贤馆": "Lü Buwei · resident of the Hall for Recruiting Talent",
  "字 {courtesy} · {region}": "Style name {courtesy} · {region}",
  "交情 · {desc}": "Rapport · {desc}",
  "此刻": "Now",
  "此刻 {clock}": "Now {clock}",
  "与他交谈": "Talk with him",
  "归位": "Send back",
  "今日行程": "Today's schedule",
  "今日无事": "Nothing today",
  "与{names}": "with {names}",
  "下一事 {clock}": "Next at {clock}",
  "典籍依据": "Textual basis",
  "回答由《{books}》等原典检索生成，引文标注出处，其余为立场推演。":
    "Answers are retrieved from {books} and other primary texts; quotations carry their sources, the rest is inferred from his position.",
  "{name}无本家典籍入此库，其言依其学派立场由大模型推演。":
    "{name} has no text of his own school in this library; his words are inferred by the model from his school's position.",
  "附近的人": "Nearby",
  "{n} 人在阈值内": "{n} within range",
  "附近无人。点地图移动此人物靠近他人，即可发起对话或辩论。":
    "No one nearby. Click the map to move this figure closer to others, then start a dialogue or a debate.",
  "对谈›": "Talk ›",
  "发起辩论": "Start a debate",

  // ── 三、一对一对谈 ───────────────────────────────────────────
  "返回人物": "Back to figures",
  "{region} · 与你交谈": "{region} · in conversation with you",
  "切换交谈对象": "Switch interlocutor",
  "右键诸子发言可译为白话": "Right-click a reply to render it in plain language",
  "右键译为白话": "Right-click to render in plain language",
  "点地图上小人选中，再按「与他交谈」开始；或点右上选择交谈对象。":
    "Pick a figure on the map and press \"Talk with him\" — or choose an interlocutor at the top right.",
  我: "Me",
  "正在作答……": "Answering…",
  "正在译为白话……": "Rendering in plain language…",
  "未能译为白话": "Could not render in plain language",
  "白话 · {text}": "Plain language · {text}",
  "典籍检索 + 立场推演": "Canon retrieval + inference from position",
  "送出": "Send",
  "向 {name} 提问……": "Ask {name}…",
  "如何看待人性？": "What is human nature?",
  "何以治国？": "How should a state be governed?",
  "战争可否有正当？": "Can a war ever be just?",
  "学与思孰重？": "Which matters more, learning or reflection?",
  "奉贽·点选为贽": "Offer a gift · tap to choose",
  "奉贽·将奉 {name}": "Offer a gift · will present {name}",
  "可奉束脩为贽，孔子未尝无诲。":
    "Present dried meat as your gift — Confucius never refused to teach anyone who did.",

  // ── 四、辩论席与圆桌 ─────────────────────────────────────────
  "百家争鸣 · 辩论席": "A hundred schools contend · debate",
  "圆桌开辩": "Open a round table",
  "不限位置，从全部人物中选人入席、自由输入辩题，圆桌围坐、四轮推进。也可在地图上移动人物靠近他人，由「附近的人」发起附近争鸣。":
    "No position required: seat anyone from the full roster, set your own topic, and run four rounds around the table. You can also move figures together on the map and start a local dispute from \"Nearby\".",
  "自由开辩": "Open debate",
  "双贤对谈": "Dialogue of two sages",
  "看两位贤者围绕你的议题各陈其见（全页对谈，左主动方、右对象）。":
    "Watch two sages each state their case on your topic (full-page dialogue: initiator left, respondent right).",
  "左 · 主动方": "Left · initiator",
  // 对谈两列的抬头：人名之下，此刻身在何处
  "主动方 · {region}": "Initiator · {region}",
  "对话对象 · {region}": "Respondent · {region}",
  "右 · 对象": "Right · respondent",
  "开始双贤对谈": "Begin the dialogue",
  "结束对谈": "End the dialogue",
  "对谈：{a} 与 {b}": "Dialogue: {a} and {b}",
  "向 {a} 与 {b} 出一议题……": "Put a question to {a} and {b}…",
  "将对谈凝为视频": "Render this dialogue as video",
  "百家争鸣 · 圆桌辩论": "A hundred schools contend · round-table debate",
  "百家争鸣": "A hundred schools contend",
  "百家争鸣 圆桌辩论": "A hundred schools contend — round-table debate",
  "今辩何题？": "What is the topic?",
  "辩题": "Topic",
  "自由输入辩题，如「天下何以致治？」":
    "Type any topic, e.g. \"How is order brought to the realm?\"",
  "人性本善，还是本恶？": "Is human nature good or bad?",
  "治国应当重礼，还是重法？": "Should a state rest on ritual or on law?",
  "战争是否存在正当性？": "Can war be justified?",
  "诸子如何看待人工智能？": "What would the philosophers make of artificial intelligence?",
  "天下何以致治？": "How is order brought to the realm?",
  "仅限附近": "Nearby only",
  "附近无人可入席。": "No one nearby to seat.",
  "游学者 · 我入席陈词": "Traveling student · take a seat and speak",
  "击鼓开辩": "Sound the drum",
  "四轮依次：陈述 · 反驳 · 质询 · 总结。每位发言后点「继续」推进，一轮末可插话、影响下一轮诸子所答。右键任一段发言可译为白话。":
    "Four rounds in order: statement · rebuttal · cross-examination · summation. Press \"Continue\" after each speaker; at the end of a round you may interject and shape what comes next. Right-click any speech to render it in plain language.",
  "待击鼓开辩": "Waiting for the drum",
  "辩论已毕": "Debate concluded",
  "本轮毕": "Round over",
  "辩论收束": "Debate closed",
  "辩论将启……": "The debate is about to begin…",
  "附近争鸣": "Local dispute",
  "结束辩论": "End the debate",
  "陈词 ›": "Speak ›",
  "提前收束": "Close early",
  "再延一轮": "One more round",
  "再辩一轮": "Debate again",
  "继续 ›": "Continue ›",
  "轮间 · 下一轮 {round}": "Between rounds · next: {round}",
  "{n}/{max} 入席 · 四轮推进": "{n}/{max} seated · four rounds",
  "入席人物": "Who takes a seat",
  "下一位 · {name}": "Next · {name}",
  "进入{round} ›": "Begin {round} ›",
  // 批注席的名单：一项是「人名·学派」
  "{name}·{school}": "{name} · {school}",
  "{glyph}·{name}": "{glyph} · {name}",
  // 句读卡片的书名头与印章册的计数（见 scene/VerseCard.tsx、scene/SealsLayer.tsx）
  "《{book}·{chapter}》": "{book} · {chapter}",
  "已得 {n} 印": "{n} seals earned",
  // 印章之由来存的是拼好的一句中文（「游学·论语·学而」），显时逐节查表再合
  "{head}·{rest}": "{head} · {rest}",
  // 后世目录的一行（见 scene/AdapRow.tsx）：片名、体裁、年份、作者、一句提要
  "《{title}》（{kind} · {year}，{maker}）——{note}":
    "{title} ({kind}, {year}, {maker}) — {note}",
  "主持人已发追问（可改可留空沿用原题）。下一轮：{round}":
    "The moderator has put a follow-up (edit it, or leave it blank to keep the original). Next round: {round}",
  "客位陈词：写下你对「{topic}」之见，诸子将据你所言回应（Enter 陈词 · Shift+Enter 换行）":
    "Your turn: write what you think about \"{topic}\" and the philosophers will answer you (Enter to speak · Shift+Enter for a new line)",
  "回看圆桌": "Back to the table",
  "观点关系图": "Map of positions",
  "已藏 ✓": "Archived ✓",
  "藏之竹简 ◷": "Archive to bamboo ◷",
  "吕公评判中……": "Lü Buwei is judging…",
  "吕公评判 ✓": "Lü's verdict ✓",
  "吕公评判 ◷": "Lü's verdict ◷",
  "未能评判（未配 Key 或上游异常），可重试。":
    "Could not judge (no API key, or the upstream failed). Try again.",
  "点「吕公评判」请吕不韦综观全场、打分定判。":
    "Press \"Lü's verdict\" to have Lü Buwei survey the whole debate, score each speaker and pronounce.",
  "吕公评判 · 吕不韦 杂家": "Lü's verdict · Lü Buwei, Syncretist",
  "将本场凝为视频": "Render this debate as video",
  "左键看证据 · 右键译白话": "Left-click for evidence · right-click for plain language",
  "正在发言……": "Speaking…",
  "正在综观前文……": "Surveying what has been said…",
  "主持人·吕不韦：{line}": "Moderator Lü Buwei: {line}",
  "主持人 · 吕不韦": "Moderator · Lü Buwei",
  "点击左侧某段发言，查看其典籍证据。": "Click a speech on the left to see its textual evidence.",
  "此段为立场推演，未引原典。": "This passage is inferred from his position; no text is cited.",
  "（此条引自全文，未附白话）": "(quoted from the full text; no plain-language rendering)",
  "陈述": "Statement",
  "反驳": "Rebuttal",
  "质询": "Cross-examination",
  "总结": "Summation",
  "驳诘之链 · 由「发言者」指向「被驳/被诘者」":
    "Chains of rebuttal · arrows run from speaker to the one rebutted or questioned",
  "线愈粗则交锋愈多": "Thicker lines, more clashes",
  "驳×{n}": "reb×{n}",
  "诘×{n}": "qst×{n}",

  // ── 五、语录竹简 ─────────────────────────────────────────────
  "诸子语录": "Sayings of the philosophers",
  "藏之竹简": "Archive to bamboo",
  "尚未藏入竹简。于辩论席开一场圆桌、辩毕点「藏之竹简」即可在此展卷。":
    "Nothing archived yet. Run a round table from the debate panel, then press \"Archive to bamboo\" when it ends to unroll it here.",
  "每场圆桌辩论辩毕可藏入竹简，按日期＋议题命名；展卷可逐段配音回放，亦可导出长卷 PNG 分享。":
    "Each finished round table can be archived to a bamboo scroll, named by date and topic. Unroll it to hear each passage read aloud, or export the scroll as a PNG to share.",
  "正在誊抄…": "Transcribing…",
  "导出长卷 PNG": "Export scroll as PNG",
  "分享": "Share",
  "删除": "Delete",
  // 竹简卡片脚注里那一道「体裁」：存的是中文（见 world/anthology.ts 的 kind），显时才译
  "圆桌辩论": "Round-table debate",
  // 竹简长卷上的题签与标目（见 scene/BambooScroll.tsx）。简上的话本身不译——
  // 一片简只容一列字，再添一列英文，长卷就不成其为长卷了；那些话的英译在学宫里看。
  "{date} {topic} 语录": "{date} {topic} — sayings",
  "议题　{topic}": "Topic: {topic}",
  "参与": "Present",
  "{name}曰": "{name} said",
  "　白话：{text}": "　In plain words: {text}",
  "〔{verdict}〕": "[{verdict}]",

  // ── 六、罗盘与海图 ───────────────────────────────────────────
  "四库全书罗盘": "Compass of the Four Treasuries",
  "四库全书罗盘：外环二十四山，内环八卦，盘心四库，四隅经史子集各领一世界":
    "Compass of the Four Treasuries: twenty-four mountains on the outer ring, eight trigrams within, the Four Treasuries at the hub, and a world in each of the four corners — Classics, Histories, Masters, Belles-lettres",
  "四库全书总目": "General catalogue of the Four Treasuries",
  "四库": "Four Treasuries",
  "四库全书": "Complete Library of the Four Treasuries",
  // 四部连书一句：盘心与四库门面都用它，而盘心只有 260 单位宽，
  // 故取 Letters 而非 Belles-lettres——同一句在两处都得立得住，就取短的那个。
  "经 · 史 · 子 · 集": "Classics · Histories · Masters · Letters",
  "{total} 部 · {readable} 部可读": "{total} titles · {readable} readable",
  "四隅之内": "Within the four corners",
  "四部各居一隅：点其方框即入其世界，盘心即四库总目。":
    "Each of the four divisions holds a corner: click a frame to enter its world; the hub is the general catalogue.",
  "入其世界": "Enter its world",
  "未启": "Not yet open",
  "——此隅未启，其书先在架上。":
    " — this corner is not open yet, but its books are already on the shelf.",
  "{part}部 · {name}·{state}": "{part} · {name} · {state}",
  "上架一观 →": "See it on the shelf →",
  "朝代长卷": "Dynastic scroll",
  "文明长卷": "Civilizational scroll",
  "中西典籍 · 文明长卷": "Chinese and Western classics · civilizational scroll",
  "四库文脉 · 中西同期对照": "Four Treasuries lineages · Chinese–Western contemporaries",
  "四库脉络 · 朝代长卷": "Threads of the Four Treasuries · dynastic scroll",
  "四库脉络 · 书与书之牵连": "Threads of the Four Treasuries · how books connect",
  "跨世界评议": "Cross-world commentary",
  "母题 · 跨世界评议": "Motifs · cross-world commentary",
  "母题 · 诸世界各出其解": "Motifs · each world offers its own answer",
  "影音 · 跨媒介点评": "Screen · cross-media commentary",
  "影音总库 · 四库与西方": "Screen library · the Four Treasuries and the West",
  "世界文学航路": "Sea routes of world literature",
  "世界文学航路图": "Chart of the sea routes of world literature",
  "北大西洋海图：帆船沿红色虚线航路可驶向八个港口，港口即八部世界文学":
    "Chart of the North Atlantic: the ship sails the dashed red routes to eight ports, each port a work of world literature",
  "好望角 · 锚地": "Cape of Good Hope · anchorage",
  "世界文学 · 八部": "World literature · eight works",
  "世界文学 · 全库书架": "World literature · full library",
  "{n} 部 · 中英两卷": "{n} works · Chinese and English",
  // 架上一行：「中译36章 · 英文36章」
  "{vol}{n}章": "{vol}, {n} ch.",
  // 书目里的国别与年代（《哈姆莱特》此处作「莱」，与海图上的《哈姆雷特》两写并存）
  "哈姆莱特": "Hamlet",
  "希腊": "Greece",
  "德国": "Germany",
  "法国": "France",
  "英国": "England",
  "西班牙": "Spain",
  "约前8世纪": "c. 8th c. BCE",
  "架上总目 →": "Shelf catalogue →",
  "帆已满，循虚线而行，到港自会落锚。":
    "Sails full — following the dashed route; she will drop anchor on arrival.",
  "翻开此书 →": "Open this book →",
  "扬帆 · 回锚地": "Set sail · back to the anchorage",
  "八港世界文学": "Eight ports of world literature",
  "八港导览 · 全库书架": "Eight-port guide · full library",
  "与四库并列为两轴，交于母题": "A second axis beside the Four Treasuries, meeting at the motifs",
  "图按真经纬：岸线取 Natural Earth 1:50m，墨卡托投影，书各泊其所系之地。":
    "Drawn to true coordinates: coastlines from Natural Earth 1:50m on a Mercator projection, each book moored where it belongs.",
  "自好望角启航，点任一港，帆船便循真水道驶去，泊下便知其书；要径直读，点右缘书架上的书脊。":
    "Sail from the Cape of Good Hope: click any port and the ship follows a real sea lane; when she moors, the book is revealed. To read straight away, click a spine on the shelf at the right edge.",
  "返回锚地": "Back to the anchorage",
  "返回锚地：好望角": "Back to the anchorage: Cape of Good Hope",
  "驶往《{name}》{author} · {place}": "Sail to {name} — {author} · {place}",
  "读《{name}》 · {author} · {place}": "Read {name} · {author} · {place}",
  "翻开《{name}》{author} · {place}": "Open {name} — {author} · {place}",
  "返回罗盘": "Back to the compass",
  "返回海图": "Back to the chart",
  "返回天下": "Back to the world",
  "← 回盘面": "← Back to the compass",
  "北回归线": "Tropic of Cancer",
  "赤道": "Equator",
  "南回归线": "Tropic of Capricorn",
  "北 大 西 洋": "N O R T H   A T L A N T I C",
  "南 大 西 洋": "S O U T H   A T L A N T I C",
  "加 勒 比 海": "C A R I B B E A N",
  "地 中 海": "M E D I T E R R A N E A N",
  "几内亚湾": "Gulf of Guinea",
  "印 度 洋": "I N D I A N   O C E A N",
  "北 海": "N O R T H   S E A",

  // 罗经花上的四字。海图上它们是读图的刻度，不是印章上那种当画看的单字，故译。
  // 另立「罗经花·」一头，免与盘面方位名（北/东/南/西）相混——那边要的是整词。
  "罗经花·北": "N",
  "罗经花·東": "E",
  "罗经花·南": "S",
  "罗经花·西": "W",
  "正在驶往《{name}》": "Sailing to {name}",

  // 八部世界文学与其作者、泊地、题解
  "仲夏夜之梦": "A Midsummer Night's Dream",
  "莎士比亚": "Shakespeare",
  "希腊 · 雅典": "Greece · Athens",
  "仙王仙后怄气，迫克一点花汁，雅典林中人人颠倒——喜剧轻得能飞。":
    "A quarrel between fairy king and queen, a drop of Puck's flower juice, and everyone in the Athenian wood is turned upside down — comedy light enough to fly.",
  "奥德赛": "The Odyssey",
  "荷马": "Homer",
  "桓宽": "Huan Kuan",
  "陶渊明": "Tao Yuanming",
  "李白": "Li Bai",
  "杜甫": "Du Fu",
  "苏轼": "Su Shi",
  "王阳明": "Wang Yangming",
  "顾炎武": "Gu Yanwu",
  "王夫之": "Wang Fuzhi",
  "章学诚": "Zhang Xuecheng",
  "柏拉图": "Plato",
  "亚里士多德": "Aristotle",
  "奥古斯丁": "Augustine",
  "但丁": "Dante",
  "马基雅维利": "Machiavelli",
  "霍布斯": "Hobbes",
  "洛克": "Locke",
  "卢梭": "Rousseau",
  "康德": "Kant",
  "马克思": "Marx",
  "尼采": "Nietzsche",
  "弗洛伊德": "Freud",
  "托尔斯泰": "Tolstoy",
  "希腊 · 伊大卡": "Greece · Ithaca",
  "十年归途，海上的一切磨难与诱惑俱在其中——西方航海叙事的源头。":
    "Ten years of homecoming, with every trial and temptation the sea can offer — the fountainhead of Western sea narrative.",
  "堂吉诃德": "Don Quixote",
  "塞万提斯": "Cervantes",
  "西班牙 · 拉曼恰": "Spain · La Mancha",
  "以骑士小说之虚，行救世之实——第一部现代小说。":
    "Setting out to save the world on the strength of chivalric fiction — the first modern novel.",
  "茶花女": "La Dame aux Camélias",
  "小仲马": "Dumas fils",
  "法兰西 · 巴黎": "France · Paris",
  "茶花开落之间，巴黎名妓以身殉情——林译第一部，哀感顽艳自此始。":
    "Between the blooming and falling of camellias, a Parisian courtesan dies for love — Lin Shu's first translation, and the beginning of a whole sentimental vogue in China.",
  "浮士德": "Faust",
  "歌德": "Goethe",
  "德意志 · 莱比锡": "Germany · Leipzig",
  "以灵魂为注，与魔鬼赌一场不止息的追求。":
    "Staking a soul on a wager with the devil: striving that never rests.",
  "哈姆雷特": "Hamlet",
  "丹麦 · 厄尔锡诺": "Denmark · Elsinore",
  "复仇延宕之间，生与死、行动与思虑的处境尽出。":
    "In the delay of revenge, the whole predicament of life and death, action and thought.",
  "天演论": "Evolution and Ethics",
  "赫胥黎": "Huxley",
  "英格兰 · 伦敦": "England · London",
  "「物竞天择，适者生存」——严复译赫胥黎，一句惊醒千年沉梦。":
    "\"Things contend, nature selects; the fit survive\" — Yan Fu's Huxley, one sentence that woke a thousand-year sleep.",
  "月界旅行": "From the Earth to the Moon",
  "凡尔纳": "Jules Verne",
  "美利坚 · 佛罗里达": "United States · Florida",
  "巨炮一发，三人乘弹射月——凡尔纳的梦，经鲁迅的笔先到中国。":
    "One great cannon, three men in a shell, fired at the moon — Verne's dream reached China first through Lu Xun's pen.",
  "百年孤独": "One Hundred Years of Solitude",

  // 四隅与各世界的纪年、题解（worlds.ts 的 name/era/hint，渲染处包 t() 即可）
  "春秋战国": "Spring and Autumn & Warring States",
  "唐 · 神魔": "Tang · gods and demons",
  "唐·神魔": "Tang · gods and demons",
  "汉 · 太史公": "Han · the Grand Historian",
  "汉末 · 魏蜀吴": "Late Han · Wei, Shu, Wu",
  "荷马至近代": "Homer to the modern age",
  "十六区并置，二十一人各自行止；相遇即可开辩。":
    "Sixteen districts side by side, twenty-one figures each on his own course; where they meet, a debate can start.",
  "百家并起，各执一端；同席可辩，往复不休。":
    "A hundred schools rise, each holding its own ground; seated together they argue without end.",
  "一路向西，十三处皆难；人物不立说，只在处境里应对。":
    "West all the way, thirteen ordeals; these figures hold no doctrine — they only answer the situation in front of them.",
  "究天人之际，通古今之变；百三十篇，纪传之祖。":
    "Probing what lies between heaven and man, tracing the changes of past and present — a hundred and thirty chapters, the ancestor of all biography.",
  "九州分据，谋士各事其主；同一局势，各算一本账。":
    "The realm split nine ways, each strategist serving his own lord; one situation, and every man keeps his own ledger.",
  "七书七人，各在自己那部书里；无地可行，只在母题下对读。":
    "Seven books, seven authors, each inside his own work; no ground to walk — they meet only under a shared motif.",

  // ── 七、四库全书（门·函·书三级与检索/阅读） ─────────────────────
  "典籍 · 四库全书 · 经史子集":
    "Canon · Complete Library of the Four Treasuries · four divisions",
  "检索人物、书名、卷目、正文，如「庄子」「鼓盆」「桃园结义」":
    "Search people, titles, chapters or text — e.g. \"Zhuangzi\", \"the drum urn\", \"Peach Garden\"",
  "其人": "People",
  "其书": "Books",
  "其卷": "Chapters",
  "其文": "Text",
  "检得 {n} 人": "{n} people found",
  "检得 {n} 条": "{n} items found",
  "著录 {n} 部": "{n} titles catalogued",
  "可检正文 {n} 条": "{n} quotable passages",
  "又称 {names}": "also {names}",
  "…… 馀 {n} 部": "… plus {n} more",
  "正文语料载入中 {done}/{total} 部……": "Loading text corpus {done}/{total} books…",
  "正文一路限已切语料 {n} 部，馀书可检卷目与著录；《西游记》一部只及人物对白。":
    "Full-text search covers {n} titles whose quotable content was extracted; the remaining books are searchable by title and chapter names. Journey to the West coverage includes only character dialogue.",
  "正文一路为 {n} 部可读书的均匀抽样，命中可回原章阅读全文；卷目与著录覆盖全库。":
    "Text search uses an even sample from all {n} readable works; every hit opens the complete source chapter, while chapter titles and catalogue records cover the whole collection.",
  "四路皆未检得。换个词，或少打两三字试试。":
    "No results in any of the four directions. Try a different term, or use fewer characters.",
  "（只列前 {n}）": "(first {n} only)",
  "回此书": "Back to this book",
  "著者未详": "Author unknown",
  "撰人阙名": "Author unknown",
  "存目": "Listed only",
  "未分类": "Unclassified",
  "此书分片未取到。": "This book's shard could not be fetched.",
  "此章未取到。": "This chapter could not be fetched.",
  "目录载入中……": "Loading the catalogue…",
  "目录载入中…": "Loading the catalogue…",
  "书目载入中……": "Loading the shelf…",
  "正文载入中……": "Loading the text…",
  "目录未载入——public/siku/catalog.json 尚未生成或未随构建上传。":
    "Catalogue not loaded — public/siku/catalog.json has not been generated, or was not uploaded with the build.",
  "四库目录未载入——public/siku/catalog.json 尚未生成或未随构建上传。":
    "Four Treasuries catalogue not loaded — public/siku/catalog.json has not been generated, or was not uploaded with the build.",
  "目录里没有分片名为「{id}」的书——抽取时未选中，或分片未随构建上传。":
    "No book with shard name \"{id}\" in the catalogue — it was not selected during extraction, or the shard was not uploaded with the build.",
  "此书章目里未检得「{label}」，已开首章。":
    "\"{label}\" was not found among this book's chapters; the first chapter has been opened.",
  "收起": "Collapse",

  // 诸子头顶那一字的心绪。中文渲染的是「思 / 谈 / 辩」三个单字，此处另记三个词作键：
  // 「思」在典籍图谱里已作节点类型（思想，Idea），一键不能两义，故照 lang.ts 所说
  // 在中文侧分辨。这三条只走英文一路，中文版不经过它们。（见 scene/Figure.tsx）
  "凝神": "Thinking",
  "交谈": "Talking",
  "辩说": "Arguing",
  "展开": "Expand",
  "看此句的边批": "See the marginalia on this line",
  "通章批注": "Note on the whole chapter",
  "{n} 章 · 可读": "{n} chapters · readable",
  "著录 {total} 部 · 可读 {readable} 部": "{total} titles catalogued · {readable} readable",
  "检得 {n} 部": "{n} titles found",
  "（只列前 60）": " (first 60 shown)",
  "{n} 部": "{n} titles",

  // 书名（四库全书 77 部可读者，不含上文其他处已出）
  "仪礼": "Yili (Book of Etiquette and Ceremonial)",
  "周礼": "Zhouli (Rites of Zhou)",
  "诗经": "Shijing (Book of Odes)",
  "尔雅": "Erya (Approaching Correctness)",
  "国语": "Discourses of the States",
  "晏子春秋": "Annals of Yanzi",
  "传习录": "Instructions for Practical Living",
  "盐铁论": "Discourses on Salt and Iron",
  "说苑": "Garden of Persuasions",
  "新序": "New Prefaces",
  "春秋繁露": "Luxuriant Dew of the Spring and Autumn Annals",
  "孔子家语": "The School Sayings of Confucius",
  "列仙传": "Biographies of Exemplary Immortals",
  "道德经（老子）": "Daodejing (Laozi)",
  "了凡四训": "Four Lessons of Liaofan",
  "六祖大师法宝坛经": "Platform Sutra of the Sixth Patriarch",
  "佛说四十二章经": "Sutra in Forty-two Sections",
  "世说新语": "A New Account of Tales of the World",
  "唐诗三百首": "Three Hundred Tang Poems",
  "古文观止": "Guwen Guanzhi (Selections of Ancient Prose)",
  "诗品": "Shipin (Ranking Poems)",
  "人间词话": "Remarks on Lyric Poetry in the Human Realm",
  "文心雕龙": "The Literary Mind and the Carving of Dragons",
  "封神演义": "The Investiture of the Gods",

  // 著者（四库 64 人，需补录的 30 人）
  "公羊高": "Gongyang Gao",
  "列御寇": "Lie Yukou",
  "刘向集录": "compiled by Liu Xiang",
  "刘向（旧题）": "attributed to Liu Xiang",
  "吕望（旧题）": "attributed to Lü Wang",
  "吴楚材、吴调侯编": "selected by Wu Chucai and Wu Tiaohou",
  "周公旦": "Duke of Zhou",
  "墨翟": "Mo Di",
  "孔子弟子": "disciples of Confucius",
  "孟轲": "Meng Ke",
  "屈原等（刘向集）": "Qu Yuan and others (compiled by Liu Xiang)",
  "左丘明": "Zuo Qiuming",
  "左丘明（旧题）": "attributed to Zuo Qiuming",
  "庄周": "Zhuang Zhou",
  "惠能（法海录）": "Huineng (recorded by Fahai)",
  "朱熹（黎靖德编）": "Zhu Xi (compiled by Li Jingde)",
  "李耳": "Li Er",
  "王肃（旧题）": "attributed to Wang Su",
  "班固": "Ban Gu",
  "田穰苴（旧题）": "attributed to Tian Rangju",
  "管仲（旧题）": "attributed to Guan Zhong",
  "范晔": "Fan Ye",
  "荀况": "Xun Kuang",
  "蘅塘退士编": "selected by Hengtang Tuishi",
  "许仲琳": "Xu Zhonglin",
  "谷梁赤": "Guliang Chi",
  "迦叶摩腾、竺法兰译": "translated by Kasyapa Matanga and Zhu Falan",
  "陈寿（裴松之注）": "Chen Shou (commentary by Pei Songzhi)",
  "黄石公（旧题）": "attributed to the Elder of Huangshi",

  // 四部门面上的一行提要
  "十三经及其传注，诸子立论之所本": "The Thirteen Classics and their commentaries — the ground the masters argue from",
  "正史、编年、杂史，纪事之属": "Standard histories, annals and miscellaneous histories — the record of events",
  "诸子百家、兵农医术、释道杂说": "The hundred schools, war, farming and medicine, Buddhist and Daoist writings",
  "楚辞、别集、总集、词曲、诗文评": "Chu songs, collected and selected works, lyrics and arias, criticism",
  " · 可读 {n}": " · {n} readable",
  "{part}部 · {category} · {n} 章": "{part} · {category} · {n} chapters",
  "后世影音 · {n} 种": "Later screen works · {n}",
  "{part}部": "{part}",
  "{name}之门": "Gate of {name}",
  "经部": "Classics",
  "史部": "Histories",
  "子部": "Masters",
  "集部": "Belles-lettres",
  经: "Classics",
  史: "Histories",
  子: "Masters",
  集: "Belles-lettres",
  "返回典籍": "Back to the canon",
  "← 返回典籍": "← Back to the canon",
  "入点评席": "To the commentary bench",
  "经史子集四部、一千余部著录；选中者可逐章读":
    "Four divisions, over a thousand titles catalogued; selected works can be read chapter by chapter",
  "入四库 →": "Enter the Four Treasuries →",

  // 四库脉络长卷
  "四库脉络": "Threads of the Four Treasuries",
  "中西文明典籍": "Chinese and Western Classics",
  "中西文明典籍长卷": "Scroll of Chinese and Western classics",
  "文明长卷 · 中西五道": "Civilizational scroll · five Chinese–Western lanes",
  "四库 {total} 部、西典 {western} 部同期铺展；四库可读 {readable} 部，{edges} 条文脉关系贯之":
    "{total} Four Treasuries titles and {western} Western classics aligned in time; {readable} Chinese titles readable, joined by {edges} lineage relations",
  "四库 {total} 部、西典 {western} 部同期铺展；四库 {zhEdges} 条、西典 {westEdges} 条文脉关系":
    "{total} Four Treasuries titles and {western} Western classics aligned in time; {zhEdges} Chinese and {westEdges} Western lineage relations",
  "西方典籍": "Western classics",
  "按公元年代与中土典籍同期并置": "Aligned with Chinese texts by Common Era chronology",
  "代表性典籍 {n} 部": "{n} representative works",
  "{books} 部 · 正式关系 {edges} 条 · 驳回 {rejected} 候选":
    "{books} works · {edges} accepted relations · {rejected} candidates rejected",
  "中西文明典籍长卷：横轴依公元年代展开，纵为经史子集与西方典籍五道；七类关系只连接有文脉依据的四库典籍":
    "Scroll of Chinese and Western classics: chronology runs horizontally across five lanes; the seven lineage relations connect only Four Treasuries texts supported by evidence",
  "中西文明典籍长卷：横轴依公元年代展开，纵为经史子集与西方典籍五道；七类关系连接各自传统中具有可靠依据的典籍":
    "Scroll of Chinese and Western classics: chronology runs horizontally across five lanes; the seven relation types connect evidence-backed works within each tradition",
  "四库脉络长卷": "Scroll of the Four Treasuries' threads",
  "朝代长卷 · 经史子集四道": "Dynastic scroll · four lanes for the four divisions",
  // 卷题（章学诚《校雠通义》序）。书名作音译加一句意译：译作意思则失其为一部书，只作音译则不知所云
  "辨章学术，考镜源流": "Distinguish the branches of learning, mirror the sources of their streams",
  "章学诚《校雠通义》": "Zhang Xuecheng, Jiaochou tongyi (On Collation)",
  "四库全书朝代长卷：横轴自先秦至清，纵为经史子集四部，一千零一十九部同宽同题，书间以传注承学取材诸线相连":
    "Dynastic scroll of the Four Treasuries: pre-Qin to Qing along the horizontal axis, the four divisions as lanes, all 1,019 titles drawn at one width with their names, linked by lines of commentary, transmission and borrowing",
  "著录 {total} 部依代铺展，其中可读 {readable} 部；{edges} 条关系贯之，跨部 {cross} 条":
    "{total} catalogued titles laid out by dynasty, {readable} of them readable; joined by {edges} relations, {cross} crossing divisions",
  "取消聚焦": "Clear focus",
  "只画经史子集四部之间的线，部内之线暂隐": "Draw only the lines between divisions; lines within a division are hidden",
  "只看跨部": "Cross-division only",
  "入此书 · 读其正文 →": "Open this book · read the text →",
  "此书尚未系线。": "This book has no relations yet.",
  // 两等之别不在大小而在浓淡：脊色淡、题作淡墨、脊下一道浅痕。英文亦照其样子说
  "实脊可读 · 淡脊存目": "Solid spine: readable · pale spine: catalogue only",
  "实脊可读 · 淡脊仅著录": "Solid spine: readable · pale spine: catalogue only",
  "横向展卷 → 点脊看著录 · 双击可读之书进入正文 · 西典与四库按年代同期并置":
    "Unroll sideways → click a spine for metadata · double-click a readable title · Western and Chinese classics are aligned by date",
  "{origin} · {category} · 正文可读": "{origin} · {category} · full text available",
  "此书已收入代表性目录，正文尚未接入。": "This representative work is catalogued; its full text is not yet available.",
  "同期对照": "Contemporary comparison",
  "此书按成书年代与中国典籍并置；主题相似不自动视作文脉传承。":
    "This work is aligned with Chinese texts by date; thematic similarity is not treated as evidence of transmission.",
  "西典关系 · {n} 条": "Western-text relations · {n}",
  "此书暂无通过审定的关系；主题相似不自动视作文脉传承。":
    "No reviewed relation is available for this work; thematic similarity alone is not treated as transmission.",
  "原文可证": "Primary-text evidence",
  "学术来源": "Scholarly source",
  "横向展卷 → 点脊看关系 · 双击入书 · 存目之书点之见其著录":
    "Unroll sideways → click a spine for its relations · double-click to open · click a pale spine for its catalogue entry",
  "{title}（存目，未切正文）": "{title} (catalogue entry only, no text)",
  "{title} · {dynasty} · {category} · 存目（未切正文）":
    "{title} · {dynasty} · {category} · catalogue entry only (no text)",
  "{part}部 · {category} · 存目": "{part} · {category} · catalogue entry only",
  // 悬停名签第二行（可读之书只书代与类，存目之书另缀「存目」二字）
  "{dynasty} · {category}": "{dynasty} · {category}",
  "{dynasty} · {category} · 存目": "{dynasty} · {category} · catalogue only",
  // 段首朝代的 tooltip：窄段写不下名与起讫，全文留在此（中文用全角冒号，英文回半角）
  "{era}：{sub}": "{era}: {sub}",
  "此书仅著录于目，正文未切，故读不得。":
    "This title is only catalogued; its text has not been sliced, so it cannot be read.",
  "{title}，{dynasty}，{author}": "{title}, {dynasty}, {author}",
  "{title}，{dynasty}，{author}，存目未切正文":
    "{title}, {dynasty}, {author}, catalogued only, text not sliced",
  "{title} · {dynasty} · {author} · {chapters} 章 · {rels} 条关系":
    "{title} · {dynasty} · {author} · {chapters} chapters · {rels} relations",
  "{title} · {dynasty} · {author} · 存目 · {rels} 条关系":
    "{title} · {dynasty} · {author} · catalogue only · {rels} relations",
  "牵出跨部 {n} 线": "{n} lines out of this division",
  "{span} · {n} 部": "{span} · {n} titles",
  "一跳关系 · {n} 条": "Direct relations · {n}",
  // 悬停在一条关系线上：两端书名、关系名与依据
  "{from} —{rel}→ {to}：{note}": "{from} —{rel}→ {to}: {note}",
  "{dynasty} · {author}": "{dynasty} · {author}",

  // 朝代。一千余部铺开后，代序由十一增至二十，各代英文名用治史通行的那一套
  // （南朝宋作 Liu Song 以别于赵宋；北齐、南朝齐各加方位，不致两「Qi」相混）。
  "先秦": "Pre-Qin",
  汉: "Han",
  魏: "Wei",
  "蜀汉": "Shu Han",
  晋: "Jin",
  "北魏": "N. Wei",
  "南朝宋": "Liu Song",
  "南朝齐": "S. Qi",
  "南朝梁": "Liang",
  "北齐": "N. Qi",
  隋: "Sui",
  唐: "Tang",
  "五代": "Five Dynasties",
  宋: "Song",
  // 女真之金单字与五行之「金」（Metal，见下「当德」一节）同形，裸键必撞，故加「代」字别之
  "金代": "Jin (Jurchen)",
  元: "Yuan",
  明: "Ming",
  清: "Qing",
  // 末二段不是朝代：一收清亡以后之书，一收成书之年无考者（见 scripts/siku-era.mjs 卷首）
  "近今": "Modern",
  "代未详": "Date unknown",
  "三代以降": "Since the Three Dynasties",
  // 其余朝代起讫全是数字，两种语文同形，不必立条；只有汉的「前」字须改作 BC。
  "前206–220": "206 BC – AD 220",
  // 末二段无年可纪，各缀一句其例
  "1912 以降": "1912 onward",
  "成书之年无考": "Date of composition unknown",
  // 四库类目。长卷铺全目之后，四十余类都要上图，故此处收齐
  "十三经": "Thirteen Classics",
  "十三经注疏": "Commentaries on the Classics",
  "经学其他": "Other classical studies",
  "正史": "Standard histories",
  "编年": "Annals",
  "别杂史": "Other histories",
  "野史": "Unofficial histories",
  "载记": "Regional records",
  "传记": "Biography",
  "史评": "Historical criticism",
  "地理": "Geography",
  "职官": "Offices and officials",
  "政书": "Statecraft",
  "目录": "Bibliography",
  "儒家": "Confucian",
  "道家": "Daoist",
  "法家": "Legalist",
  "兵家": "Military",
  "农家": "Agrarian",
  "杂家": "Syncretist",
  "释家": "Buddhist",
  "术数": "Divination",
  "医家": "Medicine",
  "科技": "Mathematics and technology",
  "艺术": "Arts and games",
  "书画": "Calligraphy and painting",
  "谱录": "Connoisseurship",
  "类书": "Encyclopaedias",
  "蒙学": "Primers",
  "楚辞": "Chu ci",
  "别集": "Individual collections",
  "总集": "Anthologies",
  词: "Ci lyrics",
  曲: "Drama and arias",
  "诗文评": "Literary criticism",
  "小说": "Fiction",
  // 四库脉络的七型关系
  传: "Comm.",
  "传注所本": "Commented upon by",
  "下有传注": "Has commentaries",
  承: "Succ.",
  "承自": "Succeeds",
  "下启": "Opens the way to",
  采: "Draws",
  "取材自": "Draws material from",
  "为其所取": "Material drawn by",
  驳: "Disp.",
  "见难于": "Challenged by",
  "难及": "Challenges",
  续: "Cont.",
  "续自": "Continues",
  "下续": "Continued by",
  托: "Attr.",
  "依托于": "Falsely ascribed to",
  "为其所托": "Name borrowed by",
  // 既是详情栏里的说法，又是脚注上那枚线型钮，故取一个两处都读得通的短词
  "并称": "Paired",

  // ── 八、边批与白话（四库／世界文学共用） ───────────────────
  "边批": "Marginalia",
  "Marginalia · 边批": "Marginalia",
  "批注": "Annotate",
  "Annotate · 批注": "Annotate",
  "批注此句 →": "Annotate this line →",
  "译白话": "Plain language",
  "译为白话 →": "Render in plain language →",
  "再译一次 →": "Translate again →",
  "译中文": "Into Chinese",
  "译为中文 →": "Render into Chinese →",
  "白话": "Plain language",
  "原书": "Original",
  "对照": "Parallel",
  "中译": "Chinese",
  "英文": "English",
  "中英对照": "Chinese–English parallel",
  "中译卷": "Chinese translation",
  "英文原书卷": "English original",
  "选中正文一句，批注或译白话": "Select a line of the text to annotate it or render it in plain language",
  "选中正文一句，即可批注": "Select a line of the text to annotate it",
  "在正文中拖选一句，可以查看译文、注己见或请诸子批注。":
    "Drag-select a line in the text to see a rendering, add your own note, or ask a philosopher to annotate it.",
  "在正文中拖选一句，可以注己见或请人批注。":
    "Drag-select a line in the text to add your own note, or ask someone to annotate it.",
  "撤去此处批注": "Remove this note",
  撤: "Remove",
  删: "Delete",
  "存注": "Save note",
  "{n} 处": "{n} notes",
  "未能译出——模型未应或未配 Key，可再试。":
    "Could not translate — the model did not answer, or no API key is configured. Try again.",
  "未能译出——网络不通，可再试。": "Could not translate — no network. Try again.",
  "（未能译出——模型未应或未配 Key。）":
    "(Could not translate — the model did not answer, or no API key is configured.)",
  "（诸子未及应，稍后再试。）": "(No reply yet — try again shortly.)",
  "（其人未及应，稍后再试。）": "(No reply yet — try again shortly.)",
  "（未及应，稍后再试。）": "(No reply yet — try again shortly.)",
  "（未及应，稍后再问。）": "(No reply yet — ask again shortly.)",
  "（一时语塞，未及应。）": "(At a loss for words.)",
  "注一句己见……": "Add a note of your own…",
  "批注中…": "Annotating…",
  "请其批注": "Ask for a note",
  "请批注": "Ask for a note",
  "择一人请其批注……": "Choose someone to annotate…",
  "择一子请其批注……": "Choose a philosopher to annotate…",
  "问诸子": "Ask a philosopher",
  "诸子": "Philosophers",
  注: "Note",
  "客注": "Guest's note",
  "西方文哲": "Western writers",

  // ── 九、世界文学书架 ─────────────────────────────────────────
  "典籍 · 世界文学 · 与四库并立":
    "Canon · world literature · a second axis beside the Four Treasuries",
  "世界文学书架": "Shelf of world literature",
  "目录未载入——public/worldlit/ 尚未生成或未随构建上传。":
    "Catalogue not loaded — public/worldlit/ has not been generated, or was not uploaded with the build.",
  "书架上没有「{id}」这一部。": "There is no \"{id}\" on this shelf.",
  "此卷分片未取到。": "This volume's shard could not be fetched.",
  "此书暂无可读之卷。": "No readable volume for this book yet.",
  "书卷载入中……": "Loading the volume…",
  "← 书架": "← Shelf",
  "回书架": "Back to the shelf",
  章: "ch.",
  "后世影音": "On screen",

  // ── 十、典籍检索与知识图谱 ─────────────────────────────────
  "查其所本": "Trace a source",
  "句读": "Read line by line",
  "输入议题或词句，如「战争」「赏罚」「无用之用」":
    "Enter a topic or phrase — e.g. \"war\", \"reward and punishment\", \"the use of the useless\"",
  "引典": "Curated passages",
  "（即时）": "(instant)",
  "引典未检得。": "No curated passage found.",
  "全文": "Full text",
  "（{mode}）": "({mode})",
  "检索中…": "Searching…",
  "检索中……": "Searching…",
  "语义": "semantic",
  "全文未检得（或未生成全文向量，降级关键词）。":
    "Nothing found in the full texts (or no full-text vectors were built, so keyword search was used).",
  "‹ 返回": "‹ Back",
  "← 返回": "← Back",
  "‹ 返回书目": "‹ Back to the shelf",
  "逐句读": "Read line by line",
  "四库无单行本，此为随包带的全文：逐句有白话，可注、可请诸子批注":
    "Not a separate title in the Four Treasuries — this full text ships with the app: plain language for every line, open to your notes and to the philosophers'",
  "附·《礼记》之篇": "Appended · chapters of the Book of Rites",
  // 书架：总说、书脚下那一行、附录一栏的书脚
  "诸子名下之书，四库正文已切者 {n} 部，按家分列；点一部即逐章读，可译白话、可挂边批。":
    "{n} titles under the philosophers' names have their full text cut into chapters here, listed by school. Open one to read it chapter by chapter, render it in plain language, or write in the margin.",
  "{who} · {n} 章": "{who} · {n} chapters",
  "《礼记》篇 · {n} 章": "A chapter of the Book of Rites · {n} sections",
  "书目取中……": "Fetching the shelf…",
  "书目未取得（四库分片未就或网络不通）；引典仍可检手写选本。":
    "Shelf not available (shards missing or no network); curated passages are still searchable.",
  "{note}（{dynasty}·{category}，{items} 段可引）":
    "{note} ({dynasty} · {category}, {items} quotable passages)",
  "打开典籍知识图谱": "Open the canon knowledge graph",
  "典籍图谱": "Canon graph",
  "原文所载": "As the text has it",
  "看原文出处": "See the source passage",
  "出处原文尚在载入。": "The source passage is still loading.",
  "按话题·书·人物看不同的知识图，节点可注、可请诸子批注":
    "See the graph by topic, book or figure; annotate any node, or ask a philosopher to",
  "百家图谱": "Graph of the hundred schools",
  "典籍 · 知识图谱 · 环图版": "Canon · knowledge graph · ring layout",
  "检索": "Search",
  "全图": "Whole graph",
  "后世": "Later ages",
  "思想": "Ideas",
  "画图": "Draw",
  题: "Topic",
  "输入一个词看它的图谱，如「战争」「赏罚」「无为」「仁」":
    "Enter a word to see its graph — e.g. \"war\", \"reward and punishment\", \"non-action\", \"benevolence\"",
  "输入词后点「画图」。": "Enter a word, then press \"Draw\".",
  "尚未检索。在左侧输入一个词，点「画图」。":
    "Nothing searched yet. Enter a word on the left and press \"Draw\".",
  "输入一个词，点「画图」，就把它在典籍里的图谱铺开——哪些书提到、哪几句、对应谁说的。":
    "Enter a word and press \"Draw\" to spread out its graph across the canon: which books mention it, which lines, and who said them.",
  "一张大图谱里：先秦人物（师承、渊源、影响、交游）、典籍（注解、征引）、思想（承变、对立）皆在，十种关系线按色区分。点任一节点看详情，可顺藤跳焦点。顶部四钮按类隐显——「后世」收着汉以后的著者与旧题之书（朱熹、曹雪芹、山海经…），点开即并入同一环。":
    "One large graph holding it all: pre-Qin figures (teachers, origins, influence, acquaintance), texts (commentary, citation) and ideas (descent, opposition), with ten kinds of relation distinguished by colour. Click any node for details and follow the threads to shift focus. The four buttons at the top show or hide each class — \"Later ages\" holds post-Han authors and older titles (Zhu Xi, Cao Xueqin, the Classic of Mountains and Seas…); switch it on and they join the same ring.",
  "点节点看详情，关系可顺藤跳焦点": "Click a node for details; follow a relation to shift focus",
  "← 返回全图": "← Back to the whole graph",
  "跳至此节点": "Jump to this node",
  "关系": "Relations",
  "暂无直连关系。": "No direct relations.",
  "相关原句": "Related passages",
  "相关句": "Related lines",
  "幽灵节点不入典籍，无引句。": "A ghost node has no text in the library, so no quotations.",
  "暂未收录相关原句。": "No related passage recorded yet.",

  // ── 此断何据 ──────────────────────────────────────────────
  // 点开「关系」里的一条边，就地给它找原文作证（见 edgeEvidence.ts）。
  // 这一段的要害是**空手要说空手**：「检不出」「无从查证」「无须作证」三件事
  // 在中文里分得很清，英文不可并作一句 "no evidence"——那会把「此处查不到」
  // 读成「查无此说」。
  "此断何据": "On what evidence?",
  "看此断何据": "See the evidence for this",
  "跳至": "Go to ",
  "正取原文…": "Fetching the passages…",
  "此类边无须原文作证。": "This kind of relation needs no passage to attest it.",
  "断语仍立，据暂付阙。": "The judgement stands; the evidence is wanting for now.",
  "检不出可作证的原文。这一断仍是编者的断语——不拿沾边的句子来凑。":
    "No attesting passage could be found. This remains the editor's judgement — we will not pad it out with lines that merely touch on the matter.",
  "原文": "Passages",
  // 语义一路与字面一路各标其名，读者才知道这一句是怎么找出来的
  "全文·字面": "full text · literal",
  "互见": "Mentions of each other",
  "称「{p}」{n}段": " calls him “{p}” in {n} passages",
  // edgeEvidence.ts 的 why：一边一说，面板第一行就讲明下面几句在证什么
  "著述是书目上的事实，不待原文作证——点开那部书即见其文。":
    "Authorship is a fact of the catalogue and needs no passage to attest it — open the book and there is its text.",
  "师承之证，在弟子书中称述其师。":
    "A teacher-pupil tie is attested where the pupil's book speaks of his master.",
  "「出于」谓此家自彼家出，其证在后出者书中对前者的因革——既承其问，又变其答。":
    "“Descends from” says this school came out of that one; the evidence lies in how the later book both keeps the earlier one's questions and alters its answers.",
  "影响之证，在受者书中承用、辩驳或改写施者之说。":
    "Influence is attested where the receiving book takes up, disputes or rewrites the other's doctrine.",
  "交游之证，在两人书中互见其名。":
    "Acquaintance is attested where each man's book names the other.",
  "「主张」谓此说是{from}所持。其证当在他自家书里讲这件事的那几句——不是别人替他说的，也不是这几个字碰巧出现过。":
    "“Holds” says the doctrine is {from}'s own. The evidence must be the lines in his own book where he argues it — not someone else speaking for him, and not the mere occurrence of the words.",
  "「非」谓{from}斥此说。其证当在他自家书里驳这件事的那几句。":
    "“Rejects” says {from} denounces the doctrine. The evidence must be the lines in his own book where he argues against it.",
  "检索认得出「这段在说此事」，认不出「他是赞成还是反对」。下面几句是他论及此说之处，是非是从，看文自断。":
    "Search can tell that a passage is about the matter; it cannot tell whether he is for or against. The lines below are where he treats the doctrine — whether he affirms or denies it, read and judge for yourself.",
  "「承变」谓{b}自{a}来而有所变。其证当在两说并见、可见其因革之处。":
    "“Descends and alters” says {b} came from {a} and changed it. The evidence must be where the two appear together and the alteration can be seen.",
  "「对立」谓{a}与{b}相抵。其证当在两说并见、可见其相攻之处。":
    "“Opposes” says {a} and {b} are at odds. The evidence must be where the two appear together and the conflict can be seen.",
  "并见不等于相承或相对。下面是两说同在一段的几处，承变与否仍须读文乃定。":
    "Appearing together is not the same as descent or opposition. Below are passages holding both; whether one descends from the other still has to be settled by reading.",
  "注解之证，在《{annotator}》中解说《{target}》之处。":
    "A commentary is attested where {annotator} expounds {target}.",
  // sem.label：面板上给语义那一路标个名，读者才知道下面几句是在哪儿找的
  "{to}书中论及{from}处": "Where {to}'s books treat {from}",
  "{from}书中言此处": "Where {from}'s own books argue it",
  "{from}书中论及{idea}处": "Where {from}'s own books treat {idea}",
  "{a}与{b}并见处": "Where {a} and {b} appear together",
  "《{annotator}》中及{target}处": "Where {annotator} touches on {target}",
  "《{annotator}》中及《{target}》处": "Where {annotator} touches on {target}",
  // 两处「无从查证」。与「检遍了而检不出」是两件事，必须分开说。
  "全文池里没有他名下的书（只铺到先秦二十六部，汉以后的著者与几部无分片之书不在内），故此处只有选本那一路。检不出不等于无此说。":
    "The full-text pool holds no book under his name (it reaches only the 26 pre-Qin titles, leaving out post-Han authors and a few books with no shard), so only the curated route is available here. Finding nothing is not the same as there being nothing to find.",
  "此人两池皆无：全文池只铺到先秦二十六部，选本池收的是诸子语录，都没有他的文字。故此断暂无原文可验——不是查无此说，是此处无从查证。":
    "Neither pool holds this man: the full-text pool reaches only the 26 pre-Qin titles, and the curated pool gathers sayings of the philosophers. Neither has his words. So the judgement has no passage to verify it for now — not that the doctrine is absent, but that there is no way to check it here.",
  "诸子点评 →": "Philosophers' commentary →",
  "呈影音请诸子点评": "Submit a clip for the philosophers to comment on",
  "共 {n} 句{more}，{books} 部书，{people} 位诸子。点节点看详情。":
    "{n} lines{more}, {books} books, {people} philosophers. Click a node for details.",
  // 环图版多一句「{g}」（前面接「图谱另载 N 部」那句），故与上一条分列
  "共 {n} 句{more}，{books} 部书，{people} 位诸子。{g}点节点看详情。":
    "{n} lines{more}, {books} books, {people} philosophers. {g}Click a node for details.",
  "图谱另载 {k} 部（此词散在 {all} 部、{df} 段）。":
    "The graph records {k} more books (the word is spread over {all} books and {df} passages). ",
  "共检得 {n} 句，涉及 {books} 部书、{people} 位诸子。":
    "{n} lines found, across {books} books and {people} philosophers.",
  "（已取前 {n}）": " (first {n} shown)",
  "佚名": "Anonymous",
  典: "Text",
  思: "Idea",
  "全文句": "Full text",
  "精选片段": "Curated",
  "见于": "found in",
  载: "contains",
  言: "said by",
  "题见于书": "topic found in book",
  "书载其句": "book contains the line",
  // 图谱另载那一类点：签、悬停提示、图例三处同说一件事——书里有此题，句不在环上，点开可读
  "{name} · {n} 段": "{name} · {n} seg.",
  "图谱 {n} 段 · 点看书中原文": "{n} passages in the graph · click to read them",
  "图谱另载（虚线 · 点开可读其原文）": "also in the graph (dashed · click to read its passages)",
  // 点开之后那一行按实情三说：排在前十之外／无字面相合／此书不在全文池
  "图谱所载 · 书中 {n} 段提及，其句未进前 {k} 句": "In the graph · {n} passages mention it; its lines fell outside the top {k}",
  "图谱所载 · 书中 {n} 段提及此题，全文无字面相合之句": "In the graph · {n} passages on this topic; no literal match in the full text",
  "图谱所载 · 书中 {n} 段提及，此书不在二十六部全文之列": "In the graph · {n} passages mention it; this book is not among the 26 full texts",
  "图谱所载 · 书中 {n} 段提及（全文未载上，故无句可比）": "In the graph · {n} passages mention it (full text failed to load, so no lines to compare)",
  "句为所言": "line said by",
  "影音": "Screen",
  "检索图谱 · 内容取自典籍": "Search graph · drawn from the canon",

  // 检索面「图谱所记」一段：检索只取前十句，答「哪些书提到」会少算，故另报图谱统计。
  "图谱所记": "What the graph records",
  "图谱里没有「{q}」这个词目，下面各数是其中「{w}」的。":
    "The graph has no entry for “{q}”; the figures below are for “{w}” within it.",
  "「{w}」见于 {df} 段，散在 {k} 部，其中 {b} 部不止一段。":
    "“{w}” appears in {df} passages across {k} books, {b} of them in more than one passage. ",
  // 两句互斥（以六部为界），皆接在上句之后，故同以空格起
  "诸书皆讲，是通义。": "All the books discuss it: this is common ground.",
  "几为一家独有，是宗旨。": "Almost one school's alone: this is a tenet.",
  // 「常相伴」出自文本共现的互信息，不是替它想的近义词，故不作 "related words"
  "常相伴": "Often together with",
  "改检此词": "Search this word instead",
  "全书分布": "Across the books",
  "{n} 段": "{n} passages",
  " · 检得其句": " · lines found",
  "图谱所载 · 书中 {n} 段提及，检索未检出其句":
    "In the graph · {n} passages mention it; the search turned up none of its lines",
  "出处未取到（这部无分片可取，或全文尚未载入）":
    "Source not retrieved (this book has no shard to fetch, or the full text has not loaded)",
  "（图谱：全书 {k} 段）": " (in the graph: {k} passages in all)",
  "诸句": "Lines",
  无: "none",
  "其所言": "His lines",
  "未选中。": "Nothing selected.",
  "（全文）": " (full text)",
  // 检索面上「{题}」那行大字：中文用引号括起，英文照词表一贯的做法改作双引号
  "「{q}」": "“{q}”",
  "典籍 · 提及此题 {n} 句": "Canon · {n} lines mention this topic",
  "论及此题 {n} 句": "{n} lines on this topic",

  // ── 十一、百家演变脉络图 ───────────────────────────────────
  "诸子师承 · 思想典籍时序长卷":
    "Teachers and schools · a chronological scroll of ideas and texts",
  "诸子师承时序图": "Chronology of philosophical descent",
  "节点类型显隐": "Show or hide node classes",
  "着色模式": "Colour by",
  "学派色": "School",
  "地域色": "Region",
  "时序扫光": "Sweep by date",
  "暂停": "Pause",
  "播放时序": "Play the sweep",
  "年代游标": "Date cursor",
  "全时段": "All dates",
  "重置时序": "Reset the sweep",
  "前{year}年": "{year} BC",
  // 成书之年。一段写作 "104–91 BC"：同在公元前者纪元只出一次，见 siku.ts 的 yearText
  // 公元后不带 AD——目下书名年份无歧义，带上反倒像碑铭；只公元前须标，不标便读反了
  "{year}年": "{year}",
  "前{a}–{b}年": "{a}–{b} BC",
  "{a}–{b}年": "{a}–{b}",
  "成书": "Compiled",
  "成书之年": "Year compiled",
  "成书 {y}": "Compiled {y}",
  "{base} · {y}": "{base} · {y}",
  // 底轴刻度只写年数，不带「年」
  "前{year}": "{year} BC",
  // ▶ 旁的两字
  "时序": "Timeline",
  "字 {courtesy}": "styled {courtesy}",
  // 关系 chip 的悬停字样，与节点悬停提要
  "{label}（{kind}）": "{label} ({kind})",
  "{name}：{note}": "{name}: {note}",
  "师承": "Taught by",
  "出于": "Derives from",
  "影响": "Influence",
  "著述": "Wrote",
  "主张": "Holds",
  "承变": "Descent",
  "注解": "Commentary",
  非: "Opposes",
  "交游": "Acquainted",
  "对立": "Opposition",
  // 图例上那个钮与它的悬停：「事实／解释」之分是全图最要紧的一条分际——
  // 事实类的边常摊开，解释类（义理之断）默认收起，不可译得像只是「其他边」。
  "解释类": "Interpretive",
  "「事实」类（著述/师承/注解/出于）常在图上；「解释」类（主张/影响/承变/对立/非/交游）是义理之断，默认收起，点中一个节点也会放出它那几条":
    "Factual relations (wrote / taught by / commentary / derives from) are always drawn; interpretive ones (holds / influence / descent / opposition / opposes / acquainted) are judgements of doctrine and stay hidden by default — clicking a node also brings out its own.",
  "四层同心环，由内而外：后世 → 人物 → 典籍 → 思想。学派扇区贯通四环，故「孔子 → 《论语》 → 仁」落在同一个方向上，边只在相邻两环之间走短线，不横穿圆心。常在图上的是「事实」类的边（著述/师承/注解/出于）；「主张/影响/承变/对立/非/交游」是义理之断，默认收起——点中一个节点便放出它的全部关系，要通览则按图例上那个钮。顶部四钮按类隐显，「后世」收着汉以后的著者与旧题之书（朱熹、曹雪芹、山海经…）。":
    "Four concentric rings, inward to outward: later ages → figures → texts → ideas. Each school holds one sector across all four rings, so Confucius → the Analects → benevolence all lie on the same bearing, and edges run short hops between neighbouring rings instead of crossing the centre. Always drawn are the factual relations (wrote / taught by / commentary / derives from); holds / influence / descent / opposition / opposes / acquainted are judgements of doctrine and stay hidden by default — click a node to bring out all of its relations, or use the button in the legend to see them all at once. The four buttons at the top show or hide each class; \"Later ages\" holds post-Han authors and older titles (Zhu Xi, Cao Xueqin, the Classic of Mountains and Seas…).",
  "师承 · 渊源 · 所受影响": "Teachers · origins · influences received",
  "受影响": "Influenced by",
  "门人 · 流派 · 所影响": "Disciples · school · influence given",
  "门人": "Disciples",
  "所出": "Derived from",
  "所影响": "Influenced",
  "非（所反对之思想）": "Opposes (ideas rejected)",
  "非（反对者）": "Opposed by",
  "著者": "Author",
  "注解 · 征引此书": "Commentaries on and citations of this book",
  "此书所注解 · 征引": "What this book comments on and cites",
  "原典篇章": "Chapters",
  "相关原典": "Related texts",
  "主张者": "Held by",
  启: "Opens the way to",
  "关闭详情": "Close details",
  "幽灵节点": "Ghost node",
  "横轴公元前纪年（左古右今），诸子按约生年置点、以学派分道；每道分上中下三行——典籍·人物·思想，三类分行互不遮挡。点节点聚焦其一跳关系、右侧详展典籍篇章；▶ 时序按年代依次点亮；可切「学派色／地域色」观思想之地域传播。可左右上下拖动滚动。":
    "The horizontal axis runs in years BC (older to the left). Each philosopher is placed at his approximate birth year, in a lane for his school; every lane has three rows — texts, figures, ideas — so the three classes never overlap. Click a node to focus its one-hop relations and list its chapters at the right; ▶ lights the nodes up in date order; switch between school and regional colouring to watch ideas spread. Drag to scroll in any direction.",
  "{name} · 约前{year}年 · {school}": "{name} · c. {year} BC · {school}",
  "{name} · {school} · 约成书前{year} · {note}":
    "{name} · {school} · written c. {year} BC · {note}",
  "{name} · {school} · 约前{year} · {note}": "{name} · {school} · c. {year} BC · {note}",
  "{school}　约成书于前{year}年": "{school} · written c. {year} BC",
  "{school}　约盛行于前{year}年": "{school} · current c. {year} BC",

  // ── 十三、母题跨世界评议 ───────────────────────────────────
  "同一世界之内辩命题，跨世界之间只评议母题——查看不同时代与国家之间的人物的不同看法。":
    "Within one world, figures debate a proposition; across worlds they only comment on a shared motif — see how people of different ages and countries read the same situation.",
  "现有母题拥有各世界的原文为锚；卷末一枚空签，客可自立一题。":
    "Each existing motif is anchored by a passage from every world; a blank tab at the end lets you raise your own.",
  "← 返回母题": "← Back to the motifs",
  "{n} 轴并观 · {m} 锚": "{n} axes side by side · {m} anchors",
  "锚点：{n}": "Anchors: {n}",
  "{n} 锚（检得）": "{n} anchors (retrieved)",
  "· 已评 {n} 则": "· {n} comments so far",
  "有 {n} 处锚点未检得——语料重抽后原句或已换，可改策展记录的片段。":
    "{n} anchors did not resolve — the passages may have changed when the corpus was rebuilt; edit the curated excerpt.",
  "客自立": "Yours",
  "客自立之题 · {state}": "Your own motif · {state}",
  "客自立 · 未系锚": "Your own · unanchored",
  "无锚": "no anchor",
  "＋ 自立一题": "+ Raise a motif",
  "题名，如「乡愁」「背叛」": "A name, e.g. \"homesickness\", \"betrayal\"",
  "立此题": "Raise it",
  "取消": "Cancel",
  "撤此题": "Withdraw this motif",
  "撤锚": "Drop anchor",
  "参考锚点 · 每轴各检一条": "Reference anchors · one per axis",
  "每轴各检一条最合的原文作参照。检不到的轴宁可空着，不拿不相干的句子凑数。":
    "One best-matching passage per axis, for reference. An axis with no match is left blank rather than padded with something irrelevant.",
  "另检一遍": "Search again",
  "检得 {n} 条，是就题意检来的候选，非古人原为此题而发；不合意可撤。":
    "{n} found — candidates matched to the motif, not passages written for it. Drop any that do not fit.",
  "诸轴皆未检得合意之句——此题的字面在诸书里无着落。可改个题名再试，或就这么无锚评议。":
    "No axis turned up a fitting line — the wording of this motif has no foothold in the books. Try renaming it, or comment without an anchor.",
  "这题是你自己立的，还没有句子对上。可按上面「参考锚点」让各轴各检一条原文作参照，":
    "This motif is your own and nothing has matched it yet. Use \"Reference anchors\" above to pull one passage per axis,",
  "也可径到页尾「再邀一位」请人来评——请了谁，就开出谁那一轴的一栏。":
    "or go straight to \"Invite another\" at the foot of the page — whoever you invite opens a column on their axis.",
  "此轴无锚点，所请之人凭自家处境作答。": "This axis has no anchor; those invited answer from their own situation.",
  "此轴尚无人在席——自卷尾「再邀一位」请人来评。": "No one is seated on this axis yet — invite someone with \"Invite another\" at the foot of the page.",
  "评议": "Comment",
  "再邀一位": "Invite another",
  "自诸世界请一位评议……": "Invite someone from any world to comment…",
  "请评议": "Ask for a comment",
  "再评一则": "Comment again",
  "评议中…": "Commenting…",
  "删去此则": "Delete this comment",
  "请退": "Dismiss",
  "译中…": "Translating…",
  "候评…": "Awaiting comment…",
  "此条系中文译述者自己的话，无西文原文": "These are the Chinese translator's own words; there is no Western original.",
  "合规": "Consistent",
  "存疑": "Doubtful",
  "矛盾": "Contradictory",

  // ── 十四、跨媒介点评与点评席 ───────────────────────────────
  "自呈一段影音：抽帧交目，再请诸子就这段说话":
    "Submit a clip of your own: frames are read, then the philosophers speak to it",
  "收起自呈": "Hide upload",
  "上传影音点评": "Upload a clip",
  "一书两说 · 纸上与银幕": "One book, two tellings · on paper and on screen",
  "自带一段 · 请诸子说话": "Bring your own · let the philosophers speak",
  "共 {n} 条 · 四库 {siku}、西方 {west}":
    "{n} entries · {siku} from the Four Treasuries, {west} from the West",
  "世界文学一轴": "The world-literature axis",
  "择一条影音入点评席，主人公自述、他家旁议、客亦可落注。客亦可上传视频进行点评。":
    "Pick a screen work for the commentary bench: the protagonist speaks for themselves, other schools comment from the side, and you may add a note of your own — or upload a clip to be commented on.",
  "西方": "The West",
  "{n} 条": "{n} entries",
  "此部暂无影音": "No screen works in this division yet",
  "此轴暂无影音": "No screen works on this axis yet",
  "载入中……": "Loading…",
  "回跨媒介": "Back to cross-media",
  "{note}（点入详情页）": "{note} (click for details)",
  "{year} · {maker}": "{year} · {maker}",
  "片段": "Clip",
  "一种": "Version",
  幕: "Scene",
  "点入此幕的点评席": "Open the commentary bench for this scene",
  "关闭": "Close",
  "后世影音 · 点评": "On screen · commentary",
  "后世演绎 · 场景概述": "Later retelling · scene summary",
  "后世演绎 · 目录一种": "Later retelling · one of the catalogue",
  "后世演绎 · 《{title}》之一幕": "Later retelling · a scene from {title}",
  "{year} · {maker} —— {gloss}": "{year} · {maker} — {gloss}",
  "返回图谱": "Back to the graph",
  "未寻得此影音": "This screen work could not be found",
  "该条影音已不存。": "This entry no longer exists.",
  "点评席": "Commentary bench",
  "尚无点评。可请主人公，亦可邀诸世界之人就此影音点评。":
    "No comments yet. Ask the protagonist, or invite anyone from any world to comment on this clip.",
  "{what}主人公未入人格卷，无本家点评席；可邀诸世界之人就此影音点评。":
    "{what} has no persona on the roster, so there is no seat for its own protagonist; you may still invite people from the other worlds to comment.",
  "再邀一位点评……": "Invite another to comment…",
  "主人公": "Protagonist",
  "此片段": "this clip",
  "此一演绎": "this retelling",
  "点评中…": "Commenting…",
  "请点评": "Ask for a comment",
  "诸子点评": "Philosophers' commentary",
  "{note}（点入点评席）": "{note} (open the commentary bench)",

  // 自呈影音（抽帧理解）
  "只支持 mp4 / mov / webm。": "Only mp4 / mov / webm are supported.",
  // 理解这一路出岔时说的话（见 world/video-understand.ts 的 humanizeUnderstandError）：
  // 它们是现成的一句中文，存进 errMsg，显的时候才译。
  "理解失败，可改为贴文本请诸子点评。":
    "Could not read the clip — paste the text instead and let the philosophers comment.",
  "百炼账户欠费或余额不足，请充值后再试；或改为贴文本。":
    "The Bailian account is overdue or out of credit. Top it up and try again, or paste the text instead.",
  "服务端未配置 DASHSCOPE_API_KEY；可改为贴文本请诸子点评。":
    "The server has no DASHSCOPE_API_KEY configured. Paste the text instead and let the philosophers comment.",
  "请在百炼控制台开通「通义千问 VL」模型；或改为贴文本。":
    "Enable the Qwen-VL model in the Bailian console, or paste the text instead.",
  "未能解析理解结果，可改为贴文本请诸子点评。":
    "Could not parse what came back. Paste the text instead and let the philosophers comment.",
  "片段过长或帧数超限，请截短后再试；或改为贴文本。":
    "The clip is too long or has too many frames. Shorten it and try again, or paste the text instead.",
  "网络异常，请稍后重试；或改为贴文本。":
    "Network trouble. Try again shortly, or paste the text instead.",

  "片段过大（限 30MB），请截短后再试；或改为贴文本。":
    "Clip too large (30 MB limit) — trim it and try again, or paste text instead.",
  "抽帧失败，请换一段或改为贴文本。":
    "Frame extraction failed — try another clip, or paste text instead.",
  "未能抽出帧，请换一段或改为贴文本。":
    "No frames could be extracted — try another clip, or paste text instead.",
  "（无对白）": "(no dialogue)",
  "（未明）": "(unclear)",
  "（未识）": "(unrecognised)",
  "处理中…": "Processing…",
  "选择影视片段": "Choose a clip",
  "可选：这是哪段、焦点是谁": "Optional: which scene, and who is the focus",
  "如：韩非入秦，李斯忌其才，进言曰……":
    "e.g. Han Fei arrives in Qin; Li Si, envious of his talent, says…",
  "影视": "Film",
  // 后世影音目录里的四类之二（另两类「影视」「小说」已在前）
  "动画": "Animation",
  "纪录片": "Documentary",
  "仅自用学习，请勿上传侵权素材；抽帧图仅用于本次理解、不存储。":
    "For personal study only — please do not upload infringing material. Extracted frames are used for this reading alone and are not stored.",
  "或拖拽到此（mp4 / mov / webm，≤30MB）": "or drag one here (mp4 / mov / webm, ≤30 MB)",
  // 抽帧进度：已抽几帧、共几帧
  "抽帧中 {done}/{total}…": "Sampling frames {done}/{total}…",
  "识场景人物中…": "Reading the scene and figures…",
  "重选片段": "Choose another clip",
  "改为贴文本": "Paste text instead",
  "贴一段对白或小说摘录，诸子据此点评：":
    "Paste a passage of dialogue or fiction for the philosophers to comment on:",
  "返回上传": "Back to upload",
  "呈文本请诸子点评": "Submit the text for comment",
  "对白": "Dialogue",
  "换一段": "Another clip",

  // ── 十五、新手导览 ───────────────────────────────────────────
  "新手导览": "Guided tour",
  "开始游历": "Begin",
  "下一步": "Next",
  "‹ 上一步": "‹ Back",
  "跳过": "Skip",
  "可直接操作": "You can use it now",
  "初入天下": "Entering the realm",
  "这是一片贴近历史的先秦世界：十六处地界、二十一位诸子各依行程往来问学。":
    "A pre-Qin world drawn close to history: sixteen districts and twenty-one philosophers moving about on their own schedules.",
  "世界地图": "The map",
  "拖动旋转视角，滚轮远近缩放。点人物即选中他，点空地则令选中之人前往该处——两个相邻的人可以产生对话。":
    "Drag to rotate, scroll to zoom. Click a figure to select him; click open ground to send him there — two figures standing close can fall into conversation.",
  "时辰自行流转": "Time moves on its own",
  "时辰、节气、天色随机变化，诸子按各自行程移位办事。按右侧 ❙❙ 可暂停世界，细看变化。":
    "The hour, the season and the weather all shift; the philosophers go about their schedules. Press ❙❙ at the right to pause the world and look closely.",
  "每日一道游学题": "A quest a day",
  "吕公招贤榜每个世界日换一题。领题 → 寻对应诸子问学 → 回禀作答，答对得印章一枚。累积多个印章可以解锁不同称号。":
    "Lü Buwei's notice board posts a new question each world-day. Accept it → find the right philosopher and ask → report back and answer. Each correct answer earns a seal, and seals unlock titles.",
  "人物动线和行程将滚动记录在此。": "Movements and schedules are logged here as they happen.",
  "主操作台": "The main console",
  "人物看其生平行程并与之交谈，辩论席摆圆桌开辩，典籍查原文出处，语录存你收录的妙语。":
    "Figures for lives, schedules and conversation; Debate for the round table; Canon to trace sources; Sayings for what you have kept.",
  "横向滑动选择不同的人物。被选中者的生平、此刻所为、今日行程与典籍依据，都会显示在下方。":
    "Scroll sideways to pick a figure. His life, what he is doing now, today's schedule and his textual basis all appear below.",
  "答语由其本家典籍原文检索生成，引文都标出处。谈话中右键诸子的发言，可译成白话。":
    "Replies are retrieved from his own school's texts, with every quotation sourced. Right-click a reply to render it in plain language.",
  "这里列出此人附近的人物。点一位即可令两人对谈；两人以上在侧，便能就地发起一场争鸣。":
    "Everyone near this figure is listed here. Click one to set the two talking; with two or more beside him, you can start a dispute on the spot.",
  "可选择不同的人物与辩题开始百家争鸣，点击“下一步”":
    "Pick your figures and your topic to start the contention — press \"Next\".",
  "入席：择人与定题": "Seating: choose people and a topic",
  "已为你预置辩题「天下何以致治？」，并请孔子、墨子、韩非三人入席——儒、墨、法三家对同一问题答法迥异，最见锋芒。席位最多四人，「客」即你自己，入席便能亲自陈词。":
    "The topic \"How is order brought to the realm?\" is set for you, with Confucius, Mozi and Han Fei seated — Confucian, Mohist and Legalist answers to one question differ sharply, which is where the edge shows. Up to four seats; \"Guest\" is you, and seating yourself lets you speak.",
  "四轮依次推进：陈述 · 反驳 · 质询 · 总结；诸子围坐，当下这位正在作答——答语皆自其本家典籍检出、引文标明出处。右键任一段发言可译为白话。":
    "Four rounds in order — statement, rebuttal, cross-examination, summation. The philosophers sit round the table and the current speaker answers, every reply retrieved from his own texts with sources marked. Right-click any speech to render it in plain language.",
  "点「继续」请下一位": "Press \"Continue\" for the next speaker",
  "每位说完点一下，便进下一人。一轮末可插话，影响下一轮诸子所答；辩毕有观点关系图与胜负评断，还能把这场藏入竹简。了解流程后请点「下一步」":
    "One press per speaker moves it along. At the end of a round you may interject and shape the answers that follow; when it ends there is a map of positions and a verdict, and you can archive the whole thing to bamboo. Press \"Next\" when you have the gist.",
  "十六部典籍与诸概念如何牵连，一图尽览。这就点开进去看——点「下一步」。":
    "How sixteen texts and their concepts hang together, all in one view. Let's open it — press \"Next\".",
  "环图：顺藤看百家牵连": "The ring: follow the threads",
  "人物的师承渊源、典籍的注解征引、思想的承变对立，十种关系按色分线。点任一节点看详情，可顺藤跳焦点；顶部按类隐显，也可按辩题检索。试着点一个节点。":
    "Teachers and origins among figures, commentary and citation among texts, descent and opposition among ideas — ten relations, each its own colour. Click any node for details and follow a thread to shift focus; show or hide classes at the top, or search by topic. Try clicking a node.",
  "脉络 · 母题": "Lineages · Motifs",
  "「百家脉络」看学派源流演变；「母题」把诸子与别世界的人物放到同一处境下，各出其解。":
    "\"Lineages\" shows how the schools rose and changed; \"Motifs\" puts the philosophers and figures from other worlds in one situation and has each answer it.",
  "游学档案": "Your dossier",
  "印章、称号、与各位诸子的交情深浅都记在此处。交情愈厚会影响诸子与你的对话态度。":
    "Seals, titles and how well you stand with each philosopher are all recorded here. The warmer the rapport, the warmer the tone of his replies.",
  "导览结束": "End of the tour",
  "日后想重看此指引，点右上「客」字档案里的「重看导览」即可。":
    "To see this again later, open the \"Guest\" dossier at the top right and press \"Replay the tour\".",

  // ── 十五之二、五册导览 ───────────────────────────────────────
  // 册名与册目
  "册一 · 四库全书": "Book I · The Four Treasuries",
  "册二 · 先秦诸子": "Book II · The Pre-Qin Philosophers",
  "册三 · 西游": "Book III · Journey to the West",
  "册四 · 西方": "Book IV · The West",
  "册五 · 跨世界三块": "Book V · Three Crossings",
  "跨世界三块": "Three Crossings",
  "本册讲完": "End of this book",
  "导览共五册：四库、诸子、西游、西方、跨世界三块，走到哪一层讲哪一册。想重看，回进门那一屏，点题名旁那枚圆钮「导」，一册一行，可单着重看。":
    "The tour runs to five books — the Four Treasuries, the Pre-Qin philosophers, Journey to the West, the West, and the Three Crossings. Whichever layer you stand on explains its own book. To see one again, go back to the entrance screen and press the round 「导」 button beside the title: a row per book, so you can replay just the one you want.",

  // 册目（罗盘上那枚圆钮「导」开出的五行）；「新手导览」那一条已在上头十五之一
  "新手导览 · 五册": "Guided tour · five books",
  "已看 {n} / 5 册": "{n} of 5 books seen",
  "导览分五册，走到哪一层讲哪一册。点某册的 ↻ 即清那一册的记认，并切到那一层从头再讲。":
    "The tour has five books, and each layer explains its own. The ↻ beside a book forgets that book's progress and takes you to its layer to start it over.",
  "已看": "Seen",
  "未看": "Not yet",
  "重看此册": "Replay this book",
  "重看「{name}」": "Replay \"{name}\"",
  "五册全部重看": "Replay all five books",

  // Concise copy used by the current five-part guided tour
  "先秦人物世界": "World of the Pre-Qin Thinkers",
  "二十一位诸子会依各自行程，在十六处地点往来问学。": "Twenty-one thinkers follow their own schedules across sixteen places of learning.",
  "地图": "Map",
  "拖动旋转，滚轮缩放；点人物选择，点地点让他前往。": "Drag to rotate and scroll to zoom. Select a figure, then choose a place for them to visit.",
  "时间": "Time",
  "时辰与天色持续变化，人物按行程活动；右侧按钮可暂停。": "Time and weather keep changing as figures follow their schedules. Use the control on the right to pause.",
  "游学题": "Learning Quest",
  "领题、访人、回禀；答对即可获得印章。": "Take a question, visit a figure, and report back. A correct answer earns a seal.",
  "这里记录人物的移动与活动。": "This log records the figures' movements and activities.",
  "操作台": "Workspace",
  "从这里切换人物、辩论、典籍与语录。": "Switch among figures, debates, texts, and saved sayings here.",
  "人物名录": "Figure Roster",
  "滑动选择人物，下方显示他的资料与典籍依据。": "Browse the roster to select a figure; their profile and textual basis appear below.",
  "向人物提问；回答会标出引用，古文可切换白话。": "Ask a figure a question. Replies cite their sources, and classical Chinese can be rendered in plain language.",
  "附近人物": "Nearby Figures",
  "选择邻近人物，让他们对谈或加入争鸣。": "Choose nearby figures to start a dialogue or bring them into a debate.",
  "把不同人物请到同一议题中，观察立场如何交锋。": "Bring different figures to one question and watch their positions meet.",
  "定题入席": "Choose a Topic and Seats",
  "选择人物并输入辩题，也可以使用推荐题目。": "Choose the speakers and enter a topic, or use a suggested one.",
  "开始辩论": "Begin the Debate",
  "击鼓后人物依次发言，观点会保留各自知识边界。": "Once the drum sounds, figures speak in turn within their own knowledge boundaries.",
  "继续": "Continue",
  "点“继续”邀请下一位回应上一轮观点。": "Select Continue to invite the next figure to respond.",
  "从人物与典籍进入关系图，查看思想与文本的联系。": "Open the relationship graph from a figure or text to inspect links among ideas and works.",
  "沿关系探索": "Follow a Connection",
  "点任一节点，以它为中心继续展开。": "Select any node to recenter the graph and continue exploring.",
  "文脉与母题": "Lineages and Motifs",
  "这里汇集人物的学脉、影响与核心议题。": "This view brings together intellectual lineages, influences, and central questions.",
  "你的印章、称号和探索记录保存在这里。": "Your seals, titles, and exploration history are saved here.",
  "完成": "Done",
  "先秦世界已介绍完毕，接下来可以自由探索。": "The Pre-Qin world is now yours to explore.",
  "四库与世界": "The Four Treasuries and the World",
  "左侧进入四库，右侧进入西方典籍，上方连接跨文化功能。": "Enter the Four Treasuries on the left, Western texts on the right, and cross-cultural views above.",
  "四库罗盘": "Four Treasuries Compass",
  "点经、史、子、集进入对应门类。": "Choose Classics, Histories, Masters, or Belles-lettres to enter that division.",
  "点港口浏览代表性西方典籍，也可进入完整书架。": "Choose a port to browse a representative Western text, or open the complete shelf.",
  "跨文化入口": "Cross-Cultural Views",
  "从这里进入文明长卷与跨世界评议。": "Open the civilizational timeline or cross-world commentary from here.",
  "四库入口": "Four Treasuries Entrance",
  "点盘心进入四库全书。": "Select the center of the compass to enter the Four Treasuries.",
  "经、史、子、集各自展开为类目与典籍。": "Each division opens into its categories and texts.",
  "类目": "Categories",
  "每一部按类展开，点函套继续查看书目。": "Each division is arranged by category. Select a slipcase to see its books.",
  "点书进入正文，相关文脉也会随书显示。": "Open a book to read its text and see its related lineages.",
  "可按书名、作者、卷目或正文检索。": "Search by title, author, chapter, or passage.",
  "阅读": "Reading",
  "正文保持原文，翻译、批注与评议分层显示。": "The original text remains intact, with translation, annotation, and commentary shown in separate layers.",
  "西游世界": "Journey to the West",
  "沿取经路线探索十八处关目，也可回看悟空前史。": "Explore eighteen episodes along the pilgrimage, or revisit Wukong's earlier story.",
  "路线地图": "Route Map",
  "拖动和缩放地图；点地点即可进入对应章回。": "Drag and zoom the map, then select a place to enter its chapter.",
  "地点卡": "Place Card",
  "这里显示本回人物、原文、事件与试炼。": "This card shows the figures, source passage, event, and trial in the current episode.",
  "前后行程": "Journey Sequence",
  "用路条前往下一处，或按前史顺序回看。": "Use the route bar to continue west or revisit the prehistory in order.",
  "人物评议": "Character Commentary",
  "邀请本回人物从各自立场评议此事。": "Invite the figures in this episode to comment from their own perspectives.",
  "在书架中浏览已接入的西方经典与中英文正文。": "Browse the integrated Western classics and their Chinese and English texts.",
  "每本书标出作者、年代与可读版本，点书即可打开。": "Each book shows its author, date, and available editions. Select it to open.",
  "阅读器": "Reader",
  "这里以章节阅读正文，并保留原书的篇章结构。": "Read by chapter while preserving the structure of the original work.",
  "中英切换": "Chinese and English",
  "可查看中文、英文，章目对齐时还能双语对照。": "Read in Chinese or English, with facing bilingual pages where chapters align.",
  "拖选一句，即可邀请中西人物作批。": "Select a passage to invite Chinese and Western figures to annotate it.",
  "后世演绎": "Later Adaptations",
  "这里汇集与本书相关的戏剧、电影和动画。": "This view gathers plays, films, and animation related to the book.",
  "进入文明长卷、跨世界评议或跨媒介点评。": "Open the civilizational timeline, cross-world commentary, or cross-media commentary.",
  "进入文明长卷或跨世界评议。": "Open the civilizational timeline or cross-world commentary.",
  "按年代浏览中西典籍，并沿七类文脉关系追踪影响。": "Browse Chinese and Western texts by date and trace influence through seven lineage relations.",
  "选择共同母题，让不同世界的人物独立评议、互问或讨论。": "Choose a shared motif, then invite figures from different worlds to comment, question one another, or discuss it together.",
  "选择影音片段，让相关人物围绕具体场景点评。": "Choose a media clip and invite related figures to comment on the scene.",

  // 册一 · 四库
  "一 · 四库全书": "I · The Four Treasuries",
  "进门这一屏就是整个系统的一幅总图：左边一盘四库——经史子集四部，各领一个世界；右边一图海图——外国经典不入四部，另立一轴，从水路去；上头三枚签牌，是横贯这套系统的三条路：库、题、媒。先认这三处，再推门入四库。":
    "This first screen is the whole system drawn on one sheet. At the left, a compass of the Four Treasuries — classics, histories, masters, collections — each division holding a world of its own. At the right, a sea chart: the foreign classics enter no division, so they stand on an axis of their own, reached by water. Across the top, three tablets: the three roads that run athwart the whole system — the library, the questions, the screen. Learn these three places first, then we push open the door into the Treasuries.",
  "左：四库全书罗盘": "Left: the Compass of the Four Treasuries",
  "盘心是四库总目，四隅经、史、子、集各领一个世界——战国的诸子、西游的一路，都由这一盘进去。盘外一圈二十四山、内环八卦，是罗盘的样子；盘下一行据脚，鼠标停到盘上何处，便说何处是什么。":
    "At the hub is the catalogue of the whole library; at the four quarters stand the classics, the histories, the masters and the collections, each with a world behind it — the Warring States philosophers and the road west are both entered from this dial. The outer ring carries the twenty-four directions and the inner ring the eight trigrams, as a geomancer's compass does; the line of text beneath the dial is its footnote, naming whatever your cursor rests on.",
  "右：海图八港": "Right: eight ports on the sea chart",
  "外国经典八港立在这一幅海图上：帆船循红虚线驶去，泊下一港即开其书。中土之书走陆路入四库，西书走水路入海图，故这一轴与四库并列，不是四库的一角。":
    "The foreign classics stand as eight ports on this chart: the ship sails the red dotted line, and the book opens where she berths. Chinese books come overland into the Treasuries, Western books come by sea onto the chart — which is why this axis sits beside the Four Treasuries rather than in a corner of them.",
  "上：三枚签牌": "Above: three tablets",
  // XMEDIA_ON 暂藏时的两处变体（feature-flags）：签牌只余 库·题 两条路
  "上：签牌": "Above: the tablets",
  "进门这一屏就是整个系统的一幅总图：左边一盘四库——经史子集四部，各领一个世界；右边一图海图——外国经典不入四部，另立一轴，从水路去；上头的签牌，是横贯这套系统的几条路：库与题。先认这几处，再推门入四库。":
    "This first screen is the whole system drawn on one sheet. At the left, a compass of the Four Treasuries — classics, histories, masters, collections — each division holding a world of its own. At the right, a sea chart: the foreign classics enter no division, so they stand on an axis of their own, reached by water. Across the top, the tablets: the roads that run athwart the whole system — the library and the questions. Learn these places first, then we push open the door into the Treasuries.",
  "库——文明长卷，看四库书与书的牵连，也看中西典籍的同期对照；题——跨世界评议，同一处境诸世界各出其解。这两块不在任何一世界之内，横着走过去看（册五细讲）。":
    "The library — a civilisational scroll, where you see how book bears on book and how Chinese and Western classics stand side by side in time. The questions — cross-world commentary, where one and the same predicament is answered by each world in turn. Neither sits inside any one world; you walk across them sideways (Book V takes them one by one).",
  "库——朝代长卷，看书与书的牵连；题——跨世界评议，同一处境诸世界各出其解；媒——跨媒介点评，影音按部铺开。这三块不在任何一世界之内，横着走过去看，是这套系统的第三条路（册五细讲）。":
    "The library — a dynastic scroll, where you see how book bears on book. The questions — cross-world commentary, where one and the same predicament is answered by each world in turn. The screen — cross-media commentary, with film and television laid out by division. None of the three sits inside any one world; you walk across them sideways, and they are this system's third road. Book V takes them one by one.",
  "盘心即四库之门": "The hub is the door to the library",
  "盘心这一处写着「四库」，点它便入四库总目：经史子集四部由此进。也可以直接点「下一步」，由我替你推门。":
    "The hub is lettered \"Four Treasuries\"; press it and you are in the catalogue, where the four divisions begin. Or simply press \"Next\" and I will open the door for you.",
  "四部门楼": "Four gatehouses",
  "一千零一十九部著录、七十七部可读全文，都在四道门里。经、史、子、集各是一座门楼，门色即部色——经绿、史红、子青、集墨，此色一路贯到函套与书脊。悬停时两扉自中缝微启，推门进去便是那一部的类与书。":
    "1,019 works on record and 77 readable in full all lie behind these four gates. Classics, histories, masters, collections — each is a gatehouse, and the gate's colour is its division's colour: green for classics, red for histories, blue for masters, ink for collections. The same colour runs on through the slipcases and the spines. Hover and the two leaves part a little at the seam; push through and you are among that division's categories and books.",
  "一千零一十九部著录、一千零二部可读全文，都在四道门里。经、史、子、集各是一座门楼，门色即部色——经绿、史红、子青、集墨，此色一路贯到函套与书脊。悬停时两扉自中缝微启，推门进去便是那一部的类与书。":
    "1,019 works on record and 1,002 readable in full all lie behind these four gates. Classics, histories, masters, collections — each is a gatehouse, and the gate's colour is its division's colour: green for classics, red for histories, blue for masters, ink for collections. The same colour runs on through the slipcases and spines.",
  "函套：部下面是类": "Slipcases: categories within a division",
  "已替你推开子部之门。一眼看去，一部之下又分类目，每一格是一座函套：函签竖书类名，右口露出的几枚书脊是「这一函装了多少部」的约略，不作精确刻度。":
    "The door into the Masters is open for you. Under a division the works fall into categories, and each panel is a slipcase: the label stands the category name upright, and the few spines peeking from the right edge suggest how full it is — an impression, not an exact count.",
  "立书：函里一部部的书": "Books standing in the case",
  "已替你抽出道家这一函。书立着排，书脊竖题书名与著者，与函签同一笔意。可读全文者自带书影；存目者只见著录，点是点不开的。":
    "The Daoist case is out for you. The books stand in a row, title and author lettered upright on the spine in the same hand as the case label. Those readable in full carry a cover image; those only on record show their entry alone — clicking them goes nowhere.",
  "检索：一路查到底": "Search: all the way down",
  "已替你打入「鼓盆」二字。检索分四路并出：其人、其书、其卷、其文——打一个人名，先出其人，其人之下再系其书；打一段文，直落到那本书那一卷那一段原文。四库最要紧的一件便是这里。":
    "The phrase \"drumming on a basin\" is entered for you. Search answers on four fronts at once — person, book, chapter, passage. Type a name and the person comes first, with his books hung beneath him; type a line of text and it lands on that passage in that chapter of that book. This is the most important thing the library does.",
  "翻开一章：原文一字不改": "Opening a chapter: the text, untouched",
  "已替你翻开《庄子》。左栏是卷目，中栏是原文，右边是边批栏——读时拖选一句即落批，诸子与后世读者都可来批。原文永不改写、不替换：英文版另附一栏今译，书上的字照旧。":
    "The Zhuangzi is open for you. Contents at the left, the original text in the middle, the margin at the right — select a line as you read and a note drops into the margin, whether from a philosopher or from a later reader. The text itself is never rewritten or replaced: the English edition adds a column of translation alongside, and the words on the page stay as they are.",

  // 册三 · 西游
  "三 · 西游": "III · Journey to the West",
  "此处另成一图：取经路十八处，界外五处是悟空前史。与诸子那屏不同，这一屏讲的是「行到何处」，不是「何人何言」。":
    "This is a map of its own: eighteen stops along the pilgrimage, plus five places beyond its edge for Wukong's earlier life. Unlike the philosophers' screen, this one is about where you have walked, not who said what.",
  "路与图": "The road and the map",
  "拖转视角看这一片山河，滚轮远近。路线上每一处标着章回：点一处即到一处，三维场景随之处处不同。":
    "Drag to turn the view over this stretch of country, scroll for distance. Every stop on the road is marked with its chapter: click one and you are there, each in its own three-dimensional scene.",
  "此处": "Here",
  "这一格说清脚下：此回何难、今日谁在侧、此处一句原书的话，末了是这一处的试炼。点右上一点可翻回前史，看师徒相遇之前的事。":
    "This panel accounts for where you stand: the perils of this chapter, who is with you today, a line from the book itself, and at the end the trial of this place. The mark at the top right turns back to the prehistory, before master and disciples met.",
  "路条：往西，或回前史": "The road bar: west, or back to prehistory",
  "路条管次序：在西行路上按「下一处」即往西去；走入界外诸处，路条改走「前史」的次第，不再按取经路排。":
    "The road bar keeps the order. On the pilgrimage road, \"Next stop\" carries you westward; step outside those bounds and it switches to the prehistory's own order rather than the pilgrimage's.",
  "聚义评议": "Council at this place",
  "此处几个人同席，各依自家天性出一句，评议这一难。与诸子的圆桌辩论同一路数，只是席上坐的是取经人、妖与神。":
    "Whoever is gathered here takes a seat and speaks a line apiece, each in his own nature, on the trial before them. The same round table as the philosophers' debate — only the seats are filled by pilgrims, demons and gods.",

  // 册四 · 西方
  "四 · 西方": "IV · The West",
  "外国经典不入四库，另立一轴：八部书，皆中英两卷。这是海图八港的书架——自罗盘的海图上泊下一港，翻开的就是这里的一部。":
    "Foreign classics stay out of the Four Treasuries and stand on an axis of their own: eight works, each in a Chinese and an English volume. This is the shelf behind the eight ports of the sea chart — dock at a port on the compass and the book it opens is one of these.",
  "书架": "The shelf",
  "每一部标着著者、年代与两卷章数。中译在前、原书在后；两卷章数不等者（如《茶花女》）只可择一面读，章目对齐者（如《哈姆莱特》）才摊得开对照面。":
    "Each entry gives author, date and the chapter count of both volumes. The Chinese translation comes first and the original after; where the two do not divide alike (La Dame aux Camélias, say) you read one side or the other, and only where the chapters line up (Hamlet, say) does the facing-page view open.",
  "点开一部": "Opening a book",
  "已替你翻开《哈姆莱特》。西式排印与四库的线装书刻意不同：双细线框、章首大字母下沉、章目居左。这一部的章目按场切齐，故下一步能摊开中英对照。":
    "Hamlet is open for you. Western typesetting is deliberately unlike the Four Treasuries' thread-bound books: a double rule around the page, a dropped capital at the chapter's head, the chapter list set at the left. This book's chapters divide scene by scene, which is why the next step can lay Chinese and English face to face.",
  "中译 · 原书 · 对照": "Translation · original · facing pages",
  "已替你切到对照面：左中文、右英文，一页两栏同进退。这三层的分别正在于此——原文不替换，译与注另立一面；读书时哪一面都看得见，不是选一个换掉另一个。":
    "The facing-page view is set for you: Chinese at the left, English at the right, the two columns turning together. This is what the three layers mean — the original is never replaced; translation and annotation stand beside it. Reading, you keep the other page in view; you do not swap one for the other.",
  "与四库边批同一套账：拖选一句即落批。诸子可批西书，西贤亦可来批——庄子批一句《堂吉诃德》，与塞万提斯自家来批，各是一种读法。":
    "The same ledger as the Four Treasuries' margins: select a line and a note falls there. A philosopher may annotate a Western book, and a Western author may annotate too — Zhuangzi on a line of Don Quixote and Cervantes on his own reads differently, each a way of reading.",
  "这一部的演绎挂在这里：戏、片、动画，点一条入点评席，由诸位人物对着那一幕各说一句。书读到哪里，影音跟到哪本书。":
    "The adaptations hang here: plays, films, animation. Click one to enter the commentary seat, where the figures each say a line on that scene. The screen-and-sound trail follows whichever book you are reading.",

  // 册五 · 跨世界三块
  "三枚签牌": "Three tags",
  // XMEDIA_ON 暂藏（feature-flags）下册五只余 库·题 两块的两处变体
  "签牌":
    "The tablets",
  "朱砂印一字，牌上大字是去处、小字是这去处做什么：库——文明长卷，看四库文脉与中西同期对照；题——跨世界评议，同一处境诸世界各出其解。":
    "Each carries a vermilion seal-character; the large word is where it leads, the small one what it does there. 库 — the civilisational scroll, for the library's lineage and the Chinese and Western books standing side by side in time; 题 — cross-world comment, one situation answered by many worlds.",
  "已替你换到母题一屏。十二个母题——生死、义利、家国……把诸子与别世界的人物放到同一处境下，各出其解。这是系统里唯一一处让不同世界正面相遇的地方。五册到此讲完——想重看哪一册，回进门那一屏，点题名旁那枚圆钮「导」。":
    "You are on the motifs screen. Twelve motifs — life and death, right and profit, household and realm — put the philosophers and figures of other worlds into one situation, each answering for himself. This is the only place in the system where different worlds meet face to face. Here the five books end — to replay one, go back to the entrance screen and press the round 「导」 button beside the title.",
  "朱砂印一字，牌上大字是去处、小字是这去处做什么：库——朝代长卷，看书的牵连；题——跨世界评议，同一处境诸世界各出其解；媒——跨媒介点评，影音按部铺开。":
    "Each carries a vermilion seal-character; the large word is where it leads, the small one what it does there. 库 — the dynasty scroll, for how books tie to one another; 题 — cross-world comment, one situation answered by many worlds; 媒 — cross-media commentary, screen and sound laid out by division.",
  "朝代长卷：书与书的牵连": "The dynasty scroll: how books tie together",
  "已替你展开长卷。各代的书沿朝代排开，书的牵连以线相连，关系按色分七型：传注、承学、取材、非难、并称、相续、依托——七型不重，各管一件传过去的东西（解释、学说、文与事、争、并举、断限、名）。横着读一部书在历代的去处，与竖着读一本书的正文，是两种看法。":
    "The scroll is unrolled for you. Books line up by dynasty and the ties between them are drawn as lines in seven colours: commentary, transmission, borrowing, dispute, pairing, continuation, false ascription. The seven do not overlap - each names the one thing that passes from book to book: an explanation, a doctrine, matter and words, a quarrel, a mere juxtaposition, a cut-off date, a name. Reading one book across the dynasties sideways and reading its text straight through are two different views of the same library.",
  "跨世界评议：同一处境": "Cross-world comment: one situation",
  "已替你换到母题一屏。十二个母题——生死、义利、家国……把诸子与别世界的人物放到同一处境下，各出其解。这是系统里唯一一处让不同世界正面相遇的地方。":
    "You are on the motifs screen. Twelve motifs — life and death, right and profit, household and realm — put the philosophers and figures of other worlds into one situation, each answering for himself. This is the only place in the system where different worlds meet face to face.",
  "跨媒介点评：影音按部铺开": "Cross-media commentary: screen and sound by division",
  "已替你换到影音一屏。四库四部与西方两行铺开，点一条入点评席。五册到此讲完——想重看哪一册，回进门那一屏，点题名旁那枚圆钮「导」。":
    "You are on the cross-media screen. The four divisions of the library and the two rows of Western works lie open; click a title to enter the commentary seat. Here the five books end — to replay one, go back to the entrance screen and press the round 「导」 button beside the title.",

  // ── 十六、招贤榜、小考、印章、档案 ─────────────────────────
  "招贤榜": "Notice board",
  "招贤榜 · 吕不韦日问": "Notice board · Lü Buwei's question of the day",
  "每日游学": "Daily quest",
  // 今日已毕时榜上那一句
  "今日游学已成——《{book}·{chapter}》得其义，吕公已予印。":
    "Today's quest is done — you have the sense of {book} · {chapter}, and Lü Buwei has given you his seal.",
  // 答毕回看所问那一句：原文在前，出处在后
  "「{text}」——《{book}·{chapter}》": "“{text}” — {book} · {chapter}",
  "领题游学 →": "Accept the quest →",
  "放弃": "Abandon",
  "点地图诸子咨询得其言，再回吕不韦处回禀。":
    "Consult the philosophers on the map for his words, then report back to Lü Buwei.",
  "经义小考 · 四选一自练": "Canon quiz · four choices, self-paced",
  "回禀 · 吕不韦": "Report · Lü Buwei",
  "回禀吕不韦": "Report to Lü Buwei",
  "此句何义？": "What does this line mean?",
  "领印收卷 ✓": "Take the seal ✓",
  "再选一次": "Choose again",
  "正解。吕公颔首，予印一枚。": "Correct. Lü Buwei nods and grants you a seal.",
  "未中。正解为{label}。": "Not quite. The answer is {label}.",
  "经义小考 · {type}": "Quick test · {type}",
  "经义小考": "Canon quiz",
  "小考": "Quiz",
  "四选一": "Four choices",
  "退出": "Leave",
  "正解。此题已记印，再来可也。": "Correct. This one is already sealed — try another.",
  "正解。得印一枚。": "Correct. One seal earned.",
  "再来一题 →": "Another question →",
  // 日问兜底时的提示（见 world/dailyQuest.ts）
  "可往学宫问诸子": "Go ask the philosophers at the academy",
  // 日问的去处是拼的：从前整句存进来（「可往道家山林问庄子」），地名人名一换便落了
  // 空，故改作模板，两个名字各自查表（见 world/dailyQuest.ts 的 hintRegion/hintScholar）
  "可往{region}问{scholar}": "Go to {region} and ask {scholar}",
  "「{text}」此句何义？": "What does \"{text}\" mean?",
  "「{text}」此句出自何书？": "Which book is \"{text}\" from?",
  "「{text}」此句为谁所言？": "Who said \"{text}\"?",
  "何义": "Meaning",
  "何书": "Book",
  "何人": "Speaker",
  甲: "A",
  乙: "B",
  丙: "C",
  丁: "D",
  "印章册": "Book of seals",
  "招贤榜 · 印章册": "Notice board · book of seals",
  "尚未得印。往左上公告栏领游学题、回禀吕不韦，或试「经义小考」。":
    "No seals yet. Take a quest from the notice board at the upper left and report back to Lü Buwei, or try the canon quiz.",
  "游学": "Quest",
  游: "Quest",
  考: "Quiz",
  "客之档案": "The guest's dossier",
  "尚无名号": "No name yet",
  "自取一名": "Choose a name",
  "名号": "Name",
  "连对": "Streak",
  "{n} 枚印章": "{n} seals",
  "枚印章": "seals",
  "展开印章册 →": "Open the book of seals →",
  "诸子交游 · 好感": "Standing with the philosophers",
  "称号 · 连对解锁": "Titles · unlocked by streaks",
  "游学者 · {title}": "Traveling student · {title}",
  "连对 {n} 解锁": "Unlocks at a streak of {n}",
  "当前": "Current",
  "初学": "Beginner",
  "小有所成": "Making Progress",
  "渐入佳境": "Coming Along",
  "博闻强识": "Widely Learned",
  "通儒达士": "Accomplished Scholar",
  "一代宗师": "Master of an Age",
  "连对一题，始入经义之门。": "One in a row: you have entered the gate.",
  "连对三题，渐识先贤之旨。": "Three in a row: the sages' drift is becoming clear.",
  "连对五题，典籍略无滞碍。": "Five in a row: the texts no longer trip you.",
  "连对八题，闻见广而识之审。": "Eight in a row: wide reading, careful judgement.",
  "连对十二题，通经致用。": "Twelve in a row: the classics put to use.",
  "连对二十题，蔚为一家之言。": "Twenty in a row: a doctrine of your own.",
  "相善，可推心置腹": "Close — you can speak freely",
  "初熟，言可稍亲": "Warming — the tone softens",
  "初识，礼数如常": "Newly met — the usual courtesies",
  "微有龃龉，言辞持重": "Slightly at odds — words held back",
  "相左，多有辩难": "At odds — much argued",

  // ── 十七、市井街市 ───────────────────────────────────────────
  "市井街市": "The market street",
  "铜钱": "Coins",
  "铜钱不足": "Not enough coins",
  "离开市井": "Leave the market",
  "离开 ×": "Leave ×",
  "街市全景": "The whole street",
  "店铺货品": "Goods",
  "{name} {price}文": "{name}, {price} coins",
  "持 {n}": "have {n}",
  文: "coins",
  "棚肆幌子相招 · 点幌子或铺面选购": "Stalls and banners calling · click a banner or a shop to buy",
  "点街面任一幌子或铺面": "Click any banner or shop front",
  "杂货铺·酒楼·茶肆·肉铺·鱼摊·书坊":
    "Sundries · wine house · teahouse · butcher · fishmonger · bookshop",
  "点货品即购": "Click an item to buy it",
  "{n} 样货品": "{n} kinds of goods",
  // 购货时飘起的那一笔花销
  "−{n} 文": "−{n} coins",
  "购得": "Bought",
  "杂货铺": "Sundries",
  "酒楼": "Wine house",
  "茶肆": "Teahouse",
  "肉铺": "Butcher",
  "鱼摊": "Fishmonger",
  "书坊": "Bookshop",
  "束脩": "Dried meat",
  "醴酒": "Sweet wine",
  "竹简": "Bamboo slips",
  "茗茶": "Tea",
  "藜羹": "Pigweed broth",
  "鲜鱼": "Fresh fish",
  // 货品说明（悬停与奉贽时见）。束脩那条引《论语·述而》，译文保其出典。
  "干肉一束，求学之贽。孔子曰：自行束脩以上，吾未尝无诲焉。":
    "A bundle of dried meat, the gift a student brings. Confucius: \"To anyone who came with so much as a bundle of dried meat, I never refused instruction.\"",
  "甘酒薄醴，酒以行礼。": "Sweet thin wine — wine is for the rites.",
  "空白简牍，可录所闻。": "Blank slips, for writing down what you hear.",
  "煎汤涤烦，解渴清神。": "Boiled to wash off vexation; it quenches thirst and clears the head.",
  "藜藿之羹，贫者之食。": "Broth of pigweed and bean leaves — the poor man's meal.",
  "临渊羡鱼，不如退而结网。":
    "Better to go home and weave a net than to stand by the pool envying the fish.",

  // ── 十八、西游一世界 ───────────────────────────────────────
  "取经路": "The road west",
  "回取经路": "Back to the road",
  "← 回取经路": "← Back to the road",
  "正在铺展取经路……": "Unrolling the road west…",
  "界外": "Beyond the road",
  "读此回原文 →": "Read this chapter →",
  "读《西游记》{label}": "Read Journey to the West, {label}",
  "此处不在取经路上——是行者一个人去过的地方。":
    "Not on the road west — a place the Monkey went alone.",
  "此处无难——一在发端，一在终了。":
    "No ordeal here — one place is the beginning, the other the end.",
  "在此世界者": "Who is in this world",
  "回盘面": "Back to the board",
  "演示中 · 停": "Playing · stop",
  "演示取经": "Play the road west",
  "演示前史": "Play the back story",
  "读《西游记》{chapter}": "Read {chapter} of the Journey to the West",
  "在此。": "is here.",
  "就这一难，论一场 →": "Argue this ordeal out →",
  "西行 →": "West →",
  "前史": "Back story",
  "前史 →": "Back story →",
  "与{name}说话": "Talking with {name}",
  // 一行里连着几个人名，中文以顿号相隔，英文用逗号
  "、": ", ",
  // 几处悬停提要的拼法
  "{note}。": "{note}.",
  // 取经路上，某处是某人入队之地（大圣在五行山、八戒在高老庄……），唐僧那一处是发端
  "自此发端": "This is where it begins",
  "于此入队": "Joined the company here",
  "{order}. {name} · {chapter}": "{order}. {name} · {chapter}",
  "{name} · {chapter}": "{name} · {chapter}",
  "{label} {title}": "{label} {title}",
  "{text}——{gloss}": "{text} — {gloss}",
  "令二人对口 · 对谈或争辩 →": "Set two of them talking · dialogue or dispute →",
  "西游 · 二人对口 · {place} · {chapter}「{title}」":
    "Journey to the West · two voices · {place} · {chapter}, “{title}”",
  // 对谈的标题是「甲与乙」，争辩的是「甲 · 乙 · 丙」；此键即那个「与」
  " 与 ": " and ",
  "同在一条路上才争得起来。": "Only those on the same road can argue at all.",
  // 引子钮上只露一截，后缀省略号
  "{seed}…": "{seed}…",
  "问一句试试。": "Try asking something.",
  "问{name}一句……": "Ask {name} something…",
  问: "Ask",
  "作答中…": "Answering…",
  "你曾说「{text}」，此话怎讲？": "You once said \"{text}\" — what did you mean?",
  "对谈": "Dialogue",
  "争辩": "Dispute",
  "开{form}": "Begin the {form}",
  "此去西行，路上的事该听谁的。": "On the road west, whose word should be followed?",
  "这一难，是该打杀过去，还是该忍过去。":
    "This ordeal — fight your way through, or endure it?",
  "所谈": "Subject",
  "所争": "Point at issue",
  "此处该怎么办……": "What should be done here…",
  "对谈须二人。": "A dialogue needs two.",
  "争辩可二至四人，四轮依次。": "A dispute takes two to four, over four rounds.",
  "三人以上只可争辩。": "Three or more can only dispute.",
  "同席": "Together",
  "席上": "At the table",
  "形制": "Form",
  "正说着…": "Speaking…",
  "重开一场": "Start over",
  "住口": "Stop",
  "再续一回": "One more round",
  "对谈 · 往复相应": "Dialogue · back and forth",
  "争辩 · 陈述反驳质询总结": "Dispute · statement, rebuttal, cross-examination, summation",
  "取经路上，这四位本来日日相争——争的不是道理，是此处该怎么办。":
    "On the road west these four argue daily — not over doctrine, but over what to do here and now.",
  "上头拟一句所争之事，左边点两个人，便可开谈。":
    "Set the point at issue above, pick two figures at the left, and begin.",
  "{name}复诵": "{name} recites",

  // ── 十九、场景与状态（头顶名牌、区域、天候） ───────────────
  // 思/谈/辩是 Figure 头顶名牌的单字状态标签，与 LineageMap 的"思"（Idea，见上）
  // 同字不同义。单字名牌是图不是字（同印章例，见 lang.ts 顶注），不译，
  // 故此处不收——也免与上面的"思: Idea"撞 key。
  "正在{action}": "{action}",
  "进入{region}": "Enter {region}",
  // 匾额下那枚入口钮
  "入{region} →": "Into {region} →",
  "{el}德": "Phase of {el}",
  "集门客论学": "holding a seminar with his retainers",
  "正在集门客论学": "holding a seminar with his retainers",
  "驻于{region}": "stationed at {region}",
  // 十二时辰。英文作「Hour of the Rat」一路（汉学界通行），不作音译 zi-shi——
  // 顶栏那一行是报时的，读者要知道的是「现在几时」，不是这个字怎么念。
  "子时": "Hour of the Rat",
  "丑时": "Hour of the Ox",
  "寅时": "Hour of the Tiger",
  "卯时": "Hour of the Rabbit",
  "辰时": "Hour of the Dragon",
  "巳时": "Hour of the Snake",
  "午时": "Hour of the Horse",
  "未时": "Hour of the Goat",
  "申时": "Hour of the Monkey",
  "酉时": "Hour of the Rooster",
  "戌时": "Hour of the Dog",
  "亥时": "Hour of the Pig",
  // 天气前缀与合成模板：动作句一百余个、天气三种，前缀拆开译故为加法。
  // 合成之法见 `action.ts`（中文模式不走这条路，原样返回）。
  "雾中": "in the fog",
  冒雨: "in the rain",
  踏雪: "through the snow",
  "{action}（{weather}）": "{action}, {weather}",
  "正在舍中避雪": "sheltering from the snow indoors",
  "正在檐下避雨": "sheltering from the rain under the eaves",
  // 十六区
  "杏坛": "Apricot Altar",
  "墨家工坊": "Mohist Workshop",
  "法家政厅": "Legalist Chancery",
  "稷下学宫": "Jixia Academy",
  "濠水之畔": "Banks of the Hao",
  "纵横棋局": "Diplomats' Board",
  "名家论辩台": "Logicians' Platform",
  "道家山林": "Daoist Woods",
  "公共广场": "Public Square",
  "观星台": "Star Terrace",
  "沙盘": "Sand Table",
  "农家田舍": "Farmstead",
  "秦驰道": "Qin Highway",
  "市井": "Market",
  "大河渡口": "Great River Ferry",
  "招贤馆": "Hall for Recruiting Talent",
  // 时段与天候
  "夜阑": "late night",
  "破晓": "daybreak",
  "上午": "morning",
  "日中": "noon",
  "午后": "afternoon",
  "薄暮": "dusk",
  "入夜": "nightfall",
  春: "spring",
  夏: "summer",
  秋: "autumn",
  冬: "winter",
  // 朔／望：史书记日常缀其后（「丁卯朔」），与四季同例，一字一词
  朔: "new moon",
  望: "full moon",
  晴: "clear",
  阴: "overcast",
  雨: "rain",
  雪: "snow",
  雾: "fog",
  "天降骤雨": "a sudden downpour",
  "朔雪忽至": "snow out of the north",
  "浓雾四合": "fog closing in",
  "天色转阴": "the sky turning grey",
  "云开日出": "clouds parting, sun out",
  "天象变易": "the weather turns",
  "时入{season}，{note}": "{season} comes on, {note}",
  "招贤馆日给铜钱20文。": "The Hall grants 20 coins for the day.",
  "答对一题，吕公赏铜钱5文。": "A correct answer; Lü Buwei rewards you 5 coins.",
  "连对 {n} 题，得『{title}』之称。": "{n} correct in a row — the title \"{title}\" is yours.",
  "{region}：{scene}": "{region}: {scene}",
  // 自主行动那一笔：动作已由 useTActionBare 译成分词短语，这里只管把人名接上去
  "{name}{action}": "{name} is {action}",
  "游学·《{book}·{chapter}》得其义，吕公予印，赏铜钱5文。":
    "Quest · you grasped {book} · {chapter}; Lü Buwei grants a seal and 5 coins.",
  "游学·{book}·{chapter}": "Quest · {book} · {chapter}",
  "小考·{book}·{chapter}": "Quiz · {book} · {chapter}",

  // 此刻在做什么：动作句。
  // 一律作分词短语（"lecturing" 而非 "He is lecturing"）——词表里 `正在{action}`
  // 的英文值即 `{action}`，「正在」这层意思由句位承担，不必在每一条里重说一遍；
  // 且这些句子要嵌进「此刻 {clock}」之下、「附近的人」小字之内两处，作短语才两处都合。
  // 术语从定译：合纵／连横作 Vertical／Horizontal Alliance，法术势作 law／method／power，
  // 兼爱作 impartial care，齐物作 the equality of things。
  "正在讲学": "lecturing",
  "正在试验守城机关": "testing the siege-defence engines",
  "正在修订法令": "revising the statutes",
  "正在观水悟道": "watching the water, grasping the Way",
  "正在临流看鱼": "watching fish by the stream",
  "正与荀子论人性": "debating human nature with Xunzi",
  "正与孟子论人性": "debating human nature with Mencius",
  "正在核算工料": "reckoning materials and labour",
  "正在核查工籍": "auditing the labour rolls",
  "正在与孟子共食": "taking a meal with Mencius",
  "正在与孔子共食": "taking a meal with Confucius",
  "正与墨子闲谈": "chatting with Mozi",
  "正与庄子闲谈": "chatting with Zhuangzi",
  "正在演习礼仪": "rehearsing the rites",
  "正在观礼记录": "observing the rites and taking notes",
  "正在陈说法术": "setting out law and method",
  "正在争民本": "arguing that the people are the root",
  "正在布置守具": "setting out the defence works",
  "正在主论": "presiding over the debate",
  "正在申说仁政": "expounding humane government",
  "正在申说礼法": "expounding rites and law",
  "正在申说兼爱": "expounding impartial care",
  "正在申说法度": "expounding law and measure",
  "正在踏影独行": "walking alone, treading his own shadow",
  "正在校书": "collating texts",
  "正在著文": "writing an essay",
  "正在默诵": "reciting under his breath",
  "正在断疑狱": "deciding the doubtful cases",
  "正在旁听记录": "sitting in and taking notes",
  "正在推演合纵": "working out the Vertical Alliance",
  "正在推演连横": "working out the Horizontal Alliance",
  "正在持白马之辩": "holding the white-horse argument",
  "正在以合同异难之": "pressing him with 「uniting same and different」",
  "正在广场演说": "speaking in the square",
  "正在陈道德之要": "setting out the essentials of the Way and its virtue",
  "正在以齐物应之": "answering with the equality of things",
  "正在正名责实": "rectifying names and holding things to them",
  "正在辨同异之极": "pushing same and different to their limit",
  "正在复陈合纵": "restating the case for the Vertical Alliance",
  "正在复陈连横": "restating the case for the Horizontal Alliance",
  "正在以正言若反之旨应之": "answering that true words seem their opposite",
  "正在述寓言": "telling a parable",
  "正在推演五德之序": "working out the sequence of the Five Phases",
  "正在沙盘推演阵法": "working out formations on the sand table",
  "正与韩非论不战屈人": "debating victory without battle with Han Fei",
  "正与孙武论富国强兵": "debating a rich state and a strong army with Sun Wu",
  "正与墨子论慎战全胜": "debating caution in war and whole victory with Mozi",
  "正与孙武陈非攻之义": "putting the case against aggression to Sun Wu",
  "正在夜观星象推时运": "reading the night sky for the turn of the times",
  "正在临渡观水之就下": "at the ford, watching water seek the low",
  "正在渡口看鱼乐": "at the ferry, watching the joy of fishes",
  "正在取道驰道赴诸侯之约": "taking the highway to an appointment with the lords",
  "正在取道驰道赴秦廷之约": "taking the highway to an appointment at the Qin court",
  "正在市井与商贾言义利": "in the market, weighing right against profit with the merchants",
  "正在招贤馆陈礼法之要": "at the Hall, setting out the essentials of rites and law",
  "正在招贤馆持名实之辩": "at the Hall, holding the argument on names and realities",
  "正在招贤馆论兵家慎战之旨": "at the Hall, on the military school's caution in war",
  "正在田舍问农人以节用": "at the farmstead, asking the farmers about thrift",
  "正在与商鞅论轻重富国之术": "debating fiscal statecraft with Shang Yang",
  "正在与管仲论耕战之法": "debating the farming-and-war laws with Guan Zhong",
  "正在道山侍坐问道": "in the woods, sitting in attendance to ask about the Way",
  "正在道山为文子言道德之要": "in the woods, telling Wenzi the essentials of the Way",
  "正在沙盘申军礼仁本之义": "at the sand table, urging military rites rooted in humaneness",
  "正在沙盘论文德武备": "at the sand table, on civil virtue and military readiness",
  "正在沙盘论天官人事": "at the sand table, on the heavenly offices and human affairs",
  "正在名家馆操两可之辩": "at the Logicians' hall, working the both-ways argument",
  "正在名家馆检形正名": "at the Logicians' hall, examining forms and rectifying names",
  "正在名家馆持白马之辩": "at the Logicians' hall, holding the white-horse argument",
  "正在讲堂陈循名责实之术": "in the lecture hall, on holding things to their names",
  "正在讲堂论势位之要": "in the lecture hall, on the essentials of position and power",
  "正在讲堂合法术势而论之": "in the lecture hall, arguing law, method and power as one",
  "正在沙盘演文伐发机之韬": "at the sand table, drilling attack by stratagem and seizing the moment",
  "正在沙盘演柔弱制刚之略": "at the sand table, drilling how the soft subdues the hard",
  "正在整理弦歌旧籍": "putting the old songbooks in order",
  "正在与游士辩性善": "arguing the goodness of nature with travelling scholars",
  "正在校订劝学之篇": "revising his Exhortation to Learning",
  "正在校验守城器械": "checking over the siege-defence gear",
  "正在逍遥山林": "roaming free in the hills",
  "正在修订律令条文": "revising the articles of the code",
  "正在推演合纵之局": "working out the shape of the Vertical Alliance",
  "正在推演连横之策": "working out the plan of the Horizontal Alliance",
  "正在历物之意": "running through the meanings of things",
  "正在推演阵法": "working out formations",
  "正在讲诚明之学": "teaching the learning of sincerity and illumination",
  "正在揣摩捭阖之术": "mulling the art of opening and closing",
  "正在修订耕战之法": "revising the farming-and-war laws",
  "正在推演奇正之变": "working out the turns of the direct and the oblique",
  "正在凝神贵虚之境": "settling his spirit in the prizing of emptiness",
  "正在贵己全性之思": "thinking on valuing the self and keeping nature whole",
  "正在躬耕于陇亩": "ploughing his own fields",
  "正在省身修孝之教": "examining himself in the teaching of filial care",
  "正在核算轻重之数": "reckoning the figures of weight and balance",
  "正在抚卒演阵": "mustering the troops and drilling formations",
  "正在参酌名实之术": "weighing the art of names and realities",
  "正在论势与法": "discussing power and law",
  "正在操两可之辩": "working the both-ways argument",
  "正在检形正名": "examining forms and rectifying names",
  "正在申明军礼": "setting forth the military rites",
  "正在推度兵刑相守之理": "weighing how arms and punishments guard each other",
  "正在韬晦观机": "keeping himself concealed, watching for the moment",
  "正在演三略之要": "drilling the essentials of the Three Strategies",
  "正在诵习道德之经": "reciting the Classic of the Way and Virtue",
  "正在游学四方": "travelling the four quarters to study",

  // 日程题名（「今日行程」一栏逐条的题）。
  // 作短标题而非句子——那一栏是时刻表，每条前面已有起止时刻，题名要短到扫一眼能过。
  "杏坛晨讲": "Morning lecture at the Apricot Altar",
  "试机关": "Testing the engines",
  "修订法令": "Revising the statutes",
  "山林观水": "Watching water in the hills",
  "人性之辩": "The debate on human nature",
  "较工与法": "Craft measured against law",
  "午间进食": "Midday meal",
  "水畔偶遇": "A chance meeting by the water",
  "习礼": "Rehearsing the rites",
  "议政": "Council on government",
  "守城演练": "Siege-defence drill",
  "稷下百家争鸣": "A hundred schools contend at Jixia",
  "薄暮独游": "Walking alone at dusk",
  "夜读": "Night reading",
  "夜案": "Night assizes",
  "纵横晨局": "The diplomatists' morning board",
  "白马之辩": "The white-horse debate",
  "合纵游说": "Pleading the Vertical Alliance",
  "论道": "Discourse on the Way",
  "名实之辩": "The debate on names and realities",
  "再演纵横": "Vertical and horizontal, played again",
  "陈道德": "Setting out the Way and its virtue",
  "历物之意": "On the meaning of things",
  "寓言交流": "Trading parables",
  "连横游说": "Pleading the Horizontal Alliance",
  "观星推德": "Star-watching, reckoning the phases",
  "沙盘演阵": "Formations on the sand table",
  "强兵之辩": "The debate on a strong army",
  "战和之辩": "The debate on war and peace",
  "夜观星象": "Watching the night sky",
  "大河临渡": "At the great river ford",
  "驰道启程": "Setting out on the highway",
  "市井言义利": "Right and profit in the market",
  "招贤馆集会": "A gathering at the Hall",
  "过田舍问农": "Passing the farmstead, asking about farming",
  "驰道论轻重": "Weight and balance on the highway",
  "道山问道": "Asking the Way in the woods",
  "沙盘会兵家": "The military men meet at the sand table",
  "名家演两可": "The Logicians work it both ways",
  "法家论术势": "The Legalists on method and power",
  "韬略相承": "Strategy handed down",

  // 场景白描（人物档案的「此刻」一行之下，并入世界纪事）。
  // 这些是世界自己在演的事，不是典籍原文，故照译——档案里若独留一句中文，
  // 英文模式便看着像没做完。句中夹的人名（文子、田穰苴、尉缭、邓析、尹文、
  // 申不害、慎到、太公、黄石公）只在此处露面，不另立词条，就地给罗马字。
  "孔子据席而讲，弟子执简随录。":
    "Confucius lectures from his mat; the disciples take it down on bamboo.",
  "墨子调试连弩，绳枢吱呀作响。":
    "Mozi adjusts the repeating crossbow; the cord-pivot creaks.",
  "韩非以朱笔勘定条目，一字不肯苟且。":
    "Han Fei fixes the articles in red ink, letting not one word pass loosely.",
  "老子观水之就下，庄子笑看鱼乐。":
    "Laozi watches water seek the low; Zhuangzi smiles at the joy of fishes.",
  "孟子言善端，荀子言化性，两席相对不下。":
    "Mencius speaks of the sprouts of good, Xunzi of transforming one's nature; neither seat yields.",
  "墨子算材用之费，韩非问赏罚之据。":
    "Mozi reckons the cost of materials; Han Fei asks on what reward and punishment rest.",
  "食不语，庭中日影正中。":
    "No one speaks over food; in the courtyard the shadow stands at noon.",
  "庄子笑墨子太劳，墨子答天下方急。":
    "Zhuangzi laughs that Mozi toils too hard; Mozi answers that the world is in haste.",
  "揖让进退各有其节，荀子录其度数。":
    "Bow and yield, advance and retire, each to its measure; Xunzi records the figures.",
  "韩非陈势，孟子言民为贵，堂上气氛紧绷。":
    "Han Fei sets out positional power, Mencius that the people come first; the hall goes taut.",
  "墨者列于城垣，号令齐整。": "The Mohists line the ramparts, their orders crisp.",
  "百家列座，鼓声一响，众说并起。":
    "The hundred schools take their seats; at the drum, every doctrine rises at once.",
  "庄子影随水动，若不知身在何处。":
    "Zhuangzi's shadow moves with the water, as though he had forgotten where he stood.",
  "灯下竹简层叠，翻动声细碎。":
    "Bamboo slips lie stacked under the lamp, a fine rustle of turning.",
  "韩非按律断案，墨子记其得失。":
    "Han Fei decides the case by the code; Mozi notes what it gets right and what wrong.",
  "苏秦布合纵之局，张仪以连横破之。":
    "Su Qin lays out the Vertical Alliance; Zhang Yi breaks it with the Horizontal.",
  "公孙龙指白马立离坚白，惠施以合同异相难。":
    "Gongsun Long points to the white horse, parting hard from white; Hui Shi presses back with uniting same and different.",
  "苏秦立于广场，陈合纵之利，听者云集。":
    "Su Qin stands in the square setting out the gains of the Vertical Alliance; a crowd gathers.",
  "二人对坐论道，言简而意远。":
    "The two sit facing, discoursing on the Way — few words, far meaning.",
  "二人正名责实，言辞锋出，观者如堵。":
    "The two rectify names and hold things to them; the words cut, and onlookers wall them in.",
  "复布天下之局，二人各执一说。":
    "The board of the realm is laid out again; each holds to his own doctrine.",
  "老子寡言而立，偶陈道德，过客驻足。":
    "Laozi stands, sparing of words; now and then he speaks of the Way, and passers-by stop.",
  "惠施历数万物之理，听者或骇或笑。":
    "Hui Shi runs through the principles of the ten thousand things; his hearers are startled, or laugh.",
  "庄子述寓言，老子以正言若反之意应之。":
    "Zhuangzi tells a parable; Laozi answers that true words seem their opposite.",
  "张仪陈连横之便，辞锋凌厉。":
    "Zhang Yi sets out the convenience of the Horizontal Alliance, his words keen-edged.",
  "观星台上，邹衍仰观星象，推五行相胜之序以论时运。":
    "On the Star Terrace, Zou Yan looks up and reckons the order in which the Five Phases overcome one another, and from it the turn of the times.",
  "沙盘前，孙武以旗布阵，论虚实奇正之势。":
    "At the sand table, Sun Wu sets his formations with flags, discoursing on empty and full, direct and oblique.",
  "孙武言不战而屈人，韩非主富国强兵、耕战为本。":
    "Sun Wu would subdue the enemy without battle; Han Fei holds for a rich state and a strong army, with farming and war at the root.",
  "沙盘之侧，孙武论慎战全胜，墨子陈非攻之义。":
    "Beside the sand table, Sun Wu on caution in war and whole victory, Mozi on the case against aggression.",
  "入夜星盘承月，邹衍推阴阳消息之机以论当德。":
    "At nightfall the star dial takes the moon; Zou Yan reckons the waxing and waning of yin and yang to name the phase in power.",
  "老庄晨过渡口，大河奔涌，老子叹水之就下，庄子笑看渡头鱼乐。":
    "Laozi and Zhuangzi pass the ferry at dawn, the great river running on: Laozi sighs at how water seeks the low, Zhuangzi smiles at the joy of fishes off the landing.",
  "苏秦张仪策马驰道，关隘旌旗相望，各怀纵横之策。":
    "Su Qin and Zhang Yi ride the highway, the banners of the pass in sight of one another, each with his own alliance in mind.",
  "孟子过市井，闻商贾论利，乃申「何必曰利，亦有仁义而已」之旨。":
    "Mencius passes through the market, hears the merchants talk of profit, and presses his point: why speak of profit, when there are humaneness and right?",
  "荀子、公孙龙、孙武会于招贤馆，吕不韦居中集门客论学，三家各陈其说。":
    "Xunzi, Gongsun Long and Sun Wu meet at the Hall; Lü Buwei sits among them gathering his retainers to learning, and each of the three sets out his doctrine.",
  "墨子暮至田舍，观农者之劳，问稼穑之费，申节用、养民之旨。":
    "Mozi reaches the farmstead at dusk, watches the farmers' labour, asks the cost of sowing and reaping, and urges thrift and the nourishing of the people.",
  "管仲商鞅并行驰道，论富国之术——轻重九府与耕战壹赏，古今之政于焉相接。":
    "Guan Zhong and Shang Yang walk the highway together on the arts of enriching a state — the Nine Treasuries of fiscal balance against single-minded reward for farming and war; two ages of statecraft meet here.",
  "文子侍坐老子于道山，问道德之意，老子举水以喻——柔弱胜刚强。":
    "Wenzi sits in attendance on Laozi in the woods and asks the meaning of the Way and its virtue; Laozi takes water for his figure — the soft and weak overcome the hard and strong.",
  "田穰苴、吴起、尉缭会于沙盘，各陈兵要——军礼、教戒、刑名，兵家三支并陈。":
    "Tian Rangju, Wu Qi and Wei Liao meet at the sand table, each on the essentials of war — military rites, drill and admonition, punishment and name: three branches of the military school side by side.",
  "邓析、尹文、公孙龙会于名家馆，两可、正名、白马，名辩三代同堂。":
    "Deng Xi, Yin Wen and Gongsun Long meet at the Logicians' hall — both-ways, rectifying names, the white horse: three generations of name-disputation in one room.",
  "申不害、慎到、韩非会于讲堂，术、势、法三支相济，韩非集其成。":
    "Shen Buhai, Shen Dao and Han Fei meet in the lecture hall; method, position and law reinforce one another, and Han Fei brings them to a head.",
  "太公与黄石公会于沙盘，一文伐一发机、一柔一刚，韬略二系相与印证。":
    "Taigong and the Yellow Stone Elder meet at the sand table — one for attack by stratagem, one for seizing the moment, one soft, one hard: two lines of strategy proving each other out.",

  // ── 二十、配音、校验、视频 ─────────────────────────────────
  "点击配音": "Read aloud",
  "正在配音……": "Reading aloud…",
  "停止配音": "Stop",
  "配音不可用，点此重试": "Narration unavailable — click to retry",
  "正在校验一致性……": "Checking consistency…",
  // 三档判定的含义，按人格之属分三套（见 world/dialogue.ts 的 verdictExplain）：
  // 立论者审学说、叙事人物审性情、西贤审其学识与作品。
  "合规：与本家学说一致、口吻得体；纵论现代议题亦能以先秦学理回应。":
    "Consistent: in keeping with the school's doctrine and fitting in tone; even modern questions are answered from pre-Qin principles.",
  "存疑：略有出入或口吻过现代而尚可两解，未根本相悖。":
    "Doubtful: a little off, or too modern in tone, but open to either reading and not fundamentally at odds.",
  "矛盾：明显违背其核心主张，或用先秦不可能有的概念框架，或误引他家为自家。":
    "Contradictory: plainly against the thinker's core claims, or using a conceptual frame impossible before the Qin, or claiming another school's words as their own.",
  "合规：语气、脾性、处事之道皆与此人相合，所述经历不与原著相违。":
    "Consistent: voice, temper and conduct all fit this character, and nothing recounted runs against the original book.",
  "存疑：略显文气或过于讲理，尚不失其人。":
    "Doubtful: a touch too literary or too reasonable, yet still recognisably the same person.",
  "矛盾：说成了一个讲道理的学者（援引典籍、以学派立论），或性情与原著明显相悖，或编造其未曾有过的经历。":
    "Contradictory: turned into a reasoning scholar (citing classics, arguing from a school), or plainly out of character, or given experiences the original never gave them.",
  "合规：所言本于其自家学识与作品，思路与关切仍是其人的；论他书他题亦以自家学理回应。":
    "Consistent: grounded in this thinker's own learning and works — the concerns and turn of mind are still theirs, and other books and topics are answered from their own doctrine.",
  "存疑：略显泛论或游离其本业，尚可两解。":
    "Doubtful: somewhat general, or drifting from their own field; it can be read either way.",
  "矛盾：离其作品与学识甚远，或混入先秦概念与中式学理而说成本家之言，或说成了另一个人。":
    "Contradictory: far from their works and learning, or pre-Qin concepts and Chinese doctrine passed off as their own, or simply another person speaking.",
  校: "Check",
  "（同源自审）": "(same-model self-check)",
  "（异源外证）": "(independent model)",
  "校验官：{verifier}{kind}": "Checked by {verifier} {kind}",
  "生成视频": "Make a video",
  "生成AI视频": "Make an AI video",
  "生成中…": "Generating…",
  // 钮上那一枚「◗」是记号不是字，照旧；后头的话随处而异，由调用者给
  "◗ {label}": "◗ {label}",
  "↻ 重新生成": "↻ Generate again",
  "正在绘制场景关键帧……": "Painting the key frame…",
  "场景绘制失败（或未开通图像模型）":
    "Key frame failed (the image model may not be enabled)",
  "关键帧生成中，约十数秒……": "Key frame rendering, about a dozen seconds…",
  "关键帧生成失败": "Key frame failed",
  "关键帧生成超时": "Key frame timed out",
  "正在令画面动起来……": "Setting the picture in motion…",
  "视频生成提交失败（可能未开通视频模型）":
    "Could not submit the video job (the video model may not be enabled)",
  "视频生成中，约需一分钟……": "Video rendering, about a minute…",
  "视频生成失败": "Video failed",
  "视频生成超时": "Video timed out",

  // ── 二十一、人名与学派 ─────────────────────────────────────
  "孔子": "Confucius",
  "孟子": "Mencius",
  "荀子": "Xunzi",
  "墨子": "Mozi",
  "庄子": "Zhuangzi",
  "韩非": "Han Fei",
  "苏秦": "Su Qin",
  "张仪": "Zhang Yi",
  "公孙龙": "Gongsun Long",
  "惠施": "Hui Shi",
  "老子": "Laozi",
  "邹衍": "Zou Yan",
  "孙武": "Sun Wu",
  "子思": "Zisi",
  "鬼谷子": "Guiguzi",
  "商鞅": "Shang Yang",
  "孙膑": "Sun Bin",
  "列子": "Liezi",
  "杨朱": "Yang Zhu",
  "许行": "Xu Xing",
  "曾子": "Zengzi",
  "吕不韦": "Lü Buwei",
  "管仲": "Guan Zhong",
  "吴起": "Wu Qi",
  客: "Guest",
  "墨家": "Mohist",
  "名家": "Logician",
  "纵横家": "Diplomatist",
  "阴阳家": "Yin-Yang",
  // 学派单字（脉络图道名）
  儒: "Confucian",
  墨: "Mohist",
  "纵横": "Diplomatist",
  名: "Logician",
  "阴阳": "Yin-Yang",
  兵: "Military",
  农: "Agrarian",
  杂: "Syncretist",
  "未详": "unknown",

  // ── 二十二、引文书名 ───────────────────────────────────────
  //
  // 引文作《书·篇》两级。**书名译，篇名不译**：书名是读者认门的招牌——英文读者见
  // "Analects" 便知所出，见「论语」则未必；篇名则是这部书自家的目次，《学而》《齐物论》
  // 既无通行译名，强译只换来一个谁也查不到的新名目，反不如留着原字，照着能在任何一部
  // 中文本子里翻到。故英文模式下引文作《Analects·学而》，一半认门，一半可查。
  //
  // 四库著录的一千余部不在此列：那是一份中文书目，按原名著录即是它本来的样子。
  "论语": "Analects",
  "道德经": "Daodejing",
  "韩非子": "Hanfeizi",
  "公孙龙子": "Gongsun Longzi",
  "子思子": "Zisizi",
  "邹子": "Zouzi",
  "惠子": "Huizi",
  "苏子": "Suzi",
  "张子": "Zhangzi",
  "文子": "Wenzi",
  "邓析子": "Dengxizi",
  "尹文子": "Yin Wenzi",
  "申子": "Shenzi (Shen Buhai)",
  "慎子": "Shenzi (Shen Dao)",
  "管子": "Guanzi",
  "吴子": "Wuzi",
  "尉繚子": "Weiliaozi",
  "商君书": "The Book of Lord Shang",
  "吕氏春秋": "Lü's Spring and Autumn Annals",
  "战国策": "Strategies of the Warring States",
  "周易": "The Book of Changes",
  "尚书": "The Book of Documents",
  "汉书": "The Book of Han",
  "大学": "The Great Learning",
  "孝经": "The Classic of Filial Piety",
  "孙子兵法": "Sunzi's Art of War",
  "孙膑兵法": "Sun Bin's Art of War",
  "司马法": "The Methods of the Sima",
  "六韬": "The Six Secret Teachings",
  "三略": "The Three Strategies",

  // ── 二十三、脉络图上的节点名 ───────────────────────────────
  // 长卷上每个圈旁都写着名字，图在英文模式下若仍是中文，这张图便读不成。
  // 人名照汉语拼音转写（学界通行的几位用通行名：Confucius、Mencius…已在二十一节）。
  // 地域
  "齐鲁": "Qi and Lu",
  楚: "Chu",
  "三晋": "The Three Jin",
  周: "Zhou",
  // 幽灵节点与汉以后著者
  "周文王": "King Wen of Zhou",
  "屈原": "Qu Yuan",
  "刘向": "Liu Xiang",
  "董仲舒": "Dong Zhongshu",
  "司马迁": "Sima Qian",
  "刘安": "Liu An",
  "王充": "Wang Chong",
  "葛洪": "Ge Hong",
  "刘义庆": "Liu Yiqing",
  "刘勰": "Liu Xie",
  "钟嵘": "Zhong Rong",
  "惠能": "Huineng",
  "贾思勰": "Jia Sixie",
  "司马光": "Sima Guang",
  "朱熹": "Zhu Xi",
  "王守仁": "Wang Shouren",
  "袁黄": "Yuan Huang",
  "宋应星": "Song Yingxing",
  "施耐庵": "Shi Nai'an",
  "罗贯中": "Luo Guanzhong",
  "吴承恩": "Wu Cheng'en",
  "蒲松龄": "Pu Songling",
  "吴敬梓": "Wu Jingzi",
  "曹雪芹": "Cao Xueqin",
  "李汝珍": "Li Ruzhen",
  "王国维": "Wang Guowei",
  "普济": "Puji",
  "杨子": "Yangzi",
  // 旧题之书（以书为节点者）
  "三十六计": "The Thirty-Six Stratagems",
  "山海经": "Classic of Mountains and Seas",
  "神农之言": "Sayings of the Divine Farmer",

  // ── 二十四、脉络图上的思想名 ───────────────────────────────
  // 思想节点是这张图的筋骨——诸子所争者在此，故一条不留。
  "仁": "Benevolence",
  "义": "Righteousness",
  "礼": "Ritual",
  "法": "Law",
  "道": "The Way",
  "兼爱": "Impartial care",
  "性善": "Innate goodness",
  "性恶": "Innate badness",
  "无为": "Non-action",
  "逍遥": "Free wandering",
  "非攻": "Against aggression",
  "节用": "Frugality",
  "术势": "Technique and position",
  "名实": "Name and reality",
  "五德终始": "Cycle of the five powers",
  "奇正": "The unorthodox and the orthodox",
  "合纵连横": "Alliance and alignment",
  "耕战": "Farming and war",
  "因势": "Riding the situation",
  "贵虚": "Honouring emptiness",
  "为我": "For oneself",
  "并耕": "All plough alike",
  孝: "Filial piety",
  省: "Self-examination",
  "轻重": "Light and heavy",
  "牧民": "Shepherding the people",
  术: "Technique",
  势: "Position",
  "两可": "Both ways",
  "检形": "Checking form against name",
  "文德武备": "Civil virtue, military readiness",
  "以战止战": "War to end war",
  "天官人事": "Heaven's signs or human effort",
  "文伐": "Attack by civil means",
  "柔弱制刚": "The soft subdues the hard",
  "上仁": "Highest benevolence",
  变: "Change",
  "民本": "The people as the root",
  "思无邪": "No thought gone astray",
  "大同": "The great commonwealth",
  "孝治": "Rule by filial piety",
  "三不朽": "The three immortalities",
  "正名分": "Setting names and stations right",
  "权谋": "Expedient scheming",
  "天人感应": "Resonance between heaven and man",
  "因循": "Letting things follow their course",
  "疾虚妄": "War on falsehood",
  "清谈": "Pure conversation",
  "神仙养生": "Immortals and the nurture of life",
  "顿悟": "Sudden awakening",
  "资治": "Aid to governance",
  "格物致知": "Investigate things, extend knowledge",
  "知行合一": "Knowing and acting are one",
  "立命": "Making one's own fate",
  "天工开物": "Heaven's craft, things opened",
  "诡道": "The way of deception",
  "忠义": "Loyalty and brotherhood",
  "心猿": "The monkey of the mind",
  "色空": "Form and emptiness",
  "志怪": "Records of the strange",
  "功名": "Rank and renown",
  "境界": "Realms of feeling",
  "文以载道": "Writing carries the way",
  "香草美人": "Fragrant herbs and fair ladies",
  "博物": "Breadth of things",
  "才情": "Talent and feeling",
  "博识": "Wide learning",
  "通变": "Mastery of change",
  "滋味": "Lingering flavour",
  "顺天时": "Follow the season",
  "演义": "Elaborated history",
  "拈花微笑": "The flower held up, the smile",

  // ── 二十五、脉络图上的节点提要 ─────────────────────────────
  // 悬停与详情栏里那一行小字。原文多用典，译文求其所指明白，不逐字对仗。
  // 书名在正文里照书名条译，此处随句行文，不另加《》。
  "姬昌，周文王，相传演《周易》而作卦辞；儒家奉为先圣。":
    "Ji Chang, King Wen of Zhou; said to have worked out the hexagrams and composed their lines. Revered by the Confucians as an ancient sage.",
  "楚之同姓大夫，忧愤而作《离骚》，香草美人以配忠贞。":
    "A royal kinsman and officer of Chu who wrote the Li Sao out of grief and anger, matching fragrant herbs and fair ladies to loyalty.",
  "汉宗室，校书天禄阁，集《战国策》《说苑》《新序》《列仙传》。":
    "Han imperial kinsman, collator in the Tianlu Pavilion; compiled the Strategies of the Warring States, the Garden of Persuasions, the New Prefaces and the Lives of the Immortals.",
  "汉儒宗，天人三策，《春秋繁露》天人感应之说。":
    "The great Han Confucian; his three memorials on heaven and man, and the doctrine of resonance in the Luxuriant Dew of the Spring and Autumn.",
  "汉太史令，究天人之际、通古今之变，成一家之言（《史记》）。":
    "Grand Scribe of Han: he probed the border of heaven and man and the changes of past and present, and made a school of his own (the Records of the Grand Historian).",
  "汉淮南王，招客集《淮南子》，牢笼天地、博极人情。":
    "Prince of Huainan under the Han; gathered retainers to compile the Huainanzi, caging heaven and earth and exhausting human feeling.",
  "汉处士，闭门潜思《论衡》，实事疾妄、归实诚。":
    "A Han recluse who shut his door and thought out the Balanced Discourses - facts against falsehood, a return to the plain and true.",
  "晋丹阳人，抱朴子内篇论神仙方药、炼养形神。":
    "A Jin man of Danyang; the inner chapters of the Baopuzi treat immortals, drugs, and the refining of body and spirit.",
  "南朝宋临川王，招才学之士集《世说新语》。":
    "Prince of Linchuan under the Song of the Southern Dynasties; gathered men of talent to compile the New Account of Tales of the World.",
  "南朝梁，笃志好学，《文心雕龙》体大思精。":
    "Of the Liang in the south, a devoted scholar; the Literary Mind and the Carving of Dragons is vast in frame and fine in thought.",
  "南朝梁，品第汉魏至梁五言诗人，《诗品》辨彰清浊。":
    "Of the Liang in the south; he ranked the five-word poets from Han and Wei down to Liang, sorting the clear from the muddy in the Gradations of Poetry.",
  "禅宗六祖，不识文字而悟道，《坛经》记其言——中国佛教唯一称经之祖师录。":
    "Sixth patriarch of Chan, who awakened without letters; the Platform Sutra records his words - the only Chinese patriarch's record called a sutra.",
  "北魏高阳太守，采捃经传、《齐民要术》农政之要。":
    "Prefect of Gaoyang under the Northern Wei; gleaned from the classics to set down the essentials of farming in the Essential Techniques for the Common People.",
  "宋涑水先生，编《资治通鉴》，鉴前世之兴衰。":
    "Master Sushui of the Song; compiled the Comprehensive Mirror for Aid in Governance, a mirror of the rise and fall of former ages.",
  "宋晦庵先生，集理学之大成，《朱子语类》格物致知之教。":
    "Master Huian of the Song, who brought Neo-Confucianism to its summit; the Classified Conversations teach the investigation of things.",
  "明阳明子，龙场悟道，《传习录》知行合一之教。":
    "Master Yangming of the Ming, who awakened at Longchang; the Instructions for Practical Living teach that knowing and acting are one.",
  "明了几先生，《了凡四训》立命之说、功过格之教。":
    "Master Liaofan of the Ming; the Four Lessons teach that one makes one's own fate, and the ledger of merits and faults.",
  "明奉新人，《天工开物》贵五谷而贱金玉。":
    "A Ming man of Fengxin; his Exploitation of the Works of Nature prizes the five grains over gold and jade.",
  "元末明初人，相传集撰《水浒传》。":
    "Of the late Yuan and early Ming; said to have compiled the Water Margin.",
  "元末明初人，《三国演义》七实三虚。":
    "Of the late Yuan and early Ming; his Romance of the Three Kingdoms is seven parts fact to three parts fiction.",
  "明射阳山人，《西游记》心猿之喻。":
    "The Hermit of Sheyang, of the Ming; the Journey to the West and its figure of the monkey of the mind.",
  "明清之际辑成之兵家佚名汇编，托南朝宋檀道济事。":
    "An anonymous military compilation put together around the Ming-Qing transition, attributed to the exploits of Tan Daoji of the Southern Song.",
  "清柳泉居士，《聊斋志异》孤愤之书。":
    "The Recluse of Liuquan, of the Qing; the Strange Tales from a Chinese Studio, a book of solitary indignation.",
  "清文木老人，《儒林外史》功名之讽。":
    "The Old Man of Wenmu, of the Qing; the Unofficial History of the Scholars, a satire on rank and renown.",
  "清悼红轩主，《红楼梦》色空之辨，十年辛苦不寻常。":
    "Master of the Mourning-Red Studio, of the Qing; the Dream of the Red Chamber weighs form against emptiness - ten years of no ordinary labour.",
  "清松石道人，《镜花缘》才情之颂。":
    "The Daoist of Songshi, of the Qing; Flowers in the Mirror, a hymn to talent and feeling.",
  "清民之际海宁王氏，《人间词话》境界说。":
    "The Wang of Haining, at the turn from Qing to Republic; the Poetic Remarks in the Human World and its doctrine of realms.",
  "旧题大禹、伯益所作，实为先秦方术之书所萃——山川草木鸟兽虫鱼，志怪之祖。":
    "Traditionally ascribed to Yu the Great and Bo Yi, in fact a distillation of pre-Qin occult books - mountains, rivers, plants, beasts, birds, insects and fish: the ancestor of all records of the strange.",
  "宋灵隐寺住持，辑禅门五家机缘为《五灯会元》。":
    "Abbot of Lingyin Temple in the Song; gathered the encounters of the five Chan houses into the Compendium of the Five Lamps.",
  "孔门后学辑录孔子言行。":
    "Confucius's words and acts, gathered by later followers of his school.",
  "老子著五千言，道家之本。":
    "Laozi's five thousand words, the root of the Daoists.",
  "孙武著，兵家之祖。":
    "By Sun Wu; the ancestor of the military writers.",
  "墨家言行与论辩集。":
    "The sayings, deeds and disputations of the Mohists.",
  "庄周及后学，汪洋恣肆。":
    "Zhuang Zhou and his later school - vast and unrestrained.",
  "孟轲及其徒记述。":
    "Set down by Meng Ke and his disciples.",
  "荀况著，儒而开法家之端。":
    "By Xun Kuang: a Confucian who opened the way to the Legalists.",
  "公孙龙辩者之言。":
    "The words of Gongsun Long, the disputer.",
  "韩非集法家大成。":
    "Han Fei brings Legalism to its completion.",
  "吕不韦门客杂纂，兼收并蓄。":
    "A miscellany by Lu Buwei's retainers, taking in all schools.",
  "纵横捭阖之术，后学辑录。":
    "The arts of alliance and persuasion, gathered by later students.",
  "苏秦合纵言策，多佚，散见《战国策》。":
    "Su Qin's case for the vertical alliance; mostly lost, scattered through the Strategies of the Warring States.",
  "张仪连横言策，多佚，散见《战国策》。":
    "Zhang Yi's case for the horizontal alignment; mostly lost, scattered through the Strategies of the Warring States.",
  "惠施历物十事，散见《庄子·天下》。":
    "Hui Shi's ten propositions on things, scattered through the Tianxia chapter of the Zhuangzi.",
  "邹衍五德终始、大九州说，多佚。":
    "Zou Yan's cycle of the five powers and his doctrine of the nine great continents; mostly lost.",
  "子思及门人记述，《中庸》相传出其手。":
    "Set down by Zisi and his disciples; the Doctrine of the Mean is traditionally his.",
  "管仲及后学，托名之作；轻重、牧民、内业，法家之先声而杂黄老。":
    "Guan Zhong and his later school, written under his name; the chapters on light and heavy, on shepherding the people, on inner work - a forerunner of Legalism mixed with Huang-Lao.",
  "老子弟子记其言，解老而杂黄老刑名，下开文景之治。":
    "A disciple records Laozi's words, explaining him by way of Huang-Lao and the names-and-punishments school; it opens onto the reigns of Wen and Jing.",
  "邓析及后学，两可之说、无穷之辞，名辩之先河。":
    "Deng Xi and his later school: the doctrine that both ways hold and the endless phrase - the headwaters of name-disputation.",
  "尹文及后学，名以检形、形以检名，稷下黄老刑名之间。":
    "Yin Wen and his later school: name checks form and form checks name - between Huang-Lao and names-and-punishments at Jixia.",
  "申不害及后学，主术——循名责实、君操其柄，法家「术」系由此立。":
    "Shen Buhai and his later school hold to technique - hold a man to his title, and let the ruler keep the handles; the Legalist line of 'technique' starts here.",
  "慎到及后学，主势——势位足以屈贤者，法家「势」系由此立。":
    "Shen Dao and his later school hold to position - place and power suffice to bend the worthy; the Legalist line of 'position' starts here.",
  "吴起及后学，内修文德、外治武备，用兵在治不在众。":
    "Wu Qi and his later school: cultivate civil virtue within and military readiness without; war is won by order, not by numbers.",
  "田穰苴及齐威王诸臣追论古司马兵法，以仁为本、以义治之，军礼之遗。":
    "Tian Rangju and the ministers of King Wei of Qi reconstruct the old Sima art of war: benevolence as the root, righteousness as the rule - what remains of military ritual.",
  "尉缭及后学，天官不若人事，兵刑相守，杂刑名于兵家。":
    "Wei Liao and his later school: heaven's signs count for less than human effort; war and punishment guard each other - names-and-punishments brought into military thought.",
  "托吕望与文武问答，文伐、发机、韬晦，兵家权谋之祖（旧题）。":
    "Cast as a dialogue between Lu Wang and Kings Wen and Wu: attack by civil means, springing the trigger, keeping oneself hidden - the ancestor of military scheming (traditional attribution).",
  "托黄石公圯上授张良事，柔弱制刚强、因敌转化（旧题）。":
    "Cast as the Yellow Stone Elder's gift to Zhang Liang on the bridge: the soft subdues the hard, and one turns with the enemy (traditional attribution).",
  "文王演卦，相传作卦辞；孔子作十翼传之。群经之首。":
    "King Wen worked out the hexagrams and, it is said, their lines; Confucius added the Ten Wings. First of all the classics.",
  "记尧舜禹汤武之政，相传孔子删定。上古政书。":
    "The governance of Yao, Shun, Yu, Tang and Wu, said to have been edited by Confucius. The oldest book of state.",
  "商鞅及后学，法家耕战、任法不任人之本。":
    "Shang Yang and his later school: the Legalist root of farming and war, and of trusting law rather than men.",
  "孙膑著，银雀山汉简出土残简；久佚千余年，1972 年重现，四库正文已切。":
    "By Sun Bin, surviving as fragments among the Han bamboo slips of Yinqueshan; lost for over a thousand years, it resurfaced in 1972, and its text is cut into this library.",
  "列御寇及后学，《冲虚真经》，寓言瑰丽，贵虚顺物。":
    "Lie Yukou and his later school; the Classic of Pervading Emptiness - gorgeous parables that honour emptiness and go along with things.",
  "杨朱无专著，辑其言散见《孟子》《列子·杨朱》《吕氏春秋》。":
    "Yang Zhu left no book of his own; his sayings are gathered from the Mencius, the Yang Zhu chapter of the Liezi, and the Lushi Chunqiu.",
  "许行无专著，辑其事见《孟子·滕文公上》，农家并耕之说。":
    "Xu Xing left no book; what is known of him comes from the Mencius, Teng Wen Gong I - the agrarian doctrine that all plough alike.",
  "曾子及后学述作，儒家修齐治平之纲；本《礼记》篇，宋人表章。":
    "By Zengzi and his later school, the Confucian frame of self-cultivation, family, state and peace; originally a chapter of the Book of Rites, singled out by the Song.",
  "曾子问孝、孔子答，孝为德本；十八章。":
    "Zengzi asks about filial piety and Confucius answers: filial piety is the root of virtue. Eighteen chapters.",
  "儒之核，爱人复礼。":
    "The core of Confucianism: love others, return to ritual.",
  "克己复礼，秩序之分。":
    "Master yourself and return to ritual: the ordering of stations.",
  "行之宜，合于道。":
    "What is fitting in action, in accord with the way.",
  "四端固有，性本善。":
    "The four beginnings are innate: human nature is good.",
  "其善者伪也，待教化。":
    "What is good in it is made: nature awaits teaching.",
  "万物本根，不可言说。":
    "The root of all things, of which nothing can be said.",
  "道常无为而无不为。":
    "The way does nothing, and leaves nothing undone.",
  "乘物游心，无所待。":
    "Ride on things and let the mind wander, depending on nothing.",
  "视人之国若己之国。":
    "Regard another's state as your own.",
  "攻国为大不义。":
    "To attack a state is the great injustice.",
  "去无用之费。":
    "Do away with useless expense.",
  "法不阿贵，绳不挠曲。":
    "Law does not flatter the noble; the measuring line does not bend.",
  "二柄刑德，君之驭臣。":
    "The two handles, punishment and reward: how a ruler drives his ministers.",
  "名实之辩，正名指物。":
    "The dispute of name and reality: setting names right, pointing at things.",
  "五行相胜，受命代嬗。":
    "The five phases overcome one another; the mandate passes in turn.",
  "兵无常势，奇正相生。":
    "War has no constant shape; the unorthodox and the orthodox beget each other.",
  "缩长之策，纵横捭阖。":
    "Policies of shortening and lengthening; alliance, alignment, opening and closing.",
  "以农战富国强兵，利出一孔。":
    "Enrich the state and strengthen the army by farming and war; let profit flow through one hole only.",
  "因势利导，批亢捣虚，以奇胜。":
    "Lead with the situation, strike where it is strained and empty, and win by the unorthodox.",
  "体虚顺物，御风而行，守虚得其真。":
    "Be empty and go along with things, ride the wind, and keep to emptiness to find what is true.",
  "全性保真，拔一毛利天下不为。":
    "Keep nature whole and truth intact: he would not give one hair to benefit the world.",
  "君臣并耕而食，市贾不贰。":
    "Ruler and minister plough alike for their food, and market prices are not doubled.",
  "孝为德本，慎终追远，吾日三省。":
    "Filial piety is the root of virtue: attend to the end, honour the distant, and examine yourself three times a day.",
  "吾日三省吾身，修身之本。":
    "I examine myself three times a day - the root of self-cultivation.",
  "轻重九府，通汙滞、制丰歉，富国在驭利权。":
    "The nine offices of light and heavy: clear what is stagnant, balance glut against dearth - a rich state turns on holding the lever of profit.",
  "政之所兴在顺民心，仓廪实则知礼节。":
    "Government rises by following the people's hearts: when the granaries are full, they know ritual and restraint.",
  "循名责实，君操其柄；明君如身，臣如手。":
    "Hold a man to his title, and let the ruler keep the handles; the enlightened ruler is the body, the ministers the hands.",
  "贤者未足以服众，势位足以屈贤者。":
    "Worth alone will not win obedience; place and power are enough to bend the worthy.",
  "操两可之说，设无穷之辞，是非在人所主。":
    "Argue that both ways hold and set out an endless phrase: right and wrong rest on what a man upholds.",
  "名以检形、形以检名；名正则治，名丧则乱。":
    "Name checks form and form checks name: when names are right there is order; when names are lost, disorder.",
  "内修文德，外治武备；用兵在治不在众。":
    "Civil virtue within, military readiness without; war is won by order, not by numbers.",
  "以仁为本，以义治之；国虽大好战必亡，忘战必危。":
    "Benevolence as the root, righteousness as the rule: a great state that loves war will fall, and one that forgets war is in danger.",
  "天官时日不若人事；兵者以武为植、以文为种。":
    "Heaven's signs and lucky days count for less than human effort: in war the martial is the planting and the civil the seed.",
  "不战而屈人之国：因其所喜顺其所欲，文事伐之。":
    "Subdue another's state without a battle: go with what he likes and what he wants, and attack him by civil means.",
  "柔能制刚，弱能制强；因敌转化，兼四者而制其宜。":
    "The soft can subdue the hard and the weak the strong; turn with the enemy, and hold all four so as to meet what fits.",
  "道德之治，功成不名有；上仁与道合，文景之治由此。":
    "Rule by the way and its virtue: the work is done and no name is claimed; highest benevolence accords with the way - hence the reigns of Wen and Jing.",
  "一阴一阳之谓道；观变于阴阳而立卦（《周易》）。":
    "One yin and one yang: this is called the way; observing their changes, the hexagrams were set up (Book of Changes).",
  "穷则变，变则通，通则久（《周易·系辞》）。":
    "At an end, it changes; changing, it passes through; passing through, it lasts (Book of Changes, Appended Phrases).",
  "民惟邦本，本固邦宁（《尚书·五子之歌》）。":
    "The people are the root of the state; the root firm, the state at peace (Book of Documents, Song of the Five Sons).",
  "诗三百，一言以蔽之，曰思无邪（《诗经》孔子所论）。":
    "Three hundred poems, summed up in a word: no thought gone astray (Confucius on the Book of Songs).",
  "大道之行也，天下为公（《礼记·礼运》）。":
    "When the great way prevailed, the world was held in common (Book of Rites, Conveyance of Rites).",
  "以孝治天下（《孝经》），孝为德之本、治之基。":
    "Rule the world by filial piety (Classic of Filial Piety): it is the root of virtue and the ground of government.",
  "太上有立德，其次立功，其次立言（《春秋左传》穆叔论不朽）。":
    "Highest is to establish virtue, next merit, next words (Zuo Tradition, Mushu on immortality).",
  "《春秋》以道名分，一字之褒荣于华衮，一字之贬严于斧钺。":
    "The Spring and Autumn Annals set names and stations by a single word: a word of praise outshines embroidered robes, a word of blame cuts deeper than the axe.",
  "《战国策》所载纵横短长之术，敷扬权变以济时急。":
    "The arts of alliance and persuasion in the Strategies of the Warring States: expedience spread wide to meet the urgency of the hour.",
  "天人相与之际，灾异谴告（《春秋繁露》）。":
    "At the joining of heaven and man, calamities come as reproof (Luxuriant Dew of the Spring and Autumn).",
  "因循而任下，责成而不劳（《淮南子》主术训承黄老）。":
    "Let things follow their course and leave them to those below; require results without toil (Huainanzi, Arts of Rulership, after Huang-Lao).",
  "实事疾妄，归实诚（《论衡》）——讥虚美、考实效。":
    "Facts against falsehood, a return to the plain and true (Balanced Discourses) - mocking empty praise, testing real effect.",
  "《世说新语》所记魏晋名士风度——玄远之辩、任率之行。":
    "The bearing of the Wei-Jin gentlemen as recorded in the New Account of Tales of the World - far-reaching debate and unforced conduct.",
  "玄寂求仙、炼养形神（《抱朴子内篇》）道教育养之说。":
    "Seeking immortality in stillness, refining body and spirit (Baopuzi, inner chapters): the Daoist doctrine of nurture.",
  "不立文字，直指人心，见性成佛（《坛经》）。":
    "No reliance on letters: point straight at the mind, see your nature and become a buddha (Platform Sutra).",
  "鉴前世之兴衰，考当今之得失（《资治通鉴》）。":
    "Mirror the rise and fall of former ages, weigh the gains and losses of the present (Comprehensive Mirror for Aid in Governance).",
  "即物穷理，格物而后知至（《朱子语类》）。":
    "Go to things and exhaust their pattern: investigate things, and knowledge arrives (Classified Conversations of Master Zhu).",
  "知是行之始，行是知之成（《传习录》）。":
    "Knowing is the beginning of acting; acting is the completing of knowing (Instructions for Practical Living).",
  "命由我作，福自己求（《了凡四训》）——功过格之教。":
    "Fate is of my own making, fortune of my own seeking (Four Lessons of Liaofan) - the teaching of the ledger of merits and faults.",
  "贵五谷而贱金玉，天人各半其功（《天工开物》）。":
    "Prize the five grains over gold and jade; heaven and man each do half the work (Exploitation of the Works of Nature).",
  "兵者诡道，诳也——三十六计，走为上。":
    "War is the way of deception - of the thirty-six stratagems, running away is best.",
  "替天行道、兄弟义气（《水浒传》）草泽之伦理。":
    "Acting for heaven, standing by one's brothers (Water Margin): the ethics of the marshes.",
  "心猿意马，猿熟马驯方成佛（《西游记》）修心之喻。":
    "The monkey of the mind and the horse of the will: only when the monkey is ripe and the horse tamed does one become a buddha (Journey to the West) - a figure for cultivating the mind.",
  "假作真时真亦假，无为有处有还无（《红楼梦》）梦觉之辨。":
    "When the false is taken for true, the true turns false; where nothing is held to be something, the something is nothing again (Dream of the Red Chamber): dream weighed against waking.",
  "集腋为裘，妄续幽冥之录（《聊斋志异》）孤愤之书。":
    "Patching a fur coat from scraps, rashly continuing the records of the dark (Strange Tales from a Chinese Studio): a book of solitary indignation.",
  "功名富贵无凭据（《儒林外史》）士林之讽。":
    "Rank, renown and riches rest on nothing (Unofficial History of the Scholars): a satire on the literati.",
  "有我之境无我之境，三重境界说（《人间词话》）。":
    "Realms with a self and realms without; the doctrine of three realms (Poetic Remarks in the Human World).",
  "道沿圣以垂文，圣因文而明道（《文心雕龙》）。":
    "The way comes down as writing through the sages, and the sages make the way plain through writing (Literary Mind and the Carving of Dragons).",
  "善鸟香草以配忠贞，恶禽臭物以比谗佞（楚辞之喻）。":
    "Fair birds and fragrant herbs stand for loyalty, foul birds and rank things for slander (the figures of the Chu songs).",
  "山川草木鸟兽虫鱼，志怪之祖（《山海经》）。":
    "Mountains, rivers, plants, beasts, birds, insects and fish: the ancestor of records of the strange (Classic of Mountains and Seas).",
  "百花齐放的女儿才情之颂（《镜花缘》）。":
    "A hymn to the talent and feeling of daughters, a hundred flowers in bloom (Flowers in the Mirror).",
  "穷物理、多见而后断（《天工开物》之余绪、格物之遗风）。":
    "Exhaust the pattern of things, and judge only after seeing much (in the wake of the Exploitation of the Works of Nature, and of the investigation of things).",
  "究天人之际，通古今之变，成一家之言（《史记》）。":
    "Probe the border of heaven and man, master the changes of past and present, and make a school of one's own (Records of the Grand Historian).",
  "使味之者无极，闻之者动心（《诗品》五言之道）。":
    "Let the taste of it be endless and the hearer's heart be moved (Gradations of Poetry, on the five-word line).",
  "顺天时，量地利，则用力少而成功多（《齐民要术》）。":
    "Follow the season and measure the ground, and little effort brings much done (Essential Techniques for the Common People).",
  "依史以演事，文不甚深，言不甚俗（《三国演义》开演义之体）。":
    "Elaborate events along the history: the writing not too deep, the speech not too coarse (Romance of the Three Kingdoms, which founded the elaborated-history form).",
  "不立文字，教外别传——拈花一微笑，心传五家灯（《五灯会元》）。":
    "No reliance on letters, a transmission outside the teaching - a flower held up, a smile, and the lamp of five houses passed mind to mind (Compendium of the Five Lamps).",

  // ── 二十六、西游十三处与界外五处 ───────────────────────────
  // 此处卡上的地名、景语、所历之难，以及回次与回目。
  // 回目在此是卡上最大的一行字，若仍作中文，英文模式下这张卡便读不成，
  // 故破「篇名不译」之例译出；《西游记》回目是对句，不强求对仗，照两半分句行文。
  "东土长安":
    "Chang'an in the East",
  "奉旨西行":
    "Sent west by imperial order",
  "第十二回":
    "Chapter 12",
  "玄奘秉诚建大会，观音显象化金蝉":
    "Xuanzang in all sincerity holds the great mass; Guanyin appears and reveals the Golden Cicada",
  "十二—十三回（受旨在前，出关在后）":
    "Chapters 12-13 (the charge received, then the pass left behind)",
  "唐王亲饯于关外，一盏土酒未干。":
    "The Tang emperor sees him off beyond the pass; the cup of local wine is not yet dry.",
  "五行山":
    "Mountain of Five Elements",
  "压伏五百年":
    "Pinned down five hundred years",
  "揭帖既揭，石猴出山，紧箍随至。":
    "The seal once peeled away, the stone monkey comes out of the mountain - and the tight headband follows.",
  "第十四回":
    "Chapter 14",
  "心猿归正，六贼无踪":
    "The mind-monkey returns to the right; the six robbers vanish without trace",
  "第七回压下，第十四回放出——中间隔五百年":
    "Pinned down in chapter 7, released in chapter 14 - five hundred years in between",
  "石缝间草木半枯，六字真言犹贴。":
    "Grass and shrubs half withered in the rock cleft; the six-syllable spell still pasted there.",
  "高老庄":
    "Gao Village",
  "招赘之门":
    "A gate that took in a son-in-law",
  "高家女婿原是天蓬，一场闹里收了二徒。":
    "The Gao family's son-in-law was Marshal Tianpeng; in one commotion the second disciple is taken on.",
  "第十八回":
    "Chapter 18",
  "观音院唐僧脱难，高老庄大圣除魔":
    "At the Guanyin Monastery Tang Seng escapes harm; at Gao Village the Great Sage subdues a monster",
  "十八—十九回（除魔在前，收徒在后）":
    "Chapters 18-19 (the monster subdued first, the disciple taken after)",
  "彩门未拆，新妇已三年不出房。":
    "The wedding arch still stands, and the bride has not left her room in three years.",
  "流沙河":
    "River of Flowing Sand",
  "鹅毛不浮":
    "Where a goose feather sinks",
  "八百流沙界，三千弱水深；木叉指路，葫芦作舟。":
    "Eight hundred li of flowing sand, three thousand fathoms of weak water; Moksa shows the way, and a gourd serves as the boat.",
  "第二十二回":
    "Chapter 22",
  "八戒大战流沙河，木叉奉法收悟净":
    "Bajie does great battle at the River of Flowing Sand; Moksa, under orders, recruits Wujing",
  "水色赭黄，岸上骷髅九颗串成一项。":
    "The water runs ochre; on the bank nine skulls are strung into a necklace.",
  "五庄观":
    "Wuzhuang Abbey",
  "人参果树":
    "The manfruit tree",
  "推倒仙根，镇元子袖里乾坤；观音甘露方活。":
    "The immortal root is pushed over; Zhenyuanzi hides heaven and earth in his sleeve, and only Guanyin's sweet dew brings it back.",
  "第二十四回":
    "Chapter 24",
  "万寿山大仙留故友，五庄观行者窃人参":
    "On Longevity Mountain the great immortal keeps an old friend; at Wuzhuang Abbey the Pilgrim steals the manfruit",
  "二十四—二十六回（窃果、推树、求方）":
    "Chapters 24-26 (stealing the fruit, felling the tree, seeking the cure)",
  "清风明月二童守门，果香三十里可闻。":
    "The boys Clear Wind and Bright Moon keep the gate; the fruit can be smelt thirty li off.",
  "白虎岭":
    "White Tiger Ridge",
  "三打白骨":
    "Three blows at the White Bone",
  "一尸三变，肉眼不识；贬书既下，大圣回山。":
    "One corpse in three guises, which mortal eyes cannot tell; the writ of banishment issued, the Great Sage goes back to his mountain.",
  "第二十七回":
    "Chapter 27",
  "尸魔三戏唐三藏，圣僧恨逐美猴王":
    "The corpse demon three times deceives Tang Sanzang; the holy monk in anger drives off the Handsome Monkey King",
  "乱石如齿，白骨一堆写着「白骨夫人」。":
    "Jagged rocks like teeth, and a heap of white bones inscribed 'Lady White Bone'.",
  "车迟国":
    "Kingdom of Chechi",
  "灭僧之国":
    "A kingdom that destroyed its monks",
  "三仙斗法，求雨坐禅砍头下油；僧囚得释。":
    "A contest with three immortals - calling rain, sitting in meditation, beheading, boiling in oil; the imprisoned monks are freed.",
  "第四十五回":
    "Chapter 45",
  "三清观大圣留名，车迟国猴王显法":
    "At the Abbey of the Three Pure Ones the Great Sage leaves his name; in Chechi the Monkey King shows his powers",
  "四十四—四十六回（见僧拉车、求雨斗法、灭诸邪）":
    "Chapters 44-46 (monks hauling carts, the rain contest, the undoing of the three)",
  "道士乘车，和尚拉车，国中无一座完整僧寺。":
    "Daoists ride the carts, monks haul them, and not one whole monastery is left in the land.",
  "通天河":
    "River That Reaches Heaven",
  "八百里阔":
    "Eight hundred li across",
  "灵感大王食童男女，老鼋负渡复沉经。":
    "The Great King Spirit devours boys and girls; the old turtle carries them over, and later sinks the scriptures.",
  "第四十七回":
    "Chapter 47",
  "圣僧夜阻通天水，金木垂慈救小童":
    "By night the holy monk is halted at the river that reaches heaven; Metal and Wood in mercy save the children",
  "四十七—四十九回；老鼋沉经另在第九十九回":
    "Chapters 47-49; the turtle sinks the scriptures later, in chapter 99",
  "陈家庄灯火未息，河面冰合又开。":
    "The lamps of Chen Village are still lit; the ice closes over the river and opens again.",
  "西梁女国":
    "Women's Kingdom of Western Liang",
  "举国无男":
    "A whole kingdom without men",
  "子母河水成胎，女王以一国相留；此难不在刀兵。":
    "The water of the Mother-and-Child River makes one pregnant, and the queen offers a kingdom to keep him; this ordeal is not fought with weapons.",
  "第五十四回":
    "Chapter 54",
  "法性西来逢女国，心猿定计脱烟花":
    "The nature of dharma, travelling west, meets the Women's Kingdom; the mind-monkey plots an escape from the snare of beauty",
  "五十三—五十四回（子母河在前，迎阳驿在后）":
    "Chapters 53-54 (the Mother-and-Child River first, then the Yingyang post-house)",
  "迎阳驿外花幢十里，女王凤目看定御弟。":
    "Ten li of flowered banners outside the post-house, and the queen's phoenix eyes fixed on the royal brother.",
  "火焰山":
    "Mountain of Flames",
  "八百里火":
    "Eight hundred li of fire",
  "三调芭蕉扇；旧日结义，今为仇雠。":
    "Three attempts at the palm-leaf fan; sworn brothers once, enemies now.",
  "第五十九回":
    "Chapter 59",
  "唐三藏路阻火焰山，孙行者一调芭蕉扇":
    "Tang Sanzang's road is blocked by the Mountain of Flames; Sun the Pilgrim makes a first attempt at the palm-leaf fan",
  "五十九—六十一回（一调、二调、三调）":
    "Chapters 59-61 (first, second and third attempts)",
  "无春无秋，飞鸟过即成灰。":
    "Neither spring nor autumn here; a bird that flies across turns to ash.",
  "小雷音寺":
    "Little Thunderclap Monastery",
  "伪佛之局":
    "A trap of false buddhas",
  "黄眉冒佛，金铙罩圣；真伪之辨，在此一关。":
    "Yellow Brow passes himself off as a buddha and claps the Great Sage under a golden cymbal; telling true from false is the test at this pass.",
  "第六十五回":
    "Chapter 65",
  "妖邪假设小雷音，四众皆遭大厄难":
    "A demon sets up a false Little Thunderclap; all four pilgrims meet with great distress",
  "六十五—六十六回（弥勒缚妖在后）":
    "Chapters 65-66 (Maitreya binds the demon after)",
  "牌额三字俨然，只是「小」字新刻。":
    "The three characters on the plaque look right enough - only the word 'Little' is newly carved.",
  "狮驼岭":
    "Lion Camel Ridge",
  "三魔食人":
    "Three monsters that eat men",
  "四万七千小妖，城中尽是白骨；大圣亦曾堕泪。":
    "Forty-seven thousand lesser demons, a city of nothing but bones; even the Great Sage wept here.",
  "第七十四回":
    "Chapter 74",
  "长庚传报魔头狠，行者施为变化能":
    "Changgeng brings word of how fierce the demons are; the Pilgrim sets to work with his powers of change",
  "七十四—七十七回（狮驼国一役，全书最长的一难）":
    "Chapters 74-77 (the Lion Camel campaign, the longest ordeal in the book)",
  "阴风裹腥，髑髅堆作城垛。":
    "A cold wind carrying the smell of blood; skulls stacked up as battlements.",
  "灵山雷音寺":
    "Thunderclap Monastery on Vulture Peak",
  "真经所在":
    "Where the true scriptures are",
  "凌云渡脱却凡胎，无字经还须人事。":
    "At the Cloud-Crossing Ford the mortal body is shed; and even then, blank scriptures must be put right by human effort.",
  "第九十八回":
    "Chapter 98",
  "猿熟马驯方脱壳，功成行满见真如":
    "Only when the monkey is ripe and the horse tamed is the shell cast off; the work done and the course run, they behold the True Thus-Come",
  "九十八—九十九回（得经在前，九九数完在后）":
    "Chapters 98-99 (the scriptures gained first, then the count of eighty-one completed)",
  "金光万道，八大金刚立于山门之外。":
    "Ten thousand shafts of golden light, and the eight vajra guardians standing outside the gate.",
  "花果山":
    "Mountain of Flowers and Fruit",
  "水帘洞天":
    "The Water Curtain Cave",
  "第一回":
    "Chapter 1",
  "灵根育孕源流出，心性修持大道生":
    "The divine root conceived, its source flows forth; mind and nature cultivated, the great way is born",
  "一—七回称王起事；第二十八回贬回本山":
    "Chapters 1-7, from kingship to revolt; banished back to this mountain in chapter 28",
  "瀑布飞泉挂作帘幕，石碣上「花果山福地」六字犹新。":
    "The waterfall hangs like a curtain, and the six characters on the stone tablet - Blessed Land of the Mountain of Flowers and Fruit - still look new.",
  "斜月三星洞":
    "Cave of the Slanting Moon and Three Stars",
  "灵台方寸山":
    "Mountain of the Spirit Terrace, an inch square",
  "第二回":
    "Chapter 2",
  "悟彻菩提真妙理，断魔归本合元神":
    "He wakes fully to Bodhi's true subtle truth; cutting off the demons, he returns to the root and joins the primal spirit",
  "一—二回（访道在前，学成逐出在后）":
    "Chapters 1-2 (seeking the way first, then mastery and expulsion)",
  "樵子指路而去，洞门半掩，门上十字犹在。":
    "The woodcutter points the way and goes; the cave door stands half open, the ten characters still on it.",
  "凌霄宝殿":
    "Hall of Miraculous Mist",
  "三十三天之上":
    "Above the thirty-three heavens",
  "第四回":
    "Chapter 4",
  "官封弼马心何足，名注齐天意未宁":
    "Appointed keeper of the horses, how could his heart be content; registered as Equal of Heaven, his mind is still unquiet",
  "三—七回（销死籍、两反天宫，至被压五行山）":
    "Chapters 3-7 (striking out the death register, two revolts in heaven, and the pinning under the Mountain of Five Elements)",
  "仙卿列班不敢仰视，南天门外云气叠如瓦。":
    "The immortal officers stand in rank and dare not look up; outside the Southern Gate the clouds lie stacked like roof tiles.",
  "兜率宫":
    "Tushita Palace",
  "离恨天·八卦炉":
    "Heaven of Parted Sorrow · the eight-trigram furnace",
  "第七回":
    "Chapter 7",
  "八卦炉中逃大圣，五行山下定心猿":
    "From the eight-trigram furnace the Great Sage escapes; under the Mountain of Five Elements the mind-monkey is stilled",
  "炉烟未散，五个葫芦空其三——金丹作炒豆吃了。":
    "The furnace smoke has not cleared; three of the five gourds are empty - the golden elixir eaten like roasted beans.",
  "南海落伽山":
    "Mount Potalaka in the Southern Sea",
  "潮音洞":
    "Cave of Tidal Sound",
  "第八回":
    "Chapter 8",
  "我佛造经传极乐，观音奉旨上长安":
    "Our Buddha makes the scriptures and spreads bliss; Guanyin, under orders, goes up to Chang'an",
  "第八回奉旨访取经人；此后屡求屡至，至第九十八回方了":
    "Chapter 8, sent to find the scripture-seeker; she comes again and again thereafter, until chapter 98",
  "潮音洞外紫竹成林，净瓶里插着那枝杨柳。":
    "Outside the Cave of Tidal Sound the purple bamboo stands in groves, and the willow sprig is set in the pure vase.",

  // ── 二十七、西游人格卷 ─────────────────────────────────────
  // 名、位、小传三样。单字的位（佛）照词表旧例作裸键。
  "孙悟空":
    "Sun Wukong",
  "灵明石猴":
    "The Stone Monkey of Bright Awareness",
  "石中迸出，学道须菩提，闹天宫五百年压，后保唐僧西行。目能辨真伪，性最不受羁。":
    "Burst out of a rock, learned the way from Subodhi, turned heaven upside down and was pinned for five hundred years, then guarded Tang Seng on the road west. His eyes can tell true from false, and his nature will not be reined in.",
  "唐三藏":
    "Tang Sanzang",
  "取经人":
    "The scripture-seeker",
  "金蝉子转世，奉旨西行求取真经。持戒极严，见人落难必救，故屡遭妖魔之诳。":
    "The Golden Cicada reborn, sent west by imperial order to fetch the true scriptures. Strict in the precepts to a fault, he will save anyone in distress - which is why demons deceive him again and again.",
  "猪八戒":
    "Zhu Bajie",
  "净坛使者":
    "Altar-Cleansing Envoy",
  "本天河水军统帅，因戏嫦娥贬下凡尘，错投猪胎。贪食好色，遇难先思退，却最知人情冷暖。":
    "Once marshal of the Heavenly River's navy, banished to the mortal world for molesting Chang'e and born into a pig's womb by mistake. Greedy and lecherous, first to think of retreat - and the best judge of human feeling among them.",
  "沙悟净":
    "Sha Wujing",
  "金身罗汉":
    "Golden-Bodied Arhat",
  "原为灵霄殿卷帘大将，失手打碎琉璃盏贬流沙河。寡言任劳，一路挑担，是三人中最安分的。":
    "Formerly the Curtain-Raising General of the Hall of Miraculous Mist, banished to the River of Flowing Sand for smashing a crystal cup. Silent and hard-working, he carries the luggage the whole way - the steadiest of the three.",
  "观世音":
    "Guanyin",
  "菩萨":
    "Bodhisattva",
  "奉如来法旨寻取经人，一路安排劫难亦一路解难。诸魔多出其手，诸难亦多由其收。":
    "Sent by the Buddha's command to find a scripture-seeker, she lays out the ordeals along the road and unties them too. Most of the demons are of her arranging, and most of the ordeals end at her hand.",
  "如来":
    "The Tathagata",
  佛: "Buddha",
  "西方极乐世界尊者。以掌压大圣于五行山，立取经之局；经在雷音，难在途中。":
    "The honoured one of the Western Paradise. With one palm he pinned the Great Sage under the Mountain of Five Elements and set the whole pilgrimage in motion: the scriptures wait at Thunderclap, the ordeals lie on the road.",
  "玉皇大帝":
    "The Jade Emperor",
  "天庭":
    "The Celestial Court",
  "三界之主，历一千七百五十劫方证此位。治天以官爵名位，故以弼马温、齐天大圣之名羁縻大圣，终不能制。":
    "Lord of the three realms, who passed through one thousand seven hundred and fifty kalpas to reach the throne. He governs heaven by office and rank, and so tried to bind the Great Sage with titles - keeper of the horses, Great Sage Equal of Heaven - and could not hold him.",
  "牛魔王":
    "The Bull Demon King",
  "妖王":
    "Demon king",
  "七大圣之首，昔与大圣结义。有妻罗刹，有妾玉面，有子红孩儿。既是旧友，又是死敌。":
    "First of the seven great sages, once sworn brother to the Great Sage. His wife is the Raksasi, his concubine Jade Face, his son Red Boy. Old friend and mortal enemy both.",
  "须菩提祖师":
    "Patriarch Subodhi",
  "灵台方寸山斜月三星洞之师。授悟空名姓、七十二变与筋斗云，又因他卖弄变化即日逐出，自此书中不再出现。":
    "Master of the cave on the Mountain of the Spirit Terrace. He gave Wukong his name, the seventy-two transformations and the cloud-somersault - then expelled him the same day for showing off, and never appears in the book again.",
  "太上老君":
    "Laozi the Supreme",
  "三十三天兜率宫主，八卦炉炼丹者。大圣之火眼金睛由其炉中炙出；青牛、金角银角、金刚琢诸难，亦皆其家物下界。":
    "Lord of the Tushita Palace in the thirty-third heaven, who refines elixir in the eight-trigram furnace. The Great Sage's fiery golden eyes were baked in that furnace; and the green ox, the Gold and Silver Horn demons and the diamond snare were all his own belongings loose in the world.",
  "太白金星":
    "The Great White Planet",
  "两度奏请招安大圣者。天庭凡欲以名位羁縻，皆遣此老；一路又屡屡化作老者报信与取经人。调停之人，两头讨好，两头不落好。":
    "Twice he petitioned for the Great Sage to be bought off with office. Whenever heaven wants to bind someone with a title it sends this old man; and on the road he keeps turning up as an old fellow with news for the pilgrims. A mediator pleasing both sides, and thanked by neither.",
  "唐太宗":
    "Emperor Taizong of Tang",
  "大唐":
    "The Tang",
  "贞观天子。因泾河龙王一案魂游地府还阳，遂建水陆大会，与玄奘结为御弟，亲饯于关外。取经之局，自他一纸关文始。":
    "The emperor of the Zhenguan reign. After the affair of the Jing River dragon his soul toured the underworld and came back; he then held the great mass of land and water, made Xuanzang his royal brother, and saw him off beyond the pass. The whole pilgrimage begins with one travel permit of his.",
  "镇元子":
    "Zhenyuanzi",
  "地仙之祖":
    "Patriarch of the earthbound immortals",
  "万寿山五庄观主，地仙之祖，与世同君。人参果树被推倒，袖里乾坤两番拿住取经四众；树活之后，反与大圣结为兄弟。":
    "Master of Wuzhuang Abbey on Longevity Mountain, patriarch of the earthbound immortals, as old as the world. When his manfruit tree was felled he caught all four pilgrims twice in the heaven-and-earth of his sleeve; once the tree revived, he became the Great Sage's sworn brother instead.",
  "铁扇公主":
    "Princess Iron Fan",
  "翠云山":
    "Jade Cloud Mountain",
  "牛魔王之妻，红孩儿之母，翠云山芭蕉洞主。有芭蕉扇可熄火焰山之火，却因子被收于观音座下，与大圣有不共之仇。":
    "Wife of the Bull Demon King, mother of Red Boy, mistress of the Palm-Leaf Cave on Jade Cloud Mountain. Her fan can put out the fires of the Mountain of Flames, but since her son was taken into Guanyin's keeping she holds an unappeasable grudge against the Great Sage.",
  "西梁女王":
    "Queen of Western Liang",
  "西梁女国之主。国中累代无男子，见唐僧而愿以一国相让，倒换关文、迎阳驿求亲皆以礼成——全书唯一不以法力相难之难。":
    "Ruler of the Women's Kingdom of Western Liang. For generations her land has had no men; on seeing Tang Seng she offered to hand over the kingdom, and the stamping of the permit and the proposal at the Yingyang post-house were all done by proper rite - the one ordeal in the book that uses no magic at all.",

  // ── 二十八、四库脉络的七型关系与每条线的依据 ─────────────
  // 关系名与其释义（脚注上的七枚线型钮）。短名「传」「承」等已在前（第七节）。
  "传注": "Commentary",
  "为之作传、作记、释其训诂":
    "Commentaries, records and glosses made upon it",
  "承学": "Transmission",
  "祖述其说，或承其体例而变之":
    "Carries on its doctrine, or takes over its form and alters it",
  "取材": "Borrowing",
  "征引其文、取其事以为材":
    "Quotes its text, or takes its matter as material",
  "非难": "Dispute",
  "难其说、与之立异":
    "Attacks its doctrine and takes a contrary stand",
  "同撰、同题，或后世并举":
    "Of one making, one subject, or paired by later ages",
  "相续": "Continuation",
  "接其断限而续修":
    "Picks up where it stops and continues the work",
  "依托": "False ascription",
  "托名前人、前书，而所托非其实":
    "Bears an earlier writer's or book's name, though the ascription is not true",

  // 每条关系线下的那一句依据：悬停线上与右栏里都用它。
  // 书名随句行文，依前例不另加《》。
  "《礼记》为《仪礼》之记，汉儒辑以释经":
    "The Book of Rites is the record attached to the Ceremonies and Rites, compiled by Han scholars to explain the classic",
  "周官、仪礼、礼记，后世并称三礼":
    "Rites of Zhou, Ceremonies and Rites, Book of Rites - the Three Ritual Classics of later tradition",
  "春秋三传，同释一经而家法各异":
    "The three commentaries on the Spring and Autumn Annals: one classic explained by three house traditions",
  "公羊、谷梁同出子夏之传，义例相近":
    "Gongyang and Guliang both descend from Zixia's teaching, and their canons of interpretation run close",
  "《尔雅》释诂释训，多本《诗》《书》之文":
    "The Erya glosses words and phrases, mostly drawn from the Poetry and the Documents",
  "同上，古文奇字赖《尔雅》以通":
    "Likewise: the odd archaic characters are made intelligible through the Erya",
  "孟子私淑孔子，道性善、言必称尧舜":
    "Mencius took Confucius as his unseen master, taught innate goodness, and spoke always of Yao and Shun",
  "《孝经》发《论语》孝悌之旨，旧题曾子门人所记":
    "The Classic of Filial Piety unfolds the Analects' theme of filial duty; tradition ascribes it to Zengzi's disciples",
  "旧题同出左丘明，一为传经、一为国别之语":
    "Both traditionally ascribed to Zuo Qiuming, one commenting on the classic, the other recording speeches state by state",
  "通鉴编年纪事，体本《春秋》《左传》":
    "The Comprehensive Mirror records events by year, its form taken from the Annals and the Zuo Commentary",
  "荀子宗孔子而非思孟，另立隆礼重法一路":
    "Xunzi honoured Confucius but rejected the Zisi-Mencius line, setting up a path of exalted ritual and strong law",
  "墨子出于儒而背之，《非儒》难其厚葬久丧":
    "Mozi came out of the Confucians and turned against them; his Against the Confucians attacks lavish burial and long mourning",
  "王充《问孔》，举《论语》前后自相牴牾者诘之":
    "Wang Chong's Questioning Confucius assembles passages of the Analects that contradict one another and presses them",
  "王充《刺孟》，难孟子论天命、论齐王之说":
    "Wang Chong's Faulting Mencius attacks his views on the mandate of heaven and on the king of Qi",
  "旧题孔安国撰、出孔壁，四库与丁晏《家语证伪》并判为王肃依托：杂采《论语》《礼记》《说苑》而成，而自附于孔门":
    "Traditionally credited to Kong Anguo as a text from the wall of Confucius' house; the Imperial Catalogue and Ding Yan's Exposure of the Kong Family Sayings both judge it a fabrication by Wang Su - pieced together from the Analects, the Book of Rites and the Garden of Persuasions, then passed off as a Confucian family record",
  "刘向采儒家旧说成《说苑》，多孔门之事":
    "Liu Xiang drew on old Confucian material for the Garden of Persuasions, much of it about Confucius' school",
  "吕览兼采儒墨名法，儒者之言居其一":
    "The Lü Annals gather Confucian, Mohist, Nominalist and Legalist alike, the Confucians being one voice among them",
  "朱子论四书以《论语》为宗，语类半为其说":
    "Zhu Xi took the Analects as the root of the Four Books; half the Classified Conversations is his teaching on them",
  "阳明致良知，本孟子良知良能之说":
    "Wang Yangming's extending of innate knowing rests on Mencius' innate knowing and innate ability",
  "董仲舒治公羊，推阴阳灾异以说《春秋》":
    "Dong Zhongshu worked in the Gongyang tradition, reading the Annals through yin-yang and portents",
  "《淮南鸿烈》言天文时则，多本易象阴阳":
    "The Huainan Masters on astronomy and the seasons draws largely on the Changes' imagery of yin and yang",
  "风骚并举：楚人之辞承《诗》之变而别为一体":
    "Airs and Sao named together: the songs of Chu carry on the Poetry's turn and become a form of their own",
  "唐人近体，远绍风雅之遗":
    "The regulated verse of the Tang descends, distantly, from the legacy of the Airs and Odes",
  "《明诗》篇溯诗之源，举四始六义为本":
    "The chapter On Poetry traces poetry to its source in the four beginnings and six principles",
  "《原道》宗经，文之为德本于《易》之文言":
    "On the Way honours the classics: the virtue of writing is rooted in the figured words of the Changes",
  "《古文观止》卷一即选《左传》诸篇":
    "The first scroll of Finest of Ancient Prose selects pieces from the Zuo Commentary",
  "李汝珍精音韵训诂，书中诸回大谈小学":
    "Li Ruzhen was expert in phonology and glossing, and whole chapters of the book talk philology",
  "范晔续班书之断限，纪东汉一代":
    "Fan Ye continued where Ban Gu stopped, chronicling the Eastern Han",
  "范晔后出，汉末诸传多采陈寿之文":
    "Fan Ye came later, and many of his late-Han biographies draw on Chen Shou's text",
  "刘向集录，承《国语》国别记言之例":
    "Liu Xiang's compilation follows the Discourses of the States in arranging speeches state by state",
  "通鉴两汉之卷，取材首在班书":
    "For the two Han periods the Comprehensive Mirror takes its material first of all from Ban Gu",
  "魏晋之卷本陈志并裴注所引诸书":
    "The Wei-Jin scrolls rest on Chen Shou's records together with the works quoted in Pei's commentary",
  "周秦之卷多本《战国策》":
    "The Zhou and Qin scrolls draw largely on the Stratagems of the Warring States",
  "刘向校《晏子》在前，《说苑》多载晏子谏事":
    "Liu Xiang collated the Yanzi first; the Garden of Persuasions then records many of Yanzi's remonstrances",
  "纵横捭阖之术，策士行之而其事见于《策》":
    "The arts of alliance and persuasion were practised by the strategists, and their doings are recorded in the Stratagems",
  "《汉书·五行志》大段载董仲舒灾异之说":
    "The Treatise on the Five Phases in the Han History sets out Dong Zhongshu's doctrine of portents at length",
  "庄子承老氏之学而恣纵其辞":
    "Zhuangzi carried on Laozi's learning and let his language run free",
  "列御寇贵虚，与老庄同条共贯":
    "Lie Yukou prized emptiness, of one thread with Laozi and Zhuangzi",
  "旧题老子弟子，书多引「老子曰」":
    "Traditionally ascribed to a disciple of Laozi; the book quotes 'Laozi said' again and again",
  "旧题刘向撰，宋人已疑，《四库提要》谓或魏晋方士假托其名；所托者正是刘向，与《说苑》同署一人":
    "Ascribed to Liu Xiang, doubted already in the Song; the Imperial Catalogue suggests a Wei-Jin adept borrowing his name - the name borrowed being Liu Xiang's, the one already borne by the Garden of Persuasions",
  "书题列御寇，而文多袭《庄子》，《汤问》《说符》诸篇几于照录；四库疑为魏晋人依托":
    "Bears Lie Yukou's name, yet its text largely copies Zhuangzi, the chapters Questions of Tang and Explaining Conjunctions almost word for word; the Imperial Catalogue suspects a Wei-Jin hand",
  "葛洪论金丹服食，远承庄列养生之旨":
    "Ge Hong on elixirs and dietary practice reaches back to the nurture-of-life teaching of Zhuangzi and Liezi",
  "董生隆礼之论，于荀卿为近":
    "Master Dong's exalting of ritual stands close to Xunzi",
  "刘向同时所编，体例相同，事多互见":
    "Compiled by Liu Xiang at the same time, in the same form, with much overlapping matter",
  "阳明知行合一，正针朱子格物之说而发":
    "Wang Yangming's unity of knowing and acting was aimed squarely at Zhu Xi's investigation of things",
  "商君富国强兵之术，承管仲轻重之法":
    "Lord Shang's arts for enriching the state and strengthening the army carry on Guan Zhong's policy of weights and balances",
  "韩非溯法家之源，首及管仲":
    "Han Fei traces the Legalists to their source, and names Guan Zhong first",
  "「法」取商君":
    "'Law' is taken from Lord Shang",
  "「术」取申不害":
    "'Technique' is taken from Shen Buhai",
  "「势」取慎到":
    "'Position' is taken from Shen Dao",
  "韩非师荀卿，性恶之说转为刑名":
    "Han Fei studied under Xunzi, and the doctrine of innate badness became in his hands punishment and title",
  "《解老》《喻老》两篇，以道论法":
    "The two chapters Explaining Laozi and Illustrating Laozi argue law out of the Way",
  "桑弘羊本商君功利之术，贤良文学以儒义难之":
    "Sang Hongyang stood on Lord Shang's utilitarian arts, and the scholars attacked him on Confucian grounds",
  "公孙龙辩「白马非马」，承邓析两可之说":
    "Gongsun Long's argument that a white horse is not a horse carries on Deng Xi's both-ways position",
  "尹文言形名，亦出于名辩一路":
    "Yin Wen on form and name also comes out of the Nominalist line",
  "名家并称，同游稷下":
    "Named together as Nominalists, and fellows at the Jixia academy",
  "吕览《当染》《节丧》诸篇，显出墨家":
    "Chapters of the Lü Annals such as On Dyeing and Frugal Burial are plainly Mohist",
  "《贵生》《情欲》本道家养生之说":
    "Valuing Life and On Desire rest on the Daoist teaching of nurturing life",
  "刘安集宾客著书，体例仿吕览而更宏":
    "Liu An gathered retainers to write the book, in the Lü Annals' form but on a grander scale",
  "《原道》《俶真》诸训，文多袭庄子":
    "The treatises On the Way and On the Primal are largely taken over from Zhuangzi",
  "《论衡》疾虚妄，正破天人感应之说":
    "The Balanced Discourses hates empty talk, and strikes directly at the doctrine of heaven responding to man",
  "魏晋清谈本老庄，书中品藻多玄言":
    "Wei-Jin salon talk rested on Laozi and Zhuangzi, and the book's appraisals are mostly in that metaphysical vein",
  "孙武兵学承古司马兵法之遗，而弃其军礼":
    "Sun Wu's military learning carries on the old Sima art of war while discarding its battlefield ritual",
  "孙膑世传孙武之学":
    "Sun Bin transmitted the learning of Sun Wu in his family line",
  "孙吴并称，后世论兵必举二子":
    "Sun and Wu named together: no later discussion of war omits the two",
  "三十六计之目，语多本孙子虚实诡道":
    "The headings of the Thirty-Six Stratagems are largely phrased out of Sunzi on the solid, the empty and the deceptive",
  "尉缭权谋，于太公兵法为近":
    "Wei Liao on expedient schemes stands close to the Grand Duke's art of war",
  "六韬三略并称「韬略」，皆托之太公黄石":
    "Six Secret Teachings and Three Strategies named together as the strategists' books, both ascribed to the Grand Duke and the Yellow Stone elder",
  "释氏入华之始经，下启禅门顿悟之说":
    "The first Buddhist scripture to enter China, and the source of Chan's doctrine of sudden awakening",
  "五灯叙禅宗灯录，源头正在六祖":
    "The Five Lamps records the Chan transmission, and its headwater is the Sixth Patriarch",
  "了凡立命之说，本佛家因果而杂以儒行":
    "Liaofan's doctrine of establishing one's own destiny rests on Buddhist cause and effect, mixed with Confucian conduct",
  "农工之书相承，由耕织而遍及百工":
    "Books of farming and craft follow one another, from ploughing and weaving out to the hundred trades",
  "七实三虚：人物始末一依陈志":
    "Seven parts fact to three parts invention: the course of each life follows Chen Shou's records",
  "叙次先后多本通鉴，兼采《通鉴纲目》之褒贬":
    "The order of events mostly follows the Comprehensive Mirror, with the praise and blame of its Outline as well",
  "卷四选《战国策》诸篇":
    "The fourth scroll selects pieces from the Stratagems of the Warring States",
  "卷三选《国语》诸篇":
    "The third scroll selects pieces from the Discourses of the States",
  "心猿意马之语出禅门，取经即修心之喻":
    "The talk of the mind-monkey and the will-horse comes from Chan; the pilgrimage is a figure for cultivating the mind",
  "金丹炉火、服食延年，皆丹家旧说":
    "Elixir and furnace, dietary practice and lengthened years - all old alchemists' doctrine",
  "第二十一回宝玉续《南华·胠箧》":
    "In chapter 21 Baoyu writes a sequel to the Zhuangzi chapter Rifling Trunks",
  "第二十二回听曲文悟禅机，偈语本坛经":
    "In chapter 22 he hears an aria and wakes to the Chan in it; the verse rests on the Platform Sutra",
  "笔记一体，志人而后志怪":
    "One form of jotting-book, first on people and then on the strange",
  "品题人物之笔，下启儒林诸儒之写照":
    "The hand that appraises people opens the way to the portraits of the scholars",
  "封神诸神诸兽，形貌多出《山海经》":
    "The gods and beasts of the Investiture take their shapes largely from the Classic of Mountains and Seas",
  "西行所历山海异物，亦取其名状":
    "The strange creatures of mountain and sea met on the road west are named after them too",
  "海外三十余国，多本《海外经》诸篇":
    "The thirty-odd lands overseas rest largely on the Overseas chapters",
  "志怪之祖，聊斋承其绪而归于人情":
    "Father of the strange-tale genre; the Liaozhai takes up its line and turns it to human feeling",
  "明代神魔小说之两大部":
    "The two great gods-and-demons novels of the Ming",
  "章回之祖，施罗并称":
    "Father of the chaptered novel; Shi and Luo are named together",
  "《辨骚》篇专论屈宋，谓其「取镕经意，自铸伟辞」":
    "The chapter Judging the Sao treats Qu Yuan and Song Yu alone, saying they melted down the sense of the classics and cast a great diction of their own",
  "骚人之绪，下被唐人歌行":
    "The line of the Sao poets, reaching down to the Tang song-form",
  "南朝论文二书，一论文体、一品五言":
    "Two Southern Dynasties books on writing, one on genre, one appraising five-word verse",
  "论文之统，至静安而立「境界」之目":
    "The line of criticism, down to Wang Guowei, who set up 'realized world' as its term",
  "品第之法相承，由诗及词":
    "The method of ranking carries over from poetry to song-lyric",

  // 存目之书那五十余条依据（注疏、续作、集释之属）
  "孔颖达疏，用王弼注而为之正义，唐人定为明经之本":
    "Kong Yingda's subcommentary, built on Wang Bi's notes; the Tang court set it as the standard text for the classic",
  "孔颖达疏，本伪孔安国传而疏之":
    "Kong Yingda's subcommentary, built on the spurious Kong Anguo commentary",
  "贾公彦疏郑玄注，释周官之制":
    "Jia Gongyan's subcommentary on Zheng Xuan's notes, explaining the Zhou offices",
  "贾公彦疏郑玄注，仪节赖之以明":
    "Jia Gongyan's subcommentary on Zheng Xuan's notes; the ritual procedures are intelligible through it",
  "孔颖达疏郑玄注，三礼之疏惟此最详":
    "Kong Yingda's subcommentary on Zheng Xuan's notes, the fullest of the three ritual subcommentaries",
  "孔颖达疏杜预集解，左氏之学自此定":
    "Kong Yingda's subcommentary on Du Yu's collected notes; Zuo studies were settled by it",
  "徐彦疏何休解诂，公羊家法所传":
    "Xu Yan's subcommentary on He Xiu's glosses, transmitting the Gongyang house tradition",
  "杨士勋疏范宁集解":
    "Yang Shixun's subcommentary on Fan Ning's collected notes",
  "邢昺疏何晏集解，宋人定为正疏":
    "Xing Bing's subcommentary on He Yan's collected notes; the Song set it as the standard",
  "邢昺疏唐玄宗御注":
    "Xing Bing's subcommentary on Emperor Xuanzong's imperial notes",
  "邢昺疏郭璞注，训诂之津梁":
    "Xing Bing's subcommentary on Guo Pu's notes, the ford into philological glossing",
  "旧题孙奭疏赵岐注，宋升孟子入经，疏乃并列十三":
    "Ascribed to Sun Shi, a subcommentary on Zhao Qi's notes; when the Song raised Mencius into the canon, this joined the thirteen",
  "朱熹集注，章句之外兼采二程诸儒之说":
    "Zhu Xi's collected notes, drawing beyond the phrasing on the Cheng brothers and other Song masters",
  "朱熹集注，与论语集注并为四书之二":
    "Zhu Xi's collected notes; with the Analects commentary, two of the Four Books",
  "王弼注，扫象数而说以义理，易学自此一变":
    "Wang Bi's notes sweep away images and numbers and read the Changes for its meaning; the field turned here",
  "王弼自撰以明其注例，发「得意忘象」之旨":
    "Wang Bi wrote it himself to set out the canons of his notes, teaching that one grasps the meaning and forgets the image",
  "李鼎祚集汉魏以来三十余家之注，存象数一路":
    "Li Dingzuo collected notes from over thirty Han and Wei hands, preserving the images-and-numbers line",
  "宋王应麟辑郑玄易注之佚文，汉易赖此以存":
    "Wang Yinglin of the Song gathered the lost fragments of Zheng Xuan's notes; Han Changes studies survive through it",
  "苏氏父子之易，以人事说卦爻":
    "The Su family's Changes, reading the trigrams and lines through human affairs",
  "惠栋重辑郑注，补订王应麟之本":
    "Hui Dong re-gathered Zheng Xuan's notes, supplementing and correcting Wang Yinglin's recension",
  "魏伯阳借易之卦爻纳甲言炉火丹法，四库入之道家：所托者易之名，非易之学":
    "Wei Boyang borrows the trigrams and the najia scheme to speak of furnace and elixir; the Four Treasuries placed it with the Daoists - what it borrows is the name of the Changes, not its learning",
  "旧题伏生所传，杂记书说，汉初今文之绪":
    "Ascribed to Fu Sheng's transmission, miscellaneous records of Documents lore, a thread of early Han New Text learning",
  "戴德、戴圣各传礼记，一大一小，后世并举":
    "Dai De and Dai Sheng each transmitted a Book of Rites, the greater and the lesser, named together ever after",
  "韩婴引诗以证事，每章引诗一二句而说之，非释经":
    "Han Ying cites the Poetry to bear out his stories, a line or two per section - illustration, not exegesis",
  "戴震逐条疏孟子字义，以难宋儒理在气先之说":
    "Dai Zhen glosses the sense of Mencius' words item by item, to challenge the Song doctrine that principle precedes vital force",
  "朱子四书之合刻，大学中庸章句与论孟集注并为一编":
    "Zhu Xi's Four Books printed together: the Great Learning and Doctrine of the Mean in phrasing, the Analects and Mencius in collected notes",
  "四书之一，朱子分经一章传十章":
    "One of the Four Books; Zhu Xi divided it into one chapter of classic and ten of commentary",
  "四书之一，朱子序其为孔门传授心法":
    "One of the Four Books; Zhu Xi's preface calls it the method of mind handed down in Confucius' school",
  "东原所难，正是四书集注一系之义理":
    "What Dai Zhen challenges is precisely the doctrine of the Four Books commentary line",
  "李焘接通鉴所止之治平，编年记北宋九朝":
    "Li Tao picks up at Zhiping where the Mirror stops, chronicling the nine reigns of the Northern Song",
  "毕沅续记宋元两代，上接通鉴之末":
    "Bi Yuan continues through the Song and Yuan, joining the end of the Mirror",
  "黄以周辑补李焘原书之阙卷":
    "Huang Yizhou gathered and supplied the chapters missing from Li Tao's original",
  "今人逐句译注，不离原文而行":
    "A modern line-by-line translation with notes, running alongside the original",
  "唐章怀太子李贤集诸儒注范书，后世通行之注本":
    "Li Xian, Tang crown prince Zhanghuai, collected scholars' notes on Fan Ye's history; the standard annotated text since",
  "吴则虞集历代之释，校其异文":
    "Wu Zeyu collected glosses from every period and collated the variant readings",
  "郭庆藩集郭象注、成玄英疏及诸家训诂于一编":
    "Guo Qingfan gathered Guo Xiang's notes, Cheng Xuanying's subcommentary and other glossing into one book",
  "王先谦集解，简明而便读":
    "Wang Xianqian's collected notes, spare and easy to read",
  "清人治庄之两部，一详一简，后世并举":
    "The two Qing works on Zhuangzi, one full and one spare, named together ever after",
  "内七篇别行之本，内外杂之分自刘向、郭象已然":
    "The inner seven chapters circulating separately; the inner/outer/miscellaneous division goes back to Liu Xiang and Guo Xiang",
  "杨伯峻集释，并辑历代辨其依托之说":
    "Yang Bojun's collected glosses, with the arguments of every period on its false ascription",
  "孙诒让诂墨，墨学自此可读":
    "Sun Yirang glossed Mozi; the text became readable from then on",
  "岑仲勉专注备城门以下诸篇，墨家守御之术":
    "Cen Zhongmian annotates the chapters from Fortifying the Gates onward, the Mohist art of defence",
  "今人语译，逐篇附原文":
    "A modern rendering into plain language, each chapter set beside the original",
  "马非百诠轻重诸篇，管子之经济之论":
    "Ma Feibai expounds the Light and Heavy chapters, the economic argument of the Guanzi",
  "七术之篇托鬼谷之名而言养神蓄锐，与捭阖诸篇文体判然，四库疑为后人附益":
    "The seven arts borrow Guiguzi's name to speak of nourishing spirit and storing vigour; the style parts company with the Opening and Closing chapters, and the Four Treasuries judged it a later addition",
  "今人注释，附原文而行":
    "A modern annotation, running with the original",
  "逐章对译，不离原文":
    "Translated chapter against chapter, never leaving the original",
  "八角廊汉简本与今本并存，章次文字可互校":
    "The Bajiaolang Han bamboo-slip text stands beside the received one; section order and wording can be collated against each other",
  "洪兴祖补王逸章句之所未备，楚辞之通行注本":
    "Hong Xingzu supplied what Wang Yi's phrasing left out; the standard annotated Chu Ci",
  "今人疏证王逸章句，考其训释之所本":
    "A modern examination of Wang Yi's phrasing, tracing what his glosses rest on",
  "补注与疏证，皆为王逸章句而作":
    "The supplement and the examination were both written for Wang Yi's phrasing",
  "今人译注，逐篇附原文":
    "A modern translation with notes, each chapter set beside the original",
  "校雕龙之异文，不立新说":
    "Collates the variant readings of the Wenxin diaolong and advances no new doctrine",
  "旧题司空图，承品诗之例而别为二十四品之目":
    "Ascribed to Sikong Tu; it carries on the practice of ranking poetry but sets out twenty-four modes of its own",
  "袁枚自序续司空图之未尽，三十二首以补其目":
    "Yuan Mei's own preface continues what Sikong Tu left unfinished, thirty-two pieces filling out the list",
  "朱鼎臣本与世德堂本同出西游一系，详略不同而非相承":
    "The Zhu Dingchen text and the Shidetang text both come of the Journey to the West line, differing in fullness without descending one from the other",

  "班固自言继太史公之书，断自高祖迄王莽，纪西汉一代":
    "Ban Gu says he continues the Grand Historian's book, running from Gaozu to Wang Mang - the Western Han in one history",
  "唐修晋书接三国之末而纪两晋，后出而续其断限":
    "The Tang Book of Jin takes up at the close of the Three Kingdoms and records both Jin courts, later in compilation and continuing its span",
  "萧子显纪南齐一代，接沈约宋书所止之年":
    "Xiao Zixian records the Southern Qi, beginning at the year where Shen Yue's Book of Song stops",
  "姚思廉纪萧梁一代，接南齐之末": "Yao Silian records the Liang, taking up at the close of the Southern Qi",
  "李百药纪北齐一代，接魏收书所止之年":
    "Li Baiyao records the Northern Qi, beginning where Wei Shou's history stops",
  "五代刘昫等纪唐一代，接隋之末":
    "Liu Xu and others, under the Five Dynasties, record the Tang, taking up at the close of the Sui",
  "薛居正等纪梁唐晋汉周五代，接唐之末":
    "Xue Juzheng and others record the five courts of Liang, Tang, Jin, Han and Zhou, taking up at the close of the Tang",
  "元修宋史，接五代之末而纪两宋":
    "The Yuan court's History of Song takes up at the close of the Five Dynasties and records both Song courts",
  "明初修元史，接宋之末":
    "Compiled early in the Ming, the History of Yuan takes up at the close of the Song",
  "清修明史，接元之末": "The Qing court's History of Ming takes up at the close of the Yuan",
  "民国初修清史稿，接明之末，二十四史之后一部":
    "Drafted early in the Republic, the History of Qing takes up at the close of the Ming - the one history standing after the Twenty-Four",
  "姚思廉一手所撰，梁陈二书同出贞观之诏":
    "Written by Yao Silian's own hand, both; the Liang and the Chen histories issue from the same Zhenguan decree",
  "贞观同修五代史，南北并出而隋书总其末":
    "Five histories decreed together in Zhenguan, south and north alike, with the Book of Sui closing the series",
  "北齐、北周分据东西，两书同修于贞观":
    "Northern Qi and Northern Zhou held east and west; the two histories were compiled together in Zhenguan",
  "同上，隋承周祚而二书同出一诏":
    "Likewise: the Sui succeeded the Zhou, and the two histories issue from one decree",
  "欧阳修、宋祁重修唐史，新旧两唐书并行":
    "Ouyang Xiu and Song Qi recompiled the Tang history; the New and the Old Tang histories run side by side",
  "欧阳修别修五代史，新旧两史并行":
    "Ouyang Xiu compiled a separate Five Dynasties history; new and old run side by side",
  "柯绍忞病元史之疏，别为新元史，两书并举":
    "Ke Shaomin found the History of Yuan slipshod and made a new one; the two are cited together",
  "元至正同诏修宋辽金三史，分纪并立之三朝":
    "One Zhizheng decree ordered the Song, Liao and Jin histories, each recording one of three courts that stood at the same time",
  "同上，辽金二史同修于元":
    "Likewise: the Liao and the Jin histories were compiled together under the Yuan",
  "李延寿并宋齐梁陈四书为南史，删繁就简而文多取诸旧书":
    "Li Yanshou merged the Song, Qi, Liang and Chen histories into the Southern History, cutting them down but keeping much of their wording",
  "同上，南史梁代诸传多本姚思廉之文":
    "Likewise: the Liang lives in the Southern History mostly follow Yao Silian's text",
  "北史魏代诸传本魏收书而有所刊落": "The Wei lives in the Northern History follow Wei Shou's book, with cuts",
  "北史末卷纪隋，取材于贞观所修之隋书":
    "The Northern History's closing chapters record the Sui, drawing on the Zhenguan Book of Sui",
  "南北二史同出李延寿，分纪南北而相配成书":
    "Both histories come from Li Yanshou, one for the south and one for the north, made to pair",
  "颜师古集前人二十余家之注，汉书赖此以通":
    "Yan Shigu gathered more than twenty earlier commentators; the Book of Han is read through him",
  "辑范书以前八家旧本之佚文，可校范书之所本":
    "Gathers the surviving fragments of eight histories older than Fan Ye's, against which his sources can be checked",
  "辑唐修晋书以前九家旧本，考其所据":
    "Gathers nine Jin histories older than the Tang one, to examine what it drew on",
  "辑诸家编年之晋史，与纪传之晋书相参":
    "Gathers the annalistic Jin histories, to be read against the Book of Jin's annals-and-lives form",
  "郭颁旧记，唐修晋书采其事": "Guo Ban's old record; the Tang Book of Jin took its stories",
  "东观旧记为东汉国史，范书多本之":
    "The Dongguan records were the Eastern Han's own state history, which Fan Ye largely follows",
  "袁晔纪献帝一朝，汉末诸传采其说": "Yuan Ye recorded Emperor Xian's reign; the late-Han lives draw on him",
  "司马彪记汉末州郡之乱，陈志裴注引之":
    "Sima Biao recorded the provincial wars at the end of the Han; Pei Songzhi's commentary quotes him",
  "荀悦奉诏以班书改编为纪年，纪传之史自此有编年之体":
    "Xun Yue was ordered to recast Ban Gu's history as year-by-year annals; from here the annalistic form stands beside annals-and-lives",
  "袁宏仿荀悦之例，为东汉作编年": "Yuan Hong followed Xun Yue's example and made annals for the Eastern Han",
  "两汉纪前后相配，编年之体由此立":
    "The two Han annals pair front and back; the annalistic form is established by them",
  "通鉴之编年，体自两汉纪一脉相承":
    "The Comprehensive Mirror's year-by-year form descends in one line from the two Han annals",
  "王国维疏证今本，逐条考其所袭":
    "Wang Guowei annotated the current text, tracing clause by clause what it had borrowed",
  "辑古书所引之竹书旧文，以别于今本":
    "Gathers the old Bamboo Annals text as quoted in earlier books, to stand apart from the current recension",
  "今本古本两途，一疏证一辑佚，治纪年者并观":
    "Current text and ancient text, one annotated and one reassembled from fragments; whoever works on the Annals reads both",
  "崔鸿原书久佚，明人别本与辑本并行":
    "Cui Hong's book was long lost; a Ming recension and a reassembled text run side by side",
  "同上，别传亦出后人缀辑": "Likewise: the separate lives are also a later reassembly",
  "崔鸿专纪五胡十六国，补晋书载记之略":
    "Cui Hong recorded the Sixteen Kingdoms alone, filling out what the Book of Jin leaves thin",
  "王夫之逐条论通鉴所纪，多与温公异议":
    "Wang Fuzhi argues through the Mirror entry by entry, often against Sima Guang",
  "船山论宋一代之得失，立说与史家之褒贬不同":
    "Chuanshan weighs the gains and losses of the Song, judging differently from the historians",
  "船山史论两部，一论通鉴一论宋事":
    "Chuanshan's two books of historical judgement, one on the Mirror and one on Song affairs",
  "章学诚承刘知几论史之统，而推及文与校雠":
    "Zhang Xuecheng carries on Liu Zhiji's line of historical criticism, extending it to letters and to bibliography",
  "赵翼考史之法，远承史通辨体之例":
    "Zhao Yi's method of examining histories follows, at a distance, the Shitong's discrimination of forms",
  "刘知几议史法，于史汉之体例多所纠弹":
    "Liu Zhiji argues historical method, faulting much in the forms of the Shiji and the Book of Han",
  "马端临承杜佑分门叙制之例，而详于宋事":
    "Ma Duanlin follows Du You's arrangement of institutions by heading, and is fuller on Song affairs",
  "唐之官制与刑律，典章之两面": "Tang offices and Tang statutes: two faces of one body of institutions",
  "杜佑叙唐制，职官一门多本六典":
    "Du You's account of Tang institutions draws its chapter on offices largely from the Six Statutes",
  "会要与通典同纪典章，一以事类一以门类": "Both record institutions, one arranged by matter and one by heading",
  "周密纪临安之盛，体仿孟元老记汴京":
    "Zhou Mi records the splendour of Lin'an on the model of Meng Yuanlao's Kaifeng",
  "吴自牧记南宋都城，亦承梦华录之例":
    "Wu Zimu records the Southern Song capital, likewise following the Dreams of Splendour",
  "同上，皆都城风物之记": "Likewise: both are records of a capital's sights and customs",
  "玄奘西行之记，承法显求法之绪而详于地志":
    "Xuanzang's record of travelling west carries on Faxian's pilgrimage, and is far fuller on geography",
  "顾祖禹考历代疆域沿革，水道多本郦注":
    "Gu Zuyu traced the changing borders of every age, taking his waterways largely from Li Daoyuan",
  "张之洞为学者指书，分类之法本四库":
    "Zhang Zhidong points students to their books, classing them on the Four Treasuries' scheme",
  "晁公武承宋廷书目之例而各为之解题":
    "Chao Gongwu follows the Song court catalogues and gives every title a descriptive note",
  "四库提要之解题，远承郡斋读书志一路":
    "The Four Treasuries' descriptive notes descend from the Junzhai reading notes",
  "嘉庆诏修全唐文既成，严可均谓唐以前文无总集，乃辑上古迄隋之文以补其前":
    "With the Jiaqing Complete Tang Prose finished, Yan Kejun held that nothing before the Tang had been gathered, and collected all prose from antiquity to the Sui to stand before it",
  "严氏分代之编，上古三代之后次以秦":
    "Yan's division by age: after high antiquity and the Three Dynasties comes the Qin",
  "同出严氏一书，秦后次汉": "From the same work of Yan's: after the Qin comes the Han",
  "同上，西汉之后次东汉": "Likewise: after the Western Han comes the Eastern",
  "同上，后汉之后次三国": "Likewise: after the Later Han come the Three Kingdoms",
  "同上，三国之后次两晋": "Likewise: after the Three Kingdoms come the two Jin courts",
  "同上，晋后次刘宋，南朝之始": "Likewise: after the Jin comes the Liu Song, first of the southern courts",
  "同上，宋后次南齐": "Likewise: after the Song comes the Southern Qi",
  "同上，齐后次萧梁": "Likewise: after the Qi comes the Liang",
  "同上，梁后次南陈，南朝之末": "Likewise: after the Liang comes the Chen, last of the southern courts",
  "同上，南朝既讫，次以北朝之元魏": "Likewise: the south complete, the northern courts begin with the Yuan Wei",
  "同上，后魏之后次北齐": "Likewise: after the Later Wei comes the Northern Qi",
  "同上，北齐之外次北周": "Likewise: beside the Northern Qi stands the Northern Zhou",
  "同上，北周之后次隋，严氏之编至此而讫":
    "Likewise: after the Northern Zhou comes the Sui, where Yan's collection ends",
  "严氏编末别为先唐文一卷，收不能定代之篇":
    "Yan closes with a chapter of pre-Tang prose, for pieces whose age cannot be fixed",
  "陆心源承全唐文之例而拾其所漏，补文七十二卷":
    "Lu Xinyuan follows the Complete Tang Prose and picks up what it missed - seventy-two chapters of additions",
  "同出陆心源补全唐文之役，先成拾遗而后有续拾":
    "Both from Lu Xinyuan's work of supplementing: the gleanings first, the further gleanings after",
  "蘅塘退士就全唐诗中择易诵易解者三百余首为家塾课本":
    "Hengtang Tuishi chose some three hundred of the easiest to recite and understand out of the Complete Tang Poems, for use in a family school",
  "郭茂倩分类解题，多本吴兢要解之说":
    "Guo Maoqian classes the yuefu and explains each title, largely on Wu Jing's account",
  "逯钦立辑唐前之诗，乐府一门取诸郭氏之集":
    "Lu Qinli gathered the poetry before the Tang, taking its yuefu from Guo Maoqian's collection",
  "同书两录，一题昭明、一题文选":
    "One book entered twice, once under Zhaoming's name and once as the Wen xuan",
  "许梿选六朝骈俪之文，所取多见于文选":
    "Xu Lian chose the parallel prose of the Six Dynasties, much of it already in the Wen xuan",
  "沈德潜溯诗之源，汉魏六朝之作多采文选所录":
    "Shen Deqian traced poetry to its sources, taking most Han, Wei and Six Dynasties pieces from the Wen xuan",
  "选文之书前后两部：昭明选六朝以前，观止选周秦以下，皆塾中通行之本":
    "Two anthologies, front and back: Zhaoming chose from the Six Dynasties and before, the Guwen Guanzhi from the Zhou and Qin down - both standard in the schoolroom",
  "宋诗之选本，一旧一新，皆取其便于诵习":
    "Two selections of Song poetry, an old and a new, both made for easy reciting",
  "词之断代选本，一辑唐五代、一选两宋":
    "Two period selections of ci, one gathering the Tang and Five Dynasties, one choosing from both Song courts",
  "苏轼词之别集，全宋词苏轼一家所据":
    "Su Shi's own collection of ci, the source for his section of the Complete Song Ci",
  "辛弃疾词之别集，所存六百余首尽入全宋词":
    "Xin Qiji's own collection, whose six hundred-odd pieces all pass into the Complete Song Ci",
  "李清照词之别集，全宋词易安一家所据":
    "Li Qingzhao's own collection of ci, the source for her section of the Complete Song Ci",
  "秦观词之别集，全宋词少游一家所据":
    "Qin Guan's own collection of ci, the source for his section of the Complete Song Ci",
  "周邦彦词之别集，全宋词清真一家所据":
    "Zhou Bangyan's own collection of ci, the source for his section of the Complete Song Ci",
  "欧阳修词之别集，全宋词六一一家所据":
    "Ouyang Xiu's own collection of ci, the source for his section of the Complete Song Ci",
  "晏殊词之别集，全宋词同叔一家所据":
    "Yan Shu's own collection of ci, the source for his section of the Complete Song Ci",
  "晏几道词之别集，全宋词小山一家所据":
    "Yan Jidao's own collection of ci, the source for his section of the Complete Song Ci",
  "黄庭坚词之别集，全宋词山谷一家所据":
    "Huang Tingjian's own collection of ci, the source for his section of the Complete Song Ci",
  "柳永词之宋刻别集，全宋词屯田一家所据":
    "Liu Yong's own collection of ci in a Song printing, the source for his section of the Complete Song Ci",
  "姜夔自度曲之别集，旁谱俱存，全宋词白石一家所据":
    "Jiang Kui's own collection of self-set tunes, its side notation intact, the source for his section of the Complete Song Ci",
  "叶梦得词之别集，全宋词石林一家所据":
    "Ye Mengde's own collection of ci, the source for his section of the Complete Song Ci",
  "张元干词之别集，全宋词芦川一家所据":
    "Zhang Yuangan's own collection of ci, the source for his section of the Complete Song Ci",
  "史达祖词之别集，全宋词梅溪一家所据":
    "Shi Dazu's own collection of ci, the source for his section of the Complete Song Ci",
  "高观国词之别集，全宋词竹屋一家所据":
    "Gao Guanguo's own collection of ci, the source for his section of the Complete Song Ci",
  "刘过词之别集，全宋词龙洲一家所据":
    "Liu Guo's own collection of ci, the source for his section of the Complete Song Ci",
  "卢祖皋词之别集，全宋词蒲江一家所据":
    "Lu Zugao's own collection of ci, the source for his section of the Complete Song Ci",
  "陈与义词之别集，全宋词简斋一家所据":
    "Chen Yuyi's own collection of ci, the source for his section of the Complete Song Ci",
  "向子諲词之别集，分江北江南二集，全宋词所据":
    "Xiang Ziyin's own collection of ci, in a north-of-the-river and a south-of-the-river part, the source for his section of the Complete Song Ci",
  "李之仪词之别集，全宋词姑溪一家所据":
    "Li Zhiyi's own collection of ci, the source for his section of the Complete Song Ci",
  "毛滂词之别集，全宋词东堂一家所据":
    "Mao Pang's own collection of ci, the source for his section of the Complete Song Ci",
  "谢逸词之别集，全宋词溪堂一家所据":
    "Xie Yi's own collection of ci, the source for his section of the Complete Song Ci",
  "朱淑真词之别集，全宋词断肠一家所据":
    "Zhu Shuzhen's own collection of ci, the source for her section of the Complete Song Ci",
  "扬无咎词之别集，全宋词逃禅一家所据":
    "Yang Wujiu's own collection of ci, the source for his section of the Complete Song Ci",
  "方千里和周邦彦之词，全宋词千里一家所据":
    "Fang Qianli's ci written to answer Zhou Bangyan's, the source for his section of the Complete Song Ci",
  "范成大词之别集，全宋词石湖一家所据":
    "Fan Chengda's own collection of ci, the source for his section of the Complete Song Ci",
  "曹组词之别集，全宋词元宠一家所据":
    "Cao Zu's own collection of ci, the source for his section of the Complete Song Ci",
  "黄公度词之别集，全宋词知稼翁一家所据":
    "Huang Gongdu's own collection of ci, the source for his section of the Complete Song Ci",
  "洪咨夔词之别集，全宋词平斋一家所据":
    "Hong Zikui's own collection of ci, the source for his section of the Complete Song Ci",
  "葛立方词之别集，全宋词归愚一家所据":
    "Ge Lifang's own collection of ci, the source for his section of the Complete Song Ci",
  "葛胜仲词之别集，与其子归愚词并入全宋词":
    "Ge Shengzhong's own collection of ci, entering the Complete Song Ci together with his son's",
  "赵彦端词之别集，全宋词筠溪一家所据":
    "Zhao Yanduan's own collection of ci, the source for his section of the Complete Song Ci",
  "蔡伸词之别集，全宋词友古一家所据":
    "Cai Shen's own collection of ci, the source for his section of the Complete Song Ci",
  "吕滨老词之别集，全宋词圣求一家所据":
    "Lü Binlao's own collection of ci, the source for his section of the Complete Song Ci",
  "曾觌词之别集，全宋词海野一家所据":
    "Zeng Di's own collection of ci, the source for his section of the Complete Song Ci",
  "张先词之别集，全宋词子野一家所据":
    "Zhang Xian's own collection of ci, the source for his section of the Complete Song Ci",
  "王千秋词之别集，全宋词审斋一家所据":
    "Wang Qianqiu's own collection of ci, the source for his section of the Complete Song Ci",
  "毛幵词之别集，全宋词樵隐一家所据":
    "Mao Jian's own collection of ci, the source for his section of the Complete Song Ci",
  "韩玉词之别集，全宋词东浦一家所据":
    "Han Yu's own collection of ci, the source for the Dongpu section of the Complete Song Ci",
  "宋人词之别集，全宋词坦庵一家所据":
    "A Song writer's own collection of ci, the source for the Tan'an section of the Complete Song Ci",
  "方千里依片玉词之次第和之，调与韵一一相从":
    "Fang Qianli answered the Pianyu ci in its own order, matching tune and rhyme one for one",
  "同为柳永之词，一宋刻别集、一今人汇编":
    "Both are Liu Yong's ci, one a Song printing and one a modern compilation",
  "同出姜夔，一存全帙旁谱、一为今人选本":
    "Both from Jiang Kui, one the complete text with its side notation, one a modern selection",
  "龙榆生选唐宋名家之词，宋人一半取诸全宋词":
    "Long Yusheng chose the masters of Tang and Song ci, taking half the Song pieces from the Complete Song Ci",
  "李煜词为唐五代词之巨帙，全唐五代词所据":
    "Li Yu's ci are the great body of Tang and Five Dynasties ci, on which the complete collection rests",
  "司马光自序言续欧公之作，补其所未记":
    "Sima Guang's own preface says he continues Ouyang Xiu, recording what Ouyang left out",
  "陈师道用六一随笔之体，而多论句法":
    "Chen Shidao writes in Ouyang Xiu's casual manner, but mostly on the making of lines",
  "刘攽继诗话之体，记一时之诗事":
    "Liu Ban carries on the shihua form, recording the poetic affairs of his own day",
  "许顗述所闻诗事而附己评，体本六一":
    "Xu Yi sets down the poetic talk he heard and adds his own judgement, on Ouyang Xiu's model",
  "叶梦得论诗详于声律，而体仍诗话": "Ye Mengde is detailed on sound and metre, yet the form is still shihua",
  "杨万里以作者之身为诗话，所举多切于作法":
    "Yang Wanli writes shihua as a working poet; his examples bear on how verse is actually made",
  "吕本中记吕氏一门及江西诸人之诗": "Lü Benzhong records the poetry of his own house and of the Jiangxi poets",
  "陈岩肖承诗话之例，兼录南渡以来之作":
    "Chen Yanxiao follows the shihua example, and also records work written since the crossing south",
  "吴聿记诗事诗句，体与六一同": "Wu Yu records poetic affairs and poetic lines, in Ouyang Xiu's form",
  "吴可专论作诗之法，而仍为诗话之体": "Wu Ke writes on method alone, still in the shihua form",
  "吴幵考诗语之所出，以诗话之体为考据":
    "Wu Jian traces where poetic phrases come from, turning shihua into textual scholarship",
  "周必大晚年所记，亦承六一之例": "Zhou Bida's notes of his later years, likewise on Ouyang Xiu's example",
  "旧题苏轼，实后人掇其论诗之语编次成书，非东坡自著":
    "Ascribed to Su Shi, but in fact later hands gathered his remarks on poetry into a book; Dongpo did not write it",
  "胡仔前集既行，复辑后集以补其未备":
    "Hu Zi's first collection out, he gathered a second to supply what it lacked",
  "魏庆之分门编次诸家诗说，所引以渔隐丛话为多":
    "Wei Qingzhi arranges the poetics of many hands by heading, quoting the Yuyin conghua more than any other",
  "玉屑诗辨诸门，大段录严羽之说": "The Yuxie's chapters on judging poetry copy Yan Yu at length",
  "严羽分体分品、论诗以妙悟，远承钟嵘品第之法":
    "Yan Yu sorts by form and by rank and makes sudden apprehension the test, following Zhong Rong's grading at a distance",
  "李东阳论诗主格调，取法盛唐之说自严羽来":
    "Li Dongyang holds to form and tone; taking the High Tang for a model comes from Yan Yu",
  "谢榛论诗必盛唐，明承沧浪之论": "Xie Zhen will have no model but the High Tang, openly following Canglang",
  "王世贞辨体立格，所本亦在严羽一路":
    "Wang Shizhen discriminates forms and sets standards, also on Yan Yu's line",
  "王国维谓兴趣、神韵犹不如境界，其说自严羽一路而别立之":
    "Wang Guowei held interest and resonance to fall short of the realized world, a view set up out of Yan Yu's line",
  "李嗣真承庾肩吾书品之目而别为后品，接其品第":
    "Li Sizhen takes up Yu Jianwu's grading of calligraphers and makes a later grading, continuing his ranks",
  "元人论诗之格法，承唐人诗式之体":
    "A Yuan writer on poetic rule and form, carrying on the Tang manuals of poetic pattern",
  "二书皆旧题范梈，四库并疑为后人依托":
    "Both bear Fan Peng's name, and the Four Treasuries doubts both as later ascriptions",
  "沈义父论词之四标准，承李清照别是一家之论":
    "Shen Yifu's four standards for ci carry on Li Qingzhao's claim that ci is a kind of its own",
  "同出李清照，一为其词、一为其论词之文": "Both from Li Qingzhao, one her ci and one her essay on ci",
  "同出姜夔，一为其词曲、一为其论诗": "Both from Jiang Kui, one his ci and tunes and one his remarks on poetry",
  "同出王夫之：一论史、一论诗，而立意相贯": "Both from Wang Fuzhi: one on history, one on poetry, of a single mind",
  "同出王国维，一论词、一考史，并见其治学之两面":
    "Both from Wang Guowei, one on ci and one on history - the two sides of his scholarship",
  "同出冯班，一杂论诗文、一专言书法":
    "Both from Feng Ban, one miscellaneous on letters and one wholly on calligraphy",
  "今人溯诗体之流变，所承为雕龙明诗、通变之例":
    "A modern tracing of how the poetic forms changed, on the model of the Wenxin diaolong on poetry and on change",
  "赵壹非草之论，赖法书要录卷一而存":
    "Zhao Yi's attack on cursive survives through the first chapter of the Fashu yaolu",
  "卫恒四体书势，法书要录卷一所录":
    "Wei Heng on the force of the four scripts, entered in the Fashu yaolu's first chapter",
  "索靖草书势，法书要录卷一所录":
    "Suo Jing on the force of cursive, entered in the Fashu yaolu's first chapter",
  "羊欣所记能书之人，法书要录卷一所录":
    "Yang Xin's record of able calligraphers, entered in the Fashu yaolu's first chapter",
  "虞和论书表，法书要录卷二所录":
    "Yu He's memorial on calligraphy, entered in the Fashu yaolu's second chapter",
  "王僧虔笔意赞，法书要录卷一所录":
    "Wang Sengqian's praise of brush intent, entered in the Fashu yaolu's first chapter",
  "陶弘景与梁武帝往复论书之启，法书要录卷二所录":
    "Tao Hongjing's exchange of letters on calligraphy with Emperor Wu of Liang, entered in the Fashu yaolu's second chapter",
  "庾肩吾书品，法书要录卷二所录":
    "Yu Jianwu's grading of calligraphers, entered in the Fashu yaolu's second chapter",
  "袁昂古今书评，法书要录卷二所录":
    "Yuan Ang's appraisal of calligraphers old and new, entered in the Fashu yaolu's second chapter",
  "虞世南笔髓论，法书要录卷三所录":
    "Yu Shinan on the marrow of the brush, entered in the Fashu yaolu's third chapter",
  "虞世南书旨述，法书要录卷三所录":
    "Yu Shinan's account of what calligraphy is for, entered in the Fashu yaolu's third chapter",
  "李嗣真书后品，法书要录卷三所录":
    "Li Sizhen's later grading of calligraphers, entered in the Fashu yaolu's third chapter",
  "张怀瓘书断三卷，法书要录卷七至卷九所录":
    "Zhang Huaiguan's three chapters of judgements, entered in the Fashu yaolu's chapters seven to nine",
  "张怀瓘六体书论，法书要录卷四所录":
    "Zhang Huaiguan on the six scripts, entered in the Fashu yaolu's fourth chapter",
  "张怀瓘论用笔十法，法书要录卷四所录":
    "Zhang Huaiguan's ten rules of brushwork, entered in the Fashu yaolu's fourth chapter",
  "张怀瓘评书药石论，法书要录卷四所录":
    "Zhang Huaiguan's remedies for calligraphy, entered in the Fashu yaolu's fourth chapter",
  "颜真卿述张旭笔法十二意，法书要录卷七所录":
    "Yan Zhenqing's account of Zhang Xu's twelve points of brush method, entered in the Fashu yaolu's seventh chapter",
  "韩愈送高闲序论张旭之书，法书要录卷九所录":
    "Han Yu's farewell to Gao Xian, on Zhang Xu's hand, entered in the Fashu yaolu's ninth chapter",
  "同篇两录，一存原文、一附今译":
    "One piece entered twice, once as the original and once with a modern rendering",
  "旧题右军题笔阵图之后，逐节申其笔势之说，离笔阵图则不成篇":
    "Ascribed to Wang Xizhi and written after the Battle Array of the Brush, expounding its account of brush force section by section; apart from that piece it does not stand",
  "朱长文续张怀瓘书断，接其神妙能三品而续录宋人":
    "Zhu Changwen continues Zhang Huaiguan's judgements, keeping his three ranks and adding the Song calligraphers",
  "姜夔自言续孙过庭书谱，分条论之":
    "Jiang Kui says he continues Sun Guoting's treatise, arguing it point by point",
  "同出阮元，分论书派与碑帖，碑学之二文":
    "Both from Ruan Yuan, one on the schools of calligraphy and one on steles against copybooks - the two essays that founded stele studies",
  "包世臣承阮元尊碑之论而详于笔法":
    "Bao Shichen carries on Ruan Yuan's case for the steles, with far more on brush method",
  "康有为广包世臣之说，尊魏碑而抑唐法":
    "Kang Youwei widens Bao Shichen's case, raising the Wei steles above Tang method",
  "陈绎曾承郑枃衍极论书之旨而条列笔法":
    "Chen Yizeng takes up the Yanji's doctrine of calligraphy and sets out its brush method point by point",

  "李密陈情表，古文观止卷七所选":
    "Li Mi's Memorial Expressing My Feelings, chosen for the Guwen Guanzhi's seventh chapter",
  "陶潜归去来辞，古文观止卷七所选": "Tao Qian's Return Home, chosen for the Guwen Guanzhi's seventh chapter",
  "陶潜桃花源记，古文观止卷七所选":
    "Tao Qian's Peach Blossom Spring, chosen for the Guwen Guanzhi's seventh chapter",
  "王羲之兰亭集序，古文观止卷七所选":
    "Wang Xizhi's Preface to the Orchid Pavilion Poems, chosen for the Guwen Guanzhi's seventh chapter",
  "诸葛亮前表，古文观止卷六所选": "Zhuge Liang's first memorial, chosen for the Guwen Guanzhi's sixth chapter",
  "诸葛亮后表，与前表并入古文观止卷六":
    "Zhuge Liang's second memorial, entering the Guwen Guanzhi's sixth chapter beside the first",
  "韩愈师说，古文观止卷八所选": "Han Yu's On the Teacher, chosen for the Guwen Guanzhi's eighth chapter",
  "韩愈杂说，古文观止卷八所选":
    "Han Yu's Miscellaneous Discourses, chosen for the Guwen Guanzhi's eighth chapter",
  "韩愈送董邵南序，古文观止卷八所选":
    "Han Yu's farewell to Dong Shaonan, chosen for the Guwen Guanzhi's eighth chapter",
  "李华吊古战场文，古文观止卷七所选":
    "Li Hua's Lament for the Ancient Battlefield, chosen for the Guwen Guanzhi's seventh chapter",
  "欧阳修醉翁亭记，古文观止卷十所选":
    "Ouyang Xiu's Pavilion of the Drunken Old Man, chosen for the Guwen Guanzhi's tenth chapter",
  "王安石读孟尝君传，古文观止卷十一所选":
    "Wang Anshi on the Lord of Mengchang, chosen for the Guwen Guanzhi's eleventh chapter",
  "苏轼前赤壁赋，古文观止卷十一所选":
    "Su Shi's first Red Cliff rhapsody, chosen for the Guwen Guanzhi's eleventh chapter",
  "曹植洛神赋，文选卷十九所录": "Cao Zhi's Goddess of the Luo, entered in the Wen xuan's nineteenth chapter",
  "王粲登楼赋，文选卷十一所录": "Wang Can's Climbing the Tower, entered in the Wen xuan's eleventh chapter",
  "张衡归田赋，文选卷十五所录":
    "Zhang Heng's Returning to the Fields, entered in the Wen xuan's fifteenth chapter",
  "旧题司马相如长门赋，文选卷十六所录":
    "The Long Gate rhapsody, ascribed to Sima Xiangru, entered in the Wen xuan's sixteenth chapter",
  "向秀思旧赋，文选卷十六所录":
    "Xiang Xiu's Longing for the Past, entered in the Wen xuan's sixteenth chapter",
  "潘岳秋兴赋，文选卷十三所录": "Pan Yue's Autumn Stirrings, entered in the Wen xuan's thirteenth chapter",
  "刘伶酒德颂，文选卷四十七所录":
    "Liu Ling's Hymn to the Virtue of Wine, entered in the Wen xuan's forty-seventh chapter",
  "嵇康与山涛书，文选卷四十三所录":
    "Ji Kang's letter breaking with Shan Tao, entered in the Wen xuan's forty-third chapter",
  "古诗十九首之目即出文选卷二十九，前此无此总名":
    "The very title Nineteen Old Poems comes from the Wen xuan's twenty-ninth chapter; they had no collective name before",
  "陈情表亦见文选卷三十七，表之一类":
    "The Memorial Expressing My Feelings stands in the Wen xuan's thirty-seventh chapter too, among the memorials",
  "归去来辞亦见文选卷四十五，辞之一类":
    "Return Home stands in the Wen xuan's forty-fifth chapter too, among the songs",
  "前表亦见文选卷三十七，与陈情表同类":
    "The first memorial stands in the Wen xuan's thirty-seventh chapter too, beside Li Mi's",
  "此诗赖玉台新咏卷一而存，题作古诗为焦仲卿妻作":
    "The poem survives through the first chapter of the New Songs from a Jade Terrace, titled there An Old Poem for the Wife of Jiao Zhongqing",
  "郭茂倩收入杂曲歌辞，与玉台新咏所录互校":
    "Guo Maoqian entered it among the miscellaneous airs, to be collated against the Jade Terrace text",
  "李白诗之别集，全唐诗太白一家所据":
    "Li Bai's own collection of poems, the source for his section of the Complete Tang Poems",
  "杜甫诗之别集，全唐诗少陵一家所据":
    "Du Fu's own collection of poems, the source for his section of the Complete Tang Poems",
  "王维诗之别集，全唐诗摩诘一家所据":
    "Wang Wei's own collection of poems, the source for his section of the Complete Tang Poems",
  "白居易诗之别集，全唐诗乐天一家所据":
    "Bai Juyi's own collection of poems, the source for his section of the Complete Tang Poems",
  "李贺诗之别集，全唐诗长吉一家所据":
    "Li He's own collection of poems, the source for his section of the Complete Tang Poems",
  "李商隐诗之别集，全唐诗义山一家所据":
    "Li Shangyin's own collection of poems, the source for his section of the Complete Tang Poems",
  "孟郊诗之别集，全唐诗东野一家所据":
    "Meng Jiao's own collection of poems, the source for his section of the Complete Tang Poems",
  "岑参诗之别集，全唐诗嘉州一家所据":
    "Cen Shen's own collection of poems, the source for his section of the Complete Tang Poems",
  "陈子昂诗之别集，全唐诗伯玉一家所据":
    "Chen Zi'ang's own collection of poems, the source for his section of the Complete Tang Poems",
  "崔颢诗之别集，全唐诗崔颢一家所据":
    "Cui Hao's own collection of poems, the source for his section of the Complete Tang Poems",
  "杜审言诗之别集，全唐诗必简一家所据":
    "Du Shenyan's own collection of poems, the source for his section of the Complete Tang Poems",
  "寒山诗之别集，全唐诗寒山一家所据":
    "Hanshan's own collection of poems, the source for his section of the Complete Tang Poems",
  "薛涛诗之别集，全唐诗洪度一家所据":
    "Xue Tao's own collection of poems, the source for her section of the Complete Tang Poems",
  "罗隐诗之别集，全唐诗昭谏一家所据":
    "Luo Yin's own collection of poems, the source for his section of the Complete Tang Poems",
  "同为李商隐之诗，一全集一选本":
    "Both are Li Shangyin's poems, one the complete collection and one a selection",
  "同为岑参之诗，一全集一选本": "Both are Cen Shen's poems, one the complete collection and one a selection",
  "离骚为楚辞之首篇，王逸章句即以此开卷":
    "Encountering Sorrow opens the Chu ci; Wang Yi's phrasing begins with it",
  "九歌十一章入楚辞，次离骚之后": "The eleven Nine Songs enter the Chu ci, placed after Encountering Sorrow",
  "阳明全书卷一至卷三即传习录上中下":
    "The first three chapters of Yangming's complete works are the three parts of the Instructions for Practical Living",
  "王艮出阳明之门，泰州一派自此而立": "Wang Gen studied under Yangming; the Taizhou school begins from here",
  "聂豹守阳明归寂之说，与泰州一派异趣":
    "Nie Bao held to Yangming's doctrine of returning to stillness, parting ways with the Taizhou school",
  "爱莲说入周子全书，与太极图说、通书同编":
    "On Loving the Lotus enters Zhou Dunyi's complete works, printed with the Diagram of the Supreme Ultimate and the Penetrating Book",
  "朱子以周子为道学之宗，语类屡举太极图说而申之":
    "Zhu Xi took Zhou Dunyi for the founder of the Learning of the Way; the Classified Conversations expound his Diagram again and again",
  "兰亭序入右军集，右军文之首篇":
    "The Orchid Pavilion preface opens Wang Xizhi's collected works, the first of his prose",
  "旧题右军论书之文，一并收入右军集":
    "Ascribed to Wang Xizhi and gathered into his collected works with the rest",

  // 二十九、辩题与五德
  //
  // 日程里那些辩题：它们存的是中文（题面要递给模型，口吻与检索都凭中文），
  // 译文只在题板与辩席上露面。
  "为学次第": "The order of learning",
  "道法自然": "The Way follows what is so of itself",
  "有用与无用": "Use and uselessness",
  "礼之为用": "What ritual is for",
  "君与民孰重？": "Ruler or people — which weighs more?",
  "赏罚之信": "Keeping faith in reward and punishment",
  "合纵连横孰利？": "Vertical alliance or horizontal — which profits more?",
  "白马非马？": "Is a white horse not a horse?",
  "道与言": "The Way and words",
  "名与实孰先？": "Name or substance — which comes first?",
  "王霸之术": "The arts of the king and the hegemon",
  "合同异": "Uniting sameness and difference",
  "言之与意": "Words and what they mean",
  "连横": "The horizontal alliance",
  "兵势": "Momentum in war",
  "富国强兵": "A rich state and a strong army",
  "战与和": "War and peace",
  "阴阳消息": "The waxing and waning of yin and yang",
  "上善若水": "The highest good is like water",
  "纵横游说": "Persuasion among the states",
  "义与利": "Right and profit",
  "兼收并蓄": "Taking in every school",
  "节用与民生": "Frugality and the people's livelihood",
  "富国之道": "The way to enrich a state",
  "道德之意": "What the Way and its power mean",
  "兵家三要": "The three essentials of the strategists",
  "名辩三代": "Three generations of the disputers of names",
  "法术势": "Law, method, and power",
  "韬与略": "Concealment and stratagem",

  // 邹衍头顶那枚「当德」之徽：五行各一字，合「德」成一枚短牌（见 scene/WorldScene.tsx）。
  // 单字的行照词表旧例作裸键。
  土: "Earth",
  木: "Wood",
  金: "Metal",
  火: "Fire",
  水: "Water",
  "{element}德": "{element} ascendant",

  // ── 三十、母题 ───────────────────────────────────────────────
  // 十二母题的题名（见 world/motifs.ts）。同一世界之内辩命题，跨世界之间评议母题，
  // 故这十二个词是三轴共用的那一层，须译；而 hint 与锚点 note 是喂给模型的，不上屏，不译。
  "出走": "Leaving home",
  "天命与僭越": "Mandate and usurpation",
  "名与实": "Name and reality",
  "真与假": "True and false",
  "师徒": "Master and disciple",
  "归途": "The way back",
  "牺牲": "Sacrifice",
  "规训与自由": "Discipline and freedom",
  "欲与节": "Desire and restraint",
  "乌托邦": "Utopia",
  "幻灭": "Disenchantment",
  "结义与绝交": "Sworn bonds and broken ones",

  // ── 三十一、地名的副题 ───────────────────────────────────────
  // 地图上每处名号之下的那半行小字（见 world/regions.ts 的 sub）。
  // 同处的 mood 一行不在此——战国这边的 mood 不上屏，只西游那边显，故不列。
  "弦歌不辍": "Strings and song never cease",
  "巧工利天下": "Skilled work for the world's good",
  "明法审令": "Clear law, examined decrees",
  "不治而议论": "Debating without holding office",
  "万物自在": "All things at their ease",
  "离坚白": "Parting hard from white",
  "众声喧阗": "A clamour of voices",
  "稼穑": "Sowing and reaping",
  "车同轨": "One gauge for every cart",
  "街谈巷语": "Street talk and alley rumour",
  "济渡": "Ferrying across",

  // ── 三十二、人物：名、字、小传 ───────────────────────────────
  // 人物卡上那一行小传（intro）是本作自撰的介绍，非典籍原文，故译；
  // 卡上那一句引言（quote）是原文，照旧不替换，另附英译一行（见 page.tsx）。
  // 「字」一概作音译——那是名字，不是词。
  "申不害": "Shen Buhai",
  "慎到": "Shen Dao",
  "邓析": "Deng Xi",
  "尹文": "Yin Wen",
  "田穰苴": "Tian Rangju",
  "尉缭": "Wei Liao",
  "吕望": "Lü Wang",
  "黄石公": "The Yellow Stone Elder",
  "游学者": "Traveling student",
  "仲尼": "Zhongni",
  "子舆": "Ziyu",
  卿: "Qing",
  翟: "Di",
  "季子": "Jizi",
  "子秉": "Zibing",
  "子皙": "Zixi",
  "伯阳": "Boyang",
  "谈天": "Tantian",
  "长卿": "Changqing",
  "御寇": "Yukou",
  "子居": "Ziju",
  仲: "Zhong",
  起: "Qi",
  "子产": "Zichan",
  "穰苴": "Rangju",
  缭: "Liao",
  "子牙": "Ziya",
  "黄石": "Huangshi",
  "以仁为本，以礼为序，主张有教无类。":
    "Benevolence at the root, ritual for order, and teaching open to all whatever their station.",
  "主张性善，以仁政赢得民心。":
    "Human nature is good; win the people's hearts by benevolent government.",
  "重视礼法与后天教化，强调积学修身。":
    "Ritual and law, and the shaping force of education: character is built by accumulated study.",
  "倡导兼爱、非攻、尚贤与节用。":
    "Impartial care, no war of aggression, promote the worthy, spend sparingly.",
  "崇尚逍遥自然，以寓言破除成见。":
    "Free and easy wandering with nature, and fables to break settled opinion.",
  "以法、术、势构成秩序严密的治国体系。":
    "Law, method and positional power fitted into one tight system of rule.",
  "倡导合纵，联合六国以抗强秦，佩六国相印。":
    "Advocate of the Vertical Alliance — six states joined against mighty Qin; he wore the seals of all six.",
  "以连横破合纵，佐秦并天下。":
    "Broke the Vertical Alliance with the Horizontal one, and helped Qin swallow the realm.",
  "主离坚白、白马之辩，名家之雄。":
    "Champion of the School of Names: hardness parted from whiteness, and the white horse that is not a horse.",
  "主合同异之辩，历物之意，与庄子相善。":
    "Argued that same and different merge; his ten theses ran through all things; a friend of Zhuangzi.",
  "著道德之意，尚无为而治，为道家所宗。":
    "Wrote on the Way and its power, and on ruling by non-action; the Daoists look back to him.",
  "创五德终始、大九州之说，推阴阳消息以论时运与帝王受命之德。":
    "Framed the cycle of the Five Powers and the Nine Great Continents, reading the ebb and flow of yin and yang to tell a dynasty's hour and the virtue by which it holds the mandate.",
  "著《孙子兵法》，主慎战、全胜，以伐谋为先、不战而屈人为上。":
    "Author of The Art of War: fight warily and win whole; attack the enemy's plans first, and best of all subdue him without a battle.",
  "孔子之孙孔伋，传曾子之学，著《中庸》，主诚与慎独、致中和；孟子受业于其门人。":
    "Kong Ji, grandson of Confucius and heir to Zengzi's learning; author of the Doctrine of the Mean — sincerity, watchfulness when alone, and the centred harmony. Mencius studied under his disciples.",
  "纵横鼻祖，隐居鬼谷，苏秦、张仪之师；主捭阖、反应、飞箝、揣摩、忤合之术，兼修本经阴符七术。":
    "Founder of the diplomats' art, a recluse of Ghost Valley and teacher of Su Qin and Zhang Yi: opening and closing, drawing out a response, the pincer, sounding out, falling in or breaking away — and the seven esoteric arts besides.",
  "卫国公孙鞅，仕秦变法，废井田开阡陌、奖耕战、严刑峻法，封于商，史称商鞅；著《商君书》主耕战、任法不任人、重刑少赏。":
    "Gongsun Yang of Wei, who reformed Qin — the well-field system abolished and the field paths opened, farming and fighting rewarded, punishments made severe. Enfeoffed at Shang, hence Shang Yang. The Book of Lord Shang urges farm and war, trust in law rather than in men, heavy punishment and sparing reward.",
  "孙武之后，受庞涓膑刑断足，仕齐为军师，马陵之战杀庞涓；著《孙膑兵法》，主因势利导、以奇胜、批亢捣虚。":
    "A descendant of Sun Wu, crippled at Pang Juan's hand; strategist to Qi, he killed Pang Juan at Maling. His Art of War: turn the situation to your own use, win by the unexpected, strike at the throat and seize the empty place.",
  "列御寇，道家，著《列子》（《冲虚真经》），主贵虚、顺物无为，寓言有愚公移山、杞人忧天、御风而行。":
    "Lie Yukou, a Daoist, whose Liezi (the Classic of Perfect Emptiness) prizes emptiness and going along with things without contriving — the old man who moved the mountains, the man of Qi who feared the sky would fall, the ride upon the wind.",
  "杨朱，字子居，战国早期，主「为我」「贵己」「全性保真」，无专书，其言散见《孟子》《列子·杨朱》《吕氏春秋》；孟子称「杨朱墨翟之言盈天下」。":
    "Yang Zhu, styled Ziju, of the early Warring States: act for oneself, prize the self, keep one's nature whole and true. He left no book; his words survive scattered through the Mencius, the Yang Zhu chapter of the Liezi, and the Lüshi Chunqiu. Mencius complained that “the words of Yang Zhu and Mo Di fill the world.”",
  "许行，战国楚人，农家代表，习神农之言，主「君臣并耕」「市贾不贰」，无专书，其事见《孟子·滕文公上》。":
    "Xu Xing of Chu, spokesman for the Tillers, who followed the teaching of Shennong: ruler and minister should plough alike, and prices in the market should not be doubled. He left no book; his doings are recorded in the Mencius.",
  "曾参，字子舆，孔子弟子，传《大学》《孝经》，主孝道、慎终追远、吾日三省；子思受业其门，孟子再传。":
    "Zeng Shen, styled Ziyu, a disciple of Confucius and transmitter of the Great Learning and the Classic of Filial Piety — filial duty, careful rites for the dead and remembrance of the distant, and the threefold daily self-examination. Zisi studied under him, and Mencius at one remove.",
  "管夷吾，相齐桓公九合诸侯一匡天下，轻重九府富国；《管子》托其名，开法家之先声，任法、顺民、轻重之术皆本于此。":
    "Guan Yiwu, minister to Duke Huan of Qi, who nine times gathered the lords and set the realm in order, enriching the state through the offices of weight and measure. The Guanzi goes under his name and sounds the first note of Legalism: trust in law, follow the people, manage the heavy and the light.",
  "卫人吴起，仕鲁魏楚，与士卒最下者同衣食；著《吴子》，主内修文德外治武备，用兵在治不在众。":
    "Wu Qi of Wei, who served Lu, Wei and Chu and ate and dressed as his lowest soldiers did. The Wuzi: cultivate civil virtue within and military readiness without; an army wins by order, not by numbers.",
  "郑之贱臣，相韩昭侯十五年，内修政教外应诸侯；《申子》主术，循名责实、君操其柄，法家「术」之一系由此立。":
    "A lowly servant of Zheng who served fifteen years as minister to Marquis Zhao of Han, ordering the state within and answering the lords without. The Shenzi teaches method — hold each name to its reality and keep the handles in the ruler's hand: the 'method' line of Legalism begins here.",
  "赵人慎到，先黄老后刑名；《慎子》主势——贤者未足以服众，而势位足以屈贤者，故腾蛇游雾、飞龙乘云。":
    "Shen Dao of Zhao, who began in Huang-Lao and turned to names and punishments. The Shenzi teaches position: worth alone will not make men obey, but position can bend the worthy — the serpent rides the mist, the dragon the cloud.",
  "郑国大夫邓析，操两可之说，设无穷之辞，以非为是、以是为非，与民之有狱者约，大狱一衣、小狱襦袴；《邓析子》开名辩之先河。":
    "Deng Xi, a grandee of Zheng, who argued a case both ways and spun disputation without end, making wrong right and right wrong. He took his fee from litigants — a robe for a great suit, jacket and trousers for a small one. The Dengxizi opens the art of disputation.",
  "齐人尹文，游稷下，与宋钘同游；《尹文子》主名以检形、形以检名，名正则治、名乱则争，黄老刑名之间。":
    "Yin Wen of Qi, who travelled to Jixia in company with Song Xing. The Yinwenzi: let the name test the form and the form test the name — when names are right there is order, when names are confused there is strife. He stands between Huang-Lao and the school of names and punishments.",
  "齐田氏庶孽，晏婴荐于景公，文能附众武能威敌，斩庄贾以立信；《司马法》托其名，主以仁为本、以义治之、以战止战。":
    "Of a minor branch of Qi's Tian clan, recommended to Duke Jing by Yan Ying; civil enough to hold men together and martial enough to cow an enemy, he beheaded Zhuang Jia to make his word good. The Methods of the Sima goes under his name: benevolence at the root, rightness in the ordering, war to put an end to war.",
  "魏人尉缭，秦王政客卿，著《尉缭子》天官不若人事、兵者以武为植以文为种，杂刑名于兵家。":
    "Wei Liao of Wei, a retained adviser to the king of Qin. His Wei Liaozi: the omens of heaven count for less than the doings of men, and in war force is the stock but civil order the seed — names and punishments grafted onto the military art.",
  "姜姓吕氏名尚，垂钓渭滨，周文王载而归，尊为太公望，佐武王伐纣；《六韬》托其名，文伐、发机、韬光养晦，兵家权谋之祖。":
    "Shang of the Lü clan, who fished the banks of the Wei until King Wen of Zhou carried him home and honoured him as Taigong Wang; he helped King Wu overthrow the tyrant. The Six Secret Teachings goes under his name — attack by stratagem, seize the moment, keep one's brilliance hidden: the father of scheming in war.",
  "圯上老人，授张良《太公兵法》；《三略》托其名，主柔弱制刚强、因敌转化、为将之道在体下士。":
    "The old man on the bridge, who gave Zhang Liang Taigong's Art of War. The Three Strategies goes under his name: the soft governs the hard, one changes as the enemy changes, and a general's way is to share the lot of his men.",
  "老子弟子，与孔子并时，楚平王问之；《文子》解老而杂黄老刑名，主道无为而无不为、以退为进，下开文景之治。":
    "A disciple of Laozi, contemporary with Confucius and questioned by King Ping of Chu. The Wenzi expounds Laozi with Huang-Lao and Legalist admixture: the Way does nothing, yet leaves nothing undone, and one advances by giving ground — the seed of the Wen-Jing peace.",
  "周游天下、就学诸子的客，可入席圆桌参与百家争鸣。":
    "The guest who travels the realm studying under the philosophers, and may take a seat at the round table where a hundred schools contend.",

  // ── 三十三、西方文哲的家数 ───────────────────────────────────
  // 这一行与中土的「儒家」「墨家」同格，出现在批注席、母题席与片段点评的名牌上。
  // 其小传（intro）与引言（quote）只喂模型、不上屏，故不列此表。
  "史诗诗人": "Epic poet",
  "诗剧作家": "Verse dramatist",
  "小说家": "Novelist",
  "诗哲": "Poet-philosopher",
  "剧作家": "Playwright",
  "博物学家": "Naturalist",
  "科幻小说家": "Science-fiction writer",

  // ── 三十四、取经路上各人的闲时 ───────────────────────────────
  // 西游人物牌上那一行（xiyou-personas 的 idle）不带「正在」二字，
  // XiyouScene 直接把它交给 <Figure action>，故此处照无前缀的原样立条。
  "在云头上打盹，耳朵支着": "Dozing on a cloud, one ear cocked",
  "马上诵经，望见烟火便思化斋": "Chanting in the saddle; at the first cooking smoke, thinking of alms",
  "靠在包袱上盘算下一顿": "Leaning on the baggage, reckoning up the next meal",
  "歇担擦汗，一言不发": "Setting down the load to wipe his brow, saying nothing",
  "净瓶杨枝，俯看南赡部洲": "Vase and willow sprig in hand, looking down on the Southern Continent",
  "莲台上不动，三界事皆在目中": "Still upon the lotus seat, the three realms all within view",
  "凌霄殿上听群仙奏事": "Hearing the immortals' reports in the Hall of Divine Mists",
  "摩云洞中饮酒，避见故人": "Drinking in the Cloud-Touching Cave, avoiding an old acquaintance",
  "瑶台讲道，座下三十人听": "Expounding the Way on the jade terrace, thirty seated below",
  "八卦炉前看火候": "Watching the fire at the Eight Trigrams Crucible",
  "袖着圣旨，候在南天门": "An edict up his sleeve, waiting at the Southern Gate of Heaven",
  "殿上展开那卷通关文牒": "Unrolling the travel rescript in the throne hall",
  "果树下看清风明月扫地": "Under the fruit trees, watching Pure Wind and Bright Moon sweep",
  "芭蕉洞中闭门，不见来客": "Shut in at Plantain Cave, receiving no visitors",
  "銮驾候在迎阳驿外": "The imperial carriage waiting outside the Yingyang post-house",
  // ── 三十五、后世影音：片名 ───────────────────────────────────
  // 有通行英文片名的照通行者（《西游记》作 Journey to the West），
  // 无者直译其意。片名与出品一行只是目录，不是台词。
  "孔子传": "A Life of Confucius",
  "墨攻": "A Battle of Wits",
  "孙子大传": "The Life of Sun Wu",
  "老子传奇": "The Legend of Laozi",
  "庄子说": "Zhuangzi Speaks",
  "大秦帝国之裂变": "The Qin Empire",
  "大秦帝国之纵横": "The Qin Empire II: Alliance",
  "大秦帝国之崛起": "The Qin Empire III: Rise",
  "大秦赋": "Qin Dynasty Epic",
  "天行九歌": "The Legend of Qin: Nine Songs of the Moving Heavens",
  "秦时明月": "The Legend of Qin",
  "吕不韦传奇": "The Legend of Lü Buwei",
  "封神第一部：朝歌风云": "Creation of the Gods I: Kingdom of Storms",
  "封神第一部": "Creation of the Gods I",
  "封神榜": "The Investiture of the Gods",
  "故宫": "The Forbidden City",
  "东周列国·春秋篇": "The Eastern Zhou Kingdoms · Spring and Autumn",
  "东周列国·战国篇": "The Eastern Zhou Kingdoms · Warring States",
  "汉武大帝": "The Emperor in Han Dynasty",
  "中国通史": "A General History of China",
  "三国演义": "Romance of the Three Kingdoms",
  "红楼梦": "Dream of the Red Chamber",
  "水浒传": "The Water Margin",
  "八仙全传": "The Legend of the Eight Immortals",
  "达摩祖师传": "Master of Zen",
  "鹿鼎记": "The Duke of Mount Deer",
  "孙子兵法与三十六计": "The Art of War and the Thirty-Six Stratagems",
  "楚汉传奇": "The Legend of Chu and Han",
  "姜子牙": "Jiang Ziya: Legend of Deification",
  "长安三万里": "Chang'an",
  "倩女幽魂": "A Chinese Ghost Story",
  "聊斋电视系列片": "Liaozhai: The Television Series",
  "大鱼海棠": "Big Fish & Begonia",
  "啼笑书香": "Laughter Among the Books",
  "西游记": "Journey to the West",
  "大话西游": "A Chinese Odyssey",
  "大话西游之月光宝盒／大圣娶亲": "A Chinese Odyssey: Pandora's Box / Cinderella",
  "西游记之大圣归来": "Monkey King: Hero Is Back",
  "王子复仇记": "Hamlet",
  "哈姆莱特：复仇的悲剧": "Hamlet: The Drama of Vengeance",
  "拉曼查的男人": "Man of La Mancha",
  "造物弄人": "Creation",
  "达尔文的航程": "The Voyage of Charles Darwin",
  "月球旅行记": "A Trip to the Moon",
  "从地球到月球": "From the Earth to the Moon",
  // 央视《典籍里的中国》一系，英文台名作 China in the Classics
  "典籍里的中国·论语": "China in the Classics · The Analects",
  "典籍里的中国·孙子兵法": "China in the Classics · The Art of War",
  "典籍里的中国·尚书": "China in the Classics · The Book of Documents",
  "典籍里的中国·中庸": "China in the Classics · The Doctrine of the Mean",
  "典籍里的中国·礼记": "China in the Classics · The Book of Rites",
  "典籍里的中国·诗经": "China in the Classics · The Book of Songs",
  "典籍里的中国·说文解字": "China in the Classics · Shuowen Jiezi",
  "典籍里的中国·汉书": "China in the Classics · The Book of Han",
  "典籍里的中国·传习录": "China in the Classics · Instructions for Practical Living",
  "典籍里的中国·道德经": "China in the Classics · The Daodejing",
  "典籍里的中国·天工开物": "China in the Classics · The Exploitation of the Works of Nature",
  "典籍里的中国·齐民要术": "China in the Classics · Essential Skills for the Common People",
  "典籍里的中国·楚辞": "China in the Classics · The Songs of Chu",
  "典籍里的中国·文心雕龙": "China in the Classics · The Literary Mind and the Carving of Dragons",
  "典籍里的中国·史记": "China in the Classics · Records of the Grand Historian",

  // ── 三十六、后世影音：出品与形制 ─────────────────────────────
  "胡玫导演，周润发饰孔子": "dir. Hu Mei; Chow Yun-fat as Confucius",
  "山东影视": "Shandong Television",
  "钱穆著": "by Qian Mu",
  "央视": "CCTV",
  "张之亮导演，刘德华饰革离": "dir. Jacob Cheung; Andy Lau as Ge Li",
  "韩静霆著": "by Han Jingting",
  "刘俊杰导演": "dir. Liu Junjie",
  "陈卫国导演": "dir. Chen Weiguo",
  "蔡志忠漫画/动画": "comics and animation by Tsai Chih-chung",
  "丁黑导演": "dir. Ding Hei",
  "沈乐平": "Shen Leping",
  "丁黑导演，喻恩泰饰张仪": "dir. Ding Hei; Yu Entai as Zhang Yi",
  "延艺等导演，段奕宏饰吕不韦": "dir. Yan Yi and others; Duan Yihong as Lü Buwei",
  "周晓文导演": "dir. Zhou Xiaowen",
  "延艺等导演": "dir. Yan Yi and others",
  "乌尔善导演": "dir. Wuershan",
  "央视专题片": "a CCTV documentary series",
  "央视三十集，沈好放导演": "CCTV, 30 episodes; dir. Shen Haofang",
  "胡玫导演": "dir. Hu Mei",
  "央视百集纪录片": "CCTV, a documentary in a hundred parts",
  "央视八十四集，王扶林总导演": "CCTV, 84 episodes; chief dir. Wang Fulin",
  "中国大陆古装神话剧": "a mainland Chinese costume fantasy serial",
  "黄健中导演，王志飞饰商鞅": "dir. Huang Jianzhong; Wang Zhifei as Shang Yang",
  "黄健中导演": "dir. Huang Jianzhong",
  "央视三十二集，阎建钢导演": "CCTV, 32 episodes; dir. Yan Jiangang",
  "袁振洋（释传般）编导，樊少皇主演":
    "written and directed by Brandy Yuen (Shi Chuanban); starring Fan Siu-wong",
  "金庸原著，无线电视剧集": "from the novel by Jin Yong; a TVB serial",
  "山东三冠影视，仇永力饰孙膑": "Shandong Sanguan Television; Qiu Yongli as Sun Bin",
  "高希希导演": "dir. Gao Xixi",
  "程腾、李炜导演": "dir. Cheng Teng and Li Wei",
  "追光动画，谢君伟、邹靖导演": "Light Chaser Animation; dir. Xie Junwei and Zou Jing",
  "王扶林导演，央视三十六集": "dir. Wang Fulin; CCTV, 36 episodes",
  "张绍林导演，央视四十三集": "dir. Zhang Shaolin; CCTV, 43 episodes",
  "上海电视台剧集": "a Shanghai Television serial",
  "程小东导演，徐克监制": "dir. Ching Siu-tung; produced by Tsui Hark",
  "福建电视台、南昌影视创作研究所":
    "Fujian Television and the Nanchang Film and Television Institute",
  "彼岸天文化，梁旋、张春导演": "B&T Studio; dir. Liang Xuan and Zhang Chun",
  "郑晓龙任艺术总监，陈键锋、潘粤明主演":
    "artistic director Zheng Xiaolong; starring Sammul Chan and Pan Yueming",
  "杨洁导演，六小龄童饰孙悟空": "dir. Yang Jie; Liu Xiao Ling Tong as Sun Wukong",
  "刘镇伟导演，周星驰饰至尊宝": "dir. Jeffrey Lau; Stephen Chow as Joker",
  "田晓鹏导演": "dir. Tian Xiaopeng",
  "劳伦斯·奥利弗导演并主演": "directed by and starring Laurence Olivier",
  "肯尼思·布莱纳导演并主演": "directed by and starring Kenneth Branagh",
  "斯文·加德、海因茨·沙尔导演，阿斯塔·尼尔森主演":
    "dir. Svend Gade and Heinz Schall; starring Asta Nielsen",
  "迈克尔·霍夫曼导演": "dir. Michael Hoffman",
  "查尔斯·肯特、J. 斯图尔特·布莱克顿导演": "dir. Charles Kent and J. Stuart Blackton",
  "安德烈·康查洛夫斯基导演": "dir. Andrei Konchalovsky",
  "贝尔托利尼、德·里瓜罗导演": "dir. Francesco Bertolini and Giuseppe de Liguoro",
  "亚瑟·希勒导演，彼得·奥图主演": "dir. Arthur Hiller; starring Peter O'Toole",
  "劳·劳里岑导演，Fy og Bi 搭档主演": "dir. Lau Lauritzen; starring the duo Fy og Bi",
  "F.W. 茂瑙导演": "dir. F. W. Murnau",
  "亚历山大·索科洛夫导演": "dir. Aleksandr Sokurov",
  "乔治·库克导演，葛丽泰·嘉宝主演": "dir. George Cukor; starring Greta Garbo",
  "雷·C. 斯莫尔伍德导演，娜兹莫娃、瓦伦蒂诺主演":
    "dir. Ray C. Smallwood; starring Alla Nazimova and Rudolph Valentino",
  "乔恩·阿米尔导演": "dir. Jon Amiel",
  "BBC 七集剧集": "a BBC serial in seven parts",
  "乔治·梅里爱": "Georges Méliès",
  "拜伦·哈斯金导演，约瑟夫·科顿主演": "dir. Byron Haskin; starring Joseph Cotten",

  // ── 三十七、后世影音：短述 ───────────────────────────────────
  // 「非直演《某书》」一语甚多，英文一概作 Not an adaptation of X as such，
  // 其后接一句说明何以仍列于此书之下。
  "传记电影，述孔子周游列国、归鲁修《春秋》。":
    "A biographical film: Confucius among the states, and his return to Lu to edit the Spring and Autumn Annals.",
  "电视剧，铺陈孔子一生与孔门弟子。":
    "A serial covering the whole life of Confucius and his disciples.",
  "传记，考据与叙事并重。": "A biography, as much scholarship as narrative.",
  "以舞台剧演《论语》成书与孔门师弟之情。":
    "A staged drama on the making of the Analects and the bond between master and disciples.",
  "墨者革离助梁城以守，演非攻兼爱之旨。":
    "The Mohist Ge Li defends the city of Liang — condemning aggression and impartial care, put on screen.",
  "小说，述孙武自齐入吴、练兵破楚。":
    "A novel: Sun Wu leaves Qi for Wu, drills an army and breaks Chu.",
  "剧改，演孙武用兵与人生。": "A serial on Sun Wu's campaigns and his life.",
  "舞台演《孙子》十三篇成书与柏举之战。":
    "A staged drama on the writing of the thirteen chapters and the battle of Boju.",
  "电视剧，演老子生平与著五千言。":
    "A serial on the life of Laozi and the writing of the five thousand characters.",
  "演老子出关应关令尹喜之请留《道德经》。":
    "Laozi leaves through the pass and, at the keeper Yin Xi's request, leaves the Daodejing behind.",
  "以漫画化玄奥为童趣，演庄子逍遥。":
    "Comics that turn the abstruse into child's play, and Zhuangzi's free wandering with it.",
  "剧中有韩非入秦、李斯忌之之段。":
    "The serial includes Han Fei's arrival in Qin and Li Si's jealousy of him.",
  "以韩非为主角演其青年谋断。":
    "Han Fei as protagonist, in the schemes and decisions of his younger years.",
  "剧中征引韩非之说。": "The serial quotes Han Fei's doctrine.",
  "演苏秦合纵之策与纵横家风采。":
    "Su Qin's vertical alliance, and the bearing of the diplomatist school.",
  "演张仪连横破纵、游说六国。":
    "Zhang Yi breaks the alliance by horizontal union, talking his way through the six states.",
  "演吕不韦「奇货可居」与相秦摄政。":
    "Lü Buwei's \"rare goods worth hoarding\", and his regency as chancellor of Qin.",
  "专演吕不韦自商入政一生。":
    "Devoted to Lü Buwei's whole passage from merchant to statesman.",
  "剧中演吕氏门客杂纂《吕氏春秋》。":
    "The serial shows Lü's retainers compiling the Annals of Lü Buwei between them.",
  "西伯侯姬昌被囚羑里、演卦通命。":
    "The Earl of the West, Ji Chang, imprisoned at Youli, working the hexagrams until destiny opens to him.",
  "银幕演文王演八卦之渊源。":
    "The screen version of how King Wen came to work out the eight trigrams.",
  "演孔子删定《尚书》与伏生护书传经。":
    "Confucius editing the Book of Documents, and Fu Sheng keeping it safe to pass it on.",
  "演《中庸》相传出子思之手与「慎独」之旨。":
    "The Doctrine of the Mean, by tradition from the hand of Zisi, and its teaching of watchfulness when alone.",
  "动画群像，墨家机关城藏反秦之士，涉诸子百家。":
    "An animated ensemble: the Mohists' mechanical city shelters those who resist Qin, and the hundred schools pass through it.",
  "非直演《孟子》；孔孟一贯，此集演孔门师弟问答，性善民贵之说即承其绪。":
    "Not an adaptation of Mencius as such; but Confucius and Mencius are of one line, and this episode of master-and-disciple exchanges is the ground from which \"nature is good\" and \"the people come first\" grow.",
  "演《礼记》所记礼之本与「大同」之章。":
    "The root of ritual as the Book of Rites gives it, and the chapter on the Great Commonwealth.",
  "非直演《仪礼》；三礼同源，此集演礼之本，仪节之详当并观。":
    "Not an adaptation of the Ceremonies and Rites as such; the three ritual classics share a source, and this episode on the root of ritual is best watched alongside the detail of the ceremonies.",
  "非直演《周礼》；紫禁城「左祖右社、前朝后寝」之制本于《周礼·考工记》。":
    "Not an adaptation of the Rites of Zhou as such; but the Forbidden City's plan — ancestral temple left, altar of soil right, court in front and chambers behind — comes from its Artificer's Record.",
  "演毛亨毛苌传诗、风雅颂之成书。":
    "Mao Heng and Mao Chang transmitting the odes, and the making of the Airs, Odes and Hymns.",
  "非直演《孝经》；此书托孔子为曾子陈孝，与银幕之孔门相照。":
    "Not an adaptation of the Classic of Filial Piety as such; the book puts its teaching in Confucius's mouth, addressed to Zengzi, and throws light on the Confucian circle shown here.",
  "非直演《尔雅》；《尔雅》与《说文》同为训诂字书之祖，此集演许慎著书之事。":
    "Not an adaptation of the Erya as such; the Erya and the Shuowen are together the ancestors of Chinese lexicography, and this episode is about Xu Shen writing his.",
  "春秋诸事之剧演，所本多出《左传》。":
    "The affairs of the Spring and Autumn age dramatised, mostly after the Zuo Tradition.",
  "非直演《公羊传》；董仲舒以公羊学对天人三策，一代经学之用见于此剧。":
    "Not an adaptation of the Gongyang Tradition as such; but Dong Zhongshu answered the throne's three questions out of Gongyang learning, and this serial shows what a generation of classical scholarship was for.",
  "非直演《谷梁传》；谷梁与公羊、左氏同释一经，此剧演其所释之春秋。":
    "Not an adaptation of the Guliang Tradition as such; Guliang, Gongyang and Zuo all expound one classic, and this serial dramatises the age they expound.",
  "演班氏父子撰《汉书》与班昭续成之事。":
    "Ban Biao and Ban Gu writing the Book of Han, and Ban Zhao finishing it.",
  "非直演《后汉书》；东汉诸集之所据多本范晔此书。":
    "Not an adaptation of the Book of the Later Han as such; but the Eastern Han episodes rest largely on Fan Ye's history.",
  "非直演《三国志》；演义本陈寿此志而增饰，正史与演义当对看。":
    "Not an adaptation of the Records of the Three Kingdoms as such; the novel embroiders Chen Shou's history, and the two are best read against each other.",
  "非直演《资治通鉴》；编年叙事之法与所纪千载之事可对看。":
    "Not an adaptation of the Comprehensive Mirror as such; but its annalistic method and the thousand years it covers bear comparison.",
  "剧中苏秦张仪之说辞，多本《战国策》所载。":
    "The speeches given to Su Qin and Zhang Yi follow the Strategies of the Warring States closely.",
  "非直演《国语》；所演春秋列国之事与此书互见。":
    "Not an adaptation of the Discourses of the States as such; the affairs of the Spring and Autumn states it dramatises are told there too.",
  "非直演《晏子春秋》；剧中演齐景公与晏婴君臣之对。":
    "Not an adaptation of the Annals of Yanzi as such; but it stages the exchanges between Duke Jing of Qi and his minister Yan Ying.",
  "演王阳明龙场悟道与知行合一之教。":
    "Wang Yangming's awakening at Longchang, and his teaching that knowing and doing are one.",
  "非直演《荀子》；韩非李斯俱出荀门，剧中可见其学之行于秦。":
    "Not an adaptation of the Xunzi as such; but Han Fei and Li Si both came from Xunzi's school, and the serial shows that learning at work in Qin.",
  "非直演《孔子家语》；此书所记孔子言行，与银幕之孔子互为注脚。":
    "Not an adaptation of the School Sayings of Confucius as such; the words and deeds it records and the Confucius on screen gloss each other.",
  "非直演《春秋繁露》；剧演董仲舒天人三策，即此书之旨所自出。":
    "Not an adaptation of the Luxuriant Dew as such; but the three policy answers on heaven and man that it dramatises are where the book's doctrine comes from.",
  "非直演《盐铁论》；桑弘羊与贤良文学盐铁之议，见于西汉诸集。":
    "Not an adaptation of the Discourses on Salt and Iron as such; the debate between Sang Hongyang and the men of letters appears in the Western Han episodes.",
  "非直演《朱子语类》；朱熹理学一集可见其讲学之境。":
    "Not an adaptation of the Classified Conversations of Master Zhu as such; but the episode on Zhu Xi's learning shows the setting in which he taught.",
  "非直演《说苑》；刘向校书编事之背景见于西汉诸集。":
    "Not an adaptation of the Garden of Stories as such; the background to Liu Xiang's collating and compiling is in the Western Han episodes.",
  "非直演《新序》；与《说苑》同出刘向之手，皆采旧事以资劝戒。":
    "Not an adaptation of the New Prefaces as such; it came from Liu Xiang's hand like the Garden of Stories, both gathering old tales to admonish by.",
  "非直演《抱朴子》；魏晋神仙道教与葛洪之学见于其中。":
    "Not an adaptation of the Baopuzi as such; but the immortality cults of the Wei-Jin age and Ge Hong's learning are in it.",
  "非直演《列仙传》；仙传一路之后世演绎，八仙即其流裔。":
    "Not an adaptation of the Biographies of Immortals as such; it is a later growth from that stock, and the Eight Immortals are its descendants.",
  "非直演《列子》；列御寇承老子之说，此集演五千言之成与出关授经。":
    "Not an adaptation of the Liezi as such; Lie Yukou carries on Laozi's teaching, and this episode is about the five thousand characters and the gift at the pass.",
  "非直演《文子》；此书托文子之问而述老子之言，当与此集同观。":
    "Not an adaptation of the Wenzi as such; the book frames Laozi's words as answers to Wenzi's questions, and is best taken together with this episode.",
  "演商鞅变法立木取信、秦法之成，《商君书》所论即此事之理。":
    "Shang Yang's reforms, the pole moved to prove the state's word, and the making of Qin law — the reasoning of which is the Book of Lord Shang.",
  "非直演《申子》；申不害相韩主术治，与剧中商鞅之法治同为法家两路。":
    "Not an adaptation of the Shenzi (Shen Buhai) as such; his rule by method in Han and Shang Yang's rule by law here are the two roads of Legalism.",
  "非直演《慎子》；慎到主势，与法、术并称法家三柄，剧中变法可见其用。":
    "Not an adaptation of the Shenzi (Shen Dao) as such; his \"position\" joins law and method as the three handles of Legalism, and the reforms here show it in use.",
  "非直演《管子》；剧演管仲相齐、尊王攘夷，仓廪实而知礼节之政见于其中。":
    "Not an adaptation of the Guanzi as such; but it stages Guan Zhong as minister of Qi, honouring the king and repelling the tribes, and the policy that full granaries come before manners.",
  "非直演《邓析子》；邓析为郑之讼辩之士，名家之先，剧演其时之郑。":
    "Not an adaptation of the Dengxizi as such; Deng Xi was Zheng's great pleader and the forerunner of the school of names, and this is the Zheng of his day.",
  "非直演《尹文子》；尹文游稷下，形名之辩见于战国诸家争鸣。":
    "Not an adaptation of the Yinwenzi as such; Yin Wen travelled to Jixia, and his disputes on form and name belong to the contention of the Warring States schools.",
  "非直演《公孙龙子》；白马非马之辩属名家，剧演战国百家之争。":
    "Not an adaptation of the Gongsun Longzi as such; \"a white horse is not a horse\" belongs to the school of names, and this dramatises the contention of the hundred schools.",
  "非直演《论衡》；王充疾虚妄之论，见于东汉思想一路。":
    "Not an adaptation of the Balanced Discourses as such; Wang Chong's war on falsehood belongs to the Eastern Han strand of thought shown here.",
  "非直演《淮南子》；剧中淮南王刘安即集此书之人。":
    "Not an adaptation of the Huainanzi as such; but Liu An, King of Huainan, who appears here, is the man who had it compiled.",
  "非直演《五灯会元》；灯录所传禅门机锋，自达摩一苇西来始。":
    "Not an adaptation of the Compendium of Five Lamps as such; the Chan exchanges the lamp records transmit begin with Bodhidharma's crossing on a reed.",
  "非直演《坛经》；禅宗东土之源流，与六祖之说法相承。":
    "Not an adaptation of the Platform Sutra as such; it is the source of Chan in the east, continuous with the Sixth Patriarch's preaching.",
  "非直演此经；《四十二章经》在金庸笔下成藏宝之秘，经名因戏而广传。":
    "Not an adaptation of the sutra as such; in Jin Yong's hands the Sutra in Forty-Two Sections becomes the secret of a buried treasure, and the title travelled far on the strength of the story.",
  "非直演《了凡四训》；袁了凡与王阳明同为明人修身立命之学，此集演知行合一。":
    "Not an adaptation of Liaofan's Four Lessons as such; Yuan Liaofan and Wang Yangming both belong to the Ming art of self-cultivation, and this episode is on the unity of knowing and doing.",
  "非直演《鬼谷子》；苏秦张仪俱称出鬼谷之门，剧演其纵横之术。":
    "Not an adaptation of the Guiguzi as such; Su Qin and Zhang Yi both claimed the Ghost Valley Master as teacher, and this shows their art in use.",
  "演孙膑庞涓斗智、围魏救赵与马陵之战。":
    "Sun Bin against Pang Juan: relieving Zhao by besieging Wei, and the battle of Maling.",
  "以孙膑庞涓之事逐集演三十六计之目。":
    "Episode by episode, the thirty-six stratagems acted out through Sun Bin and Pang Juan.",
  "非直演《吴子》；剧演吴起变法于楚、治军于魏之事。":
    "Not an adaptation of the Wuzi as such; it dramatises Wu Qi reforming Chu and drilling Wei's army.",
  "非直演《司马法》；春秋军礼与田穰苴治军之制见于先秦诸集。":
    "Not an adaptation of the Methods of the Sima as such; the military ritual of the Spring and Autumn age and Tian Rangju's discipline appear in the pre-Qin episodes.",
  "非直演《尉繚子》；尉缭入秦献策，剧中可见其人其时。":
    "Not an adaptation of the Wei Liaozi as such; Wei Liao came to Qin with counsel, and here are the man and his moment.",
  "非直演《三略》；此书旧题黄石公授张良，剧演圯上受书与运筹之事。":
    "Not an adaptation of the Three Strategies as such; the book is traditionally what the Yellow Stone Elder gave Zhang Liang, and this stages the gift on the bridge and the planning that followed.",
  "非直演《六韬》；此书旧托太公望之言，动画演姜子牙之另一面。":
    "Not an adaptation of the Six Secret Teachings as such; the book goes under Taigong Wang's name, and the film gives Jiang Ziya another face.",
  "演宋应星遍访工事、著此「百工之书」。":
    "Song Yingxing going from trade to trade to write his book of the hundred crafts.",
  "演贾思勰察农事稼穑而成此书。":
    "Jia Sixie watching how the fields are worked, and writing it down.",
  "非直演《世说新语》；魏晋风度与名士清谈之世，即此书所记之境。":
    "Not an adaptation of the New Account of Tales of the World as such; but the Wei-Jin manner and the pure conversation of its celebrities are exactly what the book records.",
  "演屈原问天、《离骚》之作与楚声之远。":
    "Qu Yuan's questions to heaven, the writing of Li Sao, and how far the music of Chu carried.",
  "演刘勰依寺著书、论文之枢纽。":
    "Liu Xie writing in the shelter of a monastery, and the pivot on which his criticism turns.",
  "非直演《诗品》；钟嵘《诗品》与刘勰《文心》并称南朝文论双璧，当并观。":
    "Not an adaptation of the Gradings of Poets as such; Zhong Rong's Gradings and Liu Xie's Literary Mind are the twin jades of Southern Dynasties criticism, to be taken together.",
  "演李白高适一生与唐诗之盛，片中所诵多在三百首之内。":
    "The lives of Li Bai and Gao Shi and the great age of Tang poetry; most of what is recited is in the Three Hundred Poems.",
  "非直演《古文观止》；所选《屈原列传》《太史公自序》诸篇皆出《史记》，此集演司马迁成书之艰。":
    "Not an adaptation of Finest of Ancient Prose as such; several of its selections — the Life of Qu Yuan, the Grand Historian's own preface — come from the Records, and this episode is about how hard that book was to write.",
  "非直演《人间词话》；刘勰「论文之枢纽」与王国维「境界」说同为文论之极，当并观。":
    "Not an adaptation of Poetic Remarks in the Human World as such; Liu Xie's pivot of criticism and Wang Guowei's \"realm\" are both high-water marks of the art, to be taken together.",
  "全本剧改，自桃园结义至三分归晋。":
    "The whole novel dramatised, from the oath in the peach garden to the three kingdoms falling to Jin.",
  "剧改，演大观园盛衰与宝黛之悲。":
    "A serial: the rise and ruin of the Grand View Garden, and the sorrow of Baoyu and Daiyu.",
  "剧改，演逼上梁山与招安之败。":
    "A serial: driven to Liangshan, and ruined by the amnesty.",
  "银幕重演商周之变、质子与妖狐之乱。":
    "The fall of Shang and rise of Zhou retold on screen, with the hostage princes and the fox spirit's mischief.",
  "早年剧改，演武王伐纣与诸仙斗法。":
    "An early serial: King Wu's campaign against the tyrant, and immortals matching arts.",
  "据《聊斋·聂小倩》改编，以书生狐鬼演人间之险。":
    "After Nie Xiaoqian from Strange Tales: a scholar among foxes and ghosts, and how dangerous the human world is.",
  "一篇一集，历三年而成，遍演《聊斋》诸篇。":
    "One tale to an episode, three years in the making, working through the whole of Strange Tales.",
  "非直演《山海经》；其神怪名物多采此书与《庄子·逍遥游》。":
    "Not an adaptation of the Classic of Mountains and Seas as such; its creatures and place-names are drawn from that book and from Zhuangzi's Free and Easy Wandering.",
  "非直演《镜花缘》；唐敖海外诸邦之想多出《山海经》，动画亦取其神怪。":
    "Not an adaptation of Flowers in the Mirror as such; Tang Ao's foreign countries come largely from the Classic of Mountains and Seas, and the film draws on the same creatures.",
  "改编《儒林外史》，取范进、匡超人诸举子之事。":
    "After The Scholars, taking up Fan Jin, Kuang Chaoren and the other examination candidates.",
  "二十五集初排，几成一代人「正版」的西游想象。":
    "The first twenty-five-episode staging, and for one generation very nearly the authorised version of the journey.",
  "无厘头解构取经：不肯戴金箍的悟空。":
    "The pilgrimage pulled apart by farce: a Monkey who will not put the headband on.",
  "动画，演大圣法力尽失之后的归来。":
    "Animation: the Great Sage stripped of his powers, and his return.",
  "黑白截本，获奥斯卡最佳影片，为莎剧电影立下一代范式。":
    "A black-and-white abridgement that won Best Picture and set the pattern for filmed Shakespeare for a generation.",
  "第一个一字不删的全本，四小时，场景移至十九世纪宫廷。":
    "The first uncut text, four hours long, moved to a nineteenth-century court.",
  "德国默片，取维宁「哈姆莱特本是女子」之异说，王子生为公主而以男装承嗣。公有领域。":
    "A German silent built on Vining's heterodox claim that Hamlet was a woman: the prince is born a princess and raised in men's clothes to inherit. Public domain.",
  "移至十九世纪末托斯卡纳，自行车与歌剧入戏。":
    "Moved to Tuscany at the end of the nineteenth century, with bicycles and opera written in.",
  "维塔格拉菲一本短片，此剧最早的银幕本。公有领域。":
    "A one-reel Vitagraph short, the earliest screen version of the play. Public domain.",
  "两集电视电影，自特洛伊战后演到还乡认亲。":
    "A two-part television film, from the end of the Trojan war to the homecoming and the recognition.",
  "意大利默片，都灵世博年所摄，荷马史诗已知第三部银幕本。公有领域。":
    "An Italian silent shot in the year of the Turin exposition, the third known screen version of Homer. Public domain.",
  "音乐剧电影，以塞万提斯下狱自辩的戏中戏框住全书。":
    "The musical film, framing the novel as a play staged by Cervantes in prison in his own defence.",
  "丹麦默片，喜剧搭档「灯塔与拖斗」一高一矮正好分演骑士与桑丘。公有领域。":
    "A Danish silent in which the comic duo \"Long and Short\" divide the knight and Sancho between them by height alone. Public domain.",
  "德国默片，以摄影棚内造云造城的表现主义手法摄歌德上部。公有领域。":
    "A German silent that films Goethe's first part in the expressionist manner, with clouds and cities built inside the studio. Public domain.",
  "俄国出品、德语对白，获威尼斯金狮；自歌德与托马斯·曼之间另起一路。":
    "Russian-made and in German, winner of the Golden Lion; it strikes its own path between Goethe and Thomas Mann.",
  "米高梅名作，嘉宝凭此片得影评人奖，后世译本封面多用其剧照。":
    "The MGM version, which won Garbo the critics' prize; later translations have been putting her stills on their covers ever since.",
  "美国默片，以装饰艺术布景把小仲马移入现代巴黎。公有领域。":
    "An American silent that moves Dumas fils into a modern Paris of art deco sets. Public domain.",
  "达尔文传记片；非直演此书，而写《天演论》作者赫胥黎登场的那一侧。":
    "A life of Darwin; not an adaptation of the book, but of the side of the story where Huxley — whom Yan Fu translated — walks on.",
  "据达尔文书信日记演小猎犬号之行；非直演此书，而演此书所辩的进化论如何成形。":
    "The Beagle's voyage, after Darwin's letters and diaries; not an adaptation of the book, but of how the theory it argues took shape.",
  "十四分钟默片，史上第一部科幻片，并取凡尔纳此书与其续篇。公有领域。":
    "Fourteen silent minutes, the first science-fiction film there was, drawing on Verne's novel and its sequel. Public domain.",
  "彩色有声本，循原著从巴比肯造巨炮讲到炮弹升空。":
    "The colour sound version, following the novel from Barbicane's great gun to the launch of the shell.",

  // ── 三十八、可检索的片段与其解 ───────────────────────────────
  // 片段是概述，非剧本原文，故译；其下一行「解」是本作所作的按语，亦译。
  "孔子率弟子周游列国，厄于陈蔡而弦歌不辍。":
    "Confucius and his disciples among the states; cut off between Chen and Cai, the strings and the singing never stop.",
  "银幕演孔子困厄之中仍守其道，仁与礼之笃行。":
    "On screen, a Confucius who keeps to his way in extremity: benevolence and ritual actually practised.",
  "墨者革离独赴梁城，以守代攻抗赵军。":
    "The Mohist Ge Li goes alone to Liang and holds it against the army of Zhao by defence alone.",
  "以一人守一城，银幕化墨家非攻兼爱之旨。":
    "One man holding one city — condemning aggression and impartial care, made filmable.",
  "苏秦约六国合纵以抗秦，佩六国相印。":
    "Su Qin binds six states into a vertical alliance against Qin and wears the seals of all six.",
  "演纵横家合纵之策与游说之术。":
    "The diplomatists' alliance strategy, and the art of talking rulers round.",
  "张仪以连横破合纵，说六国事秦。":
    "Zhang Yi breaks the alliance by horizontal union, persuading the six states to serve Qin.",
  "银幕演连横之策瓦解合纵之局。":
    "The screen version of how horizontal union took the alliance apart.",
  "吕不韦识异人为奇货可居，倾家扶其为秦王。":
    "Lü Buwei sees in the hostage prince goods worth hoarding, and spends his fortune making him king of Qin.",
  "演商而入政、以谋取国的杂家手段。":
    "The eclectic's method: from trade into politics, and a state taken by calculation.",
  "韩非入秦，李斯忌其才，终遭囚杀。":
    "Han Fei comes to Qin; Li Si, envying his gifts, has him imprisoned and killed.",
  "演法家集大成者入秦不得其用。":
    "The man who gathered Legalism into one system, in the one state that would not use him.",
  "青年韩非以法家之术与流沙组织谋断韩国之局。":
    "The young Han Fei and the Liusha society, playing Legalist method against the deadlock of Han.",
  "动画演韩非早年谋断与法家思想之萌。":
    "Han Fei's early schemes, and Legalist thought in the bud.",
  "孙武以宫女练兵，斩吴王二宠姬以明军法。":
    "Sun Wu drills the palace women and beheads two of the king's favourites to make military law plain.",
  "演兵家之严与法之不阿贵。":
    "The severity of the military art, and a law that bends to no one of rank.",
  "西伯侯姬昌被囚羑里，演八卦而通天命。":
    "The Earl of the West imprisoned at Youli, working the trigrams until destiny opens to him.",
  "银幕演文王演《周易》之渊源。":
    "The screen version of where King Wen's Book of Changes comes from.",
  "老子骑青牛出函谷关，应关令尹喜留五千言。":
    "Laozi rides his green ox out through Hangu Pass and, at the keeper Yin Xi's request, leaves five thousand characters behind.",
  "演《道德经》成书之传说。": "The legend of how the Daodejing came to be written.",
  "以漫画解庄子逍遥游，化玄奥为童趣。":
    "Zhuangzi's free wandering read through comics, the abstruse turned into child's play.",
  "动画演逍遥无待、齐物是非之旨。":
    "Wandering free of all dependence, and the levelling of this and that.",
  "墨家机关城藏天下反秦之士，以非攻兼爱为旨。":
    "The Mohists' mechanical city shelters everyone who resists Qin, in the name of condemning aggression and impartial care.",
  "动画群像演诸子百家与暴秦之抗。":
    "An animated ensemble: the hundred schools against the tyranny of Qin.",
  "舞台演孔门师弟之情与《论语》成书传世。":
    "The bond between master and disciples on stage, and how the Analects were made and handed on.",
  "以演剧述《论语》之成与孔门之教。":
    "A drama about the making of the Analects and the teaching of the Confucian school.",
  "述《尚书》之传与护书之艰。":
    "How the Book of Documents was handed down, and at what cost it was kept.",
  "演孙武著十三篇与柏举之战破楚入郢。":
    "Sun Wu writing the thirteen chapters, and the battle of Boju that broke Chu and took Ying.",
  "述《孙子兵法》成书与其用兵之验。":
    "The making of the Art of War, and the proof of it in the field.",
  "白骨夫人三变，悟空三打，唐僧贬书逐行者。":
    "The White Bone Demon changes shape three times, Wukong strikes three times, and Tripitaka writes him out of the company.",
  "八六版立「正版」西游想象的一折：妖该打，而肉眼难辨。":
    "The episode on which the 1986 version founded the authorised imagining: the demon deserves the blow, and mortal eyes cannot tell.",
  "女儿国王愿以一国之富换御弟留下，唐僧不为所动。":
    "The queen of the Women's Kingdom offers a whole realm if the monk will stay; he is not moved.",
  "八六版添演的情关，成了后世反复重写的一幕。":
    "The trial of love the 1986 version added, rewritten again and again since.",
  "至尊宝临戴上金箍，说出「曾经有一份真挚的爱情」。":
    "Joker, about to put on the golden band, says there was once a love set before him.",
  "无厘头解构取经：先失了所爱的，才肯去戴金箍。":
    "The pilgrimage pulled apart by farce: only after losing what he loved will he wear the band.",
  "法力尽失的悟空被江流儿唤醒，重披战甲破山而出。":
    "Wukong, stripped of his powers, is woken by the boy Jiangliu, takes up his armour again and breaks out of the mountain.",
  "动画演大圣之落魄与归来——「齐天」是心气，不是法力。":
    "The Great Sage brought low and come back — \"equal to heaven\" is a temper, not a power.",
  "哈姆莱特于城垣独语「生存还是毁灭」。":
    "Hamlet on the battlements: to be, or not to be.",
  "奥利弗以特写摄独白，把文艺复兴之疑都收进这张脸。":
    "Olivier shoots the soliloquy in close-up and gathers the whole doubt of the Renaissance into one face.",
  "王子独坐窗边，窗外同窗笑语，无人知其身世。":
    "The prince sits alone at the window while fellow students laugh outside, none of them knowing what she is.",
  "默片无台词可倚，尼尔森把犹豫全交给一个不肯转过来的侧脸。":
    "With no lines to lean on, Nielsen gives the whole hesitation to a profile that will not turn.",
  "花汁点错眼：仙后醒来，拥着驴头的织工。":
    "The juice goes in the wrong eyes: the fairy queen wakes with a weaver in her arms, and an ass's head on him.",
  "霍夫曼演魔法之谬——错爱一夜，天明各归其位。":
    "Hoffman plays the magic as error: one night of loving amiss, and by morning everyone is back where they belong.",
  "林中仙后醒转，怀里是被变了驴头的织工波顿。":
    "In the wood the fairy queen wakes to find Bottom the weaver, ass-headed, in her arms.",
  "一本胶片演完五幕，变驴头只靠一次停机再拍——魔法最初就是这么变的。":
    "Five acts in one reel, and the ass's head done with a single stop and restart of the camera — this is how screen magic began.",
  "奥德修斯自缚于桅杆，听塞壬之歌而不溺。":
    "Odysseus has himself bound to the mast and hears the sirens without drowning for it.",
  "银幕演智者的自缚：要听歌，先求缚。":
    "The clever man's self-binding, put on screen: to hear the song, first ask for the rope.",
  "洞中巨人酣睡，众人持削尖木桩刺其独目。":
    "The giant asleep in his cave, and the sharpened stake going into his one eye.",
  "巨人是叠印出来的——史诗第一次被量出了尺寸，怪物也就第一次可以被算计。":
    "The giant is a double exposure — the first time the epic was given measurable size, and so the first time the monster could be out-calculated.",
  "堂吉诃德挺枪冲向风车，被扇上天空跌落马下。":
    "Don Quixote couches his lance at the windmill, is lifted by the sail and comes down off his horse.",
  "荒唐与庄严同在一杆枪上：他输得彻底，却没输掉那个念头。":
    "Absurdity and grandeur on one lance: he loses utterly, and does not lose the idea.",
  "乡绅读骑士小说入了迷，披甲上马，出门行侠。":
    "A country gentleman reads himself out of his senses on romances, puts on armour and rides out to right wrongs.",
  "由喜剧搭档来演，先笑他一高一矮不成个样子，笑过才发觉他是真信。":
    "Played by a comic double act, so you laugh first at the tall and the short of it — and only afterwards notice that he means it.",
  "浮士德骑魔毯夜行，俯瞰人间的瘟疫与祈祷。":
    "Faust rides the night on a magic cloak, looking down on plague and prayer.",
  "换得一瞬青春，便要赔上永世——这一程飞行，是赌约先付的利息。":
    "A moment of youth against an eternity: this flight is the interest paid in advance on the wager.",
  "玛格丽特受人之托强颜逐爱，转身向空椅垂泪。":
    "Marguerite, asked to do it, drives her love away with a smile, then turns to the empty chair and weeps.",
  "把爱推开的人，背过身才敢哭——此后的玛格丽特多照这个背影演。":
    "The one who pushes love away only dares cry with her back turned — every Marguerite since has played that back.",
  "赌场重逢，阿尔芒当众羞辱玛格丽特。":
    "They meet again at the gaming tables, and Armand humiliates her in front of everyone.",
  "误解最伤人处在于：她不能辩，一辩便坏了先前替他做的那个决定。":
    "What makes the misunderstanding unbearable is that she cannot explain: explaining would undo the decision she made for his sake.",
  "赫胥黎向达尔文自请为斗犬：先生，您已杀了上帝。":
    "Huxley offers himself to Darwin as his bulldog: sir, you have killed God.",
  "学说要立得住，身前先得有人肯咬——严复所译的，正是这条斗犬的文章。":
    "A doctrine stands only if someone will bite for it — and it was this bulldog's essays that Yan Fu translated.",
  "炮弹载人射向月球，月脸被火箭正中一击。":
    "A manned shell is fired at the moon, and the moon's face takes it full in the eye.",
  "炮弹不转弯也不减速，直直戳进月亮的眼睛——离开地球这件事，最初是当笑话演的。":
    "The shell neither turns nor slows; it goes straight into the eye — leaving the earth was first played for a laugh.",
  // ── 历史大事件（纪时记事）───────────────────────────────────
  //
  // 两轴各纪其历，译法上有一处要紧：农历月**不**译作 October 之类。农历十月与
  // 公历十月差着约一个月，译成月名便把两种历混成一种，而这一层整个的意思正在
  // 「两种历不是一回事」。故农历作 "Lunar 10"（见 chronicle.ts 的
  // LUNAR_MONTHS_EN），公历仍作 October。干支不作罗马注音：界面上它是与史书对得
  // 上的那个记号，注了音反而对不上书。
  "历史上的今天": "On This Day in History",
  "史上这一日": "This Day in History",
  "{gz}日": "{gz} day",
  "农历{mon}{day}{gz}": "{mon} {day}, {gz} day",
  "农历{mon}{gz}": "{mon}, {gz} day",
  "闰{mon}": "leap {mon}",
  "历史上的今天 · 四库与西方书里自带日期的记事。干支日六十日一轮、自殷商未断，故今日之干支与史上同一干支日是同一格。":
    "On this day in history — dated records found in the Four Treasuries and in the Western books. The sexagenary day-cycle has run unbroken since the Shang, so today's day-sign names the very same slot in that sequence as it did in the histories.",
  "历史上的今天 · 四库与西方书里自带日期的记事。中土一侧按农历同月相认，同月之中再取同日号（五月初三日）或同干支（癸酉）者。":
    "On this day in history — dated records found in the Four Treasuries and in the Western books. The Chinese side matches first on the lunar month, and then within that month on either the same day number (the 3rd of the 5th month) or the same sexagenary day-sign (gui-you).",
  "正在翻检史上这一日……": "Looking up this day in history…",
  "点此查日期、人名、事由": "Search by date, person, or event",
  "正在推算今日……": "Reckoning today…",
  "{m}月{d}日 · {gz}日": "{m}/{d} · {gz} day",
  "{m}月{d}日 · 农历{lunar}{gz}": "{m}/{d} · {lunar}, {gz} day",
  "月令 · 典籍里的这一月": "The month · what the books record",
  "检索 · 纪时记事": "Search · dated records",
  "← 回今日": "← Back to today",
  "点开原书此章": "Open this chapter in the source book",
  "又见": "Also in ",
  "三传、史书同记一事，并作一条": "The same event as recorded in other books — merged into one card",
  "闰": "leap",
  "{d}日": "{d}",
  "西方书": "Western books",
  "史上{gz}日之事": "What happened on {gz} days",
  "史上农历{mon}{day}·{gz}日之事": "What happened in {mon} on day {day}, {gz} days",
  "史上农历{mon}·{gz}日之事": "What happened in {mon}, on {gz} days",
  "农历{m}": "lunar month {m}",
  "公历{m}": "{m} (Gregorian)",
  "公历{m}月{d}日前后": "around {m}/{d}, Gregorian",
  "合于所问者": "matching your query",
  " · 共{n}条": " · {n} in all",
  "正在翻检……": "Searching…",
  "正在取全库一万七千余条……": "Fetching all 17,000-odd records…",
  "此日四库未记事。": "No Four Treasuries record falls on this day.",
  "八部西书里，这一月没有写明日期的记事。": "None of the eight Western books dates a passage to this month.",
  "四库里没有合于所问的记事。": "No Four Treasuries record matches your query.",
  "八部西书里没有合于所问的记事。": "No record in the eight Western books matches your query.",
  "十二月令": "The twelve months",
  "今日": "Today",
  "{lunar} / {solar}：四库{a}条、西书{b}条": "{lunar} / {solar}: {a} from the Four Treasuries, {b} from the Western books",
  "取纪时记事不得：": "Could not load the dated records: ",
  "共{n}条自带日期的记事（四库{a} · 西书{b}），抽自{k}部书，皆可点回原章。":
    "{n} self-dated records in all ({a} from the Four Treasuries, {b} from the Western books), drawn from {k} books. Every one opens its own chapter.",
  " 西书一侧条数少且多出《月界旅行》——八部书里只有凡尔纳与小仲马勤记日期，此为语料实情，非抽取遗漏。":
    " The Western side is thin and leans on From the Earth to the Moon: of the eight books, only Verne and Dumas fils date things consistently. That is the corpus, not a gap in the extraction.",
  "左栏四库为农历月，右栏西书为公历月——农历十月并非公历十月，相差约一月。两栏各标其历，不作换算。":
    "Left column: lunar months, from the Four Treasuries. Right column: Gregorian months, from the Western books. The tenth lunar month is not October \u2014 they run about a month apart. Each column is labelled with its own calendar; no conversion is offered.",
  "同一问之于两轴未必都问得通：四库纪年用年号而无公元年，西书注公元而与干支无涉；月各依本历（四库农历、西书公历），日号两轴皆有。各栏按本轴办得到的条件筛，办不到的注在栏下。字面检的是原文——四库为文言汉字，西书原书为英文、中译卷为中文。近现代两栏纪公历年月日，年月日与字面皆可检，干支问不通。":
    "One question does not always make sense on every axis: the Four Treasuries reckon by reign-title and carry no Common-Era year, while the Western books give era years and no day-sign; each column keeps its own calendar (lunar for the Four Treasuries, Gregorian for the Western books), and both carry day-numbers. Each column filters by what it can answer and notes below what it could not. Word search runs against the original text \u2014 classical Chinese for the Four Treasuries; English (or the Chinese translation) for the Western books. The two modern columns carry Gregorian year, month and day: year, month, day and words all work there; a day-sign does not.",
  // 近现代一轴（公历两栏）：此轴无书可点，只放事由与一段描写，另给维基出处
  "近现代 · 中土": "Modern · China",
  "近现代 · 西方": "Modern · The West",
  "看维基此条": "Open this entry on Wikipedia",
  "维基 · {q}": "Wikipedia · {q}",
  "两页并列": "both editions",
  "中英两种日页都列着这一件": "Listed on both the Chinese and the English day-page",
  "公历{m}月{d}日 · {y}年以来": "{m}/{d} Gregorian · from {y} on",
  "公历{m} · {y}年以来": "{m} (Gregorian) · from {y} on",
  "此处尚未铺上近现代一轴的语料。": "The modern axis has not been laid in here yet.",
  "这一日此栏无事可报——两源对不上的一概弃去，故逐日有疏。":
    "Nothing to report in this column for this day. Anything the two sources did not agree on was dropped, so some days come up empty.",
  "这一月此栏无事可报。": "Nothing to report in this column for this month.",
  "近现代一轴里没有合于所问的事。此轴只纪公历年月日，向它问干支问不通。":
    "Nothing on the modern axis matches your query. This axis records only Gregorian dates, so asking it for a sexagenary day-sign does not apply.",
  "问此事": "Ask of this event",
  "历史事件评议": "Historical event readings",
  "← 返回历史大事件": "← Back to historical events",
  "事实与出处": "Facts and sources",
  "事件中的问题": "Question in the event",
  "正在生成相关问题……": "Generating related questions…",
  "写下自己的问题": "Write your own question",
  "使用此问题": "Use this question",
  "请他评议": "Invite a reading",
  "直接点一位人物，他会以自己的世界、文本与处境评议此事。": "Select any character for a reading through their own world, texts, and situation.",
  "一人发问": "One reader asks",
  "让一位人物从自己的立场提出问题，交给另一位回答。": "Let one character ask from their own position, then give the question to another to answer.",
  "发问者": "Questioner",
  "回答者": "Responder",
  "发问": "asks",
  "请他发问": "Have them ask",
  "两人讨论": "Two readers discuss",
  "让两位人物围绕同一事件互相回应，各自保留自己的世界立场。": "Let two characters respond around the same event while each keeps their own world position.",
  "先说者": "First speaker",
  "回应者": "Responding speaker",
  "开始讨论": "Begin discussion",
  "评议记录": "Reading record",
  "从上方三种方式中任选一种开始。": "Choose any of the three approaches above to begin.",
  "提问": "question",
  "讨论": "discussion",
  "英文原话": "English original",
  "事件席": "Event table",
  "事件席 · 后设评议": "Event table · retrospective readings",
  "收起事件席": "Close the event table",
  "先看事实": "Start with the record",
  "近现代事件：日期由两源对签，评议不代替史实。": "Modern event: its date is cross-checked by two sources; interpretation does not replace historical fact.",
  "原始记载：{book}{chapter}。": "Source record: {book}, {chapter}.",
  "原始记载：{book} {chapter}。": "Source record: {book}, {chapter}.",
  "查看外部出处": "View external source",
  "此事留下了什么问题？": "What question does this event leave us?",
  "当旧秩序不能回应新处境时，改变应走多快？": "When an old order cannot meet a new situation, how quickly should change proceed?",
  "明知可能失败，是否仍值得行动？": "Is action still worthwhile when failure is likely?",
  "个人应为共同体承担多大的代价？": "How much cost should an individual bear for a community?",
  "或写下自己的问题": "Or write your own question",
  "自拟问题": "Your own question",
  "请谁来谈？": "Whom shall we invite?",
  "他们只解释事件中的处境，不作为此事的亲历者陈述史实。": "They interpret the situation in the event; they do not present themselves as its witnesses or state its facts.",
  "所有人物都可请入席；他们只解释事件中的处境，不作为此事的亲历者陈述史实。":
    "Every character may be invited. They interpret the situation in the event; they do not present themselves as its witnesses or state its facts.",
  "又见：{v}": "Also recorded in: {v}",
  "选择二至三人后开席；每段评议将附其世界中的依据。": "Choose two or three voices to convene; each reading will cite evidence from its own world.",
  "开席": "Convene",
  "已选{n}位评议者。下一步会先给出各自对这一冲突的短评，再由你指定谁回应谁；每条评议只以其世界内的文本作依据。":
    "{n} readers selected. The next step will give each a short reading of the conflict, after which you choose who responds to whom; each reading draws only on texts within its own world.",
  "改问题或人选": "Change question or voices",
  "评议生成将在下一步接入": "Generated readings connect in the next step",
  "英文原话 · 后设评议": "English original · retrospective reading",
  "后设评议": "retrospective reading",
  "依据：": "Evidence: ",
  "正在请{n}回应……": "Inviting {n} to respond…",
  "向一人追问": "Ask one reader",
  "就此事继续发问": "Ask a further question about this event",
  "问他": "Ask",
  "请两人相看": "Invite two readers to respond",
  "回应": "responds to",
  "请他回应": "Invite response",
  "再请一人": "Invite another reader",
  "选择人物": "Choose a character",
  "请入席": "Invite",
  "同世界人物可讨论；跨世界人物只并置和回应，不裁定胜负。":
    "Readers from one world may debate; readers across worlds are set beside and respond to one another, without a verdict of victory.",
  "近现代一轴另{n}条（中土{a} · 西方{b}），皆公历，出自维基「历史上的今天」逐日条目与 Wikidata 日期声明两源对签；文本依 CC BY-SA 4.0，日期依 CC0。":
    "A further {n} entries on the modern axis ({a} China, {b} the West), all Gregorian, cross-checked between Wikipedia's On-This-Day day-pages and Wikidata date statements. Text under CC BY-SA 4.0; dates under CC0.",
  " 九五九年至{a}年之间，四库抽不到（无书）、近现代又未收（起点在后），此层无事可报——这一段是空的，不作假。":
    " Between 959 and {a} this layer has nothing: the Four Treasuries corpus ends there, and the modern axis starts later. That stretch is empty, and it is left empty.",
  // 检索
  "检日期、人名、地名、事由——如「十月二十五日 曹操」": "Search a date, person, place, or event \u2014 e.g. \u201cOctober 20\u201d or \u201c\u66f9\u64cd\u201d",
  "检索纪时记事": "Search the dated records",
  "检": "Find",
  "翻检中…": "Searching…",
  "已解作：": "Read as: ",
  "这一句里没解出日期，也没剩下可检的字面。": "No date was found in that, and no searchable words were left either.",
  "干支日{v}": "day-sign {v}",
  "月{v}": "month {v}",
  "日号{v}": "day {v}",
  "字面「{v}」": "words \u201c{v}\u201d",
  "干支（西书不纪干支）": "the day-sign (the Western books do not use one)",
  "公元年（西书未注年份）": "the era year (the Western books give none)",
  "此栏未按{v}筛。": "This column was not filtered by {v}.",
  "这一问在此轴上不成立：所问惟{v}。": "The question does not apply on this axis: all you asked for was {v}.",
  // 四部纪事之书（此层列书名处用得上；长尾未收者仍出中文原名）
  "资治通鉴": "Comprehensive Mirror in Aid of Governance",
  "后汉书": "Book of the Later Han",
  "春秋左传": "Zuo Commentary on the Spring and Autumn Annals",
  "三国志 裴松之注": "Records of the Three Kingdoms, with Pei Songzhi's commentary",
  "春秋公羊传": "Gongyang Commentary on the Spring and Autumn Annals",
  "春秋谷梁传": "Guliang Commentary on the Spring and Autumn Annals",
  "朱子语类": "Classified Conversations of Master Zhu",
  "五灯会元": "Compendium of the Five Lamps",
  "淮南子": "Huainanzi",
  "论衡": "Discourses Weighed in the Balance",
  "镜花缘": "Flowers in the Mirror",
  "聊斋志异": "Strange Tales from a Chinese Studio",
  "儒林外史": "The Scholars",
  "齐民要术": "Essential Techniques for the Common People",
  "抱朴子内篇": "Baopuzi, Inner Chapters",
  "礼记": "Book of Rites",
  // World Literature: chapter translation and historical editions
  "总目明证": "Catalog evidence",
  "题名可证": "Title verified",
  "目录未载入——四库或西方典籍目录尚未生成或未随构建上传。": "The catalog could not be loaded. The Chinese or Western catalog may be missing from this build.",
  "文本来源": "Text source",
  "许可说明": "Rights information",
  // Cultural geography: controls and explanatory text
  "时空文脉": "Cultural geography",
  "朝代地点 · 时空文脉": "Places through time · cultural geography",
  "地点 · 人物 · 典籍 · 思想": "Places · people · texts · ideas",
  "时空文脉地图": "Map of cultural geography",
  "时间进入空间，文脉落于山河": "Tracing textual lineages across time and place",
  "全量接入人物、典籍及其地点证据；缩略时聚合，点选后展开具体条目": "All figures, texts, and location evidence; zoomed views aggregate records, while selection reveals individual entries.",
  "地点": "Places",
  "选择朝代": "Select a period",
  "思想路径": "Paths of ideas",
  "史料地点": "historical places",
  "中西典籍": "Chinese and Western texts",
  "历代人物总目": "Historical figure directory",
  "中国细看": "China detail",
  "世界总览": "World overview",
  "按当前朝代筛选": "Filtered by the selected period",
  "著述目录待补": "Works not yet indexed",
  "正文可读": "Full text available",
  "可读正文": "Readable full text",
  "目录著录": "Catalogue record",
  "部可读": " readable",
  "部著录": " catalogued",
  "打开正文": "Open full text",
  "当前筛选下没有条目": "No records in the current filter",
  "西方代表性典籍 · 来源地聚合": "Representative Western texts · grouped by cultural origin",
  "来源地表示文化归属，不等于唯一成书坐标": "Origin indicates cultural affiliation, not a single composition coordinate",
  "地图索引暂未载入，请稍后重试。": "The map index could not be loaded. Please try again shortly.",
  "中国人物与典籍地理分布图": "Geographic distribution of Chinese figures and texts",
  "人": " figures",
  "书": " texts",
  "部": " texts",
  "地点：CBDB索引地址 · 坐标：CHGIS · 底图：Natural Earth": "Places: CBDB index addresses · coordinates: CHGIS · base map: Natural Earth",
  "地点证据：CBDB／CHGIS／史地记录／Wikidata · 底图：Natural Earth": "Place evidence: CBDB / CHGIS / curated records / Wikidata · base map: Natural Earth",
  "中西典籍世界来源图": "World origins of Chinese and Western texts",
  "中国典籍": "Chinese texts",
  "世界总览按文化来源地聚合；多来源典籍取组合节点，不推定单一成书坐标": "The world view groups texts by cultural origin; multi-origin works use combined nodes rather than an assumed single coordinate.",
  "地点待考": "Location pending",
  "尚无可靠坐标，保留在全量索引中": "Retained in the full index until reliable coordinates are available",
  "总览显示聚合数量；点地点展开人物与典籍。没有可靠位置的条目保留在“地点待考”，不虚构坐标。": "The overview shows aggregate counts. Select a place to inspect figures and texts; records without reliable coordinates remain under Location pending.",
  "全量索引 · CBDB／CHGIS／典籍目录": "Full index · CBDB / CHGIS / text catalogues",
  "中国历代人物 · 著述索引": "Historical Chinese figures · works index",
  "人物目录暂未载入，请稍后重试。": "The figure directory could not be loaded. Please try again shortly.",
  "共 {n} 位人物；有年代的可按时代检索，年代未详者保留在总目中。": "{n} figures in total. Dated records can be searched by period; undated records remain in the directory.",
  "搜索人名、朝代或著述": "Search names, periods, or works",
  "匹配 {n} 位 · 显示前 100 位": "{n} matches · showing the first 100",
  "人物—典籍—地点关联": "Figure–text–place connections",
  "CBDB索引地址 · CHGIS坐标": "CBDB index address · CHGIS coordinates",
  "CBDB索引地址": "CBDB index address",
  "核心策展史料场景": "Curated historical scenario",
  "策展关联": "Curated connection",
  "撰著者索引地": "Author's indexed place",
  "相关人物索引地": "Associated figure's indexed place",
  "版本刊刻地": "Edition publication place",
  "史地活动关联地": "Documented cultural-activity place",
  "成书地": "Place of composition",
  "版本出版地": "Edition publication place",
  "作者出生地": "Author's birthplace",
  "作者居住地": "Author's place of residence",
  "作者活动地": "Author's place of activity",
  "题名变体人物关联地": "Associated figure from a verified title variant",
  "规范实体关联地": "Authority-record place",
  "年代未详": "Date unknown",
  // Western map: origins, categories, titles, and authors
  "美索不达米亚": "Mesopotamia", "古代以色列": "Ancient Israel", "希腊化世界": "Hellenistic world",
  "罗马": "Rome", "地中海世界": "Mediterranean world", "北非／罗马": "North Africa / Rome",
  "意大利": "Italy", "英格兰": "England", "尼德兰": "Low Countries", "波兰": "Poland",
  "爱尔兰": "Ireland",
  "德国／英国": "Germany / United Kingdom", "美国": "United States", "俄国": "Russia",
  "英国／中国": "United Kingdom / China", "奥地利": "Austria", "英国／美国": "United Kingdom / United States",
  "史诗": "Epic", "文学": "Literature", "哲学": "Philosophy", "史学": "History",
  "宗教": "Religion", "政治": "Political thought", "科学": "Science", "社会": "Society",
  "吉尔伽美什史诗": "Epic of Gilgamesh", "希伯来圣经": "Hebrew Bible", "伊利亚特": "Iliad",
  "神谱": "Theogony", "历史": "Histories", "俄瑞斯忒亚": "Oresteia", "俄狄浦斯王": "Oedipus Rex",
  "伯罗奔尼撒战争史": "History of the Peloponnesian War", "理想国": "Republic", "会饮篇": "Symposium",
  "政治学": "Politics", "尼各马可伦理学": "Nicomachean Ethics", "诗学": "Poetics", "几何原本": "Elements",
  "埃涅阿斯纪": "Aeneid", "变形记": "Metamorphoses", "新约": "New Testament", "沉思录": "Meditations",
  "忏悔录": "Confessions", "上帝之城": "The City of God", "哲学的慰藉": "The Consolation of Philosophy",
  "贝奥武夫": "Beowulf", "罗兰之歌": "The Song of Roland", "神学大全": "Summa Theologiae",
  "神曲": "The Divine Comedy", "十日谈": "The Decameron", "坎特伯雷故事集": "The Canterbury Tales",
  "君主论": "The Prince", "愚人颂": "In Praise of Folly", "天体运行论": "On the Revolutions of the Heavenly Spheres",
  "随笔集": "Essays", "关于两大世界体系的对话": "Dialogue Concerning the Two Chief World Systems",
  "方法论": "Discourse on the Method", "新工具": "Novum Organum", "利维坦": "Leviathan",
  "伦理学": "Ethics", "失乐园": "Paradise Lost", "自然哲学的数学原理": "Mathematical Principles of Natural Philosophy",
  "政府论（下篇）": "Second Treatise of Government", "格列佛游记": "Gulliver's Travels",
  "论法的精神": "The Spirit of the Laws", "老实人": "Candide", "社会契约论": "The Social Contract",
  "国富论": "The Wealth of Nations", "罗马帝国衰亡史": "The History of the Decline and Fall of the Roman Empire",
  "纯粹理性批判": "Critique of Pure Reason", "女权辩护": "A Vindication of the Rights of Woman",
  "精神现象学": "The Phenomenology of Spirit", "弗兰肯斯坦": "Frankenstein",
  "论美国的民主": "Democracy in America", "共产党宣言": "The Communist Manifesto", "白鲸": "Moby-Dick",
  "物种起源": "On the Origin of Species", "论自由": "On Liberty", "罪与罚": "Crime and Punishment",
  "资本论": "Capital", "战争与和平": "War and Peace", "查拉图斯特拉如是说": "Thus Spoke Zarathustra",
  "梦的解析": "The Interpretation of Dreams", "新教伦理与资本主义精神": "The Protestant Ethic and the Spirit of Capitalism",
  "相对论：狭义与广义理论": "Relativity: The Special and the General Theory", "尤利西斯": "Ulysses",
  "荒原": "The Waste Land", "审判": "The Trial", "一间自己的房间": "A Room of One's Own",
  "美丽新世界": "Brave New World", "存在与时间": "Being and Time", "第二性": "The Second Sex", "一九八四": "Nineteen Eighty-Four",
  "多位作者": "Multiple authors", "赫西俄德": "Hesiod", "希罗多德": "Herodotus", "埃斯库罗斯": "Aeschylus",
  "索福克勒斯": "Sophocles", "修昔底德": "Thucydides", "欧几里得": "Euclid", "维吉尔": "Virgil",
  "奥维德": "Ovid", "马可·奥勒留": "Marcus Aurelius", "波爱修斯": "Boethius",
  "托马斯·阿奎那": "Thomas Aquinas", "薄伽丘": "Giovanni Boccaccio", "乔叟": "Geoffrey Chaucer",
  "托马斯·莫尔": "Thomas More", "伊拉斯谟": "Erasmus", "哥白尼": "Nicolaus Copernicus",
  "蒙田": "Michel de Montaigne", "伽利略": "Galileo Galilei", "笛卡尔": "René Descartes",
  "约翰·弥尔顿": "John Milton", "斯宾诺莎": "Baruch Spinoza", "牛顿": "Isaac Newton",
  "亚当·斯密": "Adam Smith", "吉本": "Edward Gibbon", "玛丽·沃斯通克拉夫特": "Mary Wollstonecraft",
  "玛丽·雪莱": "Mary Shelley", "托克维尔": "Alexis de Tocqueville", "马克思、恩格斯": "Karl Marx and Friedrich Engels",
  "赫尔曼·梅尔维尔": "Herman Melville", "达尔文": "Charles Darwin", "约翰·斯图亚特·密尔": "John Stuart Mill",
  "陀思妥耶夫斯基": "Fyodor Dostoevsky", "赫胥黎／严复译": "T. H. Huxley / trans. Yan Fu",
  "马克斯·韦伯": "Max Weber", "爱因斯坦": "Albert Einstein", "海德格尔": "Martin Heidegger",
  "西蒙娜·德·波伏瓦": "Simone de Beauvoir", "乔治·奥威尔": "George Orwell", "孟德斯鸠": "Montesquieu",
  "伏尔泰": "Voltaire", "培根": "Francis Bacon", "弗吉尼亚·伍尔夫": "Virginia Woolf", "斯威夫特": "Jonathan Swift",
  "詹姆斯·乔伊斯": "James Joyce", "黑格尔": "G. W. F. Hegel", "卡夫卡": "Franz Kafka", "T. S. 艾略特": "T. S. Eliot",
  "中国文化地点与思想传播路径示意地图": "Schematic map of Chinese cultural sites and the movement of ideas",
  "一地多时 · 按文化活动分层": "One place across eras · organized by cultural activity",
  "读图方法": "How to read the map",
  "先选朝代看文化重心，再点地点读人物、典籍与思想；打开路径可追踪传承、迁徙、刊刻与中西转译。": "Select a period to see its cultural centers. Open a place to explore people, texts, and ideas; show paths to trace transmission, migration, printing, and translation.",
  "原型数据 · 后续对齐 CHGIS／CBDB 与逐条史料证据": "Prototype data · historical coordinates and source evidence to be aligned with CHGIS and CBDB",
  "历史地点示意 · 非现代行政边界": "Historical sites, shown schematically · not present-day administrative boundaries",
  "黄河": "Yellow River", "长江": "Yangtze River", "北": "N", "南": "S",
  "传承": "Intellectual inheritance", "迁徙": "Migration", "刊刻传播": "Print circulation", "中西转译": "Cross-cultural translation",
  "讲学之地": "Teaching site", "著述之地": "Writing site", "编纂中心": "Compilation center", "流通节点": "Circulation hub", "思想论争": "Intellectual debate",
  "从先秦到近现代，观察文化重心、书籍流通与思想路径如何移动": "From pre-Qin times to the modern era, follow shifts in cultural centers, book circulation, and intellectual exchange.",
  "诸子游说与地域文化并起：齐鲁儒学、河洛道家与楚地文学": "Traveling philosophers and regional cultures emerged together: Confucianism in Qi and Lu, Daoism around the Yellow River, and Chu literature.",
  "帝国都城汇聚经学、史学与国家典藏，地方知识进入统一叙事": "Imperial capitals brought together classical scholarship, history, and state collections, drawing regional knowledge into a shared narrative.",
  "衣冠南渡重塑文化空间，玄学、文学与士族交游转向江南": "Southward migration reshaped cultural space as philosophy, literature, and elite networks moved to Jiangnan.",
  "长安连接丝路译场、科举文教与文人迁徙，形成跨区域知识枢纽": "Chang'an linked Silk Road translation centers, examinations, and scholars on the move into a regional knowledge hub.",
  "文化重心随南渡南移，书院讲学与雕版印刷扩大理学传播": "The cultural center shifted south; academies and woodblock printing broadened the spread of Neo-Confucian thought.",
  "都城编纂、江南出版、地方讲会与口岸翻译共同构成多中心网络": "Court compilations, Jiangnan publishing, local lectures, and treaty-port translation formed a network with several centers.",
  "大学、报刊、出版和跨国港口把思想转化为公共议题与社会行动": "Universities, newspapers, publishers, and international ports turned ideas into public debates and social action.",
  "曲阜": "Qufu", "邹城": "Zoucheng", "洛阳": "Luoyang", "西安": "Xi'an", "敦煌": "Dunhuang", "成都": "Chengdu", "开封": "Kaifeng", "南京": "Nanjing", "绍兴": "Shaoxing", "杭州": "Hangzhou", "武夷山": "Wuyi Mountains", "北京": "Beijing", "上海": "Shanghai", "长沙": "Changsha", "广州": "Guangzhou", "贵阳": "Guiyang",
  "鲁": "Lu", "邹": "Zou", "雒邑／洛京": "Luoyi / Luojing", "长安": "Chang'an", "沙州": "Shazhou", "益州": "Yizhou", "汴京": "Bianjing", "建康／金陵": "Jiankang / Jinling", "会稽": "Kuaiji", "临安": "Lin'an", "建阳／崇安": "Jianyang / Chong'an", "大都／京师": "Dadu / Capital", "沪上": "Shanghai", "潭州": "Tanzhou", "番禺": "Panyu", "龙场": "Longchang",
  "前6—前5世纪": "6th–5th centuries BCE", "前4—前3世纪": "4th–3rd centuries BCE", "约前6世纪": "c. 6th century BCE", "前2世纪": "2nd century BCE", "前2—1世纪": "2nd–1st centuries BCE", "前3世纪": "3rd century BCE", "1—2世纪": "1st–2nd centuries CE", "4世纪": "4th century CE", "4—6世纪": "4th–6th centuries CE", "7—9世纪": "7th–9th centuries CE", "7—10世纪": "7th–10th centuries CE", "8—9世纪": "8th–9th centuries CE", "10—12世纪": "10th–12th centuries CE", "11世纪": "11th century CE", "12—13世纪": "12th–13th centuries CE", "12—14世纪": "12th–14th centuries CE", "13—14世纪": "13th–14th centuries CE", "14—17世纪": "14th–17th centuries CE", "15—18世纪": "15th–18th centuries CE", "16—17世纪": "16th–17th centuries CE", "17—18世纪": "17th–18th centuries CE", "17—19世纪": "17th–19th centuries CE", "19世纪": "19th century CE", "20世纪": "20th century CE", "1508年前后": "around 1508 CE",
  "孔门讲学与弟子传述共同构成早期儒学的核心发生地。": "Confucius's teaching and his disciples' accounts made this a formative site of early Confucianism.",
  "汉代经学以孔氏家学重新组织先秦经典的解释传统。": "Han classical scholarship reorganized interpretations of pre-Qin texts through the Kong family tradition.",
  "孟学由齐鲁出发，在游说诸侯的过程中把孔门伦理转化为政治论说。": "From Qi and Lu, Mencius carried Confucian ethics into political argument as he addressed regional rulers.",
  "传统叙事把老子守藏与周室典籍联系在河洛文化中心。": "Traditional accounts place Laozi's work as an archivist and the Zhou collections in the Yellow River–Luo region.",
  "东汉都城汇聚史学编纂与小学传统，知识由国家典藏体系向外传播。": "The Eastern Han capital brought together historical compilation and philology; knowledge circulated outward from state collections.",
  "二程讲学使河洛成为北宋理学的重要思想节点。": "The Cheng brothers' teaching made the region an important center of Northern Song Neo-Confucianism.",
  "帝国都城把诸地域材料汇入国家叙事与经学体系。": "The imperial capital drew regional materials into state history and classical scholarship.",
  "丝路、译场与科举文教使长安成为中外知识转换和文体革新的枢纽。": "Silk Road traffic, translation centers, and examinations made Chang'an a hub for exchanging knowledge and renewing literary forms.",
  "写本、壁画与商旅网络共同记录经典从印度—西域进入中土后的在地转化。": "Manuscripts, murals, and trade routes record how texts from India and Central Asia were adapted in China.",
  "安史乱后的人口迁徙使巴蜀成为唐代诗歌生产与保存的重要空间。": "Migration after the An Lushan rebellion made Sichuan an important site for Tang poetry's creation and preservation.",
  "蜀地刻书推动经典从少数抄本转向更广泛的区域流通。": "Printing in Shu helped classical texts circulate beyond a small number of manuscript copies.",
  "北宋都城以馆阁、书局和文人交游连接国家编纂与私人著述。": "In the Northern Song capital, libraries, editorial offices, and scholars' networks linked state compilations with private writing.",
  "南朝都城的宫廷文教与士族文化促进了文学理论和总集编纂。": "Court learning and elite culture in the Southern Dynasties fostered literary theory and anthologies.",
  "政治中心与江南出版网络在明清易代前后持续塑造思想论争。": "Political centers and Jiangnan publishing shaped intellectual debate around the Ming–Qing transition.",
  "会稽山水、士族交游和玄学清谈共同进入兰亭书写。": "Kuaiji's landscape, elite gatherings, and philosophical conversation shaped writings from the Orchid Pavilion.",
  "讲会和师友网络使心学及其后续批判在浙东形成持续文脉。": "Lectures and networks of teachers and friends sustained the School of Mind and its later critiques in eastern Zhejiang.",
  "地方记忆被重新写入现代文学与启蒙叙事。": "Local memory was recast in modern literature and narratives of enlightenment.",
  "南渡后的政治中心使中原传统在江南都市环境中重组。": "The southward shift of the political center reshaped Central Plains traditions in Jiangnan's urban setting.",
  "书坊、园林与文人社群把文学趣味扩散至更广阔的读者网络。": "Bookshops, gardens, and literary circles carried new tastes to a wider readership.",
  "讲学空间与建阳刻书业叠合，使朱子学由地方书院进入跨区域教育体系。": "Teaching sites and Jianyang printing carried Zhu Xi's thought from local academies into education across regions.",
  "大都的勾栏、市民与跨地域人口为元曲提供新的表演空间。": "Dadu's theaters, urban residents, and migrants created new stages for Yuan drama.",
  "宫廷编纂、藏书制度和城市阅读共同形成清代知识中心。": "Court compilations, libraries, and urban reading made the city a Qing center of learning.",
  "大学、报刊与出版机构把思想论争转化为全国性的公共议题。": "Universities, newspapers, and publishers turned intellectual debate into a nationwide public issue.",
  "口岸出版和翻译网络加速了中西概念的再解释与全国流通。": "Port-city publishers and translators sped up the reinterpretation and circulation of Chinese and Western ideas.",
  "现代出版业把城市经验、文学社团与大众读者连接起来。": "Modern publishing connected urban experience and literary societies with a mass readership.",
  "楚地巫风、方言与政治放逐经验共同塑造骚体传统。": "Chu ritual culture, regional speech, and political exile shaped the sao poetic tradition.",
  "湖湘学术把史论、经世与近代世界知识连续起来。": "Hunan scholarship connected historical criticism, statecraft, and knowledge of the modern world.",
  "新式学校、社团与报刊使湖湘经世传统转化为现代政治行动。": "New schools, associations, and newspapers turned Hunan statecraft traditions toward modern political action.",
  "海贸口岸与岭南经学相遇，推动传统经学向制度改革论述转换。": "Maritime trade and Lingnan scholarship brought classical learning into debates about institutional reform.",
  "侨民、海港与革命组织使岭南成为跨国政治思想的重要入口。": "Overseas communities, ports, and revolutionary groups made Lingnan a gateway for transnational political ideas.",
  "贬谪、边地经验与地方讲学构成阳明心学转折的重要空间。": "Exile, frontier experience, and local teaching shaped a turning point in Wang Yangming's thought.",
  // 四时（春夏秋冬四字早已收在前面，不再重出）

  // Cultural geography: names, works, ideas, and route descriptions
  "《东坡全集》": "Complete Works of Su Dongpo",
  "《二程遗书》": "Remnant Books of the Two Chengs",
  "《传习录》": "Instructions for Practical Living",
  "《兰亭集序》": "Preface to the Orchid Pavilion Collection",
  "《剑南诗稿》": "Poems from Jian South",
  "《古文尚书》": "Old Text Book of Documents",
  "《史记》": "Records of the Grand Historian",
  "《呐喊》": "Call to Arms",
  "《四书章句集注》": "Collected Commentaries on the Four Books",
  "《四库全书总目》": "General Catalogue of the Siku Quanshu",
  "《大唐西域记》": "Great Tang Records on the Western Regions",
  "《天演论》": "Evolution and Ethics",
  "《子夜》": "Midnight",
  "《孔子家语》": "Family Sayings of Confucius",
  "《孟子》": "Mencius",
  "《家》": "Home",
  "《尝试集》": "First Poems",
  "《广东新语》": "New Words on Guangdong",
  "《建国方略》": "The Plan for World Peace",
  "《弇州山人四部稿》": "Four-Part Manuscripts of Yanzhou Shanren",
  "《循环日报》": "Cyclical Daily News",
  "《文心雕龙》": "The Literary Mind and the Carving of Dragons",
  "《新五代史》": "New History of the Five Dynasties",
  "《新学伪经考》": "Investigation of the Forged Classics of New Learning",
  "《新青年》": "New Youth",
  "《日知录》": "Daily Knowledge Record",
  "《昌黎先生集》": "Collected Works of Mr. Changli",
  "《明夷待访录》": "Record of Awaiting Visits in Times of Darkness",
  "《春秋繁露》": "Elaborate Expositions on the Spring and Autumn Annals",
  "《昭明文选》": "Selections of Refined Literature",
  "《朝花夕拾》": "Dawn Blossoms Plucked at Dusk",
  "《杜工部集》": "Collected Works of Du Fu",
  "《楚辞》": "Songs of Chu",
  "《武林旧事》": "Old Tales of Lin'an",
  "《汉书》": "Book of Han",
  "《汉宫秋》": "Autumn in the Han Palace",
  "《海国图志》": "Illustrated Treatise on the Maritime Kingdoms",
  "《湘江评论》": "Xiangjiang Review",
  "《红楼梦》": "Dream of the Red Chamber",
  "《薛涛诗》": "Poems by Xue Tao",
  "《论语》": "The Analects",
  "《说文解字》": "Shuowen Jiezi (Explaining Forms and Analyzing Characters)",
  "《读通鉴论》": "Commentary on the Zizhi Tongjian",
  "《资治通鉴》": "Comprehensive Mirror to Aid in Governance",
  "《道德经》": "Tao Te Ching",
  "《陶庵梦忆》": "Dream Memories from Taohan",
  "《随园诗话》": "Poetic Remarks from Suiyuan",
  "世情小说": "Novels of Human Sentiments",
  "丝路写本与长安译场": "Silk Road Manuscripts and Chang'an Translation Centers",
  "两京典藏与史学编纂": "Capital Collections and Historical Compilation",
  "严复": "Yan Fu",
  "书坊刻工": "Bookshop Carvers",
  "书法美学": "Aesthetics of Calligraphy",
  "书院教育": "Academy Education",
  "仁政": "Benevolent Government",
  "今文经学": "Modern Script Confucianism",
  "以史资治": "Using History for Governance",
  "传播": "Dissemination",
  "佛典翻译": "Translation of Buddhist Scriptures",
  "佛教中国化": "Sinicization of Buddhism",
  "佛经变文": "Buddhist Vernacular Narratives",
  "俗讲": "Vernacular Sermons",
  "元杂剧": "Yuan Zaju (Mixed Drama)",
  "全部": "All",
  "六经": "Six Classics",
  "共和": "Republic",
  "关汉卿": "Guan Hanqing",
  "写经生": "Sutra Scribes",
  "刊刻": "Woodblock Printing",
  "南宋文化": "Southern Song Culture",
  "南渡：制度、典籍与文人重心南移": "The Southern Migration: Institutions, Classics, and the Southward Shift of Literati Focus",
  "历史批判": "Historical Criticism",
  "反者道之动": "Reversal is the Movement of the Dao",
  "变法": "Reform",
  "古文": "Classical Prose",
  "古文传统": "Classical Prose Tradition",
  "古文运动": "Classical Prose Movement",
  "史学批评": "Historiographical Criticism",
  "周密": "Zhou Mi",
  "四书体系": "Four Books System",
  "国民性批判": "Critique of National Character",
  "地方文学": "Regional Literature",
  "地方知识": "Local Knowledge",
  "地方记忆进入现代出版中心": "Local Memory Entering Modern Publishing Centers",
  "城市记忆": "Urban Memory",
  "士族交游连接建康与会稽": "Scholarly Networks Connecting Jiankang and Kuaiji",
  "声律": "Phonology and Prosody",
  "复古": "Revivalism",
  "多民族都市": "Multi-ethnic Metropolis",
  "大一统": "Great Unity",
  "大众教育": "Mass Education",
  "天理": "Heavenly Principle",
  "女性书写": "Women's Writing",
  "孔安国": "Kong Anguo",
  "孔门伦理向孟学政治论说演进": "Evolution from Confucian Ethics to Mencian Political Discourse",
  "孙中山": "Sun Yat-sen",
  "安史乱后文人入蜀": "Literati Migration to Shu after the An Lushan Rebellion",
  "宋代刻工": "Song Dynasty Block-Carvers",
  "宋元": "Song and Yuan Dynasties",
  "实业计划": "Industrial Plan",
  "家庭批判": "Critique of the Family",
  "屈大均": "Qu Dajun",
  "巴金": "Ba Jin",
  "市民戏曲": "Urban Opera",
  "康有为": "Kang Youwei",
  "建本推动理学经典传播": "Jianben Editions Promoting the Spread of Neo-Confucian Classics",
  "建本经籍": "Jianben Classical Texts",
  "开眼看世界": "Opening Eyes to the World",
  "张岱": "Zhang Dai",
  "徐特立": "Xu Teli",
  "心即理": "Mind is Principle",
  "忧患意识": "Sense of Crisis",
  "性灵": "Spiritual Essence",
  "报刊、大学与新文化网络": "Newspapers, Universities, and New Culture Networks",
  "报刊公共空间": "Public Space in Newspapers",
  "撰写": "Authoring",
  "政治与编纂中心北移": "Northward Shift of Political and Editorial Centers",
  "政治批判": "Political Critique",
  "故国书写": "Writing on the Homeland",
  "敦煌写本": "Dunhuang Manuscripts",
  "文人书商": "Literati Booksellers",
  "文字训诂": "Textual Exegesis",
  "文学本体": "Ontology of Literature",
  "文本传播": "Textual Dissemination",
  "文章分类": "Literary Classification",
  "断代史": "Dynastic History",
  "新文化": "New Culture",
  "新民学会": "New People's Society",
  "明清": "Ming-Qing",
  "有教无类": "Education for All",
  "柳宗元": "Liu Zongyuan",
  "格物": "Investigation of Things",
  "楚地祭歌": "Chu Region Ritual Songs",
  "楚辞传统进入南朝文学理论": "Chu Ci Tradition Enters Southern Dynasties Literary Theory",
  "欧阳修": "Ouyang Xiu",
  "毛泽东": "Mao Zedong",
  "民贵君轻": "The People Are Most Important, the Ruler Least",
  "洛学": "Luoyang School",
  "洛学进入朱子理学体系": "Luoyang School Enters Zhu Xi's Neo-Confucian System",
  "浙东史学": "Zhedong Historiography",
  "玄奘": "Xuanzang",
  "玄学清谈": "Xuanxue and Pure Discourse",
  "王世贞": "Wang Shizhen",
  "王羲之": "Wang Xizhi",
  "王韬": "Wang Tao",
  "现代国家": "Modern State",
  "现代文学": "Modern Literature",
  "现代都市": "Modern City",
  "理学": "Neo-Confucianism",
  "生命意识": "Awareness of Life",
  "白话文": "Vernacular Chinese",
  "知识分类": "Knowledge Classification",
  "社会改造": "Social Reform",
  "科学与民主": "Science and Democracy",
  "秦汉": "Qin-Han",
  "程颐": "Cheng Yi",
  "程颢": "Cheng Hao",
  "纪传史学": "Biographical Historiography",
  "纪昀": "Ji Yun",
  "经世致用": "Practical Learning for Statecraft",
  "经史注本": "Annotated Classics and Histories",
  "经学": "Classical Studies",
  "编纂": "Compilation",
  "翻译": "Translation",
  "考据": "Textual Research",
  "胡适": "Hu Shi",
  "致良知": "Extending Innate Knowledge",
  "茅盾": "Mao Dun",
  "萧统": "Xiao Tong",
  "薛涛": "Xue Tao",
  "蜀刻本": "Sichuan Woodblock Editions",
  "衣冠南渡与玄学、文学南移": "Southern Migration of the Gentry, Metaphysics, and Literature",
  "袁枚": "Yuan Mei",
  "西学东渐": "Diffusion of Western Learning to the East",
  "讲学": "Lecturing",
  "许慎": "Xu Shen",
  "论争": "Debate",
  "译经僧": "Scripture-Translating Monks",
  "译著经口岸出版进入全国论争": "Translated Works Published via Ports Enter National Debate",
  "诗史": "Poetic History",
  "谢安": "Xie An",
  "跨语际传播": "Cross-linguistic Dissemination",
  "近现代": "Modern and Contemporary",
  "道统": "Orthodoxy of the Way",
  "遗民思想": "Remnant Subject Thought",
  "陆游": "Lu You",
  "陈独秀": "Chen Duxiu",
  "隋唐": "Sui and Tang Dynasties",
  "雕版印刷": "Woodblock Printing",
  "革命思想沿社团与报刊传播": "Dissemination of Revolutionary Ideas via Societies and Newspapers",
  "革命文学": "Revolutionary Literature",
  "韩愈": "Han Yu",
  "马致远": "Ma Zhiyuan",
  "魏晋南北朝": "Wei, Jin, and Northern and Southern Dynasties",
  "魏源": "Wei Yuan",
  "鲁迅": "Lu Xun",
  "黄宗羲": "Huang Zongxi",
  "齐鲁经学汇入长安国家学术": "Qilu Confucian Studies Integrated into National Scholarship in Chang'an",
  "龙场悟道与阳明学讲会网络": "Longchang Enlightenment and the Yangmingist Lecture Network",
  "中原": "Central Plains",
  "关中": "Guanzhong",
  "岭南": "Lingnan",
  "巴蜀": "Ba and Shu",
  "江南": "Jiangnan",
  "江海": "Lower Yangtze coast",
  "河洛": "Yellow River–Luo River region",
  "河西": "Hexi Corridor",
  "浙东": "Eastern Zhejiang",
  "湖湘": "Hunan",
  "燕赵": "Yan and Zhao",
  "闽北": "Northern Fujian",
  "黔中": "Central Guizhou",
  "底图：Natural Earth 1:50m · 地点按经纬度定位": "Base map: Natural Earth 1:50m · sites positioned by latitude and longitude",
  "打开原书": "Open source text",
  "此书暂无可跳转正文": "No readable full text available",
  "原文已核对": "Exact text verified",
  "文本依据": "Textual support",
  "本人著述": "Author's own writing",
  "审定文脉引用": "Reviewed lineage evidence",
  "立场与比较推演": "Interpretation and comparison",
  "回答中的解释与跨时代比较由系统据上述材料组织，不作为人物原话。": "Interpretation and cross-period comparison are organized from the evidence above and are not presented as the figure's own words.",
  "本轮没有可绑定的原文证据，回答仅作为人物立场推演展示。": "No source passage could be bound in this turn; the response is shown only as a persona-based interpretation.",
};
