/**
 * 「呈影音」客户端编排：把用户上传的影视片段抽成若干关键帧，提交服务端 VL 理解，
 * 再把结构化理解结果交给诸子点评（由 UI 侧复用 AnnotPanel / composeAnswerLLM）。
 *
 * 与 video.ts 同范式：浏览器侧做重活（<video>+canvas 抽帧）、服务端 Worker 持 key 调 qwen-vl。
 * 抽帧图集仅用于本次理解、不落 localStorage、推理完即弃（UI 侧释放）。
 *
 * 失败回退 D 路径：VL 不可用 / 解析失败时，UI 侧改为让用户贴文本走既有对谈管道，
 * 本模块不报错中断，只回结构化错误供 UI 决策。
 */

import { api } from "./assetPath";

/** VL 视频理解结果（与 worker/index.ts 之 Understanding 同形）。 */
export type Understanding = {
  scene: string;
  characters: { name: string; guess?: string }[];
  dialogues: string[];
  themes: string[];
};

type UnderstandResponse =
  | { ok: true; understanding: Understanding }
  | { ok: false; reason?: string; error?: string; raw?: string };

/** 浏览器抽帧选项：帧数、缩放边长、jpeg 质量——控 token 成本与请求体大小。 */
export type ExtractOptions = {
  count?: number;
  maxDim?: number;
  quality?: number;
  /** 每抽一帧回调，供 UI 显进度 N/total。 */
  onProgress?: (done: number, total: number) => void;
};

/** 单帧最大字节数（base64 data URL 长度），与 worker 侧 1.5MB 上限对齐。 */
const MAX_FRAME_BYTES = 1_400_000;

/**
 * 从视频文件等间距抽 N 帧为 jpeg data URL。
 * 用 <video> 读 object URL → loadeddata 后按 count 等间距 seek → seeked 时 canvas 抓帧。
 * 单帧超限时逐步降质量重抓；失败帧跳过。抽完 revoke object URL。
 */
export async function extractFrames(file: File, opts: ExtractOptions = {}): Promise<string[]> {
  const count = Math.max(2, Math.min(8, opts.count ?? 6));
  const maxDim = opts.maxDim ?? 512;
  let quality = opts.quality ?? 0.5;
  const onProgress = opts.onProgress ?? (() => {});

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = url;
  // 确保画面就绪：loadeddata 后 metadata 已可读 duration
  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => { video.removeEventListener("loadeddata", onLoaded); video.removeEventListener("error", onErr); resolve(); };
    const onErr = () => { video.removeEventListener("loadeddata", onLoaded); video.removeEventListener("error", onErr); reject(new Error("video-load")); };
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onErr);
  });

  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) { URL.revokeObjectURL(url); throw new Error("no-canvas"); }

  const frames: string[] = [];
  try {
    for (let i = 0; i < count; i++) {
      // 等间距取点：首尾各让 5%，避免黑场
      const t = duration > 0 ? duration * (0.05 + (i / (count - 1 || 1)) * 0.9) : 0;
      await seekTo(video, t);
      const { w, h } = fitDim(video.videoWidth, video.videoHeight, maxDim);
      canvas.width = w; canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      let data = canvas.toDataURL("image/jpeg", quality);
      // 超限则降质量重抓，最多两次
      let q = quality;
      while (data.length > MAX_FRAME_BYTES && q > 0.2) {
        q = Math.max(0.2, q - 0.15);
        data = canvas.toDataURL("image/jpeg", q);
      }
      if (data.length <= MAX_FRAME_BYTES) frames.push(data);
      onProgress(i + 1, count);
    }
  } finally {
    URL.revokeObjectURL(url);
  }
  return frames;
}

/** seek 到指定时间，等 seeked 事件resolve。 */
function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
    video.addEventListener("seeked", onSeeked);
    // 某些浏览器需 requestVideoFrameCallback 才能拿到解码帧；seeked 兜底已够用
    try { video.currentTime = t; } catch { resolve(); }
  });
}

/** 按最长边缩放，保持比例。 */
function fitDim(w: number, h: number, maxDim: number): { w: number; h: number } {
  if (!w || !h) return { w: maxDim, h: maxDim };
  if (w <= maxDim && h <= maxDim) return { w, h };
  const r = w >= h ? maxDim / w : maxDim / h;
  return { w: Math.round(w * r), h: Math.round(h * r) };
}

/** 提交帧集到 /api/understand，返回结构化理解结果。 */
export async function understand(frames: string[], hint?: string): Promise<UnderstandResponse> {
  if (frames.length === 0) return { ok: false, reason: "no-frames" };
  try {
    const r = await fetch(api("/api/understand"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frames, hint: hint?.trim() || undefined }),
    });
    const j = (await r.json().catch(() => ({}))) as UnderstandResponse;
    return j;
  } catch {
    return { ok: false, reason: "network" };
  }
}

/** 把上游/Worker 的英文错误归为人话中文，供 UI 就地提示并决定是否降级贴文本。 */
export function humanizeUnderstandError(raw?: string): string {
  if (!raw) return "理解失败，可改为贴文本请诸子点评。";
  const s = raw.toLowerCase();
  if (s.includes("arrearage") || s.includes("overdue-payment") || s.includes("good standing") || s.includes("balance") || s.includes("欠费"))
    return "百炼账户欠费或余额不足，请充值后再试；或改为贴文本。";
  if (s.includes("no-key")) return "服务端未配置 DASHSCOPE_API_KEY；可改为贴文本请诸子点评。";
  if (s.includes("permission") || s.includes("access denied") || s.includes("not allowed") || s.includes("开通") || s.includes("model not"))
    return "请在百炼控制台开通「通义千问 VL」模型；或改为贴文本。";
  if (s.includes("parse")) return "未能解析理解结果，可改为贴文本请诸子点评。";
  if (s.includes("too-many-frames") || s.includes("bad-args")) return "片段过长或帧数超限，请截短后再试；或改为贴文本。";
  if (s === "network" || s.includes("fetch-error")) return "网络异常，请稍后重试；或改为贴文本。";
  return raw;
}
