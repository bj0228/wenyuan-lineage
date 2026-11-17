#!/usr/bin/env python3
"""从百回本《西游记》正文里抽出人物对白，一人一文件，供西游诸人检索自家之言。

## 为何要这一步

`app/world/xiyou-passages.ts` 里那十余条是手挑的种子：有关键词、有出处，可作母题锚点，
但悟空开口能引的也就只有那两三句。而全书就在 `public/siku/books/xiyouji/` 里放着，
七十三万字，对白近万处——「皇帝轮流做，明年到我家」便在第七回里原样躺着。

接上之后，西游这边与诸子那边是同一套两层：手挑的选本带关键词（每词 6 分）天然在前，
全文对白只靠原文命中（每词 2 分），选本答不上时才浮上来。故此处产出的条目一律不给
关键词、不给白话——不是偷懒，是要这个次序（详见 canonSource.ts 的 `toPassages`）。

## 署名之难

小说与语录不同：语录里「子曰」就是孔子，小说里说话的人有十几种叫法，还常带着神态。
「行者」「大圣」「猴王」「孙行者」都是悟空；「行者笑道」「行者喝道」「行者暗笑道」
里，笑、喝、暗笑是神态不是名字。故署名分三步：剥神态、剥领字、查别名表。

查不着的一概丢弃——「那怪道」「小妖道」「众僧道」说话的是谁，书里本就没打算让你知道，
硬派给某人便是造假。于是八千八百余处对白，只收认得出人的那些。

有四处名字一身二用，按回目分说（见 `AMBIGUOUS`）：
  - 「菩萨」多指观音，但灵吉、文殊、毗蓝婆、弥勒出场那几回也称菩萨；
  - 「祖师」在前三回是须菩提，第六十六回却是荡魔天尊自述真武之位；
  - 「大仙」在五庄观三回是镇元子，在车迟国是虎力羊力鹿力；
  - 「长老」通常是三藏，但观音院那两回另有个金池长老。
拿不准的回目整回弃掉该名字，宁可少收，不可错署。

产出 `public/siku/quotable/xy-<personaId>.json`，形状与 `siku_quotable.py` 的产出相同
（多一个 `worldId: "xiyou"`），故 `loadOwnWorks()` 一行不改即认得。
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIKU = ROOT / "public" / "siku"
BOOK = SIKU / "books" / "xiyouji"
OUT = SIKU / "quotable"

# 一句对白的取舍。下限四字（「师父！」之类没有引用价值），上限一百六十字——
# 再长多是整段唱词或一篇表文，贴进提示词里人物便只会复读。
MIN_CHARS = 6
MAX_CHARS = 160

# 「X道：『……』」。X 里不许有标点，故只会捞到紧挨着的那几个字。
DIALOGUE = re.compile(r"([^。！？；，、：“”\n　]{1,14})道：“([^”]{4,400})”")

# 神态，不是名字：行者笑道、八戒陪笑道、国王大惊道。长的在前，免得「暗笑」先被「笑」吃掉。
MANNER = [
    "厉声高叫", "慌忙施礼", "心中暗想", "闻言大怒", "大惊失色",
    "暗笑", "冷笑", "大笑", "微笑", "陪笑", "赔笑", "欢喜", "厉声", "高叫", "大叫", "大怒",
    "大惊", "慌忙", "急忙", "闻言", "正色", "作礼", "合掌", "躬身", "欠身", "跪下", "叩头",
    "笑", "喝", "骂", "怒", "叫", "应", "答", "问", "说", "哭", "怨", "奏", "启", "禀", "急", "忙",
]

# 领字，也不是名字：又道、便道、对行者道、那三藏道。
LEAD = ["却说", "只见", "当时", "原来", "那", "这", "又", "便", "即", "乃", "却", "遂", "因", "复",
        "对", "向", "与", "教", "着", "上前", "近前", "急", "忙", "都", "也", "还", "方", "才", "遂即"]

# 别名 → 人格 id。一名一人，不含歧义者（歧义的见 AMBIGUOUS）。
ALIAS = {
    "wukong": ["行者", "悟空", "孙悟空", "孙行者", "大圣", "齐天大圣", "孙大圣", "猴王", "美猴王", "石猴", "老孙"],
    "tangseng": ["三藏", "唐僧", "唐三藏", "玄奘", "圣僧", "金蝉"],
    "bajie": ["八戒", "猪八戒", "呆子", "悟能", "猪刚鬣", "老猪"],
    "shaseng": ["沙僧", "沙和尚", "悟净", "沙悟净"],
    "guanyin": ["观音", "观世音", "观音菩萨", "南海菩萨"],
    "rulai": ["如来", "佛祖", "如来佛祖", "世尊", "释迦"],
    "yudi": ["玉帝", "玉皇大帝", "天尊"],
    "niumowang": ["牛魔王", "牛王", "老牛"],
    "laojun": ["老君", "太上老君"],
    "jinxing": ["金星", "太白金星", "长庚"],
    "taizong": ["太宗", "唐王", "唐太宗"],
    "tieshan": ["罗刹", "罗刹女", "铁扇公主", "铁扇仙"],
    "nvwang": ["女王", "女主"],
}
NAME_OF = {n: pid for pid, names in ALIAS.items() for n in names}

# 一名二用者：只在指定回次内认这个名字，别处整回弃掉。
# 回次取自书中情节，宁窄勿宽——错署一句，便是把灵吉菩萨的话记在观音名下。
AMBIGUOUS = {
    # 观音院（16-17 回）另有个金池长老；此外「长老」通指三藏
    "长老": ("tangseng", lambda n: n not in range(16, 19)),
    # 五庄观三回的「大仙」是镇元子；车迟国的「大仙」是虎力羊力鹿力，不收
    "大仙": ("zhenyuan", lambda n: n in range(24, 27)),
    # 「祖师」在斜月三星洞（1-3 回）是须菩提；第六十六回那个「祖师」是荡魔天尊
    "祖师": ("zushi", lambda n: n <= 3),
    # 「菩萨」多指观音：灵吉、文殊、毗蓝婆、弥勒、普贤出场那几回不认
    "菩萨": ("guanyin", lambda n: n not in {21, 22, 39, 52, 55, 66, 73, 77, 98}),
}

# 回次是按 meta 里的 n 数的，而 n=1 是卷首提要，第一回在 n=2。差这一格，
# 上面那几个回次区间便全错位，故此处换算一次，不在各处各减一。
def hui_of(n: int) -> int:
    return n - 1


def speaker_of(raw: str, hui: int) -> str | None:
    """「行者暗笑」→ wukong；「小妖」→ None。"""
    s = raw
    # 剥神态：剥到剥不动为止（「行者闻言笑」这类叠着两层）
    for _ in range(3):
        for m in MANNER:
            if s.endswith(m) and len(s) > len(m):
                s = s[: -len(m)]
                break
        else:
            break
    # 剥领字：同样可能叠着（「却说那行者」）
    for _ in range(3):
        for l in LEAD:
            if s.startswith(l) and len(s) > len(l):
                s = s[len(l) :]
                break
        else:
            break
    if not s:
        return None
    if s in NAME_OF:
        return NAME_OF[s]
    if s in AMBIGUOUS:
        pid, ok = AMBIGUOUS[s]
        return pid if ok(hui) else None
    return None


def clean(text: str) -> str | None:
    """对白取舍：太短不要，太长截到最后一个句末标点——截半句比贴三百字强。"""
    t = text.replace("　", "").replace("\n", "").strip()
    if len(t) < MIN_CHARS:
        return None
    if len(t) > MAX_CHARS:
        cut = max(t.rfind(c, 0, MAX_CHARS) for c in "。！？；")
        if cut < MIN_CHARS:
            return None
        t = t[: cut + 1]
    return t


def rebuild_index() -> list[dict]:
    """扫一遍 quotable 目录重建索引。

    诸子那边（siku_quotable.py）与西游这边各写各的书，却共用一份 index.json；
    若各自只写自己那几条，后跑的一个便会把先跑的抹掉。故索引不由谁去写，
    而是照目录里实有的文件重算一遍——两边谁后跑都不会丢人。
    """
    index = []
    for p in sorted(OUT.glob("*.json")):
        if p.name == "index.json":
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        e = {"bookId": d["bookId"], "title": d["title"], "authorIds": d["authorIds"], "items": len(d["items"])}
        # 部·类·朝代·章数·著者：诸子那边的卷带着这几项（典籍架照此列书），此处照抄，
        # 不然西游这边后跑一回，索引里那几项就没了。西游自家的卷没有这些项，跳过便是。
        for k in ("group", "category", "dynasty", "chapters", "author", "worldId"):
            if d.get(k):
                e[k] = d[k]
        index.append(e)
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    return index


def main() -> None:
    meta = json.loads((BOOK / "meta.json").read_text(encoding="utf-8"))
    by_person: dict[str, list[dict]] = {}
    seen: dict[str, set[str]] = {}
    total = kept = 0

    for c in meta["chapters"]:
        name = re.sub(r"\s+", " ", c["name"]).strip()
        if not name.startswith("第"):  # 卷首提要、作者小传之类，无对白
            continue
        hui = hui_of(c["n"])
        content = json.loads((BOOK / f"{c['n']}.json").read_text(encoding="utf-8"))["content"]
        for raw, said in DIALOGUE.findall(content):
            total += 1
            pid = speaker_of(raw, hui)
            if not pid:
                continue
            text = clean(said)
            if not text:
                continue
            # 同一人同一句只收一次：书里「师父，我去也」这类复说甚多，
            # 留着只会让检索反复撞上同一句。
            if text in seen.setdefault(pid, set()):
                continue
            seen[pid].add(text)
            by_person.setdefault(pid, []).append({"n": c["n"], "chapter": name, "text": text})
            kept += 1

    OUT.mkdir(parents=True, exist_ok=True)
    for pid, items in sorted(by_person.items(), key=lambda x: -len(x[1])):
        data = {
            "bookId": f"xy-{pid}",
            "title": "西游记",
            "author": "吴承恩",
            "authorIds": [pid],
            "worldId": "xiyou",
            "items": items,
        }
        path = OUT / f"xy-{pid}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        chars = sum(len(i["text"]) for i in items)
        print(f"{pid:10s} {len(items):5d} 句 {chars:7d} 字 {path.stat().st_size/1024:6.0f} KB")

    print(f"--- 全书对白 {total} 处，署得出名的 {kept} 处（{kept/total:.0%}），{len(by_person)} 人")
    print(f"索引重算：{len(rebuild_index())} 部")


if __name__ == "__main__":
    main()
