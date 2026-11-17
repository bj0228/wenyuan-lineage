import puppeteer from "puppeteer-core";

// 中西文明长卷探针：罗盘页按钮 → 长卷渲染（1019 部中典 + 78 部西典）
// → 五道分栏/朝代段/横滚 → 点书深链四库。
const EXE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: true,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-dev-shm-usage", "--window-size=1600,1000"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERR:", e.message));

const url = process.argv[2] || "http://127.0.0.1:5174/";
// 默认测一部原先仅著录、此次新补切的书；第三个参数可换题名。
const targetTitle = process.argv[3] || "孟子集注";
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 5000));

// 1) 罗盘页在，顶栏两枚入口都在
const top = await page.evaluate(() => ({
  compass: !!document.querySelector(".cp-shell"),
  scrollBtn: [...document.querySelectorAll(".cp-top-links button")].map((b) => b.textContent.trim()),
}));
console.log("STEP1 compass/top-links:", JSON.stringify(top));

// 2) 点「文明长卷 · 四库文脉」
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".cp-top-links button")].find(
    (b) => b.textContent.includes("文明长卷") || b.textContent.includes("四库文脉"),
  );
  if (!btn) throw new Error("文明长卷入口未找到");
  btn?.click();
});
await new Promise((r) => setTimeout(r, 2500));

const probe = await page.evaluate(() => {
  const stage = document.querySelector(".sk-scroll-stage");
  const nodes = [...document.querySelectorAll(".sk-spine")];
  const lanes = [...document.querySelectorAll(".sk-scroll-lane b")].map((b) => b.textContent.trim());
  const segs = [...document.querySelectorAll(".sk-seg-name")].map((t) => t.textContent.trim());
  const svg = document.querySelector(".sk-scroll-svg");
  const fills = new Set(nodes.map((g) => g.querySelector("rect")?.getAttribute("fill")));
  const x = document.querySelector(".sk-scroll-x");
  return {
    stage: !!stage,
    nodeCount: nodes.length,
    lanes,
    segs,
    svgW: svg ? svg.getAttribute("width") : null,
    scrollable: x ? x.scrollWidth - x.clientWidth : 0,
    colors: [...fills],
  };
});
console.log("STEP2 scroll:", JSON.stringify(probe));
if (!probe.stage) throw new Error("文明长卷未打开");
if (probe.nodeCount !== 1097) {
  throw new Error(`文明长卷节点数异常：期望 1097，实际 ${probe.nodeCount}`);
}
if (!probe.lanes.some((lane) => lane.includes("西方典籍"))) {
  throw new Error("西方典籍分道未渲染");
}
await page.screenshot({ path: "/tmp/zhuzi-sk-scroll.png" });

// 3) 滚到卷尾看清段，再双击目标书深链
await page.evaluate(() => {
  const x = document.querySelector(".sk-scroll-x");
  if (x) x.scrollLeft = x.scrollWidth;
});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "/tmp/zhuzi-sk-scroll-tail.png" });

await page.evaluate((targetTitle) => {
  const node = [...document.querySelectorAll(".sk-spine")].find((g) => g.querySelector("title")?.textContent.startsWith(targetTitle));
  if (!node) throw new Error(`${targetTitle} node not found`);
  node.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
}, targetTitle);
await new Promise((r) => setTimeout(r, 3000));

const deep = await page.evaluate(() => ({
  scrollClosed: !document.querySelector(".sk-scroll-stage"),
  sikuOpen: !!document.querySelector(".sk-crumb"),
  crumb: document.querySelector(".sk-crumb")?.textContent.trim().replace(/\s+/g, " "),
  volTitle: document.querySelector(".sk-vol-slip")?.textContent.trim(),
  tocCount: document.querySelectorAll(".sk-toc-item").length,
  hasText: !!document.querySelector(".sk-text p"),
}));
console.log("STEP3 deep-link:", JSON.stringify(deep));
if (!deep.scrollClosed || !deep.sikuOpen) {
  throw new Error("可读中国典籍未能从长卷深链进入阅读层");
}
if (!deep.tocCount || !deep.hasText) throw new Error("新补切典籍未载入章目或正文");
await page.screenshot({ path: "/tmp/zhuzi-sk-deep.png" });

// 4) 新全库抽样正文能检回新增书，并从结果保留原书名。
await page.focus(".sk-search");
await page.keyboard.type("王何必曰利");
await page.waitForFunction(
  () =>
    document.querySelector(".sk-find-note")?.textContent.includes("1002") &&
    [...document.querySelectorAll(".sk-row-src")].some((x) => x.textContent.includes("孟子集注")),
  { timeout: 30000 },
);
const searchProbe = await page.evaluate(() => ({
  note: document.querySelector(".sk-find-note")?.textContent.trim(),
  sources: [...document.querySelectorAll(".sk-row-src")].slice(0, 6).map((x) => x.textContent.trim()),
}));
console.log("STEP4 full-library-search:", JSON.stringify(searchProbe));
await page.screenshot({ path: "/tmp/zhuzi-sk-search-all.png" });

console.log("PROBE_DONE");
await browser.close();
