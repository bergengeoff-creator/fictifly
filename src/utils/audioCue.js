// Fictifly branded audio cue — ink portal minimal
// Ink drop character (three pitched plucks) with a faint portal shimmer tail.
// Tuned for repeated exposure: short, distinctive, non-fatiguing.

const AUDIO_CUE = {
  sound: 'inkPortalMinimal',
  pitch: 2,       // semitones up
  decay: 0.45,    // envelope decay in seconds
  reverb: 0.15,   // reverb wet amount (0–1)
  shimmer: 0.06,  // portal shimmer volume (0–1), kept subtle
  volume: 0.7,
  quietVolume: 0.28,
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
  const len = Math.floor(ctx.sampleRate * 1.2 * amount);
  const convBuf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = convBuf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = convBuf;
  const rvg = ctx.createGain();
  rvg.gain.value = amount * 0.5;
  destination.connect(conv);
  conv.connect(rvg);
  rvg.connect(ctx.destination);
}

/**
 * Play the Fictifly audio cue.
 * @param {boolean} quiet - If true, plays at quietVolume (single-field refresh).
 */
export function playAudioCue(quiet = false) {
  try {
    const ctx = getAudioCtx();
    const { pitch, decay, reverb, shimmer } = AUDIO_CUE;
    const vol = quiet ? AUDIO_CUE.quietVolume : AUDIO_CUE.volume;
    const r = 2 ** (pitch / 12);
    const t = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    // Ink drop — three ascending plucks, tightly spaced
    const inkFreqs = [392 * r, 523.25 * r, 659.25 * r];
    const noteSpacing = Math.min(0.055, decay * 0.12);
    inkFreqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.connect(og);
      og.connect(master);
      o.type = 'sine';
      o.frequency.value = f;
      const s = t + i * noteSpacing;
      og.gain.setValueAtTime(0, s);
      og.gain.linearRampToValueAtTime(0.38, s + 0.012);
      og.gain.exponentialRampToValueAtTime(0.001, s + decay);
      o.start(s);
      o.stop(s + decay + 0.05);
    });

    // Portal shimmer — faint rising harmonics after the plucks settle
    if (shimmer > 0.01) {
      const shimmerStart = t + noteSpacing * 2 + 0.04;
      const shimmerFreqs = [880 * r, 1100 * r, 1320 * r];
      shimmerFreqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.connect(og);
        og.connect(master);
        o.type = 'sine';
        const offset = shimmerStart + i * 0.045;
        o.frequency.setValueAtTime(f * 0.7, offset);
        o.frequency.exponentialRampToValueAtTime(f, offset + decay * 0.5);
        og.gain.setValueAtTime(0, offset);
        og.gain.linearRampToValueAtTime(shimmer, offset + 0.03);
        og.gain.exponentialRampToValueAtTime(0.001, offset + decay * 0.8);
        o.start(offset);
        o.stop(offset + decay + 0.05);
      });
    }

    addReverb(ctx, master, reverb);
  } catch {
    // Audio unavailable — fail silently
  }
}