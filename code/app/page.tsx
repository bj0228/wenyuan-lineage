"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { scholars, scholarMap, portraitOf, LVBUWEI } from "./world/characters";
import { asset } from "./world/assetPath";
import { regions, regionMap } from "./world/regions";
import {
  TICKS_PER_DAY,
  INITIAL_CLIMATE,
  advanceClimate,
  agendaFor,
  eventsInRegion,
  formatWorldTime,
  nextEventFor,
  worldStateAt,
  type Presence,
} from "./world/schedule";
import { retrieve, retrievePreferFull, retrieveFull, embedQuery, type Retrieved, type FullHit } from "./world/canon";
import { loadAllWorks } from "./world/canonSource";
import { canonFullMap, type FlatVerse } from "./world/canonFull";
import { composeAnswerLLM, translateToVernacular, verifyAndRepairConsistency, type Verdict } from "./world/dialogue";
import { computePositions, nearbyOf, nearestRegionId, type Override } from "./world/placement";
import DialogueStage from "./scene/DialogueStage";
import DebateStage from "./scene/DebateStage";
import VerdictBadge from "./scene/VerdictBadge";
import AnthologyPanel from "./scene/AnthologyPanel";
import SpeakButton from "./scene/SpeakButton";
import TraceableEvidence from "./scene/TraceableEvidence";
import BulletinBoard from "./scene/BulletinBoard";
import QuizLayer from "./scene/QuizLayer";
import SealsLayer from "./scene/SealsLayer";
import { useAnthology } from "./world/anthology";
import { useSeals, buildSeal } from "./world/seals";
import { dailyQuestFor, huibingChoicesFor } from "./world/dailyQuest";
import { useWorldDay, bumpWorldDay, worldDayKey } from "./world/worldDay";
import { useUser, USER_DEFAULT_NAME } from "./world/user";
import { useTitles, titleForStreak } from "./world/titles";
import UserPanel from "./scene/UserPanel";
import TourIndexPanel from "./scene/TourIndexPanel";
import TourLayer, { SIKU_FROM_GATES, type TourPanel, type TourAct, type SikuAsk, type WlAsk } from "./scene/TourLayer";
import LanguageGate from "./scene/LanguageGate";
import { useTourSeen, markSeen, resetTour, hasTourHistory, type TourChapter } from "./world/tour";
import LineageMap from "./scene/LineageMap";
import MarketView from "./scene/MarketView";
import { useInventory, ITEMS, type ItemId } from "./world/inventory";
import { recordMemory } from "./world/memory";
import { useAffinity, userAffOf, affinityDesc } from "./world/affinity";
import { decideAction } from "./world/autonomy";
import CanonGraphLayer from "./scene/CanonGraphLayer";
import CanonGraphThumb from "./scene/CanonGraphThumb";
import SikuLayer from "./scene/SikuLayer";
import SikuScrollLayer from "./scene/SikuScrollLayer";
import MotifLayer from "./scene/MotifLayer";
import CrossMediaLayer from "./scene/CrossMediaLayer";
import XiyouLayer from "./scene/XiyouLayer";
import CompassLayer from "./scene/CompassLayer";
import WorldLitLayer from "./scene/WorldLitLayer";
import ChronicleLayer from "./scene/ChronicleLayer";
import ChronicleBadge from "./scene/ChronicleBadge";
import GeoculturalMapLayer from "./scene/GeoculturalMapLayer";
import type { WorldId, Bearing, Part } from "./world/worlds";
import VerseCard from "./scene/VerseCard";
import ScholarShelf from "./scene/ScholarShelf";
import { hasSavedLang, setLang, useLangBoot, useT, type Lang } from "./i18n/lang";
import { XMEDIA_ON } from "./world/feature-flags";
import { useTAction, useTActionBare } from "./i18n/action";
import LangToggle from "./i18n/LangToggle";
import Said from "./i18n/Said";

/** 三维画布加载期那一行字。另立一个组件而非就地写死，是因为它要查词表（钩子只能在组件里调）。 */
function SceneLoading() {
  const t = useT();
  return <div className="scene-loading">{t("正在铺展天下……")}</div>;
}

