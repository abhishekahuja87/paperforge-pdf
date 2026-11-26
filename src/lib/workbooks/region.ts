/** Region settings for a workbook: currency, number style, date order, paper and what the tax is called. Presets only fill the boxes in; every one can be changed. */
export type RegionId = 'india' | 'us' | 'uk' | 'europe' | 'australia' | 'uae' | 'other';
export type DateOrder = 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd';
export interface Region {
  id: RegionId;
  /** Shown in front of amounts in the file, for example $ or ₹. Can be empty. */
  symbol: string;
  /** Used inside text messages and links, where only plain letters are safe, for example Rs or USD. */
  word: string;
  /** Group digits as 1,00,000 instead of 100,000. */
  lakh: boolean;
  date: DateOrder;
  paper: 'a4' | 'letter';
  /** What the tax is called on invoices: GST, VAT, Sales tax. */
  tax: string;
  /** Phone country code without +, added to numbers typed without one. */
  code: string;
  /** Week days off, Monday first: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]. */
  weekOff: boolean[];
}
const SAT_SUN = [false, false, false, false, false, true, true], SUN = [false, false, false, false, false, false, true];
export const REGIONS: Record<RegionId, Region> = {
  india: { id: 'india', symbol: '₹', word: 'Rs', lakh: true, date: 'dd-mm-yyyy', paper: 'a4', tax: 'GST', code: '91', weekOff: SUN },
  us: { id: 'us', symbol: '$', word: 'USD', lakh: false, date: 'mm-dd-yyyy', paper: 'letter', tax: 'Sales tax', code: '1', weekOff: SAT_SUN },
  uk: { id: 'uk', symbol: '£', word: 'GBP', lakh: false, date: 'dd-mm-yyyy', paper: 'a4', tax: 'VAT', code: '44', weekOff: SAT_SUN },
  europe: { id: 'europe', symbol: '€', word: 'EUR', lakh: false, date: 'dd-mm-yyyy', paper: 'a4', tax: 'VAT', code: '', weekOff: SAT_SUN },
  australia: { id: 'australia', symbol: '$', word: 'AUD', lakh: false, date: 'dd-mm-yyyy', paper: 'a4', tax: 'GST', code: '61', weekOff: SAT_SUN },
  uae: { id: 'uae', symbol: 'AED ', word: 'AED', lakh: false, date: 'dd-mm-yyyy', paper: 'a4', tax: 'VAT', code: '971', weekOff: SAT_SUN },
  other: { id: 'other', symbol: '', word: '', lakh: false, date: 'dd-mm-yyyy', paper: 'a4', tax: 'Tax', code: '', weekOff: SAT_SUN },
};
export const REGION_IDS = Object.keys(REGIONS) as RegionId[];

/** Guesses a preset from the browser language, so most people only have to check it. */
export function guessRegion(language: string, zone = ''): RegionId {
  const l = language.toLowerCase();
  if (zone.startsWith('Asia/Kolkata') || zone.startsWith('Asia/Calcutta') || l.endsWith('-in')) return 'india';
  if (l.endsWith('-us') || l === 'en') return zone.startsWith('America/') ? 'us' : l.endsWith('-us') ? 'us' : 'other';
  if (l.endsWith('-gb')) return 'uk';
  if (l.endsWith('-au')) return 'australia';
  if (l.endsWith('-ae') || zone.startsWith('Asia/Dubai')) return 'uae';
  if (/^(de|fr|es|it|nl|pt|pl|sv|fi|da|el)/.test(l) || zone.startsWith('Europe/')) return 'europe';
  return 'other';
}

const digits = (n: number) => (n > 0 ? `.${'0'.repeat(n)}` : '');
/** An Excel number format for amounts, in front of which the symbol is written. Lakh style groups 1,00,000. */
export function moneyFormat(r: Region, decimals = 2): string {
  const sym = r.symbol ? `"${r.symbol.replace(/"/g, '')}"` : '';
  if (!r.lakh) return `${sym}#,##0${digits(decimals)}`;
  return `[>=10000000]${sym}##\\,##\\,##\\,##0${digits(decimals)};[>=100000]${sym}##\\,##\\,##0${digits(decimals)};${sym}##,##0${digits(decimals)}`;
}
export const numberFormat = (r: Region, decimals = 0): string => (r.lakh ? `[>=10000000]##\\,##\\,##\\,##0${digits(decimals)};[>=100000]##\\,##\\,##0${digits(decimals)};##,##0${digits(decimals)}` : `#,##0${digits(decimals)}`);
