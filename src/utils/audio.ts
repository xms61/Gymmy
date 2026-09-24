// Rest-timer chime and vibration. Browsers only let a page start audio after a user gesture,
// and iOS Safari keeps an AudioContext muted if it was created outside one. So one shared
// context is created and resumed on a tap (unlockAudio), and the chime reuses it later when
// the timer runs out.
let sharedContext: AudioContext | null = null;

// Call from a tap or click handler, before any sound is needed.
export function unlockAudio(): void {
  const context = getAudioContext();
  if (context?.state === 'suspended') void context.resume().catch(() => {});
}

export function playTimerChime(): void {
  vibrate([200, 100, 200]);
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume().catch(() => {});

  // A friendly two-tone chime: A5, then E6.
  const now = context.currentTime;
  playTone(context, 880, now, 0.2);
  playTone(context, 1320, now + 0.22, 0.4);
}

function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext;
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    sharedContext = new AudioContextClass();
  } catch (err) {
    console.warn('[Audio] The timer chime is unavailable:', err);
  }
  return sharedContext;
}

function playTone(context: AudioContext, frequency: number, startTime: number, duration: number): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Android only; iOS browsers do not support vibration.
function vibrate(pattern: number[]): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}
