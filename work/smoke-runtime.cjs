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
    this.classList = { toggle() {}, add() {}, remove() {} };
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
  setPointerCapture() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 120, height: 120, right: 120, bottom: 120 };
  }
}

function makeContext() {
  const ctx = {
    getTransform() {
      return {};
    },
    getImageData() {
      return { data: new Uint8ClampedArray(4) };
    }
  };
  return new Proxy(ctx, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    }
  });
}

const ids = [
  "gameCanvas",
  "overlay",
  "overlayTitle",
  "overlayKicker",
  "overlayCopy",
  "playButton",
  "playLabel",
  "hearts",
  "storeMeter",
  "guardStatus",
  "movePad",
  "moveKnob",
  "fireButton",
  "dashButton"
];
const elements = Object.fromEntries(ids.map((id) => [id, new MockElement(id)]));
elements.gameCanvas.getContext = () => makeContext();

let rafCount = 0;
const context = {
  console,
  Math,
  Set,
  Array,
  Uint8ClampedArray,
  URLSearchParams,
  performance: { now: () => 1000 + rafCount * 16 },
  requestAnimationFrame(callback) {
    rafCount += 1;
    if (rafCount <= 3) callback(1000 + rafCount * 16);
    return rafCount;
  },
  window: {
    innerWidth: 390,
    innerHeight: 844,
    devicePixelRatio: 1,
    location: { search: "?autoplay=1" },
    addEventListener() {}
  },
  document: {
    getElementById(id) {
      return elements[id] || new MockElement(id);
    },
    createElement(tag) {
      return new MockElement(tag);
    }
  }
};
context.window.requestAnimationFrame = context.requestAnimationFrame;
context.window.performance = context.performance;

const code = fs.readFileSync("outputs/mendel-store-dash/game.js", "utf8");
vm.runInNewContext(code, context, { filename: "game.js" });
console.log(JSON.stringify({
  frames: rafCount,
  overlayHidden: elements.overlay.hidden,
  hearts: elements.hearts.children.length,
  guardStatus: elements.guardStatus.textContent
}));
