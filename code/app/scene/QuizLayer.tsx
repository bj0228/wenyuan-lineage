"use client";

import { useMemo, useState } from "react";
import { canon, type Passage } from "../world/canon";
import { scholarMap } from "../world/characters";
import { buildSeal, type Seal } from "../world/seals";
import { pick, rnd, shuffle, type QOpt } from "../world/dailyQuest";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";

/** 经义小考只从有主典籍出题（何人型须有主）。 */
const POOL: Passage[] = canon.filter((p) => p.owner !== "");
const TYPES = ["何义", "何书", "何人"] as const;
const LABELS = ["甲", "乙", "丙", "丁"];

/** 三型题面的模板：与 makeQuestion 拼出来的那一句逐字相同，中文模式下合出来还是原样 */
const STEM: Record<(typeof TYPES)[number], string> = {
  何义: "「{text}」此句何义？",
  何书: "「{text}」此句出自何书？",
  何人: "「{text}」此句为谁所言？",
};

type QuizQ = { qid: string; type: (typeof TYPES)[number]; stem: string; passage: Passage; options: QOpt[] };

/** 按轮次确定性出题（仅 Math.sin/Math.floor，无 Math.random，render 期安全）。 */
function makeQuestion(round: number): QuizQ {
  const base = 1000 + round * 37;
  const correct = pick(POOL, base);
  const type = TYPES[Math.min(TYPES.length - 1, Math.floor(rnd(base + 1) * TYPES.length))];

  if (type === "何义") {
    const rest = POOL.filter((p) => p.id !== correct.id);
    const d1 = pick(rest, base + 2);
    const d2 = pick(rest.filter((p) => p.gloss !== d1.gloss), base + 3);
    const d3 = pick(rest.filter((p) => p.gloss !== d1.gloss && p.gloss !== d2.gloss), base + 4);
    const opts = shuffle(
      [
        { text: correct.gloss, correct: true },
        { text: d1.gloss, correct: false },
        { text: d2.gloss, correct: false },
        { text: d3.gloss, correct: false },
      ],
      base + 9,
    );
    return { qid: `${correct.id}:何义`, type, stem: `「${correct.text}」此句何义？`, passage: correct, options: opts };
  }

  if (type === "何书") {
    const otherBooks = [...new Set(POOL.filter((p) => p.book !== correct.book).map((p) => p.book))];
    const b1 = pick(otherBooks, base + 2);
    const b2 = pick(otherBooks.filter((b) => b !== b1), base + 3);
    const b3 = pick(otherBooks.filter((b) => b !== b1 && b !== b2), base + 4);
    const opts = shuffle(
      [
        { text: `《${correct.book}》`, correct: true },
        { text: `《${b1}》`, correct: false },
        { text: `《${b2}》`, correct: false },
        { text: `《${b3}》`, correct: false },
      ],
      base + 9,
    );
    return { qid: `${correct.id}:何书`, type, stem: `「${correct.text}」此句出自何书？`, passage: correct, options: opts };
  }

  // 何人
  const otherOwners = [...new Set(POOL.filter((p) => p.owner !== correct.owner).map((p) => p.owner))];
  const o1 = pick(otherOwners, base + 2);
  const o2 = pick(otherOwners.filter((o) => o !== o1), base + 3);
  const o3 = pick(otherOwners.filter((o) => o !== o1 && o !== o2), base + 4);
  const opts = shuffle(
    [
      { text: scholarMap[correct.owner].name, correct: true },
      { text: scholarMap[o1].name, correct: false },
      { text: scholarMap[o2].name, correct: false },
      { text: scholarMap[o3].name, correct: false },
    ],
    base + 9,
  );
  return { qid: `${correct.id}:何人`, type, stem: `「${correct.text}」此句为谁所言？`, passage: correct, options: opts };
}

/**
 * 经义小考浮层：四选一自练（何义／何书／何人），无提示；
 * 答对发一枚印章（按 qid 去重防刷，同题再答不再发印），「再来一题」换下一题。
 */
export default function QuizLayer({
  date,
  shichen,
  hasQid,
  onAward,
  onAnswer,
  onClose,
}: {
  date: string;
  shichen: string;
  hasQid: (qid: string) => boolean;
  onAward: (seal: Seal) => void;
  /** 每选一发（对错皆发），供 page 计连对／称号；与发印解耦（错亦计） */
  onAnswer?: (correct: boolean) => void;
  onClose: () => void;
}) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const t = useT();
  const q = useMemo(() => makeQuestion(round), [round]);
  const already = hasQid(q.qid);
  const answered = picked !== null;
  const correctIdx = q.options.findIndex((o) => o.correct);
  const isCorrect = picked === correctIdx;

  function choose(i: number) {
    if (answered) return;
    setPicked(i);
    // 答对且此题未发过印，方发一枚（qid 去重）
    if (i === correctIdx && !already) {
      onAward(buildSeal({ date, shichen, source: "小考", label: `小考·${q.passage.book}·${q.passage.chapter}`, qid: q.qid }));
    }
    // 连对／称号：每选一发（对则连对 +1，错则归 0）
    onAnswer?.(i === correctIdx);
  }

  function next() {
    setRound((r) => r + 1);
    setPicked(null);
  }

  return (
    <div className="quest-backdrop" onClick={onClose}>
      <div className="quest-layer quiz-layer" role="dialog" aria-label={t("经义小考")} onClick={(e) => e.stopPropagation()}>
        <header className="quest-head">
          <div>
            <p className="eyebrow">{t("经义小考 · {type}", { type: t(q.type) })}</p>
            <h2>{t("四选一")}</h2>
          </div>
          <button className="stage-close" onClick={onClose} aria-label={t("退出")}>×</button>
        </header>
        <div className="quiz-body">
          {/* 题面是「原句＋所问」拼的（见 makeQuestion）：原句照典籍不动，所问那半句查表 */}
          <blockquote className="quiz-stem">{t(STEM[q.type], { text: q.passage.text })}</blockquote>
          <ul className="quiz-options">
            {q.options.map((o, i) => {
              const cls = answered ? (o.correct ? "ok" : i === picked ? "bad" : "dim") : "";
              return (
                <li key={i}>
                  <button className={cls} disabled={answered} onClick={() => choose(i)}>
                    <b>{t(LABELS[i])}</b>
                    <span>{t(o.text)}</span>
                  </button>
                  {/* 「何义」一型的选项是白话，查不着词条，故附英译；书名人名查表即得，不另附 */}
                  {q.type === "何义" && <Said text={o.text} />}
                </li>
              );
            })}
          </ul>
          {answered && (
            <div className="quiz-result">
              <p className={isCorrect ? "ok" : "bad"}>
                {isCorrect
                  ? already ? t("正解。此题已记印，再来可也。") : t("正解。得印一枚。")
                  : t("未中。正解为{label}。", { label: t(LABELS[correctIdx]) })}
              </p>
              <blockquote className="quiz-gloss">{t("「{text}」——《{book}·{chapter}》", { text: q.passage.text, book: t(q.passage.book), chapter: t(q.passage.chapter) })}</blockquote>
              <p className="quiz-gloss-text">{t(q.passage.gloss)}</p>
              <Said text={q.passage.gloss} />
              <button className="primary quiz-next" onClick={next}>{t("再来一题 →")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
