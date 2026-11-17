"use client";

import { useState } from "react";
import { scholarMap } from "../world/characters";
import { REVIEW_AXES, kindOf } from "../world/worlds";
import { useVerseAnnotations } from "../world/annotations";
import { composeAnswerLLM, translateToVernacular, verifyAndRepairConsistency, type Verdict } from "../world/dialogue";
import VerdictBadge from "./VerdictBadge";
import { useLang, useT } from "../i18n/lang";
import Said from "../i18n/Said";
import TraceableEvidence from "./TraceableEvidence";
import { clipById, adaptationById, ownerOfAdaptation, type MediaKind } from "../world/adaptations";

/**
 * 后世影音点评（全屏界面）。
 *
 * 所对者有二：可检索之「片段」（MediaClip，一幕场景）与「演绎目录」
 * 一条（Adaptation，一部影片/剧集/纪录片）。从前只片段可点，目录条目
 * 列而不可入——于是补条目越多，死条目越多。如今二者同入此席：传
 * `mediaId` 即可，是片段还是目录由 id 自明，调用处不必分。
 *
 * 入口遍布各轴，backLabel 各自指回：典籍图谱节点详情、四库「影音」门与
 * 四库书页之书前影音栏、西游侧栏、世界文学书内影音栏与影音总门。
 *  - 上方呈其「幕」：片段带视频源则放映，否则以幕卡示之（场景概述／
 *    目录题注。项目不内置版权影视文件，用户自传影音另走 MediaUnderstand）。
 *  - 下方请主人公与其他人就此演绎流式点评、落库留存。席上不止诸子：
 *    西游诸人凭性情说，西方文哲以英文说——中译随即附于其下，与母题评议同一手法。
 *
 * 点评复用 zhuzi-annotations：片段 key＝clip:{id}，目录条目 key＝adap:{id}，
 * 两不相混；刷新仍在，零新存储。
 * 注：主人公未必在 scholarMap（如 wenwang 演周易，图谱有节点而无人格），
 *     此时无主人公点评席，仅邀他人。
 */
export default function ClipReviewLayer({
  mediaId,
  backLabel = "返回图谱",
  onClose,
}: {
  /** 片段（MediaClip）或演绎目录（Adaptation）之 id */
  mediaId: string;
  /** 返回钮所指——从哪里点进来的，便指回哪里 */
  backLabel?: string;
  onClose: () => void;
}) {
  const t = useT();
  const subject = subjectOf(mediaId);
  if (!subject) {
    return (
      <div className="kg-layer">
        <div className="kg-top">
          <div>
            <div className="eyebrow">{t("后世影音 · 点评")}</div>
            <h2>{t("未寻得此影音")}</h2>
          </div>
          <button className="kg-back-btn" onClick={onClose}>{t("‹ 返回")}</button>
        </div>
        <div className="kg-cr-empty">{t("该条影音已不存。")}</div>
      </div>
    );
  }
  return (
    <div className="kg-layer">
      <div className="kg-top">
        <div>
          <div className="eyebrow">{t("后世影音 · 点评")}</div>
          <h2>《{t(subject.work)}》· {t(subject.kind)}</h2>
        </div>
        {/* 回何处去的字样由唤它的那一层给，字样本身是中文，在此译 */}
        <button className="kg-back-btn" onClick={onClose}>← {t(backLabel)}</button>
      </div>
      <div className="kg-cr-body">
        <MediaStage s={subject} />
        <MediaReviewPanel s={subject} />
      </div>
    </div>
  );
}

/**
 * 点评之所对，片段与目录条目同归此形——点评席只认这一形，不必分两套。
 */
