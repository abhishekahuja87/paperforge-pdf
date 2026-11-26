/** Made-up photos of filled sheets, so the tool can be tried without printing anything. */
import { LETTERS, type SheetLayout } from './layout';
import { drawSheet, type SheetText } from './sheet';

/** Three students who got about 90%, 65% and 40% right, with one blank and one double mark on the second sheet. Returns the photos and the key as text. */
export async function makeSamplePhotos(layout: SheetLayout, text: SheetText): Promise<{ files: File[]; key: string }> {
  let seed = 20261125; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const key = layout.answers.map(() => Math.floor(rnd() * layout.options));
  const files: File[] = [];
  for (const [n, accuracy] of [0.9, 0.65, 0.4].entries()) {
    const answers = key.map((right, q) => {
      if (n === 1 && q === 3) return [] as number[];
      if (n === 1 && q === 6) return [right, (right + 1) % layout.options];
      if (rnd() < accuracy) return [right];
      return [(right + 1 + Math.floor(rnd() * (layout.options - 1))) % layout.options];
    });
    const roll = String(101 + n).padStart(layout.digits, '0').slice(-layout.digits), sheet = drawSheet(layout, text, { answers, roll });
    const photo = document.createElement('canvas'); photo.width = 1500; photo.height = 2000;
    const ctx = photo.getContext('2d')!; ctx.fillStyle = '#4a3b2f'; ctx.fillRect(0, 0, 1500, 2000);
    ctx.save(); ctx.translate(750, 1000); ctx.rotate(((n - 1) * 2.2 * Math.PI) / 180); const k = 1.08; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40;
    ctx.drawImage(sheet, (-sheet.width * k) / 2, (-sheet.height * k) / 2, sheet.width * k, sheet.height * k); ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, 1500, 600); shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,0.28)'); ctx.fillStyle = shade; ctx.fillRect(0, 0, 1500, 2000);
    const blob = await new Promise<Blob | null>((resolve) => photo.toBlob(resolve, 'image/jpeg', 0.82));
    if (blob) files.push(new File([blob], `sample-sheet-${n + 1}.jpg`, { type: 'image/jpeg' }));
  }
  return { files, key: key.map((o) => LETTERS[o]).join('') };
}
