import type { TambolaTicket } from './tambola';

const MM = 72 / 25.4;
export const TAMBOLA_THEMES: { id: string; label: string; colour: [number, number, number] }[] = [
  { id: 'orange', label: 'Orange', colour: [0.918, 0.345, 0.047] },
  { id: 'blue', label: 'Blue', colour: [0.114, 0.306, 0.847] },
  { id: 'green', label: 'Green', colour: [0.082, 0.502, 0.239] },
  { id: 'pink', label: 'Pink', colour: [0.859, 0.153, 0.467] },
  { id: 'purple', label: 'Purple', colour: [0.427, 0.157, 0.851] },
];

/** The built-in PDF fonts only cover Western letters, so anything else is dropped from the printed text. */
export const pdfSafe = (text: string) => text.replace(/[^\x20-\x7E -ÿ]/g, '').trim();

export interface TambolaPdfOptions { title: string; footer: string; theme: string }

/** One A4 page per book of six tickets: two columns by three rows, with a title and a prize line. */
export async function buildTambolaPdf(books: TambolaTicket[][], options: TambolaPdfOptions): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const doc = await lib.PDFDocument.create();
  const regular = await doc.embedFont(lib.StandardFonts.Helvetica);
  const bold = await doc.embedFont(lib.StandardFonts.HelveticaBold);
  const [r, g, b] = (TAMBOLA_THEMES.find((item) => item.id === options.theme) ?? TAMBOLA_THEMES[0]).colour;
  const accent = lib.rgb(r, g, b);
  const tint = lib.rgb(1 - (1 - r) * 0.12, 1 - (1 - g) * 0.12, 1 - (1 - b) * 0.12);
  const ink = lib.rgb(0.1, 0.1, 0.12);
  const grey = lib.rgb(0.55, 0.55, 0.58);
  const title = pdfSafe(options.title) || 'Tambola';
  const footer = pdfSafe(options.footer);

  const W = 210 * MM;
  const H = 297 * MM;
  const margin = 12 * MM;
  const gap = 8 * MM;
  const ticketW = (W - margin * 2 - gap) / 2;
  const cellW = ticketW / 9;
  const cellH = 17 * MM;
  const stripH = 7 * MM;
  const ticketH = stripH + cellH * 3;
  const top = H - 44 * MM;

  const centred = (page: ReturnType<typeof doc.addPage>, text: string, cx: number, y: number, size: number, font: typeof bold, color = ink) => {
    page.drawText(text, { x: cx - font.widthOfTextAtSize(text, size) / 2, y, size, font, color });
  };

  books.forEach((book, bookIndex) => {
    const page = doc.addPage([W, H]);
    let size = 28;
    while (size > 12 && bold.widthOfTextAtSize(title, size) > W - margin * 2) size -= 1;
    centred(page, title, W / 2, H - 22 * MM, size, bold, accent);
    centred(page, 'Cross off each number as it is called', W / 2, H - 30 * MM, 11, regular, grey);

    book.forEach((ticket, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x0 = margin + col * (ticketW + gap);
      const y0 = top - row * (ticketH + 9 * MM) - ticketH;
      page.drawRectangle({ x: x0, y: y0 + cellH * 3, width: ticketW, height: stripH, color: accent });
      page.drawText(`Ticket ${bookIndex * 6 + index + 1}`, { x: x0 + 3 * MM, y: y0 + cellH * 3 + 2.2 * MM, size: 10, font: bold, color: lib.rgb(1, 1, 1) });
      ticket.forEach((cells, rr) => {
        cells.forEach((value, cc) => {
          const x = x0 + cc * cellW;
          const y = y0 + (2 - rr) * cellH;
          page.drawRectangle({ x, y, width: cellW, height: cellH, color: value === null ? tint : lib.rgb(1, 1, 1), borderColor: accent, borderWidth: 0.8 });
          if (value !== null) centred(page, String(value), x + cellW / 2, y + cellH / 2 - 7.5, 22, bold);
        });
      });
    });

    centred(page, 'Prizes: Early Five  ·  Top Line  ·  Middle Line  ·  Bottom Line  ·  Full House', W / 2, 24 * MM, 10, regular, grey);
    if (footer) centred(page, footer, W / 2, 17 * MM, 11, bold, ink);
  });
  return doc.save();
}
