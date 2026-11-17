/**
 * 后世影音·小说·戏剧索引（A）＋ 可检索影视片段（B）。
 *
 * 与 canon.ts 的「原典可引典」并存——此处收后世对诸子、典籍、思想的
 * 影视/小说/戏剧/纪录片演绎。条目如今不止华夏一路：西游的演绎归西游，
 * 西方文哲的演绎各挂其书（`litId`）。四库「影音」是华夏一路的总门
 * （诸子百家、取经路上两函），西方一路不混入四库，归世界文学那条轴——
 * 书读到哪里，影音跟到哪本书。仅作索引与极短场景概述（短述、不抄录
 * 剧本原文），不入诸子发言/辩论逻辑。
 *
 * 检索 B：retrieveMedia(term) 关键词匹配 text/gloss/keywords；
 * 若后续接入语义向量（同 canon-vectors 之预计算产物），可平滑升级，
 * 未启用时降级纯关键词，不报错（与典籍检索同一范式）。
 */

import { asset } from "./assetPath";

export type MediaKind = "影视" | "小说" | "戏剧" | "纪录片" | "动画";

/** 一条影音所属之界：战国（华夏诸子，含文王演周易等）、西游、西方。 */
export type MediaWorld = "zhanguo" | "xiyou" | "west";

/** 后世演绎目录：挂于某节点（人物/典籍/思想），示「后世如何演绎此人/此书/此念」。 */
export type Adaptation = {
  id: string;
  /** 相关图谱节点 id；西游/西方之演绎不在图谱上，留空串（与 owner 的空串约定同意）。 */
  nodeId: string;
  /** 属何世界。旧条目不标即华夏战国一路。 */
  world?: MediaWorld;
  /** 西方之书在世界文学书架的 id（worldlit 目录），书内影音栏按此取。 */
  litId?: string;
  /**
   * 四库可读之书的分片 id（`public/siku/catalog.json` 之 `bookId`）。
   * 七十七部可读之书，部部有影音——读到哪一部，那一部的演绎便列在书前，
   * 故此字段与 `nodeId` 并行不悖：图谱上的书节点按 nodeId 取，书架上的书按 bookId 取。
   */
  bookId?: string;
  kind: MediaKind;
  title: string;
  year: number;
  /** 形制或出处（导演/原著/出品），一句话。 */
  maker: string;
  note: string;
};

/** 可检索影视片段：极短场景概述（非剧本原文，概述性质），挂相关节点与概念关键词。 */
export type MediaClip = {
  id: string;
  work: string;
  kind: MediaKind;
  /** 场景概述，≤30 字。 */
  text: string;
  gloss: string;
  /** 相关诸子 id（"" 表无对应人物）。 */
  owner: string;
  /** 属何世界。旧条目不标即华夏战国一路。 */
  world?: MediaWorld;
  /** 西方之书在世界文学书架的 id（worldlit 目录），书内影音栏按此取。 */
  litId?: string;
  /** 四库可读之书的分片 id；四库书页「影音」栏按此取（同 Adaptation.bookId）。 */
  bookId?: string;
  /**
   * 此幕出自目录哪一条（`Adaptation.id`）。
   *
   * 一部片与它的一幕戏本是一事，从前两条各出一卡，同名并列便成了冗赘
   * ——《浮士德》一簇要出「浮士德·1926」与「浮士德·片段」两张同名卡。
   * 填此字段，总目便把这一幕并入它所出的那部片：一片一卡，卡上附幕，
   * 点进去仍是这一幕的点评席（批注 key 仍为 clip:{id}，不动旧注）。
   * 不填者自成一卡（战国、西游两路之片段本无所出之目录条，照旧独列）。
   */
  adaptationId?: string;
  keywords: string[];
  /** 相关图谱节点 id（人物/典籍/思想），供节点详情按 id 取片段。 */
  nodeIds: string[];
  /** 可选：片段视频源（URL 或路径）。预置片段不内置版权影视，故留空以场景幕卡呈现；
   *  若日后接入自有/授权片源，填此即可在诸子点评界面放映。 */
  sourceUrl?: string;
};

