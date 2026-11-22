/** A short tone for timers and token calls. Silent if the browser refuses. */
let context: AudioContext | null = null;

export function beep(frequency = 880, milliseconds = 180): void {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.15;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + milliseconds / 1000);
  } catch { /* no sound is fine */ }
}
