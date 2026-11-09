import stationery from '../../locales/packs/stationery.catalog.en.json';
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
  definePackTool({
    id: 'hexagon-graph-paper-generator', kind: 'paperHex', guideKey: 'hexPaperGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['hexagon graph paper', 'hex grid printable', 'hex paper', 'hex map paper', 'honeycomb grid', 'hexagonal grid generator', 'organic chemistry hexagon paper'],
  }, stationery.toolCatalog),
  definePackTool({
    id: 'calligraphy-practice-sheet-generator', kind: 'paperCalligraphy', guideKey: 'calligraphyGuide', category: 'everyday', icon: 'type', tier: 'more',
    keywords: ['calligraphy practice sheets', 'calligraphy guide sheet', 'slant guide lines', 'copperplate practice sheet', 'lettering practice paper', 'hand lettering guide sheet', 'spencerian practice'],
  }, stationery.toolCatalog),
  definePackTool({
    id: 'cross-stitch-pattern-grid-generator', kind: 'paperCrossStitch', guideKey: 'crossStitchGuide', category: 'everyday', icon: 'grid', tier: 'more',
    keywords: ['cross stitch grid', 'cross stitch graph paper', 'cross stitch pattern paper', 'pixel art grid', 'bead pattern grid', 'stitch chart printable', 'aida grid'],
  }, stationery.toolCatalog),
];
