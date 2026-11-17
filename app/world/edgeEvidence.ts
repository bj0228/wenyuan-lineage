/**
 * 手写的边该拿什么原文作证。
 *
 * `lineage.ts` 那 166 条边是编者所断：谁师事谁、谁主张什么、哪两说相对立。断得
 * 再准，它仍只是一句断语——图上画一根线，读者无从知道凭什么画。此处管的就是这
 * 一问：**此断何据**。
 *
 * 曾走过一条歪路：按字面统计造边——某思想的字样在某书的若干段里出现过便连一条。
 * 撤掉了（缘由见 lineage.ts 「为何没有『书→思想』这一类边」）。要害在于，「这几
 * 个字出现过」既不是「这本书持有此主张」，也不是「这句话表达了此意思」。
 *
 * 所以这里反过来做：**边仍只出自手写，原文不拿来造边，只拿来给既有的边作证**，
 * 且作证那一路走语义而非字面。《孟子》通篇不连写「性善」二字，他写的是「人性之
 * 善也，犹水之就下也」——字面检索永远找不着，语义检索找得着。
 *
 * 一条边配什么样的证，按边型而异，分两路：
 *
 *   语义一路（`sem`）——拿一句话去 embed，在限定的范围里找意思相近的原文。
 *     「主张」「非」限在其人名下（这个思想得是**他的**）；「承变」「对立」不限人
 *     （要找的是两说并见之处）；「注解」限在注者那部书里。
 *
 *   互见一路（`mention`）——人与人之间的边（师承/出于/影响/交游），证不在义理而
 *     在称述：《孟子》里提到杨朱几段、提到哪几段。这一路不检索，直接取图谱里
 *     `bookPerson` 那张表（见 sikuGraph），是从一万余段原文里统计出来的事实。
 *
 * 两路都可能空手而回。空手就说空手——面板上照实写「检不出可作证的原文」，不拿
 * 沾边的句子来凑。凑出来的「据」比没有据更坏。
 *
 * 另有两处是检索不该越的界，`caveat` 里都写明了：
 *   一、检索认得出「这段在说此事」，认不出「他是赞成还是反对」。故「非」类边检
 *       出的只是他论及此说之处，是非是从要看文自断。
 *   二、「承变」「对立」检出的是两说并见的段落，并见不等于相承或相对。
 */

import { BOOKS, bookOf, ideaOf, nameOf, type EdgeType } from "./lineage";

/** 语义那一路的一道查询：拿什么话、在哪个范围里找。 */
export type EvidenceQuery = {
  /** 送去 embed 的话。多取思想的释义而非光秃一个词——「四端固有，性本善」比「性善」检得准得多。 */
  q: string;
  /** 限在此人名下的选本条目里（比对 `Passage.owner`）。空则不限人。 */
  scholarId?: string;
  /**
   * 全文那一路限在哪几部书里（比对 `Passage.book`，即书名）。
   *
   * 列的是**此断该由哪几部书来证**，按 `BOOKS.authorId` 取其人名下之书；不是
   * 「这几部已在手」。全文池实有哪几部由调用方比对（它手里才有已载入的段落），
   * 交集为空便不检全文、照实说明——不可退作不限书的全检：拿《论语》的段落去证
   * 朱熹主张格物致知，是张冠李戴，比检不出更坏。此事确会发生——图里有二十八位
   * 汉以后的著者（朱熹、曹雪芹…），他们名下无先秦之书；《惠子》《邹子》《苏子》
   * 《张子》《杨子》《神农之言》《大学》七部亦无分片可取。
   *
   * `undefined` 则不限书。只「承变」「对立」用：那两类边要找的本是两说并见之处，
   * 不属哪一人，故无须限。
   */
  books?: string[];
  /** 面板上标这一路叫什么 */
  label: string;
  /** `label` 里的填充值（与 `EdgePlan.vars` 同故，见那里的注）。 */
  labelVars?: Record<string, string>;
};

/**
 * 互见那一路的一道查：哪部书里提到了谁。书名为空则不限书。
 *
 * 带 `personId` 而不只带名字，是因为书里怎么称呼他与我们怎么叫他未必一致
 * （见 `PERSON_ALIASES`）——查的时候要把几种称谓挨个试过。
 */
export type MentionQuery = { personId: string; person: string; bookTitle?: string };

