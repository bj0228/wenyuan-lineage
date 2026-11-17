"use client";

import { useState } from "react";
import type { DailyQuest, QOpt } from "../world/dailyQuest";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";

type Phase = "idle" | "accepted" | "done";

/**
 * 左上公告栏：吕不韦每日游学题（一日一题）。
 *  - 显题面 + 去哪问谁的提示；领题后地图点诸子＝咨询（头顶复诵气泡）、点吕不韦＝回禀。
 *  - 印章计数点开印章册；「经义小考」按钮开小考浮层。
 *  - 回禀为内嵌浮层：四选一选对→回调 onHuibingCorrect（由 page 发印、记完成、世界纪事）；选错可重选。
 */
export default function BulletinBoard({
  quest,
  phase,
  sealCount,
  huibingOpen,
  huibingChoices,
  onAccept,
  onAbandon,
  onOpenHuibing,
  onCloseHuibing,
  onHuibingCorrect,
  onHuibingResult,
  onOpenQuiz,
  onOpenSeals,
}: {
  quest: DailyQuest;
  phase: Phase;
  sealCount: number;
  huibingOpen: boolean;
  huibingChoices: QOpt[];
  onAccept: () => void;
  onAbandon: () => void;
  onOpenHuibing: () => void;
  onCloseHuibing: () => void;
  onHuibingCorrect: () => void;
  /** 回禀每选一发（对错皆发），供 page 计连对／称号；容许「错→再选→对」计为连对 1 */
  onHuibingResult?: (correct: boolean) => void;
  onOpenQuiz: () => void;
  onOpenSeals: () => void;
}) {
  // 回禀浮层内的选项/作答状态（局部，开关浮层即重置）
  const t = useT();
  const [picked, setPicked] = useState<number | null>(null);
  const correctIdx = huibingChoices.findIndex((o) => o.correct);
  const answered = picked !== null;
  const isCorrect = picked === correctIdx;
  const LABELS = ["甲", "乙", "丙", "丁"];

  function closeHuibing() {
    setPicked(null);
    onCloseHuibing();
  }

  function pickChoice(i: number) {
    if (answered) return;
    setPicked(i);
    onHuibingResult?.(i === correctIdx);
  }

  return (
    <>
      <div className="bulletin-board" role="region" aria-label={t("招贤榜")}>
        <div className="bb-head">
          {/* 榜首与印数前那两枚朱记是图不是字，两种语文都照中文；所指何物在钮的题与读屏文里 */}
          <i className="bb-seal">榜</i>
          <div>
            <p className="bb-eyebrow">{t("招贤榜 · 吕不韦日问")}</p>
            <h3>{t("每日游学")}</h3>
          </div>
          <button className="bb-count" onClick={onOpenSeals} title={t("印章册")} aria-label={t("印章册")}>
            <i>印</i><b>×{sealCount}</b>
          </button>
        </div>

        {phase === "done" ? (
          <p className="bb-done">{t("今日游学已成——《{book}·{chapter}》得其义，吕公已予印。", { book: t(quest.book), chapter: t(quest.chapter) })}</p>
        ) : (
          <>
            {/* 题面是「原句＋此句何义」拼的（见 world/dailyQuest.ts）：
                原句照典籍不动，外头那半句查表，故此处按模板合，不整句查 */}
            <blockquote className="bb-q">{t("「{text}」此句何义？", { text: quest.text })}</blockquote>
            {/* 提示也是拼的（可往＋地名＋问＋人名）：整句不入词表，地名人名各查各的，
                故按模板合。兜底那一支没有具体去处，另说一句。 */}
            <p className="bb-hint">
              {quest.hintRegion
                ? t("可往{region}问{scholar}", { region: t(quest.hintRegion), scholar: t(quest.hintScholar) })
                : t("可往学宫问诸子")}
            </p>
            <div className="bb-actions">
              {phase === "idle" ? (
                <button className="primary" onClick={onAccept}>{t("领题游学 →")}</button>
              ) : (
                <>
                  <button onClick={onAbandon}>{t("放弃")}</button>
                  <button className="primary" onClick={onOpenHuibing}>{t("回禀吕不韦")}</button>
                </>
              )}
            </div>
            {phase === "accepted" && <p className="bb-tip">{t("点地图诸子咨询得其言，再回吕不韦处回禀。")}</p>}
          </>
        )}

        <button className="bb-quiz" onClick={onOpenQuiz}>{t("经义小考 · 四选一自练")}</button>
      </div>

      {huibingOpen && (
        <div className="quest-backdrop" onClick={closeHuibing}>
          <div className="quest-layer huibing-layer" role="dialog" aria-label={t("回禀吕不韦")} onClick={(e) => e.stopPropagation()}>
            <header className="quest-head">
              <div>
                <p className="eyebrow">{t("回禀 · 吕不韦")}</p>
                <h2>{t("此句何义？")}</h2>
              </div>
              <button className="stage-close" onClick={closeHuibing} aria-label={t("关闭")}>×</button>
            </header>
            <div className="quiz-body">
              <blockquote className="quiz-stem">{t("「{text}」此句何义？", { text: quest.text })}</blockquote>
              <ul className="quiz-options">
                {huibingChoices.map((o, i) => {
                  const cls = answered ? (o.correct ? "ok" : i === picked ? "bad" : "dim") : "";
                  return (
                    <li key={i}>
                      <button className={cls} disabled={answered} onClick={() => pickChoice(i)}>
                        <b>{t(LABELS[i])}</b>
                        <span>{t(o.text)}</span>
                      </button>
                      {/* 四选一的选项是典籍白话，英译附在选项之下（钮内放不下，故列在钮外） */}
                      <Said text={o.text} />
                    </li>
                  );
                })}
              </ul>
              {answered && (
                <div className="quiz-result">
                  <p className={isCorrect ? "ok" : "bad"}>
                    {isCorrect ? t("正解。吕公颔首，予印一枚。") : t("未中。正解为{label}。", { label: t(LABELS[correctIdx]) })}
                  </p>
                  {/* 所问那一句是典籍原文，照原样；出处与白话各自查表 */}
                  <blockquote className="quiz-gloss">{t("「{text}」——《{book}·{chapter}》", { text: quest.text, book: t(quest.book), chapter: t(quest.chapter) })}</blockquote>
                  <p className="quiz-gloss-text">{t(quest.gloss)}</p>
                  <Said text={quest.gloss} />
                  {isCorrect ? (
                    <button className="primary quiz-next" onClick={() => { onHuibingCorrect(); setPicked(null); }}>{t("领印收卷 ✓")}</button>
                  ) : (
                    <button className="quiz-next ghost" onClick={() => setPicked(null)}>{t("再选一次")}</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
