import puppeteer from "puppeteer-core";

const EXE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: true,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--disable-dev-shm-usage",
    "--window-size=1600,1000",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
page.on("console", (m) => console.log("PAGE:", m.text()));
page.on("pageerror", (e) => console.log("PAGEERR:", e.message));

const url = process.argv[2] || "http://127.0.0.1:5173/";
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 6000));

// 打开「百家脉络」
await page.evaluate(() => {
  const btn = document.querySelector(".lineage-btn");
  if (btn) btn.click();
});
await new Promise((r) => setTimeout(r, 2000));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => {
  const p = `/tmp/zhuzi-lineage-${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log("SHOTS_OK", p);
};

// 1) 默认全开：控件栏（学派色／时序）＋ 图例（含注解／非）
await shot("default");

// 2) 点一个学者节点 → 详情侧栏（主张／著述／师承·渊源·影响／门人／交游／非）
await page.evaluate(() => {
  const n = document.querySelector(".scholar-node");
  if (n) n.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await sleep(900);
await shot("focus-scholar");

// 3) 点一个典籍节点 → 详情侧栏含「原典篇章」（脉络图↔典籍库联动）
await page.evaluate(() => {
  const n = document.querySelector(".book-node");
  if (n) n.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await sleep(900);
await shot("focus-book");

// 4) 切「地域色」→ 节点按籍贯五色着色、图例出地域五色
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll(".lineage-controls .ctl-group button"));
  const b = btns.find((x) => /地域色/.test(x.textContent || ""));
  if (b) b.click();
});
await sleep(700);
await shot("origin-color");

// 5) 切回学派色，清聚焦后播放时序扫光 → 中段截一张（年代依次点亮）
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll(".lineage-controls .ctl-group button"));
  const b = btns.find((x) => /学派色/.test(x.textContent || ""));
  if (b) b.click();
  // 点 SVG 空白处清聚焦，使扫光呈现全图年代依次点亮（而非仅聚焦节点之一跳邻域）
  const svg = document.querySelector(".lineage-svg");
  if (svg) svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const play = Array.from(document.querySelectorAll(".lineage-controls .ctl-group button")).find((x) => /时序/.test(x.textContent || ""));
  if (play) play.click();
});
await sleep(1600);
await shot("sweep-mid");

await browser.close();
console.log("DONE");
