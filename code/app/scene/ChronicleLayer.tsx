"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadIndex,
  loadMonth,
  loadGanzhi,
  loadAll,
  loadModernMonth,
  loadAllModern,
  modernForToday,
  modernForMonth,
  searchModern,
  todayMark,
  dayToCn,
  yearLabel,
  yearLabelEn,
  ganzhiEn,
  spreadByBook,
  mergeSameEvent,
  westForToday,
  zhForToday,
  parseQuery,
  runSearch,
  isZh,
  isWest,
  LUNAR_MONTHS,
  LUNAR_MONTHS_EN,
  SOLAR_MONTHS,
  EN_MONTHS,
  type ChronicleIndex,
  type ChronicleRecord,
  type ChronQuery,
  type SearchResult,
  type ZhRecord,
  type WestRecord,
  type ModernRecord,
} from "../world/chronicle";
import { allPersonas, kindOf, worldOf, REVIEW_AXES, worldMap } from "../world/worlds";
import { composeAnswerLLM, generateEventQuestions, translateToVernacular, verifyAndRepairConsistency } from "../world/dialogue";
import type { Retrieved } from "../world/canon";
import { useLang, useT } from "../i18n/lang";
import TraceableEvidence from "./TraceableEvidence";

/**
 * 历史大事件（全屏）—— 典籍自己记下的日子。
 *
 * ## 这一层为什么不是一份大事年表
 *
 * 「历史上的今天」通常是一份现编的年表：某年某月某日某事。此处不这么办——
 * 项目里本就有一万七千余条**书上自带日期**的记事：《资治通鉴》「夏，四月，辛卯，
 * 山河十将马少良下嵖岈山」，《左传》「冬十有二月，祭伯来」，凡尔纳「On the 20th
 * of October」。既然书里有，就不另造一份；故此层每一条都点得回原书原章，
 * 读者可以接着往下读。抽法见 `scripts/chronicle-extract.mjs`。
 *
 * ## 三种看法
 *
 *  - **今日**（进门即此）：中土按今日农历月 + 干支日取，西书按今日公历月日取。
 *  - **月令**：底下十二枚月签，点一枚看那一月——用户要的「比如十月发生了什么」。
 *  - **检索**：按日期、人名、地名、事由自己查。查法见下。
 *
 * ## 四栏：两轴典籍 + 两栏公历近现代
 *
 * 一屏四栏，两两成对：**四库**旁是**近现代（中土）**，**西方书**旁是**近现代（西方）**。
 * 为什么要添后两栏：四库那一轴止于后周显德六年（959），西书八部亦非史书，于是
 * 「历史上的今天」问到近两百年便无话可答——而读者所在的今天正在那两百年之后。
 * 故另取一轴公历近现代（见 `scripts/chronicle-modern.mjs`），中土自一八四〇年起、
 * 西方自一七八九年起，补上这一段。
 *
 * 后两栏与前两栏有三处不同，界面上都标着：
 *
 *  - **历不同**：近现代两栏是**公历**，四库那栏是农历干支。四栏不作换算（见下）。
 *  - **无书可点**：这一轴不出自某部书，故点不回原章；每条只放事由与一段描写，
 *    另给维基出处由读者回查。这是用户要的样子：「只放事由和一些描写就行」。
 *  - **凭两源对签才收**：日页所列之年月日，须与该事自己的 Wikidata 日期声明全同，
 *    不同即弃。宁可少收不可错收——日子错了，这一层便没有存在的道理。
 *
 * 另有一段是空的，也得说出来：**九五九年至一八四〇年**之间，四库抽不到（无书）、
 * 近现代又未收（起点在后），这一段此层无事可报。注在页脚，不假装覆盖。
 *
 * ## 两轴分栏，是因为两种历不是一回事
 *
 * 左栏四库，右栏西书，中间一道古纸接缝分开——不是为了对称好看，是因为：
 *
 *  - 四库纪的是**农历月 + 干支日**（「十一月，丁卯」）；有一部分直接写着**日号**
 *    （「五月初三日」），多在小说家言与释家传记里
 *  - 西书纪的是**公历月 + 日号**（「the 20th of October」）
 *
 * 农历十月不是公历十月，差着约一个月。两栏各标其历，错位之处让人看见，
 * 这正是这个项目一向在做的事：边界不抹平，摆出来。
 *
 * ## 「今日」两轴各凭什么接上
 *
 *  - **四库**凭**农历同月**，再在月内取**同日号**（五月初三日）或**同干支日**：六十日
 *    一轮的干支纪日自殷商连绵未断、不因历法改易而断，故今日之干支（由儒略日推得）
 *    与史上某个「壬申」是同一个干支日；再以今日农历月（由运行环境自带的农历换得）
 *    收紧一道。日号是原话就写着的「某月某日」，比干支更贴题，故同月之中先认日号、
 *    再认干支——史部多是只记干支的，小说家言多是只记日号的，两样合起来才铺得开。
 *    同月这道筛子非收不可：只收干支，十月问今日会答出一条「秋，七月，壬申朔」——
 *    干支一格不错，月份却差着两三个月，而页首写着「今天」。页首因此两历并举。
 *  - **西书**凭**公历月日**：今日十月二十五，便找西书里的十月二十五；
 *    同日不足则补同月他日，并在条上标明是哪一日。
 *
 * 月名相同不等于历法相同——《春秋》用周正，其正月比后世农历正月早约两个月；秦及
 * 汉初以十月为岁首而月名不改，错位较小。此层只认月名，不作改历。这一层道理从前写在
 * 页首一段小注里，后去掉了：进门先想看见事，不想先读一段考据；栏头那一行（「史上农历
 * 十月·癸酉日之事」）已说明凭什么相认，运行环境若不带农历，栏头一并改口，不谎称同月。
 *
 * ## 检索：一句话里的日期与人名各归各处
 *
 * 输入框只有一个，不摆「年/月/日/关键词」四个格子——人想查的时候是一句话
 * （「十月二十五日 曹操」），不是一张表单。故一句话进来先拆：干支、公元年、月、
 * 日号各自认出，剩下的作字面（见 chronicle.ts 的 `parseQuery`）。拆成什么样
 * 回显在框下一行，拆错了用户看得见。
 *
 * 一问之于两轴未必都问得通：向西书问「壬申」问不通（西书不纪干支），向四库问
 * 「二十五日」也问不通（四库纪日用干支）。此时不糊弄：此轴尚有别的条件可办便
 * 按能办的办、注明哪项没办，一项也办不了便整栏不出、说清缘由。
 *
 * 检索要把十二片都取下来（全库约 5.5MB，压后不足 1MB），故只在真按了「检」
 * 之后才取；「今日」与「月令」各只要一片，不受此累。
 */

