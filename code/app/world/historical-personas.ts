import type { Persona } from "./characters";

type HistoricalSeed = Pick<Persona, "id" | "name" | "school" | "glyph" | "quote" | "intro" | "themes" | "workIds">;

const colors = ["#8d4b3e", "#7b6043", "#4f6f65", "#6e526f", "#8a6842", "#596d88"];

function historical(seed: HistoricalSeed, i: number): Persona {
  return {
    ...seed,
    courtesy: "",
    color: colors[i % colors.length],
    home: "典籍长卷",
    idle: "展卷沉思",
    voice: {
      opening: "此事当从其本末处看。",
      bridge: "据我所著，",
      closing: "循其文脉，方可见其得失。",
    },
    kind: "thinker",
    worldId: "zhonghua",
    retrievalWorldId: "zhanguo",
  };
}

/** 汉至近代的中国文化人物，供事件、母题、典籍与选文评议共同调用。 */
export const historicalPersonas: Persona[] = [
  historical({ id: "dongzhongshu", name: "董仲舒", school: "汉代儒学", glyph: "董", quote: "正其谊不谋其利，明其道不计其功。", intro: "以《春秋》立义，综合天人、教化与王道秩序。", themes: ["春秋", "天人", "教化", "王道", "大一统"], workIds: ["chunqiufanlu"] }, 0),
  historical({ id: "huankuan", name: "桓宽", school: "政论", glyph: "桓", quote: "明者因时而变，知者随事而制。", intro: "据盐铁会议撰成《盐铁论》，保存国家财政与民生之辩。", themes: ["盐铁", "民生", "财政", "法治", "贤良"], workIds: ["yantielun"] }, 1),
  historical({ id: "wangchong", name: "王充", school: "思想家", glyph: "充", quote: "事莫明于有效，论莫定于有证。", intro: "作《论衡》，以实证与辨伪精神批评虚妄。", themes: ["实证", "辨伪", "自然", "命", "论衡"], workIds: ["lunheng"] }, 2),
  historical({ id: "liuxie", name: "刘勰", school: "文论家", glyph: "刘", quote: "文变染乎世情，兴废系乎时序。", intro: "以《文心雕龙》系统讨论文章体制、创作与批评。", themes: ["文心", "体制", "风骨", "神思", "知音"], workIds: ["wenxindiaolong"] }, 3),
  historical({ id: "zhongrong", name: "钟嵘", school: "诗论家", glyph: "钟", quote: "气之动物，物之感人，故摇荡性情，形诸舞咏。", intro: "作《诗品》，品第诗人并论诗歌滋味与源流。", themes: ["诗品", "滋味", "性情", "源流", "品评"], workIds: ["shipin"] }, 4),
  historical({ id: "taoyuanming", name: "陶渊明", school: "诗人", glyph: "陶", quote: "采菊东篱下，悠然见南山。", intro: "以田园、归隐和自然人格开拓中国诗歌的一脉。", themes: ["田园", "归隐", "自然", "桃源", "真意"], workIds: ["siku-1b3702650981"] }, 5),
  historical({ id: "libai", name: "李白", school: "诗人", glyph: "李", quote: "长风破浪会有时，直挂云帆济沧海。", intro: "以雄奇想象、自由精神与盛唐气象入诗。", themes: ["盛唐", "自由", "山水", "酒", "想象"], workIds: ["siku-b44d0b1377d1"] }, 6),
  historical({ id: "dufu", name: "杜甫", school: "诗人", glyph: "杜", quote: "安得广厦千万间，大庇天下寒士俱欢颜。", intro: "以诗存史，在个人身世中书写时代与民生。", themes: ["诗史", "民生", "战乱", "家国", "忧患"], workIds: ["siku-1bb06e3e8fb8"] }, 7),
  historical({ id: "simaguang", name: "司马光", school: "史学家", glyph: "司", quote: "鉴前世之兴衰，考当今之得失。", intro: "主持编纂《资治通鉴》，以编年叙事资治鉴戒。", themes: ["资治", "通鉴", "兴衰", "史法", "政治"], workIds: ["zizhitongjian"] }, 8),
  historical({ id: "sushi", name: "苏轼", school: "文学家", glyph: "苏", quote: "不识庐山真面目，只缘身在此山中。", intro: "诗文书画兼擅，以旷达胸襟观照人生与世变。", themes: ["旷达", "诗词", "人生", "山水", "新变"], workIds: ["siku-757d029e4dbb"] }, 9),
  historical({ id: "zhuxi", name: "朱熹", school: "理学家", glyph: "朱", quote: "问渠那得清如许？为有源头活水来。", intro: "集宋代理学之大成，以格物穷理贯通经典与修身。", themes: ["理学", "格物", "修身", "四书", "义理"], workIds: ["zhuziyulei"] }, 10),
  historical({ id: "wangyangming", name: "王阳明", school: "心学家", glyph: "阳", quote: "知是行之始，行是知之成。", intro: "倡心即理、致良知与知行合一。", themes: ["心学", "良知", "知行合一", "事上磨炼", "心即理"], workIds: ["chuanxilu"] }, 11),
  historical({ id: "guyanwu", name: "顾炎武", school: "经世学者", glyph: "顾", quote: "天下兴亡，匹夫有责。", intro: "重经世致用与实地考察，开清代朴学风气。", themes: ["经世", "考据", "天下", "实学", "音韵"], workIds: ["siku-f0401bb55051"] }, 12),
  historical({ id: "wangfuzhi", name: "王夫之", school: "思想家", glyph: "船", quote: "六经责我开生面，七尺从天乞活埋。", intro: "通经史、论理势，以气本思想反思历史兴亡。", themes: ["气", "理势", "历史", "经学", "船山"], workIds: ["siku-8defce439a4c", "siku-e0beaecfc11a"] }, 13),
  historical({ id: "caoxueqin", name: "曹雪芹", school: "小说家", glyph: "曹", quote: "满纸荒唐言，一把辛酸泪。", intro: "以《红楼梦》写家族盛衰、儿女真情与礼法秩序。", themes: ["红楼", "家族", "情", "盛衰", "礼法"], workIds: ["honglou"] }, 14),
  historical({ id: "pusongling", name: "蒲松龄", school: "小说家", glyph: "蒲", quote: "集腋为裘，妄续幽冥之录。", intro: "借狐鬼花妖写人情世态，在志怪中寄托孤愤。", themes: ["聊斋", "志怪", "人情", "讽刺", "狐鬼"], workIds: ["liaozhai"] }, 15),
  historical({ id: "zhangxuecheng", name: "章学诚", school: "史学家", glyph: "章", quote: "六经皆史也。", intro: "以六经皆史和史德之论重建文史校雠观念。", themes: ["六经皆史", "史德", "校雠", "文史", "方志"], workIds: ["siku-03feaea8305b"] }, 16),
  historical({ id: "wangguowei", name: "王国维", school: "文论家", glyph: "王", quote: "一切景语皆情语也。", intro: "融通中西学术，以境界说评词并研究古史。", themes: ["境界", "词学", "美学", "古史", "中西"], workIds: ["renjiancihua"] }, 17),
];
