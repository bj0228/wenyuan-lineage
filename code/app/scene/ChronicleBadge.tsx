"use client";

import { useEffect, useState } from "react";
import { loadGanzhi, todayMark, headline, zhSameDay, dayToCn, ganzhiEn, LUNAR_MONTHS, LUNAR_MONTHS_EN, type ZhRecord } from "../world/chronicle";
import { useT, useLang } from "../i18n/lang";

/**
 * 日签 —— 题名旁边那一条「历史上的今天」。
 *
 * ## 为什么挂在题名旁边
 *
 * 纪时记事有一万七千余条，但人每天只需看见一条。故把一条摆在门楣上：进门抬眼即见
 * 今日日名与史上这一日的一件事，不必先想起去哪儿找。要看全的、要自己查的，点它
 * 进去（ChronicleLayer）。
 *
 * ## 每日换人，而非每次刷新换人
 *
 * 取的是今日干支那一片里、农历同月的一条（见 chronicle.ts 的 `zhSameDay` 与
 * `headline`）：按分数取前十二，再以甲子轮次取模定其一。于是同一日里刷几次都是
 * 同一条（页面不该每次刷新都变脸），而六十日后再逢此干支时换另一条。
 *
 * ## 签面报的是「农历某月 + 干支日」
 *
 * 两样都报，才对得上史书的纪日之法，也才筛得准：只报干支，六十日一轮的干支会把
 * 十二个月的同名之日一并捞来，答出一条七月的事而签上写着「今天」。
 *
 * 运行环境若不带农历（`todayMark().lunar` 为 null），或该格恰好无事，则退一步只报
 * 干支，签面改写作「史上壬申日」——不谎称同月同日。历法与月名的出入写在层里的
 * 历法小注上，签上只放一个 title 提示，不在门楣上长篇说理。
 */
export default function ChronicleBadge({ onOpen }: { onOpen: () => void }) {
  const t = useT();
  const en = useLang() === "en";
  const [today, setToday] = useState<ReturnType<typeof todayMark> | null>(null);
  const [rec, setRec] = useState<ZhRecord | null>(null);
  /** 农历月这一道筛子是否真用上了（环境不带农历、或该格无事则否） */
  const [monthOk, setMonthOk] = useState(false);
  /** 同月之中是否又撞上同日号或同干支（未撞上则签面只说「农历九月」，不加「这一日」） */
  const [dayOk, setDayOk] = useState(false);
  /** 取不到就只留日名那一行，不出错话——门楣上不是报错的地方 */
  const [dead, setDead] = useState(false);

  useEffect(() => {
    const mark = todayMark();
    setToday(mark);
    let live = true;
    loadGanzhi(mark.gzIndex).then(
      (s) => {
        if (!live) return;
        const { pool, monthMatched, dayMatched } = zhSameDay(
          s.records,
          mark.lunar?.month ?? null,
          mark.lunar?.day ?? null,
          mark.ganzhi,
        );
        setMonthOk(monthMatched);
        setDayOk(dayMatched);
        const h = headline(pool, mark.cycle);
        if (h) setRec(h);
        else setDead(true);
      },
      () => live && setDead(true),
    );
    return () => {
      live = false;
    };
  }, []);

  // 日名：同月之中日号或干支也筛上时报「农历九月初二壬申」，只筛上农历月时报
  // 「农历九月壬申」，都没筛上只报「壬申日」——口径随筛子实际用到的层改，不谎称同月同日。
  const mon = today?.lunar ? (en ? LUNAR_MONTHS_EN : LUNAR_MONTHS)[today.lunar.month] : "";
  const lunarDayCn = today?.lunar ? dayToCn(today.lunar.day) : "";
  // 干支日名英文作转写（「乙亥」→ yi-hai）：它是纪日的名，无可意译，但汉字摆在
  // 英文签上读不出来，故借其音。
  const gz = today ? (en ? ganzhiEn(today.ganzhi) : today.ganzhi) : "";
  const dayName = !today
    ? ""
    : monthOk && today.lunar
      ? dayOk
        ? t("农历{mon}{day}{gz}", {
            mon: today.lunar.leap ? t("闰{mon}", { mon }) : mon,
            day: en ? ` ${today.lunar.day}` : lunarDayCn,
            gz,
          })
        : t("农历{mon}{gz}", { mon: today.lunar.leap ? t("闰{mon}", { mon }) : mon, gz })
      : t("{gz}日", { gz });
  /**
   * 降级口径要等真降级了才用。
   *
   * `monthOk` 初值为 false（尚未取片，无从得知），若据此即写「史上这一日」，首屏会
   * 先写一句再跳成「历史上的今天」，白闪一下。故只在**已有结果而月份确实没筛上**时
   * 才改口——未取回之前仍称本名。
   */
  const degraded = (rec !== null || dead) && !monthOk;

  return (
    <button
      type="button"
      className="chr-badge"
      onClick={onOpen}
      title={
        degraded
          ? t("历史上的今天 · 四库与西方书里自带日期的记事。干支日六十日一轮、自殷商未断，故今日之干支与史上同一干支日是同一格。")
          : t("历史上的今天 · 四库与西方书里自带日期的记事。中土一侧按农历同月相认，同月之中再取同日号（五月初三日）或同干支（癸酉）者。")
      }
    >
      <i aria-hidden>今</i>
      <span className="chr-badge-copy">
        <em>
          {degraded ? t("史上这一日") : t("历史上的今天")}
          {dayName && <b>{dayName}</b>}
        </em>
        {rec ? (
          <span className="chr-badge-line">
            <s>{rec.text}</s>
            <u>
              《{t(rec.book)}》{rec.era ? ` · ${rec.era}` : ""}
            </u>
          </span>
        ) : (
          <span className="chr-badge-line">
            <s>{dead ? t("点此查日期、人名、事由") : t("正在翻检史上这一日……")}</s>
          </span>
        )}
      </span>
    </button>
  );
}
