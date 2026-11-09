import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PAPER_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  paperMaker: lazy(() => import('./variants').then((m) => ({ default: m.PaperMakerPage }))),
  paperDot: lazy(() => import('./variants').then((m) => ({ default: m.DotGridPaper }))),
  paperGraph: lazy(() => import('./variants').then((m) => ({ default: m.GraphPaper }))),
  paperCornell: lazy(() => import('./variants').then((m) => ({ default: m.CornellNotesPaper }))),
};
