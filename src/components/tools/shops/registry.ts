import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SHOPS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  offerPosterMaker: lazy(() => import('./OfferPosterMaker')),
};
