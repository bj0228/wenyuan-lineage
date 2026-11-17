"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COASTS, project, latAt, MAP_W, MAP_H, LON0, LON1 } from "../world/atlantic-coast";
import { useT } from "../i18n/lang";

/**
 * 世界文学航路图 —— 盘面右侧新拓的一列。
 *
 * 外国经典不入四库四部（那是中国的书架），故在这块海图上另立一轴：书架上有几部书，
 * 图上便有几个港，帆船循红色虚线的航路逐港而泊。
 * 两轴之交在母题层——同一个处境，各答各的（见 MotifLayer），海图只管「有哪些书、
 * 从哪条路走近它们」。
 *
 * **这是一张真图，不是写意的装饰。** 从前岸线是手捏的几块团云，书钉在上头便全错了位：
 * 哈姆雷特落在不列颠、堂吉诃德落在比海更西的地方。今改成三条实的：
 *   一、海岸线取 Natural Earth 1:50m，按墨卡托压到画布（见 atlantic-coast.ts）；
 *   二、每港只记真经纬，画布坐标一律由 `project()` 算出——书各在其该在之处：
 *       哈姆雷特在丹麦的厄尔锡诺而非伦敦，堂吉诃德在拉曼恰，奥德赛在伊大卡；
 *   三、航路不走直尺，循真水道：出好望角北上，过直布罗陀入地中海，再穿英吉利海峡
 *       西渡大西洋——每段的中途点都是真地名（见各港的 `via`）。
 *
 * 画法仍取波特兰海图（portolan）：羊皮纸做旧、恒向线自罗经花放射、经纬网细如游丝。
 * 右下另镇一枚书架涡卷——盘心四库既可通总目，海图也留一扇上架的门。船只听得懂点击：
 * 落点必须是航路上的港口，船便沿虚线驶去；已泊之港印记填实，「扬帆返航」则回锚地。
 * 航程存 localStorage，刷新不丢。
 */

/** 一港即一书：名、作者、泊地、一句题解，外加它在地球上的真位置 */
type Port = {
  name: string;
  author: string;
  /** 泊地：书之所系之地——或故事所在，或成书之地，与下面的经纬相符 */
  place: string;
  line: string;
  lon: number;
  lat: number;
  /** 标签相对港口印记的偏移。欧洲一隅挤了六港，须各让一方，故逐港手定，并牵一条细引线 */
  lx: number;
  ly: number;
  anchor?: "start" | "middle" | "end";
  /** 自上一港来的中途水道（经纬）：循海而行，不穿山越岭 */
  via?: [number, number][];
  /** 书架 id（worldlit/catalog.json 的 id），翻开此书之用 */
  bookId?: string;
};

/** 锚地：好望角。
 *  苏伊士未凿之世，自中土浮海而西只有这一条路——绕非洲之南，北上大西洋。
 *  这些书是坐船来中国的，图上便让船从它们来的那条路回去。 */
const HOME = { lon: 18.47, lat: -34.36 };

/**
 * 八港次序即航线次序，也是一条走得通的航程：
 * 好望角启航 → 北上大西洋 → 直布罗陀入地中海 → 雅典、伊大卡（希腊两港）→
 * 折返出海峡 → 伊比利亚（拉曼恰）→ 比斯开湾、塞纳河口（巴黎）→ 北海、易北河（莱比锡）→
 * 厄勒海峡（厄尔锡诺）→ 泰晤士河口（伦敦）→ 横渡大西洋 → 佛罗里达（坦帕）。
 */
