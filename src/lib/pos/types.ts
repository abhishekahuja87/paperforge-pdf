export type TaxMode = 'exclusive' | 'inclusive';

export type ProductUnit =
  | 'pcs'
  | 'kg'
  | 'g'
  | 'lb'
  | 'oz'
  | 'L'
  | 'mL'
  | 'm'
  | 'cm'
  | 'box'
  | 'pack';

export interface StoreProfile {
  name: string;
  tagline: string;
  address: string;
  taxId: string;
  phone: string;
  email: string;
  invoicePrefix: string;
  currency: string;
  taxLabel: string;
  taxRate: number;
  additionalTaxLabel: string;
  additionalTaxRate: number;
  chargeLabel: string;
  chargeAmount: number;
  taxMode: TaxMode;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  price: number;
}

export interface InvoiceLine {
  id: string;
  itemId: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  unitPrice: number;
  quantity: number;
}

export interface InvoiceDraft {
  number: string;
  date: string;
  customerName: string;
  customerContact: string;
  notes: string;
  lines: InvoiceLine[];
}

export interface PosWorkspace {
  schema: 'mydailyutils.pos-workspace';
  version: 1;
  store: StoreProfile;
  inventory: InventoryItem[];
  invoice: InvoiceDraft;
  exportedAt: string;
}

export interface PosProfileFile {
  schema: 'mydailyutils.pos-profile';
  version: 1;
  store: StoreProfile;
  inventory: InventoryItem[];
  exportedAt: string;
}

export interface InvoiceLineTotal {
  line: InvoiceLine;
  gross: number;
  taxable: number;
  tax: number;
  additionalTax: number;
}

export interface InvoiceTotals {
  lines: InvoiceLineTotal[];
  subtotal: number;
  tax: number;
  additionalTax: number;
  charge: number;
  total: number;
}

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  name: '',
  tagline: '',
  address: '',
  taxId: '',
  phone: '',
  email: '',
  invoicePrefix: 'INV',
  currency: 'INR',
  taxLabel: 'GST',
  taxRate: 0,
  additionalTaxLabel: '',
  additionalTaxRate: 0,
  chargeLabel: '',
  chargeAmount: 0,
  taxMode: 'exclusive',
};

export const PRODUCT_UNITS: Array<{ value: ProductUnit; label: string; family: string }> = [
  { value: 'pcs', label: 'Pieces (pcs)', family: 'Count' },
  { value: 'box', label: 'Box', family: 'Count' },
  { value: 'pack', label: 'Pack', family: 'Count' },
  { value: 'kg', label: 'Kilogram (kg)', family: 'Weight' },
  { value: 'g', label: 'Gram (g)', family: 'Weight' },
  { value: 'lb', label: 'Pound (lb)', family: 'Weight' },
  { value: 'oz', label: 'Ounce (oz)', family: 'Weight' },
  { value: 'L', label: 'Litre (L)', family: 'Volume' },
  { value: 'mL', label: 'Millilitre (mL)', family: 'Volume' },
  { value: 'm', label: 'Metre (m)', family: 'Length' },
  { value: 'cm', label: 'Centimetre (cm)', family: 'Length' },
];