export type EdgePlan = {
  /** 这条边该由什么样的原文来证。面板第一行就说它，读者才知道下面几句在证什么。 */
  why: string;
  /**
   * `why`/`caveat`/`sem.label` 里的填充值。
   *
   * 这几句都夹着人名与思想名，从前是用模板字面量直接拼死的（`「主张」谓此说是孟子
   * 所持。…`），于是每一条边都成了一句独有的话，`t()` 在词表里永不可能查着——英文
   * 模式下这一面板整片都落回中文。故改作「键 + 占位符」：句子留作可译之键，名字由
   * 此处填。中文模式 `t(zh, vars)` 把 `{k}` 原样填回，上屏之字与从前一字不差。
   *
   * 名字自身亦须经 `t()`（故此处存的是中文名，不是译名）——调用方填之前先译。
   */
  vars?: Record<string, string>;
  /** 检索够不着的地方。有则必显，不能让人把检索结果当判据。 */
  caveat?: string;
  sem: EvidenceQuery | null;
  mention: MentionQuery[];
};

/**
 * 全文池里没有他的书时，面板上要显的那句话。
 *
 * 不可只显「检不出」——那会让人以为是查无此说，其实是无处可查。
 */
export const NO_BOOK_NOTE =
  "全文池里没有他名下的书（只铺到先秦二十六部，汉以后的著者与几部无分片之书不在内），故此处只有选本那一路。检不出不等于无此说。";

/**
 * 两池都没有他的时候，面板上要显的那句话。
 *
 * 图上有二十八位汉以后的著者（朱熹、曹雪芹、王国维…），全文池不收他们的书（只
 * 铺到先秦二十六部），选本池也没有他们的条目（那七百八十一条是诸子语录）。于是
 * 这二十九条「主张」边两路皆无处可去——这与「检遍了而检不出」是两件事，必须分
 * 开说：前者是此处无从查证，后者才是查无此说。断语仍立，据暂付阙。
 */
export const NOWHERE_NOTE =
  "此人两池皆无：全文池只铺到先秦二十六部，选本池收的是诸子语录，都没有他的文字。故此断暂无原文可验——不是查无此说，是此处无从查证。";

/**
 * 图谱里抽出来的人名与 `characters.ts` 的称谓对不齐的那几个。
 *
 * 抽取是从原文里认人名，认得的是书里怎么称呼他：《韩非子》称申不害作「申子」，
 * 《孟子》称曾子作「曾参」的时候也有。不改抽取那一边（原文称谓本就该照原样留着），
 * 在这里备一张别名表，查互见时挨个试。
 *
 * 表里没有的人（荀子、苏秦、商鞅、邹衍…）互见便查不着——不是漏了，是二十六部
 * 原文里本就没有以那个名字称述他的段落。查不着就显「未见互见」，不编。
 */
const PERSON_ALIASES: Record<string, string[]> = {
  kong: ["孔子", "夫子", "仲尼"],
  meng: ["孟子"],
  mo: ["墨子"],
  zhuang: ["庄子"],
  laozi: ["老子"],
  liezi: ["列子"],
  yangzhu: ["杨朱"],
  huishi: ["惠施"],
  zengzi: ["曾子", "曾参"],
  zisi: ["子思"],
  guanzhong: ["管仲", "管子"],
  wuqi: ["吴起", "吴子"],
  dengxi: ["邓析"],
  yinwen: ["尹文"],
  weiliao: ["尉缭"],
  lvwang: ["吕望"],
  wenzi: ["文子"],
  gongsun: ["公孙龙"],
  shenbuhai: ["申不害", "申子"],
};

/** 此人在原文里可能的几种称谓，头一个是本名。 */
export function personAliases(scholarId: string): string[] {
  const alias = PERSON_ALIASES[scholarId];
  if (alias) return alias;
  const n = nameOf(scholarId);
  return n && n !== scholarId ? [n] : [];
}

/** 此人名下的书（按 `BOOKS.authorId`）。一人可有数书，如曾子之《大学》《孝经》。 */
export function booksByAuthor(scholarId: string): string[] {
  return BOOKS.filter((b) => b.authorId === scholarId).map((b) => b.name);
}

/** 思想节点的检索用语：名 ＋ 释义。释义是这一路检得准的关键，见 `EvidenceQuery.q`。 */
function ideaQuery(id: string): string {
  const it = ideaOf(id);
  if (!it) return "";
  return it.note ? `${it.name}。${it.note}` : it.name;
}

/**
 * 一条边配什么证。
 *
 * `from`/`to` 的方向按 `LINEAGE_EDGES` 的约定：表「to 师承/出于/受影响于 from」，
 * 而「主张」「著述」「非」是 from 发出（人→思想、人→书）。
 */
