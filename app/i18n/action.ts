"use client";

import { useCallback } from "react";
import { useLang, useT } from "./lang";

/**
 * 动作句的译法（界面词表的一条支路）。
 *
 * ## 为何不能只靠词表
 *
 * 诸子头顶与档案里那句「此刻正在做什么」，不是写死的一句话，是**拼出来的**：
 * `schedule.ts` 以 `正在` 冠在日程的动作内核之前（无日程则冠在 `characters.ts` 的
 * `idle` 之前），户外遇雨雪雾再加一层天气前缀（`climateAction`）。故同一个内核
 * 「讲学」，在界面上可作「正在讲学」「正在雾中讲学」「正在冒雨讲学」「正在踏雪讲学」
 * 四个样子。内核一百余个、天气三种，若全作词条收进 `en.ts`，是四百余条**乘出来的**
 * 词——而其中三份只差一个前缀。
 *
 * 故此处把那一层前缀**拆开**译：内核照旧查词表（`正在讲学` 这一条是收了的），
 * 天气另查一条短词（`雾中`），末了以一句模板合起来。词表只需收内核与三个天气词，
 * 加法而非乘法。
 *
 * ## 为何中文模式要早返
 *
 * `lang.ts` 的硬约束是「中文模式下 `t()` 是恒等函数」，故中文版渲染结果与改造前
 * 逐字节相同。这条支路若也走拼接，中文模式便会把「正在雾中讲学」拆了再合成
 * 「正在讲学（雾中）」——同一个意思，但**不是同一串字**，那条约束就破了。
 * 故 `lang === "zh"` 时原样返回，连正则都不跑。
 *
 * ## `驻于`
 *
 * 另一路是手动落点后的「驻于某地」（`page.tsx` 按最近区域现拼）。同理：区域名查词表，
 * 「驻于」作模板。
 */

/** 天气前缀：与 `schedule.ts` 的 `WEATHER_PREFIX` 一一对应，改那边须改这边 */
const WEATHER_PREFIX = ["雾中", "冒雨", "踏雪"] as const;

/**
 * 取动作句的译者。
 *
 * 中文模式恒等返回。英文模式依次试三条路：
 *  1. 天气前缀式（`正在雾中讲学`）——剥去前缀译内核，再以模板合上天气；
 *  2. 驻于式（`驻于杏坛`）——区域名查表，「驻于」作模板；
 *  3. 整句查表（`正在讲学`、`正在集门客论学`）——查不到仍返回中文，不露键名。
 */
export function useTAction() {
  const lang = useLang();
  const t = useT();
  return useCallback(
    (action: string) => {
      // 中文模式：原样奉还，不拼不拆（见顶注）
      if (lang === "zh") return action;

      for (const w of WEATHER_PREFIX) {
        if (action.startsWith(`正在${w}`)) {
          const kernel = action.slice(2 + w.length);
          return t("{action}（{weather}）", { action: t(`正在${kernel}`), weather: t(w) });
        }
      }

      if (action.startsWith("驻于")) {
        return t("驻于{region}", { region: t(action.slice(2)) });
      }

      return t(action);
    },
    [lang, t],
  );
}

/**
 * 同一句动作，但去掉「正在」——给「附近的人」那一行的小字用（那里已有人名在前，
 * 再说一遍「正在」太啰嗦）。
 *
 * 中文模式与原先的 `action.replace("正在", "")` 逐字相同。英文模式则不必剥：
 * 译文本就不以 "Now" 起头（词表里 `正在{action}` 的英文值即 `{action}`），
 * 故译完直接给出。
 */
export function useTActionBare() {
  const lang = useLang();
  const tAction = useTAction();
  return useCallback(
    (action: string) => (lang === "zh" ? action.replace("正在", "") : tAction(action)),
    [lang, tAction],
  );
}
