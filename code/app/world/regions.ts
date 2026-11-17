export type Region = {
  id: string;
  name: string;
  sub: string;
  icon: string;
  className: string;
  /** 区域中心，百分比坐标；3D 场景按 worldXZ 换算为地面坐标 */
  x: number;
  y: number;
  /** 人物在区域内的落位偏移，避免相互重叠 */
  slots: { dx: number; dy: number }[];
  mood: string;
  /** 建筑朝向（弧度），使各处形制不至于齐整雷同 */
  facing: number;
};

/** 百分比坐标 → 3D 地面坐标。地面为 108×108。 */
export function worldXZ(x: number, y: number): [number, number] {
  return [(x - 50) * 0.92, (y - 50) * 0.92];
}

/**
 * 西游的换算系数：取经路十三处要错落拉开（战国图并置散点，各区间距 15~25 米
 * 已够；取经路是一条线，模型若还是肩挨肩，整张图就挤成一串珠子），故西游
 * 大地铺到 240×240，百分比坐标也按更阔的尺子换算。两界共用 `worldXZ()` 的
 * 百分比约定，只是各拿各的米制。
 */
export const XIYOU_SCALE = 1.8;

/** 西游的百分比坐标 → 3D 地面坐标。地面 240×240。 */
export function xiyouXZ(x: number, y: number): [number, number] {
  return [(x - 50) * XIYOU_SCALE, (y - 50) * XIYOU_SCALE];
}

