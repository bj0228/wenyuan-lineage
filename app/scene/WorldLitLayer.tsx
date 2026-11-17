"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadCatalog,
  loadMeta,
  loadChapter,
  chapterKey,
  snippetAnchor,
  snippetKeys,
  type WorldLitEntry,
  type WorldLitMeta,
  type WorldLitChapter,
} from "../world/worldlit";
import { useAnnotations } from "../world/annotations";
import { translateToVernacular } from "../world/dialogue";
import { translateChapter } from "../world/chapterTranslation";
import { AnnotPanel } from "./AnnotPanel";
import ClipReviewLayer from "./ClipReviewLayer";
import { useT } from "../i18n/lang";
import { XMEDIA_ON } from "../world/feature-flags";
import AdapRow from "./AdapRow";
import { scholarMap } from "../world/characters";
import { clipsOfLit, adaptationsOfLit, mergeMedia } from "../world/adaptations";
import type { WlAsk } from "./TourLayer";

/**
 * 世界文学典籍页（全屏）—— 海图八港之书的阅读面，西方排印风。
 *
 * 与四库那层的分别，不在功能在气质：四库是线装书，这里是一册西文旧书——衬线
 * 字体、双细线框、章首大写首字母（drop cap）、章目居左而正文居中的书页式排布。
 * 纸色偏羊皮，与海图同源。中英两卷一面切换：名译之中译与公版之原书并陈，
 * 机翻之卷在卷首注明 AI 译出未经校订，不冒名顶替。剧本卷另有中英同页的对照面
 * ——章目既按场切齐（哈姆雷特二十场、浮士德二十八景），便学洛布丛书的老排法，
 * 左中右英两页并摊，窄栏台本恰好把右半张羊皮纸让给另一门语言。
 *
 * 不带书来则先见架面总目（海图右下的书架涡卷即此门）：架上之书点之即读。
 *
 * 批注与四库同法：正文拖选一句，右栏落批；批注走 zhuzi-annotations 同一本账，
 * 英文卷里选句可请白话（对中文读者，英文正需要这一手）。批注面板与四库同源
 * （AnnotPanel）：诸子批西书、西贤批西书，同一面板——庄子批一句《堂吉诃德》，
 * 与塞万提斯自家来批，各是一种读法。
 *
 * 西方一路的后世影音挂在书内（章目之末「后世影音」栏，按 litId 取）：书读到哪里，
 * 影音跟到哪本书，点片段入点评席。书架上不另立影音总门——要横着看全轴的影音，
 * 另有「跨媒介点评」一层总摄，此处不再设一道与它重复的门。
 */
