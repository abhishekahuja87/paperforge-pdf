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
  /** CSS font stacks. The fonts are bundled with the site (see components/tools/shops/posterFonts.css). */
  fonts: { name: string; headline: string; body: string };
  colors: PosterColors;
}

/** Families the designs use; the poster tools wait for these before drawing. */
export const POSTER_FONT_FAMILIES = [
  'Poppins', 'Teko', 'Baloo 2', 'Montserrat', 'Fredoka', 'Oswald', 'Playfair Display', 'Dancing Script', 'Pacifico', 'Rozha One', 'Bebas Neue', 'Anton', 'Lobster', 'Abril Fatface', 'DM Serif Display',
];

const TEKO = '"Teko", "Oswald", "Arial Narrow", Impact, sans-serif';
const POPPINS = '"Poppins", "Segoe UI", Roboto, Arial, sans-serif';
const BALOO = '"Baloo 2", "Poppins", "Segoe UI", Arial, sans-serif';
const ROZHA = '"Rozha One", "Playfair Display", Georgia, serif';
const PLAYFAIR = '"Playfair Display", Georgia, "Times New Roman", serif';
const PACIFICO = '"Pacifico", "Brush Script MT", cursive';
const MONTSERRAT = '"Montserrat", "Poppins", "Segoe UI", Arial, sans-serif';
const FREDOKA = '"Fredoka", "Baloo 2", "Segoe UI", Arial, sans-serif';
const OSWALD = '"Oswald", "Arial Narrow", Impact, sans-serif';
const DANCING = '"Dancing Script", "Pacifico", "Brush Script MT", cursive';
const BEBAS = '"Bebas Neue", "Oswald", Impact, "Arial Narrow", sans-serif';
const ANTON = '"Anton", Impact, "Arial Narrow", sans-serif';
const LOBSTER = '"Lobster", "Pacifico", "Brush Script MT", cursive';
const ABRIL = '"Abril Fatface", "Playfair Display", Georgia, serif';
const DMSERIF = '"DM Serif Display", "Playfair Display", Georgia, serif';

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
  {
    id: 'royal-navy', name: 'Royal Navy', description: 'Navy and gold · premium and calm',
    layout: 'feature', header: 'center', card: 'border', badge: 'circle', background: 'gradient',
    fonts: { name: DMSERIF, headline: DMSERIF, body: MONTSERRAT },
    colors: { bg: '#0c1a3a', bg2: '#14275a', headerBg: '#d4a64a', nameInk: '#e8c872', headlineInk: '#0c1a3a', taglineInk: '#b9c4e4', card: '#f8f4e8', cardInk: '#0c1a3a', price: '#8a5a0b', oldPrice: '#7a7f90', badgeBg: '#d4a64a', badgeInk: '#0c1a3a', accent: '#d4a64a', footerBg: '#07102a', footerInk: '#e8c872' },
  },
  {
    id: 'citrus-burst', name: 'Citrus Burst', description: 'Orange and lime · fun and fresh',
    layout: 'grid', header: 'band', card: 'rounded', badge: 'ribbon', background: 'dots',
    fonts: { name: FREDOKA, headline: FREDOKA, body: FREDOKA },
    colors: { bg: '#fff7e0', bg2: '#ffe9a8', headerBg: '#f25c05', nameInk: '#fff2a8', headlineInk: '#ffffff', taglineInk: '#ffe8d6', card: '#ffffff', cardInk: '#3a2100', price: '#e04e00', oldPrice: '#8a7a68', badgeBg: '#84cc16', badgeInk: '#1a2e05', accent: '#84cc16', footerBg: '#3a2100', footerInk: '#fff2a8' },
  },
  {
    id: 'matcha-calm', name: 'Matcha Calm', description: 'Sage and gold · natural and clean',
    layout: 'feature', header: 'center', card: 'arch', badge: 'circle', background: 'solid',
    fonts: { name: DMSERIF, headline: DMSERIF, body: POPPINS },
    colors: { bg: '#eef3e6', bg2: '#dfe8d2', headerBg: '#3f5d3a', nameInk: '#3f5d3a', headlineInk: '#f4f7ec', taglineInk: '#5a6e52', card: '#ffffff', cardInk: '#27371f', price: '#3f5d3a', oldPrice: '#8b9784', badgeBg: '#c9a24a', badgeInk: '#27371f', accent: '#c9a24a', footerBg: '#3f5d3a', footerInk: '#f4f7ec' },
  },
  {
    id: 'street-black', name: 'Street Black', description: 'Black and yellow · bold streetwear',
    layout: 'grid', header: 'band', card: 'hard', badge: 'tag', background: 'stripes',
    fonts: { name: MONTSERRAT, headline: ANTON, body: MONTSERRAT },
    colors: { bg: '#f2f2f2', bg2: '#e2e2e2', headerBg: '#0a0a0a', nameInk: '#ffe600', headlineInk: '#ffffff', taglineInk: '#cfcfcf', card: '#ffffff', cardInk: '#0a0a0a', price: '#e60023', oldPrice: '#6b6b6b', badgeBg: '#ffe600', badgeInk: '#0a0a0a', accent: '#ffe600', footerBg: '#0a0a0a', footerInk: '#ffe600' },
  },
  {
    id: 'rose-gold', name: 'Rose Gold', description: 'Blush and copper · script and soft',
    layout: 'feature', header: 'center', card: 'plain', badge: 'circle', background: 'gradient',
    fonts: { name: DANCING, headline: PLAYFAIR, body: POPPINS },
    colors: { bg: '#fbeee9', bg2: '#f3d6cc', headerBg: '#b76e79', nameInk: '#8a4b55', headlineInk: '#ffffff', taglineInk: '#8a5a60', card: '#ffffff', cardInk: '#4a2a2e', price: '#a64b5a', oldPrice: '#a08a8a', badgeBg: '#b76e79', badgeInk: '#ffffff', accent: '#d4a373', footerBg: '#8a4b55', footerInk: '#fbeee9' },
  },
  {
    id: 'ocean-breeze', name: 'Ocean Breeze', description: 'Teal and coral · light and friendly',
    layout: 'grid', header: 'diagonal', card: 'rounded', badge: 'burst', background: 'dots',
    fonts: { name: LOBSTER, headline: LOBSTER, body: POPPINS },
    colors: { bg: '#e6f7fb', bg2: '#cdeef6', headerBg: '#0e7490', nameInk: '#fef08a', headlineInk: '#ffffff', taglineInk: '#cffafe', card: '#ffffff', cardInk: '#083344', price: '#0e7490', oldPrice: '#6b8a94', badgeBg: '#fb923c', badgeInk: '#431407', accent: '#fb923c', footerBg: '#083344', footerInk: '#e6f7fb' },
  },
  {
    id: 'grocery-fresh', name: 'Grocery Fresh', description: 'Red and green · weekly offers',
    layout: 'grid', header: 'band', card: 'border', badge: 'ribbon', background: 'grid',
    fonts: { name: BEBAS, headline: BEBAS, body: OSWALD },
    colors: { bg: '#f7fbea', bg2: '#e6f2c8', headerBg: '#c8102e', nameInk: '#ffffff', headlineInk: '#ffe45c', taglineInk: '#ffd6dc', card: '#ffffff', cardInk: '#1a2e0a', price: '#c8102e', oldPrice: '#6d7a60', badgeBg: '#2f8f2f', badgeInk: '#ffffff', accent: '#2f8f2f', footerBg: '#1f5f1f', footerInk: '#ffffff' },
  },
  {
    id: 'pastel-pop', name: 'Pastel Pop', description: 'Lilac and peach · playful and soft',
    layout: 'grid', header: 'center', card: 'rounded', badge: 'circle', background: 'confetti',
    fonts: { name: FREDOKA, headline: FREDOKA, body: FREDOKA },
    colors: { bg: '#f3ecff', bg2: '#ffd9c7', headerBg: '#7c5cff', nameInk: '#5b3fd6', headlineInk: '#ffffff', taglineInk: '#6d5aa8', card: '#ffffff', cardInk: '#2a1f5a', price: '#7c5cff', oldPrice: '#9a93b8', badgeBg: '#ff8a5c', badgeInk: '#ffffff', accent: '#ff8a5c', footerBg: '#5b3fd6', footerInk: '#ffffff' },
  },
  {
    id: 'diwali-glow', name: 'Diwali Glow', description: 'Purple and marigold · festival nights',
    layout: 'grid', header: 'center', card: 'border', badge: 'burst', background: 'gradient',
    fonts: { name: ABRIL, headline: ABRIL, body: POPPINS },
    colors: { bg: '#2b0a3d', bg2: '#4b1463', headerBg: '#ffb703', nameInk: '#ffb703', headlineInk: '#2b0a3d', taglineInk: '#f3d9ff', card: '#fff7e6', cardInk: '#2b0a3d', price: '#b4231a', oldPrice: '#86708f', badgeBg: '#ffb703', badgeInk: '#2b0a3d', accent: '#ffb703', footerBg: '#1a0626', footerInk: '#ffb703' },
  },
  {
    id: 'clean-retail', name: 'Clean Retail', description: 'Teal and white · tidy price list',
    layout: 'list', header: 'band', card: 'plain', badge: 'tag', background: 'solid',
    fonts: { name: MONTSERRAT, headline: OSWALD, body: MONTSERRAT },
    colors: { bg: '#ffffff', bg2: '#eef2f7', headerBg: '#0f766e', nameInk: '#ccfbf1', headlineInk: '#ffffff', taglineInk: '#b8ebe4', card: '#f5f8fb', cardInk: '#0f172a', price: '#0f766e', oldPrice: '#7b8794', badgeBg: '#f59e0b', badgeInk: '#1c1300', accent: '#0f766e', footerBg: '#0f172a', footerInk: '#ffffff' },
  },
];

export const findPosterTheme = (id: string): PosterTheme => POSTER_THEMES.find((theme) => theme.id === id) ?? POSTER_THEMES[0]!;
