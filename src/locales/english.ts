import base from './en.json';
import careers from './packs/careers.en.json';
import students from './packs/students.en.json';
import freelancers from './packs/freelancers.en.json';

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

export const en: English = {
  ...base,
  toolCatalog: merge('toolCatalog'),
  guideSteps: merge('guideSteps'),
  pageGuides: merge('pageGuides'),
  toolArticles: merge('toolArticles'),
};
