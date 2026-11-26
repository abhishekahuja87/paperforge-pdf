import videoblur from '../../locales/packs/videoblur.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Blur Faces or Number Plates in a Video (components/tools/videoedit, logic in src/lib/videoblur). Runs in the browser. */
export const VIDEOBLUR_TOOLS: PackTool[] = [
  definePackTool({
    id: 'blur-faces-or-plates-in-video', kind: 'videoBlur', guideKey: 'videoBlurGuide', category: 'media', icon: 'shield-check', tier: 'popular',
    keywords: ['blur face in video', 'blur number plate in video', 'hide license plate video free', 'blur faces in video online no watermark', 'censor part of a video', 'blur part of a video', 'pixelate face in video', 'hide car number plate in video', 'blur background people in video', 'blur video online without upload', 'block out part of a video', 'video face blur for privacy'],
  }, videoblur.toolCatalog),
];
