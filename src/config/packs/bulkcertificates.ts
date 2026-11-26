import bulkcertificates from '../../locales/packs/bulkcertificates.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Bulk Certificate Maker (components/tools/certificates, logic in src/lib/certificates). Runs in the browser. */
export const BULKCERTIFICATES_TOOLS: PackTool[] = [
  definePackTool({
    id: 'bulk-certificate-maker', kind: 'bulkCertificates', guideKey: 'bulkCertificatesGuide', category: 'everyday', icon: 'stamp', tier: 'popular',
    keywords: ['bulk certificate maker', 'make certificates from a list of names', 'certificate generator from excel names', 'participation certificate for many students', 'mass certificate generator free', 'certificate maker with names list', 'school certificate generator', 'workshop certificates for all participants', 'certificate of appreciation for volunteers', 'bulk certificate pdf', 'certificates zip one pdf per name', 'course completion certificate generator'],
  }, bulkcertificates.toolCatalog),
];
