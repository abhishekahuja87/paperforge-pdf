/** Colours, designs and sizes for the invitation card maker. A design is a recipe: colours, fonts, a frame, corner and top and bottom decorations. */
export interface Pal { bg: string; bg2: string; ink: string; soft: string; accent: string; accent2: string; panel: string }
export interface PalDef extends Pal { id: string }

export const PALETTES: PalDef[] = [
  { id: 'ivory-gold', bg: 'FBF6EA', bg2: 'F3E8CC', ink: '3B2A1A', soft: '7A6650', accent: 'B8892B', accent2: 'D9B65A', panel: 'FFFDF6' },
  { id: 'maroon-gold', bg: '5C0F23', bg2: '7A1A33', ink: 'FFF3DC', soft: 'E8CFA0', accent: 'E0B455', accent2: 'F4D58A', panel: '6B1428' },
  { id: 'blush-rose', bg: 'FFF1F3', bg2: 'FFE0E6', ink: '5A2A35', soft: '9A6672', accent: 'C2506B', accent2: 'E58CA2', panel: 'FFFFFF' },
  { id: 'emerald-gold', bg: '0F3D2E', bg2: '165A43', ink: 'F6EFD8', soft: 'CFE3D2', accent: 'D8B04A', accent2: 'F0D58C', panel: '124A38' },
  { id: 'navy-silver', bg: '14213D', bg2: '1F3260', ink: 'F2F5FA', soft: 'B9C4D8', accent: 'E5B94E', accent2: 'C9D2E3', panel: '182A50' },
  { id: 'teal-coral', bg: 'E8F7F5', bg2: 'CFEFEA', ink: '0F3D3B', soft: '4F7B78', accent: 'E8664F', accent2: '14A39A', panel: 'FFFFFF' },
  { id: 'sunset-orange', bg: 'FFF4E5', bg2: 'FFE0B8', ink: '4A2108', soft: '8A5A2D', accent: 'E2631A', accent2: 'F5A524', panel: 'FFFFFF' },
  { id: 'lavender', bg: 'F4EFFE', bg2: 'E4D9FB', ink: '33215C', soft: '6E5AA0', accent: '7C4DDB', accent2: 'B79CF0', panel: 'FFFFFF' },
  { id: 'sky-pastel', bg: 'EAF6FF', bg2: 'D3EBFC', ink: '17324D', soft: '51708C', accent: '2F8FD8', accent2: '7CC4F2', panel: 'FFFFFF' },
  { id: 'mint-peach', bg: 'F0FBF4', bg2: 'FFE8DC', ink: '2D4A3A', soft: '6B8F7A', accent: 'F08A6B', accent2: '6CC49A', panel: 'FFFFFF' },
  { id: 'black-gold', bg: '111111', bg2: '232323', ink: 'F5ECD2', soft: 'BBAF92', accent: 'D4AF37', accent2: 'F3D77A', panel: '1A1A1A' },
  { id: 'crimson-cream', bg: 'FFF8F0', bg2: 'FBE9D8', ink: '4A0F18', soft: '8A4A52', accent: 'B3122F', accent2: 'E0546B', panel: 'FFFFFF' },
  { id: 'mono', bg: 'FFFFFF', bg2: 'F1F1F1', ink: '1A1A1A', soft: '666666', accent: '1A1A1A', accent2: '888888', panel: 'FFFFFF' },
  { id: 'party-pink', bg: 'FFF0FA', bg2: 'FFD9F0', ink: '4B1646', soft: '8C4A86', accent: 'E5239D', accent2: 'FFB000', panel: 'FFFFFF' },
  { id: 'royal-purple', bg: '2B1055', bg2: '43198A', ink: 'FFF4D6', soft: 'D9C8F5', accent: 'F2C14E', accent2: 'FFD98A', panel: '341466' },
  { id: 'night-neon', bg: '0B1026', bg2: '1A1F4B', ink: 'F4F6FF', soft: 'AEB6E8', accent: '36E3C4', accent2: 'FF5FA2', panel: '121838' },
];
export const palOf = (id: string): PalDef => PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;

