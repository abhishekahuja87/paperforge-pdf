/**
 * Drawing a certificate. The page has two parts: the fixed part (border, title, organisation, date, signatures), which is drawn once and shared
 * by every certificate, and the personal part (the name and a line about what it is for), drawn on its own for each person.
 * A page is always 2339 units wide for A4 and 2200 for Letter (200 dots an inch), so the preview and the PDF look the same.
 */
export type DesignId = 'classic' | 'modern' | 'simple' | 'bright';
export type AccentId = 'gold' | 'orange' | 'green' | 'maroon';
export type PaperId = 'a4' | 'letter';

export interface CertificateWords {
  title: string;
  preface: string;
  reason: string;
  organisation: string;
  date: string;
  signOneName: string;
  signOneRole: string;
  signTwoName: string;
  signTwoRole: string;
}

export interface CertificateLook { design: DesignId; accent: AccentId; paper: PaperId }

export const SIZE: Record<PaperId, { width: number; height: number; points: [number, number] }> = {
  a4: { width: 2339, height: 1654, points: [841.89, 595.28] },
  letter: { width: 2200, height: 1700, points: [792, 612] },
};

const ACCENTS: Record<AccentId, string> = { gold: '#b8860b', orange: '#ea580c', green: '#15803d', maroon: '#9f1239' };
const SERIF = 'Georgia, "Times New Roman", "Noto Serif", "Noto Serif Devanagari", serif';
const SANS = 'Poppins, "Segoe UI", system-ui, "Noto Sans", "Noto Sans Devanagari", sans-serif';

export const accentColor = (accent: AccentId) => ACCENTS[accent];

/** The part of the page between the left and right edges where the text sits. */
function column(look: CertificateLook, width: number): { left: number; right: number; centre: number } {
  const left = look.design === 'modern' ? width * 0.2 : width * 0.1, right = width * 0.9;
  return { left, right, centre: (left + right) / 2 };
}

/** Where the personal part goes, as a rectangle in page units. */
export function personalBox(look: CertificateLook): { x: number; y: number; width: number; height: number } {
  const { width, height } = SIZE[look.paper], c = column(look, width);
  return { x: c.left, y: height * 0.43, width: c.right - c.left, height: height * 0.33 };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const attempt = line ? `${line} ${word}` : word;
      if (ctx.measureText(attempt).width <= maxWidth || !line) line = attempt; else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out.filter((line) => line !== '' || out.length === 1);
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, weight: string, style: string, start: number, maxWidth: number): number {
  let size = start;
  for (; size > 24; size -= 4) { ctx.font = `${style} ${weight} ${size}px ${family}`; if (ctx.measureText(text).width <= maxWidth) break; }
  return size;
}

