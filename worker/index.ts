/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  /** 阿里云百炼（DashScope）API Key，仅服务端持有，不下发浏览器 */
  DASHSCOPE_API_KEY?: string;
  /** 文化人物对话与通用文本任务的模型 id；优先于旧名 QWEN_MODEL。 */
  CHAT_MODEL?: string;
  /** 旧配置名，保留兼容已有部署。 */
  QWEN_MODEL?: string;
  /**
   * 一致性校验官的模型 id，默认 deepseek-v4.1-flash——**与发言生成模型异源**。
   * 从前校验走的也是生成模型，等于自家模型审自家：同一家模型的盲点是共享的，
   * 它写得出的越界之语，它自己多半也看不出越界。换一家来审，徽记才算个外证。
   * 上游不可用（未开通/额度尽）时退回 CHAT_MODEL，并在响应里 crossModel:false 标明，不隐瞒。
   */
  QWEN_VERIFY_MODEL?: string;
  /** DashScope 语音合成（CosyVoice）模型 id，默认 cosyvoice-v1 */
  DASHSCOPE_TTS_MODEL?: string;
  /** DashScope TTS 默认音色 id（覆盖浏览器侧 voices.ts 的诸子映射） */
  DASHSCOPE_TTS_VOICE?: string;
  /** 通义万相文生图模型 id（视频关键帧），默认 wanx2.1-t2i-turbo */
  QWEN_IMAGE_MODEL?: string;
  /** 通义万相图生视频模型 id，默认 wanx2.1-i2v-turbo（账号需开通视频模型） */
  QWEN_VIDEO_MODEL?: string;
  /** 图生视频分辨率，默认 720P */
  QWEN_VIDEO_RESOLUTION?: string;
  /** 图生视频时长（秒），默认 5 */
  QWEN_VIDEO_DURATION?: string;
  /** 通义千问 VL 多模态模型 id（视频理解 / 呈影音点评），默认 qwen-vl-max */
  QWEN_VL_MODEL?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

/** 阿里云百炼 OpenAI 兼容端点 */
const DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const DEFAULT_MODEL = "qwen3.8-flash";

function chatModelOf(env: Env): string {
  return env.CHAT_MODEL || env.QWEN_MODEL || DEFAULT_MODEL;
}

/** 交互与翻译优先低延迟，所有文本任务统一关闭思考模式。 */
function useThinking(_model: string): boolean {
  return false;
}

/** 阿里云百炼文本模型统一采用非思考模式。 */
function generationTuning(_model: string, temperature: number): { enable_thinking: false; temperature: number } {
  return { enable_thinking: false, temperature };
}

/**
 * 校验官模型：他家（DeepSeek），刻意不与 DEFAULT_MODEL 同族。
 * 注意请求体仍须带 `enable_thinking: false`——此模型默认先思后答，
 * 128 的 max_tokens 会被思考吃光，判词返空串。
 */
const DEFAULT_VERIFY_MODEL = "deepseek-v4.1-flash";

/** 阿里云百炼 CosyVoice 语音合成端点（原生 API，非 OpenAI 兼容） */
const DASHSCOPE_TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts";
const DEFAULT_TTS_MODEL = "cosyvoice-v1";

/**
 * 阿里云百炼文本向量端点（OpenAI 兼容），用于典籍语义检索的查询向量。
 *
 * **此处的模型须与 scripts/embed-canon.mjs 的 MODEL 一字不差**：库里的向量是那个
 * 脚本预先算好的，查询向量由此处现算，两者不同出一模则余弦无从比较——维数若还
 * 不同，canon.ts 的 cosine() 长度不等即返 0，语义检索会静默失效而不报错。
 * 改这一行就得重跑那个脚本，把全部典籍向量重算一遍。
 */
const DASHSCOPE_EMBED_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings";
const DEFAULT_EMBED_MODEL = "qwen3.7-text-embedding-flash";
/** 男·沉稳，最近"古风"听感的兜底音色 */
const DEFAULT_TTS_VOICE = "longcheng";

/** 通义万相文生图／图生视频端点（异步任务：提交后轮询 GET /api/v1/tasks/{id}）。
 *  视频端点与模型名以百炼当前文档为准；账号需开通相应模型，否则提交返回权限错误，
 *  浏览器侧据 error 文案提示「未开通视频模型」。 */
const DASHSCOPE_IMG_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const DASHSCOPE_VIDEO_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
const DASHSCOPE_TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks";
const DEFAULT_IMAGE_MODEL = "wanx2.1-t2i-turbo";
const DEFAULT_VIDEO_MODEL = "wanx2.1-i2v-turbo";

/** 通义千问 VL 多模态模型（视频理解）：OpenAI 兼容多模态端点，复用 DASHSCOPE_URL。
 *  账号需开通 VL 模型，否则上游返回权限错误（浏览器侧据 error 提示并降级为贴文本）。 */
const DEFAULT_VL_MODEL = "qwen-vl-max";

/** 浏览器→Worker 的对谈请求体（scholar/canon/history 均为非密数据，浏览器已持有） */
type ChatPayload = {
  scholar: {
    name: string;
    courtesy?: string;
    school: string;
    intro?: string;
    /**
     * 人格之属：`thinker` 持一家之说，`figure` 是叙事中的人物（如孙悟空），
     * `west` 是西方文哲（引证出自家作品，不作先秦腔）。
     * 省略即 `thinker`，故诸子那批请求行为不变。下面的提示词按此分支——
     * 不分，悟空就会被写成一个讲道理的学者。
     */
    kind?: "thinker" | "figure" | "west";
    profileTier?: "core" | "work" | "context";
    representativeWorks?: string[];
  };
  question: string;
  presence?: { region: string; action: string };
  history?: { mine: boolean; text: string }[];
  /** 本家 few-shot 范例：客问→诸子答（含《书·篇》引典），在 system 后织入，使诸子学其引典口吻 */
  fewShot?: { q: string; a: string }[];
  canon?: {
    /** 与回答中的 [E#] 一一对应，禁止模型自行另造出处。 */
    evidenceId?: string;
    book: string;
    chapter: string;
    text: string;
    gloss: string;
    /** 有此项即为谱系授权的他书，不得冒充人物本家。 */
    relation?: { label: string; use: string; note: string };
  }[];
  /** 文脉题若没有审定关系，模型必须据实说明证据不足。 */
  lineageRequest?: { requested: boolean; reviewedAvailable: boolean };
  /** 圆桌辩论模式：议题/轮次/上家；缺省则按 1v1 对谈提示 */
  debate?: { round: string; previousSpeaker?: string; topic?: string };
  /** 双贤对谈模式：议题/对方；缺省按 1v1/辩论 */
  dialogue?: { topic?: string; previousSpeaker?: string };
  /** 主持人轮间追问/收束模式：议题/上一轮/下一轮；缺省按 1v1/辩论/双贤 */
  moderator?: { topic: string; prevRound: string; nextRound: string };
  /** 人物长期记忆：与客此前问答要点，注入使诸子承接前缘 */
  memory?: { topic: string; excerpt: string }[];
  /** 关系/好感度：用户↔此子及此子↔同席者，影响口吻亲疏与驳难分寸 */
  affinity?: { user: number; peers?: { id: string; name: string; level: number }[] };
  /** 人物自主性模式：依性情/学说/时辰自决一句动作，不引典、不解释 */
  autonomy?: { region: string; action: string; shichen: string };
  /** 评判模式：吕不韦综观全场为每位入席者打分并给判词，输出 JSON */
  judge?: { topic: string; turns: { name: string; text: string }[] };
  /** 浏览器端已按时间与文脉筛过证据；服务端再以此约束叙述视角。 */
  knowledgeBoundary?: {
    mode: "historical" | "comparative";
    birthYear?: number;
    deathYear?: number;
    regions?: string[];
    regionalNote?: string;
  };
};

