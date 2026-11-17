import type { SikuEdge } from "./sikuLineage";

/**
 * 西方典籍关系候选及审定结果。
 *
 * 方向仍为「源 → 流」。模型或规则只负责提出候选；只有 accepted 且两端都在当前目录、
 * 并附有一手文本或可复核学术来源的边，才进入文明长卷。主题相似、时代接近、作者彼此
 * 仰慕而无法坐实到具体书的，一概不画正式边。
 */
export type WesternLineageCandidate = SikuEdge & {
  id: string;
  review: {
    status: "accepted" | "rejected";
    method: "primary-text" | "scholarly-source" | "catalogue-pairing";
    reason: string;
  };
};

const w = (id: string) => `wl:${id}`;

const SRC = {
  epic: {
    source: "Harvard Center for Hellenic Studies, The Epic Hero",
    url: "https://www-current.chs.harvard.edu/curated-article/gregory-nagy-the-epic-hero/",
  },
  aeneid: {
    source: "Francis Cairns, Virgil's Augustan Epic, Cambridge University Press",
    url: "https://www.cambridge.org/core/books/abs/virgils-augustan-epic/aeneid-as-odyssey/DD7B645896F1BBCA116E5FD67DF1D531",
  },
  ulysses: {
    source: "Yale Modernism Lab, Ulysses",
    url: "https://campuspress.yale.edu/modernismlab/ulysses/",
  },
  aristotle: {
    source: "Stanford Encyclopedia of Philosophy, Aristotle's Political Theory",
    url: "https://plato.stanford.edu/entries/aristotle-politics/",
  },
  rousseau: {
    source: "Stanford Encyclopedia of Philosophy, Jean Jacques Rousseau",
    url: "https://plato.stanford.edu/entries/rousseau/",
  },
  socialContract: {
    source: "Stanford Encyclopedia of Philosophy, Original Position and Social Contract Tradition",
    url: "https://plato.stanford.edu/entries/original-position/",
  },
  aquinas: {
    source: "Stanford Encyclopedia of Philosophy, Thomas Aquinas",
    url: "https://plato.stanford.edu/entries/aquinas/",
  },
  kant: {
    source: "Stanford Encyclopedia of Philosophy, Immanuel Kant",
    url: "https://plato.stanford.edu/entries/kant/",
  },
  hegel: {
    source: "Stanford Encyclopedia of Philosophy, Georg Wilhelm Friedrich Hegel",
    url: "https://plato.stanford.edu/entries/hegel/",
  },
  marx: {
    source: "Stanford Encyclopedia of Philosophy, Karl Marx",
    url: "https://plato.stanford.edu/entries/marx/",
  },
  newton: {
    source: "The Newton Project, Encyclopaedia Britannica entry on Newton",
    url: "https://www.newtonproject.ox.ac.uk/view/texts/diplomatic/OTHE00010",
  },
};

function accepted(
  id: string,
  from: string,
  to: string,
  type: SikuEdge["type"],
  note: string,
  evidence: NonNullable<SikuEdge["evidence"]>,
  method: WesternLineageCandidate["review"]["method"] = "scholarly-source",
): WesternLineageCandidate {
  return {
    id,
    from: w(from),
    to: w(to),
    type,
    note,
    basis: method === "primary-text" ? "primary" : "scholarly",
    evidence,
    review: { status: "accepted", method, reason: "关系指向具体文本，且有可复核依据" },
  };
}

function rejected(id: string, from: string, to: string, note: string, reason: string): WesternLineageCandidate {
  return {
    id,
    from: w(from),
    to: w(to),
    type: "并",
    note,
    review: { status: "rejected", method: "scholarly-source", reason },
  };
}

const ev = (
  source: string,
  summary: string,
  url?: string,
  confidence: "high" | "medium" = "high",
): NonNullable<SikuEdge["evidence"]> => ({ source, summary, url, confidence });

