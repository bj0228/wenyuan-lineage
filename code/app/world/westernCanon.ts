import type { WorldLitEntry } from "./worldlit";

/**
 * 文明长卷里的西方代表性典籍目录。
 *
 * 这里只存书级元数据；`worldLitId` 指向已经切好正文的书。没有该字段的条目仍可在
 * 长卷中定位和查看著录，但不会假装有全文可读。年份取通行的首次成书／刊行约年，
 * 只用于同期排布，不据此推定中西典籍之间存在影响关系。
 */
export type WesternCanonEntry = {
  id: string;
  name: string;
  author: string;
  year: number;
  era: string;
  origin: string;
  category: "史诗" | "文学" | "哲学" | "史学" | "宗教" | "政治" | "科学" | "社会";
  worldLitId?: string;
};

export const WESTERN_CANON: WesternCanonEntry[] = [
  { id: "gilgamesh", name: "吉尔伽美什史诗", author: "佚名", year: -1800, era: "约前18世纪", origin: "美索不达米亚", category: "史诗" },
  { id: "hebrew-bible", name: "希伯来圣经", author: "多位作者", year: -600, era: "约前10—前2世纪", origin: "古代以色列", category: "宗教" },
  { id: "iliad", name: "伊利亚特", author: "荷马", year: -750, era: "约前8世纪", origin: "希腊", category: "史诗" },
  { id: "odyssey", name: "奥德赛", author: "荷马", year: -720, era: "约前8世纪", origin: "希腊", category: "史诗", worldLitId: "odyssey" },
  { id: "theogony", name: "神谱", author: "赫西俄德", year: -700, era: "约前7世纪", origin: "希腊", category: "史诗" },
  { id: "histories-herodotus", name: "历史", author: "希罗多德", year: -440, era: "约前440年", origin: "希腊", category: "史学" },
  { id: "oresteia", name: "俄瑞斯忒亚", author: "埃斯库罗斯", year: -458, era: "前458年", origin: "希腊", category: "文学" },
  { id: "oedipus", name: "俄狄浦斯王", author: "索福克勒斯", year: -429, era: "约前429年", origin: "希腊", category: "文学" },
  { id: "peloponnesian-war", name: "伯罗奔尼撒战争史", author: "修昔底德", year: -400, era: "约前5世纪末", origin: "希腊", category: "史学" },
  { id: "republic", name: "理想国", author: "柏拉图", year: -375, era: "约前375年", origin: "希腊", category: "哲学" },
  { id: "symposium", name: "会饮篇", author: "柏拉图", year: -370, era: "约前370年", origin: "希腊", category: "哲学" },
  { id: "politics", name: "政治学", author: "亚里士多德", year: -350, era: "约前350年", origin: "希腊", category: "政治" },
  { id: "ethics", name: "尼各马可伦理学", author: "亚里士多德", year: -340, era: "约前4世纪", origin: "希腊", category: "哲学" },
  { id: "poetics", name: "诗学", author: "亚里士多德", year: -335, era: "约前335年", origin: "希腊", category: "哲学" },
  { id: "elements", name: "几何原本", author: "欧几里得", year: -300, era: "约前300年", origin: "希腊化世界", category: "科学" },
  { id: "aeneid", name: "埃涅阿斯纪", author: "维吉尔", year: -19, era: "前19年", origin: "罗马", category: "史诗" },
  { id: "metamorphoses", name: "变形记", author: "奥维德", year: 8, era: "约8年", origin: "罗马", category: "文学" },
  { id: "new-testament", name: "新约", author: "多位作者", year: 100, era: "约1世纪", origin: "地中海世界", category: "宗教" },
  { id: "meditations", name: "沉思录", author: "马可·奥勒留", year: 175, era: "约175年", origin: "罗马", category: "哲学" },
  { id: "confessions-augustine", name: "忏悔录", author: "奥古斯丁", year: 400, era: "约400年", origin: "北非／罗马", category: "宗教" },
  { id: "city-of-god", name: "上帝之城", author: "奥古斯丁", year: 426, era: "426年", origin: "北非／罗马", category: "宗教" },
  { id: "consolation", name: "哲学的慰藉", author: "波爱修斯", year: 524, era: "约524年", origin: "意大利", category: "哲学" },
  { id: "beowulf", name: "贝奥武夫", author: "佚名", year: 900, era: "约8—10世纪", origin: "英格兰", category: "史诗" },
  { id: "song-of-roland", name: "罗兰之歌", author: "佚名", year: 1100, era: "约1100年", origin: "法国", category: "史诗" },
  { id: "summa", name: "神学大全", author: "托马斯·阿奎那", year: 1274, era: "1265—1274年", origin: "意大利", category: "宗教" },
  { id: "divine-comedy", name: "神曲", author: "但丁", year: 1321, era: "1321年", origin: "意大利", category: "文学" },
  { id: "decameron", name: "十日谈", author: "薄伽丘", year: 1353, era: "约1353年", origin: "意大利", category: "文学" },
  { id: "canterbury", name: "坎特伯雷故事集", author: "乔叟", year: 1400, era: "约14世纪末", origin: "英格兰", category: "文学" },
  { id: "prince", name: "君主论", author: "马基雅维利", year: 1513, era: "1513年", origin: "意大利", category: "政治" },
  { id: "utopia", name: "乌托邦", author: "托马斯·莫尔", year: 1516, era: "1516年", origin: "英格兰", category: "政治" },
  { id: "praise-of-folly", name: "愚人颂", author: "伊拉斯谟", year: 1511, era: "1511年", origin: "尼德兰", category: "文学" },
  { id: "copernicus", name: "天体运行论", author: "哥白尼", year: 1543, era: "1543年", origin: "波兰", category: "科学" },
  { id: "essays-montaigne", name: "随笔集", author: "蒙田", year: 1580, era: "1580年", origin: "法国", category: "文学" },
  { id: "midsummer", name: "仲夏夜之梦", author: "莎士比亚", year: 1595, era: "约1595年", origin: "英国", category: "文学", worldLitId: "zhongxia" },
  { id: "hamlet", name: "哈姆莱特", author: "莎士比亚", year: 1601, era: "约1601年", origin: "英国", category: "文学", worldLitId: "hamlet" },
  { id: "quixote", name: "堂吉诃德", author: "塞万提斯", year: 1605, era: "1605年", origin: "西班牙", category: "文学", worldLitId: "quixote" },
  { id: "new-organon", name: "新工具", author: "培根", year: 1620, era: "1620年", origin: "英国", category: "哲学" },
  { id: "dialogue-galileo", name: "关于两大世界体系的对话", author: "伽利略", year: 1632, era: "1632年", origin: "意大利", category: "科学" },
  { id: "discourse-method", name: "方法论", author: "笛卡尔", year: 1637, era: "1637年", origin: "法国", category: "哲学" },
  { id: "leviathan", name: "利维坦", author: "霍布斯", year: 1651, era: "1651年", origin: "英国", category: "政治" },
  { id: "ethics-spinoza", name: "伦理学", author: "斯宾诺莎", year: 1677, era: "1677年", origin: "尼德兰", category: "哲学" },
  { id: "paradise-lost", name: "失乐园", author: "约翰·弥尔顿", year: 1667, era: "1667年", origin: "英国", category: "史诗" },
  { id: "principia", name: "自然哲学的数学原理", author: "牛顿", year: 1687, era: "1687年", origin: "英国", category: "科学" },
  { id: "two-treatises", name: "政府论（下篇）", author: "洛克", year: 1689, era: "1689年", origin: "英国", category: "政治" },
  { id: "gulliver", name: "格列佛游记", author: "斯威夫特", year: 1726, era: "1726年", origin: "爱尔兰", category: "文学" },
  { id: "spirit-laws", name: "论法的精神", author: "孟德斯鸠", year: 1748, era: "1748年", origin: "法国", category: "政治" },
  { id: "candide", name: "老实人", author: "伏尔泰", year: 1759, era: "1759年", origin: "法国", category: "文学" },
  { id: "social-contract", name: "社会契约论", author: "卢梭", year: 1762, era: "1762年", origin: "法国", category: "政治" },
  { id: "wealth-nations", name: "国富论", author: "亚当·斯密", year: 1776, era: "1776年", origin: "英国", category: "社会" },
  { id: "decline-fall", name: "罗马帝国衰亡史", author: "吉本", year: 1776, era: "1776年起", origin: "英国", category: "史学" },
  { id: "pure-reason", name: "纯粹理性批判", author: "康德", year: 1781, era: "1781年", origin: "德国", category: "哲学" },
  { id: "rights-woman", name: "女权辩护", author: "玛丽·沃斯通克拉夫特", year: 1792, era: "1792年", origin: "英国", category: "政治" },
  { id: "faust", name: "浮士德", author: "歌德", year: 1808, era: "1808年", origin: "德国", category: "文学", worldLitId: "faust" },
  { id: "phenomenology", name: "精神现象学", author: "黑格尔", year: 1807, era: "1807年", origin: "德国", category: "哲学" },
  { id: "frankenstein", name: "弗兰肯斯坦", author: "玛丽·雪莱", year: 1818, era: "1818年", origin: "英国", category: "文学" },
  { id: "democracy-america", name: "论美国的民主", author: "托克维尔", year: 1835, era: "1835年", origin: "法国", category: "政治" },
  { id: "communist-manifesto", name: "共产党宣言", author: "马克思、恩格斯", year: 1848, era: "1848年", origin: "德国／英国", category: "政治" },
  { id: "camille", name: "茶花女", author: "小仲马", year: 1848, era: "1848年", origin: "法国", category: "文学", worldLitId: "chahua" },
  { id: "moby-dick", name: "白鲸", author: "赫尔曼·梅尔维尔", year: 1851, era: "1851年", origin: "美国", category: "文学" },
  { id: "origin-species", name: "物种起源", author: "达尔文", year: 1859, era: "1859年", origin: "英国", category: "科学" },
  { id: "on-liberty", name: "论自由", author: "约翰·斯图亚特·密尔", year: 1859, era: "1859年", origin: "英国", category: "政治" },
  { id: "crime-punishment", name: "罪与罚", author: "陀思妥耶夫斯基", year: 1866, era: "1866年", origin: "俄国", category: "文学" },
  { id: "capital", name: "资本论", author: "马克思", year: 1867, era: "1867年（第一卷）", origin: "德国／英国", category: "社会" },
  { id: "war-peace", name: "战争与和平", author: "托尔斯泰", year: 1869, era: "1869年", origin: "俄国", category: "文学" },
  { id: "moon", name: "从地球到月球", author: "凡尔纳", year: 1865, era: "1865年", origin: "法国", category: "文学", worldLitId: "yuejie" },
  { id: "zarathustra", name: "查拉图斯特拉如是说", author: "尼采", year: 1883, era: "1883—1885年", origin: "德国", category: "哲学" },
  { id: "evolution-ethics", name: "天演论", author: "赫胥黎／严复译", year: 1898, era: "1898年中译刊行", origin: "英国／中国", category: "科学", worldLitId: "tianyan" },
  { id: "dream-interpretation", name: "梦的解析", author: "弗洛伊德", year: 1899, era: "1899年", origin: "奥地利", category: "社会" },
  { id: "protestant-ethic", name: "新教伦理与资本主义精神", author: "马克斯·韦伯", year: 1905, era: "1905年", origin: "德国", category: "社会" },
  { id: "relativity", name: "相对论：狭义与广义理论", author: "爱因斯坦", year: 1916, era: "1916年", origin: "德国", category: "科学" },
  { id: "ulysses", name: "尤利西斯", author: "詹姆斯·乔伊斯", year: 1922, era: "1922年", origin: "爱尔兰", category: "文学" },
  { id: "wasteland", name: "荒原", author: "T. S. 艾略特", year: 1922, era: "1922年", origin: "英国／美国", category: "文学" },
  { id: "trial", name: "审判", author: "卡夫卡", year: 1925, era: "1925年", origin: "奥地利", category: "文学" },
  { id: "room-own", name: "一间自己的房间", author: "弗吉尼亚·伍尔夫", year: 1929, era: "1929年", origin: "英国", category: "社会" },
  { id: "brave-new-world", name: "美丽新世界", author: "赫胥黎", year: 1932, era: "1932年", origin: "英国", category: "文学" },
  { id: "being-time", name: "存在与时间", author: "海德格尔", year: 1927, era: "1927年", origin: "德国", category: "哲学" },
  { id: "second-sex", name: "第二性", author: "西蒙娜·德·波伏瓦", year: 1949, era: "1949年", origin: "法国", category: "社会" },
  { id: "nineteen-eighty-four", name: "一九八四", author: "乔治·奥威尔", year: 1949, era: "1949年", origin: "英国", category: "文学" },
];

/** 保证本地已有正文、但目录遗漏的书也能进入长卷。 */
export function withReadableWesternBooks(readable: WorldLitEntry[]): WesternCanonEntry[] {
  const byCanonicalId = new Map(readable.map((e) => [e.id, e]));
  const merged = WESTERN_CANON.map((e) => {
    const hit = byCanonicalId.get(e.id);
    return hit ? { ...e, worldLitId: hit.id } : e;
  });
  const known = new Set(merged.flatMap((e) => e.worldLitId ? [e.worldLitId] : []));
  const extra = readable
    .filter((e) => !known.has(e.id))
    .map<WesternCanonEntry>((e) => {
      const m = e.era.match(/(前)?\s*(\d{1,4})/);
      const year = m ? (m[1] ? -Number(m[2]) : Number(m[2])) : 0;
      return {
        id: e.id,
        name: e.name,
        author: e.author,
        year,
        era: e.era,
        origin: e.origin,
        category: "文学",
        worldLitId: e.id,
      };
    });
  return [...merged, ...extra];
}
