import React, { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { pictureToDataUrl } from '../../../lib/classroom/quizImage';

/** A button that picks a picture, shrinks it in the browser and hands back a data URL. Used wherever a teacher or shop owner adds an optional picture. */
export const PictureButton: React.FC<{ image?: string; label: string; onPick: (image: string | undefined) => void; onError: (message: string) => void }> = ({ image, label, onPick, onError }) => {
  const input = useRef<HTMLInputElement>(null);
  const choose = async (file: File | undefined) => {
    if (!file) return;
    try { onPick(await pictureToDataUrl(file)); } catch (error) { onError(error instanceof Error ? error.message : 'Could not read that picture.'); }
    if (input.current) input.current.value = '';
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      {image && <img src={image} alt="" className="h-9 w-12 rounded border border-stone-200 object-cover" />}
      <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 text-[11px] font-semibold text-stone-700 hover:bg-stone-50">
        <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />{image ? 'Change picture' : label}
      </button>
      {image && <button type="button" aria-label="Remove picture" onClick={() => onPick(undefined)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"><X className="h-4 w-4" aria-hidden="true" /></button>}
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => void choose(event.target.files?.[0])} />
    </span>
  );
};
