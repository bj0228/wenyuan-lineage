"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SCHOOLS, SCHOLAR_CHRONO, GHOSTS, BOOKS, IDEAS, LINEAGE_EDGES, EDGE_STYLES, ORIGINS, originColorOf, originIdOfNode, isGhost, isBook, isIdea, isCanonOnly, nodeTypeOf, bookOf, ideaOf, nameOf, glyphOf, labelOf, kindLabel, schoolColorOf, schoolNameOf, bcOf, type EdgeType, type NodeType } from "../world/lineage";
import { scholarMap } from "../world/characters";
import { useLang, useT } from "../i18n/lang";
import Said from "../i18n/Said";
import { canon, type Passage } from "../world/canon";

/**
 * 百家演变脉络：全页横滚长卷。
 * - 横轴：公元前 600→200（左古右今）；诸子按约生年置点。
 * - 纵：九道（八家＋杂家）自上而下分道，左列固定道标签（家名＋代表色）；每道为一「道带」，带内分上中下三行——典籍·人物·思想，三类分行互不遮挡。
 * - 边：师承/出于/影响/交游（人物间）＋ 著述（人→书）/ 主张（人→思想）/ 承变·对立（思想间）。
 * - 幽灵节点（鬼谷子·子思）：不入 scholars，仅于此图示其位、为师承溯源。
 * 数据为近似定值（见 lineage.ts），仅供阅览，不入发言/辩论逻辑。
 */

const BC_MIN = 600;
const BC_MAX = 200;
const BC_SPAN = BC_MIN - BC_MAX;
const PAD_L = 76;
const PAD_R = 44;
const PAD_T = 48;
const PAD_B = 36;
// 卷宽：年代轴摊得开，同道同代的人、书、思想才不挤成一团。
// 高由十一道带定死（CONTENT_H≈1422），故卷宽即长卷的横向尺度——
// 宽过纸面便横向展卷（.lineage-body 横滚），本是长卷的读法。
const CONTENT_W = 2480;
const INNER_W = CONTENT_W - PAD_L - PAD_R;
const NODE_R = 20; // 人物（最大圈，实心）
const GHOST_R = 15; // 幽灵节点（虚线圈，师承之源）
const BOOK_R = 12; // 典籍（中圈）
const IDEA_R = 8; // 思想（小圈）
const IDEA_STAGGER = 46; // 同道同年的书／思想横向错开免叠合（卷宽加到 2480 后相应放宽）
const BC_TICKS: number[] = [600, 500, 400, 300, 200];

/* 每条学派道为一「道带」，带内分上中下三行：典籍·人物·思想，三类物理分行互不遮挡。
 * 标签朝向：典籍（上行）朝带上沿、人物（中行）朝上、思想（下行）朝下，避开相邻行节点。
 * 圈放大后行距相应放宽；整图再按 viewBox 缩放纳入一页（见 lineage-body）。 */
const BAND_H = 118;
const BAND_GAP = 4;
const BOOK_Y = 16; // 道带内典籍行（上）
const SCHOLAR_Y = 62; // 道带内人物行（中）＝道线
const IDEA_Y = 96; // 道带内思想行（下）
const bandTop = (i: number) => PAD_T + i * (BAND_H + BAND_GAP);
const laneY = (i: number) => bandTop(i) + SCHOLAR_Y;
const CONTENT_H = PAD_T + SCHOOLS.length * (BAND_H + BAND_GAP) - BAND_GAP + PAD_B;

const xOf = (bc: number) => {
  // 远早/晚于诸子轴范围者（如文王 -1150、周易 -1050）clamp 到轴界，免画出界；真实年代仍由 title 显示。
  const c = Math.max(BC_MAX, Math.min(BC_MIN, bc));
  return PAD_L + ((BC_MIN - c) / BC_SPAN) * INNER_W;
};

