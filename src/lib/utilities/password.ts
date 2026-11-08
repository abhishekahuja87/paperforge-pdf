export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidLookAlikes: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
} as const;
const LOOK_ALIKES = /[0O1lI|]/g;

/** Random integer in [0, max) without modulo bias, using the browser's secure random source. */
function randomBelow(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function activeSets(options: PasswordOptions): string[] {
  return (['lower', 'upper', 'digits', 'symbols'] as const)
    .filter((key) => options[key])
    .map((key) => (options.avoidLookAlikes ? SETS[key].replace(LOOK_ALIKES, '') : SETS[key]));
}

export function generatePassword(options: PasswordOptions): string {
  const sets = activeSets(options);
  const length = Math.max(sets.length, Math.min(128, Math.floor(options.length)));
  if (sets.length === 0) return '';
  const all = sets.join('');
  // One character from every chosen set first, so each ticked box is really used.
  const chars = sets.map((set) => set[randomBelow(set.length)]);
  while (chars.length < length) chars.push(all[randomBelow(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBelow(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Rough strength in bits, assuming every character is picked at random from the pool. */
export function entropyBits(options: PasswordOptions): number {
  const pool = activeSets(options).join('').length;
  return pool > 1 ? Math.floor(options.length * Math.log2(pool)) : 0;
}

/** Numeric PIN made only of digits, drawn with the same unbiased secure source. */
export function generatePin(length: number): string {
  return Array.from({ length: Math.max(4, Math.min(12, Math.floor(length))) }, () => String(randomBelow(10))).join('');
}

/** Plain-language time for an attacker making 10 billion guesses a second to try half the possibilities. */
export function crackTime(bits: number): string {
  if (bits <= 0) return 'instantly';
  const seconds = 2 ** (bits - 1) / 1e10;
  const units: [number, string][] = [[31_557_600 * 1e9, 'billion years'], [31_557_600 * 1e6, 'million years'], [31_557_600 * 1e3, 'thousand years'], [31_557_600, 'years'], [86_400, 'days'], [3600, 'hours'], [60, 'minutes']];
  if (seconds < 1) return 'less than a second';
  for (const [size, name] of units) if (seconds >= size) return `about ${Math.round(seconds / size).toLocaleString('en-IN')} ${name}`;
  return `about ${Math.round(seconds)} seconds`;
}
