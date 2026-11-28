import { generateFileName, type FileNameParts } from './naming';

/**
 * Opens the print dialog with the page title set to a file name in the site's usual style, because browsers suggest the page title as the
 * file name when someone chooses Save as PDF. For example `fixtures_2026-11-28_12-00_inter_school_cup_city_ground`. The title is put back afterwards.
 */
export function printAs(feature: string, parts: FileNameParts = {}): void {
  const previous = document.title;
  const restore = (): void => { document.title = previous; window.removeEventListener('afterprint', restore); };
  document.title = generateFileName(feature, 'pdf', parts).replace(/\.pdf$/, '');
  window.addEventListener('afterprint', restore);
  window.print();
  window.setTimeout(restore, 5000);
}
