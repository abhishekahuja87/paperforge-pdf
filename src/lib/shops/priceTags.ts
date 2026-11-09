/** Logic for the price tag and shelf label maker: reading the pasted list and the tag sizes that fit an A4 sheet. */

export interface TagItem {
  name: string;
  price: string;
  oldPrice: string;
  code: string;
}

export interface TagSize {
  id: 'small' | 'medium' | 'large';
  label: string;
  columns: number;
  rows: number;
}

/** Sizes on an A4 sheet with 8 mm margins. */
export const TAG_SIZES: TagSize[] = [
  { id: 'small', label: 'Small: 40 per sheet (4 x 10)', columns: 4, rows: 10 },
  { id: 'medium', label: 'Medium: 24 per sheet (3 x 8)', columns: 3, rows: 8 },
  { id: 'large', label: 'Large: 10 per sheet (2 x 5)', columns: 2, rows: 5 },
];

export const MAX_TAGS = 400;
export const MAX_COPIES = 50;

/** Splits one line on a tab, else on a pipe, else on commas. */
export function splitFields(line: string): string[] {
  const separator = line.includes('\t') ? '\t' : line.includes('|') ? '|' : ',';
  return line.split(separator).map((part) => part.trim());
}

/** Reads "name | price | old price | code" lines. Blank lines and lines with no name are skipped. */
export function parseTagLines(text: string): TagItem[] {
  return text.split(/\r?\n/).map((line) => {
    const [name = '', price = '', oldPrice = '', code = ''] = splitFields(line);
    return { name, price, oldPrice, code };
  }).filter((item) => item.name !== '');
}

/** Repeats each item `copies` times, stopping at MAX_TAGS. */
export function expandTags(items: TagItem[], copies: number): TagItem[] {
  const count = Math.min(Math.max(Math.floor(copies) || 1, 1), MAX_COPIES);
  const result: TagItem[] = [];
  for (const item of items) {
    for (let i = 0; i < count && result.length < MAX_TAGS; i += 1) result.push(item);
  }
  return result;
}

/** Puts the currency text in front of a price unless the price already has letters or a symbol in front. */
export const withPrefix = (prefix: string, price: string): string => (price === '' ? '' : /^[^\d.]/.test(price) ? price : `${prefix}${price}`);
