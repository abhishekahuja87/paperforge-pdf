import baseContent from './content/base.en.json';
import careers from './packs/careers.en.json';
import students from './packs/students.en.json';
import freelancers from './packs/freelancers.en.json';
import stationery from './packs/stationery.en.json';
import planners from './packs/planners.en.json';
import qr from './packs/qr.en.json';
import vcard from './packs/vcard.en.json';
import flashcards from './packs/flashcards.en.json';
import privacy from './packs/privacy.en.json';
import shops from './packs/shops.en.json';
import household from './packs/household.en.json';
import sports from './packs/sports.en.json';
import fitness from './packs/fitness.en.json';
import explainers from './packs/explainers.en.json';
import bizcards from './packs/bizcards.en.json';
import hiring from './packs/hiring.en.json';
import coreDepth from './depth/core.en.json';

/**
 * The long English text for each tool page: guide steps, FAQs and articles. It is a separate chunk (see
 * contentLoader.ts) because the home page does not need it. Each pack has one file in ./packs holding these three
 * sections keyed by tool id or guide key, so adding a pack never touches the base file.
 * To add a pack: create ./packs/<name>.en.json (and its catalog file, see core.ts), import it here and add it to PACKS.
 */
const PACKS = [careers, students, freelancers, stationery, planners, qr, vcard, flashcards, privacy, shops, household, sports, fitness, explainers, bizcards, hiring];
type Pack = (typeof PACKS)[number];

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
type Section = 'guideSteps' | 'pageGuides' | 'toolArticles';
type Merged<K extends Section> = (typeof baseContent)[K] & UnionToIntersection<Pack[K]>;

const merge = <K extends Section>(key: K): Merged<K> => Object.assign({}, baseContent[key], ...PACKS.map((pack) => pack[key])) as Merged<K>;

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

export const content = {
  guideSteps: merge('guideSteps'),
  pageGuides: deep.guides,
  toolArticles: deep.articles,
};

export type Content = typeof content;
