/**
 * 本文件由 `zhuzi-world-blender/pipeline/export_glb.py` 生成,请勿手改。
 *
 * 十六座 .glb 归一后的实际尺寸(米):`footprint` 为水平最大外廓,`height` 为脊高,
 * `flatIn`/`flatOut` 是该基址的整平内外半径(与 Blender 那边的地形同一张表)。
 *
 * 场景里据此让夯土基面随建筑大小收放、匾额悬到屋脊之上、地形在基址一圈压平 ——
 * 改占地只须改导出脚本所用的 `pipeline/layout.py`,重导一次这里即同步。
 */

export type ModelMeta = {
  footprint: number;
  height: number;
  flatIn: number;
  flatOut: number;
};

export const modelMeta: Record<string, ModelMeta> = {
  jixia: { footprint: 26.0, height: 5.01, flatIn: 16.50, flatOut: 23.50 },
  academy: { footprint: 25.0, height: 5.29, flatIn: 16.00, flatOut: 23.00 },
  zhaoxian: { footprint: 22.0, height: 11.05, flatIn: 14.50, flatOut: 21.50 },
  workshop: { footprint: 19.0, height: 9.04, flatIn: 13.00, flatOut: 20.00 },
  hall: { footprint: 19.0, height: 13.57, flatIn: 13.00, flatOut: 20.00 },
  guanxing: { footprint: 19.0, height: 8.64, flatIn: 13.00, flatOut: 20.00 },
  shijing: { footprint: 19.0, height: 6.74, flatIn: 13.00, flatOut: 20.00 },
  daoshan: { footprint: 18.5, height: 7.96, flatIn: 12.75, flatOut: 19.75 },
  dukou: { footprint: 15.5, height: 2.98, flatIn: 11.25, flatOut: 18.25 },
  plaza: { footprint: 15.0, height: 6.21, flatIn: 11.00, flatOut: 18.00 },
  chidao: { footprint: 15.0, height: 6.26, flatIn: 11.00, flatOut: 18.00 },
  water: { footprint: 14.0, height: 3.08, flatIn: 10.50, flatOut: 17.50 },
  mingjia: { footprint: 14.0, height: 2.81, flatIn: 10.50, flatOut: 17.50 },
  shapan: { footprint: 14.0, height: 4.07, flatIn: 10.50, flatOut: 17.50 },
  tianshe: { footprint: 14.0, height: 4.63, flatIn: 10.50, flatOut: 17.50 },
  zongheng: { footprint: 13.0, height: 5.17, flatIn: 10.00, flatOut: 17.00 },
};

/** 夯土基面半径:贴着外廓再留一圈 3 米,给人物落位,也遮住基座与土坡的接缝 */
export function baseRadius(id: string) {
  const m = modelMeta[id];
  return m ? m.footprint * 0.5 + 3 : 14;
}

/** 匾额悬挂高度:屋脊之上一截,矮的也不低于 7 米免得被人物挡住 */
export function tagHeight(id: string) {
  const m = modelMeta[id];
  return m ? Math.max(7, m.height + 2.2) : 9.5;
}
