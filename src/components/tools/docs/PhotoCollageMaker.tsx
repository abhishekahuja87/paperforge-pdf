import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, ImagePlus, Trash2 } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Slider, card, heading } from '../paper/controls';
import { canvasToBlob, coverRect, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';

const CANVASES = [
  { id: 'square', label: 'Square post', w: 1080, h: 1080 },
  { id: 'story', label: 'Story (9:16)', w: 1080, h: 1920 },
  { id: 'a4p', label: 'A4 portrait', w: 1654, h: 2339 },
  { id: 'a4l', label: 'A4 landscape', w: 2339, h: 1654 },
];
const MAX = 9;
type Cell = { x: number; y: number; w: number; h: number };

/** Cells as fractions of the canvas. "grid" is rows by columns; "feature" gives the first picture half the space. */
function cells(n: number, layout: 'grid' | 'feature', ratio: number): Cell[] {
  if (layout === 'feature' && n >= 3) {
    const rest = n - 1;
    const out: Cell[] = [{ x: 0, y: 0, w: 0.6, h: 1 }];
    for (let i = 0; i < rest; i += 1) out.push({ x: 0.6, y: i / rest, w: 0.4, h: 1 / rest });
    return out;
  }
  const cols = Math.max(1, Math.round(Math.sqrt(n * ratio)));
  const rows = Math.ceil(n / cols);
  const out: Cell[] = [];
  for (let i = 0; i < n; i += 1) {
    const r = Math.floor(i / cols); const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
    out.push({ x: (i - r * cols) / inRow, y: r / rows, w: 1 / inRow, h: 1 / rows });
  }
  return out;
}

/** Join two to nine photos into one picture for a post, a story or a print. */
export const PhotoCollageMaker: React.FC = () => {
  const [photos, setPhotos] = useState<ImageBitmap[]>([]);
  const [canvasId, setCanvasId] = useState('square');
  const [layout, setLayout] = useState<'grid' | 'feature'>('grid');
  const [gap, setGap] = useState(12);
  const [round, setRound] = useState(0);
  const [bg, setBg] = useState('#ffffff');
  const [message, setMessage] = useState('');
  const view = useRef<HTMLCanvasElement>(null);
  const size = CANVASES.find((c) => c.id === canvasId) ?? CANVASES[0]!;

  const draw = (): HTMLCanvasElement => {
    const out = makeCanvas(size.w, size.h);
    const ctx = out.getContext('2d');
    if (!ctx) return out;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, out.width, out.height);
    const g = gap;
    cells(photos.length, layout, size.w / size.h).forEach((cell, i) => {
      const bmp = photos[i]; if (!bmp) return;
      const x = cell.x * size.w + g / 2 + (cell.x === 0 ? g / 2 : 0); const y = cell.y * size.h + g / 2 + (cell.y === 0 ? g / 2 : 0);
      const w = cell.w * size.w - g - (cell.x === 0 ? g / 2 : 0) - (cell.x + cell.w >= 0.999 ? g / 2 : 0);
      const h = cell.h * size.h - g - (cell.y === 0 ? g / 2 : 0) - (cell.y + cell.h >= 0.999 ? g / 2 : 0);
      const r = coverRect(bmp.width, bmp.height, w, h);
      ctx.save(); ctx.beginPath();
      if (round > 0) ctx.roundRect(x, y, w, h, round); else ctx.rect(x, y, w, h);
      ctx.clip(); ctx.drawImage(bmp, r.sx, r.sy, r.sw, r.sh, x, y, w, h); ctx.restore();
    });
    return out;
  };

  useEffect(() => {
    const el = view.current; if (!el || photos.length === 0) return;
    const full = draw(); const scale = Math.min(1, 640 / full.width);
    el.width = Math.round(full.width * scale); el.height = Math.round(full.height * scale);
    el.getContext('2d')?.drawImage(full, 0, 0, el.width, el.height);
  }, [photos, canvasId, layout, gap, round, bg]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (i: number, by: number) => setPhotos((all) => { const next = [...all]; const [m] = next.splice(i, 1); next.splice(i + by, 0, m!); return next; });

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Add photos ({photos.length} of {MAX})</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />Choose photos
          <input type="file" accept="image/*" multiple className="sr-only" onChange={async (event) => {
            const files = Array.from(event.target.files ?? []); event.target.value = '';
            const added: ImageBitmap[] = [];
            for (const file of files.slice(0, MAX - photos.length)) { try { added.push(await loadBitmap(file)); } catch { setMessage('One file could not be read as a picture.'); } }
            if (files.length > MAX - photos.length) setMessage(`Up to ${MAX} photos.`);
            if (added.length) setPhotos((all) => [...all, ...added]);
          }} />
        </label>
        {photos.length > 0 && (
          <ul className="space-y-1">
            {photos.map((_, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                <span>Photo {i + 1}</span>
                <span className="flex gap-1">
                  <button type="button" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded border border-slate-200 p-1 disabled:opacity-40"><ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  <button type="button" aria-label={`Move photo ${i + 1} later`} disabled={i === photos.length - 1} onClick={() => move(i, 1)} className="rounded border border-slate-200 p-1 disabled:opacity-40"><ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos((all) => all.filter((__, k) => k !== i))} className="rounded border border-red-200 p-1 text-red-800"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {photos.length >= 2 && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. Look</h2>
          <ChoiceButtons label="Size" value={canvasId} onChange={setCanvasId} options={CANVASES.map((c) => ({ value: c.id, label: c.label }))} />
          <ChoiceButtons label="Layout" value={layout} onChange={(v) => setLayout(v as 'grid' | 'feature')} options={[{ value: 'grid', label: 'Even grid' }, { value: 'feature', label: 'One big photo (3 or more)' }]} />
          <Slider label="Space between photos" value={gap} min={0} max={60} step={2} unit="px" onChange={setGap} />
          <Slider label="Rounded corners" value={round} min={0} max={80} step={4} unit="px" onChange={setRound} />
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">Background<input type="color" value={bg} onChange={(event) => setBg(event.target.value)} className="h-9 w-14 rounded border border-slate-300" /></label>
          <canvas ref={view} className="mx-auto block h-auto max-h-[65vh] w-auto max-w-full rounded border border-slate-300" aria-label="Collage preview" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={async () => saveBlob(await canvasToBlob(draw(), 'image/jpeg', 0.92), generateFileName('collage', 'jpg'))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download JPG</button>
            <button type="button" onClick={async () => saveBlob(await canvasToBlob(draw(), 'image/png'), generateFileName('collage', 'png'))} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">Download PNG</button>
          </div>
        </div>
      )}
      {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
      <Note>Photos are joined in your browser and never uploaded. Photos are cropped to fill their space; the centre of each photo is kept.</Note>
    </section>
  );
};

export default PhotoCollageMaker;
