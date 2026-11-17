# 导览归章：把新手导览从「一张图」拓到全系统

诸子那一屏的新手导览（`app/scene/TourLayer.tsx` + `app/world/tour.ts`）是全系统唯一
一处真正的导览：首次进门自动开讲，气泡挂在**真实元件**上，重功能当场实演。
但它的边界只有一个 `if`——`app/page.tsx:620`：

```ts
if (curWorld !== "zhanguo" || tourSeen || tourOn) return;   // 只在战国开讲
```

四库、西游、世界文学、跨世界的三块，进门都是一片寂静。本文把这一套拓过去，
次序照用户点名的四程：**四库 → 单个世界 → 西方 → 跨世界那三块**。

## 一、先认清楚系统是几层

「拓到全系统」最容易做错的一步，是把这五处当成并列的五个页面，各配一段导览。
它们不是并列的——按挂载关系看，是**一底四叠**：

| 层 | 何处 | 层级 | 何时在场 |
|---|---|---|---|
| 罗盘 `.cp-shell` | `curWorld === "compass"` | z 55 | 进门第一屏 |
| 战国 `.world-shell` | `curWorld === "zhanguo"` | — | 入子部后 |
| 西游 `.kg-layer`(xy) | `curWorld === "xiyou"` | z 60 | 入集部后 |
| 四库 `SikuLayer` | `sikuOpen` | z 60 | **不换世界**，自罗盘或战国浮上来 |
| 长卷 `SikuScrollLayer` | `sikuScrollOpen` | z 60/61 | 自罗盘浮上来 |
| 世文 `WorldLitLayer` | `wlOpen` | z 60 | 自海图浮上来 |
| 母题 `MotifLayer` | `motifOpen` | z 60 | 自罗盘/战国浮上来 |
| 影音 `CrossMediaLayer` | `xmediaOpen` | z 60 | 同上 |

导览层 `.tour-root` 是 z 90，压在所有浮层之上（`app/page.tsx:1227` 的注释
「导览置于最后」就是这个意思）。

**这个层级差决定了整个设计**：四库与西方不是「另一个世界」，而是**浮在当前世界之上的一层**。
所以导览不存在「先走完世界再进四库」这种线性叙事——四库可以在罗盘上开，
也可以在战国里开、在西游里开；关掉又回到原来那一屏。

于是「先四库、后世界」不能理解成一条长路，只能理解成**四个独立的章**，
每一章只在它那一层在场时才讲。用户给的那个次序，是**开讲的先后次序**，
不是一条不可跳过的流水线。

## 二、形制：一章一册，各记各的账

现在的导览是**一个平铺的 18 步数组 + 一个布尔「看过」**。拓到四层若照搬，会有两个死结：

1. **账混了**。看过从盘面进的四库，等于把世文那章也记成看过了——他未必去过海图。
2. **册混了**。`STEPS` 里的选择器属战国那一屏；四库的 `.sk-gate` 在战国屏下根本不存在，
   `unionBox` 量到零面积就会一路 skip 到底，等于整章空转。

故拆成：

### （一）`tour.ts` 改成记「哪几章看过」

一个 localStorage 键仍够用，值从 `"1"` 改成册名表：

```ts
// 键名不变，免得老用户的「看过」作废
const STORAGE_KEY = "zhuzi-tour-seen";
// 值：以逗号相连的章名，如 "siku,zhanguo"。旧值 "1" 读作 "zhanguo"。
```

读的时候做一次迁移：`"1"` → 已看 `zhanguo` 一章。这样**老用户不会被再拽去看一遍战国**，
但四库、世文、跨世界三章仍会照常开讲——这正是拓版该给他的东西。

对外三个函数，签名都不变，语义收窄到「章」：

```ts
// 原先：整站看过否。今改成按章问。
export function readSeen(ch: TourChapter): boolean
// 原先：markTourSeen()。今记一章。
export function markSeen(ch: TourChapter): void
// 原先：resetTour() 清全站。今清一章；不传则全清（档案里的「重看」仍造全清）。
export function resetTour(ch?: TourChapter): void
```

可订阅的 store 保持 `useSyncExternalStore` 那一套不变，**包括三条已经踩过坑的细节**：

- `SERVER_DEFAULT = true`：SSR 与首帧都当「看过」，故首帧不渲染导览层，老用户不闪；
- `cachedRaw = undefined` 而非 `null`：否则新用户永远看不到；
- 同页通知走 `zhuzi-tour:change` 自派事件。

