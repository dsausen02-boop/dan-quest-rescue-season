import { CHARACTERS, MISSIONS } from "./gameData.js";

export const STORAGE_KEY = "danQuestDarkTimesSaveV2";
const OLD_STORAGE_KEY = "danQuestDarkTimesSaveV1";

export function defaultSave() {
  return {
    version: 2,
    highestLevel: 1,
    completed: {},
    unlocked: ["mendel"],
    party: ["mendel"],
    upgrades: {},
    skins: {},
    voicePacks: {},
    comboBonuses: {},
    sparks: 0,
    wins: 0,
    sound: true,
    reducedMotion: false
  };
}

export function normalizeSave(raw) {
  const save = { ...defaultSave(), ...(raw || {}) };
  save.completed = save.completed || {};
  save.upgrades = save.upgrades || {};
  save.skins = save.skins || {};
  save.voicePacks = save.voicePacks || {};
  save.comboBonuses = save.comboBonuses || {};
  save.unlocked = Array.isArray(save.unlocked) ? [...new Set(save.unlocked)] : ["mendel"];
  if (!save.unlocked.includes("mendel")) save.unlocked.unshift("mendel");
  const validIds = new Set(CHARACTERS.map((hero) => hero.id));
  save.unlocked = save.unlocked.filter((id) => validIds.has(id));
  save.party = Array.isArray(save.party) ? save.party.filter((id) => save.unlocked.includes(id)).slice(0, 3) : ["mendel"];
  if (!save.party.length) save.party = ["mendel"];
  save.sparks = Number.isFinite(save.sparks) ? save.sparks : 0;
  save.highestLevel = Math.max(1, Math.min(MISSIONS.length, Number(save.highestLevel) || 1));
  save.version = 2;
  return save;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return defaultSave();
    return normalizeSave(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function writeSave(save) {
  const normalized = normalizeSave(save);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(OLD_STORAGE_KEY);
}
