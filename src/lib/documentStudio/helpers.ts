/** Small pure helpers for the document studio page: default settings, file names, page ranges and labels. */
import { DEFAULT_STUDIO_SETTINGS } from './settings';
import type { OutputSequenceItem, PageCard, SourceItem, StudioSettings } from './types';

export function createDefaultStudioSettings(): StudioSettings {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  return {
    ...DEFAULT_STUDIO_SETTINGS,
    outputFileName: `master-document-${timestamp}-${crypto.randomUUID().slice(0, 6)}`,
  };
}

export function pdfFileName(value: string): string {
  const safeBase = value.trim()
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .split('')
    .filter((character) => character.charCodeAt(0) >= 32)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return `${safeBase || 'master-document'}.pdf`;
}

export function arrayBufferFromBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function parsePageRange(value: string, pageCount: number): { pageNumbers?: number[]; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: 'Enter a page range, such as 1-3, 5.' };
  if (!/^\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*$/.test(trimmed)) {
    return { error: 'Use page numbers and ranges separated by commas, such as 1-3, 5.' };
  }

  const pageNumbers = new Set<number>();
  for (const part of trimmed.split(',')) {
    const [startText, endText] = part.trim().split(/\s*-\s*/);
    const start = Number(startText);
    const end = endText === undefined ? start : Number(endText);
    if (start < 1 || end < start || end > pageCount) {
      return { error: `Page ranges must be between 1 and ${pageCount}, with the first number no greater than the last.` };
    }
    for (let pageNumber = start; pageNumber <= end; pageNumber += 1) pageNumbers.add(pageNumber);
  }
  return { pageNumbers: [...pageNumbers] };
}

export const PAGE_STANDARD_LABELS = {
  a4: 'Force uniform A4',
  letter: 'Force uniform US Letter',
  preserve: 'Preserve mixed sizes',
} as const;

export function newOutputItem(page: PageCard): OutputSequenceItem {
  return {
    id: crypto.randomUUID(),
    page,
    rotation: 0,
    crop: { top: 0, right: 0, bottom: 0, left: 0 },
    fitMode: 'letterbox',
    redactions: [],
  };
}

export function sourceTypeLabel(kind: SourceItem['kind']): string {
  return kind === 'pdf' ? 'PDF' : kind === 'docx' ? 'DOCX' : kind === 'custom' ? 'CUSTOM' : 'IMAGE';
}
