"use client";

import { scholarMap } from "../world/characters";
import type { Round } from "../world/dialogue";
import type { Retrieved } from "../world/canon";
import { useLang, useT } from "../i18n/lang";
import Said from "../i18n/Said";

type Turn = { round: Round; scholarId: string; text: string; citations: Retrieved[]; inferred?: boolean };

type Props = { seated: string[]; turns: Turn[] };

type Edge = { from: string; to: string; rebut: number; inquire: number };

/** 取该人物的立场摘要：优先"总结"，次"陈述"，再末条；去引导语后截断。 */
function stanceOf(seated: string[], turns: Turn[], id: string): string {
  const mine = turns.filter((t) => t.scholarId === id);
  const src = mine.find((t) => t.round === "总结") ?? mine.find((t) => t.round === "陈述") ?? mine[mine.length - 1];
  if (!src) return "";
  const s = src.text.replace(/^要之，/, "").replace(/（[^）]*）/g, "").replace(/——/g, "：");
  return s.length > 32 ? s.slice(0, 32) + "…" : s;
}

/**
 * 观点关系图：诸子围圆排布为节点（节点内为立场摘要），
 * 反驳/质询轮中「发言者→被驳/被诘者」构成有向边——
 * 红实线为驳、翠虚线为诘，线粗与次数相应。由辩论结构直接派生，无需语义分析。
 */
export default function DebateGraph({ seated, turns }: Props) {
  const t = useT();
  const lang = useLang();
  const n = seated.length;
  const cx = 230;
  const cy = 200;
  const R = 128;
  const rNode = 24;

  const nodes = seated.map((id, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { id, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const posOf = (id: string) => nodes.find((nn) => nn.id === id) ?? nodes[0];

  // 汇聚反驳/质询的有向边（发言者指向同轮前一位）
  const map = new Map<string, Edge>();
  for (const t of turns) {
    if (t.round !== "反驳" && t.round !== "质询") continue;
    const si = seated.indexOf(t.scholarId);
    if (si < 0) continue;
    const prev = seated[(si - 1 + n) % n];
    const key = `${t.scholarId}->${prev}`;
    const e = map.get(key) ?? { from: t.scholarId, to: prev, rebut: 0, inquire: 0 };
    if (t.round === "反驳") e.rebut += 1;
    else e.inquire += 1;
    map.set(key, e);
  }
  const edges = [...map.values()];

  return (
    <div className="debate-graph">
      <div className="graph-head">
        <b>{t("观点关系图")}</b>
        <span>{t("驳诘之链 · 由「发言者」指向「被驳/被诘者」")}</span>
      </div>
      <svg viewBox="0 0 460 440" className="graph-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#983e30" />
          </marker>
          <marker id="arrowJ" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#355e55" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const A = posOf(e.from);
          const B = posOf(e.to);
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const px = -uy;
          const py = ux;
          const sx = A.x + ux * rNode;
          const sy = A.y + uy * rNode;
          const ex = B.x - ux * rNode;
          const ey = B.y - uy * rNode;
          const off = 16;
          const mx = (sx + ex) / 2 + px * off;
          const my = (sy + ey) / 2 + py * off;
          const d = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
          const hasRebut = e.rebut > 0;
          const stroke = hasRebut ? "#983e30" : "#355e55";
          const dash = hasRebut ? "" : "5 4";
          const marker = hasRebut ? "url(#arrowR)" : "url(#arrowJ)";
          const sw = 1.6 + e.rebut + e.inquire;
          const label = [hasRebut && t("驳×{n}", { n: e.rebut }), e.inquire > 0 && t("诘×{n}", { n: e.inquire })]
            .filter(Boolean)
            .join(" ");
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} markerEnd={marker} opacity={0.85} />
              {label && (
                <g transform={`translate(${mx},${my})`}>
                  <rect x={-19} y={-9} width={38} height={16} rx={8} fill="#f4efdf" stroke="#9a8e7b" strokeWidth={0.6} />
                  <text x={0} y={3} textAnchor="middle" fontSize={9} fill="#5c544a">{label}</text>
                </g>
              )}
            </g>
          );
        })}

        {nodes.map((nn) => {
          const s = scholarMap[nn.id];
          const stance = stanceOf(seated, turns, nn.id);
          return (
            <g key={nn.id} transform={`translate(${nn.x},${nn.y})`}>
              <circle r={rNode} fill={s.color} stroke="#f4efdf" strokeWidth={3} />
              <text textAnchor="middle" y={6} fontSize={16} fill="#f6ead7">{s.glyph}</text>
              <text textAnchor="middle" y={rNode + 12} fontSize={11} fill="#3c352b" fontWeight={700}>{t(s.name)}</text>
              {stance && (
                /* 立场摘要是诸子自己的话（截自其陈述），故中文照旧；
                   格高 44px 搁不下中英两行，英文模式下格内只出英译、格子放到 60px —
                   中文那一路的格高与内容分毫未动。 */
                <foreignObject x={-72} y={rNode + 16} width={144} height={lang === "en" ? 60 : 44}>
                  <div className="graph-stance">
                    {lang === "en" ? <Said text={stance} scholar={nn.id} /> : stance}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
      <div className="graph-legend">
        <span><i className="ln-r" />{t("反驳")}</span>
        <span><i className="ln-j" />{t("质询")}</span>
        <span className="graph-hint">{t("线愈粗则交锋愈多")}</span>
      </div>
    </div>
  );
}
