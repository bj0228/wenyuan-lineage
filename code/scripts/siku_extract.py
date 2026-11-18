#!/usr/bin/env python3
"""四库导出 → 前端分片（在存有 689MB 导出的服务器上跑）。

产出 `out/`：
  catalog.json            全 1019 部著录（选中者带 bookId/chapters，其余仅存目）
  books/<id>/meta.json    书级元信息 + 章目录
  books/<id>/<n>.json     单章正文

两件事须交代：

1. **必须流式读。** `SiKuQuanShu.json` 是 689MB 的 pretty-print JSON 数组，
   Node 的 `readFileSync(...,'utf8')` 在此必崩（`ERR_STRING_TOO_LONG`，
   V8 的字符串上限 0x1fffffe8 ≈ 5.4 亿字符，这里 2.42 亿汉字已越界）。
   故改用 Python 按行累积：导出的格式是每条记录十行、以顶格的 `}` 收尾，
   而 content 里的换行一律转义作 \\n，不会有裸换行冒充行尾，故「顶格的 }」
   即记录边界，这一判断是稳的。

2. **选书是人定的，不是规则定的。** 子部一部 386 种、集部 381 种，全切出来是
   数千万字；且「《论语(英译本)》」「《定州汉墓竹简《论语》》」这类同名异本
   混在一处，规则筛不干净。故此处列一张 title→bookId 的手表：
   取的是经部十三经全、史部正史与编年之要、子部六家之本经、集部楚辞与小说。
   未选中的书在 catalog 里照样著录，只是没有 bookId——前端据此分「可读」与
   「存目」，与《总目》存目之例同意。
"""
import json
import os
import re
import sys

# 原始导出不随仓库发布；通过环境变量指定本地位置，默认值仅作目录约定。
SRC = os.environ.get("SIKU_SOURCE", "data/source/siku")
OUT = os.environ.get("ZHUZI_OUT", "scripts/out/siku-selected")

# ── 选书表：书名（不含书名号）→ 分片目录名 ────────────────────────────
# id 用拉丁转写，人看得懂、进得了 URL；只做 fetch 路径，不露在界面上。
SELECT = {
    # 经部 · 十三经（全收。诸子立论之所本，一部不缺才算有「经」）
    "周易": "zhouyi", "尚书": "shangshu", "诗经": "shijing",
    "周礼": "zhouli", "仪礼": "yili", "礼记": "liji",
    "春秋左传": "zuozhuan", "春秋公羊传": "gongyang", "春秋谷梁传": "guliang",
    "论语": "lunyu", "孝经": "xiaojing", "尔雅": "erya", "孟子": "mengzi",
    # 史部 · 正史与编年之要，加先秦纪事三种
    "三家注史记": "shiji", "汉书": "hanshu", "后汉书": "houhanshu",
    "三国志 裴松之注": "sanguozhi", "资治通鉴": "zizhitongjian",
    "战国策": "zhanguoce", "国语": "guoyu", "晏子春秋": "yanzi",
    # 子部 · 儒家
    "荀子": "xunzi", "孔子家语": "kongzijiayu", "春秋繁露": "chunqiufanlu",
    "盐铁论": "yantielun", "说苑": "shuoyuan", "新序": "xinxu",
    "传习录": "chuanxilu", "朱子语类": "zhuziyulei",
    # 子部 · 道家
    "庄子": "zhuangzi", "道德经（老子）": "daodejing", "列子": "liezi",
    "文子": "wenzi", "抱朴子内篇": "baopuzi", "列仙传": "liexianzhuan",
    # 子部 · 法家
    "韩非子": "hanfeizi", "商君书": "shangjunshu", "管子": "guanzi",
    "申子": "shenzi", "邓析子": "dengxizi",
    # 子部 · 兵家
    "孙子兵法": "sunzi", "孙膑兵法": "sunbinfa", "吴子": "wuzi", "司马法": "simafa",
    "尉繚子": "weiliaozi", "六韬": "liutao", "三略": "sanlue",
    "鬼谷子": "guiguzi", "三十六计": "sanshiliuji",
    # 子部 · 杂家（墨、名、法外之诸子多在此部）
    "墨子": "mozi", "吕氏春秋": "lvshichunqiu", "淮南子": "huainanzi",
    "论衡": "lunheng", "世说新语": "shishuoxinyu",
    "公孙龙子": "gongsunlongzi", "尹文子": "yinwenzi", "慎子": "shenzi2",
    # 子部 · 农家、释家
    "齐民要术": "qiminyaoshu", "天工开物": "tiangongkaiwu",
    "六祖大师法宝坛经": "tanjing", "五灯会元": "wudenghuiyuan",
    "佛说四十二章经": "sishierzhangjing", "了凡四训": "liaofansixun",
    # 集部 · 楚辞、诗文评、总集
    "楚辞": "chuci", "文心雕龙": "wenxindiaolong", "诗品": "shipin",
    "人间词话": "renjiancihua", "古文观止": "guwenguanzhi",
    "唐诗三百首": "tangshisanbaishou",
    # 集部 · 小说（西游记是第一个新世界的本文，必收；余为四大名著与志怪之要）
    "西游记": "xiyouji", "红楼梦": "honglou", "三国演义": "sanguoyanyi",
    "水浒传": "shuihu", "聊斋志异": "liaozhai", "封神演义": "fengshen",
    "山海经": "shanhaijing", "儒林外史": "rulinwaishi", "镜花缘": "jinghuayuan",
}


