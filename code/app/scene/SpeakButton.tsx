"use client";

import { useEffect, useRef, useState } from "react";
import { voiceOf } from "../world/voices";
import { api } from "../world/assetPath";
import { useT } from "../i18n/lang";

type Status = "idle" | "loading" | "playing" | "error";

/** 模块级单例：同一时刻只允许一处发声；新播放先停旧，免多声叠加 */
let activeCancel: (() => void) | null = null;

/**
 * 古风配音按钮：点 ♪ → 经服务端 `/api/tts` 取 DashScope CosyVoice 音频流，
 * 浏览器 `<audio>` 边下边播（流式）；6s 仍无首声或上游不可用（无 key / 账号未开
 * 音频模型 / 音色 id 无效）→ 静默回退到系统 `speechSynthesis`（zh-CN），配音不中断。
 * 再点即停。模型 Key 全程不出服务端。
 */
export default function SpeakButton({
  text,
  scholarId,
  className = "",
  label,
}: {
  text: string;
  scholarId?: string;
  className?: string;
  label?: string;
}) {
  const t = useT();
  const [status, setStatus] = useState<Status>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 本实例当前播放的 cancel 句柄，供 onended/onerror/unmount 比对，确认是否仍归本实例 */
  const myCancelRef = useRef<(() => void) | null>(null);
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  function clearFallback() {
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  }

  function stopAudioInternal() {
    clearFallback();
    const a = audioRef.current;
    if (a) {
      a.oncanplay = null;
      a.onerror = null;
      a.onended = null;
      try {
        a.pause();
      } catch {
        /* 忽略 */
      }
      a.src = "";
      audioRef.current = null;
    }
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      /* 忽略 */
    }
  }

  function resetIfMine() {
    if (activeCancel && activeCancel === myCancelRef.current) activeCancel = null;
  }

  function fallbackWeb() {
    stopAudioInternal();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(textRef.current);
        u.lang = "zh-CN";
        u.onend = () => {
          resetIfMine();
          setStatus("idle");
        };
        u.onerror = () => {
          resetIfMine();
          setStatus("error");
        };
        window.speechSynthesis.speak(u);
        setStatus("playing");
        return;
      } catch {
        /* 落 error */
      }
    }
    setStatus("error");
  }

  function stop() {
    resetIfMine();
    stopAudioInternal();
    setStatus("idle");
  }

  function play() {
    if (!text) return;
    // 本实例在播/加载 → 切换关闭
    if (status === "playing" || status === "loading") {
      stop();
      return;
    }
    // 先停别处播放
    if (activeCancel && activeCancel !== myCancelRef.current) {
      const prev = activeCancel;
      activeCancel = null;
      prev();
    }

    myCancelRef.current = stop;
    activeCancel = stop;
    setStatus("loading");

    const a = new Audio();
    audioRef.current = a;
    a.oncanplay = () => {
      clearFallback();
      setStatus("playing");
      a.play().catch(() => fallbackWeb());
    };
    a.onerror = () => fallbackWeb();
    a.onended = () => {
      resetIfMine();
      stopAudioInternal();
      setStatus("idle");
    };
    a.src = api(`/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voiceOf(scholarId))}`);

    // 兜底：6s 仍 loading（静默 503 等未触 onerror/oncanplay）→ 回退系统语音
    clearFallback();
    fallbackTimer.current = setTimeout(() => fallbackWeb(), 6000);
  }

  // 卸载清理：若本实例正活跃则释放全局槽，并停本地音频
  useEffect(() => {
    return () => {
      if (activeCancel && activeCancel === myCancelRef.current) activeCancel = null;
      stopAudioInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!text) return null;

  const glyph = status === "loading" ? "⏳" : status === "playing" ? "⏸" : status === "error" ? "⊘" : "♪";
  const title =
    status === "loading"
      ? t("正在配音……")
      : status === "playing"
        ? t("停止配音")
        : status === "error"
          ? t("配音不可用，点此重试")
          : t("点击配音");

  return (
    <button
      type="button"
      className={`speak-btn${status === "playing" ? " on" : status === "error" ? " err" : ""}${className ? ` ${className}` : ""}`}
      onClick={play}
      title={title}
      aria-label={title}
    >
      <span aria-hidden>{glyph}</span>
      {label ? <i className="speak-label">{label}</i> : null}
    </button>
  );
}
