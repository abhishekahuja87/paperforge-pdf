import stationery from '../../locales/packs/stationery.en.json';
import { definePackTool, type PackTool } from './types';

/** Printable paper: one full maker plus pages that open it on a single template. */
export const STATIONERY_TOOLS: PackTool[] = [
  definePackTool({
    id: 'printable-paper-maker', kind: 'paperMaker', guideKey: 'paperMakerGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['printable paper', 'paper maker', 'notebook generator', 'custom paper', 'lined paper printable', 'isometric paper', 'music staff paper', 'habit tracker printable', 'guitar tab paper'],
  }, stationery.toolCatalog),
  definePackTool({
    id: 'dot-grid-paper-generator', kind: 'paperDot', guideKey: 'dotGridGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['dot grid paper', 'dotted paper printable', 'bullet journal paper', 'dot grid generator', 'dotted notebook pdf'],
  }, stationery.toolCatalog),
  definePackTool({
    id: 'graph-paper-generator', kind: 'paperGraph', guideKey: 'graphPaperGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['graph paper', 'graph paper printable', 'grid paper', 'square grid paper', 'engineering paper', 'math graph paper pdf'],
  }, stationery.toolCatalog),
  definePackTool({
    id: 'cornell-notes-template', kind: 'paperCornell', guideKey: 'cornellGuide', category: 'everyday', icon: 'file-text', tier: 'more',
    keywords: ['cornell notes template', 'cornell notes printable', 'cornell note taking', 'lecture notes template', 'study notes template'],
  }, stationery.toolCatalog),
];
