/**
 * Web Audio API and Haptic Vibration utilities for gym rest timer
 */
export function playTimerChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Play a friendly two-tone completion chime (880Hz then 1320Hz)
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.2); // A5
    playTone(1320, now + 0.22, 0.4); // E6

    // Trigger haptic vibration on mobile
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (err) {
    console.warn('Audio chime could not be played:', err);
  }
}
