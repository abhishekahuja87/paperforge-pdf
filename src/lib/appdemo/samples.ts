/**
 * Made-up app screens drawn in the page, so the tool can be tried without screenshots.
 * Each one carries a suggested sentence and a spot to point at.
 */
import type { MarkStyleId, Pic } from './scene';

export interface Sample { pic: Pic; label: string; mark: { style: MarkStyleId; x: number; y: number; zoom: boolean } }

const W = 720;
const rounded = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

function screen(height: number, draw: (ctx: CanvasRenderingContext2D) => void): Pic {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = height; const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, height); draw(ctx);
  return { source: canvas, width: W, height };
}
const text = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color: string, weight = 700, align: CanvasTextAlign = 'left') => { ctx.font = `${weight} ${size}px sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y); };
const header = (ctx: CanvasRenderingContext2D, title: string) => { ctx.fillStyle = '#ea580c'; ctx.fillRect(0, 0, W, 150); text(ctx, title, 40, 90, 46, '#ffffff'); };
const colours = ['#38bdf8', '#fb923c', '#a78bfa', '#34d399', '#f472b6', '#facc15'];

/** Four short screens of an imaginary shop and one long list. */
export function makeSamples(): Sample[] {
  const home = screen(1560, (ctx) => {
    header(ctx, 'Priya Sarees');
    ctx.fillStyle = '#e2e8f0'; rounded(ctx, 40, 190, 640, 80, 40); ctx.fill(); text(ctx, 'Search sarees', 90, 230, 30, '#64748b', 500);
    ctx.fillStyle = '#fde68a'; rounded(ctx, 40, 310, 640, 260, 30); ctx.fill(); text(ctx, 'Diwali sale', 80, 400, 58, '#7c2d12'); text(ctx, 'Flat 30% off this week', 80, 480, 34, '#92400e', 500);
    [0, 1].forEach((c) => [0, 1].forEach((r) => { const x = 40 + c * 330, y = 620 + r * 420; ctx.fillStyle = '#ffffff'; rounded(ctx, x, y, 310, 390, 26); ctx.fill(); ctx.fillStyle = colours[c + r * 2]!; rounded(ctx, x + 14, y + 14, 282, 250, 20); ctx.fill(); text(ctx, 'Silk saree', x + 24, y + 300, 30, '#1f2937'); text(ctx, '₹2,499', x + 24, y + 348, 30, '#ea580c'); }));
  });
  const product = screen(1560, (ctx) => {
    header(ctx, 'Silk saree');
    ctx.fillStyle = '#fb923c'; ctx.fillRect(0, 150, W, 620); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(360, 460, 170, 0, 7); ctx.fill();
    text(ctx, 'Red silk saree', 40, 850, 46, '#1f2937'); text(ctx, '₹2,499', 40, 920, 44, '#ea580c');
    text(ctx, 'Pick your size', 40, 1010, 30, '#64748b', 500);
    ['S', 'M', 'L', 'XL'].forEach((size, k) => { ctx.fillStyle = k === 1 ? '#ea580c' : '#e2e8f0'; rounded(ctx, 40 + k * 160, 1050, 140, 90, 24); ctx.fill(); text(ctx, size, 110 + k * 160, 1095, 38, k === 1 ? '#ffffff' : '#1f2937', 700, 'center'); });
    ctx.fillStyle = '#16a34a'; rounded(ctx, 40, 1300, 640, 110, 30); ctx.fill(); text(ctx, 'Add to bag', 360, 1355, 42, '#ffffff', 700, 'center');
  });
  const cart = screen(1560, (ctx) => {
    header(ctx, 'Your bag');
    [0, 1].forEach((k) => { const y = 200 + k * 230; ctx.fillStyle = '#ffffff'; rounded(ctx, 40, y, 640, 200, 26); ctx.fill(); ctx.fillStyle = colours[k]!; rounded(ctx, 60, y + 20, 160, 160, 18); ctx.fill(); text(ctx, 'Silk saree', 250, y + 70, 34, '#1f2937'); text(ctx, '₹2,499', 250, y + 125, 34, '#ea580c'); });
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); rounded(ctx, 40, 700, 640, 110, 24); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); text(ctx, 'Coupon code', 80, 755, 32, '#64748b', 500);
    text(ctx, 'Total', 40, 900, 40, '#1f2937'); text(ctx, '₹4,998', 680, 900, 40, '#1f2937', 700, 'right');
    ctx.fillStyle = '#16a34a'; rounded(ctx, 40, 1300, 640, 110, 30); ctx.fill(); text(ctx, 'Place order', 360, 1355, 42, '#ffffff', 700, 'center');
  });
  const done = screen(1560, (ctx) => {
    header(ctx, 'Order placed');
    ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(360, 560, 150, 0, 7); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(290, 560); ctx.lineTo(345, 620); ctx.lineTo(440, 500); ctx.stroke();
    text(ctx, 'Thank you!', 360, 820, 56, '#1f2937', 700, 'center'); text(ctx, 'It reaches you in 3 days', 360, 900, 34, '#64748b', 500, 'center');
  });
  const list = screen(2900, (ctx) => {
    header(ctx, 'All sarees');
    for (let k = 0; k < 12; k += 1) { const y = 190 + k * 220; ctx.fillStyle = '#ffffff'; rounded(ctx, 40, y, 640, 200, 26); ctx.fill(); ctx.fillStyle = colours[k % 6]!; rounded(ctx, 60, y + 20, 160, 160, 18); ctx.fill(); text(ctx, `Saree design ${k + 1}`, 250, y + 70, 34, '#1f2937'); text(ctx, `₹${(1499 + k * 200).toLocaleString('en-IN')}`, 250, y + 125, 34, '#ea580c'); }
  });
  return [
    { pic: home, label: 'Open the shop and see the Diwali sale', mark: { style: 'none', x: 0.5, y: 0.3, zoom: false } },
    { pic: product, label: 'Pick your size', mark: { style: 'tap', x: 0.3, y: 0.69, zoom: true } },
    { pic: cart, label: 'Use code DIWALI for the discount', mark: { style: 'arrow', x: 0.5, y: 0.485, zoom: false } },
    { pic: done, label: 'Order placed, it is that easy', mark: { style: 'none', x: 0.5, y: 0.4, zoom: false } },
    { pic: list, label: 'Scroll through all the designs', mark: { style: 'none', x: 0.5, y: 0.3, zoom: false } },
  ];
}
