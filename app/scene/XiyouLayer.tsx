"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { xiyouRegions, xiyouOffRegions, xiyouRegionMap, nextStop, XIYOU_PARTY, XIYOU_JOINS } from "../world/xiyou-regions";
import { xiyouPersonas, xiyouPersonaMap } from "../world/xiyou-personas";
import { xiyouPassages } from "../world/xiyou-passages";
import { clipsOfWorld } from "../world/adaptations";
import { composeAnswerLLM, verifyAndRepairConsistency, type Verdict } from "../world/dialogue";
import VerdictBadge from "./VerdictBadge";
import XiyouParley from "./XiyouParley";
import SikuLayer from "./SikuLayer";
import ClipReviewLayer from "./ClipReviewLayer";
import { useT } from "../i18n/lang";
import { XMEDIA_ON } from "../world/feature-flags";
import Said from "../i18n/Said";

/** 取经路被后世重演的几折，侧栏常列（静态目录，故取于模块层）。 */
const XY_CLIPS = clipsOfWorld("xiyou");

/** 《西游记》在四库里的分片名（集部·小说，见 pipeline 的 siku_extract.py 选书表）。 */
const XIYOU_BOOK = "xiyouji";

/**
 * 界外五处的**前史次第**——悟空一个人的路，全书前七回在此：花果山称王 →
 * 斜月三星洞学道 → 凌霄宝殿反天宫 → 兜率宫炉中受炼 →（五百载后）南海求告。
 * `xiyouOffRegions` 只给并列，这一序是书给的；路条在界外时凭它送出「前史 → 下一处」，
 * 与路上「西行 → 下一处」同一只手。
 */
const XIYOU_OFF_CHAIN = ["huaguo", "xieyue", "lingxiao", "doushuai", "nanhai"] as const;

function XiyouLoading() {
  const t = useT();
  return <div className="scene-loading">{t("正在铺展取经路……")}</div>;
}

// WebGL 只能在浏览器端初始化，故禁用 SSR（同 WorldScene）
const XiyouScene = dynamic(() => import("./XiyouScene"), {
  ssr: false,
  loading: XiyouLoading,
});

/**
 * 西游世界（全屏）。
 *
 * 另开一张图而不是把西游塞进战国那套模拟，理由在 xiyou-regions.ts 已说过一遍：
 * 两个世界的拓扑不同。这里再补一条——战国那边跑的是**日程**（十六区并置、二十一人
 * 按时辰各自行止、相遇即可开辩），西游跑的是**行程**（四众同行，过一处是一难，
 * 次第不可逆）。硬把取经路塞进 `schedule.ts` 的时辰循环，等于让八戒每天去一趟
 * 高老庄又回来——那不是西游。故共用的是渲染栈与人格模型，不共用模拟。
 *
 * 跨世界的交涉一律走母题层（MotifLayer），此处只管一个世界之内的事。
 */
