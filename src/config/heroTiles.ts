/**
 * Topic tiles on the home page hero. One per group in COLLECTIONS (src/config/homeSections.ts), each linking to its own page:
 * a collection page from src/content/hubs.ts (every group has one, even a group with a single tool, so all tiles behave the same).
 */
export interface HeroTile {
  /** Id of the matching COLLECTIONS entry; it supplies the tool count. */
  collection: string;
  label: string;
  to: string;
  icon: 'file' | 'image' | 'receipt' | 'trend' | 'calculator' | 'sport' | 'print' | 'briefcase' | 'display' | 'school' | 'kids' | 'share' | 'code' | 'audio' | 'excel';
}

export const HERO_TILES: HeroTile[] = [
  { collection: 'pdf', label: 'PDF tools', to: '/pdf-tools', icon: 'file' },
  { collection: 'images', label: 'Photo and image tools', to: '/photo-and-image-tools', icon: 'image' },
  { collection: 'tax', label: 'Tax and salary calculators', to: '/tax-and-salary-calculators', icon: 'receipt' },
  { collection: 'invest', label: 'Loan and investment calculators', to: '/loan-and-investment-calculators', icon: 'trend' },
  { collection: 'everyday', label: 'Everyday tools', to: '/everyday-tools', icon: 'calculator' },
  { collection: 'sharing', label: 'QR and sharing tools', to: '/qr-and-sharing-tools', icon: 'share' },
  { collection: 'printables', label: 'Printables and templates', to: '/printables-and-templates', icon: 'print' },
  { collection: 'work', label: 'Jobs and business tools', to: '/jobs-and-business-tools', icon: 'briefcase' },
  { collection: 'excel', label: 'Excel template makers', to: '/excel-template-makers', icon: 'excel' },
  { collection: 'study', label: 'Student and writing tools', to: '/student-and-writing-tools', icon: 'school' },
  { collection: 'kids', label: 'Kids learning tools', to: '/kids-learning-tools', icon: 'kids' },
  { collection: 'sports', label: 'Sports and fitness tools', to: '/sports-and-fitness-tools', icon: 'sport' },
  { collection: 'media', label: 'Audio and video tools', to: '/audio-and-video-tools', icon: 'audio' },
  { collection: 'dev', label: 'Developer and data tools', to: '/developer-and-data-tools', icon: 'code' },
  { collection: 'present', label: 'Display and presentation tools', to: '/display-and-presentation-tools', icon: 'display' },
];

/** The small tags above the headline. All of them are true for every tool and are explained on /free-no-limits. */
export const HERO_TAGS: readonly string[] = ['Free', 'No set-up or sign-up', 'Nothing uploaded', 'Stays in your browser', 'No limits'];
