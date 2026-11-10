import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateFileName } from '../../../lib/pdf/naming';
import { Download, Printer, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Note, SelectField } from '../../finance/ui';
import { CopyButton, fieldClass } from '../utilities/common';
import { Slider, Toggle, card, heading } from '../paper/controls';
import { encodeQr, maxBytes, type EccLevel, type QrCode } from '../../../lib/qr/encoder';
import {
  contactPayload, contrastRatio, defaultContact, defaultEmail, defaultEvent, defaultGeo, defaultSms, defaultWhatsApp, defaultWifi, emailPayload, eventPayload, geoPayload,
  phonePayload, smsPayload, urlPayload, whatsappPayload, wifiPayload, type QrKind,
} from '../../../lib/qr/payloads';
import { MAX_LOGO, defaultStyle, qrPng, qrSvg, selfCheck, type QrStyle } from '../../../lib/qr/render';

const KINDS: { id: QrKind; label: string }[] = [
  { id: 'url', label: 'Link' }, { id: 'text', label: 'Text' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'wifi', label: 'Wi-Fi' }, { id: 'contact', label: 'Contact' },
  { id: 'email', label: 'Email' }, { id: 'phone', label: 'Phone' }, { id: 'sms', label: 'SMS' }, { id: 'geo', label: 'Location' }, { id: 'event', label: 'Event' },
];

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }> = ({ label, value, onChange, type = 'text', placeholder, multiline }) => (
  <label className="block text-xs font-semibold text-slate-700">{label}
    {multiline
      ? <textarea value={value} placeholder={placeholder} rows={3} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
      : <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={fieldClass} />}
  </label>
);

