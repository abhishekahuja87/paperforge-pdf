import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, ImagePlus, Trash2 } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { encodeGif } from '../../../lib/unlimited/gif';

const tick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

/** Make an animated GIF from several pictures: set the order, the time on each picture and the size. No limit on pictures; done in your browser. */
export const GifMaker: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [seconds, setSeconds] = useState(1);
  const [width, setWidth] = useState('480');
  const [forever, setForever] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; blob: Blob; w: number; h: number; frames: number } | null>(null);
  const urlRef = useRef('');
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const move = (index: number, by: number) => setFiles((list) => { const next = [...list]; const to = index + by; if (to < 0 || to >= next.length) return list; [next[index], next[to]] = [next[to]!, next[index]!]; return next; });

  const make = async () => {
    if (files.length === 0) return;
    setBusy(true); setMessage('');
    try {
      const first = await loadBitmap(files[0]!);
      const targetW = Math.max(16, Math.min(2000, Math.floor(Number(width)) || 480));
      const targetH = Math.max(16, Math.round((first.height / first.width) * targetW));
      first.close();
      const frames: { rgba: Uint8ClampedArray; delayMs: number }[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`Reading picture ${index + 1} of ${files.length}…`);
        const bitmap = await loadBitmap(file);
        const surface = makeCanvas(targetW, targetH);
        const ctx = surface.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('canvas');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, targetW, targetH);
        ctx.imageSmoothingQuality = 'high';
        const scale = Math.min(targetW / bitmap.width, targetH / bitmap.height);
        const w = bitmap.width * scale; const h = bitmap.height * scale;
        ctx.drawImage(bitmap, (targetW - w) / 2, (targetH - h) / 2, w, h);
        bitmap.close();
        frames.push({ rgba: ctx.getImageData(0, 0, targetW, targetH).data, delayMs: seconds * 1000 });
        await tick();
      }
      setProgress('Building the GIF…');
      await tick();
      const bytes = encodeGif(targetW, targetH, frames, forever ? 0 : 1);
      const blob = new Blob([bytes as BlobPart], { type: 'image/gif' });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      setResult({ url: urlRef.current, blob, w: targetW, h: targetH, frames: frames.length });
    } catch { setMessage('Could not make the GIF. Try a smaller width or fewer pictures, then try again.'); }
    finally { setBusy(false); setProgress(''); }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Add the pictures</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />Add pictures
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { setFiles((list) => [...list, ...Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))]); setResult(null); event.target.value = ''; }} />
        </label>
        {files.length > 0 && (
          <ol className="space-y-1">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <span className="min-w-0 flex-1 break-all">{index + 1}. {file.name}</span>
                <button type="button" onClick={() => { move(index, -1); setResult(null); }} disabled={index === 0} aria-label={`Move ${file.name} earlier`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => { move(index, 1); setResult(null); }} disabled={index === files.length - 1} aria-label={`Move ${file.name} later`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => { setFiles((list) => list.filter((_, i) => i !== index)); setResult(null); }} aria-label={`Remove ${file.name}`} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-red-700 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
        )}
        <p className="text-[11px] text-slate-500">Free, no sign-up, no limit on pictures. They stay on your device. The first picture sets the shape of the GIF.</p>
      </div>

      <div className={`${card} space-y-3`}>
        <h2 className={heading}>2. Timing and size</h2>
        <Slider label="Time on each picture" value={seconds} min={0.1} max={5} step={0.1} unit=" s" onChange={setSeconds} />
        <ChoiceButtons label="Width" value={width} onChange={setWidth} options={[{ value: '320', label: '320 px (small)' }, { value: '480', label: '480 px' }, { value: '640', label: '640 px' }, { value: '800', label: '800 px' }]} />
        <Toggle label="Play again and again" checked={forever} onChange={setForever} />
        <button type="button" disabled={busy || files.length === 0} onClick={() => void make()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50">{busy ? progress || 'Working…' : 'Make the GIF'}</button>
        <p className="text-[11px] text-slate-500">A GIF can only show 256 colours, so photos look a little flatter than the originals. Plain graphics and screenshots look best.</p>
      </div>

      {result && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>3. Your GIF</h2>
          <img src={result.url} alt="The animated GIF you made" width={result.w} height={result.h} className="mx-auto h-auto max-w-full rounded-lg border border-slate-200" />
          <p className="text-xs text-slate-600">{result.frames} picture{result.frames === 1 ? '' : 's'}, {result.w} × {result.h} px, {Math.max(1, Math.round(result.blob.size / 1024))} KB</p>
          <button type="button" onClick={() => saveBlob(result.blob, 'animation.gif')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download GIF</button>
        </div>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default GifMaker;
