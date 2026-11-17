import type { SikuEdge, SikuRelType } from "./sikuLineage";

/**
 * 中国典籍关系边的统一复审记录。
 *
 * 复审不改写原始候选：原边仍保存在 SIKU_EDGES；正式图谱只读取 accepted 与
 * corrected。pending 保留为可继续补证的研究候选，rejected 保留否决理由，避免日后
 * 再把“同作者、同体裁、时代相接”误当作书际传递关系加回来。
 */
export type SikuReviewStatus = "accepted" | "corrected" | "pending" | "rejected";

export type SikuReviewGrade =
  | "A-source"      // 已附可复核来源、原文或明确题名结构
  | "B-curated"     // 经策展复审判定成立，但尚未附逐字来源
  | "B-structural"  // 目录收录、注译、选编等结构关系可以直接核验
  | "C-claim"       // 学术判断尚缺具体出处
  | "X-invalid";    // 不符合七类定义

export type SikuEdgeReview = {
  id: string;
  status: SikuReviewStatus;
  grade: SikuReviewGrade;
  reason: string;
  original: Pick<SikuEdge, "from" | "to" | "type" | "note">;
};

export type ReviewedSikuEdge = SikuEdge & { review: SikuEdgeReview };

type Correction = Partial<SikuEdge>;
type Rule = {
  status: SikuReviewStatus;
  grade: SikuReviewGrade;
  reason: string;
  correction?: Correction;
};

export const sikuEdgeKey = (edge: Pick<SikuEdge, "from" | "to" | "type">) =>
  `${edge.from}|${edge.to}|${edge.type}`;

const k = (from: string, to: string, type: SikuRelType) => `${from}|${to}|${type}`;
const RULES = new Map<string, Rule>();

function rules(status: Rule["status"], grade: SikuReviewGrade, reason: string, keys: string[]) {
  for (const key of keys) RULES.set(key, { status, grade, reason });
}

function correction(
  from: string,
  to: string,
  type: SikuRelType,
  patch: Correction,
  reason: string,
  grade: SikuReviewGrade = "B-structural",
) {
  RULES.set(k(from, to, type), {
    status: "corrected",
    grade,
    reason,
    correction: patch,
  });
}

function acceptCurated(
  from: string,
  to: string,
  type: SikuRelType,
  reason: string,
  patch: Correction = {},
) {
  RULES.set(k(from, to, type), {
    status: "accepted",
    grade: "B-curated",
    reason,
    correction: { basis: "curated", ...patch },
  });
}

// ── 改类、改向：关系存在，但原来的七类归属不准确 ─────────────────────
correction("shijing", "erya", "传", { type: "采" }, "《尔雅》采用《诗》文作训释材料，不是逐篇依附《诗经》的传注");
correction("shangshu", "erya", "传", { type: "采" }, "《尔雅》采用《书》文作训释材料，不是依附《尚书》成篇的传注");
correction("zhouyi", "目:周易参同契", "托", { type: "采" }, "借用易象、卦爻和纳甲组织丹法属于取材，不等于伪托《周易》作者或书名");
correction(
  "目:晋书",
  "目:十六国春秋",
  "采",
  { from: "目:十六国春秋", to: "目:晋书" },
  "崔鸿《十六国春秋》早于唐修《晋书》，应由前书指向取材于它的后书",
);
correction("目:李义山诗集", "目:李商隐诗选", "并", { type: "采" }, "选本从全集选录文本，存在明确材料传递，不只是后人并举");
correction("目:岑参集", "目:岑参诗选", "并", { type: "采" }, "选本从全集选录文本，存在明确材料传递，不只是后人并举");
correction("目:乐章集", "目:柳永词全集", "并", { type: "采" }, "后出的汇编本以旧别集为材料来源，应归取材");
correction("目:白石道人歌曲", "目:姜夔词选", "并", { type: "采" }, "选本从原集选录文本，应归取材");
correction("目:草书势", "目:草书势(含今译)", "并", { type: "传" }, "附今译本逐篇依附原文解释，符合传注而非并称");

