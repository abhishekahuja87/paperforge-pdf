import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const KIDS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  moneyShop: lazy(() => import('./money/MoneyShop')),
  tambola: lazy(() => import('./tambola/TambolaTool')),
  shadow: lazy(() => import('./shadow/ShadowExplorer')),
  addition: lazy(() => import('./carry/CarryBorrow').then((m) => ({ default: m.Addition }))),
  multiplication: lazy(() => import('./carry/Multiplication')),
  subtraction: lazy(() => import('./carry/CarryBorrow').then((m) => ({ default: m.Subtraction }))),
};
