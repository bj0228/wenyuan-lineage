"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { xiyouPersonas, xiyouPersonaMap } from "../world/xiyou-personas";
import { xiyouRegionMap } from "../world/xiyou-regions";
import {
  composeDialogueTurnLLM,
  composeDebateRoundLLM,
  DEBATE_ROUNDS,
  verifyAndRepairConsistency,
  type Round,
  type Verdict,
} from "../world/dialogue";
import VerdictBadge from "./VerdictBadge";
import { useLang, useT } from "../i18n/lang";
import Said from "../i18n/Said";

/** 一句发言。id 供校验徽记按句回填——争辩四轮挨个落卷，凭数组次序会找错句。 */
type ParleyTurn = {
  id: number;
  who: string;
  text: string;
  round?: Round;
  verifying?: boolean;
  verdict?: Verdict;
  verdictNote?: string;
  /** 下判的模型 id 与是否异源外证（见 worker 的 QWEN_VERIFY_MODEL） */
  verdictModel?: string;
  verdictCross?: boolean;
};

/**
 * 西游 · 二人对口（同世界之内的对话与争辩）。
 *
 * 为什么西游人物之间辩得起来，而孔子与悟空辩不起来：世界注册表那条规矩是
 * **同世界之内才辩论，跨世界只能评议**（见 worlds.ts）。悟空与唐僧同在一世界、
 * 同在一条取经路上，他们本来就日日相争——争的不是学说，是**此处该怎么办**。
 * 故此处与战国辩论台最大的不同在议题：那边的议题是命题（「以德治还是以法治」），
 * 这边的议题默认取**此处之难**（白虎岭便是「这妇人是人是妖，打得打不得」）。
 * 人物不立说，只在处境里应对——议题也该是处境，不该是命题。
 *
 * 底下走的仍是诸子那两条路：`composeDialogueTurnLLM`（往复对谈）与
 * `composeDebateRoundLLM`（陈述·反驳·质询·总结四轮）。不另写一套，是因为
 * 口吻的分支不在这里而在 worker：payload 带着 `kind: "figure"`，提示词便换成
 * 「凭性格与处境说话、不引典标注出处」（见 worker/index.ts 的 `toneRule`）。
 * 检索亦已按世界限域（dialogue.ts 的 `worldIdOf`），故悟空不会去引《论语》。
 */
