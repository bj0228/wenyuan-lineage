import { scholarMap } from "./characters";

/**
 * 百家演变脉络数据：生年（公元前）、学派分道、师承/出于/影响/交游边。
 *
 * 库中 `characters.ts` 只有学派与言行，**无**生卒、师承；此处为脉络图新撰的
 * 近似定值（生年取学界常见说法之约数，师承取其大者），仅供「演变脉络」一图阅览，
 * 不入人物发言/辩论逻辑。鬼谷子、子思为「幽灵节点」——仅于此图示其位，
 * 不入 `scholars`、不出现在地图/辩论/对谈。
 */

export type School = { id: string; name: string; color: string; founderId: string };

/** 九道（八家 ＋ 杂家），按 lane 序（脉络图纵列自上而下）。颜色取该家代表人物之色。 */
export const SCHOOLS: School[] = [
  { id: "ru", name: "儒家", color: "#9c3f2f", founderId: "kong" },
  { id: "dao", name: "道家", color: "#31716e", founderId: "laozi" },
  { id: "mo", name: "墨家", color: "#334d47", founderId: "mo" },
  { id: "fa", name: "法家", color: "#44495c", founderId: "han" },
  { id: "zongheng", name: "纵横家", color: "#6b4a8a", founderId: "suqin" },
  { id: "ming", name: "名家", color: "#4f7a3a", founderId: "gongsun" },
  { id: "yinyang", name: "阴阳家", color: "#2e3260", founderId: "zou" },
  { id: "bing", name: "兵家", color: "#6a5236", founderId: "sunwu" },
  { id: "za", name: "杂家", color: "#5a3a7a", founderId: "lvbuwei" },
  { id: "nong", name: "农家", color: "#5a6a3a", founderId: "xuhsing" },
];

/** 地域（籍贯之约数）调色板：「地域色」模式按此着色，观思想之地域传播。
 *  籍贯取学界常见说法之约数（如老子楚苦县、庄子宋蒙、韩非韩之诸公子），仅供阅览。 */
export const ORIGINS: { id: string; name: string; color: string }[] = [
  { id: "qilu", name: "齐鲁", color: "#d4691e" },
  { id: "chu", name: "楚", color: "#1f8a70" },
  { id: "song", name: "宋", color: "#c9a227" },
  { id: "sanjin", name: "三晋", color: "#8e44ad" },
  { id: "zhou", name: "周", color: "#6b7280" },
];

/** 诸子近似生年（公元前）与所属道、籍贯地域（origin 之约数）。 */
export const SCHOLAR_CHRONO: { id: string; birthBC: number; schoolId: string; origin: string }[] = [
  { id: "laozi", birthBC: 570, schoolId: "dao", origin: "chu" },
  { id: "kong", birthBC: 551, schoolId: "ru", origin: "qilu" },
  { id: "sunwu", birthBC: 545, schoolId: "bing", origin: "qilu" },
  { id: "zengzi", birthBC: 505, schoolId: "ru", origin: "qilu" },
  { id: "zisi", birthBC: 483, schoolId: "ru", origin: "qilu" },
  { id: "mo", birthBC: 476, schoolId: "mo", origin: "qilu" },
  { id: "liezi", birthBC: 450, schoolId: "dao", origin: "zhou" },
  { id: "yangzhu", birthBC: 440, schoolId: "dao", origin: "zhou" },
  { id: "guigu", birthBC: 400, schoolId: "zongheng", origin: "zhou" },
  { id: "shangyang", birthBC: 390, schoolId: "fa", origin: "sanjin" },
  { id: "xuhsing", birthBC: 390, schoolId: "nong", origin: "chu" },
  { id: "suqin", birthBC: 380, schoolId: "zongheng", origin: "zhou" },
  { id: "sunbin", birthBC: 380, schoolId: "bing", origin: "qilu" },
  { id: "meng", birthBC: 372, schoolId: "ru", origin: "qilu" },
  { id: "huishi", birthBC: 370, schoolId: "ming", origin: "song" },
  { id: "zhangyi", birthBC: 370, schoolId: "zongheng", origin: "sanjin" },
  { id: "zhuang", birthBC: 369, schoolId: "dao", origin: "song" },
  { id: "gongsun", birthBC: 320, schoolId: "ming", origin: "sanjin" },
  { id: "xun", birthBC: 313, schoolId: "ru", origin: "sanjin" },
  { id: "zou", birthBC: 305, schoolId: "yinyang", origin: "qilu" },
  { id: "lvbuwei", birthBC: 292, schoolId: "za", origin: "sanjin" },
  { id: "han", birthBC: 280, schoolId: "fa", origin: "sanjin" },
  // 四库典籍补全之诸子（2026-10-15）：书先在架，人后追认。生年取学界约数。
  { id: "lvwang", birthBC: 1100, schoolId: "bing", origin: "zhou" },
  { id: "guanzhong", birthBC: 725, schoolId: "fa", origin: "qilu" },
  { id: "rangju", birthBC: 550, schoolId: "bing", origin: "qilu" },
  { id: "dengxi", birthBC: 545, schoolId: "ming", origin: "sanjin" },
  { id: "wuqi", birthBC: 440, schoolId: "bing", origin: "sanjin" },
  { id: "shenbuhai", birthBC: 400, schoolId: "fa", origin: "sanjin" },
  { id: "shendao", birthBC: 390, schoolId: "fa", origin: "sanjin" },
  { id: "yinwen", birthBC: 370, schoolId: "ming", origin: "qilu" },
  { id: "weiliao", birthBC: 340, schoolId: "bing", origin: "sanjin" },
  { id: "wenzi", birthBC: 480, schoolId: "dao", origin: "chu" },
  { id: "huangshigong", birthBC: 290, schoolId: "bing", origin: "zhou" },
];

