import {
  PRODUCT_UNITS,
  type InventoryItem,
  type InvoiceDraft,
  type InvoiceLine,
  type InvoiceTotals,
  type PosProfileFile,
  type PosWorkspace,
  type ProductUnit,
  type StoreProfile,
} from './types';

export function createId(): string {
  return crypto.randomUUID();
}

export function createInvoiceDraft(invoicePrefix = 'INV', date = new Date()): InvoiceDraft {
  const datePart = date.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
  return {
    number: `${invoicePrefix.trim().toUpperCase()}-${datePart}-${suffix}`,
    date: date.toISOString().slice(0, 10),
    customerName: '',
    customerContact: '',
    notes: '',
    lines: [],
  };
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals(store: StoreProfile, lines: InvoiceLine[]): InvoiceTotals {
  const primaryRate = Math.max(0, store.taxRate);
  const additionalRate = Math.max(0, store.additionalTaxRate);
  const combinedRate = primaryRate + additionalRate;
  const lineTotals = lines.map((line) => {
    const gross = roundCurrency(line.quantity * line.unitPrice);
    const taxable = store.taxMode === 'inclusive' && combinedRate > 0
      ? roundCurrency(gross / (1 + combinedRate / 100))
      : gross;
    const tax = roundCurrency(taxable * primaryRate / 100);
    const additionalTax = store.taxMode === 'inclusive' && combinedRate > 0
      ? roundCurrency(gross - taxable - tax)
      : roundCurrency(taxable * additionalRate / 100);
    return { line, gross, taxable, tax, additionalTax };
  });
  const subtotal = roundCurrency(lineTotals.reduce((sum, item) => sum + item.taxable, 0));
  const tax = roundCurrency(lineTotals.reduce((sum, item) => sum + item.tax, 0));
  const additionalTax = roundCurrency(lineTotals.reduce((sum, item) => sum + item.additionalTax, 0));
  const charge = lines.length > 0 ? roundCurrency(Math.max(0, store.chargeAmount)) : 0;
  const total = store.taxMode === 'inclusive'
    ? roundCurrency(lineTotals.reduce((sum, item) => sum + item.gross, 0) + charge)
    : roundCurrency(subtotal + tax + additionalTax + charge);
  return { lines: lineTotals, subtotal, tax, additionalTax, charge, total };
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function createWorkspaceFile(
  store: StoreProfile,
  inventory: InventoryItem[],
  invoice: InvoiceDraft,
): PosWorkspace {
  return {
    schema: 'mydailyutils.pos-workspace',
    version: 1,
    store,
    inventory,
    invoice,
    exportedAt: new Date().toISOString(),
  };
}

export function createProfileFile(store: StoreProfile, inventory: InventoryItem[]): PosProfileFile {
  return {
    schema: 'mydailyutils.pos-profile',
    version: 1,
    store,
    inventory,
    exportedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseStore(value: unknown): StoreProfile {
  if (!isRecord(value)) throw new Error('The saved shop profile is not valid.');
  const strings = ['name', 'tagline', 'address', 'taxId', 'phone', 'email', 'currency', 'taxLabel'] as const;
  for (const key of strings) {
    if (typeof value[key] !== 'string') throw new Error(`The shop profile field "${key}" is missing or invalid.`);
  }
  if (!/^[A-Za-z]{3}$/.test(value.currency as string)) {
    throw new Error('Currency must be a three-letter code, such as INR or USD.');
  }
  if (!isNonNegativeNumber(value.taxRate) || value.taxRate > 100) {
    throw new Error('The saved tax rate must be between 0 and 100.');
  }
  if (value.taxMode !== 'inclusive' && value.taxMode !== 'exclusive') {
    throw new Error('The saved tax calculation mode is invalid.');
  }
  const invoicePrefix = value.invoicePrefix === undefined ? 'INV' : value.invoicePrefix;
  if (typeof invoicePrefix !== 'string' || !/^[A-Za-z0-9]{1,10}$/.test(invoicePrefix.trim())) {
    throw new Error('The saved bill number prefix must contain 1 to 10 letters or numbers.');
  }
  const additionalTaxLabel = value.additionalTaxLabel === undefined ? '' : value.additionalTaxLabel;
  const additionalTaxRate = value.additionalTaxRate === undefined ? 0 : value.additionalTaxRate;
  const chargeLabel = value.chargeLabel === undefined ? '' : value.chargeLabel;
  const chargeAmount = value.chargeAmount === undefined ? 0 : value.chargeAmount;
  if (typeof additionalTaxLabel !== 'string' || typeof chargeLabel !== 'string') {
    throw new Error('The saved additional tax and charge labels must be text.');
  }
  if (!isNonNegativeNumber(additionalTaxRate) || additionalTaxRate > 100) {
    throw new Error('The saved additional tax rate must be between 0 and 100.');
  }
  if (!isNonNegativeNumber(chargeAmount)) {
    throw new Error('The saved additional charge must be zero or a positive amount.');
  }
  return {
    name: value.name as string,
    tagline: value.tagline as string,
    address: value.address as string,
    taxId: value.taxId as string,
    phone: value.phone as string,
    email: value.email as string,
    invoicePrefix: invoicePrefix.trim().toUpperCase(),
    currency: (value.currency as string).toUpperCase(),
    taxLabel: value.taxLabel as string,
    taxRate: value.taxRate,
    additionalTaxLabel,
    additionalTaxRate,
    chargeLabel,
    chargeAmount,
    taxMode: value.taxMode,
  };
}

function parseInventory(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) throw new Error('The saved inventory is invalid.');
  const allowedUnits = new Set(PRODUCT_UNITS.map((unit) => unit.value));
  return value.map((entry, index) => {
    if (!isRecord(entry)
      || typeof entry.id !== 'string'
      || typeof entry.name !== 'string'
      || typeof entry.sku !== 'string'
      || !allowedUnits.has(entry.unit as ProductUnit)
      || !isNonNegativeNumber(entry.price)) {
      throw new Error(`Inventory item ${index + 1} is invalid.`);
    }
    return {
      id: entry.id,
      name: entry.name,
      sku: entry.sku,
      unit: entry.unit as ProductUnit,
      price: entry.price,
    };
  });
}

function parseInvoice(value: unknown): InvoiceDraft {
  if (!isRecord(value)
    || typeof value.number !== 'string'
    || typeof value.date !== 'string'
    || typeof value.customerName !== 'string'
    || typeof value.customerContact !== 'string'
    || typeof value.notes !== 'string'
    || !Array.isArray(value.lines)) {
    throw new Error('The saved bill is invalid.');
  }
  const allowedUnits = new Set(PRODUCT_UNITS.map((unit) => unit.value));
  const lines = value.lines.map((entry, index): InvoiceLine => {
    if (!isRecord(entry)
      || typeof entry.id !== 'string'
      || typeof entry.itemId !== 'string'
      || typeof entry.name !== 'string'
      || typeof entry.sku !== 'string'
      || !allowedUnits.has(entry.unit as ProductUnit)
      || !isNonNegativeNumber(entry.unitPrice)
      || !isNonNegativeNumber(entry.quantity)) {
      throw new Error(`Bill item ${index + 1} is invalid.`);
    }
    return {
      id: entry.id,
      itemId: entry.itemId,
      name: entry.name,
      sku: entry.sku,
      unit: entry.unit as ProductUnit,
      unitPrice: entry.unitPrice,
      quantity: entry.quantity,
    };
  });
  return {
    number: value.number,
    date: value.date,
    customerName: value.customerName,
    customerContact: value.customerContact,
    notes: value.notes,
    lines,
  };
}

export type ImportedPosFile =
  | { kind: 'profile'; store: StoreProfile; inventory: InventoryItem[] }
  | { kind: 'workspace'; store: StoreProfile; inventory: InventoryItem[]; invoice: InvoiceDraft };

export function parsePosJson(source: string): ImportedPosFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error('This JSON file is not a supported MyDailyUtils POS export.');
  }
  const store = parseStore(parsed.store);
  const inventory = parseInventory(parsed.inventory);
  if (parsed.schema === 'mydailyutils.pos-profile') return { kind: 'profile', store, inventory };
  if (parsed.schema === 'mydailyutils.pos-workspace') {
    return { kind: 'workspace', store, inventory, invoice: parseInvoice(parsed.invoice) };
  }
  throw new Error('This JSON file is not a supported MyDailyUtils shop profile or bill JSON file.');
}
