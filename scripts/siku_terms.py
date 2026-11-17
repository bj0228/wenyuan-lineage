#!/usr/bin/env python3
"""给二十六本诸子全文做离线成词与 IDF 加权，产出检索与图谱共用的词表。

## 为何要这一步

`siku_quotable.py` 把全文切成了 11513 段，接进了检索，但那些段落的 `keywords`
是空数组——有意为之，因为当时没有可靠的词。于是全文这一池只能靠原文子串命中：
检「战争」不会带出「兵」「师」「伐」，分数也全凭命中次数，同分之局一片。
选本那 786 条有人工标注词（6 分一命中），全文没有，故同池相争时全文永不露头;
后来改成分池才让全文可见，但「可见」不等于「检得准」。

这一步补的就是那两样东西：**词**与**权**。

## 为何不用 jieba

本机没有任何三方库，装也不该装——但更要紧的是 jieba 的词典是现代汉语的，
文言切「道可道非常道」只会切出一地碎片。文言成词本就该从语料自身统计出来：
一个字串若内部黏得紧（互信息高）、左右两头又接得杂（邻字熵高），它就是个词。
这法子不认词典，只认语料，正适合先秦文本。

## 成词之法

1. **折字**：取 `app/world/hanVariants.ts` 那张 1427 字的繁简表，match 一侧折成
   简体（十一本繁体书——庄子、孟子、道德经、管子、文子……——否则「無為」与
   「无为」永不相认）。原文一个字都不改，只折用来比对的那一份。
2. **断句**：按标点切成纯汉字串，n-gram 不跨标点，免得「也。故」成词。
3. **计数**：n=1..5 全量数（n=5 只为算 4 字词的邻字熵）。
4. **筛词**：频次 >= MIN_FREQ，且
   - 内部黏合：所有切分点上的互信息取最小值 >= MI_MIN（照词长放宽），
   - 边界自由：左右邻字熵双双 >= ENT_MIN，
   - 不是纯虚词、不是纯数词、不以强虚词开头或收尾。
5. **种子兜底**：IDEAS 那 73 个思想节点 + 选本 1776 个标注词，只要在语料里出现过
   就直接收，不过统计那一关——「仁」「无为」「兼爱」是这套书的命门，
   宁可错收不可错杀。
6. **去冗**：短词若几乎只活在某个长词肚子里（「兼爱」之于「兼爱非攻」），弃短留长。

## 产出

- `public/siku/terms/_dict.json` —— `{"segs":N,"terms":{词:[df,idf*100]}}`，
  查询期按词取权重用。
- `public/siku/terms/<bookId>.json` —— `{"bookId","kw":[[词,..],..]}`，
  `kw` 与分片 `items` **同序等长**，第 i 条对第 i 段。

`kw` 必须等长，不可压缩掉空位：`canonSource.toPassages` 的段落 id 是
`siku:<bookId>:<n>:<i>`，那个 i 是**过滤前**在原 items 里的下标（当初特意如此，
好让剔不剔非正文都不动已记下的 id）。此处照搬同一下标，非正文段落留空数组。
"""

from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIKU = ROOT / "public" / "siku"
QUOTABLE = SIKU / "quotable"
OUT = SIKU / "terms"

# 成词阈值。3 字以上另立一档：2 字词大面干净，碎片几乎全出在 3、4 字上。
MIN_FREQ = 5          # 全语料出现次数下限（2 字词）
MIN_FREQ_LONG = 8     # 3 字及以上的下限
MI_MIN = 2.2          # 最小切分点互信息（bit），照词长逐级放宽
ENT_MIN = 1.1         # 左右邻字熵下限（bit）
ENT_MIN_LONG = 1.5    # 3 字及以上的邻字熵下限
MAX_N = 4             # 最长词
TOP_TERMS = 30000     # 词典上限，按显著度截
KW_PER_SEG = 6        # 每段取几个关键词
MAX_SINGLE_KW = 2     # 每段最多几个单字词——否则稀见单字会占满名额

# 单字词 idf 天然偏高（稀见字 df 小），压不住就会把二字概念全挤掉。
LEN_BONUS = {1: 0.55, 2: 1.0, 3: 1.25, 4: 1.45}