/** 幽灵节点：不入 `scholars`，仅于此脉络图示其位（师承溯源之用）。子思、鬼谷子已升入学者表，此唯余文王。 */
export const GHOSTS: { id: string; name: string; glyph: string; birthBC: number; schoolId: string; origin: string; note: string; /** 只入典籍图谱，不入诸子脉络图（汉以后著者；文王为先秦溯源，两图皆在） */ canonOnly?: boolean }[] = [
  { id: "wenwang", name: "周文王", glyph: "文", birthBC: 1150, schoolId: "ru", origin: "zhou", note: "姬昌，周文王，相传演《周易》而作卦辞；儒家奉为先圣。" },
  // —— 四库诸书之著者（2026-10-15）：汉以后著书者非诸子，不入 `scholars`、
  //    不入辩论与地图，仅于此二图（典籍图谱/脉络图）示其位、系其书之思想。
  //    同文王之例——幽灵只作溯源之用。birthBC 取其人之约数（汉以后用负数表公元后）。
  { id: "quyuan", name: "屈原", glyph: "屈", birthBC: 340, schoolId: "za", origin: "chu", note: "楚之同姓大夫，忧愤而作《离骚》，香草美人以配忠贞。", canonOnly: true },
  { id: "liuxiang", name: "刘向", glyph: "刘", birthBC: 77, schoolId: "za", origin: "sanjin", note: "汉宗室，校书天禄阁，集《战国策》《说苑》《新序》《列仙传》。", canonOnly: true },
  { id: "dongzhongshu", name: "董仲舒", glyph: "董", birthBC: 179, schoolId: "yinyang", origin: "sanjin", note: "汉儒宗，天人三策，《春秋繁露》天人感应之说。", canonOnly: true },
  { id: "simaqian", name: "司马迁", glyph: "迁", birthBC: 145, schoolId: "za", origin: "sanjin", note: "汉太史令，究天人之际、通古今之变，成一家之言（《史记》）。", canonOnly: true },
  { id: "liuan", name: "刘安", glyph: "安", birthBC: 179, schoolId: "dao", origin: "sanjin", note: "汉淮南王，招客集《淮南子》，牢笼天地、博极人情。", canonOnly: true },
  { id: "wangchong", name: "王充", glyph: "王", birthBC: 27, schoolId: "za", origin: "sanjin", note: "汉处士，闭门潜思《论衡》，实事疾妄、归实诚。", canonOnly: true },
  { id: "gehong", name: "葛洪", glyph: "葛", birthBC: 283, schoolId: "dao", origin: "sanjin", note: "晋丹阳人，抱朴子内篇论神仙方药、炼养形神。", canonOnly: true },
  { id: "liuyiqing", name: "刘义庆", glyph: "义", birthBC: 403, schoolId: "za", origin: "sanjin", note: "南朝宋临川王，招才学之士集《世说新语》。", canonOnly: true },
  { id: "liuxie", name: "刘勰", glyph: "勰", birthBC: 465, schoolId: "za", origin: "sanjin", note: "南朝梁，笃志好学，《文心雕龙》体大思精。", canonOnly: true },
  { id: "zhongrong", name: "钟嵘", glyph: "钟", birthBC: 468, schoolId: "za", origin: "sanjin", note: "南朝梁，品第汉魏至梁五言诗人，《诗品》辨彰清浊。", canonOnly: true },
  { id: "huineng", name: "惠能", glyph: "能", birthBC: -638, schoolId: "za", origin: "sanjin", note: "禅宗六祖，不识文字而悟道，《坛经》记其言——中国佛教唯一称经之祖师录。", canonOnly: true },
  { id: "jiasixie", name: "贾思勰", glyph: "贾", birthBC: -450, schoolId: "nong", origin: "qilu", note: "北魏高阳太守，采捃经传、《齐民要术》农政之要。", canonOnly: true },
  { id: "simaguang", name: "司马光", glyph: "光", birthBC: -1019, schoolId: "za", origin: "sanjin", note: "宋涑水先生，编《资治通鉴》，鉴前世之兴衰。", canonOnly: true },
  { id: "zhuxi", name: "朱熹", glyph: "朱", birthBC: -1130, schoolId: "ru", origin: "sanjin", note: "宋晦庵先生，集理学之大成，《朱子语类》格物致知之教。", canonOnly: true },
  { id: "wangshouren", name: "王守仁", glyph: "守", birthBC: -1472, schoolId: "ru", origin: "sanjin", note: "明阳明子，龙场悟道，《传习录》知行合一之教。", canonOnly: true },
  { id: "yuanhuang", name: "袁黄", glyph: "袁", birthBC: -1533, schoolId: "za", origin: "sanjin", note: "明了几先生，《了凡四训》立命之说、功过格之教。", canonOnly: true },
  { id: "songyingxing", name: "宋应星", glyph: "宋", birthBC: -1587, schoolId: "za", origin: "sanjin", note: "明奉新人，《天工开物》贵五谷而贱金玉。", canonOnly: true },
  { id: "shinaian", name: "施耐庵", glyph: "施", birthBC: -1296, schoolId: "za", origin: "sanjin", note: "元末明初人，相传集撰《水浒传》。", canonOnly: true },
  { id: "luoguanzhong", name: "罗贯中", glyph: "罗", birthBC: -1330, schoolId: "za", origin: "sanjin", note: "元末明初人，《三国演义》七实三虚。", canonOnly: true },
  { id: "wuchengen", name: "吴承恩", glyph: "承", birthBC: -1500, schoolId: "za", origin: "sanjin", note: "明射阳山人，《西游记》心猿之喻。", canonOnly: true },
  { id: "sanshiliuji", name: "三十六计", glyph: "计", birthBC: -1600, schoolId: "bing", origin: "sanjin", note: "明清之际辑成之兵家佚名汇编，托南朝宋檀道济事。", canonOnly: true },
  { id: "pusongling", name: "蒲松龄", glyph: "蒲", birthBC: -1640, schoolId: "za", origin: "sanjin", note: "清柳泉居士，《聊斋志异》孤愤之书。", canonOnly: true },
  { id: "wujingzi", name: "吴敬梓", glyph: "敬", birthBC: -1701, schoolId: "za", origin: "sanjin", note: "清文木老人，《儒林外史》功名之讽。", canonOnly: true },
  { id: "caoxueqin", name: "曹雪芹", glyph: "雪", birthBC: -1715, schoolId: "za", origin: "sanjin", note: "清悼红轩主，《红楼梦》色空之辨，十年辛苦不寻常。", canonOnly: true },
  { id: "liruzhen", name: "李汝珍", glyph: "汝", birthBC: -1763, schoolId: "za", origin: "sanjin", note: "清松石道人，《镜花缘》才情之颂。", canonOnly: true },
  { id: "wangguowei", name: "王国维", glyph: "观", birthBC: -1877, schoolId: "za", origin: "sanjin", note: "清民之际海宁王氏，《人间词话》境界说。", canonOnly: true },
  // 无撰人之书，依《三十六计》托名成节之例，以书自为幽灵，系其思想
  { id: "shanhaijing", name: "山海经", glyph: "海", birthBC: 1000, schoolId: "za", origin: "zhou", note: "旧题大禹、伯益所作，实为先秦方术之书所萃——山川草木鸟兽虫鱼，志怪之祖。", canonOnly: true },
  { id: "puji", name: "普济", glyph: "济", birthBC: -1179, schoolId: "za", origin: "sanjin", note: "宋灵隐寺住持，辑禅门五家机缘为《五灯会元》。", canonOnly: true },
];

/** 脉络图节点类型：学者 / 幽灵 / 典籍 / 思想。后两类为脉络图新撰，仅供阅览，不入发言/辩论逻辑。 */
export type NodeType = "scholar" | "ghost" | "book" | "idea";

/** 典籍（书级）：成书约年（公元前）、所属道、著者。id 加 bk- 前缀避与学者 id 冲突。
 *  纵横三家（鬼谷子/苏子/张子）原书多佚，取后学辑本与《战国策》所载言策为之；
 *  惠施无专著，立《惠子》以系其「历物十事」（散见《庄子·天下》）；子思《子思子》亦后学辑。
 *  周易相传文王演卦、孔子作传；尚书相传孔子删定——皆非独撰，著者取其关系最深者，note 注明。 */
