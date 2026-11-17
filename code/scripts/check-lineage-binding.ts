import { composeAnswerLLM } from "../app/world/dialogue";
import { scholarMap } from "../app/world/characters";

const base = process.env.WENYUAN_EVAL_URL ?? "http://localhost:5174";
(globalThis as typeof globalThis & { window?: unknown }).window = {
  localStorage: { getItem: () => null, setItem: () => undefined },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
};
const nativeFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const raw = typeof input === "string" ? input : input.toString();
  if (raw.endsWith("/api/chat") || raw === "/api/chat") {
    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      canon?: { evidenceId: string; book: string; chapter: string; text: string; relation?: { label: string; use: string; note: string } }[];
      lineageRequest?: { requested: boolean; reviewedAvailable: boolean };
    };
    const relation = payload.canon?.find((c) => c.relation);
    const own = payload.canon?.find((c) => !c.relation);
    const text = relation && own
      ? `据审定关系，《${relation.book}》是${relation.relation!.label}来源：“${relation.text.slice(0, 22)}”[${relation.evidenceId}]；本家《${own.book}》有“${own.text.slice(0, 22)}”[${own.evidenceId}]。`
      : "当前没有检得通向本人著作的审定文脉关系边，证据不足，不强作关系判断。";
    return Response.json({ ok: true, text });
  }
  const url = raw.startsWith("/") ? `${base}${raw}` : raw;
  return nativeFetch(url, init);
}) as typeof fetch;

const ids = ["kong", "meng", "xun", "mo", "laozi", "zhuang", "han", "sunwu", "shangyang", "guigu"];
const question = "请选择一部早于你、且与本人著述存在审定文脉关系的典籍，说明关系类型并引用文本依据；如果当前证据不足，请明确说明。";

for (const id of ids) {
  const answer = await composeAnswerLLM(id, question, undefined, [], undefined, undefined, "historical");
  console.log(JSON.stringify({
    persona: scholarMap[id].name,
    citations: answer.citations.length,
    lineage: answer.citations.filter((c) => c.lineage).map((c) => `${c.lineage!.label}:${c.lineage!.from}->${c.lineage!.to}`),
    issues: answer.citationIssues,
    insufficient: answer.citations.length === 0,
  }));
}
