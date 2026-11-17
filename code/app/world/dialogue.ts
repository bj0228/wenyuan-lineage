import { fallbackFor, retrieve, retrieveIn, embedQuery, type Retrieved } from "./canon";
import { loadBookMeta, loadBookWorks, loadOwnWorks } from "./canonSource";
import { citationSourcesFor, SIKU_REL, type SikuEdge } from "./sikuLineage";
import { LVBUWEI, scholarMap } from "./characters";
import type { Presence } from "./schedule";
import { regionMap } from "./regions";
import { recallMemory } from "./memory";
import { userAffOf, pairAffOf } from "./affinity";
import { fewShotOf } from "./fewshot";
import { api } from "./assetPath";
import {
  buildKnowledgeBoundary,
  isBookTemporallyReachable,
  rankBooksByRegionalAffinity,
  type KnowledgeMode,
} from "./knowledgeBoundary";

/** 判断响应是否为 SSE 流（Worker 成功时以 text/event-stream 透传 DashScope 的流）。 */
function isStream(r: Response): boolean {
  return (r.headers.get("content-type") ?? "").includes("text/event-stream");
}

/**
 * 读取 OpenAI/DashScope 兼容的 SSE 流：逐 token 调 onDelta，返回累积全文。
 * 每行形如 `data: {choices:[{delta:{content}}]}`，末行 `data: [DONE]`。
 * 流中断时返回已收到的部分，不抛错（由调用方决定是否回退模板）。
 */
async function readSSE(response: Response, onDelta: (chunk: string) => void): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        const data = line.startsWith("data:") ? line.slice(5).trim() : "";
        if (!data) continue;
        if (data === "[DONE]") return full;
        try {
          const obj = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
          const delta = obj.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            onDelta(delta);
          }
        } catch {
          /* 心跳行或非 JSON，跳过 */
        }
      }
    }
  } catch {
    /* 流中断，返回已收到的部分 */
  }
  return full;
}

export type Answer = {
  text: string;
  citations: Retrieved[];
  /** 引用之外的推演部分，界面上需要标注 */
  inferred: boolean;
  /** 生成端声称引用、但未能和检索证据绑定的情形；不得伪装成已核验引文。 */
  citationIssues?: string[];
};

/** 文脉提问走专用检索，不再和普通立场题共用“本家典籍优先”的排序。 */
export function isLineageQuestion(question: string): boolean {
  return /(文脉|承学|传注|取材|非难|并称|相续|依托|关系类型|知识来源|思想来源)/.test(question);
}

function normalizedEvidence(text: string): string {
  return text.replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase();
}

function hasExactEvidenceOverlap(answer: string, source: string, width = 7): boolean {
  const a = normalizedEvidence(answer);
  const s = normalizedEvidence(source);
  if (s.length < width) return s.length >= 3 && a.includes(s);
  for (let i = 0; i <= s.length - width; i += Math.max(1, Math.floor(width / 2))) {
    if (a.includes(s.slice(i, i + width))) return true;
  }
  return false;
}

/**
 * 把模型输出重新锁回检索证据：只有显式写出 [E#]（或准确写出书篇）的条目才进入
 * UI 的“文本依据”。这样模型凭参数记忆另引一句时，不会再拿检索到的另一章冒充出处。
 */
export function bindAnswerEvidence(rawText: string, hits: Retrieved[]): Answer {
  const ids = new Set<string>();
  for (const m of rawText.matchAll(/\[E(\d+)\]/gi)) ids.add(`E${m[1]}`);
  const labelled = hits.map((hit, i) => ({ ...hit, evidenceId: hit.evidenceId ?? `E${i + 1}` }));
  if (ids.size === 0) {
    for (const hit of labelled) {
      const full = `《${hit.book}·${hit.chapter}》`;
      if (rawText.includes(full) || (rawText.includes(`《${hit.book}》`) && rawText.includes(hit.chapter))) ids.add(hit.evidenceId!);
    }
  }
  const citations = labelled
    .filter((hit) => ids.has(hit.evidenceId!))
    .map((hit) => ({
      ...hit,
      evidenceBinding: hasExactEvidenceOverlap(rawText, hit.en ?? hit.text) ? "exact" as const : "support" as const,
    }));
  const cleaned = rawText.replace(/\s*\[E\d+\]/gi, "").replace(/[ \t]+\n/g, "\n").trim();
  const namedSource = /《[^》]{1,40}》/.test(cleaned);
  const citationIssues: string[] = [];
  if (namedSource && citations.length === 0) citationIssues.push("回答写出了文献出处，但没有绑定到本轮检索证据");
  for (const citation of citations) {
    if (citation.evidenceBinding !== "exact" && /[「“][^」”]{4,}[」”]/.test(cleaned)) {
      citationIssues.push(`${citation.evidenceId} 的引文未能在《${citation.book}·${citation.chapter}》中逐字核对`);
    }
  }
  return { text: cleaned, citations, inferred: true, citationIssues };
}