export const BOOKS: { id: string; name: string; authorId: string; schoolId: string; bc: number; note: string }[] = [
  { id: "bk-lunyu", name: "论语", authorId: "kong", schoolId: "ru", bc: 480, note: "孔门后学辑录孔子言行。" },
  { id: "bk-daodejing", name: "道德经", authorId: "laozi", schoolId: "dao", bc: 500, note: "老子著五千言，道家之本。" },
  { id: "bk-sunzi", name: "孙子兵法", authorId: "sunwu", schoolId: "bing", bc: 510, note: "孙武著，兵家之祖。" },
  { id: "bk-mozi", name: "墨子", authorId: "mo", schoolId: "mo", bc: 440, note: "墨家言行与论辩集。" },
  { id: "bk-zhuangzi", name: "庄子", authorId: "zhuang", schoolId: "dao", bc: 340, note: "庄周及后学，汪洋恣肆。" },
  { id: "bk-mengzi", name: "孟子", authorId: "meng", schoolId: "ru", bc: 320, note: "孟轲及其徒记述。" },
  { id: "bk-xunzi", name: "荀子", authorId: "xun", schoolId: "ru", bc: 300, note: "荀况著，儒而开法家之端。" },
  { id: "bk-gongsun", name: "公孙龙子", authorId: "gongsun", schoolId: "ming", bc: 300, note: "公孙龙辩者之言。" },
  { id: "bk-hanfeizi", name: "韩非子", authorId: "han", schoolId: "fa", bc: 280, note: "韩非集法家大成。" },
  { id: "bk-lvshi", name: "吕氏春秋", authorId: "lvbuwei", schoolId: "za", bc: 239, note: "吕不韦门客杂纂，兼收并蓄。" },
  // 纵横（原书多佚，辑本与战国策载言）
  { id: "bk-guigu", name: "鬼谷子", authorId: "guigu", schoolId: "zongheng", bc: 380, note: "纵横捭阖之术，后学辑录。" },
  { id: "bk-suzi", name: "苏子", authorId: "suqin", schoolId: "zongheng", bc: 320, note: "苏秦合纵言策，多佚，散见《战国策》。" },
  { id: "bk-zhangzi", name: "张子", authorId: "zhangyi", schoolId: "zongheng", bc: 320, note: "张仪连横言策，多佚，散见《战国策》。" },
  // 名·阴阳（无专著者立辑）
  { id: "bk-huizi", name: "惠子", authorId: "huishi", schoolId: "ming", bc: 350, note: "惠施历物十事，散见《庄子·天下》。" },
  { id: "bk-zouzi", name: "邹子", authorId: "zou", schoolId: "yinyang", bc: 290, note: "邹衍五德终始、大九州说，多佚。" },
  // 儒（幽灵子思）
  { id: "bk-zisi", name: "子思子", authorId: "zisi", schoolId: "ru", bc: 440, note: "子思及门人记述，《中庸》相传出其手。" },
  // 四库典籍补全（2026-10-15）：十家名下之书先前在四库可读而图谱未收，今补齐。
  // 孙膑兵法正文同日切片入库（银雀山汉简本），旧注「久佚」改「重现」。
  { id: "bk-guanzi", name: "管子", authorId: "guanzhong", schoolId: "fa", bc: 400, note: "管仲及后学，托名之作；轻重、牧民、内业，法家之先声而杂黄老。" },
  { id: "bk-wenzi", name: "文子", authorId: "wenzi", schoolId: "dao", bc: 400, note: "老子弟子记其言，解老而杂黄老刑名，下开文景之治。" },
  { id: "bk-dengxizi", name: "邓析子", authorId: "dengxi", schoolId: "ming", bc: 500, note: "邓析及后学，两可之说、无穷之辞，名辩之先河。" },
  { id: "bk-yinwenzi", name: "尹文子", authorId: "yinwen", schoolId: "ming", bc: 320, note: "尹文及后学，名以检形、形以检名，稷下黄老刑名之间。" },
  { id: "bk-shenzi", name: "申子", authorId: "shenbuhai", schoolId: "fa", bc: 340, note: "申不害及后学，主术——循名责实、君操其柄，法家「术」系由此立。" },
  { id: "bk-shenzi2", name: "慎子", authorId: "shendao", schoolId: "fa", bc: 300, note: "慎到及后学，主势——势位足以屈贤者，法家「势」系由此立。" },
  { id: "bk-wuzi", name: "吴子", authorId: "wuqi", schoolId: "bing", bc: 390, note: "吴起及后学，内修文德、外治武备，用兵在治不在众。" },
  { id: "bk-simafa", name: "司马法", authorId: "rangju", schoolId: "bing", bc: 400, note: "田穰苴及齐威王诸臣追论古司马兵法，以仁为本、以义治之，军礼之遗。" },
  { id: "bk-weiliaozi", name: "尉繚子", authorId: "weiliao", schoolId: "bing", bc: 320, note: "尉缭及后学，天官不若人事，兵刑相守，杂刑名于兵家。" },
  { id: "bk-liutao", name: "六韬", authorId: "lvwang", schoolId: "bing", bc: 300, note: "托吕望与文武问答，文伐、发机、韬晦，兵家权谋之祖（旧题）。" },
  { id: "bk-sanlue", name: "三略", authorId: "huangshigong", schoolId: "bing", bc: 200, note: "托黄石公圯上授张良事，柔弱制刚强、因敌转化（旧题）。" },
  // 公共典籍（著者取关系最深者，非独撰）
  { id: "bk-zhouyi", name: "周易", authorId: "wenwang", schoolId: "ru", bc: 1050, note: "文王演卦，相传作卦辞；孔子作十翼传之。群经之首。" },
  { id: "bk-shangshu", name: "尚书", authorId: "kong", schoolId: "ru", bc: 500, note: "记尧舜禹汤武之政，相传孔子删定。上古政书。" },
  { id: "bk-shangjun", name: "商君书", authorId: "shangyang", schoolId: "fa", bc: 340, note: "商鞅及后学，法家耕战、任法不任人之本。" },
  { id: "bk-sunbinfa", name: "孙膑兵法", authorId: "sunbin", schoolId: "bing", bc: 340, note: "孙膑著，银雀山汉简出土残简；久佚千余年，1972 年重现，四库正文已切。" },
  { id: "bk-liezi", name: "列子", authorId: "liezi", schoolId: "dao", bc: 350, note: "列御寇及后学，《冲虚真经》，寓言瑰丽，贵虚顺物。" },
  { id: "bk-yangzi", name: "杨子", authorId: "yangzhu", schoolId: "dao", bc: 420, note: "杨朱无专著，辑其言散见《孟子》《列子·杨朱》《吕氏春秋》。" },
  { id: "bk-xuhsing", name: "神农之言", authorId: "xuhsing", schoolId: "nong", bc: 380, note: "许行无专著，辑其事见《孟子·滕文公上》，农家并耕之说。" },
  { id: "bk-daxue", name: "大学", authorId: "zengzi", schoolId: "ru", bc: 430, note: "曾子及后学述作，儒家修齐治平之纲；本《礼记》篇，宋人表章。" },
  { id: "bk-xiaojing", name: "孝经", authorId: "zengzi", schoolId: "ru", bc: 430, note: "曾子问孝、孔子答，孝为德本；十八章。" },
];

/** 思想概念：所属道、盛行约年（公元前）、代表人物。id 加 id- 前缀避与学派 id（如 fa）冲突。
 *  用以连「主张」（人→思想）、「承变/对立」（思想↔思想）边。 */
