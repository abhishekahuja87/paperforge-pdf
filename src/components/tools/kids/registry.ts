import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const KIDS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  moneyShop: lazy(() => import('./money/MoneyShop')),
  tambola: lazy(() => import('./tambola/TambolaTool')),
};
