/**
 * Download file names. Every file the site hands out is named the same way:
 *   [feature]_[YYYY-MM-DD]_[HH-mm]_[original name]_[details].[ext]
 * for example `merged_2026-11-10_22-56_documents_2files.pdf`. The feature comes first so files group by
 * what made them, and the date and time come next so the newest one is easy to spot.
 */

const pad = (value: number): string => value.toString().padStart(2, '0');

/** Local date and time as `2026-11-10_22-56` (no colons, so it is safe in file names). */
export function fileStamp(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

function clean(text: string, max: number): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, max);
}

export interface FileNameParts {
  /** Original file name or any short label; its extension is dropped. */
  base?: string;
  /** Extra settings worth knowing from the name, such as `2files` or `pages-1-3`. */
  details?: string;
  now?: Date;
}

/** Name for any downloadable file: feature, date and time, then the original name and details. */
export function generateFileName(feature: string, extension: string, parts: FileNameParts = {}): string {
  const base = parts.base ? clean(parts.base.replace(/\.[a-z0-9]{1,5}$/i, ''), 30) : '';
  const details = parts.details ? clean(parts.details, 30) : '';
  const name = [clean(feature, 24) || 'file', fileStamp(parts.now), base, details].filter(Boolean).join('_');
  return `${name}.${extension.replace(/^\./, '')}`;
}

/** Name for a PDF the site produced: `generatePdfFilename('report.pdf', 'merged', '2files')`. */
export function generatePdfFilename(originalFileName: string, toolName: string, details?: string): string {
  return generateFileName(toolName, 'pdf', { base: originalFileName.replace(/\.pdf$/i, '') || 'document', details });
}
