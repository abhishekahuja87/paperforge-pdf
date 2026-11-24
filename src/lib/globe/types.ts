/** Shared types for the Globe Video Maker. */
export interface Stop {
  /** Name shown on the video. Can be edited by the person. */
  label: string;
  lon: number;
  lat: number;
  /** 'country' or 'city' or 'point' (typed coordinates). Decides how close the camera comes. */
  kind: 'country' | 'city' | 'point';
  /** Id of the country to highlight, when the stop is a country. */
  countryId?: string;
  /** Angular span of the place in degrees, for fitting the camera. */
  span?: number;
}

export type Motion = 'fly' | 'spin' | 'zoom';
export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'glow';
export type MoverStyle = 'plane' | 'dot' | 'none';
export type PinStyle = 'pin' | 'ring';
export type ArcStyle = 'lifted' | 'flat';
export type ShapeId = 'reel' | 'wide' | 'square' | 'portrait';

export interface GlobeOptions {
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
  /** Position of the moving marker, as the hop it is on and the fraction of that hop. Null when nothing is moving. */
  head: { hop: number; t: number } | null;
  /** Opacity of the caption (0 to 1). */
  caption: number;
  /** Seconds since the start, used for small animations like the pulse. */
  time: number;
}