`readSeen` 参与 SSR 时一律返回 `SERVER_DEFAULT`，即首帧无导览，挂载后再按真值起。

### （二）`TourLayer` 收「章」而不收「整册」

```ts
export type TourChapter = "siku" | "zhanguo" | "xiyou" | "westlit" | "crossworld";
```

组件本体几乎不动——量框、定位、遮罩分片、实演、键盘、零面积跳过，全是层的本事，
与章无关。只改两处：

- `STEPS` 拆成 `CHAPTERS: Record<TourChapter, { title: string; steps: Step[] }>`，
  组件按 `chapter` 取册；
- `onDone` 回报**本册**看完了，由 page 去记 `markSeen(chapter)`。

「跳过」与「看完」同样记已看——他现在不看，明天也不必再被同一册拦住；
要再看，档案里有入口（见第四节）。

## 三、五册各讲什么

每一册都守原导览的两条硬规矩：**量真实 DOM**（不造假界面），
**能实演的就实演**（重功能指着说不明白）。步子控制在 5–7 步：
一章二十步，进门先被气泡糊一脸，第一章就成了劝退章。

### 册一 · 四库（自罗盘或战国开，5 步）

前置：`onAct({ kind: "openSiku" })`。四库不是世界，得先请 page 把它浮起来。

| # | 目标选择器 | 讲什么 | 实演 |
|---|---|---|---|
| 1 | — （居中） | 「四库全书：经史子集，一千零一十九部著录，七十七部可读。」只是一句开场的交代 | |
| 2 | `.sk-groups` | 四部门楼：门色即部色，悬停门扉微启 | |
| 3 | `.sk-han` | 函套：部下面是类，函签竖书类名 | `act: sikuGroup("经")` 落一部给你看 |
| 4 | `.sk-vol` | 立书：函里一部部的书，书脊竖题 | `act: sikuCategory(...)` |
| 5 | `.sk-search` | 检索：人物、书名、卷目、正文皆可检——四库最要紧的一件 | `act: canonQuery("鼓盆")`，真填一个词 |
| 6 | `.sk-reader` | 翻开一章：左目录右正文，原文永不改一字 | `act: openBook("zhuangzi","…")` |

**难点**：四库内部有 `group / category / entry / n` 四层状态，且藏在 `SikuLayer` 自己
的 `useState` 里，`page.tsx` 够不着。故须给 `SikuLayer` 加一个 `tourAct` prop，
内部 `useEffect` 认它：

```ts
type SikuAct = { kind: "group"; g: Part } | { kind: "category"; c: string }
           | { kind: "book"; id: string } | { kind: "chap"; label: string } | { kind: "reset" };
```

这与辩论台已有的 `preset`/`autoStart` 是同一路数：由外面递进一个「该切成什么样」的意图，
不是在外面直接改内部 state。

**另一个坑**：四库目录是异步载入的（`loadCatalog`，`目录载入中……`）。
第 2 步量 `.sk-groups` 时可能还是一片「载入中」。现有 `wait` 机制（默认 40 帧 ≈ 650ms）
正好兜底；四库这册把首几步 `wait` 提到 120（≈2s），并允许超时后跳过该步——
宁可这步不出现，也不指到一个空的框上。

### 册二 · 单个世界（战国，现有 18 步）

基本原样。只因拆册要动三处：

- `STEPS` → `CHAPTERS.zhanguo.steps`；
- 进场条件从「`curWorld === "zhanguo"` 即开」改成「`curWorld === "zhanguo"` 且
  `!readSeen("zhanguo")` 且没有别的册在讲」；
- `done` 那一步的文案里「点右上「客」字档案里的「重看导览」」要跟着档案改（见第四节）。

同属「单个世界」的还有**西游**。它是一屏独立世界（`curWorld === "xiyou"`，
另挂 `XiyouLayer`），但只有 9 个可讲的点，且今天是演示态，故**另立册三·别**，
五步：

| # | 目标 | 讲什么 |
|---|---|---|
| 1 | — | 「西游另成一图：取经路十八处，界外五处是悟空前史。」 |
| 2 | `.xy-scene` | 路与图：拖转视角，点一处即到一处 |
| 3 | `.xy-here-card` | 「此处」卡：此回何难、哪几位在侧、试炼一句 |
| 4 | `.xy-route-bar` | 路条：西行→下一处；界外时改走「前史」的次第 |
| 5 | `.xy-parley-btn` | 聚义评议：此处几位同席，各出己见 |

