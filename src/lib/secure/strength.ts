/** A rough, honest measure of how hard a password is to guess, and a password maker. Everything runs in the browser. */

export interface Strength {
  /** 0 to 4. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Rough size of the search a guesser would need, in bits. */
  bits: number;
  /** Plain advice, empty when the password is fine. */
  advice: string;
}

const COMMON = ['password', 'passw0rd', '12345678', '123456789', '1234567890', 'qwertyuiop', 'qwerty123', 'iloveyou', 'welcome1', 'admin123', 'letmein', 'abcd1234', '11111111', '00000000', 'india123', 'password1', 'abc12345'];

export function measure(password: string): Strength {
  const length = [...password].length;
  if (!length) return { score: 0, label: 'Empty', bits: 0, advice: 'Choose a password.' };
  const lower = password.toLowerCase();
  if (COMMON.some((word) => lower.includes(word) && word.length >= 6 && length <= word.length + 4)) {
    return { score: 0, label: 'Very weak', bits: 10, advice: 'This is one of the first passwords anyone tries. Choose something longer and less common.' };
  }
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  const unique = new Set(password).size;
  // Repeated characters and simple runs such as 1234 or abcd add much less than random ones.
  let bits = length * Math.log2(Math.max(2, pool)) * Math.min(1, 0.45 + unique / (length * 1.4));
  if (/(.)\1{2,}/.test(password)) bits -= 8;
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|asdf|zxcv)/i.test(password)) bits -= 10;
  if (/^[a-zA-Z]+[0-9]{1,4}[!@#$%^&*]?$/.test(password)) bits -= 8;
  // Words joined by dashes or spaces: a guesser tries dictionary words, so count about 11 bits per word, not per letter.
  const wordy = password.split(/[-_ .]+/).filter(Boolean);
  if (wordy.length >= 3 && wordy.every((part) => /^[a-zA-Z]+$|^[0-9]{1,4}$/.test(part))) {
    const guess = wordy.reduce((sum, part) => sum + (/^[0-9]+$/.test(part) ? part.length * 3.4 : 11), 0);
    bits = Math.min(bits, guess);
  }
  bits = Math.max(4, Math.min(120, Math.round(bits)));
  if (bits < 28) return { score: 0, label: 'Very weak', bits, advice: 'Too easy to guess. Use a longer password or let the page make one.' };
  if (bits < 40) return { score: 1, label: 'Weak', bits, advice: 'Longer is better. Try several unrelated words or let the page make one.' };
  if (bits < 55) return { score: 2, label: 'Fair', bits, advice: 'Fine for low-risk files. For bank or ID details, use a longer one.' };
  if (bits < 75) return { score: 3, label: 'Strong', bits, advice: '' };
  return { score: 4, label: 'Very strong', bits, advice: '' };
}

/** Passwords shorter than this, or in the weakest class, are not accepted. */
export const MIN_LENGTH = 8;
export function isAcceptable(password: string): boolean {
  return [...password].length >= MIN_LENGTH && measure(password).score >= 1;
}

const WORDS = ('amber apple arrow atlas autumn badge baker banner basil beach berry bishop blaze bloom bridge brook cabin cactus camel candle canyon carpet castle cedar chalk cherry cliff clover cobalt comet copper coral cotton crane crown dagger daisy delta desert dolphin dragon dune eagle ember falcon feather fern ferry fiddle fjord flame forest fox frost garden garnet ginger glacier granite harbor hazel heron honey island ivory jacket jasmine jungle kettle kite lagoon lantern laurel lemon lilac lotus lunar maple marble meadow mango mint mirror mist monsoon moss nectar nickel noble oasis ocean olive onyx orchid otter oyster paddle panda pebble pepper pillow pine planet plum pocket poppy prairie quartz quill rabbit raven reef ribbon river robin rocket saddle saffron sage sailor sandal scarlet shadow silver slate solar spark spruce squid stable star storm summit sunny swan tango tea thistle thunder tiger timber topaz tulip turtle valley velvet violet walnut wave willow winter wolf yarrow zephyr zinc').split(' ');

function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0]! >= limit);
  return buffer[0]! % max;
}

/** Six random words and a number, such as `maple-quartz-river-tango-ember-ivory-47`. Easy to say aloud or type on a phone. */
export function makePassphrase(): string {
  const words = Array.from({ length: 6 }, () => WORDS[randomInt(WORDS.length)]!);
  return `${words.join('-')}-${10 + randomInt(90)}`;
}

/** Sixteen random characters without look-alikes (no 0/O, 1/l/I). */
export function makeRandomPassword(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 16 }, () => alphabet[randomInt(alphabet.length)]).join('');
}