export const IDEAS: { id: string; name: string; schoolId: string; bc: number; scholarId: string; note: string }[] = [
  { id: "id-ren", name: "仁", schoolId: "ru", bc: 500, scholarId: "kong", note: "儒之核，爱人复礼。" },
  { id: "id-li", name: "礼", schoolId: "ru", bc: 500, scholarId: "kong", note: "克己复礼，秩序之分。" },
  { id: "id-yi", name: "义", schoolId: "ru", bc: 370, scholarId: "meng", note: "行之宜，合于道。" },
  { id: "id-xingshan", name: "性善", schoolId: "ru", bc: 370, scholarId: "meng", note: "四端固有，性本善。" },
  { id: "id-xinge", name: "性恶", schoolId: "ru", bc: 300, scholarId: "xun", note: "其善者伪也，待教化。" },
  { id: "id-dao", name: "道", schoolId: "dao", bc: 500, scholarId: "laozi", note: "万物本根，不可言说。" },
  { id: "id-wuwei", name: "无为", schoolId: "dao", bc: 500, scholarId: "laozi", note: "道常无为而无不为。" },
  { id: "id-xiaoyao", name: "逍遥", schoolId: "dao", bc: 340, scholarId: "zhuang", note: "乘物游心，无所待。" },
  { id: "id-jianai", name: "兼爱", schoolId: "mo", bc: 440, scholarId: "mo", note: "视人之国若己之国。" },
  { id: "id-feigong", name: "非攻", schoolId: "mo", bc: 440, scholarId: "mo", note: "攻国为大不义。" },
  { id: "id-jieyong", name: "节用", schoolId: "mo", bc: 440, scholarId: "mo", note: "去无用之费。" },
  { id: "id-fa", name: "法", schoolId: "fa", bc: 280, scholarId: "han", note: "法不阿贵，绳不挠曲。" },
  { id: "id-shushi", name: "术势", schoolId: "fa", bc: 280, scholarId: "han", note: "二柄刑德，君之驭臣。" },
  { id: "id-mingshi", name: "名实", schoolId: "ming", bc: 300, scholarId: "gongsun", note: "名实之辩，正名指物。" },
  { id: "id-wude", name: "五德终始", schoolId: "yinyang", bc: 300, scholarId: "zou", note: "五行相胜，受命代嬗。" },
  { id: "id-qizheng", name: "奇正", schoolId: "bing", bc: 510, scholarId: "sunwu", note: "兵无常势，奇正相生。" },
  { id: "id-hezong", name: "合纵连横", schoolId: "zongheng", bc: 330, scholarId: "suqin", note: "缩长之策，纵横捭阖。" },
  { id: "id-nongzhan", name: "耕战", schoolId: "fa", bc: 360, scholarId: "shangyang", note: "以农战富国强兵，利出一孔。" },
  { id: "id-yinshi", name: "因势", schoolId: "bing", bc: 350, scholarId: "sunbin", note: "因势利导，批亢捣虚，以奇胜。" },
  { id: "id-xu", name: "贵虚", schoolId: "dao", bc: 400, scholarId: "liezi", note: "体虚顺物，御风而行，守虚得其真。" },
  { id: "id-weiwo", name: "为我", schoolId: "dao", bc: 440, scholarId: "yangzhu", note: "全性保真，拔一毛利天下不为。" },
  { id: "id-binggeng", name: "并耕", schoolId: "nong", bc: 390, scholarId: "xuhsing", note: "君臣并耕而食，市贾不贰。" },
  { id: "id-xiao", name: "孝", schoolId: "ru", bc: 480, scholarId: "zengzi", note: "孝为德本，慎终追远，吾日三省。" },
  { id: "id-shen", name: "省", schoolId: "ru", bc: 480, scholarId: "zengzi", note: "吾日三省吾身，修身之本。" },
  // —— 十二部补全之书的思想（2026-10-15）：依书义理提炼，一派一承 ——
  { id: "id-qingzhong", name: "轻重", schoolId: "fa", bc: 400, scholarId: "guanzhong", note: "轻重九府，通汙滞、制丰歉，富国在驭利权。" },
  { id: "id-mumin", name: "牧民", schoolId: "fa", bc: 420, scholarId: "guanzhong", note: "政之所兴在顺民心，仓廪实则知礼节。" },
  { id: "id-shu", name: "术", schoolId: "fa", bc: 350, scholarId: "shenbuhai", note: "循名责实，君操其柄；明君如身，臣如手。" },
  { id: "id-shi", name: "势", schoolId: "fa", bc: 300, scholarId: "shendao", note: "贤者未足以服众，势位足以屈贤者。" },
  { id: "id-liangke", name: "两可", schoolId: "ming", bc: 500, scholarId: "dengxi", note: "操两可之说，设无穷之辞，是非在人所主。" },
  { id: "id-jianxing", name: "检形", schoolId: "ming", bc: 320, scholarId: "yinwen", note: "名以检形、形以检名；名正则治，名丧则乱。" },
  { id: "id-wende", name: "文德武备", schoolId: "bing", bc: 390, scholarId: "wuqi", note: "内修文德，外治武备；用兵在治不在众。" },
  { id: "id-renben", name: "以战止战", schoolId: "bing", bc: 400, scholarId: "rangju", note: "以仁为本，以义治之；国虽大好战必亡，忘战必危。" },
  { id: "id-rengshi", name: "天官人事", schoolId: "bing", bc: 320, scholarId: "weiliao", note: "天官时日不若人事；兵者以武为植、以文为种。" },
  { id: "id-wenfa", name: "文伐", schoolId: "bing", bc: 300, scholarId: "lvwang", note: "不战而屈人之国：因其所喜顺其所欲，文事伐之。" },
  { id: "id-rousheng", name: "柔弱制刚", schoolId: "bing", bc: 200, scholarId: "huangshigong", note: "柔能制刚，弱能制强；因敌转化，兼四者而制其宜。" },
  { id: "id-shangren", name: "上仁", schoolId: "dao", bc: 400, scholarId: "wenzi", note: "道德之治，功成不名有；上仁与道合，文景之治由此。" },
  // —— 现有可读书的思想补全（2026-10-15）：原二十四条是诸子主张，今自书中抽其要义，
  //    使可读之书每部皆有思想在图。学派归依其书之部属大旨（儒家主经部、道家主子部…），
  //    小说笔记归杂家。bc 取成书或思想盛行之约年。
  { id: "id-yinyang", name: "阴阳", schoolId: "yinyang", bc: 1000, scholarId: "wenwang", note: "一阴一阳之谓道；观变于阴阳而立卦（《周易》）。" },
  { id: "id-bian", name: "变", schoolId: "ru", bc: 500, scholarId: "kong", note: "穷则变，变则通，通则久（《周易·系辞》）。" },
  { id: "id-minben", name: "民本", schoolId: "ru", bc: 500, scholarId: "kong", note: "民惟邦本，本固邦宁（《尚书·五子之歌》）。" },
  { id: "id-sixie", name: "思无邪", schoolId: "ru", bc: 500, scholarId: "kong", note: "诗三百，一言以蔽之，曰思无邪（《诗经》孔子所论）。" },
  { id: "id-datong", name: "大同", schoolId: "ru", bc: 300, scholarId: "kong", note: "大道之行也，天下为公（《礼记·礼运》）。" },
  { id: "id-xiaozhi", name: "孝治", schoolId: "ru", bc: 400, scholarId: "zengzi", note: "以孝治天下（《孝经》），孝为德之本、治之基。" },
  { id: "id-sanbuxiu", name: "三不朽", schoolId: "ru", bc: 500, scholarId: "kong", note: "太上有立德，其次立功，其次立言（《春秋左传》穆叔论不朽）。" },
  { id: "id-chunqiu", name: "正名分", schoolId: "ru", bc: 200, scholarId: "kong", note: "《春秋》以道名分，一字之褒荣于华衮，一字之贬严于斧钺。" },
  { id: "id-quanmou", name: "权谋", schoolId: "zongheng", bc: 200, scholarId: "liuxiang", note: "《战国策》所载纵横短长之术，敷扬权变以济时急。" },
  { id: "id-tianren", name: "天人感应", schoolId: "yinyang", bc: 130, scholarId: "dongzhongshu", note: "天人相与之际，灾异谴告（《春秋繁露》）。" },
  { id: "id-huainan", name: "因循", schoolId: "dao", bc: 130, scholarId: "liuan", note: "因循而任下，责成而不劳（《淮南子》主术训承黄老）。" },
  { id: "id-xuwang", name: "疾虚妄", schoolId: "za", bc: -80, scholarId: "wangchong", note: "实事疾妄，归实诚（《论衡》）——讥虚美、考实效。" },
  { id: "id-qingtan", name: "清谈", schoolId: "za", bc: -420, scholarId: "liuyiqing", note: "《世说新语》所记魏晋名士风度——玄远之辩、任率之行。" },
  { id: "id-neidan", name: "神仙养生", schoolId: "dao", bc: -320, scholarId: "gehong", note: "玄寂求仙、炼养形神（《抱朴子内篇》）道教育养之说。" },
  { id: "id-dunwu", name: "顿悟", schoolId: "za", bc: -670, scholarId: "huineng", note: "不立文字，直指人心，见性成佛（《坛经》）。" },
  { id: "id-jianshi", name: "资治", schoolId: "za", bc: -1080, scholarId: "simaguang", note: "鉴前世之兴衰，考当今之得失（《资治通鉴》）。" },
  { id: "id-gewu", name: "格物致知", schoolId: "ru", bc: -1190, scholarId: "zhuxi", note: "即物穷理，格物而后知至（《朱子语类》）。" },
  { id: "id-zhixing", name: "知行合一", schoolId: "ru", bc: -1510, scholarId: "wangshouren", note: "知是行之始，行是知之成（《传习录》）。" },
  { id: "id-lixue", name: "立命", schoolId: "za", bc: -1600, scholarId: "yuanhuang", note: "命由我作，福自己求（《了凡四训》）——功过格之教。" },
  { id: "id-tiangong", name: "天工开物", schoolId: "za", bc: -1630, scholarId: "songyingxing", note: "贵五谷而贱金玉，天人各半其功（《天工开物》）。" },
  { id: "id-guidao", name: "诡道", schoolId: "bing", bc: -1600, scholarId: "sanshiliuji", note: "兵者诡道，诳也——三十六计，走为上。" },
  { id: "id-zhongyi", name: "忠义", schoolId: "za", bc: -1380, scholarId: "shinaian", note: "替天行道、兄弟义气（《水浒传》）草泽之伦理。" },
  { id: "id-xinyuan", name: "心猿", schoolId: "za", bc: -1590, scholarId: "wuchengen", note: "心猿意马，猿熟马驯方成佛（《西游记》）修心之喻。" },
  { id: "id-sekong", name: "色空", schoolId: "za", bc: -1760, scholarId: "caoxueqin", note: "假作真时真亦假，无为有处有还无（《红楼梦》）梦觉之辨。" },
  { id: "id-zhiguai", name: "志怪", schoolId: "za", bc: -1700, scholarId: "pusongling", note: "集腋为裘，妄续幽冥之录（《聊斋志异》）孤愤之书。" },
  { id: "id-gongming", name: "功名", schoolId: "za", bc: -1750, scholarId: "wujingzi", note: "功名富贵无凭据（《儒林外史》）士林之讽。" },
  { id: "id-jingjie", name: "境界", schoolId: "za", bc: -1900, scholarId: "wangguowei", note: "有我之境无我之境，三重境界说（《人间词话》）。" },
  { id: "id-zaidao", name: "文以载道", schoolId: "za", bc: -500, scholarId: "liuxie", note: "道沿圣以垂文，圣因文而明道（《文心雕龙》）。" },
  { id: "id-xiangcao", name: "香草美人", schoolId: "za", bc: 300, scholarId: "quyuan", note: "善鸟香草以配忠贞，恶禽臭物以比谗佞（楚辞之喻）。" },
  { id: "id-bowu", name: "博物", schoolId: "za", bc: 300, scholarId: "shanhaijing", note: "山川草木鸟兽虫鱼，志怪之祖（《山海经》）。" },
  { id: "id-caiqing", name: "才情", schoolId: "za", bc: -1810, scholarId: "liruzhen", note: "百花齐放的女儿才情之颂（《镜花缘》）。" },
  { id: "id-wenjian", name: "博识", schoolId: "za", bc: -1690, scholarId: "songyingxing", note: "穷物理、多见而后断（《天工开物》之余绪、格物之遗风）。" },
  { id: "id-tongbian", name: "通变", schoolId: "za", bc: 91, scholarId: "simaqian", note: "究天人之际，通古今之变，成一家之言（《史记》）。" },
  { id: "id-ziwei", name: "滋味", schoolId: "za", bc: -513, scholarId: "zhongrong", note: "使味之者无极，闻之者动心（《诗品》五言之道）。" },
  { id: "id-shuntian", name: "顺天时", schoolId: "nong", bc: -540, scholarId: "jiasixie", note: "顺天时，量地利，则用力少而成功多（《齐民要术》）。" },
  { id: "id-yanyi", name: "演义", schoolId: "za", bc: -1360, scholarId: "luoguanzhong", note: "依史以演事，文不甚深，言不甚俗（《三国演义》开演义之体）。" },
  { id: "id-nianhua", name: "拈花微笑", schoolId: "za", bc: -1253, scholarId: "puji", note: "不立文字，教外别传——拈花一微笑，心传五家灯（《五灯会元》）。" },
];

