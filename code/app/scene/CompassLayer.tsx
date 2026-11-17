"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { compassOf, type WorldId, type CompassPoint, type Part } from "../world/worlds";
import { loadCatalog, catalogStats } from "../world/siku";
import { useLang, useT } from "../i18n/lang";
import { XMEDIA_ON } from "../world/feature-flags";
import LangToggle from "../i18n/LangToggle";
import PortolanChart from "./PortolanChart";
import ChronicleBadge from "./ChronicleBadge";

/**
 * 过门的那一阵云气：几团烟聚而复散，散开便是盘面。
 *
 * 每团一行：`x/y` 是起处（百分比），`s` 是径（vmax），`dx/dy` 是散向（vw/vh），
 * `d` 是起时（秒）。上下左右各有去向，故散时像被风掀开，不像一块布淡出去。
 * 居中那两团最大、去得最慢——盘心在那里，云要最后才让开。
 */
const PUFFS = [
  { x: 50, y: 46, s: 78, dx: -8, dy: -14, d: 0.1 },
  { x: 46, y: 52, s: 70, dx: 10, dy: 12, d: 0.16 },
  { x: 16, y: 32, s: 58, dx: -52, dy: -16, d: 0 },
  { x: 84, y: 34, s: 56, dx: 50, dy: -14, d: 0.04 },
  { x: 22, y: 76, s: 52, dx: -44, dy: 26, d: 0.08 },
  { x: 78, y: 74, s: 54, dx: 46, dy: 24, d: 0.02 },
  { x: 50, y: 14, s: 46, dx: 4, dy: -44, d: 0.12 },
  { x: 50, y: 88, s: 48, dx: -4, dy: 40, d: 0.06 },
];

/** 二十四山：自正北起顺时针，一支一干（或一维）相间。地支重书，干维轻书。 */
const MOUNTAINS = "子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬".split("");
const BRANCHES = new Set([..."子丑寅卯辰巳午未申酉戌亥"]);

/**
 * 后天八卦：依洛书布位（坎北、离南、震东、兑西），只画卦形、不书卦名。
 * `yao` 自下而上，1 画整爻、0 画断爻——坎中满 010、乾三连 111。
 */
const TRIGRAMS: { deg: number; yao: string }[] = [
  { deg: 0, yao: "010" }, // 坎
  { deg: 45, yao: "001" }, // 艮
  { deg: 90, yao: "100" }, // 震
  { deg: 135, yao: "011" }, // 巽
  { deg: 180, yao: "101" }, // 离
  { deg: 225, yao: "000" }, // 坤
  { deg: 270, yao: "110" }, // 兑
  { deg: 315, yao: "111" }, // 乾
];

/**
 * 四隅之座：一部领一世界。座次依四部之序——左上经、右上史、左下子、右下集，
 * 如书页的读法。`deg` 是盘心望向座位的方向（正北为零、顺时针），指针据此转向。
 */
const SEATS: { part: Part; deg: number; x: number; y: number; point: CompassPoint }[] = [
  { part: "经", deg: 315, x: 152, y: 150, point: compassOf("北") }, // 经部 · 三国
  { part: "史", deg: 45, x: 828, y: 150, point: compassOf("南") }, // 史部 · 史记
  { part: "子", deg: 225, x: 152, y: 830, point: compassOf("东") }, // 子部 · 先秦诸子
  { part: "集", deg: 135, x: 828, y: 830, point: compassOf("西") }, // 集部 · 西游（小说归集部，西游自此坐实）
];

/** 指针归位之所：子部·先秦诸子是最先铺开的世界，无悬停时针即指此。 */
const HOME_DEG = 225;

/**
 * 四隅座位的半宽。英文名长，座牌跟着宽一截（204→262）——仍不碰盘缘：
 * 左座加宽后右缘止于 x=283，而盘影在那一段纬度上自 x=295 起，中间还隔着十二。
 */
const SEAT_HW = { zh: 102, en: 131 } as const;

/**
 * 座牌上的名字折行。
 *
 * 中文名三四字，一行足矣。英文名长的如 "Records of the Grand Historian" 三十字，
 * 一行无论怎么缩字号都要出框——出框难看，缩到看不清更难看，故折两行。
 * 折处取词界中点附近，使两行长短相当（不是填满一行再换，那样下一行常只剩一个词）。
 */