export default function XiyouLayer({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [stopId, setStopId] = useState("dongtu");
  const [personaId, setPersonaId] = useState("wukong");
  /** 二人对口：同世界之内可辩，故另开一层（见 XiyouParley 顶注） */
  const [parley, setParley] = useState(false);
  /** 就此难开局时带的甲乙（此处卡「论此难」以居停者开局；名册开局不带） */
  const [askSeed, setAskSeed] = useState<string[] | undefined>(undefined);
  /**
   * 翻开的那一回。
   *
   * 这张图上的十三处本是从书上某几回里来的（见 xiyou-regions.ts 的 `chapter`）；
   * 从前回目只是卡上一行字，看的人要核，得自己去集部小说里找到《西游记》再数到那一回。
   * 如今书全在四库里切好了，便把这一行字接成一道门：点下去即开该回正文。
   * 图与书本是一事之两面，中间不该隔着一次检索。
   *
   * 四库那层自己挂在此处，不经 page.tsx——西游这一屏本就是早返分流出来的一整屏，
   * `XiyouParley` 也是自己挂的，依同例。
   */
  const [reading, setReading] = useState<string | null>(null);
  /**
   * 翻开的那一段后世影音（点评席）。
   *
   * 取经路被后世重演过多少回——八六版、大话西游、大圣归来。路上的事自家
   * 有话说：悟空看「三打白骨精」那一折，该说什么？点之入点评席，与诸子
   * 看《孔子》是同一件事。
   */
  const [reviewing, setReviewing] = useState<string | null>(null);
  const here = xiyouRegionMap[stopId];
  const next = nextStop(stopId);
  /**
   * 路上走到了第几处。界外五处的 `order` 为 0，若拿它作比，十三处会一齐褪回未至——
   * 去天上看一眼不等于取经路白走了。故记住最后一次在路上的次第，图与路条同用此数。
   */
  const passed = useRef(1);
  if (!here.offRoute) passed.current = here.order;
  /**
   * 这一处的点名。居停者（home 在此者；四众随队行，不算居停）与入队里程碑（谁
   * 在此地入的队）——人都已站在图上各处的檐下（见 XiyouScene 的外缘环），卡上
   * 再点一遍名，看的人才知道那一处站着的是谁。名即是按钮，点之名册随之换人。
   */
  const residents = useMemo(
    () => xiyouPersonas.filter((p) => !XIYOU_PARTY.includes(p.id) && p.home === stopId),
    [stopId],
  );
  const milestone = useMemo(() => {
    const m = XIYOU_PARTY.find((id) => XIYOU_JOINS[id] === stopId);
    return m ? { id: m, note: m === "tangseng" ? "自此发端" : "于此入队" } : null;
  }, [stopId]);
  /**
   * 这一处的原著原话：按章回从 `xiyouPassages` 里配一句**当场在此的人**说的——
   * 换处即换话，演示一拍一句，像是这一处开口说了句话。配法看谁在场：四众
   * （此刻多半正在此地）、此地居停者皆可；**居停者优先**——此地是他的家，
   * 话由主人说才不喧宾夺主（南海配出菩萨劝行者那句，不是行者求告那句）。
   * 候选多条时取最短的——卡宽 300，原话长过两行就读不动了；「最短的」偏
   * 打趣的短语句，正合演示的节奏。
   */
  const quote = useMemo(() => {
    const residentIds = xiyouPersonas.filter((p) => p.home === stopId).map((p) => p.id);
    const of = (x: (typeof xiyouPassages)[number]) => (x.speaker ?? x.owner);
    const pool = xiyouPassages.filter(
      (x) => x.chapter === here.chapter.label && (residentIds.includes(of(x)) || XIYOU_PARTY.includes(of(x))),
    );
    if (!pool.length) return null;
    return (
      pool.find((x) => residentIds.includes(of(x))) ??
      pool.reduce((a, b) => (b.text.length < a.text.length ? b : a))
    );
  }, [here, stopId]);
  const quoteName = quote ? xiyouPersonaMap[quote.speaker ?? quote.owner]?.name : null;
  /**
   * 自动演示有两条，两枚开关常在题头：**取经路**每拍（4.5 秒）西行一处，从
   * 「行至何处」的那一处接着走（身在雷音或界外点之自长安重走），行至雷音自停
   * ——此行之的，到了就是到了，不循环；**界外前史**不问此刻身在何处，点之便
   * 自花果山那块石头演起，每拍沿前七回的次第一处（花果山 → 三星洞 → 凌霄 →
   * 兜率 → 南海，XIYOU_OFF_CHAIN），行至南海自停——求告既毕，接下来便是
   * 五行山下的五百年，不必演。悟空自己会走：Figure 本就从当前位置插值到
   * target，界外又只摆他一个，换处即起步，演示便是他一个人的路。次第路上由
   * `nextStop` 给、界外由链给；看图的人手动点到哪，下一拍就从哪接着走，
   * 换了界域便跟着那条界域的次第走。
   */
  const [demoMode, setDemoMode] = useState<"route" | "off" | null>(null);
  const demo = demoMode !== null;
  function startDemo(mode: "route" | "off") {
    // 再点同一枚即停；点另一枚即换场——两条各有各的次第，随时可换
    if (demoMode === mode) {
      setDemoMode(null);
      return;
    }
    // 前史不问此刻身在何处，点之便自花果山那块石头演起——前史自有源头，
    // 从中间某处开演便不是「蹦出来」了
    if (mode === "off") {
      setStopId("huaguo");
      setDemoMode("off");
      return;
    }
    if (!nextStop(stopId)) setStopId("dongtu");
    setDemoMode("route");
  }
  useEffect(() => {
    if (!demo) return;
    const t = setInterval(
      () =>
        setStopId((cur) => {
          const m = xiyouRegionMap[cur];
          if (m.offRoute) {
            const i = (XIYOU_OFF_CHAIN as readonly string[]).indexOf(cur);
            return i >= 0 && i + 1 < XIYOU_OFF_CHAIN.length ? XIYOU_OFF_CHAIN[i + 1] : cur;
          }
          const n = nextStop(cur);
          return n ? n.id : cur;
        }),
      4500,
    );
    return () => clearInterval(t);
  }, [demo]);
  useEffect(() => {
    if (!demo) return;
    // 到头即停：走到哪一条的头便停在哪一条的头上，不问是从哪一条起播的
    const m = xiyouRegionMap[stopId];
    if (m.offRoute ? stopId === "nanhai" : stopId === "leiyin") setDemoMode(null);
  }, [demo, stopId]);

  return (
    <div className={`kg-layer${demo ? " demo" : ""}`}>
      <div className="kg-top">
        <div>
          <div className="eyebrow">{t("西游")} · {here.offRoute ? t("界外") : t("取经路")} · {t(here.chapter.label)}</div>
          <h2>{t(here.name)}<small className="xy-sub">·{t(here.sub)}</small></h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="kg-back-btn" onClick={onClose}>← {t("回盘面")}</button>
        </div>
      </div>

      <div className="kg-body xy-body">
        <div className="xy-scene">
          <XiyouScene
            stopId={stopId}
            selectedId={personaId}
            passed={passed.current}
            demo={demo}
            onSelectStop={setStopId}
            onSelectPersona={setPersonaId}
          />
          {/* 此处卡：景与难原在边栏首节，现浮于图左上——看图的人眼不必离图去找文字，
              回目仍是一道门，点之翻《西游记》那一回。 */}
          <div className="xy-here-card">
            <div className="xy-here-head">
              <div className="kg-nd-sec">{t("此处")}</div>
              {/* 演示取经开关就搁在题头：演示时此处卡逐处翻，开关在翻动的字旁边，
                  手不必下到屏幕底下的路条去找。演示中给朱砂——盘面上唯一动着的红。 */}
              {/* 两枚开关常在：取经路与前史是两条各自的走法，看图的人不必先
                  走到那一界才演得那一条；演着这一条时点另一条即换场。 */}
              <span className="xy-demo-row">
                <button
                  className={`ghost-btn xy-demo${demoMode === "route" ? " on" : ""}`}
                  onClick={() => startDemo("route")}
                >
                  {demoMode === "route" ? t("演示中 · 停") : t("演示取经")}
                </button>
                <button
                  className={`ghost-btn xy-demo${demoMode === "off" ? " on" : ""}`}
                  onClick={() => startDemo("off")}
                >
                  {demoMode === "off" ? t("演示中 · 停") : t("演示前史")}
                </button>
              </span>
            </div>
            {/* 换处即翻页：key 换了整段重挂，淡上小半拍——演示一拍一翻，像在逐页读
                这卷书。题头（开关所在）不重挂，免得演示中按钮跟着闪。 */}
            <div className="xy-here-flip" key={stopId}>
              <button className="xy-chap" onClick={() => setReading(here.chapter.label)} title={t("读《西游记》{chapter}", { chapter: t(here.chapter.label) })}>
                <b>{t(here.chapter.label)}</b>
                <p>{t(here.chapter.title)}</p>
                {here.chapter.span && <small>{t(here.chapter.span)}</small>}
                <em>{t("读此回原文 →")}</em>
              </button>
              <p className="xy-mood">{t(here.mood)}</p>
              {/* 原著原话在景语之下：先见其景，再闻其声。说话人着色一点（各人的
                  名册色），话本身不引号不头衔——画上题字，署名在字后，别抢字。 */}
              {quote && quoteName && (
                <p className="xy-quote">
                  {quote.text}
                  {/* 原著原话照出不译（典籍原文永不替换），英文模式在其下附一行英译 */}
                  <Said text={quote.text} scholar={quoteName} />
                  <small>——{t(quoteName)}·{t(here.chapter.label)}</small>
                </p>
              )}
              {here.trial ? (
                <p className="xy-trial">{t(here.trial)}</p>
              ) : here.offRoute ? (
                <p className="xy-trial none">{t("此处不在取经路上——是行者一个人去过的地方。")}</p>
              ) : (
                <p className="xy-trial none">{t("此处无难——一在发端，一在终了。")}</p>
              )}
              {(residents.length > 0 || milestone) && (
                <p className="xy-here-who">
                  {residents.length > 0 && (
                    <>
                      {residents.map((p, i) => (
                        <span key={p.id}>
                          {i > 0 ? t("、") : ""}
                          <button className="xy-who" style={{ "--c": p.color } as CSSProperties} onClick={() => setPersonaId(p.id)}>
                            <i />{t(p.name)}
                          </button>
                        </span>
                      ))}
                      {t("在此。")}
                    </>
                  )}
                  {milestone && (
                    <>
                      {residents.length > 0 ? " " : ""}
                      <button
                        className="xy-who"
                        style={{ "--c": xiyouPersonaMap[milestone.id].color } as CSSProperties}
                        onClick={() => setPersonaId(milestone.id)}
                      >
                        <i />{t(xiyouPersonaMap[milestone.id].name)}
                      </button>
                      {t("{note}。", { note: t(milestone.note) })}
                    </>
                  )}
                </p>
              )}
              {/* 卡脚两件：难可以就地论一场——对口层的议题本就默认取此处之难，
                  只是此前没给过入口；右角盖一枚朱文印，一拍一印，像逐页钤印的
                  通关文牒。交手即停走：演示是替你看，你亲手开了口，就让路给你。 */}
              <div className="xy-here-foot">
                {here.trial && (
                  <button
                    className="ghost-btn xy-ask"
                    onClick={() => {
                      if (demo) setDemoMode(null);
                      // 居停者为甲乙（火焰山上便是牛魔王对铁扇）；无居停者不预派，
                      // 由名册当前选中的人与唐僧开局
                      setAskSeed(residents.length > 0 ? [residents[0].id, residents[1]?.id ?? "wukong"] : undefined);
                      setParley(true);
                    }}
                  >
                    {t("就这一难，论一场 →")}
                  </button>
                )}
                <span
                  className="xy-seal"
                  aria-hidden
                  style={{ "--rot": `${-2 - (here.order * 7) % 5}deg` } as CSSProperties}
                >
                  {t(here.name)}
                </span>
              </div>
            </div>
          </div>
          <div className="xy-route-bar">
            {xiyouRegions.map((r) => (
              <button
                key={r.id}
                className={`xy-dot${r.id === stopId ? " on" : ""}${r.order < passed.current || (here.offRoute && r.order === passed.current) ? " past" : ""}`}
                title={t("{order}. {name} · {chapter}", { order: r.order, name: t(r.name), chapter: t(r.chapter.label) })}
                onClick={() => setStopId(r.id)}
              >
                <span>{r.order}</span>
              </button>
            ))}
            {/* 界外五处不入这一串数——它们不在取经路上，故另起一截，以名不以序。
                这五处是悟空一个人的路：学道、称王、反天宫、受炼、求告，全书前七回都在这里。 */}
            <span className="xy-off-sep">{t("界外")}</span>
            {xiyouOffRegions.map((r) => (
              <button
                key={r.id}
                className={`xy-off-dot${r.id === stopId ? " on" : ""}`}
                title={t("{name} · {chapter}", { name: t(r.name), chapter: t(r.chapter.label) })}
                onClick={() => setStopId(r.id)}
              >
                {t(r.name)}
              </button>
            ))}
            {next && (
              <button className="ghost-btn xy-next" onClick={() => setStopId(next.id)}>
                {t("西行 →")} {t(next.name)}
              </button>
            )}
            {here.offRoute && (
              <>
                {/* 界外是行者的前史，自有次第：花果山称王 → 斜月学道 → 凌霄反天宫
                    → 兜率受炼 →（贬回后）圣地求告。身在界外时才浮现这一截——
                    它不是取经路的路条，不该常占路条的位置；「下一处」送人走完
                    前七回，与路条上的「西行」同一只手。链末（南海）无下一处，
                    便只剩一枚「前史」签——首版在链末取 CHAIN[i+1] 得 undefined，
                    整层崩掉（tsc 查不出越界下标，此坑只在运行时见）。 */}
                <span className="xy-off-sep">{t("前史")}</span>
                {(() => {
                  const i = (XIYOU_OFF_CHAIN as readonly string[]).indexOf(stopId);
                  const to = i >= 0 ? XIYOU_OFF_CHAIN[i + 1] : undefined;
                  if (!to) return null;
                  return (
                    <button
                      className="ghost-btn xy-next xy-off-next"
                      onClick={() => setStopId(to)}
                      title={t("{label} {title}", { label: t(xiyouRegionMap[to].chapter.label), title: t(xiyouRegionMap[to].chapter.title) })}
                    >
                      {t("前史 →")} {t(xiyouRegionMap[to].name)}
                    </button>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        <aside className="xy-side">
          {XMEDIA_ON && XY_CLIPS.length > 0 && (
            <section className="xy-sec">
              <div className="kg-nd-sec">{t("后世影音")}</div>
              <div className="xy-clips">
                {XY_CLIPS.map((c) => (
                  <button
                    key={c.id}
                    className="xy-clip"
                    onClick={() => setReviewing(c.id)}
                    title={c.gloss ? t("{text}——{gloss}", { text: t(c.text), gloss: t(c.gloss) }) : t(c.text)}
                  >
                    <b>《{t(c.work)}》</b>
                    <small>{t(c.kind)} · {c.owner ? t(xiyouPersonaMap[c.owner]?.name ?? "") : ""}</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="xy-sec">
            <div className="kg-nd-sec">{t("在此世界者")}</div>
            <div className="xy-roster">
              {xiyouPersonas.map((p) => (
                <button
                  key={p.id}
                  className={`xy-p${p.id === personaId ? " on" : ""}`}
                  style={{ borderLeftColor: p.color }}
                  onClick={() => setPersonaId(p.id)}
                >
                  <i style={{ background: p.color }}>{p.glyph}</i>
                  <b>{t(p.name)}</b>
                  <small>{t(p.school)}</small>
                </button>
              ))}
            </div>
            {/* 同世界之内才辩得起来——跨世界只能评议，那条路在母题层 */}
            <button className="ghost-btn xy-parley-btn" onClick={() => setParley(true)}>
              {t("令二人对口 · 对谈或争辩 →")}
            </button>
          </section>

          <TalkPane personaId={personaId} stopId={stopId} />
        </aside>
      </div>

      {parley && (
        <XiyouParley
          stopId={stopId}
          initial={personaId}
          castSeed={askSeed}
          onClose={() => {
            setParley(false);
            setAskSeed(undefined); // 名册下次开局不带上一局的甲乙
          }}
        />
      )}
      {reading && (
        <SikuLayer
          initialBookId={XIYOU_BOOK}
          initialChapterLabel={reading}
          backLabel="回取经路"
          onClose={() => setReading(null)}
        />
      )}
      {reviewing && (
        <ClipReviewLayer mediaId={reviewing} backLabel="回取经路" onClose={() => setReviewing(null)} />
      )}
    </div>
  );
}

/** 一卷里的一条话。id 供校验徽记按条回填——答话逐条落卷，凭数组次序会找错条。 */
type TalkMsg = {
  id: number;
  mine: boolean;
  text: string;
  verifying?: boolean;
  verdict?: Verdict;
  verdictNote?: string;
  /** 下判的模型 id 与是否异源外证（见 worker 的 QWEN_VERIFY_MODEL） */
  verdictModel?: string;
  verdictCross?: boolean;
};

/**
 * 与西游人物对谈。
 *
 * 刻意不复用战国的 `DialogueStage`：那一套的骨架是「客求教于诸子」——有奉贽、有好感、
 * 有记忆承接，皆是师弟之礼的形制。此处是路上搭话，形制该简。
 * 但底下走的是同一条路：`composeAnswerLLM` → `/api/chat`，worker 按 `kind === "figure"`
 * 换一套口吻（不引典、不标出处），故悟空答出来的不会是一个讲道理的学者。
 *
 * **一人一卷**：对话按人分存（`threads`），不是一条流水。换个人说话便换一卷，
 * 回头再找他，先前说过的还在。从前共用一条，不只是看着串——`history` 会把八戒说的话
 * 当作悟空自己说过的送进模型，答出来的便不是他了。
 *
 * 答话落卷亦挂一致性徽记，与诸子同例；只是审法不同（worker 的 figure 档）：
 * 悟空没有学说可违，但有性情可失——「说成一个讲道理的学者」即算矛盾。
 */
function TalkPane({ personaId, stopId }: { personaId: string; stopId: string }) {
  const t = useT();
  const p = xiyouPersonaMap[personaId];
  const here = xiyouRegionMap[stopId];
  const [threads, setThreads] = useState<Record<string, TalkMsg[]>>({});
  const [input, setInput] = useState("");
  /** 作答中的那一卷：带 id，故中途换人时不会把答话显到别人卷上 */
  const [live, setLive] = useState<{ id: string; text: string } | null>(null);
  /** 消息次第：校验徽记按 id 回填，不用数组下标 */
  const seq = useRef(0);
  const msgs = threads[personaId] ?? [];
  const liveHere = live?.id === personaId ? live.text : null;

  // 此人在原著里说过的话，列几条作引子——点一条即以之发问
  const lines = useMemo(
    () => xiyouPassages.filter((x) => (x.speaker ?? x.owner) === personaId).slice(0, 3),
    [personaId],
  );

  async function send(q: string) {
    if (!q.trim() || live !== null) return;
    // 问话时的对象记死：答话回来时用户可能已经点了别人，那一句仍该落回原卷
    const who = personaId;
    const push = (m: TalkMsg) =>
      setThreads((t) => ({ ...t, [who]: [...(t[who] ?? []), m] }));
    push({ id: seq.current++, mine: true, text: q });
    setInput("");
    setLive({ id: who, text: "" });
    try {
      // 处境拼进问句而非走 presence：presence 的 region 要过战国的 regionMap，此处无之。
      // 连回目一并带上——「此刻在白虎岭」与「此刻在第二十七回的白虎岭」是两件事，
      // 后者才定得住他说话的时点：贬书未下与既下，悟空的口气不同。
      const framed = `（此刻在${here.name}，${here.sub}；事在《西游记》${here.chapter.label}「${here.chapter.title}」。）${q}`;
      const ans = await composeAnswerLLM(who, framed, undefined, msgs.slice(-6), (d) =>
        setLive((t) => (t && t.id === who ? { id: who, text: t.text + d } : t)),
      );
      const said = ans.text.trim();
      const mid = seq.current++;
      push({ id: mid, mine: false, text: said, verifying: true });
      // 一致性校验：答话落卷即请审、不阻下一问，按消息 id 回填（与批注席同例，
      // 只是批注持久、对谈是这一程的状态，故直接改本卷消息）。
      const checked = await verifyAndRepairConsistency(who, said, framed, ans.citations);
      setThreads((t) => ({
        ...t,
        [who]: (t[who] ?? []).map((m) =>
          m.id === mid
            ? { ...m, text: checked?.text ?? said, verifying: false, verdict: checked?.verdict, verdictNote: checked?.note, verdictModel: checked?.model, verdictCross: checked?.crossModel }
            : m,
        ),
      }));
    } catch {
      push({ id: seq.current++, mine: false, text: "（未及应，稍后再问。）" });
    } finally {
      setLive(null);
    }
  }

  if (!p) return null;

  return (
    <section className="xy-sec">
      <div className="kg-nd-sec">{t("与{name}说话", { name: t(p.name) })}</div>
      <p className="xy-intro">{t(p.intro)}</p>

      <div className="xy-talk">
        {msgs.length === 0 && liveHere === null && (
          <div className="kg-annot-empty">{t("问一句试试。")}</div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`xy-msg${m.mine ? " mine" : ""}`}>
            {!m.mine && <i style={{ background: p.color }}>{p.glyph}</i>}
            <p>
              {m.text}
              {!m.mine && <Said text={m.text} scholar={p.name} />}
              {!m.mine && (m.verifying || m.verdict) && (
                <VerdictBadge verifying={m.verifying} verdict={m.verdict} note={m.verdictNote} kind="figure" verifier={m.verdictModel} crossModel={m.verdictCross} />
              )}
            </p>
          </div>
        ))}
        {liveHere !== null && (
          <div className="xy-msg">
            <i style={{ background: p.color }}>{p.glyph}</i>
            <p>{liveHere}<span className="cursor">▍</span></p>
          </div>
        )}
      </div>

      <div className="xy-seeds">
        {lines.map((l) => (
          <button key={l.id} className="ghost-btn xy-seed" onClick={() => send(`你曾说「${l.text}」，此话怎讲？`)}>
            {l.text.slice(0, 16)}…
          </button>
        ))}
      </div>

      <div className="kg-annot-row">
        <input
          className="found-input"
          value={input}
          maxLength={60}
          placeholder={t("问{name}一句……", { name: t(p.name) })}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
        />
        <button className="ghost-btn" disabled={!input.trim() || live !== null} onClick={() => send(input)}>
          {live !== null ? t("作答中…") : t("问")}
        </button>
      </div>
    </section>
  );
}
