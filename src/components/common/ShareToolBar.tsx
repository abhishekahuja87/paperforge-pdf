import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Link2, MessageSquarePlus, Share2 } from 'lucide-react';
import { copyText } from '../../lib/browserTools';

/** A slim row under a tool: share the page with a friend, and tell us about a problem or an idea. Nothing about the person's work is included in the link. */
export const ShareToolBar: React.FC<{ title: string }> = ({ title }) => {
  const [copied, setCopied] = useState(false);
  const { pathname } = useLocation();
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const url = () => `${window.location.origin}${window.location.pathname}`;
  const share = async () => {
    try {
      if (canShare) { await navigator.share({ title, url: url() }); return; }
      await copyText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch { /* closed without sharing, or copying was refused */ }
  };
  const button = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50';
  return (
    <div className="mx-auto flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-slate-600"><strong className="text-slate-800">Found this useful?</strong> Share it with someone who could use it. The link opens this tool and carries nothing you typed.</p>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => void share()} className={button}>
          {canShare ? <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Link copied' : canShare ? 'Share this tool' : 'Copy link'}
        </button>
        <Link to={`/contact?tool=${encodeURIComponent(title)}&path=${encodeURIComponent(pathname)}`} className={button}><MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />Report a problem or suggest an idea</Link>
      </div>
    </div>
  );
};
