"use client";

import * as THREE from "three";

/**
 * 过程化贴图：运行时以 canvas 2D 绘制 → THREE.CanvasTexture，
 * 模块级按色缓存（同色只生成一张源贴图），wrapS/T=Repeat，确定性绘制（无 Math.random）。
 * 场景 ssr:false，本模块仅 client 端经组件 useMemo 调用，不触 SSR。
 * 同 bambooPng.ts:153 之 canvas-2D 先例。
 */

/** 改明度：amount 正变亮、负变暗（同 Buildings.tsx 之 shade，此处自带一份免循环依赖） */
function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0.02, amount);
  return `#${c.getHexString()}`;
}

type Ctx = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number, draw: (ctx: Ctx) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const cache = new Map<string, THREE.CanvasTexture>();

function get(key: string, make: () => THREE.CanvasTexture) {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

/** 确定性伪随机（无 Math.random）：sin 杂凑到 [0,1) */
function srand(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** 瓦垄：底色 + 横向瓦行分隔 + 半圆瓦垄凸纹，可平铺 */
export function tileTexture(color: string) {
  return get("tile:" + color, () =>
    makeCanvas(128, 128, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      const row = 16;
      for (let y = 0; y < 128; y += row) {
        ctx.fillStyle = shade(color, -0.1);
        ctx.fillRect(0, y, 128, 2);
        for (let x = 0; x <= 128; x += 8) {
          ctx.beginPath();
          ctx.arc(x, y + row - 1, 4.2, Math.PI, 0);
          ctx.strokeStyle = shade(color, -0.07);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }),
  );
}

/** 木纹：基色 + 竖向纤维 + 节疤，竖向可平铺 */
export function woodTexture(color: string) {
  return get("wood:" + color, () =>
    makeCanvas(64, 256, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 64, 256);
      for (let x = 0; x < 64; x += 2) {
        const v = srand(x, 1);
        ctx.fillStyle = shade(color, v > 0.5 ? 0.04 : -0.05);
        ctx.fillRect(x, 0, 1.2, 256);
      }
      for (let i = 0; i < 3; i++) {
        const x = (i * 23 + 11) % 64;
        const y = (i * 71 + 19) % 256;
        ctx.fillStyle = shade(color, -0.13);
        ctx.beginPath();
        ctx.ellipse(x, y, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }),
  );
}

/** 墙皮：基色 + 细噪斑 + 微龟裂 */
export function plasterTexture(color: string) {
  return get("plaster:" + color, () =>
    makeCanvas(128, 128, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 2) {
        for (let x = 0; x < 128; x += 2) {
          const v = srand(x, y);
          if (v > 0.82) {
            ctx.fillStyle = shade(color, v > 0.91 ? 0.05 : -0.05);
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      ctx.strokeStyle = shade(color, -0.08);
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo((i * 37) % 128, (i * 53) % 128);
        ctx.lineTo((i * 37 + 19) % 128, (i * 53 + 23) % 128);
        ctx.stroke();
      }
    }),
  );
}

/** 石面：基色 + 颗粒 + 接缝网格 */
export function stoneTexture(color: string) {
  return get("stone:" + color, () =>
    makeCanvas(128, 128, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y++) {
        for (let x = 0; x < 128; x++) {
          const v = srand(x, y);
          if (v > 0.78) {
            ctx.fillStyle = shade(color, v > 0.9 ? 0.06 : -0.07);
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.strokeStyle = shade(color, -0.12);
      ctx.lineWidth = 1;
      for (let x = 0; x <= 128; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 128);
        ctx.stroke();
      }
      for (let y = 0; y <= 128; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(128, y);
        ctx.stroke();
      }
    }),
  );
}

/** 格扇窗：透明底 + 边框 + 直棂横竖 + 斜棂（贴图带 alpha，材质须 transparent） */
export function latticeTexture(color: string) {
  return get("lattice:" + color, () =>
    makeCanvas(128, 128, (ctx) => {
      ctx.clearRect(0, 0, 128, 128);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 5);
      ctx.fillRect(0, 123, 128, 5);
      ctx.fillRect(0, 0, 5, 128);
      ctx.fillRect(123, 0, 5, 128);
      for (let x = 10; x <= 118; x += 18) ctx.fillRect(x, 5, 2, 118);
      for (let y = 10; y <= 118; y += 18) ctx.fillRect(5, y, 118, 2);
      ctx.strokeStyle = shade(color, -0.05);
      ctx.lineWidth = 1;
      for (let i = -128; i < 128; i += 18) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 128, 128);
        ctx.stroke();
      }
    }),
  );
}