export function planFor(edge: { from: string; to: string; type: EdgeType }): EdgePlan {
  const { from, to, type } = edge;

  switch (type) {
    // —— 人→书。书目上的事实，不待原文作证：书本身就在图上，点开即是它的全文。
    case "著述":
      return {
        why: "著述是书目上的事实，不待原文作证——点开那部书即见其文。",
        sem: null,
        mention: [],
      };

    // —— 人→人。证不在义理而在称述：后出者书中提到前者几段。
    case "师承":
    case "出于":
    case "影响":
    case "交游": {
      const whyOf: Record<string, string> = {
        师承: "师承之证，在弟子书中称述其师。",
        出于: "「出于」谓此家自彼家出，其证在后出者书中对前者的因革——既承其问，又变其答。",
        影响: "影响之证，在受者书中承用、辩驳或改写施者之说。",
        交游: "交游之证，在两人书中互见其名。",
      };
      // 交游无先后，两头都查；其余只查后出者那一头（弟子书中称师，不是师书中称弟子）。
      const mention: MentionQuery[] =
        type === "交游"
          ? [
              ...booksByAuthor(to).map((bk) => ({ personId: from, person: nameOf(from), bookTitle: bk })),
              ...booksByAuthor(from).map((bk) => ({ personId: to, person: nameOf(to), bookTitle: bk })),
            ]
          : booksByAuthor(to).map((bk) => ({ personId: from, person: nameOf(from), bookTitle: bk }));
      return {
        why: whyOf[type] ?? "",
        // 互见之外再检一道语义：称其名的段落未必提到他的主张，提到他主张的段落
        // 也未必称其名。两路各管一头。
        sem: {
          q: nameOf(from),
          scholarId: to,
          books: booksByAuthor(to),
          label: "{to}书中论及{from}处",
          labelVars: { to: nameOf(to), from: nameOf(from) },
        },
        mention,
      };
    }

    // —— 人→思想。这一路是全表的大头（主张 75 条），也是「思想必须是这个人的」
    //    那句话的落点：限在他名下找，找不着便是找不着。
    case "主张":
      return {
        why: "「主张」谓此说是{from}所持。其证当在他自家书里讲这件事的那几句——不是别人替他说的，也不是这几个字碰巧出现过。",
        vars: { from: nameOf(from) },
        sem: {
          q: ideaQuery(to),
          scholarId: from,
          books: booksByAuthor(from),
          label: "{from}书中言此处",
          labelVars: { from: nameOf(from) },
        },
        mention: [],
      };

    case "非":
      return {
        why: "「非」谓{from}斥此说。其证当在他自家书里驳这件事的那几句。",
        vars: { from: nameOf(from) },
        caveat: "检索认得出「这段在说此事」，认不出「他是赞成还是反对」。下面几句是他论及此说之处，是非是从，看文自断。",
        sem: {
          q: ideaQuery(to),
          scholarId: from,
          books: booksByAuthor(from),
          label: "{from}书中论及{idea}处",
          labelVars: { from: nameOf(from), idea: ideaOf(to)?.name ?? "" },
        },
        mention: [],
      };

    // —— 思想→思想。不限人：要找的是两说并见、可相参照之处。
    case "承变":
    case "对立": {
      const a = ideaOf(from)?.name ?? "";
      const b = ideaOf(to)?.name ?? "";
      return {
        why:
          type === "承变"
            ? "「承变」谓{b}自{a}来而有所变。其证当在两说并见、可见其因革之处。"
            : "「对立」谓{a}与{b}相抵。其证当在两说并见、可见其相攻之处。",
        vars: { a, b },
        caveat: "并见不等于相承或相对。下面是两说同在一段的几处，承变与否仍须读文乃定。",
        // 不传 books：这两类边要找的是两说并见之处，不属哪一人，故不限书
        sem: { q: `${ideaQuery(from)} ${ideaQuery(to)}`, label: "{a}与{b}并见处", labelVars: { a, b } },
        mention: [],
      };
    }

    // —— 书→书。注者书中解说所注之书，《韩非子·解老》《喻老》是最整齐的一例。
    case "注解": {
      const annotator = bookOf(from)?.name ?? "";
      const target = bookOf(to)?.name ?? "";
      const targetAuthor = bookOf(to)?.authorId ?? "";
      return {
        why: "注解之证，在《{annotator}》中解说《{target}》之处。",
        vars: { annotator, target },
        sem: {
          q: `${target} ${nameOf(targetAuthor)}`,
          books: [annotator],
          label: "《{annotator}》中及《{target}》处",
          labelVars: { annotator, target },
        },
        mention: targetAuthor ? [{ personId: targetAuthor, person: nameOf(targetAuthor), bookTitle: annotator }] : [],
      };
    }
  }
}
