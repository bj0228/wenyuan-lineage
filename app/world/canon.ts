import { fold } from "./hanVariants";
import { termWeight } from "./sikuTerms";
import { xiyouPassages } from "./xiyou-passages";
import { westPassages } from "./west-passages";

export type Passage = {
  id: string;
  book: string;
  chapter: string;
  /**
   * 归属人物，"" 表示公共典籍。
   *
   * 三层模型（Persona ──role──> Work ──contains──> Passage）之下，这个字段其实
   * 身兼二职：《论语》的 `owner: "kong"` 说的是「孔子是这话的**说话人**」，
   * 而《韩非子》的 `owner: "hanfei"` 说的是「韩非是这书的**作者**」。诸子语录里
   * 二者多半重合，故一个字段够用；接上小说就不够了——《西游记》的作者是吴承恩，
   * 可说话的是孙悟空。于是另立 `speaker`／`workId`，见下。
   *
   * 这 750 条一字未改：`speakerOf()` 以 `speaker ?? owner` 兜底，检索仍照常。
   */
  owner: string;
  text: string;
  gloss: string;
  keywords: string[];
  /**
   * 说话人。与 `owner` 分开，是因为小说里作者与说话人不是一个人。
   * 省略即取 `owner`——诸子那批数据因此无需改写。
   */
  speaker?: string;
  /** 所属作品 id（对应 lineage.ts 的 BOOKS 或四库的 bookId）。省略者按 `book` 书名认。 */
  workId?: string;
  /** 所属世界，省略即 `zhanguo`。西游对白抽取产出的条目写 `xiyou`。 */
  worldId?: string;
  /** 出处细目，如西游的回目「第七回」。省略者以 `chapter` 为准。 */
  locus?: string;
  /**
   * 西文原句。只西方那一轴有：那边 `text` 本就是译文，原文另在一处。
   * 有此字段者，锚点卡以原文为正、`text` 退作下一行的译文。
   * 无此字段的西方条目，是译述者自己的话（严复的按语、吴汝纶的序、鲁迅的辨言），
   * 本无西文可配——卡上据实注明，不拿别处的英文冒充。
   */
  en?: string;
};

/** 说话人：`speaker` 优先，退回 `owner`。现有数据无 `speaker`，故等价于原行为。 */
export function speakerOf(p: Passage): string {
  return p.speaker ?? p.owner;
}

/** 所属世界：省略即战国。 */
export function worldOfPassage(p: Passage): string {
  return p.worldId ?? "zhanguo";
}

