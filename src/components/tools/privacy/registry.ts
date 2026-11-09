import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const PRIVACY_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  screenshotRedactor: lazy(() => import('./ScreenshotRedactor')),
};
