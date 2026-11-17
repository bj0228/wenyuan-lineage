"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADAPTATIONS,
  MEDIA_CLIPS,
  mergeMedia,
  type Adaptation,
  type MediaClip,
  type MediaKind,
} from "../world/adaptations";
import { loadCatalog as loadSikuCatalog, SIKU_GROUPS, type SikuEntry } from "../world/siku";
import { loadCatalog as loadLitCatalog, type WorldLitEntry } from "../world/worldlit";
import ClipReviewLayer from "./ClipReviewLayer";
import { MediaUnderstand } from "./MediaUnderstand";
import { useT } from "../i18n/lang";

/**
 * 跨媒介点评（全屏）—— 与「跨世界评议」并立的另一条横路。
 *
 * 母题层横着比的是**世界**：同一处境，战国、西游、西方各出其解。这一层横着比的
 * 是**媒介**：同一部书，纸上一种说法，银幕上另一种说法——《史记》之于《典籍里的
 * 中国》，《哈姆莱特》之于 1948 年的《王子复仇记》，书里那句话被镜头改写了多少，
 * 是看得见的。故入口安在跨世界评议旁边：一横一纵，都是把「只读一本书」拆开的路。
 *
 * 版面依书库之序立，不按影片年表：
 *  - 上一行是**四库**，分经史子集四列，列色即部色（与 .sk-gate/.sk-han/.sk-vol
 *    共用一套 --vol，见 globals.css 的四部色脉）。一列之内按书分簇，一书之下列
 *    它的影音——目录条目（Adaptation）与片段（MediaClip）同列，因为点进去是同
 *    一个点评席。
 *  - 下一行是**西方**，不再分列：世界文学轴本就不分部，按书分簇即可。
 *
 * 点任一条进**详情页**（ClipReviewLayer）：主人公自述、他家诸子旁议、客可落注。
 * 架上没有的，客可自呈一段（MediaUnderstand）：抽帧交 qwen-vl 看过，再请诸子就这段说话——
 * 故此层既是「架上影音之总目」，也是「客自带影音之入口」，两条路同归一个点评席。
 * 这一层只管「哪些影音可评、从哪条路找到它」，评本身仍归点评席那一套。
 */

type Item = {
  id: string;
  kind: MediaKind;
  label: string;
  sub: string;
  /** 目录条的副行是年与出品两截，须分开查表再拼（见 MediaCard）；片段只有「片段」二字，不设此项。 */
  subParts?: { year: number; maker: string };
  note: string;
  /** 同簇有同名之片时，题旁缀年以别之（如《浮士德》1926 与《浮士德》2011）。 */
  yearTag?: string;
  /** 卡下所附之幕：此片在席上被评的那一镜。有点入之 id 与一句概述。 */
  scene?: { id: string; text: string };
};

type Cluster = { key: string; book: string; items: Item[] };

function itemOfAdaptation(a: Adaptation, scene?: MediaClip): Item {
  return {
    id: a.id,
    kind: a.kind,
    label: a.title,
    sub: `${a.year} · ${a.maker}`,
    subParts: { year: a.year, maker: a.maker },
    note: a.note,
    scene: scene && { id: scene.id, text: scene.text },
  };
}

function itemOfClip(c: MediaClip): Item {
  return { id: c.id, kind: c.kind, label: c.work, sub: "片段", note: c.text };
}

/**
 * 一簇之内，一部片只出一卡。
 *
 * 从前目录条目与片段各出一卡：同一部《浮士德》，「1926·茂瑙」一张、
 * 「片段」一张，同名并列，看着就是两条重复。如今片段以 adaptationId
 * 指回其所出之片，便并作一卡——卡面仍是那部片的题与年，卡下附一行
 * 所演之幕；点卡面入影、点幕入幕，仍是同一个点评席。并卡之法已归
 * `mergeMedia`（world/adaptations.ts），四库书页、世界文学书内影音栏
 * 共用一式：从前只此一层并了卡，书页上《王子复仇记》仍重出两回。
 *
 * 无所出目录条之片段（战国、西游两路）照旧独列，次序仍依书库原序。
 *
 * 尚有一种看着像重复而实非重复者：同一本书的两部片恰好同名——《浮士德》
 * 1926 与 2011、《茶花女》1936 与 1921。年份本在副行小字，粗体题名却一模
 * 一样，并卡之后这四对便格外显眼。故同簇内同名者，题旁缀年以别之。
 *
 * 另一种则跨簇：同一部片挂于数书，簇与簇各出一卡（见 MediaCard 之第三行）。
 * 此非可并——此卡属此书，并了便不知读哪一部书时该看它；故以逐书之提要别之。
 */
