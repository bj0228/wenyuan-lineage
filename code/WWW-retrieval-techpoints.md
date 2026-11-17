# 检索与弃答：WWW demo 投稿的技术点

> 这份文件是写给论文的素材稿，不是实现文档。每条主张后面都注了**实测数字**与**代码出处**，
> 便于落笔时回查；英文草稿可直接改用。
>
> 对应投稿：「文渊寻脉」（*Wenyuan Xunmai: Debating Within Worlds, Commenting Across Them*），
> 产品名纸上山河。向量/检索**不是**这篇的主线（主线是世界边界话语分流），
> 本节的篇幅目标是两页半里占一节＋两张表。
>
> 日期：2026-10-21。语料规模：1001 条（诸子 786 ＋ 西游 89 ＋ 西方 126）。
> 向量模型：`qwen3.7-text-embedding-flash`（1024 维，L2 已归一化）。
> 判官：`deepseek-v4.1-flash`，temperature 0，逐条 0/1/2。

---

## 0. 定位

**标题不要叫 "Hybrid Retrieval"**，叫 **"Retrieval and Abstention"**。

理由：关键词＋向量加权本身没有新颖性，审稿人不会给分。能立住的是一串
**只有真把系统搭起来才会撞到的失效模式**，且每条都有实测数字。Demo track 吃这个。

贯穿全节的主旨句，建议开篇就放：

> We did not find retrieval quality limited by the embedding model. It was limited by three
> things an off-the-shelf hybrid pipeline gets wrong on classical Chinese: how the two signals
> are fused, what the lexical matching rule counts as evidence, and — most consequentially —
> how retrieval is evaluated when the corpus itself is still growing.

**叙事主线**（整节按这个顺序讲，读起来就是一条因果链，不是零散的 trick 列表）：

```
加向量  →  发现字面打分有病  →  修打分规则  →  发现评测指标有病  →  换评测方法
 (C2)        (诊断性观察)         (C3)          (C4)              (C4 替代指标)
```

---

## C1 弃答需要未归一化的分数（排名分做不了弃答）

### 主张

产品形态要求系统在二十六母题 × 三轴上给锚句，**给不出就该空着**，不能硬填一条。
但归一化后的排名分天然做不到这件事：

- `score` 是池内 min–max 归一化后加权的结果，只回答「这是池里最像的吗」——
  top-1 的分**永远**高，哪怕整池全不相干。
- 弃答要问的是绝对问题：「这条到底切不切题」。只有**原始余弦**答得了。

归一化恰恰毁掉了弃答所需的那个信息。

### 做法

两个信号分开保留、各司其职：

| 信号 | 性质 | 用途 |
|---|---|---|
| `score` | 池内归一化＋加权 | 排序 |
| `sem` | 原始余弦，未归一化 | 唯一一道闸 `SEM_BAR = 0.45` |

`retrieve()` 返回时两者同时带出（`app/world/canon.ts:1194`）：

```ts
return { ...p, score, sem: rawSem.get(p.id) ?? 0 };
```

闸架在 `suggestAnchors` 里（`app/world/canonSource.ts:164`）：`hit.sem >= SEM_BAR`。
另有一道细节值得一提：**检索用题名加题解，而闸只架在题名上**——题解是写给模型看的
一句话，字面宽，拿它过闸等于没闸（`canonSource.ts:157–159`）。

### 证据

- 系统在策展 36 轴里主动放弃 **9** 轴、当代七题 21 轴里放弃 **12** 轴。
- 换来的是 **0 条不切题**。
- 人工策展把 36 轴填满，同一判官判出 **2 条不切题**。

### 英文草稿

