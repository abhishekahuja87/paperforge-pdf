import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const VCARD_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  vcardConverter: lazy(() => import('./VcardConverter')),
};
