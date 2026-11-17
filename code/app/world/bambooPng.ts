import type { AnthologyEntry } from "./anthology";

/**
 * 竹简长卷 PNG 导出：手动 canvas 2D 渲染（不用 html2canvas——其对
 * `writing-mode: vertical-rl` 支持差，会破坏竖排；且避免新依赖）。
 * 自右向左逐列画竹简片，列内自上而下逐字誊抄（中文竖排天然栈叠），
 * 超列高即换左一列。绢底、竹色渐变、编绳、楷体墨字。
 */

const SLAT_W = 44;
const SLAT_GAP = 10;
const CHAR_SIZE = 24;
const LINE_H = 30;
const PAD = 24;
const SCROLL_H = 1600;
const ROPE_Y = [PAD + 34, PAD + 54];
const COL_TOP = PAD + 80; // 编绳之下
const COL_BOTTOM = SCROLL_H - PAD;
const CHARS_PER_COL = Math.floor((COL_BOTTOM - COL_TOP) / LINE_H);
const FONT = `'STKaiti','KaiTi','Songti','SimSun','Noto Serif CJK SC',serif`;

type RenderCol = {
  header?: { glyph?: string; text?: string; name?: string; color: string };
  text: string;
  kind: "title" | "round" | "turn" | "host";
  /** 该子色相，用于微染简片底（含发言超长换列的续片亦同染），题签/轮次不染 */
  tint?: string;
};

function buildCols(entry: AnthologyEntry): RenderCol[] {
  const cols: RenderCol[] = [];
  const push = (
    text: string,
    kind: RenderCol["kind"],
    header?: RenderCol["header"],
  ) => {
    const tint = header?.color;
    if (!text) {
      cols.push({ text: "", kind, header, tint });
      return;
    }
    let rem = text;
    let first = true;
    while (rem.length > 0) {
      const headLines = first && header ? 3 : 0;
      const cap = Math.max(1, CHARS_PER_COL - headLines);
      const chunk = rem.slice(0, cap);
      rem = rem.slice(cap);
      cols.push({ header: first ? header : undefined, text: chunk, kind, tint });
      first = false;
    }
  };

  // 题签列
  push(`${entry.date}　${entry.shichen}`, "title", { text: "语录", color: "#9c3f2f" });
  push(`议题　${entry.topic}`, "title");
  push(`参与　${entry.participants.map((p) => `${p.name}（${p.school}）`).join("　")}`, "title");

  for (const r of entry.rounds) {
    push(r.round, "round", { text: r.round, color: "#9c3f2f" });
    for (const t of r.turns) {
      push(t.text, "turn", { glyph: t.glyph, name: t.name, color: t.color });
      if (t.vernacular) push(`白话　${t.vernacular}`, "turn");
    }
  }
  if (entry.hostLine) push(entry.hostLine, "host", { text: "吕不韦", color: "#5a3a7a" });
  return cols;
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSlat(ctx: CanvasRenderingContext2D, x: number, col: RenderCol) {
  const y0 = PAD;
  const h = SCROLL_H - 2 * PAD;
  // 竹简片：竹色渐变
  const g = ctx.createLinearGradient(x, 0, x + SLAT_W, 0);
  g.addColorStop(0, "#b89a4a");
  g.addColorStop(0.5, "#dcb964");
  g.addColorStop(1, "#9c8a44");
  ctx.fillStyle = g;
  roundRectPath(ctx, x, y0, SLAT_W, h, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(90,64,40,0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 染色：诸子之语按其色相微染简片底（题签/轮次不染），与交互视图同款
  if (col.tint && (col.kind === "turn" || col.kind === "host")) {
    ctx.fillStyle = col.tint + "26"; // ~15% alpha
    roundRectPath(ctx, x, y0, SLAT_W, h, 6);
    ctx.fill();
  }

  const cx = x + SLAT_W / 2;
  let y = COL_TOP;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 头部：glyph+名 或 标签字
  if (col.header) {
    if (col.header.glyph) {
      ctx.fillStyle = col.header.color;
      ctx.font = `bold 30px ${FONT}`;
      ctx.fillText(col.header.glyph, cx, y + 12);
      y += LINE_H * 1.2;
      ctx.font = `19px ${FONT}`;
      ctx.fillText(col.header.name ?? "", cx, y + 6);
      y += LINE_H;
    } else if (col.header.text) {
      ctx.fillStyle = col.header.color;
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText(col.header.text, cx, y + 8);
      y += LINE_H;
    }
    ctx.strokeStyle = "rgba(60,53,43,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 7, y);
    ctx.lineTo(x + SLAT_W - 7, y);
    ctx.stroke();
    y += 10;
  }

  ctx.fillStyle = col.kind === "host" ? "#5a3a7a" : "#3c352b";
  ctx.font = `${CHAR_SIZE}px ${FONT}`;
  for (const ch of col.text) {
    if (y > COL_BOTTOM) break;
    ctx.fillText(ch, cx, y);
    y += LINE_H;
  }
}

/**
 * 把一条语录誊抄为竹简长卷 PNG。纯前端 canvas，无后端、无新依赖。
 * 字体取系统楷体栈；无楷体时退 serif，仍可读。
 */
export async function exportBambooPng(entry: AnthologyEntry): Promise<Blob> {
  const cols = buildCols(entry);
  const width = PAD * 2 + Math.max(1, cols.length) * (SLAT_W + SLAT_GAP) - SLAT_GAP;
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(640, width) * scale;
  canvas.height = SCROLL_H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas-ctx");
  ctx.scale(scale, scale);

  // 绢底
  ctx.fillStyle = "#d8c9a6";
  ctx.fillRect(0, 0, width, SCROLL_H);
  ctx.fillStyle = "rgba(120,100,60,0.05)";
  for (let i = 0; i < 280; i++) {
    ctx.fillRect((Math.random() * width) | 0, (Math.random() * SCROLL_H) | 0, 1, 1);
  }
  // 外框
  ctx.strokeStyle = "rgba(90,64,40,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, width - 12, SCROLL_H - 12);

  // 竹简列：自右向左（col[0] 最右）
  for (let i = 0; i < cols.length; i++) {
    const x = width - PAD - (i + 1) * SLAT_W - i * SLAT_GAP;
    drawSlat(ctx, x, cols[i]);
  }

  // 编绳：两道横绳贯穿所有简片
  for (const ry of ROPE_Y) {
    ctx.strokeStyle = "#5a4028";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(PAD, ry);
    ctx.lineTo(width - PAD, ry);
    ctx.stroke();
    ctx.strokeStyle = "rgba(40,28,18,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, ry + 3);
    ctx.lineTo(width - PAD, ry + 3);
    ctx.stroke();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob-failed"))), "image/png");
  });
}

/** 按"日期_议题"命名（议题去特殊字符、截短）。 */
export function yuluFilename(entry: AnthologyEntry): string {
  const safe = entry.topic.replace(/[\\/:*?"<>|]/g, "").slice(0, 16).trim() || "辩论";
  return `${entry.date}_${safe}.png`;
}

/**
 * 分享竹简长卷：`download=true` 时强制下载（"导出"按钮）；
 * 否则移动端调起系统分享面板（含图），桌面端/不支持时落到下载（"分享"按钮）。
 */
export async function shareOrDownloadPng(
  blob: Blob,
  filename: string,
  opts: { download?: boolean } = {},
): Promise<"shared" | "downloaded"> {
  if (!opts.download) {
    const file = new File([blob], filename, { type: "image/png" });
    if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
          return "shared";
        }
      } catch {
        /* 用户取消或失败 → 落到下载 */
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}
