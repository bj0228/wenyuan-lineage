"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnnotations } from "../world/annotations";
import { translateToVernacular } from "../world/dialogue";
import { snippetAnchor, snippetKeys } from "../world/siku";
import { AnnotPanel } from "./AnnotPanel";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";

/**
 * 四库正文的边批 —— 选中一句，即可在右边那条空白上挂批注或白话。
 *
 * 为何挂在右边而不另开弹层：这一栏本是留白。线装书的天头地脚与行间，向来是写批的
 * 地方（眉批、旁批、夹注），正文与批并置在一张纸上，眼睛不必离开本文。弹层一开，
 * 正文便被盖住，批与所批之句就隔断了——那是注释，不是批注。
 *
 * 两件事分得清楚：
 *   - **批注**是人的判断，故仍走 `AnnotPanel`（客自注 + 请诸子批注），落在既有的
 *     `zhuzi-annotations` 里，与节点批注、影音点评同一本账。
 *   - **白话**是译文，不是判断，故另立一键（`#白话`），不与批注混列。译出即落库，
 *     同一句不必译两回。
 *
 * 键的分法与「为何要存片段原文」见 `siku.ts` 的 `snippetKeys`。
 */
export function SikuMarginalia({
  bodyRef,
  chapKey,
  source,
  onSnippetsChange,
  focusAnchor,
}: {
  /** 正文那一栏。选区落在它里面才算，落在章目或批注框里不算 */
  bodyRef: React.RefObject<HTMLDivElement | null>;
  /** 本章键，形如 `siku:xiyouji:28`（见 siku.ts 的 chapterKey） */
  chapKey: string;
  /** 出处，如「《西游记·第二十七回　尸魔三戏唐三藏》」，译白话时交给服务端定调 */
  source: string;
  /** 已批过的片段原文，交回正文那边标朱 */
  onSnippetsChange?: (snippets: { anchor: string; text: string }[]) => void;
  /** 正文里点了某处朱标，把对应那张卡滚进视野 */
  focusAnchor?: string | null;
}) {
  const [all, api] = useAnnotations();
  const t = useT();
  /** 选中后浮出的那两个钮：记文与位置 */
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);
  /** 本次打开着的卡（含尚无任何落库内容的空卡） */
  const [open, setOpen] = useState<{ anchor: string; text: string }[]>([]);
  /** 正在译的片段 → 已到的字 */
  const [live, setLive] = useState<Record<string, string>>({});
  /** 本次译失败的片段 → 缘由。只存在于本次，不落库（见 translate） */
  const [failed, setFailed] = useState<Record<string, string>>({});
  const listRef = useRef<HTMLDivElement>(null);

  // 已落库的片段：锚 → 原文（取自 `#锚` 那一条，见 siku.ts）
  const stored: { anchor: string; text: string }[] = [];
  for (const a of all) {
    if (!a.verseId.startsWith(`${chapKey}@`) || !a.verseId.endsWith("#锚")) continue;
    stored.push({ anchor: a.verseId.slice(`${chapKey}@`.length, -"#锚".length), text: a.text });
  }
  // 落库的在前（旧批在上，读着像一列批语），本次新开的空卡缀在后
  const cards = [...stored];
  for (const o of open) if (!cards.some((c) => c.anchor === o.anchor)) cards.push(o);

  useEffect(() => {
    onSnippetsChange?.(stored);
    // stored 每次渲染都是新数组，故以其内容作依赖，不以引用
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored.map((s) => s.anchor).join(","), chapKey]);

  useEffect(() => {
    if (!focusAnchor) return;
    listRef.current?.querySelector(`[data-anchor="${focusAnchor}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusAnchor]);

  // 选区：鼠标松开时看一眼。不用 selectionchange——拖选过程中它每帧都发，
  // 钮会跟着游标乱跳；松手才定位，是取词的常例。
  useEffect(() => {
    function onUp(e: MouseEvent) {
      const body = bodyRef.current;
      if (!body) return;
      // 点在钮上时不要重算选区，否则点下去的一瞬选区已清，钮就落空了
      if ((e.target as HTMLElement)?.closest?.(".sk-selbar, .sk-margin")) return;
      const s = window.getSelection();
      if (!s || s.isCollapsed || s.rangeCount === 0) { setSel(null); return; }
      const r = s.getRangeAt(0);
      if (!body.contains(r.commonAncestorContainer)) { setSel(null); return; }
      const text = s.toString().replace(/\s+/g, "").trim();
      if (text.length < 2) { setSel(null); return; }
      const box = r.getBoundingClientRect();
      setSel({ text: s.toString().trim(), x: box.right, y: box.bottom });
    }
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [bodyRef]);

  /** 开卡：把片段原文落库（只落一次），本次也把卡挂出来 */
  const openCard = useCallback(
    (snippet: string) => {
      const anchor = snippetAnchor(snippet);
      const k = snippetKeys(chapKey, anchor);
      if (!all.some((a) => a.verseId === k.text)) api.add(k.text, snippet);
      setOpen((o) => (o.some((x) => x.anchor === anchor) ? o : [...o, { anchor, text: snippet }]));
      setSel(null);
      window.getSelection()?.removeAllRanges();
      return { anchor, keys: k };
    },
    [all, api, chapKey],
  );

  async function translate(snippet: string) {
    const { anchor, keys } = openCard(snippet);
    if (all.some((a) => a.verseId === keys.vernacular)) return; // 译过的不再译
    setLive((m) => ({ ...m, [anchor]: "" }));
    setFailed((m) => {
      const { [anchor]: _drop, ...rest } = m;
      return rest;
    });
    try {
      // 第四个参数是出处：交了它，服务端便按「典籍正文」去译，不按「某子之发言」——
      // 正文夹叙夹议，当作一人之语译会把叙述句也译成第一人称（见 worker/index.ts）
      const out = await translateToVernacular(
        snippet,
        undefined,
        (d) => setLive((m) => ({ ...m, [anchor]: (m[anchor] ?? "") + d })),
        source,
      );
      // 译不出来不落库：一落，这句便永久算译过了，日后 Key 通了也无从重译。
      // 故只在本次显一句缘由，钮仍留着。
      if (out && out.trim()) api.add(keys.vernacular, out.trim());
      else setFailed((m) => ({ ...m, [anchor]: "未能译出——模型未应或未配 Key，可再试。" }));
    } catch {
      setFailed((m) => ({ ...m, [anchor]: "未能译出——网络不通，可再试。" }));
    } finally {
      setLive((m) => {
        const { [anchor]: _drop, ...rest } = m;
        return rest;
      });
    }
  }

  return (
    <>
      {sel && (
        <div className="sk-selbar" style={{ left: Math.min(sel.x, window.innerWidth - 190), top: sel.y + 6 }}>
          <button onClick={() => openCard(sel.text)}>{t("批注")}</button>
          <button onClick={() => translate(sel.text)}>{t("译白话")}</button>
          <button className="sk-selbar-x" onClick={() => { setSel(null); window.getSelection()?.removeAllRanges(); }}>×</button>
        </div>
      )}

      <div className="sk-margin" ref={listRef}>
        <div className="sk-margin-head">
          {t("边批")}
          <small>{cards.length ? t("{n} 处", { n: cards.length }) : t("选中正文一句，批注或译白话")}</small>
        </div>
        {cards.length === 0 && (
          <p className="sk-margin-empty">
            {t("在正文中拖选一句，可以查看译文、注己见或请诸子批注。")}
          </p>
        )}
        {cards.map((c) => (
          <SnippetCard
            key={c.anchor}
            chapKey={chapKey}
            anchor={c.anchor}
            snippet={c.text}
            source={source}
            live={live[c.anchor]}
            failed={failed[c.anchor]}
            focused={focusAnchor === c.anchor}
            onTranslate={() => translate(c.text)}
            onDrop={() => {
              const k = snippetKeys(chapKey, c.anchor);
              for (const a of all) if (a.verseId.startsWith(k.annot)) api.remove(a.id);
              setOpen((o) => o.filter((x) => x.anchor !== c.anchor));
            }}
          />
        ))}
      </div>
    </>
  );
}

/** 一张边批卡：片段原文 + 白话 + 批注（AnnotPanel 原样复用）。 */
function SnippetCard({
  chapKey,
  anchor,
  snippet,
  source,
  live,
  failed,
  focused,
  onTranslate,
  onDrop,
}: {
  chapKey: string;
  anchor: string;
  snippet: string;
  source: string;
  live?: string;
  /** 本次译失败的缘由。显一句即可，不落库，故钮仍在，可再试 */
  failed?: string;
  focused: boolean;
  onTranslate: () => void;
  onDrop: () => void;
}) {
  const keys = snippetKeys(chapKey, anchor);
  const [all] = useAnnotations();
  const t = useT();
  const vern = all.find((a) => a.verseId === keys.vernacular);
  const notes = all.filter((a) => a.verseId === keys.annot);
  const [showAnnot, setShowAnnot] = useState(notes.length > 0);

  return (
    <div className={`sk-mcard${focused ? " on" : ""}`} data-anchor={anchor}>
      {/* 所批之句是典籍正文，两种语文都照原样；英文读者所需的那一行在「白话」之下 */}
      <blockquote>{snippet.length > 80 ? `${snippet.slice(0, 80)}……` : snippet}</blockquote>

      {live !== undefined ? (
        <div className="sk-mvern">
          <i>{t("白话")}</i>
          {/* 流着的那半句不译，等落定再说（与发言同例） */}
          <p>{live}<span className="cursor">▍</span></p>
        </div>
      ) : vern ? (
        <div className="sk-mvern">
          <i>{t("白话")}</i>
          <p>{vern.text}</p>
          {/* 白话本身是中文，英文模式下其下再附一行英译 */}
          <Said text={vern.text} />
        </div>
      ) : (
        <>
          {failed && <p className="sk-mfail">{t(failed)}</p>}
          <button className="ghost-btn sk-mbtn" onClick={onTranslate}>{failed ? t("再译一次 →") : t("译为白话 →")}</button>
        </>
      )}

      {showAnnot ? (
        <div className="sk-mannot">
          {/* 批注一事与诸子对谈同源，故不另写一套：prompt 里把出处与所批之句都交代清楚，
              诸子才批得到点上，而不是泛论此书。
              这一段是递给模型的，两种语文下都作中文——批语自中文典籍检出，换语即失其据 */}
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
