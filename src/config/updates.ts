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

const ENTRIES: SiteUpdate[] = [
  {
    date: '2026-11-17',
    path: '/printable-planner-maker',
    tool: 'Printable Planner Maker',
    title: 'Each planner and menu type has its own address',
    summary: 'Weekly, monthly, daily and year planners, and weekly, daily and monthly menus, now open at their own links while the home page keeps one tile for each maker. Switching type keeps your paper and style.',
  },
  {
    date: '2026-11-17',
    path: '/compress-pdf',
    tool: 'Tool help',
    title: 'More answers on popular tools',
    summary: 'Compress PDF, image tools, Images to PDF, PDF to Images, Protect PDF, percentage, EMI, SIP and word count now answer common real-life questions, such as getting a PDF under 100 KB. Duplicate questions were removed.',
  },
  {
    date: '2026-11-17',
    path: '/printable-meal-planner',
    tool: 'Printable meal planner',
    title: 'New: printable weekly, daily and monthly menu planner',
    summary: 'Make a meal plan for the fridge: pick the meals, add a shopping list, and either write the dishes in or type them first. Free, private, as a PDF.',
  },
  {
    date: '2026-11-17',
    path: '/image-resizer',
    tool: 'Image Resizer',
    title: 'One Image Resizer for signature, exam photo, passport and any KB size',
    summary: 'The separate signature, exam photo, passport and 20 to 200 KB resizer pages did the same job, so they are now one tool with KB buttons and form presets.',
  },
  {
    date: '2026-11-17',
    path: '/printable-paper-maker',
    tool: 'Printable paper maker',
    title: 'Paper maker: each paper has its own page',
    summary: 'Pick a paper in the grid and the page opens on it, for example dot grid or graph paper, with your page size kept. One tool, and every paper is easy to reach and share.',
  },
  {
    date: '2026-11-17',
    path: '/printable-paper-maker',
    tool: 'Printable paper maker',
    title: 'Paper maker: pick the paper, change settings only if needed',
    summary: 'Quick starts and the paper style both changed the paper, which was confusing. Now you just pick the paper. Each starts with sensible settings, and everything else is under Adjust everything.',
  },
  {
    date: '2026-11-17',
    path: '/printable-paper-maker',
    tool: 'Printable paper maker',
    title: 'Paper maker: quick starts first, settings tucked away',
    summary: 'Pick a paper style and a quick start, then open "Adjust everything" only if you want to change spacing, size, margins or ink. Dot grid, graph and other pages are linked below the maker.',
  },
  {
    date: '2026-11-17',
    path: '/printable-planner-maker',
    tool: 'Printable planner maker',
    title: 'Calendar and daily planner are now in one place',
    summary: 'The calendar and daily planner pages were the same tool, so they are now in the planner maker. Pick Month, Week, Day or Year at the top.',
  },
  {
    date: '2026-11-17',
    path: '/long-division-for-kids',
    tool: 'Long division',
    title: 'New: long division, step by step',
    summary: 'Watch long division with the bus stop method: divide, multiply, subtract and bring down, with any remainder. Then try it yourself.',
  },
  {
    date: '2026-11-17',
    path: '/long-multiplication-for-kids',
    tool: 'Long multiplication',
    title: 'New: long multiplication, step by step',
    summary: 'Watch long multiplication one digit at a time with every carry, including two-digit multipliers, then try it yourself.',
  },
  {
    date: '2026-11-16',
    path: '/addition-with-carrying-for-kids',
    tool: 'Addition with carrying',
    title: 'New: addition with carrying, step by step',
    summary: 'Watch every carry in column addition, then try it yourself. Examples or your own numbers up to 999.',
  },
  {
    date: '2026-11-16',
    path: '/subtraction-with-borrowing-for-kids',
    tool: 'Subtraction with borrowing',
    title: 'New: subtraction with borrowing, step by step',
    summary: 'Watch how borrowing works, even across a zero, then try it yourself. Examples or your own numbers up to 999.',
  },
  {
    date: '2026-11-16',
    path: '/printable-flashcard-maker',
    tool: 'Printable flashcard maker',
    title: 'One flashcard maker instead of two',
    summary: 'The double-sided flashcards page was the same tool, so it is now part of the Printable Flashcard Maker, which prints double-sided with the alignment test. The old link still opens it.',
  },
  {
    date: '2026-11-16',
    path: '/calligraphy-practice-sheet-generator',
    tool: 'Printable paper',
    title: 'Each paper page now focuses on its own paper',
    summary: 'The dot grid, graph, hexagon, Cornell, calligraphy and cross-stitch pages no longer repeat the full paper-type picker. They show only their own settings and quick starts, with links to the other paper types.',
  },
  {
    date: '2026-11-16',
    path: '/printable-paper-maker',
    tool: 'Printable paper',
    title: 'Quick start buttons now show they were clicked',
    summary: 'The chosen quick start is highlighted and a line says what was applied. The same highlight was added to the watermark presets, the age calculator quick dates and the clock quick buttons.',
  },
  {
    date: '2026-11-14',
    path: '/shadow-explorer-for-kids',
    tool: 'Shadow and Sun Explorer',
    title: 'Fixed: moving the sun in the Hard quiz',
    summary: 'In the "move the sun" questions the sun now follows both the slider and your finger.',
  },
  {
    date: '2026-11-14',
    path: '/solar-system-explorer',
    tool: 'Solar System Explorer',
    title: 'Download a picture of your age on every planet',
    summary: 'Add a name and date of birth, then download or share a picture with the age on all eight planets, and weight if you choose.',
  },
  {
    date: '2026-11-14',
    path: '/shadow-explorer-for-kids',
    tool: 'Shadow and Sun Explorer',
    title: 'New: move the sun and see where the shadow falls',
    summary: 'Drag the sun and a person, tree or flagpole, hide the shadow to guess first, then take a ten-question quiz.',
  },
  {
    date: '2026-11-10',
    path: '/split-pdf',
    tool: 'Split PDF',
    title: 'Odd and even pages, and a live page count',
    summary: 'Pick odd or even pages in one tap, and see how many pages your selection matches before you split.',
  },
  {
    date: '2026-11-10',
    path: '/fd-calculator',
    tool: 'FD Calculator',
    title: 'Interest after tax and a TDS warning',
    summary: 'Enter your tax rate to see the tax on the interest, the maturity after tax and the real yield. A note appears when yearly interest is above the usual TDS limit.',
  },
  {
    date: '2026-11-10',
    path: '/rd-calculator',
    tool: 'RD Calculator',
    title: 'Interest and maturity after tax',
    summary: 'Enter your tax rate on interest to see what you keep after tax.',
  },
  {
    date: '2026-11-10',
    path: '/merge-pdf',
    tool: 'Merge PDF',
    title: 'Page counts, pick pages per file, sort A to Z',
    summary: 'See how many pages each file has and the total, take only some pages from a file (for example 1-3, 5), and sort the files by name.',
  },
  {
    date: '2026-11-10',
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
  {
    date: '2026-11-11',
    path: '/resume-builder',
    tool: 'Resume Builder',
    title: '13 resume templates',
    summary: 'Choose from 13 templates in a picture gallery: plain and black-and-white, colour, horizontal and vertical gradients, banners, a timeline and two side-column designs. Colours follow an accent you can change.',
  },
  {
    date: '2026-11-11',
    path: '/lorem-ipsum-generator',
    tool: 'Lorem Ipsum and Random Text Generator',
    title: 'Random sentences, words and characters',
    summary: 'The text generator now makes random readable sentences, random words and random characters as well as lorem ipsum, and is easier to find when you search for a random text generator.',
  },
  {
    date: '2026-11-11',
    path: '/exercise-library',
    tool: 'Exercise Library',
    title: 'New: Exercise Library with moving pictures',
    summary: 'Browse about 140 gym and home exercises by chest, back, shoulders, arms, legs, core, cardio and stretching, with pictures that fade between the start and end position, steps, and filters for equipment and level.',
  },
  {
    date: '2026-11-11',
    path: '/solar-system-explorer',
    tool: 'Solar System Explorer',
    title: 'New: Solar System Explorer',
    summary: 'Find your age and weight on every planet, compare the size of any two worlds, and see the planets drawn to scale with key facts like day length, year length and gravity.',
  },
  {
    date: '2026-11-11',
    path: '/visiting-card-maker',
    tool: 'Visiting Card Maker',
    title: 'New: Visiting Card Maker',
    summary: 'Make a business card from 17 plain, coloured and gradient designs with an optional QR code. Download a PNG, a PDF, or an A4 sheet of ten cards with cutting marks.',
  },
  {
    date: '2026-11-11',
    path: '/job-description-builder',
    tool: 'Job Description Builder',
    title: 'New: Job Description Builder',
    summary: 'Write a job description from 8 templates (corporate, startup, technical, sales, support, internship, operations, creative) with ready wording. Download a PDF or copy plain text for job portals.',
  },
  {
    date: '2026-11-11',
    path: '/qr-code-generator',
    tool: 'QR Code Generator',
    title: 'Section order fixed',
    summary: 'On phones the code preview appears first, so the section headings no longer carry numbers that looked out of order.',
  },
  {
    date: '2026-11-14',
    path: '/learn-the-clock',
    tool: 'Learn the Clock',
    title: 'New: Learn the Clock for kids',
    summary: 'A big analog clock to move by touch, a hidden time to tap and check, a quiz with levels from o\'clock to every minute, and printable clock worksheets.',
  },
  {
    date: '2026-11-14',
    path: '/kids-money-shop',
    tool: 'Money Shop for Kids',
    title: 'New: Money Shop for Kids',
    summary: 'Play shop with rupee notes and coins: pay exact prices, give change as the shopkeeper, or fill a basket in your own shop with prices you set. Three levels.',
  },
  {
    date: '2026-11-14',
    path: '/tambola-ticket-generator',
    tool: 'Tambola Ticket Generator',
    title: 'New: Tambola tickets and number caller',
    summary: 'Print tambola (housie) tickets, six per sheet using every number from 1 to 90, as a PDF. A number caller with a board, traditional calls and optional voice keeps the game going.',
  },
  {
    date: '2026-11-14',
    path: '/solar-system-explorer',
    tool: 'Solar System Explorer',
    title: 'Add a name and share your result',
    summary: 'Type a name to personalise the page, and use Copy link to share it with the name, birth date, weight and your choices already filled in.',
  },
  {
    date: '2026-11-14',
    path: '/',
    tool: 'Home page',
    title: 'New group: Kids and learning',
    summary: 'Learn the Clock, Money Shop and Tambola now sit together in their own group on the home page.',
  },
];

/** Newest day first (sorted here, so the order they are written in does not matter). Dates must never be later than today. */
export const UPDATES: SiteUpdate[] = ENTRIES.map((entry, index) => ({ entry, index }))
  .sort((a, b) => (a.entry.date === b.entry.date ? a.index - b.index : a.entry.date < b.entry.date ? 1 : -1))
  .map(({ entry }) => entry);

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
