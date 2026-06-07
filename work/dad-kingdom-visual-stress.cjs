const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const outDir = path.resolve(__dirname);
const dadEnemyTypes = [
  "diaperTrooper",
  "babyBottleMage",
  "shoppingCartCharger",
  "lowCostCollector",
  "reserveSoldier",
  "couponKing",
  "strollerTitan",
  "reserveCommander"
];
const dadEnemyPositions = [
  { x: -4.8, z: -1.4 },
  { x: -3.1, z: 1.0 },
  { x: -1.2, z: -1.15 },
  { x: 0.4, z: 1.25 },
  { x: 1.9, z: -1.2 },
  { x: 3.15, z: 1.45 },
  { x: 4.45, z: -1.3 },
  { x: 5.15, z: 1.3 }
];

async function waitForFlowQa(page) {
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });
}

async function waitForArena(page) {
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(650);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
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
  await waitForFlowQa(page);
  await page.evaluate(() => {
    window.__DAN_QUEST_FLOW_QA__.unlockAll();
    window.__DAN_QUEST_FLOW_QA__.start(11);
  });
  await waitForArena(page);

  const initial = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot());
  assertEqual("active hero", initial.activeId, "giat");
  assertEqual("mission title", initial.missionTitle, "Dad Kingdom");
  assertEqual("boss name", initial.bossName, "Dad Life");
  assertEqual("companions", initial.companions.length, 0);

  for (let i = 0; i < dadEnemyTypes.length; i += 1) {
    await page.evaluate(({ enemyType, position }) => window.__DAN_QUEST_ARENA_QA__.spawnEnemy(enemyType, position), {
      enemyType: dadEnemyTypes[i],
      position: dadEnemyPositions[i]
    });
  }
  await page.waitForTimeout(900);

  const counts = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
  for (const type of dadEnemyTypes) {
    if (!counts.dadEnemyTypes?.[type]) throw new Error(`missing Dad Kingdom enemy type: ${type}; counts=${JSON.stringify(counts.dadEnemyTypes)}`);
  }
  if (counts.dadEnemies < dadEnemyTypes.length) throw new Error(`expected ${dadEnemyTypes.length} Dad enemies, got ${counts.dadEnemies}`);

  const hudText = await page.locator("body").innerText();
  for (const text of ["Dad Kingdom", "Dad Life", "Solo Rescue: Giat"]) {
    if (!hudText.includes(text)) throw new Error(`missing visible text: ${text}`);
  }

  const screenshot = path.join(outDir, "dad-kingdom-visual-stress.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await browser.close();

  console.log(JSON.stringify({
    target,
    initial: {
      activeId: initial.activeId,
      missionTitle: initial.missionTitle,
      bossName: initial.bossName,
      phase: initial.phase,
      companions: initial.companions.length
    },
    counts: {
      dadEnemies: counts.dadEnemies,
      dadEnemyTypes: counts.dadEnemyTypes,
      projectiles: counts.projectiles,
      particles: counts.particles
    },
    screenshot,
    consoleErrors,
    pageErrors
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
