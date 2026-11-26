import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { Note } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { Toggle, card, heading } from '../paper/controls';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import { loadPhoto } from '../../../lib/poster/images';
import { loadPosterFonts } from '../../../lib/poster/fonts';
import { canvasesToPdf } from '../../../lib/pdf/pagesPdf';
import { selfCheck } from '../../../lib/qr/render';
import ui from '../../../locales/packs/reviewsign.ui.en.json';
import ex from '../../../locales/packs/reviewsign.examples.en.json';
import '../shops/posterFonts.css';
import { SIZES, drawPage, drawSign, type BorderId, type SignInput, type SizeId, type ThemeId } from '../../../lib/reviewsign/draw';
import { PLATFORM_IDS, linkFor, type PlatformId } from '../../../lib/reviewsign/platforms';

const STORAGE_KEY = 'mdu_review_sign_v2';
const SAMPLE_URL = 'https://example.com/review', MAX_QR = 4;
type StarterId = 'listening' | 'enjoyed' | 'how' | 'hindi' | 'follow' | 'zomato' | 'connect';
const STARTER_IDS: StarterId[] = ['listening', 'enjoyed', 'how', 'hindi', 'follow', 'zomato', 'connect'];
type OutputId = 'pdf' | 'png';
interface Item { platform: PlatformId; link: string; caption: string }
interface Saved { theme: ThemeId; border: BorderId; showRating: boolean; sampleFigures: boolean; headline: string; scanLabel: string; subline: string; tagline: string; business: string; address: string; items: Item[]; rating: string; count: string; reviewsWord: string; caps: boolean; size: SizeId; output: OutputId }

const info = (id: PlatformId) => ex.platforms[id];
/** The star rating or follower count a platform shows by default, as sample figures the owner replaces. */
const figuresFor = (ids: PlatformId[]): Partial<Saved> => {
  const first = ids.length === 1 ? info(ids[0]!) : null;
  if (first?.figures === 'rating') return { showRating: true, sampleFigures: true, rating: '4.8', count: '250', reviewsWord: first.reviewsWord };
  if (first?.figures === 'count') return { showRating: true, sampleFigures: true, rating: '', count: '2500', reviewsWord: first.reviewsWord };
  return { showRating: false, sampleFigures: false };
};
const itemsFor = (ids: PlatformId[], current: Item[]): Item[] => ids.map((platform, i) => ({ platform, link: current[i]?.platform === platform ? current[i]!.link : '', caption: info(platform).caption }));
const fromStarter = (id: StarterId, current: Item[] = []): Partial<Saved> => {
  const s = ex[id], ids = s.platforms as PlatformId[];
  return { theme: s.theme as ThemeId, headline: s.headline, scanLabel: s.scanLabel, subline: s.subline, tagline: s.tagline, caps: id !== 'hindi', items: itemsFor(ids, current), ...figuresFor(ids) };
};
const DEFAULTS: Saved = { business: '', address: '', rating: '', count: '', reviewsWord: 'Reviews', size: 'tent', output: 'pdf', theme: 'darkgold', border: 'auto', headline: '', scanLabel: '', subline: '', tagline: '', caps: true, showRating: true, sampleFigures: true, items: [], ...fromStarter('listening') } as Saved;
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

function load(): Saved {
  try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null; if (raw && typeof raw.headline === 'string' && Array.isArray(raw.items) && raw.items.length > 0) return { ...DEFAULTS, ...raw }; } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A "scan me" sign for the counter or desk: reviews, follows, orders or any link, as one to four QR codes. Everything happens on your device. */