export const ADAPTATIONS: Adaptation[] = [
  // 孔子
  { id: "ad-kong-film", nodeId: "kong", kind: "影视", title: "孔子", year: 2010, maker: "胡玫导演，周润发饰孔子", note: "传记电影，述孔子周游列国、归鲁修《春秋》。" },
  { id: "ad-kong-tv", nodeId: "kong", kind: "影视", title: "孔子", year: 1991, maker: "山东影视", note: "电视剧，铺陈孔子一生与孔门弟子。" },
  { id: "ad-kong-bio", nodeId: "kong", kind: "小说", title: "孔子传", year: 1952, maker: "钱穆著", note: "传记，考据与叙事并重。" },
  // 论语（典籍）
  { id: "ad-lunyu-doc", nodeId: "bk-lunyu", bookId: "lunyu", kind: "纪录片", title: "典籍里的中国·论语", year: 2021, maker: "央视", note: "以舞台剧演《论语》成书与孔门师弟之情。" },
  // 仁 / 礼（思想）——目录归人物节点，思想节点靠 clipsOf 带片段
  // 墨子 / 兼爱 / 非攻 / 墨子（书）
  { id: "ad-mo-film", nodeId: "mo", bookId: "mozi", kind: "影视", title: "墨攻", year: 2006, maker: "张之亮导演，刘德华饰革离", note: "墨者革离助梁城以守，演非攻兼爱之旨。" },
  // 孙武 / 孙子兵法 / 奇正
  { id: "ad-sun-novel", nodeId: "sunwu", kind: "小说", title: "孙子大传", year: 1995, maker: "韩静霆著", note: "小说，述孙武自齐入吴、练兵破楚。" },
  { id: "ad-sun-tv", nodeId: "sunwu", kind: "影视", title: "孙子大传", year: 2010, maker: "刘俊杰导演", note: "剧改，演孙武用兵与人生。" },
  { id: "ad-sunzi-doc", nodeId: "bk-sunzi", bookId: "sunzi", kind: "纪录片", title: "典籍里的中国·孙子兵法", year: 2021, maker: "央视", note: "舞台演《孙子》十三篇成书与柏举之战。" },
  // 老子 / 道德经
  { id: "ad-laozi-tv", nodeId: "laozi", kind: "影视", title: "老子传奇", year: 2015, maker: "陈卫国导演", note: "电视剧，演老子生平与著五千言。" },
  { id: "ad-daodejing-tv", nodeId: "bk-daodejing", bookId: "daodejing", kind: "影视", title: "老子传奇", year: 2015, maker: "陈卫国导演", note: "演老子出关应关令尹喜之请留《道德经》。" },
  // 庄子 / 逍遥 / 庄子（书）
  { id: "ad-zhuang-anim", nodeId: "zhuang", bookId: "zhuangzi", kind: "动画", title: "庄子说", year: 1986, maker: "蔡志忠漫画/动画", note: "以漫画化玄奥为童趣，演庄子逍遥。" },
  // 韩非 / 韩非子
  { id: "ad-han-tv", nodeId: "han", kind: "影视", title: "大秦帝国之崛起", year: 2017, maker: "丁黑导演", note: "剧中有韩非入秦、李斯忌之之段。" },
  { id: "ad-han-anim", nodeId: "han", kind: "动画", title: "天行九歌", year: 2016, maker: "沈乐平", note: "以韩非为主角演其青年谋断。" },
  { id: "ad-hanfeizi-tv", nodeId: "bk-hanfeizi", bookId: "hanfeizi", kind: "影视", title: "大秦帝国之崛起", year: 2017, maker: "丁黑导演", note: "剧中征引韩非之说。" },
  // 苏秦 / 张仪 / 合纵连横
  { id: "ad-suqin-tv", nodeId: "suqin", kind: "影视", title: "大秦帝国之纵横", year: 2012, maker: "丁黑导演", note: "演苏秦合纵之策与纵横家风采。" },
  { id: "ad-zhangyi-tv", nodeId: "zhangyi", kind: "影视", title: "大秦帝国之纵横", year: 2012, maker: "丁黑导演，喻恩泰饰张仪", note: "演张仪连横破纵、游说六国。" },
  // 吕不韦 / 吕氏春秋
  { id: "ad-lv-tv", nodeId: "lvbuwei", kind: "影视", title: "大秦赋", year: 2020, maker: "延艺等导演，段奕宏饰吕不韦", note: "演吕不韦「奇货可居」与相秦摄政。" },
  { id: "ad-lv-tv2", nodeId: "lvbuwei", kind: "影视", title: "吕不韦传奇", year: 2001, maker: "周晓文导演", note: "专演吕不韦自商入政一生。" },
  { id: "ad-lvshi-tv", nodeId: "bk-lvshi", bookId: "lvshichunqiu", kind: "影视", title: "大秦赋", year: 2020, maker: "延艺等导演", note: "剧中演吕氏门客杂纂《吕氏春秋》。" },
  // 周文王 / 周易
  { id: "ad-wenwang-film", nodeId: "wenwang", kind: "影视", title: "封神第一部：朝歌风云", year: 2023, maker: "乌尔善导演", note: "西伯侯姬昌被囚羑里、演卦通命。" },
  { id: "ad-zhouyi-film", nodeId: "bk-zhouyi", bookId: "zhouyi", kind: "影视", title: "封神第一部", year: 2023, maker: "乌尔善导演", note: "银幕演文王演八卦之渊源。" },
  // 尚书
  { id: "ad-shangshu-doc", nodeId: "bk-shangshu", bookId: "shangshu", kind: "纪录片", title: "典籍里的中国·尚书", year: 2021, maker: "央视", note: "演孔子删定《尚书》与伏生护书传经。" },
  // 子思 / 中庸（子思子）
  { id: "ad-zisi-doc", nodeId: "bk-zisi", kind: "纪录片", title: "典籍里的中国·中庸", year: 2021, maker: "央视", note: "演《中庸》相传出子思之手与「慎独」之旨。" },
  // 群像（秦时明月涉诸子百家）
  { id: "ad-qinshiming-anim", nodeId: "mo", kind: "动画", title: "秦时明月", year: 2007, maker: "沈乐平", note: "动画群像，墨家机关城藏反秦之士，涉诸子百家。" },

  // ── 四库可读之书 · 部部有影音（按 bookId 挂，四库书页「影音」栏与跨媒介点评那一层按此取） ──
  // 七十七部可读之书，读到哪一部便该看见那一部的后世演绎。然演绎有亲疏：
  // 有直演此书者（《典籍里的中国》逐典成集、四大名著之剧改），有但演其人其时、
  // 书中之说借戏文而见者（法家诸书之于《大秦帝国》、训诂字书之于《说文解字》集）。
  // 亲者直述，疏者于 note 里说明「非直演此书」，不以旁涉充作改编——索引之信在此。

  // 经部
  { id: "ad-sk-mengzi", nodeId: "meng", bookId: "mengzi", kind: "纪录片", title: "典籍里的中国·论语", year: 2021, maker: "央视", note: "非直演《孟子》；孔孟一贯，此集演孔门师弟问答，性善民贵之说即承其绪。" },
  { id: "ad-sk-liji", nodeId: "", bookId: "liji", kind: "纪录片", title: "典籍里的中国·礼记", year: 2022, maker: "央视", note: "演《礼记》所记礼之本与「大同」之章。" },
  { id: "ad-sk-yili", nodeId: "", bookId: "yili", kind: "纪录片", title: "典籍里的中国·礼记", year: 2022, maker: "央视", note: "非直演《仪礼》；三礼同源，此集演礼之本，仪节之详当并观。" },
  { id: "ad-sk-zhouli", nodeId: "", bookId: "zhouli", kind: "纪录片", title: "故宫", year: 2005, maker: "央视专题片", note: "非直演《周礼》；紫禁城「左祖右社、前朝后寝」之制本于《周礼·考工记》。" },
  { id: "ad-sk-shijing", nodeId: "", bookId: "shijing", kind: "纪录片", title: "典籍里的中国·诗经", year: 2023, maker: "央视", note: "演毛亨毛苌传诗、风雅颂之成书。" },
  { id: "ad-sk-xiaojing", nodeId: "", bookId: "xiaojing", kind: "影视", title: "孔子", year: 2010, maker: "胡玫导演，周润发饰孔子", note: "非直演《孝经》；此书托孔子为曾子陈孝，与银幕之孔门相照。" },
  { id: "ad-sk-erya", nodeId: "", bookId: "erya", kind: "纪录片", title: "典籍里的中国·说文解字", year: 2023, maker: "央视", note: "非直演《尔雅》；《尔雅》与《说文》同为训诂字书之祖，此集演许慎著书之事。" },
  { id: "ad-sk-zuozhuan", nodeId: "", bookId: "zuozhuan", kind: "影视", title: "东周列国·春秋篇", year: 1996, maker: "央视三十集，沈好放导演", note: "春秋诸事之剧演，所本多出《左传》。" },
  { id: "ad-sk-gongyang", nodeId: "", bookId: "gongyang", kind: "影视", title: "汉武大帝", year: 2005, maker: "胡玫导演", note: "非直演《公羊传》；董仲舒以公羊学对天人三策，一代经学之用见于此剧。" },
  { id: "ad-sk-guliang", nodeId: "", bookId: "guliang", kind: "影视", title: "东周列国·春秋篇", year: 1996, maker: "央视三十集，沈好放导演", note: "非直演《谷梁传》；谷梁与公羊、左氏同释一经，此剧演其所释之春秋。" },

  // 史部
  { id: "ad-sk-hanshu", nodeId: "", bookId: "hanshu", kind: "纪录片", title: "典籍里的中国·汉书", year: 2022, maker: "央视", note: "演班氏父子撰《汉书》与班昭续成之事。" },
  { id: "ad-sk-houhanshu", nodeId: "", bookId: "houhanshu", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《后汉书》；东汉诸集之所据多本范晔此书。" },
  { id: "ad-sk-sanguozhi", nodeId: "", bookId: "sanguozhi", kind: "影视", title: "三国演义", year: 1994, maker: "央视八十四集，王扶林总导演", note: "非直演《三国志》；演义本陈寿此志而增饰，正史与演义当对看。" },
  { id: "ad-sk-zizhitongjian", nodeId: "", bookId: "zizhitongjian", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《资治通鉴》；编年叙事之法与所纪千载之事可对看。" },
  { id: "ad-sk-zhanguoce", nodeId: "", bookId: "zhanguoce", kind: "影视", title: "大秦帝国之纵横", year: 2013, maker: "丁黑导演", note: "剧中苏秦张仪之说辞，多本《战国策》所载。" },
  { id: "ad-sk-guoyu", nodeId: "", bookId: "guoyu", kind: "影视", title: "东周列国·春秋篇", year: 1996, maker: "央视三十集，沈好放导演", note: "非直演《国语》；所演春秋列国之事与此书互见。" },
  { id: "ad-sk-yanzi", nodeId: "", bookId: "yanzi", kind: "影视", title: "东周列国·春秋篇", year: 1996, maker: "央视三十集，沈好放导演", note: "非直演《晏子春秋》；剧中演齐景公与晏婴君臣之对。" },

  // 子部
  { id: "ad-sk-chuanxilu", nodeId: "", bookId: "chuanxilu", kind: "纪录片", title: "典籍里的中国·传习录", year: 2021, maker: "央视", note: "演王阳明龙场悟道与知行合一之教。" },
  { id: "ad-sk-xunzi", nodeId: "", bookId: "xunzi", kind: "影视", title: "大秦帝国之崛起", year: 2017, maker: "丁黑导演", note: "非直演《荀子》；韩非李斯俱出荀门，剧中可见其学之行于秦。" },
  { id: "ad-sk-kongzijiayu", nodeId: "kong", bookId: "kongzijiayu", kind: "影视", title: "孔子", year: 2010, maker: "胡玫导演，周润发饰孔子", note: "非直演《孔子家语》；此书所记孔子言行，与银幕之孔子互为注脚。" },
  { id: "ad-sk-chunqiufanlu", nodeId: "", bookId: "chunqiufanlu", kind: "影视", title: "汉武大帝", year: 2005, maker: "胡玫导演", note: "非直演《春秋繁露》；剧演董仲舒天人三策，即此书之旨所自出。" },
  { id: "ad-sk-yantielun", nodeId: "", bookId: "yantielun", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《盐铁论》；桑弘羊与贤良文学盐铁之议，见于西汉诸集。" },
  { id: "ad-sk-zhuziyulei", nodeId: "", bookId: "zhuziyulei", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《朱子语类》；朱熹理学一集可见其讲学之境。" },
  { id: "ad-sk-shuoyuan", nodeId: "", bookId: "shuoyuan", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《说苑》；刘向校书编事之背景见于西汉诸集。" },
  { id: "ad-sk-xinxu", nodeId: "", bookId: "xinxu", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《新序》；与《说苑》同出刘向之手，皆采旧事以资劝戒。" },
  { id: "ad-sk-baopuzi", nodeId: "", bookId: "baopuzi", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《抱朴子》；魏晋神仙道教与葛洪之学见于其中。" },
  { id: "ad-sk-liexianzhuan", nodeId: "", bookId: "liexianzhuan", kind: "影视", title: "八仙全传", year: 2007, maker: "中国大陆古装神话剧", note: "非直演《列仙传》；仙传一路之后世演绎，八仙即其流裔。" },
  { id: "ad-sk-liezi", nodeId: "", bookId: "liezi", kind: "纪录片", title: "典籍里的中国·道德经", year: 2021, maker: "央视", note: "非直演《列子》；列御寇承老子之说，此集演五千言之成与出关授经。" },
  { id: "ad-sk-wenzi", nodeId: "laozi", bookId: "wenzi", kind: "纪录片", title: "典籍里的中国·道德经", year: 2021, maker: "央视", note: "非直演《文子》；此书托文子之问而述老子之言，当与此集同观。" },
  { id: "ad-sk-shangjunshu", nodeId: "", bookId: "shangjunshu", kind: "影视", title: "大秦帝国之裂变", year: 2009, maker: "黄健中导演，王志飞饰商鞅", note: "演商鞅变法立木取信、秦法之成，《商君书》所论即此事之理。" },
  { id: "ad-sk-shenzi", nodeId: "", bookId: "shenzi", kind: "影视", title: "大秦帝国之裂变", year: 2009, maker: "黄健中导演", note: "非直演《申子》；申不害相韩主术治，与剧中商鞅之法治同为法家两路。" },
  { id: "ad-sk-shenzi2", nodeId: "", bookId: "shenzi2", kind: "影视", title: "大秦帝国之裂变", year: 2009, maker: "黄健中导演", note: "非直演《慎子》；慎到主势，与法、术并称法家三柄，剧中变法可见其用。" },
  { id: "ad-sk-guanzi", nodeId: "", bookId: "guanzi", kind: "影视", title: "东周列国·春秋篇", year: 1996, maker: "央视三十集，沈好放导演", note: "非直演《管子》；剧演管仲相齐、尊王攘夷，仓廪实而知礼节之政见于其中。" },
  { id: "ad-sk-dengxizi", nodeId: "", bookId: "dengxizi", kind: "影视", title: "东周列国·春秋篇", year: 1996, maker: "央视三十集，沈好放导演", note: "非直演《邓析子》；邓析为郑之讼辩之士，名家之先，剧演其时之郑。" },
  { id: "ad-sk-yinwenzi", nodeId: "", bookId: "yinwenzi", kind: "影视", title: "东周列国·战国篇", year: 1997, maker: "央视三十二集，阎建钢导演", note: "非直演《尹文子》；尹文游稷下，形名之辩见于战国诸家争鸣。" },
  { id: "ad-sk-gongsunlongzi", nodeId: "gongsunlong", bookId: "gongsunlongzi", kind: "影视", title: "东周列国·战国篇", year: 1997, maker: "央视三十二集，阎建钢导演", note: "非直演《公孙龙子》；白马非马之辩属名家，剧演战国百家之争。" },
  { id: "ad-sk-lunheng", nodeId: "", bookId: "lunheng", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《论衡》；王充疾虚妄之论，见于东汉思想一路。" },
  { id: "ad-sk-huainanzi", nodeId: "", bookId: "huainanzi", kind: "影视", title: "汉武大帝", year: 2005, maker: "胡玫导演", note: "非直演《淮南子》；剧中淮南王刘安即集此书之人。" },
  { id: "ad-sk-wudenghuiyuan", nodeId: "", bookId: "wudenghuiyuan", kind: "影视", title: "达摩祖师传", year: 1994, maker: "袁振洋（释传般）编导，樊少皇主演", note: "非直演《五灯会元》；灯录所传禅门机锋，自达摩一苇西来始。" },
  { id: "ad-sk-tanjing", nodeId: "", bookId: "tanjing", kind: "影视", title: "达摩祖师传", year: 1994, maker: "袁振洋（释传般）编导，樊少皇主演", note: "非直演《坛经》；禅宗东土之源流，与六祖之说法相承。" },
  { id: "ad-sk-sishierzhangjing", nodeId: "", bookId: "sishierzhangjing", kind: "影视", title: "鹿鼎记", year: 1998, maker: "金庸原著，无线电视剧集", note: "非直演此经；《四十二章经》在金庸笔下成藏宝之秘，经名因戏而广传。" },
  { id: "ad-sk-liaofansixun", nodeId: "", bookId: "liaofansixun", kind: "纪录片", title: "典籍里的中国·传习录", year: 2021, maker: "央视", note: "非直演《了凡四训》；袁了凡与王阳明同为明人修身立命之学，此集演知行合一。" },
  { id: "ad-sk-guiguzi", nodeId: "", bookId: "guiguzi", kind: "影视", title: "大秦帝国之纵横", year: 2013, maker: "丁黑导演", note: "非直演《鬼谷子》；苏秦张仪俱称出鬼谷之门，剧演其纵横之术。" },
  { id: "ad-sk-sunbinfa", nodeId: "", bookId: "sunbinfa", kind: "影视", title: "孙子兵法与三十六计", year: 2000, maker: "山东三冠影视，仇永力饰孙膑", note: "演孙膑庞涓斗智、围魏救赵与马陵之战。" },
  { id: "ad-sk-sanshiliuji", nodeId: "", bookId: "sanshiliuji", kind: "影视", title: "孙子兵法与三十六计", year: 2000, maker: "山东三冠影视，仇永力饰孙膑", note: "以孙膑庞涓之事逐集演三十六计之目。" },
  { id: "ad-sk-wuzi", nodeId: "", bookId: "wuzi", kind: "影视", title: "东周列国·战国篇", year: 1997, maker: "央视三十二集，阎建钢导演", note: "非直演《吴子》；剧演吴起变法于楚、治军于魏之事。" },
  { id: "ad-sk-simafa", nodeId: "", bookId: "simafa", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《司马法》；春秋军礼与田穰苴治军之制见于先秦诸集。" },
  { id: "ad-sk-weiliaozi", nodeId: "", bookId: "weiliaozi", kind: "影视", title: "大秦赋", year: 2020, maker: "延艺等导演", note: "非直演《尉繚子》；尉缭入秦献策，剧中可见其人其时。" },
  { id: "ad-sk-sanlue", nodeId: "", bookId: "sanlue", kind: "影视", title: "楚汉传奇", year: 2012, maker: "高希希导演", note: "非直演《三略》；此书旧题黄石公授张良，剧演圯上受书与运筹之事。" },
  { id: "ad-sk-liutao", nodeId: "", bookId: "liutao", kind: "动画", title: "姜子牙", year: 2020, maker: "程腾、李炜导演", note: "非直演《六韬》；此书旧托太公望之言，动画演姜子牙之另一面。" },
  { id: "ad-sk-tiangongkaiwu", nodeId: "", bookId: "tiangongkaiwu", kind: "纪录片", title: "典籍里的中国·天工开物", year: 2021, maker: "央视", note: "演宋应星遍访工事、著此「百工之书」。" },
  { id: "ad-sk-qiminyaoshu", nodeId: "", bookId: "qiminyaoshu", kind: "纪录片", title: "典籍里的中国·齐民要术", year: 2023, maker: "央视", note: "演贾思勰察农事稼穑而成此书。" },
  { id: "ad-sk-shishuoxinyu", nodeId: "", bookId: "shishuoxinyu", kind: "纪录片", title: "中国通史", year: 2013, maker: "央视百集纪录片", note: "非直演《世说新语》；魏晋风度与名士清谈之世，即此书所记之境。" },

  // 集部
  { id: "ad-sk-chuci", nodeId: "", bookId: "chuci", kind: "纪录片", title: "典籍里的中国·楚辞", year: 2021, maker: "央视", note: "演屈原问天、《离骚》之作与楚声之远。" },
  { id: "ad-sk-wenxindiaolong", nodeId: "", bookId: "wenxindiaolong", kind: "纪录片", title: "典籍里的中国·文心雕龙", year: 2023, maker: "央视", note: "演刘勰依寺著书、论文之枢纽。" },
  { id: "ad-sk-shipin", nodeId: "", bookId: "shipin", kind: "纪录片", title: "典籍里的中国·文心雕龙", year: 2023, maker: "央视", note: "非直演《诗品》；钟嵘《诗品》与刘勰《文心》并称南朝文论双璧，当并观。" },
  { id: "ad-sk-tangshisanbaishou", nodeId: "", bookId: "tangshisanbaishou", kind: "动画", title: "长安三万里", year: 2023, maker: "追光动画，谢君伟、邹靖导演", note: "演李白高适一生与唐诗之盛，片中所诵多在三百首之内。" },
  { id: "ad-sk-guwenguanzhi", nodeId: "", bookId: "guwenguanzhi", kind: "纪录片", title: "典籍里的中国·史记", year: 2021, maker: "央视", note: "非直演《古文观止》；所选《屈原列传》《太史公自序》诸篇皆出《史记》，此集演司马迁成书之艰。" },
  { id: "ad-sk-renjiancihua", nodeId: "", bookId: "renjiancihua", kind: "纪录片", title: "典籍里的中国·文心雕龙", year: 2023, maker: "央视", note: "非直演《人间词话》；刘勰「论文之枢纽」与王国维「境界」说同为文论之极，当并观。" },
  { id: "ad-sk-sanguoyanyi", nodeId: "", bookId: "sanguoyanyi", kind: "影视", title: "三国演义", year: 1994, maker: "央视八十四集，王扶林总导演", note: "全本剧改，自桃园结义至三分归晋。" },
  { id: "ad-sk-honglou", nodeId: "", bookId: "honglou", kind: "影视", title: "红楼梦", year: 1987, maker: "王扶林导演，央视三十六集", note: "剧改，演大观园盛衰与宝黛之悲。" },
  { id: "ad-sk-shuihu", nodeId: "", bookId: "shuihu", kind: "影视", title: "水浒传", year: 1998, maker: "张绍林导演，央视四十三集", note: "剧改，演逼上梁山与招安之败。" },
  { id: "ad-sk-fengshen", nodeId: "", bookId: "fengshen", kind: "影视", title: "封神第一部：朝歌风云", year: 2023, maker: "乌尔善导演", note: "银幕重演商周之变、质子与妖狐之乱。" },
  { id: "ad-sk-fengshen-tv", nodeId: "", bookId: "fengshen", kind: "影视", title: "封神榜", year: 1990, maker: "上海电视台剧集", note: "早年剧改，演武王伐纣与诸仙斗法。" },
  { id: "ad-sk-liaozhai", nodeId: "", bookId: "liaozhai", kind: "影视", title: "倩女幽魂", year: 1987, maker: "程小东导演，徐克监制", note: "据《聊斋·聂小倩》改编，以书生狐鬼演人间之险。" },
  { id: "ad-sk-liaozhai-tv", nodeId: "", bookId: "liaozhai", kind: "影视", title: "聊斋电视系列片", year: 1987, maker: "福建电视台、南昌影视创作研究所", note: "一篇一集，历三年而成，遍演《聊斋》诸篇。" },
  { id: "ad-sk-shanhaijing", nodeId: "", bookId: "shanhaijing", kind: "动画", title: "大鱼海棠", year: 2016, maker: "彼岸天文化，梁旋、张春导演", note: "非直演《山海经》；其神怪名物多采此书与《庄子·逍遥游》。" },
  { id: "ad-sk-jinghuayuan", nodeId: "", bookId: "jinghuayuan", kind: "动画", title: "大鱼海棠", year: 2016, maker: "彼岸天文化，梁旋、张春导演", note: "非直演《镜花缘》；唐敖海外诸邦之想多出《山海经》，动画亦取其神怪。" },
  { id: "ad-sk-rulinwaishi", nodeId: "", bookId: "rulinwaishi", kind: "影视", title: "啼笑书香", year: 2021, maker: "郑晓龙任艺术总监，陈键锋、潘粤明主演", note: "改编《儒林外史》，取范进、匡超人诸举子之事。" },

  // ── 西游一路（不挂图谱节点，四库「影音」门取经函按 world 取） ──
  { id: "ad-xy-tv1986", nodeId: "", world: "xiyou", bookId: "xiyouji", kind: "影视", title: "西游记", year: 1986, maker: "杨洁导演，六小龄童饰孙悟空", note: "二十五集初排，几成一代人「正版」的西游想象。" },
  { id: "ad-xy-dahua", nodeId: "", world: "xiyou", bookId: "xiyouji", kind: "影视", title: "大话西游之月光宝盒／大圣娶亲", year: 1995, maker: "刘镇伟导演，周星驰饰至尊宝", note: "无厘头解构取经：不肯戴金箍的悟空。" },
  { id: "ad-xy-guilai", nodeId: "", world: "xiyou", bookId: "xiyouji", kind: "动画", title: "西游记之大圣归来", year: 2015, maker: "田晓鹏导演", note: "动画，演大圣法力尽失之后的归来。" },

  // ── 西方一路（各挂其书 litId，世界文学轴书内影音栏按此取） ──
  // 每本至少两部，取「相隔一世」之对照：一部晚近有声本，一部早期默片或另路改编，
  // 好让同一册书的两种读法并列。note 只说这是部什么片（片种、来路、取舍），
  // 片段那一层的 gloss 才说某一镜做了什么——两处不复述，分工在此。
  { id: "ad-w-hamlet-1948", nodeId: "", world: "west", litId: "hamlet", kind: "影视", title: "王子复仇记", year: 1948, maker: "劳伦斯·奥利弗导演并主演", note: "黑白截本，获奥斯卡最佳影片，为莎剧电影立下一代范式。" },
  { id: "ad-w-hamlet-1996", nodeId: "", world: "west", litId: "hamlet", kind: "影视", title: "哈姆莱特", year: 1996, maker: "肯尼思·布莱纳导演并主演", note: "第一个一字不删的全本，四小时，场景移至十九世纪宫廷。" },
  { id: "ad-w-hamlet-1921", nodeId: "", world: "west", litId: "hamlet", kind: "影视", title: "哈姆莱特：复仇的悲剧", year: 1921, maker: "斯文·加德、海因茨·沙尔导演，阿斯塔·尼尔森主演", note: "德国默片，取维宁「哈姆莱特本是女子」之异说，王子生为公主而以男装承嗣。公有领域。" },
  { id: "ad-w-zhongxia-1999", nodeId: "", world: "west", litId: "zhongxia", kind: "影视", title: "仲夏夜之梦", year: 1999, maker: "迈克尔·霍夫曼导演", note: "移至十九世纪末托斯卡纳，自行车与歌剧入戏。" },
  { id: "ad-w-zhongxia-1909", nodeId: "", world: "west", litId: "zhongxia", kind: "影视", title: "仲夏夜之梦", year: 1909, maker: "查尔斯·肯特、J. 斯图尔特·布莱克顿导演", note: "维塔格拉菲一本短片，此剧最早的银幕本。公有领域。" },
  { id: "ad-w-odyssey-1997", nodeId: "", world: "west", litId: "odyssey", kind: "影视", title: "奥德赛", year: 1997, maker: "安德烈·康查洛夫斯基导演", note: "两集电视电影，自特洛伊战后演到还乡认亲。" },
  { id: "ad-w-odyssey-1911", nodeId: "", world: "west", litId: "odyssey", kind: "影视", title: "奥德赛", year: 1911, maker: "贝尔托利尼、德·里瓜罗导演", note: "意大利默片，都灵世博年所摄，荷马史诗已知第三部银幕本。公有领域。" },
  { id: "ad-w-quixote-1972", nodeId: "", world: "west", litId: "quixote", kind: "影视", title: "拉曼查的男人", year: 1972, maker: "亚瑟·希勒导演，彼得·奥图主演", note: "音乐剧电影，以塞万提斯下狱自辩的戏中戏框住全书。" },
  { id: "ad-w-quixote-1926", nodeId: "", world: "west", litId: "quixote", kind: "影视", title: "堂吉诃德", year: 1926, maker: "劳·劳里岑导演，Fy og Bi 搭档主演", note: "丹麦默片，喜剧搭档「灯塔与拖斗」一高一矮正好分演骑士与桑丘。公有领域。" },
  { id: "ad-w-faust-1926", nodeId: "", world: "west", litId: "faust", kind: "影视", title: "浮士德", year: 1926, maker: "F.W. 茂瑙导演", note: "德国默片，以摄影棚内造云造城的表现主义手法摄歌德上部。公有领域。" },
  { id: "ad-w-faust-2011", nodeId: "", world: "west", litId: "faust", kind: "影视", title: "浮士德", year: 2011, maker: "亚历山大·索科洛夫导演", note: "俄国出品、德语对白，获威尼斯金狮；自歌德与托马斯·曼之间另起一路。" },
  { id: "ad-w-chahua-1936", nodeId: "", world: "west", litId: "chahua", kind: "影视", title: "茶花女", year: 1936, maker: "乔治·库克导演，葛丽泰·嘉宝主演", note: "米高梅名作，嘉宝凭此片得影评人奖，后世译本封面多用其剧照。" },
  { id: "ad-w-chahua-1921", nodeId: "", world: "west", litId: "chahua", kind: "影视", title: "茶花女", year: 1921, maker: "雷·C. 斯莫尔伍德导演，娜兹莫娃、瓦伦蒂诺主演", note: "美国默片，以装饰艺术布景把小仲马移入现代巴黎。公有领域。" },
  { id: "ad-w-tianyan-2009", nodeId: "", world: "west", litId: "tianyan", kind: "影视", title: "造物弄人", year: 2009, maker: "乔恩·阿米尔导演", note: "达尔文传记片；非直演此书，而写《天演论》作者赫胥黎登场的那一侧。" },
  { id: "ad-w-tianyan-1978", nodeId: "", world: "west", litId: "tianyan", kind: "影视", title: "达尔文的航程", year: 1978, maker: "BBC 七集剧集", note: "据达尔文书信日记演小猎犬号之行；非直演此书，而演此书所辩的进化论如何成形。" },
  { id: "ad-w-yuejie-1902", nodeId: "", world: "west", litId: "yuejie", kind: "影视", title: "月球旅行记", year: 1902, maker: "乔治·梅里爱", note: "十四分钟默片，史上第一部科幻片，并取凡尔纳此书与其续篇。公有领域。" },
  { id: "ad-w-yuejie-1958", nodeId: "", world: "west", litId: "yuejie", kind: "影视", title: "从地球到月球", year: 1958, maker: "拜伦·哈斯金导演，约瑟夫·科顿主演", note: "彩色有声本，循原著从巴比肯造巨炮讲到炮弹升空。" },
];

/** 与某节点相关的全部演绎目录。 */
export function adaptationsOf(nodeId: string): Adaptation[] {
  return ADAPTATIONS.filter((a) => a.nodeId === nodeId);
}

export const MEDIA_CLIPS: MediaClip[] = [
  {
    id: "mc-kong-zhouyou",
    work: "孔子",
    kind: "影视",
    text: "孔子率弟子周游列国，厄于陈蔡而弦歌不辍。",
    gloss: "银幕演孔子困厄之中仍守其道，仁与礼之笃行。",
    owner: "kong",
    keywords: ["孔子", "周游", "陈蔡", "仁", "礼", "道", "困厄"],
    nodeIds: ["kong", "id-ren", "id-li", "bk-lunyu"],
    // 放映通路验证用占位片源（public/clips/demo-trip.mp4，W3Schools 样本）；换真片源替换此处即可
    sourceUrl: asset("/clips/demo-trip.mp4"),
  },
  {
    id: "mc-mo-mougong",
    work: "墨攻",
    kind: "影视",
    text: "墨者革离独赴梁城，以守代攻抗赵军。",
    gloss: "以一人守一城，银幕化墨家非攻兼爱之旨。",
    owner: "mo",
    keywords: ["墨", "革离", "守", "非攻", "兼爱", "梁城", "战", "守城"],
    nodeIds: ["mo", "id-jianai", "id-feigong", "bk-mozi"],
  },
  {
    id: "mc-suqin-hezong",
    work: "大秦帝国之纵横",
    kind: "影视",
    text: "苏秦约六国合纵以抗秦，佩六国相印。",
    gloss: "演纵横家合纵之策与游说之术。",
    owner: "suqin",
    keywords: ["苏秦", "合纵", "六国", "抗秦", "纵横", "游说", "相印"],
    nodeIds: ["suqin", "id-hezong"],
  },
  {
    id: "mc-zhangyi-lianheng",
    work: "大秦帝国之纵横",
    kind: "影视",
    text: "张仪以连横破合纵，说六国事秦。",
    gloss: "银幕演连横之策瓦解合纵之局。",
    owner: "zhangyi",
    keywords: ["张仪", "连横", "破纵", "事秦", "纵横", "游说"],
    nodeIds: ["zhangyi", "id-hezong"],
  },
  {
    id: "mc-lv-qihuo",
    work: "大秦赋",
    kind: "影视",
    text: "吕不韦识异人为奇货可居，倾家扶其为秦王。",
    gloss: "演商而入政、以谋取国的杂家手段。",
    owner: "lvbuwei",
    keywords: ["吕不韦", "奇货可居", "异人", "秦王", "谋", "商", "权"],
    nodeIds: ["lvbuwei", "bk-lvshi"],
  },
  {
    id: "mc-han-ruqin",
    work: "大秦帝国之崛起",
    kind: "影视",
    text: "韩非入秦，李斯忌其才，终遭囚杀。",
    gloss: "演法家集大成者入秦不得其用。",
    owner: "han",
    keywords: ["韩非", "李斯", "秦", "囚", "法", "才", "忌"],
    nodeIds: ["han", "bk-hanfeizi"],
  },
  {
    id: "mc-han-tianxing",
    work: "天行九歌",
    kind: "动画",
    text: "青年韩非以法家之术与流沙组织谋断韩国之局。",
    gloss: "动画演韩非早年谋断与法家思想之萌。",
    owner: "han",
    keywords: ["韩非", "流沙", "法", "术", "谋", "韩国"],
    nodeIds: ["han", "id-fa"],
  },
  {
    id: "mc-sun-lianbing",
    work: "孙子大传",
    kind: "影视",
    text: "孙武以宫女练兵，斩吴王二宠姬以明军法。",
    gloss: "演兵家之严与法之不阿贵。",
    owner: "sunwu",
    keywords: ["孙武", "练兵", "宫女", "斩", "军法", "严", "兵", "奇正"],
    nodeIds: ["sunwu", "bk-sunzi", "id-qizheng"],
  },
  {
    id: "mc-wenwang-youli",
    work: "封神第一部",
    kind: "影视",
    text: "西伯侯姬昌被囚羑里，演八卦而通天命。",
    gloss: "银幕演文王演《周易》之渊源。",
    owner: "wenwang",
    keywords: ["文王", "姬昌", "羑里", "八卦", "周易", "卦", "命", "囚"],
    nodeIds: ["wenwang", "bk-zhouyi"],
  },
  {
    id: "mc-laozi-chuguan",
    work: "老子传奇",
    kind: "影视",
    text: "老子骑青牛出函谷关，应关令尹喜留五千言。",
    gloss: "演《道德经》成书之传说。",
    owner: "laozi",
    keywords: ["老子", "青牛", "函谷关", "道德经", "五千言", "出关", "道"],
    nodeIds: ["laozi", "bk-daodejing", "id-dao", "id-wuwei"],
  },
  {
    id: "mc-zhuang-xiaoyao",
    work: "庄子说",
    kind: "动画",
    text: "以漫画解庄子逍遥游，化玄奥为童趣。",
    gloss: "动画演逍遥无待、齐物是非之旨。",
    owner: "zhuang",
    keywords: ["庄子", "逍遥", "漫画", "齐物", "无待", "道"],
    nodeIds: ["zhuang", "id-xiaoyao", "bk-zhuangzi"],
    // 放映通路验证用占位片源（public/clips/demo-bbb.mp4，W3Schools 样本动画）；换真片源替换此处即可
    sourceUrl: asset("/clips/demo-bbb.mp4"),
  },
  {
    id: "mc-qinshi-mojia",
    work: "秦时明月",
    kind: "动画",
    text: "墨家机关城藏天下反秦之士，以非攻兼爱为旨。",
    gloss: "动画群像演诸子百家与暴秦之抗。",
    owner: "mo",
    keywords: ["墨家", "机关城", "反秦", "非攻", "兼爱", "百家", "群像"],
    nodeIds: ["mo", "id-jianai", "id-feigong"],
  },
  {
    id: "mc-dianji-lunyu",
    work: "典籍里的中国·论语",
    kind: "纪录片",
    text: "舞台演孔门师弟之情与《论语》成书传世。",
    gloss: "以演剧述《论语》之成与孔门之教。",
    owner: "kong",
    keywords: ["论语", "孔子", "弟子", "成书", "学", "仁", "传世"],
    nodeIds: ["kong", "bk-lunyu", "id-ren"],
  },
  {
    id: "mc-dianji-shangshu",
    work: "典籍里的中国·尚书",
    kind: "纪录片",
    text: "演孔子删定《尚书》与伏生护书传经。",
    gloss: "述《尚书》之传与护书之艰。",
    owner: "kong",
    keywords: ["尚书", "孔子", "删定", "伏生", "护书", "传经", "政"],
    nodeIds: ["kong", "bk-shangshu"],
  },
  {
    id: "mc-dianji-sunzi",
    work: "典籍里的中国·孙子兵法",
    kind: "纪录片",
    text: "演孙武著十三篇与柏举之战破楚入郢。",
    gloss: "述《孙子兵法》成书与其用兵之验。",
    owner: "sunwu",
    keywords: ["孙子", "十三篇", "柏举", "破楚", "兵", "奇正", "战"],
    nodeIds: ["sunwu", "bk-sunzi", "id-qizheng"],
  },

  // ── 西游一路（取经路上被后世反复重演的几折） ──
  {
    id: "mc-xy-sanda",
    work: "西游记",
    kind: "影视",
    text: "白骨夫人三变，悟空三打，唐僧贬书逐行者。",
    gloss: "八六版立「正版」西游想象的一折：妖该打，而肉眼难辨。",
    owner: "wukong",
    world: "xiyou",
    keywords: ["三打白骨精", "白骨精", "贬书", "师徒", "六小龄童", "悟空"],
    nodeIds: [],
  },
  {
    id: "mc-xy-nverguo",
    work: "西游记",
    kind: "影视",
    text: "女儿国王愿以一国之富换御弟留下，唐僧不为所动。",
    gloss: "八六版添演的情关，成了后世反复重写的一幕。",
    owner: "tangseng",
    world: "xiyou",
    keywords: ["女儿国", "情关", "御弟", "唐僧", "留", "取经"],
    nodeIds: [],
  },
  {
    id: "mc-xy-dahua",
    work: "大话西游",
    kind: "影视",
    text: "至尊宝临戴上金箍，说出「曾经有一份真挚的爱情」。",
    gloss: "无厘头解构取经：先失了所爱的，才肯去戴金箍。",
    owner: "wukong",
    world: "xiyou",
    keywords: ["大话西游", "至尊宝", "金箍", "周星驰", "解构"],
    nodeIds: [],
  },
  {
    id: "mc-xy-guilai",
    work: "西游记之大圣归来",
    kind: "动画",
    text: "法力尽失的悟空被江流儿唤醒，重披战甲破山而出。",
    gloss: "动画演大圣之落魄与归来——「齐天」是心气，不是法力。",
    owner: "wukong",
    world: "xiyou",
    keywords: ["大圣归来", "江流儿", "法力", "归来", "齐天"],
    nodeIds: [],
  },

  // ── 西方一路（各挂其书 litId，世界文学轴书内影音栏按此取） ──
  // 一本书两部片，便有两条片段：晚近本与早期默片各取一镜，看同一处书怎样被两代人读。
  // text 只述此镜所见，gloss 只说此镜何以如此——目录那一层的 note 说「这是部什么片」，
  // 两处分工不复述。默片诸条虽属公有领域，片源仍未接入，故与有声本同以幕卡呈现。
  {
    id: "mc-w-hamlet",
    work: "王子复仇记",
    kind: "影视",
    text: "哈姆莱特于城垣独语「生存还是毁灭」。",
    gloss: "奥利弗以特写摄独白，把文艺复兴之疑都收进这张脸。",
    owner: "shashi",
    world: "west",
    litId: "hamlet",
    adaptationId: "ad-w-hamlet-1948",
    keywords: ["哈姆莱特", "生存还是毁灭", "独白", "奥利弗", "复仇"],
    nodeIds: [],
  },
  {
    id: "mc-w-hamlet-1921",
    work: "哈姆莱特：复仇的悲剧",
    kind: "影视",
    text: "王子独坐窗边，窗外同窗笑语，无人知其身世。",
    gloss: "默片无台词可倚，尼尔森把犹豫全交给一个不肯转过来的侧脸。",
    owner: "shashi",
    world: "west",
    litId: "hamlet",
    adaptationId: "ad-w-hamlet-1921",
    keywords: ["哈姆莱特", "尼尔森", "默片", "反串", "身世", "犹豫", "维宁"],
    nodeIds: [],
  },
  {
    id: "mc-w-zhongxia",
    work: "仲夏夜之梦",
    kind: "影视",
    text: "花汁点错眼：仙后醒来，拥着驴头的织工。",
    gloss: "霍夫曼演魔法之谬——错爱一夜，天明各归其位。",
    owner: "shashi",
    world: "west",
    litId: "zhongxia",
    adaptationId: "ad-w-zhongxia-1999",
    keywords: ["仲夏夜之梦", "花汁", "仙后", "织工", "错爱", "魔法"],
    nodeIds: [],
  },
  {
    id: "mc-w-zhongxia-1909",
    work: "仲夏夜之梦",
    kind: "影视",
    text: "林中仙后醒转，怀里是被变了驴头的织工波顿。",
    gloss: "一本胶片演完五幕，变驴头只靠一次停机再拍——魔法最初就是这么变的。",
    owner: "shashi",
    world: "west",
    litId: "zhongxia",
    adaptationId: "ad-w-zhongxia-1909",
    keywords: ["仲夏夜之梦", "仙后", "波顿", "驴头", "默片", "维塔格拉菲", "停机再拍"],
    nodeIds: [],
  },
  {
    id: "mc-w-odyssey",
    work: "奥德赛",
    kind: "影视",
    text: "奥德修斯自缚于桅杆，听塞壬之歌而不溺。",
    gloss: "银幕演智者的自缚：要听歌，先求缚。",
    owner: "homa",
    world: "west",
    litId: "odyssey",
    adaptationId: "ad-w-odyssey-1997",
    keywords: ["奥德赛", "塞壬", "桅杆", "奥德修斯", "归途", "自缚"],
    nodeIds: [],
  },
  {
    id: "mc-w-odyssey-1911",
    work: "奥德赛",
    kind: "影视",
    text: "洞中巨人酣睡，众人持削尖木桩刺其独目。",
    gloss: "巨人是叠印出来的——史诗第一次被量出了尺寸，怪物也就第一次可以被算计。",
    owner: "homa",
    world: "west",
    litId: "odyssey",
    adaptationId: "ad-w-odyssey-1911",
    keywords: ["奥德赛", "独眼巨人", "波吕斐摩斯", "刺目", "默片", "叠印"],
    nodeIds: [],
  },
  {
    id: "mc-w-quixote",
    work: "拉曼查的男人",
    kind: "影视",
    text: "堂吉诃德挺枪冲向风车，被扇上天空跌落马下。",
    gloss: "荒唐与庄严同在一杆枪上：他输得彻底，却没输掉那个念头。",
    owner: "saiwan",
    world: "west",
    litId: "quixote",
    adaptationId: "ad-w-quixote-1972",
    keywords: ["堂吉诃德", "风车", "骑士", "冲杀", "拉曼查"],
    nodeIds: [],
  },
  {
    id: "mc-w-quixote-1926",
    work: "堂吉诃德",
    kind: "影视",
    text: "乡绅读骑士小说入了迷，披甲上马，出门行侠。",
    gloss: "由喜剧搭档来演，先笑他一高一矮不成个样子，笑过才发觉他是真信。",
    owner: "saiwan",
    world: "west",
    litId: "quixote",
    adaptationId: "ad-w-quixote-1926",
    keywords: ["堂吉诃德", "桑丘", "骑士小说", "披甲", "默片", "丹麦", "灯塔与拖斗"],
    nodeIds: [],
  },
  {
    id: "mc-w-faust",
    work: "浮士德",
    kind: "影视",
    text: "浮士德骑魔毯夜行，俯瞰人间的瘟疫与祈祷。",
    gloss: "换得一瞬青春，便要赔上永世——这一程飞行，是赌约先付的利息。",
    owner: "gete",
    world: "west",
    litId: "faust",
    adaptationId: "ad-w-faust-1926",
    keywords: ["浮士德", "茂瑙", "梅菲斯特", "灵魂", "赌", "瘟疫"],
    nodeIds: [],
  },
  {
    id: "mc-w-chahua",
    work: "茶花女",
    kind: "影视",
    text: "玛格丽特受人之托强颜逐爱，转身向空椅垂泪。",
    gloss: "把爱推开的人，背过身才敢哭——此后的玛格丽特多照这个背影演。",
    owner: "xiaozhongma",
    world: "west",
    litId: "chahua",
    adaptationId: "ad-w-chahua-1936",
    keywords: ["茶花女", "嘉宝", "玛格丽特", "牺牲", "离别"],
    nodeIds: [],
  },
  {
    id: "mc-w-chahua-1921",
    work: "茶花女",
    kind: "影视",
    text: "赌场重逢，阿尔芒当众羞辱玛格丽特。",
    gloss: "误解最伤人处在于：她不能辩，一辩便坏了先前替他做的那个决定。",
    owner: "xiaozhongma",
    world: "west",
    litId: "chahua",
    adaptationId: "ad-w-chahua-1921",
    keywords: ["茶花女", "阿尔芒", "玛格丽特", "赌场", "羞辱", "默片", "娜兹莫娃"],
    nodeIds: [],
  },
  {
    id: "mc-w-tianyan",
    work: "造物弄人",
    kind: "影视",
    text: "赫胥黎向达尔文自请为斗犬：先生，您已杀了上帝。",
    gloss: "学说要立得住，身前先得有人肯咬——严复所译的，正是这条斗犬的文章。",
    owner: "huxu",
    world: "west",
    litId: "tianyan",
    adaptationId: "ad-w-tianyan-2009",
    keywords: ["天演论", "赫胥黎", "达尔文", "进化论", "斗犬", "严复"],
    nodeIds: [],
  },
  {
    id: "mc-w-yuejie",
    work: "月球旅行记",
    kind: "影视",
    text: "炮弹载人射向月球，月脸被火箭正中一击。",
    gloss: "炮弹不转弯也不减速，直直戳进月亮的眼睛——离开地球这件事，最初是当笑话演的。",
    owner: "faner",
    world: "west",
    litId: "yuejie",
    adaptationId: "ad-w-yuejie-1902",
    keywords: ["月球旅行记", "梅里爱", "炮弹", "月球", "科幻"],
    nodeIds: [],
  },
];

/** 与某节点直接相关的片段（按 nodeIds 取）。 */
export function clipsOf(nodeId: string): MediaClip[] {
  return MEDIA_CLIPS.filter((c) => c.nodeIds.includes(nodeId));
}

/** 某一路世界的全部片段（四库「影音」门按此分函）。旧条目不标 world 即战国。 */
export function clipsOfWorld(world: MediaWorld): MediaClip[] {
  return MEDIA_CLIPS.filter((c) => (c.world ?? "zhanguo") === world);
}

/** 某一路世界的全部演绎目录（「影音」函内之「后世目录」）。 */
export function adaptationsOfWorld(world: MediaWorld): Adaptation[] {
  return ADAPTATIONS.filter((a) => (a.world ?? "zhanguo") === world);
}

/**
 * 「诸子百家」函所收：挂在诸子其人、其念上的演绎。
 *
 * 七十七部可读之书各有影音之后，这一函若照单全收，《红楼梦》《资治通鉴》便挤进
 * 诸子百家里去了——名实不副。故定一界：有人可挂者（nodeId 不空）仍入此函，
 * 《墨攻》之于墨子、《孔子家语》之于孔子皆是；无人可挂而专挂一书者，归「四库书影」。
 */
export function adaptationsOfWorldPersona(world: MediaWorld): Adaptation[] {
  return adaptationsOfWorld(world).filter((a) => a.nodeId !== "" || !a.bookId);
}

/** 「四库书影」函所收：凡挂在可读之书上的演绎，部次由调用处依四库目录排。 */
export function bookAdaptations(): Adaptation[] {
  return ADAPTATIONS.filter((a) => a.bookId);
}

/** 挂在某本世界文学书上的片段（世界文学轴 · 书内影音栏）。 */
export function clipsOfLit(litId: string): MediaClip[] {
  return MEDIA_CLIPS.filter((c) => c.litId === litId);
}

/** 挂在某本世界文学书上的演绎目录。 */
export function adaptationsOfLit(litId: string): Adaptation[] {
  return ADAPTATIONS.filter((a) => a.litId === litId);
}

/** 挂在某部四库可读之书上的演绎目录（四库书页 · 书前影音栏）。 */
export function adaptationsOfBook(bookId: string): Adaptation[] {
  return ADAPTATIONS.filter((a) => a.bookId === bookId);
}

/** 挂在某部四库可读之书上的片段。 */
export function clipsOfBook(bookId: string): MediaClip[] {
  return MEDIA_CLIPS.filter((c) => c.bookId === bookId);
}

/** 一行影音：目录条一部片，其下或附所演之幕（指回此片之片段）。 */
export type MediaRow = { ad: Adaptation; scene?: MediaClip };

/**
 * 并卡——凡列影音处（书页之影音栏、跨媒介之总目）皆取此一式，故置于此而不留在某一层。
 *
 * 片段若以 `adaptationId` 指回其所出之片，便并入那一行（行下附一笺），不另出一条：
 * 否则同一部《王子复仇记》目录出一行、片段又出一行，看着就是重复。
 * 所指之片不在此列者（片段挂此书而其片挂于别书），仍照旧独列——宁可多一条，
 * 不可凭空少一条。一片有两幕者只附其一，余者亦归独列，不致遗落。
 */
export function mergeMedia(
  ads: Adaptation[],
  clips: MediaClip[],
): { rows: MediaRow[]; loose: MediaClip[] } {
  const here = new Set(ads.map((a) => a.id));
  const scene = new Map<string, MediaClip>();
  clips.forEach((c) => {
    if (c.adaptationId && here.has(c.adaptationId) && !scene.has(c.adaptationId)) {
      scene.set(c.adaptationId, c);
    }
  });
  const merged = new Set([...scene.values()].map((c) => c.id));
  return {
    rows: ads.map((a) => ({ ad: a, scene: scene.get(a.id) })),
    loose: clips.filter((c) => !merged.has(c.id)),
  };
}

/** 按 id 取一条片段。点评席凭 id 入席，故须有此一查。 */
export function clipById(id: string): MediaClip | undefined {
  return MEDIA_CLIPS.find((c) => c.id === id);
}

/** 按 id 取一条演绎目录。目录条目如今也可点入点评席，与片段同例。 */
export function adaptationById(id: string): Adaptation | undefined {
  return ADAPTATIONS.find((a) => a.id === id);
}

/**
 * 一条演绎目录之「主人公」——请谁坐首席。
 *
 * 目录条目本无 owner 字段：挂人者（nodeId 是人格）即以其人为主；
 * 只挂书不挂人者（如《红楼梦》挂 honglou、《王子复仇记》挂 hamlet），
 * 便看同挂一书的片段奉谁为主——莎士比亚之于《哈姆莱特》即由此得。
 * 俱无则返空串，点评席无首席，只邀他人（与片段 owner 为空同例）。
 */
export function ownerOfAdaptation(a: Adaptation, isPersona: (id: string) => boolean): string {
  if (a.nodeId && isPersona(a.nodeId)) return a.nodeId;
  const sibs = [
    ...(a.litId ? clipsOfLit(a.litId) : []),
    ...(a.bookId ? clipsOfBook(a.bookId) : []),
    ...(a.nodeId ? clipsOf(a.nodeId) : []),
  ];
  return sibs.find((c) => c.owner && isPersona(c.owner))?.owner ?? "";
}

/**
 * 关键词检索影视片段（B）。与典籍 retrieve 同形：多词命中加分，
 * 未启用语义向量时纯关键词，不报错。返回按 score 降序，limit 截断。
 */
export function retrieveMedia(
  term: string,
  opts: { limit?: number; nodeId?: string; world?: MediaWorld } = {},
): MediaClip[] {
  const limit = opts.limit ?? 6;
  const terms = term.trim().split(/\s+/).filter(Boolean);
  // 检索默认限在战国一路：典籍图谱里搜「金箍」不该搜出大话西游。
  // 旧条目不标 world 即战国，故不传 world 时行为与从前一致。
  const inWorld = (c: MediaClip) => (c.world ?? "zhanguo") === (opts.world ?? "zhanguo");
  if (terms.length === 0) return opts.nodeId ? clipsOf(opts.nodeId).filter(inWorld).slice(0, limit) : [];
  const pool = (opts.nodeId ? clipsOf(opts.nodeId) : MEDIA_CLIPS).filter(inWorld);
  const scored = pool
    .map((c) => {
      let score = 0;
      for (const t of terms) {
        const w = t.length > 1 ? 2 : 1;
        if (c.text.includes(t)) score += 2 * w;
        if (c.gloss.includes(t)) score += 1.5 * w;
        if (c.work.includes(t)) score += 1.2 * w;
        if (c.keywords.some((k) => k.includes(t))) score += 1.5 * w;
      }
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
  return scored;
}
