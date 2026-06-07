const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright");

const outDir = "C:\\Users\\mflan\\Documents\\Codex\\2026-06-03\\game-studio-plugin-game-studio-openai\\work";
const target = "http://127.0.0.1:4173";

async function canvasStats(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const sample = ctx.getImageData(0, 0, w, h).data;
    let nonEmpty = 0;
    let colorBuckets = new Set();
    for (let i = 0; i < sample.length; i += 64) {
      const a = sample[i + 3];
      if (a > 0) {
        nonEmpty += 1;
        colorBuckets.add(`${sample[i] >> 4}-${sample[i + 1] >> 4}-${sample[i + 2] >> 4}`);
      }
    }
    return {
      width: w,
      height: h,
      nonEmpty,
      colorBuckets: colorBuckets.size
    };
  });
}

async function runCase(name, viewport) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width <= 520,
    hasTouch: viewport.width <= 520
  });
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleMessages.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(target, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outDir, `${name}-title.png`) });
  const titleStats = await canvasStats(page);

  await page.click("#playButton");
  await page.waitForTimeout(250);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  await page.click("#fireButton");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, `${name}-playing.png`) });
  const playingStats = await canvasStats(page);

  const layout = await page.evaluate(() => {
    const hud = document.querySelector(".hud").getBoundingClientRect();
    const controls = document.querySelector(".touch-controls").getBoundingClientRect();
    const fire = document.querySelector("#fireButton").getBoundingClientRect();
    const pad = document.querySelector("#movePad").getBoundingClientRect();
    return {
      hud: { top: hud.top, bottom: hud.bottom, left: hud.left, right: hud.right },
      controls: { top: controls.top, bottom: controls.bottom },
      fire: { width: fire.width, height: fire.height },
      pad: { width: pad.width, height: pad.height },
      overlayHidden: document.getElementById("overlay").hidden,
      guardStatus: document.getElementById("guardStatus").textContent
    };
  });

  await browser.close();
  return { name, viewport, titleStats, playingStats, layout, consoleMessages, pageErrors };
}

(async () => {
  const results = [];
  results.push(await runCase("mobile-390x844", { width: 390, height: 844 }));
  results.push(await runCase("desktop-1280x720", { width: 1280, height: 720 }));
  console.log(JSON.stringify(results, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
