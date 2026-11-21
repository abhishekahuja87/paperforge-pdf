import React, { useState } from 'react';
import { Download, ImagePlus, Trash2 } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Slider, card, heading } from '../paper/controls';
import { canvasToBlob, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';

type Format = 'keep' | 'jpg' | 'png' | 'webp';
type Spot = 'bottom-right' | 'center' | 'tile';
const MIME: Record<Exclude<Format, 'keep'>, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const tick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));
const kb = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Resize, convert, compress and watermark any number of photos at once and download them as one ZIP. No limit on how many; done in your browser. */
export const BulkImageTools: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<Format>('keep');
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [quality, setQuality] = useState(85);
  const [mark, setMark] = useState('');
  const [spot, setSpot] = useState<Spot>('bottom-right');
  const [markSize, setMarkSize] = useState(5);
  const [prefix, setPrefix] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');

  const add = (list: FileList | File[]) => {
    const picked = Array.from(list).filter((file) => file.type.startsWith('image/'));
    if (picked.length < Array.from(list).length) setMessage('Some files were not pictures and were skipped.'); else setMessage('');
    setFiles((current) => [...current, ...picked]);
  };

  const run = async () => {
    if (files.length === 0) return;
    setBusy(true); setMessage('');
    const failed: string[] = [];
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const used = new Map<string, number>();
      let before = 0; let after = 0; let done = 0;
      const widthLimit = Math.floor(Number(maxWidth)) || 0; const heightLimit = Math.floor(Number(maxHeight)) || 0;
      for (const file of files) {
        setProgress(`Working on picture ${done + 1} of ${files.length}…`);
        try {
          const bitmap = await loadBitmap(file);
          let scale = 1;
          if (widthLimit > 0) scale = Math.min(scale, widthLimit / bitmap.width);
          if (heightLimit > 0) scale = Math.min(scale, heightLimit / bitmap.height);
          const surface = makeCanvas(bitmap.width * scale, bitmap.height * scale);
          const ctx = surface.getContext('2d');
          if (!ctx) throw new Error('canvas');
          const target = format === 'keep' ? (file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg') : MIME[format];
          if (target === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, surface.width, surface.height); }
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, surface.width, surface.height);
          bitmap.close();
          if (mark.trim()) drawMark(ctx, surface.width, surface.height, mark.trim(), spot, markSize);
          const blob = await canvasToBlob(surface, target, quality / 100);
          const ext = target === 'image/png' ? 'png' : target === 'image/webp' ? 'webp' : 'jpg';
          const base = `${prefix}${file.name.replace(/\.[^.]+$/, '') || 'image'}`;
          const key = `${base}.${ext}`.toLowerCase();
          const seen = used.get(key) ?? 0; used.set(key, seen + 1);
          zip.file(seen === 0 ? `${base}.${ext}` : `${base}-${seen + 1}.${ext}`, blob);
          before += file.size; after += blob.size;
        } catch { failed.push(file.name); }
        done += 1;
        if (done % 3 === 0) await tick();
      }
      if (done === failed.length) { setMessage('None of the pictures could be processed. Try JPG, PNG or WebP files.'); return; }
      setProgress('Making the ZIP…');
      saveBlob(await zip.generateAsync({ type: 'blob' }), 'processed-images.zip');
      setMessage(`Done: ${done - failed.length} picture${done - failed.length === 1 ? '' : 's'}, ${kb(before)} before and ${kb(after)} after.${failed.length ? ` Could not process: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '…' : ''}.` : ''}`);
    } catch { setMessage('Something went wrong. For a very large set, try a smaller batch, or close other tabs to free memory.'); }
    finally { setBusy(false); setProgress(''); }
  };

  const total = files.reduce((sum, file) => sum + file.size, 0);
  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Add your pictures</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />Choose pictures
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { if (event.target.files) add(event.target.files); event.target.value = ''; }} />
        </label>
        {files.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
            <span className="font-semibold">{files.length} picture{files.length === 1 ? '' : 's'}, {kb(total)}</span>
            <button type="button" onClick={() => setFiles([])} className="inline-flex min-h-9 items-center gap-1 font-semibold text-red-700"><Trash2 className="h-4 w-4" aria-hidden="true" />Clear all</button>
          </div>
        )}
        <p className="text-[11px] text-slate-500">Add as many pictures as you like.</p>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. What to do to all of them</h2>
        <ChoiceButtons label="Save as" value={format} onChange={(value) => setFormat(value as Format)} options={[{ value: 'keep', label: 'Keep each type' }, { value: 'jpg', label: 'JPG' }, { value: 'png', label: 'PNG' }, { value: 'webp', label: 'WebP' }]} />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">Largest width (px)<input type="number" min={1} value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)} placeholder="keep size" className={fieldClass} /></label>
          <label className="text-xs font-semibold text-slate-700">Largest height (px)<input type="number" min={1} value={maxHeight} onChange={(event) => setMaxHeight(event.target.value)} placeholder="keep size" className={fieldClass} /></label>
        </div>
        <Slider label="Quality (JPG and WebP)" value={quality} min={30} max={100} step={1} unit="%" onChange={setQuality} />
        <label className="block text-xs font-semibold text-slate-700">Watermark text (optional)<input value={mark} maxLength={60} onChange={(event) => setMark(event.target.value)} placeholder="© Your name" className={fieldClass} /></label>
        {mark.trim() && (
          <>
            <ChoiceButtons label="Watermark position" value={spot} onChange={(value) => setSpot(value as Spot)} options={[{ value: 'bottom-right', label: 'Bottom right' }, { value: 'center', label: 'Centre' }, { value: 'tile', label: 'Repeat across' }]} />
            <Slider label="Watermark size" value={markSize} min={2} max={14} step={1} unit="%" onChange={setMarkSize} />
          </>
        )}
        <label className="block text-xs font-semibold text-slate-700">Add to the start of each name (optional)<input value={prefix} maxLength={30} onChange={(event) => setPrefix(event.target.value)} placeholder="trip-" className={fieldClass} /></label>
        <button type="button" disabled={busy || files.length === 0} onClick={() => void run()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? progress || 'Working…' : `Process ${files.length || ''} and download ZIP`}</button>
      </div>
      {message && <Note>{message}</Note>}
    </section>
  );
};

function drawMark(ctx: CanvasRenderingContext2D, width: number, height: number, text: string, spot: Spot, percent: number) {
  const size = Math.max(10, Math.round((Math.min(width, height) * percent) / 100));
  ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = Math.max(1, size / 14);
  const put = (x: number, y: number) => { ctx.strokeText(text, x, y); ctx.fillText(text, x, y); };
  if (spot === 'tile') {
    const w = ctx.measureText(text).width + size * 2;
    ctx.save(); ctx.translate(width / 2, height / 2); ctx.rotate(-Math.PI / 8); ctx.translate(-width, -height);
    ctx.textAlign = 'left';
    for (let y = 0; y < height * 2.2; y += size * 3.2) for (let x = 0; x < width * 2.2; x += w) put(x, y);
    ctx.restore();
  } else if (spot === 'center') { ctx.textAlign = 'center'; put(width / 2, height / 2); }
  else { ctx.textAlign = 'right'; put(width - size * 0.6, height - size * 0.9); }
}

export default BulkImageTools;
