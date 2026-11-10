import { arcTo, circle, line, lineTo, move, rect } from './shapes';

/**
 * Court and ground sizes. Numbers are in metres and come from the governing bodies' rules or the sources listed in
 * SOURCES; the wording for each id is in src/locales/packs/sports.courts.en.json. Change a number here only after
 * checking it against the source again, and update CHECKED_ON.
 */
export const CHECKED_ON = '10 November 2026';

export interface Fact { id: string; m: number }
/** What a distance on the drawing is measured from: the nearest end line, the net or centre line, or the nearest side line. */
export type Ref = 'end' | 'net' | 'side';
/** A named line: `m` is its distance from end A ('end') or side A ('side'); the label also gives it from `ref`. */
export interface Mark { id: string; m: number; from: 'end' | 'side'; ref?: Ref }
/** Something else written on the drawing by name: a circle or arc (by radius), a rectangle (by size), a spot on the middle line (by distance from the end), or a note. */
export type Part =
  | { id: string; kind: 'circle' | 'arc'; r: number }
  | { id: string; kind: 'rect'; w: number; h: number }
  | { id: string; kind: 'spot'; x: number }
  | { id: string; kind: 'note'; at: 'net' | 'footer'; values?: number[] };
/** Clear space the rules ask for beyond the boundary lines. */
export interface Margin { id: string; ends: number; sides: number; source: string }
export interface Variant {
  id: string;
  /** Along the long side (x) and across it (y). */
  length: number;
  width: number;
  /** A round ground. length and width are then both the diameter. */
  round?: boolean;
  /** Lines to draw: solid, and dashed (nets). */
  lines: string[];
  dashed?: string[];
  facts: Fact[];
  marks: Mark[];
  parts?: Part[];
  margins: Margin[];
  /** Smallest overall space the rules ask for when they give a total instead of a margin: [long side, short side]. */
  minOverall?: [number, number];
  clearHeight?: number;
  sources: string[];
}
export interface Sport { id: string; variants: Variant[] }
export interface Source { name: string; url: string }

export const SOURCES: Record<string, Source> = {
  bwfLaws: { name: 'BWF Laws of Badminton (June 2016 revision)', url: 'https://system.bwfbadminton.com/documents/folder_1_81/Regulations/Laws/Part%20II%20Section%201A%20-%20Laws%20of%20Badminton%20-%20June%202016%20Revised.pdf' },
  bwfFacilities: { name: 'BWF Specifications for International Standard Facilities (14 October 2019, v1.1)', url: 'https://www.badmintonpanam.org/wp-content/uploads/2023/01/3.3.4-Specs-for-Int_l-Standard-Facilities-14-October-2019-V1.1.pdf' },
  itf: { name: 'ITF Rules of Tennis, 2025 (Rule 1 and the annex on space around the court)', url: 'https://www.itftennis.com/media/7222/2025-rules-of-tennis-french.pdf' },
  pickleball: { name: 'Pickleball court dimensions and setup guide (pickleball.com, USA Pickleball minimum and tournament sizes)', url: 'https://pickleball.com/docs/en/article/pickleball-court-dimensions-and-setup-complete-guide' },
  fiba: { name: 'FIBA Official Basketball Rules, Article 2 (2012 text)', url: 'https://websites.mygameday.app/get_file.cgi?id=3326931' },
  waBasketball: { name: 'Western Australia Sports Dimensions Guide: Basketball (reviewed July 2025)', url: 'https://cits.wa.gov.au/sport-and-recreation/sports-dimensions-guide/basketball' },
  waVolleyball: { name: 'Western Australia Sports Dimensions Guide: Volleyball (from the Volleyball Australia rules 2013-2016)', url: 'https://dlgsc.wa.gov.au/sport-and-recreation/sports-dimensions-guide/volleyball' },
  ifab: { name: 'IFAB Laws of the Game 2025/26, Law 1 The Field of Play (published by The FA)', url: 'https://www.thefa.com/-/media/files/thefaportal/governance-docs/laws-of-the-game/2025-26/law-1---the-field-of-play.ashx' },
  cricketField: { name: 'Cricket field and pitch (Wikipedia), citing ICC playing conditions for boundaries', url: 'https://en.wikipedia.org/wiki/Cricket_field' },
  cricketPitch: { name: 'Cricket pitch (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Cricket_pitch' },
  fih: { name: 'Field hockey pitch (Wikipedia), summarising the FIH Rules of Hockey', url: 'https://en.wikipedia.org/wiki/Field_hockey_pitch' },
  ikf: { name: 'International Kabaddi Federation (IKF) Rules v2.1.0', url: 'https://www.kabaddiikf.com/images/new-IKF_Rules.pdf' },
  khoKho: { name: 'Kho Kho: The Game (khokho.net)', url: 'https://khokho.net/the-game' },
  ttLaws: { name: 'Laws of Table Tennis 2026-27 (Table Tennis England)', url: 'https://www.tabletennisengland.co.uk/content/uploads/2026/07/Laws-of-Table-Tennis-2026-27.pdf' },
  ittfSpace: { name: 'ITTF regulations for the playing space, Statutes chapter 3 (2026, HKTTA)', url: 'https://www.hktta.org.hk/referee/application/2026_Statutes_Chapter3.pdf' },
  waSquash: { name: 'Western Australia Sports Dimensions Guide: Squash (reviewed February 2026, from the WSF Specifications for Squash Courts 2013)', url: 'https://cdn.dlgsc.wa.gov.au/sport-and-recreation/sports-dimensions-guide/squash' },
  squashTin: { name: 'Squash court (singles) measurements, dimensions.com', url: 'https://www.dimensions.com/element/squash-court-singles' },
};

