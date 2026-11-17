/**
 * 本文件由 `zhuzi-world-blender/pipeline/xiyou_export_glb.py` 生成，请勿手改。
 *
 * 取经路各处 .glb 归一后的实际尺寸（米）：`footprint` 为水平最大外廓，`height` 为脊高。
 * 与战国的 `modelMeta.ts` 分立两张表——两个世界的占地尺子不同（取经路挤，
 * 相邻两处最紧只隔 10.7 米），混用必穿模；此处亦不记整平半径，西游的大地是一张素面。
 *
 * 场景据此让夯土基面随一处的大小收放、匾额悬到脊上；改占地只须改
 * `pipeline/xiyou_layout.py`，重导一次这里即同步。
 */

export type XiyouModelMeta = {
  footprint: number;
  height: number;
};

export const xiyouModelMeta: Record<string, XiyouModelMeta> = {
  dongtu: { footprint: 32.0, height: 26.25 },
  leiyin: { footprint: 27.0, height: 29.08 },
  wuxingshan: { footprint: 24.0, height: 24.00 },
  gaolaozhuang: { footprint: 22.0, height: 7.84 },
  huoyanshan: { footprint: 22.0, height: 23.12 },
  lingxiao: { footprint: 24.0, height: 35.3 },
  liushahe: { footprint: 21.0, height: 7.71 },
  tongtianhe: { footprint: 21.0, height: 11.42 },
  huaguo: { footprint: 26.0, height: 19.33 },
  shituoling: { footprint: 19.0, height: 17.39 },
  xieyue: { footprint: 24.0, height: 13.87 },
  nanhai: { footprint: 22.0, height: 9.32 },
  wuzhuangguan: { footprint: 17.0, height: 14.53 },
  chechiguo: { footprint: 17.0, height: 17.34 },
  nverguo: { footprint: 17.0, height: 15.67 },
  baihuling: { footprint: 16.0, height: 14.40 },
  xiaoleiyin: { footprint: 16.0, height: 18.78 },
  doushuai: { footprint: 22.0, height: 17.73 },
};

/** 基面半径：贴着外廓再留 1.2 米。取经路挤，留宽了相邻两盘会叠在一起 */
export function xiyouBaseRadius(id: string) {
  const m = xiyouModelMeta[id];
  return m ? m.footprint * 0.5 + 1.2 : 8.5;
}

/** 匾额悬挂高度：脊上一截，矮的也不低于 7 米，免得被人物挡住 */
export function xiyouTagHeight(id: string) {
  const m = xiyouModelMeta[id];
  return m ? Math.max(7, m.height + 2.4) : 10.1;
}

/** 已导出 .glb 的处；不在表里的仍走程序化占位 */
export const XIYOU_MODELED = new Set(Object.keys(xiyouModelMeta));
