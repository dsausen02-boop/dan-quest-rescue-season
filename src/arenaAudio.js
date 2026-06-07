import { Howl, Howler } from "howler";

function wavDataUri(freq = 440, duration = 0.12, type = "sine", gain = 0.32) {
  const sampleRate = 22050;
  const samples = Math.floor(sampleRate * duration);
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) bytes[offset + i] = text.charCodeAt(i);
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const env = Math.pow(1 - i / samples, 1.7);
    let wave = Math.sin(2 * Math.PI * freq * t);
    if (type === "square") wave = wave > 0 ? 1 : -1;
    if (type === "saw") wave = 2 * (t * freq - Math.floor(0.5 + t * freq));
    if (type === "noise") wave = Math.random() * 2 - 1;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, wave * env * gain)) * 32767, true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const cues = {
  menu: new Howl({ src: [wavDataUri(520, 0.08, "sine")], volume: 0.36 }),
  attack: new Howl({ src: [wavDataUri(390, 0.08, "square")], volume: 0.34 }),
  special: new Howl({ src: [wavDataUri(240, 0.16, "saw")], volume: 0.4 }),
  ultimate: new Howl({ src: [wavDataUri(156, 0.34, "saw")], volume: 0.46 }),
  hit: new Howl({ src: [wavDataUri(122, 0.09, "noise", 0.24)], volume: 0.38 }),
  boss: new Howl({ src: [wavDataUri(82, 0.5, "saw", 0.28)], volume: 0.42 }),
  unlock: new Howl({ src: [wavDataUri(820, 0.24, "sine")], volume: 0.44 }),
  voice: new Howl({ src: [wavDataUri(610, 0.18, "square", 0.2)], volume: 0.32 }),
  dadBirds: new Howl({ src: [wavDataUri(1160, 0.18, "sine", 0.12)], volume: 0.18 }),
  dadKids: new Howl({ src: [wavDataUri(740, 0.22, "sine", 0.1)], volume: 0.14 }),
  dadMarket: new Howl({ src: [wavDataUri(360, 0.28, "square", 0.11)], volume: 0.16 }),
  dadRadio: new Howl({ src: [wavDataUri(210, 0.24, "noise", 0.09)], volume: 0.14 }),
  music: new Howl({ src: [wavDataUri(104, 1.6, "sine", 0.09)], volume: 0.16, loop: true })
};