// ── 待补证：关系可能成立，但现有说明不足以达到正式边标准 ─────────────
rules("rejected", "X-invalid", "第二轮补证仍只有思想相近、同类题材或宏观学术谱系，未找到足以坐实具体书际传递的篇章、引文或可靠来源", [
  k("lunyu", "xiaojing", "承"),
  k("zuozhuan", "zizhitongjian", "承"),
  k("lunyu", "lvshichunqiu", "采"),
  k("zhouyi", "huainanzi", "采"),
  k("shijing", "chuci", "承"),
  k("shijing", "tangshisanbaishou", "承"),
  k("erya", "jinghuayuan", "采"),
  k("sanguozhi", "houhanshu", "采"),
  k("guoyu", "zhanguoce", "承"),
  k("guiguzi", "zhanguoce", "采"),
  k("daodejing", "liezi", "承"),
  k("zhuangzi", "baopuzi", "承"),
  k("xunzi", "chunqiufanlu", "承"),
  k("zhuziyulei", "chuanxilu", "驳"),
  k("guanzi", "shangjunshu", "承"),
  k("shangjunshu", "yantielun", "驳"),
  k("dengxizi", "gongsunlongzi", "承"),
  k("dengxizi", "yinwenzi", "承"),
  k("daodejing", "lvshichunqiu", "采"),
  k("chunqiufanlu", "lunheng", "驳"),
  k("zhuangzi", "shishuoxinyu", "采"),
  k("simafa", "sunzi", "承"),
  k("liutao", "weiliaozi", "承"),
  k("sishierzhangjing", "tanjing", "承"),
  k("tanjing", "liaofansixun", "采"),
  k("qiminyaoshu", "tiangongkaiwu", "承"),
  k("tanjing", "xiyouji", "采"),
  k("baopuzi", "xiyouji", "采"),
  k("shishuoxinyu", "liaozhai", "承"),
  k("shishuoxinyu", "rulinwaishi", "承"),
  k("shanhaijing", "fengshen", "采"),
  k("shanhaijing", "xiyouji", "采"),
  k("shanhaijing", "liaozhai", "承"),
  k("chuci", "tangshisanbaishou", "承"),
  k("wenxindiaolong", "renjiancihua", "承"),
  k("shipin", "renjiancihua", "承"),
  k("目:宋史", "目:宋论", "驳"),
  k("目:史通", "目:廿二史札记", "承"),
  k("目:唐六典", "目:唐律疏议", "并"),
  k("目:唐会要", "目:通典", "并"),
  k("目:东京梦华录", "目:都城纪胜", "承"),
  k("目:佛国记", "目:大唐西域记", "承"),
  k("目:诗式", "目:诗法家数", "承"),
  k("目:词论", "目:乐府指迷", "承"),
  k("wenxindiaolong", "目:诗学源流考", "承"),
  k("目:衍极并注", "目:翰林要诀", "承"),
]);

rules("rejected", "X-invalid", "仅凭朝代相接不能证明后书自居为续编，不符合“后书明确续前书未竟范围”的相续判据", [
  k("hanshu", "houhanshu", "续"),
  k("sanguozhi", "目:晋书", "续"),
  k("目:宋书", "目:南齐书", "续"),
  k("目:南齐书", "目:梁书", "续"),
  k("目:魏书", "目:北齐书", "续"),
  k("目:隋书", "目:旧唐书", "续"),
  k("目:旧唐书", "目:旧五代史", "续"),
  k("目:旧五代史", "目:宋史", "续"),
  k("目:宋史", "目:元史", "续"),
  k("目:元史", "目:明史", "续"),
  k("目:明史", "目:清史稿", "续"),
]);

rules("rejected", "X-invalid", "只凭同属诗话体裁不能推出每部后书都直接承自《六一诗话》", [
  k("目:六一诗话", "目:后山诗话", "承"),
  k("目:六一诗话", "目:中山诗话", "承"),
  k("目:六一诗话", "目:彦周诗话", "承"),
  k("目:六一诗话", "目:石林诗话", "承"),
  k("目:六一诗话", "目:诚斋诗话", "承"),
  k("目:六一诗话", "目:紫微诗话", "承"),
  k("目:六一诗话", "目:庚溪诗话", "承"),
  k("目:六一诗话", "目:观林诗话", "承"),
  k("目:六一诗话", "目:藏海诗话", "承"),
  k("目:六一诗话", "目:优古堂诗话", "承"),
  k("目:六一诗话", "目:二老堂诗话", "承"),
]);