const FT = 0.3048;
const half = (value: number) => value / 2;

function badminton(): Variant {
  const L = 13.4; const W = 6.1; const net = L / 2;
  return {
    id: 'court', length: L, width: W,
    lines: [
      rect(0, 0, L, W), line(0, 0.46, L, 0.46), line(0, W - 0.46, L, W - 0.46),
      line(net - 1.98, 0, net - 1.98, W), line(net + 1.98, 0, net + 1.98, W), line(0.76, 0, 0.76, W), line(L - 0.76, 0, L - 0.76, W),
      line(0, half(W), net - 1.98, half(W)), line(net + 1.98, half(W), L, half(W)),
    ],
    dashed: [line(net, -0.3, net, W + 0.3)],
    facts: [
      { id: 'length', m: L }, { id: 'doublesWidth', m: W }, { id: 'singlesWidth', m: 5.18 }, { id: 'shortService', m: 1.98 },
      { id: 'longServiceDoubles', m: 0.76 }, { id: 'netPosts', m: 1.55 }, { id: 'netCentre', m: 1.524 }, { id: 'lineWidth', m: 0.04 },
    ],
    marks: [{ id: 'longServiceDoubles', m: 0.76, from: 'end', ref: 'end' }, { id: 'shortService', m: net - 1.98, from: 'end', ref: 'net' }, { id: 'net', m: net, from: 'end', ref: 'end' }, { id: 'singlesSideline', m: 0.46, from: 'side', ref: 'side' }, { id: 'centreLine', m: half(W), from: 'side', ref: 'side' }],
    parts: [{ id: 'netHeights', kind: 'note', at: 'net', values: [1.55, 1.524] }, { id: 'singlesWidth', kind: 'note', at: 'footer', values: [5.18] }, { id: 'lineWidth', kind: 'note', at: 'footer', values: [0.04] }],
    margins: [{ id: 'bwf', ends: 2, sides: 1.5, source: 'bwfFacilities' }],
    clearHeight: 9,
    sources: ['bwfLaws', 'bwfFacilities'],
  };
}

