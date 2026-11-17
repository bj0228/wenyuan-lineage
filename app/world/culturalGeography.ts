/**
 * 时空文脉地图的首批策展数据。
 *
 * 这里的“地点”不是给一本书钉一个唯一坐标，而是记录人物在某时某地发生的文化活动：
 * 讲学、撰写、编纂、刊刻或传播。地图层据此把时间、地点、人物、典籍和思想同时展开。
 * 当前数据用于交互原型；后续可逐条接入 CHGIS/CBDB 地名编码与出处。
 */

export const GEO_ERAS = ["全部", "先秦", "秦汉", "魏晋南北朝", "隋唐", "宋元", "明清", "近现代"] as const;
export type GeoEra = (typeof GEO_ERAS)[number];

export type GeoRecord = {
  era: Exclude<GeoEra, "全部">;
  date: string;
  people: string[];
  books: string[];
  ideas: string[];
  activity: "讲学" | "撰写" | "编纂" | "刊刻" | "传播" | "论争";
  note: string;
};

export type GeoPlace = {
  id: string;
  name: string;
  historical: string;
  region: string;
  lon: number;
  lat: number;
  records: GeoRecord[];
};

export const GEO_PLACES: GeoPlace[] = [
  {
    id: "qufu", name: "曲阜", historical: "鲁", region: "齐鲁",
    lon: 116.99, lat: 35.59,
    records: [
      { era: "先秦", date: "前6—前5世纪", people: ["孔子"], books: ["《论语》", "六经"], ideas: ["仁", "礼", "有教无类"], activity: "讲学", note: "孔门讲学与弟子传述共同构成早期儒学的核心发生地。" },
      { era: "秦汉", date: "前2世纪", people: ["孔安国"], books: ["《古文尚书》", "《孔子家语》"], ideas: ["经学", "古文传统"], activity: "编纂", note: "汉代经学以孔氏家学重新组织先秦经典的解释传统。" },
    ],
  },
  {
    id: "zoucheng", name: "邹城", historical: "邹", region: "齐鲁",
    lon: 116.97, lat: 35.40,
    records: [
      { era: "先秦", date: "前4—前3世纪", people: ["孟子"], books: ["《孟子》"], ideas: ["性善", "仁政", "民贵君轻"], activity: "讲学", note: "孟学由齐鲁出发，在游说诸侯的过程中把孔门伦理转化为政治论说。" },
    ],
  },
  {
    id: "luoyang", name: "洛阳", historical: "雒邑／洛京", region: "河洛",
    lon: 112.45, lat: 34.62,
    records: [
      { era: "先秦", date: "约前6世纪", people: ["老子"], books: ["《道德经》"], ideas: ["道", "无为", "反者道之动"], activity: "撰写", note: "传统叙事把老子守藏与周室典籍联系在河洛文化中心。" },
      { era: "秦汉", date: "1—2世纪", people: ["班固", "许慎"], books: ["《汉书》", "《说文解字》"], ideas: ["断代史", "文字训诂"], activity: "编纂", note: "东汉都城汇聚史学编纂与小学传统，知识由国家典藏体系向外传播。" },
      { era: "宋元", date: "11世纪", people: ["程颢", "程颐"], books: ["《二程遗书》"], ideas: ["天理", "格物", "洛学"], activity: "讲学", note: "二程讲学使河洛成为北宋理学的重要思想节点。" },
    ],
  },
  {
    id: "xian", name: "西安", historical: "长安", region: "关中",
    lon: 108.94, lat: 34.34,
    records: [
      { era: "秦汉", date: "前2—1世纪", people: ["司马迁", "董仲舒"], books: ["《史记》", "《春秋繁露》"], ideas: ["纪传史学", "天人感应", "大一统"], activity: "编纂", note: "帝国都城把诸地域材料汇入国家叙事与经学体系。" },
      { era: "隋唐", date: "7—9世纪", people: ["玄奘", "韩愈", "柳宗元"], books: ["《大唐西域记》", "《昌黎先生集》"], ideas: ["佛典翻译", "古文运动", "道统"], activity: "传播", note: "丝路、译场与科举文教使长安成为中外知识转换和文体革新的枢纽。" },
    ],
  },
  {
    id: "dunhuang", name: "敦煌", historical: "沙州", region: "河西",
    lon: 94.66, lat: 40.14,
    records: [
      { era: "隋唐", date: "7—10世纪", people: ["译经僧", "写经生"], books: ["敦煌写本", "佛经变文"], ideas: ["佛教中国化", "俗讲", "跨语际传播"], activity: "传播", note: "写本、壁画与商旅网络共同记录经典从印度—西域进入中土后的在地转化。" },
    ],
  },
  {
    id: "chengdu", name: "成都", historical: "益州", region: "巴蜀",
    lon: 104.06, lat: 30.67,
    records: [
      { era: "隋唐", date: "8—9世纪", people: ["杜甫", "薛涛"], books: ["《杜工部集》", "《薛涛诗》"], ideas: ["诗史", "女性书写", "地方文学"], activity: "撰写", note: "安史乱后的人口迁徙使巴蜀成为唐代诗歌生产与保存的重要空间。" },
      { era: "宋元", date: "10—12世纪", people: ["宋代刻工", "文人书商"], books: ["蜀刻本", "经史注本"], ideas: ["雕版印刷", "文本传播"], activity: "刊刻", note: "蜀地刻书推动经典从少数抄本转向更广泛的区域流通。" },
    ],
  },
  {
    id: "kaifeng", name: "开封", historical: "汴京", region: "中原",
    lon: 114.31, lat: 34.80,
    records: [
      { era: "宋元", date: "10—12世纪", people: ["欧阳修", "司马光", "苏轼"], books: ["《新五代史》", "《资治通鉴》", "《东坡全集》"], ideas: ["史学批评", "以史资治", "古文"], activity: "编纂", note: "北宋都城以馆阁、书局和文人交游连接国家编纂与私人著述。" },
    ],
  },
  {
    id: "nanjing", name: "南京", historical: "建康／金陵", region: "江南",
    lon: 118.80, lat: 32.06,
    records: [
      { era: "魏晋南北朝", date: "4—6世纪", people: ["刘勰", "萧统"], books: ["《文心雕龙》", "《昭明文选》"], ideas: ["文学本体", "文章分类", "声律"], activity: "编纂", note: "南朝都城的宫廷文教与士族文化促进了文学理论和总集编纂。" },
      { era: "明清", date: "14—17世纪", people: ["王世贞", "顾炎武"], books: ["《弇州山人四部稿》", "《日知录》"], ideas: ["复古", "经世致用", "遗民思想"], activity: "论争", note: "政治中心与江南出版网络在明清易代前后持续塑造思想论争。" },
    ],
  },
  {
    id: "shaoxing", name: "绍兴", historical: "会稽", region: "浙东",
    lon: 120.58, lat: 30.00,
    records: [
      { era: "魏晋南北朝", date: "4世纪", people: ["王羲之", "谢安"], books: ["《兰亭集序》"], ideas: ["玄学清谈", "生命意识", "书法美学"], activity: "撰写", note: "会稽山水、士族交游和玄学清谈共同进入兰亭书写。" },
      { era: "明清", date: "16—17世纪", people: ["王阳明", "黄宗羲"], books: ["《传习录》", "《明夷待访录》"], ideas: ["致良知", "浙东史学", "政治批判"], activity: "讲学", note: "讲会和师友网络使心学及其后续批判在浙东形成持续文脉。" },
      { era: "近现代", date: "20世纪", people: ["鲁迅"], books: ["《呐喊》", "《朝花夕拾》"], ideas: ["国民性批判", "现代文学"], activity: "撰写", note: "地方记忆被重新写入现代文学与启蒙叙事。" },
    ],
  },
  {
    id: "hangzhou", name: "杭州", historical: "临安", region: "江南",
    lon: 120.16, lat: 30.25,
    records: [
      { era: "宋元", date: "12—13世纪", people: ["陆游", "周密"], books: ["《剑南诗稿》", "《武林旧事》"], ideas: ["故国书写", "城市记忆", "南宋文化"], activity: "撰写", note: "南渡后的政治中心使中原传统在江南都市环境中重组。" },
      { era: "明清", date: "17—18世纪", people: ["张岱", "袁枚"], books: ["《陶庵梦忆》", "《随园诗话》"], ideas: ["城市记忆", "性灵"], activity: "传播", note: "书坊、园林与文人社群把文学趣味扩散至更广阔的读者网络。" },
    ],
  },
  {
    id: "wuyishan", name: "武夷山", historical: "建阳／崇安", region: "闽北",
    lon: 118.02, lat: 27.76,
    records: [
      { era: "宋元", date: "12—14世纪", people: ["朱熹", "书坊刻工"], books: ["《四书章句集注》", "建本经籍"], ideas: ["理学", "四书体系", "书院教育"], activity: "刊刻", note: "讲学空间与建阳刻书业叠合，使朱子学由地方书院进入跨区域教育体系。" },
    ],
  },
  {
    id: "beijing", name: "北京", historical: "大都／京师", region: "燕赵",
    lon: 116.40, lat: 39.90,
    records: [
      { era: "宋元", date: "13—14世纪", people: ["关汉卿", "马致远"], books: ["元杂剧", "《汉宫秋》"], ideas: ["市民戏曲", "多民族都市"], activity: "撰写", note: "大都的勾栏、市民与跨地域人口为元曲提供新的表演空间。" },
      { era: "明清", date: "15—18世纪", people: ["纪昀", "曹雪芹"], books: ["《四库全书总目》", "《红楼梦》"], ideas: ["知识分类", "考据", "世情小说"], activity: "编纂", note: "宫廷编纂、藏书制度和城市阅读共同形成清代知识中心。" },
      { era: "近现代", date: "20世纪", people: ["胡适", "陈独秀"], books: ["《新青年》", "《尝试集》"], ideas: ["白话文", "新文化", "科学与民主"], activity: "论争", note: "大学、报刊与出版机构把思想论争转化为全国性的公共议题。" },
    ],
  },
  {
    id: "shanghai", name: "上海", historical: "沪上", region: "江海",
    lon: 121.47, lat: 31.23,
    records: [
      { era: "明清", date: "19世纪", people: ["王韬", "严复"], books: ["《循环日报》", "《天演论》"], ideas: ["西学东渐", "报刊公共空间", "翻译"], activity: "传播", note: "口岸出版和翻译网络加速了中西概念的再解释与全国流通。" },
      { era: "近现代", date: "20世纪", people: ["茅盾", "巴金"], books: ["《子夜》", "《家》"], ideas: ["现代都市", "家庭批判", "革命文学"], activity: "刊刻", note: "现代出版业把城市经验、文学社团与大众读者连接起来。" },
    ],
  },
  {
    id: "changsha", name: "长沙", historical: "潭州", region: "湖湘",
    lon: 112.94, lat: 28.23,
    records: [
      { era: "先秦", date: "前3世纪", people: ["屈原"], books: ["《楚辞》"], ideas: ["香草美人", "楚地祭歌", "忧患意识"], activity: "撰写", note: "楚地巫风、方言与政治放逐经验共同塑造骚体传统。" },
      { era: "明清", date: "17—19世纪", people: ["王夫之", "魏源"], books: ["《读通鉴论》", "《海国图志》"], ideas: ["经世致用", "历史批判", "开眼看世界"], activity: "撰写", note: "湖湘学术把史论、经世与近代世界知识连续起来。" },
      { era: "近现代", date: "20世纪", people: ["毛泽东", "徐特立"], books: ["《湘江评论》"], ideas: ["社会改造", "新民学会", "大众教育"], activity: "传播", note: "新式学校、社团与报刊使湖湘经世传统转化为现代政治行动。" },
    ],
  },
  {
    id: "guangzhou", name: "广州", historical: "番禺", region: "岭南",
    lon: 113.26, lat: 23.13,
    records: [
      { era: "明清", date: "17—19世纪", people: ["屈大均", "康有为"], books: ["《广东新语》", "《新学伪经考》"], ideas: ["地方知识", "今文经学", "变法"], activity: "论争", note: "海贸口岸与岭南经学相遇，推动传统经学向制度改革论述转换。" },
      { era: "近现代", date: "20世纪", people: ["孙中山"], books: ["《建国方略》"], ideas: ["共和", "现代国家", "实业计划"], activity: "传播", note: "侨民、海港与革命组织使岭南成为跨国政治思想的重要入口。" },
    ],
  },
  {
    id: "guiyang", name: "贵阳", historical: "龙场", region: "黔中",
    lon: 106.63, lat: 26.65,
    records: [
      { era: "明清", date: "1508年前后", people: ["王阳明"], books: ["《传习录》"], ideas: ["心即理", "知行合一", "致良知"], activity: "讲学", note: "贬谪、边地经验与地方讲学构成阳明心学转折的重要空间。" },
    ],
  },
  { id: "zibo", name: "淄博", historical: "临淄", region: "齐鲁", lon: 118.05, lat: 36.81, records: [
    { era: "先秦", date: "前4—前3世纪", people: ["荀子", "邹衍", "淳于髡"], books: ["《荀子》", "《史记·孟子荀卿列传》"], ideas: ["稷下学宫", "名辩", "阴阳五行"], activity: "讲学", note: "稷下汇聚诸家，形成跨学派论辩与讲学中心。" },
  ] },
  { id: "anyang", name: "安阳", historical: "殷墟", region: "中原", lon: 114.39, lat: 36.10, records: [
    { era: "先秦", date: "商代晚期", people: ["商代卜人", "史官"], books: ["甲骨卜辞"], ideas: ["占卜", "王权", "早期文字"], activity: "撰写", note: "甲骨记录祭祀、战争与政事，构成早期书写传统。" },
  ] },
  { id: "quyuan", name: "秭归", historical: "归州", region: "荆楚", lon: 110.98, lat: 30.83, records: [
    { era: "先秦", date: "前4—前3世纪", people: ["屈原"], books: ["《离骚》", "《九章》"], ideas: ["楚辞", "放逐", "香草美人"], activity: "传播", note: "屈原故里与楚辞记忆在后世地方文化中相互交织。" },
  ] },
  { id: "hanzhong", name: "汉中", historical: "汉中郡", region: "秦巴", lon: 107.02, lat: 33.07, records: [
    { era: "秦汉", date: "前3—前2世纪", people: ["刘邦", "张良", "韩信"], books: ["《史记·高祖本纪》", "《汉书·高帝纪》"], ideas: ["楚汉战争", "汉家制度", "战略地理"], activity: "传播", note: "汉中为楚汉之际的重要政治与军事基地，史传以此连接关中与巴蜀。" },
  ] },
  { id: "nanyang", name: "南阳", historical: "南阳郡", region: "中原", lon: 112.53, lat: 32.99, records: [
    { era: "秦汉", date: "1—2世纪", people: ["张衡", "张仲景"], books: ["《二京赋》", "《伤寒杂病论》"], ideas: ["天文历算", "医学辨证", "汉赋"], activity: "撰写", note: "南阳人物在汉代科学、医学与文学书写中留下多条传统。" },
  ] },
  { id: "xuzhou", name: "徐州", historical: "彭城", region: "淮泗", lon: 117.19, lat: 34.26, records: [
    { era: "秦汉", date: "前2—前1世纪", people: ["刘向", "刘歆"], books: ["《说苑》", "《七略》"], ideas: ["校书", "目录学", "汉代经学"], activity: "传播", note: "以彭城籍贯连接两汉校书传统及其在都城的编纂活动。" },
  ] },
  { id: "lushan", name: "庐山", historical: "匡庐", region: "江州", lon: 115.98, lat: 29.58, records: [
    { era: "魏晋南北朝", date: "4—5世纪", people: ["慧远", "陶渊明"], books: ["《沙门不敬王者论》", "《陶渊明集》"], ideas: ["佛教社群", "隐逸", "山林文化"], activity: "讲学", note: "东林寺及周边士人活动使庐山成为佛教与隐逸文化交汇之地。" },
  ] },
  { id: "suzhou", name: "苏州", historical: "吴郡／平江", region: "江南", lon: 120.62, lat: 31.32, records: [
    { era: "魏晋南北朝", date: "3—5世纪", people: ["陆机", "顾恺之"], books: ["《文赋》", "《洛神赋图》"], ideas: ["文学创作论", "绘画传神", "江南士族"], activity: "传播", note: "吴地士族的文学与书画传统在南北交流中持续扩展。" },
    { era: "明清", date: "15—17世纪", people: ["文徵明", "唐寅", "冯梦龙"], books: ["《警世通言》", "《古今小说》"], ideas: ["吴门画派", "话本小说", "城市出版"], activity: "刊刻", note: "江南城市的书画社群与出版业推动文学艺术流通。" },
  ] },
  { id: "yongzhou", name: "永州", historical: "零陵", region: "湖湘", lon: 111.61, lat: 26.42, records: [
    { era: "隋唐", date: "9世纪", people: ["柳宗元"], books: ["《永州八记》", "《柳河东集》"], ideas: ["山水散文", "贬谪文学", "古文运动"], activity: "撰写", note: "柳宗元谪居永州期间写下山水游记与大量政论诗文。" },
  ] },
  { id: "yangzhou", name: "扬州", historical: "广陵", region: "江淮", lon: 119.42, lat: 32.39, records: [
    { era: "隋唐", date: "8世纪", people: ["鉴真", "李白", "杜牧"], books: ["《唐大和上东征传》", "《樊川文集》"], ideas: ["东亚佛教交流", "运河都市", "唐诗"], activity: "传播", note: "水陆交通与海上往来使扬州成为唐代宗教和文学交流节点。" },
    { era: "明清", date: "18世纪", people: ["郑燮", "金农", "汪士慎"], books: ["《板桥集》", "《冬心先生集》"], ideas: ["扬州八怪", "书画市场", "文人个性"], activity: "传播", note: "盐商、园林与艺术市场构成清代书画传播环境。" },
  ] },
  { id: "lanzhou", name: "兰州", historical: "金城", region: "陇右", lon: 103.83, lat: 36.06, records: [
    { era: "隋唐", date: "7—9世纪", people: ["玄奘", "行旅僧"], books: ["《大唐西域记》", "唐代行记"], ideas: ["丝路交通", "佛教传播", "边塞书写"], activity: "传播", note: "陇右交通线连接关中与河西，承载行旅和经典流通。" },
  ] },
  { id: "fuzhou", name: "福州", historical: "闽都", region: "闽东", lon: 119.30, lat: 26.08, records: [
    { era: "宋元", date: "11—13世纪", people: ["曾巩", "陈襄"], books: ["《元丰类稿》", "《古灵集》"], ideas: ["地方文教", "宋代古文", "书院"], activity: "传播", note: "宋代闽地官学与文教网络连接地方和朝廷。" },
    { era: "明清", date: "19世纪", people: ["林则徐", "严复"], books: ["《海国图志》", "《天演论》"], ideas: ["海防", "西学翻译", "近代改革"], activity: "传播", note: "闽籍人物通过海防、译书和报刊进入近代公共讨论。" },
  ] },
  { id: "quanzhou", name: "泉州", historical: "刺桐", region: "闽南", lon: 118.59, lat: 24.91, records: [
    { era: "宋元", date: "12—14世纪", people: ["赵汝适", "海商", "译者"], books: ["《诸蕃志》"], ideas: ["海上丝路", "海外知识", "跨文化贸易"], activity: "编纂", note: "海港贸易与外来知识进入宋元地理记述。" },
  ] },
  { id: "jiujiang", name: "九江", historical: "江州", region: "赣北", lon: 116.00, lat: 29.71, records: [
    { era: "隋唐", date: "9世纪", people: ["白居易"], books: ["《琵琶行》", "《白氏长庆集》"], ideas: ["贬谪", "新乐府", "民生叙事"], activity: "撰写", note: "白居易谪居江州时将地方听闻写入诗歌。" },
  ] },
  { id: "huangzhou", name: "黄冈", historical: "黄州", region: "江汉", lon: 114.87, lat: 30.45, records: [
    { era: "宋元", date: "11世纪", people: ["苏轼"], books: ["《赤壁赋》", "《念奴娇·赤壁怀古》"], ideas: ["旷达", "贬谪文学", "历史想象"], activity: "撰写", note: "黄州谪居构成苏轼诗文风格转折的重要经历。" },
  ] },
  { id: "emei", name: "峨眉山", historical: "峨眉", region: "巴蜀", lon: 103.48, lat: 29.60, records: [
    { era: "隋唐", date: "8世纪", people: ["李白"], books: ["《峨眉山月歌》"], ideas: ["山水诗", "蜀地记忆", "行旅"], activity: "撰写", note: "峨眉意象进入李白早期蜀地诗歌。" },
  ] },
  { id: "jinhua", name: "金华", historical: "婺州", region: "浙中", lon: 119.65, lat: 29.08, records: [
    { era: "宋元", date: "12—13世纪", people: ["吕祖谦", "陈亮"], books: ["《东莱博议》", "《龙川文集》"], ideas: ["浙东学术", "经世", "理学论辩"], activity: "讲学", note: "婺州学术联系理学、史学与经世论述。" },
  ] },
  { id: "ningbo", name: "宁波", historical: "明州／庆元", region: "浙东", lon: 121.55, lat: 29.87, records: [
    { era: "宋元", date: "12—13世纪", people: ["王应麟", "史浩"], books: ["《困学纪闻》", "《玉海》"], ideas: ["浙东史学", "目录考据", "海港交流"], activity: "编纂", note: "明州士人和海港贸易共同塑造浙东知识网络。" },
    { era: "明清", date: "17世纪", people: ["黄宗羲", "万斯同"], books: ["《明儒学案》", "《明史稿》"], ideas: ["学案体", "史学考证", "政治批判"], activity: "讲学", note: "余姚及四明地区的师友网络推动明清之际思想整理。" },
  ] },
  { id: "huizhou", name: "黄山", historical: "徽州", region: "皖南", lon: 118.34, lat: 29.72, records: [
    { era: "明清", date: "17—18世纪", people: ["戴震", "江永", "程瑶田"], books: ["《孟子字义疏证》", "《古韵标准》"], ideas: ["皖派考据", "训诂", "音韵"], activity: "讲学", note: "徽州学术和书籍网络为清代考据学提供重要土壤。" },
  ] },
  { id: "tianjin", name: "天津", historical: "津门", region: "燕赵", lon: 117.20, lat: 39.13, records: [
    { era: "近现代", date: "20世纪", people: ["梁启超", "李叔同", "张伯苓"], books: ["《饮冰室合集》", "《二十世纪大舞台》"], ideas: ["新式教育", "公共舆论", "艺术教育"], activity: "传播", note: "新式学校与报刊连接北方城市和全国文化讨论。" },
  ] },
  { id: "wuhan", name: "武汉", historical: "武昌／汉口", region: "江汉", lon: 114.31, lat: 30.59, records: [
    { era: "明清", date: "19世纪", people: ["张之洞", "辜鸿铭"], books: ["《劝学篇》", "《张文襄公全集》"], ideas: ["中体西用", "洋务", "新式学堂"], activity: "传播", note: "晚清学堂、工厂与报刊推动新旧知识交会。" },
    { era: "近现代", date: "20世纪", people: ["闻一多", "方方"], books: ["《死水》", "《武汉日记》"], ideas: ["现代诗", "城市书写", "公共记忆"], activity: "传播", note: "大学与城市出版空间承载现代文学和公共书写。" },
  ] },
];

