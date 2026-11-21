/** Compares two pieces of text line by line or word by word and marks what was removed and what was added. */
export type DiffKind = 'same' | 'add' | 'del';
export interface DiffPart { kind: DiffKind; text: string }
export type DiffUnit = 'lines' | 'words';

/** Largest comparison table we build (cells). Bigger inputs would freeze a phone. */
const MAX_CELLS = 6_000_000;

export function tokenize(text: string, unit: DiffUnit): string[] {
  const clean = text.replace(/\r\n?/g, '\n');
  if (unit === 'lines') return clean.length === 0 ? [] : clean.split('\n');
  return clean.split(/(\s+)/).filter((piece) => piece.length > 0);
}

/** Returns one part per line or word, in order (whitespace between words is its own part), or null when the two texts are too large and different to compare on a phone. */
export function diffTokens(a: string[], b: string[]): DiffPart[] | null {
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1;
  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);
  const n = midA.length; const m = midB.length;
  if ((n + 1) * (m + 1) > MAX_CELLS) return null;
  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i * width + j] = midA[i] === midB[j] ? table[(i + 1) * width + j + 1]! + 1 : Math.max(table[(i + 1) * width + j]!, table[i * width + j + 1]!);
    }
  }
  const parts: DiffPart[] = [];
  const push = (kind: DiffKind, text: string) => { parts.push({ kind, text }); };
  for (let i = 0; i < head; i += 1) push('same', a[i]!);
  let i = 0; let j = 0;
  while (i < n && j < m) {
    if (midA[i] === midB[j]) { push('same', midA[i]!); i += 1; j += 1; }
    else if (table[(i + 1) * width + j]! >= table[i * width + j + 1]!) { push('del', midA[i]!); i += 1; }
    else { push('add', midB[j]!); j += 1; }
  }
  while (i < n) { push('del', midA[i]!); i += 1; }
  while (j < m) { push('add', midB[j]!); j += 1; }
  for (let k = a.length - tail; k < a.length; k += 1) push('same', a[k]!);
  return parts;
}
