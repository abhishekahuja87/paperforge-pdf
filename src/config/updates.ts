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
    date: '2026-11-14',
    path: '/split-pdf',
    tool: 'Split PDF',
    title: 'Odd and even pages, and a live page count',
    summary: 'Pick odd or even pages in one tap, and see how many pages your selection matches before you split.',
  },
  {
    date: '2026-11-13',
    path: '/fd-calculator',
    tool: 'FD Calculator',
    title: 'Interest after tax and a TDS warning',
    summary: 'Enter your tax rate to see the tax on the interest, the maturity after tax and the real yield. A note appears when yearly interest is above the usual TDS limit.',
  },
  {
    date: '2026-11-13',
    path: '/rd-calculator',
    tool: 'RD Calculator',
    title: 'Interest and maturity after tax',
    summary: 'Enter your tax rate on interest to see what you keep after tax.',
  },
  {
    date: '2026-11-12',
    path: '/merge-pdf',
    tool: 'Merge PDF',
    title: 'Page counts, pick pages per file, sort A to Z',
    summary: 'See how many pages each file has and the total, take only some pages from a file (for example 1-3, 5), and sort the files by name.',
  },
  {
    date: '2026-11-12',
    path: '/percentage-calculator',
    tool: 'Percentage Calculator',
    title: 'The working shown under every answer',
    summary: 'Each result now shows the sum behind it, so you can check it or copy the method.',
  },
  {
    date: '2026-11-11',
    path: '/age-calculator',
    tool: 'Age Calculator',
    title: 'Age eligibility check for forms and exams',
    summary: 'Enter the minimum and maximum age, relaxation years and the cut-off date to see if you are within the limit, with the first and last eligible dates.',
  },
  {
    date: '2026-11-11',
    path: '/gst-calculator',
    tool: 'GST Calculator',
    title: 'Find the GST rate, and IGST for sales between states',
    summary: 'Work out the rate from a price with and without GST, and see IGST instead of CGST and SGST for interstate sales.',
  },
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
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'One list for the guide and the questions',
    summary: 'The written guide and the common questions now sit in a single list with one look, with the steps above it. Fold everything with one button.',
  },
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'Focus mode',
    summary: 'Hide the header, footer and guide to work on just the tool. Press Escape to come back, and share the link with ?focus=1.',
  },
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'Compact tool header and an easier Focus button',
    summary: 'On wide screens the title and the description now sit side by side, and the Focus mode button is at the top right. Collapse all moved right above the list it controls.',
  },
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'Tool header lines up with the tool',
    summary: 'The title, description and Focus button now share the same left and right edges as the tool and the guide below, so the page reads as one clean column.',
  },
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'Merge PDF',
    title: 'Guide now covers page ranges',
    summary: 'The steps and questions explain how to use only some pages of each file, such as 1-3, 5, and point to Organize PDF for reordering pages inside one file.',
  },
  {
    date: '2026-11-10',
    path: '/compress-pdf',
    tool: 'Compress PDF',
    title: 'Guide updated for reduce-to-a-size',
    summary: 'The steps and questions now describe the two modes, when pages become pictures, and how the size limit works.',
  },
  {
    date: '2026-11-10',
    path: '/split-pdf',
    tool: 'Split PDF',
    title: 'Guide mentions odd, even and the live page count',
    summary: 'The steps and questions cover the All, Odd and Even buttons and the count of matching pages.',
  },
  {
    date: '2026-11-10',
    path: '/image-resizer',
    tool: 'All tools',
    title: 'Same upload box in every tool',
    summary: 'Every tool now has the same upload box: the same size, the same "Choose a file or drop it here" line and one line listing the accepted file types.',
  },
  {
    date: '2026-11-10',
    path: '/master-document-studio',
    tool: 'Document studios',
    title: 'Workspace headers line up with their content',
    summary: 'The title and Focus button in the document and display studios now follow the width of the workspace instead of sitting at the page edges.',
  },
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'Downloaded files are named by tool, date and time',
    summary: 'Every file you download now starts with what made it and the date and time, for example merged_2026-11-10_22-56_documents_2files.pdf, so the newest one is easy to find.',
  },
  {
    date: '2026-11-10',
    path: '/',
    tool: 'Home page',
    title: 'Topic sections have a light coloured border',
    summary: 'Each topic panel has a soft border in the same colour as its icons, so sections are easy to tell apart while scrolling.',
  },
  {
    date: '2026-11-10',
    path: '/',
    tool: 'Home page',
    title: 'Wider home page top with topics one click away',
    summary: 'On wide screens the top of the home page now shows the search beside a panel of every topic with its tool count, plus a quick note that files stay in your browser and everything is free.',
  },
  {
    date: '2026-11-10',
    path: '/',
    tool: 'Home page',
    title: 'Home top works on tablets and phones too',
    summary: 'The topic panel now appears from tablet width, including a phone in desktop mode, and phones get a one-line note: files stay in your browser, free, no sign-up.',
  },
  {
    date: '2026-11-10',
    path: '/',
    tool: 'Home page',
    title: 'Simpler home top',
    summary: 'The heading and the search now sit side by side on wide screens, with three short reassurances underneath: files stay in your browser, free with no sign-up, and the number of tools.',
  },
  {
    date: '2026-11-11',
    path: '/',
    tool: 'Home page',
    title: 'Smaller, tighter home top',
    summary: 'The home page heading is smaller and the description is now one short line, since the badges underneath already say the tools are free and private.',
  },
  {
    date: '2026-11-11',
    path: '/',
    tool: 'Home page',
    title: 'Centred home top again',
    summary: 'The home page top is back to the centred layout on every screen size, keeping the smaller heading, the one-line description and the three badges.',
  },
  {
    date: '2026-11-11',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'Shorter privacy badge on every tool',
    summary: 'The long privacy sentence under each tool description is now a small "Your data stays in your browser" badge on the top row, saving a line of space. The full explanation remains in the privacy note further down.',
  },
  {
    date: '2026-11-11',
    path: '/merge-pdf',
    tool: 'All tools',
    title: 'Privacy badge moved beside the back link',
    summary: 'The "Your data stays in your browser" badge now sits next to "All tools" on the left, leaving the right side clear for the Focus mode button.',
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
