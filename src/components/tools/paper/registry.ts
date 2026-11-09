import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PAPER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  paperMaker: lazy(() => import('./variants').then((m) => ({ default: m.PaperMakerPage }))),
  paperDot: lazy(() => import('./variants').then((m) => ({ default: m.DotGridPaper }))),
  paperGraph: lazy(() => import('./variants').then((m) => ({ default: m.GraphPaper }))),
  paperHex: lazy(() => import('./variants').then((m) => ({ default: m.HexPaper }))),
  paperCalligraphy: lazy(() => import('./variants').then((m) => ({ default: m.CalligraphyPaper }))),
  paperCrossStitch: lazy(() => import('./variants').then((m) => ({ default: m.CrossStitchPaper }))),
  paperCornell: lazy(() => import('./variants').then((m) => ({ default: m.CornellNotesPaper }))),
};
