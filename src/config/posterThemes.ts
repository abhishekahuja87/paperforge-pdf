/**
 * Designs for the Offer Poster Maker. A design is only data: colours, fonts and a few style choices that the
 * renderer in src/lib/poster understands. To add a design, add one entry here (and nothing else).
 */

export type LayoutKind = 'grid' | 'feature' | 'list';
export type HeaderStyle = 'band' | 'center' | 'diagonal';
export type CardStyle = 'plain' | 'rounded' | 'border' | 'hard' | 'arch' | 'dark' | 'open';
export type BadgeStyle = 'burst' | 'circle' | 'ribbon' | 'tag';
export type BackgroundStyle = 'solid' | 'dots' | 'stripes' | 'confetti' | 'gradient' | 'grid';

export interface PosterColors {
  bg: string;
  /** Second background colour for patterns and gradients. */
  bg2: string;
  headerBg: string;
  nameInk: string;
  headlineInk: string;
  taglineInk: string;
  card: string;
  cardInk: string;
  price: string;
  oldPrice: string;
  badgeBg: string;
  badgeInk: string;
  /** Borders, accents and the contact icons. */
  accent: string;
  footerBg: string;
  footerInk: string;
}

export interface PosterTheme {
  id: string;
  name: string;
  description: string;
  layout: LayoutKind;
  header: HeaderStyle;
  card: CardStyle;
  badge: BadgeStyle;
  background: BackgroundStyle;
  /** CSS font stacks; the first family of each is loaded from Google Fonts (see POSTER_FONT_CSS_URL). */
  fonts: { name: string; headline: string; body: string };
  colors: PosterColors;
}

/** One request for every family the designs use. Only this page asks Google for fonts. */
export const POSTER_FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Pacifico&family=Playfair+Display:wght@600;800&family=Poppins:wght@400;600;700&family=Rozha+One&family=Teko:wght@500;700&display=swap';

/** Families to wait for before drawing, with the weight each design asks for. */
export const POSTER_FONT_FAMILIES = ['Baloo 2', 'Pacifico', 'Playfair Display', 'Poppins', 'Rozha One', 'Teko'];

const TEKO = '"Teko", "Oswald", "Arial Narrow", Impact, sans-serif';
const POPPINS = '"Poppins", "Segoe UI", Roboto, Arial, sans-serif';
const BALOO = '"Baloo 2", "Poppins", "Segoe UI", Arial, sans-serif';
const ROZHA = '"Rozha One", "Playfair Display", Georgia, serif';
const PLAYFAIR = '"Playfair Display", Georgia, "Times New Roman", serif';
const PACIFICO = '"Pacifico", "Brush Script MT", cursive';

