import React, { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons, fieldClass } from '../utilities/common';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { canvasToBlob, saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';

const INKS = [{ value: '#1d3fa8', label: 'Blue' }, { value: '#b42318', label: 'Red' }, { value: '#5b2a86', label: 'Purple' }, { value: '#111111', label: 'Black' }, { value: '#14532d', label: 'Green' }];
const FACE = 'bold %spx Arial, Helvetica, sans-serif';

interface Opts { shape: 'round' | 'rect'; top: string; bottom: string; lines: string[]; ink: string; double: boolean; stars: boolean; angle: number; worn: number }

const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function arcText(ctx: CanvasRenderingContext2D, text: string, radius: number, size: number, top: boolean): void {
  const chars = Array.from(text);
  if (chars.length === 0) return;
  let px = size;
  const widths = () => chars.map((c) => ctx.measureText(c).width + px * 0.06);
  ctx.font = FACE.replace('%s', String(px));
  while (px > 18 && widths().reduce((a, b) => a + b, 0) / radius > Math.PI * 1.15) { px -= 2; ctx.font = FACE.replace('%s', String(px)); }
  const ws = widths(); const total = ws.reduce((a, b) => a + b, 0) / radius;
  let angle = top ? -Math.PI / 2 - total / 2 : Math.PI / 2 + total / 2;
  chars.forEach((c, i) => {
    const step = ws[i]! / radius;
    const mid = top ? angle + step / 2 : angle - step / 2;
    ctx.save();
    ctx.translate(Math.cos(mid) * radius, Math.sin(mid) * radius);
    ctx.rotate(top ? mid + Math.PI / 2 : mid - Math.PI / 2);
    ctx.fillText(c, 0, 0);
    ctx.restore();
    angle += top ? step : -step;
  });
}

function fitLine(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number): number {
  let px = size; ctx.font = FACE.replace('%s', String(px));
  while (px > 16 && ctx.measureText(text).width > maxW) { px -= 2; ctx.font = FACE.replace('%s', String(px)); }
  return px;
}

function drawStamp(canvas: HTMLCanvasElement, o: Opts): void {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const W = canvas.width; const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate((o.angle * Math.PI) / 180);
  ctx.strokeStyle = o.ink; ctx.fillStyle = o.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const lines = o.lines.map((l) => l.trim()).filter(Boolean);
  if (o.shape === 'round') {
    const R = W * 0.46;
    ctx.lineWidth = W * 0.016; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    if (o.double) { ctx.lineWidth = W * 0.006; ctx.beginPath(); ctx.arc(0, 0, R - W * 0.03, 0, Math.PI * 2); ctx.stroke(); }
    const ring = R - W * (o.double ? 0.095 : 0.075);
    ctx.lineWidth = W * 0.006; ctx.beginPath(); ctx.arc(0, 0, R - W * 0.2, 0, Math.PI * 2); ctx.stroke();
    arcText(ctx, o.top.trim().toUpperCase(), ring, W * 0.075, true);
    arcText(ctx, o.bottom.trim().toUpperCase(), ring, W * 0.075, false);
    if (o.stars) { [-1, 1].forEach((s) => { ctx.font = FACE.replace('%s', String(W * 0.07)); ctx.fillText('★', s * ring, 0); }); }
    const inner = (R - W * 0.2) * 1.55;
    const gap = W * 0.1; const start = -((lines.length - 1) * gap) / 2;
    lines.slice(0, 3).forEach((line, i) => { const px = fitLine(ctx, line, inner, W * 0.085); ctx.font = FACE.replace('%s', String(px)); ctx.fillText(line, 0, start + i * gap); });
  } else {
    const w = W * 0.92; const h = H * 0.82;
    ctx.lineWidth = W * 0.012; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, W * 0.03); ctx.stroke();
    if (o.double) { ctx.lineWidth = W * 0.005; ctx.beginPath(); ctx.roundRect(-w / 2 + W * 0.025, -h / 2 + W * 0.025, w - W * 0.05, h - W * 0.05, W * 0.02); ctx.stroke(); }
    const rows = [o.top.trim(), ...lines, o.bottom.trim()].filter(Boolean).slice(0, 5);
    const step = Math.min(H * 0.17, (h * 0.8) / Math.max(1, rows.length));
    rows.forEach((line, i) => { const px = fitLine(ctx, line.toUpperCase(), w * 0.84, step * 0.78); ctx.font = FACE.replace('%s', String(px)); ctx.fillText(line.toUpperCase(), 0, (i - (rows.length - 1) / 2) * step); });
  }
  ctx.restore();
  if (o.worn > 0) {
    const rand = rng(7); ctx.globalCompositeOperation = 'destination-out';
    const dots = Math.round((o.worn / 100) * 2600);
    for (let i = 0; i < dots; i += 1) { ctx.globalAlpha = 0.5 + rand() * 0.5; ctx.beginPath(); ctx.arc(rand() * W, rand() * H, 1 + rand() * rand() * 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}

/** Make a round or rectangular office stamp as a see-through PNG. */
export const StampMaker: React.FC = () => {
  const [shape, setShape] = useState<'round' | 'rect'>('round');
  const [top, setTop] = useState('Sunrise Traders');
  const [bottom, setBottom] = useState('Pune');
  const [l1, setL1] = useState('PAID');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [ink, setInk] = useState('#1d3fa8');
  const [double, setDouble] = useState(true);
  const [stars, setStars] = useState(true);
  const [angle, setAngle] = useState(-8);
  const [worn, setWorn] = useState(0);
  const view = useRef<HTMLCanvasElement>(null);
  const opts: Opts = { shape, top, bottom, lines: [l1, l2, l3], ink, double, stars, angle, worn };
  const dims = shape === 'round' ? { w: 900, h: 900 } : { w: 1200, h: 640 };

  useEffect(() => { const el = view.current; if (el) { el.width = dims.w; el.height = dims.h; drawStamp(el, opts); } }, [shape, top, bottom, l1, l2, l3, ink, double, stars, angle, worn]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = async () => { const c = document.createElement('canvas'); c.width = dims.w; c.height = dims.h; drawStamp(c, opts); saveBlob(await canvasToBlob(c, 'image/png'), generateFileName('stamp', 'png')); };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>Your stamp</h2>
        <ChoiceButtons label="Shape" value={shape} onChange={(v) => setShape(v as 'round' | 'rect')} options={[{ value: 'round', label: 'Round seal' }, { value: 'rect', label: 'Rectangle' }]} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-slate-700">{shape === 'round' ? 'Curved text on top' : 'Top line'}<input type="text" maxLength={36} value={top} onChange={(e) => setTop(e.target.value)} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">{shape === 'round' ? 'Curved text at the bottom' : 'Bottom line'}<input type="text" maxLength={36} value={bottom} onChange={(e) => setBottom(e.target.value)} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">Middle line 1<input type="text" maxLength={20} value={l1} onChange={(e) => setL1(e.target.value)} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">Middle line 2 (optional)<input type="text" maxLength={20} value={l2} onChange={(e) => setL2(e.target.value)} className={fieldClass} /></label>
          <label className="block text-xs font-semibold text-slate-700">Middle line 3 (optional)<input type="text" maxLength={20} value={l3} onChange={(e) => setL3(e.target.value)} className={fieldClass} /></label>
        </div>
        <ChoiceButtons label="Ink" value={ink} onChange={setInk} options={INKS} />
        <Toggle label="Double border" checked={double} onChange={setDouble} />
        {shape === 'round' && <Toggle label="Stars at the sides" checked={stars} onChange={setStars} />}
        <Slider label="Tilt" value={angle} min={-25} max={25} step={1} unit="°" onChange={setAngle} />
        <Slider label="Worn ink look" value={worn} min={0} max={100} step={5} unit="%" onChange={setWorn} />
        <div className="rounded-lg border border-slate-200 p-3" style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%)', backgroundSize: '16px 16px' }}>
          <canvas ref={view} className="mx-auto block h-auto max-h-80 w-auto max-w-full" aria-label="Stamp preview" />
        </div>
        <button type="button" onClick={() => void download()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download PNG</button>
      </div>
      <Note>This is a picture of a stamp for your own invoices, notices and letters. It is not an official government or company seal, and offices that need a registered stamp will not accept a printed picture.</Note>
    </section>
  );
};

export default StampMaker;
