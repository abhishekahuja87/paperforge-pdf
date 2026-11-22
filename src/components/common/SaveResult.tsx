import React, { useEffect, useRef, useState } from 'react';
import { Check, Download, Pencil } from 'lucide-react';
import { cleanFileName, splitExtension } from '../../lib/pdf/fileName';

interface SaveResultProps {
  /** Address of the finished file (an object URL). */
  href: string;
  /** The suggested file name, with its extension. */
  name: string;
  /** Headline, for example "Your merged PDF is ready". */
  label?: string;
  /** Text of the save button. */
  saveLabel?: string;
  /** True when the settings changed after the file was made. The banner turns amber and the file cannot be saved until it is made again. */
  outdated?: boolean;
  /** A short line under the name, for example the new size. */
  detail?: string;
}

/** The same "your file is ready" banner for every tool: a tick, the file name with a pencil to change it, and a Save button. */
export const SaveResult: React.FC<SaveResultProps> = ({ href, name, label = 'Your file is ready', saveLabel = 'Save', outdated = false, detail }) => {
  const [custom, setCustom] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // A new file starts with its own suggested name again.
  useEffect(() => { setCustom(null); setEditing(false); }, [href]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const shown = custom ?? name;
  const [base, extension] = splitExtension(shown);

  const start = () => { setDraft(base); setEditing(true); };
  const finish = () => {
    const next = cleanFileName(draft, extension);
    if (next) setCustom(next);
    setEditing(false);
  };

  const tone = outdated ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50';
  return (
    <div role="status" className={`flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 ${tone}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${outdated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
        <Check className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 basis-44">
        <span className={`block text-xs font-bold ${outdated ? 'text-amber-950' : 'text-emerald-950'}`}>{outdated ? 'Settings changed. Make the file again to save the new one.' : label}</span>
        {editing ? (
          <span className="mt-1 flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              aria-label="File name"
              value={draft}
              maxLength={120}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); finish(); } else if (event.key === 'Escape') setEditing(false); }}
              className="min-w-0 flex-1 rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs text-stone-900 outline-none focus:ring-2 focus:ring-orange-300"
            />
            {extension && <span className="text-[11px] text-emerald-800">{extension}</span>}
            <button type="button" onClick={finish} className="rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800">Done</button>
          </span>
        ) : (
          <span className="mt-0.5 flex min-w-0 items-center gap-1">
            <span className={`truncate text-[11px] ${outdated ? 'text-amber-800' : 'text-emerald-800'}`} title={shown}>{shown}</span>
            {!outdated && (
              <button type="button" onClick={start} aria-label="Change the file name" title="Change the file name" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-emerald-800 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </span>
        )}
        {detail && !editing && <span className={`block text-[10px] ${outdated ? 'text-amber-800' : 'text-emerald-800'}`}>{detail}</span>}
      </span>
      {outdated ? (
        <span aria-disabled="true" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-200 px-3 py-2 text-xs font-bold text-stone-500">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />Outdated
        </span>
      ) : (
        <a href={href} download={shown} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-700 focus-visible:ring-offset-2">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />{saveLabel}
        </a>
      )}
    </div>
  );
};

export default SaveResult;
