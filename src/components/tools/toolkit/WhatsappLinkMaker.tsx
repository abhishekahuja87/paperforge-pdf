import React, { useMemo, useState } from 'react';
import { ExternalLink, Download } from 'lucide-react';
import { Note } from '../../finance/ui';
import { CopyButton, fieldClass } from '../utilities/common';
import { card, heading } from '../paper/controls';
import { COUNTRIES, buildWhatsappLink } from '../../../lib/toolkit/whatsapp';
import { encodeQr } from '../../../lib/qr/encoder';
import { defaultStyle, qrPng, qrSvg } from '../../../lib/qr/render';
import { saveBlob } from '../../../lib/images/canvas';
import { generateFileName } from '../../../lib/pdf/naming';

/** A WhatsApp chat link and QR code for a phone number and a ready-typed first message. Built in the browser. */
export const WhatsappLinkMaker: React.FC = () => {
  const [dial, setDial] = useState('91');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');

  const built = useMemo(() => {
    if (!number.trim()) return { link: null as string | null, error: '' };
    try { return { link: buildWhatsappLink(dial, number, message).link, error: '' }; } catch (e) { return { link: null, error: e instanceof Error ? e.message : 'Check the number.' }; }
  }, [dial, number, message]);

  const qr = useMemo(() => {
    if (!built.link) return null;
    try { return encodeQr(built.link, 'M'); } catch { return null; }
  }, [built.link]);
  const svg = qr ? `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg(qr, defaultStyle()))}` : '';

  const download = async () => {
    if (!qr) return;
    saveBlob(await qrPng(qr, defaultStyle(), 1024, null), generateFileName('whatsapp-qr', 'png'));
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>1. Number and message</h2>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <label className="text-xs font-semibold text-slate-700">Country code
            <select value={dial} onChange={(event) => setDial(event.target.value)} className={fieldClass}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.dial}>{c.name} (+{c.dial})</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">WhatsApp number
            <input type="tel" inputMode="tel" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="98765 43210" className={fieldClass} />
          </label>
        </div>
        <label className="block text-xs font-semibold text-slate-700">First message (optional)
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={500} placeholder="Hi, I would like to order..." className={fieldClass} />
        </label>
        {built.error && <p role="status" className="text-xs text-red-700">{built.error}</p>}
      </div>

      {built.link && (
        <div className={`${card} space-y-3`}>
          <h2 className={heading}>2. Your link and QR code</h2>
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">{built.link}</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={built.link} label="Copy link" />
            <a href={built.link} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Test the link</a>
          </div>
          {svg && (
            <div className="flex flex-wrap items-center gap-4">
              <img src={svg} alt="QR code that opens the WhatsApp chat" className="h-40 w-40 rounded-lg border border-slate-200 bg-white" />
              <button type="button" onClick={() => void download()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Download className="h-4 w-4" aria-hidden="true" />Download QR (PNG)</button>
            </div>
          )}
        </div>
      )}
      <Note>Your number and message are not saved. Anyone with the link can start a chat with that number, so share it only where you want to be contacted.</Note>
    </section>
  );
};

export default WhatsappLinkMaker;
