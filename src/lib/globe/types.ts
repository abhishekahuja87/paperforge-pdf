/** Shared types for the Globe Video Maker. */
export interface Stop {
  /** Name shown on the video. Can be edited by the person. */
  label: string;
  lon: number;
  lat: number;
  /** 'country' or 'city' or 'point' (typed coordinates). Decides how close the camera comes. */
  kind: 'country' | 'city' | 'point';
  /** Id of the country the place is in (or is). A country is highlighted by the "Highlight the countries" switch; a city by its own tick box. */
  countryId?: string;
  /** Number of a photo for this stop, kept by the screen. Not saved between visits. */
  photoId?: number;
  /** For a city or point: highlight its country. */
  highlight?: boolean;
  /** Angular span of the place in degrees, for fitting the camera. */
  span?: number;
}

export type Motion = 'fly' | 'spin' | 'zoom';
export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'glow' | 'rail';
export type MoverStyle = 'plane' | 'train' | 'car' | 'bus' | 'ship' | 'dot' | 'face' | 'none';
export type PinStyle = 'pin' | 'ring';
export type ArcStyle = 'lifted' | 'flat';
/** How the stops are joined: one after another (trip), one origin to every other place (fan), or no route at all (places visited). */
export type Layout = 'chain' | 'fan' | 'visited';
export type ShapeId = 'reel' | 'wide' | 'square' | 'portrait';

export interface GlobeOptions {
  layout: Layout;
  styleId: string;
  motion: Motion;
  line: LineStyle;
  arc: ArcStyle;
  mover: MoverStyle;
  pin: PinStyle;
  highlight: boolean;
  labels: boolean;
  caption: string;
  seconds: number;
  /** A vehicle for each hop, or 'same' to use the one in `mover`. */
  legMovers: ('same' | MoverStyle)[];
  /** Colour of the route and the moving marker, or empty for the look's own colour. */
  routeColor: string;
  /** Show the distance of each hop as a label. */
  distance: 'off' | 'km' | 'mi';
  /** Shade the night side of the world. */
  night: boolean;
  logoCorner: 'tl' | 'tr' | 'bl' | 'br';
  logoSize: 'small' | 'medium' | 'large';
}

/** What the camera and the route look like at one moment. */
export interface Frame {
  lon: number;
  lat: number;
  /** 1 shows the whole globe. Larger comes closer. */
  zoom: number;
  /** For each hop between two stops, how much of it has been drawn (0 to 1). */
  routes: number[];
  /** For each stop, how far its pin has popped in (0 to 1). */
  pins: number[];
  /** How strongly the countries of the stops are highlighted (0 to 1). */
  glow: number[];
  /** Moving markers: the hop each is on and the fraction of that hop. Empty when nothing is moving. */
  heads: { hop: number; t: number }[];
  /** For each stop, how visible its photo is (0 to 1). */
  photos: number[];
  /** Opacity of the caption (0 to 1). */
  caption: number;
  /** Seconds since the start, used for small animations like the pulse. */
  time: number;
}
