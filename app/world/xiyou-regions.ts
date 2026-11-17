import type { Region } from "./regions";

/**
 * 西游世界地图：十三处，自东土长安西行至灵山雷音寺。
 *
 * 与战国图的根本分别在拓扑：战国十六区是**并置**的——杏坛与工坊同时存在，人物在其间
 * 往来，没有先后。取经路是**线性**的，十三处有严格次序，过了流沙河不会再回高老庄。
 * 故坐标不作散点铺开，而是一条自东南（x 高）向西北（x 低）蜿蜒的路径，`order` 字段
 * 记其次第——这是战国图没有、西游图必须有的一维。
 *
 * `Region` 的形状原样复用（含 `slots` 落位、`facing` 朝向、`worldXZ` 换算），故渲染栈
 * （WorldScene / Buildings / placement）不必为西游另写一套。建筑模型未到之前，
 * 先用程式化几何体占位，做好一座换一座。
 */
/**
 * 一处所出之回目。
 *
 * 十三处不是凭空拟的地名，每一处都坐实在原著的某几回上；写明回次，此图才算有本——
 * 看图的人要核，翻得到；人物在此处说的话，也对得上是哪一回里说的。
 *
 * 分两格而不是一行字：`label` 是回次（第二十七回），`title` 是回目本文
 * （尸魔三戏唐三藏，圣僧恨逐美猴王）。回目是对句，自有其体，不该与回次搅在一起。
 * `span` 只在事跨数回时才写——五行山尤其特别，压在第七回、出在第十四回，中间隔着
 * 五百年与六回书，这一笔不交代，图上就少了那五百年。
 */
export type Chapter = {
  /** 此处主事所在之回 */
  label: string;
  /** 该回回目（对句，照原书） */
  title: string;
  /** 事跨数回时的起讫；只一回者不写 */
  span?: string;
};

export type XiyouRegion = Region & {
  /** 取经次第，1 为东土，13 为雷音寺；界外五处不在路上，一律作 0。 */
  order: number;
  /**
   * 界外：不在取经路上之地（花果山、斜月三星洞、凌霄殿、兜率宫、南海）。
   *
   * 这五处本不该只是人格档案里一个无处可落的 `home` 字段。从前它们正是如此——
   * `XiyouScene` 摆人时按 `home` 去 `xiyouRegionMap` 里取处所，取不着便默默跳过，
   * 于是玉帝、老君、须菩提、观音四人在图上一个也看不见：名册里有，地上没有。
   * 今补此五处，各有其形制与回目，人便站得住了。
   *
   * 与十三处的分别须在数据里写明，不能只靠坐标躲开路线：路线取样（`routeCurve`）
   * 按 `order` 排序连缀，界外之地若混入，取经路便会平白拐去天上一趟。
   */
  offRoute?: true;
  /** 此处之难，一句话。无难者（如东土、雷音、界外五处）留空。 */
  trial: string;
  /** 此处所出之回目 */
  chapter: Chapter;
};

