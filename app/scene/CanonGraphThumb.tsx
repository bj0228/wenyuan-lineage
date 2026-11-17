"use client";

import { SCHOOLS } from "../world/lineage";
import { useT } from "../i18n/lang";

/**
 * 典籍侧栏·知识图谱缩略图入口。
 * 一枚九家环点小图（学派色），暗示「这是一张可点开的知识图谱」；点之唤起全屏 CanonGraphLayer。
 * 纯装饰，不承担数据精度——边只取几条代表关系示意。
 */
export default function CanonGraphThumb({ onOpen }: { onOpen: () => void }) {
  const t = useT();
  const cx = 32;
  const cy = 32;
  const R = 22;
  const pts = SCHOOLS.map((s, i) => {
    const a = (i / SCHOOLS.length) * Math.PI * 2 - Math.PI / 2;
    return { id: s.id, color: s.color, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const byId = new Map(pts.map((p) => [p.id, p]));
  // 几条代表关系示意（学派间）：儒→墨(出于)、道→法(影响)、儒→法(承变)、纵横自环
  const links: [string, string][] = [
    ["ru", "mo"],
    ["dao", "fa"],
    ["ru", "fa"],
    ["zongheng", "zongheng"],
  ];
  const arc = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // 向圆心方向略弯
    const nx = (cx - mx) * 0.35;
    const ny = (cy - my) * 0.35;
    return `M ${a.x} ${a.y} Q ${mx + nx} ${my + ny} ${b.x} ${b.y}`;
  };
  return (
    <button className="kg-thumb" onClick={onOpen} aria-label={t("打开典籍知识图谱")}>
      <svg className="kg-thumb-svg" viewBox="0 0 64 64" role="img" aria-hidden>
        {links.map(([f, t], i) => {
          const a = byId.get(f);
          const b = byId.get(t);
          if (!a || !b) return null;
          if (f === t) {
            // 自环：绕该点画个小圈
            return <circle key={i} cx={a.x} cy={a.y - 4} r={4} fill="none" stroke={a.color} strokeWidth={0.8} opacity={0.5} />;
          }
          return <path key={i} d={arc(a, b)} fill="none" stroke="#8a7f6d" strokeWidth={0.7} opacity={0.45} />;
        })}
        {pts.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={3.4} fill={p.color} stroke="#efe6cf" strokeWidth={0.8} />
          </g>
        ))}
        <text x={cx} y={cy + 3} textAnchor="middle" fontSize={11} fill="#5e5648" fontWeight={700}>图</text>{/* 小图正中那一字是印记不是字，两种语文都照原样 */}
      </svg>
      <span>
        <b>{t("典籍图谱")}</b>
        <small>{t("按话题·书·人物看不同的知识图，节点可注、可请诸子批注")}</small>
      </span>
      <span className="arrow" aria-hidden>↗</span>
    </button>
  );
}
