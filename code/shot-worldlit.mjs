import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.setViewport({ width: 1600, height: 1000 });
await p.goto("http://localhost:5173/", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

// 1) 盘面（含右侧海图）
await p.screenshot({ path: "shot-compass.png" });

// 2) 点首港（仲夏夜之梦）——把船驶过去
const clicked = await p.evaluate(() => {
  const ports = document.querySelectorAll(".pc-port");
  if (ports.length < 5) return "ports=" + ports.length;
  ports[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return "clicked 0";
});
console.log(clicked);
await new Promise((r) => setTimeout(r, 9500)); // 等船到港（好望角启航后首程最长）
await p.screenshot({ path: "shot-docked.png" });

// 3) 点「翻开此书」
const opened = await p.evaluate(() => {
  const btn = document.querySelector(".cp-sea-open");
  if (!btn) return "no-open-btn";
  btn.click();
  return "opened";
});
console.log(opened);
// 等阅读面真开（章目与卷面切换钮都出来了再拍——固定睡 2.5 秒曾在 meta 未载入
// 时拍到空页，两张截图字节全同，英文面根本没切过去）
await p.waitForSelector(".wl-lang-btn", { timeout: 20000 });
await p.waitForSelector(".wl-text p", { timeout: 20000 });
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: "shot-worldlit.png" });

// 4) 切英文原书面
await p.evaluate(() => {
  const btns = document.querySelectorAll(".wl-lang-btn");
  const en = [...btns].find((x) => x.textContent?.includes("原书"));
  (en)?.click();
});
await p.waitForFunction(
  () => document.querySelector(".wl-text p")?.textContent?.match(/[a-zA-Z]{3}/),
  { timeout: 20000 },
);
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: "shot-worldlit-en.png" });

await b.close();
console.log("done");
