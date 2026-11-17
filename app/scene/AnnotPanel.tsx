"use client";

import { useState } from "react";
import { scholarMap, LVBUWEI } from "../world/characters";
import { REVIEW_AXES, kindOf } from "../world/worlds";
import { useVerseAnnotations } from "../world/annotations";
import { composeAnswerLLM, verifyAndRepairConsistency, type Verdict } from "../world/dialogue";
import VerdictBadge from "./VerdictBadge";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";
import TraceableEvidence from "./TraceableEvidence";

/**
 * 批注/点评通用面板：给定 verseKey 与 prompt，
 *  - 客注输入 + 存注（api.add）
 *  - 择一人「请批注」→ composeAnswerLLM 流式（question = prompt）
 *  - 流完 api.add(verseKey, text, scholar) 落库为其人批注（持久）
 * 复用 zhuzi-annotations localStorage（key 即 verseKey），零新存储。
 * 节点批注用 key=node:{id}、影音点评用 key=media:{ts}，皆同此面板。
 */

/**
 * 可请其批注者：各世界人格全在此（先秦二十一子 + 主持人吕不韦，西游诸人），按世界分组；
 * 末了缀西方文哲一组——他们不立世界（无疆域无日程），却是批注席上的常客：
 * 莎士比亚批《论语》一句，与孟子批《哈姆莱特》一句，同一面板两向都通。
 *
 * 从前此处只遍历 `scholars`，故西游诸人虽在 `scholarMap` 里认得、能署名，却选不着——
 * 批注一事本不限于立论者：悟空批《论语》一句「不问马」，与孟子批它，各是一种读法。
 * 故改遍历 `WORLDS`，日后再添世界，此处不必再改。
 */
const ANNOTATORS = [
  ...REVIEW_AXES.map((w) => ({
    label: w.name,
    personas: w.id === "zhanguo" ? [...w.personas, LVBUWEI] : w.personas,
  })),
];

/**
 * 批注之请，按人格之属分说。
 * 立论者（thinker）须本于自家学说；叙事中人（figure）凭性格与处境说话——
 * 若一概要悟空「本于自家学说」，便会把他写成一个讲道理的学者，那就不是他了。
 * 但「不是学者」不等于「不讲理」：仍要他正面批这一句，只是用他自己的口气批。
 * 西方文哲（west）所本者不是学说而是学识与作品——引证格式等细故归 worker 定调。
 */
function framed(prompt: string, personaId: string): string {
  const p = scholarMap[personaId];
  const k = p ? kindOf(p) : "thinker";
  if (k === "figure") return `${prompt}（请以你平日的口气直说，就此句正面批，该讲的理讲透，不必作一家之论。）`;
  if (k === "west") return `${prompt}（立论须本于自家学识与作品。）`;
  return `${prompt}（立论须本于自家学说。）`;
}
export function AnnotPanel({ verseKey, prompt }: { verseKey: string; prompt: string }) {
  const [anns, api] = useVerseAnnotations(verseKey);
  const t = useT();
  const [draft, setDraft] = useState("");
  const [target, setTarget] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask() {
    if (!target || busy) return;
    setReply("");
    setBusy(true);
    let aid: string | undefined;
    let said = "";
    try {
      const ans = await composeAnswerLLM(target, framed(prompt, target), undefined, [], (d) => setReply((t) => t + d));
      said = ans.text.trim();
      const checked = said ? await verifyAndRepairConsistency(target, said, prompt, ans.citations) : null;
      said = checked?.text ?? said;
      if (said) {
        const citations = checked?.citations ?? ans.citations;
        aid = api.add(verseKey, said, target, undefined, citations); // 只把复核后的版本落库
        if (aid && checked) api.patchVerdict(aid, checked.verdict, checked.note, { model: checked.model, crossModel: checked.crossModel, citations });
      }
      setReply("");
    } catch {
      setReply((t) => t || "（其人未及应，稍后再试。）");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="kg-annot-list">
        {anns.map((a) => {
          const sc = a.scholar ? scholarMap[a.scholar] : undefined;
          // 徽记只挂人格之批注（客自注不校），校验中或已有判定时显示
          const showBadge = sc && a.verdict;
          return (
            <div key={a.id} className={`kg-annot-item${a.scholar ? "" : " ke"}`}>
              {/* 印上那一字：人格的是其徽字（图，不译），客自注的是「客」 */}
              <i style={{ background: sc?.color ?? "#5a3a7a" }}>{sc ? sc.glyph : t("客")}</i>
              <p>
                {a.text}
                {showBadge && (
                  <VerdictBadge
                    verifying={false}
                    verdict={a.verdict as Verdict | undefined}
                    note={a.verdictNote}
                    kind={sc ? kindOf(sc) : undefined}
                    verifier={a.verdictModel}
                    crossModel={a.verdictCross}
                  />
                )}
              </p>
              {/* 诸子的批语照中文生成，英译附在其下；客自注是人自己写的，写什么是什么，不译 */}
              {a.scholar && <Said text={a.text} scholar={a.scholar} />}
              {a.scholar && <TraceableEvidence citations={a.citations ?? []} inferred />}
              <button className="ghost-btn" onClick={() => api.remove(a.id)}>{t("删")}</button>
            </div>
          );
        })}
      </div>
      <div className="kg-annot-row">
        <input className="found-input" value={draft} maxLength={80} placeholder={t("注一句己见……")} onChange={(e) => setDraft(e.target.value)} />
        <button className="ghost-btn" disabled={!draft.trim()} onClick={() => { if (draft.trim()) { api.add(verseKey, draft); setDraft(""); } }}>{t("存注")}</button>
      </div>
      <div className="kg-annot-row">
        <select className="found-input" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">{t("择一人请其批注……")}</option>
          {ANNOTATORS.map((g) => (
            <optgroup key={g.label} label={t(g.label)}>
              {g.personas.map((s) => (
                <option key={s.id} value={s.id}>{t("{name}·{school}", { name: t(s.name), school: t(s.school) })}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button className="ghost-btn" disabled={!target || busy} onClick={ask}>{busy ? t("批注中…") : t("请其批注")}</button>
      </div>
      {reply && (
        <div className="kg-annot-item" style={{ borderLeftColor: scholarMap[target]?.color ?? "#567565" }}>
          <i style={{ background: scholarMap[target]?.color }}>{scholarMap[target]?.glyph}</i>
          <p>{t(reply)}{busy && <span className="cursor">▍</span>}</p>
        </div>
      )}
    </>
  );
}