export default function XiyouParley({
  stopId,
  initial,
  castSeed,
  onClose,
}: {
  /** 此刻在取经路何处——议题默认取此处之难 */
  stopId: string;
  /** 自名册点进来时带的那个人，置为甲 */
  initial?: string;
  /** 就地开局带的甲乙（此处卡「论此难」以居停者为甲乙，如火焰山上牛魔王对铁扇） */
  castSeed?: string[];
  onClose: () => void;
}) {
  const here = xiyouRegionMap[stopId];
  const [cast, setCast] = useState<string[]>(() => {
    const seed = (castSeed ?? []).filter((id) => xiyouPersonaMap[id]);
    if (seed.length >= 2) return seed.slice(0, 4);
    const a = initial && xiyouPersonaMap[initial] ? initial : "wukong";
    return [a, a === "tangseng" ? "wukong" : "tangseng"];
  });
  const t = useT();
  const lang = useLang();
  const [form, setForm] = useState<"对谈" | "争辩">("对谈");
  const [topic, setTopic] = useState(here.trial || "此去西行，路上的事该听谁的。");
  const [turns, setTurns] = useState<ParleyTurn[]>([]);
  const [live, setLive] = useState<{ who: string; text: string; round?: Round } | null>(null);
  const [busy, setBusy] = useState(false);
  /** 中途喊停／关窗即置位：每说完一句看一眼，不再往下排 */
  const halt = useRef(false);
  /** 发言次第：校验徽记按句 id 回填，不用数组下标 */
  const seq = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => () => { halt.current = true; }, []);

  // 新话落地便滚到底，不必手拖
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, live]);

  // 议题引子：此处之难在先，再给两条路上常争的事
  const seeds = useMemo(
    () => [here.trial, here.mood, "这一难，是该打杀过去，还是该忍过去。"].filter(Boolean) as string[],
    [here],
  );

  const two = cast.length === 2;
  const canRun = cast.length >= 2 && topic.trim().length > 1 && !busy;

  function toggle(id: string) {
    if (busy) return;
    setCast((c) => {
      if (c.includes(id)) return c.length > 2 ? c.filter((x) => x !== id) : c;
      return c.length >= 4 ? c : [...c, id];
    });
  }

  // turns 的即时副本：run 是一条长流程，中途每一步都要看「到此为止说过什么」，
  // 而 setState 之后闭包里拿到的仍是旧值，故另存一份当下的。
  const turnsRef = useRef(turns);
  function pushTurn(t: ParleyTurn) {
    turnsRef.current = [...turnsRef.current, t];
    setTurns(turnsRef.current);
  }
  function clearTurns() {
    turnsRef.current = [];
    setTurns([]);
  }

  /** 排一串「谁·第几轮」的次第，然后挨个请他说 */
  async function run(steps: { who: string; round?: Round }[]) {
    halt.current = false;
    setBusy(true);
    try {
      for (const step of steps) {
        if (halt.current) break;
        // 已说过的话全数带上：对谈要承接对方，争辩要驳得着上家
        const prior = [...turnsRef.current].map((t) => ({ scholarId: t.who, text: t.text }));
        const prev = prior.length ? xiyouPersonaMap[prior[prior.length - 1].scholarId]?.name : undefined;
        setLive({ who: step.who, text: "", round: step.round });
        const onDelta = (d: string) => setLive((l) => (l && l.who === step.who ? { ...l, text: l.text + d } : l));
        let text: string;
        let evidence: import("../world/canon").Retrieved[] = [];
        try {
          const ans = step.round
            ? await composeDebateRoundLLM(step.who, topic, step.round, { previousSpeaker: prev }, prior, onDelta)
            : await composeDialogueTurnLLM(step.who, topic, { previousSpeaker: prev }, prior, onDelta);
          text = ans.text.trim();
          evidence = ans.citations;
        } catch {
          text = t("（一时语塞，未及应。）");
        }
        if (halt.current) break;
        const tid = seq.current++;
        pushTurn({ id: tid, who: step.who, text, round: step.round, verifying: true });
        // 一致性校验：一句落卷即请审、不阻下家（figure 档——悟空没有学说可违，
        // 但有性情可失）。回填须连 turnsRef 一并改：它是「到此为止说过什么」的正本，
        // 后续 pushTurn 以它为准重置 turns，只改 state 会被下一句冲掉。
        const checked = await verifyAndRepairConsistency(step.who, text, topic, evidence);
        turnsRef.current = turnsRef.current.map((x) =>
          x.id === tid
            ? { ...x, text: checked?.text ?? text, verifying: false, verdict: checked?.verdict, verdictNote: checked?.note, verdictModel: checked?.model, verdictCross: checked?.crossModel }
            : x,
        );
        setTurns(turnsRef.current);
        setLive(null);
      }
    } finally {
      setLive(null);
      setBusy(false);
    }
  }

  function start() {
    clearTurns();
    if (form === "对谈") {
      // 二人往复三个来回；不够再续
      const [a, b] = cast;
      run([{ who: a }, { who: b }, { who: a }, { who: b }, { who: a }, { who: b }]);
    } else {
      // 四轮，每轮座上人依次发言——与战国圆桌同制
      run(DEBATE_ROUNDS.flatMap((r) => cast.map((w) => ({ who: w, round: r }))));
    }
  }

  function more() {
    const [a, b] = cast;
    const last = turnsRef.current[turnsRef.current.length - 1]?.who;
    const first = last === a ? b : a;
    run([{ who: first }, { who: first === a ? b : a }]);
  }

  const done = !busy && turns.length > 0;

  return (
    <div className="kg-layer xp-layer">
      {/* 顶栏两行：上一行交代这是谁在何处争、事出哪一回，下一行即题面本身。
          题面从前在左栏，是个三行的小框——一场的纲，写它的地方比一句话还窄；
          况且左栏要滚，拟题时人眼睛正在右边的话流上。今占满顶栏一横，
          既宽且定（kg-top 是 sticky），话说到多长都看得见争的是什么。 */}
      <div className="kg-top xp-top">
        <div className="xp-top-row">
          <div>
            <div className="eyebrow">
              {t("西游 · 二人对口 · {place} · {chapter}「{title}」", {
                place: t(here.name),
                chapter: t(here.chapter.label),
                title: t(here.chapter.title),
              })}
            </div>
            <h2>
              {cast
                .map((id) => t(xiyouPersonaMap[id]?.name ?? ""))
                .join(form === "对谈" ? t(" 与 ") : " · ")}
              <small className="xy-sub">·{t(form)}</small>
            </h2>
          </div>
          <button className="kg-back-btn" onClick={() => { halt.current = true; onClose(); }}>{t("← 回取经路")}</button>
        </div>
        <div className="xp-topic-bar">
          <span className="xp-topic-tag">{form === "对谈" ? t("所谈") : t("所争")}</span>
          {/* 题面存的是中文（它要递给模型，检索与口吻都凭中文），框里显示的是译文；
              人一动手改，所见即所存，此后两者本就是同一句 */}
          <input
            className="xp-topic-in"
            value={t(topic)}
            maxLength={70}
            disabled={busy}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canRun) start(); }}
            placeholder={t("此处该怎么办……")}
          />
          {/* 引子随题面走：拟题与挑题本是一事，不该分在两处 */}
          <div className="xp-topic-seeds">
            {seeds.map((s, i) => (
              <button key={i} className="ghost-btn xy-seed" disabled={busy} onClick={() => setTopic(s.slice(0, 70))}>
                {/* 钮上只露一截：中文十四字，英文字窄，截三十四 */}
                {t("{seed}…", { seed: t(s).slice(0, lang === "en" ? 34 : 14) })}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="xp-body">
        <aside className="xp-setup">
          {/* 左栏只有名册一处可滚：十五人排下来必长，而形制与开场之钮是这一场的两个开关，
              开关不该随名册滚走——翻到底才找得着的钮，等于没在那儿。 */}
          <div className="xp-setup-scroll">
            <div className="kg-nd-sec">{t("席上")}</div>
            <p className="xp-note">
              {t("同在一条路上才争得起来。")}
              {form === "对谈" ? t("对谈须二人。") : t("争辩可二至四人，四轮依次。")}
            </p>
            <div className="xp-cast">
              {xiyouPersonas.map((p) => {
                const on = cast.includes(p.id);
                return (
                  <button
                    key={p.id}
                    className={`xy-p${on ? " on" : ""}`}
                    style={{ borderLeftColor: p.color }}
                    onClick={() => toggle(p.id)}
                    disabled={busy}
                  >
                    <i style={{ background: p.color }}>{p.glyph}</i>
                    <b>{t(p.name)}</b>
                    <small>
                      {on ? (cast[0] === p.id ? t("甲") : cast[1] === p.id ? t("乙") : t("同席")) : t(p.school)}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 形制与开场定在栏底，不随名册滚 */}
          <div className="xp-setup-foot">
            <div className="kg-nd-sec">{t("形制")}</div>
            <div className="xp-forms">
              <button className={form === "对谈" ? "on" : ""} disabled={busy || !two} onClick={() => setForm("对谈")}>
                {t("对谈 · 往复相应")}
              </button>
              <button className={form === "争辩" ? "on" : ""} disabled={busy} onClick={() => setForm("争辩")}>
                {t("争辩 · 陈述反驳质询总结")}
              </button>
            </div>
            {!two && form === "对谈" && <p className="xp-note">{t("三人以上只可争辩。")}</p>}

            {/* 所争何事已挪到顶栏（见上），此处只排席、择形制、开场 */}
            <div className="xp-acts">
              <button className="xp-go" disabled={!canRun} onClick={start}>
                {busy ? t("正说着…") : turns.length ? t("重开一场") : t("开{form}", { form: t(form) })}
              </button>
              {busy && <button className="ghost-btn" onClick={() => { halt.current = true; }}>{t("住口")}</button>}
              {done && form === "对谈" && two && (
                <button className="ghost-btn" onClick={more}>{t("再续一回")}</button>
              )}
            </div>
          </div>
        </aside>

        <div className="xp-stream" ref={scroller}>
          {/* 从前这里另钉一条题面，是因为题面只在左栏那个框里，话一滚就看不见了。
              如今题面自己钉在顶栏，且是可改的那一个——再钉一条便是同一句话写两遍，
              故撤去。出处（何处、哪一回）亦已写进顶栏的眉题。 */}
          {turns.length === 0 && live === null && (
            <div className="kg-annot-empty xp-empty">
              {t("取经路上，这四位本来日日相争——争的不是道理，是此处该怎么办。")}
              <br />
              {t("上头拟一句所争之事，左边点两个人，便可开谈。")}
            </div>
          )}
          {turns.map((t) => (
            <Say key={t.id} who={t.who} text={t.text} round={t.round} verifying={t.verifying} verdict={t.verdict} verdictNote={t.verdictNote} verdictModel={t.verdictModel} verdictCross={t.verdictCross} />
          ))}
          {live && <Say who={live.who} text={live.text} round={live.round} live />}
        </div>
      </div>
    </div>
  );
}

/** 一句发言。争辩时冠以轮次，对谈时不冠——往复之际标轮次反倒碍眼。
 *  徽记只在本句已落卷后显示（live 流式中的不算）。 */
function Say({
  who,
  text,
  round,
  live,
  verifying,
  verdict,
  verdictNote,
  verdictModel,
  verdictCross,
}: { who: string; text: string; round?: Round; live?: boolean; verifying?: boolean; verdict?: Verdict; verdictNote?: string; verdictModel?: string; verdictCross?: boolean }) {
  const t = useT();
  const p = xiyouPersonaMap[who];
  if (!p) return null;
  return (
    <div className="xp-say">
      <i style={{ background: p.color }}>{p.glyph}</i>
      <div>
        <div className="xp-say-top">
          <b style={{ color: p.color }}>{t(p.name)}</b>
          {round && <span className="xp-round">{t(round)}</span>}
        </div>
        <p>
          {text}
          {live && <span className="cursor">▍</span>}
          {/* 话照中文生成，英译附在其下；流式未完的一句不译，等落定再说 */}
          {!live && <Said text={text} scholar={p.name} />}
          {!live && (verifying || verdict) && (
            <VerdictBadge verifying={verifying} verdict={verdict} note={verdictNote} kind="figure" verifier={verdictModel} crossModel={verdictCross} />
          )}
        </p>
      </div>
    </div>
  );
}
