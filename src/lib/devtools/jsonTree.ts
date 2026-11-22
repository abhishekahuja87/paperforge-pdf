/** Helpers for the JSON viewer: reading JSON with a helpful error, paths, counts and search. */

/** Line and column are 0 when the browser did not say where the problem is. */
export interface ParseFailure { message: string; line: number; column: number }

/** Reads JSON text. On failure says where, as a line and column, in plain words. */
export function parseJson(text: string): { value: unknown } | { error: ParseFailure } {
  try {
    return { value: JSON.parse(text) as unknown };
  } catch (reason) {
    const raw = reason instanceof Error ? reason.message : 'This is not valid JSON.';
    const match = /position (\d+)/i.exec(raw);
    let line = 0; let column = 0;
    if (match) {
      const at = Math.min(Number(match[1]), text.length);
      const before = text.slice(0, at);
      line = before.split('\n').length;
      column = at - before.lastIndexOf('\n');
    } else {
      const lc = /line (\d+) column (\d+)/i.exec(raw);
      if (lc) { line = Number(lc[1]); column = Number(lc[2]); }
    }
    return { error: { message: raw.replace(/\s*\(line \d+ column \d+\)/i, ''), line, column } };
  }
}

/** Removes line comments, block comments and trailing commas, the usual reasons "almost JSON" is refused. Text inside strings is left alone. */
export function relaxJson(text: string): string {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (inString) {
      out += ch;
      if (ch === '\\') { out += text[i + 1] ?? ''; i += 1; } else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; out += ch; continue; }
    if (ch === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i += 1; out += '\n'; continue; }
    if (ch === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1; i += 1; continue; }
    out += ch;
  }
  // Trailing commas before } or ], outside strings.
  let result = '';
  inString = false;
  for (let i = 0; i < out.length; i += 1) {
    const ch = out[i]!;
    if (inString) { result += ch; if (ch === '\\') { result += out[i + 1] ?? ''; i += 1; } else if (ch === '"') inString = false; continue; }
    if (ch === '"') { inString = true; result += ch; continue; }
    if (ch === ',') {
      let j = i + 1;
      while (j < out.length && /\s/.test(out[j]!)) j += 1;
      if (out[j] === '}' || out[j] === ']') continue;
    }
    result += ch;
  }
  return result;
}

export type JsonKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export function kindOf(value: unknown): JsonKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  return type === 'object' ? 'object' : type === 'string' ? 'string' : type === 'number' ? 'number' : 'boolean';
}

export const isContainer = (value: unknown): value is Record<string, unknown> | unknown[] => typeof value === 'object' && value !== null;

export const childrenOf = (value: unknown): [string, unknown][] => (Array.isArray(value) ? value.map((item, index) => [String(index), item] as [string, unknown]) : isContainer(value) ? Object.entries(value) : []);

const SIMPLE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Where a value sits, written as a JSONPath such as $.items[2].name. */
export function pathLabel(keys: string[], kinds: JsonKind[]): string {
  return keys.reduce((text, key, index) => (kinds[index] === 'array' ? `${text}[${key}]` : SIMPLE_KEY.test(key) ? `${text}.${key}` : `${text}["${key.replace(/"/g, '\\"')}"]`), '$');
}

export interface JsonStats { containers: number; values: number; keys: number; maxDepth: number; counts: Record<JsonKind, number> }

/** Counts what is in the JSON, walking it without recursion so very deep data cannot overflow the stack. */
export function jsonStats(root: unknown): JsonStats {
  const stats: JsonStats = { containers: 0, values: 0, keys: 0, maxDepth: 0, counts: { object: 0, array: 0, string: 0, number: 0, boolean: 0, null: 0 } };
  const stack: [unknown, number][] = [[root, 0]];
  while (stack.length) {
    const [value, depth] = stack.pop()!;
    const kind = kindOf(value);
    stats.counts[kind] += 1;
    if (depth > stats.maxDepth) stats.maxDepth = depth;
    if (isContainer(value)) {
      stats.containers += 1;
      if (kind === 'object') stats.keys += Object.keys(value).length;
      for (const [, child] of childrenOf(value)) stack.push([child, depth + 1]);
    } else stats.values += 1;
  }
  return stats;
}

export interface SearchHit { keys: string[]; kinds: JsonKind[]; in: 'key' | 'value' }

/** Finds keys and values that contain the text (ignoring capitals). Stops at `limit` so a common word cannot freeze the page. */
export function searchJson(root: unknown, query: string, limit = 500): { hits: SearchHit[]; capped: boolean } {
  const needle = query.trim().toLowerCase();
  const hits: SearchHit[] = [];
  if (!needle) return { hits, capped: false };
  const stack: { value: unknown; keys: string[]; kinds: JsonKind[]; label?: string }[] = [{ value: root, keys: [], kinds: [] }];
  while (stack.length && hits.length < limit) {
    const node = stack.shift()!;
    const kind = kindOf(node.value);
    if (node.label !== undefined && node.label.toLowerCase().includes(needle)) hits.push({ keys: node.keys, kinds: node.kinds, in: 'key' });
    else if (!isContainer(node.value) && String(node.value).toLowerCase().includes(needle)) hits.push({ keys: node.keys, kinds: node.kinds, in: 'value' });
    if (isContainer(node.value)) {
      const entries = childrenOf(node.value);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, child] = entries[index]!;
        stack.unshift({ value: child, keys: [...node.keys, key], kinds: [...node.kinds, kind], label: kind === 'object' ? key : undefined });
      }
    }
  }
  return { hits, capped: hits.length >= limit };
}

/** A path as one string, used to remember which nodes are open. */
export const pathKey = (keys: string[]): string => keys.map((key) => key.replace(/\u0001/g, '')).join('\u0001');

export function valueAtKeys(root: unknown, keys: string[]): unknown {
  let current: unknown = root;
  for (const key of keys) {
    if (!isContainer(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Sorts the keys of every object, so two files can be compared by eye. */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (isContainer(value)) return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, sortKeysDeep(child)]));
  return value;
}
