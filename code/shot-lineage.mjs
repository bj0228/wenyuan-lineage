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

const out = process.argv[3] || "/tmp/zhuzi-lineage.png";
await page.screenshot({ path: out, fullPage: false });
console.log("SHOTS_OK", out);

// 再截一张：关闭典籍/只看思想+人物？保持默认全开即可。另截一张滚到中段。
try {
  const card = await page.$(".lineage-scroll-x");
  if (card) await card.evaluate((el) => (el.scrollLeft = 520));
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: "/tmp/zhuzi-lineage-mid.png", fullPage: false });
  console.log("SHOTS_OK_MID /tmp/zhuzi-lineage-mid.png");
} catch (e) {
  console.log("MID_FAIL", e.message);
}

await browser.close();