export default function WorldLitLayer({
  onClose,
  initialBookId,
  initialLang,
  initialChapter,
  initialHitText,
  backLabel = "返回海图",
  wlAsk,
}: {
  onClose: () => void;
  /** 自海图进来时直落该书 */
  initialBookId?: string;
  /** 带上语言面（zh/en/both），不带则默认中文卷 */
  initialLang?: "zh" | "en" | "both";
  /** 并直落该章（自历史大事件层点一条记事进来时给） */
  initialChapter?: number;
  /**
   * 并在正文里标出这一句原话（自历史大事件点一条进来时给）。
   * 一章动辄数千字，不标一下，跳过去只是开了一章书，看不出点的是哪一句。
   */
  initialHitText?: string;
  /** 返回键的字样——自何处来便说回何处去 */
  backLabel?: string;
  /**
   * 新手导览递进来的意图（开哪部书／摊哪一面）。
   *
   * 摊哪一面归 BookReader 自己的 `lang`，故另开 `wantLang` 一路递进去，
   * 与四库 `wantLabel`/`wantN` 同例。按 `n` 认新帖，同一个帖子重渲不重放。
   */
  wlAsk?: WlAsk;
}) {
  const t = useT();
  const [catalog, setCatalog] = useState<WorldLitEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [entry, setEntry] = useState<WorldLitEntry | null>(null);
  /** 书内影音栏点开的那段——点评席自成一屏，backLabel 指回这本书 */
  const [clipId, setClipId] = useState<string | null>(null);
  /** 导览请切的卷面；交给 BookReader（它自己管 lang），递一次便清空 */
  const [wantLang, setWantLang] = useState<"zh" | "en" | "both" | undefined>(undefined);

  const lang0 = initialLang ?? "zh";

  useEffect(() => {
    let live = true;
    loadCatalog().then(
      (c) => {
        if (!live) return;
        setCatalog(c);
        if (initialBookId) {
          const e = c.find((b) => b.id === initialBookId);
          if (e) setEntry(e);
          else setErr("书架上没有「{id}」这一部。");
        } else {
          // 不带书来即书架。写成整句而非只在 initialBookId 里分支，是给导览留一手：
          // 「重看西方」会把这一层连 key 一起重挂，此处须能把先前翻开的书收回去。
          setEntry(null);
          setErr(null);
        }
      },
      () => live && setErr("目录未载入——public/worldlit/ 尚未生成或未随构建上传。"),
    );
    return () => {
      live = false;
    };
  }, [initialBookId]);

  // 导览递来的意图：开哪部书在本层办，摊哪一面递进 BookReader
  const askRef = useRef(0);
  useEffect(() => {
    if (!wlAsk || wlAsk.n === askRef.current) return;
    askRef.current = wlAsk.n;
    if (wlAsk.kind === "shelf") {
      setEntry(null);
      return;
    }
    if (wlAsk.kind === "lang") {
      setWantLang(wlAsk.lang);
      return;
    }
    if (catalog) {
      const e = catalog.find((b) => b.id === wlAsk.bookId);
      if (e) {
        setEntry(e);
        // 一帖自足：倒着回来时上一相可能摊着对照面，开书这一帖须一并把面复位
        if (wlAsk.lang) setWantLang(wlAsk.lang);
      }
    }
  }, [wlAsk, catalog]);

  return (
    <div className="kg-layer wl-layer">
      <div className="kg-top">
        <div>
          <div className="eyebrow">{t("典籍 · 世界文学 · 与四库并立")}</div>
          <h2>
            {entry ? t(entry.name) : t("世界文学书架")}
            {!entry && catalog && (
              <small style={{ fontSize: 12, color: "#8a7d62", marginLeft: 10, letterSpacing: ".06em" }}>
                {t("{n} 部 · 中英两卷", { n: catalog.length })}
              </small>
            )}
          </h2>
        </div>
        {/* 回何处去的字样由唤它的那一层给，字样本身是中文，在此译 */}
        <button className="kg-back-btn" onClick={onClose}>← {t(backLabel)}</button>
      </div>

      <div className="kg-body" style={{ overflow: "auto", padding: "14px 26px 26px" }}>
        {err && <p className="intro">{t(err, { id: initialBookId ?? "" })}</p>}
        {!catalog && !err && <p className="intro">{t("目录载入中……")}</p>}
        {catalog && !entry && (
          <div className="sk-grid">
            {catalog.map((b) => (
              <button key={b.id} className="sk-book on wl-book" onClick={() => setEntry(b)}>
                <b>{t(b.name)}</b>
                <small>{[b.origin, b.author, b.era].filter(Boolean).map((x) => t(x!)).join(" · ")}</small>
                <i>
                  {b.editions.map((ed) => t("{vol}{n}章", { vol: ed.lang === "zh" ? (ed.partial ? "历史中译节选" : t("中译")) : t("英文"), n: ed.chapters })).join(" · ")}
                </i>
              </button>
            ))}
          </div>
        )}

        {entry && (
          <BookReader
            entry={entry}
            lang0={lang0}
            wantLang={wantLang}
            onWantLangDone={() => setWantLang(undefined)}
            chapter0={initialChapter}
            hitText={initialHitText}
            onShelf={!initialBookId ? () => setEntry(null) : undefined}
            onOpenClip={setClipId}
          />
        )}
      </div>

      {clipId && (
        <ClipReviewLayer
          mediaId={clipId}
          backLabel={entry ? "回此书" : "回书架"}
          onClose={() => setClipId(null)}
        />
      )}
    </div>
  );
}

/** 卷面：中译、原书之外，剧本卷添「对照」——中英同页并读 */
type LangSel = "zh" | "en" | "both";

/** 段以空行为界；剧本卷段内的单换行是诗行/台词行，交 CSS（pre-line）保留为行。
 *  散文卷不然：译文把对白另起一行（「他对众神说道：」之下那一行），从前当段内换行
 *  排，便只有它不缩进，一面之内有的缩有的不缩；故散文卷单换行也断作一段，
 *  缩进遂齐。分片时散文的硬换行已在切片脚本里并回，不会「一行十来个词」。 */
const parasOf = (c: WorldLitChapter | undefined, play = false) =>
  (c?.content ?? "")
    .replace(/\r\n?/g, "\n")
    .split(play ? /\n{2,}/ : /\n+/)
    .filter((p) => p.trim());

/**
 * 书内：左章目、中正文、右边批——与四库同局的西式排版。
 * 中英两卷由目录 editions 定；剧本卷（章目 1:1 切齐者）另给对照面：
 * 左中右英两栏并摊，各自窄栏台本，一页滚动两栏同进退。
 */
