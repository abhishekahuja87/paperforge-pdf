import type { Schedule } from './emiSchedule';
import { monthLabel } from './emiSchedule';

export interface EmiPdfInput {
  schedule: Schedule;
  principal: number;
  annualRate: number;
  /** First EMI month as yyyy-mm, or an empty text when not given. */
  startMonth: string;
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
/** The standard PDF fonts have no rupee sign, so the PDF writes "Rs." instead. */
const rs = (value: number): string => `Rs. ${inr.format(Math.round(value))}`;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const ROW_H = 16;

/** Builds a month-by-month repayment schedule as a PDF. Every month is listed, across as many pages as needed. */
export async function buildEmiSchedulePdf(input: EmiPdfInput): Promise<Uint8Array> {
  const lib = await import('pdf-lib');
  const doc = await lib.PDFDocument.create();
  const regular = await doc.embedFont(lib.StandardFonts.Helvetica);
  const bold = await doc.embedFont(lib.StandardFonts.HelveticaBold);
  const { schedule, principal, annualRate, startMonth } = input;
  const hasExtra = schedule.totalExtra > 0;
  const columns = hasExtra ? ['Month', 'EMI', 'Principal', 'Interest', 'Extra', 'Balance'] : ['Month', 'EMI', 'Principal', 'Interest', 'Balance'];
  const colW = (PAGE_W - MARGIN * 2) / columns.length;
  const dark = lib.rgb(0.1, 0.1, 0.1);
  const grey = lib.rgb(0.4, 0.4, 0.4);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  page.drawText('Loan repayment schedule', { x: MARGIN, y: y - 16, size: 18, font: bold, color: dark });
  y -= 40;
  const summary = [
    `Loan amount: ${rs(principal)}   Interest rate: ${annualRate}% a year   Monthly EMI: ${rs(schedule.emi)}`,
    `Total interest: ${rs(schedule.totalInterest)}   Total payment: ${rs(schedule.totalPaid)}   Months to repay: ${schedule.months}`,
  ];
  for (const text of summary) { page.drawText(text, { x: MARGIN, y, size: 9, font: regular, color: grey }); y -= 14; }
  y -= 10;

  const header = () => {
    page.drawRectangle({ x: MARGIN, y: y - 4, width: PAGE_W - MARGIN * 2, height: ROW_H, color: lib.rgb(0.95, 0.93, 0.9) });
    columns.forEach((label, index) => {
      const width = bold.widthOfTextAtSize(label, 9);
      page.drawText(label, { x: index === 0 ? MARGIN + 4 : MARGIN + colW * (index + 1) - width - 4, y, size: 9, font: bold, color: dark });
    });
    y -= ROW_H;
  };
  header();

  for (const row of schedule.rows) {
    if (y < MARGIN + 20) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      header();
    }
    const cells = hasExtra
      ? [monthLabel(startMonth, row.month), rs(row.emi), rs(row.principal), rs(row.interest), row.extra > 0 ? rs(row.extra) : '-', rs(row.balance)]
      : [monthLabel(startMonth, row.month), rs(row.emi), rs(row.principal), rs(row.interest), rs(row.balance)];
    cells.forEach((cell, index) => {
      const width = regular.widthOfTextAtSize(cell, 9);
      page.drawText(cell, { x: index === 0 ? MARGIN + 4 : MARGIN + colW * (index + 1) - width - 4, y, size: 9, font: regular, color: dark });
    });
    y -= ROW_H;
  }
  return doc.save();
}