/** 一屏每轴取多少条。再多就得滚，而这一层是「先看见」，不是「读全」。 */
const TODAY_LIMIT = 8;
const MONTH_LIMIT = 14;
/** 检索是奔着一条去的，可多列几条由人挑 */
const SEARCH_LIMIT = 24;

/**
 * 检索示例：摆几枚现成的，省得人先猜「该怎么写」。
 *
 * 这几枚不过词表（界面虽可切英文，示例仍作中文）：字面检的是**原文**，四库正文
 * 是文言汉字，「曹操」译作 "Cao Cao" 便一条也检不着。日期一侧倒是中英皆可
 * （「十月」与 "October 20" 都认得，见 parseQuery），故留一枚英文的在末。
 */
const SAMPLES = ["十月", "壬申", "曹操", "十月二十五日 曹操", "公元前二一〇年", "October 20"];

type EventRecord = ChronicleRecord | ModernRecord;

const FALLBACK_EVENT_QUESTIONS = [
  "当旧秩序不能回应新处境时，改变应走多快？",
  "明知可能失败，是否仍值得行动？",
  "个人应为共同体承担多大的代价？",
];

type EventTurn = {
  id: string;
  personaId: string;
  lane: "evaluate" | "ask" | "discuss";
  role: "评议" | "提问" | "回应" | "讨论";
  text: string;
  translation?: string;
  citations: Retrieved[];
  inferred?: boolean;
  streaming?: boolean;
};

function eventTitle(r: EventRecord, en: boolean) {
  if (r.axis === "modern") return en ? (r.titleEn ?? r.title) : r.title;
  return r.text;
}

function eventSource(r: EventRecord, t: ReturnType<typeof useT>) {
  if (r.axis === "modern") return t("近现代事件：日期由两源对签，评议不代替史实。");
  if (r.axis === "zh") return t("原始记载：{book}{chapter}。", { book: `《${t(r.book)}》`, chapter: t(r.chapterName) });
  return t("原始记载：{book} {chapter}。", { book: `《${t(r.book)}》`, chapter: t(r.chapterName) });
}

function eventFacts(r: EventRecord, en: boolean) {
  if (r.axis === "modern") return [en ? (r.eventEn ?? r.event) : r.event, en ? (r.descEn ?? r.desc) : r.desc].filter(Boolean).join("\n");
  return r.text;
}

