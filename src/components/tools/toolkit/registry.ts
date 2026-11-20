import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const TOOLKIT_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  nameStrip: lazy(() => import('./PhotoNameStrip')),
  fillPdf: lazy(() => import('./FillPdf')),
  waLink: lazy(() => import('./WhatsappLinkMaker')),
  barcodeMaker: lazy(() => import('./BarcodeMaker')),
  randomPicker: lazy(() => import('./RandomPicker')),
  teamMaker: lazy(() => import('./TeamMaker')),
};
