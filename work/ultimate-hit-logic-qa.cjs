const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";

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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => errors.push(err.message));
  await page.addInitScript(() => localStorage.removeItem("danQuestArenaSaveV3"));
  await page.goto(target, { waitUntil: "networkidle" });
  await waitForFlow(page);

  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.debugStart(1, "tal"));
  await waitForArena(page, 1);
  await page.evaluate(() => {
    window.__DAN_QUEST_ARENA_QA__.setPlayer({ x: -6, z: 0 });
    window.__DAN_QUEST_ARENA_QA__.setBoss({ x: -4.75, z: 0, locked: true });
  });
  await page.waitForTimeout(120);
  const hitBefore = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot().kashi.hp);
  await page.evaluate(() => {
    window.__DAN_QUEST_ARENA_QA__.fillUltimate();
    window.__DAN_QUEST_ARENA_QA__.ultimate();
    window.__DAN_QUEST_ARENA_QA__.advance(0.05, 12);
  });
  await page.waitForTimeout(250);
  const hitAfter = await page.evaluate(() => {
    const snap = window.__DAN_QUEST_ARENA_QA__.snapshot();
    return {
      bossHp: snap.kashi.hp,
      ultimateProjectiles: snap.projectiles.filter((p) => p.ultimate).length,
      damageNumbers: snap.damage.length,
      particles: snap.particles.length
    };
  });
  assert(hitAfter.bossHp < hitBefore, `Ultimate hit did not damage boss: before ${hitBefore}, after ${hitAfter.bossHp}`);
  assert(hitAfter.damageNumbers > 0, "Ultimate hit produced no damage feedback");
  assert(hitAfter.particles > 0, "Ultimate hit produced no explosion/particle feedback");

  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.debugStart(1, "tal"));
  await waitForArena(page, 1);
  await page.evaluate(() => {
    window.__DAN_QUEST_ARENA_QA__.setPlayer({ x: -6, z: 0 });
    window.__DAN_QUEST_ARENA_QA__.setBoss({ x: 26, z: 0, locked: true });
  });
  await page.waitForTimeout(120);
  const missBefore = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.snapshot().kashi.hp);
  await page.evaluate(() => {
    window.__DAN_QUEST_ARENA_QA__.fillUltimate();
    window.__DAN_QUEST_ARENA_QA__.ultimate();
    window.__DAN_QUEST_ARENA_QA__.advance(0.1, 48);
  });
  await page.waitForTimeout(250);
  const missAfter = await page.evaluate(() => {
    const snap = window.__DAN_QUEST_ARENA_QA__.snapshot();
    return {
      bossHp: snap.kashi.hp,
      ultimateProjectiles: snap.projectiles.filter((p) => p.ultimate).length,
      particles: snap.particles.length,
      damageNumbers: snap.damage.length
    };
  });
  assert(Math.abs(missAfter.bossHp - missBefore) < 0.001, `Missed ultimate damaged boss: before ${missBefore}, after ${missAfter.bossHp}`);
  assert(missAfter.ultimateProjectiles === 0, `Missed ultimate projectiles did not expire: ${missAfter.ultimateProjectiles}`);
  assert(errors.length === 0, `Browser errors: ${errors.join(" | ")}`);
  await browser.close();
  console.log(JSON.stringify({ status: "PASS", hitBefore, hitAfter, missBefore, missAfter }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