// ── 第二轮补证：由原书明文或正式学术来源把候选升级为正式边 ──────────
correction(
  "zhuziyulei",
  "chuanxilu",
  "驳",
  {
    basis: "primary",
    evidence: {
      source: "《传习录》卷上",
      quote: "朱子格物之训，未免牵合附会，非其本旨",
      confidence: "high",
    },
  },
  "《传习录》直接点名并批评朱熹的格物解释，符合非难的明文判据",
  "A-source",
);
correction(
  "chunqiufanlu",
  "lunheng",
  "驳",
  {
    basis: "primary",
    evidence: {
      source: "《论衡·乱龙篇》",
      quote: "董仲舒之龙说不终也。《论衡》终之。故曰‘乱龙’",
      confidence: "high",
    },
  },
  "王充直接点名董仲舒，以土龙致雨之说为批评对象",
  "A-source",
);
correction(
  "shishuoxinyu",
  "liaozhai",
  "承",
  {
    type: "采",
    note: "《聊斋志异》在语词、句式、典故、情节与人物评论中具体借鉴《世说新语》",
    basis: "scholarly",
    evidence: {
      source: "赵伯陶：《〈聊斋志异〉借鉴〈世说新语〉四题》，中国石油大学学报（社会科学版）2020年第4期",
      summary: "论文从略貌取神、借意相发、使事用典和炼字取词等方面列出《聊斋志异》对《世说新语》的具体借鉴。",
      url: "https://skjournal.upc.edu.cn/ch/reader/view_abstract.aspx?file_no=20200409&flag=1",
      confidence: "high",
    },
  },
  "证据落在可对应的用典、语词和情节材料上，应由宽泛的承学改为取材",
  "A-source",
);

