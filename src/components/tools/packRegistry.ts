import type { ComponentType } from 'react';
import { CAREERS_COMPONENTS } from './careers/registry';
import { STUDENTS_COMPONENTS } from './students/registry';
import { FREELANCERS_COMPONENTS } from './freelancers/registry';
import { PAPER_COMPONENTS } from './paper/registry';
import { PLANNER_COMPONENTS } from './planner/registry';
import { CARE_COMPONENTS } from './care/registry';
import { RECORDS_COMPONENTS } from './records/registry';
import { SECURE_COMPONENTS } from './secure/registry';
import { QR_COMPONENTS } from './qr/registry';
import { VCARD_COMPONENTS } from './vcard/registry';
import { FLASHCARD_COMPONENTS } from './flashcards/registry';
import { PRIVACY_COMPONENTS } from './privacy/registry';
import { SHOPS_COMPONENTS } from './shops/registry';
import { HOUSEHOLD_COMPONENTS } from './household/registry';
import { SPORTS_COMPONENTS } from './sports/registry';
import { FITNESS_COMPONENTS } from './fitness/registry';
import { SCREENS_COMPONENTS } from './screens/registry';
import { CLASSROOM_COMPONENTS } from './classroom/registry';
import { EXPLAINER_COMPONENTS } from './explainers/registry';
import { BIZCARD_COMPONENTS } from './bizcards/registry';
import { HIRING_COMPONENTS } from './hiring/registry';
import { KIDS_COMPONENTS } from './kids/registry';
import { DOCS_COMPONENTS } from './docs/registry';
import { TOOLKIT_COMPONENTS } from './toolkit/registry';
import { SAFESHARE_COMPONENTS } from './safeshare/registry';
import { UNLIMITED_COMPONENTS } from './unlimited/registry';
import { DEVTOOLS_COMPONENTS } from './devtools/registry';
import { MORE_COMPONENTS } from './more/registry';
import { GLOBE_COMPONENTS } from './globe/registry';
import { WRITING_COMPONENTS } from './writing/registry';
import { SEQUENCE_COMPONENTS } from './sequence/registry';
import { SLIDES_COMPONENTS } from './slides/registry';
import { REGIONMAP_COMPONENTS } from './regionmap/registry';
import { CHARTVIDEO_COMPONENTS } from './chartvideo/registry';
import { PHOTOSTORY_COMPONENTS } from './photostory/registry';
import { CAPTIONS_COMPONENTS } from './captions/registry';
import { AUDIOCLIP_COMPONENTS } from './audioclip/registry';
import { APPDEMO_COMPONENTS } from './appdemo/registry';
import { VIDEOCOMPRESS_COMPONENTS } from './videoedit/registry';
import { VOICECLEAN_COMPONENTS } from './voiceclean/registry';
import { BGREMOVE_COMPONENTS } from './bgremove/registry';
import { SCREENREC_COMPONENTS } from './screenrec/registry';
import { WHATSAPP_COMPONENTS } from './whatsapp/registry';
import { TELEPROMPTER_COMPONENTS } from './teleprompter/registry';
import { WHITEBOARD_COMPONENTS } from './whiteboard/registry';
import { BEFOREAFTER_COMPONENTS } from './beforeafter/registry';
import { CERTIFICATES_COMPONENTS } from './certificates/registry';
import { REPORTCARDS_COMPONENTS } from './reportcards/registry';
import { PDFTABLE_COMPONENTS } from './pdftable/registry';
import { OMR_COMPONENTS } from './omr/registry';
import { REVIEWSIGN_COMPONENTS } from './reviewsign/registry';
import { BULKLETTERS_COMPONENTS } from './letters/registry';
import { WORKBOOKS_COMPONENTS } from './workbooks/registry';

/**
 * Screen for each pack tool, by the `kind` set in its src/config/packs file. Each pack keeps its own registry
 * next to its components, with one lazy() per screen so a visitor only downloads the tool they open.
 */
export const PACK_COMPONENTS: Record<string, ComponentType> = {
  ...CAREERS_COMPONENTS,
  ...STUDENTS_COMPONENTS,
  ...FREELANCERS_COMPONENTS,
  ...PAPER_COMPONENTS,
  ...PLANNER_COMPONENTS,
  ...CARE_COMPONENTS,
  ...RECORDS_COMPONENTS,
  ...SECURE_COMPONENTS,
  ...QR_COMPONENTS,
  ...VCARD_COMPONENTS,
  ...FLASHCARD_COMPONENTS,
  ...PRIVACY_COMPONENTS,
  ...SHOPS_COMPONENTS,
  ...HOUSEHOLD_COMPONENTS,
  ...SPORTS_COMPONENTS,
  ...FITNESS_COMPONENTS,
  ...SCREENS_COMPONENTS,
  ...CLASSROOM_COMPONENTS,
  ...EXPLAINER_COMPONENTS,
  ...BIZCARD_COMPONENTS,
  ...HIRING_COMPONENTS,
  ...KIDS_COMPONENTS,
  ...DOCS_COMPONENTS,
  ...TOOLKIT_COMPONENTS,
  ...SAFESHARE_COMPONENTS,
  ...UNLIMITED_COMPONENTS,
  ...DEVTOOLS_COMPONENTS,
  ...MORE_COMPONENTS,
  ...GLOBE_COMPONENTS,
  ...WRITING_COMPONENTS,
  ...SEQUENCE_COMPONENTS,
  ...SLIDES_COMPONENTS,
  ...REGIONMAP_COMPONENTS,
  ...CHARTVIDEO_COMPONENTS,
  ...PHOTOSTORY_COMPONENTS,
  ...CAPTIONS_COMPONENTS,
  ...AUDIOCLIP_COMPONENTS,
  ...APPDEMO_COMPONENTS,
  ...VIDEOCOMPRESS_COMPONENTS,
  ...VOICECLEAN_COMPONENTS,
  ...BGREMOVE_COMPONENTS,
  ...SCREENREC_COMPONENTS,
  ...WHATSAPP_COMPONENTS,
  ...TELEPROMPTER_COMPONENTS,
  ...WHITEBOARD_COMPONENTS,
  ...BEFOREAFTER_COMPONENTS,
  ...CERTIFICATES_COMPONENTS,
  ...REPORTCARDS_COMPONENTS,
  ...PDFTABLE_COMPONENTS,
  ...OMR_COMPONENTS,
  ...REVIEWSIGN_COMPONENTS,
  ...BULKLETTERS_COMPONENTS,
  ...WORKBOOKS_COMPONENTS,
};
