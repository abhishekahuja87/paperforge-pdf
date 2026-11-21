import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { PROMISE, hasNoLimitBadge } from '../../config/promise';

interface PromisePillProps {
  /** Tool id (the path without slashes). Omit for the home page, which uses the full wording. */
  toolId?: string;
}

/**
 * The one place the site says what it promises. Same look everywhere; tools that handle files with no cap set by this site
 * say "Free · No limits · Stays on your device", every other tool says only that it stays in the browser.
 */
export const PromisePill: React.FC<PromisePillProps> = ({ toolId }) => {
  const full = toolId === undefined || hasNoLimitBadge(toolId);
  return (
    <Link
      to={full ? '/free-no-limits' : '/why-trust-us'}
      className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-stone-700 transition hover:border-orange-400 print:hidden"
    >
      <ShieldCheck className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
      {full ? PROMISE.badge : PROMISE.stays}
    </Link>
  );
};