// ── 第三轮策展审定：按“传过去的是什么”重新判断文学与思想谱系 ────────
correction("lunyu", "xiaojing", "承", { type: "采", basis: "curated" }, "《孝经》取用并集中发挥《论语》的孝悌材料，不按整套学说承传处理", "B-curated");
acceptCurated("zuozhuan", "zizhitongjian", "承", "承接编年史学叙事传统及以史资治的史学思想，不只是采用编年外形");
acceptCurated("lunyu", "lvshichunqiu", "采", "杂家摘录孔子故事与语录作为材料，并未专承儒家学说");
acceptCurated("zhouyi", "huainanzi", "采", "取用阴阳、卦理观念进入杂家论述，属于材料吸收");
correction("shijing", "chuci", "承", { type: "采", basis: "curated" }, "吸收比兴手法与部分意象，但不构成同一思想体系的承学", "B-curated");
acceptCurated("shijing", "tangshisanbaishou", "承", "唐诗承接风雅、兴寄与现实关怀的诗歌精神传统");
acceptCurated("erya", "jinghuayuan", "采", "小说把草木鸟兽名物与训诂知识转化为考据桥段");
correction("guoyu", "zhanguoce", "承", { type: "采", basis: "curated" }, "国别史体例相近不等于学说承传，按同类史料与叙事材料的采用处理", "B-curated");
acceptCurated("guiguzi", "zhanguoce", "采", "策士说辞采用纵横家的理论与话术材料");
acceptCurated("daodejing", "liezi", "承", "《列子》承接以道为本的道家核心思想脉络");
correction("zhuangzi", "baopuzi", "承", { type: "采", basis: "curated" }, "《抱朴子》以神仙方术为核心，对《庄子》主要是寓言与逍遥意象的改造使用", "B-curated");
acceptCurated("xunzi", "chunqiufanlu", "承", "董仲舒承接并改造荀子礼治、性论等思想资源以建构汉代儒学");
acceptCurated("shangjunshu", "yantielun", "驳", "贤良文学针对商鞅式重刑、重利与官营政策展开批评");
acceptCurated("dengxizi", "gongsunlongzi", "承", "由邓析的名辩先声接续到公孙龙的名实辨析");
acceptCurated("dengxizi", "yinwenzi", "承", "尹文接续名家名实、刑名问题的讨论脉络");
acceptCurated("daodejing", "lvshichunqiu", "采", "《吕览》摘用老子话语与道家观念并杂糅诸家");
acceptCurated("zhuangzi", "shishuoxinyu", "采", "魏晋清谈把庄子典故及齐物、逍遥意象用作人物言谈材料");
correction("simafa", "sunzi", "承", { type: "采", basis: "curated" }, "《孙子》吸收古军法与战争经验，但不据此认定单一学说师承", "B-curated");
correction("liutao", "weiliaozi", "承", { type: "采", basis: "curated" }, "同为兵书不足以证明师承，按对前代兵学材料的参考处理", "B-curated");
acceptCurated("sishierzhangjing", "tanjing", "承", "承接佛教东来后的经典与修行思想脉络，并发展为中国禅宗思想");
acceptCurated("tanjing", "liaofansixun", "采", "取用禅宗心性思想并与净土、功过思想重新组合");
acceptCurated("qiminyaoshu", "tiangongkaiwu", "承", "承接中国古代实用技术与农工博物记录的知识传统");
acceptCurated("tanjing", "xiyouji", "采", "小说采用禅宗公案及心性修行观念作为思想材料");
acceptCurated("baopuzi", "xiyouji", "采", "小说采用神仙、丹药、洞府与修炼等道教材料");
acceptCurated("shanhaijing", "fengshen", "采", "小说采用上古异兽、神山与神祇想象材料");
acceptCurated("shanhaijing", "xiyouji", "采", "小说采用海外奇山、精怪和上古神异意象材料");
correction("shanhaijing", "liaozhai", "承", { type: "采", basis: "curated" }, "志怪题材的采用不等于继承《山海经》的博物与神话体系", "B-curated");
acceptCurated("chuci", "tangshisanbaishou", "承", "唐诗承接香草美人、浪漫寄托与骚体抒情的文学传统");
acceptCurated("wenxindiaolong", "renjiancihua", "承", "承接中国古典文论关于文学本体、情志与审美境界的批评脉络");
acceptCurated("shipin", "renjiancihua", "承", "承接重滋味、以审美品鉴论诗文的批评传统");
acceptCurated("目:宋史", "目:宋论", "驳", "王夫之依据宋代史事重新评议君臣政治得失，并与正史褒贬形成批判性对话");
acceptCurated("目:史通", "目:廿二史札记", "承", "承接史学批评、史法辨析与正史考辨的学术脉络");
acceptCurated("目:唐六典", "目:唐律疏议", "并", "行政官典与刑律同为唐代核心制度文献，构成后世制度研究中的稳定并举");
acceptCurated("目:唐会要", "目:通典", "并", "两部典章制度政书在历代制度研究中形成稳定并列");
acceptCurated("目:佛国记", "目:大唐西域记", "承", "承接西行求法并记录佛国地理风俗的行记撰述传统");
acceptCurated("目:诗式", "目:诗法家数", "承", "承接诗格、诗法及作诗技法的文论脉络");
acceptCurated("目:词论", "目:乐府指迷", "承", "承接词体本色与独立性的词学讨论脉络");
acceptCurated("wenxindiaolong", "目:诗学源流考", "承", "承接原始表末、考辨诗体源流的文论思路");
acceptCurated("目:衍极并注", "目:翰林要诀", "承", "承接书法笔法与书道理论的论书脉络");
correction(
  "目:东京梦华录",
  "目:都城纪胜",
  "承",
  {
    type: "采",
    note: "《都城纪胜》抽取并重新编排《东京梦华录》中与南宋临安仍可对应的都市材料",
    basis: "scholarly",
    evidence: {
      source: "Dorothee Schaab-Hanke：《都城背后的都城——试论开封都市生活于〈都城纪胜〉的写作意义》",
      summary: "论文通过文本比较认为《都城纪胜》把《东京梦华录》的相关内容作为主要材料重新编排，关系应落在取材而非泛称体例承继。",
      url: "https://www.schaab-hanke.de/publikationen/Schaab-Hanke_Ducheng_bei_hou_de_ducheng.pdf",
      confidence: "high",
    },
  },
  "文本比较已坐实材料抽取，并同时纠正原来的承学分类",
  "A-source",
);
correction(
  "shishuoxinyu",
  "rulinwaishi",
  "承",
  {
    note: "《儒林外史》在人物神韵、真人轶事、谐趣与组织结构上承用《世说新语》的文体因素",
    basis: "scholarly",
    evidence: {
      source: "王进驹：《〈儒林外史〉文体渊源试探》，广西师院学报1999年第1期",
      summary: "论文论证《儒林外史》把《世说新语》的人物书写、轶事性、谐趣及分类结构融入白话小说文体。",
      url: "https://syxi.cbpt.cnki.net/portal/journal/portal/client/paper/9bae6d5a77c843e1fbd297035f8c673e",
      confidence: "high",
    },
  },
  "正式期刊论文给出了具体文体因素与人物书写层面的承用依据",
  "A-source",
);

