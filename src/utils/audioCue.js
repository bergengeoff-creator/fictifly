// Fictifly branded audio cue — page flutter
// Used across all generators. Config matches the sonic identity session.

const AUDIO_CUE = {
  tempo: 1,
  pitch: 1,    // semitones
  reverb: 0.5,
  volume: 0.65,
  quietVolume: 0.26,
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
  const convLen = Math.floor(ctx.sampleRate * 1.5 * amount);
  const convBuf = ctx.createBuffer(2, convLen, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = convBuf.getChannelData(c);
    for (let i = 0; i < convLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / convLen, 2);
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

/**
 * Play the Fictifly page-flutter audio cue.
 * @param {boolean} quiet - If true, plays at quietVolume (for single-field refresh).
 */
export function playAudioCue(quiet = false) {
  try {
    const ctx = getAudioCtx();
    const { tempo, pitch, reverb } = AUDIO_CUE;
    const vol = quiet ? AUDIO_CUE.quietVolume : AUDIO_CUE.volume;
    const r = 2 ** (pitch / 12);
    const t = ctx.currentTime;

    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(vol, t);

    // Noise burst — page rustle
    const bufLen = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const env = Math.sin(Math.PI * i / bufLen);
      d[i] = (Math.random() * 2 - 1) * env * 0.3;
    }
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 1200;
    ns.connect(nf);
    nf.connect(g);
    ns.start(t);
    ns.stop(t + 0.15);

    // Warm chord — book falling open
    const chord = [261.63 * r, 329.63 * r, 392 * r, 523.25 * r];
    chord.forEach((f, i) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.connect(og);
      og.connect(g);
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t + 0.08);
      og.gain.setValueAtTime(0, t + 0.08 + i * 0.03 / tempo);
      og.gain.linearRampToValueAtTime(0.18, t + 0.08 + i * 0.03 / tempo + 0.04);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.08 + i * 0.03 / tempo + 1.1 / tempo);
      o.start(t + 0.08 + i * 0.03 / tempo);
      o.stop(t + 0.08 + i * 0.03 / tempo + 1.2 / tempo);
    });

    if (reverb > 0) addReverb(ctx, g, reverb);
  } catch {
    // Audio unavailable — fail silently
  }
}