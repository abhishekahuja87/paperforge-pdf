/** Form shapes and checks for the shop bill page: the item form, where a loaded shop profile came from, and the setup checks. */
import { createInvoiceDraft } from './workspace';
import { type InventoryItem, type InvoiceDraft, type ProductUnit, type StoreProfile } from './types';

export interface ItemForm {
  name: string;
  sku: string;
  unit: ProductUnit;
  price: string;
}

export type ProfileSource =
  | { kind: 'new' }
  | { kind: 'file'; name: string; snapshot: string }
  | { kind: 'browser'; id: string; name: string; snapshot: string };

export function profileSnapshot(profile: StoreProfile, inventory: InventoryItem[]): string {
  return JSON.stringify({ store: { ...profile, currency: profile.currency.trim().toUpperCase(), invoicePrefix: profile.invoicePrefix.trim().toUpperCase() }, inventory });
}

export const EMPTY_ITEM: ItemForm = { name: '', sku: '', unit: 'pcs', price: '' };

export function newInvoiceForStore(invoicePrefix = 'INV'): InvoiceDraft {
  return createInvoiceDraft(invoicePrefix);
}

export function validateStore(store: StoreProfile): string {
  if (!store.name.trim()) return 'Enter your shop name.';
  if (!/^[A-Za-z0-9]{1,10}$/.test(store.invoicePrefix.trim())) return 'Enter a bill number prefix with 1 to 10 letters or numbers.';
  if (!/^[A-Za-z]{3}$/.test(store.currency.trim())) return 'Enter a three-letter currency code, such as INR or USD.';
  if (!Number.isFinite(store.taxRate) || store.taxRate < 0 || store.taxRate > 100) return 'Tax rate must be between 0 and 100%.';
  if (!Number.isFinite(store.additionalTaxRate) || store.additionalTaxRate < 0 || store.additionalTaxRate > 100) return 'Additional tax rate must be between 0 and 100%.';
  if (!Number.isFinite(store.chargeAmount) || store.chargeAmount < 0) return 'Additional charge must be zero or a positive amount.';
  if (store.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.email)) return 'Enter a valid contact email address.';
  return '';
}

export type PosStudioStep = 'setup' | 'billing';
