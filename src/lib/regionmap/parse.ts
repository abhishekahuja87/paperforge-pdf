/**
 * Reads the lines of a map video. Each line is one step: a country (or several), a pin on a city or a point, a zoom out to the whole world, or a pause.
 * No drawing happens here. Problems are collected with their line number.
 */

import { findCity, findRegion, type Atlas, type Region } from './atlas';

export interface RegionStep { kind: 'region'; regions: Region[]; label: string; caption: string; line: number }
export interface PinStep { kind: 'pin'; lon: number; lat: number; label: string; caption: string; line: number }
export interface WorldStep { kind: 'world'; caption: string; line: number }
export interface PauseStep { kind: 'pause'; seconds: number; line: number }
export type MapStep = RegionStep | PinStep | WorldStep | PauseStep;

export interface ParseIssue { line: number; message: string }
export interface MapDeck { title: string; steps: MapStep[]; issues: ParseIssue[] }

export const LIMITS = { steps: 40, perLine: 12, caption: 80, title: 60 };

const POINT = /^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*(.*)$/;

export function parseMap(source: string, atlas: Atlas): MapDeck {
  const deck: MapDeck = { title: '', steps: [], issues: [] };
  const issue = (line: number, message: string) => { if (deck.issues.length < 20) deck.issues.push({ line, message }); };
  const add = (step: MapStep) => { if (deck.steps.length >= LIMITS.steps) { issue(step.line, `Too many steps. The most is ${LIMITS.steps}.`); return; } deck.steps.push(step); };
  const caption = (text: string) => text.trim().slice(0, LIMITS.caption);

  source.replace(/\r/g, '').split('\n').forEach((raw, index) => {
    const line = index + 1; const text = raw.trim();
    if (!text || text.startsWith('#')) return;
    let m: RegExpMatchArray | null;
    if ((m = text.match(/^title\s*:\s*(.*)$/i))) { deck.title = m[1]!.trim().slice(0, LIMITS.title); return; }
    if ((m = text.match(/^pause(?:\s+(\d+(?:\.\d+)?))?$/i))) { add({ kind: 'pause', seconds: Math.min(10, Math.max(0.5, m[1] ? Number(m[1]) : 2)), line }); return; }
    if ((m = text.match(/^(?:world|all|zoom out)(?:\s*:\s*(.*))?$/i))) { add({ kind: 'world', caption: caption(m[1] ?? ''), line }); return; }
    if ((m = text.match(/^pin\s*:\s*(.*)$/i))) {
      const rest = m[1]!.trim(); const colon = rest.indexOf(':');
      const place = (colon >= 0 ? rest.slice(0, colon) : rest).trim(); const note = colon >= 0 ? rest.slice(colon + 1) : '';
      const point = place.match(POINT);
      if (point) {
        const lat = Number(point[1]), lon = Number(point[2]);
        if (Math.abs(lat) > 85 || Math.abs(lon) > 180) { issue(line, 'Write the latitude first, then the longitude, for example: pin: 19.07, 72.87 Mumbai.'); return; }
        const label = point[3]!.trim().slice(0, 40);
        add({ kind: 'pin', lon, lat, label, caption: caption(note), line }); return;
      }
      const city = findCity(atlas, place);
      if (!city) { issue(line, `I do not know the city "${place.slice(0, 30)}". Only big cities are on the list. Try the nearest big city, or write the position, like: pin: 19.07, 72.87 Mumbai.`); return; }
      add({ kind: 'pin', lon: city.lon, lat: city.lat, label: city.name, caption: caption(note), line }); return;
    }
    // Anything else is one or more countries, with a note after a colon.
    const colon = text.indexOf(':');
    const names = (colon >= 0 ? text.slice(0, colon) : text).split(/[,+&]/).map((part) => part.trim()).filter(Boolean);
    const note = colon >= 0 ? text.slice(colon + 1) : '';
    if (names.length > LIMITS.perLine) issue(line, `A line can name ${LIMITS.perLine} countries at most.`);
    const found: Region[] = [];
    for (const name of names.slice(0, LIMITS.perLine)) {
      const region = findRegion(atlas, name);
      if (!region) { issue(line, findCity(atlas, name) ? `"${name.slice(0, 30)}" is a city. Write it as: pin: ${name.slice(0, 30)}` : `I do not know the country "${name.slice(0, 30)}". Try its usual English name, for example India, United States or South Korea.`); continue; }
      if (!found.includes(region)) found.push(region);
    }
    if (found.length === 0) return;
    add({ kind: 'region', regions: found, label: found.map((region) => region.name).join(' · '), caption: caption(note), line });
  });
  if (deck.steps.length === 0 && deck.issues.length === 0) issue(1, 'Write a first line, for example: India');
  return deck;
}
