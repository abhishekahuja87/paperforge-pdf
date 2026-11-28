import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CameraButton } from '../../common/CameraButton';
import { Image as ImageIcon } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import ui from '../../../locales/packs/bgremove.ui.en.json';
import starters from '../../../locales/packs/bgremove.examples.en.json';
import { detectBackground, removeBackground, type Rgb } from '../../../lib/bgremove/remove';

const STORAGE_KEY = 'mdu_bg_remove_v1';
const MAX_SIDE = 1600;
type Fill = 'clear' | 'white' | 'black' | 'colour';
type StarterId = keyof typeof starters;
interface Saved { tolerance: number; edgesOnly: boolean; shrink: number; smooth: number; fill: Fill; colour: string }

const DEFAULTS: Saved = { tolerance: 28, edgesOnly: true, shrink: 1, smooth: 1, fill: 'clear', colour: '#f97316' };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const rgbHex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const CHECKER = { backgroundColor: '#ffffff', backgroundImage: 'linear-gradient(45deg,#d4d4d8 25%,transparent 25%),linear-gradient(-45deg,#d4d4d8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d4d4d8 75%),linear-gradient(-45deg,transparent 75%,#d4d4d8 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,0 8px,8px -8px,-8px 0' } as const;

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.tolerance === 'number') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A sample picture: a red mug on a plain light wall, made in the page so the tool can be tried without a photo. */
function samplePicture(): ImageData {
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480; const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ececf0'; ctx.fillRect(0, 0, 640, 480);
  ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.roundRect(210, 130, 200, 230, 28); ctx.fill();
  ctx.strokeStyle = '#c62828'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(425, 245, 50, -1.3, 1.3); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(310, 245, 52, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c62828'; ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Hi', 310, 248);
  return ctx.getImageData(0, 0, 640, 480);
}

