import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Note } from '../../common/CalcKit';
import { ChoiceButtons } from '../../common/FieldKit';
import { Toggle, card, heading } from '../../common/PanelKit';
import { ConfirmButton } from '../shared/ConfirmButton';
import { MainActionButton } from '../../common/MainActionButton';
import { SaveResult } from '../../common/SaveResult';
import { formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { useResultFile } from '../../../lib/useResultFile';
import ui from '../../../locales/packs/whatsappchat.ui.en.json';
import examples from '../../../locales/packs/whatsappchat.examples.en.json';
import { filterChat, parseChat, summarise, type DateOrder } from '../../../lib/whatsapp/parse';
import { buildPages, formatDay, paintPage, RATIO, type Labels, type Look, type Photo, type PaperId, type SizeId, type StyleId } from '../../../lib/whatsapp/layout';
import { loadPhotos, makePdf, MAX_PHOTOS, type SharpnessId } from '../../../lib/whatsapp/make';
import { looksLikeZip, openZip, type ZipArchive } from '../../../lib/whatsapp/zip';
import { inputClass } from '../../common/styles';

const STORAGE_KEY = 'mdu_whatsapp_pdf_v1';
const MAX_PAGES = 600;
const PREVIEW_PIXELS = 640;

interface Saved extends Look { sharpness: SharpnessId; photos: boolean; system: boolean; media: boolean; deleted: boolean }
type StarterId = 'memory' | 'record' | 'clean' | 'ink';
const STARTER_IDS: StarterId[] = ['memory', 'record', 'clean', 'ink'];
const STARTER_FIELDS = ['style', 'size', 'times', 'summary', 'photos', 'system', 'media', 'deleted'] as const;

const DEFAULTS: Saved = { style: 'bubbles', size: 'medium', paper: 'a4', times: true, pageNumbers: true, hideNumbers: false, summary: true, sharpness: 'standard', photos: true, system: false, media: true, deleted: false };
const names = <T extends Record<string, string>>(map: T) => (Object.keys(map) as (keyof T & string)[]).map((value) => ({ value, label: map[value]! }));
const buttonClass = 'min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-40';

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Saved> | null;
    if (raw && typeof raw.style === 'string') return { ...DEFAULTS, ...raw };
  } catch { /* nothing saved or storage blocked */ }
  return DEFAULTS;
}

interface Source { name: string; text: string; zip: ZipArchive | null }

/** Reads a chat from a text file or from a zip that holds one. */
async function readSource(file: File): Promise<Source> {
  if (await looksLikeZip(file)) {
    const zip = await openZip(file);
    const texts = zip.names.filter((name) => /\.txt$/i.test(name));
    const best = texts.find((name) => /chat/i.test(name)) ?? texts[0];
    const blob = best ? await zip.read(best) : null;
    if (!blob) throw new Error('zip');
    return { name: file.name, text: await blob.text(), zip };
  }
  return { name: file.name, text: await file.text(), zip: null };
}

const labels: Labels = ui.labels;