const PORTS: Port[] = [
  {
    name: "仲夏夜之梦", author: "莎士比亚", place: "希腊 · 雅典", lon: 23.73, lat: 37.98,
    lx: 16, ly: 26, anchor: "start", bookId: "zhongxia",
    line: "仙王仙后怄气，迫克一点花汁，雅典林中人人颠倒——喜剧轻得能飞。",
    via: [[10, -20], [0, -6], [-16, 14], [-11, 31], [-5.6, 35.95], [3, 37.4], [12, 36.8], [21.6, 35.9], [23.6, 37.4]],
  },
  {
    name: "奥德赛", author: "荷马", place: "希腊 · 伊大卡", lon: 20.64, lat: 38.42,
    lx: -14, ly: -26, anchor: "end", bookId: "odyssey",
    line: "十年归途，海上的一切磨难与诱惑俱在其中——西方航海叙事的源头。",
    via: [[23.2, 36.6], [21.2, 36.4]],
  },
  {
    name: "堂吉诃德", author: "塞万提斯", place: "西班牙 · 拉曼恰", lon: -3.2, lat: 39.3,
    lx: -18, ly: 30, anchor: "end", bookId: "quixote",
    line: "以骑士小说之虚，行救世之实——第一部现代小说。",
    via: [[17.5, 37.2], [10, 37.4], [0, 36.6], [-5.6, 35.95], [-6.9, 37.1]],
  },
  {
    name: "茶花女", author: "小仲马", place: "法兰西 · 巴黎", lon: 2.35, lat: 48.85,
    lx: -16, ly: 28, anchor: "end", bookId: "chahua",
    line: "茶花开落之间，巴黎名妓以身殉情——林译第一部，哀感顽艳自此始。",
    via: [[-9.3, 38.7], [-9.5, 43.2], [-4.6, 48.2], [0.1, 49.5]],
  },
  {
    name: "浮士德", author: "歌德", place: "德意志 · 莱比锡", lon: 12.37, lat: 51.34,
    lx: 20, ly: 12, anchor: "start", bookId: "faust",
    line: "以灵魂为注，与魔鬼赌一场不止息的追求。",
    via: [[1.6, 51.1], [4.5, 53.4], [8.5, 53.9]],
  },
  {
    name: "哈姆雷特", author: "莎士比亚", place: "丹麦 · 厄尔锡诺", lon: 12.61, lat: 56.04,
    lx: 20, ly: -14, anchor: "start", bookId: "hamlet",
    line: "复仇延宕之间，生与死、行动与思虑的处境尽出。",
    via: [[10.6, 54.1]],
  },
  {
    name: "天演论", author: "赫胥黎", place: "英格兰 · 伦敦", lon: -0.13, lat: 51.51,
    lx: -22, ly: -12, anchor: "end", bookId: "tianyan",
    line: "「物竞天择，适者生存」——严复译赫胥黎，一句惊醒千年沉梦。",
    via: [[11.6, 57.6], [5.5, 55.6], [1.6, 51.6]],
  },
  {
    name: "月界旅行", author: "凡尔纳", place: "美利坚 · 佛罗里达", lon: -82.46, lat: 27.95,
    lx: -8, ly: 30, anchor: "middle", bookId: "yuejie",
    line: "巨炮一发，三人乘弹射月——凡尔纳的梦，经鲁迅的笔先到中国。",
    via: [[1.2, 50.8], [-5.5, 49.6], [-20, 45], [-45, 38], [-66, 31], [-79.8, 25.4]],
  },
];

const START = project(HOME.lon, HOME.lat);
/** 各港的画布坐标：只此一处换算，别处一律引用它——免得图上一套、航路上又一套 */
const XY = PORTS.map((p) => project(p.lon, p.lat));

/**
 * 航路全程的折线：锚地起，中途水道逐点相缀，港口落在其中某几点上。
 * `portAt[i]` 记第 i 港落在折线的第几点——船要驶往某港，便是驶到那一点的弧长处。
 */