function tennis(): Variant {
  const L = 23.77; const W = 10.97; const net = L / 2; const side = (W - 8.23) / 2;
  return {
    id: 'court', length: L, width: W,
    lines: [
      rect(0, 0, L, W), line(0, side, L, side), line(0, W - side, L, W - side),
      line(net - 6.4, side, net - 6.4, W - side), line(net + 6.4, side, net + 6.4, W - side), line(net - 6.4, half(W), net + 6.4, half(W)),
    ],
    dashed: [line(net, -0.9, net, W + 0.9)],
    facts: [
      { id: 'length', m: L }, { id: 'doublesWidth', m: W }, { id: 'singlesWidth', m: 8.23 }, { id: 'serviceFromNet', m: 6.4 },
      { id: 'netPosts', m: 1.07 }, { id: 'netCentre', m: 0.914 },
    ],
    marks: [{ id: 'serviceLine', m: net - 6.4, from: 'end', ref: 'net' }, { id: 'net', m: net, from: 'end', ref: 'end' }, { id: 'singlesSideline', m: side, from: 'side', ref: 'side' }, { id: 'centreServiceLine', m: half(W), from: 'side', ref: 'side' }],
    parts: [{ id: 'netHeights', kind: 'note', at: 'net', values: [1.07, 0.914] }, { id: 'singlesWidth', kind: 'note', at: 'footer', values: [8.23] }],
    margins: [
      { id: 'club', ends: 5.48, sides: 3.05, source: 'itf' },
      { id: 'international', ends: 6.4, sides: 3.66, source: 'itf' },
    ],
    clearHeight: 9,
    sources: ['itf'],
  };
}

function pickleball(): Variant {
  const L = 44 * FT; const W = 20 * FT; const net = L / 2; const kitchen = 7 * FT;
  return {
    id: 'court', length: L, width: W,
    lines: [
      rect(0, 0, L, W), line(net - kitchen, 0, net - kitchen, W), line(net + kitchen, 0, net + kitchen, W),
      line(0, half(W), net - kitchen, half(W)), line(net + kitchen, half(W), L, half(W)),
    ],
    dashed: [line(net, -0.3, net, W + 0.3)],
    facts: [
      { id: 'length', m: L }, { id: 'width', m: W }, { id: 'kitchen', m: kitchen }, { id: 'netSides', m: 36 * 0.0254 }, { id: 'netCentre', m: 34 * 0.0254 }, { id: 'lineWidth', m: 2 * 0.0254 },
    ],
    marks: [{ id: 'kitchenLine', m: net - kitchen, from: 'end', ref: 'net' }, { id: 'net', m: net, from: 'end', ref: 'end' }, { id: 'centreLine', m: half(W), from: 'side', ref: 'side' }],
    parts: [{ id: 'netHeights', kind: 'note', at: 'net', values: [36 * 0.0254, 34 * 0.0254] }, { id: 'lineWidth', kind: 'note', at: 'footer', values: [2 * 0.0254] }],
    margins: [
      { id: 'minimum', ends: 8 * FT, sides: 5 * FT, source: 'pickleball' },
      { id: 'recommended', ends: 10 * FT, sides: 7 * FT, source: 'pickleball' },
    ],
    sources: ['pickleball'],
  };
}

function basketballFiba(): Variant {
  const L = 28; const W = 15; const cy = W / 2;
  const end = (left: boolean): string[] => {
    const x = (p: number) => (left ? p : L - p);
    const sw = (value: 0 | 1): 0 | 1 => (left ? value : value === 1 ? 0 : 1);
    const cornerX = 1.575 + Math.sqrt(6.75 ** 2 - (cy - 0.9) ** 2);
    return [
      rect(left ? 0 : L - 5.8, cy - 2.45, 5.8, 4.9),
      move(x(5.8), cy - 1.8) + lineTo(x(5.8), cy + 1.8),
      move(x(5.8), cy - 1.8) + arcTo(1.8, x(5.8), cy + 1.8, sw(1)),
      line(x(0), 0.9, x(cornerX), 0.9), line(x(0), W - 0.9, x(cornerX), W - 0.9),
      move(x(cornerX), 0.9) + arcTo(6.75, x(cornerX), W - 0.9, sw(1)),
    ];
  };
  return {
    id: 'fiba', length: L, width: W,
    lines: [rect(0, 0, L, W), line(L / 2, 0, L / 2, W), circle(L / 2, cy, 1.8), ...end(true), ...end(false)],
    facts: [
      { id: 'length', m: L }, { id: 'width', m: W }, { id: 'freeThrow', m: 5.8 }, { id: 'laneWidth', m: 4.9 }, { id: 'threePoint', m: 6.75 },
      { id: 'cornerFromSide', m: 0.9 }, { id: 'circleRadius', m: 1.8 }, { id: 'rimHeight', m: 3.05 },
    ],
    marks: [{ id: 'freeThrow', m: 5.8, from: 'end', ref: 'end' }, { id: 'halfway', m: L / 2, from: 'end', ref: 'end' }, { id: 'cornerFromSide', m: 0.9, from: 'side', ref: 'side' }],
    parts: [{ id: 'lane', kind: 'rect', w: 5.8, h: 4.9 }, { id: 'threePoint', kind: 'arc', r: 6.75 }, { id: 'circle', kind: 'circle', r: 1.8 }, { id: 'semicircle', kind: 'arc', r: 1.8 }, { id: 'rimHeight', kind: 'note', at: 'footer', values: [3.05] }],
    margins: [{ id: 'free', ends: 2, sides: 2, source: 'fiba' }],
    sources: ['fiba', 'waBasketball'],
  };
}

