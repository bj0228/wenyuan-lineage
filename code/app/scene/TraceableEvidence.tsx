"use client";

import type { Retrieved } from "../world/canon";
import { useT } from "../i18n/lang";

/** 回答下方统一的三层证据区：本家原文、审定文脉、明确标出的推演。 */
export default function TraceableEvidence({ citations, inferred }: { citations: Retrieved[]; inferred?: boolean }) {
  const t = useT();
  const own = citations.filter((c) => !c.lineage);
  const lineage = citations.filter((c) => !!c.lineage);
  const open = (c: Retrieved) => {
    if (!c.workId || typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("wenyuan:open-evidence", {
      detail: { bookId: c.workId, chapter: c.chapter, text: c.text, worldId: c.worldId ?? "zhanguo" },
    }));
  };
  const cards = (items: Retrieved[], kind: "own" | "lineage") => items.map((c) => (
    <article className={`trace-card ${kind}`} key={`${c.evidenceId ?? c.id}-${c.book}-${c.chapter}`}>
      <button type="button" disabled={!c.workId} onClick={() => open(c)} title={c.workId ? t("打开原书") : t("此书暂无可跳转正文")}>
        <b>{c.evidenceId ? `[${c.evidenceId}] ` : ""}《{t(c.book)}·{t(c.chapter)}》</b>
        <span>{c.evidenceBinding === "exact" ? t("原文已核对") : t("文本依据")}</span>
      </button>
      <blockquote>{c.en ?? c.text}</blockquote>
      {c.lineage && (
        <p className="trace-lineage">
          <strong>{t(c.lineage.label)} · {t(c.lineage.use)}</strong>
          <span>{c.lineage.from} → {c.lineage.to}</span>
          <em>{t(c.lineage.note)}</em>
        </p>
      )}
      {c.gloss && <p className="trace-gloss">{t("白话")}：{c.gloss}</p>}
    </article>
  ));

  if (!citations.length && !inferred) return null;
  return (
    <div className="traceable-evidence">
      {own.length > 0 && <section><h5>✓ {t("本人著述")}</h5>{cards(own, "own")}</section>}
      {lineage.length > 0 && <section><h5>↗ {t("审定文脉引用")}</h5>{cards(lineage, "lineage")}</section>}
      {inferred && <section className="trace-inference"><h5>△ {t("立场与比较推演")}</h5><p>{t("回答中的解释与跨时代比较由系统据上述材料组织，不作为人物原话。")}</p></section>}
      {!citations.length && inferred && <p className="trace-empty">{t("本轮没有可绑定的原文证据，回答仅作为人物立场推演展示。")}</p>}
    </div>
  );
}