export const POSTER_THEMES: PosterTheme[] = [
  {
    id: 'mega-sale', name: 'Mega Sale', description: 'Red and yellow · loud and clear',
    layout: 'grid', header: 'band', card: 'rounded', badge: 'burst', background: 'stripes',
    fonts: { name: POPPINS, headline: TEKO, body: POPPINS },
    colors: { bg: '#fff3c4', bg2: '#ffe27a', headerBg: '#d90f1f', nameInk: '#ffe14d', headlineInk: '#ffffff', taglineInk: '#ffd9dc', card: '#ffffff', cardInk: '#1c1917', price: '#d90f1f', oldPrice: '#78716c', badgeBg: '#ffd400', badgeInk: '#b00012', accent: '#d90f1f', footerBg: '#1c1917', footerInk: '#ffffff' },
  },
  {
    id: 'festive-gold', name: 'Festive Gold', description: 'Maroon and gold · for festivals',
    layout: 'feature', header: 'center', card: 'border', badge: 'circle', background: 'dots',
    fonts: { name: PLAYFAIR, headline: ROZHA, body: POPPINS },
    colors: { bg: '#4a0e1c', bg2: '#5f1727', headerBg: '#f2c14e', nameInk: '#f2c14e', headlineInk: '#4a0e1c', taglineInk: '#f6dfa8', card: '#fff6e0', cardInk: '#3b0a16', price: '#9a1230', oldPrice: '#8a6d4b', badgeBg: '#f2c14e', badgeInk: '#4a0e1c', accent: '#f2c14e', footerBg: '#2f0711', footerInk: '#f6dfa8' },
  },
  {
    id: 'fresh-market', name: 'Fresh Market', description: 'Green and cream · friendly rounded',
    layout: 'grid', header: 'diagonal', card: 'rounded', badge: 'ribbon', background: 'dots',
    fonts: { name: BALOO, headline: BALOO, body: BALOO },
    colors: { bg: '#fff8e7', bg2: '#f4e9c8', headerBg: '#15803d', nameInk: '#fef3c7', headlineInk: '#ffffff', taglineInk: '#dcfce7', card: '#ffffff', cardInk: '#14532d', price: '#15803d', oldPrice: '#78716c', badgeBg: '#f97316', badgeInk: '#ffffff', accent: '#f97316', footerBg: '#14532d', footerInk: '#ffffff' },
  },
  {
    id: 'midnight-neon', name: 'Midnight Neon', description: 'Dark navy · pink and cyan glow',
    layout: 'grid', header: 'center', card: 'dark', badge: 'tag', background: 'grid',
    fonts: { name: POPPINS, headline: TEKO, body: POPPINS },
    colors: { bg: '#0b1020', bg2: '#16203d', headerBg: '#ff2e93', nameInk: '#00e5ff', headlineInk: '#ffffff', taglineInk: '#b6c2e2', card: '#121a33', cardInk: '#eef2ff', price: '#00e5ff', oldPrice: '#8b97b8', badgeBg: '#ff2e93', badgeInk: '#ffffff', accent: '#00e5ff', footerBg: '#070b17', footerInk: '#eef2ff' },
  },
  {
    id: 'boutique-blush', name: 'Boutique Blush', description: 'Pink and rose · soft and elegant',
    layout: 'feature', header: 'center', card: 'arch', badge: 'circle', background: 'gradient',
    fonts: { name: PACIFICO, headline: PLAYFAIR, body: POPPINS },
    colors: { bg: '#fde8ec', bg2: '#f9d2db', headerBg: '#9d174d', nameInk: '#9d174d', headlineInk: '#ffffff', taglineInk: '#7a3550', card: '#ffffff', cardInk: '#4c0f2a', price: '#be185d', oldPrice: '#9a7a86', badgeBg: '#9d174d', badgeInk: '#ffffff', accent: '#b8893a', footerBg: '#9d174d', footerInk: '#ffffff' },
  },
  {
    id: 'sky-electronics', name: 'Sky Electronics', description: 'Blue and lemon · clean and techy',
    layout: 'grid', header: 'diagonal', card: 'border', badge: 'tag', background: 'solid',
    fonts: { name: POPPINS, headline: TEKO, body: POPPINS },
    colors: { bg: '#eaf2ff', bg2: '#d6e6ff', headerBg: '#1d4ed8', nameInk: '#fde047', headlineInk: '#ffffff', taglineInk: '#dbe8ff', card: '#ffffff', cardInk: '#0f1f4d', price: '#1d4ed8', oldPrice: '#64748b', badgeBg: '#fde047', badgeInk: '#1e3a8a', accent: '#1d4ed8', footerBg: '#0f1f4d', footerInk: '#ffffff' },
  },
  {
    id: 'minimal-mono', name: 'Minimal Mono', description: 'Black on paper · one orange accent',
    layout: 'list', header: 'center', card: 'open', badge: 'tag', background: 'solid',
    fonts: { name: POPPINS, headline: PLAYFAIR, body: POPPINS },
    colors: { bg: '#f6f4ee', bg2: '#ebe7dc', headerBg: '#111111', nameInk: '#ff5a1f', headlineInk: '#ffffff', taglineInk: '#57534e', card: '#f6f4ee', cardInk: '#111111', price: '#111111', oldPrice: '#8a847a', badgeBg: '#ff5a1f', badgeInk: '#ffffff', accent: '#ff5a1f', footerBg: '#111111', footerInk: '#f6f4ee' },
  },
  {
    id: 'sunny-pop', name: 'Sunny Pop', description: 'Yellow, black and pink · bold outlines',
    layout: 'grid', header: 'band', card: 'hard', badge: 'burst', background: 'confetti',
    fonts: { name: BALOO, headline: BALOO, body: BALOO },
    colors: { bg: '#ffd23f', bg2: '#ff4d8d', headerBg: '#111111', nameInk: '#ffd23f', headlineInk: '#ffffff', taglineInk: '#ffb3d1', card: '#ffffff', cardInk: '#111111', price: '#e11d74', oldPrice: '#6b7280', badgeBg: '#2dd4bf', badgeInk: '#111111', accent: '#111111', footerBg: '#111111', footerInk: '#ffd23f' },
  },
];

export const findPosterTheme = (id: string): PosterTheme => POSTER_THEMES.find((theme) => theme.id === id) ?? POSTER_THEMES[0]!;
