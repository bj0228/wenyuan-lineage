"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MOTIFS, motifMap, worldsOf, type Motif, type MotifAnchor } from "../world/motifs";
import { resolveAnchors, suggestAnchors } from "../world/canonSource";
import { REVIEW_AXES, worldMap, allPersonaMap, kindOf, worldOf, type WorldId } from "../world/worlds";
import type { Persona } from "../world/characters";
import type { Passage } from "../world/canon";
import { useVerseAnnotations } from "../world/annotations";
import { useKeMotifs, asMotif } from "../world/keMotifs";
import { composeAnswerLLM, translateToVernacular, verifyAndRepairConsistency, type Verdict } from "../world/dialogue";
import VerdictBadge from "./VerdictBadge";
import { useLang, useT } from "../i18n/lang";
import Said from "../i18n/Said";
import TraceableEvidence from "./TraceableEvidence";

/**
 * 母题 · 跨世界评议（全屏）。
 *
 * 这一层解决的是一个具体的不可能：孔子与孙悟空没法辩论。辩论要有共同论题，
 * 而悟空不持一家之说——他甚至不在论证。强把两人摆上辩席，只会逼模型替悟空
 * 代拟一套他从未说过的道理。
 *
 * 母题是绕过这个不可能的那条路：不问「你怎么看兼爱」，而问「你怎么看**出走**
 * 这件事」。出走是处境不是命题，孔子周游列国撞上过，悟空渡海求道也撞上过，
 * 各人凭各人的来路说，便可并置而观。故此处是**评议**（各出各的解）而非
 * **辩论**（往复相驳）——两者的分别写在 worlds.ts 的注释里。
 *
 * 版面依「并置」二字立：
 *  - 总目作签牌十二枚，题名竖写在签上，签旁一枚会标——三轴各引一线交于一点，
 *    这一画即是母题的定义（诸世界撞上同一处境）。
 *  - 入一母题则**三轴并列成栏**，一轴一栏，各栏自上而下是：轴名、其世界的锚点
 *    原文、其世界之人的评议。先前是左列锚点右列评议席，看着像「材料 + 工具」；
 *    改成并栏之后，同一处境的三种解法左右对读，谁与谁不同一眼看得出——
 *    这正是母题层存在的理由，版面该把它说出来。
 *
 * 总目之末另留一枚空签：**客可自立一题**（见 keMotifs.ts）。策展的十二枚是
 * 「三轴皆有话可说」才立的，故枚枚有锚点；客自立的题没有锚点，也不强配——
 * 你想出的处境未必在哪部书里有现成的一句，但请谁来谁就开一栏，照样评得。
 *
 * 评语仍落 `annotations`（key＝`motif:{motifId}`），零新存储，刷新仍在。
 */
/**
 * 议题的题名：双语并出。
 *
 * 母题是这一层的题目本身，不是一枚按钮上的字——英文模式下若把「天命与僭越」整个
 * 换成 "Mandate and usurpation"，中文读者与英文读者便不是在同一个题下说话了；
 * 故中文原题照出，英译随行其侧（签上另起一列，顶栏缀其后）。
 *
 * `t(zh) === zh` 便只出一行：中文模式恒如此（取词是恒等函数，故中文版渲染结果
 * 与从前逐字节相同，连多出来的那层 span 也不会有）；客自立之题不在词表里，
 * 亦走这一路——客自己写的题名没有第二种语文，不该把同一句话印两遍。
 */
function Bilingual({ zh, slip }: { zh: string; slip?: boolean }) {
  const t = useT();
  const en = t(zh);
  if (en === zh) return slip ? <b>{zh}</b> : <>{zh}</>;
  if (slip) {
    return (
      <span className="mo-slip-t">
        <b>{zh}</b>
        <em lang="en">{en}</em>
      </span>
    );
  }
  return (
    <>
      {zh}
      <small className="mo-h-en" lang="en">{en}</small>
    </>
  );
}

