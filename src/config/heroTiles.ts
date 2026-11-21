/**
 * Topic tiles on the home page hero. One per group in COLLECTIONS (src/config/homeSections.ts), each linking to its own page:
 * a collection page from src/content/hubs.ts, or the tool itself for a group that has a single tool.
 */
export interface HeroTile {
  /** Id of the matching COLLECTIONS entry; it supplies the tool count. */
  collection: string;
  label: string;
  to: string;
  icon: 'file' | 'image' | 'receipt' | 'trend' | 'calculator' | 'sport' | 'print' | 'briefcase' | 'display' | 'school' | 'kids' | 'share' | 'code';
}

export const HERO_TILES: HeroTile[] = [
  { collection: 'pdf', label: 'PDF tools', to: '/pdf-tools', icon: 'file' },
  { collection: 'images', label: 'Photo and images', to: '/photo-and-image-tools', icon: 'image' },
  { collection: 'tax', label: 'Tax and salary', to: '/tax-and-salary-calculators', icon: 'receipt' },
  { collection: 'invest', label: 'Loans and investing', to: '/loan-and-investment-calculators', icon: 'trend' },
  { collection: 'everyday', label: 'Everyday tools', to: '/everyday-tools', icon: 'calculator' },
  { collection: 'sharing', label: 'QR and sharing', to: '/qr-and-sharing-tools', icon: 'share' },
  { collection: 'printables', label: 'Printables', to: '/printables-and-templates', icon: 'print' },
  { collection: 'work', label: 'Jobs and business', to: '/jobs-and-business-tools', icon: 'briefcase' },
  { collection: 'study', label: 'Students', to: '/student-and-writing-tools', icon: 'school' },
  { collection: 'kids', label: 'Kids learning', to: '/kids-learning-tools', icon: 'kids' },
  { collection: 'sports', label: 'Sports and fitness', to: '/sports-and-fitness-tools', icon: 'sport' },
  { collection: 'dev', label: 'Developer tools', to: '/developer-and-data-tools', icon: 'code' },
  { collection: 'present', label: 'Display and slides', to: '/display-studio', icon: 'display' },
];

/** The small tags above the headline. All of them are true for every tool and are explained on /free-no-limits. */
export const HERO_TAGS: readonly string[] = ['Free', 'No set-up or sign-up', 'Nothing uploaded', 'Stays in your browser', 'No limits'];