function routeGeom() {
  const pts: { x: number; y: number }[] = [START];
  const portAt: number[] = [];
  PORTS.forEach((p, i) => {
    for (const [lon, lat] of p.via ?? []) pts.push(project(lon, lat));
    pts.push(XY[i]);
    portAt.push(pts.length - 1);
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, cum, portAt };
}

/** 弧长 → 位置与该段航向（度，屏幕系：正东为零） */
function posAt(cum: number[], pts: { x: number; y: number }[], s: number) {
  const total = cum[cum.length - 1];
  const ss = Math.max(0, Math.min(total, s));
  for (let i = 1; i < pts.length; i++) {
    if (ss <= cum[i] || i === pts.length - 1) {
      const t = (ss - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t;
      const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t;
      const ang = (Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) * 180) / Math.PI;
      return { x, y, ang };
    }
  }
  return { x: pts[0].x, y: pts[0].y, ang: 0 };
}

/** 船身缩到的倍数；桅顶到船底约六十点，缩后四十余点，与九百点宽的洋面相称 */
const SHIP = 0.72;
/** 船身容许的倾角上限。海图上的船从不立起来，最多斜这么一点 */
const TILT = 26;

/**
 * 航向 → 船该怎么摆。
 *
 * 船头画在 +x、桅杆画在 −y，若只拿航向去 `rotate`，便有两桩怪事：航向偏西时整条船翻过来
 * 倒着走（这是看图的人先察觉的那一桩）；航向近正南北时船直立起来，像在沉或在竖桅。
 *
 * 海图上画船从来不是这么画的——船身大致保持水平，只以**船头朝左朝右**分东西。故此处：
 * 偏西则沿**纵轴**镜像（`scale` 的 x 取负：船头转向左，桅杆仍朝天；若镜横轴则桅杆朝地，
 * 正是倒着走的那一桩），倾角另算且收在 ±26° 之内，只作个意思。
 */
function shipFacing(ang: number) {
  const a = (((ang % 360) + 540) % 360) - 180; // 归到 [-180,180)
  const left = Math.abs(a) > 90;
  // 镜像之后 rotate 要补 180°，船头才仍指着航向（见 scale(-1,1) 与 rotate 的复合）
  const t = left ? a - Math.sign(a) * 180 : a;
  return { tilt: Math.max(-TILT, Math.min(TILT, t)), sx: left ? -SHIP : SHIP };
}

const SPEED = 190; // 众单位/秒：全程绕过半个大西洋，约十秒；港间短腿不过一两秒
const STORE_KEY = "zhuzi-sea-chart";
/** 六港时代的旧档按序号记账，港口增删便错位；故旧档迁名（下表），此后存档只存书名。
 *  百年孤独后来撤港（版权期内收不了全卷），旧档指到它时按名寻不到，船自回锚地 */
const LEGACY_PORTS = ["奥德赛", "天演论", "堂吉诃德", "哈姆雷特", "浮士德", "百年孤独"];
/** 港口印记里那颗四芒星 */
const STAR = "M0,-4.2 L1.3,-1.3 4.2,0 1.3,1.3 0,4.2 -1.3,1.3 -4.2,0 -1.3,-1.3 Z";

/** 罗经花镇南大西洋那一片空海。
    书架从前也镇在图里（南太平洋，智利以西），是个线画的小牌子；今已出图，
    改作右缘那座嵌入式木架（见下 `.cp-shelf-unit`）——书架是一排可点的书脊，
    不是海上一处景物，画在洋面上既小又不像书。 */
const ROSE = project(-32, -21);

/** 经纬网：每十度一道。赤道与两回归线另描一笔，并标名——这是真图的凭据 */
const GRATICULE = (() => {
  const lons: number[] = [];
  for (let v = Math.ceil(LON0 / 10) * 10; v <= LON1; v += 10) lons.push(v);
  const lats: number[] = [];
  const latTop = latAt(0), latBot = latAt(MAP_H);
  for (let v = Math.floor(latBot / 10) * 10; v <= latTop; v += 10) lats.push(v);
  return { lons, lats };
})();
/** 赤道、南北回归线 */
const KEYLATS: { lat: number; name: string }[] = [
  { lat: 23.44, name: "北回归线" },
  { lat: 0, name: "赤道" },
  { lat: -23.44, name: "南回归线" },
];

export default function PortolanChart({
  onOpenBook,
}: {
  /** 带 bookId 翻开某书；不带（点书架涡卷）则先见书架总目 */
  onOpenBook?: (bookId?: string) => void;
}) {
  const t = useT();
  const { pts, cum, portAt } = useMemo(routeGeom, []);

  const [pos, setPos] = useState(() => posAt(cum, pts, 0));
  const [at, setAt] = useState(-1); // -1 = 锚地；否则为所泊港序号
  const [target, setTarget] = useState<number | null>(null); // 航行中；-1 表示返航
  const [visited, setVisited] = useState<number[]>([]);

  const sRef = useRef(0);
  const angRef = useRef(pos.ang);

  // 恢复上一程：泊在何港、到过哪几港。位置按泊点重算，不必存。
  // 旧档（六港时代）存序号——按 LEGACY_PORTS 迁成书名再寻今港，免得错认他家。
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { at?: number | string | null; visited?: (number | string)[] };
      const portIndexOf = (v: number | string | null | undefined): number => {
        if (v === null || v === undefined) return -1; // 锚地
        const name = typeof v === "number" ? LEGACY_PORTS[v] : v;
        return name ? PORTS.findIndex((p) => p.name === name) : -1;
      };
      const atIdx = portIndexOf(saved.at);
      if (atIdx >= -1) {
        setAt(atIdx);
        sRef.current = atIdx < 0 ? 0 : cum[portAt[atIdx]];
        setPos(posAt(cum, pts, sRef.current));
      }
      if (Array.isArray(saved.visited)) {
        setVisited(saved.visited.map(portIndexOf).filter((i) => i >= 0));
      }
    } catch {}
  }, [cum, pts, portAt]);

  // 落泊即存（存书名，不存序号——增删港不再错位）：半路关掉页面，船回上一港，进度不丢
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          at: at < 0 ? null : PORTS[at].name,
          visited: visited.map((i) => PORTS[i]?.name).filter(Boolean),
        }),
      );
    } catch {}
  }, [at, visited]);

  // 航行：弧长沿航路匀速推进，船头朝向缓转，逐帧定位。
  // 逆航（回锚地、退回身后的港）时弧长递减——航向为分段正向加半圈，船头始终朝行进的方向
  useEffect(() => {
    if (target === null) return;
    const endS = target < 0 ? 0 : cum[portAt[target]];

    const arrive = (rev: boolean) => {
      sRef.current = endS;
      const p = posAt(cum, pts, endS);
      angRef.current = p.ang + (rev ? 180 : 0);
      setPos({ ...p, ang: angRef.current });
      setAt(target);
      if (target >= 0) setVisited((v) => (v.includes(target) ? v : [...v, target]));
      setTarget(null);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive(endS < sRef.current);
      return;
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const d = endS - sRef.current;
      const step = SPEED * dt;
      if (Math.abs(d) <= step) {
        arrive(d < 0);
        return;
      }
      const rev = d < 0;
      sRef.current += Math.sign(d) * step;
      const p = posAt(cum, pts, sRef.current);
      // 转向取最短弧，指数趋近——船头是摆过去的，不是跳过去的
      const want = p.ang + (rev ? 180 : 0);
      const da = ((want - angRef.current + 540) % 360) - 180;
      angRef.current += da * Math.min(1, dt * 5);
      setPos({ ...p, ang: angRef.current });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, cum, pts, portAt]);

  const sailTo = (i: number) => {
    if (target === i || (target === null && at === i)) return;
    if (target === null) angRef.current = pos.ang;
    setTarget(i);
  };

  const sailing = target !== null;
  const facing = shipFacing(pos.ang);
  const docked = !sailing && at >= 0 ? PORTS[at] : null;
  const bound = sailing ? PORTS[target!] : null;

  return (
    <section className="cp-sea" aria-label={t("世界文学航路图")}>
      <header className="cp-sea-top">
        <h2>{t("世界文学航路")}</h2>
      </header>

      {/* 海图与书架并排，不是书架浮在海图上。
          浮一层木板在右缘，正好压住《仲夏夜之梦》《浮士德》《哈姆雷特》三枚港签
          （它们在 viewBox 的 x≈742–858 处）；并排则海图自己变窄、按比例留边，
          一枚标签也不少。 */}
      <div className="cp-sea-map">
        <div className="cp-chart">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img"
          aria-label={t("北大西洋海图：帆船沿红色虚线航路可驶向八个港口，港口即八部世界文学")}>
          <defs>
            <radialGradient id="pcPaper" cx="46%" cy="38%" r="78%">
              <stop offset="0%" stopColor="#f4e9cc" />
              <stop offset="55%" stopColor="#e9d8ad" />
              <stop offset="100%" stopColor="#d3bc8b" />
            </radialGradient>
            <linearGradient id="pcLand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dccfa6" />
              <stop offset="100%" stopColor="#cab887" />
            </linearGradient>
            <radialGradient id="pcStain">
              <stop offset="0%" stopColor="#7d5a2c" stopOpacity=".5" />
              <stop offset="100%" stopColor="#7d5a2c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="pcVig" cx="50%" cy="46%" r="72%">
              <stop offset="72%" stopColor="#5c3f18" stopOpacity="0" />
              <stop offset="100%" stopColor="#5c3f18" stopOpacity=".24" />
            </radialGradient>
            <filter id="pcNoise" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 .42  0 0 0 0 .32  0 0 0 0 .17  0 0 0 .4 0" />
            </filter>
            {/* 纸面即刀口：岸线数据在窗口边缘外还各让出一截（好教陆地填满纸缘），
                恒向线也画到一千一百点长——但纸上只有这么大，画出纸面的部分不能真画出来：
                viewBox 只定换算不定裁剪，meet 留出的褥边仍在 svg 元素框内，不裁便漫过纸边。
                凡可能出纸的（茶渍、恒向线、岸线）都套这一枚裁到纸边为止 */}
            <clipPath id="pcSheet"><rect x="0" y="0" width={MAP_W} height={MAP_H} /></clipPath>
          </defs>

          {/* 羊皮纸：底色、做旧噪点、四角茶渍 */}
          <rect width={MAP_W} height={MAP_H} fill="url(#pcPaper)" />
          <rect width={MAP_W} height={MAP_H} filter="url(#pcNoise)" opacity=".14" style={{ mixBlendMode: "multiply" }} />
          <g clipPath="url(#pcSheet)">
            <circle cx="70" cy="70" r="90" fill="url(#pcStain)" opacity=".16" />
            <circle cx="830" cy="110" r="65" fill="url(#pcStain)" opacity=".12" />
            <circle cx="815" cy="790" r="90" fill="url(#pcStain)" opacity=".18" />
            <circle cx="200" cy="818" r="55" fill="url(#pcStain)" opacity=".1" />
          </g>

          {/* 经纬网：每十度一道，细如游丝。有它，这张图才敢说自己是按真经纬画的 */}
          <g className="pc-grid">
            {GRATICULE.lons.map((lon) => {
              const x = project(lon, 0).x;
              return <line key={`v${lon}`} x1={x} y1={0} x2={x} y2={MAP_H} />;
            })}
            {GRATICULE.lats.map((lat) => {
              const y = project(0, lat).y;
              return <line key={`h${lat}`} x1={0} y1={y} x2={MAP_W} y2={y} />;
            })}
          </g>
          <g className="pc-keylat">
            {KEYLATS.map((k) => {
              const y = project(0, k.lat).y;
              return (
                <g key={k.name}>
                  <line x1={0} y1={y} x2={MAP_W} y2={y} />
                  <text x={14} y={y - 6}>{t(k.name)}</text>
                </g>
              );
            })}
          </g>

          {/* 恒向线：自罗经花向十六方放射。墨卡托图上等角航线是直的，故这些线不是装饰，
              是这张投影本来的用法 */}
          <g className="pc-rhumb" clipPath="url(#pcSheet)">
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return (
                <line key={i} x1={ROSE.x + Math.cos(a) * 44} y1={ROSE.y + Math.sin(a) * 44}
                  x2={ROSE.x + Math.cos(a) * 1100} y2={ROSE.y + Math.sin(a) * 1100} />
              );
            })}
          </g>

          {/* 海岸线：真岸线（Natural Earth 1:50m，墨卡托投影）。先晕后描，双过笔出旧图的海岸阴影。
              陆地本就画到纸缘外一截——裁到纸边为止，图上便见陆地齐纸缘断开，是海图的成例 */}
          <g className="pc-coasts" clipPath="url(#pcSheet)">
            {COASTS.map((d, i) => <path key={`h${i}`} d={d} className="pc-coast-halo" />)}
            {COASTS.map((d, i) => <path key={i} d={d} className="pc-coast" />)}
          </g>

          {/* 洋名海名：各落其海，斜体拉距，低声下气 */}
          {[
            { t: "北 大 西 洋", lon: -42, lat: 46, s: 1 },
            { t: "南 大 西 洋", lon: -22, lat: -14, s: 1 },
            { t: "加 勒 比 海", lon: -73.5, lat: 14.5, s: .78 },
            { t: "地 中 海", lon: 16.5, lat: 34.6, s: .7 },
            { t: "几内亚湾", lon: 1.5, lat: 1.5, s: .66 },
            { t: "印 度 洋", lon: 44, lat: -27, s: .82 },
            { t: "北 海", lon: 3.2, lat: 57.6, s: .62 },
          ].map((o) => {
            const p = project(o.lon, o.lat);
            return (
              <text key={o.t} className="pc-lab" x={p.x} y={p.y} textAnchor="middle"
                style={{ fontSize: `${13 * o.s}px`, letterSpacing: `${0.34 * o.s}em` }}>{t(o.t)}</text>
            );
          })}

          {/* 罗经花：镇在南大西洋的空海上，恒向线即自此放射 */}
          <g transform={`translate(${ROSE.x},${ROSE.y})`} className="pc-rose">
            <circle r="30" />
            <circle r="23" className="thin" />
            {Array.from({ length: 16 }, (_, i) => {
              const long = i % 2 === 0;
              const L = long ? 29 : 15;
              return (
                <path key={i} transform={`rotate(${i * 22.5})`}
                  d={`M0,-${L} L3.2,-6 L-3.2,-6 Z`} className={long ? "long" : ""} />
              );
            })}
            {/* 罗经花的四字：英文模式作 N/E/S/W——海图上这四个字是读图的刻度而非装饰，
                与印章上的单字不同类，故译（词表里另立「罗经花·北」四条，不与方位名相混） */}
            <text y="-36" textAnchor="middle">{t("罗经花·北")}</text>
            <text x="40" textAnchor="middle" dominantBaseline="middle">{t("罗经花·東")}</text>
            <text y="44" textAnchor="middle">{t("罗经花·南")}</text>
            <text x="-40" textAnchor="middle" dominantBaseline="middle">{t("罗经花·西")}</text>
          </g>

          {/* 航路：宽晕一层、红虚线一层。折点多在真水道上，故这条线是弯的 */}
          <polyline className="pc-route-halo" points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />
          <polyline className="pc-route" points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />

          {/* 锚地：好望角。起点，也是返航的落点 */}
          <g className="pc-anchor" transform={`translate(${START.x},${START.y})`}
            onClick={() => sailTo(-1)} tabIndex={0} role="button" aria-label={t("返回锚地：好望角")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && sailTo(-1)}>
            <circle className="pc-hit" r="22" />
            <circle className="pc-anchor-ring" r="11" />
            <path className="pc-anchor-glyph"
              d="M0,-6 L0,4 M-4.4,-2 Q0,1.4 4.4,-2 M-3.6,2 A3.6,3.6 0 1 0 3.6,2" />
            <text className="pc-by" x="-26" y="-14" textAnchor="end">{t("好望角 · 锚地")}</text>
          </g>

          {/* 八港：圆印记 + 细引线 + 书名作者。已泊者填实。
              引线是必需的——欧洲一隅六港相去不过数十点，标签须各让一方才认得出哪条属哪港。

              `bound` 即此刻所往：自右缘书架点一册书脊，船尚在半途，该港先亮起来——
              「点书脊即定位高亮航点」说的就是这一环，不等船到。 */}
          {PORTS.map((p, i) => {
            const xy = XY[i];
            const a = p.anchor ?? "middle";
            return (
              <g key={p.name} className={`pc-port${visited.includes(i) ? " visited" : ""}${target === i ? " bound" : ""}`}
                transform={`translate(${xy.x},${xy.y})`} onClick={() => sailTo(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && sailTo(i)}
                tabIndex={0} role="button" aria-label={t("驶往《{name}》{author} · {place}", { name: t(p.name), author: t(p.author), place: t(p.place) })}>
                <circle className="pc-hit" r="26" />
                {!sailing && at === i && <circle className="pc-at" r="15" />}
                {target === i && <circle className="pc-bound" r="18" />}
                <line className="pc-lead" x1={0} y1={0}
                  x2={p.lx + (a === "start" ? -4 : a === "end" ? 4 : 0)} y2={p.ly - (p.ly < 0 ? -4 : 5)} />
                <circle className="pc-dot" r="8.5" />
                <path className="pc-star" d={STAR} />
                <text className="pc-name" x={p.lx} y={p.ly} textAnchor={a}>《{t(p.name)}》</text>
                <text className="pc-by" x={p.lx} y={p.ly + (p.ly < 0 ? -13 : 14)} textAnchor={a}>
                  {t(p.author)} · {t(p.place)}
                </text>
              </g>
            );
          })}

          {/* 帆船：十六世纪的三桅卡拉克。外层管位移、朝向与大小，内层管摇橹般的起伏。
              画法取铜版线刻——壳板、炮窗、横桁、支索都在，笔都极细：
              不卡通的法子不是画大，是把线收细、把该有的部件画全。

              缩到七成二：原寸的桅顶与船尾在锚地（好望角，南纬 34°，已近下边线）要探出图外，
              且一条六十点长的船摆在九百点宽的洋面上，比真船该有的比例大出一截。

              朝向见 `shipFacing`——海图上的船从来不随航向打满舵。 */}
          <g className={`pc-ship${sailing ? " sailing" : ""}`}
            transform={`translate(${pos.x},${pos.y}) rotate(${facing.tilt}) scale(${facing.sx},.72)`}>
            <g className="pc-ship-bob">
              <g className="pc-wake">
                <path d="M-27,1 Q-40,-1 -53,-4" />
                <path d="M-27,4 Q-42,6 -57,8" />
              </g>

              {/* 索具：支索（自桅顶斜落舷侧）与前后稳索。先画，压在帆与桅之下 */}
              <g className="pc-rig">
                <path d="M-3,-49 L-17,-9 M-3,-49 L11,-9 M-3,-49 L-23,-13 M-3,-49 L17,-11" />
                <path d="M15,-37 L6,-9 M15,-37 L24,-8 M-18,-32 L-24,-11 M-18,-32 L-11,-10" />
                <path d="M-3,-49 L-18,-32 M15,-37 L-3,-45 M15,-37 L32,-14" />
              </g>

              {/* 三桅：主桅最高，前桅次之，后桅最短 */}
              <line className="pc-mast" x1="-3" y1="-10" x2="-3" y2="-50" />
              <line className="pc-mast thin" x1="15" y1="-9" x2="15" y2="-38" />
              <line className="pc-mast thin" x1="-18" y1="-11" x2="-18" y2="-33" />
              {/* 横桁 */}
              <g className="pc-yard">
                <line x1="-16" y1="-44" x2="11" y2="-44" />
                <line x1="-18" y1="-30" x2="13" y2="-30" />
                <line x1="4" y1="-34" x2="26" y2="-34" />
              </g>

              {/* 帆：上下两重方帆，前桅一重，后桅一面三角纵帆 */}
              <path className="pc-sail" d="M-15,-43.6 Q-3,-47 10,-43.6 L11.5,-31 Q-3,-27.6 -16.5,-31 Z" />
              <path className="pc-sail" d="M-17.5,-29.6 Q-3,-33.4 12.5,-29.6 L14,-13 Q-3,-9 -19,-13 Z" />
              <path className="pc-sail fore" d="M5,-33.6 Q15,-36.4 25,-33.6 L26,-19 Q15,-15.6 4,-19 Z" />
              <path className="pc-sail fore" d="M-18,-32 L-18,-12 L-30,-11 Z" />
              {/* 帆上的布缝与反光 */}
              <path className="pc-sailfold" d="M-13,-41 Q-3,-43.8 8,-41 M-14,-36 Q-3,-39 9,-36
                M-15,-26 Q-3,-29.6 11,-26 M-16,-20 Q-3,-23.6 12,-20
                M7,-29 Q15,-31.4 23,-29 M6,-24 Q15,-26.4 24,-24" />

              {/* 艏斜桅与艏帆 */}
              <line className="pc-mast thin" x1="26" y1="-6" x2="45" y2="-17" />
              <path className="pc-sail fore" d="M30,-11 L40,-15.6 L39,-7.6 L30,-5.6 Z" />

              {/* 船壳：舷弧自艏楼落到艉楼，壳板线与炮窗一一画出 */}
              <path className="pc-hull" d="M-26,-9.5 Q-2,-12.6 25,-9 L28.5,-10.5 L28,-4.6
                Q22,2.6 8,6 Q-7,8.6 -18,4.6 Q-24,1.6 -26,-3 Z" />
              <path className="pc-plank" d="M-25.4,-5.6 Q-2,-8.6 27.6,-5.6 M-24.6,-2 Q-2,-4.8 26.4,-2.4
                M-21.6,2 Q-2,-0.6 22.6,1.4" />
              <g className="pc-gunport">
                {[-18, -12, -6, 0, 6, 12, 18].map((x) => (
                  <rect key={x} x={x} y={-7.6} width="2.8" height="2.4" rx=".4" />
                ))}
              </g>
              {/* 艉楼与艏楼：旧船的两头都翘 */}
              <path className="pc-castle" d="M-26,-9.5 L-26.5,-20 L-15,-20.5 L-13.5,-10.2 Z" />
              <path className="pc-plank" d="M-25.6,-16 L-14.2,-16.4" />
              <path className="pc-castle" d="M18,-10.2 L19,-16 L27.5,-15 L28.5,-10.4 Z" />
              {/* 艉旗与桅顶旒 */}
              <path className="pc-flag" d="M-26.5,-20 L-27,-29 L-16,-24.6 Z" />
              <path className="pc-flag" d="M-3,-50 L-3,-56 L9,-52.6 Z" />
            </g>
          </g>

          {/* 暗角收边：不是框，只是纸的四缘年深日久的暗 */}
          <rect width={MAP_W} height={MAP_H} fill="url(#pcVig)" pointerEvents="none" />
        </svg>
        </div>

        {/* 嵌入式薄木书架：海图右缘凹进墙里的一座，两列四行共八格，一格一册。
            书脊竖写书名——书架上的书本来就是这么认的，平躺着反倒看不见名字。

            点书脊即开书：直落正文，不扬帆。书架与海图是取同一批书的两条路，
            各走各的——图上点港是「走过去」（看它在世界的哪一处），架上点书是「取下来读」
            （看它写了什么）。从前点书脊也走航线，等船到才见得着书，是把一件两秒的事
            拖成十秒；故此处与 `sailTo` 脱钩。读过的书脊仍按航程着色（见 .cp-spine.read/.on），
            那是两条路在此交汇之处。 */}
        <div className="cp-shelf-unit">
          <div className="cp-shelf-plate">{t("世界文学 · 全库书架")}</div>
          <div className="cp-shelf-grid">
            {PORTS.map((p, i) => {
              const read = visited.includes(i);
              const here = !sailing && at === i;
              return (
                <div className="cp-shelf-cell" key={p.name}>
                  <button
                    className={`cp-spine${read ? " read" : ""}${here ? " on" : ""}${target === i ? " bound" : ""}`}
                    onClick={() => (p.bookId && onOpenBook ? onOpenBook(p.bookId) : sailTo(i))}
                    title={t("读《{name}》 · {author} · {place}", { name: t(p.name), author: t(p.author), place: t(p.place) })}
                    aria-label={t("翻开《{name}》{author} · {place}", { name: t(p.name), author: t(p.author), place: t(p.place) })}
                  >
                    <span className="cp-spine-r" />
                    <span className="cp-spine-t">{t(p.name)}</span>
                    <span className="cp-spine-r" />
                  </button>
                </div>
              );
            })}
          </div>
          {onOpenBook && (
            <button className="cp-shelf-all" onClick={() => onOpenBook()}>{t("架上总目 →")}</button>
          )}
        </div>
      </div>

      <footer className="cp-sea-info">
        {bound ? (
          <>
            <h3>{t("正在驶往《{name}》", { name: t(bound.name) })}<small>{t(bound.author)} · {t(bound.place)}</small></h3>
            <p>{t("帆已满，循虚线而行，到港自会落锚。")}</p>
          </>
        ) : docked ? (
          <>
            <h3>《{t(docked.name)}》<small>{t(docked.author)} · {t(docked.place)}</small></h3>
            <p>{t(docked.line)}</p>
            {docked.bookId && onOpenBook && (
              <button className="cp-sea-open" onClick={() => onOpenBook(docked.bookId!)}>{t("翻开此书 →")}</button>
            )}
            <button className="cp-sea-back" onClick={() => sailTo(-1)}>{t("扬帆 · 回锚地")}</button>
          </>
        ) : (
          <>
            <h3>{t("八港导览 · 全库书架")}<small>{t("与四库并列为两轴，交于母题")}</small></h3>
            <p>
              {t("图按真经纬：岸线取 Natural Earth 1:50m，墨卡托投影，书各泊其所系之地。")}
              {t("自好望角启航，点任一港，帆船便循真水道驶去，泊下便知其书；要径直读，点右缘书架上的书脊。")}
            </p>
          </>
        )}
      </footer>
    </section>
  );
}