export default function MotifLayer({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [motifId, setMotifId] = useState<string | null>(null);
  const [mine] = useKeMotifs();
  const motif = motifId
    ? motifMap[motifId] ?? (() => { const k = mine.find((m) => m.id === motifId); return k ? asMotif(k) : null; })()
    : null;
  const isKe = !!motifId && !motifMap[motifId];

  return (
    <div className="kg-layer mo-layer">
      <div className="kg-top">
        <div>
          <h2>
            {motif ? <Bilingual zh={motif.name} /> : t("跨世界评议")}
            {isKe && <span className="mo-ke-tag">{t("客自立")}</span>}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {motif && <button className="kg-back-btn" onClick={() => setMotifId(null)}>{t("← 返回母题")}</button>}
          <button className="kg-back-btn" onClick={onClose}>{t("← 返回")}</button>
        </div>
      </div>

      <div className="kg-body mo-body">
        {!motif ? <MotifIndex onPick={setMotifId} /> : <MotifStage key={motif.id} motif={motif} isKe={isKe} />}
      </div>
    </div>
  );
}

/** 序号竖写用的汉数：十二以内够用。 */
function han(n: number): string {
  const d = "〇一二三四五六七八九";
  if (n < 10) return d[n];
  if (n === 10) return "十";
  return `十${d[n - 10]}`;
}

/**
 * 母题总目：十二枚签，每签列明三轴各由谁出场。
 *
 * 签上不只标「涉及哪几个世界」，还点名——「出走」这一枚写着孔子、悟空、歌德，
 * 不点开就知道这一处境是谁与谁对看。总目之为总目，正在于此；只标轴名则十二张
 * 签面面相同，看不出分别。名字由锚点的说话人解出（`resolveAnchors` 是同步的）。
 */
function MotifIndex({ onPick }: { onPick: (id: string) => void }) {
  const t = useT();
  const [mine, keApi] = useKeMotifs();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const rows = useMemo(
    () =>
      MOTIFS.map((m) => {
        const byWorld = new Map<WorldId, string[]>();
        for (const { anchor, passage } of resolveAnchors(m.anchors)) {
          const who = allPersonaMap[passage.speaker ?? passage.owner]?.name;
          if (!who) continue;
          const list = byWorld.get(anchor.worldId) ?? [];
          if (!list.includes(who)) list.push(who);
          byWorld.set(anchor.worldId, list);
        }
        // 解不出名字的轴也要列出来（锚点在、人不在名册），故以 worldsOf 为准铺行
        return { motif: m, lines: worldsOf(m).map((w) => ({ w, who: byWorld.get(w) ?? [] })) };
      }),
    [],
  );

  function commit() {
    // 签面只写题名：十二枚策展签的描述已尽去，客自立之题自然也不另写一句
    if (!name.trim()) return;
    const k = keApi.add(name, "");
    setName(""); setAdding(false);
    onPick(k.id); // 立了就进去，不必再点一次
  }

  return (
    <>
      <p className="mo-preface">
        {t("同一世界之内辩命题，跨世界之间只评议母题——查看不同时代与国家之间的人物的不同看法。")}
        <i>{t("现有母题拥有各世界的原文为锚；卷末一枚空签，客可自立一题。")}</i>
      </p>
      <div className="mo-grid">
        {rows.map(({ motif: m, lines }, i) => (
          <button key={m.id} className="mo-card" onClick={() => onPick(m.id)}>
            {/* 签头：题名竖写，上压一枚朱砂序号印，如签筒里抽出的那一支。
                英文模式下题名左侧另起一列小字英译（见 Bilingual）。 */}
            <span className="mo-slip">
              <i className="mo-slip-no">{han(i + 1)}</i>
              <Bilingual zh={m.name} slip />
            </span>
            <span className="mo-face">
              <span className="mo-who">
                {lines.map(({ w, who }) => (
                  <span key={w} className="mo-who-row">
                    <i className={`mo-wtag w-${w}`}>{t(worldMap[w]?.name ?? w)}</i>
                    <em>{who.length ? who.map((n) => t(n)).join(t("、")) : "——"}</em>
                  </span>
                ))}
              </span>
              <span className="mo-worlds">
                <span style={{ marginLeft: 0 }}>{t("锚点：{n}", { n: m.anchors.length })}</span>
              </span>
            </span>
          </button>
        ))}

        {/* 客自立之题：无锚点，请谁来谁就开一栏。印作「客」字以别于策展十二枚。 */}
        {mine.map((k) => (
          <button key={k.id} className="mo-card ke" onClick={() => onPick(k.id)}>
            <span className="mo-slip">
              <i className="mo-slip-no ke">客</i>
              <b>{k.name}</b>
            </span>
            <span className="mo-face">
              <span className="mo-worlds">
                <span style={{ marginLeft: 0 }}>{t("客自立 · 未系锚")}</span>
                <a
                  className="mo-del"
                  role="button"
                  tabIndex={0}
                  title={t("撤此题")}
                  onClick={(e) => { e.stopPropagation(); keApi.remove(k.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); keApi.remove(k.id); } }}
                >
                  {t("撤")}
                </a>
              </span>
            </span>
          </button>
        ))}

        {/* 空签一枚：客自立一题。笔画全用虚线，一眼看出这枚尚未写字。 */}
        {adding ? (
          <div className="mo-card new on">
            <span className="mo-slip"><i className="mo-slip-no ke">客</i></span>
            <span className="mo-face">
              <input
                className="found-input"
                autoFocus
                maxLength={12}
                placeholder={t("题名，如「乡愁」「背叛」")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commit()}
              />
              <span className="mo-new-act">
                <button className="ghost-btn" onClick={() => { setAdding(false); setName(""); }}>{t("取消")}</button>
                <button className="ghost-btn" disabled={!name.trim()} onClick={commit}>{t("立此题")}</button>
              </span>
            </span>
          </div>
        ) : (
          <button className="mo-card new" onClick={() => setAdding(true)}>
            <span className="mo-slip"><i className="mo-slip-no ke">客</i></span>
            <span className="mo-face">
              <b className="mo-new-t">{t("＋ 自立一题")}</b>
            </span>
          </button>
        )}
      </div>
    </>
  );
}