# ── 著者补表：书名 → (朝代, 著者) ──────────────────────────────────────
#
# 导出的 Catalog.json 里，`author`/`dynasty` 七成是空的（选中的七十六部中有七十部
# 两栏皆空）。一部典籍不著撰人、不题朝代，在四库这条分类轴上便少了半边——
# 「《韩非子》先秦韩非」与「《韩非子》著者未详」是两种书目。故此处补一张表。
#
# 两条自律：
# 1. **只补空白，不改原著录。** 源里有的（如《孟子》孟轲）一概照旧，
#    此表只在两栏皆空时才落笔。
# 2. **旧题者注明「旧题」。** 《六韬》题吕望、《管子》题管仲、《列仙传》题刘向，
#    皆是后人依托，历代已有定论。照抄作者名便是替伪托作保；注一笔「旧题」，
#    读者自知其分际。这是著录之体，不是谨慎过头。
BYLINE = {
    # 经部
    "周易": ("先秦", ""), "孝经": ("先秦", ""), "论语": ("先秦", "孔子弟子"),
    "尔雅": ("先秦", ""), "春秋左传": ("先秦", "左丘明"),
    "春秋公羊传": ("先秦", "公羊高"), "春秋谷梁传": ("先秦", "谷梁赤"),
    # 史部
    "汉书": ("汉", "班固"), "后汉书": ("南朝宋", "范晔"),
    "三国志 裴松之注": ("晋", "陈寿（裴松之注）"), "资治通鉴": ("宋", "司马光"),
    "战国策": ("汉", "刘向集录"), "国语": ("先秦", "左丘明（旧题）"),
    "晏子春秋": ("先秦", ""),
    # 子部 · 儒家
    "传习录": ("明", "王守仁"), "盐铁论": ("汉", "桓宽"),
    "朱子语类": ("宋", "朱熹（黎靖德编）"), "说苑": ("汉", "刘向"),
    "新序": ("汉", "刘向"), "春秋繁露": ("汉", "董仲舒"),
    "荀子": ("先秦", "荀况"), "孔子家语": ("魏", "王肃（旧题）"),
    # 子部 · 道家
    "抱朴子内篇": ("晋", "葛洪"), "列仙传": ("汉", "刘向（旧题）"),
    "列子": ("先秦", "列御寇"), "道德经（老子）": ("先秦", "李耳"),
    "庄子": ("先秦", "庄周"), "文子": ("先秦", ""),
    # 子部 · 法家
    "韩非子": ("先秦", "韩非"), "申子": ("先秦", "申不害"),
    "商君书": ("先秦", "商鞅"), "管子": ("先秦", "管仲（旧题）"),
    "邓析子": ("先秦", "邓析"),
    # 子部 · 释家
    "五灯会元": ("宋", "普济"), "了凡四训": ("明", "袁黄"),
    "六祖大师法宝坛经": ("唐", "惠能（法海录）"),
    "佛说四十二章经": ("汉", "迦叶摩腾、竺法兰译"),
    # 子部 · 兵家
    "鬼谷子": ("先秦", ""), "司马法": ("先秦", "田穰苴（旧题）"),
    "尉繚子": ("先秦", "尉缭"), "孙子兵法": ("先秦", "孙武"), "孙膑兵法": ("先秦", "孙膑"),
    "吴子": ("先秦", "吴起"), "三略": ("汉", "黄石公（旧题）"),
    "三十六计": ("明", ""), "六韬": ("先秦", "吕望（旧题）"),
    # 子部 · 农家
    "天工开物": ("明", "宋应星"), "齐民要术": ("北魏", "贾思勰"),
    # 子部 · 杂家
    "淮南子": ("汉", "刘安"), "吕氏春秋": ("先秦", "吕不韦"),
    "慎子": ("先秦", "慎到"), "尹文子": ("先秦", "尹文"),
    "论衡": ("汉", "王充"), "墨子": ("先秦", "墨翟"),
    "公孙龙子": ("先秦", "公孙龙"), "世说新语": ("南朝宋", "刘义庆"),
    # 集部
    "楚辞": ("先秦", "屈原等（刘向集）"), "文心雕龙": ("南朝梁", "刘勰"),
    "诗品": ("南朝梁", "钟嵘"), "人间词话": ("清", "王国维"),
    "古文观止": ("清", "吴楚材、吴调侯编"), "唐诗三百首": ("清", "蘅塘退士编"),
    "西游记": ("明", "吴承恩"), "红楼梦": ("清", "曹雪芹"),
    "三国演义": ("明", "罗贯中"), "水浒传": ("明", "施耐庵"),
    "聊斋志异": ("清", "蒲松龄"), "封神演义": ("明", "许仲琳"),
    "山海经": ("先秦", ""), "儒林外史": ("清", "吴敬梓"),
    "镜花缘": ("清", "李汝珍"),
}