/** 典籍片段库。每条含出处、原文、白话与检索关键词。 */
export const canon: Passage[] = [
  { id: "lunyu-xueer-1", book: "论语", chapter: "学而", owner: "kong", text: "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？", gloss: "学过的东西按时温习，不也令人喜悦吗？", keywords: ["学", "习", "教育", "朋友", "为学", "读书"] },
  { id: "lunyu-yanyuan-1", book: "论语", chapter: "颜渊", owner: "kong", text: "克己复礼为仁。一日克己复礼，天下归仁焉。", gloss: "约束自己、回到礼的规范，就是仁。", keywords: ["仁", "礼", "克己", "修身", "人性"] },
  { id: "lunyu-weizheng-3", book: "论语", chapter: "为政", owner: "kong", text: "道之以政，齐之以刑，民免而无耻；道之以德，齐之以礼，有耻且格。", gloss: "用政令刑罚管束，百姓只求免罚而无羞耻心；用德与礼引导，百姓才会有羞耻心并归于正。", keywords: ["政", "刑", "礼", "德", "治国", "法", "制度"] },
  { id: "lunyu-zilu-3", book: "论语", chapter: "子路", owner: "kong", text: "名不正则言不顺，言不顺则事不成。", gloss: "名分不端正，说话就不顺理，事情也办不成。", keywords: ["名", "正名", "言", "秩序", "定义"] },
  { id: "lunyu-weilinggong", book: "论语", chapter: "卫灵公", owner: "kong", text: "己所不欲，勿施于人。", gloss: "自己不愿承受的，不要加在别人身上。", keywords: ["恕", "仁", "待人", "伦理", "他人"] },
  { id: "lunyu-jishi", book: "论语", chapter: "季氏", owner: "kong", text: "远人不服，则修文德以来之。既来之，则安之。", gloss: "远方之人不归附，就修明文教德政来招徕他们；来了就使他们安定。", keywords: ["战争", "征伐", "文德", "治国", "武力", "正当性"] },
  { id: "lunyu-shuer-shuxiu", book: "论语", chapter: "述而", owner: "kong", text: "自行束脩以上，吾未尝无诲焉。", gloss: "只要自行送上一束干肉（束脩）作为见面礼，我没有不教诲的。", keywords: ["束脩", "贽", "教", "有教无类", "求学", "礼", "学费", "诲"] },

  { id: "mengzi-gongsun-6", book: "孟子", chapter: "公孙丑上", owner: "meng", text: "恻隐之心，仁之端也；羞恶之心，义之端也。人之有是四端也，犹其有四体也。", gloss: "同情心是仁的开端，羞耻心是义的开端；人有这四端，就像有四肢一样自然。", keywords: ["性善", "四端", "人性", "恻隐", "仁", "义"] },
  { id: "mengzi-jinxin-14", book: "孟子", chapter: "尽心下", owner: "meng", text: "民为贵，社稷次之，君为轻。", gloss: "百姓最重要，国家次之，君主最轻。", keywords: ["民", "君", "治国", "民本", "政", "权力"] },
  { id: "mengzi-gongsun-3", book: "孟子", chapter: "公孙丑上", owner: "meng", text: "以力假仁者霸，以德行仁者王。", gloss: "靠武力假借仁义的是霸道，凭德行推行仁义的才是王道。", keywords: ["王道", "霸道", "仁政", "战争", "武力", "治国"] },
  { id: "mengzi-lianghui-1", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "王何必曰利？亦有仁义而已矣。", gloss: "君王何必谈利益？有仁义就够了。", keywords: ["利", "义", "仁义", "价值", "功利"] },

  { id: "xunzi-xinge", book: "荀子", chapter: "性恶", owner: "xun", text: "人之性恶，其善者伪也。", gloss: "人的本性趋恶，善是后天人为努力的结果。", keywords: ["性恶", "人性", "伪", "教化", "善"] },
  { id: "xunzi-quanxue", book: "荀子", chapter: "劝学", owner: "xun", text: "积土成山，风雨兴焉；积善成德，而神明自得。", gloss: "累积泥土成山，风雨便由此而生；累积善行成德，智慧自然具备。", keywords: ["学", "积", "修身", "习惯", "教育", "成长"] },
  { id: "xunzi-lilun", book: "荀子", chapter: "礼论", owner: "xun", text: "礼起于何也？曰：人生而有欲，欲而不得则不能无求，求而无度量分界则不能不争。", gloss: "礼从哪来？人生来有欲望，求而无节制就会争夺，礼即是划定分界。", keywords: ["礼", "欲", "争", "秩序", "制度", "分配"] },
  { id: "xunzi-tianlun", book: "荀子", chapter: "天论", owner: "xun", text: "天行有常，不为尧存，不为桀亡。", gloss: "自然运行有其常规，不因明君存在、也不因暴君消失。", keywords: ["天", "自然", "规律", "天人", "命运"] },

  { id: "mozi-jianai", book: "墨子", chapter: "兼爱中", owner: "mo", text: "视人之国若视其国，视人之家若视其家，视人之身若视其身。", gloss: "看待别国如自己的国，别家如自己的家，别人如自己。", keywords: ["兼爱", "他人", "平等", "伦理", "爱"] },
  { id: "mozi-feigong", book: "墨子", chapter: "非攻上", owner: "mo", text: "杀一人谓之不义，必有一死罪矣；杀十人十重不义，必有十死罪矣。今至大为不义攻国，则弗知非。", gloss: "杀一人算不义，攻打别国杀人无数，反倒无人指责，这是是非颠倒。", keywords: ["非攻", "战争", "义", "杀", "正当性"] },
  { id: "mozi-shangxian", book: "墨子", chapter: "尚贤上", owner: "mo", text: "官无常贵，而民无终贱。有能则举之，无能则下之。", gloss: "官员不会永远尊贵，百姓也不会永远卑贱；有能力就任用，没能力就罢免。", keywords: ["尚贤", "用人", "能力", "选拔", "制度", "平等"] },
  { id: "mozi-jieyong", book: "墨子", chapter: "节用上", owner: "mo", text: "圣人为政一国，一国可倍也……去无用之费，圣王之道。", gloss: "去掉无用的耗费，国力就能倍增，这是圣王之道。", keywords: ["节用", "费", "实用", "效率", "利", "资源"] },

  { id: "zhuangzi-qiwu", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "物无非彼，物无非是……是亦一无穷，非亦一无穷也。", gloss: "任何事物既是“彼”也是“此”，是非之辩没有尽头。", keywords: ["齐物", "是非", "相对", "分别", "争论"] },
  { id: "zhuangzi-qiuwu", book: "庄子", chapter: "秋水", owner: "zhuang", text: "子非鱼，安知鱼之乐？", gloss: "你不是鱼，怎么知道鱼的快乐？", keywords: ["知", "他者", "认知", "鱼", "乐", "理解"] },
  { id: "zhuangzi-yangsheng", book: "庄子", chapter: "养生主", owner: "zhuang", text: "吾生也有涯，而知也无涯。以有涯随无涯，殆已。", gloss: "生命有限而知识无穷，用有限追逐无穷，就危险了。", keywords: ["知", "生死", "有限", "学", "焦虑", "技术"] },
  { id: "zhuangzi-renjian", book: "庄子", chapter: "人间世", owner: "zhuang", text: "人皆知有用之用，而莫知无用之用也。", gloss: "人都知道有用的用处，却不懂无用的用处。", keywords: ["无用之用", "有用", "价值", "效率", "自然"] },
  { id: "zhuangzi-xiaoyao", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "若夫乘天地之正，而御六气之辩，以游无穷者，彼且恶乎待哉！", gloss: "顺应天地本然、驾驭六气变化而游于无穷的人，还有什么需要依赖呢？", keywords: ["逍遥", "自由", "自然", "道", "依赖"] },

  { id: "hanfei-youdu", book: "韩非子", chapter: "有度", owner: "han", text: "法不阿贵，绳不挠曲。法之所加，智者弗能辞，勇者弗敢争。", gloss: "法不偏袒权贵，如墨线不迁就弯木；法所加之处，聪明人无从推脱，勇武者不敢抗争。", keywords: ["法", "公平", "权贵", "制度", "执行"] },
  { id: "hanfei-wudu", book: "韩非子", chapter: "五蠹", owner: "han", text: "夫圣人之治国，不恃人之为吾善也，而用其不得为非也。", gloss: "治国不指望人人自愿为善，而是让人无法作恶。", keywords: ["法", "人性", "制度", "治国", "约束", "恶"] },
  { id: "hanfei-erbing", book: "韩非子", chapter: "二柄", owner: "han", text: "明主之所导制其臣者，二柄而已矣。二柄者，刑德也。", gloss: "君主驾驭臣下只靠两个把柄：刑罚与奖赏。", keywords: ["赏罚", "术", "君臣", "激励", "管理", "权力"] },
  { id: "hanfei-xianxue", book: "韩非子", chapter: "显学", owner: "han", text: "无参验而必之者，愚也；弗能必而据之者，诬也。", gloss: "没有验证就下断言是愚昧，不能确证却据以行事是欺人。", keywords: ["参验", "证据", "求真", "判断", "知"] },

  { id: "laozi-17", book: "老子", chapter: "十七章", owner: "", text: "太上，下知有之；其次，亲而誉之；其次，畏之；其次，侮之。", gloss: "最好的治理，百姓只知其存在；其次是亲近赞美，再次是畏惧，最下是轻侮。", keywords: ["治国", "无为", "君", "权力", "道"] },
  { id: "zhouyi-xici", book: "周易", chapter: "系辞下", owner: "", text: "穷则变，变则通，通则久。", gloss: "走到尽头就要变革，变革才能通达，通达才能长久。", keywords: ["变", "革新", "技术", "时势", "困境"] },
  { id: "shangshu-wuyi", book: "尚书", chapter: "无逸", owner: "", text: "先知稼穑之艰难，乃逸。", gloss: "先体会耕作的艰辛，才谈得上安逸。", keywords: ["民生", "劳作", "治国", "体察"] },

  // 道德经（老子）
  { id: "laozi-daode-1", book: "道德经", chapter: "一章", owner: "laozi", text: "道可道，非常道；名可名，非常名。", gloss: "可以说出来的道，不是恒常的道；可以叫出来的名，不是恒常的名。", keywords: ["道", "名", "言", "常", "玄", "不可言"] },
  { id: "laozi-daode-8", book: "道德经", chapter: "八章", owner: "laozi", text: "上善若水。水善利万物而不争，处众人之所恶，故几于道。", gloss: "最高的善像水：滋润万物而不争，居于众人所厌恶的低下处，所以接近于道。", keywords: ["水", "善", "不争", "道", "柔", "自然", "处下"] },
  { id: "laozi-daode-25", book: "道德经", chapter: "二十五章", owner: "laozi", text: "人法地，地法天，天法道，道法自然。", gloss: "人取法地，地取法天，天取法道，道取法其本然。", keywords: ["道", "自然", "天", "地", "人", "法"] },
  { id: "laozi-daode-37", book: "道德经", chapter: "三十七章", owner: "laozi", text: "道常无为而无不为。", gloss: "道从来不强为，却没有什么事是它做不到的。", keywords: ["无为", "道", "为", "治", "自然"] },
  { id: "laozi-daode-64", book: "道德经", chapter: "六十四章", owner: "laozi", text: "千里之行，始于足下。", gloss: "千里的远行，从脚下第一步开始。", keywords: ["积", "行", "始", "学", "渐进", "成"] },
  { id: "laozi-daode-76", book: "道德经", chapter: "七十六章", owner: "laozi", text: "坚强者死之徒，柔弱者生之徒。", gloss: "坚硬刚强是走向死亡的一类，柔弱是含藏生机的一类。", keywords: ["柔", "弱", "刚", "强", "生", "死"] },

  // 公孙龙子（公孙龙）
  { id: "gongsun-baima", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "马者，所以命形也；白者，所以命色也。命色者非命形也，故曰：白马非马。", gloss: "马是命名形体的，白是命名颜色的；命色不等于命形，所以说白马不是马。", keywords: ["白马非马", "名", "实", "色", "形", "指物", "离坚白", "辩"] },
  { id: "gongsun-zhiwu", book: "公孙龙子", chapter: "指物论", owner: "gongsun", text: "物莫非指，而指非指。", gloss: "事物无不由指谓而成其所是，但指谓本身并不是被指谓之物。", keywords: ["指物", "名", "实", "指", "物", "辩", "概念"] },
  { id: "gongsun-jianbai", book: "公孙龙子", chapter: "坚白论", owner: "gongsun", text: "离也者，藏也，天下固有是独而正。", gloss: "所谓离，即坚、白、石各自潜藏、各自独立而得其正。", keywords: ["离坚白", "坚", "白", "石", "离", "名", "辩"] },
  { id: "gongsun-mingshi", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "夫名，实谓也。知此之非此也，知此之不在此也，则不谓也。", gloss: "名是对实的称呼；明知此名不指此实、此实不在此处，就不该这样称呼。", keywords: ["名实", "名", "实", "正名", "指物", "辩"] },

  // 惠施历物之意（庄子·天下载惠施十事）
  { id: "huishi-liwu-1", book: "庄子", chapter: "天下·历物", owner: "huishi", text: "至大无外，谓之大一；至小无内，谓之小一。", gloss: "大到没有外部边界，叫做大一；小到没有内部可分，叫做小一。", keywords: ["大一", "小一", "历物", "万物", "同异", "辩", "名实"] },
  { id: "huishi-liwu-2", book: "庄子", chapter: "天下·历物", owner: "huishi", text: "天与地卑，山与泽平。", gloss: "天与地一样低，山与水泽一样平——高低之分本是相对的。", keywords: ["同异", "历物", "相对", "万物", "辩", "高低"] },
  { id: "huishi-liwu-3", book: "庄子", chapter: "天下·历物", owner: "huishi", text: "泛爱万物，天地一体也。", gloss: "博爱万物，天地原是一个整体。", keywords: ["万物", "一体", "同异", "历物", "爱", "天地"] },

  // 孙子兵法（孙武）
  { id: "sunzi-shiji-1", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "兵者，国之大事，死生之地，存亡之道，不可不察也。", gloss: "战争关系国家的生死存亡，不可不慎察。", keywords: ["兵", "国", "存亡", "慎战", "战争", "大事"] },
  { id: "sunzi-mougong-1", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "不战而屈人之兵，善之善者也。", gloss: "不经交战便使敌军屈服，方为上善。", keywords: ["不战", "屈人", "全胜", "善", "伐谋", "胜"] },
  { id: "sunzi-mougong-2", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "上兵伐谋，其次伐交，其次伐兵，其下攻城。", gloss: "用兵之上是以智谋挫敌，其次外交，其次野战，最下攻城。", keywords: ["伐谋", "伐交", "伐兵", "攻城", "用兵", "胜"] },
  { id: "sunzi-xushi-1", book: "孙子兵法", chapter: "虚实", owner: "sunwu", text: "兵无常势，水无常形；能因敌变化而取胜者，谓之神。", gloss: "用兵无固定阵势，如水无常形；能因敌情变化取胜的，可谓神妙。", keywords: ["势", "虚实", "水", "变", "胜", "兵"] },
  { id: "sunzi-zuozhan-1", book: "孙子兵法", chapter: "作战", owner: "sunwu", text: "不尽知用兵之害者，则不能尽知用兵之利也。", gloss: "不尽知用兵之害，便不能尽知用兵之利。", keywords: ["用兵", "害", "利", "慎战", "战争", "胜"] },

  // 邹衍（著作佚，依史记·孟子荀卿列传、吕氏春秋·应同载其说）
  { id: "zou-wude", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "五德从所不胜，虞土、夏木、殷金、周火。", gloss: "五行之德以相胜之序代嬗：虞属土、夏属木、殷属金、周属火，一德胜一德而受命。", keywords: ["五德", "终始", "相胜", "土", "木", "金", "火", "水", "受命"] },
  { id: "zou-dajiuzhou", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "中国外如赤县神州者九，乃所谓九州也。于是有裨海环之。", gloss: "中国之外如赤县神州这般大的州共有九州，即所谓大九州，各被小海环绕。", keywords: ["大九州", "九州", "天下", "赤县神州", "海"] },
  { id: "zou-fuying", book: "吕氏春秋", chapter: "应同", owner: "zou", text: "凡帝王者之将兴也，天必先见祥乎下民。", gloss: "凡帝王将兴起时，天必先降符祥于下民以示其受命。", keywords: ["符应", "祥瑞", "天", "受命", "德", "兴"] },
  { id: "zou-xiaoxi", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "邹子作主运之篇，阴阳消息，以显其德。", gloss: "邹衍作主运之篇，推阴阳消长之机，以彰各代所当之德。", keywords: ["阴阳", "消息", "时运", "德", "终始", "五德"] },

  // —— 典籍扩容 ——
  // 论语（孔子）补
  { id: "lunyu-liyue-meizi", book: "论语", chapter: "里仁", owner: "kong", text: "里仁为美。择不处仁，焉得知？", gloss: "居处于仁厚之乡才是美；选择居处不依于仁，怎算明智？", keywords: ["仁", "处", "邻", "环境", "择", "智"] },
  { id: "lunyu-yongye-zhisheng", book: "论语", chapter: "雍也", owner: "kong", text: "质胜文则野，文胜质则史。文质彬彬，然后君子。", gloss: "质朴胜过文采则粗野，文采胜过质朴则浮华；文质相称，才是君子。", keywords: ["质", "文", "君子", "中庸", "平衡", "修养"] },
  { id: "lunyu-shuer-sanren", book: "论语", chapter: "述而", owner: "kong", text: "三人行，必有我师焉。择其善者而从之，其不善者而改之。", gloss: "三人同行，其中必有可为吾师者；择其善而从，见其不善而自省改正。", keywords: ["师", "学", "善", "修身", "他人", "反省"] },
  { id: "lunyu-taibo-shi", book: "论语", chapter: "泰伯", owner: "kong", text: "士不可以不弘毅，任重而道远。", gloss: "士人不可不弘大坚毅，因为担子重、路途远。", keywords: ["士", "弘毅", "任重", "道远", "志", "修身"] },
  { id: "lunyu-zihan-sanjun", book: "论语", chapter: "子罕", owner: "kong", text: "三军可夺帅也，匹夫不可夺志也。", gloss: "三军的主帅可以被夺去，一个普通人的志向却不可被夺。", keywords: ["志", "意志", "匹夫", "三军", "操守", "立志"] },
  { id: "lunyu-zilu-shenzheng", book: "论语", chapter: "子路", owner: "kong", text: "其身正，不令而行；其身不正，虽令不从。", gloss: "自身端正，不下令人们也跟从；自身不正，虽下令人们也不从。", keywords: ["身正", "令", "政", "表率", "治国", "德"] },
  { id: "lunyu-zizhang-boxue", book: "论语", chapter: "子张", owner: "kong", text: "博学而笃志，切问而近思，仁在其中矣。", gloss: "博学而守志不移，恳切发问而就近反思，仁就在其中了。", keywords: ["学", "志", "问", "思", "仁", "为学"] },
  { id: "lunyu-weizheng-de", book: "论语", chapter: "为政", owner: "kong", text: "为政以德，譬如北辰，居其所而众星共之。", gloss: "以德治国，如北极星居其位，众星环绕归向。", keywords: ["德", "为政", "北辰", "治国", "表率", "众"] },

  // 孔子补（仁/礼/学/君子/政/孝/教/天命/信/富贵/文艺/勇/过/理想，至逾五十条）
  { id: "lunyu-weizheng-xuesi", book: "论语", chapter: "为政", owner: "kong", text: "学而不思则罔，思而不学则殆。", gloss: "只学不思会迷惘，只思不学会危险。", keywords: ["学", "思", "为学", "求知", "方法"] },
  { id: "lunyu-weizheng-wenguzhixin", book: "论语", chapter: "为政", owner: "kong", text: "温故而知新，可以为师矣。", gloss: "温习旧知而能悟出新理，就可以做老师了。", keywords: ["温故", "知新", "学", "师", "方法"] },
  { id: "lunyu-weizheng-zhibuzhi", book: "论语", chapter: "为政", owner: "kong", text: "知之为知之，不知为不知，是知也。", gloss: "知道就是知道，不知道就是不知道，这才是真知。", keywords: ["知", "诚实", "求知", "态度", "智"] },
  { id: "lunyu-gongye-minhaoxue", book: "论语", chapter: "公冶长", owner: "kong", text: "敏而好学，不耻下问。", gloss: "勤敏而好学，不以向地位低者请教为耻。", keywords: ["好学", "下问", "谦", "学", "求知"] },
  { id: "lunyu-weizheng-zhixue", book: "论语", chapter: "为政", owner: "kong", text: "吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲不逾矩。", gloss: "我十五岁立志向学，三十立身，四十不惑，五十知天命，六十耳顺，七十随心所欲又不越规矩。", keywords: ["志学", "天命", "修身", "年", "境界", "矩"] },
  { id: "lunyu-liyuan-zhaowen", book: "论语", chapter: "里仁", owner: "kong", text: "朝闻道，夕死可矣。", gloss: "早上听闻了大道，晚上死去也无憾。", keywords: ["道", "闻道", "志", "生死", "求道"] },
  { id: "lunyu-liyuan-eyi", book: "论语", chapter: "里仁", owner: "kong", text: "士志于道，而耻恶衣恶食者，未足与议也。", gloss: "士人立志于道，却以粗衣劣食为耻，就不值一谈了。", keywords: ["士", "道", "耻", "衣食", "志", "俭"] },
  { id: "lunyu-liyuan-yuyi", book: "论语", chapter: "里仁", owner: "kong", text: "君子喻于义，小人喻于利。", gloss: "君子懂得的是道义，小人懂得的是利益。", keywords: ["君子", "小人", "义", "利", "价值"] },
  { id: "lunyu-liyuan-jianxian", book: "论语", chapter: "里仁", owner: "kong", text: "见贤思齐焉，见不贤而内自省也。", gloss: "见到贤人就想着看齐，见到不贤的人就反躬自省。", keywords: ["贤", "自省", "修身", "学", "榜样"] },
  { id: "lunyu-liyuan-degu", book: "论语", chapter: "里仁", owner: "kong", text: "德不孤，必有邻。", gloss: "有德之人不会孤立，必有同道相邻。", keywords: ["德", "邻", "同道", "孤", "修身"] },
  { id: "lunyu-liyuan-buyuan", book: "论语", chapter: "里仁", owner: "kong", text: "父母在，不远游，游必有方。", gloss: "父母在世时不远行，若远行必有定向。", keywords: ["父母", "孝", "远游", "方", "牵挂"] },
  { id: "lunyu-xueer-guanzhi", book: "论语", chapter: "学而", owner: "kong", text: "父在观其志，父没观其行，三年无改于父之道，可谓孝矣。", gloss: "父亲在时看其志向，父亲去世后看其行为，三年不改父亲的正道，才叫孝。", keywords: ["孝", "父", "志", "行", "守道"] },
  { id: "lunyu-xueer-liyong", book: "论语", chapter: "学而", owner: "kong", text: "礼之用，和为贵。先王之道，斯为美。", gloss: "礼的运用，以和顺为贵；先王之道，美在此处。", keywords: ["礼", "和", "先王", "用", "秩序", "美"] },
  { id: "lunyu-taibo-wuli", book: "论语", chapter: "泰伯", owner: "kong", text: "恭而无礼则劳，慎而无礼则葸，勇而无礼则乱，直而无礼则绞。", gloss: "恭敬而无礼则徒劳，谨慎而无礼则畏缩，勇敢而无礼则莽撞，直率而无礼则刻薄。", keywords: ["礼", "恭", "慎", "勇", "直", "中", "节"] },
  { id: "lunyu-zilu-hetong", book: "论语", chapter: "子路", owner: "kong", text: "君子和而不同，小人同而不和。", gloss: "君子能和谐相处却不苟同，小人苟同却不和谐。", keywords: ["君子", "小人", "和", "同", "独立", "群"] },
  { id: "lunyu-zilu-taibujiao", book: "论语", chapter: "子路", owner: "kong", text: "君子泰而不骄，小人骄而不泰。", gloss: "君子安泰而不骄纵，小人骄纵而不安泰。", keywords: ["君子", "小人", "泰", "骄", "气度"] },
  { id: "lunyu-weizheng-zhoububi", book: "论语", chapter: "为政", owner: "kong", text: "君子周而不比，小人比而不周。", gloss: "君子团结而不勾结，小人勾结而不团结。", keywords: ["君子", "小人", "周", "比", "结党", "群"] },
  { id: "lunyu-shuer-tandang", book: "论语", chapter: "述而", owner: "kong", text: "君子坦荡荡，小人长戚戚。", gloss: "君子心胸坦荡，小人常怀忧惧。", keywords: ["君子", "小人", "坦荡", "戚戚", "心境"] },
  { id: "lunyu-weilinggong-guqiong", book: "论语", chapter: "卫灵公", owner: "kong", text: "君子固穷，小人穷斯滥矣。", gloss: "君子困穷时仍能坚守，小人一困穷就胡作非为了。", keywords: ["君子", "小人", "穷", "固", "操守", "困境"] },
  { id: "lunyu-weizheng-buqi", book: "论语", chapter: "为政", owner: "kong", text: "君子不器。", gloss: "君子不像器具那样只有一种用途。", keywords: ["君子", "器", "通", "才", "格局"] },
  { id: "lunyu-xianjin-guoyoujibu", book: "论语", chapter: "先进", owner: "kong", text: "过犹不及。", gloss: "做过了头和没做到一样，都不好。", keywords: ["过", "不及", "中庸", "度", "平衡"] },
  { id: "lunyu-shuer-bufen", book: "论语", chapter: "述而", owner: "kong", text: "不愤不启，不悱不发。举一隅不以三隅反，则不复也。", gloss: "不到心求通而未得时不启发，不到口欲言而未能时不点拨；举一隅不能反三隅，就不再教。", keywords: ["教", "启发", "愤", "悱", "举一反三", "方法"] },
  { id: "lunyu-xianjin-yincailiao", book: "论语", chapter: "先进", owner: "kong", text: "求也退，故进之；由也兼人，故退之。", gloss: "冉求性退缩，所以鼓励他进取；子路争强好胜，所以压一压他——因材施教。", keywords: ["因材施教", "教", "弟子", "进", "退", "方法"] },
  { id: "lunyu-weizheng-juzhi", book: "论语", chapter: "为政", owner: "kong", text: "举直错诸枉，则民服；举枉错诸直，则民不服。", gloss: "举用正直者置于邪枉者之上，百姓就服；反之则不服。", keywords: ["举直", "枉", "用人", "服", "政", "正直"] },
  { id: "lunyu-yanyuan-juwujuan", book: "论语", chapter: "颜渊", owner: "kong", text: "居之无倦，行之以忠。", gloss: "在位不懈怠，行事以忠心。", keywords: ["政", "倦", "忠", "勤", "履职"] },
  { id: "lunyu-yanyuan-minxin", book: "论语", chapter: "颜渊", owner: "kong", text: "自古皆有死，民无信不立。", gloss: "自古人都免不了一死，但百姓对君上的信任若失，国家就立不住。", keywords: ["信", "民", "立国", "政", "信任", "死"] },
  { id: "lunyu-yanyuan-baixingzu", book: "论语", chapter: "颜渊", owner: "kong", text: "百姓足，君孰与不足？百姓不足，君孰与足？", gloss: "百姓富足了，君主怎么会不足？百姓不富足，君主又怎么会足？", keywords: ["民", "君", "足", "赋", "民本", "财"] },
  { id: "lunyu-yanyuan-wusong", book: "论语", chapter: "颜渊", owner: "kong", text: "听讼，吾犹人也，必也使无讼乎！", gloss: "审理诉讼我和别人差不多，重要的是使诉讼根本不发生。", keywords: ["讼", "听讼", "无讼", "政", "德教", "治本"] },
  { id: "lunyu-yongye-jinggui", book: "论语", chapter: "雍也", owner: "kong", text: "务民之义，敬鬼神而远之，可谓知矣。", gloss: "致力于人间正道，敬鬼神却保持距离，这才是智。", keywords: ["鬼神", "敬", "远", "智", "民", "人事"] },
  { id: "lunyu-bayi-jiruzai", book: "论语", chapter: "八佾", owner: "kong", text: "祭如在，祭神如神在。", gloss: "祭祀时就像受祭者真在面前，祭神就像神真在。", keywords: ["祭", "神", "诚", "敬", "礼", "如在"] },
  { id: "lunyu-shuer-fuyun", book: "论语", chapter: "述而", owner: "kong", text: "不义而富且贵，于我如浮云。", gloss: "用不义手段得来的富贵，在我看来如天上浮云。", keywords: ["义", "富", "贵", "浮云", "价值", "不义"] },
  { id: "lunyu-shuer-fanshi", book: "论语", chapter: "述而", owner: "kong", text: "饭疏食，饮水，曲肱而枕之，乐亦在其中矣。", gloss: "吃粗粮、喝清水，弯起胳膊当枕头，快乐也就在其中了。", keywords: ["乐", "疏食", "贫", "安", "曲肱", "颜乐"] },
  { id: "lunyu-shuer-yongze-xing", book: "论语", chapter: "述而", owner: "kong", text: "用之则行，舍之则藏。", gloss: "被任用就推行其道，不被任用就藏道于身。", keywords: ["用", "舍", "行", "藏", "进退", "出处"] },
  { id: "lunyu-gongye-chengfu", book: "论语", chapter: "公冶长", owner: "kong", text: "道不行，乘桴浮于海，从我者其由与？", gloss: "大道若行不通，我就乘木筏浮海而去，能跟从我的大概是子路吧。", keywords: ["道不行", "浮海", "退", "理想", "子路", "出处"] },
  { id: "lunyu-gongye-laozhe", book: "论语", chapter: "公冶长", owner: "kong", text: "老者安之，朋友信之，少者怀之。", gloss: "使老者安养，使朋友信任，使少者怀归——这是我的志向。", keywords: ["老", "朋友", "少", "安", "信", "怀", "理想", "志"] },
  { id: "lunyu-weizheng-jianyi", book: "论语", chapter: "为政", owner: "kong", text: "见义不为，无勇也。", gloss: "见到该做的正义之事却不去做，这是没有勇气。", keywords: ["义", "勇", "见义勇为", "行", "勇气"] },
  { id: "lunyu-weilinggong-gaibugai", book: "论语", chapter: "卫灵公", owner: "kong", text: "过而不改，是谓过矣。", gloss: "有了过错却不改正，这才是真正的过错。", keywords: ["过", "改", "错误", "修身", "知错"] },
  { id: "lunyu-xueer-zhuzhongxin", book: "论语", chapter: "学而", owner: "kong", text: "主忠信，无友不如己者，过则勿惮改。", gloss: "以忠信为主，不与不如自己的人交朋友，有了过错不怕改正。", keywords: ["忠信", "友", "过", "改", "交友", "修身"] },
  { id: "lunyu-jishi-buxueshi", book: "论语", chapter: "季氏", owner: "kong", text: "不学诗，无以言。", gloss: "不学《诗》，就无法在正式场合得体地言谈。", keywords: ["诗", "言", "学", "文艺", "辞令"] },
  { id: "lunyu-taibo-xingliyue", book: "论语", chapter: "泰伯", owner: "kong", text: "兴于诗，立于礼，成于乐。", gloss: "由《诗》兴起志意，由礼立身，由乐成就人格。", keywords: ["诗", "礼", "乐", "兴", "立", "成", "教", "文艺"] },
  { id: "lunyu-shuer-zhiyu", book: "论语", chapter: "述而", owner: "kong", text: "志于道，据于德，依于仁，游于艺。", gloss: "立志于道，据守于德，依凭于仁，游习于六艺。", keywords: ["道", "德", "仁", "艺", "志", "修身", "教"] },
  { id: "lunyu-weizheng-shigusu", book: "论语", chapter: "为政", owner: "kong", text: "视其所以，观其所由，察其所安，人焉廋哉？", gloss: "看他所做之事，观察他做事的缘由，考察他心安于什么——人怎能藏得住？", keywords: ["察人", "观", "视", "察", "知人", "识人"] },
  { id: "lunyu-xueer-qiaoyan", book: "论语", chapter: "学而", owner: "kong", text: "巧言令色，鲜矣仁。", gloss: "花言巧语、面貌伪善的人，仁德就少了。", keywords: ["巧言", "令色", "仁", "伪", "察人", "言"] },
  { id: "lunyu-yanyuan-aren", book: "论语", chapter: "颜渊", owner: "kong", text: "樊迟问仁。子曰：爱人。", gloss: "樊迟问什么是仁，孔子说：爱人。", keywords: ["仁", "爱人", "樊迟", "仁者爱人"] },
  { id: "lunyu-weilinggong-xiaoburen", book: "论语", chapter: "卫灵公", owner: "kong", text: "巧言乱德，小不忍则乱大谋。", gloss: "花言巧语败坏德行，小事不能容忍就会搅乱大计。", keywords: ["忍", "巧言", "德", "大谋", "谋", "忍让"] },
  { id: "lunyu-weilinggong-yuanlv", book: "论语", chapter: "卫灵公", owner: "kong", text: "人无远虑，必有近忧。", gloss: "人没有长远的谋划，就必有眼前的忧患。", keywords: ["远虑", "近忧", "谋", "虑", "远", "近"] },
  { id: "lunyu-weilinggong-gongyu", book: "论语", chapter: "卫灵公", owner: "kong", text: "工欲善其事，必先利其器。", gloss: "工匠要干好活，必先把工具磨利。", keywords: ["工", "器", "准备", "工具", "方法", "利"] },
  { id: "lunyu-zilu-zhengming-2", book: "论语", chapter: "子路", owner: "kong", text: "刑罚不中，则民无所错手足。", gloss: "刑罚不得当，百姓就不知如何举手投足。", keywords: ["刑", "罚", "中", "民", "正名", "制度", "法"] },
  { id: "lunyu-yanyuan-fuchou", book: "论语", chapter: "颜渊", owner: "kong", text: "一日克己复礼，天下归仁焉。为仁由己，而由人乎哉？", gloss: "一旦克制自己复归于礼，天下都归于仁；行仁全在自己，难道靠别人吗？", keywords: ["仁", "礼", "克己", "由己", "修身", "自律"] },

  // 孟子补
  { id: "mengzi-gaoshang-yu", book: "孟子", chapter: "告子上", owner: "meng", text: "鱼，我所欲也；熊掌，亦我所欲也。二者不可得兼，舍鱼而取熊掌者也。生亦我所欲也，义亦我所欲也，二者不可得兼，舍生而取义者也。", gloss: "鱼与熊掌不可兼得时取熊掌；生命与道义不可兼得时舍生取义。", keywords: ["义", "生", "舍生取义", "选择", "价值", "利"] },
  { id: "mengzi-lilou-guiju", book: "孟子", chapter: "离娄上", owner: "meng", text: "不以规矩，不能成方圆。", gloss: "不用圆规曲尺，就画不出方圆——治国亦须法度准绳。", keywords: ["规矩", "法度", "治国", "标准", "方圆"] },
  { id: "mengzi-jinxin-wanwu", book: "孟子", chapter: "尽心上", owner: "meng", text: "万物皆备于我矣。反身而诚，乐莫大焉。", gloss: "万物之理皆具于我身；反求诸己而诚，没有比这更大的快乐。", keywords: ["万物", "诚", "反身", "乐", "心", "修身"] },
  { id: "mengzi-tengwengong-laoxin", book: "孟子", chapter: "滕文公上", owner: "meng", text: "或劳心，或劳力；劳心者治人，劳力者治于人。", gloss: "有人劳心，有人劳力；劳心者治理人，劳力者被人治理——社会分工之论。", keywords: ["劳心", "劳力", "分工", "治", "社会", "政"] },
  { id: "mengzi-gongsun-haoran", book: "孟子", chapter: "公孙丑上", owner: "meng", text: "我善养吾浩然之气。其为气也，至大至刚，以直养而无害，则塞于天地之间。", gloss: "我善养浩然之气；它至大至刚，以正义直养而不害，便充塞天地。", keywords: ["浩然之气", "气", "义", "刚", "养", "修身"] },

  // 孟子补（性善/仁政/民本/义利/养心/教/天命，至逾五十条）
  { id: "mengzi-gongsun-buren", book: "孟子", chapter: "公孙丑上", owner: "meng", text: "人皆有不忍人之心。先王有不忍人之心，斯有不忍人之政矣。", gloss: "人都有不忍见人受苦的心；先王有此心，才有了不忍人的仁政。", keywords: ["不忍", "仁政", "性善", "心", "治"] },
  { id: "mengzi-gongsun-feiren", book: "孟子", chapter: "公孙丑上", owner: "meng", text: "无恻隐之心，非人也；无羞恶之心，非人也；无辞让之心，非人也；无是非之心，非人也。", gloss: "没有同情、羞耻、辞让、是非之心，就不算人。", keywords: ["四端", "人", "性善", "恻隐", "羞恶", "辞让", "是非"] },
  { id: "mengzi-gaoshang-waishuo", book: "孟子", chapter: "告子上", owner: "meng", text: "仁义礼智，非由外铄我也，我固有之也，弗思耳矣。", gloss: "仁义礼智不是外力强加的，是我原本就有的，只是没去思索罢了。", keywords: ["仁义礼智", "性善", "固有", "心", "内", "思"] },
  { id: "mengzi-tengwengong-dazhangfu", book: "孟子", chapter: "滕文公下", owner: "meng", text: "富贵不能淫，贫贱不能移，威武不能屈，此之谓大丈夫。", gloss: "富贵不能乱其心，贫贱不能改其志，威武不能屈其节，这才叫大丈夫。", keywords: ["大丈夫", "富贵", "贫贱", "威武", "操守", "志"] },
  { id: "mengzi-gongsun-xia-duozhu", book: "孟子", chapter: "公孙丑下", owner: "meng", text: "得道者多助，失道者寡助。寡助之至，亲戚畔之；多助之至，天下顺之。", gloss: "行道义者得众人相助，失道义者少人相助；寡助到极点连亲戚都背叛，多助到极点天下都归顺。", keywords: ["道", "得道", "多助", "寡助", "政", "义"] },
  { id: "mengzi-gongsun-xia-tianshi", book: "孟子", chapter: "公孙丑下", owner: "meng", text: "天时不如地利，地利不如人和。", gloss: "天时不如地利重要，地利不如人和重要。", keywords: ["天时", "地利", "人和", "政", "战争", "团结"] },
  { id: "mengzi-gaozi-sheng-youhuan", book: "孟子", chapter: "告子下", owner: "meng", text: "然后知生于忧患，而死于安乐也。", gloss: "由此可知：忧患使人生存，安乐使人灭亡。", keywords: ["忧患", "安乐", "生", "死", "修身", "困境"] },
  { id: "mengzi-gaozi-jiangdaren", book: "孟子", chapter: "告子下", owner: "meng", text: "故天将降大任于是人也，必先苦其心志，劳其筋骨，饿其体肤，空乏其身。", gloss: "天将要把大任交给此人，必先使其心志受苦、筋骨劳累、体肤挨饿、身受穷困。", keywords: ["天", "大任", "苦", "劳", "修身", "磨砺", "逆境"] },
  { id: "mengzi-lianghui-laowolao", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "老吾老，以及人之老；幼吾幼，以及人之幼，天下可运于掌。", gloss: "敬养自家老人推及他人老人，慈爱自家幼儿推及他人幼儿，天下就可运转于掌上。", keywords: ["推恩", "老", "幼", "仁", "治", "孝"] },
  { id: "mengzi-lianghui-tuien", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "古之人所以大过人者，无他焉，善推其所为而已矣。推恩足以保四海，不推恩无以保妻子。", gloss: "古人远胜常人无他，善于推己及人；推此恩心足以保四海，不推则连妻儿都保不住。", keywords: ["推恩", "仁", "保四海", "治", "恕"] },
  { id: "mengzi-lianghui-xia-dulele", book: "孟子", chapter: "梁惠王下", owner: "meng", text: "独乐乐，与人乐乐，孰乐？……不若与人。与少乐乐，与众乐乐，孰乐？……不若与众。", gloss: "一人独乐不如与人同乐，与少数人乐不如与众人同乐。", keywords: ["乐", "与众", "同乐", "独", "治", "分享"] },
  { id: "mengzi-lianghui-xia-leyue", book: "孟子", chapter: "梁惠王下", owner: "meng", text: "乐民之乐者，民亦乐其乐；忧民之忧者，民亦忧其忧。", gloss: "以百姓之乐为乐，百姓也以他之乐为乐；以百姓之忧为忧，百姓也以他之忧为忧。", keywords: ["乐", "忧", "民", "同乐", "治", "民本"] },
  { id: "mengzi-lianghui-sharen-ting", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "杀人以梃与刃，有以异乎？……以刃与政，有以异乎？", gloss: "用棍子杀人和用刀杀人有区别吗？用刀杀人和用虐政杀人有区别吗？", keywords: ["政", "杀人", "刃", "虐政", "义", "战争"] },
  { id: "mengzi-lianghui-renzhe-wudi", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "仁者无敌。", gloss: "行仁政的人天下无敌。", keywords: ["仁", "无敌", "政", "战争", "仁政"] },
  { id: "mengzi-lianghui-bushi", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "今夫天下之人牧，未有不嗜杀人者也。如有不嗜杀人者，则天下之民皆引领而望之矣。", gloss: "如今治国者无不嗜好杀人；若有不嗜杀人的，天下百姓都会伸颈盼望他。", keywords: ["嗜杀", "杀人", "民", "望", "仁政", "战争"] },
  { id: "mengzi-lianghui-zhichan", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "明君制民之产，必使仰足以事父母，俯足以畜妻子，乐岁终身饱，凶年免于死亡。", gloss: "明君为百姓置办产业，必使其上能赡养父母、下能养活妻儿，丰年饱暖、荒年免死。", keywords: ["制产", "民", "父母", "妻", "恒产", "政", "民生"] },
  { id: "mengzi-lianghui-wumu", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "五亩之宅，树之以桑，五十者可以衣帛矣；鸡豚狗彘之畜，无失其时，七十者可以食肉矣。", gloss: "五亩宅地种桑，五十岁就能穿帛；鸡猪按时畜养，七十岁就能吃肉。", keywords: ["制产", "宅", "桑", "畜", "民生", "政", "老"] },
  { id: "mengzi-lianghui-hengchan", book: "孟子", chapter: "梁惠王上", owner: "meng", text: "无恒产而有恒心者，惟士为能。若民，则无恒产，因无恒心。", gloss: "没有固定产业却仍守道的，只有士人能做到；百姓若无恒产，便无恒心。", keywords: ["恒产", "恒心", "士", "民", "产", "治"] },
  { id: "mengzi-lilou-xia-airen", book: "孟子", chapter: "离娄下", owner: "meng", text: "仁者爱人，有礼者敬人。爱人者人恒爱之，敬人者人恒敬之。", gloss: "仁者爱人，有礼者敬人；爱人的人人亦爱之，敬人的人人亦敬之。", keywords: ["仁", "爱", "敬", "礼", "报", "人"] },
  { id: "mengzi-gongsun-ren-ze-rong", book: "孟子", chapter: "公孙丑上", owner: "meng", text: "仁则荣，不仁则辱。今恶辱而居不仁，是犹恶湿而居下也。", gloss: "行仁则荣，不行仁则辱；厌恶屈辱却处于不仁，就像厌恶潮湿却居于低处。", keywords: ["仁", "荣", "辱", "择", "治"] },
  { id: "mengzi-lilou-jun-zheng", book: "孟子", chapter: "离娄上", owner: "meng", text: "君仁莫不仁，君义莫不义，君正莫不正。一正君而国定矣。", gloss: "君上仁则无人不仁，君上义则无人不义，君上正则无人不正；一正君而国定。", keywords: ["君", "正", "仁", "义", "国", "治", "表率"] },
  { id: "mengzi-lilou-jiezhou", book: "孟子", chapter: "离娄上", owner: "meng", text: "桀纣之失天下也，失其民也；失其民者，失其心也。得天下有道：得其民，斯得天下矣。", gloss: "桀纣失天下是因为失其民；失民是因为失民心。得天下之道在于得民。", keywords: ["民", "心", "天下", "桀纣", "民本", "治"] },
  { id: "mengzi-jinxin-shanzheng", book: "孟子", chapter: "尽心上", owner: "meng", text: "善政不如善教之得民也。善政民畏之，善教民爱之；善政得民财，善教得民心。", gloss: "好的政令不如好的教化得民心：政令使民畏惧，教化使民爱戴；政令得民财，教化得民心。", keywords: ["善政", "善教", "民", "畏", "爱", "教", "心"] },
  { id: "mengzi-lilou-min-gui", book: "孟子", chapter: "离娄上", owner: "meng", text: "民之归仁也，犹水之就下、兽之走圹也。", gloss: "百姓归向仁德，就像水往低处流、野兽奔向旷野。", keywords: ["民", "归仁", "水", "就下", "仁", "治"] },
  { id: "mengzi-lilou-shun-tian", book: "孟子", chapter: "离娄上", owner: "meng", text: "顺天者存，逆天者亡。", gloss: "顺应天道者存，违逆天道者亡。", keywords: ["天", "顺", "逆", "存", "亡", "治"] },
  { id: "mengzi-lilou-cheng", book: "孟子", chapter: "离娄上", owner: "meng", text: "诚者，天之道也；思诚者，人之道也。至诚而不动者，未之有也。", gloss: "诚是天道，思诚是人道；极致真诚而不能打动人的，从未有过。", keywords: ["诚", "天", "人", "道", "修身", "信"] },
  { id: "mengzi-lilou-fanqiu", book: "孟子", chapter: "离娄上", owner: "meng", text: "爱人不亲反其仁，治人不治反其智，礼人不答反其敬。行有不得者，皆反求诸己。", gloss: "爱人而人不亲，要反省自己的仁；治人而人不治，反省自己的智；礼人而人不应，反省自己的敬——凡事不顺皆反求诸己。", keywords: ["反求诸己", "仁", "智", "敬", "修身", "内省"] },
  { id: "mengzi-lilou-xia-cunxin", book: "孟子", chapter: "离娄下", owner: "meng", text: "君子所以异于人者，以其存心也。君子以仁存心，以礼存心。", gloss: "君子不同于常人之处，在于其存心：君子以仁存心、以礼存心。", keywords: ["君子", "存心", "仁", "礼", "修身"] },
  { id: "mengzi-jinxin-sanle", book: "孟子", chapter: "尽心上", owner: "meng", text: "君子有三乐……父母俱存，兄弟无故，一乐也；仰不愧于天，俯不怍于人，二乐也；得天下英才而教育之，三乐也。", gloss: "君子三乐：父母健在兄弟平安；上不愧天下不怍人；得天下英才而教之。", keywords: ["三乐", "父母", "兄弟", "天", "人", "教", "乐"] },
  { id: "mengzi-jinxin-qiongda", book: "孟子", chapter: "尽心上", owner: "meng", text: "古之人，得志，泽加于民；不得志，修身见于世。穷则独善其身，达则兼善天下。", gloss: "古人得志时恩泽施于百姓；不得志时修养自身显于世。穷则独善其身，达则兼善天下。", keywords: ["穷", "达", "独善", "兼善", "修身", "出处", "志"] },
  { id: "mengzi-lilou-xia-chizi", book: "孟子", chapter: "离娄下", owner: "meng", text: "大人者，不失其赤子之心者也。", gloss: "所谓大人，是不丢失那颗赤子之心的人。", keywords: ["大人", "赤子", "心", "本心", "性善"] },
  { id: "mengzi-jinxin-qinmin", book: "孟子", chapter: "尽心上", owner: "meng", text: "君子之于物也，爱之而弗仁；于民也，仁之而弗亲。亲亲而仁民，仁民而爱物。", gloss: "君子对万物爱惜却未必施仁；对百姓施仁却未必亲。亲其亲而仁及百姓，仁及百姓而爱及万物。", keywords: ["亲亲", "仁民", "爱物", "差等", "仁", "物"] },
  { id: "mengzi-jinxin-jinxin", book: "孟子", chapter: "尽心上", owner: "meng", text: "尽其心者，知其性也；知其性，则知天矣。存其心，养其性，所以事天也。", gloss: "尽心便能知性，知性便能知天；存心养性，就是事奉天。", keywords: ["心", "性", "天", "尽心", "存心", "养性", "知"] },
  { id: "mengzi-jinxin-qiu", book: "孟子", chapter: "尽心上", owner: "meng", text: "求则得之，舍则失之，是求有益于得也，求在我者也。", gloss: "追求就能得到，舍弃就会失去——这种追求有益于得，因为所求在我自身。", keywords: ["求", "得", "舍", "失", "在我", "修身", "内"] },
  { id: "mengzi-gaoshang-niushan", book: "孟子", chapter: "告子上", owner: "meng", text: "牛山之木尝美矣……斧斤伐之，可以为美乎？……牛羊又从而牧之，是以若彼濯濯也。", gloss: "牛山之木曾很茂美，但被斧斤砍伐、牛羊啃食，才变得光秃——人心亦需涵养。", keywords: ["养心", "牛山", "木", "伐", "养", "失", "性"] },
  { id: "mengzi-gaoshang-cao", book: "孟子", chapter: "告子上", owner: "meng", text: "孔子曰：操则存，舍则亡；出入无时，莫知其乡。惟心之谓与？", gloss: "孔子说：把握住就存，放任就失；出入无定时，不知其去向——说的就是心吧？", keywords: ["心", "操", "舍", "存", "亡", "养心"] },
  { id: "mengzi-gaoshang-renrenxin", book: "孟子", chapter: "告子上", owner: "meng", text: "仁，人心也；义，人路也。舍其路而弗由，放其心而不知求，哀哉！", gloss: "仁是人的本心，义是人的正路；舍弃正路不走，丢了本心不知去找，可悲啊！", keywords: ["仁", "心", "义", "路", "放心", "求", "性善"] },
  { id: "mengzi-gaoshang-qiu-fangxin", book: "孟子", chapter: "告子上", owner: "meng", text: "学问之道无他，求其放心而已矣。", gloss: "学问之道没有别的，就是把丢失的本心找回来罢了。", keywords: ["学", "放心", "求", "心", "修身", "教"] },
  { id: "mengzi-gaoshang-yidan", book: "孟子", chapter: "告子上", owner: "meng", text: "一箪食，一豆羹，得之则生，弗得则死。呼尔而与之，行道之人弗受；蹴尔而与之，乞人不屑也。", gloss: "一筐饭一碗汤，得到就活、得不到就死；呼喝着给，过路人都不接受；脚踏过再给，乞丐都不屑要。", keywords: ["义", "生", "呼尔", "蹴尔", "不受", "尊严", "利"] },
  { id: "mengzi-lianghui-xia-zhu-yifu", book: "孟子", chapter: "梁惠王下", owner: "meng", text: "贼仁者谓之贼，贼义者谓之残；残贼之人谓之一夫。闻诛一夫纣矣，未闻弑君也。", gloss: "害仁的叫贼，害义的叫残；残贼之人叫独夫。只听说诛杀了独夫纣，没听说弑君。", keywords: ["诛", "纣", "弑君", "一夫", "仁", "义", "革命", "正当性"] },
  { id: "mengzi-lianghui-xia-chu-er-fan", book: "孟子", chapter: "梁惠王下", owner: "meng", text: "出乎尔者，反乎尔者也。", gloss: "你怎样对人，人也会怎样对你。", keywords: ["出", "反", "报", "施", "治", "恕"] },

  // 荀子补
  { id: "xunzi-wangzhi-zhou", book: "荀子", chapter: "王制", owner: "xun", text: "君者，舟也；庶人者，水也。水则载舟，水则覆舟。", gloss: "君是舟，百姓是水；水能载舟，亦能覆舟。", keywords: ["君", "民", "舟", "水", "载覆", "治国", "民本"] },
  { id: "xunzi-feixiang-lunxin", book: "荀子", chapter: "非相", owner: "xun", text: "相形不如论心，论心不如择术。", gloss: "看相貌不如论心术，论心术不如择正道。", keywords: ["相", "心", "术", "择", "修身", "貌"] },
  { id: "xunzi-zhengming", book: "荀子", chapter: "正名", owner: "xun", text: "名定而实辨，道行而志通。", gloss: "名分确定则事辨明，正道推行则志意通达。", keywords: ["名", "实", "正名", "辨", "道", "言"] },
  { id: "xunzi-quanxue-fu", book: "荀子", chapter: "劝学", owner: "xun", text: "锲而不舍，金石可镂。", gloss: "不停地雕刻，金石也能刻出花纹——坚持之功。", keywords: ["锲", "不舍", "积", "学", "坚持", "勤"] },

  // 荀子补（性恶/礼/天/心/学/王霸/君臣/兵/乐/正名，至逾五十条）
  { id: "xunzi-xinge-haoli", book: "荀子", chapter: "性恶", owner: "xun", text: "今人之性，生而有好利焉，顺是，故争夺生而辞让亡焉。", gloss: "人天生好利，顺此发展则争夺生、辞让亡。", keywords: ["性恶", "好利", "争夺", "辞让", "人性"] },
  { id: "xunzi-xinge-shengwu", book: "荀子", chapter: "性恶", owner: "xun", text: "性者，本始材朴也；伪者，文理隆盛也。无性则伪之无所加，无伪则性不能自美。", gloss: "性是原始材质，伪是后天文饰；没有性则伪无所施，没有伪则性不能自美。", keywords: ["性", "伪", "材朴", "文理", "化性", "善"] },
  { id: "xunzi-xinge-shengyou", book: "荀子", chapter: "性恶", owner: "xun", text: "古者圣王以人之性恶，以为偏险而不正，悖乱而不治，故为之立君上之势以临之，明礼义以化之，起法正以治之，重刑罚以禁之。", gloss: "古圣王因人性恶，故立君上权势、明礼义以教化、起法度以治理、重刑罚以禁止。", keywords: ["性恶", "礼义", "法", "刑", "君", "治"] },
  { id: "xunzi-xinge-keyi", book: "荀子", chapter: "性恶", owner: "xun", text: "涂之人可以为禹。", gloss: "路上的普通人都可以成为禹那样的圣人。", keywords: ["性恶", "涂之人", "禹", "可以为", "教化", "平等"] },
  { id: "xunzi-lilun-duanchang", book: "荀子", chapter: "礼论", owner: "xun", text: "礼者，断长续短，损有余，益不足，达爱敬之文，而滋成行义之美者也。", gloss: "礼是截长补短、损有余益不足，达爱敬之文、成行义之美。", keywords: ["礼", "损", "益", "爱敬", "行义", "分"] },
  { id: "xunzi-lilun-guicheng", book: "荀子", chapter: "礼论", owner: "xun", text: "礼者，人道之极也。然而不法礼，不足礼，谓之无方之民；法礼，足礼，谓之有方之士。", gloss: "礼是人道的极致；不效法礼、不充分守礼的叫无方之民，反之是有方之士。", keywords: ["礼", "人道", "极", "法", "方", "士"] },
  { id: "xunzi-lilun-sang", book: "荀子", chapter: "礼论", owner: "xun", text: "礼者，谨于治生死者也。生，人之始也；死，人之终也。终始俱善，人道毕矣。", gloss: "礼谨于治理生死：生是始，死是终；终始皆善，人道就完备了。", keywords: ["礼", "生", "死", "终始", "丧", "人道"] },
  { id: "xunzi-tianlun-renzhi", book: "荀子", chapter: "天论", owner: "xun", text: "天有其时，地有其财，人有其治，夫是之谓能参。", gloss: "天有四时，地有财用，人有治道，这叫能参赞天地。", keywords: ["天", "地", "人", "参", "治", "天人"] },
  { id: "xunzi-tianlun-zhitian", book: "荀子", chapter: "天论", owner: "xun", text: "大天而思之，孰与物畜而裁之！从天而颂之，孰与制天命而用之！", gloss: "与其尊大天而思慕它，不如当作物来畜养裁制；与其顺从而颂赞天，不如掌握天的规律而利用它。", keywords: ["天", "制天命", "用", "裁", "天人", "治"] },
  { id: "xunzi-tianlun-xingdui", book: "荀子", chapter: "天论", owner: "xun", text: "星队木鸣，国人皆恐……是天地之变，阴阳之化，物之罕至者也。", gloss: "流星陨落、树木作响，国人皆惧……其实只是天地阴阳的罕见变化。", keywords: ["天", "变异", "星", "阴阳", "怪", "知"] },
  { id: "xunzi-tianlun-qiangben", book: "荀子", chapter: "天论", owner: "xun", text: "强本而节用，则天不能贫；养备而动时，则天不能病。", gloss: "强本节用则天不能使之贫；供养充足而按时劳作则天不能使之病。", keywords: ["本", "节用", "天", "贫", "病", "力"] },
  { id: "xunzi-jiebi-xinjun", book: "荀子", chapter: "解蔽", owner: "xun", text: "心者，形之君也，而神明之主也，出令而无所受令。", gloss: "心是形体的君主，神明的主宰，只发令而不受令。", keywords: ["心", "形", "君", "神明", "主", "修身"] },
  { id: "xunzi-jiebi-xuyijing", book: "荀子", chapter: "解蔽", owner: "xun", text: "心何以知道？曰：虚壹而静。心未尝不藏也，然而有所谓虚；心未尝不满也，然而有所谓壹；心未尝不动也，然而有所谓静。", gloss: "心如何知道？虚壹而静：心虽藏物却仍虚，虽丰满却仍专一，虽常动却仍静。", keywords: ["心", "虚", "壹", "静", "知道", "解蔽", "修身"] },
  { id: "xunzi-jiebi-bi", book: "荀子", chapter: "解蔽", owner: "xun", text: "凡万物异则莫不相为蔽，此心术之公患也。", gloss: "万物各有差异便互相遮蔽，这是心术的通病。", keywords: ["蔽", "异", "心术", "患", "解蔽"] },
  { id: "xunzi-quanxue-buke", book: "荀子", chapter: "劝学", owner: "xun", text: "学不可以已。", gloss: "学习不可停止。", keywords: ["学", "已", "止", "为学"] },
  { id: "xunzi-quanxue-qingyu", book: "荀子", chapter: "劝学", owner: "xun", text: "青，取之于蓝而青于蓝；冰，水为之而寒于水。", gloss: "青出于蓝而胜于蓝，冰由水成而寒于水——学习可使人超越本源。", keywords: ["学", "青", "蓝", "冰", "超越", "化"] },
  { id: "xunzi-quanxue-shen", book: "荀子", chapter: "劝学", owner: "xun", text: "木受绳则直，金就砺则利，君子博学而日参省乎己，则知明而行无过矣。", gloss: "木经墨线则直，金经磨砺则利；君子博学而日参省己身，则智明而行无过。", keywords: ["学", "参省", "知", "行", "过", "修身"] },
  { id: "xunzi-quanxue-si", book: "荀子", chapter: "劝学", owner: "xun", text: "吾尝终日而思矣，不如须臾之所学也。", gloss: "我曾整日苦思，不如片刻所学。", keywords: ["思", "学", "须臾", "方法", "知"] },
  { id: "xunzi-quanxue-gaoshan", book: "荀子", chapter: "劝学", owner: "xun", text: "故不登高山，不知天之高也；不临深溪，不知地之厚也。", gloss: "不登高山不知天之高，不临深渊不知地之厚。", keywords: ["学", "高山", "深溪", "知", "行", "广"] },
  { id: "xunzi-quanxue-peng", book: "荀子", chapter: "劝学", owner: "xun", text: "蓬生麻中，不扶而直；白沙在涅，与之俱黑。", gloss: "蓬草生于麻中不扶自直，白沙混于黑泥则与之俱黑——环境之化。", keywords: ["环境", "蓬", "麻", "沙", "涅", "化", "学"] },
  { id: "xunzi-quanxue-zhilir", book: "荀子", chapter: "劝学", owner: "xun", text: "故学至乎礼而后止矣。夫是之谓道德之极。", gloss: "学到礼才到顶，这叫道德的极致。", keywords: ["学", "礼", "道德", "极", "止"] },
  { id: "xunzi-quanxue-quancui", book: "荀子", chapter: "劝学", owner: "xun", text: "君子知夫不全不粹之不足以为美也……全之尽之，然后学者也。", gloss: "君子知道不全不粹就不算美；要全要尽，才是真学者。", keywords: ["学", "全", "粹", "美", "君子", "尽"] },
  { id: "xunzi-xiushen-jianshan", book: "荀子", chapter: "修身", owner: "xun", text: "见善，修然必以自存也；见不善，愀然必以自省也。", gloss: "见善则肃然自省是否具备，见不善则惊惧自省是否有之。", keywords: ["修身", "善", "自省", "见", "过"] },
  { id: "xunzi-xiushen-daoer", book: "荀子", chapter: "修身", owner: "xun", text: "道虽迩，不行不至；事虽小，不为不成。", gloss: "路虽近不走不到，事虽小不做不成。", keywords: ["行", "为", "道", "事", "勤", "积"] },
  { id: "xunzi-xiushen-li", book: "荀子", chapter: "修身", owner: "xun", text: "礼者，所以正身也；师者，所以正礼也。", gloss: "礼是用来端正自身的，师是用来端正礼的。", keywords: ["礼", "师", "正身", "修身", "教"] },
  { id: "xunzi-xiushen-lao", book: "荀子", chapter: "修身", owner: "xun", text: "老老而壮者衰焉，老老而老者老焉。", gloss: "敬老则壮者趋之、老者安之。", keywords: ["老", "敬", "壮", "治", "孝"] },
  { id: "xunzi-feishier-buzhi", book: "荀子", chapter: "非十二子", owner: "xun", text: "不知则问，不能则学，虽能必让，然后为德。", gloss: "不知就问，不能就学，虽能也要谦让，然后才成德。", keywords: ["问", "学", "让", "德", "修身"] },
  { id: "xunzi-wangzhi-fumin", book: "荀子", chapter: "王制", owner: "xun", text: "王者富民，霸者富士，仅存之国富大夫，亡国富筐箧、实府库。", gloss: "王者使百姓富，霸者使士富，仅存之国使大夫富，亡国只填君主的箱柜府库。", keywords: ["王", "霸", "富", "民", "士", "大夫", "亡国"] },
  { id: "xunzi-wangzhi-mahai", book: "荀子", chapter: "王制", owner: "xun", text: "马骇舆，则君子不安舆；庶人骇政，则君子不安位。", gloss: "马惊车则君子不安于车，百姓惊于政则君子不安于位。", keywords: ["民", "政", "安", "马", "治", "稳"] },
  { id: "xunzi-wangzhi-junqun", book: "荀子", chapter: "王制", owner: "xun", text: "君臣上下，贵贱长幼，至于庶人，莫不以是为隆正。然后皆内自省以谨无分。", gloss: "从君臣上下到贵贱长幼乃至庶人，都以此礼为准则，然后各自自省谨守本分。", keywords: ["礼", "分", "君臣", "贵贱", "秩序", "治"] },
  { id: "xunzi-fuguo-jieyong", book: "荀子", chapter: "富国", owner: "xun", text: "足国之道，节用裕民，而善臧其余。", gloss: "富国之道：节用、裕民、善藏其余。", keywords: ["富国", "节用", "裕民", "臧", "治", "利"] },
  { id: "xunzi-fuguo-shangxia", book: "荀子", chapter: "富国", owner: "xun", text: "上下俱富，交无所藏之，是知国计之极也。", gloss: "上下都富足，无处可藏（没有匮乏），这才是国计的极致。", keywords: ["富", "上下", "国计", "极", "治"] },
  { id: "xunzi-fuguo-deng", book: "荀子", chapter: "富国", owner: "xun", text: "礼者，贵贱有等，长幼有差，贫富轻重皆有称者也。", gloss: "礼使贵贱有等、长幼有差、贫富轻重各得其所。", keywords: ["礼", "贵贱", "等", "差", "称", "分"] },
  { id: "xunzi-yibing-yimin", book: "荀子", chapter: "议兵", owner: "xun", text: "凡用兵攻战之本在乎壹民。", gloss: "用兵作战的根本在于使百姓同心。", keywords: ["兵", "战", "壹民", "民", "本", "治"] },
  { id: "xunzi-yibing-fumin", book: "荀子", chapter: "议兵", owner: "xun", text: "兵要在乎善附民而已。", gloss: "用兵的关键在于善于亲附百姓。", keywords: ["兵", "附民", "民", "战", "治"] },
  { id: "xunzi-yibing-qi", book: "荀子", chapter: "议兵", owner: "xun", text: "故兵大齐则制天下，小齐则治邻敌。", gloss: "军队高度齐一就能制天下，稍齐就能对付邻敌。", keywords: ["兵", "齐", "制", "战", "治"] },
  { id: "xunzi-wangba-yi", book: "荀子", chapter: "王霸", owner: "xun", text: "义立而王，信立而霸，权谋立而亡。", gloss: "以义立身者为王，以信立身者为霸，以权谋立身者必亡。", keywords: ["王", "霸", "义", "信", "权谋", "亡"] },
  { id: "xunzi-wangba-neng", book: "荀子", chapter: "王霸", owner: "xun", text: "用国者，义立而王，信立而霸，权谋立而亡。三者明主之所谨择也。", gloss: "治国者：义立则王，信立则霸，权谋立则亡。三者明主须谨择。", keywords: ["王", "霸", "义", "信", "权谋", "择", "治"] },
  { id: "xunzi-jundao-qun", book: "荀子", chapter: "君道", owner: "xun", text: "君者，何也？曰：能群也。能群也者，何也？曰：善生养人者也。", gloss: "君是什么？是能组织人群的人。组织人群在于善养育人。", keywords: ["君", "群", "生养", "治", "民"] },
  { id: "xunzi-jundao-luan", book: "荀子", chapter: "君道", owner: "xun", text: "有乱君，无乱国；有治人，无治法。", gloss: "有致乱的君主，没有致乱的国家；有治人，没有治法——法靠人行。", keywords: ["君", "国", "治人", "治法", "法", "人"] },
  { id: "xunzi-jundao-fa", book: "荀子", chapter: "君道", owner: "xun", text: "法者，治之端也；君子者，法之原也。", gloss: "法是治的开端，君子是法的本源。", keywords: ["法", "治", "君子", "原", "人"] },
  { id: "xunzi-chendao-congdao", book: "荀子", chapter: "臣道", owner: "xun", text: "从道不从君，从义不从父，人之大行也。", gloss: "顺从道而不顺从君，顺从义而不顺从父，这是人的大德行。", keywords: ["道", "义", "君", "父", "从", "谏"] },
  { id: "xunzi-chendao-jian", book: "荀子", chapter: "臣道", owner: "xun", text: "谏争辅拂之人，社稷之臣也，国君之宝也。", gloss: "能谏诤辅弼的人，是社稷之臣、国君之宝。", keywords: ["谏", "争", "辅", "拂", "臣", "宝", "社稷"] },
  { id: "xunzi-zhishi-chuanyuan", book: "荀子", chapter: "致士", owner: "xun", text: "川渊深而鱼鳖归之，山林茂而禽兽归之，刑政平而百姓归之，礼义备而君子归之。", gloss: "渊深则鱼鳖归，林茂则禽兽归，刑政平则百姓归，礼义备则君子归。", keywords: ["归", "刑政", "礼义", "民", "君子", "治"] },
  { id: "xunzi-zhengming-yue", book: "荀子", chapter: "正名", owner: "xun", text: "名无固宜，约之以命。约定俗成谓之宜，异于约则谓之不宜。", gloss: "名本无固定该称什么，约定而成俗就叫宜，违背约定就叫不宜。", keywords: ["名", "约定俗成", "宜", "正名", "言", "约"] },
  { id: "xunzi-lelun-lunli", book: "荀子", chapter: "乐论", owner: "xun", text: "乐者，乐也，人情之所必不免也。", gloss: "乐就是快乐，是人情所不可避免的。", keywords: ["乐", "情", "乐论", "人情", "音"] },
  { id: "xunzi-lelun-hejing", book: "荀子", chapter: "乐论", owner: "xun", text: "故乐在宗庙之中，君臣上下同听之，则莫不和敬。", gloss: "乐在宗庙中君臣同听，则无不和敬。", keywords: ["乐", "和", "敬", "君臣", "宗庙", "乐论"] },
  { id: "xunzi-qiangguo-longli", book: "荀子", chapter: "强国", owner: "xun", text: "隆礼尊贤而王，重法爱民而霸。", gloss: "隆礼尊贤者王，重法爱民者霸。", keywords: ["隆礼", "尊贤", "重法", "爱民", "王", "霸"] },

  // 墨子补
  { id: "mozi-shangtong", book: "墨子", chapter: "尚同上", owner: "mo", text: "尚同为政之本也。", gloss: "上同于天、同于义，是治政的根本。", keywords: ["尚同", "政", "治", "同", "义", "制度"] },
  { id: "mozi-feiming", book: "墨子", chapter: "非命上", owner: "mo", text: "执有命者，不仁不智。", gloss: "信有天命者，是不仁不智——命非前定，当以力行。", keywords: ["非命", "命", "力", "智", "仁", "天"] },
  { id: "mozi-tianzhi", book: "墨子", chapter: "天志上", owner: "mo", text: "天欲人之相爱相利，而不欲人之相恶相贼也。", gloss: "天愿人相爱互利，不愿人相恶相害。", keywords: ["天志", "天", "爱", "利", "兼爱", "恶"] },
  { id: "mozi-qiyuan", book: "墨子", chapter: "七患", owner: "mo", text: "以时生财，固本而用财，则财用足。", gloss: "按时令生产财富，稳固根本而节用，则财用充足。", keywords: ["财", "节用", "本", "生产", "足", "利"] },

  // 墨子补（兼爱/非攻/尚贤/尚同/节用/节葬/非乐/非命/天志/明鬼/三表/贵义/修身/所染/公输，至逾五十条）
  { id: "mozi-jianai-shang-luan", book: "墨子", chapter: "兼爱上", owner: "mo", text: "圣人以治天下为事者也，必知乱之所自起，焉能治之。", gloss: "圣人以治天下为业，必先知祸乱从何而起，才能治理。", keywords: ["治", "乱", "兼爱", "本", "知"] },
  { id: "mozi-jianai-shang-xiaoxiao", book: "墨子", chapter: "兼爱上", owner: "mo", text: "若使天下兼相爱，爱人若爱其身，犹有不孝者乎？", gloss: "若天下人兼相爱、爱人如己，还会有不孝之人吗？", keywords: ["兼爱", "爱人", "孝", "爱", "治"] },
  { id: "mozi-jianai-xia-lihai", book: "墨子", chapter: "兼爱下", owner: "mo", text: "仁人之事者，必务求兴天下之利，除天下之害。", gloss: "仁人做事必致力于兴天下之利、除天下之害。", keywords: ["利", "害", "兴", "除", "仁", "天下"] },
  { id: "mozi-jianai-xia-jiaoli", book: "墨子", chapter: "兼爱下", owner: "mo", text: "兼相爱，交相利，此之谓也。", gloss: "彼此相爱、互相有利，说的就是这个。", keywords: ["兼爱", "交相利", "爱", "利", "互利"] },
  { id: "mozi-jianai-fan", book: "墨子", chapter: "兼爱中", owner: "mo", text: "凡天下祸篡怨恨，其所以起者，以不相爱生也。", gloss: "天下一切祸篡怨恨，都因不相爱而起。", keywords: ["祸", "篡", "怨恨", "不相爱", "兼爱", "乱"] },
  { id: "mozi-feigong-zhong-sang", book: "墨子", chapter: "非攻中", owner: "mo", text: "计其所得，反不如所丧者之多。", gloss: "算一算攻战所得，反不如所失的多——攻国得不偿失。", keywords: ["非攻", "得", "丧", "利", "战争", "计"] },
  { id: "mozi-feigong-shang-rang", book: "墨子", chapter: "非攻上", owner: "mo", text: "今有人于此，入人之场园，取人之桃李瓜姜者，其不义又甚攘人犬豕鸡豚者矣。", gloss: "有人闯入别人园子偷桃李瓜姜，比偷别人鸡狗猪更不义——层层加码的不义。", keywords: ["非攻", "不义", "攘", "取", "偷", "义"] },
  { id: "mozi-feigong-shang-ze", book: "墨子", chapter: "非攻上", owner: "mo", text: "至攘人犬豕鸡豚者，其不义又甚入人栏厩取人马牛者矣。", gloss: "偷人鸡狗猪的，比偷人栏厩里的马牛更不义。", keywords: ["非攻", "不义", "攘", "取", "义", "战争"] },
  { id: "mozi-feigong-xia-yi", book: "墨子", chapter: "非攻下", owner: "mo", text: "今逮至昔者三代之圣王既没，天下失义，诸侯方争……是以攻伐无罪之国。", gloss: "三代圣王之后天下失义，诸侯争斗，攻打无罪之国。", keywords: ["非攻", "诸侯", "攻伐", "无罪", "义", "战争"] },
  { id: "mozi-jieyong-zhong-minyong", book: "墨子", chapter: "节用中", owner: "mo", text: "凡足以奉给民用，则止。诸加费不加于民利者，圣王弗为。", gloss: "凡足以供给民用就停止；增加耗费却不增加民利的，圣王不做。", keywords: ["节用", "费", "民利", "圣王", "实用", "利"] },
  { id: "mozi-jiezang-xia-guan", book: "墨子", chapter: "节葬下", owner: "mo", text: "棺三寸，足以朽骨；衣三领，足以朽肉。", gloss: "棺木三寸足以使骨朽，衣三件足以使肉朽——薄葬之论。", keywords: ["节葬", "棺", "衣", "薄葬", "丧", "俭"] },
  { id: "mozi-jiezang-xia-hou", book: "墨子", chapter: "节葬下", owner: "mo", text: "细计厚葬，实多赋于百姓，多取于民财，是以民贫。", gloss: "仔细算来厚葬实是向百姓多征赋税、多取民财，使民贫。", keywords: ["节葬", "厚葬", "赋", "民财", "贫", "俭"] },
  { id: "mozi-feile-shang-du", book: "墨子", chapter: "非乐上", owner: "mo", text: "民有三患：饥者不得食，寒者不得衣，劳者不得息。", gloss: "百姓有三患：挨饿的没饭吃，受冻的没衣穿，劳苦的不得休息。", keywords: ["非乐", "饥", "寒", "劳", "民", "患", "利"] },
  { id: "mozi-feile-shang-ren", book: "墨子", chapter: "非乐上", owner: "mo", text: "仁者之为天下度也，非为其目之所美、耳之所乐，以为民也。", gloss: "仁者为天下谋划，不是为目之美、耳之乐，而是为百姓。", keywords: ["非乐", "仁", "民", "美", "乐", "度"] },
  { id: "mozi-feiming-zhong-bao", book: "墨子", chapter: "非命中", owner: "mo", text: "命者，暴王所作，穷人所述，非仁者之言也。", gloss: "命是暴王编造、穷人传述的，不是仁者之言。", keywords: ["非命", "命", "暴王", "穷人", "仁", "力"] },
  { id: "mozi-feiming-xia-hai", book: "墨子", chapter: "非命下", owner: "mo", text: "用执有命者，此天下之大害也。", gloss: "信奉天命之说，是天下的大害。", keywords: ["非命", "有命", "害", "天下", "力"] },
  { id: "mozi-feiming-shang-sanbiao", book: "墨子", chapter: "非命上", owner: "mo", text: "言必有三表。有本之者，有原之者，有用之者。上本之于古者圣王之事，下原察百姓耳目之实，发以为刑政，观其中国家百姓人民之利。", gloss: "立言须有三表：上考之于古圣王之事，下考察百姓耳目之实，施于刑政看是否合于百姓之利。", keywords: ["三表", "本", "原", "用", "圣王", "百姓", "利", "验证"] },
  { id: "mozi-shangxian-shang-ben", book: "墨子", chapter: "尚贤上", owner: "mo", text: "尚贤者，政之本也。", gloss: "崇尚贤能是治政的根本。", keywords: ["尚贤", "政", "本", "贤", "治"] },
  { id: "mozi-shangxian-zhong-yi", book: "墨子", chapter: "尚贤中", owner: "mo", text: "不义不富，不义不贵，不义不亲，不义不近。", gloss: "不义的不能使之富、贵、亲、近。", keywords: ["尚贤", "义", "富", "贵", "亲", "贤"] },
  { id: "mozi-shangxian-shang-neng", book: "墨子", chapter: "尚贤上", owner: "mo", text: "虽在农与工肆之人，有能则举之。", gloss: "即便是农夫工匠商贩，有能力就举用。", keywords: ["尚贤", "农", "工", "举", "能", "平等"] },
  { id: "mozi-shangtong-shang-shi", book: "墨子", chapter: "尚同上", owner: "mo", text: "上之所是，必皆是之；所非，必皆非之。", gloss: "在上者所赞同的，下面必都赞同；所反对的，必都反对。", keywords: ["尚同", "上", "是", "非", "同", "治"] },
  { id: "mozi-shangtong-xia-zhi", book: "墨子", chapter: "尚同下", owner: "mo", text: "治天下之国，若治一家；使天下之民，若使一夫。", gloss: "治理天下之国如同治一家，使天下之民如同使一人——尚同之效。", keywords: ["尚同", "治", "国", "家", "民", "同"] },
  { id: "mozi-tianzhi-xia-shun", book: "墨子", chapter: "天志下", owner: "mo", text: "顺天意者，兼相爱，交相利，必得赏；反天意者，别相恶，交相贼，必得罚。", gloss: "顺天意者兼相爱交相利必得赏；反天意者别相恶交相贼必得罚。", keywords: ["天志", "天意", "兼爱", "交相利", "赏", "罚"] },
  { id: "mozi-minggui-xia-shen", book: "墨子", chapter: "明鬼下", owner: "mo", text: "虽有深溪博林、幽涧无人之所，施行不可以不慎，见鬼神之诛之。", gloss: "即便在深溪密林幽涧无人之处，行事也不可不慎，因有鬼神之诛。", keywords: ["明鬼", "鬼神", "诛", "慎", "隐", "畏"] },
  { id: "mozi-minggui-xia-shang", book: "墨子", chapter: "明鬼下", owner: "mo", text: "鬼神之所赏，无小必赏之；鬼神之所罚，无大必罚之。", gloss: "鬼神该赏的，再小也必赏；该罚的，再大也必罚。", keywords: ["明鬼", "鬼神", "赏", "罚", "必", "报"] },
  { id: "mozi-guiyi-bao", book: "墨子", chapter: "贵义", owner: "mo", text: "万事莫贵于义。", gloss: "万事没有比义更宝贵的。", keywords: ["贵义", "义", "贵", "宝", "价值"] },
  { id: "mozi-guiyi-zheng", book: "墨子", chapter: "贵义", owner: "mo", text: "义者，正也。", gloss: "义就是端正。", keywords: ["义", "正", "贵义", "端正"] },
  { id: "mozi-guiyi-liang", book: "墨子", chapter: "贵义", owner: "mo", text: "义，天下之良宝也。", gloss: "义是天下的至宝。", keywords: ["义", "良宝", "天下", "贵义"] },
  { id: "mozi-guiyi-yong", book: "墨子", chapter: "贵义", owner: "mo", text: "用之以为政，则治；以为刑，则平。", gloss: "用义来施政则治，用来制刑则平。", keywords: ["义", "政", "治", "刑", "平", "用"] },
  { id: "mozi-xiushen-ben", book: "墨子", chapter: "修身", owner: "mo", text: "君子战虽有陈，而勇为本焉；丧虽有礼，而哀为本焉；士虽有学，而行为本焉。", gloss: "君子作战虽有阵法但勇是本，治丧虽有礼但哀是本，士虽有学但行是本。", keywords: ["修身", "本", "勇", "哀", "行", "学"] },
  { id: "mozi-xiushen-zhi", book: "墨子", chapter: "修身", owner: "mo", text: "志不强者智不达，言不信者行不果。", gloss: "志不坚的智不达，言不信的行不果。", keywords: ["志", "智", "信", "行", "修身", "强"] },
  { id: "mozi-xiushen-yu", book: "墨子", chapter: "修身", owner: "mo", text: "藏于胸中，则言不妄出。", gloss: "藏于胸中，言语就不会妄出。", keywords: ["修身", "藏", "言", "妄", "慎"] },
  { id: "mozi-qinshi-cun", book: "墨子", chapter: "亲士", owner: "mo", text: "入国而不存其士，则亡国矣。", gloss: "治国而不厚待其士，国家就要灭亡。", keywords: ["亲士", "士", "存", "亡国", "治", "贤"] },
  { id: "mozi-qinshi-liangcai", book: "墨子", chapter: "亲士", owner: "mo", text: "良马难乘，然可以任重致远；良才难令，然可以致君见尊。", gloss: "良马难骑却能负重致远；良才难驾驭却能使君主受尊崇。", keywords: ["亲士", "良马", "良才", "任重", "致远", "贤"] },
  { id: "mozi-suoran-cang", book: "墨子", chapter: "所染", owner: "mo", text: "染于苍则苍，染于黄则黄。", gloss: "丝染于青则青，染于黄则黄——所染之喻。", keywords: ["所染", "染", "苍", "黄", "环境", "化"] },
  { id: "mozi-suoran-guo", book: "墨子", chapter: "所染", owner: "mo", text: "非独染丝然也，国亦有染。", gloss: "不仅染丝如此，治国也有所染。", keywords: ["所染", "国", "染", "治", "环境"] },
  { id: "mozi-fayi-fa", book: "墨子", chapter: "法仪", owner: "mo", text: "百工为方以矩，为圆以规，直以绳，正以县，皆法度也。", gloss: "百工用矩成方、用规成圆、用绳取直、用悬取正，都依法度。", keywords: ["法仪", "矩", "规", "绳", "法度", "标准"] },
  { id: "mozi-fayi-tian", book: "墨子", chapter: "法仪", owner: "mo", text: "莫若法天。天之行广而无私，其施厚而不德，其明久而不衰。", gloss: "不如效法天：天行广无私、施厚不居德、光明久不衰。", keywords: ["法仪", "法天", "天", "无私", "施", "明"] },
  { id: "mozi-qiyuan-cang", book: "墨子", chapter: "七患", owner: "mo", text: "仓无备粟，不可以待凶饥；库无备兵，虽有义不能征无义。", gloss: "仓里没储备粮不能应付饥荒；库中没兵器，虽有正义也不能征讨不义。", keywords: ["七患", "备", "粟", "兵", "饥", "义", "备"] },
  { id: "mozi-ciguo-jian", book: "墨子", chapter: "辞过", owner: "mo", text: "俭节则昌，淫佚则亡。", gloss: "俭朴节制则昌盛，淫佚放纵则灭亡。", keywords: ["辞过", "俭", "节", "昌", "淫佚", "亡"] },
  { id: "mozi-gongshu-zhi", book: "墨子", chapter: "公输", owner: "mo", text: "公输盘为楚造云梯之械，将以攻宋……臣见其必败宋。", gloss: "公输盘为楚国造云梯要攻宋，我看出这必使宋国失败——止楚攻宋。", keywords: ["非攻", "公输", "云梯", "楚", "宋", "止攻"] },
  { id: "mozi-gongshu-bu-zhi", book: "墨子", chapter: "公输", owner: "mo", text: "荆国有余于地而不足于民，杀所不足而争所有余，不可谓智。", gloss: "楚国土地有余而人口不足，杀不足之民去争有余之地，不能算明智。", keywords: ["非攻", "荆", "地", "民", "杀", "争", "智"] },
  { id: "mozi-xiaoqu-ming", book: "墨子", chapter: "小取", owner: "mo", text: "以名举实，以辞抒意，以说出故。", gloss: "用名概念来举指实事，用语句来抒发意思，用推论来说明缘故——墨辩逻辑。", keywords: ["墨辩", "名", "实", "辞", "意", "说", "故", "逻辑"] },

  // 庄子补
  { id: "zhuangzi-dachongshi-wang", book: "庄子", chapter: "德充符", owner: "zhuang", text: "形固可使若槁木，而心固可使若死灰乎？", gloss: "形体固然可如枯木，心难道也可如死灰？——忘形去智之喻。", keywords: ["形", "心", "槁木", "死灰", "忘", "养生"] },
  { id: "zhuangzi-dazongshi-si", book: "庄子", chapter: "大宗师", owner: "zhuang", text: "死生存亡之一体，吾与之友矣。", gloss: "死生存亡本是一体，我与这大道为友。", keywords: ["死生", "存亡", "一体", "道", "友", "自然"] },
  { id: "zhuangzi-waiwu-yu", book: "庄子", chapter: "外物", owner: "zhuang", text: "得鱼而忘筌，得意而忘言。", gloss: "捕到鱼就忘掉竹笼，领会了意旨就忘掉言辞——言只是得意之工具。", keywords: ["筌", "鱼", "得意", "忘言", "言", "意", "知"] },
  { id: "zhuangzi-zhiyao-you", book: "庄子", chapter: "至乐", owner: "zhuang", text: "至乐无乐，至誉无誉。", gloss: "最高的快乐是无世俗之乐，最高的声誉是无世俗之誉。", keywords: ["乐", "至乐", "誉", "无", "自然", "逍遥"] },

  // 庄子补（逍遥/齐物/养生/人间世/德充符/大宗师/应帝王/胠箧/秋水/达生/天下，至逾五十条）
  { id: "zhuangzi-xiaoyao-kun", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "北冥有鱼，其名为鲲。鲲之大，不知其几千里也；化而为鸟，其名为鹏。", gloss: "北冥有鱼名鲲，不知几千里大；化为鸟名鹏。", keywords: ["鲲", "鹏", "逍遥", "大", "化", "北冥"] },
  { id: "zhuangzi-xiaoyao-peng", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "鹏之徙于南冥也，水击三千里，抟扶摇而上者九万里。", gloss: "鹏飞往南冥时，翼击水三千里，盘旋直上九万里。", keywords: ["鹏", "南冥", "扶摇", "逍遥", "飞", "大"] },
  { id: "zhuangzi-xiaoyao-shui", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "且夫水之积也不厚，则其负大舟也无力。", gloss: "水积得不够深，就无力承载大船。", keywords: ["水", "积", "舟", "厚", "逍遥", "待"] },
  { id: "zhuangzi-xiaoyao-tiao", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "蜩与学鸠笑之曰：我决起而飞，抢榆枋而止……奚以之九万里而南为？", gloss: "蝉与学鸠笑鹏：我一下飞起停在榆枋即可，何必飞九万里去南冥？——小不知大。", keywords: ["蜩", "学鸠", "小大", "逍遥", "笑", "知"] },
  { id: "zhuangzi-xiaoyao-xiaozhi", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "小知不及大知，小年不及大年。", gloss: "小智慧比不上大智慧，短寿比不上长寿。", keywords: ["小知", "大知", "小年", "大年", "小大", "逍遥"] },
  { id: "zhuangzi-xiaoyao-shenren", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "藐姑射之山，有神人居焉……不食五谷，吸风饮露，乘云气，御飞龙，而游乎四海之外。", gloss: "姑射山上有神人，不食五谷、吸风饮露、乘云御龙游于四海之外。", keywords: ["神人", "姑射", "逍遥", "游", "神", "自然"] },
  { id: "zhuangzi-xiaoyao-wuyong-hu", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "今子有五石之瓠，何不虑以为大樽而浮乎江湖，而忧其瓠落无所容？", gloss: "你有五石大的葫芦，何不系作大樽浮于江湖，反愁它太大无处容？——无用乃大用。", keywords: ["瓠", "无用", "江湖", "浮", "逍遥", "用"] },
  { id: "zhuangzi-xiaoyao-wuyong-chu", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "子独不见狸狌乎？卑身而伏，以候敖者……中于机辟，死于罔罟。", gloss: "你没见狸猫吗？低身伏地候猎物……终死于机关网罟——小用招患。", keywords: ["狸狌", "无用", "机辟", "患", "用", "逍遥"] },
  { id: "zhuangzi-xiaoyao-wuyong-niu", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "今夫斄牛，其大若垂天之云。此能为大矣，而不能执鼠。", gloss: "那斄牛大如垂天云，能做大事却不能捉鼠——各有其大。", keywords: ["斄牛", "大", "无用", "逍遥", "鼠", "用"] },
  { id: "zhuangzi-xiaoyao-wuyong-shu", book: "庄子", chapter: "逍遥游", owner: "zhuang", text: "今子有大树，患其无用，何不树之于无何有之乡，广莫之野，彷徨乎无为其侧，逍遥乎寝卧其下。", gloss: "你有大树愁它无用，何不种在无何有之乡、广莫之野，无为彷徨其侧、逍遥寝卧其下。", keywords: ["无用", "大树", "无何有", "逍遥", "寝卧", "用"] },
  { id: "zhuangzi-qiwu-sangwo", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "南郭子綦隐机而坐……今者吾丧我。", gloss: "南郭子綦凭几而坐……如今我丧去了那个执着的小我。", keywords: ["吾丧我", "齐物", "忘", "我", "坐忘"] },
  { id: "zhuangzi-qiwu-lai", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "女闻人籁而未闻地籁，女闻地籁而未闻天籁夫！", gloss: "你听过人籁却没听过地籁，听过地籁却没听过天籁吧！——三籁之辨。", keywords: ["籁", "人籁", "地籁", "天籁", "齐物", "听"] },
  { id: "zhuangzi-qiwu-feng", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "夫大块噫气，其名为风。", gloss: "大地吐气，名为风。", keywords: ["大块", "风", "气", "齐物", "地籁", "自然"] },
  { id: "zhuangzi-qiwu-chengxing", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "一受其成形，不亡以待尽。与物相刃相靡，其行尽如驰而莫之能止，不亦悲乎！", gloss: "一受形便不亡以待尽，与外物相刃相磨，奔走如驰不能止，不也悲吗！——人生之劳。", keywords: ["形", "尽", "劳", "悲", "齐物", "生"] },
  { id: "zhuangzi-qiwu-feibi", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "非彼无我，非我无所取。是亦近矣，而不知其所为使。", gloss: "没有那个就没有这个我，没有我也无从取认；近于真道却不知谁在驱使。", keywords: ["彼", "我", "齐物", "取", "使", "道"] },
  { id: "zhuangzi-qiwu-tongyi", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "道通为一。", gloss: "从道的角度看万物相通为一。", keywords: ["道", "通", "一", "齐物", "通"] },
  { id: "zhuangzi-qiwu-wanwu", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "天地与我并生，而万物与我为一。", gloss: "天地与我一同生，万物与我同为一。", keywords: ["天地", "万物", "一", "齐物", "并生", "我"] },
  { id: "zhuangzi-qiwu-qmhao", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "天下莫大于秋毫之末，而太山为小；莫寿于殇子，而彭祖为夭。", gloss: "天下没有比秋毫更大的，太山反为小；没有比殇子更长寿的，彭祖反为夭——齐大小寿夭。", keywords: ["秋毫", "太山", "殇子", "彭祖", "齐物", "相对"] },
  { id: "zhuangzi-qiwu-meng", book: "庄子", chapter: "齐物论", owner: "zhuang", text: "昔者庄周梦为胡蝶，栩栩然胡蝶也……不知周之梦为胡蝶与，胡蝶之梦为周与？", gloss: "庄周梦为蝴蝶，栩栩然……不知是周梦为蝶，还是蝶梦为周？——物化。", keywords: ["梦", "胡蝶", "庄周", "齐物", "物化", "我"] },
  { id: "zhuangzi-yangsheng-pao", book: "庄子", chapter: "养生主", owner: "zhuang", text: "庖丁为文惠君解牛，手之所触，肩之所倚，足之所履，膝之所踦，砉然向然，奏刀騞然。", gloss: "庖丁为文惠君解牛，手足肩膝配合，刀声砉然騞然——技进于道。", keywords: ["庖丁", "解牛", "养生", "技", "道", "牛"] },
  { id: "zhuangzi-yangsheng-dao", book: "庄子", chapter: "养生主", owner: "zhuang", text: "臣之所好者道也，进乎技矣。", gloss: "我所好者是道，已超越技艺。", keywords: ["道", "技", "进", "养生", "庖丁"] },
  { id: "zhuangzi-yangsheng-li", book: "庄子", chapter: "养生主", owner: "zhuang", text: "依乎天理，批大郤，导大窾，因其固然。", gloss: "依循牛的天理，劈大隙、导大空，顺其自然之势。", keywords: ["天理", "因", "固然", "养生", "顺", "牛"] },
  { id: "zhuangzi-yangsheng-hou", book: "庄子", chapter: "养生主", owner: "zhuang", text: "以无厚入有间，恢恢乎其于游刃必有余地矣。", gloss: "以无厚之刀入有间隙之处，刀刃游动恢恢然必有余地。", keywords: ["无厚", "有间", "游刃", "养生", "余地", "顺"] },
  { id: "zhuangzi-yangsheng-xin", book: "庄子", chapter: "养生主", owner: "zhuang", text: "指穷于为薪，火传也，不知其尽也。", gloss: "柴薪会烧尽，但火种传下去，不知其尽——养生的真意。", keywords: ["薪", "火", "传", "尽", "养生", "传"] },
  { id: "zhuangzi-renjian-gui", book: "庄子", chapter: "人间世", owner: "zhuang", text: "桂可食，故伐之；漆可用，故割之。人皆知有用之用，而莫知无用之用也。", gloss: "桂可食所以被伐，漆可用所以被割；人都知有用之用，却不知无用之用。", keywords: ["无用", "有用", "桂", "漆", "伐", "人间世"] },
  { id: "zhuangzi-dechong-sishi", book: "庄子", chapter: "德充符", owner: "zhuang", text: "死生亦大矣，而不得与之变；虽天地覆坠，亦将不与之遗。", gloss: "死生虽是大事，却不能使之改变；即便天地覆坠，也不与之俱遗。", keywords: ["死生", "不变", "德充符", "天地", "遗", "定"] },
  { id: "zhuangzi-dazong-lao", book: "庄子", chapter: "大宗师", owner: "zhuang", text: "大块载我以形，劳我以生，佚我以老，息我以死。", gloss: "大地以形载我，以生劳我，以老逸我，以死息我。", keywords: ["大块", "形", "生", "老", "死", "大宗师", "自然"] },
  { id: "zhuangzi-dazong-quan", book: "庄子", chapter: "大宗师", owner: "zhuang", text: "泉涸，鱼相与处于陆，相呴以湿，相濡以沫，不如相忘于江湖。", gloss: "泉干了，鱼困于陆，互相吐湿、以沫相润，不如在江湖里彼此相忘。", keywords: ["泉", "鱼", "相濡以沫", "相忘", "江湖", "大宗师", "自由"] },
  { id: "zhuangzi-dazong-cang", book: "庄子", chapter: "大宗师", owner: "zhuang", text: "夫藏舟于壑，藏山于泽，谓之固矣。然而夜半有力者负之而走，昧者不知也。", gloss: "把舟藏于山谷、山藏于深泽，以为牢固；可半夜有力者把它背走，愚者不知——藏天下于天下。", keywords: ["藏", "舟", "山", "大宗师", "固", "变"] },
  { id: "zhuangzi-yingdi-jing", book: "庄子", chapter: "应帝王", owner: "zhuang", text: "至人之心若镜，不将不迎，应而不藏，故能胜物而不伤。", gloss: "至人之心如镜，不迎不送，应物而不藏，故能胜物而不伤。", keywords: ["镜", "应", "不藏", "应帝王", "至人", "心"] },
  { id: "zhuangzi-yingdi-wuwei", book: "庄子", chapter: "应帝王", owner: "zhuang", text: "无为名尸，无为谋府，无为事任，无为知主。", gloss: "不做名声的承载者，不做谋略的府库，不做事务的担当，不做智慧的主宰。", keywords: ["无为", "名", "谋", "事", "知", "应帝王"] },
  { id: "zhuangzi-quqie-dao", book: "庄子", chapter: "胠箧", owner: "zhuang", text: "圣人不死，大盗不止。", gloss: "圣人不死，大盗就不会停止——抨击礼智。", keywords: ["圣人", "大盗", "胠箧", "礼", "智", "盗"] },
  { id: "zhuangzi-quqie-jue", book: "庄子", chapter: "胠箧", owner: "zhuang", text: "绝圣弃知，大盗乃止。", gloss: "抛弃圣智，大盗才会停止。", keywords: ["绝圣", "弃知", "大盗", "胠箧", "智", "止"] },
  { id: "zhuangzi-pianmu-fu", book: "庄子", chapter: "骈拇", owner: "zhuang", text: "凫胫虽短，续之则忧；鹤胫虽长，断之则悲。", gloss: "鸭腿虽短，接长就忧；鹤腿虽长，截短就悲——顺其自然。", keywords: ["凫", "鹤", "胫", "自然", "骈拇", "性"] },
  { id: "zhuangzi-mati-bo", book: "庄子", chapter: "马蹄", owner: "zhuang", text: "马，蹄可以践霜雪，毛可以御风寒……及至伯乐，曰：我善治马……马之死者十二三矣。", gloss: "马本蹄践霜雪、毛御风寒；伯乐自谓善治马，烧剔刻羁，马死者已十二三。", keywords: ["马", "伯乐", "治", "马蹄", "害", "自然"] },
  { id: "zhuangzi-qiushui-jingwa", book: "庄子", chapter: "秋水", owner: "zhuang", text: "井蛙不可以语于海者，拘于虚也；夏虫不可以语于冰者，笃于时也；曲士不可以语于道者，束于教也。", gloss: "井蛙不可语海，受困于空间；夏虫不可语冰，受限于时令；曲士不可语道，受束缚于教化。", keywords: ["井蛙", "夏虫", "曲士", "拘", "笃", "束", "秋水", "知"] },
  { id: "zhuangzi-qiushui-shi", book: "庄子", chapter: "秋水", owner: "zhuang", text: "吾在天地之间，犹小石小木之在大山也。", gloss: "我在天地之间，就像大山里的小石小木。", keywords: ["天地", "小石", "小木", "大山", "秋水", "小大"] },
  { id: "zhuangzi-zhile-qi", book: "庄子", chapter: "至乐", owner: "zhuang", text: "庄子妻死，惠子吊之，庄子则方箕踞鼓盆而歌。", gloss: "庄子妻死，惠子来吊，庄子却正箕踞鼓盆而歌——达生死。", keywords: ["妻死", "鼓盆", "歌", "至乐", "生死", "达"] },
  { id: "zhuangzi-dasheng-fen", book: "庄子", chapter: "达生", owner: "zhuang", text: "用志不分，乃凝于神。", gloss: "用心专一不分散，才能凝聚如神。", keywords: ["志", "分", "凝", "神", "达生", "专一"] },
  { id: "zhuangzi-shanmu-zhi", book: "庄子", chapter: "山木", owner: "zhuang", text: "直木先伐，甘井先竭。", gloss: "笔直的树先被砍伐，甘甜的井先被汲竭——才之招患。", keywords: ["直木", "甘井", "伐", "竭", "山木", "无用"] },
  { id: "zhuangzi-waiwu-si", book: "庄子", chapter: "外物", owner: "zhuang", text: "庄周家贫，故往贷粟于监河侯……我昨来，有鲋鱼于车辙中……吾失我常与，我无所处。", gloss: "庄周家贫向监河侯借粮……见车辙中鲋鱼呼救：我失了水无处可处——远水不解近渴。", keywords: ["鲋鱼", "车辙", "贷粟", "外物", "远水", "急"] },
  { id: "zhuangzi-tianxia-hui", book: "庄子", chapter: "天下", owner: "zhuang", text: "惠施多方，其书五车，其道舛驳，其言也不中。", gloss: "惠施学识多方、著书五车，但其道驳杂、其言不中肯——评惠子。", keywords: ["惠施", "五车", "天下", "多方", "驳", "历物"] },

  // 韩非子补
  { id: "hanfei-gufen", book: "韩非子", chapter: "孤愤", owner: "han", text: "智术之士，必远见而明察；能法之士，必强毅而劲直。", gloss: "通晓权术者必远见明察，能行法治者必坚毅刚直。", keywords: ["术", "法", "智", "明察", "刚直", "治"] },
  { id: "hanfei-shuonan", book: "韩非子", chapter: "说难", owner: "han", text: "凡说之难，在知所说之心，可以吾说当之。", gloss: "游说之难，在于了解所说者的心思，使我的话能契合。", keywords: ["说", "游说", "难", "心", "术", "知人"] },
  { id: "hanfei-neichushuo-ming", book: "韩非子", chapter: "内储说上", owner: "han", text: "自见之谓明，自闻之谓聪。", gloss: "能自见己失才是明，能自闻己过才是聪——人主当自察。", keywords: ["明", "聪", "自见", "自闻", "察", "修身"] },
  { id: "hanfei-jielao", book: "韩非子", chapter: "解老", owner: "han", text: "道者，万物之始，是非之纪也。", gloss: "道是万物的本始，是非的纲纪——韩非以法释道。", keywords: ["道", "万物", "始", "是非", "纪", "法"] },

  // 韩非子补（法/术/势/性恶/变古/赏罚/耕战/参验/君臣/非儒，至逾五十条）
  { id: "hanfei-shuonan-mi", book: "韩非子", chapter: "说难", owner: "han", text: "事以密成，语以泄败。", gloss: "事情因保密而成，因泄露而败。", keywords: ["密", "泄", "成", "败", "术", "谋"] },
  { id: "hanfei-wudu-xiugu", book: "韩非子", chapter: "五蠹", owner: "han", text: "圣人不期修古，不法常可，论世之事，因为之备。", gloss: "圣人不期望复古、不墨守成规，而据当世之事来制定备策。", keywords: ["变古", "世", "备", "法", "五蠹", "时"] },
  { id: "hanfei-wudu-shouzhu", book: "韩非子", chapter: "五蠹", owner: "han", text: "宋人有耕者，田中有株，兔走触株，折颈而死……今欲以先王之政，治当世之民，皆守株之类也。", gloss: "宋人见兔触株而死便守株待兔；欲以先王之政治今世之民，皆守株之类。", keywords: ["守株", "先王", "变古", "五蠹", "政", "时"] },
  { id: "hanfei-wudu-gujin", book: "韩非子", chapter: "五蠹", owner: "han", text: "夫古今异俗，新故异备。", gloss: "古今风俗不同，新旧备策当异。", keywords: ["古今", "俗", "备", "变古", "五蠹", "时"] },
  { id: "hanfei-wudu-fawei", book: "韩非子", chapter: "五蠹", owner: "han", text: "故明主之国，无书简之文，以法为教；无先王之语，以吏为师。", gloss: "明主之国无书简之文，以法为教；无先王之语，以吏为师。", keywords: ["法", "教", "吏", "书简", "先王", "五蠹", "非儒"] },
  { id: "hanfei-wudu-shangfa", book: "韩非子", chapter: "五蠹", owner: "han", text: "赏莫如厚而信，使民利之；罚莫如重而必，使民畏之。", gloss: "赏要丰厚守信使民图利，罚要重且必行使民畏惧。", keywords: ["赏", "罚", "信", "必", "民", "五蠹"] },
  { id: "hanfei-wudu-gengzhan", book: "韩非子", chapter: "五蠹", owner: "han", text: "富国以农，距敌恃卒。", gloss: "富国靠农耕，拒敌恃士卒——耕战为本。", keywords: ["耕战", "农", "兵", "富国", "五蠹", "战"] },
  { id: "hanfei-wudu-fenggu", book: "韩非子", chapter: "五蠹", owner: "han", text: "是以人民众而货财寡，事力劳而供养薄，故民争，虽倍赏累罚而不免于乱。", gloss: "人口多而财货少，劳作苦而供养薄，故民争，虽加倍赏罚仍不免乱。", keywords: ["争", "货财", "民", "赏罚", "五蠹", "性恶"] },
  { id: "hanfei-xianxue-yao", book: "韩非子", chapter: "显学", owner: "han", text: "故明据先王，必定尧舜者，非愚则诬也。", gloss: "明据先王、断定尧舜之治的，不是愚就是诬。", keywords: ["先王", "尧舜", "愚", "诬", "显学", "参验"] },
  { id: "hanfei-xianxue-zha", book: "韩非子", chapter: "显学", owner: "han", text: "杂反之学，不两立而治。", gloss: "相互杂乱对立的学说，不能并存而治。", keywords: ["杂反", "学", "治", "显学", "统一"] },
  { id: "hanfei-youdu-bipi", book: "韩非子", chapter: "有度", owner: "han", text: "刑过不避大臣，赏善不遗匹夫。", gloss: "惩罚罪过不避大臣，奖赏善行不漏匹夫。", keywords: ["刑", "赏", "大臣", "匹夫", "公平", "有度"] },
  { id: "hanfei-youdu-wai", book: "韩非子", chapter: "有度", owner: "han", text: "故明主使其群臣不游意于法之外，不为惠于法之内。", gloss: "明主使群臣不在法外游思，不在法内施私惠。", keywords: ["法", "群臣", "游意", "惠", "有度", "治"] },
  { id: "hanfei-erbing-ze", book: "韩非子", chapter: "二柄", owner: "han", text: "君以其言授之事，专以其事责其功。", gloss: "君主据其言授其事，专以所授之事责其功——形名参验。", keywords: ["二柄", "形名", "言", "事", "功", "参验"] },
  { id: "hanfei-erbing-gong", book: "韩非子", chapter: "二柄", owner: "han", text: "功当其事，事当其言，则赏；功不当其事，事不当其言，则诛。", gloss: "功与事相当、事与言相当则赏，反之则诛。", keywords: ["赏", "诛", "功", "事", "言", "形名", "二柄"] },
  { id: "hanfei-yangquan-yao", book: "韩非子", chapter: "扬权", owner: "han", text: "事在四方，要在中央。圣人执要，四方来效。", gloss: "事务在四方，要权在中央；圣人执要，四方来效。", keywords: ["中央", "要", "权", "扬权", "治", "君"] },
  { id: "hanfei-yangquan-shen", book: "韩非子", chapter: "扬权", owner: "han", text: "圣王之治也，审于法禁，必于赏罚。", gloss: "圣王之治：明审法禁，必行赏罚。", keywords: ["法禁", "赏罚", "扬权", "治", "审"] },
  { id: "hanfei-gongming-si", book: "韩非子", chapter: "功名", owner: "han", text: "明君之所以立功成名者四：一曰天时，二曰人心，三曰技能，四曰势位。", gloss: "明君立功成名有四要素：天时、人心、技能、势位。", keywords: ["功名", "天时", "人心", "技能", "势位", "四要"] },
  { id: "hanfei-nanshi-yao", book: "韩非子", chapter: "难势", owner: "han", text: "尧为匹夫，不能治三人；而桀为天子，能乱天下。由此观之，势位之足恃而贤智之不足慕也。", gloss: "尧为平民不能治三人，桀为天子能乱天下——可见势位可恃而贤智不足慕。", keywords: ["势", "尧", "桀", "难势", "位", "治"] },
  { id: "hanfei-beinei-xin", book: "韩非子", chapter: "备内", owner: "han", text: "人主之患在于信人，信人则制于人。", gloss: "君主的祸患在于信人，信人就被制于人。", keywords: ["信", "备内", "人主", "患", "制", "防"] },
  { id: "hanfei-beinei-kui", book: "韩非子", chapter: "备内", owner: "han", text: "故人主者，不使人臣窥其意。", gloss: "所以君主不让臣下窥测自己的心意。", keywords: ["备内", "窥", "意", "术", "君", "防"] },
  { id: "hanfei-dingfa-fa", book: "韩非子", chapter: "定法", owner: "han", text: "法者，宪令著于官府，刑罚必于民心，赏存乎慎法，而罚加乎奸令者也。", gloss: "法是著于官府的宪令、必行于民心的刑罚：赏给守法者，罚加奸令者。", keywords: ["法", "宪令", "刑罚", "定法", "赏罚"] },
  { id: "hanfei-dingfa-shu", book: "韩非子", chapter: "定法", owner: "han", text: "术者，因任而授官，循名而责实，操杀生之柄，课群臣之能者也。", gloss: "术是因能授官、循名责实、操杀生之柄、考群臣之能。", keywords: ["术", "因任", "授官", "形名", "定法", "杀生"] },
  { id: "hanfei-yulao-yi", book: "韩非子", chapter: "喻老", owner: "han", text: "天下之难事必作于易，天下之大事必作于细。", gloss: "天下的难事必从易处做起，大事必从细处做起。", keywords: ["难", "易", "大", "细", "喻老", "积"] },
  { id: "hanfei-yulao-di", book: "韩非子", chapter: "喻老", owner: "han", text: "千丈之堤，以蝼蚁之穴溃。", gloss: "千丈长堤因蝼蚁之穴而溃——慎微。", keywords: ["堤", "蝼蚁", "溃", "喻老", "微", "患"] },
  { id: "hanfei-jielao-sheng", book: "韩非子", chapter: "解老", owner: "han", text: "是以欲利甚于忧，忧则疾生。", gloss: "贪欲过甚则忧虑，忧虑则生疾——韩非释老。", keywords: ["解老", "欲", "忧", "疾", "利"] },
  { id: "hanfei-xindu-shi", book: "韩非子", chapter: "心度", owner: "han", text: "圣人之治民也，法与时移而禁与能变。", gloss: "圣人治民，法度随时代而移，禁令随能力而变。", keywords: ["法", "时", "禁", "变", "心度", "治"] },
  { id: "hanfei-dati-gu", book: "韩非子", chapter: "大体", owner: "han", text: "古之全大体者，望天地，观江海，因山谷，日月所照，四时所行，云布风动，不以智累心。", gloss: "古之顾全大体者，观天地江海山谷，不以智巧累心。", keywords: ["大体", "天地", "智", "心", "自然", "治"] },
  { id: "hanfei-nanyi-dun", book: "韩非子", chapter: "难一", owner: "han", text: "楚人有鬻盾与矛者，誉之曰：吾盾之坚，物莫能陷也。又誉其矛曰：吾矛之利，于物无不陷也。或曰：以子之矛陷子之盾，何如？", gloss: "楚人卖盾与矛，夸盾坚不可陷、矛利无不陷；人问以子之矛陷子之盾如何——矛盾之喻。", keywords: ["矛", "盾", "矛盾", "难一", "悖", "名"] },
  { id: "hanfei-gufen-zhongren", book: "韩非子", chapter: "孤愤", owner: "han", text: "重人也者，人主之左右也。可以人主之左右而得，不可以人主之左右而失也。", gloss: "重人就是君主左右的权臣，靠君主左右而得势。", keywords: ["重人", "孤愤", "左右", "权臣", "君"] },
  { id: "hanfei-gufen-fa", book: "韩非子", chapter: "孤愤", owner: "han", text: "智术之士与当途之人，不可两存之仇也。", gloss: "通晓法术之士与当道权臣，是不可两存的仇敌。", keywords: ["孤愤", "智术", "当途", "仇", "法", "术"] },
  { id: "hanfei-waichu-zang", book: "韩非子", chapter: "外储说右上", owner: "han", text: "赏罚者，邦之利器也，不可以示人。", gloss: "赏罚是国家的利器，不可以示人。", keywords: ["赏罚", "利器", "外储说", "邦", "术", "示"] },
  { id: "hanfei-waichu-xing", book: "韩非子", chapter: "外储说左上", owner: "han", text: "循名实而定是非，因参验而审言辞。", gloss: "循名实以定是非，因参验以审言辞。", keywords: ["形名", "参验", "言辞", "是非", "外储说"] },
  { id: "hanfei-shuonan-zhi", book: "韩非子", chapter: "说难", owner: "han", text: "夫事以密成，语以泄败，未必其身泄之也，而语及所匿之事，如此者身危。", gloss: "事因密成、语因泄败，即便非本人泄密，只要言及所隐之事便身危。", keywords: ["说难", "密", "泄", "危", "术", "语"] },
  { id: "hanfei-ba-jian", book: "韩非子", chapter: "八奸", owner: "han", text: "凡人主之所以尊，使人敬者，以其势也。", gloss: "君主之所以尊贵、使人敬畏，靠的是势。", keywords: ["势", "八奸", "尊", "敬", "君"] },
  { id: "hanfei-guojian-shang", book: "韩非子", chapter: "奸劫弑臣", owner: "han", text: "明主者，使天下不得不为己视，天下不得不为己听。", gloss: "明主使天下人不得不为自己视听——任势用众。", keywords: ["明主", "视", "听", "天下", "势", "用"] },
  { id: "hanfei-shuonan-shuo", book: "韩非子", chapter: "说难", owner: "han", text: "说之难者，在知所说之心，可以吾说当之。", gloss: "游说之难，在于了解所说者的心思，使我的话契合。", keywords: ["说难", "游说", "心", "知人", "术"] },
  { id: "hanfei-nei-mingcha", book: "韩非子", chapter: "内储说上", owner: "han", text: "闻有吏虽乱而有独善之民，不闻有乱民而有独治之吏。", gloss: "只听说有吏虽乱而民独善，没听说有民乱而吏独治——治在吏。", keywords: ["内储说", "吏", "民", "治", "乱"] },
  { id: "hanfei-nei-shi", book: "韩非子", chapter: "内储说下", owner: "han", text: "狡兔尽则良犬烹，敌国灭则谋臣亡。", gloss: "狡兔尽则良犬烹，敌国灭则谋臣亡——功成身危。", keywords: ["狡兔", "良犬", "烹", "内储说", "功臣", "势"] },
  { id: "hanfei-shuolin-zhi", book: "韩非子", chapter: "说林上", owner: "han", text: "以子之矛，陷子之盾，何如？", gloss: "用你的矛刺你的盾，如何？——矛盾之始。", keywords: ["矛", "盾", "矛盾", "说林", "悖"] },
  { id: "hanfei-wudu-ren", book: "韩非子", chapter: "五蠹", owner: "han", text: "夫山居而谷汲者，膢腊而相遗以水；谷居而穴处者，相遗以粟。", gloss: "山居取水难者，节日互赠水；谷居穴处者，互赠粟——物以稀为贵，民以利相遗。", keywords: ["五蠹", "利", "民", "遗", "水", "粟"] },
  { id: "hanfei-gufen-shu", book: "韩非子", chapter: "孤愤", owner: "han", text: "法术之士，欲干上者，不可以信人主之心也。", gloss: "法术之士想求用于上，不能轻信君主之心。", keywords: ["孤愤", "法术", "信", "君", "术"] },
  { id: "hanfei-youdu-xin", book: "韩非子", chapter: "有度", owner: "han", text: "故臣曰：法者，主之具也。", gloss: "法是君主的工具。", keywords: ["法", "主", "具", "有度", "君"] },
  { id: "hanfei-zhifen-zhong", book: "韩非子", chapter: "制分", owner: "han", text: "夫凡国博君尊者，未尝不重法也。", gloss: "凡疆域广、君主尊者，未尝不重法。", keywords: ["制分", "法", "国", "君", "重"] },

  // 道德经（老子）补
  { id: "laozi-daode-2", book: "道德经", chapter: "二章", owner: "laozi", text: "有无相生，难易相成，长短相形，高下相倾。", gloss: "有与无相互生成，难与易相互成就，长与短相互显现，高与下相互依存。", keywords: ["有无", "相生", "相对", "难易", "对立", "道"] },
  { id: "laozi-daode-7", book: "道德经", chapter: "七章", owner: "laozi", text: "天长地久。天地所以能长且久者，以其不自生，故能长生。", gloss: "天地之所以长久，因其不自私其生，故能长生。", keywords: ["天", "地", "长久", "不自生", "无私", "道"] },
  { id: "laozi-daode-58", book: "道德经", chapter: "五十八章", owner: "laozi", text: "祸兮，福之所倚；福兮，祸之所伏。", gloss: "灾祸啊，幸福依傍于它；幸福啊，灾祸潜伏其中——祸福相倚。", keywords: ["祸", "福", "相倚", "变", "转化", "道"] },
  { id: "laozi-daode-63", book: "道德经", chapter: "六十三章", owner: "laozi", text: "天下难事，必作于易；天下大事，必作于细。", gloss: "天下的难事必从易处做起，天下的大事必从细处做起。", keywords: ["难", "易", "大", "细", "作", "始", "渐进"] },
  { id: "laozi-daode-81", book: "道德经", chapter: "八十一章", owner: "laozi", text: "信言不美，美言不信。善者不辩，辩者不善。", gloss: "真话不华美，华美的话不真；善者不辩，辩者不善。", keywords: ["信", "言", "美", "辩", "善", "真"] },

  // 道德经补（道/德/柔/虚/治/兵/欲，至逾五十条）
  { id: "laozi-daode-3", book: "道德经", chapter: "三章", owner: "laozi", text: "不上贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。", gloss: "不崇尚贤能使民不争，不贵难得之货使民不盗，不见可欲使民心不乱。", keywords: ["民", "争", "盗", "欲", "治", "无为"] },
  { id: "laozi-daode-5", book: "道德经", chapter: "五章", owner: "laozi", text: "天地不仁，以万物为刍狗；圣人不仁，以百姓为刍狗。", gloss: "天地无私仁，把万物当刍狗；圣人不私仁，把百姓当刍狗——一视同仁。", keywords: ["仁", "天地", "圣", "刍狗", "万物", "无私"] },
  { id: "laozi-daode-5-zhong", book: "道德经", chapter: "五章", owner: "laozi", text: "多言数穷，不如守中。", gloss: "政令繁苛反致困穷，不如持守虚中。", keywords: ["言", "中", "守", "治", "无为", "数"] },
  { id: "laozi-daode-9", book: "道德经", chapter: "九章", owner: "laozi", text: "持而盈之，不如其已；揣而锐之，不可长保。金玉满堂，莫之能守。", gloss: "执持盈满不如适时停止，锋芒太露不能长久；金玉满堂无人能守。", keywords: ["盈", "已", "锐", "保", "退", "知止"] },
  { id: "laozi-daode-11", book: "道德经", chapter: "十一章", owner: "laozi", text: "三十辐共一毂，当其无，有车之用……有之以为利，无之以为用。", gloss: "三十辐共一毂，正因为毂中空虚才有车之用——有是利，无是用。", keywords: ["无", "有", "用", "利", "毂", "车", "空"] },
  { id: "laozi-daode-12", book: "道德经", chapter: "十二章", owner: "laozi", text: "五色令人目盲，五音令人耳聋，五味令人口爽……是以圣人为腹不为目。", gloss: "五色令人目盲，五音令人耳聋，五味令人口爽；圣人但求实腹不求眩目。", keywords: ["五色", "五音", "五味", "欲", "圣", "腹"] },
  { id: "laozi-daode-13", book: "道德经", chapter: "十三章", owner: "laozi", text: "宠辱若惊，贵大患若身……吾所以有大患者，为吾有身，及吾无身，吾有何患？", gloss: "得宠受辱都心惊，视大患如身；我所以有大患，因我有身，若无身何患之有？", keywords: ["宠", "辱", "身", "患", "惊", "无身"] },
  { id: "laozi-daode-14", book: "道德经", chapter: "十四章", owner: "laozi", text: "视之不见名曰夷，听之不闻名曰希，搏之不得名曰微。", gloss: "看不见的叫夷，听不见的叫希，摸不着的叫微——道超感官。", keywords: ["夷", "希", "微", "道", "不见", "听"] },
  { id: "laozi-daode-16", book: "道德经", chapter: "十六章", owner: "laozi", text: "致虚极，守静笃。万物并作，吾以观复。", gloss: "达到虚的极致，守住静的笃实；万物并作，我从中观其往复。", keywords: ["虚", "静", "观", "复", "万物", "道"] },
  { id: "laozi-daode-16-gen", book: "道德经", chapter: "十六章", owner: "laozi", text: "夫物芸芸，各复归其根。归根曰静，静曰复命。", gloss: "万物芸芸各归其根；归根叫静，静叫复命。", keywords: ["根", "归", "静", "复命", "万物", "道"] },
  { id: "laozi-daode-18", book: "道德经", chapter: "十八章", owner: "laozi", text: "大道废，有仁义；智慧出，有大伪；六亲不和，有孝慈；国家昏乱，有忠臣。", gloss: "大道废弃才有仁义，智慧出现才有大伪，六亲不和才显孝慈，国家昏乱才显忠臣。", keywords: ["大道", "仁义", "智", "伪", "孝慈", "忠", "道"] },
  { id: "laozi-daode-19", book: "道德经", chapter: "十九章", owner: "laozi", text: "绝圣弃智，民利百倍；绝仁弃义，民复孝慈。", gloss: "抛弃圣智民利百倍，抛弃仁义民复孝慈。", keywords: ["绝圣", "弃智", "绝仁", "弃义", "民", "道"] },
  { id: "laozi-daode-22", book: "道德经", chapter: "二十二章", owner: "laozi", text: "曲则全，枉则直，洼则盈，敝则新，少则得，多则惑。", gloss: "曲能全，枉能直，洼能盈，敝能新，少能得，多能惑。", keywords: ["曲", "全", "枉", "直", "洼", "盈", "相对"] },
  { id: "laozi-daode-26", book: "道德经", chapter: "二十六章", owner: "laozi", text: "重为轻根，静为躁君。", gloss: "重是轻的根本，静是躁的主宰。", keywords: ["重", "轻", "静", "躁", "根", "君"] },
  { id: "laozi-daode-28", book: "道德经", chapter: "二十八章", owner: "laozi", text: "知其雄，守其雌，为天下溪……常德不离，复归于婴儿。", gloss: "知晓雄强却守住雌柔，为天下溪沟……常德不离，复归如婴儿。", keywords: ["雄", "雌", "柔", "婴儿", "德", "复归"] },
  { id: "laozi-daode-33", book: "道德经", chapter: "三十三章", owner: "laozi", text: "知人者智，自知者明。胜人者有力，自胜者强。", gloss: "知人是智，自知是明；胜人有力，自胜是强。", keywords: ["知人", "自知", "智", "明", "胜", "强"] },
  { id: "laozi-daode-33-zu", book: "道德经", chapter: "三十三章", owner: "laozi", text: "知足者富，强行者有志。", gloss: "知足的人富有，坚持力行的人有志。", keywords: ["知足", "富", "行", "志", "强"] },
  { id: "laozi-daode-36", book: "道德经", chapter: "三十六章", owner: "laozi", text: "将欲歙之，必固张之；将欲弱之，必固强之；将欲取之，必固与之。", gloss: "要收敛它必先扩张它，要削弱它必先强盛它，要夺取它必先给予它。", keywords: ["歙", "张", "弱", "强", "取", "与", "辩证"] },
  { id: "laozi-daode-38", book: "道德经", chapter: "三十八章", owner: "laozi", text: "上德不德，是以有德；下德不失德，是以无德。", gloss: "上德不自居德所以有德，下德不放过德所以无德。", keywords: ["德", "上德", "下德", "道", "有", "无"] },
  { id: "laozi-daode-38-shi", book: "道德经", chapter: "三十八章", owner: "laozi", text: "失道而后德，失德而后仁，失仁而后义，失义而后礼。夫礼者，忠信之薄而乱之首也。", gloss: "失道才讲德，失德才讲仁，失仁才讲义，失义才讲礼；礼是忠信的淡薄、祸乱的开端。", keywords: ["道", "德", "仁", "义", "礼", "乱", "薄"] },
  { id: "laozi-daode-39", book: "道德经", chapter: "三十九章", owner: "laozi", text: "昔之得一者，天得一以清，地得一以宁，神得一以灵，谷得一以盈。", gloss: "自古以来得一的：天得一而清，地得一而宁，神得一而灵，谷得一而盈。", keywords: ["一", "天", "地", "神", "谷", "清", "宁"] },
  { id: "laozi-daode-42", book: "道德经", chapter: "四十二章", owner: "laozi", text: "道生一，一生二，二生三，三生万物。万物负阴而抱阳，冲气以为和。", gloss: "道生一，一生二，二生三，三生万物；万物负阴抱阳，冲气成和。", keywords: ["道", "一", "二", "三", "万物", "阴", "阳", "和"] },
  { id: "laozi-daode-43", book: "道德经", chapter: "四十三章", owner: "laozi", text: "天下之至柔，驰骋天下之至坚。无有入无间。", gloss: "天下最柔的能驰骋于最坚之中；无形能入无间。", keywords: ["柔", "坚", "至柔", "无有", "无间", "入"] },
  { id: "laozi-daode-44", book: "道德经", chapter: "四十四章", owner: "laozi", text: "名与身孰亲？身与货孰多？甚爱必大费，多藏必厚亡。知足不辱，知止不殆。", gloss: "名声与生命哪个亲？生命与财货哪个重？过分吝惜必大耗，多藏必厚亡；知足不辱，知止不危。", keywords: ["名", "身", "货", "知足", "知止", "辱", "殆"] },
  { id: "laozi-daode-46", book: "道德经", chapter: "四十六章", owner: "laozi", text: "天下有道，却走马以粪；天下无道，戎马生于郊。祸莫大于不知足。", gloss: "天下有道则战马还田施肥；无道则战马生于郊野。祸患莫大于不知足。", keywords: ["有道", "马", "战", "祸", "不知足", "治"] },
  { id: "laozi-daode-47", book: "道德经", chapter: "四十七章", owner: "laozi", text: "不出户，知天下；不窥牖，见天道。", gloss: "不出门能知天下，不窥窗能见天道。", keywords: ["户", "牖", "知", "天道", "观", "道"] },
  { id: "laozi-daode-48", book: "道德经", chapter: "四十八章", owner: "laozi", text: "为学日益，为道日损。损之又损，以至于无为。", gloss: "求学日益增益，求道日益减损；减之又减以至于无为。", keywords: ["学", "道", "益", "损", "无为", "为"] },
  { id: "laozi-daode-52", book: "道德经", chapter: "五十二章", owner: "laozi", text: "见小曰明，守柔曰强。", gloss: "能见微细叫明，能守柔弱叫强。", keywords: ["小", "明", "柔", "强", "守", "见"] },
  { id: "laozi-daode-55", book: "道德经", chapter: "五十五章", owner: "laozi", text: "含德之厚，比于赤子。", gloss: "含德深厚的人好比初生的婴儿。", keywords: ["德", "赤子", "婴儿", "厚", "柔"] },
  { id: "laozi-daode-56", book: "道德经", chapter: "五十六章", owner: "laozi", text: "知者不言，言者不知。", gloss: "真知的人不多言，多言的人不知。", keywords: ["知", "言", "不言", "道", "默"] },
  { id: "laozi-daode-60", book: "道德经", chapter: "六十章", owner: "laozi", text: "治大国，若烹小鲜。", gloss: "治理大国如同煎小鱼——不可频繁翻动。", keywords: ["治国", "大国", "小鲜", "烹", "无为", "治"] },
  { id: "laozi-daode-66", book: "道德经", chapter: "六十六章", owner: "laozi", text: "江海所以能为百谷王者，以其善下之。", gloss: "江海能成为百谷之王，是因为它善于处下。", keywords: ["江海", "百谷王", "下", "柔", "治", "谦"] },
  { id: "laozi-daode-67", book: "道德经", chapter: "六十七章", owner: "laozi", text: "我有三宝，持而保之。一曰慈，二曰俭，三曰不敢为天下先。", gloss: "我有三宝：一慈，二俭，三不敢为天下先。", keywords: ["三宝", "慈", "俭", "不敢先", "道", "德"] },
  { id: "laozi-daode-78", book: "道德经", chapter: "七十八章", owner: "laozi", text: "天下莫柔弱于水，而攻坚强者莫之能胜。", gloss: "天下没有比水更柔弱的，但攻克坚硬的东西没有能胜过水的。", keywords: ["水", "柔", "攻坚", "胜", "弱", "强"] },
  { id: "laozi-daode-77", book: "道德经", chapter: "七十七章", owner: "laozi", text: "天之道，损有余而补不足。人之道则不然，损不足以奉有余。", gloss: "天道减有余补不足；人道却相反，减不足以奉有余。", keywords: ["天道", "人道", "损", "补", "有余", "不足"] },
  { id: "laozi-daode-15", book: "道德经", chapter: "十五章", owner: "laozi", text: "古之善为士者，微妙玄通，深不可识……豫兮若冬涉川，犹兮若畏四邻。", gloss: "古之善修道者微妙玄通深不可测；谨慎如冬天涉河，戒惧如畏四邻。", keywords: ["士", "微妙", "玄", "豫", "犹", "谨", "道"] },
  { id: "laozi-daode-23", book: "道德经", chapter: "二十三章", owner: "laozi", text: "希言自然。故飘风不终朝，骤雨不终日。", gloss: "少发政令合于自然；狂风刮不到一早晨，暴雨下不了一整天——狂暴难久。", keywords: ["希言", "自然", "飘风", "骤雨", "久", "治"] },
  { id: "laozi-daode-41", book: "道德经", chapter: "四十一章", owner: "laozi", text: "上士闻道，勤而行之；中士闻道，若存若亡；下士闻道，大笑之。", gloss: "上士闻道勤勉践行，中士闻道半信半疑，下士闻道大笑——道之难明。", keywords: ["上士", "中士", "下士", "道", "闻", "行", "笑"] },
  { id: "laozi-daode-62", book: "道德经", chapter: "六十二章", owner: "laozi", text: "道者万物之奥。善人之宝，不善人之所保。", gloss: "道是万物的归藏；善人视之为宝，不善之人也赖以保全。", keywords: ["道", "万物", "奥", "宝", "保", "善", "不善"] },

  // 公孙龙子补
  { id: "gongsun-tongbian", book: "公孙龙子", chapter: "通变论", owner: "gongsun", text: "曰：二有一乎？曰：二无一。", gloss: "二里能有一吗？二里没有一——论数与名之变。", keywords: ["通变", "一", "二", "数", "名", "辩"] },

  // 公孙龙子补（白马/指物/坚白/通变/名实/迹府，至逾三十条）
  { id: "gongsun-baima-1", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "白马非马，可乎？曰：可。", gloss: "白马不是马，可以这么说吗？可以。", keywords: ["白马非马", "名", "辩", "马", "白"] },
  { id: "gongsun-baima-2", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "马者，所以命形也；白者，所以命色也。命色者非命形也，故曰：白马非马。", gloss: "马命名形体，白命名颜色；命色不等于命形，故白马非马。", keywords: ["白马非马", "形", "色", "名", "实", "辩"] },
  { id: "gongsun-baima-3", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "求马，黄黑马皆可致；求白马，黄黑马不可致。", gloss: "求马则黄黑马都可；求白马则黄黑马不行——马与白马范围不同。", keywords: ["白马非马", "黄", "黑", "求", "马", "名"] },
  { id: "gongsun-baima-4", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "马者，无去取于色，故黄黑皆所以应；白马者，有去取于色，黄黑马皆所以色去。", gloss: "马不限定颜色故黄黑皆可；白马限定颜色故排除黄黑。", keywords: ["白马非马", "去取", "色", "马", "名", "辩"] },
  { id: "gongsun-baima-5", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "故白者不异马也，所谓白马者，乃白与马也，马与白也，故曰白马非马。", gloss: "白本身与马无异，但白马是“白”与“马”的结合，故白马非马。", keywords: ["白马非马", "白", "马", "合", "名", "辩"] },
  { id: "gongsun-zhiwu-1", book: "公孙龙子", chapter: "指物论", owner: "gongsun", text: "物莫非指，而指非指。", gloss: "事物无不由指谓而成其所是，但指谓本身并非被指之物。", keywords: ["指物", "指", "物", "名", "实", "辩"] },
  { id: "gongsun-zhiwu-2", book: "公孙龙子", chapter: "指物论", owner: "gongsun", text: "天下无指，物无可以谓物。", gloss: "若天下没有指谓，物就无从被称为物。", keywords: ["指物", "指", "物", "谓", "名", "辩"] },
  { id: "gongsun-zhiwu-3", book: "公孙龙子", chapter: "指物论", owner: "gongsun", text: "指也者，天下之所无也；物也者，天下之所有也。以天下之所有，为天下之所无，未可。", gloss: "指谓是天下所无（抽象），物是天下所有（实存）；以实存为抽象，不可。", keywords: ["指物", "指", "物", "有", "无", "名实", "辩"] },
  { id: "gongsun-jianbai-1", book: "公孙龙子", chapter: "坚白论", owner: "gongsun", text: "坚白石三，可乎？曰：不可。曰：二可。", gloss: "坚、白、石三者能分立为三吗？不可，只能分而为二。", keywords: ["离坚白", "坚", "白", "石", "二", "三", "辩"] },
  { id: "gongsun-jianbai-2", book: "公孙龙子", chapter: "坚白论", owner: "gongsun", text: "视不得其所坚而得其所白者，无坚也；拊不得其所白而得其所坚者，无白也。", gloss: "看只能得白不得坚，故无坚；摸只能得坚不得白，故无白——坚白相离。", keywords: ["离坚白", "视", "拊", "坚", "白", "离", "辩"] },
  { id: "gongsun-jianbai-3", book: "公孙龙子", chapter: "坚白论", owner: "gongsun", text: "得其白，得其坚，见与不见离。见不见离，一一不相盈，故离。", gloss: "得白与得坚，是见与不见之离；二者不相包涵，故相离。", keywords: ["离坚白", "见", "不见", "离", "盈", "辩"] },
  { id: "gongsun-jianbai-4", book: "公孙龙子", chapter: "坚白论", owner: "gongsun", text: "离也者，藏也。", gloss: "所谓离，即是潜藏——坚、白各自潜藏于石。", keywords: ["离坚白", "离", "藏", "坚", "白", "辩"] },
  { id: "gongsun-tongbian-1", book: "公孙龙子", chapter: "通变论", owner: "gongsun", text: "谓左右曰：左与右可谓二乎？曰：可。", gloss: "左与右可以称为二吗？可以。", keywords: ["通变", "左", "右", "二", "名", "辩"] },
  { id: "gongsun-tongbian-2", book: "公孙龙子", chapter: "通变论", owner: "gongsun", text: "曰：二有一乎？曰：二无一。", gloss: "二里能有一吗？二里没有一——整体不含部分之名。", keywords: ["通变", "二", "一", "无", "名", "辩"] },
  { id: "gongsun-tongbian-3", book: "公孙龙子", chapter: "通变论", owner: "gongsun", text: "曰：右有与，可谓变乎？曰：可。", gloss: "右有所附从，可称为变吗？可以。", keywords: ["通变", "右", "与", "变", "名", "辩"] },
  { id: "gongsun-mingshi-1", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "夫名，实谓也。", gloss: "名是对实的称呼。", keywords: ["名实", "名", "实", "谓", "正名", "辩"] },
  { id: "gongsun-mingshi-2", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "知此之非此也，知此之不在此也，则不谓也。", gloss: "明知此名不指此实、此实不在此处，就不该这样称呼。", keywords: ["名实", "正名", "谓", "实", "名", "辩"] },
  { id: "gongsun-mingshi-3", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "物以物其所物而不过焉，实也。", gloss: "事物之所以成为该事物而不越出其界，就是实。", keywords: ["名实", "物", "实", "界", "正名", "辩"] },
  { id: "gongsun-mingshi-4", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "实以实其所实而不旷焉，位也。", gloss: "实以其所实而不空缺，就是位。", keywords: ["名实", "实", "位", "正名", "辩"] },
  { id: "gongsun-mingshi-5", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "出其所位非位，而位其所位焉，正也。", gloss: "超出其位就非位，各居其位才是正。", keywords: ["名实", "位", "正", "正名", "辩"] },
  { id: "gongsun-mingshi-6", book: "公孙龙子", chapter: "名实论", owner: "gongsun", text: "以其所正，正其所不正；以其所不正，疑其所正。", gloss: "以已正者矫正不正者；以不正者反观已正者是否真正。", keywords: ["名实", "正", "不正", "疑", "正名", "辩"] },
  { id: "gongsun-jifu-1", book: "公孙龙子", chapter: "迹府", owner: "gongsun", text: "龙之所以为名者，乃以白马之论尔。", gloss: "我公孙龙之所以得名，就在于白马非马之论。", keywords: ["迹府", "白马非马", "公孙龙", "名", "辩"] },
  { id: "gongsun-jifu-2", book: "公孙龙子", chapter: "迹府", owner: "gongsun", text: "龙与孔穿会赵平原君家，穿曰：素闻先生高谊，愿为弟子久矣，但不取先生以白马为非马耳。", gloss: "孔穿说：久闻先生高义愿为弟子，但不敢苟同白马非马之说。", keywords: ["迹府", "孔穿", "白马非马", "平原君", "辩"] },
  { id: "gongsun-jifu-3", book: "公孙龙子", chapter: "迹府", owner: "gongsun", text: "龙曰：先生之言悖。龙之所以为名者，乃以白马之论尔。今使龙去之，则无以为教。", gloss: "公孙龙说：您的话自相矛盾；我之所以得名正因白马论，若弃之则无以为教。", keywords: ["迹府", "白马非马", "教", "名", "辩"] },
  { id: "gongsun-jifu-4", book: "公孙龙子", chapter: "迹府", owner: "gongsun", text: "且龙之论，所以不可者，以其教也；如教之，是教人无以有辩也。", gloss: "我的论之所以不可弃，因它是教；若教人弃辩，则天下无辩。", keywords: ["迹府", "教", "辩", "白马非马", "名"] },
  { id: "gongsun-baima-6", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "马固有色，故有白马。使马无色，有马如已耳，安取白马？", gloss: "马本有色故有白马；若马无色，就只有马，哪来白马？", keywords: ["白马非马", "色", "马", "白", "名", "辩"] },
  { id: "gongsun-baima-7", book: "公孙龙子", chapter: "白马论", owner: "gongsun", text: "白者不定所白，忽而马，故白马。言白所以命色也，言马所以命形也。", gloss: "白不定指某物之白，偶然附于马才有白马；白命色，马命形。", keywords: ["白马非马", "白", "色", "马", "形", "名"] },
  { id: "gongsun-zhiwu-4", book: "公孙龙子", chapter: "指物论", owner: "gongsun", text: "且夫指固自为非指，奚待于物？", gloss: "指谓本自非被指之物，何须待物而成？", keywords: ["指物", "指", "非指", "物", "名", "辩"] },
  { id: "gongsun-jianbai-5", book: "公孙龙子", chapter: "坚白论", owner: "gongsun", text: "且犹白以目见，目以火见，而火不见，则以火与目不见，而神见。", gloss: "白以目见，目以火（光）见，但火本身不见；故目与火皆不见，唯神明见之。", keywords: ["离坚白", "目", "火", "神", "见", "辩"] },

  // 孙子兵法补
  { id: "sunzi-junzheng-1", book: "孙子兵法", chapter: "军争", owner: "sunwu", text: "避其锐气，击其惰归，此治气者也。", gloss: "避开敌军锐气，趁其倦怠归退时击之，这是掌握士气的用兵之法。", keywords: ["军争", "气", "锐", "避", "击", "胜"] },
  { id: "sunzi-jiudi-touzhi", book: "孙子兵法", chapter: "九地", owner: "sunwu", text: "投之亡地而后存，陷之死地而后生。", gloss: "把士卒投入绝境反而能存，陷于死地反而能生——背水一战之理。", keywords: ["亡地", "死地", "存", "生", "势", "兵", "危"] },
  { id: "sunzi-huogong", book: "孙子兵法", chapter: "火攻", owner: "sunwu", text: "非利不动，非得不用，非危不战。", gloss: "无利不动兵，无必胜不用战，非危急不交战——慎战之旨。", keywords: ["火攻", "利", "得", "危", "战", "慎战"] },
  { id: "sunzi-yongjian", book: "孙子兵法", chapter: "用间", owner: "sunwu", text: "明君贤将，所以动而胜人，成功出于众者，先知也。", gloss: "明君贤将一出兵就胜人，功业出众，靠的是先知敌情。", keywords: ["间", "先知", "胜", "明君", "智", "兵"] },

  // 孙子兵法补（计/战/攻/形/势/虚实/军争/九变/九地/火攻/用间，至逾五十条）
  { id: "sunzi-shiji-dao", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "故经之以五事，校之以计，而索其情：一曰道，二曰天，三曰地，四曰将，五曰法。", gloss: "以五事衡量、七计比较来探求战情：道、天、地、将、法。", keywords: ["五事", "道", "天", "地", "将", "法", "计"] },
  { id: "sunzi-shiji-jiang", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "将者，智、信、仁、勇、严也。", gloss: "将须具备智、信、仁、勇、严五德。", keywords: ["将", "智", "信", "仁", "勇", "严", "五德"] },
  { id: "sunzi-shiji-gui", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "兵者，诡道也。", gloss: "用兵是一种诡诈之道。", keywords: ["兵", "诡道", "诈", "谋", "战"] },
  { id: "sunzi-shiji-gong", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "攻其无备，出其不意。", gloss: "在敌方无备处进攻，在意想不到时出击。", keywords: ["攻", "无备", "不意", "奇", "战", "胜"] },
  { id: "sunzi-shiji-suan", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "多算胜，少算不胜，而况于无算乎！", gloss: "筹划周密则胜，筹划少则不胜，何况不筹划？", keywords: ["算", "计", "胜", "不胜", "慎", "谋"] },
  { id: "sunzi-zuozhan-su", book: "孙子兵法", chapter: "作战", owner: "sunwu", text: "兵闻拙速，未睹巧之久也。", gloss: "用兵只听说宁可笨拙求速胜，没见过求巧而久拖的。", keywords: ["速", "拙", "久", "兵", "胜", "战"] },
  { id: "sunzi-zuozhan-gui", book: "孙子兵法", chapter: "作战", owner: "sunwu", text: "兵贵胜，不贵久。", gloss: "用兵贵在速胜，不贵久拖。", keywords: ["速", "胜", "久", "兵", "贵", "战"] },
  { id: "sunzi-zuozhan-fei", book: "孙子兵法", chapter: "作战", owner: "sunwu", text: "国之贫于师者远输，远输则百姓贫。", gloss: "国家因远途转运军需而贫，远运则百姓贫困。", keywords: ["战", "贫", "输", "百姓", "国", "费"] },
  { id: "sunzi-mougong-zhi", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "知己知彼，百战不殆。", gloss: "了解自己也了解敌人，百战都不会有危险。", keywords: ["知己", "知彼", "胜", "不殆", "百战", "智"] },
  { id: "sunzi-mougong-buzhi", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "不知彼而知己，一胜一负；不知彼不知己，每战必殆。", gloss: "不知敌但知己则胜败各半；既不知敌又不知己则每战必败。", keywords: ["知己", "知彼", "胜", "负", "殆", "智"] },
  { id: "sunzi-mougong-wei", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "用兵之法，十则围之，五则攻之，倍则分之，敌则能战之，少则能逃之。", gloss: "用兵之法：十倍于敌则围，五倍则攻，两倍则分，势均则战，少于则退。", keywords: ["围", "攻", "分", "战", "逃", "用兵", "兵力"] },
  { id: "sunzi-mougong-qu", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "善用兵者，屈人之兵而非战也，拔人之城而非攻也，毁人之国而非久也。", gloss: "善用兵者使敌军屈服而非靠交战，夺取城池而非靠强攻，毁灭敌国而非靠久拖。", keywords: ["屈人", "非战", "全胜", "拔城", "伐谋", "胜"] },
  { id: "sunzi-mougong-yu", book: "孙子兵法", chapter: "谋攻", owner: "sunwu", text: "将能而君不御者胜。", gloss: "将帅有能而君主不从中干预的，才能取胜。", keywords: ["将", "君", "不御", "胜", "任", "权"] },
  { id: "sunzi-junxing-bu", book: "孙子兵法", chapter: "军形", owner: "sunwu", text: "昔之善战者，先为不可胜，以待敌之可胜。", gloss: "善战者先使自己不可被胜，然后等待敌人可被胜的时机。", keywords: ["不可胜", "可胜", "待", "胜", "形", "守"] },
  { id: "sunzi-junxing-ji", book: "孙子兵法", chapter: "军形", owner: "sunwu", text: "不可胜在己，可胜在敌。", gloss: "不可被胜在于自己，能否胜敌在于敌人。", keywords: ["不可胜", "己", "敌", "胜", "形"] },
  { id: "sunzi-junxing-ming", book: "孙子兵法", chapter: "军形", owner: "sunwu", text: "善战者之胜也，无智名，无勇功。", gloss: "善战者取胜既无智名也无勇功——因其胜于易胜。", keywords: ["胜", "智名", "勇功", "形", "易胜"] },
  { id: "sunzi-junxing-xian", book: "孙子兵法", chapter: "军形", owner: "sunwu", text: "胜兵先胜而后求战，败兵先战而后求胜。", gloss: "胜兵先具备胜势再求战，败兵先开战再求胜。", keywords: ["胜兵", "败兵", "先胜", "求战", "形", "胜"] },
  { id: "sunzi-junxing-li", book: "孙子兵法", chapter: "军形", owner: "sunwu", text: "善战者，立于不败之地，而不失敌之败也。", gloss: "善战者立于不败之地，又不放过击败敌人的时机。", keywords: ["不败", "立", "敌之败", "胜", "形"] },
  { id: "sunzi-bingshi-zheng", book: "孙子兵法", chapter: "兵势", owner: "sunwu", text: "凡战者，以正合，以奇胜。", gloss: "凡作战都以正兵交锋，以奇兵取胜。", keywords: ["正", "奇", "正合", "奇胜", "势", "战"] },
  { id: "sunzi-bingshi-bian", book: "孙子兵法", chapter: "兵势", owner: "sunwu", text: "奇正之变，不可胜穷也。奇正相生，如循环之无端。", gloss: "奇正的变化无穷，奇正相生如循环无端。", keywords: ["奇正", "变", "无穷", "循环", "势", "战"] },
  { id: "sunzi-bingshi-shui", book: "孙子兵法", chapter: "兵势", owner: "sunwu", text: "激水之疾，至于漂石者，势也。", gloss: "湍急的水流能冲走石头，靠的是势。", keywords: ["水", "势", "漂石", "疾", "势", "战"] },
  { id: "sunzi-bingshi-jie", book: "孙子兵法", chapter: "兵势", owner: "sunwu", text: "善战者，其势险，其节短。", gloss: "善战者其势如张满的弓弩，其节奏短促如发机。", keywords: ["势", "险", "节", "短", "战", "发"] },
  { id: "sunzi-xushi-xian", book: "孙子兵法", chapter: "虚实", owner: "sunwu", text: "凡先处战地而待敌者佚，后处战地而趋战者劳。", gloss: "先到战地待敌的从容，后到战地赶去交战的疲劳。", keywords: ["先", "后", "佚", "劳", "战地", "虚实"] },
  { id: "sunzi-xushi-qu", book: "孙子兵法", chapter: "虚实", owner: "sunwu", text: "出其所不趋，趋其所不意。行千里而不劳者，行于无人之地也。", gloss: "出击敌人无法救援之处，奔袭敌人意想不到之地；行千里不劳因走的是无人防守之地。", keywords: ["出", "趋", "不意", "无人", "虚实", "胜"] },
  { id: "sunzi-xushi-xing", book: "孙子兵法", chapter: "虚实", owner: "sunwu", text: "形人而我无形，则我专而敌分。", gloss: "使敌现形而我无形，则我集中而敌分散。", keywords: ["形", "无形", "专", "分", "虚实", "胜"] },
  { id: "sunzi-xushi-bi", book: "孙子兵法", chapter: "虚实", owner: "sunwu", text: "避实而击虚。", gloss: "避开敌人坚实之处，攻击其虚弱之处。", keywords: ["避实", "击虚", "虚实", "胜", "战"] },
  { id: "sunzi-junzheng-yu", book: "孙子兵法", chapter: "军争", owner: "sunwu", text: "军争之难者，以迂为直，以患为利。", gloss: "军争的难处在于把迂回当直路、把患害化为有利。", keywords: ["军争", "迂", "直", "患", "利", "战"] },
  { id: "sunzi-junzheng-zha", book: "孙子兵法", chapter: "军争", owner: "sunwu", text: "兵以诈立，以利动，以分合为变。", gloss: "用兵靠诡诈立身，以利益行动，以分散集中为变化。", keywords: ["诈", "利", "分合", "变", "军争", "战"] },
  { id: "sunzi-junzheng-feng", book: "孙子兵法", chapter: "军争", owner: "sunwu", text: "其疾如风，其徐如林，侵掠如火，不动如山。", gloss: "行动迅疾如风，从容如林，侵掠如火，静止如山。", keywords: ["风", "林", "火", "山", "军争", "势"] },
  { id: "sunzi-jiubian-wei", book: "孙子兵法", chapter: "九变", owner: "sunwu", text: "将之至任，固在于知变而已矣。", gloss: "将帅最重要的责任，就在于懂得应变。", keywords: ["九变", "将", "变", "任", "应变"] },
  { id: "sunzi-jiubian-wuwei", book: "孙子兵法", chapter: "九变", owner: "sunwu", text: "必死可杀，必生可虏，忿速可侮，廉洁可辱，爱民可烦——凡此五者，将之过也。", gloss: "一味必死可被杀，贪生怕死可被虏，急躁易怒可被侮，自矜廉洁可被辱，溺爱士卒可被扰——此五者是将之过。", keywords: ["九变", "将", "五危", "必死", "必生", "忿速", "过"] },
  { id: "sunzi-xingjun-qin", book: "孙子兵法", chapter: "行军", owner: "sunwu", text: "卒未亲附而罚之，则不服；已亲附而罚不行，则不可用也。", gloss: "士卒未亲附就施罚则不服；已亲附却不施罚则不可用。", keywords: ["行军", "罚", "亲附", "服", "用", "治军"] },
  { id: "sunzi-xingjun-su", book: "孙子兵法", chapter: "行军", owner: "sunwu", text: "令素行以教其民，则民服。", gloss: "平素就严格执行命令来训练士卒，士卒才会服从。", keywords: ["行军", "令", "素行", "教", "服", "治军"] },
  { id: "sunzi-dixing-zhi", book: "孙子兵法", chapter: "地形", owner: "sunwu", text: "知彼知己，胜乃不殆；知天知地，胜乃可全。", gloss: "知彼知己胜而不危；知天知地胜才可保全。", keywords: ["地形", "知彼", "知己", "天", "地", "胜", "全"] },
  { id: "sunzi-jiudi-su", book: "孙子兵法", chapter: "九地", owner: "sunwu", text: "兵之情主速，乘人之不及。", gloss: "用兵之理贵在神速，乘敌人来不及。", keywords: ["九地", "速", "乘", "不及", "战"] },
  { id: "sunzi-jiudi-ju", book: "孙子兵法", chapter: "九地", owner: "sunwu", text: "聚三军之众，投之于险，此谓将军之事也。", gloss: "聚集三军投入险地，这是将军的职责。", keywords: ["九地", "聚", "投险", "将", "事", "危"] },
  { id: "sunzi-huogong-zhu", book: "孙子兵法", chapter: "火攻", owner: "sunwu", text: "主不可以怒而兴师，将不可以愠而致战。", gloss: "君主不可因愤怒而兴兵，将帅不可因怨愠而开战。", keywords: ["火攻", "怒", "愠", "主", "将", "慎战"] },
  { id: "sunzi-huogong-ming", book: "孙子兵法", chapter: "火攻", owner: "sunwu", text: "怒可以复喜，愠可以复悦，亡国不可以复存，死者不可以复生。", gloss: "怒可复喜，愠可复悦，但亡国不可复存，死者不可复生——慎战。", keywords: ["火攻", "怒", "亡国", "死", "慎战", "不可逆"] },
  { id: "sunzi-yongjian-qin", book: "孙子兵法", chapter: "用间", owner: "sunwu", text: "三军之事，莫亲于间，赏莫厚于间，事莫密于间。", gloss: "三军事务中没有比间谍更亲信的，赏赐没有比间谍更厚的，机密没有比间谍更严的。", keywords: ["用间", "间", "亲", "赏", "密", "智"] },
  { id: "sunzi-yongjian-ren", book: "孙子兵法", chapter: "用间", owner: "sunwu", text: "先知者，不可取于鬼神，不可象于事，不可验于度，必取于人，知敌之情者也。", gloss: "先知敌情不能求于鬼神、不能类推、不能臆度，必取于人——即了解敌情的间谍。", keywords: ["用间", "先知", "鬼神", "人", "敌情", "智"] },
  { id: "sunzi-shiji-xiao", book: "孙子兵法", chapter: "始计", owner: "sunwu", text: "校之以计，而索其情，曰：主孰有道？将孰有能？天地孰得？法令孰行？", gloss: "以七计比较探求战情：哪方君主有道？将帅有能？天地有利？法令得行？", keywords: ["始计", "七计", "主", "将", "天地", "法令", "胜"] },

  // 邹衍补
  { id: "zou-shetong", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "其语闳大不经，必先验小物，推而大之，至于无垠。", gloss: "其说宏大不经，却先验小物而后推及无垠——邹衍推演之法。", keywords: ["验", "推", "大", "小", "无垠", "方法", "历物"] },

  // 公共典籍补
  { id: "zhouyi-tuan-qian", book: "周易", chapter: "乾卦·象", owner: "", text: "天行健，君子以自强不息。", gloss: "天道运行刚健不止，君子由此自强不息。", keywords: ["天", "健", "君子", "自强", "不息", "修身"] },
  { id: "zhouyi-tuan-kun", book: "周易", chapter: "坤卦·象", owner: "", text: "地势坤，君子以厚德载物。", gloss: "大地势顺，君子以厚德容载万物。", keywords: ["地", "坤", "厚德", "载物", "君子", "德"] },
  { id: "shangshu-yaodian", book: "尚书", chapter: "尧典", owner: "", text: "克明俊德，以亲九族。", gloss: "能明扬大德，以亲睦九族——德治之始。", keywords: ["德", "明", "亲", "族", "治", "尧"] },
  { id: "lvshi-chungong", book: "吕氏春秋", chapter: "贵公", owner: "", text: "天下非一人之天下也，天下之天下也。", gloss: "天下不是一人的天下，是天下人的天下。", keywords: ["天下", "公", "民", "治", "贵公", "权"] },

  // 鬼谷子（纵横捭阖之术）
  { id: "guigu-baihe", book: "鬼谷子", chapter: "捭阖", owner: "guigu", text: "捭之者，开也、言也、阳也；阖之者，闭也、默也、阴也。", gloss: "捭是开、是言、属阳；阖是闭、是默、属阴——开合阴阳，游说之根本。", keywords: ["捭阖", "阴阳", "言", "默", "纵横", "开合", "游说"] },
  { id: "guigu-fanying", book: "鬼谷子", chapter: "反应", owner: "guigu", text: "反以观往，覆以验来；反以知古，覆以知今。", gloss: "反观过往以验将来，由古知今——以静听动之法。", keywords: ["反", "验", "古今", "往来", "知", "静", "听"] },
  { id: "guigu-mou", book: "鬼谷子", chapter: "谋篇", owner: "guigu", text: "愚者易蔽也，不肖者易惧也，贪者易诱也——因其势而导之。", gloss: "愚者易蒙蔽，不肖者易恐吓，贪者易利诱，顺其弱点而引导。", keywords: ["谋", "人", "弱点", "因", "势", "术", "利"] },

  // 鬼谷子补（捭阖/反应/内揵/抵巇/飞箝/忤合/揣篇/摩篇/权篇/谋篇/决篇，至逾十五条）
  { id: "guigu-baihe-2", book: "鬼谷子", chapter: "捭阖", owner: "guigu", text: "捭阖者，道之大化，说之变也。", gloss: "捭阖是道的大化，游说的变化之机。", keywords: ["捭阖", "道", "化", "游说", "变", "纵横"] },
  { id: "guigu-baihe-3", book: "鬼谷子", chapter: "捭阖", owner: "guigu", text: "阴阳其和，先后其序。捭之者，开也、言也、阳也；阖之者，闭也、默也、阴也。", gloss: "阴阳相和、先后有序；捭是开言属阳，阖是闭默属阴。", keywords: ["捭阖", "阴阳", "言", "默", "序", "纵横"] },
  { id: "guigu-baihe-yin", book: "鬼谷子", chapter: "捭阖", owner: "guigu", text: "益损、去就、倍反，皆以阴阳御其事。", gloss: "增益减损、离去就任、背反归附，都靠阴阳来驾驭。", keywords: ["捭阖", "阴阳", "损", "益", "去就", "倍反"] },
  { id: "guigu-fanying-2", book: "鬼谷子", chapter: "反应", owner: "guigu", text: "人言者，动也；己默者，静也。因其言，听其辞。", gloss: "别人说话是动，自己沉默是静；顺其言而听其辞。", keywords: ["反应", "动", "静", "听", "言", "辞"] },
  { id: "guigu-fanying-3", book: "鬼谷子", chapter: "反应", owner: "guigu", text: "言有不合者，反而求之，其应必出。", gloss: "言语有不合之处，反过去探求，其应对必会显露。", keywords: ["反应", "言", "不合", "反", "应", "探"] },
  { id: "guigu-neijian", book: "鬼谷子", chapter: "内揵", owner: "guigu", text: "内者，进说辞也；揵者，揵所谋也。", gloss: "内是进献说辞，揵是固结所谋于君心。", keywords: ["内揵", "说辞", "谋", "君", "结", "纵横"] },
  { id: "guigu-dixi", book: "鬼谷子", chapter: "抵巇", owner: "guigu", text: "巇始有朕，可抵而塞，可抵而却。", gloss: "缝隙初起便有征兆，可抵而堵塞、可抵而退去。", keywords: ["抵巇", "巇", "塞", "却", "征兆", "防"] },
  { id: "guigu-feiqian", book: "鬼谷子", chapter: "飞箝", owner: "guigu", text: "用之于人，则量智能、权材力、料气势，为之枢机。", gloss: "用于人则衡量其智能、材力、气势，这是制人的枢机。", keywords: ["飞箝", "智", "材", "气", "枢机", "人"] },
  { id: "guigu-wuhe", book: "鬼谷子", chapter: "忤合", owner: "guigu", text: "世无常贵，事无常师。圣人居天地之间，立身御世，必审其势。", gloss: "世上无永远尊贵，世事无常师；圣人立身御世必审其势。", keywords: ["忤合", "势", "无常", "圣人", "御世", "审"] },
  { id: "guigu-chuai", book: "鬼谷子", chapter: "揣篇", owner: "guigu", text: "揣情者，必以其甚喜之时往而极其欲也。", gloss: "揣情必趁其极喜之时往而激其欲望——欲望既极则情可得。", keywords: ["揣", "情", "喜", "欲", "极", "得"] },
  { id: "guigu-mo", book: "鬼谷子", chapter: "摩篇", owner: "guigu", text: "摩者，揣之术也。内符者，揣之主也。", gloss: "摩是揣的方法；内符（内心相合）是揣的主旨。", keywords: ["摩", "揣", "内符", "术", "合", "心"] },
  { id: "guigu-quan", book: "鬼谷子", chapter: "权篇", owner: "guigu", text: "说者，说之也；说之者，资之也。", gloss: "游说是为了说服；说服是为了资益其事。", keywords: ["权", "说", "资", "服", "游说", "纵横"] },
  { id: "guigu-jue", book: "鬼谷子", chapter: "决篇", owner: "guigu", text: "决者，定其疑也。善决者，必先料其疑之所起。", gloss: "决是判定疑虑；善决者必先推究疑虑之起因。", keywords: ["决", "疑", "料", "起", "断", "纵横"] },
  { id: "guigu-mou-2", book: "鬼谷子", chapter: "谋篇", owner: "guigu", text: "计谋者，存亡之枢机。虑不至者，不足以言谋。", gloss: "计谋是存亡的枢机；思虑不周者不足言谋。", keywords: ["谋", "计", "存亡", "枢机", "虑", "纵横"] },
  { id: "guigu-baihe-sheng", book: "鬼谷子", chapter: "捭阖", owner: "guigu", text: "圣人之在天下也，自古及今，其道一也。", gloss: "圣人之在天下，自古至今其道是一贯的。", keywords: ["捭阖", "圣人", "道", "一", "古今", "纵横"] },
  // 鬼谷补（本经阴符七术、符言、中经等十二则，至逾三十条）
  { id: "guigu-fuyan", book: "鬼谷子", chapter: "符言", owner: "guigu", text: "安徐正静，其柔节先定。善静而不与，居而不过。", gloss: "安详徐缓正定沉静，柔节先立；善静而不争，安居而不过分。", keywords: ["符言", "静", "安", "柔", "正", "不争"] },
  { id: "guigu-fuyan-2", book: "鬼谷子", chapter: "符言", owner: "guigu", text: "目贵明，耳贵聪，心贵智。以天下之目视者，则无不见。", gloss: "目贵明、耳贵聪、心贵智；以天下之目视则无不见——君道贵在兼听。", keywords: ["符言", "明", "聪", "智", "目", "耳", "心", "兼听"] },
  { id: "guigu-fuyan-3", book: "鬼谷子", chapter: "符言", owner: "guigu", text: "循名而为，实安而完；名实相生，反相为情。", gloss: "循名而为，实安而完备；名实相生，互为表里。", keywords: ["符言", "名", "实", "循", "相生", "正"] },
  { id: "guigu-fuyan-4", book: "鬼谷子", chapter: "符言", owner: "guigu", text: "赏罚贵信，必验其目之所见、耳之所闻。", gloss: "赏罚贵在守信，必验证于目见耳闻——勿用暧昧之赏罚。", keywords: ["符言", "赏", "罚", "信", "验", "见闻"] },
  { id: "guigu-shengshen", book: "鬼谷子", chapter: "本经阴符七术·盛神", owner: "guigu", text: "盛神中有五气，神为之长，心为之舍，德为之符。", gloss: "旺盛之神中有五气，神为之长，心为之舍，德为之符——养神之本。", keywords: ["盛神", "神", "五气", "心", "德", "养"] },
  { id: "guigu-shengshen-2", book: "鬼谷子", chapter: "本经阴符七术·盛神", owner: "guigu", text: "静和者，养气者也。气得其和，则神明自至。", gloss: "静和是养气；气得其和，神明自至。", keywords: ["盛神", "静", "和", "养气", "神明", "气"] },
  { id: "guigu-yangzhi", book: "鬼谷子", chapter: "本经阴符七术·养志", owner: "guigu", text: "养志者，心气之思不达也。有所欲，志存而思之。", gloss: "养志因心气思虑不通达；有所欲求，志存而思之。", keywords: ["养志", "志", "欲", "思", "心气"] },
  { id: "guigu-yangzhi-2", book: "鬼谷子", chapter: "本经阴符七术·养志", owner: "guigu", text: "志者，欲之使也。欲多则心散，心散则志衰。", gloss: "志是欲的驱使；欲多则心散，心散则志衰——故养志在节欲。", keywords: ["养志", "志", "欲", "心散", "节欲", "衰"] },
  { id: "guigu-shiyi", book: "鬼谷子", chapter: "本经阴符七术·实意", owner: "guigu", text: "实意者，心气之思也。心欲安静，虑欲深远。", gloss: "实意是心气的思虑；心要安静，虑要深远。", keywords: ["实意", "心", "安静", "虑", "深远", "意"] },
  { id: "guigu-fenwei", book: "鬼谷子", chapter: "本经阴符七术·分威", owner: "guigu", text: "分威法伏熊。伏熊之分，将以能动。", gloss: "分威效法伏熊；伏熊之伏，是为了能动——威藏而后发。", keywords: ["分威", "伏熊", "藏", "发", "威", "动"] },
  { id: "guigu-zhongjing", book: "鬼谷子", chapter: "中经", owner: "guigu", text: "中经，谓以中道经纬人心者也。见形为容，象体为貌。", gloss: "中经是以中道经纬人心；见其形而为之容，象其体而为之貌。", keywords: ["中经", "人心", "中道", "形", "容", "貌"] },
  { id: "guigu-zhuanyuan", book: "鬼谷子", chapter: "本经阴符七术·转圆", owner: "guigu", text: "转圆法猛兽。转圆者，无穷之计也。", gloss: "转圆效法猛兽；转圆是无穷的计谋——计如圆转不穷。", keywords: ["转圆", "猛兽", "计", "无穷", "圆", "变"] },
  { id: "guigu-sundui", book: "鬼谷子", chapter: "本经阴符七术·损兑", owner: "guigu", text: "损兑法灵蓍。损兑者，机危之决也。", gloss: "损兑效法灵蓍；损兑是面临危机时的决断。", keywords: ["损兑", "灵蓍", "危", "决", "机", "断"] },

  // 苏子（苏秦合纵言策，散见战国策）
  { id: "suzi-chuce", book: "苏子", chapter: "战国策·楚策", owner: "suqin", text: "臣闻鄙语曰：宁为鸡口，无为牛后。", gloss: "宁可做鸡嘴（小而自主），不做牛后（大而附庸）——劝楚合纵抗秦。", keywords: ["合纵", "自主", "势", "小大", "从", "抗秦"] },
  { id: "suzi-qince", book: "苏子", chapter: "战国策·秦策", owner: "suqin", text: "毛羽不丰满者，不可以高飞。", gloss: "羽翼未丰不能高飞——时势未至不可强为。", keywords: ["时", "势", "待", "强", "纵横", "成"] },

  // 苏子补（合纵言策，散见战国策·楚/齐/赵/燕策）
  { id: "suzi-chuce-hezong", book: "苏子", chapter: "战国策·楚策", owner: "suqin", text: "诚能听臣，臣请令山东之国，奉四时之献，以从大王之明诏。", gloss: "若楚能听我，我可使山东诸国四季进献，听大王号令——合纵之约。", keywords: ["合纵", "山东", "从", "楚", "献", "纵"] },
  { id: "suzi-chuce-qin", book: "苏子", chapter: "战国策·楚策", owner: "suqin", text: "横成则秦帝，纵成则楚王。", gloss: "连横成则秦称帝，合纵成则楚称王——横纵之争。", keywords: ["合纵", "连横", "秦", "楚", "帝", "王", "横纵"] },
  { id: "suzi-qice-lu", book: "苏子", chapter: "战国策·齐策", owner: "suqin", text: "臣闻明主之用人也，不以私害公，不以近蔽远。", gloss: "明主用人不以私害公、不以近蔽远——苏秦谏齐。", keywords: ["用人", "公", "私", "近", "远", "齐"] },
  { id: "suzi-zhaoc-hezong", book: "苏子", chapter: "战国策·赵策", owner: "suqin", text: "且夫秦之攻赵，无仰险阻之利，无因水草之便。", gloss: "秦攻赵既无险阻可仰，又无水草之便——赵可合纵抗秦。", keywords: ["合纵", "秦", "赵", "险", "攻", "抗"] },
  { id: "suzi-zhaoc-suili", book: "苏子", chapter: "战国策·赵策", owner: "suqin", text: "赵之地，方三千里，带甲数十万，车千乘，骑万匹。", gloss: "赵地三千里，甲兵数十万、车千乘、骑万匹——赵之强。", keywords: ["赵", "甲", "车", "骑", "强", "兵"] },
  { id: "suzi-yance-zhui", book: "苏子", chapter: "战国策·燕策", owner: "suqin", text: "凡天下战国七，而燕处其弱焉。", gloss: "天下七雄并争，燕处其弱——苏秦说燕。", keywords: ["燕", "弱", "七雄", "战", "势"] },
  { id: "suzi-yance-he", book: "苏子", chapter: "战国策·燕策", owner: "suqin", text: "诚能从臣之计，则燕必强，而赵必安。", gloss: "若能从臣合纵之计，则燕必强、赵必安。", keywords: ["合纵", "燕", "赵", "强", "安", "计"] },
  { id: "suzi-zong-heshu", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "臣请为大王合纵以抗秦，约从结交，以安社稷。", gloss: "请为大王合纵抗秦，结约交好以安社稷。", keywords: ["合纵", "抗秦", "约", "从", "社稷", "安"] },
  { id: "suzi-zong-liyi", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "纵成则六国为一，以拒强秦，秦必不敢东出。", gloss: "合纵成则六国合一拒秦，秦不敢东出函谷。", keywords: ["合纵", "六国", "秦", "拒", "东", "纵"] },
  { id: "suzi-zong-shi", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "六国从亲，以摈秦，秦必不敢出函谷关以害山东矣。", gloss: "六国合亲以摈秦，秦必不敢出函谷害山东。", keywords: ["合纵", "六国", "函谷", "山东", "秦", "摈"] },
  { id: "suzi-heng-po", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "若听横人之言，事秦而背从，则六国必为秦所并。", gloss: "若听连横之言事秦背纵，六国必被秦吞并。", keywords: ["连横", "事秦", "背纵", "六国", "并", "秦"] },
  { id: "suzi-quan-shi", book: "苏子", chapter: "战国策·游说", owner: "suqin", text: "臣闻明主之举也，审其势，重其权，不务虚名。", gloss: "明主行事审时度势、重其权柄，不务虚名。", keywords: ["势", "权", "名", "明主", "纵横", "审"] },
  { id: "suzi-quan-yi", book: "苏子", chapter: "战国策·游说", owner: "suqin", text: "利之所在，虽千仞之山，无所不上；祸之所至，虽深渊之水，无所不入。", gloss: "利之所在千仞高山也上，祸之所至深渊也入——趋利避祸之喻。", keywords: ["利", "祸", "趋", "避", "势", "纵横"] },
  { id: "suzi-quan-shi-2", book: "苏子", chapter: "战国策·游说", owner: "suqin", text: "苏秦喟然叹曰：贫穷则父母不子，富贵则亲戚畏惧。", gloss: "苏秦叹：贫穷时父母不认子，富贵时亲戚都畏惧——世态炎凉。", keywords: ["贫", "富", "父母", "亲戚", "势", "世"] },
  { id: "suzi-shen-ji", book: "苏子", chapter: "战国策·游说", owner: "suqin", text: "使我有洛阳二顷田，安能佩六国相印。", gloss: "若我有洛阳二顷田，怎能佩六国相印——逼出纵横之功。", keywords: ["洛阳", "田", "六国相印", "纵横", "功", "逼"] },
  { id: "suzi-zong-zhi", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "合纵者，所以并力以拒秦也；连横者，所以事秦以自全也。", gloss: "合纵是合力拒秦，连横是事秦自全——纵横之辨。", keywords: ["合纵", "连横", "拒秦", "事秦", "纵横", "辨"] },

  // 苏子补续（合纵言策续，散见战国策·燕/赵/魏/齐策）
  { id: "suzi-yance-2", book: "苏子", chapter: "战国策·燕策", owner: "suqin", text: "燕之所以不犯寇者，以赵之为蔽也。", gloss: "燕之所以不被寇犯，因赵为其屏蔽——合纵唇齿相依。", keywords: ["燕", "赵", "蔽", "合纵", "唇齿", "势"] },
  { id: "suzi-yance-3", book: "苏子", chapter: "战国策·燕策", owner: "suqin", text: "赵破则燕必亡，故燕必从赵以抗秦。", gloss: "赵被破则燕必亡，故燕必从赵抗秦——地缘相依。", keywords: ["燕", "赵", "亡", "从", "抗秦", "合纵"] },
  { id: "suzi-zhaoc-2", book: "苏子", chapter: "战国策·赵策", owner: "suqin", text: "秦之欲伐赵，非一日之故也；赵能合纵，则秦必却。", gloss: "秦欲伐赵非一日之故；赵能合纵则秦必退。", keywords: ["秦", "赵", "伐", "合纵", "却", "势"] },
  { id: "suzi-zhaoc-3", book: "苏子", chapter: "战国策·赵策", owner: "suqin", text: "赵为纵主，则六国之兵皆听赵之号令。", gloss: "赵为合纵之主，则六国之兵皆听赵号令。", keywords: ["赵", "纵主", "六国", "号令", "合纵"] },
  { id: "suzi-weice-1", book: "苏子", chapter: "战国策·魏策", owner: "suqin", text: "魏居天下之冲，四战之地，不合纵则必为秦所并。", gloss: "魏居天下要冲、四战之地，不合纵必被秦吞并。", keywords: ["魏", "冲", "四战", "合纵", "并", "秦"] },
  { id: "suzi-weice-2", book: "苏子", chapter: "战国策·魏策", owner: "suqin", text: "魏若事秦，则秦得魏之援而更强，山东必危。", gloss: "魏若事秦，秦得魏援更强，山东必危。", keywords: ["魏", "事秦", "援", "山东", "危", "连横"] },
  { id: "suzi-qice-2", book: "苏子", chapter: "战国策·齐策", owner: "suqin", text: "齐负海之国也，地广人众，不合纵则孤立无援。", gloss: "齐是负海之国、地广人众，不合纵则孤立无援。", keywords: ["齐", "海", "地广", "合纵", "孤立", "援"] },
  { id: "suzi-qice-3", book: "苏子", chapter: "战国策·齐策", owner: "suqin", text: "齐与赵魏合，则秦不敢东顾；齐孤则秦必伐之。", gloss: "齐与赵魏合则秦不敢东顾；齐孤立则秦必伐。", keywords: ["齐", "赵", "魏", "秦", "东顾", "合纵"] },
  { id: "suzi-zong-meng", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "今六国约为兄弟之邦，刑白马以盟，同休戚共患难。", gloss: "六国约为兄弟之邦，刑白马结盟，同休戚共患难。", keywords: ["合纵", "盟", "白马", "六国", "兄弟", "休戚"] },
  { id: "suzi-zong-fa", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "纵约既坚，则秦虽强，不敢出函谷关以窥山东。", gloss: "纵约既坚，秦虽强也不敢出函谷窥山东。", keywords: ["纵约", "秦", "函谷", "山东", "坚", "不敢"] },
  { id: "suzi-zong-shang", book: "苏子", chapter: "战国策·合纵", owner: "suqin", text: "凡言事秦者，皆欲割地以赂秦，地不尽则秦不止。", gloss: "凡主张事秦者都想割地赂秦，地不尽则秦不止。", keywords: ["事秦", "割地", "赂", "连横", "秦", "贪"] },
  { id: "suzi-quan-chen", book: "苏子", chapter: "战国策·游说", owner: "suqin", text: "臣之计，非为一国之利，乃为六国之安也。", gloss: "我的计谋非为一国之利，乃为六国之安。", keywords: ["六国", "安", "计", "合纵", "利", "公"] },

  // 张子（张仪连横言策，散见战国策）
  { id: "zhangzi-qince", book: "张子", chapter: "战国策·秦策", owner: "zhangyi", text: "凡天下强国，非秦而楚，非楚而秦。", gloss: "天下强国非秦即楚，两强相争，当早定横纵。", keywords: ["连横", "秦", "楚", "强", "势", "横"] },
  { id: "zhangzi-hance", book: "张子", chapter: "战国策·韩策", owner: "zhangyi", text: "为大王计，莫如事秦。", gloss: "为韩谋，不如事秦——连横破纵之策。", keywords: ["事秦", "连横", "计", "从", "强", "韩"] },

  // 张子补（连横言策，散见战国策·秦/韩/魏/楚/齐策）
  { id: "zhangzi-qince-lian", book: "张子", chapter: "战国策·秦策", owner: "zhangyi", text: "臣闻之，谋莫难于必听，事莫难于必成。", gloss: "谋略最难在必被听从，做事最难在必能成功——张仪说秦。", keywords: ["谋", "听", "事", "成", "连横", "秦"] },
  { id: "zhangzi-qince-po", book: "张子", chapter: "战国策·秦策", owner: "zhangyi", text: "破纵横之约，臣请为大王悉意陈之。", gloss: "为破合纵之约，臣请为大王详陈——连横破纵。", keywords: ["连横", "破纵", "纵横", "秦", "陈", "约"] },
  { id: "zhangzi-weice-qin", book: "张子", chapter: "战国策·魏策", owner: "zhangyi", text: "魏之地，方千里，带甲三十万，其势可以抗秦。", gloss: "魏地千里、甲兵三十万，势可与秦抗——张仪说魏之强。", keywords: ["魏", "甲", "千里", "强", "势", "抗秦"] },
  { id: "zhangzi-weice-shi", book: "张子", chapter: "战国策·魏策", owner: "zhangyi", text: "为大王计，莫如事秦以自全，而与楚赵合，则魏安。", gloss: "为魏谋，不如事秦自全，并结楚赵，则魏安。", keywords: ["事秦", "魏", "楚", "赵", "安", "连横"] },
  { id: "zhangzi-chuce-po", book: "张子", chapter: "战国策·楚策", owner: "zhangyi", text: "楚虽强，不足以当秦；秦楚之交，则天下莫能犯。", gloss: "楚虽强不足以独当秦；秦楚交好则天下莫犯——劝楚事秦。", keywords: ["楚", "秦", "交", "强", "事秦", "连横"] },
  { id: "zhangzi-chuce-shang", book: "张子", chapter: "战国策·楚策", owner: "zhangyi", text: "秦楚为婚姻之国，以婚相结，则横成而楚安。", gloss: "秦楚结婚姻之好，则连横成而楚安。", keywords: ["秦", "楚", "婚姻", "结", "连横", "安"] },
  { id: "zhangzi-qice-po", book: "张子", chapter: "战国策·齐策", owner: "zhangyi", text: "齐虽强，然孤齐不足以抗秦，合秦则齐安。", gloss: "齐虽强，孤齐不足以抗秦；合于秦则齐安——劝齐事秦。", keywords: ["齐", "秦", "孤", "合", "安", "连横"] },
  { id: "zhangzi-qince-zong", book: "张子", chapter: "战国策·秦策", owner: "zhangyi", text: "纵人之言，皆欲以弱秦而强山东，其实不可成也。", gloss: "合纵者之言皆欲弱秦强山东，其实不可成——破纵之论。", keywords: ["合纵", "弱秦", "山东", "成", "破纵", "连横"] },
  { id: "zhangzi-hance-po", book: "张子", chapter: "战国策·韩策", owner: "zhangyi", text: "韩弱而秦强，事秦则韩全，抗秦则韩亡。", gloss: "韩弱秦强，事秦则韩全，抗秦则韩亡——劝韩事秦。", keywords: ["韩", "秦", "弱", "强", "事秦", "亡"] },
  { id: "zhangzi-zong-heng", book: "张子", chapter: "战国策·连横", owner: "zhangyi", text: "连横者，结强秦以自固；合纵者，聚弱国以抗强。", gloss: "连横是结强秦自固，合纵是聚弱国抗强——纵横之辨。", keywords: ["连横", "合纵", "秦", "强", "弱", "纵横"] },
  { id: "zhangzi-zong-po", book: "张子", chapter: "战国策·连横", owner: "zhangyi", text: "纵约不坚则六国离散，离散则秦得各个击之。", gloss: "纵约不坚则六国离散，秦可各个击破——破纵之策。", keywords: ["合纵", "约", "六国", "离散", "击破", "秦"] },
  { id: "zhangzi-zong-li", book: "张子", chapter: "战国策·连横", owner: "zhangyi", text: "事秦则得秦之援，背秦则招秦之兵——祸福在背向之间。", gloss: "事秦得秦援，背秦招秦兵，祸福在背向之间。", keywords: ["事秦", "背秦", "援", "兵", "祸", "福"] },
  { id: "zhangzi-zong-quan", book: "张子", chapter: "战国策·游说", owner: "zhangyi", text: "臣闻明主者，审时度势，不与强争，不与弱结无益之约。", gloss: "明主审时度势，不与强争锋，不与弱结无用之约。", keywords: ["明主", "时", "势", "强", "弱", "约", "连横"] },
  { id: "zhangzi-zong-shi", book: "张子", chapter: "战国策·游说", owner: "zhangyi", text: "秦之强，非六国之分所能抗也；分则必破，合则或存。", gloss: "秦之强非六国分裂所能抗；分则必破，合则或存——连横之理。", keywords: ["秦", "六国", "分", "合", "破", "存"] },
  { id: "zhangzi-zong-ji", book: "张子", chapter: "战国策·游说", owner: "zhangyi", text: "破纵之要，在于离其心、散其约、各个击之。", gloss: "破纵之要在离其心、散其约、各个击破。", keywords: ["破纵", "离", "散", "约", "击破", "连横"] },
  { id: "zhangzi-zong-quan-2", book: "张子", chapter: "战国策·游说", owner: "zhangyi", text: "张仪曰：吾以舌动天下，非以力胜——舌在则功在。", gloss: "张仪说：我以舌头搅动天下，非以力胜；舌在则功在。", keywords: ["张仪", "舌", "功", "纵横", "言", "力"] },

  // 张子补续（连横言策续，散见战国策·秦/韩/魏/楚/齐策）
  { id: "zhangzi-qince-3", book: "张子", chapter: "战国策·秦策", owner: "zhangyi", text: "秦之利在于破纵，纵破则六国各弱，秦得以并之。", gloss: "秦之利在破纵，纵破则六国各自削弱，秦可逐一吞并。", keywords: ["秦", "破纵", "六国", "弱", "并", "连横"] },
  { id: "zhangzi-qince-4", book: "张子", chapter: "战国策·秦策", owner: "zhangyi", text: "臣请为秦游说六国，使各自事秦，则纵约自解。", gloss: "请为秦游说六国各自事秦，则纵约自解。", keywords: ["秦", "游说", "六国", "事秦", "纵约", "解"] },
  { id: "zhangzi-hance-2", book: "张子", chapter: "战国策·韩策", owner: "zhangyi", text: "韩小而弱，秦大而强；事秦则受赏，抗秦则受兵。", gloss: "韩小弱、秦大强；事秦则得赏，抗秦则遭兵。", keywords: ["韩", "秦", "弱", "强", "事秦", "赏罚"] },
  { id: "zhangzi-hance-3", book: "张子", chapter: "战国策·韩策", owner: "zhangyi", text: "韩之事秦，非为义也，为势也——势所必至。", gloss: "韩事秦非为义，是为势——势所必至。", keywords: ["韩", "事秦", "势", "义", "连横", "必然"] },
  { id: "zhangzi-weice-3", book: "张子", chapter: "战国策·魏策", owner: "zhangyi", text: "魏居中原，四战之地，不事秦则四面受敌。", gloss: "魏居中原四战之地，不事秦则四面受敌。", keywords: ["魏", "中原", "四战", "事秦", "敌", "连横"] },
  { id: "zhangzi-weice-4", book: "张子", chapter: "战国策·魏策", owner: "zhangyi", text: "魏事秦则秦不伐魏，魏得息民修政以待时。", gloss: "魏事秦则秦不伐魏，魏可息民修政待时。", keywords: ["魏", "事秦", "伐", "息民", "修政", "时"] },
  { id: "zhangzi-chuce-2", book: "张子", chapter: "战国策·楚策", owner: "zhangyi", text: "楚与秦合则两强，楚与秦争则两伤。", gloss: "楚秦合则两强，楚秦争则两伤——劝楚合秦。", keywords: ["楚", "秦", "合", "争", "强", "伤"] },
  { id: "zhangzi-chuce-3", book: "张子", chapter: "战国策·楚策", owner: "zhangyi", text: "楚若从纵约而抗秦，秦必先伐楚以儆六国。", gloss: "楚若从纵约抗秦，秦必先伐楚以儆六国。", keywords: ["楚", "纵约", "抗秦", "伐", "儆", "连横"] },
  { id: "zhangzi-qice-2", book: "张子", chapter: "战国策·齐策", owner: "zhangyi", text: "齐负海而远秦，秦不能亲伐；然齐若从纵，秦必联燕赵以困齐。", gloss: "齐负海远秦，秦不能亲伐；但齐若从纵，秦必联燕赵困齐。", keywords: ["齐", "海", "秦", "纵", "燕", "赵", "困"] },
  { id: "zhangzi-qice-3", book: "张子", chapter: "战国策·齐策", owner: "zhangyi", text: "齐之事秦，非为臣也，为利也——利在则合。", gloss: "齐事秦非为称臣，是为利——利在则合。", keywords: ["齐", "事秦", "臣", "利", "合", "连横"] },
  { id: "zhangzi-zong-li-2", book: "张子", chapter: "战国策·连横", owner: "zhangyi", text: "连横之效：秦不费一兵而六国自至，此上策也。", gloss: "连横之效：秦不费一兵而六国自至，是上策。", keywords: ["连横", "秦", "六国", "上策", "不费兵", "效"] },
  { id: "zhangzi-zong-quan-3", book: "张子", chapter: "战国策·游说", owner: "zhangyi", text: "破纵不必用兵，以利离之、以势夺之、以言惑之而已。", gloss: "破纵不必用兵，以利离间、以势夺、以言惑即可。", keywords: ["破纵", "利", "势", "言", "离", "连横"] },

  // 惠子（惠施历物十事 + 辩者二十一事，散见庄子·天下）
  { id: "huizi-tongyi", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "万物毕同毕异，此之谓大同异。", gloss: "万物归根既全同又全异，这才是大同异——破分别之见。", keywords: ["同", "异", "名", "齐", "辩", "万物"] },
  { id: "huizi-rifang", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "日方中方睨，物方生方死。", gloss: "太阳刚到正中就已偏斜，万物刚生就将死——刹那生灭、无固定相。", keywords: ["历物", "中", "睨", "生", "死", "变", "相对"] },
  { id: "huizi-lianbi", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "大同而与小同异，此之谓小同异；万物毕同毕异，此之谓大同异。", gloss: "大同与小同的差异是小同异；万物全同全异才是大同异。", keywords: ["大同", "小同", "同异", "历物", "辩", "万物"] },
  { id: "huizi-wufang", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "南方无穷而有穷。", gloss: "南方既无穷又有穷——方位之极的辩证。", keywords: ["南方", "无穷", "有穷", "历物", "辩", "相对"] },
  { id: "huizi-jinri", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "今日适越而昔来。", gloss: "今天出发去越国却说是昨天到的——时空相对、名言之辩。", keywords: ["今日", "昔", "越", "时空", "历物", "辩"] },
  { id: "huizi-lianhuan", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "连环可解也。", gloss: "连环本可解——破固定之形，名实可离。", keywords: ["连环", "解", "历物", "名实", "辩", "形"] },
  { id: "huizi-tianxia", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "我知天下之中央，燕之北、越之南是也。", gloss: "天下的中央在燕国之北、越国之南——方位无穷、无定中。", keywords: ["中央", "燕", "越", "历物", "相对", "方位"] },
  { id: "huizi-fanai", book: "惠子", chapter: "历物·庄子天下", owner: "huishi", text: "泛爱万物，天地一体也。", gloss: "博爱万物，天地原是一个整体。", keywords: ["泛爱", "万物", "一体", "历物", "爱", "天地"] },
  { id: "huizi-bianzhe-1", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "卵有毛。", gloss: "蛋里有毛——因鸡能生毛，故毛已在卵中：推极名实之辩。", keywords: ["辩者", "卵", "毛", "名实", "辩", "历物"] },
  { id: "huizi-bianzhe-2", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "鸡三足。", gloss: "鸡有三只脚——两只实足加一“名足”：名实之辩。", keywords: ["辩者", "鸡", "三足", "名", "实", "辩"] },
  { id: "huizi-bianzhe-3", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "郢有天下。", gloss: "郢都里有天下——小可含大，空间相对。", keywords: ["辩者", "郢", "天下", "空间", "相对", "历物"] },
  { id: "huizi-bianzhe-4", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "犬可以为羊。", gloss: "狗可以叫作羊——名非固有，约定而已。", keywords: ["辩者", "犬", "羊", "名", "约定", "辩"] },
  { id: "huizi-bianzhe-5", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "马有卵。", gloss: "马有卵——胎生亦可名卵：破形名之定。", keywords: ["辩者", "马", "卵", "胎", "名", "辩"] },
  { id: "huizi-bianzhe-6", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "丁子有尾。", gloss: "丁子（虾蟆）有尾——蝌蚪之尾即其前身：名实流转。", keywords: ["辩者", "丁子", "尾", "蝌蚪", "名实", "辩"] },
  { id: "huizi-bianzhe-7", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "火不热。", gloss: "火不热——热是人之感，火本身无“热”之性：名实可离。", keywords: ["辩者", "火", "热", "感", "名实", "辩"] },
  { id: "huizi-bianzhe-8", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "山出口。", gloss: "山有口——山亦可生声如口：破形之定。", keywords: ["辩者", "山", "口", "形", "名", "辩"] },
  { id: "huizi-bianzhe-9", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "轮不蹍地。", gloss: "车轮不碾地——轮转瞬息离地，接触无定处：动之相对。", keywords: ["辩者", "轮", "地", "蹍", "动", "相对", "辩"] },
  { id: "huizi-bianzhe-10", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "目不见。", gloss: "眼睛不见——见须神明与光线，目本身不能独见：名实之辩。", keywords: ["辩者", "目", "见", "知", "名实", "辩"] },
  { id: "huizi-bianzhe-11", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "指不至，至不绝。", gloss: "指谓不能达物之实，即达亦不绝——名与实终有间隔。", keywords: ["辩者", "指", "至", "绝", "名实", "辩", "指物"] },
  { id: "huizi-bianzhe-12", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "龟长于蛇。", gloss: "龟比蛇长——以寿数论则龟长于蛇：度量相对。", keywords: ["辩者", "龟", "蛇", "长", "相对", "度量", "辩"] },
  { id: "huizi-bianzhe-13", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "矩不方，规不可以为圆。", gloss: "矩不能成绝对之方，规不能成绝对之圆——绝对名形不可得。", keywords: ["辩者", "矩", "规", "方", "圆", "名", "辩"] },
  { id: "huizi-bianzhe-14", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "凿不围枘。", gloss: "榫眼不能完全围住榫头——二者总有间隙：名实之离。", keywords: ["辩者", "凿", "枘", "围", "名实", "离", "辩"] },
  { id: "huizi-bianzhe-15", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "飞鸟之影未尝动也。", gloss: "飞鸟的影子未尝动——影是刹那刹新生灭，非同一影在动。", keywords: ["辩者", "飞鸟", "影", "动", "刹那", "辩"] },
  { id: "huizi-bianzhe-16", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "镞矢之疾，而有不行不止之时。", gloss: "飞箭虽快，却有既不行进也不停止的瞬间——动之辩证。", keywords: ["辩者", "镞矢", "疾", "不行", "不止", "动", "辩"] },
  { id: "huizi-bianzhe-17", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "狗非犬。", gloss: "狗不是犬——大小、名实之别：同名异物。", keywords: ["辩者", "狗", "犬", "名", "实", "辩"] },
  { id: "huizi-bianzhe-18", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "黄马骊牛三。", gloss: "黄马骊牛为三——马、牛、加之“色”合为三：名数之辩。", keywords: ["辩者", "黄马", "骊牛", "三", "名数", "辩"] },
  { id: "huizi-bianzhe-19", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "白狗黑。", gloss: "白狗是黑的——白狗之黑在于其目或影：名相对之辩。", keywords: ["辩者", "白狗", "黑", "相对", "名", "辩"] },
  { id: "huizi-bianzhe-20", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "孤驹未尝有母。", gloss: "孤驹从未有过母——既称孤驹则母已不在：名实之辩。", keywords: ["辩者", "孤驹", "母", "名实", "辩"] },
  { id: "huizi-bianzhe-21", book: "惠子", chapter: "辩者二十一事·庄子天下", owner: "huishi", text: "一尺之棰，日取其半，万世不竭。", gloss: "一尺长的杖每天取其一半，万世也取不完——物质的无限可分。", keywords: ["辩者", "棰", "半", "不竭", "无限", "分", "辩"] },
  { id: "huizi-tianxia-ping", book: "惠子", chapter: "天下·庄子", owner: "huishi", text: "惠施以此为大，观于天下而晓辩者，天下之辩者相与乐之。", gloss: "惠施以此为大道，观照天下而使辩者明白，天下辩者都乐于论之。", keywords: ["惠施", "辩者", "天下", "历物", "辩"] },
  { id: "huizi-tianxia-shu", book: "惠子", chapter: "天下·庄子", owner: "huishi", text: "惠施多方，其书五车，其道舛驳，其言也不中。", gloss: "惠施学识多方、著书五车，但其道驳杂、其言不中肯——庄子之评。", keywords: ["惠施", "五车", "多方", "驳", "历物", "天下"] },

  // 邹子（邹衍五德终始、大九州）
  { id: "zouzi-wude", book: "邹子", chapter: "五德终始", owner: "zou", text: "五德从所不胜，虞土、夏木、殷金、周火。", gloss: "五行相胜，各以德代：虞土、夏木、殷金、周火——受命代嬗之序。", keywords: ["五德", "五行", "相胜", "受命", "革命", "代", "火"] },
  { id: "zouzi-jiuzhou", book: "邹子", chapter: "大九州", owner: "zou", text: "中国外如赤县神州者九，乃所谓九州也。", gloss: "中国之外如赤县神州者还有九个，合起来才是真正的九州。", keywords: ["九州", "天下", "地理", "大", "世界", "赤县"] },

  // 邹子补（五德终始/大九州/主运/邹衍说，散见史记·孟子荀卿列传等）
  { id: "zouzi-wude-xiangsheng", book: "邹子", chapter: "五德终始", owner: "zou", text: "五行相胜：水胜火，火胜金，金胜木，木胜土，土胜水。", gloss: "五行相胜：水克火、火克金、金克木、木克土、土克水——循环相胜。", keywords: ["五德", "五行", "相胜", "水", "火", "金", "木", "土"] },
  { id: "zouzi-wude-shouming", book: "邹子", chapter: "五德终始", owner: "zou", text: "帝王之将兴也，天必先见祥乎下民。", gloss: "帝王将兴起时，天必先向民间显现祥瑞——受命之符。", keywords: ["五德", "受命", "祥瑞", "天", "兴", "符"] },
  { id: "zouzi-wude-huangdi", book: "邹子", chapter: "五德终始", owner: "zou", text: "黄帝得土德，黄龙地螾见；夏得木德，青龙止于郊。", gloss: "黄帝得土德则黄龙地螾现，夏得木德则青龙止郊——德之符应。", keywords: ["五德", "黄帝", "土", "夏", "木", "龙", "符应"] },
  { id: "zouzi-wude-tianxiao", book: "邹子", chapter: "五德终始", owner: "zou", text: "及水德之至，天先见水气胜，水气胜故其色尚黑。", gloss: "水德至时天先现水气胜，故崇尚黑色——色尚随德。", keywords: ["五德", "水", "黑", "色尚", "德", "符"] },
  { id: "zouzi-jiuzhou-shen", book: "邹子", chapter: "大九州", owner: "zou", text: "于是分判天下为九州，各有其域，所谓大九州也。", gloss: "于是分天下为九州，各有其域，即大九州。", keywords: ["九州", "天下", "域", "大", "地理"] },
  { id: "zouzi-jiuzhou-hai", book: "邹子", chapter: "大九州", owner: "zou", text: "于是有大瀛海环其外，天地之际焉。", gloss: "大九州之外有大瀛海环绕，那是天地的边际。", keywords: ["九州", "瀛海", "天地", "际", "大", "地理"] },
  { id: "zouzi-jiuzhou-chixian", book: "邹子", chapter: "大九州", owner: "zou", text: "赤县神州内自有九州，禹所序九州是也，不得为州数。", gloss: "赤县神州内自有九州（禹所序），这只是天下九州之一，不能算作大九州。", keywords: ["九州", "赤县", "神州", "禹", "大", "地理"] },
  { id: "zouzi-jiuzhou-ru", book: "邹子", chapter: "大九州", owner: "zou", text: "儒者所谓中国者，于天下乃八十一分居其一分耳。", gloss: "儒者所说的中国，在天下只占八十一分之一。", keywords: ["九州", "中国", "天下", "八十一", "大", "儒"] },
  { id: "zouzi-shiji-hong", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "邹衍睹有国者益淫侈，不能尚德……乃深观阴阳消息，而作怪迂之变。", gloss: "邹衍见诸侯淫侈不能尚德，乃深观阴阳消长，作怪迂之变以警世。", keywords: ["阴阳", "消息", "德", "诸侯", "变", "史记"] },
  { id: "zouzi-shiji-yan", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "其语闳大不经，必先验小物，推而大之，至于无垠。", gloss: "其说宏大不经，却先验小物而后推及无垠——邹衍推演之法。", keywords: ["验", "推", "大", "小", "无垠", "方法", "史记"] },
  { id: "zouzi-shiji-zhong", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "先序今以上至黄帝，学者所共术，大并世盛衰。", gloss: "先序当今上溯黄帝，为学者所共习，大抵随世代盛衰。", keywords: ["黄帝", "世代", "盛衰", "序", "史记", "史"] },
  { id: "zouzi-shiji-yin", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "因载其机祥度制，推而远之，至天地未生，窈冥不可考而原也。", gloss: "又载其机祥度制，推及天地未生之时，窈冥不可考原。", keywords: ["机祥", "天地", "未生", "窈冥", "推", "史记"] },
  { id: "zouzi-shiji-zhongguo", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "以为儒者所谓中国，于天下乃八十一分居其一分耳。中国名曰赤县神州。", gloss: "以为儒者所谓中国只占天下八十一分之一，中国名叫赤县神州。", keywords: ["中国", "赤县", "神州", "八十一", "天下", "史记"] },
  { id: "zouzi-shiji-zhu", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "王公大人初见其术，惧然顾化，其后不能行之。", gloss: "王公大人初见其术都惧然受化，但最终不能实行。", keywords: ["王公", "术", "惧", "化", "行", "史记"] },
  { id: "zouzi-shiji-yan-2", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "是以邹子重于齐。适梁，梁惠王郊迎，执宾主之礼。", gloss: "因此邹子在齐国受重用；到梁国，梁惠王郊迎行宾主之礼。", keywords: ["齐", "梁", "惠王", "迎", "礼", "史记"] },
  { id: "zouzi-shiji-zhao", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "适赵，平原君侧行撇席。", gloss: "到赵国，平原君侧身让席以示敬。", keywords: ["赵", "平原君", "敬", "礼", "史记"] },
  { id: "zouzi-shiji-yan-3", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "如燕，昭王拥彗先驱，请列弟子之座而受业。", gloss: "到燕国，燕昭王拥彗先驱，请列弟子之座而受业。", keywords: ["燕", "昭王", "弟子", "受业", "敬", "史记"] },
  { id: "zouzi-shiji-ji", book: "史记", chapter: "孟子荀卿列传", owner: "zou", text: "邹子其言虽不轨，傥亦有牛鼎之意乎？", gloss: "邹子之言虽不合规度，或许亦有牛鼎（经国）之意吧？", keywords: ["邹子", "言", "不轨", "牛鼎", "意", "史记"] },
  { id: "zouzi-yangyang", book: "邹子", chapter: "主运", owner: "zou", text: "主运之次，各以德相代，色尚随之。", gloss: "主运之序各以德相代，所尚之色随之。", keywords: ["主运", "德", "代", "色尚", "五德"] },
  { id: "zouzi-yinyang", book: "邹子", chapter: "阴阳", owner: "zou", text: "阴阳消息，四时递代，各有其候。", gloss: "阴阳消长，四季交替，各有其气候。", keywords: ["阴阳", "消息", "四时", "候", "代"] },
  { id: "zouzi-xiangsheng-xu", book: "邹子", chapter: "五德终始", owner: "zou", text: "土、木、金、火、水，五德终始，相代不穷。", gloss: "土木金火水五德终始相代，循环不穷。", keywords: ["五德", "终始", "土", "木", "金", "火", "水"] },
  { id: "zouzi-shengshuai", book: "邹子", chapter: "盛衰", owner: "zou", text: "随世盛衰，各顺其德，逆则不祥。", gloss: "随世代盛衰各顺其德，逆之则不祥。", keywords: ["盛衰", "德", "顺", "逆", "不祥"] },
  { id: "zouzi-fu", book: "邹子", chapter: "符应", owner: "zou", text: "德至则符应现：黄龙、青云、白虹、赤乌、玄冥，各如其德。", gloss: "德至则符应现：黄龙土、青云木、白虹金、赤乌火、玄冥水，各如其德。", keywords: ["符应", "黄龙", "青龙", "白虹", "赤乌", "玄冥", "五德"] },
  { id: "zouzi-zhuyun-zun", book: "邹子", chapter: "主运", owner: "zou", text: "尚其德则尊其色：土尚黄，木尚青，金尚白，火尚赤，水尚黑。", gloss: "崇尚其德则尊其色：土黄、木青、金白、火赤、水黑。", keywords: ["主运", "色尚", "黄", "青", "白", "赤", "黑"] },
  { id: "zouzi-tianxia-jiu", book: "邹子", chapter: "大九州", owner: "zou", text: "于天下乃八十一分居其一分，此盖大九州之一也。", gloss: "于天下只占八十一分之一，这是大九州之一。", keywords: ["九州", "八十一", "天下", "大", "地理"] },

  // 子思子（中庸相传出其手）
  { id: "zisi-zhongyong-xing", book: "子思子", chapter: "中庸", owner: "zisi", text: "天命之谓性，率性之谓道，修道之谓教。", gloss: "天赋叫做性，循性叫做道，修明道叫做教。", keywords: ["性", "道", "教", "天命", "诚", "中庸"] },
  { id: "zisi-zhongyong-zhonghe", book: "子思子", chapter: "中庸", owner: "zisi", text: "喜怒哀乐之未发，谓之中；发而皆中节，谓之和。", gloss: "情未发叫中，发而合度叫和——性情之正。", keywords: ["中", "和", "情", "节", "性", "中庸"] },
  { id: "zisi-zhongyong-boxue", book: "子思子", chapter: "中庸", owner: "zisi", text: "博学之，审问之，慎思之，明辨之，笃行之。", gloss: "广学、详问、慎思、明辨、笃行——为学次第。", keywords: ["学", "问", "思", "辨", "行", "诚", "中庸"] },

  // 子思子补（中庸·诚/慎独/中和/尊德性，至逾十五条）
  { id: "zisi-zhongyong-cheng", book: "子思子", chapter: "中庸", owner: "zisi", text: "诚者，天之道也；诚之者，人之道也。", gloss: "诚是天道，求诚是人道。", keywords: ["诚", "天", "人", "道", "中庸", "性"] },
  { id: "zisi-zhongyong-cheng-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "唯天下至诚，为能尽其性；能尽其性，则能尽人之性。", gloss: "唯天下至诚能尽己之性，能尽己之性则能尽人之性。", keywords: ["诚", "性", "尽", "天下", "中庸"] },
  { id: "zisi-zhongyong-cheng-3", book: "子思子", chapter: "中庸", owner: "zisi", text: "诚则形，形则著，著则明，明则动，动则变，变则化。", gloss: "诚就显现、显现就显著、显著就光明、光明就动人、动人就变化、变化就化成。", keywords: ["诚", "形", "著", "明", "动", "变", "化"] },
  { id: "zisi-zhongyong-cheng-4", book: "子思子", chapter: "中庸", owner: "zisi", text: "唯天下至诚为能化。", gloss: "只有天下至诚才能化成万物。", keywords: ["诚", "化", "天下", "至诚", "中庸"] },
  { id: "zisi-zhongyong-shendu", book: "子思子", chapter: "中庸", owner: "zisi", text: "莫见乎隐，莫显乎微，故君子慎其独也。", gloss: "没有比隐暗处更易显露的，没有比细微处更易显现的，故君子独处时必慎。", keywords: ["慎独", "隐", "微", "君子", "独", "中庸"] },
  { id: "zisi-zhongyong-shendu-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "君子戒慎乎其所不睹，恐惧乎其所不闻。", gloss: "君子在无人看见之处也戒慎，在无人听见之处也恐惧。", keywords: ["慎独", "戒慎", "恐惧", "不睹", "不闻", "君子"] },
  { id: "zisi-zhongyong-zhonghe-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "致中和，天地位焉，万物育焉。", gloss: "达到中和，天地各得其位，万物遂生。", keywords: ["中", "和", "天", "地", "万物", "育", "中庸"] },
  { id: "zisi-zhongyong-zunde", book: "子思子", chapter: "中庸", owner: "zisi", text: "故君子尊德性而道问学，致广大而尽精微。", gloss: "君子既尊崇德性又讲求问学，既致广大又尽精微。", keywords: ["尊德性", "问学", "广大", "精微", "君子", "中庸"] },
  { id: "zisi-zhongyong-zunde-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "极高明而道中庸。", gloss: "达到极高明却行中庸之道。", keywords: ["高明", "中庸", "道", "极", "君子"] },
  { id: "zisi-zhongyong-jing", book: "子思子", chapter: "中庸", owner: "zisi", text: "温故而知新，敦厚以崇礼。", gloss: "温习旧知而知新，以敦厚之心崇尚礼。", keywords: ["温故", "知新", "敦厚", "礼", "中庸", "学"] },
  { id: "zisi-zhongyong-zhi", book: "子思子", chapter: "中庸", owner: "zisi", text: "君子和而不流，强哉矫；中立而不倚，强哉矫。", gloss: "君子和顺而不随波逐流，真是强；中立而不偏倚，真是强。", keywords: ["和", "不流", "中立", "不倚", "强", "君子"] },
  { id: "zisi-zhongyong-wei", book: "子思子", chapter: "中庸", owner: "zisi", text: "天下之达道五，所以行之者三：曰君臣也、父子也、夫妇也、昆弟也、朋友之交也。", gloss: "天下通行的达道有五，行之者三：君臣、父子、夫妇、兄弟、朋友之交。", keywords: ["达道", "君臣", "父子", "夫妇", "昆弟", "朋友", "中庸"] },
  { id: "zisi-zhongyong-zhi-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "知仁勇三者，天下之达德也。", gloss: "智、仁、勇三者是天下通行的达德。", keywords: ["知", "仁", "勇", "达德", "天下", "中庸"] },
  { id: "zisi-zhongyong-shen", book: "子思子", chapter: "中庸", owner: "zisi", text: "君子动而世为天下道，行而世为天下法，言而世为天下则。", gloss: "君子的举动世代为天下准则，行为世代为天下法度，言语世代为天下榜样。", keywords: ["君子", "道", "法", "则", "天下", "世"] },
  { id: "zisi-zhongyong-peit", book: "子思子", chapter: "中庸", owner: "zisi", text: "配天配地，故君子之道，配天地之德。", gloss: "君子之道配天地之德。", keywords: ["配", "天", "地", "德", "君子", "中庸"] },
  // 子思补（中庸续采十二则，至逾三十条）
  { id: "zisi-zhongyong-chengshen", book: "子思子", chapter: "中庸", owner: "zisi", text: "诚身有道，不明乎善，不诚乎身矣。", gloss: "使自身诚有其道：不明善，就不能诚其身。", keywords: ["诚", "身", "善", "明", "道", "中庸"] },
  { id: "zisi-zhongyong-ming", book: "子思子", chapter: "中庸", owner: "zisi", text: "自诚明，谓之性；自明诚，谓之教。诚则明矣，明则诚矣。", gloss: "由诚而明是天性，由明而诚是教化；诚则明、明则诚。", keywords: ["诚", "明", "性", "教", "中庸"] },
  { id: "zisi-zhongyong-jiujing", book: "子思子", chapter: "中庸", owner: "zisi", text: "凡为天下国家有九经：修身也，尊贤也，亲亲也，敬大臣也，体群臣也，子庶民也，来百工也，柔远人也，怀诸侯也。", gloss: "治理天下国家有九经：修身、尊贤、亲亲、敬大臣、体群臣、子庶民、来百工、柔远人、怀诸侯。", keywords: ["九经", "修身", "贤", "亲", "大臣", "庶民", "百工", "诸侯", "治"] },
  { id: "zisi-zhongyong-jiujing-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "修身则道立，尊贤则不惑，亲亲则诸父昆弟不怨。", gloss: "修身则道立，尊贤则不惑，亲亲则诸父兄弟不怨。", keywords: ["修身", "道", "贤", "惑", "亲", "怨", "九经"] },
  { id: "zisi-zhongyong-jiujing-3", book: "子思子", chapter: "中庸", owner: "zisi", text: "来百工则财用足，柔远人则四方归之，怀诸侯则天下畏之。", gloss: "招来百工则财用足，安抚远人则四方归附，怀柔诸侯则天下敬畏。", keywords: ["百工", "财", "远人", "归", "诸侯", "天下", "九经"] },
  { id: "zisi-zhongyong-qian", book: "子思子", chapter: "中庸", owner: "zisi", text: "凡事豫则立，不豫则废。言前定则不跲，事前定则不困。", gloss: "凡事预则立，不预则废；言先定则不结巴，事先定则不困窘。", keywords: ["豫", "立", "废", "前定", "言", "事", "中庸"] },
  { id: "zisi-zhongyong-feiyin", book: "子思子", chapter: "中庸", owner: "zisi", text: "君子之道，费而隐。夫妇之愚，可以与知焉。", gloss: "君子之道广博而隐微；愚夫愚妇也能知其一二。", keywords: ["费", "隐", "夫妇", "愚", "知", "道", "中庸"] },
  { id: "zisi-zhongyong-feiyin-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "及其至也，虽圣人亦有所不能焉。天地之大也，人犹有所憾。", gloss: "到了极致，圣人也有所不能；天地如此广大，人仍有所憾。", keywords: ["至", "圣人", "不能", "天地", "憾", "道"] },
  { id: "zisi-zhongyong-bohou", book: "子思子", chapter: "中庸", owner: "zisi", text: "博厚，所以载物也；高明，所以覆物也；悠久，所以成物也。", gloss: "广博深厚所以载物，高大光明所以覆物，悠远长久所以成物。", keywords: ["博厚", "高明", "悠久", "载", "覆", "成", "物", "天地"] },
  { id: "zisi-zhongyong-bohou-2", book: "子思子", chapter: "中庸", owner: "zisi", text: "博厚配地，高明配天，悠久无疆。", gloss: "广博深厚配地，高明配天，悠远无疆。", keywords: ["博厚", "地", "高明", "天", "悠久", "无疆"] },
  { id: "zisi-zhongyong-weijing", book: "子思子", chapter: "中庸", owner: "zisi", text: "唯天下至诚，为能经纶天下之大经，立天下之大本，知天地之化育。", gloss: "唯天下至诚能经纶天下大经、立天下大本、知天地化育。", keywords: ["至诚", "经纶", "大经", "大本", "化育", "天地"] },
  { id: "zisi-zhongyong-zhichi", book: "子思子", chapter: "中庸", owner: "zisi", text: "故至诚无息，不息则久，久则征，征则悠远，悠远则博厚，博厚则高明。", gloss: "至诚无息，不息则久，久则见效验，验则悠远，悠远则博厚，博厚则高明。", keywords: ["至诚", "无息", "久", "征", "博厚", "高明", "诚"] },

  // 商鞅《商君书》——法家耕战、任法不任人、重刑少赏
  { id: "shangjun-gengfa-1", book: "商君书", chapter: "更法", owner: "shangyang", text: "治世不一道，便国不法古。", gloss: "治国不必拘一道，利国不必法古制。", keywords: ["变法", "法古", "治世", "便国", "革新", "制度"] },
  { id: "shangjun-gengfa-2", book: "商君书", chapter: "更法", owner: "shangyang", text: "法者所以爱民也，礼者所以便事也。是以圣人苟可以强国，不法其故；苟可以利民，不循其礼。", gloss: "法为爱民、礼为便事；圣人强国不法旧、利民不循礼。", keywords: ["法", "礼", "爱民", "强国", "利民", "变法", "圣人"] },
  { id: "shangjun-gengfa-3", book: "商君书", chapter: "更法", owner: "shangyang", text: "疑行无成，疑事无功。", gloss: "行动迟疑则无成，做事迟疑则无功。", keywords: ["疑", "行", "成", "功", "决断", "变法"] },
  { id: "shangjun-gengfa-4", book: "商君书", chapter: "更法", owner: "shangyang", text: "愚者暗于成事，知者见于未萌。", gloss: "愚者事成之后仍不明白，智者事发之前已能预见。", keywords: ["愚", "知", "成事", "未萌", "先见", "智"] },
  { id: "shangjun-nongzhan-1", book: "商君书", chapter: "农战", owner: "shangyang", text: "国之所以兴者，农战也。", gloss: "国家兴盛靠的是农耕与战争。", keywords: ["农战", "耕战", "兴", "国", "富强"] },
  { id: "shangjun-nongzhan-2", book: "商君书", chapter: "农战", owner: "shangyang", text: "善为国者，仓廪虽满，不偷于农。", gloss: "善治国者，即便粮仓充实，也不怠慢农耕。", keywords: ["农", "仓廪", "治国", "本业", "耕战"] },
  { id: "shangjun-quqiang-1", book: "商君书", chapter: "去强", owner: "shangyang", text: "国以善民治淫民者，必强至王；以淫民治善民者，必削至亡。", gloss: "以良民治奸民则强至称王，以奸民治良民则削至亡国。", keywords: ["治", "民", "强", "削", "王", "亡", "善", "淫"] },
  { id: "shangjun-quqiang-2", book: "商君书", chapter: "去强", owner: "shangyang", text: "重刑少赏，上爱民，民死赏；多赏轻刑，上不爱民，民不死赏。", gloss: "重刑少赏才是爱民，民肯为赏死战；多赏轻刑是不爱民，民不肯死战。", keywords: ["重刑", "少赏", "爱民", "死赏", "赏罚"] },
  { id: "shangjun-kaisai-1", book: "商君书", chapter: "开塞", owner: "shangyang", text: "圣人不法古，不修今。法古则后于时，修今则塞于势。", gloss: "圣人不效法古、不囿于今；法古则落后于时势，修今则受塞于时势。", keywords: ["法古", "修今", "时势", "变法", "圣人"] },
  { id: "shangjun-kaisai-2", book: "商君书", chapter: "开塞", owner: "shangyang", text: "治国刑多而赏少，故王者刑九而赏一，削国赏九而刑一。", gloss: "治国刑多赏少，故王者刑九赏一；削国反是，赏九刑一。", keywords: ["刑", "赏", "治国", "王", "削", "重刑"] },
  { id: "shangjun-jinling-1", book: "商君书", chapter: "靳令", owner: "shangyang", text: "以刑去刑，国治；以刑致刑，国乱。", gloss: "以刑去刑则国治，以刑致刑则国乱。", keywords: ["刑", "治", "乱", "去刑", "法治"] },
  { id: "shangjun-zhanfa-1", book: "商君书", chapter: "战法", owner: "shangyang", text: "凡战法必本于政胜。", gloss: "一切战法根本在于政治上胜过敌方。", keywords: ["战法", "政胜", "兵", "政", "本"] },
  { id: "shangjun-xiuquan-1", book: "商君书", chapter: "修权", owner: "shangyang", text: "国之所以治者三：一曰法，二曰信，三曰权。", gloss: "治国三要素：一是法，二是信，三是权。", keywords: ["法", "信", "权", "治国", "三要素"] },
  { id: "shangjun-xiuquan-2", book: "商君书", chapter: "修权", owner: "shangyang", text: "法者，国之权衡也。", gloss: "法是国家的秤砣与尺度。", keywords: ["法", "权衡", "尺度", "国", "标准"] },
  { id: "shangjun-huace-1", book: "商君书", chapter: "画策", owner: "shangyang", text: "国皆有法，而无使法必行之法。", gloss: "各国都有法，却没有能使法必行之法。", keywords: ["法", "行法", "执行", "制度"] },
  { id: "shangjun-huace-2", book: "商君书", chapter: "画策", owner: "shangyang", text: "圣王者不贵义而贵法，法必明，令必行，则已矣。", gloss: "圣王不贵义而贵法，法明令行即可。", keywords: ["法", "义", "明法", "令行", "圣王"] },
  { id: "shangjun-junchen-1", book: "商君书", chapter: "君臣", owner: "shangyang", text: "明主之治天下也，缘法而治，按功而赏。", gloss: "明主治天下，依法而治、按功而赏。", keywords: ["法", "功", "赏", "治", "明主"] },
  { id: "shangjun-junchen-2", book: "商君书", chapter: "君臣", owner: "shangyang", text: "民之求官爵，皆以农战而已。", gloss: "百姓求取官爵，都只能靠农耕与作战。", keywords: ["官爵", "农战", "耕战", "民", "赏"] },
  { id: "shangjun-dingfen-1", book: "商君书", chapter: "定分", owner: "shangyang", text: "法令者，民之命也，为治之本也。", gloss: "法令是百姓的性命，是治国的根本。", keywords: ["法令", "民命", "治本", "法"] },
  { id: "shangjun-ruomin-1", book: "商君书", chapter: "弱民", owner: "shangyang", text: "民弱国强，国强民弱。故有道之国，务在弱民。", gloss: "民弱则国强，国强则民弱；故有道之国务在弱民。", keywords: ["弱民", "强国", "民", "国", "治道"] },
  { id: "shangjun-jingnei-1", book: "商君书", chapter: "境内", owner: "shangyang", text: "能得甲首一者，赏爵一级，益田一顷，益宅九亩。", gloss: "能斩敌甲首一颗的，赏爵一级、加田一顷、加宅九亩。", keywords: ["军功", "爵", "赏", "田", "耕战", "激励"] },
  { id: "shangjun-yiyan-1", book: "商君书", chapter: "壹言", owner: "shangyang", text: "治国能抟民力而壹民务者，强；能壹事本而禁末者，富。", gloss: "治国能聚合民力、专一民务则强，能专本业、禁末业则富。", keywords: ["壹", "民力", "本业", "末业", "富强"] },
  { id: "shangjun-jinshi-1", book: "商君书", chapter: "禁使", owner: "shangyang", text: "赏厚而信，罚重而必，不失疏远，不违亲近。", gloss: "赏要厚而守信，罚要重而必行，不漏疏远、不偏亲近。", keywords: ["赏", "罚", "信", "必", "公平", "赏罚"] },
  { id: "shangjun-shangxing-1", book: "商君书", chapter: "赏刑", owner: "shangyang", text: "壹赏则兵无敌，壹刑则令行，壹教则下听上。", gloss: "赏出一孔则兵无敌，刑出一孔则令行，教出一孔则民听上。", keywords: ["壹赏", "壹刑", "壹教", "无敌", "令行"] },
  { id: "shangjun-shangxing-2", book: "商君书", chapter: "赏刑", owner: "shangyang", text: "利出一孔者，其国无敌；出二孔者，其兵半用；出三孔四孔者，其国必亡。", gloss: "利出一孔则国无敌，出二孔则兵半用，出三四孔则国必亡。", keywords: ["利出一孔", "壹", "国", "无敌", "亡"] },
  { id: "shangjun-kenling-1", book: "商君书", chapter: "垦令", owner: "shangyang", text: "使民无得擅徙，则诛愚乱农之民无所于食，而必农。", gloss: "使百姓不得擅自迁居，则游惰乱农之民无处觅食，必归农耕。", keywords: ["垦令", "农", "徙", "游民", "本业"] },

  // 孙膑——《孙膑兵法》残简（银雀山汉简）+《史记·孙子吴起列传》载其事 +《战国策》
  { id: "sunbin-jianwei-1", book: "孙膑兵法", chapter: "见威王", owner: "sunbin", text: "战胜，则所以在亡国而继绝世也。战不胜，则所以削地而危社稷也。", gloss: "战胜可存亡继绝，战不胜则削地危社稷——故不可轻战。", keywords: ["战胜", "战不胜", "社稷", "削地", "兵", "亡国"] },
  { id: "sunbin-jianwei-2", book: "孙膑兵法", chapter: "见威王", owner: "sunbin", text: "战胜而强立，故天下服矣。", gloss: "战胜而强立，则天下归服。", keywords: ["战胜", "强立", "天下", "服"] },
  { id: "sunbin-cuanzu-1", book: "孙膑兵法", chapter: "篡卒", owner: "sunbin", text: "兵之胜在于篡卒，其勇在于制，其巧在于势，其利在于信，其德在于道。", gloss: "取胜在于选卒，勇敢在于制度，巧妙在于形势，锐利在于信赏，德行在于道。", keywords: ["篡卒", "勇", "制", "势", "信", "道", "胜"] },
  { id: "sunbin-cuanzu-2", book: "孙膑兵法", chapter: "篡卒", owner: "sunbin", text: "德行者，兵之厚积也；信者，兵之明赏也。", gloss: "德行是军队的厚积，信是军队的明赏。", keywords: ["德行", "信", "赏", "兵"] },
  { id: "sunbin-bazhen-1", book: "孙膑兵法", chapter: "八阵", owner: "sunbin", text: "用八阵战者，因地之利，用八阵之宜。", gloss: "用八阵作战，要因地制宜、用八阵之宜。", keywords: ["八阵", "地", "利", "阵法", "兵"] },
  { id: "sunbin-bazhen-2", book: "孙膑兵法", chapter: "八阵", owner: "sunbin", text: "易则多其车，险则多其骑，厄则多其弩。", gloss: "平地多用战车，险地多用骑兵，狭厄多用弩兵。", keywords: ["地形", "车", "骑", "弩", "阵", "兵"] },
  { id: "sunbin-shibei-1", book: "孙膑兵法", chapter: "势备", owner: "sunbin", text: "凡兵之道四：曰阵，曰势，曰变，曰权。察此四者，所以破强敌、取猛将也。", gloss: "用兵之道有四：阵、势、变、权；察此四者，可破强敌、取猛将。", keywords: ["阵", "势", "变", "权", "兵道", "破敌"] },
  { id: "sunbin-yuezhan-1", book: "孙膑兵法", chapter: "月战", owner: "sunbin", text: "间于天地之间，莫贵于人。", gloss: "天地之间，没有比人更宝贵的。", keywords: ["人", "天地", "贵", "兵"] },
  { id: "sunbin-qinpangjuan", book: "孙膑兵法", chapter: "擒庞涓", owner: "sunbin", text: "孙子弗息而击之桂陵，而擒庞涓。", gloss: "孙膑不停歇地追击，于桂陵擒获庞涓。", keywords: ["桂陵", "庞涓", "擒", "战"] },
  { id: "sunbin-shizhen", book: "孙膑兵法", chapter: "十阵", owner: "sunbin", text: "凡阵有十：方阵、圆阵、疏阵、数阵、锥行之阵、雁行之阵、钩行之阵、玄襄之阵、火阵、水阵。", gloss: "阵法共十种：方、圆、疏、数、锥行、雁行、钩行、玄襄、火、水。", keywords: ["阵法", "十阵", "方", "圆", "兵"] },
  { id: "sunbin-shiji-bin", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "庞涓既事魏，得为惠王将军，而自以为能不及孙膑，阴使召孙膑至，则以法刑断其两足而黥之。", gloss: "庞涓仕魏为将，自愧不如孙膑，暗召其至魏，施以断足膑刑与黥刑。", keywords: ["庞涓", "膑刑", "黥", "忌", "师兄弟"] },
  { id: "sunbin-shiji-saima", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "以君之下驷与彼上驷，取君上驷与彼中驷，取君中驷与彼下驷。", gloss: "田忌赛马：以下对上、上对中、中对下，三局两胜。", keywords: ["赛马", "下驷", "上驷", "谋略", "以弱胜强", "田忌"] },
  { id: "sunbin-shiji-pikang", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "夫解杂乱纷纠者不控卷，救斗者不搏撠，批亢捣虚，形格势禁，则自为解耳。", gloss: "解乱不硬拉、救斗不硬打；批亢捣虚、形格势禁，则自解——围魏救赵之理。", keywords: ["批亢捣虚", "形格势禁", "救赵", "虚实", "势"] },
  { id: "sunbin-shiji-jianzao-1", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "使齐军入魏地为十万灶，明日为五万灶，又明日为三万灶。", gloss: "使齐军入魏境日减灶数（十万→五万→三万），示弱诱敌。", keywords: ["减灶", "示弱", "诱敌", "马陵", "谋略"] },
  { id: "sunbin-shiji-jianzao-2", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "我固知齐军怯，入吾地三日，士卒亡者过半矣。", gloss: "庞涓误判：齐军怯懦，入魏三日士卒逃过半（实为减灶诱敌之计）。", keywords: ["减灶", "误判", "怯", "士卒", "马陵"] },
  { id: "sunbin-shiji-maling-1", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "乃斫大树白而书之曰：庞涓死于此树之下。", gloss: "马陵道削去树皮白书「庞涓死于此树之下」，诱其夜至举火而伏。", keywords: ["马陵", "庞涓", "树", "伏击"] },
  { id: "sunbin-shiji-maling-2", book: "史记", chapter: "孙子吴起列传", owner: "sunbin", text: "孙子度其行，暮当至马陵。马陵道狭，而旁多阻隘，可伏兵。", gloss: "孙膑测算庞涓行军，暮当至马陵；马陵道狭多阻隘，可设伏兵。", keywords: ["马陵", "伏兵", "地利", "度"] },
  { id: "sunbin-zhanguo-1", book: "战国策", chapter: "齐策", owner: "sunbin", text: "田忌为将，孙子为师，居辎车中，坐为计谋。", gloss: "田忌为将、孙膑为军师，居辎车中坐而谋划。", keywords: ["军师", "辎车", "谋", "田忌"] },

  // 列子《列子》（《冲虚真经》）——道家贵虚、顺物无为，寓言瑰丽
  { id: "liezi-tianrui-1", book: "列子", chapter: "天瑞", owner: "liezi", text: "天地无全功，万物无全用，人无全能。", gloss: "天地没有完美的功绩，万物没有全能的用处，人没有全能的本事。", keywords: ["天瑞", "虚", "全", "道", "天地", "万物"] },
  { id: "liezi-tianrui-2", book: "列子", chapter: "天瑞", owner: "liezi", text: "运转亡已，天地密移，畴觉之哉。", gloss: "天地运转不停、暗中迁移，谁能察觉呢？", keywords: ["天地", "移", "化", "道", "运转"] },
  { id: "liezi-tangwen-yugong", book: "列子", chapter: "汤问", owner: "liezi", text: "虽我之死，有子存焉；子又生孙，孙又生子；子子孙孙无穷匮也，而山不加增，何苦而不平？", gloss: "我虽死还有儿子，子生孙、孙生子，子孙无穷而山不再增高，何愁铲不平？——愚公移山。", keywords: ["愚公", "移山", "志", "恒", "子孙"] },
  { id: "liezi-tangwen-qiren", book: "列子", chapter: "汤问", owner: "liezi", text: "杞国有人忧天地崩坠，身亡所寄，废寝食者。", gloss: "杞国有人担忧天地崩塌、身无所托，废寝忘食——杞人忧天。", keywords: ["杞人", "忧天", "天地", "忧", "虚"] },
  { id: "liezi-tangwen-liangxiaoer", book: "列子", chapter: "汤问", owner: "liezi", text: "孔子东游，见两小儿辩斗，问其故……孔子不能决也。", gloss: "孔子东游见两小儿辩日，问其故，孔子也不能决断——两小儿辩日。", keywords: ["两小儿", "辩日", "孔子", "知", "虚"] },
  { id: "liezi-huangdi-chengfeng", book: "列子", chapter: "黄帝", owner: "liezi", text: "心凝形释，骨肉都融，不觉形之所倚，足之所履，随风东西，犹木叶干壳。", gloss: "心神凝定、形骸消融，不觉身之所倚足之所履，随风东西如落叶——列子御风。", keywords: ["御风", "虚", "乘风", "化", "道", "顺物"] },
  { id: "liezi-huangdi-qilu", book: "列子", chapter: "黄帝", owner: "liezi", text: "歧路之中又有歧焉，吾不知所之，所以反也。", gloss: "歧路之中又有歧路，不知往哪走，所以返回——歧路亡羊。", keywords: ["歧路", "亡羊", "选择", "学", "惑"] },
  { id: "liezi-huangdi-ouniao", book: "列子", chapter: "黄帝", owner: "liezi", text: "海上之人好鸥鸟……明日之海上，鸥鸟舞而不下也。", gloss: "海上有人好鸥鸟，鸥鸟与之游；起了捕捉的机心，鸥鸟便舞而不下——机心一起，鸟亦知之。", keywords: ["鸥鸟", "机心", "诚", "自然", "虚"] },
  { id: "liezi-tangwen-boyin", book: "列子", chapter: "汤问", owner: "liezi", text: "伯牙善鼓琴，钟子期善听。伯牙鼓琴，志在登高山，钟子期曰：善哉，峨峨兮若泰山！", gloss: "伯牙善弹琴、钟子期善听；伯牙志在高山，子期赞峨峨若泰山——知音。", keywords: ["伯牙", "子期", "知音", "琴", "高山流水"] },
  { id: "liezi-shuofu-yifu", book: "列子", chapter: "说符", owner: "liezi", text: "人有亡鈇者，意其邻之子……亡鈇，意其邻之子，动作态度，无似窃鈇者。", gloss: "有人丢了斧头，疑心邻居之子；斧头找到后，再看邻居之子，动作态度都不像偷斧的——疑邻盗斧。", keywords: ["疑", "邻", "斧", "成见", "主观"] },
  { id: "liezi-shuofu-juejin", book: "列子", chapter: "说符", owner: "liezi", text: "昔齐人有欲金者，清旦衣冠而之市，适鬻金者之所，因攫其金而去。", gloss: "齐人欲金，清早衣冠入市，径直抢了金子就走——利欲熏心，不见人——齐人攫金。", keywords: ["攫金", "利", "贪", "欲"] },
  { id: "liezi-liming-1", book: "列子", chapter: "力命", owner: "liezi", text: "力谓命曰：若之功奚若我哉？", gloss: "力对命说：你的功绩怎能比得上我？——力命之辩。", keywords: ["力", "命", "辩", "道"] },
  { id: "liezi-tangwen-jun", book: "列子", chapter: "汤问", owner: "liezi", text: "均，天下之至理也，连于形物亦然。", gloss: "均平是天下至理，形物亦然。", keywords: ["均", "至理", "道", "虚"] },

  // 杨朱——无专书，其言散见《孟子》《列子·杨朱》《吕氏春秋》《韩非子》（引见载之书）
  { id: "yangzhu-mengzi-jinxin", book: "孟子", chapter: "尽心上", owner: "yangzhu", text: "杨子取为我，拔一毛而利天下，不为也。", gloss: "杨朱主张为我，拔一根汗毛而利天下，他也不肯。", keywords: ["为我", "一毛", "拔毛", "贵己", "重生"] },
  { id: "yangzhu-mengzi-tengwengong", book: "孟子", chapter: "滕文公下", owner: "yangzhu", text: "杨朱墨翟之言盈天下，天下之言不归杨，则归墨。", gloss: "杨朱、墨翟之言充斥天下，天下言论不归杨便归墨。", keywords: ["杨朱", "墨翟", "盈天下", "言"] },
  { id: "yangzhu-mengzi-jinxin-2", book: "孟子", chapter: "尽心下", owner: "yangzhu", text: "逃墨必归于杨，逃杨必归于儒。", gloss: "逃离墨子之学必归于杨朱，逃离杨朱必归于儒家。", keywords: ["逃", "归", "杨", "墨", "儒"] },
  { id: "yangzhu-liezi-yangzhu-1", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "古之人损一毫利天下不与也，悉天下奉一身不取也。人人不损一毫，人人不利天下，天下治矣。", gloss: "古人不肯损一毫利天下，也不肯取天下奉一身；人人不损一毫、不利天下，天下就治了——杨朱为我之旨。", keywords: ["损一毫", "奉一身", "为我", "天下治", "贵己"] },
  { id: "yangzhu-liezi-yangzhu-2", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "生民之不得休息，为四事故：一为寿，二为名，三为位，四为货。", gloss: "人不得安息，因四件事：求寿、求名、求位、求财。", keywords: ["寿", "名", "位", "货", "生", "累"] },
  { id: "yangzhu-liezi-yangzhu-3", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "太古之人知生之暂来，知死之暂往。", gloss: "太古之人懂得生是暂来、死是暂往。", keywords: ["生", "死", "暂", "太古", "全性"] },
  { id: "yangzhu-liezi-yangzhu-4", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "丰屋美服，厚味姣色，有此四者，何求而不得？", gloss: "华屋、美服、美味、美色，有此四者，还有什么求而不得？", keywords: ["丰屋", "美服", "厚味", "姣色", "欲", "重生"] },
  { id: "yangzhu-liezi-yangzhu-5", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "万物所异者生也，所同者死也。", gloss: "万物相异在于生，相同在于死。", keywords: ["生", "死", "万物", "异", "同"] },
  { id: "yangzhu-liezi-yangzhu-6", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "生相怜，死相捐。", gloss: "活着互相怜惜，死了便相弃。", keywords: ["生", "死", "怜", "捐"] },
  { id: "yangzhu-liezi-yangzhu-7", book: "列子", chapter: "杨朱", owner: "yangzhu", text: "百年，寿之大齐，得百年者千无一焉。", gloss: "百年是寿命的大限，能活百年的千人中无一。", keywords: ["百年", "寿", "生", "重生"] },
  { id: "yangzhu-lvshi-buyi", book: "吕氏春秋", chapter: "不二", owner: "yangzhu", text: "杨生贵己。", gloss: "杨朱贵己——以保全自身为贵。", keywords: ["杨朱", "贵己", "为我", "重生"] },
  { id: "yangzhu-hanfei-xianxue", book: "韩非子", chapter: "显学", owner: "yangzhu", text: "不以天下大利易其胫一毛，世主必从而礼之，以为轻物重生之士也……此杨朱之意也。", gloss: "不以天下大利换他腿上一根毛，人君反礼敬为轻物重生之士——此杨朱之意。", keywords: ["一毛", "大利", "杨朱", "胫", "轻物", "重生"] },

  // 许行——农家代表，无专书，其事见《孟子·滕文公上》（引见载之书 + 汉书/吕氏论农家）
  { id: "xuhsing-mengzi-tengwengong-1", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "有为神农之言者许行，自楚之滕，踵门而告文公曰：远方之人闻君行仁政，愿受一廛而为氓。", gloss: "有习神农之学的许行，从楚到滕，对文公说：远方之人闻君行仁政，愿受一宅为氓。", keywords: ["许行", "神农之言", "楚", "滕", "氓", "农"] },
  { id: "xuhsing-mengzi-tengwengong-2", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "其徒数十人，皆衣褐，捆屦织席以为食。", gloss: "许行徒弟数十人，都穿粗褐，编鞋织席为生。", keywords: ["徒", "衣褐", "捆屦", "织席", "农", "躬耕"] },
  { id: "xuhsing-mengzi-tengwengong-3", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "贤者与民并耕而食，饔飧而治。今也滕有仓廪府库，则是厉民而以自养也，恶得贤？", gloss: "贤者应与民并耕而食、自炊而治；如今滕有仓廪府库，是剥削民以自养，怎能算贤？——许行并耕之旨。", keywords: ["并耕", "饔飧", "仓廪", "厉民", "贤", "农"] },
  { id: "xuhsing-mengzi-tengwengong-4", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "从许子之道，则市贾不贰，国中无伪。", gloss: "依许子之道，则市价不二、国中无伪。", keywords: ["市贾", "不贰", "无伪", "价", "农"] },
  { id: "xuhsing-mengzi-tengwengong-5", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "布帛长短同，则贾相若；麻缕丝絮轻重同，则贾相若；五谷多寡同，则贾相若；屦大小同，则贾相若。", gloss: "布帛长短同则价同，麻絮轻重同则价同，五谷多寡同则价同，鞋大小同则价同——许行的统一价格观。", keywords: ["布帛", "麻缕", "五谷", "屦", "贾", "同", "市贾"] },
  { id: "xuhsing-mengzi-tengwengong-6", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "许子必种粟而后食乎？曰：然。", gloss: "许子必种粟而后食吗？答：是。", keywords: ["种粟", "食", "农", "躬耕"] },
  { id: "xuhsing-mengzi-tengwengong-7", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "许子衣褐，许子冠素……许子以釜甑爨，以铁耕乎？曰：然。", gloss: "许子穿粗褐、戴素冠，用釜甑做饭、用铁器耕地吗？答：是。", keywords: ["衣褐", "冠素", "釜甑", "铁耕", "百工", "农"] },
  { id: "xuhsing-mengzi-tengwengong-8", book: "孟子", chapter: "滕文公上", owner: "xuhsing", text: "以粟易械器者，不为厉陶冶；陶冶亦以其械器易粟者，岂为厉农夫哉？", gloss: "用粟换械器不算剥削陶冶，陶冶用械器换粟也不算剥削农夫——百工与农交换各得其宜。", keywords: ["粟", "械器", "易", "陶冶", "交换", "百工"] },
  { id: "xuhsing-hanshu-yiwenzhi", book: "汉书", chapter: "艺文志", owner: "xuhsing", text: "农家者流，盖出于农稷之官，播百谷，劝耕桑，以足衣食。", gloss: "农家出于农稷之官，播种百谷、劝勉耕桑，以足衣食——班固论农家。", keywords: ["农家", "农稷", "百谷", "耕桑", "衣食"] },
  { id: "xuhsing-lvshi-shangnong", book: "吕氏春秋", chapter: "上农", owner: "xuhsing", text: "古先圣王之所以导其民者，先务于农。民农非徒为地利也，贵其志也。", gloss: "古圣王导民，先务农；民务农不仅为地利，更贵在其志——农本。", keywords: ["农", "务农", "地利", "志", "农本"] },

  // 曾子——《论语》载曾子言 +《大学》《孝经》（相传曾子述作）
  { id: "zengzi-lunyu-xueer-1", book: "论语", chapter: "学而", owner: "zengzi", text: "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？", gloss: "我每日三次反省自身：为人谋事是否尽心？与友交往是否守信？所传之道是否温习？", keywords: ["省", "忠", "信", "习", "修身"] },
  { id: "zengzi-lunyu-xueer-2", book: "论语", chapter: "学而", owner: "zengzi", text: "慎终追远，民德归厚矣。", gloss: "慎重办理父母丧事、追念远祖，民德就会归于淳厚。", keywords: ["慎终", "追远", "民德", "孝"] },
  { id: "zengzi-lunyu-taibo-1", book: "论语", chapter: "泰伯", owner: "zengzi", text: "士不可以不弘毅，任重而道远。仁以为己任，不亦重乎？死而后已，不亦远乎？", gloss: "士不可不弘大坚毅，因任重道远：以仁为己任，不重吗？死而后已，不远吗？", keywords: ["士", "弘毅", "任重", "道远", "仁"] },
  { id: "zengzi-lunyu-taibo-2", book: "论语", chapter: "泰伯", owner: "zengzi", text: "可以托六尺之孤，可以寄百里之命，临大节而不可夺也——君子人与？君子人也。", gloss: "可托幼主、可寄国命，临大节而不改其志——这是君子吗？是君子。", keywords: ["托孤", "寄命", "大节", "君子"] },
  { id: "zengzi-lunyu-taibo-3", book: "论语", chapter: "泰伯", owner: "zengzi", text: "鸟之将死，其鸣也哀；人之将死，其言也善。", gloss: "鸟将死鸣声哀切，人将死言语善良。", keywords: ["鸟", "死", "哀", "善", "言"] },
  { id: "zengzi-lunyu-liyong", book: "论语", chapter: "里仁", owner: "zengzi", text: "夫子之道，忠恕而已矣。", gloss: "夫子之道，不过是忠恕二字罢了。", keywords: ["夫子", "道", "忠恕", "仁"] },
  { id: "daxue-1", book: "大学", chapter: "经一章", owner: "zengzi", text: "大学之道，在明明德，在亲民，在止于至善。", gloss: "大学之道在于彰明美德、亲爱民众、止于至善——三纲领。", keywords: ["大学", "明德", "亲民", "至善", "三纲"] },
  { id: "daxue-2", book: "大学", chapter: "经一章", owner: "zengzi", text: "知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。", gloss: "知止而后有定、定而后能静、静而后能安、安而后能虑、虑而后能得。", keywords: ["止", "定", "静", "安", "虑", "得", "修身"] },
  { id: "daxue-3", book: "大学", chapter: "经一章", owner: "zengzi", text: "物有本末，事有终始，知所先后，则近道矣。", gloss: "物有本末、事有终始，知其先后就近道了。", keywords: ["本末", "终始", "先后", "道"] },
  { id: "daxue-4", book: "大学", chapter: "经一章", owner: "zengzi", text: "欲明明德于天下者，先治其国；欲治其国者，先齐其家；欲齐其家者，先修其身；欲修其身者，先正其心；欲正其心者，先诚其意；欲诚其意者，先致其知；致知在格物。", gloss: "欲明德于天下先治国，治国先齐家，齐家先修身，修身先正心，正心先诚意，诚意先致知，致知在格物——八条目。", keywords: ["治国", "齐家", "修身", "正心", "诚意", "致知", "格物", "八目"] },
  { id: "daxue-5", book: "大学", chapter: "经一章", owner: "zengzi", text: "身修而后家齐，家齐而后国治，国治而后天下平。", gloss: "身修而后家齐，家齐而后国治，国治而后天下平。", keywords: ["修身", "齐家", "治国", "平天下"] },
  { id: "daxue-6", book: "大学", chapter: "诚意", owner: "zengzi", text: "所谓诚其意者，毋自欺也，如恶恶臭，如好好色。", gloss: "诚意就是不自欺，如厌恶恶臭、喜好美色一般真切。", keywords: ["诚意", "毋自欺", "慎独", "修身"] },
  { id: "daxue-7", book: "大学", chapter: "诚意", owner: "zengzi", text: "富润屋，德润身，心广体胖，故君子必诚其意。", gloss: "财富润饰房屋，德行润泽身心，心胸宽广体态舒展，故君子必诚其意。", keywords: ["富", "德", "润", "诚意", "君子"] },
  { id: "daxue-8", book: "大学", chapter: "齐家", owner: "zengzi", text: "君子有诸己而后求诸人，无诸己而后非诸人。", gloss: "君子自己做到才要求别人，自己没有才非议别人。", keywords: ["君子", "诸己", "求诸人", "修身", "恕"] },
  { id: "daxue-9", book: "大学", chapter: "平天下", owner: "zengzi", text: "上老老而民兴孝，上长长而民兴弟，上恤孤而民不倍。", gloss: "上位者敬老则民兴孝，敬长则民兴悌，恤孤则民不背离。", keywords: ["老老", "孝", "长长", "弟", "恤孤", "平天下"] },
  { id: "daxue-10", book: "大学", chapter: "平天下", owner: "zengzi", text: "德者本也，财者末也。", gloss: "德是根本，财是末节。", keywords: ["德", "本", "财", "末"] },
  { id: "daxue-11", book: "大学", chapter: "平天下", owner: "zengzi", text: "道得众，则得国；失众，则失国。是故君子先慎乎德。", gloss: "得众则得国，失众则失国，故君子先慎德。", keywords: ["众", "得国", "失国", "德", "慎"] },
  { id: "xiaojing-1", book: "孝经", chapter: "开宗明义", owner: "zengzi", text: "身体发肤，受之父母，不敢毁伤，孝之始也。", gloss: "身体发肤受之父母，不敢毁伤，这是孝的开始。", keywords: ["身体", "发肤", "父母", "孝", "始"] },
  { id: "xiaojing-2", book: "孝经", chapter: "开宗明义", owner: "zengzi", text: "立身行道，扬名于后世，以显父母，孝之终也。", gloss: "立身行道、扬名后世以显父母，这是孝的终极。", keywords: ["立身", "行道", "扬名", "父母", "孝", "终"] },
  { id: "xiaojing-3", book: "孝经", chapter: "开宗明义", owner: "zengzi", text: "夫孝，德之本也，教之所由生也。", gloss: "孝是德的根本，教化由此而生。", keywords: ["孝", "德", "本", "教"] },
  // —— 四库补全之十一书（2026-10-15）：text 皆核自 public/siku/books/ 分片原文（繁者转简），book 用四库 title 原文 ——
  { id: "guanzi-mumin-1", book: "管子", chapter: "牧民", owner: "guanzhong", text: "仓廪实则知礼节，衣食足则知荣辱。", gloss: "仓廪充实才知道礼节，衣食充足才知道荣辱——治民先富民。", keywords: ["仓廪", "衣食", "礼节", "荣辱", "富民", "牧民"] },
  { id: "guanzi-mumin-2", book: "管子", chapter: "牧民", owner: "guanzhong", text: "政之所兴，在顺民心；政之所废，在逆民心。", gloss: "政事兴起在于顺应民心，政事废弛在于违逆民心。", keywords: ["政", "民心", "顺", "逆", "牧民"] },
  { id: "guanzi-quanxiu-1", book: "管子", chapter: "权修", owner: "guanzhong", text: "一年之计，莫如树谷；十年之计，莫如树木；终身之计，莫如树人。一树一获者，谷也；一树十获者，木也；一树百获者，人也。", gloss: "一年之计莫如种谷，十年之计莫如种树，终身之计莫如育人——树人收获得百倍。", keywords: ["树人", "树谷", "树木", "教化", "终身之计", "百年"] },
  { id: "guanzi-zhiguo-1", book: "管子", chapter: "治国", owner: "guanzhong", text: "凡治国之道，必先富民。民富则易治也，民贫则难治也。", gloss: "治国必先富民：民富则易治，民贫则难治。", keywords: ["治国", "富民", "民富", "民贫", "轻重"] },
  { id: "wenzi-daoyuan-1", book: "文子", chapter: "道原", owner: "wenzi", text: "夫道者，高不可极，深不可测，苞裹天地，禀受无形。", gloss: "道高得没有顶点，深得无法测度，包裹天地，生于无形。", keywords: ["道", "高", "深", "无形", "天地", "道原"] },
  { id: "wenzi-daoyuan-2", book: "文子", chapter: "道原", owner: "wenzi", text: "夫道者，原产有始，始于柔弱，成于刚强。", gloss: "道生万物有其开始：始于柔弱，成于刚强——故贵柔。", keywords: ["道", "柔弱", "刚强", "守柔", "道原"] },
  { id: "wenzi-shangde-1", book: "文子", chapter: "上德", owner: "wenzi", text: "山致其高而云雨起焉，水致其深而蛟龙生焉，君子致其道而德泽流焉。", gloss: "山高自起云雨，水深自生蛟龙，君子致道则德泽自然流布。", keywords: ["山", "水", "道", "德泽", "君子", "上德"] },
  { id: "wenzi-shangren-1", book: "文子", chapter: "上仁", owner: "wenzi", text: "上德者天下归之，上仁者海内归之，上义者一国归之，上礼者一乡归之。", gloss: "德仁义礼层层递减：有德者天下归之，行礼者不过一乡归之。", keywords: ["德", "仁", "义", "礼", "天下归之", "上仁"] },
  { id: "dengxizi-wuhou-1", book: "邓析子", chapter: "无厚", owner: "dengxi", text: "天于人无厚也，君于民无厚也，父于子无厚也，兄于弟无厚也。", gloss: "天对人、君对民、父对子、兄对弟都谈不上恩厚——破除世俗之厚薄名分。", keywords: ["无厚", "天", "君", "民", "名辩", "两可"] },
  { id: "dengxizi-wuhou-2", book: "邓析子", chapter: "无厚", owner: "dengxi", text: "目贵明，耳贵聪，心贵公。以天下之目视，则无不见；以天下之耳听，则无不闻。", gloss: "目贵明、耳贵聪、心贵公；用天下之目视、天下之耳听，则无所不见闻。", keywords: ["明", "聪", "公", "视", "听", "无厚"] },
  { id: "yinwenzi-dadao-1", book: "尹文子", chapter: "大道上", owner: "yinwen", text: "名有三科，法有四呈。一曰命物之名，方圆白黑是也；二曰毁誉之名，善恶贵贱是也；三曰况谓之名，贤愚爱憎是也。", gloss: "名称分三类：命物之名（方圆白黑）、毁誉之名（善恶贵贱）、况谓之名（贤愚爱憎）。", keywords: ["名", "三科", "法", "四呈", "命物", "正名", "名辩"] },
  { id: "yinwenzi-dadao-2", book: "尹文子", chapter: "大道上", owner: "yinwen", text: "有形者必有名，有名者未必有形。故亦有名以检形，形以定名，名以定事，事以检名。", gloss: "有形必有名，有名未必有形；以名检形、以形定名、以名定事、以事检名——名实互检。", keywords: ["名", "形", "名实", "检形", "定名", "正名", "大道"] },
  { id: "shenzi-dati-1", book: "申子", chapter: "大体", owner: "shenbuhai", text: "明君如身，臣如手；君若号，臣如响。君设其本，臣操其末；君治其要，臣行其详。", gloss: "明君如身、臣如手，君设根本、臣操末节，君主其要、臣行其详——君道执要。", keywords: ["君", "臣", "要", "术", "循名责实", "大体"] },
  { id: "shenzi-yiwen-1", book: "申子", chapter: "佚文", owner: "shenbuhai", text: "君必有明法正义，若悬权衡以称轻重，所以一群臣也。", gloss: "君必有明法正义，如悬权衡以称轻重，用来统一群臣。", keywords: ["明法", "正义", "权衡", "群臣", "术"] },
  { id: "shenzi-yiwen-2", book: "申子", chapter: "佚文", owner: "shenbuhai", text: "尧之治也，盖明法审令而已。圣君任法而不任智，任数而不任说。", gloss: "尧之治不过明法审令：圣君任法不任智，任数不任说。", keywords: ["尧", "明法", "审令", "任法", "任数", "术"] },
  { id: "shenzi-yiwen-3", book: "申子", chapter: "佚文", owner: "shenbuhai", text: "鼓不预五音，而为五音主。", gloss: "鼓不属于五音之一，却是五音之主——喻君不预百事，而为百事之主。", keywords: ["鼓", "五音", "君", "术", "无为"] },
  { id: "shenzi2-junren-1", book: "慎子", chapter: "君人", owner: "shendao", text: "大君任法而弗躬，则事断于法矣。法之所加，各以其分，蒙其赏罚而无望于君也。", gloss: "君主任法而不事事亲裁，政事皆决于法；赏罚各依其分，臣民不指望君主恩私。", keywords: ["任法", "弗躬", "事断于法", "分", "赏罚", "君人"] },
  { id: "shenzi2-weide-1", book: "慎子", chapter: "威德", owner: "shendao", text: "天有明，不忧人之暗也；地有财，不忧人之贫也；圣人有德，不忧人之危也。", gloss: "天自明不忧人之暗，地有财不忧人之贫，圣人有德不忧人之危——各任自然。", keywords: ["天", "地", "德", "自然", "威德"] },
  { id: "shenzi2-weide-2", book: "慎子", chapter: "威德", owner: "shendao", text: "腾蛇游雾，飞龙乘云，云罢雾霁，与蚯蚓同，则失其所乘也。故贤而屈于不肖者，权轻也；不肖而服于贤者，位尊也。", gloss: "腾蛇游雾、飞龙乘云，云散雾消便与蚯蚓无异——贤者屈于不肖是权轻，不肖服于贤是位尊：势位之要。", keywords: ["腾蛇", "雾", "势", "位", "权", "威德"] },
  { id: "shenzi2-junchen-1", book: "慎子", chapter: "君臣", owner: "shendao", text: "官不私亲，法不遗爱，上下无事，唯法所在。", gloss: "官不私其所亲，法不遗其所爱，上下无事，唯以法为依。", keywords: ["官", "私", "法", "爱", "公", "君臣"] },
  { id: "shenzi2-yiwen-1", book: "慎子", chapter: "逸文", owner: "shendao", text: "厝钧石，使禹察锱铢之重，则不识也；悬于权衡，则牦发之不可差。", gloss: "把钧石放在那里让禹去目测锱铢之重，禹也不识；悬于权衡，则毫发之差都逃不过——任法不任贤。", keywords: ["钧石", "权衡", "禹", "锱铢", "牦发", "任法"] },
  { id: "wuzi-tuguo-1", book: "吴子", chapter: "图国", owner: "wuqi", text: "凡制国治军，必教之以礼，励之以义，使有耻也。", gloss: "治国治军必以礼教之、以义励之，使人人有羞耻之心而后可用。", keywords: ["制国", "治军", "礼", "义", "有耻", "图国"] },
  { id: "wuzi-tuguo-2", book: "吴子", chapter: "图国", owner: "wuqi", text: "明主鉴兹，必内修文德，外治武备。", gloss: "承桑氏修德废武而灭国，有扈氏恃众好勇而丧社稷——明主必内修文德、外治武备。", keywords: ["文德", "武备", "明主", "修德", "图国"] },
  { id: "wuzi-tuguo-3", book: "吴子", chapter: "图国", owner: "wuqi", text: "战胜易，守胜难。故曰：天下战国，五胜者祸，四胜者弊，三胜者霸，二胜者王，一胜者帝。是以数胜得天下者稀，以亡者众。", gloss: "打胜仗容易、保持胜利难：屡胜者祸、少胜者王——数胜得天下者稀，因胜而亡者众。", keywords: ["战胜", "守胜", "慎战", "王", "帝", "祸", "图国"] },
  { id: "simafa-renben-1", book: "司马法", chapter: "仁本", owner: "rangju", text: "国虽大，好战必亡；天下虽安，忘战必危。", gloss: "国家虽大，好战必亡；天下虽安，忘战必危——兵家慎战之名言。", keywords: ["好战", "忘战", "慎战", "国", "危", "仁本"] },
  { id: "simafa-renben-2", book: "司马法", chapter: "仁本", owner: "rangju", text: "古者，以仁为本、以义治之谓正。是故杀人安人，杀之可也；攻其国，爱其民，攻之可也。", gloss: "以仁为本、以义治之方为正道：杀一人以安定众人可以杀，攻其国而爱其民可以攻。", keywords: ["仁", "义", "正", "杀人安人", "爱民", "仁本"] },
  { id: "simafa-renben-3", book: "司马法", chapter: "仁本", owner: "rangju", text: "以战止战，虽战可也。", gloss: "用战争来制止战争，这样的战争即使打了也是可以的——军礼之义。", keywords: ["以战止战", "止战", "战", "军礼", "仁本"] },
  { id: "weiliaozi-tianguan-1", book: "尉繚子", chapter: "天官", owner: "weiliao", text: "刑以伐之，德以守之，非所谓天官时日阴阳向背也。黄帝者，人事而已矣。", gloss: "黄帝百胜靠的是刑伐德守，而非天官时日阴阳向背——所谓天官，只是人事而已。", keywords: ["刑", "德", "天官", "时日", "阴阳", "人事", "天官"] },
  { id: "weiliaozi-bingling-1", book: "尉繚子", chapter: "兵令上", owner: "weiliao", text: "兵者，凶器也；争者，逆德也。事必有本，故王者伐暴乱，本仁义焉。", gloss: "兵器是凶器，争斗是逆德，故王者伐暴乱必以仁义为本——不得已而后用兵。", keywords: ["兵", "凶器", "争", "逆德", "仁义", "慎战", "兵令"] },
  { id: "weiliaozi-bingling-2", book: "尉繚子", chapter: "兵令上", owner: "weiliao", text: "兵者以武为植，以文为种；武为表，文为里。能审此二者，知胜败矣。", gloss: "用兵以武为植株、以文为种子，武是表象、文是根本——审知文武，方知胜败。", keywords: ["武", "文", "植", "种", "表", "里", "胜败", "兵令"] },
  { id: "liutao-wenshi-1", book: "六韬", chapter: "文师", owner: "lvwang", text: "天下非一人之天下，乃天下之天下也。同天下之利者则得天下，擅天下之利者则失天下。", gloss: "天下不是一个人的天下：与天下同利者得天下，独擅天下之利者失天下。", keywords: ["天下", "同利", "擅利", "得天下", "文师", "韬"] },
  { id: "liutao-faqi-1", book: "六韬", chapter: "发启", owner: "lvwang", text: "大智不智，大谋不谋，大勇不勇，大利不利。利天下者，天下启之；害天下者，天下闭之。", gloss: "大智者不显其智，大谋者不见其谋；利天下者天下向之敞开，害天下者天下对之闭拒。", keywords: ["大智", "大谋", "大勇", "大利", "天下", "发启", "韬"] },
  { id: "liutao-wenfa-1", book: "六韬", chapter: "文伐", owner: "lvwang", text: "凡文伐有十二节。一曰：因其所喜，以顺其志。", gloss: "不用兵戈而伐人之国谓之文伐，共十二节；第一就是顺着对方的喜好去迎合其心志。", keywords: ["文伐", "十二节", "顺志", "谋", "韬"] },
  { id: "sanlue-shanglue-1", book: "三略", chapter: "上略", owner: "huangshigong", text: "《军谶》曰：柔能制刚，弱能制强。柔者德也，刚者贼也。", gloss: "柔能制刚、弱能制强：柔是德，刚是害——三略贵柔之要。", keywords: ["柔", "刚", "弱", "强", "柔能制刚", "德", "军谶", "上略"] },
  { id: "sanlue-shanglue-2", book: "三略", chapter: "上略", owner: "huangshigong", text: "夫主将之法，务揽英雄之心，赏禄有功，通志于众。", gloss: "为主将之道在于收揽英雄之心，赏禄有功者，使众人志向相通。", keywords: ["主将", "英雄", "赏禄", "有功", "通志", "将道", "上略"] },
  { id: "sanlue-shanglue-3", book: "三略", chapter: "上略", owner: "huangshigong", text: "夫为国之道，恃贤与民。信贤如腹心，使民如四肢，则策无遗。", gloss: "治国之道在于依靠贤者与民众：信贤如腹心、使民如四肢，则谋划没有遗漏。", keywords: ["为国", "贤", "民", "腹心", "四肢", "策", "上略"] },
];

/**
 * `sem` 是该条与查询的原始余弦（未归一化），无向量时为 0。
 * 带出来是给调用方做「这条到底切不切题」的绝对判断用的——`score` 经过归一化与
 * 各种加权，只说明「池子里数它最高」，哪怕满池皆不相干，第一名照样有个高分。
 */
export type Retrieved = Passage & {
  score: number;
  sem: number;
  /** 送入模型时分配的稳定证据号；回答只能借此号绑定可展示的出处。 */
  evidenceId?: string;
  /** exact＝回答中可检出原文片段；support＝只以该条支撑解释，没有冒充逐字引文。 */
  evidenceBinding?: "exact" | "support";
  /**
   * 此条若来自人物本家之外，须记明它为何获准进入证据池。关系方向固定为
   * source(from) → 人物本家著作(to)，模型与界面据此显式归属，不把他书冒成本家。
   */
  lineage?: {
    type: string;
    label: string;
    note: string;
    from: string;
    to: string;
    use: string;
  };
};

const STOP = new Set(["的", "了", "是", "在", "和", "与", "吗", "呢", "我", "你", "他", "如何", "什么", "怎么", "为什么", "请问", "可以", "一个", "这个", "还是", "以及", "对于"]);

/** 余弦相似度；两向量长度须一致，任一为零向量返回 0。 */
function cosine(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * 语义分归一化：按本次检索池内部的余弦分布，把原始余弦映成可加进排序的分数。
 *
 * 不可直接用 `cosine * 权重`。向量未中心化，任意两段汉语的余弦都不低——实测 786
 * 条诸子对「隐私　被人看见得太多」一题，text-embedding-v3 最低 0.280、中位 0.377、
 * 最高 0.581（后改用 qwen3.7-text-embedding-flash，地板低些而跨度相近，此法照样要）。那 0.28 的地板乘上权重只是个加给全池的常数，于排序毫无作用；
 * 真有判别力的是高出池中位的那 0.2，旧权重 ×8 后不过 1.6 分，而关键词命中一条便
 * 是 6×2=12 分。于是语义分压不过任何一个字面噪声：问「隐私」检出的仍是孟子
 * 「无恻隐之心」（只因借着一个「隐」字），而纯语义本来检得出子思子「莫见乎隐，
 * 莫显乎微，故君子慎其独也」、韩非「事以密成，语以泄败」。
 *
 * 故先取本池 min/max 定出此题实际跨度，把余弦映到 [0,1]，只对落在上半段
 * （rel ≥ SEM_GATE）者给分，并把 [GATE,1] 重铺满 [0,SEM_WEIGHT]。地板因此归零，
 * 最切题者拿满 14 分，与一个强字面命中相当——语义这才真进得了排序。
 *
 * 闸门另有一重用处：不设闸时人人余弦为正，`score > 0` 的过滤便形同虚设，
 * 一池八百条全算「检到」，`limit` 之外再无门槛。
 *
 * 返回 null 表示此池无可用语义分（无向量、或维数不合致余弦尽为 0、或跨度为零），
 * 调用方据此降级为纯关键词。
 */
const SEM_WEIGHT = 14;
const SEM_GATE = 0.5;
function semScaler(raw: Map<string, number>): ((id: string) => number) | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of raw.values()) {
    if (c < lo) lo = c;
    if (c > hi) hi = c;
  }
  const span = hi - lo;
  if (!(span > 1e-6)) return null;
  return (id) => {
    const c = raw.get(id);
    if (c === undefined) return 0;
    const rel = (c - lo) / span;
    return rel >= SEM_GATE ? ((rel - SEM_GATE) / (1 - SEM_GATE)) * SEM_WEIGHT : 0;
  };
}

/** 是否已预计算向量（决定能否走语义检索）。向量表按需载入，故此标志随载入而变。 */
let hasVectors = false;

/**
 * 向量表按需载入，不随首屏下发。
 *
 * 816 条 × 1024 维即便截到五位小数也有 6.7 MB，静态 import 会落进 page 那个 chunk
 * （实测主 chunk 由六百余 KB 涨到 6.6 MB，gzip 2.2 MB），而那是首屏第一个要下的文件——
 * 公网那条链路上白等几秒，且多数来客根本没点检索。改成 `import()` 便单独成块，
 * 头一次要语义检索时才取。
 *
 * 入口只此一个：`embedQuery` 本就是异步的（查询向量要走 `/api/embed`），顺带把表
 * 拉进来不多一道等待。于是 `retrieve` 里有个不言而喻的前提——拿得到 `qVec` 就意味着
 * 表已就位，因为 `qVec` 只可能由 `embedQuery` 产出，而它载入之后才去 embed。
 *
 * 载入失败（网络断、文件缺）即退回空表，`hasVectors` 仍为 false，检索降级纯关键词。
 */
let VECTORS: Record<string, number[]> = {};
let vectorsPromise: Promise<void> | null = null;
function ensureVectors(): Promise<void> {
  if (!vectorsPromise) {
    vectorsPromise = import("./canon-vectors")
      .then((m) => {
        VECTORS = m.CANON_VECTORS;
        hasVectors = Object.keys(VECTORS).length > 0;
      })
      .catch(() => {
        VECTORS = {};
        hasVectors = false;
      });
  }
  return vectorsPromise;
}

/**
 * 查询向量：调服务端 `/api/embed`（DashScope 向量模型，Key 服务端持有）。
 * 失败或无向量库时返回 null，调用方降级纯关键词。模块级缓存免同句重 embed。
 * 仅浏览器运行期调用（fetch），SSR 不触——SSR 既不 embed 也就不载向量表。
 */
const embedCache = new Map<string, number[] | null>();
export async function embedQuery(text: string): Promise<number[] | null> {
  if (typeof window === "undefined") return null;
  await ensureVectors();
  if (!hasVectors) return null;
  const key = text.slice(0, 64);
  if (embedCache.has(key)) return embedCache.get(key) ?? null;
  try {
    const r = await fetch(api("/api/embed"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) { embedCache.set(key, null); return null; }
    const data = (await r.json()) as { ok: boolean; vector?: number[] };
    const vec = data.ok && Array.isArray(data.vector) ? data.vector : null;
    embedCache.set(key, vec);
    return vec;
  } catch {
    embedCache.set(key, null);
    return null;
  }
}

function tokenize(query: string): string[] {
  const cleaned = query.replace(/[，。？！、；：“”‘’（）,.?!;:()\s]+/g, " ");
  const out = new Set<string>();
  for (const seg of cleaned.split(" ").filter(Boolean)) {
    if (!STOP.has(seg)) out.add(seg);
    // 中文无空格分词，退化为二元与一元字组
    for (let i = 0; i < seg.length; i++) {
      const uni = seg[i];
      if (!STOP.has(uni) && /[一-龥]/.test(uni)) out.add(uni);
      if (i + 1 < seg.length) {
        const bi = seg.slice(i, i + 2);
        if (!STOP.has(bi)) out.add(bi);
      }
    }
  }
  return [...out];
}

/**
 * 检索池 ＝ 诸子语料 ＋ 西游语料 ＋ 西方锚点原句。
 *
 * 与 `canon` 分开两个名字，是因为两者用处不同：`canon` 是**诸子那一部语料本身**，
 * 典籍图谱、脉络图、全文阅读都按它铺陈，掺进西游便乱；`retrievePool` 只供
 * `retrieve()`／`fallbackFor()` 用，是「能被检索到的话」的全集。
 *
 * 混在一池而不互相串门，靠的是调用方必传 `worldId`（见 dialogue.ts 的 `gather`）：
 * 悟空检索限 `xiyou`，孔子限 `zhanguo`。只有母题层并置时才不限世界。
 *
 * 西方那十五条（west-passages.ts）标 `worldId: "west"`，与七位西方人格同轴
 * （见 worlds.ts 的 `WEST_AXIS`）：歌德问答时限域 west，检得的只会是《浮士德》
 * 《天演论》那一架上的话，不会去引《论语》。
 *
 * `xiyou-passages.ts`、`west-passages.ts` 只 `import type` 回本模块，故无运行时循环依赖。
 */
const retrievePool: Passage[] = [...canon, ...xiyouPassages, ...westPassages];

/**
 * 典籍检索：关键词命中最重，其次原文与白话匹配；
 * 指定人物时其名下条目加权，但不排除他家，便于互相引证。
 * 若传入查询向量 qVec（经 embedQuery 取得），叠加语义相似分（余弦按本池分布归一化后加权，见 semScaler），
 * 提升口语化/同义查询的召回；无向量时纯关键词（行为同旧）。
 *
 * 检索域由「`owner` 相等」改为「`speakerOf()` 相等」，这是三层模型的落点：
 * 诸子的 `speaker` 皆省略、退回 `owner`，故行为与旧版逐字相同；西游条目带
 * `speaker: "wukong"`，便能在同一套检索里各归其主。
 *
 * `worldId` 过滤是另一条硬线：悟空不该引《论语》，孔子也不该引《西游》。
 * 不传 `worldId` 则不限（如母题层要跨世界并置时）。
 *
 * `extra` 是运行期补进来的语料——诸子自家那部书的全文段落，自四库分片取得
 * （见 canonSource.ts 的 `loadOwnWorks`）。不并进 `retrievePool` 而逐次传入，
 * 是因为它按人按需载入：孔子问过一次《论语》才在内存里，不该让全局池随谁问过话而变。
 */
export function retrieve(
  query: string,
  options: {
    scholarId?: string;
    limit?: number;
    themes?: string[];
    onlyOwner?: boolean;
    worldId?: string;
    extra?: Passage[];
  } = {},
  qVec?: number[] | null,
): Retrieved[] {
  const { extra, ...rest } = options;
  return retrieveIn(query, extra && extra.length ? [...retrievePool, ...extra] : retrievePool, rest, qVec);
}

/**
 * 在指定的一池里检索。`retrieve` 即是它以「选本＋extra」为池的那个常用情形。
 *
 * 另立这一口，是为「只检四库全文那一池」：全文段落无关键词可凭（抽取时有意留的，
 * 见 canonSource 的 toPassages），同池比分便永在选本之下——实测「赏罚」「耕战」
 * 「法」三题，并池取前五，全文一条也挤不进来。于是典籍界面照旧只见选本，二十六
 * 部等于接上了而看不见。
 *
 * 故两栏各检各排：选本一栏仍走 `retrieve`（一分不变），全文一栏单检此一池，各有
 * 各的位次。算分仍是这一套（同一个函数），所以两栏的分照面可比，不是两把尺子。
 */
/**
 * 条目的折简面：正文、白话、关键词、书名章名各折一道，按 id 记住。
 *
 * 不落在数据里（不给 Passage 加字段），是因为折法属检索，不属语料——语料那边
 * 「原文永不改写」。首次检索时折，之后查表；二十六部一万余段折下来约一两毫秒，
 * 比每题重折省，也比预先全折省（没点开的书不折）。
 */
/** 一词在一段里出现几次（不重叠计）。 */
function occurrences(hay: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while ((i = hay.indexOf(needle, i)) >= 0) {
    n++;
    i += needle.length;
  }
  return n;
}

const foldCache = new Map<string, { text: string; gloss: string; meta: string; keys: string[] }>();
function folded(p: Passage) {
  let f = foldCache.get(p.id);
  if (!f) {
    f = { text: fold(p.text), gloss: fold(p.gloss), meta: fold(p.book + "·" + p.chapter), keys: p.keywords.map(fold) };
    foldCache.set(p.id, f);
  }
  return f;
}

export function retrieveIn(
  query: string,
  pool0: Passage[],
  options: {
    scholarId?: string;
    limit?: number;
    themes?: string[];
    onlyOwner?: boolean;
    worldId?: string;
  } = {},
  qVec?: number[] | null,
): Retrieved[] {
  const { scholarId, limit = 3, themes = [], onlyOwner = false, worldId = "zhanguo" } = options;
  // 查询先折简再切词，条目那边亦折（见 folded）：两边各折一道，繁体书便检得出。
  const terms = [...tokenize(fold(query)), ...themes.flatMap((t) => tokenize(fold(t)))];
  const useSem = hasVectors && qVec && qVec.length > 0;

  // 查询里但凡有一个成词的切片，单字便只作佐证，不按「精确命中关键词」记满分。
  //
  // `tokenize` 把汉语拆成单字与二字两套，一句八字的当代题便切出七八个单字，而
  // 单字不是词：问「隐私　被人看见得太多」，孟子「无恻隐之心，非人也」的 keywords
  // 里有个「人」，单字精确命中记 6 分，再加「隐」的部分命中与正文命中，一条毫不
  // 相干的条目就攒到 33.5 分（实测），而语义满分不过 14 分，压它不过。公孙龙
  // 「见与不见离」同理，全靠 keywords 里一个「见」得 31 分。
  //
  // 却不能一概砍掉单字：「仁」「道」「名」在诸子语境里确是词，典籍图谱点概念节点
  // 查的正是单字，那时单字就是全部信号。故以查询自身有无成词为断——查询本身只是
  // 一个字，照旧满权；查询已有词可凭，单字就退作佐证。
  const hasPhrase = terms.some((t) => t.length > 1);

  // 限域默认 zhanguo，而非「不限」：典籍检索、典籍图谱那几处旧调用都不传 worldId，
  // 若默认不限，悟空的话就会混进诸子的检索结果里。跨世界并置另有其路（canonSource.ts），
  // 不走这里；真要不限域，传 worldId: "*"。
  let pool = pool0;
  if (worldId !== "*") pool = pool.filter((p) => worldOfPassage(p) === worldId);
  if (onlyOwner && scholarId) pool = pool.filter((p) => speakerOf(p) === scholarId);

  // 语义分要先走一趟全池，才算得出本题的余弦跨度——归一化非此不可（见 semScaler）。
  const rawSem = new Map<string, number>();
  let semScale: ((id: string) => number) | null = null;
  if (useSem) {
    for (const p of pool) {
      const v = VECTORS[p.id];
      if (v) rawSem.set(p.id, cosine(qVec!, v));
    }
    semScale = semScaler(rawSem);
  }

  const scored = pool.map((p) => {
    const f = folded(p);
    let score = 0;
    for (const term of terms) {
      if (term.length === 1 && hasPhrase) {
        // 单字在有词可凭时只作佐证，不入主分（缘由见 hasPhrase 处注）。
        if (f.keys.some((k) => k === term)) score += 1.5;
        if (f.text.includes(term)) score += 0.5;
        continue;
      }
      const weight = term.length > 1 ? 2 : 1;
      if (f.keys.some((k) => k === term)) score += 6 * weight;
      // 部分命中要求两边都成词。否则查询切出的二字词会「包住」条目里的单字关键词：
      // 问「隐私　被人看见得太多」，公孙龙「见与不见离」的 keywords 有单字「见」
      // 「不见」「得」，被「看见」「见得」「得太」各包一次，记满 18 分（实测总分
      // 20.5，而其余弦只 0.363，是全池偏低的一档）。一个二字词里套着一个单字，
      // 不足以算证据；真要凭单字，自有上面那条佐证分。
      else if (f.keys.some((k) => (k.length > 1 && term.includes(k)) || (term.length > 1 && k.includes(term)))) score += 3 * weight;
      if (f.text.includes(term)) score += 2 * weight;
      if (f.gloss.includes(term)) score += 1.5 * weight;
      if (f.meta.includes(term)) score += 2 * weight;
    }
    // 密度分：一词在这一段里复见几次、占这段多大分量。上限一分。
    //
    // 一分之限是有意的：它只够拆同分之局，拆不动真有高下的两条（选本之间多相差
    // 一分以上，见其关键词每词六分）。而同分之局正是全文那一池的常态——全文段落
    // 无关键词、无白话可凭，凡含此词者一概「原文命中」得同一个分：实测「赏罚」
    // 四十五条并列五分、「无为」三十八条并列、「法」百余条并列四分，于是名次实
    // 按 id 排（见下 localeCompare 那道），《管子》因 guanzi 字序在前便占满一屏，
    // 而《墨子·兼爱》检「兼爱」反而落到后头。
    //
    // 凭的是词频与段长，再乘词的轻重：一词在一段里说了五遍，这段多半正是讲它的；
    // 二十字的短章里有「兼爱」，比四百字的长篇里偶带一句更切题；而「非攻」只见于
    // 九段、「君子」见于六百二十五段，两者也不该同重。
    //
    // 轻重（IDF）须通池统计，故在抽取时算定（`scripts/siku_terms.py`），不在此处
    // 逐题现算；`termWeight` 在总表未到、或此词不在表内时返回 1，即不加不减——
    // 选本那边的标注词与西游那一池都不在这张表里，不可因此减权。
    let dens = 0;
    for (const term of terms) {
      const c = occurrences(f.text, term);
      if (c === 0) continue;
      const w = termWeight(term);
      dens += Math.min(c - 1, 4) * 0.1 * w;
      dens += Math.min(1, (term.length * c) / Math.max(f.text.length, 1)) * 0.5 * w;
    }
    score += Math.min(dens, 1);

    if (semScale) score += semScale(p.id);
    if (score > 0 && scholarId) {
      const sp = speakerOf(p);
      if (sp === scholarId) score *= 1.8;
      else if (sp === "") score *= 1.1;
      else score *= 0.75;
    }
    return { ...p, score, sem: rawSem.get(p.id) ?? 0 };
  });

  return scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * 全文为主。
 *
 * 那七百五十二条选本是权宜：全文未抽出来之前，典籍界面总得有东西可引。如今二十六
 * 部一万余段原文在 `public/siku/quotable/` 里放着（见 canonSource），便以全文为主，
 * 选本退作兜底——只在全文答不上时才出面。
 *
 * 兜底仍须留着，不是舍不得，是有几处全文确实答不上：
 *   - 十部书无分片可取（《苏子》《张子》《惠子》《邹子》《子思子》《周易》
 *     《尚书》《杨子》《神农之言》《大学》），点开那几个书节点，没有全文。
 *   - 空查询（人物节点取其名下条目）在 `retrieveIn` 里一分不得（见其 score > 0
 *     那道筛），须另走他路。
 *
 * 一个常量管这件事：要回到「选本在前、全文补足」的旧样，把它改作 false 即可，
 * 三处界面（典籍检索框、图谱检索面、图谱全图面）一并回退，不必各改一遍。
 */
export const FULLTEXT_FIRST = true;

/**
 * 先检全文那一池，检不得才退回选本池。
 *
 * 两池分检而非并池，是因为并池比不出高下：全文段落无关键词可凭（抽取时有意留的，
 * 见 canonSource 的 toPassages），同池里永在选本之下——实测「赏罚」「耕战」「法」
 * 三题，并池取前五，全文一条也挤不进来，二十六部等于接上了而看不见。分池则各有
 * 各的位次，而打分仍是同一个函数，两边的分照面可比，不是两把尺子。
 */
export function retrievePreferFull(
  query: string,
  full: Passage[],
  options: { scholarId?: string; limit?: number; themes?: string[]; onlyOwner?: boolean; worldId?: string; perBook?: number } = {},
  qVec?: number[] | null,
): Retrieved[] {
  const { perBook, ...rest } = options;
  const limit = rest.limit ?? 3;
  if (FULLTEXT_FIRST && full.length) {
    // 多取几倍再按书配额筛：配额筛掉的位要有东西补上，只取 limit 条则筛完不足数。
    const cand = retrieveIn(query, full, { ...rest, limit: limit * 6 }, qVec);
    const hits = spreadByBook(cand, limit, perBook ?? Math.max(2, Math.ceil(limit / 4)));
    if (hits.length) return hits;
  }
  return retrieve(query, FULLTEXT_FIRST ? rest : { ...rest, extra: full }, qVec);
}

/**
 * 每书至多几条，不足数再放宽补齐。
 *
 * 不配额则段多的书把前几名占满：《管子》一千六百五十五段、《墨子》一千二百十八段、
 * 《荀子》一千〇八十九段，凭段数就压得过人——实测检「法」前十条尽出《管子》一部，
 * 检「民」「仁」「道」各只两部。而检索面那张图是按「书—人—句」三环布的，一部书
 * 便是一根独枝，图就不成图了；引典那一栏连看五条同一篇的，也不如五部书各出一条。
 *
 * 配额是硬筛而非减分：减分要调权重，调不准；硬筛只挪位次，谁该在前仍按分说话。
 * 筛完若不足数（冷僻题只一两部书讲），放宽配额再补，宁可同书多出几条，不留空位。
 */
function spreadByBook(hits: Retrieved[], limit: number, perBook: number): Retrieved[] {
  if (hits.length <= limit) return hits;
  const out: Retrieved[] = [];
  const used = new Map<string, number>();
  for (const h of hits) {
    if (out.length >= limit) break;
    const n = used.get(h.book) ?? 0;
    if (n >= perBook) continue;
    used.set(h.book, n + 1);
    out.push(h);
  }
  // 配额太紧而条目不足（只一两部书讲这题）：按分补齐，不留空位
  if (out.length < limit) {
    const have = new Set(out.map((h) => h.id));
    for (const h of hits) {
      if (out.length >= limit) break;
      if (!have.has(h.id)) out.push(h);
    }
  }
  return out;
}

/** 检索不到时，退回该人物的代表性条目，保证回答仍有典据。 */
export function fallbackFor(scholarId: string, limit = 2): Retrieved[] {
  return retrievePool.filter((p) => speakerOf(p) === scholarId).slice(0, limit).map((p) => ({ ...p, score: 0, sem: 0 }));
}

// —— 全文语义检索（异步，仅浏览器运行期）——
import { ALL_VERSES, type FlatVerse } from "./canonFull";
import { api } from "./assetPath";

/** 已加载的按书分片向量：模块级 Map 缓存，同书只 fetch 一次。 */
const bookVecCache = new Map<string, Record<string, number[]> | null>();

/** 取某书分片向量：fetch /public/canon-vec/{bookId}.json，失败返回 null（降级纯关键词）。 */
export async function loadBookVectors(bookId: string): Promise<Record<string, number[]> | null> {
  if (typeof window === "undefined") return null;
  if (bookVecCache.has(bookId)) return bookVecCache.get(bookId) ?? null;
  try {
    const r = await fetch(`/canon-vec/${bookId}.json`);
    if (!r.ok) { bookVecCache.set(bookId, null); return null; }
    const data = (await r.json()) as { vectors: Record<string, number[]> };
    const vec = data.vectors ?? null;
    bookVecCache.set(bookId, vec);
    return vec;
  } catch {
    bookVecCache.set(bookId, null);
    return null;
  }
}

export type FullHit = FlatVerse & { score: number };

/**
 * 全文检索：关键词 + 语义（余弦按本池分布归一化后加权，见 semScaler）混合打分，跨书或指定单书。
 * 异步——先 embedQuery 取查询向量，再按需加载各书分片向量。
 * 无向量库（未跑 embed 脚本）时降级纯关键词，不报错。
 * 仅浏览器运行期；retrieve（同步，可引典）行为不受影响。
 */
export async function retrieveFull(
  query: string,
  options: { bookId?: string; limit?: number; schoolId?: string } = {},
): Promise<FullHit[]> {
  const { bookId, limit = 6, schoolId } = options;
  if (typeof window === "undefined") return [];
  const qVec = await embedQuery(query);
  const pool = ALL_VERSES.filter((v) => (!bookId || v.bookId === bookId) && (!schoolId || v.schoolId === schoolId));
  const terms = tokenize(query);
  const hasPhrase = terms.some((t) => t.length > 1);

  // 按需加载涉及书的向量
  const bookIds = bookId ? [bookId] : [...new Set(pool.map((v) => v.bookId))];
  const vecMaps = await Promise.all(bookIds.map((bid) => loadBookVectors(bid)));
  const vecByBook: Record<string, Record<string, number[]> | null> = {};
  bookIds.forEach((bid, k) => { vecByBook[bid] = vecMaps[k]; });

  // 与 retrieve 同理：余弦须按本池分布归一化，不可直接加权（见 semScaler）。
  // 此处跨书并作一池归一化，正是要让各书之间可比——分书各归一化则每本书都会
  // 冒出一个「本书最高」，跨书检索便成了按书轮流出人。
  const rawSem = new Map<string, number>();
  if (qVec && qVec.length > 0) {
    for (const v of pool) {
      const v2 = vecByBook[v.bookId]?.[v.verseId];
      if (v2) rawSem.set(v.verseId, cosine(qVec, v2));
    }
  }
  const semScale = semScaler(rawSem);

  const scored = pool.map((v) => {
    let score = 0;
    for (const term of terms) {
      // 单字只作佐证，与 retrieve 同一道理（全文池更大，单字噪声只会更甚）。
      if (term.length === 1 && hasPhrase) {
        if (v.text.includes(term)) score += 0.5;
        continue;
      }
      const weight = term.length > 1 ? 2 : 1;
      if (v.text.includes(term)) score += 2 * weight;
      if (v.gloss && v.gloss.includes(term)) score += 1.5 * weight;
      if (v.chapter.includes(term) || v.book.includes(term)) score += 1.5 * weight;
    }
    if (semScale) score += semScale(v.verseId);
    return { ...v, score };
  });

  return scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.verseId.localeCompare(b.verseId))
    .slice(0, limit);
}
