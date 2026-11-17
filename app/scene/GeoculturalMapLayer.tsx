"use client";

import { useEffect, useMemo, useState } from "react";
import { pinyin } from "pinyin-pro";
import { GEO_ERAS, GEO_PLACES, GEO_ROUTES, type GeoEra } from "../world/culturalGeography";
import { useLang, useT } from "../i18n/lang";
import { CULTURAL_BASEMAP, culturalProject } from "../world/culturalBasemap";
import { CULTURAL_WORLD_BASEMAP, culturalWorldProject } from "../world/culturalWorldBasemap";
import { asset } from "../world/assetPath";

type DirectoryPerson = { id: string; name: string; year: number | null; dynasty: string; works: string[] };
type AtlasPerson = { id: string; name: string; nameEn?: string; era: string; year: number | null; works: string[]; worksEn?: string[]; source: string };
type AtlasBook = {
  id: string; title: string; titleEn?: string; author: string; authorEn?: string;
  era: string; dynasty: string; group: string; relation: string; readable: boolean;
  locationPerson?: string; locationPersonEn?: string; locationRole?: string;
  locationAddressType?: string; locationEvidence?: string; locationSourceUrl?: string;
};
type AtlasPlace = { id: string; name: string; nameEn?: string; lon: number; lat: number; people: AtlasPerson[]; books: AtlasBook[] };
type WesternBook = { id: string; worldLitId?: string; title: string; author: string; year: number; era: string; date: string; origin: string; category: string; readable?: boolean };
type WesternOrigin = { id: string; name: string; lon: number; lat: number; books: WesternBook[] };
type AtlasRoute = {
  id: string; scope: "china" | "world"; type: string; label: string; note: string; color: string; dash: string; arrow: boolean;
  from: { placeId: string; place: string; lon: number; lat: number; bookId: string; title: string; era: string };
  to: { placeId: string; place: string; lon: number; lat: number; bookId: string; title: string; era: string };
};
type AtlasIndex = {
  summary: {
    activePeople: number; mappedPeople: number; unresolvedPeople: number; historicalPlaces: number;
    chineseBooks: number; mappedChineseBooks: number; unresolvedChineseBooks: number;
    westernBooks: number; westernOrigins: number; readableWesternBooks?: number; allBooks: number;
  };
  places: AtlasPlace[];
  unresolved: { people: AtlasPerson[]; books: AtlasBook[] };
  westernOrigins: WesternOrigin[];
  routes: { chinese: AtlasRoute[]; western: AtlasRoute[] };
};

type Scope = "china" | "world";
type DetailTab = "people" | "books";

const ERA_NOTE: Record<GeoEra, string> = {
  全部: "全量接入人物、典籍及其地点证据；缩略时聚合，点选后展开具体条目",
  先秦: "诸子游说与地域文化并起：齐鲁儒学、河洛道家与楚地文学",
  秦汉: "帝国都城汇聚经学、史学与国家典藏，地方知识进入统一叙事",
  魏晋南北朝: "衣冠南渡重塑文化空间，玄学、文学与士族交游转向江南",
  隋唐: "长安连接丝路译场、科举文教与文人迁徙，形成跨区域知识枢纽",
  宋元: "文化重心随南渡南移，书院讲学与雕版印刷扩大理学传播",
  明清: "都城编纂、江南出版、地方讲会与口岸翻译共同构成多中心网络",
  近现代: "大学、报刊、出版和跨国港口把思想转化为公共议题与社会行动",
};