/** 历史事件的独立评议页：事实在上，三种不同交互在下。 */
function EventDesk({ r, onClose }: { r: EventRecord; onClose: () => void }) {
  const t = useT();
  const en = useLang() === "en";
  const [question, setQuestion] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [questionsBusy, setQuestionsBusy] = useState(true);
  const [turns, setTurns] = useState<EventTurn[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [asker, setAsker] = useState("kong");
  const [answerer, setAnswerer] = useState("han");
  const [talkFrom, setTalkFrom] = useState("kong");
  const [talkTo, setTalkTo] = useState("han");
  const [personaQuery, setPersonaQuery] = useState("");
  const [personaTier, setPersonaTier] = useState<"core" | "work" | "context" | "all">("core");
  const turnSeq = useRef(0);
  const activeQuestion = question;
  const byWorld = REVIEW_AXES.map((w) => w.id);

  useEffect(() => {
    let live = true;
    void (async () => {
      // 让切换到新事件的清空动作落在异步任务中；请求回来前不沿用上一事件的问题。
      await Promise.resolve();
      if (!live) return;
      setQuestion("");
      setCustomQuestion("");
      setSuggestedQuestions([]);
      setQuestionsBusy(true);
      const questions = await generateEventQuestions(eventFacts(r, en), en ? "en" : "zh");
      if (!live) return;
      const next = questions.length === 3 ? questions : FALLBACK_EVENT_QUESTIONS;
      setSuggestedQuestions(next);
      setQuestion(next[0]);
      setQuestionsBusy(false);
    })();
    return () => { live = false; };
  }, [r, en]);

  const context = () =>
    `以下是供讨论的历史材料：\n${eventFacts(r, en)}\n\n来源说明：${eventSource(r, t)}\n` +
    `讨论的问题是：「${activeQuestion}」。你不是这件事的亲历者，也不可补充或改写其中史实；只可从你自己的作品、学说或经历解释这件事所呈现的处境。`;

  const history = () =>
    turns.slice(-6).map((turn) => ({
      mine: false,
      text: `${allPersonas.find((p) => p.id === turn.personaId)?.name ?? "人物"}：${turn.text}`,
    }));

  async function askPersona(
    personaId: string,
    kind: "opening" | "followup" | "reply",
    lane: EventTurn["lane"],
    extra = "",
  ): Promise<string | null> {
    if (busy) return null;
    const person = allPersonas.find((p) => p.id === personaId);
    if (!person) return null;
    const id = `${personaId}-${++turnSeq.current}`;
    setBusy(personaId);
    setTurns((prev) => [...prev, {
      id,
      personaId,
      lane,
      role: kind === "opening" ? "评议" : kind === "followup" ? "回应" : "讨论",
      text: "",
      citations: [],
      streaming: true,
    }]);
    const instruction =
      kind === "opening"
        ? "请先指出此事中你最在意的一层冲突，作两至四句后设评议。"
        : kind === "followup"
          ? `读者追问：「${extra}」。请直接回应这一问，并仍守住史实与评议的界线。`
          : `请回应${extra}的看法。若对方来自另一世界，不作胜负式辩论，只说明你自己的不同理解；若同属一世界，可直接质询其理由。`;
    try {
      const answer = await composeAnswerLLM(personaId, `${context()}\n\n${instruction}`, undefined, history(), (delta) =>
        setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, text: turn.text + delta } : turn))),
      );
      const checked = await verifyAndRepairConsistency(personaId, answer.text, activeQuestion, answer.citations);
      const text = (checked?.text ?? answer.text).trim();
      const citations = checked?.citations ?? answer.citations;
      let translation: string | undefined;
      if (kindOf(person) === "west" && /[A-Za-z]{3}/.test(text)) {
        translation = (await translateToVernacular(text, personaId, (delta) =>
          setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, translation: (turn.translation ?? "") + delta } : turn))),
          undefined,
          "en",
        )) ?? undefined;
      } else if (text) {
        translation = (await translateToVernacular(text, personaId, (delta) =>
          setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, translation: (turn.translation ?? "") + delta } : turn))),
        )) ?? undefined;
      }
      setTurns((prev) => prev.map((turn) => (turn.id === id ? {
        ...turn,
        text,
        translation,
        citations,
        inferred: answer.inferred,
        streaming: false,
      } : turn)));
      return text;
    } catch {
      setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, text: t("（未及应，稍后再试。）"), streaming: false } : turn)));
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function discuss() {
    if (busy || talkFrom === talkTo) return;
    const fromName = allPersonas.find((p) => p.id === talkFrom)?.name ?? "对方";
    const toName = allPersonas.find((p) => p.id === talkTo)?.name ?? "对方";
    const first = await askPersona(talkFrom, "opening", "discuss");
    if (!first) return;
    const second = await askPersona(talkTo, "reply", "discuss", `${fromName}刚才说：「${first}」`);
    if (!second) return;
    await askPersona(talkFrom, "reply", "discuss", `${toName}回应说：「${second}」`);
  }

  async function askThrough() {
    if (busy || asker === answerer) return;
    const askerName = allPersonas.find((p) => p.id === asker)?.name ?? "对方";
    const answererName = allPersonas.find((p) => p.id === answerer)?.name ?? "对方";
    const prompt = `${context()}\n\n请你不要评论，只针对此事提出一个应由${answererName}回答的简短问题。只输出问题本身。`;
    const person = allPersonas.find((p) => p.id === asker);
    if (!person) return;
    const id = `${asker}-${++turnSeq.current}`;
    setBusy(asker);
    setTurns((prev) => [...prev, { id, personaId: asker, lane: "ask", role: "提问", text: "", citations: [], streaming: true }]);
    try {
      const out = await composeAnswerLLM(asker, prompt, undefined, history(), (delta) =>
        setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, text: turn.text + delta } : turn))),
      );
      const q = out.text.trim();
      let translation: string | undefined;
      if (kindOf(person) === "west" && /[A-Za-z]{3}/.test(q)) {
        translation = (await translateToVernacular(q, asker, (delta) =>
          setTurns((prev) => prev.map((turn) => turn.id === id ? { ...turn, translation: (turn.translation ?? "") + delta } : turn)),
          undefined,
          "en",
        )) ?? undefined;
      } else if (q) {
        translation = (await translateToVernacular(q, asker, (delta) =>
          setTurns((prev) => prev.map((turn) => turn.id === id ? { ...turn, translation: (turn.translation ?? "") + delta } : turn)),
        )) ?? undefined;
      }
      setTurns((prev) => prev.map((turn) => turn.id === id ? {
        ...turn,
        text: q,
        translation,
        citations: out.citations,
        inferred: out.inferred,
        streaming: false,
      } : turn));
      setBusy(null);
      await askPersona(answerer, "followup", "ask", `${askerName}问：「${q}」`);
    } catch {
      setTurns((prev) => prev.map((turn) => turn.id === id ? { ...turn, text: t("（未及应，稍后再试。）"), streaming: false } : turn));
      setBusy(null);
    }
  }

  const personaOptions = (except?: string) => allPersonas.filter((person) => person.id !== except).map((person) => (
    <option key={person.id} value={person.id}>{t(person.name)} · {t(person.school)}</option>
  ));
  const personaMatches = (person: (typeof allPersonas)[number]) => {
    const q = personaQuery.trim().toLowerCase();
    const tier = person.profileTier ?? "core";
    if (personaTier !== "all" && tier !== personaTier) return false;
    if (!q) return true;
    return [person.name, person.school, ...(person.representativeWorks ?? []), ...person.themes].join(" ").toLowerCase().includes(q);
  };

  const laneTurns = (lane: EventTurn["lane"]) => turns.filter((turn) => turn.lane === lane);
  const renderLaneTurns = (lane: EventTurn["lane"]) => {
    const items = laneTurns(lane);
    return <div className="ev-lane-turns" aria-live="polite">
      {items.map((turn) => {
        const person = allPersonas.find((p) => p.id === turn.personaId);
        if (!person) return null;
        const western = kindOf(person) === "west";
        return <article className={`ch-desk-turn w-${worldOf(person)}`} key={turn.id}>
          <header><b>{t(person.name)}</b><small>{t(turn.role)}{western ? ` · ${t("英文原话")}` : ""}</small></header>
          <p lang={western ? "en" : undefined}>{turn.text || t("正在作答……")}</p>
          {turn.translation && <p className="ch-desk-trans"><small>{t(western ? "中译" : "白话")}</small>{turn.translation}</p>}
          <TraceableEvidence citations={turn.citations} inferred={turn.inferred} />
        </article>;
      })}
      {busy && items.some((turn) => turn.personaId === busy && turn.streaming) && <small className="ev-lane-loading">{t("正在请{n}回应……", { n: t(allPersonas.find((p) => p.id === busy)?.name ?? "") })}</small>}
    </div>;
  };

  return (
    <div className="kg-layer ev-layer" role="dialog" aria-modal="true" aria-label={t("历史事件评议")}>
      <header className="kg-top">
        <div>
          <p className="eyebrow">{t("历史事件评议")}</p>
          <h2>{eventTitle(r, en)}</h2>
        </div>
        <button type="button" className="kg-back-btn" onClick={onClose}>{t("← 返回历史大事件")}</button>
      </header>

      <main className="kg-body ev-body">
        <section className="ev-facts">
          <div>
            <p className="ev-kicker">{t("事实与出处")}</p>
            <p className="ev-fact-copy">{eventFacts(r, en)}</p>
            <small>{eventSource(r, t)}</small>
            {r.axis === "zh" && r.also?.length ? <small>{t("又见：{v}", { v: r.also.map((o) => `《${t(o.book)}》`).join("、") })}</small> : null}
          </div>
          {r.axis === "modern" && <a href={(en && r.urlEn) || r.url} target="_blank" rel="noreferrer noopener">{t("查看外部出处")}</a>}
        </section>

        <section className="ev-question">
          <b>{t("事件中的问题")}</b>
          <div>
            {questionsBusy ? <small>{t("正在生成相关问题……")}</small> : suggestedQuestions.map((q) => <button key={q} type="button" className={question === q ? "on" : ""} onClick={() => setQuestion(q)}>{t(q)}</button>)}
          </div>
          <div className="ev-question-own">
            <input value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter" && customQuestion.trim()) setQuestion(customQuestion.trim());
            }} placeholder={t("写下自己的问题")} aria-label={t("写下自己的问题")} />
            <button type="button" disabled={!customQuestion.trim()} onClick={() => setQuestion(customQuestion.trim())}>{t("使用此问题")}</button>
          </div>
        </section>

        <div className="ev-three">
          <section className="ev-col ev-evaluate">
            <header><i>一</i><div><h3>{t("请他评议")}</h3><p>{t("直接点一位人物，他会以自己的世界、文本与处境评议此事。")}</p></div></header>
            <div className="kg-annot-row">
              <input className="found-input" value={personaQuery} onChange={(e) => setPersonaQuery(e.target.value)} placeholder={t("搜索人物、时代或著述……")} />
              <select className="found-input" value={personaTier} onChange={(e) => setPersonaTier(e.target.value as typeof personaTier)}>
                <option value="core">{t("核心人物 · 150")}</option>
                <option value="work">{t("著作关联 · 500")}</option>
                <option value="context">{t("历史语境 · 850")}</option>
                <option value="all">{t("全部可评议人物 · 1500")}</option>
              </select>
            </div>
            <div className="ev-personas">
              {byWorld.map((world) => <div className="ev-world" key={world}>
                <small>{t(worldMap[world]?.name ?? world)}</small>
                <div>{allPersonas.filter((person) => worldOf(person) === world && personaMatches(person)).slice(0, personaQuery ? 80 : 24).map((person) => (
                  <button key={person.id} type="button" disabled={!!busy || !activeQuestion} onClick={() => void askPersona(person.id, "opening", "evaluate")}>{t(person.name)}</button>
                ))}</div>
              </div>)}
            </div>
            {renderLaneTurns("evaluate")}
          </section>

          <section className="ev-col">
            <header><i>二</i><div><h3>{t("一人发问")}</h3><p>{t("让一位人物从自己的立场提出问题，交给另一位回答。")}</p></div></header>
            <div className="ev-pair">
              <label>{t("发问者")}<select value={asker} onChange={(e) => setAsker(e.target.value)}>{personaOptions(answerer)}</select></label>
              <span>{t("发问")}</span>
              <label>{t("回答者")}<select value={answerer} onChange={(e) => setAnswerer(e.target.value)}>{personaOptions(asker)}</select></label>
            </div>
            <button type="button" className="ev-action" disabled={!!busy || !activeQuestion || asker === answerer} onClick={() => void askThrough()}>{t("请他发问")}</button>
            {renderLaneTurns("ask")}
          </section>

          <section className="ev-col">
            <header><i>三</i><div><h3>{t("两人讨论")}</h3><p>{t("让两位人物围绕同一事件互相回应，各自保留自己的世界立场。")}</p></div></header>
            <div className="ev-pair">
              <label>{t("先说者")}<select value={talkFrom} onChange={(e) => setTalkFrom(e.target.value)}>{personaOptions(talkTo)}</select></label>
              <span>{t("与")}</span>
              <label>{t("回应者")}<select value={talkTo} onChange={(e) => setTalkTo(e.target.value)}>{personaOptions(talkFrom)}</select></label>
            </div>
            <button type="button" className="ev-action" disabled={!!busy || !activeQuestion || talkFrom === talkTo} onClick={() => void discuss()}>{t("开始讨论")}</button>
            {renderLaneTurns("discuss")}
          </section>
        </div>
      </main>
    </div>
  );
}

