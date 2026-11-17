"use client";

import type { Adaptation, MediaClip } from "../world/adaptations";
import { useT } from "../i18n/lang";

/**
 * 「后世目录」一行——一部影片/剧集/纪录片/小说。
 *
 * 从前这一行是死的：补了条目也只是一行字，看完无处可去。如今一行即一门，
 * 点入点评席（ClipReviewLayer），诸子与西贤就这一部各说各话，客亦可自注。
 * 四库书页之书前影音栏、世界文学书内影音栏、跨媒介点评那一层、
 * 典籍图谱节点详情——凡列目录处皆用此一行，样式与去处不分两家。
 *
 * 行下或附一幕（`scene`）：此片在席上被评的那一镜。从前片与幕各出一行，
 * 《王子复仇记》便在书页上出现两次；如今幕并入其片，一片一行，行下附笺。
 * 幕自成一钮——按钮不可套按钮，故并列于行下（同 .xm-ent 之制）。
 */
export default function AdapRow({
  a,
  scene,
  onOpen,
  className = "sk-adap-row",
}: {
  a: Adaptation;
  /** 此片所演之幕（由 mergeMedia 并入）。无则只出一行，DOM 与从前一样。 */
  scene?: MediaClip;
  onOpen: (id: string) => void;
  /** 所在之栏各有行款（世界文学书内栏字小一号），故留一处可换 */
  className?: string;
}) {
  const t = useT();
  const row = (
    <button
      type="button"
      className={className}
      onClick={() => onOpen(a.id)}
      title={t("{note}（点入点评席）", { note: t(a.note) })}
    >
      {t("《{title}》（{kind} · {year}，{maker}）——{note}", {
        title: t(a.title),
        kind: t(a.kind),
        year: a.year,
        maker: t(a.maker),
        note: t(a.note),
      })}
      <i>{t("入点评席")}</i>
    </button>
  );
  if (!scene) return row;
  return (
    <div className="adap-ent">
      {row}
      <button
        type="button"
        className="adap-scene"
        onClick={() => onOpen(scene.id)}
        title={t("点入此幕的点评席")}
      >
        <i aria-hidden>幕</i>
        <span>{t(scene.text)}</span>
      </button>
    </div>
  );
}
