import bgremove from '../../locales/packs/bgremove.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Background Remover (components/tools/bgremove, logic in src/lib/bgremove). Runs in the browser. */
export const BGREMOVE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'background-remover', kind: 'bgRemove', guideKey: 'bgRemoveGuide', category: 'media', icon: 'image', tier: 'popular',
    keywords: ['remove background from image', 'make background transparent', 'transparent png maker', 'signature background remover', 'remove white background online', 'logo background remover', 'product photo background remover', 'remove paper background from signature', 'background remover no watermark', 'green screen remover online', 'cut out image online free', 'plain background remover'],
  }, bgremove.toolCatalog),
];
