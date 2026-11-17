"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { scholars, scholarMap } from "../world/characters";
import { composeDebateRoundLLM, composeModeratorInterjectionLLM, composeVerdictLLM, DEBATE_ROUNDS, translateToVernacular, verifyAndRepairConsistency, type Round, type Verdict, type VerdictResult } from "../world/dialogue";
import type { Retrieved } from "../world/canon";
import type { Presence } from "../world/schedule";
import DebateTable from "./DebateTable";
import DebateGraph from "./DebateGraph";
import VerdictBadge from "./VerdictBadge";
// 此文件里 `t` 早已是「一段发言」的局部名（turns.map((t) => …)），故译器称 tr，不动原有写法。
import { useT } from "../i18n/lang";
import { useTActionBare } from "../i18n/action";
import Said from "../i18n/Said";
import SpeakButton from "./SpeakButton";
import VideoReel from "./VideoReel";
import type { VideoContext } from "../world/video";
import { buildEntry, type AnthologyEntry } from "../world/anthology";
import TraceableEvidence from "./TraceableEvidence";

type Turn = {
  round: Round;
  scholarId: string;
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
   *  verdictModel/verdictCross 记是谁判的、算不算异源外证（一并写进导出的 transcript） */
  id?: number;
  verifying?: boolean;
  verdict?: Verdict;
  verdictNote?: string;
  verdictModel?: string;
  verdictCross?: boolean;
};

type Phase = "setup" | "speaking" | "between" | "done";

type Props = {
  /** proximity：由"附近"流程触发，候选限附近；sidebar：侧栏自由开启，候选为全部人物 */
  mode: "proximity" | "sidebar";
  /** proximity 模式下的主动方 id */
  initiatorId?: string;
  /** proximity 模式下的附近候选 id 列表 */
  nearbyIds?: string[];
  world: Record<string, Presence>;
  onClose: () => void;
  /** 收录入口：辩毕点「藏之竹简」时回传整场为一条语录（仅圆桌辩论入册） */
  onArchive?: (entry: AnthologyEntry) => void;
  /** 收录时的世界时辰（如"申时"），作风味并参与命名 */
  shichen?: string;
  /** 导览实演预设：预填辩题、预选席位（用户仍可自行增删改） */
  presetTopic?: string;
  presetSeated?: string[];
  /** 导览实演：挂载后自动击鼓开辩，省去用户先点一下（仅在辩题与席位已备时生效） */
  autoStart?: boolean;
};

const TOPICS = [
  "人性本善，还是本恶？",
  "治国应当重礼，还是重法？",
  "战争是否存在正当性？",
  "诸子如何看待人工智能？",
];

const MAX_SEATS = 4;

/** 各轮对应的情绪字（辩论时浮于人物头顶）：陈述=平、反驳=愠、质询=疑、总结=定 */
const EMOTION_OF_ROUND: Record<Round, string> = { "陈述": "平", "反驳": "愠", "质询": "疑", "总结": "定" };

/**
 * 全页圆桌辩论台：四轮（陈述—反驳—质询—总结）逐人推进。
 * 中央为 3D 圆桌（DebateTable）——束腰木案，小人围坐，发言者高亮；
 * 点"继续"揭示下一位发言并高亮其席位，发言流随之自动滚到最新；
 * 一轮末停在轮间，可插话（作为下一轮检索焦点），可留空沿用原题。
 * 点击任意发言段可在右侧查看其典籍证据（出处/原文/白话）。
 * 辩论结束后切换为观点关系图（DebateGraph），可回看圆桌。
 */