NUMERALS = set("一二三四五六七八九十百千万萬零数數")

# 小句虚词：词内**任何位置**都不该有——它们标的是句读，不是词。
# 「位而不」「万物而不」「辩而不」皆由此而来。
BAN_ANY = set("而乎也矣焉哉兮耳且夫则則乃焯")

# 可作词内连接（「圣人之道」「天地之间」），但不可居首尾。
BAN_EDGE = set("之所于於以与與其因亦皆必甚唯")

# 首位否决。「不」特意不在此列：它是前缀式否定，「不仁」「不义」「不争」都是实词。
BAN_FIRST = BAN_ANY | BAN_EDGE | set("者故可为為能使多少若如何是此彼我吾汝")

# 末位否决。「不」反过来绝不收尾——「天下莫不」「智者不」正是这么漏进来的。
# 「者」则允许收尾，「仁者」「王者」「学者」都是词。
BAN_LAST = BAN_ANY | BAN_EDGE | set("不莫未勿毋每")

# 虚义字：不计入「实字」，但允许出现在词里。实字数不足则弃——
# 「不可以为」「人之所以」「不可不察」四字里一个实字都凑不出两个。
LIGHT = (
    BAN_ANY | BAN_EDGE | NUMERALS
    | set("可为為有无無是然故使能若如何相多少者此彼我吾汝不莫未勿毋自")
)


# ———————————————————————————— 折字 ————————————————————————————

def load_fold() -> dict[str, str]:
    """从 hanVariants.ts 取那张繁简表。两串等长，逐位对应。"""
    src = (ROOT / "app" / "world" / "hanVariants.ts").read_text(encoding="utf-8")

    def grab(name: str) -> str:
        m = re.search(r"export const " + name + r"\s*=\s*\"((?:[^\"\\]|\\.)*)\"", src)
        if not m:
            sys.exit(f"hanVariants.ts 里找不到 {name}")
        return m.group(1)

    trad, simp = grab("TRAD"), grab("SIMP")
    if len(trad) != len(simp):
        sys.exit(f"繁简表不等长：{len(trad)} vs {len(simp)}")
    return dict(zip(trad, simp))


def make_folder(table: dict[str, str]):
    def fold(s: str) -> str:
        return "".join(table.get(c, c) for c in s).lower()
    return fold


# ———————————————————————————— 种子词 ————————————————————————————

def load_seeds() -> set[str]:
    """IDEAS 的 73 个思想节点 + 选本的 1776 个标注词。这些是人定的，不过统计那一关。"""
    seeds: set[str] = set()

    lineage = (ROOT / "app" / "world" / "lineage.ts").read_text(encoding="utf-8")
    m = re.search(r"export const IDEAS[^=]*=\s*\[(.*?)\n\]", lineage, re.S)
    if m:
        for name in re.findall(r"name:\s*\"([^\"]+)\"", m.group(1)):
            seeds.add(name)

    canon = (ROOT / "app" / "world" / "canon.ts").read_text(encoding="utf-8")
    for block in re.findall(r"keywords:\s*\[([^\]]*)\]", canon):
        for w in re.findall(r"\"([^\"]+)\"", block):
            seeds.add(w)

    return {s for s in seeds if s and len(s) <= MAX_N}


# ———————————————————————————— 读语料 ————————————————————————————

# 与 canonSource.ts 的 toPassages 一致：非正文章节、注解头、题解头剔掉。
# 改这里时那边也要改，两处必须同口径，否则 kw 与段落错位。
NON_TEXT_CHAPTERS = {
    "凡例", "提要", "序", "叙", "跋", "目录", "校记", "说明", "前言", "序言", "出版说明",
}
NOTE_HEAD = re.compile(r"^[（(]\s*[0-9０-９一二三四五六七八九十]+\s*[）)]")
EXPL_HEAD = re.compile(r"^(本篇|本章|此篇|本书|此书|本卷)")


def tidy_chapter(ch: str) -> str:
    parts = ch.strip().split()
    if len(parts) < 2:
        return ch.strip()
    return "".join(parts) if all(len(x) == 1 for x in parts) else ch.strip()


