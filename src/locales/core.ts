import base from './en.json';
import careers from './packs/careers.catalog.en.json';
import students from './packs/students.catalog.en.json';
import freelancers from './packs/freelancers.catalog.en.json';
import stationery from './packs/stationery.catalog.en.json';
import planners from './packs/planners.catalog.en.json';
import care from './packs/care.catalog.en.json';
import records from './packs/records.catalog.en.json';
import secure from './packs/secure.catalog.en.json';
import teach from './packs/teach.catalog.en.json';
import clean from './packs/clean.catalog.en.json';
import sheets from './packs/sheets.catalog.en.json';
import makers from './packs/makers.catalog.en.json';
import docs from './packs/docs.catalog.en.json';
import toolkit from './packs/toolkit.catalog.en.json';
import safeshare from './packs/safeshare.catalog.en.json';
import unlimited from './packs/unlimited.catalog.en.json';
import devtools from './packs/devtools.catalog.en.json';
import more from './packs/more.catalog.en.json';
import globe from './packs/globe.catalog.en.json';
import writing from './packs/writing.catalog.en.json';
import sequence from './packs/sequence.catalog.en.json';
import slides from './packs/slides.catalog.en.json';
import regionmap from './packs/regionmap.catalog.en.json';
import chartvideo from './packs/chartvideo.catalog.en.json';
import photostory from './packs/photostory.catalog.en.json';
import tapcaptions from './packs/tapcaptions.catalog.en.json';
import audioclip from './packs/audioclip.catalog.en.json';
import qr from './packs/qr.catalog.en.json';
import vcard from './packs/vcard.catalog.en.json';
import flashcards from './packs/flashcards.catalog.en.json';
import privacy from './packs/privacy.catalog.en.json';
import shops from './packs/shops.catalog.en.json';
import household from './packs/household.catalog.en.json';
import sports from './packs/sports.catalog.en.json';
import fitness from './packs/fitness.catalog.en.json';
import screens from './packs/screens.catalog.en.json';
import classroom from './packs/classroom.catalog.en.json';
import explainers from './packs/explainers.catalog.en.json';
import bizcards from './packs/bizcards.catalog.en.json';
import hiring from './packs/hiring.catalog.en.json';
import kids from './packs/kids.catalog.en.json';

/**
 * The English text every page needs: the main file (en.json) plus each pack's tool catalog (title and short
 * description). The long per-tool text (guide steps, FAQs, articles) is in ./content and loads on demand.
 * To add a pack: create ./packs/<name>.catalog.en.json and add it to CATALOGS here.
 */
const CATALOGS = [careers, students, freelancers, stationery, planners, care, records, secure, qr, vcard, flashcards, privacy, shops, household, sports, fitness, screens, classroom, explainers, bizcards, hiring, kids, teach, clean, sheets, makers, docs, toolkit, safeshare, unlimited, devtools, more, globe, writing, sequence, slides, regionmap, chartvideo, photostory, tapcaptions, audioclip];

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (value: infer I) => void ? I : never;
type Catalog = (typeof base)['toolCatalog'] & UnionToIntersection<(typeof CATALOGS)[number]['toolCatalog']>;

export const enCore = {
  ...base,
  toolCatalog: Object.assign({}, base.toolCatalog, ...CATALOGS.map((pack) => pack.toolCatalog)) as Catalog,
};

export type EnglishCore = typeof enCore;