export default function DebateStage({ mode, initiatorId, nearbyIds, world, onClose, onArchive, shichen, presetTopic, presetSeated, autoStart }: Props) {
  const tr = useT();
  const trActionBare = useTActionBare();
  const candidates = useMemo(() => {
    if (mode === "proximity") {
      const ids = [initiatorId, ...(nearbyIds ?? [])].filter(Boolean) as string[];
      return Array.from(new Set(ids));
    }
    return scholars.map((s) => s.id);
  }, [mode, initiatorId, nearbyIds]);

  const [seated, setSeated] = useState<string[]>(() => {
    if (presetSeated && presetSeated.length) return presetSeated.slice(0, MAX_SEATS);
    if (mode === "proximity") return candidates.slice(0, MAX_SEATS);
    return ["kong", "mo"];
  });
  const [topic, setTopic] = useState(presetTopic ?? "");
  const [phase, setPhase] = useState<Phase>("setup");
  const [roundIndex, setRoundIndex] = useState(0);
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interjection, setInterjection] = useState("");
  const [focus, setFocus] = useState("");
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
  // 辩论结束后是否显示观点关系图（默认显示，可切回圆桌）
  const [showGraph, setShowGraph] = useState(true);
  // 本场是否已藏入竹简（防重复藏；再辩一轮/重开时复位）
  const [archived, setArchived] = useState(false);
  // 客位（用户）入席待陈词：轮到「客」时不调 LLM，等用户输入
  const [kePending, setKePending] = useState<{ round: Round; focusText: string; previousSpeaker: string | undefined } | null>(null);
  const [keInput, setKeInput] = useState("");
  // 动态轮次：核心四轮之外的延展轮（如再延一轮「质询」）
  const [extraRounds, setExtraRounds] = useState<Round[]>([]);
  const rounds = [...DEBATE_ROUNDS, ...extraRounds];
  // 吕公评判结果
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictFailed, setVerdictFailed] = useState(false);
  // 模型作答中：当前发言席高亮 + 防止重复推进
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  // 人物发言的稳定 id：一致性校验异步回填按 id 而非 index
  const seq = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  // 主持人轮间追问/收束：吕不韦人格据前文生成，流式逐字，完成后预填 interjection 为下一轮焦点
  const [hostLine, setHostLine] = useState("");
  const [hostStreaming, setHostStreaming] = useState(false);
  // 记已为本 roundIndex 发过主持人，防 between 阶段重入/重复取火
  const hostFiredRef = useRef(-1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 发言流随新发言/作答中自动滚到底，否则新发言不可见
  // 流式逐字回填时 turns 引用逐 token 变化，effect 随之滚到底（即时，免流式卡顿）
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [turns, speaking]);

  // 使其成为下一轮焦点（nextRound 的 newFocus=interjection.trim()||focus 已支持）。
  // hostFiredRef 保证每个 roundIndex 只取火一次——即便 turns 随流式逐字变化触发本 effect，亦早返回。
  useEffect(() => {
    if (phase !== "between" || hostFiredRef.current === roundIndex) return;
    hostFiredRef.current = roundIndex;
    setHostStreaming(true);
    setHostLine("");
    composeModeratorInterjectionLLM(
      focus,
      rounds[roundIndex],
      rounds[roundIndex + 1],
      turns.map((t) => ({ scholarId: t.scholarId, text: t.text })),
      (d) => setHostLine((s) => s + d),
    )
      .then((full) => {
        setHostLine(full);
        setHostStreaming(false);
        setInterjection(full);
      })
      .catch(() => setHostStreaming(false));
  }, [phase, roundIndex, focus, turns]);

  const n = seated.length;
  const currentRound = rounds[roundIndex];
  const canStart = topic.trim().length > 0 && n >= 2;
  const evidenceTurn = selectedTurn !== null ? turns[selectedTurn] : null;

  // 导览实演：辩题与席位已预置时自行击鼓开辩，省去「还得先点一下」这一道坎。
  // 只放一次（autoFiredRef），用户此后关辩、改席、重开都由他自己作主。
  const autoFiredRef = useRef(false);
  useEffect(() => {
    if (!autoStart || autoFiredRef.current) return;
    if (phase !== "setup" || !canStart) return;
    autoFiredRef.current = true;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, phase, canStart]);

  // 每位入席者的情绪：取其最近一轮发言所属情绪；未发言则"待"
  const emotionOf = useMemo(() => {
    const m: Record<string, string> = {};
    for (const id of seated) m[id] = "待";
    for (const t of turns) m[t.scholarId] = EMOTION_OF_ROUND[t.round] ?? "待";
    return m;
  }, [seated, turns]);

  // 辩论收束后「生成视频」的上下文：议题＋入席者＋总结轮/主持人收束作摘述
  const videoCtx = useMemo<VideoContext>(
    () => ({
      topic: focus || topic,
      scholarIds: seated,
      summary: [
        ...turns.filter((t) => t.round === "总结").map((t) => `${scholarMap[t.scholarId]?.name}：${t.text}`),
        ...(hostLine ? [`主持人·吕不韦：${hostLine}`] : []),
      ].join("；"),
    }),
    [focus, topic, seated, turns, hostLine],
  );

  function toggleSeat(id: string) {
    if (phase !== "setup") return;
    setSeated((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX_SEATS ? [...list, id] : list));
  }

  /** 揭示一位发言：以 focusText 为检索焦点，previousSpeaker 接同轮前一位形成环链。
   *  走大模型（辩论模式）；作答期间 speaking 高亮当前席并阻塞重复推进，异常回退本地模板。 */
  async function reveal(
    round: Round,
    scholarId: string,
    focusText: string,
    previousSpeaker: string | undefined,
    history: { scholarId: string; text: string }[],
  ) {
    if (speakingRef.current) return;
    speakingRef.current = true;
    setSpeaking(true);
    // 先插一条空发言占位，流式 delta 按 id 逐字回填；id 稳定避免并发错位
    const id = seq.current++;
    setTurns((t) => [...t, { round, scholarId, id, text: "", citations: [], inferred: false, streaming: true }]);
    try {
      const ans = await composeDebateRoundLLM(
        scholarId,
        focusText,
        round,
        { previousSpeaker },
        history,
        (delta) =>
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, text: x.text + delta } : x))),
      );
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, text: ans.text, citations: ans.citations, inferred: ans.inferred, streaming: false, verifying: true } : x)));
      // 异源校验 → △/✕ 自动修订 → 复核；下一位须看到复核后的版本，而非越界草稿。
      const checked = await verifyAndRepairConsistency(scholarId, ans.text, focusText, ans.citations);
      setTurns((a) =>
        a.map((x) =>
          x.id === id
            ? {
                ...x,
                text: checked?.text ?? ans.text,
                citations: checked?.citations ?? ans.citations,
                verifying: false,
                verdict: checked?.verdict,
                verdictNote: checked?.note,
                verdictModel: checked?.model,
                verdictCross: checked?.crossModel,
              }
            : x,
        ),
      );
    } finally {
      speakingRef.current = false;
      setSpeaking(false);
    }
  }

  /** 入席发言分发：诸子走 LLM 流式作答；客位（用户）改由 kePending 等输入陈词，
   *  不调模型——客之所言即 turn.text，下一位诸子据客言回应（previousSpeaker 传「客」）。 */
  function beginTurn(
    round: Round,
    scholarId: string,
    focusText: string,
    previousSpeaker: string | undefined,
    history: { scholarId: string; text: string }[],
  ) {
    if (scholarId === "ke") {
      setKePending({ round, focusText, previousSpeaker });
      return;
    }
    reveal(round, scholarId, focusText, previousSpeaker, history);
  }

  /** 客位陈词落定：用户输入作为一条完整发言入 turns，清待办、复位输入框。
   *  与诸子不同——客的发言无需流式/校验，落定即成；其后由「继续」推进下一位。 */
  function submitKe() {
    if (!kePending) return;
    const text = keInput.trim();
    if (!text) return;
    const id = seq.current++;
    setTurns((t) => [...t, { round: kePending.round, scholarId: "ke", id, text, citations: [], inferred: false, streaming: false }]);
    setKePending(null);
    setKeInput("");
  }

  function start() {
    if (speakingRef.current) return;
    const t = topic.trim();
    if (!t || n < 2) return;
    setFocus(t);
    setRoundIndex(0);
    setSpeakerIndex(0);
    setTurns([]);
    setSelectedTurn(null);
    setInterjection("");
    setHostLine("");
    setHostStreaming(false);
    hostFiredRef.current = -1;
    setArchived(false);
    setExtraRounds([]);
    setVerdict(null);
    setVerdictLoading(false);
    setVerdictFailed(false);
    setKePending(null);
    setKeInput("");
    setPhase("speaking");
    // 陈述轮首位：previousSpeaker 接本轮末位，形成首尾环链；新辩无前序发言
    beginTurn("陈述", seated[0], t, scholarMap[seated[n - 1]].name, []);
  }

  function advance() {
    if (speakingRef.current) return;
    const nextI = speakerIndex + 1;
    if (nextI < n) {
      const prev = scholarMap[seated[nextI - 1]].name;
      // 先高亮下一位席（作答中），再异步求发言
      setSpeakerIndex(nextI);
      beginTurn(currentRound, seated[nextI], focus, prev, turns.map((t) => ({ scholarId: t.scholarId, text: t.text })));
    } else if (roundIndex < rounds.length - 1) {
      setPhase("between");
    } else {
      setShowGraph(true);
      setPhase("done");
    }
  }

  function nextRound() {
    if (speakingRef.current) return;
    const newRoundIndex = roundIndex + 1;
    const newFocus = interjection.trim() || focus;
    setRoundIndex(newRoundIndex);
    setSpeakerIndex(0);
    setFocus(newFocus);
    setInterjection("");
    setHostLine("");
    setHostStreaming(false);
    setSelectedTurn(null);
    setPhase("speaking");
    beginTurn(rounds[newRoundIndex], seated[0], newFocus, scholarMap[seated[n - 1]].name, turns.map((t) => ({ scholarId: t.scholarId, text: t.text })));
  }

  /** 提前收束：跳过剩余轮，径入 done（观点关系图 + 收录/评判）。 */
  function conclude() {
    if (speakingRef.current) return;
    setShowGraph(true);
    setPhase("done");
  }

  /** 再延一轮：于核心四轮之外追加一轮「质询」并续辩——动态轮次。
   *  藏入竹简后不再延展（archive 为终态），延展则旧评判失效。 */
  function extendRound() {
    if (speakingRef.current || archived) return;
    const newRound: Round = "质询";
    const newRoundIndex = rounds.length; // 追加后新轮所处之索引
    setExtraRounds((r) => [...r, newRound]);
    setRoundIndex(newRoundIndex);
    setSpeakerIndex(0);
    setSelectedTurn(null);
    setInterjection("");
    setHostLine("");
    setHostStreaming(false);
    setVerdict(null);
    setVerdictFailed(false);
    setShowGraph(false);
    setPhase("speaking");
    beginTurn(newRound, seated[0], focus, scholarMap[seated[n - 1]].name, turns.map((t) => ({ scholarId: t.scholarId, text: t.text })));
  }

  /** 吕公评判：吕不韦人格综观全场，为每位入席者打分并给总判词。
   *  走服务端 judge 模式输出 JSON；未配 Key/异常返回 null，界面提示「未能评判」。 */
  async function judge() {
    if (verdictLoading || verdict) return;
    setVerdictLoading(true);
    setVerdictFailed(false);
    const res = await composeVerdictLLM(
      focus || topic,
      turns.map((t) => ({ scholarId: t.scholarId, text: t.text })),
    );
    setVerdict(res);
    setVerdictFailed(res === null);
    setVerdictLoading(false);
  }

  function reset() {
    setTurns([]);
    setPhase("setup");
    setRoundIndex(0);
    setSpeakerIndex(0);
    setInterjection("");
    setHostLine("");
    setHostStreaming(false);
    hostFiredRef.current = -1;
    setSelectedTurn(null);
    setArchived(false);
    setExtraRounds([]);
    setVerdict(null);
    setVerdictLoading(false);
    setVerdictFailed(false);
    setKePending(null);
    setKeInput("");
    // 保留 topic 与 seated，便于续辩
  }

  /** 辩毕藏入竹简：把整场（议题/入席/各轮发言/主持人收束）打包成一条语录回传 page。
   *  仅圆桌辩论入册；防重复藏。已译的白话、校验档、典据出处一并带上供竹简展卷。 */
  function archive() {
    if (archived || !onArchive) return;
    const entry = buildEntry({
      topic: focus || topic,
      seatedIds: seated,
      turns: turns.map((t) => ({
        round: t.round,
        scholarId: t.scholarId,
        text: t.text,
        vernacular: t.vernacular || undefined,
        citations: t.citations.map((c) => ({ book: c.book, chapter: c.chapter })),
        verdict: t.verdict,
        verdictModel: t.verdictModel,
        verdictCross: t.verdictCross,
      })),
      hostLine: hostLine || undefined,
      shichen: shichen ?? "",
    });
    onArchive(entry);
    setArchived(true);
  }

  /** 右键某段发言：译为白话（已有译文则切换显隐）；走 `/api/translate`，失败提示"未能译出"。 */
  async function toggleTurnVern(i: number, e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const cur = turns[i];
    if (!cur) return;
    if (cur.vernacular && !cur.vernLoading) {
      setTurns((a) => a.map((x, j) => (j === i ? { ...x, vernShow: !x.vernShow } : x)));
      return;
    }
    if (cur.vernLoading) return;
    setTurns((a) => a.map((x, j) => (j === i ? { ...x, vernLoading: true, vernError: false, vernShow: true, vernacular: "" } : x)));
    const out = await translateToVernacular(cur.text, cur.scholarId, (delta) =>
      setTurns((a) => a.map((x, j) => (j === i ? { ...x, vernacular: (x.vernacular ?? "") + delta } : x))),
    );
    setTurns((a) => a.map((x, j) => (j === i ? {
      ...x,
      vernLoading: false,
      vernacular: out ?? "",
      vernError: out === null,
      vernShow: true,
    } : x)));
  }

  const centerLabel =
    phase === "setup"
      ? tr("待击鼓开辩")
      : phase === "speaking"
        ? tr(currentRound)
        : phase === "between"
          ? tr("轮间 · 下一轮 {round}", { round: tr(rounds[roundIndex + 1]) })
          : tr("辩论已毕");

  function dotClass(i: number) {
    if (phase === "done") return "passed";
    if (phase === "between") {
      if (i <= roundIndex) return "passed";
      if (i === roundIndex + 1) return "cur";
      return "";
    }
    if (i < roundIndex) return "passed";
    if (i === roundIndex) return "cur";
    return "";
  }

  const nextSpeakerName = phase === "speaking" && speakerIndex < n - 1 ? scholarMap[seated[speakerIndex + 1]].name : null;
  const speakBtnLabel =
    phase === "speaking"
      ? speakerIndex < n - 1
        ? tr("继续 ›")
        : roundIndex < rounds.length - 1
          ? tr("本轮毕")
          : tr("辩论收束")
      : "";
  const graphShown = phase === "done" && showGraph;

  return (
    <div className="debate-stage" role="dialog" aria-label={tr("百家争鸣 圆桌辩论")}>
      <header className="stage-top">
        <div className="stage-title">
          <span className="eyebrow">{tr("百家争鸣 · 圆桌辩论")}</span>
          <h2>
            {mode === "proximity" ? tr("附近争鸣") : tr("自由开辩")} <small>{tr("{n}/{max} 入席 · 四轮推进", { n, max: MAX_SEATS })}</small>
          </h2>
        </div>
        <button className="stage-close" onClick={onClose} aria-label={tr("结束辩论")}>
          ✕
        </button>
      </header>

      <div className="debate-main">
        {phase === "setup" ? (
          <section className="debate-setup">
            <h3>{tr("今辩何题？")}</h3>
            <input
              className="topic-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={tr("自由输入辩题，如「天下何以致治？」")}
            />
            <div className="topic-list">
              {TOPICS.map((t) => (
                <button key={t} className={topic === t ? "selected" : ""} onClick={() => setTopic(t)}>
                  <span>{tr(t)}</span>
                  <i>{topic === t ? "●" : "○"}</i>
                </button>
              ))}
            </div>

            <h3>
              {tr("入席人物")} {mode === "proximity" && <small>{tr("仅限附近")}</small>}
            </h3>
            <div className="seat-list">
              {candidates.map((id) => {
                const s = scholarMap[id];
                if (!s) return null;
                return (
                  <button key={id} onClick={() => toggleSeat(id)} className={seated.includes(id) ? "seated" : ""}>
                    <i style={{ background: s.color }}>{s.glyph}</i>
                    <span>
                      {tr(s.name)}
                      <small>{trActionBare(world[id]?.action ?? "")}</small>
                    </span>
                    <b>{seated.includes(id) ? "✓" : "+"}</b>
                  </button>
                );
              })}
              {mode === "proximity" && candidates.length === 0 && <p className="intro">{tr("附近无人可入席。")}</p>}
              <button onClick={() => toggleSeat("ke")} className={`ke-seat ${seated.includes("ke") ? "seated" : ""}`}>
                <i style={{ background: scholarMap["ke"].color }}>{scholarMap["ke"].glyph}</i>
                <span>
                  {tr(scholarMap["ke"].name)}
                  <small>{tr("游学者 · 我入席陈词")}</small>
                </span>
                <b>{seated.includes("ke") ? "✓" : "+"}</b>
              </button>
            </div>

            <button className="primary debate-start" disabled={!canStart} onClick={start}>
              {tr("击鼓开辩")} <span>◉</span>
            </button>
            <p className="intro setup-hint">{tr("四轮依次：陈述 · 反驳 · 质询 · 总结。每位发言后点「继续」推进，一轮末可插话、影响下一轮诸子所答。右键任一段发言可译为白话。")}</p>
          </section>
        ) : (
          <>
            <div className="debate-arena">
              {graphShown ? (
                <DebateGraph seated={seated} turns={turns} />
              ) : (
                <DebateTable seatedIds={seated} speakerIndex={speakerIndex} phase={phase} roundIndex={roundIndex} roundLabel={currentRound} emotionOf={emotionOf} />
              )}
              {!graphShown && (
                <div className="debate-hud">
                  <div className="round-name">{centerLabel}</div>
                  {(focus || topic) && <div className="round-topic">「{focus || topic}」</div>}
                  <div className="round-dots">
                    {rounds.map((r, i) => (
                      <i key={i} className={dotClass(i)} title={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="debate-controls">
              {phase === "speaking" && (
                kePending ? (
                  <div className="ke-input-row">
                    <textarea
                      value={keInput}
                      onChange={(e) => setKeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          submitKe();
                        }
                      }}
                      placeholder={tr("客位陈词：写下你对「{topic}」之见，诸子将据你所言回应（Enter 陈词 · Shift+Enter 换行）", { topic: tr(kePending.focusText || focus || topic) })}
                      rows={2}
                    />
                    <button className="ctl-btn" onClick={submitKe} disabled={!keInput.trim()}>{tr("陈词 ›")}</button>
                  </div>
                ) : (
                  <>
                    {nextSpeakerName && <span className="next-speaker">{tr("下一位 · {name}", { name: tr(nextSpeakerName) })}</span>}
                    <button className="ctl-btn" onClick={advance} disabled={speaking}>{speakBtnLabel}</button>
                  </>
                )
              )}
              {phase === "between" && (
                <>
                  <input
                    className="interjection"
                    value={interjection}
                    onChange={(e) => setInterjection(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        nextRound();
                      }
                    }}
                    placeholder={tr("主持人已发追问（可改可留空沿用原题）。下一轮：{round}", { round: tr(rounds[roundIndex + 1]) })}
                  />
                  <button className="ctl-btn" onClick={nextRound} disabled={speaking}>{tr("进入{round} ›", { round: tr(rounds[roundIndex + 1]) })}</button>
                  <button className="ctl-btn ghost" onClick={conclude}>{tr("提前收束")}</button>
                </>
              )}
              {phase === "done" && (
                <>
                  <span className="done-label">{tr("辩论已毕")}</span>
                  <button className="ctl-btn ghost" onClick={() => setShowGraph((g) => !g)}>
                    {showGraph ? tr("回看圆桌") : tr("观点关系图")}
                  </button>
                  {onArchive && (
                    <button className="ctl-btn" onClick={archive} disabled={archived}>
                      {archived ? tr("已藏 ✓") : tr("藏之竹简 ◷")}
                    </button>
                  )}
                  <button className="ctl-btn" onClick={extendRound} disabled={archived}>{tr("再延一轮")}</button>
                  <button className="ctl-btn" onClick={judge} disabled={verdictLoading || !!verdict}>
                    {verdictLoading ? tr("吕公评判中……") : verdict ? tr("吕公评判 ✓") : tr("吕公评判 ◷")}
                  </button>
                  <button className="ctl-btn" onClick={reset}>{tr("再辩一轮")}</button>
                </>
              )}
              {phase === "done" && verdict === null && verdictLoading === false && (
                <span className="intro" style={{ fontSize: 12 }}>
                  {verdictFailed ? tr("未能评判（未配 Key 或上游异常），可重试。") : tr("点「吕公评判」请吕不韦综观全场、打分定判。")}
                </span>
              )}
            </div>

            {phase === "done" && verdict && (
              <div className="verdict-card">
                <div className="verdict-head">{tr("吕公评判 · 吕不韦 杂家")}</div>
                <p className="verdict-total">{verdict.verdict}<Said text={verdict.verdict} scholar="吕不韦" /></p>
                <div className="verdict-scores">
                  {verdict.scores.map((s) => {
                    const sc = scholarMap[s.id];
                    return (
                      <div key={s.id} className="verdict-score">
                        <i style={{ background: sc?.color ?? "#5a3a7a" }}>{sc?.glyph ?? "客"}</i>
                        <div>
                          <b>{tr(s.name)}</b>
                          <small>{s.note}</small>
                        </div>
                        <span className="vs-num">{s.score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="debate-video">
                <VideoReel ctx={videoCtx} label={tr("将本场凝为视频")} />
              </div>
            )}

            <div className="debate-bottom">
              <div className="debate-log-col" ref={logRef}>
                {/* 辩题钉在辩词流的最上面。
                    圆桌中央那块 HUD 本来也写着辩题，但一换成关系图（graphShown）
                    它整条就没了；况且辩词一多，读的人眼睛在这一栏里，抬头去中央找题面
                    是多余的一道。故此处再钉一条，不随辩词滚走。 */}
                {(focus || topic) && (
                  <div className="debate-log-topic">
                    <span>{tr("辩题")}</span>
                    <b>{tr(focus || topic)}</b>
                  </div>
                )}
                {turns.length === 0 && !speaking ? (
                  <p className="intro">{tr("辩论将启……")}</p>
                ) : (
                  <div className="debate-log">
                    {turns.map((t, i) => {
                      const showHead = i === 0 || turns[i - 1].round !== t.round;
                      return (
                        <div key={i} className="debate-turn-wrap">
                          {showHead && (
                            <div className="round-head">
                              <b>{tr(t.round)}</b>
                              <hr />
                            </div>
                          )}
                          <div
                            className={`debate-turn ${selectedTurn === i ? "sel" : ""}`}
                            onClick={() => setSelectedTurn(i)}
                            onContextMenu={(e) => toggleTurnVern(i, e)}
                            title={tr("左键看证据 · 右键译白话")}
                          >
                            <b>{tr(scholarMap[t.scholarId].name)}</b>
                            <VerdictBadge verifying={t.verifying} verdict={t.verdict} note={t.verdictNote} verifier={t.verdictModel} crossModel={t.verdictCross} />
                            {!t.streaming && t.text && (
                              <span
                                className="speak-slot"
                                onClick={(e) => e.stopPropagation()}
                                onContextMenu={(e) => e.stopPropagation()}
                              >
                                <SpeakButton text={t.text} scholarId={t.scholarId} />
                              </span>
                            )}
                            <p>
                              {t.text || (t.streaming ? tr("正在发言……") : "")}
                              {t.streaming && t.text ? <span className="stream-caret" aria-hidden>▍</span> : null}
                            </p>
                            {/* 诸子所言照旧以中文典籍检索生成，英文模式在其下附一行英译。
                                客位是用户自己写的话，他写什么是什么，不代为翻译。 */}
                            {t.scholarId !== "ke" && !t.streaming && t.text && (
                              <Said text={t.text} scholar={scholarMap[t.scholarId].name} />
                            )}
                            {t.vernShow && (
                              <div className="vernacular">
                                {t.vernLoading
                                  ? t.vernacular
                                    ? <>{tr("白话 · {text}", { text: t.vernacular })}<span className="stream-caret" aria-hidden>▍</span></>
                                    : tr("正在译为白话……")
                                  : t.vernacular
                                    ? tr("白话 · {text}", { text: t.vernacular })
                                    : tr("未能译为白话")}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {phase === "between" && (hostStreaming || hostLine) && (
                      <div className="debate-host">
                        <b>{tr("主持人 · 吕不韦")}<small>{tr("杂家")}</small></b>
                        {hostLine && (
                          <span className="speak-slot" onClick={(e) => e.stopPropagation()}>
                            <SpeakButton text={hostLine} scholarId="lvbuwei" />
                          </span>
                        )}
                        <p>
                          {hostLine || (hostStreaming ? tr("正在综观前文……") : "")}
                          {hostStreaming && hostLine ? <span className="stream-caret" aria-hidden>▍</span> : null}
                        </p>
                        {!hostStreaming && hostLine && <Said text={hostLine} scholar="吕不韦" />}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="debate-evidence">
                {!evidenceTurn ? (
                  <p className="intro">{tr("点击左侧某段发言，查看其典籍证据。")}</p>
                ) : (
                  <div className="evidence-list">
                    <h3>{tr(scholarMap[evidenceTurn.scholarId].name)} · {tr(evidenceTurn.round)}</h3>
                    <TraceableEvidence citations={evidenceTurn.citations} inferred={evidenceTurn.inferred} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