const isBookId = (id: string) => id.startsWith("bk-");
const isIdeaId = (id: string) => id.startsWith("id-");
const originOfPerson = (id: string) => SCHOLAR_CHRONO.find((c) => c.id === id)?.origin ?? GHOSTS.find((g) => g.id === id)?.origin;
/** 节点之地域 id：人物取籍贯，典籍承著者，思想承代表人物。 */
export const originIdOfNode = (id: string): string | undefined => {
  if (isBookId(id)) return originOfPerson(BOOKS.find((b) => b.id === id)?.authorId ?? "");
  if (isIdeaId(id)) return originOfPerson(IDEAS.find((it) => it.id === id)?.scholarId ?? "");
  return originOfPerson(id);
};
/** 节点之地域色：人物取籍贯，典籍承著者，思想承代表人物；无籍贯者灰。 */
export const originColorOf = (id: string): string => ORIGINS.find((x) => x.id === originIdOfNode(id))?.color ?? "#9a8e7b";

// —— 节点解析助手：脉络图与典籍图谱共用（自 LineageMap 抽出，单一来源）——

export const isGhost = (id: string) => GHOSTS.some((g) => g.id === id);
export const isBook = (id: string) => id.startsWith("bk-");
export const isIdea = (id: string) => id.startsWith("id-");
export const bookOf = (id: string) => BOOKS.find((b) => b.id === id);
export const ideaOf = (id: string) => IDEAS.find((it) => it.id === id);
export const nameOf = (id: string) => scholarMap[id]?.name ?? GHOSTS.find((g) => g.id === id)?.name ?? id;
export const glyphOf = (id: string) => scholarMap[id]?.glyph ?? GHOSTS.find((g) => g.id === id)?.glyph ?? "?";
export const nodeTypeOf = (id: string): NodeType => (isGhost(id) ? "ghost" : isBook(id) ? "book" : isIdea(id) ? "idea" : "scholar");
export const labelOf = (id: string): string => (isBook(id) ? bookOf(id)?.name ?? id : isIdea(id) ? ideaOf(id)?.name ?? id : nameOf(id));
export const kindLabel = (id: string) => (isBook(id) ? "典籍" : isIdea(id) ? "思想" : isGhost(id) ? "幽灵" : "人物");
export const schoolIdOf = (id: string): string | undefined =>
  isBook(id) ? bookOf(id)?.schoolId : isIdea(id) ? ideaOf(id)?.schoolId : (SCHOLAR_CHRONO.find((c) => c.id === id)?.schoolId ?? GHOSTS.find((g) => g.id === id)?.schoolId);
