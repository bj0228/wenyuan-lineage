"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildImagePrompt,
  buildMotionPrompt,
  isTerminal,
  pollTask,
  submitI2V,
  submitImage,
  type VideoContext,
  type VideoStatus,
} from "../world/video";
import { useT } from "../i18n/lang";

/**
 * 按需「生成视频」：辩论/对谈结束后点按钮，两步生成一段古风动画并就地播放。
 * 流程：文生图关键帧 → 轮询 → 图生视频 → 轮询 → <video> 播放。
 * 各阶段显进度文案；失败（如账号未开通视频模型）显 error，可重试。组件卸载则停轮询。
 */
export default function VideoReel({ ctx, label = "生成视频" }: { ctx: VideoContext; label?: string }) {
  const t = useT();
  const [status, setStatus] = useState<VideoStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tip, setTip] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 卸载守卫：组件销毁（关辩论/对谈弹层）时中止轮询，免 setState on unmounted
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  async function generate() {
    if (status === "img" || status === "imgPoll" || status === "i2v" || status === "videoPoll") return;
    setError(null);
    setVideoUrl(null);
    setStatus("img");
    setTip("正在绘制场景关键帧……");

    // 1. 文生图关键帧
    const img = await submitImage(buildImagePrompt(ctx));
    if (!alive.current) return;
    if (!img.ok || !img.taskId) {
      setStatus("error");
      setError(img.error || "场景绘制失败（或未开通图像模型）");
      return;
    }
    // 2. 轮询关键帧
    setStatus("imgPoll");
    setTip("关键帧生成中，约十数秒……");
    let imgUrl: string | undefined;
    for (let i = 0; i < 60 && alive.current; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      if (!alive.current) return;
      const p = await pollTask(img.taskId);
      if (p.status === "SUCCEEDED") {
        imgUrl = p.url;
        break;
      }
      if (isTerminal(p.status)) {
        setStatus("error");
        setError(p.error || "关键帧生成失败");
        return;
      }
    }
    if (!imgUrl) {
      if (!alive.current) return;
      setStatus("error");
      setError("关键帧生成超时");
      return;
    }

    // 3. 图生视频
    setStatus("i2v");
    setTip("正在令画面动起来……");
    const v = await submitI2V(imgUrl, buildMotionPrompt(ctx));
    if (!alive.current) return;
    if (!v.ok || !v.taskId) {
      setStatus("error");
      setError(v.error || "视频生成提交失败（可能未开通视频模型）");
      return;
    }
    // 4. 轮询视频
    setStatus("videoPoll");
    setTip("视频生成中，约需一分钟……");
    let vUrl: string | undefined;
    for (let i = 0; i < 80 && alive.current; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      if (!alive.current) return;
      const p = await pollTask(v.taskId);
      if (p.status === "SUCCEEDED") {
        vUrl = p.url;
        break;
      }
      if (isTerminal(p.status)) {
        setStatus("error");
        setError(p.error || "视频生成失败");
        return;
      }
    }
    if (!alive.current) return;
    if (!vUrl) {
      setStatus("error");
      setError("视频生成超时");
      return;
    }
    setVideoUrl(vUrl);
    setStatus("done");
    setTip("");
  }

  const busy = status === "img" || status === "imgPoll" || status === "i2v" || status === "videoPoll";

  return (
    <div className="video-reel">
      <button className="ctl-btn video-btn" onClick={generate} disabled={busy} aria-label={t("生成AI视频")}>
        {busy ? t("生成中…") : status === "done" ? t("↻ 重新生成") : t("◗ {label}", { label: t(label) })}
      </button>
      {/* 这一路的进程与岔子都是现成的一句中文，存着是中文，显时才译 */}
      {busy && <span className="video-tip">{t(tip)}</span>}
      {error && <span className="video-err">⚠ {t(error)}</span>}
      {videoUrl && (
        <div className="video-card">
          <video src={videoUrl} controls autoPlay loop playsInline />
        </div>
      )}
    </div>
  );
}
