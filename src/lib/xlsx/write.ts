/** Saves a Book as an .xlsx file: formulas with their answers, styles, dropdowns, colour rules, locked cells, charts and print settings. */
import { colIndex, ref as cellRef, type Book, type Chart, type SheetDef, type Style } from './model';
import { computeBook, isErr, type Computed, type Val } from './formula';

const esc = (t: string) => t.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const quoteSheet = (name: string) => `'${name.replace(/'/g, "''")}'`;
const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`;
const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Hands out numbers for fonts, fills, borders, number formats and cell styles, and writes styles.xml at the end. */
class Styles {
  fonts: string[] = ['<font><sz val="11"/><name val="Calibri"/></font>'];
  fills: string[] = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  borders: string[] = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
  formats: string[] = [];
  xfs: string[] = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'];
  dxfs: string[] = [];
  private seen = new Map<string, number>();
  private pool(list: string[], xml: string): number { const at = list.indexOf(xml); if (at >= 0) return at; list.push(xml); return list.length - 1; }
  format(code: string): number { if (code === 'General') return 0; const at = this.formats.indexOf(code); if (at >= 0) return 164 + at; this.formats.push(code); return 163 + this.formats.length; }
  of(s?: Style): number {
    if (!s) return 0;
    const sig = JSON.stringify(s); const known = this.seen.get(sig); if (known !== undefined) return known;
    const font = s.bold || s.italic || s.underline || s.size || s.color ? this.pool(this.fonts, `<font>${s.bold ? '<b/>' : ''}${s.italic ? '<i/>' : ''}${s.underline ? '<u/>' : ''}<sz val="${s.size ?? 11}"/>${s.color ? `<color rgb="${argb(s.color)}"/>` : ''}<name val="Calibri"/></font>`) : 0;
    const fill = s.fill ? this.pool(this.fills, `<fill><patternFill patternType="solid"><fgColor rgb="${argb(s.fill)}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const c = argb(s.borderColor ?? 'BFBFBF'); const side = (n: string) => `<${n} style="thin"><color rgb="${c}"/></${n}>`;
    const border = s.border ? this.pool(this.borders, s.border === 'all' ? `<border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border>` : s.border === 'bottom' ? `<border><left/><right/><top/>${side('bottom')}<diagonal/></border>` : `<border><left/><right/>${side('top')}<bottom/><diagonal/></border>`) : 0;
    const fmt = s.numFmt ? this.format(s.numFmt) : 0;
    const align = s.h || s.v || s.wrap || s.indent ? `<alignment${s.h ? ` horizontal="${s.h}"` : ''} vertical="${s.v ?? 'center'}"${s.wrap ? ' wrapText="1"' : ''}${s.indent ? ` indent="${s.indent}"` : ''}/>` : '';
    const prot = s.input ? '<protection locked="0"/>' : '';
    const xml = `<xf numFmtId="${fmt}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0"${fmt ? ' applyNumberFormat="1"' : ''}${font ? ' applyFont="1"' : ''}${fill ? ' applyFill="1"' : ''}${border ? ' applyBorder="1"' : ''}${align ? ' applyAlignment="1"' : ''}${prot ? ' applyProtection="1"' : ''}>${align}${prot}</xf>`;
    this.xfs.push(xml); const id = this.xfs.length - 1; this.seen.set(sig, id); return id;
  }
  dxf(fill?: string, color?: string, bold?: boolean): number {
    const xml = `<dxf>${color || bold ? `<font>${bold ? '<b/>' : ''}${color ? `<color rgb="${argb(color)}"/>` : ''}</font>` : ''}${fill ? `<fill><patternFill patternType="solid"><fgColor rgb="${argb(fill)}"/><bgColor rgb="${argb(fill)}"/></patternFill></fill>` : ''}</dxf>`;
    return this.pool(this.dxfs, xml);
  }
  xml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${this.formats.length ? `<numFmts count="${this.formats.length}">${this.formats.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(f)}"/>`).join('')}</numFmts>` : ''}<fonts count="${this.fonts.length}">${this.fonts.join('')}</fonts><fills count="${this.fills.length}">${this.fills.join('')}</fills><borders count="${this.borders.length}">${this.borders.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${this.xfs.length}">${this.xfs.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="${this.dxfs.length}">${this.dxfs.join('')}</dxfs></styleSheet>`;
  }
}

const splitCell = (at: string) => { const m = /^([A-Z]+)(\d+)$/.exec(at)!; return { col: colIndex(m[1]!), row: Number(m[2]) - 1 }; };