/** 一致性校验请求体：人物档案（含学说锚点）+ 待审发言 + 议题 + 本家典据 */
type VerifyPayload = {
  scholar: { name: string; courtesy?: string; school: string; intro?: string; kind?: "thinker" | "figure" | "west"; themes?: string[]; quote?: string };
  text: string;
  topic?: string;
  canon?: {
    evidenceId?: string;
    book: string;
    chapter: string;
    text: string;
    gloss: string;
    relation?: { label: string; use: string; note: string };
  }[];
};

/** 一致性修订请求体：沿用校验所见的人物档案与典据，并附上校验官的判档和理由。 */
type RepairPayload = VerifyPayload & {
  verdict: "存疑" | "矛盾";
  note?: string;
};

/**
 * 人物 Agent 的服务端代理：以人物档案＋典籍检索＋处境＋对话史构造提示，
 * 调用阿里云百炼 Qwen 模型生成发言。API Key 只在本 Worker 持有。
 * 未配置 key 或上游异常时返回非 ok，由浏览器回退到本地模板发言。
 */
async function handleChat(request: Request, env: Env): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: Partial<ChatPayload>;
  try {
    payload = (await request.json()) as Partial<ChatPayload>;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const { scholar, question, presence, history, canon, debate, dialogue, moderator, memory, affinity, autonomy, judge, fewShot, knowledgeBoundary, lineageRequest } = payload ?? {};
  if (!scholar || !question) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });

  const kind = scholar.kind ?? "thinker";
  const hasLineageCanon = Array.isArray(canon) && canon.some((c) => !!c.relation);
  const canonBlock =
    Array.isArray(canon) && canon.length
      // 白话可空：自四库全文接来的段落未预先译（见 canonSource.ts），空则不缀括号，
      // 否则提示词里会出现一串「（）」，模型会当作有话没说完
      ? canon.map((c, i) => {
          const evidenceId = c.evidenceId || `E${i + 1}`;
          const tag = c.relation
            ? `【关联典籍·${c.relation.use}（${c.relation.label}）：${c.relation.note}】`
            : "【本家典籍】";
          return `[${evidenceId}]${tag}《${c.book}·${c.chapter}》「${c.text}」${c.gloss ? `（${c.gloss}）` : ""}`;
        }).join("\n")
      : kind === "west"
        ? "（未检得相关典据，可依自家学识与作品立论，不强引）"
        : "（未检得相关典据，可依自家学说立论，不强引）";

  /**
   * 人格之属的分野，接西游世界之后不得不分的一处；接西方文哲之后又一分为三。
   *
   * 诸子引典是**论证**：话要立得住，故须标《书·篇》、须本于自家学说。
   * 叙事人物引对白是**性格表现**：悟空说「皇帝轮流做」不是在论证天命可易，
   * 他就是要那个位子。把后者也按前者的律令写，出来的会是一个讲道理的猴子——
   * 既不像悟空，也不比诸子更有理。
   *
   * 故 `figure` 一属：不标出处、不讲道理，典据只作「你从前说过的话」提示其口气与经历。
   * `west` 一属（西方文哲）：**说英文**。歌德、莎士比亚用中文讲先秦腔是张冠李戴，
   * 用中文讲白话也还是隔一层——他们本就不是用这套语言想事情的。故令其以母语作答
   * （统一英文，含歌德、塞万提斯等非英语者：取其通行英译之调，总胜过译成中文），
   * 引证出自家作品或自家笔下人物，标《Title · Part》；称引中国书须言明是「其书有云」。
   * `kind` 省略即 `thinker`，诸子那批请求逐字不变。
   */
  const isFigure = kind === "figure";
  const isRegistryPersona = !!scholar.profileTier;
  // 叙事中人与立论者之别，在「怎么说」，不在「讲不讲理」。
  // 从前此处还写着「不讲大道理、不援引典籍、不标出处」，结果悟空问一句答一句，
  // 只会摆他自家的经历，客问的那个理他一句不碰——话是他的话，理却没了。
  // 故只留口吻之限（白话、短句、带脾气、不摆引经据典的架子），该讲的理仍要讲透。
  const toneRule =
    isRegistryPersona
      ? `以${scholar.name}所处时代与人物资料为边界，用清楚、克制的白话作答。` +
        `可依据其生平与著述目录（${(scholar.representativeWorks ?? []).join("、") || "未详"}）说明立场，但目录不是正文证据。` +
        `只有下方确实提供原文典据时才可直接引用并标出处，且须附对应 [E#]；没有典据时不得编造原句、篇名或“我曾说过”。\n`
      : kind === "figure"
      ? `以${scholar.name}平日说话的口气作答：白话、短句、带脾气。客问的那件事要正面答，该讲的理要讲透，可就事析理、可驳客之说；举证取你自己经历过的事，须是书中实有之事，不可杜撰；不摆引经据典的架子，也不标《书·篇》出处。\n`
      : kind === "west"
        ? `You are ${scholar.name}. Answer in ENGLISH — your own language — never in Chinese. ` +
          `Write in your own voice and idiom; argue from your own thought and your own works. ` +
          `Quote only the supplied evidence, cite it as 《Title · Part》, and append its [E#] tag; never invent a citation. ` +
          `If you set your view beside a Chinese classic, you may quote it (as "their book says"), but never pass it off as your own.\n`
        : `以先秦诸子口吻，文白相杂、简练；立论须本于自家学说；本家典籍可作为自身立场。` +
          (hasLineageCanon
            ? `标为“关联典籍”的他书仅可按所示关系使用，并须选取其中最切题的一条在回答中实际引用，明说书名与归属：承学/传注/取材/相续可说明来源，非难对象只能作为批评对象，不得当作支持自己的证据；绝不可冒充本家之言。`
            : `引典只可引本家典籍，不得引他家之言。`) +
          `凡引用均标注《书·篇》，并在引文或据此所作判断之后附对应证据号 [E#]；只能使用下方实际提供的证据号，不得另造出处。` +
          `若只是解释而非逐字引用，也须附支撑它的 [E#]；没有相应证据时明确说证据不足，不得凭记忆补引。\n`;
  const lineageRule = lineageRequest?.requested
    ? lineageRequest.reviewedAvailable
      ? "这是文脉关系问题。回答必须明确关系方向与七类关系名称，并同时区分源书证据和本家著述；不得把关系说明当作原文。\n"
      : "这是文脉关系问题，但当前没有检得通向此人物著作的审定关系边。必须明确说明当前证据不足，不得自行猜测或新造一条文脉关系。\n"
    : "";
  const canonHint = isFigure
    ? `下列是你从前说过的话，可取其意、化入语气，不必照搬，也不必标回目：\n${canonBlock}`
    // 西方一席整份提示词都用英文：中英混排时模型十有八九顺着中文那半就用中文答了
    : kind === "west"
      ? `You may draw on these passages of your own (given in the original where one is at hand, otherwise in Chinese rendering):\n${canonBlock}`
      : `可参引下列典据：\n${canonBlock}`;

  // 记忆行：与客此前问答要点（仅 1v1/辩论/双贤模式织入）
  const memoryLine =
    Array.isArray(memory) && memory.length
      ? `你与此客此前有过数番问答，其要如下：${memory.map((m) => `「${m.topic}」${m.excerpt}`).join("；")}。可就中承接，不必重复。\n`
      : "";

  // 好感度行：据此调整亲疏分寸（同上模式织入）
  const affDesc = (n: number) =>
    n >= 3 ? "相善，可推心置腹" : n >= 1 ? "初熟，言可稍亲" : n === 0 ? "初识，礼数如常" : n >= -2 ? "微有龃龉，言辞持重" : "相左，多有辩难";
  const affinityLine = affinity
    ? `你与此客交情${affDesc(affinity.user)}，据此调整亲疏分寸。${
        affinity.peers && affinity.peers.length
          ? affinity.peers.map((p) => `你与${p.name}${affDesc(p.level)}`).join("，") + "，可据此定驳难之缓急。"
          : ""
      }\n`
    : "";

  const boundaryLine = knowledgeBoundary
    ? (() => {
        const life = knowledgeBoundary.birthYear != null || knowledgeBoundary.deathYear != null
          ? `人物年代边界：${knowledgeBoundary.birthYear ?? "生年未详"}至${knowledgeBoundary.deathYear ?? "卒年未详"}。`
          : "人物确切生卒年未详。";
        const regions = knowledgeBoundary.regions?.length
          ? `地域语境：${knowledgeBoundary.regions.join("、")}。`
          : "";
        const modeRule = knowledgeBoundary.mode === "historical"
          ? "这是历史模式：不得把人物身后的事件、概念或典籍说成亲历、亲见或已知；只使用下方已通过时间与文脉边界的典据。"
          : "这是跨时空比较模式：用户可以把后世事件或异文化材料交到你面前；你可以据题面评议，但须把它当作今人提供的外部材料，不得声称生前已经知道，也不得借用身后的典籍为自己的知识。";
        return `${life}${regions}${modeRule}${knowledgeBoundary.regionalNote ? `\n${knowledgeBoundary.regionalNote}` : ""}\n`;
      })()
    : "";

  // 对谈/辩论模式：debate=圆桌争鸣、dialogue=双贤对谈；否则为 1v1 对谈。
  // 三者皆以本家为主；只有带 relation 的谱系来源可显式归属后跨书引用。
  let sys: string;
  if (debate) {
    const roundInstr: Record<string, string> = {
      "陈述": isFigure ? "请先说你自家的看法，2 至 3 句。" : "请先立本位之说，2 至 3 句；可引典标注《书·篇》。",
      "反驳": `${debate.previousSpeaker ? `先驳${debate.previousSpeaker}之说未允处，再申己见，` : ""}2 至 3 句。`,
      "质询": `${debate.previousSpeaker ? `针对${debate.previousSpeaker}所论，${isFigure ? "直问一句不服之处，" : "以典设问诘难，"}` : ""}2 至 3 句${isFigure ? "。" : "；引典标注《书·篇》。"}`,
      "总结": isFigure ? "收束本场，说一句你的了断，2 至 3 句。" : "收束本场争鸣，以「要之」领起、引典作结，2 至 3 句。",
    };
    const instr = roundInstr[debate.round] ?? "2 至 3 句。";
    sys =
      `你是${scholar.name}${scholar.courtesy ? `（字${scholar.courtesy}）` : ""}，${scholar.school}代表人物。${scholar.intro ?? ""}\n` +
      `你正与诸子围坐圆桌展开百家争鸣，议题为「${debate.topic ?? question}」，本轮为「${debate.round}」。${instr}\n` +
      memoryLine + affinityLine +
      boundaryLine +
      lineageRule +
      toneRule +
      canonHint;
  } else if (dialogue) {
    const other = dialogue.previousSpeaker ?? "对方";
    sys =
      `你是${scholar.name}${scholar.courtesy ? `（字${scholar.courtesy}）` : ""}，${scholar.school}代表人物。${scholar.intro ?? ""}\n` +
      `你正与${other}就「${dialogue.topic ?? question}」对谈。请回应对方所论（可部分认同、部分申己见，不必一味相驳），2 至 3 句。\n` +
      memoryLine + affinityLine +
      boundaryLine +
      lineageRule +
      toneRule +
      canonHint;
  } else if (moderator) {
    // 主持人轮间追问/收束：吕不韦人格综观前文，发一记追问（进反驳/质询）或收束（进总结），
    // 成为下一轮焦点。不引典据、不下定论，故此处不附 canonBlock
    const kind = moderator.nextRound === "总结" ? "收束" : "追问";
    sys =
      `你是${scholar.name}，${scholar.school}代表人物。${scholar.intro ?? ""}\n` +
      `你正主持一场百家争鸣圆桌，议题为「${moderator.topic ?? question}」。\n` +
      `${moderator.prevRound}轮诸子已各陈其说。请综观前文，发一记${kind}：` +
      (kind === "收束"
        ? "撮述各方要旨、点出分歧所在，自然引出总结轮；"
        : `抓住前文最关键的分歧或未明之处，以一句问诘为下一轮「${moderator.nextRound}」立一焦点；`) +
      `2 至 3 句，先秦口吻、文白相杂；你兼收并蓄、不偏一家，可点出诸家得失，但不下定论、不引典籍出处。只输出${kind}本身，不加前缀或引号。`;
  } else if (autonomy) {
    // 人物自主性：依性情/学说/时辰/处境自决一句动作，不引典、不解释
    sys =
      `你是${scholar.name}，${scholar.school}代表人物。${scholar.intro ?? ""}\n` +
      `当前在${autonomy.region}，${autonomy.shichen}时辰，${autonomy.action}。\n` +
      `依你的性情与${isFigure ? "处境" : "学说"}，此刻你会做什么？只输出一句不超过 18 字的动作描述，以「正在」领起（如「正在抚琴独坐」「正在默诵旧篇」），不引典籍、不加解释、不加引号或前缀。`;
  } else if (judge) {
    // 评判模式：吕不韦综观全场，为每位入席者打分并给判词，输出 JSON
    const turns = (judge.turns ?? []).map((t) => `${t.name}：${t.text}`).join("\n");
    sys =
      `你是吕不韦，杂家代表人物，兼收并蓄。本场辩论议题为「${judge.topic}」，诸子发言如下：\n${turns}\n` +
      `请综观全场，为每位发言者按典据、逻辑、口锋三端综合打 1–10 分并各给一句点评，末了给一句总判词。\n` +
      `只输出 JSON，不加引号或前后缀，形如：{"verdict":"总判词一句","scores":[{"id":"人物id","name":"名","score":8,"note":"点评一句"}]}。id 与 name 须与上述发言者一致。`;
  } else {
    const presenceLine = presence ? `当前处境：${presence.region}，${presence.action}。` : "";
    sys =
      kind === "west"
        ? `You are ${scholar.name}${scholar.school ? ` — ${scholar.school}` : ""}. ${scholar.intro ?? ""}\n` +
          `Reply in 2 to 4 sentences.\n` +
          toneRule +
          boundaryLine +
          lineageRule +
          memoryLine + affinityLine +
          canonHint
        : `你是${scholar.name}${scholar.courtesy ? `（字${scholar.courtesy}）` : ""}，${scholar.school}代表人物。${scholar.intro ?? ""}\n` +
          `请作答，2 至 4 句。\n` +
          toneRule +
          boundaryLine +
          lineageRule +
          memoryLine + affinityLine +
          `${presenceLine}\n` +
          canonHint;
  }

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [{ role: "system", content: sys }];
  // 本家 few-shot：在 system 后、对话史前，以 user/assistant 示例对织入，教诸子本家引典口吻
  if (Array.isArray(fewShot)) {
    for (const f of fewShot) {
      messages.push({ role: "user", content: f.q });
      messages.push({ role: "assistant", content: f.a });
    }
  }
  if (Array.isArray(history)) {
    for (const h of history.slice(-6)) {
      messages.push({ role: h.mine ? "user" : "assistant", content: h.text });
    }
  }
  messages.push({ role: "user", content: question });

  // 按模式调参：autonomy 短而发散（temp 高、tokens 少）；judge 精严（temp 低、tokens 足）；其余默认
  const temp = autonomy ? 0.9 : judge ? 0.3 : 0.8;
  const model = chatModelOf(env);
  // 非思考模式按实际回答长度分配 token；保留分支以兼容旧构建产物的调用结构。
  const maxTokens = useThinking(model)
    ? (autonomy ? 512 : judge ? 2048 : 2048)
    : (autonomy ? 64 : judge ? 768 : 512);

  try {
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ model, messages, ...generationTuning(model, temp), max_tokens: maxTokens, stream: true }),
    });
    if (!r.ok || !r.body) {
      const detail = (await r.text()).slice(0, 500);
      return Response.json({ ok: false, reason: "upstream", status: r.status, detail }, { status: 502, headers: cors });
    }
    // 流式：把 DashScope 的 SSE 原样透传给浏览器，由 dialogue.ts 的 readSSE 解析 choices[0].delta.content 逐字回填
    return new Response(r.body, {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/** 从模型偶尔附带的 Markdown 栅栏或编号文字中稳妥取回三条问题。 */
function parseEventQuestions(raw: string): string[] {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const object = cleaned.match(/\{[\s\S]*\}/)?.[0];
  if (object) {
    try {
      const parsed = JSON.parse(object) as { questions?: unknown };
      if (Array.isArray(parsed.questions)) {
        const qs = parsed.questions.filter((q): q is string => typeof q === "string").map((q) => q.trim());
        if (qs.length >= 3) return qs.slice(0, 3);
      }
    } catch { /* 继续按编号行读取 */ }
  }
  const lines = cleaned.split(/\n+/).map((line) => line.replace(/^\s*(?:\d+[.、)）]|[-•])\s*/, "").trim()).filter(Boolean);
  return lines.filter((line) => /[?？]$/.test(line)).slice(0, 3);
}

/**
 * 事件问题生成器：只读事实，不带任何人物设定，避免由某位角色替读者预先定论。
 * 返回严格的三条问题，供事件评议页作为入口；API Key 始终留在 Worker。
 */
async function handleEventQuestions(request: Request, env: Env): Promise<Response> {
  const cors = corsBase();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });
  if (!env.DASHSCOPE_API_KEY) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: { facts?: string; language?: "zh" | "en" };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const facts = payload.facts?.trim();
  if (!facts) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });

  const english = payload.language === "en";
  const system = english
    ? "You are an impartial historical-question editor. From the supplied record only, produce exactly three concise, distinct questions worth discussing. Each question must explore causation, a choice, a cost, a tension, or an impact. Never ask users to retrieve or verify a date, a name, a place, or another fact stated in the record; never say that the record lacks information. Do not add historical knowledge: use no institutions, groups, places, events, motives, or outcomes that the record does not state. When the record is brief, use neutral references such as 'this event' or 'this change' rather than filling in background knowledge. Do not assign blame. Return JSON only: {\"questions\":[\"...\",\"...\",\"...\"]}."
    : "你是一位中立的历史问题编辑。只根据给出的史实，生成恰好三条值得讨论、彼此不同的简短问题。每条须进入因果、抉择、代价、张力或影响之一；不得询问或核查材料已写明的年份、人物、地点等事实，不得说材料信息不足。严禁补入史学常识：材料未写出的制度、群体、地域、事件、动机与结果均不可写入题面。材料简略时，用“这一事件”“这一变化”等中性指代，不可擅自补背景。不得预设褒贬。只输出 JSON：{\"questions\":[\"...\",\"...\",\"...\"]}。";
  const model = chatModelOf(env);
  try {
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.DASHSCOPE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: facts }],
        ...generationTuning(model, 0.45),
        max_tokens: useThinking(model) ? 1024 : 320,
        stream: false,
      }),
    });
    if (!r.ok) return Response.json({ ok: false, reason: "upstream" }, { status: 502, headers: cors });
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const questions = parseEventQuestions(data.choices?.[0]?.message?.content ?? "");
    if (questions.length !== 3) return Response.json({ ok: false, reason: "bad-output" }, { status: 502, headers: cors });
    return Response.json({ ok: true, questions }, { headers: cors });
  } catch {
    return Response.json({ ok: false, reason: "fetch-error" }, { status: 502, headers: cors });
  }
}

