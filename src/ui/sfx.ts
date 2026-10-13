import { h, icon, storage } from './dom';
import { t } from '../i18n';

// Interface sounds, synthesized with Web Audio so nothing extra is downloaded: harp plucks,
// crystal bells and sparkles on a D major pentatonic, sent through a small generated hall reverb.
const KEY = 'gbfr-sfx-v1';
const VOLUME = 0.55;

export type Sfx = 'tap' | 'select' | 'next' | 'prev' | 'close' | 'load' | 'warn' | 'error' | 'confirm' | 'edit' | 'undo' | 'download' | 'drag';

let enabled = storage.get(KEY) !== 'off';
let ctx: AudioContext | null = null;
let master: GainNode, verb: ConvolverNode, noise: AudioBuffer;
const last: Partial<Record<Sfx, number>> = {};

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
// D major pentatonic from D4 upward: D E F# A B.
const PENTA = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88, 90, 93, 95];

function audio(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    // The compressor keeps stacked chimes from clipping.
    master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);
    verb = ctx.createConvolver();
    verb.buffer = hall(ctx, 2.4);
    verb.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Stereo impulse response: decaying noise reads as a stone hall. */
function hall(c: BaseAudioContext, secs: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * secs), buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5);
  }
  return buf;
}

/** A gain stage feeding the master dry and the hall wet. */
function bus(c: AudioContext, wet: number): GainNode {
  const g = c.createGain(), send = c.createGain();
  send.gain.value = wet;
  g.connect(master);
  g.connect(send).connect(verb);
  return g;
}

function envelope(g: GainNode, at: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
}

function tone(c: AudioContext, to: AudioNode, type: OscillatorType, freq: number, at: number, peak: number, attack: number, decay: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  envelope(g, at, peak, attack, decay);
  o.connect(g).connect(to);
  o.start(at);
  o.stop(at + attack + decay + 0.05);
}

// Inharmonic partials (ratio, level, decay scale) of a small crystal bell.
const BELL: [number, number, number][] = [[1, 1, 1], [2.0, 0.45, 0.6], [2.76, 0.3, 0.42], [5.4, 0.14, 0.24], [8.93, 0.06, 0.14]];

function bell(c: AudioContext, to: AudioNode, freq: number, at: number, vol: number, decay = 1.4) {
  for (const [r, lv, ds] of BELL) if (freq * r < 18000) tone(c, to, 'sine', freq * r, at, vol * lv, 0.003, decay * ds);
}

/** Harp-like pluck: a bright triangle whose lowpass closes as the string rings out. */
function pluck(c: AudioContext, to: AudioNode, freq: number, at: number, vol: number, decay = 0.9) {
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 0.8;
  f.frequency.setValueAtTime(Math.min(freq * 10, 14000), at);
  f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.4, 300), at + decay);
  f.connect(to);
  tone(c, f, 'triangle', freq, at, vol, 0.004, decay);
  tone(c, f, 'sine', freq * 2, at, vol * 0.35, 0.004, decay * 0.6);
}

/** Tiny high glints scattered over the top of the scale. */
function sparkle(c: AudioContext, to: AudioNode, at: number, count: number, vol: number, spread = 0.05) {
  for (let i = 0; i < count; i++) {
    const n = PENTA[8 + Math.floor(Math.random() * 7)] + 12;
    bell(c, to, hz(n), at + i * spread + Math.random() * spread * 0.5, vol * (0.6 + Math.random() * 0.4), 0.35);
  }
}

/** Airy band-passed noise sweep, the swish of a spell or a cape. */
function whoosh(c: AudioContext, to: AudioNode, from: number, toHz: number, at: number, dur: number, vol: number) {
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noise;
  src.loop = true;
  f.type = 'bandpass';
  f.Q.value = 1.4;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(toHz, at + dur);
  envelope(g, at, vol, dur * 0.45, dur * 0.55);
  src.connect(f).connect(g).connect(to);
  src.start(at);
  src.stop(at + dur + 0.05);
}

