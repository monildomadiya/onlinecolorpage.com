/**
 * Tiny WebAudio sound kit. Everything is synthesised, so the studio ships zero
 * audio assets and works offline.
 *
 * The AudioContext is created on first use, which is always inside a user
 * gesture (tap a tool, tap the canvas) - browsers block it otherwise.
 */

type Voice = 'pop' | 'splash' | 'tick' | 'swoosh' | 'nope' | 'fanfare' | 'sparkle';

let ctx: AudioContext | null = null;
let enabled = true;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;

  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function isSoundEnabled() {
  return enabled;
}

interface ToneOptions {
  freq: number;
  to?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone({ freq, to, duration = 0.12, type = 'sine', gain = 0.16, delay = 0 }: ToneOptions) {
  const ac = audio();
  if (!ac) return;

  if (ac.state === 'suspended') void ac.resume();

  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const vol = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to && to !== freq) osc.frequency.exponentialRampToValueAtTime(to, start + duration);

  // Short attack, exponential release - reads as a friendly "blip".
  vol.gain.setValueAtTime(0.0001, start);
  vol.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(vol).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration = 0.18, gain = 0.07) {
  const ac = audio();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();

  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Fade the noise out so it sounds like a brush, not a hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  }

  const src = ac.createBufferSource();
  const vol = ac.createGain();
  const filter = ac.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  vol.gain.value = gain;

  src.buffer = buffer;
  src.connect(filter).connect(vol).connect(ac.destination);
  src.start();
}

export function play(voice: Voice) {
  if (!enabled) return;

  switch (voice) {
    case 'pop':
      tone({ freq: 420, to: 880, duration: 0.1, type: 'triangle', gain: 0.18 });
      break;
    case 'splash':
      tone({ freq: 240, to: 620, duration: 0.16, type: 'sine', gain: 0.2 });
      tone({ freq: 700, to: 1200, duration: 0.1, type: 'triangle', gain: 0.08, delay: 0.04 });
      break;
    case 'tick':
      tone({ freq: 1100, duration: 0.05, type: 'square', gain: 0.07 });
      break;
    case 'swoosh':
      noise(0.14, 0.05);
      break;
    case 'nope':
      tone({ freq: 220, to: 160, duration: 0.14, type: 'sawtooth', gain: 0.1 });
      break;
    case 'sparkle':
      [1320, 1760, 2200].forEach((freq, i) =>
        tone({ freq, duration: 0.07, type: 'sine', gain: 0.07, delay: i * 0.045 }),
      );
      break;
    case 'fanfare':
      // C - E - G - C, a simple major arpeggio.
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
        tone({ freq, duration: 0.22, type: 'triangle', gain: 0.17, delay: i * 0.11 }),
      );
      break;
  }
}
