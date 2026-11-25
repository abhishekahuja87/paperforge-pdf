import sequence from '../../locales/packs/sequence.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** The Sequence Diagram Video Maker (components/tools/sequence, logic in src/lib/sequence). Runs in the browser. */
export const SEQUENCE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'sequence-diagram-video-maker', kind: 'sequenceVideo', guideKey: 'sequenceVideoGuide', category: 'media', icon: 'git-merge', tier: 'popular',
    keywords: ['sequence diagram video maker', 'animated sequence diagram', 'text to flowchart video', 'sequence diagram animation online', 'explainer video from text', 'flow animation maker free', 'process flow video maker', 'websequencediagrams animation', 'diagram to video for reels', 'animated arrows and boxes video', 'record voice over diagram', 'how it works explainer video maker'],
  }, sequence.toolCatalog),
];