export const schoolColorOf = (id: string) => SCHOOLS.find((s) => s.id === schoolIdOf(id))?.color ?? "#888";
export const schoolNameOf = (id: string) => SCHOOLS.find((s) => s.id === schoolIdOf(id))?.name ?? "";
/** 节点之时序年（公元前）：人物生年／典籍成书年／思想盛行年。
 *  汉以后者以负数表公元后（如王国维 -1877＝公元 1877），见 GHOSTS 之注。 */
export const bcOf = (id: string): number => {
  if (isBook(id)) return bookOf(id)?.bc ?? 0;
  if (isIdea(id)) return ideaOf(id)?.bc ?? 0;
  return SCHOLAR_CHRONO.find((s) => s.id === id)?.birthBC ?? GHOSTS.find((g) => g.id === id)?.birthBC ?? 0;
};
/** 纪年显示：正数＝约前 X 年，负数＝约公元 X 年（典籍图谱详情用，脉络图轴内全为先秦、径用「前X」）。 */
export const eraOf = (bc: number): string => (bc > 0 ? `约前${bc}年` : bc < 0 ? `约公元${-bc}年` : "");
/** 幽灵是否只入典籍图谱（汉以后著者），诸子脉络图不绘。 */
export const isCanonOnly = (id: string) => GHOSTS.find((g) => g.id === id)?.canonOnly === true;
/** 节点释义：典籍／思想／幽灵取其 note，人物取其 intro。 */
export const noteOf = (id: string): string => {
  if (isBook(id)) return bookOf(id)?.note ?? "";
  if (isIdea(id)) return ideaOf(id)?.note ?? "";
  if (isGhost(id)) return GHOSTS.find((g) => g.id === id)?.note ?? "";
  return scholarMap[id]?.intro ?? "";
};
/** 某类节点的全部 id（典籍图谱三维度用；scholar 含幽灵）。 */
export const nodesByType = (type: NodeType): string[] =>
  type === "idea" ? IDEAS.map((i) => i.id)
  : type === "book" ? BOOKS.map((b) => b.id)
  : [...SCHOLAR_CHRONO.map((c) => c.id), ...GHOSTS.map((g) => g.id)];

export type EdgeType = "师承" | "出于" | "影响" | "交游" | "著述" | "主张" | "承变" | "对立" | "注解" | "非";

/** 边型样式：色 / 虚线 dash / 是否有向（箭头）。交游·对立无向，故无箭头。 */
export const EDGE_STYLES: Record<EdgeType, { color: string; dash: string; arrow: boolean; label: string }> = {
  师承: { color: "#5e8a78", dash: "none", arrow: true, label: "师承" },
  出于: { color: "#a07a2a", dash: "6 4", arrow: true, label: "出于" },
  影响: { color: "#8a8270", dash: "2 5", arrow: true, label: "影响" },
  交游: { color: "#7a5aa0", dash: "none", arrow: false, label: "交游" },
  著述: { color: "#6b4a2a", dash: "none", arrow: true, label: "著述" }, // 人→书，深褐实线有向
  主张: { color: "#3a5a78", dash: "none", arrow: true, label: "主张" }, // 人→思想，墨蓝实线有向
  承变: { color: "#4a7a8a", dash: "6 4", arrow: true, label: "承变" }, // 思想→思想，青虚线有向
  对立: { color: "#9c3f2f", dash: "2 5", arrow: false, label: "对立" }, // 思想↔思想，朱点线无向
  注解: { color: "#7a5c3a", dash: "4 3", arrow: true, label: "注解" }, // 典籍→典籍，褐短虚线有向（注解/征引）
  非: { color: "#c2543b", dash: "5 3", arrow: true, label: "非" }, // 人→思想，朱橙长虚线有向（非/反对）
};

/**
 * 为何没有「书→思想」这一类边。
 *
 * 曾按字面统计生成过一类「载」边：某思想的字样在某书的若干段里连写出现过，便
 * 连一条。撤掉了，因为判据不成立——一个思想要连到一本书或一个人，得是**这本书、
 * 这个人真正持有的主张**，或**文中某句话所表达的意思**；「这几个字出现过」两样
 * 都不是。最刺眼的是「道」：10912 段里命中 2127 段，26 部书有 25 部「载道」——
 * 先秦汉语的「道」是道路、说道、道理，这条边证明不了《孙子》主张道家之道。
 *
 * 故义理之断仍只出自下面这张手写表（事实类：著述/师承/出于/注解；主张类：
 * 主张/影响/承变/对立/非/交游）。原文不拿来造边，拿来给既有的边作证——那条路
 * 走语义而非字面：《孟子》几乎不连写「性善」二字，他写「人性之善也，犹水之就
 * 下也」，字面检索永远找不着，语义检索找得着（见 CanonGraphLayer 的出处一节）。
 */

/**
 * 边的两档硬度。同是手写，硬度差得远，画图时不该一样粗。
 *
 * 「事实」是基本无争议的事实陈述：谁写了哪本书（著述）、谁师事谁（师承）、哪本
 * 书注解哪本书（注解）、某家出于某家（出于）。错了是错，不是见解不同。
 *
 * 「解释」是义理之断：说某人主张某思想（主张）、受谁影响（影响）、两种思想相
 * 承变或相对立（承变/对立）、谁非谁（非）、谁与谁交游（交游）。这些是读出来的，
 * 换一个人读可能换一种连法——它们该画得轻，且默认可以收起来。
 *
 * 全图默认只摊开「事实」那 47 条；「解释」那 119 条点到节点才展其所系，或由
 * 图例上的开关一并放出。171 个节点若把 166 条边一次画全，必成一团乱麻。
 */
export const EDGE_TIER: Record<EdgeType, "事实" | "解释"> = {
  著述: "事实",
  师承: "事实",
  注解: "事实",
  出于: "事实",
  主张: "解释",
  影响: "解释",
  承变: "解释",
  对立: "解释",
  非: "解释",
  交游: "解释",
};

export const isFactEdge = (t: EdgeType): boolean => EDGE_TIER[t] === "事实";

