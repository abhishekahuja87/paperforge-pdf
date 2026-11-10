/**
 * Public list of improvements, newest first. Shown on /whats-new, as a short note at the top of the
 * improved tool for 45 days, and in the "Recently improved" strip on the home page.
 * Add an entry with every user-visible change to a tool, so people can find out what is better.
 */
export interface SiteUpdate {
  /** ISO date, for example 2026-11-10. */
  date: string;
  /** Route of the tool that changed, for example /compress-pdf. */
  path: string;
  /** Tool name shown beside the update. */
  tool: string;
  /** What is new, in a few plain words. */
  title: string;
  /** One or two sentences on what it does for the person. */
  summary: string;
}

export const UPDATES: SiteUpdate[] = [
  {
    date: '2026-11-10',
    path: '/compress-pdf',
    tool: 'Compress PDF',
    title: 'Reduce a PDF to a size you choose',
    summary: 'Type a limit such as 200 KB or 1 MB, or tap a common one. The tool tries a lossless clean-up first and, if needed, finds the sharpest page quality that fits.',
  },
  {
    date: '2026-11-10',
    path: '/sip-calculator',
    tool: 'SIP Calculator',
    title: "Value in today's money and goal mode",
    summary: 'See what the final amount is worth after inflation, and enter a goal to get the monthly SIP that reaches it.',
  },
  {
    date: '2026-11-10',
    path: '/income-tax-calculator',
    tool: 'Income Tax Calculator',
    title: 'Break-even point between the two regimes',
    summary: 'Shows how much in deductions the old regime needs before it beats the new regime, next to what you entered.',
  },
  {
    date: '2026-11-10',
    path: '/image-resizer',
    tool: 'Image Resizer',
    title: 'Checks, full-size preview and Download all',
    summary: 'Each result is checked against your size and pixel limits, can be enlarged before you upload, and several images can be saved at once.',
  },
  {
    date: '2026-11-10',
    path: '/sports-court-size-guide',
    tool: 'Sports Court Size Guide',
    title: 'Names and sizes written on the drawing',
    summary: 'Every line, circle and spot is labelled on the court image with its distance, and the PNG or PDF carries a full marking guide.',
  },
  {
    date: '2026-11-10',
    path: '/emi-calculator',
    tool: 'EMI Calculator',
    title: 'Ways to pay less interest as clear cards',
    summary: 'Each way to save shows the extra payment, the interest saved and the new loan length, with month-wise detail.',
  },
];

export const RECENT_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

export function isRecent(update: SiteUpdate, now: Date = new Date()): boolean {
  const age = now.getTime() - new Date(`${update.date}T00:00:00Z`).getTime();
  return age <= RECENT_DAYS * DAY_MS;
}

/** The newest recent update for a tool route, or undefined. */
export function recentUpdateFor(path: string, now: Date = new Date()): SiteUpdate | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return UPDATES.find((update) => update.path === clean && isRecent(update, now));
}

export function formatUpdateDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
