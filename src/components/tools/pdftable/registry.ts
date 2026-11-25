import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PDFTABLE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  pdfTable: lazy(() => import('./PdfTableToExcel')),
};
