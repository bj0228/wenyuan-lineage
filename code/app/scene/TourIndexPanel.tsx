"use client";

import { useT } from "../i18n/lang";
import type { TourChapter } from "../world/tour";

/**
 * 册目：「一 · 四库全书」起头的那一「一二三四五」是序数记号，不是译名，故照旧写死
 * （与榜首、呈文同例）；册名则随语种。勿把它改成 arabic 数字——中文版要的就是这个字面。
 */
export const TOUR_BOOKS: { id: TourChapter; num: string; name: string }[] = [
  { id: "siku", num: "一", name: "四库全书" },
  { id: "zhanguo", num: "二", name: "先秦诸子" },
  { id: "xiyou", num: "三", name: "西游" },
  { id: "westlit", num: "四", name: "西方" },
  { id: "crossworld", num: "五", name: "跨世界三块" },
];

/**
 * 新手导览册目（小浮层，复用 .quest-backdrop/.quest-layer）。
 *
 * 从前这一栏住在「客」字档案里，而档案只有进了诸子那一世界才点得到——初学者进门
 * 第一屏正是最想找它的时候，偏偏那时找不着。故迁到罗盘那一屏，由题名旁一枚圆钮
 * 「导」开出（见 CompassLayer 的 .cp-guide）：一册一行，带已看未看的记认，
 * 点某册的 ↻ 即清那一册的记认并切到那一层从头再讲，另有「五册全部重看」。
 */
export default function TourIndexPanel({
  seenBooks,
  onReplay,
  onReplayAll,
  onClose,
}: {
  /** 哪几册已看过（tour.ts 的 useTourSeen，五册各一行） */
  seenBooks: Set<TourChapter>;
  /** 重看某一册：清该册记认，并切到那一层从头讲 */
  onReplay: (ch: TourChapter) => void;
  /** 五册一并重看：全清记认，回盘面从头走 */
  onReplayAll: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const seenCount = TOUR_BOOKS.filter((b) => seenBooks.has(b.id)).length;

  return (
    <div className="quest-backdrop tour-index-back" onClick={onClose}>
      <div className="quest-layer tour-index" role="dialog" aria-label={t("新手导览")} onClick={(e) => e.stopPropagation()}>
        <header className="quest-head">
          <div>
            <p className="eyebrow">{t("已看 {n} / 5 册", { n: seenCount })}</p>
            <h2>{t("新手导览")}</h2>
          </div>
          <button className="stage-close" onClick={onClose} aria-label={t("关闭")}>×</button>
        </header>

        <div className="user-body">
          <p className="tour-note">{t("导览分五册，走到哪一层讲哪一册。点某册的 ↻ 即清那一册的记认，并切到那一层从头再讲。")}</p>
          <div className="tour-books">
            {TOUR_BOOKS.map((b) => {
              const seen = seenBooks.has(b.id);
              return (
                <div key={b.id} className={`tour-book ${seen ? "on" : ""}`}>
                  <span className="tour-book-num">{b.num}</span>
                  <b>{t(b.name)}</b>
                  <i className={`tour-book-flag ${seen ? "on" : ""}`}>{seen ? t("已看") : t("未看")}</i>
                  <button className="tour-book-again" onClick={() => onReplay(b.id)} title={t("重看此册")} aria-label={t("重看「{name}」", { name: t(b.name) })}>↻</button>
                </div>
              );
            })}
          </div>
          <button className="tour-replay" onClick={onReplayAll}>{t("五册全部重看")}</button>
        </div>
      </div>
    </div>
  );
}
