"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SIKU_GROUPS,
  loadCatalog,
  loadMeta,
  loadChapter,
  categoriesOf,
  booksOf,
  searchCatalog,
  catalogStats,
  entryOfBook,
  chapterByLabel,
  chapterKey,
  eraKey,
  yearText,
  type SikuEntry,
  type SikuMeta,
  type SikuChapter,
} from "../world/siku";
import {
  loadSearchIndex,
  loadPassages,
  searchPassages,
  searchChapters,
  searchPeople,
  type SearchIndex,
  type Passage,
  type Part,
} from "../world/sikuSearch";
import { AnnotPanel } from "./AnnotPanel";
import { SikuMarginalia } from "./SikuMarginalia";
import ClipReviewLayer from "./ClipReviewLayer";
import AdapRow from "./AdapRow";
import { adaptationsOfBook, clipsOfBook, mergeMedia } from "../world/adaptations";
import { useLang, useT } from "../i18n/lang";
import { XMEDIA_ON } from "../world/feature-flags";
import type { SikuAsk } from "./TourLayer";

/** 「经」→「经部」：四部之名在词表里是「经部」一条整词（作 Classics），故合起来再查 */
function partLabel(group: string) {
  return `${group}部`;
}

/**
 * 四库全书（全屏）—— 经史子集 → 类 → 书 → 章 → 正文，四层下钻，外加一条检索捷径。
 *
 * 与「百家图谱」那层的分别：图谱画的是诸子之间的关系，四库铺的是典籍自身的分类轴。
 * 这条轴是四库最值钱的东西——一部书落在经部还是子部、属儒家还是杂家，本身就是
 * 一种判断。故目录全收一千余部，不论正文切没切；没切的仍著录在架，只是不可读，
 * 这与《总目》「存目」之例同意。
 *
 * 正文一律按需 fetch（见 world/siku.ts），进这一层才取目录，点到章才取正文。
 * 章正文可请诸子批注，与句读、影音点评共用 AnnotPanel 与 annotations 的落库。
 *
 * 三个入口，故有 `initial*` 三个口子：
 *   - 典籍 tab：什么都不给，自四部选起；
 *   - 指南针四隅：给 `initialGroup`，直落该部；
 *   - 世界图上的回目：给 `initialBookId` + `initialChapterLabel`，直落该书该回——
 *     这一条是「图上一处」与「书上一回」之间的那座桥，白虎岭点下去，
 *     翻开的就是第二十七回的正文，不必自集部小说一层层找到《西游记》再数到那一回。
 *
 * 影音不在此层立门：一部书的演绎仍挂在那一部书前（见 BookReader 的「后世影音」栏），
 * 要横着看全部影音另有「跨媒介点评」一层总摄，此处不再设第五门与它重复。
 */

