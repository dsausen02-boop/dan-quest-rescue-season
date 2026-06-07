const path = require("node:path");
const { chromium } = require("C:\\Users\\mflan\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\.pnpm\\playwright@1.60.0\\node_modules\\playwright");

const target = process.env.DAN_QUEST_URL || "http://127.0.0.1:5175";
const outDir = __dirname;

const worlds = [
  "Presentation Empire",
  "Bedouin Desert",
  "Casino Kingdom",
  "Mom's Kingdom",
  "Date Dimension",
  "Party Dimension",
  "AI Nexus",
  "Other Friend Group",
  "Debate Republic",
  "Luxury Kingdom",
  "Dad Kingdom",
  "Football Market Kingdom",
  "Comfort Kingdom",
  "Family Kingdom"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  await page.addInitScript(() => localStorage.removeItem("danQuestArenaSaveV3"));
  await page.goto(target, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.danQuestFlowQa === "ready", null, { timeout: 10000 });

  const defaults = await page.evaluate(() => {
    const state = window.__DAN_QUEST_FLOW_QA__.state();
    return {
      visualDensity: state.save.visualDensity,
      graphics: state.save.graphics
    };
  });
  assert(defaults.visualDensity === "medium", `Default visual quality should be medium, got ${defaults.visualDensity}`);
  assert(defaults.graphics.resolutionScale === 100, `Default resolution scale should be 100, got ${defaults.graphics.resolutionScale}`);
  assert(defaults.graphics.motionBlur === false, "Motion blur should default off");
  assert(defaults.graphics.shadows === false, "Shadows should default off for Medium performance");
  assert(defaults.graphics.particlesQuality === "medium", `Particles quality should default medium, got ${defaults.graphics.particlesQuality}`);

  await page.getByRole("button", { name: /Settings/ }).click();
  await page.waitForSelector(".settings-grid");
  await page.screenshot({ path: path.join(outDir, "restore-quality-settings.png"), fullPage: false, animations: "disabled", timeout: 60000 });
  assert(await page.getByRole("radiogroup", { name: "Visual Quality" }).getByRole("button", { name: "Medium" }).getAttribute("aria-pressed") === "true", "Medium quality button should be selected");
  assert(await page.getByRole("radiogroup", { name: "Resolution Scale" }).getByRole("button", { name: "100%" }).getAttribute("aria-pressed") === "true", "100% resolution button should be selected");
  assert(await page.getByRole("radiogroup", { name: "Particles Quality" }).getByRole("button", { name: "Medium" }).getAttribute("aria-pressed") === "true", "Medium particles button should be selected");
  await page.locator(".top-actions .ghost-button").click();

  await page.getByRole("button", { name: /Character Debug/ }).click();
  await page.waitForSelector(".character-debug-card");
  await page.waitForTimeout(1200);
  const characterReport = await page.locator(".character-debug-card").evaluateAll((cards) => cards.map((card) => {
    const img = card.querySelector("img");
    return {
      id: card.getAttribute("data-character-id"),
      status: card.getAttribute("data-status"),
      hasBillboard: !!card.querySelector(".debug-billboard"),
      imageLoaded: !!img && img.naturalWidth > 0 && img.naturalHeight > 0
    };
  }));
  assert(characterReport.length >= 16, `Expected all playable heroes plus Kashi in debug gallery, got ${characterReport.length}`);
  const badCharacters = characterReport.filter((item) => item.status !== "OK" || !item.hasBillboard || !item.imageLoaded);
  assert(!badCharacters.length, `Character debug failures: ${JSON.stringify(badCharacters)}`);
  await page.screenshot({ path: path.join(outDir, "restore-quality-character-debug.png"), fullPage: false, animations: "disabled", timeout: 60000 });
  await page.evaluate(() => window.__DAN_QUEST_FLOW_QA__.menu());
  await page.getByRole("button", { name: /World Preview/ }).waitFor();

  await page.getByRole("button", { name: /World Preview/ }).click();
  await page.waitForSelector(".world-card");
  await page.waitForTimeout(1000);
  assert(await page.locator(".world-card").count() === worlds.length, "World Preview should show all 14 worlds");
  for (const world of worlds) {
    await page.getByRole("button", { name: new RegExp(world.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await page.waitForTimeout(220);
    const selectedText = await page.locator(".world-preview-panel").innerText();
    assert(selectedText.includes(world), `World detail did not select ${world}`);
    assert(await page.locator(".world-facts strong").count() === 3, `${world} detail missing populated facts`);
  }
  await page.screenshot({ path: path.join(outDir, "restore-quality-world-gallery.png"), fullPage: false, animations: "disabled", timeout: 60000 });
  await page.getByRole("button", { name: /Dad Kingdom/ }).click();
  await page.locator(".world-preview-panel .primary-button").click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "restore-quality-dad-preview.png"), fullPage: false, animations: "disabled", timeout: 60000 });

  await page.evaluate(() => {
    window.__DAN_QUEST_FLOW_QA__.menu();
    window.__DAN_QUEST_FLOW_QA__.unlockAll();
    window.__DAN_QUEST_FLOW_QA__.start(11);
  });
  await page.waitForFunction(() => window.__DAN_QUEST_ARENA_QA__, null, { timeout: 10000 });
  await page.waitForTimeout(1200);
  const counts = await page.evaluate(() => window.__DAN_QUEST_ARENA_QA__.counts());
  assert(counts.map === "dadKingdom", "Dad Kingdom arena did not start");
  assert(counts.enemies <= 10, `Enemy cap exceeded: ${counts.enemies}`);
  assert(counts.alliedSummons <= 6, `Allied summon cap exceeded: ${counts.alliedSummons}`);
  assert(counts.projectiles <= 40, `Projectile cap exceeded: ${counts.projectiles}`);
  await page.screenshot({ path: path.join(outDir, "restore-quality-dad-arena.png"), fullPage: false, animations: "disabled", timeout: 60000 });

  if (consoleErrors.length || pageErrors.length) {
    throw new Error(`Browser errors found: ${JSON.stringify({ consoleErrors, pageErrors }, null, 2)}`);
  }

  await browser.close();
  console.log(JSON.stringify({
    target,
    defaults,
    charactersValidated: characterReport.length,
    worldsValidated: worlds.length,
    dadCounts: counts,
    screenshots: {
      settings: path.join(outDir, "restore-quality-settings.png"),
      characterDebug: path.join(outDir, "restore-quality-character-debug.png"),
      worldGallery: path.join(outDir, "restore-quality-world-gallery.png"),
      dadPreview: path.join(outDir, "restore-quality-dad-preview.png"),
      dadArena: path.join(outDir, "restore-quality-dad-arena.png")
    }
  }, null, 2));
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
