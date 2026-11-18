"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { EN } from "./en";

/**
 * 界面语言（第一层：界面骨架）。
 *
 * 此层只管**界面文字**——按钮、栏目、提示。典籍原文、诸子发言、策展题解各有各的
 * 办法，不在这里：原文永不替换（英文只作小字附注），生成的话语仍中文生成、另行呈现。
 * 故这一层不叫「翻译系统」，叫「界面词表」。
 *
 * ## 为何以中文原文作 key
 *
 * 词表的 key 就是源码里那句中文本身（`t("跨媒介点评")`），不另发明 `nav.crossmedia`
 * 一类的键名。三样好处，都是为「别影响中文版」这条硬约束服务的：
 *
 *  1. **中文模式是恒等函数**。`lang === "zh"` 时 `t(s)` 原样返回 `s`，连查表都不查。
 *     中文版的渲染结果与改造前逐字节相同——不是「测过没问题」，是结构上不可能不同。
 *  2. **漏译自动回落中文**，而非露出 `missing.key.foo`。评审面前最怕的是这个。
 *  3. **diff 可读**。`t("收起自呈")` 一眼知道这里原来写的是什么，不必跳到词表去查。
 *
 * 代价是同一句中文在不同处若该译成不同英文，词表区分不开。真遇上了便在中文侧加一个
 * 不影响观感的区别（如「条」与「条目」），而不是改回键名制——键名制的维护成本会落在
 * 每一个新写的组件上。
 *
 * ## 为何用模块级 store 而非 Context
 *
 * 四十五个组件都要用，套 Provider 就得动 `layout.tsx` 与每一条渲染路径；模块级 store
 * 配 `useSyncExternalStore` 则谁要谁取，一个组件也不必改签名。改动面越小，中文版越安全。
 *
 * ## 水合
 *
 * 初值一律 `"zh"`（服务端与客户端首帧都是中文），挂载后才由 `bootLang()` 自 localStorage
 * 读回用户的选择。故不存在 SSR 与首帧不一致：英文用户会看见中文一帧即切英文，
 * 这点代价换一个绝不报水合错的中文版，值得。
 */

export type Lang = "zh" | "en";

const STORAGE_KEY = "zhuzi-lang";

let lang: Lang = "zh";
const subs = new Set<() => void>();

function emit() {
  subs.forEach((f) => f());
}

function subscribe(f: () => void) {
  subs.add(f);
  return () => subs.delete(f);
}

function snapshot(): Lang {
  return lang;
}

/** 服务端快照恒为中文——与初值一致，故无水合不匹配 */
function serverSnapshot(): Lang {
  return "zh";
}

export function getLang(): Lang {
  return lang;
}

/** 是否已有明确的界面语言选择；首次进入门页据此决定是否出现。 */
export function hasSavedLang(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "zh" || saved === "en";
  } catch {
    return false;
  }
}

/** 站名：与 layout.tsx 的 metadata.title 同一个字串，换语言时据此改标签页 */
const TITLE = "文渊寻脉";

export function setLang(next: Lang) {
  const changed = next !== lang;
  lang = next;
  if (typeof document !== "undefined") {
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    // 标签页上那几个字也跟着改。它由 layout.tsx 的 metadata 发出，那是服务端的事，
    // 发的时候还不知道这位客选了哪种语言（语言存在 localStorage 里），故只能在此补一手。
    document.title = next === "en" ? EN[TITLE] ?? TITLE : TITLE;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* 配额满或被禁用：内存态仍可用，只是刷新后回到中文 */
  }
  if (changed) emit();
}

/**
 * 挂载后自 localStorage 取回上次的选择。
 * 由根组件调一次即可（见 `useLangBoot`）；存的不是 "en" 就什么也不做，
 * 故中文用户这条路上连一次 setState 都不会触发。
 */
export function bootLang() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "en") setLang("en");
  } catch {
    /* 读不到就按中文 */
  }
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** 根组件调一次：挂载后取回上次选的语言。中文用户这条路上什么也不会发生。 */
export function useLangBoot() {
  useEffect(() => {
    bootLang();
  }, []);
}

/**
 * 取译者。`t(zh)` 中文模式原样返回；英文模式查词表，查不到仍返回中文（绝不露键名）。
 *
 * 第二个参数是占位符填充，给「共 {n} 条」这类夹数字的句子用——英文语序与中文不同
 * （「共 98 条」要作 "98 in all"），故不能把句子拆成「共」「条」两段分别译。
 */
export function useT() {
  const l = useLang();
  return useCallback(
    (zh: string, vars?: Record<string, string | number>) => {
      const out = l === "en" ? EN[zh] ?? zh : zh;
      if (!vars) return out;
      return out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    },
    [l],
  );
}