export default function SikuLayer({
  onClose,
  initialGroup,
  initialBookId,
  initialChapterLabel,
  initialHitText,
  backLabel = "返回典籍",
  tourAsk,
}: {
  onClose: () => void;
  /** 自指南针四隅进来时，直落该部，省一次点击 */
  initialGroup?: string;
  /** 自世界图进来时，直落该书（分片名，见 siku_extract.py 的 SELECT） */
  initialBookId?: string;
  /** 并直落该回；给的是回次本文（「第二十七回」），不是章序 */
  initialChapterLabel?: string;
  /**
   * 并在正文里标出这一句原话。
   *
   * 自历史大事件点一条进来时递的。一章动辄数千字，不标一下，跳过去只是开了一章书，
   * 看不出点的是哪一句。
   */
  initialHitText?: string;
  /** 返回键的字样——自何处来便说回何处去 */
  backLabel?: string;
  /**
   * 新手导览递进来的意图（部／类／检索词／开哪部书）。
   *
   * 这三层下钻的状态都在本组件自己的 useState 里，page 够不着，故照辩论台
   * `preset` 的老路数：外面给一个「该切成什么样」的意图，这里照着切。
   * 按 `n` 认新帖——同一个帖子重渲不会重放。
   */
  tourAsk?: SikuAsk;
}) {
  const [catalog, setCatalog] = useState<SikuEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(initialGroup ?? null);
  const [category, setCategory] = useState<string | null>(null);
  const [entry, setEntry] = useState<SikuEntry | null>(null);
  const [reviewClip, setReviewClip] = useState<string | null>(null);
  /** 自检索结果点开一部书时，要直落那一卷——手上有章序，故不走回次 */
  const [openAt, setOpenAt] = useState<{ bookId: string; n: number } | null>(null);
  /** 一程：可引语料总目与各书卷目（十余万字节，检索栏一开即取） */
  const [sidx, setSidx] = useState<SearchIndex | null>(null);
  /** 二程：各书正文片段（三点八兆，按需取，取时报进度） */
  const [passages, setPassages] = useState<Passage[] | null>(null);
  const [passProg, setPassProg] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    let live = true;
    loadCatalog().then(
      (c) => {
        if (!live) return;
        setCatalog(c);
        // 指定了书便当即翻开，并把它那一部、那一类一并坐实——
        // 否则面包屑上只有「四库 › 西游记」，退一级无处可退。
        if (initialBookId) {
          const e = entryOfBook(c, initialBookId);
          if (e) {
            setGroup(e.group);
            setCategory(e.category || "未分类");
            setEntry(e);
          } else {
            setErr("目录里没有分片名为「{id}」的书——抽取时未选中，或分片未随构建上传。");
          }
        }
      },
      () => live && setErr("目录未载入——public/siku/catalog.json 尚未生成或未随构建上传。"),
    );
    return () => {
      live = false;
    };
  }, [initialBookId]);

  const stats = useMemo(() => (catalog ? catalogStats(catalog) : null), [catalog]);
  const t = useT();
  const lang = useLang();
  const q = query.trim();

  // 导览递来的意图：按帖子序号认新帖，同一个帖子重渲不重放。
  // 开书那一路要目录（认书名、坐实部类），目录未到时留一手，待 catalog 到了再开。
  const askRef = useRef(0);
  const pendingBook = useRef<string | null>(null);
  useEffect(() => {
    if (!tourAsk || tourAsk.n === askRef.current) return;
    askRef.current = tourAsk.n;
    // 换一处看，先收掉此前的手上之物：检索词、直落章序一并作废，
    // 否则「开书」会带着上一帖的章序落到错处。
    setOpenAt(null);
    switch (tourAsk.kind) {
      case "reset":
        setQuery("");
        setGroup(null);
        setCategory(null);
        setEntry(null);
        pendingBook.current = null;
        break;
      case "group":
        setQuery("");
        setGroup(tourAsk.group);
        setCategory(null);
        setEntry(null);
        break;
      case "category":
        setQuery("");
        // 倒着回来时上一相可能是检索（部已被清），故一帖里把部也带上
        if (tourAsk.group) setGroup(tourAsk.group);
        setCategory(tourAsk.category);
        setEntry(null);
        break;
      case "query":
        setQuery(tourAsk.query);
        setGroup(null);
        setCategory(null);
        setEntry(null);
        break;
      case "book":
        pendingBook.current = tourAsk.bookId;
        if (catalog) {
          const e = entryOfBook(catalog, tourAsk.bookId);
          if (e) {
            setQuery("");
            setGroup(e.group);
            setCategory(e.category || "未分类");
            setEntry(e);
            pendingBook.current = null;
          }
        }
        break;
    }
  }, [tourAsk, catalog]);

  // 目录后到：上一帖要开的那部书此刻才认得出
  useEffect(() => {
    const id = pendingBook.current;
    if (!catalog || !id) return;
    const e = entryOfBook(catalog, id);
    if (!e) return;
    setQuery("");
    setGroup(e.group);
    setCategory(e.category || "未分类");
    setEntry(e);
    pendingBook.current = null;
  }, [catalog]);

  /**
   * 检索的两程皆按需起：打了字才取，不打字只看四部门面的读者一个字节也不多下。
   * 取过便留在模块里（见 sikuSearch 的缓存），此后换词检索不再取第二遍。
   */
  useEffect(() => {
    if (!catalog || !q) return;
    let live = true;
    loadSearchIndex(catalog).then((i) => {
      if (!live) return;
      setSidx(i);
      loadPassages(i, (done, total) => live && setPassProg({ done, total })).then(
        (p) => live && setPassages(p),
        () => {},
      );
    }, () => {});
    return () => {
      live = false;
    };
  }, [catalog, q]);

  // 词表一并交给检索：英文模式下打 "Zhuangzi" 也要检着《庄子》（见 siku.ts 的 searchCatalog）。
  // 卷目与正文两路仍只认中文——那是书上的字，不另立英文一面。
  const hits = useMemo(() => (catalog && q ? searchCatalog(catalog, query, 60, t) : []), [catalog, query, q, t]);
  const people = useMemo(
    () => (catalog && q ? searchPeople(catalog, sidx, query, 6, t) : []),
    [catalog, sidx, query, q, t],
  );
  const chapHits = useMemo(() => (sidx && q ? searchChapters(sidx, query) : null), [sidx, query, q]);
  const textHits = useMemo(() => (passages && q ? searchPassages(passages, query) : null), [passages, query, q]);
  const nothing =
    !!q && hits.length === 0 && people.length === 0 && !chapHits?.hits.length && !textHits?.hits.length;

  /** 自检索结果里点开一处：书、类、部一并坐实，并记下要开的那一卷 */
  const openHit = (e: SikuEntry, n?: number) => {
    setGroup(e.group);
    setCategory(e.category || "未分类");
    setEntry(e);
    setOpenAt(n && e.bookId ? { bookId: e.bookId, n } : null);
  };

  const cats = useMemo(() => (catalog && group ? categoriesOf(catalog, group) : []), [catalog, group]);
  const books = useMemo(
    () => (catalog && group && category ? booksOf(catalog, group, category) : []),
    [catalog, group, category],
  );

  // 面包屑：退一级即清掉下一级的选择
  // 检索那一级也算一级：自结果里点开一部书，这一格便是回路——书合上仍是那一屏结果，
  // 不必把刚打的词再打一遍。`raw` 者是读者自己打的字，不送去查词表。
  const crumb: { label: string; back: () => void; raw?: boolean }[] = [];
  if (q) crumb.push({ label: `「${q}」`, back: () => { setEntry(null); setOpenAt(null); }, raw: true });
  if (group) crumb.push({ label: partLabel(group), back: () => { setCategory(null); setEntry(null); setOpenAt(null); } });
  if (category) crumb.push({ label: category, back: () => { setEntry(null); setOpenAt(null); } });
  if (entry) crumb.push({ label: entry.title, back: () => {} });

  return (
    <div className="kg-layer">
      <div className="kg-top">
        <div>
          <div className="eyebrow">{t("典籍 · 四库全书 · 经史子集")}</div>
          <h2>
            {entry
              ? t(entry.title)
              : category
                ? t(category)
                : group
                  ? t(partLabel(group))
                  : t("四库全书")}
            {stats && !entry && (
              <small style={{ fontSize: 12, color: "#8a7d62", marginLeft: 10, letterSpacing: ".06em" }}>
                {t("著录 {total} 部 · 可读 {readable} 部", { total: stats.total, readable: stats.readable })}
              </small>
            )}
          </h2>
        </div>
        {/* 回何处去的字样由唤它的那一层给，字样本身是中文，在此译 */}
        <button className="kg-back-btn" onClick={onClose}>← {t(backLabel)}</button>
      </div>

      <div className="sk-bar">
        <input
          className="sk-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // 又打起字来便是要另检一处，手上那部书先合上——不然结果藏在书后看不见
            if (e.target.value.trim()) { setEntry(null); setOpenAt(null); }
          }}
          placeholder={t("检索人物、书名、卷目、正文，如「庄子」「鼓盆」「桃园结义」")}
        />
        {(group || entry || query) && (
          <div className="sk-crumb">
            <button
              className="kg-link"
              onClick={() => { setQuery(""); setGroup(null); setCategory(null); setEntry(null); setOpenAt(null); }}
            >
              {t("四库")}
            </button>
            {crumb.map((c, i) => (
              <span key={i}>
                <span className="sk-sep">›</span>
                {i === crumb.length - 1 ? (
                  <b>{c.raw ? c.label : t(c.label)}</b>
                ) : (
                  <button className="kg-link" onClick={c.back}>{c.raw ? c.label : t(c.label)}</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="kg-body" style={{ overflow: "auto", padding: "14px 26px 26px" }}>
        {err && <p className="intro">{t(err, { id: initialBookId ?? "" })}</p>}
        {!catalog && !err && <p className="intro">{t("目录载入中……")}</p>}

        {catalog && !entry && q !== "" && (
          <div className="sk-find">
            {/* 一、其人：诸子与著者。打「老子」检出的是人，不是书——人之下再系其书，
                故署着「李耳」的那一部也在其列（见 sikuSearch 的 searchPeople）。 */}
            {people.length > 0 && (
              <section className="sk-find-sec">
                <h3>
                  {t("其人")}
                  <i>{t("检得 {n} 人", { n: people.length })}</i>
                </h3>
                <div className="sk-pers">
                  {people.map((p) => (
                    <div key={p.name} className="sk-per">
                      <b>{t(p.name)}</b>
                      <small>
                        {t(p.note)}
                        {p.alias.length > 0 && ` · ${t("又称 {names}", { names: p.alias.map((a) => t(a)).join("、") })}`}
                      </small>
                      <i className="sk-per-num">
                        {t("著录 {n} 部", { n: p.entries.length })}
                        {p.items > 0 && ` · ${t("可检正文 {n} 条", { n: p.items })}`}
                      </i>
                      <span className="sk-per-books">
                        {p.entries.slice(0, 8).map((e, k) =>
                          e.bookId ? (
                            <button key={k} className="kg-link" onClick={() => openHit(e)}>
                              《{t(e.title)}》
                            </button>
                          ) : (
                            <em key={k} title={t("存目")}>《{t(e.title)}》</em>
                          ),
                        )}
                        {p.entries.length > 8 && <em>{t("…… 馀 {n} 部", { n: p.entries.length - 8 })}</em>}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 二、其书：目录一路，照旧（书名／著者／类／朝代） */}
            {hits.length > 0 && (
              <section className="sk-find-sec">
                <h3>
                  {t("其书")}
                  <i>
                    {t("检得 {n} 部", { n: hits.length })}
                    {hits.length >= 60 && t("（只列前 60）")}
                  </i>
                </h3>
                <div className="sk-vols">
                  {hits.map((e, i) => (
                    <BookCard key={`${e.title}-${i}`} entry={e} onOpen={() => openHit(e)} />
                  ))}
                </div>
              </section>
            )}

            {/* 三、其卷：二万九千余卷的卷名篇目，可读之书全覆盖。回目本是中国书的索引，
                「桃园结义」四字落在何处，这一路答得出，点下去即开那一卷。 */}
            {chapHits && chapHits.hits.length > 0 && (
              <section className="sk-find-sec">
                <h3>
                  {t("其卷")}
                  <i>
                    {t("检得 {n} 条", { n: chapHits.total })}
                    {chapHits.total > chapHits.hits.length && t("（只列前 {n}）", { n: chapHits.hits.length })}
                  </i>
                </h3>
                <div className="sk-rows">
                  {chapHits.hits.map((h, i) => (
                    <button key={i} className="sk-row" onClick={() => openHit(h.entry, h.n)}>
                      <span className="sk-row-t">
                        <Marked parts={h.parts} />
                      </span>
                      <span className="sk-row-src">
                        《{t(h.entry.title)}》 · {t(eraKey(h.entry.dynasty, lang))}
                        {h.entry.author && ` · ${t(h.entry.author)}`}
                        {yearText(h.entry.year, t) && ` · ${yearText(h.entry.year, t)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 四、其文：正文片段。载语料要几秒，故载时出一行进度，不叫人以为检索坏了。 */}
            <section className="sk-find-sec">
              <h3>
                {t("其文")}
                <i>
                  {textHits
                    ? `${t("检得 {n} 条", { n: textHits.total })}${
                        textHits.total > textHits.hits.length ? t("（只列前 {n}）", { n: textHits.hits.length }) : ""
                      }`
                    : t("正文语料载入中 {done}/{total} 部……", {
                        done: passProg?.done ?? 0,
                        total: passProg?.total ?? sidx?.books.length ?? 0,
                      })}
                </i>
              </h3>
              {textHits && textHits.hits.length > 0 && (
                <div className="sk-rows">
                  {textHits.hits.map((h, i) => (
                    <button key={i} className="sk-row" onClick={() => openHit(h.entry, h.n)}>
                      {/* 正文照原书出字，不译、不改排印（繁体者仍作繁体）；检索时两边各折一道，
                          故打「恒道」检得《道德经》的「恆道」。 */}
                      <span className="sk-row-t sk-row-text">
                        <Marked parts={h.parts} />
                      </span>
                      <span className="sk-row-src">
                        《{t(h.entry.title)}》 · {h.chapter}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {sidx && (
                <p className="sk-find-note">
                  {t("正文一路为 {n} 部可读书的均匀抽样，命中可回原章阅读全文；卷目与著录覆盖全库。", {
                    n: sidx.books.length,
                  })}
                </p>
              )}
            </section>

            {nothing && passages && <p className="intro">{t("四路皆未检得。换个词，或少打两三字试试。")}</p>}
          </div>
        )}

        {catalog && q === "" && !group && (
          <div className="sk-groups">
            {/* 四部四门：门色即部色——经绿史红子青集灰，与函、书一脉色脉。
                门作一座门楼白描（见 GateFace）：出檐翼角、斗栱、匾额书部名、
                双扉门钉铺首、门槛三级踏跺。悬停两扉自中缝内敞、门里透一点灯色，
                是「请进」的意思——推门进去，便是那一部的函与书。 */}
            {SIKU_GROUPS.map((g, i) => (
              <button key={g.id} className="sk-gate" data-g={g.id} onClick={() => setGroup(g.id)}>
                <GateFace name={g.name} uid={`g${i}`} />
                <span className="sk-gate-foot">
                  <small>{t(g.hint)}</small>
                  <i>{t("{n} 部", { n: stats?.groups[g.id] ?? 0 })}</i>
                </span>
              </button>
            ))}
          </div>
        )}

        {catalog && !entry && q === "" && group && !category && (
          <div className="sk-grid">
            {/* 类目卡作函套观：书既成册，类便是装书的函。函色随部，右口露几枚书脊——
                √count 为率、至多七枚，是「这一函装了多少书」的约略，不作精确刻度；
                部头大的函书脊多，一眼便分大小类。函签竖书类名，与书的题签同一笔意。 */}
            {cats.map((c) => (
              <button key={c.name} className="sk-han" data-g={group} onClick={() => setCategory(c.name)}>
                <b className="sk-han-tag">{t(c.name)}</b>
                <span className="sk-han-books" aria-hidden="true">
                  {Array.from({ length: Math.min(7, Math.ceil(Math.sqrt(c.count))) }, (_, i) => (
                    <i key={i} />
                  ))}
                </span>
                <small className="sk-han-count">
                  {t("{n} 部", { n: c.count })}{c.readable > 0 && <em>{t(" · 可读 {n}", { n: c.readable })}</em>}
                </small>
              </button>
            ))}
          </div>
        )}

        {catalog && !entry && q === "" && group && category && (
          <div className="sk-vols">
            {books.map((e, i) => (
              <BookCard key={`${e.title}-${i}`} entry={e} onOpen={() => setEntry(e)} />
            ))}
          </div>
        )}

        {entry && (
          <BookReader
            entry={entry}
            wantLabel={entry.bookId === initialBookId ? initialChapterLabel : undefined}
            wantN={openAt && openAt.bookId === entry.bookId ? openAt.n : undefined}
            wantText={entry.bookId === initialBookId ? initialHitText : undefined}
            onOpenClip={setReviewClip}
          />
        )}
      </div>

      {/* 点评席自成一屏，自书前影音栏点入——看完仍回那一部书 */}
      {reviewClip && (
        <ClipReviewLayer mediaId={reviewClip} backLabel="回此书" onClose={() => setReviewClip(null)} />
      )}
    </div>
  );
}

/**
 * 四部之门：一座门楼的白描。
 *
 * 自上而下是中国木构的那几件：正脊带鸱吻、屋面起举折两端翼角上翘、檐口一道瓦口线、
 * 檐下三朵斗栱、额枋上悬一方匾额书部名；两柱夹一门洞，双扉各三列五路门钉、
 * 中缝两旁一对铺首衔环；下承门槛与三级踏跺，两侧垂带斜下。
 *
 * 用色只两脉：瓦作取墨（经史子集共用），柱、枋、门扉取部色（--vol / --vol-deep），
 * 故四门同制而各有其色。悬停时两扉自中缝向内敞开（leaf 横缩），门里透出一点灯色，
 * 便是「请进」——按下去开得更大。门洞内景在扉之下一层，扉一敞即见。
 *
 * 渐变、滤镜的 id 须每门各异，故取 uid 作后缀——四门同页，id 重则相染。
 */
function GateFace({ name, uid }: { name: string; uid: string }) {
  const t = useT();
  const lang = useLang();
  const hall = `sk-hall-${uid}`;
  const tile = `sk-tile-${uid}`;
  const leafL = `sk-leafl-${uid}`;
  const leafR = `sk-leafr-${uid}`;
  const lamp = `sk-lamp-${uid}`;
  const eaveShade = `sk-eave-${uid}`;
  // 门钉：每扉三列五路，钉下各带一点暗影，远看便有凸起
  const studs = (cols: number[]) =>
    cols.flatMap((cx) =>
      [94, 115, 136, 157, 178].map((cy) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy + 1} r={1.9} fill="rgba(26,20,13,.26)" />
          <circle cx={cx} cy={cy} r={1.9} fill="rgba(249,244,229,.58)" />
        </g>
      )),
    );
  // 铺首衔环：一方兽面托一只圆环，左右各一，分列中缝两旁
  const knocker = (x: number) => (
    <g stroke="rgba(249,244,229,.6)" strokeWidth={1.2} fill="none">
      <rect x={x} y={120} width={11} height={11} rx={1.5} fill="rgba(249,244,229,.18)" />
      <circle cx={x + 5.5} cy={141} r={5.4} />
    </g>
  );
  return (
    <svg className="sk-gate-face" viewBox="0 0 200 230" role="img" aria-label={t("{name}之门", { name: t(name) })}>
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b6354" />
          <stop offset="1" stopColor="#484132" />
        </linearGradient>
        <linearGradient id={hall} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#332a1e" />
          <stop offset="1" stopColor="#1d1710" />
        </linearGradient>
        <linearGradient id={eaveShade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(32,26,18,.28)" />
          <stop offset="1" stopColor="rgba(32,26,18,0)" />
        </linearGradient>
        <radialGradient id={lamp} cx="0.5" cy="0.82" r="0.62">
          <stop offset="0" stopColor="rgba(234,190,112,.52)" />
          <stop offset="1" stopColor="rgba(234,190,112,0)" />
        </radialGradient>
        <linearGradient id={leafL} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,250,236,.15)" />
          <stop offset="0.62" stopColor="rgba(26,20,13,0)" />
          <stop offset="1" stopColor="rgba(26,20,13,.28)" />
        </linearGradient>
        <linearGradient id={leafR} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="rgba(255,250,236,.15)" />
          <stop offset="0.62" stopColor="rgba(26,20,13,0)" />
          <stop offset="1" stopColor="rgba(26,20,13,.28)" />
        </linearGradient>
      </defs>

      {/* 一、门洞内景：堂中一点灯色、地上一道横线，门扉敞时才看得见 */}
      <rect x={38} y={80} width={124} height={116} fill={`url(#${hall})`} />
      <rect className="sk-gate-glow" x={38} y={80} width={124} height={116} fill={`url(#${lamp})`} />
      <path d="M48,176 H152" stroke="rgba(249,244,229,.12)" strokeWidth={1} />

      {/* 二、门扉：左右两扉，各三列五路门钉、一副铺首；内缘一道中缝 */}
      <g className="sk-leaf sk-leaf-l">
        <rect x={38} y={80} width={62} height={116} fill="var(--vol)" />
        <rect x={38} y={80} width={62} height={116} fill={`url(#${leafL})`} />
        <path d="M58,80 V196 M78,80 V196" stroke="rgba(24,19,12,.13)" strokeWidth={1} />
        {studs([50, 64, 78])}
        {knocker(85)}
        <rect x={98.6} y={80} width={1.4} height={116} fill="rgba(24,19,12,.42)" />
      </g>
      <g className="sk-leaf sk-leaf-r">
        <rect x={100} y={80} width={62} height={116} fill="var(--vol)" />
        <rect x={100} y={80} width={62} height={116} fill={`url(#${leafR})`} />
        <path d="M122,80 V196 M142,80 V196" stroke="rgba(24,19,12,.13)" strokeWidth={1} />
        {studs([122, 136, 150])}
        {knocker(104)}
        <rect x={100} y={80} width={1.4} height={116} fill="rgba(24,19,12,.42)" />
      </g>

      {/* 三、门框：两柱夹门洞，柱下各一础，门槛横压柱脚；檐影落在门楣上 */}
      <g stroke="rgba(44,38,28,.46)" strokeWidth={1}>
        <rect x={26} y={76} width={13} height={120} fill="var(--vol-deep)" />
        <rect x={161} y={76} width={13} height={120} fill="var(--vol-deep)" />
        <rect x={22} y={188} width={21} height={8} fill="#5d5445" />
        <rect x={157} y={188} width={21} height={8} fill="#5d5445" />
        <rect x={21} y={196} width={158} height={8} fill="#564e40" />
      </g>

      {/* 四、踏跺三级并两侧垂带 */}
      <g stroke="rgba(58,52,42,.32)" strokeWidth={1}>
        <rect x={30} y={204} width={140} height={6} fill="#cfc5aa" />
        <rect x={21} y={210} width={158} height={6} fill="#c6bb9d" />
        <rect x={12} y={216} width={176} height={6} fill="#bcb091" />
        <path d="M30,204 L12,222 M170,204 L188,222" fill="none" />
      </g>

      {/* 五、檐下：垫板一道托住出檐，板上露椽头数枚，两旁各一朵斗栱；
             再下是额枋，枋上缀两枚门簪 */}
      <rect x={26} y={53} width={148} height={14} fill="#4b4335" stroke="rgba(38,33,25,.6)" strokeWidth={0.8} />
      <g fill="rgba(249,244,229,.2)">
        {[34, 46, 58, 70, 82, 94, 106, 118, 130, 142, 154, 166].map((x) => (
          <rect key={x} x={x} y={56} width={4} height={8} rx={0.6} />
        ))}
      </g>
      <g fill="#9c927a" stroke="rgba(38,33,25,.45)" strokeWidth={0.8}>
        <rect x={36} y={55} width={22} height={4} />
        <rect x={42} y={59} width={10} height={6} />
        <rect x={142} y={55} width={22} height={4} />
        <rect x={148} y={59} width={10} height={6} />
      </g>
      <rect x={24} y={66} width={152} height={11} fill="var(--vol-deep)" stroke="rgba(44,38,28,.46)" strokeWidth={1} />
      <circle cx={52} cy={71.5} r={3} fill="rgba(249,244,229,.34)" />
      <circle cx={148} cy={71.5} r={3} fill="rgba(249,244,229,.34)" />
      <rect x={39} y={77} width={122} height={12} fill={`url(#${eaveShade})`} />

      {/* 六、瓦作：屋面起举折、两端翼角上翘、瓦垄数道、檐口一道瓦口线、正脊两头鸱吻 */}
      <path
        d="M66,24 H134 Q150,33 176,54 H24 Q50,33 66,24 Z"
        fill={`url(#${tile})`}
        stroke="rgba(38,33,25,.8)"
        strokeWidth={1}
      />
      <path
        d="M24,54 Q13,52 5,43 Q12,50 21,47 Z M176,54 Q187,52 195,43 Q188,50 179,47 Z"
        fill={`url(#${tile})`}
        stroke="rgba(38,33,25,.8)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      <g stroke="rgba(249,244,229,.24)" strokeWidth={1} fill="none">
        <path d="M76,27 L62,50" />
        <path d="M88,27 L81,50" />
        <path d="M100,27 V50" />
        <path d="M112,27 L119,50" />
        <path d="M124,27 L138,50" />
        <path d="M28,49.5 H172" strokeWidth={1.2} />
      </g>
      <path d="M64,23 H136" stroke="#2f2a20" strokeWidth={3.4} strokeLinecap="round" />
      <path
        d="M64,23 Q56,22 54,15 M136,23 Q144,22 146,15"
        stroke="#2f2a20"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />

      {/* 七、匾额：悬在额枋上，双钩一道边，内书部名 */}
      <g>
        <rect x={67} y={60} width={66} height={28} rx={2} fill="#f7f0dc" stroke="rgba(58,52,42,.5)" strokeWidth={1} />
        <rect x={70.5} y={63.5} width={59} height={21} rx={1} fill="none" stroke="rgba(58,52,42,.2)" strokeWidth={0.8} />
        {/* 匾额只有这么宽（内框 59），中文部名两字正好。英文一词七到十四个字母，
            照 15px 写必出匾外，故换小字并以 textLength 齐宽——四块匾一样长短，
            本也是匾该有的样子。中文一路不动，仍是原来那两个字。 */}
        <text className="sk-gate-name" x={100} y={79} textAnchor="middle"
          {...(lang === "en"
            ? { style: { fontSize: 9, letterSpacing: 0, textIndent: 0 }, textLength: 54, lengthAdjust: "spacingAndGlyphs" as const }
            : {})}>
          {t(name)}
        </text>
      </g>
    </svg>
  );
}

/**
 * 标朱：检索命中的字作朱色。
 *
 * 不用 innerHTML 去拼标签——正文是书上的字，拿字符串拼标记，书里哪天有个尖括号
 * 便出事。故自 `excerpt` 取回已分好的段，逐段出节点（见 sikuSearch 的 Part）。
 */
function Marked({ parts }: { parts: Part[] }) {
  return <>{parts.map((p, i) => (p.hit ? <mark key={i}>{p.s}</mark> : <span key={i}>{p.s}</span>))}</>;
}

/**
 * 书卡：作书观，不作卡观——左一道书脊，右一方绢面，绢面上贴一条竖写的题签。
 *
 * 绢面分色依文渊阁旧装：经绿、史红、子青、集灰，故未开书先知其在何部。
 * 书脊竖写部次一字，上下各一道订线。题签的长题缩字（见 .sk-vol-slip.sm/.xs），
 * 免得十几字的书名把签条顶出封面。可读者立得端正；仅著录者淡而钤「存目」小印，
 * 如同架上那部未请下架的书。
 */
function BookCard({ entry, onOpen }: { entry: SikuEntry; onOpen: () => void }) {
  const t = useT();
  const lang = useLang();
  const readable = !!entry.bookId;
  const len = entry.title.length;
  return (
    <button
      className="sk-vol"
      data-g={entry.group}
      onClick={readable ? onOpen : undefined}
      disabled={!readable}
      title={entry.title}
    >
      <span className="sk-vol-spine">{entry.group}</span>
      <span className="sk-vol-cover">
        <b className={`sk-vol-slip${len > 12 ? " xs" : len > 8 ? " sm" : ""}`}>{entry.title}</b>
        <small className="sk-vol-byline">
          {/* 代 · 著者 · 成书之年。年只二百八十五部考得出，无年者此处自然短一截，
              不补问号——书卡上一个问号，比留白更像是书出了错。 */}
          {[eraKey(entry.dynasty, lang), entry.author, yearText(entry.year, t)]
            .filter(Boolean).map((x) => t(x!)).join(" · ") || t("著者未详")}
        </small>
        <i className={`sk-vol-tail${readable ? "" : " stamp"}`}>
          {readable ? t("{n} 章 · 可读", { n: String(entry.chapters) }) : t("存目")}
        </i>
      </span>
    </button>
  );
}

/**
 * 书内：左列章目、中列正文、右列边批。章正文可请诸子批注。
 *
 * `wantLabel` 是自世界图带进来的回次（「第二十七回」）。不传章序而传回次，
 * 理由见 siku.ts 的 `chapterByLabel`——章序是分片生成的，回次是书上写定的。
 * 认不出便退回第一章，并在章目之上说一句「未检得」，不要静悄悄地开错一回。
 *
 * 右边那一列是后加的：从前正文只占中间一条，右侧空着。线装书的天头与行间本就是
 * 写批的地方，故把那条空白收作边批栏——选中一句即可注、可译（见 SikuMarginalia）。
 */
function BookReader({
  entry,
  wantLabel,
  wantN,
  wantText,
  onOpenClip,
}: {
  entry: SikuEntry;
  wantLabel?: string;
  /**
   * 要直落的章序。自检索结果点进来走这一口：片段本就记着自己出自第几片
   * （可引语料的 `n` 与分片序号同一套，见 sikuSearch），手上既有章序，
   * 便不必再绕回次去认——回次那一路是给世界图上的回目用的。
   */
  wantN?: number;
  /** 要在正文里标出的那一句原话（见本层 `initialHitText`） */
  wantText?: string;
  /** 书前影音栏里点中一条（片段或目录条目）——交给四库层开点评席 */
  onOpenClip?: (mediaId: string) => void;
}) {
  const t = useT();
  const lang = useLang();
  const [meta, setMeta] = useState<SikuMeta | null>(null);
  const [n, setN] = useState(1);
  const [ch, setCh] = useState<SikuChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  /** 带着回次进来却没对上号——这一句要显出来，不然读者以为书错了 */
  const [miss, setMiss] = useState<string | null>(null);
  /** 本章批过的片段，用来在正文里标朱 */
  const [snippets, setSnippets] = useState<{ anchor: string; text: string }[]>([]);
  /** 正文里点中的那一处朱标，边批栏据此把卡滚进视野 */
  const [focus, setFocus] = useState<string | null>(null);
  /** 书前影音栏是否展开。默认收着——来此是为读书，影音是旁参，不该先占了天头 */
  const [mediaOpen, setMediaOpen] = useState(false);

  /** 章目那一列。自图上跳进来时要把那一回滚进视野，故留个把手 */
  const tocRef = useRef<HTMLDivElement>(null);
  /** 正文那一栏。选区落在它里面才算数（见 SikuMarginalia） */
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entry.bookId) return;
    let live = true;
    setMeta(null);
    setMiss(null);
    loadMeta(entry.bookId).then(
      (m) => {
        if (!live) return;
        setMeta(m);
        const want = wantN ?? (wantLabel ? chapterByLabel(m, wantLabel) : null);
        setN(want ?? 1);
        if (wantLabel && !wantN && want === null) setMiss(`此书章目里未检得「${wantLabel}」，已开首章。`);
      },
      () => live && setErr("此书分片未取到。"),
    );
    return () => { live = false; };
  }, [entry.bookId, wantLabel, wantN]);

  // 《西游记》一百零二章、《资治通鉴》二百九十四章，章目是一条长列。自图上点
  // 「第二十七回」进来，若不滚这一下，左列停在第一回，看着就像没跳。
  // 只在带回次进来时滚一次；此后读者自己点章目，列便不该再被挪动。
  useEffect(() => {
    if (!meta || (!wantLabel && !wantN)) return;
    tocRef.current?.querySelector(".sk-toc-item.on")?.scrollIntoView({ block: "center" });
  }, [meta, wantLabel, wantN]);

  // 带着一句原话进来时，正文也要滚到那一句上——标了朱却在三屏之下，等于没标。
  useEffect(() => {
    if (!wantText || !ch) return;
    bodyRef.current?.querySelector("[data-hit]")?.scrollIntoView({ block: "center" });
  }, [wantText, ch]);

  useEffect(() => {
    if (!entry.bookId || !meta) return;
    let live = true;
    setLoading(true);
    setCh(null);
    loadChapter(entry.bookId, n).then(
      (c) => { if (live) { setCh(c); setLoading(false); } },
      () => { if (live) { setErr("此章未取到。"); setLoading(false); } },
    );
    return () => { live = false; };
  }, [entry.bookId, meta, n]);

  if (err) return <p className="intro">{t(err)}</p>;
  if (!meta) return <p className="intro">{t("书目载入中……")}</p>;

  const paras = (ch?.content ?? "").split("\n").filter(Boolean);
  const chapKey = ch ? chapterKey(meta.id, ch.n) : "";
  const source = ch ? `《${meta.title}·${ch.name.replace(/\s+/g, " ").trim()}》` : "";
  // 这一部书若挂有后世影音则列在书前；新增书没有影音时不显示此栏。
  // 一部片只出一行：片段以 adaptationId 指回其所出之片者，并入那一行（见 mergeMedia），
  // 不另算一种——故所计之数是「几部影音」，非「几条记录」。
  const media = entry.bookId
    ? mergeMedia(adaptationsOfBook(entry.bookId), clipsOfBook(entry.bookId))
    : { rows: [], loose: [] };
  const mediaCount = media.rows.length + media.loose.length;
  return (
    <div className="sk-reader">
      <div className="sk-toc" ref={tocRef}>
        <div className="sk-toc-head">
          {/* meta.json 是切书时生成的，里头没有年——年在目录上，故取 entry.year */}
          {[eraKey(meta.dynasty, lang), meta.author, yearText(entry.year, t)]
            .filter(Boolean).map((x) => t(x!)).join(" · ") || t("著者未详")}
          <br />
          {t("{part}部 · {category} · {n} 章", { part: t(meta.group), category: t(meta.category), n: meta.chapters.length })}
        </div>
        {meta.chapters.map((c) => (
          <button
            key={c.n}
            className={`sk-toc-item${c.n === n ? " on" : ""}`}
            onClick={() => setN(c.n)}
          >
            <span>{c.name}</span>
            <i>{c.chars > 999 ? `${(c.chars / 1000).toFixed(1)}k` : c.chars}</i>
          </button>
        ))}
      </div>
      <div className="sk-text" ref={bodyRef}>
        {miss && <p className="sk-miss">{miss}</p>}
        {/* 书前影音：一条细带，收着时只说有几种，展开才列。
            读的是这一部，看的便是这一部的演绎——不必另开一层去找。 */}
        {XMEDIA_ON && mediaCount > 0 && (
          <div className={`sk-bookfilm${mediaOpen ? " on" : ""}`}>
            <button className="sk-bookfilm-head" onClick={() => setMediaOpen((v) => !v)}>
              <span>{t("后世影音 · {n} 种", { n: mediaCount })}</span>
              <i>{mediaOpen ? t("收起") : t("展开")}</i>
            </button>
            {mediaOpen && (
              <div className="sk-bookfilm-body">
                {media.loose.map((c) => (
                  <button key={c.id} className="sk-bookfilm-clip" onClick={() => onOpenClip?.(c.id)}>
                    《{c.work}》（{c.kind}）——{c.text}
                    <i>{t("入点评席")}</i>
                  </button>
                ))}
                {media.rows.map(({ ad, scene }) => (
                  <AdapRow key={ad.id} a={ad} scene={scene} onOpen={(id) => onOpenClip?.(id)} />
                ))}
              </div>
            )}
          </div>
        )}
        {loading && <p className="intro">{t("正文载入中……")}</p>}
        {ch && (
          <>
            <h3>{ch.name}</h3>
            {paras.map((p, i) => (
              <p key={i}>{markSnippets(p, snippets, setFocus, t("看此句的边批"), wantText)}</p>
            ))}
            {/* 整章的批注仍留在正文之末：有些话是就通篇说的，落不到某一句上。
                逐句之批在右栏，两者各得其所，不相替代。 */}
            <div className="kg-nd-sec" style={{ marginTop: 18 }}>{t("通章批注")}</div>
            <AnnotPanel
              verseKey={`siku:${meta.id}:${ch.n}`}
              prompt={`客就《${meta.title}·${ch.name}》请批注，可援可驳。`}
            />
          </>
        )}
      </div>
      {ch && (
        // 换章即换一批边批，故以章为 key 整张重挂，免得上一章的卡留在栏里
        <SikuMarginalia
          key={chapKey}
          bodyRef={bodyRef}
          chapKey={chapKey}
          source={source}
          onSnippetsChange={setSnippets}
          focusAnchor={focus}
        />
      )}
    </div>
  );
}

/**
 * 在段里找那一句原话。
 *
 * 历史大事件的条文是摘录时裁过的（前缀重拼、截到六十余字），与书上原话未必字字相同，
 * 故整句找不着时退而找头一截，到十二字为止——再短就要误标别处了。
 */
function findHitSpan(para: string, hit: string): { at: number; len: number } | null {
  const h = hit.trim();
  for (let len = h.length; len >= 12; len = len > 24 ? 24 : len - 4) {
    const at = para.indexOf(h.slice(0, len));
    if (at >= 0) return { at, len };
    if (len <= 12) break;
  }
  return null;
}

/**
 * 在正文里把批过的句子标出来。
 *
 * 不标，批注就成了另一处的清单，读者看正文时不知道哪一句底下有话——批与所批之句
 * 断了联系。故按已落库的片段原文在段里找，找着即裹一层朱标，点它便跳到那张卡。
 *
 * 长的先匹配：短句常是长句的一截，先匹配短的会把长批切碎。重叠的只认先占住的那一个，
 * 不作嵌套——一句话上两重标记，读起来是花的。
 */
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