> A ranking score cannot support abstention. Because our pooled semantic score is min–max
> normalized within each query's own candidate pool, the top-ranked item always scores highly
> even when no item in the pool is relevant — normalization destroys exactly the information
> abstention needs. We therefore keep both signals and give them different jobs: the normalized
> score drives ranking, while the raw, un-normalized cosine drives a single absolute threshold.
> The system declines 9 of 36 curated axes and 12 of 21 user-authored axes; over the 27 anchors
> it does emit, a pointwise LLM judge finds 10 apt and **zero inapt**, against 9 apt and 2 inapt
> for the 36 hand-curated anchors.

### 强度

**强。** 实测，机理清楚，且直接对应 demo 的可见行为——空栏比错栏好。

---

## C2 未中心化余弦有高地板 → 加性融合在汉语上结构性失效

### 主张

嵌入向量不做均值中心化，于是任意两段汉语的余弦都不低。地板那部分乘上任何权重，
都只是**加给全池的一个常数**，对排序零贡献；真有判别力的只是高出池中位的那一小段。
结果是语义分无论怎么调权，都压不过一个字面噪声——管线悄悄退化成「带常数偏移的
关键词检索」。

### 证据（最干净的一组数）

786 条诸子语料对查询「隐私　被人看见得太多」，text-embedding-v3：

| | 余弦 |
|---|---|
| min | **0.280** |
| median | **0.377** |
| max | **0.581** |

地板 0.280，判别区间只有约 0.2。旧权重 ×8 后仅 **1.6 分**，而一个二字关键词精确命中是
**6 × 2 = 12 分**。

后果具体可举：问「隐私」检出孟子「无恻**隐**之心」（只因共一个字），而纯语义本来检得出
子思子「莫见乎**隐**，莫显乎微，故君子慎其独也」与韩非「事以密成，语以泄败」。

### 做法：`semScaler`（`app/world/canon.ts:963–1001`）

1. 先走一趟全池，按**本题自己的** min/max 定出该查询的实际跨度；
2. 把余弦映到 `[0, 1]`；
3. 只对落在上半段者（`rel ≥ SEM_GATE = 0.5`）记分；
4. 把 `[0.5, 1]` 重铺满 `[0, SEM_WEIGHT = 14]`。

地板因此归零，最切题者拿满 14 分，与一个强字面命中相当——语义这才真进得了排序。

闸门还有**第二重用处**：不设闸时人人余弦为正，`score > 0` 的过滤形同虚设，
一池八百条全算「检到」，`limit` 之外再无门槛。

返回 `null` 表示本池无可用语义分（无向量、维数不合致余弦尽为 0、或跨度为零），
调用方据此降级为纯关键词。

### 可移植性（这句很重要）

换模型后此法照样要：`qwen3.7-text-embedding-flash` 的两两余弦中位是 **0.297**，
地板更低而跨度相近——**结构性问题不随模型消失**。

这一句把 C2 从「我们那个模型的毛病」升格为一般性结论。

### 英文草稿

> Embedding cosines are not mean-centered, so any two passages of Chinese are already similar.
> Over 786 Masters passages against the query "privacy / being seen too much," cosine spans
> 0.280–0.581 (median 0.377). The 0.280 floor, multiplied by any weight, is a constant added to
> the entire pool and contributes nothing to ranking; only the ~0.2 band above the median
> discriminates. Under additive fusion this amounted to 1.6 points against 12 points for a single
> two-character lexical hit, so semantic evidence could never outweigh lexical noise — the
> pipeline silently degenerated into keyword search with a constant offset. We instead rescale
> each query's cosines by that query's own observed min/max, gate at the pool midpoint, and
> stretch the upper half to the full semantic weight. The floor collapses to zero and the
> best-matching passage earns a score comparable to a strong lexical hit. The effect is not
> model-specific: switching embedding models moved the median from 0.377 to 0.297 while leaving
> the spread — and hence the problem — intact.

### 强度

**强。** 最干净的测量，且结论可移植。

---

## C3 对无分词语言，修的是**匹配规则**，不是分词器

最反直觉、也最该写的一条。审稿人几乎一定会问「你为什么不上分词 / BM25」，这节就是答案。

