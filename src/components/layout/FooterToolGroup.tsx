import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FooterToolGroupProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

const WIDE_QUERY = '(min-width: 1024px)';

/**
 * One footer category. On phones and tablets it is folded to a single line so the footer stays short;
 * on wide screens every list is open. The links stay in the page either way, so search engines and
 * screen readers still reach every tool.
 */
export const FooterToolGroup: React.FC<FooterToolGroupProps> = ({ title, count, children }) => {
  const [wide, setWide] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const query = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const open = wide || opened;

  return (
    <details
      open={open}
      onToggle={(event) => { if (!wide) setOpened((event.currentTarget as HTMLDetailsElement).open); }}
      className={`group rounded-lg border border-stone-700/70 lg:border-0 ${opened && !wide ? 'col-span-2 sm:col-span-3' : ''}`}
    >
      <summary
        onClick={(event) => { if (wide) event.preventDefault(); }}
        className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-300 marker:content-none lg:min-h-0 lg:cursor-default lg:px-0 lg:py-0 lg:pb-2 lg:text-stone-400 [&::-webkit-details-marker]:hidden"
      >
        <span>{title} <span className="font-normal normal-case tracking-normal text-stone-500">({count})</span></span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-500 transition group-open:rotate-180 lg:hidden" aria-hidden="true" />
      </summary>
      <div className="px-3 pb-3 lg:px-0 lg:pb-0">{children}</div>
    </details>
  );
};

export default FooterToolGroup;
