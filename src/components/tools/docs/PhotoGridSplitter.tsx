import React, { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { CameraButton } from '../../common/CameraButton';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Slider, card, heading } from '../paper/controls';
import { canvasToBlob, coverRect, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';

const TILE = 1080;

/** Cut one picture into a grid of posts, numbered in the order to post them. */
export const PhotoGridSplitter: React.FC = () => {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [shape, setShape] = useState<'square' | 'portrait' | 'free'>('square');
  const [zoom, setZoom] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const view = useRef<HTMLCanvasElement>(null);

  const tileH = shape === 'square' ? TILE : shape === 'portrait' ? Math.round(TILE * 1.25) : bitmap ? Math.round((TILE * cols * bitmap.height) / bitmap.width / rows) : TILE;
  const totalW = TILE * cols; const totalH = tileH * rows;

  const whole = (): HTMLCanvasElement | null => {
    if (!bitmap) return null;
    const out = makeCanvas(totalW, totalH);
    const r = coverRect(bitmap.width, bitmap.height, totalW, totalH, zoom, ox, oy);
    out.getContext('2d')?.drawImage(bitmap, r.sx, r.sy, r.sw, r.sh, 0, 0, totalW, totalH);
    return out;
  };

  useEffect(() => {
    const el = view.current; const full = whole();
    if (!el || !full) return;
    const scale = Math.min(1, 700 / full.width);
    el.width = Math.round(full.width * scale); el.height = Math.round(full.height * scale);
    const ctx = el.getContext('2d'); if (!ctx) return;
    ctx.drawImage(full, 0, 0, el.width, el.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
    for (let c = 1; c < cols; c += 1) { ctx.beginPath(); ctx.moveTo((el.width / cols) * c, 0); ctx.lineTo((el.width / cols) * c, el.height); ctx.stroke(); }
    for (let r = 1; r < rows; r += 1) { ctx.beginPath(); ctx.moveTo(0, (el.height / rows) * r); ctx.lineTo(el.width, (el.height / rows) * r); ctx.stroke(); }
    ctx.font = `bold ${Math.max(14, el.width / cols / 5)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
      const n = cols * rows - (r * cols + c);
      const x = (el.width / cols) * (c + 0.5); const y = (el.height / rows) * (r + 0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.arc(x, y, Math.max(14, el.width / cols / 7), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(String(n), x, y);
    }
  }, [bitmap, cols, rows, shape, zoom, ox, oy]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiles = async (): Promise<{ name: string; blob: Blob }[]> => {
    const full = whole(); if (!full) return [];
    const out: { name: string; blob: Blob }[] = [];
    for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
      const tile = makeCanvas(TILE, tileH);
      tile.getContext('2d')?.drawImage(full, c * TILE, r * tileH, TILE, tileH, 0, 0, TILE, tileH);
      const n = cols * rows - (r * cols + c);
      out.push({ name: `post-${String(n).padStart(2, '0')}.jpg`, blob: await canvasToBlob(tile, 'image/jpeg', 0.92) });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  };

  const zip = async () => {
    setBusy(true); setMessage('');
    try {
      const { default: JSZip } = await import('jszip');
      const z = new JSZip();
      (await tiles()).forEach((t) => z.file(t.name, t.blob));
      saveBlob(await z.generateAsync({ type: 'blob' }), generateFileName('photo-grid', 'zip'));
    } catch { setMessage('Could not make the zip. Try a smaller grid.'); } finally { setBusy(false); }
  };

  const openPicture = (file: File) => {
    loadBitmap(file).then((b) => { setBitmap(b); setZoom(1); setOx(0); setOy(0); setMessage(''); }).catch((e: unknown) => setMessage(e instanceof Error ? e.message : 'Could not open that picture.'));
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Your picture</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />{bitmap ? 'Choose another picture' : 'Choose a picture'}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0]; event.target.value = '';
            if (file) openPicture(file);
          }} />
        </label>
        <CameraButton onPhoto={openPicture} className="ml-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50" />
      </div>
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. Grid</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label="Columns" value={cols} min={1} max={5} step={1} unit="" onChange={setCols} />
          <Slider label="Rows" value={rows} min={1} max={5} step={1} unit="" onChange={setRows} />
        </div>
        <ChoiceButtons label="Each piece" value={shape} onChange={(v) => setShape(v as 'square' | 'portrait' | 'free')} options={[{ value: 'square', label: 'Square (1:1)' }, { value: 'portrait', label: 'Portrait (4:5)' }, { value: 'free', label: 'Keep the picture shape' }]} />
        {bitmap && (
          <>
            <Slider label="Zoom" value={zoom} min={1} max={3} step={0.05} unit="x" onChange={setZoom} />
            <Slider label="Move left or right" value={ox} min={-1} max={1} step={0.02} unit="" onChange={setOx} />
            <Slider label="Move up or down" value={oy} min={-1} max={1} step={0.02} unit="" onChange={setOy} />
            <canvas ref={view} className="mx-auto block h-auto max-h-[60vh] w-auto max-w-full rounded border border-slate-300" aria-label="Preview with the grid and post order" />
            <p className="text-[11px] text-slate-500">The numbers show the order to post: start with 1 and finish with the highest number. A profile shows the newest post first, so this builds the grid the right way round.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void zip()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Making zip...' : `Download ${cols * rows} pieces (zip)`}</button>
            </div>
          </>
        )}
      </div>
      {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      <Note>Each piece is {TILE} pixels wide. Phones that cannot open a zip can use the Files app to extract it.</Note>
    </section>
  );
};

export default PhotoGridSplitter;
