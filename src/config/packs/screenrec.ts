import screenrec from '../../locales/packs/screenrec.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Screen Recorder with Face Bubble (components/tools/screenrec, logic in src/lib/screenrec). Runs in the browser. */
export const SCREENREC_TOOLS: PackTool[] = [
  definePackTool({
    id: 'screen-recorder-with-face', kind: 'screenRec', guideKey: 'screenRecordGuide', category: 'media', icon: 'presentation', tier: 'popular',
    keywords: ['screen recorder online', 'record screen with webcam', 'screen recorder with face bubble', 'free screen recorder no watermark', 'record screen and voice', 'loom alternative free', 'tutorial video recorder', 'record screen no time limit', 'webcam bubble screen recorder', 'screen recording in browser', 'record presentation with camera', 'record computer screen online'],
  }, screenrec.toolCatalog),
];
