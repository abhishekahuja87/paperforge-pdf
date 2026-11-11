/**
 * Visiting card templates. A template is a small description (font, where the colour goes, page colour);
 * `drawCard` paints any of them from the same card details, so a new template is one entry here.
 */
import type { ResumeFont } from '../careers/resumeTemplates';

export type CardLayout = 'plain' | 'center' | 'top-band' | 'left-panel' | 'full' | 'bottom-band' | 'corner' | 'stripe';
export type CardFill = 'solid' | 'h' | 'v' | 'd';

export interface CardTemplateSpec {
  id: string;
  name: string;
  blurb: string;
  /** Uses the accent colour picker. Black and white designs ignore it. */
  colour: boolean;
  font: ResumeFont;
  layout: CardLayout;
  /** How the coloured area is filled: one colour, or a gradient across, down or diagonally. */
  fill: CardFill;
  /** Colour of the card paper. */
  page: string;
  accent: string;
  /** A thin colour bar down the left edge (plain layout). */
  bar?: boolean;
  /** A short colour line under the name block. */
  rule?: boolean;
}

export const CARD_TEMPLATES: CardTemplateSpec[] = [
  { id: 'classic', name: 'Classic', blurb: 'Serif, black on white', colour: false, font: 'serif', layout: 'plain', fill: 'solid', page: '#ffffff', accent: '#111111', rule: true },
  { id: 'minimal', name: 'Minimal', blurb: 'Quiet and airy', colour: false, font: 'humanist', layout: 'plain', fill: 'solid', page: '#ffffff', accent: '#111111' },
  { id: 'developer', name: 'Developer', blurb: 'Monospace, plain', colour: false, font: 'mono', layout: 'plain', fill: 'solid', page: '#ffffff', accent: '#111111', rule: true },
  { id: 'cream', name: 'Cream', blurb: 'Warm paper, serif', colour: true, font: 'serif', layout: 'plain', fill: 'solid', page: '#fbf5e9', accent: '#9a3412', rule: true },
  { id: 'edge', name: 'Edge', blurb: 'Colour bar on the left', colour: true, font: 'sans', layout: 'plain', fill: 'solid', page: '#ffffff', accent: '#1d4ed8', bar: true },
  { id: 'noir', name: 'Noir', blurb: 'Dark with a gold accent', colour: true, font: 'sans', layout: 'plain', fill: 'solid', page: '#0b0f19', accent: '#f5b400', rule: true },
  { id: 'centred', name: 'Centred', blurb: 'Serif, everything centred', colour: true, font: 'serif', layout: 'center', fill: 'solid', page: '#ffffff', accent: '#1e3a5f', rule: true },
  { id: 'gala', name: 'Gala', blurb: 'Dark, centred, gold', colour: true, font: 'serif', layout: 'center', fill: 'solid', page: '#111827', accent: '#d4af37', rule: true },
  { id: 'banner', name: 'Banner', blurb: 'Solid colour top band', colour: true, font: 'sans', layout: 'top-band', fill: 'solid', page: '#ffffff', accent: '#be123c' },
  { id: 'sunrise', name: 'Sunrise', blurb: 'Gradient top band', colour: true, font: 'humanist', layout: 'top-band', fill: 'h', page: '#ffffff', accent: '#ea580c' },
  { id: 'ocean', name: 'Ocean panel', blurb: 'Gradient side panel with initials', colour: true, font: 'sans', layout: 'left-panel', fill: 'v', page: '#ffffff', accent: '#0369a1' },
  { id: 'forest', name: 'Forest panel', blurb: 'Solid side panel with initials', colour: true, font: 'serif', layout: 'left-panel', fill: 'solid', page: '#ffffff', accent: '#15803d' },
  { id: 'violet', name: 'Violet wave', blurb: 'Full diagonal gradient', colour: true, font: 'sans', layout: 'full', fill: 'd', page: '#ffffff', accent: '#6d28d9' },
  { id: 'lagoon', name: 'Lagoon', blurb: 'Full horizontal gradient', colour: true, font: 'humanist', layout: 'full', fill: 'h', page: '#ffffff', accent: '#0f766e' },
  { id: 'footer', name: 'Footer', blurb: 'Contact details in a colour strip', colour: true, font: 'sans', layout: 'bottom-band', fill: 'solid', page: '#ffffff', accent: '#334155' },
  { id: 'corner', name: 'Corner', blurb: 'Colour triangle in the corner', colour: true, font: 'sans', layout: 'corner', fill: 'solid', page: '#ffffff', accent: '#db2777' },
  { id: 'stripe', name: 'Stripe', blurb: 'Gradient stripe on the right', colour: true, font: 'humanist', layout: 'stripe', fill: 'v', page: '#ffffff', accent: '#4f46e5' },
];

export const DEFAULT_CARD_TEMPLATE = 'banner';

export const getCardTemplate = (id: string): CardTemplateSpec => CARD_TEMPLATES.find((item) => item.id === id) ?? CARD_TEMPLATES[0];
export const isCardTemplateId = (id: unknown): id is string => typeof id === 'string' && CARD_TEMPLATES.some((item) => item.id === id);