function basketball3x3(): Variant {
  return {
    id: 'threeByThree', length: 15, width: 11, lines: [rect(0, 0, 15, 11)],
    facts: [{ id: 'length', m: 15 }, { id: 'width', m: 11 }, { id: 'twoPoint', m: 6.75 }],
    marks: [],
    parts: [{ id: 'twoPoint', kind: 'note', at: 'footer', values: [6.75] }],
    margins: [{ id: 'free', ends: 2, sides: 2, source: 'fiba' }],
    sources: ['waBasketball', 'fiba'],
  };
}

function volleyball(): Variant[] {
  const indoor: Variant = {
    id: 'indoor', length: 18, width: 9,
    lines: [rect(0, 0, 18, 9), line(6, 0, 6, 9), line(12, 0, 12, 9)],
    dashed: [line(9, -0.4, 9, 9.4)],
    facts: [{ id: 'length', m: 18 }, { id: 'width', m: 9 }, { id: 'attackLine', m: 3 }, { id: 'netMen', m: 2.43 }, { id: 'netWomen', m: 2.24 }],
    marks: [{ id: 'attackLine', m: 6, from: 'end', ref: 'net' }, { id: 'net', m: 9, from: 'end', ref: 'end' }],
    parts: [{ id: 'netHeights', kind: 'note', at: 'net', values: [2.43, 2.24] }],
    margins: [
      { id: 'minimum', ends: 3, sides: 3, source: 'waVolleyball' },
      { id: 'official', ends: 8, sides: 5, source: 'waVolleyball' },
    ],
    clearHeight: 7,
    sources: ['waVolleyball'],
  };
  const beach: Variant = {
    id: 'beach', length: 16, width: 8, lines: [rect(0, 0, 16, 8)], dashed: [line(8, -0.4, 8, 8.4)],
    facts: [{ id: 'length', m: 16 }, { id: 'width', m: 8 }, { id: 'netMen', m: 2.43 }, { id: 'netWomen', m: 2.24 }],
    marks: [{ id: 'net', m: 8, from: 'end', ref: 'end' }],
    parts: [{ id: 'netHeights', kind: 'note', at: 'net', values: [2.43, 2.24] }],
    margins: [{ id: 'minimum', ends: 3, sides: 3, source: 'waVolleyball' }],
    clearHeight: 7,
    sources: ['waVolleyball'],
  };
  return [indoor, beach];
}