function ZhCard({ r, onOpen, onAsk }: { r: ZhRecord; onOpen: (r: ZhRecord) => void; onAsk: (r: ZhRecord) => void }) {
  const t = useT();
  const en = useLang() === "en";
  // 纪年：有公元年则年号与公元并举（「天监六年 · 公元五〇七年」），无则只标年号
  const era = r.era && <b>{r.era}</b>;
  return (
    <article className="ch-card" data-g={r.group}>
      <button type="button" className="ch-card-main" onClick={() => onOpen(r)} title={t("点开原书此章")}>
      <span className="ch-date">
        {r.season && <i>{t(r.season)}</i>}
        <em>
          {en ? LUNAR_MONTHS_EN[r.month] : LUNAR_MONTHS[r.month]}
          {r.leap && <u>{t("闰")}</u>}
        </em>
        {/* 日干支（「丁卯」）是纪日的记号，两种语文都照原样；朔／望可译，故分开取。
            中文仍作「丁卯朔」不加空，英文「dingmao new moon」间须有空。 */}
        {r.ganzhi && <s>{en ? ganzhiEn(r.ganzhi) : r.ganzhi}{r.phase ? (en ? ` ${t(r.phase)}` : r.phase) : ""}</s>}
        {!r.ganzhi && r.phase && <s>{t(r.phase)}</s>}
      </span>
      <span className="ch-text">{r.text}</span>
      <span className="ch-src">
        {era}
        {r.year != null && <span className="ch-ce">{en ? yearLabelEn(r.year) : yearLabel(r.year)}</span>}
        <span className="ch-book">
          《{t(r.book)}》{t(r.chapterName)}
        </span>
        {r.also?.length ? (
          <i className="ch-also" title={t("三传、史书同记一事，并作一条")}>
            {t("又见")}
            {en
              ? r.also.map((o) => t(o.book)).join(", ")
              : r.also.map((o) => `《${t(o.book)}》`).join("")}
          </i>
        ) : null}
      </span>
      </button>
      <button type="button" className="ch-card-ask" onClick={() => onAsk(r)}>{t("问此事")}</button>
    </article>
  );
}

