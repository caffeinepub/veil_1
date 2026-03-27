// ─── Ambient Audio Engine — Web Audio API synthesis ──────────────────────────
// All sounds synthesized — no external files required.

let audioCtx: AudioContext | null = null;
let ambientSources: AudioScheduledSourceNode[] = [];
let ambientGain: GainNode | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

export function playPageTurnSound(volume: number): void {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const rate = ctx.sampleRate;
    const dur = 0.14;
    const bufSize = Math.floor(rate * dur);
    const buf = ctx.createBuffer(1, bufSize, rate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const env = Math.sin(Math.PI * t) * Math.exp(-t * 10);
      data[i] = (Math.random() * 2 - 1) * env * 0.25;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = 1800;
    filt.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = Math.min(volume * 1.5, 0.45);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch {
    /* silent */
  }
}

type Season = "SPRING" | "SUMMER" | "FALL" | "WINTER";

export function startAmbient(season: Season, volume: number): void {
  stopAmbient();
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    ambientGain = ctx.createGain();
    ambientGain.gain.value = Math.min(volume, 0.3);
    ambientGain.connect(ctx.destination);
    ambientSources = [];

    if (season === "SPRING") {
      // High-frequency shimmer — birdsong-like
      const freqs = [1200, 1600, 2000, 2500];
      for (let i = 0; i < freqs.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freqs[i];
        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.25 + i * 0.08;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 25;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        const g = ctx.createGain();
        g.gain.value = 0.025;
        osc.connect(g);
        g.connect(ambientGain);
        osc.start();
        lfo.start();
        ambientSources.push(osc, lfo);
      }
    } else if (season === "SUMMER") {
      // Warm low drone
      const pairs = [
        { freq: 60, amp: 0.07 },
        { freq: 120, amp: 0.04 },
        { freq: 180, amp: 0.02 },
      ];
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 350;
      filter.connect(ambientGain);
      for (const p of pairs) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = p.freq;
        const g = ctx.createGain();
        g.gain.value = p.amp;
        osc.connect(g);
        g.connect(filter);
        osc.start();
        ambientSources.push(osc);
      }
    } else if (season === "FALL") {
      // Subtle crackle — fireplace
      const sampleRate = ctx.sampleRate;
      const bufLen = sampleRate * 3;
      const crackleBuf = ctx.createBuffer(1, bufLen, sampleRate);
      const d = crackleBuf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const r = Math.random();
        d[i] =
          r > 0.9985
            ? (Math.random() * 2 - 1) * 0.9
            : (Math.random() * 2 - 1) * 0.015;
      }
      const src = ctx.createBufferSource();
      src.buffer = crackleBuf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.4;
      const g = ctx.createGain();
      g.gain.value = 0.18;
      src.connect(filter);
      filter.connect(g);
      g.connect(ambientGain);
      src.start();
      ambientSources.push(src);
    } else {
      // WINTER — near silence, very faint low hum
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 38;
      const g = ctx.createGain();
      g.gain.value = 0.025;
      osc.connect(g);
      g.connect(ambientGain);
      osc.start();
      ambientSources.push(osc);
    }
  } catch {
    /* silent */
  }
}

export function stopAmbient(): void {
  try {
    for (const src of ambientSources) {
      try {
        src.stop();
      } catch {
        /* */
      }
    }
    ambientSources = [];
    if (ambientGain) {
      ambientGain.disconnect();
      ambientGain = null;
    }
  } catch {
    /* */
  }
}

export function setAmbientVolume(vol: number): void {
  if (ambientGain) {
    ambientGain.gain.value = Math.min(vol, 0.3);
  }
}
