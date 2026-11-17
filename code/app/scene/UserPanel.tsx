"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n/lang";
import { TITLES, highestTitle } from "../world/titles";
import { USER_GLYPH } from "../world/user";
import type { Seal } from "../world/seals";
import { scholars, scholarMap } from "../world/characters";
import { affinityDesc } from "../world/affinity";
import type { AffinityState } from "../world/affinity";

/**
 * 游学者档案（小浮层，复用 .quest-backdrop/.quest-layer）：
 * 字徽「客」＋可改名（失焦/回车存）＋连对徽 ＋ 称号墙（TITLES 阶梯，已解/未解分级、最高标「当前」）＋ 印章入口。
 * 不在地图里放用户小人——诸子仍可手移动（点空地令选中诸子前往），此面板只作顶栏头像之归。
 *
 * 导览册目从前也在这儿一栏，已迁到罗盘那一屏的圆钮「导」下（见 TourIndexPanel）：
 * 初学者最想找它的时候还没进世界，档案在那时点不到。
 */
export default function UserPanel({
  user,
  streak,
  seals,
  titles,
  affinity,
  onRename,
  onOpenSeals,
  onClose,
}: {
  user: { name: string };
  streak: number;
  seals: Seal[];
  titles: string[];
  affinity: AffinityState;
  onRename: (name: string) => void;
  onOpenSeals: () => void;
  onClose: () => void;
}) {
  // 此处 `t` 已被下方称号表（TITLES.map）占去，故译者取名 `tr`
  const tr = useT();
  const [draft, setDraft] = useState(user.name);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function commit() {
    const n = draft.trim();
    if (n && n !== user.name) onRename(n);
    else setDraft(user.name);
  }

  const highest = highestTitle(titles);

  return (
    <div className="quest-backdrop" onClick={onClose}>
      <div className="quest-layer user-panel" role="dialog" aria-label={tr("游学者档案")} onClick={(e) => e.stopPropagation()}>
        <header className="quest-head">
          <div>
            <p className="eyebrow">{tr("游学者 · {title}", { title: highest ? tr(highest.name) : tr("尚无名号") })}</p>
            <h2>{tr("客之档案")}</h2>
          </div>
          <button className="stage-close" onClick={onClose} aria-label={tr("关闭")}>×</button>
        </header>

        <div className="user-body">
          <div className="user-id">
            <div className="user-glyph">{USER_GLYPH}</div>
            <div className="user-id-right">
              <label className="user-name-label" htmlFor="user-name-input">{tr("名号")}</label>
              <input
                id="user-name-input"
                ref={inputRef}
                className="user-name-input"
                value={draft}
                maxLength={12}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                placeholder={tr("自取一名")}
              />
              <span className="streak-badge">{tr("连对")} <b>{streak}</b></span>
            </div>
          </div>

          <div className="seals-row">
            {/* 「印」那一字是枚朱记，是图不是字，两种语文都照原样（与榜、呈、市同例） */}
            <div className="seals-count"><i>印</i><b>×{seals.length}</b><small>{tr("枚印章")}</small></div>
            <button className="primary" onClick={onOpenSeals}>{tr("展开印章册 →")}</button>
          </div>

          <h3 className="title-wall-head">{tr("诸子交游 · 好感")}</h3>
          <div className="affinity-wall">
            {scholars.map((s) => {
              const v = affinity.userAff[s.id] ?? 0;
              return (
                <div key={s.id} className={`affinity-card ${v > 0 ? "on" : v < 0 ? "off" : ""}`}>
                  <i style={{ background: s.color }}>{s.glyph}</i>
                  <div>
                    <b>{tr(s.name)}</b>
                    <small>{tr(affinityDesc(v))}</small>
                  </div>
                  <span className="affinity-val">{v > 0 ? `+${v}` : v}</span>
                </div>
              );
            })}
          </div>

          <h3 className="title-wall-head">{tr("称号 · 连对解锁")}</h3>
          <div className="title-wall">
            {TITLES.map((t) => {
              const unlocked = titles.includes(t.id);
              const isHighest = highest?.id === t.id;
              return (
                <div key={t.id} className={`title-card ${unlocked ? "on" : "off"} ${isHighest ? "now" : ""}`}>
                  <div className="title-card-head">
                    <b>{tr(t.name)}</b>
                    {isHighest && <i className="title-now">{tr("当前")}</i>}
                  </div>
                  <p className="title-desc">{tr(t.desc)}</p>
                  {!unlocked && <span className="title-req">{tr("连对 {n} 解锁", { n: t.threshold })}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