export type GeoRoute = {
  era: Exclude<GeoEra, "全部">;
  from: string;
  to: string;
  label: string;
  rel: "传承" | "迁徙" | "刊刻传播" | "中西转译";
};

export const GEO_ROUTES: GeoRoute[] = [
  { era: "先秦", from: "qufu", to: "zoucheng", label: "孔门伦理向孟学政治论说演进", rel: "传承" },
  { era: "先秦", from: "changsha", to: "nanjing", label: "楚辞传统进入南朝文学理论", rel: "传承" },
  { era: "秦汉", from: "qufu", to: "xian", label: "齐鲁经学汇入长安国家学术", rel: "迁徙" },
  { era: "秦汉", from: "luoyang", to: "xian", label: "两京典藏与史学编纂", rel: "传承" },
  { era: "魏晋南北朝", from: "luoyang", to: "nanjing", label: "衣冠南渡与玄学、文学南移", rel: "迁徙" },
  { era: "魏晋南北朝", from: "nanjing", to: "shaoxing", label: "士族交游连接建康与会稽", rel: "迁徙" },
  { era: "隋唐", from: "dunhuang", to: "xian", label: "丝路写本与长安译场", rel: "中西转译" },
  { era: "隋唐", from: "xian", to: "chengdu", label: "安史乱后文人入蜀", rel: "迁徙" },
  { era: "宋元", from: "kaifeng", to: "hangzhou", label: "南渡：制度、典籍与文人重心南移", rel: "迁徙" },
  { era: "宋元", from: "wuyishan", to: "hangzhou", label: "建本推动理学经典传播", rel: "刊刻传播" },
  { era: "宋元", from: "luoyang", to: "wuyishan", label: "洛学进入朱子理学体系", rel: "传承" },
  { era: "明清", from: "guiyang", to: "shaoxing", label: "龙场悟道与阳明学讲会网络", rel: "传承" },
  { era: "明清", from: "nanjing", to: "beijing", label: "政治与编纂中心北移", rel: "迁徙" },
  { era: "明清", from: "shanghai", to: "beijing", label: "译著经口岸出版进入全国论争", rel: "中西转译" },
  { era: "近现代", from: "shanghai", to: "beijing", label: "报刊、大学与新文化网络", rel: "刊刻传播" },
  { era: "近现代", from: "guangzhou", to: "changsha", label: "革命思想沿社团与报刊传播", rel: "迁徙" },
  { era: "近现代", from: "shaoxing", to: "shanghai", label: "地方记忆进入现代出版中心", rel: "刊刻传播" },
];

export const GEO_ACTIVITY_LABEL: Record<GeoRecord["activity"], string> = {
  讲学: "讲学之地",
  撰写: "著述之地",
  编纂: "编纂中心",
  刊刻: "刊刻传播",
  传播: "流通节点",
  论争: "思想论争",
};
