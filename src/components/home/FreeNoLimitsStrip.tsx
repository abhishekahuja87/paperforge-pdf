import React from 'react';
import { Link } from 'react-router-dom';
import { Infinity as InfinityIcon } from 'lucide-react';
import { PROMISE } from '../../config/promise';

/** Home-page strip that states the promise and links to the page that explains it. */
export const FreeNoLimitsStrip: React.FC = () => (
  <section aria-label="Free with no limits" className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 sm:p-4">
    <div className="flex items-start gap-3">
      <InfinityIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-black tracking-tight text-stone-900 sm:text-lg">Free PDF and photo tools. No limits. Nothing uploaded.</h2>
        <p className="text-xs leading-5 text-stone-700 sm:text-sm">
          {PROMISE.short} Make PDFs fillable, split large PDFs, resize photos in bulk, number pages and more.{' '}
          <Link to="/free-no-limits" className="font-bold text-emerald-800 underline">See what is free</Link>
        </p>
      </div>
    </div>
  </section>
);
