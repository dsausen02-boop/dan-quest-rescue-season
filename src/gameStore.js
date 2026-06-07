import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHARACTERS, CHARACTER_BY_ID, MISSIONS, upgradeCost } from "./gameData.js";

export const STATES = {
  MENU: "MENU",
  CHARACTER_SELECT: "CHARACTER_SELECT",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY",
  UPGRADES: "UPGRADES",
  SETTINGS: "SETTINGS",
  WORLD_GALLERY: "WORLD_GALLERY",
  CHARACTER_DEBUG: "CHARACTER_DEBUG",
  DEV_MENU: "DEV_MENU"
};

const validHeroIds = new Set(CHARACTERS.map((hero) => hero.id));

function defaultSave() {
  return {
    version: 4,
    highestLevel: 1,
    completed: {},
    unlocked: ["tal"],
    party: ["tal"],
    selectedHero: "tal",
    upgrades: {},
    sparks: 0,
    wins: 0,
    audio: {
      master: 0.86,
      music: 0.42,
      sfx: 0.78,
      voice: 0.88,
      muted: false,
      muteVoices: false
    },
    visualDensity: "medium",
    graphics: {
      resolutionScale: 100,
      antiAliasing: "off",
      motionBlur: false,
      shadows: false,
      particlesQuality: "medium"
    }
  };
}

function normalizeSave(raw) {
  const base = defaultSave();
  const save = { ...base, ...(raw || {}) };
  save.completed = save.completed || {};
  save.upgrades = save.upgrades || {};
  save.audio = { ...base.audio, ...(save.audio || {}) };
  save.visualDensity = ["low", "medium", "high"].includes(save.visualDensity) ? save.visualDensity : "medium";
  save.graphics = { ...base.graphics, ...(save.graphics || {}) };
  save.graphics.resolutionScale = [75, 100, 125].includes(Number(save.graphics.resolutionScale)) ? Number(save.graphics.resolutionScale) : 100;
  save.graphics.antiAliasing = ["off", "low", "medium", "high"].includes(save.graphics.antiAliasing) ? save.graphics.antiAliasing : "off";
  save.graphics.motionBlur = !!save.graphics.motionBlur;
  save.graphics.shadows = save.graphics.shadows === true;
  save.graphics.particlesQuality = ["low", "medium", "high"].includes(save.graphics.particlesQuality) ? save.graphics.particlesQuality : "medium";
  save.unlocked = Array.isArray(save.unlocked) ? [...new Set(save.unlocked)].filter((id) => validHeroIds.has(id)) : ["tal"];
  if (!save.unlocked.includes("tal")) save.unlocked.unshift("tal");
  save.highestLevel = Math.max(1, Math.min(MISSIONS.length, Number(save.highestLevel) || 1));
  MISSIONS.filter((mission) => mission.season === 1 && mission.level <= save.highestLevel && mission.focusHero).forEach((mission) => {
    if (validHeroIds.has(mission.focusHero) && !save.unlocked.includes(mission.focusHero)) save.unlocked.push(mission.focusHero);
  });
  save.party = Array.isArray(save.party) ? save.party.filter((id) => save.unlocked.includes(id)).slice(0, 3) : ["tal"];
  if (!save.party.length) save.party = ["tal"];
  save.selectedHero = validHeroIds.has(save.selectedHero) && save.unlocked.includes(save.selectedHero) ? save.selectedHero : save.party[0];
  save.sparks = Number.isFinite(save.sparks) ? save.sparks : 0;
  save.wins = Number.isFinite(save.wins) ? save.wins : 0;
  save.version = 4;
  return save;
}

function transitionLog(from, to, reason = "") {
  console.debug(`[DAN QUEST STATE] ${from} -> ${to}${reason ? ` (${reason})` : ""}`);
}

function debugState(message, details = {}) {
  console.debug(`[DAN QUEST STATE] ${message}`, details);
}