export const xiyouRegions: XiyouRegion[] = [
  {
    id: "dongtu", name: "东土长安", sub: "奉旨西行", icon: "阙", className: "dongtu",
    x: 90, y: 86, order: 1, trial: "",
    chapter: {
      label: "第十二回", title: "玄奘秉诚建大会，观音显象化金蝉",
      span: "十二—十三回（受旨在前，出关在后）",
    },
    slots: [{ dx: -7, dy: 3 }, { dx: 6, dy: 5 }, { dx: 0, dy: 12 }, { dx: -11, dy: 11 }],
    mood: "唐王亲饯于关外，一盏土酒未干。", facing: -0.3,
  },
  {
    id: "wuxingshan", name: "五行山", sub: "压伏五百年", icon: "山", className: "wuxingshan",
    x: 68, y: 72, order: 2, trial: "揭帖既揭，石猴出山，紧箍随至。",
    chapter: {
      label: "第十四回", title: "心猿归正，六贼无踪",
      span: "第七回压下，第十四回放出——中间隔五百年",
    },
    slots: [{ dx: -6, dy: 4 }, { dx: 7, dy: 6 }, { dx: 1, dy: 13 }, { dx: -12, dy: 10 }],
    mood: "石缝间草木半枯，六字真言犹贴。", facing: 0.25,
  },
  {
    id: "gaolaozhuang", name: "高老庄", sub: "招赘之门", icon: "庄", className: "gaolaozhuang",
    x: 82, y: 44, order: 3, trial: "高家女婿原是天蓬，一场闹里收了二徒。",
    chapter: {
      label: "第十八回", title: "观音院唐僧脱难，高老庄大圣除魔",
      span: "十八—十九回（除魔在前，收徒在后）",
    },
    slots: [{ dx: -8, dy: 2 }, { dx: 5, dy: 6 }, { dx: -2, dy: 12 }, { dx: 11, dy: 10 }],
    mood: "彩门未拆，新妇已三年不出房。", facing: -0.5,
  },
  {
    id: "liushahe", name: "流沙河", sub: "鹅毛不浮", icon: "河", className: "liushahe",
    x: 58, y: 28, order: 4, trial: "八百流沙界，三千弱水深；木叉指路，葫芦作舟。",
    chapter: { label: "第二十二回", title: "八戒大战流沙河，木叉奉法收悟净" },
    slots: [{ dx: -9, dy: 5 }, { dx: 6, dy: 3 }, { dx: 0, dy: 13 }, { dx: 12, dy: 11 }],
    mood: "水色赭黄，岸上骷髅九颗串成一项。", facing: 0.1,
  },
  {
    id: "wuzhuangguan", name: "五庄观", sub: "人参果树", icon: "观", className: "wuzhuangguan",
    x: 62, y: 2, order: 5, trial: "推倒仙根，镇元子袖里乾坤；观音甘露方活。",
    chapter: {
      label: "第二十四回", title: "万寿山大仙留故友，五庄观行者窃人参",
      span: "二十四—二十六回（窃果、推树、求方）",
    },
    slots: [{ dx: -7, dy: 4 }, { dx: 7, dy: 5 }, { dx: -1, dy: 12 }, { dx: 11, dy: 12 }],
    mood: "清风明月二童守门，果香三十里可闻。", facing: -0.15,
  },
  {
    id: "baihuling", name: "白虎岭", sub: "三打白骨", icon: "岭", className: "baihuling",
    x: 42, y: 12, order: 6, trial: "一尸三变，肉眼不识；贬书既下，大圣回山。",
    chapter: { label: "第二十七回", title: "尸魔三戏唐三藏，圣僧恨逐美猴王" },
    slots: [{ dx: -6, dy: 6 }, { dx: 8, dy: 3 }, { dx: 0, dy: 13 }, { dx: -12, dy: 11 }],
    mood: "乱石如齿，白骨一堆写着「白骨夫人」。", facing: 0.55,
  },
  {
    id: "chechiguo", name: "车迟国", sub: "灭僧之国", icon: "坛", className: "chechiguo",
    x: 38, y: 38, order: 7, trial: "三仙斗法，求雨坐禅砍头下油；僧囚得释。",
    chapter: {
      label: "第四十五回", title: "三清观大圣留名，车迟国猴王显法",
      span: "四十四—四十六回（见僧拉车、求雨斗法、灭诸邪）",
    },
    slots: [{ dx: -8, dy: 3 }, { dx: 6, dy: 6 }, { dx: -1, dy: 12 }, { dx: 12, dy: 10 }],
    mood: "道士乘车，和尚拉车，国中无一座完整僧寺。", facing: -0.4,
  },
  {
    id: "tongtianhe", name: "通天河", sub: "八百里阔", icon: "渡", className: "tongtianhe",
    x: 14, y: 32, order: 8, trial: "灵感大王食童男女，老鼋负渡复沉经。",
    chapter: {
      label: "第四十七回", title: "圣僧夜阻通天水，金木垂慈救小童",
      span: "四十七—四十九回；老鼋沉经另在第九十九回",
    },
    slots: [{ dx: -7, dy: 5 }, { dx: 7, dy: 4 }, { dx: 1, dy: 13 }, { dx: -11, dy: 11 }],
    mood: "陈家庄灯火未息，河面冰合又开。", facing: 0.3,
  },
  {
    id: "nverguo", name: "西梁女国", sub: "举国无男", icon: "宫", className: "nverguo",
    x: 10, y: 58, order: 9, trial: "子母河水成胎，女王以一国相留；此难不在刀兵。",
    chapter: {
      label: "第五十四回", title: "法性西来逢女国，心猿定计脱烟花",
      span: "五十三—五十四回（子母河在前，迎阳驿在后）",
    },
    slots: [{ dx: -6, dy: 4 }, { dx: 8, dy: 6 }, { dx: 0, dy: 12 }, { dx: 11, dy: 11 }],
    mood: "迎阳驿外花幢十里，女王凤目看定御弟。", facing: -0.22,
  },
  {
    id: "huoyanshan", name: "火焰山", sub: "八百里火", icon: "焰", className: "huoyanshan",
    x: 4, y: 82, order: 10, trial: "三调芭蕉扇；旧日结义，今为仇雠。",
    chapter: {
      label: "第五十九回", title: "唐三藏路阻火焰山，孙行者一调芭蕉扇",
      span: "五十九—六十一回（一调、二调、三调）",
    },
    slots: [{ dx: -8, dy: 3 }, { dx: 6, dy: 5 }, { dx: -2, dy: 13 }, { dx: 12, dy: 12 }],
    mood: "无春无秋，飞鸟过即成灰。", facing: 0.48,
  },
  {
    id: "xiaoleiyin", name: "小雷音寺", sub: "伪佛之局", icon: "塔", className: "xiaoleiyin",
    x: 18, y: 92, order: 11, trial: "黄眉冒佛，金铙罩圣；真伪之辨，在此一关。",
    chapter: {
      label: "第六十五回", title: "妖邪假设小雷音，四众皆遭大厄难",
      span: "六十五—六十六回（弥勒缚妖在后）",
    },
    slots: [{ dx: -7, dy: 4 }, { dx: 7, dy: 6 }, { dx: 0, dy: 12 }, { dx: -12, dy: 10 }],
    mood: "牌额三字俨然，只是「小」字新刻。", facing: -0.12,
  },
  {
    id: "shituoling", name: "狮驼岭", sub: "三魔食人", icon: "骨", className: "shituoling",
    x: 40, y: 98, order: 12, trial: "四万七千小妖，城中尽是白骨；大圣亦曾堕泪。",
    chapter: {
      label: "第七十四回", title: "长庚传报魔头狠，行者施为变化能",
      span: "七十四—七十七回（狮驼国一役，全书最长的一难）",
    },
    slots: [{ dx: -6, dy: 5 }, { dx: 8, dy: 3 }, { dx: 1, dy: 13 }, { dx: 11, dy: 12 }],
    mood: "阴风裹腥，髑髅堆作城垛。", facing: 0.6,
  },
  {
    id: "leiyin", name: "灵山雷音寺", sub: "真经所在", icon: "莲", className: "leiyin",
    x: 58, y: 88, order: 13, trial: "凌云渡脱却凡胎，无字经还须人事。",
    chapter: {
      label: "第九十八回", title: "猿熟马驯方脱壳，功成行满见真如",
      span: "九十八—九十九回（得经在前，九九数完在后）",
    },
    slots: [{ dx: -9, dy: 3 }, { dx: 5, dy: 6 }, { dx: -1, dy: 12 }, { dx: 12, dy: 11 }],
    mood: "金光万道，八大金刚立于山门之外。", facing: -0.05,
  },
];

