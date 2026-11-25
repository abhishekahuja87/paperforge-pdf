/** Looks for the explainer videos. A style sets the background, the colours of the boxes, how thick the outlines are and whether boxes have a shadow or a glow. */
import type { IconColours } from './icons';

export type StyleId = 'clean' | 'bold' | 'cartoon' | 'neon' | 'chalk';

export interface StyleDef {
  /** One colour, or two for a top to bottom blend. */
  bg: string | [string, string];
  ink: string;
  accent: string;
  /** Fill of the left and right boxes. */
  fills: [string, string];
  /** Outline of the left and right boxes (the accent while a box is being introduced). */
  outlines: [string, string];
  stroke: number;
  radius: number;
  shadow: { x: number; y: number; blur: number; colour: string } | null;
  glow: boolean;
  /** Font suggested for the style. */
  font: 'clean' | 'friendly';
  icon: IconColours;
  /** Size of text compared with the clean style. */
  weight: number;
}

export const STYLES: Record<StyleId, StyleDef> = {
  clean: { bg: '#ffffff', ink: '#1f2937', accent: '#ea580c', fills: ['#f1f5f9', '#f1f5f9'], outlines: ['#1f2937', '#1f2937'], stroke: 3.5, radius: 24, shadow: { x: 0, y: 8, blur: 18, colour: 'rgba(15,23,42,0.16)' }, glow: false, font: 'clean', icon: { line: '#1f2937', fill: '#fdba74', detail: '#ffffff' }, weight: 1 },
  bold: { bg: '#fde047', ink: '#111111', accent: '#e11d48', fills: ['#ffffff', '#fb923c'], outlines: ['#111111', '#111111'], stroke: 7, radius: 12, shadow: { x: 10, y: 10, blur: 0, colour: '#111111' }, glow: false, font: 'clean', icon: { line: '#111111', fill: '#ffffff', detail: '#fde047' }, weight: 1.06 },
  cartoon: { bg: ['#fef3c7', '#fbcfe8'], ink: '#1f2937', accent: '#7c3aed', fills: ['#bbf7d0', '#fecaca'], outlines: ['#1f2937', '#1f2937'], stroke: 6, radius: 44, shadow: { x: 0, y: 10, blur: 0, colour: 'rgba(31,41,55,0.25)' }, glow: false, font: 'friendly', icon: { line: '#1f2937', fill: '#fde68a', detail: '#ffffff' }, weight: 1.04 },
  neon: { bg: ['#0b0b16', '#1a0b2e'], ink: '#f8fafc', accent: '#22d3ee', fills: ['#12122a', '#12122a'], outlines: ['#22d3ee', '#f472b6'], stroke: 4.5, radius: 22, shadow: null, glow: true, font: 'clean', icon: { line: '#22d3ee', fill: 'rgba(34,211,238,0.18)', detail: '#f472b6' }, weight: 1 },
  chalk: { bg: '#1f3d2b', ink: '#f5f5ef', accent: '#fcd34d', fills: ['#2a4d38', '#2a4d38'], outlines: ['#f5f5ef', '#f5f5ef'], stroke: 4, radius: 18, shadow: null, glow: false, font: 'friendly', icon: { line: '#f5f5ef', fill: 'rgba(252,211,77,0.35)', detail: '#1f3d2b' }, weight: 1 },
};
