#!/usr/bin/env python3
"""从四库分片里切出「可引段落」，一书一文件，供诸子检索自家全文。

## 为何要这一步

诸子检索现在只认 `canon.ts` 里手写的 752 条。那 752 条是精选，带白话与关键词，
质量高，但毕竟是选本——孔子答话时引的，只能是我们替他挑过的那几十句。而《论语》
全文就躺在 `public/siku/books/lunyu/` 里，与他无关地放着。

四库那 76 部可读书中，有二十余部正是诸子本家之书（《论语》《孟子》《庄子》
《韩非子》……）。把它们切成段落接进检索，孔子便能引《论语》里的任何一句，而不限于
选本。这比把 752 条搬出 bundle 有用得多——那只是挪位置，这是扩检索域。

## 为何不在运行期直接读 `books/<id>/*.json`

《管子》八十八章、《淮南子》二十二章，运行期按章取便是几十次请求。故预先切好、
一书一文件：首次问某子时取一次，此后常驻内存。

## 切段之法

- 按空行切段，去掉行首那几个全角空格（分片里正文都带缩进）；
- 太短的不要（十二字以下多是章目、题署、校记），太长的按句号断成不超过 120 字的段
  ——引典要引得动一句话，整段三百字贴进提示词里，诸子就只会复读；
- 不去重、不排序：段落在书里的次序本身是线索，`fallbackFor` 取前几条时，
  取到的便是开篇那几句。

产出 `public/siku/quotable/<bookId>.json`，形如
`{"bookId","title","author","items":[{"n","chapter","text"}]}`。
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIKU = ROOT / "public" / "siku"
OUT = SIKU / "quotable"

# 一段最短／最长。上限按「贴进提示词里还读得动一句」定，不是按字数美观定。
MIN_CHARS = 12
MAX_CHARS = 120

# BOOKS 的 `authorId` 身兼二职：《论语》之于孔子是「这话是他说的」，《尚书》之于孔子
# 却是「相传经他删定」。删定不是说话——若把《尚书》收进孔子名下，`quoteOf()` 见
# `owner === scholarId` 便会把尧舜之诰当作孔子自己的话引出来。故这类只传不作的书在此排开，
# 其人仍用手写选本。（三层模型里这是 role 之别：speaker 与 compiler／annotator 不同，
# 见 canon.ts 的 `Passage.owner` 顶注。）
NOT_OWN_WORDS = {
    "尚书": "相传孔子删定，非其语录",
    "周易": "文王演卦、孔子作传，卦爻辞非其语录",
}

# 四库目录的题名偶与脉络表不同字：《道德经（老子）》括注了别名，脉络表只作《道德经》。
# 先前按书名直配，老子这一部便配不上——他名下一句全文也取不到，检索时只好退回手写
# 选本，而《道德经》恰是选本最少、全文最该有的一部。故立一张别名表，脉络表的名在左，
# 四库目录的题名在右；新增只此一条，多了再说。
TITLE_ALIAS = {
    "道德经": "道德经（老子）",
}


def books_of_scholars() -> dict[str, list[str]]:
    """自 lineage.ts 的 BOOKS 读「书名 → 作者（即 scholarId）」。

    不另立一张表：书与人的对应本就写在 BOOKS 里，再抄一份早晚两边不一致。
    形如 `{ id: "bk-lunyu", name: "论语", authorId: "kong", ... }`，逐行正则即可。
    """
    src = (ROOT / "app" / "world" / "lineage.ts").read_text(encoding="utf-8")
    pairs: dict[str, list[str]] = {}
    for m in re.finditer(r'\{\s*id:\s*"bk-[^"]+",\s*name:\s*"([^"]+)",\s*authorId:\s*"([^"]+)"', src):
        pairs.setdefault(m.group(1), []).append(m.group(2))
    if len(pairs) < 10:
        sys.exit(f"BOOKS 只解出 {len(pairs)} 部，lineage.ts 的写法大约变了，正则须跟着改")
    return pairs


# 分片里的一「段」未必只有一章：有些章之间只隔着几个全角空格而非换行（《论语·为政》
# 里「诗三百」与「道之以政」便连在一行）。故先按两个以上的空白再断一次，一章归一段，
# 否则引出来的便是两章并在一处，出处也说不清是哪一章。
MULTI_SPACE = re.compile(r"[\s　]{2,}")


def split_paragraph(text: str) -> list[str]:
    """一段切成若干可引段：过长者按句断，断到不超过 MAX_CHARS 为止。"""
    text = text.strip()
    if len(text) <= MAX_CHARS:
        return [text] if len(text) >= MIN_CHARS else []
    # 按句末标点断，标点随上句走
    sents = re.findall(r"[^。！？；]*[。！？；]|[^。！？；]+$", text)
    out: list[str] = []
    buf = ""
    for s in sents:
        if len(buf) + len(s) > MAX_CHARS and buf:
            if len(buf) >= MIN_CHARS:
                out.append(buf)
            buf = s
        else:
            buf += s
    if len(buf) >= MIN_CHARS:
        out.append(buf)
    return out


def quotable_of(book_id: str) -> tuple[dict, int]:
    meta = json.loads((SIKU / "books" / book_id / "meta.json").read_text(encoding="utf-8"))
    items: list[dict] = []
    chars = 0
    for c in meta["chapters"]:
        n = c["n"]
        path = SIKU / "books" / book_id / f"{n}.json"
        if not path.exists():
            continue
        ch = json.loads(path.read_text(encoding="utf-8"))
        name = re.sub(r"\s+", " ", ch["name"]).strip()
        for para in ch["content"].split("\n"):
            para = para.strip()
            if not para:
                continue
            for piece in MULTI_SPACE.split(para):
                for seg in split_paragraph(piece):
                    items.append({"n": n, "chapter": name, "text": seg})
                    chars += len(seg)
    return (
        {
            "bookId": book_id,
            "title": meta["title"],
            "author": meta.get("author", ""),
            # 部·类·朝代·章数一并带出：典籍架要照这些列书，若不带，界面便得为了几个
            # 字去取整份 catalog.json（百余 KB）。索引照样抄这几项（见 rebuild_index）。
            "group": meta.get("group", ""),
            "category": meta.get("category", ""),
            "dynasty": meta.get("dynasty", ""),
            "chapters": len(meta.get("chapters", [])),
            "items": items,
        },
        chars,
    )


def rebuild_index() -> list[dict]:
    """扫一遍 quotable 目录重建索引（与 xiyou_dialogue.py 的同名函数同义）。

    索引是两边共用的一份：诸子在此写，西游在 xiyou_dialogue.py 写。若各自只记自己
    那几部，后跑的便把先跑的抹掉——先前此处正是只记诸子，跑完一回，悟空那十五卷
    对白在索引里就没了，`loadOwnWorks` 据索引取书，于是一句也取不到。故索引不由谁
    写定，照目录里实有的文件重算。
    """
    index: list[dict] = []
    for p in sorted(OUT.glob("*.json")):
        if p.name == "index.json":
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        e = {"bookId": d["bookId"], "title": d["title"], "authorIds": d["authorIds"], "items": len(d["items"])}
        for k in ("group", "category", "dynasty", "chapters", "author", "worldId"):
            if d.get(k):
                e[k] = d[k]
        index.append(e)
    (OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    return index


def main() -> None:
    catalog = json.loads((SIKU / "catalog.json").read_text(encoding="utf-8"))
    readable = {e["title"]: e["bookId"] for e in catalog if e.get("bookId")}
    wanted = books_of_scholars()

    OUT.mkdir(parents=True, exist_ok=True)
    index: list[str] = []
    missing: list[str] = []
    total = 0
    for title, authors in sorted(wanted.items()):
        if title in NOT_OWN_WORDS:
            continue
        book_id = readable.get(TITLE_ALIAS.get(title, title))
        if not book_id:
            missing.append(title)
            continue
        data, chars = quotable_of(book_id)
        data["authorIds"] = authors
        path = OUT / f"{book_id}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        size = path.stat().st_size
        total += size
        index.append(book_id)
        print(f"{title:10s} {book_id:14s} {len(data['items']):5d} 段 {chars:7d} 字 {size/1024:7.0f} KB")

    # 索引：浏览器据此知道「某子有无自家全文可取」，不必先 404 一次。
    # 照目录重算（含西游那边的卷），不是只记本次所写的几部。
    whole = rebuild_index()
    print(f"--- 诸子 {len(index)} 部 {total/1024/1024:.1f} MB；索引共 {len(whole)} 卷")
    if missing:
        print(f"四库可读之中无此数部，其人仍只用手写选本：{missing}")
    print(f"只传不作，不收：{ {k: v for k, v in NOT_OWN_WORDS.items()} }")


if __name__ == "__main__":
    main()
