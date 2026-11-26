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
import { SIZES, drawPage, drawSign, normaliseLink, type BorderId, type SignInput, type SizeId, type ThemeId } from '../../../lib/reviewsign/draw';

const STORAGE_KEY = 'mdu_review_sign_v1';
const SAMPLE_RATING = '4.8', SAMPLE_COUNT = '250';
type StarterId = 'listening' | 'enjoyed' | 'how' | 'hindi';
const STARTER_IDS: StarterId[] = ['listening', 'enjoyed', 'how', 'hindi'];
type OutputId = 'pdf' | 'png';
interface Saved { theme: ThemeId; border: BorderId; showRating: boolean; headline: string; scanLabel: string; subline: string; tagline: string; business: string; address: string; link: string; rating: string; count: string; reviewsWord: string; caps: boolean; size: SizeId; output: OutputId }

const fromStarter = (id: StarterId): Partial<Saved> => { const s = ex[id]; return { theme: s.theme as ThemeId, headline: s.headline, scanLabel: s.scanLabel, subline: s.subline, tagline: s.tagline, caps: id !== 'hindi', showRating: true, rating: SAMPLE_RATING, count: SAMPLE_COUNT }; };
const DEFAULTS: Saved = { business: '', address: '', link: '', rating: '', count: '', reviewsWord: 'Reviews', size: 'tent', output: 'pdf', theme: 'darkgold', border: 'auto', headline: '', scanLabel: '', subline: '', tagline: '', caps: true, ...fromStarter('listening') } as Saved;
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const inputClass = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

function load(): Saved {
  try { const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null; if (raw && typeof raw.headline === 'string') return { ...DEFAULTS, ...raw }; } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

/** A "scan to review us" sign for the counter or desk, printed from your own review link. Everything happens on your device. */
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

  const link = normaliseLink(saved.link);
  const usingSample = saved.link.trim() === '';
  const input: SignInput = useMemo(() => ({
    theme: saved.theme, border: saved.border, showRating: saved.showRating, headline: saved.headline, scanLabel: saved.scanLabel, subline: saved.subline, tagline: saved.tagline,
    business: saved.business.trim() || (usingSample ? ex.sample.business : ''), address: saved.address.trim() || (usingSample && !saved.business.trim() ? ex.sample.address : saved.address),
    link: saved.link.trim() ? saved.link : ex.sample.link, rating: saved.rating, count: saved.count, reviewsWord: saved.reviewsWord, caps: saved.caps, logo,
  }), [saved, logo, usingSample]);
  const previewSize: SizeId = saved.size === 'four' || saved.size === 'tent' ? 'a6' : saved.size;

  useEffect(() => { if (canvas.current) { const c = drawSign(input, previewSize, 420); const t = canvas.current; t.width = c.width; t.height = c.height; t.getContext('2d')!.drawImage(c, 0, 0); } }, [input, previewSize, fontTick]);

  const change = (patch: Partial<Saved>) => { output.clear(); setMessage(''); setCheck(''); setSaved((s) => ({ ...s, ...patch })); };
  const field = (label: string, key: keyof Saved, placeholder = '', max = 90) => (
    <label className="block text-xs font-semibold text-slate-700">{label}
      <input type="text" value={saved[key] as string} maxLength={max} placeholder={placeholder} onChange={(e) => change({ [key]: e.target.value } as Partial<Saved>)} className={inputClass} /></label>
  );
  const activeStarter = STARTER_IDS.find((id) => { const s = fromStarter(id) as Record<string, string>; return (['theme', 'headline', 'scanLabel', 'subline'] as const).every((k) => s[k] === saved[k]); }) ?? '';
  const sample = () => change({ business: ex.sample.business, address: ex.sample.address, showRating: true, rating: SAMPLE_RATING, count: SAMPLE_COUNT });

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
      if (saved.output === 'pdf') blob = await canvasesToPdf(1, () => drawPage(input, saved.size, 300), pdfPt, 'Review us sign', () => undefined, () => false, 0.92);
      else blob = await new Promise<Blob | null>((resolve) => drawPage(input, saved.size, 300).toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('empty');
      output.set(blob, generateFileName('review-sign', saved.output), { key: saved.output, detail: ui.readyDetail.replace('{size}', formatBytes(blob.size)).replace('{paper}', paper) });
      if (link) { const png = await new Promise<Blob | null>((resolve) => drawSign(input, 'a5', 1000).toBlob(resolve, 'image/png')); const verdict = png ? await selfCheck(png, link) : null; setCheck(verdict === null ? ui.checkUnavailable : verdict ? ui.check : ui.checkFailed); }
    } catch { setMessage(ui.failed); } finally { setBusy(false); }
  };
  const startAgain = () => { output.clear(); setMessage(''); setCheck(''); setLogo(null); setSaved(DEFAULTS); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(v) => change(fromStarter(v as StarterId))} options={STARTER_IDS.map((id) => ({ value: id, label: ex[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? ex[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.details}</h2>
        {field(ui.business, 'business', ui.businessPlaceholder, 60)}
        <div>{field(ui.link, 'link', ui.linkPlaceholder, 300)}
          <p className="mt-1 text-[11px] text-slate-500">{ui.linkHint}</p>
          {!usingSample && <p className={`mt-1 text-[11px] font-semibold ${link ? 'text-green-800' : 'text-red-700'}`}>{link ? ui.linkOk : ui.linkBad}</p>}
          {usingSample && <p className="mt-1 text-[11px] font-semibold text-slate-700">{ui.linkSample}</p>}</div>
        {field(ui.address, 'address', ui.addressPlaceholder, 120)}
        <div className="flex flex-wrap gap-2"><button type="button" onClick={sample} className={buttonClass}>{ui.useSample}</button></div>
        <p className="text-[11px] text-slate-500">{ui.policy}</p>
      </section>

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        <div className="mt-3 flex justify-center rounded-xl bg-slate-200 p-3"><canvas ref={canvas} role="img" aria-label={ui.previewLabel} className="h-auto w-full max-w-xs rounded shadow" /></div>
        {saved.showRating && saved.rating === SAMPLE_RATING && saved.count === SAMPLE_COUNT && <div className="mt-3"><Note>{ui.ratingSample}</Note></div>}
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            {field(ui.headline, 'headline', '', 60)}{field(ui.scanLabel, 'scanLabel', '', 40)}{field(ui.subline, 'subline', '', 50)}{field(ui.tagline, 'tagline', '', 50)}
            <Toggle label={ui.showRating} checked={saved.showRating} onChange={(v: boolean) => change({ showRating: v })} hint={ui.ratingHint} />
            {saved.showRating && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{field(ui.rating, 'rating', ui.ratingPlaceholder, 4)}{field(ui.count, 'count', ui.countPlaceholder, 9)}{field(ui.reviewsWord, 'reviewsWord', '', 16)}</div>}
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
        <MainActionButton onClick={() => void makeFile()} disabled={busy || (!usingSample && !link)}><Printer className="h-5 w-5" aria-hidden="true" />{busy ? ui.making : ui.make}</MainActionButton>
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
