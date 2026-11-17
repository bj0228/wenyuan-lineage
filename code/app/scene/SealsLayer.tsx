"use client";

import type { Seal } from "../world/seals";
import { useT } from "../i18n/lang";

/**
 * 印章之由来：存时已拼成一句中文（「游学·论语·学而」），存着的不动——
 * 旧印章照样显。显的时候才拆开逐节查表，故英文下作 "Quest · Analects · 学而"
 * （篇名不译，与四库书页同例）。
 */
function sealLabel(t: (s: string, v?: Record<string, string | number>) => string, label: string) {
  const parts = label.split("·");
  if (parts.length < 2) return t(label);
  return t("{head}·{rest}", { head: t(parts[0]), rest: parts.slice(1).map((x) => t(x)).join(" · ") });
}

/**
 * 印章浮层：列每枚印章的来由（小考／游学·书·篇）＋日期时辰；空则提示去领题。
 * 由公告栏「印章 ×N」点开。
 */
export default function SealsLayer({ seals, onClose }: { seals: Seal[]; onClose: () => void }) {
  const t = useT();
  return (
    <div className="quest-backdrop" onClick={onClose}>
      <div className="quest-layer seals-layer" role="dialog" aria-label={t("印章册")} onClick={(e) => e.stopPropagation()}>
        <header className="quest-head">
          <div>
            <p className="eyebrow">{t("招贤榜 · 印章册")}</p>
            <h2>{t("已得 {n} 印", { n: seals.length })}</h2>
          </div>
          <button className="stage-close" onClick={onClose} aria-label={t("关闭")}>×</button>
        </header>
        <div className="seals-body">
          {seals.length === 0 ? (
            <p className="intro">{t("尚未得印。往左上公告栏领游学题、回禀吕不韦，或试「经义小考」。")}</p>
          ) : (
            <ul className="seal-list">
              {seals.map((s) => (
                <li key={s.id} className={s.source}>
                  {/* 这一枚是朱记：一字作印，两种语文都照中文（与榜、印、呈、市同例） */}
                  <i className="seal-mark">{s.source === "游学" ? "游" : "考"}</i>
                  <div className="seal-meta">
                    <b>{sealLabel(t, s.label)}</b>
                    <small>{s.date} · {t(s.shichen)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
