import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CATALOGUE_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  productCatalogueMaker: lazy(() => import('./ProductCatalogueMaker')),
};