export const regions: Region[] = [
  {
    id: "academy",
    name: "杏坛",
    sub: "弦歌不辍",
    icon: "亭",
    className: "academy",
    x: 24,
    y: 30,
    slots: [{ dx: -7, dy: 2 }, { dx: 6, dy: 4 }, { dx: 0, dy: 12 }, { dx: -12, dy: 11 }, { dx: 12, dy: 12 }, { dx: 1, dy: -6 }],
    mood: "讲诵之声不绝，弟子环坐。",
    facing: -0.18,
  },
  {
    id: "workshop",
    name: "墨家工坊",
    sub: "巧工利天下",
    icon: "⚙",
    className: "workshop",
    x: 79,
    y: 29,
    slots: [{ dx: -4, dy: 3 }, { dx: 7, dy: 6 }, { dx: -12, dy: 10 }, { dx: 3, dy: 14 }, { dx: 13, dy: 13 }, { dx: -1, dy: -6 }],
    mood: "木屑与铁器声相和，机关半成。",
    facing: 0.42,
  },
  {
    id: "hall",
    name: "法家政厅",
    sub: "明法审令",
    icon: "殿",
    className: "hall",
    x: 15,
    y: 73,
    slots: [{ dx: 2, dy: -2 }, { dx: 12, dy: 2 }, { dx: -8, dy: 6 }, { dx: 6, dy: 10 }, { dx: 17, dy: 9 }, { dx: -3, dy: -10 }],
    mood: "竹简堆案，吏员往来核验法令。",
    facing: 0.16,
  },
  {
    id: "jixia",
    name: "稷下学宫",
    sub: "不治而议论",
    icon: "辩",
    className: "jixia",
    x: 47,
    y: 66,
    slots: [{ dx: -8, dy: -2 }, { dx: 5, dy: -1 }, { dx: -13, dy: 8 }, { dx: 0, dy: 9 }, { dx: 12, dy: 7 }, { dx: -3, dy: -11 }],
    mood: "各派士人列座，争论声此起彼伏。",
    facing: -0.06,
  },
  {
    id: "water",
    name: "濠水之畔",
    sub: "万物自在",
    icon: "水",
    className: "water",
    x: 78,
    y: 74,
    slots: [{ dx: -6, dy: -4 }, { dx: 5, dy: 0 }, { dx: -13, dy: 5 }, { dx: 2, dy: 9 }, { dx: 13, dy: 6 }, { dx: -2, dy: -12 }],
    mood: "水光照人，鱼影往来，风过芦荻。",
    facing: 0.55,
  },
  {
    id: "zongheng",
    name: "纵横棋局",
    sub: "合纵连横",
    icon: "局",
    className: "zongheng",
    x: 50,
    y: 18,
    slots: [{ dx: -3, dy: 2 }, { dx: 3, dy: 2 }, { dx: -6, dy: 6 }, { dx: 6, dy: 6 }, { dx: 0, dy: 8 }, { dx: 0, dy: -4 }],
    mood: "棋枰纵横，使臣推演天下大势。",
    facing: 0.2,
  },
  {
    id: "mingjia",
    name: "名家论辩台",
    sub: "离坚白",
    icon: "名",
    className: "mingjia",
    x: 88,
    y: 52,
    slots: [{ dx: -3, dy: -2 }, { dx: 3, dy: -2 }, { dx: -5, dy: 4 }, { dx: 5, dy: 4 }, { dx: 0, dy: 6 }, { dx: 0, dy: -6 }],
    mood: "执名责实，言辞锋出。",
    facing: -0.3,
  },
  {
    id: "daoshan",
    name: "道家山林",
    sub: "道法自然",
    icon: "山",
    className: "daoshan",
    x: 33,
    y: 90,
    slots: [{ dx: -4, dy: 0 }, { dx: 4, dy: 0 }, { dx: 0, dy: 4 }, { dx: -6, dy: 6 }, { dx: 6, dy: 6 }, { dx: 0, dy: -4 }],
    mood: "松风过壑，清言渐起。",
    facing: 0.5,
  },
  {
    id: "plaza",
    name: "公共广场",
    sub: "众声喧阗",
    icon: "场",
    className: "plaza",
    x: 62,
    y: 46,
    slots: [{ dx: -4, dy: -2 }, { dx: 4, dy: -2 }, { dx: -5, dy: 4 }, { dx: 5, dy: 4 }, { dx: 0, dy: 6 }, { dx: 0, dy: -5 }],
    mood: "往来士庶云集，议论纷起。",
    facing: 0,
  },
  {
    id: "guanxing",
    name: "观星台",
    sub: "阴阳",
    icon: "星",
    className: "guanxing",
    x: 8,
    y: 10,
    slots: [{ dx: -4, dy: 2 }, { dx: 5, dy: 3 }, { dx: -3, dy: 8 }, { dx: 4, dy: 9 }, { dx: 0, dy: -4 }, { dx: -8, dy: -2 }],
    mood: "星盘缓转，铜仪承露，阴阳之士推步不辍。",
    facing: 0.6,
  },
  {
    id: "shapan",
    name: "沙盘",
    sub: "兵家",
    icon: "旗",
    className: "shapan",
    x: 92,
    y: 94,
    slots: [{ dx: -4, dy: 2 }, { dx: 4, dy: 2 }, { dx: -6, dy: 5 }, { dx: 6, dy: 5 }, { dx: 0, dy: 7 }, { dx: 0, dy: -4 }],
    mood: "旗阵分奇正，沙盘上推演攻守之势。",
    facing: -0.5,
  },
  {
    id: "tianshe",
    name: "农家田舍",
    sub: "稼穑",
    icon: "舍",
    className: "tianshe",
    x: 12,
    y: 92,
    slots: [{ dx: -4, dy: 0 }, { dx: 4, dy: 2 }, { dx: -5, dy: 6 }, { dx: 6, dy: 5 }, { dx: 0, dy: 8 }, { dx: 0, dy: -5 }],
    mood: "田垄阡陌，鸡犬相闻，农者荷锄而归。",
    facing: 0.3,
  },
  {
    id: "chidao",
    name: "秦驰道",
    sub: "车同轨",
    icon: "关",
    className: "chidao",
    x: 40,
    y: 5,
    slots: [{ dx: -4, dy: 0 }, { dx: 4, dy: 2 }, { dx: -6, dy: 5 }, { dx: 6, dy: 5 }, { dx: 0, dy: 7 }, { dx: 0, dy: -5 }],
    mood: "关隘旌旗相望，驰道上车辙深陷，使者往来不绝。",
    facing: 0.1,
  },
  {
    id: "shijing",
    name: "市井",
    sub: "街谈巷语",
    icon: "市",
    className: "shijing",
    x: 68,
    y: 8,
    slots: [{ dx: -4, dy: 0 }, { dx: 4, dy: 2 }, { dx: -6, dy: 5 }, { dx: 6, dy: 5 }, { dx: 0, dy: 7 }, { dx: 0, dy: -5 }],
    mood: "棚肆幌子相招，市人论价议政，众声喧阗。",
    facing: -0.2,
  },
  {
    id: "dukou",
    name: "大河渡口",
    sub: "济渡",
    icon: "渡",
    className: "dukou",
    x: 94,
    y: 68,
    slots: [{ dx: -5, dy: 0 }, { dx: 5, dy: 2 }, { dx: -6, dy: 6 }, { dx: 6, dy: 6 }, { dx: 0, dy: 8 }, { dx: 0, dy: -5 }],
    mood: "大河奔涌，渡船往来，南北客货皆汇于此。",
    facing: -0.6,
  },
  {
    id: "zhaoxian",
    name: "招贤馆",
    sub: "兼收并蓄",
    icon: "馆",
    className: "zhaoxian",
    x: 4,
    y: 52,
    // slots 避开正中 (0,0)，留中心给静态驻馆的主持人吕不韦；门客围坐其周
    slots: [{ dx: -5, dy: -3 }, { dx: 5, dy: -3 }, { dx: -6, dy: 4 }, { dx: 6, dy: 4 }, { dx: 0, dy: 6 }, { dx: 0, dy: -6 }],
    mood: "正堂编简层叠，门客往来论学，兼收并蓄之议不绝。",
    facing: 0.2,
  },
];

export const regionMap: Record<string, Region> = Object.fromEntries(regions.map((r) => [r.id, r]));

/** 有顶（室内）区域：雨雪时户外人物就近避入其一。 */
export const INDOOR_IDS = ["hall", "zhaoxian", "workshop"];

export function isIndoor(id: string): boolean {
  return INDOOR_IDS.includes(id);
}

/** 最近的有顶区域（按区域中心百分比坐标 2D 距离）。供雨雪时户外人物避雨用。 */
export function shelterOf(id: string): string {
  const r = regionMap[id];
  if (!r) return "zhaoxian";
  let best = INDOOR_IDS[0];
  let bestD = Infinity;
  for (const iid of INDOOR_IDS) {
    const ir = regionMap[iid];
    if (!ir) continue;
    const dx = ir.x - r.x;
    const dy = ir.y - r.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = iid;
    }
  }
  return best;
}
