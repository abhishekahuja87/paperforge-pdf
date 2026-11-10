import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { CalcFooter, Note, SelectField, calcCard } from '../../finance/ui';
import { fieldClass } from '../utilities/common';
import { downloadBlob } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { encodeQr, type QrCode } from '../../../lib/qr/encoder';
import { contrastRatio } from '../../../lib/qr/payloads';
import { defaultStyle, qrPng, qrSvg, type QrStyle } from '../../../lib/qr/render';
import { MAX_BULK, fileNames, parseBulkLines } from '../../../lib/qr/bulk';

const SAMPLE = 'Table 1, https://example.com/menu?table=1\nTable 2, https://example.com/menu?table=2\nOffice Wi-Fi, WIFI:T:WPA;S:Office;P:password;;';
const PREVIEW_LIMIT = 24;

interface Built { label: string; content: string; qr: QrCode | null }

export const BulkQrGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');
  const [format, setFormat] = useState('png');
  const [size, setSize] = useState('1024');
  const [columns, setColumns] = useState('4');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const items = useMemo(() => parseBulkLines(text), [text]);
  const used = useMemo(() => items.slice(0, MAX_BULK), [items]);
  const style: QrStyle = { ...defaultStyle(), fg, bg };
  const built: Built[] = useMemo(() => used.map((item) => {
    try { return { ...item, qr: encodeQr(item.content, 'M') }; } catch { return { ...item, qr: null }; }
  }), [used]);
  const failed = built.filter((item) => item.qr === null).length;
  const good = built.filter((item): item is Built & { qr: QrCode } => item.qr !== null);
  const contrast = contrastRatio(fg, bg);

  const downloadZip = async () => {
    setBusy(true);
    setMessage('');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const names = fileNames(good);
      for (let i = 0; i < good.length; i += 1) {
        const item = good[i];
        if (format === 'svg') zip.file(`${names[i]}.svg`, qrSvg(item.qr, style));
        else zip.file(`${names[i]}.png`, await qrPng(item.qr, style, Number(size), null));
      }
      const list = good.map((item, i) => `${names[i]}.${format}\t${item.label}\t${item.content}`).join('\n');
      zip.file('list.txt', list);
      downloadBlob(await zip.generateAsync({ type: 'blob' }), generateFileName('qr-codes', 'zip'));
      setMessage(`Downloaded ${good.length} codes in qr-codes.zip.`);
    } catch {
      setMessage('Could not build the ZIP file. Try fewer codes or a smaller size.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={calcCard}>
      <style>{`@media print { body * { visibility: hidden !important; } #bulk-qr-print, #bulk-qr-print * { visibility: visible !important; } #bulk-qr-print { position: absolute; left: 0; top: 0; width: 100% !important; } @page { size: A4; margin: 10mm; } }`}</style>
      <div className="print:hidden">
        <label className="block text-xs font-semibold text-slate-700">
          One code per line: label, then what the code holds
          <textarea value={text} rows={8} onChange={(event) => setText(event.target.value)} placeholder={SAMPLE} className={`${fieldClass} font-mono text-xs`} />
        </label>
        <p className="mt-1 text-[11px] text-slate-500">Separate the label and the content with a comma or a tab (paste two columns from a spreadsheet). A line with only a link is fine. Up to {MAX_BULK} codes.</p>
        <button type="button" onClick={() => setText(SAMPLE)} className="mt-2 inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Fill with an example</button>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField label="File type" value={format} onChange={setFormat} options={[{ value: 'png', label: 'PNG pictures' }, { value: 'svg', label: 'SVG (sharp at any size)' }]} />
          <SelectField label="PNG size" value={size} onChange={setSize} options={[{ value: '512', label: '512 px' }, { value: '1024', label: '1024 px' }, { value: '2048', label: '2048 px' }]} />
          <SelectField label="Codes per row on the printed sheet" value={columns} onChange={setColumns} options={['3', '4', '5'].map((value) => ({ value, label: value }))} />
          <label className="block text-xs font-semibold text-slate-700">Code colour<input type="color" value={fg} onChange={(event) => setFg(event.target.value)} className="mt-1.5 block h-11 w-full rounded-lg border border-slate-200 bg-white p-1" /></label>
          <label className="block text-xs font-semibold text-slate-700">Background colour<input type="color" value={bg} onChange={(event) => setBg(event.target.value)} className="mt-1.5 block h-11 w-full rounded-lg border border-slate-200 bg-white p-1" /></label>
        </div>
        {contrast < 4 && <p role="alert" className="mt-2 text-xs text-rose-800">These colours are too close. Scanners need a dark code on a light background, so pick colours that contrast strongly.</p>}
        {items.length > MAX_BULK && <p role="alert" className="mt-2 text-xs text-rose-800">You pasted {items.length} lines. Only the first {MAX_BULK} are used.</p>}
        {failed > 0 && <p role="alert" className="mt-2 text-xs text-rose-800">{failed} {failed === 1 ? 'line is' : 'lines are'} too long for a QR code and will be skipped.</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy || good.length === 0} onClick={downloadZip} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Building ZIP...' : `Download ${good.length} codes (ZIP)`}</button>
          <button type="button" disabled={good.length === 0} onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Printer className="h-4 w-4" aria-hidden="true" />Print labelled sheet</button>
        </div>
        <p role="status" className="mt-2 text-xs text-emerald-800">{message}</p>
        <h3 className="mt-5 text-sm font-semibold text-slate-900">Preview{good.length > PREVIEW_LIMIT ? ` (first ${PREVIEW_LIMIT} of ${good.length})` : ''}</h3>
      </div>

      <div id="bulk-qr-print" className="mt-2 grid gap-3 print:mt-0 print:gap-[4mm]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {good.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 print:hidden">Paste your list to see the codes.</p>}
        {good.map((item, index) => (
          <figure key={index} className={`break-inside-avoid rounded-lg border border-slate-200 bg-white p-2 text-center ${index >= PREVIEW_LIMIT ? 'hidden print:block' : ''}`}>
            <div className="mx-auto w-full max-w-40" dangerouslySetInnerHTML={{ __html: qrSvg(item.qr, style) }} />
            <figcaption className="mt-1 break-words text-[11px] font-semibold leading-tight text-slate-900">{item.label || item.content.slice(0, 40)}</figcaption>
          </figure>
        ))}
      </div>
      <div className="print:hidden">
        <Note>Always scan a couple of codes with a phone before you print or share them all. Everything is made in your browser, and nothing you paste is uploaded.</Note>
        <CalcFooter />
      </div>
    </section>
  );
};

export default BulkQrGenerator;