function WestCard({ r, onOpen, onAsk }: { r: WestRecord; onOpen: (r: WestRecord) => void; onAsk: (r: WestRecord) => void }) {
  const t = useT();
  const en = useLang() === "en";
  return (
    <article className="ch-card ch-card-w">
      <button type="button" className="ch-card-main" onClick={() => onOpen(r)} title={t("点开原书此章")}>
      <span className="ch-date">
        {/* 中文界面：月日作中文，右端另出原书的英文写法；英文界面只出后者——
            两行同是一个日子，译过来便重了。 */}
        {!en && (
          <em>
            {SOLAR_MONTHS[r.month]}
            {r.day != null && t("{d}日", { d: dayToCn(r.day) })}
          </em>
        )}
        <s>{r.monthEn}{r.day != null && ` ${r.day}`}</s>
      </span>
      <span className={r.lang === "en" ? "ch-text ch-text-en" : "ch-text"}>{r.text}</span>
      <span className="ch-src">
        <b>《{t(r.book)}》</b>
        <span className="ch-book">
          {t(r.author)} · {r.lang === "en" ? t("原书") : t("中译")} · {t(r.chapterName)}
        </span>
      </span>
      </button>
      <button type="button" className="ch-card-ask" onClick={() => onAsk(r)}>{t("问此事")}</button>
    </article>
  );
}

/**
 * 近现代一条：公历日子 + 事由 + 一段描写 + 出处。
 *
 * 这一轴无书可点，故不作按钮而作链接——点开是维基本条，读者自己回查得着。
 * 用 target="_blank" 是因为这一层本身是个全屏的看书场子，跳走便丢了手上这一屏。
 */
function ModernCard({ r, onAsk }: { r: ModernRecord; onAsk: (r: ModernRecord) => void }) {
  const t = useT();
  const en = useLang() === "en";
  const title = en ? (r.titleEn ?? r.title) : r.title;
  const event = en ? r.eventEn : r.event;
  const desc = en ? r.descEn : r.desc;
  const href = (en && r.urlEn) || r.url;
  return (
    <article className="ch-card ch-card-m">
      <a className="ch-card-main" href={href} target="_blank" rel="noreferrer noopener" title={t("看维基此条")}>
      <span className="ch-date">
        <em>
          {en ? `${EN_MONTHS[r.month].slice(0, 3)} ${r.day}` : `${SOLAR_MONTHS[r.month]}${dayToCn(r.day)}日`}
        </em>
        <s>{r.year}</s>
      </span>
      <span className="ch-text">{title}</span>
      {event && <span className="ch-ev">{event}</span>}
      {desc && desc !== event && <span className="ch-desc">{desc}</span>}
      <span className="ch-src">
        <span className="ch-book">{t("维基 · {q}", { q: r.qid })}</span>
        {r.both && <i className="ch-both" title={t("中英两种日页都列着这一件")}>{t("两页并列")}</i>}
      </span>
      </a>
      <button type="button" className="ch-card-ask" onClick={() => onAsk(r)}>{t("问此事")}</button>
    </article>
  );
}

/** 空栏：说清为什么空，而不是摆一行「暂无数据」。 */
function Empty({ note }: { note: string }) {
  return <p className="ch-empty">{note}</p>;
}

