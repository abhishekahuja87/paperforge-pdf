/** Fair random helpers for the name picker and team maker. They use the browser's secure random numbers. */

/** A whole number from 0 up to but not including `n`, without the bias of a plain modulo. */
export function randomInt(n: number): number {
  if (n <= 1) return 0;
  const limit = Math.floor(0x100000000 / n) * n;
  const buffer = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(buffer); } while (buffer[0]! >= limit);
  return buffer[0]! % n;
}

/** A shuffled copy (Fisher-Yates). */
export function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Names from a box: one per line or separated by commas, blanks dropped. Repeats are kept, because two people can share a name. */
export function parseList(text: string): string[] {
  return text.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 500);
}

/** Splits people into `teams` groups whose sizes differ by at most one. */
export function splitTeams(people: readonly string[], teams: number): string[][] {
  const count = Math.max(1, Math.min(Math.floor(teams), people.length || 1));
  const groups: string[][] = Array.from({ length: count }, () => []);
  shuffled(people).forEach((person, index) => groups[index % count]!.push(person));
  return groups;
}
