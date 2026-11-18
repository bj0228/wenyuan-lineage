"use client";

import type { Lang } from "../i18n/lang";

type Props = {
  onChoose: (lang: Lang) => void;
};

/**
 * 首次访问的语言门页。
 *
 * 这里故意不用当前界面语言：用户尚未作出选择，所以所有必要信息都并列呈现为中英文。
 * 选择后由 page 先落语言偏好，再放行新手导览。
 */
export default function LanguageGate({ onChoose }: Props) {
  return (
    <div className="lang-gate" role="dialog" aria-modal="true" aria-labelledby="lang-gate-title">
      <section className="lang-gate-card">
        <div className="lang-gate-seal" aria-hidden>脈</div>
        <p className="lang-gate-kicker">文渊寻脉 · Wenyuan Lineage</p>
        <h2 id="lang-gate-title">
          选择界面语言
          <small>Choose your language</small>
        </h2>
        <p className="lang-gate-note">
          选择后，将以相应语言开始系统导览。
          <span>The guided tour will begin in your selected language.</span>
        </p>
        <div className="lang-gate-actions" role="group" aria-label="选择语言 / Choose a language">
          <button type="button" lang="zh-CN" onClick={() => onChoose("zh")}>
            <b>中文</b>
            <span>进入中文导览</span>
          </button>
          <button type="button" lang="en" onClick={() => onChoose("en")}>
            <b>English</b>
            <span>Start the English tour</span>
          </button>
        </div>
      </section>
    </div>
  );
}
