const fs = require("node:fs");
const vm = require("node:vm");

class MockElement {
  constructor(id) {
    this.id = id;
    this.children = [];
    this.style = {};
    this.hidden = false;
    this.textContent = "";
    this._innerHTML = "";
    this.className = "";
    this.dataset = {};
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }
  addEventListener() {}
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  remove() {}
  insertAdjacentHTML() {}
  setPointerCapture() {}
  querySelectorAll() {
    return [];
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 128, height: 128, right: 128, bottom: 128 };
  }
}

function makeContext2d() {
  const target = {
    getTransform() {
      return {};
    },
    measureText(text) {
      return { width: String(text).length * 8 };
    },
    getImageData() {
      return { data: new Uint8ClampedArray(4) };
    }
  };
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      return () => {};
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    }
  });
}

const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, new MockElement(id));
  return elements.get(id);
}

const canvas = element("gameCanvas");
canvas.getContext = () => makeContext2d();

[
  "hud",
  "hudLevel",
  "hudMission",
  "hudObjective",
  "hudProgress",
  "partyHud",
  "toast",
  "touchControls",
  "movePad",
  "moveKnob",
  "attackButton",
  "ultButton",
  "swapButton",
  "pauseButton",
  "menuLayer"
].forEach(element);

let frameCount = 0;
const storage = new Map();
const context = {
  console,
  Math,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  Boolean,
  JSON,
  URLSearchParams,
  Uint8ClampedArray,
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  },
  setTimeout(fn) {
    return 0;
  },
  clearTimeout() {},
  performance: {
    now() {
      return 1000 + frameCount * 16;
    }
  },
  requestAnimationFrame(callback) {
    frameCount += 1;
    if (frameCount <= 8) callback(1000 + frameCount * 16);
    return frameCount;
  },
  document: {
    getElementById(id) {
      return element(id);
    },
    createElement(tag) {
      return new MockElement(tag);
    }
  },
  window: {
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 1,
    location: { search: "?autoplay=1" },
    addEventListener() {}
  }
};
context.window.performance = context.performance;
context.window.requestAnimationFrame = context.requestAnimationFrame;
context.window.localStorage = context.localStorage;

const code = fs.readFileSync("outputs/dan-quest/game.js", "utf8");
vm.runInNewContext(code, context, { filename: "game.js" });

console.log(JSON.stringify({
  frames: frameCount,
  hudHidden: element("hud").hidden,
  controlsHidden: element("touchControls").hidden,
  mission: element("hudMission").textContent,
  objective: element("hudProgress").textContent,
  saved: storage.size > 0
}));
