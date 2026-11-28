import React, { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { CameraButton } from '../../common/CameraButton';
import { ChoiceButtons, fieldClass } from '../../common/FieldKit';
import { Slider, card, heading } from '../../common/PanelKit';
import { canvasToBlob, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { toFile } from '../../../lib/share/shareFile';
import { ShareFileButton, shareFileLargeClass } from '../../common/ShareFileButton';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';

const today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const STRIPS = { white: { bg: '#ffffff', fg: '#111111' }, yellow: { bg: '#fde047', fg: '#111111' }, black: { bg: '#111111', fg: '#ffffff' } } as const;

/** Draws the photo with a strip of text under it (or over it) at the given size. */
function compose(bitmap: ImageBitmap, width: number, lines: string[], tone: keyof typeof STRIPS, share: number, place: 'bottom' | 'top'): HTMLCanvasElement {
  const photoH = Math.round((bitmap.height * width) / bitmap.width);
  const stripH = Math.round(photoH * share);
  const canvas = makeCanvas(width, photoH + stripH);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot edit the picture.');
  const top = place === 'top' ? stripH : 0;
  ctx.drawImage(bitmap, 0, top, width, photoH);
  const stripY = place === 'top' ? 0 : photoH;
  ctx.fillStyle = STRIPS[tone].bg;
  ctx.fillRect(0, stripY, width, stripH);
  ctx.fillStyle = STRIPS[tone].fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rows = lines.filter(Boolean);
  if (rows.length) {
    let size = Math.max(6, Math.floor(stripH / (rows.length * 1.35)));
    const font = (s: number) => `bold ${s}px Arial, Helvetica, sans-serif`;
    ctx.font = font(size);
    const widest = Math.max(...rows.map((row) => ctx.measureText(row).width));
    if (widest > width * 0.94) { size = Math.max(5, Math.floor(size * ((width * 0.94) / widest))); ctx.font = font(size); }
    const lineH = stripH / rows.length;
    rows.forEach((row, i) => ctx.fillText(row, width / 2, stripY + lineH * (i + 0.5)));
  }
  return canvas;
}

/** Shrinks quality, then size, until a JPEG is under the limit. Returns null if even a small picture is too big. */
async function jpegUnder(canvas: HTMLCanvasElement, maxKb: number): Promise<Blob> {
  let current = canvas;
  for (let round = 0; round < 8; round += 1) {
    for (const quality of [0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35]) {
      const blob = await canvasToBlob(current, 'image/jpeg', quality);
      if (blob.size <= maxKb * 1024) return blob;
    }
    const next = makeCanvas(current.width * 0.85, current.height * 0.85);
    next.getContext('2d')?.drawImage(current, 0, 0, next.width, next.height);
    current = next;
  }
  return canvasToBlob(current, 'image/jpeg', 0.3);
}

/** Add a name and date strip to a photo, the way some exam and application forms ask, then save it as a JPG under a size limit. */
export const PhotoNameStrip: React.FC = () => {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(today());
  const [tone, setTone] = useState<keyof typeof STRIPS>('white');
  const [place, setPlace] = useState<'bottom' | 'top'>('bottom');
  const [share, setShare] = useState(18);
  const [width, setWidth] = useState('400');
  const [maxKb, setMaxKb] = useState('50');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const preview = useRef<HTMLCanvasElement>(null);

  const outWidth = Math.max(100, Math.min(3000, Math.floor(Number(width)) || 400));

  useEffect(() => {
    const el = preview.current;
    if (!el || !bitmap) return;
    const shown = compose(bitmap, Math.min(outWidth, 480), [name.trim(), date.trim()], tone, share / 100, place);
    el.width = shown.width; el.height = shown.height;
    el.getContext('2d')?.drawImage(shown, 0, 0);
  }, [bitmap, name, date, tone, share, place, outWidth]);

  const open = (file: File | undefined) => {
    if (!file) return;
    setMessage('');
    loadBitmap(file).then((b) => { setBitmap(b); setFileName(file.name); }).catch((e: unknown) => setMessage(e instanceof Error ? e.message : 'Could not open that photo.'));
  };

  /** Draws the photo with its name strip and returns the picture and its file name. Save and Share both use it. */
  const makePhoto = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!bitmap) return null;
    const canvas = compose(bitmap, outWidth, [name.trim(), date.trim()], tone, share / 100, place);
    const limit = Math.floor(Number(maxKb));
    const blob = limit >= 5 ? await jpegUnder(canvas, limit) : await canvasToBlob(canvas, 'image/jpeg', 0.92);
    return { blob, fileName: generateFileName('photo-with-name', 'jpg', { base: name || fileName }) };
  };

  const save = async () => {
    setBusy(true); setMessage('');
    try {
      const made = await makePhoto();
      if (!made) return;
      const blob = made.blob;
      saveBlob(blob, made.fileName);
      setMessage(`Saved ${formatBytes(blob.size)}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save the photo.');
    } finally { setBusy(false); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Your photo</h2>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />{bitmap ? 'Choose another photo' : 'Choose a photo'}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { open(event.target.files?.[0]); event.target.value = ''; }} />
          </label>
          <CameraButton onPhoto={open} />
        </div>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. Name and date</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">Name
            <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="ASHA VERMA" className={fieldClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Date (as the form asks)
            <input value={date} maxLength={20} onChange={(event) => setDate(event.target.value)} className={fieldClass} />
          </label>
        </div>
        <ChoiceButtons label="Strip colour" value={tone} onChange={(v) => setTone(v as keyof typeof STRIPS)} options={[{ value: 'white', label: 'White' }, { value: 'yellow', label: 'Yellow' }, { value: 'black', label: 'Black' }]} />
        <ChoiceButtons label="Strip position" value={place} onChange={(v) => setPlace(v as 'bottom' | 'top')} options={[{ value: 'bottom', label: 'Below the photo' }, { value: 'top', label: 'Above the photo' }]} />
        <Slider label="Strip height (share of the photo)" value={share} min={10} max={30} step={1} unit="%" onChange={setShare} />
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>3. Size and download</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate-700">Width in pixels
            <input type="number" inputMode="numeric" min={100} max={3000} value={width} onChange={(event) => setWidth(event.target.value)} className={fieldClass} />
          </label>
          <label className="text-xs font-semibold text-slate-700">Keep under (KB, blank for none)
            <input type="number" inputMode="numeric" min={5} value={maxKb} onChange={(event) => setMaxKb(event.target.value)} className={fieldClass} />
          </label>
        </div>
        {bitmap ? <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2"><canvas ref={preview} className="mx-auto block h-auto max-h-96 w-auto max-w-full" aria-label="Preview of the photo with the name strip" /></div> : <p className="text-xs text-slate-500">Choose a photo to see the preview.</p>}
        <button type="button" disabled={!bitmap || busy} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Saving...' : 'Download JPG'}</button>
        <ShareFileButton className={shareFileLargeClass} getFile={async () => { const made = await makePhoto(); return made ? toFile(made.blob, made.fileName) : null; }} />
        {message && <p role="status" className="text-xs text-slate-700">{message}</p>}
      </div>
      <Note>Forms differ on the strip size, colour, wording and date format, so follow your own form's instructions and check the result before you upload it.</Note>
    </section>
  );
};

export default PhotoNameStrip;
