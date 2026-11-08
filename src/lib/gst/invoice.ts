export const GST_STATES: { code: string; name: string }[] = [
  ['01', 'Jammu and Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'], ['05', 'Uttarakhand'], ['06', 'Haryana'],
  ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'], ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'],
  ['13', 'Nagaland'], ['14', 'Manipur'], ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'],
  ['19', 'West Bengal'], ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
  ['26', 'Dadra and Nagar Haveli and Daman and Diu'], ['27', 'Maharashtra'], ['29', 'Karnataka'], ['30', 'Goa'], ['31', 'Lakshadweep'],
  ['32', 'Kerala'], ['33', 'Tamil Nadu'], ['34', 'Puducherry'], ['35', 'Andaman and Nicobar Islands'], ['36', 'Telangana'],
  ['37', 'Andhra Pradesh'], ['38', 'Ladakh'], ['97', 'Other Territory'],
].map(([code, name]) => ({ code, name }));

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export type GstinCheck = { ok: true; stateCode: string } | { ok: false; reason: string };

/** Checks the layout and the check character of a GSTIN. It cannot tell whether the number is registered. */
export function checkGstin(value: string): GstinCheck {
  const gstin = value.trim().toUpperCase();
  if (gstin.length !== 15) return { ok: false, reason: 'A GSTIN has 15 characters.' };
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return { ok: false, reason: 'The GSTIN format is not valid.' };
  if (!GST_STATES.some((state) => state.code === gstin.slice(0, 2))) return { ok: false, reason: 'The first two digits are not a state code.' };
  let sum = 0;
  for (let i = 0; i < 14; i += 1) {
    const product = CHARSET.indexOf(gstin[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  const expected = CHARSET[(36 - (sum % 36)) % 36];
  return gstin[14] === expected ? { ok: true, stateCode: gstin.slice(0, 2) } : { ok: false, reason: 'The last character does not match, so a character may be mistyped.' };
}

export interface InvoiceItemInput {
  description: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: number;
}

export interface InvoiceLine extends InvoiceItemInput {
  gross: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface RateSummary { rate: number; taxable: number; cgst: number; sgst: number; igst: number }

export interface InvoiceTotals {
  lines: InvoiceLine[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  grand: number;
  roundOff: number;
  payable: number;
  byRate: RateSummary[];
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Intra-state supply charges CGST + SGST (half each); inter-state supply charges IGST. */
export function computeInvoice(items: InvoiceItemInput[], intraState: boolean, roundToRupee: boolean): InvoiceTotals {
  const lines: InvoiceLine[] = items.map((item) => {
    const gross = round2(item.qty * item.rate);
    const discount = round2((gross * item.discountPercent) / 100);
    const taxable = round2(gross - discount);
    const cgst = intraState ? round2((taxable * item.gstRate) / 200) : 0;
    const sgst = intraState ? round2((taxable * item.gstRate) / 200) : 0;
    const igst = intraState ? 0 : round2((taxable * item.gstRate) / 100);
    return { ...item, gross, discount, taxable, cgst, sgst, igst, total: round2(taxable + cgst + sgst + igst) };
  });
  const sum = (pick: (line: InvoiceLine) => number) => round2(lines.reduce((total, line) => total + pick(line), 0));
  const byRateMap = new Map<number, RateSummary>();
  for (const line of lines) {
    const row = byRateMap.get(line.gstRate) ?? { rate: line.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    row.taxable = round2(row.taxable + line.taxable);
    row.cgst = round2(row.cgst + line.cgst);
    row.sgst = round2(row.sgst + line.sgst);
    row.igst = round2(row.igst + line.igst);
    byRateMap.set(line.gstRate, row);
  }
  const grand = sum((line) => line.total);
  const payable = roundToRupee ? Math.round(grand) : grand;
  return {
    lines,
    taxable: sum((line) => line.taxable),
    cgst: sum((line) => line.cgst),
    sgst: sum((line) => line.sgst),
    igst: sum((line) => line.igst),
    tax: sum((line) => line.cgst + line.sgst + line.igst),
    grand,
    roundOff: round2(payable - grand),
    payable,
    byRate: [...byRateMap.values()].sort((a, b) => a.rate - b.rate),
  };
}
