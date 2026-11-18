import fs from "node:fs";
import path from "node:path";
import { composeAnswerLLM, verifyAndRepairConsistency } from "../app/world/dialogue";
import { scholarMap } from "../app/world/characters";

type Score = { PF: number; HC: number; EG: number; TR: number; rationale: string };

const root = process.cwd();
const baseUrl = process.env.WENYUAN_EVAL_URL ?? "http://localhost:5174";
// 浏览器中的全文/文脉检索以 window 是否存在为开关；评测脚本补一个最小外壳，
// 使它走与真实界面相同的 1,019 部典籍检索，而不是 SSR 降级选本。
(globalThis as typeof globalThis & { window?: unknown }).window = {
  localStorage: { getItem: () => null, setItem: () => undefined },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
};
const nativeFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string" && input.startsWith("/")) return nativeFetch(`${baseUrl}${input}`, init);
  if (input instanceof URL && input.pathname.startsWith("/") && !input.host) {
    return nativeFetch(new URL(input.pathname + input.search, baseUrl), init);
  }
  return nativeFetch(input, init);
}) as typeof fetch;

function loadVars(file: string) {
  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) vars[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return vars;
}

const evalVars = path.join(root, ".dev.vars.eval");
const vars = loadVars(fs.existsSync(evalVars) ? evalVars : path.join(root, ".dev.vars"));
const judgeModel = process.env.WENYUAN_JUDGE_MODEL ?? "qwen3.8-max";
const generatorModel = vars.CHAT_MODEL ?? "unknown";
const verifierModel = vars.QWEN_VERIFY_MODEL ?? "unknown";

const personas = ["kong", "meng", "xun", "mo", "laozi", "zhuang", "han", "sunwu", "shangyang", "guigu"];

const questions = [
  {
    id: "Q1",
    dimension: "persona_stance",
    mode: "historical" as const,
    text: "在你看来，理想的政治秩序应建立在什么原则上？请以符合你本人思想和表达方式的语言回答。",
  },
  {
    id: "Q2",
    dimension: "own_text_evidence",
    mode: "historical" as const,
    text: "请引用你本人著述中的一段原文，说明你如何理解个人德性与公共秩序之间的关系，并解释引文如何支持你的判断。",
  },
  {
    id: "Q3",
    dimension: "reviewed_lineage",
    mode: "historical" as const,
    text: "请选择一部早于你、且与本人著述存在审定文脉关系的典籍，说明你对它是承学、取材、非难还是其他关系，并引用文本依据；如果当前证据不足，请明确说明。",
  },
  {
    id: "Q4",
    dimension: "temporal_boundary",
    mode: "historical" as const,
    text: "你如何评价卢梭《社会契约论》中‘主权属于人民’的观点？",
  },
  {
    id: "Q5",
    dimension: "comparative_reasoning",
    mode: "comparative" as const,
    text: "用户现在向你提供一条后世观点：‘政治权力的正当性来自人民的共同约定，而非君主的天然身份。’请将其视为外部信息，用你自己的概念作出评价，并区分哪些判断来自你的著述，哪些属于跨时代比较推演。",
  },
];

function clip(s: string, n = 900) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function parseJson(text: string): Score | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[0]);
    const score: Score = {
      PF: Number(raw.PF), HC: Number(raw.HC), EG: Number(raw.EG), TR: Number(raw.TR),
      rationale: String(raw.rationale ?? ""),
    };
    if ([score.PF, score.HC, score.EG, score.TR].every((v) => Number.isFinite(v) && v >= 1 && v <= 5)) return score;
  } catch { /* retry below */ }
  return null;
}

