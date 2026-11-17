/**
 * 四库之间的关系边 —— 「四库脉络」长卷上那些跨书、跨部的连线。
 *
 * 目录（catalog.json）里只有分类与著者，**没有**书与书的关系：那是《总目》的提要
 * 才说的事，抽取时没取。故此处为长卷新撰一份关系表，与 `lineage.ts` 的诸子师承同例——
 * 取其大者、取其公认者，每条缀一句依据。方向明确、且源书已有正文者，还可进入
 * 人物回答的跨书证据池；并称与依托只供辨析，不作为人物立论的授权。
 *
 * 方向一律**源 → 流**：《论语》→《孟子》读作「孟子承论语」，《三国志》→《三国演义》
 * 读作「演义取材于志」。「驳」一类亦从此例：from 是被驳者，to 是发难者
 * （《论语》→《论衡》＝王充《问孔》难孔子），箭头所指即后出的那一方。
 *
 * 端点有两样写法。可读之书（已切正文者）用 `bookId`；存目之书（只著录于目者）
 * 用 `目:书名` —— 见下 `cunmuKey()`。
 *
 * 先前只连可读那七十七部，理由是「画一条通向点不开的书的线，徒惹人点」。这理由在
 * 存目之书作窄册而无题的时候还站得住：那时它在卷上只是一条灰条，连向它等于连向无名。
 * 如今一千零一十九部同宽同题，点之即见其著录（代、类、著者、关系），线便有了去处——
 * 而且这些线正是四库最要紧的一类：《周易》之下有《周易正义》《周易注》《东坡易传》，
 * 《资治通鉴》之后有《续资治通鉴》《长编》《拾补》。那七十七部是读得到的书，
 * 这千余部才是学问的实况；只连可读之书，等于说一部经只有经而无注。
 *
 * 端点认不出的边在 `sikuEdges()` 里静默滤去，这样日后 `siku_extract.py` 的 SELECT 增减，
 * 表不必同步改，只是少画几条线。存目之书日后若切了正文，它的 `目:书名` 认不出了，
 * 线会自己消失——故凡切书，须把表里那一端改作新的 `bookId`（`sikuLineage.test` 守着这一条）。
 *
 * ── 七型的判据 ─────────────────────────────────────────────
 * 分类只问一件事：**两部书之间实际传过去的是什么**。七型即七样东西，
 * 彼此不重，也不留缺口。
 *
 *   传注  传过去的是**解释**：以一经为对象，逐句释其训诂、解其名物，书不能离经独立。
 *         （判据：去其经，书不能成篇。）与「承学」之别在此，承学可自成一书。
 *   承学  传过去的是**学说**：祖述其义理、师法其家数，或承其体例而变之。
 *         （判据：能指认所承者为何说，而不止是同类。）
 *   取材  传过去的是**文与事**：征引成句、采摭旧事、用其人物故事为材。
 *         （判据：书中能检出可对应的文字或情节，义理上不必认同。）
 *   非难  传过去的是**争**：以之为对象而立异、纠谬、发难。
 *         （判据：有明确的诘难之辞，非泛泛异趣。）
 *   并称  什么也没传过去，是**后人并举**：同撰、同题、同源、同类，而书与书无承接。
 *         （判据：两书可以互不相知，并列只存于目录与评点之中。）
 *   相续  传过去的是**未竟之次**：接前书所止的年代、篇章、材料范围或故事继续撰写。
 *         （判据：后书明确自居为续编、后集、拾遗，离开前书便无所谓“续”。）
 *   依托  传过去的是**名**：后书托名前人、前书，而所托非其实。
 *         （判据：作者旧题某人／旧题某书所出，而四库与后世考订判为依托。
 *          辨伪是学者的动作，依托是两书之间的关系，故取「依托」为类名。）
 *
 * 依托与其余六型的界：
 *   · 承学是真的师承，依托是假的师承；判其真伪者，非文字之迹象，而是作者归属。
 *   · 取材是用其文，依托是用其名。若两事并见（既引其文、又冒其名，如《列子》之于《庄子》），
 *     以依托为主——因为冒名改变了这部书在谱系里的位置，取材只改变它的材料来源。
 *   · 并称是后人并举，依托是作者自己（或托者）自附，主体不同。
 *
 * 方向：依托一类仍守源→流，箭头所指始终是**托名的那一部**，而箭头所出，是足以坐实其
 * 所托不实的那一部——或同署一名（《说苑》→《列仙传》，所托者同是刘向），
 * 或文句实袭而自称在先（《庄子》→《列子》，书题列御寇，而立言多取庄周），
 * 或所标出于其中而自附其后（《论语》→《孔子家语》，自托孔壁旧记而杂采《论语》）。
 * 三例三条，恰是依托的三种形态：托名、托时、托源。
 *
 * 判据不全则不入表：只有「作者可疑」而无确实所托之书、可指其实者，不画线，
 * 疑义留在该书的著者项里（《国语》旧题左丘明、《管子》旧题管仲、《六韬》旧题吕望等，
 * 皆是先秦旧籍而作者难定，非有它书可托，故不入此型）。
 */

export type SikuRelType = "传" | "承" | "采" | "驳" | "并" | "续" | "托";

/**
 * 七种关系的笔色与线型。色取自诸子脉络图同一套（见 lineage.ts 的 EDGE_STYLE），两图一脉。
 * 依托取旧墨偏冷的一色、点线最疏——托名之书在卷上看着就「虚」些，与它标示的疑义相称。
 */
export const SIKU_REL: Record<
  SikuRelType,
  { color: string; dash: string; arrow: boolean; label: string; hint: string }
> = {
  传: { color: "#7a5c3a", dash: "4 3", arrow: true, label: "传注", hint: "为之作传、作记、释其训诂" },
  承: { color: "#3f6f6a", dash: "none", arrow: true, label: "承学", hint: "祖述其说，或承其体例而变之" },
  采: { color: "#9a7a2e", dash: "1 4", arrow: true, label: "取材", hint: "征引其文、取其事以为材" },
  驳: { color: "#9c3f2f", dash: "5 3", arrow: true, label: "非难", hint: "难其说、与之立异" },
  并: { color: "#7a5aa0", dash: "none", arrow: false, label: "并称", hint: "同撰、同题，或后世并举" },
  续: { color: "#4a5a8a", dash: "none", arrow: true, label: "相续", hint: "接其断限而续修" },
  托: { color: "#6b6f78", dash: "1 6", arrow: true, label: "依托", hint: "托名前人、前书，而所托非其实" },
};

export type SikuEdge = {
  from: string;
  to: string;
  type: SikuRelType;
  note: string;
  /** title＝由题名中的“注、续”等明确结构判定；其余为人工考订。 */
  basis?: "curated" | "title" | "zongmu" | "scholarly" | "primary";
  /** 可复核的原始证据；总目抽取边必须携带，不能只留模型判断。 */
  evidence?: {
    source: string;
    quote?: string;
    /** 西方典籍边多用学术来源的内容摘要，不把转述伪装成逐字引文。 */
    summary?: string;
    url?: string;
    confidence: "high" | "medium";
  };
};

import { reviewSikuEdges } from "./sikuLineageReview";

/**
 * 存目之书的端点记号：`目:书名`。
 *
 * 可读之书有 `bookId`（分片目录名），存目之书没有，须另给一个认得定的名。三样写法里取这一样：
 *   · **著录之次**（`存目#312`）—— 长卷里就地编号用的正是它，但它随目录增删而移位，
 *     手写的表第二天就指错了书，故不可入表。
 *   · **代·部·类·名** 四项全写 —— 认得极定，然而表上一行要写二十余字，长而少用。
 *   · 单写**名**（`目:水经注`）—— 取此一样，并备一个缀类的写法（`目:正史/宋史`）以应重名。
 *
 * 目下这一千零一十九部，**名名独一**，故表里的端点一概只写名，缀类的那一式是备而不用。
 * 先前一千零七十三部时有五十余处重名，故曾定下「同名者系在头一条上」之例；后来查明那些
 * 重名无一是两部书，全是**同一部书录了两遍**——或繁简两本（《晋书》与《晉書》、《辽史》与
 * 《遼史》），或逐字全同（《宋史》《金史》《明史》重出），或一书填了两个类目（《南岳小录》
 * 既入野史又入地理）。既是数据的重复而非书的歧义，就不该在卷上占两个位置、更不该在两者
 * 之间画一条「同书两录」的线，故于 `scripts/siku-dedup.mjs` 里并作一部（1073→1019）。
 * 重名既尽，「头一条为正」之例也就无用了。
 *
 * 日后若因目录增补而又生重名，缀类的写法仍在；而真有两部同名之书（非重复著录）者，
 * 则二者皆不入表——端点认不定一枚是不系线的（书画类曾有六部同题《论书》而皆代未详，
 * 即是此例，并作一部后只余一部）。
 *
 * 加「目:」一前缀，是为了与 `bookId` 分得开：bookId 皆拉丁小写，一眼看得出哪端是可读之书。
 */
export const cunmuKey = (title: string, category?: string) =>
  category ? `目:${category}/${title}` : `目:${title}`;

