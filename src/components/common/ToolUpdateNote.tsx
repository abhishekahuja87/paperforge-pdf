import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { formatUpdateDate, recentUpdateFor } from '../../config/updates';

/** A short "what is new here" note shown above a tool for 45 days after it improves. */
export const ToolUpdateNote: React.FC<{ path: string }> = ({ path }) => {
  const update = recentUpdateFor(path);
  if (!update) return null;
  return (
    <p lang="en" className="print:hidden mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs leading-relaxed text-stone-700">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-700" aria-hidden="true" />
      <span>
        <strong className="text-orange-900">New ({formatUpdateDate(update.date)}): {update.title}.</strong> {update.summary}{' '}
        <Link to="/whats-new" className="font-semibold text-orange-800 underline">See all updates</Link>
      </span>
    </p>
  );
};

export default ToolUpdateNote;
