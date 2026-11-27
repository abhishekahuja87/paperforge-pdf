import React, { useEffect, useRef, useState } from 'react';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { card, heading } from '../../common/PanelKit';
import { CameraButton } from '../../common/CameraButton';
import { canvasToBlob, loadBitmap, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import { hasHiddenDetails, prettyTaken, readPhotoFacts, type PhotoFacts } from '../../../lib/safeshare/exif';

interface Item { id: number; file: File; url: string; facts: PhotoFacts; cleanedKb: number | null }

const Row: React.FC<{ label: string; value: string; warn?: boolean }> = ({ label, value, warn }) => (
  <div className="flex gap-3 border-t border-slate-100 py-1.5 text-xs first:border-t-0">
    <dt className="w-28 shrink-0 font-semibold text-slate-600">{label}</dt>
    <dd className={`min-w-0 break-words ${warn ? 'font-bold text-red-800' : 'text-slate-900'}`}>{value}</dd>
  </div>
);

/** Shows what a photo tells strangers (where it was taken, which phone, when) and saves a clean copy without it. */
export const PhotoPrivacy: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const urls = useRef<string[]>([]);
  useEffect(() => () => { urls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const add = async (files: File[]) => {
    setMessage('');
    const added: Item[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setMessage(`${file.name} is not a picture. Choose JPG, PNG or WebP photos.`); continue; }
      const facts = readPhotoFacts(await file.arrayBuffer());
      const url = URL.createObjectURL(file);
      urls.current.push(url);
      const id = nextId.current; nextId.current += 1;
      added.push({ id, file, url, facts, cleanedKb: null });
    }
    setItems((list) => [...list, ...added]);
  };

  const clean = async (item: Item, quiet = false) => {
    try {
      const bitmap = await loadBitmap(item.file);
      const surface = makeCanvas(bitmap.width, bitmap.height);
      const ctx = surface.getContext('2d');
      if (!ctx) throw new Error('canvas');
      const png = item.file.type === 'image/png';
      if (!png) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, surface.width, surface.height); }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await canvasToBlob(surface, png ? 'image/png' : 'image/jpeg', 0.92);
      const base = item.file.name.replace(/\.[^.]+$/, '') || 'photo';
      saveBlob(blob, `${base}-clean.${png ? 'png' : 'jpg'}`);
      setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, cleanedKb: Math.max(1, Math.round(blob.size / 1024)) } : entry)));
    } catch {
      if (!quiet) setMessage(`Could not clean ${item.file.name}. Try a smaller photo.`);
    }
  };

  const cleanAll = async () => {
    setBusy(true);
    for (const item of items) { await clean(item, true); await new Promise((resolve) => window.setTimeout(resolve, 400)); }
    setBusy(false);
  };

  const remove = (id: number) => setItems((list) => list.filter((item) => item.id !== id));

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Choose your photos</h2>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />Choose photos
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { void add(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
          </label>
          <CameraButton onPhoto={(file) => void add([file])} />
        </div>
      </div>

      {items.map((item) => {
        const { facts } = item;
        const found = hasHiddenDetails(facts);
        return (
          <div key={item.id} className={`${card} space-y-3`}>
            <div className="flex items-start gap-3">
              <img src={item.url} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="break-all text-sm font-bold text-slate-900">{item.file.name}</p>
                <p className="text-[11px] text-slate-500">{Math.round(item.file.size / 1024)} KB</p>
                {facts.readable ? (
                  <p className={`mt-1 text-xs font-bold ${facts.gps ? 'text-red-800' : found ? 'text-amber-800' : 'text-emerald-800'}`}>
                    {facts.gps ? 'This photo shows exactly where it was taken.' : found ? 'This photo carries hidden details.' : 'No hidden details found.'}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-600">Only JPG details can be shown here. A clean copy still removes everything hidden, for any picture.</p>
                )}
              </div>
              <button type="button" onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            {facts.readable && found && (
              <dl>
                {facts.gps && <Row label="Place" warn value={`${facts.gps.latitude.toFixed(5)}, ${facts.gps.longitude.toFixed(5)}`} />}
                {facts.gps && (
                  <div className="py-1.5 text-xs"><a className="font-semibold text-orange-800 underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps?q=${facts.gps.latitude},${facts.gps.longitude}`}>See this spot on a map (opens Google Maps)</a></div>
                )}
                {(facts.make || facts.model) && <Row label="Phone or camera" value={[facts.make, facts.model].filter(Boolean).join(' ')} />}
                {facts.taken && <Row label="Taken" value={prettyTaken(facts.taken)} />}
                {facts.software && <Row label="Made or edited with" value={facts.software} />}
                {facts.artist && <Row label="Owner name" value={facts.artist} />}
                {facts.copyright && <Row label="Copyright" value={facts.copyright} />}
                {facts.extras.length > 0 && <Row label="Other hidden data" value={facts.extras.join(', ')} />}
              </dl>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void clean(item)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download clean copy</button>
              {item.cleanedKb !== null && <span className="text-xs font-semibold text-emerald-800" role="status">Saved a clean copy ({item.cleanedKb} KB) with no hidden details.</span>}
            </div>
          </div>
        );
      })}

      {items.length > 1 && (
        <button type="button" disabled={busy} onClick={() => void cleanAll()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-900 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />{busy ? 'Cleaning…' : `Clean all ${items.length} photos`}</button>
      )}
      {items.length > 1 && <p className="text-[11px] text-slate-500">If your browser asks, allow multiple downloads.</p>}
      {message && <Note>{message}</Note>}
    </section>
  );
};

export default PhotoPrivacy;