function cluster(key: string, book: string, ads: Adaptation[], clips: MediaClip[]): Cluster {
  const { rows, loose } = mergeMedia(ads, clips);
  const titleCount = new Map<string, number>();
  ads.forEach((a) => titleCount.set(a.title, (titleCount.get(a.title) ?? 0) + 1));
  const items: Item[] = rows.map(({ ad, scene }) => {
    const it = itemOfAdaptation(ad, scene);
    if ((titleCount.get(ad.title) ?? 0) > 1) it.yearTag = String(ad.year);
    return it;
  });
  loose.forEach((c) => items.push(itemOfClip(c)));
  return { key, book, items };
}

/**
 * 一卡：影一条，其下有幕则附一笺。幕自成一钮——按钮不可套按钮，故并列于卡下。
 *
 * 卡面第三行是**这一书的提要**。同一部片常挂数书：《中国通史》子部八书有之、
 * 史部二书有之，《东周列国·春秋篇》经史子三部共六处。各处本不是同一条——
 * 挂《论衡》者说王充疾虚妄，挂《抱朴子》者说魏晋神仙道教，逐书各写一句；
 * 从前这句话藏在悬停里，卡面只剩题、年、出品，一列之内便是八张一模一样的卡。
 * 今将那句显出来，八张《中国通史》各说各话，重复之相自解，而「按书分簇」的版面不动。
 */
function MediaCard({ it, onOpen }: { it: Item; onOpen: (id: string) => void }) {
  const t = useT();
  return (
    <div className="xm-ent">
      <button
        type="button"
        className="xm-item"
        onClick={() => onOpen(it.id)}
        title={t("{note}（点入详情页）", { note: t(it.note) })}
      >
        <span className="xm-kind">{t(it.kind)}</span>
        <span className="xm-item-main">
          <b>
            《{t(it.label)}》{it.yearTag && <u>{it.yearTag}</u>}
          </b>
          {/* 副行：年照数字走，出品查表；中文模式下与从前拼出的那一行逐字相同 */}
          <em>{it.subParts
            ? t("{year} · {maker}", { year: it.subParts.year, maker: t(it.subParts.maker) })
            : t(it.sub)}</em>
          {/* 第三行：逐书所写的那一句（片段则是幕之概述），同片异书之别在此 */}
          <small>{t(it.note)}</small>
        </span>
      </button>
      {it.scene && (
        <button
          type="button"
          className="xm-scene"
          onClick={() => onOpen(it.scene!.id)}
          title={t("点入此幕的点评席")}
        >
          <i aria-hidden>幕</i>
          <span>{t(it.scene.text)}</span>
        </button>
      )}
    </div>
  );
}