const ERA_COLOR: Record<string, string> = {
  先秦: "#8b4938", 秦汉: "#9c6838", 魏晋南北朝: "#6e765b", 隋唐: "#a3573f",
  宋元: "#496a70", 明清: "#6b5671", 近现代: "#315e72", 年代未详: "#817969",
};
const ROUTE_COLOR = { 传承: "#8f3e32", 迁徙: "#3f6670", 刊刻传播: "#6f7444", 中西转译: "#8a6235" } as const;
const LINEAGE_LEGEND = [
  ["传注", "#7a5c3a"], ["承学", "#3f6f6a"], ["取材", "#9a7a2e"], ["非难", "#9c3f2f"],
  ["并称", "#7a5aa0"], ["相续", "#4a5a8a"], ["依托", "#6b6f78"],
] as const;
const eraMatch = (value: string, era: GeoEra) => era === "全部" || value === era;
const placeSlice = (place: AtlasPlace, era: GeoEra) => ({
  people: place.people.filter((p) => eraMatch(p.era, era)),
  books: place.books.filter((b) => eraMatch(b.era, era)),
});
const romanize = (value: string) => pinyin(String(value || ""), { toneType: "none", type: "array", nonZh: "consecutive" })
  .join(" ").replace(/\s*([:：,，;；()（）/／])\s*/g, "$1 ").replace(/\s+/g, " ").trim()
  .replace(/(^|[\s(/])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`);

function AtlasDetail({ name, nameEn, people, books, tab, setTab, note, onOpenBook }: {
  name: string; nameEn?: string; people: AtlasPerson[]; books: AtlasBook[]; tab: DetailTab;
  setTab: (tab: DetailTab) => void; note?: string; onOpenBook?: (bookId: string) => void;
}) {
  const t = useT();
  const uiLang = useLang();
  const local = (value: string, fallback?: string) => {
    if (uiLang !== "en") return value;
    const direct = t(value); if (direct !== value) return direct;
    const wrapped = `《${value}》`; const bookTitle = t(wrapped); if (bookTitle !== wrapped) return bookTitle;
    return fallback || value;
  };
  return <aside className="gm-detail gm-atlas-detail">
    <header><p>{t(note || "人物—典籍—地点关联")}</p><h2>{local(name, nameEn)}</h2><small>{t("按当前朝代筛选")}</small></header>
    <div className="gm-detail-tabs">
      <button className={tab === "people" ? "on" : ""} onClick={() => setTab("people")}>{t("人物")}<b>{people.length}</b></button>
      <button className={tab === "books" ? "on" : ""} onClick={() => setTab("books")}>{t("典籍")}<b>{books.length}</b></button>
    </div>
    <div className="gm-detail-scroll gm-atlas-list">
      {tab === "people" ? people.map((p) => <article key={p.id}>
        <div className="gm-atlas-title"><b>{local(p.name, p.nameEn)}</b><span>{t(p.era)}{p.year ? ` · ${p.year}` : ""}</span></div>
        <p>{p.works.length ? p.works.slice(0, 3).map((x, i) => `《${local(x, p.worksEn?.[i])}》`).join(" · ") : t("著述目录待补")}</p>
        <small>{t(p.source)}</small>
      </article>) : books.map((b) => <article key={b.id} title={b.locationEvidence} className={b.readable ? "gm-readable-book" : ""} role={b.readable ? "button" : undefined} tabIndex={b.readable ? 0 : undefined} onClick={b.readable ? () => onOpenBook?.(b.id) : undefined} onKeyDown={b.readable ? (e) => { if (e.key === "Enter" || e.key === " ") onOpenBook?.(b.id); } : undefined}>
        <div className="gm-atlas-title"><b>《{local(b.title, b.titleEn)}》</b><span>{t(b.group)} · {t(b.dynasty)}</span></div>
        <p>{local(b.author, b.authorEn)}</p><small>{t(b.relation)}{b.locationPerson ? ` · ${local(b.locationPerson, b.locationPersonEn)}` : ""}{b.readable ? ` · ${t("打开正文")} →` : ""}</small>
      </article>)}
      {((tab === "people" && !people.length) || (tab === "books" && !books.length)) && <p className="gm-empty">{t("当前筛选下没有条目")}</p>}
    </div>
  </aside>;
}

function WesternDetail({ origin, era, selectedBookId, onOpenBook }: { origin: WesternOrigin | null; era: GeoEra; selectedBookId?: string; onOpenBook?: (bookId: string) => void }) {
  const t = useT();
  const uiLang = useLang();
  const local = (value: string, fallback?: string) => uiLang === "en" ? (t(value) === value ? fallback || value : t(value)) : value;
  const books = origin?.books.filter((b) => eraMatch(b.era, era)) ?? [];
  return <aside className="gm-detail gm-atlas-detail">
    <header><p>{t("西方代表性典籍 · 来源地聚合")}</p><h2>{t(origin?.name || "世界典籍")}</h2><small>{t("来源地表示文化归属，不等于唯一成书坐标")}</small></header>
    <div className="gm-detail-scroll gm-atlas-list">
      {[...books].sort((a, b) => Number(b.id === selectedBookId) - Number(a.id === selectedBookId)).map((b) => <article key={b.id} className={`${b.readable ? "gm-readable-book" : ""} ${b.id === selectedBookId ? "gm-selected-book" : ""}`} role={b.readable ? "button" : undefined} tabIndex={b.readable ? 0 : undefined} onClick={b.readable ? () => onOpenBook?.(b.worldLitId || b.id) : undefined} onKeyDown={b.readable ? (e) => { if (e.key === "Enter" || e.key === " ") onOpenBook?.(b.worldLitId || b.id); } : undefined}>
        <div className="gm-atlas-title"><b>《{t(b.title)}》</b><span>{uiLang === "en" ? `${b.year < 0 ? `c. ${Math.abs(b.year)} BCE` : `c. ${b.year} CE`}` : t(b.date)}</span></div>
        <p>{t(b.author)}</p><small>{t(b.category)} · {t(b.origin)}{b.readable ? ` · ${t("打开正文")} →` : ""}</small>
      </article>)}
      {!books.length && <p className="gm-empty">{t("当前筛选下没有条目")}</p>}
    </div>
  </aside>;
}

export default function GeoculturalMapLayer({ onClose, onOpenSiku, onOpenWorldBook }: {
  onClose: () => void; onOpenSiku?: (bookId: string) => void; onOpenWorldBook?: (bookId: string) => void;
}) {
  const t = useT();
  const uiLang = useLang();
  const local = (value: string, fallback?: string) => {
    if (uiLang !== "en") return value;
    const direct = t(value); if (direct !== value) return direct;
    const wrapped = `《${value}》`; const bookTitle = t(wrapped); if (bookTitle !== wrapped) return bookTitle;
    return fallback || value;
  };
  const [era, setEra] = useState<GeoEra>("全部");
  const [scope, setScope] = useState<Scope>("china");
  const [showRoutes, setShowRoutes] = useState(true);
  const [atlas, setAtlas] = useState<AtlasIndex | null>(null);
  const [atlasError, setAtlasError] = useState(false);
  const [selected, setSelected] = useState("");
  const [selectedWesternBook, setSelectedWesternBook] = useState("");
  const [pending, setPending] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("people");
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [directory, setDirectory] = useState<DirectoryPerson[] | null>(null);
  const [directoryError, setDirectoryError] = useState(false);
  const [directoryQuery, setDirectoryQuery] = useState("");

  useEffect(() => {
    let live = true;
    fetch(asset("/data/geocultural-index.json"))
      .then((r) => { if (!r.ok) throw new Error("atlas unavailable"); return r.json() as Promise<AtlasIndex>; })
      .then((data) => { if (live) { setAtlas(data); setSelected(data.places[0]?.id || ""); } })
      .catch(() => { if (live) setAtlasError(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!directoryOpen || directory) return;
    let live = true;
    fetch(asset("/data/persona-directory.json"))
      .then((r) => { if (!r.ok) throw new Error("directory unavailable"); return r.json() as Promise<DirectoryPerson[]>; })
      .then((rows) => { if (live) setDirectory(rows); })
      .catch(() => { if (live) setDirectoryError(true); });
    return () => { live = false; };
  }, [directoryOpen, directory]);

  const directoryMatches = useMemo(() => {
    const q = directoryQuery.trim().toLowerCase();
    if (!directory) return [];
    return q ? directory.filter((p) => `${p.name} ${p.dynasty} ${p.works.join(" ")}`.toLowerCase().includes(q)) : directory;
  }, [directory, directoryQuery]);
  const curatedPlaces = useMemo<AtlasPlace[]>(() => GEO_PLACES.map((place) => {
    const people = new Map<string, AtlasPerson>();
    const books = new Map<string, AtlasBook>();
    for (const record of place.records) {
      for (const name of record.people) if (!people.has(`${record.era}:${name}`)) people.set(`${record.era}:${name}`, {
        id: `curated-person:${place.id}:${record.era}:${name}`, name, nameEn: romanize(name), era: record.era, year: null,
        works: record.books.map((x) => x.replace(/[《》]/g, "")), worksEn: record.books.map((x) => romanize(x.replace(/[《》]/g, ""))), source: "核心策展史料场景",
      });
      for (const title of record.books) if (!books.has(`${record.era}:${title}`)) books.set(`${record.era}:${title}`, {
        id: `curated-book:${place.id}:${record.era}:${title}`, title: title.replace(/[《》]/g, ""), titleEn: romanize(title.replace(/[《》]/g, "")), author: "策展关联",
        era: record.era, dynasty: record.date, group: "策展", relation: `${record.activity}地点`, readable: false,
      });
    }
    return { id: `curated-${place.id}`, name: place.name, nameEn: romanize(place.name), lon: place.lon, lat: place.lat, people: [...people.values()], books: [...books.values()] };
  }), []);
  const mergedChinaPlaces = useMemo(() => {
    const merged = new Map<string, AtlasPlace>();
    for (const place of [...curatedPlaces, ...(atlas?.places ?? [])]) {
      const current = merged.get(place.id);
      if (!current) { merged.set(place.id, place); continue; }
      const people = new Map(current.people.map((person) => [person.id, person]));
      for (const person of place.people) people.set(person.id, person);
      const books = new Map(current.books.map((book) => [`${book.era}:${book.title}`, book]));
      for (const book of place.books) books.set(`${book.era}:${book.title}`, book);
      merged.set(place.id, { ...current, ...place, people: [...people.values()], books: [...books.values()] });
    }
    return [...merged.values()];
  }, [atlas, curatedPlaces]);
  const chinaPlaces = useMemo(() => mergedChinaPlaces.filter((p) => {
    const sliced = placeSlice(p, era); return sliced.people.length || sliced.books.length;
  }), [mergedChinaPlaces, era]);
  const westernOrigins = useMemo(() => (atlas?.westernOrigins ?? []).filter((o) => o.books.some((b) => eraMatch(b.era, era))), [atlas, era]);
  const westernBookPoints = useMemo(() => westernOrigins.flatMap((origin) => {
    const base = culturalWorldProject(origin.lon, origin.lat);
    return origin.books.filter((book) => eraMatch(book.era, era)).map((book, index) => {
      const ring = Math.floor(index / 8);
      const radius = 15 + ring * 9;
      const angle = index * 2.399963229728653;
      return { origin, book, x: base.x + Math.cos(angle) * radius, y: base.y + Math.sin(angle) * radius };
    });
  }), [westernOrigins, era]);
  const selectedChina = chinaPlaces.find((p) => p.id === selected) ?? chinaPlaces[0] ?? null;
  const selectedWest = westernOrigins.find((p) => p.id === selected) ?? westernOrigins[0] ?? null;
  const chinaDetail = selectedChina ? placeSlice(selectedChina, era) : { people: [], books: [] };
  const pendingDetail = atlas ? {
    people: atlas.unresolved.people.filter((p) => eraMatch(p.era, era)),
    books: atlas.unresolved.books.filter((b) => eraMatch(b.era, era)),
  } : { people: [], books: [] };
  const byCuratedId = useMemo(() => new Map(GEO_PLACES.map((p) => [p.id, p])), []);
  const routes = useMemo(() => GEO_ROUTES.filter((r) => era === "全部" || r.era === era), [era]);

  useEffect(() => {
    const list = scope === "china" ? chinaPlaces : westernOrigins;
    if (!list.some((p) => p.id === selected)) setSelected(list[0]?.id || "");
    setPending(false);
    if (scope !== "world") setSelectedWesternBook("");
  }, [scope, era, chinaPlaces, westernOrigins, selected]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (uiLang === "en" && selected.startsWith("cbdb-place-")) setSelected(curatedPlaces[0]?.id || selected);
  }, [uiLang, selected, curatedPlaces]);

  const summary = atlas?.summary;
  return <div className="gm-stage" role="dialog" aria-modal="true" aria-label={t("时空文脉地图")}>
    <header className="gm-head">
      <div className="gm-brand"><i>舆</i><div><p>{t("时间进入空间，文脉落于山河")}</p><h1>{t("时空文脉地图")}</h1></div></div>
      <div className="gm-head-stat"><span><b>{summary?.historicalPlaces ?? "…"}</b>{t("史料地点")}</span><span><b>{summary?.activePeople ?? "…"}</b>{t("人物")}</span><span><b>{summary?.allBooks ?? "…"}</b>{t("中西典籍")}</span><span><b>{summary?.westernBooks ?? "…"}</b>{t("西方典籍")}</span></div>
      <button className="gm-directory-open" onClick={() => setDirectoryOpen(true)}>{t("历代人物总目")}</button><button className="stage-close" onClick={onClose} aria-label={t("关闭")}>×</button>
    </header>
    <nav className="gm-era" aria-label={t("选择朝代")}>{GEO_ERAS.map((x) => <button key={x} className={era === x ? "on" : ""} onClick={() => setEra(x)}><i />{t(x)}</button>)}</nav>
    <div className="gm-intro"><div><b>{t(era)}</b><p>{t(ERA_NOTE[era])}</p></div><div className="gm-scope"><button className={scope === "china" ? "on" : ""} onClick={() => setScope("china")}>{t("中国细看")}</button><button className={scope === "world" ? "on" : ""} onClick={() => setScope("world")}>{t("世界总览")}</button></div>{scope === "china" && <button className={showRoutes ? "on" : ""} onClick={() => setShowRoutes((v) => !v)}><i />{t("思想路径")}</button>}</div>

    <main className="gm-main">
      <section className="gm-map-wrap">
        {atlasError ? <div className="gm-load-error">{t("地图索引暂未载入，请稍后重试。")}</div> : scope === "china" ?
          <svg className="gm-map gm-atlas-map" viewBox="0 0 1000 720" role="img" aria-label={t("中国人物与典籍地理分布图")}>
            <defs><marker id="gm-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" fill="context-stroke" /></marker></defs>
            {CULTURAL_BASEMAP.map((feature) => <path key={feature.name} className={feature.name === "China" || feature.name === "Taiwan" ? "gm-land" : "gm-neighbor"} d={feature.path} />)}
            {[80, 90, 100, 110, 120, 130].map((lon) => { const pt = culturalProject(lon, 54); return <g key={lon} className="gm-grid"><path d={`M${pt.x} 53V650`} /><text x={pt.x + 4} y="68">{lon}°E</text></g>; })}
            {[20, 30, 40, 50].map((lat) => { const pt = culturalProject(72, lat); return <g key={lat} className="gm-grid"><path d={`M45 ${pt.y}H960`} /><text x="49" y={pt.y - 5}>{lat}°N</text></g>; })}
            {showRoutes && (atlas?.routes.chinese ?? []).filter((route) => era === "全部" || route.from.era === era || route.to.era === era).map((route, i) => { const a = culturalProject(route.from.lon, route.from.lat); const b = culturalProject(route.to.lon, route.to.lat); const bend = 18 + (i % 5) * 7; const d = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - bend} ${b.x} ${b.y}`; return <g className="gm-lineage-route" key={route.id} style={{ "--route": route.color, "--dash": route.dash, "--delay": `${-(i % 10) * .38}s` } as React.CSSProperties}><path d={d} markerEnd={route.arrow ? "url(#gm-arrow)" : undefined} /><circle className="gm-route-spark" r="1.7"><animateMotion dur={`${4.8 + (i % 5) * .55}s`} begin={`${-(i % 7) * .7}s`} repeatCount="indefinite" path={d} /></circle><title>{uiLang === "en" ? `${t(route.label)} · ${local(route.from.title)} → ${local(route.to.title)}` : `${route.label} · 《${route.from.title}》→《${route.to.title}》：${route.note}`}</title></g>; })}
            {showRoutes && routes.map((r, i) => { const a = byCuratedId.get(r.from); const b = byCuratedId.get(r.to); if (!a || !b) return null; const pa = culturalProject(a.lon, a.lat); const pb = culturalProject(b.lon, b.lat); const d = `M ${pa.x} ${pa.y} Q ${(pa.x + pb.x) / 2} ${Math.min(pa.y, pb.y) - 32 - (i % 3) * 8} ${pb.x} ${pb.y}`; return <g className="gm-route" key={`${r.era}-${r.from}-${r.to}`} style={{ "--route": ROUTE_COLOR[r.rel] } as React.CSSProperties}><path d={d} markerEnd="url(#gm-arrow)" /><title>{`${t(r.era)} · ${t(r.label)}`}</title></g>; })}
            {chinaPlaces.map((p) => { const data = placeSlice(p, era); const total = data.people.length + data.books.length; const dominant = data.people[0]?.era || data.books[0]?.era || "年代未详"; const active = !pending && selectedChina?.id === p.id; const pt = culturalProject(p.lon, p.lat); const r = Math.min(11, 2.4 + Math.log2(total + 1)); const placeName = local(p.name, p.nameEn); return <g key={p.id} className={`gm-atlas-place ${active ? "on" : ""}`} transform={`translate(${pt.x} ${pt.y})`} style={{ "--pin": ERA_COLOR[dominant] } as React.CSSProperties} role="button" tabIndex={0} onClick={() => { setPending(false); setSelected(p.id); }} onKeyDown={(e) => { if (e.key === "Enter") { setPending(false); setSelected(p.id); } }}><circle className="gm-atlas-halo" r={active ? r + 9 : r + 3} /><circle className="gm-atlas-dot" r={active ? r + 2 : r} /><g className="gm-atlas-label" transform="translate(10 -12)"><rect x="0" y="-14" width={Math.max(74, placeName.length * (uiLang === "en" ? 8 : 16) + 24)} height="31" rx="3" /><text x="8" y="0">{placeName}</text><text className="count" x="8" y="12">{data.people.length}{t("人")} · {data.books.length}{t("书")}</text></g><title>{`${placeName} · ${data.people.length}${t("人")} · ${data.books.length}${t("书")}`}</title></g>; })}
            <g className="gm-compass" transform="translate(894 92)"><circle r="37" /><path d="M0 -30 L7 0 0 30 -7 0 Z" /><path className="red" d="M0 -30 L7 0 0 6 Z" /><text y="-43">{t("北")}</text><text y="55">{t("南")}</text></g><text className="gm-map-note" x="48" y="690">{t("地点证据：CBDB／CHGIS／史地记录／Wikidata · 底图：Natural Earth")}</text>
          </svg> :
          <svg className="gm-map gm-world-map" viewBox="0 0 1000 720" role="img" aria-label={t("中西典籍世界来源图")}>
            <defs><marker id="gm-world-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" fill="context-stroke" /></marker></defs>
            {CULTURAL_WORLD_BASEMAP.map((feature) => <path key={feature.name} className={feature.name === "China" ? "gm-world-china" : "gm-world-land"} d={feature.path} />)}
            {(atlas?.routes.western ?? []).filter((route) => era === "全部" || route.from.era === era || route.to.era === era).map((route, i) => { const a = culturalWorldProject(route.from.lon, route.from.lat); const b = culturalWorldProject(route.to.lon, route.to.lat); const bend = 18 + (i % 5) * 7; const d = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - bend} ${b.x} ${b.y}`; return <g className="gm-lineage-route" key={route.id} style={{ "--route": route.color, "--dash": route.dash, "--delay": `${-(i % 10) * .38}s` } as React.CSSProperties}><path d={d} markerEnd={route.arrow ? "url(#gm-world-arrow)" : undefined} /><circle className="gm-route-spark" r="1.9"><animateMotion dur={`${5.2 + (i % 5) * .65}s`} begin={`${-(i % 7) * .8}s`} repeatCount="indefinite" path={d} /></circle><title>{`${route.label} · 《${route.from.title}》→《${route.to.title}》：${route.note}`}</title></g>; })}
            {westernBookPoints.map(({ origin, book, x, y }, index) => { const active = selectedWesternBook === book.id; return <g key={`${origin.id}-${book.id}`} className={`gm-world-book-point ${book.readable ? "readable" : "catalogued"} ${active ? "on" : ""}`} transform={`translate(${x} ${y})`} onClick={(event) => { event.stopPropagation(); setSelected(origin.id); setSelectedWesternBook(book.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { setSelected(origin.id); setSelectedWesternBook(book.id); } }} role="button" tabIndex={0}><circle className="gm-world-book-pulse" r={book.readable ? 5.6 : 4.5} style={{ animationDelay: `${-(index % 11) * .27}s` }} /><circle className="gm-world-book-core" r={book.readable ? 3.1 : 2.4} /><title>{`${t(book.title)} · ${t(book.author)} · ${book.readable ? t("可读正文") : t("目录著录")}`}</title></g>; })}
            {westernOrigins.map((o) => { const books = o.books.filter((b) => eraMatch(b.era, era)); const pt = culturalWorldProject(o.lon, o.lat); const active = selectedWest?.id === o.id; const r = Math.min(13, 4 + Math.log2(books.length + 1)); return <g key={o.id} className={`gm-world-origin ${active ? "on" : ""}`} transform={`translate(${pt.x} ${pt.y})`} onClick={() => { setSelected(o.id); setSelectedWesternBook(""); }} role="button" tabIndex={0}><circle className="gm-atlas-halo" r={active ? r + 10 : r + 4} /><circle className="gm-atlas-dot" r={active ? r + 2 : r} /><g className="gm-atlas-label" transform="translate(12 -13)"><rect x="0" y="-14" width={Math.max(76, t(o.name).length * 15 + 24)} height="31" rx="3" /><text x="8" y="0">{t(o.name)}</text><text className="count" x="8" y="12">{books.length}{t("部")}</text></g><title>{`${t(o.name)} · ${books.length}${t("部")}`}</title></g>; })}
            <g className="gm-china-aggregate" transform={`translate(${culturalWorldProject(104, 35).x} ${culturalWorldProject(104, 35).y})`}><circle r="20" /><circle r="8" /><text x="25" y="-3">{t("中国典籍")}</text><text className="count" x="25" y="13">{summary?.chineseBooks ?? 1019}{t("部")} · {summary?.activePeople ?? 1500}{t("人")}</text></g><text className="gm-map-note" x="48" y="690">{t("世界总览按文化来源地聚合；多来源典籍取组合节点，不推定单一成书坐标")}</text>
          </svg>}
        {scope === "china" && atlas && <button className={`gm-pending ${pending ? "on" : ""}`} onClick={() => setPending(true)}><b>{t("地点待考")}</b><span>{pendingDetail.people.length}{t("人")} · {pendingDetail.books.length}{t("书")}</span></button>}
        <div className="gm-legend gm-lineage-legend">{scope === "world" && <><span className="gm-book-legend readable"><i />{summary?.readableWesternBooks ?? 57}{t("部可读")}</span><span className="gm-book-legend catalogued"><i />{(summary?.westernBooks ?? 78) - (summary?.readableWesternBooks ?? 57)}{t("部著录")}</span></>}{LINEAGE_LEGEND.map(([label, color]) => <span key={label}><i style={{ background: color }} />{t(label)}</span>)}</div>
      </section>
      {scope === "china" ? <AtlasDetail name={pending ? "地点待考" : selectedChina?.name || "载入中"} nameEn={pending ? undefined : selectedChina?.nameEn} people={pending ? pendingDetail.people : chinaDetail.people} books={pending ? pendingDetail.books : chinaDetail.books} tab={detailTab} setTab={setDetailTab} note={pending ? "尚无可靠坐标，保留在全量索引中" : "CBDB索引地址 · CHGIS坐标"} onOpenBook={onOpenSiku} /> : <WesternDetail origin={selectedWest} era={era} selectedBookId={selectedWesternBook} onOpenBook={onOpenWorldBook} />}
    </main>

    <footer className="gm-foot"><p><b>{t("读图方法")}</b>{t("总览显示聚合数量；点地点展开人物与典籍。没有可靠位置的条目保留在“地点待考”，不虚构坐标。")}</p><span>{t("全量索引 · CBDB／CHGIS／典籍目录")}</span></footer>
    {directoryOpen && <div className="gm-directory-backdrop" onClick={() => setDirectoryOpen(false)}><section className="gm-directory" onClick={(e) => e.stopPropagation()} aria-label={t("历代人物总目")}><header><div><small>{t("中国历代人物 · 著述索引")}</small><h2>{t("历代人物总目")}</h2></div><button onClick={() => setDirectoryOpen(false)} aria-label={t("关闭")}>×</button></header><p>{directoryError ? t("人物目录暂未载入，请稍后重试。") : t("共 {n} 位人物；有年代的可按时代检索，年代未详者保留在总目中。", { n: directory?.length ?? "…" })}</p><input value={directoryQuery} onChange={(e) => setDirectoryQuery(e.target.value)} placeholder={t("搜索人名、朝代或著述")} autoFocus /><small className="gm-directory-count">{t("匹配 {n} 位 · 显示前 100 位", { n: directoryMatches.length })}</small><div className="gm-directory-list">{directoryMatches.slice(0, 100).map((p) => <article key={p.id}><b>{p.name}</b><small>{p.dynasty}{p.year ? ` · ${p.year}` : ""}</small><span>{p.works.slice(0, 3).join(" · ")}</span></article>)}</div></section></div>}
  </div>;
}
