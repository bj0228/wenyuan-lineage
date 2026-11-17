import { scholarMap } from "./characters";
import type { Presence } from "./schedule";
import { regionMap } from "./regions";
import { formatWorldTime } from "./schedule";
import { api } from "./assetPath";

/**
 * 人物自主性：诸子在不处于日程事件时，由 LLM 依其性情/学说/时辰/处境自决一句动作，
 * 覆盖默认 idle。经服务端 `/api/chat`（autonomy 模式），Key 服务端持有。
 * 未配置 Key 或上游异常时返回 null，回退日程 idle。
 */

/**
 * 请某子自决此刻动作。返回 {action}（以「正在」领起的 ≤18 字描述）或 null。
 * presence 须为该子当前状态（须为无事件的 think 态，否则无意义）。
 */
export async function decideAction(
  scholarId: string,
  presence: Presence,
  tick: number,
): Promise<{ action: string } | null> {
  const scholar = scholarMap[scholarId];
  if (!scholar) return null;
  const shichen = formatWorldTime(tick).shichen;
  const payload = {
    scholar: { name: scholar.name, courtesy: scholar.courtesy, school: scholar.school, intro: scholar.intro },
    question: `依你的性情与学说，此刻你会做什么？`,
    autonomy: {
      region: regionMap[presence.region]?.name ?? presence.region,
      action: presence.action,
      shichen,
    },
  };
  try {
    const r = await fetch(api("/api/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      const ct = r.headers.get("content-type") ?? "";
      let text = "";
      if (ct.includes("text/event-stream")) {
        // 复用 dialogue.ts 的 readSSE 逻辑：逐 token 收，至 [DONE]
        text = await readShortSSE(r);
      } else {
        const data = (await r.json()) as { ok: boolean; text?: string };
        text = data.ok && data.text ? data.text : "";
      }
      if (text) {
        const action = text.trim().split("\n")[0].slice(0, 24);
        // 规整：确保以「正在」领起
        const normalized = action.startsWith("正在") ? action : `正在${action.replace(/^正在/, "")}`;
        return { action: normalized };
      }
    }
  } catch {
    /* 网络异常，返回 null */
  }
  return null;
}

/** 简版 SSE 读取：收完即止（autonomy 输出极短，无需逐字回填） */
async function readShortSSE(response: Response): Promise<string> {
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
          if (delta) full += delta;
        } catch {
          /* 跳过心跳行 */
        }
      }
    }
  } catch {
    /* 流中断，返回已收部分 */
  }
  return full;
}