/**
 * 一致性校验与译白话共用的 CORS／方法／鉴权骨架。未配置 key 时返回 no-key（503）。
 */
function corsBase(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

/**
 * 右键"译为白话"服务端代理：把先秦诸子口吻的发言译为现代白话文。
 * 系统提示约束忠于原意、保留人物立场、不加评论与典籍、只出译文；学派术语提示在位（如荀子"伪"指人为）。
 * `lang: "en"` 则是另一桩：西方一席的评议本就用英文作答（见 toneRule 的 west 支），
 * 其下要附一行中译，故此处转作英译中——译的是人家自己的话，不是古文。
 * `lang: "zh2en"` 是第三桩，反向：英文模式下诸子仍以中文发言（其言皆自中文典籍检出，
 * 换英文生成便失了依据），译文附在发言之下。故不是「改用英文作答」，是「中文作答、英文附译」。
 * API Key 同样只在本 Worker 持有；未配置或上游异常返回非 ok，由浏览器提示"未能译出"。
 */
async function handleTranslate(request: Request, env: Env): Promise<Response> {
  const cors = corsBase();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: { text?: string; scholar?: { name?: string; school?: string }; source?: string; lang?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const { text, scholar, source, lang } = payload ?? {};
  if (!text || text.length > 6000) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });

  const ctx = scholar?.name
    ? `此为${scholar.name}${scholar?.school ? `（${scholar.school}）` : ""}之语，译时须注意其学派术语本义（如荀子"伪"指人为、非虚伪；名家"指"指概念）。`
    : "";
  // 两种译法分得开：对谈里译的是某子之发言，四库里译的是典籍正文。
  // 正文有叙有白、有人名官名，当作「某子发言」去译便会把叙述句也译成第一人称口吻。
  const sys = lang === "enChapter"
    ? `你是文学与思想典籍的英译中助手。将下列英文原书正文译为准确、通顺的现代汉语。保留段落、对白、诗行及专有名词的一致性；不得添加原文没有的内容、注释、标题、前言或结语。只输出中文译文。出处：${(source ?? "英文原书").slice(0, 160)}。`
    : lang === "zh2en"
    ? `You translate classical-Chinese philosophical speech into English.` +
      ` The text below is what ${scholar?.name ? `${scholar.name}${scholar?.school ? ` (the ${scholar.school} school)` : ""}` : "a pre-Qin philosopher"} just said in a dialogue or debate.` +
      ` Render it in clear, dignified modern English prose — plain enough to follow, never breezy.` +
      ` Keep the speaker's position and the force of his argument exactly; do not soften, hedge, or add commentary.` +
      ` Use the standard sinological renderings for names and terms (孔子 Confucius, 仁 benevolence, 礼 ritual, 道 the Way, 无为 non-action, 兼爱 impartial care, 法 law).` +
      ` A citation written 《书·篇》 becomes the English title in italics-free plain form, e.g. 《论语·学而》 → (Analects 1).` +
      ` Output the translation only: no quotation marks, no preface, no notes.`
    : lang === "en"
    ? `你是英译中助手。下列是${scholar?.name ? `${scholar.name}（西方文哲）` : "一位西方作家"}评议一个母题的英文原话。` +
      `请译为通顺的现代汉语：忠于原意与语气分寸，该是议论便作议论；` +
      `其中《Title · Part》式的出处照译作中文通行书名（如 《Hamlet · Act 1, Scene 5》 作 《哈姆莱特·第一幕第五场》），` +
      `人名地名用通行译名；通篇不得夹留英文词（striving、spirit 之类一律译出），不增删、不加评论、不加引号或前缀，只输出译文本身。`
    : source
    ? `你是古文译白话助手。下列文字出自${source}，是典籍正文（可能夹叙夹议、含对白）。` +
      `请译为通顺明白的现代白话文：忠于原文，叙述仍作叙述、对白仍作对白，人名地名官名照旧不译，` +
      `不增添评论与考据，不加引号或前缀，只输出译文本身。`
    : `你是古文译白话助手。将下列先秦诸子口吻的发言译为通顺明白的现代白话文：忠于原意、保留人物立场与口吻分寸，不增添评论与解释，不引用典籍出处，只输出译文本身，不加引号或前缀。${ctx}`;
  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: sys },
    { role: "user", content: text },
  ];

  const model = chatModelOf(env);
  try {
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        model,
        messages,
        ...generationTuning(model, 0.3),
        max_tokens: useThinking(model) ? (lang === "enChapter" ? 4096 : 2048) : (lang === "enChapter" ? 2048 : 768),
        stream: true,
      }),
    });
    if (!r.ok || !r.body) {
      const detail = (await r.text()).slice(0, 500);
      return Response.json({ ok: false, reason: "upstream", status: r.status, detail }, { status: 502, headers: cors });
    }
    // 流式：把 DashScope 的 SSE 原样透传给浏览器，由 dialogue.ts 的 readSSE 逐字回填译文
    return new Response(r.body, {
      status: 200,
      headers: { ...cors, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/** 容错解析 Qwen 返回的判定：去 ```json 栅栏、正则取首个对象、再退回扫档命中 合规/存疑/矛盾。 */
function parseVerdict(raw: string): { verdict: "合规" | "存疑" | "矛盾"; note: string } | null {
  const VALID: ("合规" | "存疑" | "矛盾")[] = ["合规", "存疑", "矛盾"];
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const obj = JSON.parse(m[0]) as { verdict?: string; note?: string };
      const v = (obj.verdict ?? "").trim();
      if (VALID.includes(v as "合规" | "存疑" | "矛盾")) {
        return { verdict: v as "合规" | "存疑" | "矛盾", note: (obj.note ?? "").trim() || v };
      }
    } catch { /* 退回扫档 */ }
  }
  for (const v of VALID) {
    if (raw.includes(v)) return { verdict: v, note: raw.replace(/\s+/g, " ").trim().slice(0, 200) };
  }
  return null;
}

/**
 * 一致性校验 Agent 的服务端代理：判定人物发言是否违背其本家学说或先秦时代背景。
 * 系统提示附人物简介/主题/代表言/本家典据，三档判定（合规/存疑/矛盾），只输出 JSON。
 * 模型可能加栅栏或赘述，故 parseVerdict 容错解析。API Key 只在本 Worker 持有。
 *
 * 判词由**异源**模型（QWEN_VERIFY_MODEL，默认 deepseek-v4.1-flash）给出，不与发言生成
 * 同族；响应带 `model` 与 `crossModel`，前者记是谁判的，后者记这一判是否真属外证。
 */
async function handleVerify(request: Request, env: Env): Promise<Response> {
  const cors = corsBase();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: VerifyPayload;
  try {
    payload = (await request.json()) as VerifyPayload;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const { scholar, text, topic, canon } = payload ?? {};
  if (!scholar || !text) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });

  const canonBlock =
    Array.isArray(canon) && canon.length
      // 白话可空：自四库全文接来的段落未预先译（见 canonSource.ts），空则不缀括号，
      // 否则提示词里会出现一串「（）」，模型会当作有话没说完
      ? canon.map((c, i) => `[${c.evidenceId || `E${i + 1}`}]《${c.book}·${c.chapter}》「${c.text}」${c.gloss ? `（${c.gloss}）` : ""}${c.relation ? `【${c.relation.use}·${c.relation.label}：${c.relation.note}】` : ""}`).join("\n")
      : "（未附本家典据，可依该人物已知学说判断）";

  // 审校之准亦随人格之属而分：诸子审的是「合不合自家学说」，叙事人物审的是
  // 「像不像他这个人」——悟空没有学说可违，但有性情可失；西贤审的是「本不本于
  // 其自家学识与作品」——他们不立说，其所本者在笔下。
  const sys =
    scholar.kind === "figure"
      ? `你是叙事人物口吻审校者。判断下列发言是否合于${scholar.name}的性情、经历与说话方式。\n` +
        `人物简介：${scholar.intro ?? ""}\n` +
        `其人之要：${Array.isArray(scholar.themes) ? scholar.themes.join("、") : ""}\n` +
        `代表言：${scholar.quote ?? ""}\n` +
        `其人曾说过的话：\n${canonBlock}\n\n` +
        `判定标准：\n` +
        `「合规」：语气、脾性、处事之道皆与此人相合，所述经历不与原著相违。\n` +
        `「存疑」：略显文气或过于讲理，尚不失其人。\n` +
        `「矛盾」：说成了一个讲道理的学者（援引典籍、标注出处、以学派立论），或性情与原著明显相悖，或编造其未曾有过的经历。\n\n` +
        `议题：${topic ?? "（未明示）"}\n` +
        `待审发言：${text}\n\n` +
        `只输出 JSON，不要任何其他文字：{"verdict":"合规|存疑|矛盾","note":"一句理由"}`
      : scholar.kind === "west"
        ? `你是西方文哲审校者。判断下列发言是否合于${scholar.name}的自家学识与作品。\n` +
          `人物简介：${scholar.intro ?? ""}\n` +
          `其人之要：${Array.isArray(scholar.themes) ? scholar.themes.join("、") : ""}\n` +
          `代表言：${scholar.quote ?? ""}\n` +
          `其书原文：\n${canonBlock}\n\n` +
          `其人惯以西文作答，待审发言或为英文，照常判定。\n\n` +
          `判定标准：\n` +
          `「合规」：所言本于其自家学识与作品，思路与关切仍是其人的；纵论他书他题亦以自家学理回应。\n` +
          `「存疑」：略显泛论或游离其本业，尚可两解。\n` +
          `「矛盾」：离其作品与学识甚远，或混入先秦概念与中式学理而说成本家之言，或说成了另一个人。\n\n` +
          `议题：${topic ?? "（未明示）"}\n` +
          `待审发言：${text}\n\n` +
          `只输出 JSON，不要任何其他文字：{"verdict":"合规|存疑|矛盾","note":"一句理由，合规则简注其所本，矛盾/存疑则指出违在何处"}`
        : `你是先秦诸子学说审校者。判断下列发言是否合于${scholar.name}（${scholar.school}）之本家学说、且不含先秦时不可能有的概念或框架。\n` +
        `人物简介：${scholar.intro ?? ""}\n` +
        `代表主题：${Array.isArray(scholar.themes) ? scholar.themes.join("、") : ""}\n` +
        `代表言：${scholar.quote ?? ""}\n` +
        `本家典据：\n${canonBlock}\n\n` +
        `判定标准：\n` +
        `「合规」：发言与其核心学说一致、口吻得体，纵论现代议题亦能以自家学理回应（议题可现代，回应须以先秦概念为本）。\n` +
        `「存疑」：略有出入或夸大、口吻过现代而尚可两解，未根本相悖。\n` +
        `「矛盾」：明显违背其核心主张（如墨子主兼爱非攻却言攻伐为善、孟子主性善却言性恶），或径用先秦不可能有的概念框架（如资本主义、人权、科学方法而不加学理转译），或误引他家之言为自家。\n\n` +
        `议题：${topic ?? "（未明示）"}\n` +
        `待审发言：${text}\n\n` +
        `只输出 JSON，不要任何其他文字：{"verdict":"合规|存疑|矛盾","note":"一句理由，合规则简注其所本，矛盾/存疑则指出违在何处"}`;

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: sys },
    { role: "user", content: text },
  ];

  const chatModel = chatModelOf(env);
  const verifyModel = env.QWEN_VERIFY_MODEL || DEFAULT_VERIFY_MODEL;

  /** 以指定模型求一次判词。`enable_thinking:false` 两家都要：DeepSeek 不关思考会把
   *  max_tokens 吃光返空串，Qwen 则是沿用原有行为。 */
  async function judge(model: string) {
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, ...generationTuning(model, 0.2), max_tokens: useThinking(model) ? 1024 : 128 }),
    });
    if (!r.ok) return { err: `${r.status} ${(await r.text()).slice(0, 300)}` };
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = parseVerdict(raw);
    return parsed ? { parsed } : { err: `parse:${raw.slice(0, 200)}` };
  }

  try {
    // 先请异源校验官。它不通（未开通／额度尽／判词解不出）才退回本家模型自审，
    // 并以 crossModel:false 标明——退了就说退了，别让界面与导出的 transcript 把
    // 自评自的判词也记成外证。
    const cross = await judge(verifyModel);
    if (cross.parsed) {
      return Response.json(
        { ok: true, verdict: cross.parsed.verdict, note: cross.parsed.note, model: verifyModel, crossModel: true },
        { headers: cors },
      );
    }
    if (verifyModel === chatModel) {
      return Response.json({ ok: false, reason: "upstream", detail: cross.err }, { status: 502, headers: cors });
    }
    const same = await judge(chatModel);
    if (same.parsed) {
      return Response.json(
        { ok: true, verdict: same.parsed.verdict, note: same.parsed.note, model: chatModel, crossModel: false },
        { headers: cors },
      );
    }
    return Response.json(
      { ok: false, reason: "upstream", detail: `${verifyModel}: ${cross.err} / ${chatModel}: ${same.err}` },
      { status: 502, headers: cors },
    );
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/**
 * 一致性自动修订：生成模型只按异源校验官指出的问题作最小改写；是否真正合规仍由
 * 浏览器随后再次调用 `/api/verify` 决定。修订端绝不自评，也不凭空补引文。
 */
async function handleRepair(request: Request, env: Env): Promise<Response> {
  const cors = corsBase();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: RepairPayload;
  try {
    payload = (await request.json()) as RepairPayload;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const { scholar, text, topic, canon, verdict, note } = payload ?? {};
  if (!scholar || !text || (verdict !== "存疑" && verdict !== "矛盾")) {
    return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });
  }

  const canonBlock =
    Array.isArray(canon) && canon.length
      ? canon.map((c, i) => `[${c.evidenceId || `E${i + 1}`}]《${c.book}·${c.chapter}》「${c.text}」${c.gloss ? `（${c.gloss}）` : ""}${c.relation ? `【${c.relation.use}·${c.relation.label}：${c.relation.note}】` : ""}`).join("\n")
      : "（没有可用原典；不得因此编造引文或经历。）";
  const languageRule = scholar.kind === "west" ? "保持原回答所用语言；若原答为英文，修订后仍用英文。" : "使用中文。";
  const personaRule =
    scholar.kind === "figure"
      ? "保持人物的性情、经历边界与说话方式，不要改写成援引典籍立论的学者。"
      : scholar.kind === "west"
        ? "只从此人的作品、学识与时代处境出发，不混入中式学派概念，也不要冒充另一人物。"
        : "保持其本家学说与时代边界；现代议题须转译为其自身概念，不误引他家为自家。";

  const sys =
    `你是人物发言修订者。校验官已将下列回答判为「${verdict}」。请依据校验理由与所附典据作最小范围修订。\n` +
    `人物：${scholar.name}（${scholar.school}）\n人物简介：${scholar.intro ?? ""}\n` +
    `人物主题：${Array.isArray(scholar.themes) ? scholar.themes.join("、") : ""}\n代表言：${scholar.quote ?? ""}\n` +
    `议题：${topic ?? "（未明示）"}\n校验理由：${note || verdict}\n可用典据：\n${canonBlock}\n\n` +
    `修订规则：\n1. ${personaRule}\n2. ${languageRule}\n` +
    `3. 保留原回答中与问题直接相关且有依据的内容，只改校验官指出的越界处。\n` +
    `4. 不新增典据中没有的事实、经历、引文或出处；证据不足时明确保留，不要强答。\n` +
    `5. 凡引用或据某条证据作判断，须在句末附对应 [E#]；只能使用上列证据号。\n` +
    `6. 不解释修订过程，不提“校验官”“原回答”或判档，只输出修订后的完整回答。`;

  try {
    const model = chatModelOf(env);
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: text },
        ],
        ...generationTuning(model, 0.2),
        max_tokens: 768,
      }),
    });
    if (!r.ok) {
      return Response.json(
        { ok: false, reason: "upstream", status: r.status, detail: (await r.text()).slice(0, 500) },
        { status: 502, headers: cors },
      );
    }
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const revised = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!revised) return Response.json({ ok: false, reason: "empty" }, { status: 502, headers: cors });
    return Response.json({ ok: true, text: revised, model }, { headers: cors });
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/**
 * 古风配音服务端代理：浏览器 GET /api/tts?text=…&voice=… → 本 Worker 调 DashScope
 * CosyVoice 合成 mp3，把音频流原样透传给浏览器 <audio> 边下边播（流式配音）。
 * API Key 只在本 Worker 持有、不下发浏览器。未配置 Key 或上游异常（含账号未开
 * 音频模型、音色 id 无效）时返回非 ok JSON，由浏览器 SpeakButton 静默回退到
 * 系统 speechSynthesis，配音不中断。
 */