type Subject = {
  /** 批注 key：clip:{id} 或 adap:{id} */
  verseKey: string;
  work: string;
  kind: MediaKind;
  /** 主人公（人格 id），无则空串 */
  owner: string;
  /** 幕上正文：片段是场景概述，目录条目是其题注 */
  text: string;
  /** 幕上副题：片段是释文，目录条目是年与出品 */
  sub?: string;
  /**
   * 副题的零件。`sub` 是拼好的一句，既上屏也喂模型——喂模型的那一路须照旧是中文，
   * 故不动它，另存零件供上屏时逐节查表（与 CrossMediaLayer 的 subParts 同例）。
   */
  subParts?: { year: number; maker: string; gloss?: string };
  keywords: string[];
  sourceUrl?: string;
  /** 幕卡脚注。存的是中文模板而非成品句，换语言时整句改写（词表里有「后世演绎 · 《{title}》之一幕」一条） */
  foot: string;
  footVars?: Record<string, string>;
  /** 是一幕场景，还是一部作品——请人点评时措辞依此 */
  isClip: boolean;
};

/** 由 id 认取所对：先片段，后目录条目（两边 id 不相犯）。 */
function subjectOf(id: string): Subject | undefined {
  const c = clipById(id);
  if (c) {
    // 此幕有所出之片（adaptationId）者，席上仍是一幕，但把「哪一部片」补进来：
    // 并卡之后，年份与导演只存于目录条，若不在此复述，点幕进来反而比从前少了一层信息。
    const film = c.adaptationId ? adaptationById(c.adaptationId) : undefined;
    return {
      verseKey: `clip:${c.id}`,
      work: c.work,
      kind: c.kind,
      owner: c.owner,
      text: c.text,
      sub: film ? `${film.year} · ${film.maker} —— ${c.gloss}` : c.gloss,
      subParts: film ? { year: film.year, maker: film.maker, gloss: c.gloss } : undefined,
      keywords: c.keywords,
      sourceUrl: c.sourceUrl,
      foot: film ? "后世演绎 · 《{title}》之一幕" : "后世演绎 · 场景概述",
      footVars: film ? { title: film.title } : undefined,
      isClip: true,
    };
  }
  const a = adaptationById(id);
  if (!a) return undefined;
  return {
    verseKey: `adap:${a.id}`,
    work: a.title,
    kind: a.kind,
    owner: ownerOfAdaptation(a, (pid) => Boolean(scholarMap[pid])),
    text: a.note,
    sub: `${a.year} · ${a.maker}`,
    subParts: { year: a.year, maker: a.maker },
    keywords: [],
    foot: "后世演绎 · 目录一种",
    isClip: false,
  };
}

