/** Secret Santa draw: everyone gives to one person and receives from one person, nobody draws themselves, and pairs who should not draw each other are respected. */

const random = (n: number): number => {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n;
  do { crypto.getRandomValues(buf); } while (buf[0]! >= limit);
  return buf[0]! % n;
};

export const MIN_PEOPLE = 3;
export const MAX_PEOPLE = 60;

export const parseNames = (text: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const name = raw.trim().slice(0, 30);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) { seen.add(key); out.push(name); }
  }
  return out.slice(0, MAX_PEOPLE);
};

/** Lines like "Asha - Rohan" mean those two must not draw each other (for example a couple). */
export const parsePairs = (text: string, names: string[]): [string, string][] => {
  const byKey = new Map(names.map((n) => [n.toLowerCase(), n]));
  const pairs: [string, string][] = [];
  for (const raw of text.split(/\r?\n/)) {
    const [a, b] = raw.split(/\s*[-–,]\s*/).map((x) => x.trim().toLowerCase());
    const x = a ? byKey.get(a) : undefined; const y = b ? byKey.get(b) : undefined;
    if (x && y && x !== y) pairs.push([x, y]);
  }
  return pairs;
};

/** Returns who each person gives to, or null when the rules leave no way to draw. */
export function drawSanta(names: string[], pairs: [string, string][]): Record<string, string> | null {
  const banned = new Set(pairs.flatMap(([a, b]) => [`${a}\u0000${b}`, `${b}\u0000${a}`]));
  for (let attempt = 0; attempt < 4000; attempt += 1) {
    const receivers = [...names];
    for (let i = receivers.length - 1; i > 0; i -= 1) { const j = random(i + 1); [receivers[i], receivers[j]] = [receivers[j]!, receivers[i]!]; }
    if (names.every((giver, i) => giver !== receivers[i] && !banned.has(`${giver}\u0000${receivers[i]!}`))) {
      return Object.fromEntries(names.map((giver, i) => [giver, receivers[i]!]));
    }
  }
  return null;
}
