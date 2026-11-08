// Web Audio API medical telemetry alert synthesizer

let audioCtx: AudioContext | null = null;
let isAudioActive = false;
let currentAlarmInterval: number | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playHeartbeatBeep(frequency = 750, duration = 0.04) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio autoplay restrictions before first user gesture
  }
}

export function playEmergencyAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // High priority medical monitor alert pattern (two-tone urgent chirp)
    const playTone = (freq: number, start: number, len: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + len);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + len);
    };

    playTone(987.77, now, 0.12);        // B5
    playTone(783.99, now + 0.14, 0.12); // G5
    playTone(987.77, now + 0.28, 0.12); // B5
  } catch {
    // ignore audio block
  }
}

export function startAudibleAlarmLoop() {
  if (isAudioActive) return;
  isAudioActive = true;
  playEmergencyAlarm();
  currentAlarmInterval = window.setInterval(() => {
    if (isAudioActive) {
      playEmergencyAlarm();
    }
  }, 2200);
}

export function stopAudibleAlarmLoop() {
  isAudioActive = false;
  if (currentAlarmInterval) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
}