function boundedLevel(level, save) {
  return Math.max(1, Math.min(MISSIONS.length, Math.min(save.highestLevel, Number(level) || save.highestLevel)));
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      mode: STATES.MENU,
      activeLevel: 1,
      runId: 0,
      lastResult: null,
      save: defaultSave(),
      transition(to, reason) {
        set((state) => {
          if (state.mode !== to) transitionLog(state.mode, to, reason);
          return { mode: to };
        });
      },
      startRun(level) {
        const save = normalizeSave(get().save);
        delete save.debugHeroOverride;
        delete save.debugLevelOverride;
        const bounded = boundedLevel(level, save);
        transitionLog(get().mode, STATES.PLAYING, `level ${bounded}`);
        debugState("entered PLAYING", { level: bounded, runId: get().runId + 1 });
        set((state) => ({ mode: STATES.PLAYING, activeLevel: bounded, runId: state.runId + 1, lastResult: null, save }));
      },
      startDebugRun(level, heroId) {
        const save = normalizeSave(get().save);
        const bounded = Math.max(1, Math.min(MISSIONS.length, Number(level) || 1));
        const hero = validHeroIds.has(heroId) ? heroId : (MISSIONS.find((mission) => mission.level === bounded)?.focusHero || save.selectedHero);
        save.highestLevel = MISSIONS.length;
        save.unlocked = CHARACTERS.map((item) => item.id);
        save.selectedHero = hero;
        save.party = [hero];
        save.debugHeroOverride = hero;
        save.debugLevelOverride = bounded;
        transitionLog(get().mode, STATES.PLAYING, `dev level ${bounded}`);
        debugState("entered PLAYING", { level: bounded, hero, runId: get().runId + 1, dev: true });
        set((state) => ({ mode: STATES.PLAYING, activeLevel: bounded, runId: state.runId + 1, lastResult: null, save }));
      },
      retryLevel() {
        const save = normalizeSave(get().save);
        const level = boundedLevel(get().activeLevel, save);
        debugState("retry level", { level, runId: get().runId + 1 });
        debugState("entered PLAYING", { level, runId: get().runId + 1 });
        set((state) => ({ mode: STATES.PLAYING, activeLevel: level, runId: state.runId + 1, lastResult: null, save }));
      },
      continueLevel() {
        const save = normalizeSave(get().save);
        const nextLevel = boundedLevel(get().activeLevel + 1, save);
        debugState("continue level", { from: get().activeLevel, to: nextLevel, runId: get().runId + 1 });
        debugState("entered PLAYING", { level: nextLevel, runId: get().runId + 1 });
        set((state) => ({ mode: STATES.PLAYING, activeLevel: nextLevel, runId: state.runId + 1, lastResult: null, save }));
      },
      returnToMenu(reason = "menu") {
        debugState("returned to menu", { reason });
        set({ mode: STATES.MENU, lastResult: null });
      },
      openCharacterSelect(reason = "character select") {
        transitionLog(get().mode, STATES.CHARACTER_SELECT, reason);
        set({ mode: STATES.CHARACTER_SELECT, lastResult: null });
      },
      openUpgrades(reason = "upgrades") {
        transitionLog(get().mode, STATES.UPGRADES, reason);
        set({ mode: STATES.UPGRADES, lastResult: null });
      },
      pauseRun() {
        get().transition(STATES.PAUSED, "pause");
      },
      resumeRun() {
        get().transition(STATES.PLAYING, "resume");
      },
      gameOver(payload = {}) {
        transitionLog(get().mode, STATES.GAME_OVER, "defeat");
        debugState("entered GAME_OVER", { level: get().activeLevel, ...payload });
        set({ mode: STATES.GAME_OVER, lastResult: { win: false, ...payload } });
      },
      completeRun(payload = {}) {
        const mission = MISSIONS.find((item) => item.level === get().activeLevel) || MISSIONS[0];
        const save = normalizeSave(get().save);
        const firstTime = !save.completed[mission.level];
        const rewards = [];
        const unlocks = [];
        const sparks = mission.reward + (firstTime ? Math.ceil(mission.level / 2) : Math.max(2, Math.floor(mission.reward / 2)));
        save.sparks += sparks;
        save.completed[mission.level] = true;
        save.highestLevel = Math.max(save.highestLevel, Math.min(MISSIONS.length, mission.level + 1));
        save.wins += 1;
        rewards.push(`${sparks} resistance sparks`);
        if (firstTime) {
          if (mission.rescue && CHARACTER_BY_ID[mission.rescue]) {
            rewards.push(`${CHARACTER_BY_ID[mission.rescue].name} rescued from ${mission.title}`);
          }
          [mission.unlock, mission.bonusUnlock, ...(mission.bonusUnlocks || [])].filter(Boolean).forEach((id) => {
            if (!save.unlocked.includes(id)) {
              save.unlocked.push(id);
              unlocks.push(id);
              rewards.push(`${CHARACTER_BY_ID[id].name} joined the resistance`);
            }
          });
        }
        if (mission.unlockAfterWin && !save.unlocked.includes(mission.unlockAfterWin)) {
          save.unlocked.push(mission.unlockAfterWin);
          unlocks.push(mission.unlockAfterWin);
          rewards.push(`${CHARACTER_BY_ID[mission.unlockAfterWin].name} joined the resistance`);
        }
        if (mission.final) rewards.push("Season 1 reunion complete");
        const normalized = normalizeSave(save);
        transitionLog(get().mode, STATES.VICTORY, "victory");
        debugState("entered VICTORY", { level: mission.level, unlocks, rewards });
        set({ mode: STATES.VICTORY, save: normalized, lastResult: { win: true, mission, rewards, unlocks, ...payload } });
      },
      selectHero(id) {
        const save = normalizeSave(get().save);
        if (!save.unlocked.includes(id)) return;
        save.selectedHero = id;
        set({ save });
      },
      toggleParty(id) {
        const save = normalizeSave(get().save);
        if (!save.unlocked.includes(id)) return;
        if (save.party.includes(id)) {
          if (save.party.length <= 1) return;
          save.party = save.party.filter((heroId) => heroId !== id);
        } else if (save.party.length < 3) {
          save.party.push(id);
        } else {
          save.party = [save.party[1], save.party[2], id];
        }
        if (!save.party.includes(save.selectedHero)) save.selectedHero = save.party[0];
        set({ save: normalizeSave(save) });
      },
      buyUpgrade(id, branch) {
        const save = normalizeSave(get().save);
        if (!save.unlocked.includes(id)) return;
        const current = save.upgrades[id] || { health: 0, attack: 0, ultimate: 0 };
        const rank = current[branch] || 0;
        const cost = upgradeCost(rank);
        if (rank >= 5 || save.sparks < cost) return;
        save.sparks -= cost;
        save.upgrades[id] = { ...current, [branch]: rank + 1 };
        set({ save: normalizeSave(save) });
      },
      setAudio(partial) {
        const save = normalizeSave(get().save);
        save.audio = { ...save.audio, ...partial };
        set({ save });
      },
      setVisualDensity(visualDensity) {
        const save = normalizeSave(get().save);
        save.visualDensity = ["low", "medium", "high"].includes(visualDensity) ? visualDensity : "medium";
        set({ save });
      },
      setGraphics(partial) {
        const save = normalizeSave(get().save);
        save.graphics = { ...save.graphics, ...(partial || {}) };
        set({ save: normalizeSave(save) });
      },
      resetSave() {
        transitionLog(get().mode, STATES.MENU, "reset save");
        debugState("returned to menu", { reason: "reset save" });
        set({ mode: STATES.MENU, activeLevel: 1, runId: 0, lastResult: null, save: defaultSave() });
      }
    }),
    {
      name: "danQuestArenaSaveV3",
      partialize: (state) => ({ save: normalizeSave(state.save), activeLevel: state.activeLevel }),
      merge: (persisted, current) => ({ ...current, ...(persisted || {}), save: normalizeSave(persisted?.save) })
    }
  )
);