type Pos = { x: number; y: number };
const NODE_POS: Record<string, Pos> = {};
const schoolIndexOf = (sid: string) => SCHOOLS.findIndex((s) => s.id === sid);
for (const c of SCHOLAR_CHRONO) NODE_POS[c.id] = { x: xOf(c.birthBC), y: laneY(schoolIndexOf(c.schoolId)) };
for (const g of GHOSTS) NODE_POS[g.id] = { x: xOf(g.birthBC), y: laneY(schoolIndexOf(g.schoolId)) };
/**
 * 典籍行与思想行共用的置点：同道同年者横向错开免叠合。
 * 书与思想的年份都是约数（成书年、盛行年），小幅错开不害时序；
 * 不错开则孔子名下的论语·孝经·子思子会叠成一个点，名也压作一团墨。
 */
function placeRow<T extends { id: string; bc: number; schoolId: string }>(items: readonly T[], rowY: number) {
  const bySchool = new Map<string, T[]>();
  for (const it of items) {
    const arr = bySchool.get(it.schoolId) ?? [];
    arr.push(it);
    bySchool.set(it.schoolId, arr);
  }
  for (const arr of bySchool.values()) {
    arr.sort((a, b) => a.bc - b.bc || (a.id < b.id ? -1 : 1));
    let i = 0;
    while (i < arr.length) {
      let j = i;
      while (j < arr.length && arr[j].bc === arr[i].bc) j++;
      const n = j - i;
      const baseX = xOf(arr[i].bc);
      const y = bandTop(schoolIndexOf(arr[i].schoolId)) + rowY;
      for (let k = 0; k < n; k++) NODE_POS[arr[i + k].id] = { x: baseX + (k - (n - 1) / 2) * IDEA_STAGGER, y };
      i = j;
    }
  }
}
placeRow(BOOKS, BOOK_Y);   // 典籍：道带上行
placeRow(IDEAS, IDEA_Y);   // 思想：道带下行

// 节点解析助手（nameOf/glyphOf/isGhost/.../bcOf 等）已自 lineage.ts 导出共用；此处仅留与本图布局常量相关的 nodeRadius。
const nodeRadius = (id: string) => (isGhost(id) ? GHOST_R : isBook(id) ? BOOK_R : isIdea(id) ? IDEA_R : NODE_R);

/** 典籍→原典片段（按书名聚合，复用 canon.ts）。思想→关键词命中的片段。 */
const CANON_BY_BOOK: Map<string, Passage[]> = (() => {
  const m = new Map<string, Passage[]>();
  for (const p of canon) {
    const a = m.get(p.book) ?? [];
    a.push(p);
    m.set(p.book, a);
  }
  return m;
})();
const passagesOfBook = (name: string) => CANON_BY_BOOK.get(name) ?? [];
const passagesOfIdea = (name: string) => canon.filter((p) => p.keywords.includes(name));

