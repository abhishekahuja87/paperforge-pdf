/** Page stamps for legal and office use: running numbers that continue from one file to the next, plus optional header and footer text. */
export const formatBates = (prefix: string, number: number, digits: number, suffix = ''): string => `${prefix}${String(number).padStart(Math.max(1, digits), '0')}${suffix}`;

/** Replaces {page}, {pages}, {file} and {date} in header and footer text. */
export function fillTemplate(template: string, values: { page: number; pages: number; file: string; date: string }): string {
  return template.replace(/\{page\}/g, String(values.page)).replace(/\{pages\}/g, String(values.pages)).replace(/\{file\}/g, values.file).replace(/\{date\}/g, values.date);
}

export type StampSpot = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
