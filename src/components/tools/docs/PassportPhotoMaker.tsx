import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { CameraButton } from '../../common/CameraButton';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Slider, Toggle, card, heading } from '../../common/PanelKit';
import { canvasToBlob, coverRect, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';
import { pdfBlob } from '../../../lib/pdf/toBlob';
import { toFile } from '../../../lib/share/shareFile';
import { ShareFileButton, shareFileLargeClass } from '../../common/ShareFileButton';

const DPI = 300;
const MM = DPI / 25.4;
const SIZES = [
  { id: '35x45', label: '35 × 45 mm', w: 35, h: 45 },
  { id: '2x2', label: '2 × 2 inch', w: 50.8, h: 50.8 },
  { id: '30x40', label: '30 × 40 mm', w: 30, h: 40 },
  { id: '25x35', label: '25 × 35 mm (stamp)', w: 25, h: 35 },
  { id: 'custom', label: 'My own size', w: 35, h: 45 },
];
const PAPERS = [
  { id: '4x6', label: '4 × 6 inch photo paper', w: 101.6, h: 152.4 },
  { id: '5x7', label: '5 × 7 inch photo paper', w: 127, h: 177.8 },
  { id: 'a4', label: 'A4 sheet', w: 210, h: 297 },
];

/** Crop one photo to a passport size and repeat it to fill a sheet you can print. */
export const PassportPhotoMaker: React.FC = () => {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [sizeId, setSizeId] = useState('35x45');
  const [custom, setCustom] = useState({ w: '35', h: '45' });
  const [paperId, setPaperId] = useState('4x6');
  const [zoom, setZoom] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [fill, setFill] = useState(true);
  const [copies, setCopies] = useState(6);
  const [cutLines, setCutLines] = useState(true);
  const [guide, setGuide] = useState(true);
  const [message, setMessage] = useState('');
  const frame = useRef<HTMLCanvasElement>(null);
  const sheetView = useRef<HTMLCanvasElement>(null);

  const base = SIZES.find((s) => s.id === sizeId) ?? SIZES[0]!;
  const w = sizeId === 'custom' ? Math.min(120, Math.max(15, Number(custom.w) || 35)) : base.w;
  const h = sizeId === 'custom' ? Math.min(150, Math.max(15, Number(custom.h) || 45)) : base.h;
  const paper = PAPERS.find((p) => p.id === paperId) ?? PAPERS[0]!;
  const gap = 2; const margin = 4;

  const layout = useMemo(() => {
    const fits = (pw: number, ph: number) => ({ pw, ph, cols: Math.max(0, Math.floor((pw - 2 * margin + gap) / (w + gap))), rows: Math.max(0, Math.floor((ph - 2 * margin + gap) / (h + gap))) });
    const a = fits(paper.w, paper.h); const b = fits(paper.h, paper.w);
    return a.cols * a.rows >= b.cols * b.rows ? a : b;
  }, [paper, w, h]);
  const capacity = layout.cols * layout.rows;
  const count = fill ? capacity : Math.min(capacity, copies);

  const photo = (): HTMLCanvasElement | null => {
    if (!bitmap) return null;
    const out = makeCanvas(w * MM, h * MM);
    const r = coverRect(bitmap.width, bitmap.height, out.width, out.height, zoom, ox, oy);
    out.getContext('2d')?.drawImage(bitmap, r.sx, r.sy, r.sw, r.sh, 0, 0, out.width, out.height);
    return out;
  };

  const sheet = (): HTMLCanvasElement | null => {
    const one = photo();
    if (!one || capacity === 0) return null;
    const out = makeCanvas(layout.pw * MM, layout.ph * MM);
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, out.width, out.height);
    const gridW = layout.cols * w + (layout.cols - 1) * gap; const gridH = layout.rows * h + (layout.rows - 1) * gap;
    const x0 = (layout.pw - gridW) / 2; const y0 = (layout.ph - gridH) / 2;
    for (let i = 0; i < count; i += 1) {
      const x = (x0 + (i % layout.cols) * (w + gap)) * MM; const y = (y0 + Math.floor(i / layout.cols) * (h + gap)) * MM;
      ctx.drawImage(one, x, y);
      if (cutLines) { ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2; ctx.strokeRect(x, y, one.width, one.height); }
    }
    return out;
  };

  useEffect(() => {
    const el = frame.current; const one = photo();
    if (el && one) { el.width = one.width / 2; el.height = one.height / 2; el.getContext('2d')?.drawImage(one, 0, 0, el.width, el.height); }
    const sv = sheetView.current; const full = sheet();
    if (sv && full) { sv.width = full.width / 3; sv.height = full.height / 3; sv.getContext('2d')?.drawImage(full, 0, 0, sv.width, sv.height); }
  }, [bitmap, w, h, zoom, ox, oy, paperId, count, cutLines, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const makePng = async (): Promise<Blob | null> => { const s = sheet(); return s ? canvasToBlob(s, 'image/png') : null; };
  const savePng = async () => { const blob = await makePng(); if (blob) saveBlob(blob, generateFileName('passport-photo-sheet', 'png')); };
  const makePdf = async (): Promise<Blob | null> => {
    const s = sheet(); if (!s) return null;
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const jpg = await doc.embedJpg(new Uint8Array(await (await canvasToBlob(s, 'image/jpeg', 0.95)).arrayBuffer()));
    const pg = doc.addPage([(layout.pw * 72) / 25.4, (layout.ph * 72) / 25.4]);
    pg.drawImage(jpg, { x: 0, y: 0, width: pg.getWidth(), height: pg.getHeight() });
    return pdfBlob(await doc.save());
  };
  const savePdf = async () => {
    try {
      const blob = await makePdf();
      if (blob) saveBlob(blob, generateFileName('passport-photo-sheet', 'pdf'));
    } catch { setMessage('Could not build the PDF.'); }
  };

  const openPhoto = (file: File) => {
    loadBitmap(file).then((b) => { setBitmap(b); setZoom(1); setOx(0); setOy(0); setMessage(''); }).catch((e: unknown) => setMessage(e instanceof Error ? e.message : 'Could not open that photo.'));
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Your photo</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />{bitmap ? 'Choose another photo' : 'Choose a photo'}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0]; event.target.value = '';
            if (file) openPhoto(file);
          }} />
        </label>
        <CameraButton onPhoto={openPhoto} className="ml-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" />
        <p className="text-[11px] text-slate-500">Use a plain, evenly lit background and a straight-on face. This tool crops and lays out; it does not change the background.</p>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. Size and crop</h2>
        <ChoiceButtons label="Photo size" value={sizeId} onChange={setSizeId} options={SIZES.map((s) => ({ value: s.id, label: s.label }))} />
        {sizeId === 'custom' && (
          <div className="flex gap-3">
            <label className="text-xs font-semibold text-slate-700">Width (mm)<input inputMode="decimal" value={custom.w} onChange={(e) => setCustom({ ...custom, w: e.target.value })} className={fieldClass} /></label>
            <label className="text-xs font-semibold text-slate-700">Height (mm)<input inputMode="decimal" value={custom.h} onChange={(e) => setCustom({ ...custom, h: e.target.value })} className={fieldClass} /></label>
          </div>
        )}
        <p className="text-[11px] text-slate-500">Check the exact size, background and face position your form or office asks for; rules differ.</p>
        {bitmap && (
          <>
            <div className="relative mx-auto w-48 overflow-hidden rounded-lg border border-slate-300">
              <canvas ref={frame} className="block h-auto w-full" aria-label="Cropped photo preview" />
              {guide && <div aria-hidden="true" className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 top-[12%] h-[62%] w-[52%] -translate-x-1/2 rounded-[50%] border-2 border-dashed border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" /></div>}
            </div>
            <Slider label="Zoom" value={zoom} min={1} max={3} step={0.05} unit="x" onChange={setZoom} />
            <Slider label="Move left or right" value={ox} min={-1} max={1} step={0.02} unit="" onChange={setOx} />
            <Slider label="Move up or down" value={oy} min={-1} max={1} step={0.02} unit="" onChange={setOy} />
            <Toggle label="Show the face guide" checked={guide} onChange={setGuide} hint="Only on this preview, never printed." />
          </>
        )}
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>3. Sheet</h2>
        <ChoiceButtons label="Paper" value={paperId} onChange={setPaperId} options={PAPERS.map((p) => ({ value: p.id, label: p.label }))} />
        <Toggle label="Fill the whole sheet" checked={fill} onChange={setFill} hint={`${capacity} photos fit on this paper.`} />
        {!fill && capacity > 0 && <Slider label="Copies" value={Math.min(copies, capacity)} min={1} max={capacity} step={1} unit="" onChange={setCopies} />}
        <Toggle label="Thin cut lines" checked={cutLines} onChange={setCutLines} />
        {capacity === 0 && <p role="status" className="text-xs text-red-700">That size does not fit this paper. Choose bigger paper or a smaller size.</p>}
        {bitmap && capacity > 0 && (
          <>
            <canvas ref={sheetView} className="mx-auto block h-auto max-h-[60vh] w-auto max-w-full rounded border border-slate-300 bg-white" aria-label="Sheet preview" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void savePdf()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download PDF</button>
              <ShareFileButton className={shareFileLargeClass} getFile={async () => { const blob = await makePdf(); return blob ? toFile(blob, generateFileName('passport-photo-sheet', 'pdf')) : null; }} />
              <button type="button" onClick={() => void savePng()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">Download picture (PNG)</button>
            </div>
            <p className="text-[11px] text-slate-500">Print at 100% (actual size), not "fit to page", or the photos will come out the wrong size.</p>
          </>
        )}
      </div>
      {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      <Note>Photos are laid out at 300 dpi.</Note>
    </section>
  );
};

export default PassportPhotoMaker;
