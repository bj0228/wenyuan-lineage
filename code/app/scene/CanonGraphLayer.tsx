"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  SCHOOLS,
  BOOKS,
  IDEAS,
  EDGE_STYLES,
  LINEAGE_EDGES,
  nodesByType,
  edgesAmong,
  relationsOf,
  glyphOf,
  labelOf,
  kindLabel,
  schoolColorOf,
  schoolNameOf,
  bcOf,
  eraOf,
  noteOf,
  nodeTypeOf,
  bookOf,
  isBook,
  isIdea,
  isGhost,
  isFactEdge,
  type NodeType,
  type EdgeType,
} from "../world/lineage";
import { scholarMap, scholars } from "../world/characters";
import { loadGraph, graphBooks, graphConcept, graphConcepts, booksOfConcept, conceptsOfBook, relatedConcepts, conceptSpread, booksMentioning } from "../world/sikuGraph";
import { planFor, personAliases, NO_BOOK_NOTE, NOWHERE_NOTE, type EdgePlan } from "../world/edgeEvidence";
import { fold } from "../world/hanVariants";
import { useVerseAnnotations } from "../world/annotations";
import { useT } from "../i18n/lang";
import { canon, retrieve, retrieveIn, retrievePreferFull, retrieveFull, fallbackFor, embedQuery, type Retrieved, type FullHit, type Passage } from "../world/canon";
import { loadAllWorks, loadBookWorks, loadOwnWorks } from "../world/canonSource";
import { adaptationsOf, clipsOf, retrieveMedia, type MediaClip } from "../world/adaptations";
import { XMEDIA_ON } from "../world/feature-flags";
import { AnnotPanel } from "./AnnotPanel";
import { MediaUnderstand } from "./MediaUnderstand";
import ClipReviewLayer from "./ClipReviewLayer";

/**
 * 典籍知识图谱（全屏）。两个面孔：
 *  ① 全图——把 lineage.ts 这张完整知识图（人物＋幽灵＋典籍＋思想、十种关系边）一张画出来，
 *     环形、学派弧＋十色关系边；顶部四钮按类隐显（人物／后世／典籍／思想）。「后世」默认不开——
 *     汉以后著者与旧题之书另成一路，要看时点开便并入同一环。
 *  ② 检索——输入一个词（如「战争」），按 题→书→句→人 四列铺开：哪些书提到、哪几句、对应谁说的，
 *     内容直接取自典籍检索（retrieve＋retrieveFull），是「内容驱动」的图。
 * 节点皆可点出右侧详情；句/节点皆可加注、请诸子批注（复用 annotations.ts，刷新仍在）。
 * 框为回纹卷云（见 .kg-* 样式），节点按学派色着色，检索图与全图同一套笔触（曲边、箭头、关系签）。
 */
type Dim = "检索" | "全图";

// —— 全图（环形）几何 ——
const CX = 320;
const CY = 320;
/** 学派名所在半径。须在最外环（思想 286）与扇区外缘（310）之外，否则压在思想节点上 */
const RL = 328;

// —— 检索图（同心环：题居中 → 书 → 句 → 人，与全图同款环形笔触）几何 ——
const R_BOOK = 116;   // 书环半径
const R_SENT = 202;   // 句环半径
const R_PERSON = 290; // 人环半径
const R_QUERY = 24;   // 题节点半径
/** 书环上最多添几部「图谱另载」的书（「道」通二十五部，全摊开又成一团） */
const TEXT_BOOK_CAP = 8;
const polar = (a: number, r: number) => ({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });

const VB_DEFAULT = { x: -60, y: -60, w: 760, h: 760 }; // 默认 viewBox（留边距，标签不出界）
type VB = { x: number; y: number; w: number; h: number };

/**
 * 依容器宽高比把方形的默认 viewBox 摊成同比——图在扁框里才不会两侧空着一大片。
 * 环本身是方的（760×760），框宽于高时就横向加边：以方框为底，宽的那一维补足，
 * 内容仍居中，只是边距不同；缩放比 = 短边 / 760，环便贴着框高铺满。
 */
function fitVB(w: number, h: number): VB {
  if (!w || !h) return { ...VB_DEFAULT };
  const side = VB_DEFAULT.w;
  const vw = w >= h ? (side * w) / h : side;
  const vh = w >= h ? side : (side * h) / w;
  return { x: VB_DEFAULT.x - (vw - side) / 2, y: VB_DEFAULT.y - (vh - side) / 2, w: vw, h: vh };
}

/**
 * SVG viewBox pan/zoom hook：滚轮缩放（以鼠标为中心）、拖拽平移、双击复位。
 * 拖拽位移 < 3px 视为点击（不吞节点 onClick）。
 */
function useSvgPanZoom(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [vb, setVb] = useState<VB>({ ...VB_DEFAULT });
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean; captured: boolean; pointerId: number } | null>(null);
  // 上一手势是否拖动过——pointerup 会清空 drag，但 click 在其后触发，
  // 故单独留存，供节点 onClick 判定是否吞掉。
  const lastDragged = useRef(false);
  /** 读者是否已自行缩放／平移过——是则不再随框尺寸重摊视角 */
  const touched = useRef(false);

  /** 复位：按当下框形摊开（双击复位、首次挂载、框尺寸变动都走这里） */
  const reset = useCallback(() => {
    touched.current = false;
    const r = svgRef.current?.getBoundingClientRect();
    setVb(fitVB(r?.width ?? 0, r?.height ?? 0));
  }, [svgRef]);

  // 框尺寸一变（开合详情栏、改窗宽）就重摊一次：只在尚未手动缩放平移过时，
  // 免得把读者自己拖出来的视角抢回去。
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(() => {
      if (touched.current) return;
      const r = svg.getBoundingClientRect();
      setVb(fitVB(r.width, r.height));
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, [svgRef]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // 鼠标在 SVG 坐标系中的位置（相对 viewBox）
    const mx = vb.x + ((e.clientX - rect.left) / rect.width) * vb.w;
    const my = vb.y + ((e.clientY - rect.top) / rect.height) * vb.h;
    touched.current = true;
    const scale = e.deltaY > 0 ? 1.18 : 1 / 1.18; // 缩放因子
    const w = Math.max(120, Math.min(2400, vb.w * scale));
    const h = Math.max(120, Math.min(2400, vb.h * scale));
    // 以鼠标为锚点缩放：新的 minX = mx - (mx - oldMinX) * (newW / oldW)
    const x = mx - (mx - vb.x) * (w / vb.w);
    const y = my - (my - vb.y) * (h / vb.h);
    setVb({ x, y, w, h });
  }, [vb, svgRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // 只响应左键。注意：此处**不**立即 setPointerCapture——
    // 若 capture，后续 pointerup 的 target 会被重定向到 svg，导致浏览器合成的
    // click 事件 target 变成 svg（pointerdown 在 <g>、pointerup 在 svg 的共同祖先），
    // <g> 节点的 onClick 便永远收不到（"点全不能点"的根因）。改为拖动超阈值时才 capture。
    if (e.button !== 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    lastDragged.current = false;
    drag.current = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false, captured: false, pointerId: e.pointerId };
  }, [vb, svgRef]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    // 达 3px 阈值才算拖动：此时才 capture + 平移，避免点击手抖也被当成拖动
    if (!d.moved) {
      if (Math.abs(dx) + Math.abs(dy) <= 3) return;
      d.moved = true;
      lastDragged.current = true;
      touched.current = true;
      const svg = svgRef.current;
      if (svg) { svg.setPointerCapture(d.pointerId); d.captured = true; }
    }
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // 屏幕像素 → viewBox 单位的换算
    const scaleX = vb.w / rect.width;
    const scaleY = vb.h / rect.height;
    setVb((v) => ({ ...v, x: d.vx - dx * scaleX, y: d.vy - dy * scaleY }));
  }, [vb, svgRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    const svg = svgRef.current;
    if (svg && d?.captured) svg.releasePointerCapture?.(d.pointerId);
    drag.current = null;
  }, [svgRef]);

  /** 上一手势是否拖动过（用于节点 onClick 判定是否吞掉） */
  const wasDragged = useCallback(() => lastDragged.current, []);

  return { vb, onWheel, onPointerDown, onPointerMove, onPointerUp, reset, wasDragged };
}

const ALL_EDGE_TYPES = Object.keys(EDGE_STYLES) as EdgeType[];

/**
 * 原文边（「载」）不在手写的 EDGE_STYLES 里——那一型因判据不成立已撤（见 lineage.ts）。
 * 但「原文所载」一节与环上的原文边仍要有自己的颜色，故此处另立一式，只此一处用，
 * 且不进 ALL_EDGE_TYPES：它不是一种「编者所断」的关系，不该出现在关系图例里。
 */
const TEXT_EDGE = { color: "#5d7f86", dash: "1 4", arrow: false, label: "载" } as const;

type LNode = { id: string; x: number; y: number; r: number; ring: number; color: string; glyph: string; label: string; schoolId: string; showLabel: boolean };
type LSector = { id: string; name: string; color: string; a0: number; a1: number; mid: number };
type LRing = { name: string; radius: number; count: number };
type LEdge = { key: string; from: string; to: string; type: EdgeType; d: string; lx: number; ly: number; color: string; dash: string; arrow: boolean; fact: boolean };

// ════════════════════════════════════════
//  分层同心环布局（全图）
// ════════════════════════════════════════
/**
 * 四层同心环，由内而外：后世（幽灵）→ 人物 → 典籍 → 思想。
 *
 * 为何分层。此前 171 个节点共挤一个环，166 条边一概走二次曲线、中点朝圆心拉
 * （`nx = (CX - mx) * 0.22`），于是每条边都横穿圆盘，叠成一团乱麻——节点多与边
 * 多都只是表象，真正的病根是「任意两点皆可连且必过中心」。
 *
 * 分层治的正是这个：边的两端多半落在相邻两环（人→书是著述，书→思想是所载，
 * 人→思想是主张），分层之后这些边变成**短的径向线**，根本到不了圆心。
 *
 * 但只分层还不够——若各环自排其序，孔子在三点钟、《论语》在九点钟，径向也成了
 * 横贯。故学派扇区**贯通四环**：先按各学派在全部可见节点里的占比切出角度楔形，
 * 每一环内该学派的节点再在自己那片楔形里均分。于是 孔子→《论语》→仁 落在同一
 * 个方向上，边短到几乎是一段径向的小线段，且同一学派的东西自然聚成一块扇形。
 */
const RINGS: Record<NodeType, number> = { ghost: 94, scholar: 154, book: 219, idea: 286 };
const RING_NAME: Record<NodeType, string> = { ghost: "后世", scholar: "人物", book: "典籍", idea: "思想" };
const R_NODE_RING: Record<NodeType, number> = { ghost: 9, scholar: 13, book: 11, idea: 7.5 };
/** 扇区楔形的内外缘（贯通四环，故自最内环之内直到最外环之外） */
const SECTOR_RI = 60;
const SECTOR_RO = 310;