async function judge(payload: Record<string, unknown>): Promise<Score> {
  const rubric = `你是数字人文系统的独立评审。请按1--5分评价回答，5为最好。\n` +
    `PF（Persona Fidelity）：立场、概念和语气是否符合该人物。\n` +
    `HC（Historical Consistency）：是否遵守人物时代和知识边界。历史模式不得假装知道后世文本；比较模式须把后世观点标为外部输入。\n` +
    `EG（Evidence Grounding）：核心主张是否得到所附原文支持，是否存在误引或把推演写成原话。\n` +
    `TR（Traceability）：读者能否从书名、篇章、引文及文脉标记追溯依据。系统界面所附citation元数据也计入。\n` +
    `必须严格输出JSON：{"PF":1-5,"HC":1-5,"EG":1-5,"TR":1-5,"rationale":"不超过80字"}。`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await nativeFetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${vars.DASHSCOPE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: judgeModel,
        messages: [
          { role: "system", content: rubric },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0,
        enable_thinking: false,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error(`judge HTTP ${response.status}: ${clip(await response.text(), 180)}`);
    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const parsed = parseJson(data.choices?.[0]?.message?.content ?? "");
    if (parsed) return parsed;
  }
  throw new Error("judge returned invalid JSON twice");
}

async function evaluate(personaId: string, q: typeof questions[number]) {
  const persona = scholarMap[personaId];
  const started = Date.now();
  const generated = await composeAnswerLLM(personaId, q.text, undefined, [], undefined, undefined, q.mode);
  const verified = await verifyAndRepairConsistency(personaId, generated.text, q.text, generated.citations);
  const finalText = verified?.text ?? generated.text;
  const finalCitations = verified?.citations ?? generated.citations;
  const citations = finalCitations.map((c) => ({
    book: c.book,
    chapter: c.chapter,
    text: c.text,
    owner: c.owner,
    lineage: c.lineage ?? null,
    score: Number(c.score?.toFixed?.(4) ?? c.score),
    sem: Number(c.sem?.toFixed?.(4) ?? c.sem),
  }));
  const score = await judge({
    persona: { name: persona.name, school: persona.school, intro: persona.intro, themes: persona.themes, representativeWorks: persona.representativeWorks },
    mode: q.mode,
    dimension: q.dimension,
    question: q.text,
    finalAnswer: finalText,
    citations,
    verification: verified ? { verdict: verified.verdict, note: verified.note, repaired: verified.repaired, blocked: !!verified.blocked } : null,
  });
  return {
    personaId,
    persona: persona.name,
    school: persona.school,
    questionId: q.id,
    dimension: q.dimension,
    mode: q.mode,
    question: q.text,
    generatedText: generated.text,
    finalText,
    citations,
    citationCount: citations.length,
    lineageCitationCount: citations.filter((c) => c.lineage).length,
    verification: verified,
    score,
    durationMs: Date.now() - started,
  };
}

function avg(rows: any[], key: "PF" | "HC" | "EG" | "TR") {
  return rows.reduce((sum, r) => sum + r.score[key], 0) / rows.length;
}

function summarize(rows: any[]) {
  const metric = Object.fromEntries(["PF", "HC", "EG", "TR"].map((k) => [k, Number(avg(rows, k as any).toFixed(2))]));
  const overall = Number(((metric.PF + metric.HC + metric.EG + metric.TR) / 4).toFixed(2));
  const byQuestion = questions.map((q) => {
    const rs = rows.filter((r) => r.questionId === q.id);
    const scores = Object.fromEntries(["PF", "HC", "EG", "TR"].map((k) => [k, Number(avg(rs, k as any).toFixed(2))]));
    return { questionId: q.id, dimension: q.dimension, n: rs.length, ...scores, overall: Number(((scores.PF + scores.HC + scores.EG + scores.TR) / 4).toFixed(2)) };
  });
  const byPersona = personas.map((id) => {
    const rs = rows.filter((r) => r.personaId === id);
    const scores = Object.fromEntries(["PF", "HC", "EG", "TR"].map((k) => [k, Number(avg(rs, k as any).toFixed(2))]));
    return { personaId: id, persona: scholarMap[id].name, n: rs.length, ...scores, overall: Number(((scores.PF + scores.HC + scores.EG + scores.TR) / 4).toFixed(2)) };
  });
  return {
    n: rows.length,
    metric,
    overall,
    byQuestion,
    byPersona,
    compliant: rows.filter((r) => r.verification?.verdict === "合规").length,
    repaired: rows.filter((r) => r.verification?.repaired).length,
    blocked: rows.filter((r) => r.verification?.blocked).length,
    withLineageCitation: rows.filter((r) => r.lineageCitationCount > 0).length,
  };
}

async function main() {
  const pilot = process.argv.includes("--pilot");
  const selected = pilot ? ["meng"] : personas;
  const jobs = selected.flatMap((personaId) => questions.map((q) => ({ personaId, q })));
  const rows: any[] = [];
  const concurrency = pilot ? 1 : 2;
  let cursor = 0;
  async function worker() {
    for (;;) {
      const index = cursor++;
      if (index >= jobs.length) return;
      const { personaId, q } = jobs[index];
      process.stdout.write(`[${index + 1}/${jobs.length}] ${scholarMap[personaId].name} ${q.id} ... `);
      try {
        const row = await evaluate(personaId, q);
        rows.push(row);
        console.log(`${row.score.PF}/${row.score.HC}/${row.score.EG}/${row.score.TR} · ${row.verification?.verdict ?? "未审核"}${row.verification?.repaired ? "↻" : ""}`);
      } catch (error) {
        console.log(`ERROR ${(error as Error).message}`);
        rows.push({ personaId, persona: scholarMap[personaId].name, questionId: q.id, error: (error as Error).stack ?? String(error) });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const completed = rows.filter((r) => r.score);
  const report = {
    createdAt: new Date().toISOString(),
    setup: { generatorModel, verifierModel, judgeModel, personas: selected, questions: questions.map(({ id, dimension, mode, text }) => ({ id, dimension, mode, text })) },
    summary: summarize(completed),
    results: rows.sort((a, b) => personas.indexOf(a.personaId) - personas.indexOf(b.personaId) || a.questionId.localeCompare(b.questionId)),
  };
  // Pilot/failure runs remain local; only a reviewed full report belongs in public documentation.
  const outDir = pilot
    ? path.join(root, "scripts", "out", "evaluation")
    : path.join(root, "docs", "evaluation");
  fs.mkdirSync(outDir, { recursive: true });
  const stem = pilot ? "five-question-pilot" : "five-question-system-results";
  fs.writeFileSync(path.join(outDir, `${stem}.json`), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`SUMMARY ${JSON.stringify(report.summary)}`);
  console.log(`WROTE ${path.relative(root, path.join(outDir, `${stem}.json`))}`);
}

await main();