/**
 * 界外五处：不在取经路上，却是西游绕不过去的地方。
 *
 * 取经路是唐僧的路，这五处是**悟空的路**——学道在斜月三星洞，称王在花果山，
 * 反在凌霄殿，受炼在兜率宫，受制于南海。全书前七回根本不在取经路上，
 * 若图上只有十三处，那七回便无处可安，住在那里的四位（祖师、玉帝、老君、观音）
 * 也只能在名册里挂个名。
 *
 * 坐标一律避开路线所经（见各处注），且 `order: 0` + `offRoute` 双重标明：
 * 前者使「已过／未至」的比较自然落空，后者使路线取样与路条按次第的那一排
 * 把它们筛掉。两处都要，因为 `order` 终究是个数，筛选不该靠它为 0 这件事。
 */
export const xiyouOffRegions: XiyouRegion[] = [
  {
    id: "huaguo", name: "花果山", sub: "水帘洞天", icon: "洞", className: "huaguo",
    // 东胜神洲傲来国，在东；故置于五行山、高老庄之东，与路线隔着一片空地
    x: 96, y: 39, order: 0, offRoute: true, trial: "",
    chapter: {
      label: "第一回", title: "灵根育孕源流出，心性修持大道生",
      span: "一—七回称王起事；第二十八回贬回本山",
    },
    slots: [{ dx: -7, dy: 4 }, { dx: 6, dy: 6 }, { dx: 0, dy: 12 }, { dx: -11, dy: 11 }],
    mood: "瀑布飞泉挂作帘幕，石碣上「花果山福地」六字犹新。", facing: -0.4,
  },
  {
    id: "xieyue", name: "斜月三星洞", sub: "灵台方寸山", icon: "星", className: "xieyue",
    // 西牛贺洲，然在白虎岭、车迟之西北更远处，不与取经路相犯
    x: 5, y: 12, order: 0, offRoute: true, trial: "",
    chapter: {
      label: "第二回", title: "悟彻菩提真妙理，断魔归本合元神",
      span: "一—二回（访道在前，学成逐出在后）",
    },
    slots: [{ dx: -6, dy: 5 }, { dx: 7, dy: 4 }, { dx: 1, dy: 12 }, { dx: -12, dy: 10 }],
    mood: "樵子指路而去，洞门半掩，门上十字犹在。", facing: 0.35,
  },
  {
    id: "lingxiao", name: "凌霄宝殿", sub: "三十三天之上", icon: "殿", className: "lingxiao",
    x: 74, y: 4, order: 0, offRoute: true, trial: "",
    chapter: {
      label: "第四回", title: "官封弼马心何足，名注齐天意未宁",
      span: "三—七回（销死籍、两反天宫，至被压五行山）",
    },
    slots: [{ dx: -8, dy: 3 }, { dx: 6, dy: 6 }, { dx: -1, dy: 12 }, { dx: 11, dy: 11 }],
    mood: "仙卿列班不敢仰视，南天门外云气叠如瓦。", facing: -0.08,
  },
  {
    id: "doushuai", name: "兜率宫", sub: "离恨天·八卦炉", icon: "炉", className: "doushuai",
    x: 88, y: 12, order: 0, offRoute: true, trial: "",
    chapter: { label: "第七回", title: "八卦炉中逃大圣，五行山下定心猿" },
    slots: [{ dx: -6, dy: 4 }, { dx: 8, dy: 5 }, { dx: 0, dy: 13 }, { dx: -12, dy: 11 }],
    mood: "炉烟未散，五个葫芦空其三——金丹作炒豆吃了。", facing: 0.2,
  },
  {
    id: "nanhai", name: "南海落伽山", sub: "潮音洞", icon: "岛", className: "nanhai",
    // 南海在南，置于雷音之东、东土之南；取经路一路所求，皆自此处来
    x: 78, y: 96, order: 0, offRoute: true, trial: "",
    chapter: {
      label: "第八回", title: "我佛造经传极乐，观音奉旨上长安",
      span: "第八回奉旨访取经人；此后屡求屡至，至第九十八回方了",
    },
    slots: [{ dx: -7, dy: 5 }, { dx: 7, dy: 3 }, { dx: 1, dy: 12 }, { dx: 12, dy: 10 }],
    mood: "潮音洞外紫竹成林，净瓶里插着那枝杨柳。", facing: -0.3,
  },
];

