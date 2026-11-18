#!/usr/bin/env python3
"""把去重后的四库目录全量切成前端可按章读取的 JSON。

这支脚本与 ``siku_extract.py`` 的精选抽取并存：原脚本保留 77 部人工命名的
稳定路径；本脚本以已经去重、补代、系年的 ``public/siku/catalog.json`` 为准，
为其余书生成稳定的哈希路径，并保留原关系图使用的 ``lineageId``。这样给存目书
补上正文以后，``目:书名`` 形式的既有关系端点不会因为新增 ``bookId`` 而失效。

默认只允许写入一个尚不存在的新目录。产物全部通过自校后才把临时目录原子改名，
不会覆盖既有的 77 部输出。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from siku_extract import chap_order, stream_records


DEFAULT_SOURCE = Path(os.environ.get("SIKU_SOURCE", "data/source/siku"))
DEFAULT_CATALOG = Path("public/siku/catalog.json")
DEFAULT_OUTPUT = Path(os.environ.get("ZHUZI_OUT", "scripts/out/siku-all"))


def compact_dump(path: Path, value: object) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, separators=(",", ":"))


def generated_id(title: str) -> str:
    """为新增全文生成稳定、ASCII、与目录次序无关的路径。"""
    digest = hashlib.sha1(title.encode("utf-8")).hexdigest()[:12]
    return f"siku-{digest}"


def lineage_id(entry: dict) -> str:
    """沿用正式关系图现有端点：旧可读书用旧 id，原存目书用 ``目:题名``。"""
    return entry.get("bookId") or f"目:{entry['title']}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--expect",
        type=int,
        default=1019,
        help="期望的去重目录部数；不符即停止，0 表示不检查",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_json = args.source / "SiKuQuanShu.json"
    if not source_json.is_file():
        raise SystemExit(f"找不到正文源: {source_json}")
    if not args.catalog.is_file():
        raise SystemExit(f"找不到权威目录: {args.catalog}")
    if args.output.exists():
        raise SystemExit(f"输出目录已存在，为免覆盖而停止: {args.output}")

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    if args.expect and len(catalog) != args.expect:
        raise SystemExit(f"目录部数 {len(catalog)} 与期望 {args.expect} 不符")

    titles = [entry["title"] for entry in catalog]
    if len(set(titles)) != len(titles):
        dup = sorted({title for title in titles if titles.count(title) > 1})
        raise SystemExit(f"去重目录仍有同名条目: {dup[:10]}")

    entries: list[dict] = []
    old_ids = {entry["bookId"] for entry in catalog if entry.get("bookId")}
    used_ids = set(old_ids)
    targets: dict[str, dict] = {}
    generated_ids: dict[str, str] = {}
    for original in catalog:
        entry = dict(original)
        old_id = entry.get("bookId")
        entry["lineageId"] = lineage_id(entry)
        if old_id:
            # 原 77 部沿用既有分片与路径，本次只切“剩下的”。
            entries.append(entry)
            continue
        book_id = generated_id(entry["title"])
        if book_id in used_ids:
            raise SystemExit(f"生成路径冲突: {entry['title']} -> {book_id}")
        used_ids.add(book_id)
        generated_ids[entry["title"]] = book_id
        entry.pop("bookId", None)
        entry.pop("chapters", None)
        entries.append(entry)
        targets[entry["title"]] = entry

    # 服务器内存足以容纳 689 MB 导出的正文。一次流式解析后再按章名排序，避免为
    # 一千余部反复扫描源文件，也避免同时打开一千余个临时文件。
    bag: dict[str, list[tuple[int, str, str]]] = {title: [] for title in targets}
    seen = 0
    matched = 0
    for record in stream_records(source_json):
        seen += 1
        if seen % 4000 == 0:
            print(f"  扫过 {seen} 篇，命中 {matched} 篇……", flush=True)
        title = (record.get("title") or "").strip("《》")
        if title not in bag:
            continue
        content = (record.get("content") or "").strip()
        if not content:
            continue
        name = (record.get("chapter") or "").strip() or f"第{len(bag[title]) + 1}篇"
        bag[title].append((len(bag[title]), name, content))
        matched += 1

    missing = sorted(title for title, items in bag.items() if not items)
    if missing:
        print(
            f"  ! {len(missing)} 部只有目录、正文源无内容，继续作仅著录: {missing}",
            flush=True,
        )

    stage = args.output.with_name(f"{args.output.name}.building-{os.getpid()}")
    if stage.exists():
        shutil.rmtree(stage)
    books_dir = stage / "books"
    books_dir.mkdir(parents=True)

    total_chapters = 0
    total_chars = 0
    try:
        available = [(title, targets[title]) for title in targets if bag[title]]
        for index, (title, entry) in enumerate(available, 1):
            items = sorted(bag[title], key=lambda item: (chap_order(item[1]), item[0]))
            entry["bookId"] = generated_ids[title]
            book_dir = books_dir / entry["bookId"]
            book_dir.mkdir()
            chapters = []
            for number, (_, name, content) in enumerate(items, 1):
                compact_dump(
                    book_dir / f"{number}.json",
                    {"n": number, "name": name, "content": content},
                )
                chapters.append({"n": number, "name": name, "chars": len(content)})
                total_chars += len(content)
            entry["chapters"] = len(chapters)
            compact_dump(
                book_dir / "meta.json",
                {
                    "id": entry["bookId"],
                    "title": title,
                    "group": entry["group"],
                    "category": entry["category"],
                    "author": entry.get("author", ""),
                    "dynasty": entry.get("dynasty", ""),
                    "chapters": chapters,
                },
            )
            total_chapters += len(chapters)
            if index % 50 == 0 or index == len(available):
                print(
                    f"  已写 {index}/{len(available)} 部 · {total_chapters} 章 · {total_chars} 字",
                    flush=True,
                )

        compact_dump(stage / "catalog.json", entries)
        manifest = {
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "source": source_json.name,
            "catalogSource": args.catalog.name,
            "books": len(entries),
            "readableBooks": len(old_ids) + len(available),
            "catalogOnlyBooks": len(missing),
            "newChapters": total_chapters,
            "newCharacters": total_chars,
            "sourceRecords": seen,
            "matchedRecords": matched,
            "preservedBookIds": len(old_ids),
            "generatedBookIds": len(available),
            "missingBooks": missing,
        }
        compact_dump(stage / "manifest.json", manifest)

        # 写后自校：每部 meta、章文件数、目录 id、关系端点身份均须一一对应。
        check_catalog = json.loads((stage / "catalog.json").read_text(encoding="utf-8"))
        if len(check_catalog) != len(entries):
            raise RuntimeError("写后目录部数改变")
        for entry in check_catalog:
            if entry.get("bookId") in old_ids:
                continue
            if not entry.get("bookId"):
                if entry["title"] not in missing:
                    raise RuntimeError(f"非缺文书却无分片路径: {entry['title']}")
                continue
            book_dir = books_dir / entry["bookId"]
            meta = json.loads((book_dir / "meta.json").read_text(encoding="utf-8"))
            chapter_files = list(book_dir.glob("[0-9]*.json"))
            if len(chapter_files) != entry["chapters"] or len(meta["chapters"]) != entry["chapters"]:
                raise RuntimeError(f"章数不合: {entry['title']}")
            if not entry.get("lineageId"):
                raise RuntimeError(f"文脉端点缺失: {entry['title']}")

        stage.rename(args.output)
    except BaseException:
        shutil.rmtree(stage, ignore_errors=True)
        raise

    print(
        f"DONE 目录 {len(entries)} 部 · 可读 {len(old_ids) + len(available)} 部 · "
        f"仅著录 {len(missing)} 部 · 新切 {total_chapters} 章/{total_chars} 字 · "
        f"保留 {len(old_ids)} 个旧路径 · 新增 {len(available)} 个路径",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
