/** A small made-up bank statement PDF to try the tool with. Everything in it is invented. */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const ROWS: string[][] = [
  ['01 Oct', 'Opening balance', '', '', '', '52,430.00'],
  ['02 Oct', 'UPI/Grocery Mart/Ravi', 'UPI4412', '1,250.00', '', '51,180.00'],
  ['03 Oct', 'Salary credit Oct', 'NEFT881', '', '48,000.00', '99,180.00'],
  ['05 Oct', 'ATM cash withdrawal', 'ATM0071', '5,000.00', '', '94,180.00'],
  ['07 Oct', 'Electricity bill online payment for the month of September 2026', 'BILL220', '2,340.50', '', '91,839.50'],
  ['09 Oct', 'UPI/Cafe Sunrise/Meena', 'UPI4498', '480.00', '', '91,359.50'],
  ['11 Oct', 'Mobile recharge', 'UPI4501', '399.00', '', '90,960.50'],
  ['14 Oct', 'Interest credit', 'INT0010', '', '312.40', '91,272.90'],
  ['16 Oct', 'Rent transfer', 'IMPS330', '18,000.00', '', '73,272.90'],
  ['18 Oct', 'UPI/Pharmacy Plus/Amit', 'UPI4577', '860.00', '', '72,412.90'],
  ['21 Oct', 'Refund from online store', 'REF9012', '', '1,299.00', '73,711.90'],
  ['24 Oct', 'Cheque deposit', 'CHQ0456', '', '7,500.00', '81,211.90'],
];

/** The sample statement as a File (two pages, the heading row repeated on page two, one long description that wraps). */
export async function makeSamplePdf(): Promise<File> {
  const doc = await PDFDocument.create(), font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const heads = ['Date', 'Description', 'Ref no', 'Withdrawal', 'Deposit', 'Balance'], left = [40, 100, 285, 380, 450, 520], rightEdge = [0, 0, 0, 430, 500, 570];
  const draw = (page: ReturnType<typeof doc.addPage>, y: number, cells: string[], face: typeof font) => cells.forEach((text, n) => {
    if (!text) return;
    const x = rightEdge[n] ? rightEdge[n]! - face.widthOfTextAtSize(text, 9) : left[n]!;
    page.drawText(text, { x, y, size: 9, font: face, color: rgb(0.1, 0.1, 0.1) });
  });
  const pages = [ROWS.slice(0, 7), ROWS.slice(7)];
  pages.forEach((rows, p) => {
    const page = doc.addPage([595, 842]); let y = 790;
    if (p === 0) {
      page.drawText('Sample Savings Account Statement', { x: 40, y, size: 15, font: bold }); y -= 22;
      page.drawText('Account: 1234567890', { x: 40, y, size: 9, font }); page.drawText('Period: 01 Oct 2026 to 31 Oct 2026', { x: 300, y, size: 9, font }); y -= 30;
    }
    draw(page, y, heads, bold); y -= 20;
    rows.forEach((row) => {
      if (row[1]!.length > 40) { const cut = row[1]!.lastIndexOf(' ', 38); draw(page, y, [row[0]!, row[1]!.slice(0, cut), ...row.slice(2)], font); y -= 12; draw(page, y, ['', row[1]!.slice(cut + 1), '', '', '', ''], font); y -= 18; }
      else { draw(page, y, row, font); y -= 18; }
    });
  });
  return new File([await doc.save()], 'sample-bank-statement.pdf', { type: 'application/pdf' });
}