/**
 * 历史事件不先让某位人物定题，而是把事实材料交给一个中性的提问器。
 * 该接口只返回三个可讨论的问题，不附角色、立场或典据；失效时由调用界面给出
 * 本地备选，人物评议仍可照常进行。
 */
export async function generateEventQuestions(facts: string, language: "zh" | "en" = "zh"): Promise<string[]> {
  try {
    const r = await fetch(api("/api/event-questions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts, language }),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { ok?: boolean; questions?: unknown };
    if (!data.ok || !Array.isArray(data.questions)) return [];
    return data.questions
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.replace(/^\s*(?:\d+[.、)）]|[-•])\s*/, "").trim())
      .filter((q) => q.length >= 6 && q.length <= 90)
      .slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * 某人所属世界。检索必按此限域——悟空不该引《论语》，孔子也不该引《西游》。
 * 诸子无此字段，退回 `zhanguo`，故行为与旧版相同。
 */
function worldIdOf(scholarId: string): string {
  const persona = scholarMap[scholarId];
  return persona?.retrievalWorldId ?? persona?.worldId ?? "zhanguo";
}

/**
 * 只在本人本家的典籍中检索，确保发言与引用皆出自自家学说、不杂他家之言。
 * 本人无相关条目时，退回其代表言论（仍属本家）。
 */
function gather(scholarId: string, query: string, limit: number) {
  const worldId = worldIdOf(scholarId);
  const own = retrieve(query, { scholarId, onlyOwner: true, limit, worldId });
  if (own.length) return own.slice(0, limit);
  const byTheme = retrieve(scholarMap[scholarId].themes.join(" "), { scholarId, onlyOwner: true, limit, worldId });
  if (byTheme.length) return byTheme.slice(0, limit);
  return fallbackFor(scholarId, limit).slice(0, limit);
}

/**
 * gather 的异步版：先取查询向量（embedQuery）与此子自家那部书的全文段落，
 * 再走混合语义检索。无向量库或 embed 失败时退回纯关键词（gather 行为）。供 LLM 路径使用。
 *
 * 自家全文（`loadOwnWorks`）是四库那边接过来的：手写的 752 条是选本，孔子能引的
 * 本来只有我们替他挑的那几十句；接上《论语》全文，他便能引书里的任何一句。
 * 取不到就是空数组，检索退回选本，对谈不受影响——故此处不 try/catch，也不等它报错。
 */
const LINEAGE_USE: Record<SikuEdge["type"], string> = {
  传: "所释原典",
  承: "承学来源",
  采: "取材来源",
  驳: "非难对象",
  并: "并列参照",
  续: "所续前书",
  托: "依托辨析",
};

async function gatherAsync(
  scholarId: string,
  query: string,
  limit: number,
  includeLineage = true,
) {
  const scholar = scholarMap[scholarId];
  const [qVec, extra] = await Promise.all([embedQuery(query), loadOwnWorks(scholarId)]);
  const worldId = worldIdOf(scholarId);
  const own = retrieve(query, { scholarId, onlyOwner: true, limit, worldId, extra }, qVec);

  // 只有诸子世界、且人物确有本家全文映射时才开放跨书引用。关系必须是有向的
  // source→own work；反向、并称、依托均不放行。每次最多装入八部源书，避免一次问答
  // 因关系稠密而拉取过多正文。
  let related: Retrieved[] = [];
  const lineageIntent = isLineageQuestion(query);
  if (includeLineage && worldId === "zhanguo" && extra.length) {
    const ownWorkIds = new Set(extra.map((p) => p.workId).filter((id): id is string => !!id));
    const candidateEdges = citationSourcesFor(ownWorkIds);
    const withMeta = await Promise.all(candidateEdges.map(async (edge) => ({
      edge,
      edgeFrom: edge.from,
      meta: await loadBookMeta(edge.from),
    })));
    // 文脉边已是硬授权；这里再加时间闸门。地域关联只排序，不会把无关系的书放进来。
    const reachable = withMeta.filter(({ meta }) => isBookTemporallyReachable(scholar, meta));
    const edges = (await rankBooksByRegionalAffinity(scholar, reachable)).slice(0, 8).map((x) => x.edge);
    if (edges.length) {
      const loaded = await Promise.all(edges.map(async (edge) => ({ edge, passages: await loadBookWorks(edge.from) })));
      // 新补切的书在关系图中仍用稳定的 `目:书名`，而证据片段的 workId 是实际
      // 分片 id；按已载片段回填映射，二者不同也能保留关系标签与审定依据。
      const edgeByWork = new Map<string, SikuEdge>();
      for (const { edge, passages } of loaded) {
        for (const passage of passages) if (passage.workId) edgeByWork.set(passage.workId, edge);
      }
      const pool = loaded.flatMap(({ passages }) => passages);
      // 普通问题按题意找关联书片段；文脉问题还把关系判据织入检索，使“请说明承学关系”
      // 不会因没有复述某句原文而把真正的源书排到池外。
      const lineageQuery = lineageIntent
        ? `${query} ${loaded.map(({ edge }) => `${SIKU_REL[edge.type].label} ${edge.note}`).join(" ")}`
        : query;
      related = retrieveIn(lineageQuery, pool, { limit: Math.max(2, limit), worldId }, qVec).map((hit) => {
        const edge = hit.workId ? edgeByWork.get(hit.workId) : undefined;
        if (!edge) return hit;
        return {
          ...hit,
          lineage: {
            type: edge.type,
            label: SIKU_REL[edge.type].label,
            note: edge.note,
            from: edge.from,
            to: edge.to,
            use: LINEAGE_USE[edge.type],
          },
        };
      });
    }
  }

  if (own.length) {
    // 文脉题把“源书 + 本家书”并列为必要证据；普通问题仍以本家证据居主位。
    return related.length && limit > 1
      ? lineageIntent
        ? [own[0], related[0], ...own.slice(1, Math.max(1, limit - 1))].slice(0, limit)
        : [...own.slice(0, limit - 1), related[0]]
      : own.slice(0, limit);
  }
  const byTheme = retrieve(
    scholarMap[scholarId].themes.join(" "),
    { scholarId, onlyOwner: true, limit, worldId, extra },
    qVec,
  );
  if (byTheme.length) {
    return related.length && limit > 1
      ? [...byTheme.slice(0, limit - 1), related[0]]
      : byTheme.slice(0, limit);
  }
  if (related.length) return related.slice(0, 1);
  return fallbackFor(scholarId, limit).slice(0, limit);
}

function canonPayload(hit: Retrieved, index: number) {
  return {
    evidenceId: `E${index + 1}`,
    book: hit.book,
    chapter: hit.chapter,
    text: hit.en ?? hit.text,
    gloss: hit.gloss,
    relation: hit.lineage
      ? { label: hit.lineage.label, use: hit.lineage.use, note: hit.lineage.note }
      : undefined,
  };
}

/** 构造 payload.memory：召回此子与议题最相关的记忆要点 */
function memoryPayload(scholarId: string, focus: string) {
  const mem = recallMemory(scholarId, focus, 3);
  return mem.length ? mem.map((m) => ({ topic: m.topic, excerpt: m.excerpt })) : undefined;
}

/** 构造 payload.affinity：用户↔此子 + 此子↔同席/对谈者 */
function affinityPayload(scholarId: string, peerIds: string[]) {
  const peers = peerIds
    .filter((id) => id !== scholarId && scholarMap[id])
    .map((id) => ({ id, name: scholarMap[id].name, level: pairAffOf(scholarId, id) }));
  return { user: userAffOf(scholarId), peers: peers.length ? peers : undefined };
}

/** 引他家之言时改换称谓，不使人物把别派原文说成自家话。
 *  withSource=false 时不附 （《书·章）》 出处，改由辩论证据面板点击查看。 */
function quoteOf(scholarId: string, hit: Retrieved, lead: string, withSource = true) {
  const source = withSource ? `（《${hit.book}·${hit.chapter}》）` : "";
  if (hit.owner === scholarId) return `${lead}：“${hit.text}”${source}`;
  const other = hit.owner ? `${scholarMap[hit.owner].name}有言` : "古语有之";
  return `${other}：“${hit.text}”${source}`;
}

/**
 * 以检索到的典籍片段为骨架组织人物回答：
 * 先立场、再引典据（含出处）、最后落回该人物的行文口吻。
 */
export function composeAnswer(scholarId: string, question: string, presence?: Presence): Answer {
  const scholar = scholarMap[scholarId];
  const hits = gather(scholarId, question, 2);
  // 自家典据置前，他家之言作为对照
  hits.sort((a, b) => Number(b.owner === scholarId) - Number(a.owner === scholarId));

  const where = presence ? `（${regionMap[presence.region].name}，${presence.action.replace("正在", "")}）` : "";
  const quotes = hits.map((h, i) => quoteOf(scholarId, h, i === 0 ? scholar.voice.bridge : "又")).join("");
  const gloss = hits[0] ? `——${hits[0].gloss}` : "";

  return { text: `${where}${scholar.voice.opening}${quotes}${gloss}${scholar.voice.closing}`, citations: hits, inferred: true };
}

/**
 * 接入大模型的 1v1 对谈发言：把人物档案、典籍检索、当前处境、对话史打包发往
 * 服务端 `/api/chat`（Worker 持有模型 Key，不下发浏览器），由 Qwen 生成先秦诸子口吻的回答。
 * 未配置 Key、上游或网络异常时，静默回退到本地 `composeAnswer`，对谈不中断。
 */
export async function composeAnswerLLM(
  scholarId: string,
  question: string,
  presence: Presence | undefined,
  history: { mine: boolean; text: string }[],
  onDelta?: (chunk: string) => void,
  /** 奉贽之礼（如束脩）：有则拼进 question 上下文，使诸子认贽、并可命中相关本家典籍（如孔子·述而·束脩） */
  gift?: { id: string; name: string },
  /** 有真实在场处境时默认历史模式；事件、母题、跨书评议可显式使用比较模式。 */
  mode: KnowledgeMode = presence ? "historical" : "comparative",
): Promise<Answer> {
  const scholar = scholarMap[scholarId];
  // 奉贽时把贽礼拼进问句：一来让 LLM 之以「客奉贽礼求教」之境作答，二来使 gather 检索命中贽相关本家条目
  const framed = gift ? `（客奉${gift.name}为贽礼，诚心求教。）${question}` : question;
  const hits = await gatherAsync(scholarId, framed, 3);
  const lineageRequested = isLineageQuestion(framed);
  const knowledgeBoundary = await buildKnowledgeBoundary(scholar, mode);
  const payload = {
    scholar: { name: scholar.name, courtesy: scholar.courtesy, school: scholar.school, intro: scholar.intro, kind: scholar.kind, profileTier: scholar.profileTier, representativeWorks: scholar.representativeWorks },
    question: framed,
    fewShot: fewShotOf(scholarId),
    presence: presence ? { region: regionMap[presence.region].name, action: presence.action } : undefined,
    history: history.slice(-6),
    // 西方一席给西文原句（`en`）：给中文译文，答出来的歌德是译本里的歌德
    canon: hits.map(canonPayload),
    lineageRequest: lineageRequested
      ? { requested: true, reviewedAvailable: hits.some((hit) => !!hit.lineage) }
      : undefined,
    memory: memoryPayload(scholarId, framed),
    affinity: affinityPayload(scholarId, []),
    knowledgeBoundary,
  };
  try {
    const r = await fetch(api("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok && isStream(r)) {
      const text = await readSSE(r, onDelta ?? (() => {}));
      if (text) return bindAnswerEvidence(text, hits);
    } else if (r.ok) {
      const data = (await r.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) return bindAnswerEvidence(data.text, hits);
    }
  } catch {
    /* 网络异常，回退到模板 */
  }
  return composeAnswer(scholarId, question, presence);
}

/** 辩论中的一轮发言：会回应上一位的观点。 */
export function composeDebateTurn(scholarId: string, topic: string, previousSpeaker?: string): Answer {
  const scholar = scholarMap[scholarId];
  const hits = gather(scholarId, topic, 1);
  const rebut = previousSpeaker ? `${previousSpeaker}之说，我未敢尽从。` : "";
  const quote = hits[0] ? quoteOf(scholarId, hits[0], scholar.voice.bridge) : "";
  return { text: `${rebut}${scholar.voice.opening}${quote}`, citations: hits, inferred: true };
}

/** 圆桌辩论的四轮：陈述立本位、反驳驳上家、质询以典设问、总结收束。 */
export type Round = "陈述" | "反驳" | "质询" | "总结";
export const DEBATE_ROUNDS: Round[] = ["陈述", "反驳", "质询", "总结"];

/**
 * 圆桌辩论的一轮发言：按四类轮次套用不同文辞骨架。`interjection`（轮间插话）
 * 若有则覆盖 `topic` 作为检索焦点，使诸子回应用户所问；留空则沿用原议题。
 */
export function composeDebateRound(
  scholarId: string,
  topic: string,
  round: Round,
  opts?: { previousSpeaker?: string; interjection?: string },
): Answer {
  const scholar = scholarMap[scholarId];
  const focus = opts?.interjection?.trim() || topic;
  const hits = gather(scholarId, focus, 1);
  const hit = hits[0];
  // 辩论发言正文不附出处，改由点击该段发言在证据面板查看
  const quote = hit ? quoteOf(scholarId, hit, scholar.voice.bridge, false) : "";
  const gloss = hit ? `——${hit.gloss}` : "";
  const prev = opts?.previousSpeaker;

  let text: string;
  switch (round) {
    case "陈述":
      // 立本位：开篇 + 引典 + 白话
      text = `${scholar.voice.opening}${quote}${gloss}`;
      break;
    case "反驳":
      // 先驳上家，再立己说
      text = `${prev ? `${prev}之说，我未敢尽从。` : ""}${scholar.voice.opening}${quote}`;
      break;
    case "质询":
      // 以典设问，诘难上家；无典则诘其何以自洽
      text = `${scholar.voice.opening}${prev ? `敢问${prev}：` : "敢问："}${quote ? `${quote}，此理可通乎？` : "此理何以自洽？"}`;
      break;
    case "总结":
      // 收束：要之 + 引典 + 结语
      text = `要之，${quote || scholar.voice.opening}${scholar.voice.closing}`;
      break;
  }
  return { text, citations: hits, inferred: true };
}

/**
 * 接入大模型的圆桌辩论一轮发言：以议题/轮次/上家/前序发言史构造上下文，
 * 经服务端 `/api/chat`（辩论模式）由 Qwen 生成先秦诸子口吻的争鸣发言。
 * 未配置 Key、上游或网络异常时，静默回退到本地 `composeDebateRound`，辩论不中断。
 */
export async function composeDebateRoundLLM(
  scholarId: string,
  focus: string,
  round: Round,
  opts?: { previousSpeaker?: string },
  priorTurns: { scholarId: string; text: string }[] = [],
  onDelta?: (chunk: string) => void,
): Promise<Answer> {
  const scholar = scholarMap[scholarId];
  const hits = await gatherAsync(scholarId, focus, 2);
  const knowledgeBoundary = await buildKnowledgeBoundary(scholar, "comparative");
  // 前序发言作为对话史（带人物署名），供模型承接上家、避免重复论点
  const history = priorTurns.slice(-8).map((t) => ({
    mine: false,
    text: `${scholarMap[t.scholarId]?.name ?? "诸子"}：${t.text}`,
  }));
  const peerIds = priorTurns.slice(-8).map((t) => t.scholarId);
  const payload = {
    scholar: { name: scholar.name, courtesy: scholar.courtesy, school: scholar.school, intro: scholar.intro, kind: scholar.kind },
    question: focus,
    fewShot: fewShotOf(scholarId),
    presence: { region: "圆桌辩论", action: "围坐争鸣" },
    history,
    canon: hits.map(canonPayload),
    lineageRequest: isLineageQuestion(focus) ? { requested: true, reviewedAvailable: hits.some((hit) => !!hit.lineage) } : undefined,
    debate: { round, previousSpeaker: opts?.previousSpeaker, topic: focus },
    memory: memoryPayload(scholarId, focus),
    affinity: affinityPayload(scholarId, peerIds),
    knowledgeBoundary,
  };
  try {
    const r = await fetch(api("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok && isStream(r)) {
      const text = await readSSE(r, onDelta ?? (() => {}));
      if (text) return bindAnswerEvidence(text, hits);
    } else if (r.ok) {
      const data = (await r.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) return bindAnswerEvidence(data.text, hits);
    }
  } catch {
    /* 网络异常，回退到模板 */
  }
  return composeDebateRound(scholarId, focus, round, { previousSpeaker: opts?.previousSpeaker });
}

/**
 * 接入大模型的双贤对谈·回应轮：以议题/对方/前序发言构造上下文，
 * 经服务端 `/api/chat`（双贤对谈模式）由 Qwen 从自家立场回应对方所论。
 * 未配置 Key、上游或网络异常时，静默回退到本地 `composeDebateTurn`，对谈不中断。
 */
export async function composeDialogueTurnLLM(
  scholarId: string,
  topic: string,
  opts?: { previousSpeaker?: string },
  priorTurns: { scholarId: string; text: string }[] = [],
  onDelta?: (chunk: string) => void,
): Promise<Answer> {
  const scholar = scholarMap[scholarId];
  const hits = await gatherAsync(scholarId, topic, 2);
  const knowledgeBoundary = await buildKnowledgeBoundary(scholar, "comparative");
  // 前序发言作为对话史（带人物署名），供模型承接对方所论、避免重复
  const history = priorTurns.slice(-8).map((t) => ({
    mine: false,
    text: `${scholarMap[t.scholarId]?.name ?? "诸子"}：${t.text}`,
  }));
  const peerIds = priorTurns.slice(-8).map((t) => t.scholarId);
  const payload = {
    scholar: { name: scholar.name, courtesy: scholar.courtesy, school: scholar.school, intro: scholar.intro, kind: scholar.kind },
    question: topic,
    fewShot: fewShotOf(scholarId),
    presence: { region: "双贤对谈", action: "围坐对谈" },
    history,
    canon: hits.map(canonPayload),
    lineageRequest: isLineageQuestion(topic) ? { requested: true, reviewedAvailable: hits.some((hit) => !!hit.lineage) } : undefined,
    dialogue: { topic, previousSpeaker: opts?.previousSpeaker },
    memory: memoryPayload(scholarId, topic),
    affinity: affinityPayload(scholarId, peerIds),
    knowledgeBoundary,
  };
  try {
    const r = await fetch(api("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok && isStream(r)) {
      const text = await readSSE(r, onDelta ?? (() => {}));
      if (text) return bindAnswerEvidence(text, hits);
    } else if (r.ok) {
      const data = (await r.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) return bindAnswerEvidence(data.text, hits);
    }
  } catch {
    /* 网络异常，回退到模板 */
  }
  return composeDebateTurn(scholarId, topic, opts?.previousSpeaker);
}

/**
 * 接入大模型的辩论主持人轮间追问/收束：以吕不韦（杂家、兼收并蓄）人格综观前文，
 * 经服务端 `/api/chat`（主持人模式）由 Qwen 发一记追问（进反驳/质询轮）或收束（进总结轮），
 * 成为下一轮诸子作答的焦点。主持人不引典据、不下定论，故此处不 `gather` 典籍。
 * 未配置 Key、上游或网络异常时，静默回退到本地模板句，辩论不中断。
 */
export async function composeModeratorInterjectionLLM(
  topic: string,
  prevRound: Round,
  nextRound: Round,
  turns: { scholarId: string; text: string }[],
  onDelta?: (chunk: string) => void,
): Promise<string> {
  const isRecap = nextRound === "总结";
  // 前序发言作为对话史（带人物署名），供主持人综观前文
  const history = turns.slice(-8).map((t) => ({
    mine: false,
    text: `${scholarMap[t.scholarId]?.name ?? "诸子"}：${t.text}`,
  }));
  const payload = {
    scholar: { name: LVBUWEI.name, school: LVBUWEI.school, intro: LVBUWEI.intro },
    question: `据上述${prevRound}轮诸子所论，发一记${isRecap ? "收束" : "追问"}，为进入${nextRound}轮立一焦点。`,
    presence: { region: "招贤馆", action: "主持百家争鸣" },
    history,
    moderator: { topic, prevRound, nextRound },
  };
  try {
    const r = await fetch(api("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok && isStream(r)) {
      const text = await readSSE(r, onDelta ?? (() => {}));
      if (text) return text;
    } else if (r.ok) {
      const data = (await r.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) return data.text;
    }
  } catch {
    /* 网络异常，回退到模板 */
  }
  return isRecap
    ? `诸君所辩，各有其当。请各以一言收束本场，${LVBUWEI.name}姑为撮述。`
    : `诸君所言皆有其理，然${nextRound === "反驳" ? "未允之处" : "犹有可疑"}安在？请就此${nextRound}。`;
}

/**
 * 右键"译为白话"：把先秦诸子口吻的发言送服务端 `/api/translate`，由 Qwen 译为现代白话文。
 * 无 Key 或上游/网络异常时返回 null，由界面提示"未能译出"。
 *
 * `source` 是典籍出处（如「《西游记·第二十七回》」）。给了它，服务端便按"典籍正文"
 * 去译而非"某子之发言"——正文夹叙夹议，当作一人之语译会把叙述句也译成第一人称。
 */
export async function translateToVernacular(
  text: string,
  scholarId?: string,
  onDelta?: (chunk: string) => void,
  source?: string,
  /**
   * "en"：英译中。西方一席的评议是英文，其下要附一行中译，用的是同一条路。
   * "zh2en"：中译英。英文模式下诸子仍以中文作答（其言自中文典籍检出，换语生成便失其据），
   * 译文附于发言之下，走的也是这一条路。
   */
  lang?: "en" | "zh2en" | "enChapter",
): Promise<string | null> {
  const scholar = scholarId ? scholarMap[scholarId] : undefined;
  const payload = {
    text,
    scholar: scholar ? { name: scholar.name, school: scholar.school } : undefined,
    source,
    lang,
  };
  try {
    const r = await fetch(api("/api/translate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok && isStream(r)) {
      const out = await readSSE(r, onDelta ?? (() => {}));
      if (out) return out;
    } else if (r.ok) {
      const data = (await r.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) return data.text;
    }
  } catch {
    /* 网络异常，返回 null */
  }
  return null;
}

/** 一致性校验的三档判定 */
export const VERDICTS = ["合规", "存疑", "矛盾"] as const;
export type Verdict = (typeof VERDICTS)[number];

/** 一致性徽记的样式类与字标（合规✓／存疑△／矛盾✕）。 */
export function verdictBadge(v?: Verdict): { cls: string; glyph: string } | null {
  if (!v) return null;
  switch (v) {
    case "合规":
      return { cls: "ok", glyph: "✓" };
    case "存疑":
      return { cls: "warn", glyph: "△" };
    case "矛盾":
      return { cls: "bad", glyph: "✕" };
  }
}

/**
 * 一致性徽记悬停说明：该档判定的含义（与具体理由拼接显示）。
 *
 * 文案按人格之属分三套，与 worker 三档提示词一一对应——立论者审学说，叙事人物
 * 审性情（悟空没有学说可违，但有性情可失），西贤审其学识与作品。不传 `kind`
 * 即立论者那套，故诸子旧界面不必跟着改。
 */
export function verdictExplain(v: Verdict, kind?: string): string {
  if (kind === "figure") {
    switch (v) {
      case "合规":
        return "合规：语气、脾性、处事之道皆与此人相合，所述经历不与原著相违。";
      case "存疑":
        return "存疑：略显文气或过于讲理，尚不失其人。";
      case "矛盾":
        return "矛盾：说成了一个讲道理的学者（援引典籍、以学派立论），或性情与原著明显相悖，或编造其未曾有过的经历。";
    }
  }
  if (kind === "west") {
    switch (v) {
      case "合规":
        return "合规：所言本于其自家学识与作品，思路与关切仍是其人的；论他书他题亦以自家学理回应。";
      case "存疑":
        return "存疑：略显泛论或游离其本业，尚可两解。";
      case "矛盾":
        return "矛盾：离其作品与学识甚远，或混入先秦概念与中式学理而说成本家之言，或说成了另一个人。";
    }
  }
  switch (v) {
    case "合规":
      return "合规：与本家学说一致、口吻得体；纵论现代议题亦能以先秦学理回应。";
    case "存疑":
      return "存疑：略有出入或口吻过现代而尚可两解，未根本相悖。";
    case "矛盾":
      return "矛盾：明显违背其核心主张，或用先秦不可能有的概念框架，或误引他家为自家。";
  }
}

/** 一次校验之所得：三档判定、一句理由，并记明是谁判的、这一判算不算外证。 */
export type VerifyResult = {
  verdict: Verdict;
  note: string;
  /** 下判的模型 id（如 deepseek-v4.1-flash） */
  model?: string;
  /** 判词是否出自与发言生成异源的模型。false＝异源不可用，退回本家自审 */
  crossModel?: boolean;
};

export type VerifiedAnswer = VerifyResult & {
  /** 经过修订闭环后可供界面采用的最终文本。 */
  text: string;
  /** 是否至少发生过一次模型修订（含最终谨慎答复）。 */
  repaired: boolean;
  /** 模型实际修订次数；本地谨慎答复不计入。 */
  repairAttempts: number;
  /** 多次修订仍未通过，最终改用不越界的谨慎答复。 */
  blocked?: boolean;
  /** 修订后重新绑定的证据，调用方可据此替换修订前的引用卡。 */
  citations?: Retrieved[];
  citationIssues?: string[];
};

type ConsistencyPayload = {
  scholar: {
    name: string;
    courtesy?: string;
    school: string;
    intro?: string;
    kind?: "thinker" | "figure" | "west";
    themes?: string[];
    quote?: string;
  };
  text: string;
  topic?: string;
  canon: { evidenceId?: string; book: string; chapter: string; text: string; gloss: string; relation?: { label: string; use: string; note: string } }[];
};

async function consistencyPayload(scholarId: string, text: string, topic?: string, evidence?: Retrieved[]): Promise<ConsistencyPayload | null> {
  const scholar = scholarMap[scholarId];
  if (!scholar) return null;
  const hits = evidence?.length ? evidence : await gatherAsync(scholarId, topic || text, 3, false);
  return {
    scholar: {
      name: scholar.name,
      courtesy: scholar.courtesy,
      school: scholar.school,
      intro: scholar.intro,
      kind: scholar.kind,
      themes: scholar.themes,
      quote: scholar.quote,
    },
    text,
    topic,
    canon: hits.map((h, i) => ({
      evidenceId: h.evidenceId ?? `E${i + 1}`,
      book: h.book,
      chapter: h.chapter,
      text: h.en ?? h.text,
      gloss: h.gloss,
      relation: h.lineage ? { label: h.lineage.label, use: h.lineage.use, note: h.lineage.note } : undefined,
    })),
  };
}

function payloadHits(payload: ConsistencyPayload): Retrieved[] {
  return payload.canon.map((c, i) => ({
    id: c.evidenceId ?? `E${i + 1}`,
    evidenceId: c.evidenceId ?? `E${i + 1}`,
    book: c.book,
    chapter: c.chapter,
    owner: "",
    text: c.text,
    gloss: c.gloss,
    keywords: [],
    score: 1,
    sem: 1,
    lineage: c.relation ? { type: "", label: c.relation.label, use: c.relation.use, note: c.relation.note, from: "", to: "" } : undefined,
  }));
}

async function postConsistency(payload: ConsistencyPayload): Promise<VerifyResult | null> {
  try {
    const r = await fetch(api("/api/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { ok: boolean; verdict?: Verdict; note?: string; model?: string; crossModel?: boolean };
    return data.ok && data.verdict
      ? { verdict: data.verdict, note: data.note ?? "", model: data.model, crossModel: data.crossModel }
      : null;
  } catch {
    return null;
  }
}

async function repairConsistency(payload: ConsistencyPayload, result: VerifyResult): Promise<string | null> {
  if (result.verdict === "合规") return payload.text;
  try {
    const r = await fetch(api("/api/repair"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, verdict: result.verdict, note: result.note }),
    });
    if (!r.ok) return null;
    const data = (await r.json()) as { ok?: boolean; text?: string };
    return data.ok && data.text?.trim() ? data.text.trim() : null;
  } catch {
    return null;
  }
}

function cautiousFallback(kind?: string): string {
  if (kind === "west") return "The available evidence does not support a confident answer in this persona, so I will not invent one.";
  if (kind === "figure") return "这事眼下说不真切，我不把未曾有过的经历硬安在自己身上。";
  return "此问若无更确切的本家典据，我不敢强作定论。";
}

/**
 * 一致性校验 Agent：把人物发言连同其本家典据/学说锚点送服务端 `/api/verify`，
 * 由**异源**模型（默认 deepseek-v4.1-flash，非发言生成那家）判定是否违背其本家
 * 学说或先秦时代背景，返回 {verdict, note, model, crossModel}。
 * 无 Key 或上游/网络异常时返回 null，界面不显徽记。
 *
 * 典据取 `gatherAsync`，与答话路径（composeAnswerLLM 等）同一套：四库接上全文
 * 之后，诸子发言常引《论语》《孟子》里选本之外的句子；校验官若仍按选本关键词
 * 取据，便见不到发言真正所本，容易误判存疑。取不到全文/向量时退回选本，两边
 * 的退路也一致。
 *
 * 要紧的是此处**自行检索**一遍典据，不吃生成端那条链路的上下文：校验官换了家、
 * 证据也另取，两路独立，徽记才不是生成模型自己给自己的背书。
 */
export async function verifyConsistency(
  scholarId: string,
  text: string,
  topic?: string,
): Promise<VerifyResult | null> {
  const payload = await consistencyPayload(scholarId, text, topic);
  return payload ? postConsistency(payload) : null;
}

/**
 * 生成后质量闭环：先由异源模型校验；△ 修订一次、✕ 最多修订两次，每次均重新复核。
 * 若仍不合规，改用谨慎答复并再审。调用方应只采用返回的 `text`，并只把合规文本
 * 写入长期记忆或持久存档。校验服务不可用时返回 null，保留原有降级行为。
 */
export async function verifyAndRepairConsistency(
  scholarId: string,
  text: string,
  topic?: string,
  evidence?: Retrieved[],
): Promise<VerifiedAnswer | null> {
  const payload = await consistencyPayload(scholarId, text, topic, evidence);
  if (!payload) return null;
  const evidenceHits = evidence?.length
    ? evidence.map((hit, i) => ({ ...hit, evidenceId: hit.evidenceId ?? `E${i + 1}` }))
    : payloadHits(payload);
  const firstBinding = bindAnswerEvidence(text, evidenceHits);
  let result = await postConsistency(payload);
  if (!result) return null;
  if (firstBinding.citationIssues?.length && result.verdict === "合规") {
    result = { ...result, verdict: "存疑", note: firstBinding.citationIssues.join("；") };
  }
  if (result.verdict === "合规") {
    return { ...result, text: firstBinding.text, citations: firstBinding.citations, citationIssues: [], repaired: false, repairAttempts: 0 };
  }

  let currentText = firstBinding.text;
  let repairAttempts = 0;
  const maxAttempts = result.verdict === "矛盾" ? 2 : 1;
  while (repairAttempts < maxAttempts) {
    const revised = await repairConsistency({ ...payload, text: currentText }, result);
    if (!revised) break;
    repairAttempts += 1;
    const rebound = bindAnswerEvidence(revised, evidenceHits);
    currentText = rebound.text;
    const checked = await postConsistency({ ...payload, text: currentText });
    if (!checked) break;
    result = checked;
    if (result.verdict === "合规" && !rebound.citationIssues?.length) {
      return {
        ...result,
        text: currentText,
        citations: rebound.citations,
        citationIssues: [],
        repaired: true,
        repairAttempts,
        note: `已自动修订并复核通过：${result.note}`,
      };
    }
  }

  const fallback = cautiousFallback(payload.scholar.kind);
  const fallbackResult = await postConsistency({ ...payload, text: fallback });
  if (fallbackResult?.verdict === "合规") {
    return {
      ...fallbackResult,
      text: fallback,
      citations: [],
      citationIssues: [],
      repaired: true,
      repairAttempts,
      blocked: true,
      note: `自动修订未通过，已改为谨慎答复：${fallbackResult.note}`,
    };
  }
  return {
    ...(fallbackResult ?? result),
    verdict: fallbackResult?.verdict ?? "存疑",
    text: fallback,
    citations: [],
    citationIssues: [],
    repaired: true,
    repairAttempts,
    blocked: true,
    note: fallbackResult
      ? `自动修订未通过，已改为谨慎答复：${fallbackResult.note}`
      : "自动修订未能通过复核，已隐藏越界回答并改为谨慎答复。",
  };
}

/** 评判结果：每位入席者的分数与点评，加总判词 */
export type VerdictResult = {
  verdict: string;
  scores: { id: string; name: string; score: number; note: string }[];
};

/**
 * 辩论评判：吕不韦人格综观全场，为每位入席者打分并给总判词。
 * 经服务端 `/api/chat`（judge 模式）由 Qwen 输出 JSON，浏览器解析。
 * 未配置 Key、上游异常或 JSON 解析失败时返回 null，界面提示「未能评判」。
 */
export async function composeVerdictLLM(
  topic: string,
  turns: { scholarId: string; text: string }[],
): Promise<VerdictResult | null> {
  const namedTurns = turns
    .filter((t) => scholarMap[t.scholarId])
    .map((t) => ({ name: scholarMap[t.scholarId].name, text: t.text }));
  if (!namedTurns.length) return null;
  const payload = {
    scholar: { name: LVBUWEI.name, school: LVBUWEI.school, intro: LVBUWEI.intro },
    question: `请就本场辩论（议题「${topic}」）作评判。`,
    judge: { topic, turns: namedTurns },
  };
  try {
    const r = await fetch(api("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok && isStream(r)) {
      const text = await readSSE(r, () => {});
      if (text) {
        // 模型可能偶附 ```json 代码围栏，剥之再解析
        const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        const obj = JSON.parse(clean) as VerdictResult;
        if (obj && typeof obj.verdict === "string" && Array.isArray(obj.scores)) return obj;
      }
    } else if (r.ok) {
      const data = (await r.json()) as { ok: boolean; text?: string };
      if (data.ok && data.text) {
        const obj = JSON.parse(data.text) as VerdictResult;
        if (obj && typeof obj.verdict === "string") return obj;
      }
    }
  } catch {
    /* 网络异常或 JSON 解析失败，返回 null */
  }
  return null;
}

