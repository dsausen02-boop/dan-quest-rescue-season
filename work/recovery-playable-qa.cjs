const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");
const { CHARACTERS, ENEMIES, MISSIONS } = require("../src/gameData.js");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const expectedHeroes = ["mendel", "goodman", "giat", "farber", "aviad", "david", "amichai", "halel", "hadar", "tal", "amit", "gelman", "kuzar", "bruiner", "dan"];
const expectedWorlds = [
  "presentationEmpire",
  "bedouinDesert",
  "casinoKingdom",
  "momsKingdom",
  "dateDimension",
  "partyDimension",
  "aiNexus",
  "otherFriendGroup",
  "debateRepublic",
  "luxuryKingdom",
  "dadKingdom",
  "footballMarket",
  "comfortKingdom",
  "familyKingdom"
];
const forbiddenProjectileKinds = new Set(["circle", "sphere", "orb", "generic", "unknown"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForFlow(page) {
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 15000 });
}

async function waitForArena(page, level) {
  await page.waitForFunction((expectedLevel) => (
    document.documentElement.dataset.danQuestMode === "PLAYING" &&
    Number(document.documentElement.dataset.danQuestLevel) === expectedLevel &&
    !!window.__DAN_QUEST_ARENA_QA__ &&
    !!window.__DAN_QUEST_ARENA_QA__.snapshot()
  ), level, { timeout: 20000 });
}

async function sampleFps(page, durationMs = 900) {
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
      else resolve({
        fps: Math.round((frames / ((now - started) / 1000)) * 10) / 10,
        worstFrameMs: Math.round(worstFrameMs * 10) / 10,
        frames
      });
    };
    requestAnimationFrame(tick);
  }), durationMs);
}