/** 其「幕」：有视频源则放映，无则以幕卡呈现。 */
function MediaStage({ s }: { s: Subject }) {
  const t = useT();
  return (
    <div className="kg-cr-stage-wrap">
      {s.sourceUrl ? (
        <video className="kg-cr-video" src={s.sourceUrl} controls playsInline />
      ) : (
        <div className="kg-cr-stage">
          <div className="kg-cr-stage-top">
            <span className="kg-media-kind" data-k={s.kind}>{t(s.kind)}</span>
            <span className="kg-cr-work">《{t(s.work)}》</span>
          </div>
          <div className="kg-cr-stage-mid">{t(s.text)}</div>
          {/* 副题逐节查表；中文模式下与上面拼好的 sub 逐字相同 */}
          {s.sub && <div className="kg-cr-stage-gloss">{
            s.subParts
              ? s.subParts.gloss
                ? t("{year} · {maker} —— {gloss}", { year: s.subParts.year, maker: t(s.subParts.maker), gloss: t(s.subParts.gloss) })
                : t("{year} · {maker}", { year: s.subParts.year, maker: t(s.subParts.maker) })
              : t(s.sub)
          }</div>}
          {/* 脚注里那个片名也是一条词条，先译片名再填模板 */}
          <div className="kg-cr-stage-note">{t(s.foot, s.footVars && { ...s.footVars, title: t(s.footVars.title) })}</div>
        </div>
      )}
      {s.keywords.length > 0 && (
        <div className="kg-cr-kw">
          {s.keywords.slice(0, 8).map((k) => (
            <span key={k} className="kg-cr-kw-chip">{t(k)}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 诸子点评：主人公 + 其他人，流式点评落库。
 * 主人公＝所对之主（若在 scholarMap）；其他人由客自邀。一次只请一位（流式），落库后入点评列表。
 */
function MediaReviewPanel({ s }: { s: Subject }) {
  const t = useT();
  const lang = useLang();
  const verseKey = s.verseKey;
  const [anns, api] = useVerseAnnotations(verseKey);
  const [draft, setDraft] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const [live, setLive] = useState<Record<string, string>>({});
  /** 西方一席答英文，中译另起一条流（与母题评议同一手法） */
  const [liveTrans, setLiveTrans] = useState<Record<string, string>>({});
  const [transing, setTransing] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** 校验中的点评 id →「校」；校毕落 patchVerdict 存进批注本体，徽记随点评持久 */
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  const doneCheck = (aid: string) =>
    setChecking((c) => {
      const n = { ...c };
      delete n[aid];
      return n;
    });

  const owner = scholarMap[s.owner]; // 主人公；未必在 scholarMap（如 wenwang）
  // 可邀者含各世界人格（先秦二十一子、西游八人）与西方文哲，不限于立论之家：
  // 一段《孔子》影片，悟空看了也有话说；一段《王子复仇记》，莎士比亚更有的说。
  // 西方不在世界注册表（不立世界），故另并 WEST_AXIS 一席。
  const others = REVIEW_AXES.flatMap((w) =>
    w.personas.filter((p) => p.id !== s.owner && !invited.includes(p.id)).map((p) => ({ world: w.name, s: p })),
  );

  function promptFor(scholarId: string): string {
    const isOwner = scholarId === s.owner;
    const p = scholarMap[scholarId];
    // 三种人三种开口方式（与母题评议同一分法）：立论者引典、叙事中人凭性情；
    // 西方文哲更进一步，连提示词都用英文——给中文便答中文，
    // 答出来的歌德是个译本里的歌德。
    const kind = p ? kindOf(p) : undefined;
    if (kind === "west") {
      return (
        `A later screen work is put before you: 《${s.work}》 (${s.kind}${s.isClip ? "" : `, ${s.sub ?? ""}`}). ` +
        (s.isClip
          ? `The scene, described in Chinese: 「${s.text}」` + (s.sub ? ` — ${s.sub}` : "")
          : `What it does, described in Chinese: 「${s.text}」`) +
        (isOwner ? " This retelling is drawn from your own story and your own work." : "") +
        " Comment on this retelling IN ENGLISH, in your own voice — praise or fault it as you see fit, " +
        "compare it with how you told the thing yourself, and cite 《Title · Part》 when you quote your own works."
      );
    }
    const figure = kind === "figure";
    return (
      (s.isClip
        ? `客呈后世影音一段——出处《${s.work}》（${s.kind}），所演：${s.text}。` + (s.sub ? s.sub + "。" : "")
        : `客呈后世演绎一种——《${s.work}》（${s.kind}${s.sub ? `，${s.sub}` : ""}），其事：${s.text}。`) +
      (isOwner ? "此一演绎正是演绎足下之事迹与学说。" : "") +
      (figure
        ? "请就此影音之演绎直说你的看法：可赞可驳，把理说透，举证取你自己经历过的事，不摆引经据典的架子。"
        : "请就此影音之演绎点评：可赞可驳、可援本家典籍为证，末了标《书·篇》出处。")
    );
  }

  async function ask(scholarId: string) {
    if (busyId) return;
    setBusyId(scholarId);
    setLive((p) => ({ ...p, [scholarId]: "" }));
    const isWest = scholarMap[scholarId] ? kindOf(scholarMap[scholarId]) === "west" : false;
    let aid: string | undefined;
    let said = "";
    let evidence: import("../world/canon").Retrieved[] = [];
    try {
      const ans = await composeAnswerLLM(scholarId, promptFor(scholarId), undefined, [], (d) =>
        setLive((p) => ({ ...p, [scholarId]: (p[scholarId] || "") + d })),
      );
      said = ans.text.trim();
      evidence = ans.citations;
      // 西方一席答的是英文，随即译一遍附在原话之下——译不出便只落原话，不拦着落库
      let trans: string | undefined;
      if (said && isWest && /[A-Za-z]{3}/.test(said)) {
        setTransing(scholarId);
        trans =
          (await translateToVernacular(said, scholarId, (d) =>
            setLiveTrans((p) => ({ ...p, [scholarId]: (p[scholarId] || "") + d })),
            undefined,
            "en",
          )) ?? undefined;
        setTransing(null);
        setLiveTrans((p) => { const n = { ...p }; delete n[scholarId]; return n; });
      }
      if (said) aid = api.add(verseKey, said, scholarId, trans, evidence); // 流完落库
      setLive((p) => { const n = { ...p }; delete n[scholarId]; return n; });
    } catch {
      setLive((p) => ({ ...p, [scholarId]: p[scholarId] || "（未及应，稍后再试。）" }));
    } finally {
      setBusyId(null);
    }
    // 一致性校验：落库即请审、不占点评席，徽记按点评 id 回填（与批注席同例）。
    // 所审之准随人格之属分档：悟空审性情、诸子审学说、西贤审学识（审的是英文原话，译本不校）。
    if (aid && said) {
      const id = aid;
      setChecking((c) => ({ ...c, [id]: true }));
      verifyAndRepairConsistency(scholarId, said, `后世影音《${s.work}》${s.isClip ? "片段" : "一种"}之点评`, evidence).then((out) => {
        if (out) api.patchVerdict(id, out.verdict, out.note, { model: out.model, crossModel: out.crossModel, text: out.text, clearTrans: out.repaired, citations: out.citations ?? evidence });
        doneCheck(id);
      });
    }
  }

  return (
    <div className="kg-cr-panel">
      <div className="kg-nd-sec">{t("点评席")}</div>

      <div className="kg-annot-list">
        {anns.length === 0 ? (
          <div className="kg-annot-empty">{t("尚无点评。可请主人公，亦可邀诸世界之人就此影音点评。")}</div>
        ) : (
          anns.map((a) => {
            const sc = a.scholar ? scholarMap[a.scholar] : undefined;
            // 徽记只挂人格之点评（客自注不校），校验中或已有判定时显示
            const showBadge = sc && (checking[a.id] || a.verdict);
            return (
              <div key={a.id} className={`kg-annot-item${a.scholar ? "" : " ke"}`}>
                <i style={{ background: sc?.color ?? "#5a3a7a" }}>{sc ? sc.glyph : "客"}</i>
                <div>
                  <p>
                    {a.text}
                    {showBadge && (
                      <VerdictBadge
                        verifying={checking[a.id]}
                        verdict={a.verdict as Verdict | undefined}
                        note={a.verdictNote}
                        kind={sc ? kindOf(sc) : undefined}
                        verifier={a.verdictModel}
                        crossModel={a.verdictCross}
                      />
                    )}
                  </p>
                  {/* 西方一席：英文原话在上，中译附其下，与母题评议同一手法。
                      英文模式下这条中译是多余的（原话本就是英文），收起不出。 */}
                  {a.trans && lang === "zh" && <p className="mo-trans">{a.trans}</p>}
                  {/* 中国这边点评的是中文，英文模式下附一行英译；西方一席原话已是英文，不再译 */}
                  {!a.trans && <Said text={a.text} scholar={sc?.name} />}
                  {a.scholar && <TraceableEvidence citations={a.citations ?? []} inferred />}
                </div>
                <button className="ghost-btn" onClick={() => api.remove(a.id)}>{t("删")}</button>
              </div>
            );
          })
        )}
      </div>

      {/* 诸位点评席：主人公居首，其后所邀他人 */}
      <div className="kg-cr-seats">
        {owner && (
          <ScholarSeat
            scholarId={s.owner}
            ownerTag
            busy={busyId === s.owner}
            live={live[s.owner]}
            liveTrans={liveTrans[s.owner]}
            transing={transing === s.owner}
            onAsk={() => ask(s.owner)}
          />
        )}
        {invited.filter((id) => scholarMap[id]).map((id) => (
          <ScholarSeat
            key={id}
            scholarId={id}
            busy={busyId === id}
            live={live[id]}
            liveTrans={liveTrans[id]}
            transing={transing === id}
            onAsk={() => ask(id)}
            onDismiss={() => setInvited((p) => p.filter((x) => x !== id))}
          />
        ))}
      </div>

      {/* 邀请他人：诸世界之人并西方文哲 */}
      {others.length > 0 && (
        <div className="kg-annot-row">
          <select className="found-input" value="" onChange={(e) => { if (e.target.value) setInvited((p) => [...p, e.target.value]); }}>
            <option value="">{t("再邀一位点评……")}</option>
            {REVIEW_AXES.map((w) => {
              const inWorld = others.filter((o) => o.world === w.name);
              return inWorld.length === 0 ? null : (
                <optgroup key={w.id} label={t(w.name)}>
                  {inWorld.map(({ s: p }) => (
                    <option key={p.id} value={p.id}>{t(p.name)}·{t(p.school)}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
      )}

      {!owner && (
        <div className="kg-cr-owner-absent">
          {t("{what}主人公未入人格卷，无本家点评席；可邀诸世界之人就此影音点评。", { what: s.isClip ? t("此片段") : t("此一演绎") })}
        </div>
      )}

      <div className="kg-nd-sec">{t("客注")}</div>
      <div className="kg-annot-row">
        <input className="found-input" value={draft} maxLength={80} placeholder={t("注一句己见……")} onChange={(e) => setDraft(e.target.value)} />
        <button className="ghost-btn" disabled={!draft.trim()} onClick={() => { if (draft.trim()) { api.add(verseKey, draft); setDraft(""); } }}>{t("存注")}</button>
      </div>
    </div>
  );
}

function ScholarSeat({
  scholarId,
  ownerTag,
  live,
  liveTrans,
  transing,
  busy,
  onAsk,
  onDismiss,
}: {
  scholarId: string;
  ownerTag?: boolean;
  live?: string;
  /** 西方一席的中译流（译中才有值） */
  liveTrans?: string;
  transing?: boolean;
  busy: boolean;
  onAsk: () => void;
  onDismiss?: () => void;
}) {
  const t = useT();
  const sc = scholarMap[scholarId];
  if (!sc) return null;
  return (
    <div className="kg-cr-seat" style={{ borderLeftColor: sc.color }}>
      <div className="kg-cr-seat-head">
        <i style={{ background: sc.color }}>{sc.glyph}</i>
        <div className="kg-cr-seat-name">
          <b>{t(sc.name)}</b>
          <small>·{t(sc.school)}</small>
          {ownerTag && <span className="kg-cr-owner-tag">{t("主人公")}</span>}
        </div>
        <div className="kg-cr-seat-act">
          {!ownerTag && onDismiss && (
            <button className="ghost-btn" onClick={onDismiss} title={t("请退")}>×</button>
          )}
          <button className="ghost-btn" disabled={busy} onClick={onAsk}>
            {busy ? t("点评中…") : t("请点评")}
          </button>
        </div>
      </div>
      {live !== undefined && (
        <>
          <p className="kg-cr-live">
            {live}
            {busy && !transing && <span className="cursor">▍</span>}
          </p>
          {transing && (
            <p className="mo-trans">
              {liveTrans || t("译中…")}
              <span className="cursor">▍</span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
