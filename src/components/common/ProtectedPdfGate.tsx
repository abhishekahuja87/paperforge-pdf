import React, { useCallback, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useDialog } from '../../lib/useDialog';

const isPdfFile = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

/** True when the PDF needs a password to open. A cheap byte scan first, so ordinary files are never fully parsed. */
export async function isPasswordProtectedPdf(file: File): Promise<boolean> {
  if (!isPdfFile(file)) return false;
  const buffer = await file.arrayBuffer();
  // An encrypted PDF always names /Encrypt in its (uncompressed) trailer or cross-reference dictionary.
  if (!new TextDecoder('latin1').decode(buffer).includes('/Encrypt')) return false;
  try {
    await PDFDocument.load(buffer, { updateMetadata: false });
    return false;
  } catch (error) {
    // pdf-lib is compiled for old browsers, where `instanceof EncryptedPDFError` is unreliable, so go by the message.
    const message = error instanceof Error ? error.message : String(error);
    return /encrypted/i.test(message);
  }
}

type Pending = { file: File; error: string; busy: boolean };

const PasswordDialog: React.FC<{ pending: Pending; onSubmit: (password: string) => void; onCancel: () => void }> = ({ pending, onSubmit, onCancel }) => {
  const dialogRef = useDialog<HTMLFormElement>(onCancel);
  const [password, setPassword] = useState('');
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <form
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-password-title"
        onSubmit={(event) => { event.preventDefault(); onSubmit(password); }}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="pdf-password-title" className="text-lg font-bold text-slate-900">This PDF is password-protected</h2>
            <p className="mt-1 break-all text-xs text-slate-500">{pending.file.name}</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cancel and skip this file" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">Enter the password to open it. It is used only in this browser and is never uploaded. If the file only has editing restrictions, leave the field empty and continue.</p>
        <label className="block text-xs font-semibold text-slate-600">
          PDF password
          <input autoFocus type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">To work on it, the pages are redrawn as images in an unlocked copy. Its text will not be selectable and links and form fields are lost. Your original file is not changed.</p>
        {pending.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{pending.error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={pending.busy} onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-50">Skip file</button>
          <button type="submit" disabled={pending.busy} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{pending.busy ? 'Unlocking…' : 'Unlock and continue'}</button>
        </div>
      </form>
    </div>
  );
};

/**
 * Lets a PDF tool accept password-protected files. Call `prepare(file)` on every uploaded file: ordinary files come
 * back unchanged; a protected one opens a password dialog and resolves to an unlocked copy (or null if the person
 * skips it). Render `dialog` anywhere in the tool.
 */
export function useProtectedPdf() {
  const [pending, setPending] = useState<Pending | null>(null);
  const resolver = useRef<((file: File | null) => void) | null>(null);

  const prepare = useCallback(async (file: File): Promise<File | null> => {
    if (!(await isPasswordProtectedPdf(file))) return file;
    return new Promise<File | null>((resolve) => {
      resolver.current = resolve;
      setPending({ file, error: '', busy: false });
    });
  }, []);

  const finish = (result: File | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setPending(null);
  };

  const submit = async (password: string) => {
    if (!pending) return;
    setPending({ ...pending, busy: true, error: '' });
    try {
      const { unlockPdf } = await import('../../lib/pdf/unlock');
      const bytes = await unlockPdf({ fileBuffer: await pending.file.arrayBuffer(), password });
      finish(new File([bytes.slice().buffer as ArrayBuffer], pending.file.name, { type: 'application/pdf' }));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '';
      const clean = message.replace(/^(PASSWORD_REQUIRED|INVALID_PASSWORD):\s*/, '');
      setPending({
        ...pending,
        busy: false,
        error: message.startsWith('PASSWORD_REQUIRED') || message.startsWith('INVALID_PASSWORD') ? clean : 'Could not open this PDF. Check the password and try again.',
      });
    }
  };

  const dialog = pending ? <PasswordDialog key={pending.file.name} pending={pending} onSubmit={(password) => void submit(password)} onCancel={() => { if (!pending.busy) finish(null); }} /> : null;
  return { prepare, dialog };
}
