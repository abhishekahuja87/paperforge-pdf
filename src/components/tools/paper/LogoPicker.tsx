import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { CameraButton } from '../../common/CameraButton';
import { fileToLogo, type Logo } from '../../../lib/paper/image';

/** Choose a logo or photo to print on the sheet. It is shrunk and kept in this browser only. */
export const LogoPicker: React.FC<{ logo: Logo | null; onChange: (logo: Logo | null) => void }> = ({ logo, onChange }) => {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const pickFile = (file: File) => {
    setError('');
    fileToLogo(file).then(onChange).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not use that picture.'));
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-700">Logo or picture <span className="font-normal text-slate-500">(optional)</span></p>
      <div className="flex items-center gap-3">
        {logo && <img src={logo.src} alt="Your logo" className="h-12 max-w-24 rounded border border-slate-200 bg-white object-contain p-1" />}
        <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"><ImagePlus className="h-4 w-4" aria-hidden="true" />{logo ? 'Change picture' : 'Add picture'}</button>
        <CameraButton onPhoto={pickFile} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50" />
        {logo && <button type="button" onClick={() => { onChange(null); setError(''); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Remove</button>}
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Choose a logo picture" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) pickFile(file);
      }} />
      {error && <p role="status" className="text-[11px] text-red-700">{error}</p>}
      <p className="text-[11px] text-slate-500">The picture stays in your browser. It is printed at the top of the sheet.</p>
    </div>
  );
};
