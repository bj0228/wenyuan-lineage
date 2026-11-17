import { scholarMap } from "./characters";
import { api } from "./assetPath";

/**
 * 「生成视频」客户端编排：把辩论/对谈结果做成一段古风动画。
 * 两步——通义万相文生图出关键帧 → 图生视频令其动起来，皆异步任务，由本模块提交+轮询。
 * 提示词据议题/人物/结论本地拼装（不另调模型，省一次往返）；服务端 Worker 持 key。
 *
 * 流程：submitImage → pollTask(图) → submitI2V → pollTask(视频) → videoUrl。
 * 任一步失败回 error 文案，由 VideoReel 提示（如「未开通视频模型」）。
 */

export type VideoStatus = "idle" | "img" | "imgPoll" | "i2v" | "videoPoll" | "done" | "error";

export type VideoContext = {
  /** 议题 */
  topic: string;
  /** 在场人物 id（用于点名入画） */
  scholarIds: string[];
  /** 结论/摘述（辩论总结轮＋主持人收束，或对谈双方末轮），助场景点题 */
  summary: string;
};

/** 文生图提示词：先秦诸子围坐论道、议题点题、电影感水墨工笔。无文字水印约束。 */
export function buildImagePrompt(ctx: VideoContext): string {
  const names = ctx.scholarIds.map((id) => scholarMap[id]?.name).filter(Boolean).join("、");
  const topicShort = (ctx.topic || "治道").slice(0, 24);
  return [
    "中国水墨与工笔交融，电影质感，先秦诸子围坐于竹林石坛之上争鸣论道",
    names ? `在场者：${names}` : "",
    `所论「${topicShort}」`,
    "烛火摇曳，衣袂飘飘，竹影婆娑，古朴庄严，俯视构图，暖黄烛光，8k 高清，画面无文字",
  ]
    .filter(Boolean)
    .join("，");
}

/** 图生视频运动提示词：克制动感、运镜为主，契合静逸古风。 */
export function buildMotionPrompt(_ctx: VideoContext): string {
  return "烛光微微摇曳，衣袂轻动，竹影缓摆，镜头缓缓推近，人物神情肃穆，古风静谧";
}

async function postJSON(url: string, body: unknown): Promise<{ ok?: boolean; taskId?: string; error?: string; reason?: string }> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return (await r.json().catch(() => ({}))) as { ok?: boolean; taskId?: string; error?: string; reason?: string };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** 把上游/Worker 的英文错误归为人话中文，便于在按钮旁就地提示。 */
function humanizeVideoError(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s.includes("arrearage") || s.includes("overdue-payment") || s.includes("good standing") || s.includes("balance") || s.includes("欠费"))
    return "百炼账户欠费或余额不足，请充值后再试";
  if (s.includes("no-key")) return "服务端未配置 DASHSCOPE_API_KEY";
  if (s.includes("permission") || s.includes("access denied") || s.includes("not allowed") || s.includes("开通") || s.includes("model not"))
    return "请在百炼控制台开通「通义万相」图像/视频模型";
  if (s === "network" || s.includes("fetch-error")) return "网络异常，请稍后重试";
  return raw;
}

/** 提交文生图任务 → {ok, taskId?} */
export async function submitImage(prompt: string): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  const j = await postJSON(api("/api/video/img"), { prompt });
  return { ok: !!j.ok, taskId: j.taskId, error: humanizeVideoError(j.error || j.reason) };
}

/** 提交图生视频任务 → {ok, taskId?} */
export async function submitI2V(imageUrl: string, prompt: string): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  const j = await postJSON(api("/api/video/i2v"), { imageUrl, prompt });
  return { ok: !!j.ok, taskId: j.taskId, error: humanizeVideoError(j.error || j.reason) };
}

/** 轮询任务 → {status, url?, error?}。status 取 DashScope 之 PENDING/RUNNING/SUCCEEDED/FAILED/UNKNOWN。 */
export async function pollTask(taskId: string): Promise<{ status: string; url?: string; error?: string }> {
  try {
    const r = await fetch(api(`/api/video/poll?task=${encodeURIComponent(taskId)}`));
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; status?: string; url?: string; error?: string };
    return { status: j.status || "UNKNOWN", url: j.url, error: j.error };
  } catch {
    return { status: "UNKNOWN", error: "network" };
  }
}

/** DashScope 任务态是否终态 */
export function isTerminal(status: string): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "UNKNOWN";
}
