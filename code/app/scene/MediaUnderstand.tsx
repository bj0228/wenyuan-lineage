"use client";

import { useRef, useState } from "react";
import { extractFrames, understand, humanizeUnderstandError, type Understanding } from "../world/video-understand";
import { AnnotPanel } from "./AnnotPanel";
import { useT } from "../i18n/lang";
import Said from "../i18n/Said";

/**
 * 「呈影音请诸子点评」面板：上传影视片段 → 浏览器抽帧 → /api/understand（qwen-vl）
 * 出结构化理解卡片（场景/人物/对白/主题）→ 复用 AnnotPanel 请诸子流式点评、落库。
 * VL 不可用 / 失败 / 用户主动选「改贴文本」时降级 D：贴一段对白/小说摘录，同样喂 AnnotPanel。
 *
 * 抽帧图集仅用于本次理解、不落 localStorage、推理完即弃（video-understand.ts 已 revoke）。
 * 诸子点评走既有 /api/chat（key 只在 Worker），落 localStorage zhuzi-annotations（key=media:{ts}）。
 */
type Phase = "idle" | "extracting" | "understanding" | "done" | "error";

const MAX_BYTES = 30 * 1024 * 1024; // 30MB
const ACCEPT = ["video/mp4", "video/quicktime", "video/webm"];