### 现状：`tokenize()` 不分词，是穷举 n-gram

`app/world/canon.ts:1066`。按标点切段，再吐出全部单字＋全部相邻二字。
查询「隐私　被人看见得太多」切出：

```
隐私, 隐, 私, 被, 人, 看, 见, 得, 太, 多, 被人, 人看, 看见, 见得, 得太, 太多, …
```

这是中文检索最省事的兜底做法，上手就会这么写。

### 两个实测噪声案例

1. **借用单字**：孟子「无恻隐之心，非人也」对「隐私」题攒到 **33.5 分**——其 keywords 里有个
   「**人**」，单字精确命中记 6 分，再加「隐」的部分命中与正文命中。而语义满分不过 14 分，
   压它不过。
2. **包含不对称**：公孙龙「见与不见离」拿 **31 分**，全靠 keywords 里一个「见」。
   其余弦只 **0.363**，是全池偏低的一档。

### 关键论断：换上真分词器，这两条一个都修不掉

- **案例 1**：正确切成 `隐私 / 被 / 人 / 看见 / 得 / 太多` 之后，「**人**」还在——它本来就是个词，
  分词器没理由不输出。孟子那 6 分照拿。**汉语有大量真实的单字词，分词不会消除单字项。**
- **案例 2**：分词器给出「看见」这个词，但**包含关系仍在**——「看见」包住条目 keywords 里的
  「见」。那是**匹配规则**的 bug（子串包含跨了词边界），不是切词的 bug。

### 真正的修法：两条规则，分两级

**① 单字降权**，条件是查询自身有成词切片（`hasPhrase`，`canon.ts:1146`）。
单字命中由 6 分降为佐证分 **1.5 / 0.5**，不入主分（`canon.ts:1169–1172`）：

```ts
if (term.length === 1 && hasPhrase) {
  if (p.keywords.some((k) => k === term)) score += 1.5;
  if (p.text.includes(term)) score += 0.5;
  continue;
}
```

公孙龙由 31 分降到 20.5 分。

**② 部分命中要求两边都 ≥2 字**（`canon.ts:1182`，缘由注在 1178–1181）。否则查询切出的二字词会「包住」条目里的
单字关键词：公孙龙的「见」「不见」「得」被「看见」「见得」「得太」各包一次，光这项就记满
**18 分**。加上这条规则后那 18 分归零。

**但不能一概砍掉单字**——这是规则必须以「查询自身有无成词」为判据、而非「单字一律降权」的
原因：「仁」「道」「名」在诸子语境里确是词，典籍图谱点概念节点查的正是单字，那时单字是
**全部**信号。查询本身只一个字则照旧满权。

### 完整打分表（供论文附录或脚注）

| 匹配位置 | 分值 | 备注 |
|---|---|---|
| keywords 精确命中 | `6 × weight` | `weight` = 2（二字以上）/ 1（单字） |
| keywords 部分命中 | `3 × weight` | 须两边皆 ≥2 字（`canon.ts:1182`） |
| 正文命中 | `2 × weight` | |
| 白话 gloss 命中 | `1.5 × weight` | |
| 篇名／书名命中 | `2 × weight` | |
| 单字（查询有词可凭时） | 1.5 / 0.5 | 佐证分，不入主分 |
| 语义 | 0–14 | 归一化后，见 C2 |

另有发言人加权：同一发言人 ×1.8，无主 ×1.1，他人 ×0.75（`canon.ts:1188–1193`）。

### 另三条让分词在此处上不了的约束

写进去，回答「那也该试试」：

1. **检索跑在浏览器里。** 词典型分词器要带几百 KB 到数 MB 词典，压在首屏路径上——
   而这套代码刚为同一理由把向量表挪成懒加载独立 chunk（静态 import 使主 chunk 由 600 余 KB
   涨到 6.6 MB / gzip 2.2 MB）。为多数访客不点的功能再塞一个词典，同样不划算。
