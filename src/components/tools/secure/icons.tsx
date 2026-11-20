import React from 'react';

/** Small line icons for the editor toolbar, drawn here so the toolbar does not depend on which icons an icon package ships. */
const PATHS = {
  underline: 'M7 4v7a5 5 0 0 0 10 0V4M5 20h14',
  strike: 'M5 12h14M16 6.5C15.5 5 14 4 12 4c-2.5 0-4 1.2-4 3 0 1.4.9 2.2 2.6 2.8M8 17.5C8.5 19 10 20 12 20c2.5 0 4-1.2 4-3 0-.9-.4-1.6-1-2.1',
  ul: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  ol: 'M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M4 14h2.5l-2.5 3.5h2.5',
  check: 'M4 4.5h4v4H4zM4 14.5h4v4H4zM11 6.5h9M11 16.5h9',
  left: 'M4 6h16M4 10h10M4 14h16M4 18h10',
  center: 'M4 6h16M7 10h10M4 14h16M7 18h10',
  right: 'M4 6h16M10 10h10M4 14h16M10 18h10',
  justify: 'M4 6h16M4 10h16M4 14h16M4 18h16',
  indent: 'M4 5h16M12 10h8M12 14h8M4 19h16M4 9l3 3-3 3',
  outdent: 'M4 5h16M12 10h8M12 14h8M4 19h16M7 9l-3 3 3 3',
  redo: 'M21 7v6h-6M3 17a9 9 0 0 1 15-6.7L21 13',
  table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14',
  line: 'M3 12h18',
  pagebreak: 'M3 12h3M9 12h3M15 12h3M20 12h1M8 6l4-3 4 3M8 18l4 3 4-3',
  eraser: 'M7 21h10M5 13l8-8 6 6-7 7H8l-3-3a1.5 1.5 0 0 1 0-2z',
  key: 'M15 4a5 5 0 1 0 .5 7.5L21 17v3h-3v-2h-2v-2.5M8 9h.01',
  note: 'M5 4h14v16H5zM9 9h6M9 13h6',
  sign: 'M3 18h18M5 14c3-6 4-6 5-2s2 2 4-2',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
} as const;

export type IconName = keyof typeof PATHS;

export const Icon: React.FC<{ name: IconName; className?: string }> = ({ name, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={PATHS[name]} /></svg>
);
