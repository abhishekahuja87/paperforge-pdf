/**
 * Turns speech into words with the browser's own speech recognition, and notes when each phrase was said.
 * Important: in Chrome and Edge the browser sends the voice to its maker's speech service (Google or Microsoft) to be turned into text, and Safari uses Apple's.
 * The page says so next to the button. Nothing is sent to this site.
 */

export interface Heard { text: string; start: number; end: number }

interface RecognitionEvent { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }
interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null; onend: (() => void) | null; onerror: ((event: { error: string }) => void) | null;
  start: () => void; stop: () => void; abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

const constructorOf = (): RecognitionConstructor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const speechSupported = () => constructorOf() !== null;

export type SpeechProblem = 'blocked' | 'network' | 'other';

export interface Listening { stop: () => void }

/**
 * Starts listening. `elapsed` gives the seconds since the recording began, so the phrases line up with the recorded sound.
 * The browser stops after a long pause or about a minute, so listening is started again until `stop` is called.
 */
export function startListening(options: { lang: string; elapsed: () => number; onChange: (heard: Heard[]) => void; onProblem: (problem: SpeechProblem) => void }): Listening {
  const Ctor = constructorOf(); if (!Ctor) { options.onProblem('other'); return { stop: () => undefined }; }
  const done: Heard[] = []; const live = new Map<number, Heard>(); const started = new Map<number, number>();
  let wanted = true; let rec: Recognition | null = null;
  const emit = () => options.onChange([...done, ...[...live.entries()].sort((a, b) => a[0] - b[0]).map((entry) => entry[1])].filter((item) => item.text.trim()));
  const commit = () => { [...live.entries()].sort((a, b) => a[0] - b[0]).forEach((entry) => { if (entry[1].text.trim()) done.push(entry[1]); }); live.clear(); started.clear(); };
  const begin = () => {
    rec = new Ctor(); rec.lang = options.lang; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (event) => {
      const now = options.elapsed();
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]!; const text = (result[0]?.transcript ?? '').trim(); if (!started.has(i)) started.set(i, Math.max(0, now - 0.2));
        live.set(i, { text, start: started.get(i)!, end: now });
      }
      emit();
    };
    rec.onerror = (event) => { if (event.error === 'not-allowed' || event.error === 'service-not-allowed') { wanted = false; options.onProblem('blocked'); } else if (event.error === 'network') { wanted = false; options.onProblem('network'); } };
    rec.onend = () => { commit(); emit(); if (wanted) { try { begin(); } catch { options.onProblem('other'); } } };
    rec.start();
  };
  try { begin(); } catch { options.onProblem('other'); }
  return { stop: () => { wanted = false; try { rec?.stop(); } catch { /* already stopped */ } commit(); emit(); } };
}

export const LANGUAGES: Record<string, string> = {
  'en-IN': 'English (India)', 'hi-IN': 'Hindi', 'en-US': 'English (US)', 'en-GB': 'English (UK)', 'ta-IN': 'Tamil', 'te-IN': 'Telugu', 'bn-IN': 'Bengali', 'mr-IN': 'Marathi', 'gu-IN': 'Gujarati', 'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'pa-IN': 'Punjabi',
};