export const QrGenerator: React.FC<{ initialKind?: QrKind }> = ({ initialKind = 'url' }) => {
  const [kind, setKind] = useState<QrKind>(initialKind);
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [wa, setWa] = useState(defaultWhatsApp);
  const [wifi, setWifi] = useState(defaultWifi);
  const [contact, setContact] = useState(defaultContact);
  const [mail, setMail] = useState(defaultEmail);
  const [phone, setPhone] = useState('');
  const [sms, setSms] = useState(defaultSms);
  const [geo, setGeo] = useState(defaultGeo);
  const [event, setEvent] = useState(defaultEvent);
  const [ecc, setEcc] = useState<EccLevel>('M');
  const [style, setStyle] = useState<QrStyle>(defaultStyle);
  const [logoHref, setLogoHref] = useState('');
  const [size, setSize] = useState(1024);
  const [copies, setCopies] = useState(6);
  const [caption, setCaption] = useState('');
  const [verified, setVerified] = useState<boolean | null | 'pending'>('pending');
  const [message, setMessage] = useState('');
  const logoImage = useRef<HTMLImageElement | null>(null);

  const payload = useMemo(() => {
    switch (kind) {
      case 'url': return urlPayload(link);
      case 'text': return text;
      case 'whatsapp': return whatsappPayload(wa);
      case 'wifi': return wifiPayload(wifi);
      case 'contact': return contactPayload(contact);
      case 'email': return emailPayload(mail);
      case 'phone': return phonePayload(phone);
      case 'sms': return smsPayload(sms);
      case 'geo': return geoPayload(geo);
      default: return eventPayload(event);
    }
  }, [kind, text, link, wa, wifi, contact, mail, phone, sms, geo, event]);

  const hasLogo = style.logo > 0 && logoHref !== '';
  const effective: QrStyle = { ...style, logo: hasLogo ? style.logo : 0 };
  const level: EccLevel = hasLogo ? 'H' : ecc;

  const { qr, error } = useMemo((): { qr: QrCode | null; error: string } => {
    if (!payload) return { qr: null, error: '' };
    try { return { qr: encodeQr(payload, level, !hasLogo && ecc === 'L' ? false : true), error: '' }; } catch {
      return { qr: null, error: `That is too much for one QR code (about ${maxBytes(level)} bytes at this error correction level). Shorten it, or lower the error correction.` };
    }
  }, [payload, level, hasLogo, ecc]);

  const svg = useMemo(() => (qr ? qrSvg(qr, effective, logoHref) : ''), [qr, effective, logoHref]);
  const contrast = contrastRatio(style.fg, style.bg);
  const inverted = style.fg.toLowerCase() !== style.bg.toLowerCase() && contrastRatio(style.fg, '#000000') > contrastRatio(style.bg, '#000000');

  useEffect(() => {
    if (!qr) { setVerified('pending'); return undefined; }
    let live = true;
    setVerified('pending');
    const timer = window.setTimeout(() => {
      qrPng(qr, effective, 512, logoImage.current).then((blob) => selfCheck(blob, payload)).then((ok) => { if (live) setVerified(ok); }).catch(() => { if (live) setVerified(null); });
    }, 350);
    return () => { live = false; window.clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr, svg]);

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Choose an image file for the logo.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const href = String(reader.result);
      const img = new Image();
      img.onload = () => { logoImage.current = img; setLogoHref(href); setStyle((s) => ({ ...s, logo: s.logo > 0 ? s.logo : 0.2 })); setMessage(''); };
      img.src = href;
    };
    reader.readAsDataURL(file);
  };

  const saveSvg = () => qr && download(new Blob([svg], { type: 'image/svg+xml' }), generateFileName('qr-code', 'svg'));
  const savePng = async () => {
    if (!qr) return;
    try { download(await qrPng(qr, effective, size, logoImage.current), generateFileName('qr-code', 'png')); setMessage(''); } catch { setMessage('Could not make the PNG. Try a smaller size.'); }
  };

  const set = <K extends keyof QrStyle>(key: K, value: QrStyle[K]) => setStyle((s) => ({ ...s, [key]: value }));

  return (
    <section className="mx-auto min-w-0">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] print:hidden">
        <div className="order-2 space-y-4 lg:order-1">
          <div className={card}>
            <h2 className={heading}>1. What should the code open?</h2>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Content type">
              {KINDS.map((item) => (
                <button key={item.id} type="button" aria-pressed={kind === item.id} onClick={() => setKind(item.id)} className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-bold ${kind === item.id ? 'border-orange-300 bg-orange-50 text-slate-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>
              ))}
            </div>
            <div className="mt-3 space-y-3">
              {kind === 'url' && <Field label="Web address" value={link} onChange={setLink} type="url" placeholder="example.com/menu" />}
              {kind === 'text' && <Field label="Text" value={text} onChange={setText} multiline placeholder="Any text, a note, a code or a serial number" />}
              {kind === 'whatsapp' && (<>
                <Field label="WhatsApp number, with country code" value={wa.number} onChange={(number) => setWa({ ...wa, number })} type="tel" placeholder="+91 98765 43210" />
                <Field label="First message (optional)" value={wa.message} onChange={(message_) => setWa({ ...wa, message: message_ })} multiline placeholder="Hi, I saw your poster and would like to know more" />
              </>)}
              {kind === 'wifi' && (<>
                <Field label="Network name (SSID)" value={wifi.ssid} onChange={(ssid) => setWifi({ ...wifi, ssid })} />
                <SelectField label="Security" value={wifi.security} onChange={(security) => setWifi({ ...wifi, security: security as typeof wifi.security })} options={[{ value: 'WPA', label: 'WPA / WPA2 / WPA3' }, { value: 'WEP', label: 'WEP (old)' }, { value: 'nopass', label: 'Open, no password' }]} />
                {wifi.security !== 'nopass' && <Field label="Password" value={wifi.password} onChange={(password) => setWifi({ ...wifi, password })} />}
                <Toggle label="Hidden network" checked={wifi.hidden} onChange={(hidden) => setWifi({ ...wifi, hidden })} />
              </>)}
              {kind === 'contact' && (<>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" value={contact.first} onChange={(first) => setContact({ ...contact, first })} />
                  <Field label="Last name" value={contact.last} onChange={(last) => setContact({ ...contact, last })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Company" value={contact.org} onChange={(org) => setContact({ ...contact, org })} />
                  <Field label="Job title" value={contact.title} onChange={(title) => setContact({ ...contact, title })} />
                </div>
                <Field label="Phone" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} type="tel" />
                <Field label="Email" value={contact.email} onChange={(v) => setContact({ ...contact, email: v })} type="email" />
                <Field label="Website" value={contact.website} onChange={(v) => setContact({ ...contact, website: v })} />
                <Field label="Address" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} />
                <Field label="Note" value={contact.note} onChange={(v) => setContact({ ...contact, note: v })} />
              </>)}
              {kind === 'email' && (<>
                <Field label="To" value={mail.to} onChange={(to) => setMail({ ...mail, to })} type="email" />
                <Field label="Subject" value={mail.subject} onChange={(subject) => setMail({ ...mail, subject })} />
                <Field label="Message" value={mail.body} onChange={(body) => setMail({ ...mail, body })} multiline />
              </>)}
              {kind === 'phone' && <Field label="Phone number, with country code" value={phone} onChange={setPhone} type="tel" placeholder="+1 555 010 0000" />}
              {kind === 'sms' && (<>
                <Field label="Phone number, with country code" value={sms.number} onChange={(number) => setSms({ ...sms, number })} type="tel" />
                <Field label="Message" value={sms.message} onChange={(message_) => setSms({ ...sms, message: message_ })} multiline />
              </>)}
              {kind === 'geo' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude" value={geo.lat} onChange={(lat) => setGeo({ ...geo, lat })} placeholder="48.8584" />
                  <Field label="Longitude" value={geo.lng} onChange={(lng) => setGeo({ ...geo, lng })} placeholder="2.2945" />
                </div>
              )}
              {kind === 'event' && (<>
                <Field label="Title" value={event.title} onChange={(title) => setEvent({ ...event, title })} />
                <Toggle label="All-day event" checked={event.allDay} onChange={(allDay) => setEvent({ ...event, allDay, start: '', end: '' })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Starts" value={event.start} onChange={(start) => setEvent({ ...event, start })} type={event.allDay ? 'date' : 'datetime-local'} />
                  <Field label="Ends" value={event.end} onChange={(end) => setEvent({ ...event, end })} type={event.allDay ? 'date' : 'datetime-local'} />
                </div>
                <Field label="Place" value={event.location} onChange={(location) => setEvent({ ...event, location })} />
                <Field label="Details" value={event.description} onChange={(description) => setEvent({ ...event, description })} multiline />
              </>)}
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>2. Look and reliability</h2>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-slate-700">Code colour<input type="color" value={style.fg} onChange={(e) => set('fg', e.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-slate-200" /></label>
                <label className="block text-xs font-semibold text-slate-700">Background<input type="color" value={style.bg} onChange={(e) => set('bg', e.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-slate-200" /></label>
              </div>
              {contrast < 4 && <Note>Low contrast ({contrast.toFixed(1)}:1). Many phones will struggle to read this. Use a darker code on a lighter background.</Note>}
              {inverted && contrast >= 4 && <Note>Light code on a dark background is an inverted code. Some older scanners cannot read it. Test with more than one phone.</Note>}
              <SelectField label="Error correction" value={hasLogo ? 'H' : ecc} onChange={(v) => setEcc(v as EccLevel)} options={[{ value: 'L', label: 'Low (7%): smallest code' }, { value: 'M', label: 'Medium (15%): good default' }, { value: 'Q', label: 'Quartile (25%): for print wear' }, { value: 'H', label: 'High (30%): for logos and rough surfaces' }]} />
              <Toggle label="Round dots" checked={style.rounded} onChange={(v) => set('rounded', v)} hint="Softer look. Keep contrast high." />
              <Slider label="Blank border" value={style.quiet} min={2} max={8} step={1} unit="modules" onChange={(v) => set('quiet', v)} />
              {style.quiet < 4 && <p className="text-[11px] text-amber-700">The standard asks for at least 4 modules of blank border. Smaller borders can fail on some scanners.</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Logo in the centre (optional)
                  <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0])} className="mt-1.5 block w-full text-xs" />
                </label>
                {hasLogo && (<div className="mt-2 space-y-2">
                  <Slider label="Logo size" value={Math.round(style.logo * 100)} min={10} max={Math.round(MAX_LOGO * 100)} step={1} unit="% of width" onChange={(v) => set('logo', v / 100)} />
                  <p className="text-[11px] text-slate-500">Error correction is set to High so the code still reads with the middle covered.</p>
                  <button type="button" onClick={() => { setLogoHref(''); logoImage.current = null; }} className="text-xs font-semibold text-slate-600 underline">Remove logo</button>
                </div>)}
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <div className={card}>
            <h2 className={heading}>3. Your code</h2>
            <div className="mt-3 flex min-h-64 items-center justify-center rounded-lg bg-slate-50 p-4">
              {svg ? <div className="w-full max-w-xs [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label="Generated QR code" dangerouslySetInnerHTML={{ __html: svg }} />
                : <p className="text-center text-sm text-slate-500">{error || 'Fill in the details and your code appears here.'}</p>}
            </div>
            {qr && (
              <p className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                {verified === true && <><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /><span>Checked: this browser read the finished code back correctly.</span></>}
                {verified === false && <><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" /><span>This browser could not read the code back. Raise the contrast or error correction, shrink the logo, or shorten the content.</span></>}
                {(verified === null || verified === 'pending') && <span>Version {qr.version}, {qr.size}×{qr.size} modules. Always scan a printed test before you print many.</span>}
              </p>
            )}
            {message && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{message}</p>}
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold text-slate-700">PNG width
                <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1.5 block rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  {[512, 1024, 2048, 4096].map((n) => <option key={n} value={n}>{n} px</option>)}
                </select>
              </label>
              <button type="button" disabled={!qr} onClick={savePng} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />PNG</button>
              <button type="button" disabled={!qr} onClick={saveSvg} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />SVG</button>
              <CopyButton text={payload} label="Copy content" disabled={!payload} />
            </div>
          </div>

          <div className={card}>
            <h2 className={heading}>4. Print a sheet of copies</h2>
            <p className="mt-1 text-xs text-slate-600">Table cards, shelf labels or stickers: print the same code several times on one page, each with a caption.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Caption under each code" value={caption} onChange={setCaption} placeholder="Scan to join the Wi-Fi" />
              <Slider label="Copies" value={copies} min={1} max={24} step={1} unit="" onChange={setCopies} />
            </div>
            <button type="button" disabled={!qr} onClick={() => window.print()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50"><Printer className="h-4 w-4" aria-hidden="true" />Print the sheet</button>
          </div>
          <Note>Everything is made in your browser. What you type is never uploaded, and the code does not expire or depend on this website.</Note>
        </div>
      </div>

      {qr && (
        <div className="hidden print:grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(55mm, 1fr))', gap: '8mm' }}>
          {Array.from({ length: copies }, (_, i) => (
            <figure key={i} className="m-0 break-inside-avoid text-center" style={{ breakInside: 'avoid' }}>
              <div style={{ width: '50mm', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
              {caption && <figcaption style={{ fontSize: '10pt', marginTop: '2mm' }}>{caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </section>
  );
};
