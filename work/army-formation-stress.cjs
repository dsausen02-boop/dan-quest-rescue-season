const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const outDir = path.resolve(__dirname);

const heroArmy = {
  mendel: "monkey",
  amit: "rabbi",
  tal: "presentation",
  goodman: "consultant",
  giat: "discount",
  halel: "rider",
  hadar: "cleaner",
  amichai: "soccer",
  david: "drone",
  farber: "mechanic",
  gelman: "investor",
  kuzar: "agig",
  aviad: "reserve",
  dan: "guardian",
  bruiner: "sleeper"
};

function partyFor(heroId) {
  return [heroId, "mendel", "aviad", "david", "tal"].filter((id, index, arr) => arr.indexOf(id) === index).slice(0, 3);
}

function assertCap(label, value, cap) {
  if (value > cap) throw new Error(`${label} over cap: ${value} > ${cap}`);
}

function assertSpacing(snapshot, heroId) {
  if (snapshot.companions.length !== Math.min(2, partyFor(heroId).length - 1)) {
    throw new Error(`${heroId} companion count mismatch: ${snapshot.companions.length}`);
  }
  snapshot.companions.forEach((companion) => {
    const d = Math.hypot(companion.x - snapshot.player.x, companion.z - snapshot.player.z);
    if (d < 1.55) throw new Error(`${heroId} companion ${companion.heroId} too close to player: ${d.toFixed(2)}`);
  });
  if (snapshot.companions.length >= 2) {
    const [a, b] = snapshot.companions;
    const d = Math.hypot(a.x - b.x, a.z - b.z);
    if (d < 2.25) throw new Error(`${heroId} companions overlap: ${d.toFixed(2)}`);
  }
}

async function waitForFlowQa(page) {
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });
}

async function waitForArena(page) {
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(450);
}

async function startHeroRun(page, heroId) {
  const party = partyFor(heroId);
  await page.evaluate(({ party, heroId }) => {
    window.__DAN_QUEST_FLOW_QA__.menu();
    window.__DAN_QUEST_FLOW_QA__.setParty(party, heroId);
    window.__DAN_QUEST_FLOW_QA__.start(7);
  }, { party, heroId });
  await waitForArena(page);
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
  await waitForFlowQa(page);
  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.unlockAll());

  const results = [];
  for (const [heroId, expectedType] of Object.entries(heroArmy)) {
    await startHeroRun(page, heroId);
    await page.evaluate(() => {
      window.__DAN_QUEST_ARENA_QA__.fillUltimate();
      window.__DAN_QUEST_ARENA_QA__.ultimate();
    });
    await page.waitForTimeout(600);
    const snapshot = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot());
    const counts = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
    assertSpacing(snapshot, heroId);
    assertCap(`${heroId} allied summons`, counts.alliedSummons, 6);
    assertCap(`${heroId} projectiles`, counts.projectiles, 40);
    const actual = counts.summonTypes?.[expectedType] || 0;
    if (actual < 1) throw new Error(`${heroId} did not summon expected ${expectedType}; got ${JSON.stringify(counts.summonTypes)}`);
    results.push({ heroId, expectedType, party: partyFor(heroId), alliedSummons: counts.alliedSummons, summonTypes: counts.summonTypes, companions: snapshot.companions.length });
  }

  await startHeroRun(page, "mendel");
  for (let i = 0; i < 6; i += 1) {
    await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.kashiSummon("bedouins"));
  }
  await page.waitForTimeout(400);
  const kashiCounts = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
  assertCap("Kashi enemy summons", kashiCounts.enemies, 10);
  assertCap("Kashi Bedouins", kashiCounts.bedouins, 5);

  const screenshot = path.join(outDir, "army-formation-stress.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await browser.close();

  console.log(JSON.stringify({
    target,
    heroRuns: results,
    kashiCounts,
    screenshot,
    consoleErrors,
    pageErrors
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
