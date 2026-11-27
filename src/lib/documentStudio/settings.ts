import type { StudioSettings } from './types';

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  outputFileName: 'master-document',
  documentTitle: '',
  documentAuthor: '',
  documentSubject: '',
  documentKeywords: '',
  pageStandard: 'a4',
  numberPosition: 'bottom-center',
  numberFormat: 'Page {page} of {total}',
  skipFirstPage: false,
  marginMm: 0,
  watermarkText: '',
  watermarkOpacity: 25,
  watermarkAngle: -35,
  compression: 'quality',
  protectOutput: false,
  outputUserPassword: '',
  outputOwnerPassword: '',
  allowOutputPrinting: true,
  allowOutputCopying: false,
};