function nameLines(s: string, en: boolean): string[] {
  if (!en || s.length <= 18) return [s];
  const words = s.split(" ");
  if (words.length < 2) return [s];
  let cut = 1;
  let best = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const b = words.slice(i).join(" ").length;
    const skew = Math.abs(a - b);
    if (skew < best) {
      best = skew;
      cut = i;
    }
  }
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/**
 * 罗盘 —— 进门第一屏。
 *
 * 换世界的入口从前是顶栏一枚小扣子，如今摊成一整面堪舆罗盘：**四库居中为针池，
 * 经史子集四部各据一隅，一部之内各启一世界**。盘是照着罗盘的路数画的——外环
 * 二十四山（地支重书、干维轻书），内环后天八卦，细墨线圈定界，朱砂只点在指针
 * 与四方部印上。素纸淡墨，不取铜盘鎏金的厚重。
 *
 * 四隅即世界之座：已开者（西游、先秦诸子）点之即入，过场自该隅漫开；未启者
 * （三国、史记）虚线框居之，针指过去、盘下翻出其一句本事，书却先在四库架上——
 * 空着比藏着好，一眼看得出后面还有什么。西游是集部小说，从前误坐史隅，今归集部；
 * 史隅改请真史（《史记》），各归其部。盘面上缘压一枚名牌「四库全书罗盘」。
 *
 * 外国经典不入四库，另立一轴在世界文学航路（右幅海图），与这里的四部并立、
 * 交于母题。
 */