function cellXml(at: string, styleId: number, value: Val | undefined, formula: string | undefined, literal: string | number | boolean | undefined): string {
  const s = styleId ? ` s="${styleId}"` : '';
  if (formula !== undefined) {
    const f = `<f>${esc(formula)}</f>`;
    if (value === undefined) return `<c r="${at}"${s}>${f}</c>`;
    if (isErr(value)) return `<c r="${at}"${s} t="e">${f}<v>${esc(value.err)}</v></c>`;
    if (typeof value === 'number') return `<c r="${at}"${s}>${f}<v>${value}</v></c>`;
    if (typeof value === 'boolean') return `<c r="${at}"${s} t="b">${f}<v>${value ? 1 : 0}</v></c>`;
    return `<c r="${at}"${s} t="str">${f}<v>${esc(value ?? '')}</v></c>`;
  }
  if (literal === undefined) return `<c r="${at}"${s}/>`;
  if (typeof literal === 'number') return `<c r="${at}"${s}><v>${literal}</v></c>`;
  if (typeof literal === 'boolean') return `<c r="${at}"${s} t="b"><v>${literal ? 1 : 0}</v></c>`;
  return `<c r="${at}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(literal)}</t></is></c>`;
}

function sheetXml(sheet: SheetDef, index: number, styles: Styles, computed: Computed, hasDrawing: boolean, paper: Book['paper']): string {
  const rows = new Map<number, { col: number; at: string }[]>();
  for (const at of Object.keys(sheet.cells)) { const { col, row } = splitCell(at); const list = rows.get(row) ?? []; list.push({ col, at }); rows.set(row, list); }
  const rowNumbers = [...new Set([...rows.keys(), ...Object.keys(sheet.heights).map(Number)])].sort((a, b) => a - b);
  const data = rowNumbers.map((row) => {
    const cells = (rows.get(row) ?? []).sort((a, b) => a.col - b.col).map(({ col, at }) => {
      const c = sheet.cells[at]!; const value = c.f !== undefined ? computed.values.get(`${sheet.name}!${col},${row}`) : undefined;
      return cellXml(at, styles.of(c.s), value, c.f, c.v === null ? undefined : c.v);
    }).join('');
    const h = sheet.heights[row];
    return `<row r="${row + 1}"${h ? ` ht="${h}" customHeight="1"` : ''}>${cells}</row>`;
  }).join('');
  const widthCols = Object.keys(sheet.widths).map(Number).sort((a, b) => a - b);
  const cols = widthCols.length ? `<cols>${widthCols.map((c) => `<col min="${c + 1}" max="${c + 1}" width="${sheet.widths[c]}" customWidth="1"${sheet.hiddenCols.includes(c) ? ' hidden="1"' : ''}/>`).join('')}</cols>` : '';
  const f = sheet.freeze;
  const pane = f && (f.row || f.col) ? `<pane${f.col ? ` xSplit="${f.col}"` : ''}${f.row ? ` ySplit="${f.row}"` : ''} topLeftCell="${cellRef(f.col, f.row)}" activePane="${f.row && f.col ? 'bottomRight' : f.row ? 'bottomLeft' : 'topRight'}" state="frozen"/><selection pane="${f.row && f.col ? 'bottomRight' : f.row ? 'bottomLeft' : 'topRight'}"/>` : '';
  const view = `<sheetViews><sheetView workbookViewId="0"${index === 0 ? ' tabSelected="1"' : ''}${sheet.gridlines ? '' : ' showGridLines="0"'}${sheet.zoom ? ` zoomScale="${sheet.zoom}" zoomScaleNormal="${sheet.zoom}"` : ''}>${pane}</sheetView></sheetViews>`;
  const protect = sheet.protect ? `<sheetProtection sheet="1" objects="1" scenarios="1" formatColumns="0" formatRows="0"${sheet.filter ? ' autoFilter="0" sort="0"' : ''}/>` : '';
  const filter = sheet.filter ? `<autoFilter ref="${sheet.filter}"/>` : '';
  const merges = sheet.merges.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
  const rules = sheet.rules.map((r, i) => `<conditionalFormatting sqref="${r.range}"><cfRule type="expression" dxfId="${styles.dxf(r.fill, r.color, r.bold)}" priority="${i + 1}"${r.stop ? ' stopIfTrue="1"' : ''}><formula>${esc(r.formula)}</formula></cfRule></conditionalFormatting>`).join('');
  const checks = sheet.validations.length ? `<dataValidations count="${sheet.validations.length}">${sheet.validations.map((v) => {
    const type = v.kind === 'list' ? 'list' : v.kind === 'date' ? 'date' : v.kind;
    const listFormula = v.kind === 'list' ? `<formula1>${v.listRef ? esc(v.listRef) : `"${esc((v.list ?? []).join(','))}"`}</formula1>` : `<formula1>${v.min ?? 0}</formula1>${v.max !== undefined ? `<formula2>${v.max}</formula2>` : ''}`;
    const op = v.kind === 'list' ? '' : v.max !== undefined ? ' operator="between"' : ' operator="greaterThanOrEqual"';
    return `<dataValidation type="${type}"${op}${v.soft ? ' errorStyle="warning"' : ''} allowBlank="1" showInputMessage="${v.prompt ? 1 : 0}" showErrorMessage="1"${v.title ? ` promptTitle="${esc(v.title.slice(0, 32))}"` : ''}${v.prompt ? ` prompt="${esc(v.prompt.slice(0, 250))}"` : ''}${v.error ? ` error="${esc(v.error.slice(0, 250))}"` : ''} sqref="${v.range}">${listFormula}</dataValidation>`;
  }).join('')}</dataValidations>` : '';
  const links = sheet.links.length ? `<hyperlinks>${sheet.links.map((l) => `<hyperlink ref="${l.ref}" location="${esc(l.location)}" display="${esc(l.ref)}"/>`).join('')}</hyperlinks>` : '';
  const setup = `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="${paper === 'letter' ? 1 : 9}" orientation="${sheet.landscape ? 'landscape' : 'portrait'}"${sheet.fitWidth ? ' fitToWidth="1" fitToHeight="0"' : ''}/>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr>${sheet.tab ? `<tabColor rgb="${argb(sheet.tab)}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr>${view}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${data}</sheetData>${protect}${filter}${merges}${rules}${checks}${links}${setup}${hasDrawing ? '<drawing r:id="rId1"/>' : ''}</worksheet>`;
}