function useFullLayout(filters: Set<Filter>) {
  return useMemo(() => {
    // 「人物」是先秦诸子，「后世」是汉以后的著者与旧题之书（幽灵）——
    // 二者本不同代，混作一钮则 29 枚后世节点挤在环上关不掉，故分钮。
    const byRing: { type: NodeType; ids: string[] }[] = [];
    if (filters.has("后世")) byRing.push({ type: "ghost", ids: nodesByType("scholar").filter(isGhost) });
    if (filters.has("人物")) byRing.push({ type: "scholar", ids: nodesByType("scholar").filter((id) => !isGhost(id)) });
    if (filters.has("典籍")) byRing.push({ type: "book", ids: nodesByType("book") });
    if (filters.has("思想")) byRing.push({ type: "idea", ids: nodesByType("idea") });

    const allIds = byRing.flatMap((r) => r.ids);
    const idSet = new Set(allIds);
    const schoolIdOf = (id: string) => SCHOOLS.find((s) => s.color === schoolColorOf(id))?.id ?? "";

    // ① 先按学派在「全部可见节点」里的占比切角度楔形。各环共用这一套边界，
    //    同派之物才会在四环上对齐成一道扇形。
    const order = [...SCHOOLS.map((s) => s.id), ""]; // 末一格收无派可归者
    const countOf = new Map<string, number>();
    for (const id of allIds) {
      const k = schoolIdOf(id);
      countOf.set(k, (countOf.get(k) ?? 0) + 1);
    }
    const present = order.filter((k) => (countOf.get(k) ?? 0) > 0);
    const total = allIds.length || 1;
    const wedge = new Map<string, { a0: number; a1: number }>();
    let acc = -Math.PI / 2;
    for (const k of present) {
      const span = ((countOf.get(k) ?? 0) / total) * Math.PI * 2;
      wedge.set(k, { a0: acc, a1: acc + span });
      acc += span;
    }

    // ② 每环内，同派的节点在自己那片楔形里均分（同派内按年代排）
    const nodes: LNode[] = [];
    for (const ring of byRing) {
      const radius = RINGS[ring.type];
      for (const k of present) {
        const w = wedge.get(k);
        if (!w) continue;
        const mine = ring.ids.filter((id) => schoolIdOf(id) === k).sort((a, b) => bcOf(a) - bcOf(b));
        const m = mine.length;
        if (!m) continue;
        mine.forEach((id, j) => {
          const a = w.a0 + ((j + 0.5) / m) * (w.a1 - w.a0);
          const t = nodeTypeOf(id);
          nodes.push({
            id,
            x: CX + radius * Math.cos(a),
            y: CY + radius * Math.sin(a),
            r: R_NODE_RING[t],
            ring: radius,
            color: schoolColorOf(id),
            glyph: isBook(id) ? (bookOf(id)?.name ?? "?").charAt(0) : glyphOf(id),
            label: labelOf(id),
            schoolId: k,
            // 思想节点 73 枚最密，标签一概画出必糊；它的名字在详情里看。
            showLabel: t !== "idea",
          });
        });
      }
    }

    const sectors: LSector[] = present
      .filter((k) => k !== "")
      .map((k) => {
        const w = wedge.get(k)!;
        const sc = SCHOOLS.find((s) => s.id === k);
        return { id: k, name: sc?.name ?? "", color: sc?.color ?? "#888", a0: w.a0, a1: w.a1, mid: (w.a0 + w.a1) / 2 };
      });

    // 环轨：只画眼下确有节点的那几环（如关掉「后世」，最内那环便不画）
    const rings: LRing[] = byRing.filter((r) => r.ids.length > 0).map((r) => ({ name: RING_NAME[r.type], radius: RINGS[r.type], count: r.ids.length }));

    const posOf = new Map(nodes.map((n) => [n.id, n]));
    // 只手写的那十类关系边。原文边（字面统计出的「载」）不入环——判据不成立
    // （见 lineage.ts 的说明）；原文仍在，但只作既有边的旁证，见「原文所载」一节。
    const edges: LEdge[] = edgesAmong(idSet).map((e, k) => {
      const A = posOf.get(e.from);
      const B = posOf.get(e.to);
      if (!A || !B) return null;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L;
      const uy = dy / L;
      const sx = A.x + ux * A.r;
      const sy = A.y + uy * A.r;
      const ex = B.x - ux * B.r;
      const ey = B.y - uy * B.r;
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2;
      /**
       * 控制点怎么偏，按两端是否同环分两样——这是「不穿心」的要害。
       *
       * 跨环（人→书、书→思想、人→思想）：本就是径向的短线，只给一点点切向的
       * 弯，免得死板，也让同一对环之间的几条边不完全叠在一处。
       *
       * 同环（人物环内的师承、思想环内的承变对立）：弦若长，直连就会横穿内圈。
       * 故沿弦的法向**朝外**推——朝内推会压过更内层的环与圆心，朝外只占环间空隙。
       * 幅度随弦长增长而设上限，短边因此几乎是直的。
       */
      const sameRing = Math.abs(A.ring - B.ring) < 0.5;
      let cx: number;
      let cy: number;
      if (sameRing) {
        const d = Math.hypot(mx - CX, my - CY) || 1;
        const push = Math.min(L * 0.16, 30);
        cx = mx + ((mx - CX) / d) * push;
        cy = my + ((my - CY) / d) * push;
      } else {
        cx = mx + -uy * L * 0.06;
        cy = my + ux * L * 0.06;
      }
      const st = EDGE_STYLES[e.type];
      return {
        key: `${e.from}-${e.to}-${e.type}-${k}`,
        from: e.from,
        to: e.to,
        type: e.type,
        d: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
        lx: cx,
        ly: cy,
        color: st.color,
        dash: st.dash,
        arrow: st.arrow,
        fact: isFactEdge(e.type),
      };
    }).filter(Boolean) as LEdge[];

    return { nodes, sectors, rings, edges };
  }, [filters]);
}

/** 学派楔形：贯通四环（自最内环之内到最外环之外），同派之物落在同一片扇形里 */
function sectorPath(a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0o = CX + SECTOR_RO * Math.cos(a0);
  const y0o = CY + SECTOR_RO * Math.sin(a0);
  const x1o = CX + SECTOR_RO * Math.cos(a1);
  const y1o = CY + SECTOR_RO * Math.sin(a1);
  const x0i = CX + SECTOR_RI * Math.cos(a0);
  const y0i = CY + SECTOR_RI * Math.sin(a0);
  const x1i = CX + SECTOR_RI * Math.cos(a1);
  const y1i = CY + SECTOR_RI * Math.sin(a1);
  return `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${SECTOR_RO} ${SECTOR_RO} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${SECTOR_RI} ${SECTOR_RI} 0 ${large} 0 ${x0i} ${y0i} Z`;
}

// ════════════════════════════════════════
//  顶层
// ════════════════════════════════════════
export default function CanonGraphLayer({ onClose, initialQuery }: { onClose: () => void; initialQuery?: string }) {
  const t = useT();
  // 带着检索词进来才落在「检索」页：检索模式未输词时是空白一片，
  // 空手点开图谱却看不见图，故默认先摆出「全图」那张环。
  const [dim, setDim] = useState<Dim>(initialQuery?.trim() ? "检索" : "全图");
  const [clipId, setClipId] = useState<string | null>(null);
  return (
    <div className="kg-layer">
      <div className="kg-top">
        <div>
          <div className="eyebrow">{t("典籍 · 知识图谱 · 环图版")}</div>
          <h2>{t("百家图谱")}</h2>
        </div>
        <button className="kg-back-btn" onClick={onClose}>← {t("返回典籍")}</button>
      </div>
      <div className="kg-tabs">
        {(["检索", "全图"] as Dim[]).map((d) => (
          <button key={d} className={`kg-tab${d === dim ? " on" : ""}`} onClick={() => setDim(d)}>
            {t(d)}
          </button>
        ))}
      </div>
      <div className="kg-body">
        {dim === "检索" ? <SearchMode initialQuery={initialQuery} onOpenClip={setClipId} /> : <FullMode onOpenClip={setClipId} />}
      </div>
      {clipId && <ClipReviewLayer mediaId={clipId} onClose={() => setClipId(null)} />}
    </div>
  );
}

// ════════════════════════════════════════
//  全图模式（人物＋典籍＋思想，十种关系，一张环）
// ════════════════════════════════════════
const FILTERS = ["人物", "后世", "典籍", "思想"] as const;
type Filter = (typeof FILTERS)[number];

