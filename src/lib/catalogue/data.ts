/** Designs, page sizes and layouts for the product catalogue maker. A design is a colour set, two fonts and a cover and card style. */
export type CoverStyle = 'hero' | 'solid' | 'split';
export type CardStyle = 'shadow' | 'border' | 'round' | 'flat';
export type LayoutId = 'two' | 'four' | 'six' | 'nine' | 'list';
export type PageSizeId = 'a4' | 'a5' | 'phone';

export interface CatalogueDesign { id: string; name: string; blurb: string; pal: string; headFont: string; bodyFont: string; cover: CoverStyle; card: CardStyle }
const D = (id: string, name: string, blurb: string, pal: string, headFont: string, bodyFont: string, cover: CoverStyle, card: CardStyle): CatalogueDesign => ({ id, name, blurb, pal, headFont, bodyFont, cover, card });

export const CATALOGUE_DESIGNS: CatalogueDesign[] = [
  D('clean-store', 'Clean Store', 'Fresh teal, easy to read', 'teal-coral', 'Poppins', 'Poppins', 'hero', 'shadow'),
  D('boutique-blush', 'Boutique Blush', 'Soft pink for fashion and gifts', 'blush-rose', 'Playfair Display', 'Poppins', 'solid', 'round'),
  D('gold-luxe', 'Gold Luxe', 'Black and gold, for jewellery and premium goods', 'black-gold', 'Playfair Display', 'Montserrat', 'solid', 'border'),
  D('fresh-market', 'Fresh Market', 'Mint and peach for food and groceries', 'mint-peach', 'Fredoka', 'Baloo 2', 'hero', 'round'),
  D('sunrise', 'Sunrise', 'Warm orange, bold and friendly', 'sunset-orange', 'Montserrat', 'Poppins', 'split', 'shadow'),
  D('navy-business', 'Navy Business', 'Serious and clean, for B2B and hardware', 'navy-silver', 'Montserrat', 'Montserrat', 'split', 'flat'),
  D('royal-purple', 'Royal Purple', 'Rich purple and gold', 'royal-purple', 'DM Serif Display', 'Poppins', 'solid', 'border'),
  D('festive-crimson', 'Festive Crimson', 'Cream and red for sweets and festival items', 'crimson-cream', 'Rozha One', 'Poppins', 'hero', 'border'),
  D('soft-lavender', 'Soft Lavender', 'Gentle purple for beauty and kids', 'lavender', 'Dancing Script', 'Poppins', 'hero', 'round'),
  D('minimal-mono', 'Minimal Black and White', 'Simple and elegant', 'mono', 'DM Serif Display', 'Montserrat', 'split', 'flat'),
  D('sky-fresh', 'Sky Fresh', 'Light blue for toys, kids and gadgets', 'sky-pastel', 'Baloo 2', 'Fredoka', 'hero', 'shadow'),
  D('party-pop', 'Party Pop', 'Bright pink for gifts and party items', 'party-pink', 'Lobster', 'Fredoka', 'solid', 'round'),
];
export const catalogueDesignOf = (id: string): CatalogueDesign => CATALOGUE_DESIGNS.find((d) => d.id === id) ?? CATALOGUE_DESIGNS[0]!;

export interface PageSize { id: PageSizeId; w: number; h: number; ptW: number; ptH: number }
export const PAGE_SIZES: Record<PageSizeId, PageSize> = {
  a4: { id: 'a4', w: 1240, h: 1754, ptW: 595.28, ptH: 841.89 },
  a5: { id: 'a5', w: 1240, h: 1754, ptW: 419.53, ptH: 595.28 },
  phone: { id: 'phone', w: 1080, h: 1920, ptW: 540, ptH: 960 },
};

export const LAYOUTS: Record<LayoutId, { cols: number; rows: number; per: number }> = {
  two: { cols: 1, rows: 2, per: 2 }, four: { cols: 2, rows: 2, per: 4 }, six: { cols: 2, rows: 3, per: 6 }, nine: { cols: 3, rows: 3, per: 9 }, list: { cols: 1, rows: 5, per: 5 },
};
export const MAX_PRODUCTS = 40;
export const CURRENCIES = ['₹', 'Rs.', '$', '€', '£', ''];
