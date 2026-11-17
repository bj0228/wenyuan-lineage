"use client";

import { useLang, setLang } from "./lang";

/**
 * 中英切换钮 —— 压在题名旁边的一枚小牌。
 *
 * 做成「两格一牌」而非一枚按钮：两格并列（中／EN），当前那格着朱、另一格淡墨，
 * 点另一格即切。比单钮好的地方是**不必猜**——单钮上写「EN」时，不知是「现在是英文」
 * 还是「点了变英文」；两格并列则现状与去处同时在眼前，无歧义。
 *
 * 位置在 `.brand-copy` 之后（罗盘入口屏与世界顶栏两处结构相同），故样式上它
 * 贴着题名的基线走，不自立一行。朱砂只上一格，守「素纸淡墨、少量朱砂」的调子。
 *
 * 切换是整站即时的——`setLang` 推模块级 store，所有 `useT()` 的组件同帧重渲染，
 * 不刷新、不丢对话记录（记录在 React state 里，与语言无关）。
 */
export default function LangToggle() {
  const lang = useLang();
  return (
    <div className="lang-tog" role="group" aria-label="界面语言 / Interface language">
      <button
        type="button"
        className={lang === "zh" ? "on" : ""}
        aria-pressed={lang === "zh"}
        onClick={() => setLang("zh")}
        title="中文界面"
      >
        中
      </button>
      <span aria-hidden>·</span>
      <button
        type="button"
        className={lang === "en" ? "on" : ""}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
        title="English interface"
      >
        EN
      </button>
    </div>
  );
}
