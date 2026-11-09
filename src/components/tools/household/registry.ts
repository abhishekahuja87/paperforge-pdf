import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const HOUSEHOLD_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  rentReceipt: lazy(() => import('./RentReceiptGenerator')),
};