2. **语料是文言，现代词典是错的。** 文言里「可以」是 可／以，「至于」是 至／于，
   「其实」是 其／实。拿新闻语料训出的分词器切文言，是用一类新错误换掉一类旧错误；
   而轻量的文言分词器没有现成可嵌入前端的。
3. **单字查询必须满权**（见上）。分词器在这件事上帮不上忙。

### 英文草稿

> Lacking a client-side segmenter, our tokenizer falls back to the standard expedient for
> Chinese: exhaustive unigrams and bigrams. This produces two distinct classes of false
> evidence, both measured. (i) *Borrowed single characters*: Mencius's 「無惻隱之心」 scored
> 33.5 on the "privacy" query, 6 of those points from an exact match on the single character
> 「人」 ("person") in its keyword list — against a maximum semantic contribution of 14.
> (ii) *Containment asymmetry*: Gongsun Long's 「見與不見離」 earned 18 points because three
> query bigrams each contained one of its single-character keywords, despite a cosine of 0.363,
> in the lower part of the pool.
>
> **Word segmentation would not repair either case.** A correct segmentation still emits 「人」
> as a token, because it is a genuine word; Chinese has many single-character words, so
> segmentation does not eliminate single-character terms. And the containment failure is a
> property of the *matching rule* — substring containment across a word boundary — not of
> tokenization. The effective fix was therefore in scoring, not tokenization: single-character
> hits are demoted to corroborating weight whenever the query contains any multi-character term,
> and partial matches require at least two characters on both sides. These two rules removed 10.5
> and 18 points respectively from the two cases above. Crucially, the demotion is conditioned on
> the *query*, not applied unconditionally: single characters such as 仁 (benevolence), 道 (the
> Way), and 名 (name) are themselves the full query when a user clicks a concept node in our
> canon graph, and must retain full weight there.

### 强度

**中强，但须诚实标注。** 这是**机理论证，不是消融实验**——我们没有真跑一个 jieba 分支去对比。
论证本身很硬（「人」是真词；包含是规则 bug），但若审稿人要求，他要的是一条分词 arm。
见 §「还缺的实验」第 2 条。

---

## 诊断性观察：加入第二个信号的首要价值是**诊断第一个**

值得单独一句，因为它是整节叙事的接缝。

纯关键词时代，孟子那 33.5 分就是池里最高分，**没有参照物说它错**。是语义分进来之后才暴露——
语义满分 14 压不过 33.5——才回头去查那 33.5 是怎么攒出来的。

> In our experience the first benefit of adding a semantic signal was not better ranking but
> *diagnosis*: under keyword-only retrieval the 33.5-point false positive was simply the top
> result, with nothing to contradict it. It became visible only once a second,
> independently-derived signal scored it low, and that contradiction is what led us to the two
> scoring-rule defects described above.

---

## C4 精确重合指标在语料扩充下失效 ← 全节最有分量的一条

若只能留一个贡献点，留这个。它不是工程发现而是方法论发现，对任何做古典语料检索的人都成立，
也是本节唯一可能被别人引用的一条。

### 事实链

西游 15→89、西方 15→126 条之后，「与策展人那唯一一条锚重合」的指标由 **44.4% 掉到 2.8%**
（16/36 → 1/36），而**检出的锚反而更正了**：

| 母题 | 扩池后检出 | 评价 |
|---|---|---|
| 名与实 | 公孙龙「夫名，实谓也」 | 不劣于策展那条 |
| 师徒 | 「师作徒，徒作师，方可保全」 | 不劣于策展那条 |

### 原因

补进来的 274 条是按**母题覆盖**检索挑的；每轴现在都有好几条一样切题的句子，
策展人那条**不再是唯一正解**。指标掉的是分子的「唯一性」，不是质量。

### 替代指标

逐条切题判官（`deepseek-v4.1-flash`，temperature 0，0/1/2 三档），
**逐条判、不并排比**——并排比会让一条显眼的句子通吃（机理见 C5）。配一条人工基准线。

