#!/usr/bin/env python3
"""Import the available public-domain Yan Fu translation of The Wealth of Nations."""
import json
import re
import subprocess
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/worldlit/books/wealth-nations-yanfu-zh-20261108"
API = "https://zh.m.wikisource.org/w/api.php"


def query(**params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    for attempt in range(5):
        result = subprocess.run(["curl", "-sSL", "--max-time", "30", "-w", "\n%{http_code}", url], capture_output=True)
        body, status = result.stdout.rsplit(b"\n", 1)
        if status == b"200":
            return json.loads(body)
        time.sleep(2 ** attempt)
    raise RuntimeError(f"Wikisource API returned {status.decode()}")


def order(title):
    match = re.search(r"部([甲乙丙丁戊])/(?:篇([一二三四五六七八九十]+)|引論)", title)
    if not match:
        return (9, 99)
    numeral = match.group(2)
    digits = "一二三四五六七八九"
    number = 0 if not numeral else (10 + digits.index(numeral[-1]) + 1 if numeral.startswith("十") and len(numeral) > 1 else 10 if numeral == "十" else digits.index(numeral) + 1)
    return ("甲乙丙丁戊".index(match.group(1)), number)


links = query(action="parse", page="原富", prop="links")["parse"]["links"]
pages = sorted({item["*"] for item in links if re.match(r"^原富/部[甲乙丙丁戊]/(?:引論|篇[一二三四五六七八九十]+\s)", item["*"])}, key=order)
chapters = []
OUT.mkdir(parents=True, exist_ok=True)
for offset in range(0, len(pages), 10):
    data = query(action="query", prop="extracts", titles="|".join(pages[offset:offset + 10]), explaintext="1")
    for page in sorted(data["query"]["pages"].values(), key=lambda item: order(item["title"])):
        body = page.get("extract", "").strip()
        if len(body) < 80:
            continue
        n = len(chapters) + 1
        name = page["title"].removeprefix("原富/")
        chapters.append({"n": n, "name": name})
        (OUT / f"{n}.json").write_text(json.dumps({"n": n, "name": name, "content": body}, ensure_ascii=False), encoding="utf-8")
    time.sleep(1)

if not chapters:
    raise SystemExit("No usable chapters found; catalog not changed")
meta = {
    "id": "wealth-nations-yanfu-zh-20261108", "name": "原富", "author": "亚当·斯密",
    "translator": "严复 译", "era": "1902", "origin": "英国",
    "note": "严复1902年历史译本《原富》。维基文库原页标为未完成；这里只收录目前已录入的篇章，不代表《国富论》全书中译。原文篇目与英文卷不逐章对齐。",
    "source": {"platform": "维基文库", "url": "https://zh.wikisource.org/wiki/原富", "licenseUrl": "https://zh.wikisource.org/wiki/原富", "rights": "译文页面标记为公有领域；译者严复卒于1921年"},
    "chapters": chapters,
}
(OUT / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Imported {len(chapters)} available chapters of 原富")
