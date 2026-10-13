import { h, icon, storage } from './dom';
import { t } from '../i18n';

// Theme music: starts with the site and remembers the visitor's choice. Browsers block audible
// autoplay until the first interaction, so a blocked start is retried on the first click or key.
const SRC = `${import.meta.env.BASE_URL}theme-soung.mp3`;
const KEY = 'gbfr-music-v1';
const VOLUME = 0.35;
const FADE_IN_MS = 1600;
const FADE_OUT_MS = 450;

let audio: HTMLAudioElement | null = null;
let enabled = storage.get(KEY) !== 'off';
let fadeId = 0;

const playing = () => !!audio && !audio.paused;

function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
  }
  return audio;
}

/** Ramps the volume with an exponential ease-out, then runs `done`. */
function fade(to: number, ms: number, done?: () => void) {
  const a = el(), from = a.volume, start = performance.now(), id = ++fadeId;
  const step = (now: number) => {
    if (id !== fadeId) return;
    const p = Math.min(1, (now - start) / ms);
    a.volume = from + (to - from) * (1 - Math.pow(1 - p, 3));
    if (p < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
}

function start(): Promise<boolean> {
  const a = el();
  return a.play().then(() => { fade(VOLUME, FADE_IN_MS); return true; }, () => false);
}

function stop() {
  if (!playing()) return;
  fade(0, FADE_OUT_MS, () => audio?.pause());
}

function toggle() {
  if (playing() && enabled) { enabled = false; stop(); }
  else { enabled = true; start(); }
  storage.set(KEY, enabled ? 'on' : 'off');
  sync();
}

/** Keeps every rendered toggle (the header re-renders often) in step with the real playback. */
function sync() {
  const on = enabled && playing();
  document.querySelectorAll<HTMLButtonElement>('.music-btn').forEach(btn => paint(btn, on));
}

function paint(btn: HTMLButtonElement, on: boolean) {
  btn.setAttribute('aria-pressed', String(on));
  btn.title = on ? t('musicTurnOff') : t('musicTurnOn');
  btn.classList.toggle('on', on);
  btn.replaceChildren(icon(on ? 'soundOn' : 'soundOff'));
}

export function musicButton(): HTMLButtonElement {
  const btn = h('button', { type: 'button', class: 'btn ghost music-btn', 'aria-label': t('music'), onclick: toggle });
  paint(btn, enabled && playing());
  return btn;
}

export function initMusic() {
  // Pause while the tab is hidden; resume on return if the visitor still wants it.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (playing()) { fadeId++; audio!.pause(); } }
    else if (enabled && audio && audio.currentTime > 0) start();
  });
  if (!enabled) return;
  start().then(ok => {
    if (ok) return;
    const unlock = (e: Event) => {
      // The toggle handles its own click; starting here too would make that click switch it off.
      if ((e.target as Element | null)?.closest?.('.music-btn')) return;
      off();
      if (enabled && !playing()) start();
    };
    const off = () => { removeEventListener('pointerdown', unlock, true); removeEventListener('keydown', unlock, true); };
    addEventListener('pointerdown', unlock, true);
    addEventListener('keydown', unlock, true);
  });
}