function footballPitch(id: string, L: number, W: number): Variant {
  const cy = W / 2;
  const penaltyW = 16.5 * 2 + 7.32; const goalW = 5.5 * 2 + 7.32;
  const dy = Math.sqrt(9.15 ** 2 - 5.5 ** 2);
  const side = (left: boolean): string[] => {
    const x = (p: number) => (left ? p : L - p);
    return [
      rect(left ? 0 : L - 16.5, cy - penaltyW / 2, 16.5, penaltyW), rect(left ? 0 : L - 5.5, cy - goalW / 2, 5.5, goalW),
      move(x(16.5), cy - dy) + arcTo(9.15, x(16.5), cy + dy, left ? 1 : 0),
      circle(x(11), cy, 0.25),
    ];
  };
  return {
    id, length: L, width: W,
    lines: [
      rect(0, 0, L, W), line(L / 2, 0, L / 2, W), circle(L / 2, cy, 9.15), circle(L / 2, cy, 0.25), ...side(true), ...side(false),
      move(1, 0) + arcTo(1, 0, 1, 1), move(L - 1, 0) + arcTo(1, L, 1, 0), move(0, W - 1) + arcTo(1, 1, W, 1), move(L, W - 1) + arcTo(1, L - 1, W, 0),
    ],
    facts: [
      { id: 'length', m: L }, { id: 'width', m: W }, { id: 'goalWidth', m: 7.32 }, { id: 'crossbar', m: 2.44 }, { id: 'goalArea', m: 5.5 },
      { id: 'penaltyArea', m: 16.5 }, { id: 'penaltyMark', m: 11 }, { id: 'circleRadius', m: 9.15 }, { id: 'cornerArc', m: 1 },
    ],
    marks: [{ id: 'halfway', m: L / 2, from: 'end', ref: 'end' }],
    parts: [
      { id: 'goalArea', kind: 'rect', w: 5.5, h: goalW }, { id: 'penaltyArea', kind: 'rect', w: 16.5, h: penaltyW }, { id: 'penaltyMark', kind: 'spot', x: 11 }, { id: 'centreSpot', kind: 'spot', x: L / 2 },
      { id: 'centreCircle', kind: 'circle', r: 9.15 }, { id: 'penaltyArc', kind: 'arc', r: 9.15 }, { id: 'cornerArc', kind: 'arc', r: 1 }, { id: 'goal', kind: 'note', at: 'footer', values: [7.32, 2.44] },
    ],
    margins: [{ id: 'none', ends: 0, sides: 0, source: 'ifab' }],
    sources: ['ifab'],
  };
}

function cricketPitch(): Variant {
  const L = 22 * 0.9144; const W = 10 * FT;
  return {
    id: 'pitch', length: L, width: W, lines: [rect(0, 0, L, W), line(0, half(W), L, half(W))],
    facts: [{ id: 'length', m: L }, { id: 'width', m: W }],
    marks: [{ id: 'centreLine', m: half(W), from: 'side', ref: 'side' }],
    margins: [{ id: 'none', ends: 0, sides: 0, source: 'cricketPitch' }],
    sources: ['cricketPitch'],
  };
}

function cricketGround(id: string, boundaryYards: number): Variant {
  const r = boundaryYards * 0.9144; const d = 2 * r; const c = r; const pitchL = 22 * 0.9144; const pitchW = 10 * FT; const f = 30 * 0.9144;
  return {
    id, length: d, width: d, round: true,
    lines: [
      circle(c, c, r), rect(c - pitchL / 2, c - pitchW / 2, pitchL, pitchW),
      move(c - pitchL / 2, c - f) + lineTo(c + pitchL / 2, c - f) + arcTo(f, c + pitchL / 2, c + f, 1) + lineTo(c - pitchL / 2, c + f) + arcTo(f, c - pitchL / 2, c - f, 1),
    ],
    facts: [{ id: 'boundaryRadius', m: r }, { id: 'diameter', m: d }, { id: 'fieldingCircle', m: f }, { id: 'pitchLength', m: pitchL }],
    marks: [{ id: 'fieldingStraight', m: c - f, from: 'side', ref: 'net' }],
    parts: [{ id: 'boundary', kind: 'circle', r }, { id: 'pitch', kind: 'rect', w: pitchL, h: pitchW }, { id: 'fieldingArc', kind: 'arc', r: f }],
    margins: [{ id: 'fence', ends: 3 * 0.9144, sides: 3 * 0.9144, source: 'cricketField' }],
    sources: ['cricketField', 'cricketPitch'],
  };
}

