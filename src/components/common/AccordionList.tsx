import React from 'react';

export interface AccordionItem {
  key: string;
  title: string;
  /** Heading level of the title inside the row, so the page outline stays correct. */
  level?: 2 | 3;
  children: React.ReactNode;
}

/**
 * One look for every foldable row on a tool page: the written sections and the questions share this card.
 * Rows start open so all text is visible; the page's "Collapse all" button folds them.
 */
export const AccordionList: React.FC<{ items: AccordionItem[]; lang?: string }> = ({ items, lang = 'en' }) => (
  <div lang={lang} className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
    {items.map((item) => {
      const Heading = item.level === 3 ? 'h3' : 'h2';
      return (
        <details key={item.key} open className="group px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <Heading className="text-sm font-semibold text-stone-900">{item.title}</Heading>
            <span aria-hidden="true" className="text-lg leading-none text-orange-600 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-2 space-y-2 text-[13px] leading-6 text-stone-700">{item.children}</div>
        </details>
      );
    })}
  </div>
);

export default AccordionList;
