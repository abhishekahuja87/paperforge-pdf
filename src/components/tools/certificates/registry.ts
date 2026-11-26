import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const CERTIFICATES_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  bulkCertificates: lazy(() => import('./BulkCertificateMaker')),
};
