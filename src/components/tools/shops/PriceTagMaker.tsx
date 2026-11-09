import React, { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { CalcFooter, Note, SelectField, calcCard } from '../../finance/ui';
import { fieldClass } from '../utilities/common';
import { Toggle } from '../paper/controls';
import { code128Svg, canEncode128 } from '../../../lib/barcode/code128';
import { encodeQr } from '../../../lib/qr/encoder';
import { defaultStyle, qrSvg } from '../../../lib/qr/render';
import { MAX_COPIES, MAX_TAGS, TAG_SIZES, expandTags, parseTagLines, withPrefix, type TagItem, type TagSize } from '../../../lib/shops/priceTags';

const SAMPLE = 'Basmati rice 5 kg | 649 | 749 | 8901234500011\nGreen tea 100 bags | 199 | | 8901234500028\nSteel water bottle | 349 | 499 | SKU-1042';
const PREVIEW_SHEETS = 2;
/** Font scale per size, so text stays in proportion to the tag. */
const SCALE: Record<TagSize['id'], number> = { small: 1, medium: 1.35, large: 2 };

const savePercent = (price: string, oldPrice: string): number => {
  const now = Number(price.replace(/[^\d.]/g, ''));
  const was = Number(oldPrice.replace(/[^\d.]/g, ''));
  return was > 0 && now > 0 && now < was ? Math.round(((was - now) / was) * 100) : 0;
};

function codeMarkup(item: TagItem, kind: string, color: string): string {
  if (kind === 'none' || item.code === '') return '';
  if (kind === 'qr') {
    try { return qrSvg(encodeQr(item.code, 'M'), { ...defaultStyle(), fg: '#000000', bg: '#ffffff', quiet: 1 }); } catch { return ''; }
  }
  return canEncode128(item.code) ? code128Svg(item.code, 40, 10, color) : '';
}

export const PriceTagMaker: React.FC = () => {
  const [text, setText] = useState('');
  const [sizeId, setSizeId] = useState<TagSize['id']>('medium');
  const [copies, setCopies] = useState('1');
  const [prefix, setPrefix] = useState('Rs ');
  const [shop, setShop] = useState('');
  const [accent, setAccent] = useState('#c2410c');
  const [codeKind, setCodeKind] = useState('barcode');
  const [showSave, setShowSave] = useState(true);

  const size = TAG_SIZES.find((item) => item.id === sizeId) ?? TAG_SIZES[1];
  const items = useMemo(() => parseTagLines(text), [text]);
  const tags = useMemo(() => expandTags(items, Number(copies)), [items, copies]);
  const perSheet = size.columns * size.rows;
  const sheets: TagItem[][] = [];
  for (let i = 0; i < tags.length; i += perSheet) sheets.push(tags.slice(i, i + perSheet));
  const skippedCodes = items.filter((item) => codeKind !== 'none' && item.code !== '' && codeMarkup(item, codeKind, '#000000') === '').length;
  const scale = SCALE[size.id];

  return (
    <section className={calcCard}>
      <style>{`@media print { body * { visibility: hidden !important; } #tag-print, #tag-print * { visibility: visible !important; } #tag-print { position: absolute; left: 0; top: 0; width: 210mm !important; } .tag-sheet { width: 210mm !important; height: 297mm !important; break-after: page; page-break-after: always; border: 0 !important; } .tag-sheet:last-child { break-after: auto; page-break-after: auto; } @page { size: A4; margin: 0; } }`}</style>
      <div className="print:hidden">
        <label className="block text-xs font-semibold text-slate-700">
          One product per line: name | price | old price (optional) | code (optional)
          <textarea value={text} rows={7} onChange={(event) => setText(event.target.value)} placeholder={SAMPLE} className={`${fieldClass} font-mono text-xs`} />
        </label>
        <p className="mt-1 text-[11px] text-slate-500">Separate the parts with | or a tab (paste columns from a spreadsheet). Commas also work when no price has a comma in it. Leave a part empty to skip it.</p>
        <button type="button" onClick={() => setText(SAMPLE)} className="mt-2 inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Fill with an example</button>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField label="Tag size" value={sizeId} onChange={(value) => setSizeId(value as TagSize['id'])} options={TAG_SIZES.map((item) => ({ value: item.id, label: item.label }))} />
          <SelectField label="Code on the tag" value={codeKind} onChange={setCodeKind} options={[{ value: 'barcode', label: 'Barcode (Code 128)' }, { value: 'qr', label: 'QR code' }, { value: 'none', label: 'None' }]} />
          <label className="block text-xs font-semibold text-slate-700">Copies of each tag (1 to {MAX_COPIES})<input value={copies} inputMode="numeric" onChange={(event) => setCopies(event.target.value)} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">Text before the price<input value={prefix} onChange={(event) => setPrefix(event.target.value)} className={fieldClass} placeholder="Rs " /></label>
          <label className="block text-xs font-semibold text-slate-700">Shop name on the tag (optional)<input value={shop} onChange={(event) => setShop(event.target.value)} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">Colour<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="mt-1.5 block h-11 w-full rounded-lg border border-slate-200 bg-white p-1" /></label>
        </div>
        <div className="mt-3"><Toggle label="Show the saving" checked={showSave} onChange={setShowSave} hint="Adds a line such as Save 20% when the old price is higher than the price." /></div>
        {skippedCodes > 0 && <p role="alert" className="mt-2 text-xs text-rose-800">{skippedCodes} {skippedCodes === 1 ? 'code cannot' : 'codes cannot'} be drawn as a barcode (letters, digits and simple symbols only, up to 40 characters). Those tags print without a code.</p>}
        {items.length > 0 && tags.length >= MAX_TAGS && <p role="status" className="mt-2 text-xs text-amber-800">Limited to {MAX_TAGS} tags in one go. Print this set, then make the next one.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={tags.length === 0} onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF ({tags.length} {tags.length === 1 ? 'tag' : 'tags'}, {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'})</button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">In the print window choose A4, scale 100% (not "Fit to page") and turn off "Headers and footers". Cut along the light borders.</p>
        <h3 className="mt-5 text-sm font-semibold text-slate-900">Preview{sheets.length > PREVIEW_SHEETS ? ` (first ${PREVIEW_SHEETS} of ${sheets.length} sheets)` : ''}</h3>
      </div>

      <div id="tag-print" className="mt-2 space-y-4 print:mt-0 print:space-y-0">
        {sheets.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 print:hidden">Paste your products to see the tags.</p>}
        {sheets.map((sheet, sheetIndex) => (
          <div key={sheetIndex} className={`tag-sheet mx-auto w-full max-w-[210mm] border border-slate-200 bg-white ${sheetIndex >= PREVIEW_SHEETS ? 'hidden print:block' : ''}`} style={{ aspectRatio: '210 / 297', containerType: 'inline-size', padding: '3.81%' }}>
            <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${size.columns}, 1fr)`, gridTemplateRows: `repeat(${size.rows}, 1fr)` }}>
              {sheet.map((item, index) => {
                const code = codeMarkup(item, codeKind, '#000000');
                const price = withPrefix(prefix, item.price);
                const old = withPrefix(prefix, item.oldPrice);
                const save = showSave ? savePercent(item.price, item.oldPrice) : 0;
                const fs = (value: number) => `${(value * scale).toFixed(2)}cqw`;
                return (
                  <div key={index} className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-dashed border-slate-300 bg-white text-slate-900">
                    {shop && <div className="truncate px-[4%] py-[1%] font-bold uppercase tracking-wide text-white" style={{ background: accent, fontSize: fs(0.8) }}>{shop}</div>}
                    <div className="flex min-h-0 flex-1 flex-col justify-between px-[5%] py-[3%]">
                      <p className="line-clamp-2 break-words font-semibold leading-tight" style={{ fontSize: fs(1.5) }}>{item.name}</p>
                      <div className="flex flex-wrap items-baseline gap-x-[6%]">
                        {price && <span className="font-extrabold leading-none" style={{ fontSize: fs(3), color: accent }}>{price}</span>}
                        {old && <span className="leading-none text-slate-500 line-through" style={{ fontSize: fs(1.3) }}>{old}</span>}
                        {save > 0 && <span className="font-bold leading-none text-emerald-700" style={{ fontSize: fs(1.1) }}>Save {save}%</span>}
                      </div>
                      {code && (
                        <div className="flex items-end justify-between gap-1">
                          <div className={codeKind === 'qr' ? 'aspect-square' : 'w-full'} style={codeKind === 'qr' ? { height: fs(4.2), maxHeight: '45%' } : { height: fs(3) }} dangerouslySetInnerHTML={{ __html: code.replace('<svg ', '<svg style="width:100%;height:100%" ') }} />
                          {codeKind === 'qr' ? <span className="break-all text-right leading-tight text-slate-500" style={{ fontSize: fs(0.8) }}>{item.code}</span> : null}
                        </div>
                      )}
                      {code && codeKind === 'barcode' && <p className="text-center leading-none tracking-wider text-slate-600" style={{ fontSize: fs(0.8) }}>{item.code}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="print:hidden">
        <Note>Check one printed barcode with a scanner or a phone app before you print a full sheet. Barcodes here are Code 128, which most shop scanners read. They are not the official EAN or UPC numbers that packaged goods carry.</Note>
        <CalcFooter />
      </div>
    </section>
  );
};

export default PriceTagMaker;