/** The fixed part of the certificate. */
export function drawTemplate(ctx: CanvasRenderingContext2D, look: CertificateLook, words: CertificateWords): void {
  const { width, height } = SIZE[look.paper], accent = ACCENTS[look.accent], c = column(look, width);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ink = look.design === 'classic' ? '#2b2118' : '#111827';
  ctx.fillStyle = look.design === 'classic' ? '#fffdf5' : look.design === 'bright' ? '#fffbea' : '#ffffff'; ctx.fillRect(0, 0, width, height);

  if (look.design === 'classic') {
    ctx.strokeStyle = accent; ctx.lineWidth = 14; ctx.strokeRect(70, 70, width - 140, height - 140);
    ctx.lineWidth = 4; ctx.strokeRect(105, 105, width - 210, height - 210);
    ctx.fillStyle = accent;
    for (const [x, y] of [[70, 70], [width - 70, 70], [70, height - 70], [width - 70, height - 70]] as [number, number][]) { ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill(); }
  } else if (look.design === 'modern') {
    ctx.fillStyle = accent; ctx.fillRect(0, 0, width * 0.14, height);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(width * 0.07, height * 0.2, width * 0.034, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(width * 0.07, height * 0.2, width * 0.022, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(width * 0.07, height * 0.2, width * 0.01, 0, Math.PI * 2); ctx.fill();
  } else if (look.design === 'simple') {
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 6; ctx.strokeRect(80, 80, width - 160, height - 160);
  } else {
    const colours = [accent, '#f59e0b', '#16a34a', '#db2777', '#7c3aed'];
    let seed = 7; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let n = 0; n < 150; n += 1) {
      const side = n % 4, t = rand(), depth = 20 + rand() * 90;
      const x = side === 0 ? t * width : side === 1 ? width - depth : side === 2 ? t * width : depth - 20;
      const y = side === 0 ? depth - 20 : side === 1 ? t * height : side === 2 ? height - depth : t * height;
      ctx.fillStyle = colours[n % colours.length]!; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(x, y, 8 + rand() * 18, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (words.organisation.trim()) {
    const text = words.organisation.trim().toUpperCase(); const size = fitFont(ctx, text, SANS, '600', '', 46, c.right - c.left);
    ctx.fillStyle = look.design === 'classic' ? accent : '#4b5563'; ctx.font = `600 ${size}px ${SANS}`; ctx.fillText(text, c.centre, height * 0.17);
  }
  const titleFamily = look.design === 'classic' ? SERIF : SANS, titleWeight = look.design === 'classic' ? '700' : '700';
  const title = words.title.trim() || ' ';
  const titleSize = fitFont(ctx, title, titleFamily, titleWeight, '', look.design === 'simple' ? 120 : 150, c.right - c.left);
  ctx.fillStyle = look.design === 'modern' || look.design === 'bright' ? accent : ink; ctx.font = `${titleWeight} ${titleSize}px ${titleFamily}`; ctx.fillText(title, c.centre, height * 0.31);
  ctx.strokeStyle = accent; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(c.centre - 220, height * 0.345); ctx.lineTo(c.centre + 220, height * 0.345); ctx.stroke();
  ctx.fillStyle = '#4b5563'; ctx.font = `400 50px ${look.design === 'classic' ? SERIF : SANS}`; ctx.fillText(words.preface.trim(), c.centre, height * 0.41);

  const lineY = height * 0.86;
  const sign = (x: number, name: string, role: string) => {
    ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 260, lineY); ctx.lineTo(x + 260, lineY); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = `600 44px ${SANS}`; ctx.fillText(name.trim(), x, lineY + 58);
    ctx.fillStyle = '#6b7280'; ctx.font = `400 38px ${SANS}`; ctx.fillText(role.trim(), x, lineY + 108);
  };
  const quarter = (c.right - c.left) / 4;
  sign(c.left + quarter * 0.9, words.signOneName, words.signOneRole);
  sign(c.right - quarter * 0.9, words.signTwoName, words.signTwoRole);
  if (words.date.trim()) { ctx.fillStyle = '#374151'; ctx.font = `500 44px ${SANS}`; ctx.fillText(words.date.trim(), c.centre, lineY + 58); }
  ctx.textAlign = 'left';
}

/** The personal part: the name and the line about what it is for, on a transparent canvas the size of `personalBox`. */
export function drawPersonal(ctx: CanvasRenderingContext2D, look: CertificateLook, name: string, reason: string): void {
  const box = personalBox(look), accent = ACCENTS[look.accent];
  ctx.clearRect(0, 0, box.width, box.height);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const family = look.design === 'classic' ? SERIF : SANS, style = look.design === 'classic' ? 'italic' : '', weight = look.design === 'classic' ? '600' : '700';
  const text = name.trim() || ' ';
  const size = fitFont(ctx, text, family, weight, style, 190, box.width * 0.96);
  ctx.fillStyle = look.design === 'classic' ? '#2b2118' : look.design === 'simple' ? '#111827' : accent; ctx.font = `${style} ${weight} ${size}px ${family}`;
  ctx.fillText(text, box.width / 2, box.height * 0.36);
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(box.width * 0.2, box.height * 0.44); ctx.lineTo(box.width * 0.8, box.height * 0.44); ctx.stroke();
  if (reason.trim()) {
    ctx.fillStyle = '#374151'; ctx.font = `400 56px ${look.design === 'classic' ? SERIF : SANS}`;
    const lines = wrapLines(ctx, reason.trim(), box.width * 0.9).slice(0, 3);
    lines.forEach((line, n) => ctx.fillText(line, box.width / 2, box.height * 0.64 + n * 78));
  }
  ctx.textAlign = 'left';
}

export interface Person { name: string; reason: string }

/** Reads the list: one person on each line, with an optional "Name | what for" to change the line for that person. */
export function parsePeople(text: string, defaultReason: string): Person[] {
  const people: Person[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    const bar = line.indexOf('|');
    const name = (bar < 0 ? line : line.slice(0, bar)).trim(), reason = bar < 0 ? defaultReason : line.slice(bar + 1).trim() || defaultReason;
    if (name) people.push({ name, reason });
  }
  return people;
}

/** One full certificate on a canvas, for the preview. */
export function drawWhole(canvas: HTMLCanvasElement, look: CertificateLook, words: CertificateWords, person: Person | null, scale: number): void {
  const { width, height } = SIZE[look.paper];
  canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  const base = document.createElement('canvas'); base.width = width; base.height = height;
  drawTemplate(base.getContext('2d')!, look, words);
  if (person) {
    const box = personalBox(look), layer = document.createElement('canvas'); layer.width = Math.round(box.width); layer.height = Math.round(box.height);
    drawPersonal(layer.getContext('2d')!, look, person.name, person.reason); base.getContext('2d')!.drawImage(layer, box.x, box.y);
  }
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
}
