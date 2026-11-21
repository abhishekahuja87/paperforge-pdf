import safeshare from '../../locales/packs/safeshare.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Tools for sharing documents and photos safely: PDF redaction, document compare and photo location remover (components/tools/safeshare). All run in the browser. */
export const SAFESHARE_TOOLS: PackTool[] = [
  definePackTool({
    id: 'redact-pdf', kind: 'redactPdf', guideKey: 'redactPdfGuide', category: 'pdf', icon: 'shield-check', tier: 'popular',
    keywords: ['redact pdf', 'redact pdf online free', 'black out text in pdf', 'hide name in pdf', 'hide aadhaar number in pdf', 'hide account number in pdf', 'cover text in pdf permanently', 'remove sensitive information from pdf', 'blackout pdf', 'censor pdf', 'hide phone number in pdf', 'redact pdf on phone'],
  }, safeshare.toolCatalog),
  definePackTool({
    id: 'compare-pdf-and-text', kind: 'comparePdf', guideKey: 'comparePdfAndTextGuide', category: 'pdf', icon: 'git-merge', tier: 'popular',
    keywords: ['compare pdf', 'compare two pdf files', 'compare two texts', 'text compare online', 'diff checker', 'find difference between two documents', 'compare two documents online', 'what changed between two versions', 'compare agreement versions', 'text difference checker', 'compare two lists', 'document comparison free'],
  }, safeshare.toolCatalog),
  definePackTool({
    id: 'remove-photo-location', kind: 'photoPrivacy', guideKey: 'removePhotoLocationGuide', category: 'media', icon: 'lock', tier: 'popular',
    keywords: ['remove location from photo', 'remove exif data', 'exif remover online', 'remove gps from photo', 'photo metadata remover', 'check photo location', 'see where a photo was taken', 'remove metadata from image', 'delete exif data from photo', 'strip exif', 'photo privacy', 'remove location from photo before sharing'],
  }, safeshare.toolCatalog),
];