/** 起止收进到节点边缘、中段垂直向偏移成弧（同源多边以 idx 奇偶分向，免叠合）。 */
function edgePath(fromId: string, toId: string, idx: number): string {
  const from = NODE_POS[fromId];
  const to = NODE_POS[toId];
  if (!from || !to) return "";
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const r1 = nodeRadius(fromId);
  const r2 = nodeRadius(toId);
  const start = { x: from.x + ux * (r1 + 2), y: from.y + uy * (r1 + 2) };
  const end = { x: to.x - ux * (r2 + 6), y: to.y - uy * (r2 + 6) };
  const mx = (start.x + end.x) / 2;
  const my = (start.y + end.y) / 2;
  const nx = -uy;
  const ny = ux;
  const bend = Math.min(34, len * 0.18) * (idx % 2 === 0 ? 1 : -1);
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

const ARROW_MARKER: Record<EdgeType, string | undefined> = {
  师承: "url(#ar-shi)",
  出于: "url(#ar-chu)",
  影响: "url(#ar-ying)",
  交游: undefined,
  著述: "url(#ar-zhu)",
  主张: "url(#ar-zhang)",
  承变: "url(#ar-cheng)",
  对立: undefined,
  注解: "url(#ar-zhujie)",
  非: "url(#ar-fei)",
};

export default function LineageMap({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const [vis, setVis] = useState({ scholar: true, book: true, idea: true });
  const [focused, setFocused] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState<"school" | "origin">("school");
  // 时序扫光：sweepYear 为当前公元前年（null＝关闭、全显）；播放时自 600 递减至 200，依次点亮。
  const [sweepYear, setSweepYear] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const nodeVisible = (id: string) => {
    const t = nodeTypeOf(id);
    return t === "book" ? vis.book : t === "idea" ? vis.idea : vis.scholar; // ghost 随「人物」
  };
  // 本图只画诸子之轴（前600→200）：汉以后著者幽灵（canonOnly）与出轴思想（bc<200）
  // 不在其列，全量见典籍图谱——用户定界「诸子的脉络图保留」，故后加之数据于此让路。
  const inAxis = (id: string) => !isCanonOnly(id) && !(isIdea(id) && bcOf(id) < BC_MAX);
  const edgeVisible = (e: { from: string; to: string }) =>
    nodeVisible(e.from) && nodeVisible(e.to) && inAxis(e.from) && inAxis(e.to);

  // 聚焦节点的一跳邻居（含自身），用于高亮、压暗其余。
  const neighborSet = useMemo(() => {
    if (!focused) return null;
    const s = new Set<string>([focused]);
    for (const e of LINEAGE_EDGES) {
      if (e.from === focused) s.add(e.to);
      else if (e.to === focused) s.add(e.from);
    }
    return s;
  }, [focused]);

  const sweepOn = sweepYear !== null;
  // 「已登场」判定：sweepYear 递减（600→200），bc≥sweepYear 者已存（bc 大＝更早）。
  const nodeActive = (id: string) => (!sweepOn || bcOf(id) >= (sweepYear as number)) && (!focused || (neighborSet?.has(id) ?? false));
  const edgeActive = (e: { from: string; to: string }) =>
    (!sweepOn || Math.min(bcOf(e.from), bcOf(e.to)) >= (sweepYear as number)) && (!focused || e.from === focused || e.to === focused);
  const nodeFill = (id: string) => (colorMode === "origin" ? originColorOf(id) : schoolColorOf(id));

  // 时序播放：每 70ms 递减 4 年，至 200 停。
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setSweepYear((y) => {
        const cur = y ?? 600;
        return cur <= 200 ? 200 : Math.max(200, cur - 4);
      });
    }, 70);
    return () => clearInterval(t);
  }, [playing]);
  useEffect(() => {
    if (playing && sweepYear !== null && sweepYear <= 200) setPlaying(false);
  }, [playing, sweepYear]);
  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (sweepYear === null || sweepYear <= 200) setSweepYear(600);
    setPlaying(true);
  };
  const resetSweep = () => {
    setPlaying(false);
    setSweepYear(null);
  };
  const progress = sweepYear === null ? 400 : 600 - sweepYear; // 0..400，左古右今与横轴一致

  // 自适应缩放：量取画布区可用尺寸，SVG 以 viewBox 整体缩放、左列道标签按百分比对齐。
  // 聚焦详情侧栏占 300px，算可用宽时扣除，免其压覆图面。
  const bodyRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBox({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const availW = Math.max(0, box.w - (focused ? 300 : 0));
  // 以高定缩放，不再取宽高较小者：十一道竖排后图近乎方形（1520×1422），而屏是扁的，
  // 取小者则高永远先到顶——图缩成窄窄一条，两侧空着大片纸（「只占一小块」的根因）。
  // 改为道带吃满纸高；宽若溢出便横向展卷（.lane-scroll-x），本就是长卷的读法。
  const scale = box.h ? box.h / CONTENT_H : 0;
  const drawW = Math.round(CONTENT_W * scale);
  const drawH = Math.round(CONTENT_H * scale);

  return (
    <div className="lineage-stage" onClick={onClose} role="dialog" aria-label={t("百家演变脉络")} aria-modal="true">
      <div className="lineage-card" onClick={(e) => e.stopPropagation()}>
        <header className="lineage-head">
          <div>
            <p className="eyebrow">{t("百家演变脉络")}</p>
            <h2>{t("诸子师承 · 思想典籍时序长卷")}</h2>
          </div>
          <div className="lineage-filter" role="group" aria-label={t("节点类型显隐")}>
            {([["scholar", "人物"], ["book", "典籍"], ["idea", "思想"]] as const).map(([k, label]) => (
              <button key={k} className={vis[k] ? "active" : ""} aria-pressed={vis[k]} onClick={() => setVis((v) => ({ ...v, [k]: !v[k] }))}>
                {t(label)}
              </button>
            ))}
          </div>
          <button className="stage-close" onClick={onClose} aria-label={t("关闭")}>×</button>
        </header>

        <div className="lineage-controls">
          <div className="ctl-group" role="group" aria-label={t("着色模式")}>
            <button className={colorMode === "school" ? "active" : ""} aria-pressed={colorMode === "school"} onClick={() => setColorMode("school")}>{t("学派色")}</button>
            <button className={colorMode === "origin" ? "active" : ""} aria-pressed={colorMode === "origin"} onClick={() => setColorMode("origin")}>{t("地域色")}</button>
          </div>
          <div className="ctl-group time-ctl" role="group" aria-label={t("时序扫光")}>
            <button className={playing ? "active" : ""} onClick={togglePlay} aria-label={playing ? t("暂停") : t("播放时序")}>{playing ? "⏸" : "▶"} {t("时序")}</button>
            <input type="range" min={0} max={400} step={5} value={progress} onChange={(e) => { setPlaying(false); setSweepYear(600 - Number(e.target.value)); }} aria-label={t("年代游标")} />
            <span className="time-label">{sweepYear === null ? t("全时段") : t("前{year}年", { year: sweepYear })}</span>
            <button onClick={resetSweep} aria-label={t("重置时序")} title={t("重置时序")}>↺</button>
          </div>
        </div>

        <div className="lineage-body" ref={bodyRef}>
          {/* 整图按 viewBox 缩放纳入一页；左列道标签以 laneY 占 CONTENT_H 百分比定位、随缩放对齐 */}
          <div className="lineage-canvas" style={{ width: drawW, height: drawH }}>
            <div className="lane-labels">
              {SCHOOLS.map((s, i) => (
                <div key={s.id} className="lane-label" style={{ top: `${(laneY(i) / CONTENT_H) * 100}%`, color: s.color }}>
                  <i style={{ background: s.color }} />
                  <span>{t(s.name)}</span>
                </div>
              ))}
            </div>
            <svg viewBox={`0 0 ${CONTENT_W} ${CONTENT_H}`} width={drawW} height={drawH} className="lineage-svg" role="img" aria-label={t("诸子师承时序图")} onClick={() => setFocused(null)} style={{ cursor: "default" }}>
              <defs>
                <marker id="ar-shi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["师承"].color} />
                </marker>
                <marker id="ar-chu" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["出于"].color} />
                </marker>
                <marker id="ar-ying" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["影响"].color} />
                </marker>
                <marker id="ar-zhu" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["著述"].color} />
                </marker>
                <marker id="ar-zhang" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["主张"].color} />
                </marker>
                <marker id="ar-cheng" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["承变"].color} />
                </marker>
                <marker id="ar-zhujie" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["注解"].color} />
                </marker>
                <marker id="ar-fei" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES["非"].color} />
                </marker>
              </defs>

              {/* 道带三行引导线：典籍(上·极淡)／人物(中·道线)／思想(下·极淡)，显三类分行结构 */}
              {SCHOOLS.map((s, i) => {
                const bt = bandTop(i);
                return (
                  <g key={s.id}>
                    <line x1={PAD_L} y1={bt + BOOK_Y} x2={CONTENT_W - PAD_R} y2={bt + BOOK_Y} stroke={s.color} strokeOpacity={0.07} strokeWidth={1} />
                    <line x1={PAD_L} y1={laneY(i)} x2={CONTENT_W - PAD_R} y2={laneY(i)} stroke={s.color} strokeOpacity={0.18} strokeWidth={1} />
                    <line x1={PAD_L} y1={bt + IDEA_Y} x2={CONTENT_W - PAD_R} y2={bt + IDEA_Y} stroke={s.color} strokeOpacity={0.07} strokeWidth={1} />
                  </g>
                );
              })}

              {/* 纪年纵线 + 底轴刻度 */}
              {BC_TICKS.map((bc) => {
                const x = xOf(bc);
                return (
                  <g key={bc} className="chrono-tick">
                    <line x1={x} y1={PAD_T - 20} x2={x} y2={CONTENT_H - PAD_B + 22} stroke="#b8a98c" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="2 4" />
                    <text x={x} y={CONTENT_H - PAD_B + 42} textAnchor="middle" className="chrono-label">{t("前{year}", { year: bc })}</text>
                  </g>
                );
              })}

              {/* 师承/出于/影响/交游/著述/主张/承变/对立 边（任一端节点隐藏则不绘） */}
              {LINEAGE_EDGES.map((e, i) => {
                if (!edgeVisible(e)) return null;
                const st = EDGE_STYLES[e.type];
                const w = e.type === "交游" ? 2.6 : e.type === "对立" ? 2.2 : 1.8;
                return (
                  <path
                    key={i}
                    d={edgePath(e.from, e.to, i)}
                    fill="none"
                    stroke={st.color}
                    strokeOpacity={edgeActive(e) ? 0.85 : 0.06}
                    strokeWidth={w}
                    strokeDasharray={st.dash === "none" ? undefined : st.dash}
                    markerEnd={ARROW_MARKER[e.type]}
                  />
                );
              })}

              {/* 幽灵节点（先秦溯源之幽灵，如文王）——随「人物」显隐；汉以后著者不入本图 */}
              {vis.scholar && GHOSTS.filter((g) => !g.canonOnly).map((g) => {
                const p = NODE_POS[g.id];
                return (
                  <g key={g.id} transform={`translate(${p.x},${p.y})`} className="ghost-node" opacity={nodeActive(g.id) ? 1 : 0.16} onClick={(e) => { e.stopPropagation(); setFocused(g.id); }} style={{ cursor: "pointer" }}>
                    <circle r={GHOST_R} fill="#f3ead4" stroke={nodeFill(g.id)} strokeWidth={1.6} strokeDasharray="3 3" />
                    <text textAnchor="middle" dy="0.34em" fontSize={11} fill={nodeFill(g.id)}>{g.glyph}</text>
                    <text textAnchor="middle" y={-(GHOST_R + 8)} fontSize={lang === "en" ? 9 : 11} fill="#7a6f5a">{t(g.name)}</text>
                    <title>{t("{name}：{note}", { name: t(g.name), note: t(g.note) })}</title>
                  </g>
                );
              })}

              {/* 诸子节点 */}
              {vis.scholar && SCHOLAR_CHRONO.map((c) => {
                const p = NODE_POS[c.id];
                return (
                  <g key={c.id} transform={`translate(${p.x},${p.y})`} className="scholar-node" opacity={nodeActive(c.id) ? 1 : 0.16} onClick={(e) => { e.stopPropagation(); setFocused(c.id); }} style={{ cursor: "pointer" }}>
                    <circle r={NODE_R} fill={nodeFill(c.id)} stroke="#f3ead4" strokeWidth={2} />
                    <text textAnchor="middle" dy="0.34em" fontSize={13} fill="#f6efe0" fontWeight={600}>{glyphOf(c.id)}</text>
                    <text textAnchor="middle" y={-(NODE_R + 10)} fontSize={lang === "en" ? 10 : 12} fill="#4a4030" fontWeight={600}>{t(nameOf(c.id))}</text>
                    <title>{t("{name} · 约前{year}年 · {school}", { name: t(nameOf(c.id)), year: c.birthBC, school: t(SCHOOLS.find((s) => s.id === c.schoolId)?.name ?? "") })}</title>
                  </g>
                );
              })}

              {/* 典籍节点（中圈）——居道上 */}
              {vis.book &&
                BOOKS.map((b) => {
                  const p = NODE_POS[b.id];
                  if (!p) return null;
                  return (
                    <g key={b.id} transform={`translate(${p.x},${p.y})`} className="book-node" opacity={nodeActive(b.id) ? 1 : 0.16} onClick={(e) => { e.stopPropagation(); setFocused(b.id); }} style={{ cursor: "pointer" }}>
                      <circle r={BOOK_R} fill={nodeFill(b.id)} fillOpacity={0.2} stroke={nodeFill(b.id)} strokeWidth={1.6} />
                      <text textAnchor="middle" y={-(BOOK_R + 3)} fontSize={lang === "en" ? 8.5 : 10} fill="#5a4a32" fontWeight={600}>{t(b.name)}</text>
                      <title>{t("{name} · {school} · 约成书前{year} · {note}", { name: t(b.name), school: t(SCHOOLS.find((s) => s.id === b.schoolId)?.name ?? ""), year: b.bc, note: t(b.note) })}</title>
                    </g>
                  );
                })}

              {/* 思想节点（小圈）——居道下 */}
              {vis.idea &&
                IDEAS.filter((it) => it.bc >= BC_MAX).map((it) => {
                  const p = NODE_POS[it.id];
                  if (!p) return null;
                  return (
                    <g key={it.id} transform={`translate(${p.x},${p.y})`} className="idea-node" opacity={nodeActive(it.id) ? 1 : 0.16} onClick={(e) => { e.stopPropagation(); setFocused(it.id); }} style={{ cursor: "pointer" }}>
                      <circle r={IDEA_R} fill={nodeFill(it.id)} fillOpacity={0.14} stroke={nodeFill(it.id)} strokeWidth={1.5} />
                      <text textAnchor="middle" y={IDEA_R + 12} fontSize={lang === "en" ? 8.5 : 10} fill="#5a4a32" fontWeight={600}>{t(it.name)}</text>
                      <title>{t("{name} · {school} · 约前{year} · {note}", { name: t(it.name), school: t(SCHOOLS.find((s) => s.id === it.schoolId)?.name ?? ""), year: it.bc, note: t(it.note) })}</title>
                    </g>
                  );
                })}

              {/* 时序游标：当前公元前年之竖线＋年标 */}
              {sweepOn && (
                <g className="sweep-cursor" pointerEvents="none">
                  <line x1={xOf(sweepYear as number)} y1={PAD_T - 20} x2={xOf(sweepYear as number)} y2={CONTENT_H - PAD_B + 22} stroke="#5a4a32" strokeWidth={1.4} strokeOpacity={0.5} />
                  <text x={xOf(sweepYear as number)} y={PAD_T - 26} textAnchor="middle" className="chrono-label" fill="#5a4a32">{t("前{year}", { year: sweepYear })}</text>
                </g>
              )}
              {/* 聚焦节点光环 */}
              {focused && NODE_POS[focused] && (
                <circle cx={NODE_POS[focused].x} cy={NODE_POS[focused].y} r={nodeRadius(focused) + 5} fill="none" stroke={nodeFill(focused)} strokeWidth={1.6} strokeOpacity={0.6} className="focus-halo" pointerEvents="none" />
              )}
            </svg>
          </div>
          {focused && <LineageDetail id={focused} onPick={setFocused} onClose={() => setFocused(null)} />}
        </div>

        <footer className="lineage-legend">
          {(["师承", "出于", "影响", "交游", "著述", "主张", "承变", "对立", "注解", "非"] as EdgeType[]).map((k) => {
            const st = EDGE_STYLES[k];
            const w = k === "交游" ? 2.6 : k === "对立" ? 2.2 : 1.8;
            return (
              <span key={k} className="legend-item">
                <svg width="36" height="10" className="legend-swatch" aria-hidden>
                  <line x1="1" y1="5" x2={st.arrow ? 30 : 33} y2={5} stroke={st.color} strokeWidth={w} strokeDasharray={st.dash === "none" ? undefined : st.dash} />
                  {st.arrow && <polygon points="29,1 35,5 29,9" fill={st.color} />}
                </svg>
                {t(st.label)}
              </span>
            );
          })}
          <span className="legend-item"><i className="legend-ghost" /> {t("幽灵节点")}</span>
          <span className="legend-shapes">
            {/* 三个圈各带一名，中文以全角空分隔；英文词长，改作中点分隔 */}
            <i className="shape-circle shape-lg" />{t("人物")}{lang === "en" ? " · " : "　"}<i className="shape-circle shape-md" />{t("典籍")}{lang === "en" ? " · " : "　"}<i className="shape-circle shape-sm" />{t("思想")}
          </span>
          {colorMode === "origin" && (
            <span className="legend-origins">
              {ORIGINS.map((o) => (
                <span key={o.id} className="legend-item"><i className="origin-swatch" style={{ background: o.color }} />{t(o.name)}</span>
              ))}
            </span>
          )}
          <span className="legend-hint">{t("横轴公元前纪年（左古右今），诸子按约生年置点、以学派分道；每道分上中下三行——典籍·人物·思想，三类分行互不遮挡。点节点聚焦其一跳关系、右侧详展典籍篇章；▶ 时序按年代依次点亮；可切「学派色／地域色」观思想之地域传播。可左右上下拖动滚动。")}</span>
        </footer>
      </div>
    </div>
  );
}

