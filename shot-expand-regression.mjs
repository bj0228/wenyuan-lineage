import puppeteer from "puppeteer-core";

// 回归探针：进诸子世界 → 典籍图谱（新 12 书/28 幽灵/新思想入环、eraOf 纪年）→ 诸子脉络图（canonOnly 幽灵不出轴）。
const EXE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: true,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-dev-shm-usage", "--window-size=1600,1000"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("PAGEERR:", e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const url = process.argv[2] || "http://127.0.0.1:5174/";
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
await sleep(4000);

// 进诸子世界：点子部之座
await page.evaluate(() => {
  const seat = [...document.querySelectorAll('[aria-label^="子部"]')][0];
  seat?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await sleep(14000);

// 典籍面板 → 图谱缩略图 → 全图环
await page.evaluate(() => {
  const tab = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "典籍");
  tab?.click();
});
await sleep(600);
await page.evaluate(() => document.querySelector(".kg-thumb")?.click());
await sleep(4000);

const graph = await page.evaluate(() => {
  const labels = [...document.querySelectorAll(".kg-node text")].map((t) => t.textContent.trim());
  const needBooks = ["管子", "文子", "邓析子", "尹文子", "申子", "慎子", "吴子", "司马法", "尉繚子", "六韬", "三略", "孙膑兵法"];
  const needGhosts = ["朱熹", "王国维", "曹雪芹", "蒲松龄", "山海经", "普济"];
  const needIdeas = ["顿悟", "知行合一", "境界说", "滋味", "拈花微笑", "通变"];
  return {
    nodeCount: document.querySelectorAll(".kg-node").length,
    booksIn: needBooks.filter((b) => labels.includes(b)),
    booksMissing: needBooks.filter((b) => !labels.includes(b)),
    ghostsIn: needGhosts.filter((g) => labels.includes(g)),
    ghostsMissing: needGhosts.filter((g) => !labels.includes(g)),
    ideasIn: needIdeas.filter((g) => labels.includes(g)),
    ideasMissing: needIdeas.filter((g) => !labels.includes(g)),
  };
});
console.log("GRAPH:", JSON.stringify(graph));
await page.screenshot({ path: "/tmp/zhuzi-kg-expand.png" });

// 点一枚汉以后幽灵（朱熹）验 eraOf 纪年（应为「约公元1130年」，不是「约前-1130年」）
await page.evaluate(() => {
  const n = [...document.querySelectorAll(".kg-node")].find((g) => g.querySelector("text")?.textContent.trim() === "朱熹");
  n?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
});
await sleep(1200);
const era = await page.evaluate(() => document.querySelector(".kg-node-detail .kind")?.textContent.trim());
console.log("ERA_ZHUXI:", JSON.stringify(era));
await page.screenshot({ path: "/tmp/zhuzi-kg-zhuxi.png" });

// 关图谱 → 开诸子脉络图：canonOnly 幽灵不该出现在这张轴上，新诸子应该出现
await page.evaluate(() => document.querySelector(".kg-stage .stage-close, .stage-close")?.click());
await sleep(900);
await page.evaluate(() => document.querySelector(".lineage-btn")?.click());
await sleep(3000);

const lin = await page.evaluate(() => {
  const names = [...document.querySelectorAll(".lineage-svg text")].map((t) => t.textContent.trim());
  const newScholars = ["管仲", "吴起", "申不害", "慎到", "邓析", "尹文", "田穰苴", "尉缭", "吕望", "黄石公", "文子"];
  const canonOnly = ["朱熹", "王国维", "曹雪芹", "蒲松龄", "司马光", "慧能"];
  return {
    newIn: newScholars.filter((s) => names.includes(s)),
    newMissing: newScholars.filter((s) => !names.includes(s)),
    canonOnlyLeak: canonOnly.filter((s) => names.includes(s)), // 应为空：汉以后著者不入诸子轴
    wenwangIn: names.includes("文王"), // 先秦溯源幽灵两图皆在
    sweepBtn: !!document.querySelector(".time-ctl button"),
  };
});
console.log("LINEAGE:", JSON.stringify(lin));
await page.screenshot({ path: "/tmp/zhuzi-lineage-regress.png" });

console.log("PROBE_DONE");
await browser.close();
