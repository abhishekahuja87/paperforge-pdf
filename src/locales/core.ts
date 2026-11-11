import base from './en.json';
import careers from './packs/careers.catalog.en.json';
import students from './packs/students.catalog.en.json';
import freelancers from './packs/freelancers.catalog.en.json';
import stationery from './packs/stationery.catalog.en.json';
import planners from './packs/planners.catalog.en.json';
import qr from './packs/qr.catalog.en.json';
import vcard from './packs/vcard.catalog.en.json';
import flashcards from './packs/flashcards.catalog.en.json';
import privacy from './packs/privacy.catalog.en.json';
import shops from './packs/shops.catalog.en.json';
import household from './packs/household.catalog.en.json';
import sports from './packs/sports.catalog.en.json';
import hiring from './packs/hiring.catalog.en.json';

/**
 * The English text every page needs: the main file (en.json) plus each pack's tool catalog (title and short
 * description). The long per-tool text (guide steps, FAQs, articles) is in ./content and loads on demand.
 * To add a pack: create ./packs/<name>.catalog.en.json and add it to CATALOGS here.
 */
const CATALOGS = [careers, students, freelancers, stationery, planners, qr, vcard, flashcards, privacy, shops, household, sports, hiring];

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
type Catalog = (typeof base)['toolCatalog'] & UnionToIntersection<(typeof CATALOGS)[number]['toolCatalog']>;

export const enCore = {
  ...base,
  toolCatalog: Object.assign({}, base.toolCatalog, ...CATALOGS.map((pack) => pack.toolCatalog)) as Catalog,
};

export type EnglishCore = typeof enCore;
