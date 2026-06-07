const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const outDir = path.resolve(__dirname);

async function waitForArena(page) {
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(250);
}

async function counts(page) {
  return page.evaluate(() => window.__DAN_QUEST_ARENA_QA__?.counts?.());
}

async function sampleMaxCounts(page, ms = 1800, interval = 120) {
  const max = {
    alliedSummons: 0,
    enemies: 0,
    bedouins: 0,
    projectiles: 0,
    pendingProjectiles: 0,
    telegraphs: 0,
    particles: 0
  };
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const next = await counts(page);
    Object.keys(max).forEach((key) => {
      max[key] = Math.max(max[key], next?.[key] || 0);
    });
    await page.waitForTimeout(interval);
  }
  return max;
}

function assertCap(label, value, cap) {
  if (value > cap) throw new Error(`${label} over cap: ${value} > ${cap}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.addInitScript(() => {
    localStorage.removeItem("danQuestArenaSaveV3");
  });

  await page.goto(target, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });
  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.unlockAll());
  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.start(1));
  await waitForArena(page);

  await page.evaluate(() => {
    window.__DAN_QUEST_ARENA_QA__.fillUltimate();
    window.__DAN_QUEST_ARENA_QA__.ultimate();
  });
  await page.waitForTimeout(600);
  const afterMendel = await counts(page);

  for (let i = 0; i < 7; i += 1) {
    await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.kashiSummon("summon"));
  }
  for (let i = 0; i < 4; i += 1) {
    await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.kashiSummon("bedouins"));
  }
  for (let i = 0; i < 10; i += 1) {
    await page.evaluate((kind) => window.__DAN_QUEST_ARENA_QA__.kashiSummon(kind), i % 2 ? "deadline" : "rain");
  }
  const maxDuringKashi = await sampleMaxCounts(page, 1800, 90);
  const afterKashi = await counts(page);
  const snapshot = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot());

  assertCap("allied summons after Mendel ultimate", afterMendel.alliedSummons, 6);
  assertCap("monkeys after Mendel ultimate", afterMendel.monkeys, 6);
  assertCap("allied summons after Kashi stress", afterKashi.alliedSummons, 6);
  assertCap("enemy summons after Kashi stress", afterKashi.enemies, 10);
  assertCap("bedouins after Kashi stress", afterKashi.bedouins, 5);
  assertCap("projectiles after Kashi stress", afterKashi.projectiles, 40);
  assertCap("particles after Kashi stress", afterKashi.particles, 14);
  assertCap("max allied summons during Kashi stress", maxDuringKashi.alliedSummons, 6);
  assertCap("max enemy summons during Kashi stress", maxDuringKashi.enemies, 10);
  assertCap("max bedouins during Kashi stress", maxDuringKashi.bedouins, 5);
  assertCap("max projectiles during Kashi stress", maxDuringKashi.projectiles, 40);
  assertCap("max pending projectiles during Kashi stress", maxDuringKashi.pendingProjectiles, 40);
  assertCap("max telegraphs during Kashi stress", maxDuringKashi.telegraphs, 8);
  assertCap("max particles during Kashi stress", maxDuringKashi.particles, 14);

  const visible = {
    playerInArena: Math.abs(snapshot.player.x) <= 8.5 && Math.abs(snapshot.player.z) <= 8.5,
    kashiInArena: Math.abs(snapshot.kashi.x) <= 8.5 && Math.abs(snapshot.kashi.z) <= 8.5,
    visualDensity: snapshot.visualDensity
  };
  if (!visible.playerInArena || !visible.kashiInArena) throw new Error(`visibility failed: ${JSON.stringify(visible)}`);

  const screenshot = path.join(outDir, "clarity-stress.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await browser.close();

  console.log(JSON.stringify({
    target,
    afterMendel,
    afterKashi,
    maxDuringKashi,
    visible,
    screenshot,
    consoleErrors,
    pageErrors
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
