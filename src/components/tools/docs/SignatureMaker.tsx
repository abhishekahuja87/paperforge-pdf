import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Note } from '../../finance/ui';
import { Toggle, card, heading } from '../paper/controls';
import { SignaturePad } from './SignaturePad';
import { canvasToBlob, makeCanvas, saveBlob } from '../../../lib/images/canvas';
import type { Logo } from '../../../lib/paper/image';
import { generateFileName } from '../../../lib/pdf/naming';

/** Draw or type a signature and save it as a see-through PNG. Made in the browser; nothing is uploaded. */
export const SignatureMaker: React.FC = () => {
  const [sig, setSig] = useState<Logo | null>(null);
  const [white, setWhite] = useState(false);
  const [message, setMessage] = useState('');

  const download = async () => {
    if (!sig) return;
    setMessage('');
    try {
      const img = new Image();
      img.src = sig.src;
      await img.decode();
      const canvas = makeCanvas(img.naturalWidth + 40, img.naturalHeight + 40);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser cannot save the picture.');
      if (white) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 20, 20);
      saveBlob(await canvasToBlob(canvas, 'image/png'), generateFileName('signature', 'png'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the signature.');
    }
  };

  return (
    <section className="mx-auto min-w-0 space-y-4">
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>Your signature</h2>
        <SignaturePad onChange={setSig} />
      </div>
      <div className={`${card} space-y-3`}>
        <h2 className={heading}>Save it</h2>
        <div className="rounded-lg border border-slate-200 p-3" style={{ backgroundImage: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%)', backgroundSize: '16px 16px' }}>
          {sig ? <img src={sig.src} alt="Your signature preview" className="mx-auto max-h-28 object-contain" /> : <p className="py-6 text-center text-xs text-slate-500">Your signature appears here.</p>}
        </div>
        <Toggle label="White background instead of see-through" checked={white} onChange={setWhite} hint="Some forms do not accept see-through pictures." />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={!sig} onClick={() => void download()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800 disabled:opacity-50"><Download className="h-4 w-4" aria-hidden="true" />Download PNG</button>
          <Link to="/sign-pdf" className="text-sm font-semibold text-orange-800 underline">Put it on a PDF</Link>
        </div>
        {message && <p role="status" className="text-xs text-red-700">{message}</p>}
      </div>
      <Note>Made in your browser. Nothing is uploaded or saved. A picture of your signature is not a legally binding e-signature on its own; use it where a plain image of your signature is accepted.</Note>
    </section>
  );
};

export default SignatureMaker;