这一册**只讲「指着说」，不实演**：西游的地点切换会牵动三维场景与取经进度，
实演代价大、回报小。实演留给真正「不做一遍就懂不了」的地方。

> 次序上，西游严格说不属于用户点名的第三程「西方」。但它是「单个世界」里
> 另一张图，与战国同处一层；若放到最后，用户从盘面进西游时已再无开讲时机。
> 故与战国同批处理，不另排。

### 册四 · 西方（自海图进，5 步）

「西方」在这一系统里有两处形态，须分清楚：

1. **海图八港**——在罗盘右上幅（`PortolanChart`，`.cp-sea`），是**入口**；
2. **世界文学书架**——`WorldLitLayer`，`.sk-grid` + `.sk-book.wl-book` 那八部，
   中英两卷，是**书的所在**。

导览该讲的是第 2 处：第 1 处已在罗盘那一章讲过（见册五），且海图是张等距投影的 SVG
港口图，指着说「点这八个星形」已足够。故：

| # | 目标 | 讲什么 | 实演 |
|---|---|---|---|
| 1 | — | 「外国经典不入四库，另立一轴：八部书，皆中英两卷。」 | |
| 2 | `.sk-grid` | 书架：每部标著者、年代、两卷章数 | |
| 3 | `.sk-book.wl-book` | 点开一部 | `act: wlEntry("…")` |
| 4 | `.wl-lang` | 中译／原书／对照三面 | `act: wlLang("both")` |
| 5 | `.sk-margin` | 边批：读时旁批，与四库边批同一套 | |
| 6 | `.wl-media` | 后世影音：这一部的演绎，就在书页左栏 | |

同样需要一个 `wlAct` prop（`WorldLitLayer` 的 `entry / lang / chap` 也是内部 state）。

**这条册的实演有一处很要紧**：第 4 步切到「对照」，用户当场看见同一段中文与英文并列——
这一系统「原文不替换、英文另附」的三层 i18n 立意，在这一步里看得见。

### 册五 · 跨世界那三块（在罗盘上开，7 步）

用户点名的「跨世界议题那三块」，就是罗盘顶栏那三枚签牌（`app/scene/CompassLayer.tsx:206`）：
朝代长卷（库）、跨世界评议（题）、跨媒介点评（媒）。三块都是**自罗盘浮起的全屏层**，
故这一册必须在罗盘上开，且**只在那里开**。

| # | 目标 | 讲什么 | 实演 |
|---|---|---|---|
| 1 | — | 「四库贯书、母题贯世界、影音贯媒介——此三块在诸世界之外，横着走过去。」 | |
| 2 | `.cp-top-links` | 三枚签牌本身：朱砂印一字，牌上大字是去处、小字是这去处做什么 | |
| 3 | `.cp-cap` | 盘下据脚：所悬之隅的两三句，悬停即换 | |
| 4 | `.cp-sea` | 海图：外国经典八港，帆船循红虚线驶去，泊下即开其书 | |
| 5 | `.ln-hub` | 盘心「四库」：总目之门——横贯之路的起点仍是书 | `act: openSiku()` |
| 6 | 长卷：`.sk-scroll-lanes` | 朝代长卷：书与书的牵连，七型关系按色分线 | `act: openScroll()` |
| 7 | 母题：`.mo-grid` | 跨世界评议：十二母题，诸世界各出其解 | `act: openMotif()` |
| 8 | 影音：`.xm-cols` | 跨媒介点评：四部与西方两行铺开，点一条入点评席 | `act: openMedia()` |

最后三步各开一个全屏层，开完须 `act: close*` 收回，否则第 7 步的气泡会被第 6 步的层盖住
（z 90 > 60，气泡看得见，但高亮圈里的元件被遮住，指了个寂寞）。现有导览在
`graph-in → lineage` 之间就用 `act: [{ closeGraph }]` 处理过同一个问题，照抄。

**这一册为什么放最后**：三块是「横贯之路」，用户得先知道四库是什么、世界是什么、
西方在哪里，三枚签牌才有意义。若它先讲，三块就只是一排名字。

## 四、何时开讲：不做流水线，做「到哪儿讲哪儿」

一章一册，各自的进场条件写在一处判定里（`app/page.tsx`）：