function missionMiniBosses(mission) {
  return mission.miniBossPool || mission.boss.eliteEnemies || [mission.boss.eliteEnemy].filter(Boolean);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.addInitScript(() => localStorage.removeItem("danQuestArenaSaveV3"));
  await page.goto(target, { waitUntil: "networkidle" });
  await waitForFlow(page);

  const heroIds = CHARACTERS.map((hero) => hero.id);
  const worldIds = MISSIONS.map((mission) => mission.map);
  expectedHeroes.forEach((id) => assert(heroIds.includes(id), `Missing hero ${id}`));
  expectedWorlds.forEach((id) => assert(worldIds.includes(id), `Missing world ${id}`));
  assert(CHARACTERS.length >= expectedHeroes.length, `Expected at least ${expectedHeroes.length} heroes, got ${CHARACTERS.length}`);
  assert(MISSIONS.length === expectedWorlds.length, `Expected ${expectedWorlds.length} worlds, got ${MISSIONS.length}`);
  assert(Object.keys(ENEMIES).length >= 90, `Expected expanded enemy roster, got ${Object.keys(ENEMIES).length}`);

  await page.getByRole("button", { name: /World Preview/i }).click();
  await page.waitForSelector(".world-card", { timeout: 15000 });
  const worldCardCount = await page.locator(".world-card").count();
  assert(worldCardCount === expectedWorlds.length, `World Gallery card count was ${worldCardCount}`);
  await page.waitForTimeout(1200);
  const worldGalleryShot = path.resolve(__dirname, "recovery-world-gallery.png");
  await page.screenshot({ path: worldGalleryShot, fullPage: false });
  await page.getByRole("button", { name: /Main Menu/i }).click();
  await waitForFlow(page);

  await page.getByRole("button", { name: /Development Menu/i }).click();
  await page.waitForSelector(".dev-roster-list span", { timeout: 15000 });
  const devRosterCount = await page.locator(".dev-roster-list span").count();
  assert(devRosterCount >= 4, `Development menu roster looked empty: ${devRosterCount}`);
  const devMenuShot = path.resolve(__dirname, "recovery-development-menu.png");
  await page.screenshot({ path: devMenuShot, fullPage: false });

  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.debugStart(1, "tal"));
  await waitForArena(page, 1);
  await page.waitForTimeout(650);

  const catalog = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.projectileCatalog());
  const missingHeroProjectiles = expectedHeroes.filter((id) => !catalog.heroes[id] || forbiddenProjectileKinds.has(catalog.heroes[id]));
  assert(!missingHeroProjectiles.length, `Missing or generic hero projectile kinds: ${missingHeroProjectiles.join(", ")}`);
  const missingUltimateProjectiles = expectedHeroes.filter((id) => !catalog.heroUltimates[id] || forbiddenProjectileKinds.has(catalog.heroUltimates[id]));
  assert(!missingUltimateProjectiles.length, `Missing or generic hero ultimate projectile kinds: ${missingUltimateProjectiles.join(", ")}`);
  const genericEnemies = Object.entries(catalog.enemies)
    .filter(([type, kind]) => ENEMIES[type] && (!kind || forbiddenProjectileKinds.has(kind) || kind === "energy"))
    .map(([type, kind]) => `${type}:${kind || "missing"}`);
  assert(!genericEnemies.length, `Generic enemy projectile signatures: ${genericEnemies.join(", ")}`);

  const firstArenaShot = path.resolve(__dirname, "recovery-playable-entry.png");
  await page.screenshot({ path: firstArenaShot, fullPage: false });
  await page.getByRole("button", { name: /Spawn Enemies/i }).click();
  await page.getByRole("button", { name: /Test Ultimate/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Restart World/i }).click();
  await waitForArena(page, 1);
  await page.waitForTimeout(350);

  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.victory({ kills: 7, bossHp: 0 }));
  await page.waitForFunction(() => document.documentElement.dataset.danQuestMode === "VICTORY", null, { timeout: 10000 });
  await page.getByRole("button", { name: /^Retry$/i }).click();
  await waitForArena(page, 1);
  await page.waitForTimeout(350);

  const reports = [];
  for (const mission of MISSIONS) {
    const heroId = mission.focusHero || expectedHeroes[(mission.level - 1) % expectedHeroes.length];
    await page.evaluate(({ level, heroId }) => window.__DAN_QUEST_FLOW_QA__.debugStart(level, heroId), { level: mission.level, heroId });
    await waitForArena(page, mission.level);
    await page.waitForTimeout(360);

    const roster = [...(mission.enemyPool || []), ...missionMiniBosses(mission)];
    assert(roster.length >= 4, `World ${mission.title} has too few enemies in roster`);
    for (let i = 0; i < Math.min(roster.length, 6); i += 1) {
      await page.evaluate(({ type, index }) => {
        const x = -3.6 + (index % 3) * 2.3;
        const z = index < 3 ? -2 : 2;
        window.__DAN_QUEST_ARENA_QA__.spawnEnemy(type, { x, z });
      }, { type: roster[i], index: i });
    }
    await page.evaluate(() => {
      window.__DAN_QUEST_ARENA_QA__.basic();
      window.__DAN_QUEST_ARENA_QA__.fillUltimate();
      window.__DAN_QUEST_ARENA_QA__.ultimate();
      window.__DAN_QUEST_ARENA_QA__.kashiSummon("deadline");
    });
    await page.waitForTimeout(650);
    const snapshot = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot());
    const counts = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
    assert(snapshot.map === mission.map, `Expected map ${mission.map}, got ${snapshot.map}`);
    assert(snapshot.bossName === mission.boss.name, `Expected boss ${mission.boss.name}, got ${snapshot.bossName}`);
    assert(snapshot.player && snapshot.player.hp > 0, `Player failed to spawn in ${mission.title}`);
    assert(counts.enemies > 0, `No enemies spawned in ${mission.title}`);
    assert(counts.projectiles > 0 || counts.pendingProjectiles > 0 || Object.keys(counts.projectileKinds || {}).length > 0, `No readable attacks fired in ${mission.title}`);
    assert(counts.alliedSummons <= 6, `Allied summon cap exceeded in ${mission.title}: ${counts.alliedSummons}`);
    reports.push({
      level: mission.level,
      world: mission.title,
      map: mission.map,
      hero: heroId,
      boss: mission.boss.name,
      regulars: mission.enemyPool?.length || 0,
      miniBosses: missionMiniBosses(mission).length,
      enemies: counts.enemies,
      projectiles: counts.projectiles,
      projectileKinds: counts.projectileKinds
    });
    if (mission.map === "dadKingdom") {
      const dadShot = path.resolve(__dirname, "recovery-dad-kingdom-playable.png");
      await page.screenshot({ path: dadShot, fullPage: false });
    }
  }

  const fps = await sampleFps(page);
  assert(consoleErrors.length === 0, `Browser console/page errors: ${consoleErrors.join(" | ")}`);
  await browser.close();
  console.log(JSON.stringify({
    status: "PASS",
    url: target,
    characters: CHARACTERS.length,
    worlds: MISSIONS.length,
    enemies: Object.keys(ENEMIES).length,
    worldCardCount,
    devRosterCount,
    heroProjectileKinds: catalog.heroes,
    heroUltimateKinds: catalog.heroUltimates,
    reports,
    fps,
    screenshots: {
      worldGallery: worldGalleryShot,
      devMenu: devMenuShot,
      playableEntry: firstArenaShot,
      dadKingdom: path.resolve(__dirname, "recovery-dad-kingdom-playable.png")
    }
  }, null, 2));
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
