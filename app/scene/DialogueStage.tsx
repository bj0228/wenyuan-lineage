"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Scholar } from "../world/characters";
import { composeAnswerLLM, composeDialogueTurnLLM, translateToVernacular, verifyAndRepairConsistency, type Verdict } from "../world/dialogue";
import type { Retrieved } from "../world/canon";
import { regionMap } from "../world/regions";
import VerdictBadge from "./VerdictBadge";
import SpeakButton from "./SpeakButton";
import VideoReel from "./VideoReel";
import type { VideoContext } from "../world/video";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";
import TraceableEvidence from "./TraceableEvidence";

type Turn = {
  text: string;
  citations: Retrieved[];
  inferred?: boolean;
  /** 流式作答中：逐字回填时为 true，完成置 false */
  streaming?: boolean;
  /** 右键译为白话：缓存译文；vernShow 控制显隐，vernLoading/vernError 表作答中/失败 */
  vernacular?: string;
  vernLoading?: boolean;
  vernShow?: boolean;
  vernError?: boolean;
  /** 一致性校验：id 稳定回填；verifying 作答中；verdict/verdictNote 判定与理由；
   *  verdictModel/verdictCross 记是谁判的、算不算异源外证 */
  id?: number;
  verifying?: boolean;
  verdict?: Verdict;
  verdictNote?: string;
  verdictModel?: string;
  verdictCross?: boolean;
};

type Props = {
  /** 左·主动方（被点击/被移动者） */
  initiator: Scholar;
  /** 右·对话对象 */
  partner: Scholar;
  initiatorRegion: string;
  partnerRegion: string;
  onClose: () => void;
};

const SUGGESTIONS = [
  "如何看待人性？",
  "何以治国？",
  "战争可否有正当？",
  "学与思孰重？",
];

/**
 * 全页双贤对谈：左列主动方、右列对话对象，各陈其见。
 * 用户作为出题人输入议题；主动方先以典籍立论（composeAnswer），
 * 对象再回应其说（composeDebateTurn，previousSpeaker 为主动方名）。
 */
