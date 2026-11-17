/**
 * 诸子古风配音音色映射（DashScope CosyVoice 内置音色 id），按学派/性格 curated。
 * 未配者取 DEFAULT。音色不灵（id 无效或账号未开音频模型）时，由 `SpeakButton`
 * 静默回退到浏览器系统 `speechSynthesis`，配音不中断。
 * 生产可经 env `DASHSCOPE_TTS_VOICE` 全量覆盖默认音色；诸子映射仅在本文件一处可改。
 */
const VOICE_OF: Record<string, string> = {
  kong: "longcheng", // 孔子·沉稳
  meng: "longhua", // 孟子·朗朗雄辩
  xun: "longshu", // 荀子·沉静
  mo: "longcheng", // 墨子·沉稳
  zhuang: "longshu", // 庄子·沉静
  han: "longcheng", // 韩非·冷峻沉稳
  suqin: "longhua", // 苏秦·朗朗
  zhangyi: "longhua", // 张仪·朗朗
  gongsun: "longjielidou", // 公孙龙·磁性
  huishi: "longhua", // 惠施·朗朗
  laozi: "longshu", // 老子·沉静
  zou: "longcheng", // 邹衍·沉稳
  sunwu: "longcheng", // 孙武·沉稳
  lvbuwei: "longcheng", // 吕不韦（主持人）·沉稳
};

/** 男·沉稳，最近"古风"听感的兜底音色 */
const DEFAULT_VOICE = "longcheng";

/** 取某子的配音音色 id；未配或不传取默认。 */
export function voiceOf(scholarId?: string): string {
  return (scholarId && VOICE_OF[scholarId]) || DEFAULT_VOICE;
}
