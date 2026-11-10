import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardPaste, Download, Undo2 } from 'lucide-react';
import { FileDropZone } from '../../common/FileDropZone';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { MAX_PIXELS, exportSize, paintRegions, rectFromPoints, redactedName, type RedactStyle, type Region } from '../../../lib/privacy/redact';

type Source = { bitmap: ImageBitmap | HTMLImageElement; width: number; height: number; name: string };

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch { /* fall through to an image element */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const small = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export const ScreenshotRedactor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [style, setStyle] = useState<RedactStyle>('solid');
  const [color, setColor] = useState('#000000');
  const [drawMode, setDrawMode] = useState(true);
  const [format, setFormat] = useState<'png' | 'jpg'>('png');
  const [longSide, setLongSide] = useState('0');
  const [message, setMessage] = useState('');
  const [drag, setDrag] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const nextId = useRef(1);

  const load = useCallback(async (blob: Blob, name: string) => {
    setMessage('');
    try {
      const bitmap = await decode(blob);
      const width = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width;
      const height = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
      if (width * height > MAX_PIXELS) { setMessage('That image is too large to edit safely in a browser tab. Shrink it first, for example with the Image Resizer.'); return; }
      setSource({ bitmap, width, height, name });
      setRegions([]);
    } catch {
      setMessage('That file could not be read as an image. Try a PNG, JPG or WebP file.');
    }
  }, []);

  // Paste anywhere on the page: Ctrl+V or Cmd+V with an image on the clipboard.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void load(file, 'pasted-screenshot');
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [load]);

  const pasteButton = async () => {
    setMessage('');
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) { await load(await item.getType(type), 'pasted-screenshot'); return; }
      }
      setMessage('No image found on the clipboard. Copy a screenshot first, or choose a file.');
    } catch {
      setMessage('This browser did not allow reading the clipboard. Press Ctrl+V (or paste from the menu) on this page, or choose a file.');
    }
  };

  // Repaint whenever the picture or its boxes change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paintRegions(ctx, source.bitmap, source.width, source.height, regions);
    if (drag) {
      const box = rectFromPoints(drag.x, drag.y, drag.cx, drag.cy, source.width, source.height);
      if (box) {
        const line = Math.max(2, source.width / 400);
        ctx.save();
        ctx.lineWidth = line;
        ctx.setLineDash([line * 3, line * 2]);
        ctx.strokeStyle = '#ea580c';
        ctx.fillStyle = 'rgba(234,88,12,0.18)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.restore();
      }
    }
  }, [source, regions, drag]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * (source?.width ?? 1), y: ((event.clientY - rect.top) / rect.height) * (source?.height ?? 1) };
  };
  const onDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawMode || !source) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    setDrag({ x: p.x, y: p.y, cx: p.x, cy: p.y });
  };
  const onMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const p = point(event);
    setDrag({ ...drag, cx: p.x, cy: p.y });
  };
  const onUp = () => {
    if (!drag || !source) return;
    const box = rectFromPoints(drag.x, drag.y, drag.cx, drag.cy, source.width, source.height);
    setDrag(null);
    if (box) setRegions((current) => [...current, { id: nextId.current++, ...box, style, color }]);
  };

  const toBlob = (): Promise<Blob | null> => new Promise((resolve) => {
    const canvas = canvasRef.current;
    if (!canvas || !source) { resolve(null); return; }
    // Draw a clean copy without the dashed drag outline, at the chosen size. Re-drawing also drops all metadata.
    const out = document.createElement('canvas');
    const size = exportSize(source.width, source.height, Number(longSide));
    out.width = size.w;
    out.height = size.h;
    const ctx = out.getContext('2d');
    if (!ctx) { resolve(null); return; }
    const flat = document.createElement('canvas');
    flat.width = source.width;
    flat.height = source.height;
    const fctx = flat.getContext('2d');
    if (!fctx) { resolve(null); return; }
    paintRegions(fctx, source.bitmap, source.width, source.height, regions);
    if (format === 'jpg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size.w, size.h); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(flat, 0, 0, size.w, size.h);
    out.toBlob(resolve, format === 'png' ? 'image/png' : 'image/jpeg', 0.92);
  });

  const download = async () => {
    const blob = await toBlob();
    if (!blob || !source) { setMessage('Could not create the image.'); return; }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = redactedName(source.name, format);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    setMessage('');
  };
  const copy = async () => {
    try {
      if (format !== 'png') throw new Error('copy needs png');
      const blob = await toBlob();
      if (!blob) throw new Error('no image');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setMessage('Copied. You can paste the redacted image straight into a chat or email.');
    } catch {
      setMessage(format === 'png' ? 'Copying an image is blocked here. Use Download instead.' : 'Copying works with PNG. Choose PNG, or use Download.');
    }
  };

  const undo = () => setRegions((current) => current.slice(0, -1));

  if (!source) {
    return (
      <div className="space-y-4">
        <div className={card}>
          <h2 className={heading}>Add a screenshot or photo</h2>
          <div className="mt-3">
            <FileDropZone accept="image/*" onFiles={(files) => void load(files[0]!, files[0]!.name)} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void pasteButton()} className={small}><ClipboardPaste className="h-4 w-4" aria-hidden="true" />Paste from clipboard</button>
            <span className="text-xs text-slate-500">or press Ctrl+V (Cmd+V on Mac) anywhere on this page.</span>
          </div>
        </div>
        {message && <Note>{message}</Note>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className={heading}>Draw over what to hide</h2>
        <p className="mt-1 text-xs text-slate-600">Drag on the picture to add a box. Each box permanently replaces the pixels under it when you save.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Style of new boxes</p>
            <ChoiceButtons label="Redaction style" value={style} onChange={(v) => setStyle(v as RedactStyle)} options={[{ value: 'solid', label: 'Solid box (safest)' }, { value: 'pixelate', label: 'Pixelate' }]} />
          </div>
          {style === 'solid' && (
            <label className="block text-xs font-semibold text-slate-700">Box colour
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={`${fieldClass} h-10 p-1`} />
            </label>
          )}
        </div>
        <div className="mt-3"><Toggle label="Draw mode" checked={drawMode} onChange={setDrawMode} hint="Turn off to scroll or zoom the page with your finger instead of drawing." /></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-2">
        <canvas
          ref={canvasRef}
          aria-label="Image being redacted. Drag to add a box."
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setDrag(null)}
          style={{ touchAction: drawMode ? 'none' : 'auto', cursor: drawMode ? 'crosshair' : 'default', maxHeight: '75vh' }}
          className="mx-auto block h-auto max-w-full rounded bg-white object-contain"
        />
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={undo} disabled={regions.length === 0} className={small}><Undo2 className="h-4 w-4" aria-hidden="true" />Undo last box</button>
          <button type="button" onClick={() => setRegions([])} disabled={regions.length === 0} className={small}>Remove all boxes</button>
          <button type="button" onClick={() => { setSource(null); setRegions([]); setMessage(''); }} className={small}>Use a different image</button>
          <span className="text-xs text-slate-500">{regions.length} box{regions.length === 1 ? '' : 'es'}</span>
        </div>
        {regions.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {regions.map((r, i) => (
              <li key={r.id}>
                <button type="button" onClick={() => setRegions((current) => current.filter((x) => x.id !== r.id))} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-red-50" aria-label={`Remove box ${i + 1}`}>
                  {i + 1}. {r.style === 'solid' ? 'Solid' : 'Pixelate'} ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card}>
        <h2 className={heading}>Save the result</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">File type</p>
            <ChoiceButtons label="Output file type" value={format} onChange={(v) => setFormat(v as 'png' | 'jpg')} options={[{ value: 'png', label: 'PNG (sharp text)' }, { value: 'jpg', label: 'JPG (smaller)' }]} />
          </div>
          <label className="block text-xs font-semibold text-slate-700">Size
            <select value={longSide} onChange={(e) => setLongSide(e.target.value)} className={fieldClass}>
              <option value="0">Original size ({source.width} × {source.height})</option>
              <option value="2048">Longest side 2048 px</option>
              <option value="1280">Longest side 1280 px</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void download()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange-700 px-4 py-2 text-xs font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download</button>
          <button type="button" onClick={() => void copy()} className={small}>Copy image</button>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">The saved file is drawn fresh from the pixels, so camera, location and device details stored in the original are not carried over. A solid box is the safest choice for passwords, card numbers and codes; pixelation here uses very large blocks, and a light blur is deliberately not offered because it can be partly reversed.</p>
      </div>
      {message && <Note>{message}</Note>}
    </div>
  );
};

export default ScreenshotRedactor;