function hockey(): Variant {
  const L = 91.4; const W = 55; const cy = W / 2; const R = 14.63;
  const d = (left: boolean): string => {
    const x = (p: number) => (left ? p : L - p);
    const s: 0 | 1 = left ? 1 : 0;
    return move(x(0), cy - 1.83 - R) + arcTo(R, x(R), cy - 1.83, s) + lineTo(x(R), cy + 1.83) + arcTo(R, x(0), cy + 1.83 + R, s);
  };
  return {
    id: 'pitch', length: L, width: W,
    lines: [rect(0, 0, L, W), line(L / 2, 0, L / 2, W), line(22.9, 0, 22.9, W), line(L - 22.9, 0, L - 22.9, W), d(true), d(false), rect(-1.2, cy - 1.83, 1.2, 3.66), rect(L, cy - 1.83, 1.2, 3.66), circle(6.475, cy, 0.2), circle(L - 6.475, cy, 0.2)],
    facts: [
      { id: 'length', m: L }, { id: 'width', m: W }, { id: 'goalWidth', m: 3.66 }, { id: 'goalHeight', m: 2.14 }, { id: 'circleRadius', m: R },
      { id: 'line23', m: 22.9 }, { id: 'penaltySpot', m: 6.475 }, { id: 'lineWidth', m: 0.075 },
    ],
    marks: [{ id: 'line23', m: 22.9, from: 'end', ref: 'end' }, { id: 'halfway', m: L / 2, from: 'end', ref: 'end' }, { id: 'circleFront', m: R, from: 'end', ref: 'end' }],
    parts: [{ id: 'circleArc', kind: 'arc', r: R }, { id: 'goal', kind: 'rect', w: 1.2, h: 3.66 }, { id: 'penaltySpot', kind: 'spot', x: 6.475 }, { id: 'goalHeight', kind: 'note', at: 'footer', values: [2.14] }, { id: 'lineWidth', kind: 'note', at: 'footer', values: [0.075] }],
    margins: [{ id: 'fih', ends: 3, sides: 2, source: 'fih' }],
    sources: ['fih'],
  };
}

function kabaddi(id: string, L: number, W: number, baulk: number): Variant {
  const mid = L / 2;
  return {
    id, length: L, width: W,
    lines: [
      rect(0, 0, L, W), line(mid, 0, mid, W), line(mid - baulk, 0, mid - baulk, W), line(mid + baulk, 0, mid + baulk, W),
      line(mid - baulk - 1, 0, mid - baulk - 1, W), line(mid + baulk + 1, 0, mid + baulk + 1, W), line(0, 1, L, 1), line(0, W - 1, L, W - 1),
    ],
    facts: [{ id: 'length', m: L }, { id: 'width', m: W }, { id: 'baulk', m: baulk }, { id: 'bonus', m: 1 }, { id: 'lobby', m: 1 }],
    marks: [{ id: 'bonusLine', m: mid - baulk - 1, from: 'end', ref: 'net' }, { id: 'baulkLine', m: mid - baulk, from: 'end', ref: 'net' }, { id: 'midline', m: mid, from: 'end', ref: 'end' }, { id: 'lobby', m: 1, from: 'side', ref: 'side' }],
    margins: [{ id: 'none', ends: 0, sides: 0, source: 'ikf' }],
    minOverall: [18, 17],
    sources: ['ikf'],
  };
}

function tableTennis(): Variant[] {
  const T = { L: 2.74, W: 1.525 };
  const table = (cx: number, cy: number): string[] => [rect(cx - T.L / 2, cy - T.W / 2, T.L, T.W), line(cx - T.L / 2, cy, cx + T.L / 2, cy)];
  const space = (id: string, L: number, W: number): Variant => ({
    id, length: L, width: W,
    lines: [rect(0, 0, L, W), ...table(L / 2, W / 2)], dashed: [line(L / 2, W / 2 - T.W / 2 - 0.15, L / 2, W / 2 + T.W / 2 + 0.15)],
    facts: [{ id: 'length', m: L }, { id: 'width', m: W }, { id: 'tableLength', m: T.L }, { id: 'tableWidth', m: T.W }, { id: 'tableHeight', m: 0.76 }, { id: 'netHeight', m: 0.1525 }],
    marks: [{ id: 'tableCentre', m: W / 2, from: 'side', ref: 'side' }, { id: 'net', m: L / 2, from: 'end', ref: 'end' }],
    parts: [{ id: 'table', kind: 'rect', w: T.L, h: T.W }, { id: 'netHeight', kind: 'note', at: 'net', values: [0.1525] }, { id: 'tableHeight', kind: 'note', at: 'footer', values: [0.76] }],
    margins: [{ id: 'none', ends: 0, sides: 0, source: 'ittfSpace' }],
    clearHeight: id === 'competition' ? 5 : undefined,
    sources: ['ittfSpace', 'ttLaws'],
  });
  const tableOnly: Variant = {
    id: 'table', length: T.L, width: T.W, lines: [rect(0, 0, T.L, T.W), line(0, T.W / 2, T.L, T.W / 2)], dashed: [line(T.L / 2, -0.15, T.L / 2, T.W + 0.15)],
    facts: [{ id: 'tableLength', m: T.L }, { id: 'tableWidth', m: T.W }, { id: 'tableHeight', m: 0.76 }, { id: 'netHeight', m: 0.1525 }],
    marks: [{ id: 'tableCentre', m: T.W / 2, from: 'side', ref: 'side' }, { id: 'net', m: T.L / 2, from: 'end', ref: 'end' }],
    parts: [{ id: 'netHeight', kind: 'note', at: 'net', values: [0.1525] }, { id: 'tableHeight', kind: 'note', at: 'footer', values: [0.76] }],
    margins: [{ id: 'none', ends: 0, sides: 0, source: 'ttLaws' }],
    sources: ['ttLaws'],
  };
  return [tableOnly, space('competition', 14, 7), space('masters', 10, 5), space('wheelchair', 8, 6)];
}

