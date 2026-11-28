import { CONTENT_INDEX, SOURCE_KINDS, SOURCE_LOADERS, type Section } from './contentIndex.generated';

/**
 * Finds one tool's guide steps, questions or article without loading the text of every tool.
 * The generated index (scripts/build-content-index.mjs) says which text files hold a key; only those are downloaded.
 * This file has no React and no i18next, so the static page generator can run it too (see verifyContentSplit).
 *
 * The result is the same as the entry in the combined object made by content.ts: the last base or pack file that has
 * the key wins, and then each depth file adds its extra sections or questions just before the closing privacy entry.
 */
export type { Section };
type SourceData = Partial<Record<Section, Record<string, unknown>>>;
interface LoadedSource { kind: 'text' | 'depth'; data: SourceData }

const has = (object: object | undefined, key: string): boolean => object !== undefined && Object.hasOwn(object, key);

/** Keeps the closing privacy section or question last, and puts the new material before it. */
const insertBeforeLast = <T,>(existing: T[], extra: T[]): T[] => [...existing.slice(0, -1), ...extra, ...existing.slice(-1)];

/** Combines the files that hold `key`, given in the order of the index. Returns undefined when no text file has it. */
export function resolveKey(section: Section, key: string, sources: LoadedSource[]): unknown {
  let value: unknown;
  let found = false;
  for (const source of sources) {
    if (source.kind === 'text' && has(source.data[section], key)) { value = source.data[section]?.[key]; found = true; }
  }
  if (!found) return undefined;
  for (const source of sources) {
    if (source.kind !== 'depth' || !has(source.data[section], key)) continue;
    const extra = source.data[section]?.[key] as { sections?: unknown[]; faq?: unknown[] };
    const current = value as { sections?: unknown[]; faq?: unknown[] };
    if (section === 'toolArticles') value = { ...current, sections: insertBeforeLast(current.sections ?? [], extra.sections ?? []) };
    if (section === 'pageGuides') value = { ...current, faq: insertBeforeLast(current.faq ?? [], extra.faq ?? []) };
  }
  return value;
}

const loading = new Map<number, Promise<SourceData>>();

function loadSource(position: number): Promise<SourceData> {
  let pending = loading.get(position);
  if (!pending) {
    pending = SOURCE_LOADERS[position]().then((module) => module.default as SourceData);
    loading.set(position, pending);
    // A failed download must not be remembered, so the next try asks the network again.
    pending.catch(() => { if (loading.get(position) === pending) loading.delete(position); });
  }
  return pending;
}

/** The text for one key of one section, or undefined when the site has none for it. */
export async function resolveContent(section: Section, key: string): Promise<unknown> {
  if (!has(CONTENT_INDEX[section], key)) return undefined;
  const positions = CONTENT_INDEX[section][key];
  const data = await Promise.all(positions.map(loadSource));
  return resolveKey(section, key, positions.map((position, order) => ({ kind: SOURCE_KINDS[position], data: data[order] })));
}

/**
 * Used by scripts/check-content-split.mjs: compares what the loader finds for every key with the combined object
 * (`full`, made by content.ts). Returns one line for each difference; an empty list means the two agree exactly.
 */
export async function verifyContentSplit(full: Record<Section, Record<string, unknown>>): Promise<string[]> {
  const problems: string[] = [];
  for (const section of Object.keys(CONTENT_INDEX) as Section[]) {
    const keys = new Set([...Object.keys(full[section]), ...Object.keys(CONTENT_INDEX[section])]);
    for (const key of keys) {
      const expected = has(full[section], key) ? JSON.stringify(full[section][key]) : undefined;
      const found = JSON.stringify(await resolveContent(section, key));
      if (expected !== found) problems.push(`${section}.${key}: ${expected === undefined ? 'only the index has it' : found === undefined ? 'missing from the index' : 'text differs'}`);
    }
  }
  return problems;
}