export default function ChronicleLayer({
  onClose,
  onOpenSiku,
  onOpenLit,
  backLabel = "返回",
}: {
  onClose: () => void;
  /**
   * 点一条中土记事：落进四库该书该章（给的是回次字样，如「卷三十九」）。
   *
   * 第三个参数是这一条的原话，交给阅读层在正文里标出来：一章动辄数千字，
   * 不标一下，跳过去只是开了一章书，看不出点的是哪一句。
   */
  onOpenSiku?: (bookId: string, chapterLabel: string, hit: string) => void;
  /**
   * 点一条西书记事：落进世界文学该书该章。
   *
   * 给的是书 id 与**这一条出自哪一面**（原书 en／中译 zh）加章序——章序是该面
   * 自己的章序。不给卷名（edition）：阅读层本就按面取卷，而《茶花女》《月界旅行》
   * 《天演论》中英两面章数不等（16 对 27、16 对 28、38 对 19），拿错了面便落错章。
   * 末一项同上，是要在正文里标出的原话。
   */
  onOpenLit?: (bookId: string, lang: "en" | "zh", chapter: number, hit: string) => void;
  backLabel?: string;
}) {
  const t = useT();
  const en = useLang() === "en";
  // 今日：挂载后才取（new Date 不可在 render 期用于 SSR 一致性），故初值 null
  const [today, setToday] = useState<ReturnType<typeof todayMark> | null>(null);
  const [index, setIndex] = useState<ChronicleIndex | null>(null);
  const [err, setErr] = useState<string | null>(null);
  /** 看哪一种：今日 / 某月令 / 检索所得 */
  const [view, setView] = useState<"today" | "month" | "search">("today");
  const [month, setMonth] = useState(1);
  const [zhRows, setZhRows] = useState<ZhRecord[] | null>(null);
  const [westRows, setWestRows] = useState<WestRecord[] | null>(null);
  /** 「今日」一屏里，农历月这一道筛子是否真用上了（环境不带农历、或该格无事则否） */
  const [zhMonthOk, setZhMonthOk] = useState(false);
  /** 同月之中，日号或干支这一道筛子是否真用上了；否则所列只是同月他日 */
  const [zhDayOk, setZhDayOk] = useState(false);
  /** 今日一栏真正取到的条数（同月、日号或干支筛过之后），栏头的「共几条」用它 */
  const [zhTotal, setZhTotal] = useState<number | undefined>(undefined);
  /** 公历近现代两栏（中土、西方），与上两栏同历不同轴，各自取数 */
  const [modZh, setModZh] = useState<ModernRecord[] | null>(null);
  const [modWest, setModWest] = useState<ModernRecord[] | null>(null);
  /** 检索所得的近现代条数（两栏各一个） */
  const [modCount, setModCount] = useState<{ zh: number; west: number } | null>(null);
  /** 检索：框里的字、已提交的条件、所得 */
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState<ChronQuery | null>(null);
  const [res, setRes] = useState<SearchResult | null>(null);
  const [busy, setBusy] = useState(false);
  /** 由任一事件卡直接开出的「问此事」席；不离开年表，证据仍在同一层。 */
  const [eventDesk, setEventDesk] = useState<EventRecord | null>(null);

  useEffect(() => {
    setToday(todayMark());
    let live = true;
    loadIndex().then(
      (j) => live && setIndex(j),
      (e) => live && setErr(String(e)),
    );
    return () => {
      live = false;
    };
  }, []);

  // 今日一屏：中土按干支片取（再筛农历同月），西书按今日所在公历月片取（再筛同日）
  useEffect(() => {
    if (!today || view !== "today") return;
    let live = true;
    setZhRows(null);
    setWestRows(null);
    loadGanzhi(today.gzIndex).then(
      (s) => {
        if (!live) return;
        const { rows, total, monthMatched, dayMatched } = zhForToday(
          s.records,
          today.lunar?.month ?? null,
          TODAY_LIMIT,
          today.lunar?.day ?? null,
          today.ganzhi,
        );
        setZhRows(rows);
        setZhTotal(total);
        setZhMonthOk(monthMatched);
        setZhDayOk(dayMatched);
      },
      (e) => live && setErr(String(e)),
    );
    loadMonth(today.month).then(
      (s) => live && setWestRows(westForToday(s.records, today.day, TODAY_LIMIT)),
      (e) => live && setErr(String(e)),
    );
    // 近现代两栏：公历同月同日，不补他日
    setModZh(null);
    setModWest(null);
    loadModernMonth(today.month).then(
      (s) => {
        if (!live) return;
        setModZh(modernForToday(s.records, "zh", today.month, today.day, TODAY_LIMIT));
        setModWest(modernForToday(s.records, "west", today.month, today.day, TODAY_LIMIT));
      },
      (e) => live && setErr(String(e)),
    );
    return () => {
      live = false;
    };
  }, [today, view]);

  // 月令一屏：两轴同取一片，各按本轴的历分栏
  useEffect(() => {
    if (view !== "month") return;
    let live = true;
    setZhRows(null);
    setWestRows(null);
    setModZh(null);
    setModWest(null);
    loadMonth(month).then(
      (s) => {
        if (!live) return;
        setZhRows(spreadByBook(mergeSameEvent(s.records.filter(isZh)), MONTH_LIMIT));
        setWestRows(spreadByBook(s.records.filter(isWest), MONTH_LIMIT));
      },
      (e) => live && setErr(String(e)),
    );
    loadModernMonth(month).then(
      (s) => {
        if (!live) return;
        setModZh(modernForMonth(s.records, "zh", MONTH_LIMIT));
        setModWest(modernForMonth(s.records, "west", MONTH_LIMIT));
      },
      (e) => live && setErr(String(e)),
    );
    return () => {
      live = false;
    };
  }, [view, month]);

  /**
   * 书名作者的英文名别名。
   *
   * 片里只存中文名（「月界旅行」「凡尔纳」），英文名出自界面词表；英文读者检
   * 「Verne」须有此一手，否则检不着。中文界面下 `t` 是恒等，等于没加。
   */
  const alias = useCallback(
    (r: ChronicleRecord) => (isWest(r) ? `${t(r.book)} ${t(r.author)}` : ""),
    [t],
  );

  const doSearch = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const q = parseQuery(text);
      setDraft(text);
      setQuery(q);
      setView("search");
      setZhRows(null);
      setWestRows(null);
      setModZh(null);
      setModWest(null);
      setRes(null);
      setModCount(null);
      // 一项条件也没解出（只打了标点之类）：不必取全库
      if (!q.ganzhi.length && !q.months.length && !q.days.length && !q.years.length && !q.words.length) {
        setRes({ zh: [], west: [], zhTotal: 0, westTotal: 0, zhNA: null, westNA: null, zhDropped: [], westDropped: [] });
        setZhRows([]);
        setWestRows([]);
        setModZh([]);
        setModWest([]);
        setModCount({ zh: 0, west: 0 });
        return;
      }
      setBusy(true);
      loadAll().then(
        (all) => {
          const r = runSearch(all, q, SEARCH_LIMIT, alias);
          setRes(r);
          setZhRows(r.zh);
          setWestRows(r.west);
          setBusy(false);
        },
        (e) => {
          setErr(String(e));
          setBusy(false);
        },
      );
      // 近现代一轴另取（片小，与上面并行；此轴纪公历年月日，故年、月、日、字面四样都办得通）
      loadAllModern().then(
        (all) => {
          const a = searchModern(all, q, "zh", SEARCH_LIMIT);
          const b = searchModern(all, q, "west", SEARCH_LIMIT);
          setModZh(a.rows);
          setModWest(b.rows);
          setModCount({ zh: a.total, west: b.total });
        },
        (e) => setErr(String(e)),
      );
    },
    [alias],
  );

  const openZh = (r: ZhRecord) => onOpenSiku?.(r.bookId, r.chapterName, r.text);
  const openWest = (r: WestRecord) => onOpenLit?.(r.bookId, r.lang, r.chapter, r.text);

  /** 页首那一行。 */
  const head = useMemo(() => {
    if (view === "search") {
      return { eyebrow: t("检索 · 纪时记事"), title: query ? query.raw : t("检索") };
    }
    if (view === "month") {
      return { eyebrow: t("月令 · 典籍里的这一月"), title: `${LUNAR_MONTHS[month]} / ${EN_MONTHS[month]}` };
    }
    if (!today) return { eyebrow: t("历史上的今天"), title: t("正在推算今日……") };
    // 题名两历并举：公历是读者所在的今天，农历干支是史书认得的今天
    const names = en ? LUNAR_MONTHS_EN : LUNAR_MONTHS;
    const lunar = today.lunar
      ? (today.lunar.leap ? t("闰{mon}", { mon: names[today.lunar.month] }) : names[today.lunar.month])
      : null;
    return {
      eyebrow: t("历史上的今天"),
      title: lunar
        ? t("{m}月{d}日 · 农历{lunar}{gz}", { m: today.month, d: today.day, lunar, gz: en ? ganzhiEn(today.ganzhi) : today.ganzhi })
        : t("{m}月{d}日 · {gz}日", { m: today.month, d: today.day, gz: en ? ganzhiEn(today.ganzhi) : today.ganzhi }),
    };
  }, [view, month, today, query, t, en]);

  /** 条件回显：拆成什么样，让用户看得见——拆错了才有得改。 */
  const parsed = useMemo(() => {
    if (!query) return [];
    const bits: string[] = [];
    if (query.ganzhi.length) bits.push(t("干支日{v}", { v: query.ganzhi.map((g) => (en ? ganzhiEn(g) : g)).join(en ? ", " : "、") }));
    if (query.years.length) bits.push(query.years.map((y) => (en ? yearLabelEn(y) : yearLabel(y))).join(en ? ", " : "、"));
    if (query.months.length)
      bits.push(
        t("月{v}", {
          v: query.months.map((m) => (en ? EN_MONTHS[m] : `${LUNAR_MONTHS[m]}／${EN_MONTHS[m]}`)).join(en ? ", " : "、"),
        }),
      );
    if (query.days.length) bits.push(t("日号{v}", { v: query.days.map((d) => (en ? String(d) : dayToCn(d))).join(en ? ", " : "、") }));
    if (query.words.length) bits.push(t("字面「{v}」", { v: query.words.join(" ") }));
    return bits;
  }, [query, t, en]);

  /** 某轴办不到的条件，作一句人话。 */
  const facetName = (axis: "zh" | "west", n: string) => {
    if (axis === "zh") return n;
    if (n === "ganzhi") return t("干支（西书不纪干支）");
    if (n === "years") return t("公元年（西书未注年份）");
    return n;
  };
  const dropNote = (axis: "zh" | "west", names: string[]) =>
    names.length ? t("此栏未按{v}筛。", { v: names.map((n) => facetName(axis, n)).join("、") }) : null;
  const naNote = (axis: "zh" | "west", names: string[]) =>
    t("这一问在此轴上不成立：所问惟{v}。", { v: names.map((n) => facetName(axis, n)).join("、") });

  const zhCount =
    view === "search"
      ? res?.zhTotal
      : view === "month"
        ? index?.months[month - 1]?.zh
        : today
          ? zhTotal
          : undefined;
  const westCount = view === "search" ? res?.westTotal : view === "month" ? index?.months[month - 1]?.west : undefined;

  /**
   * 近现代一栏（中土／西方各一）。
   *
   * 两栏除栏名与起始年之外一模一样，故不另写两段 JSX。栏头的「共几条」：月令一屏
   * 用总目里该月之数（含未列出的），今日与检索一屏用实际取到之数。
   */
  const modCol = (side: "zh" | "west") => {
    const rows = side === "zh" ? modZh : modWest;
    const from = side === "zh" ? (index?.modern?.cnFrom ?? 1840) : (index?.modern?.westFrom ?? 1789);
    const n =
      view === "month"
        ? (side === "zh" ? index?.modern?.months[month - 1]?.zh : index?.modern?.months[month - 1]?.west)
        : view === "search"
          ? (side === "zh" ? modCount?.zh : modCount?.west)
          : (rows?.length ?? undefined);
    return (
      <section className="ch-col ch-col-m" data-axis={`modern-${side}`}>
        <header className="ch-col-head">
          <h3>{side === "zh" ? t("近现代 · 中土") : t("近现代 · 西方")}</h3>
          <small>
            {view === "today"
              ? t("公历{m}月{d}日 · {y}年以来", { m: today?.month ?? "", d: today?.day ?? "", y: from })
              : view === "month"
                ? t("公历{m} · {y}年以来", { m: EN_MONTHS[month], y: from })
                : t("合于所问者")}
            {n != null && t(" · 共{n}条", { n })}
          </small>
        </header>
        {!index?.modern ? (
          <Empty note={t("此处尚未铺上近现代一轴的语料。")} />
        ) : rows === null ? (
          <p className="ch-load">{t("正在翻检……")}</p>
        ) : rows.length === 0 ? (
          <Empty
            note={
              view === "search"
                ? t("近现代一轴里没有合于所问的事。此轴只纪公历年月日，向它问干支问不通。")
                : view === "today"
                  ? t("这一日此栏无事可报——两源对不上的一概弃去，故逐日有疏。")
                  : t("这一月此栏无事可报。")
            }
          />
        ) : (
          <div className="ch-list">
            {rows.map((r) => (
              <ModernCard key={r.id} r={r} onAsk={setEventDesk} />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="kg-layer ch-layer">
      <div className="kg-top">
        <div>
          <p className="eyebrow">{head.eyebrow}</p>
          <h2>{head.title}</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {view !== "today" && (
            <button className="kg-back-btn" onClick={() => setView("today")}>
              {t("← 回今日")}
            </button>
          )}
          <button className="kg-back-btn" onClick={onClose}>
            {t("← {label}", { label: t(backLabel) })}
          </button>
        </div>
      </div>

      <div className="kg-body ch-body">
        {/* 检索：一个框，一句话进来自己拆。示例摆在旁边，省得人先猜怎么写 */}
        <form
          className="ch-search"
          onSubmit={(e) => {
            e.preventDefault();
            doSearch(draft);
          }}
        >
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("检日期、人名、地名、事由——如「十月二十五日 曹操」")}
            aria-label={t("检索纪时记事")}
          />
          <button type="submit" className="ch-go" disabled={busy}>
            {busy ? t("翻检中…") : t("检")}
          </button>
          <span className="ch-samples">
            {SAMPLES.map((s) => (
              <button key={s} type="button" onClick={() => doSearch(s)}>
                {s}
              </button>
            ))}
          </span>
        </form>

        {/* 条件回显：日期归日期、字面归字面，拆成什么样摆出来 */}
        {view === "search" && query && (
          <p className="ch-parsed">
            {parsed.length ? (
              <>
                {t("已解作：")}
                {parsed.map((b, i) => (
                  <b key={i}>{b}</b>
                ))}
              </>
            ) : (
              t("这一句里没解出日期，也没剩下可检的字面。")
            )}
          </p>
        )}

        {/* 「今日」一屏不作小注：两轴凭什么相认，栏头那一行已写着（「史上农历十月·癸酉日之事」），
            底下再铺一段考据，看的人只是先想看见事。月令与检索两屏各留一句，一句说得完。 */}
        {view !== "today" && (
          <p className="ch-note">
            {view === "month"
              ? t("左栏四库为农历月，右栏西书为公历月——农历十月并非公历十月，相差约一月。两栏各标其历，不作换算。")
              : t("同一问之于两轴未必都问得通：四库纪年用年号而无公元年，西书注公元而与干支无涉；月各依本历（四库农历、西书公历），日号两轴皆有。各栏按本轴办得到的条件筛，办不到的注在栏下。字面检的是原文——四库为文言汉字，西书原书为英文、中译卷为中文。近现代两栏纪公历年月日，年月日与字面皆可检，干支问不通。")}
          </p>
        )}

        {err && <p className="ch-err">{t("取纪时记事不得：")}{err}</p>}

        <div className="ch-four">
          <section className="ch-col" data-axis="zh">
            <header className="ch-col-head">
              <h3>{t("四库")}</h3>
              <small>
                {view === "today"
                  ? zhMonthOk && today?.lunar
                    ? zhDayOk
                      ? t("史上农历{mon}{day}·{gz}日之事", {
                          mon: (en ? LUNAR_MONTHS_EN : LUNAR_MONTHS)[today.lunar.month],
                          day: en ? ` ${today.lunar.day}` : dayToCn(today.lunar.day),
                          gz: en ? ganzhiEn(today.ganzhi) : today.ganzhi,
                        })
                      : t("史上农历{mon}·{gz}日之事", {
                          mon: (en ? LUNAR_MONTHS_EN : LUNAR_MONTHS)[today.lunar.month],
                          gz: en ? ganzhiEn(today.ganzhi) : today.ganzhi,
                        })
                    : t("史上{gz}日之事", { gz: today ? (en ? ganzhiEn(today.ganzhi) : today.ganzhi) : "" })
                  : view === "month"
                    ? t("农历{m}", { m: (en ? LUNAR_MONTHS_EN : LUNAR_MONTHS)[month] })
                    : t("合于所问者")}
                {zhCount != null && t(" · 共{n}条", { n: zhCount })}
              </small>
            </header>
            {view === "search" && res?.zhNA ? (
              <Empty note={naNote("zh", res.zhNA.split(","))} />
            ) : zhRows === null ? (
              <p className="ch-load">{busy ? t("正在取全库一万七千余条……") : t("正在翻检……")}</p>
            ) : zhRows.length === 0 ? (
              <Empty note={view === "search" ? t("四库里没有合于所问的记事。") : t("此日四库未记事。")} />
            ) : (
              <div className="ch-list">
                {zhRows.map((r) => (
                  <ZhCard key={r.id} r={r} onOpen={openZh} onAsk={setEventDesk} />
                ))}
              </div>
            )}
            {view === "search" && res && !res.zhNA && dropNote("zh", res.zhDropped) && (
              <p className="ch-drop">{dropNote("zh", res.zhDropped)}</p>
            )}
          </section>

          {modCol("zh")}

          <section className="ch-col" data-axis="west">
            <header className="ch-col-head">
              <h3>{t("西方书")}</h3>
              <small>
                {view === "today"
                  ? t("公历{m}月{d}日前后", { m: today?.month ?? "", d: today?.day ?? "" })
                  : view === "month"
                    ? t("公历{m}", { m: EN_MONTHS[month] })
                    : t("合于所问者")}
                {westCount != null && t(" · 共{n}条", { n: westCount })}
              </small>
            </header>
            {view === "search" && res?.westNA ? (
              <Empty note={naNote("west", res.westNA.split(","))} />
            ) : westRows === null ? (
              <p className="ch-load">{busy ? t("正在取全库一万七千余条……") : t("正在翻检……")}</p>
            ) : westRows.length === 0 ? (
              <Empty
                note={
                  view === "search"
                    ? t("八部西书里没有合于所问的记事。")
                    : t("八部西书里，这一月没有写明日期的记事。")
                }
              />
            ) : (
              <div className="ch-list">
                {westRows.map((r) => (
                  <WestCard key={r.id} r={r} onOpen={openWest} onAsk={setEventDesk} />
                ))}
              </div>
            )}
            {view === "search" && res && !res.westNA && dropNote("west", res.westDropped) && (
              <p className="ch-drop">{dropNote("west", res.westDropped)}</p>
            )}
          </section>

          {modCol("west")}
        </div>

        {/* 十二月签：农历名与公历名并列，点一枚换一月 */}
        <nav className="ch-months" aria-label={t("十二月令")}>
          <button type="button" className={view === "today" ? "ch-mon on" : "ch-mon"} onClick={() => setView("today")}>
            <b>{t("今日")}</b>
            <small>{today ? (en ? ganzhiEn(today.ganzhi) : today.ganzhi) : "—"}</small>
          </button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const mi = index?.months[m - 1];
            return (
              <button
                key={m}
                type="button"
                className={view === "month" && month === m ? "ch-mon on" : "ch-mon"}
                onClick={() => {
                  setMonth(m);
                  setView("month");
                }}
                title={t("{lunar} / {solar}：四库{a}条、西书{b}条", {
                  lunar: LUNAR_MONTHS[m],
                  solar: EN_MONTHS[m],
                  a: mi?.zh ?? 0,
                  b: mi?.west ?? 0,
                })}
              >
                <b>{en ? LUNAR_MONTHS_EN[m] : LUNAR_MONTHS[m]}</b>
                <small>{EN_MONTHS[m].slice(0, 3)}</small>
              </button>
            );
          })}
        </nav>

        {/* 来源交代：这层的料出自哪些书、抽了多少条，摆明白 */}
        {index && (
          <p className="ch-foot">
            {t("共{n}条自带日期的记事（四库{a} · 西书{b}），抽自{k}部书，皆可点回原章。", {
              n: index.total,
              a: index.zhTotal,
              b: index.westTotal,
              k: index.books.length,
            })}
            {index.westTotal < 400 &&
              t(" 西书一侧条数少且多出《月界旅行》——八部书里只有凡尔纳与小仲马勤记日期，此为语料实情，非抽取遗漏。")}
          </p>
        )}
        {index?.modern && (
          <p className="ch-foot">
            {/* 出处与许可不取索引里那两句（索引是中文写的，英文面上便成了夹生话），
                径写在词条里，两面各出各的话 */}
            {t("近现代一轴另{n}条（中土{a} · 西方{b}），皆公历，出自维基「历史上的今天」逐日条目与 Wikidata 日期声明两源对签；文本依 CC BY-SA 4.0，日期依 CC0。", {
              n: index.modern.total,
              a: index.modern.zh,
              b: index.modern.west,
            })}
            {t(" 九五九年至{a}年之间，四库抽不到（无书）、近现代又未收（起点在后），此层无事可报——这一段是空的，不作假。", {
              a: index.modern.cnFrom,
            })}
          </p>
        )}
      </div>
      {eventDesk && <EventDesk r={eventDesk} onClose={() => setEventDesk(null)} />}
    </div>
  );
}