```ts
function chapterDue(): TourChapter | null {
  if (sikuOpen) return !readSeen("siku") ? "siku" : null;
  if (wlOpen)   return !readSeen("westlit") ? "westlit" : null;
  if (curWorld === "zhanguo") return !readSeen("zhanguo") ? "zhanguo" : null;
  if (curWorld === "xiyou")   return !readSeen("xiyou") ? "xiyou" : null;
  if (curWorld === "compass" && !motifOpen && !xmediaOpen && !sikuScrollOpen)
    return !readSeen("crossworld") && sawSikuAndWorld && sawWest ? "crossworld" : null;
  return null;
}
```

四点说明：

1. **延时开讲照旧 900ms**，理由不变（3D 场景异步载入，气泡不指空处）。四库那册
   另加 `loadCatalog` 的等待兜底（见上）。
2. **跨世界那册加一个前提**：`sawSikuAndWorld && sawWest`。它是**收束章**，
   用户还没见过四库、没见过世界、没去过海图就先听三块，听不懂。
   前提既足，回到盘面即开。这样用户给的四程次序，在没有硬流水线的前提下自然成立。
3. **一屏只讲一册**。若浮层与章同时满足（如从战国里开四库），浮层优先——
   `.sk-groups` 在 z 60，战国那册的选择器量不到它，两条并发只会互踩。
4. **西游、罗盘的老用户不受打扰**：`readSeen` 对旧值 `"1"` 只认 `zhanguo`，
   故罗盘那册 `crossworld` 仍会开——但它是新册，本就该开。

## 五、入口：档案里改成一册一行

`UserPanel` 今天的「重看导览 ↻」是一个钮，清全站标记
（`app/scene/UserPanel.tsx:129`）。拓成五册后，把它改成**五行的册目**：

```
导览                      已看
  一 · 四库全书    ✓     ↻
  二 · 先秦诸子    ✓     ↻
  三 · 西游        —     ↻
  四 · 西方        —     ↻
  五 · 跨世界三块  —     ↻
```

- 点某行的 ↻：`resetTour(ch)`，并把页面切到那一层（四库、世文、盘面各自的开法）。
  若不切换，「重看四库」在战国屏上按下去什么也不会发生——因那一册只在 `sikuOpen` 时开。
- 行首 `一 · 二 · …` 作汉字，不作数字。`han()` 今日只是 `MotifLayer` 里的一个私有函数
  （`app/scene/MotifLayer.tsx:105`，母题签用），要在档案里用，须提到共用处
  （如 `app/world/tour.ts` 或已有的数字小工具）——或干脆把「一 二 三 四 五」五字写死，
  五册而已，不必为一个函数多开一个模块。
- 顶部仍留一个「全部重看」小字钮，等价于今天的 `resetTour()`。

## 六、要动的地方（改动面清点）

| 文件 | 改什么 | 量 |
|---|---|---|
| `app/world/tour.ts` | 单布尔 → 章集合；读写迁移；`readSeen/markSeen/resetTour(ch)` | ~40 行改 |
| `app/scene/TourLayer.tsx` | `STEPS` → `CHAPTERS`；加 `chapter` prop；`onDone` 回报章名 | ~30 行改，+4 册步表 |
| `app/page.tsx` | `chapterDue()`；`tourAct` 扩为新动作；`curWorld` 三分支各挂导览；`tourFinish` 记章 | ~70 行 |
| `app/scene/SikuLayer.tsx` | 加 `tourAct` prop + 一个 effect（group/category/book/chap） | ~25 行 |
| `app/scene/WorldLitLayer.tsx` | 同上（entry/lang/chap） | ~15 行 |
| `app/scene/UserPanel.tsx` | 「重看导览」单钮 → 五册目 | ~40 行 |
| `app/i18n/en.ts` | 新增四册的标题与正文（约 30 条） | — |

**不动**：`CompassLayer`、`XiyouLayer`、`MotifLayer`、`CrossMediaLayer`、`SikuScrollLayer`
一行不改——它们的目标元件一律由导览层**量真实 DOM**，这正是原设计的价值所在。

## 七、守则

- **中文渲染不许变**。导览只在「未看过」时出现，且默认 `SERVER_DEFAULT = true`，
  故首帧与老用户的中文视口一字不差。新加的文案全走 `t()`，中文即键。
- **英文册**：新步子的标题与正文照 `en.ts` 现有笔法写——较中文稍详，讲清「这是什么、
  为何如此」，不逐字对译。四库里「经史子集」是类名，照用拼音/译名相配既有译法，
  不另造。
- **回目、卷名、篇名不译**（`canonFull` 的章题是原书字面），导览里出现时照旧。
- **一章不超过七步**。拓版最常见的失败是每层都想讲全，最后十步都不看。
  四库那么大一摊，也只讲六步。
