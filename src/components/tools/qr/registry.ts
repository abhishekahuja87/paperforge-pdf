import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const QR_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  qrGenerator: lazy(() => import('./variants').then((m) => ({ default: m.QrPage }))),
  qrWifi: lazy(() => import('./variants').then((m) => ({ default: m.WifiQrPage }))),
  qrBulk: lazy(() => import('./BulkQrGenerator')),
  qrContact: lazy(() => import('./variants').then((m) => ({ default: m.ContactQrPage }))),
};
