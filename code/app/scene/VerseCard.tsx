"use client";

import { useRef, useState } from "react";
import { scholarMap, scholars } from "../world/characters";
import { useVerseAnnotations } from "../world/annotations";
import { composeAnswerLLM, verifyAndRepairConsistency, type Verdict } from "../world/dialogue";
import VerdictBadge from "./VerdictBadge";
import type { FlatVerse } from "../world/canonFull";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";

/**
 * 句读卡片：原文 + 白话；客可注（存 localStorage）、可请诸子批注（走既有 1v1 模式流式）。
 * 批注是瞬时回话（不入库），故徽记亦随这一程走，不持久。
 */
export default function VerseCard({ verse }: { verse: FlatVerse }) {
  const t = useT();
  const [anns, annApi] = useVerseAnnotations(verse.verseId);
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  /** 校验中／已判：随当前这条回话走。旧批注被再问顶掉后，徽记不该找错话 */
  const [check, setCheck] = useState<{ on: boolean; verdict?: Verdict; note?: string }>({ on: false });
  const askSeq = useRef(0);

  async function ask() {
    if (!target || busy) return;
    setReply(""); setBusy(true); setCheck({ on: false });
    const my = ++askSeq.current;
    const q = `${verse.text}（${verse.gloss ?? ""}）。客就此句请诸子批注，可援可驳。`;
    let said = "";
    let evidence: import("../world/canon").Retrieved[] = [];
    try {
      const ans = await composeAnswerLLM(target, q, undefined, [], (d) => setReply((t) => t + d));
      said = ans.text.trim();
      evidence = ans.citations;
    } catch {
      // 这一句是现成的中文，存着是中文，显的时候才译（见下方 {t(reply)}）
      setReply((r) => r || "（诸子未及应，稍后再试。）");
    } finally {
      setBusy(false);
    }
    if (said) {
      setCheck({ on: true });
      verifyAndRepairConsistency(target, said, q, evidence).then((out) => {
        if (askSeq.current === my) {
          if (out?.text) setReply(out.text);
          setCheck({ on: false, verdict: out?.verdict, note: out?.note });
        }
      });
    }
  }

  function saveAnnot() {
    if (!draft.trim()) return;
    annApi.add(verse.verseId, draft);
    setDraft("");
  }

  return (
    <article className="verse-card">
      <header>{t("《{book}·{chapter}》", { book: t(verse.book), chapter: verse.chapter })}</header>
      {/* 原文不替换；其下的白话是中文，英文模式下再附一行英译 */}
      <blockquote className="verse-text">{verse.text}</blockquote>
      {verse.gloss && (
        <>
          <p className="verse-gloss">{verse.gloss}</p>
          <Said text={verse.gloss} />
        </>
      )}

      <div className="annot-list">
        {anns.map((a) => (
          <div key={a.id} className="annot-item">
            <i>
              {a.scholar
                ? t("{glyph}·{name}", {
                    glyph: scholarMap[a.scholar]?.glyph ?? t("注"),
                    name: t(scholarMap[a.scholar]?.name ?? "诸子"),
                  })
                : t("客")}
            </i>
            <p>{a.text}</p>
            {/* 诸子之批注是中文生成的，其下附英译；客自己注的那句不译 */}
            {a.scholar && <Said text={a.text} scholar={a.scholar} />}
            <button className="ghost-btn" onClick={() => annApi.remove(a.id)}>{t("删")}</button>
          </div>
        ))}
      </div>

      <div className="annot-row">
        <input className="found-input" value={draft} maxLength={80} placeholder={t("注一句己见……")}
          onChange={(e) => setDraft(e.target.value)} />
        <button className="ghost-btn" disabled={!draft.trim()} onClick={saveAnnot}>{t("存注")}</button>
      </div>

      <div className="annot-row">
        <select className="found-input" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">{t("择一子请其批注……")}</option>
          {scholars.map((s) => <option key={s.id} value={s.id}>{t("{name}·{school}", { name: t(s.name), school: t(s.school) })}</option>)}
        </select>
        <button className="ghost-btn" disabled={!target || busy} onClick={ask}>{busy ? t("批注中…") : t("问诸子")}</button>
      </div>
      {reply && (
        <blockquote className="annot-text">
          <i style={{ background: scholarMap[target]?.color }}>{scholarMap[target]?.glyph}</i>
          <p>
            {t(reply)}{busy && <span className="cursor">▍</span>}
            {!busy && (check.on || check.verdict) && (
              <VerdictBadge verifying={check.on} verdict={check.verdict} note={check.note} />
            )}
          </p>
          {/* 批语照中文生成（其据在中文典籍），英译附于其下；流着的半句不译 */}
          {!busy && reply && <Said text={reply} scholar={target} />}
        </blockquote>
      )}
    </article>
  );
}
