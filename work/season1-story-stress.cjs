const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const outDir = path.resolve(__dirname);

async function waitForFlowQa(page) {
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });
}

async function waitForArena(page) {
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(450);
}

async function snapshot(page) {
  return page.evaluate(() => window.__DAN_QUEST_ARENA_QA__?.snapshot?.());
}

async function counts(page) {
  return page.evaluate(() => window.__DAN_QUEST_ARENA_QA__?.counts?.());
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function assertIncludes(label, values, expected) {
  if (!values?.includes?.(expected)) throw new Error(`${label}: expected ${expected} in ${JSON.stringify(values)}`);
}

async function assertSoloStage(page, expected) {
  await waitForArena(page);
  const snap = await snapshot(page);
  const count = await counts(page);
  assertEqual("active hero", snap.activeId, expected.hero);
  assertEqual("mission title", snap.missionTitle, expected.title);
  assertEqual("boss name", snap.bossName, expected.boss);
  assertEqual("season", snap.season, 1);
  assertEqual("companions", snap.companions.length, 0);
  assertEqual("companion count", count.companions, 0);
  return { snap, count };
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

  const initial = await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.state().save);
  assertIncludes("initial unlocked", initial.unlocked, "tal");
  assertEqual("initial highestLevel", initial.highestLevel, 1);

  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.start(1));
  const stage1 = await assertSoloStage(page, { hero: "tal", title: "Presentation Empire", boss: "Presentation Emperor" });

  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.victory({ kills: 3 }));
  await page.waitForSelector(".modal-card.victory", { timeout: 10000 });
  const afterVictory = await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.state().save);
  assertEqual("after stage 1 highestLevel", afterVictory.highestLevel, 2);
  assertIncludes("Mendel unlocked after stage 1", afterVictory.unlocked, "mendel");

  await page.getByRole("button", { name: /Continue/i }).click();
  const stage2 = await assertSoloStage(page, { hero: "mendel", title: "Bedouin Desert", boss: "Bedouin King" });

  await page.evaluate(() => {
    window.__DAN_QUEST_FLOW_QA__.menu();
    window.__DAN_QUEST_FLOW_QA__.setParty(["tal", "mendel", "aviad"], "tal");
    window.__DAN_QUEST_FLOW_QA__.start(1);
  });
  const forcedSolo = await assertSoloStage(page, { hero: "tal", title: "Presentation Empire", boss: "Presentation Emperor" });

  await page.evaluate(() => {
    window.__DAN_QUEST_FLOW_QA__.menu();
    window.__DAN_QUEST_FLOW_QA__.unlockAll();
    window.__DAN_QUEST_FLOW_QA__.start(14);
  });
  const finalStage = await assertSoloStage(page, { hero: "dan", title: "Family Kingdom", boss: "Mrs. Dan" });

  const screenshot = path.join(outDir, "season1-story-stress.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  await browser.close();

  console.log(JSON.stringify({
    target,
    initial: { highestLevel: initial.highestLevel, unlocked: initial.unlocked },
    stage1: { activeId: stage1.snap.activeId, missionTitle: stage1.snap.missionTitle, bossName: stage1.snap.bossName, companions: stage1.count.companions },
    afterVictory: { highestLevel: afterVictory.highestLevel, unlocked: afterVictory.unlocked },
    stage2: { activeId: stage2.snap.activeId, missionTitle: stage2.snap.missionTitle, bossName: stage2.snap.bossName, companions: stage2.count.companions },
    forcedSolo: { activeId: forcedSolo.snap.activeId, missionTitle: forcedSolo.snap.missionTitle, companions: forcedSolo.count.companions },
    finalStage: { activeId: finalStage.snap.activeId, missionTitle: finalStage.snap.missionTitle, bossName: finalStage.snap.bossName, companions: finalStage.count.companions },
    screenshot,
    consoleErrors,
    pageErrors
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