实测：

| | 出锚 | 切题 | 不切题 |
|---|---|---|---|
| 系统（闸 0.45） | 27 | **10 (37%)** | **0** |
| 人工策展 | 36 | 9 (25%) | 2 |

当代七题由「10 条锚，切题 1、不切题 2」变为「9 条锚，切题 2、不切题 0」。

### 顺带一条同类的：扩充之前的逐轴对比本身就是伪的

当时 zhanguo 池 786、xiyou 15、west 15——west 那 11/12 的 top-1「准确率」实际是 **15 选 1**。
**跨不等规模池求平均没有意义。**

这正是去扩池的原因；写出来能把「为什么要花力气扩语料」讲成**实验必要性**，
而不是数据工程杂活。

### 英文草稿

> **Exact agreement with a single curator pick is not a valid retrieval metric while the corpus
> is still growing.** Expanding two of our three axes from 15 to 89 and 126 passages drove
> agreement from 44.4% to 2.8% *while retrieval quality measurably improved*: manual inspection
> confirms the newly retrieved anchors are as apt as or more apt than the curator's. The
> mechanism is mechanical rather than qualitative — expansion was driven by motif coverage, using
> the same thematic queries that drive the retriever, so each axis acquired several equally apt
> passages and the curator's single pick ceased to be the unique correct answer. We therefore
> replace agreement with a **pointwise** aptness judge on a 0/1/2 scale, reported against a
> human-curator reference line. A related confound affects any per-axis breakdown taken before
> expansion: with pools of 786, 15, and 15 passages, a reported 11/12 top-1 accuracy on the
> smallest axis was a 1-in-15 choice. Averaging accuracy across pools of unequal size is not
> meaningful, which is itself the reason the expansion was necessary.

### 强度

**强。**

---

## C5 负结果三条（demo paper 的便宜分）

都是「看起来该有用、实测掉分」，且各有明确失效机理。写成一张表最省地方。

### Table 2 候选：消融

| 配置 | 与策展重合 | 失效机理 |
|---|---|---|
| 纯字面，不设闸 | 36 轴条条出锚，相合仅 10 条 | 无绝对门槛，`score > 0` 形同虚设 |
| 纯字面＋字面闸 (`solidlyHit`) | 覆盖 30.6%，出锚者 81.8% | — |
| **基线：字面＋归一化语义＋余弦闸** | **44.4%** | — |
| ＋LLM listwise 重排 | **25.0%** | 候选集小时一条显眼句通吃——「我现在不是拉曼却的堂吉诃德了…」被四个不同母题同时选中 |
| ＋HyDE 查询扩写 | **36.1%** | 扩写把文言查询拉向现代汉语，离语料更远 |

### listwise 的失效直接推出了评测协议

**判官必须逐条判。** 这条因果链写出来，三个负结果就不是「我们试了些没用的东西」，
而是「我们据此定下了评测方法」——身价完全不同。

### 一处必须处理的内部张力

这张表用的是 44.4% 那个指标，而 C4 刚说它作废了。处理办法：

明确标注这组消融**在固定的旧语料上**测得，当时指标仍有效；并说明**正是这组测量之后的扩池
使该指标失效**。顺序讲清楚就不矛盾，反而成了 C4 的现场证据。

---

## C6 闸线不可移植，但标定流程可复现

### 主张

`SEM_BAR` 是**绝对**余弦，随模型漂：

| 模型 | 两两余弦中位 | `SEM_BAR` |
|---|---|---|
| `text-embedding-v3` | 0.377 | 0.50 |
| `qwen3.7-text-embedding-flash` | 0.297 | **0.45** |

### 换模型的连带工序（缺一则语义检索静默失效或失准）

1. 改**两处**模型名，一字不差——`scripts/embed-canon.mjs` 的 `MODEL`、
   `worker/index.ts` 的 `DEFAULT_EMBED_MODEL`。否则查询向量与库向量不同源，余弦无从比较。