/** 路上十三处 ＋ 界外五处。凡「依 id 取一处」者皆用此，故界外之地也查得着。 */
export const xiyouAllRegions: XiyouRegion[] = [...xiyouRegions, ...xiyouOffRegions];

export const xiyouRegionMap: Record<string, XiyouRegion> = Object.fromEntries(
  xiyouAllRegions.map((r) => [r.id, r]),
);

/** 取经次第相邻的下一处；末处与界外之地返回 null。供路线动画与「行至何处」显示用。 */
export function nextStop(id: string): XiyouRegion | null {
  const r = xiyouRegionMap[id];
  if (!r || r.offRoute) return null; // 界外之地不在次第里，无所谓「下一处」
  return xiyouRegions.find((x) => x.order === r.order + 1) ?? null;
}

/** 四众的 id 序（随队落位见 XiyouScene 的「路旁一列」）。 */
export const XIYOU_PARTY = ["tangseng", "wukong", "bajie", "shaseng"];

/**
 * 四众各自入队之处——也是未入队时候着之处：唐僧自长安发端；行者压在五行山下、
 * 八戒赘在高老庄、沙僧待在流沙河。取经路走到谁跟前（passed 过了那一处），谁才随行；
 * 此前各在其地候着——开场时悟空不该站在长安城下，他还在山下压着呢。
 *
 * 落位（XiyouScene）与此处卡的「在此」行（XiyouLayer）同用此表，故放在世界数据
 * 这边，不搁在场景组件里——不然卡要点名，还得去场景文件里翻。
 */
export const XIYOU_JOINS: Record<string, string> = {
  tangseng: "dongtu",
  wukong: "wuxingshan",
  bajie: "gaolaozhuang",
  shaseng: "liushahe",
};