function BookReader({
  entry,
  lang0,
  wantLang,
  onWantLangDone,
  chapter0,
  hitText,
  onShelf,
  onOpenClip,
}: {
  entry: WorldLitEntry;
  lang0: "zh" | "en" | "both";
  /** 导览请切的卷面；切过即回 `onWantLangDone` 销帖 */
  wantLang?: "zh" | "en" | "both";
  onWantLangDone?: () => void;
  /** 直落某章（自历史大事件层点一条记事进来时给）。不给则从第一章起。 */
  chapter0?: number;
  /** 要在正文里标出的那一句原话（见本层 `initialHitText`） */
  hitText?: string;
  /** 自架面进书者给这一手：回架再挑，不必退出层来 */
  onShelf?: () => void;
  /** 点开书内影音栏的一条（片段或目录条目），入点评席 */
  onOpenClip?: (mediaId: string) => void;
}) {
  const t = useT();
  const [lang, setLang] = useState<LangSel>(lang0);
  const [picked, setPicked] = useState(false); // 读者亲手换过卷面，便不再替他选对照
  const [meta, setMeta] = useState<WorldLitMeta | null>(null);
  /** 英文卷的元信息：章目自带英文卷题，摊原书面时目录该用它
   *  （中译卷的卷题是中文，挂在英文正文上下不接榫） */
  const [metaEn, setMetaEn] = useState<WorldLitMeta | null>(null);
  const [n, setN] = useState(1);
  const [chs, setChs] = useState<Partial<Record<"zh" | "en", WorldLitChapter>>>({});
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiView, setAiView] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState("");
  const [aiError, setAiError] = useState("");
  const aiRequest = useRef(0);
  const [err, setErr] = useState<string | null>(null);
  const [snippets, setSnippets] = useState<{ chapKey: string; anchor: string; text: string }[]>([]);
  const [focus, setFocus] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);

  const volZh = entry.editions.find((e) => e.lang === "zh");
  const volEn = entry.editions.find((e) => e.lang === "en");
  const metaVol = volZh ?? volEn ?? entry.editions[0];

  useEffect(() => {
    if (!metaVol) return;
    let live = true;
    setMeta(null);
    setMetaEn(null);
    setChs({});
    setN(chapter0 && chapter0 >= 1 ? chapter0 : 1);
    loadMeta(metaVol.id).then(
      (m) => live && setMeta(m),
      () => live && setErr("此卷分片未取到。"),
    );
    // 英文卷另有元信息者（即中译卷在前作主目录时）一并取来，备原书面用
    if (volEn && volEn.id !== metaVol.id)
      loadMeta(volEn.id).then(
        (m) => live && setMetaEn(m),
        () => {}, // 取不到便退回主目录，不扰阅读
      );
    return () => {
      live = false;
    };
  }, [metaVol, volEn, chapter0]);

  // 剧本卷且中英章目对齐，默认请读者看对照面
  const play = meta?.layout === "play";
  const canDuo = Boolean(play && volZh && volEn && volZh.chapters === volEn.chapters);
  useEffect(() => {
    if (!picked && canDuo) setLang("both");
  }, [picked, canDuo]);

  // 导览请切的卷面：比读者亲手那一下更优先，故一并记作 picked，
  // 免得上面那条「默认看对照面」回头把导览切的那一面又盖掉。
  // 须等元信息到、知道能摊哪几面再切，否则切到「对照」会被 effLang 落回一面。
  useEffect(() => {
    if (!wantLang || !meta) return;
    if (wantLang === "both" && !canDuo) {
      onWantLangDone?.();
      return;
    }
    setLang(wantLang);
    setPicked(true);
    onWantLangDone?.();
  }, [wantLang, meta, canDuo, onWantLangDone]);

  // 实际要摊哪几面：所求一面若无卷（如堂吉诃德暂只有英文），落回另一面
  const effLang: LangSel =
    lang === "both" && volZh && volEn
      ? "both"
      : lang === "en" && volEn
        ? "en"
        : lang === "zh" && volZh
          ? "zh"
          : volEn
            ? "en"
            : "zh";
  const activeMeta = effLang === "en" ? (metaEn ?? meta) : meta;

  // 带着一句原话进来时，正文也要滚到那一句上——标了朱却在三屏之下，等于没标。
  useEffect(() => {
    if (!hitText || !(chs.zh || chs.en)) return;
    bodyRef.current?.querySelector("[data-hit]")?.scrollIntoView({ block: "center" });
  }, [hitText, chs]);

  useEffect(() => {
    if (!meta) return;
    const vols: { l: "zh" | "en"; id: string }[] =
      effLang === "both" && volZh && volEn
        ? [
            { l: "zh", id: volZh.id },
            { l: "en", id: volEn.id },
          ]
        : effLang === "en" && volEn
          ? [{ l: "en", id: volEn.id }]
          : volZh
            ? [{ l: "zh", id: volZh.id }]
            : [];
    if (!vols.length) return;
    let live = true;
    setLoading(true);
    setChs({});
    Promise.all(vols.map((v) => loadChapter(v.id, n).then((c) => [v.l, c] as const))).then(
      (got) => {
        if (live) {
          setChs(Object.fromEntries(got) as Partial<Record<"zh" | "en", WorldLitChapter>>);
          setLoading(false);
        }
      },
      () => {
        if (live) {
          setErr("此章未取到。");
          setLoading(false);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [meta, effLang, n, volZh, volEn]);

  useEffect(() => {
    aiRequest.current++;
    setAiText("");
    setAiView(false);
    setAiLoading(false);
    setAiError("");
    setAiProgress("");
  }, [entry.id, n]);

  async function showAiTranslation() {
    const english = chs.en;
    if (!english || !volEn || aiLoading) return;
    const request = ++aiRequest.current;
    setAiView(true);
    setAiLoading(true);
    setAiError("");
    try {
      await translateChapter(volEn.id, n, english.content, `${entry.name} · ${english.name}`,
        (done, total, content) => {
          if (request !== aiRequest.current) return;
          setAiText(content);
          setAiProgress(`${done}/${total}`);
        });
    } catch {
      if (request === aiRequest.current) setAiError("翻译失败，请稍后重试。");
    } finally {
      if (request === aiRequest.current) setAiLoading(false);
    }
  }

  if (err) return <p className="intro">{t(err)}</p>;
  if (!volZh && !volEn) return <p className="intro">{t("此书暂无可读之卷。")}</p>;
  if (!meta) return <p className="intro">{t("书卷载入中……")}</p>;

  const ch = chs.zh ?? chs.en ?? null;
  const keyZh = volZh ? chapterKey(volZh.id, n) : "";
  const keyEn = volEn ? chapterKey(volEn.id, n) : "";
  const source = ch ? `《${meta.name ?? entry.name}·${ch.name.replace(/\s+/g, " ").trim()}》` : "";
  const duo = effLang === "both";
  /** 书内影音：一部片只出一行——片段以 adaptationId 指回其片者并入那一行（见 mergeMedia） */
  const media = mergeMedia(adaptationsOfLit(entry.id), clipsOfLit(entry.id));

  /** 一面正文：首段落 drop cap、不施朱标；余段按锚点标朱 */
  const pane = (paras: string[], paneLang: "zh" | "en", markKey: string) => {
    const marks = snippets.filter((s) => s.chapKey === markKey);
    return paras.map((p, i) => {
      // 首段也可能正是那一句的所在：标朱压过下沉首字，不然读者看不见自己点的那一句
      if (i === 0 && !(hitText && findHitSpan(p, hitText))) {
        // 下沉的该是首字，不是首字之前那枚引号——卷题提作 title 之后，
        // 第十、十一、十二卷的正文都自「“我们……」起，沉一枚大引号便不成话。
        const lead = (p.match(/^[^\p{L}\p{N}]*/u) ?? [""])[0];
        return (
          <p key={i} className={paneLang === "en" ? "wl-para-en" : undefined}>
            {lead}
            <span className="wl-dropcap">{p.slice(lead.length, lead.length + 1)}</span>
            {p.slice(lead.length + 1)}
          </p>
        );
      }
      return (
        <p key={i} className={paneLang === "en" ? "wl-para-en" : undefined}>
          {markSnippets(p, marks, setFocus, t("看此句的边批"), hitText)}
        </p>
      );
    });
  };

  return (
    <div className={`sk-reader wl-reader${play ? " wl-play" : ""}`}>
      <div className="sk-toc wl-toc">
        {onShelf && (
          <button className="wl-shelf-back" onClick={onShelf}>{t("← 书架")}</button>
        )}
        <div className="sk-toc-head">
          {t(entry.author)}
          <br />
          {t(entry.origin)} · {t(entry.era)} ·{" "}
          {effLang === "both" ? t("中英对照") : effLang === "zh" ? (volZh?.partial ? "历史中译节选" : t("中译卷")) : t("英文原书卷")}
        </div>
        {/* 中英两面的切换：剧本卷章目对齐者多一「对照」面 */}
        <div className="wl-lang">
          {(["zh", "en"] as const).map((l) => {
            const ed = entry.editions.find((e) => e.lang === l);
            if (!ed) return null;
            return (
              <button
                key={l}
                className={`wl-lang-btn${!duo && effLang === l ? " on" : ""}`}
                onClick={() => {
                  setPicked(true);
                  setLang(l);
                  setAiView(false);
                  if (n > ed.chapters) setN(1);
                }}
              >
                {l === "zh" ? (ed.partial ? "历史中译节选" : t("中译")) : t("原书")}
              </button>
            );
          })}
          {canDuo && (
            <button
              className={`wl-lang-btn${duo ? " on" : ""}`}
              onClick={() => {
                setPicked(true);
                setLang("both");
              }}
            >
              {t("对照")}
            </button>
          )}
          {volEn && (!volZh || volZh.partial) && effLang === "en" && (
            <button className={`wl-lang-btn${aiView ? " on" : ""}`} onClick={showAiTranslation} disabled={loading || aiLoading || !chs.en}>
              {aiLoading ? `整章译中文 ${aiProgress}` : aiView ? "重新载入译文" : "整章译中文"}
            </button>
          )}
        </div>
        {aiView && <p className="wl-note">AI译本，未经人工校订。译文按需生成并保存在此浏览器中；请对照英文原文阅读。</p>}
        {activeMeta?.note && <p className="wl-note">{activeMeta.note}</p>}
        {activeMeta?.source && (
          <p className="wl-note">
            {t("文本来源")}：<a href={activeMeta.source.url} target="_blank" rel="noreferrer">{activeMeta.source.platform}</a>
            {activeMeta.source.ebookId ? ` #${activeMeta.source.ebookId}` : ""}
            {activeMeta.source.licenseUrl && (
              <> · <a href={activeMeta.source.licenseUrl} target="_blank" rel="noreferrer">{t("许可说明")}</a></>
            )}
          </p>
        )}
        {/* 摊原书面时列英文卷自己的章目（卷题是英文的），别面仍用主目录 */}
        {(effLang === "en" && metaEn ? metaEn : meta).chapters.map((c) => (
          <button
            key={c.n}
            className={`sk-toc-item${c.n === n ? " on" : ""}`}
            onClick={() => setN(c.n)}
          >
            <span>{t(c.name)}</span>
            {/* 卷题另起一行小字：奥德赛这等「第一卷」之外还自带题解者，
                目录上只见卷次便认不出是哪一段故事 */}
            {c.title && <em className="wl-toc-sub">{t(c.title)}</em>}
          </button>
        ))}

        {/* 后世影音：西方一路的演绎各挂其书——片段与目录条目皆可点入点评席，
            书的作者与诸世界之人皆可请来评。目录备一代之演绎，列于片段之后。
            一部片只出一行：片段以 adaptationId 指回其片者，并入那一行（行下附幕），
            不再片、幕各出一条——《王子复仇记》《茶花女》这等从前在此栏重出两回。 */}
        {XMEDIA_ON && (media.rows.length > 0 || media.loose.length > 0) && (
          <div className="wl-media">
            <div className="wl-media-head">{t("后世影音")}</div>
            {media.loose.map((c) => (
              <button
                key={c.id}
                className="wl-clip"
                onClick={() => onOpenClip?.(c.id)}
                title={`${c.text}${c.gloss ? `——${c.gloss}` : ""}`}
              >
                <b>《{t(c.work)}》</b>
                <small>{[c.kind, scholarMap[c.owner]?.name].filter(Boolean).map((x) => t(x!)).join(" · ")}</small>
              </button>
            ))}
            {media.rows.length > 0 && (
              <div className="wl-adap">
                {media.rows.map(({ ad, scene }) => (
                  <AdapRow
                    key={ad.id}
                    a={ad}
                    scene={scene}
                    className="wl-adap-row"
                    onOpen={(id) => onOpenClip?.(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {aiView && (!volZh || volZh.partial) ? (
        <div className="wl-duo" ref={bodyRef}>
          {ch && <h3 className="wl-ch-head">{ch.name}{ch.title && <small>{ch.title}</small>}</h3>}
          <div className="wl-duo-cols">
            <div className="sk-text wl-text" data-wl-lang="ai">
              {aiLoading && <p className="intro">正在译中文 {aiProgress}……</p>}
              {aiError && <p className="intro">{aiError}</p>}
              {pane(aiText.split(/\n+/).filter(Boolean), "zh", "")}
            </div>
            <div className="sk-text wl-text" lang="en" data-wl-lang="en">
              {pane(parasOf(chs.en, play), "en", keyEn)}
            </div>
          </div>
        </div>
      ) : duo ? (
        <div className="wl-duo" ref={bodyRef}>
          {ch && <h3 className="wl-ch-head">
                {ch.name}
                {ch.title && <small>{ch.title}</small>}
              </h3>}
          {loading && <p className="intro">{t("正文载入中……")}</p>}
          <div className="wl-duo-cols">
            <div className="sk-text wl-text" data-wl-lang="zh">
              {pane(parasOf(chs.zh, play), "zh", keyZh)}
            </div>
            <div className="sk-text wl-text" lang="en" data-wl-lang="en">
              {pane(parasOf(chs.en, play), "en", keyEn)}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="sk-text wl-text"
          lang={effLang === "en" ? "en" : undefined}
          data-wl-lang={effLang}
          ref={bodyRef}
        >
          {loading && <p className="intro">{t("正文载入中……")}</p>}
          {ch && (
            <>
              <h3 className="wl-ch-head">
                {ch.name}
                {ch.title && <small>{ch.title}</small>}
              </h3>
              {pane(parasOf(ch, play), effLang === "en" ? "en" : "zh", effLang === "en" ? keyEn : keyZh)}
            </>
          )}
        </div>
      )}

      {ch && (
        <Marginalia
          key={duo ? `${keyZh}&${keyEn}` : effLang === "en" ? keyEn : keyZh}
          bodyRef={bodyRef}
          chapters={duo ? [{ key: keyZh, lang: "zh" }, { key: keyEn, lang: "en" }] : [{ key: effLang === "en" ? keyEn : keyZh, lang: effLang === "en" ? "en" : "zh" }]}
          source={source}
          classical={volZh?.classical ?? false}
          onSnippetsChange={setSnippets}
          focusAnchor={focus}
        />
      )}
    </div>
  );
}

/**
 * 边批——与四库的 SikuMarginalia 同法，两处不同：
 *   - 英文卷里「译白话」那颗钮最常用（英文正需要译），中译卷里则退居其次；
 *   - 键前缀是 wl:，与四库的 siku: 不混账。
 * 剧本对照卷里一次挂两面（chapters 两项）：选句落哪一面的锚，卡片就归哪一面。
 */
function Marginalia({
  bodyRef,
  chapters,
  source,
  classical,
  onSnippetsChange,
  focusAnchor,
}: {
  bodyRef: React.RefObject<HTMLDivElement | null>;
  /** 正在摊开的卷面（对照卷两项、单卷一项） */
  chapters: { key: string; lang: "zh" | "en" }[];
  source: string;
  /** 此书的中译是文言（林纾、严复、早年鲁迅）：中文卡也亮「译为白话」，
   *  白话译本（朱生豪、AI）不需要——译了也是白译 */
  classical: boolean;
  onSnippetsChange: (snips: { chapKey: string; anchor: string; text: string }[]) => void;
  focusAnchor?: string | null;
}) {
  const t = useT();
  const [all, api] = useAnnotations();
  // 迁旧账：此层读者自批原落 `#批` 键（草稿箱时代），今并入 AnnotPanel 的批注账
  // （键即 annot 本键）。迁过即删旧条，故此效自幂等；`#批` 是世界文学独有的后缀，
  // 四库的读者注向来就在 annot 本键上，不在迁列。
  useEffect(() => {
    for (const a of all) {
      if (a.verseId.startsWith("wl:") && a.verseId.endsWith("#批")) {
        api.add(a.verseId.slice(0, -"#批".length), a.text);
        api.remove(a.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all]);
  const [sel, setSel] = useState<{ text: string; x: number; y: number; lang: "zh" | "en" } | null>(null);
  const [open, setOpen] = useState<{ chapKey: string; lang: "zh" | "en"; anchor: string; text: string }[]>([]);
  const [live, setLive] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const stored: { chapKey: string; lang: "zh" | "en"; anchor: string; text: string }[] = [];
  for (const c of chapters)
    for (const a of all) {
      if (!a.verseId.startsWith(`${c.key}@`) || !a.verseId.endsWith("#锚")) continue;
      stored.push({
        chapKey: c.key,
        lang: c.lang,
        anchor: a.verseId.slice(`${c.key}@`.length, -"#锚".length),
        text: a.text,
      });
    }
  const cards = [...stored];
  for (const o of open) if (!cards.some((c) => c.chapKey === o.chapKey && c.anchor === o.anchor)) cards.push(o);

  useEffect(() => {
    onSnippetsChange(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored.map((s) => s.chapKey + s.anchor).join(","), chapters.map((c) => c.key).join("&")]);

  useEffect(() => {
    if (!focusAnchor) return;
    listRef.current?.querySelector(`[data-anchor="${focusAnchor}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusAnchor]);

  useEffect(() => {
    function onUp(e: MouseEvent) {
      const body = bodyRef.current;
      if (!body) return;
      if ((e.target as HTMLElement)?.closest?.(".sk-selbar, .sk-margin")) return;
      const s = window.getSelection();
      if (!s || s.isCollapsed || s.rangeCount === 0) {
        setSel(null);
        return;
      }
      const r = s.getRangeAt(0);
      if (!body.contains(r.commonAncestorContainer)) {
        setSel(null);
        return;
      }
      const text = s.toString().replace(/\s+/g, " ").trim();
      if (text.length < 2) {
        setSel(null);
        return;
      }
      const box = r.getBoundingClientRect();
      // 选句落在哪一面（data-wl-lang），落批便归那一面
      const pane = (e.target as Element | null)?.closest?.("[data-wl-lang]")?.getAttribute("data-wl-lang");
      if (pane === "ai") { setSel(null); return; }
      setSel({ text: s.toString().trim(), x: box.right, y: box.bottom, lang: pane === "en" ? "en" : "zh" });
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [bodyRef]);

  const openCard = (snippet: string, lang: "zh" | "en") => {
    const chap = chapters.find((c) => c.lang === lang) ?? chapters[0];
    const anchor = snippetAnchor(snippet);
    const k = snippetKeys(chap.key, anchor);
    if (!all.some((a) => a.verseId === k.text)) api.add(k.text, snippet);
    setOpen((o) =>
      o.some((x) => x.chapKey === chap.key && x.anchor === anchor)
        ? o
        : [...o, { chapKey: chap.key, lang: chap.lang, anchor, text: snippet }],
    );
    setSel(null);
    window.getSelection()?.removeAllRanges();
    return { anchor, keys: k, chapKey: chap.key };
  };

  async function translate(snippet: string, lang: "zh" | "en") {
    const { keys } = openCard(snippet, lang);
    if (all.some((a) => a.verseId === keys.vernacular)) return;
    setLive((m) => ({ ...m, [keys.vernacular.slice(-6)]: "" }));
    const liveKey = keys.vernacular.slice(-6);
    try {
      const out = await translateToVernacular(
        snippet,
        undefined,
        (d) => setLive((m) => ({ ...m, [liveKey]: (m[liveKey] ?? "") + d })),
        source,
        lang === "en" ? "en" : undefined,
      );
      if (out && out.trim()) api.add(keys.vernacular, out.trim());
      else api.add(keys.vernacular, "（未能译出——模型未应或未配 Key。）");
    } catch {
      api.add(keys.vernacular, "（未能译出——模型未应或未配 Key。）");
    } finally {
      setLive((m) => {
        const { [liveKey]: _d, ...rest } = m;
        return rest;
      });
    }
  }

  // 栏面的字样：有中文面在场就照中文读者说话（英文单卷则用英文小帽）。
  // 这是本层自带的一套（随所读之卷而变），与全站语言两回事；全站切英文时
  // 下面每一支都再过一道 t()，两套各管各的，中文模式下一字不改。
  const uiLang = chapters.some((c) => c.lang === "zh") ? "zh" : "en";

  return (
    <>
      {sel && (
        <div className="sk-selbar" style={{ left: Math.min(sel.x, window.innerWidth - 190), top: sel.y + 6 }}>
          {(sel.lang === "en" || classical) && (
            <button onClick={() => translate(sel.text, sel.lang)}>{sel.lang === "en" ? t("译中文") : t("译白话")}</button>
          )}
          <button onClick={() => openCard(sel.text, sel.lang)}>{sel.lang === "en" ? t("Annotate · 批注") : t("批注")}</button>
          <button
            className="sk-selbar-x"
            onClick={() => {
              setSel(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="sk-margin wl-margin" ref={listRef}>
        <div className="sk-margin-head">
          {uiLang === "en" ? t("Marginalia · 边批") : t("边批")}
          <small>{cards.length ? t("{n} 处", { n: cards.length }) : uiLang === "en" ? "Select a passage to annotate or translate" : t("选中正文一句，即可批注")}</small>
        </div>
        {cards.length === 0 && (
          <p className="sk-margin-empty">
            {uiLang === "en"
              ? "Select a passage in the text to see a Chinese rendering, keep your own note, or ask a thinker to comment."
              : t("在正文中拖选一句，可以注己见或请人批注。")}
          </p>
        )}
        {cards.map((c) => (
          <Card
            key={`${c.chapKey}@${c.anchor}`}
            chapKey={c.chapKey}
            anchor={c.anchor}
            snippet={c.text}
            source={source}
            lang={c.lang}
            classical={classical}
            live={live[snippetKeys(c.chapKey, c.anchor).vernacular.slice(-6)]}
            focused={focusAnchor === c.anchor}
            onTranslate={() => translate(c.text, c.lang)}
            onDrop={() => {
              const k = snippetKeys(c.chapKey, c.anchor);
              for (const a of all) if (a.verseId.startsWith(k.annot)) api.remove(a.id);
              setOpen((o) => o.filter((x) => !(x.chapKey === c.chapKey && x.anchor === c.anchor)));
            }}
          />
        ))}
      </div>
    </>
  );
}

/** 一张边批卡：片段原文 + 白话 + 批注（AnnotPanel 与四库同源——诸子批西书自此而通）。 */
function Card({
  chapKey,
  anchor,
  snippet,
  source,
  lang,
  classical,
  live,
  focused,
  onTranslate,
  onDrop,
}: {
  chapKey: string;
  anchor: string;
  snippet: string;
  source: string;
  lang: "zh" | "en";
  /** 文言卷：中文卡也亮「译为白话」（按钮的开关见下） */
  classical?: boolean;
  live?: string;
  focused: boolean;
  onTranslate: () => void;
  onDrop: () => void;
}) {
  const t = useT();
  const keys = snippetKeys(chapKey, anchor);
  const [all] = useAnnotations();
  const vern = all.find((a) => a.verseId === keys.vernacular);
  // openCard 只落了 #锚（片段原文），白话另落 #白话；批注本体在 annot 本键，
  // 与四库同账同形，撤卡时 startsWith(annot) 连带清干净
  const [showAnnot, setShowAnnot] = useState(all.some((a) => a.verseId === keys.annot));

  return (
    <div className={`sk-mcard${focused ? " on" : ""}`} data-anchor={anchor}>
      <blockquote>{snippet.length > 100 ? `${snippet.slice(0, 100)}……` : snippet}</blockquote>

      {live !== undefined ? (
        <div className="sk-mvern">
          <i>{lang === "en" ? t("中译") : t("白话")}</i>
          <p>{live}<span className="cursor">▍</span></p>
        </div>
      ) : vern ? (
        <div className="sk-mvern">
          <i>{lang === "en" ? t("中译") : t("白话")}</i>
          <p>{vern.text}</p>
        </div>
      ) : (
        (lang === "en" || classical) && (
          <button className="ghost-btn sk-mbtn" onClick={onTranslate}>
            {lang === "en" ? t("译为中文 →") : t("译为白话 →")}
          </button>
        )
      )}

      {showAnnot ? (
        <div className="sk-mannot">
          {/* 与四库同法（见 SikuMarginalia 的同一段）：prompt 里把出处与所批之句
              都交代清楚，庄子才批得到点上，而不是泛论全书 */}
          <AnnotPanel
            verseKey={keys.annot}
            prompt={`客就${source}中「${snippet.slice(0, 60)}」一句请批注，可援可驳，勿泛论全书。`}
          />
        </div>
      ) : (
        <button className="ghost-btn sk-mbtn" onClick={() => setShowAnnot(true)}>{t("批注此句 →")}</button>
      )}

      <button className="sk-mdrop" title={t("撤去此处批注")} onClick={onDrop}>{t("撤")}</button>
    </div>
  );
}

/** 与四库同法的朱标标记（复制自 SikuLayer——两层的分片形状同、标记逻辑同）。 */
function findHitSpan(para: string, hit: string): { at: number; len: number } | null {
  const h = hit.trim();
  for (let len = h.length; len >= 12; len = len > 24 ? 24 : len - 4) {
    const at = para.indexOf(h.slice(0, len));
    if (at >= 0) return { at, len };
    if (len <= 12) break;
  }
  return null;
}

function markSnippets(
  para: string,
  snippets: { anchor: string; text: string }[],
  onPick: (anchor: string) => void,
  /** 朱标的悬停字样。此函数不是组件，取不到 useT，故由调用处译好递进来 */
  title: string,
  /** 自历史大事件跳进来要标的那一句原话。它压在边批朱标之上，重叠时以它为准 */
  hit?: string,
): React.ReactNode {
  const hitSpan = hit ? findHitSpan(para, hit) : null;
  if (snippets.length === 0 && !hitSpan) return para;
  const hits: { at: number; len: number; anchor: string; lit?: boolean }[] = [];
  if (hitSpan) hits.push({ ...hitSpan, anchor: "hit", lit: true });
  for (const s of [...snippets].sort((a, b) => b.text.length - a.text.length)) {
    const t = s.text.trim();
    if (t.length < 2) continue;
    let from = 0;
    for (;;) {
      const at = para.indexOf(t, from);
      if (at < 0) break;
      if (!hits.some((h) => at < h.at + h.len && h.at < at + t.length)) {
        hits.push({ at, len: t.length, anchor: s.anchor });
      }
      from = at + t.length;
    }
  }
  if (hits.length === 0) return para;
  hits.sort((a, b) => a.at - b.at);
  const out: React.ReactNode[] = [];
  let cur = 0;
  hits.forEach((h, i) => {
    if (h.at > cur) out.push(para.slice(cur, h.at));
    out.push(
      h.lit ? (
        <mark key={`hit-${i}`} className="sk-hit" data-hit="1">
          {para.slice(h.at, h.at + h.len)}
        </mark>
      ) : (
        <mark key={`${h.anchor}-${i}`} className="sk-mark" onClick={() => onPick(h.anchor)} title={title}>
          {para.slice(h.at, h.at + h.len)}
        </mark>
      ),
    );
    cur = h.at + h.len;
  });
  if (cur < para.length) out.push(para.slice(cur));
  return out;
}