async function handleTts(request: Request, env: Env): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const url = new URL(request.url);
  const text = url.searchParams.get("text") ?? "";
  const voice = url.searchParams.get("voice") || undefined;
  if (!text) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  try {
    const r = await fetch(DASHSCOPE_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-DataInspection": "enable",
      },
      body: JSON.stringify({
        model: env.DASHSCOPE_TTS_MODEL || DEFAULT_TTS_MODEL,
        input: { text },
        parameters: {
          voice: voice || env.DASHSCOPE_TTS_VOICE || DEFAULT_TTS_VOICE,
          format: "mp3",
          sample_rate: 24000,
        },
      }),
    });
    if (!r.ok || !r.body) {
      const detail = (await r.text()).slice(0, 500);
      return Response.json({ ok: false, reason: "upstream", status: r.status, detail }, { status: 502, headers: cors });
    }
    // 透传音频流：浏览器 <audio> 元素边下边播（流式配音）
    return new Response(r.body, {
      status: 200,
      headers: { ...cors, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/** 视频三端点共用 CORS（POST 提交 ＋ GET 轮询）。 */
function videoCors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

/**
 * 通义万相文生图提交（视频关键帧）：浏览器 POST {prompt,size?} → 本 Worker 调 DashScope
 * 异步任务，回 {taskId}。Key 不出服务端；账号未开通或上游异常回非 ok（浏览器侧提示）。
 */
async function handleVideoImg(request: Request, env: Env): Promise<Response> {
  const cors = videoCors();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, error: "method" }, { status: 405, headers: cors });
  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, error: "no-key" }, { status: 503, headers: cors });
  let payload: { prompt?: string; size?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, error: "bad-json" }, { status: 400, headers: cors });
  }
  if (!payload.prompt) return Response.json({ ok: false, error: "bad-args" }, { status: 400, headers: cors });
  try {
    const r = await fetch(DASHSCOPE_IMG_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-DashScope-Async": "enable" },
      body: JSON.stringify({
        model: env.QWEN_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
        input: { prompt: payload.prompt },
        parameters: { size: payload.size || "1024*1024", n: 1 },
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { output?: { task_id?: string }; message?: string; code?: string };
    if (!r.ok || !j.output?.task_id)
      return Response.json({ ok: false, error: j.message || j.code || `upstream ${r.status}`, detail: JSON.stringify(j).slice(0, 300) }, { status: 502, headers: cors });
    return Response.json({ ok: true, taskId: j.output.task_id }, { headers: cors });
  } catch (e) {
    return Response.json({ ok: false, error: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/**
 * 通义万相图生视频提交：浏览器 POST {imageUrl,prompt} → 本 Worker 调 DashScope 异步任务，回 {taskId}。
 * 以文生图关键帧为输入、运动提示令其动起来。账号未开通视频模型时此处返回权限错误。
 */
async function handleVideoI2V(request: Request, env: Env): Promise<Response> {
  const cors = videoCors();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, error: "method" }, { status: 405, headers: cors });
  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, error: "no-key" }, { status: 503, headers: cors });
  let payload: { imageUrl?: string; prompt?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, error: "bad-json" }, { status: 400, headers: cors });
  }
  if (!payload.imageUrl) return Response.json({ ok: false, error: "bad-args" }, { status: 400, headers: cors });
  const duration = Number(env.QWEN_VIDEO_DURATION) || 5;
  try {
    const r = await fetch(DASHSCOPE_VIDEO_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-DashScope-Async": "enable" },
      body: JSON.stringify({
        model: env.QWEN_VIDEO_MODEL || DEFAULT_VIDEO_MODEL,
        input: { img_url: payload.imageUrl, prompt: payload.prompt || "" },
        parameters: { resolution: env.QWEN_VIDEO_RESOLUTION || "720P", duration, prompt_extend: true },
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { output?: { task_id?: string }; message?: string; code?: string };
    if (!r.ok || !j.output?.task_id)
      return Response.json({ ok: false, error: j.message || j.code || `upstream ${r.status}`, detail: JSON.stringify(j).slice(0, 300) }, { status: 502, headers: cors });
    return Response.json({ ok: true, taskId: j.output.task_id }, { headers: cors });
  } catch (e) {
    return Response.json({ ok: false, error: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/**
 * 异步任务轮询：浏览器 GET /api/video/poll?task=ID → 本 Worker 查 DashScope 任务状态，回 {status,url?}。
 * 图任务结果在 output.results[0].url，视频在 output.video_url，二者皆取以通用。
 */
async function handleVideoPoll(request: Request, env: Env): Promise<Response> {
  const cors = videoCors();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "GET") return Response.json({ ok: false, error: "method" }, { status: 405, headers: cors });
  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, error: "no-key" }, { status: 503, headers: cors });
  const task = new URL(request.url).searchParams.get("task");
  if (!task) return Response.json({ ok: false, error: "bad-args" }, { status: 400, headers: cors });
  try {
    const r = await fetch(`${DASHSCOPE_TASK_URL}/${task}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const j = (await r.json().catch(() => ({}))) as {
      output?: { task_status?: string; video_url?: string; results?: { url?: string }[]; result_url?: string; message?: string };
    };
    if (!r.ok) return Response.json({ ok: false, status: "UNKNOWN", error: `upstream ${r.status}` }, { status: 502, headers: cors });
    const status = j.output?.task_status ?? "UNKNOWN";
    let url: string | undefined;
    if (status === "SUCCEEDED") url = j.output?.video_url || j.output?.results?.[0]?.url || j.output?.result_url;
    return Response.json(
      { ok: true, status, url, error: status === "FAILED" ? j.output?.message || "生成失败" : undefined },
      { headers: cors },
    );
  } catch (e) {
    return Response.json({ ok: false, status: "UNKNOWN", error: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/**
 * 语义向量代理：浏览器 POST {text} → 本 Worker 调 DashScope 向量模型返回向量。
 * Key 只在服务端持有；向量用于浏览器侧与预计算的典籍向量做余弦相似（混合检索）。
 * 未配置 key 或上游异常返回非 ok，调用方降级纯关键词检索。
 */
async function handleEmbed(request: Request, env: Env): Promise<Response> {
  const cors = corsBase();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: { text?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const text = payload?.text?.trim();
  if (!text) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });

  try {
    const r = await fetch(DASHSCOPE_EMBED_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: DEFAULT_EMBED_MODEL, input: text, dimensions: 1024 }),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 500);
      return Response.json({ ok: false, reason: "upstream", status: r.status, detail }, { status: 502, headers: cors });
    }
    const data = (await r.json()) as { data?: { embedding?: number[] }[] };
    const vector = data.data?.[0]?.embedding;
    if (!Array.isArray(vector)) return Response.json({ ok: false, reason: "no-vector" }, { status: 502, headers: cors });
    return Response.json({ ok: true, vector }, { headers: cors });
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/** 视频理解请求体：浏览器抽好的 base64 帧集（data URL）＋ 可选文字提示。 */
type UnderstandPayload = {
  frames?: string[];
  hint?: string;
};

/** VL 理解结果（与浏览器侧 Understanding 同形）。 */
type Understanding = {
  scene: string;
  characters: { name: string; guess?: string }[];
  dialogues: string[];
  themes: string[];
};

/** 容错解析 VL 返回的 JSON：去 ```json 栅栏、正则取首个对象、字段容错。失败返回 null。 */
function parseUnderstanding(raw: string): Understanding | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]) as Partial<Understanding>;
    const scene = (obj.scene ?? "").toString().trim();
    if (!scene) return null;
    const characters = Array.isArray(obj.characters)
      ? obj.characters.flatMap((c) => {
          if (!c || typeof c !== "object") return [];
          const name = String((c as { name?: unknown }).name ?? "").trim();
          if (!name) return [];
          const g = (c as { guess?: unknown }).guess;
          return [{ name, guess: g ? String(g).trim() : undefined }];
        })
      : [];
    const dialogues = Array.isArray(obj.dialogues) ? obj.dialogues.map((d) => String(d).trim()).filter(Boolean) : [];
    const themes = Array.isArray(obj.themes) ? obj.themes.map((t) => String(t).trim()).filter(Boolean) : [];
    return { scene, characters, dialogues, themes };
  } catch {
    return null;
  }
}

/**
 * 视频理解服务端代理：浏览器 POST 抽好的 base64 帧集 → 本 Worker 调通义千问 VL
 * 多模态模型识场景/人物/对白/主题，只输出 JSON。API Key 只在本 Worker 持有、不下发浏览器。
 * 未配置 key / 账号未开通 VL / 上游异常 / 解析失败时返回非 ok，浏览器侧降级为「贴文本」。
 * 抽帧图集不落盘、推理完即弃（浏览器侧保证，Worker 不存储）。
 */
async function handleUnderstand(request: Request, env: Env): Promise<Response> {
  const cors = corsBase();
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return Response.json({ ok: false, reason: "method" }, { status: 405, headers: cors });

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) return Response.json({ ok: false, reason: "no-key" }, { status: 503, headers: cors });

  let payload: UnderstandPayload;
  try {
    payload = (await request.json()) as UnderstandPayload;
  } catch {
    return Response.json({ ok: false, reason: "bad-json" }, { status: 400, headers: cors });
  }
  const frames = Array.isArray(payload?.frames) ? payload.frames : [];
  if (frames.length === 0) return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });
  if (frames.length > 8) return Response.json({ ok: false, reason: "too-many-frames" }, { status: 400, headers: cors });
  // 单帧过大拒绝（限 base64 ≤ 1.5MB，控 token 成本与请求体大小）
  for (const f of frames) {
    if (typeof f !== "string" || !f.startsWith("data:image/") || f.length > 1_500_000) {
      return Response.json({ ok: false, reason: "bad-args" }, { status: 400, headers: cors });
    }
  }

  const sys =
    "你是影视片段理解助手。用户呈上一段古风/历史影视抽出的若干关键帧，请综观识其场景、人物、对白与主题。" +
    "人物若不能确识则标 guess 推测；对白从画面字幕或情境推断，勿杜撰大段台词；主题词用先秦概念（如非攻、连横、仁、礼、道、兼爱、奇正）。" +
    '只输出 JSON，不加引号或前后缀，形如：{"scene":"≤40字场景概述","characters":[{"name":"人物名","guess":"推测依据?"}],"dialogues":["对白片段"],"themes":["主题词"]}';

  const userContent: ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[] = [
    { type: "text", text: payload.hint?.trim() ? `提示：${payload.hint.trim()}` : "请识此段影音。" },
    ...frames.map((url) => ({ type: "image_url" as const, image_url: { url } })),
  ];

  const messages = [
    { role: "system" as const, content: sys },
    { role: "user" as const, content: userContent },
  ];

  try {
    const r = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: env.QWEN_VL_MODEL || DEFAULT_VL_MODEL, messages, temperature: 0.2, enable_thinking: false, max_tokens: 512 }),
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 500);
      return Response.json({ ok: false, reason: "upstream", status: r.status, detail }, { status: 502, headers: cors });
    }
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = parseUnderstanding(raw);
    if (!parsed) return Response.json({ ok: false, reason: "parse", raw: raw.slice(0, 300) }, { status: 502, headers: cors });
    return Response.json({ ok: true, understanding: parsed }, { headers: cors });
  } catch (e) {
    return Response.json({ ok: false, reason: "fetch-error", detail: String(e) }, { status: 502, headers: cors });
  }
}