/**
 * 聚焦节点的详情侧栏：列出其一跳关系（师承/出于/影响/交游/著述/主张/承变/对立/注解/非），
 * 典籍节点直达 canon 原典篇章、思想节点按关键词命中相关原典——脉络图与典籍库由此联动。
 * 点击任一关系 chip 即改聚焦对象（onPick），可顺藤摸瓜。
 */
function LineageDetail({ id, onPick, onClose }: { id: string; onPick: (next: string) => void; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const scholar = scholarMap[id];
  const ghost = GHOSTS.find((g) => g.id === id);
  const book = bookOf(id);
  const idea = ideaOf(id);
  const kind = nodeTypeOf(id);
  const accent = schoolColorOf(id);
  const originName = ORIGINS.find((o) => o.id === originIdOfNode(id))?.name;

  // 关系方向检索：out＝id 为源（from）、inc＝id 为的（to）、either＝无向任一端。
  const out = (type: EdgeType) => LINEAGE_EDGES.filter((e) => e.from === id && e.type === type).map((e) => e.to);
  const inc = (type: EdgeType) => LINEAGE_EDGES.filter((e) => e.to === id && e.type === type).map((e) => e.from);
  const either = (type: EdgeType) =>
    LINEAGE_EDGES.filter((e) => e.type === type && (e.from === id || e.to === id)).map((e) => (e.from === id ? e.to : e.from));

  // 关系 chip：学派色圆点＋名，点之改聚焦。prefix 标方向（如「师承」「受影响」）。
  const chip = (tid: string, prefix?: string) => (
    <button key={tid + (prefix ?? "")} className="rel-chip" onClick={(e) => { e.stopPropagation(); onPick(tid); }} title={t("{label}（{kind}）", { label: t(labelOf(tid)), kind: t(kindLabel(tid)) })}>
      <i className="rel-chip-dot" style={{ background: schoolColorOf(tid) }} />
      {prefix ? <span className="rel-chip-prefix">{t(prefix)}</span> : null}
      <span className="rel-chip-name">{t(labelOf(tid))}</span>
    </button>
  );

  // 区段：空数组 / 空串则不渲染（[] 在 JS 为 truthy，须显式判 length）。
  const section = (title: string, children: ReactNode) => {
    const empty = Array.isArray(children) ? children.length === 0 : children === null || children === undefined || children === "";
    if (empty) return null;
    return (
      <section className="detail-section">
        <p className="detail-section-title">{t(title)}</p>
        <div className="detail-section-body">{children}</div>
      </section>
    );
  };

  const renderPassages = (ps: Passage[]) =>
    ps.map((p) => (
      <article key={p.id} className="detail-passage">
        <p className="detail-passage-src">《{t(p.book)}·{t(p.chapter)}》</p>
        {/* 原文不替换；其下的白话是中文，英文模式下再附一行英译 */}
        <p className="detail-passage-text">{p.text}</p>
        <p className="detail-passage-gloss">{p.gloss}</p>
        <Said text={p.gloss} />
      </article>
    ));

  const glyphBadge = kind === "book" ? "典" : kind === "idea" ? "思" : glyphOf(id);

  // 一行提要由几段拼成：中文以全角空相隔（与原来一字不差），英文用中点，
  // 每段各自过一道词表。书与思想两种本就在词表里有整句模板，照原样用。
  const sep = lang === "en" ? " · " : "　";
  const metaLine =
    kind === "scholar" && scholar
      ? [scholar.courtesy ? t("字 {courtesy}", { courtesy: t(scholar.courtesy) }) : "", t(scholar.school), t("前{year}年", { year: bcOf(id) }), originName ? t(originName) : ""]
          .filter(Boolean)
          .join(sep)
      : kind === "ghost" && ghost
      ? [t("幽灵节点"), t("前{year}年", { year: bcOf(id) }), originName ? t(originName) : ""].filter(Boolean).join(sep)
      : kind === "book" && book
      ? t("{school}　约成书于前{year}年", { school: t(schoolNameOf(id)), year: bcOf(id) })
      : kind === "idea" && idea
      ? t("{school}　约盛行于前{year}年", { school: t(schoolNameOf(id)), year: bcOf(id) })
      : "";

  const body =
    kind === "scholar" || kind === "ghost" ? (
      <>
        <p className="detail-intro">{scholar ? t(scholar.intro) : ghost ? t(ghost.note) : ""}</p>
        {section("主张", out("主张").map((t) => chip(t)))}
        {section("著述", out("著述").map((t) => chip(t)))}
        {section("师承 · 渊源 · 所受影响", [
          ...inc("师承").map((t) => chip(t, "师承")),
          ...inc("出于").map((t) => chip(t, "出于")),
          ...inc("影响").map((t) => chip(t, "受影响")),
        ])}
        {section("门人 · 流派 · 所影响", [
          ...out("师承").map((t) => chip(t, "门人")),
          ...out("出于").map((t) => chip(t, "所出")),
          ...out("影响").map((t) => chip(t, "所影响")),
        ])}
        {section("交游", either("交游").map((t) => chip(t)))}
        {section("非（所反对之思想）", out("非").map((t) => chip(t)))}
      </>
    ) : kind === "book" ? (
      <>
        <p className="detail-intro">{book?.note ?? ""}</p>
        {section("著者", inc("著述").map((t) => chip(t)))}
        {section("注解 · 征引此书", inc("注解").map((t) => chip(t)))}
        {section("此书所注解 · 征引", out("注解").map((t) => chip(t)))}
        {section("原典篇章", renderPassages(passagesOfBook(book?.name ?? "")))}
      </>
    ) : (
      <>
        <p className="detail-intro">{idea?.note ?? ""}</p>
        {section("主张者", inc("主张").map((t) => chip(t)))}
        {section("非（反对者）", inc("非").map((t) => chip(t)))}
        {section("承变", [
          ...inc("承变").map((t) => chip(t, "承自")),
          ...out("承变").map((t) => chip(t, "启")),
        ])}
        {section("对立", either("对立").map((t) => chip(t)))}
        {section("相关原典", renderPassages(passagesOfIdea(idea?.name ?? "")))}
      </>
    );

  return (
    <aside className="lineage-detail" onClick={(e) => e.stopPropagation()}>
      <header className="detail-head" style={{ borderTopColor: accent }}>
        <span className="detail-glyph" style={{ background: accent }}>{glyphBadge}</span>
        <div className="detail-titles">
          <p className="detail-kind">{t(kindLabel(id))}</p>
          <h3 className="detail-name">{t(labelOf(id))}</h3>
          {metaLine ? <p className="detail-meta">{metaLine}</p> : null}
        </div>
        <button className="stage-close detail-close" onClick={onClose} aria-label={t("关闭详情")}>×</button>
      </header>
      <div className="detail-scroll">{body}</div>
    </aside>
  );
}
