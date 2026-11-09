/** Reads the pasted list for the bulk QR generator: one code per line as "label, content". */

export interface BulkItem {
  label: string;
  content: string;
}

export const MAX_BULK = 500;

/**
 * Splits a line into label and content. A tab always separates them. Otherwise the first comma does,
 * unless a link ("://") starts before it, in which case the whole line is the content and the label is empty.
 */
export function splitBulkLine(line: string): BulkItem {
  const tab = line.indexOf('\t');
  if (tab >= 0) return { label: line.slice(0, tab).trim(), content: line.slice(tab + 1).trim() };
  const comma = line.indexOf(',');
  const scheme = line.indexOf('://');
  if (comma < 0 || (scheme >= 0 && scheme < comma)) return { label: '', content: line.trim() };
  return { label: line.slice(0, comma).trim(), content: line.slice(comma + 1).trim() };
}

export function parseBulkLines(text: string): BulkItem[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '').map(splitBulkLine).filter((item) => item.content !== '');
}

/** A safe file name for an item: label (or content) reduced to letters, digits, dashes, and made unique. */
export function fileNames(items: BulkItem[]): string[] {
  const taken = new Set<string>();
  return items.map((item, index) => {
    const base = (item.label || item.content).toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || `code-${index + 1}`;
    let name = base;
    for (let n = 2; taken.has(name); n += 1) name = `${base}-${n}`;
    taken.add(name);
    return name;
  });
}