/** 端点：可读之书写 `bookId`（分片目录名），存目之书写 `目:书名`（见 `cunmuKey`）。 */
export const SIKU_EDGES: SikuEdge[] = [
  // —— 经部之内 ——
  { from: "yili", to: "liji", type: "传", note: "《礼记》为《仪礼》之记，汉儒辑以释经" },
  { from: "zhouli", to: "yili", type: "并", note: "周官、仪礼、礼记，后世并称三礼" },
  { from: "zuozhuan", to: "gongyang", type: "并", note: "春秋三传，同释一经而家法各异" },
  { from: "gongyang", to: "guliang", type: "并", note: "公羊、谷梁同出子夏之传，义例相近" },
  { from: "shijing", to: "erya", type: "传", note: "《尔雅》释诂释训，多本《诗》《书》之文" },
  { from: "shangshu", to: "erya", type: "传", note: "同上，古文奇字赖《尔雅》以通" },
  { from: "lunyu", to: "mengzi", type: "承", note: "孟子私淑孔子，道性善、言必称尧舜" },
  { from: "lunyu", to: "xiaojing", type: "承", note: "《孝经》发《论语》孝悌之旨，旧题曾子门人所记" },

  // —— 经 → 史 ——
  { from: "zuozhuan", to: "guoyu", type: "并", note: "旧题同出左丘明，一为传经、一为国别之语" },
  { from: "zuozhuan", to: "zizhitongjian", type: "承", note: "通鉴编年纪事，体本《春秋》《左传》" },

  // —— 经 → 子 ——
  { from: "lunyu", to: "xunzi", type: "承", note: "荀子宗孔子而非思孟，另立隆礼重法一路" },
  { from: "lunyu", to: "mozi", type: "驳", note: "墨子出于儒而背之，《非儒》难其厚葬久丧" },
  { from: "lunyu", to: "lunheng", type: "驳", note: "王充《问孔》，举《论语》前后自相牴牾者诘之" },
  { from: "mengzi", to: "lunheng", type: "驳", note: "王充《刺孟》，难孟子论天命、论齐王之说" },
  { from: "lunyu", to: "kongzijiayu", type: "托", note: "旧题孔安国撰、出孔壁，四库与丁晏《家语证伪》并判为王肃依托：杂采《论语》《礼记》《说苑》而成，而自附于孔门" },
  { from: "lunyu", to: "shuoyuan", type: "采", note: "刘向采儒家旧说成《说苑》，多孔门之事" },
  { from: "lunyu", to: "lvshichunqiu", type: "采", note: "吕览兼采儒墨名法，儒者之言居其一" },
  { from: "lunyu", to: "zhuziyulei", type: "承", note: "朱子论四书以《论语》为宗，语类半为其说" },
  { from: "zhuangzi", to: "liezi", type: "托", note: "书题列御寇，而文多袭《庄子》，《汤问》《说符》诸篇几于照录；四库疑为魏晋人依托" },
  { from: "mengzi", to: "chuanxilu", type: "承", note: "阳明致良知，本孟子良知良能之说" },
  { from: "gongyang", to: "chunqiufanlu", type: "承", note: "董仲舒治公羊，推阴阳灾异以说《春秋》" },
  { from: "zhouyi", to: "huainanzi", type: "采", note: "《淮南鸿烈》言天文时则，多本易象阴阳" },

  // —— 经 → 集 ——
  { from: "shijing", to: "chuci", type: "承", note: "风骚并举：楚人之辞承《诗》之变而别为一体" },
  { from: "shijing", to: "tangshisanbaishou", type: "承", note: "唐人近体，远绍风雅之遗" },
  { from: "shijing", to: "wenxindiaolong", type: "采", note: "《明诗》篇溯诗之源，举四始六义为本" },
  { from: "zhouyi", to: "wenxindiaolong", type: "采", note: "《原道》宗经，文之为德本于《易》之文言" },
  { from: "zuozhuan", to: "guwenguanzhi", type: "采", note: "《古文观止》卷一即选《左传》诸篇" },
  { from: "erya", to: "jinghuayuan", type: "采", note: "李汝珍精音韵训诂，书中诸回大谈小学" },

  // —— 史部之内 ——
  { from: "hanshu", to: "houhanshu", type: "续", note: "范晔续班书之断限，纪东汉一代" },
  { from: "sanguozhi", to: "houhanshu", type: "采", note: "范晔后出，汉末诸传多采陈寿之文" },
  { from: "guoyu", to: "zhanguoce", type: "承", note: "刘向集录，承《国语》国别记言之例" },
  { from: "hanshu", to: "zizhitongjian", type: "采", note: "通鉴两汉之卷，取材首在班书" },
  { from: "sanguozhi", to: "zizhitongjian", type: "采", note: "魏晋之卷本陈志并裴注所引诸书" },
  { from: "zhanguoce", to: "zizhitongjian", type: "采", note: "周秦之卷多本《战国策》" },

  // —— 史 ↔ 子 ——
  { from: "yanzi", to: "shuoyuan", type: "采", note: "刘向校《晏子》在前，《说苑》多载晏子谏事" },
  { from: "guiguzi", to: "zhanguoce", type: "采", note: "纵横捭阖之术，策士行之而其事见于《策》" },
  { from: "chunqiufanlu", to: "hanshu", type: "采", note: "《汉书·五行志》大段载董仲舒灾异之说" },

  // —— 子部之内：道 ——
  { from: "daodejing", to: "zhuangzi", type: "承", note: "庄子承老氏之学而恣纵其辞" },
  { from: "daodejing", to: "liezi", type: "承", note: "列御寇贵虚，与老庄同条共贯" },
  { from: "daodejing", to: "wenzi", type: "承", note: "旧题老子弟子，书多引「老子曰」" },
  { from: "shuoyuan", to: "liexianzhuan", type: "托", note: "旧题刘向撰，宋人已疑，《四库提要》谓或魏晋方士假托其名；所托者正是刘向，与《说苑》同署一人" },
  { from: "zhuangzi", to: "baopuzi", type: "承", note: "葛洪论金丹服食，远承庄列养生之旨" },

  // —— 子部之内：儒 ——
  { from: "xunzi", to: "chunqiufanlu", type: "承", note: "董生隆礼之论，于荀卿为近" },
  { from: "shuoyuan", to: "xinxu", type: "并", note: "刘向同时所编，体例相同，事多互见" },
  { from: "zhuziyulei", to: "chuanxilu", type: "驳", note: "阳明知行合一，正针朱子格物之说而发" },

  // —— 子部之内：法 ——
  { from: "guanzi", to: "shangjunshu", type: "承", note: "商君富国强兵之术，承管仲轻重之法" },
  { from: "guanzi", to: "hanfeizi", type: "承", note: "韩非溯法家之源，首及管仲" },
  { from: "shangjunshu", to: "hanfeizi", type: "承", note: "「法」取商君" },
  { from: "shenzi", to: "hanfeizi", type: "承", note: "「术」取申不害" },
  { from: "shenzi2", to: "hanfeizi", type: "承", note: "「势」取慎到" },
  { from: "xunzi", to: "hanfeizi", type: "承", note: "韩非师荀卿，性恶之说转为刑名" },
  { from: "daodejing", to: "hanfeizi", type: "承", note: "《解老》《喻老》两篇，以道论法" },
  { from: "shangjunshu", to: "yantielun", type: "驳", note: "桑弘羊本商君功利之术，贤良文学以儒义难之" },

  // —— 子部之内：名、墨、杂 ——
  { from: "dengxizi", to: "gongsunlongzi", type: "承", note: "公孙龙辩「白马非马」，承邓析两可之说" },
  { from: "dengxizi", to: "yinwenzi", type: "承", note: "尹文言形名，亦出于名辩一路" },
  { from: "gongsunlongzi", to: "yinwenzi", type: "并", note: "名家并称，同游稷下" },
  { from: "mozi", to: "lvshichunqiu", type: "采", note: "吕览《当染》《节丧》诸篇，显出墨家" },
  { from: "daodejing", to: "lvshichunqiu", type: "采", note: "《贵生》《情欲》本道家养生之说" },
  { from: "lvshichunqiu", to: "huainanzi", type: "承", note: "刘安集宾客著书，体例仿吕览而更宏" },
  { from: "zhuangzi", to: "huainanzi", type: "采", note: "《原道》《俶真》诸训，文多袭庄子" },
  { from: "chunqiufanlu", to: "lunheng", type: "驳", note: "《论衡》疾虚妄，正破天人感应之说" },
  { from: "zhuangzi", to: "shishuoxinyu", type: "采", note: "魏晋清谈本老庄，书中品藻多玄言" },

  // —— 子部之内：兵 ——
  { from: "simafa", to: "sunzi", type: "承", note: "孙武兵学承古司马兵法之遗，而弃其军礼" },
  { from: "sunzi", to: "sunbinfa", type: "承", note: "孙膑世传孙武之学" },
  { from: "sunzi", to: "wuzi", type: "并", note: "孙吴并称，后世论兵必举二子" },
  { from: "sunzi", to: "sanshiliuji", type: "采", note: "三十六计之目，语多本孙子虚实诡道" },
  { from: "liutao", to: "weiliaozi", type: "承", note: "尉缭权谋，于太公兵法为近" },
  { from: "liutao", to: "sanlue", type: "并", note: "六韬三略并称「韬略」，皆托之太公黄石" },

  // —— 子部之内：释、农 ——
  { from: "sishierzhangjing", to: "tanjing", type: "承", note: "释氏入华之始经，下启禅门顿悟之说" },
  { from: "tanjing", to: "wudenghuiyuan", type: "承", note: "五灯叙禅宗灯录，源头正在六祖" },
  { from: "tanjing", to: "liaofansixun", type: "采", note: "了凡立命之说，本佛家因果而杂以儒行" },
  { from: "qiminyaoshu", to: "tiangongkaiwu", type: "承", note: "农工之书相承，由耕织而遍及百工" },

  // —— 史 → 集 ——
  { from: "sanguozhi", to: "sanguoyanyi", type: "采", note: "七实三虚：人物始末一依陈志" },
  { from: "zizhitongjian", to: "sanguoyanyi", type: "采", note: "叙次先后多本通鉴，兼采《通鉴纲目》之褒贬" },
  { from: "zhanguoce", to: "guwenguanzhi", type: "采", note: "卷四选《战国策》诸篇" },
  { from: "guoyu", to: "guwenguanzhi", type: "采", note: "卷三选《国语》诸篇" },

  // —— 子 → 集 ——
  { from: "tanjing", to: "xiyouji", type: "采", note: "心猿意马之语出禅门，取经即修心之喻" },
  { from: "baopuzi", to: "xiyouji", type: "采", note: "金丹炉火、服食延年，皆丹家旧说" },
  { from: "zhuangzi", to: "honglou", type: "采", note: "第二十一回宝玉续《南华·胠箧》" },
  { from: "tanjing", to: "honglou", type: "采", note: "第二十二回听曲文悟禅机，偈语本坛经" },
  { from: "shishuoxinyu", to: "liaozhai", type: "承", note: "笔记一体，志人而后志怪" },
  { from: "shishuoxinyu", to: "rulinwaishi", type: "承", note: "品题人物之笔，下启儒林诸儒之写照" },

  // —— 集部之内 ——
  { from: "shanhaijing", to: "fengshen", type: "采", note: "封神诸神诸兽，形貌多出《山海经》" },
  { from: "shanhaijing", to: "xiyouji", type: "采", note: "西行所历山海异物，亦取其名状" },
  { from: "shanhaijing", to: "jinghuayuan", type: "采", note: "海外三十余国，多本《海外经》诸篇" },
  { from: "shanhaijing", to: "liaozhai", type: "承", note: "志怪之祖，聊斋承其绪而归于人情" },
  { from: "fengshen", to: "xiyouji", type: "并", note: "明代神魔小说之两大部" },
  { from: "shuihu", to: "sanguoyanyi", type: "并", note: "章回之祖，施罗并称" },
  { from: "chuci", to: "wenxindiaolong", type: "采", note: "《辨骚》篇专论屈宋，谓其「取镕经意，自铸伟辞」" },
  { from: "chuci", to: "tangshisanbaishou", type: "承", note: "骚人之绪，下被唐人歌行" },
  { from: "wenxindiaolong", to: "shipin", type: "并", note: "两书一论文、一论诗，后世并称六朝文学批评双璧", basis: "zongmu", evidence: { source: "《四库全书总目提要·诗品提要》", quote: "与《文心雕龙》并称", confidence: "high" } },
  { from: "wenxindiaolong", to: "renjiancihua", type: "承", note: "论文之统，至静安而立「境界」之目" },
  { from: "shipin", to: "renjiancihua", type: "承", note: "品第之法相承，由诗及词" },

  // ══ 以下系存目之书（端点作 `目:书名`）════════════════════════════════
  //
  // 四库著录千余部而可读者七十七，故要紧的关系大半在存目一边：一部经之下的注疏、
  // 一部通鉴之后的续作，都只著录于目。此处所取，皆有定本可指、源流无疑者；
  // 泛泛同类、或只「疑其相关」者，照旧不入表（判据不全则不入表）。

  // —— 十三经注疏：十三部注疏各释一经，经不可离，正是传注之型 ——
  // （「去其经，书不能成篇」——注疏之书逐句附经而行，判据最明。
  //   十三经注疏之目本有《毛诗正义》，而目录此类只著录十三部，《诗》之正义不在其中，
  //   故《诗经》一枝此处无线可系——表只认目录里实有的书。）
  { from: "zhouyi", to: cunmuKey("周易正义"), type: "传", note: "孔颖达疏，用王弼注而为之正义，唐人定为明经之本" },
  { from: "shangshu", to: cunmuKey("尚书正义"), type: "传", note: "孔颖达疏，本伪孔安国传而疏之" },
  { from: "zhouli", to: cunmuKey("周礼注疏"), type: "传", note: "贾公彦疏郑玄注，释周官之制" },
  { from: "yili", to: cunmuKey("仪礼注疏"), type: "传", note: "贾公彦疏郑玄注，仪节赖之以明" },
  { from: "liji", to: cunmuKey("礼记正义"), type: "传", note: "孔颖达疏郑玄注，三礼之疏惟此最详" },
  { from: "zuozhuan", to: cunmuKey("春秋左传正义"), type: "传", note: "孔颖达疏杜预集解，左氏之学自此定" },
  { from: "gongyang", to: cunmuKey("春秋公羊传注疏"), type: "传", note: "徐彦疏何休解诂，公羊家法所传" },
  { from: "guliang", to: cunmuKey("春秋谷梁传注疏"), type: "传", note: "杨士勋疏范宁集解" },
  { from: "lunyu", to: cunmuKey("论语注疏"), type: "传", note: "邢昺疏何晏集解，宋人定为正疏" },
  { from: "xiaojing", to: cunmuKey("孝经注疏"), type: "传", note: "邢昺疏唐玄宗御注" },
  { from: "erya", to: cunmuKey("尔雅注疏"), type: "传", note: "邢昺疏郭璞注，训诂之津梁" },
  { from: "mengzi", to: cunmuKey("孟子注疏"), type: "传", note: "旧题孙奭疏赵岐注，宋升孟子入经，疏乃并列十三" },
  // 朱子四书之二：虽亦附经逐章而释，然立说自成一家（义理不同于汉唐之训诂），
  // 故仍判传注——判据在「去其经，书不能成篇」，不在说之新旧。
  { from: "lunyu", to: cunmuKey("论语集注"), type: "传", note: "朱熹集注，章句之外兼采二程诸儒之说" },
  { from: "mengzi", to: cunmuKey("孟子集注"), type: "传", note: "朱熹集注，与论语集注并为四书之二" },

  // —— 经学其他：一经之下的别家之注 ——
  { from: "zhouyi", to: cunmuKey("周易注"), type: "传", note: "王弼注，扫象数而说以义理，易学自此一变" },
  { from: "zhouyi", to: cunmuKey("周易略例"), type: "承", note: "王弼自撰以明其注例，发「得意忘象」之旨" },
  { from: "zhouyi", to: cunmuKey("周易集解"), type: "传", note: "李鼎祚集汉魏以来三十余家之注，存象数一路" },
  { from: "zhouyi", to: cunmuKey("周易郑康成注"), type: "传", note: "宋王应麟辑郑玄易注之佚文，汉易赖此以存" },
  { from: "zhouyi", to: cunmuKey("东坡易传"), type: "传", note: "苏氏父子之易，以人事说卦爻" },
  { from: cunmuKey("周易郑康成注"), to: cunmuKey("新本郑氏周易"), type: "承", note: "惠栋重辑郑注，补订王应麟之本" },
  { from: "zhouyi", to: cunmuKey("周易参同契"), type: "托", note: "魏伯阳借易之卦爻纳甲言炉火丹法，四库入之道家：所托者易之名，非易之学" },
  { from: "shangshu", to: cunmuKey("尚书大传"), type: "传", note: "旧题伏生所传，杂记书说，汉初今文之绪" },
  { from: "liji", to: cunmuKey("大戴礼记"), type: "并", note: "戴德、戴圣各传礼记，一大一小，后世并举" },
  { from: "shijing", to: cunmuKey("韩诗外传"), type: "采", note: "韩婴引诗以证事，每章引诗一二句而说之，非释经" },
  { from: "mengzi", to: cunmuKey("孟子字义疏证"), type: "驳", note: "戴震逐条疏孟子字义，以难宋儒理在气先之说" },
  { from: cunmuKey("论语集注"), to: cunmuKey("四书章句集注"), type: "并", note: "朱子四书之合刻，大学中庸章句与论孟集注并为一编" },
  { from: cunmuKey("四书章句集注"), to: cunmuKey("大学章句"), type: "并", note: "四书之一，朱子分经一章传十章" },
  { from: cunmuKey("四书章句集注"), to: cunmuKey("中庸章句"), type: "并", note: "四书之一，朱子序其为孔门传授心法" },
  { from: cunmuKey("四书章句集注"), to: cunmuKey("孟子字义疏证"), type: "驳", note: "东原所难，正是四书集注一系之义理" },

  // —— 史部：通鉴一系的续作，正是相续之型 ——
  // （「纪事首尾相接，续书不自起炉灶」——此四部皆接通鉴之断限。）
  { from: "zizhitongjian", to: cunmuKey("续资治通鉴长编"), type: "续", note: "李焘接通鉴所止之治平，编年记北宋九朝" },
  { from: "zizhitongjian", to: cunmuKey("续资治通鉴"), type: "续", note: "毕沅续记宋元两代，上接通鉴之末" },
  { from: cunmuKey("续资治通鉴长编"), to: cunmuKey("续资治通鉴长编拾补"), type: "续", note: "黄以周辑补李焘原书之阙卷" },
  { from: "zizhitongjian", to: cunmuKey("资治通鉴全译"), type: "传", note: "今人逐句译注，不离原文而行" },
  { from: "houhanshu", to: cunmuKey("后汉书 李贤注"), type: "传", note: "唐章怀太子李贤集诸儒注范书，后世通行之注本" },
  { from: "yanzi", to: cunmuKey("晏子春秋集释"), type: "传", note: "吴则虞集历代之释，校其异文" },

  // —— 子部：诸子之集释、集解 ——
  { from: "zhuangzi", to: cunmuKey("庄子集释"), type: "传", note: "郭庆藩集郭象注、成玄英疏及诸家训诂于一编" },
  { from: "zhuangzi", to: cunmuKey("庄子集解"), type: "传", note: "王先谦集解，简明而便读" },
  { from: cunmuKey("庄子集释"), to: cunmuKey("庄子集解"), type: "并", note: "清人治庄之两部，一详一简，后世并举" },
  { from: "zhuangzi", to: cunmuKey("庄子·内篇"), type: "并", note: "内七篇别行之本，内外杂之分自刘向、郭象已然" },
  { from: "liezi", to: cunmuKey("列子集释"), type: "传", note: "杨伯峻集释，并辑历代辨其依托之说" },
  { from: "mozi", to: cunmuKey("墨子闲诂"), type: "传", note: "孙诒让诂墨，墨学自此可读" },
  { from: "mozi", to: cunmuKey("墨子城守各篇简注"), type: "传", note: "岑仲勉专注备城门以下诸篇，墨家守御之术" },
  { from: "mozi", to: cunmuKey("墨子白话今译"), type: "传", note: "今人语译，逐篇附原文" },
  { from: "guanzi", to: cunmuKey("管子轻重篇新诠"), type: "传", note: "马非百诠轻重诸篇，管子之经济之论" },
  { from: "guiguzi", to: cunmuKey("鬼谷子本经阴符七术"), type: "托", note: "七术之篇托鬼谷之名而言养神蓄锐，与捭阖诸篇文体判然，四库疑为后人附益" },
  { from: "liutao", to: cunmuKey("六韬(注释本)"), type: "传", note: "今人注释，附原文而行" },
  { from: "lunyu", to: cunmuKey("论语(英译本)"), type: "传", note: "逐章对译，不离原文" },
  { from: "lunyu", to: cunmuKey("定州汉墓竹简《论语"), type: "并", note: "八角廊汉简本与今本并存，章次文字可互校" },

  // —— 集部：骚、文、诗之注与续 ——
  { from: "chuci", to: cunmuKey("楚辞补註"), type: "传", note: "洪兴祖补王逸章句之所未备，楚辞之通行注本" },
  { from: "chuci", to: cunmuKey("楚辞章句疏证"), type: "传", note: "今人疏证王逸章句，考其训释之所本" },
  { from: cunmuKey("楚辞补註"), to: cunmuKey("楚辞章句疏证"), type: "并", note: "补注与疏证，皆为王逸章句而作" },
  { from: "wenxindiaolong", to: cunmuKey("文心雕龙译注"), type: "传", note: "今人译注，逐篇附原文" },
  { from: "wenxindiaolong", to: cunmuKey("文心雕龙考异"), type: "传", note: "校雕龙之异文，不立新说" },
  { from: "shipin", to: cunmuKey("二十四诗品"), type: "承", note: "旧题司空图，承品诗之例而别为二十四品之目" },
  { from: cunmuKey("二十四诗品"), to: cunmuKey("续诗品"), type: "续", note: "袁枚自序续司空图之未尽，三十二首以补其目" },
  { from: "xiyouji", to: cunmuKey("西游记传"), type: "并", note: "朱鼎臣本与世德堂本同出西游一系，详略不同而非相承" },

  // ══ 正史：二十四史之相接与同修 ══════════════════════════════════════
  //
  // 正史之序，是目录里断限最分明的一族：一代之史纪一代之事，合之自《史记》迄《清史稿》
  // 首尾相贯。此族先前一条线也没有——《宋史》《金史》《明史》等七部在目录里著录了两遍，
  // 旧规判作「认不定一枚」而一概不入表；查明那七处逐字全同（同一部书录了两遍，非两部书），
  // 乃系在头一条上（见 `cunmuKey` 下所记）。
  //
  // 系线之际有一事须辨：**正史之序是所纪之代的序，不是成书之序。**《宋书》成于南朝梁，
  // 而《晋书》修于唐初；《三国志》出陈寿之手在西晋，而《后汉书》范晔乃南朝宋人。
  // 「相续」一型的判据是「接前书所止之年而续记」，须后出之书接先出之书——
  // 故只在**所纪之代相接、而成书又在其后**的两部之间画相续：
  //   《史记》→《汉书》（班固自言继太史公）、《汉书》→《后汉书》、《三国志》→《晋书》、
  //   《宋书》→《南齐书》、《南齐书》→《梁书》、《魏书》→《北齐书》、《隋书》→《旧唐书》……
  // 《后汉书》与《三国志》之间不画相续：陈寿先出，范晔反采其文，其间所传是文而非断限
  // （上文史部之内已有「《三国志》→《后汉书》取材」一条）。《晋书》与《宋书》同此，
  // 断限虽接而先出者在后，无可指之所承，故不画。
  //
  // 贞观同诏所修的五部（梁、陈、北齐、周、隋）作「并称」而不作相续：五书同时并出，
  // 彼此不相为续。一事两修者（新旧唐书、新旧五代史、元史与新元史）亦作并称——
  // 后出之书不接前书之断限而是另修同一段，所传非断限而是后人并举。
  { from: cunmuKey("三家注史记"), to: "hanshu", type: "续", note: "班固自言继太史公之书，断自高祖迄王莽，纪西汉一代" },
  { from: "sanguozhi", to: cunmuKey("晋书"), type: "续", note: "唐修晋书接三国之末而纪两晋，后出而续其断限" },
  { from: cunmuKey("宋书"), to: cunmuKey("南齐书"), type: "续", note: "萧子显纪南齐一代，接沈约宋书所止之年" },
  { from: cunmuKey("南齐书"), to: cunmuKey("梁书"), type: "续", note: "姚思廉纪萧梁一代，接南齐之末" },
  { from: cunmuKey("魏书"), to: cunmuKey("北齐书"), type: "续", note: "李百药纪北齐一代，接魏收书所止之年" },
  { from: cunmuKey("隋书"), to: cunmuKey("旧唐书"), type: "续", note: "五代刘昫等纪唐一代，接隋之末" },
  { from: cunmuKey("旧唐书"), to: cunmuKey("旧五代史"), type: "续", note: "薛居正等纪梁唐晋汉周五代，接唐之末" },
  { from: cunmuKey("旧五代史"), to: cunmuKey("宋史"), type: "续", note: "元修宋史，接五代之末而纪两宋" },
  { from: cunmuKey("宋史"), to: cunmuKey("元史"), type: "续", note: "明初修元史，接宋之末" },
  { from: cunmuKey("元史"), to: cunmuKey("明史"), type: "续", note: "清修明史，接元之末" },
  { from: cunmuKey("明史"), to: cunmuKey("清史稿"), type: "续", note: "民国初修清史稿，接明之末，二十四史之后一部" },
  // 贞观五代史：同诏同时而成，彼此并出
  { from: cunmuKey("梁书"), to: cunmuKey("陈书"), type: "并", note: "姚思廉一手所撰，梁陈二书同出贞观之诏" },
  { from: cunmuKey("陈书"), to: cunmuKey("隋书"), type: "并", note: "贞观同修五代史，南北并出而隋书总其末" },
  { from: cunmuKey("北齐书"), to: cunmuKey("周书"), type: "并", note: "北齐、北周分据东西，两书同修于贞观" },
  { from: cunmuKey("周书"), to: cunmuKey("隋书"), type: "并", note: "同上，隋承周祚而二书同出一诏" },
  // 一事两修
  { from: cunmuKey("旧唐书"), to: cunmuKey("新唐书"), type: "并", note: "欧阳修、宋祁重修唐史，新旧两唐书并行" },
  { from: cunmuKey("旧五代史"), to: cunmuKey("新五代史"), type: "并", note: "欧阳修别修五代史，新旧两史并行" },
  { from: cunmuKey("元史"), to: cunmuKey("新元史"), type: "并", note: "柯绍忞病元史之疏，别为新元史，两书并举" },
  { from: cunmuKey("宋史"), to: cunmuKey("辽史"), type: "并", note: "元至正同诏修宋辽金三史，分纪并立之三朝" },
  { from: cunmuKey("辽史"), to: cunmuKey("金史"), type: "并", note: "同上，辽金二史同修于元" },
  // 南北二史：删八书之繁而成，取其文
  { from: cunmuKey("宋书"), to: cunmuKey("南史"), type: "采", note: "李延寿并宋齐梁陈四书为南史，删繁就简而文多取诸旧书" },
  { from: cunmuKey("梁书"), to: cunmuKey("南史"), type: "采", note: "同上，南史梁代诸传多本姚思廉之文" },
  { from: cunmuKey("魏书"), to: cunmuKey("北史"), type: "采", note: "北史魏代诸传本魏收书而有所刊落" },
  { from: cunmuKey("隋书"), to: cunmuKey("北史"), type: "采", note: "北史末卷纪隋，取材于贞观所修之隋书" },
  { from: cunmuKey("南史"), to: cunmuKey("北史"), type: "并", note: "南北二史同出李延寿，分纪南北而相配成书" },
  // 注本与辑本
  { from: "hanshu", to: cunmuKey("漢書 顏師古注"), type: "传", note: "颜师古集前人二十余家之注，汉书赖此以通" },
  { from: "houhanshu", to: cunmuKey("八家后汉书辑注"), type: "采", note: "辑范书以前八家旧本之佚文，可校范书之所本" },
  { from: cunmuKey("晋书"), to: cunmuKey("九家旧晋书辑本"), type: "采", note: "辑唐修晋书以前九家旧本，考其所据" },
  { from: cunmuKey("晋书"), to: cunmuKey("众家编年体晋史"), type: "采", note: "辑诸家编年之晋史，与纪传之晋书相参" },
  { from: cunmuKey("魏晋世语"), to: cunmuKey("晋书"), type: "采", note: "郭颁旧记，唐修晋书采其事" },
  { from: cunmuKey("东观汉记校注"), to: "houhanshu", type: "采", note: "东观旧记为东汉国史，范书多本之" },
  { from: cunmuKey("献帝春秋"), to: "houhanshu", type: "采", note: "袁晔纪献帝一朝，汉末诸传采其说" },
  { from: cunmuKey("九州春秋"), to: "sanguozhi", type: "采", note: "司马彪记汉末州郡之乱，陈志裴注引之" },

  // ══ 编年：通鉴之前与通鉴之外 ════════════════════════════════════════
  { from: "hanshu", to: cunmuKey("前汉纪"), type: "承", note: "荀悦奉诏以班书改编为纪年，纪传之史自此有编年之体" },
  { from: "houhanshu", to: cunmuKey("后汉纪校注"), type: "承", note: "袁宏仿荀悦之例，为东汉作编年" },
  { from: cunmuKey("前汉纪"), to: cunmuKey("后汉纪校注"), type: "并", note: "两汉纪前后相配，编年之体由此立" },
  { from: cunmuKey("前汉纪"), to: "zizhitongjian", type: "承", note: "通鉴之编年，体自两汉纪一脉相承" },
  { from: cunmuKey("竹书纪年"), to: cunmuKey("今本竹书纪年疏证"), type: "传", note: "王国维疏证今本，逐条考其所袭" },
  { from: cunmuKey("竹书纪年"), to: cunmuKey("古本竹书纪年辑证"), type: "采", note: "辑古书所引之竹书旧文，以别于今本" },
  { from: cunmuKey("今本竹书纪年疏证"), to: cunmuKey("古本竹书纪年辑证"), type: "并", note: "今本古本两途，一疏证一辑佚，治纪年者并观" },
  { from: cunmuKey("十六国春秋"), to: cunmuKey("十六国春秋别本"), type: "并", note: "崔鸿原书久佚，明人别本与辑本并行" },
  { from: cunmuKey("十六国春秋"), to: cunmuKey("十六国春秋别传"), type: "并", note: "同上，别传亦出后人缀辑" },
  { from: cunmuKey("晋书"), to: cunmuKey("十六国春秋"), type: "采", note: "崔鸿专纪五胡十六国，补晋书载记之略" },

  // ══ 史评：史法之论 ════════════════════════════════════════════════
  { from: "zizhitongjian", to: cunmuKey("读通鉴论"), type: "驳", note: "王夫之逐条论通鉴所纪，多与温公异议" },
  { from: cunmuKey("宋史"), to: cunmuKey("宋论"), type: "驳", note: "船山论宋一代之得失，立说与史家之褒贬不同" },
  { from: cunmuKey("读通鉴论"), to: cunmuKey("宋论"), type: "并", note: "船山史论两部，一论通鉴一论宋事" },
  { from: cunmuKey("史通"), to: cunmuKey("文史通义"), type: "承", note: "章学诚承刘知几论史之统，而推及文与校雠" },
  { from: cunmuKey("史通"), to: cunmuKey("廿二史札记"), type: "承", note: "赵翼考史之法，远承史通辨体之例" },
  { from: cunmuKey("三家注史记"), to: cunmuKey("史通"), type: "驳", note: "刘知几议史法，于史汉之体例多所纠弹" },

  // ══ 政书、地理、目录 ════════════════════════════════════════════
  { from: cunmuKey("通典"), to: cunmuKey("文献通考"), type: "承", note: "马端临承杜佑分门叙制之例，而详于宋事" },
  { from: cunmuKey("唐六典"), to: cunmuKey("唐律疏议"), type: "并", note: "唐之官制与刑律，典章之两面" },
  { from: cunmuKey("唐六典"), to: cunmuKey("通典"), type: "采", note: "杜佑叙唐制，职官一门多本六典" },
  { from: cunmuKey("唐会要"), to: cunmuKey("通典"), type: "并", note: "会要与通典同纪典章，一以事类一以门类" },
  { from: cunmuKey("东京梦华录"), to: cunmuKey("武林旧事"), type: "承", note: "周密纪临安之盛，体仿孟元老记汴京" },
  { from: cunmuKey("东京梦华录"), to: cunmuKey("梦粱录"), type: "承", note: "吴自牧记南宋都城，亦承梦华录之例" },
  { from: cunmuKey("东京梦华录"), to: cunmuKey("都城纪胜"), type: "承", note: "同上，皆都城风物之记" },
  { from: cunmuKey("佛国记"), to: cunmuKey("大唐西域记"), type: "承", note: "玄奘西行之记，承法显求法之绪而详于地志" },
  { from: cunmuKey("水经注"), to: cunmuKey("读史方舆纪要"), type: "采", note: "顾祖禹考历代疆域沿革，水道多本郦注" },
  { from: cunmuKey("四库全书总目提要"), to: cunmuKey("书目答问"), type: "承", note: "张之洞为学者指书，分类之法本四库" },
  { from: cunmuKey("崇文总目"), to: cunmuKey("郡斋读书志"), type: "承", note: "晁公武承宋廷书目之例而各为之解题" },
  { from: cunmuKey("郡斋读书志"), to: cunmuKey("四库全书总目提要"), type: "承", note: "四库提要之解题，远承郡斋读书志一路" },

  // ══ 总集：分代之编与选本之所取 ══════════════════════════════════════
  //
  // 总集一类，判据最明白：**书中能检出可对应的文字**——选本所选者出自何书，
  // 分代之编所辑者及何代，皆可按卷而稽。故此族系线不须推论，只须点出所取。
  //
  // 严可均《全上古三代秦汉三国六朝文》分代为编，目录里著录作十五部（全上古三代文、
  // 全秦文……全隋文、先唐文）。十五部同撰同题，彼此不相为续，故一概作并称，
  // 依代次串成一线，使卷上看得出它本是一部书的十五截。
  { from: cunmuKey("全唐文"), to: cunmuKey("全上古三代文"), type: "承", note: "嘉庆诏修全唐文既成，严可均谓唐以前文无总集，乃辑上古迄隋之文以补其前" },
  { from: cunmuKey("全上古三代文"), to: cunmuKey("全秦文"), type: "并", note: "严氏分代之编，上古三代之后次以秦" },
  { from: cunmuKey("全秦文"), to: cunmuKey("全汉文"), type: "并", note: "同出严氏一书，秦后次汉" },
  { from: cunmuKey("全汉文"), to: cunmuKey("全后汉文"), type: "并", note: "同上，西汉之后次东汉" },
  { from: cunmuKey("全后汉文"), to: cunmuKey("全三国文"), type: "并", note: "同上，后汉之后次三国" },
  { from: cunmuKey("全三国文"), to: cunmuKey("全晋文"), type: "并", note: "同上，三国之后次两晋" },
  { from: cunmuKey("全晋文"), to: cunmuKey("全宋文"), type: "并", note: "同上，晋后次刘宋，南朝之始" },
  { from: cunmuKey("全宋文"), to: cunmuKey("全齐文"), type: "并", note: "同上，宋后次南齐" },
  { from: cunmuKey("全齐文"), to: cunmuKey("全梁文"), type: "并", note: "同上，齐后次萧梁" },
  { from: cunmuKey("全梁文"), to: cunmuKey("全陈文"), type: "并", note: "同上，梁后次南陈，南朝之末" },
  { from: cunmuKey("全陈文"), to: cunmuKey("全后魏文"), type: "并", note: "同上，南朝既讫，次以北朝之元魏" },
  { from: cunmuKey("全后魏文"), to: cunmuKey("全北齐文"), type: "并", note: "同上，后魏之后次北齐" },
  { from: cunmuKey("全北齐文"), to: cunmuKey("全后周文"), type: "并", note: "同上，北齐之外次北周" },
  { from: cunmuKey("全后周文"), to: cunmuKey("全隋文"), type: "并", note: "同上，北周之后次隋，严氏之编至此而讫" },
  { from: cunmuKey("全隋文"), to: cunmuKey("先唐文"), type: "并", note: "严氏编末别为先唐文一卷，收不能定代之篇" },
  { from: cunmuKey("全唐文"), to: cunmuKey("唐文拾遗"), type: "承", note: "陆心源承全唐文之例而拾其所漏，补文七十二卷" },
  { from: cunmuKey("唐文拾遗"), to: cunmuKey("唐文续拾"), type: "续", note: "陆心源先成拾遗、后作续拾，接续补全《全唐文》未收篇目" },

  // 选本之所取
  { from: cunmuKey("全唐诗"), to: "tangshisanbaishou", type: "采", note: "蘅塘退士就全唐诗中择易诵易解者三百余首为家塾课本" },
  { from: cunmuKey("乐府古题要解"), to: cunmuKey("乐府诗集"), type: "采", note: "郭茂倩分类解题，多本吴兢要解之说" },
  { from: cunmuKey("乐府诗集"), to: cunmuKey("先秦汉魏晋南北朝诗"), type: "采", note: "逯钦立辑唐前之诗，乐府一门取诸郭氏之集" },
  { from: cunmuKey("昭明文选"), to: cunmuKey("文选"), type: "并", note: "同书两录，一题昭明、一题文选" },
  { from: cunmuKey("文选"), to: cunmuKey("六朝文絜"), type: "采", note: "许梿选六朝骈俪之文，所取多见于文选" },
  { from: cunmuKey("文选"), to: cunmuKey("古诗源"), type: "采", note: "沈德潜溯诗之源，汉魏六朝之作多采文选所录" },
  { from: cunmuKey("昭明文选"), to: "guwenguanzhi", type: "并", note: "选文之书前后两部：昭明选六朝以前，观止选周秦以下，皆塾中通行之本" },
  { from: cunmuKey("千家诗"), to: cunmuKey("宋诗一百首"), type: "并", note: "宋诗之选本，一旧一新，皆取其便于诵习" },
  { from: cunmuKey("全唐五代词"), to: cunmuKey("宋词三百首"), type: "并", note: "词之断代选本，一辑唐五代、一选两宋" },

  // ══ 集：名篇之入选本 ════════════════════════════════════════════════
  //
  // 目录别集一类有百余部是**单篇**（《陈情表》《桃花源记》《前赤壁赋》之属），不是一家之集。
  // 这些篇的流向最可按稽：它们之所以传，正因入了《文选》与《古文观止》——两部塾中通行的
  // 选本。故一篇一条作取材，源在篇，流在选本；凡选本实未收者不画（《古文观止》不选《爱莲说》
  // 《滕王阁序》，柳文取《钴鉧潭西小丘记》《小石城山记》而不取《小石潭记》，皆无线）。
  { from: cunmuKey("陈情表"), to: "guwenguanzhi", type: "采", note: "李密陈情表，古文观止卷七所选" },
  { from: cunmuKey("归去来辞"), to: "guwenguanzhi", type: "采", note: "陶潜归去来辞，古文观止卷七所选" },
  { from: cunmuKey("桃花源记"), to: "guwenguanzhi", type: "采", note: "陶潜桃花源记，古文观止卷七所选" },
  { from: cunmuKey("兰亭集序"), to: "guwenguanzhi", type: "采", note: "王羲之兰亭集序，古文观止卷七所选" },
  { from: cunmuKey("前出师表"), to: "guwenguanzhi", type: "采", note: "诸葛亮前表，古文观止卷六所选" },
  { from: cunmuKey("后出师表"), to: "guwenguanzhi", type: "采", note: "诸葛亮后表，与前表并入古文观止卷六" },
  { from: cunmuKey("师说"), to: "guwenguanzhi", type: "采", note: "韩愈师说，古文观止卷八所选" },
  { from: cunmuKey("杂说"), to: "guwenguanzhi", type: "采", note: "韩愈杂说，古文观止卷八所选" },
  { from: cunmuKey("送董生邵南序"), to: "guwenguanzhi", type: "采", note: "韩愈送董邵南序，古文观止卷八所选" },
  { from: cunmuKey("吊古战场文"), to: "guwenguanzhi", type: "采", note: "李华吊古战场文，古文观止卷七所选" },
  { from: cunmuKey("醉翁亭记"), to: "guwenguanzhi", type: "采", note: "欧阳修醉翁亭记，古文观止卷十所选" },
  { from: cunmuKey("读孟尝君传"), to: "guwenguanzhi", type: "采", note: "王安石读孟尝君传，古文观止卷十一所选" },
  { from: cunmuKey("前赤壁赋"), to: "guwenguanzhi", type: "采", note: "苏轼前赤壁赋，古文观止卷十一所选" },
  { from: cunmuKey("洛神赋"), to: cunmuKey("文选"), type: "采", note: "曹植洛神赋，文选卷十九所录" },
  { from: cunmuKey("登楼赋"), to: cunmuKey("文选"), type: "采", note: "王粲登楼赋，文选卷十一所录" },
  { from: cunmuKey("归田赋"), to: cunmuKey("文选"), type: "采", note: "张衡归田赋，文选卷十五所录" },
  { from: cunmuKey("长门赋"), to: cunmuKey("文选"), type: "采", note: "旧题司马相如长门赋，文选卷十六所录" },
  { from: cunmuKey("思旧赋并序"), to: cunmuKey("文选"), type: "采", note: "向秀思旧赋，文选卷十六所录" },
  { from: cunmuKey("秋兴赋并序"), to: cunmuKey("文选"), type: "采", note: "潘岳秋兴赋，文选卷十三所录" },
  { from: cunmuKey("酒德颂"), to: cunmuKey("文选"), type: "采", note: "刘伶酒德颂，文选卷四十七所录" },
  { from: cunmuKey("与山巨源绝交书"), to: cunmuKey("文选"), type: "采", note: "嵇康与山涛书，文选卷四十三所录" },
  { from: cunmuKey("古诗十九首"), to: cunmuKey("文选"), type: "采", note: "古诗十九首之目即出文选卷二十九，前此无此总名" },
  { from: cunmuKey("陈情表"), to: cunmuKey("文选"), type: "采", note: "陈情表亦见文选卷三十七，表之一类" },
  { from: cunmuKey("归去来辞"), to: cunmuKey("文选"), type: "采", note: "归去来辞亦见文选卷四十五，辞之一类" },
  { from: cunmuKey("前出师表"), to: cunmuKey("文选"), type: "采", note: "前表亦见文选卷三十七，与陈情表同类" },
  { from: cunmuKey("孔雀东南飞"), to: cunmuKey("玉台新咏"), type: "采", note: "此诗赖玉台新咏卷一而存，题作古诗为焦仲卿妻作" },
  { from: cunmuKey("孔雀东南飞"), to: cunmuKey("乐府诗集"), type: "采", note: "郭茂倩收入杂曲歌辞，与玉台新咏所录互校" },

  // ══ 集：别集之与总集、一人之两集 ══════════════════════════════════
  //
  // 唐人诗之别集皆《全唐诗》所据，与词一族同理；一人而目中两录（一全集一选本）者作并称。
  { from: cunmuKey("李白诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "李白诗之别集，全唐诗太白一家所据" },
  { from: cunmuKey("杜甫诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "杜甫诗之别集，全唐诗少陵一家所据" },
  { from: cunmuKey("王维诗集"), to: cunmuKey("全唐诗"), type: "采", note: "王维诗之别集，全唐诗摩诘一家所据" },
  { from: cunmuKey("白居易诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "白居易诗之别集，全唐诗乐天一家所据" },
  { from: cunmuKey("李贺诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "李贺诗之别集，全唐诗长吉一家所据" },
  { from: cunmuKey("李义山诗集"), to: cunmuKey("全唐诗"), type: "采", note: "李商隐诗之别集，全唐诗义山一家所据" },
  { from: cunmuKey("孟郊集"), to: cunmuKey("全唐诗"), type: "采", note: "孟郊诗之别集，全唐诗东野一家所据" },
  { from: cunmuKey("岑参集"), to: cunmuKey("全唐诗"), type: "采", note: "岑参诗之别集，全唐诗嘉州一家所据" },
  { from: cunmuKey("陈子昂诗集"), to: cunmuKey("全唐诗"), type: "采", note: "陈子昂诗之别集，全唐诗伯玉一家所据" },
  { from: cunmuKey("崔颢诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "崔颢诗之别集，全唐诗崔颢一家所据" },
  { from: cunmuKey("杜审言诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "杜审言诗之别集，全唐诗必简一家所据" },
  { from: cunmuKey("寒山子诗集"), to: cunmuKey("全唐诗"), type: "采", note: "寒山诗之别集，全唐诗寒山一家所据" },
  { from: cunmuKey("薛涛诗全集"), to: cunmuKey("全唐诗"), type: "采", note: "薛涛诗之别集，全唐诗洪度一家所据" },
  { from: cunmuKey("罗昭谏集"), to: cunmuKey("全唐诗"), type: "采", note: "罗隐诗之别集，全唐诗昭谏一家所据" },
  { from: cunmuKey("李义山诗集"), to: cunmuKey("李商隐诗选"), type: "并", note: "同为李商隐之诗，一全集一选本" },
  { from: cunmuKey("岑参集"), to: cunmuKey("岑参诗选"), type: "并", note: "同为岑参之诗，一全集一选本" },

  // ══ 集：楚辞之二篇、阳明周子之一脉 ════════════════════════════════
  { from: cunmuKey("离骚"), to: "chuci", type: "采", note: "离骚为楚辞之首篇，王逸章句即以此开卷" },
  { from: cunmuKey("九歌"), to: "chuci", type: "采", note: "九歌十一章入楚辞，次离骚之后" },
  { from: "chuanxilu", to: cunmuKey("王文成全书"), type: "采", note: "阳明全书卷一至卷三即传习录上中下" },
  { from: cunmuKey("王文成全书"), to: cunmuKey("王心斋全集"), type: "承", note: "王艮出阳明之门，泰州一派自此而立" },
  { from: cunmuKey("王文成全书"), to: cunmuKey("双江聂先生文集"), type: "承", note: "聂豹守阳明归寂之说，与泰州一派异趣" },
  { from: cunmuKey("爱莲说"), to: cunmuKey("周子全书"), type: "采", note: "爱莲说入周子全书，与太极图说、通书同编" },
  { from: cunmuKey("周子全书"), to: "zhuziyulei", type: "承", note: "朱子以周子为道学之宗，语类屡举太极图说而申之" },
  { from: cunmuKey("兰亭集序"), to: cunmuKey("晋王右军集"), type: "采", note: "兰亭序入右军集，右军文之首篇" },
  { from: cunmuKey("题卫夫人笔阵图后"), to: cunmuKey("晋王右军集"), type: "采", note: "旧题右军论书之文，一并收入右军集" },

  // ══ 词：全宋词所辑之别集 ════════════════════════════════════════════
  //
  // 目录里词一类共五十五部，其中四十部是宋人词之别集（《漱玉词》《稼轩词》《片玉词》之属）。
  // 唐圭璋《全宋词》辑宋人词二万余首，所据正是这些别集——这是整部目录里取材之迹最可按稽的
  // 一族：每一部别集都能在《全宋词》里查到它那一家的词。故一概作取材，源在别集，流在总辑。
  { from: cunmuKey("东坡词"), to: cunmuKey("全宋词"), type: "采", note: "苏轼词之别集，全宋词苏轼一家所据" },
  { from: cunmuKey("稼轩词"), to: cunmuKey("全宋词"), type: "采", note: "辛弃疾词之别集，所存六百余首尽入全宋词" },
  { from: cunmuKey("漱玉词"), to: cunmuKey("全宋词"), type: "采", note: "李清照词之别集，全宋词易安一家所据" },
  { from: cunmuKey("淮海詞"), to: cunmuKey("全宋词"), type: "采", note: "秦观词之别集，全宋词少游一家所据" },
  { from: cunmuKey("片玉词"), to: cunmuKey("全宋词"), type: "采", note: "周邦彦词之别集，全宋词清真一家所据" },
  { from: cunmuKey("六一词"), to: cunmuKey("全宋词"), type: "采", note: "欧阳修词之别集，全宋词六一一家所据" },
  { from: cunmuKey("珠玉词"), to: cunmuKey("全宋词"), type: "采", note: "晏殊词之别集，全宋词同叔一家所据" },
  { from: cunmuKey("小山词"), to: cunmuKey("全宋词"), type: "采", note: "晏几道词之别集，全宋词小山一家所据" },
  { from: cunmuKey("山谷词"), to: cunmuKey("全宋词"), type: "采", note: "黄庭坚词之别集，全宋词山谷一家所据" },
  { from: cunmuKey("乐章集"), to: cunmuKey("全宋词"), type: "采", note: "柳永词之宋刻别集，全宋词屯田一家所据" },
  { from: cunmuKey("白石道人歌曲"), to: cunmuKey("全宋词"), type: "采", note: "姜夔自度曲之别集，旁谱俱存，全宋词白石一家所据" },
  { from: cunmuKey("石林词"), to: cunmuKey("全宋词"), type: "采", note: "叶梦得词之别集，全宋词石林一家所据" },
  { from: cunmuKey("芦川词"), to: cunmuKey("全宋词"), type: "采", note: "张元干词之别集，全宋词芦川一家所据" },
  { from: cunmuKey("梅溪词"), to: cunmuKey("全宋词"), type: "采", note: "史达祖词之别集，全宋词梅溪一家所据" },
  { from: cunmuKey("竹屋痴语"), to: cunmuKey("全宋词"), type: "采", note: "高观国词之别集，全宋词竹屋一家所据" },
  { from: cunmuKey("龙洲词"), to: cunmuKey("全宋词"), type: "采", note: "刘过词之别集，全宋词龙洲一家所据" },
  { from: cunmuKey("蒲江词"), to: cunmuKey("全宋词"), type: "采", note: "卢祖皋词之别集，全宋词蒲江一家所据" },
  { from: cunmuKey("无住词"), to: cunmuKey("全宋词"), type: "采", note: "陈与义词之别集，全宋词简斋一家所据" },
  { from: cunmuKey("酒边词"), to: cunmuKey("全宋词"), type: "采", note: "向子諲词之别集，分江北江南二集，全宋词所据" },
  { from: cunmuKey("姑溪词"), to: cunmuKey("全宋词"), type: "采", note: "李之仪词之别集，全宋词姑溪一家所据" },
  { from: cunmuKey("东堂词"), to: cunmuKey("全宋词"), type: "采", note: "毛滂词之别集，全宋词东堂一家所据" },
  { from: cunmuKey("溪堂词"), to: cunmuKey("全宋词"), type: "采", note: "谢逸词之别集，全宋词溪堂一家所据" },
  { from: cunmuKey("断肠词"), to: cunmuKey("全宋词"), type: "采", note: "朱淑真词之别集，全宋词断肠一家所据" },
  { from: cunmuKey("逃禅词"), to: cunmuKey("全宋词"), type: "采", note: "扬无咎词之别集，全宋词逃禅一家所据" },
  { from: cunmuKey("和清真词"), to: cunmuKey("全宋词"), type: "采", note: "方千里和周邦彦之词，全宋词千里一家所据" },
  { from: cunmuKey("范成大词集"), to: cunmuKey("全宋词"), type: "采", note: "范成大词之别集，全宋词石湖一家所据" },
  { from: cunmuKey("曹组词集"), to: cunmuKey("全宋词"), type: "采", note: "曹组词之别集，全宋词元宠一家所据" },
  { from: cunmuKey("知稼翁词"), to: cunmuKey("全宋词"), type: "采", note: "黄公度词之别集，全宋词知稼翁一家所据" },
  { from: cunmuKey("平斋词"), to: cunmuKey("全宋词"), type: "采", note: "洪咨夔词之别集，全宋词平斋一家所据" },
  { from: cunmuKey("归愚词"), to: cunmuKey("全宋词"), type: "采", note: "葛立方词之别集，全宋词归愚一家所据" },
  { from: cunmuKey("丹阳词"), to: cunmuKey("全宋词"), type: "采", note: "葛胜仲词之别集，与其子归愚词并入全宋词" },
  { from: cunmuKey("筠豀乐府"), to: cunmuKey("全宋词"), type: "采", note: "赵彦端词之别集，全宋词筠溪一家所据" },
  { from: cunmuKey("友古词"), to: cunmuKey("全宋词"), type: "采", note: "蔡伸词之别集，全宋词友古一家所据" },
  { from: cunmuKey("圣求词"), to: cunmuKey("全宋词"), type: "采", note: "吕滨老词之别集，全宋词圣求一家所据" },
  { from: cunmuKey("海野词"), to: cunmuKey("全宋词"), type: "采", note: "曾觌词之别集，全宋词海野一家所据" },
  { from: cunmuKey("安陆集"), to: cunmuKey("全宋词"), type: "采", note: "张先词之别集，全宋词子野一家所据" },
  { from: cunmuKey("审斋词"), to: cunmuKey("全宋词"), type: "采", note: "王千秋词之别集，全宋词审斋一家所据" },
  { from: cunmuKey("樵隐词"), to: cunmuKey("全宋词"), type: "采", note: "毛幵词之别集，全宋词樵隐一家所据" },
  { from: cunmuKey("东浦词"), to: cunmuKey("全宋词"), type: "采", note: "韩玉词之别集，全宋词东浦一家所据" },
  { from: cunmuKey("坦菴词"), to: cunmuKey("全宋词"), type: "采", note: "宋人词之别集，全宋词坦庵一家所据" },
  // 词集之间
  { from: cunmuKey("片玉词"), to: cunmuKey("和清真词"), type: "承", note: "方千里依片玉词之次第和之，调与韵一一相从" },
  { from: cunmuKey("乐章集"), to: cunmuKey("柳永词全集"), type: "并", note: "同为柳永之词，一宋刻别集、一今人汇编" },
  { from: cunmuKey("白石道人歌曲"), to: cunmuKey("姜夔词选"), type: "并", note: "同出姜夔，一存全帙旁谱、一为今人选本" },
  { from: cunmuKey("全宋词"), to: cunmuKey("唐宋名家词选"), type: "采", note: "龙榆生选唐宋名家之词，宋人一半取诸全宋词" },
  { from: cunmuKey("李煜词全集"), to: cunmuKey("全唐五代词"), type: "采", note: "李煜词为唐五代词之巨帙，全唐五代词所据" },

  // ══ 诗文评：诗话之体与品第之法 ══════════════════════════════════════
  //
  // 「诗话之作，自欧阳修始」——此语见于宋人之序而为后世论诗者所共承。目录里诗文评一类
  // 六十部，宋人诗话居其半，皆用《六一诗话》随笔记事、间评句法之体。故此族之承学，
  // 所指认者是**一种体例**（判据：能指认所承者为何例），非泛泛同类。
  { from: cunmuKey("六一诗话"), to: cunmuKey("温公续诗话"), type: "续", note: "司马光自序言续欧公之作，补其所未记" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("后山诗话"), type: "承", note: "陈师道用六一随笔之体，而多论句法" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("中山诗话"), type: "承", note: "刘攽继诗话之体，记一时之诗事" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("彦周诗话"), type: "承", note: "许顗述所闻诗事而附己评，体本六一" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("石林诗话"), type: "承", note: "叶梦得论诗详于声律，而体仍诗话" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("诚斋诗话"), type: "承", note: "杨万里以作者之身为诗话，所举多切于作法" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("紫微诗话"), type: "承", note: "吕本中记吕氏一门及江西诸人之诗" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("庚溪诗话"), type: "承", note: "陈岩肖承诗话之例，兼录南渡以来之作" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("观林诗话"), type: "承", note: "吴聿记诗事诗句，体与六一同" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("藏海诗话"), type: "承", note: "吴可专论作诗之法，而仍为诗话之体" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("优古堂诗话"), type: "承", note: "吴幵考诗语之所出，以诗话之体为考据" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("二老堂诗话"), type: "承", note: "周必大晚年所记，亦承六一之例" },
  { from: cunmuKey("六一诗话"), to: cunmuKey("东坡诗话"), type: "托", note: "旧题苏轼，实后人掇其论诗之语编次成书，非东坡自著" },
  { from: cunmuKey("苕溪渔隐丛话前集"), to: cunmuKey("苕溪渔隐丛话后集"), type: "续", note: "胡仔前集既行，复辑后集以补其未备" },
  { from: cunmuKey("苕溪渔隐丛话前集"), to: cunmuKey("诗人玉屑"), type: "采", note: "魏庆之分门编次诸家诗说，所引以渔隐丛话为多" },
  { from: cunmuKey("沧浪诗话"), to: cunmuKey("诗人玉屑"), type: "采", note: "玉屑诗辨诸门，大段录严羽之说" },
  { from: "shipin", to: cunmuKey("沧浪诗话"), type: "承", note: "严羽分体分品、论诗以妙悟，远承钟嵘品第之法" },
  { from: cunmuKey("沧浪诗话"), to: cunmuKey("麓堂诗话"), type: "承", note: "李东阳论诗主格调，取法盛唐之说自严羽来" },
  { from: cunmuKey("沧浪诗话"), to: cunmuKey("四溟诗话"), type: "承", note: "谢榛论诗必盛唐，明承沧浪之论" },
  { from: cunmuKey("沧浪诗话"), to: cunmuKey("艺苑卮言"), type: "承", note: "王世贞辨体立格，所本亦在严羽一路" },
  { from: cunmuKey("沧浪诗话"), to: "renjiancihua", type: "承", note: "王国维谓兴趣、神韵犹不如境界，其说自严羽一路而别立之" },
  { from: cunmuKey("书品[节录]"), to: cunmuKey("书后品"), type: "续", note: "李嗣真承庾肩吾书品之目而别为后品，接其品第" },
  { from: cunmuKey("诗式"), to: cunmuKey("诗法家数"), type: "承", note: "元人论诗之格法，承唐人诗式之体" },
  { from: cunmuKey("木天禁语"), to: cunmuKey("诗学禁脔"), type: "并", note: "二书皆旧题范梈，四库并疑为后人依托" },
  { from: cunmuKey("词论"), to: cunmuKey("乐府指迷"), type: "承", note: "沈义父论词之四标准，承李清照别是一家之论" },
  { from: cunmuKey("漱玉词"), to: cunmuKey("词论"), type: "并", note: "同出李清照，一为其词、一为其论词之文" },
  { from: cunmuKey("白石道人歌曲"), to: cunmuKey("白石道人诗说"), type: "并", note: "同出姜夔，一为其词曲、一为其论诗" },
  { from: cunmuKey("读通鉴论"), to: cunmuKey("姜斋诗话"), type: "并", note: "同出王夫之：一论史、一论诗，而立意相贯" },
  { from: "renjiancihua", to: cunmuKey("今本竹书纪年疏证"), type: "并", note: "同出王国维，一论词、一考史，并见其治学之两面" },
  { from: cunmuKey("钝吟杂录"), to: cunmuKey("钝吟书要[节录]"), type: "并", note: "同出冯班，一杂论诗文、一专言书法" },
  { from: "wenxindiaolong", to: cunmuKey("诗学源流考"), type: "承", note: "今人溯诗体之流变，所承为雕龙明诗、通变之例" },

  // ══ 书画：法书要录所辑与碑学一脉 ══════════════════════════════════
  //
  // 书画一类七十七部，大半是短篇书论。张彦远《法书要录》十卷辑后汉迄唐元和论书之文，
  // 这些短篇多因其辑录而得传——目录里唐以前的书论，检其篇目大半即《法书要录》之卷次。
  // 故此族作取材：源在原篇，流在总辑；凡不能确指其在要录之中者不入表
  //（《临池诀》《用笔法》《二字诀》之属，或出《墨池编》，或题代未详，皆阙之）。
  //
  // 又目录里有六部同题《论书》而皆「代未详」，彼此分不出，故一部也不系线——
  // 端点认得定是系线的前提（见 `cunmuKey`）。
  { from: cunmuKey("非草书"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "赵壹非草之论，赖法书要录卷一而存" },
  { from: cunmuKey("四体书势"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "卫恒四体书势，法书要录卷一所录" },
  { from: cunmuKey("草书势"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "索靖草书势，法书要录卷一所录" },
  { from: cunmuKey("采古来能书人名"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "羊欣所记能书之人，法书要录卷一所录" },
  { from: cunmuKey("论书表"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "虞和论书表，法书要录卷二所录" },
  { from: cunmuKey("笔意赞"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "王僧虔笔意赞，法书要录卷一所录" },
  { from: cunmuKey("与梁武帝论书启"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "陶弘景与梁武帝往复论书之启，法书要录卷二所录" },
  { from: cunmuKey("书品[节录]"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "庾肩吾书品，法书要录卷二所录" },
  { from: cunmuKey("古今书评"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "袁昂古今书评，法书要录卷二所录" },
  { from: cunmuKey("笔髓论"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "虞世南笔髓论，法书要录卷三所录" },
  { from: cunmuKey("书旨述"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "虞世南书旨述，法书要录卷三所录" },
  { from: cunmuKey("书后品"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "李嗣真书后品，法书要录卷三所录" },
  { from: cunmuKey("书断"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "张怀瓘书断三卷，法书要录卷七至卷九所录" },
  { from: cunmuKey("六体书论"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "张怀瓘六体书论，法书要录卷四所录" },
  { from: cunmuKey("论用笔十法"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "张怀瓘论用笔十法，法书要录卷四所录" },
  { from: cunmuKey("评书药石论（含今译）"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "张怀瓘评书药石论，法书要录卷四所录" },
  { from: cunmuKey("述张长史笔法十二意"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "颜真卿述张旭笔法十二意，法书要录卷七所录" },
  { from: cunmuKey("送高闲上人序"), to: cunmuKey("法书要录-六卷全"), type: "采", note: "韩愈送高闲序论张旭之书，法书要录卷九所录" },
  { from: cunmuKey("草书势"), to: cunmuKey("草书势(含今译)"), type: "并", note: "同篇两录，一存原文、一附今译" },
  { from: cunmuKey("笔阵图"), to: cunmuKey("题卫夫人笔阵图后"), type: "传", note: "旧题右军题笔阵图之后，逐节申其笔势之说，离笔阵图则不成篇" },
  { from: cunmuKey("书断"), to: cunmuKey("续书断"), type: "续", note: "朱长文续张怀瓘书断，接其神妙能三品而续录宋人" },
  { from: cunmuKey("孙过庭书谱及其释文"), to: cunmuKey("续书谱"), type: "续", note: "姜夔自言续孙过庭书谱，分条论之" },
  { from: cunmuKey("南北书派论[节录]"), to: cunmuKey("北碑南帖论[节录]"), type: "并", note: "同出阮元，分论书派与碑帖，碑学之二文" },
  { from: cunmuKey("南北书派论[节录]"), to: cunmuKey("艺舟双辑（附《十七帖》疏证）"), type: "承", note: "包世臣承阮元尊碑之论而详于笔法" },
  { from: cunmuKey("艺舟双辑（附《十七帖》疏证）"), to: cunmuKey("广艺舟双楫"), type: "承", note: "康有为广包世臣之说，尊魏碑而抑唐法" },
  { from: cunmuKey("衍极并注"), to: cunmuKey("翰林要诀"), type: "承", note: "陈绎曾承郑枃衍极论书之旨而条列笔法" },
  // —— 题名本身即可坐实的注释、续作（结构判定；不凭相似书名猜关系） ——
  { from: "daodejing", to: cunmuKey("老子集注"), type: "传", note: "题名明示集注《老子》，以原典为逐章解释对象", basis: "title" },
  { from: "daodejing", to: cunmuKey("老子想尔注"), type: "传", note: "题名明示注《老子》，以想尔家法解释原典", basis: "title" },
  { from: "sunzi", to: cunmuKey("孙子略解"), type: "传", note: "题名明示解《孙子》，解释原典而不另立一书", basis: "title" },
  { from: cunmuKey("大学章句"), to: cunmuKey("大学章句集注"), type: "传", note: "题名明示在《大学章句》基础上集注", basis: "title" },
  { from: cunmuKey("中庸章句"), to: cunmuKey("中庸章句集注"), type: "传", note: "题名明示在《中庸章句》基础上集注", basis: "title" },
  { from: cunmuKey("新语"), to: cunmuKey("陆贾新语注释"), type: "传", note: "《新语》为陆贾本书，后书题名明示为其作注释", basis: "title" },
  { from: cunmuKey("颜氏家训"), to: cunmuKey("颜氏家训集解"), type: "传", note: "题名明示集解《颜氏家训》", basis: "title" },
  { from: cunmuKey("茶经"), to: cunmuKey("茶经(今注)"), type: "传", note: "题名明示今注《茶经》", basis: "title" },
  { from: cunmuKey("留东外史"), to: cunmuKey("留东外史续集"), type: "续", note: "题名明示为《留东外史》续集", basis: "title" },
  { from: cunmuKey("佐治药言"), to: cunmuKey("续佐治药言"), type: "续", note: "题名明示续《佐治药言》", basis: "title" },
  { from: cunmuKey("老残游记"), to: cunmuKey("老残游记续集"), type: "续", note: "题名明示承接《老残游记》续写", basis: "title" },
  { from: cunmuKey("小五义"), to: cunmuKey("续小五义"), type: "续", note: "题名明示承接《小五义》续写", basis: "title" },
  // —— 《四库全书总目提要》明文可证（自动发现、逐条复核后收入） ——
  { from: "chuci", to: "erya", type: "采", note: "《尔雅》若干训释直接取《楚辞》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《楚辞》之文也", confidence: "high" } },
  { from: "zhuangzi", to: "erya", type: "采", note: "《尔雅》训释取《庄子》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《庄子》之文也", confidence: "high" } },
  { from: "liezi", to: "erya", type: "采", note: "《尔雅》训释取《列子》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《列子》之文也", confidence: "high" } },
  { from: cunmuKey("穆天子传"), to: "erya", type: "采", note: "《尔雅》训释取《穆天子传》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《穆天子传》之文也", confidence: "high" } },
  { from: "guanzi", to: "erya", type: "采", note: "《尔雅》训释取《管子》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《管子》之文也", confidence: "high" } },
  { from: "lvshichunqiu", to: "erya", type: "采", note: "《尔雅》训释取《吕氏春秋》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《吕氏春秋》之文也", confidence: "high" } },
  { from: "shanhaijing", to: "erya", type: "采", note: "《尔雅》训释取《山海经》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《山海经》之文也", confidence: "high" } },
  { from: "guoyu", to: "erya", type: "采", note: "《尔雅》训释取《国语》文句", basis: "zongmu", evidence: { source: "《四库全书总目提要·尔雅注疏提要》", quote: "此取《国语》之文也", confidence: "high" } },
  { from: "shishuoxinyu", to: cunmuKey("晋书"), type: "采", note: "唐修《晋书》大量收入《世说新语》及刘孝标注材料", basis: "zongmu", evidence: { source: "《四库全书总目提要·晋书提要》", quote: "取刘义庆《世说新语》与刘孝标所注一一互勘，几於全部收入", confidence: "high" } },
  { from: cunmuKey("南史"), to: cunmuKey("宋书"), type: "采", note: "今本《宋书》阙卷曾取《南史》补足", basis: "zongmu", evidence: { source: "《四库全书总目提要·宋书提要》", quote: "后人杂取《高氏小史》及《南史》以补之", confidence: "high" } },
  { from: cunmuKey("北史"), to: cunmuKey("周书"), type: "采", note: "今本《周书》亡篇多取《北史》补足", basis: "zongmu", evidence: { source: "《四库全书总目提要·周书提要》", quote: "多取《北史》以补亡", confidence: "high" } },
  { from: "zhouyi", to: cunmuKey("太玄经"), type: "承", note: "扬雄《太玄经》仿《周易》结构立书", basis: "zongmu", evidence: { source: "《四库全书总目提要·太玄经提要》", quote: "仿《周易》", confidence: "high" } },
  { from: "lunyu", to: cunmuKey("新语"), type: "采", note: "陆贾《新语》多援据《论语》文义", basis: "zongmu", evidence: { source: "《四库全书总目提要·新语提要》", quote: "援据多《春秋》、《论语》之文", confidence: "high" } },
  { from: cunmuKey("沧浪诗话"), to: cunmuKey("钝吟杂录"), type: "驳", note: "《钝吟杂录》专列辨驳严羽诗论", basis: "zongmu", evidence: { source: "《四库全书总目提要·钝吟杂录提要》", quote: "纠谬辨严羽《沧浪诗话》之非", confidence: "high" } },
  { from: cunmuKey("弘明集"), to: cunmuKey("广弘明集"), type: "续", note: "道宣续僧祐《弘明集》而扩为十篇", basis: "zongmu", evidence: { source: "《四库全书总目提要·广弘明集提要》", quote: "续梁僧祐《弘明集》而体例小殊", confidence: "high" } },
  { from: cunmuKey("列女传"), to: "liexianzhuan", type: "承", note: "《列仙传》仿《列女传》的列传体例", basis: "zongmu", evidence: { source: "《四库全书总目提要·列仙传提要》", quote: "仿《列女传》", confidence: "high" } },
  { from: cunmuKey("千字文"), to: cunmuKey("敬斋古今黈"), type: "驳", note: "《敬斋古今黈》辨《千字文》作者旧说", basis: "zongmu", evidence: { source: "《四库全书总目提要·敬斋古今黈提要》", quote: "驳《千字文》非周兴嗣作", confidence: "high" } },
  { from: "lunyu", to: cunmuKey("敬斋古今黈"), type: "驳", note: "《敬斋古今黈》辨《论语》五十学《易》之说", basis: "zongmu", evidence: { source: "《四库全书总目提要·敬斋古今黈提要》", quote: "辨《论语》五十以学《易》", confidence: "high" } },
  { from: "liezi", to: cunmuKey("敬斋古今黈"), type: "驳", note: "《敬斋古今黈》辨《列子》所载陇断之义", basis: "zongmu", evidence: { source: "《四库全书总目提要·敬斋古今黈提要》", quote: "辨《孟子》龙断即《列子》所谓", confidence: "high" } },
  { from: cunmuKey("史記"), to: cunmuKey("敬斋古今黈"), type: "驳", note: "《敬斋古今黈》辨《史记》自叙的一处文字", basis: "zongmu", evidence: { source: "《四库全书总目提要·敬斋古今黈提要》", quote: "辨《史记》自叙瓯、骆相攻", confidence: "high" } },
  { from: cunmuKey("素问"), to: cunmuKey("奇经八脉考"), type: "采", note: "《奇经八脉考》据《素问》考求八脉源流", basis: "zongmu", evidence: { source: "《四库全书总目提要·奇经八脉考提要》", quote: "据《灵枢》、《素问》以究其委曲", confidence: "high" } },
  { from: "baopuzi", to: cunmuKey("神仙传"), type: "承", note: "《神仙传》承《抱朴子内篇》的神仙论题继续撰述", basis: "zongmu", evidence: { source: "《四库全书总目提要·神仙传提要》", quote: "於《抱朴子内篇》既成之后，因其弟子滕升问仙人有无而作", confidence: "high" } },
  // —— 第二轮复核：重点补依托、非难、相续 ——
  { from: cunmuKey("周易集解"), to: cunmuKey("子夏易传"), type: "托", note: "今本托名子夏，而《周易集解》所引旧文皆为今本所无", basis: "zongmu", evidence: { source: "《四库全书总目提要·子夏易传提要》", quote: "《周易集解》所引，皆今本所无……今本又出伪托", confidence: "high" } },
  { from: "xiaojing", to: cunmuKey("忠经"), type: "托", note: "《忠经》模拟《孝经》十八章而托名马融、郑玄", basis: "zongmu", evidence: { source: "《四库全书总目提要·忠经提要》", quote: "其文拟《孝经》为十八章……其为宋代伪书，殆无疑义", confidence: "high" } },
  { from: "hanshu", to: cunmuKey("神异经"), type: "托", note: "《神异经》托名东方朔，《汉书》本传所列东方朔著述无此书", basis: "zongmu", evidence: { source: "《四库全书总目提要·神异经提要》", quote: "《汉书》朔本传……此书既刘向《七略》所不载，则其为依托更无疑义", confidence: "high" } },
  { from: cunmuKey("隋书"), to: cunmuKey("中说"), type: "托", note: "今本《中说》出现与《隋书》职官年代相冲突的记述，显为后出依托", basis: "zongmu", evidence: { source: "《四库全书总目提要·中说提要》", quote: "《隋书职官志》曰……其依托谬妄，亦一明证", confidence: "high" } },
  { from: "guliang", to: cunmuKey("新语"), type: "托", note: "今本《新语》引用后出的《穀梁传》，总目据此判为后人依托", basis: "zongmu", evidence: { source: "《四库全书总目提要·新语提要》", quote: "《穀梁传》至汉武帝时始出……其殆后人依托，非贾原本欤", confidence: "high" } },
  { from: cunmuKey("宋书"), to: cunmuKey("竹书纪年"), type: "托", note: "今本《竹书纪年》伪注的五帝三王部分全抄《宋书·符瑞志》", basis: "zongmu", evidence: { source: "《四库全书总目提要·竹书纪年提要》", quote: "五帝三王皆全钞《宋书符瑞志》语……然则此注亦依托耳", confidence: "high" } },
  { from: "wuzi", to: "liutao", type: "托", note: "《六韬》托周初姜望而作，总目引前说指出其渔猎《吴子》之词", basis: "zongmu", evidence: { source: "《四库全书总目提要·六韬提要》", quote: "其依托之迹，灼然可验……并缘吴起，渔猎其词", confidence: "high" } },
  { from: "lvshichunqiu", to: cunmuKey("竹书纪年"), type: "驳", note: "《竹书纪年》明确驳正《吕氏春秋》的一项记载", basis: "zongmu", evidence: { source: "《四库全书总目提要·竹书纪年提要》", quote: "驳《吕氏春秋》", confidence: "high" } },
  { from: cunmuKey("唐会要"), to: cunmuKey("文献通考"), type: "驳", note: "《文献通考》辨先圣、先师之分，并指出《唐会要》所载有缺", basis: "zongmu", evidence: { source: "《四库全书总目提要·文献通考提要》", quote: "辨先圣、先师之分，而《唐会要》……之制不载", confidence: "medium" } },
  { from: "hanshu", to: cunmuKey("梁书"), type: "承", note: "《梁书》卷后署撰者之例仿《汉书》题班彪的体例", basis: "zongmu", evidence: { source: "《四库全书总目提要·梁书提要》", quote: "仿《汉书》卷后题班彪之例", confidence: "high" } },
  { from: cunmuKey("容斋随笔"), to: cunmuKey("容斋续笔"), type: "续", note: "洪迈继《容斋随笔》后续辑考据札记，题名与卷次均明示接续", basis: "title", evidence: { source: "《容斋续笔》题名与通行卷次", quote: "容斋续笔", confidence: "high" } },
  { from: cunmuKey("全唐文"), to: cunmuKey("唐文拾遗"), type: "续", note: "《唐文拾遗》补录《全唐文》未收唐文", basis: "title", evidence: { source: "《唐文拾遗》题名与编纂目的", quote: "拾遗", confidence: "high" } },
  { from: "shuihu", to: cunmuKey("水浒后传"), type: "续", note: "《水浒后传》承接《水浒传》人物与故事继续叙写", basis: "title", evidence: { source: "《水浒后传》题名与故事承接", quote: "水浒后传", confidence: "high" } },
];

/**
 * 真正可执行的跨书引用关系。只取“后书明确吸收前书”的有向类型：
 * 传/承/采/驳/续分别授权原典、学说来源、材料来源、批评对象与所续前书；
 * 并称没有传递，依托涉及真伪，二者不得自动成为人物立论证据。
 */
export const CITABLE_SIKU_REL = new Set<SikuRelType>(["传", "承", "采", "驳", "续"]);

/** 全量复审记录；原候选仍留在 SIKU_EDGES，正式图谱只接纳通过或改类后的边。 */
export const SIKU_LINEAGE_REVIEW = reviewSikuEdges(SIKU_EDGES);

/** 复审后进入文明长卷和人物跨书引用控制的正式中国典籍边。 */
export const FORMAL_SIKU_EDGES: SikuEdge[] = SIKU_LINEAGE_REVIEW.filter(
  (edge) => edge.review.status === "accepted" || edge.review.status === "corrected",
).map(({ from, to, type, note, basis, evidence }) => ({ from, to, type, note, basis, evidence }));

export function citationSourcesFor(bookIds: Iterable<string>): SikuEdge[] {
  const owned = new Set(bookIds);
  return FORMAL_SIKU_EDGES.filter(
    (edge) => owned.has(edge.to) && CITABLE_SIKU_REL.has(edge.type),
  );
}

/** 一部书的关系（含两向）。`dir` 为 out＝此书是源，in＝此书是流。 */
export type SikuRel = {
  other: string;
  type: SikuRelType;
  note: string;
  dir: "in" | "out";
  basis?: SikuEdge["basis"];
  evidence?: SikuEdge["evidence"];
};

/**
 * 滤出两端都在当前目录里的边。`ids` 同时含可读书的 bookId 与存目书的 `目:书名`。
 * 端点认不出即静默略去——表是手撰的常量，分片清单是脚本定的，两者不必同步。
 */
export function sikuEdges(ids: Set<string>): SikuEdge[] {
  return FORMAL_SIKU_EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));
}

/** 按书聚拢其一跳关系，供详情栏列举与顺藤点跳。 */
export function relsByBook(edges: SikuEdge[]): Map<string, SikuRel[]> {
  const m = new Map<string, SikuRel[]>();
  const push = (k: string, v: SikuRel) => m.set(k, [...(m.get(k) ?? []), v]);
  for (const e of edges) {
    push(e.from, { other: e.to, type: e.type, note: e.note, dir: "out", basis: e.basis, evidence: e.evidence });
    push(e.to, { other: e.from, type: e.type, note: e.note, dir: "in", basis: e.basis, evidence: e.evidence });
  }
  return m;
}