export default function CompassLayer({
  onEnter,
  onOpenSiku,
  onOpenSikuScroll,
  onOpenGeoMap,
  onOpenMotif,
  onOpenCrossMedia,
  onOpenBook,
  onOpenChronicle,
  onOpenTour,
}: {
  /** 入某一已开世界。带上所点之部——过场自该隅漫开，见 page.tsx 的 `travelTo` */
  onEnter: (id: WorldId, from: Part) => void;
  /** 开四库总目；带部则直接落在该部 */
  onOpenSiku: (group?: string) => void;
  /** 开四库脉络长卷（可读各书依朝代铺开的横滚图，见 SikuScrollLayer） */
  onOpenSikuScroll: () => void;
  /** 开时空文脉地图：朝代、地点、人物、典籍与思想路径同屏展开 */
  onOpenGeoMap: () => void;
  /** 开母题层（跨世界评议，不属任何一部） */
  onOpenMotif: () => void;
  /** 开跨媒介点评层（影音总库横着比媒介，与跨世界评议并立，见 CrossMediaLayer） */
  onOpenCrossMedia: () => void;
  /** 自海图开世界文学典籍页：泊港翻开其书（bookId 见 worldlit 目录），
   *  点书架涡卷则不带 id——先见架面总目 */
  onOpenBook?: (bookId?: string) => void;
  /** 开历史大事件层（题名旁那枚日签点进去的地方，见 ChronicleLayer） */
  onOpenChronicle?: () => void;
  /** 开新手导览册目（题名旁那枚圆钮「导」，见 TourIndexPanel） */
  onOpenTour?: () => void;
}) {
  /** 悬停或聚焦之部：针随它转，盘下那一行字也随它换 */
  const [hover, setHover] = useState<Part | null>(null);
  const [stats, setStats] = useState<{ total: number; readable: number } | null>(null);
  const t = useT();
  const lang = useLang();
  const en = lang === "en";
  const hw = en ? SEAT_HW.en : SEAT_HW.zh;
  /**
   * 过门的云气在不在。
   *
   * 不做成纯 CSS 常挂一层：它盖着整屏，动画跑完若还留在 DOM 里，
   * 便是一层看不见的东西压在盘面上（纵然 pointer-events: none，也还占着合成层）。
   * 故到时拆掉。1.8 秒是云散尽的时刻，见 globals.css 的 cp-puff。
   */
  const [haze, setHaze] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHaze(false), 1800);
    return () => clearTimeout(t);
  }, []);

  // 目录只为在盘心报个数（一千余部、几十部可读），取不到就不报，不拦入世界
  useEffect(() => {
    let live = true;
    loadCatalog().then(
      (c) => {
        if (!live) return;
        const s = catalogStats(c);
        setStats({ total: s.total, readable: s.readable });
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);

  const seat = hover ? SEATS.find((s) => s.part === hover) ?? null : null;
  const needle = seat ? seat.deg : HOME_DEG;

  return (
    <div className="cp-shell">
      {/* 云气在最上，盘面在其下自行铺开（见 globals.css 的 tv-pop 三拍）：
          云散开的时候盘面已经成形，看着便是拨云见盘，不是等云走了再搭台子。 */}
      {haze && (
        <div className="cp-cloud" aria-hidden>
          {PUFFS.map((p, i) => (
            <i
              key={i}
              style={{
                left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}vmax`, height: `${p.s * 0.74}vmax`,
                "--dx": `${p.dx}vw`, "--dy": `${p.dy}vh`, animationDelay: `${p.d}s`,
              } as CSSProperties}
            />
          ))}
        </div>
      )}

      <header className="cp-top">
        <div className="brand-mark">脈</div>
        <div className="brand-copy">
          <p>{t("经史子集，各有一世界")}</p>
          <h1>{t("文渊寻脉")}</h1>
        </div>
        {/* 题名右侧三样，按初来者用得上的先后排：先「导」（不知从何处看起的，第一眼便见），
            再中英（看不懂中文的，第二眼便能换语），后日签（这是日常来客才回头看的一处）。 */}
        {/* 新手导览那一枚圆钮：进门第一屏就在题名旁，点开即五册册目（见 TourIndexPanel）。
            从前册目藏在「客」字档案里，而档案要进了诸子那一世界才点得到——初学者最想找
            它的时候正在这一屏上，故迁来此处。作圆而不作牌：它不是第四条横贯之路，
            是一枚随手可按的印记，圆形也与盘面的圈圈同调。 */}
        {onOpenTour && (
          <button className="cp-guide" onClick={onOpenTour} title={t("新手导览 · 五册")} aria-label={t("新手导览 · 五册")}>
            <i aria-hidden>导</i>
          </button>
        )}
        {/* 切换钮：英文读者进门第一眼就能换语，不必先猜哪个按钮是设置 */}
        <LangToggle />
        {/* 日签：进门抬眼即见今日干支与史上这一日的一件事。
            要查日期人名的从这儿点进去（ChronicleLayer）。 */}
        {onOpenChronicle && <ChronicleBadge onOpen={onOpenChronicle} />}
        {/* 三枚签牌：朱砂印一字，牌上两行——大字是去处，小字是这去处做什么。
            素线小钮看着像页脚链接，而这三处是整个门户仅有的横贯之路
            （一贯四库、一贯诸世界、一贯诸媒介），故给它们一副牌面。 */}
        <div className="cp-top-links">
          <button className="cp-top-tab" onClick={onOpenSikuScroll} title={t("中西典籍 · 文明长卷")}>
            <i aria-hidden>库</i>
            <span><b>{t("文明长卷")}</b><em>{t("四库文脉 · 中西同期对照")}</em></span>
          </button>
          <button className="cp-top-tab" onClick={onOpenGeoMap} title={t("朝代地点 · 时空文脉")}>
            <i aria-hidden>舆</i>
            <span><b>{t("时空文脉")}</b><em>{t("地点 · 人物 · 典籍 · 思想")}</em></span>
          </button>
          <button className="cp-top-tab" onClick={onOpenMotif} title={t("母题 · 跨世界评议")}>
            <i aria-hidden>题</i>
            <span><b>{t("跨世界评议")}</b><em>{t("母题 · 诸世界各出其解")}</em></span>
          </button>
          {XMEDIA_ON && (
            <button className="cp-top-tab" onClick={onOpenCrossMedia} title={t("影音 · 跨媒介点评")}>
              <i aria-hidden>媒</i>
              <span><b>{t("跨媒介点评")}</b><em>{t("影音总库 · 四库与西方")}</em></span>
            </button>
          )}
        </div>
      </header>

      <div className="cp-body">
        {/* 左半幅：罗盘与盘下一行据脚。海图居右，同纸异幅 */}
        <div className="cp-left">
        <div className="cp-dial">
          <svg className={`cp-pan${en ? " lang-en" : ""}`} viewBox="0 0 980 980" role="img"
            aria-label={t("四库全书罗盘：外环二十四山，内环八卦，盘心四库，四隅经史子集各领一世界")}>
            {/* 名牌：盘面上缘压一行字——器物有名，两侧各收一线，素纸淡墨不夺盘 */}
            <text className="ln-plate" x={490} y={88} textAnchor="middle">{t("四库全书罗盘")}</text>
            <line className="ln-plate-line" x1={303} y1={77} x2={349} y2={77} />
            <line className="ln-plate-line" x1={631} y1={77} x2={677} y2={77} />

            {/* 盘底三染：纸上一圈盘影、盘身一层淡赭；山带稍深、卦带稍浅、针道再深一线，
                一圈圈像真盘的环带拓在纸上。洗色都在纸色系里、不过半透，
                后画的一切（细线、山字、卦爻、指针、天池）都压在其上 */}
            <circle className="ln-halo" cx={490} cy={490} r={346} />
            <circle className="ln-face" cx={490} cy={490} r={331} />
            <circle className="ln-band" cx={490} cy={490} r={307} strokeWidth={47} />
            <circle className="ln-band inner" cx={490} cy={490} r={254} strokeWidth={57} />
            <circle className="ln-band mid" cx={490} cy={490} r={183.5} strokeWidth={87} />

            {/* 盘缘：双线圈定盘面 */}
            <circle cx={490} cy={490} r={340} className="ln-ring" />
            <circle cx={490} cy={490} r={331} className="ln-ring thin" />

            {/* 二十四山环：分格线落在两山之间，字立而不倒（不随方位旋转） */}
            {MOUNTAINS.map((_, i) => {
              const rad = (((i + 0.5) * 15) * Math.PI) / 180;
              return (
                <line key={`d${i}`} className="ln-div"
                  x1={490 + Math.sin(rad) * 283} y1={490 - Math.cos(rad) * 283}
                  x2={490 + Math.sin(rad) * 331} y2={490 - Math.cos(rad) * 331} />
              );
            })}
            <circle cx={490} cy={490} r={283} className="ln-ring thin" />
            {MOUNTAINS.map((m, i) => {
              const rad = (i * 15 * Math.PI) / 180;
              return (
                <text key={m} className={BRANCHES.has(m) ? "ln-shan branch" : "ln-shan"}
                  x={490 + Math.sin(rad) * 307} y={490 - Math.cos(rad) * 307}
                  textAnchor="middle" dominantBaseline="central">{m}</text>
              );
            })}

            {/* 八卦环：每卦随方位转组画出，横爻相叠、自下而上 */}
            <circle cx={490} cy={490} r={227} className="ln-ring thin" />
            {TRIGRAMS.map((t) => (
              <g key={t.deg} className="ln-gua" transform={`rotate(${t.deg} 490 490)`}>
                {[0, 1, 2].map((r) => {
                  const y = 254 - r * 16;
                  return (
                    <path key={r} className="ln-yao"
                      d={t.yao[r] === "1" ? `M472,${y} L508,${y}` : `M472,${y} L487.5,${y} M492.5,${y} L508,${y}`} />
                  );
                })}
              </g>
            ))}

            {/* 指针：朱砂一撮，随所观之隅转。臂只走在盘心与八卦环之间的空环里，
                不压卦、不压山字；对侧一段淡墨，是针的配重 */}
            <g className="ln-needle" style={{ transform: `rotate(${needle}deg)` }}>
              <polygon className="ln-n-tail" points="488.2,638 491.8,638 491,662 489,662" />
              <polygon className="ln-n-arm" points="486.6,342 493.4,342 491.6,318 488.4,318" />
              <polygon className="ln-n-head" points="490,266 498.4,294 490,322 481.6,294" />
            </g>

            {/* 盘心即四库：针池稍深一圈，点之落四库总目 */}
            <g className="ln-hub" role="button" tabIndex={0} aria-label={t("四库全书总目")}
              onClick={() => onOpenSiku()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenSiku()}>
              <circle className="ln-hub-face" cx={490} cy={490} r={140} />
              <circle className="ln-hub-inner" cx={490} cy={490} r={130} />
              <text className="ln-hub-t" x={490} y={478} textAnchor="middle">{t("四库")}</text>
              <text className="ln-hub-s" x={490} y={517} textAnchor="middle">{t("经 · 史 · 子 · 集")}</text>
              {stats && (
                <text className="ln-hub-n" x={490} y={543} textAnchor="middle">
                  {t("{total} 部 · {readable} 部可读", { total: stats.total, readable: stats.readable })}
                </text>
              )}
            </g>

            {/* 四隅引线：自盘缘一细线牵到座位，若有若无 */}
            {SEATS.map((s) => {
              const nx = s.x + (s.x < 490 ? hw : -hw);
              const ny = s.y + (s.y < 490 ? 54 : -54);
              const d = Math.hypot(nx - 490, ny - 490);
              const px = 490 + ((nx - 490) / d) * 344;
              const py = 490 + ((ny - 490) / d) * 344;
              return <line key={s.part} className="ln-link" x1={px} y1={py} x2={nx} y2={ny} />;
            })}

            {/* 四隅座位：部印一方、世界一名。已开者实线框，未启者虚线框。
                外层 g 管位移，内层 g 管入场动画——CSS transform 会盖掉 transform
                属性，两层各司其职才不互相踢（见 globals.css 的 tv-pop）。 */}
            {SEATS.map((s, i) => {
              const live = Boolean(s.point.worldId);
              const lines = nameLines(t(s.point.name), en);
              /** 名字折两行时，整块往上提一行的半高，使名＋纪年仍居座牌之中 */
              const nameY = lines.length > 1 ? -9 : 0;
              return (
                <g key={s.part} transform={`translate(${s.x},${s.y})`}>
                  <g
                    className={`ln-seat${live ? "" : " locked"}${hover === s.part ? " on" : ""}`}
                    style={{ animationDelay: `${0.14 + i * 0.05}s` }}
                    role="button" tabIndex={0}
                    aria-label={t("{part}部 · {name}·{state}", {
                      part: t(s.part),
                      name: t(s.point.name),
                      state: live ? t("入其世界") : t("未启"),
                    })}
                    onClick={() => (live ? onEnter(s.point.worldId!, s.part) : setHover(s.part))}
                    onMouseEnter={() => setHover(s.part)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(s.part)}
                    onBlur={() => setHover(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (live) onEnter(s.point.worldId!, s.part);
                        else setHover(s.part);
                      }
                    }}>
                    <rect className="ln-seat-box" x={-hw} y={-54} width={hw * 2} height={108} rx={3} />
                    <rect className="ln-seal" x={-hw + 8} y={-20} width={44} height={44} rx={2} />
                    <text className="ln-seal-ch" x={-hw + 30} y={2} textAnchor="middle" dominantBaseline="central">
                      {s.part}
                    </text>
                    <text className="ln-seat-name" x={-hw + 64} y={nameY}>
                      {lines.map((ln, k) => (
                        <tspan key={k} x={-hw + 64} dy={k === 0 ? 0 : 19}>{ln}</tspan>
                      ))}
                    </text>
                    <text className="ln-seat-era" x={-hw + 64} y={28}>{t(s.point.era)}</text>
                    {!live && <text className="ln-seat-chip" x={hw - 8} y={-30} textAnchor="end">{t("未启")}</text>}
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 盘下据脚：所悬之隅的二三句，悬停即换（key 换元素以重放动画）。
            整屏的说明只此一行，不再另铺题解卡 */}
        <div className="cp-cap">
          <div className="cp-cap-main" key={hover ?? "盘"}>
            {seat ? (
              <>
                <b>{t(seat.point.name)}<i>{t(seat.point.era)}</i>{!seat.point.worldId && <em>{t("未启")}</em>}</b>
                <p>
                  {t(seat.point.hint)}
                  {!seat.point.worldId && t("——此隅未启，其书先在架上。")}
                </p>
              </>
            ) : (
              <>
                <b>{t("四隅之内")}</b>
                <p>{t("四部各居一隅：点其方框即入其世界，盘心即四库总目。")}</p>
              </>
            )}
          </div>
          <div className="cp-cap-side">
            {seat && (
              <button className="cp-cap-link" onClick={() => onOpenSiku(seat.part)}>
                {t("上架一观 →")}
              </button>
            )}
          </div>
        </div>
        </div>

        {/* 右半幅：外国经典不入四库，另立为世界文学一轴，海图即其入口。
            帆船可循红色虚线驶往八港，泊下即可翻开其书（见 PortolanChart 顶注）。 */}
        <PortolanChart onOpenBook={onOpenBook} />
      </div>
    </div>
  );
}