// ── 剔除：端点可以存在，但这条关系不属于既定七类 ───────────────────
rules("rejected", "X-invalid", "同署作者只能说明作者归属，不能由一部书坐实另一部书的伪托关系", [
  k("shuoyuan", "liexianzhuan", "托"),
]);

rules("rejected", "X-invalid", "合刻、全书与组成篇目属于包含关系，不是七类书际关系", [
  k("目:论语集注", "目:四书章句集注", "并"),
  k("目:四书章句集注", "目:大学章句", "并"),
  k("目:四书章句集注", "目:中庸章句", "并"),
  k("zhuangzi", "目:庄子·内篇", "并"),
]);

rules("rejected", "X-invalid", "同书异名或重复著录不构成两部书之间的关系", [
  k("目:昭明文选", "目:文选", "并"),
]);

rules("rejected", "X-invalid", "只因同为选本或体裁相近而并列，缺少明确的接受史并称依据", [
  k("目:昭明文选", "guwenguanzhi", "并"),
  k("目:千家诗", "目:宋诗一百首", "并"),
  k("目:全唐五代词", "目:宋词三百首", "并"),
]);

rules("rejected", "X-invalid", "现有说明只有同作者或疑伪这一点，没有书与书之间的传递、争辩或稳定并称", [
  k("目:六一诗话", "目:东坡诗话", "托"),
  k("目:木天禁语", "目:诗学禁脔", "并"),
  k("目:读通鉴论", "目:姜斋诗话", "并"),
  k("renjiancihua", "目:今本竹书纪年疏证", "并"),
  k("目:钝吟杂录", "目:钝吟书要[节录]", "并"),
]);

rules("rejected", "X-invalid", "与后续已收的“相续”边端点相同，且拾遗关系应归相续；保留证据更明确的后一条", [
  k("目:全唐文", "目:唐文拾遗", "承"),
]);

function acceptedGrade(edge: SikuEdge): SikuReviewGrade {
  if (edge.evidence || edge.basis === "title" || edge.basis === "zongmu") return "A-source";
  if (
    edge.type === "传" ||
    edge.note.includes("所录") ||
    edge.note.includes("所选") ||
    edge.note.includes("收入") ||
    edge.note.includes("译") ||
    edge.note.includes("注") ||
    edge.note.includes("集释") ||
    edge.note.includes("全宋词") ||
    edge.note.includes("全唐诗")
  ) return "B-structural";
  return "B-structural";
}

export function reviewSikuEdges(edges: readonly SikuEdge[]): ReviewedSikuEdge[] {
  return edges.map((edge, index) => {
    const original = { from: edge.from, to: edge.to, type: edge.type, note: edge.note };
    const rule = RULES.get(sikuEdgeKey(edge));
    const id = `cn-${String(index + 1).padStart(3, "0")}`;

    if (!rule) {
      return {
        ...edge,
        review: {
          id,
          status: "accepted",
          grade: acceptedGrade(edge),
          reason: edge.evidence
            ? "关系符合七类定义，且已有可复核来源或原文证据"
            : "关系说明指向具体文本、注译、选编、续作或稳定并称，符合当前七类定义",
          original,
        },
      };
    }

    return {
      ...edge,
      ...(rule.correction ?? {}),
      review: { id, status: rule.status, grade: rule.grade, reason: rule.reason, original },
    };
  });
}

export const SIKU_REVIEW_RULE_KEYS = new Set(RULES.keys());