export default function CrossMediaLayer({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [siku, setSiku] = useState<SikuEntry[] | null>(null);
  const [lit, setLit] = useState<WorldLitEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  /** 客自呈影音：此层不内置版权影视，自带的那一段另走 MediaUnderstand（抽帧→VL→诸子点评） */
  const [muOpen, setMuOpen] = useState(false);

  useEffect(() => {
    let live = true;
    loadSikuCatalog().then(
      (c) => live && setSiku(c),
      () => live && setErr(t("四库目录未载入——public/siku/catalog.json 尚未生成或未随构建上传。")),
    );
    loadLitCatalog().then(
      (c) => live && setLit(c),
      () => live && setLit([]),
    );
    return () => {
      live = false;
    };
  }, [t]);

  /** bookId → 书名（取目录之题；目录未到时退回 bookId 本身，不致空栏） */
  const bookTitle = useMemo(() => {
    const m = new Map<string, string>();
    (siku ?? []).forEach((e) => e.bookId && m.set(e.bookId, e.title));
    return m;
  }, [siku]);

  /** bookId → 部 */
  const bookGroup = useMemo(() => {
    const m = new Map<string, string>();
    (siku ?? []).forEach((e) => e.bookId && m.set(e.bookId, e.group));
    return m;
  }, [siku]);

  /** 四部各一列，列内按书分簇 */
  const columns = useMemo(() => {
    const byGroup = new Map<string, Map<string, { ads: Adaptation[]; clips: MediaClip[] }>>();
    SIKU_GROUPS.forEach((g) => byGroup.set(g.id, new Map()));
    const slot = (bookId: string) => {
      const g = bookGroup.get(bookId);
      if (!g) return undefined;
      const books = byGroup.get(g);
      if (!books) return undefined;
      if (!books.has(bookId)) books.set(bookId, { ads: [], clips: [] });
      return books.get(bookId);
    };
    ADAPTATIONS.forEach((a) => a.bookId && slot(a.bookId)?.ads.push(a));
    MEDIA_CLIPS.forEach((c) => c.bookId && slot(c.bookId)?.clips.push(c));
    return SIKU_GROUPS.map((g) => {
      const books = byGroup.get(g.id) ?? new Map();
      const clusters: Cluster[] = [...books.entries()].map(([bid, v]) =>
        cluster(bid, bookTitle.get(bid) ?? bid, v.ads, v.clips),
      );
      clusters.sort((a, b) => b.items.length - a.items.length || a.book.localeCompare(b.book, "zh"));
      return { group: g, clusters, count: clusters.reduce((n, c) => n + c.items.length, 0) };
    });
  }, [bookGroup, bookTitle]);

  /** 西方一行：按世界文学之书分簇（litId），书名取世界文学目录 */
  const westClusters = useMemo(() => {
    const names = new Map<string, string>();
    (lit ?? []).forEach((e) => names.set(e.id, e.name));
    const books = new Map<string, { ads: Adaptation[]; clips: MediaClip[] }>();
    const slot = (litId: string) => {
      if (!books.has(litId)) books.set(litId, { ads: [], clips: [] });
      return books.get(litId)!;
    };
    ADAPTATIONS.forEach((a) => a.litId && slot(a.litId).ads.push(a));
    MEDIA_CLIPS.forEach((c) => c.litId && slot(c.litId).clips.push(c));
    const out = [...books.entries()].map(([lid, v]) => cluster(lid, names.get(lid) ?? lid, v.ads, v.clips));
    out.sort((a, b) => b.items.length - a.items.length || a.book.localeCompare(b.book, "zh"));
    return out;
  }, [lit]);

  const westCount = westClusters.reduce((n, c) => n + c.items.length, 0);
  const sikuCount = columns.reduce((n, c) => n + c.count, 0);

  return (
    <div className="xm-stage" role="dialog" aria-label={t("跨媒介点评")} aria-modal="true">
      <div className="xm-card">
        <header className="xm-head">
          <div>
            <p className="eyebrow">{t("跨媒介点评")}</p>
            {/* 自呈的入口跟着大标题走：架上那九十八条是现成的，这一枚朱印是「架上没有也能评」 */}
            <div className="xm-title-row">
              <h2>{t("一书两说 · 纸上与银幕")}</h2>
              <button
                type="button"
                className={`xm-up-btn${muOpen ? " on" : ""}`}
                onClick={() => setMuOpen((v) => !v)}
                title={t("自呈一段影音：抽帧交目，再请诸子就这段说话")}
              >
                <i aria-hidden>呈</i>
                <span>
                  <b>{muOpen ? t("收起自呈") : t("上传影音点评")}</b>
                  <em>{t("自带一段 · 请诸子说话")}</em>
                </span>
              </button>
            </div>
            <small>
              {t("择一条影音入点评席，主人公自述、他家旁议、客亦可落注。客亦可上传视频进行点评。")}
              {siku
                ? t("共 {n} 条 · 四库 {siku}、西方 {west}", {
                    n: sikuCount + westCount,
                    siku: sikuCount,
                    west: westCount,
                  })
                : t("目录载入中……")}
            </small>
          </div>
          <button className="stage-close" onClick={onClose} aria-label={t("关闭")}>×</button>
        </header>

        {err && <div className="xm-empty">{err}</div>}

        {/* 客自呈的一段：架上没有的影音从这里进来，抽帧交 VL 看过，再请诸子说话 */}
        {muOpen && (
          <div className="xm-mu">
            <MediaUnderstand />
          </div>
        )}

        <div className="xm-body">
          {/* 上一行：四库，经史子集四列 */}
          <section className="xm-row">
            <div className="xm-row-rail">
              <b>{t("四库")}</b>
              <em>{t("经 · 史 · 子 · 集")}</em>
            </div>
            <div className="xm-cols">
              {columns.map(({ group, clusters, count }) => (
                <div key={group.id} className="xm-col" data-g={group.id}>
                  <div className="xm-col-head">
                    <b>{t(group.name)}</b>
                    <i>{t("{n} 条", { n: count })}</i>
                  </div>
                  <div className="xm-col-body">
                    {clusters.length === 0 && <p className="xm-none">{siku ? t("此部暂无影音") : t("载入中……")}</p>}
                    {clusters.map((c) => (
                      <div key={c.key} className="xm-clu">
                        <p className="xm-clu-book">《{t(c.book)}》</p>
                        {c.items.map((it) => (
                          <MediaCard key={it.id} it={it} onOpen={setOpenId} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 下一行：西方，不分列 */}
          <section className="xm-row">
            <div className="xm-row-rail xm-rail-west">
              <b>{t("西方")}</b>
              <em>{t("世界文学一轴")}</em>
            </div>
            <div className="xm-west">
              {westClusters.length === 0 && <p className="xm-none">{t("此轴暂无影音")}</p>}
              {westClusters.map((c) => (
                <div key={c.key} className="xm-clu xm-clu-west">
                  <p className="xm-clu-book">《{t(c.book)}》</p>
                  {c.items.map((it) => (
                    <MediaCard key={it.id} it={it} onOpen={setOpenId} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {openId && (
        <ClipReviewLayer mediaId={openId} backLabel="回跨媒介" onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
