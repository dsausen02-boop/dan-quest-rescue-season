const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";

async function sampleFps(page, durationMs = 1600) {
  return page.evaluate((duration) => new Promise((resolve) => {
    let frames = 0;
    let worstFrameMs = 0;
    const started = performance.now();
    let last = started;
    const tick = (now) => {
      frames += 1;
      worstFrameMs = Math.max(worstFrameMs, now - last);
      last = now;
      if (now - started < duration) requestAnimationFrame(tick);
      else resolve({ fps: Math.round((frames / ((now - started) / 1000)) * 10) / 10, worstFrameMs: Math.round(worstFrameMs * 10) / 10, frames });
    };
    requestAnimationFrame(tick);
  }), durationMs);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));
  await page.addInitScript(() => localStorage.removeItem("danQuestArenaSaveV3"));
  await page.goto(target, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });
  const menu = await sampleFps(page);
  await page.evaluate(() => {
    window.__DAN_QUEST_FLOW_QA__.unlockAll();
    window.__DAN_QUEST_FLOW_QA__.start(11);
  });
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(900);
  const arena = await sampleFps(page);
  const dadEnemyTypes = ["diaperTrooper", "babyBottleMage", "shoppingCartCharger", "lowCostCollector", "reserveSoldier", "couponKing", "strollerTitan", "reserveCommander"];
  for (let i = 0; i < dadEnemyTypes.length; i += 1) {
    await page.evaluate(({ type, index }) => {
      const x = -4.8 + (index % 4) * 2.4;
      const z = index < 4 ? -1.7 : 1.7;
      window.__DAN_QUEST_ARENA_QA__.spawnEnemy(type, { x, z });
    }, { type: dadEnemyTypes[i], index: i });
  }
  await page.evaluate(() => {
    window.__DAN_QUEST_ARENA_QA__.kashiSummon("summon");
    window.__DAN_QUEST_ARENA_QA__.kashiSummon("bedouins");
    window.__DAN_QUEST_ARENA_QA__.fillUltimate();
    window.__DAN_QUEST_ARENA_QA__.ultimate();
  });
  await page.waitForTimeout(1200);
  const snapshot = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot());
  const counts = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
  const heavy = await sampleFps(page);
  const screenshot = path.resolve(__dirname, "diagnose-dad-heavy.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await browser.close();
  console.log(JSON.stringify({ menu, arena, heavy, counts, snapshot: { map: snapshot.map, visualDensity: snapshot.visualDensity, enemies: snapshot.enemies?.length, summons: snapshot.summons?.length, projectiles: snapshot.projectiles?.length, telegraphs: snapshot.telegraphs?.length, particles: snapshot.particles?.length }, screenshot, errors }, null, 2));
})();