/** 茅草：草黄竖纹 + 水平草束层，竖向可平铺（Stage 2 茅顶用） */
export function thatchTexture(color: string) {
  return get("thatch:" + color, () =>
    makeCanvas(64, 128, (ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 64, 128);
      for (let x = 0; x < 64; x += 1) {
        const v = srand(x, 1);
        ctx.fillStyle = shade(color, v > 0.5 ? 0.05 : -0.06);
        ctx.fillRect(x, 0, 1, 128);
      }
      for (let y = 0; y < 128; y += 24) {
        ctx.fillStyle = shade(color, -0.07);
        ctx.fillRect(0, y, 64, 3);
      }
    }),
  );
}

/* ── 法线贴图：给瓦/木/石加微表面凹凸，光照下出立体瓦垄/纤维/颗粒，
 *    是"平色 → 写实"质变项。切线空间 RGB=(n+1)/2，flipY=false（normalMap 惯例）。 ── */

/** 法线画布基底：按像素回调给出切线空间法线 [nx,ny,nz]（无需归一化，内部归一） */
function makeNormalCanvas(w: number, h: number, fn: (x: number, y: number) => [number, number, number]) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let [nx, ny, nz] = fn(x, y);
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        const i = (y * w + x) * 4;
        img.data[i] = (nx * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
        img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.flipY = false;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** 瓦垄法线：横向每 8px 一道半圆凸垄（管轴竖向），行间瓦当接缝处下凹。
 *  光从斜上方打来时，每垄显明暗半边，瓦面由"平涂"变"立体起伏"。 */
export function tileNormal() {
  return get("tileN", () =>
    makeNormalCanvas(128, 128, (x, y) => {
      const t = ((x % 8) / 8) * Math.PI; // 0..π 跨一垄宽
      let nx = Math.cos(t); // 垄侧→顶横向倾斜
      let ny = 0;
      let nz = Math.sin(t); // 朝外凸起
      // 瓦当接缝：每 16px 一行，缝处凹陷（法线内倾）
      const g = (y % 16) / 16;
      if (g < 0.14 || g > 0.86) {
        nz *= 0.35;
        ny -= 0.4;
      }
      return [nx, ny, nz];
    }),
  );
}

/** 木纹法线：竖向纤维，横向窄凸棱 + 节疤处微凹。 */
export function woodNormal() {
  return get("woodN", () =>
    makeNormalCanvas(64, 64, (x, y) => {
      const t = ((x % 3) / 3) * Math.PI * 2;
      let nx = Math.sin(t) * 0.35;
      let ny = 0;
      let nz = Math.cos(t) * 0.7 + 0.3;
      // 节疤（确定性位置）处下凹
      for (let i = 0; i < 3; i++) {
        const cx = (i * 23 + 11) % 64;
        const cy = (i * 13 + 7) % 64;
        const d = Math.hypot((x - cx) / 3, (y - cy) / 5);
        if (d < 1) {
          nz -= (1 - d) * 0.7;
          nx -= (x - cx) * 0.02;
        }
      }
      return [nx, ny, nz];
    }),
  );
}

/** 石面法线：颗粒凹凸 + 32px 接缝网格（缝处深陷）。 */
export function stoneNormal() {
  return get("stoneN", () =>
    makeNormalCanvas(128, 128, (x, y) => {
      const v = srand(x, y);
      let nx = (v - 0.5) * 0.7;
      let ny = (srand(x + 5, y - 3) - 0.5) * 0.7;
      let nz = 1 - Math.abs(v - 0.5) * 0.9;
      const dx = Math.min(x % 32, 32 - (x % 32));
      const dy = Math.min(y % 32, 32 - (y % 32));
      if (dx < 2 || dy < 2) {
        nx *= 0.15;
        ny *= 0.15;
        nz = -0.5;
      }
      return [nx, ny, nz];
    }),
  );
}

/**
 * 克隆缓存源贴图并设独立 repeat。
 * three 0.185 中 Texture.clone() 共享 .source（同一 GPU 上传，无重复显存），
 * 而 repeat/offset 为每贴图独立 uniform —— 故同源不同 repeat 的克隆极廉价。
 */
export function withRepeat(src: THREE.CanvasTexture, rx: number, ry: number) {
  const t = src.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}