export function MediaUnderstand() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [understanding, setUnderstanding] = useState<Understanding | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [hint, setHint] = useState("");
  const [fallbackText, setFallbackText] = useState(""); // D 路径：贴文本
  const [useFallback, setUseFallback] = useState(false);
  const [mediaKey, setMediaKey] = useState<string | null>(null); // 诸子点评 verseKey
  const [prompt, setPrompt] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const previewUrl = useRef<string | null>(null);

  async function handleFile(file: File) {
    if (!ACCEPT.some((t) => file.type === t) && !/\.(mp4|mov|webm)$/i.test(file.name)) {
      setErrMsg("只支持 mp4 / mov / webm。");
      setPhase("error");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrMsg("片段过大（限 30MB），请截短后再试；或改为贴文本。");
      setPhase("error");
      return;
    }
    setErrMsg("");
    setUnderstanding(null);
    setUseFallback(false);
    setMediaKey(null);
    // 预览
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file);

    setPhase("extracting");
    setProgress({ done: 0, total: 6 });
    let frames: string[];
    try {
      frames = await extractFrames(file, { count: 6, onProgress: (done, total) => setProgress({ done, total }) });
    } catch {
      setErrMsg("抽帧失败，请换一段或改为贴文本。");
      setPhase("error");
      return;
    }
    if (frames.length === 0) {
      setErrMsg("未能抽出帧，请换一段或改为贴文本。");
      setPhase("error");
      return;
    }

    setPhase("understanding");
    const res = await understand(frames, hint);
    if (!res.ok) {
      setErrMsg(humanizeUnderstandError(res.reason || res.error));
      setPhase("error");
      return;
    }
    if (!res.understanding) {
      setErrMsg(humanizeUnderstandError("parse"));
      setPhase("error");
      return;
    }
    setUnderstanding(res.understanding);
    finalizePrompt(res.understanding);
    setPhase("done");
  }

  /** 据理解结果拼诸子点评 prompt 并定 verseKey。 */
  function finalizePrompt(u: Understanding) {
    const dl = u.dialogues.slice(0, 3).join("／") || "（无对白）";
    const th = u.themes.join("、") || "（未明）";
    const ch = u.characters.map((c) => c.name + (c.guess ? `（${c.guess}）` : "")).join("、") || "（未识）";
    const p = `客呈一段影音：场景为「${u.scene}」，画面可见${ch}，其言${dl}，涉${th}。请就此影音演绎点评，可援可驳，标《书·篇》出处。`;
    setPrompt(p);
    // verseKey 用稳定 id：场景前 16 字哈希替代——无 Date.now（SSR 安全且刷新可复现）
    setMediaKey("media:" + u.scene.slice(0, 16));
  }

  /** D 降级：用所贴文本定 prompt。 */
  function finalizeFallbackPrompt(text: string) {
    const p = `客呈一段影音文本：${text.slice(0, 200)}。请就此影音演绎点评，可援可驳，标《书·篇》出处。`;
    setPrompt(p);
    setMediaKey("media:text-" + text.slice(0, 12));
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function reset() {
    if (previewUrl.current) { URL.revokeObjectURL(previewUrl.current); previewUrl.current = null; }
    setPhase("idle");
    setUnderstanding(null);
    setErrMsg("");
    setHint("");
    setFallbackText("");
    setUseFallback(false);
    setMediaKey(null);
    setPrompt("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const busy = phase === "extracting" || phase === "understanding";

  return (
    <div className="kg-mu-wrap">
      {/* 版权/隐私提示 */}
      <p className="kg-mu-note">{t("仅自用学习，请勿上传侵权素材；抽帧图仅用于本次理解、不存储。")}</p>

      {/* 上传 + 预览 */}
      {phase !== "done" && !useFallback && (
        <div
          className="kg-mu-drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <input ref={fileRef} type="file" accept={ACCEPT.join(",")} onChange={onInputChange} style={{ display: "none" }} />
          <button className="ghost-btn" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? t("处理中…") : t("选择影视片段")}
          </button>
          <span>{t("或拖拽到此（mp4 / mov / webm，≤30MB）")}</span>
        </div>
      )}

      {previewUrl.current && phase !== "done" && !useFallback && (
        <video className="kg-mu-preview" src={previewUrl.current} controls muted />
      )}

      {/* 可选提示词 */}
      {phase !== "done" && !useFallback && (
        <input
          className="found-input kg-mu-hint"
          value={hint}
          maxLength={40}
          placeholder={t("可选：这是哪段、焦点是谁")}
          onChange={(e) => setHint(e.target.value)}
          disabled={busy}
        />
      )}

      {/* 抽帧进度 */}
      {phase === "extracting" && (
        <p className="kg-mu-prog">{t("抽帧中 {done}/{total}…", { done: progress.done, total: progress.total })}</p>
      )}
      {phase === "understanding" && (
        <p className="kg-mu-prog">{t("识场景人物中…")}</p>
      )}

      {/* 错误 + 降级入口 */}
      {phase === "error" && (
        <div className="kg-mu-err">
          {/* 岔子的那一句存的是中文，显的时候才译（见 i18n/en.ts） */}
          <p>{t(errMsg)}</p>
          <div className="kg-mu-err-row">
            <button className="ghost-btn" onClick={reset}>{t("重选片段")}</button>
            <button className="ghost-btn" onClick={() => { setUseFallback(true); setPhase("idle"); }}>{t("改为贴文本")}</button>
          </div>
        </div>
      )}

      {/* D 降级：贴文本 */}
      {useFallback && !mediaKey && (
        <div className="kg-mu-fallback">
          <p>{t("贴一段对白或小说摘录，诸子据此点评：")}</p>
          <textarea
            className="found-input kg-mu-textarea"
            value={fallbackText}
            rows={4}
            maxLength={400}
            placeholder={t("如：韩非入秦，李斯忌其才，进言曰……")}
            onChange={(e) => setFallbackText(e.target.value)}
          />
          <div className="kg-mu-err-row">
            <button className="ghost-btn" onClick={reset}>{t("返回上传")}</button>
            <button
              className="ghost-btn"
              disabled={fallbackText.trim().length < 4}
              onClick={() => { finalizeFallbackPrompt(fallbackText.trim()); }}
            >
              {t("呈文本请诸子点评")}
            </button>
          </div>
        </div>
      )}

      {/* 理解卡片 */}
      {phase === "done" && understanding && (
        <div className="kg-mu-card">
          {/* 场景这一句是模型看片看出来的中文，英文模式下其下附一行英译 */}
          <div className="kg-mu-scene">{understanding.scene}</div>
          <Said text={understanding.scene} />
          {understanding.characters.length > 0 && (
            <div className="kg-mu-row">
              <small>{t("人物")}</small>
              <span>{understanding.characters.map((c) => c.name + (c.guess ? `（${c.guess}）` : "")).join("、")}</span>
            </div>
          )}
          {understanding.dialogues.length > 0 && (
            <div className="kg-mu-row">
              <small>{t("对白")}</small>
              <span>{understanding.dialogues.join("／")}</span>
            </div>
          )}
          {understanding.themes.length > 0 && (
            <div className="kg-mu-themes">
              {understanding.themes.map((t) => <span key={t} className="kg-media-kind" data-k="影视">{t}</span>)}
            </div>
          )}
          <button className="ghost-btn kg-mu-reset" onClick={reset}>{t("换一段")}</button>
        </div>
      )}

      {/* 诸子点评（理解成功或贴文本后皆有 mediaKey + prompt） */}
      {mediaKey && prompt && (
        <>
          <div className="kg-nd-sec">{t("诸子点评")}</div>
          <AnnotPanel verseKey={mediaKey} prompt={prompt} />
        </>
      )}
    </div>
  );
}