2. 全量重算 1001 条向量（`scripts/embed-canon.mjs`）。
3. 重标闸线。

**失效是无声的**：若维数也不同，`canon.ts` 的 `cosine()` 长度不等即返 0，
整条语义通路死掉而不报错。这一点值得在文中点一句——它是「静默失效」这类工程风险的好例子。

### 标定不能靠看分布

策展池余弦最低 **0.282**、当代池最高 **0.684**，**两个分布是重叠的**，画不出一条分界。
只能对判官做闸线扫描：

### Table 3 候选：闸线扫描

| 闸 | 策展出锚 | 切题 | 不切题 | 当代出锚 | 切题 |
|----|---------|------|--------|---------|------|
| 0.30 | 34 | 10 (29%) | 2 | 21 | 2 (10%) |
| 0.40 | 30 | 10 (33%) | 0 | 15 | 2 (13%) |
| **0.45** | **27** | **10 (37%)** | **0** | **9** | **2 (22%)** |
| 0.50 | 24 | 10 (42%) | 0 | 6 | 1 (17%) |

取 0.45，因它**严格优于一切更低的线**：切题数同是 10（放低只多出「勉强」，不多出切题），
而不切题归零、当代题切题率最高。再高到 0.50，策展那边百分比虽好看——那只是分母变小——
当代题却实掉一条切题锚。

（此表与标定说明已在 `app/world/canonSource.ts:116–150` 的注释里，与代码同处。）

### 英文草稿

> The abstention threshold operates on raw cosine and is therefore model-dependent: it was 0.50
> under text-embedding-v3 and 0.45 after switching models, which moved the pairwise median from
> 0.377 to 0.297. It cannot be set by inspecting score distributions, because the apt and inapt
> populations overlap (minimum cosine among curated anchors 0.282; maximum among user-authored
> ones 0.684). We instead sweep the threshold against the pointwise judge and select the value
> that strictly dominates all lower ones. We report the sweep rather than the single constant,
> since the constant does not transfer across embedding models but the procedure does.

### 强度

**中。** 不惊艳，但交付的是**可复现流程**而非一个魔数，审稿人看得出分别。

---

## C7 跨语对齐：句级检索＋二择一 胜过 长上下文抽取

### 主张

给 111 条西方条目配英文原句，共四轮：

| 轮次 | 做法 | 结果 |
|---|---|---|
| 1–3 | 让模型从长上下文「抽出对应句」 | 稳定抽偏成**紧邻的下一句** |
| 3 | 加英译桥（先把文言译成英文再嵌入） | **一条都没多** |
| 4 | 句级候选切分 ＋ 逐条 YES/NO 只判是否同句 ＋ 子串校验 | 58 → **68** |

`dbg.mjs` 证实正确句确实在该分片内（camille-en/10.json），模型就是抽偏。

### 机理

把任务从「生成／截取」换成**二元判定**，消掉了模型在长上下文里的边界漂移；
**子串校验**再把幻觉关在门外——抄回的串须原样见于该分片才算数。

### 诚实留空的 43 条，本身是加分项

| 书 | 对齐数 | 原因 |
|---|---|---|
| 天演论 | 0 / 16 | 严复「达旨」；且 `tianyan-en` 只 99,120 字，连 "natural selection"、"liberty"、"do unto" 都不含，赫胥黎原书未收全 |
| 月界旅行 | 1 / 10 | 鲁迅转译自日文 |
| 茶花女 | 2 / 13 | 林纾口述笔录成文言 |

三者都不逐句直译。**对不上宁可空着**，不拿无关英文充数。
这段说明对齐数是实测而非凑数。

### 强度

**中。** 对做跨语古典语料对齐的人有用；若篇幅紧，可压成 implementation 里一段，
甚至整条砍掉不伤主线。

---

## 必写的 Limitations

现在就标出来，免得被审稿人抓。

