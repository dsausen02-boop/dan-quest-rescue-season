(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const hudLevel = document.getElementById("hudLevel");
  const hudMission = document.getElementById("hudMission");
  const hudObjective = document.getElementById("hudObjective");
  const hudProgress = document.getElementById("hudProgress");
  const partyHud = document.getElementById("partyHud");
  const toastEl = document.getElementById("toast");
  const touchControls = document.getElementById("touchControls");
  const movePad = document.getElementById("movePad");
  const moveKnob = document.getElementById("moveKnob");
  const attackButton = document.getElementById("attackButton");
  const ultButton = document.getElementById("ultButton");
  const swapButton = document.getElementById("swapButton");
  const pauseButton = document.getElementById("pauseButton");
  const menuLayer = document.getElementById("menuLayer");

  const STORAGE_KEY = "danQuestDarkTimesSaveV1";
  const TAU = Math.PI * 2;

  const CHARACTERS = [
    {
      id: "mendel",
      name: "Mendel",
      initials: "ME",
      color: "#ee6656",
      hp: 118,
      attack: 15,
      speed: 255,
      cooldown: 0.36,
      range: 560,
      passive: "No Filter",
      basic: "Banana Throw",
      ultimate: "Bedouin Army",
      description: "Chaos character. First playable hero.",
      style: "banana"
    },
    {
      id: "aviad",
      name: "Aviad",
      initials: "AV",
      color: "#55b8dc",
      hp: 132,
      attack: 13,
      speed: 236,
      cooldown: 0.42,
      range: 500,
      passive: "Eternal Rookie",
      basic: "Question Attack",
      ultimate: "Back To Basic Training",
      description: "Turns confusion into crowd control.",
      style: "question"
    },
    {
      id: "halel",
      name: "Halel",
      initials: "HA",
      color: "#9b78de",
      hp: 122,
      attack: 17,
      speed: 284,
      cooldown: 0.48,
      range: 180,
      passive: "Prince",
      basic: "Motorcycle Dash",
      ultimate: "Three Hour Ride",
      description: "High speed damage with royal confidence.",
      style: "dash"
    },
    {
      id: "farber",
      name: "Farber",
      initials: "FA",
      color: "#c97848",
      hp: 162,
      attack: 19,
      speed: 218,
      cooldown: 0.56,
      range: 116,
      passive: "Mechanic",
      basic: "Wrench Smash",
      ultimate: "Garage King",
      description: "A tanky fixer who solves problems loudly.",
      style: "melee"
    },
    {
      id: "kuzar",
      name: "Kuzar",
      initials: "KU",
      color: "#68c58a",
      hp: 126,
      attack: 14,
      speed: 246,
      cooldown: 0.34,
      range: 520,
      passive: "Cheapskate",
      basic: "Coupon Attack",
      ultimate: "AGIG Disaster",
      description: "Refuses to spend money, spends enemy patience instead.",
      style: "coupon"
    },
    {
      id: "gelman",
      name: "Gelman",
      initials: "GE",
      color: "#f5c451",
      hp: 134,
      attack: 16,
      speed: 232,
      cooldown: 0.62,
      range: 520,
      passive: "Rich Guy",
      basic: "Money Cannon",
      ultimate: "Thailand Spending Spree",
      description: "Turns the economy into a weapon.",
      style: "spread"
    },
    {
      id: "amichai",
      name: "Amichai",
      initials: "AM",
      color: "#4fb46f",
      hp: 140,
      attack: 18,
      speed: 238,
      cooldown: 0.5,
      range: 570,
      passive: "Sleeping",
      basic: "Winner Bet",
      ultimate: "Soccer Tournament Beast Mode",
      description: "Barely awake until a ball appears.",
      style: "soccer"
    },
    {
      id: "david",
      name: "David",
      initials: "DA",
      color: "#42c7c7",
      hp: 124,
      attack: 18,
      speed: 240,
      cooldown: 0.45,
      range: 600,
      passive: "AI Addiction",
      basic: "AI Tool",
      ultimate: "Artificial Intelligence",
      description: "Automates the resistance and several bad ideas.",
      style: "ai"
    },
    {
      id: "amit",
      name: "Amit",
      initials: "AT",
      color: "#8ba3ff",
      hp: 152,
      attack: 13,
      speed: 230,
      cooldown: 0.5,
      range: 460,
      passive: "Responsible Adult",
      basic: "Calm Down",
      ultimate: "Enough",
      description: "Stops nonsense by being the grown-up in the room.",
      style: "calm"
    },
    {
      id: "hadar",
      name: "Hadar",
      initials: "HD",
      color: "#ff9fc0",
      hp: 144,
      attack: 15,
      speed: 238,
      cooldown: 0.46,
      range: 500,
      passive: "Everybody Loves Hadar",
      basic: "YouTube Tutorial",
      ultimate: "Washing Machine Recovery",
      description: "Cleans windows, fixes morale, saves the day.",
      style: "spray"
    },
    {
      id: "tal",
      name: "Tal",
      initials: "TA",
      color: "#ff8f52",
      hp: 168,
      attack: 20,
      speed: 232,
      cooldown: 0.58,
      range: 390,
      passive: "Argument Mode",
      basic: "Debate Attack",
      ultimate: "Psychometric Breakdown",
      description: "Main resistance leader. The debate never ends.",
      style: "debate"
    },
    {
      id: "dan",
      name: "Dan",
      initials: "DN",
      color: "#fff1a8",
      hp: 220,
      attack: 29,
      speed: 265,
      cooldown: 0.32,
      range: 660,
      passive: "The Chosen One",
      basic: "Blessing",
      ultimate: "Weekend Miracle",
      description: "Final legendary character. Strongest in the game.",
      style: "blessing"
    }
  ];

  const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((hero) => [hero.id, hero]));

  const MISSIONS = [
    {
      level: 1,
      title: "Monkey Jungle",
      subtitle: "Mendel escapes the Monkey Jungle.",
      map: "jungle",
      joke: "MENDEL I FOUND YOU",
      enemyPool: ["monkey", "assignment"],
      boss: { name: "Monkey Homework Chief", type: "monkeyBoss", hp: 260, color: "#9b6a3f" },
      reward: 4
    },
    {
      level: 2,
      title: "Basic Training",
      subtitle: "Rescue Aviad from basic training.",
      map: "training",
      joke: "Aviad asks one question and the entire base stops.",
      enemyPool: ["trainer", "assignment", "deadline"],
      boss: { name: "Drill Deadline", type: "drillBoss", hp: 330, color: "#6c7588" },
      unlock: "aviad",
      reward: 5
    },
    {
      level: 3,
      title: "Three Hour Road",
      subtitle: "Find Halel after a motorcycle trip went mythological.",
      map: "road",
      joke: "The trip was three hours. Nobody agrees which three hours.",
      enemyPool: ["deadline", "traffic", "report"],
      boss: { name: "Roundabout of Doom", type: "roadBoss", hp: 410, color: "#7a6be0" },
      unlock: "halel",
      reward: 5
    },
    {
      level: 4,
      title: "Garage Revolt",
      subtitle: "Recruit Farber.",
      map: "garage",
      joke: "Goodman causes chaos. Farber calls it a diagnostic test.",
      enemyPool: ["workbot", "report", "assignment"],
      boss: { name: "Audit Engine", type: "garageBoss", hp: 500, color: "#b56d42" },
      unlock: "farber",
      reward: 6
    },
    {
      level: 5,
      title: "Low Cost Confusion",
      subtitle: "Recruit Kuzar without buying anything.",
      map: "market",
      joke: "Giat says Low Cost, Kuzar hears free, nobody moves.",
      enemyPool: ["couponGuard", "spreadsheet", "deadline"],
      boss: { name: "AGIG Receipt Beast", type: "couponBoss", hp: 560, color: "#4fb46f" },
      unlock: "kuzar",
      reward: 6
    },
    {
      level: 6,
      title: "Money District",
      subtitle: "Recruit Gelman before he spends the plan.",
      map: "money",
      joke: "Gelman spends money so fast the enemies start clapping.",
      enemyPool: ["moneyClerk", "spreadsheet", "report"],
      boss: { name: "Thailand Invoice", type: "moneyBoss", hp: 650, color: "#d6a33e" },
      unlock: "gelman",
      reward: 7
    },
    {
      level: 7,
      title: "Soccer Tournament",
      subtitle: "Recruit Amichai.",
      map: "soccer",
      joke: "Amichai sleeps until soccer appears.",
      enemyPool: ["deadline", "trainer", "spreadsheet"],
      boss: { name: "Spreadsheet Referee", type: "soccerBoss", hp: 760, color: "#2c9d5c" },
      unlock: "amichai",
      reward: 7
    },
    {
      level: 8,
      title: "AI Laboratory",
      subtitle: "Find David and his AI laboratory.",
      map: "lab",
      joke: "Bruiner is sleeping everywhere. David asks an AI to explain why.",
      enemyPool: ["aiBug", "report", "workbot"],
      boss: { name: "Prompt Loop", type: "aiBoss", hp: 840, color: "#43c9c9" },
      unlock: "david",
      reward: 8
    },
    {
      level: 9,
      title: "Adult Supervision",
      subtitle: "Convince Amit to return.",
      map: "office",
      joke: "Amit enters. Everyone suddenly remembers consequences.",
      enemyPool: ["deadline", "assignment", "spreadsheet", "report"],
      boss: { name: "Meeting That Could Be Mail", type: "officeBoss", hp: 930, color: "#8799e8" },
      unlock: "amit",
      reward: 8
    },
    {
      level: 10,
      title: "Influence Tower",
      subtitle: "Save Hadar from Kashi's influence.",
      map: "cleaning",
      joke: "Hadar cleans windows so well the Dark Times briefly look nice.",
      enemyPool: ["influence", "spreadsheet", "deadline"],
      boss: { name: "Washing Machine Curse", type: "cleaningBoss", hp: 1040, color: "#df7ca4" },
      unlock: "hadar",
      reward: 9
    },
    {
      level: 11,
      title: "Resistance Headquarters",
      subtitle: "Rebuild the group and locate Dan.",
      map: "hq",
      joke: "Tal argues the HQ into existence. Nobody can stop him.",
      enemyPool: ["workbot", "report", "deadline", "spreadsheet"],
      boss: { name: "Corporate Audit", type: "hqBoss", hp: 1220, color: "#ff8f52" },
      unlock: "tal",
      bonusUnlock: "dan",
      reward: 10
    },
    {
      level: 12,
      title: "Kashi's Empire",
      subtitle: "Final assault on Kashi.",
      map: "empire",
      joke: "Kashi opens Infinite Spreadsheets. The resistance opens weekend mode.",
      enemyPool: ["deadline", "assignment", "spreadsheet", "report", "workbot"],
      boss: { name: "Kashi", type: "kashi", hp: 2100, color: "#596276" },
      reward: 18,
      final: true
    }
  ];

  const ENEMIES = {
    monkey: { name: "Monkey Task Runner", hp: 38, speed: 118, damage: 10, radius: 19, color: "#9b6a3f", mode: "melee" },
    assignment: { name: "Assignment Drone", hp: 44, speed: 72, damage: 9, radius: 18, color: "#e8d8ad", mode: "ranged", range: 430, cooldown: 1.6 },
    deadline: { name: "Deadline Runner", hp: 36, speed: 154, damage: 13, radius: 17, color: "#ee6656", mode: "charger" },
    report: { name: "Report Wizard", hp: 58, speed: 66, damage: 12, radius: 20, color: "#8ba3ff", mode: "ranged", range: 520, cooldown: 1.35 },
    spreadsheet: { name: "Spreadsheet Slime", hp: 68, speed: 58, damage: 12, radius: 23, color: "#68c58a", mode: "spray", range: 390, cooldown: 1.9 },
    trainer: { name: "Basic Trainer", hp: 62, speed: 104, damage: 12, radius: 21, color: "#6c7588", mode: "melee" },
    traffic: { name: "Traffic Cone Manager", hp: 52, speed: 92, damage: 11, radius: 18, color: "#ff8f52", mode: "ranged", range: 370, cooldown: 1.75 },
    workbot: { name: "Work Machine", hp: 96, speed: 54, damage: 17, radius: 26, color: "#7e879b", mode: "melee" },
    couponGuard: { name: "Coupon Inspector", hp: 60, speed: 92, damage: 10, radius: 20, color: "#4fb46f", mode: "spray", range: 380, cooldown: 1.6 },
    moneyClerk: { name: "Money Clerk", hp: 54, speed: 84, damage: 12, radius: 19, color: "#d6a33e", mode: "ranged", range: 480, cooldown: 1.45 },
    aiBug: { name: "AI Hallucination", hp: 50, speed: 116, damage: 12, radius: 18, color: "#43c9c9", mode: "charger" },
    influence: { name: "Influence Agent", hp: 76, speed: 82, damage: 13, radius: 21, color: "#df7ca4", mode: "ranged", range: 430, cooldown: 1.45 }
  };

  const state = {
    save: null,
    screen: "title",
    selectedCharacter: "mendel",
    selectedMission: 1,
    battle: null,
    view: { w: 1, h: 1, dpr: 1 },
    input: {
      keys: new Set(),
      move: { x: 0, y: 0 },
      touch: { x: 0, y: 0 },
      activePadPointer: null,
      attackHeld: false
    },
    audio: { ctx: null, enabled: true, ready: false },
    lastFrame: performance.now()
  };

  function defaultSave() {
    return {
      version: 1,
      highestLevel: 1,
      completed: {},
      unlocked: ["mendel"],
      party: ["mendel"],
      upgrades: {},
      sparks: 0,
      wins: 0,
      sound: true
    };
  }

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw);
      const save = Object.assign(defaultSave(), parsed);
      save.completed = save.completed || {};
      save.upgrades = save.upgrades || {};
      save.unlocked = Array.isArray(save.unlocked) && save.unlocked.length ? save.unlocked : ["mendel"];
      save.party = Array.isArray(save.party) && save.party.length ? save.party.filter((id) => save.unlocked.includes(id)).slice(0, 3) : ["mendel"];
      if (!save.party.length) save.party = ["mendel"];
      if (!save.unlocked.includes("mendel")) save.unlocked.unshift("mendel");
      return save;
    } catch (error) {
      return defaultSave();
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
  }

  function isUnlocked(id) {
    return state.save.unlocked.includes(id);
  }

  function isMissionUnlocked(level) {
    return level <= state.save.highestLevel;
  }

  function upgradesFor(id) {
    if (!state.save.upgrades[id]) {
      state.save.upgrades[id] = { health: 0, attack: 0, ultimate: 0 };
    }
    return state.save.upgrades[id];
  }

  function heroStats(id) {
    const hero = CHARACTER_BY_ID[id];
    const up = upgradesFor(id);
    return {
      maxHp: Math.round(hero.hp + up.health * 34),
      attack: hero.attack * (1 + up.attack * 0.18),
      speed: hero.speed + up.health * 2,
      cooldown: Math.max(0.18, hero.cooldown * (1 - up.attack * 0.035)),
      ultimateCost: Math.max(58, 100 - up.ultimate * 9),
      ultimatePower: 1 + up.ultimate * 0.24,
      range: hero.range
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distXY(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function choice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(420, window.innerHeight);
    state.view.w = w;
    state.view.h = h;
    state.view.dpr = dpr;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ensureAudio() {
    if (state.audio.ready) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    state.audio.ctx = new AudioContext();
    state.audio.ready = true;
  }

  function tone(freq, duration, type, gain) {
    if (!state.save.sound || !state.audio.enabled) return;
    ensureAudio();
    const audio = state.audio.ctx;
    if (!audio) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain || 0.04, audio.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  }

  function chord(base) {
    tone(base, 0.11, "triangle", 0.035);
    setTimeout(() => tone(base * 1.5, 0.12, "triangle", 0.028), 55);
    setTimeout(() => tone(base * 2, 0.16, "triangle", 0.026), 105);
  }

  function showToast(message, time) {
    const item = document.createElement("div");
    item.className = "toast-item";
    item.textContent = message;
    toastEl.appendChild(item);
    setTimeout(() => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-12px)";
      setTimeout(() => item.remove(), 280);
    }, time || 1700);
  }

  function setGameVisible(visible) {
    hud.hidden = !visible;
    touchControls.hidden = !visible;
    pauseButton.hidden = !visible;
    menuLayer.hidden = visible;
  }

  function renderTitle() {
    state.screen = "title";
    setGameVisible(false);
    menuLayer.hidden = false;
    const canContinue = state.save.completed && Object.keys(state.save.completed).length > 0;
    menuLayer.innerHTML = `
      <div class="menu-shell">
        <header class="menu-top">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true"></div>
            <div>
              <h1>DAN QUEST</h1>
              <p>Dark Times</p>
            </div>
          </div>
          <div class="menu-actions">
            <button id="soundBtn" class="ghost-button" type="button">${state.save.sound ? "Sound On" : "Sound Off"}</button>
          </div>
        </header>
        <section class="screen-grid">
          <div class="menu-card hero-scene">
            <div class="hero-stage" aria-hidden="true">
              <span class="stage-character stage-mendel"></span>
              <span class="stage-character stage-tal"></span>
              <span class="stage-character stage-dan"></span>
              <span class="stage-character stage-kashi"></span>
            </div>
            <div class="story-block">
              <p>Dan disappeared. The world entered the Dark Times. Kashi rules through assignments, deadlines, spreadsheets, reports and work. Mendel starts alone, rebuilds the group, and carries the resistance toward the final weekend miracle.</p>
            </div>
          </div>
          <div class="menu-card">
            <div class="screen-title">
              <h2>The Resistance Starts Here</h2>
              <p>${state.save.unlocked.length} heroes unlocked. Level ${state.save.highestLevel} available. ${state.save.sparks} sparks ready for upgrades.</p>
            </div>
            <div class="menu-actions">
              <button id="campaignBtn" class="primary-button" type="button">${canContinue ? "Continue Campaign" : "Start Campaign"}</button>
              <button id="rosterBtn" class="ghost-button" type="button">Roster</button>
              <button id="resetBtn" class="danger-button" type="button">Reset Save</button>
            </div>
          </div>
        </section>
      </div>
    `;
    document.getElementById("campaignBtn").addEventListener("click", renderCampaign);
    document.getElementById("rosterBtn").addEventListener("click", renderRoster);
    document.getElementById("resetBtn").addEventListener("click", () => renderConfirmReset());
    document.getElementById("soundBtn").addEventListener("click", () => {
      state.save.sound = !state.save.sound;
      persist();
      renderTitle();
    });
  }

  function renderCampaign() {
    state.screen = "campaign";
    setGameVisible(false);
    menuLayer.hidden = false;
    const cards = MISSIONS.map((mission) => {
      const unlocked = isMissionUnlocked(mission.level);
      const complete = !!state.save.completed[mission.level];
      const tag = complete ? `<span class="complete-tag">Complete</span>` : unlocked ? `<span class="new-tag">Open</span>` : `<span class="locked-tag">Locked</span>`;
      const reward = mission.final ? "Final victory" : mission.unlock ? `Unlock: ${CHARACTER_BY_ID[mission.unlock].name}` : mission.bonusUnlock ? "Unlock: Tal and Dan" : "Resistance sparks";
      return `
        <article class="mission-card">
          <div class="mission-badge">${mission.level}</div>
          <div>
            <h3>${escapeHtml(mission.title)}</h3>
            <p>${escapeHtml(mission.subtitle)}</p>
            <p>${escapeHtml(reward)} | ${mission.reward} sparks</p>
          </div>
          <div class="row-actions">
            ${tag}
            <button class="tiny-button start-mission" data-level="${mission.level}" type="button" ${unlocked ? "" : "disabled"}>Start</button>
          </div>
        </article>
      `;
    }).join("");

    menuLayer.innerHTML = `
      <div class="menu-shell">
        <header class="menu-top">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true"></div>
            <div>
              <h1>Campaign</h1>
              <p>Rebuild the group, then reach Kashi's empire.</p>
            </div>
          </div>
          <div class="menu-actions">
            <button id="titleBtn" class="ghost-button" type="button">Title</button>
            <button id="rosterBtn" class="ghost-button" type="button">Roster</button>
          </div>
        </header>
        <section class="menu-card">
          <div class="screen-title">
            <h2>Mission Map</h2>
            <p>Replay completed missions for sparks, then upgrade the resistance.</p>
          </div>
          <div class="mission-list">${cards}</div>
        </section>
      </div>
    `;
    document.getElementById("titleBtn").addEventListener("click", renderTitle);
    document.getElementById("rosterBtn").addEventListener("click", renderRoster);
    menuLayer.querySelectorAll(".start-mission").forEach((button) => {
      button.addEventListener("click", () => startMission(Number(button.dataset.level)));
    });
  }

  function renderRoster() {
    state.screen = "roster";
    setGameVisible(false);
    menuLayer.hidden = false;
    if (!isUnlocked(state.selectedCharacter)) state.selectedCharacter = state.save.unlocked[0] || "mendel";
    const selected = CHARACTER_BY_ID[state.selectedCharacter];
    const selectedStats = heroStats(selected.id);
    const selectedUp = upgradesFor(selected.id);
    const cards = CHARACTERS.map((hero) => {
      const unlocked = isUnlocked(hero.id);
      const stats = heroStats(hero.id);
      const inParty = state.save.party.includes(hero.id);
      return `
        <article class="roster-card ${unlocked ? "" : "locked"}">
          <button class="portrait select-hero" style="--c:${hero.color}" data-id="${hero.id}" type="button" ${unlocked ? "" : "disabled"}><span>${hero.initials}</span></button>
          <div>
            <h3>${escapeHtml(hero.name)} ${unlocked ? "" : "<span class=\"locked-tag\">Locked</span>"}</h3>
            <p>${escapeHtml(hero.passive)} | ${escapeHtml(hero.basic)}</p>
            <p>HP ${Math.round(stats.maxHp)} | ATK ${Math.round(stats.attack)} ${inParty ? "| Party" : ""}</p>
          </div>
        </article>
      `;
    }).join("");
    const partyRows = state.save.party.map((id, index) => {
      const hero = CHARACTER_BY_ID[id];
      return `
        <div class="party-row">
          <div><strong>${index + 1}. ${escapeHtml(hero.name)}</strong><p>${escapeHtml(hero.passive)}</p></div>
          <button class="tiny-button remove-party" data-id="${id}" type="button" ${state.save.party.length <= 1 ? "disabled" : ""}>Remove</button>
        </div>
      `;
    }).join("");
    const canAdd = isUnlocked(selected.id) && !state.save.party.includes(selected.id) && state.save.party.length < 3;
    const upgradeRows = [
      ["health", "Health", `+34 HP per rank. Current HP ${Math.round(selectedStats.maxHp)}.`],
      ["attack", "Attack", `More damage and faster basics. Current ATK ${Math.round(selectedStats.attack)}.`],
      ["ultimate", "Ultimate", `Stronger ultimate and lower charge cost. Cost ${Math.round(selectedStats.ultimateCost)}.`]
    ].map(([key, label, copy]) => {
      const rank = selectedUp[key] || 0;
      const cost = upgradeCost(rank);
      const maxed = rank >= 5;
      const affordable = state.save.sparks >= cost;
      return `
        <div class="upgrade-row">
          <div>
            <h4>${label} Rank ${rank}/5</h4>
            <p>${copy}</p>
          </div>
          <button class="tiny-button buy-upgrade" data-branch="${key}" type="button" ${maxed || !affordable || !isUnlocked(selected.id) ? "disabled" : ""}>${maxed ? "Max" : `${cost} Sparks`}</button>
        </div>
      `;
    }).join("");

    menuLayer.innerHTML = `
      <div class="menu-shell">
        <header class="menu-top">
          <div class="brand">
            <div class="brand-mark" aria-hidden="true"></div>
            <div>
              <h1>Resistance</h1>
              <p>Choose up to three heroes for each mission.</p>
            </div>
          </div>
          <div class="menu-actions">
            <button id="campaignBtn" class="ghost-button" type="button">Campaign</button>
            <button id="titleBtn" class="ghost-button" type="button">Title</button>
          </div>
        </header>
        <section class="split-panel">
          <div class="menu-card">
            <div class="screen-title">
              <h2>Roster</h2>
              <p>${state.save.unlocked.length}/${CHARACTERS.length} heroes unlocked.</p>
            </div>
            <div class="roster-grid">${cards}</div>
          </div>
          <aside class="menu-card">
            <div class="resource-strip"><span>Resistance Sparks</span><strong>${state.save.sparks}</strong></div>
            <div class="screen-title">
              <h2>${escapeHtml(selected.name)}</h2>
              <p>${escapeHtml(selected.description)}</p>
              <p>${escapeHtml(selected.passive)} | ${escapeHtml(selected.ultimate)}</p>
            </div>
            <div class="party-list">${partyRows}</div>
            <div class="row-actions" style="margin: 10px 0 14px;">
              <button id="addPartyBtn" class="primary-button" type="button" ${canAdd ? "" : "disabled"}>Add To Party</button>
            </div>
            <div class="upgrade-list">${upgradeRows}</div>
          </aside>
        </section>
      </div>
    `;
    document.getElementById("campaignBtn").addEventListener("click", renderCampaign);
    document.getElementById("titleBtn").addEventListener("click", renderTitle);
    document.getElementById("addPartyBtn").addEventListener("click", () => {
      if (canAdd) {
        state.save.party.push(selected.id);
        persist();
        renderRoster();
      }
    });
    menuLayer.querySelectorAll(".select-hero").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedCharacter = button.dataset.id;
        renderRoster();
      });
    });
    menuLayer.querySelectorAll(".remove-party").forEach((button) => {
      button.addEventListener("click", () => {
        state.save.party = state.save.party.filter((id) => id !== button.dataset.id);
        if (!state.save.party.length) state.save.party = ["mendel"];
        persist();
        renderRoster();
      });
    });
    menuLayer.querySelectorAll(".buy-upgrade").forEach((button) => {
      button.addEventListener("click", () => buyUpgrade(selected.id, button.dataset.branch));
    });
  }

  function upgradeCost(rank) {
    return [2, 3, 5, 7, 10][rank] || 999;
  }

  function buyUpgrade(id, branch) {
    const up = upgradesFor(id);
    const rank = up[branch] || 0;
    const cost = upgradeCost(rank);
    if (rank >= 5 || state.save.sparks < cost) return;
    state.save.sparks -= cost;
    up[branch] = rank + 1;
    persist();
    chord(420);
    renderRoster();
  }

  function renderConfirmReset() {
    menuLayer.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop">
        <div class="modal-card">
          <h2>Reset Save?</h2>
          <p>This clears campaign progress, unlocks and upgrades.</p>
          <div class="modal-actions">
            <button id="confirmResetBtn" class="danger-button" type="button">Reset</button>
            <button id="cancelResetBtn" class="ghost-button" type="button">Cancel</button>
          </div>
        </div>
      </div>
    `);
    document.getElementById("confirmResetBtn").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state.save = defaultSave();
      renderTitle();
    });
    document.getElementById("cancelResetBtn").addEventListener("click", renderTitle);
  }

  function makeHero(id, x, y) {
    const stats = heroStats(id);
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 23,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      attack: stats.attack,
      speed: stats.speed,
      cooldownMax: stats.cooldown,
      cooldown: 0,
      ult: 42,
      ultCost: stats.ultimateCost,
      ultPower: stats.ultimatePower,
      range: stats.range,
      invuln: 0,
      stun: 0,
      down: false,
      revive: 0,
      faceX: 1,
      faceY: 0,
      step: 0,
      allyBrain: rand(0, 1)
    };
  }

  function startMission(level) {
    ensureAudio();
    const mission = MISSIONS.find((item) => item.level === level);
    if (!mission || !isMissionUnlocked(level)) return;
    state.selectedMission = level;
    const world = {
      w: clamp(1500 + level * 70, 1500, 2380),
      h: clamp(920 + level * 28, 920, 1320)
    };
    const party = state.save.party.filter(isUnlocked).slice(0, 3);
    if (!party.length) party.push("mendel");
    state.save.party = party;
    persist();
    const startX = 170;
    const startY = world.h * 0.5;
    const heroes = party.map((id, index) => makeHero(id, startX - index * 46, startY + (index - 1) * 54));
    state.battle = {
      mission,
      world,
      camera: { x: 0, y: 0 },
      heroes,
      activeIndex: 0,
      enemies: [],
      projectiles: [],
      particles: [],
      texts: [],
      zones: [],
      sentries: [],
      pickups: [],
      wave: 0,
      wavesTotal: mission.final ? 3 : 2 + Math.floor(level / 4),
      phase: "wave",
      spawnQueue: [],
      spawnTimer: 0,
      kills: 0,
      boss: null,
      bossPhase: 1,
      bossSpecial: 2.2,
      jokeTimer: 2,
      goodmanTimer: level >= 4 ? 18 : 999,
      time: 0,
      paused: false,
      complete: false,
      lost: false,
      shake: 0
    };
    state.screen = "battle";
    setGameVisible(true);
    spawnWave();
    showToast(mission.title, 1500);
    showToast(mission.joke, 2600);
    chord(260 + level * 10);
  }

  function activeHero() {
    const battle = state.battle;
    return battle.heroes[battle.activeIndex];
  }

  function livingHeroes() {
    return state.battle.heroes.filter((hero) => !hero.down && hero.hp > 0);
  }

  function spawnWave() {
    const battle = state.battle;
    battle.wave += 1;
    battle.phase = "wave";
    const base = 5 + battle.mission.level * 2 + battle.wave * 2;
    const count = battle.mission.final ? base + 8 : base;
    battle.spawnQueue = [];
    for (let i = 0; i < count; i += 1) {
      battle.spawnQueue.push(choice(battle.mission.enemyPool));
    }
    showToast(`Wave ${battle.wave}/${battle.wavesTotal}`, 1000);
  }

  function spawnEnemy(type, x, y, scale) {
    const base = ENEMIES[type] || ENEMIES.assignment;
    const battle = state.battle;
    const levelScale = 1 + battle.mission.level * 0.115 + (scale || 0);
    battle.enemies.push({
      type,
      name: base.name,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: base.radius,
      hp: Math.round(base.hp * levelScale),
      maxHp: Math.round(base.hp * levelScale),
      speed: base.speed * (1 + battle.mission.level * 0.01),
      damage: base.damage * (1 + battle.mission.level * 0.055),
      color: base.color,
      mode: base.mode,
      range: base.range || 90,
      cooldownMax: base.cooldown || 1.2,
      cooldown: rand(0.4, 1.2),
      stun: 0,
      slow: 0,
      elite: scale > 0.2
    });
  }

  function spawnBoss() {
    const battle = state.battle;
    const info = battle.mission.boss;
    const hpScale = 1 + battle.mission.level * 0.12;
    battle.phase = "boss";
    battle.bossPhase = 1;
    battle.bossSpecial = 1.2;
    battle.boss = {
      type: info.type,
      name: info.name,
      x: battle.world.w - 260,
      y: battle.world.h * 0.5,
      vx: 0,
      vy: 0,
      radius: info.type === "kashi" ? 44 : 36,
      hp: Math.round(info.hp * (info.type === "kashi" ? 1 : hpScale)),
      maxHp: Math.round(info.hp * (info.type === "kashi" ? 1 : hpScale)),
      speed: info.type === "kashi" ? 84 : 76 + battle.mission.level * 4,
      damage: info.type === "kashi" ? 26 : 18 + battle.mission.level * 1.5,
      color: info.color,
      cooldown: 1.4,
      cooldownMax: info.type === "kashi" ? 0.9 : 1.2,
      stun: 0,
      slow: 0,
      boss: true
    };
    battle.enemies.push(battle.boss);
    showToast(info.type === "kashi" ? "Kashi Phase 1: Assignments" : `${info.name} appears`, 1900);
    chord(info.type === "kashi" ? 110 : 180);
  }

  function spawnAtEdge() {
    const battle = state.battle;
    const edge = Math.floor(rand(0, 4));
    if (edge === 0) return { x: rand(60, battle.world.w - 60), y: 50 };
    if (edge === 1) return { x: battle.world.w - 50, y: rand(80, battle.world.h - 80) };
    if (edge === 2) return { x: rand(60, battle.world.w - 60), y: battle.world.h - 50 };
    return { x: 50, y: rand(80, battle.world.h - 80) };
  }

  function getMoveVector() {
    const input = state.input;
    let x = input.touch.x;
    let y = input.touch.y;
    if (input.keys.has("ArrowLeft") || input.keys.has("KeyA")) x -= 1;
    if (input.keys.has("ArrowRight") || input.keys.has("KeyD")) x += 1;
    if (input.keys.has("ArrowUp") || input.keys.has("KeyW")) y -= 1;
    if (input.keys.has("ArrowDown") || input.keys.has("KeyS")) y += 1;
    if (Math.hypot(x, y) > 1) {
      const n = normalize(x, y);
      x = n.x;
      y = n.y;
    }
    input.move.x = x;
    input.move.y = y;
    return input.move;
  }

  function update(dt) {
    if (state.screen !== "battle" || !state.battle) return;
    const battle = state.battle;
    if (battle.paused || battle.complete || battle.lost) return;
    battle.time += dt;
    battle.jokeTimer -= dt;
    battle.goodmanTimer -= dt;
    if (battle.jokeTimer <= 0) {
      battle.jokeTimer = 22;
      floatingText(activeHero().x, activeHero().y - 74, battle.mission.joke, "#fff1a8", 1.7);
    }
    if (battle.goodmanTimer <= 0) {
      battle.goodmanTimer = rand(24, 34);
      goodmanChaos();
    }
    updateSpawning(dt);
    updateHeroes(dt);
    applyTeamPassives(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updateZones(dt);
    updateSentries(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateBattleFlow();
    updateCamera(dt);
    syncHud();
  }

  function updateSpawning(dt) {
    const battle = state.battle;
    if (!battle.spawnQueue.length) return;
    battle.spawnTimer -= dt;
    if (battle.spawnTimer <= 0) {
      battle.spawnTimer = Math.max(0.16, 0.45 - battle.mission.level * 0.015);
      const type = battle.spawnQueue.shift();
      const pos = spawnAtEdge();
      spawnEnemy(type, pos.x, pos.y, battle.wave * 0.04);
    }
  }

  function updateHeroes(dt) {
    const battle = state.battle;
    const move = getMoveVector();
    battle.heroes.forEach((hero, index) => {
      hero.cooldown = Math.max(0, hero.cooldown - dt);
      hero.invuln = Math.max(0, hero.invuln - dt);
      hero.stun = Math.max(0, hero.stun - dt);
      hero.step += dt * 8;
      if (hero.down) {
        hero.revive -= dt;
        if (hero.revive <= 0 && livingHeroes().length > 0) {
          hero.down = false;
          hero.hp = Math.round(hero.maxHp * 0.45);
          hero.x = activeHero().x - 42;
          hero.y = activeHero().y + 42;
          floatingText(hero.x, hero.y - 48, `${CHARACTER_BY_ID[hero.id].name} returns`, "#b9f5cd", 1.2);
        }
        return;
      }
      hero.ult = clamp(hero.ult + dt * (hero.id === "dan" ? 8.5 : 6.2), 0, hero.ultCost);
      if (index === battle.activeIndex) {
        moveHero(hero, move.x, move.y, dt);
        if (state.input.attackHeld) tryBasic(hero);
      } else {
        updateCompanion(hero, dt);
      }
      hero.x = clamp(hero.x, 42, battle.world.w - 42);
      hero.y = clamp(hero.y, 58, battle.world.h - 58);
    });
    if (activeHero().down) swapToNextLiving();
  }

  function moveHero(hero, x, y, dt) {
    if (hero.stun > 0) return;
    const spd = hero.speed * (hero.id === "dan" ? 1.05 : 1);
    hero.vx = x * spd;
    hero.vy = y * spd;
    if (Math.abs(x) + Math.abs(y) > 0.04) {
      hero.faceX = x;
      hero.faceY = y;
    }
    hero.x += hero.vx * dt;
    hero.y += hero.vy * dt;
  }

  function updateCompanion(hero, dt) {
    const battle = state.battle;
    const leader = activeHero();
    const target = nearestEnemy(hero, hero.range + 110);
    if (target && hero.cooldown <= 0) {
      tryBasic(hero);
    }
    const anchorAngle = hero.allyBrain * TAU + battle.time * 0.55;
    const ax = leader.x - 82 + Math.cos(anchorAngle) * 48;
    const ay = leader.y + Math.sin(anchorAngle) * 58;
    const desired = target && dist(hero, target) < 220 ? { x: hero.x - target.x, y: hero.y - target.y } : { x: ax - hero.x, y: ay - hero.y };
    const n = normalize(desired.x, desired.y);
    if (Math.hypot(desired.x, desired.y) > 16) {
      hero.x += n.x * hero.speed * 0.72 * dt;
      hero.y += n.y * hero.speed * 0.72 * dt;
      hero.faceX = n.x;
      hero.faceY = n.y;
    }
  }

  function applyTeamPassives(dt) {
    const battle = state.battle;
    const ids = battle.heroes.filter((hero) => !hero.down).map((hero) => hero.id);
    if (ids.includes("hadar")) {
      battle.heroes.forEach((hero) => {
        if (!hero.down) hero.hp = Math.min(hero.maxHp, hero.hp + dt * 1.8);
      });
    }
    if (ids.includes("amichai") && battle.enemies.length < 3) {
      const hero = battle.heroes.find((item) => item.id === "amichai");
      if (hero && !hero.down) hero.ult = Math.min(hero.ultCost, hero.ult + dt * 4);
    }
    if (ids.includes("dan")) {
      battle.heroes.forEach((hero) => {
        if (!hero.down) hero.cooldown = Math.max(0, hero.cooldown - dt * 0.2);
      });
    }
  }

  function updateEnemies(dt) {
    const battle = state.battle;
    for (let i = battle.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = battle.enemies[i];
      if (enemy.hp <= 0) {
        defeatEnemy(enemy, i);
        continue;
      }
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.slow = Math.max(0, enemy.slow - dt);
      if (enemy.stun > 0) continue;
      const target = nearestHero(enemy);
      if (!target) continue;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const d = Math.hypot(dx, dy) || 1;
      const n = { x: dx / d, y: dy / d };
      const speedMod = enemy.slow > 0 ? 0.45 : 1;
      if (enemy.mode === "ranged" || enemy.mode === "spray") {
        if (d > enemy.range * 0.74) {
          enemy.x += n.x * enemy.speed * speedMod * dt;
          enemy.y += n.y * enemy.speed * speedMod * dt;
        }
        if (d < enemy.range && enemy.cooldown <= 0) {
          enemy.cooldown = enemy.cooldownMax;
          enemyShoot(enemy, target, enemy.mode === "spray" ? 3 : 1);
        }
      } else if (enemy.mode === "charger") {
        enemy.x += n.x * enemy.speed * speedMod * dt;
        enemy.y += n.y * enemy.speed * speedMod * dt;
        if (d < enemy.radius + target.radius + 7) hurtHero(target, enemy.damage, n.x, n.y);
      } else {
        enemy.x += n.x * enemy.speed * speedMod * dt;
        enemy.y += n.y * enemy.speed * speedMod * dt;
        if (d < enemy.radius + target.radius + 6 && enemy.cooldown <= 0) {
          enemy.cooldown = 0.75;
          hurtHero(target, enemy.damage, n.x, n.y);
        }
      }
    }
  }

  function updateBoss(dt) {
    const battle = state.battle;
    const boss = battle.boss;
    if (!boss || boss.hp <= 0) return;
    battle.bossSpecial -= dt;
    if (boss.type === "kashi") {
      const ratio = boss.hp / boss.maxHp;
      const phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      if (phase !== battle.bossPhase) {
        battle.bossPhase = phase;
        const phaseText = phase === 2 ? "Kashi Phase 2: Deadlines" : "Kashi Phase 3: Corporate Empire";
        showToast(phaseText, 2200);
        floatingText(boss.x, boss.y - 74, phaseText, "#ffdf7f", 1.8);
        battle.shake = 12;
        chord(100 + phase * 45);
      }
      if (battle.bossSpecial <= 0) {
        battle.bossSpecial = phase === 1 ? 3.2 : phase === 2 ? 2.45 : 1.8;
        kashiSpecial(phase);
      }
    } else if (battle.bossSpecial <= 0) {
      battle.bossSpecial = clamp(3 - battle.mission.level * 0.08, 1.45, 3);
      bossSpecial(boss);
    }
  }

  function enemyShoot(enemy, target, count) {
    const spread = count > 1 ? 0.34 : 0;
    const base = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    for (let i = 0; i < count; i += 1) {
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      const a = base + offset;
      const speed = enemy.boss ? 360 : 300;
      projectile({
        owner: "enemy",
        x: enemy.x + Math.cos(a) * enemy.radius,
        y: enemy.y + Math.sin(a) * enemy.radius,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        radius: enemy.boss ? 15 : 11,
        damage: enemy.damage,
        life: 3,
        color: enemy.color,
        shape: enemy.mode === "spray" ? "sheet" : "paper"
      });
    }
    tone(140, 0.08, "sawtooth", 0.018);
  }

  function bossSpecial(boss) {
    const battle = state.battle;
    const target = activeHero();
    if (!target) return;
    floatingText(boss.x, boss.y - 60, boss.name, "#fff1a8", 1.1);
    const type = boss.type;
    if (type === "monkeyBoss") {
      for (let i = 0; i < 5; i += 1) {
        const pos = spawnAtEdge();
        spawnEnemy("monkey", pos.x, pos.y, 0.15);
      }
      floatingText(boss.x, boss.y - 92, "MENDEL I FOUND YOU", "#fff1a8", 1.6);
    } else if (type === "roadBoss") {
      addZone(target.x, target.y, 92, 1.2, boss.damage * 0.6, "#9b78de", "dash");
    } else if (type === "garageBoss") {
      radialShots(boss, 10, 290, boss.damage, "#c97848", "wrench");
    } else if (type === "couponBoss") {
      addZone(target.x, target.y, 110, 1.5, boss.damage * 0.45, "#68c58a", "coupon");
    } else if (type === "moneyBoss") {
      for (let i = 0; i < 14; i += 1) {
        const x = rand(target.x - 240, target.x + 240);
        const y = rand(target.y - 200, target.y + 200);
        addZone(x, y, 38, 0.9, boss.damage * 0.45, "#f5c451", "money");
      }
    } else if (type === "soccerBoss") {
      radialShots(boss, 8, 350, boss.damage * 1.05, "#f8f3df", "ball");
    } else if (type === "aiBoss") {
      for (let i = 0; i < 3; i += 1) {
        spawnEnemy("aiBug", boss.x + rand(-60, 60), boss.y + rand(-60, 60), 0.24);
      }
    } else if (type === "cleaningBoss") {
      addZone(target.x, target.y, 150, 1.4, boss.damage * 0.5, "#ff9fc0", "wash");
    } else {
      radialShots(boss, 12, 300, boss.damage, "#e8d8ad", "paper");
    }
    battle.shake = Math.max(battle.shake, 6);
  }

  function kashiSpecial(phase) {
    const boss = state.battle.boss;
    const target = activeHero();
    if (!boss || !target) return;
    if (phase === 1) {
      floatingText(boss.x, boss.y - 80, "Assignments", "#f6e9bf", 1.3);
      radialShots(boss, 8, 310, boss.damage * 0.85, "#f6e9bf", "paper");
      for (let i = 0; i < 3; i += 1) {
        const pos = spawnAtEdge();
        spawnEnemy("assignment", pos.x, pos.y, 0.4);
      }
    } else if (phase === 2) {
      floatingText(boss.x, boss.y - 80, "Deadlines", "#ee6656", 1.3);
      for (let i = 0; i < 8; i += 1) {
        addZone(target.x + rand(-220, 220), target.y + rand(-180, 180), 48, 0.85, boss.damage * 0.55, "#ee6656", "deadline");
      }
      for (let i = 0; i < 4; i += 1) {
        const pos = spawnAtEdge();
        spawnEnemy("deadline", pos.x, pos.y, 0.45);
      }
    } else {
      floatingText(boss.x, boss.y - 84, "Infinite Spreadsheets", "#b9f5cd", 1.6);
      radialShots(boss, 18, 330, boss.damage * 0.7, "#68c58a", "sheet");
      addZone(target.x, target.y, 180, 1.25, boss.damage * 0.75, "#68c58a", "sheet");
      for (let i = 0; i < 5; i += 1) {
        const pos = spawnAtEdge();
        spawnEnemy(choice(["spreadsheet", "report", "workbot"]), pos.x, pos.y, 0.42);
      }
    }
    state.battle.shake = Math.max(state.battle.shake, 10 + phase * 2);
    tone(75 + phase * 35, 0.18, "sawtooth", 0.035);
  }

  function radialShots(source, count, speed, damage, color, shape) {
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * TAU + state.battle.time * 0.3;
      projectile({
        owner: "enemy",
        x: source.x + Math.cos(a) * source.radius,
        y: source.y + Math.sin(a) * source.radius,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        radius: 13,
        damage,
        life: 3.3,
        color,
        shape
      });
    }
  }

  function nearestHero(from) {
    let best = null;
    let bestDist = Infinity;
    for (const hero of state.battle.heroes) {
      if (hero.down || hero.hp <= 0) continue;
      const d = dist(from, hero);
      if (d < bestDist) {
        best = hero;
        bestDist = d;
      }
    }
    return best;
  }

  function nearestEnemy(from, maxRange) {
    let best = null;
    let bestDist = maxRange || Infinity;
    for (const enemy of state.battle.enemies) {
      if (enemy.hp <= 0) continue;
      const d = dist(from, enemy);
      if (d < bestDist) {
        best = enemy;
        bestDist = d;
      }
    }
    return best;
  }

  function tryBasic(hero) {
    const battle = state.battle;
    if (!battle || hero.down || hero.cooldown > 0 || hero.stun > 0) return;
    const data = CHARACTER_BY_ID[hero.id];
    const target = nearestEnemy(hero, hero.range + 80);
    let dir = target ? normalize(target.x - hero.x, target.y - hero.y) : normalize(hero.faceX || 1, hero.faceY || 0);
    hero.faceX = dir.x;
    hero.faceY = dir.y;
    hero.cooldown = hero.cooldownMax;
    const damage = hero.attack;
    if (data.style === "dash") {
      hero.x = clamp(hero.x + dir.x * 150, 42, battle.world.w - 42);
      hero.y = clamp(hero.y + dir.y * 150, 58, battle.world.h - 58);
      hero.invuln = Math.max(hero.invuln, 0.16);
      damageArc(hero, 92, damage * 1.25, "#9b78de");
      trail(hero.x - dir.x * 70, hero.y - dir.y * 70, hero.x, hero.y, "#9b78de");
    } else if (data.style === "melee") {
      damageArc(hero, 118, damage * 1.35, "#c97848");
      burst(hero.x + dir.x * 42, hero.y + dir.y * 42, "#c97848", 10, 180);
    } else if (data.style === "spread") {
      const base = Math.atan2(dir.y, dir.x);
      for (let i = -1; i <= 1; i += 1) {
        const a = base + i * 0.2;
        heroProjectile(hero, Math.cos(a), Math.sin(a), damage * 0.9, "#f5c451", "money", 520);
      }
    } else if (data.style === "debate") {
      addZone(hero.x + dir.x * 95, hero.y + dir.y * 95, 112, 0.28, damage * 1.2, "#ff8f52", "debate", "hero");
      floatingText(hero.x, hero.y - 55, "Argument Mode", "#ffdf7f", 0.8);
    } else {
      const speed = data.style === "ai" ? 620 : data.style === "soccer" ? 650 : 560;
      const color = data.style === "question" ? "#55b8dc" : data.style === "coupon" ? "#68c58a" : data.style === "calm" ? "#8ba3ff" : data.style === "spray" ? "#ff9fc0" : data.style === "blessing" ? "#fff1a8" : "#f5c451";
      const shape = data.style === "banana" ? "banana" : data.style === "soccer" ? "ball" : data.style === "ai" ? "ai" : data.style === "coupon" ? "coupon" : data.style === "calm" ? "calm" : data.style === "spray" ? "spray" : data.style === "blessing" ? "blessing" : "question";
      heroProjectile(hero, dir.x, dir.y, damage, color, shape, speed);
    }
    hero.ult = clamp(hero.ult + 4, 0, hero.ultCost);
    tone(360 + Math.random() * 80, 0.07, "square", 0.02);
  }

  function heroProjectile(hero, dx, dy, damage, color, shape, speed) {
    projectile({
      owner: "hero",
      source: hero.id,
      x: hero.x + dx * 30,
      y: hero.y + dy * 30,
      vx: dx * speed,
      vy: dy * speed,
      radius: shape === "ball" ? 15 : 12,
      damage,
      life: shape === "ai" ? 1.7 : 1.45,
      color,
      shape,
      pierce: shape === "blessing" ? 2 : 0,
      homing: shape === "ai"
    });
  }

  function projectile(data) {
    state.battle.projectiles.push(Object.assign({ hit: new Set(), angle: Math.atan2(data.vy, data.vx) }, data));
  }

  function damageArc(hero, radius, damage, color) {
    const battle = state.battle;
    let hits = 0;
    for (const enemy of battle.enemies) {
      if (enemy.hp <= 0) continue;
      const d = dist(hero, enemy);
      if (d < radius + enemy.radius) {
        enemy.hp -= damage;
        enemy.stun = Math.max(enemy.stun, 0.12);
        hits += 1;
        burst(enemy.x, enemy.y, color, 7, 160);
      }
    }
    addZone(hero.x, hero.y, radius, 0.15, 0, color, "slash", "visual");
    if (hits) battle.shake = Math.max(battle.shake, 5);
  }

  function tryUltimate() {
    const hero = activeHero();
    if (!hero || hero.down || hero.ult < hero.ultCost) {
      tone(120, 0.08, "sine", 0.014);
      return;
    }
    hero.ult = 0;
    const data = CHARACTER_BY_ID[hero.id];
    const power = hero.ultPower;
    showToast(`${data.name}: ${data.ultimate}`, 1600);
    floatingText(hero.x, hero.y - 72, data.ultimate, "#fff1a8", 1.6);
    state.battle.shake = Math.max(state.battle.shake, 9);
    chord(300 + hero.attack * 6);
    if (hero.id === "mendel") {
      for (let i = 0; i < 20; i += 1) {
        const a = (i / 20) * TAU;
        heroProjectile(hero, Math.cos(a), Math.sin(a), hero.attack * 1.35 * power, "#f5c451", "banana", 650);
      }
      addZone(hero.x, hero.y, 210, 1.2, hero.attack * 0.55 * power, "#f5c451", "army", "hero");
    } else if (hero.id === "aviad") {
      state.battle.enemies.forEach((enemy) => {
        enemy.stun = Math.max(enemy.stun, 2.6 * power);
        enemy.hp -= hero.attack * 1.4 * power;
      });
      addZone(hero.x, hero.y, 330, 1.2, 0, "#55b8dc", "training", "visual");
    } else if (hero.id === "halel") {
      hero.invuln = 2.4;
      for (let i = 0; i < 7; i += 1) {
        const target = nearestEnemy(hero, 9999);
        if (!target) break;
        trail(hero.x, hero.y, target.x, target.y, "#9b78de");
        hero.x = clamp(target.x + rand(-30, 30), 42, state.battle.world.w - 42);
        hero.y = clamp(target.y + rand(-30, 30), 58, state.battle.world.h - 58);
        target.hp -= hero.attack * 2.1 * power;
        burst(target.x, target.y, "#9b78de", 14, 260);
      }
    } else if (hero.id === "farber") {
      for (let i = 0; i < 3; i += 1) {
        state.battle.sentries.push({ x: hero.x + rand(-90, 90), y: hero.y + rand(-90, 90), life: 8 * power, fire: 0, color: "#c97848", source: hero.id, damage: hero.attack * 0.95 * power });
      }
    } else if (hero.id === "kuzar") {
      state.battle.enemies.forEach((enemy) => {
        enemy.hp -= hero.attack * 1.6 * power;
        enemy.slow = Math.max(enemy.slow, 4);
      });
      addZone(hero.x, hero.y, 360, 1.1, 0, "#68c58a", "coupon", "visual");
    } else if (hero.id === "gelman") {
      for (let i = 0; i < 32; i += 1) {
        addZone(hero.x + rand(-360, 360), hero.y + rand(-260, 260), 38, rand(0.45, 1), hero.attack * 0.75 * power, "#f5c451", "money", "hero");
      }
    } else if (hero.id === "amichai") {
      for (let i = 0; i < 16; i += 1) {
        const a = rand(0, TAU);
        heroProjectile(hero, Math.cos(a), Math.sin(a), hero.attack * 1.2 * power, "#f8f3df", "ball", 760);
      }
      addZone(hero.x, hero.y, 260, 2.2, hero.attack * 0.32 * power, "#4fb46f", "soccer", "hero");
    } else if (hero.id === "david") {
      for (let i = 0; i < 5; i += 1) {
        state.battle.sentries.push({ x: hero.x + rand(-120, 120), y: hero.y + rand(-120, 120), life: 7.5 * power, fire: i * 0.14, color: "#43c9c9", source: hero.id, damage: hero.attack * 0.8 * power, drone: true });
      }
    } else if (hero.id === "amit") {
      state.battle.heroes.forEach((ally) => {
        ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.35 * power);
        ally.invuln = Math.max(ally.invuln, 1.8);
      });
      state.battle.enemies.forEach((enemy) => {
        enemy.stun = Math.max(enemy.stun, 2.2);
        enemy.hp -= hero.attack * 1.1 * power;
      });
      addZone(hero.x, hero.y, 330, 1.3, 0, "#8ba3ff", "calm", "visual");
    } else if (hero.id === "hadar") {
      state.battle.heroes.forEach((ally) => {
        ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.55 * power);
      });
      addZone(hero.x, hero.y, 310, 3.3, hero.attack * 0.45 * power, "#ff9fc0", "wash", "hero");
    } else if (hero.id === "tal") {
      addZone(hero.x, hero.y, 420, 5.4, hero.attack * 0.42 * power, "#ff8f52", "debate", "hero");
    } else if (hero.id === "dan") {
      state.battle.heroes.forEach((ally) => {
        ally.hp = ally.maxHp;
        ally.invuln = Math.max(ally.invuln, 4);
      });
      state.battle.enemies.forEach((enemy) => {
        enemy.hp -= hero.attack * 3.4 * power;
        enemy.stun = Math.max(enemy.stun, 1.4);
      });
      addZone(hero.x, hero.y, 520, 2.5, hero.attack * 0.6 * power, "#fff1a8", "miracle", "hero");
    }
  }

  function updateProjectiles(dt) {
    const battle = state.battle;
    for (let i = battle.projectiles.length - 1; i >= 0; i -= 1) {
      const p = battle.projectiles[i];
      if (p.homing && p.owner === "hero") {
        const target = nearestEnemy(p, 360);
        if (target) {
          const n = normalize(target.x - p.x, target.y - p.y);
          p.vx = p.vx * 0.9 + n.x * 650 * 0.1;
          p.vy = p.vy * 0.9 + n.y * 650 * 0.1;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.angle += dt * 5;
      let remove = p.life <= 0 || p.x < -80 || p.x > battle.world.w + 80 || p.y < -80 || p.y > battle.world.h + 80;
      if (!remove && p.owner === "hero") {
        for (const enemy of battle.enemies) {
          if (enemy.hp <= 0 || p.hit.has(enemy)) continue;
          if (distXY(p.x, p.y, enemy.x, enemy.y) < p.radius + enemy.radius) {
            enemy.hp -= p.damage;
            p.hit.add(enemy);
            if (p.shape === "calm") enemy.slow = Math.max(enemy.slow, 2.2);
            if (p.shape === "question") enemy.stun = Math.max(enemy.stun, 0.35);
            burst(p.x, p.y, p.color, 8, 150);
            battle.shake = Math.max(battle.shake, 2);
            if (p.pierce > 0) p.pierce -= 1;
            else remove = true;
            break;
          }
        }
      } else if (!remove && p.owner === "enemy") {
        for (const hero of battle.heroes) {
          if (hero.down || hero.hp <= 0) continue;
          if (distXY(p.x, p.y, hero.x, hero.y) < p.radius + hero.radius) {
            const n = normalize(hero.x - p.x, hero.y - p.y);
            hurtHero(hero, p.damage, n.x, n.y);
            remove = true;
            break;
          }
        }
      }
      if (remove) battle.projectiles.splice(i, 1);
    }
  }

  function updateZones(dt) {
    const battle = state.battle;
    for (let i = battle.zones.length - 1; i >= 0; i -= 1) {
      const zone = battle.zones[i];
      zone.life -= dt;
      zone.pulse += dt;
      if (zone.owner === "hero") {
        for (const enemy of battle.enemies) {
          if (enemy.hp <= 0) continue;
          if (distXY(zone.x, zone.y, enemy.x, enemy.y) < zone.radius + enemy.radius) {
            enemy.hp -= zone.damage * dt;
            if (zone.kind === "wash" || zone.kind === "calm") enemy.slow = Math.max(enemy.slow, 0.5);
            if (zone.kind === "debate") enemy.stun = Math.max(enemy.stun, 0.05);
          }
        }
      } else if (zone.owner === "enemy") {
        for (const hero of battle.heroes) {
          if (hero.down || hero.hp <= 0) continue;
          if (distXY(zone.x, zone.y, hero.x, hero.y) < zone.radius + hero.radius) {
            hurtHero(hero, zone.damage * dt, normalize(hero.x - zone.x, hero.y - zone.y).x, normalize(hero.x - zone.x, hero.y - zone.y).y, true);
          }
        }
      }
      if (zone.life <= 0) battle.zones.splice(i, 1);
    }
  }

  function addZone(x, y, radius, life, damage, color, kind, owner) {
    state.battle.zones.push({ x, y, radius, life, maxLife: life, damage, color, kind, owner: owner || "enemy", pulse: 0 });
  }

  function updateSentries(dt) {
    const battle = state.battle;
    for (let i = battle.sentries.length - 1; i >= 0; i -= 1) {
      const sentry = battle.sentries[i];
      sentry.life -= dt;
      sentry.fire -= dt;
      if (sentry.drone) {
        const leader = activeHero();
        sentry.x += (leader.x + Math.cos(battle.time * 2 + i) * 130 - sentry.x) * dt * 2.2;
        sentry.y += (leader.y + Math.sin(battle.time * 2 + i) * 100 - sentry.y) * dt * 2.2;
      }
      if (sentry.fire <= 0) {
        sentry.fire = sentry.drone ? 0.45 : 0.62;
        const target = nearestEnemy(sentry, 620);
        if (target) {
          const n = normalize(target.x - sentry.x, target.y - sentry.y);
          projectile({
            owner: "hero",
            source: sentry.source,
            x: sentry.x,
            y: sentry.y,
            vx: n.x * 620,
            vy: n.y * 620,
            radius: sentry.drone ? 10 : 13,
            damage: sentry.damage,
            life: 1.25,
            color: sentry.color,
            shape: sentry.drone ? "ai" : "wrench",
            hit: new Set()
          });
        }
      }
      if (sentry.life <= 0) battle.sentries.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    const battle = state.battle;
    for (let i = battle.pickups.length - 1; i >= 0; i -= 1) {
      const p = battle.pickups[i];
      p.life -= dt;
      const hero = nearestHero(p);
      if (hero) {
        const d = dist(p, hero);
        if (d < 160) {
          const n = normalize(hero.x - p.x, hero.y - p.y);
          p.x += n.x * 180 * dt;
          p.y += n.y * 180 * dt;
        }
        if (d < hero.radius + 16) {
          if (p.kind === "heart") hero.hp = Math.min(hero.maxHp, hero.hp + hero.maxHp * 0.18);
          else battle.heroes.forEach((ally) => { if (!ally.down) ally.ult = Math.min(ally.ultCost, ally.ult + 10); });
          burst(p.x, p.y, p.color, 9, 160);
          battle.pickups.splice(i, 1);
          continue;
        }
      }
      if (p.life <= 0) battle.pickups.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    const battle = state.battle;
    for (let i = battle.particles.length - 1; i >= 0; i -= 1) {
      const p = battle.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life -= dt;
      if (p.life <= 0) battle.particles.splice(i, 1);
    }
    for (let i = battle.texts.length - 1; i >= 0; i -= 1) {
      const t = battle.texts[i];
      t.y -= dt * 38;
      t.life -= dt;
      if (t.life <= 0) battle.texts.splice(i, 1);
    }
    battle.shake = Math.max(0, battle.shake - dt * 18);
  }

  function defeatEnemy(enemy, index) {
    const battle = state.battle;
    battle.enemies.splice(index, 1);
    battle.kills += 1;
    burst(enemy.x, enemy.y, enemy.color, enemy.boss ? 38 : 12, enemy.boss ? 360 : 180);
    if (Math.random() < (enemy.boss ? 1 : 0.1)) {
      battle.pickups.push({ x: enemy.x, y: enemy.y, kind: enemy.boss ? "heart" : "charge", color: enemy.boss ? "#ee6656" : "#fff1a8", life: 8 });
    }
    if (enemy.boss) {
      battle.boss = null;
      completeMission();
    } else {
      tone(210, 0.05, "triangle", 0.012);
    }
  }

  function hurtHero(hero, damage, nx, ny, soft) {
    const battle = state.battle;
    if (hero.invuln > 0 || hero.down) return;
    const mitigation = state.battle.heroes.some((ally) => ally.id === "amit" && !ally.down) ? 0.9 : 1;
    const rookie = hero.id === "aviad" && hero.hp < hero.maxHp * 0.35 ? 0.82 : 1;
    hero.hp -= damage * mitigation * rookie;
    hero.x = clamp(hero.x + nx * (soft ? 5 : 22), 42, battle.world.w - 42);
    hero.y = clamp(hero.y + ny * (soft ? 5 : 22), 58, battle.world.h - 58);
    hero.invuln = soft ? 0.03 : 0.42;
    battle.shake = Math.max(battle.shake, soft ? 2 : 7);
    burst(hero.x, hero.y, "#ee6656", soft ? 3 : 15, 180);
    if (hero.hp <= 0) {
      hero.down = true;
      hero.hp = 0;
      hero.revive = 14;
      floatingText(hero.x, hero.y - 52, `${CHARACTER_BY_ID[hero.id].name} down`, "#ee6656", 1.3);
      swapToNextLiving();
      if (!livingHeroes().length) loseMission();
    }
  }

  function swapHero() {
    if (state.screen !== "battle" || !state.battle || state.battle.paused) return;
    const battle = state.battle;
    for (let offset = 1; offset <= battle.heroes.length; offset += 1) {
      const next = (battle.activeIndex + offset) % battle.heroes.length;
      if (!battle.heroes[next].down) {
        battle.activeIndex = next;
        showToast(CHARACTER_BY_ID[battle.heroes[next].id].name, 700);
        tone(500, 0.05, "triangle", 0.015);
        return;
      }
    }
  }

  function swapToNextLiving() {
    const battle = state.battle;
    for (let i = 0; i < battle.heroes.length; i += 1) {
      if (!battle.heroes[i].down) {
        battle.activeIndex = i;
        return;
      }
    }
  }

  function updateBattleFlow() {
    const battle = state.battle;
    if (battle.complete || battle.lost) return;
    const activeEnemies = battle.enemies.length + battle.spawnQueue.length;
    if (battle.phase === "wave" && activeEnemies === 0) {
      if (battle.wave < battle.wavesTotal) {
        spawnWave();
      } else {
        spawnBoss();
      }
    }
  }

  function completeMission() {
    const battle = state.battle;
    if (battle.complete) return;
    battle.complete = true;
    const mission = battle.mission;
    const firstTime = !state.save.completed[mission.level];
    const rewards = [];
    const sparks = mission.reward + (firstTime ? Math.ceil(mission.level / 2) : Math.max(2, Math.floor(mission.reward / 2)));
    state.save.sparks += sparks;
    rewards.push(`${sparks} resistance sparks`);
    state.save.completed[mission.level] = true;
    state.save.highestLevel = Math.max(state.save.highestLevel, Math.min(12, mission.level + 1));
    state.save.wins += 1;
    if (firstTime) {
      [mission.unlock, mission.bonusUnlock].filter(Boolean).forEach((id) => {
        if (!state.save.unlocked.includes(id)) {
          state.save.unlocked.push(id);
          rewards.push(`${CHARACTER_BY_ID[id].name} joined the resistance`);
        }
      });
      if (mission.bonusUnlock === "dan" && !state.save.unlocked.includes("dan")) {
        state.save.unlocked.push("dan");
        rewards.push("Dan returned as a legendary hero");
      }
    }
    if (mission.final) rewards.push("Kashi's empire collapsed");
    persist();
    chord(mission.final ? 520 : 420);
    setTimeout(() => renderResult(true, rewards), 600);
  }

  function loseMission() {
    const battle = state.battle;
    if (battle.lost) return;
    battle.lost = true;
    state.save.sparks += 1;
    persist();
    setTimeout(() => renderResult(false, ["1 pity spark", "The resistance retreats and complains about the workload"]), 450);
  }

  function renderResult(win, rewards) {
    setGameVisible(false);
    menuLayer.hidden = false;
    const mission = state.battle ? state.battle.mission : MISSIONS[0];
    const lines = rewards.map((reward) => `<div class="reward-line">${escapeHtml(reward)}</div>`).join("");
    menuLayer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <h2>${win ? (mission.final ? "Dark Times Defeated" : "Mission Complete") : "Mission Failed"}</h2>
          <p>${win ? escapeHtml(mission.joke) : "Kashi's paperwork won this round."}</p>
          <div class="reward-list">${lines}</div>
          <div class="modal-actions">
            <button id="nextBtn" class="primary-button" type="button">${win && mission.level < 12 ? "Next" : "Campaign"}</button>
            <button id="rosterBtn" class="ghost-button" type="button">Roster</button>
            <button id="retryBtn" class="ghost-button" type="button">Retry</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("nextBtn").addEventListener("click", () => {
      if (win && mission.level < 12) startMission(mission.level + 1);
      else renderCampaign();
    });
    document.getElementById("rosterBtn").addEventListener("click", renderRoster);
    document.getElementById("retryBtn").addEventListener("click", () => startMission(mission.level));
  }

  function goodmanChaos() {
    const battle = state.battle;
    if (!battle || battle.complete || battle.lost) return;
    floatingText(activeHero().x, activeHero().y - 86, "GOODMAN CHAOS", "#fff1a8", 1.5);
    if (Math.random() < 0.55) {
      battle.enemies.forEach((enemy) => {
        enemy.hp -= 26 + battle.mission.level * 4;
        enemy.stun = Math.max(enemy.stun, 0.6);
      });
      showToast("Goodman caused helpful chaos", 1200);
    } else {
      for (let i = 0; i < 3; i += 1) {
        const pos = spawnAtEdge();
        spawnEnemy(choice(battle.mission.enemyPool), pos.x, pos.y, 0.2);
      }
      showToast("Goodman caused extra chaos", 1200);
    }
    battle.shake = Math.max(battle.shake, 8);
  }

  function updateCamera(dt) {
    const battle = state.battle;
    const hero = activeHero();
    const tx = clamp(hero.x - state.view.w * 0.46, 0, Math.max(0, battle.world.w - state.view.w));
    const ty = clamp(hero.y - state.view.h * 0.54, 0, Math.max(0, battle.world.h - state.view.h));
    battle.camera.x += (tx - battle.camera.x) * Math.min(1, dt * 7);
    battle.camera.y += (ty - battle.camera.y) * Math.min(1, dt * 7);
  }

  function syncHud() {
    const battle = state.battle;
    if (!battle) return;
    hudLevel.textContent = `LEVEL ${battle.mission.level}`;
    hudMission.textContent = battle.mission.title;
    hudObjective.textContent = battle.phase === "boss" ? "BOSS" : "OBJECTIVE";
    hudProgress.textContent = battle.phase === "boss" && battle.boss ? `${battle.boss.name} ${Math.max(0, Math.ceil((battle.boss.hp / battle.boss.maxHp) * 100))}%` : `Wave ${battle.wave}/${battle.wavesTotal}`;
    partyHud.innerHTML = battle.heroes.map((hero, index) => {
      const data = CHARACTER_BY_ID[hero.id];
      const hpPct = hero.maxHp ? clamp((hero.hp / hero.maxHp) * 100, 0, 100) : 0;
      const ultPct = hero.ultCost ? clamp((hero.ult / hero.ultCost) * 100, 0, 100) : 0;
      return `
        <div class="hero-pill ${index === battle.activeIndex ? "hero-pill-active" : ""}">
          <div class="hero-pill-top">
            <span class="hero-dot" style="background:${data.color}"></span>
            <span class="hero-name">${data.name}</span>
          </div>
          <div class="bar"><span style="width:${hpPct}%"></span></div>
          <div class="bar bar-ult"><span style="width:${ultPct}%"></span></div>
        </div>
      `;
    }).join("");
  }

  function render() {
    ctx.clearRect(0, 0, state.view.w, state.view.h);
    if (state.screen === "battle" && state.battle) {
      renderBattle();
    } else {
      renderBackdrop();
    }
  }

  function renderBackdrop() {
    const w = state.view.w;
    const h = state.view.h;
    ctx.fillStyle = "#10151f";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 80; i += 1) {
      const x = (i * 97 + performance.now() * 0.01) % w;
      const y = (i * 53) % h;
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = i % 3 === 0 ? "#f5c451" : i % 3 === 1 ? "#55b8dc" : "#ee6656";
      ctx.fillRect(x, y, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  function renderBattle() {
    const battle = state.battle;
    const shakeX = battle.shake ? rand(-battle.shake, battle.shake) * 0.45 : 0;
    const shakeY = battle.shake ? rand(-battle.shake, battle.shake) * 0.45 : 0;
    ctx.save();
    ctx.translate(-battle.camera.x + shakeX, -battle.camera.y + shakeY);
    drawMap(battle.mission.map, battle.world);
    battle.zones.forEach(drawZone);
    battle.pickups.forEach(drawPickup);
    battle.sentries.forEach(drawSentry);
    battle.projectiles.forEach(drawProjectile);
    battle.enemies.forEach(drawEnemy);
    battle.heroes.forEach((hero, index) => drawHero(hero, index === battle.activeIndex));
    battle.particles.forEach(drawParticle);
    battle.texts.forEach(drawText);
    ctx.restore();
  }

  function drawMap(kind, world) {
    const palettes = {
      jungle: ["#1f5139", "#2d6948", "#f5c451"],
      training: ["#384250", "#4a5363", "#ee6656"],
      road: ["#303541", "#414957", "#f8f3df"],
      garage: ["#3a312d", "#51413a", "#c97848"],
      market: ["#244a3b", "#315f4d", "#68c58a"],
      money: ["#283b3a", "#4b4731", "#f5c451"],
      soccer: ["#205739", "#2d7a4d", "#f8f3df"],
      lab: ["#172d3a", "#1f5160", "#43c9c9"],
      office: ["#29314a", "#3b4561", "#8ba3ff"],
      cleaning: ["#3b2b43", "#553750", "#ff9fc0"],
      hq: ["#2e3544", "#39485a", "#ff8f52"],
      empire: ["#222630", "#343847", "#68c58a"]
    };
    const p = palettes[kind] || palettes.office;
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, world.w, world.h);
    ctx.fillStyle = p[1];
    for (let x = 0; x < world.w; x += 120) {
      for (let y = 0; y < world.h; y += 120) {
        if ((x + y) % 240 === 0) ctx.fillRect(x, y, 116, 116);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    for (let x = 0; x < world.w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.h);
      ctx.stroke();
    }
    for (let y = 0; y < world.h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.w, y);
      ctx.stroke();
    }
    drawMapProps(kind, world, p[2]);
  }

  function drawMapProps(kind, world, accent) {
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.18;
    if (kind === "soccer") {
      ctx.strokeStyle = "rgba(248,243,223,0.52)";
      ctx.lineWidth = 6;
      ctx.strokeRect(world.w * 0.25, world.h * 0.2, world.w * 0.5, world.h * 0.6);
      ctx.beginPath();
      ctx.arc(world.w * 0.5, world.h * 0.5, 90, 0, TAU);
      ctx.stroke();
    } else if (kind === "empire") {
      for (let i = 0; i < 9; i += 1) {
        ctx.fillRect(world.w - 460 + i * 46, 110 + (i % 3) * 44, 28, world.h - 220);
      }
      ctx.globalAlpha = 1;
      drawBillboard(world.w - 420, 70, "KASHI CORP");
    } else if (kind === "jungle") {
      for (let i = 0; i < 28; i += 1) {
        drawLeaf((i * 173) % world.w, 80 + (i * 89) % (world.h - 160), accent);
      }
    } else if (kind === "lab") {
      for (let i = 0; i < 8; i += 1) drawBillboard(160 + i * 190, 110 + (i % 2) * 620, "AI");
      drawBillboard(world.w - 520, world.h - 160, "Bruiner sleeping");
    } else if (kind === "market") {
      drawBillboard(world.w * 0.45, 90, "GIAT LOW COST?");
      drawBillboard(world.w * 0.62, world.h - 170, "Kuzar says no");
    } else if (kind === "cleaning") {
      drawBillboard(world.w - 520, 90, "Hadar windows");
      drawBillboard(180, world.h - 170, "Washing machine");
    } else if (kind === "hq") {
      drawBillboard(world.w * 0.44, 80, "Resistance HQ");
      drawBillboard(world.w * 0.58, world.h - 150, "Tal still arguing");
    } else {
      drawBillboard(world.w - 430, 85, kind.toUpperCase());
    }
    ctx.restore();
  }

  function drawBillboard(x, y, text) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(16,21,31,0.72)";
    roundRect(x, y, 210, 54, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.stroke();
    ctx.fillStyle = "#f8f3df";
    ctx.font = "900 17px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + 105, y + 27);
    ctx.restore();
  }

  function drawLeaf(x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((x + y) * 0.01);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 12, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHero(hero, active) {
    const data = CHARACTER_BY_ID[hero.id];
    if (hero.down) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(hero.x, hero.y + 18, 30, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = data.color;
      ctx.font = "900 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(data.initials, hero.x, hero.y);
      ctx.restore();
      return;
    }
    const flicker = hero.invuln > 0 && Math.floor(state.battle.time * 18) % 2 === 0;
    if (flicker) return;
    const bob = Math.sin(hero.step * 1.8) * 3;
    ctx.save();
    ctx.translate(hero.x, hero.y + bob);
    if (active) {
      ctx.strokeStyle = "rgba(245,196,81,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 4, hero.radius + 9 + Math.sin(state.battle.time * 7) * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 28, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = data.color;
    roundRect(-19, -11, 38, 44, 12);
    ctx.fill();
    ctx.fillStyle = "#f2bc8f";
    ctx.beginPath();
    ctx.arc(0, -28, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#232838";
    ctx.fillRect(-17, -43, 34, 9);
    ctx.beginPath();
    ctx.arc(0, -43, 16, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = "#10151f";
    ctx.beginPath();
    ctx.arc(6, -29, 2.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#f2bc8f";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(15, -2);
    ctx.lineTo(28, -7);
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.initials, 0, 15);
    drawHealthBar(-24, -64, 48, hero.hp / hero.maxHp, "#68c58a");
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const boss = enemy.boss;
    const pulse = boss ? Math.sin(state.battle.time * 5) * 2 : 0;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, enemy.radius * 0.92, enemy.radius * 1.1, enemy.radius * 0.36, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = enemy.color;
    if (enemy.mode === "ranged" || enemy.mode === "spray") {
      roundRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(16,21,31,0.65)";
      ctx.fillRect(-enemy.radius * 0.55, -3, enemy.radius * 1.1, 6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius + pulse, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "#10151f";
    ctx.beginPath();
    ctx.arc(-6, -4, 2.5, 0, TAU);
    ctx.arc(7, -4, 2.5, 0, TAU);
    ctx.fill();
    if (boss) {
      ctx.fillStyle = "#f8f3df";
      ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(enemy.type === "kashi" ? "K" : "B", 0, 8);
      drawHealthBar(-42, -enemy.radius - 28, 84, enemy.hp / enemy.maxHp, "#ee6656");
    } else if (enemy.elite) {
      ctx.strokeStyle = "#fff1a8";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHealthBar(x, y, w, pct, color) {
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    roundRect(x, y, w, 7, 4);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(x, y, w * clamp(pct, 0, 1), 7, 4);
    ctx.fill();
  }

  function drawProjectile(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "rgba(16,21,31,0.65)";
    ctx.lineWidth = 2;
    if (p.shape === "banana") {
      ctx.strokeStyle = "#6d4817";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, -2, 17, 0.3, 2.7);
      ctx.stroke();
      ctx.strokeStyle = "#fff1a8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, -5, 15, 0.34, 2.55);
      ctx.stroke();
    } else if (p.shape === "ball") {
      ctx.fillStyle = "#f8f3df";
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-p.radius, 0);
      ctx.lineTo(p.radius, 0);
      ctx.moveTo(0, -p.radius);
      ctx.lineTo(0, p.radius);
      ctx.stroke();
    } else if (p.shape === "money" || p.shape === "coupon" || p.shape === "sheet" || p.shape === "paper") {
      roundRect(-15, -10, 30, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#10151f";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.shape === "money" ? "$" : p.shape === "coupon" ? "%" : "X", 0, 1);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#10151f";
      ctx.font = "900 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.shape === "question" ? "?" : p.shape === "ai" ? "AI" : p.shape === "blessing" ? "+" : "!", 0, 1);
    }
    ctx.restore();
  }

  function drawZone(zone) {
    const pct = clamp(zone.life / zone.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.12 + pct * 0.2;
    ctx.fillStyle = zone.color;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius * (1 + Math.sin(zone.pulse * 8) * 0.03), 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawSentry(sentry) {
    ctx.save();
    ctx.translate(sentry.x, sentry.y);
    ctx.fillStyle = sentry.color;
    if (sentry.drone) {
      ctx.beginPath();
      ctx.arc(0, 0, 16 + Math.sin(state.battle.time * 8) * 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#10151f";
      ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AI", 0, 4);
    } else {
      roundRect(-18, -16, 36, 32, 6);
      ctx.fill();
      ctx.fillStyle = "#10151f";
      ctx.fillRect(-4, -25, 8, 18);
    }
    ctx.restore();
  }

  function drawPickup(pickup) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.fillStyle = pickup.color;
    ctx.beginPath();
    ctx.arc(0, 0, 13 + Math.sin(state.battle.time * 9) * 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#10151f";
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pickup.kind === "heart" ? "+" : "U", 0, 1);
    ctx.restore();
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2.4, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawText(text) {
    ctx.save();
    ctx.globalAlpha = clamp(text.life, 0, 1);
    ctx.font = text.big ? "950 22px sans-serif" : "900 16px sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#10151f";
    ctx.fillStyle = text.color;
    ctx.strokeText(text.text, text.x, text.y);
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }

  function burst(x, y, color, count, speed) {
    const battle = state.battle;
    if (!battle) return;
    for (let i = 0; i < count; i += 1) {
      const a = rand(0, TAU);
      const s = rand(speed * 0.25, speed);
      battle.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, size: rand(2.5, 6), life: rand(0.25, 0.7) });
    }
  }

  function trail(x1, y1, x2, y2, color) {
    const steps = 12;
    for (let i = 0; i < steps; i += 1) {
      const t = i / (steps - 1);
      burst(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, color, 2, 80);
    }
  }

  function floatingText(x, y, text, color, life) {
    state.battle.texts.push({ x, y, text, color, life: life || 1, big: String(text).length < 18 });
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  function setPadVector(clientX, clientY) {
    const rect = movePad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.34;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const mag = Math.min(max, Math.hypot(dx, dy));
    const dir = normalize(dx, dy);
    state.input.touch.x = Math.abs(dx) < 4 && Math.abs(dy) < 4 ? 0 : (dir.x * mag) / max;
    state.input.touch.y = Math.abs(dx) < 4 && Math.abs(dy) < 4 ? 0 : (dir.y * mag) / max;
    moveKnob.style.transform = `translate3d(${dir.x * mag}px, ${dir.y * mag}px, 0)`;
  }

  function resetPad() {
    state.input.activePadPointer = null;
    state.input.touch.x = 0;
    state.input.touch.y = 0;
    moveKnob.style.transform = "translate3d(0, 0, 0)";
  }

  function pauseGame() {
    if (state.screen !== "battle" || !state.battle || state.battle.complete || state.battle.lost) return;
    state.battle.paused = true;
    menuLayer.hidden = false;
    menuLayer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card">
          <h2>Paused</h2>
          <p>${escapeHtml(state.battle.mission.joke)}</p>
          <div class="modal-actions">
            <button id="resumeBtn" class="primary-button" type="button">Resume</button>
            <button id="restartBtn" class="ghost-button" type="button">Restart</button>
            <button id="campaignBtn" class="ghost-button" type="button">Campaign</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("resumeBtn").addEventListener("click", () => {
      state.battle.paused = false;
      menuLayer.hidden = true;
    });
    document.getElementById("restartBtn").addEventListener("click", () => startMission(state.battle.mission.level));
    document.getElementById("campaignBtn").addEventListener("click", renderCampaign);
  }

  movePad.addEventListener("pointerdown", (event) => {
    state.input.activePadPointer = event.pointerId;
    movePad.setPointerCapture(event.pointerId);
    setPadVector(event.clientX, event.clientY);
  });
  movePad.addEventListener("pointermove", (event) => {
    if (event.pointerId === state.input.activePadPointer) setPadVector(event.clientX, event.clientY);
  });
  movePad.addEventListener("pointerup", resetPad);
  movePad.addEventListener("pointercancel", resetPad);
  movePad.addEventListener("lostpointercapture", resetPad);

  attackButton.addEventListener("pointerdown", () => {
    ensureAudio();
    state.input.attackHeld = true;
    if (state.screen === "battle") tryBasic(activeHero());
  });
  attackButton.addEventListener("pointerup", () => { state.input.attackHeld = false; });
  attackButton.addEventListener("pointercancel", () => { state.input.attackHeld = false; });
  ultButton.addEventListener("pointerdown", () => {
    ensureAudio();
    if (state.screen === "battle") tryUltimate();
  });
  swapButton.addEventListener("pointerdown", () => {
    ensureAudio();
    swapHero();
  });
  pauseButton.addEventListener("click", pauseGame);

  window.addEventListener("keydown", (event) => {
    state.input.keys.add(event.code);
    if (["Space", "KeyQ", "KeyE", "Escape"].includes(event.code)) event.preventDefault();
    if (state.screen === "battle") {
      ensureAudio();
      if (event.code === "Space") tryBasic(activeHero());
      if (event.code === "KeyQ") tryUltimate();
      if (event.code === "KeyE") swapHero();
      if (event.code === "Escape") pauseGame();
    }
  });
  window.addEventListener("keyup", (event) => {
    state.input.keys.delete(event.code);
  });
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  window.addEventListener("pointerdown", ensureAudio, { once: true });

  function frame(now) {
    const dt = Math.min(0.033, (now - state.lastFrame) / 1000 || 0.016);
    state.lastFrame = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  state.save = loadSave();
  state.audio.enabled = state.save.sound;
  resize();
  if (new URLSearchParams(window.location.search).has("autoplay")) {
    startMission(1);
  } else {
    renderTitle();
  }
  requestAnimationFrame(frame);
})();
