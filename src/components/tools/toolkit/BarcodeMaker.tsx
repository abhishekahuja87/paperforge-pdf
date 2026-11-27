import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Slider, Toggle, card, heading } from '../../common/PanelKit';
import { drawBarcode, encodeCode128, encodeEan13, type Barcode } from '../../../lib/toolkit/barcode';
import { canvasToBlob, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';

type Kind = 'code128' | 'ean13';
const SHEETS: Record<string, { cols: number; rows: number; label: string }> = {
  '24': { cols: 3, rows: 8, label: '24 labels (3 x 8)' },
  '21': { cols: 3, rows: 7, label: '21 labels (3 x 7)' },
  '12': { cols: 2, rows: 6, label: '12 big labels (2 x 6)' },
};

/** Barcodes for shelves, bags and files: Code 128 for any text, EAN-13 for retail numbers. PNG or a sheet of labels to print. */
export const BarcodeMaker: React.FC = () => {
  const [kind, setKind] = useState<Kind>('code128');
  const [value, setValue] = useState('');
  const [title, setTitle] = useState('');
  const [showText, setShowText] = useState(true);
  const [height, setHeight] = useState(90);
  const [sheet, setSheet] = useState('24');
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  const built = useMemo<{ code: Barcode | null; error: string }>(() => {
    if (!value.trim()) return { code: null, error: '' };
    try { return { code: kind === 'ean13' ? encodeEan13(value) : encodeCode128(value.trim()), error: '' }; } catch (e) { return { code: null, error: e instanceof Error ? e.message : 'Check the value.' }; }
  }, [kind, value]);

  useEffect(() => {
    const el = canvas.current;
    if (el && built.code) drawBarcode(el, built.code, 3, height, showText);
  }, [built.code, height, showText]);

  const png = async (module: number) => {
    const el = makeCanvas(10, 10);
    drawBarcode(el, built.code!, module, height * (module / 3), showText);
    return canvasToBlob(el, 'image/png');
  };

  const downloadPng = async () => { if (built.code) saveBlob(await png(4), generateFileName('barcode', 'png', { base: built.code.label })); };

  const downloadSheet = async () => {
    if (!built.code) return;
    setBusy(true);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const image = await doc.embedPng(new Uint8Array(await (await png(4)).arrayBuffer()));
      const layout = SHEETS[sheet]!;
      const pageW = 595.28; const pageH = 841.89; const margin = 28;
      const cellW = (pageW - margin * 2) / layout.cols;
      const cellH = (pageH - margin * 2) / layout.rows;
      const page = doc.addPage([pageW, pageH]);
      const titleText = title.trim().slice(0, 40);
      for (let r = 0; r < layout.rows; r += 1) {
        for (let c = 0; c < layout.cols; c += 1) {
          const x = margin + c * cellW; const y = pageH - margin - (r + 1) * cellH;
          page.drawRectangle({ x: x + 2, y: y + 2, width: cellW - 4, height: cellH - 4, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.4 });
          const topSpace = titleText ? 12 : 0;
          const maxW = cellW - 14; const maxH = cellH - 12 - topSpace;
          const scale = Math.min(maxW / image.width, maxH / image.height);
          const w = image.width * scale; const h = image.height * scale;
          page.drawImage(image, { x: x + (cellW - w) / 2, y: y + (cellH - topSpace - h) / 2, width: w, height: h });
          if (titleText) {
            const size = Math.min(9, ((cellW - 10) / Math.max(1, font.widthOfTextAtSize(titleText, 1))));
            page.drawText(titleText, { x: x + (cellW - font.widthOfTextAtSize(titleText, size)) / 2, y: y + cellH - 14, size, font, color: rgb(0.1, 0.1, 0.1) });
          }
        }
      }
      saveBlob(new Blob([(await doc.save()) as BlobPart], { type: 'application/pdf' }), generateFileName('barcode-labels', 'pdf', { base: built.code.label }));
    } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. What to encode</h2>
        <ChoiceButtons label="Barcode type" value={kind} onChange={(v) => { setKind(v as Kind); setValue(''); }} options={[{ value: 'code128', label: 'Code 128 (any text)' }, { value: 'ean13', label: 'EAN-13 (retail number)' }]} />
        <label className="block text-xs font-semibold text-slate-700">{kind === 'ean13' ? 'Number (12 or 13 digits)' : 'Text or number'}
          <input value={value} onChange={(event) => setValue(kind === 'ean13' ? event.target.value.replace(/[^\d\s]/g, '') : event.target.value)} inputMode={kind === 'ean13' ? 'numeric' : 'text'} placeholder={kind === 'ean13' ? '400638133393' : 'SKU-1042'} className={fieldClass} />
        </label>
        {built.error && <p role="status" className="text-xs text-red-700">{built.error}</p>}
      </div>

      {built.code && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. Look and download</h2>
          <Slider label="Bar height" value={height} min={50} max={160} step={5} onChange={setHeight} />
          <Toggle label="Show the number under the bars" checked={showText} onChange={setShowText} />
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2"><canvas ref={canvas} className="mx-auto block h-auto max-w-full" aria-label={`Barcode for ${built.code.label}`} /></div>
          <button type="button" onClick={() => void downloadPng()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download PNG</button>
        </div>
      )}

      {built.code && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. A sheet of labels to print</h2>
          <label className="block text-xs font-semibold text-slate-700">Name or price on each label (optional)
            <input value={title} maxLength={40} onChange={(event) => setTitle(event.target.value)} placeholder="Basmati rice 1 kg" className={fieldClass} />
          </label>
          <ChoiceButtons label="Labels per A4 sheet" value={sheet} onChange={setSheet} options={Object.entries(SHEETS).map(([value, item]) => ({ value, label: item.label }))} />
          <button type="button" disabled={busy} onClick={() => void downloadSheet()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-700 bg-white px-4 py-2 text-sm font-bold text-orange-800 hover:bg-orange-50 disabled:opacity-50"><FileDown className="h-4 w-4" aria-hidden="true" />{busy ? 'Making...' : 'Download label sheet (PDF)'}</button>
          <p className="text-[11px] text-slate-500">Print at 100% (actual size) on plain paper or label sheets, then test one with a scanner before you print a full roll.</p>
        </div>
      )}
      <Note>EAN-13 numbers for products sold in shops are issued through GS1, so use EAN-13 for your own pretend or internal numbers only, and Code 128 for shelf, stock and file labels.</Note>
    </section>
  );
};

export default BarcodeMaker;