/** Make a plain background transparent, or fill it with a colour, on your device. */
export const BackgroundRemover: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const { tolerance, edgesOnly, shrink, smooth, fill, colour } = saved;
  const [picture, setPicture] = useState<ImageData | null>(null);
  const [name, setName] = useState('picture');
  const [picked, setPicked] = useState<Rgb | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  const detected = useMemo(() => (picture ? detectBackground(picture) : null), [picture]);
  const background = picked ?? detected;
  const [cut, setCut] = useState<ImageData | null>(null);

  useEffect(() => {
    if (!picture) { setCut(null); return undefined; }
    const timer = setTimeout(() => setCut(removeBackground(picture, { tolerance, edgesOnly, shrink, smooth, background: picked })), 120);
    return () => clearTimeout(timer);
  }, [picture, tolerance, edgesOnly, shrink, smooth, picked]);

  const paint = (target: HTMLCanvasElement, image: ImageData, withFill: boolean) => {
    target.width = image.width; target.height = image.height; const ctx = target.getContext('2d')!; ctx.clearRect(0, 0, image.width, image.height);
    if (withFill && fill !== 'clear') { ctx.fillStyle = fill === 'white' ? '#ffffff' : fill === 'black' ? '#000000' : colour; ctx.fillRect(0, 0, image.width, image.height); }
    const layer = document.createElement('canvas'); layer.width = image.width; layer.height = image.height; layer.getContext('2d')!.putImageData(image, 0, 0); ctx.drawImage(layer, 0, 0);
  };
  useEffect(() => {
    const target = canvas.current; if (!target || !picture) return;
    if (showOriginal) { target.width = picture.width; target.height = picture.height; target.getContext('2d')!.putImageData(picture, 0, 0); } else if (cut) paint(target, cut, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picture, cut, showOriginal, fill, colour]);

  const reset = () => setResult(null);
  const change = (patch: Partial<Saved>) => { reset(); setSaved((current) => ({ ...current, ...patch })); };
  const applyStarter = (id: StarterId) => { const s = starters[id]; change({ tolerance: s.tolerance, edgesOnly: s.edgesOnly, shrink: s.shrink, smooth: s.smooth }); };
  const activeStarter = (Object.keys(starters) as StarterId[]).find((id) => { const s = starters[id]; return s.tolerance === tolerance && s.edgesOnly === edgesOnly && s.shrink === shrink && s.smooth === smooth; }) ?? '';

  const take = (image: ImageData, label: string) => { reset(); setPicked(null); setShowOriginal(false); setName(label); setPicture(image); };
  const addFile = async (file: File) => {
    setMessage('');
    try {
      const bitmap = await createImageBitmap(file); const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      const target = document.createElement('canvas'); target.width = Math.max(1, Math.round(bitmap.width * scale)); target.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = target.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(bitmap, 0, 0, target.width, target.height); bitmap.close();
      take(ctx.getImageData(0, 0, target.width, target.height), file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'picture');
    } catch { setMessage(ui.fileFailed); }
  };
  const useSample = () => { setMessage(''); take(samplePicture(), 'sample'); };

  const pickColour = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!picture) return; const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(picture.width - 1, Math.floor(((event.clientX - rect.left) / rect.width) * picture.width))), y = Math.max(0, Math.min(picture.height - 1, Math.floor(((event.clientY - rect.top) / rect.height) * picture.height)));
    const at = (y * picture.width + x) * 4; reset(); setShowOriginal(false); setPicked([picture.data[at]!, picture.data[at + 1]!, picture.data[at + 2]!]);
  };

  const makeFile = () => {
    if (!cut) return; const target = document.createElement('canvas'); paint(target, cut, true); const jpg = fill !== 'clear';
    target.toBlob((blob) => { if (blob) setResult({ url: URL.createObjectURL(blob), name: `${name}-no-background.${jpg ? 'jpg' : 'png'}`, size: blob.size }); else setMessage(ui.saveFailed); }, jpg ? 'image/jpeg' : 'image/png', 0.95);
  };
  const startAgain = () => { setSaved(DEFAULTS); setPicture(null); setCut(null); setPicked(null); setMessage(''); setShowOriginal(false); reset(); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => applyStarter(value as StarterId)} options={(Object.keys(starters) as StarterId[]).map((id) => ({ value: id, label: starters[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? starters[activeStarter as StarterId].hint : ui.startersHint}</p></div>
        <Note>{ui.honest}</Note>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.pick}</h2>
        <p className="text-[11px] text-slate-500">{ui.pickHint}</p>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800"><ImageIcon className="h-4 w-4" aria-hidden="true" />{picture ? ui.changePicture : ui.addPicture}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addFile(file); }} /></label>
          <CameraButton onPhoto={(file) => void addFile(file)} />
          <button type="button" onClick={useSample} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.useSample}</button>
        </div>
        {message && <Note>{message}</Note>}
        {picture && (
          <>
            <div className="mx-auto max-w-md overflow-hidden rounded-lg border border-slate-200" style={fill === 'clear' && !showOriginal ? CHECKER : undefined}>
              <canvas ref={canvas} onPointerDown={pickColour} className="block h-auto w-full cursor-crosshair touch-manipulation" role="img" aria-label={ui.previewLabel} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowOriginal((value) => !value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{showOriginal ? ui.showCut : ui.showOriginal}</button>
              {background && <span className="inline-flex items-center gap-2 text-xs text-slate-800"><span className="inline-block h-5 w-5 rounded border border-slate-300" style={{ backgroundColor: rgbHex(background) }} aria-hidden="true" />{picked ? ui.colourPicked : ui.colourAuto}</span>}
              {picked && <button type="button" onClick={() => { reset(); setPicked(null); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">{ui.useAuto}</button>}
            </div>
            <p className="text-[11px] text-slate-500">{ui.tapHint}</p>
          </>
        )}
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.finish}</h2>
        <label className="block text-xs font-semibold text-slate-700"><span className="flex justify-between"><span>{ui.tolerance}</span><span className="font-bold text-slate-900">{tolerance}</span></span>
          <input type="range" min={2} max={80} step={1} value={tolerance} onChange={(event) => change({ tolerance: Number(event.target.value) })} className="mt-1 w-full accent-orange-700" /></label>
        <p className="-mt-2 text-[11px] text-slate-500">{ui.toleranceHint}</p>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-bold text-slate-800">{ui.more}</summary>
          <div className="mt-3 space-y-4">
            <Toggle label={ui.edgesOnly} checked={edgesOnly} onChange={(value) => change({ edgesOnly: value })} hint={ui.edgesOnlyHint} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.shrink}</p>
              <ChoiceButtons label={ui.shrink} value={String(shrink)} onChange={(value) => change({ shrink: Number(value) })} options={names(ui.amounts)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.shrinkHint}</p></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.smooth}</p>
              <ChoiceButtons label={ui.smooth} value={String(smooth)} onChange={(value) => change({ smooth: Number(value) })} options={names(ui.amounts)} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.smoothHint}</p></div>
          </div>
        </details>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.fill}</p>
          <ChoiceButtons label={ui.fill} value={fill} onChange={(value) => change({ fill: value as Fill })} options={names(ui.fills)} />
          {fill === 'colour' && <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-700">{ui.pickColour}<input type="color" value={colour} onChange={(event) => change({ colour: event.target.value })} className="h-11 w-16 rounded border border-slate-300" /></label>}
          <p className="mt-1 text-[11px] text-slate-500">{fill === 'clear' ? ui.fillClearHint : ui.fillColourHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <button type="button" onClick={makeFile} disabled={!cut} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-40">{fill === 'clear' ? ui.makePng : ui.makeJpg}</button>
        {result && (
          <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3">
            <SaveResult href={result.url} name={result.name} label={ui.ready} saveLabel={ui.save} detail={formatBytes(result.size)} />
            <p className="text-[11px] text-slate-600">{fill === 'clear' ? ui.pngNote : ui.jpgNote}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default BackgroundRemover;