/**
 * 自托管（`vinext start`）时跑的是 Node 版生产服务器，它以 `fetch(request, undefined, ctx)`
 * 调本入口 —— 没有 Cloudflare 的 bindings。故此处退回 `process.env`：
 * key 依旧只在服务端（环境变量里），浏览器仍旧只认 /api/*。
 */
function resolveEnv(env: Env | undefined): Env {
  if (env) return env;
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return (p?.env ?? {}) as unknown as Env;
}

/**
 * 子路径部署前缀，与 `next.config.ts` 的 `basePath`、`app/world/assetPath.ts` 的
 * `asset()/api()` 读同一个变量。构建时 vinext 会把 `NEXT_PUBLIC_*` 内联成字面量，
 * 自托管下也可由进程环境给；真 Cloudflare 运行时没有 `process`，故同样安全取值。
 */
function basePathOf(): string {
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return p?.env?.NEXT_PUBLIC_BASE_PATH ?? "";
}

const worker = {
  async fetch(request: Request, rawEnv: Env | undefined, ctx: ExecutionContext): Promise<Response> {
    const env = resolveEnv(rawEnv);
    const url = new URL(request.url);

    // 子路径部署下浏览器请求的是 /zhuzi-world-v1/api/*（见 app/world/assetPath.ts 的
    // api()）；这里先把前缀剥掉再匹配，根路径部署时 BASE 为空串，等同不剥。
    // 注意只剥给下面的 /api/* 比对用，交回 handler.fetch 的仍是原 request——
    // vinext 的路由自己认 basePath，剥过头反而找不到页面。
    const BASE = basePathOf();
    const route =
      BASE && (url.pathname === BASE || url.pathname.startsWith(`${BASE}/`))
        ? url.pathname.slice(BASE.length) || "/"
        : url.pathname;

    // 图片优化要 ASSETS/IMAGES 两个 binding，自托管下没有，交回通用 handler
    if (route === "/_vinext/image" && env.ASSETS && env.IMAGES) {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    // 右键"译为白话"：浏览器 POST 人物发言 → 本 Worker 调 Qwen 译为现代白话，key 不出服务端
    if (route === "/api/translate") return handleTranslate(request, env);

    // 一致性校验 Agent：浏览器 POST 人物发言 → 本 Worker 调 Qwen 判定是否违其学说或时代背景，key 不出服务端
    if (route === "/api/verify") return handleVerify(request, env);

    // 一致性自动修订：仅按校验理由最小改写；浏览器随后须再次送 /api/verify 复核
    if (route === "/api/repair") return handleRepair(request, env);

    // 人物 Agent 对谈：浏览器 POST → 本 Worker 调阿里云百炼 Qwen，key 不出服务端
    if (route === "/api/chat") return handleChat(request, env);

    // 历史事件的中立问题生成：只读事实，返回三条讨论入口，不带人物立场
    if (route === "/api/event-questions") return handleEventQuestions(request, env);

    // 语义向量：浏览器 POST 查询文本 → 本 Worker 调 DashScope 向量模型返回向量，key 不出服务端
    if (route === "/api/embed") return handleEmbed(request, env);

    // 古风配音：浏览器 GET → 本 Worker 调 DashScope CosyVoice 合成并透传音频流，key 不出服务端
    if (route === "/api/tts") return handleTts(request, env);

    // AI 视频（按需「生成视频」）：文生图关键帧 → 图生视频，异步任务轮询；key 不出服务端
    if (route === "/api/video/img") return handleVideoImg(request, env);
    if (route === "/api/video/i2v") return handleVideoI2V(request, env);
    if (route === "/api/video/poll") return handleVideoPoll(request, env);

    // 视频理解（呈影音请诸子点评）：浏览器抽帧 → 本 Worker 调 qwen-vl 多模态识场景/人物/对白/主题，key 不出服务端
    if (route === "/api/understand") return handleUnderstand(request, env);

    return handler.fetch(request, rawEnv as Env, ctx);
  },
};

export default worker;
