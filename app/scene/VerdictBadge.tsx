"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { verdictBadge, verdictExplain, type Verdict } from "../world/dialogue";
import { useLang, useT } from "../i18n/lang";
import Said from "../i18n/Said";

type Props = {
  verifying?: boolean;
  verdict?: Verdict;
  note?: string;
  /** 发言者的人格之属（thinker／figure／west）：悬停说明按此分档，不传即立论者一套 */
  kind?: string;
  /** 下判的模型 id：浮层末尾署名，令人一眼看出判词非发言者自家模型所出 */
  verifier?: string;
  /** 判词是否出自异源模型。false＝异源不可用退回本家自审，浮层如实标「同源自审」 */
  crossModel?: boolean;
};

/**
 * 一致性校验徽记：校验中显「校」，落定显 ✓／△／✕。
 * 悬停（或键盘聚焦）即以 portal 浮层显出该档判定含义与一句理由。
 * 浮层 fixed 定位、渲染到 body，避免被发言流的 overflow:auto 容器裁剪；
 * 上方空间不足时自动翻到下方，并横向夹进视口；滚动/缩放即隐以免错位。
 * 判词出自异源校验官时，浮层末尾署其模型名——徽记之所以算外证，全在这一行。
 * verifying 与 verdict 皆无时返回 null。
 */
export default function VerdictBadge({ verifying, verdict, note, kind, verifier, crossModel }: Props) {
  const t = useT();
  const lang = useLang();
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const b = verifying ? null : verdictBadge(verdict);
  const repaired = !!note && (note.startsWith("已自动修订") || note.startsWith("自动修订"));
  // 署名：异源则「外证·模型名」，退回本家自审则直说「同源自审」，不含糊
  const sign = verifier
    ? "\n" +
      t("校验官：{verifier}{kind}", {
        verifier,
        kind: crossModel === false ? t("（同源自审）") : t("（异源外证）"),
      })
    : "";
  // 判词的「理由」那一句是校验官现写的中文，查不着词条。
  // 中文模式下照旧拼进浮层（一字不改）；英文模式下把它挪到浮层末尾另起一行作英译，
  // 省得英文读者对着一行中文干看。
  const explain = verdict ? t(verdictExplain(verdict, kind)) : "";
  const inlineNote = note && lang !== "en";
  const tip = verifying
    ? t("正在校验一致性……")
    : verdict
      ? inlineNote
        ? `${explain}｜${note}${sign}`
        : `${explain}${sign}`
      : "";

  // 显出时按徽记 rect 计算浮层位置：默认居中于徽记上方，上方不足则翻下，横向夹进视口
  useEffect(() => {
    if (!show || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const tw = tipRef.current?.offsetWidth ?? 220;
    const th = tipRef.current?.offsetHeight ?? 40;
    let top = r.top - th - 6;
    if (top < 8) top = r.bottom + 6;
    let left = r.left + r.width / 2 - tw / 2;
    const vw = window.innerWidth;
    if (left < 8) left = 8;
    if (left + tw > vw - 8) left = vw - 8 - tw;
    setPos({ top, left });
  }, [show, tip]);

  // 滚动/缩放即隐，避免浮层与徽记错位（捕获阶段监听，捕捉任何祖先滚动容器）
  useEffect(() => {
    if (!show) return;
    const hide = () => setShow(false);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [show]);

  if (!verifying && !b) return null;

  return (
    <>
      <span
        ref={anchorRef}
        className={`cs-badge ${verifying ? "checking" : b?.cls ?? ""}${repaired ? " repaired" : ""}`}
        tabIndex={0}
        role="img"
        aria-label={tip}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        {/* 落定后那一枚 ✓／△／✕ 是记号不是字，照旧；校验中的「校」则查表 */}
        {verifying ? t("校") : <>{b?.glyph}{repaired ? <small aria-hidden="true">↻</small> : null}</>}
      </span>
      {show &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tipRef}
            className="cs-tip"
            role="tooltip"
            style={
              pos
                ? { top: pos.top, left: pos.left, visibility: "visible" }
                : { top: 0, left: 0, visibility: "hidden" }
            }
          >
            {tip}
            {lang === "en" && note ? <Said text={note} /> : null}
          </div>,
          document.body,
        )}
    </>
  );
}
