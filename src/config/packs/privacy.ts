import privacy from '../../locales/packs/privacy.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Privacy tools that work on the visitor's own files in the browser. */
export const PRIVACY_TOOLS: PackTool[] = [
  definePackTool({
    id: 'screenshot-redactor', kind: 'screenshotRedactor', guideKey: 'screenshotRedactorGuide', category: 'media', icon: 'shield-check', tier: 'popular',
    keywords: ['blur screenshot', 'redact screenshot', 'hide sensitive information in image', 'pixelate image', 'black out text in image', 'censor image online', 'blur phone number in screenshot', 'paste screenshot and blur', 'remove exif and blur'],
  }, privacy.toolCatalog),
];