export const VOICE_LINES = {
  mendel: {
    spawn: ["Monkey time.", "I know a guy!"],
    basic: ["Don't ask!", "Banana delivery!"],
    special: ["I know a guy!"],
    ultimate: ["MONKEY ARMY!", "THE BEDOUINS!"],
    hurt: ["Worth it!"],
    victory: ["Probably fine!"],
    defeat: ["Don't ask."],
    boss: ["Kashi, I found you."]
  },
  tal: {
    spawn: ["I disagree!"],
    basic: ["Listen!", "That makes no sense!"],
    special: ["I have a presentation."],
    ultimate: ["SLIDE ONE THOUSAND!"],
    hurt: ["Counterpoint!"],
    victory: ["As I was saying."],
    defeat: ["I object."],
    boss: ["Kashi, that argument collapses."]
  },
  hadar: {
    spawn: ["I saw it on YouTube."],
    basic: ["Window cleaner attack."],
    special: ["I was cleaning windows."],
    ultimate: ["MOM!"],
    hurt: ["I don't know."],
    victory: ["Tutorial complete."],
    defeat: ["The washing machine won."],
    boss: ["Kashi, I might be on your side. Wait, no."]
  },
  amit: {
    spawn: ["Guys, relax."],
    basic: ["Calm down."],
    special: ["Responsible adult moment."],
    ultimate: ["RABBI MODE!"],
    hurt: ["Still calm."],
    victory: ["Good, everybody breathe."],
    defeat: ["We will try again."],
    boss: ["Kashi, enough."]
  },
  goodman: {
    spawn: ["Trust me."],
    basic: ["I got this."],
    special: ["Check the numbers."],
    ultimate: ["Hold my beer."],
    hurt: ["Still profitable."],
    victory: ["Easy accounting."],
    defeat: ["Bad quarter."],
    boss: ["Kashi, your spreadsheet is cooked."]
  },
  giat: {
    spawn: ["Where are we?"],
    basic: ["Is this Low Cost?"],
    special: ["Low Cost confusion."],
    ultimate: ["LOW COST!"],
    hurt: ["Was that included?"],
    victory: ["Cheap win."],
    defeat: ["Wrong terminal."],
    boss: ["Kashi, is this Low Cost?"]
  },
  halel: {
    spawn: ["Focus."],
    basic: ["Precise."],
    special: ["Prince mode."],
    ultimate: ["Family Alliance!"],
    hurt: ["Careful."],
    victory: ["Clean ride."],
    defeat: ["Long route."],
    boss: ["Kashi, stand still."]
  },
  amichai: {
    spawn: ["Five more minutes."],
    basic: ["Maybe later."],
    special: ["Punch time."],
    ultimate: ["WE'RE WINNING!"],
    hurt: ["I'm awake."],
    victory: ["Back to sleep."],
    defeat: ["Wake me when we retry."],
    boss: ["Kashi woke me up."]
  },
  gelman: {
    spawn: ["Buy it."],
    basic: ["I know a guy."],
    special: ["Luxury hit."],
    ultimate: ["Thailand spending spree!"],
    hurt: ["Bill it."],
    victory: ["First class."],
    defeat: ["Refund?"],
    boss: ["Kashi, I can buy your empire."]
  },
  kuzar: {
    spawn: ["Too expensive."],
    basic: ["Who's paying?"],
    special: ["BUY THE DIP!"],
    ultimate: ["AGIG!"],
    hurt: ["Absolutely not."],
    victory: ["AGIG TO THE MOON!"],
    defeat: ["No refund."],
    boss: ["Kashi, your grapes cost too much."]
  },
  farber: {
    spawn: ["I can fix this."],
    basic: ["Move."],
    special: ["Wrench ready."],
    ultimate: ["Garage King."],
    hurt: ["Still works."],
    victory: ["Fixed."],
    defeat: ["Needs parts."],
    boss: ["Kashi, your castle needs maintenance."]
  },
  aviad: {
    spawn: ["What's happening?"],
    basic: ["Again?"],
    special: ["Rookie charge."],
    ultimate: ["Back to the army!"],
    hurt: ["Training issue."],
    victory: ["I passed?"],
    defeat: ["Basic training again."],
    boss: ["Kashi, report to base."]
  },
  bruiner: {
    spawn: ["Huh?"],
    basic: ["Wake me up later."],
    special: ["Sleep toss."],
    ultimate: ["Power nap."],
    hurt: ["Too loud."],
    victory: ["Nap time."],
    defeat: ["I was sleeping."],
    boss: ["Kashi, lower the volume."]
  },
  david: {
    spawn: ["Winter is here."],
    basic: ["AI tool ready."],
    special: ["Model says freeze."],
    ultimate: ["Artificial intelligence!"],
    hurt: ["Recalculating."],
    victory: ["Prediction confirmed."],
    defeat: ["Bad dataset."],
    boss: ["Kashi, I trained on your deadlines."]
  },
  dan: {
    spawn: ["Hey guys."],
    basic: ["Relax."],
    special: ["Weekend miracle."],
    ultimate: ["DAN RETURNS."],
    hurt: ["Still here."],
    victory: ["We are back."],
    defeat: ["Not done."],
    boss: ["Kashi, that's enough."]
  },
  kashi: {
    spawn: ["You work for me now."],
    basic: ["Assignment.", "Deadline."],
    special: ["See you Monday."],
    ultimate: ["THE BEDOUINS!", "SEE YOU MONDAY!"],
    rage: ["ENOUGH!"],
    hurt: ["Impossible."],
    victory: ["Deadline."],
    defeat: ["My grapes..."],
    boss: ["You work for me now."]
  }
};

