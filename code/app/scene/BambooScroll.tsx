"use client";

import SpeakButton from "./SpeakButton";
import type { AnthologyEntry } from "../world/anthology";
import { useT } from "../i18n/lang";

/**
 * 竹简竖排长卷（交互视图）：每位发言者独占一列竹简片。
 * 容器为 flex row-reverse（首列最右、自右向左读、横向滚动）；每列 `writing-mode: vertical-rl`
 * 竖排，底色按该子色相微染、名头同色——故诸子之语各占其列、颜色有别、一目可辨。
 * 轮次以一列紫色题签相隔；末附主持人吕不韦收束（紫染）。导出另走 `bambooPng.ts` 的 canvas（同款染色）。
 */
export default function BambooScroll({ entry }: { entry: AnthologyEntry }) {
  // 题签与标目查表；简上的话两种语文都照中文（竖排一列容不下第二种语文，
  // 且那些话本就是自中文典籍检出的——其英译在学宫与辩论席上看得到）
  // 此处 `t` 已被下方每轮发言（r.turns.map）占去，故译者取名 `tr`
  const tr = useT();
  return (
    <div className="yulu-scroll" role="article" aria-label={tr("{date} {topic} 语录", { date: entry.date, topic: tr(entry.topic) })}>
      {/* 题签列：日期 / 时辰 / 议题 / 参与人 */}
      <div className="yulu-slat yulu-slat-title">
        <b className="yulu-cap">{tr("语录")}</b>
        <span className="yulu-slat-body">{entry.date}　{tr(entry.shichen)}</span>
        <span className="yulu-slat-body">{tr("议题　{topic}", { topic: tr(entry.topic) })}</span>
        <span className="yulu-slat-body">
          {tr("参与")}
          {entry.participants.map((p) => (
            <span key={p.id} className="yulu-person" style={{ "--p": p.color } as React.CSSProperties}>
              <i style={{ background: p.color }}>{p.glyph}</i>
              {tr(p.name)}
            </span>
          ))}
        </span>
      </div>

      {entry.rounds.flatMap((r) => [
        <div key={`${r.round}-h`} className="yulu-slat yulu-slat-round">
          <b className="yulu-cap">{tr(r.round)}</b>
        </div>,
        ...r.turns.map((t, ti) => (
          <div
            key={`${r.round}-${ti}`}
            className="yulu-slat yulu-slat-turn"
            style={{ "--accent": t.color, "--tint": t.color } as React.CSSProperties}
          >
            <i style={{ background: t.color }}>{t.glyph}</i>
            <b className="yulu-cap" style={{ color: t.color }}>{tr("{name}曰", { name: tr(t.name) })}</b>
            <span className="speak-slot" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
              <SpeakButton text={t.text} scholarId={t.scholarId} />
            </span>
            <span className="yulu-slat-body">{t.text}</span>
            {t.vernacular ? <span className="yulu-vern">{tr("　白话：{text}", { text: t.vernacular })}</span> : null}
            {t.verdict ? <span className={`yulu-vd yulu-vd-${t.verdict}`}>{tr("〔{verdict}〕", { verdict: tr(t.verdict) })}</span> : null}
          </div>
        )),
      ])}

      {entry.hostLine ? (
        <div className="yulu-slat yulu-slat-host" style={{ "--accent": "#5a3a7a", "--tint": "#5a3a7a" } as React.CSSProperties}>
          <b className="yulu-cap" style={{ color: "#5a3a7a" }}>{tr("吕不韦")}</b>
          <span className="speak-slot" onClick={(e) => e.stopPropagation()}>
            <SpeakButton text={entry.hostLine} scholarId="lvbuwei" />
          </span>
          <span className="yulu-slat-body">{entry.hostLine}</span>
        </div>
      ) : null}
    </div>
  );
}