function FullMode({ onOpenClip }: { onOpenClip: (id: string) => void }) {
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);
  // 默认不开「后世」：先秦诸子＋其书其思想已是一环密密，29 枚汉以后著者再压上来便看不清谁是谁。
  // 要看《红楼梦》《人间词话》那一路，点开「后世」即并入同一环。
  const [filters, setFilters] = useState<Set<Filter>>(new Set(FILTERS.filter((f) => f !== "后世")));
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoom = useSvgPanZoom(svgRef);

  function toggle(f: Filter) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) {
        if (next.size > 1) next.delete(f); // 至少留一类，避免空图
      } else next.add(f);
      return next;
    });
  }
  const layout = useFullLayout(filters);

  /**
   * 默认只摊开「事实」那一档边（著述/师承/注解/出于，47 条），「解释」那 119 条
   * （主张/影响/承变/对立/非/交游）收起来。
   *
   * 这是治乱麻的另一半：分层把边变短了，但 166 条一次全画出来仍是满屏。而这两档
   * 本不该等量齐观——「孔子著《论语》」与「韩非主张法治」一个是事实一个是读法
   * （见 lineage.ts 的 EDGE_TIER）。故默认只画硬的那档，点中一个节点便把**它的**
   * 全部关系放出来（选中时本就只亮它那一簇，不怕乱），要通览则有图例上那个开关。
   */
  const [showAllEdges, setShowAllEdges] = useState(false);
  const shownEdges = useMemo(
    () => layout.edges.filter((e) => e.fact || showAllEdges || (!!selected && (e.from === selected || e.to === selected))),
    [layout.edges, showAllEdges, selected],
  );
  const softCount = layout.edges.length - layout.edges.filter((e) => e.fact).length;

  const connected = useMemo(() => {
    const s = new Set<string>();
    if (selected) {
      s.add(selected);
      // 连通性按**全部**边算，与显隐无关——收起来的边不等于不存在，
      // 点一个节点该照亮它真正的邻居。
      for (const e of layout.edges) {
        if (e.from === selected) s.add(e.to);
        if (e.to === selected) s.add(e.from);
      }
    }
    return s;
  }, [selected, layout.edges]);

  return (
    <div className="kg-split">
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div className="kg-filters">
          {FILTERS.map((f) => (
            <button key={f} className={`kg-ftab${filters.has(f) ? " on" : ""}`} onClick={() => toggle(f)}>
              {t(f)}
            </button>
          ))}
          <span className="kg-hint" style={{ marginLeft: "auto" }}>{t("点节点看详情，关系可顺藤跳焦点")}</span>
        </div>
        <div className="kg-graph-wrap" style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            ref={svgRef}
            className="kg-svg kg-svg-pan"
            viewBox={`${zoom.vb.x} ${zoom.vb.y} ${zoom.vb.w} ${zoom.vb.h}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
            onWheel={zoom.onWheel}
            onPointerDown={zoom.onPointerDown}
            onPointerMove={zoom.onPointerMove}
            onPointerUp={zoom.onPointerUp}
            onDoubleClick={zoom.reset}
          >
            <defs>
              {ALL_EDGE_TYPES.map((t) => (
                <marker key={t} id={`kgm-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLES[t].color} />
                </marker>
              ))}
            </defs>

            {/* 学派楔形贯通四环，同派之物落在同一片扇形里；名字摆在最外环之外 */}
            {layout.sectors.map((s) => (
              <g key={s.id}>
                <path d={sectorPath(s.a0, s.a1)} fill={s.color} opacity={0.07} />
                <text x={CX + RL * Math.cos(s.mid)} y={CY + RL * Math.sin(s.mid)} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill={s.color} opacity={0.75}>
                  {t(s.name)}
                </text>
              </g>
            ))}

            {/* 四道环轨：分层得看得出来，否则读者不知道为何内外有别 */}
            {layout.rings.map((r) => (
              <g key={r.name}>
                <circle cx={CX} cy={CY} r={r.radius} fill="none" stroke="#cbbb96" strokeWidth={0.7} strokeDasharray="2 6" opacity={0.55} />
                <text x={CX} y={CY - r.radius} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#9a8e74" opacity={0.9}>
                  <tspan dy={-1}>{t(r.name)}</tspan>
                </text>
              </g>
            ))}

            {shownEdges.map((e) => {
              const dim2 = connected.size > 0 && !(connected.has(e.from) && connected.has(e.to));
              const showLabel = connected.size > 0 && !!selected && (e.from === selected || e.to === selected);
              return (
                <g key={e.key} opacity={dim2 ? 0.1 : e.fact ? 0.9 : 0.55} style={{ transition: "opacity .2s" }}>
                  <path d={e.d} fill="none" stroke={e.color} strokeWidth={e.fact ? 1.7 : 1.1} strokeDasharray={e.dash === "none" ? undefined : e.dash} markerEnd={e.arrow ? `url(#kgm-${e.type})` : undefined} />
                  {showLabel && (
                    <g transform={`translate(${e.lx},${e.ly})`}>
                      <rect x={-15} y={-7} width={30} height={13} rx={6} fill="#f4efdf" stroke="#9a8e7b" strokeWidth={0.5} opacity={0.92} />
                      <text x={0} y={3} textAnchor="middle" fontSize={8} fill="#5c544a">{EDGE_STYLES[e.type].label}</text>
                    </g>
                  )}
                </g>
              );
            })}

            {layout.nodes.map((n) => {
              const ghost = isGhost(n.id);
              const dim2 = connected.size > 0 && !connected.has(n.id);
              const on = selected === n.id;
              return (
                <g key={n.id} className="kg-node" transform={`translate(${n.x},${n.y})`} opacity={dim2 ? 0.16 : 1} style={{ transition: "opacity .2s", cursor: "pointer" }} onClick={() => { if (zoom.wasDragged()) return; setSelected((prev) => (prev === n.id ? null : n.id)); }}>
                  <title>{t(labelOf(n.id))} · {t(kindLabel(n.id))}</title>
                  <circle r={n.r} fill={n.color} stroke={on ? "#983e30" : "#efe6cf"} strokeWidth={on ? 3 : 2.2} strokeDasharray={ghost ? "3 2" : undefined} />
                  <text className="kg-glyph" textAnchor="middle" dominantBaseline="central" y={0} fontSize={n.r * 0.8}>{n.glyph}</text>
                  {n.showLabel && <text className="kg-nlabel" textAnchor="middle" y={n.r + 12}>{t(n.label)}</text>}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="kg-legend">
          {/* 事实类的边常摊开，故画足；解释类的边默认收起，故画淡——与环上粗细一致。
              循环变量叫 et 不叫 t：此处原作 t，把取词的 t 遮住了，图例十个关系名
              因此一直只出中文（英文模式下「师承」没换成 Taught by，即是此故）。 */}
          {ALL_EDGE_TYPES.map((et) => (
            <span key={et} className="ln" style={{ opacity: isFactEdge(et) ? 1 : 0.6 }}>
              <i style={{ borderTop: `2px ${EDGE_STYLES[et].dash === "none" ? "solid" : "dashed"} ${EDGE_STYLES[et].color}` }} />
              {t(EDGE_STYLES[et].label)}
            </span>
          ))}
          <button
            className="kg-back-inline"
            style={{ marginLeft: 4, padding: "1px 7px", fontSize: 11, opacity: showAllEdges ? 1 : 0.7 }}
            onClick={() => setShowAllEdges((v) => !v)}
            title={t("「事实」类（著述/师承/注解/出于）常在图上；「解释」类（主张/影响/承变/对立/非/交游）是义理之断，默认收起，点中一个节点也会放出它那几条")}
          >
            {showAllEdges ? `✓ ${t("解释类")} ${softCount}` : `+ ${t("解释类")} ${softCount}`}
          </button>
          <span style={{ width: 6 }} />
          {SCHOOLS.map((s) => (
            <span key={s.id} className="sch"><i style={{ background: s.color }} />{t(s.name)}</span>
          ))}
        </div>
      </div>

      <div className="kg-node-detail">
        {selected ? (
          <>
            <button className="kg-back-inline" onClick={() => setSelected(null)}>{t("← 返回全图")}</button>
            <NodeDetail id={selected} onFocus={setSelected} onOpenClip={onOpenClip} />
          </>
        ) : (
          <div className="kg-annot-empty" style={{ padding: "24px 6px" }}>{t("四层同心环，由内而外：后世 → 人物 → 典籍 → 思想。学派扇区贯通四环，故「孔子 → 《论语》 → 仁」落在同一个方向上，边只在相邻两环之间走短线，不横穿圆心。常在图上的是「事实」类的边（著述/师承/注解/出于）；「主张/影响/承变/对立/非/交游」是义理之断，默认收起——点中一个节点便放出它的全部关系，要通览则按图例上那个钮。顶部四钮按类隐显，「后世」收着汉以后的著者与旧题之书（朱熹、曹雪芹、山海经…）。")}</div>
        )}
      </div>
    </div>
  );
}

function NodeDetail({ id, onFocus, onOpenClip }: { id: string; onFocus: (id: string) => void; onOpenClip: (id: string) => void }) {
  const t = useT();
  const ghost = isGhost(id);
  const [muOpen, setMuOpen] = useState(false);

  /**
   * 这一节点可凭的四库全文段落（可引分片二十六部，见 canonSource）。
   *
   * 按节点之类各取其所需：书节点取本书，人节点取其名下之书，思想节点不限书——
   * 它问的是「诸书谁讲过这个」，一书之内答不全。幽灵节点不取（无书）。
   *
   * 此前这一层是断的：图谱只认 canon.ts 那七百余条选本与 canonFull 的五部全文，
   * 二十六部分片只有对谈那一路（dialogue.ts 的 `loadOwnWorks`）吃得到。今于此处
   * 取回，下面各路检索一概以 `retrieve` 的 `extra` 并入池子——那个参数本就是为此
   * 留的口子（见 canon.ts）。
   *
   * 取不到（未抽取、网络不通）得空数组，检索便退回选本，与接通之前无异。
   */
  const [own, setOwn] = useState<Passage[]>([]);
  useEffect(() => {
    let alive = true;
    setOwn([]);
    if (ghost) return;
    const want = isBook(id)
      ? loadBookWorks(bookOf(id)?.name ?? "")
      : isIdea(id)
        ? loadAllWorks()
        : loadOwnWorks(id);
    want.then((ps) => { if (alive) setOwn(ps); }).catch(() => {});
    return () => { alive = false; };
  }, [id, ghost]);

  /**
   * 这一节点可引的几句。三类节点三样取法，一概以全文为主、选本兜底
   * （见 canon.ts 的 FULLTEXT_FIRST）。
   */
  const syncVerses = useMemo<Retrieved[]>(() => {
    // 思想节点：以标签（「名实」「无为」之类）检二十六部全文，检不得退选本。
    if (isIdea(id)) return retrievePreferFull(labelOf(id), own, { limit: 6 });

    if (isBook(id)) {
      // 书节点：径取本书原文。此前是先选本、不足六条才以全文补齐——那是全文未接
      // 上时的权宜；如今有全文便用全文，一部书点开见的是它自己的原文，不是我们
      // 替它挑的那几句。十部无分片可取的书（《周易》《尚书》《大学》之类）仍退
      // 回选本——那几部确实无全文可引。
      if (own.length) return own.slice(0, 6).map((p) => ({ ...p, score: 0, sem: 0 }));
      return canon.filter((p) => p.book === bookOf(id)?.name).slice(0, 6).map((p) => ({ ...p, score: 1, sem: 0 }));
    }

    if (ghost) return [];

    // 人物节点：取他名下那部书的原文。查询是空串，在打分里一分不得（见 retrieveIn
    // 的 score > 0 那道筛），故先以其所主之题去检自家全文，不足则以开篇几段补齐
    // ——一部书的头几段总是它最认得出的几段。
    const themes = scholarMap[id]?.themes ?? [];
    if (own.length) {
      const byTheme = themes.length ? retrieveIn(themes.join(" "), own, { scholarId: id, limit: 6 }) : [];
      if (byTheme.length >= 6) return byTheme;
      const seen = new Set(byTheme.map((v) => v.id));
      const pad = own.filter((p) => !seen.has(p.id)).slice(0, 6 - byTheme.length).map((p) => ({ ...p, score: 0, sem: 0 }));
      return [...byTheme, ...pad];
    }
    // 无全文可取（未抽取、网络不通、或本无其书）才退回选本
    const r = retrieve("", { scholarId: id, onlyOwner: true, limit: 6 });
    return r.length ? r : fallbackFor(id, 4);
  }, [id, ghost, own]);

  /**
   * 思想节点的引句再以语义重检一遍，覆盖上面那版字面结果。
   *
   * 只思想节点要：它的标签是「无用之用」「名实」这类词，字面检索只认得用了这几个字
   * 的句子，而说的是同一件事却换了说法的检不出来——那正是语义该管的。人物节点与
   * 书节点不走这里：人物那路查询是空串（限域取他名下的条目，无词可 embed），
   * 书节点径按书名取，都与语义无干。
   *
   * 同页上 `page.tsx` 的引典检索也是这个两步做法，缘由同：`retrieve` 同步而
   * `embedQuery` 异步，等向量则点开节点先空一下。
   */
  const [semVerses, setSemVerses] = useState<Retrieved[] | null>(null);
  useEffect(() => {
    setSemVerses(null);
    if (!isIdea(id)) return;
    let alive = true;
    // 查询向量与二十六部全文一道取：两者各走一趟网络，串起来等两次没必要
    Promise.all([embedQuery(labelOf(id)), loadAllWorks()]).then(([qVec, extra]) => {
      if (alive && qVec) setSemVerses(retrievePreferFull(labelOf(id), extra, { limit: 6 }, qVec));
    });
    return () => { alive = false; };
  }, [id]);
  const verses = semVerses ?? syncVerses;

  const [fullVerses, setFullVerses] = useState<FullHit[]>([]);
  useEffect(() => {
    let cancelled = false;
    setFullVerses([]);
    if (!isIdea(id)) return;
    retrieveFull(labelOf(id), { limit: 4 }).then((h) => { if (!cancelled) setFullVerses(h); }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const rels = useMemo(() => relationsOf(id), [id]);

  /**
   * 原文所载：这一节点在 `public/siku/graph.json` 里实有其文的那一层。
   *
   * 与上面那排「关系」分列而不相混，正是「断」与「据」之别——那一排出自手写的
   * LINEAGE_EDGES，是编者所断的义理；这一节出自 10912 段原文的统计，每一条都挂
   * 得出具体是哪几段，点开即见原文（见 sikuGraph 的 loci）。
   *
   * 只书节点与思想节点有：书问「这部书讲哪些」，思想问「哪些书讲这个」。人物与
   * 幽灵节点不走这里——图里统计出的边是书→思想，人名另有 bookPerson 一路。
   *
   * 这一节还是那 548 个概念唯一露面的地方。环上只画得出其中 26 个（环是按 lineage
   * 的 IDEAS 排的），所以「兼爱」「白马非马」「循名责实」「捭阖」这些一书独有的
   * 宗旨——恰是各家最认得出的面目——只在此处见得到。
   */
  const [graphReady, setGraphReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadGraph().then(() => { if (alive) setGraphReady(true); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const [openLocus, setOpenLocus] = useState<string | null>(null);
  useEffect(() => { setOpenLocus(null); }, [id]);

  const textRels = useMemo<{ key: string; label: string; sub: string; loci: string[] }[]>(() => {
    if (!graphReady) return [];
    if (isBook(id)) {
      const title = bookOf(id)?.name ?? "";
      const g = graphBooks().find((b) => b.title === title);
      if (!g) return [];
      return conceptsOfBook(g.id, 14).map((l) => ({
        key: l.term,
        label: l.term,
        sub: `${l.segs}段 · 通${graphConcept(l.term)?.b ?? 1}部`,
        loci: l.loci,
      }));
    }
    if (isIdea(id)) {
      const titleOf = new Map(graphBooks().map((b) => [b.id, b.title]));
      return booksOfConcept(labelOf(id), 14).map((l) => ({
        key: l.bookId,
        label: titleOf.get(l.bookId) ?? l.bookId,
        // 段数取边上的 segs（全数），不取 loci.length（出处只留两三条）
        sub: `${l.segs}段`,
        loci: l.loci,
      }));
    }
    return [];
  }, [id, graphReady]);

  // 出处段落按 id 取自 `own`——书节点已载本书、思想节点已载二十六部，无须另取一趟
  const ownById = useMemo(() => new Map(own.map((p) => [p.id, p])), [own]);
  const openPassages = useMemo<Passage[]>(() => {
    if (!openLocus) return [];
    const r = textRels.find((x) => x.key === openLocus);
    return (r?.loci ?? []).map((lid) => ownById.get(lid)).filter((p): p is Passage => !!p);
  }, [openLocus, textRels, ownById]);

  /**
   * 此断何据：点开「关系」里的一条边，就地给它找原文作证。
   *
   * 那一排边出自手写的 `LINEAGE_EDGES`，是编者所断的义理。断语不配据，图上画一
   * 根线，读者无从知道凭什么画——这一节便是补这一环（规划在 `edgeEvidence.ts`，
   * 哪类边该拿什么样的原文来证，逐型写明）。
   *
   * 作证走两路，分开列而不相混：
   *
   *   语义——只在选本那一池里问。向量表（`canon-vectors`，781 条诸子条目）只覆盖
   *     选本；四库那一万余段无向量，问也问不出语义。这一路正是撤掉「载」边时许下
   *     的那条路：《孟子》不连写「性善」，写「人性之善也，犹水之就下也」，字面永
   *     远找不着，语义找得着。embed 不通（离线、无 Key）则自动退作关键词，不报错。
   *
   *   全文——四库二十六部，只检得字面，故限在当事人那一部书之内。限书是要紧的：
   *     不限则「仁」「道」这类词满篇皆是，检出来的与这条边毫无干系。
   *
   *   互见——人与人之间的边另走一路：证不在义理而在称述，直接取图谱 `bookPerson`
   *     那张表（从一万余段里统计出来的事实，带段数与出处）。
   *
   * 三路都可能空手。空手就显空手——不拿沾边的句子来凑，凑出来的「据」比没有更坏。
   */
  type EvVerse = { id: string; book: string; chapter: string; text: string; via: "语义" | "全文" };
  type EvMention = { book: string; person: string; segs: number; passages: Passage[] };
  /**
   * 能查到哪儿。「检遍了而检不出」与「此处无从查证」是两件事，面板上要分开说。
   *   ok         —— 查了（全文池里有他的书，或本不限书）
   *   noFullText —— 全文池里无他名下之书，只剩选本那一路
   *   nowhere    —— 两池都没有他（二十八位汉以后的著者），无处可查
   */
  type EvScope = "ok" | "noFullText" | "nowhere";
  type Evidence = { key: number; plan: EdgePlan; verses: EvVerse[]; mentions: EvMention[]; loading: boolean; scope: EvScope };

  const [openRel, setOpenRel] = useState<number | null>(null);
  useEffect(() => { setOpenRel(null); }, [id]);
  const [evidence, setEvidence] = useState<Evidence | null>(null);

  useEffect(() => {
    const edge = openRel === null ? null : rels[openRel];
    if (!edge || openRel === null) { setEvidence(null); return; }
    const plan = planFor(edge);
    const key = openRel;
    // 先把「此断何据」那句话摆出来，不等网络——读者点下去该立刻看见在证什么
    setEvidence({ key, plan, verses: [], mentions: [], loading: true, scope: "ok" });
    let alive = true;

    // 互见要按图谱里的称谓查（《韩非子》称申不害作「申子」），几种称谓挨个试
    const titleOf = new Map(graphBooks().map((b) => [b.id, b.title]));
    const wanted: { book: string; person: string; segs: number; loci: string[] }[] = [];
    if (graphReady) {
      for (const m of plan.mention) {
        for (const alias of personAliases(m.personId)) {
          for (const l of booksMentioning(alias)) {
            const title = titleOf.get(l.bookId) ?? l.bookId;
            if (m.bookTitle && title !== m.bookTitle) continue;
            wanted.push({ book: title, person: alias, segs: l.segs, loci: l.loci });
          }
        }
      }
    }

    Promise.all([plan.sem ? embedQuery(plan.sem.q) : Promise.resolve(null), loadAllWorks()])
      .then(([qVec, all]) => {
        if (!alive) return;
        const verses: EvVerse[] = [];
        let scope: EvScope = "ok";
        if (plan.sem) {
          const sem = plan.sem;
          // ① 语义：选本池（有向量）。限人时只取他名下的条目——「这个思想必须是他的」。
          for (const v of retrieve(sem.q, { scholarId: sem.scholarId, onlyOwner: !!sem.scholarId, limit: 3 }, qVec)) {
            verses.push({ id: v.id, book: v.book, chapter: v.chapter, text: v.text, via: "语义" });
          }
          // ② 全文：四库那一池无向量，只检得字面，故限在当事人名下之书。
          //    `sem.books` 列的是「该由哪几部来证」，与全文池取交集；交集为空便
          //    不检全文，不退作全检（缘由见 edgeEvidence 的 `books` 一节）。
          const want = sem.books;
          const pool = want ? all.filter((p) => want.includes(p.book)) : all;
          // 全文池里没有他的书时，还要看选本池有无他的条目：有则只是少了一路，
          // 无则两路皆空、根本无处可查（二十八位汉以后的著者即是此例）。
          if (want && pool.length === 0) {
            const inSel = sem.scholarId ? fallbackFor(sem.scholarId, 1).length > 0 : true;
            scope = inSel ? "noFullText" : "nowhere";
          }
          if (pool.length) {
            const seen = new Set(verses.map((v) => v.text));
            for (const v of retrieveIn(sem.q, pool, { limit: 3 })) {
              if (!seen.has(v.text)) verses.push({ id: v.id, book: v.book, chapter: v.chapter, text: v.text, via: "全文" });
            }
          }
        }
        // 互见的出处段落按 id 从全文里取回，每处只挂两条——是举证，不是列全
        const byId = new Map(all.map((p) => [p.id, p]));
        const mentions: EvMention[] = wanted.map((w) => ({
          book: w.book,
          person: w.person,
          segs: w.segs,
          passages: w.loci.map((lid) => byId.get(lid)).filter((p): p is Passage => !!p).slice(0, 2),
        }));
        setEvidence({ key, plan, verses, mentions, loading: false, scope });
      })
      .catch(() => { if (alive) setEvidence({ key, plan, verses: [], mentions: [], loading: false, scope: "ok" }); });

    return () => { alive = false; };
  }, [openRel, rels, graphReady]);

  const color = schoolColorOf(id);
  const media = useMemo(() => {
    const ads = adaptationsOf(id);
    const clips = clipsOf(id);
    return { ads, clips, has: ads.length > 0 || clips.length > 0 };
  }, [id]);

  return (
    <div>
      <div className="kg-nd-head">
        <div className="glyph" style={{ background: color }}>{isBook(id) ? (bookOf(id)?.name ?? "?").charAt(0) : glyphOf(id)}</div>
        <div>
          <h3>{t(labelOf(id))}</h3>
          <div className="kind">{t(kindLabel(id))} · {t(schoolNameOf(id)) || "—"}{bcOf(id) ? ` · ${t(eraOf(bcOf(id)))}` : ""}</div>
        </div>
      </div>
      {noteOf(id) && <p className="kg-nd-meta">{t(noteOf(id))}</p>}

      <div className="kg-nd-sec">{t("关系")}</div>
      {rels.length ? (
        <div className="kg-rel-chips">
          {rels.map((e, i) => {
            const other = e.from === id ? e.to : e.from;
            const out = e.from === id;
            const st = EDGE_STYLES[e.type];
            const on = openRel === i;
            return (
              <button
                key={i}
                className="kg-rel-chip"
                style={on ? { borderColor: st.color, background: "#f6eedc" } : undefined}
                onClick={() => setOpenRel((p) => (p === i ? null : i))}
                title={t("看此断何据")}
              >
                <span className="dot" style={{ background: st.color }} />
                <span>{out ? "↗" : "↖"}{t(st.label)}</span>
                <small>{t(labelOf(other))}·{t(kindLabel(other))}</small>
              </button>
            );
          })}
        </div>
      ) : <div className="kg-annot-empty">{t("暂无直连关系。")}</div>}

      {/* 一条边的「何据」。边本身是编者所断，此处是这一断的原文凭据（见 edgeEvidence） */}
      {openRel !== null && rels[openRel] && evidence && evidence.key === openRel && (() => {
        const e = rels[openRel];
        const other = e.from === id ? e.to : e.from;
        const st = EDGE_STYLES[e.type];
        const ev = evidence;
        const dry = !ev.loading && ev.verses.length === 0 && ev.mentions.length === 0;
        // plan 里几句话夹着人名与思想名，句子是可译之键、名字由 vars 填（见
        // edgeEvidence.ts 的 EdgePlan.vars）。填进去的名字自身也得译一道，
        // 不然英文句子里会露出中文人名。
        const tv = (vars?: Record<string, string>) =>
          vars && Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, t(v)]));
        return (
          <div className="kg-ev" style={{ borderLeftColor: st.color }}>
            <div className="kg-ev-head">
              <b>{t("此断何据")}</b>
              <span>{t(labelOf(id))} <i style={{ color: st.color, fontStyle: "normal" }}>—{t(st.label)}→</i> {t(labelOf(other))}</span>
              <button className="kg-back-inline" onClick={() => onFocus(other)} title={t("跳至此节点")}>{t("跳至")}{t(labelOf(other))}</button>
            </div>
            <p className="kg-nd-meta" style={{ margin: "6px 0 0" }}>{t(ev.plan.why, tv(ev.plan.vars))}</p>
            {ev.plan.caveat && (
              <p className="kg-nd-meta" style={{ margin: "4px 0 0", color: "#8a6f43" }}>{t(ev.plan.caveat)}</p>
            )}

            {ev.loading && <div className="kg-annot-empty" style={{ marginTop: 8 }}>{t("正取原文…")}</div>}

            {ev.scope !== "ok" && (
              <p className="kg-nd-meta" style={{ margin: "4px 0 0", color: "#8a6f43" }}>
                {t(ev.scope === "nowhere" ? NOWHERE_NOTE : NO_BOOK_NOTE)}
              </p>
            )}

            {dry && (
              <div className="kg-annot-empty" style={{ marginTop: 8 }}>
                {!ev.plan.sem
                  ? t("此类边无须原文作证。")
                  : ev.scope === "nowhere"
                    ? t("断语仍立，据暂付阙。")
                    : t("检不出可作证的原文。这一断仍是编者的断语——不拿沾边的句子来凑。")}
              </div>
            )}

            {ev.verses.length > 0 && (
              <>
                <div className="kg-nd-sec" style={{ marginTop: 10 }}>
                  {ev.plan.sem ? t(ev.plan.sem.label, tv(ev.plan.sem.labelVars)) : t("原文")}
                </div>
                {ev.verses.map((v) => (
                  <div key={v.id} className="kg-verse" style={{ borderLeftColor: v.via === "语义" ? st.color : "#567565" }}>
                    <span className="kg-ev-via">{v.via === "语义" ? t("语义") : t("全文·字面")}</span>
                    《{t(v.book)}·{t(v.chapter)}》
                    <div>{v.text}</div>
                  </div>
                ))}
              </>
            )}

            {ev.mentions.length > 0 && (
              <>
                <div className="kg-nd-sec" style={{ marginTop: 10 }}>{t("互见")}</div>
                {ev.mentions.map((m, k) => (
                  <div key={`${m.book}-${m.person}-${k}`} className="kg-verse" style={{ borderLeftColor: TEXT_EDGE.color }}>
                    {/* 段数出自图谱统计（全数），下面的原文只举两条 */}
                    《{t(m.book)}》{t("称「{p}」{n}段", { p: m.person, n: m.segs })}
                    {m.passages.map((p) => (
                      <div key={p.id} style={{ marginTop: 4 }}>{p.text}</div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })()}

      {textRels.length > 0 && (
        <>
          <div className="kg-nd-sec">{t("原文所载")}</div>
          <div className="kg-rel-chips">
            {textRels.map((r) => {
              const on = openLocus === r.key;
              return (
                <button
                  key={r.key}
                  className="kg-rel-chip"
                  style={on ? { borderColor: TEXT_EDGE.color, background: "#eaf0f1" } : undefined}
                  onClick={() => setOpenLocus((p) => (p === r.key ? null : r.key))}
                  title={t("看原文出处")}
                >
                  <span className="dot" style={{ background: TEXT_EDGE.color }} />
                  <span>{isIdea(id) ? `《${t(r.label)}》` : t(r.label)}</span>
                  <small>{r.sub}</small>
                </button>
              );
            })}
          </div>
          {openLocus && (
            openPassages.length ? (
              openPassages.map((p) => (
                <div key={p.id} className="kg-verse" style={{ borderLeftColor: TEXT_EDGE.color }}>
                  《{t(p.book)}·{t(p.chapter)}》{t("（全文）")}
                  <div>{p.text}</div>
                </div>
              ))
            ) : (
              <div className="kg-annot-empty">{t("出处原文尚在载入。")}</div>
            )
          )}
        </>
      )}

      <div className="kg-nd-sec">{t("相关原句")}</div>
      {verses.length === 0 && fullVerses.length === 0 ? (
        <div className="kg-annot-empty">{ghost ? t("幽灵节点不入典籍，无引句。") : t("暂未收录相关原句。")}</div>
      ) : (
        <>
          {verses.map((v) => {
            // 自四库分片来的段落标明出处，与选本一眼可分（绿边同下面 canonFull 那一档）
            const isFull = v.id.startsWith("siku:");
            return (
              <div key={v.id} className="kg-verse" style={isFull ? { borderLeftColor: "#567565" } : undefined}>
                《{t(v.book)}·{t(v.chapter)}》{isFull ? t("（全文）") : ""}
                <div>{v.text}</div>
                {v.gloss && <small>{v.gloss}</small>}
              </div>
            );
          })}
          {fullVerses.map((v) => (
            <div key={v.verseId} className="kg-verse" style={{ borderLeftColor: "#567565" }}>
              《{t(v.book)}·{t(v.chapter)}》{t("（全文）")}
              <div>{v.text}</div>
              {v.gloss && <small>{v.gloss}</small>}
            </div>
          ))}
        </>
      )}

      {XMEDIA_ON && media.has && (
        <>
          <div className="kg-nd-sec">{t("后世影音")}</div>
          {media.ads.map((a) => (
            <div
              key={a.id}
              className="kg-media kg-media-go"
              role="button"
              tabIndex={0}
              title={t("入点评席")}
              onClick={() => onOpenClip(a.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenClip(a.id); } }}
            >
              <span className="kg-media-kind" data-k={a.kind}>{t(a.kind)}</span>
              <div>
                <b>《{t(a.title)}》</b><small>·{a.year}·{t(a.maker)}</small>
                <span className="kg-clip-go">{t("诸子点评 →")}</span>
                <p>{t(a.note)}</p>
              </div>
            </div>
          ))}
          {media.clips.map((c) => (
            <ClipRow key={c.id} clip={c} onOpen={onOpenClip} />
          ))}
          <button className="ghost-btn kg-mu-trigger" onClick={() => setMuOpen((v) => !v)}>
            {muOpen ? t("收起") : t("呈影音请诸子点评")}
          </button>
          {muOpen && <MediaUnderstand />}
        </>
      )}

      <div className="kg-nd-sec">{t("批注")}</div>
      <NodeAnnotPanel nodeId={id} />
    </div>
  );
}

function NodeAnnotPanel({ nodeId }: { nodeId: string }) {
  return (
    <AnnotPanel
      verseKey={`node:${nodeId}`}
      prompt={`客就「${labelOf(nodeId)}」（${noteOf(nodeId)}）请批注，可援可驳。`}
    />
  );
}

// ════════════════════════════════════════
//  检索模式（题→书→句→人，内容驱动；与全图同一套笔触）
// ════════════════════════════════════════
type SHit = { id: string; book: string; chapter: string; text: string; gloss?: string; owner: string; source: "curated" | "full"; score: number };
/**
 * 书环上的一枚书。两种来路：
 *  - `hit`——检索真检出了句子的书，实心，底下挂着它那几句；
 *  - `text`——检索没检出句子、但图谱记着这部书里实有此词的书，空心虚线，无句可挂。
 * 后者不是凑数。检索只取前十句，答「哪些书提到」便严重少算：「道」检出六部，
 * 图谱里是二十五部。少算的那十九部不画出来，这张图就是在说谎。
 */
type SBook = { id: string; name: string; a: number; x: number; y: number; color: string; kind: "hit" | "text"; segs: number; loci: string[] };
type SPerson = { id: string; owner: string; a: number; x: number; y: number; color: string };
type SSentence = SHit & { a: number; x: number; y: number; bookIdx: number };

function bookColorOf(name: string, hits: SHit[]): string {
  const bk = BOOKS.find((b) => b.name === name);
  if (bk) return SCHOOLS.find((s) => s.id === bk.schoolId)?.color ?? "#9a7b4a";
  const h = hits.find((x) => x.book === name && x.owner);
  if (h) return schoolColorOf(h.owner);
  return "#9a7b4a";
}

/**
 * 图谱给检索面添的那一层。
 *
 * 检索面问的是「哪些书提到、哪几句、谁说的」——这是关于文本的事实，不是义理之断，
 * 故字面统计在这里正当（与「载」边那桩不同，见 lineage.ts 的说明：那里要断的是
 * 「这个思想是不是这本书的主张」，统计答不了；这里要答的只是「这部书里有没有、
 * 有几段」，统计答得正好）。
 *
 * 添三样，都是检索本身给不出的：
 *  ① 全书分布——检索只取前十句，答「哪些书提到」严重少算；图谱记着二十六部各几段。
 *  ② 常相伴之词——出自概念—概念的互信息边（855 条，此前从未露面）：查「仁」而见
 *    「礼」「义」「孝」，是顺着文本自己的共现走，不是我们替它想的近义词。
 *  ③ 这个词的体量——见于几段、通行几部，分得出「道」这种满篇皆是的字与「兼爱」
 *    这种一家独有的宗旨。
 */
type GSpread = { bookId: string; title: string; segs: number; loci: string[] };
type GFacts = { term: string; exact: boolean; df: number; books: number; spread: GSpread[]; kin: { t: string; mi: number }[] };

/**
 * 把检索词对到图谱的词目上。
 *
 * 一、直取。
 * 二、折字再取——图谱的词目是简体（语料折字后统计的），检索框里可输繁体。折的是
 *     比对的那一侧，取回来的仍是图谱原词，与「原文永不改写」同一条规矩。
 * 三、退一步取词中最长的那个词目：图谱只认得 548 个词，「战争」不在其中，但「战」
 *     在。此时 `exact` 为假，面板上要如实说明下面这些数是「战」的，不是「战争」的
 *     ——悄悄换一个词去答，比答不出更坏。
 */
function graphTermOf(q: string): { term: string; exact: boolean } | null {
  if (graphConcept(q)) return { term: q, exact: true };
  const f = fold(q);
  const all = graphConcepts();
  const same = all.find((c) => fold(c.t) === f);
  if (same) return { term: same.t, exact: true };
  let best = "";
  for (const c of all) if (fold(c.t).length > best.length && f.includes(fold(c.t))) best = c.t;
  return best ? { term: best, exact: false } : null;
}

/** 曲边：起止按半径裁切，中点垂直方向鼓起 `bow` 像素，与全图弧线同笔触。 */function curvePath(ax: number, ay: number, bx: number, by: number, rA: number, rB: number, bow = 0): string {
  const dx = bx - ax;
  const dy = by - ay;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const sx = ax + ux * rA;
  const sy = ay + uy * rA;
  const ex = bx - ux * rB;
  const ey = by - uy * rB;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  const px = -uy;
  const py = ux;
  return `M ${sx} ${sy} Q ${mx + px * bow} ${my + py * bow} ${ex} ${ey}`;
}

function SearchMode({ initialQuery, onOpenClip }: { initialQuery?: string; onOpenClip: (id: string) => void }) {
  const t = useT();
  const [query, setQuery] = useState(initialQuery?.trim() ?? "");
  const [hits, setHits] = useState<SHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoom = useSvgPanZoom(svgRef);

  /**
   * `query` 随输入框逐字变，`settled` 只在点「画图」时落定——图谱那一层按 settled
   * 查，否则打到一半的字就去查词目，查空了又查回来，面板会闪。
   */
  const [settled, setSettled] = useState(initialQuery?.trim() ?? "");
  const [gReady, setGReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadGraph().then(() => { if (alive) setGReady(true); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  /** 二十六部全文，留着按 id 取「原文所载」那几段——检索时本就取了一趟，不另取 */
  const [pool, setPool] = useState<Passage[]>([]);

  async function run(q: string) {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setHits([]);
    setSelected("q");
    setSettled(term);
    // 查询向量与全文检索一道取：两者各走一趟网络，串起来等两次没必要
    let full: FullHit[] = [];
    let qVec: number[] | null = null;
    // 二十六部全文与向量、全文检索三路并发：各走一趟网络，串起来等三次没必要。
    // 单独 catch 是因为上面那两路失败（无向量库）不该把全文也一并丢了。
    const extraP = loadAllWorks().catch(() => [] as Passage[]);
    try {
      [qVec, full] = await Promise.all([embedQuery(term), retrieveFull(term, { limit: 6 })]);
    } catch {
      /* 无向量库时降级，忽略 */
    }
    const extra = await extraP;
    setPool(extra);
    // 语义分并进可引典那一路（第三参），故搜索建的图与引典栏同一把尺子。
    //
    // 以二十六部全文为主池，选本退作兜底（见 canon.ts 的 retrievePreferFull）：
    // 两池分检而非并池，因为并池里全文无关键词可凭，一条也挤不进前几名。限额
    // 放宽到十条，是因为这一面要据结果布图——书、人、句三环，条目太少则图太疏。
    const cur = retrievePreferFull(term, extra, { limit: extra.length ? 10 : 6 }, qVec);
    const map = new Map<string, SHit>();
    for (const c of cur) map.set(c.id, { id: c.id, book: c.book, chapter: c.chapter, text: c.text, gloss: c.gloss, owner: c.owner, source: c.id.startsWith("siku:") ? "full" : "curated", score: c.score });
    for (const f of full) {
      if (!map.has(f.verseId)) map.set(f.verseId, { id: f.verseId, book: f.book, chapter: f.chapter, text: f.text, gloss: f.gloss, owner: f.authorId, source: "full", score: f.score });
    }
    const all = [...map.values()].sort((a, b) => b.score - a.score).slice(0, 10);
    setHits(all);
    setLoading(false);
  }

  // 首次挂载若带初始词，自动出图
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) run(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const facts = useMemo<GFacts | null>(() => {
    if (!gReady || !settled) return null;
    const gt = graphTermOf(settled);
    if (!gt) return null;
    const c = graphConcept(gt.term);
    if (!c) return null;
    // 全分布，不是边：边只连每部书的三十个要目，「仁」通 21 部而边只 4 条，
    // 拿边去答「哪些书提到」便又少算一轮（见 sikuGraph 的 conceptSpread）。
    const spread: GSpread[] = conceptSpread(gt.term).map((s) => ({ bookId: s.bookId, title: s.title, segs: s.segs, loci: s.loci }));
    const kin = relatedConcepts(gt.term, 8).map((n) => ({ t: n.id, mi: n.weight }));
    return { term: gt.term, exact: gt.exact, df: c.df, books: c.b, spread, kin };
  }, [gReady, settled]);

  const { books, people, sentences } = useMemo(() => {
    const bookNames: string[] = [];
    for (const h of hits) if (!bookNames.includes(h.book)) bookNames.push(h.book);

    // 图谱有、句环上没有的书（多半是其句没挤进前十，见 gb: 那一支的分说）。取
    // 段数最多的若干部——全摊开（「道」有二十五部）便又成了一团，余下的在右边列表里看。
    //
    // 检索未毕则一部也不摆：那时 hits 还空着，下面这道「已命中者除外」便一条也滤不掉，
    // 环上会先摆出整张分布的前八部（搜「仁」则《孟子》《论语》《荀子》尽在其中），
    // 看着像图已画成，点下去却因全文池未到而无原文可取——「一会儿有原文一会儿没有」
    // 多半就是撞上了这个半成的图。检索中只留题节点与「检索中…」那一行。
    const extra = loading
      ? []
      : (facts?.spread ?? [])
          .filter((s) => !bookNames.includes(s.title))
          .slice(0, TEXT_BOOK_CAP);

    const KB = Math.max(bookNames.length + extra.length, 1);
    const step = (Math.PI * 2) / KB;
    // 书均匀布于环（自正上方起顺时针）：先命中的，再图谱另载的，于是两段各成一弧
    const books: SBook[] = bookNames.map((name, i) => {
      const a = -Math.PI / 2 + i * step;
      const p = polar(a, R_BOOK);
      const sp = facts?.spread.find((s) => s.title === name);
      return { id: `b:${name}`, name, a, x: p.x, y: p.y, color: bookColorOf(name, hits), kind: "hit" as const, segs: sp?.segs ?? 0, loci: sp?.loci ?? [] };
    });
    extra.forEach((s, i) => {
      const a = -Math.PI / 2 + (bookNames.length + i) * step;
      const p = polar(a, R_BOOK);
      books.push({ id: `gb:${s.title}`, name: s.title, a, x: p.x, y: p.y, color: bookColorOf(s.title, hits), kind: "text", segs: s.segs, loci: s.loci });
    });

    // 句布于书之外环，按所属书之角度聚拢散开。书多则书与书之间的角度窄，句的
    // 散开也得跟着收，否则邻书的句子彼此压上。
    const sentences: SSentence[] = [];
    bookNames.forEach((name, i) => {
      const hs = hits.filter((h) => h.book === name);
      const bookA = books[i].a;
      const spread = Math.min(0.26, 1.5 / Math.max(hs.length, 2), (step * 0.8) / Math.max(hs.length - 1, 1));
      hs.forEach((h, k) => {
        const a = bookA + (k - (hs.length - 1) / 2) * spread;
        const p = polar(a, R_SENT);
        sentences.push({ ...h, a, x: p.x, y: p.y, bookIdx: i });
      });
    });

    // 人布于最外环，取其诸句角度之均值
    const ownerList: string[] = [];
    for (const h of hits) if (h.owner && !ownerList.includes(h.owner)) ownerList.push(h.owner);
    const ppl: SPerson[] = ownerList.map((o) => {
      const ass = sentences.filter((s) => s.owner === o).map((s) => s.a);
      // 圆周均值需特别处理跨 -π/π 接缝：以首个角度为基准求差再折回
      const base = ass[0] ?? -Math.PI / 2;
      const deltas = ass.map((a) => {
        let d = a - base;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
      });
      const mean = base + deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1);
      const p = polar(mean, R_PERSON);
      return { id: `p:${o}`, owner: o, a: mean, x: p.x, y: p.y, color: schoolColorOf(o) };
    });
    // 外环角度间距：按角度排序后强制最小间隔（无人时跳过）
    ppl.sort((a, b) => a.a - b.a);
    const minGap = 0.34;
    if (ppl.length > 1) {
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 1; i < ppl.length; i++) {
          let d = ppl[i].a - ppl[i - 1].a;
          if (d < minGap) {
            const fix = (minGap - d) / 2;
            ppl[i].a += fix;
            ppl[i - 1].a -= fix;
          }
        }
        // 首尾接缝
        const seam = ppl[0].a + Math.PI * 2 - ppl[ppl.length - 1].a;
        if (seam < minGap) {
          const fix = (minGap - seam) / 2;
          ppl[0].a += fix;
          ppl[ppl.length - 1].a -= fix;
        }
      }
    }
    for (const p of ppl) { const pp = polar(p.a, R_PERSON); p.x = pp.x; p.y = pp.y; }
    return { books, people: ppl, sentences };
  }, [hits, facts, loading]);

  const truncated = hits.length === 10 && loading === false;
  const empty = !loading && hits.length === 0;

  // 选中相关边：用于显示关系签（按句 id 命中，避免下标错位）
  const sel = useMemo(() => {
    if (!selected) return { has: false, qbIds: new Set<string>(), bsIds: new Set<string>(), spIds: new Set<string>() };
    const bName = selected.startsWith("b:") ? selected.slice(2) : null;
    const pOwner = selected.startsWith("p:") ? selected.slice(2) : null;
    const sId = selected.startsWith("s:") ? selected.slice(2) : null;
    const qbIds = new Set<string>();
    const bsIds = new Set<string>();
    const spIds = new Set<string>();
    if (selected === "q") books.forEach((b) => qbIds.add(b.id));
    if (bName) qbIds.add(`b:${bName}`);
    // 图谱另载的书无句可挂，点中它只亮它那一条题→书的边
    if (selected.startsWith("gb:")) qbIds.add(selected);
    for (const s of sentences) {
      if (bName ? s.book === bName : sId === s.id) bsIds.add(s.id);
      if ((pOwner ? s.owner === pOwner : sId === s.id) && s.owner) spIds.add(s.id);
    }
    return { has: true, qbIds, bsIds, spIds };
  }, [selected, sentences, books]);

  return (
    <>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <input
          className="found-input"
          style={{ flex: 1 }}
          value={query}
          placeholder={t("输入一个词看它的图谱，如「战争」「赏罚」「无为」「仁」")}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(query); }}
        />
        <button className="ghost-btn" disabled={!query.trim() || loading} onClick={() => run(query)}>{loading ? t("检索中…") : t("画图")}</button>
      </div>

      <div className="kg-split">
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className="kg-graph-wrap" style={{ flex: 1, position: "relative", overflow: "auto", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {empty ? (
              <div className="kg-annot-empty" style={{ position: "relative", zIndex: 1, padding: "28px 20px", lineHeight: 1.9 }}>
                {t("输入一个词，点「画图」，就把它在典籍里的图谱铺开——哪些书提到、哪几句、对应谁说的。")}
              </div>
            ) : (
              <svg
                ref={svgRef}
                className="kg-svg kg-svg-pan"
                viewBox={`${zoom.vb.x} ${zoom.vb.y} ${zoom.vb.w} ${zoom.vb.h}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
                onWheel={zoom.onWheel}
                onPointerDown={zoom.onPointerDown}
                onPointerMove={zoom.onPointerMove}
                onPointerUp={zoom.onPointerUp}
                onDoubleClick={zoom.reset}
              >
                <defs>
                  <marker id="kgm-qb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#8a6f43" />
                  </marker>
                  <marker id="kgm-bs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#9a7b4a" />
                  </marker>
                  <marker id="kgm-sp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill="#6f6759" />
                  </marker>
                </defs>

                {/* 三道环轨（淡圈，示层次） */}
                {[R_BOOK, R_SENT, R_PERSON].map((r) => (
                  <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="#d9c9a3" strokeWidth={0.7} strokeDasharray="2 5" opacity={0.5} />
                ))}

                {/* 题→书 边（圆心向外辐射）。命中者实线带箭头；图谱另载者细点线，
                    与「原文所载」同色同笔触——它说的是「书里有这几段」，不是「检得此句」 */}
                {books.map((b) => {
                  const on = sel.qbIds.has(b.id);
                  const m = polar(b.a, (R_QUERY + R_BOOK) / 2);
                  const txt = b.kind === "text";
                  return (
                    <g key={`qb-${b.id}`} opacity={sel.has && !on ? 0.16 : txt ? 0.6 : 0.85} style={{ transition: "opacity .2s" }}>
                      <path
                        d={curvePath(CX, CY, b.x, b.y, R_QUERY, 15, 14)}
                        fill="none"
                        stroke={txt ? TEXT_EDGE.color : "#8a6f43"}
                        strokeWidth={txt ? 1 : 1.5}
                        strokeDasharray={txt ? TEXT_EDGE.dash : undefined}
                        markerEnd={txt ? undefined : "url(#kgm-qb)"}
                      />
                      {on && (
                        <g transform={`translate(${m.x},${m.y})`}>
                          <rect x={-13} y={-7} width={26} height={13} rx={6} fill="#f4efdf" stroke="#9a8e7b" strokeWidth={0.5} opacity={0.92} />
                          <text x={0} y={3} textAnchor="middle" fontSize={8} fill="#5c544a">{txt ? t("载") : t("见于")}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
                {/* 书→句 边 */}
                {sentences.map((s) => {
                  const b = books[s.bookIdx];
                  const on = sel.bsIds.has(s.id);
                  const mid = polar((b.a + s.a) / 2, (R_BOOK + R_SENT) / 2);
                  return (
                    <g key={`bs-${s.id}`} opacity={sel.has && !on ? 0.16 : 0.7} style={{ transition: "opacity .2s" }}>
                      <path d={curvePath(b.x, b.y, s.x, s.y, 15, 8, 10)} fill="none" stroke={b.color} strokeWidth={1.3} markerEnd="url(#kgm-bs)" />
                      {on && (
                        <g transform={`translate(${mid.x},${mid.y})`}>
                          <rect x={-11} y={-7} width={22} height={13} rx={6} fill="#f4efdf" stroke="#9a8e7b" strokeWidth={0.5} opacity={0.92} />
                          <text x={0} y={3} textAnchor="middle" fontSize={8} fill="#5c544a">{t("载")}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
                {/* 句→人 边 */}
                {sentences.filter((s) => s.owner).map((s) => {
                  const p = people.find((pp) => pp.owner === s.owner);
                  if (!p) return null;
                  const on = sel.spIds.has(s.id);
                  const mid = polar((s.a + p.a) / 2, (R_SENT + R_PERSON) / 2);
                  return (
                    <g key={`sp-${s.id}`} opacity={sel.has && !on ? 0.16 : 0.7} style={{ transition: "opacity .2s" }}>
                      <path d={curvePath(s.x, s.y, p.x, p.y, 8, 15, 10)} fill="none" stroke={p.color} strokeWidth={1.3} strokeDasharray="4 3" markerEnd="url(#kgm-sp)" />
                      {on && (
                        <g transform={`translate(${mid.x},${mid.y})`}>
                          <rect x={-11} y={-7} width={22} height={13} rx={6} fill="#f4efdf" stroke="#9a8e7b" strokeWidth={0.5} opacity={0.92} />
                          <text x={0} y={3} textAnchor="middle" fontSize={8} fill="#5c544a">{t("言")}</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 题节点（圆心） */}
                <g className="kg-node" transform={`translate(${CX},${CY})`} style={{ cursor: "pointer" }} onClick={() => { if (zoom.wasDragged()) return; setSelected("q"); }}>
                  <circle r={R_QUERY} fill="#983e30" stroke={selected === "q" ? "#f4e6cb" : "#efe6cf"} strokeWidth={selected === "q" ? 3 : 2.2} />
                  <text textAnchor="middle" dominantBaseline="central" y={0} fontSize={query.length <= 2 ? 14 : 11} fill="#f4e6cb" fontWeight={700}>{query.slice(0, 4) || "题"}</text>
                </g>

                {/* 书节点（环1，内嵌字徽，与全图同款）。图谱另载者细虚线一圈，
                    名下缀段数——它没有检出的句子，有的是「书里这几段提到」。

                    虚线之内须有物。从前是纸色空心配本色淡字，一环之内半边空心点，
                    看着像没载上的坏点；而点开其实有原文（见下 gb: 一支：先按图谱边上
                    挂的出处取，取不到便在全文池里按书名折字找）。故：圈内铺一层本色
                    淡晕（纸色打底在下，省得穿过的连线透上来），字改墨色不再是淡字，
                    签写作「列子 · 8 段」让那个数字有着落；悬停时虚线收成实线（在
                    globals.css 的 .kg-bk-txt 一条），告诉人这点可按。 */}
                {books.map((b) => {
                  const on = selected === b.id;
                  const txt = b.kind === "text";
                  const lp = polar(b.a, R_BOOK + (txt ? 26 : 20));
                  // 签比从前长了一截（「管子 · 54 段」），居中便压到圈上。故另载者的签
                  // 按所在方位贴边写：左半边右对齐、右半边左对齐，字一律朝外长，不越过圈。
                  const cos = Math.cos(b.a);
                  const anchor = !txt || Math.abs(cos) < 0.25 ? "middle" : cos < 0 ? "end" : "start";
                  return (
                    <g key={b.id} className="kg-node" transform={`translate(${b.x},${b.y})`} style={{ cursor: "pointer" }} onClick={() => { if (zoom.wasDragged()) return; setSelected(b.id); }}>
                      <title>{txt ? `《${t(b.name)}》 ${t("图谱 {n} 段 · 点看书中原文", { n: b.segs })}` : `《${t(b.name)}》`}</title>
                      {txt && <circle r={12} fill="#f4efdf" />}
                      <circle
                        className={txt ? "kg-bk-txt" : undefined}
                        r={txt ? 12 : 15}
                        fill={b.color}
                        fillOpacity={txt ? 0.16 : 1}
                        stroke={on ? "#983e30" : txt ? b.color : "#efe6cf"}
                        strokeWidth={on ? 3 : txt ? 1.4 : 2.2}
                        strokeDasharray={txt && !on ? "3 2.5" : undefined}
                      />
                      {/* 墨色须写进 style：.kg-glyph 那条 CSS 的 fill 压得过 SVG 呈现属性，
                          从前写 fill={b.color} 其实没生效，字徽一直是淡的——空心点之所以
                          看着像没载上，一半是这个。 */}
                      <text className="kg-glyph" textAnchor="middle" dominantBaseline="central" y={0} fontSize={txt ? 10 : 11} style={txt ? { fill: "#4a4136" } : undefined}>{b.name.charAt(0)}</text>
                      <text className="kg-nlabel" textAnchor={anchor} x={lp.x - b.x} y={lp.y - b.y} opacity={txt ? 0.9 : 1}>
                        {txt ? t("{name} · {n} 段", { name: t(b.name), n: b.segs }) : t(b.name)}
                      </text>
                    </g>
                  );
                })}

                {/* 句节点（环2，小圆点＋短签，色承其书） */}
                {sentences.map((s) => {
                  const on = selected === `s:${s.id}`;
                  const b = books[s.bookIdx];
                  const txt = s.text.length > 4 ? s.text.slice(0, 4) + "…" : s.text;
                  const lp = polar(s.a, R_SENT + 12);
                  return (
                    <g key={s.id} className="kg-node" transform={`translate(${s.x},${s.y})`} style={{ cursor: "pointer" }} onClick={() => { if (zoom.wasDragged()) return; setSelected(`s:${s.id}`); }}>
                      {/* 书名篇名可译，句本身是原文，两种语文下都照出 */}
                      <title>{`《${t(s.book)}·${t(s.chapter)}》 ${s.text}`}</title>
                      <circle r={on ? 9 : 7} fill={b.color} stroke={on ? "#983e30" : "#efe6cf"} strokeWidth={on ? 2 : 1.2} />
                      <text textAnchor="middle" dominantBaseline="central" y={0} fontSize={6.5} fill="#f4efdf">{b.name.charAt(0)}</text>
                      <text className="kg-nlabel" textAnchor="middle" x={lp.x - s.x} y={lp.y - s.y} fontSize={8}>{txt}</text>
                    </g>
                  );
                })}

                {/* 人节点（环3，与全图同款字徽＋名） */}
                {people.map((p) => {
                  const on = selected === p.id;
                  const sc = scholarMap[p.owner];
                  const lp = polar(p.a, R_PERSON + 20);
                  return (
                    <g key={p.id} className="kg-node" transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} onClick={() => { if (zoom.wasDragged()) return; setSelected(p.id); }}>
                      <circle r={15} fill={p.color} stroke={on ? "#983e30" : "#efe6cf"} strokeWidth={on ? 3 : 2.2} />
                      <text className="kg-glyph" textAnchor="middle" dominantBaseline="central" y={0} fontSize={12}>{sc?.glyph ?? "?"}</text>
                      <text className="kg-nlabel" textAnchor="middle" x={lp.x - p.x} y={lp.y - p.y}>{t(sc?.name ?? p.owner)}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="kg-legend">
            <span className="ln"><i style={{ borderTop: "2px solid #8a6f43" }} />{t("题见于书")}</span>
            <span className="ln"><i style={{ borderTop: "2px solid #9a7b4a" }} />{t("书载其句")}</span>
            <span className="ln"><i style={{ borderTop: "2px dashed #6f6759" }} />{t("句为所言")}</span>
            {/* 这一条从前写「空心，缀段数」，说的是画法；人要知道的是那点能点 */}
            <span className="ln" style={{ opacity: 0.75 }}><i style={{ borderTop: `2px dotted ${TEXT_EDGE.color}` }} />{t("图谱另载（虚线 · 点开可读其原文）")}</span>
            <span style={{ width: 6 }} />
            {SCHOOLS.map((s) => (
              <span key={s.id} className="sch"><i style={{ background: s.color }} />{t(s.name)}</span>
            ))}
          </div>
          <div className="kg-hint" style={{ marginTop: 6 }}>
            {loading
              ? t("检索中……")
              : hits.length
                ? t("共 {n} 句{more}，{books} 部书，{people} 位诸子。{g}点节点看详情。", {
                    n: hits.length,
                    more: truncated ? t("（已取前 {n}）", { n: 10 }) : "",
                    books: books.filter((b) => b.kind === "hit").length,
                    people: people.length,
                    // 检索只取前十句，少算的那些由图谱补上，故把两个数分开说
                    g: facts ? t("图谱另载 {k} 部（此词散在 {all} 部、{df} 段）。", { k: books.filter((b) => b.kind === "text").length, all: facts.spread.length, df: facts.df }) : "",
                  })
                : t("输入词后点「画图」。")}
          </div>
        </div>

        <div className="kg-node-detail">
          <SearchDetail
            selected={selected}
            hits={hits}
            books={books}
            people={people}
            sentences={sentences}
            query={settled || query}
            facts={facts}
            pool={pool}
            onSearch={(w) => { setQuery(w); run(w); }}
            onSelect={setSelected}
            onOpenClip={onOpenClip}
          />
        </div>
      </div>
    </>
  );
}

/** 后世影音片段条目：点之入「诸子点评」专用界面。 */
function ClipRow({ clip, onOpen }: { clip: MediaClip; onOpen: (id: string) => void }) {
  const t = useT();
  return (
    <div
      className="kg-verse kg-clip-row"
      style={{ borderLeftColor: "#7a5c8a" }}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(clip.id)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(clip.id); } }}
    >
      <div className="kg-clip-row-top">
        《{t(clip.work)}》<span className="kg-media-kind" data-k={clip.kind}>{t(clip.kind)}</span>
        <span className="kg-clip-go">{t("诸子点评 →")}</span>
      </div>
      <div>{t(clip.text)}</div>
      {clip.gloss && <small>{t(clip.gloss)}</small>}
    </div>
  );
}

/** 影音片段小节：无片段时不渲染（不留空栏）。跨媒介暂藏（feature-flags），开回即复见。 */
function MediaClipsSection({ clips, onOpenClip }: { clips: MediaClip[]; onOpenClip: (id: string) => void }) {
  const t = useT();
  const [muOpen, setMuOpen] = useState(false);
  if (!XMEDIA_ON || clips.length === 0) return null;
  return (
    <>
      <div className="kg-nd-sec">{t("影音")}</div>
      {clips.map((c) => (
        <ClipRow key={c.id} clip={c} onOpen={onOpenClip} />
      ))}
      <button className="ghost-btn kg-mu-trigger" onClick={() => setMuOpen((v) => !v)}>
        {muOpen ? t("收起") : t("呈影音请诸子点评")}
      </button>
      {muOpen && <MediaUnderstand />}
    </>
  );
}

function SearchDetail({
  selected,
  hits,
  books,
  people,
  sentences,
  query,
  facts,
  pool,
  onSearch,
  onSelect,
  onOpenClip,
}: {
  selected: string | null;
  hits: SHit[];
  books: SBook[];
  people: SPerson[];
  sentences: SSentence[];
  /** 落定的检索词（即这张图画的那一次），不是输入框里逐字变的那个 */
  query: string;
  facts: GFacts | null;
  pool: Passage[];
  onSearch: (w: string) => void;
  onSelect: (id: string) => void;
  onOpenClip: (id: string) => void;
}) {
  const t = useT();
  if (!selected || selected === "q") {
    const mediaClips = XMEDIA_ON && query.trim() ? retrieveMedia(query, { limit: 4 }) : [];
    return (
      <div>
        <div className="kg-nd-head">
          <div className="glyph" style={{ background: "#983e30" }}>题</div>
          <div>
            <h3>{t("「{q}」", { q: query || "—" })}</h3>
            <div className="kind">{t("检索图谱 · 内容取自典籍")}</div>
          </div>
        </div>
        <p className="kg-nd-meta">{hits.length ? t("共检得 {n} 句，涉及 {books} 部书、{people} 位诸子。", { n: hits.length, books: books.filter((b) => b.kind === "hit").length, people: people.length }) : t("尚未检索。在左侧输入一个词，点「画图」。")}</p>
        {facts && (
          <>
            <div className="kg-nd-sec">{t("图谱所记")}</div>
            {!facts.exact && (
              <p className="kg-nd-meta" style={{ marginTop: 0, color: "#8a6f43" }}>
                {t("图谱里没有「{q}」这个词目，下面各数是其中「{w}」的。", { q: query.trim(), w: facts.term })}
              </p>
            )}
            <p className="kg-nd-meta" style={{ marginTop: 0 }}>
              {/* 两个数不是一个：散在几部是全分布，通行几部只算不止一段的那些 */}
              {t("「{w}」见于 {df} 段，散在 {k} 部，其中 {b} 部不止一段。", { w: facts.term, df: facts.df, k: facts.spread.length, b: facts.books })}
              {facts.books >= 6 ? t("诸书皆讲，是通义。") : t("几为一家独有，是宗旨。")}
            </p>
            {facts.kin.length > 0 && (
              <>
                <div className="kg-nd-sec">{t("常相伴")}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {/* 出自文本共现的互信息，不是我们替它想的近义词；点之即改检此词 */}
                  {facts.kin.map((k) => (
                    <button key={k.t} className="kg-rel-chip" style={{ padding: "2px 8px" }} onClick={() => onSearch(k.t)} title={t("改检此词")}>
                      <span className="dot" style={{ background: TEXT_EDGE.color }} />
                      <span>{k.t}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="kg-nd-sec">{t("全书分布")}</div>
            {facts.spread.map((s) => {
              const hit = books.some((b) => b.kind === "hit" && b.name === s.title);
              return (
                <button
                  key={s.bookId}
                  className="kg-rel-chip"
                  style={{ width: "100%", justifyContent: "flex-start", opacity: hit ? 1 : 0.78 }}
                  onClick={() => onSelect(`${hit ? "b" : "gb"}:${s.title}`)}
                >
                  <span className="dot" style={{ background: hit ? bookColorOf(s.title, hits) : TEXT_EDGE.color }} />
                  <span>《{t(s.title)}》</span>
                  <small>{t("{n} 段", { n: s.segs })}{hit ? t(" · 检得其句") : ""}</small>
                </button>
              );
            })}
          </>
        )}
        <div className="kg-nd-sec">{t("诸句")}</div>
        {hits.length === 0 ? (
          <div className="kg-annot-empty">{t("无")}</div>
        ) : (
          hits.map((h) => (
            <button key={h.id} className="kg-rel-chip" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onSelect(`s:${h.id}`)}>
              <span className="dot" style={{ background: bookColorOf(h.book, hits) }} />
              <span>《{t(h.book)}·{t(h.chapter)}》</span>
              <small>{h.owner ? t(scholarMap[h.owner]?.name ?? "") : t("佚名")}</small>
            </button>
          ))
        )}
        {mediaClips.length > 0 && (
          <>
            <div className="kg-nd-sec">{t("影音")}</div>
            {mediaClips.map((c) => (
              <ClipRow key={c.id} clip={c} onOpen={onOpenClip} />
            ))}
          </>
        )}
      </div>
    );
  }

  // 图谱另载的书：句环上没有它的句，但图谱记着书里实有此词。出处段落按 id
  // 取自检索时已载的那二十六部全文，不另走一趟网络。
  if (selected.startsWith("gb:")) {
    const name = selected.slice(3);
    const b = books.find((x) => x.id === selected);
    const byId = new Map(pool.map((p) => [p.id, p]));
    let ps = (b?.loci ?? []).map((lid) => byId.get(lid)).filter((p): p is Passage => !!p);
    // 出处只挂在「要目」那几条边上，全分布里多数书没有。没有便就地在全文里找
    // ——pool 已在手，折字比对（折的是比对的一侧，原文照原样显示）。
    if (ps.length === 0) {
      const f = fold(facts?.term ?? query);
      ps = pool.filter((p) => p.book === name && fold(p.text).includes(f)).slice(0, 3);
    }
    // 这部书为何没进句环，得按实情分说，从前一概写作「检索未检出其句」是错的：
    // 池里有这部书、且有段含所检之字面，那它的句本是候选，只是没挤进前列
    // ——run() 取前十句，spreadByBook 还另限每书三句，词散得宽时位子早满了。
    // 真检不到只有两种：全文池未收此书（图谱覆盖千余部，全文只二十六部），
    // 或池中无一段含此字面（图谱按概念计，与字面可以不同）。
    // 池空时一句也不敢断——那是全文没载上，不是书不在其列。
    const qf = fold(query);
    const inPool = pool.some((p) => p.book === name);
    const outranked = pool.some((p) => p.book === name && fold(p.text).includes(qf));
    const kind = outranked
      ? t("图谱所载 · 书中 {n} 段提及，其句未进前 {k} 句", { n: b?.segs ?? 0, k: Math.max(hits.length, 1) })
      : pool.length === 0
        ? t("图谱所载 · 书中 {n} 段提及（全文未载上，故无句可比）", { n: b?.segs ?? 0 })
        : inPool
          ? t("图谱所载 · 书中 {n} 段提及此题，全文无字面相合之句", { n: b?.segs ?? 0 })
          : t("图谱所载 · 书中 {n} 段提及，此书不在二十六部全文之列", { n: b?.segs ?? 0 });
    return (
      <div>
        <div className="kg-nd-head">
          <div className="glyph" style={{ background: "#f4efdf", color: b?.color ?? TEXT_EDGE.color, border: `1.5px dashed ${b?.color ?? TEXT_EDGE.color}` }}>{name.charAt(0)}</div>
          <div>
            <h3>《{t(name)}》</h3>
            <div className="kind">{kind}</div>
          </div>
        </div>
        <div className="kg-nd-sec">{t("原文")}</div>
        {ps.length === 0 ? (
          <div className="kg-annot-empty">{t("出处未取到（这部无分片可取，或全文尚未载入）")}</div>
        ) : (
          ps.map((p) => (
            <div key={p.id} className="kg-verse" style={{ borderLeftColor: TEXT_EDGE.color }}>
              <div>{p.text}</div>
              <small>《{t(p.book)}·{t(p.chapter)}》</small>
            </div>
          ))
        )}
        <MediaClipsSection clips={retrieveMedia(name, { limit: 3 })} onOpenClip={onOpenClip} />
      </div>
    );
  }

  if (selected.startsWith("b:")) {
    const name = selected.slice(2);
    const b = books.find((x) => x.name === name);
    const ss = sentences.filter((s) => s.book === name);
    return (
      <div>
        <div className="kg-nd-head">
          <div className="glyph" style={{ background: b?.color ?? "#9a7b4a" }}>{name.charAt(0)}</div>
          <div>
            <h3>《{t(name)}》</h3>
            <div className="kind">
              {t("典籍 · 提及此题 {n} 句", { n: ss.length })}
              {b && b.segs > 0 ? t("（图谱：全书 {k} 段）", { k: b.segs }) : ""}
            </div>
          </div>
        </div>
        <div className="kg-nd-sec">{t("相关句")}</div>
        {ss.map((s) => (
          <button key={s.id} className="kg-rel-chip" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onSelect(`s:${s.id}`)}>
            <span className="dot" style={{ background: b?.color }} />
            <span>《{t(s.chapter)}》</span>
            <small>{s.text.slice(0, 12)}…</small>
          </button>
        ))}
        <MediaClipsSection clips={retrieveMedia(name, { limit: 3 })} onOpenClip={onOpenClip} />
      </div>
    );
  }

  if (selected.startsWith("p:")) {
    const owner = selected.slice(2);
    const sc = scholarMap[owner];
    const ss = sentences.filter((s) => s.owner === owner);
    return (
      <div>
        <div className="kg-nd-head">
          <div className="glyph" style={{ background: sc?.color ?? "#888" }}>{sc?.glyph ?? "?"}</div>
          <div>
            <h3>{t(sc?.name ?? owner)}</h3>
            <div className="kind">{t(sc?.school ?? "")} · {t("论及此题 {n} 句", { n: ss.length })}</div>
          </div>
        </div>
        {sc?.intro && <p className="kg-nd-meta">{t(sc.intro)}</p>}
        <div className="kg-nd-sec">{t("其所言")}</div>
        {ss.map((s) => (
          <button key={s.id} className="kg-rel-chip" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => onSelect(`s:${s.id}`)}>
            <span className="dot" style={{ background: sc?.color }} />
            <span>《{t(s.book)}·{t(s.chapter)}》</span>
            <small>{s.text.slice(0, 12)}…</small>
          </button>
        ))}
        <MediaClipsSection clips={clipsOf(owner).slice(0, 3)} onOpenClip={onOpenClip} />
      </div>
    );
  }

  // s:{id}
  const sid = selected.slice(2);
  const s = sentences.find((x) => x.id === sid) ?? hits.find((x) => x.id === sid);
  if (!s) return <div className="kg-annot-empty">{t("未选中。")}</div>;
  const sc = s.owner ? scholarMap[s.owner] : undefined;
  return (
    <div>
      <div className="kg-nd-head">
        <div className="glyph" style={{ background: sc?.color ?? "#9a7b4a" }}>{sc ? sc.glyph : "典"}</div>
        <div>
          <h3>《{t(s.book)}·{t(s.chapter)}》</h3>
          <div className="kind">
            {s.source === "full" ? t("全文句") : t("精选片段")}
            {sc && <> · <button className="kg-link" onClick={() => onSelect(`p:${s.owner}`)}>{t(sc.name)}</button></>}
          </div>
        </div>
      </div>
      <div className="kg-verse">
        <div>{s.text}</div>
        {s.gloss && <small>{s.gloss}</small>}
      </div>
      <div className="kg-nd-sec">{t("批注")}</div>
      <AnnotPanel verseKey={s.id} prompt={`客就《${s.book}·${s.chapter}》「${s.text}」请批注，可援可驳。`} />
    </div>
  );
}

// ════════════════════════════════════════
//  通用批注面板已抽至 ./AnnotPanel（节点批注 / 句读批注 / 影音点评共用）
// ════════════════════════════════════════