export const WESTERN_LINEAGE_CANDIDATES: WesternLineageCandidate[] = [
  // ── 古典史诗、戏剧与史学 ───────────────────────────────────────
  accepted("we-001", "iliad", "odyssey", "并", "同属荷马史诗与特洛伊战争叙事传统，后世通常并举", ev(SRC.epic.source, "两部荷马史诗以阿喀琉斯与奥德修斯构成互补的英雄范型。", SRC.epic.url), "catalogue-pairing"),
  accepted("we-002", "iliad", "aeneid", "采", "《埃涅阿斯纪》后六卷以战争叙事重写《伊利亚特》的史诗模式", ev(SRC.aeneid.source, "维吉尔史诗后半部明显取法《伊利亚特》的战争结构。", SRC.aeneid.url)),
  accepted("we-003", "odyssey", "aeneid", "采", "《埃涅阿斯纪》前六卷以漂泊与归宿叙事取法《奥德赛》", ev(SRC.aeneid.source, "维吉尔史诗前半部以埃涅阿斯航行为《奥德赛》的罗马式改写。", SRC.aeneid.url)),
  accepted("we-004", "odyssey", "ulysses", "采", "《尤利西斯》以都柏林一日对应奥德修斯返乡结构", ev(SRC.ulysses.source, "乔伊斯为各章设置了与《奥德赛》人物和情节相对应的结构。", SRC.ulysses.url)),
  accepted("we-005", "hamlet", "ulysses", "采", "《尤利西斯》的斯蒂芬线除荷马框架外还持续调用《哈姆莱特》", ev(SRC.ulysses.source, "耶鲁的作品说明指出小说除《奥德赛》外亦设置了《哈姆莱特》对应。", SRC.ulysses.url)),
  accepted("we-006", "iliad", "poetics", "传", "《诗学》以荷马史诗为核心范例讨论叙事、摹仿与统一性", ev("Aristotle, Poetics", "《诗学》多处直接分析《伊利亚特》的结构与史诗技法。"), "primary-text"),
  accepted("we-007", "odyssey", "poetics", "传", "《诗学》以《奥德赛》说明复杂情节、发现与苦难等结构", ev("Aristotle, Poetics", "《诗学》将《奥德赛》作为复杂史诗情节的直接分析对象。"), "primary-text"),
  accepted("we-008", "histories-herodotus", "peloponnesian-war", "驳", "修昔底德继承历史叙事又反拨奇闻与传说式书写，强调证据与因果", ev("The Cambridge Companion to Thucydides", "修昔底德的史学方法通常被理解为对希罗多德传统的继承与批判。", "https://www.cambridge.org/core/books/cambridge-companion-to-thucydides/")),
  accepted("we-009", "aeneid", "divine-comedy", "采", "但丁以维吉尔为地狱与炼狱的引路人，并重写《埃涅阿斯纪》第六卷的冥府下降", ev("Dante, Divine Comedy; Virgil, Aeneid VI", "维吉尔在《神曲》中直接成为导师人物，冥府结构承接《埃涅阿斯纪》第六卷。"), "primary-text"),
  accepted("we-010", "metamorphoses", "midsummer", "采", "《仲夏夜之梦》戏中戏直接改写奥维德所载皮拉摩斯与提斯柏故事", ev("Shakespeare, A Midsummer Night's Dream V.1; Ovid, Metamorphoses IV", "两部作品的人名、误认与双重死亡情节可以逐项对应。"), "primary-text"),
  accepted("we-011", "decameron", "canterbury", "承", "《坎特伯雷故事集》承接《十日谈》以旅程或聚会串联多人讲故事的框架", ev("The Cambridge Companion to Chaucer", "乔叟将欧洲故事集传统转化为朝圣者轮流讲述的英语框架。", "https://www.cambridge.org/core/books/cambridge-companion-to-chaucer/")),

  // ── 哲学、政治思想与神学 ─────────────────────────────────────
  accepted("we-012", "republic", "politics", "驳", "亚里士多德广泛借用《理想国》的问题设置，同时批评财产、家庭共同体等方案", ev(SRC.aristotle.source, "《政治学》对柏拉图既大量借鉴又作明确批判。", SRC.aristotle.url)),
  accepted("we-013", "ethics", "politics", "续", "《政治学》把《尼各马可伦理学》的个人善推进到城邦共同善", ev(SRC.aristotle.source, "伦理学关于幸福、德性与正义的原则构成《政治学》的基础。", SRC.aristotle.url)),
  accepted("we-014", "republic", "social-contract", "承", "卢梭的政治哲学深受柏拉图影响，并重新处理公民教育与共同体问题", ev(SRC.rousseau.source, "斯坦福哲学百科将柏拉图列为卢梭尤为重要的古代影响。", SRC.rousseau.url)),
  accepted("we-015", "leviathan", "social-contract", "驳", "卢梭承接霍布斯的主权问题，却拒绝代表性主权与绝对服从的结论", ev(SRC.rousseau.source, "霍布斯的主权概念进入《社会契约论》，但被卢梭重新改造。", SRC.rousseau.url)),
  accepted("we-016", "two-treatises", "social-contract", "承", "《社会契约论》延续洛克以来以契约解释政治合法性的讨论", ev(SRC.rousseau.source, "卢梭把洛克列为其政治哲学最直接的影响之一。", SRC.rousseau.url)),
  accepted("we-017", "spirit-laws", "social-contract", "承", "卢梭吸收孟德斯鸠关于法律、政体与社会条件的分析再提出公意", ev(SRC.rousseau.source, "孟德斯鸠被列为卢梭政治哲学的直接影响。", SRC.rousseau.url)),
  accepted("we-018", "leviathan", "two-treatises", "并", "两书构成近代社会契约传统中绝对主权与有限政府的经典对照", ev(SRC.socialContract.source, "社会契约史通常将霍布斯与洛克并列，并强调二者对政治权威的不同论证。", SRC.socialContract.url), "catalogue-pairing"),
  accepted("we-019", "ethics", "summa", "承", "阿奎那将亚里士多德德性伦理纳入基督教神学体系", ev(SRC.aquinas.source, "《神学大全》的德性论系统吸收并改造亚里士多德伦理学。", SRC.aquinas.url)),
  accepted("we-020", "politics", "summa", "承", "阿奎那以亚里士多德政治哲学讨论自然法、共同善与政治共同体", ev(SRC.aquinas.source, "阿奎那对亚里士多德政治思想的接受构成其中世纪政治论的重要基础。", SRC.aquinas.url)),
  accepted("we-021", "pure-reason", "phenomenology", "驳", "黑格尔继承康德对认识条件的追问，同时批评物自身与主体—对象分裂", ev(SRC.hegel.source, "黑格尔体系在康德问题框架内展开，又试图克服其二元论限制。", SRC.hegel.url)),
  accepted("we-022", "phenomenology", "communist-manifesto", "承", "马克思、恩格斯承接黑格尔辩证法并将其转向历史与社会关系", ev(SRC.marx.source, "马克思早期思想从黑格尔传统出发，并对其作唯物主义转化。", SRC.marx.url)),
  accepted("we-023", "phenomenology", "capital", "承", "《资本论》的矛盾与过程分析延续并改造黑格尔辩证方法", ev(SRC.marx.source, "马克思公开承认黑格尔辩证法的影响，同时反转其唯心主义形式。", SRC.marx.url)),
  accepted("we-024", "communist-manifesto", "capital", "续", "《资本论》把《共产党宣言》提出的资本主义批判扩展为系统的政治经济学研究", ev("Marx and Engels, Communist Manifesto; Marx, Capital", "两书在作者、研究对象与批判纲领上前后相接，后书展开了更系统的论证。"), "primary-text"),
  accepted("we-025", "wealth-nations", "capital", "驳", "马克思在《资本论》中持续引用并批判亚当·斯密的劳动、价值与分工理论", ev("Marx, Capital", "《资本论》正文多次点名讨论亚当·斯密，是明确的文本性继承与批判。"), "primary-text"),
  accepted("we-026", "capital", "protestant-ethic", "驳", "韦伯以宗教伦理解释资本主义精神，形成对纯经济决定论的经典补充与修正", ev("Stanford Encyclopedia of Philosophy, Max Weber", "韦伯对资本主义起源的解释通常与马克思传统形成明确对话。", "https://plato.stanford.edu/entries/weber/")),

  // ── 经文、神学与文学取材 ─────────────────────────────────────
  accepted("we-027", "hebrew-bible", "new-testament", "续", "《新约》延续希伯来经典的创造、盟约、先知与救赎叙事，并反复引经释义", ev("New Testament", "《新约》各书持续引用希伯来经典，并把自身叙事置于其历史与预言框架中。"), "primary-text"),
  accepted("we-028", "hebrew-bible", "city-of-god", "传", "《上帝之城》以希伯来经典解释历史、罪、城邦与救赎秩序", ev("Augustine, City of God", "奥古斯丁逐卷引用并阐释希伯来经典，以建立两城历史观。"), "primary-text"),
  accepted("we-029", "new-testament", "city-of-god", "传", "《上帝之城》以基督教经文阐释地上之城与上帝之城的终极归宿", ev("Augustine, City of God", "作品的核心历史神学直接建立在《新约》的末世与救赎论之上。"), "primary-text"),
  accepted("we-030", "hebrew-bible", "divine-comedy", "采", "《神曲》的宇宙秩序、人物与象征大量取自希伯来经典", ev("Dante, Divine Comedy", "诗中持续调用创世、先知、诗篇与智慧书传统。"), "primary-text"),
  accepted("we-031", "new-testament", "divine-comedy", "采", "《神曲》的审判、炼净与天堂结构以《新约》救赎论为根本框架", ev("Dante, Divine Comedy", "基督、保罗、启示录与末日审判构成全诗的显性经文框架。"), "primary-text"),
  accepted("we-032", "hebrew-bible", "paradise-lost", "采", "《失乐园》扩写《创世记》的人类堕落叙事", ev("Milton, Paradise Lost; Genesis 1–3", "作品主线直接扩写创造、诱惑与逐出伊甸园。"), "primary-text"),
  accepted("we-033", "new-testament", "paradise-lost", "采", "《失乐园》以基督救赎重新解释亚当堕落及其历史后果", ev("Milton, Paradise Lost", "诗中圣子承担未来救赎使命，使创世叙事与《新约》救恩论相接。"), "primary-text"),
  accepted("we-034", "hebrew-bible", "moby-dick", "采", "《白鲸》从书名、人物命名到讲道与象征系统持续取材《希伯来圣经》", ev("Melville, Moby-Dick", "以实玛利、亚哈、约拿等命名和章节构成可直接核验的经文取材。"), "primary-text"),
  accepted("we-035", "new-testament", "crime-punishment", "采", "《罪与罚》以拉撒路复活段落组织主人公的罪责与精神重生", ev("Dostoevsky, Crime and Punishment, Part IV", "索尼娅读出拉撒路复活故事，是小说救赎结构的显性文本锚点。"), "primary-text"),

  // ── 科学与社会思想 ───────────────────────────────────────────
  accepted("we-036", "copernicus", "dialogue-galileo", "承", "伽利略以两大世界体系的对话形式为哥白尼日心体系辩护", ev("Galileo, Dialogue Concerning the Two Chief World Systems", "作品明确比较托勒密与哥白尼体系，论证重心偏向后者。"), "primary-text"),
  accepted("we-037", "copernicus", "principia", "承", "《原理》以数学力学统一行星与地上运动，建立在哥白尼式行星体系转向之后", ev(SRC.newton.source, "牛顿的引力理论把近代行星体系转化为统一的数学物理学。", SRC.newton.url)),
  accepted("we-038", "dialogue-galileo", "principia", "承", "牛顿以运动定律与引力理论推进伽利略开创的数学化运动研究", ev(SRC.newton.source, "《原理》综合并推进了伽利略以来的运动研究。", SRC.newton.url)),
  accepted("we-039", "principia", "relativity", "驳", "相对论保留牛顿理论的低速近似，同时修正其绝对时空与引力框架", ev("Einstein, Relativity: The Special and General Theory", "爱因斯坦明确从经典力学的适用边界出发重建时空与引力。"), "primary-text"),
  accepted("we-040", "origin-species", "evolution-ethics", "驳", "赫胥黎接受进化事实，却反对把自然选择直接等同于人类伦理规范", ev("T. H. Huxley, Evolution and Ethics", "讲演明确区分宇宙进程与伦理进程，是对达尔文主义社会化解释的限制。"), "primary-text"),
  accepted("we-041", "principia", "pure-reason", "承", "康德以牛顿物理学的确定性为背景追问数学与自然科学知识何以可能", ev(SRC.kant.source, "康德认识论的重要目标之一，是解释牛顿式自然科学的先验条件。", SRC.kant.url)),

  // ── 后世并称：只表示接受史中的比较，不伪造直接影响 ───────────────
  accepted("we-042", "rights-woman", "room-own", "并", "两书常被并列为英语女性主义思想的重要经典，分别聚焦教育权与创作条件", ev("The Cambridge Companion to Feminist Literary Theory", "两部作品在女性主义经典谱系中经常被共同讨论。", "https://www.cambridge.org/core/books/cambridge-companion-to-feminist-literary-theory/"), "catalogue-pairing"),
  accepted("we-043", "rights-woman", "second-sex", "并", "两书跨越十八与二十世纪，共同构成现代女性主体与社会处境论述的重要节点", ev("Stanford Encyclopedia of Philosophy, Feminist History of Philosophy", "沃斯通克拉夫特与波伏瓦均是现代女性主义哲学史的核心作者。", "https://plato.stanford.edu/entries/feminism-femhist/"), "catalogue-pairing"),
  accepted("we-044", "brave-new-world", "nineteen-eighty-four", "并", "两书分别以消费—技术控制与监视—语言控制构成二十世纪反乌托邦的经典双璧", ev("The Cambridge Companion to Utopian Literature", "两部小说在反乌托邦文学史中通常并列讨论。", "https://www.cambridge.org/core/books/cambridge-companion-to-utopian-literature/"), "catalogue-pairing"),

  // ── 被模型提出但未获准进入正式图谱的候选 ─────────────────────
  rejected("wr-001", "gilgamesh", "hebrew-bible", "两书均有洪水叙事", "共享母题不能单独证明直接文本依赖，学界对传播链和具体方向仍有争议"),
  rejected("wr-002", "frankenstein", "brave-new-world", "都讨论科学制造生命及其后果", "只有主题相似，未能坐实后书对前书的具体引用、改写或批评"),
  rejected("wr-003", "zarathustra", "dream-interpretation", "都重新解释人的非理性力量", "思想邻近不等于书际关系，且方向与直接影响证据不足"),
  rejected("wr-004", "beowulf", "lord-of-the-rings", "托尔金研究并吸收古英语史诗", "目标书尚未进入当前代表性目录，正式边不能悬空"),
  rejected("wr-005", "utopia", "nineteen-eighty-four", "后者属于反乌托邦传统", "体裁反转不足以证明《一九八四》直接以《乌托邦》为批评对象"),
];

/** 审定通过且两端都存在的正式边。 */
export function westernEdges(ids: Set<string>): SikuEdge[] {
  return WESTERN_LINEAGE_CANDIDATES
    .filter((e) => e.review.status === "accepted" && ids.has(e.from) && ids.has(e.to))
    .map(({ id: _id, review: _review, ...edge }) => edge);
}

export const WESTERN_REVIEW_STATS = WESTERN_LINEAGE_CANDIDATES.reduce(
  (acc, e) => {
    acc[e.review.status]++;
    return acc;
  },
  { accepted: 0, rejected: 0 },
);