export const COMBO_VOICES = {
  "mendel-goodman": ["Goodman: Is this legal?", "Mendel: Probably not."],
  "tal-amit": ["Tal: I have a plan.", "Amit: Please don't."],
  "gelman-kuzar": ["Gelman: Let's buy it.", "Kuzar: Absolutely not."],
  "giat-bruiner": ["Giat: Is this Low Cost?", "Bruiner: I was sleeping."]
};

const lastSpoken = new Map();
let levels = { master: 0.86, music: 0.42, sfx: 0.78, voice: 0.88, muted: false, muteVoices: false };

const voiceProfiles = {
  mendel: { pitch: 0.92, rate: 1.12 },
  tal: { pitch: 1.05, rate: 1.22 },
  hadar: { pitch: 1.18, rate: 1.04 },
  amit: { pitch: 0.82, rate: 0.88 },
  goodman: { pitch: 0.78, rate: 1.04 },
  giat: { pitch: 1.25, rate: 0.95 },
  halel: { pitch: 0.9, rate: 0.98 },
  amichai: { pitch: 0.72, rate: 0.78 },
  gelman: { pitch: 0.86, rate: 1.02 },
  kuzar: { pitch: 1.12, rate: 1.16 },
  farber: { pitch: 0.72, rate: 0.92 },
  aviad: { pitch: 1.02, rate: 1 },
  bruiner: { pitch: 0.7, rate: 0.72 },
  david: { pitch: 1.15, rate: 0.9 },
  dan: { pitch: 0.78, rate: 0.86 },
  kashi: { pitch: 0.62, rate: 0.84 }
};

export function setAudioLevels(next = {}) {
  levels = { ...levels, ...next };
  Howler.mute(Boolean(levels.muted));
  cues.music.volume(levels.music * levels.master);
  ["menu", "attack", "special", "ultimate", "hit", "boss", "unlock", "dadBirds", "dadKids", "dadMarket", "dadRadio"].forEach((name) => cues[name].volume(levels.sfx * levels.master));
  cues.voice.volume(levels.voice * levels.master);
}

export function playCue(name) {
  if (name === "voice" && levels.muteVoices) return;
  cues[name]?.play();
}

export function startMusic() {
  if (!cues.music.playing()) cues.music.play();
}

export function stopMusic() {
  cues.music.stop();
}

export function stopAllAudio() {
  Object.values(cues).forEach((cue) => {
    if (cue.loop()) cue.stop();
  });
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

function speakWithBrowserVoice(id, line) {
  if (levels.muted || levels.muteVoices) return false;
  if (typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
  const utterance = new window.SpeechSynthesisUtterance(line);
  const profile = voiceProfiles[id] || voiceProfiles.mendel;
  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  utterance.volume = clamp01(levels.voice * levels.master);
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (voices.length) {
    const preferred = id === "kashi" || id === "dan" ? voices.find((voice) => /male|david|daniel|mark|alex/i.test(voice.name)) : voices.find((voice) => /female|zira|samantha|aria/i.test(voice.name));
    utterance.voice = preferred || voices[Math.abs(id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % voices.length];
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function testVoiceLine(id = "mendel") {
  const line = VOICE_LINES[id]?.ultimate?.[0] || VOICE_LINES[id]?.spawn?.[0] || "DAN QUEST voice test.";
  playCue("voice");
  speakWithBrowserVoice(id, line);
  return line;
}

export function speakLine(id, kind, emitSubtitle, preferredLine) {
  if (levels.muteVoices) return null;
  const key = `${id}:${kind}`;
  const now = performance.now();
  if ((lastSpoken.get(key) || 0) + 1800 > now) return null;
  const options = VOICE_LINES[id]?.[kind] || VOICE_LINES[id]?.basic || [];
  const line = preferredLine || options[Math.floor(Math.random() * options.length)];
  if (!line) return null;
  lastSpoken.set(key, now);
  playCue("voice");
  speakWithBrowserVoice(id, line);
  emitSubtitle?.({ id: `${key}:${now}`, speaker: id, line, ttl: 2.3 });
  return line;
}
