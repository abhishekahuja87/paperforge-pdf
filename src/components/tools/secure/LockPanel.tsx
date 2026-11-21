import React, { useState } from 'react';
import { Check, Copy, Download, Eye, EyeOff, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { buildLockedPage } from '../../../lib/secure/page';
import { open, pack, seal, ITERATIONS, type Header } from '../../../lib/secure/crypto';
import { MIN_LENGTH, isAcceptable, makePassphrase, makeRandomPassword, measure } from '../../../lib/secure/strength';
import { downloadBlob, formatBytes } from '../../../lib/browserTools';
import { generateFileName } from '../../../lib/pdf/naming';
import { card, heading } from '../paper/controls';
import { fieldClass } from '../utilities/common';

/** What the maker hands over to be locked. */
export interface Prepared { header: Header; body: Uint8Array; fileBase: string }

/** Largest thing that is locked. Email services stop around 25 MB and the locked file is a third bigger than the original. */
export const MAX_BYTES = 16 * 1024 * 1024;

const BAR = ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

interface Props {
  /** Builds what is locked, or returns a short message about what is missing. */
  prepare: () => Promise<Prepared | string>;
  /** The kind of thing being locked, for the wording. */
  noun: 'document' | 'file';
}

/** Password, strength, unlock-screen message and the Lock and download button, shared by the document maker and the file locker. */
export const LockPanel: React.FC<Props> = ({ prepare, noun }) => {
  const [password, setPassword] = useState('');
  const [shown, setShown] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<{ name: string; size: number; html: string } | null>(null);
  const strength = measure(password);

  const setPass = (value: string) => { setPassword(value); setDone(null); setError(''); setCopied(false); };
  const generate = (text: string) => { setPass(text); setShown(true); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(password); setCopied(true); } catch { setError('Copying is blocked here. Select the password and copy it yourself.'); }
  };

  const lock = async () => {
    setError('');
    setDone(null);
    if (!isAcceptable(password)) { setError(`Choose a password of at least ${MIN_LENGTH} characters that is not a common one, or tap a button to make one.`); return; }
    try {
      setBusy('Getting your ' + noun + ' ready...');
      const prepared = await prepare();
      if (typeof prepared === 'string') { setError(prepared); return; }
      if (prepared.body.length > MAX_BYTES) { setError(`This is ${formatBytes(prepared.body.length)}. The limit is ${formatBytes(MAX_BYTES)} so the locked file still fits in an email. Use smaller pictures or a smaller file.`); return; }
      setBusy('Locking. This takes a few seconds on purpose, because it makes password guessing slow.');
      const plain = pack(prepared.header, prepared.body);
      const sealed = await seal(plain, password);
      setBusy('Checking that the locked file opens with your password...');
      const back = await open(sealed, password);
      if (back.length !== plain.length) throw new Error('check failed');
      const html = buildLockedPage({ sealed, message });
      const name = generateFileName('locked', 'html', { base: prepared.fileBase });
      downloadBlob(new Blob([html], { type: 'text/html' }), name);
      setDone({ name, size: html.length, html });
    } catch {
      setError('Could not lock it. Your browser may not support this, or the ' + noun + ' is too large for this device. Try a smaller one.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={`${card} space-y-4`}>
      <div>
        <h2 className={heading}>Lock it with a password</h2>
        <p className="mt-1 text-xs text-slate-600">The {noun} is locked here with AES-256 encryption. You get one file that opens in any browser for someone who has the password.</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700" htmlFor="sec-password">Password</label>
        <div className="mt-1.5 flex gap-2">
          <input id="sec-password" type={shown ? 'text' : 'password'} value={password} autoComplete="new-password" spellCheck={false} autoCapitalize="off" onChange={(event) => setPass(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" />
          <button type="button" aria-label={shown ? 'Hide the password' : 'Show the password'} aria-pressed={shown} onClick={() => setShown((v) => !v)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">{shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button>
          <button type="button" aria-label="Copy the password" disabled={!password} onClick={() => void copy()} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40">{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => generate(makePassphrase())} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Make a passphrase</button>
          <button type="button" onClick={() => generate(makeRandomPassword())} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Make a random password</button>
        </div>
        {password && (
          <div className="mt-3" role="status">
            <div className="flex gap-1" aria-hidden="true">{[1, 2, 3, 4].map((step) => <span key={step} className={`h-1.5 flex-1 rounded-full ${strength.score >= step ? BAR[strength.score] : 'bg-slate-200'}`} />)}</div>
            <p className="mt-1 text-xs text-slate-700"><span className="font-bold">{strength.label}</span>{strength.advice ? ` · ${strength.advice}` : ''}</p>
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-500">The password cannot be recovered. If it is lost, the {noun} cannot be opened by anyone, including us.</p>
      </div>
      <label className="block text-xs font-semibold text-slate-700">Message on the unlock screen (optional)
        <span className="block text-[11px] font-normal text-slate-500">Shown to anyone who opens the file, before the password. Do not put private details or the password in it. For example: "Offer letter from Asha. I will call you with the password."</span>
        <textarea rows={2} maxLength={300} value={message} onChange={(event) => { setMessage(event.target.value); setDone(null); }} className={fieldClass} />
      </label>
      <button type="button" disabled={!!busy} onClick={() => void lock()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-60">
        <Lock className="h-4 w-4" aria-hidden="true" />{busy ? 'Working...' : `Lock the ${noun} and download`}
      </button>
      {busy && <p role="status" className="text-xs text-slate-700">{busy}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900">{error}</p>}
      {done && (
        <div role="status" className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
          <p className="flex items-start gap-2 font-bold"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Locked and saved as {done.name} ({formatBytes(done.size)}).</p>
          <p>We opened it again with your password to be sure it works. Send the file by email, WhatsApp or a pen drive, and give the password by a different route, such as a phone call, not in the same message.</p>
          <button type="button" onClick={() => downloadBlob(new Blob([done.html], { type: 'text/html' }), done.name)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 font-semibold text-emerald-900"><Download className="h-3.5 w-3.5" aria-hidden="true" />Download again</button>
        </div>
      )}
      <p className="text-[11px] text-slate-500">Unlocking takes a few seconds on purpose ({ITERATIONS.toLocaleString('en-IN')} rounds of key stretching). Anyone with the file and the password can read it, copy it or take a screenshot, so share it only with people you trust.</p>
    </div>
  );
};
