import type { Passage } from "./canon";

/**
 * 西游人物可引之言。
 *
 * ⚠ **当前为种子版，非抽取产物。** 正式版由 `scripts/xiyou-extract.mjs` 自百回本
 * 正文（服务器上的四库导出）抽出，一人四十条上下；此处先列十余条原著名句，使母题层
 * 与对谈在语料到位之前即可验证。脚本跑通后整份覆盖，届时 id 会变——故母题锚点
 * 一律以原句片段指认（见 motifs.ts 的 `quote`），不依赖 id。
 *
 * 每条都带回目（`locus`），因为这正是西游语料的立身之处：悟空说「皇帝轮流做」
 * 是第七回闹天宫时说的，脱了那个处境就只是一句狂言。诸子引典只需书与篇，
 * 叙事人物引言必须连处境一起引。
 *
 * `gloss` 留空——原著是白话，不烦再译；留这个字段只为与 `Passage` 同形。
 */
export const xiyouPassages: Passage[] = [
  // —— 孙悟空 ——
  { id: "xy-wukong-s1", book: "西游记", chapter: "第一回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第一回 灵根育孕源流出 心性修持大道生", text: "我等愿拜他为师，与他做个徒弟，学一个不老长生，常躲过阎君之难。", gloss: "", keywords: ["拜他为师", "命", "难"] },
  { id: "xy-wukong-s2", book: "西游记", chapter: "第七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七回 八卦炉中逃大圣 五行山下定心猿", text: "常言道，皇帝轮流做，明年到我家。只教他搬出去，将天宫让与我，便罢了。", gloss: "", keywords: ["皇帝轮流做", "天宫", "让", "位"] },
  { id: "xy-wukong-s3", book: "西游记", chapter: "第十四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十四回 心猿归正 六贼无踪", text: "我已不做妖仙了，只是保唐僧往西天拜佛求经，与他做个徒弟。", gloss: "", keywords: ["保唐僧", "西天", "取经", "徒弟"] },
  { id: "xy-wukong-s4", book: "西游记", chapter: "第十四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十四回 心猿归正 六贼无踪", text: "这是什么紧箍儿咒，你莫念，莫念！头都疼破了，好歹救我一救。", gloss: "", keywords: ["紧箍", "救", "咒"] },
  { id: "xy-wukong-s5", book: "西游记", chapter: "第一回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第一回 灵根育孕源流出 心性修持大道生", text: "列位呵，人而无信，不知其可。我等今日有此水帘洞这等一个安身之处，何不拜我为王？", gloss: "", keywords: ["水帘洞", "信", "王", "安身"] },
  { id: "xy-wukong-s6", book: "西游记", chapter: "第二十七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十七回 尸魔三戏唐三藏 圣僧恨逐美猴王", text: "师父，你那里认得！那妖精的模样，是我老孙的火眼金睛看得明白。", gloss: "", keywords: ["妖", "真", "假", "眼"] },

  // —— 唐三藏 ——
  { id: "xy-tangseng-s1", book: "西游记", chapter: "第二十七回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十七回 尸魔三戏唐三藏 圣僧恨逐美猴王", text: "出家人时时常要方便，念念不离善心。你这猴头，全无一点慈悲好善之心。", gloss: "", keywords: ["全无一点慈悲好善之心", "善", "心", "慈悲"] },
  { id: "xy-tangseng-s2", book: "西游记", chapter: "第十二回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十二回 玄奘秉诚建大会 观音显象化金蝉", text: "宁恋本乡一捻土，莫爱他乡万两金。", gloss: "", keywords: ["本乡", "归", "家乡"] },
  { id: "xy-tangseng-s3", book: "西游记", chapter: "第九十八回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第九十八回 猿熟马驯方脱壳 功成行满见真如", text: "弟子不知，怎么是无字真经？我等万里迢迢，怎么取得这等白纸回去？", gloss: "", keywords: ["真经", "取经", "经"] },

  // —— 猪八戒 ——
  { id: "xy-bajie-s1", book: "西游记", chapter: "第三十二回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十二回 平顶山功曹传信 莲花洞木母逢灾", text: "师兄，依老猪说，不如把行李分了，各人散火的好，还往高老庄上寻我那浑家去。", gloss: "", keywords: ["散火", "行李", "退", "家乡"] },

  // —— 沙悟净 ——
  { id: "xy-shaseng-s1", book: "西游记", chapter: "第三十一回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十一回 猪八戒义激猴王 孙行者智降妖怪", text: "大师兄，师父已被妖精拿去了，须得你去救他一救。", gloss: "", keywords: ["师父", "师兄", "妖", "救"] },

  // —— 观世音 ——
  { id: "xy-guanyin-s1", book: "西游记", chapter: "第十七回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十七回 孙行者大闹黑风山 观世音收伏熊罴怪", text: "菩萨妖精，总是一念。若论本来，皆属无有。既有善念，叫做回头。", gloss: "", keywords: ["善念", "妖", "菩萨", "心"] },

  // —— 如来 ——
  { id: "xy-rulai-s1", book: "西游记", chapter: "第七回", owner: "rulai", speaker: "rulai", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七回 八卦炉中逃大圣 五行山下定心猿", text: "我是西方极乐世界释迦牟尼尊者。今闻你猖狂村野，屡反天宫，不知是何方生长？", gloss: "", keywords: ["反", "天宫", "佛"] },

  // —— 玉皇大帝 ——
  { id: "xy-yudi-s1", book: "西游记", chapter: "第四回", owner: "yudi", speaker: "yudi", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四回 官封弼马心何足 名注齐天意未宁", text: "依卿所奏。就除他做个齐天大圣，只是加他个空衔，有官无禄便了。", gloss: "", keywords: ["齐天大圣", "官", "名号", "位"] },

  // —— 牛魔王 ——
  { id: "xy-niumowang-s1", book: "西游记", chapter: "第六十回", owner: "niumowang", speaker: "niumowang", workId: "bk-xiyouji", worldId: "xiyou", locus: "第六十回 牛魔王罢战赴华筵 孙行者二调芭蕉扇", text: "你这猢狲，害子之情，被你说出来了。你倒不怕我，我却怕你！", gloss: "", keywords: ["害子之情", "子", "仇", "情"] },

  // —— 以下为就语料扩充所补，共 74 条 ——
  //
  // 缘故是量出来的：母题层三轴并观，诸子那一池 786 条，而西游、西方各只 15 条。
  // 十五句话覆盖不了那些题意，当代题检出的锚十条里只有一条判得「切题」。故自
  // `public/siku/quotable/xy-*.json`（百回本对白抽取产物，3616 条）里补选。
  //
  // 怎么挑的：不用关键词挑——关键词挑不动「内卷」「隐私」这类抽象题意，那正是
  // 要补的地方。先把 2048 条（长 18–110 字、去重）全数 embed，再以二十六个题意
  // （策展十二枚＋当代及通题十四）各取余弦前十四，去重得 277 条待选，逐条读过
  // 择其七十四。所以这批条目是按「母题覆盖」选的，不是按名句选的。
  //
  // `gloss` 照旧留空（原著本是白话）；`keywords` 逐条手写，首项多取句中原话，
  // 因 `retrieve()` 对关键词全等命中给 6 分，写成书面词反不如照录原文管用。

  // —— 孙悟空（续）——
  { id: "xy-wukong-s7", book: "西游记", chapter: "第七十八回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十八回 比丘怜子遣阴神 金殿识魔谈道德", text: "若要全命，师作徒，徒作师，方可保全。", gloss: "", keywords: ["师徒","师作徒","易位","全命"] },
  { id: "xy-wukong-s8", book: "西游记", chapter: "第七十二回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十二回 盘丝洞七情迷本 濯垢泉八戒忘形", text: "你看师父说的是那里话。你要吃斋，我自去化，俗语云一日为师，终身为父，岂有为弟子者高坐，教师父去化斋之理？", gloss: "", keywords: ["师徒","一日为师终身为父","化斋","尊卑"] },
  { id: "xy-wukong-s9", book: "西游记", chapter: "第八十八回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十八回 禅到玉华施法会 心猿木母授门人", text: "教便也容易，只是你等无力量，使不得我们的兵器，恐学之不精，如画虎不成反类狗也。古人云，教训不严师之惰，学问无成子之罪。汝等既有诚心，可去焚香来拜了天地，我先传你些神力，然后可授武艺。", gloss: "", keywords: ["师徒","教训不严师之惰","传艺","拜师"] },
  { id: "xy-wukong-s10", book: "西游记", chapter: "第三十二回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十二回 平顶山功曹传信 莲花洞木母逢灾", text: "看师父啊：师父去出恭，你伺候；师父要走路，你扶持；师父要吃斋，你化斋。若他饿了些儿，你该打；黄了些儿脸皮，你该打；瘦了些儿形骸，你该打。", gloss: "", keywords: ["师徒","伺候","该打","管束"] },
  { id: "xy-wukong-s11", book: "西游记", chapter: "第九十四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第九十四回 四僧宴乐御花园 一怪空怀情欲喜", text: "老孙的火眼金睛，但见面，就认得真假善恶，富贵贫穷，却好施为，辨明邪正。", gloss: "", keywords: ["真假","火眼金睛","善恶","辨明邪正"] },
  { id: "xy-wukong-s12", book: "西游记", chapter: "第七十四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十四回 长庚传报魔头狠 行者施为变化能", text: "你晓得，快说来我听。如若说得合着我，便是真的；若说差了一些儿，便是假的，我定拿去见大王处治。", gloss: "", keywords: ["真假","说得合着我便是真","标准","凭我说了算"] },
  { id: "xy-wukong-s13", book: "西游记", chapter: "第八十六回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十六回 木母助威征怪物 金公施法灭妖邪", text: "真人头抛出来，扑搭不响，假人头抛得象梆子声。你不信，等我抛了你听。", gloss: "", keywords: ["真假","真人头","假人头","验"] },
  { id: "xy-wukong-s14", book: "西游记", chapter: "第八十五回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十五回 心猿妒木母 魔主计吞禅", text: "师父，我常时间还看得好，这番却看错了。我只说风雾之中恐有妖怪，原来不是。", gloss: "", keywords: ["看错","真假","幻","眼力"] },
  { id: "xy-wukong-s15", book: "西游记", chapter: "第四十三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十三回 黑河妖孽擒僧去 西洋龙子捉鼍回", text: "你这老师父，忒也多疑，做不得和尚。我们一同四众，偏你听见甚么水声。你把那《多心经》又忘了也？", gloss: "", keywords: ["多疑","多心经","信","疑"] },
  { id: "xy-wukong-s16", book: "西游记", chapter: "第五十三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第五十三回 禅主吞餐怀鬼孕 黄婆运水解邪胎", text: "不瞒师父说，只因你不信我的圈子，却教你受别人的圈子。多少苦楚，可叹！可叹！", gloss: "", keywords: ["圈子","规训","不信我的圈子","受别人的圈子"] },
  { id: "xy-wukong-s17", book: "西游记", chapter: "第三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三回 四海千山皆拱伏 九幽十类尽除名", text: "汝等既登王位，乃灵显感应之类，为何不知好歹？我老孙修仙了道，与天齐寿，超升三界之外，跳出五行之中，为何着人拘我？", gloss: "", keywords: ["与天齐寿","拘我","三界之外","五行之中"] },
  { id: "xy-wukong-s18", book: "西游记", chapter: "第七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七回 八卦炉中逃大圣 五行山下定心猿", text: "我的手段多哩！我有七十二般变化，万劫不老长生。会驾筋斗云，一纵十万八千里。如何坐不得天位？", gloss: "", keywords: ["七十二般变化","天位","坐不得","僭越"] },
  { id: "xy-wukong-s19", book: "西游记", chapter: "第四十七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十七回 圣僧夜阻通天水 金木垂慈救小童", text: "任从天命，吃了我，是我的命短；不吃，是我的造化。我与你祭赛去。", gloss: "", keywords: ["任从天命","命短","造化","祭赛"] },
  { id: "xy-wukong-s20", book: "西游记", chapter: "第七十六回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十六回 心神居舍魔归性 木母同降怪体真", text: "胡说！阎王注定三更死，谁敢留人到四更！趁早跟我去，免得套上绳子扯拉！", gloss: "", keywords: ["阎王注定三更死","留人","命","死期"] },
  { id: "xy-wukong-s21", book: "西游记", chapter: "第一回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第一回 灵根育孕源流出 心性修持大道生", text: "今日虽不归人王法律，不惧禽兽威服，将来年老血衰，暗中有阎王老子管着，一旦身亡，可不枉生世界之中，不得久住天人之内？", gloss: "", keywords: ["人王法律","阎王老子管着","身亡","久住"] },
  { id: "xy-wukong-s22", book: "西游记", chapter: "第三十九回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十九回 一粒金丹天上得 三年故主世间生", text: "我东土古立天朝，久称上国，汝等乃下土边邦。自古道，上邦皇帝，为父为君；下邦皇帝，为臣为子。你倒未曾接我，且敢争我不拜？", gloss: "", keywords: ["上邦皇帝","为父为君","为臣为子","拜"] },
  { id: "xy-wukong-s23", book: "西游记", chapter: "第三十二回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十二回 平顶山功曹传信 莲花洞木母逢灾", text: "若是天魔，解与玉帝；若是土魔，解与土府。西方的归佛，东方的归圣。北方的解与真武，南方的解与火德。是蛟精解与海主，是鬼祟解与阎王，各有地头方向。我老孙到处里人熟，发一张批文，把他连夜解着飞跑。", gloss: "", keywords: ["天魔","解与玉帝","各有地头方向","批文"] },
  { id: "xy-wukong-s24", book: "西游记", chapter: "第三十九回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十九回 一粒金丹天上得 三年故主世间生", text: "师父说那里话？常言道，家无二主，你受他一拜儿不亏。", gloss: "", keywords: ["家无二主","受他一拜","主","分位"] },
  { id: "xy-wukong-s25", book: "西游记", chapter: "第八十回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十回 姹女育阳求配偶 心猿护主识妖邪", text: "师父，你常以思乡为念，全不似个出家人。放心且走，莫要多忧，古人云，欲求生富贵，须下死工夫。", gloss: "", keywords: ["思乡","出家人","出走","莫要多忧"] },
  { id: "xy-wukong-s26", book: "西游记", chapter: "第二十七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十七回 尸魔三戏唐三藏 圣僧恨逐美猴王", text: "师父，我回去便也罢了，只是不曾报得你的恩哩。", gloss: "", keywords: ["回去","不曾报得你的恩","逐","归"] },
  { id: "xy-wukong-s27", book: "西游记", chapter: "第六十一回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第六十一回 猪八戒助力败魔王 孙行者三调芭蕉扇", text: "不知好歹的盞草！我昨日还与你论兄弟，今日就是仇人了！仔细吃吾一棒！", gloss: "", keywords: ["昨日还与你论兄弟","今日就是仇人","绝交","结义"] },
  { id: "xy-wukong-s28", book: "西游记", chapter: "第十六回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十六回 观音院僧谋宝贝 黑风山怪窃袈裟", text: "你可知古人云，人没伤虎心，虎没伤人意。他不弄火，我怎肯弄风？", gloss: "", keywords: ["人没伤虎心","虎没伤人意","报复","相安"] },
  { id: "xy-wukong-s29", book: "西游记", chapter: "第九十七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第九十七回 金酬外护遭魔毒 圣显幽魂救本原", text: "他打是要钱哩。常言道好处安身，苦处用钱。如今与他些钱，便罢了。", gloss: "", keywords: ["好处安身","苦处用钱","钱","打点"] },
  { id: "xy-wukong-s30", book: "西游记", chapter: "第七十三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十三回 情因旧恨生灾毒 心主遭魔幸破光", text: "说那里话？古人云，在家不是贫，路上贫杀人。你是住家儿的，何以言贫！象我们这行脚僧，才是真贫哩。我和你换换，我和你换换。", gloss: "", keywords: ["在家不是贫","路上贫杀人","行脚僧","贫"] },
  { id: "xy-wukong-s31", book: "西游记", chapter: "第五十四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第五十四回 法性西来逢女国 心猿定计脱烟花", text: "师父切莫烦恼，这般富贵，不受用还待怎么哩？", gloss: "", keywords: ["富贵","不受用还待怎么","享用","欲"] },
  { id: "xy-wukong-s32", book: "西游记", chapter: "第二十四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十四回 万寿山大仙留故友 五庄观行者窃人参", text: "兄弟，你好不知止足这个东西，比不得那米食面食，撞着尽饱。象这一万年只结得三十个，我们吃他这一个，也是大有缘法，不等小可。罢罢罢！彀了！", gloss: "", keywords: ["不知止足","一万年只结得三十个","彀了","节"] },
  { id: "xy-wukong-s33", book: "西游记", chapter: "第二十三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十三回 三藏不忘本 四圣试禅心", text: "计较甚的？你要肯，便就教师父与那妇人做个亲家，你就做个倒踏门的女婿。他家这等有财有宝，一定倒陪妆奁，整治个会亲的筵席，我们也落些受用。你在此间还俗，却不是两全其美？", gloss: "", keywords: ["倒踏门的女婿","还俗","有财有宝","两全其美"] },
  { id: "xy-wukong-s34", book: "西游记", chapter: "第八十六回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十六回 木母助威征怪物 金公施法灭妖邪", text: "师父莫只管叫名字，面前有人，怕走了风讯。你既有命，我可救得你。那怪只说已将你吃了，拿个假人头哄我，我们与他恨苦相持。师父放心，且再熬熬儿，等我把那妖精弄倒，方好来解救。", gloss: "", keywords: ["莫只管叫名字","怕走了风讯","名","泄"] },
  { id: "xy-wukong-s35", book: "西游记", chapter: "第八回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八回 我佛造经传极乐 观音奉旨上长安", text: "圣经云：‘出其言善。 则千里之外应之；出其言不善，则千里之外适之。’你既有此心，待我到了东土大唐国寻一个取经的人来，教他救你。你可跟他做个徒弟，秉教伽持，入我佛门。再修正果，如何？", gloss: "", keywords: ["出其言善","千里之外应之","出其言不善","言"] },
  { id: "xy-wukong-s36", book: "西游记", chapter: "第八十三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十三回 心猿识得丹头 姹女还归本性", text: "绳捆刀砍之事，我也通看你面，还有甚话？你说！你说！说得好，就依你；说得不好，莫怪。", gloss: "", keywords: ["说得好就依你","说得不好莫怪","听","言"] },
  { id: "xy-wukong-s37", book: "西游记", chapter: "第四回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四回 官封弼马心何足 名注齐天意未宁", text: "前番勤劳，今又蒙爱，多谢！多谢！但不知上天可有此‘齐天大圣’之官衔也？", gloss: "", keywords: ["齐天大圣","官衔","名","封"] },
  { id: "xy-wukong-s38", book: "西游记", chapter: "第三十八回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十八回 婴儿问母知邪正 金木参玄见假真", text: "师父，你怎么信这呆子乱谈！人若死了，或三七五七，尽七七日，受满了阳间罪过，就转生去了，如今已死三年，如何救得！", gloss: "", keywords: ["人若死了","三七五七","转生","救不得"] },
  { id: "xy-wukong-s39", book: "西游记", chapter: "第八回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八回 我佛造经传极乐 观音奉旨上长安", text: "我已知悔了，但愿大慈悲指条门路，情愿修行。", gloss: "", keywords: ["已知悔","指条门路","情愿修行","悔"] },
  { id: "xy-wukong-s40", book: "西游记", chapter: "第八十七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十七回 凤仙郡冒天止雨 孙大圣劝善施霖", text: "你若回心向善，趁早儿念佛看经，我还替你作为；汝若仍前不改，我亦不能解释，不久天即诛之，性命不能保矣。", gloss: "", keywords: ["回心向善","仍前不改","解释","改"] },
  { id: "xy-wukong-s41", book: "西游记", chapter: "第三十三回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十三回 外道迷真性 元神助本心", text: "我是决不反悔，如有反悔，也照你四季遭瘟。", gloss: "", keywords: ["决不反悔","遭瘟","誓","悔"] },
  { id: "xy-wukong-s42", book: "西游记", chapter: "第四十一回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十一回 心猿遭火败 木母被魔擒", text: "累你远劳，不曾成得功果，且请回去，改日再谢。", gloss: "", keywords: ["不曾成得功果","累你远劳","改日再谢","徒劳"] },
  { id: "xy-wukong-s43", book: "西游记", chapter: "第八十一回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十一回 镇海寺心猿知怪 黑松林三众寻师", text: "兄弟，佛不与你众生为念。你又不知，人云锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦！师父只今日一日，明日就好了。", gloss: "", keywords: ["锄禾日当午","粒粒皆辛苦","佛不与你众生为念","苦"] },
  { id: "xy-wukong-s44", book: "西游记", chapter: "第六十七回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第六十七回 拯救驼罗禅性稳 脱离秽污道心清", text: "或者是个软柄枪。但这怪物还不会说话，想是还未归人道，阴气还重，只怕天明时阳气胜，他必要走。但走时，一定赶上，不可放他。", gloss: "", keywords: ["还不会说话","未归人道","阴气还重","物"] },

  // —— 唐三藏（续）——
  { id: "xy-tangseng-s4", book: "西游记", chapter: "第九十三回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第九十三回 给孤园问古谈因 天竺国朝王遇偶", text: "悟能悟净，休要乱说，悟空解得是无言语文字，乃是真解。", gloss: "", keywords: ["真解","无言语文字","言","解"] },
  { id: "xy-tangseng-s5", book: "西游记", chapter: "第三十八回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十八回 婴儿问母知邪正 金木参玄见假真", text: "这猴头乱说！妖精夺了人君位，怎么叫做理上不顺！", gloss: "", keywords: ["妖精夺了人君位","理上不顺","篡","位"] },
  { id: "xy-tangseng-s6", book: "西游记", chapter: "第十六回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十六回 观音院僧谋宝贝 黑风山怪窃袈裟", text: "可怜！ 我那东土，无甚宝贝，就有时，路程遥远，也不能带得。", gloss: "", keywords: ["东土","路程遥远","宝贝","故土"] },
  { id: "xy-tangseng-s7", book: "西游记", chapter: "第三十六回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十六回 心猿正处诸缘伏 劈破旁门见月明", text: "徒弟呀，西天怎么这等难行？我记得离了长安城，在路上春尽夏来，秋残冬至，有四五个年头，怎么还不能得到？", gloss: "", keywords: ["西天怎么这等难行","四五个年头","到不得","路远"] },
  { id: "xy-tangseng-s8", book: "西游记", chapter: "第二十四回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十四回 万寿山大仙留故友 五庄观行者窃人参", text: "纵有钱没处买呵，常言道，仁义值千金。教他陪你个礼，便罢了。也还不知是他不是他哩。", gloss: "", keywords: ["仁义值千金","陪礼","钱","义"] },
  { id: "xy-tangseng-s9", book: "西游记", chapter: "第十六回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十六回 观音院僧谋宝贝 黑风山怪窃袈裟", text: "你不曾理会得，古人有云，珍奇玩好之物，不可使见贪婪奸伪之人。倘若一经入目，必动其心；既动其心，必生其计。汝是个畏祸的，索之而必应其求可也；不然，则殒身灭命，皆起于此，事不小矣。", gloss: "", keywords: ["珍奇玩好之物","不可使见贪婪奸伪之人","一经入目必动其心","藏"] },
  { id: "xy-tangseng-s10", book: "西游记", chapter: "第七十四回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十四回 长庚传报魔头狠 行者施为变化能", text: "你的相貌丑陋，言语粗俗，怕冲撞了他，问不出个实信。", gloss: "", keywords: ["相貌丑陋","言语粗俗","冲撞","实信"] },
  { id: "xy-tangseng-s11", book: "西游记", chapter: "第八十八回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十八回 禅到玉华施法会 心猿木母授门人", text: "我教你见了人打个问讯，不曾教你见王子就此歪缠！常言道，物有几等物，人有几等人，如何不分个贵贱？", gloss: "", keywords: ["物有几等物","人有几等人","贵贱","分"] },
  { id: "xy-tangseng-s12", book: "西游记", chapter: "第九十六回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第九十六回 寇员外喜待高僧 唐长老不贪富贵", text: "西方佛地，贤者愚者俱无诈伪。那二老说时，我犹不信，至此果如其言。", gloss: "", keywords: ["西方佛地","贤者愚者俱无诈伪","我犹不信","果如其言"] },
  { id: "xy-tangseng-s13", book: "西游记", chapter: "第八十回", owner: "tangseng", speaker: "tangseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十回 姹女育阳求配偶 心猿护主识妖邪", text: "徒弟呀，古人云，勿以善小而不为，勿以恶小而为之，还去救他救罢。", gloss: "", keywords: ["勿以善小而不为","勿以恶小而为之","救","善"] },

  // —— 猪八戒（续）——
  { id: "xy-bajie-s2", book: "西游记", chapter: "第七十二回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七十二回 盘丝洞七情迷本 濯垢泉八戒忘形", text: "师父没主张。常言道，三人出外，小的儿苦，你况是个父辈，我等俱是弟子。古书云，有事弟子服其劳，等我老猪去。", gloss: "", keywords: ["师徒","有事弟子服其劳","父辈","代劳"] },
  { id: "xy-bajie-s3", book: "西游记", chapter: "第三十九回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十九回 一粒金丹天上得 三年故主世间生", text: "你在半空中相打相嚷，我瞥瞥眼就见两个师父，也不知谁真谁假。", gloss: "", keywords: ["真假","两个师父","谁真谁假","眼"] },
  { id: "xy-bajie-s4", book: "西游记", chapter: "第三十七回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十七回 鬼王夜谒唐三藏 悟空神化引婴儿", text: "师父莫要胡缠，做个梦便罢了，怎么只管当真？", gloss: "", keywords: ["梦","当真","真假","胡缠"] },
  { id: "xy-bajie-s5", book: "西游记", chapter: "第四十回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十回 婴儿戏化禅心乱 猿马刀归木母空", text: "正是，趁早散了，各寻头路，多少是好。那西天路无穷无尽，几时能到得！", gloss: "", keywords: ["趁早散了","各寻头路","西天路无穷无尽","散伙"] },
  { id: "xy-bajie-s6", book: "西游记", chapter: "第八十八回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十八回 禅到玉华施法会 心猿木母授门人", text: "哥的恩也有，善也有，却只是外施仁义，内包祸心。但与老猪走，就要作践人。", gloss: "", keywords: ["外施仁义","内包祸心","作践人","交情"] },
  { id: "xy-bajie-s7", book: "西游记", chapter: "第二十一回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十一回 护法设庄留大圣 须弥灵吉定风魔", text: "正是这等，讨一个死活的实信。假若师父死了，各人好寻头干事；若是未死，我们好竭力尽心。", gloss: "", keywords: ["死活的实信","各人好寻头干事","竭力尽心","散"] },
  { id: "xy-bajie-s8", book: "西游记", chapter: "第四十九回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十九回 三藏有灾沉水宅 观音救难现鱼篮", text: "我的儿，你真个有些灵感，怎么就晓得我是半路出家的？", gloss: "", keywords: ["半路出家","灵感","来历","出身"] },
  { id: "xy-bajie-s9", book: "西游记", chapter: "第二十三回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十三回 三藏不忘本 四圣试禅心", text: "我虽然人物丑，勤紧有些功。若言千顷地，不用使牛耕。只消一顿钯，布种及时生。没雨能求雨，无风会唤风。房舍若嫌矮，起上二三层。 地下不扫扫一扫，阴沟不通通一通。家长里短诸般事，踢天弄井我皆能。", gloss: "", keywords: ["人物丑","勤紧有些功","用","能"] },
  { id: "xy-bajie-s10", book: "西游记", chapter: "第六十一回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第六十一回 猪八戒助力败魔王 孙行者三调芭蕉扇", text: "这正是俗语云，大海里翻了豆腐船，汤里来，水里去。如今难得他扇子，如何保得师父过山？且回去，转路走他娘罢！", gloss: "", keywords: ["大海里翻了豆腐船","汤里来水里去","转路走","白费"] },
  { id: "xy-bajie-s11", book: "西游记", chapter: "第二十三回", owner: "bajie", speaker: "bajie", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十三回 三藏不忘本 四圣试禅心", text: "哥啊，你只知道你走路轻省，那里管别人累坠？自过了流沙河，这一向爬山过岭，身挑着重担，老大难挨也！须是寻个人家，一则化些茶饭，二则养养精神，才是个道理。", gloss: "", keywords: ["你走路轻省","那里管别人累坠","身挑着重担","累"] },

  // —— 沙悟净（续）——
  { id: "xy-shaseng-s2", book: "西游记", chapter: "第三十九回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十九回 一粒金丹天上得 三年故主世间生", text: "果然那一个是怪，那一个是我的师父？你指与我，我好打他。", gloss: "", keywords: ["真假","那一个是我的师父","辨认","两个师父"] },
  { id: "xy-shaseng-s3", book: "西游记", chapter: "第四十八回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十八回 魔弄寒风飘大雪 僧思拜佛履层冰", text: "就行也不是话，再住也不是话，口说无凭，耳闻不如眼见。我背了马，且请师父亲去看看。", gloss: "", keywords: ["口说无凭","耳闻不如眼见","信","眼见"] },
  { id: "xy-shaseng-s4", book: "西游记", chapter: "第三十七回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第三十七回 鬼王夜谒唐三藏 悟空神化引婴儿", text: "不信直中直，须防仁不仁。我们打起火，开了门，看看如何便是。", gloss: "", keywords: ["信与疑","不信直中直","须防仁不仁","疑"] },
  { id: "xy-shaseng-s5", book: "西游记", chapter: "第四十三回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十三回 黑河妖孽擒僧去 西洋龙子捉鼍回", text: "二哥，你和我一般，拙口钝腮，不要惹大哥热擦。且只捱肩磨担，终须有日成功也。", gloss: "", keywords: ["拙口钝腮","捱肩磨担","终须有日成功","忍"] },
  { id: "xy-shaseng-s6", book: "西游记", chapter: "第五十九回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第五十九回 唐三藏路阻火焰山 孙行者一调芭蕉扇", text: "有经处有火，无火处无经，诚是进退两难！", gloss: "", keywords: ["有经处有火","无火处无经","进退两难","难"] },

  // —— 观世音（续）——
  { id: "xy-guanyin-s2", book: "西游记", chapter: "第五十七回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第五十七回 真行者落伽山诉苦 假猴王水帘洞誊文", text: "既如此，你休发急，教悟空与你同去花果山看看。是真难灭，是假易除，到那里自见分晓。", gloss: "", keywords: ["真假","是真难灭","是假易除","分晓"] },
  { id: "xy-guanyin-s3", book: "西游记", chapter: "第十五回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十五回 蛇盘山诸神暗佑 鹰愁涧意马收缰", text: "你这猴子！你不遵教令，不受正果，若不如此拘系你，你又诳上欺天，知甚好歹！再似从前撞出祸来，有谁收管？须是得这个魔头，你才肯入我瑜伽之门路哩！", gloss: "", keywords: ["拘系","不遵教令","紧箍","收管"] },
  { id: "xy-guanyin-s4", book: "西游记", chapter: "第四十二回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十二回 大圣殷勤拜南海 观音慈善缚红孩", text: "这篇咒，不是《紧箍儿咒》咒你的，是《金箍儿咒》咒那童子的。", gloss: "", keywords: ["金箍儿咒","紧箍儿咒","咒","箍"] },
  { id: "xy-guanyin-s5", book: "西游记", chapter: "第四十二回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十二回 大圣殷勤拜南海 观音慈善缚红孩", text: "你好自在啊！我也不要你的衣服、铁棒、金箍，只将你那脑后救命的毫毛拔一根与我作当罢。", gloss: "", keywords: ["救命的毫毛","作当","抵押","索取"] },
  { id: "xy-guanyin-s6", book: "西游记", chapter: "第十二回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十二回 玄奘秉诚建大会 观音显象化金蝉", text: "袈裟有好处，有不好处；有要钱处，有不要钱处。", gloss: "", keywords: ["袈裟","有要钱处","有不要钱处","取舍"] },
  { id: "xy-guanyin-s7", book: "西游记", chapter: "第十二回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十二回 玄奘秉诚建大会 观音显象化金蝉", text: "你这小乘教法，度不得亡者超升，只可浑俗和光而已。我有大乘佛法三藏，能超亡者升天，能度难人脱苦，能修无量寿身，能作无来无去。", gloss: "", keywords: ["小乘教法","大乘佛法三藏","超亡者升天","度"] },

  // —— 如来（续）——
  { id: "xy-rulai-s2", book: "西游记", chapter: "第七回", owner: "rulai", speaker: "rulai", workId: "bk-xiyouji", worldId: "xiyou", locus: "第七回 八卦炉中逃大圣 五行山下定心猿", text: "我与你打个赌赛；你若有本事，一筋斗打出我这右手掌中，算你赢，再不用动刀兵苦争战，就请玉帝到西方居住，把天宫让你；若不能打出手掌，你还下界为妖，再修几劫，却来争吵。", gloss: "", keywords: ["赌赛","筋斗","手掌","天宫让你"] },

  // —— 牛魔王（续）——
  { id: "xy-niumowang-s2", book: "西游记", chapter: "第六十回", owner: "niumowang", speaker: "niumowang", workId: "bk-xiyouji", worldId: "xiyou", locus: "第六十回 牛魔王罢战赴华筵 孙行者二调芭蕉扇", text: "这猢狲不识起倒！饶了你，倒还不走，反来缠我！甚么周济周济！", gloss: "", keywords: ["不识起倒","饶了你","缠","周济"] },

  // —— 须菩提祖师（续）——
  { id: "xy-zushi-s1", book: "西游记", chapter: "第二回", owner: "zushi", speaker: "zushi", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二回 悟彻菩提真妙理 断魔归本合元神", text: "此亦无难，只是你比他人不同，故传不得。", gloss: "", keywords: ["师徒","传不得","比他人不同","择徒"] },
  { id: "xy-zushi-s2", book: "西游记", chapter: "第一回", owner: "zushi", speaker: "zushi", workId: "bk-xiyouji", worldId: "xiyou", locus: "第一回 灵根育孕源流出 心性修持大道生", text: "你是那方人氏？且说个乡贯姓名明白，再拜。", gloss: "", keywords: ["那方人氏","乡贯姓名","来历","拜"] },

  // —— 太白金星（续）——
  { id: "xy-jinxing-s1", book: "西游记", chapter: "第八十三回", owner: "jinxing", speaker: "jinxing", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八十三回 心猿识得丹头 姹女还归本性", text: "古人云，万事从宽。你干事忒紧了些儿，就把他捆住，又要杀他。这猴子是个有名的赖皮，你如今教我怎的处！若论你令郎讲起来，虽是恩女，不是亲女，却也晚亲义重，不拘怎生折辨，你也有个罪名。", gloss: "", keywords: ["万事从宽","干事忒紧","罪名","宽严"] },

  // —— 换处一拍之言（2026-10-23 补，五处各一）——
  //
  // 此处卡逐处翻一句原著原话（演示与看图同享）。十八停按 `chapter` 对 `locus`
  // 配话，先查得四处无话：高老庄（第十八回）、流沙河（第二十二回）、车迟国
  // （第四十五回）、小雷音（第六十五回）——上面 89 条是按母题覆盖选的，不按
  // 名句，这几回恰好漏了。今自 `public/siku/quotable/` 的抽取产物里各补一条
  // **此处当场的话**：蓝本对白照录，`book`/`workId` 同前，locus 仍连处境。
  // id 沿 `-q` 尾（quote 之义），不与将来正式抽取的 id 相撞。
  { id: "xy-wukong-q1", book: "西游记", chapter: "第十八回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第十八回 观音院唐僧脱难 高老庄大圣除魔", text: "老高，你空长了许大年纪，还不省事！若专以相貌取人，干净错了。我老孙丑自丑，却有些本事，替你家擒得妖精，拿住你那女婿，还了你女儿，便是好事，何必谆谆以相貌为言！", gloss: "", keywords: ["以相貌取人","相貌","本事","错"] },
  { id: "xy-shaseng-q1", book: "西游记", chapter: "第二十二回", owner: "shaseng", speaker: "shaseng", workId: "bk-xiyouji", worldId: "xiyou", locus: "第二十二回 八戒大战流沙河 木叉奉法收悟净", text: "弟子向蒙菩萨教化，指河为姓，与我起了法名，唤做沙悟净，岂有不从师父之理！", gloss: "", keywords: ["指河为姓","沙悟净","师父","从"] },
  { id: "xy-wukong-q2", book: "西游记", chapter: "第四十五回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第四十五回 三清观大圣留名 车迟国猴王显法", text: "我与你都上坛祈雨，知雨是你的，是我的？不见是谁的功绩了。", gloss: "", keywords: ["祈雨","功绩","赌胜","争"] },
  { id: "xy-wukong-q3", book: "西游记", chapter: "第六十五回", owner: "wukong", speaker: "wukong", workId: "bk-xiyouji", worldId: "xiyou", locus: "第六十五回 妖邪假设小雷音 四众皆遭大厄难", text: "师父莫恼，你再看看。山门上乃四个字，你怎么只念出三个来，倒还怪我！", gloss: "", keywords: ["小雷音","四个字","假","恼"] },
  // 南海（第八回）的一句：上文 xy-wukong-s39 那条 owner 记成了悟空，实是**菩萨劝
  // 行者**的话（「我领了佛旨，上东土寻取经人……」），归错了人。此处卡按「当场
  // 在此之人」配话，归错便配不出；正一条归观世音，话又是南海这一折的正主说的。
  { id: "xy-guanyin-q1", book: "西游记", chapter: "第八回", owner: "guanyin", speaker: "guanyin", workId: "bk-xiyouji", worldId: "xiyou", locus: "第八回 我佛造经传极乐 观音奉旨上长安", text: "我领了佛旨，上东土寻取经人。你可跟他做个徒弟，往西天走一遭来，将功折罪，管教你脱离灾瘴。", gloss: "", keywords: ["领佛旨","取经人","将功折罪","劝"] },
];
