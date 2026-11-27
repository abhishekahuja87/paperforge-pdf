/**
 * Topic tiles on the home page hero. One per group in COLLECTIONS (src/config/homeSections.ts), each linking to its own page:
 * a collection page from src/content/hubs.ts (every group has one, even a group with a single tool, so all tiles behave the same).
 */
export interface HeroTile {
  /** Id of the matching COLLECTIONS entry; it supplies the tool count. */
  collection: string;
  label: string;
  /** Two or three of the main jobs in the group, shown under the label so each topic is explained on the page itself. */
  blurb: string;
  to: string;
  icon: 'file' | 'image' | 'receipt' | 'trend' | 'calculator' | 'sport' | 'print' | 'briefcase' | 'display' | 'school' | 'kids' | 'share' | 'code' | 'audio' | 'excel' | 'word' | 'ppt';
}

export const HERO_TILES: HeroTile[] = [
  { collection: 'pdf', label: 'PDF tools', blurb: 'Merge, split, fill, sign', to: '/pdf-tools', icon: 'file' },
  { collection: 'images', label: 'Photo and image tools', blurb: 'Compress, resize, convert', to: '/photo-and-image-tools', icon: 'image' },
  { collection: 'tax', label: 'Tax and salary calculators', blurb: 'Salary and income tax', to: '/tax-and-salary-calculators', icon: 'receipt' },
  { collection: 'invest', label: 'Loan and investment calculators', blurb: 'EMI, SIP, FD, savings', to: '/loan-and-investment-calculators', icon: 'trend' },
  { collection: 'everyday', label: 'Everyday tools', blurb: 'Converters, dates, quick maths', to: '/everyday-tools', icon: 'calculator' },
  { collection: 'sharing', label: 'QR and sharing tools', blurb: 'QR codes and links', to: '/qr-and-sharing-tools', icon: 'share' },
  { collection: 'printables', label: 'Printables and templates', blurb: 'Planners, sheets, certificates', to: '/printables-and-templates', icon: 'print' },
  { collection: 'work', label: 'Jobs and business tools', blurb: 'Resume, invoice, posters', to: '/jobs-and-business-tools', icon: 'briefcase' },
  { collection: 'excel', label: 'Excel templates and makers', blurb: 'Invoice, stock, leads, marks', to: '/excel-template-makers', icon: 'excel' },
  { collection: 'word', label: 'Word document makers', blurb: 'Resume, letters, templates', to: '/word-document-makers', icon: 'word' },
  { collection: 'ppt', label: 'PowerPoint makers', blurb: 'Pitch, lesson, quiz, report', to: '/powerpoint-makers', icon: 'ppt' },
  { collection: 'study', label: 'Student and writing tools', blurb: 'GPA, citations, word count', to: '/student-and-writing-tools', icon: 'school' },
  { collection: 'kids', label: 'Kids learning tools', blurb: 'Clock, maths, worksheets', to: '/kids-learning-tools', icon: 'kids' },
  { collection: 'sports', label: 'Sports and fitness tools', blurb: 'Cricket scorer, workouts', to: '/sports-and-fitness-tools', icon: 'sport' },
  { collection: 'media', label: 'Audio and video tools', blurb: 'Video and audio makers', to: '/audio-and-video-tools', icon: 'audio' },
  { collection: 'dev', label: 'Developer and data tools', blurb: 'JSON, Base64, UUID', to: '/developer-and-data-tools', icon: 'code' },
  { collection: 'present', label: 'Display and presentation tools', blurb: 'Slideshows and menu boards', to: '/display-and-presentation-tools', icon: 'display' },
];

/** The small tags above the headline. All of them are true for every tool and are explained on /free-no-limits. */
export const HERO_TAGS: readonly string[] = ['Free', 'No set-up or sign-up', 'Nothing uploaded', 'Stays in your browser', 'No limits'];