def is_text(chapter: str, text: str, title: str, multi_chapter: bool) -> bool:
    ch, t = tidy_chapter(chapter).strip(), text.strip()
    if ch in NON_TEXT_CHAPTERS:
        return False
    if multi_chapter and ch == title:
        return False
    if NOTE_HEAD.match(t) or EXPL_HEAD.match(t):
        return False
    return True


def load_books() -> list[dict]:
    """26 本诸子。西游那 15 个 shard 与 index.json 不算。"""
    books = []
    for path in sorted(QUOTABLE.glob("*.json")):
        if path.name == "index.json" or path.name.startswith("xy-"):
            continue
        d = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(d, dict) or "items" not in d:
            continue
        items = d["items"]
        multi = len({it["chapter"] for it in items}) >= 2
        title = d.get("title", "")
        d["_keep"] = [is_text(it["chapter"], it["text"], title, multi) for it in items]
        books.append(d)
    return books


NON_HAN = re.compile(r"[^一-鿿]+")


def sentences(text: str) -> list[str]:
    """切成纯汉字串。n-gram 不跨标点。"""
    return [s for s in NON_HAN.split(text) if len(s) >= 1]


# ———————————————————————————— 统计成词 ————————————————————————————

def count_grams(corpus: list[list[str]]) -> list[Counter]:
    """cnt[n] = n 字串的计数。数到 MAX_N+1，多那一层只为算邻字熵。"""
    cnt = [Counter() for _ in range(MAX_N + 2)]
    for sents in corpus:
        for s in sents:
            L = len(s)
            for n in range(1, MAX_N + 2):
                if L < n:
                    break
                c = cnt[n]
                for i in range(L - n + 1):
                    c[s[i:i + n]] += 1
    return cnt


def branching(cnt: list[Counter], cand: set[str]) -> tuple[dict, dict]:
    """左右邻字分布。由 n+1 字串反推 n 字串的邻字。

    只给候选词挂 Counter：全量挂的话 4 字串就有几十万键，白吃上 G 内存。
    """
    left: dict[str, Counter] = defaultdict(Counter)
    right: dict[str, Counter] = defaultdict(Counter)
    for n in range(2, MAX_N + 2):
        for gram, c in cnt[n].items():
            head, tail = gram[:-1], gram[1:]
            if head in cand:
                right[head][gram[-1]] += c
            if tail in cand:
                left[tail][gram[0]] += c
    return left, right


def entropy(c: Counter) -> float:
    tot = sum(c.values())
    if tot <= 0:
        return 0.0
    h = 0.0
    for v in c.values():
        p = v / tot
        h -= p * math.log2(p)
    return h


def min_pmi(gram: str, cnt: list[Counter], total1: int) -> float:
    """所有切分点上的互信息取最小——最弱那一处决定这串黏不黏。"""
    n = len(gram)
    pg = cnt[n][gram] / total1
    worst = float("inf")
    for i in range(1, n):
        a, b = gram[:i], gram[i:]
        pa = cnt[len(a)][a] / total1
        pb = cnt[len(b)][b] / total1
        if pa <= 0 or pb <= 0:
            return 0.0
        worst = min(worst, math.log2(pg / (pa * pb)))
    return worst if worst != float("inf") else 0.0


def acceptable(gram: str) -> bool:
    """字面上的否决。

    统计那三道关（频次、互信息、邻字熵）管的是「黏不黏、活不活」，管不了
    「像不像个词」——「人之所以」黏得极紧、左右也极自由，却不是词。字面这一关
    补的就是这个：虚词不配成词，实字不足两个的长串也不配。
    """
    if any(c in BAN_ANY for c in gram):
        return False
    if gram[0] in BAN_FIRST or gram[-1] in BAN_LAST:
        return False
    if all(c in NUMERALS for c in gram):
        return False
    solid = sum(1 for c in gram if c not in LIGHT)
    return solid >= (1 if len(gram) == 2 else 2)


