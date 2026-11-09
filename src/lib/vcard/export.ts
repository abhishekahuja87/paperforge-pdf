import type { Table } from './table';

/** Excel allows 1,048,576 rows per sheet. One row is the header, so each sheet holds this many contacts. */
export const SHEET_ROWS = 1_048_575;

const NEEDS_QUOTES = /[",\r\n]/;
const PHONE_LIKE = /^[+-]?[\d\s().-]+$/;

/** Spreadsheet programs run cells that start with = + - @ as formulas. A leading apostrophe stops that, except for plain phone numbers. */
const guard = (value: string): string => (/^[=@\t\r]/.test(value) || (/^[+-]/.test(value) && !PHONE_LIKE.test(value)) ? `'${value}` : value);

const csvCell = (value: string): string => {
  const safe = guard(value);
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** CSV as a Blob built from many small strings, with a byte-order mark so Excel reads accents correctly. */
export function toCsvBlob(table: Table, protectPhones: boolean): Blob {
  const parts: string[] = ['\uFEFF', `${table.headers.map(csvCell).join(',')}\r\n`];
  const phones = new Set(protectPhones ? table.phoneColumns : []);
  let chunk: string[] = [];
  for (const row of table.rows) {
    chunk.push(`${row.map((cell, i) => (phones.has(i) && cell ? `="${cell.replace(/"/g, '""')}"` : csvCell(cell))).join(',')}\r\n`);
    if (chunk.length >= 5000) { parts.push(chunk.join('')); chunk = []; }
  }
  parts.push(chunk.join(''));
  return new Blob(parts, { type: 'text/csv;charset=utf-8' });
}

const xmlEscape = (value: string): string =>
  // eslint-disable-next-line no-control-regex
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const columnName = (index: number): string => {
  let n = index + 1;
  let name = '';
  while (n > 0) { const rem = (n - 1) % 26; name = String.fromCharCode(65 + rem) + name; n = Math.floor((n - 1) / 26); }
  return name;
};

const cell = (ref: string, value: string, style: number) => `<c r="${ref}"${style ? ` s="${style}"` : ''} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;

function sheetXml(headers: string[], rows: string[][]): string {
  const out: string[] = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>'];
  out.push(`<cols><col min="1" max="${headers.length}" width="22" customWidth="1"/></cols><sheetData>`);
  out.push(`<row r="1">${headers.map((h, c) => cell(`${columnName(c)}1`, h, 1)).join('')}</row>`);
  let chunk: string[] = [];
  rows.forEach((row, r) => {
    chunk.push(`<row r="${r + 2}">${row.map((value, c) => (value === '' ? '' : cell(`${columnName(c)}${r + 2}`, value, 0))).join('')}</row>`);
    if (chunk.length >= 2000) { out.push(chunk.join('')); chunk = []; }
  });
  out.push(chunk.join(''));
  out.push(`</sheetData><autoFilter ref="A1:${columnName(Math.max(0, headers.length - 1))}${rows.length + 1}"/></worksheet>`);
  return out.join('');
}

/** An .xlsx workbook (all values stored as text, so phone numbers keep their + and leading zeros). Splits into several sheets past Excel's row limit. */
export async function toXlsxBlob(table: Table): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const sheets = Math.max(1, Math.ceil(table.rows.length / SHEET_ROWS));
  const names = Array.from({ length: sheets }, (_, i) => (sheets === 1 ? 'Contacts' : `Contacts ${i + 1}`));
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.file('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
  names.forEach((_, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(table.headers, table.rows.slice(i * SHEET_ROWS, (i + 1) * SHEET_ROWS))));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
