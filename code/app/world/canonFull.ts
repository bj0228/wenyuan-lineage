/**
 * 典籍全文：书→章→句。与 canon.ts 的「可引典」集并存——
 * 可引典供诸子回答引典与典籍 tab 快搜；全文供阅读 + 全文语义检索 + 概念溯源。
 * 逐句一条，附白话 gloss（重点句注、余句从略）。
 */
export type CanonVerse = {
  id: string;
  text: string;
  gloss?: string;
};
export type CanonChapter = {
  id: string;
  name: string;
  verses: CanonVerse[];
};
export type CanonBook = {
  id: string;
  name: string;
  schoolId: string;
  authorId: string;
  chapters: CanonChapter[];
};

export const CANON_FULL: CanonBook[] = [
  {
    id: "lunyu",
    name: "论语",
    schoolId: "ru",
    authorId: "kong",
    chapters: [
      {
        id: "xueer",
        name: "学而",
        verses: [
          { id: "1", text: "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？", gloss: "学过按时温习，不也喜悦吗？有朋友从远方来，不也快乐吗？人家不了解我却不恼怒，不也是君子吗？" },
          { id: "3", text: "巧言令色，鲜矣仁。", gloss: "花言巧语、面目伪善的人，仁德很少。" },
          { id: "4", text: "吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？", gloss: "我每天三次反省自己：替人谋事是否忠心？与朋友交往是否守信？传授的学业是否温习了？" },
        ],
      },
      {
        id: "weizheng",
        name: "为政",
        verses: [
          { id: "1", text: "为政以德，譬如北辰，居其所而众星共之。", gloss: "以德行治理政事，就像北极星处于其位，群星环绕它。" },
          { id: "4", text: "吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺，七十而从心所欲不逾矩。", gloss: "我十五岁立志向学，三十岁自立，四十岁不迷惑，五十岁知天命，六十岁听言皆顺，七十岁随心所欲却不逾越规矩。" },
          { id: "11", text: "温故而知新，可以为师矣。", gloss: "温习旧知而能悟出新知，就可以做老师了。" },
          { id: "15", text: "学而不思则罔，思而不学则殆。", gloss: "只学不思就会迷惘，只思不学就会危险。" },
        ],
      },
      {
        id: "liren",
        name: "里仁",
        verses: [
          { id: "1", text: "里仁为美。择不处仁，焉得知？", gloss: "与仁德为邻才是美。选择居处不选仁厚之处，怎能算明智？" },
          { id: "3", text: "唯仁者能好人，能恶人。", gloss: "只有仁者能正确地喜好人、厌恶人。" },
          { id: "5", text: "富与贵，是人之所欲也；不以其道得之，不处也。", gloss: "富贵是人人想要的，不以正道得到就不接受。" },
          { id: "8", text: "朝闻道，夕死可矣。", gloss: "早上明白真理，晚上死去也甘心。" },
        ],
      },
      {
        id: "yanyuan",
        name: "颜渊",
        verses: [
          { id: "1", text: "克己复礼为仁。一日克己复礼，天下归仁焉。", gloss: "约束自己回到礼就是仁。一旦做到，天下都归于仁。" },
          { id: "2", text: "己所不欲，勿施于人。", gloss: "自己不愿承受的，不要加于别人。" },
        ],
      },
      {
        id: "zilu",
        name: "子路",
        verses: [
          { id: "3", text: "名不正则言不顺，言不顺则事不成。", gloss: "名分不正说话就不顺理，说话不顺理事情就办不成。" },
          { id: "6", text: "其身正，不令而行；其身不正，虽令不从。", gloss: "自身端正，不发令也能推行；自身不正，发令也没人听从。" },
        ],
      },
      {
        id: "weilinggong",
        name: "卫灵公",
        verses: [
          { id: "24", text: "己所不欲，勿施于人。", gloss: "自己不愿承受的，不要加于别人。" },
          { id: "29", text: "人无远虑，必有近忧。", gloss: "人没有长远的考虑，必有眼前的忧患。" },
        ],
      },
      {
        id: "shuer",
        name: "述而",
        verses: [
          { id: "7", text: "自行束脩以上，吾未尝无诲焉。", gloss: "只要自行送上束脩为礼，我没有不教诲的。" },
          { id: "21", text: "不愤不启，不悱不发。举一隅不以三隅反，则不复也。", gloss: "不到学生想求明白而不得时不启发，不到他想说而说不出来时不点拨。举一角不能反推三角，就不再教。" },
        ],
      },
    ],
  },
  {
    id: "daodejing",
    name: "道德经",
    schoolId: "dao",
    authorId: "laozi",
    chapters: [
      { id: "1", name: "一章", verses: [{ id: "1", text: "道可道，非常道；名可名，非常名。无名，天地之始；有名，万物之母。", gloss: "可以说出的道不是恒常的道；可以叫出的名不是恒常的名。无名是天地之始，有名是万物之母。" }] },
      { id: "2", name: "二章", verses: [{ id: "1", text: "有无相生，难易相成，长短相形，高下相倾，音声相和，前后相随。", gloss: "有无互相生成，难易互相成就，长短互相显现，高下互相依存，音声互相和合，前后互相跟随。" }] },
      { id: "8", name: "八章", verses: [{ id: "1", text: "上善若水。水善利万物而不争，处众人之所恶，故几于道。", gloss: "最高的善像水：滋润万物而不争，居于众人所厌恶的低下处，所以接近道。" }] },
      { id: "16", name: "十六章", verses: [{ id: "1", text: "致虚极，守静笃。万物并作，吾以观复。", gloss: "达到虚的极点，守住静的笃实。万物一齐生长，我借此观察它们的复归。" }] },
      { id: "22", name: "二十二章", verses: [{ id: "1", text: "曲则全，枉则直，洼则盈，敝则新，少则得，多则惑。", gloss: "委曲反而能保全，弯屈反而能伸直，低洼反而能充盈，陈旧反而能更新，少取反而能得，贪多反而迷惑。" }] },
      { id: "25", name: "二十五章", verses: [{ id: "1", text: "人法地，地法天，天法道，道法自然。", gloss: "人取法地，地取法天，天取法道，道取法其本然。" }] },
      { id: "37", name: "三十七章", verses: [{ id: "1", text: "道常无为而无不为。侯王若能守之，万物将自化。", gloss: "道从来不强为却无所不成。侯王若能守住它，万物将自行化育。" }] },
      { id: "38", name: "三十八章", verses: [{ id: "1", text: "失道而后德，失德而后仁，失仁而后义，失义而后礼。", gloss: "失去了道才讲德，失去了德才讲仁，失去了仁才讲义，失去了义才讲礼。" }] },
      { id: "57", name: "五十七章", verses: [{ id: "1", text: "以正治国，以奇用兵，以无事取天下。", gloss: "以正道治国，以奇谋用兵，以无为取天下。" }] },
      { id: "63", name: "六十三章", verses: [{ id: "1", text: "为无为，事无事，味无味。大小多少，报怨以德。", gloss: "以无为为为，以无事为事，以无味为味。把大化作小、多化作少，以德报怨。" }] },
      { id: "64", name: "六十四章", verses: [{ id: "1", text: "合抱之木，生于毫末；九层之台，起于累土；千里之行，始于足下。", gloss: "合抱的大树生于细芽；九层的高台起于一筐土；千里的远行始于脚下。" }] },
      { id: "76", name: "七十六章", verses: [{ id: "1", text: "坚强者死之徒，柔弱者生之徒。", gloss: "坚硬刚强是走向死亡的一类，柔弱是含藏生机的一类。" }] },
      { id: "78", name: "七十八章", verses: [{ id: "1", text: "天下莫柔弱于水，而攻坚强者莫之能胜。", gloss: "天下没有比水更柔弱的，但攻破坚硬的东西没有能胜过它的。" }] },
      { id: "81", name: "八十一章", verses: [{ id: "1", text: "信言不美，美言不信。善者不辩，辩者不善。", gloss: "真实的话不华美，华美的话不真实。善良的人不辩驳，辩驳的人不善良。" }] },
    ],
  },
  {
    id: "sunzi",
    name: "孙子兵法",
    schoolId: "bing",
    authorId: "sunwu",
    chapters: [
      { id: "1", name: "计篇", verses: [{ id: "1", text: "兵者，国之大事，死生之地，存亡之道，不可不察也。", gloss: "战争是国家大事，关乎生死存亡，不可不审察。" }] },
      { id: "2", name: "作战篇", verses: [{ id: "1", text: "其用战也贵胜，久则钝兵挫锐，攻城则力屈。", gloss: "用兵作战贵在速胜，久拖则兵器钝挫、锐气受挫。" }] },
      { id: "3", name: "谋攻篇", verses: [
        { id: "1", text: "百战百胜，非善之善者也；不战而屈人之兵，善之善者也。", gloss: "百战百胜不算最好；不战而使敌军屈服，才是最好。" },
        { id: "2", text: "上兵伐谋，其次伐交，其次伐兵，其下攻城。", gloss: "上等用兵挫败敌方谋略，其次挫败其外交，再次击败其军队，最下才是攻城。" },
      ] },
      { id: "4", name: "形篇", verses: [{ id: "1", text: "胜可知，而不可为。不可胜者，守也；可胜者，攻也。", gloss: "胜利可以预见却不能强求。不可被战胜时防守，可以战胜时进攻。" }] },
      { id: "6", name: "虚实篇", verses: [{ id: "1", text: "出其所不趋，趋其所不意。攻而必取者，攻其所不守也。", gloss: "出兵到敌方无法赶到之处，奔袭其意料不及之处。进攻必能夺取，是因为攻击敌方不防守的地方。" }] },
      { id: "7", name: "军争篇", verses: [{ id: "1", text: "兵以诈立，以利动，以分合为变者也。", gloss: "用兵以诡诈立足，以有利才行动，以分散集中为变化。" }] },
      { id: "11", name: "九地篇", verses: [{ id: "1", text: "投之亡地然后存，陷之死地然后生。", gloss: "把士兵投入绝境然后才能保全，陷于死地然后才能求生。" }] },
      { id: "13", name: "用间篇", verses: [{ id: "1", text: "非圣智不能用间，非仁义不能使间。", gloss: "不是圣明智慧的人不能用间谍，不是仁义的人不能驱使间谍。" }] },
    ],
  },
  {
    id: "daxue",
    name: "大学",
    schoolId: "ru",
    authorId: "kong",
    chapters: [
      { id: "1", name: "经一章", verses: [
        { id: "1", text: "大学之道，在明明德，在亲民，在止于至善。", gloss: "大学的宗旨在于显明美德、亲爱民众、达到至善。" },
        { id: "2", text: "知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。", gloss: "知道止于至善然后心志有定，定而后能静，静而后能安，安而后能思虑，思虑而后能有所得。" },
        { id: "3", text: "物有本末，事有终始。知所先后，则近道矣。", gloss: "事物有本末终始，知道先后次序就接近道了。" },
        { id: "4", text: "古之欲明明德于天下者，先治其国；欲治其国者，先齐其家；欲齐其家者，先修其身。", gloss: "古时要在天下显明美德，先治国；要治国，先齐家；要齐家，先修身。" },
        { id: "5", text: "自天子以至于庶人，壹是皆以修身为本。", gloss: "从天子到庶人，一切都以修身为根本。" },
      ] },
    ],
  },
  {
    id: "zhongyong",
    name: "中庸",
    schoolId: "ru",
    authorId: "kong",
    chapters: [
      { id: "1", name: "第一章", verses: [
        { id: "1", text: "天命之谓性，率性之谓道，修道之谓教。", gloss: "天所赋予的叫做性，循性而行叫做道，修明道叫做教。" },
        { id: "2", text: "喜怒哀乐之未发，谓之中；发而皆中节，谓之和。", gloss: "喜怒哀乐未发叫做中，发而都合乎节度叫做和。" },
        { id: "3", text: "致中和，天地位焉，万物育焉。", gloss: "达到中和，天地各得其位，万物生长发育。" },
      ] },
      { id: "20", name: "第二十章", verses: [
        { id: "1", text: "博学之，审问之，慎思之，明辨之，笃行之。", gloss: "广博地学，详审地问，慎重地思，明晰地辨，笃实地行。" },
      ] },
    ],
  },
];

export const canonFullMap: Record<string, CanonBook> = Object.fromEntries(CANON_FULL.map((b) => [b.id, b]));

/** 平铺所有句，附 bookId/book/chapter，供检索与展示。 */
export type FlatVerse = CanonVerse & { bookId: string; book: string; chapter: string; authorId: string; schoolId: string; verseId: string };
export const ALL_VERSES: FlatVerse[] = CANON_FULL.flatMap((b) =>
  b.chapters.flatMap((c) =>
    c.verses.map((v) => ({ ...v, bookId: b.id, book: b.name, chapter: c.name, authorId: b.authorId, schoolId: b.schoolId, verseId: `${b.id}-${c.id}-${v.id}` })),
  ),
);
