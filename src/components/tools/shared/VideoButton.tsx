import React, { useRef } from 'react';
import { Film, X } from 'lucide-react';

/**
 * Picks a short video from the device. The video is played from this browser tab only (a temporary link), so it is never uploaded
 * and it is not kept when the page is reloaded.
 */
export const VideoButton: React.FC<{ video?: string; label: string; onPick: (video: string | undefined) => void }> = ({ video, label, onPick }) => {
  const input = useRef<HTMLInputElement>(null);
  const release = () => { if (video?.startsWith('blob:')) URL.revokeObjectURL(video); };
  const choose = (file: File | undefined) => {
    if (!file || !file.type.startsWith('video/')) return;
    release();
    onPick(URL.createObjectURL(file));
    if (input.current) input.current.value = '';
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 text-[11px] font-semibold text-stone-700 hover:bg-stone-50">
        <Film className="h-3.5 w-3.5" aria-hidden="true" />{video ? 'Change video' : label}
      </button>
      {video && <button type="button" aria-label="Remove video" onClick={() => { release(); onPick(undefined); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"><X className="h-4 w-4" aria-hidden="true" /></button>}
      {video && <span className="text-[10px] font-semibold text-stone-500">Added for this visit only</span>}
      <input ref={input} type="file" accept="video/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => choose(event.target.files?.[0])} />
    </span>
  );
};
