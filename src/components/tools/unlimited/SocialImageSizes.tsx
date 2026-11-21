import React, { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Slider, card, heading } from '../paper/controls';
import { canvasToBlob, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { SIZE_PRESETS } from '../../../lib/unlimited/sizes';

type Fit = 'fill' | 'fit';
const tick = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0));

/** Draws the picture into a box of the wanted shape: fill crops to cover it, fit keeps the whole picture on a colour. */
function paint(bitmap: ImageBitmap, width: number, height: number, fit: Fit, background: string, focusX: number, focusY: number): HTMLCanvasElement {
  const surface = makeCanvas(width, height);
  const ctx = surface.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  const scale = fit === 'fill' ? Math.max(width / bitmap.width, height / bitmap.height) : Math.min(width / bitmap.width, height / bitmap.height);
  const w = bitmap.width * scale; const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (width - w) * (fit === 'fill' ? focusX : 0.5), (height - h) * (fit === 'fill' ? focusY : 0.5), w, h);
  return surface;
}

/** Turn one picture into many sizes at once (post, story, thumbnail, banner, profile or your own), as a ZIP. No limit; done in your browser. */
export const SocialImageSizes: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [chosen, setChosen] = useState<string[]>(['square', 'portrait', 'story', 'thumbnail']);
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [fit, setFit] = useState<Fit>('fill');
  const [background, setBackground] = useState('#ffffff');
  const [focusX, setFocusX] = useState(0.5);
  const [focusY, setFocusY] = useState(0.5);
  const [format, setFormat] = useState<'jpg' | 'png'>('jpg');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const previews = useRef<Record<string, HTMLCanvasElement | null>>({});

  const open = async (picked: File | undefined) => {
    if (!picked) return;
    setMessage('');
    try { const next = await loadBitmap(picked); setBitmap((old) => { old?.close(); return next; }); setFile(picked); }
    catch { setMessage('Could not read that picture. Choose a JPG, PNG or WebP file.'); }
  };

  const customW0 = Math.floor(Number(customW)) || 0; const customH0 = Math.floor(Number(customH)) || 0;
  const targets = [
    ...SIZE_PRESETS.filter((preset) => chosen.includes(preset.id)).map((preset) => ({ id: preset.id, label: preset.label, width: preset.width, height: preset.height })),
    ...(customW0 > 0 && customH0 > 0 ? [{ id: 'custom', label: 'Your size', width: customW0, height: customH0 }] : []),
  ];

  useEffect(() => {
    if (!bitmap) return;
    for (const target of targets) {
      const el = previews.current[target.id];
      if (!el) continue;
      const scale = Math.min(1, 220 / Math.max(target.width, target.height));
      const small = paint(bitmap, Math.max(1, Math.round(target.width * scale)), Math.max(1, Math.round(target.height * scale)), fit, background, focusX, focusY);
      el.width = small.width; el.height = small.height;
      el.getContext('2d')?.drawImage(small, 0, 0);
    }
  });

  const run = async () => {
    if (!bitmap || !file || targets.length === 0) return;
    setBusy(true); setMessage('');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const base = file.name.replace(/\.[^.]+$/, '') || 'picture';
      for (const target of targets) {
        const surface = paint(bitmap, target.width, target.height, fit, background, focusX, focusY);
        const blob = await canvasToBlob(surface, format === 'png' ? 'image/png' : 'image/jpeg', 0.92);
        zip.file(`${base}-${target.id}-${target.width}x${target.height}.${format}`, blob);
        await tick();
      }
      saveBlob(await zip.generateAsync({ type: 'blob' }), `${base}-sizes.zip`);
      setMessage(`Saved a ZIP with ${targets.length} size${targets.length === 1 ? '' : 's'}.`);
    } catch { setMessage('Could not make all the sizes. Try fewer sizes, or a smaller picture.'); }
    finally { setBusy(false); }
  };

  const toggle = (id: string) => setChosen((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Choose a picture</h2>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />{file ? 'Choose another picture' : 'Choose a picture'}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => { void open(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        {file && bitmap && <p className="text-xs text-slate-600">{file.name} · {bitmap.width} × {bitmap.height} px</p>}
        <p className="text-[11px] text-slate-500">Tick the sizes you need and download them together.</p>
      </div>

      {bitmap && (
        <>
          <div className={`${card} space-y-3`}>
            <h2 className={heading}>2. Choose the sizes</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {SIZE_PRESETS.map((preset) => (
                <label key={preset.id} className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800">
                  <input type="checkbox" checked={chosen.includes(preset.id)} onChange={() => toggle(preset.id)} className="mt-0.5 h-4 w-4 accent-orange-700" />
                  <span><span className="font-semibold">{preset.label}</span><span className="block text-[11px] text-slate-500">{preset.width} × {preset.height} px</span></span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-slate-700">Your own width (px)<input type="number" min={1} value={customW} onChange={(event) => setCustomW(event.target.value)} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Your own height (px)<input type="number" min={1} value={customH} onChange={(event) => setCustomH(event.target.value)} className={fieldClass} /></label>
            </div>
            <p className="text-[11px] text-slate-500">These are sizes people commonly ask for. Sites change them from time to time, so check the size shown on the site you are posting to.</p>
          </div>

          <div className={`${card} space-y-3`}>
            <h2 className={heading}>3. How the picture fits</h2>
            <ChoiceButtons label="Fit" value={fit} onChange={(value) => setFit(value as Fit)} options={[{ value: 'fill', label: 'Fill (crop the edges)' }, { value: 'fit', label: 'Fit (keep everything)' }]} />
            {fit === 'fill' ? (
              <>
                <Slider label="Move the crop left or right" value={Math.round(focusX * 100)} min={0} max={100} step={1} unit="%" onChange={(value) => setFocusX(value / 100)} />
                <Slider label="Move the crop up or down" value={Math.round(focusY * 100)} min={0} max={100} step={1} unit="%" onChange={(value) => setFocusY(value / 100)} />
              </>
            ) : (
              <label className="text-xs font-semibold text-slate-700">Background colour<input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="ml-2 h-9 w-14 align-middle" /></label>
            )}
            <ChoiceButtons label="Save as" value={format} onChange={(value) => setFormat(value as 'jpg' | 'png')} options={[{ value: 'jpg', label: 'JPG (smaller)' }, { value: 'png', label: 'PNG (sharper)' }]} />
            {targets.length > 0 && (
              <div className="flex flex-wrap items-end gap-3">
                {targets.map((target) => (
                  <figure key={target.id} className="space-y-1 text-center">
                    <canvas ref={(el) => { previews.current[target.id] = el; }} className="mx-auto max-h-40 max-w-[10rem] rounded border border-slate-200" />
                    <figcaption className="text-[10px] text-slate-600">{target.width} × {target.height}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            <button type="button" disabled={busy || targets.length === 0} onClick={() => void run()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Working…' : `Download ${targets.length || ''} size${targets.length === 1 ? '' : 's'} (ZIP)`}</button>
          </div>
        </>
      )}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default SocialImageSizes;