export default function DialogueStage({ initiator, partner, initiatorRegion, partnerRegion, onClose }: Props) {
  const t = useT();
  const [left, setLeft] = useState<Turn[]>([
    { text: `${initiator.voice.opening}`, citations: [], inferred: false },
  ]);
  const [right, setRight] = useState<Turn[]>([
    { text: `${partner.voice.opening}`, citations: [], inferred: false },
  ]);
  const [input, setInput] = useState("");
  // 最近一次出题（生成视频的议题）
  const [lastTopic, setLastTopic] = useState("");
  // 模型作答中：哪一侧正在生成（left=主动方先答，right=对象后应），null=空闲
  const [thinkingSide, setThinkingSide] = useState<"left" | "right" | null>(null);
  const thinkingRef = useRef(false);
  // 人物发言的稳定 id：一致性校验异步回填按 id 而非 index
  const seq = useRef(0);

  const leftEnd = useRef<HTMLDivElement>(null);
  const rightEnd = useRef<HTMLDivElement>(null);
  // 流式逐字回填时 left/right 引用逐 token 变化，effect 随之滚到底（即时，免流式卡顿）
  useEffect(() => {
    leftEnd.current?.scrollIntoView();
  }, [left, thinkingSide]);
  useEffect(() => {
    rightEnd.current?.scrollIntoView();
  }, [right, thinkingSide]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 对谈有交流后「生成视频」的上下文：议题＋双方末轮作摘述
  const videoCtx = useMemo<VideoContext>(
    () => ({
      topic: lastTopic,
      scholarIds: [initiator.id, partner.id],
      summary: [
        ...left.filter((m) => m.text).slice(-1).map((m) => `${initiator.name}：${m.text}`),
        ...right.filter((m) => m.text).slice(-1).map((m) => `${partner.name}：${m.text}`),
      ].join("；"),
    }),
    [lastTopic, initiator, partner, left, right],
  );

  /** 右键某条发言：译为白话（已有译文则切换显隐）；按侧取对应人物 id 作术语上下文。 */
  async function toggleVern(side: "left" | "right", i: number, e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const list = side === "left" ? left : right;
    const cur = list[i];
    if (!cur) return;
    const scholarId = side === "left" ? initiator.id : partner.id;
    const set = side === "left" ? setLeft : setRight;
    if (cur.vernacular && !cur.vernLoading) {
      set((a) => a.map((x, j) => (j === i ? { ...x, vernShow: !x.vernShow } : x)));
      return;
    }
    if (cur.vernLoading) return;
    set((a) => a.map((x, j) => (j === i ? { ...x, vernLoading: true, vernError: false, vernShow: true, vernacular: "" } : x)));
    const out = await translateToVernacular(cur.text, scholarId, (delta) =>
      set((a) => a.map((x, j) => (j === i ? { ...x, vernacular: (x.vernacular ?? "") + delta } : x))),
    );
    set((a) => a.map((x, j) => (j === i ? {
      ...x,
      vernLoading: false,
      vernacular: out ?? "",
      vernError: out === null,
      vernShow: true,
    } : x)));
  }

  /** 出题后：主动方先以本家学说立论（LLM），对象再回应其说（LLM·双贤对谈模式）。
   *  作答期间按侧显「正在作答」、禁用输入；异常/无 Key 回退本地模板。 */
  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || thinkingRef.current) return;
    setInput("");
    setLastTopic(q);
    thinkingRef.current = true;
    setThinkingSide("left");
    // 主动方先发言：先插空行，流式 delta 按 id 逐字回填
    const aId = seq.current++;
    setLeft((l) => [...l, { text: "", citations: [], inferred: false, id: aId, streaming: true }]);
    try {
      const a = await composeAnswerLLM(initiator.id, q, undefined, [], (delta) =>
        setLeft((l) => l.map((x) => (x.id === aId ? { ...x, text: x.text + delta } : x))),
      );
      setLeft((l) => l.map((x) => (x.id === aId ? { ...x, text: a.text, citations: a.citations, inferred: a.inferred, streaming: false, verifying: true } : x)));
      const aChecked = await verifyAndRepairConsistency(initiator.id, a.text, q, a.citations);
      const aText = aChecked?.text ?? a.text;
      setLeft((l) =>
        l.map((x) =>
          x.id === aId
            ? { ...x, text: aText, citations: aChecked?.citations ?? a.citations, verifying: false, verdict: aChecked?.verdict, verdictNote: aChecked?.note, verdictModel: aChecked?.model, verdictCross: aChecked?.crossModel }
            : x,
        ),
      );
      setThinkingSide("right");
      // 对话对象回应：同样先插空行流式
      const bId = seq.current++;
      setRight((r) => [...r, { text: "", citations: [], inferred: false, id: bId, streaming: true }]);
      const b = await composeDialogueTurnLLM(
        partner.id,
        q,
        { previousSpeaker: initiator.name },
        [{ scholarId: initiator.id, text: aText }],
        (delta) => setRight((r) => r.map((x) => (x.id === bId ? { ...x, text: x.text + delta } : x))),
      );
      setRight((r) => r.map((x) => (x.id === bId ? { ...x, text: b.text, citations: b.citations, inferred: b.inferred, streaming: false, verifying: true } : x)));
      const bChecked = await verifyAndRepairConsistency(partner.id, b.text, q, b.citations);
      setRight((r) =>
        r.map((x) =>
          x.id === bId
            ? { ...x, text: bChecked?.text ?? b.text, citations: bChecked?.citations ?? b.citations, verifying: false, verdict: bChecked?.verdict, verdictNote: bChecked?.note, verdictModel: bChecked?.model, verdictCross: bChecked?.crossModel }
            : x,
        ),
      );
    } finally {
      thinkingRef.current = false;
      setThinkingSide(null);
    }
  }

  return (
    <div className="dialogue-stage" role="dialog" aria-label={t("对谈：{a} 与 {b}", { a: t(initiator.name), b: t(partner.name) })}>
      <header className="stage-top">
        <div className="stage-title">
          <span className="eyebrow">{t("双贤对谈")}</span>
          <h2>
            {t(initiator.name)} <i>·</i> {t(partner.name)}
          </h2>
        </div>
        <button className="stage-close" onClick={onClose} aria-label={t("结束对谈")}>
          ✕
        </button>
      </header>

      <p className="chat-hint">{t("右键诸子发言可译为白话")}</p>

      <div className="stage-cols">
        <section className="stage-col">
          <div className="stage-head" style={{ "--accent": initiator.color } as React.CSSProperties}>
            <div className="portrait" style={{ background: initiator.color }}>
              {initiator.glyph}
            </div>
            <div>
              <span className="school-tag">{t(initiator.school)}</span>
              <h3>{t(initiator.name)}</h3>
              <p>{t("主动方 · {region}", { region: t(regionMap[initiatorRegion]?.name ?? "") })}</p>
            </div>
          </div>
          <div className="stage-msgs left">
            {left.map((m, i) => (
              <div
                key={i}
                className="message"
                onContextMenu={(e) => toggleVern("left", i, e)}
                title={t("右键译为白话")}
              >
                <p>
                  {m.text || (m.streaming ? t("正在作答……") : "")}
                  {m.streaming && m.text ? <span className="stream-caret" aria-hidden>▍</span> : null}
                </p>
                {/* 话照中文生成（其言自中文典籍检出），英译附在其下；流着的半句不译 */}
                {!m.streaming && m.text && <Said text={m.text} scholar={initiator.id} />}
                <VerdictBadge verifying={m.verifying} verdict={m.verdict} note={m.verdictNote} verifier={m.verdictModel} crossModel={m.verdictCross} />
                {!m.streaming && m.text && (
                  <span className="speak-slot" onContextMenu={(e) => e.stopPropagation()}>
                    <SpeakButton text={m.text} scholarId={initiator.id} />
                  </span>
                )}
                {m.vernShow && (
                  <div className="vernacular">
                    {m.vernLoading
                      ? m.vernacular
                        ? <>{t("白话 · {text}", { text: m.vernacular })}<span className="stream-caret" aria-hidden>▍</span></>
                        : t("正在译为白话……")
                      : m.vernacular
                        ? t("白话 · {text}", { text: m.vernacular })
                        : t("未能译为白话")}
                  </div>
                )}
                <TraceableEvidence citations={m.citations} inferred={m.inferred} />
              </div>
            ))}
            <div ref={leftEnd} />
          </div>
        </section>

        <section className="stage-col">
          <div className="stage-head" style={{ "--accent": partner.color } as React.CSSProperties}>
            <div className="portrait" style={{ background: partner.color }}>
              {partner.glyph}
            </div>
            <div>
              <span className="school-tag">{t(partner.school)}</span>
              <h3>{t(partner.name)}</h3>
              <p>{t("对话对象 · {region}", { region: t(regionMap[partnerRegion]?.name ?? "") })}</p>
            </div>
          </div>
          <div className="stage-msgs right">
            {right.map((m, i) => (
              <div
                key={i}
                className="message"
                onContextMenu={(e) => toggleVern("right", i, e)}
                title={t("右键译为白话")}
              >
                <p>
                  {m.text || (m.streaming ? t("正在作答……") : "")}
                  {m.streaming && m.text ? <span className="stream-caret" aria-hidden>▍</span> : null}
                </p>
                {/* 话照中文生成（其言自中文典籍检出），英译附在其下；流着的半句不译 */}
                {!m.streaming && m.text && <Said text={m.text} scholar={partner.id} />}
                <VerdictBadge verifying={m.verifying} verdict={m.verdict} note={m.verdictNote} verifier={m.verdictModel} crossModel={m.verdictCross} />
                {!m.streaming && m.text && (
                  <span className="speak-slot" onContextMenu={(e) => e.stopPropagation()}>
                    <SpeakButton text={m.text} scholarId={partner.id} />
                  </span>
                )}
                {m.vernShow && (
                  <div className="vernacular">
                    {m.vernLoading
                      ? m.vernacular
                        ? <>{t("白话 · {text}", { text: m.vernacular })}<span className="stream-caret" aria-hidden>▍</span></>
                        : t("正在译为白话……")
                      : m.vernacular
                        ? t("白话 · {text}", { text: m.vernacular })
                        : t("未能译为白话")}
                  </div>
                )}
                <TraceableEvidence citations={m.citations} inferred={m.inferred} />
              </div>
            ))}
            <div ref={rightEnd} />
          </div>
        </section>
      </div>

      {lastTopic && left.length > 1 && (
        <div className="dialogue-video">
          <VideoReel ctx={videoCtx} label={t("将对谈凝为视频")} />
        </div>
      )}

      <div className="stage-foot">
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={thinkingSide !== null}>
              {/* 题面递给模型的仍是中文那句（见 send），钮上显译文 */}
              {t(s)}
            </button>
          ))}
        </div>
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("向 {a} 与 {b} 出一议题……", { a: t(initiator.name), b: t(partner.name) })}
          />
          <button onClick={() => send()} disabled={thinkingSide !== null}>{t("送出")}</button>
        </div>
      </div>
    </div>
  );
}
