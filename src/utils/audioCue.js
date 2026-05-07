// Fictifly branded audio cue — Barcelona ink
// Pays homage to the Barcelona metro tone: B4 root, stepwise chromatic rise,
// bell timbre, ~1.2s duration. Differentiated by warmer harmonic ratios,
// shifted interval sequence (B4→C#5→D#5→F#5), and a softer decay tail.

const AUDIO_CUE = {
  sound: 'barcelonaInk',
  pitch: 0,        // semitones — 0 = concert pitch
  sustain: 0.72,   // decay duration in seconds
  reverb: 0.18,    // wet amount (0–1)
  volume: 0.68,
  quietVolume: 0.27,
};

let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function addReverb(ctx, destination, amount) {
  if (amount <= 0.01) return;
  const len = Math.floor(ctx.sampleRate * 1.6 * amount);
  const convBuf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = convBuf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = convBuf;
  const rvg = ctx.createGain();
  rvg.gain.value = amount * 0.4;
  destination.connect(conv);
  conv.connect(rvg);
  rvg.connect(ctx.destination);
}

// Synthesised bell tone: sine fundamental + detuned partials for warmth
// Harmonic ratios are warmer than a real bell (2.1, 3.4 vs metallic 2.756, 5.4)
function bellTone(ctx, dest, freq, startTime, amp, duration) {
  const partials = [
    { ratio: 1,    gain: 1.0,  decayMult: 1.0  },
    { ratio: 2.1,  gain: 0.18, decayMult: 0.55 },
    { ratio: 3.4,  gain: 0.10, decayMult: 0.38 },
    { ratio: 5.2,  gain: 0.05, decayMult: 0.22 },
  ];

  partials.forEach(({ ratio, gain: g, decayMult }) => {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.connect(og);
    og.connect(dest);
    o.type = 'sine';
    o.frequency.value = freq * ratio;

    const attackTime = 0.008;
    og.gain.setValueAtTime(0, startTime);
    og.gain.linearRampToValueAtTime(amp * g, startTime + attackTime);
    og.gain.exponentialRampToValueAtTime(0.001, startTime + duration * decayMult);

    o.start(startTime);
    o.stop(startTime + duration * decayMult + 0.05);
  });
}

/**
 * Play the Fictifly audio cue.
 * @param {boolean} quiet - If true, plays at quietVolume (single-field refresh).
 */
export function playAudioCue(quiet = false) {
  try {
    const ctx = getAudioCtx();
    const { pitch, sustain, reverb } = AUDIO_CUE;
    const vol = quiet ? AUDIO_CUE.quietVolume : AUDIO_CUE.volume;
    const r = 2 ** (pitch / 12);
    const t = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    // Metro-homage sequence: B4 root + stepwise chromatic rise
    // Intervals shifted from metro (B→D→D#→F) to (B→C#→D#→F#)
    // giving a major-flavoured rise rather than minor — warmer for a creative platform
    const B4  = 493.88 * r;
    const Cs5 = 554.37 * r;  // C#5 — shifted from metro's D4
    const Ds5 = 622.25 * r;  // D#5 — same as metro
    const Fs5 = 739.99 * r;  // F#5 — shifted from metro's F5

    // Slight bass undertone (B3) — warm foundation, quieter than metro's
    const B3 = 246.94 * r;
    const bassO = ctx.createOscillator();
    const bassG = ctx.createGain();
    bassO.connect(bassG); bassG.connect(master);
    bassO.type = 'sine'; bassO.frequency.value = B3;
    bassG.gain.setValueAtTime(0.08, t);
    bassG.gain.exponentialRampToValueAtTime(0.001, t + sustain * 0.9);
    bassO.start(t); bassO.stop(t + sustain);

    // Four bell notes — slightly more separated than the metro
    // Metro overlaps them; we give each a little more space to breathe
    const spacing = 0.11;
    bellTone(ctx, master, B4,  t,                    0.42, sustain * 1.0);
    bellTone(ctx, master, Cs5, t + spacing,           0.32, sustain * 0.88);
    bellTone(ctx, master, Ds5, t + spacing * 2,       0.36, sustain * 0.94);
    bellTone(ctx, master, Fs5, t + spacing * 3,       0.28, sustain * 0.78);

    // Resolution — B4 returns softly (metro resolves back; we keep that gesture)
    bellTone(ctx, master, B4,  t + spacing * 3.6,    0.18, sustain * 0.85);

    addReverb(ctx, master, reverb);
  } catch {
    // Audio unavailable — fail silently
  }
}

// ── Badge cue — Crescendo ──────────────────────────────────────────────────
// Same barcelona ink DNA, elevated: more notes, fuller shimmer bloom,
// longer sustain. Clearly rewarding without being over the top.

const BADGE_CUE = {
  sound: 'barcelonaInkCrescendo',
  pitch: 0,
  sustain: 0.9,
  reverb: 0.28,
  volume: 0.70,
};

/**
 * Play the Fictifly badge earned audio cue.
 */
export function playBadgeCue() {
  try {
    const ctx = getAudioCtx();
    const { pitch, sustain, reverb, volume } = BADGE_CUE;
    const r = 2 ** (pitch / 12);
    const t = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    const B4  = 493.88 * r;
    const Cs5 = 554.37 * r;
    const Ds5 = 622.25 * r;
    const Fs5 = 739.99 * r;
    const A5  = 880.00 * r;
    const B5  = 987.77 * r;

    // Bass foundation — slightly more present for the badge
    const B3 = 246.94 * r;
    const bassO = ctx.createOscillator();
    const bassG = ctx.createGain();
    bassO.connect(bassG); bassG.connect(master);
    bassO.type = 'sine'; bassO.frequency.value = B3;
    bassG.gain.setValueAtTime(0.12, t);
    bassG.gain.exponentialRampToValueAtTime(0.001, t + sustain);
    bassO.start(t); bassO.stop(t + sustain + 0.05);

    // Extended sequence — five rising notes + resolution
    const spacing = 0.10;
    bellTone(ctx, master, B4,  t,                    0.40, sustain * 0.95);
    bellTone(ctx, master, Cs5, t + spacing,           0.34, sustain * 0.88);
    bellTone(ctx, master, Ds5, t + spacing * 2,       0.38, sustain * 0.92);
    bellTone(ctx, master, Fs5, t + spacing * 3,       0.36, sustain * 0.88);
    bellTone(ctx, master, A5,  t + spacing * 4,       0.30, sustain * 0.82);
    bellTone(ctx, master, B5,  t + spacing * 5,       0.22, sustain * 0.70);

    // Resolution cascade back down
    bellTone(ctx, master, Fs5, t + spacing * 6,       0.18, sustain * 0.75);
    bellTone(ctx, master, B4,  t + spacing * 7,       0.22, sustain * 0.90);

    addReverb(ctx, master, reverb);
  } catch {
    // Audio unavailable — fail silently
  }
}