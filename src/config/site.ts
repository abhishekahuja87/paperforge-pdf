export const siteConfig = {
  name: 'MyDailyUtils',
  shortName: 'MyDailyUtils',
  url: 'https://www.mydailyutils.in',
  /** City and country the site is run from; shown on About, Contact and in the footer. */
  location: 'Bangalore, India',
  /** Public contact address. Leave empty until the mailbox exists: pages show it only when it is set. */
  contactEmail: 'mydailyutils@gmail.com',
  tagline: 'Everyday tools and utilities, right inside your browser.',
  description:
    'Free browser-based tools and calculators for everyday tasks: tax, loans and savings, dates, units, text, passwords, images and PDFs. Files and numbers are processed in your browser. Request a free tool if you cannot find what you need.',
  privacyHook: 'Runs in your browser',
  /** Added after a tool's name in its page title, for example "Merge PDF Online Free, No Upload | MyDailyUtils". */
  toolTitleSuffix: 'Online Free, No Upload',
};

/** Longest "name + suffix" that still leaves room for " | MyDailyUtils" inside Google's ~65 characters. */
const TITLE_ROOM = 50;

/** Tool page title: adds the suffix only when it fits, so long names keep their own keywords visible. */
export function toolPageTitle(title: string): string {
  const full = `${title} ${siteConfig.toolTitleSuffix}`;
  return full.length <= TITLE_ROOM ? full : title;
}