/** 演变脉络边：from→to，表「to 师承/出于/受影响于/交游 from」之关系。 */
export const LINEAGE_EDGES: { from: string; to: string; type: EdgeType }[] = [
  { from: "kong", to: "meng", type: "影响" }, // 孟子私淑孔子
  { from: "zisi", to: "meng", type: "师承" }, // 孟子受业子思门人
  { from: "kong", to: "mo", type: "出于" }, // 墨子出于儒
  { from: "xun", to: "han", type: "师承" }, // 韩非师荀子（荀开法家之端）
  { from: "guigu", to: "suqin", type: "师承" },
  { from: "guigu", to: "zhangyi", type: "师承" },
  { from: "laozi", to: "zhuang", type: "影响" }, // 庄子承老学
  { from: "laozi", to: "han", type: "影响" }, // 韩非解老、喻老
  { from: "sunwu", to: "sunbin", type: "影响" }, // 孙膑承孙武兵学
  { from: "laozi", to: "liezi", type: "影响" }, // 列子承老学
  { from: "kong", to: "zengzi", type: "师承" }, // 曾子师孔子
  { from: "zengzi", to: "zisi", type: "师承" }, // 子思受业曾子
  { from: "huishi", to: "zhuang", type: "交游" }, // 惠施与庄子相善

  // 著述（人→书）
  { from: "kong", to: "bk-lunyu", type: "著述" },
  { from: "laozi", to: "bk-daodejing", type: "著述" },
  { from: "sunwu", to: "bk-sunzi", type: "著述" },
  { from: "mo", to: "bk-mozi", type: "著述" },
  { from: "zhuang", to: "bk-zhuangzi", type: "著述" },
  { from: "meng", to: "bk-mengzi", type: "著述" },
  { from: "xun", to: "bk-xunzi", type: "著述" },
  { from: "gongsun", to: "bk-gongsun", type: "著述" },
  { from: "han", to: "bk-hanfeizi", type: "著述" },
  { from: "lvbuwei", to: "bk-lvshi", type: "著述" },
  { from: "guigu", to: "bk-guigu", type: "著述" },
  { from: "suqin", to: "bk-suzi", type: "著述" },
  { from: "zhangyi", to: "bk-zhangzi", type: "著述" },
  { from: "huishi", to: "bk-huizi", type: "著述" },
  { from: "zou", to: "bk-zouzi", type: "著述" },
  { from: "zisi", to: "bk-zisi", type: "著述" },
  { from: "wenwang", to: "bk-zhouyi", type: "著述" },
  { from: "kong", to: "bk-shangshu", type: "著述" },
  { from: "shangyang", to: "bk-shangjun", type: "著述" },
  { from: "sunbin", to: "bk-sunbinfa", type: "著述" },
  { from: "liezi", to: "bk-liezi", type: "著述" },
  { from: "yangzhu", to: "bk-yangzi", type: "著述" },
  { from: "xuhsing", to: "bk-xuhsing", type: "著述" },
  { from: "zengzi", to: "bk-daxue", type: "著述" },
  { from: "zengzi", to: "bk-xiaojing", type: "著述" },
  // 著述（人→书）：四库补全之十一人
  { from: "guanzhong", to: "bk-guanzi", type: "著述" },
  { from: "wenzi", to: "bk-wenzi", type: "著述" },
  { from: "dengxi", to: "bk-dengxizi", type: "著述" },
  { from: "yinwen", to: "bk-yinwenzi", type: "著述" },
  { from: "shenbuhai", to: "bk-shenzi", type: "著述" },
  { from: "shendao", to: "bk-shenzi2", type: "著述" },
  { from: "wuqi", to: "bk-wuzi", type: "著述" },
  { from: "rangju", to: "bk-simafa", type: "著述" },
  { from: "weiliao", to: "bk-weiliaozi", type: "著述" },
  { from: "lvwang", to: "bk-liutao", type: "著述" },
  { from: "huangshigong", to: "bk-sanlue", type: "著述" },

  // 人物间（新诸子与旧诸子）：师承/出于/影响/交游，依史实取其大者
  { from: "laozi", to: "wenzi", type: "师承" }, // 文子老子弟子（《汉书·艺文志》道家类注）
  { from: "guanzhong", to: "shangyang", type: "影响" }, // 商鞅变法承管仲富强之术
  { from: "guanzhong", to: "han", type: "影响" }, // 韩非集法家，溯源及管仲
  { from: "guanzhong", to: "lvbuwei", type: "影响" }, // 《管子》轻重之术，《吕氏春秋》多征引
  { from: "zisi", to: "shenbuhai", type: "影响" }, // 申子主术，兼采君人南面之学（韩非谓「术」)
  { from: "huangshigong", to: "shenbuhai", type: "交游" }, // 皆战国晚期谋略家，相善（后世并称）
  { from: "shenbuhai", to: "shendao", type: "交游" }, // 申慎并称，同主刑名
  { from: "shendao", to: "han", type: "影响" }, // 韩非集法家，势取慎到
  { from: "shenbuhai", to: "han", type: "影响" }, // 术取申不害
  { from: "rangju", to: "sunwu", type: "影响" }, // 孙武兵学承古司马法之遗
  { from: "rangju", to: "wuqi", type: "影响" }, // 吴起兵法承司马法军礼
  { from: "wuqi", to: "sunbin", type: "影响" }, // 孙膑兵法承吴起
  { from: "lvwang", to: "rangju", type: "影响" }, // 司马法追论太公兵法
  { from: "lvwang", to: "weiliao", type: "影响" }, // 尉缭子权谋承六韬
  { from: "weiliao", to: "han", type: "影响" }, // 尉缭子刑名之学，韩非多采其意
  { from: "dengxi", to: "gongsun", type: "影响" }, // 公孙龙辩学承邓析名辩
  { from: "dengxi", to: "huishi", type: "影响" }, // 惠施合同异承邓析两可之说
  { from: "yinwen", to: "gongsun", type: "交游" }, // 尹文公孙龙俱游平原君门（《吕氏春秋》）
  { from: "shendao", to: "zhuang", type: "交游" }, // 慎到先黄老，《庄子·天下》与彭蒙同举

  // 主张（人→思想）
  { from: "kong", to: "id-ren", type: "主张" },
  { from: "kong", to: "id-li", type: "主张" },
  { from: "meng", to: "id-yi", type: "主张" },
  { from: "meng", to: "id-xingshan", type: "主张" },
  { from: "xun", to: "id-xinge", type: "主张" },
  { from: "laozi", to: "id-dao", type: "主张" },
  { from: "laozi", to: "id-wuwei", type: "主张" },
  { from: "zhuang", to: "id-xiaoyao", type: "主张" },
  { from: "mo", to: "id-jianai", type: "主张" },
  { from: "mo", to: "id-feigong", type: "主张" },
  { from: "mo", to: "id-jieyong", type: "主张" },
  { from: "han", to: "id-fa", type: "主张" },
  { from: "han", to: "id-shushi", type: "主张" },
  { from: "gongsun", to: "id-mingshi", type: "主张" },
  { from: "huishi", to: "id-mingshi", type: "主张" },
  { from: "zou", to: "id-wude", type: "主张" },
  { from: "sunwu", to: "id-qizheng", type: "主张" },
  { from: "suqin", to: "id-hezong", type: "主张" },
  { from: "zhangyi", to: "id-hezong", type: "主张" },
  { from: "shangyang", to: "id-nongzhan", type: "主张" },
  { from: "sunbin", to: "id-yinshi", type: "主张" },
  { from: "liezi", to: "id-xu", type: "主张" },
  { from: "yangzhu", to: "id-weiwo", type: "主张" },
  { from: "xuhsing", to: "id-binggeng", type: "主张" },
  { from: "zengzi", to: "id-xiao", type: "主张" },
  { from: "zengzi", to: "id-shen", type: "主张" },
  // 主张（人→思想）：十一子各主其说
  { from: "guanzhong", to: "id-qingzhong", type: "主张" },
  { from: "guanzhong", to: "id-mumin", type: "主张" },
  { from: "shenbuhai", to: "id-shu", type: "主张" },
  { from: "shendao", to: "id-shi", type: "主张" },
  { from: "dengxi", to: "id-liangke", type: "主张" },
  { from: "yinwen", to: "id-jianxing", type: "主张" },
  { from: "wuqi", to: "id-wende", type: "主张" },
  { from: "rangju", to: "id-renben", type: "主张" },
  { from: "weiliao", to: "id-rengshi", type: "主张" },
  { from: "lvwang", to: "id-wenfa", type: "主张" },
  { from: "huangshigong", to: "id-rousheng", type: "主张" },
  { from: "wenzi", to: "id-shangren", type: "主张" },
  // 现有诸子对其书之思想（书在人已在前，思想自书抽出，故由其主者连边）
  { from: "kong", to: "id-yinyang", type: "主张" },
  { from: "kong", to: "id-bian", type: "主张" },
  { from: "kong", to: "id-minben", type: "主张" },
  { from: "kong", to: "id-sixie", type: "主张" },
  { from: "kong", to: "id-datong", type: "主张" },
  { from: "kong", to: "id-sanbuxiu", type: "主张" },
  { from: "kong", to: "id-chunqiu", type: "主张" },
  { from: "zengzi", to: "id-xiaozhi", type: "主张" },
  // 汉以后著者各主其书之说（幽灵著者，只入典籍图谱——见 GHOSTS 之 canonOnly 注）
  { from: "quyuan", to: "id-xiangcao", type: "主张" },
  { from: "liuxiang", to: "id-quanmou", type: "主张" },
  { from: "dongzhongshu", to: "id-tianren", type: "主张" },
  { from: "simaqian", to: "id-tongbian", type: "主张" },
  { from: "liuan", to: "id-huainan", type: "主张" },
  { from: "wangchong", to: "id-xuwang", type: "主张" },
  { from: "gehong", to: "id-neidan", type: "主张" },
  { from: "liuyiqing", to: "id-qingtan", type: "主张" },
  { from: "liuxie", to: "id-zaidao", type: "主张" },
  { from: "zhongrong", to: "id-ziwei", type: "主张" },
  { from: "huineng", to: "id-dunwu", type: "主张" },
  { from: "jiasixie", to: "id-shuntian", type: "主张" },
  { from: "simaguang", to: "id-jianshi", type: "主张" },
  { from: "zhuxi", to: "id-gewu", type: "主张" },
  { from: "wangshouren", to: "id-zhixing", type: "主张" },
  { from: "yuanhuang", to: "id-lixue", type: "主张" },
  { from: "songyingxing", to: "id-tiangong", type: "主张" },
  { from: "songyingxing", to: "id-wenjian", type: "主张" },
  { from: "shinaian", to: "id-zhongyi", type: "主张" },
  { from: "luoguanzhong", to: "id-yanyi", type: "主张" },
  { from: "wuchengen", to: "id-xinyuan", type: "主张" },
  { from: "sanshiliuji", to: "id-guidao", type: "主张" },
  { from: "pusongling", to: "id-zhiguai", type: "主张" },
  { from: "wujingzi", to: "id-gongming", type: "主张" },
  { from: "caoxueqin", to: "id-sekong", type: "主张" },
  { from: "liruzhen", to: "id-caiqing", type: "主张" },
  { from: "wangguowei", to: "id-jingjie", type: "主张" },
  { from: "shanhaijing", to: "id-bowu", type: "主张" },
  { from: "puji", to: "id-nianhua", type: "主张" },

  // 承变（思想→思想，有向演化）
  { from: "id-wuwei", to: "id-xiaoyao", type: "承变" }, // 逍遥承无为
  { from: "id-dao", to: "id-fa", type: "承变" }, // 韩非解老、喻老
  { from: "id-ren", to: "id-jianai", type: "承变" }, // 兼爱针对仁之差等
  { from: "id-li", to: "id-fa", type: "承变" }, // 礼之分启法之度
  { from: "id-dao", to: "id-mingshi", type: "承变" }, // 名实本于道之常名
  { from: "id-yinyang", to: "id-tianren", type: "承变" }, // 天人感应承易之阴阳
  { from: "id-tongbian", to: "id-jianshi", type: "承变" }, // 资治承通变
  { from: "id-gewu", to: "id-zhixing", type: "承变" }, // 知行合一承格物致知

  // 对立（思想↔思想，无向）
  { from: "id-jianai", to: "id-ren", type: "对立" }, // 无差等 vs 差等之爱
  { from: "id-xingshan", to: "id-xinge", type: "对立" }, // 性善 vs 性恶
  { from: "id-wuwei", to: "id-li", type: "对立" }, // 自然 vs 礼法
  { from: "id-feigong", to: "id-fa", type: "对立" }, // 非攻 vs 富国强兵之兵

  // 注解（典籍→典籍，注解/征引，有向）
  { from: "bk-zhuangzi", to: "bk-daodejing", type: "注解" }, // 庄子内篇承老、解道
  { from: "bk-hanfeizi", to: "bk-daodejing", type: "注解" }, // 韩非子解老、喻老
  { from: "bk-lvshi", to: "bk-daodejing", type: "注解" }, // 吕氏春秋征引老子

  // 非（人→思想，非/反对，有向）
  { from: "mo", to: "id-li", type: "非" }, // 墨子非儒之礼乐繁文
  { from: "zhuang", to: "id-li", type: "非" }, // 庄子非礼法（残朴以为器）
  { from: "xun", to: "id-xingshan", type: "非" }, // 荀子非孟轲性善
  { from: "han", to: "id-ren", type: "非" }, // 韩非非仁义惠慈

  // 承变（补）
  { from: "id-xinge", to: "id-fa", type: "承变" }, // 性恶待法教，启法家
  { from: "id-mingshi", to: "id-li", type: "承变" }, // 正名本于礼之分

  // 对立（补）
  { from: "id-fa", to: "id-li", type: "对立" }, // 法 vs 礼
  { from: "id-jieyong", to: "id-li", type: "对立" }, // 节用 vs 礼乐繁文
];

/** 节点集合内部的全部边（典籍图谱三维度子图用）。 */
export const edgesAmong = (idSet: Set<string>): { from: string; to: string; type: EdgeType }[] =>
  LINEAGE_EDGES.filter((e) => idSet.has(e.from) && idSet.has(e.to));

/** 与某节点直接相关的全部边（节点详情侧栏用）。 */
export const relationsOf = (id: string): { from: string; to: string; type: EdgeType }[] =>
  LINEAGE_EDGES.filter((e) => e.from === id || e.to === id);
