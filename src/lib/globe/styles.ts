/** Looks for the globe. To add one, add an entry here and its name to src/locales/packs/globe.ui.en.json (styles). */
export interface GlobeStyle {
  id: string;
  /** Background, top and bottom. */
  bg: [string, string];
  stars: boolean;
  /** Ocean colour, lit side then dark side. */
  ocean: [string, string];
  land: string;
  /** Colours for single countries, by id (for example ice caps). */
  landOverride?: Record<string, string>;
  border: string;
  borderWidth: number;
  /** Colour of the latitude and longitude lines, or null for none. */
  graticule: string | null;
  /** Colour of the glow around the globe (with its own opacity). */
  atmosphere: string;
  /** How much the edge of the globe is darkened, 0 to 1. */
  shading: number;
  /** Draw land as dots in this colour instead of a fill. */
  dots: string | null;
  /** Draw land as a glowing outline in this colour instead of a fill. */
  outline: string | null;
  route: string;
  highlight: string;
  pin: string;
  labelBg: string;
  labelText: string;
  text: string;
}

export const GLOBE_STYLES: GlobeStyle[] = [
  {
    id: 'midnight', bg: ['#050b1f', '#0b1a3a'], stars: true, ocean: ['#17407a', '#06132b'], land: '#2f9e8f', border: 'rgba(255,255,255,0.28)', borderWidth: 0.6,
    graticule: 'rgba(160,200,255,0.10)', atmosphere: 'rgba(90,170,255,0.55)', shading: 0.55, dots: null, outline: null,
    route: '#ffb347', highlight: '#7ff0d0', pin: '#ff7a33', labelBg: 'rgba(8,16,38,0.82)', labelText: '#ffffff', text: '#ffffff',
  },
  {
    id: 'earth', bg: ['#02040c', '#0a1330'], stars: true, ocean: ['#1f6fd0', '#082a63'], land: '#58934b', landOverride: { ATA: '#f4f8fb', GRL: '#eef4f7' },
    border: 'rgba(20,50,20,0.35)', borderWidth: 0.5, graticule: null, atmosphere: 'rgba(120,190,255,0.65)', shading: 0.6, dots: null, outline: null,
    route: '#ffd54a', highlight: '#c8ef7a', pin: '#ff4d4d', labelBg: 'rgba(5,15,40,0.8)', labelText: '#ffffff', text: '#ffffff',
  },
  {
    id: 'daylight', bg: ['#e8f3ff', '#ffffff'], stars: false, ocean: ['#a9d4f5', '#5fa3da'], land: '#f4ecd8', border: 'rgba(110,100,80,0.45)', borderWidth: 0.6,
    graticule: 'rgba(255,255,255,0.35)', atmosphere: 'rgba(110,170,230,0.35)', shading: 0.28, dots: null, outline: null,
    route: '#e8590c', highlight: '#ffd27a', pin: '#d6336c', labelBg: 'rgba(255,255,255,0.94)', labelText: '#1b2a41', text: '#1b2a41',
  },
  {
    id: 'neon', bg: ['#07000f', '#12001f'], stars: false, ocean: ['#14062a', '#07000f'], land: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', borderWidth: 0.6,
    graticule: 'rgba(255,0,200,0.22)', atmosphere: 'rgba(255,0,200,0.35)', shading: 0.35, dots: null, outline: '#19f6e0',
    route: '#ff2bd6', highlight: '#19f6e0', pin: '#ff2bd6', labelBg: 'rgba(10,0,25,0.85)', labelText: '#ffffff', text: '#ffffff',
  },
  {
    id: 'dots', bg: ['#0b1220', '#101c33'], stars: false, ocean: ['#16233f', '#0a1222'], land: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', borderWidth: 0.6,
    graticule: null, atmosphere: 'rgba(120,180,255,0.35)', shading: 0.35, dots: '#9fd0ff', outline: null,
    route: '#ffd166', highlight: '#ffd166', pin: '#ff6b6b', labelBg: 'rgba(8,14,28,0.85)', labelText: '#ffffff', text: '#ffffff',
  },
  {
    id: 'paper', bg: ['#faf7f0', '#f1ece0'], stars: false, ocean: ['#ffffff', '#f4f1e8'], land: '#d9d2c0', border: 'rgba(60,55,45,0.55)', borderWidth: 0.6,
    graticule: 'rgba(60,55,45,0.10)', atmosphere: 'rgba(60,55,45,0.05)', shading: 0.0, dots: null, outline: null,
    route: '#c92a2a', highlight: '#f4a7a7', pin: '#c92a2a', labelBg: '#ffffff', labelText: '#2b2a26', text: '#2b2a26',
  },
];

export const styleById = (id: string) => GLOBE_STYLES.find((style) => style.id === id) ?? GLOBE_STYLES[0];
