# 计划 C：真视频理解（多模态）— 已实现

> 状态：**已实现（含 D 降级）**，2026-09-20。A（后世影音索引）与 B（典籍→影视片段检索）
> 既上线；C 现落地：上传影视片段 → 浏览器抽帧 → `/api/understand`（qwen-vl）→
> 结构化理解卡片 → 复用 AnnotPanel 请诸子流式点评、落库。VL 不可用 / 失败时降级 D（贴文本）。

## 目标

用户上传一段影视片段（或贴一段视频链接 / 小说摘录），系统做**真·视频理解**：
识别其中人物、情节、对白，再让对应诸子就这段素材**点评 / 对谈 / 辩论**——
比如上传《大秦帝国》韩非一段，韩非子本人在图谱里点评"此段演绎得如何、
与吾《孤愤》《五蠹》相合否"。

## 与已实现的 A/B 区别

| 项 | A 已上线 | B 已上线 | C 备选 |
| --- | --- | --- | --- |
| 形态 | 节点挂后世演绎目录（书目式） | 关键词检索影视片段概述 | 上传视频→多模态理解→诸子点评 |
| 语料 | 手维护 `ADAPTATIONS` | 手维护 `MEDIA_CLIPS`（短概述） | 用户上传的任意视频/图片 |
| 理解 | 无 | 关键词（可升级语义向量） | 多模态 VL 模型理解帧+对白 |
| 生成 | 无 | 无 | 诸子据理解结果流式发言 |

## 技术方案

### 1. 多模态理解端点（Worker 新增 `/api/understand`）

- 输入：视频文件（或抽帧图集）+ 可选文字提示（"这是哪段、焦点是谁"）。
- 处理：浏览器侧抽帧（ `<video>` + canvas，每 N 秒一帧，上限 ~12 帧）→
  转 base64 图集 → POST `/api/understand`。
- 模型：通义千问 **VL**（qwen-vl-max / qwen-vl-plus），密钥仍只在 Worker
  （`DASHSCOPE_API_KEY` 服务端，与 `/api/chat` 同源，**不下发浏览器**）。
- 输出：结构化 JSON —— `{ scene: 场景概述, characters: [{name, guess}], dialogues: [对白片段], themes: [主题词如"非攻"/"连横"] }`。
  对白可用 ASR（paraformer）或 VL 直接读字幕；初版用 VL 读图+字幕即可。

### 2. 诸子点评接入（复用 `/api/chat`）

- 理解结果拼成上下文 prompt：
  `客呈一段影音：{scene}，其言{dialogues}，涉{themes}。请{诸子}就此点评，可援可驳，标出处。`
- 走既有 `composeAnswerLLM` 流式（1v1 模式），诸子以本人口吻回应。
- 在典籍图谱节点详情 / 对谈台新增"呈影音"入口：选一位诸子→上传→理解→流式点评。

### 3. 前端组件（`scene/MediaUnderstand.tsx` 新建）

- 文件选择 / 拖拽上传（限 mp4/mov/webm，≤ ~30MB）。
- `<video>` 预览 + canvas 抽帧进度条。
- 提交后：先显"理解中…"→ 出结构化卡片（场景、人物、对白、主题）→
  再流式出诸子点评（复用 SpeakButton 配音）。
- 失败回退：模型不可用 / 无密钥 / 上游错 → 提示"理解失败，可改为贴文本"
  （落到 D 路径：纯文本输入走既有对谈）。

## 工程量估计

| 件 | 量 |
| --- | --- |
| `/api/understand` Worker 端点（VL 调用 + 抽帧输入处理） | 中-大（~150 行） |
| 浏览器抽帧 + 上传组件 | 中（~200 行，canvas 抽帧 + 分片上传） |
| 诸子点评 prompt 拼装 + 流式接线 | 小（复用 composeAnswerLLM） |
| 结构化理解结果 UI 卡片 | 小 |
| 错误处理 / 降级 / 配额 | 中 |

## 风险与前置条件

1. **模型能力**：qwen-vl 对中文古风影视、繁体字幕、冷门人物（韩非、邹衍）的
   识别精度存疑。需先做 spike：拿 3-5 段已知片段测识别准确率，不达标则降级为
   "用户手贴对白文本"（即 D 路径）。
2. **成本**：VL 多图输入 token 消耗远高于文本。需限帧（≤12）、限频
   （每会话 N 次）、限大小。可能需配额计费。
3. **版权**：用户上传的影视片段可能侵权。只做"用户本地理解、不存储、
   不转发除模型推理外"，UI 注明"请勿上传侵权素材，仅自用学习"。
   抽帧图集不落 localStorage、推理完即弃。
4. **SSR 安全**：抽帧与上传仅浏览器运行期；`/api/understand` 走 Worker，
   密钥不暴露（约束同 [[dashscope-key-server-side]]）。
5. **持久化**：理解结果可按需存 localStorage（key 形如 `media:{诸子}:{ts}`），
   不入 D1（约束同 [[persistence-localstorage]]）。

## 触发条件（何时启动）

- ~~用户明确要"上传视频让诸子点评"且接受上述风险；~~ ✅ 已触发并实现
- ~~或 A/B 的静态语料不够、需要用户自带素材补足时；~~ ✅
- ~~先做 spike 验证 qwen-vl 中文古风识别精度，达标再全量开发。~~ → 改为：以 D 降级为安全网直接上线，VL 失败即落贴文本，不阻塞。

## 实现落点（2026-09-20）

- **Worker** `worker/index.ts`：`handleUnderstand`（仿 `handleVerify`），调 `qwen-vl-max`（env `QWEN_VL_MODEL` 可改），OpenAI 兼容多模态（image_url data URL），非流式取 JSON + `parseUnderstanding` 容错；限 ≤8 帧、单帧 ≤1.5MB；路由 `/api/understand`。key 只在 Worker。
- **浏览器** `app/world/video-understand.ts`：`extractFrames`（`<video>`+`canvas`+`toDataURL`，等间距 6 帧、缩 512px、jpeg 0.5、超限降质量重抓）、`understand`、`humanizeUnderstandError`（欠费/未开通/无 key/parse/网络 → 人话）。
- **UI** `app/scene/MediaUnderstand.tsx`：上传（mp4/mov/webm ≤30MB）→ 抽帧进度 → 理解卡片（场景/人物带 guess/对白/主题 chips）→ 复用 `AnnotPanel`（verseKey `media:{scene前16字}`，prompt 拼理解结果）请诸子流式点评、落库。失败/主动选「改为贴文本」→ D 降级 `<textarea>`，同样喂 AnnotPanel。
- **AnnotPanel 抽出** `app/scene/AnnotPanel.tsx`（原内联于 CanonGraphLayer），节点批注 / 句读批注 / 影音点评共用，避免循环 import。
- **入口** `CanonGraphLayer.tsx`：`NodeDetail`「后世影音」栏 + `MediaClipsSection`（检索书/人视图影音栏）末加「呈影音请诸子点评」按钮 toggle。
- **安全**：抽帧 base64 不落 localStorage、推理完即弃（`URL.revokeObjectURL`）；诸子点评走既有 `/api/chat`；点评落 `zhuzi-annotations`（`media:` 前缀 key）。约束 [[dashscope-key-server-side]] [[persistence-localstorage]] 不变。

## 降级路径（D，已内置）

即前述 **D**：不做视频帧理解，让用户**贴一段对白/小说摘录文本**进对谈台，
诸子据此发言——复用既有"客入席陈词"管道，工程量极小，可作为 C spike
失败时的兜底先行上线。
