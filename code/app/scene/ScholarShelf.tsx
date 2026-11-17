"use client";

import { useEffect, useMemo, useState } from "react";
import { BOOKS, SCHOOLS } from "../world/lineage";
import { scholarMap } from "../world/characters";
import { CANON_FULL } from "../world/canonFull";
import { loadScholarBooks, type ScholarBook } from "../world/canonSource";
import { useT } from "../i18n/lang";

/**
 * 典籍架 —— 诸子名下的书，按家分列。
 *
 * 先前架上是随包带的那五部（论语、道德经、孙子兵法、大学、中庸）。那五部是「引典所
 * 本」的全文语料，不是一张书目：诸子二十余人，名下的书四库正文都已切出，架上却只见
 * 五部，看着像十家只有五部书。故改为照实列——名单取 `canonSource.loadScholarBooks()`
 * （即 BOOKS ∩ 四库可读），点一部便入四库该书逐章读。
 *
 * 为何按家分列而不平铺二十六枚：平铺是一片书名，看不出法家有六部、兵家有七部这件事；
 * 而「哪一家书多」本身就是诸子学的一条消息。家名、家色皆取 `SCHOOLS`，与脉络图、
 * 图谱同一条色脉，不另配色。
 *
 * 家属取 `lineage.ts` 的 BOOKS，不用四库的类目：四库把公孙龙子、尹文子、慎子、墨子
 * 一概归「杂家」，鬼谷子归「兵家」——那是编目之便，不是学派之实。
 *
 * 《大学》《中庸》另置架末：四库无此二部单行（皆《礼记》之篇），只有随包带的全文，
 * 故仍走逐句读那一路（有白话、可注、可请诸子批注）。此节照 CANON_FULL 与架上书名相
 * 减算出，哪日这二篇也切成单行本，自会从架末消失。
 */
export default function ScholarShelf({
  onOpenSiku,
  onOpenVerse,
}: {
  /** 入四库读某书（逐章、可译白话、可挂边批） */
  onOpenSiku: (bookId: string) => void;
  /** 读随包带的全文（逐句、带白话、可注） */
  onOpenVerse: (bookId: string) => void;
}) {
  const [books, setBooks] = useState<ScholarBook[] | null>(null);
  const t = useT();

  useEffect(() => {
    let live = true;
    loadScholarBooks().then((bs) => {
      if (live) setBooks(bs);
    });
    return () => {
      live = false;
    };
  }, []);

  // 四库题名偶带括注（《道德经（老子）》），脉络表只作《道德经》；比对书名时去括注
  const bare = (t: string) => t.replace(/（[^）]*）/g, "");

  const groups = useMemo(() => {
    if (!books) return [];
    const byName = new Map(BOOKS.map((b) => [b.name, b]));
    const rows = books.map((b) => {
      const lin = byName.get(bare(b.title));
      return {
        ...b,
        schoolId: lin?.schoolId ?? "za",
        bc: lin?.bc ?? 0,
        note: lin?.note ?? "",
        who: scholarMap[b.authorIds[0] ?? ""]?.name ?? b.author,
      };
    });
    return SCHOOLS.map((s) => ({
      ...s,
      books: rows.filter((r) => r.schoolId === s.id).sort((a, b) => b.bc - a.bc),
    })).filter((s) => s.books.length > 0);
  }, [books]);

  // 架上已有者不必再于架末重列（《论语》《道德经》《孙子兵法》四库皆有单行本）
  const appendix = useMemo(() => {
    if (!books) return [];
    const on = new Set(books.map((b) => bare(b.title)));
    return CANON_FULL.filter((b) => !on.has(b.name));
  }, [books]);

  if (!books) return <p className="intro">{t("书目取中……")}</p>;
  if (books.length === 0)
    return <p className="intro">{t("书目未取得（四库分片未就或网络不通）；引典仍可检手写选本。")}</p>;

  const total = groups.reduce((n, g) => n + g.books.length, 0);

  return (
    <>
      <p className="intro">
        {t("诸子名下之书，四库正文已切者 {n} 部，按家分列；点一部即逐章读，可译白话、可挂边批。", { n: total })}
      </p>
      <div className="shelf-schools">
        {groups.map((g) => (
          <section className="shelf-school" key={g.id}>
            <h4 className="shelf-school-head">
              <i style={{ background: g.color }} />
              {t(g.name)}
              <small>{t("{n} 部", { n: g.books.length })}</small>
            </h4>
            <div className="shelf">
              {g.books.map((b) => (
                <button
                  key={b.bookId}
                  className="ghost-btn shelf-book"
                  style={{ borderLeftColor: g.color }}
                  title={t("{note}（{dynasty}·{category}，{items} 段可引）", {
                    note: t(b.note), dynasty: t(b.dynasty), category: t(b.category), items: b.items,
                  })}
                  onClick={() => onOpenSiku(b.bookId)}
                >
                  <b>{t(b.title)}</b>
                  <small>
                    {t("{who} · {n} 章", { who: t(b.who), n: b.chapters })}
                  </small>
                </button>
              ))}
            </div>
          </section>
        ))}
        {appendix.length > 0 && (
          <section className="shelf-school">
            <h4 className="shelf-school-head">
              <i style={{ background: "#9a7b4a" }} />
              {t("附·《礼记》之篇")}
              <small>{t("逐句读")}</small>
            </h4>
            <div className="shelf">
              {appendix.map((b) => (
                <button
                  key={b.id}
                  className="ghost-btn shelf-book"
                  style={{ borderLeftColor: "#9a7b4a" }}
                  title={t("四库无单行本，此为随包带的全文：逐句有白话，可注、可请诸子批注")}
                  onClick={() => onOpenVerse(b.id)}
                >
                  <b>{t(b.name)}</b>
                  {/* 此处不题著者：《大学》相传曾子、《中庸》相传子思，皆「相传」而已，
                      CANON_FULL 一概记在孔子名下，列出来反倒是错的。只记出处与章数。 */}
                  <small>{t("《礼记》篇 · {n} 章", { n: b.chapters.length })}</small>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
