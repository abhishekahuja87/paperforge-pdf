import React, { useState } from 'react';
import { Link2, Share2 } from 'lucide-react';
import { copyText } from '../../lib/browserTools';
import { useShareUrl } from '../../lib/shareState';

/** "Copy link to this calculation" bar, shown under a calculator. Must be inside a ShareProvider. */
export const ShareLinkBar: React.FC = () => {
  const buildUrl = useShareUrl();
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [manualUrl, setManualUrl] = useState('');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    const url = buildUrl();
    try {
      await copyText(url);
      setState('copied');
      window.setTimeout(() => setState('idle'), 2500);
    } catch {
      setManualUrl(url);
      setState('manual');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: document.title, url: buildUrl() });
    } catch { /* closed without sharing */ }
  };

  return (
    <div className="mx-auto mt-3 flex min-w-0 flex-col gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-slate-600">
        <strong className="text-slate-800">Share this calculation.</strong> The link opens this page with your numbers and choices filled in. It carries nothing else and is not stored anywhere.
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => void copy()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          {state === 'copied' ? 'Link copied' : 'Copy link'}
        </button>
        {canShare && (
          <button type="button" onClick={() => void share()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Share
          </button>
        )}
      </div>
      {state === 'manual' && (
        <label className="block w-full text-[11px] font-semibold text-slate-600">
          Copy this link
          <input readOnly value={manualUrl} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-normal" />
        </label>
      )}
    </div>
  );
};
