import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, ContactShadows, Environment, Float, Html, Sparkles as DreiSparkles, Text as DreiText, useTexture } from "@react-three/drei";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { getProject } from "@theatre/core";
import { gsap } from "gsap";
import * as THREE from "three";
import {
  CheckCircle,
  ChevronRight,
  Crown,
  Eye,
  Gamepad2,
  Home,
  Lock,
  Map,
  Medal,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Users,
  Volume2,
  VolumeX,
  WandSparkles,
  Zap
} from "lucide-react";
import { CHARACTERS, CHARACTER_BY_ID, COMBOS, ENEMIES, GAME_TITLE, KASHI_ART, MAP_THEMES, MISSIONS, activeCombos, computeHeroStats, difficultyForLevel, upgradeCost } from "./gameData.js";
import { COMBO_VOICES, playCue, setAudioLevels, speakLine, startMusic, stopAllAudio, testVoiceLine } from "./arenaAudio.js";
import { STATES, useGameStore } from "./gameStore.js";
import "./styles.css";

const theatreProject = getProject("DAN QUEST Arena Cinematics", {
  state: { sheetsById: {}, definitionVersion: "0.4.0", revisionHistory: [] }
});
const theatreSheet = theatreProject.sheet("Rescue Season");
const theatreCueNames = new Set();
const ARENA = 17;
const ARENA_HALF = ARENA / 2;
const KASHI_POSITIONS = [
  { x: 5.8, z: 0 },
  { x: 3.4, z: 4.8 },
  { x: 3.4, z: -4.8 },
  { x: 6.4, z: 2.4 },
  { x: 6.4, z: -2.4 }
];
const DAD_LIFE_POSITIONS = [
  { x: 4.85, z: 0 },
  { x: 3.05, z: 3.95 },
  { x: 3.05, z: -3.95 },
  { x: 5.15, z: 2.2 },
  { x: 5.15, z: -2.2 }
];
const MAX_ALLIED_SUMMONS = 6;
const MAX_ENEMY_SUMMONS = 10;
const MAX_PROJECTILES = 40;
const MAX_PARTICLES = 12;
const DEFAULT_QUALITY = "medium";
const DEFAULT_GRAPHICS = {
  resolutionScale: 100,
  antiAliasing: "off",
  motionBlur: false,
  shadows: false,
  particlesQuality: "medium"
};
const RESOLUTION_OPTIONS = [75, 100, 125];
const AA_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" }
];
const PARTICLE_OPTIONS = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" }
];
const PARTICLE_QUALITY = {
  low: { count: 0.62, sparkles: 0.58, cap: 0.72 },
  medium: { count: 1, sparkles: 1, cap: 1 },
  high: { count: 1.28, sparkles: 1.18, cap: 1.22 }
};
const RENDER_SCALE_BY_RESOLUTION = {
  75: 0.75,
  100: 1,
  125: 1.25
};
const INSPECTION_SCALE_BY_RESOLUTION = {
  75: 0.75,
  100: 1,
  125: 1.25
};
const SceneQualityContext = React.createContext(DEFAULT_QUALITY);

function Text({ essential = false, ...props }) {
  const density = React.useContext(SceneQualityContext);
  if (density === "low" && !essential) return null;
  return <DreiText {...props} />;
}
const POOL_LIMITS = {
  projectiles: 90,
  particles: 48,
  damage: 36,
  enemies: 26,
  summons: 18,
  telegraphs: 28
};
const SUMMON_CAPS = {
  monkey: 6,
  rabbi: 4,
  presentation: 4,
  consultant: 4,
  discount: 6,
  rider: 4,
  cleaner: 4,
  soccer: 5,
  drone: 5,
  mechanic: 4,
  investor: 4,
  agig: 4,
  reserve: 4,
  guardian: 3,
  sleeper: 4,
  bedouinWarrior: 5,
  grapeArmy: 10
};
const VISUAL_DENSITY = {
  low: {
    label: "Low",
    maxParticles: 8,
    maxTelegraphs: 8,
    particleScale: 0.62,
    particleCount: 0.38,
    trapSparkles: 0.42,
    ambientSparkles: 0.28,
    projectileTtl: 0.74,
    projectileRate: 1.34,
    enemyPattern: 0.58,
    effectTtl: 0.7,
    summonTtl: 0.58,
    cameraPressure: 1,
    propBudget: 0.42,
    enemyCap: 5,
    alliedSummonCap: 3,
    projectileCap: 24,
    shadows: false,
    contactShadows: false,
    dpr: [0.25, 0.35],
    lightScale: 0.78
  },
  medium: {
    label: "Medium",
    maxParticles: 8,
    maxTelegraphs: 8,
    particleScale: 0.72,
    particleCount: 0.44,
    trapSparkles: 0.5,
    ambientSparkles: 0.34,
    projectileTtl: 0.82,
    projectileRate: 1.24,
    enemyPattern: 0.68,
    effectTtl: 0.76,
    summonTtl: 0.66,
    cameraPressure: 0.82,
    propBudget: 1,
    enemyCap: 6,
    alliedSummonCap: 4,
    projectileCap: 28,
    shadows: false,
    contactShadows: false,
    dpr: [1, 1],
    lightScale: 0.92
  },
  high: {
    label: "High",
    maxParticles: 14,
    maxTelegraphs: 18,
    particleScale: 1,
    particleCount: 0.84,
    trapSparkles: 1,
    ambientSparkles: 0.82,
    projectileTtl: 1,
    projectileRate: 1,
    enemyPattern: 1,
    effectTtl: 1,
    summonTtl: 0.86,
    cameraPressure: 0.64,
    propBudget: 1,
    enemyCap: 10,
    alliedSummonCap: 6,
    projectileCap: 40,
    shadows: true,
    contactShadows: true,
    dpr: [1, 1.6],
    lightScale: 1
  }
};
const COMPANION_FORMATION = [
  { x: -2.75, z: 2.05 },
  { x: -2.75, z: -2.05 }
];

const HERO_SYMBOLS = {
  mendel: "BN",
  goodman: "XL",
  giat: "LC",
  farber: "WR",
  aviad: "AR",
  david: "AI",
  amichai: "KO",
  halel: "PR",
  hadar: "YT",
  tal: "BK",
  amit: "SC",
  gelman: "$",
  kuzar: "%",
  bruiner: "Z",
  dan: "*"
};

const KASHI_DEBUG_CHARACTER = {
  id: "kashi",
  name: "Kashi",
  initials: "KA",
  color: "#8e44ad",
  image: KASHI_ART,
  role: "Final Boss",
  type: "kashi"
};

const DAD_KINGDOM_ENEMY_TYPES = new Set([
  "diaperTrooper",
  "babyBottleMage",
  "shoppingCartCharger",
  "lowCostCollector",
  "reserveSoldier",
  "alarmClockSoldier",
  "couponKing",
  "strollerTitan",
  "reserveCommander",
  "milkCartonTitan"
]);

const WORLD_QUALITY_KITS = {
  presentationEmpire: {
    ambient: ["meeting buzz", "projector hum", "paper rustle"],
    districts: [
      [-4.9, -5.1, 6.8, 6.0, "#ff8f52", 0.34, "SLIDE SUBURB"],
      [4.9, -5.0, 6.8, 6.0, "#596276", 0.4, "MEETING MAZE"],
      [-4.9, 4.9, 6.8, 6.2, "#e8d8ad", 0.3, "PAPERWORK CANYON"],
      [4.9, 4.9, 6.8, 6.2, "#6f8ea8", 0.38, "ARGUMENT HALL"]
    ],
    landmarks: [
      ["tower", -6.3, -5.4, 1.2, "FINAL SLIDE TOWER", "#ff8f52", "#fff1a8", 0],
      ["table", 4.8, -5.25, 1.15, "ENDLESS MEETING", "#596276", "#e8d8ad", 0.35],
      ["stack", -5.9, 4.7, 1.15, "PAPER MOUNTAIN", "#f8f3df", "#ff8f52", -0.2],
      ["podium", 5.8, 4.7, 1.15, "TAL'S PODIUM", "#6f8ea8", "#fff1a8", -0.3]
    ],
    props: [
      ["screen", -2.4, -6.7, 0.8, "Q4", "#ff8f52", "#fff1a8", 0.2],
      ["stack", -7.3, -2.4, 0.72, "NOTES", "#f8f3df", "#e8d8ad", 0],
      ["table", 2.4, -7.2, 0.75, "SYNC", "#3b4561", "#f8f3df", -0.15],
      ["podium", 7.2, -2.55, 0.72, "AGENDA", "#596276", "#ff8f52", 0.12],
      ["sign", -2.4, 3.2, 0.78, "DUE TODAY", "#e8d8ad", "#ff8f52", 0.2],
      ["screen", 2.6, 2.9, 0.74, "SLIDE 47", "#ff8f52", "#10151f", -0.4],
      ["stack", -7.2, 7.0, 0.8, "REPORTS", "#f8f3df", "#6f8ea8", 0.1],
      ["tower", 7.4, 7.0, 0.72, "LASER", "#596276", "#fff1a8", 0.25]
    ]
  },
  bedouinDesert: {
    ambient: ["wind over dunes", "monkeys yelling", "distant drums"],
    districts: [
      [-4.9, -5.1, 6.9, 6.2, "#d9a45f", 0.46, "DUNE CAMP"],
      [4.9, -5.1, 6.9, 6.2, "#9b6a3f", 0.36, "MONKEY RIDGE"],
      [-4.9, 4.9, 6.9, 6.2, "#f5c451", 0.34, "BANANA OASIS"],
      [4.9, 4.9, 6.9, 6.2, "#8b5a36", 0.4, "ROYAL TENT"]
    ],
    landmarks: [
      ["tent", -6.2, -5.35, 1.25, "BEDOUIN CAMP", "#d9a45f", "#f8f3df", 0.2],
      ["soft", 5.5, -5.4, 1.2, "MONKEY TOTEM", "#9b6a3f", "#f5c451", -0.15],
      ["portal", -5.6, 4.85, 1.05, "BANANA OASIS", "#f5c451", "#58c7a6", 0],
      ["tower", 5.9, 5.35, 1.1, "ROYAL TENT", "#8b5a36", "#fff1a8", 0.35]
    ],
    props: [
      ["soft", -2.8, -6.8, 0.85, "DUNE", "#d9a45f", "#f8f3df", 0.2],
      ["tent", -7.5, -2.7, 0.72, "CAMP", "#c97848", "#f8f3df", -0.1],
      ["tower", 2.4, -6.4, 0.72, "PALM", "#3d7a37", "#6a3f1d", 0],
      ["soft", 7.1, -2.9, 0.78, "MONKEY", "#9b6a3f", "#f5c451", 0.1],
      ["stack", -2.7, 3.2, 0.74, "BANANAS", "#f5c451", "#58c7a6", 0],
      ["sign", -7.3, 6.8, 0.7, "I FOUND YOU", "#f8f3df", "#ee6656", 0.2],
      ["tent", 2.8, 3.2, 0.78, "GUARD", "#d9a45f", "#10151f", -0.2],
      ["soft", 7.35, 7.0, 0.82, "DUNE", "#d9a45f", "#fff1a8", 0.1]
    ]
  },
  casinoKingdom: {
    ambient: ["slot machine bells", "soccer whistle", "card shuffle"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#305f46", 0.42, "POKER TABLES"],
      [4.9, -5.0, 6.8, 6.1, "#f5c451", 0.34, "CHIP VAULT"],
      [-4.9, 4.9, 6.8, 6.2, "#ee6656", 0.32, "BAD ODDS ROW"],
      [4.9, 4.9, 6.8, 6.2, "#4fb46f", 0.36, "SOCCER SCREEN"]
    ],
    landmarks: [
      ["table", -5.8, -5.25, 1.2, "FINAL TABLE", "#305f46", "#f5c451", 0.25],
      ["stack", 5.6, -5.35, 1.25, "CHIP TOWER", "#f5c451", "#ee6656", -0.15],
      ["machine", -5.6, 4.7, 1.1, "SLOT WALL", "#ee6656", "#fff1a8", 0.25],
      ["goal", 5.75, 5.15, 1.2, "SOCCER WAKES HIM", "#4fb46f", "#f8f3df", -0.2]
    ],
    props: [
      ["table", -2.4, -6.8, 0.78, "21", "#305f46", "#f5c451", 0.15],
      ["stack", -7.2, -2.8, 0.72, "CHIPS", "#f5c451", "#ee6656", 0],
      ["machine", 2.3, -6.8, 0.72, "777", "#ee6656", "#fff1a8", 0.1],
      ["sign", 7.25, -2.7, 0.76, "ALL IN", "#f5c451", "#10151f", -0.12],
      ["screen", -2.5, 3.2, 0.74, "MATCH", "#4fb46f", "#f8f3df", 0.15],
      ["stack", -7.25, 7.0, 0.72, "CARDS", "#f8f3df", "#ee6656", 0.25],
      ["goal", 2.7, 3.25, 0.68, "GOAL", "#4fb46f", "#f8f3df", 0],
      ["table", 7.2, 7.1, 0.75, "ODDS", "#305f46", "#f5c451", -0.25]
    ]
  },
  momsKingdom: {
    ambient: ["washing machine spin", "window squeak", "errand list"],
    districts: [
      [-4.9, -5.1, 6.8, 6.1, "#ff9fc0", 0.35, "CHORE LANE"],
      [4.9, -5.1, 6.8, 6.1, "#d8f3ff", 0.34, "WINDOW PLAZA"],
      [-4.9, 4.9, 6.8, 6.2, "#f8f3df", 0.32, "LAUNDRY LOOP"],
      [4.9, 4.9, 6.8, 6.2, "#c97848", 0.34, "ERRAND ROUTE"]
    ],
    landmarks: [
      ["machine", -5.8, -5.2, 1.2, "WASHING MACHINE", "#d8f3ff", "#ff9fc0", 0.15],
      ["screen", 5.65, -5.15, 1.12, "WINDOW WALL", "#8bd6ff", "#f8f3df", -0.1],
      ["stack", -5.9, 4.85, 1.15, "LAUNDRY PILE", "#f8f3df", "#ff9fc0", 0.2],
      ["sign", 5.95, 5.1, 1.1, "ERRANDS", "#c97848", "#fff1a8", -0.15]
    ],
    props: [
      ["machine", -2.5, -6.75, 0.72, "SPIN", "#d8f3ff", "#ff9fc0", 0],
      ["stack", -7.25, -2.65, 0.72, "TOWELS", "#f8f3df", "#8bd6ff", 0.15],
      ["screen", 2.45, -6.8, 0.76, "CLEAN", "#8bd6ff", "#f8f3df", -0.2],
      ["sign", 7.3, -2.9, 0.7, "MOP", "#ff9fc0", "#10151f", 0.1],
      ["stack", -2.6, 3.2, 0.74, "BASKET", "#c97848", "#f8f3df", 0],
      ["machine", -7.2, 7.0, 0.7, "RINSE", "#d8f3ff", "#ff9fc0", 0.2],
      ["screen", 2.7, 3.2, 0.68, "WINDOW", "#8bd6ff", "#f8f3df", -0.1],
      ["table", 7.2, 7.0, 0.72, "LIST", "#f8f3df", "#c97848", 0.25]
    ]
  },
  dateDimension: {
    ambient: ["calendar alerts", "cafe chatter", "awkward silence"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#d8a5ff", 0.33, "SMALL TALK CAFE"],
      [4.9, -5.0, 6.8, 6.1, "#8ba3ff", 0.35, "CALENDAR GATE"],
      [-4.9, 4.9, 6.8, 6.2, "#ff9fc0", 0.3, "FAMILY QUESTIONS"],
      [4.9, 4.9, 6.8, 6.2, "#e8d8ad", 0.32, "RABBI CORNER"]
    ],
    landmarks: [
      ["table", -5.75, -5.2, 1.14, "AWKWARD CAFE", "#d8a5ff", "#fff1a8", 0.25],
      ["arch", 5.75, -5.1, 1.15, "CALENDAR PORTAL", "#8ba3ff", "#d8f3ff", -0.1],
      ["portal", -5.85, 4.9, 1.1, "HEART LOOP", "#ff9fc0", "#fff1a8", 0.15],
      ["podium", 5.95, 5.0, 1.05, "CALM DOWN", "#e8d8ad", "#8ba3ff", -0.15]
    ],
    props: [
      ["table", -2.5, -6.8, 0.72, "COFFEE", "#d8a5ff", "#fff1a8", 0],
      ["sign", -7.2, -2.6, 0.7, "8:30", "#8ba3ff", "#d8f3ff", 0.15],
      ["arch", 2.5, -6.8, 0.72, "REMINDER", "#8ba3ff", "#f8f3df", -0.1],
      ["portal", 7.2, -2.8, 0.72, "DATE?", "#ff9fc0", "#fff1a8", 0.12],
      ["stack", -2.6, 3.2, 0.72, "QUESTIONS", "#f8f3df", "#d8a5ff", 0],
      ["table", -7.25, 7.0, 0.72, "DINNER", "#d8a5ff", "#fff1a8", 0.2],
      ["podium", 2.7, 3.2, 0.7, "ENOUGH", "#e8d8ad", "#8ba3ff", -0.15],
      ["sign", 7.2, 7.0, 0.72, "OPTION 12", "#ff9fc0", "#10151f", 0.2]
    ]
  },
  partyDimension: {
    ambient: ["bass thump", "camera flash", "guest list panic"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#9b78de", 0.38, "DANCE FLOOR"],
      [4.9, -5.0, 6.8, 6.1, "#ff9fc0", 0.32, "VIP LINE"],
      [-4.9, 4.9, 6.8, 6.2, "#55b8dc", 0.3, "STORY POST"],
      [4.9, 4.9, 6.8, 6.2, "#281b4d", 0.42, "AFTER PARTY"]
    ],
    landmarks: [
      ["portal", -5.8, -5.2, 1.16, "DANCE FLOOR", "#9b78de", "#ff9fc0", 0.2],
      ["sign", 5.7, -5.2, 1.1, "VIP ONLY", "#ff9fc0", "#10151f", -0.15],
      ["screen", -5.8, 4.9, 1.08, "STORY POST", "#55b8dc", "#f8f3df", 0.15],
      ["tower", 5.9, 5.2, 1.08, "SPEAKER WALL", "#281b4d", "#ff9fc0", -0.25]
    ],
    props: [
      ["portal", -2.6, -6.7, 0.72, "BEAT", "#9b78de", "#ff9fc0", 0],
      ["tower", -7.3, -2.75, 0.74, "BASS", "#281b4d", "#ff9fc0", 0.1],
      ["sign", 2.5, -6.8, 0.7, "LIST", "#ff9fc0", "#10151f", 0.12],
      ["arch", 7.25, -2.8, 0.7, "ROPE", "#9b78de", "#f8f3df", -0.12],
      ["screen", -2.55, 3.25, 0.74, "LIVE", "#55b8dc", "#f8f3df", 0.15],
      ["tower", -7.25, 7.0, 0.7, "FLASH", "#f5c451", "#10151f", 0.2],
      ["table", 2.65, 3.2, 0.72, "VIP", "#9b78de", "#ff9fc0", -0.1],
      ["portal", 7.25, 7.0, 0.7, "AFTER", "#281b4d", "#ff9fc0", 0.15]
    ]
  },
  aiNexus: {
    ambient: ["server fans", "prompt accepted", "drone motors"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#85d6ff", 0.28, "PROMPT GRID"],
      [4.9, -5.0, 6.8, 6.1, "#17445c", 0.46, "SERVER AISLE"],
      [-4.9, 4.9, 6.8, 6.2, "#d8f3ff", 0.24, "DRONE PAD"],
      [4.9, 4.9, 6.8, 6.2, "#102b3d", 0.5, "CORE LOOP"]
    ],
    landmarks: [
      ["screen", -5.75, -5.15, 1.12, "PROMPT GRID", "#85d6ff", "#10151f", 0.2],
      ["tower", 5.75, -5.1, 1.18, "SERVER RACK", "#17445c", "#85d6ff", -0.1],
      ["core", -5.75, 4.9, 1.08, "DRONE PAD", "#d8f3ff", "#85d6ff", 0.15],
      ["core", 5.8, 5.0, 1.18, "AI CORE", "#85d6ff", "#d8f3ff", -0.2]
    ],
    props: [
      ["screen", -2.5, -6.8, 0.72, "GPT", "#85d6ff", "#10151f", 0],
      ["tower", -7.3, -2.7, 0.72, "DATA", "#17445c", "#85d6ff", 0.1],
      ["tower", 2.5, -6.8, 0.72, "GPU", "#17445c", "#85d6ff", -0.12],
      ["core", 7.25, -2.8, 0.72, "BOT", "#85d6ff", "#d8f3ff", 0.1],
      ["core", -2.5, 3.2, 0.72, "DRONE", "#d8f3ff", "#85d6ff", 0],
      ["screen", -7.2, 7.0, 0.7, "ERROR", "#ee6656", "#fff1a8", 0.2],
      ["tower", 2.7, 3.2, 0.72, "MODEL", "#17445c", "#85d6ff", -0.15],
      ["portal", 7.2, 7.0, 0.74, "LOOP", "#85d6ff", "#d8f3ff", 0.2]
    ]
  },
  otherFriendGroup: {
    ambient: ["chat pings", "garage tools", "weekend plans"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#c97848", 0.38, "GARAGE ROW"],
      [4.9, -5.0, 6.8, 6.1, "#6f8ea8", 0.34, "NEW CHAT"],
      [-4.9, 4.9, 6.8, 6.2, "#e8d8ad", 0.32, "INVITE PLAZA"],
      [4.9, 4.9, 6.8, 6.2, "#596276", 0.34, "GROUP PHOTO"]
    ],
    landmarks: [
      ["machine", -5.7, -5.2, 1.12, "GARAGE LIFT", "#c97848", "#d7dce3", 0.15],
      ["screen", 5.7, -5.15, 1.08, "NEW CHAT", "#6f8ea8", "#f8f3df", -0.12],
      ["sign", -5.85, 4.95, 1.05, "SECOND INVITE", "#e8d8ad", "#c97848", 0.12],
      ["portal", 5.85, 5.0, 1.05, "GROUP PHOTO", "#596276", "#f8f3df", -0.2]
    ],
    props: [
      ["machine", -2.5, -6.8, 0.74, "WRENCH", "#c97848", "#d7dce3", 0],
      ["stack", -7.25, -2.7, 0.72, "TOOLS", "#8b5a36", "#d7dce3", 0.15],
      ["screen", 2.5, -6.8, 0.72, "PING", "#6f8ea8", "#f8f3df", -0.15],
      ["sign", 7.25, -2.8, 0.72, "JOIN?", "#e8d8ad", "#10151f", 0.12],
      ["table", -2.55, 3.2, 0.72, "PLAN", "#596276", "#e8d8ad", 0],
      ["stack", -7.25, 7.0, 0.7, "SPARES", "#8b5a36", "#c97848", 0.2],
      ["screen", 2.65, 3.2, 0.72, "CHAT", "#6f8ea8", "#f8f3df", -0.1],
      ["portal", 7.25, 7.0, 0.7, "OTHER", "#596276", "#e8d8ad", 0.2]
    ]
  },
  debateRepublic: {
    ambient: ["microphone feedback", "crowd murmurs", "talking points"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#6f8ea8", 0.38, "PODIUM SQUARE"],
      [4.9, -5.0, 6.8, 6.1, "#ff8f52", 0.32, "CROSSFIRE LANE"],
      [-4.9, 4.9, 6.8, 6.2, "#e8d8ad", 0.32, "POLICY STACKS"],
      [4.9, 4.9, 6.8, 6.2, "#29314a", 0.42, "FINAL WORD"]
    ],
    landmarks: [
      ["podium", -5.75, -5.1, 1.14, "DEBATE STAGE", "#6f8ea8", "#fff1a8", 0.2],
      ["arch", 5.75, -5.2, 1.05, "CROSSFIRE", "#ff8f52", "#10151f", -0.15],
      ["stack", -5.85, 4.9, 1.12, "POLICY PILE", "#e8d8ad", "#6f8ea8", 0.1],
      ["podium", 5.95, 5.0, 1.08, "FINAL WORD", "#29314a", "#ff8f52", -0.2]
    ],
    props: [
      ["podium", -2.5, -6.8, 0.72, "POINT", "#6f8ea8", "#fff1a8", 0],
      ["sign", -7.25, -2.7, 0.72, "REBUTTAL", "#ff8f52", "#10151f", 0.15],
      ["screen", 2.5, -6.8, 0.72, "POLL", "#6f8ea8", "#f8f3df", -0.1],
      ["arch", 7.2, -2.8, 0.7, "LOUD", "#ff8f52", "#10151f", 0.12],
      ["stack", -2.6, 3.2, 0.72, "FACTS", "#e8d8ad", "#6f8ea8", 0],
      ["table", -7.25, 7.0, 0.7, "PANEL", "#596276", "#e8d8ad", 0.2],
      ["sign", 2.7, 3.2, 0.72, "NO U", "#ff8f52", "#10151f", -0.15],
      ["podium", 7.25, 7.0, 0.72, "AGAIN", "#29314a", "#ff8f52", 0.2]
    ]
  },
  luxuryKingdom: {
    ambient: ["cash register", "airport lounge", "shopping bags"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#f5c451", 0.34, "BOUTIQUE ROW"],
      [4.9, -5.0, 6.8, 6.1, "#fff1a8", 0.26, "GOLD PLAZA"],
      [-4.9, 4.9, 6.8, 6.2, "#43361d", 0.42, "RECEIPT STREET"],
      [4.9, 4.9, 6.8, 6.2, "#55b8dc", 0.28, "THAILAND GATE"]
    ],
    landmarks: [
      ["market", -5.75, -5.15, 1.15, "BOUTIQUE", "#f5c451", "#10151f", 0.2],
      ["fountain", 5.75, -5.1, 1.08, "GOLD FOUNTAIN", "#fff1a8", "#f5c451", -0.1],
      ["stack", -5.85, 4.85, 1.12, "RECEIPT TOWER", "#f8f3df", "#f5c451", 0.1],
      ["portal", 5.85, 5.05, 1.1, "THAILAND", "#55b8dc", "#fff1a8", -0.2]
    ],
    props: [
      ["market", -2.5, -6.8, 0.72, "SALE", "#f5c451", "#10151f", 0],
      ["stack", -7.25, -2.7, 0.72, "BAGS", "#f5c451", "#fff1a8", 0.15],
      ["fountain", 2.5, -6.8, 0.7, "GOLD", "#fff1a8", "#f5c451", -0.1],
      ["sign", 7.25, -2.8, 0.7, "VIP", "#f5c451", "#10151f", 0.12],
      ["stack", -2.6, 3.2, 0.72, "RECEIPTS", "#f8f3df", "#f5c451", 0],
      ["market", -7.25, 7.0, 0.7, "LUX", "#43361d", "#fff1a8", 0.2],
      ["portal", 2.7, 3.2, 0.72, "FLIGHT", "#55b8dc", "#fff1a8", -0.15],
      ["table", 7.25, 7.0, 0.72, "CHECKOUT", "#f5c451", "#10151f", 0.2]
    ]
  },
  footballMarket: {
    ambient: ["auction bell", "crowd chant", "bargain call"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#68c58a", 0.34, "JERSEY STALLS"],
      [4.9, -5.0, 6.8, 6.1, "#f5c451", 0.34, "AUCTION ROW"],
      [-4.9, 4.9, 6.8, 6.2, "#193f2a", 0.42, "AGIG MARKET"],
      [4.9, 4.9, 6.8, 6.2, "#d8f56f", 0.26, "COLLECTOR VAULT"]
    ],
    landmarks: [
      ["rack", -5.85, -5.2, 1.15, "JERSEY WALL", "#68c58a", "#f8f3df", 0.15],
      ["sign", 5.75, -5.1, 1.1, "AUCTION BOARD", "#f5c451", "#10151f", -0.1],
      ["market", -5.85, 4.9, 1.1, "AGIG MARKET", "#193f2a", "#68c58a", 0.15],
      ["machine", 5.95, 5.0, 1.08, "COLLECTOR VAULT", "#d8f56f", "#10151f", -0.2]
    ],
    props: [
      ["rack", -2.5, -6.8, 0.72, "KIT", "#68c58a", "#f8f3df", 0],
      ["goal", -7.25, -2.7, 0.72, "GOAL", "#68c58a", "#f8f3df", 0.15],
      ["sign", 2.5, -6.8, 0.72, "BID", "#f5c451", "#10151f", -0.1],
      ["stack", 7.25, -2.8, 0.7, "BOOTS", "#8b5a36", "#f8f3df", 0.12],
      ["market", -2.6, 3.2, 0.72, "AGIG", "#193f2a", "#68c58a", 0],
      ["rack", -7.25, 7.0, 0.7, "RARE", "#68c58a", "#f8f3df", 0.2],
      ["machine", 2.7, 3.2, 0.72, "VAULT", "#d8f56f", "#10151f", -0.15],
      ["sign", 7.25, 7.0, 0.72, "FAKE?", "#f5c451", "#10151f", 0.2]
    ]
  },
  comfortKingdom: {
    ambient: ["soft snoring", "blanket rustle", "pillow thump"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#b78cff", 0.34, "COUCH FIELD"],
      [4.9, -5.0, 6.8, 6.1, "#d8a5ff", 0.3, "PILLOW HILLS"],
      [-4.9, 4.9, 6.8, 6.2, "#47396b", 0.42, "BLANKET FORT"],
      [4.9, 4.9, 6.8, 6.2, "#fff1a8", 0.24, "NAP TEMPLE"]
    ],
    landmarks: [
      ["soft", -5.75, -5.2, 1.2, "GIANT COUCH", "#b78cff", "#fff1a8", 0.15],
      ["soft", 5.75, -5.15, 1.15, "PILLOW HILLS", "#d8a5ff", "#fff1a8", -0.1],
      ["arch", -5.8, 4.9, 1.1, "BLANKET FORT", "#47396b", "#d8a5ff", 0.15],
      ["portal", 5.9, 5.0, 1.12, "NAP TEMPLE", "#fff1a8", "#b78cff", -0.2]
    ],
    props: [
      ["soft", -2.5, -6.8, 0.72, "COUCH", "#b78cff", "#fff1a8", 0],
      ["soft", -7.25, -2.7, 0.74, "PILLOW", "#d8a5ff", "#fff1a8", 0.15],
      ["soft", 2.5, -6.8, 0.7, "Z", "#b78cff", "#fff1a8", -0.1],
      ["sign", 7.25, -2.8, 0.7, "5 MIN", "#fff1a8", "#10151f", 0.12],
      ["arch", -2.6, 3.2, 0.72, "BLANKET", "#47396b", "#d8a5ff", 0],
      ["soft", -7.25, 7.0, 0.7, "NAP", "#b78cff", "#fff1a8", 0.2],
      ["portal", 2.7, 3.2, 0.72, "DREAM", "#fff1a8", "#b78cff", -0.15],
      ["table", 7.25, 7.0, 0.7, "SNACK", "#d8a5ff", "#10151f", 0.2]
    ]
  },
  familyKingdom: {
    ambient: ["dinner plates", "family plans", "weekend bells"],
    districts: [
      [-4.9, -5.0, 6.8, 6.1, "#fff1a8", 0.28, "DINNER TABLE"],
      [4.9, -5.0, 6.8, 6.1, "#c97848", 0.34, "HOME STREET"],
      [-4.9, 4.9, 6.8, 6.2, "#8ba3ff", 0.3, "SCHEDULE WALL"],
      [4.9, 4.9, 6.8, 6.2, "#f5c451", 0.32, "WEEKEND PORTAL"]
    ],
    landmarks: [
      ["table", -5.75, -5.15, 1.18, "FAMILY TABLE", "#fff1a8", "#10151f", 0.2],
      ["arch", 5.75, -5.15, 1.1, "HOME ARCH", "#c97848", "#fff1a8", -0.1],
      ["screen", -5.8, 4.95, 1.08, "SCHEDULE WALL", "#8ba3ff", "#f8f3df", 0.15],
      ["portal", 5.9, 5.0, 1.16, "WEEKEND MIRACLE", "#f5c451", "#fff1a8", -0.2]
    ],
    props: [
      ["table", -2.5, -6.8, 0.72, "DINNER", "#fff1a8", "#10151f", 0],
      ["arch", -7.25, -2.7, 0.72, "HOME", "#c97848", "#fff1a8", 0.15],
      ["screen", 2.5, -6.8, 0.72, "PLANS", "#8ba3ff", "#f8f3df", -0.1],
      ["sign", 7.25, -2.8, 0.7, "FAMILY", "#fff1a8", "#10151f", 0.12],
      ["stack", -2.6, 3.2, 0.72, "CHORES", "#f8f3df", "#8ba3ff", 0],
      ["table", -7.25, 7.0, 0.7, "FRIDAY", "#fff1a8", "#10151f", 0.2],
      ["portal", 2.7, 3.2, 0.72, "WEEKEND", "#f5c451", "#fff1a8", -0.15],
      ["screen", 7.25, 7.0, 0.72, "DAN", "#8ba3ff", "#f8f3df", 0.2]
    ]
  }
};

const STYLE_PROJECTILES = {
  banana: { color: "#f5c451", label: "banana", speed: 9.4 },
  spreadsheet: { color: "#e8d8ad", label: "microphone", speed: 8.8 },
  budget: { color: "#68c58a", label: "cart", speed: 8.6 },
  tactical: { color: "#c97848", label: "wrench", speed: 8.4 },
  charge: { color: "#55b8dc", label: "spear", speed: 8.2 },
  ice: { color: "#85d6ff", label: "data", speed: 8.5 },
  punch: { color: "#ff8f52", label: "soccer", speed: 7.2 },
  precision: { color: "#d8a5ff", label: "vip", speed: 10.4 },
  confusion: { color: "#ff9fc0", label: "spray", speed: 8.2 },
  debate: { color: "#ff8f52", label: "slide", speed: 8.3 },
  rabbi: { color: "#8ba3ff", label: "book", speed: 7.9 },
  business: { color: "#f5c451", label: "money", speed: 8.2 },
  agig: { color: "#68c58a", label: "jersey", speed: 8.9 },
  sleep: { color: "#b78cff", label: "pillow", speed: 7.6 },
  blessing: { color: "#fff1a8", label: "energy", speed: 10.8 }
};

const PROJECTILE_KIND_DEFAULTS = {
  slide: { color: "#f6e9bf", accent: "#ff8f52", aura: "#ffcf8a" },
  paper: { color: "#f8f3df", accent: "#6f8ea8", aura: "#d8f3ff" },
  banana: { color: "#f5c451", accent: "#7fb85f", aura: "#fff1a8" },
  explosiveBanana: { color: "#f5c451", accent: "#ee6656", aura: "#ff8f52" },
  soccer: { color: "#f8f3df", accent: "#10151f", aura: "#4fb46f" },
  megaSoccer: { color: "#f8f3df", accent: "#4fb46f", aura: "#d8f56f" },
  spray: { color: "#d8f3ff", accent: "#55b8dc", aura: "#8bd6ff" },
  waterBlast: { color: "#8bd6ff", accent: "#f8f3df", aura: "#d8f3ff" },
  book: { color: "#8ba3ff", accent: "#fff1a8", aura: "#d8f3ff" },
  torah: { color: "#fff8cf", accent: "#8ba3ff", aura: "#fff1a8" },
  vipCard: { color: "#d8a5ff", accent: "#f5c451", aura: "#ff9fc0" },
  goldenVip: { color: "#f5c451", accent: "#fff8cf", aura: "#fff1a8" },
  dataCube: { color: "#85d6ff", accent: "#17445c", aura: "#d8f3ff" },
  laser: { color: "#d8f3ff", accent: "#85d6ff", aura: "#55b8dc" },
  wrench: { color: "#d7dce3", accent: "#c97848", aura: "#ffe4a0" },
  missile: { color: "#c97848", accent: "#f5c451", aura: "#ff8f52" },
  microphone: { color: "#10151f", accent: "#e8d8ad", aura: "#6f8ea8" },
  shockwave: { color: "#e8d8ad", accent: "#ff8f52", aura: "#ffcf8a" },
  money: { color: "#d8f56f", accent: "#f5c451", aura: "#fff1a8" },
  creditCard: { color: "#1b2433", accent: "#f5c451", aura: "#f5c451" },
  cart: { color: "#58c7a6", accent: "#d8f56f", aura: "#8bd6ff" },
  milk: { color: "#d8f3ff", accent: "#55b8dc", aura: "#f8f3df" },
  lowCostSign: { color: "#d8f56f", accent: "#10151f", aura: "#58c7a6" },
  jersey: { color: "#68c58a", accent: "#f8f3df", aura: "#d8f56f" },
  agigBall: { color: "#f8f3df", accent: "#68c58a", aura: "#d8f56f" },
  pillow: { color: "#b78cff", accent: "#fff1a8", aura: "#d8a5ff" },
  sleepCloud: { color: "#d8a5ff", accent: "#fff1a8", aura: "#b78cff" },
  energyBolt: { color: "#fff1a8", accent: "#55b8dc", aura: "#fff8cf" },
  portal: { color: "#fff1a8", accent: "#8ba3ff", aura: "#fff8cf" },
  spear: { color: "#d9a45f", accent: "#684a24", aura: "#f5c451" },
  rock: { color: "#8a6638", accent: "#6a4b2a", aura: "#c97848" },
  pokerChip: { color: "#f8f3df", accent: "#ee6656", aura: "#f5c451" },
  playingCard: { color: "#f8f3df", accent: "#ee6656", aura: "#f5c451" },
  dice: { color: "#f8f3df", accent: "#10151f", aura: "#4fb46f" },
  laundryBasket: { color: "#d8f3ff", accent: "#ff9fc0", aura: "#8bd6ff" },
  groceryBag: { color: "#f1d08c", accent: "#58c7a6", aura: "#fff1a8" },
  heart: { color: "#ff9fc0", accent: "#d8a5ff", aura: "#ff9fc0" },
  flower: { color: "#ff9fc0", accent: "#68c58a", aura: "#d8a5ff" },
  loveLetter: { color: "#f8f3df", accent: "#ff9fc0", aura: "#d8a5ff" },
  selfie: { color: "#10151f", accent: "#ff9fc0", aura: "#d8a5ff" },
  glowStick: { color: "#d8f56f", accent: "#9b78de", aura: "#ff9fc0" },
  flyer: { color: "#ff9fc0", accent: "#9b78de", aura: "#d8a5ff" },
  drone: { color: "#85d6ff", accent: "#d8f3ff", aura: "#55b8dc" },
  priceTag: { color: "#d8f56f", accent: "#10151f", aura: "#68c58a" },
  choreList: { color: "#f8f3df", accent: "#8ba3ff", aura: "#fff1a8" },
  calendar: { color: "#f8f3df", accent: "#8ba3ff", aura: "#fff1a8" },
  invitation: { color: "#fff1a8", accent: "#c97848", aura: "#f5c451" },
  assignment: { color: "#f8f3df", accent: "#8e44ad", aura: "#b68cff" },
  deadline: { color: "#b68cff", accent: "#ee6656", aura: "#7a3db8" },
  paperwork: { color: "#f8f3df", accent: "#ee6656", aura: "#ffcf8a" },
  radioOrder: { color: "#85d6ff", accent: "#384250", aura: "#55b8dc" },
  toy: { color: "#ff9fc0", accent: "#f5c451", aura: "#fff1a8" }
};

const HERO_PROJECTILE_SIGNATURES = {
  tal: { kind: "slide", ultimateKind: "paper", radius: 0.42 },
  mendel: { kind: "banana", ultimateKind: "explosiveBanana", radius: 0.36 },
  amichai: { kind: "soccer", ultimateKind: "megaSoccer", radius: 0.4 },
  hadar: { kind: "spray", ultimateKind: "waterBlast", radius: 0.38 },
  amit: { kind: "book", ultimateKind: "torah", radius: 0.4 },
  halel: { kind: "vipCard", ultimateKind: "goldenVip", radius: 0.36 },
  david: { kind: "dataCube", ultimateKind: "laser", radius: 0.38 },
  farber: { kind: "wrench", ultimateKind: "missile", radius: 0.4 },
  goodman: { kind: "microphone", ultimateKind: "shockwave", radius: 0.4 },
  gelman: { kind: "money", ultimateKind: "creditCard", radius: 0.38 },
  giat: { kind: "cart", ultimateKind: "lowCostSign", radius: 0.42 },
  kuzar: { kind: "jersey", ultimateKind: "agigBall", radius: 0.4 },
  bruiner: { kind: "pillow", ultimateKind: "sleepCloud", radius: 0.42 },
  dan: { kind: "energyBolt", ultimateKind: "portal", radius: 0.42 },
  aviad: { kind: "spear", ultimateKind: "radioOrder", radius: 0.38 }
};

const SUMMON_PROJECTILE_SIGNATURES = {
  presentation: { kind: "paper", radius: 0.34 },
  drone: { kind: "laser", radius: 0.32 },
  investor: { kind: "money", radius: 0.36 },
  reserve: { kind: "spear", radius: 0.36 },
  guardian: { kind: "energyBolt", radius: 0.42 },
  rabbi: { kind: "torah", radius: 0.36 },
  mechanic: { kind: "wrench", radius: 0.36 },
  monkey: { kind: "banana", radius: 0.34 },
  sleeper: { kind: "sleepCloud", radius: 0.36 }
};

const ENEMY_PROJECTILE_SIGNATURES = {
  monkey: { kind: "banana" },
  bedouinWarrior: { kind: "spear" },
  bedouinArcher: { kind: "spear" },
  camelRider: { kind: "rock" },
  desertScout: { kind: "rock" },
  royalTentGuard: { kind: "spear" },
  desertRaider: { kind: "rock" },
  spreadsheetAuditor: { kind: "paper" },
  keynoteKnight: { kind: "slide" },
  slideOverlord: { kind: "slide" },
  cardDealer: { kind: "playingCard" },
  casinoGuard: { kind: "pokerChip" },
  pokerPro: { kind: "dice" },
  diceThrower: { kind: "dice" },
  chipGambler: { kind: "pokerChip" },
  jackpotBruiser: { kind: "pokerChip" },
  choreBot: { kind: "laundryBasket" },
  errandRunner: { kind: "groceryBag" },
  cleaningInspector: { kind: "spray" },
  laundryBasketGuard: { kind: "laundryBasket" },
  groceryBagger: { kind: "groceryBag" },
  washingMachineWarden: { kind: "waterBlast" },
  matchmakerAgent: { kind: "heart" },
  dateReminder: { kind: "loveLetter" },
  calendarSniper: { kind: "flower" },
  flowerThrower: { kind: "flower" },
  loveLetterCourier: { kind: "loveLetter" },
  awkwardDinnerHost: { kind: "heart" },
  partyBouncer: { kind: "glowStick" },
  nightlifeScout: { kind: "selfie" },
  influencerDrone: { kind: "flyer" },
  selfieSniper: { kind: "selfie" },
  glowstickRaver: { kind: "glowStick" },
  vipGatekeeper: { kind: "goldenVip" },
  aiBot: { kind: "dataCube" },
  promptSniper: { kind: "laser" },
  modelCore: { kind: "drone" },
  dataPacketCrawler: { kind: "dataCube" },
  laserTurret: { kind: "laser" },
  droneSupervisor: { kind: "drone" },
  chatSpammer: { kind: "paper" },
  planCanceler: { kind: "calendar" },
  groupAdmin: { kind: "invitation" },
  microphoneHeckler: { kind: "microphone" },
  podiumPusher: { kind: "paper" },
  debateModerator: { kind: "shockwave" },
  creditCardNinja: { kind: "creditCard" },
  perfumeSprayer: { kind: "spray" },
  boutiqueManager: { kind: "creditCard" },
  fakeJersey: { kind: "jersey" },
  reseller: { kind: "soccer" },
  auctionBidder: { kind: "priceTag" },
  collector: { kind: "priceTag" },
  jerseyReseller: { kind: "jersey" },
  dealHunter: { kind: "priceTag" },
  footballCollectorGuard: { kind: "soccer" },
  pillowThrower: { kind: "pillow" },
  blanketBurrito: { kind: "sleepCloud" },
  sleepChampion: { kind: "sleepCloud" },
  familyScheduler: { kind: "calendar" },
  dinnerInviteCourier: { kind: "invitation" },
  choreListCaptain: { kind: "choreList" },
  weekendPlanner: { kind: "calendar" },
  diaperTrooper: { kind: "laundryBasket" },
  babyBottleMage: { kind: "milk" },
  shoppingCartCharger: { kind: "cart" },
  alarmClockSoldier: { kind: "calendar" },
  lowCostCollector: { kind: "priceTag" },
  reserveSoldier: { kind: "radioOrder" },
  couponKing: { kind: "lowCostSign" },
  strollerTitan: { kind: "toy" },
  reserveCommander: { kind: "radioOrder" },
  milkCartonTitan: { kind: "milk" }
};

const ALLIED_SUMMONS = {
  monkey: { name: "Monkey Warrior", role: "melee", hp: 46, damage: 13, speed: 3.4, radius: 0.42, range: 0.92, cooldown: 0.9, ttl: 11.5, color: "#9b6a3f", outline: "#f5c451" },
  rabbi: { name: "Student Rabbi", role: "healer", hp: 42, damage: 7, speed: 2.6, radius: 0.4, range: 2.7, cooldown: 1.15, ttl: 11.5, color: "#8ba3ff", outline: "#d8f3ff" },
  presentation: { name: "Presentation Assistant", role: "ranged", hp: 38, damage: 12, speed: 2.7, radius: 0.38, range: 4.2, cooldown: 1.05, ttl: 11.5, color: "#ff8f52", outline: "#ffe4a0", label: "paper" },
  consultant: { name: "Business Advisor", role: "melee", hp: 48, damage: 14, speed: 2.85, radius: 0.43, range: 1.05, cooldown: 0.95, ttl: 11.5, color: "#6f8ea8", outline: "#e8d8ad" },
  discount: { name: "Discount Warrior", role: "melee", hp: 30, damage: 9, speed: 3.45, radius: 0.34, range: 0.86, cooldown: 0.82, ttl: 10.2, color: "#58c7a6", outline: "#d8f56f" },
  rider: { name: "Motorcycle Rider", role: "charge", hp: 40, damage: 16, speed: 4.25, radius: 0.38, range: 1.12, cooldown: 0.78, ttl: 10.8, color: "#9b78de", outline: "#d8a5ff" },
  cleaner: { name: "Washer Assistant", role: "control", hp: 48, damage: 8, speed: 2.35, radius: 0.44, range: 2.6, cooldown: 1.18, ttl: 11.5, color: "#ff9fc0", outline: "#d8f3ff" },
  soccer: { name: "Soccer Player", role: "charge", hp: 44, damage: 15, speed: 3.8, radius: 0.4, range: 1.05, cooldown: 0.85, ttl: 11, color: "#4fb46f", outline: "#f8f3df" },
  drone: { name: "AI Drone", role: "ranged", hp: 34, damage: 14, speed: 3.15, radius: 0.32, range: 4.5, cooldown: 0.98, ttl: 11.5, color: "#85d6ff", outline: "#d8f3ff", label: "AI" },
  mechanic: { name: "Repair Worker", role: "support", hp: 52, damage: 8, speed: 2.55, radius: 0.42, range: 2.4, cooldown: 1.2, ttl: 11.5, color: "#c97848", outline: "#ffe4a0" },
  investor: { name: "Businessman", role: "ranged", hp: 42, damage: 13, speed: 2.7, radius: 0.4, range: 4, cooldown: 1.04, ttl: 11.5, color: "#f5c451", outline: "#fff1a8", label: "$" },
  agig: { name: "AGIG Follower", role: "area", hp: 40, damage: 12, speed: 2.8, radius: 0.4, range: 2.2, cooldown: 1.12, ttl: 11.5, color: "#68c58a", outline: "#d8f56f" },
  reserve: { name: "Reserve Soldier", role: "ranged", hp: 58, damage: 16, speed: 2.85, radius: 0.46, range: 3.8, cooldown: 1.25, ttl: 12, color: "#55b8dc", outline: "#d8f3ff", label: "AR" },
  guardian: { name: "Guardian of Light", role: "guardian", hp: 86, damage: 24, speed: 3.1, radius: 0.5, range: 3.2, cooldown: 0.92, ttl: 12, color: "#fff1a8", outline: "#fff8cf", label: "*" },
  sleeper: { name: "Nap Helper", role: "control", hp: 40, damage: 8, speed: 2.1, radius: 0.4, range: 2.4, cooldown: 1.2, ttl: 11, color: "#b78cff", outline: "#d8a5ff", label: "Z" }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pct(value, max) {
  return `${clamp(max ? (value / max) * 100 : 0, 0, 100)}%`;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function normalTo(from, to) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const d = Math.hypot(dx, dz) || 1;
  return { x: dx / d, z: dz / d };
}

function id(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${performance.now().toFixed(0)}`;
}

function visualProfile(save = {}) {
  const base = VISUAL_DENSITY[save.visualDensity] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const particleQuality = PARTICLE_QUALITY[save.graphics?.particlesQuality] || PARTICLE_QUALITY.medium;
  return {
    ...base,
    maxParticles: Math.max(4, Math.round(base.maxParticles * particleQuality.cap)),
    particleCount: base.particleCount * particleQuality.count,
    trapSparkles: base.trapSparkles * particleQuality.sparkles,
    ambientSparkles: base.ambientSparkles * particleQuality.sparkles
  };
}

function graphicsProfile(save = {}, purpose = "gameplay") {
  const raw = { ...DEFAULT_GRAPHICS, ...(save.graphics || {}) };
  const resolutionScale = RESOLUTION_OPTIONS.includes(Number(raw.resolutionScale)) ? Number(raw.resolutionScale) : DEFAULT_GRAPHICS.resolutionScale;
  const antiAliasing = AA_OPTIONS.some((option) => option.id === raw.antiAliasing) ? raw.antiAliasing : DEFAULT_GRAPHICS.antiAliasing;
  const scaleTable = purpose === "inspection" ? INSPECTION_SCALE_BY_RESOLUTION : RENDER_SCALE_BY_RESOLUTION;
  const renderScale = scaleTable[resolutionScale] || scaleTable[DEFAULT_GRAPHICS.resolutionScale];
  return {
    resolutionScale,
    antiAliasing,
    motionBlur: !!raw.motionBlur,
    shadows: raw.shadows === true,
    particlesQuality: PARTICLE_OPTIONS.some((option) => option.id === raw.particlesQuality) ? raw.particlesQuality : "medium",
    dpr: [renderScale, renderScale],
    antialiasEnabled: antiAliasing !== "off",
    renderFpsBoost: resolutionScale >= 125 ? -6 : resolutionScale <= 75 ? 2 : 0
  };
}

function focusHeroForMission(mission, save = {}) {
  if (save.debugHeroOverride && save.debugLevelOverride === mission?.level && CHARACTER_BY_ID[save.debugHeroOverride]) return save.debugHeroOverride;
  const fallback = save.selectedHero || save.party?.[0] || "tal";
  const focused = mission?.season === 1 && mission.focusHero ? mission.focusHero : fallback;
  return CHARACTER_BY_ID[focused] ? focused : "tal";
}

function partyForMission(mission, save = {}) {
  if (mission?.season === 1) return [focusHeroForMission(mission, save)];
  const next = (save.party || []).filter((heroId) => save.unlocked?.includes(heroId)).slice(0, 3);
  return next.length ? next : [focusHeroForMission(mission, save)];
}

function bossPhaseLabel(mission, phase) {
  const phases = mission?.boss?.phases || ["Opening Move", "Pressure", "Empire Mode", "Final Push"];
  return phases[clamp(phase, 1, phases.length) - 1] || phases[0];
}

function bossPhaseLine(mission, phase) {
  const lines = mission?.boss?.phaseLines || [
    `${mission?.boss?.name || "The boss"} changes tactics.`,
    "The arena pressure rises.",
    "Reinforcements move in.",
    "This world makes its final stand."
  ];
  return lines[clamp(phase, 1, lines.length) - 1] || lines[0];
}

function missionBackdrop(mission, phase) {
  if (mission?.map === "dadKingdom") {
    return {
      background: phase >= 3 ? "#f3b24e" : "#f5c97a",
      fog: phase >= 3 ? "#d99946" : "#f2c684",
      point: phase >= 2 ? "#ffe4a0" : "#fff1c8"
    };
  }
  return {
    background: phase >= 4 ? "#12091f" : "#152231",
    fog: phase >= 4 ? "#22112f" : "#152231",
    point: phase >= 3 ? "#b68cff" : "#fff1a8"
  };
}

function bossPositionsForMission(mission) {
  return mission?.map === "dadKingdom" ? DAD_LIFE_POSITIONS : KASHI_POSITIONS;
}

function speakBossLine(mission, kind, emitSubtitle, preferredLine) {
  if (mission?.season === 1) return null;
  return speakLine("kashi", kind, emitSubtitle, preferredLine);
}

function trimNewest(items, limit) {
  if (items.length <= limit) return items;
  return items.slice(-limit);
}

function createEntityPools() {
  return {
    projectiles: [],
    particles: [],
    damage: [],
    enemies: [],
    summons: [],
    telegraphs: []
  };
}

function takeFromPool(battle, key) {
  return battle.pools?.[key]?.pop() || {};
}

function recycleToPool(battle, key, item) {
  const pool = battle.pools?.[key];
  if (!pool || !item || pool.length >= (POOL_LIMITS[key] || 20)) return;
  pool.push(item);
}

function pooledObject(battle, key, values) {
  const item = takeFromPool(battle, key);
  Object.keys(item).forEach((field) => {
    delete item[field];
  });
  Object.assign(item, values);
  return item;
}

function trimNewestWithPool(battle, key, limit, poolKey = key) {
  const items = battle[key];
  if (!items || items.length <= limit) return items;
  const removeCount = items.length - limit;
  items.slice(0, removeCount).forEach((item) => recycleToPool(battle, poolKey, item));
  return items.slice(removeCount);
}

function filterWithPool(battle, key, keep, poolKey = key) {
  const kept = [];
  battle[key].forEach((item) => {
    if (keep(item)) kept.push(item);
    else recycleToPool(battle, poolKey, item);
  });
  battle[key] = kept;
}

function pushProjectile(battle, projectile) {
  const pooled = pooledObject(battle, "projectiles", projectile);
  const projectileCap = battle.visual?.projectileCap || MAX_PROJECTILES;
  pooled.ttl = Math.max(1.2, pooled.ttl * (battle.visual?.projectileTtl || 1));
  battle.projectiles.push(pooled);
  if (battle.projectiles.length > projectileCap) battle.projectiles = trimNewestWithPool(battle, "projectiles", projectileCap);
  return pooled;
}

function queueProjectile(battle, projectile, delay = 0, telegraph = null) {
  if (delay <= 0) return pushProjectile(battle, projectile);
  battle.pendingProjectiles.push({ id: id("pending"), projectile, ttl: delay });
  if (telegraph) {
    battle.telegraphs.push(pooledObject(battle, "telegraphs", {
      id: id("telegraph"),
      ttl: delay,
      ...telegraph,
      lineFrom: telegraph.lineFrom ? { x: telegraph.lineFrom.x, z: telegraph.lineFrom.z } : null,
      lineTo: telegraph.lineTo ? { x: telegraph.lineTo.x, z: telegraph.lineTo.z } : null
    }));
    battle.telegraphs = trimNewestWithPool(battle, "telegraphs", battle.visual?.maxTelegraphs || 8);
  }
  return projectile;
}

function pushParticle(battle, particle) {
  const visual = battle.visual || VISUAL_DENSITY[DEFAULT_QUALITY];
  battle.particles.push(pooledObject(battle, "particles", {
    ...particle,
    id: particle.id || id("fx"),
    ttl: Math.max(0.22, (particle.ttl || 0.7) * visual.effectTtl),
    scale: Math.max(0.25, (particle.scale || 1) * visual.particleScale)
  }));
  battle.particles = trimNewestWithPool(battle, "particles", Math.min(MAX_PARTICLES, visual.maxParticles));
}

function pushDamage(battle, item) {
  battle.damage.push(pooledObject(battle, "damage", { id: item.id || id("damage"), ...item }));
  battle.damage = trimNewestWithPool(battle, "damage", 18);
}

function cueTheatre(name, intensity = 1) {
  if (!theatreCueNames.has(name)) {
    theatreCueNames.add(name);
    theatreSheet.object(name, { intensity: 0, timestamp: 0 });
  }
  console.debug(`[DAN QUEST THEATRE] ${name}`, { intensity });
}

function App() {
  const mode = useGameStore((state) => state.mode);
  const save = useGameStore((state) => state.save);
  const activeLevel = useGameStore((state) => state.activeLevel);
  const runId = useGameStore((state) => state.runId);
  const lastResult = useGameStore((state) => state.lastResult);
  const transition = useGameStore((state) => state.transition);
  const startRun = useGameStore((state) => state.startRun);
  const startDebugRun = useGameStore((state) => state.startDebugRun);
  const retryLevel = useGameStore((state) => state.retryLevel);
  const continueLevel = useGameStore((state) => state.continueLevel);
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const openCharacterSelect = useGameStore((state) => state.openCharacterSelect);
  const openUpgrades = useGameStore((state) => state.openUpgrades);
  const pauseRun = useGameStore((state) => state.pauseRun);
  const resumeRun = useGameStore((state) => state.resumeRun);
  const gameOver = useGameStore((state) => state.gameOver);
  const completeRun = useGameStore((state) => state.completeRun);
  const resetSave = useGameStore((state) => state.resetSave);
  const setAudio = useGameStore((state) => state.setAudio);
  const setVisualDensity = useGameStore((state) => state.setVisualDensity);
  const setGraphics = useGameStore((state) => state.setGraphics);
  const mission = MISSIONS.find((item) => item.level === activeLevel) || MISSIONS[0];
  const availableMission = MISSIONS.find((item) => item.level === save.highestLevel) || MISSIONS[0];
  const graphics = graphicsProfile(save);

  useEffect(() => {
    setAudioLevels(save.audio);
    if (mode === STATES.PLAYING || mode === STATES.PAUSED) startMusic();
    else stopAllAudio();
  }, [mode, save.audio]);

  useEffect(() => {
    gsap.fromTo(".motion-item", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, stagger: 0.035, ease: "power2.out" });
  }, [mode, save.selectedHero, lastResult?.win]);

  const begin = useCallback((level = availableMission.level) => {
    playCue("menu");
    const nextMission = MISSIONS.find((item) => item.level === level) || availableMission;
    cueTheatre(`${nextMission.boss.name} Intro`, 0.7 + level * 0.08);
    startRun(level);
  }, [availableMission, startRun]);

  const handleVictory = useCallback((payload) => {
    cueTheatre(payload?.final ? "Final Victory" : "Character Unlock", 1);
    playCue("unlock");
    completeRun(payload);
  }, [completeRun]);

  const handleGameOver = useCallback((payload) => {
    playCue("hit");
    gameOver(payload);
  }, [gameOver]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const flowQa = {
      start: (level) => startRun(level),
      debugStart: (level, heroId) => startDebugRun(level, heroId),
      victory: (payload = {}) => completeRun({ kills: 0, ...payload }),
      defeat: (payload = {}) => gameOver({ reason: "QA defeat", kills: 0, bossHp: mission.boss.hp, ...payload }),
      menu: () => returnToMenu("qa menu"),
      unlockAll: () => useGameStore.setState((state) => ({
        save: {
          ...state.save,
          highestLevel: MISSIONS.length,
          unlocked: CHARACTERS.map((hero) => hero.id),
          party: ["tal"],
          selectedHero: "tal",
          sparks: Math.max(state.save.sparks || 0, 999)
        }
      })),
      setParty: (ids, selected = ids?.[0]) => useGameStore.setState((state) => {
        const unlocked = CHARACTERS.map((hero) => hero.id);
        const party = [...new Set((Array.isArray(ids) ? ids : ["tal"]).filter((id) => unlocked.includes(id)))].slice(0, 3);
        const safeParty = party.length ? party : ["tal"];
        return {
          save: {
            ...state.save,
            highestLevel: MISSIONS.length,
            unlocked,
            party: safeParty,
            selectedHero: safeParty.includes(selected) ? selected : safeParty[0],
            sparks: Math.max(state.save.sparks || 0, 999)
          }
        };
      }),
      setGraphics: (partial = {}) => useGameStore.getState().setGraphics(partial),
      setVisualDensity: (visualDensity = DEFAULT_QUALITY) => useGameStore.getState().setVisualDensity(visualDensity),
      state: () => useGameStore.getState()
    };
    const handleFlowQa = (event) => {
      const { action, payload, level } = event.detail || {};
      if (action === "start") flowQa.start(level);
      if (action === "debugStart") flowQa.debugStart(level, payload?.heroId);
      if (action === "victory") flowQa.victory(payload);
      if (action === "defeat") flowQa.defeat(payload);
      if (action === "menu") flowQa.menu();
      if (action === "unlockAll") flowQa.unlockAll();
    };
    const handleFlowQaKey = (event) => {
      if (event.key === "F6") flowQa.unlockAll();
      if (event.key === "F7") flowQa.menu();
      if (event.key === "F8") flowQa.start(1);
      if (event.key === "F9") flowQa.victory({ kills: 4 });
      if (event.key === "F10") flowQa.defeat({ kills: 1, bossHp: mission.boss.hp });
    };
    const runFlowQaCommand = (raw) => {
      if (!raw) return;
      try {
        const { action, payload, level } = JSON.parse(raw);
        if (action === "start") flowQa.start(level);
        if (action === "debugStart") flowQa.debugStart(level, payload?.heroId);
        if (action === "victory") flowQa.victory(payload);
        if (action === "defeat") flowQa.defeat(payload);
        if (action === "menu") flowQa.menu();
        if (action === "unlockAll") flowQa.unlockAll();
      } catch (error) {
        console.warn("[DAN QUEST QA] Invalid flow command", error);
      }
    };
    let lastCommand = "";
    const commandObserver = new MutationObserver(() => {
      const raw = document.documentElement.dataset.danQuestCommand || "";
      if (raw && raw !== lastCommand) {
        lastCommand = raw;
        runFlowQaCommand(raw);
      }
    });
    window.__DAN_QUEST_FLOW_QA__ = flowQa;
    window.addEventListener("danquest:flow-qa", handleFlowQa);
    window.addEventListener("keydown", handleFlowQaKey);
    commandObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-dan-quest-command"] });
    document.documentElement.dataset.danQuestFlowQa = "ready";
    return () => {
      window.removeEventListener("danquest:flow-qa", handleFlowQa);
      window.removeEventListener("keydown", handleFlowQaKey);
      commandObserver.disconnect();
      delete window.__DAN_QUEST_FLOW_QA__;
      delete document.documentElement.dataset.danQuestFlowQa;
      delete document.documentElement.dataset.danQuestCommand;
    };
  }, [completeRun, gameOver, mission.boss.hp, returnToMenu, startDebugRun, startRun]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    document.documentElement.dataset.danQuestMode = mode;
    document.documentElement.dataset.danQuestLevel = String(activeLevel);
    return undefined;
  }, [activeLevel, mode]);

  return (
    <main className={`app mode-${mode.toLowerCase()} motion-blur-${graphics.motionBlur ? "on" : "off"} aa-${graphics.antiAliasing} resolution-${graphics.resolutionScale}`}>
      {(mode === STATES.PLAYING || mode === STATES.PAUSED) && (
        <ArenaGame
          key={runId}
          mission={mission}
          save={save}
          paused={mode !== STATES.PLAYING}
          onPause={pauseRun}
          onVictory={handleVictory}
          onGameOver={handleGameOver}
          onRestart={retryLevel}
        />
      )}

      {mode === STATES.MENU && <MainMenu save={save} mission={availableMission} onStart={() => begin(availableMission.level)} onCampaign={() => openCharacterSelect("campaign select")} onWorldGallery={() => transition(STATES.WORLD_GALLERY, "world gallery")} onCharacterDebug={() => transition(STATES.CHARACTER_DEBUG, "character debug")} onDevMenu={() => transition(STATES.DEV_MENU, "development menu")} onSettings={() => transition(STATES.SETTINGS, "settings")} />}
      {mode === STATES.CHARACTER_SELECT && <CharacterSelect save={save} mission={availableMission} onStart={() => begin(availableMission.level)} onBack={() => returnToMenu("character select back")} />}
      {mode === STATES.UPGRADES && <CharacterSelect save={save} mission={availableMission} title="Upgrades" subtitle="Season 1 solo upgrades" onStart={() => begin(availableMission.level)} onBack={() => returnToMenu("upgrades back")} />}
      {mode === STATES.WORLD_GALLERY && <WorldGallery save={save} onEnterWorld={(level) => startDebugRun(level, focusHeroForMission(MISSIONS.find((item) => item.level === level), save))} onBack={() => returnToMenu("world gallery back")} />}
      {mode === STATES.CHARACTER_DEBUG && <CharacterDebugGallery save={save} onBack={() => returnToMenu("character debug back")} />}
      {mode === STATES.DEV_MENU && <DevelopmentMenu save={save} onEnterWorld={startDebugRun} onBack={() => returnToMenu("development menu back")} />}
      {mode === STATES.SETTINGS && <SettingsScreen save={save} setAudio={setAudio} setVisualDensity={setVisualDensity} setGraphics={setGraphics} resetSave={resetSave} onBack={() => returnToMenu("settings back")} />}
      {mode === STATES.PAUSED && <PauseScreen onResume={resumeRun} onCharacter={() => openCharacterSelect("paused character select")} onMenu={() => returnToMenu("paused menu")} />}
      {mode === STATES.GAME_OVER && <DefeatScreen result={lastResult} onRetry={retryLevel} onMenu={() => returnToMenu("defeat menu")} onCharacter={() => openCharacterSelect("defeat character select")} onUpgrades={() => openUpgrades("defeat upgrades")} />}
      {mode === STATES.VICTORY && <VictoryScreen result={lastResult} onContinue={continueLevel} onRetry={retryLevel} onCharacter={() => openCharacterSelect("victory character select")} onUpgrades={() => openUpgrades("victory upgrades")} onMenu={() => returnToMenu("victory menu")} />}
    </main>
  );
}

function MainMenu({ save, mission, onStart, onCampaign, onWorldGallery, onCharacterDebug, onDevMenu, onSettings }) {
  const focusHero = CHARACTER_BY_ID[focusHeroForMission(mission, save)] || CHARACTER_BY_ID.tal;
  const graphics = graphicsProfile(save, "inspection");
  return (
    <section className="menu-layer">
      <div className="menu-shell">
        <TopNav title="DAN QUEST" subtitle="Season 1 Rescue Campaign" />
        <div className="title-layout">
          <div className="menu-hero-scene motion-item">
            <Canvas shadows dpr={graphics.dpr} gl={{ antialias: graphics.antialiasEnabled, powerPreference: "high-performance" }} camera={{ position: [0, 6, 10], fov: 40 }}>
              <color attach="background" args={["#10151f"]} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[4, 8, 6]} intensity={2.4} castShadow />
              <Float speed={1.4} floatIntensity={0.35}>
                <HeroModel hero={focusHero} active moving={false} />
              </Float>
              <group position={[2.4, 0, -0.4]} scale={0.92}><KashiModel phase={2} boss={mission.boss} /></group>
              <group position={[-2.2, 0, -0.2]} scale={0.9}><HeroModel hero={CHARACTER_BY_ID.dan} active moving={false} /></group>
              <ContactShadows position={[0, -0.02, 0]} scale={8} blur={2.2} opacity={0.5} />
            </Canvas>
            <div className="story-panel">
              <p>Dan disappeared. The friend group is falling apart, one world at a time. Season 1 is a solo rescue campaign: play each friend in their own stage, bring them back, and reach Family Kingdom.</p>
            </div>
          </div>
          <div className="menu-card motion-item">
            <div className="screen-title">
              <h1>{GAME_TITLE}</h1>
              <p>{save.unlocked.length}/{CHARACTERS.length} heroes unlocked. Stage {mission.level}: {mission.title}. Play as {focusHero.name} against {mission.boss.name}. {save.sparks} sparks banked.</p>
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={onStart}><Play size={18} /> {save.wins ? "Continue Rescue" : "Start Rescue"}</button>
              <button className="ghost-button" onClick={onCampaign}><Users size={18} /> Characters</button>
              <button className="ghost-button" onClick={onWorldGallery}><Map size={18} /> World Preview</button>
              <button className="ghost-button" onClick={onDevMenu}><Gamepad2 size={18} /> Development Menu</button>
              <button className="ghost-button" onClick={onCharacterDebug}><Users size={18} /> Character Debug</button>
              <button className="ghost-button" onClick={onSettings}><Settings size={18} /> Settings</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorldGallery({ save, onEnterWorld, onBack }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const selectedMission = MISSIONS.find((mission) => mission.level === selectedLevel) || MISSIONS[0];
  const focusHero = CHARACTER_BY_ID[focusHeroForMission(selectedMission, save)] || CHARACTER_BY_ID.tal;
  const graphics = graphicsProfile(save, "inspection");
  return (
    <section className="menu-layer world-gallery-layer">
      <div className="menu-shell gallery-shell">
        <TopNav title="World Preview" subtitle="Inspect every DAN QUEST world" onBack={onBack} />
        <section className={`world-gallery-layout ${expanded ? "preview-expanded" : ""}`}>
          <div className="menu-card gallery-list motion-item">
            <div className="gallery-grid">
              {MISSIONS.map((mission) => {
                const hero = CHARACTER_BY_ID[focusHeroForMission(mission, save)] || CHARACTER_BY_ID.tal;
                const selected = selectedMission.level === mission.level;
                return (
                  <button
                    key={mission.level}
                    className={`world-card ${selected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedLevel(mission.level);
                      setExpanded(false);
                    }}
                  >
                    <Portrait3D hero={hero} />
                    <span>
                      <strong>{mission.title}</strong>
                      <small>{hero.name} vs {mission.boss.name}</small>
                      <small className="enter-label">Enter Preview</small>
                    </span>
                    <Eye size={18} />
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="menu-card world-preview-panel motion-item">
            <div className="world-preview-meta">
              <Portrait3D hero={focusHero} />
              <div>
                <small>Level {selectedMission.level}</small>
                <h2>{selectedMission.title}</h2>
                <p>{selectedMission.subtitle}</p>
              </div>
            </div>
            <div className="world-facts">
              <div><small>Character</small><strong>{focusHero.name}</strong></div>
              <div><small>Boss</small><strong>{selectedMission.boss.name}</strong></div>
              <div><small>Map</small><strong>{selectedMission.map}</strong></div>
            </div>
            <div className="world-preview-canvas" data-testid="world-preview-canvas">
              <Canvas shadows dpr={graphics.dpr} gl={{ antialias: graphics.antialiasEnabled, powerPreference: "high-performance" }} camera={{ position: [0, 11.8, 12.8], fov: 43 }}>
                <Suspense fallback={null}>
                  <SceneQualityContext.Provider value="high">
                    <WorldPreviewScene mission={selectedMission} hero={focusHero} save={save} graphics={graphics} />
                  </SceneQualityContext.Provider>
                </Suspense>
              </Canvas>
            </div>
            <div className="button-row">
              <button className="primary-button" onClick={() => setExpanded((value) => !value)}><Eye size={18} /> {expanded ? "Exit Preview" : "Enter Preview"}</button>
              <button className="primary-button" onClick={() => onEnterWorld(selectedMission.level)}><Swords size={18} /> Enter World</button>
              <button className="ghost-button" onClick={onBack}><Home size={18} /> Main Menu</button>
            </div>
          </aside>
        </section>
      </div>
    </section>
  );
}

function DevelopmentMenu({ save, onEnterWorld, onBack }) {
  const [level, setLevel] = useState(save.debugLevelOverride || save.highestLevel || 1);
  const mission = MISSIONS.find((item) => item.level === Number(level)) || MISSIONS[0];
  const [heroId, setHeroId] = useState(save.debugHeroOverride || focusHeroForMission(mission, save));
  const selectedHero = CHARACTER_BY_ID[heroId] || CHARACTER_BY_ID[focusHeroForMission(mission, save)] || CHARACTER_BY_ID.tal;
  useEffect(() => {
    if (!CHARACTER_BY_ID[heroId]) setHeroId(focusHeroForMission(mission, save));
  }, [heroId, mission, save]);
  return (
    <section className="menu-layer dev-menu-layer">
      <div className="menu-shell dev-shell">
        <TopNav title="Development Menu" subtitle="World combat test harness" onBack={onBack} />
        <section className="dev-grid">
          <div className="menu-card dev-control-card motion-item">
            <h3>Select World</h3>
            <select value={level} onChange={(event) => setLevel(Number(event.target.value))}>
              {MISSIONS.map((item) => <option key={item.level} value={item.level}>Level {item.level}: {item.title}</option>)}
            </select>
            <h3>Select Hero</h3>
            <select value={heroId} onChange={(event) => setHeroId(event.target.value)}>
              {CHARACTERS.map((hero) => <option key={hero.id} value={hero.id}>{hero.name}</option>)}
            </select>
            <button className="primary-button wide" onClick={() => onEnterWorld(Number(level), heroId)}><Swords size={18} /> Enter World</button>
          </div>
          <aside className="menu-card dev-preview-card motion-item">
            <div className="world-preview-meta">
              <Portrait3D hero={selectedHero} />
              <div>
                <small>Level {mission.level}</small>
                <h2>{mission.title}</h2>
                <p>{selectedHero.name} vs {mission.boss.name}</p>
              </div>
            </div>
            <div className="world-facts">
              <div><small>Regulars</small><strong>{mission.enemyPool?.length || 0}</strong></div>
              <div><small>Mini Bosses</small><strong>{(mission.miniBossPool || mission.boss.eliteEnemies || [mission.boss.eliteEnemy].filter(Boolean)).length}</strong></div>
              <div><small>Boss</small><strong>{mission.boss.name}</strong></div>
            </div>
            <div className="dev-roster-list">
              {(mission.enemyPool || []).map((type) => <span key={type}>{ENEMIES[type]?.name || type}</span>)}
              {(mission.miniBossPool || mission.boss.eliteEnemies || [mission.boss.eliteEnemy].filter(Boolean)).map((type) => <span key={type} className="mini">{ENEMIES[type]?.name || type}</span>)}
            </div>
          </aside>
        </section>
      </div>
    </section>
  );
}

function WorldPreviewScene({ mission, hero, save, graphics }) {
  const density = "high";
  const quality = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const backdrop = missionBackdrop(mission, 1);
  return (
    <>
      <color attach="background" args={[backdrop.background]} />
      <fog attach="fog" args={[backdrop.fog, mission.map === "dadKingdom" ? 22 : 18, mission.map === "dadKingdom" ? 36 : 30]} />
      <ambientLight intensity={0.9 * quality.lightScale} />
      <hemisphereLight args={["#f8f3df", "#10151f", 0.62 * quality.lightScale]} />
      <directionalLight position={[-4, 9, 7]} intensity={2.35 * quality.lightScale} color="#fff1c8" castShadow shadow-mapSize={[1024, 1024]} />
      <Physics gravity={[0, -9.81, 0]}>
        <MemoArenaWorld mission={mission} phase={1} density={density} />
        <group position={[-4.8, 0.9, 0]}>
          <MemoHeroModel hero={hero} active moving={false} />
        </group>
        <group position={[4.9, 0.92, 0]}>
          <MemoKashiModel phase={1} density={density} boss={mission.boss} />
        </group>
      </Physics>
      <ContactShadows position={[0, -0.02, 0]} scale={20} blur={2.2} opacity={0.42} />
      <RenderTicker density={density} graphics={graphics} />
      <PreviewCameraRig mission={mission} />
    </>
  );
}

function PreviewCameraRig({ mission }) {
  const center = mission.map === "dadKingdom" ? new THREE.Vector3(0.8, 0.15, 0.3) : new THREE.Vector3(0, 0.1, 0);
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.18;
    const radius = mission.map === "dadKingdom" ? 15.2 : 14.2;
    const wanted = new THREE.Vector3(Math.sin(t) * radius * 0.42, 11.6, Math.cos(t) * radius * 0.6 + 8.6);
    camera.position.lerp(wanted, 0.06);
    camera.lookAt(center);
  });
  return null;
}

function CharacterDebugGallery({ save, onBack }) {
  const roster = [...CHARACTERS, KASHI_DEBUG_CHARACTER];
  return (
    <section className="menu-layer character-debug-layer">
      <div className="menu-shell debug-shell">
        <TopNav title="Character Debug" subtitle="Roster render validation" onBack={onBack} />
        <div className="character-debug-grid">
          {roster.map((item) => {
            const status = item.image ? "OK" : "Missing";
            return (
              <article key={item.id} className={`menu-card character-debug-card status-${status.toLowerCase()}`} data-character-id={item.id} data-status={status}>
                <div className="debug-card-top">
                  <span className="debug-portrait" style={{ "--c": item.color }}>
                    {item.image ? <img src={item.image} alt={item.name} /> : <b>{item.initials}</b>}
                  </span>
                  <div>
                    <small>{item.id === "kashi" ? "Boss" : "Hero"}</small>
                    <strong>{item.name}</strong>
                  </div>
                  <span className="status-pill"><CheckCircle size={15} /> {status}</span>
                </div>
                <div className="debug-model">
                  <div className={`debug-billboard ${item.id === "kashi" ? "boss-billboard" : ""}`} style={{ "--c": item.color }}>
                    <span className="debug-billboard-shadow" />
                    <span className="debug-billboard-ring" />
                    {item.image ? <img src={item.image} alt={`${item.name} in-game billboard`} /> : <b>{item.initials}</b>}
                    <strong>{item.name}</strong>
                  </div>
                </div>
                <div className="debug-foot">
                  <span>{item.image ? "Portrait loaded" : "Portrait missing"}</span>
                  <span>{item.image ? "Billboard model" : "Needs asset"}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CharacterSelect({ save, mission, onStart, onBack, title = "Resistance", subtitle = "Season 1 solo rescue" }) {
  const selectHero = useGameStore((state) => state.selectHero);
  const toggleParty = useGameStore((state) => state.toggleParty);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);
  const startGuardRef = useRef(0);
  const unlocked = new Set(save.unlocked);
  const focusHero = CHARACTER_BY_ID[focusHeroForMission(mission, save)] || CHARACTER_BY_ID.tal;
  const seasonOne = mission?.season === 1;
  const selected = CHARACTER_BY_ID[save.selectedHero] || CHARACTER_BY_ID[save.party[0]] || focusHero;
  const graphics = graphicsProfile(save, "inspection");
  const activeComboList = activeCombos(save.party);
  const requestStart = useCallback((event) => {
    event?.preventDefault?.();
    const now = performance.now();
    if (now - startGuardRef.current < 250) return;
    startGuardRef.current = now;
    onStart();
  }, [onStart]);
  return (
    <section className="menu-layer">
      <div className="menu-shell">
        <TopNav title={title} subtitle={subtitle} onBack={onBack} />
        <div className="screen-actions motion-item">
          <button className="primary-button" onPointerDown={requestStart} onClick={requestStart}><Swords size={18} /> Stage {mission.level}: {focusHero.name}</button>
        </div>
        <section className="roster-layout">
          <div className="menu-card motion-item">
            <div className="roster-grid">
              {CHARACTERS.map((hero) => (
                <button key={hero.id} className={`roster-card ${save.selectedHero === hero.id ? "selected" : ""} ${focusHero.id === hero.id ? "focus" : ""} ${unlocked.has(hero.id) ? "" : "locked"}`} onClick={() => unlocked.has(hero.id) && selectHero(hero.id)}>
                  <Portrait3D hero={hero} locked={!unlocked.has(hero.id)} />
                  <span><strong>{hero.name}</strong><small>{hero.passive}</small></span>
                  {seasonOne ? focusHero.id === hero.id && <Medal className="party-mark" size={17} /> : save.party.includes(hero.id) && <Shield className="party-mark" size={17} />}
                </button>
              ))}
            </div>
          </div>
          <aside className="menu-card hero-detail motion-item">
            <div className="detail-top">
              <div className="detail-model"><Canvas dpr={graphics.dpr} gl={{ antialias: graphics.antialiasEnabled, powerPreference: "high-performance" }} camera={{ position: [0, 4, 7], fov: 38 }}><ambientLight intensity={0.8} /><directionalLight position={[4, 8, 6]} intensity={2.4} /><Float><HeroModel hero={selected} active moving={false} /></Float></Canvas></div>
              <div><h2>{selected.name}</h2><p>{selected.description}</p></div>
            </div>
            <div className="ability-grid">
              <div><small>Passive</small><strong>{selected.passive}</strong></div>
              <div><small>Basic</small><strong>{selected.basic}</strong></div>
              <div><small>Ultimate</small><strong>{selected.ultimate}</strong></div>
            </div>
            <p className="visual-note">{selected.visual}</p>
            {seasonOne ? (
              <div className="combo-panel solo-panel">
                <strong>Season 1 Solo Stage</strong>
                <small>Stage {mission.level}: play as {focusHero.name} in {mission.title}. Boss: {mission.boss.name}.</small>
                <small>Teams and hero combos stay saved for Season 2, but they are disabled in Season 1 stages.</small>
              </div>
            ) : (
              <div className="combo-panel">
                <strong>Active Combos</strong>
                {activeComboList.length ? activeComboList.map((combo) => <small key={combo.id}>{combo.name}: {combo.line}</small>) : <small>No pair bonus in the current squad.</small>}
                <strong>Pair Paths</strong>
                {COMBOS.filter((combo) => combo.heroes.includes(selected.id)).map((combo) => <small key={combo.id}>{combo.name}: {combo.heroes.map((id) => CHARACTER_BY_ID[id].name).join(" + ")}</small>)}
              </div>
            )}
            {!seasonOne && <button className="primary-button" disabled={!unlocked.has(selected.id)} onClick={() => toggleParty(selected.id)}>{save.party.includes(selected.id) ? <CheckCircle size={18} /> : <Shield size={18} />} {save.party.includes(selected.id) ? "In Squad" : "Add To Squad"}</button>}
            <div className="resource-strip"><span>Resistance Sparks</span><strong>{save.sparks}</strong></div>
            <UpgradeRows hero={selected} save={save} party={seasonOne ? [selected.id] : save.party} buyUpgrade={buyUpgrade} unlocked={unlocked.has(selected.id)} />
            <button className="primary-button wide" onPointerDown={requestStart} onClick={requestStart}><Swords size={18} /> Start Solo Rescue</button>
          </aside>
        </section>
      </div>
    </section>
  );
}

function UpgradeRows({ hero, save, party = save.party, buyUpgrade, unlocked }) {
  const stats = computeHeroStats(hero.id, save, party);
  const up = save.upgrades[hero.id] || { health: 0, attack: 0, ultimate: 0 };
  return (
    <div className="upgrade-list">
      {[
        ["health", "Health", `HP ${stats.maxHp}`],
        ["attack", "Attack", `ATK ${Math.round(stats.attack)}`],
        ["ultimate", "Ultimate", `Cost ${Math.round(stats.ultimateCost)}`]
      ].map(([key, label, copy]) => {
        const rank = up[key] || 0;
        const cost = upgradeCost(rank);
        return (
          <div className="upgrade-row" key={key}>
            <div><strong>{label} Rank {rank}/5</strong><small>{copy}</small></div>
            <button className="tiny-button" disabled={!unlocked || rank >= 5 || save.sparks < cost} onClick={() => buyUpgrade(hero.id, key)}>{rank >= 5 ? "Max" : `${cost} Sparks`}</button>
          </div>
        );
      })}
    </div>
  );
}

function SettingsScreen({ save, setAudio, setVisualDensity, setGraphics, resetSave, onBack }) {
  const audio = save.audio;
  const visualDensity = save.visualDensity || DEFAULT_QUALITY;
  const graphics = graphicsProfile(save);
  return (
    <section className="menu-layer">
      <div className="menu-shell">
        <TopNav title="Settings" subtitle="Audio and save" onBack={onBack} />
        <section className="settings-grid">
          {[
            ["master", "Master Volume"],
            ["music", "Music Volume"],
            ["sfx", "SFX Volume"],
            ["voice", "Voice Volume"]
          ].map(([key, label]) => (
            <div className="menu-card motion-item" key={key}>
              <h3>{label}</h3>
              <input type="range" min="0" max="1" step="0.01" value={audio[key]} onChange={(event) => setAudio({ [key]: Number(event.target.value) })} />
              <strong>{Math.round(audio[key] * 100)}%</strong>
            </div>
          ))}
          <div className="menu-card motion-item">
            <h3>Toggles</h3>
            <button className="ghost-button" onClick={() => setAudio({ muted: !audio.muted })}>{audio.muted ? <VolumeX size={18} /> : <Volume2 size={18} />} {audio.muted ? "Muted" : "Audio On"}</button>
            <button className="ghost-button" onClick={() => setAudio({ muteVoices: !audio.muteVoices })}><WandSparkles size={18} /> {audio.muteVoices ? "Voices Muted" : "Voices On"}</button>
            <button className="ghost-button" onClick={() => testVoiceLine(save.selectedHero)}><Volume2 size={18} /> Test Voice</button>
          </div>
          <div className="menu-card motion-item">
            <h3>Visual Quality</h3>
            <div className="density-options" role="radiogroup" aria-label="Visual Quality">
              {["low", "medium", "high"].map((level) => (
                <button
                  key={level}
                  className={`density-button ${visualDensity === level ? "selected" : ""}`}
                  onClick={() => setVisualDensity(level)}
                  aria-pressed={visualDensity === level}
                >
                  {VISUAL_DENSITY[level].label}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-card motion-item">
            <h3>Resolution Scale</h3>
            <div className="density-options" role="radiogroup" aria-label="Resolution Scale">
              {RESOLUTION_OPTIONS.map((scale) => (
                <button
                  key={scale}
                  className={`density-button ${graphics.resolutionScale === scale ? "selected" : ""}`}
                  onClick={() => setGraphics({ resolutionScale: scale })}
                  aria-pressed={graphics.resolutionScale === scale}
                >
                  {scale}%
                </button>
              ))}
            </div>
          </div>
          <div className="menu-card motion-item">
            <h3>Anti-Aliasing</h3>
            <div className="density-options aa-options" role="radiogroup" aria-label="Anti-Aliasing">
              {AA_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`density-button ${graphics.antiAliasing === option.id ? "selected" : ""}`}
                  onClick={() => setGraphics({ antiAliasing: option.id })}
                  aria-pressed={graphics.antiAliasing === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-card motion-item">
            <h3>Motion Blur</h3>
            <button className="ghost-button" onClick={() => setGraphics({ motionBlur: !graphics.motionBlur })}><Monitor size={18} /> {graphics.motionBlur ? "On" : "Off"}</button>
            <p>Motion blur is off by default for sharper characters, projectiles and world props.</p>
          </div>
          <div className="menu-card motion-item">
            <h3>Shadows</h3>
            <button className="ghost-button" onClick={() => setGraphics({ shadows: !graphics.shadows })}><Monitor size={18} /> {graphics.shadows ? "On" : "Off"}</button>
            <p>High quality uses full lighting. Medium keeps the look stable with lower-cost shadows.</p>
          </div>
          <div className="menu-card motion-item">
            <h3>Particles Quality</h3>
            <div className="density-options" role="radiogroup" aria-label="Particles Quality">
              {PARTICLE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`density-button ${graphics.particlesQuality === option.id ? "selected" : ""}`}
                  onClick={() => setGraphics({ particlesQuality: option.id })}
                  aria-pressed={graphics.particlesQuality === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-card motion-item">
            <h3>Save</h3>
            <p>Progress, unlocks, upgrades, selected hero and audio settings persist through Zustand local storage.</p>
            <button className="danger-button" onClick={resetSave}><RotateCcw size={18} /> Reset Save</button>
          </div>
        </section>
      </div>
    </section>
  );
}

function PauseScreen({ onResume, onCharacter, onMenu }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card motion-item">
        <h2>Paused</h2>
        <p>The rescue waits right where you left it.</p>
        <div className="button-row">
          <button className="primary-button" onClick={onResume}><Play size={18} /> Resume</button>
          <button className="ghost-button" onClick={onCharacter}><Users size={18} /> Character Select</button>
          <button className="ghost-button" onClick={onMenu}><Home size={18} /> Main Menu</button>
        </div>
      </div>
    </div>
  );
}

function DefeatScreen({ result, onRetry, onMenu, onCharacter, onUpgrades }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card motion-item defeat">
        <h2>Game Over</h2>
        <p>{result?.reason || "This world pushed back too hard."}</p>
        <div className="stat-grid">
          <div><small>Kills</small><strong>{result?.kills || 0}</strong></div>
          <div><small>Boss HP Left</small><strong>{Math.ceil(result?.bossHp || 0)}</strong></div>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={onRetry}><RotateCcw size={18} /> Retry Level</button>
          <button className="ghost-button" onClick={onMenu}><Home size={18} /> Main Menu</button>
          <button className="ghost-button" onClick={onCharacter}><Users size={18} /> Character Select</button>
          <button className="ghost-button" onClick={onUpgrades}><Sparkles size={18} /> Upgrades</button>
        </div>
      </div>
    </div>
  );
}

function VictoryScreen({ result, onContinue, onRetry, onCharacter, onUpgrades, onMenu }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card motion-item victory">
        <h2>{result?.mission?.final ? "SEASON 1 REUNITED" : "Rescue Complete"}</h2>
        <p>{result?.mission?.joke || "One friend is closer to the group again."}</p>
        <div className="reward-list">
          {(result?.rewards || []).map((reward) => <div className="reward-line" key={reward}><Sparkles size={15} /> {reward}</div>)}
        </div>
        {!!result?.unlocks?.length && <div className="unlock-strip">{result.unlocks.map((id) => <Portrait3D key={id} hero={CHARACTER_BY_ID[id]} />)}</div>}
        <div className="button-row">
          <button className="primary-button" onClick={onContinue}><ChevronRight size={18} /> Continue</button>
          <button className="ghost-button" onClick={onRetry}><RotateCcw size={18} /> Retry</button>
          <button className="ghost-button" onClick={onMenu}><Home size={18} /> Main Menu</button>
          <button className="ghost-button" onClick={onCharacter}><Users size={18} /> Character Select</button>
          <button className="ghost-button" onClick={onUpgrades}><Sparkles size={18} /> Upgrades</button>
        </div>
      </div>
    </div>
  );
}

function TopNav({ title, subtitle, onBack }) {
  return (
    <header className="menu-top motion-item">
      <button className="brand" onClick={onBack}>
        <span className="brand-mark"><Crown size={24} /></span>
        <span><strong>{title}</strong><small>{subtitle}</small></span>
      </button>
      <nav className="top-actions">
        {onBack && <button className="ghost-button" onClick={onBack}><Home size={18} /> Home</button>}
        <span className="engine-pill"><Gamepad2 size={15} /> R3F + Rapier Arena</span>
      </nav>
    </header>
  );
}

function ArenaGame({ mission, save, paused, onPause, onVictory, onGameOver, onRestart }) {
  const party = useMemo(() => {
    return partyForMission(mission, save);
  }, [mission, save]);
  const [activeId, setActiveId] = useState(party[0]);
  const [snapshot, setSnapshot] = useState(() => makeBattleSnapshot(createBattle(mission, save, party, activeId)));
  const [cinematic, setCinematic] = useState({ title: `${mission.boss.name} Intro`, line: `${CHARACTER_BY_ID[activeId].name} enters ${mission.title}.`, ttl: 2.2 });
  const [touchVector, setTouchVector] = useState({ x: 0, z: 0 });
  const [showStats, setShowStats] = useState(false);
  const battleRef = useRef(null);
  const inputRef = useRef({ keys: {}, aim: { x: 1, z: 0 }, attackHeld: false, touch: { x: 0, z: 0 } });
  const actionRef = useRef({});
  const playerBody = useRef(null);
  const timersRef = useRef(new Set());

  if (!battleRef.current) battleRef.current = createBattle(mission, save, party, activeId);

  const clearManagedTimers = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const clearCinematicAfter = useCallback((ms) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setCinematic(null);
    }, ms);
    timersRef.current.add(timer);
  }, []);

  const showCinematic = useCallback((next) => {
    clearManagedTimers();
    setCinematic(next);
    clearCinematicAfter((next.ttl || 2) * 1000);
  }, [clearCinematicAfter, clearManagedTimers]);

  const emitSubtitle = useCallback((subtitle) => {
    const battle = battleRef.current;
    battle.subtitles.push({ ...subtitle, x: subtitle.speaker === "kashi" ? battle.kashi.x : battle.player.x, z: subtitle.speaker === "kashi" ? battle.kashi.z : battle.player.z });
  }, []);

  useEffect(() => {
    const battle = battleRef.current;
    speakLine(activeId, "spawn", emitSubtitle);
    if (mission.season !== 1) speakLine("kashi", "boss", emitSubtitle);
    if (mission.season !== 1) {
      activeCombos(party).forEach((combo, index) => {
        const lines = COMBO_VOICES[combo.id];
        battle.subtitles.push({ id: `combo-${combo.id}`, speaker: combo.id, line: lines ? lines[index % lines.length] : combo.line, ttl: 3, x: battle.player.x, z: battle.player.z - 1.2 });
      });
    }
    clearCinematicAfter(2200);
  }, [activeId, clearCinematicAfter, emitSubtitle, mission.season, party]);

  useEffect(() => () => {
    clearManagedTimers();
    inputRef.current = { keys: {}, aim: { x: 1, z: 0 }, attackHeld: false, touch: { x: 0, z: 0 } };
    actionRef.current = {};
    battleRef.current = null;
    playerBody.current = null;
  }, [clearManagedTimers]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.__DAN_QUEST_ARENA_QA__ = {
      snapshot: () => battleRef.current ? makeBattleSnapshot(battleRef.current) : null,
      counts: () => {
        const battle = battleRef.current;
        return battle ? battleCounts(battle) : null;
      },
      fillUltimate: () => {
        const battle = battleRef.current;
        if (battle) battle.player.ult = battle.player.ultCost;
      },
      basic: () => actionRef.current.basic?.(),
      ultimate: () => actionRef.current.ultimate?.(),
      projectileCatalog: () => ({
        heroes: Object.fromEntries(CHARACTERS.map((hero) => [hero.id, projectileSignature("hero", hero.id).kind])),
        heroUltimates: Object.fromEntries(CHARACTERS.map((hero) => [hero.id, projectileSignature("hero", hero.id, hero.ultimate, { variant: "ultimate" }).kind])),
        enemies: Object.fromEntries(Object.keys(ENEMIES).map((type) => [type, projectileSignature("enemy", type).kind])),
        kashi: ["Assignment", "Deadline", "Rain", "Task", "Duty"].reduce((catalog, label) => {
          catalog[label] = projectileSignature("enemy", "kashi", label).kind;
          return catalog;
        }, {})
      }),
      kashiSummon: (kind = "summon") => {
        const battle = battleRef.current;
        if (battle) kashiAttack(battle, kind, mission, emitSubtitle);
      },
      spawnEnemy: (type, near) => {
        const battle = battleRef.current;
        if (battle) spawnEnemy(battle, type, mission.level, { summoned: false, near: near || battle.player });
      },
      setPlayer: (pos = {}) => {
        const battle = battleRef.current;
        if (!battle) return;
        battle.player.x = Number.isFinite(pos.x) ? pos.x : battle.player.x;
        battle.player.z = Number.isFinite(pos.z) ? pos.z : battle.player.z;
      },
      setBoss: (pos = {}) => {
        const battle = battleRef.current;
        if (!battle) return;
        battle.kashi.x = Number.isFinite(pos.x) ? pos.x : battle.kashi.x;
        battle.kashi.z = Number.isFinite(pos.z) ? pos.z : battle.kashi.z;
        battle.kashi.target = 0;
        battle.kashi.moveTimer = 99;
        battle.kashi.qaLocked = pos.locked !== false;
      },
      advance: (seconds = 0.1, steps = 1) => {
        const battle = battleRef.current;
        if (!battle) return;
        const safeSteps = Math.max(1, Math.min(160, Number(steps) || 1));
        const step = Math.max(0.01, Math.min(0.2, Number(seconds) || 0.1));
        for (let i = 0; i < safeSteps; i += 1) {
          updatePendingProjectiles(battle, step);
          updateProjectiles(battle, mission, emitSubtitle, step);
          updateTraps(battle, step);
          updateVfx(battle, step);
          enforceBattleCaps(battle);
        }
      }
    };
    return () => {
      delete window.__DAN_QUEST_ARENA_QA__;
    };
  }, [emitSubtitle, mission]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const telemetry = setInterval(() => {
      if (battleRef.current) document.documentElement.dataset.danQuestCounts = JSON.stringify(battleCounts(battleRef.current));
    }, 120);
    return () => {
      clearInterval(telemetry);
      delete document.documentElement.dataset.danQuestCounts;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      inputRef.current.keys[event.key.toLowerCase()] = true;
      if (import.meta.env.DEV && event.key === "F3" && battleRef.current) kashiAttack(battleRef.current, "summon", mission, emitSubtitle);
      if (import.meta.env.DEV && event.key === "F4" && battleRef.current) kashiAttack(battleRef.current, "bedouins", mission, emitSubtitle);
      if (import.meta.env.DEV && event.key === "F5" && battleRef.current) {
        event.preventDefault();
        battleRef.current.player.ult = battleRef.current.player.ultCost;
      }
      if (event.code === "Space") actionRef.current.basic?.();
      if (event.key.toLowerCase() === "q") actionRef.current.special?.();
      if (event.key.toLowerCase() === "e") actionRef.current.ability2?.();
      if (event.key.toLowerCase() === "r") actionRef.current.ultimate?.();
      if (event.key.toLowerCase() === "shift") actionRef.current.dodge?.();
      if (event.key.toLowerCase() === "escape") onPause?.();
      if (event.key.toLowerCase() === "tab") {
        event.preventDefault();
        actionRef.current.stats?.();
      }
    };
    const onKeyUp = (event) => {
      inputRef.current.keys[event.key.toLowerCase()] = false;
    };
    const onPointer = (event) => {
      const dx = event.clientX - window.innerWidth / 2;
      const dz = event.clientY - window.innerHeight / 2;
      const d = Math.hypot(dx, dz) || 1;
      inputRef.current.aim = { x: dx / d, z: dz / d };
    };
    const onPointerDown = (event) => {
      const fromUi = event.target?.closest?.("button,input,.move-pad,.action-pad,.modal-card,.menu-layer");
      if (event.button === 0 && !fromUi) {
        inputRef.current.attackHeld = true;
        actionRef.current.basic?.();
      }
    };
    const onPointerUp = () => {
      inputRef.current.attackHeld = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPause]);

  const fireBasic = useCallback(() => {
    const battle = battleRef.current;
    const hero = CHARACTER_BY_ID[activeId];
    const stats = computeHeroStats(activeId, save, party);
    if (battle.ended || battle.cooldowns.basic > 0) return;
    const cfg = STYLE_PROJECTILES[hero.style] || STYLE_PROJECTILES.banana;
    const dir = inputRef.current.aim.x || inputRef.current.aim.z ? inputRef.current.aim : normalTo(battle.player, battle.kashi);
    pushProjectile(battle, makeProjectile("hero", battle.player.x + dir.x * 0.8, 1.05, battle.player.z + dir.z * 0.8, dir.x * cfg.speed * 0.92, 0, dir.z * cfg.speed * 0.92, stats.attack, cfg.color, cfg.label, activeId));
    battle.cooldowns.basic = Math.max(0.34, (stats.cooldown / 1000) * battle.visual.projectileRate);
    battle.player.ult = clamp(battle.player.ult + 4.5, 0, battle.player.ultCost);
    playCue("attack");
    speakLine(activeId, "basic", emitSubtitle);
  }, [activeId, emitSubtitle, party, save]);

  const fireSpecial = useCallback(() => {
    const battle = battleRef.current;
    const hero = CHARACTER_BY_ID[activeId];
    const stats = computeHeroStats(activeId, save, party);
    if (battle.ended || battle.cooldowns.special > 0) return;
    const cfg = STYLE_PROJECTILES[hero.style] || STYLE_PROJECTILES.banana;
    const target = nearestTarget(battle);
    const dir = normalTo(battle.player, target);
    if (hero.id === "amit" || hero.id === "hadar") {
      battle.player.hp = clamp(battle.player.hp + stats.maxHp * 0.18, 0, battle.player.maxHp);
      battle.traps.push({ id: id("heal"), owner: "hero", x: battle.player.x, z: battle.player.z, radius: 2.5, ttl: 1.2, color: hero.color, damage: stats.attack * 0.8 });
    } else if (hero.id === "farber" || hero.id === "aviad") {
      battle.walls.push({ id: id("garage"), x: battle.player.x + dir.x * 2, z: battle.player.z + dir.z * 2, ttl: 3.8, color: hero.color });
      for (let i = -1; i <= 1; i += 1) pushProjectile(battle, makeProjectile("hero", battle.player.x, 1.05, battle.player.z, dir.x * 6.7 + i * dir.z * 0.55, 0, dir.z * 6.7 - i * dir.x * 0.55, stats.attack * 1.15, cfg.color, cfg.label, activeId));
    } else {
      for (let i = -1; i <= 1; i += 1) {
        const angle = Math.atan2(dir.z, dir.x) + i * 0.16;
        pushProjectile(battle, makeProjectile("hero", battle.player.x, 1.05, battle.player.z, Math.cos(angle) * cfg.speed * 0.9, 0, Math.sin(angle) * cfg.speed * 0.9, stats.attack * 1.05, cfg.color, cfg.label, activeId));
      }
    }
    battle.cooldowns.special = 5.6;
    battle.player.ult = clamp(battle.player.ult + 9, 0, battle.player.ultCost);
    playCue("special");
    speakLine(activeId, "special", emitSubtitle);
  }, [activeId, emitSubtitle, party, save]);

  const fireAbilityTwo = useCallback(() => {
    const battle = battleRef.current;
    const hero = CHARACTER_BY_ID[activeId];
    const stats = computeHeroStats(activeId, save, party);
    if (battle.ended || battle.cooldowns.ability2 > 0) return;
    const target = nearestTarget(battle);
    battle.cooldowns.ability2 = 7.2;
    battle.player.ult = clamp(battle.player.ult + 18 * battle.difficulty.ultCharge, 0, battle.player.ultCost);
    battle.traps.push({ id: id("ability2"), owner: "hero", x: target.x, z: target.z, radius: 2.35, ttl: 1.35, arm: 0, color: hero.color, damage: stats.attack * 2.4, pull: hero.id === "hadar" || hero.id === "giat" ? 2.4 : 0 });
    const pulseCount = battle.visualDensity === "high" ? 5 : battle.visualDensity === "medium" ? 4 : 3;
    for (let i = 0; i < pulseCount; i += 1) {
      const angle = (i / pulseCount) * Math.PI * 2;
      pushProjectile(battle, makeProjectile("hero", battle.player.x, 1.08, battle.player.z, Math.cos(angle) * 6.2, 0, Math.sin(angle) * 6.2, stats.attack * 0.78, hero.color, hero.id === "tal" ? "slide" : "A2", activeId));
    }
    pushParticle(battle, { id: id("a2"), x: target.x, z: target.z, color: hero.color, ttl: 0.8, scale: 1.1 });
    playCue("special");
    speakLine(activeId, "special", emitSubtitle);
  }, [activeId, emitSubtitle, party, save]);

  const fireUltimate = useCallback(() => {
    const battle = battleRef.current;
    const hero = CHARACTER_BY_ID[activeId];
    const stats = computeHeroStats(activeId, save, party);
    if (battle.ended || battle.player.ult < battle.player.ultCost) return;
    battle.player.ult = 0;
    const power = stats.attack * stats.ultimatePower;
    pushParticle(battle, { id: id("ultimate-launch"), x: battle.player.x, z: battle.player.z, color: hero.color, ttl: 0.85, scale: hero.id === "dan" ? 1.55 : 1.05 });
    applyHeroUltimate(battle, hero, stats, power);
    emitUltimateProjectiles(battle, hero, stats);
    if (hero.id === "dan") {
      cueTheatre("Dan Returns", 1);
      showCinematic({ title: "DAN RETURNS", line: "White-gold portal opens. Dan steps into the arena.", ttl: 2.4 });
    } else {
      showCinematic({ title: hero.ultimate, line: `${hero.name} unleashes ${hero.ultimate}.`, ttl: 2.1 });
    }
    playCue("ultimate");
    speakLine(activeId, "ultimate", emitSubtitle);
  }, [activeId, emitSubtitle, party, save, showCinematic]);

  const dodge = useCallback(() => {
    const battle = battleRef.current;
    if (battle.ended || battle.cooldowns.dodge > 0) return;
    const keys = inputRef.current.keys;
    const raw = {
      x: (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + inputRef.current.touch.x,
      z: (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + inputRef.current.touch.z
    };
    const len = Math.hypot(raw.x, raw.z);
    const dir = len > 0.05 ? { x: raw.x / len, z: raw.z / len } : inputRef.current.aim;
    battle.player.x = clamp(battle.player.x + dir.x * 2.55, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.player.z = clamp(battle.player.z + dir.z * 2.55, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.player.invuln = Math.max(battle.player.invuln, 0.5);
    battle.cooldowns.dodge = 0.95;
    pushParticle(battle, { id: id("dodge"), x: battle.player.x, z: battle.player.z, color: "#ccefff", ttl: 0.32, scale: 0.7 });
    playCue("menu");
  }, []);

  const devSpawnBoss = useCallback(() => {
    const battle = battleRef.current;
    if (!battle) return;
    const start = bossPositionsForMission(mission)[0];
    battle.kashi.x = start.x;
    battle.kashi.z = start.z;
    battle.kashi.hp = battle.kashi.maxHp;
    battle.kashi.phase = 1;
    battle.kashi.attackTimer = 0.8;
    battle.kashi.moveTimer = 1.2;
    showCinematic({ title: `${mission.boss.name} Reset`, line: `${mission.boss.name} is ready for a clean test.`, ttl: 1.4 });
    console.debug("[DAN QUEST DEV] spawn boss", { boss: mission.boss.name, level: mission.level });
  }, [mission, showCinematic]);

  const devSpawnEnemies = useCallback(() => {
    const battle = battleRef.current;
    if (!battle) return;
    const regulars = mission.enemyPool || [];
    const minis = mission.miniBossPool || mission.boss.eliteEnemies || [mission.boss.eliteEnemy].filter(Boolean);
    [...regulars.slice(0, 5), ...minis.slice(0, 2)].forEach((type, index) => {
      const angle = (index / Math.max(1, regulars.length + minis.length)) * Math.PI * 2;
      spawnEnemy(battle, type, mission.level, { summoned: false, near: { x: battle.player.x + Math.cos(angle) * 3.8, z: battle.player.z + Math.sin(angle) * 3.8 } });
    });
    enforceBattleCaps(battle);
    console.debug("[DAN QUEST DEV] spawn enemies", { level: mission.level, regulars, minis });
  }, [mission]);

  const devTestUltimate = useCallback(() => {
    const battle = battleRef.current;
    if (!battle) return;
    battle.player.ult = battle.player.ultCost;
    actionRef.current.ultimate?.();
    console.debug("[DAN QUEST DEV] test ultimate", { hero: activeId, level: mission.level });
  }, [activeId, mission.level]);

  const swapHero = useCallback(() => {
    if (party.length <= 1) return;
    const nextIndex = (party.indexOf(activeId) + 1) % party.length;
    const nextId = party[nextIndex];
    const battle = battleRef.current;
    const oldActiveId = activeId;
    const oldPlayerPos = { x: battle.player.x, z: battle.player.z };
    const nextCompanion = battle.companions.find((companion) => companion.heroId === nextId);
    if (nextCompanion) {
      battle.player.x = nextCompanion.x;
      battle.player.z = nextCompanion.z;
      nextCompanion.heroId = oldActiveId;
      nextCompanion.id = `companion-${oldActiveId}`;
      nextCompanion.x = oldPlayerPos.x;
      nextCompanion.z = oldPlayerPos.z;
      nextCompanion.cooldown = Math.max(nextCompanion.cooldown, 0.35);
    }
    const ratio = battle.player.hp / battle.player.maxHp;
    const stats = computeHeroStats(nextId, save, party);
    const maxHp = Math.round(stats.maxHp * (1.65 + party.length * 0.28) * battle.difficulty.playerHealth);
    battle.player.maxHp = maxHp;
    battle.player.hp = clamp(maxHp * ratio, 1, maxHp);
    battle.player.ultCost = stats.ultimateCost;
    syncCompanions(battle, nextId, party);
    setActiveId(nextId);
    speakLine(nextId, "spawn", emitSubtitle);
    playCue("menu");
  }, [activeId, emitSubtitle, party, save]);

  actionRef.current = { basic: fireBasic, special: fireSpecial, ability2: fireAbilityTwo, ultimate: fireUltimate, dodge, swap: swapHero, stats: () => setShowStats((value) => !value) };
  const backdrop = missionBackdrop(mission, snapshot.phase);
  const dadKingdom = mission.map === "dadKingdom";
  const quality = VISUAL_DENSITY[snapshot.visualDensity] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const graphics = graphicsProfile(save);
  const shadowsEnabled = graphics.shadows && snapshot.visualDensity !== "low";
  const shadowMapSize = snapshot.visualDensity === "high" ? [1024, 1024] : [512, 512];
  const combatPressure = snapshot.enemies.length + snapshot.summons.length + snapshot.projectiles.length * 0.35 + snapshot.telegraphs.length * 0.7;

  const startTouch = useCallback((event, pad, knob) => {
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width * 0.34;
    const dx = event.clientX - cx;
    const dz = event.clientY - cy;
    const d = Math.hypot(dx, dz) || 1;
    const mag = Math.min(max, d);
    const next = { x: (dx / d) * (mag / max), z: (dz / d) * (mag / max) };
    inputRef.current.touch = next;
    setTouchVector(next);
    if (knob) knob.style.transform = `translate3d(${(dx / d) * mag}px, ${(dz / d) * mag}px, 0)`;
  }, []);

  return (
    <>
      <Canvas className="arena-canvas" frameloop="demand" shadows={shadowsEnabled} dpr={graphics.dpr} gl={{ antialias: graphics.antialiasEnabled, powerPreference: "high-performance" }} camera={{ position: [-0.5, 13.2, 13.8], fov: 42 }}>
        <Suspense fallback={null}>
          <SceneQualityContext.Provider value={snapshot.visualDensity}>
            <color attach="background" args={[backdrop.background]} />
            <fog attach="fog" args={[backdrop.fog, dadKingdom ? 23 : 18, dadKingdom ? 38 : 30]} />
            <ambientLight intensity={(dadKingdom ? 0.94 : 0.72) * quality.lightScale} color={dadKingdom ? "#fff0c8" : "#ffffff"} />
            <hemisphereLight args={[dadKingdom ? "#ffe4a0" : "#ccefff", dadKingdom ? "#5d8a59" : "#10151f", (dadKingdom ? 0.8 : 0.25) * quality.lightScale]} />
            <directionalLight position={dadKingdom ? [-6, 12, 8] : [-4, 10, 7]} intensity={(dadKingdom ? 3.2 : 2.5) * quality.lightScale} color={dadKingdom ? "#ffd88a" : "#ffffff"} castShadow={shadowsEnabled} shadow-mapSize={shadowMapSize} />
            <pointLight position={[0, 3, 0]} intensity={(dadKingdom ? 1.15 : snapshot.phase >= 3 ? 1.4 : 0.8) * quality.lightScale} color={backdrop.point} />
            {snapshot.visualDensity === "high" && <Environment preset="city" />}
            <Physics gravity={[0, -9.81, 0]}>
              <MemoArenaWorld mission={mission} phase={snapshot.phase} density={snapshot.visualDensity} combatPressure={combatPressure} />
              <RigidBody ref={playerBody} type="kinematicPosition" position={[snapshot.player.x, 0.9, snapshot.player.z]} colliders="ball">
                <MemoHeroModel hero={CHARACTER_BY_ID[activeId]} active moving={snapshot.moving} />
              </RigidBody>
              {snapshot.companions.map((companion) => (
                <group key={companion.heroId} position={[companion.x, 0.9, companion.z]}>
                  <MemoHeroModel hero={CHARACTER_BY_ID[companion.heroId]} companion moving={companion.moving} />
                </group>
              ))}
              <group position={[snapshot.kashi.x, 0.92, snapshot.kashi.z]}><MemoKashiModel phase={snapshot.phase} density={snapshot.visualDensity} boss={mission.boss} /></group>
              {snapshot.enemies.map((enemy) => <EnemyModel key={enemy.id} enemy={enemy} />)}
              {snapshot.summons.map((summon) => <SummonModel key={summon.id} summon={summon} />)}
              {snapshot.telegraphs.map((telegraph) => <TelegraphModel key={telegraph.id} telegraph={telegraph} />)}
              {snapshot.projectiles.map((projectile) => <ProjectileModel key={projectile.id} projectile={projectile} />)}
              {snapshot.traps.map((trap) => <TrapModel key={trap.id} trap={trap} density={snapshot.visualDensity} />)}
              {snapshot.walls.map((wall) => <VineWall key={wall.id} wall={wall} density={snapshot.visualDensity} />)}
              {snapshot.particles.map((particle) => <Burst key={particle.id} particle={particle} density={snapshot.visualDensity} />)}
              {snapshot.damage.map((item) => <DamageNumber key={item.id} item={item} />)}
              {snapshot.subtitles.map((item) => <Subtitle key={item.id} item={item} />)}
            </Physics>
            {quality.contactShadows && graphics.shadows && <ContactShadows position={[0, -0.01, 0]} scale={20} blur={snapshot.visualDensity === "high" ? 2.4 : 1.35} opacity={snapshot.visualDensity === "high" ? 0.5 : 0.34} />}
            <RenderTicker density={snapshot.visualDensity} graphics={graphics} />
            <CameraRig target={snapshot.player} phase={snapshot.phase} pressure={combatPressure / 28} density={snapshot.visualDensity} />
            <BattleLoop battleRef={battleRef} inputRef={inputRef} actionRef={actionRef} playerBody={playerBody} activeId={activeId} party={party} save={save} mission={mission} paused={paused} emitSubtitle={emitSubtitle} setSnapshot={setSnapshot} showCinematic={showCinematic} onVictory={onVictory} onGameOver={onGameOver} />
          </SceneQualityContext.Provider>
        </Suspense>
      </Canvas>
      <ArenaHud snapshot={snapshot} mission={mission} activeHero={CHARACTER_BY_ID[activeId]} party={party} save={save} onPause={onPause} onSwap={swapHero} onBasic={fireBasic} onSpecial={fireSpecial} onAbilityTwo={fireAbilityTwo} onDodge={dodge} onUltimate={fireUltimate} touchVector={touchVector} setTouch={startTouch} inputRef={inputRef} />
      {import.meta.env.DEV && <DevArenaTools onSpawnBoss={devSpawnBoss} onSpawnEnemies={devSpawnEnemies} onUltimate={devTestUltimate} onRestart={onRestart} />}
      {showStats && <HeroStatsPanel activeHero={CHARACTER_BY_ID[activeId]} snapshot={snapshot} party={party} save={save} />}
      {cinematic && <BossCinematic cinematic={cinematic} />}
    </>
  );
}

function BattleLoop({ battleRef, inputRef, actionRef, playerBody, activeId, party, save, mission, paused, emitSubtitle, setSnapshot, showCinematic, onVictory, onGameOver }) {
  const lastSnapshot = useRef(0);
  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.033);
    const battle = battleRef.current;
    if (!battle || battle.ended || paused) return;
    battle.time += dt;
    updateCooldowns(battle, dt);
    updateWorldAmbience(battle, mission, dt);
    updatePlayer(battle, inputRef.current, activeId, save, party, dt);
    battle.activeId = activeId;
    syncCompanions(battle, activeId, party, save);
    updateCompanions(battle, activeId, save, party, dt);
    playerBody.current?.setNextKinematicTranslation({ x: battle.player.x, y: 0.9, z: battle.player.z });
    if (inputRef.current.attackHeld) actionRef.current.basic?.();
    updateKashi(battle, mission, emitSubtitle, showCinematic, dt);
    updateEnemies(battle, mission, emitSubtitle, dt);
    updateSummons(battle, emitSubtitle, dt);
    updatePendingProjectiles(battle, dt);
    updateProjectiles(battle, mission, emitSubtitle, dt);
    updateTraps(battle, dt);
    updateVfx(battle, dt);
    enforceBattleCaps(battle);
    if (battle.kashi.hp <= 0 && !battle.ended) {
      battle.ended = true;
      speakLine(activeId, "victory", emitSubtitle);
      if (mission.season !== 1) speakLine("kashi", "defeat", emitSubtitle);
      onVictory({ kills: battle.kills, final: mission.final });
    }
    if (battle.player.hp <= 0 && !battle.ended) {
      battle.ended = true;
      speakLine(activeId, "defeat", emitSubtitle);
      onGameOver({ reason: `${mission.boss.name} overwhelmed ${CHARACTER_BY_ID[activeId].name}.`, kills: battle.kills, bossHp: battle.kashi.hp });
    }
    const visualPressure = battle.enemies.length + battle.summons.length + battle.projectiles.length + battle.telegraphs.length;
    const snapshotInterval = visualPressure > 0 ? 0.12 : 0.2;
    if (state.clock.elapsedTime - lastSnapshot.current > snapshotInterval) {
      lastSnapshot.current = state.clock.elapsedTime;
      setSnapshot(makeBattleSnapshot(battle));
      if (import.meta.env.DEV) document.documentElement.dataset.danQuestCounts = JSON.stringify(battleCounts(battle));
    }
  });
  return null;
}

function createBattle(mission, save, party, activeId) {
  const stats = computeHeroStats(activeId, save, party);
  const densityKey = VISUAL_DENSITY[save.visualDensity] ? save.visualDensity : DEFAULT_QUALITY;
  const visual = visualProfile(save);
  const baseDifficulty = difficultyForLevel(mission.level);
  const difficulty = {
    ...baseDifficulty,
    maxEnemies: Math.min(visual.enemyCap || MAX_ENEMY_SUMMONS, baseDifficulty.maxEnemies)
  };
  const bossHp = Math.round((mission.boss.hp + mission.level * 95) * difficulty.bossHp);
  const partyDurability = (1.65 + party.length * 0.28) * difficulty.playerHealth;
  const maxHp = Math.round(stats.maxHp * partyDurability);
  const player = { x: -5.8, z: 0, hp: maxHp, maxHp, invuln: 0, softTick: 0, ult: clamp(stats.ultimateCost * 0.78, 0, stats.ultimateCost), ultCost: stats.ultimateCost };
  const bossStart = bossPositionsForMission(mission)[0];
  return {
    difficulty,
    visual,
    visualDensity: densityKey,
    activeId,
    season: mission.season || 1,
    missionTitle: mission.title,
    map: mission.map,
    bossName: mission.boss.name,
    bossType: mission.boss.type,
    time: 0,
    ended: false,
    kills: 0,
    wave: 1,
    player,
    companions: createCompanionStates(party, activeId, player),
    kashi: { x: bossStart.x, z: bossStart.z, target: 0, hp: bossHp, maxHp: bossHp, phase: 1, moveTimer: 2.4, attackTimer: 2.4, vineyardTimer: 12, patternIndex: 0, name: mission.boss.name, type: mission.boss.type, color: mission.boss.color },
    enemies: [],
    summons: [],
    projectiles: [],
    pendingProjectiles: [],
    telegraphs: [],
    traps: [],
    walls: [],
    particles: [],
    damage: [],
    subtitles: [],
    pools: createEntityPools(),
    cooldowns: { basic: 0, special: 0, ability2: 0, dodge: 0 },
    spawnTimer: 3.2 * difficulty.spawnDelay,
    miniBossTimer: Math.max(10, 16 - mission.level * 0.25),
    ambientTimer: mission.map === "dadKingdom" ? 1.2 : 999,
    ambientIndex: 0,
    moving: false
  };
}

function createCompanionStates(party, activeId, player) {
  return party
    .filter((heroId) => heroId !== activeId)
    .slice(0, COMPANION_FORMATION.length)
    .map((heroId, index) => {
      const offset = COMPANION_FORMATION[index] || COMPANION_FORMATION[COMPANION_FORMATION.length - 1];
      return {
        id: `companion-${heroId}`,
        heroId,
        x: player.x + offset.x,
        z: player.z + offset.z,
        targetX: player.x + offset.x,
        targetZ: player.z + offset.z,
        radius: 0.62,
        cooldown: 0.35 + index * 0.2,
        moving: false
      };
    });
}

function syncCompanions(battle, activeId, party) {
  const ids = party.filter((heroId) => heroId !== activeId).slice(0, COMPANION_FORMATION.length);
  battle.companions = battle.companions.filter((companion) => ids.includes(companion.heroId));
  ids.forEach((heroId, index) => {
    const offset = COMPANION_FORMATION[index] || COMPANION_FORMATION[COMPANION_FORMATION.length - 1];
    let companion = battle.companions.find((item) => item.heroId === heroId);
    if (!companion) {
      companion = {
        id: `companion-${heroId}`,
        heroId,
        x: battle.player.x + offset.x,
        z: battle.player.z + offset.z,
        radius: 0.62,
        cooldown: 0.35 + index * 0.2,
        moving: false
      };
      battle.companions.push(companion);
    }
    companion.slot = index;
    companion.targetX = battle.player.x + offset.x;
    companion.targetZ = battle.player.z + offset.z;
  });
}

function makeBattleSnapshot(battle) {
  return {
    visualDensity: battle.visualDensity,
    activeId: battle.activeId,
    season: battle.season,
    missionTitle: battle.missionTitle,
    map: battle.map,
    bossName: battle.bossName,
    bossType: battle.bossType,
    time: battle.time,
    kills: battle.kills,
    wave: battle.wave,
    moving: battle.moving,
    phase: battle.kashi.phase,
    player: { ...battle.player },
    companions: battle.companions.map((item) => ({ ...item })),
    kashi: { ...battle.kashi },
    cooldowns: { ...battle.cooldowns },
    enemies: battle.enemies.map((item) => ({ ...item })),
    summons: battle.summons.map((item) => ({ ...item })),
    telegraphs: battle.telegraphs.map((item) => ({ ...item })),
    projectiles: battle.projectiles.map((item) => ({ ...item })),
    traps: battle.traps.map((item) => ({ ...item })),
    walls: battle.walls.map((item) => ({ ...item })),
    particles: battle.particles.map((item) => ({ ...item })),
    damage: battle.damage.map((item) => ({ ...item })),
    subtitles: battle.subtitles.map((item) => ({ ...item }))
  };
}

function battleCounts(battle) {
  return {
    activeId: battle.activeId,
    season: battle.season,
    missionTitle: battle.missionTitle,
    map: battle.map,
    bossName: battle.bossName,
    companions: battle.companions.length,
    alliedSummons: battle.summons.filter((summon) => summon.team === "ally").length,
    monkeys: battle.summons.filter((summon) => summon.type === "monkey").length,
    reserve: battle.summons.filter((summon) => summon.type === "reserve").length,
    summonTypes: battle.summons.reduce((counts, summon) => {
      counts[summon.type] = (counts[summon.type] || 0) + 1;
      return counts;
    }, {}),
    enemies: battle.enemies.length,
    dadEnemies: battle.enemies.filter((enemy) => DAD_KINGDOM_ENEMY_TYPES.has(enemy.type)).length,
    dadEnemyTypes: battle.enemies.reduce((counts, enemy) => {
      if (DAD_KINGDOM_ENEMY_TYPES.has(enemy.type)) counts[enemy.type] = (counts[enemy.type] || 0) + 1;
      return counts;
    }, {}),
    bedouins: battle.enemies.filter((enemy) => enemy.type === "bedouinWarrior").length,
    grapes: battle.enemies.filter((enemy) => enemy.type.startsWith("grape") || enemy.type === "vineSoldier").length,
    projectiles: battle.projectiles.length,
    projectileKinds: battle.projectiles.reduce((counts, projectile) => {
      counts[projectile.kind || "unknown"] = (counts[projectile.kind || "unknown"] || 0) + 1;
      return counts;
    }, {}),
    pendingProjectiles: battle.pendingProjectiles.length,
    telegraphs: battle.telegraphs.length,
    particles: battle.particles.length,
    pools: Object.fromEntries(Object.entries(battle.pools || {}).map(([key, pool]) => [key, pool.length]))
  };
}

function updateWorldAmbience(battle, mission, dt) {
  if (mission.map !== "dadKingdom") return;
  battle.ambientTimer -= dt;
  if (battle.ambientTimer > 0) return;
  const cues = battle.kashi.phase >= 3
    ? ["dadMarket", "dadRadio", "dadKids", "dadBirds"]
    : battle.kashi.phase >= 2
      ? ["dadRadio", "dadBirds", "dadKids", "dadMarket"]
      : ["dadBirds", "dadKids", "dadMarket", "dadRadio"];
  playCue(cues[battle.ambientIndex % cues.length]);
  battle.ambientIndex += 1;
  battle.ambientTimer = battle.visualDensity === "high" ? 4.6 : battle.visualDensity === "medium" ? 5.8 : 7.2;
}

function updateCooldowns(battle, dt) {
  battle.cooldowns.basic = Math.max(0, battle.cooldowns.basic - dt);
  battle.cooldowns.special = Math.max(0, battle.cooldowns.special - dt);
  battle.cooldowns.ability2 = Math.max(0, battle.cooldowns.ability2 - dt);
  battle.cooldowns.dodge = Math.max(0, battle.cooldowns.dodge - dt);
  battle.player.invuln = Math.max(0, battle.player.invuln - dt);
  battle.player.softTick = Math.max(0, battle.player.softTick - dt);
  battle.player.ult = clamp(battle.player.ult + dt * 3.2 * battle.difficulty.ultCharge, 0, battle.player.ultCost);
}

function updatePlayer(battle, input, activeId, save, party, dt) {
  const keys = input.keys;
  const raw = {
    x: (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + input.touch.x,
    z: (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + input.touch.z
  };
  const len = Math.hypot(raw.x, raw.z);
  battle.moving = len > 0.05;
  if (battle.moving) {
    const stats = computeHeroStats(activeId, save, party);
    const speed = 3.5 + stats.speed / 170;
    battle.player.x = clamp(battle.player.x + (raw.x / len) * speed * dt, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.player.z = clamp(battle.player.z + (raw.z / len) * speed * dt, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
  }
}

function updateCompanions(battle, activeId, save, party, dt) {
  battle.companions.forEach((companion) => {
    const before = { x: companion.x, z: companion.z };
    const dx = companion.targetX - companion.x;
    const dz = companion.targetZ - companion.z;
    const d = Math.hypot(dx, dz) || 1;
    const hero = CHARACTER_BY_ID[companion.heroId];
    const stats = computeHeroStats(companion.heroId, save, party);
    const followSpeed = 2.8 + stats.speed / 220;
    if (d > 0.08) {
      companion.x += (dx / d) * Math.min(d, followSpeed * dt);
      companion.z += (dz / d) * Math.min(d, followSpeed * dt);
    }
    companion.cooldown = Math.max(0, companion.cooldown - dt);
    companion.moving = distance(before, companion) > 0.01;
    const target = nearestTargetFrom(battle, companion);
    if (target && companion.cooldown <= 0) {
      const targetDistance = distance(companion, target);
      const cfg = STYLE_PROJECTILES[hero.style] || STYLE_PROJECTILES.banana;
      if (targetDistance < Math.max(3.6, stats.range / 150)) {
        const dir = normalTo(companion, target);
        pushProjectile(battle, makeProjectile("hero", companion.x, 1.05, companion.z, dir.x * cfg.speed * 0.7, 0, dir.z * cfg.speed * 0.7, stats.attack * 0.54, cfg.color, cfg.label, companion.heroId, 0.32));
        companion.cooldown = Math.max(1.05, (stats.cooldown / 1000 + 0.48) * battle.visual.projectileRate);
      }
    }
    companion.x = clamp(companion.x, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    companion.z = clamp(companion.z, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
  });
  separateFromPoint(battle.companions, battle.player, 1.85, 5.6, dt);
  separateUnits(battle.companions, 1.75, 5, dt);
}

function addAlliedSummon(battle, type, sourceHero, x, z, angle = 0, power = 1) {
  const base = ALLIED_SUMMONS[type] || ALLIED_SUMMONS.monkey;
  const sameType = battle.summons.filter((summon) => summon.team === "ally" && summon.type === type);
  const allies = battle.summons.filter((summon) => summon.team === "ally");
  const allyCap = battle.visual?.alliedSummonCap || MAX_ALLIED_SUMMONS;
  const typeCap = Math.min(SUMMON_CAPS[type] || MAX_ALLIED_SUMMONS, allyCap);
  if (sameType.length >= typeCap || allies.length >= allyCap) {
    const recycled = sameType.sort((a, b) => a.spawnedAt - b.spawnedAt)[0] || allies.sort((a, b) => a.spawnedAt - b.spawnedAt)[0];
    if (recycled) {
      const hp = Math.round(base.hp * (0.85 + power * 0.08));
      recycled.team = "ally";
      recycled.type = type;
      recycled.source = sourceHero;
      recycled.name = base.name;
      recycled.x = clamp(x, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
      recycled.z = clamp(z, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
      recycled.vx = Math.cos(angle) * 0.2;
      recycled.vz = Math.sin(angle) * 0.2;
      recycled.hp = hp;
      recycled.maxHp = hp;
      recycled.damage = base.damage * power;
      recycled.speed = base.speed;
      recycled.radius = base.radius;
      recycled.range = base.range;
      recycled.role = base.role;
      recycled.label = base.label;
      recycled.cooldownBase = base.cooldown;
      recycled.ttl = Math.min(12, Math.max(8, base.ttl * battle.visual.summonTtl));
      recycled.color = base.color;
      recycled.outline = base.outline;
      recycled.attackPulse = 0.24;
      recycled.spawnedAt = battle.time;
      return recycled;
    }
  }
  const hp = Math.round(base.hp * (0.85 + power * 0.08));
  const summon = pooledObject(battle, "summons", {
    id: id(type),
    team: "ally",
    type,
    source: sourceHero,
    name: base.name,
    x: clamp(x, -ARENA_HALF + 0.7, ARENA_HALF - 0.7),
    z: clamp(z, -ARENA_HALF + 0.7, ARENA_HALF - 0.7),
    vx: Math.cos(angle) * 0.2,
    vz: Math.sin(angle) * 0.2,
    hp,
    maxHp: hp,
    damage: base.damage * power,
    speed: base.speed,
    radius: base.radius,
    range: base.range,
    role: base.role,
    label: base.label,
    cooldownBase: base.cooldown,
    cooldown: Math.random() * 0.45,
    ttl: Math.min(12, Math.max(8, base.ttl * battle.visual.summonTtl)),
    color: base.color,
    outline: base.outline,
    spawnedAt: battle.time,
    attackPulse: 0
  });
  battle.summons.push(summon);
  return summon;
}

function updateSummons(battle, emitSubtitle, dt) {
  battle.summons.forEach((summon) => {
    summon.ttl -= dt;
    summon.cooldown = Math.max(0, summon.cooldown - dt);
    summon.attackPulse = Math.max(0, (summon.attackPulse || 0) - dt);
    const target = nearestTargetFrom(battle, summon);
    if (target) {
      const d = distance(summon, target);
      const dir = normalTo(summon, target);
      if (d > summon.range * 0.86) {
        summon.x += dir.x * summon.speed * dt;
        summon.z += dir.z * summon.speed * dt;
      } else if (d < summon.range * 0.48) {
        summon.x -= dir.x * summon.speed * 0.42 * dt;
        summon.z -= dir.z * summon.speed * 0.42 * dt;
      }
      if (d <= summon.range && summon.cooldown <= 0) {
        summon.cooldown = (summon.cooldownBase || 1) * battle.visual.projectileRate;
        summon.attackPulse = 0.24;
        resolveSummonAction(battle, summon, target, dir);
        playCue("hit");
      }
    } else {
      const follow = { x: battle.player.x - 1.2, z: battle.player.z };
      const dir = normalTo(summon, follow);
      if (distance(summon, follow) > 1.2) {
        summon.x += dir.x * summon.speed * 0.5 * dt;
        summon.z += dir.z * summon.speed * 0.5 * dt;
      }
    }
    summon.x = clamp(summon.x, -ARENA_HALF + 0.65, ARENA_HALF - 0.65);
    summon.z = clamp(summon.z, -ARENA_HALF + 0.65, ARENA_HALF - 0.65);
  });
  separateUnits(battle.summons.filter((summon) => summon.team === "ally"), 1.08, 4.2, dt);
  separateFromPoint(battle.summons, battle.player, 1.26, 3.6, dt);
  battle.summons = battle.summons.filter((summon) => {
    if (summon.hp > 0 && summon.ttl > 0) return true;
    pushDamage(battle, { id: id("summon-ko"), x: summon.x, z: summon.z, text: "poof", color: summon.outline, ttl: 0.45 });
    recycleToPool(battle, "summons", summon);
    return false;
  });
}

function damageTargetFromSummon(battle, summon, target, amount = summon.damage) {
  if (target === battle.kashi) {
    battle.kashi.hp -= amount;
    pushDamage(battle, { id: id("summon-dmg"), x: target.x, z: target.z, text: Math.round(amount), color: summon.outline, ttl: 0.55 });
  } else {
    target.hp -= amount;
    target.stun = Math.max(target.stun || 0, summon.role === "control" ? 0.42 : 0);
    pushDamage(battle, { id: id("summon-dmg"), x: target.x, z: target.z, text: Math.round(amount), color: summon.outline, ttl: 0.55 });
  }
}

function healHeroSide(battle, summon, amount) {
  const heal = Math.round(amount);
  battle.player.hp = clamp(battle.player.hp + heal, 0, battle.player.maxHp);
  battle.summons.forEach((ally) => {
    if (ally.team === "ally" && distance(ally, summon) < 2.4) ally.hp = clamp(ally.hp + heal * 0.45, 0, ally.maxHp);
  });
  pushDamage(battle, { id: id("summon-heal"), x: battle.player.x, z: battle.player.z, text: `+${heal}`, color: summon.outline, ttl: 0.55 });
}

function resolveSummonAction(battle, summon, target, dir) {
  const role = summon.role || "melee";
  if (role === "healer") {
    healHeroSide(battle, summon, summon.damage * 1.25);
    battle.enemies.forEach((enemy) => {
      if (distance(summon, enemy) < 2.9) {
        enemy.cooldown += 0.45;
        enemy.hp -= summon.damage * 0.45;
      }
    });
    if (distance(summon, battle.kashi) < 3.2) battle.kashi.hp -= summon.damage * 0.55;
    return;
  }
  if (role === "support") {
    healHeroSide(battle, summon, summon.damage * 0.9);
    damageTargetFromSummon(battle, summon, target, summon.damage * 0.65);
    return;
  }
  if (role === "control") {
    if (target !== battle.kashi) {
      target.cooldown += 0.8;
      target.stun = Math.max(target.stun || 0, 0.75);
    }
    battle.traps.push({ id: id("clean-control"), owner: "hero", x: target.x, z: target.z, radius: 1.45, ttl: 0.85, arm: 0, color: summon.outline, damage: summon.damage * 0.85, pull: 1.2 });
    return;
  }
  if (role === "area") {
    battle.traps.push({ id: id("agig-follower"), owner: "hero", x: target.x, z: target.z, radius: 1.55, ttl: 0.8, arm: 0, color: summon.outline, damage: summon.damage * 1.25 });
    return;
  }
  if (role === "ranged" || role === "guardian") {
    pushProjectile(battle, makeProjectile("hero", summon.x, role === "guardian" ? 1.28 : 1.05, summon.z, dir.x * (role === "guardian" ? 7.8 : 6.6), 0, dir.z * (role === "guardian" ? 7.8 : 6.6), summon.damage, summon.outline, summon.label || "shot", summon.type, role === "guardian" ? 0.44 : 0.36));
    if (role === "guardian") healHeroSide(battle, summon, summon.damage * 0.25);
    return;
  }
  if (role === "charge") {
    summon.x = clamp(summon.x + dir.x * 0.78, -ARENA_HALF + 0.65, ARENA_HALF - 0.65);
    summon.z = clamp(summon.z + dir.z * 0.78, -ARENA_HALF + 0.65, ARENA_HALF - 0.65);
    damageTargetFromSummon(battle, summon, target, summon.damage * 1.2);
    return;
  }
  damageTargetFromSummon(battle, summon, target);
}

function separateUnits(units, minDistance, strength, dt) {
  for (let i = 0; i < units.length; i += 1) {
    for (let j = i + 1; j < units.length; j += 1) {
      const a = units[i];
      const b = units[j];
      const dx = a.x - b.x;
      const dz = a.z - b.z;
      const d = Math.hypot(dx, dz) || 0.001;
      const wanted = minDistance + (a.radius || 0) * 0.35 + (b.radius || 0) * 0.35;
      if (d < wanted) {
        const push = (wanted - d) * strength * dt;
        const nx = dx / d;
        const nz = dz / d;
        a.x += nx * push;
        a.z += nz * push;
        b.x -= nx * push;
        b.z -= nz * push;
      }
    }
  }
}

function separateFromPoint(units, point, minDistance, strength, dt) {
  units.forEach((unit) => {
    const dx = unit.x - point.x;
    const dz = unit.z - point.z;
    const d = Math.hypot(dx, dz) || 0.001;
    if (d < minDistance) {
      const push = (minDistance - d) * strength * dt;
      unit.x += (dx / d) * push;
      unit.z += (dz / d) * push;
    }
  });
}

function updateKashi(battle, mission, emitSubtitle, showCinematic, dt) {
  const ratio = battle.kashi.hp / battle.kashi.maxHp;
  const phaseCount = mission.boss.phases?.length || 4;
  const nextPhase = phaseCount <= 3 ? ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3 : ratio > 0.72 ? 1 : ratio > 0.45 ? 2 : ratio > 0.22 ? 3 : 4;
  if (nextPhase !== battle.kashi.phase) {
    battle.kashi.phase = nextPhase;
    const title = bossPhaseLabel(mission, nextPhase);
    cueTheatre(title, nextPhase);
    showCinematic({ title, line: bossPhaseLine(mission, nextPhase), ttl: 2 });
    if (mission.season !== 1) speakLine("kashi", nextPhase === 2 ? "rage" : "special", emitSubtitle);
    playCue("boss");
  }
  if (!battle.kashi.qaLocked) {
    battle.kashi.moveTimer -= dt;
    if (battle.kashi.moveTimer <= 0) {
      const positions = bossPositionsForMission(mission);
      battle.kashi.target = (battle.kashi.target + 1 + Math.floor(Math.random() * 2)) % positions.length;
      battle.kashi.moveTimer = Math.max(1.1, 2.8 - battle.kashi.phase * 0.28);
    }
    const target = bossPositionsForMission(mission)[battle.kashi.target];
    battle.kashi.x += (target.x - battle.kashi.x) * dt * 1.8;
    battle.kashi.z += (target.z - battle.kashi.z) * dt * 1.8;
  }
  battle.kashi.attackTimer -= dt * (1 + battle.kashi.phase * 0.08 + mission.level * 0.02);
  battle.kashi.vineyardTimer -= dt;
  if (battle.kashi.vineyardTimer <= 0 && battle.kashi.phase >= 3) {
    battle.kashi.vineyardTimer = battle.kashi.phase === 4 ? 7.8 : 10.5;
    kashiAttack(battle, "vineyard", mission, emitSubtitle);
  }
  if (battle.kashi.attackTimer <= 0) {
    const attacks = mission.map === "dadKingdom"
      ? battle.kashi.phase === 1 ? ["assignment", "vine", "summon"] : battle.kashi.phase === 2 ? ["deadline", "summon", "bedouins", "vine"] : ["deadline", "rain", "summon", "vineyard"]
      : battle.kashi.phase === 1 ? ["assignment", "vine", "summon"] : battle.kashi.phase === 2 ? ["assignment", "deadline", "vine"] : battle.kashi.phase === 3 ? ["deadline", "rain", "summon", "vine"] : ["deadline", "rain", "vineyard", "summon", "bedouins"];
    const kind = attacks[battle.kashi.patternIndex % attacks.length];
    battle.kashi.patternIndex += 1;
    kashiAttack(battle, kind, mission, emitSubtitle);
    battle.kashi.attackTimer = Math.max(1.55, (3.05 - battle.kashi.phase * 0.18 - mission.level * 0.035) * battle.visual.projectileRate);
  }
  battle.spawnTimer -= dt;
  if (battle.spawnTimer <= 0) {
    battle.spawnTimer = Math.max(2.2, 5.5 - mission.level * 0.32) * battle.difficulty.spawnDelay;
    if (battle.enemies.length < battle.difficulty.maxEnemies) spawnEnemy(battle, mission.enemyPool[Math.floor(Math.random() * mission.enemyPool.length)], mission.level);
  }
  battle.miniBossTimer -= dt;
  if (battle.miniBossTimer <= 0) {
    const miniPool = mission.miniBossPool || mission.boss.eliteEnemies || [mission.boss.eliteEnemy].filter(Boolean);
    if (miniPool.length && battle.enemies.length < battle.difficulty.maxEnemies) {
      const type = miniPool[Math.floor(battle.time / 7) % miniPool.length];
      spawnEnemy(battle, type, mission.level + 2, { summoned: false, near: battle.kashi });
      pushParticle(battle, { id: id("mini-boss"), x: battle.kashi.x, z: battle.kashi.z, color: mission.boss.color || "#f5c451", ttl: 0.8, scale: 0.9 });
    }
    battle.miniBossTimer = Math.max(12, 24 - mission.level * 0.32) * battle.difficulty.spawnDelay;
  }
}

function kashiAttack(battle, kind, mission, emitSubtitle) {
  const from = { x: battle.kashi.x, z: battle.kashi.z };
  const to = { x: battle.player.x, z: battle.player.z };
  const dir = normalTo(from, to);
  const taskLabel = mission.map === "dadKingdom" ? "Task" : "Assignment";
  const dutyLabel = mission.map === "dadKingdom" ? "Duty" : "Deadline";
  if (kind === "assignment") {
    queueProjectile(battle, makeProjectile("enemy", from.x, 1.2, from.z, dir.x * 6.7, 0, dir.z * 6.7, (10 + battle.kashi.phase * 2) * battle.difficulty.enemyDamage, mission.map === "dadKingdom" ? "#f5c451" : "#8e44ad", taskLabel, "kashi", 0.46), 0.38, { owner: "enemy", x: to.x, z: to.z, radius: 0.85, color: "#ee6656", lineFrom: from, lineTo: to });
    speakBossLine(mission, "basic", emitSubtitle, "Assignment.");
  } else if (kind === "deadline") {
    const fan = battle.visualDensity === "high" ? 5 : 3;
    const half = Math.floor(fan / 2);
    for (let i = -half; i <= half; i += 1) {
      const a = Math.atan2(dir.z, dir.x) + i * 0.18;
      queueProjectile(battle, makeProjectile("enemy", from.x, 1.2, from.z, Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2, (8 + battle.kashi.phase * 1.5) * battle.difficulty.enemyDamage, mission.map === "dadKingdom" ? "#55b8dc" : "#b68cff", dutyLabel, "kashi", 0.42), 0.46, { owner: "enemy", x: to.x + Math.cos(a) * 2.2, z: to.z + Math.sin(a) * 2.2, radius: 0.7, color: "#b68cff", lineFrom: from, lineTo: { x: to.x + Math.cos(a) * 2.2, z: to.z + Math.sin(a) * 2.2 } });
    }
    speakBossLine(mission, "basic", emitSubtitle, "Deadline.");
  } else if (kind === "vine") {
    battle.traps.push({ id: id("vine"), owner: "enemy", x: to.x, z: to.z, radius: 1.45, ttl: 3.2, arm: 0.45, color: "#6bbf6a", damage: (10 + battle.kashi.phase * 2) * battle.difficulty.enemyDamage });
    speakBossLine(mission, "special", emitSubtitle, "You work for me now.");
  } else if (kind === "rain") {
    const drops = battle.visualDensity === "high" ? 7 : battle.visualDensity === "medium" ? 5 : 4;
    for (let i = 0; i < drops; i += 1) {
      const x = to.x + THREE.MathUtils.randFloatSpread(5.2);
      const z = to.z + THREE.MathUtils.randFloatSpread(5.2);
      queueProjectile(battle, makeProjectile("enemy", x, 6.8, z, 0, -5.8, 0, 12 * battle.difficulty.enemyDamage, "#7a3db8", "Rain", "kashi", 0.72), 0.5, { owner: "enemy", x, z, radius: 0.95, color: "#ee6656" });
    }
  } else if (kind === "summon") {
    const count = Math.min(3, Math.max(1, Math.round((2 + battle.kashi.phase * 0.45) * battle.difficulty.summonCount)));
    const pool = mission.enemyPool?.length ? mission.enemyPool : ["grapeSoldier", "grapeBrute", "vineSoldier", "grapeBomber"];
    for (let i = 0; i < count; i += 1) spawnEnemy(battle, pool[i % pool.length], battle.kashi.phase, { summoned: true, near: battle.kashi });
    speakBossLine(mission, "special", emitSubtitle, mission.boss.summonLine || "Reinforcements.");
  } else if (kind === "bedouins") {
    const count = Math.min(SUMMON_CAPS.bedouinWarrior, Math.max(2, Math.round(4 * battle.difficulty.summonCount)));
    const elite = mission.boss.eliteEnemy || "bedouinWarrior";
    for (let i = 0; i < count; i += 1) spawnEnemy(battle, elite, battle.kashi.phase + 1, { summoned: true, near: battle.kashi });
    speakBossLine(mission, "ultimate", emitSubtitle, mission.boss.summonLine || "Elite reinforcements.");
  } else if (kind === "vineyard") {
    const yards = battle.visualDensity === "high" ? 5 : 4;
    for (let i = 0; i < yards; i += 1) battle.traps.push({ id: id("yard"), owner: "enemy", x: THREE.MathUtils.randFloatSpread(12), z: THREE.MathUtils.randFloatSpread(12), radius: 1.1 + Math.random() * 0.45, ttl: 3.3, arm: 0.45, color: "#8e44ad", damage: (10 + battle.kashi.phase * 3) * battle.difficulty.enemyDamage });
    for (let i = 0; i < 2; i += 1) battle.walls.push({ id: id("wall"), x: THREE.MathUtils.randFloatSpread(9), z: THREE.MathUtils.randFloatSpread(9), ttl: 4.2, color: "#20152f" });
    speakBossLine(mission, "ultimate", emitSubtitle);
  }
  enforceBattleCaps(battle);
  playCue(kind === "vineyard" ? "boss" : "attack");
}

function spawnEnemy(battle, type, level, options = {}) {
  const isGrapeArmy = type.startsWith("grape") || type === "vineSoldier";
  const sameBedouins = battle.enemies.filter((enemy) => enemy.type === "bedouinWarrior");
  const grapeArmy = battle.enemies.filter((enemy) => enemy.type.startsWith("grape") || enemy.type === "vineSoldier");
  if (type === "bedouinWarrior" && sameBedouins.length >= SUMMON_CAPS.bedouinWarrior) {
    const oldest = sameBedouins.sort((a, b) => a.spawnedAt - b.spawnedAt)[0];
    oldest.hp = oldest.maxHp;
    oldest.cooldown = 0.2;
    oldest.spawnedAt = battle.time;
    return oldest;
  }
  if (options.summoned && isGrapeArmy && grapeArmy.length >= SUMMON_CAPS.grapeArmy) {
    const oldest = grapeArmy.sort((a, b) => a.spawnedAt - b.spawnedAt)[0];
    oldest.hp = oldest.maxHp;
    oldest.cooldown = 0.2;
    oldest.spawnedAt = battle.time;
    return oldest;
  }
  const enemyCap = Math.min(battle.visual?.enemyCap || MAX_ENEMY_SUMMONS, battle.difficulty.maxEnemies);
  if (battle.enemies.length >= enemyCap) {
    const oldest = [...battle.enemies].sort((a, b) => a.spawnedAt - b.spawnedAt)[0];
    if (oldest && options.summoned) {
      battle.enemies = battle.enemies.filter((enemy) => {
        const keep = enemy.id !== oldest.id;
        if (!keep) recycleToPool(battle, "enemies", enemy);
        return keep;
      });
    } else if (oldest) {
      oldest.hp = oldest.maxHp;
      oldest.cooldown = 0.2;
      oldest.spawnedAt = battle.time;
      return oldest;
    }
  }
  const base = ENEMIES[type] || ENEMIES.grapeSoldier;
  const side = Math.floor(Math.random() * 4);
  const edgePos = side === 0 ? { x: -ARENA_HALF + 0.8, z: THREE.MathUtils.randFloatSpread(ARENA - 3) } : side === 1 ? { x: ARENA_HALF - 0.8, z: THREE.MathUtils.randFloatSpread(ARENA - 3) } : side === 2 ? { x: THREE.MathUtils.randFloatSpread(ARENA - 3), z: -ARENA_HALF + 0.8 } : { x: THREE.MathUtils.randFloatSpread(ARENA - 3), z: ARENA_HALF - 0.8 };
  const pos = options.near ? { x: options.near.x + THREE.MathUtils.randFloatSpread(2.6), z: options.near.z + THREE.MathUtils.randFloatSpread(2.6) } : edgePos;
  const enemy = pooledObject(battle, "enemies", {
    id: id(type),
    type,
    name: base.name,
    mode: base.mode,
    x: clamp(pos.x, -ARENA_HALF + 0.75, ARENA_HALF - 0.75),
    z: clamp(pos.z, -ARENA_HALF + 0.75, ARENA_HALF - 0.75),
    hp: Math.round(base.hp * (1 + level * 0.16) * battle.difficulty.enemyHp),
    maxHp: Math.round(base.hp * (1 + level * 0.16) * battle.difficulty.enemyHp),
    speed: base.speed * battle.difficulty.enemySpeed,
    damage: (base.damage + level * 1.3) * battle.difficulty.enemyDamage,
    radius: base.radius,
    color: base.color,
    projectileLabel: base.projectileLabel,
    projectileColor: base.projectileColor,
    cooldown: Math.random() * 1.2,
    summoned: !!options.summoned,
    ttl: options.summoned ? THREE.MathUtils.randFloat(8, 12) : null,
    spawnedAt: battle.time
  });
  battle.enemies.push(enemy);
  return enemy;
}

function updateEnemies(battle, mission, emitSubtitle, dt) {
  battle.enemies.forEach((enemy) => {
    enemy.cooldown -= dt;
    enemy.stun = Math.max(0, (enemy.stun || 0) - dt);
    if (enemy.ttl != null) enemy.ttl -= dt;
    const target = nearestHeroSideTarget(battle, enemy);
    const d = distance(enemy, target);
    const toPlayer = normalTo(enemy, target);
    const keepAway = enemy.mode === "ranged" || enemy.mode === "sniper" || enemy.mode === "bomber";
    const speed = enemy.speed * (enemy.mode === "miniBoss" ? 0.85 : 1);
    if (enemy.stun > 0) {
      enemy.attackPulse = 0;
    } else if (enemy.mode === "blocker") {
      enemy.x += toPlayer.x * speed * dt;
      enemy.z += toPlayer.z * speed * dt;
      if (d < 1.1) damageHeroSideTarget(battle, target, enemy.damage * dt * 1.4, emitSubtitle, true);
    } else if (enemy.mode === "charger") {
      const chargeSpeed = speed * (enemy.cooldown < 0.65 ? 1.85 : 0.72);
      enemy.x += toPlayer.x * chargeSpeed * dt;
      enemy.z += toPlayer.z * chargeSpeed * dt;
      enemy.attackPulse = enemy.cooldown < 0.65 ? 0.2 : Math.max(0, (enemy.attackPulse || 0) - dt);
      if (d < 1.15) {
        damageHeroSideTarget(battle, target, enemy.damage * dt * 1.9, emitSubtitle, true);
        enemy.cooldown = Math.max(enemy.cooldown, 1.35);
      }
      if (enemy.cooldown <= 0) enemy.cooldown = 2.2 * battle.visual.projectileRate;
    } else if (keepAway) {
      const dir = d < (enemy.mode === "sniper" ? 5.8 : 3.4) ? { x: -toPlayer.x, z: -toPlayer.z } : toPlayer;
      enemy.x += dir.x * speed * 0.62 * dt;
      enemy.z += dir.z * speed * 0.62 * dt;
      if (enemy.cooldown <= 0) {
        enemy.cooldown = (enemy.mode === "sniper" ? 3.15 : enemy.mode === "bomber" ? 2.85 : 2.15) * battle.visual.projectileRate;
        const vel = enemy.mode === "sniper" ? 7.6 : 5.6;
        const projectile = makeProjectile("enemy", enemy.x, 1.05, enemy.z, toPlayer.x * vel, enemy.mode === "bomber" ? 1 : 0, toPlayer.z * vel, enemy.damage, enemy.projectileColor || enemy.color, enemy.projectileLabel || (enemy.mode === "bomber" ? "Bomb" : "Seed"), enemy.type, enemy.mode === "bomber" ? 0.62 : 0.38);
        queueProjectile(battle, projectile, enemy.mode === "sniper" ? 0.48 : 0.34, { owner: "enemy", x: target.x, z: target.z, radius: enemy.mode === "bomber" ? 0.95 : 0.65, color: "#ee6656", lineFrom: enemy, lineTo: target });
      }
    } else if (enemy.mode === "trapper") {
      enemy.x += toPlayer.x * speed * 0.65 * dt;
      enemy.z += toPlayer.z * speed * 0.65 * dt;
      if (enemy.cooldown <= 0) {
        enemy.cooldown = 2.7;
        battle.traps.push({ id: id("enemy-vine"), owner: "enemy", x: target.x + THREE.MathUtils.randFloatSpread(1.5), z: target.z + THREE.MathUtils.randFloatSpread(1.5), radius: 1, ttl: 2.9, arm: 0.35, color: enemy.color, damage: enemy.damage });
      }
    } else if (enemy.mode === "miniBoss") {
      enemy.x += toPlayer.x * speed * 0.5 * dt;
      enemy.z += toPlayer.z * speed * 0.5 * dt;
      if (enemy.cooldown <= 0) {
        enemy.cooldown = 3.1 * battle.visual.projectileRate;
        const shots = battle.visualDensity === "high" ? 6 : 4;
        for (let i = 0; i < shots; i += 1) {
          const a = (i / shots) * Math.PI * 2;
          queueProjectile(battle, makeProjectile("enemy", enemy.x, 1.1, enemy.z, Math.cos(a) * 4.9, 0, Math.sin(a) * 4.9, enemy.damage * 0.65, enemy.projectileColor || enemy.color, enemy.projectileLabel || "King", enemy.type, 0.42), 0.45, { owner: "enemy", x: enemy.x + Math.cos(a) * 1.8, z: enemy.z + Math.sin(a) * 1.8, radius: 0.62, color: "#ee6656" });
        }
      }
    } else {
      enemy.x += toPlayer.x * speed * dt;
      enemy.z += toPlayer.z * speed * dt;
    }
    enemy.x = clamp(enemy.x, -ARENA_HALF + 0.55, ARENA_HALF - 0.55);
    enemy.z = clamp(enemy.z, -ARENA_HALF + 0.55, ARENA_HALF - 0.55);
  });
  separateUnits(battle.enemies, 0.62, 2.4, dt);
  battle.enemies = battle.enemies.filter((enemy) => {
    if (enemy.ttl != null && enemy.ttl <= 0 && enemy.hp > 0) {
      pushDamage(battle, { id: id("enemy-gone"), x: enemy.x, z: enemy.z, text: "gone", color: "#b8c2ce", ttl: 0.45 });
      recycleToPool(battle, "enemies", enemy);
      return false;
    }
    if (enemy.hp > 0) return true;
    battle.kills += 1;
    pushDamage(battle, { id: id("ko"), x: enemy.x, z: enemy.z, text: "KO", color: "#fff1a8", ttl: 0.75 });
    if (Math.random() < battle.difficulty.healChance) {
      const heal = Math.round(battle.player.maxHp * battle.difficulty.healAmount);
      battle.player.hp = clamp(battle.player.hp + heal, 0, battle.player.maxHp);
      battle.player.ult = clamp(battle.player.ult + battle.player.ultCost * 0.18 * battle.difficulty.ultCharge, 0, battle.player.ultCost);
      pushDamage(battle, { id: id("heal"), x: battle.player.x, z: battle.player.z, text: `+${heal}`, color: "#68c58a", ttl: 0.75 });
    }
    if (enemy.mode === "miniBoss") battle.wave += 1;
    recycleToPool(battle, "enemies", enemy);
    return false;
  });
  if (battle.enemies.length < 2 && mission.level >= 5 && Math.random() < dt * 0.2) {
    const elites = mission.boss.eliteEnemies || [mission.boss.eliteEnemy || mission.enemyPool[0]];
    spawnEnemy(battle, elites[Math.floor(Math.random() * elites.length)], mission.level);
  }
}

function updatePendingProjectiles(battle, dt) {
  battle.pendingProjectiles.forEach((pending) => {
    pending.ttl -= dt;
    if (pending.ttl <= 0) pushProjectile(battle, pending.projectile);
  });
  battle.pendingProjectiles = battle.pendingProjectiles.filter((pending) => pending.ttl > 0);
}

function impactHeroProjectile(battle, p, target, mission, emitSubtitle, boss = false) {
  p.hit = true;
  p.x = target.x;
  p.z = target.z;
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  if (boss) {
    battle.kashi.hp -= p.damage;
    pushDamage(battle, { id: id("bossdmg"), x: battle.kashi.x, z: battle.kashi.z, text: Math.round(p.damage), color: p.color, ttl: p.ultimate ? 0.82 : 0.65 });
    if (Math.random() < 0.18) speakBossLine(mission, "hurt", emitSubtitle);
  } else {
    target.hp -= p.damage;
    pushDamage(battle, { id: id("dmg"), x: target.x, z: target.z, text: Math.round(p.damage), color: p.color, ttl: p.ultimate ? 0.82 : 0.65 });
  }
  if (p.ultimate) {
    const radius = p.explosionRadius || 1.35;
    pushParticle(battle, { id: id("ult-impact"), x: p.x, z: p.z, color: p.color, ttl: 0.86, scale: p.impactScale || 1.15 });
    battle.traps.push({ id: id("ult-crater"), owner: "hero", x: p.x, z: p.z, radius, ttl: 0.28, arm: 0, color: p.color, damage: 0 });
    battle.enemies.forEach((enemy) => {
      if (!boss && enemy === target) return;
      if (distance(p, enemy) < radius + enemy.radius) {
        const splash = p.damage * 0.36;
        enemy.hp -= splash;
        pushDamage(battle, { id: id("splash"), x: enemy.x, z: enemy.z, text: Math.round(splash), color: p.color, ttl: 0.58 });
      }
    });
    if (!boss && distance(p, battle.kashi) < radius + 1.1) {
      const splash = p.damage * 0.32;
      battle.kashi.hp -= splash;
      pushDamage(battle, { id: id("bosssplash"), x: battle.kashi.x, z: battle.kashi.z, text: Math.round(splash), color: p.color, ttl: 0.58 });
    }
  }
  playCue(p.ultimate ? "boss" : "hit");
}

function updateProjectiles(battle, mission, emitSubtitle, dt) {
  battle.projectiles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.ttl -= dt;
    if (p.maxRange && distance({ x: p.startX, z: p.startZ }, p) > p.maxRange) {
      p.ttl = 0;
      if (p.ultimate) pushParticle(battle, { id: id("ult-miss"), x: p.x, z: p.z, color: "#b8c2ce", ttl: 0.34, scale: 0.45 });
    }
    if (p.label === "Rain" && p.y <= 0.18) {
      p.ttl = 0;
      battle.traps.push({ id: id("rain"), owner: "enemy", x: p.x, z: p.z, radius: 1.2, ttl: 0.72, arm: 0, color: p.color, damage: p.damage });
    }
    if (p.ttl <= 0) return;
    if (p.visualOnly) return;
    if (p.owner === "hero") {
      battle.enemies.forEach((enemy) => {
        if (!p.hit && distance(p, enemy) < enemy.radius + p.radius) {
          impactHeroProjectile(battle, p, enemy, mission, emitSubtitle, false);
        }
      });
      if (!p.hit && distance(p, battle.kashi) < 1.1 + p.radius) {
        impactHeroProjectile(battle, p, battle.kashi, mission, emitSubtitle, true);
      }
    } else {
      const summonTarget = battle.summons.find((summon) => summon.team === "ally" && distance(p, summon) < summon.radius + p.radius);
      if (summonTarget) {
        p.hit = true;
        summonTarget.hp -= p.damage;
        pushDamage(battle, { id: id("summon-hit"), x: summonTarget.x, z: summonTarget.z, text: Math.round(p.damage), color: "#ee6656", ttl: 0.55 });
      } else if (distance(p, battle.player) < 0.68 + p.radius) {
        p.hit = true;
        damagePlayer(battle, p.damage, emitSubtitle);
        if (p.label === "Bomb") battle.traps.push({ id: id("bomb"), owner: "enemy", x: p.x, z: p.z, radius: 1.25, ttl: 0.72, arm: 0, color: p.color, damage: p.damage * 0.55 });
      }
    }
  });
  battle.projectiles = battle.projectiles.filter((p) => {
    const keep = !p.hit && p.ttl > 0 && Math.abs(p.x) < ARENA_HALF + 3 && Math.abs(p.z) < ARENA_HALF + 3 && p.y > -0.3;
    if (!keep) recycleToPool(battle, "projectiles", p);
    return keep;
  });
}

function updateTraps(battle, dt) {
  battle.traps.forEach((trap) => {
    trap.ttl -= dt;
    trap.arm = Math.max(0, (trap.arm || 0) - dt);
    if (trap.arm <= 0) {
      if (trap.owner === "enemy") {
        if (distance(trap, battle.player) < trap.radius) damagePlayer(battle, trap.damage * dt, null, true);
        battle.summons.forEach((summon) => {
          if (summon.team === "ally" && distance(trap, summon) < trap.radius + summon.radius) summon.hp -= trap.damage * dt * 2.4;
        });
      }
      if (trap.owner === "hero") {
        if (distance(trap, battle.kashi) < trap.radius + 1.1) battle.kashi.hp -= trap.damage * dt;
        battle.enemies.forEach((enemy) => {
          if (trap.pull && distance(trap, enemy) < trap.radius + 2.6) {
            const dir = normalTo(enemy, trap);
            enemy.x += dir.x * trap.pull * dt;
            enemy.z += dir.z * trap.pull * dt;
          }
          if (distance(trap, enemy) < trap.radius + enemy.radius) enemy.hp -= trap.damage * dt;
        });
      }
    }
  });
  battle.traps = battle.traps.filter((trap) => trap.ttl > 0);
  battle.walls.forEach((wall) => wall.ttl -= dt);
  battle.walls = battle.walls.filter((wall) => wall.ttl > 0);
}

function updateVfx(battle, dt) {
  ["particles", "damage", "subtitles", "telegraphs"].forEach((key) => {
    battle[key].forEach((item) => item.ttl -= dt);
    if (key === "subtitles") {
      battle[key] = battle[key].filter((item) => item.ttl > 0);
    } else {
      filterWithPool(battle, key, (item) => item.ttl > 0);
    }
  });
}

function enforceBattleCaps(battle) {
  const projectileCap = battle.visual?.projectileCap || MAX_PROJECTILES;
  const allyCap = battle.visual?.alliedSummonCap || MAX_ALLIED_SUMMONS;
  const enemyCap = battle.visual?.enemyCap || MAX_ENEMY_SUMMONS;
  if (battle.projectiles.length > projectileCap) battle.projectiles = trimNewestWithPool(battle, "projectiles", projectileCap);
  if (battle.pendingProjectiles.length > projectileCap) battle.pendingProjectiles = trimNewest(battle.pendingProjectiles, projectileCap);
  if (battle.particles.length > Math.min(MAX_PARTICLES, battle.visual.maxParticles)) battle.particles = trimNewestWithPool(battle, "particles", Math.min(MAX_PARTICLES, battle.visual.maxParticles));
  if (battle.telegraphs.length > battle.visual.maxTelegraphs) battle.telegraphs = trimNewestWithPool(battle, "telegraphs", battle.visual.maxTelegraphs);
  const allies = battle.summons.filter((summon) => summon.team === "ally");
  if (allies.length > allyCap) {
    const keep = new Set(allies.sort((a, b) => b.spawnedAt - a.spawnedAt).slice(0, allyCap).map((summon) => summon.id));
    battle.summons = battle.summons.filter((summon) => {
      const shouldKeep = summon.team !== "ally" || keep.has(summon.id);
      if (!shouldKeep) recycleToPool(battle, "summons", summon);
      return shouldKeep;
    });
  }
  const enemyKeep = new Set([...battle.enemies].sort((a, b) => b.spawnedAt - a.spawnedAt).slice(0, enemyCap).map((enemy) => enemy.id));
  battle.enemies = battle.enemies.filter((enemy) => {
    const shouldKeep = enemyKeep.has(enemy.id);
    if (!shouldKeep) recycleToPool(battle, "enemies", enemy);
    return shouldKeep;
  });
  const bedouins = battle.enemies.filter((enemy) => enemy.type === "bedouinWarrior");
  if (bedouins.length > SUMMON_CAPS.bedouinWarrior) {
    const keep = new Set(bedouins.sort((a, b) => b.spawnedAt - a.spawnedAt).slice(0, SUMMON_CAPS.bedouinWarrior).map((enemy) => enemy.id));
    battle.enemies = battle.enemies.filter((enemy) => {
      const shouldKeep = enemy.type !== "bedouinWarrior" || keep.has(enemy.id);
      if (!shouldKeep) recycleToPool(battle, "enemies", enemy);
      return shouldKeep;
    });
  }
  const grapes = battle.enemies.filter((enemy) => enemy.type.startsWith("grape") || enemy.type === "vineSoldier");
  if (grapes.length > SUMMON_CAPS.grapeArmy) {
    const keep = new Set(grapes.sort((a, b) => b.spawnedAt - a.spawnedAt).slice(0, SUMMON_CAPS.grapeArmy).map((enemy) => enemy.id));
    battle.enemies = battle.enemies.filter((enemy) => {
      const isGrape = enemy.type.startsWith("grape") || enemy.type === "vineSoldier";
      const shouldKeep = !isGrape || keep.has(enemy.id);
      if (!shouldKeep) recycleToPool(battle, "enemies", enemy);
      return shouldKeep;
    });
  }
}

function damagePlayer(battle, amount, emitSubtitle, soft = false) {
  if (soft) {
    if (battle.player.softTick > 0) return;
    battle.player.softTick = 0.28;
    amount = clamp(amount * 4, 2, 5);
  } else if (battle.player.invuln > 0) {
    return;
  }
  battle.player.hp = Math.max(0, battle.player.hp - amount);
  if (!soft) battle.player.invuln = 0.42;
  pushDamage(battle, { id: id("hurt"), x: battle.player.x, z: battle.player.z, text: Math.max(1, Math.round(amount)), color: "#ee6656", ttl: 0.65 });
  if (!soft) playCue("hit");
  if (!soft && Math.random() < 0.28) speakLine(battle.activeId || "tal", "hurt", emitSubtitle);
}

function damageHeroSideTarget(battle, target, amount, emitSubtitle, soft = false) {
  if (target.team === "ally") {
    target.hp = Math.max(0, target.hp - amount * (soft ? 3.2 : 1));
    target.attackPulse = 0.12;
    return;
  }
  damagePlayer(battle, amount, emitSubtitle, soft);
}

function nearestHeroSideTarget(battle, origin) {
  let target = battle.player;
  let best = distance(origin, battle.player);
  battle.summons.forEach((summon) => {
    if (summon.team !== "ally") return;
    const d = distance(origin, summon);
    if (d < best && d < 4.8) {
      target = summon;
      best = d;
    }
  });
  return target;
}

function nearestTarget(battle) {
  return nearestTargetFrom(battle, battle.player);
}

function nearestTargetFrom(battle, origin) {
  let target = battle.kashi;
  let best = distance(origin, battle.kashi);
  battle.enemies.forEach((enemy) => {
    const d = distance(origin, enemy);
    if (d < best) {
      target = enemy;
      best = d;
    }
  });
  return target;
}

function summonHeroArmy(battle, heroId, type, count, power, spread = 1.75) {
  const cap = Math.min(count, SUMMON_CAPS[type] || MAX_ALLIED_SUMMONS, MAX_ALLIED_SUMMONS);
  for (let i = 0; i < cap; i += 1) {
    const angle = (i / cap) * Math.PI * 2 + (heroId.length % 3) * 0.16;
    const ring = spread + (i % 2) * 0.32;
    addAlliedSummon(battle, type, heroId, battle.player.x + Math.cos(angle) * ring, battle.player.z + Math.sin(angle) * ring, angle, power);
  }
}

function applyHeroUltimate(battle, hero, stats, power) {
  const center = { x: battle.kashi.x, z: battle.kashi.z };
  const aim = normalTo(battle.player, battle.kashi);
  if (hero.id === "mendel") {
    summonHeroArmy(battle, hero.id, "monkey", 6, stats.ultimatePower);
  } else if (hero.id === "goodman") {
    summonHeroArmy(battle, hero.id, "consultant", 4, stats.ultimatePower);
    battle.traps.push({ id: id("finance-crisis"), owner: "hero", x: center.x, z: center.z, radius: 3.2, ttl: 1.15, arm: 0.08, color: "#e8d8ad", damage: 0 });
    battle.enemies.forEach((enemy) => enemy.stun = Math.max(enemy.stun || 0, 1.1));
  } else if (hero.id === "giat") {
    summonHeroArmy(battle, hero.id, "discount", 6, stats.ultimatePower, 1.95);
    battle.enemies.forEach((enemy) => {
      enemy.x = THREE.MathUtils.randFloatSpread(11);
      enemy.z = THREE.MathUtils.randFloatSpread(11);
    });
    battle.traps.push({ id: id("low-cost"), owner: "hero", x: center.x, z: center.z, radius: 4, ttl: 1.6, arm: 0, color: "#58c7a6", damage: 0, pull: -1.5 });
  } else if (hero.id === "farber") {
    summonHeroArmy(battle, hero.id, "mechanic", 4, stats.ultimatePower);
    battle.player.invuln = Math.max(battle.player.invuln, 1.1);
    battle.player.x = clamp(battle.player.x + aim.x * 3.7, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.player.z = clamp(battle.player.z + aim.z * 3.7, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.traps.push({ id: id("garage-charge"), owner: "hero", x: battle.player.x, z: battle.player.z, radius: 2.1, ttl: 0.95, arm: 0, color: "#c97848", damage: 0 });
  } else if (hero.id === "aviad") {
    summonHeroArmy(battle, hero.id, "reserve", 4, stats.ultimatePower);
  } else if (hero.id === "david") {
    summonHeroArmy(battle, hero.id, "drone", 5, stats.ultimatePower, 1.95);
    battle.traps.push({ id: id("ai-field"), owner: "hero", x: center.x, z: center.z, radius: 3.8, ttl: 1.55, arm: 0, color: "#85d6ff", damage: 0, pull: 1.8 });
    battle.enemies.forEach((enemy) => enemy.cooldown += 1.6);
  } else if (hero.id === "amichai") {
    summonHeroArmy(battle, hero.id, "soccer", 5, stats.ultimatePower);
    battle.player.invuln = Math.max(battle.player.invuln, 2.4);
    battle.player.x = clamp(battle.player.x + aim.x * 4.2, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.player.z = clamp(battle.player.z + aim.z * 4.2, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.traps.push({ id: id("soccer"), owner: "hero", x: battle.player.x, z: battle.player.z, radius: 2.7, ttl: 1.05, arm: 0, color: "#4fb46f", damage: 0 });
  } else if (hero.id === "halel") {
    summonHeroArmy(battle, hero.id, "rider", 4, stats.ultimatePower);
    battle.player.invuln = Math.max(battle.player.invuln, 1.4);
    for (let i = 1; i <= 4; i += 1) battle.traps.push({ id: id("ride"), owner: "hero", x: battle.player.x + aim.x * i * 1.35, z: battle.player.z + aim.z * i * 1.35, radius: 0.95, ttl: 0.95, arm: i * 0.04, color: "#9b78de", damage: 0 });
    battle.player.x = clamp(battle.player.x + aim.x * 3.2, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
    battle.player.z = clamp(battle.player.z + aim.z * 3.2, -ARENA_HALF + 0.7, ARENA_HALF - 0.7);
  } else if (hero.id === "hadar") {
    summonHeroArmy(battle, hero.id, "cleaner", 4, stats.ultimatePower);
    battle.traps.push({ id: id("washer"), owner: "hero", x: center.x, z: center.z, radius: 4.4, ttl: 2.2, arm: 0, color: "#ff9fc0", damage: 0, pull: 3 });
    battle.enemies.forEach((enemy) => enemy.cooldown += 1.25);
  } else if (hero.id === "tal") {
    summonHeroArmy(battle, hero.id, "presentation", 4, stats.ultimatePower);
    battle.traps.push({ id: id("debate"), owner: "hero", x: center.x, z: center.z, radius: 3.7, ttl: 1.3, arm: 0, color: "#ff8f52", damage: 0, pull: 0.9 });
  } else if (hero.id === "amit") {
    summonHeroArmy(battle, hero.id, "rabbi", 4, stats.ultimatePower);
    battle.player.hp = battle.player.maxHp;
    battle.player.invuln = Math.max(battle.player.invuln, 2.2);
    battle.traps.push({ id: id("rabbi"), owner: "hero", x: battle.player.x, z: battle.player.z, radius: 3.4, ttl: 1.6, arm: 0, color: "#8ba3ff", damage: 0, pull: 0.8 });
  } else if (hero.id === "gelman") {
    summonHeroArmy(battle, hero.id, "investor", 4, stats.ultimatePower);
    battle.traps.push({ id: id("money"), owner: "hero", x: center.x, z: center.z, radius: 4, ttl: 1.35, arm: 0, color: "#f5c451", damage: 0 });
  } else if (hero.id === "kuzar") {
    summonHeroArmy(battle, hero.id, "agig", 4, stats.ultimatePower);
    battle.traps.push({ id: id("agig"), owner: "hero", x: center.x, z: center.z, radius: 5.2, ttl: 1.25, arm: 0, color: "#68c58a", damage: 0 });
  } else if (hero.id === "dan") {
    summonHeroArmy(battle, hero.id, "guardian", 3, stats.ultimatePower, 2.05);
    battle.player.hp = battle.player.maxHp;
    battle.player.invuln = Math.max(battle.player.invuln, 3);
    battle.traps.push({ id: id("portal"), owner: "hero", x: center.x, z: center.z, radius: 5.8, ttl: 1.7, arm: 0, color: "#fff1a8", damage: 0, pull: 2.4 });
  } else if (hero.id === "bruiner") {
    summonHeroArmy(battle, hero.id, "sleeper", 4, stats.ultimatePower);
    battle.traps.push({ id: id("napquake"), owner: "hero", x: center.x, z: center.z, radius: 3.6, ttl: 1.45, arm: 0, color: "#b78cff", damage: 0, pull: 2.2 });
    battle.enemies.forEach((enemy) => enemy.cooldown += 1.8);
  }
  enforceBattleCaps(battle);
}

function emitUltimateProjectiles(battle, hero, stats) {
  const signature = HERO_PROJECTILE_SIGNATURES[hero.id] || HERO_PROJECTILE_SIGNATURES.tal;
  const count = hero.id === "dan" ? 8 : ["mendel", "gelman", "kuzar"].includes(hero.id) ? 7 : 5;
  const target = battle.kashi;
  const projectileDamage = stats.attack * stats.ultimatePower * (hero.id === "dan" ? 1.38 : hero.id === "mendel" ? 1.15 : 0.95);
  const explosionRadius = hero.id === "dan" ? 2.25 : ["mendel", "kuzar", "gelman", "giat"].includes(hero.id) ? 1.65 : 1.35;
  for (let i = 0; i < count; i += 1) {
    const fan = (i - (count - 1) / 2) * 0.18;
    const baseAngle = Math.atan2(target.z - battle.player.z, target.x - battle.player.x) + fan;
    const start = { x: battle.player.x + Math.cos(baseAngle) * 0.72, z: battle.player.z + Math.sin(baseAngle) * 0.72 };
    const speed = hero.id === "dan" ? 7.4 : 6.4;
    pushProjectile(battle, makeProjectile(
      "hero",
      start.x,
      hero.id === "dan" ? 1.35 : 1.18,
      start.z,
      Math.cos(baseAngle) * speed,
      0,
      Math.sin(baseAngle) * speed,
      projectileDamage,
      hero.color,
      hero.ultimate,
      hero.id,
      Math.max(0.46, signature.radius || 0.42),
      { variant: "ultimate", ultimate: true, explosionRadius, impactScale: hero.id === "dan" ? 1.8 : 1.1, ttl: 1.9 + i * 0.05, maxRange: 10.6 }
    ));
  }
}

function projectileSignature(owner, source, label = "", options = {}) {
  const lowerLabel = String(label || "").toLowerCase();
  let signature = null;
  if (options.kind) signature = { kind: options.kind };
  else if (owner === "hero" && HERO_PROJECTILE_SIGNATURES[source]) {
    const hero = HERO_PROJECTILE_SIGNATURES[source];
    signature = { ...hero, kind: options.variant === "ultimate" ? hero.ultimateKind || hero.kind : hero.kind };
  } else if (owner === "hero" && SUMMON_PROJECTILE_SIGNATURES[source]) {
    signature = SUMMON_PROJECTILE_SIGNATURES[source];
  } else if (source === "kashi") {
    signature = lowerLabel.includes("deadline") || lowerLabel.includes("duty")
      ? { kind: "deadline", radius: 0.48 }
      : lowerLabel.includes("rain")
        ? { kind: "paperwork", radius: 0.72 }
        : lowerLabel.includes("task")
          ? { kind: "choreList", radius: 0.46 }
          : { kind: "assignment", radius: 0.46 };
  } else if (owner === "enemy" && ENEMY_PROJECTILE_SIGNATURES[source]) {
    signature = ENEMY_PROJECTILE_SIGNATURES[source];
  }
  if (!signature) {
    signature = owner === "hero" ? { kind: "energyBolt", radius: 0.38 } : { kind: "paperwork", radius: 0.42 };
  }
  const kindDefaults = PROJECTILE_KIND_DEFAULTS[signature.kind] || PROJECTILE_KIND_DEFAULTS.paperwork;
  const sourceColor = options.color || signature.color || kindDefaults.color;
  return {
    ...kindDefaults,
    ...signature,
    color: options.color || signature.color || kindDefaults.color,
    accent: options.accent || sourceColor || signature.accent || kindDefaults.accent,
    aura: options.aura || signature.aura || kindDefaults.aura,
    label: options.label || signature.label || label,
    variant: options.variant || "basic"
  };
}

function makeProjectile(owner, x, y, z, vx, vy, vz, damage, color, label, source, radius = 0.28, options = {}) {
  const signature = projectileSignature(owner, source, label, options);
  const readableRadius = Math.max(owner === "hero" ? 0.34 : 0.38, options.radius || signature.radius || radius);
  return {
    id: id("proj"),
    owner,
    x,
    y,
    z,
    vx,
    vy,
    vz,
    damage,
    color: signature.color,
    accent: signature.accent,
    aura: signature.aura,
    kind: signature.kind,
    variant: signature.variant,
    label: signature.label,
    source,
    radius: readableRadius,
    startX: x,
    startZ: z,
    maxRange: options.maxRange || null,
    ultimate: !!options.ultimate,
    explosionRadius: options.explosionRadius || 0,
    impactScale: options.impactScale || 1,
    pierce: !!options.pierce,
    ttl: options.ttl || 3.4,
    hit: false,
    visualOnly: !!options.visualOnly
  };
}

function DevArenaTools({ onSpawnBoss, onSpawnEnemies, onUltimate, onRestart }) {
  return (
    <div className="dev-arena-tools">
      <button onClick={onSpawnBoss}><Crown size={15} /> Spawn Boss</button>
      <button onClick={onSpawnEnemies}><Users size={15} /> Spawn Enemies</button>
      <button onClick={onUltimate}><Zap size={15} /> Test Ultimate</button>
      <button onClick={onRestart}><RotateCcw size={15} /> Restart World</button>
    </div>
  );
}

function ArenaHud({ snapshot, mission, activeHero, party, save, onPause, onSwap, onBasic, onSpecial, onAbilityTwo, onDodge, onUltimate, setTouch, inputRef }) {
  const padRef = useRef(null);
  const knobRef = useRef(null);
  const combos = activeCombos(party);
  const seasonOne = mission.season === 1;
  const basicReady = snapshot.cooldowns.basic <= 0;
  const specialReady = snapshot.cooldowns.special <= 0;
  const abilityTwoReady = snapshot.cooldowns.ability2 <= 0;
  const dodgeReady = snapshot.cooldowns.dodge <= 0;
  const ultimateReady = snapshot.player.ult >= snapshot.player.ultCost;
  return (
    <section className="arena-ui">
      <div className="battle-top">
        <div className="hud-card hero-status">
          <Portrait3D hero={activeHero} />
          <div>
            <small>{activeHero.name}</small>
            <strong>{mission.title}</strong>
            <div className="bar"><span style={{ width: pct(snapshot.player.hp, snapshot.player.maxHp) }} /></div>
            <div className="bar ult"><span style={{ width: pct(snapshot.player.ult, snapshot.player.ultCost) }} /></div>
          </div>
        </div>
        <div className="boss-card">
          <span>Phase {snapshot.phase}: {bossPhaseLabel(mission, snapshot.phase)}</span>
          <strong>{mission.boss.name}</strong>
          <div className="boss-bar"><span style={{ width: pct(snapshot.kashi.hp, snapshot.kashi.maxHp) }} /></div>
        </div>
        <button className="pause-fab" onClick={onPause}><Pause size={19} /></button>
      </div>
      <div className="combo-indicator">
        {seasonOne ? <span>Solo Rescue: {activeHero.name}</span> : combos.length ? combos.map((combo) => <span key={combo.id} style={{ "--combo": combo.color }}>{combo.name}</span>) : <span>No Combo Active</span>}
        <b>Wave {snapshot.wave} / KOs {snapshot.kills}</b>
      </div>
      <div className="control-hint">WASD move · Left Click attack · Q skill · E ability 2 · R ultimate · Shift dodge · Tab stats · Esc pause</div>
      <div className="touch-controls">
        <div
          ref={padRef}
          className="move-pad"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setTouch(event, padRef.current, knobRef.current);
          }}
          onPointerMove={(event) => setTouch(event, padRef.current, knobRef.current)}
          onPointerUp={() => {
            inputRef.current.touch = { x: 0, z: 0 };
            if (knobRef.current) knobRef.current.style.transform = "translate3d(0,0,0)";
          }}
        >
          <span ref={knobRef} className="move-knob" />
        </div>
        <div className="action-pad">
          <button className={`round-button ${party.length <= 1 ? "cooling" : ""}`} disabled={party.length <= 1} onPointerDown={onSwap}><Users size={22} /><small>{party.length <= 1 ? "Solo" : "Swap"}</small></button>
          <button className={`round-button ${specialReady ? "" : "cooling"}`} onPointerDown={onSpecial}><Sparkles size={24} /><small>{specialReady ? "Skill" : snapshot.cooldowns.special.toFixed(1)}</small></button>
          <button className={`round-button ${abilityTwoReady ? "" : "cooling"}`} onPointerDown={onAbilityTwo}><WandSparkles size={23} /><small>{abilityTwoReady ? "A2" : snapshot.cooldowns.ability2.toFixed(1)}</small></button>
          <button className={`round-button ${dodgeReady ? "" : "cooling"}`} onPointerDown={onDodge}><Shield size={23} /><small>{dodgeReady ? "Dash" : snapshot.cooldowns.dodge.toFixed(1)}</small></button>
          <button className={`round-button ultimate ${ultimateReady ? "ready" : ""}`} onPointerDown={onUltimate}><Zap size={25} /><small>Ult</small></button>
          <button
            className={`round-button attack ${basicReady ? "" : "cooling"}`}
            onPointerDown={() => {
              inputRef.current.attackHeld = true;
              onBasic();
            }}
            onPointerUp={() => {
              inputRef.current.attackHeld = false;
            }}
            onPointerCancel={() => {
              inputRef.current.attackHeld = false;
            }}
          >
            <Swords size={28} /><small>Fire</small>
          </button>
        </div>
      </div>
    </section>
  );
}

function HeroStatsPanel({ activeHero, snapshot, party, save }) {
  const stats = computeHeroStats(activeHero.id, save, party);
  return (
    <div className="stats-panel motion-item">
      <div className="detail-top compact">
        <Portrait3D hero={activeHero} />
        <div>
          <h3>{activeHero.name}</h3>
          <small>{activeHero.passive}</small>
        </div>
      </div>
      <div className="stats-list">
        <span>HP <b>{Math.ceil(snapshot.player.hp)} / {snapshot.player.maxHp}</b></span>
        <span>Attack <b>{Math.round(stats.attack)}</b></span>
        <span>Speed <b>{Math.round(stats.speed)}</b></span>
        <span>Ultimate <b>{Math.round(snapshot.player.ult)} / {Math.round(snapshot.player.ultCost)}</b></span>
      </div>
    </div>
  );
}

function BossCinematic({ cinematic }) {
  return (
    <div className="cinematic-banner motion-item">
      <strong>{cinematic.title}</strong>
      <span>{cinematic.line}</span>
    </div>
  );
}

function ArenaWorld({ mission, phase, density = "low", combatPressure = 0 }) {
  const theme = MAP_THEMES[mission.map] || MAP_THEMES.grapeFields;
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const base = `#${theme.base.toString(16).padStart(6, "0")}`;
  const mid = `#${theme.mid.toString(16).padStart(6, "0")}`;
  const isDadKingdom = mission.map === "dadKingdom";
  const pressured = combatPressure > 8 && density !== "high";
  const arenaSegments = density === "high" && !pressured ? 64 : 40;
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <mesh receiveShadow rotation-x={-Math.PI / 2}>
          <planeGeometry args={[ARENA, ARENA, 2, 2]} />
          <meshStandardMaterial color={base} roughness={isDadKingdom ? 0.62 : 0.75} />
        </mesh>
        <CuboidCollider args={[ARENA_HALF, 0.2, 0.18]} position={[0, 0.2, -ARENA_HALF]} />
        <CuboidCollider args={[ARENA_HALF, 0.2, 0.18]} position={[0, 0.2, ARENA_HALF]} />
        <CuboidCollider args={[0.18, 0.2, ARENA_HALF]} position={[-ARENA_HALF, 0.2, 0]} />
        <CuboidCollider args={[0.18, 0.2, ARENA_HALF]} position={[ARENA_HALF, 0.2, 0]} />
      </RigidBody>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[ARENA_HALF - 0.8, ARENA_HALF - 0.68, arenaSegments]} />
        <meshBasicMaterial color={isDadKingdom ? "#ffe4a0" : phase >= 3 ? "#8e44ad" : mid} transparent opacity={isDadKingdom ? 0.45 : 0.75} />
      </mesh>
      {isDadKingdom ? <DadKingdomWorld phase={phase} density={density} combatPressure={combatPressure} /> : <QualityWorld mission={mission} phase={phase} density={density} combatPressure={combatPressure} />}
      {phase >= 4 && !isDadKingdom && density === "high" && <DreiSparkles count={Math.round(130 * visual.ambientSparkles)} scale={[14, 3.2, 14]} position={[0, 1.4, 0]} color="#b68cff" speed={0.42} opacity={0.55} />}
      {isDadKingdom && density === "high" && <DreiSparkles count={Math.round(70 * visual.ambientSparkles)} scale={[15, 2.3, 15]} position={[0, 1.1, 0]} color={phase >= 3 ? "#d8f56f" : "#fff1a8"} speed={0.28} opacity={0.36} />}
    </group>
  );
}

const MemoArenaWorld = React.memo(ArenaWorld);

function ArenaProps({ map }) {
  const items = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ x: ((i * 5.7) % 15) - 7, z: ((i * 3.9) % 15) - 7, s: 0.55 + (i % 4) * 0.12 })), []);
  const label = MAP_THEMES[map]?.label || "DAN QUEST ARENA";
  return (
    <group>
      {items.map((item, index) => {
        if (map === "jungle" || map === "bedouinDesert") return index % 3 ? <TreeProp key={index} position={[item.x, 0, item.z]} scale={item.s} /> : <CrateProp key={index} position={[item.x, 0, item.z]} scale={item.s} />;
        if (["workEmpire", "presentationEmpire", "debateRepublic", "aiNexus", "dateDimension", "otherFriendGroup"].includes(map)) return <OfficeProp key={index} position={[item.x, 0, item.z]} scale={item.s} />;
        if (["military", "casinoKingdom", "luxuryKingdom", "dadKingdom", "footballMarket", "familyKingdom", "momsKingdom", "partyDimension", "comfortKingdom"].includes(map)) return <CrateProp key={index} position={[item.x, 0, item.z]} scale={item.s} />;
        if (map === "darkVineyard" || map === "darkKashi") return <VineProp key={index} position={[item.x, 0, item.z]} scale={item.s} dark />;
        if (map === "castle") return index % 2 ? <OfficeProp key={index} position={[item.x, 0, item.z]} scale={item.s} /> : <VineProp key={index} position={[item.x, 0, item.z]} scale={item.s} dark />;
        return <VineProp key={index} position={[item.x, 0, item.z]} scale={item.s} />;
      })}
      <Billboard position={[-6.4, 1.2, -7.4]}><Text fontSize={0.35} color="#f8f3df" anchorX="left">{label}</Text></Billboard>
    </group>
  );
}

function budgetedWorldItems(items, visual, min = 6) {
  const count = clamp(Math.ceil(items.length * visual.propBudget), Math.min(min, items.length), items.length);
  return items.slice(0, count);
}

function buildQualityClutter(map, kit, density, combatPressure = 0) {
  const source = [...(kit.props || []), ...(kit.landmarks || [])];
  if (!source.length) return [];
  const baseCount = density === "high" ? 18 : density === "medium" ? 12 : 5;
  const count = combatPressure > 8 && density !== "high" ? Math.max(7, baseCount - 3) : baseCount;
  const seed = [...map].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const detailShapes = ["sign", "stack", "table", "screen", "market", "rack", "soft", "core", "goal", "portal"];
  return Array.from({ length: count }, (_, index) => {
    const src = source[(index + seed) % source.length];
    const shape = detailShapes[(index + seed) % detailShapes.length] || src[0];
    let x = (((index * 5.17 + seed * 0.31) % 15.2) - 7.6);
    let z = (((index * 3.73 + seed * 0.19) % 15.2) - 7.6);
    if (Math.abs(x) < 1.5 && Math.abs(z) < 1.5) {
      x += x >= 0 ? 2.2 : -2.2;
      z += z >= 0 ? 1.7 : -1.7;
    }
    if (x > 4.2 && Math.abs(z) < 2.25) z += z >= 0 ? 2.1 : -2.1;
    const label = density === "low" ? "" : String(src[4] || "").split(" ").slice(0, 2).join(" ");
    const scale = clamp((src[3] || 1) * (density === "high" ? 0.62 : 0.52), 0.42, 0.78);
    return [shape, x, z, scale, label, src[5] || "#f5c451", src[6] || "#f8f3df", (index % 7 - 3) * 0.16];
  });
}

function QualityWorld({ mission, phase, density = DEFAULT_QUALITY, combatPressure = 0 }) {
  const kit = WORLD_QUALITY_KITS[mission.map] || WORLD_QUALITY_KITS.presentationEmpire;
  const baseVisual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const visual = combatPressure > 8 && density !== "high" ? { ...baseVisual, propBudget: Math.max(0.78, baseVisual.propBudget), ambientSparkles: Math.min(baseVisual.ambientSparkles, 0.24) } : baseVisual;
  const theme = MAP_THEMES[mission.map] || MAP_THEMES.presentationEmpire;
  const accent = `#${theme.accent.toString(16).padStart(6, "0")}`;
  const districtCount = density === "low" ? 3 : 4;
  const showMinorLabels = density !== "low";
  const props = budgetedWorldItems(kit.props || [], visual, 5);
  const clutter = useMemo(() => buildQualityClutter(mission.map, kit, density, combatPressure), [combatPressure, density, kit, mission.map]);
  return (
    <group>
      {(kit.districts || []).slice(0, districtCount).map(([x, z, w, d, color, opacity, label], index) => (
        <DistrictPatch key={`district-${mission.map}-${index}`} position={[x, 0.031 + index * 0.002, z]} size={[w, d]} color={color} opacity={opacity} label={showMinorLabels ? label : ""} />
      ))}
      <PathStrip position={[0, 0.045, 0]} size={[16.1, 0.92]} color={accent} opacity={0.32} />
      <PathStrip position={[0, 0.046, 0]} size={[0.92, 16.1]} color={accent} opacity={0.28} />
      <mesh position={[0, 0.057, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.02, 1.19, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.34} />
      </mesh>
      {(kit.landmarks || []).map((item, index) => <ThemedSetPiece key={`landmark-${mission.map}-${index}`} item={item} landmark density={density} />)}
      {props.map((item, index) => <ThemedSetPiece key={`prop-${mission.map}-${index}`} item={item} density={density} />)}
      {clutter.map((item, index) => <ThemedSetPiece key={`clutter-${mission.map}-${index}`} item={item} density={density} />)}
      {phase >= 3 && <BossArenaMarker color={accent} phase={phase} density={density} />}
      {showMinorLabels && <WorldAmbientLabels cues={kit.ambient || []} accent={accent} density={density} />}
      {density === "high" && <DreiSparkles count={Math.round(42 * visual.ambientSparkles)} scale={[14.2, 2, 14.2]} position={[0, 1.1, 0]} color={accent} speed={0.26} opacity={0.34} />}
      <Billboard position={[0, 1.52, 7.95]}>
        <Text fontSize={0.31} color="#f8f3df" outlineWidth={0.024} outlineColor="#10151f">{mission.title.toUpperCase()}</Text>
      </Billboard>
    </group>
  );
}

function BossArenaMarker({ color, phase, density }) {
  const radius = density === "low" ? 1.5 : 1.85;
  return (
    <group position={[5.85, 0.075, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius, radius + 0.16, 48]} />
        <meshBasicMaterial color="#ee6656" transparent opacity={0.44} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius + 0.22, radius + 0.32, 48]} />
        <meshBasicMaterial color={color} transparent opacity={phase >= 4 ? 0.55 : 0.34} />
      </mesh>
    </group>
  );
}

function WorldAmbientLabels({ cues, accent, density }) {
  if (!cues.length) return null;
  const shown = cues.slice(0, density === "high" ? 3 : 2);
  return (
    <group>
      {shown.map((cue, index) => (
        <Billboard key={cue} position={[-6.7 + index * 6.7, 1.36 + (index % 2) * 0.16, -7.8 + index * 0.35]}>
          <Text fontSize={0.13} color="#f8f3df" outlineWidth={0.012} outlineColor="#10151f">{cue}</Text>
        </Billboard>
      ))}
      {density === "high" && <DreiSparkles count={12} scale={[10, 1.2, 1]} position={[0, 1.15, -7.2]} color={accent} speed={0.2} opacity={0.28} />}
    </group>
  );
}

function ThemedSetPiece({ item, landmark = false, density = DEFAULT_QUALITY }) {
  const [shape, x, z, scale = 1, label = "", color = "#f5c451", accent = "#f8f3df", rotation = 0] = item;
  const labelSize = landmark ? (label.length > 16 ? 0.13 : 0.16) : (label.length > 9 ? 0.1 : 0.12);
  const showLabel = landmark || density !== "low";
  return (
    <group position={[x, 0, z]} rotation-y={rotation} scale={scale}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
        <circleGeometry args={[landmark ? 0.96 : 0.62, 28]} />
        <meshBasicMaterial color="#050813" transparent opacity={0.18} />
      </mesh>
      <SetPieceBody shape={shape} label={label} color={color} accent={accent} landmark={landmark} density={density} />
      {showLabel && (
        <Billboard position={[0, landmark ? 1.82 : 1.24, 0]}>
          <Text fontSize={labelSize} color="#f8f3df" outlineWidth={0.014} outlineColor="#10151f">{label}</Text>
        </Billboard>
      )}
    </group>
  );
}

function SetPieceBody({ shape, label, color, accent, landmark, density }) {
  const sparkCount = density === "high" ? (landmark ? 18 : 8) : density === "medium" && landmark ? 8 : 0;
  if (shape === "tower") {
    return (
      <group>
        <mesh castShadow position={[0, 0.34, 0]}><cylinderGeometry args={[0.22, 0.3, 0.68, 12]} /><meshStandardMaterial color={accent} roughness={0.58} /></mesh>
        {[0, 1, 2].map((level) => (
          <mesh key={level} castShadow position={[0, 0.72 + level * 0.34, 0]} rotation-y={level * 0.22}>
            <boxGeometry args={[landmark ? 0.92 : 0.68, 0.24, landmark ? 0.62 : 0.46]} />
            <meshStandardMaterial color={level % 2 ? accent : color} roughness={0.58} />
          </mesh>
        ))}
        <Billboard position={[0, 1.28, 0.32]}><Text fontSize={0.1} color="#10151f">{label.split(" ")[0]}</Text></Billboard>
      </group>
    );
  }
  if (shape === "table") {
    return (
      <group>
        <mesh castShadow position={[0, 0.48, 0]}><cylinderGeometry args={[landmark ? 0.62 : 0.44, landmark ? 0.7 : 0.52, 0.2, 18]} /><meshStandardMaterial color={color} roughness={0.52} /></mesh>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, index) => (
          <mesh key={index} castShadow position={[Math.cos(angle) * 0.72, 0.32, Math.sin(angle) * 0.72]}><cylinderGeometry args={[0.12, 0.14, 0.28, 10]} /><meshStandardMaterial color={accent} roughness={0.64} /></mesh>
        ))}
        <mesh position={[0, 0.63, 0]}><boxGeometry args={[0.56, 0.04, 0.3]} /><meshStandardMaterial color="#f8f3df" /></mesh>
      </group>
    );
  }
  if (shape === "stack") {
    return (
      <group>
        {[[0, 0.2, 0], [0.26, 0.38, 0.05], [-0.25, 0.54, -0.04], [0.08, 0.72, 0.08]].map((pos, index) => (
          <mesh key={index} castShadow position={pos} rotation-y={index * 0.24} rotation-z={(index - 1.5) * 0.08}>
            <boxGeometry args={[landmark ? 0.72 : 0.52, 0.18, landmark ? 0.52 : 0.38]} />
            <meshStandardMaterial color={index % 2 ? accent : color} roughness={0.76} />
          </mesh>
        ))}
      </group>
    );
  }
  if (shape === "podium") {
    return (
      <group>
        <mesh castShadow position={[0, 0.48, 0]}><boxGeometry args={[landmark ? 0.9 : 0.62, 0.78, landmark ? 0.58 : 0.42]} /><meshStandardMaterial color={color} roughness={0.58} /></mesh>
        <mesh position={[0, 0.78, -0.24]}><boxGeometry args={[landmark ? 0.72 : 0.46, 0.14, 0.06]} /><meshStandardMaterial color={accent} /></mesh>
        <mesh position={[0.28, 0.98, -0.22]} rotation-z={-0.45}><cylinderGeometry args={[0.018, 0.018, 0.36, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[0.42, 1.12, -0.22]}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color="#10151f" /></mesh>
      </group>
    );
  }
  if (shape === "tent") {
    return (
      <group>
        <mesh castShadow position={[0, 0.42, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[landmark ? 0.9 : 0.58, landmark ? 0.86 : 0.58, 4]} /><meshStandardMaterial color={color} roughness={0.72} /></mesh>
        <mesh position={[0, 0.22, -0.24]}><boxGeometry args={[landmark ? 0.55 : 0.34, 0.24, 0.035]} /><meshStandardMaterial color={accent} /></mesh>
      </group>
    );
  }
  if (shape === "soft") {
    return (
      <group>
        <mesh castShadow position={[0, 0.28, 0]}><sphereGeometry args={[landmark ? 0.62 : 0.44, 16, 16]} /><meshStandardMaterial color={color} roughness={0.72} /></mesh>
        <mesh castShadow position={[0.34, 0.34, 0.08]}><sphereGeometry args={[landmark ? 0.42 : 0.3, 14, 14]} /><meshStandardMaterial color={accent} roughness={0.7} /></mesh>
        <mesh castShadow position={[-0.35, 0.32, -0.06]}><sphereGeometry args={[landmark ? 0.38 : 0.28, 14, 14]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
        {label.includes("MONKEY") && (
          <>
            <mesh position={[-0.28, 0.82, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color={accent} /></mesh>
            <mesh position={[0.28, 0.82, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshStandardMaterial color={accent} /></mesh>
          </>
        )}
      </group>
    );
  }
  if (shape === "portal") {
    return (
      <group>
        <mesh castShadow position={[0, 0.82, 0]} rotation-y={Math.PI / 2}><torusGeometry args={[landmark ? 0.62 : 0.42, 0.06, 10, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} /></mesh>
        <mesh position={[0, 0.82, 0]} rotation-y={Math.PI / 2}><torusGeometry args={[landmark ? 0.38 : 0.26, 0.026, 8, 28]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.24} /></mesh>
        <mesh castShadow position={[0, 0.14, 0]}><cylinderGeometry args={[0.55, 0.7, 0.18, 18]} /><meshStandardMaterial color={accent} roughness={0.62} /></mesh>
        {sparkCount > 0 && <DreiSparkles count={sparkCount} scale={[1.05, 1.15, 1.05]} color={accent} speed={0.46} />}
      </group>
    );
  }
  if (shape === "screen") {
    return (
      <group>
        <mesh castShadow position={[0, 0.72, 0]}><boxGeometry args={[landmark ? 1.08 : 0.72, landmark ? 0.78 : 0.52, 0.08]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} roughness={0.46} /></mesh>
        <mesh position={[0, 0.72, 0.055]}><boxGeometry args={[landmark ? 0.84 : 0.54, landmark ? 0.48 : 0.3, 0.035]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.1} /></mesh>
        <Billboard position={[0, 0.72, 0.1]}><Text fontSize={landmark ? 0.12 : 0.08} color="#10151f">{label.split(" ")[0]}</Text></Billboard>
      </group>
    );
  }
  if (shape === "machine") {
    return (
      <group>
        <mesh castShadow position={[0, 0.56, 0]}><boxGeometry args={[landmark ? 0.9 : 0.62, landmark ? 1.04 : 0.72, landmark ? 0.68 : 0.48]} /><meshStandardMaterial color={color} roughness={0.48} /></mesh>
        <mesh position={[0, 0.58, -0.35]} rotation-x={Math.PI / 2}><torusGeometry args={[landmark ? 0.25 : 0.17, 0.035, 10, 28]} /><meshStandardMaterial color={accent} /></mesh>
        <mesh position={[0.28, 0.94, -0.36]}><boxGeometry args={[0.14, 0.08, 0.035]} /><meshStandardMaterial color="#10151f" /></mesh>
      </group>
    );
  }
  if (shape === "sign") {
    return (
      <group>
        <mesh position={[-0.36, 0.45, 0]}><cylinderGeometry args={[0.025, 0.035, 0.9, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[0.36, 0.45, 0]}><cylinderGeometry args={[0.025, 0.035, 0.9, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh castShadow position={[0, 0.82, 0]}><boxGeometry args={[landmark ? 1.18 : 0.82, landmark ? 0.46 : 0.32, 0.08]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
        <Billboard position={[0, 0.82, 0.06]}><Text fontSize={landmark ? 0.12 : 0.09} color={accent}>{label.split(" ")[0]}</Text></Billboard>
      </group>
    );
  }
  if (shape === "arch") {
    return (
      <group>
        <mesh castShadow position={[-0.42, 0.48, 0]}><cylinderGeometry args={[0.07, 0.09, 0.94, 10]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0.42, 0.48, 0]}><cylinderGeometry args={[0.07, 0.09, 0.94, 10]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.98, 0]}><boxGeometry args={[0.98, 0.16, 0.16]} /><meshStandardMaterial color={accent} /></mesh>
        <mesh position={[0, 0.62, 0.02]}><torusGeometry args={[0.46, 0.025, 8, 24, Math.PI]} /><meshStandardMaterial color={accent} /></mesh>
      </group>
    );
  }
  if (shape === "core") {
    return (
      <group>
        <mesh castShadow position={[0, 0.72, 0]}><octahedronGeometry args={[landmark ? 0.48 : 0.34]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} roughness={0.34} /></mesh>
        <mesh position={[0, 0.72, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[landmark ? 0.68 : 0.48, 0.025, 8, 32]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} /></mesh>
        <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.42, 0.52, 0.18, 16]} /><meshStandardMaterial color="#10151f" /></mesh>
        {sparkCount > 0 && <DreiSparkles count={sparkCount} scale={[1.0, 1.0, 1.0]} color={accent} speed={0.5} />}
      </group>
    );
  }
  if (shape === "market") {
    return (
      <group>
        <mesh castShadow position={[0, 0.36, 0]}><boxGeometry args={[landmark ? 1.0 : 0.72, 0.42, landmark ? 0.72 : 0.52]} /><meshStandardMaterial color={accent} roughness={0.62} /></mesh>
        <mesh castShadow position={[0, 0.82, 0]} rotation-z={0.06}><boxGeometry args={[landmark ? 1.18 : 0.84, 0.14, landmark ? 0.88 : 0.62]} /><meshStandardMaterial color={color} /></mesh>
        <mesh position={[0, 0.52, -0.38]}><boxGeometry args={[landmark ? 0.76 : 0.48, 0.16, 0.04]} /><meshStandardMaterial color={color} /></mesh>
      </group>
    );
  }
  if (shape === "fountain") {
    return (
      <group>
        <mesh castShadow position={[0, 0.2, 0]}><cylinderGeometry args={[landmark ? 0.64 : 0.42, landmark ? 0.72 : 0.5, 0.24, 20]} /><meshStandardMaterial color={accent} metalness={0.08} roughness={0.38} /></mesh>
        <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[landmark ? 0.25 : 0.16, landmark ? 0.32 : 0.22, 0.56, 16]} /><meshStandardMaterial color={color} metalness={0.16} roughness={0.28} /></mesh>
        <mesh position={[0, 0.94, 0]}><sphereGeometry args={[0.16, 14, 14]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} /></mesh>
      </group>
    );
  }
  if (shape === "rack") {
    return (
      <group>
        <mesh position={[-0.42, 0.5, 0]}><cylinderGeometry args={[0.025, 0.035, 1.0, 8]} /><meshStandardMaterial color={accent} /></mesh>
        <mesh position={[0.42, 0.5, 0]}><cylinderGeometry args={[0.025, 0.035, 1.0, 8]} /><meshStandardMaterial color={accent} /></mesh>
        <mesh position={[0, 0.96, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.025, 0.025, 0.95, 8]} /><meshStandardMaterial color={accent} /></mesh>
        {[-0.28, 0, 0.28].map((x, index) => <mesh key={index} castShadow position={[x, 0.66, 0]}><boxGeometry args={[0.22, 0.4, 0.04]} /><meshStandardMaterial color={index % 2 ? color : "#f8f3df"} /></mesh>)}
      </group>
    );
  }
  if (shape === "goal") {
    return (
      <group>
        <mesh position={[-0.48, 0.48, 0]}><cylinderGeometry args={[0.03, 0.035, 0.96, 8]} /><meshStandardMaterial color="#f8f3df" /></mesh>
        <mesh position={[0.48, 0.48, 0]}><cylinderGeometry args={[0.03, 0.035, 0.96, 8]} /><meshStandardMaterial color="#f8f3df" /></mesh>
        <mesh position={[0, 0.94, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.03, 0.03, 1.02, 8]} /><meshStandardMaterial color="#f8f3df" /></mesh>
        <mesh position={[0, 0.16, -0.18]}><sphereGeometry args={[0.16, 14, 14]} /><meshStandardMaterial color={color} /></mesh>
      </group>
    );
  }
  return <CrateProp scale={landmark ? 1.2 : 0.8} />;
}

function DadKingdomWorld({ phase, density = "low", combatPressure = 0 }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const high = density === "high";
  const combatLod = !high && combatPressure > 8;
  if (combatLod) return <DadKingdomCombatWorld phase={phase} />;
  const rich = high || (density !== "low" && combatPressure <= 8);
  const ringSegments = high ? 64 : 36;
  const suburban = [
    [-7.1, -6.5, 0.72, "#f1d08c"],
    [-5.1, -7.0, 0.64, "#d99946"],
    [-7.2, -4.25, 0.58, "#9fd8ff"],
    [-4.9, -4.7, 0.55, "#ff9fc0"]
  ];
  const blocks = [
    [3.25, -6.7, "A", "#ff8f52"],
    [5.15, -6.1, "B", "#55b8dc"],
    [6.85, -5.35, "C", "#d8f56f"],
    [4.25, -3.7, "DAD", "#f5c451"],
    [7.25, -2.75, "LOW", "#58c7a6"]
  ];
  const priceTags = [
    [-7.2, 3.5, "LOW COST", "#d8f56f"],
    [-4.8, 5.75, "9.99", "#f5c451"],
    [-2.4, 3.8, "SALE", "#ff8f52"],
    [-6.4, 6.8, "CHEAP", "#58c7a6"]
  ];
  const tents = [
    [3.7, 5.9, 0.8],
    [6.2, 5.25, 0.72],
    [5.1, 7.0, 0.64]
  ];
  const houseItems = suburban.slice(0, high ? 4 : rich ? 2 : 1);
  const blockItems = blocks.slice(0, high ? blocks.length : rich ? 3 : 1);
  const tagItems = priceTags.slice(0, high ? priceTags.length : rich ? 2 : 1);
  const tentItems = tents.slice(0, high ? tents.length : 1);
  const cartXs = high ? [-6.9, -5.4, -3.8, -2.5] : rich ? [-6.6, -4.5] : [-6.2];
  return (
    <group>
      <DistrictPatch position={[-4.7, 0.031, -4.85]} size={[7.1, 6.7]} color="#69a965" opacity={0.48} label="SUBURBAN NEIGHBORHOOD" />
      <DistrictPatch position={[4.8, 0.033, -4.85]} size={[7.25, 6.7]} color="#ffd68a" opacity={0.55} label="DAD CHAOS DISTRICT" />
      <DistrictPatch position={[-4.75, 0.035, 4.95]} size={[7.15, 6.85]} color="#58c7a6" opacity={0.43} label="LOW COST MARKET" />
      <DistrictPatch position={[4.75, 0.037, 5.0]} size={[7.15, 6.85]} color="#556b55" opacity={0.5} label="RESERVE DUTY ZONE" />
      <PathStrip position={[0, 0.045, 0]} size={[16.1, 1.05]} />
      <PathStrip position={[0, 0.046, 0]} size={[1.05, 16.1]} />
      <mesh position={[0, 0.054, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.05, 1.24, ringSegments]} />
        <meshBasicMaterial color="#fff1a8" transparent opacity={0.5} />
      </mesh>

      {houseItems.map(([x, z, s, color], index) => <HouseProp key={`house-${index}`} position={[x, 0, z]} scale={s} color={color} />)}
      {(high ? [-7.9, -6.7, -5.5, -4.3, -3.1] : rich ? [-7.6, -6.1, -4.6] : [-7.3, -5.7]).map((x, index) => <FenceSegment key={`fence-s-${index}`} position={[x, 0, -2.0]} />)}
      {rich && houseItems.slice(0, 1).map(([x, z], index) => <MailboxProp key={`mail-${index}`} position={[x + 0.72, 0, z + 0.82]} color={index % 2 ? "#55b8dc" : "#ee6656"} />)}
      {rich && <ParkedCar position={[-3.55, 0, -6.45]} color="#55b8dc" />}
      {high && <ParkedCar position={[-6.25, 0, -3.2]} color="#ee6656" rotation-y={0.4} />}
      {high && <BicycleProp position={[-3.25, 0, -3.65]} />}
      {rich && <PlaygroundProp position={[-6.9, 0, -2.85]} />}
      <TreeProp position={[-8.0, 0, -7.6]} scale={0.7} />
      {rich && <TreeProp position={[-2.6, 0, -7.2]} scale={0.62} />}
      {high && <TreeProp position={[-2.8, 0, -2.55]} scale={0.54} />}

      <GiantStroller position={[5.85, 0, -5.1]} scale={1.35} phase={phase} />
      <GiantBabyBottle position={[3.15, 0, -5.85]} scale={1.25} />
      {rich && <DiaperPile position={[7.15, 0, -6.95]} scale={0.92} />}
      {high && <DiaperPile position={[2.7, 0, -2.6]} scale={0.72} />}
      {blockItems.map(([x, z, label, color], index) => <BabyBlock key={`block-${index}`} position={[x, 0, z]} label={label} color={color} scale={index === 3 ? 1.1 : 0.82} />)}
      {high && <ToyRattle position={[6.85, 0, -3.7]} />}
      {rich && <ToyBall position={[3.05, 0, -3.15]} color="#ff9fc0" />}

      <LowCostSupermarket position={[-5.85, 0, 5.85]} phase={phase} />
      <SaleBanner position={[-6.6, 0, 2.7]} text="LOW COST" color="#58c7a6" />
      {rich && <SaleBanner position={[-2.55, 0, 6.65]} text="2 FOR 1" color="#f5c451" />}
      {tagItems.map(([x, z, text, color], index) => <PriceTagProp key={`tag-${index}`} position={[x, 0, z]} text={text} color={color} />)}
      {cartXs.map((x, index) => <ShoppingCartProp key={`cart-${index}`} position={[x, 0, 3.1 + (index % 2) * 1.15]} rotation-y={index * 0.35} />)}
      {high && <PaperBagStack position={[-2.7, 0, 5.05]} />}

      {tentItems.map(([x, z, s], index) => <MilitaryTent key={`tent-${index}`} position={[x, 0, z]} scale={s} />)}
      <MilitaryCheckpoint position={[2.55, 0, 2.85]} />
      {high && <CommandPost position={[7.25, 0, 6.7]} />}
      {rich && <ArmyVehicle position={[6.75, 0, 3.45]} rotation-y={-0.35} />}
      {high && <SupplyCrateStack position={[3.0, 0, 6.95]} />}
      {high && <RadioTower position={[2.65, 0, 7.55]} />}

      <ResponsibilityFortress position={[7.55, 0, 0]} phase={phase} />
      {rich && <PaperworkMountain position={[5.9, 0, 1.12]} scale={0.72} />}
      {high && <PaperworkMountain position={[7.3, 0, -1.32]} scale={0.55} />}
      <GiantClock position={[6.55, 0, -0.18]} phase={phase} />
      {high && <FamilyPhoto position={[8.05, 0, 1.65]} />}
      {rich && <MilitaryBanner position={[7.05, 0, 2.12]} />}
      {high && <AmbientBirds density={visual.ambientSparkles} />}
      {rich && (
        <Billboard position={[0, 1.55, 7.95]}>
          <Text fontSize={0.34} color="#fff8cf" outlineWidth={0.025} outlineColor="#204038">DAD KINGDOM</Text>
        </Billboard>
      )}
    </group>
  );
}

function DadKingdomCombatWorld({ phase = 1 }) {
  return (
    <group>
      <mesh position={[-4.7, 0.031, -4.85]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.1, 6.7]} />
        <meshBasicMaterial color="#69a965" transparent opacity={0.48} />
      </mesh>
      <mesh position={[4.8, 0.033, -4.85]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.25, 6.7]} />
        <meshBasicMaterial color="#ffd68a" transparent opacity={0.55} />
      </mesh>
      <mesh position={[-4.75, 0.035, 4.95]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.15, 6.85]} />
        <meshBasicMaterial color="#58c7a6" transparent opacity={0.43} />
      </mesh>
      <mesh position={[4.75, 0.037, 5]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[7.15, 6.85]} />
        <meshBasicMaterial color="#556b55" transparent opacity={0.5} />
      </mesh>
      <PathStrip position={[0, 0.045, 0]} size={[16.1, 1.05]} />
      <PathStrip position={[0, 0.046, 0]} size={[1.05, 16.1]} />
      <mesh position={[0, 0.054, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.05, 1.24, 28]} />
        <meshBasicMaterial color="#fff1a8" transparent opacity={0.42} />
      </mesh>

      <SimpleHouse position={[-6.85, 0, -6.15]} color="#f1d08c" />
      <SimpleHouse position={[-4.75, 0, -5.25]} color="#9fd8ff" scale={0.86} />
      <SimpleTree position={[-7.9, 0, -7.5]} />
      <SimpleFence position={[-6.4, 0, -2.05]} />
      <SimpleFence position={[-4.9, 0, -2.05]} />

      <SimpleStroller position={[5.95, 0, -5.1]} phase={phase} />
      <SimpleBottle position={[3.05, 0, -5.85]} />
      <SimpleBabyBlock position={[5.0, 0, -3.7]} color="#f5c451" />

      <SimpleMarket position={[-5.9, 0, 5.75]} phase={phase} />
      <SimplePriceTag position={[-7.1, 0, 3.35]} color="#d8f56f" />
      <SimpleCart position={[-4.2, 0, 3.35]} />

      <SimpleTent position={[3.7, 0, 5.8]} />
      <SimpleCheckpoint position={[2.55, 0, 2.85]} />
      <SimpleArmyTruck position={[6.5, 0, 3.45]} />

      <SimpleFortress position={[7.5, 0, 0]} phase={phase} />
      <SimpleClock position={[6.38, 0, -0.3]} phase={phase} />
      <SimplePaperwork position={[5.85, 0, 1.15]} />
    </group>
  );
}

function SimpleHouse({ color = "#f1d08c", ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[1.15, 0.76, 0.9]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[0, 0.88, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[0.8, 0.52, 4]} /><meshBasicMaterial color="#b85b42" /></mesh>
      <mesh position={[0.28, 0.24, -0.48]}><boxGeometry args={[0.26, 0.46, 0.04]} /><meshBasicMaterial color="#6a4b2a" /></mesh>
      <mesh position={[-0.26, 0.4, -0.49]}><boxGeometry args={[0.26, 0.28, 0.035]} /><meshBasicMaterial color="#8bd6ff" /></mesh>
    </group>
  );
}

function SimpleTree(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[0.08, 0.12, 0.64, 7]} /><meshBasicMaterial color="#6a4b2a" /></mesh>
      <mesh position={[0, 0.86, 0]}><coneGeometry args={[0.45, 0.82, 9]} /><meshBasicMaterial color="#4f9a58" /></mesh>
    </group>
  );
}

function SimpleFence(props) {
  return (
    <group {...props}>
      {[-0.44, 0, 0.44].map((x) => <mesh key={x} position={[x, 0.3, 0]}><boxGeometry args={[0.07, 0.6, 0.07]} /><meshBasicMaterial color="#f8f3df" /></mesh>)}
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[1.08, 0.08, 0.07]} /><meshBasicMaterial color="#f8f3df" /></mesh>
    </group>
  );
}

function SimpleStroller({ phase = 1, ...props }) {
  return (
    <group {...props} scale={1.15}>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.35, 0.52, 0.86]} /><meshBasicMaterial color={phase >= 2 ? "#ff9fc0" : "#55b8dc"} /></mesh>
      <mesh position={[0.12, 0.86, -0.08]} rotation-x={-0.5}><boxGeometry args={[1.24, 0.16, 0.78]} /><meshBasicMaterial color="#f8f3df" /></mesh>
      {[[-0.58, -0.47], [0.58, -0.47], [-0.58, 0.47], [0.58, 0.47]].map(([x, z], index) => <mesh key={index} position={[x, 0.17, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.2, 0.055, 8, 14]} /><meshBasicMaterial color="#10151f" /></mesh>)}
      <mesh position={[0.78, 1.0, 0]} rotation-z={-0.65}><cylinderGeometry args={[0.035, 0.035, 1.05, 7]} /><meshBasicMaterial color="#17202c" /></mesh>
    </group>
  );
}

function SimpleBottle(props) {
  return (
    <group {...props} scale={1.08}>
      <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.28, 0.36, 1.08, 12]} /><meshBasicMaterial color="#d8f3ff" transparent opacity={0.9} /></mesh>
      <mesh position={[0, 1.35, 0]}><cylinderGeometry args={[0.18, 0.22, 0.22, 10]} /><meshBasicMaterial color="#8bd6ff" /></mesh>
      <mesh position={[0, 1.56, 0]}><coneGeometry args={[0.18, 0.28, 10]} /><meshBasicMaterial color="#f2bc8f" /></mesh>
    </group>
  );
}

function SimpleBabyBlock({ color = "#f5c451", ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.38, 0]} rotation-y={0.18}><boxGeometry args={[0.82, 0.82, 0.82]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[0, 0.82, -0.42]}><circleGeometry args={[0.2, 16]} /><meshBasicMaterial color="#10151f" /></mesh>
    </group>
  );
}

function SimpleMarket({ phase = 1, ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.68, 0]}><boxGeometry args={[2.1, 1.36, 1.25]} /><meshBasicMaterial color="#58c7a6" /></mesh>
      <mesh position={[0, 1.5, -0.02]}><boxGeometry args={[2.34, 0.24, 1.38]} /><meshBasicMaterial color="#f5c451" /></mesh>
      <mesh position={[0, 1.72, -0.68]}><boxGeometry args={[1.72, 0.32, 0.08]} /><meshBasicMaterial color={phase >= 3 ? "#d8f56f" : "#10151f"} /></mesh>
      <mesh position={[-0.42, 0.48, -0.66]}><boxGeometry args={[0.42, 0.72, 0.04]} /><meshBasicMaterial color="#ccefff" transparent opacity={0.72} /></mesh>
      <mesh position={[0.42, 0.48, -0.66]}><boxGeometry args={[0.42, 0.72, 0.04]} /><meshBasicMaterial color="#ccefff" transparent opacity={0.72} /></mesh>
    </group>
  );
}

function SimplePriceTag({ color = "#d8f56f", ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.54, 0]} rotation-z={-0.18}><boxGeometry args={[0.82, 0.48, 0.07]} /><meshBasicMaterial color={color} /></mesh>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.028, 0.036, 0.44, 7]} /><meshBasicMaterial color="#6a4b2a" /></mesh>
    </group>
  );
}

function SimpleCart(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.38, 0]} rotation-x={-0.14}><boxGeometry args={[0.68, 0.42, 0.5]} /><meshBasicMaterial color="#b8c2ce" transparent opacity={0.85} /></mesh>
      <mesh position={[0.44, 0.56, 0]} rotation-z={-0.6}><cylinderGeometry args={[0.02, 0.02, 0.68, 7]} /><meshBasicMaterial color="#10151f" /></mesh>
      {[[-0.26, -0.22], [0.26, -0.22], [-0.26, 0.22], [0.26, 0.22]].map(([x, z], index) => <mesh key={index} position={[x, 0.09, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.07, 0.018, 7, 12]} /><meshBasicMaterial color="#10151f" /></mesh>)}
    </group>
  );
}

function SimpleTent(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.42, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[0.82, 0.82, 4]} /><meshBasicMaterial color="#4f5d51" /></mesh>
      <mesh position={[0, 0.15, -0.34]}><boxGeometry args={[0.46, 0.3, 0.04]} /><meshBasicMaterial color="#10151f" /></mesh>
    </group>
  );
}

function SimpleCheckpoint(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.36, 0]}><boxGeometry args={[1.2, 0.72, 0.32]} /><meshBasicMaterial color="#556b55" /></mesh>
      <mesh position={[0, 0.78, -0.04]}><boxGeometry args={[1.38, 0.16, 0.44]} /><meshBasicMaterial color="#f1d08c" /></mesh>
      <mesh position={[0.72, 0.56, 0]} rotation-z={-0.52}><boxGeometry args={[1.1, 0.08, 0.08]} /><meshBasicMaterial color="#ee6656" /></mesh>
    </group>
  );
}

function SimpleArmyTruck(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[1.22, 0.5, 0.72]} /><meshBasicMaterial color="#4f5d51" /></mesh>
      <mesh position={[0.45, 0.62, 0]}><boxGeometry args={[0.48, 0.42, 0.62]} /><meshBasicMaterial color="#65725e" /></mesh>
      {[[-0.45, -0.38], [0.45, -0.38], [-0.45, 0.38], [0.45, 0.38]].map(([x, z], index) => <mesh key={index} position={[x, 0.13, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.13, 0.04, 7, 12]} /><meshBasicMaterial color="#10151f" /></mesh>)}
    </group>
  );
}

function SimpleFortress({ phase = 1, ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.88, 0]}><boxGeometry args={[1.55, 1.75, 1.0]} /><meshBasicMaterial color={phase >= 2 ? "#8e6b4f" : "#836e5a"} /></mesh>
      <mesh position={[-0.82, 1.05, 0]}><boxGeometry args={[0.42, 2.1, 0.94]} /><meshBasicMaterial color="#6d594a" /></mesh>
      <mesh position={[0.82, 1.05, 0]}><boxGeometry args={[0.42, 2.1, 0.94]} /><meshBasicMaterial color="#6d594a" /></mesh>
      <mesh position={[0, 1.86, -0.56]}><boxGeometry args={[1.7, 0.18, 0.08]} /><meshBasicMaterial color="#d8f56f" /></mesh>
      <mesh position={[0, 0.46, -0.55]}><boxGeometry args={[0.46, 0.92, 0.08]} /><meshBasicMaterial color="#10151f" /></mesh>
    </group>
  );
}

function SimpleClock({ phase = 1, ...props }) {
  return (
    <group {...props}>
      <mesh position={[0, 0.86, 0]} rotation-y={Math.PI / 2}><cylinderGeometry args={[0.46, 0.46, 0.1, 18]} /><meshBasicMaterial color="#fff1a8" /></mesh>
      <mesh position={[0, 0.86, 0.06]} rotation-z={phase * 0.32}><boxGeometry args={[0.05, 0.38, 0.04]} /><meshBasicMaterial color="#10151f" /></mesh>
      <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.04, 0.06, 0.68, 7]} /><meshBasicMaterial color="#6a4b2a" /></mesh>
    </group>
  );
}

function SimplePaperwork(props) {
  return (
    <group {...props}>
      {[[0, 0.18, 0], [0.22, 0.34, 0.05], [-0.24, 0.5, -0.04], [0.05, 0.66, 0.08]].map((pos, index) => (
        <mesh key={index} position={pos} rotation-y={index * 0.22} rotation-z={(index - 1.5) * 0.07}>
          <boxGeometry args={[0.64, 0.16, 0.44]} />
          <meshBasicMaterial color={index % 2 ? "#d8f3ff" : "#f8f3df"} />
        </mesh>
      ))}
    </group>
  );
}

function DistrictPatch({ position, size, color, opacity, label }) {
  return (
    <group>
      <mesh position={position} rotation-x={-Math.PI / 2}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.86} transparent opacity={opacity} />
      </mesh>
      {label && (
        <Billboard position={[position[0], 0.64, position[2] - size[1] * 0.42]}>
          <Text fontSize={0.18} color="#f8f3df" outlineWidth={0.018} outlineColor="#204038">{label}</Text>
        </Billboard>
      )}
    </group>
  );
}

function PathStrip({ position, size, color = "#d9bd86", opacity = 0.76 }) {
  return (
    <mesh position={position} rotation-x={-Math.PI / 2}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} transparent opacity={opacity} />
    </mesh>
  );
}

function HouseProp({ color = "#f1d08c", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.45, 0]}><boxGeometry args={[1.2, 0.9, 1.0]} /><meshStandardMaterial color={color} roughness={0.62} /></mesh>
      <mesh castShadow position={[0, 1.02, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[0.86, 0.62, 4]} /><meshStandardMaterial color="#b85b42" roughness={0.66} /></mesh>
      <mesh position={[-0.28, 0.42, -0.51]}><boxGeometry args={[0.28, 0.38, 0.035]} /><meshStandardMaterial color="#8bd6ff" emissive="#245061" emissiveIntensity={0.1} /></mesh>
      <mesh position={[0.34, 0.3, -0.53]}><boxGeometry args={[0.26, 0.54, 0.04]} /><meshStandardMaterial color="#6a4b2a" /></mesh>
      <mesh position={[0.48, 0.3, -0.58]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#f5c451" /></mesh>
      <mesh position={[0.0, 0.18, -0.78]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.78, 0.48]} /><meshStandardMaterial color="#b8c2ce" roughness={0.7} /></mesh>
    </group>
  );
}

function MailboxProp({ color = "#ee6656", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.22, 0]}><cylinderGeometry args={[0.035, 0.045, 0.44, 8]} /><meshStandardMaterial color="#6a4b2a" /></mesh>
      <mesh castShadow position={[0, 0.48, 0]}><boxGeometry args={[0.34, 0.18, 0.22]} /><meshStandardMaterial color={color} roughness={0.58} /></mesh>
      <mesh position={[0.18, 0.55, 0]} rotation-z={-0.4}><boxGeometry args={[0.06, 0.22, 0.025]} /><meshStandardMaterial color="#f5c451" /></mesh>
    </group>
  );
}

function FenceSegment(props) {
  return (
    <group {...props}>
      {[-0.48, 0, 0.48].map((x) => <mesh key={x} castShadow position={[x, 0.32, 0]}><boxGeometry args={[0.08, 0.64, 0.08]} /><meshStandardMaterial color="#f8f3df" /></mesh>)}
      <mesh castShadow position={[0, 0.34, 0]}><boxGeometry args={[1.15, 0.08, 0.08]} /><meshStandardMaterial color="#f8f3df" /></mesh>
      <mesh castShadow position={[0, 0.52, 0]}><boxGeometry args={[1.15, 0.08, 0.08]} /><meshStandardMaterial color="#f8f3df" /></mesh>
    </group>
  );
}

function ParkedCar({ color = "#55b8dc", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.32, 0]}><boxGeometry args={[1.25, 0.38, 0.68]} /><meshStandardMaterial color={color} roughness={0.46} /></mesh>
      <mesh castShadow position={[0.05, 0.62, 0]}><boxGeometry args={[0.68, 0.34, 0.58]} /><meshStandardMaterial color={color} roughness={0.48} /></mesh>
      {[[-0.42, -0.37], [0.42, -0.37], [-0.42, 0.37], [0.42, 0.37]].map(([x, z], index) => <mesh key={index} position={[x, 0.14, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.15, 0.045, 8, 18]} /><meshStandardMaterial color="#17202c" /></mesh>)}
      <mesh position={[0.06, 0.7, -0.31]}><boxGeometry args={[0.48, 0.16, 0.035]} /><meshStandardMaterial color="#ccefff" transparent opacity={0.82} /></mesh>
    </group>
  );
}

function BicycleProp(props) {
  return (
    <group {...props}>
      {[-0.35, 0.35].map((x) => <mesh key={x} position={[x, 0.34, 0]} rotation-y={Math.PI / 2}><torusGeometry args={[0.24, 0.025, 8, 24]} /><meshStandardMaterial color="#10151f" /></mesh>)}
      <mesh position={[0, 0.48, 0]} rotation-z={0.55}><cylinderGeometry args={[0.025, 0.025, 0.78, 8]} /><meshStandardMaterial color="#f5c451" /></mesh>
      <mesh position={[0, 0.58, 0]} rotation-z={-0.55}><cylinderGeometry args={[0.025, 0.025, 0.78, 8]} /><meshStandardMaterial color="#f5c451" /></mesh>
      <mesh position={[0.1, 0.74, 0]}><boxGeometry args={[0.26, 0.05, 0.12]} /><meshStandardMaterial color="#6a4b2a" /></mesh>
      <mesh position={[0.48, 0.82, 0]}><boxGeometry args={[0.34, 0.04, 0.04]} /><meshStandardMaterial color="#10151f" /></mesh>
    </group>
  );
}

function PlaygroundProp(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.38, 0]}><boxGeometry args={[0.82, 0.12, 0.62]} /><meshStandardMaterial color="#f5c451" /></mesh>
      <mesh castShadow position={[0.54, 0.34, 0]} rotation-z={-0.55}><boxGeometry args={[0.18, 0.92, 0.56]} /><meshStandardMaterial color="#55b8dc" /></mesh>
      <mesh castShadow position={[-0.52, 0.55, 0]}><boxGeometry args={[0.12, 1.1, 0.12]} /><meshStandardMaterial color="#c97848" /></mesh>
      <mesh castShadow position={[-1.0, 0.55, 0]}><boxGeometry args={[0.12, 1.1, 0.12]} /><meshStandardMaterial color="#c97848" /></mesh>
      <mesh castShadow position={[-0.76, 1.1, 0]}><boxGeometry args={[0.65, 0.09, 0.09]} /><meshStandardMaterial color="#c97848" /></mesh>
      <mesh position={[-0.76, 0.46, 0]}><boxGeometry args={[0.36, 0.07, 0.24]} /><meshStandardMaterial color="#ff9fc0" /></mesh>
    </group>
  );
}

function GiantStroller({ phase = 1, ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.62, 0]}><boxGeometry args={[1.55, 0.62, 0.95]} /><meshStandardMaterial color={phase >= 2 ? "#ff9fc0" : "#55b8dc"} roughness={0.5} /></mesh>
      <mesh castShadow position={[0.16, 1.0, -0.12]} rotation-x={-0.55}><boxGeometry args={[1.45, 0.18, 0.9]} /><meshStandardMaterial color="#f8f3df" roughness={0.55} /></mesh>
      {[[-0.68, -0.52], [0.68, -0.52], [-0.68, 0.52], [0.68, 0.52]].map(([x, z], index) => <mesh key={index} position={[x, 0.2, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.24, 0.07, 10, 24]} /><meshStandardMaterial color="#10151f" /></mesh>)}
      <mesh position={[0.86, 1.12, 0]} rotation-z={-0.65}><cylinderGeometry args={[0.045, 0.045, 1.25, 8]} /><meshStandardMaterial color="#17202c" /></mesh>
      <Billboard position={[0, 1.64, 0]}><Text fontSize={0.22} color="#fff1a8" outlineWidth={0.02} outlineColor="#10151f">GIANT STROLLER</Text></Billboard>
    </group>
  );
}

function GiantBabyBottle(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.78, 0]}><cylinderGeometry args={[0.32, 0.4, 1.22, 18]} /><meshStandardMaterial color="#d8f3ff" transparent opacity={0.9} roughness={0.24} /></mesh>
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.34, 0.38, 0.35, 18]} /><meshStandardMaterial color="#fffef2" transparent opacity={0.84} /></mesh>
      <mesh castShadow position={[0, 1.48, 0]}><cylinderGeometry args={[0.21, 0.25, 0.28, 16]} /><meshStandardMaterial color="#8bd6ff" /></mesh>
      <mesh castShadow position={[0, 1.72, 0]}><coneGeometry args={[0.2, 0.34, 16]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      <Billboard position={[0, 2.05, 0]}><Text fontSize={0.2} color="#d8f3ff" outlineWidth={0.018} outlineColor="#204038">BABY BOTTLE</Text></Billboard>
    </group>
  );
}

function BabyBlock({ label, color, ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.38, 0]} rotation-y={0.18}><boxGeometry args={[0.82, 0.82, 0.82]} /><meshStandardMaterial color={color} roughness={0.58} /></mesh>
      <Billboard position={[0, 0.82, 0.44]}><Text fontSize={0.2} color="#10151f" outlineWidth={0.01} outlineColor="#fff1a8">{label}</Text></Billboard>
    </group>
  );
}

function DiaperPile(props) {
  const pieces = [[0, 0.22, 0], [0.32, 0.2, 0.1], [-0.28, 0.19, -0.08], [0.08, 0.42, -0.12], [-0.05, 0.31, 0.28]];
  return (
    <group {...props}>
      {pieces.map((pos, index) => <mesh key={index} castShadow position={pos} rotation-z={index * 0.28}><boxGeometry args={[0.58, 0.24, 0.44]} /><meshStandardMaterial color={index % 2 ? "#f8f3df" : "#d8f3ff"} roughness={0.78} /></mesh>)}
      <Billboard position={[0, 0.92, 0]}><Text fontSize={0.16} color="#f8f3df" outlineWidth={0.018} outlineColor="#204038">DIAPERS</Text></Billboard>
    </group>
  );
}

function ToyRattle(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.34, 0]} rotation-z={0.85}><cylinderGeometry args={[0.065, 0.065, 0.92, 12]} /><meshStandardMaterial color="#f5c451" /></mesh>
      <mesh position={[0.31, 0.66, 0]}><sphereGeometry args={[0.23, 16, 16]} /><meshStandardMaterial color="#ff9fc0" /></mesh>
      <mesh position={[-0.31, 0.03, 0]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#55b8dc" /></mesh>
    </group>
  );
}

function ToyBall({ color = "#ff9fc0", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.28, 0]}><sphereGeometry args={[0.32, 18, 18]} /><meshStandardMaterial color={color} roughness={0.42} /></mesh>
      <mesh position={[0, 0.29, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.29, 0.018, 8, 28]} /><meshStandardMaterial color="#f8f3df" /></mesh>
    </group>
  );
}

function LowCostSupermarket({ phase = 1, ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.8, 0]}><boxGeometry args={[2.2, 1.6, 1.35]} /><meshStandardMaterial color="#58c7a6" roughness={0.55} /></mesh>
      <mesh castShadow position={[0, 1.72, -0.02]}><boxGeometry args={[2.42, 0.28, 1.5]} /><meshStandardMaterial color="#f5c451" roughness={0.52} /></mesh>
      <mesh position={[0, 1.92, -0.72]}><boxGeometry args={[1.92, 0.36, 0.08]} /><meshStandardMaterial color={phase >= 3 ? "#d8f56f" : "#10151f"} emissive={phase >= 3 ? "#6a8a24" : "#000000"} emissiveIntensity={phase >= 3 ? 0.18 : 0} /></mesh>
      <Billboard position={[0, 1.95, -0.82]}><Text fontSize={0.26} color={phase >= 3 ? "#10151f" : "#d8f56f"} outlineWidth={0.012} outlineColor="#f8f3df">LOW COST</Text></Billboard>
      <mesh position={[-0.44, 0.55, -0.72]}><boxGeometry args={[0.46, 0.8, 0.05]} /><meshStandardMaterial color="#ccefff" transparent opacity={0.72} /></mesh>
      <mesh position={[0.42, 0.55, -0.72]}><boxGeometry args={[0.46, 0.8, 0.05]} /><meshStandardMaterial color="#ccefff" transparent opacity={0.72} /></mesh>
      <Billboard position={[0, 0.2, -0.9]}><Text fontSize={0.14} color="#fff1a8" outlineWidth={0.012} outlineColor="#204038">EVERYTHING IS SOMEHOW CHEAP</Text></Billboard>
    </group>
  );
}

function PriceTagProp({ text, color = "#d8f56f", ...props }) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.58, 0]} rotation-z={-0.18}><boxGeometry args={[0.86, 0.52, 0.08]} /><meshStandardMaterial color={color} roughness={0.48} /></mesh>
      <mesh position={[-0.31, 0.72, 0.055]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
      <Billboard position={[0.06, 0.6, 0.08]}><Text fontSize={0.14} color="#10151f">{text}</Text></Billboard>
      <mesh position={[0, 0.27, 0]}><cylinderGeometry args={[0.035, 0.045, 0.54, 8]} /><meshStandardMaterial color="#6a4b2a" /></mesh>
    </group>
  );
}

function SaleBanner({ text, color = "#58c7a6", ...props }) {
  return (
    <group {...props}>
      {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.7, 0]}><cylinderGeometry args={[0.035, 0.045, 1.4, 8]} /><meshStandardMaterial color="#6a4b2a" /></mesh>)}
      <mesh castShadow position={[0, 1.06, 0]}><boxGeometry args={[1.75, 0.42, 0.08]} /><meshStandardMaterial color={color} roughness={0.54} /></mesh>
      <Billboard position={[0, 1.07, 0.07]}><Text fontSize={0.18} color="#10151f">{text}</Text></Billboard>
    </group>
  );
}

function ShoppingCartProp(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.42, 0]} rotation-x={-0.14}><boxGeometry args={[0.72, 0.48, 0.55]} /><meshStandardMaterial color="#b8c2ce" metalness={0.28} roughness={0.38} transparent opacity={0.86} /></mesh>
      <mesh position={[0.48, 0.6, 0]} rotation-z={-0.6}><cylinderGeometry args={[0.025, 0.025, 0.74, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
      {[[-0.28, -0.25], [0.28, -0.25], [-0.28, 0.25], [0.28, 0.25]].map(([x, z], index) => <mesh key={index} position={[x, 0.1, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.08, 0.022, 8, 16]} /><meshStandardMaterial color="#10151f" /></mesh>)}
    </group>
  );
}

function PaperBagStack(props) {
  return (
    <group {...props}>
      {[[0, 0.25, 0], [0.28, 0.2, 0.12], [-0.24, 0.19, -0.1], [0.03, 0.55, 0.02]].map((pos, index) => <mesh key={index} castShadow position={pos}><boxGeometry args={[0.34, 0.46, 0.24]} /><meshStandardMaterial color={index % 2 ? "#d99946" : "#f1d08c"} roughness={0.85} /></mesh>)}
    </group>
  );
}

function MilitaryTent({ scale = 1, ...props }) {
  return (
    <group {...props} scale={scale}>
      <mesh castShadow position={[0, 0.46, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[0.92, 0.92, 4]} /><meshStandardMaterial color="#4f5d51" roughness={0.72} /></mesh>
      <mesh position={[0, 0.18, -0.38]}><boxGeometry args={[0.52, 0.34, 0.05]} /><meshStandardMaterial color="#10151f" /></mesh>
      <Billboard position={[0, 1.04, 0]}><Text fontSize={0.16} color="#d8f3ff" outlineWidth={0.014} outlineColor="#10151f">RESERVE</Text></Billboard>
    </group>
  );
}

function MilitaryCheckpoint(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.34, 0]}><boxGeometry args={[1.62, 0.18, 0.18]} /><meshStandardMaterial color="#f8f3df" /></mesh>
      {[-0.55, 0.05, 0.65].map((x, index) => <mesh key={index} position={[x, 0.36, 0.02]}><boxGeometry args={[0.26, 0.2, 0.2]} /><meshStandardMaterial color={index % 2 ? "#ee6656" : "#f8f3df"} /></mesh>)}
      {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 0.18, 0]}><boxGeometry args={[0.14, 0.36, 0.14]} /><meshStandardMaterial color="#10151f" /></mesh>)}
      <Billboard position={[0, 0.86, 0]}><Text fontSize={0.16} color="#fff1a8" outlineWidth={0.014} outlineColor="#10151f">CHECKPOINT</Text></Billboard>
    </group>
  );
}

function CommandPost(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.52, 0]}><boxGeometry args={[1.05, 1.04, 0.92]} /><meshStandardMaterial color="#556b55" roughness={0.62} /></mesh>
      <mesh castShadow position={[0, 1.16, 0]}><boxGeometry args={[1.18, 0.22, 1.02]} /><meshStandardMaterial color="#2d3447" /></mesh>
      <mesh position={[0, 0.62, -0.48]}><boxGeometry args={[0.52, 0.36, 0.045]} /><meshStandardMaterial color="#85d6ff" emissive="#17445c" emissiveIntensity={0.18} /></mesh>
      <Billboard position={[0, 1.44, 0]}><Text fontSize={0.16} color="#d8f3ff" outlineWidth={0.016} outlineColor="#10151f">COMMAND POST</Text></Billboard>
    </group>
  );
}

function ArmyVehicle(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.42, 0]}><boxGeometry args={[1.52, 0.58, 0.86]} /><meshStandardMaterial color="#4f5d51" roughness={0.62} /></mesh>
      <mesh castShadow position={[-0.2, 0.78, 0]}><boxGeometry args={[0.82, 0.42, 0.72]} /><meshStandardMaterial color="#384250" roughness={0.6} /></mesh>
      {[[-0.55, -0.48], [0.55, -0.48], [-0.55, 0.48], [0.55, 0.48]].map(([x, z], index) => <mesh key={index} position={[x, 0.17, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.17, 0.055, 8, 18]} /><meshStandardMaterial color="#10151f" /></mesh>)}
      <mesh position={[0.58, 0.82, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.045, 0.045, 0.82, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
    </group>
  );
}

function SupplyCrateStack(props) {
  return (
    <group {...props}>
      {[[0, 0.2, 0], [0.42, 0.22, 0.05], [-0.38, 0.2, -0.02], [0.02, 0.62, 0.03]].map((pos, index) => <CrateProp key={index} position={pos} scale={0.65} />)}
    </group>
  );
}

function RadioTower(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.035, 0.045, 1.6, 8]} /><meshStandardMaterial color="#b8c2ce" metalness={0.32} /></mesh>
      <mesh position={[0, 1.62, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#ee6656" emissive="#ee6656" emissiveIntensity={0.3} /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} position={[0, 1.6 + i * 0.16, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.34 + i * 0.18, 0.01, 8, 32]} /><meshBasicMaterial color="#85d6ff" transparent opacity={0.5 - i * 0.12} /></mesh>)}
      <Billboard position={[0, 1.98, 0]}><Text fontSize={0.14} color="#d8f3ff" outlineWidth={0.012} outlineColor="#10151f">RADIO</Text></Billboard>
    </group>
  );
}

function ResponsibilityFortress({ phase = 1, ...props }) {
  const glow = phase >= 3 ? "#d8f56f" : "#58c7a6";
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.62, 0]}><boxGeometry args={[1.35, 1.24, 1.15]} /><meshStandardMaterial color="#6a4b2a" roughness={0.72} /></mesh>
      {[-0.82, 0.82].map((x) => <mesh key={x} castShadow position={[x, 0.82, 0]}><cylinderGeometry args={[0.25, 0.3, 1.64, 8]} /><meshStandardMaterial color="#4f5d51" roughness={0.68} /></mesh>)}
      <mesh castShadow position={[0, 1.42, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[1.02, 0.55, 4]} /><meshStandardMaterial color="#2d3447" roughness={0.58} /></mesh>
      <mesh position={[0, 1.88, 0]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.22} /></mesh>
      <Billboard position={[0, 2.22, 0]}><Text fontSize={0.18} color="#fff1a8" outlineWidth={0.018} outlineColor="#10151f">RESPONSIBILITY FORTRESS</Text></Billboard>
    </group>
  );
}

function PaperworkMountain({ scale = 1, ...props }) {
  const papers = [[0, 0.16, 0], [0.24, 0.31, 0.04], [-0.25, 0.46, -0.03], [0.02, 0.61, 0.12], [0.18, 0.76, -0.1]];
  return (
    <group {...props} scale={scale}>
      {papers.map((pos, index) => <mesh key={index} castShadow position={pos} rotation-y={index * 0.4} rotation-z={(index - 2) * 0.08}><boxGeometry args={[0.82, 0.055, 0.58]} /><meshStandardMaterial color={index % 2 ? "#f8f3df" : "#e8d8ad"} roughness={0.88} /></mesh>)}
      <Billboard position={[0, 1.05, 0]}><Text fontSize={0.14} color="#10151f" outlineWidth={0.012} outlineColor="#fff1a8">PAPERWORK</Text></Billboard>
    </group>
  );
}

function GiantClock({ phase = 1, ...props }) {
  const clockColor = phase >= 2 ? "#ee6656" : "#f8f3df";
  return (
    <group {...props}>
      <mesh castShadow position={[0, 1.02, 0]} rotation-y={Math.PI / 2}><cylinderGeometry args={[0.62, 0.62, 0.12, 32]} /><meshStandardMaterial color={clockColor} roughness={0.48} /></mesh>
      <mesh position={[0, 1.02, -0.07]} rotation-y={Math.PI / 2}><torusGeometry args={[0.64, 0.04, 8, 36]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh position={[0, 1.02, -0.15]} rotation-z={phase >= 3 ? -0.2 : 0.7}><boxGeometry args={[0.05, 0.42, 0.04]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh position={[0, 1.02, -0.16]} rotation-z={phase >= 3 ? 1.2 : -0.35}><boxGeometry args={[0.04, 0.32, 0.04]} /><meshStandardMaterial color="#10151f" /></mesh>
    </group>
  );
}

function FamilyPhoto(props) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.82, 0]} rotation-y={-0.32}><boxGeometry args={[0.82, 0.58, 0.08]} /><meshStandardMaterial color="#f5c451" roughness={0.5} /></mesh>
      <mesh position={[0, 0.82, -0.05]} rotation-y={-0.32}><boxGeometry args={[0.66, 0.42, 0.04]} /><meshStandardMaterial color="#d8f3ff" /></mesh>
      {[-0.18, 0, 0.18].map((x, index) => <mesh key={index} position={[x, 0.84, -0.1]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color={index === 1 ? "#58c7a6" : "#f2bc8f"} /></mesh>)}
      <Billboard position={[0, 1.28, 0]}><Text fontSize={0.13} color="#fff1a8" outlineWidth={0.012} outlineColor="#10151f">FAMILY</Text></Billboard>
    </group>
  );
}

function MilitaryBanner(props) {
  return (
    <group {...props}>
      <mesh position={[0, 0.78, 0]}><cylinderGeometry args={[0.035, 0.045, 1.56, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh castShadow position={[0.35, 1.22, 0]}><boxGeometry args={[0.7, 0.48, 0.045]} /><meshStandardMaterial color="#55b8dc" roughness={0.5} /></mesh>
      <Billboard position={[0.36, 1.22, 0.05]}><Text fontSize={0.12} color="#10151f">ORDERS</Text></Billboard>
    </group>
  );
}

function AmbientBirds({ density = 1 }) {
  const count = Math.max(3, Math.round(6 * density));
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const x = -7.6 + index * 2.8;
        const z = -7.9 + (index % 3) * 0.5;
        return (
          <Billboard key={index} position={[x, 3.2 + (index % 2) * 0.25, z]}>
            <Text fontSize={0.24} color="#fff8cf" outlineWidth={0.012} outlineColor="#6a4b2a">v</Text>
          </Billboard>
        );
      })}
      <Billboard position={[-5.7, 1.5, -7.8]}><Text fontSize={0.14} color="#fff8cf" outlineWidth={0.012} outlineColor="#204038">kids playing</Text></Billboard>
      <Billboard position={[-5.2, 1.42, 2.35]}><Text fontSize={0.14} color="#fff8cf" outlineWidth={0.012} outlineColor="#204038">store announcements</Text></Billboard>
      <Billboard position={[3.9, 1.42, 7.75]}><Text fontSize={0.14} color="#d8f3ff" outlineWidth={0.012} outlineColor="#10151f">radio chatter</Text></Billboard>
    </group>
  );
}

function TreeProp(props) {
  return <group {...props}><mesh castShadow position={[0, 0.45, 0]}><cylinderGeometry args={[0.13, 0.19, 0.9, 8]} /><meshStandardMaterial color="#6a3f1d" /></mesh><mesh castShadow position={[0, 1.08, 0]}><sphereGeometry args={[0.48, 14, 14]} /><meshStandardMaterial color="#1f8a52" /></mesh></group>;
}

function VineProp({ dark, ...props }) {
  return <group {...props}><mesh castShadow rotation-z={0.55} position={[0, 0.42, 0]}><cylinderGeometry args={[0.06, 0.08, 1.25, 8]} /><meshStandardMaterial color={dark ? "#20152f" : "#3d7a37"} /></mesh><mesh castShadow position={[0.18, 0.8, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color={dark ? "#4d2666" : "#8e44ad"} /></mesh><mesh castShadow position={[-0.05, 0.68, 0.08]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color={dark ? "#4d2666" : "#8e44ad"} /></mesh></group>;
}

function OfficeProp(props) {
  return <group {...props}><mesh castShadow position={[0, 0.45, 0]}><boxGeometry args={[0.7, 0.9, 0.42]} /><meshStandardMaterial color="#596276" /></mesh><mesh position={[0, 0.52, 0.23]}><boxGeometry args={[0.46, 0.42, 0.03]} /><meshStandardMaterial color="#e8d8ad" /></mesh></group>;
}

function CrateProp(props) {
  return <group {...props}><mesh castShadow position={[0, 0.32, 0]}><boxGeometry args={[0.7, 0.64, 0.7]} /><meshStandardMaterial color="#8b5a36" /></mesh><mesh position={[0, 0.34, 0.36]}><boxGeometry args={[0.76, 0.09, 0.04]} /><meshStandardMaterial color="#4a2c17" /></mesh></group>;
}

function CameraRig({ target, phase, pressure = 0, density = "low" }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  useFrame(({ camera }) => {
    const zoomOut = clamp(pressure, 0, 1) * visual.cameraPressure;
    const wanted = new THREE.Vector3(target.x - 0.4, 12.6 + phase * 0.18 + zoomOut * 2.2, target.z + 13.2 + zoomOut * 2.35);
    camera.position.lerp(wanted, 0.055);
    camera.lookAt(target.x + 1.2, 0.1, target.z);
  });
  return null;
}

function RenderTicker({ density = DEFAULT_QUALITY, graphics = DEFAULT_GRAPHICS }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const fps = Math.max(36, (density === "high" ? 60 : density === "medium" ? 54 : 46) + (graphics.renderFpsBoost || 0));
    const interval = 1000 / fps;
    let frame = 0;
    let last = 0;
    const tick = (now) => {
      if (now - last >= interval) {
        last = now;
        invalidate();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [density, graphics.renderFpsBoost, invalidate]);
  return null;
}

function HeroModel({ hero, active = false, companion = false, moving = false }) {
  const ref = useRef(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const bounce = Math.sin(clock.elapsedTime * (moving ? 8 : 2.2)) * (moving ? 0.08 : 0.035);
    const squash = 1 + Math.sin(clock.elapsedTime * (moving ? 8 : 2.2)) * (moving ? 0.045 : 0.018);
    const base = active ? 1.08 : companion ? 0.78 : 1;
    ref.current.position.y = bounce;
    ref.current.scale.set(base * (2 - squash), base * squash, base);
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 2.5) * 0.05;
  });
  if (hero.image) {
    return (
      <group ref={ref}>
        {hero.id === "dan" && <mesh position={[0, 1.08, -0.04]}><sphereGeometry args={[1.3, 24, 24]} /><meshBasicMaterial color="#fff1a8" transparent opacity={0.14} /></mesh>}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
          <circleGeometry args={[active ? 0.86 : 0.72, 36]} />
          <meshBasicMaterial color="#060914" transparent opacity={0.38} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.058, 0]}>
          <ringGeometry args={[active ? 0.9 : 0.74, active ? 1.03 : 0.86, 42]} />
          <meshBasicMaterial color={active ? "#55b8dc" : "#8bd6ff"} transparent opacity={active ? 0.82 : 0.58} />
        </mesh>
        <CharacterArtBillboard src={hero.image} position={[0, companion ? 0.98 : 1.08, 0.06]} height={active ? 2.18 : companion ? 1.62 : 2.0} outlineColor={hero.color} />
        <HeroProp hero={hero} />
        <Billboard position={[0, active ? 2.42 : companion ? 1.9 : 2.26, 0]}><Text fontSize={companion ? 0.16 : 0.22} color="#f8f3df" outlineWidth={0.02} outlineColor="#10151f">{hero.name}</Text></Billboard>
      </group>
    );
  }
  return (
    <group ref={ref}>
      {hero.id === "dan" && <mesh position={[0, 0.75, 0]}><sphereGeometry args={[1.15, 24, 24]} /><meshBasicMaterial color="#fff1a8" transparent opacity={0.15} /></mesh>}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <circleGeometry args={[active ? 0.72 : 0.62, 36]} />
        <meshBasicMaterial color="#060914" transparent opacity={0.34} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.058, 0]}>
        <ringGeometry args={[active ? 0.76 : 0.64, active ? 0.88 : 0.74, 42]} />
        <meshBasicMaterial color={active ? "#55b8dc" : "#8bd6ff"} transparent opacity={active ? 0.8 : 0.56} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}><capsuleGeometry args={[0.34, 0.7, 8, 16]} /><meshStandardMaterial color={hero.color} roughness={0.55} /></mesh>
      <mesh castShadow position={[0, 1.45, 0]}><sphereGeometry args={[0.34, 18, 18]} /><meshStandardMaterial color="#f2bc8f" roughness={0.5} /></mesh>
      <mesh castShadow position={[0, 1.69, -0.03]}><boxGeometry args={[0.58, 0.18, 0.42]} /><meshStandardMaterial color="#232838" /></mesh>
      <mesh castShadow position={[-0.42, 0.92, 0]} rotation-z={0.4}><capsuleGeometry args={[0.09, 0.55, 6, 10]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      <mesh castShadow position={[0.42, 0.92, 0]} rotation-z={-0.4}><capsuleGeometry args={[0.09, 0.55, 6, 10]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      <mesh castShadow position={[-0.16, 0.28, 0]}><capsuleGeometry args={[0.1, 0.45, 6, 10]} /><meshStandardMaterial color="#2d3447" /></mesh>
      <mesh castShadow position={[0.16, 0.28, 0]}><capsuleGeometry args={[0.1, 0.45, 6, 10]} /><meshStandardMaterial color="#2d3447" /></mesh>
      <HeroProp hero={hero} />
      <Billboard position={[0, companion ? 1.76 : 2.08, 0]}><Text fontSize={companion ? 0.16 : 0.22} color="#f8f3df" outlineWidth={0.02} outlineColor="#10151f">{hero.name}</Text></Billboard>
    </group>
  );
}

const MemoHeroModel = React.memo(HeroModel);

function CharacterArtBillboard({ src, position, width, height = 2, outlineColor = "#ffffff" }) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  const image = texture.image;
  const aspect = image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : 0.72;
  const planeWidth = width || clamp(height * aspect, 0.95, 1.55);
  return (
    <Billboard position={position}>
      <mesh position={[0, 0, -0.018]}>
        <planeGeometry args={[planeWidth * 1.06, height * 1.04]} />
        <meshBasicMaterial color={outlineColor} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[planeWidth, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent alphaTest={0.02} side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  );
}

function HeroProp({ hero }) {
  if (hero.id === "mendel") return <group><mesh position={[0.56, 1.1, 0]} rotation-z={0.8}><torusGeometry args={[0.19, 0.045, 8, 18, Math.PI * 1.35]} /><meshStandardMaterial color="#f5c451" /></mesh><mesh position={[-0.47, 1.12, -0.08]}><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color="#9b6a3f" /></mesh></group>;
  if (hero.id === "tal") return <group><mesh position={[0.54, 1.04, 0.03]}><boxGeometry args={[0.28, 0.38, 0.06]} /><meshStandardMaterial color="#f6e9bf" /></mesh><Text position={[0, 2.45, 0]} fontSize={0.22} color="#ffdf7f">!</Text></group>;
  if (hero.id === "hadar") return <group><mesh position={[0.57, 1, 0]} rotation-z={-0.8}><cylinderGeometry args={[0.035, 0.035, 0.7, 8]} /><meshStandardMaterial color="#8bd6ff" /></mesh><mesh position={[0.67, 0.75, 0]}><boxGeometry args={[0.34, 0.08, 0.06]} /><meshStandardMaterial color="#f8f3df" /></mesh></group>;
  if (hero.id === "amit") return <mesh position={[0.54, 1.02, 0]}><boxGeometry args={[0.34, 0.45, 0.08]} /><meshStandardMaterial color="#f6e9bf" /></mesh>;
  if (hero.id === "goodman") return <group><mesh position={[0.54, 1, 0]}><boxGeometry args={[0.3, 0.36, 0.04]} /><meshStandardMaterial color="#e8d8ad" /></mesh><mesh position={[-0.54, 1.05, 0]}><boxGeometry args={[0.24, 0.34, 0.04]} /><meshStandardMaterial color="#68c58a" /></mesh></group>;
  if (hero.id === "giat") return <Billboard position={[0.58, 1.16, 0]}><Text fontSize={0.18} color="#10151f" outlineWidth={0.035} outlineColor="#f5c451">LOW</Text></Billboard>;
  if (hero.id === "halel") return <group><mesh position={[0, 1.86, 0]}><coneGeometry args={[0.24, 0.22, 4]} /><meshStandardMaterial color="#f5c451" /></mesh><mesh position={[0.6, 0.62, 0]}><torusGeometry args={[0.2, 0.035, 8, 20]} /><meshStandardMaterial color="#2d3447" /></mesh></group>;
  if (hero.id === "amichai") return <group><mesh position={[0.5, 0.96, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f8f3df" /></mesh><mesh position={[-0.5, 0.96, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f8f3df" /></mesh></group>;
  if (hero.id === "gelman") return <Text position={[0.57, 1.13, 0]} fontSize={0.28} color="#f5c451">$</Text>;
  if (hero.id === "kuzar") return <Billboard position={[0.55, 1.1, 0]}><Text fontSize={0.2} color="#68c58a" outlineWidth={0.015} outlineColor="#10151f">AGIG</Text></Billboard>;
  if (hero.id === "farber") return <mesh position={[0.55, 1, 0]} rotation-z={-0.7}><cylinderGeometry args={[0.05, 0.05, 0.75, 8]} /><meshStandardMaterial color="#c97848" /></mesh>;
  if (hero.id === "aviad") return <mesh position={[0, 1.72, 0]}><sphereGeometry args={[0.38, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#4f5d51" /></mesh>;
  if (hero.id === "bruiner") return <Text position={[0.52, 1.75, 0]} fontSize={0.27} color="#fff1a8">Z</Text>;
  if (hero.id === "david") return <mesh position={[0.58, 1.1, 0]}><octahedronGeometry args={[0.2]} /><meshStandardMaterial color="#85d6ff" emissive="#1b6f8f" emissiveIntensity={0.35} /></mesh>;
  if (hero.id === "dan") return <DreiSparkles count={32} scale={[1.9, 1.9, 1.9]} color="#fff1a8" speed={0.6} />;
  return null;
}

function KashiModel({ phase, density = "low", boss = {} }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const bossColor = boss.color || (phase >= 4 ? "#b68cff" : "#8e44ad");
  const label = (boss.name || "Boss").toUpperCase();
  if (boss.type === "dadLife") return density === "high" ? <DadLifeBossModel phase={phase} density={density} boss={boss} /> : <FastDadLifeBossModel phase={phase} boss={boss} />;
  return (
    <group scale={phase >= 4 ? 1.18 : 1}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <circleGeometry args={[1.02, 40]} />
        <meshBasicMaterial color="#060914" transparent opacity={0.42} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.062, 0]}>
        <ringGeometry args={[1.08, 1.28, 52]} />
        <meshBasicMaterial color="#ee6656" transparent opacity={0.88} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.066, 0]}>
        <ringGeometry args={[1.34, 1.42, 52]} />
        <meshBasicMaterial color={bossColor} transparent opacity={0.58} />
      </mesh>
      <mesh position={[0, 1.05, -0.06]}><sphereGeometry args={[1.15, 24, 24]} /><meshBasicMaterial color={phase >= 4 ? bossColor : "#31203f"} transparent opacity={0.18} /></mesh>
      <CharacterArtBillboard src={boss.image || KASHI_ART} position={[0, 1.12, 0.08]} height={2.16} outlineColor={bossColor} />
      <mesh position={[0, 2.34, 0.02]}><cylinderGeometry args={[0.32, 0.26, 0.13, 8]} /><meshStandardMaterial color="#f5c451" /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * 0.18, 2.46, 0.02]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color="#8e44ad" /></mesh>)}
      <Billboard position={[0, 2.14, 0]}><Text fontSize={0.16} color="#f8f3df" outlineWidth={0.02} outlineColor="#10151f">{label}</Text></Billboard>
      {phase >= 2 && <DreiSparkles count={Math.round(phase * 22 * visual.particleCount)} scale={[2.2, 2.1, 2.2]} color={bossColor} speed={0.68} />}
    </group>
  );
}

const MemoKashiModel = React.memo(KashiModel);

function FastDadLifeBossModel({ phase, boss = {} }) {
  const chaosColor = phase >= 3 ? "#d8f56f" : phase >= 2 ? "#55b8dc" : "#ff9fc0";
  return (
    <group scale={1.1}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.035, 0]}>
        <circleGeometry args={[1.32, 32]} />
        <meshBasicMaterial color="#050813" transparent opacity={0.42} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.058, 0]}>
        <ringGeometry args={[1.38, 1.64, 36]} />
        <meshBasicMaterial color={chaosColor} transparent opacity={0.74} />
      </mesh>
      <mesh castShadow position={[0, 0.78, 0]}><boxGeometry args={[1.25, 1.12, 0.9]} /><meshStandardMaterial color="#f8f3df" roughness={0.78} /></mesh>
      <mesh castShadow position={[-0.5, 0.62, 0.05]}><boxGeometry args={[0.58, 0.58, 0.46]} /><meshStandardMaterial color="#58c7a6" roughness={0.62} /></mesh>
      <mesh castShadow position={[0.52, 0.62, -0.05]}><boxGeometry args={[0.58, 0.58, 0.46]} /><meshStandardMaterial color="#f5c451" roughness={0.62} /></mesh>
      <mesh castShadow position={[0, 1.42, 0]} rotation-y={Math.PI / 2}><cylinderGeometry args={[0.48, 0.48, 0.16, 24]} /><meshStandardMaterial color={phase >= 2 ? "#ee6656" : "#fff1a8"} roughness={0.46} /></mesh>
      <mesh position={[0, 1.42, -0.1]} rotation-y={Math.PI / 2}><torusGeometry args={[0.5, 0.03, 8, 28]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh position={[0.0, 1.98, 0]}><boxGeometry args={[0.82, 0.08, 0.5]} /><meshStandardMaterial color="#e8d8ad" roughness={0.84} /></mesh>
      <mesh position={[0.72, 1.18, 0.12]}><boxGeometry args={[0.36, 0.22, 0.08]} /><meshStandardMaterial color="#d8f56f" /></mesh>
      <mesh position={[-0.72, 1.18, 0.12]}><boxGeometry args={[0.36, 0.16, 0.08]} /><meshStandardMaterial color="#55b8dc" /></mesh>
      <Billboard position={[0, 2.24, 0]}>
        <Text essential={false} fontSize={0.17} color="#fff1a8" outlineWidth={0.024} outlineColor="#10151f">{(boss.name || "Dad Life").toUpperCase()}</Text>
      </Billboard>
    </group>
  );
}

function DadLifeBossModel({ phase, density = "low", boss = {} }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const chaosColor = phase >= 3 ? "#d8f56f" : phase >= 2 ? "#55b8dc" : "#ff9fc0";
  return (
    <group scale={phase >= 3 ? 1.2 : 1.08}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.035, 0]}>
        <circleGeometry args={[1.35, 48]} />
        <meshBasicMaterial color="#050813" transparent opacity={0.42} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.058, 0]}>
        <ringGeometry args={[1.42, 1.72, 64]} />
        <meshBasicMaterial color={chaosColor} transparent opacity={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.78, 0]}><boxGeometry args={[1.35, 1.2, 0.92]} /><meshStandardMaterial color="#f8f3df" roughness={0.78} /></mesh>
      <mesh castShadow position={[0.48, 0.58, -0.12]} rotation-z={-0.18}><boxGeometry args={[0.74, 0.7, 0.58]} /><meshStandardMaterial color="#f5c451" roughness={0.62} /></mesh>
      <mesh castShadow position={[-0.45, 0.58, 0.08]} rotation-z={0.22}><boxGeometry args={[0.72, 0.62, 0.52]} /><meshStandardMaterial color="#58c7a6" roughness={0.62} /></mesh>
      <mesh castShadow position={[0, 1.48, 0]} rotation-y={Math.PI / 2}><cylinderGeometry args={[0.56, 0.56, 0.18, 32]} /><meshStandardMaterial color={phase >= 2 ? "#ee6656" : "#fff1a8"} roughness={0.46} /></mesh>
      <mesh position={[0, 1.48, -0.11]} rotation-y={Math.PI / 2}><torusGeometry args={[0.58, 0.035, 8, 36]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh position={[0, 1.48, -0.2]} rotation-z={phase >= 3 ? -0.8 : 0.35}><boxGeometry args={[0.05, 0.42, 0.04]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh position={[0, 1.48, -0.21]} rotation-z={phase >= 3 ? 0.9 : -0.55}><boxGeometry args={[0.04, 0.34, 0.04]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh castShadow position={[-0.96, 0.95, 0]} rotation-z={0.54}><boxGeometry args={[0.36, 1.05, 0.2]} /><meshStandardMaterial color="#55b8dc" roughness={0.54} /></mesh>
      <mesh castShadow position={[0.96, 0.95, 0]} rotation-z={-0.54}><boxGeometry args={[0.36, 1.05, 0.2]} /><meshStandardMaterial color="#d8f56f" roughness={0.54} /></mesh>
      <mesh castShadow position={[-1.1, 0.36, 0.02]} rotation-x={Math.PI / 2}><torusGeometry args={[0.24, 0.07, 10, 24]} /><meshStandardMaterial color="#10151f" /></mesh>
      <mesh castShadow position={[1.1, 0.36, 0.02]} rotation-x={Math.PI / 2}><torusGeometry args={[0.24, 0.07, 10, 24]} /><meshStandardMaterial color="#10151f" /></mesh>
      {[-0.56, -0.22, 0.22, 0.58].map((x, index) => (
        <mesh key={index} castShadow position={[x, 2.0 + (index % 2) * 0.08, 0]} rotation-z={(index - 1.5) * 0.12}>
          <boxGeometry args={[0.38, 0.08, 0.42]} />
          <meshStandardMaterial color={index % 2 ? "#e8d8ad" : "#f8f3df"} roughness={0.84} />
        </mesh>
      ))}
      <mesh position={[-0.72, 1.7, 0.08]}><boxGeometry args={[0.44, 0.12, 0.08]} /><meshStandardMaterial color="#55b8dc" /></mesh>
      <Billboard position={[-0.72, 1.7, 0.15]}><Text fontSize={0.08} color="#10151f">ORDERS</Text></Billboard>
      <mesh position={[0.7, 1.72, 0.08]}><boxGeometry args={[0.48, 0.2, 0.08]} /><meshStandardMaterial color="#d8f56f" /></mesh>
      <Billboard position={[0.7, 1.72, 0.15]}><Text fontSize={0.08} color="#10151f">LOW</Text></Billboard>
      <Billboard position={[0, 2.42, 0]}>
        <Text fontSize={0.19} color="#fff1a8" outlineWidth={0.024} outlineColor="#10151f">{(boss.name || "Dad Life").toUpperCase()}</Text>
      </Billboard>
      {phase >= 2 && <DreiSparkles count={Math.round((phase >= 3 ? 64 : 42) * visual.particleCount)} scale={[2.4, 2.2, 2.4]} color={chaosColor} speed={0.64} />}
    </group>
  );
}

function EnemyModel({ enemy }) {
  const density = React.useContext(SceneQualityContext);
  const markerSegments = density === "high" ? 28 : 16;
  const scale = enemy.mode === "miniBoss" ? 1.35 : enemy.mode === "blocker" ? 1.15 : 1;
  const healthRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
  const isGrape = enemy.type.startsWith("grape") || enemy.type === "vineSoldier";
  const isDesert = enemy.type === "bedouinWarrior" || enemy.type === "desertRaider";
  return (
    <group position={[enemy.x, 0, enemy.z]} scale={scale}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.035, 0]}>
        <circleGeometry args={[enemy.radius * 1.25, markerSegments]} />
        <meshBasicMaterial color="#050813" transparent opacity={0.34} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
        <ringGeometry args={[enemy.radius * 1.22, enemy.radius * 1.38, markerSegments]} />
        <meshBasicMaterial color={enemy.type === "bedouinWarrior" ? "#ee6656" : "#ff4e63"} transparent opacity={0.72} />
      </mesh>
      {density !== "high" ? <FastEnemyModel enemy={enemy} /> : DAD_KINGDOM_ENEMY_TYPES.has(enemy.type) ? <DadKingdomEnemyModel enemy={enemy} /> : isDesert ? <BedouinEnemyModel enemy={enemy} /> : isGrape ? <GrapeEnemyModel enemy={enemy} /> : <ThemedEnemyModel enemy={enemy} />}
      <UnitHealthBar ratio={healthRatio} color={enemy.type === "bedouinWarrior" ? "#f5c451" : enemy.color} y={1.22} />
    </group>
  );
}

function FastEnemyModel({ enemy }) {
  const cue = enemyCue(enemy);
  const mini = enemy.mode === "miniBoss";
  const bulky = mini || enemy.mode === "blocker" || enemy.mode === "charger";
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow position={[0, bulky ? 0.52 : 0.48, 0]}>
        <capsuleGeometry args={[bulky ? 0.28 : 0.22, bulky ? 0.58 : 0.46, 6, 10]} />
        <meshStandardMaterial color={cue.body} roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0, bulky ? 0.98 : 0.88, 0]}>
        <sphereGeometry args={[bulky ? 0.18 : 0.15, 10, 10]} />
        <meshStandardMaterial color="#f2bc8f" roughness={0.58} />
      </mesh>
      <mesh position={[0, bulky ? 1.12 : 1.0, 0]}><boxGeometry args={[bulky ? 0.44 : 0.34, 0.12, 0.28]} /><meshStandardMaterial color={cue.accent} roughness={0.54} /></mesh>
      <mesh position={[0.34, 0.62, 0]} rotation-z={-0.35}>
        <boxGeometry args={[0.22, 0.26, 0.08]} />
        <meshStandardMaterial color={enemy.projectileColor || cue.accent} roughness={0.48} emissive={enemy.mode === "sniper" ? cue.accent : "#000000"} emissiveIntensity={enemy.mode === "sniper" ? 0.18 : 0} />
      </mesh>
      {mini && <mesh position={[0, 1.28, 0]}><coneGeometry args={[0.24, 0.22, 5]} /><meshStandardMaterial color="#f5c451" /></mesh>}
    </group>
  );
}

function enemyCue(enemy) {
  const type = enemy.type;
  if (type === "monkey") return { body: "#9b6a3f", accent: "#f5c451", icon: "MON", prop: "banana" };
  if (["presentationIntern", "meetingEnforcer", "slideBomber", "spreadsheetAuditor", "keynoteKnight", "slideOverlord"].includes(type)) return { body: "#ff8f52", accent: "#f8f3df", icon: "SLIDE", prop: "paper" };
  if (["bedouinArcher", "camelRider", "desertScout", "royalTentGuard", "desertRaider"].includes(type)) return { body: "#d9a45f", accent: "#f5c451", icon: "DUNE", prop: "banana" };
  if (["cardDealer", "casinoGuard", "pokerPro", "diceThrower", "chipGambler", "jackpotBruiser"].includes(type)) return { body: "#305f46", accent: "#f5c451", icon: "CARD", prop: "card" };
  if (["choreBot", "errandRunner", "cleaningInspector", "laundryBasketGuard", "groceryBagger", "washingMachineWarden"].includes(type)) return { body: "#ff9fc0", accent: "#d8f3ff", icon: "MOP", prop: "mop" };
  if (["matchmakerAgent", "dateReminder", "calendarSniper", "flowerThrower", "loveLetterCourier", "awkwardDinnerHost"].includes(type)) return { body: "#d8a5ff", accent: "#ff9fc0", icon: "DATE", prop: "heart" };
  if (["partyBouncer", "nightlifeScout", "influencerDrone", "selfieSniper", "glowstickRaver", "vipGatekeeper"].includes(type)) return { body: "#9b78de", accent: "#ff9fc0", icon: "VIP", prop: "phone" };
  if (["aiBot", "promptSniper", "modelCore", "dataPacketCrawler", "laserTurret", "droneSupervisor"].includes(type)) return { body: "#17445c", accent: "#85d6ff", icon: "AI", prop: "core" };
  if (["otherGuy", "groupPuller", "inviteBomber", "chatSpammer", "planCanceler", "groupAdmin"].includes(type)) return { body: "#c97848", accent: "#e8d8ad", icon: "CHAT", prop: "bubble" };
  if (["debateHost", "argumentAgent", "policySniper", "microphoneHeckler", "podiumPusher", "debateModerator"].includes(type)) return { body: "#6f8ea8", accent: "#ff8f52", icon: "ARG", prop: "mic" };
  if (["shopperGuard", "luxuryClerk", "receiptBomber", "creditCardNinja", "perfumeSprayer", "boutiqueManager"].includes(type)) return { body: "#43361d", accent: "#f5c451", icon: "$", prop: "bag" };
  if (["fakeJersey", "reseller", "auctionBidder", "collector", "jerseyReseller", "dealHunter", "footballCollectorGuard"].includes(type)) return { body: "#193f2a", accent: "#68c58a", icon: "KIT", prop: "jersey" };
  if (["comfortGuard", "couchDefender", "napEnforcer", "pillowThrower", "blanketBurrito", "sleepChampion"].includes(type)) return { body: "#b78cff", accent: "#fff1a8", icon: "Z", prop: "pillow" };
  if (["familyScheduler", "dinnerInviteCourier", "choreListCaptain", "weekendPlanner"].includes(type)) return { body: "#8ba3ff", accent: "#fff1a8", icon: "PLAN", prop: "calendar" };
  return { body: enemy.color || "#8e44ad", accent: "#f8f3df", icon: enemy.name?.split(" ")?.[0]?.slice(0, 4).toUpperCase() || "BAD", prop: "paper" };
}

function ThemedEnemyModel({ enemy }) {
  const cue = enemyCue(enemy);
  const blocker = enemy.mode === "blocker" || enemy.mode === "miniBoss";
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow position={[0, blocker ? 0.54 : 0.5, 0]}>
        <capsuleGeometry args={[blocker ? 0.29 : 0.22, blocker ? 0.62 : 0.5, 8, 14]} />
        <meshStandardMaterial color={cue.body} roughness={0.58} emissive={enemy.summoned ? cue.body : "#000000"} emissiveIntensity={enemy.summoned ? 0.08 : 0} />
      </mesh>
      <mesh castShadow position={[0, blocker ? 1.02 : 0.93, 0]}><sphereGeometry args={[blocker ? 0.19 : 0.16, 14, 14]} /><meshStandardMaterial color="#f2bc8f" roughness={0.55} /></mesh>
      <mesh position={[0, blocker ? 1.16 : 1.05, 0]}><boxGeometry args={[blocker ? 0.48 : 0.38, 0.14, 0.32]} /><meshStandardMaterial color={cue.accent} roughness={0.52} /></mesh>
      <EnemyCueProp cue={cue} enemy={enemy} />
      <Billboard position={[0, blocker ? 1.45 : 1.32, 0]}>
        <Text fontSize={blocker ? 0.12 : 0.1} color="#f8f3df" outlineWidth={0.012} outlineColor="#10151f">{cue.icon}</Text>
      </Billboard>
      {enemy.attackPulse > 0 && <DreiSparkles count={8} scale={[0.86, 0.68, 0.86]} color={cue.accent} speed={1.1} />}
    </group>
  );
}

function EnemyCueProp({ cue, enemy }) {
  if (cue.prop === "banana") return <mesh position={[0.36, 0.66, 0]} rotation-z={-0.5}><torusGeometry args={[0.16, 0.035, 8, 16, Math.PI * 1.25]} /><meshStandardMaterial color={cue.accent} /></mesh>;
  if (cue.prop === "paper") return <mesh position={[0.36, 0.72, 0.02]}><boxGeometry args={[0.28, 0.34, 0.04]} /><meshStandardMaterial color={cue.accent} /></mesh>;
  if (cue.prop === "card") return <mesh position={[0.35, 0.72, 0.02]} rotation-z={-0.18}><boxGeometry args={[0.28, 0.38, 0.04]} /><meshStandardMaterial color="#f8f3df" /></mesh>;
  if (cue.prop === "mop") return <group><mesh position={[0.34, 0.68, 0]} rotation-z={-0.65}><cylinderGeometry args={[0.025, 0.025, 0.7, 8]} /><meshStandardMaterial color="#8bd6ff" /></mesh><mesh position={[0.52, 0.42, 0]}><boxGeometry args={[0.28, 0.06, 0.06]} /><meshStandardMaterial color="#f8f3df" /></mesh></group>;
  if (cue.prop === "heart") return <Billboard position={[0.36, 0.74, 0]}><Text fontSize={0.18} color={cue.accent} outlineWidth={0.012} outlineColor="#10151f">HE</Text></Billboard>;
  if (cue.prop === "phone") return <mesh position={[0.34, 0.76, 0.02]}><boxGeometry args={[0.16, 0.34, 0.04]} /><meshStandardMaterial color="#10151f" emissive={cue.accent} emissiveIntensity={0.2} /></mesh>;
  if (cue.prop === "core") return <mesh position={[0.34, 0.76, 0]}><octahedronGeometry args={[0.16]} /><meshStandardMaterial color={cue.accent} emissive={cue.accent} emissiveIntensity={0.35} /></mesh>;
  if (cue.prop === "bubble") return <Billboard position={[0.35, 0.78, 0]}><Text fontSize={0.16} color={cue.accent} outlineWidth={0.012} outlineColor="#10151f">...</Text></Billboard>;
  if (cue.prop === "mic") return <group><mesh position={[0.34, 0.68, 0]} rotation-z={-0.35}><cylinderGeometry args={[0.02, 0.02, 0.45, 8]} /><meshStandardMaterial color="#10151f" /></mesh><mesh position={[0.42, 0.9, 0]}><sphereGeometry args={[0.08, 10, 10]} /><meshStandardMaterial color={cue.accent} /></mesh></group>;
  if (cue.prop === "bag") return <mesh position={[0.35, 0.64, 0]}><boxGeometry args={[0.28, 0.32, 0.14]} /><meshStandardMaterial color={cue.accent} metalness={0.1} /></mesh>;
  if (cue.prop === "jersey") return <mesh position={[0.36, 0.72, 0.02]}><boxGeometry args={[0.3, 0.36, 0.04]} /><meshStandardMaterial color={cue.accent} /></mesh>;
  if (cue.prop === "pillow") return <mesh position={[0.34, 0.62, 0]}><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color={cue.accent} roughness={0.82} /></mesh>;
  if (cue.prop === "calendar") return <mesh position={[0.36, 0.72, 0.02]}><boxGeometry args={[0.3, 0.34, 0.04]} /><meshStandardMaterial color="#f8f3df" /></mesh>;
  return null;
}

function GrapeEnemyModel({ enemy }) {
  const grapeColor = enemy.mode === "miniBoss" ? "#f5c451" : enemy.color;
  return (
    <group position={[0, 0.1, 0]}>
      {[[-0.2, 0.48, 0], [0.2, 0.48, 0], [0, 0.72, 0], [-0.11, 0.28, 0.04], [0.11, 0.28, 0.04]].map((pos, index) => (
        <mesh key={index} castShadow position={pos}>
          <sphereGeometry args={[index === 2 ? 0.23 : 0.2, 14, 14]} />
          <meshStandardMaterial color={grapeColor} roughness={0.48} emissive={enemy.summoned ? grapeColor : "#000000"} emissiveIntensity={enemy.summoned ? 0.08 : 0} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.98, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f2bc8f" roughness={0.55} /></mesh>
      <mesh position={[0, 1.12, 0]}><sphereGeometry args={[0.21, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={enemy.mode === "trapper" ? "#6bbf6a" : "#596276"} roughness={0.62} /></mesh>
      {enemy.mode === "sniper" && <mesh position={[0.43, 0.72, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.035, 0.035, 0.82, 8]} /><meshStandardMaterial color="#10151f" /></mesh>}
      {enemy.mode === "trapper" && <mesh position={[0, 0.15, 0]}><torusGeometry args={[0.48, 0.035, 8, 24]} /><meshStandardMaterial color="#6bbf6a" /></mesh>}
      {enemy.mode === "bomber" && <mesh position={[0.34, 0.74, 0]}><icosahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color="#df7ca4" emissive="#5b1238" emissiveIntensity={0.35} /></mesh>}
      {enemy.mode === "miniBoss" && <mesh position={[0, 1.28, 0]}><coneGeometry args={[0.28, 0.25, 5]} /><meshStandardMaterial color="#f5c451" /></mesh>}
    </group>
  );
}

function DadKingdomEnemyModel({ enemy }) {
  if (enemy.type === "diaperTrooper") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.46, 0]}><capsuleGeometry args={[0.27, 0.56, 8, 14]} /><meshStandardMaterial color="#f8f3df" roughness={0.8} /></mesh>
        <mesh castShadow position={[0, 0.96, 0]}><sphereGeometry args={[0.18, 14, 14]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 0.78, -0.02]}><torusGeometry args={[0.3, 0.055, 8, 22]} /><meshStandardMaterial color="#8bd6ff" /></mesh>
        <mesh position={[0, 1.08, 0]}><boxGeometry args={[0.42, 0.16, 0.36]} /><meshStandardMaterial color="#58c7a6" /></mesh>
        <Billboard position={[0, 1.34, 0]}><Text fontSize={0.13} color="#f8f3df" outlineWidth={0.012} outlineColor="#204038">DIAPER</Text></Billboard>
      </group>
    );
  }
  if (enemy.type === "babyBottleMage") {
    return (
      <group position={[0, 0.06, 0]}>
        <mesh castShadow position={[0, 0.48, 0]}><capsuleGeometry args={[0.22, 0.62, 8, 14]} /><meshStandardMaterial color="#8bd6ff" roughness={0.62} /></mesh>
        <mesh castShadow position={[0, 0.98, 0]}><sphereGeometry args={[0.17, 14, 14]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 1.18, 0]}><coneGeometry args={[0.28, 0.34, 16]} /><meshStandardMaterial color="#d8f3ff" /></mesh>
        <mesh position={[0.43, 0.78, 0]} rotation-z={-0.38}><cylinderGeometry args={[0.055, 0.07, 0.78, 12]} /><meshStandardMaterial color="#d8f3ff" transparent opacity={0.9} /></mesh>
        <mesh position={[0.57, 1.13, 0]}><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#fffef2" emissive="#d8f3ff" emissiveIntensity={0.18} /></mesh>
        {enemy.attackPulse > 0 && <DreiSparkles count={10} scale={[0.9, 0.8, 0.9]} color="#d8f3ff" speed={1.1} />}
      </group>
    );
  }
  if (enemy.type === "shoppingCartCharger") {
    return (
      <group position={[0, 0.08, 0]} scale={1.05}>
        <ShoppingCartProp />
        <mesh position={[0, 0.78, -0.08]}><boxGeometry args={[0.46, 0.22, 0.18]} /><meshStandardMaterial color="#ee6656" /></mesh>
        <Billboard position={[0, 1.14, 0]}><Text fontSize={0.13} color="#fff1a8" outlineWidth={0.012} outlineColor="#10151f">RAM</Text></Billboard>
        {enemy.attackPulse > 0 && <DreiSparkles count={12} scale={[1.0, 0.6, 1.0]} color="#f5c451" speed={1.4} />}
      </group>
    );
  }
  if (enemy.type === "lowCostCollector") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.48, 0]}><capsuleGeometry args={[0.23, 0.58, 8, 14]} /><meshStandardMaterial color="#58c7a6" roughness={0.55} /></mesh>
        <mesh castShadow position={[0, 0.96, 0]}><sphereGeometry args={[0.17, 14, 14]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 1.12, 0]}><boxGeometry args={[0.48, 0.14, 0.34]} /><meshStandardMaterial color="#d8f56f" /></mesh>
        <mesh position={[0.42, 0.72, 0]} rotation-z={-0.25}><boxGeometry args={[0.36, 0.22, 0.045]} /><meshStandardMaterial color="#d8f56f" /></mesh>
        <Billboard position={[0.42, 0.72, 0.06]}><Text fontSize={0.08} color="#10151f">-70%</Text></Billboard>
      </group>
    );
  }
  if (enemy.type === "alarmClockSoldier") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.58, 0]}><cylinderGeometry args={[0.32, 0.32, 0.18, 18]} /><meshStandardMaterial color="#fff1a8" roughness={0.48} /></mesh>
        <mesh position={[0, 0.58, -0.1]}><torusGeometry args={[0.34, 0.035, 8, 24]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[-0.16, 1.03, 0]}><sphereGeometry args={[0.11, 10, 10]} /><meshStandardMaterial color="#ee6656" /></mesh>
        <mesh position={[0.16, 1.03, 0]}><sphereGeometry args={[0.11, 10, 10]} /><meshStandardMaterial color="#ee6656" /></mesh>
        <mesh position={[0, 0.58, -0.17]} rotation-z={enemy.attackPulse > 0 ? 1.2 : 0.4}><boxGeometry args={[0.035, 0.28, 0.035]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh castShadow position={[0, 0.22, 0]}><capsuleGeometry args={[0.18, 0.22, 6, 10]} /><meshStandardMaterial color="#55b8dc" /></mesh>
      </group>
    );
  }
  if (enemy.type === "milkCartonTitan") {
    return (
      <group position={[0, 0.05, 0]} scale={1.18}>
        <mesh castShadow position={[0, 0.74, 0]}><boxGeometry args={[0.72, 1.14, 0.66]} /><meshStandardMaterial color="#d8f3ff" roughness={0.36} /></mesh>
        <mesh castShadow position={[0, 1.42, 0]} rotation-z={Math.PI / 4}><boxGeometry args={[0.54, 0.25, 0.54]} /><meshStandardMaterial color="#f8f3df" /></mesh>
        <mesh position={[0, 0.82, -0.36]}><boxGeometry args={[0.48, 0.24, 0.04]} /><meshStandardMaterial color="#55b8dc" /></mesh>
        <Billboard position={[0, 1.74, 0]}><Text fontSize={0.14} color="#d8f3ff" outlineWidth={0.012} outlineColor="#10151f">MILK TITAN</Text></Billboard>
      </group>
    );
  }
  if (enemy.type === "reserveSoldier") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.5, 0]}><capsuleGeometry args={[0.23, 0.62, 8, 14]} /><meshStandardMaterial color="#4f5d51" roughness={0.72} /></mesh>
        <mesh castShadow position={[0, 0.98, 0]}><sphereGeometry args={[0.17, 14, 14]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 1.12, 0]}><sphereGeometry args={[0.24, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#55b8dc" /></mesh>
        <mesh position={[0.42, 0.72, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.035, 0.035, 0.8, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
        <Billboard position={[0, 1.36, 0]}><Text fontSize={0.12} color="#d8f3ff" outlineWidth={0.012} outlineColor="#10151f">RESERVE</Text></Billboard>
      </group>
    );
  }
  if (enemy.type === "couponKing") {
    return (
      <group position={[0, 0.06, 0]} scale={1.08}>
        <mesh castShadow position={[0, 0.52, 0]}><capsuleGeometry args={[0.34, 0.72, 8, 16]} /><meshStandardMaterial color="#d8f56f" roughness={0.52} /></mesh>
        <mesh castShadow position={[0, 1.08, 0]}><sphereGeometry args={[0.21, 14, 14]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 1.34, 0]}><coneGeometry args={[0.28, 0.28, 5]} /><meshStandardMaterial color="#f5c451" metalness={0.18} /></mesh>
        <Billboard position={[0, 0.68, 0.36]}><Text fontSize={0.15} color="#10151f">LOW COST</Text></Billboard>
        <Billboard position={[0, 1.7, 0]}><Text fontSize={0.14} color="#fff1a8" outlineWidth={0.012} outlineColor="#10151f">COUPON KING</Text></Billboard>
      </group>
    );
  }
  if (enemy.type === "strollerTitan") {
    return (
      <group position={[0, 0.04, 0]} scale={0.92}>
        <GiantStroller phase={3} />
        <mesh position={[0, 1.4, -0.14]}><sphereGeometry args={[0.24, 14, 14]} /><meshStandardMaterial color="#ee6656" emissive="#5b1238" emissiveIntensity={0.18} /></mesh>
        <Billboard position={[0, 2.0, 0]}><Text fontSize={0.15} color="#fff1a8" outlineWidth={0.012} outlineColor="#10151f">STROLLER TITAN</Text></Billboard>
      </group>
    );
  }
  if (enemy.type === "reserveCommander") {
    return (
      <group position={[0, 0.06, 0]} scale={1.08}>
        <mesh castShadow position={[0, 0.54, 0]}><capsuleGeometry args={[0.31, 0.72, 8, 16]} /><meshStandardMaterial color="#384250" roughness={0.66} /></mesh>
        <mesh castShadow position={[0, 1.1, 0]}><sphereGeometry args={[0.2, 14, 14]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 1.26, 0]}><sphereGeometry args={[0.3, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#55b8dc" /></mesh>
        <mesh position={[0.5, 0.78, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.05, 0.05, 0.9, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[-0.44, 0.84, 0]}><boxGeometry args={[0.18, 0.32, 0.08]} /><meshStandardMaterial color="#85d6ff" emissive="#17445c" emissiveIntensity={0.2} /></mesh>
        <Billboard position={[0, 1.66, 0]}><Text fontSize={0.14} color="#d8f3ff" outlineWidth={0.012} outlineColor="#10151f">COMMANDER</Text></Billboard>
      </group>
    );
  }
  return <GrapeEnemyModel enemy={enemy} />;
}

function BedouinEnemyModel({ enemy }) {
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow position={[0, 0.56, 0]}><capsuleGeometry args={[0.22, 0.54, 7, 12]} /><meshStandardMaterial color="#d9a45f" roughness={0.72} /></mesh>
      <mesh castShadow position={[0, 0.96, 0]}><sphereGeometry args={[0.18, 14, 14]} /><meshStandardMaterial color="#f2bc8f" roughness={0.55} /></mesh>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.48, 0.18, 0.42]} /><meshStandardMaterial color="#f8f3df" roughness={0.68} /></mesh>
      <mesh position={[-0.28, 0.62, 0]} rotation-z={0.36}><capsuleGeometry args={[0.055, 0.35, 5, 8]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      <mesh position={[0.36, 0.66, 0]} rotation-z={-0.72}><cylinderGeometry args={[0.035, 0.035, 0.78, 8]} /><meshStandardMaterial color="#684a24" /></mesh>
      <mesh position={[0.55, 0.92, 0]} rotation-z={-0.72}><boxGeometry args={[0.12, 0.34, 0.035]} /><meshStandardMaterial color="#e8d8ad" metalness={0.22} /></mesh>
      {enemy.attackPulse > 0 && <DreiSparkles count={10} scale={[0.8, 0.7, 0.8]} color="#f5c451" speed={1.2} />}
    </group>
  );
}

function SummonModel({ summon }) {
  const density = React.useContext(SceneQualityContext);
  const markerSegments = density === "high" ? 28 : 16;
  const pulse = 1 + (summon.attackPulse || 0) * 0.8;
  return (
    <group position={[summon.x, 0, summon.z]} scale={pulse}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.035, 0]}>
        <circleGeometry args={[summon.radius * 1.12, markerSegments]} />
        <meshBasicMaterial color="#050813" transparent opacity={0.32} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.055, 0]}>
        <ringGeometry args={[summon.radius * 1.06, summon.radius * 1.28, markerSegments]} />
        <meshBasicMaterial color="#8bd6ff" transparent opacity={0.74} />
      </mesh>
      {density !== "high" ? <FastSummonModel summon={summon} /> : summon.type === "reserve" ? <ReserveSummonModel summon={summon} /> : summon.type === "monkey" ? <MonkeySummonModel summon={summon} /> : summon.type === "drone" ? <DroneSummonModel summon={summon} /> : <CrewSummonModel summon={summon} />}
      <UnitHealthBar ratio={clamp(summon.hp / summon.maxHp, 0, 1)} color={summon.outline} y={1.18} />
    </group>
  );
}

function FastSummonModel({ summon }) {
  const flying = summon.type === "drone";
  const support = summon.role === "healer" || summon.role === "support" || summon.role === "guardian";
  return (
    <group position={[0, flying ? 0.72 : 0.08, 0]}>
      {flying ? (
        <>
          <mesh castShadow><octahedronGeometry args={[0.24]} /><meshStandardMaterial color={summon.color} emissive={summon.color} emissiveIntensity={0.26} /></mesh>
          <mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.36, 0.022, 6, 20]} /><meshStandardMaterial color={summon.outline} /></mesh>
        </>
      ) : (
        <>
          <mesh castShadow position={[0, 0.5, 0]}><capsuleGeometry args={[support ? 0.22 : 0.19, 0.44, 6, 10]} /><meshStandardMaterial color={summon.color} roughness={0.6} /></mesh>
          <mesh castShadow position={[0, 0.88, 0]}><sphereGeometry args={[0.15, 10, 10]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
          <mesh position={[0.28, 0.66, 0]}><boxGeometry args={[0.2, 0.24, 0.06]} /><meshStandardMaterial color={summon.outline} roughness={0.48} /></mesh>
        </>
      )}
    </group>
  );
}

function MonkeySummonModel({ summon }) {
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}><capsuleGeometry args={[0.2, 0.42, 7, 12]} /><meshStandardMaterial color="#9b6a3f" roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.88, 0]}><sphereGeometry args={[0.22, 14, 14]} /><meshStandardMaterial color="#7b4c2f" roughness={0.7} /></mesh>
      <mesh position={[-0.2, 0.91, 0]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color="#7b4c2f" /></mesh>
      <mesh position={[0.2, 0.91, 0]}><sphereGeometry args={[0.09, 10, 10]} /><meshStandardMaterial color="#7b4c2f" /></mesh>
      <mesh position={[0.27, 0.58, 0]} rotation-z={-0.5}><torusGeometry args={[0.18, 0.035, 8, 18, Math.PI * 1.25]} /><meshStandardMaterial color="#f5c451" /></mesh>
    </group>
  );
}

function ReserveSummonModel({ summon }) {
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow position={[0, 0.54, 0]}><capsuleGeometry args={[0.2, 0.5, 7, 12]} /><meshStandardMaterial color="#4f5d51" roughness={0.65} /></mesh>
      <mesh castShadow position={[0, 0.94, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      <mesh position={[0, 1.06, 0]}><sphereGeometry args={[0.2, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#55b8dc" /></mesh>
      <mesh position={[0.32, 0.66, 0]} rotation-z={-0.7}><cylinderGeometry args={[0.035, 0.035, 0.72, 8]} /><meshStandardMaterial color="#10151f" /></mesh>
    </group>
  );
}

function DroneSummonModel({ summon }) {
  return (
    <group position={[0, 0.82 + Math.sin(summon.spawnedAt + summon.ttl * 4) * 0.08, 0]}>
      <mesh castShadow><octahedronGeometry args={[0.26]} /><meshStandardMaterial color="#85d6ff" emissive="#1b6f8f" emissiveIntensity={0.4} roughness={0.35} /></mesh>
      <mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.42, 0.025, 8, 28]} /><meshStandardMaterial color="#d8f3ff" emissive="#85d6ff" emissiveIntensity={0.3} /></mesh>
      <mesh position={[-0.38, 0, 0]}><boxGeometry args={[0.18, 0.04, 0.08]} /><meshStandardMaterial color="#f8f3df" /></mesh>
      <mesh position={[0.38, 0, 0]}><boxGeometry args={[0.18, 0.04, 0.08]} /><meshStandardMaterial color="#f8f3df" /></mesh>
    </group>
  );
}

function CrewSummonModel({ summon }) {
  const color = summon.color;
  const outline = summon.outline;
  if (summon.type === "rabbi") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.55, 0]}><capsuleGeometry args={[0.19, 0.48, 7, 12]} /><meshStandardMaterial color={color} roughness={0.62} /></mesh>
        <mesh castShadow position={[0, 0.94, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 1.12, 0]}><boxGeometry args={[0.38, 0.12, 0.38]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[0.36, 0.66, 0]}><boxGeometry args={[0.08, 0.4, 0.06]} /><meshStandardMaterial color="#f8f3df" /></mesh>
      </group>
    );
  }
  if (summon.type === "presentation") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.52, 0]}><capsuleGeometry args={[0.18, 0.44, 7, 12]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.9, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0.38, 0.78, 0.02]}><boxGeometry args={[0.34, 0.42, 0.04]} /><meshStandardMaterial color="#f6e9bf" /></mesh>
        <Text position={[0.38, 0.79, 0.06]} fontSize={0.12} color="#10151f">III</Text>
      </group>
    );
  }
  if (summon.type === "consultant" || summon.type === "investor") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.54, 0]}><capsuleGeometry args={[0.21, 0.5, 7, 12]} /><meshStandardMaterial color={summon.type === "investor" ? "#1b2433" : color} /></mesh>
        <mesh castShadow position={[0, 0.96, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 0.66, 0.03]}><boxGeometry args={[0.13, 0.36, 0.04]} /><meshStandardMaterial color={summon.type === "investor" ? "#f5c451" : "#e8d8ad"} /></mesh>
        <Billboard position={[0.38, 0.78, 0]}><Text fontSize={0.18} color={outline}>{summon.type === "investor" ? "$" : "?"}</Text></Billboard>
      </group>
    );
  }
  if (summon.type === "discount") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.48, 0]}><capsuleGeometry args={[0.16, 0.38, 7, 12]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.82, 0]}><sphereGeometry args={[0.14, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <Billboard position={[0.28, 0.72, 0]}><Text fontSize={0.15} color="#d8f56f" outlineWidth={0.012} outlineColor="#10151f">%</Text></Billboard>
      </group>
    );
  }
  if (summon.type === "rider") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.72, 0]}><capsuleGeometry args={[0.16, 0.42, 7, 12]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 1.04, 0]}><sphereGeometry args={[0.14, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[-0.28, 0.32, 0]} rotation-y={Math.PI / 2}><torusGeometry args={[0.16, 0.035, 8, 18]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[0.28, 0.32, 0]} rotation-y={Math.PI / 2}><torusGeometry args={[0.16, 0.035, 8, 18]} /><meshStandardMaterial color="#10151f" /></mesh>
        <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.7, 0.08, 0.18]} /><meshStandardMaterial color={outline} /></mesh>
      </group>
    );
  }
  if (summon.type === "cleaner") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.48, 0]}><boxGeometry args={[0.46, 0.56, 0.34]} /><meshStandardMaterial color="#f8f3df" roughness={0.55} /></mesh>
        <mesh position={[0, 0.51, 0.19]}><torusGeometry args={[0.14, 0.025, 8, 20]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.93, 0]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      </group>
    );
  }
  if (summon.type === "soccer") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.52, 0]}><capsuleGeometry args={[0.18, 0.45, 7, 12]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.9, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0.36, 0.32, 0]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#f8f3df" /></mesh>
      </group>
    );
  }
  if (summon.type === "mechanic") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.54, 0]}><capsuleGeometry args={[0.2, 0.48, 7, 12]} /><meshStandardMaterial color={color} /></mesh>
        <mesh castShadow position={[0, 0.94, 0]}><sphereGeometry args={[0.17, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0.36, 0.7, 0]} rotation-z={-0.7}><cylinderGeometry args={[0.035, 0.035, 0.58, 8]} /><meshStandardMaterial color="#d7dce3" /></mesh>
      </group>
    );
  }
  if (summon.type === "agig") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh castShadow position={[0, 0.52, 0]}><capsuleGeometry args={[0.19, 0.44, 7, 12]} /><meshStandardMaterial color={color} emissive="#1b5a35" emissiveIntensity={0.15} /></mesh>
        <mesh castShadow position={[0, 0.9, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0, 0.56, 0]}><torusGeometry args={[0.38, 0.025, 8, 24]} /><meshStandardMaterial color={outline} /></mesh>
      </group>
    );
  }
  if (summon.type === "guardian") {
    return (
      <group position={[0, 0.08, 0]}>
        <mesh position={[0, 0.72, 0]}><sphereGeometry args={[0.62, 20, 20]} /><meshBasicMaterial color="#fff1a8" transparent opacity={0.16} /></mesh>
        <mesh castShadow position={[0, 0.62, 0]}><capsuleGeometry args={[0.23, 0.62, 7, 12]} /><meshStandardMaterial color={color} emissive="#fff1a8" emissiveIntensity={0.25} /></mesh>
        <mesh castShadow position={[0, 1.08, 0]}><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
        <mesh position={[0.42, 0.76, 0]} rotation-z={-0.5}><cylinderGeometry args={[0.035, 0.035, 0.76, 8]} /><meshStandardMaterial color="#fff8cf" /></mesh>
      </group>
    );
  }
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow position={[0, 0.5, 0]}><capsuleGeometry args={[0.18, 0.42, 7, 12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[0, 0.88, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color="#f2bc8f" /></mesh>
      <Billboard position={[0.28, 0.78, 0]}><Text fontSize={0.16} color={outline}>{summon.label || "!"}</Text></Billboard>
    </group>
  );
}

function UnitHealthBar({ ratio, color, y }) {
  return (
    <Billboard position={[0, y, 0]}>
      <mesh>
        <planeGeometry args={[0.48, 0.055]} />
        <meshBasicMaterial color="#10151f" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-(1 - ratio) * 0.24, 0, 0.01]}>
        <planeGeometry args={[Math.max(0.01, 0.48 * ratio), 0.04]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Billboard>
  );
}

function ProjectileModel({ projectile }) {
  const density = React.useContext(SceneQualityContext);
  const fast = density !== "high";
  const angle = Math.atan2(projectile.vz || 0, projectile.vx || 0.001);
  const ultimate = projectile.variant === "ultimate";
  const scale = ultimate ? 1.42 : 1;
  const color = projectile.color || "#f8f3df";
  const accent = projectile.accent || "#55b8dc";
  const aura = projectile.aura || accent;
  return (
    <group position={[projectile.x, projectile.y, projectile.z]} rotation-y={-angle} scale={scale}>
      <ProjectileTrail color={aura} fast={fast} ultimate={ultimate} />
      {ultimate && (
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[projectile.radius * 1.15, 0.035, 8, fast ? 18 : 28]} />
          <meshBasicMaterial color={aura} transparent opacity={0.42} />
        </mesh>
      )}
      <ProjectileBody kind={projectile.kind || "paperwork"} color={color} accent={accent} aura={aura} fast={fast} ultimate={ultimate} />
    </group>
  );
}

function ProjectileTrail({ color, fast, ultimate }) {
  return (
    <mesh position={[-0.36, 0, 0]} rotation-z={Math.PI / 2}>
      <coneGeometry args={[ultimate ? 0.16 : 0.1, ultimate ? 0.72 : 0.48, fast ? 7 : 10]} />
      <meshBasicMaterial color={color} transparent opacity={ultimate ? 0.24 : 0.16} />
    </mesh>
  );
}

function ProjectileCard({ color, accent, wide = false, folded = false }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[wide ? 0.72 : 0.56, 0.08, wide ? 0.46 : 0.36]} />
        <meshStandardMaterial color={color} roughness={0.48} emissive={color} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.05, 0.052, -0.08]}>
        <boxGeometry args={[wide ? 0.46 : 0.32, 0.025, 0.045]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={[-0.02, 0.054, 0.05]}>
        <boxGeometry args={[wide ? 0.54 : 0.36, 0.025, 0.035]} />
        <meshBasicMaterial color={accent} transparent opacity={0.72} />
      </mesh>
      {folded && (
        <mesh position={[0.27, 0.062, 0.14]} rotation-y={0.45}>
          <boxGeometry args={[0.14, 0.026, 0.14]} />
          <meshBasicMaterial color="#fff8cf" />
        </mesh>
      )}
    </group>
  );
}

function ProjectileBody({ kind, color, accent, aura, fast, ultimate }) {
  switch (kind) {
    case "slide":
      return <ProjectileCard color={color} accent={accent} wide />;
    case "paper":
    case "paperwork":
    case "assignment":
    case "choreList":
      return <ProjectileCard color={color} accent={accent} folded={kind !== "slide"} />;
    case "deadline":
      return (
        <group>
          <ProjectileCard color={color} accent={accent} wide />
          <mesh position={[0.34, 0.075, 0]}><boxGeometry args={[0.08, 0.18, 0.44]} /><meshBasicMaterial color="#ee6656" /></mesh>
        </group>
      );
    case "banana":
    case "explosiveBanana":
      return (
        <group rotation-z={-0.55}>
          <mesh><torusGeometry args={[ultimate || kind === "explosiveBanana" ? 0.25 : 0.2, 0.05, 7, fast ? 16 : 24, Math.PI * 1.28]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.18} /></mesh>
          <mesh position={[0.23, -0.13, 0]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[-0.22, 0.13, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color={accent} /></mesh>
          {(ultimate || kind === "explosiveBanana") && <mesh position={[0.04, 0.02, 0]}><icosahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color="#ee6656" emissive="#ff8f52" emissiveIntensity={0.35} /></mesh>}
        </group>
      );
    case "soccer":
    case "megaSoccer":
    case "agigBall":
      return (
        <group>
          <mesh><sphereGeometry args={[ultimate || kind !== "soccer" ? 0.28 : 0.21, fast ? 12 : 18, fast ? 12 : 18]} /><meshStandardMaterial color={color} roughness={0.46} emissive={kind === "agigBall" ? aura : "#000000"} emissiveIntensity={kind === "agigBall" ? 0.18 : 0} /></mesh>
          {[0, Math.PI / 2].map((rot) => <mesh key={rot} rotation-x={rot}><torusGeometry args={[ultimate || kind !== "soccer" ? 0.29 : 0.22, 0.015, 6, 24]} /><meshBasicMaterial color={accent} /></mesh>)}
          <mesh position={[0, 0.02, 0.2]}><circleGeometry args={[0.07, 5]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "spray":
    case "waterBlast":
      return (
        <group>
          <mesh position={[0.1, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[kind === "waterBlast" ? 0.08 : 0.045, kind === "waterBlast" ? 0.12 : 0.07, kind === "waterBlast" ? 0.86 : 0.5, fast ? 8 : 12]} /><meshStandardMaterial color={color} transparent opacity={0.88} emissive={aura} emissiveIntensity={0.2} /></mesh>
          {[-0.16, 0.04, 0.22].map((x, i) => <mesh key={i} position={[x, 0.12 - i * 0.08, (i - 1) * 0.08]}><sphereGeometry args={[0.055 + i * 0.012, 8, 8]} /><meshBasicMaterial color={accent} transparent opacity={0.7} /></mesh>)}
        </group>
      );
    case "book":
      return (
        <group>
          <mesh><boxGeometry args={[0.44, 0.14, 0.34]} /><meshStandardMaterial color={color} roughness={0.56} /></mesh>
          <mesh position={[-0.22, 0.085, 0]}><boxGeometry args={[0.04, 0.04, 0.34]} /><meshBasicMaterial color={accent} /></mesh>
          <mesh position={[0.08, 0.086, 0]}><boxGeometry args={[0.22, 0.035, 0.28]} /><meshBasicMaterial color="#f8f3df" /></mesh>
        </group>
      );
    case "torah":
      return (
        <group>
          {[-0.22, 0.22].map((x) => <mesh key={x} position={[x, 0, 0]} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.08, 0.08, 0.34, 12]} /><meshStandardMaterial color={accent} /></mesh>)}
          <mesh><boxGeometry args={[0.46, 0.08, 0.28]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.16} /></mesh>
        </group>
      );
    case "vipCard":
    case "goldenVip":
    case "creditCard":
    case "playingCard":
    case "loveLetter":
    case "invitation":
    case "flyer":
    case "calendar":
    case "priceTag":
    case "lowCostSign":
      return (
        <group>
          <ProjectileCard color={color} accent={accent} wide={kind === "lowCostSign" || kind === "goldenVip"} folded={kind === "loveLetter" || kind === "invitation"} />
          {kind === "priceTag" && <mesh position={[-0.24, 0.08, 0.1]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color="#10151f" /></mesh>}
          {kind === "calendar" && <mesh position={[0, 0.08, -0.16]}><boxGeometry args={[0.48, 0.035, 0.07]} /><meshBasicMaterial color={accent} /></mesh>}
        </group>
      );
    case "dataCube":
      return (
        <group>
          <mesh rotation-y={0.28} rotation-z={0.32}><boxGeometry args={[0.32, 0.32, 0.32]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.28} roughness={0.32} /></mesh>
          <mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.28, 0.018, 6, 22]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "laser":
      return <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.045, 0.045, ultimate ? 0.94 : 0.68, 10]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.55} /></mesh>;
    case "drone":
      return (
        <group>
          <mesh><octahedronGeometry args={[0.22]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.35} /></mesh>
          {[-0.26, 0.26].map((x) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.16, 0.035, 0.08]} /><meshBasicMaterial color={accent} /></mesh>)}
        </group>
      );
    case "wrench":
      return (
        <group>
          <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.035, 0.035, 0.58, 8]} /><meshStandardMaterial color={color} metalness={0.2} roughness={0.34} /></mesh>
          <mesh position={[0.31, 0, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.1, 0.028, 8, 16, Math.PI * 1.35]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[-0.27, 0, 0]}><boxGeometry args={[0.12, 0.11, 0.06]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case "missile":
      return (
        <group>
          <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.09, 0.11, 0.6, 12]} /><meshStandardMaterial color={color} roughness={0.42} /></mesh>
          <mesh position={[0.36, 0, 0]} rotation-z={-Math.PI / 2}><coneGeometry args={[0.12, 0.24, 12]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[-0.34, 0, 0]}><boxGeometry args={[0.08, 0.22, 0.16]} /><meshBasicMaterial color="#ee6656" /></mesh>
        </group>
      );
    case "microphone":
      return (
        <group>
          <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.04, 0.04, 0.42, 10]} /><meshStandardMaterial color={color} roughness={0.35} /></mesh>
          <mesh position={[0.25, 0, 0]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case "shockwave":
      return (
        <group>
          <mesh rotation-x={Math.PI / 2}><torusGeometry args={[0.28, 0.035, 8, 28]} /><meshBasicMaterial color={accent} transparent opacity={0.86} /></mesh>
          <ProjectileCard color={color} accent={accent} />
        </group>
      );
    case "money":
      return (
        <group>
          {[-0.12, 0.08, 0.22].map((x, i) => <mesh key={i} position={[x, i * 0.035, (i - 1) * 0.06]} rotation-z={(i - 1) * 0.24}><boxGeometry args={[0.34, 0.045, 0.2]} /><meshStandardMaterial color={color} roughness={0.46} /></mesh>)}
          <mesh position={[0.08, 0.12, 0]}><torusGeometry args={[0.09, 0.012, 6, 18]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "cart":
      return (
        <group>
          <mesh position={[0.04, 0.05, 0]} rotation-x={-0.18}><boxGeometry args={[0.46, 0.24, 0.34]} /><meshStandardMaterial color={color} transparent opacity={0.86} /></mesh>
          <mesh position={[0.32, 0.18, 0]} rotation-z={-0.55}><cylinderGeometry args={[0.018, 0.018, 0.42, 7]} /><meshBasicMaterial color="#10151f" /></mesh>
          {[[-0.12, -0.18], [0.18, -0.18], [-0.12, 0.18], [0.18, 0.18]].map(([x, z], i) => <mesh key={i} position={[x, -0.14, z]} rotation-x={Math.PI / 2}><torusGeometry args={[0.055, 0.014, 6, 12]} /><meshBasicMaterial color="#10151f" /></mesh>)}
        </group>
      );
    case "milk":
      return (
        <group>
          <mesh><boxGeometry args={[0.28, 0.42, 0.28]} /><meshStandardMaterial color={color} roughness={0.38} /></mesh>
          <mesh position={[0, 0.26, 0]} rotation-z={Math.PI / 4}><boxGeometry args={[0.28, 0.12, 0.28]} /><meshStandardMaterial color={accent} /></mesh>
        </group>
      );
    case "jersey":
      return (
        <group>
          <mesh><boxGeometry args={[0.36, 0.36, 0.12]} /><meshStandardMaterial color={color} /></mesh>
          {[-0.26, 0.26].map((x) => <mesh key={x} position={[x, 0.08, 0]} rotation-z={x > 0 ? -0.45 : 0.45}><boxGeometry args={[0.2, 0.14, 0.11]} /><meshStandardMaterial color={color} /></mesh>)}
          <mesh position={[0, 0.12, 0.07]}><boxGeometry args={[0.18, 0.05, 0.03]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "pillow":
      return (
        <group>
          <mesh><boxGeometry args={[0.46, 0.22, 0.34]} /><meshStandardMaterial color={color} roughness={0.82} /></mesh>
          {[-0.18, 0.18].map((x) => <mesh key={x} position={[x, 0.02, 0.13]}><sphereGeometry args={[0.035, 8, 8]} /><meshBasicMaterial color={accent} /></mesh>)}
        </group>
      );
    case "sleepCloud":
      return (
        <group>
          {[[-0.16, 0, 0], [0.06, 0.05, 0.08], [0.22, -0.02, -0.02], [0, -0.04, -0.1]].map((pos, i) => <mesh key={i} position={pos}><sphereGeometry args={[0.13 + i * 0.015, 10, 10]} /><meshBasicMaterial color={i % 2 ? color : accent} transparent opacity={0.82} /></mesh>)}
        </group>
      );
    case "energyBolt":
      return (
        <group>
          <mesh position={[0.06, 0, 0]} rotation-z={-Math.PI / 2}><coneGeometry args={[0.16, 0.48, 4]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.4} /></mesh>
          <mesh position={[-0.18, 0, 0]}><octahedronGeometry args={[0.12]} /><meshStandardMaterial color={accent} emissive={aura} emissiveIntensity={0.28} /></mesh>
        </group>
      );
    case "portal":
      return (
        <group>
          <mesh rotation-y={Math.PI / 2}><torusGeometry args={[0.26, 0.055, 10, fast ? 24 : 36]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.35} /></mesh>
          <mesh><octahedronGeometry args={[0.16]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} /></mesh>
        </group>
      );
    case "spear":
      return (
        <group>
          <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.026, 0.026, 0.72, 8]} /><meshStandardMaterial color={accent} roughness={0.62} /></mesh>
          <mesh position={[0.42, 0, 0]} rotation-z={-Math.PI / 2}><coneGeometry args={[0.09, 0.2, 8]} /><meshStandardMaterial color={color} metalness={0.16} /></mesh>
        </group>
      );
    case "rock":
      return <mesh rotation={[0.3, 0.4, 0.2]}><dodecahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>;
    case "pokerChip":
      return (
        <group>
          <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.23, 0.23, 0.06, 24]} /><meshStandardMaterial color={color} roughness={0.4} /></mesh>
          <mesh rotation-z={Math.PI / 2}><torusGeometry args={[0.18, 0.025, 8, 22]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "dice":
      return (
        <group rotation={[0.32, 0.42, 0.18]}>
          <mesh><boxGeometry args={[0.32, 0.32, 0.32]} /><meshStandardMaterial color={color} roughness={0.42} /></mesh>
          {[[-0.08, 0.17, 0.08], [0.08, 0.17, -0.08], [0, 0.17, 0]].map((pos, i) => <mesh key={i} position={pos}><sphereGeometry args={[0.025, 6, 6]} /><meshBasicMaterial color={accent} /></mesh>)}
        </group>
      );
    case "laundryBasket":
      return (
        <group>
          <mesh><boxGeometry args={[0.42, 0.28, 0.34]} /><meshStandardMaterial color={color} transparent opacity={0.82} /></mesh>
          <mesh position={[0, 0.18, 0]}><torusGeometry args={[0.21, 0.018, 8, 20]} /><meshBasicMaterial color={accent} /></mesh>
          <mesh position={[0.05, 0.28, 0.02]}><sphereGeometry args={[0.1, 8, 8]} /><meshBasicMaterial color="#f8f3df" /></mesh>
        </group>
      );
    case "groceryBag":
      return (
        <group>
          <mesh><boxGeometry args={[0.32, 0.42, 0.26]} /><meshStandardMaterial color={color} roughness={0.78} /></mesh>
          <mesh position={[0, 0.25, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[0.12, 0.018, 8, 16, Math.PI]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "heart":
      return (
        <group rotation-z={Math.PI}>
          <mesh position={[-0.08, 0.06, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color={color} /></mesh>
          <mesh position={[0.08, 0.06, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color={color} /></mesh>
          <mesh position={[0, -0.08, 0]} rotation-z={Math.PI / 4}><boxGeometry args={[0.18, 0.18, 0.12]} /><meshBasicMaterial color={color} /></mesh>
        </group>
      );
    case "flower":
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.cos(i * 1.26) * 0.13, Math.sin(i * 1.26) * 0.13, 0]}><sphereGeometry args={[0.075, 8, 8]} /><meshBasicMaterial color={color} /></mesh>)}
          <mesh><sphereGeometry args={[0.07, 8, 8]} /><meshBasicMaterial color={accent} /></mesh>
        </group>
      );
    case "selfie":
      return (
        <group>
          <mesh><boxGeometry args={[0.24, 0.44, 0.06]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 0.02, 0.04]}><boxGeometry args={[0.18, 0.28, 0.025]} /><meshBasicMaterial color={accent} /></mesh>
          <mesh position={[0.07, 0.16, 0.055]}><sphereGeometry args={[0.025, 8, 8]} /><meshBasicMaterial color="#f8f3df" /></mesh>
        </group>
      );
    case "glowStick":
      return <mesh rotation-z={Math.PI / 2}><cylinderGeometry args={[0.055, 0.055, 0.7, 12]} /><meshStandardMaterial color={color} emissive={aura} emissiveIntensity={0.58} /></mesh>;
    case "radioOrder":
      return (
        <group>
          <mesh><boxGeometry args={[0.34, 0.26, 0.18]} /><meshStandardMaterial color={accent} roughness={0.5} /></mesh>
          <mesh position={[0.18, 0.18, 0]} rotation-z={-0.5}><cylinderGeometry args={[0.018, 0.018, 0.36, 7]} /><meshBasicMaterial color={color} /></mesh>
          <mesh position={[-0.08, 0.02, 0.1]}><boxGeometry args={[0.08, 0.06, 0.03]} /><meshBasicMaterial color={color} /></mesh>
        </group>
      );
    case "toy":
      return (
        <group>
          <mesh rotation-z={0.8}><cylinderGeometry args={[0.055, 0.055, 0.48, 10]} /><meshStandardMaterial color={accent} /></mesh>
          <mesh position={[0.22, 0.18, 0]}><sphereGeometry args={[0.14, 10, 10]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[-0.18, -0.18, 0]}><sphereGeometry args={[0.1, 10, 10]} /><meshStandardMaterial color={aura} /></mesh>
        </group>
      );
    default:
      return <ProjectileCard color={color} accent={accent} folded />;
  }
}

function TelegraphModel({ telegraph }) {
  const lineMid = telegraph.lineFrom && telegraph.lineTo ? {
    x: (telegraph.lineFrom.x + telegraph.lineTo.x) / 2,
    z: (telegraph.lineFrom.z + telegraph.lineTo.z) / 2
  } : null;
  const lineLength = telegraph.lineFrom && telegraph.lineTo ? Math.max(0.1, distance(telegraph.lineFrom, telegraph.lineTo)) : 0;
  const lineAngle = telegraph.lineFrom && telegraph.lineTo ? Math.atan2(telegraph.lineTo.z - telegraph.lineFrom.z, telegraph.lineTo.x - telegraph.lineFrom.x) : 0;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[telegraph.x, 0.075, telegraph.z]}>
        <ringGeometry args={[telegraph.radius * 0.64, telegraph.radius, 36]} />
        <meshBasicMaterial color={telegraph.color || "#ee6656"} transparent opacity={0.5} />
      </mesh>
      {lineMid && (
        <mesh position={[lineMid.x, 0.08, lineMid.z]} rotation-y={-lineAngle}>
          <boxGeometry args={[lineLength, 0.025, 0.08]} />
          <meshBasicMaterial color={telegraph.color || "#ee6656"} transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
}

function TrapModel({ trap, density = "low" }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const active = (trap.arm || 0) <= 0;
  return (
    <group position={[trap.x, 0.04, trap.z]}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[trap.radius * 0.72, trap.radius, 36]} />
        <meshBasicMaterial color={trap.color} transparent opacity={active ? 0.58 : 0.28} />
      </mesh>
      {active && <DreiSparkles count={Math.max(4, Math.round(24 * visual.trapSparkles))} scale={[trap.radius * 1.2, 0.36, trap.radius * 1.2]} color={trap.color} speed={0.52} />}
    </group>
  );
}

function VineWall({ wall, density = "low" }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  return <group position={[wall.x, 0.55, wall.z]}><mesh castShadow><boxGeometry args={[0.44, 1.1, 2.8]} /><meshStandardMaterial color={wall.color} roughness={0.82} /></mesh><DreiSparkles count={Math.max(3, Math.round(18 * visual.trapSparkles))} scale={[0.48, 0.95, 2.3]} color="#8e44ad" /></group>;
}

function Burst({ particle, density = "low" }) {
  const visual = VISUAL_DENSITY[density] || VISUAL_DENSITY[DEFAULT_QUALITY];
  const count = clamp(Math.round((14 + particle.scale * 7) * visual.particleCount), 5, 24);
  return <DreiSparkles position={[particle.x, 0.95, particle.z]} count={count} scale={[particle.scale * 1.45, particle.scale * 0.82, particle.scale * 1.45]} color={particle.color} speed={1.05} />;
}

function DamageNumber({ item }) {
  return <Html position={[item.x, 1.8 + item.ttl * 0.6, item.z]} center><div className="damage-number" style={{ color: item.color }}>{item.text}</div></Html>;
}

function Subtitle({ item }) {
  return <Html position={[item.x, 2.35, item.z]} center><div className={`speech-bubble ${item.speaker === "kashi" ? "boss" : ""}`}>{item.line}</div></Html>;
}

function Portrait3D({ hero, locked }) {
  return (
    <span className={`portrait3d ${locked ? "locked" : ""}`} style={{ "--c": hero.color }}>
      {!locked && hero.image ? <img src={hero.image} alt="" /> : <b>{locked ? <Lock size={18} /> : hero.initials}</b>}
      {!locked && <small>{HERO_SYMBOLS[hero.id]}</small>}
    </span>
  );
}

const rootElement = document.getElementById("root");
rootElement.__danQuestRoot ||= createRoot(rootElement);
rootElement.__danQuestRoot.render(<App />);