// WebGL 只能在浏览器端初始化，故禁用 SSR
const WorldScene = dynamic(() => import("./scene/WorldScene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function tickLabel(tick: number) {
  const { clock } = formatWorldTime(tick);
  return clock;
}

/** 真实日期 YYYY-MM-DD（印章「得印当日」显示用）。new Date() 在模块作用域函数内、非组件 render 词法域，故可于 render 期调用而不触 react-hooks/purity。 */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TALK_SUGGESTIONS = ["如何看待人性？", "何以治国？", "战争可否有正当？", "学与思孰重？"];

type TalkMsg = {
  mine: boolean;
  text: string;
  citations?: Retrieved[];
  inferred?: boolean;
  /** 流式作答中：逐字回填时为 true，完成置 false */
  streaming?: boolean;
  /** 右键译为白话：缓存译文；vernShow 控制显隐，vernLoading/vernError 表作答中/失败 */
  vernacular?: string;
  vernLoading?: boolean;
  vernShow?: boolean;
  vernError?: boolean;
  /** 一致性校验：id 稳定回填；verifying 作答中；verdict/verdictNote 判定与理由；
   *  verdictModel/verdictCross 记是谁判的、算不算异源外证 */
  id?: number;
  verifying?: boolean;
  verdict?: Verdict;
  verdictNote?: string;
  verdictModel?: string;
  verdictCross?: boolean;
};

export default function Home() {
  // 界面语言：挂载后自 localStorage 取回上次所选；`t` 中文模式为恒等函数（见 i18n/lang.ts）。
  // `tAction`/`tActionBare` 另管那句「此刻正在做什么」——它是拼出来的，不是一条词（见 i18n/action.ts）。
  useLangBoot();
  const t = useT();
  const tAction = useTAction();
  const tActionBare = useTActionBare();
  // 首次访问先选语言，再放行自动导览；旧用户凭语言偏好或导览记录直接进入。
  const [languageGateOpen, setLanguageGateOpen] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [selectedId, setSelectedId] = useState("kong");
  const [panel, setPanel] = useState<"profile" | "debate" | "canon" | "yulu">("profile");
  const [canonQuery, setCanonQuery] = useState("");
  // 典籍阅读器：选中的书（null=书目架）；全文检索异步结果
  const [canonBookId, setCanonBookId] = useState<string | null>(null);
  const [canonFullHits, setCanonFullHits] = useState<FullHit[]>([]);
  const [canonFullLoading, setCanonFullLoading] = useState(false);
  // 语录（竹简）：localStorage 持久；page 持有唯一 hook，供 DebateStage onArchive 与 AnthologyPanel 同源
  const [yuluEntries, { add: addEntry, remove: removeYulu }] = useAnthology();

  // 印章（游学题／经义小考所得）：localStorage 持久，公告栏点开展开来由
  const [seals, sealsApi] = useSeals();
  // 游学者（顶栏头像·可改名）与称号（连对解锁）：localStorage 持久，SSR/首帧稳定空快照
  const [user, { setName: setUserName }] = useUser();
  const [titles, titlesApi] = useTitles();
  // 连对：会话态，错即归 0；达称号阈值即解锁（持久）并记世界纪事
  const [streak, setStreak] = useState(0);
  // 游学题按「世界日」换题：世界时辰轮转一轮（96 刻 ≈ 3.2 分）即推进一日、换下一题，
  // 序号持久化于 localStorage、跨刷新续计。SSR/首帧恒为 0（与 seals 同的 useSyncExternalStore 模式），
  // 故公告栏题面于服务端与客户端首帧一致、不触 hydration mismatch；hydration 后读真实序号。
  const worldDay = useWorldDay();
  // today 仍记真实日期，仅作印章「得印当日」的显示；游学题日种改用世界日序号串。
  const today = todayStr();
  const quest = useMemo(() => dailyQuestFor(worldDayKey(worldDay)), [worldDay]);
  const [rawQuestPhase, setRawQuestPhase] = useState<"idle" | "accepted">("idle");
  const doneThisDay = seals.some((s) => s.source === "游学" && s.worldDay === worldDay);
  const questPhase = doneThisDay ? "done" : rawQuestPhase;
  // 游学咨询：点地图诸子即冒头顶复诵气泡（同步、无网络）；点吕不韦开回禀浮层
  const [consult, setConsult] = useState<{ id: string; text: string } | null>(null);
  // 公告栏开出的浮层：小考／印章册／回禀
  const [qlayer, setQlayer] = useState<null | "quiz" | "seals" | "huibing" | "user">(null);
  // 百家演变脉络全页图（顶栏钮唤起）
  const [lineageOpen, setLineageOpen] = useState(false);
  // 典籍知识图谱浮层（典籍 tab 内缩略图唤起）
  const [graphOpen, setGraphOpen] = useState(false);
  const [sikuOpen, setSikuOpen] = useState(false);
  /** 自指南针四隅进四库时直落某部；自典籍 tab 进则为 undefined（从四部选起） */
  const [sikuGroup, setSikuGroup] = useState<string | undefined>(undefined);
  /** 四库脉络长卷（罗盘顶栏进）：自长卷点书进来时直落该书，与 sikuGroup 二者取一 */
  const [sikuScrollOpen, setSikuScrollOpen] = useState(false);
  const [sikuBook, setSikuBook] = useState<string | undefined>(undefined);
  /** 世界文学典籍页：自海图泊港「翻开此书」进时直落该书 */
  const [wlOpen, setWlOpen] = useState(false);
  const [wlBook, setWlBook] = useState<string | undefined>(undefined);
  /** 自历史大事件点一条西书记事进来时：落在哪一面（原书／中译）、哪一章 */
  const [wlLang, setWlLang] = useState<"zh" | "en" | undefined>(undefined);
  const [wlChap, setWlChap] = useState<number | undefined>(undefined);
  /** 历史大事件层：题名旁那枚日签点进去的地方（史上今日·月令·按日期人名检索） */
  const [chronOpen, setChronOpen] = useState(false);
  /** 时空文脉地图：按朝代展开地点、人物、典籍与思想传播路径 */
  const [geoMapOpen, setGeoMapOpen] = useState(false);
  /** 新手导览册目层：罗盘题名旁那枚圆钮「导」开出的五册册目（见 TourIndexPanel） */
  const [tourIndexOpen, setTourIndexOpen] = useState(false);
  /** 自历史大事件点一条中土记事进四库时直落该回（回次字样，如「卷三十九」） */
  const [sikuChap, setSikuChap] = useState<string | undefined>(undefined);
  /** 自历史大事件跳进阅读层时要标出的那一句原话（见 chronToSiku／chronToLit） */
  const [sikuHit, setSikuHit] = useState<string | undefined>(undefined);
  const [wlHit, setWlHit] = useState<string | undefined>(undefined);
  /** 母题·跨世界评议层：诸子与西游人物同评一处境，详见 MotifLayer 顶注 */
  const [motifOpen, setMotifOpen] = useState(false);
  /** 跨媒介点评层：影音总库按四库四部与西方两行铺开，点一条入点评席（见 CrossMediaLayer） */
  const [xmediaOpen, setXmediaOpen] = useState(false);
  /**
   * 当下所在的世界，`compass` 为罗盘（进门第一屏，四库居中、四部居隅）。
   *
   * 世界之间不是浮层关系而是**互斥**的：三维画布重，两张图不该同时挂在那里，
   * 故此处以早返分流（见下文 `curWorld === "compass"` 一段），而不像母题层那样叠一层。
   * 名叫 `curWorld` 而非 `world`，是因为 `world` 这个名字已经给了世界状态表（见下）。
   */
  const [curWorld, setCurWorld] = useState<"compass" | WorldId>("compass");
  /**
   * 换世界时盖在最上面的那一层纸。
   *
   * 不做淡入淡出而做「自所点之方漫开」：方位是这套入口的意思所在（点西即西行，
   * 见 worlds.ts 的 `why`），故那一下也该从西边起。`ox/oy` 即漫开的圆心，
   * `glyph` 是盖住期间浮在中间的那个字——过场里仍看得出去的是哪一方。
   *
   * `n` 只为换 key：同一方连点两次，若不换 key，CSS 动画不会重放。
   */
  const [veil, setVeil] = useState<{ ox: string; oy: string; glyph: string; n: number } | null>(null);
  const veilN = useRef(0);
  const veilTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /**
   * 换世界：先盖纸，盖严了再换，然后把纸揭开。
   *
   * 世界之间是早返分流（见 `curWorld` 顶注），一换便是整屏易手——若不盖这一下，
   * 三维画布的首帧会在旧屏还在的时候闪一白。故把换的那一刻（420ms）藏在纸底下，
   * 用户看见的是漫开、字、揭开三拍，中间那一刀看不见。
   *
   * `from` 是所点之处（四部居盘隅，方位备用），只为定漫开的圆心；回盘面时不传，自中心漫开。
   */
  const travelTo = useCallback((to: "compass" | WorldId, from?: Bearing | Part) => {
    // 四正自盘缘四方漫开；四部居盘隅，自所点之隅漫开（见 CompassLayer 的盘隅）
    const ORIGIN: Record<Bearing | Part, [string, string]> = {
      东: ["86%", "50%"],
      南: ["50%", "86%"],
      西: ["14%", "50%"],
      北: ["50%", "14%"],
      经: ["16%", "16%"],
      史: ["84%", "16%"],
      子: ["16%", "84%"],
      集: ["84%", "84%"],
    };
    const [ox, oy] = from ? ORIGIN[from] : ["50%", "50%"];
    veilN.current += 1;
    setVeil({ ox, oy, glyph: from ?? "方", n: veilN.current });
    // 连点时旧的那一程作废：清掉其换屏与揭纸，免得先落到前一个世界再跳走
    veilTimers.current.forEach(clearTimeout);
    veilTimers.current = [
      setTimeout(() => setCurWorld(to), 420),
      setTimeout(() => setVeil(null), 980),
    ];
  }, []);

  useEffect(() => () => veilTimers.current.forEach(clearTimeout), []);

  const huibingChoices = useMemo(() => huibingChoicesFor(quest.passageId), [quest.passageId]);

  // 手动落点：点地图令选中人物前往，覆盖日程自动移动
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  // 全页双贤对谈台（辩论席"双贤对谈"开启）
  const [chat, setChat] = useState<{ initiator: string; partner: string } | null>(null);
  // 全页圆桌辩论台
  // preset 预置辩题与席位，只导览实演用（用户可自行增删改）；
  // autoStart 亦仅导览实演为真——辩论台挂上即自行开辩，不必再等一次点击
  const [debate, setDebate] = useState<{ mode: "proximity" | "sidebar"; initiator?: string; nearby?: string[]; preset?: { topic: string; seated: string[] }; autoStart?: boolean } | null>(null);
  // 双贤对谈的两方选择
  const [chatLeft, setChatLeft] = useState("kong");
  const [chatRight, setChatRight] = useState("mo");
  // 侧栏 1v1 对话：用户与单个人物交谈，不跳全页
  const [talkPartner, setTalkPartner] = useState("kong");
  const [talkMsgs, setTalkMsgs] = useState<TalkMsg[]>([]);
  const [talkInput, setTalkInput] = useState("");
  const [talkActive, setTalkActive] = useState(false);
  const [talkThinking, setTalkThinking] = useState(false);
  // 新手导览：一章一册，各自看过没有（tourSeen 于 SSR/首帧恒为「全看过」，故首帧不渲染导览层）
  const tourSeen = useTourSeen();
  /** 正在讲哪一册；null 为没开讲 */
  const [tourCh, setTourCh] = useState<TourChapter | null>(null);
  /** 导览递进四库、世文这两层的意图（层内状态 page 够不着，故递帖进去） */
  const [sikuAsk, setSikuAsk] = useState<SikuAsk | null>(null);
  const [wlAsk, setWlAsk] = useState<WlAsk | null>(null);
  const askN = useRef(0);
  /** 重挂两层的钥匙：本册第 1 步要站在门口讲，故开册时连 key 一起换，层内的下钻状态归零 */
  const [sikuEpoch, setSikuEpoch] = useState(0);
  const [wlEpoch, setWlEpoch] = useState(0);

  useEffect(() => {
    const firstVisit = !hasSavedLang() && !hasTourHistory();
    const timer = window.setTimeout(() => {
      setLanguageGateOpen(firstVisit);
      setOnboardingReady(!firstVisit);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const chooseFirstLanguage = useCallback((next: Lang) => {
    setLang(next);
    setLanguageGateOpen(false);
    setOnboardingReady(true);
  }, []);
  // 市井街市浮层 + 道具/铜钱（localStorage 持久）+ 1v1 奉贽
  const [marketOpen, setMarketOpen] = useState(false);
  const [inv, invApi] = useInventory();
  // 关系/好感度（localStorage 持久）
  const [affinity, affinityApi] = useAffinity();
  // 人物自主性：周期决策的临时动作覆盖（expiresTick 过后回日程）
  const [autoOverrides, setAutoOverrides] = useState<Record<string, { action: string; expiresTick: number }>>({});
  // effect 内取最新 invApi，免 stale closure（addCoins 读模块级 store，本身安全）
  const invApiRef = useRef(invApi);
  useEffect(() => { invApiRef.current = invApi; }, [invApi]);
  const [pendingGift, setPendingGift] = useState<{ id: ItemId; name: string } | null>(null);
  const ownedItems = ITEMS.filter((i) => (inv.items[i.id] ?? 0) > 0);
  const talkScrollRef = useRef<HTMLDivElement>(null);
  // 人物发言的稳定 id：一致性校验异步回填按 id 而非 index，避免新言插入后错位
  const talkSeq = useRef(0);

  // 世界时钟：默认从辰时起算，每 2 秒推进一刻
  const [tick, setTick] = useState(8 * 4);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setTick((t) => (t + 1) % TICKS_PER_DAY), 2000);
    return () => clearInterval(timer);
  }, [running]);

  // 气候时钟：独立 60s 一推，与 2s 世界 tick 解耦，同由 running 闸门暂停
  // season 每 4 步换（≈4 分钟/季），weather 每步按当季加权黏性重抽（多半沿用、少变天）
  const [climate, setClimate] = useState(INITIAL_CLIMATE);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setClimate((c) => advanceClimate(c)), 60_000);
    return () => clearInterval(id);
  }, [running]);

  const world = useMemo(() => worldStateAt(tick, climate), [tick, climate]);
  // 被移动者的显示区域/动作按落点最近区域重算，避免"人在濠水却显示讲学于杏坛"
  // 自主性 override：无日程事件且无手动 override 且未过期时，覆写 action 为 LLM 自决句
  const effectiveWorld = useMemo<Record<string, Presence>>(() => {
    const w: Record<string, Presence> = {};
    for (const s of scholars) {
      const ov = overrides[s.id];
      if (ov) {
        const rid = nearestRegionId(ov.x, ov.z);
        w[s.id] = { ...world[s.id], region: rid, action: `驻于${regionMap[rid].name}`, event: undefined };
      } else {
        const ao = autoOverrides[s.id];
        const base = world[s.id];
        if (ao && tick < ao.expiresTick && !base.event && base.mood === "think") {
          w[s.id] = { ...base, action: ao.action, event: undefined };
        } else {
          w[s.id] = base;
        }
      }
    }
    // 主持人吕不韦：静态驻招贤馆，不游走、不受 override；mood 随馆中集会而变
    const zhaoEvents = eventsInRegion(tick, "zhaoxian");
    w["lvbuwei"] = {
      scholarId: "lvbuwei",
      region: "zhaoxian",
      action: "正在集门客论学",
      mood: zhaoEvents.some((e) => e.actors.length >= 3) ? "debate" : zhaoEvents.length ? "talk" : "think",
      event: undefined,
    };
    return w;
  }, [world, overrides, tick, autoOverrides]);
  const positions = useMemo(() => computePositions(effectiveWorld, overrides), [effectiveWorld, overrides]);
  const nearbyList = nearbyOf(positions, selectedId);

  const time = formatWorldTime(tick);
  const selected = scholarMap[selectedId];
  const presence = effectiveWorld[selectedId];
  const selectedRegion = regionMap[presence.region];
  /**
   * 引典检索：字面先出，语义后补。
   *
   * 两步而非一步，是因为 `retrieve` 同步而 `embedQuery` 异步（查询向量要走一趟
   * `/api/embed`，Key 在 Worker 那边）。若等向量到了才出结果，每敲一个字这一栏就空
   * 半秒；故先以纯关键词即时出一版（与无向量时逐字相同），向量到了再重检一遍覆盖。
   * 向量未生成或 embed 失败则第二步不动，停在字面那一版——与此前行为无异。
   */
  const [canonHits, setCanonHits] = useState<Retrieved[]>([]);
  useEffect(() => {
    const q = canonQuery.trim();
    if (!q) { setCanonHits([]); return; }
    let alive = true;
    setCanonHits(retrieve(q, { limit: 5 }));
    // 第二步以四库可引的二十六部全文为主池（`retrievePreferFull`）：三百余万字只取
    // 一次，取过便留着（见 canonSource 的 loadAllWorks）。放在第二步而非第一步，是
    // 因为池子大了十余倍，逐字检一遍要跑一万余段——搁在同步那一步会把每次敲键都拖住。
    // 故第一步仍以选本即时出一版（敲键不滞），全文到了再覆盖；全文答不上才停在选本。
    Promise.all([embedQuery(q), loadAllWorks()]).then(([qVec, extra]) => {
      if (alive && (qVec || extra.length)) setCanonHits(retrievePreferFull(q, extra, { limit: 5 }, qVec));
    });
    return () => { alive = false; };
  }, [canonQuery]);
  // 全文检索：查询变化时异步取（仅浏览器期），与引典合并展示
  useEffect(() => {
    const q = canonQuery.trim();
    if (!q || typeof window === "undefined") { setCanonFullHits([]); return; }
    let alive = true;
    setCanonFullLoading(true);
    retrieveFull(q, { limit: 6 })
      .then((hits) => { if (alive) setCanonFullHits(hits); })
      .catch(() => {})
      .finally(() => { if (alive) setCanonFullLoading(false); });
    return () => { alive = false; };
  }, [canonQuery]);
  const canonReaderVerses: FlatVerse[] = useMemo(() => {
    if (!canonBookId) return [];
    const book = canonFullMap[canonBookId];
    if (!book) return [];
    return book.chapters.flatMap((c) => c.verses.map((v) => ({ ...v, bookId: book.id, book: book.name, chapter: c.name, authorId: book.authorId, schoolId: book.schoolId, verseId: `${book.id}-${c.id}-${v.id}` })));
  }, [canonBookId]);
  // 选中人物本家典籍（无本家典籍入此库者——如主持人吕不韦——为空，档案不显空《》）
  const selectedCanon = useMemo(() => retrieve(selected.themes.join(" "), { scholarId: selected.id, limit: 3 }), [selected]);
  const selectedBooks = [...new Set(selectedCanon.map((h) => h.book))];
  const nextEvent = nextEventFor(selectedId, tick);
  const nextTick = nextEvent ? tickLabel(nextEvent.start) : null;
  const moved = Boolean(overrides[selectedId]);

  // 世界日志：日程开始时记一笔
  // 存的是「中文模板 + 变量」而非成品句子：这样切语言时在架的 6 条旧纪事一并改写，
  // 不会留下半中半英的一栏。中文模式下代入变量即原句，与未做英文版时一字不差。
  const [log, setLog] = useState<{ at: string; text: string; vars?: Record<string, string | number> }[]>([]);
  const seen = useRef(new Set<string>());
  const prevTick = useRef(tick);
  // 变量保留原文，显示时才翻译，让已有纪事也能随语言切换。
  function logVars(vars?: Record<string, string | number>) {
    if (!vars) return undefined;
    return Object.fromEntries(Object.entries(vars).map(([key, value]) => [
      key,
      typeof value === "number" ? value : key === "action" ? tActionBare(value) : t(value),
    ]));
  }

  /** 记一笔世界纪事：滚动 6 条近期显示 */
  function logEvent(text: string, vars?: Record<string, string | number>) {
    const at = tickLabel(tick);
    setLog((p) => [{ at, text, vars }, ...p].slice(0, 6));
  }
  useEffect(() => {
    // tick 每日归零：已记事件须一并清空（否则次日之后再不记事）；并推进世界日序号、令游学题换题
    if (tick < prevTick.current) {
      seen.current.clear();
      bumpWorldDay();
      setConsult(null); // 旧题复诵气泡失效（题面已换），收起免张冠李戴
      // 招贤馆世界日日给铜钱
      invApiRef.current.addCoins(20);
      logEvent("招贤馆日给铜钱20文。");
    }
    prevTick.current = tick;
    const starting = regions.flatMap((r) => eventsInRegion(tick, r.id)).filter((e) => e.start === tick);
    if (!starting.length) return;
    const fresh = starting.filter((e) => !seen.current.has(`${e.id}`));
    if (!fresh.length) return;
    fresh.forEach((e) => seen.current.add(`${e.id}`));
    fresh.forEach((e) => logEvent("{region}：{scene}", { region: regionMap[e.region].name, scene: e.scene }));
  }, [tick]);

  // 气候变易记事：换季或天气变时追一行风物记
  const prevClimate = useRef(climate);
  useEffect(() => {
    const prev = prevClimate.current;
    const seasonChanged = prev.season !== climate.season;
    const weatherChanged = prev.weather !== climate.weather;
    if (!seasonChanged && !weatherChanged) return;
    prevClimate.current = climate;
    const WEATHER_NOTE: Record<string, string> = { 雨: "天降骤雨", 雪: "朔雪忽至", 雾: "浓雾四合", 阴: "天色转阴", 晴: "云开日出" };
    const note = WEATHER_NOTE[climate.weather] ?? "天象变易";
    if (seasonChanged) logEvent("时入{season}，{note}", { season: climate.season, note });
    else logEvent(note);
  }, [climate, tick]);

  // 人物自主性：每 8 个世界 tick（≈16s）挑一位无日程事件的诸子，由 LLM 自决一句动作，
  // 覆盖其 idle 行为 4 tick（≈8s）。仅运行中、页面可见时触发；无 Key/异常静默回退日程。
  const autoBusy = useRef(false);
  useEffect(() => {
    if (!running) return;
    if (tick % 8 !== 0) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    if (autoBusy.current) return;
    // 轮询起点按 tick 轮转，使各位诸子都有机会被选中
    const start = Math.floor(tick / 8) % scholars.length;
    let target: string | undefined;
    for (let i = 0; i < scholars.length; i++) {
      const s = scholars[(start + i) % scholars.length];
      const p = world[s.id];
      if (p && !p.event && p.mood === "think" && !overrides[s.id]) { target = s.id; break; }
    }
    if (!target) return;
    autoBusy.current = true;
    decideAction(target, world[target], tick)
      .then((res) => {
        if (res) {
          setAutoOverrides((o) => ({ ...o, [target!]: { action: res.action, expiresTick: tick + 4 } }));
          logEvent("{name}{action}", { name: scholarMap[target!].name, action: res.action });
        }
      })
      .catch(() => {})
      .finally(() => { autoBusy.current = false; });
  }, [tick, running, world, overrides]);

  // 1v1 对话流随新发言/作答中自动滚到底
  // 流式逐字回填时 talkMsgs 引用逐 token 变化，effect 随之滚到底（即时，免流式卡顿）
  useEffect(() => {
    const el = talkScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [talkMsgs, talkThinking]);

  function selectScholar(id: string) {
    setSelectedId(id);
    setChatLeft(id);
    setTalkActive(false);
    setPanel("profile");
  }

  /** 游学咨询：诸子头顶复诵气泡正文。命中本家者复诵原典＋《书·篇》（不附白话，留作回禀考查）；
   *  非本家者据实推却不妄解，指其本家。同步、无网络。 */
  function consultText(scholarId: string): string {
    const s = scholarMap[scholarId];
    if (scholarId === quest.scholarId) {
      return `${s.voice.opening}「${quest.text}」——《${quest.book}·${quest.chapter}》${s.voice.closing}`;
    }
    return `${s.voice.opening}「${quest.text}」出《${quest.book}·${quest.chapter}》，然此非吾家之学，未敢妄作解人；宜问其本家。${s.voice.closing}`;
  }

  /** 地图点选路由：游学领题态下，点诸子＝咨询（头顶复诵气泡）、点吕不韦＝回禀；否则常态选档看人物。 */
  function handleSelect(id: string) {
    if (questPhase === "accepted") {
      if (id === "lvbuwei") setQlayer("huibing");
      else setConsult({ id, text: consultText(id) });
      return;
    }
    selectScholar(id);
  }

  /** 点地图空地：令当前选中人物前往该处，覆盖日程自动移动 */
  function onGroundClick(x: number, z: number) {
    // 游学领题态下点空地不移动，专注咨询
    if (questPhase === "accepted") return;
    // 吕不韦为招贤馆静态主人，点空地不令其移动
    if (selectedId === "lvbuwei") return;
    setOverrides((o) => ({ ...o, [selectedId]: { x, z } }));
  }

  function clearOverride(id: string) {
    setOverrides((o) => {
      if (!o[id]) return o;
      const n = { ...o };
      delete n[id];
      return n;
    });
  }

  /** 开启双贤对谈台（全页，由辩论席"双贤对谈"触发） */
  function openChat(initiator: string, partner: string) {
    if (initiator === partner) return;
    setChat({ initiator, partner });
  }

  /** 关闭双贤对谈台：清主动方 override，使其回到日程自动移动 */
  function closeChat() {
    if (chat) clearOverride(chat.initiator);
    setChat(null);
  }

  function openDebate(mode: "proximity" | "sidebar", initiator?: string, nearby?: string[]) {
    setDebate({ mode, initiator, nearby });
  }

  /** 关闭辩论台：仅"附近"模式清主动方 override；侧栏自由模式不动 */
  function closeDebate() {
    if (debate?.mode === "proximity" && debate.initiator) clearOverride(debate.initiator);
    setDebate(null);
  }

  /** 与某人物开始 1v1 交谈：内嵌进人物面板，不切标签、不开全页 */
  function openTalk(id: string) {
    setTalkPartner(id);
    setTalkMsgs([{ mine: false, text: scholarMap[id].voice.opening }]);
    setTalkInput("");
    setTalkActive(true);
    setPanel("profile");
  }

  async function sendTalk(text?: string) {
    const q = (text ?? talkInput).trim();
    if (!q || talkThinking) return;
    setTalkInput("");
    // 占位行将落于此 index（用户问话在 length、占位在 length+1）；talkThinking 阻断重入，流式期间 index 稳定
    const phIdx = talkMsgs.length + 1;
    setTalkMsgs((m) => [...m, { mine: true, text: q }]);
    setTalkThinking(true);
    setTalkMsgs((m) => [...m, { mine: false, text: "", streaming: true }]);
    try {
      // 奉贽：消费 1 件道具，拼贽礼上下文送入（无存货或未选则原样请教）
      let gift: { id: string; name: string } | undefined;
      if (pendingGift) {
        const offered = invApi.offer(pendingGift.id);
        if (offered) gift = { id: offered.id, name: offered.name };
        setPendingGift(null);
      }
      const ans = await composeAnswerLLM(
        talkPartner,
        q,
        effectiveWorld[talkPartner],
        talkMsgs.map((m) => ({ mine: m.mine, text: m.text })),
        (delta) =>
          setTalkMsgs((a) => a.map((x, j) => (j === phIdx ? { ...x, text: x.text + delta } : x))),
        gift,
      );
      // 校验回填在 talkThinking 释放后落定、新言或已插入致 index 错位，故 await 后才取 id、按 id 回填
      const id = talkSeq.current++;
      setTalkMsgs((a) => a.map((x, j) => (j === phIdx ? { ...x, id, text: ans.text, citations: ans.citations, inferred: ans.inferred, streaming: false, verifying: true } : x)));
      // 先校验并自动修订；只有复核合规的最终文本才进入长期记忆，免得 ✕ 污染后续对话。
      const checked = await verifyAndRepairConsistency(talkPartner, ans.text, q, ans.citations);
      const finalText = checked?.text ?? ans.text;
      setTalkMsgs((a) =>
        a.map((x) =>
          x.id === id
            ? {
                ...x,
                text: finalText,
                citations: checked?.citations ?? ans.citations,
                verifying: false,
                verdict: checked?.verdict,
                verdictNote: checked?.note,
                verdictModel: checked?.model,
                verdictCross: checked?.crossModel,
              }
            : x,
        ),
      );
      if (checked?.verdict === "合规") recordMemory(talkPartner, q, finalText, time.shichen, worldDay);
      // 好感度仍以完成一次交谈计（奉贽额外 +1，束脩向孔子 +2）
      const giftBump = gift ? (talkPartner === "kong" && gift.id === "shuxiu" ? 2 : 1) : 0;
      affinityApi.bumpUser(talkPartner, 1 + giftBump);
    } finally {
      setTalkThinking(false);
    }
  }

  /** 右键人物发言：译为白话（已有译文则切换显隐）；走 `/api/translate`，失败提示"未能译出"。 */
  async function toggleVern(i: number, e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    const cur = talkMsgs[i];
    if (!cur || cur.mine) return;
    if (cur.vernacular && !cur.vernLoading) {
      setTalkMsgs((a) => a.map((x, j) => (j === i ? { ...x, vernShow: !x.vernShow } : x)));
      return;
    }
    if (cur.vernLoading) return;
    setTalkMsgs((a) => a.map((x, j) => (j === i ? { ...x, vernLoading: true, vernError: false, vernShow: true, vernacular: "" } : x)));
    const out = await translateToVernacular(cur.text, talkPartner, (delta) =>
      setTalkMsgs((a) => a.map((x, j) => (j === i ? { ...x, vernacular: (x.vernacular ?? "") + delta } : x))),
    );
    setTalkMsgs((a) => a.map((x, j) => (j === i ? {
      ...x,
      vernLoading: false,
      vernacular: out ?? "",
      vernError: out === null,
      vernShow: true,
    } : x)));
  }

  /** 答题连对：对则连对 +1 并按阈值解锁称号（持久）、记世界纪事；错则连对归 0。
   *  游学回禀与经义小考皆走此（每选一发，容许「错→再选→对」计为连对 1）。 */
  function applyAnswer(correct: boolean) {
    if (!correct) {
      setStreak(0);
      return;
    }
    const next = streak + 1;
    setStreak(next);
    invApi.addCoins(5);
    logEvent("答对一题，吕公赏铜钱5文。");
    const title = titleForStreak(next, titles);
    if (title) {
      titlesApi.unlock(title.id);
      logEvent("连对 {n} 题，得『{title}』之称。", { n: next, title: title.name });
    }
  }

  // ── 新手导览 ────────────────────────────────────────────────
  //
  // 五册：四库 → 诸子（与西游）→ 西方 → 跨世界三块。不是一个平铺的长册，
  // 而是**到哪一层讲哪一册**：系统是一底四叠（罗盘是底，四库、世文、母题……皆浮层），
  // 故没有「先走完这屏再进那屏」的线性路，只有各册自己的进场条件。
  //
  // 次序上的讲究：
  //   1. 册一不在四库里起讲，而在**盘面**起讲——进门第一屏左边四库、右边海图、
  //      上头三枚签牌，须先整体说清这是怎样一套系统，再推门入四库。故册一择两处在场：
  //      盘面（自第 1 步讲起）或四库已开（自门楼一步讲起，见 startAt）。
  //   2. 浮层优先于世界——.kg-layer 在 z 60，世界那一册的选择器量不到它，
  //      两册并发只会互踩；故浮层开着时只可能是浮层那一册。
  //   3. 一屏只讲一册——tourCh 非空便不再另起。
  //   4. 册五是收束章——须先看过四库、诸子、西方，三枚签牌才有意义；
  //      它会一路把四库、长卷、母题、影音都翻一遍，故排在最后，与册一不会同屏相争。
  //   5. 旧用户的「看过」只算诸子那一册（见 tour.ts 的迁移），故四册新章照讲。

  /** 此刻该讲哪一册；null 为不该讲 */
  const chapterDue = (): TourChapter | null => {
    if (sikuOpen) return tourSeen.has("siku") ? null : "siku";
    if (wlOpen) return tourSeen.has("westlit") ? null : "westlit";
    if (curWorld === "zhanguo") return tourSeen.has("zhanguo") ? null : "zhanguo";
    if (curWorld === "xiyou") return tourSeen.has("xiyou") ? null : "xiyou";
    if (curWorld === "compass" && !motifOpen && !xmediaOpen && !sikuScrollOpen) {
      // 新客进门：先在盘面上整体讲一遍系统，再由导览替他推开四库的门
      if (!tourSeen.has("siku")) return "siku";
      const ready = tourSeen.has("siku") && tourSeen.has("zhanguo") && tourSeen.has("westlit");
      return ready && !tourSeen.has("crossworld") ? "crossworld" : null;
    }
    return null;
  };

  // 延迟开讲：3D 场景与目录是异步载入的，先让这一层落定，气泡才不会指到仍在加载的空处。
  useEffect(() => {
    if (!onboardingReady || languageGateOpen) return;
    if (tourCh) return;
    const ch = chapterDue();
    if (!ch) return;
    // 四库、世文开讲前先把这两层重挂一次：本册门口那一步要站在门楼／书架前讲，
    // 若它还停在上次翻到的那部书上，后几步的「函套」「立书」都量不到。
    // 册一若还在盘面上，门楼一步要等导览自己开层（见「enter」一帖），此处不动它。
    if (ch === "siku" && sikuOpen) {
      setSikuEpoch((n) => n + 1);
      setSikuGroup(undefined);
      setSikuBook(undefined);
      setSikuChap(undefined);
      setSikuHit(undefined);
    }
    if (ch === "westlit") {
      setWlEpoch((n) => n + 1);
      setWlBook(undefined);
      setWlLang(undefined);
      setWlChap(undefined);
      setWlHit(undefined);
    }
    const timer = setTimeout(() => setTourCh(ch), 900);
    return () => clearTimeout(timer);
  }, [curWorld, sikuOpen, wlOpen, sikuScrollOpen, motifOpen, xmediaOpen, tourCh, tourSeen, onboardingReady, languageGateOpen]);

  /**
   * 册一横跨两层：前五步在盘面上讲总图，第六步才推门入四库，点「上一步」又退回盘面。
   * 故它的宿主不是定死一处，而是看**这一刻导览要不要四库那一层**：
   * 要（`openSiku` 发过、或这位客自己把门推开了）便以四库层为宿主，客关掉它即作跳过；
   * 不要（`closeSiku` 退回了盘面）便以盘面为宿主。两处都不在，才算本册没了立足之地。
   * 本册讲完（tourCh 归 null）即清。
   */
  const tourWantsSiku = useRef(false);

  /** 一层收起而本册还没讲完：记作已讲（等同跳过），下次不再拦在这册 */
  useEffect(() => {
    if (!tourCh) {
      tourWantsSiku.current = false;
      return;
    }
    // 客自己推开了四库的门（册一第五步留孔可点）：此后便以四库层为宿主
    if (tourCh === "siku" && sikuOpen) tourWantsSiku.current = true;
    const hostOpen =
      tourCh === "siku" ? (tourWantsSiku.current ? sikuOpen : curWorld === "compass")
      : tourCh === "westlit" ? wlOpen
      : tourCh === "xiyou" ? curWorld === "xiyou"
      : tourCh === "crossworld" ? curWorld === "compass"
      : curWorld === "zhanguo";
    if (!hostOpen) {
      markSeen(tourCh);
      setTourCh(null);
    }
  }, [tourCh, sikuOpen, wlOpen, curWorld]);

  /**
   * 导览请求切侧栏页签：目标元件只在对应页签挂载，不切过去就量不到位置。
   * 必须引用稳定（导览层的切步 effect 依赖它），故 useCallback 空依赖。
   */
  const tourNeedPanel = useCallback((p: TourPanel) => {
    if (p === "profile") setTalkActive(false); // 谈话态下 profile-panel 不渲染
    setPanel(p);
  }, []);

  /** 看完或跳过本册：收掉实演开出的浮层，记下已看过，侧栏还原到人物页 */
  const tourFinish = useCallback(() => {
    setTourCh((ch) => {
      if (ch) markSeen(ch);
      return null;
    });
    setDebate(null);         // 可能停在实演开出的辩论台上
    setGraphOpen(false);     // 或图谱层
    // 册五会把浮层一个个翻过去，此刻可能停在最后一层
    setSikuOpen(false);
    setWlOpen(false);
    setSikuScrollOpen(false);
    setMotifOpen(false);
    setXmediaOpen(false);
    setCanonQuery("");
    setTalkActive(false);
    setPanel("profile");
  }, []);

  /**
   * 导览实演：替用户把重功能真跑起来（辩论台开场、检索词填入、图谱点开、
   * 四库层层下钻、世文摊开对照），他眼见其运作、也能在留孔的高亮框里当场自己接着操作。
   * 同样须引用稳定——导览层的切步 effect 依赖它。
   */
  const tourAct = useCallback((act: TourAct) => {
    switch (act.kind) {
      case "openDebate":
        // 儒墨法三家对「致治」答法最相左，开场即见锋芒
        setDebate({ mode: "sidebar", preset: { topic: "天下何以致治？", seated: ["kong", "mo", "han"] } });
        break;
      case "closeDebate":
        setDebate(null);
        break;
      case "startDebate":
        // 用户若已自己点过「击鼓开辩」，此处置位无害：辩论台已非 setup 相，autoStart 自不生效
        setDebate((d) => (d ? { ...d, autoStart: true } : d));
        break;
      case "canonQuery":
        setCanonQuery("战争");
        break;
      case "clearCanon":
        setCanonQuery("");
        break;
      case "openGraph":
        setGraphOpen(true);
        break;
      case "closeGraph":
        setGraphOpen(false);
        break;
      case "openSiku":
        // 册一末了由导览推门：层新挂一次，才站在门楼前，而不是停在上次翻到的那部书
        tourWantsSiku.current = true;
        setSikuEpoch((n) => n + 1);
        setSikuGroup(undefined);
        setSikuBook(undefined);
        setSikuChap(undefined);
        setSikuHit(undefined);
        // 层新挂一次，层内认帖的游标也从头起，手上这一帖便会被重放一遍：
        // 不另递一帖「退回总目」，自函套点「上一步」时重放的就是「子部·道家」，门楼永远不出现。
        askN.current += 1;
        setSikuAsk({ kind: "reset", n: askN.current });
        setSikuOpen(true);
        break;
      case "closeSiku":
        // 导览自己收的（如册一点「上一步」退回盘面）：不算客弃了本册，宿主随之改回盘面
        tourWantsSiku.current = false;
        setSikuOpen(false);
        break;
      case "siku":
        askN.current += 1;
        setSikuAsk({ ...act.ask, n: askN.current } as SikuAsk);
        break;
      case "openWorldLit":
        setWlBook(undefined);
        setWlLang(undefined);
        setWlChap(undefined);
        setWlHit(undefined);
        setWlOpen(true);
        break;
      case "closeWorldLit":
        setWlOpen(false);
        break;
      case "wl":
        askN.current += 1;
        setWlAsk({ ...act.ask, n: askN.current } as WlAsk);
        break;
      case "openScroll":
        setSikuScrollOpen(true);
        break;
      case "closeScroll":
        setSikuScrollOpen(false);
        break;
      case "openMotif":
        setMotifOpen(true);
        break;
      case "closeMotif":
        setMotifOpen(false);
        break;
      case "openMedia":
        setXmediaOpen(true);
        break;
      case "closeMedia":
        setXmediaOpen(false);
        break;
      case "enter":
        travelTo(act.world);
        break;
    }
  }, [travelTo]);

  /**
   * 册目里点某册的「重看 ↻」：清那一册的标记，并把页面切到那一层。
   *
   * 切那一层是必须的：每册只在它那一层在场时才开讲，「重看西方」在战国屏上按下去，
   * 若只清标记而不开层，什么也不会发生。故一并替用户开层（世文）或回到盘面
   * （四库、跨世界三块）；诸子与西游都在当前世界里，就地开讲即可。
   *
   * 册一「四库」要回盘面而非开四库层：它前五步讲的是进门那一屏的总图，第六步才推门。
   * 若先替人把四库开了，这一册便自门楼那一步接上（见 SIKU_FROM_GATES），说好的「从头再讲」
   * 就少了前五步。
   */
  const replayTour = useCallback((ch: TourChapter) => {
    setQlayer(null);
    setTourIndexOpen(false);
    resetTour(ch);
    setTourCh(null);
    if (ch === "westlit") {
      setSikuOpen(false);
      setMotifOpen(false);
      setXmediaOpen(false);
      setSikuScrollOpen(false);
      setWlEpoch((n) => n + 1);
      setWlBook(undefined);
      setWlLang(undefined);
      setWlChap(undefined);
      setWlHit(undefined);
      setWlOpen(true);
    } else if (ch === "siku" || ch === "crossworld") {
      setSikuOpen(false);
      setWlOpen(false);
      setSikuScrollOpen(false);
      setMotifOpen(false);
      setXmediaOpen(false);
      travelTo("compass");
    } else {
      // 诸子 / 西游：层是 curWorld 的早返回分支，开层即 travelTo。
      setSikuOpen(false);
      setWlOpen(false);
      setSikuScrollOpen(false);
      setMotifOpen(false);
      setXmediaOpen(false);
      travelTo(ch === "zhanguo" ? "zhanguo" : "xiyou");
    }
  }, [travelTo]);

  /** 全部重看：五册标记一并抹去，回到盘面从头走。 */
  const replayAll = useCallback(() => {
    setQlayer(null);
    setTourIndexOpen(false);
    resetTour();
    setTourCh(null);
    setSikuOpen(false);
    setWlOpen(false);
    setSikuScrollOpen(false);
    setMotifOpen(false);
    setXmediaOpen(false);
    travelTo("compass");
  }, [travelTo]);

  /**
   * 自历史大事件落回原书。
   *
   * 中土一条落四库该书该回：SikuLayer 认的是**回次字样**（「卷三十九」）而非章序，
   * 故给 chapterName（见 ChronicleLayer 的 onOpenSiku）。
   *
   * 西书一条落世界文学该书该面该章：须连「哪一面」一并给——《茶花女》《月界旅行》
   * 《天演论》中英两面章数不等，只给章序会落错章。
   *
   * 两处都把日签层收起：人点一条记事是要读那一段，不是回到一屏记事上。
   *
   * 两处都把这一条的原话一并带去：一章动辄数千字，不在正文里标一笔，跳过去
   * 只像是开了一本书，看不出点的究竟是哪一句。
   */
  const chronToSiku = useCallback((bookId: string, chapterLabel: string, hit: string) => {
    setSikuGroup(undefined);
    setSikuBook(bookId);
    setSikuChap(chapterLabel);
    setSikuHit(hit);
    setChronOpen(false);
    setSikuOpen(true);
  }, []);
  const chronToLit = useCallback((bookId: string, lang: "en" | "zh", chapter: number, hit: string) => {
    setWlBook(bookId);
    setWlLang(lang);
    setWlChap(chapter);
    setWlHit(hit);
    setChronOpen(false);
    setWlOpen(true);
  }, []);

  /** 任一回答下的证据卡均可回到原书；事件由 TraceableEvidence 统一发出。 */
  useEffect(() => {
    const openEvidence = (event: Event) => {
      const detail = (event as CustomEvent<{ bookId?: string; chapter?: string; text?: string; worldId?: string }>).detail;
      if (!detail?.bookId) return;
      setMotifOpen(false);
      setChronOpen(false);
      setLineageOpen(false);
      if (detail.worldId === "west") {
        setWlBook(detail.bookId);
        setWlHit(detail.text);
        setWlLang(undefined);
        setWlChap(undefined);
        setWlOpen(true);
      } else {
        setSikuGroup(undefined);
        setSikuBook(detail.bookId);
        setSikuChap(detail.chapter);
        setSikuHit(detail.text);
        setSikuOpen(true);
      }
    };
    window.addEventListener("wenyuan:open-evidence", openEvidence);
    return () => window.removeEventListener("wenyuan:open-evidence", openEvidence);
  }, []);

  /** 过场的那层纸。三条分支都要挂它——换屏发生在它底下，故它不能属于任何一屏。 */
  const curtain = veil && (
    <div
      key={veil.n}
      className="tv-veil"
      style={{ "--tv-ox": veil.ox, "--tv-oy": veil.oy } as CSSProperties}
      aria-hidden
    >
      <b>{veil.glyph}</b>
    </div>
  );

  const languageGate = languageGateOpen && <LanguageGate onChoose={chooseFirstLanguage} />;

  // 罗盘：进门第一屏。此处早返，故战国那张画布不挂载——两张三维图不同时在场。
  // 世界的时辰仍在上面那些 effect 里走着，回来时不是从头开始，这是有意的。
  if (curWorld === "compass") {
    return (
      <>
        <CompassLayer
          onEnter={(id, part) => travelTo(id, part)}
          onOpenSiku={(g) => { setSikuGroup(g); setSikuBook(undefined); setSikuOpen(true); }}
          onOpenSikuScroll={() => setSikuScrollOpen(true)}
          onOpenGeoMap={() => setGeoMapOpen(true)}
          onOpenMotif={() => setMotifOpen(true)}
          onOpenCrossMedia={() => setXmediaOpen(true)}
          onOpenBook={(bookId) => { setWlBook(bookId); setWlLang(undefined); setWlChap(undefined); setWlHit(undefined); setWlOpen(true); }}
          onOpenChronicle={() => setChronOpen(true)}
          onOpenTour={() => setTourIndexOpen(true)}
        />
        {sikuScrollOpen && (
          <SikuScrollLayer
            onClose={() => setSikuScrollOpen(false)}
            onOpenBook={(bid) => {
              // 点书即卷起长卷、落进四库该书；带上书则部/类由 SikuLayer 自己坐实
              setSikuGroup(undefined);
              setSikuBook(bid);
              setSikuScrollOpen(false);
              setSikuOpen(true);
            }}
            onOpenWorldBook={(bookId) => {
              setWlBook(bookId);
              setWlLang(undefined);
              setWlChap(undefined);
              setWlHit(undefined);
              setSikuScrollOpen(false);
              setWlOpen(true);
            }}
          />
        )}
        {sikuOpen && (
          <SikuLayer
            key={`siku-${sikuEpoch}`}
            onClose={() => { setSikuOpen(false); setSikuBook(undefined); setSikuChap(undefined); setSikuHit(undefined); }}
            initialGroup={sikuGroup}
            initialBookId={sikuBook}
            initialChapterLabel={sikuChap}
            initialHitText={sikuHit}
            backLabel="返回罗盘"
            tourAsk={sikuAsk ?? undefined}
          />
        )}
        {wlOpen && (
          <WorldLitLayer
            key={`wl-${wlEpoch}`}
            onClose={() => { setWlOpen(false); setWlChap(undefined); setWlHit(undefined); }}
            initialBookId={wlBook}
            initialLang={wlLang}
            initialChapter={wlChap}
            initialHitText={wlHit}
            backLabel="返回海图"
            wlAsk={wlAsk ?? undefined}
          />
        )}
        {chronOpen && (
          <ChronicleLayer
            onClose={() => setChronOpen(false)}
            onOpenSiku={chronToSiku}
            onOpenLit={chronToLit}
            backLabel="返回罗盘"
          />
        )}
        {geoMapOpen && <GeoculturalMapLayer
          onClose={() => setGeoMapOpen(false)}
          onOpenSiku={(bookId) => {
            setGeoMapOpen(false);
            setSikuGroup(undefined);
            setSikuBook(bookId);
            setSikuOpen(true);
          }}
          onOpenWorldBook={(bookId) => {
            setGeoMapOpen(false);
            setWlBook(bookId);
            setWlLang(undefined);
            setWlChap(undefined);
            setWlHit(undefined);
            setWlOpen(true);
          }}
        />}
        {motifOpen && <MotifLayer onClose={() => setMotifOpen(false)} />}
        {xmediaOpen && <CrossMediaLayer onClose={() => setXmediaOpen(false)} />}
        {/* 导览册目：题名旁圆钮「导」开出。重看某册即刻切层，故此层自行收起（见 replayTour） */}
        {tourIndexOpen && (
          <TourIndexPanel
            seenBooks={tourSeen}
            onReplay={replayTour}
            onReplayAll={replayAll}
            onClose={() => setTourIndexOpen(false)}
          />
        )}
        {/* 册五（跨世界三块）就开在盘面这一屏：导览挂最后，压在各浮层之上 */}
        {tourCh && (
          <TourLayer
            key={tourCh}
            chapter={tourCh}
            startAt={tourCh === "siku" && sikuOpen ? SIKU_FROM_GATES : 0}
            onNeedPanel={tourNeedPanel}
            onAct={tourAct}
            onDone={tourFinish}
          />
        )}
        {curtain}
        {languageGate}
      </>
    );
  }

  // 西游：另一套拓扑，自成一屏（为何不并入战国的模拟，见 XiyouLayer 顶注）
  if (curWorld === "xiyou") {
    return (
      <>
        <XiyouLayer onClose={() => travelTo("compass")} />
        {/* 册三（西游）在这一屏讲，五步都是袖手解说，不改动场景 */}
        {tourCh && (
          <TourLayer
            key={tourCh}
            chapter={tourCh}
            startAt={tourCh === "siku" && sikuOpen ? SIKU_FROM_GATES : 0}
            onNeedPanel={tourNeedPanel}
            onAct={tourAct}
            onDone={tourFinish}
          />
        )}
        {curtain}
        {languageGate}
      </>
    );
  }

  return (
    <main className="world-shell">
      <header className="topbar">
        <div className="brand-mark">脈</div>
        <div className="brand-copy">
          <p>{t("天下一隅 · 先秦思想沙盒")}</p>
          <h1>{t("文渊寻脉")}</h1>
        </div>
        {/* 日签：题名旁一条「历史上的今天」，点进去是历史大事件层 */}
        <ChronicleBadge onOpen={() => setChronOpen(true)} />
        <LangToggle />
        {/* 换世界的钮放在这——原先那行操作提示（拖动旋转·滚轮缩放……）占着这块地方，
            但那是看一遍就不必再看的话，而换世界是随时要用的。钮形也放大作朱砂色：
            它通往的是另一整个世界，与右边那排开浮层的钮不是一个量级的事。 */}
        <button className="world-switch" onClick={() => travelTo("compass")} aria-label={t("回盘面换世界")} title={t("盘面 · 换一个世界")}>
          <i>盘</i>
          <span>
            <b>{t("先秦诸子")}</b>
            <small>{t("换世界 · 盘面")}</small>
          </span>
        </button>
        <div className="topbar-tools">
          <div className="world-status">
            <span className="pulse" /> {t(time.shichen)} · {time.clock} · {t(time.phase)} · {t(climate.season)} · {t(climate.weather)}
            <b>{running ? t("世界运行中") : t("已暂停")}</b>
          </div>
          <button className="sound-btn" onClick={() => setRunning((r) => !r)} aria-label={running ? t("暂停世界") : t("继续世界")}>
            {running ? "❙❙" : "▶"}
          </button>
          <button className="lineage-btn" onClick={() => setLineageOpen(true)} aria-label={t("百家演变脉络")} title={t("百家演变脉络")}>
            <i>脉</i><span>{t("百家脉络")}</span>
          </button>
          <button className="lineage-btn" onClick={() => setMotifOpen(true)} aria-label={t("母题跨世界评议")} title={t("母题·跨世界评议")}>
            <i>母</i><span>{t("母题")}</span>
          </button>
          {XMEDIA_ON && (
            <button className="lineage-btn" onClick={() => setXmediaOpen(true)} aria-label={t("跨媒介点评")} title={t("影音·跨媒介点评")}>
              <i>媒</i><span>{t("跨媒介")}</span>
            </button>
          )}
          <button className="user-btn" onClick={() => setQlayer("user")} aria-label={t("游学者档案")} title={t("我的档案")}>
            {/* 只有还没改名时才译：默认名「游学者」是界面上的字，客自取之名是人名，不翻 */}
            <i>客</i><span>{user.name === USER_DEFAULT_NAME ? t(USER_DEFAULT_NAME) : user.name}</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <section className="map-wrap" aria-label={t("百家微缩地图")}>
          <BulletinBoard
            quest={quest}
            phase={questPhase}
            sealCount={seals.length}
            huibingOpen={qlayer === "huibing"}
            huibingChoices={huibingChoices}
            onAccept={() => { setRawQuestPhase("accepted"); setConsult(null); }}
            onAbandon={() => { setRawQuestPhase("idle"); setConsult(null); }}
            onOpenHuibing={() => setQlayer("huibing")}
            onCloseHuibing={() => setQlayer(null)}
            onHuibingCorrect={() => {
              sealsApi.add(buildSeal({ date: today, shichen: time.shichen, worldDay, source: "游学", label: `游学·${quest.book}·${quest.chapter}`, qid: quest.passageId }));
              invApi.addCoins(5);
              affinityApi.bumpUser(quest.scholarId, 1);
              logEvent("游学·《{book}·{chapter}》得其义，吕公予印，赏铜钱5文。", { book: quest.book, chapter: quest.chapter });
              setRawQuestPhase("idle");
              setConsult(null);
              setQlayer(null);
            }}
            onHuibingResult={applyAnswer}
            onOpenQuiz={() => setQlayer("quiz")}
            onOpenSeals={() => setQlayer("seals")}
          />
          <div className="scene">
            <WorldScene
              world={effectiveWorld}
              tick={tick}
              climate={climate}
              selectedId={selectedId}
              overrides={overrides}
              onGroundClick={onGroundClick}
              onSelect={handleSelect}
              questConsultId={consult?.id ?? null}
              questSpeech={consult?.text ?? null}
              onCloseSpeech={() => setConsult(null)}
              onEnterRegion={(id) => id === "shijing" && setMarketOpen(true)}
            />
          </div>
          <div className="world-log">
            <b>{t("世界纪事")}</b>
            {log.length === 0 ? <p>{t("静候事起……")}</p> : log.map((l, i) => <p key={i}><i>{l.at}</i>{t(l.text, logVars(l.vars))}</p>)}
          </div>
          <div className="map-legend">
            <span><i className="dot live" />{t("正在活动")}</span>
            <span><i className="dot talk" />{t("可发起对话")}</span>
            <span>{t("{n} 区域 · {m} 人物自主往来", { n: regions.length, m: scholars.length })}</span>
          </div>
        </section>

        <aside className="side-panel">
          <nav className="tabs">
            <button className={panel === "profile" ? "on" : ""} onClick={() => { setTalkActive(false); setPanel("profile"); }}>{t("人物")}</button>
            <button className={panel === "debate" ? "on" : ""} onClick={() => setPanel("debate")}>{t("辩论席")}</button>
            <button className={panel === "canon" ? "on" : ""} onClick={() => setPanel("canon")}>{t("典籍")}</button>
            <button className={panel === "yulu" ? "on" : ""} onClick={() => setPanel("yulu")}>{t("语录")}</button>
          </nav>

          {panel === "profile" && !talkActive && <div className="profile-panel">
            <div className="scholar-strip" role="list" aria-label={t("诸子名录")}>
              {[...scholars, LVBUWEI].map((s) => (
                <button
                  key={s.id}
                  className={selectedId === s.id ? "on" : ""}
                  onClick={() => selectScholar(s.id)}
                  title={s.id === "lvbuwei" ? t("吕不韦 · 驻招贤馆") : `${t(s.name)} · ${t(s.school)}`}
                >
                  <i style={{ background: s.color }}>{s.glyph}</i>
                  <span>{t(s.name)}</span>
                  {s.id === "lvbuwei" && <small>{t("驻馆")}</small>}
                </button>
              ))}
            </div>
            <div className="profile-head">
              <div className="portrait" style={{ background: selected.color }}>
                {portraitOf[selectedId] ? <img src={asset(`/character/${portraitOf[selectedId]}`)} alt={t(selected.name)} /> : selected.glyph}
              </div>
              <div><span className="school-tag">{t(selected.school)}</span><h2>{t(selected.name)}</h2><p>{t("字 {courtesy} · {region}", { courtesy: t(selected.courtesy), region: t(selectedRegion.name) })}</p>{selectedId !== "lvbuwei" && <p className="affinity-line">{t("交情 · {desc}", { desc: t(affinityDesc(userAffOf(selectedId))) })}</p>}</div>
            </div>
            <div className="doing"><span className="pulse" /><div><small>{t("此刻 {clock}", { clock: time.clock })}</small><strong>{tAction(presence.action)}</strong></div></div>
            {presence.event && <p className="scene-line">{t(presence.event.scene)}</p>}
            {/* 卡上这一句是典籍原文，不替换；英文模式下其下另附一行英译 */}
            <blockquote>“{selected.quote}”</blockquote>
            <Said text={selected.quote} scholar={selected.id} />
            <p className="intro">{t(selected.intro)}</p>
            <div className="actions">
              <button className="primary" onClick={() => openTalk(selectedId)}>{t("与他交谈")} <span>→</span></button>
              {moved ? (
                <button className="invited" onClick={() => clearOverride(selectedId)}>{t("归位")}</button>
              ) : (
                <button onClick={() => setPanel("debate")}>{t("辩论席")}</button>
              )}
            </div>

            <h3>{t("今日行程")} <small>{nextTick ? t("下一事 {clock}", { clock: nextTick }) : t("今日无事")}</small></h3>
            <ol className="agenda">
              {agendaFor(selected.id).map((e) => (
                <li key={e.id} className={presence.event?.id === e.id ? "now" : ""}>
                  <i>{tickLabel(e.start)}–{tickLabel(e.end)}</i>
                  <span>{t(e.title)}<small>{t(regionMap[e.region].name)}{e.actors.length > 1 ? ` · ${t("与{names}", { names: e.actors.filter((a) => a !== selected.id).map((a) => t(scholarMap[a].name)).join(t("、")) })}` : ""}</small></span>
                </li>
              ))}
            </ol>

            <div className="evidence"><span>{t("典籍依据")}</span><p>{selectedBooks.length
              ? t("回答由《{books}》等原典检索生成，引文标注出处，其余为立场推演。", { books: selectedBooks.map((b) => t(b)).join(t("》《")) })
              : t("{name}无本家典籍入此库，其言依其学派立场由大模型推演。", { name: t(selected.name) })}</p></div>

            <div className="roster">
              <h3>{t("附近的人")} <small>{t("{n} 人在阈值内", { n: nearbyList.length })}</small></h3>
              {nearbyList.length === 0 && <p className="intro">{t("附近无人。点地图移动此人物靠近他人，即可发起对话或辩论。")}</p>}
              {nearbyList.map((id) => {
                const s = scholarMap[id];
                return (
                  <button key={id} onClick={() => openChat(selectedId, id)}>
                    <i style={{ background: s.color }}>{s.glyph}</i>
                    <span>{t(s.name)}<small>{tActionBare(effectiveWorld[id].action)}</small></span>
                    <b>{t("对谈›")}</b>
                  </button>
                );
              })}
              {nearbyList.length >= 2 && (
                <button className="primary debate-start" onClick={() => openDebate("proximity", selectedId, nearbyList)}>
                  {t("发起辩论")} <span>◉</span>
                </button>
              )}
            </div>
          </div>}

          {panel === "profile" && talkActive && (() => {
            const partner = scholarMap[talkPartner];
            const pRegion = regionMap[effectiveWorld[talkPartner].region];
            return (
              <div className="chat-panel">
                <div className="chat-with">
                  <button onClick={() => setTalkActive(false)} aria-label={t("返回人物")}>←</button>
                  <div className="mini-avatar" style={{ background: partner.color }}>{partner.glyph}</div>
                  <div>
                    <h2>{t(partner.name)}</h2>
                    <p>{t("{region} · 与你交谈", { region: t(pRegion.name) })}</p>
                  </div>
                  <select className="talk-pick" value={talkPartner} onChange={(e) => openTalk(e.target.value)} aria-label={t("切换交谈对象")}>
                    {scholars.map((s) => <option key={s.id} value={s.id}>{t(s.name)}</option>)}
                  </select>
                </div>
                <p className="chat-hint">{t("右键诸子发言可译为白话")}</p>
                <div className="messages" ref={talkScrollRef}>
                  {talkMsgs.length === 0 && !talkThinking ? (
                    <p className="intro">{t("点地图上小人选中，再按「与他交谈」开始；或点右上选择交谈对象。")}</p>
                  ) : (
                    <>
                      {talkMsgs.map((m, i) => (
                        <div
                          key={i}
                          className={`message ${m.mine ? "mine" : ""}`}
                          onContextMenu={!m.mine ? (e) => toggleVern(i, e) : undefined}
                          title={!m.mine ? t("右键译为白话") : undefined}
                        >
                          <b>{m.mine ? t("我") : t(partner.name)}</b>
                          {!m.mine && (
                            <VerdictBadge verifying={m.verifying} verdict={m.verdict} note={m.verdictNote} verifier={m.verdictModel} crossModel={m.verdictCross} />
                          )}
                          {!m.mine && !m.streaming && m.text && (
                            <span className="speak-slot" onContextMenu={(e) => e.stopPropagation()}>
                              <SpeakButton text={m.text} scholarId={talkPartner} />
                            </span>
                          )}
                          <p>
                            {m.text || (!m.mine && m.streaming ? t("正在作答……") : "")}
                            {!m.mine && m.streaming && m.text ? <span className="stream-caret" aria-hidden>▍</span> : null}
                          </p>
                          {/* 诸子的话照旧由中文典籍检索生成，英文附在其下；中文模式此组件不渲染 */}
                          {!m.mine && !m.streaming && m.text && <Said text={m.text} scholar={talkPartner} />}
                          {!m.mine && m.vernShow && (
                            <div className="vernacular">
                              {m.vernLoading
                                ? m.vernacular
                                  ? <>{t("白话 · {text}", { text: m.vernacular })}<span className="stream-caret" aria-hidden>▍</span></>
                                  : t("正在译为白话……")
                                : m.vernacular
                                  ? t("白话 · {text}", { text: m.vernacular })
                                  : t("未能译为白话")}
                            </div>
                          )}
                          {!m.mine && <TraceableEvidence citations={m.citations ?? []} inferred={m.inferred} />}
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="suggestions">
                  {TALK_SUGGESTIONS.map((s) => <button key={s} onClick={() => sendTalk(s)}>{t(s)}</button>)}
                </div>
                {ownedItems.length > 0 && (
                  <div className="gift-row">
                    <span className="gift-label">{pendingGift ? t("奉贽·将奉 {name}", { name: t(pendingGift.name) }) : t("奉贽·点选为贽")}</span>
                    <div className="gift-chips">
                      {ownedItems.map((it) => {
                        const sel = pendingGift?.id === it.id;
                        return (
                          <button key={it.id} className={`gift-chip ${sel ? "on" : ""}`} onClick={() => setPendingGift(sel ? null : { id: it.id, name: it.name })} title={t(it.desc)}>
                            <i>{it.glyph}</i><b>{t(it.name)}</b><small>×{inv.items[it.id]}</small>
                          </button>
                        );
                      })}
                    </div>
                    {talkPartner === "kong" && (inv.items["shuxiu"] ?? 0) > 0 && !pendingGift && (
                      <small className="gift-hint">{t("可奉束脩为贽，孔子未尝无诲。")}</small>
                    )}
                  </div>
                )}
                <div className="composer">
                  <textarea
                    value={talkInput}
                    onChange={(e) => setTalkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendTalk(); } }}
                    placeholder={t("向 {name} 提问……", { name: t(partner.name) })}
                  />
                  <button onClick={() => sendTalk()}>{t("送出")}</button>
                </div>
              </div>
            );
          })()}

          {panel === "debate" && <div className="debate-panel">
            <p className="eyebrow">{t("百家争鸣 · 辩论席")}</p>
            <h2>{t("圆桌开辩")}</h2>
            <p className="intro">{t("不限位置，从全部人物中选人入席、自由输入辩题，圆桌围坐、四轮推进。也可在地图上移动人物靠近他人，由「附近的人」发起附近争鸣。")}</p>
            <button className="primary debate-start" onClick={() => openDebate("sidebar")}>{t("自由开辩")} <span>◉</span></button>

            <h3 style={{ marginTop: 22 }}>{t("双贤对谈")}</h3>
            <p className="intro">{t("看两位贤者围绕你的议题各陈其见（全页对谈，左主动方、右对象）。")}</p>
            <div className="duo-pick">
              <label>
                <small>{t("左 · 主动方")}</small>
                <select value={chatLeft} onChange={(e) => setChatLeft(e.target.value)}>
                  {scholars.map((s) => <option key={s.id} value={s.id}>{t(s.name)}</option>)}
                </select>
              </label>
              <label>
                <small>{t("右 · 对象")}</small>
                <select value={chatRight} onChange={(e) => setChatRight(e.target.value)}>
                  {scholars.map((s) => <option key={s.id} value={s.id}>{t(s.name)}</option>)}
                </select>
              </label>
            </div>
            <button className="primary" disabled={chatLeft === chatRight} onClick={() => openChat(chatLeft, chatRight)}>{t("开始双贤对谈")} <span>→</span></button>
          </div>}

          {panel === "canon" && <div className="profile-panel">
            <p className="eyebrow">{t("典籍")}</p><h2>{canonBookId ? t(canonFullMap[canonBookId]?.name ?? "句读") : t("查其所本")}</h2>
            <div className="composer canon-search">
              <textarea value={canonQuery} onChange={(e) => setCanonQuery(e.target.value)} placeholder={t("输入议题或词句，如「战争」「赏罚」「无用之用」")} />
            </div>
            <CanonGraphThumb onOpen={() => setGraphOpen(true)} />

            {canonQuery.trim() !== "" && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, marginBottom: 2 }}>
                  <button className="ghost-btn" onClick={() => setCanonQuery("")}>{t("‹ 返回")}</button>
                </div>
                <h3 style={{ margin: "8px 0 4px" }}>{t("引典")} <small>{t("（即时）")}</small></h3>
                {canonHits.length === 0 && <p className="intro">{t("引典未检得。")}</p>}
                <div className="canon-list">{canonHits.map((h) => (
                  <article key={h.id}>
                    <header>《{t(h.book)}·{t(h.chapter)}》{h.id.startsWith("siku:") && <small>{t("（全文）")}</small>}{h.owner && scholarMap[h.owner] && <i style={{ background: scholarMap[h.owner].color }}>{scholarMap[h.owner].glyph}</i>}<b>{h.score.toFixed(1)}</b></header>
                    <blockquote>{h.text}</blockquote>
                    <p>{h.gloss}</p>
                  </article>
                ))}</div>
                <h3 style={{ margin: "12px 0 4px" }}>{t("全文")} <small>{t("（{mode}）", { mode: canonFullLoading ? t("检索中…") : t("语义") })}</small></h3>
                {canonFullHits.length === 0 && !canonFullLoading && <p className="intro">{t("全文未检得（或未生成全文向量，降级关键词）。")}</p>}
                <div className="canon-list">{canonFullHits.map((h) => (
                  <article key={h.verseId}>
                    <header>《{t(h.book)}·{t(h.chapter)}》<b>{h.score.toFixed(1)}</b></header>
                    <blockquote>{h.text}</blockquote>
                    {h.gloss && <p>{h.gloss}</p>}
                  </article>
                ))}</div>
              </>
            )}

            {canonQuery.trim() === "" && (
              canonBookId ? (
                <>
                  <button className="ghost-btn" onClick={() => setCanonBookId(null)}>{t("‹ 返回书目")}</button>
                  <div className="canon-reader">
                    {canonReaderVerses.map((v) => <VerseCard key={v.verseId} verse={v} />)}
                  </div>
                </>
              ) : (
                <>
                  <button className="siku-door" onClick={() => { setSikuGroup(undefined); setSikuBook(undefined); setSikuOpen(true); }}>
                    <b>{t("四库全书")}</b>
                    <small>{t("经史子集四部、一千余部著录；选中者可逐章读")}</small>
                    <i>{t("入四库 →")}</i>
                  </button>
                  <ScholarShelf
                    onOpenSiku={(bid) => { setSikuGroup(undefined); setSikuBook(bid); setSikuOpen(true); }}
                    onOpenVerse={setCanonBookId}
                  />
                </>
              )
            )}
          </div>}

          {panel === "yulu" && <AnthologyPanel entries={yuluEntries} onRemove={removeYulu} />}
        </aside>
      </div>

      {chat && (
        <DialogueStage
          key={`${chat.initiator}-${chat.partner}`}
          initiator={scholarMap[chat.initiator]}
          partner={scholarMap[chat.partner]}
          initiatorRegion={effectiveWorld[chat.initiator].region}
          partnerRegion={effectiveWorld[chat.partner].region}
          onClose={closeChat}
        />
      )}
      {debate && (
        <DebateStage
          mode={debate.mode}
          initiatorId={debate.initiator}
          nearbyIds={debate.nearby}
          world={effectiveWorld}
          onClose={closeDebate}
          onArchive={addEntry}
          shichen={time.shichen}
          presetTopic={debate.preset?.topic}
          presetSeated={debate.preset?.seated}
          autoStart={!!debate.autoStart}
        />
      )}
      {qlayer === "quiz" && (
        <QuizLayer
          date={today}
          shichen={time.shichen}
          hasQid={(qid) => seals.some((s) => s.qid === qid)}
          onAward={(seal) => sealsApi.add(seal)}
          onAnswer={applyAnswer}
          onClose={() => setQlayer(null)}
        />
      )}
      {qlayer === "seals" && <SealsLayer seals={seals} onClose={() => setQlayer(null)} />}
      {qlayer === "user" && (
        <UserPanel
          user={user}
          streak={streak}
          seals={seals}
          titles={titles}
          affinity={affinity}
          onRename={setUserName}
          onOpenSeals={() => setQlayer("seals")}
          onClose={() => setQlayer(null)}
        />
      )}
      {lineageOpen && <LineageMap onClose={() => setLineageOpen(false)} />}
      {marketOpen && <MarketView inv={inv} invApi={invApi} onClose={() => setMarketOpen(false)} />}
      {graphOpen && <CanonGraphLayer onClose={() => setGraphOpen(false)} initialQuery={canonQuery} />}
      {sikuOpen && (
        <SikuLayer
          key={`siku-${sikuEpoch}`}
          onClose={() => { setSikuOpen(false); setSikuBook(undefined); setSikuChap(undefined); setSikuHit(undefined); }}
          initialGroup={sikuGroup}
          initialBookId={sikuBook}
          initialChapterLabel={sikuChap}
          initialHitText={sikuHit}
          tourAsk={sikuAsk ?? undefined}
        />
      )}
      {/* 世界文学阅读层本不属战国这一屏，但日签就在这屏的题名旁，点一条西书记事
          总得有处可落——故此屏也挂它一份，返回即回此屏。 */}
      {wlOpen && (
        <WorldLitLayer
          key={`wl-${wlEpoch}`}
          onClose={() => { setWlOpen(false); setWlChap(undefined); setWlHit(undefined); }}
          initialBookId={wlBook}
          initialLang={wlLang}
          initialChapter={wlChap}
          initialHitText={wlHit}
          backLabel="返回天下"
          wlAsk={wlAsk ?? undefined}
        />
      )}
      {chronOpen && (
        <ChronicleLayer
          onClose={() => setChronOpen(false)}
          onOpenSiku={chronToSiku}
          onOpenLit={chronToLit}
          backLabel="返回天下"
        />
      )}
      {motifOpen && <MotifLayer onClose={() => setMotifOpen(false)} />}
      {xmediaOpen && <CrossMediaLayer onClose={() => setXmediaOpen(false)} />}
      {/* 导览置于最后：层级最高，气泡压在各全屏浮层之上 */}
      {tourCh && (
          <TourLayer
            key={tourCh}
            chapter={tourCh}
            startAt={tourCh === "siku" && sikuOpen ? SIKU_FROM_GATES : 0}
            onNeedPanel={tourNeedPanel}
            onAct={tourAct}
            onDone={tourFinish}
          />
        )}
      {curtain}
      {languageGate}
    </main>
  );
}
