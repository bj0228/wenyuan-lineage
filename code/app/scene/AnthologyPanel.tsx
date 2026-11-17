"use client";

import { useState } from "react";
import type { AnthologyEntry } from "../world/anthology";
import { exportBambooPng, shareOrDownloadPng, yuluFilename } from "../world/bambooPng";
import BambooScroll from "./BambooScroll";
import { useT } from "../i18n/lang";

/**
 * 语录标签页：列出已藏入竹简的圆桌辩论。每条卡片展开见竖排竹简（含逐段配音回放），
 * 脚部可导出长卷 PNG（强制下载）、分享（系统分享面板／落下载）、删除。
 * entries/remove 由 page 持有的 useAnthology() 透传，保证与 DebateStage 的 onArchive 同源。
 */
export default function AnthologyPanel({
  entries,
  onRemove,
}: {
  entries: AnthologyEntry[];
  onRemove: (id: string) => void;
}) {
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  /** 正在誊抄为 PNG 的条目 id，禁用按钮并显"正在誊抄…" */
  const [busyId, setBusyId] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="profile-panel">
        <p className="eyebrow">{t("诸子语录")}</p>
        <h2>{t("藏之竹简")}</h2>
        <p className="intro">{t("尚未藏入竹简。于辩论席开一场圆桌、辩毕点「藏之竹简」即可在此展卷。")}</p>
      </div>
    );
  }

  async function exportPng(entry: AnthologyEntry, download: boolean) {
    if (busyId) return;
    setBusyId(entry.id);
    try {
      const blob = await exportBambooPng(entry);
      await shareOrDownloadPng(blob, yuluFilename(entry), { download });
    } catch {
      /* canvas 不可用或 toBlob 失败 → 静默放弃，按钮恢复可点 */
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="profile-panel">
      <p className="eyebrow">{t("诸子语录")}</p>
      <h2>{t("藏之竹简")}</h2>
      <p className="intro">{t("每场圆桌辩论辩毕可藏入竹简，按日期＋议题命名；展卷可逐段配音回放，亦可导出长卷 PNG 分享。")}</p>
      <div className="yulu-list">
        {entries.map((e) => {
          const open = openId === e.id;
          const busy = busyId === e.id;
          return (
            <article key={e.id} className={`yulu-card${open ? " open" : ""}`}>
              <button className="yulu-head" onClick={() => setOpenId(open ? null : e.id)} aria-expanded={open}>
                <div className="yulu-people">
                  {e.participants.map((p) => (
                    <i key={p.id} style={{ background: p.color }} title={t("{name}·{school}", { name: t(p.name), school: t(p.school) })}>{p.glyph}</i>
                  ))}
                </div>
                <div className="yulu-meta">
                  <b>{t(e.topic)}</b>
                  {/* 日子照数字走，时辰与「圆桌辩论」四字查表 */}
                  <small>{e.date}　{t(e.shichen)}　{t(e.kind)}</small>
                </div>
                <span className="yulu-chev" aria-hidden>{open ? "▾" : "▸"}</span>
              </button>

              {open && (
                <div className="yulu-body">
                  <BambooScroll entry={e} />
                  <div className="yulu-foot">
                    <button onClick={() => exportPng(e, true)} disabled={busy}>
                      {busy ? t("正在誊抄…") : t("导出长卷 PNG")}
                    </button>
                    <button onClick={() => exportPng(e, false)} disabled={busy}>{t("分享")}</button>
                    <button className="danger" onClick={() => onRemove(e.id)} disabled={busy}>{t("删除")}</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