/** The values behind a range such as 'Entry'!$A$2:$A$9, for the small copy a chart keeps. */
function rangeValues(book: Book, computed: Computed, text: string): Val[] {
  const m = /^(?:'((?:[^']|'')+)'|([^'!]+))!\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/.exec(text); if (!m) return [];
  const name = (m[1] ?? m[2]!).replace(/''/g, "'"); const sheet = book.sheets.find((s) => s.name === name); if (!sheet) return [];
  const c1 = colIndex(m[3]!), r1 = Number(m[4]) - 1, c2 = m[5] ? colIndex(m[5]) : c1, r2 = m[6] ? Number(m[6]) - 1 : r1; const out: Val[] = [];
  for (let r = r1; r <= r2; r += 1) for (let c = c1; c <= c2; c += 1) { const cell = sheet.cells[cellRef(c, r)]; out.push(cell?.f !== undefined ? (computed.values.get(`${sheet.name}!${c},${r}`) ?? null) : (cell?.v ?? null)); }
  return out;
}

const PALETTE = ['F97316', '16A34A', '64748B', 'EAB308', 'DC2626', '0F766E', '9333EA', 'DB2777'];
function chartXml(chart: Chart, book: Book, computed: Computed): string {
  const strings = (vals: Val[]) => `<c:strCache><c:ptCount val="${vals.length}"/>${vals.map((v, i) => `<c:pt idx="${i}"><c:v>${esc(isErr(v) ? v.err : String(v ?? ''))}</c:v></c:pt>`).join('')}</c:strCache>`;
  const numbers = (vals: Val[]) => `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${vals.length}"/>${vals.map((v, i) => (typeof v === 'number' ? `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>` : '')).join('')}</c:numCache>`;
  const cats = rangeValues(book, computed, chart.cats);
  const series = chart.series.map((s, i) => {
    const color = s.color ?? PALETTE[i % PALETTE.length]!, vals = rangeValues(book, computed, s.vals);
    const points = chart.kind === 'pie' ? cats.map((_, k) => `<c:dPt><c:idx val="${k}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${PALETTE[k % PALETTE.length]}"/></a:solidFill></c:spPr></c:dPt>`).join('') : '';
    const fill = chart.kind === 'line' ? `<c:spPr><a:ln w="28575"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker>` : `<c:spPr><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></c:spPr>${chart.kind === 'pie' ? '' : '<c:invertIfNegative val="0"/>'}`;
    return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/><c:tx><c:v>${esc(s.name)}</c:v></c:tx>${fill}${points}<c:cat><c:strRef><c:f>${esc(chart.cats)}</c:f>${strings(cats)}</c:strRef></c:cat><c:val><c:numRef><c:f>${esc(s.vals)}</c:f>${numbers(vals)}</c:numRef></c:val>${chart.kind === 'line' ? '<c:smooth val="0"/>' : ''}</c:ser>`;
  }).join('');
  const axes = '<c:catAx><c:axId val="111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="112"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="112"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="111"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>';
  const body = chart.kind === 'pie' ? `<c:pieChart><c:varyColors val="1"/>${series}<c:firstSliceAng val="0"/></c:pieChart>`
    : chart.kind === 'line' ? `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series}<c:marker val="1"/><c:axId val="111"/><c:axId val="112"/></c:lineChart>${axes}`
    : `<c:barChart><c:barDir val="${chart.kind === 'bar' ? 'bar' : 'col'}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}<c:gapWidth val="80"/><c:axId val="111"/><c:axId val="112"/></c:barChart>${axes}`;
  const legend = chart.series.length > 1 || chart.kind === 'pie' ? `<c:legend><c:legendPos val="${chart.kind === 'pie' ? 'r' : 'b'}"/><c:overlay val="0"/></c:legend>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:roundedCorners val="0"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1200" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1200" b="1"/><a:t>${esc(chart.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${body}</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>`;
}

const drawingXml = (charts: Chart[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${charts.map((c, i) => `<xdr:twoCellAnchor><xdr:from><xdr:col>${c.at.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${c.at.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${c.at.col + c.at.cols}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${c.at.row + c.at.rows}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Chart ${i + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`).join('')}</xdr:wsDr>`;

const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const rels = (items: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items}</Relationships>`;

/** The workbook as a zipped .xlsx file. Formulas carry their worked-out answers; apps also recalculate when the file opens. */
export async function buildXlsx(book: Book, now = new Date(), withValues = true): Promise<{ blob: Blob; computed: Computed }> {
  const JSZip = (await import('jszip')).default, zip = new JSZip(), styles = new Styles(), computed = computeBook(book, now);
  /** Tests save a copy without the answers, to see that another program works out the same ones. */
  const shown: Computed = withValues ? computed : { values: new Map(), warnings: [] };
  const sheetsWithCharts = book.sheets.map((s, i) => ({ s, i })).filter((x) => x.s.charts.length);
  let chartCount = 0; const chartFiles: { sheet: number; drawing: number; first: number }[] = [];
  sheetsWithCharts.forEach(({ s, i }, d) => { chartFiles.push({ sheet: i, drawing: d + 1, first: chartCount + 1 }); chartCount += s.charts.length; });

  const types = [`<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`, `<Default Extension="xml" ContentType="application/xml"/>`,
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`, `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`,
    ...book.sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`),
    ...chartFiles.map((c) => `<Override PartName="/xl/drawings/drawing${c.drawing}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`),
    ...Array.from({ length: chartCount }, (_, i) => `<Override PartName="/xl/charts/chart${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`)].join('');
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${types}</Types>`);
  zip.file('_rels/.rels', rels(`<Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/>`));

  const names: string[] = [];
  book.sheets.forEach((s, i) => { if (s.printTitles) names.push(`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${esc(quoteSheet(s.name))}!${esc(s.printTitles)}</definedName>`); });
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${REL}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${book.sheets.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>${names.length ? `<definedNames>${names.join('')}</definedNames>` : ''}<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', rels(`${book.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${book.sheets.length + 1}" Type="${REL}/styles" Target="styles.xml"/>`));

  book.sheets.forEach((s, i) => {
    const drawing = chartFiles.find((c) => c.sheet === i);
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s, i, styles, shown, !!drawing, book.paper));
    if (drawing) {
      zip.file(`xl/worksheets/_rels/sheet${i + 1}.xml.rels`, rels(`<Relationship Id="rId1" Type="${REL}/drawing" Target="../drawings/drawing${drawing.drawing}.xml"/>`));
      zip.file(`xl/drawings/drawing${drawing.drawing}.xml`, drawingXml(s.charts));
      zip.file(`xl/drawings/_rels/drawing${drawing.drawing}.xml.rels`, rels(s.charts.map((_, k) => `<Relationship Id="rId${k + 1}" Type="${REL}/chart" Target="../charts/chart${drawing.first + k}.xml"/>`).join('')));
      s.charts.forEach((c, k) => zip.file(`xl/charts/chart${drawing.first + k}.xml`, chartXml(c, book, computed)));
    }
  });
  zip.file('xl/styles.xml', styles.xml());
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: MIME });
  return { blob, computed };
}
