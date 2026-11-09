import base from './en.json';
import careers from './packs/careers.en.json';
import students from './packs/students.en.json';
import freelancers from './packs/freelancers.en.json';
import coreDepth from './depth/core.en.json';

/**
 * English text for the whole site: the main file (en.json) plus one file per tool pack in ./packs.
 * A pack holds only the four per-tool sections below, keyed by tool id or guide key, so adding a pack never
 * touches en.json. To add a pack: create ./packs/<name>.en.json, import it here and add it to PACKS.
 */
const PACKS = [careers, students, freelancers];
type Pack = (typeof PACKS)[number];

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
type Section = 'toolCatalog' | 'guideSteps' | 'pageGuides' | 'toolArticles';
type Merged<K extends Section> = (typeof base)[K] & UnionToIntersection<Pack[K]>;

export type English = Omit<typeof base, Section> & { [K in Section]: Merged<K> };

const merge = <K extends Section>(key: K): Merged<K> => Object.assign({}, base[key], ...PACKS.map((pack) => pack[key])) as Merged<K>;

/**
 * Extra content for tools whose page was short: more article sections and FAQs, kept in ./depth so the
 * original text files stay untouched. New sections and questions go before the closing privacy entry.
 */
interface Depth {
  toolArticles: Record<string, { sections: { heading: string; paragraphs: string[] }[] }>;
  pageGuides: Record<string, { faq: string[][] }>;
}
const DEPTH: Depth[] = [coreDepth];

/** Keeps the closing privacy section or question last, and puts the new material before it. */
const insertBeforeLast = <T,>(existing: T[], extra: T[]): T[] => [...existing.slice(0, -1), ...extra, ...existing.slice(-1)];

const withDepth = (articles: Merged<'toolArticles'>, guides: Merged<'pageGuides'>) => {
  const nextArticles: Record<string, { sections: unknown[] }> = { ...articles };
  const nextGuides: Record<string, { faq: unknown[] }> = { ...guides };
  for (const depth of DEPTH) {
    for (const [id, extra] of Object.entries(depth.toolArticles)) {
      const current = nextArticles[id];
      if (current) nextArticles[id] = { ...current, sections: insertBeforeLast(current.sections, extra.sections) };
    }
    for (const [key, extra] of Object.entries(depth.pageGuides)) {
      const current = nextGuides[key];
      if (current) nextGuides[key] = { ...current, faq: insertBeforeLast(current.faq, extra.faq) };
    }
  }
  return { articles: nextArticles as Merged<'toolArticles'>, guides: nextGuides as Merged<'pageGuides'> };
};

const deep = withDepth(merge('toolArticles'), merge('pageGuides'));

export const en: English = {
  ...base,
  toolCatalog: merge('toolCatalog'),
  guideSteps: merge('guideSteps'),
  pageGuides: deep.guides,
  toolArticles: deep.articles,
};