/** Turn a WhatsApp exported chat into a PDF, as chat bubbles or a plain transcript, with filters, photos from a zip and a summary page. Everything happens on your device. */
export const WhatsAppChatPdf: React.FC = () => {
  const [saved, setSaved] = useState<Saved>(load);
  const [source, setSource] = useState<Source | null>(null);
  const [orderChoice, setOrderChoice] = useState<DateOrder | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [meChoice, setMeChoice] = useState<string | undefined>(undefined);
  const [titleText, setTitleText] = useState('');
  const [photos, setPhotos] = useState<Map<string, Photo>>(new Map());
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cancelled = useRef(false);
  const output = useResultFile();
  const deferredSearch = useDeferredValue(search);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }, [saved]);
  useEffect(() => () => { cancelled.current = true; }, []);

  const chat = useMemo(() => (source ? parseChat(source.text, orderChoice ?? undefined) : null), [source, orderChoice]);
  const filtered = useMemo(() => (chat ? filterChat(chat, { from, to, hidden, search: deferredSearch, system: saved.system, media: saved.media, deleted: saved.deleted }) : []), [chat, from, to, hidden, deferredSearch, saved.system, saved.media, saved.deleted]);
  const wantPhotos = !!source?.zip && saved.photos && saved.style === 'bubbles' && saved.media;

  useEffect(() => {
    if (!wantPhotos || !source?.zip) return undefined;
    let live = true;
    setLoadingPhotos(true);
    void loadPhotos(source.zip, filtered, photos).then((found) => { if (live) { setPhotos(found); setLoadingPhotos(false); } });
    return () => { live = false; };
    // photos is read only to skip pictures that are already loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantPhotos, source, filtered]);

  const senders = chat?.senders ?? [];
  const me = meChoice === undefined ? senders[0] ?? null : meChoice || null;
  const nameMatch = source ? /WhatsApp Chat (?:with|-) (.+?)(?:\.(?:txt|zip))?$/i.exec(source.name) : null;
  const autoTitle = nameMatch ? ui.titleWith.replace('{name}', nameMatch[1]!.trim()) : ui.defaultTitle;
  const title = titleText.trim() || autoTitle;
  const look: Look = useMemo(() => ({ style: saved.style, size: saved.size, paper: saved.paper, times: saved.times, pageNumbers: saved.pageNumbers, hideNumbers: saved.hideNumbers, summary: saved.summary }), [saved.style, saved.size, saved.paper, saved.times, saved.pageNumbers, saved.hideNumbers, saved.summary]);
  const built = useMemo(() => (chat && filtered.length > 0 ? buildPages({ messages: filtered, summary: summarise(filtered), title, senders, me, look, labels, photos: wantPhotos ? photos : new Map(), stopAt: MAX_PAGES }) : null), [chat, filtered, title, senders, me, look, photos, wantPhotos]);
  const pages = built?.pages.length ?? 0;
  const shown = Math.min(pageNumber, Math.max(0, pages - 1));

  useEffect(() => {
    const element = canvas.current; const ctx = element?.getContext('2d'); if (!element || !ctx) return;
    if (!built) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, element.width, element.height); return; }
    element.width = PREVIEW_PIXELS; element.height = Math.round(PREVIEW_PIXELS * RATIO[look.paper]);
    ctx.setTransform(PREVIEW_PIXELS / built.width, 0, 0, PREVIEW_PIXELS / built.width, 0, 0);
    paintPage(ctx, built, shown);
  }, [built, shown, look.paper]);

  const stale = () => { output.clear(); setMessage(''); };
  const change = (patch: Partial<Saved>) => { stale(); setSaved((current) => ({ ...current, ...patch })); };
  const resetChat = () => { setPhotos(new Map()); setPageNumber(0); setHidden([]); setFrom(''); setTo(''); setSearch(''); setMeChoice(undefined); setTitleText(''); setOrderChoice(null); stale(); };

  const takeSource = (next: Source) => {
    const parsed = parseChat(next.text);
    resetChat();
    if (parsed.messages.length === 0) { setSource(null); setMessage(ui.noMessages); return; }
    setSource(next);
  };
  const addFile = async (file: File) => { setMessage(''); try { takeSource(await readSource(file)); } catch (error) { setMessage((error as Error).message === 'zip' ? ui.zipNoChat : ui.readFailed); } };
  const addSample = () => { setMessage(''); takeSource({ name: ui.sampleName, text: examples.sample.join('\n'), zip: null }); };
  const applyStarter = (id: StarterId) => { const s = examples[id]; stale(); setSaved((current) => ({ ...current, style: s.style as StyleId, size: s.size as SizeId, times: s.times, summary: s.summary, photos: s.photos, system: s.system, media: s.media, deleted: s.deleted })); };
  const activeStarter = STARTER_IDS.find((id) => STARTER_FIELDS.every((field) => examples[id][field] === saved[field])) ?? '';

  const range = chat && chat.messages.length > 0 ? `${formatDay(chat.messages[0]!.day, false)} to ${formatDay(chat.messages[chat.messages.length - 1]!.day, false)}` : '';
  const tooLong = !!built?.tooLong;
  const key = JSON.stringify([filtered.length, filtered[0]?.day, look, title, me, saved.sharpness, wantPhotos ? photos.size : 0]);

  const makeFile = async () => {
    if (!built || tooLong) return;
    cancelled.current = false; setBusy(true); setDone(0); setMessage(''); output.clear();
    try {
      const blob = await makePdf(built, saved.sharpness, title, setDone, () => cancelled.current);
      if (blob) output.set(blob, generateFileName('whatsapp-chat', 'pdf'), { key, detail: `${built.pages.length} pages, ${formatBytes(blob.size)}` });
    } catch { setMessage(ui.failed); } finally { setBusy(false); }
  };

  const startAgain = () => { cancelled.current = true; setSource(null); resetChat(); setMessage(''); setSaved(DEFAULTS); };

  const peopleLine = senders.length === 1 ? ui.peopleOne : ui.peopleCount.replace('{n}', String(senders.length));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.start}</h2>
        <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.starters}</p>
          <ChoiceButtons label={ui.starters} value={activeStarter} onChange={(value) => applyStarter(value as StarterId)} options={STARTER_IDS.map((id) => ({ value: id, label: examples[id].label }))} />
          <p className="mt-1 text-[11px] text-slate-500">{activeStarter ? examples[activeStarter].hint : ui.startersHint}</p></div>
      </section>

      <section className={`${card} space-y-3`}>
        <h2 className={heading}>{ui.add}</h2>
        <p className="text-[11px] text-slate-500">{ui.addHint}</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-orange-700 px-4 text-sm font-bold text-white hover:bg-orange-800 ${busy ? 'pointer-events-none opacity-40' : ''}`}><FileText className="h-4 w-4" aria-hidden="true" />{ui.addFile}
            <input type="file" accept=".txt,.zip,text/plain,application/zip" className="sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; event.target.value = ''; if (file) void addFile(file); }} /></label>
          <button type="button" onClick={addSample} disabled={busy} className={buttonClass}>{ui.useSample}</button>
          {source && <button type="button" onClick={() => { setSource(null); resetChat(); }} disabled={busy} className={buttonClass}>{ui.remove}</button>}
        </div>
        <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <summary className="cursor-pointer font-semibold text-slate-800">{ui.helpTitle}</summary>
          <p className="mt-2">{ui.helpAndroid}</p><p className="mt-1">{ui.helpIphone}</p><p className="mt-1">{ui.helpZip}</p>
        </details>
        {message && !busy && <Note>{message}</Note>}
        {chat && source && <p className="text-xs text-slate-800">{ui.loaded.replace('{name}', source.name).replace('{count}', String(chat.messages.length)).replace('{people}', peopleLine).replace('{range}', range)}</p>}
        {chat?.ambiguous && (
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.dateOrder}</p>
            <ChoiceButtons label={ui.dateOrder} value={orderChoice ?? chat.order} onChange={(value) => { stale(); setOrderChoice(value as DateOrder); }} options={names(ui.dateOrders)} />
            <p className="mt-1 text-[11px] text-slate-500">{ui.dateOrderHint}</p></div>
        )}
      </section>

      {chat && (
        <section className={`${card} space-y-3`}>
          <h2 className={heading}>{ui.choose}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-700">{ui.from}
              <input type="date" value={from} onChange={(event) => { stale(); setFrom(event.target.value); }} className={inputClass} /></label>
            <label className="block text-xs font-semibold text-slate-700">{ui.to}
              <input type="date" value={to} onChange={(event) => { stale(); setTo(event.target.value); }} className={inputClass} /></label>
          </div>
          <p className="-mt-1 text-[11px] text-slate-500">{ui.dateHint}</p>
          {senders.length > 1 && (
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.people}</p>
              <div className="space-y-1.5">{senders.slice(0, 20).map((name) => (
                <Toggle key={name} label={name} checked={!hidden.includes(name)} onChange={(on) => { stale(); setHidden((current) => (on ? current.filter((item) => item !== name) : [...current, name])); }} />))}</div></div>
          )}
          <label className="block text-xs font-semibold text-slate-700">{ui.search}
            <input type="text" value={search} maxLength={60} placeholder={ui.searchPlaceholder} onChange={(event) => { stale(); setSearch(event.target.value); }} className={inputClass} /></label>
          <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.look}</p>
            <ChoiceButtons label={ui.look} value={saved.style} onChange={(value) => change({ style: value as StyleId })} options={names(ui.looks)} /></div>
          {saved.style === 'bubbles' && senders.length > 0 && (
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.me}</p>
              <ChoiceButtons label={ui.me} value={me ?? ''} onChange={(value) => { stale(); setMeChoice(value); }} options={[...senders.slice(0, 8).map((name) => ({ value: name, label: name })), { value: '', label: ui.meNone }]} />
              <p className="mt-1 text-[11px] text-slate-500">{ui.meHint}</p></div>
          )}
        </section>
      )}

      <section className={card}>
        <h2 className={heading}>{ui.preview}</h2>
        {!chat && <p className="mt-2 text-xs text-slate-600">{ui.previewEmpty}</p>}
        {chat && !built && <Note>{ui.noMatch}</Note>}
        <div className={built ? 'mt-3' : 'hidden'}>
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label={ui.previous} onClick={() => setPageNumber(Math.max(0, shown - 1))} disabled={shown === 0} className={`${buttonClass} !px-3`}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
            <p className="text-xs font-semibold text-slate-700">{ui.pageOf.replace('{n}', String(shown + 1)).replace('{total}', tooLong ? `${MAX_PAGES}+` : String(pages))}</p>
            <button type="button" aria-label={ui.next} onClick={() => setPageNumber(Math.min(pages - 1, shown + 1))} disabled={shown >= pages - 1} className={`${buttonClass} !px-3`}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <div className="mt-2 flex justify-center rounded-xl bg-slate-200 p-2">
            <canvas ref={canvas} role="img" aria-label={ui.preview} className="h-auto w-full max-w-md rounded bg-white shadow" style={{ aspectRatio: `1 / ${RATIO[look.paper]}` }} />
          </div>
          {!tooLong && <p className="mt-2 text-xs text-slate-700">{ui.pagesAbout.replace('{pages}', String(pages)).replace('{count}', String(filtered.length))}</p>}
          {loadingPhotos && <p className="text-xs text-slate-600">{ui.loadingPhotos}</p>}
          {wantPhotos && !loadingPhotos && photos.size > 0 && <p className="text-xs text-slate-600">{ui.photosShown.replace('{n}', String(photos.size))}</p>}
          {tooLong && <Note>{ui.tooLong.replace('{max}', String(MAX_PAGES))}</Note>}
        </div>
      </section>

      <section className={card}>
        <details>
          <summary className="cursor-pointer text-sm font-bold text-slate-900">{ui.more}</summary>
          <div className="mt-3 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">{ui.titleLabel}
              <input type="text" value={titleText} maxLength={80} placeholder={autoTitle || ui.titlePlaceholder} onChange={(event) => { stale(); setTitleText(event.target.value); }} className={inputClass} /></label>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.textSize}</p>
              <ChoiceButtons label={ui.textSize} value={saved.size} onChange={(value) => change({ size: value as SizeId })} options={names(ui.sizes)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.paper}</p>
              <ChoiceButtons label={ui.paper} value={saved.paper} onChange={(value) => change({ paper: value as PaperId })} options={names(ui.papers)} /></div>
            <div><p className="mb-1 text-xs font-semibold text-slate-700">{ui.sharpness}</p>
              <ChoiceButtons label={ui.sharpness} value={saved.sharpness} onChange={(value) => change({ sharpness: value as SharpnessId })} options={names(ui.sharpnesses)} /></div>
            <Toggle label={ui.times} checked={saved.times} onChange={(value) => change({ times: value })} />
            <Toggle label={ui.summary} hint={ui.summaryHint} checked={saved.summary} onChange={(value) => change({ summary: value })} />
            <Toggle label={ui.photos} hint={ui.photosHint.replace('{max}', String(MAX_PHOTOS))} checked={saved.photos} onChange={(value) => change({ photos: value })} />
            <Toggle label={ui.pageNumbers} checked={saved.pageNumbers} onChange={(value) => change({ pageNumbers: value })} />
            <Toggle label={ui.hideNumbers} hint={ui.hideNumbersHint} checked={saved.hideNumbers} onChange={(value) => change({ hideNumbers: value })} />
            <Toggle label={ui.system} hint={ui.systemHint} checked={saved.system} onChange={(value) => change({ system: value })} />
            <Toggle label={ui.media} hint={ui.mediaHint} checked={saved.media} onChange={(value) => change({ media: value })} />
            <Toggle label={ui.deleted} checked={saved.deleted} onChange={(value) => change({ deleted: value })} />
          </div>
        </details>
      </section>

      <section className={`${card} space-y-3`}>
        {busy && <><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-orange-700" style={{ width: `${Math.round((done / Math.max(1, pages)) * 100)}%` }} /></div><p className="text-xs text-slate-700">{ui.making.replace('{done}', String(done)).replace('{total}', String(pages))} {ui.keepOpen}</p></>}
        {busy
          ? <button type="button" onClick={() => { cancelled.current = true; }} className={`${buttonClass} w-full`}>{ui.cancel}</button>
          : <MainActionButton onClick={() => void makeFile()} disabled={!built || tooLong}><FileText className="h-5 w-5" aria-hidden="true" />{ui.make}</MainActionButton>}
        {output.result && (
          <div className="space-y-2">
            <SaveResult href={output.result.url} name={output.result.name} label={ui.ready} saveLabel={ui.savePdf} detail={output.result.detail} outdated={output.isOutdated(key)} />
            <p className="text-[11px] text-slate-500">{ui.notSelectable}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <ConfirmButton label={ui.startAgain} confirmLabel={ui.startAgainConfirm} onConfirm={startAgain} disabled={busy} />
        </div>
        <p className="text-[11px] text-slate-500">{ui.notSaved}</p>
      </section>
    </div>
  );
};

export default WhatsAppChatPdf;