CN_NUM = {"零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7,
          "八": 8, "九": 9, "十": 10, "百": 100, "千": 1000, "元": 1}


def cn_int(s: str):
    """「二十七」→ 27、「一百」→ 100。认不出就返 None。"""
    if not s:
        return None
    total, section, ok = 0, 0, False
    for ch in s:
        v = CN_NUM.get(ch)
        if v is None:
            return None
        ok = True
        if v >= 100:
            section = (section or 1) * v
            total += section
            section = 0
        elif v == 10:
            section = (section or 1) * 10
        else:
            section += v
    return total + section if ok else None


ORD_RE = re.compile(r"^第([零一二三四五六七八九十百千元]+)[回卷篇章节]")


def chap_order(name: str):
    """章目的排序键。

    导出里的篇序是乱的——《西游记》第二条就是「第一百回」，第三条是「第七十一回」。
    不理这一层，读者打开书看见的目录便是一把乱牌。故按章名里的「第X回／卷／篇」
    还原本来的次第。

    无「第X回」可认的（如「介绍」「西游记」这类小引）排在最前，仍按原序；
    但「附录」「跋」一类按其名目排在最后——这两头的位置是常识，不是数得出来的。
    """
    m = ORD_RE.match(name.strip())
    if m:
        k = cn_int(m.group(1))
        if k is not None:
            return (1, k)
    if name.strip()[:2] in ("附录", "附錄") or name.strip()[:1] in ("跋",):
        return (2, 0)
    return (0, 0)