def discover(cnt: list[Counter], seeds: set[str]) -> dict[str, int]:
    """统计成词 + 种子兜底，返回 {词: 频次}。"""
    total1 = sum(cnt[1].values())

    # 先过频次与字面这两道便宜的关，再给幸存者算邻字熵
    cand: set[str] = set()
    for n in range(2, MAX_N + 1):
        floor = MIN_FREQ if n == 2 else MIN_FREQ_LONG
        for gram, freq in cnt[n].items():
            if freq >= floor and acceptable(gram):
                cand.add(gram)
    print(f"  候选 {len(cand)}")
    left, right = branching(cnt, cand)

    terms: dict[str, int] = {}
    for gram in cand:
        n = len(gram)
        # 词越长，互信息自然越低，阈值逐级放宽；邻字熵反过来要收紧
        if min_pmi(gram, cnt, total1) < MI_MIN - 0.35 * (n - 2):
            continue
        ent_min = ENT_MIN if n == 2 else ENT_MIN_LONG
        if entropy(left.get(gram, Counter())) < ent_min:
            continue
        if entropy(right.get(gram, Counter())) < ent_min:
            continue
        terms[gram] = cnt[n][gram]

    # 种子：出现过就收，单字也收（「仁」「道」「法」靠 IDF 自会降权）
    kept_seeds = 0
    for s in seeds:
        f = cnt[len(s)].get(s, 0) if len(s) <= MAX_N else 0
        if f > 0 and s not in terms:
            terms[s] = f
            kept_seeds += 1

    print(f"  统计成词 {len(terms) - kept_seeds}，种子补入 {kept_seeds}")
    return terms


def dedupe(terms: dict[str, int], seeds: set[str]) -> dict[str, int]:
    """短词若几乎只活在某个长词肚子里，弃短留长。种子不弃。"""
    by_len = defaultdict(list)
    for t in terms:
        by_len[len(t)].append(t)
    drop = set()
    for n in range(1, MAX_N):
        for short in by_len[n]:
            if short in seeds:
                continue
            fs = terms[short]
            for m in range(n + 1, MAX_N + 1):
                for long in by_len[m]:
                    if short in long and terms[long] >= 0.9 * fs:
                        drop.add(short)
                        break
                if short in drop:
                    break
    print(f"  去冗弃短 {len(drop)}")
    return {t: f for t, f in terms.items() if t not in drop}


# ———————————————————————————— IDF 与每段关键词 ————————————————————————————