function squash(id: string, L: number, W: number, facts: Fact[]): Variant {
  const heights = facts.map((fact): Part => ({ id: fact.id, kind: 'note', at: 'footer', values: [fact.m] }));
  return {
    id, length: L, width: W, lines: [rect(0, 0, L, W)],
    facts: [{ id: 'length', m: L }, { id: 'width', m: W }, ...facts],
    marks: [],
    parts: heights,
    margins: [{ id: 'none', ends: 0, sides: 0, source: 'waSquash' }],
    sources: ['waSquash', 'squashTin'],
  };
}

export const SPORTS: Sport[] = [
  { id: 'badminton', variants: [badminton()] },
  { id: 'tennis', variants: [tennis()] },
  { id: 'pickleball', variants: [pickleball()] },
  { id: 'basketball', variants: [basketballFiba(), basketball3x3()] },
  { id: 'volleyball', variants: volleyball() },
  { id: 'football', variants: [footballPitch('smallest', 90, 45), footballPitch('internationalMin', 100, 64), footballPitch('common', 105, 68), footballPitch('largest', 120, 90)] },
  { id: 'cricket', variants: [cricketPitch(), cricketGround('menMin', 65), cricketGround('menMax', 90), cricketGround('womenMin', 60), cricketGround('womenMax', 70)] },
  { id: 'hockey', variants: [hockey()] },
  { id: 'kabaddi', variants: [kabaddi('men', 13, 10, 3.75), kabaddi('women', 12, 8, 3), kabaddi('subJunior', 11, 8, 3)] },
  {
    id: 'khoKho',
    variants: [{
      id: 'ground', length: 27, width: 16, lines: [rect(0, 0, 27, 16)],
      facts: [{ id: 'length', m: 27 }, { id: 'width', m: 16 }, { id: 'centralLane', m: 0.3 }, { id: 'crossLane', m: 0.35 }, { id: 'poleHeight', m: 1.2 }],
      marks: [],
      parts: [{ id: 'centralLane', kind: 'note', at: 'footer', values: [0.3] }, { id: 'crossLane', kind: 'note', at: 'footer', values: [0.35] }, { id: 'poleHeight', kind: 'note', at: 'footer', values: [1.2] }],
      margins: [{ id: 'none', ends: 0, sides: 0, source: 'khoKho' }], sources: ['khoKho'],
    }],
  },
  { id: 'tableTennis', variants: tableTennis() },
  {
    id: 'squash',
    variants: [
      squash('singles', 9.75, 6.4, [{ id: 'frontWall', m: 4.57 }, { id: 'backWall', m: 2.13 }, { id: 'tin', m: 0.48 }, { id: 'serviceLine', m: 1.78 }]),
      squash('doubles', 13.72, 7.62, [{ id: 'frontWall', m: 6.09 }, { id: 'backWall', m: 2.13 }]),
    ],
  },
];

export const findSport = (id: string): Sport => SPORTS.find((sport) => sport.id === id) ?? SPORTS[0];