const SOUNDS: Record<Sfx, (c: AudioContext, at: number) => void> = {
  tap: (c, at) => bell(c, bus(c, 0.12), hz(93), at, 0.05, 0.22),
  select: (c, at) => {
    const o = bus(c, 0.35);
    whoosh(c, o, 600, 2800, at, 0.3, 0.05);
    pluck(c, o, hz(74), at + 0.02, 0.1);
    bell(c, o, hz(86), at + 0.08, 0.09);
    sparkle(c, o, at + 0.14, 3, 0.03);
  },
  next: (c, at) => { const o = bus(c, 0.25); pluck(c, o, hz(69), at, 0.09, 0.6); pluck(c, o, hz(74), at + 0.06, 0.1, 0.8); },
  prev: (c, at) => { const o = bus(c, 0.25); pluck(c, o, hz(74), at, 0.09, 0.6); pluck(c, o, hz(69), at + 0.06, 0.1, 0.8); },
  close: (c, at) => { const o = bus(c, 0.3); whoosh(c, o, 2400, 500, at, 0.26, 0.04); pluck(c, o, hz(69), at + 0.05, 0.07, 0.6); },
  // The save is read: a harp glissando up two octaves, a bell chord and a shower of light.
  load: (c, at) => {
    const o = bus(c, 0.4);
    PENTA.slice(0, 11).forEach((n, i) => pluck(c, o, hz(n), at + i * 0.038, 0.05 + i * 0.006, 1.1));
    const top = at + 11 * 0.038;
    [86, 90, 93].forEach((n, i) => bell(c, o, hz(n), top + i * 0.018, 0.09, 1.8));
    pluck(c, o, hz(50), top, 0.12, 1.6);
    sparkle(c, o, top + 0.08, 7, 0.03, 0.06);
  },
  // Loaded, but the integrity hash does not match: the same rise ends on an uneasy minor bell.
  warn: (c, at) => {
    const o = bus(c, 0.4);
    PENTA.slice(0, 6).forEach((n, i) => pluck(c, o, hz(n), at + i * 0.04, 0.06, 0.9));
    bell(c, o, hz(65), at + 0.26, 0.12, 1.8);
    bell(c, o, hz(68), at + 0.3, 0.08, 1.6);
    pluck(c, o, hz(38), at + 0.26, 0.12, 1.4);
  },
  error: (c, at) => {
    const o = bus(c, 0.3);
    [65, 62, 57].forEach((n, i) => pluck(c, o, hz(n), at + i * 0.09, 0.1, 0.7));
    tone(c, o, 'sine', hz(38), at + 0.18, 0.18, 0.01, 0.5);
  },
  confirm: (c, at) => {
    const o = bus(c, 0.4);
    pluck(c, o, hz(62), at, 0.1, 1.2);
    [74, 78, 81].forEach((n, i) => bell(c, o, hz(n), at + 0.03 + i * 0.05, 0.08, 1.6));
    sparkle(c, o, at + 0.2, 4, 0.025);
  },
  edit: (c, at) => { const o = bus(c, 0.3); bell(c, o, hz(88), at, 0.07, 0.6); bell(c, o, hz(95), at + 0.07, 0.06, 0.8); sparkle(c, o, at + 0.12, 2, 0.02); },
  undo: (c, at) => { const o = bus(c, 0.3); [83, 78, 74].forEach((n, i) => pluck(c, o, hz(n), at + i * 0.05, 0.08, 0.6)); },
  // Downloading the sealed save: a short fanfare rising to an open fifth.
  download: (c, at) => {
    const o = bus(c, 0.4);
    whoosh(c, o, 400, 3200, at, 0.45, 0.04);
    [74, 81, 86].forEach((n, i) => pluck(c, o, hz(n), at + i * 0.09, 0.1, 1));
    bell(c, o, hz(86), at + 0.27, 0.1, 2);
    bell(c, o, hz(93), at + 0.29, 0.07, 2);
    sparkle(c, o, at + 0.35, 5, 0.025);
  },
  drag: (c, at) => { const o = bus(c, 0.5); whoosh(c, o, 300, 1800, at, 0.6, 0.035); sparkle(c, o, at + 0.15, 4, 0.02, 0.09); },
};

export function sfx(name: Sfx) {
  if (!enabled) return;
  // Before any gesture the context cannot start, so drop the sound instead of queueing it for later.
  // A context woken by this very gesture is still resuming; it will play what is scheduled.
  const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
  if (!activated && ctx?.state !== 'running') return;
  const c = audio();
  if (!c || c.state === 'closed') return;
  // Auto-repeat (held arrow keys, double clicks) should not stack the same sound.
  const now = performance.now();
  if (now - (last[name] ?? -Infinity) < 45) return;
  last[name] = now;
  SOUNDS[name](c, c.currentTime + 0.01);
}

function paint(btn: HTMLButtonElement) {
  btn.setAttribute('aria-pressed', String(enabled));
  btn.title = enabled ? t('sfxTurnOff') : t('sfxTurnOn');
  btn.classList.toggle('on', enabled);
  btn.replaceChildren(icon(enabled ? 'sfxOn' : 'sfxOff'));
}

export function sfxButton(): HTMLButtonElement {
  const btn: HTMLButtonElement = h('button', {
    type: 'button', class: 'btn ghost sfx-btn', 'aria-label': t('sfx'), 'data-sfx': 'none',
    onclick: () => {
      enabled = !enabled;
      storage.set(KEY, enabled ? 'on' : 'off');
      paint(btn);
      sfx('confirm');
    },
  });
  paint(btn);
  return btn;
}

// Clicks are voiced by delegation: an explicit data-sfx wins ("none" silences), then by element kind.
const BY_KIND: [string, Sfx][] = [
  ['.tab, [role="tab"]', 'next'],
  ['button, .btn, label.button, .brand, .drop', 'tap'],
];

export function initSfx() {
  // Audio may only start after a user gesture; wake the context on the first one.
  const wake = () => { if (audio()?.state === 'running') for (const e of WAKE) removeEventListener(e, wake, true); };
  const WAKE = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];
  for (const e of WAKE) addEventListener(e, wake, true);

  document.addEventListener('click', e => {
    const el = e.target as Element | null;
    if (!el?.closest || el.closest('.tab.off')) return;
    const tagged = el.closest<HTMLElement>('[data-sfx]');
    if (tagged) { if (tagged.dataset.sfx !== 'none') sfx(tagged.dataset.sfx as Sfx); return; }
    const kind = BY_KIND.find(([sel]) => el.closest(sel));
    if (kind) sfx(kind[1]);
  });
}