type Col = { w: WorldId; anchors: { anchor: MotifAnchor; passage: Passage }[] };

/**
 * 母题之内：三轴并列成栏。
 *
 * 一轴一栏，栏内自上而下是轴名、锚点原文、这一轴之人的评议；栏与栏之间只一道
 * 淡褐纸缝（与罗盘海图那张纸同一手法），不加框不上底色，像一页三栏的对照本。
 * 客注与「再邀一位」横在卷尾，跨三栏——那两件事本不属任何一轴。
 */
function MotifStage({ motif, isKe }: { motif: Motif; isKe?: boolean }) {
  const t = useT();
  const resolved = useMemo(() => resolveAnchors(motif.anchors), [motif]);
  const missing = motif.anchors.length - resolved.length;
  const ws = useMemo(() => worldsOf(motif), [motif]);

  /**
   * 客题落锚：卷首一按，每轴各检一条（见 canonSource 的 `suggestAnchors`）。
   * 只客题用得上——策展的十二枚锚点是手挑的，不该被一次检索顶掉。
   * 检不到的轴不补，故检得一条两条都是常态；一条也无才报下面那句。
   */
  const [, keApi] = useKeMotifs();
  const [anchoring, setAnchoring] = useState(false);
  /** 诸轴皆未检得：如实说一句，不默默什么也不发生 */
  const [anchorMiss, setAnchorMiss] = useState(false);

  async function dropAnchors() {
    setAnchoring(true);
    setAnchorMiss(false);
    try {
      const got = await suggestAnchors(motif.name, motif.hint);
      keApi.setAnchors(motif.id, got);
      setAnchorMiss(got.length === 0);
    } finally {
      setAnchoring(false);
    }
  }

  const verseKey = `motif:${motif.id}`;
  const [anns, api] = useVerseAnnotations(verseKey);
  const [draft, setDraft] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const [live, setLive] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  // 译中：西方一席答完英文后随即译为中文，译文流式回填在原话之下
  const [transing, setTransing] = useState<string | null>(null);
  const [liveTrans, setLiveTrans] = useState<Record<string, string>>({});
  /** 校验中的评议 id →「校」；判定校毕落 patchVerdict 存进评议本体，徽记随评议持久 */
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  /**
   * 在席者只有客邀来的人：锚点的说话人（「当事人」）不再自动入席评议——
   * 他那句话已经摆在锚点上了，再让他就同一处境说一遍，等于自己注自己。
   */
  const seated = invited;

  // 可邀者遍三轴：两个世界 ＋ 世界文学。西方七位不在 `WORLDS` 里（他们无地无日程，
  // 见 worlds.ts 的 WEST_AXIS），故须在此显式并上——否则评议席永远只请得到中国人。
  const AXES = useMemo(() => REVIEW_AXES, []);
  const invitable = useMemo(
    () => AXES.flatMap((w) => w.personas).filter((p) => !seated.includes(p.id)),
    [AXES, seated],
  );

  /**
   * 栏次：以母题的轴为准，另把「邀来之人所属的轴」并进来——
   * 请了一位本母题没有锚点的世界之人，他总得有个落座之处，不然说完的话无处可放。
   */
  const cols: Col[] = useMemo(() => {
    const order: WorldId[] = [...ws];
    const add = (id: string) => {
      const p = allPersonaMap[id];
      if (!p) return;
      const w = worldOf(p);
      if (!order.includes(w)) order.push(w);
    };
    invited.forEach(add);
    anns.forEach((a) => a.scholar && add(a.scholar));
    return order.map((w) => ({ w, anchors: resolved.filter((r) => r.anchor.worldId === w) }));
  }, [ws, invited, anns, resolved]);

  /** 评议提示：并置各世界锚点，再按评者之属要求其以自己的来路作答。 */
  function promptFor(personaId: string): string {
    const me = allPersonaMap[personaId];
    const myWorld = me ? worldOf(me) : "zhanguo";
    const mine = resolved.filter((r) => (r.passage.speaker ?? r.passage.owner) === personaId);
    const others = resolved.filter((r) => (r.passage.speaker ?? r.passage.owner) !== personaId);

    // 三种人三种开口方式。这一分支是必须的：不分则悟空被写成讲道理的学者。
    // 西方一席更进一步，连提示词都用英文——他们本不是用这套语言想事情的人，
    // 给中文提示词便答中文，答出来的歌德是个译本里的歌德。
    const kind = kindOf(me as Persona);
    if (kind === "west") return promptForWest(personaId, mine, others);

    const lines = others
      .map((r) => {
        const sp = allPersonaMap[r.passage.speaker ?? r.passage.owner];
        const w = worldMap[r.anchor.worldId];
        const far = r.anchor.worldId !== myWorld;
        // 跨世界者不以姓名相称——孔子不识孙悟空，须以世代相指。
        // 西方那一轴的 era 是「荷马至近代」，「荷马至近代有莎士比亚者」不成句，
        // 故另以「西土之书」相指：先秦人认不得西洋姓名，但认得「远方有书如此说」。
        const who = !far
          ? (sp?.name ?? "某")
          : r.anchor.worldId === "west"
            ? `西土有书曰《${r.passage.book}》，其中`
            : `${w?.era ?? "后世"}有${sp?.name ?? "人"}者`;
        return `${who}曰：「${r.passage.text}」`;
      })
      .join("\n");

    const head =
      `客举一母题曰「${motif.name}」${motif.hint ? `——${motif.hint}` : ""}\n` +
      (mine.length ? `足下于此事曾言：「${mine[0].passage.text}」\n` : "") +
      (lines ? `他处之人于同一处境则如此说：\n${lines}\n` : "") +
      // 客自立之题没有锚点：不先说明，模型会去硬找一句「原文」来对，反而失真
      (resolved.length === 0 ? "此题非出于书，乃客自举的一个处境，诸书并无现成之句可对。足下不必强寻典据，就这处境本身说即可。\n" : "") +
      // 客题的锚点是按题意检来的（见 canonSource 的 suggestAnchors），不是古人为此题
      // 而发。不说明，模型会把一句碰巧语涉此事的话当作先贤对此题的定论去接，答出来
      // 的便是替古人硬认一个他没表过的态。
      (isKe && resolved.length
        ? "以上诸句是客立此题后就题意检来的参照，古人并非为此题而发。足下只当作他处之人碰巧说过的话看，不必认作定论。\n"
        : "");

    const tail =
      kind === "figure"
        ? "请足下就此母题说说自家的看法。不必讲道理，也不必援引典籍——以你自己的性情与经历说话即可，话该像你平日说的那样。他人之言可认可驳，但不必与之辩，各说各的便是。"
        : "请足下就此母题评议：本于自家学说立论，可援本家典籍为证，末了标《书·篇》出处。他处之人既不同世，不必与之争胜，各明其理即可。";

    return head + tail;
  }

  /**
   * 西方一席的评议提示：全英文。自家那句给 `en`（西文原句），
   * 他人之言是中文原典，故注明是译文。
   */
  function promptForWest(
    personaId: string,
    mine: { passage: Passage }[],
    others: { anchor: MotifAnchor; passage: Passage }[],
  ): string {
    const lines = others
      .map((r) => {
        const sp = allPersonaMap[r.passage.speaker ?? r.passage.owner];
        const w = worldMap[r.anchor.worldId];
        return `— ${sp?.name ?? "someone"} (${w?.name ?? ""}, ${w?.era ?? ""}): 「${r.passage.text}」`;
      })
      .join("\n");

    return (
      `A motif is put to you: 「${motif.name}」${motif.hint ? ` — ${motif.hint}` : ""}\n` +
      (mine.length
        ? `You once wrote of this: 「${mine[0].passage.en ?? mine[0].passage.text}」\n`
        : "") +
      (lines
        ? `Others, in other worlds, have met the same predicament and said (quoted in Chinese, their own tongue):\n${lines}\n`
        : "") +
      (resolved.length === 0
        ? "This motif comes from no book — it is a predicament the visitor has named. Do not hunt for a text to match it; speak to the thing itself.\n"
        : "") +
      // 与中文那一支同理：检来的锚点若不说明来历，模型会把它当作先贤对此题的定论
      (isKe && resolved.length
        ? "Note: these passages were retrieved to match a motif the visitor has just named; their authors did not write them about this motif. Read them as things others happened to say, not as settled positions on the question.\n"
        : "") +
      "Give your own answer to this motif, IN ENGLISH, in your own voice — argue from your own thought and your own works, " +
      "and you may quote yourself or your characters, citing 《Title · Part》 at the end. " +
      "These others belong to another world and another age; there is nothing to win against them — simply set your answer beside theirs."
    );
  }

  async function ask(personaId: string) {
    if (busyId) return;
    setBusyId(personaId);
    setLive((p) => ({ ...p, [personaId]: "" }));
    try {
      const ans = await composeAnswerLLM(personaId, promptFor(personaId), undefined, [], (d) =>
        setLive((p) => ({ ...p, [personaId]: (p[personaId] || "") + d })),
      );
      const text = ans.text.trim();
      // 西方一席答的是英文，随即译一遍附在原话之下——译不出便只落原话，不拦着落库
      let trans: string | undefined;
      if (text && kindOf(allPersonaMap[personaId] as Persona) === "west" && /[A-Za-z]{3}/.test(text)) {
        setTransing(personaId);
        trans =
          (await translateToVernacular(text, personaId, (d) =>
            setLiveTrans((p) => ({ ...p, [personaId]: (p[personaId] || "") + d })),
            undefined,
            "en",
          )) ?? undefined;
        setTransing(null);
        setLiveTrans((p) => { const n = { ...p }; delete n[personaId]; return n; });
      }
      const aid = text ? api.add(verseKey, text, personaId, trans, ans.citations) : undefined; // 流完落库，刷新仍在
      setLive((p) => { const n = { ...p }; delete n[personaId]; return n; });
      // 一致性校验：落库即请审，徽记按评议 id 回填、判定随评议持久。三种人三种
      // 审法（worker 三档）——孔子审学说、悟空审性情、西贤审学识；西方一席所审
      // 的是英文原话，译本不校。
      if (aid) {
        const id = aid;
        setChecking((c) => ({ ...c, [id]: true }));
        const topic = `母题「${motif.name}」${motif.hint ? `——${motif.hint}` : ""}`;
        verifyAndRepairConsistency(personaId, text, topic, ans.citations).then((out) => {
          if (out) api.patchVerdict(id, out.verdict, out.note, { model: out.model, crossModel: out.crossModel, text: out.text, clearTrans: out.repaired, citations: out.citations ?? ans.citations });
          setChecking((c) => { const n = { ...c }; delete n[id]; return n; });
        });
      }
    } catch {
      setLive((p) => ({ ...p, [personaId]: p[personaId] || t("（未及应，稍后再试。）") }));
    } finally {
      setBusyId(null);
    }
  }

  const keNotes = anns.filter((a) => !a.scholar);
  const said = (id: string) => anns.filter((a) => a.scholar === id);
  const total = anns.filter((a) => a.scholar).length;

  /**
   * 入题即评：在席之人不必再请一次。
   *
   * 点进一母题，本就是要看诸世界各出其解——还要逐席点一回「请评议」，等于把这事
   * 又推回给客。故进来便自动开口：一位一位地来（一次只一路流式），说过的不再问，
   * 后邀的人入席亦自动接上。`asked` 用 ref 记，败了也不重试，免得转成死循环。
   */
  const asked = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (busyId) return;
    const next = seated.find(
      (id) => !asked.current.has(id) && anns.every((a) => a.scholar !== id),
    );
    if (!next) return;
    asked.current.add(next);
    void ask(next);
    // ask/anns 每次渲染都新：以在席与忙闲为准即可，多跑一轮也只是再找一次下一位
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seated, busyId, anns.length]);

  return (
    <div className="mo-stage">
      <div className="mo-brief">
        <span className="mo-brief-n">
          {isKe
            ? t("客自立之题 · {state}", { state: resolved.length ? t("{n} 锚（检得）", { n: resolved.length }) : t("无锚") })
            : t("{n} 轴并观 · {m} 锚", { n: cols.length, m: resolved.length })}
          {" "}{t("· 已评 {n} 则", { n: total })}
        </span>
      </div>

      {/* 客题落锚：策展的十二枚锚点手挑在先，不设此钮——一次检索不该顶掉策展。 */}
      {isKe && (
        <div className="mo-anchor-act">
          <button className="ghost-btn" disabled={anchoring} onClick={dropAnchors}>
            {anchoring ? t("检索中…") : resolved.length ? t("另检一遍") : t("参考锚点 · 每轴各检一条")}
          </button>
          {resolved.length > 0 && (
            <button className="ghost-btn" onClick={() => { keApi.setAnchors(motif.id, []); setAnchorMiss(false); }}>
              {t("撤锚")}
            </button>
          )}
          <small>
            {/* 「检不到的轴宁可空着」要明说：不说，少了一栏会被当成坏了；
                说了，空栏就是这个检索老实交代它在这一轴上无所得。 */}
            {resolved.length
              ? t("检得 {n} 条，是就题意检来的候选，非古人原为此题而发；不合意可撤。", { n: resolved.length })
              : t("每轴各检一条最合的原文作参照。检不到的轴宁可空着，不拿不相干的句子凑数。")}
          </small>
        </div>
      )}
      {anchorMiss && (
        <p className="mo-warn">{t("诸轴皆未检得合意之句——此题的字面在诸书里无着落。可改个题名再试，或就这么无锚评议。")}</p>
      )}
      {missing > 0 && (
        <p className="mo-warn">{t("有 {n} 处锚点未检得——语料重抽后原句或已换，可改策展记录的片段。", { n: missing })}</p>
      )}

      {cols.length === 0 && (
        <p className="mo-empty">
          {t("这题是你自己立的，还没有句子对上。可按上面「参考锚点」让各轴各检一条原文作参照，")}
          {t("也可径到页尾「再邀一位」请人来评——请了谁，就开出谁那一轴的一栏。")}
        </p>
      )}

      {/* 栏宽随栏数：只一两栏时不摊满整幅，免得一席横成一长条 */}
      <div
        className="mo-cols"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, cols.length)}, minmax(0, 1fr))`,
          maxWidth: cols.length > 0 && cols.length <= 2 ? cols.length * 470 : undefined,
        }}
      >
        {cols.map((c) => {
          const here = seated.filter((id) => allPersonaMap[id] && worldOf(allPersonaMap[id]) === c.w);
          return (
            <section key={c.w} className={`mo-col w-col-${c.w}`}>
              <header className="mo-col-head">
                <i className={`mo-wtag w-${c.w}`}>{t(worldMap[c.w]?.name ?? c.w)}</i>
                <small>{t(worldMap[c.w]?.era ?? "")}</small>
              </header>

              {c.anchors.length === 0 ? (
                <p className="mo-col-none">{t("此轴无锚点，所请之人凭自家处境作答。")}</p>
              ) : (
                c.anchors.map(({ passage }) => (
                  <AnchorCard key={passage.id} passage={passage} />
                ))
              )}

              <div className="mo-col-rule"><span>{t("评议")}</span></div>

              {here.map((id) => (
                <PersonaSeat
                  key={id}
                  personaId={id}
                  busy={busyId === id}
                  live={live[id]}
                  transing={transing === id}
                  liveTrans={liveTrans[id]}
                  said={said(id)}
                  checking={checking}
                  onAsk={() => ask(id)}
                  onDrop={(aid) => api.remove(aid)}
                  onDismiss={() => setInvited((p) => p.filter((x) => x !== id))}
                />
              ))}
              {here.length === 0 && <p className="mo-col-none">{t("此轴尚无人在席——自卷尾「再邀一位」请人来评。")}</p>}
            </section>
          );
        })}
      </div>

      {/* 卷尾：邀人与客注横跨三栏——此二事不属任何一轴 */}
      <div className="mo-foot">
        {invitable.length > 0 && (
          <div className="mo-foot-cell">
            <b>{t("再邀一位")}</b>
            <select
              className="found-input"
              value=""
              onChange={(e) => { if (e.target.value) setInvited((p) => [...p, e.target.value]); }}
            >
              <option value="">{t("自诸世界请一位评议……")}</option>
              {AXES.map((w) => {
                const list = invitable.filter((p) => worldOf(p) === w.id);
                if (list.length === 0) return null;
                return (
                  <optgroup key={w.id} label={`${t(w.name)}·${t(w.era)}`}>
                    {list.map((p) => (
                      <option key={p.id} value={p.id}>{t(p.name)}·{t(p.school)}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        )}
        <div className="mo-foot-cell">
          <b>{t("客注")}</b>
          <div className="kg-annot-row">
            <input
              className="found-input"
              value={draft}
              maxLength={80}
              placeholder={t("注一句己见……")}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="ghost-btn" disabled={!draft.trim()} onClick={() => { if (draft.trim()) { api.add(verseKey, draft); setDraft(""); } }}>
              {t("存注")}
            </button>
          </div>
          {keNotes.length > 0 && (
            <ul className="mo-ke-list">
              {keNotes.map((a) => (
                <li key={a.id}>
                  <i>客</i>
                  <p>{a.text}</p>
                  <button className="ghost-btn" onClick={() => api.remove(a.id)}>{t("删")}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AnchorCard({ passage }: { passage: Passage }) {
  const t = useT();
  const sp = passage.speaker ?? passage.owner;
  const p = allPersonaMap[sp];
  const west = passage.worldId === "west";
  return (
    <article className="mo-anchor">
      <header>
        {p && <i style={{ background: p.color }}>{p.glyph}</i>}
        <b>{t(p?.name ?? "佚名")}</b>
        <small>《{t(passage.book)}·{t(passage.locus ?? passage.chapter)}》</small>
      </header>
      {/* 西方那一轴以西文原句为正文，`text` 退作其下的译文；诗行照原样断行 */}
      {west && passage.en ? (
        <>
          <blockquote className="en">{passage.en}</blockquote>
          <p className="mo-trans">{passage.text}</p>
        </>
      ) : (
        <blockquote>{passage.text}</blockquote>
      )}
      {west && !passage.en && <p className="mo-noen">{t("此条系中文译述者自己的话，无西文原文")}</p>}
      {/* 今译只对文言出；西方那一轴的 gloss 是一句评语，此处不出 */}
      {passage.gloss && !west && <p className="mo-gloss">{passage.gloss}</p>}
    </article>
  );
}

/**
 * 一席。席与其评语同在一栏之内，说完的话就落在自己名下——
 * 这样三轴的回答左右对读，不必在一张长列表里按头像认人。
 */
function PersonaSeat({
  personaId,
  live,
  busy,
  transing,
  liveTrans,
  said,
  checking,
  onAsk,
  onDrop,
  onDismiss,
}: {
  personaId: string;
  live?: string;
  busy: boolean;
  /** 正在译：英文已流完，中译在流 */
  transing?: boolean;
  liveTrans?: string;
  said: { id: string; text: string; trans?: string; citations?: import("../world/canon").Retrieved[]; verdict?: "合规" | "存疑" | "矛盾"; verdictNote?: string; verdictModel?: string; verdictCross?: boolean }[];
  /** 校验中的评议 id：显「校」字，校毕换徽记 */
  checking: Record<string, boolean>;
  onAsk: () => void;
  onDrop: (annId: string) => void;
  onDismiss?: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const p = allPersonaMap[personaId];
  if (!p) return null;
  // 未开口也未在说：这一席正排在队里等着，不必示人以按钮
  const waiting = !busy && live === undefined && said.length === 0;
  return (
    <div className="mo-seat" style={{ borderLeftColor: p.color }}>
      <div className="mo-seat-head">
        <i style={{ background: p.color }}>{p.glyph}</i>
        <div className="mo-seat-name">
          <b>{t(p.name)}</b>
          <small>·{t(p.school)}</small>
        </div>
        <div className="mo-seat-act">
          {onDismiss && <button className="ghost-btn" onClick={onDismiss} title={t("请退")}>×</button>}
          {waiting ? (
            <small className="mo-wait">{t("候评…")}</small>
          ) : (
            <button className="ghost-btn" disabled={busy} onClick={onAsk}>
              {busy ? t("评议中…") : said.length ? t("再评一则") : t("请评议")}
            </button>
          )}
        </div>
      </div>

      {said.map((a) => (
        <div key={a.id} className="mo-say">
          <p>
            {a.text}
            {(checking[a.id] || a.verdict) && (
              <VerdictBadge
                verifying={checking[a.id]}
                verdict={a.verdict as Verdict | undefined}
                note={a.verdictNote}
                kind={kindOf(p)}
                verifier={a.verdictModel}
                crossModel={a.verdictCross}
              />
            )}
          </p>
          {/* 西方一席：英文原话在上，中译附其下，与锚点那边同一手法。
              英文模式下这条中译是多余的（原话本就是英文），收起不出。 */}
          {a.trans && lang === "zh" && <p className="mo-trans">{a.trans}</p>}
          {/* 中国这边答的是中文，英文模式下附一行英译；西方一席原话已是英文，不再译 */}
          {!a.trans && <Said text={a.text} scholar={personaId} />}
          <TraceableEvidence citations={a.citations ?? []} inferred />
          <button className="ghost-btn mo-say-x" onClick={() => onDrop(a.id)} title={t("删去此则")}>{t("删")}</button>
        </div>
      ))}

      {live !== undefined && (
        <div className="mo-say live">
          <p>
            {live}
            {busy && !transing && <span className="cursor">▍</span>}
          </p>
          {transing && (
            <p className="mo-trans">
              {liveTrans || t("译中…")}
              <span className="cursor">▍</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
