const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const outDir = path.resolve(__dirname);

const worlds = [
  { level: 1, hero: "tal", title: "Presentation Empire", map: "presentationEmpire" },
  { level: 2, hero: "mendel", title: "Bedouin Desert", map: "bedouinDesert" },
  { level: 3, hero: "amichai", title: "Casino Kingdom", map: "casinoKingdom" },
  { level: 4, hero: "hadar", title: "Mom's Kingdom", map: "momsKingdom" },
  { level: 5, hero: "amit", title: "Date Dimension", map: "dateDimension" },
  { level: 6, hero: "halel", title: "Party Dimension", map: "partyDimension" },
  { level: 7, hero: "david", title: "AI Nexus", map: "aiNexus" },
  { level: 8, hero: "farber", title: "Other Friend Group", map: "otherFriendGroup" },
  { level: 9, hero: "goodman", title: "Debate Republic", map: "debateRepublic" },
  { level: 10, hero: "gelman", title: "Luxury Kingdom", map: "luxuryKingdom" },
  { level: 11, hero: "giat", title: "Dad Kingdom", map: "dadKingdom" },
  { level: 12, hero: "kuzar", title: "Football Market Kingdom", map: "footballMarket" },
  { level: 13, hero: "bruiner", title: "Comfort Kingdom", map: "comfortKingdom" },
  { level: 14, hero: "dan", title: "Family Kingdom", map: "familyKingdom" }
];

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

function assertEqual(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function assertAtMost(label, actual, limit) {
  if (actual > limit) throw new Error(`${label}: expected <= ${limit}, got ${actual}`);
}

async function waitForFlowQa(page) {
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });
}

async function waitForArena(page) {
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(600);
}

async function sampleFps(page, durationMs = 2600) {
  return page.evaluate((duration) => new Promise((resolve) => {
    let frames = 0;
    let worstFrameMs = 0;
    const started = performance.now();
    let last = started;
    const tick = (now) => {
      frames += 1;
      worstFrameMs = Math.max(worstFrameMs, now - last);
      last = now;
      if (now - started < duration) {
        requestAnimationFrame(tick);
      } else {
        resolve({
          fps: Math.round((frames / ((now - started) / 1000)) * 10) / 10,
          worstFrameMs: Math.round(worstFrameMs * 10) / 10,
          frames
        });
      }
    };
    requestAnimationFrame(tick);
  }), durationMs);
}

async function getCounts(page) {
  return page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
}

async function getSnapshot(page) {
  return page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  let page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
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
  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.unlockAll());

  const sweep = [];
  for (const world of worlds) {
    await page.evaluate((level) => {
      window.__DAN_QUEST_FLOW_QA__.menu();
      window.__DAN_QUEST_FLOW_QA__.unlockAll();
      window.__DAN_QUEST_FLOW_QA__.start(level);
    }, world.level);
    await waitForArena(page);
    const snap = await getSnapshot(page);
    const counts = await getCounts(page);
    assertEqual(`level ${world.level} title`, snap.missionTitle, world.title);
    assertEqual(`level ${world.level} map`, snap.map, world.map);
    assertEqual(`level ${world.level} hero`, snap.activeId, world.hero);
    assertEqual(`level ${world.level} quality`, snap.visualDensity, "medium");
    assertAtMost(`level ${world.level} enemies`, counts.enemies, 10);
    assertAtMost(`level ${world.level} allied summons`, counts.alliedSummons, 6);
    assertAtMost(`level ${world.level} projectiles`, counts.projectiles, 40);
    assertAtMost(`level ${world.level} particles`, counts.particles, 12);
    const screenshot = path.join(outDir, `world-quality-level-${String(world.level).padStart(2, "0")}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    sweep.push({
      level: world.level,
      title: snap.missionTitle,
      map: snap.map,
      hero: snap.activeId,
      boss: snap.bossName,
      counts: {
        enemies: counts.enemies,
        projectiles: counts.projectiles,
        particles: counts.particles,
        pools: counts.pools
      },
      screenshot
    });
  }

  await page.close();
  page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
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
    window.__DAN_QUEST_FLOW_QA__.menu();
    window.__DAN_QUEST_FLOW_QA__.unlockAll();
    window.__DAN_QUEST_FLOW_QA__.start(11);
  });
  await waitForArena(page);
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
  await page.waitForTimeout(900);
  const dadCounts = await getCounts(page);
  assertAtMost("Dad heavy enemies", dadCounts.enemies, 10);
  assertAtMost("Dad heavy allied summons", dadCounts.alliedSummons, 6);
  assertAtMost("Dad heavy projectiles", dadCounts.projectiles, 40);
  assertAtMost("Dad heavy particles", dadCounts.particles, 12);
  const dadFps = await sampleFps(page);
  if (dadFps.fps < 18) throw new Error(`Dad Kingdom heavy combat FPS too low: ${JSON.stringify(dadFps)}`);
  const heavyScreenshot = path.join(outDir, "world-quality-dad-heavy-combat.png");
  await page.screenshot({ path: heavyScreenshot, fullPage: false });

  if (consoleErrors.length || pageErrors.length) {
    throw new Error(`Browser errors found: ${JSON.stringify({ consoleErrors, pageErrors }, null, 2)}`);
  }

  await browser.close();
  console.log(JSON.stringify({
    target,
    worldsTested: sweep.length,
    uniqueMaps: [...new Set(sweep.map((item) => item.map))].length,
    dadHeavyCombat: {
      fps: dadFps,
      counts: dadCounts,
      screenshot: heavyScreenshot
    },
    screenshots: sweep.map((item) => item.screenshot),
    sampleWorlds: sweep.map((item) => ({
      level: item.level,
      title: item.title,
      map: item.map,
      boss: item.boss,
      counts: item.counts
    })),
    consoleErrors,
    pageErrors
  }, null, 2));
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