export type BgKind = 'solid' | 'gradient' | 'radial' | 'dots' | 'stripes' | 'paper' | 'rays';
export type FrameKind = 'none' | 'thin' | 'double' | 'inset' | 'round' | 'thick' | 'dotted';
export type CornerKind = 'none' | 'ornate' | 'floral' | 'leaf' | 'dots';
export type TopKind = 'none' | 'marigold' | 'mandala' | 'balloons' | 'confetti' | 'stars' | 'clouds' | 'bunting' | 'lights' | 'sparkle' | 'band';
export type BottomKind = 'none' | 'wave' | 'florals' | 'hills' | 'diyas';
export type DividerKind = 'none' | 'line' | 'diamond' | 'dots' | 'flourish';
export type PhotoShape = 'circle' | 'arch' | 'round';

export interface Design {
  id: string; name: string; blurb: string; occasions: string[]; pal: string; headFont: string; bodyFont: string;
  bg: BgKind; frame: FrameKind; corners: CornerKind; top: TopKind; bottom: BottomKind; divider: DividerKind; photo: PhotoShape; caps: boolean;
}
const D = (id: string, name: string, blurb: string, occasions: string[], pal: string, headFont: string, bodyFont: string, rest: Omit<Design, 'id' | 'name' | 'blurb' | 'occasions' | 'pal' | 'headFont' | 'bodyFont'>): Design => ({ id, name, blurb, occasions, pal, headFont, bodyFont, ...rest });