def stream_records(path):
    """逐条吐出 SiKuQuanShu.json 里的记录（见模块注释第 1 条）。"""
    buf = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.rstrip("\n")
            if s in ("[", "]", ","):
                continue
            if s == "{":
                buf = ["{"]
                continue
            if s in ("}", "},"):
                buf.append("}")
                try:
                    yield json.loads("".join(buf))
                except json.JSONDecodeError:
                    pass
                buf = []
                continue
            if buf:
                buf.append(s)


def main():
    only = set(sys.argv[1:])  # 给了 id 便只切这几部，不给则全切
    os.makedirs(OUT, exist_ok=True)

    # ── 目录：全量著录，选中者挂 bookId ──
    cat = json.load(open(os.path.join(SRC, "Catalog.json"), encoding="utf-8"))
    entries, by_title = [], {}
    for x in cat:
        bare = x["title"].strip("《》")
        e = {
            "group": x["group"].replace("部", ""),
            "category": x.get("category", "") or "未分类",
            "title": bare,
            "author": x.get("author", "") or "",
            "dynasty": x.get("dynasty", "") or "",
        }
        bid = SELECT.get(bare)
        if bid and (not only or bid in only):
            e["bookId"] = bid
            # 著者只在源里两栏皆空时才补（见 BYLINE 顶注第 1 条）
            if not e["author"] and not e["dynasty"] and bare in BYLINE:
                e["dynasty"], e["author"] = BYLINE[bare]
            by_title.setdefault(bare, e)
        entries.append(e)

    targets = {t: e for t, e in by_title.items()}
    print(f"目录 {len(entries)} 部；选中切正文 {len(targets)} 部", flush=True)
    missing = [t for t, b in SELECT.items() if t not in by_title and (not only or b in only)]
    if missing:
        print(f"选书表里这几种在目录中查无此书，跳过：{missing}", flush=True)

    # ── 正文：流式扫一遍，按书聚起来；扫完才排序落盘（见 chap_order） ──
    # 选中的七十余部合计约 1500 万字，聚在内存里不过几十 MB，换一副顺序的目录值得。
    bag = {t: [] for t in targets}  # title → [(原序, 章名, 正文)]
    seen = 0
    for rec in stream_records(os.path.join(SRC, "SiKuQuanShu.json")):
        seen += 1
        if seen % 4000 == 0:
            print(f"  扫过 {seen} 篇……", flush=True)
        bare = (rec.get("title") or "").strip("《》")
        if bare not in bag:
            continue
        content = (rec.get("content") or "").strip()
        if not content:
            continue
        name = (rec.get("chapter") or "").strip() or f"第{len(bag[bare]) + 1}篇"
        bag[bare].append((len(bag[bare]), name, content))

    # ── 排序、落盘、书级 meta ──
    for bare, e in targets.items():
        items = sorted(bag[bare], key=lambda it: (chap_order(it[1]), it[0]))
        if not items:
            print(f"  ! {bare} 一章未得，正文里查无此书", flush=True)
            e.pop("bookId", None)
            continue
        bid = e["bookId"]
        d = os.path.join(OUT, "books", bid)
        os.makedirs(d, exist_ok=True)
        cs = []
        for n, (_, name, content) in enumerate(items, 1):
            with open(os.path.join(d, f"{n}.json"), "w", encoding="utf-8") as f:
                json.dump({"n": n, "name": name, "content": content}, f, ensure_ascii=False)
            cs.append({"n": n, "name": name, "chars": len(content)})
        e["chapters"] = len(cs)
        meta = {
            "id": bid, "title": bare, "group": e["group"], "category": e["category"],
            "author": e["author"], "dynasty": e["dynasty"], "chapters": cs,
        }
        with open(os.path.join(OUT, "books", bid, "meta.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False)
        print(f"  {bare:<16} {bid:<18} {len(cs):>4} 章 {sum(c['chars'] for c in cs):>9} 字", flush=True)

    with open(os.path.join(OUT, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False)
    ok = sum(1 for e in entries if e.get("bookId"))
    print(f"DONE 著录 {len(entries)} 部 · 可读 {ok} 部 · 扫过 {seen} 篇", flush=True)


if __name__ == "__main__":
    main()