1. **选语料的循环性。** 新补的 274 条是用**和 `suggestAnchors` 一模一样的题意查询**挑出来的——
   检索器正在一个由它自己策选的语料上受评。必须明说，并指出策展那 36 条是**唯一独立于检索器**
   的人工基准线。（这也是不该拿系统输出覆盖策展锚的原因：那等于烧掉尺子来证明自己量得准。）
2. **"hybrid keyword + vector" 的适用范围要收窄。** 四库运行期 extras（`loadOwnWorks` 出的
   `siku:*` 条目）**没有向量**，永远排不过那 1001 条。该主张对 quotable 语料（1001 条）与
   `retrieveFull` 成立，对这些 extras 不成立。论文里写成
   "the curated quotable corpus (1,001 passages) and full-text verse retrieval"。
3. **判官是 LLM，不是人。** 0/1/2 判官未做人工一致性校验。至少该标注；
   若还有时间，抽 30 条做人工复判报一致率——成本很低、收益很高。
4. **规模小。** 36 + 21 = 57 轴，不是统计意义上的评测集。Demo track 可接受，但要明说。

---

## 还缺的实验（按性价比排）

1. **纯向量、不要关键词那一臂。** 消融表现在缺这个对角，审稿人一定会问「那光用向量呢」。
   成本最低、最该补。
2. **分词那一臂（C3 的硬化）。** 跑一条 jieba 分支，验证那两个案例确实没修掉。
   这会把 C3 从机理论证升级成实测，是本节最薄弱处的补强。
3. **判官的人工一致率。** 见 Limitations 3。
4. **四库 extras 的向量**，或者就在文中收窄主张（选后者即可，不必补数据）。

---

## 建议的小节骨架（两页半的量）

向量这节不该抢主线。一个小节＋两张表够了。

```
4  Retrieval and Abstention
   4.0  主旨句（§0）＋ 诊断性观察那一段
   4.1  Why additive hybrid fusion fails on Chinese      ← C2
   4.2  Segmentation is not the fix                      ← C3
   4.3  Abstention needs the absolute score              ← C1
   4.4  Evaluating a retriever over a growing corpus     ← C4 ＋ C5 表
   Table 2  Ablations（C5 五行）
   Table 3  Threshold sweep（C6 四行）
   Limitations  循环性 / extras 无向量 / 判官未校验 / 规模
```

C6、C7 若篇幅不够，压成 implementation 里各一段；C7 甚至可整条砍掉不伤主线。

---

## 附：工程侧细节（备查，多数不必入论文）

- **向量表懒加载。** 1001 × 1024 维即便截到五位小数仍 8.2 MB 源码；静态 import 会落进首屏
  那个 chunk。改成 `import()` 单独成块（10 MB 原始 / 2.5 MB gzip），头一次要语义检索时才取。
  入口只 `embedQuery` 一处——它本就是异步的（查询向量要走 `/api/embed`），顺带把表拉进来
  不多一道等待。
- **五位小数截断。** 分量量级 ±0.05，绝对误差 5e-6，对余弦排序无影响，体积省约 60%。
- **批量上限。** `text-embedding-v3` 为 10；`qwen3.7-text-embedding-flash` 为 25（32 即报
  `batch size invalid`）。
- **降级路径。** 未跑 embed 脚本 / `/api/embed` 不通 → `hasVectors` 为 false → 纯关键词；
  单条缺向量 → 其 `sem` 记 0，不影响他条。闸亦退回纯字面那道（`solidlyHit`）。
- **安全。** DashScope API Key 只在 Cloudflare Worker 里，浏览器只调 `/api/*`，不碰 Key。
- **语料来源。** 西游候选 2048 段取自 `public/siku/quotable/xy-*.json`；
  西方 19726 段取自 `public/worldlit/books/`（其中堂吉诃德一部占 10159 段，
  故按母题检索时每书限额 3 条，否则满屏皆是它）。