export const DESIGNS: Design[] = [
  D('royal-maroon', 'Royal Maroon', 'Deep red and gold with a mandala', ['wedding', 'engagement', 'sangeet', 'anniversary'], 'maroon-gold', 'Rozha One', 'Poppins', { bg: 'radial', frame: 'double', corners: 'ornate', top: 'mandala', bottom: 'none', divider: 'diamond', photo: 'arch', caps: false }),
  D('ivory-floral', 'Ivory Floral', 'Soft cream with gold flowers', ['wedding', 'engagement', 'anniversary', 'naming'], 'ivory-gold', 'Dancing Script', 'Playfair Display', { bg: 'paper', frame: 'inset', corners: 'floral', top: 'none', bottom: 'florals', divider: 'flourish', photo: 'circle', caps: false }),
  D('emerald-palace', 'Emerald Palace', 'Dark green and gold', ['wedding', 'engagement', 'anniversary', 'corporate'], 'emerald-gold', 'Playfair Display', 'Montserrat', { bg: 'radial', frame: 'double', corners: 'ornate', top: 'mandala', bottom: 'none', divider: 'diamond', photo: 'arch', caps: true }),
  D('blush-garden', 'Blush Garden', 'Pink petals and script names', ['wedding', 'engagement', 'baby-shower', 'anniversary', 'birthday'], 'blush-rose', 'Dancing Script', 'Poppins', { bg: 'solid', frame: 'round', corners: 'floral', top: 'none', bottom: 'florals', divider: 'flourish', photo: 'circle', caps: false }),
  D('marigold-welcome', 'Marigold Welcome', 'Flower garland for a warm welcome', ['housewarming', 'puja', 'wedding', 'sangeet', 'naming', 'festival'], 'sunset-orange', 'Rozha One', 'Poppins', { bg: 'paper', frame: 'thin', corners: 'none', top: 'marigold', bottom: 'none', divider: 'dots', photo: 'circle', caps: false }),
  D('minimal-mono', 'Minimal Black and White', 'Clean and simple', ['wedding', 'corporate', 'opening', 'get-together', 'graduation'], 'mono', 'DM Serif Display', 'Montserrat', { bg: 'solid', frame: 'thin', corners: 'none', top: 'none', bottom: 'none', divider: 'line', photo: 'round', caps: true }),
  D('crimson-gold', 'Crimson Celebration', 'Cream with red ornaments', ['anniversary', 'wedding', 'engagement', 'puja'], 'crimson-cream', 'Playfair Display', 'Poppins', { bg: 'paper', frame: 'double', corners: 'ornate', top: 'sparkle', bottom: 'none', divider: 'diamond', photo: 'circle', caps: false }),
  D('navy-stars', 'Navy Stars', 'Midnight blue with gold stars', ['anniversary', 'graduation', 'corporate', 'farewell', 'get-together'], 'navy-silver', 'Playfair Display', 'Montserrat', { bg: 'gradient', frame: 'thin', corners: 'dots', top: 'stars', bottom: 'none', divider: 'diamond', photo: 'circle', caps: true }),
  D('confetti-party', 'Confetti Party', 'Bright pink with bunting and confetti', ['birthday', 'kids-birthday', 'get-together', 'farewell'], 'party-pink', 'Lobster', 'Fredoka', { bg: 'dots', frame: 'none', corners: 'none', top: 'bunting', bottom: 'none', divider: 'dots', photo: 'circle', caps: false }),
  D('balloon-bash', 'Balloon Bash', 'Sky blue with balloons', ['birthday', 'kids-birthday', 'baby-shower'], 'sky-pastel', 'Fredoka', 'Baloo 2', { bg: 'gradient', frame: 'round', corners: 'none', top: 'balloons', bottom: 'hills', divider: 'dots', photo: 'circle', caps: false }),
  D('neon-night', 'Neon Night', 'Dark with bright neon colours', ['birthday', 'get-together', 'farewell', 'opening', 'festival'], 'night-neon', 'Anton', 'Montserrat', { bg: 'gradient', frame: 'thick', corners: 'none', top: 'stars', bottom: 'none', divider: 'line', photo: 'round', caps: true }),
  D('black-gold', 'Black and Gold', 'Bold black with gold sparkle', ['birthday', 'anniversary', 'opening', 'corporate', 'get-together'], 'black-gold', 'Abril Fatface', 'Poppins', { bg: 'solid', frame: 'double', corners: 'dots', top: 'sparkle', bottom: 'none', divider: 'diamond', photo: 'round', caps: true }),
  D('little-clouds', 'Little Clouds', 'Soft blue sky for little ones', ['baby-shower', 'naming', 'kids-birthday'], 'sky-pastel', 'Baloo 2', 'Fredoka', { bg: 'gradient', frame: 'none', corners: 'none', top: 'clouds', bottom: 'hills', divider: 'dots', photo: 'circle', caps: false }),
  D('mint-peach', 'Mint and Peach', 'Fresh and playful', ['baby-shower', 'kids-birthday', 'birthday', 'naming'], 'mint-peach', 'Fredoka', 'Baloo 2', { bg: 'dots', frame: 'round', corners: 'none', top: 'confetti', bottom: 'wave', divider: 'dots', photo: 'circle', caps: false }),
  D('soft-lavender', 'Soft Lavender', 'Gentle purple with stars', ['baby-shower', 'naming', 'engagement', 'birthday'], 'lavender', 'Dancing Script', 'Poppins', { bg: 'gradient', frame: 'inset', corners: 'leaf', top: 'stars', bottom: 'none', divider: 'flourish', photo: 'circle', caps: false }),
  D('diwali-lights', 'Festival of Lights', 'Rich purple with lamps and lights', ['festival', 'get-together', 'puja', 'corporate'], 'royal-purple', 'Rozha One', 'Poppins', { bg: 'radial', frame: 'thin', corners: 'none', top: 'lights', bottom: 'diyas', divider: 'diamond', photo: 'circle', caps: false }),
  D('festive-crimson', 'Festive Garland', 'Cream and red with flowers and lamps', ['festival', 'puja', 'housewarming', 'get-together'], 'crimson-cream', 'Rozha One', 'Poppins', { bg: 'paper', frame: 'thin', corners: 'none', top: 'marigold', bottom: 'diyas', divider: 'dots', photo: 'circle', caps: false }),
  D('clean-corporate', 'Clean Corporate', 'A coloured header band', ['corporate', 'opening', 'farewell', 'graduation', 'get-together'], 'navy-silver', 'Montserrat', 'Montserrat', { bg: 'solid', frame: 'none', corners: 'none', top: 'band', bottom: 'none', divider: 'line', photo: 'round', caps: true }),
  D('teal-modern', 'Teal Modern', 'Fresh teal with waves', ['corporate', 'opening', 'get-together', 'baby-shower', 'housewarming'], 'teal-coral', 'Poppins', 'Poppins', { bg: 'dots', frame: 'none', corners: 'none', top: 'none', bottom: 'wave', divider: 'line', photo: 'round', caps: true }),
  D('grand-opening', 'Grand Opening', 'Bold orange with bunting', ['opening', 'corporate', 'festival', 'get-together'], 'sunset-orange', 'Anton', 'Poppins', { bg: 'rays', frame: 'thick', corners: 'none', top: 'bunting', bottom: 'none', divider: 'line', photo: 'round', caps: true }),
  D('graduation-night', 'Graduation Night', 'Royal blue and gold', ['graduation', 'farewell', 'corporate'], 'navy-silver', 'DM Serif Display', 'Poppins', { bg: 'radial', frame: 'double', corners: 'ornate', top: 'stars', bottom: 'none', divider: 'diamond', photo: 'circle', caps: false }),
  D('garden-party', 'Garden Party', 'Mint and peach with leaves', ['get-together', 'baby-shower', 'engagement', 'birthday', 'housewarming'], 'mint-peach', 'Playfair Display', 'Poppins', { bg: 'paper', frame: 'inset', corners: 'leaf', top: 'none', bottom: 'florals', divider: 'flourish', photo: 'circle', caps: false }),
  D('sunset-wave', 'Sunset Waves', 'Warm colours and soft waves', ['get-together', 'birthday', 'opening', 'festival', 'housewarming'], 'sunset-orange', 'Montserrat', 'Poppins', { bg: 'gradient', frame: 'none', corners: 'none', top: 'none', bottom: 'wave', divider: 'dots', photo: 'circle', caps: true }),
  D('lavender-dusk', 'Lavender Dusk', 'Dark purple with sparkle', ['engagement', 'anniversary', 'birthday', 'get-together', 'sangeet'], 'royal-purple', 'DM Serif Display', 'Poppins', { bg: 'radial', frame: 'inset', corners: 'none', top: 'sparkle', bottom: 'none', divider: 'flourish', photo: 'arch', caps: false }),
  D('sangeet-night', 'Sangeet Night', 'Black and gold with lights', ['sangeet', 'wedding', 'engagement', 'birthday'], 'black-gold', 'Rozha One', 'Poppins', { bg: 'radial', frame: 'thin', corners: 'dots', top: 'lights', bottom: 'none', divider: 'diamond', photo: 'arch', caps: false }),
];
export const designOf = (id: string): Design => DESIGNS.find((d) => d.id === id) ?? DESIGNS[0]!;

export type SizeId = 'portrait' | 'square' | 'story' | 'print';
export interface InviteSize { id: SizeId; w: number; h: number; maxPreview: number }
export const SIZES: Record<SizeId, InviteSize> = {
  portrait: { id: 'portrait', w: 1080, h: 1350, maxPreview: 480 },
  square: { id: 'square', w: 1080, h: 1080, maxPreview: 480 },
  story: { id: 'story', w: 1080, h: 1920, maxPreview: 340 },
  print: { id: 'print', w: 1240, h: 1754, maxPreview: 440 },
};

export const HEAD_FONTS = ['Playfair Display', 'Rozha One', 'DM Serif Display', 'Abril Fatface', 'Dancing Script', 'Lobster', 'Pacifico', 'Fredoka', 'Baloo 2', 'Montserrat', 'Poppins', 'Bebas Neue', 'Oswald', 'Anton', 'Teko'];
export const BODY_FONTS = ['Poppins', 'Montserrat', 'Baloo 2', 'Fredoka', 'Playfair Display', 'Oswald'];