export const ReviewSignMaker: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [logo, setLogo] = useState<SignInput['logo']>(null);
  const [message, setMessage] = useState('');
  const [check, setCheck] = useState('');
  const [busy, setBusy] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const output = useResultFile();

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => { let live = true; void loadPosterFonts().catch(() => undefined).then(() => { if (live) setFontTick((n) => n + 1); }); return () => { live = false; }; }, []);

  const resolved = saved.items.map((item) => ({ ...item, url: linkFor(item.platform, item.link), empty: item.link.trim() === '' }));
  const anyFilled = resolved.some((item) => !item.empty), allGood = resolved.every((item) => !item.empty && item.url !== ''), usingSample = !anyFilled;
  const canMake = usingSample || allGood;
  const many = saved.items.length > 1;
  const input: SignInput = useMemo(() => ({
    theme: saved.theme, border: saved.border, showRating: saved.showRating, headline: saved.headline, scanLabel: saved.scanLabel, subline: saved.subline, tagline: saved.tagline,
    business: saved.business.trim() || (usingSample ? ex.sample.business : ''), address: saved.address.trim() || (usingSample && !saved.business.trim() ? ex.sample.address : saved.address),
    qrs: saved.items.map((item) => ({ url: linkFor(item.platform, item.link) || SAMPLE_URL, caption: item.caption })), rating: saved.rating, count: saved.count, reviewsWord: saved.reviewsWord, caps: saved.caps, logo,
  }), [saved, logo, usingSample]);
  const previewSize: SizeId = saved.size === 'four' || saved.size === 'tent' ? 'a6' : saved.size;

  useEffect(() => { if (canvas.current) { const c = drawSign(input, previewSize, 420); const t = canvas.current; t.width = c.width; t.height = c.height; t.getContext('2d')!.drawImage(c, 0, 0); } }, [input, previewSize, fontTick]);

  const change = (patch: Partial<Saved>) => {
    output.clear(); setMessage(''); setCheck('');
    setSaved((s) => ({ ...s, ...patch, ...(('rating' in patch || 'count' in patch) && !('sampleFigures' in patch) ? { sampleFigures: false } : {}) }));
  };
  const field = (label: string, key: 'business' | 'address' | 'headline' | 'scanLabel' | 'subline' | 'tagline' | 'rating' | 'count' | 'reviewsWord', placeholder = '', max = 90) => (
    <label className="block text-xs font-semibold text-slate-700">{label}
      <input type="text" value={saved[key]} maxLength={max} placeholder={placeholder} onChange={(e) => change({ [key]: e.target.value } as Partial<Saved>)} className={inputClass} /></label>
  );
  const activeStarter = STARTER_IDS.find((id) => { const s = ex[id] as Record<string, unknown>; return (['theme', 'headline', 'scanLabel', 'subline'] as const).every((k) => s[k] === saved[k]); }) ?? '';
  const sample = () => change({ business: ex.sample.business, address: ex.sample.address, ...figuresFor(saved.items.map((i) => i.platform)) });
  const setItem = (index: number, patch: Partial<Item>) => change({ items: saved.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  const pickPlatform = (index: number, platform: PlatformId) => {
    const items = saved.items.map((item, i) => (i === index ? { ...item, platform, caption: info(platform).caption } : item));
    if (items.length === 1) { const p = info(platform); change({ items, headline: p.headline, scanLabel: p.scanLabel, subline: p.subline, ...figuresFor([platform]) }); } else change({ items });
  };
  const addItem = () => { const used = new Set(saved.items.map((i) => i.platform)), platform = PLATFORM_IDS.find((id) => !used.has(id)) ?? 'other'; change({ items: [...saved.items, { platform, link: '', caption: info(platform).caption }], ...figuresFor([]) }); };
  const removeItem = (index: number) => { const items = saved.items.filter((_, i) => i !== index); change({ items, ...(items.length === 1 ? figuresFor([items[0]!.platform]) : {}) }); };

  const pickLogo = async (file: File | undefined) => {
    if (!file) return; setMessage(''); output.clear();
    try { setLogo(await loadPhoto(file)); } catch { setMessage(ui.logoFailed); }
  };
  const makeFile = async () => {
    setBusy(true); setMessage(''); setCheck(''); output.clear();
    try {
      const dims = SIZES[saved.size], pdfPt: [number, number] = [(dims.pageW / 25.4) * 72, (dims.pageH / 25.4) * 72];
      const paper = ui.sizes[saved.size];
      let blob: Blob | null;
      if (saved.output === 'pdf') blob = await canvasesToPdf(1, () => drawPage(input, saved.size, 300), pdfPt, 'Scan us sign', () => undefined, () => false, 0.92);
      else blob = await new Promise<Blob | null>((resolve) => drawPage(input, saved.size, 300).toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('empty');
      output.set(blob, generateFileName('review-sign', saved.output), { key: saved.output, detail: ui.readyDetail.replace('{size}', formatBytes(blob.size)).replace('{paper}', paper) });
      if (allGood) {
        const png = await new Promise<Blob | null>((resolve) => drawSign(input, 'a5', 1400).toBlob(resolve, 'image/png'));
        const verdicts = png ? await Promise.all(resolved.map((item) => selfCheck(png, item.url))) : [null];
        setCheck(verdicts.some((v) => v === null) ? ui.checkUnavailable : verdicts.every(Boolean) ? ui.check : ui.checkFailed);
      }
    } catch { setMessage(ui.failed); } finally { setBusy(false); }
  };
  const startAgain = () => { output.clear(); setMessage(''); setCheck(''); setLogo(null); setSaved(DEFAULTS); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(v) => change(fromStarter(v as StarterId, saved.items))} options={STARTER_IDS.map((id) => ({ value: id, label: ex[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? ex[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.details}</h2>
        {field(ui.business, 'business', ui.businessPlaceholder, 60)}
        {field(ui.address, 'address', ui.addressPlaceholder, 120)}
        <div className="flex flex-wrap gap-2"><button type="button" onClick={sample} className={buttonClass}>{ui.useSample}</button></div>
        <p className="text-[11px] text-slate-500">{ui.policy}</p>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className={heading}>{ui.what}</h2>
        <p className="text-[11px] text-slate-500">{ui.whatHint}</p>
        {saved.items.map((item, index) => {
          const r = resolved[index]!, p = info(item.platform);
          return (
            <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3">
              {many && <p className="text-xs font-bold text-slate-800">{ui.qrN.replace('{n}', String(index + 1))}</p>}
              <label className="block text-xs font-semibold text-slate-700">{ui.platform}
                <select value={item.platform} onChange={(e) => pickPlatform(index, e.target.value as PlatformId)} className={inputClass}>{PLATFORM_IDS.map((id) => <option key={id} value={id}>{info(id).label}</option>)}</select></label>
              <label className="block text-xs font-semibold text-slate-700">{ui.link}
                <input type="text" value={item.link} maxLength={300} placeholder={p.placeholder} onChange={(e) => setItem(index, { link: e.target.value })} className={inputClass} /></label>
              <p className="text-[11px] text-slate-500">{p.hint}</p>
              {!r.empty && <p className={`text-[11px] font-semibold ${r.url ? 'text-green-800' : 'text-red-700'}`}>{r.url ? ui.linkOk : ui.linkBad}</p>}
              {many && <label className="block text-xs font-semibold text-slate-700">{ui.caption}
                <input type="text" value={item.caption} maxLength={40} onChange={(e) => setItem(index, { caption: e.target.value })} className={inputClass} /></label>}
              {many && <button type="button" onClick={() => removeItem(index)} className={buttonClass}>{ui.removeQr}</button>}
            </div>
          );
        })}
        {usingSample && <p className="text-[11px] font-semibold text-slate-700">{ui.linkSample}</p>}
        {anyFilled && !allGood && many && <p className="text-[11px] font-semibold text-slate-700">{ui.linkSampleMany}</p>}
        {saved.items.length < MAX_QR && <button type="button" onClick={addItem} className={buttonClass}>{ui.addQr}</button>}
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-200 p-3"><canvas ref={canvas} role="img" aria-label={ui.previewLabel} className="h-auto w-full max-w-xs rounded shadow" /></div>
        {saved.showRating && saved.sampleFigures && <div className="mt-3"><Note>{ui.ratingSample}</Note></div>}
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            {field(ui.headline, 'headline', '', 60)}{field(ui.scanLabel, 'scanLabel', '', 40)}{field(ui.subline, 'subline', '', 50)}{field(ui.tagline, 'tagline', '', 50)}
            <Toggle label={ui.showRating} checked={saved.showRating} onChange={(v: boolean) => change({ showRating: v })} hint={ui.ratingHint} />
            {saved.showRating && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{field(ui.rating, 'rating', ui.ratingPlaceholder, 4)}{field(ui.count, 'count', ui.countPlaceholder, 9)}{field(ui.reviewsWord, 'reviewsWord', '', 16)}</div>}
            {saved.showRating && <p className="-mt-2 text-[11px] text-slate-500">{ui.ratingHintFollow}</p>}
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.logo}</p>
              <div className="flex flex-wrap gap-2">
                <label className={`${buttonClass} cursor-pointer`}>{ui.logoChoose}<input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pickLogo(e.target.files?.[0]); e.target.value = ''; }} /></label>
                {logo && <button type="button" onClick={() => { output.clear(); setLogo(null); }} className={buttonClass}>{ui.logoRemove}</button>}</div>
              <p className="mt-1 text-[11px] text-slate-500">{ui.logoHint}</p></div>
            <Toggle label={ui.caps} checked={saved.caps} onChange={(v: boolean) => change({ caps: v })} />
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.theme}</p><ChoiceButtons label={ui.theme} value={saved.theme} onChange={(v) => change({ theme: v as ThemeId })} options={names(ui.themes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.border}</p><ChoiceButtons label={ui.border} value={saved.border} onChange={(v) => change({ border: v as BorderId })} options={names(ui.borders)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.size}</p><ChoiceButtons label={ui.size} value={saved.size} onChange={(v) => change({ size: v as SizeId })} options={names(ui.sizes)} /><p className="mt-1 text-[11px] text-slate-500">{ui.sizeHint}</p></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.output}</p><ChoiceButtons label={ui.output} value={saved.output} onChange={(v) => change({ output: v as OutputId })} options={names(ui.outputs)} /></div>
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        <MainActionButton onClick={() => void makeFile()} disabled={busy || !canMake}><Printer className="h-5 w-5" aria-hidden="true" />{busy ? ui.making : ui.make}</MainActionButton>
        {message && <Note>{message}</Note>}
        {output.result && <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={output.result.key === 'png' ? ui.savePng : ui.savePdf} detail={output.result.detail} />}
        {check && <p className="text-xs font-semibold text-slate-700">{check}</p>}
        <div className="flex flex-wrap gap-2"><ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} /></div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default ReviewSignMaker;