def build(books: list[dict], fold, seeds: set[str]) -> None:
    # 只拿正文段落统计，非正文不该污染 IDF
    corpus, flat = [], []
    for b in books:
        for it, keep in zip(b["items"], b["_keep"]):
            if not keep:
                continue
            ft = fold(it["text"])
            sents = sentences(ft)
            corpus.append(sents)
            flat.append((b["bookId"], ft))
    n_segs = len(corpus)
    print(f"正文段落 {n_segs}（总 {sum(len(b['items']) for b in books)}）")

    print("数 n-gram …")
    cnt = count_grams(corpus)
    print(f"  distinct: " + ", ".join(f"{n}字 {len(cnt[n])}" for n in range(1, MAX_N + 2)))

    print("筛词 …")
    terms = dedupe(discover(cnt, seeds), seeds)
    print(f"  成词合计 {len(terms)}")

    # —— df 与 idf ——
    print("数 df …")
    df = Counter()
    # 逐段扫：拿段内所有 n-gram 去交词表，比逐词扫全语料快得多
    seg_terms: list[list[str]] = []
    term_set = set(terms)
    for sents in corpus:
        here = set()
        for s in sents:
            L = len(s)
            for n in range(1, MAX_N + 1):
                if L < n:
                    break
                for i in range(L - n + 1):
                    g = s[i:i + n]
                    if g in term_set:
                        here.add(g)
        for g in here:
            df[g] += 1
        seg_terms.append(sorted(here))

    idf = {t: math.log(n_segs / (1 + df[t])) for t in terms}

    # 按显著度截词典：df 太高的（几乎每段都有）本就无用。
    # 不乘词长——那会把四字串一股脑顶到前头，看着像词表其实是碎片堆。
    rank = sorted(terms, key=lambda t: -(idf[t] * math.log(1 + terms[t])))
    if len(rank) > TOP_TERMS:
        print(f"  词典截断 {len(rank)} -> {TOP_TERMS}")
        rank = rank[:TOP_TERMS]
    final = set(rank)

    # —— 每段关键词 ——
    print("取每段关键词 …")
    kw_by_book: dict[str, dict[int, list[str]]] = defaultdict(dict)
    seg_i = 0
    for b in books:
        for idx, (it, keep) in enumerate(zip(b["items"], b["_keep"])):
            if not keep:
                continue
            ft = flat[seg_i][1]
            here = [t for t in seg_terms[seg_i] if t in final]
            seg_i += 1
            if not here:
                continue
            scored = []
            for t in here:
                tf = ft.count(t)
                scored.append((tf * idf[t] * LEN_BONUS[len(t)], t))
            scored.sort(key=lambda x: (-x[0], x[1]))
            picked: list[str] = []
            singles = 0
            for _, t in scored:
                # 已有更长的覆盖了它就不重复占位
                if any(t in p for p in picked):
                    continue
                if len(t) == 1:
                    if singles >= MAX_SINGLE_KW:
                        continue
                    singles += 1
                picked.append(t)
                if len(picked) >= KW_PER_SEG:
                    break
            kw_by_book[b["bookId"]][idx] = picked

    # —— 写盘 ——
    OUT.mkdir(parents=True, exist_ok=True)
    dict_path = OUT / "_dict.json"
    dict_path.write_text(
        json.dumps(
            {"segs": n_segs, "terms": {t: [df[t], round(idf[t] * 100)] for t in rank}},
            ensure_ascii=False, separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"写 {dict_path.relative_to(ROOT)}  {dict_path.stat().st_size // 1024} KB  {len(rank)} 词")

    total_kb = 0
    for b in books:
        bid = b["bookId"]
        kw = kw_by_book.get(bid, {})
        # 与 items 同序等长，非正文留空数组
        arr = [kw.get(i, []) for i in range(len(b["items"]))]
        p = OUT / f"{bid}.json"
        p.write_text(
            json.dumps({"bookId": bid, "kw": arr}, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        total_kb += p.stat().st_size // 1024
    print(f"写 {len(books)} 本 kw 文件，合计 {total_kb} KB")

    # —— 抽样自检 ——
    # 只能一次跑完就定夺，故把判断质量所需的都打出来：分布、各字数抽样、
    # 核心概念的 df/idf、以及三本书的每段关键词实样。
    by_len = Counter(len(t) for t in rank)
    print("\n—— 字数分布 ——")
    print("  " + "  ".join(f"{n}字 {by_len[n]}" for n in sorted(by_len)))

    for n in (2, 3, 4):
        pool = [t for t in rank if len(t) == n]
        if not pool:
            continue
        step = max(1, len(pool) // 36)
        print(f"\n—— {n} 字词抽样（每 {step} 取一）——")
        print("  " + " ".join(pool[::step][:36]))

    print("\n—— 核心概念 df/idf ——")
    probes = ["兼爱", "非攻", "无为", "尚贤", "节用", "名实", "性善", "性恶",
              "仁义", "礼乐", "君子", "圣人", "赏罚", "法度", "无用", "逍遥"]
    print("  " + "  ".join(
        f"{w}={df[w]}/{idf[w]:.2f}" if w in final else f"{w}=缺" for w in probes))

    print("\n—— 每段关键词实样 ——")
    for bid in ("daodejing", "mozi", "xunzi"):
        kw = kw_by_book.get(bid, {})
        rows = [kw[i] for i in sorted(kw)[:5]]
        print(f"  {bid}:")
        for r in rows:
            print("    " + " / ".join(r))


def main() -> None:
    table = load_fold()
    fold = make_folder(table)
    seeds = load_seeds()
    print(f"折字表 {len(table)} 字，种子词 {len(seeds)}")
    books = load_books()
    print(f"诸子 {len(books)} 本")
    build(books, fold, seeds)


if __name__ == "__main__":
    main()
