#!/usr/bin/env python3
"""从二十六部全文长出知识图谱：书、人、概念三类节点，三类边。

## 为何要这一步

图谱现在吃的是两张**手写表**：`lineage.ts` 的 BOOKS（36 条）与 IDEAS（73 条），
`sikuLineage.ts` 的 SIKU_EDGES（传/承/采/驳/并/续，几十条）。手写的好处是准，
坏处是它与书里实际写了什么无关——《管子》一千六百余段讲了些什么，那张表并不知道；
加一部书、改一次抽取，表也不会跟着动。

既然 `siku_terms.py` 已经把词与权算定，图谱就该从文本自己长出来：

- **概念节点**不再是人定的 73 个，而是语料里真正显著的那几百个词；
- **书—概念**的边带权，权是这部书里这个词的 tf-idf 分量，答得出「《墨子》究竟
  多讲兼爱」而非只说「讲」；
- **书—书**的边由共有概念的余弦算出，不必人去判「采」还是「驳」；
- 每条书—概念的边还挂着两三条**出处段落 id**，点开即是原文——图谱与文本就此接通，
  而不是两张各说各话的皮。

## 权重为何要按书归一

《管子》1655 段，《申子》21 段。不归一的话任何词在《管子》里的绝对分量都压过
《申子》，图谱就成了「大书吞小书」。故每部书的概念向量各自 L2 归一，比的是
「这个词在这部书里占多重」，不是「出现了多少次」。

## 产出

`public/siku/graph.json`。节点与边都已按权截断（见下方上限），直接够渲染，
运行期不必再算。
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

# 与 siku_terms.py 同口径：语料的读法、折字、断句都共用一处，
# 免得两边各有一套而算出对不上的东西。
from siku_terms import (
    LIGHT,
    MAX_N,
    OUT as TERMS_OUT,
    ROOT,
    load_books,
    load_fold,
    load_seeds,
    make_folder,
    sentences,
)

GRAPH = ROOT / "public" / "siku" / "graph.json"

# —— 规模上限 ——
TOP_CONCEPTS = 800        # 概念节点上限（26 书 × 每书 30 去重后必不足此数，故不致截断）
PER_BOOK_CONCEPTS = 30    # 每部书牵出几个概念（保小书不被大书挤没）
PER_CONCEPT_NEIGHBORS = 8  # 每个概念连几个邻概念
PER_BOOK_SIMILAR = 6      # 每部书连几部近书
PER_BOOK_PERSONS = 12     # 每部书连几个被提及的人
PROVENANCE = 3            # 每条书—概念边挂几条出处
CO_PER_SEG = 24           # 共现只看一段里最显著的几个词

MIN_CO_PMI = 1.0          # 概念共现的互信息下限（bit）
MIN_CO_SEGS = 4           # 概念共现的段数下限
MIN_DF_IN_BOOK = 2        # 一词须见于这部书的两段以上，才配当它的概念

# 概念权重与分层（详见 main 里算书—概念那一段的注）
SEED_BOOST = 1.6          # 人工校订过的词（IDEAS + 选本标注）加成
UNIVERSAL_MIN_BOOKS = 6   # 通行于几部书以上，算「通义」
UNIVERSAL_QUOTA = 8       # 每部书的通义配额（含枢纽），其余归「宗旨」
HUB_QUOTA = 3             # 通义配额里，先留给枢纽（IDEAS）几个
PERSON_CHAR_RATIO = 0.6   # 一个单字若这么多次都出自人名之内，不算概念
# 图谱用的长度加成，比 siku_terms 挑段内关键词时温和得多：那边要的是「这段说的是
# 什么」，长词确实更确定；这边分了层，长短各在其位，不必再靠字数定高下。
LEN_BONUS_G = {1: 0.9, 2: 1.0, 3: 1.05, 4: 1.1}


SUBTITLE = re.compile(r"（[^）]*）\s*$")


def strip_subtitle(title: str) -> str:
    """与 canonSource.ts:375 的 stripSubtitle 同式。改一处必改两处。"""
    return SUBTITLE.sub("", title).strip()


def load_persons(books: list[dict]) -> set[str]:
    """人名与书题的称谓集。

    这些在统计上是无瑕的词——「张孟谈」内聚满分、边界自由、df 低故 idf 高——
    可它们不是概念。更要紧的是，它们不该被丢掉：「《孟子》驳杨墨」「《庄子》
    辩惠施」「《韩非子》述商鞅」正是 `sikuLineage.ts` 那张手写的 传/承/采/驳
    边表想说的事，而这里有原文可依。故人名单列一类节点、单走一类边。

    四处来源：`characters.ts` 的名与字、`lineage.ts` GHOSTS 的名、各书的著者、
    各书的书题。书题也算——一部书的首要概念不该是它自己的名字（《管子》→管子、
    《申子》→申子、《列子》→子列子）。

    第五处是 `persons_extra.txt`：弟子、君主、寓言人物。前四处收的都是诸子本人，
    而原文里出现最密的人名往往不是诸子——《论语》满篇子路颜渊，《列子》满篇黑
    卵飞卫。那份名录手写，缘由见其文首。

    单字的弃掉：`characters.ts` 里有个叫「客」的，当人名扫会满篇皆是。
    """
    names: set[str] = set()

    ch = (ROOT / "app" / "world" / "characters.ts").read_text(encoding="utf-8")
    # 字段名前要挡一道：裸写 `zi:` 会命中 `portraitOf` 里的 `laozi: "老子.jpeg"`，
    # 把文件名当人名捞进来。
    for field in ("name", "zi"):
        names.update(re.findall(r'(?<![A-Za-z])' + field + r':\s*"([^"]+)"', ch))

    lineage = (ROOT / "app" / "world" / "lineage.ts").read_text(encoding="utf-8")
    m = re.search(r"export const GHOSTS[^=]*=\s*\[(.*?)\n\]", lineage, re.S)
    if m:
        names.update(re.findall(r'name:\s*"([^"]+)"', m.group(1)))

    for b in books:
        # 「管仲（旧题）」→「管仲」
        a = re.sub(r"（[^）]*）", "", b.get("author", "")).strip()
        if a:
            names.add(a)
        names.add(strip_subtitle(b.get("title", "")))

    extra = ROOT / "scripts" / "persons_extra.txt"
    if extra.exists():
        for line in extra.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                names.add(line)

    # 「子」字冠首之称：子墨子、子列子。只加在本就以「子」收尾者之上——文本里
    # 正是这么写的，而泛加会生出「子六韬」「子论语」「子道德经」一堆永不命中的空词。
    names |= {"子" + n for n in list(names) if n.endswith("子") and 2 <= len(n) <= 3}

    # 非汉字的一概不要（文件名、拉丁 id 之类）
    return {n for n in names if len(n) >= 2 and all("一" <= c <= "鿿" for c in n)}


def load_ideas() -> set[str]:
    """`lineage.ts` IDEAS 的 73 个思想节点——图的枢纽层。

    这 73 条是手写的，有意沿用。前五轮已经证明：统计量分不出「道」与「人」、
    「礼」与「事」之别——二者都通行诸书、都 df 极高、都 lift≈1。而「哪些词是
    大概念」本是个判断，不是个量。

    分工就划在这里：**要从原文来的是边**——哪部书与哪部书有何关系、凭哪一段，
    这些原先是 `sikuLineage.ts` 那张手写的 传/承/采/驳 边表，现在全由文本定且
    带出处；**概念词汇的枢纽一层留给校订**。宗旨层（每书 22 个名额）仍全由原
    文发现，与这 73 条无关。

    不取 `load_seeds`：那个把 IDEAS 与选本的 1776 个标注词并在一起了，标注词太
    细（「疏食」「令色」），当枢纽会把图的骨架压散。
    """
    lineage = (ROOT / "app" / "world" / "lineage.ts").read_text(encoding="utf-8")
    m = re.search(r"export const IDEAS[^=]*=\s*\[(.*?)\n\]", lineage, re.S)
    if not m:
        return set()
    return {n for n in re.findall(r'name:\s*"([^"]+)"', m.group(1)) if len(n) <= MAX_N}


def load_states() -> set[str]:
    """列国名。不是人，也不是概念，自成一类，从概念里剔掉。

    《韩非子》的通义栏曾是「韩 赵 候 荆 魏 人主 秦 臣」——八个名额里五个是国名。
    它们在统计上与真概念无从区分：一部书讲一国讲得特别多，lift 自然极高。

    只收歧义小的。「齐」兼整齐、「卫」兼护卫、「陈」兼陈列（《吴子》的「陈」正
    是阵）、「商」兼商贾、「夏」兼夏后、「周」兼周遍——这些宁可漏，不可错杀。
    """
    return set("韩赵魏秦荆燕鲁郑晋越蔡莒滕虢")


def load_idf() -> tuple[dict[str, float], dict[str, int], int]:
    """取 `_dict.json`。不重算——与检索期用的权必须是同一份。"""
    d = json.loads((TERMS_OUT / "_dict.json").read_text(encoding="utf-8"))
    idf = {t: v[1] / 100 for t, v in d["terms"].items()}
    df = {t: v[0] for t, v in d["terms"].items()}
    return idf, df, d["segs"]


def main() -> None:
    fold = make_folder(load_fold())
    idf, df, n_segs = load_idf()
    # 种子也折一遍。标注词本是简体，折了多半是原样，但词表那边的词都是折过的，
    # 两边必须同形才对得上。
    seeds = {fold(s) for s in load_seeds()}
    ideas = {fold(s) for s in load_ideas()}
    states = {fold(s) for s in load_states()}
    books = load_books()
    persons = {fold(p) for p in load_persons(books)}
    print(f"词 {len(idf)}，书 {len(books)}，段 {n_segs}，种子 {len(seeds)}，人名 {len(persons)}")

    # —— 逐段扫一遍：书内词频、段内词集（供共现） ——
    term_set = set(idf)
    tf_in_book: dict[str, Counter] = defaultdict(Counter)
    book_chars: Counter = Counter()   # 各书字数，算 lift 要除它
    person_char_tf: dict[str, Counter] = defaultdict(Counter)   # 人名内各字的次数
    # 书内段频：一词在这部书的几段里出现。只出现一段的，不配当这部书的概念——
    # 否则一句孤例的四字词凭 idf 之高就能窜到书的头上。
    df_in_book: dict[str, Counter] = defaultdict(Counter)
    # 书—词—最佳出处：按该段里这个词的 tf·idf 占比择优
    best_locus: dict[tuple[str, str], list[tuple[float, str]]] = defaultdict(list)
    co = Counter()          # 概念对共现段数
    appear = Counter()      # 概念出现段数（与 df 同，另算一份以防词典被截）
    person_df: dict[str, Counter] = defaultdict(Counter)      # 书 → 人 → 提及段数
    person_locus: dict[tuple[str, str], list[str]] = defaultdict(list)

    for b in books:
        bid = b["bookId"]
        for i, (it, keep) in enumerate(zip(b["items"], b["_keep"])):
            if not keep:
                continue
            ft = fold(it["text"])
            sid = f"siku:{bid}:{it['n']}:{i}"
            # 人名直接扫，不经词表——「惠施」「杨朱」「邹衍」未必被统计成词，
            # 但《孟子》驳杨墨、《庄子》辩惠施，这些提及正是图上最该有的边。
            for pn in persons:
                if pn in ft:
                    person_df[bid][pn] += 1
                    # 人名里的字要单独记一笔。剔掉「子路」并不剔掉「路」——
                    # 《论语》的「路」几乎全出自「子路」，《孙膑》的「忌」全
                    # 出自「田忌」，《列子》的「卵」全出自「黑卵」。单字概念
                    # 就是这么漏进来的。
                    k = ft.count(pn)
                    for c0 in pn:
                        person_char_tf[bid][c0] += k
                    pl = person_locus[(bid, pn)]
                    if len(pl) < PROVENANCE:
                        pl.append(sid)
            here = set()
            for s in sentences(ft):
                L = len(s)
                for n in range(1, MAX_N + 1):
                    if L < n:
                        break
                    for k in range(L - n + 1):
                        g = s[k:k + n]
                        if g in term_set:
                            here.add(g)
            if not here:
                continue
            length = max(len(ft), 1)
            book_chars[bid] += length
            for g in here:
                c = ft.count(g)
                tf_in_book[bid][g] += c
                df_in_book[bid][g] += 1
                appear[g] += 1
                # 出处择优：这一段里这个词说得多、而段又不长者为佳
                w = c * idf[g] * len(g) / math.sqrt(length)
                lst = best_locus[(bid, g)]
                lst.append((w, sid))
                if len(lst) > PROVENANCE * 3:
                    lst.sort(reverse=True)
                    del lst[PROVENANCE:]
            # 共现只取段里最显著的那几个词。一是长段动辄三十余词，两两配对要
            # 四五百对，整部语料下来上百万键；二是满段的词都算上，共现就退化成
            # 「同在一段」，与概念相邻无关。
            ordered = sorted(
                sorted(here, key=lambda g: -idf[g] * len(g))[:CO_PER_SEG]
            )
            for a_i in range(len(ordered)):
                for b_i in range(a_i + 1, len(ordered)):
                    co[(ordered[a_i], ordered[b_i])] += 1

    # —— 书的概念向量，按书 L2 归一 ——
    #
    # 三道处置，各治一病：
    #
    # 一、**词频取对数**。线性 tf 下「则」在《荀子》里八百次、idf 只 1.03，算得
    #     824；「礼义」六十次、idf 4.45，算得 267——虚字通吃，概念节点成了一堆
    #     句读。取对数后前者 4.35，后者 22.7，idf 才说得上话。
    #
    # 二、**虚义单字整个剔掉**（LIGHT：则与必有无是为能故我相使彼……）。不止是
    #     为了节点干净——书与书的余弦也靠它。人人都有「则」「有」「无」，不剔则
    #     所有书对都被垫高，相似度只剩「书有多大」，与讲了什么无关。
    #
    # 三、**人工校订过的词加成**（IDEAS 的 73 个思想节点 + 选本的 1776 个标注词）。
    #     统计学分不出「张孟谈」与「兼爱」——人名的内聚与边界自由度都是满分，df
    #     低故 idf 高。那批标注词是编辑部对「什么算概念」的定论，拿来当**先验**
    #     而非筛子：不排除新发现的词（白马非马、无厚、捭阖、军谶、六虱 都不在
    #     标注里，照样能上），只是更信已验证的。
    #
    # 至于「通义」与「宗旨」之争，不靠乘数，靠分层——见下。
    print("算书—概念 …")
    # 一词通行于几部书（以能当该书概念为准，偶见一段的不算）
    books_with = Counter()
    for b in books:
        for g, n in df_in_book[b["bookId"]].items():
            if n >= MIN_DF_IN_BOOK:
                books_with[g] += 1

    # 两个量，不是一个：
    #
    #   book_vec——tf·idf，答「这个词对这部书有多独特」。边权与书书余弦用它，
    #             那里问的正是独特性。
    #   prom    ——tf × lift，答「诸书共有之词里，这部书格外在讲哪几个」。
    #
    # 通义层的排序须用后者，而两种错法都试过了：
    #
    #   用 tf·idf——那一层是按「通行书数 ≥ UNIVERSAL_MIN_BOOKS」挑出来的，也就是
    #     按 idf 低这个条件选出来的一层；再拿 idf 给层内排序，等于把「谁最稀见」
    #     当「谁最核心」。《论语》的「仁」tf 108、idf 2.86，被同层最稀见的「子路」
    #     （tf 42、idf 5.05）「张」「耻」顶出名额之外——讲得最多，所以 idf 最低，
    #     所以出局。
    #   用纯 tf——「仁」「君子」回来了，可「人」「天」「下」「大」也上来了，每书
    #     的通义栏雷同，且「天下」与「天」「下」并立为三个节点。最常见者胜，与
    #     最稀见者胜一样错。
    #
    # lift 是第三个量，对照面是书与书而非词与词：
    #
    #     lift = (此词在本书的密度) / (此词在全26书的密度)
    #
    # 「人」「天」「下」人人皆用，lift≈1，自落；「仁」在《论语》、「道」在《道德
    # 经》、「孝」在《孝经》、「农」「刑」在《商君书》，lift 高。取 log(1+lift)
    # 而不取 lift，是不让一个 tf=2 而 lift=40 的偶见字压过本书的纲目。
    all_chars = max(sum(book_chars.values()), 1)
    tf_all: Counter = Counter()
    for b in books:
        tf_all.update(tf_in_book[b["bookId"]])

    book_vec: dict[str, dict[str, float]] = {}
    prom: dict[str, dict[str, float]] = {}
    for b in books:
        bid = b["bookId"]
        dfb = df_in_book[bid]
        bchars = max(book_chars[bid], 1)
        raw: dict[str, float] = {}
        pro: dict[str, float] = {}
        for g, c in tf_in_book[bid].items():
            if len(g) == 1 and g in LIGHT:
                continue
            if g in persons:
                continue   # 人名另走 bookPerson 一类边，不混进概念
            if dfb[g] < MIN_DF_IN_BOOK:
                continue
            if g in states:
                continue   # 国名自成一类，不是概念
            if len(g) == 1 and person_char_tf[bid][g] >= PERSON_CHAR_RATIO * c:
                continue   # 「路」只因「子路」而多，「忌」只因「田忌」而多
            base = (1 + math.log(c)) * LEN_BONUS_G.get(len(g), LEN_BONUS_G[MAX_N])
            if g in seeds:
                base *= SEED_BOOST
            raw[g] = base * idf[g]
            lift = (c / bchars) / max(tf_all[g] / all_chars, 1e-12)
            pro[g] = base * math.log1p(lift)
        norm = math.sqrt(sum(v * v for v in raw.values())) or 1.0
        book_vec[bid] = {g: v / norm for g, v in raw.items()}
        prom[bid] = pro

    # —— 每部书的概念榜：通义与宗旨各有配额 ——
    #
    # 不混在一个排序里。一部书的概念实有两类：
    #
    #   通义——「仁」「道」「法」「礼」「义」「孝」「兵」「名」，诸书皆讲；
    #   宗旨——「兼爱」「非攻」「白马非马」「循名责实」「捭阖」「六虱」，一书独有。
    #
    # 二者放在同一标量下必然互相挤：抬通义则一书独有的宗旨尽没（而那恰是最该留的），
    # 抬宗旨则《论语》的「仁」「君子」被「子路」「子贡」顶掉。给各自配额，两头都
    # 不受委屈；而且各按各的尺度排——通义按本书内分量（prom），宗旨按 tf·idf。
    print("选概念节点 …")
    ranked: dict[str, list[str]] = {}
    for b in books:
        bid = b["bookId"]
        vec, pro = book_vec[bid], prom[bid]
        uni_pool = sorted(
            (g for g in vec if books_with[g] >= UNIVERSAL_MIN_BOOKS),
            key=lambda g: -pro[g],
        )
        dis_pool = sorted(
            (g for g in vec if books_with[g] < UNIVERSAL_MIN_BOOKS),
            key=lambda g: -vec[g],
        )
        # 枢纽：这部书实际在用的 IDEAS，按本书内次数取前几个。《道德经》→道、
        # 《论语》→仁 礼、《孝经》→孝、《荀子》→礼 性恶。这一层不按 lift 排——
        # lift 恰恰排斥它们：诸书皆讲，故本书不超额，故 lift≈1。而正因诸书皆讲，
        # 它们才是书与书之间的路。上一轮没有这一层，596 个概念里 514 个只连一部
        # 书，图成了 26 朵互不相连的词云，且「道」「礼」「义」「德」一个都不在。
        hub = sorted(
            (g for g in vec if g in ideas),
            key=lambda g: -tf_in_book[bid][g],
        )[:HUB_QUOTA]
        taken = set(hub)
        # 本书格外在讲的共有词：lift 为此而设，这一半它做对了（《道德经》的
        # 玄 柔 常、《商君书》的 壹 爵 削）。
        # 含字抑制：若「天下」已取，「天」「下」就不另立节点——那是一个词被切成
        # 三个节点。只在层内做：《孙子》的「知」自有其分量，不该被宗旨层的
        # 「知彼」「知己」连坐。
        uni: list[str] = []
        for g in uni_pool:
            if len(hub) + len(uni) >= UNIVERSAL_QUOTA:
                break
            if g in taken:
                continue
            if any(g in k and g != k for k in uni):
                continue
            uni.append(g)
        # 配额不互通。《申子》21 段，宗旨只凑得出「明法」「臣专」二个，把余下 28
        # 个名额还给通义，得到的是「人」「天」「下」「国」一栏全汉语常用字——那
        # 是制造填充物，还让枢纽节点凭空多出一堆无意义连边。小书本该是小的。
        dis = [g for g in dis_pool if g not in taken][
            : PER_BOOK_CONCEPTS - UNIVERSAL_QUOTA
        ]
        ranked[bid] = hub + uni + dis

    # 各书轮流出一个，轮到上限为止。不按全局分量一刀切——《管子》1651 段，
    # 《申子》21 段，全局排序下小书的首要概念一个也进不来，图谱就只剩几部大书的词。
    picked: list[str] = []
    seen_c: set[str] = set()
    for rank in range(PER_BOOK_CONCEPTS):
        if len(picked) >= TOP_CONCEPTS:
            break
        for b in books:
            lst = ranked[b["bookId"]]
            if rank >= len(lst):
                continue
            g = lst[rank]
            if g in seen_c:
                continue
            seen_c.add(g)
            picked.append(g)
            if len(picked) >= TOP_CONCEPTS:
                break
    concepts = picked
    cset = seen_c
    print(f"  概念节点 {len(concepts)}（单字 {sum(1 for c in concepts if len(c) == 1)}，"
          f"校订过 {sum(1 for c in concepts if c in seeds)}，"
          f"新发现 {sum(1 for c in concepts if c not in seeds)}；"
          f"通义 {sum(1 for c in concepts if books_with[c] >= UNIVERSAL_MIN_BOOKS)}，"
          f"宗旨 {sum(1 for c in concepts if books_with[c] < UNIVERSAL_MIN_BOOKS)}）")

    # —— 书—概念边 ——
    # 用上面同一张 ranked，不另排一次：节点与边出自一处，才不会有「边指向一个
    # 没被选上的概念」这种事。
    bc = []
    for b in books:
        bid = b["bookId"]
        vec = book_vec[bid]
        for g in ranked[bid]:
            if g not in cset:
                continue
            lst = sorted(best_locus[(bid, g)], reverse=True)[:PROVENANCE]
            # 第四位是段数（这部书里有几段提到），与第五位的出处分开：出处只留
            # 两三条（PROVENANCE），段数是全数。检索面要答「哪些书提到、各几段」，
            # 拿出处的条数去充段数便会把「《管子》里 104 段讲法」说成「3 段」。
            bc.append([bid, g, round(vec[g], 4), df_in_book[bid][g], [sid for _, sid in lst]])
    print(f"  书—概念 {len(bc)} 条")

    # —— 概念—概念边：共现的互信息 ——
    print("算概念—概念 …")
    cc_all: dict[str, list[tuple[float, str]]] = defaultdict(list)
    for (a, b_), n in co.items():
        if n < MIN_CO_SEGS or a not in cset or b_ not in cset:
            continue
        pa, pb = appear[a] / n_segs, appear[b_] / n_segs
        if pa <= 0 or pb <= 0:
            continue
        pmi = math.log2((n / n_segs) / (pa * pb))
        if pmi < MIN_CO_PMI:
            continue
        cc_all[a].append((pmi, b_))
        cc_all[b_].append((pmi, a))
    cc = []
    seen = set()
    for a, lst in cc_all.items():
        for pmi, b_ in sorted(lst, reverse=True)[:PER_CONCEPT_NEIGHBORS]:
            key = (a, b_) if a < b_ else (b_, a)
            if key in seen:
                continue
            seen.add(key)
            cc.append([key[0], key[1], round(pmi, 3)])
    print(f"  概念—概念 {len(cc)} 条")

    # —— 书—书边：共有概念的余弦 ——
    print("算书—书 …")
    bb_all: dict[str, list[tuple[float, str]]] = defaultdict(list)
    ids = [b["bookId"] for b in books]
    for x in range(len(ids)):
        for y in range(x + 1, len(ids)):
            va, vb = book_vec[ids[x]], book_vec[ids[y]]
            small, big = (va, vb) if len(va) <= len(vb) else (vb, va)
            dot = sum(v * big.get(g, 0.0) for g, v in small.items())
            if dot <= 0:
                continue
            bb_all[ids[x]].append((dot, ids[y]))
            bb_all[ids[y]].append((dot, ids[x]))
    bb = []
    seen = set()
    for a, lst in bb_all.items():
        for sim, b_ in sorted(lst, reverse=True)[:PER_BOOK_SIMILAR]:
            key = (a, b_) if a < b_ else (b_, a)
            if key in seen:
                continue
            seen.add(key)
            bb.append([key[0], key[1], round(sim, 4)])
    print(f"  书—书 {len(bb)} 条")

    # —— 书—人边：这部书提到了谁，提了几段 ——
    # 自己提自己不算（《孟子》满篇「孟子曰」，那是体例不是引述）。
    print("算书—人 …")
    bp = []
    for b in books:
        bid = b["bookId"]
        own = {
            re.sub(r"（[^）]*）", "", b.get("author", "")).strip(),
            strip_subtitle(b.get("title", "")),
        }
        own |= {"子" + o for o in own if o}
        own = {fold(o) for o in own if o}
        for pn, n in person_df[bid].most_common(PER_BOOK_PERSONS + len(own)):
            if pn in own:
                continue
            bp.append([bid, pn, n, person_locus[(bid, pn)]])
    print(f"  书—人 {len(bp)} 条")

    # —— 写盘 ——
    # 概念的全书分布。书—概念的边只连「这部书的要目」（每书 30 个），故拿边去答
    # 「哪些书提到」必少算：「仁」通 21 部，边却只有 4 条。检索面问的正是这一问，
    # 所以另存一份全分布——与 concepts 等长，每项是 [[书序, 段数], …]，书序即
    # books 的下标（不重复存 bookId，26 部的下标比字符串省得多）。
    bidx = {b["bookId"]: i for i, b in enumerate(books)}
    concept_books = [
        sorted(
            (
                [bidx[b["bookId"]], df_in_book[b["bookId"]][c]]
                for b in books
                if df_in_book[b["bookId"]][c] > 0
            ),
            key=lambda p: -p[1],
        )
        for c in concepts
    ]
    print(f"  概念全书分布 {sum(len(x) for x in concept_books)} 格")

    authors: dict[str, list[str]] = defaultdict(list)
    for b in books:
        for a in b.get("authorIds", []):
            authors[a].append(b["bookId"])

    out = {
        "segs": n_segs,
        "books": [
            {
                "id": b["bookId"],
                # 与 canonSource.ts 的 stripSubtitle 同一个式子：《道德经（老子）》→《道德经》。
                # 两处必须一致，否则这里建的书节点配不上全图里已有的那个。
                "title": strip_subtitle(b.get("title", "")),
                "author": b.get("author", ""),
                "group": b.get("group", ""),
                "category": b.get("category", ""),
                "dynasty": b.get("dynasty", ""),
                "segs": sum(1 for k in b["_keep"] if k),
                "authorIds": b.get("authorIds", []),
            }
            for b in books
        ],
        "authors": [{"id": a, "books": bs} for a, bs in sorted(authors.items())],
        "concepts": [
            {
                "t": c,
                "df": df.get(c, 0),
                "idf": round(idf.get(c, 0), 3),
                "n": len(c),
                # 通行于几部书
                "b": books_with.get(c, 0),
                # 1 = 人工校订过的（IDEAS 或选本标注），0 = 从文本新发现的。
                # 渲染那边可据此分两类节点：已验证的概念，与待审的新词。
                "s": 1 if c in seeds else 0,
            }
            for c in concepts
        ],
        "bookConcept": bc,
        "conceptBooks": concept_books,
        "bookPerson": bp,
        "conceptConcept": cc,
        "bookBook": bb,
    }
    GRAPH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"\n写 {GRAPH.relative_to(ROOT)}  {GRAPH.stat().st_size // 1024} KB")

    # —— 抽样自检 ——
    print("\n—— 各书概念：通义 | 宗旨 ——")
    for b in books:
        bid = b["bookId"]
        lst = ranked[bid]
        uni = [g for g in lst if books_with[g] >= UNIVERSAL_MIN_BOOKS]
        dis = [g for g in lst if books_with[g] < UNIVERSAL_MIN_BOOKS]
        name = strip_subtitle(b.get("title", ""))
        print(f"  {name[:10]:<12}{' '.join(uni[:8]):<22} | {' '.join(dis[:10])}")

    print("\n—— 概念的邻概念（抽十个）——")
    nb = defaultdict(list)
    for a, b_, w in cc:
        nb[a].append((w, b_))
        nb[b_].append((w, a))
    for g in ["兼爱", "无为", "仁义", "赏罚", "名实", "尚贤", "礼乐", "君子", "诸侯", "性恶"]:
        if g in nb:
            print(f"  {g}: " + " ".join(x for _, x in sorted(nb[g], reverse=True)[:6]))
        else:
            print(f"  {g}: （无边）")

    print("\n—— 书提及何人（诸子互引）——")
    byb = defaultdict(list)
    for bid, pn, n, _ in bp:
        byb[bid].append((n, pn))
    for b in books:
        top = [f"{pn}×{n}" for n, pn in sorted(byb[b["bookId"]], reverse=True)[:7]]
        if top:
            print(f"  {strip_subtitle(b.get('title',''))[:10]:<12}{' '.join(top)}")

    print("\n—— 书—书最近者 ——")
    for a, b_, s in sorted(bb, key=lambda x: -x[2])[:14]:
        print(f"  {a} — {b_}  {s}")


if __name__ == "__main__":
    main()
