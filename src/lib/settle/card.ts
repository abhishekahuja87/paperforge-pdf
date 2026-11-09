import { formatMoney, type Person, type Settlement } from './settle';

const WIDTH = 1080;
const PAD = 64;
const FONT = '"Segoe UI", system-ui, -apple-system, "Noto Sans", Roboto, Arial, sans-serif';

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** Draws the receipt card (who pays whom, then each person's totals) and returns the canvas. */
export function renderSettleCard(title: string, people: Person[], result: Settlement, label: string): HTMLCanvasElement {
  const name = new Map(people.map((p) => [p.id, p.name]));
  const rows = result.transfers.length || 1;
  const height = 300 + rows * 84 + 120 + result.balances.length * 58 + 110;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = '#c2410c';
  ctx.fillRect(0, 0, WIDTH, 14);

  let y = 110;
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 52px ${FONT}`;
  ctx.fillText(fit(ctx, title.trim() || 'Group settle-up', WIDTH - PAD * 2), PAD, y);
  y += 54;
  ctx.fillStyle = '#64748b';
  ctx.font = `400 30px ${FONT}`;
  ctx.fillText(`Total spent ${formatMoney(result.total, label)}`, PAD, y);

  y += 70;
  ctx.fillStyle = '#c2410c';
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText('WHO PAYS WHOM', PAD, y);
  y += 30;
  if (result.transfers.length === 0) {
    ctx.fillStyle = '#047857';
    ctx.font = `600 34px ${FONT}`;
    ctx.fillText('Everyone is even. No payments needed.', PAD, y + 40);
  } else {
    for (const t of result.transfers) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(PAD, y, WIDTH - PAD * 2, 70, 14);
      ctx.fill();
      ctx.stroke();
      const amount = formatMoney(t.amount, label);
      ctx.font = `700 34px ${FONT}`;
      const amountWidth = ctx.measureText(amount).width;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.font = `600 32px ${FONT}`;
      ctx.fillText(fit(ctx, `${name.get(t.from)}  →  ${name.get(t.to)}`, WIDTH - PAD * 2 - amountWidth - 70), PAD + 24, y + 46);
      ctx.fillStyle = '#047857';
      ctx.font = `700 34px ${FONT}`;
      ctx.fillText(amount, WIDTH - PAD - 24 - amountWidth, y + 46);
      y += 84;
    }
  }

  y += 50;
  ctx.fillStyle = '#c2410c';
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText('EACH PERSON', PAD, y);
  ctx.fillStyle = '#64748b';
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('PAID', 640, y);
  ctx.fillText('SHARE', 820, y);
  ctx.fillText('BALANCE', WIDTH - PAD, y);
  y += 20;
  for (const b of result.balances) {
    y += 58;
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(PAD, y - 40);
    ctx.lineTo(WIDTH - PAD, y - 40);
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = `500 28px ${FONT}`;
    ctx.fillText(fit(ctx, b.name, 330), PAD, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatMoney(b.paid), 640, y);
    ctx.fillText(formatMoney(b.owed), 820, y);
    ctx.fillStyle = b.net > 0 ? '#047857' : b.net < 0 ? '#b91c1c' : '#64748b';
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(`${b.net > 0 ? '+' : ''}${formatMoney(b.net)}`, WIDTH - PAD, y);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `400 24px ${FONT}`;
  ctx.fillText('Plus balance: gets money back. Minus: pays. Made at mydailyutils.in', PAD, height - 48);
  return canvas;
}
