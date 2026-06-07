import { Howl, Howler } from "howler";

function wavDataUri(freq = 440, duration = 0.12, type = "sine") {
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
    const env = Math.pow(1 - i / samples, 1.85);
    let wave = Math.sin(2 * Math.PI * freq * t);
    if (type === "square") wave = wave > 0 ? 1 : -1;
    if (type === "saw") wave = 2 * (t * freq - Math.floor(0.5 + t * freq));
    const value = Math.max(-1, Math.min(1, wave * env * 0.32));
    view.setInt16(44 + i * 2, value * 32767, true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const sounds = {
  menu: new Howl({ src: [wavDataUri(520, 0.08, "sine")], volume: 0.35 }),
  attack: new Howl({ src: [wavDataUri(360, 0.06, "square")], volume: 0.28 }),
  hit: new Howl({ src: [wavDataUri(150, 0.08, "saw")], volume: 0.32 }),
  unlock: new Howl({ src: [wavDataUri(740, 0.18, "sine")], volume: 0.38 }),
  ultimate: new Howl({ src: [wavDataUri(220, 0.22, "saw")], volume: 0.42 }),
  boss: new Howl({ src: [wavDataUri(92, 0.35, "saw")], volume: 0.36 }),
  monkey: new Howl({ src: [wavDataUri(640, 0.1, "square")], volume: 0.24 }),
  ambient: new Howl({ src: [wavDataUri(98, 1.2, "sine")], volume: 0.08, loop: true })
};

export function setSoundEnabled(enabled) {
  Howler.mute(!enabled);
}

export function playSound(name) {
  const sound = sounds[name];
  if (sound) sound.play();
}

export function startAmbient() {
  if (!sounds.ambient.playing()) sounds.ambient.play();
}

export function stopAmbient() {
  sounds.ambient.stop();
}
