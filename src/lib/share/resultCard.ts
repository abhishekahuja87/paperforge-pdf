/**
 * A picture of a calculator result for sharing: the calculator name, the numbers that were entered, the result boxes,
 * and a small line saying where it came from. It is drawn on a canvas from the values the page already shows, so nothing is uploaded.
 */

export interface ResultCardInput {
  title: string;
  inputs: Array<{ label: string; value: string }>;
  stats: Array<{ label: string; value: string; tone: 'plain' | 'good' | 'strong' }>;
}

const W = 1080;
const PAD = 56;
const INK = '#1c1917';
const MUTED = '#57534e';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Noto Sans Devanagari", sans-serif';
const MAX_INPUTS = 8;
const MAX_STATS = 12;

/** Shrinks text until it fits the width, never below a readable size. */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number, start: number, weight: string, min = 16): number {
  let size = start;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (size > min && ctx.measureText(text).width > width) { size -= 2; ctx.font = `${weight} ${size}px ${FONT}`; }
  return size;
}

/** Cuts text with an ellipsis when even the smallest size does not fit. */
function clip(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export function renderResultCard(input: ResultCardInput): HTMLCanvasElement {
  const stats = input.stats.slice(0, MAX_STATS);
  const inputs = input.inputs.slice(0, MAX_INPUTS);
  const colW = (W - PAD * 2 - 24) / 2;
  const statRows = Math.ceil(stats.length / 2);
  const headerH = 150;
  const inputsH = inputs.length > 0 ? 56 + inputs.length * 44 : 0;
  const statsH = statRows * 150 + (statRows > 0 ? 24 * (statRows - 1) : 0);
  const footerH = 110;
  const H = headerH + inputsH + 40 + statsH + footerH;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Title band.
  ctx.fillStyle = '#c2410c';
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  fit(ctx, input.title, W - PAD * 2, 56, '800', 30);
  ctx.fillText(clip(ctx, input.title, W - PAD * 2), PAD, headerH / 2);

  let y = headerH + 40;
  if (inputs.length > 0) {
    ctx.fillStyle = MUTED;
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText('YOUR NUMBERS', PAD, y);
    y += 36;
    inputs.forEach((row) => {
      ctx.font = `500 28px ${FONT}`;
      ctx.fillStyle = MUTED;
      const labelWidth = (W - PAD * 2) * 0.55;
      ctx.fillText(clip(ctx, row.label, labelWidth - 16), PAD, y + 8);
      ctx.fillStyle = INK;
      ctx.font = `700 28px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(clip(ctx, row.value, (W - PAD * 2) * 0.45), W - PAD, y + 8);
      ctx.textAlign = 'left';
      y += 44;
    });
    y += 4;
  }

  y += 16;
  stats.forEach((stat, index) => {
    const x = PAD + (index % 2) * (colW + 24);
    const top = y + Math.floor(index / 2) * (150 + 24);
    const strong = stat.tone === 'strong';
    const good = stat.tone === 'good';
    ctx.fillStyle = strong ? '#fff7ed' : good ? '#ecfdf5' : '#fafaf9';
    ctx.strokeStyle = strong ? '#fed7aa' : good ? '#a7f3d0' : '#e7e5e4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, top, colW, 150, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(clip(ctx, stat.label.toUpperCase(), colW - 40), x + 20, top + 36);
    ctx.fillStyle = strong ? '#9a3412' : good ? '#065f46' : INK;
    fit(ctx, stat.value, colW - 40, 48, '900', 22);
    ctx.fillText(clip(ctx, stat.value, colW - 40), x + 20, top + 98);
  });

  // Footer.
  ctx.fillStyle = MUTED;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText('An estimate for information, not advice.', PAD, H - 62);
  ctx.fillStyle = '#c2410c';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText('mydailyutils.in', PAD, H - 28);
  return canvas;
}

/** Groups the digits of a plain number the Indian way (7,77,000); anything else is shown as typed. */
function readable(value: string): string {
  const number = Number(value);
  return /^-?\d+(\.\d+)?$/.test(value) && Number.isFinite(number) && Math.abs(number) >= 1000 ? number.toLocaleString('en-IN', { maximumFractionDigits: 6 }) : value;
}

/** Reads the result boxes and labelled inputs of a calculator from the page. Returns null when there is no result to draw yet. */
export function collectResult(root: HTMLElement | null, title: string, labels: Map<string, string>, values: Map<string, string>): ResultCardInput | null {
  if (!root) return null;
  const stats = Array.from(root.querySelectorAll<HTMLElement>('[data-result-stat]')).flatMap((node) => {
    const label = node.dataset.label ?? '';
    const value = node.dataset.value ?? '';
    const tone: ResultCardInput['stats'][number]['tone'] = node.dataset.tone === 'strong' ? 'strong' : node.dataset.tone === 'good' ? 'good' : 'plain';
    return label && value ? [{ label, value, tone }] : [];
  });
  if (stats.length === 0) return null;
  // The labels keep the order in which the fields first appeared, which is the order on the page.
  const inputs = Array.from(labels.entries()).flatMap(([key, label]) => {
    const value = values.get(key);
    return value !== undefined && value !== '' ? [{ label, value: readable(value) }] : [];
  });
  return { title, inputs, stats };
}
