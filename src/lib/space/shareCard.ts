import { PLANETS, ageOn, formatNumber, weightOn } from './worlds';

export interface ShareCardInput {
  name: string;
  birth: Date;
  /** Weight on Earth, or null to leave the weight out of the picture. */
  weight: number | null;
  unit: 'kg' | 'lb';
}

export const SHARE_CARD_SIZE = { width: 1080, height: 1300 };
const SITE_NOTE = 'Made at www.mydailyutils.in';

/** Draws a "my age on every planet" picture, ready to save or send. Everything stays in the browser. */
export function drawShareCard(canvas: HTMLCanvasElement, input: ShareCardInput): void {
  const { width, height } = SHARE_CARD_SIZE;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#0f172a');
  sky.addColorStop(1, '#312e81');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  // A fixed pattern of stars, so the picture looks the same each time.
  for (let i = 0; i < 70; i += 1) {
    const x = (i * 241) % width;
    const y = (i * 389) % height;
    ctx.fillStyle = `rgba(255,255,255,${0.25 + ((i * 7) % 5) * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  const who = input.name.trim();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 40px system-ui, sans-serif';
  ctx.fillText('MY AGE ON EVERY PLANET', width / 2, 110);
  ctx.fillStyle = '#ffffff';
  let size = 84;
  const title = who || 'Me';
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  while (ctx.measureText(title).width > width - 120 && size > 36) {
    size -= 4;
    ctx.font = `800 ${size}px system-ui, sans-serif`;
  }
  ctx.fillText(title, width / 2, 210);

  const rowH = 112;
  const top = 270;
  const withWeight = input.weight !== null;
  ctx.textAlign = 'left';
  PLANETS.forEach((planet, index) => {
    const y = top + index * rowH;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(60, y, width - 120, rowH - 14, 24);
    ctx.fill();
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(120, y + (rowH - 14) / 2, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 38px system-ui, sans-serif';
    ctx.fillText(planet.name, 170, y + 62);
    const age = ageOn(planet, input.birth);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.fillText(age ? `${formatNumber(age.years)} yrs` : '-', withWeight ? 780 : width - 100, y + 64);
    if (withWeight && input.weight !== null) {
      ctx.fillStyle = '#c7d2fe';
      ctx.font = '600 34px system-ui, sans-serif';
      ctx.fillText(`${formatNumber(weightOn(planet, input.weight))} ${input.unit}`, width - 100, y + 62);
    }
    ctx.textAlign = 'left';
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '400 26px system-ui, sans-serif';
  ctx.fillText(SITE_NOTE, width / 2, height - 40);
}

export const shareCardFileName = (name: string) => `${(name.trim() || 'my').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase() || 'my'}-age-on-planets.png`;
