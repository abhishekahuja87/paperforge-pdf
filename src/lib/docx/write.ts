/** Saves a DocModel as a .docx file: a zip of small XML parts. No macros, no links to the internet. */
import JSZip from 'jszip';
import { PAPER, runsOf, type Block, type Cell, type DocModel, type Para, type Run, type TableBlock, type TocBlock } from './model';

const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const esc = (t: string) => t.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!)).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const twips = (mm: number) => Math.round((mm / 25.4) * 1440);
const hex = (c: string) => c.replace('#', '').toUpperCase();

function runXml(r: Run, base: { bold?: boolean; italic?: boolean; size?: number; color?: string }): string {
  const bold = r.bold ?? base.bold, italic = r.italic ?? base.italic, size = r.size ?? base.size, color = r.color ?? base.color;
  const props = `${bold ? '<w:b/>' : ''}${italic ? '<w:i/>' : ''}${color ? `<w:color w:val="${hex(color)}"/>` : ''}${size ? `<w:sz w:val="${Math.round(size * 2)}"/><w:szCs w:val="${Math.round(size * 2)}"/>` : ''}`;
  // A line break inside a run is written as a break element, a tab as a tab.
  const parts = r.text.split(/(\n|\t)/).map((p) => (p === '\n' ? '<w:br/>' : p === '\t' ? '<w:tab/>' : p ? `<w:t xml:space="preserve">${esc(p)}</w:t>` : '')).join('');
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}${parts}</w:r>`;
}

function paraXml(p: Para): string {
  const base = { bold: p.bold, italic: p.italic, size: p.size, color: p.color };
  const styleId = p.style === 'h1' ? 'Heading1' : p.style === 'h2' ? 'Heading2' : p.style === 'h3' ? 'Heading3' : '';
  const props = `${styleId ? `<w:pStyle w:val="${styleId}"/>` : ''}${p.keepNext ? '<w:keepNext/>' : ''}${p.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ''}${p.rule ? `<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${hex(p.rule)}"/></w:pBdr>` : ''}<w:spacing w:before="${Math.round((p.before ?? 0) * 20)}" w:after="${Math.round((p.after ?? 6) * 20)}"/>${p.indent ? `<w:ind w:left="${Math.round(p.indent * 20)}"/>` : ''}${p.align ? `<w:jc w:val="${p.align}"/>` : ''}`;
  return `<w:p><w:pPr>${props}</w:pPr>${runsOf(p.runs).map((r) => runXml(r, base)).join('')}</w:p>`;
}

function cellXml(c: Cell, width: number, lines?: string): string {
  const borders = lines ? `<w:tcBorders>${['top', 'left', 'bottom', 'right'].map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="${hex(lines)}"/>`).join('')}</w:tcBorders>` : '';
  const para: Para = { type: 'p', runs: c.runs, align: c.align, bold: c.bold, color: c.color, size: c.size, before: 2, after: 2 };
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${borders}${c.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${hex(c.fill)}"/>` : ''}</w:tcPr>${paraXml(para)}</w:tc>`;
}

function tableXml(t: TableBlock, usable: number): string {
  const total = t.widths.reduce((a, b) => a + b, 0) || 1, cols = t.widths.map((w) => Math.round((w / total) * usable));
  const rows = t.rows.map((row, i) => `<w:tr>${t.header && i === 0 ? '<w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>'}${row.map((c, k) => cellXml(c, cols[k] ?? cols[cols.length - 1]!, t.lines)).join('')}</w:tr>`).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${usable}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows}</w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="60" w:lineRule="exact"/></w:pPr></w:p>`;
}

/** A contents field. Each entry is a paragraph, so the list looks right before Word updates it. */
function tocXml(t: TocBlock): string {
  const field = (type: string) => `<w:r><w:fldChar w:fldCharType="${type}"/></w:r>`;
  const last = t.entries.length - 1;
  return t.entries.map((e, i) => {
    const pre = i === 0 ? `${field('begin')}<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>${field('separate')}` : '';
    return `<w:p><w:pPr><w:spacing w:before="0" w:after="60"/><w:ind w:left="${(e.level - 1) * 360}"/></w:pPr>${pre}${runXml({ text: e.text }, {})}${i === last ? field('end') : ''}</w:p>`;
  }).join('') || '<w:p/>';
}

const heading = (level: number, pt: number): string => `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="${level === 1 ? 360 : 240}" w:after="120"/><w:outlineLvl w:val="${level - 1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${pt * 2}"/><w:szCs w:val="${pt * 2}"/></w:rPr></w:style>`;

const blockXml = (b: Block, usable: number): string => (b.type === 'p' ? paraXml(b) : b.type === 'table' ? tableXml(b, usable) : b.type === 'toc' ? tocXml(b) : '<w:p><w:r><w:br w:type="page"/></w:r></w:p>');

export async function buildDocx(doc: DocModel): Promise<Blob> {
  const paper = PAPER[doc.paper], margin = twips(doc.margin ?? 20), pageW = twips(paper.w), pageH = twips(paper.h), usable = pageW - margin * 2;
  const font = doc.font ?? 'Calibri', size = Math.round((doc.size ?? 11) * 2);
  const body = doc.blocks.map((b) => blockXml(b, usable)).join('');
  const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${body}<w:sectPr>${doc.pageNumbers ? '<w:footerReference w:type="default" r:id="rId3"/>' : ''}<w:pgSz w:w="${pageW}" w:h="${pageH}"/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="720" w:footer="720" w:gutter="0"/>${doc.pageNumbers && doc.coverPage ? '<w:titlePg/>' : ''}</w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${ns}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${esc(font)}" w:hAnsi="${esc(font)}" w:cs="${esc(font)}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${heading(1, 16)}${heading(2, 13)}${heading(3, 12)}</w:styles>`;
  const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${ns}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering ${ns}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="260"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${doc.pageNumbers ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ''}</Types>`);
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${doc.pageNumbers ? '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' : ''}</Relationships>`);
  if (doc.pageNumbers) zip.file('word/footer1.xml', footer);
  zip.file('word/document.xml', document); zip.file('word/styles.xml', styles); zip.file('word/numbering.xml', numbering);
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(doc.title)}</dc:title><dc:creator></dc:creator></cp:coreProperties>`);
  return zip.generateAsync({ type: 'blob', mimeType: MIME });
}
