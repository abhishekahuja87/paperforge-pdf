import React, { useContext, useEffect, useState } from 'react';
import { Download, Link2, Share2 } from 'lucide-react';
import { copyText } from '../../lib/browserTools';
import { useShareContext, useShareUrl } from '../../lib/shareState';
import { canvasToBlob, saveBlob } from '../../lib/images/canvas';
import { generateFileName } from '../../lib/pdf/naming';
import { collectResult, renderResultCard } from '../../lib/share/resultCard';
import { toFile } from '../../lib/share/shareFile';
import { ConfirmButton } from '../tools/shared/ConfirmButton';
import { ShareFileButton } from './ShareFileButton';
import { ShareBarContext } from './shareBarContext';

/** "Copy link to this calculation" bar, shown under a calculator. Must be inside a ShareProvider. */
export const ShareLinkBar: React.FC = () => {
  const buildUrl = useShareUrl();
  const markShown = useContext(ShareBarContext);
  useEffect(() => { markShown(true); return () => markShown(false); }, [markShown]);
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [manualUrl, setManualUrl] = useState('');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const context = useShareContext();
  const [hasResult, setHasResult] = useState(false);
  // The picture buttons appear once the calculator shows result boxes.
  useEffect(() => {
    const node = context?.root.current;
    if (!node) return undefined;
    let frame = 0;
    const check = (): void => { frame = 0; setHasResult(node.querySelector('[data-result-stat]') !== null); };
    const observer = new MutationObserver(() => { if (!frame) frame = window.requestAnimationFrame(check); });
    observer.observe(node, { childList: true, subtree: true });
    check();
    return () => { observer.disconnect(); if (frame) window.cancelAnimationFrame(frame); };
  }, [context]);

  /** Draws the result picture and its file name. Save and Share both use it. */
  const makePicture = async (): Promise<{ blob: Blob; name: string } | null> => {
    if (!context) return null;
    const title = document.querySelector('h1')?.textContent?.trim() || document.title;
    const data = collectResult(context.root.current, title, context.labels, context.values);
    if (!data) return null;
    const feature = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'result';
    return { blob: await canvasToBlob(renderResultCard(data), 'image/png'), name: generateFileName(feature, 'png') };
  };
  const savePicture = async (): Promise<void> => {
    const made = await makePicture();
    if (made) saveBlob(made.blob, made.name);
  };

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
        <strong className="text-slate-800">Share this calculation.</strong> The link opens this page with your numbers and choices filled in. The link carries nothing else and is not stored anywhere. Your last numbers are kept on this device only, and Start again clears them.
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => void copy()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          {state === 'copied' ? 'Link copied' : 'Copy link'}
        </button>
        {canShare && (
          <button type="button" onClick={() => void share()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Share link
          </button>
        )}
        {hasResult && (
          <>
            <button type="button" onClick={() => void savePicture()} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Save picture
            </button>
            <ShareFileButton label="Share picture" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-50" getFile={async () => { const made = await makePicture(); return made ? toFile(made.blob, made.name) : null; }} />
          </>
        )}
        {context && <ConfirmButton label="Start again" confirmLabel="Tap again to clear" onConfirm={context.reset} />}
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
