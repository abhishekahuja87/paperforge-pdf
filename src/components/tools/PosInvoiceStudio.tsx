import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Archive,
  Building2,
  FileImage,
  FilePlus2,
  FileUp,
  Pencil,
  Printer,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { downloadBlob, safeFileBaseName } from '../../lib/browserTools';
import { deleteSavedProfile, getSavedProfile, listSavedProfiles, replaceSavedProfile, saveNewProfile, type SavedProfile } from '../../lib/pos/profileStorage';
import { SavedProfiles } from './pos/SavedProfiles';
import {
  calculateInvoiceTotals,
  createId,
  createInvoiceDraft,
  createProfileFile,
  createWorkspaceFile,
  formatMoney,
  parsePosJson,
} from '../../lib/pos/workspace';
import {
  DEFAULT_STORE_PROFILE,
  PRODUCT_UNITS,
  type InventoryItem,
  type InvoiceDraft,
  type PosProfileFile,
  type PosWorkspace,
  type ProductUnit,
  type StoreProfile,
} from '../../lib/pos/types';

interface ItemForm {
  name: string;
  sku: string;
  unit: ProductUnit;
  price: string;
}

type ProfileSource =
  | { kind: 'new' }
  | { kind: 'file'; name: string; snapshot: string }
  | { kind: 'browser'; id: string; name: string; snapshot: string };

function profileSnapshot(profile: StoreProfile, inventory: InventoryItem[]): string {
  return JSON.stringify({ store: { ...profile, currency: profile.currency.trim().toUpperCase(), invoicePrefix: profile.invoicePrefix.trim().toUpperCase() }, inventory });
}

const EMPTY_ITEM: ItemForm = { name: '', sku: '', unit: 'pcs', price: '' };
const fieldClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const labelClass = 'block min-w-0 text-xs font-semibold text-slate-600';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50';
const shareButtonClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50';
const backupButtonClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50';
const OKLCH_PATTERN = /oklch\(([^)]+)\)/gi;

function oklchToRgba(value: string): string {
  const [lightnessValue, chromaValue, hueValue, alphaValue] = value.replace(/\s*\/\s*/, ' ').trim().split(/\s+/);
  const lightness = Number.parseFloat(lightnessValue) / (lightnessValue.endsWith('%') ? 100 : 1);
  const chroma = Number.parseFloat(chromaValue) * (chromaValue.endsWith('%') ? 0.004 : 1);
  const hueNumber = Number.parseFloat(hueValue);
  const hue = hueNumber * (
    hueValue.endsWith('turn') ? 360
      : hueValue.endsWith('rad') ? 180 / Math.PI
        : hueValue.endsWith('grad') ? 0.9
          : 1
  );
  const alpha = alphaValue
    ? Number.parseFloat(alphaValue) / (alphaValue.endsWith('%') ? 100 : 1)
    : 1;
  if (![lightness, chroma, hue, alpha].every(Number.isFinite)) {
    throw new Error(`Could not normalize the bill color "${value}".`);
  }
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => {
    const linear = Math.max(0, Math.min(1, channel));
    const srgb = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255);
  });
  return `rgba(${channels.join(', ')}, ${alpha})`;
}

function normalizeCanvasColors(document: Document, root: HTMLElement): void {
  document.documentElement.style.backgroundColor = 'transparent';
  document.body.style.backgroundColor = 'transparent';
  const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
  for (const element of elements) {
    const computedStyle = document.defaultView?.getComputedStyle(element);
    if (!computedStyle) continue;
    for (let index = 0; index < computedStyle.length; index += 1) {
      const property = computedStyle.item(index);
      if (property.startsWith('--')) continue;
      const value = computedStyle.getPropertyValue(property);
      if (value.includes('oklch(')) {
        element.style.setProperty(property, value.replace(OKLCH_PATTERN, (_, color: string) => oklchToRgba(color)));
      }
    }
  }
}

function newInvoiceForStore(invoicePrefix = 'INV'): InvoiceDraft {
  return createInvoiceDraft(invoicePrefix);
}

function validateStore(store: StoreProfile): string {
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

interface PosInvoiceStudioProps {
  step: PosStudioStep;
  setStep: React.Dispatch<React.SetStateAction<PosStudioStep>>;
}

export const PosInvoiceStudio: React.FC<PosInvoiceStudioProps> = ({ step, setStep }) => {
  const { t, i18n } = useTranslation();
  const [hasStartedBilling, setHasStartedBilling] = useState(false);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [storeForm, setStoreForm] = useState<StoreProfile>(DEFAULT_STORE_PROFILE);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoice, setInvoice] = useState<InvoiceDraft>(newInvoiceForStore);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [storageBusy, setStorageBusy] = useState(true);
  const [storageFailed, setStorageFailed] = useState(false);
  const [profileSource, setProfileSource] = useState<ProfileSource>({ kind: 'new' });
  const importInputRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setStorageBusy(true);
    listSavedProfiles().then((profiles) => {
      if (active) {
        setSavedProfiles(profiles);
        setStorageFailed(false);
      }
    }).catch((reason: unknown) => {
      console.error('Could not read saved POS profiles:', reason);
      if (active) setStorageFailed(true);
    }).finally(() => {
      if (active) setStorageBusy(false);
    });
    return () => { active = false; };
  }, []);

  const totals = useMemo(
    () => calculateInvoiceTotals(store ?? storeForm, invoice.lines),
    [store, storeForm, invoice.lines],
  );
  const filteredInventory = inventory.filter((item) => {
    const normalized = itemSearch.trim().toLowerCase();
    return !normalized
      || item.name.toLowerCase().includes(normalized)
      || item.sku.toLowerCase().includes(normalized);
  });
  const canContinueToBilling = inventory.length > 0 || invoice.lines.length > 0;
  const hasCurrentWork = Boolean(store || hasStartedBilling || itemForm.name || itemForm.sku || itemForm.price)
    || profileSnapshot(storeForm, inventory) !== profileSnapshot(DEFAULT_STORE_PROFILE, []);

  const commitStore = (nextStore: StoreProfile, nextInventory = inventory) => {
    const validationMessage = validateStore(nextStore);
    if (validationMessage) {
      setError(validationMessage);
      return false;
    }
    const normalizedStore = {
      ...nextStore,
      currency: nextStore.currency.trim().toUpperCase(),
      invoicePrefix: nextStore.invoicePrefix.trim().toUpperCase(),
    };
    setStore(normalizedStore);
    setStoreForm(normalizedStore);
    setInventory(nextInventory);
    setError('');
    setNotice(t('posStorage.sessionNotice'));
    return true;
  };

  const updateBillingSetting = <K extends 'taxLabel' | 'taxRate' | 'additionalTaxLabel' | 'additionalTaxRate' | 'chargeLabel' | 'chargeAmount',>(
    key: K,
    value: StoreProfile[K],
  ) => {
    setStore((current) => current ? { ...current, [key]: value } : current);
    setStoreForm((current) => ({ ...current, [key]: value }));
  };

  const downloadProfile = (profile = store, items = inventory) => {
    if (!profile) {
      setError('Create a shop profile before exporting it.');
      return;
    }
    const savedProfile = {
      ...profile,
      currency: profile.currency.trim().toUpperCase(),
      invoicePrefix: profile.invoicePrefix.trim().toUpperCase(),
    };
    const payload: PosProfileFile = createProfileFile(savedProfile, items);
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(file, `${safeFileBaseName(savedProfile.name)}-pos-profile.json`);
    setNotice(`Shop profile downloaded with your details and ${items.length} inventory item${items.length === 1 ? '' : 's'}. Import this profile JSON next time to continue.`);
    setError('');
  };

  const downloadWorkspace = (profile = store, items = inventory, draft = invoice) => {
    if (!profile) {
      setError('Create a shop profile before exporting a bill.');
      return;
    }
    const payload: PosWorkspace = createWorkspaceFile(profile, items, draft);
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(file, `${safeFileBaseName(draft.number)}-bill.json`);
    setNotice('Bill JSON downloaded with the shop profile and inventory. Import it later to restore this bill and its details.');
    setError('');
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setError('');
    setNotice('');
    try {
      const imported = parsePosJson(await file.text());
      if (hasCurrentWork && !window.confirm(t('posStorage.confirmLoad'))) return;
      setStore(imported.store);
      setStoreForm(imported.store);
      setInventory(imported.inventory);
      setInvoice(imported.kind === 'workspace' ? imported.invoice : newInvoiceForStore(imported.store.invoicePrefix));
      setHasStartedBilling(imported.kind === 'workspace');
      setItemForm(EMPTY_ITEM);
      setEditingItemId(null);
      setSelectedItemId('');
      setItemSearch('');
      setProfileSource({ kind: 'file', name: file.name, snapshot: profileSnapshot(imported.store, imported.inventory) });
      const opensBill = imported.kind === 'workspace'
        && (imported.inventory.length > 0 || imported.invoice.lines.length > 0);
      setStep(opensBill ? 'billing' : 'setup');
      setNotice(opensBill
        ? 'Bill JSON imported. Your bill, shop profile, and inventory are ready.'
        : imported.kind === 'workspace'
          ? 'Bill JSON imported, but it has no inventory or bill items. Add at least one item to inventory before continuing.'
          : 'Shop profile and inventory imported. Review them, then continue to your bill.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not import this JSON file.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const refreshProfiles = async () => {
    setStorageBusy(true);
    setNotice('');
    try {
      setSavedProfiles(await listSavedProfiles());
      setStorageFailed(false);
      setError('');
    } catch (reason) {
      console.error('Could not read saved POS profiles:', reason);
      setStorageFailed(true);
    } finally {
      setStorageBusy(false);
    }
  };

  const saveProfileToBrowser = async (target?: SavedProfile) => {
    if (editingItemId || itemForm.name || itemForm.sku || itemForm.price) {
      setError(t('posStorage.pendingItem'));
      return;
    }
    const validationMessage = validateStore(storeForm);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    if (target && !window.confirm(t('posStorage.confirmReplace', { name: target.name }))) return;
    const normalized = { ...storeForm, currency: storeForm.currency.trim().toUpperCase(), invoicePrefix: storeForm.invoicePrefix.trim().toUpperCase() };
    const payload = createProfileFile(normalized, inventory);
    setStorageBusy(true);
    setNotice('');
    try {
      const saved = target ? await replaceSavedProfile(target.id, payload) : await saveNewProfile(payload);
      setSavedProfiles((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setProfileSource({ kind: 'browser', id: saved.id, name: saved.name, snapshot: profileSnapshot(normalized, inventory) });
      setStorageFailed(false);
      setError('');
      setNotice(t('posStorage.saved', { name: saved.name }));
    } catch (reason) {
      console.error('Could not save POS profile:', reason);
      setStorageFailed(true);
    } finally {
      setStorageBusy(false);
    }
  };

  const loadProfileFromBrowser = async (id: string) => {
    if (hasCurrentWork && !window.confirm(t('posStorage.confirmLoad'))) return;
    setStorageBusy(true);
    setNotice('');
    try {
      const saved = await getSavedProfile(id);
      const { store: loadedStore, inventory: loadedInventory } = saved.profile;
      setStore(loadedStore);
      setStoreForm(loadedStore);
      setInventory(loadedInventory);
      setInvoice(newInvoiceForStore(loadedStore.invoicePrefix));
      setHasStartedBilling(false);
      setItemForm(EMPTY_ITEM);
      setEditingItemId(null);
      setSelectedItemId('');
      setItemSearch('');
      setStep('setup');
      setProfileSource({ kind: 'browser', id: saved.id, name: saved.name, snapshot: profileSnapshot(loadedStore, loadedInventory) });
      setStorageFailed(false);
      setError('');
      setNotice(t('posStorage.loaded', { name: saved.name }));
    } catch (reason) {
      console.error('Could not load POS profile:', reason);
      setStorageFailed(true);
    } finally {
      setStorageBusy(false);
    }
  };

  const removeProfileFromBrowser = async (profile: SavedProfile) => {
    if (!window.confirm(t('posStorage.confirmDelete', { name: profile.name }))) return;
    setStorageBusy(true);
    setNotice('');
    try {
      await deleteSavedProfile(profile.id);
      setSavedProfiles((current) => current.filter((item) => item.id !== profile.id));
      setProfileSource((current) => current.kind === 'browser' && current.id === profile.id ? { kind: 'new' } : current);
      setStorageFailed(false);
      setError('');
      setNotice(t('posStorage.deleted', { name: profile.name }));
    } catch (reason) {
      console.error('Could not delete POS profile:', reason);
      setStorageFailed(true);
    } finally {
      setStorageBusy(false);
    }
  };

  const savedProfilesPanel = (compact = false) => (
    <SavedProfiles
      profiles={savedProfiles}
      activeLabel={profileSource.kind === 'new' ? t('posStorage.newProfile') : t(profileSource.kind === 'file' ? 'posStorage.fileSource' : 'posStorage.browserSource', { name: profileSource.name })}
      hasChanges={profileSource.kind !== 'new' && (profileSource.snapshot !== profileSnapshot(storeForm, inventory) || Boolean(editingItemId || itemForm.name || itemForm.sku || itemForm.price))}
      busy={storageBusy || editingNote}
      storageFailed={storageFailed}
      compact={compact}
      shopName={compact ? store?.name : undefined}
      onEdit={compact && store ? () => { setStoreForm(store); setStep('setup'); } : undefined}
      onDownload={compact && store ? () => downloadProfile() : undefined}
      onImport={() => importInputRef.current?.click()}
      onSaveNew={() => { void saveProfileToBrowser(); }}
      onLoad={(id) => { void loadProfileFromBrowser(id); }}
      onReplace={(profile) => { void saveProfileToBrowser(profile); }}
      onDelete={(profile) => { void removeProfileFromBrowser(profile); }}
      onRefresh={() => { void refreshProfiles(); }}
    />
  );

  const addOrUpdateItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = itemForm.name.trim();
    const price = Number(itemForm.price);
    if (!name) {
      setError('Enter an item name.');
      return;
    }
    if (!itemForm.price || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid selling price of zero or more.');
      return;
    }
    const item: InventoryItem = {
      id: editingItemId ?? createId(),
      name,
      sku: itemForm.sku.trim(),
      unit: itemForm.unit,
      price: Math.round((price + Number.EPSILON) * 100) / 100,
    };
    setInventory((current) => editingItemId
      ? current.map((existing) => existing.id === editingItemId ? item : existing)
      : [...current, item]);
    setItemForm(EMPTY_ITEM);
    setEditingItemId(null);
    setError('');
    setNotice(editingItemId ? 'Inventory item updated.' : `${name} added to shop inventory.`);
  };

  const editItem = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setItemForm({ name: item.name, sku: item.sku, unit: item.unit, price: String(item.price) });
  };

  const removeItem = (item: InventoryItem) => {
    setInventory((current) => current.filter((entry) => entry.id !== item.id));
    if (editingItemId === item.id) {
      setEditingItemId(null);
      setItemForm(EMPTY_ITEM);
    }
    setNotice(`${item.name} removed from shop inventory. Existing bill items are unchanged.`);
  };

  const addInvoiceItem = () => {
    const item = inventory.find((entry) => entry.id === selectedItemId);
    if (!item) {
      setError('Choose an item from shop inventory to add.');
      return;
    }
    setInvoice((current) => {
      const existing = current.lines.find((line) => line.itemId === item.id);
      if (existing) {
        return {
          ...current,
          lines: current.lines.map((line) => line.id === existing.id
            ? { ...line, quantity: line.quantity + 1 }
            : line),
        };
      }
      return {
        ...current,
        lines: [...current.lines, {
          id: createId(),
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          unit: item.unit,
          unitPrice: item.price,
          quantity: 1,
        }],
      };
    });
    setError('');
  };

  const updateLine = (lineId: string, quantity: number) => {
    setInvoice((current) => ({
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? { ...line, quantity } : line),
    }));
  };

  const removeLine = (lineId: string) => {
    setInvoice((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }));
  };

  const startNewInvoice = () => {
    if (!store) return;
    downloadWorkspace();
    setInvoice(newInvoiceForStore(store.invoicePrefix));
    setHasStartedBilling(true);
    setNotice('Current bill JSON downloaded with the shop profile and inventory. A new blank bill is ready.');
  };

  const continueToBilling = () => {
    if (!canContinueToBilling) {
      setError('Add at least one item to shop inventory before continuing to the bill.');
      setNotice('');
      return;
    }
    if (!commitStore(storeForm)) return;
    if (!hasStartedBilling) {
      setInvoice(newInvoiceForStore(storeForm.invoicePrefix));
      setHasStartedBilling(true);
    }
    setStep('billing');
    setNotice('Shop profile is ready. Add items from shop inventory to create a bill for your customer.');
  };

  const downloadSetup = () => {
    if (!commitStore(storeForm)) return;
    downloadProfile(storeForm, inventory);
  };

  const exportImage = async () => {
    if (!invoiceRef.current) {
      setError('Bill preview is not ready to download.');
      return;
    }
    setIsExportingImage(true);
    setError('');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: '#ffffff',
        scale: Math.min(2, window.devicePixelRatio || 1),
        ignoreElements: (element) => element.tagName === 'IFRAME',
        onclone: (document, clonedInvoice) => normalizeCanvasColors(document, clonedInvoice),
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('The browser could not create an image from this bill.'));
        }, 'image/png');
      });
      downloadBlob(blob, `${safeFileBaseName(invoice.number)}.png`);
      setNotice('Customer bill image downloaded.');
    } catch (reason) {
      setError(reason instanceof Error ? `Image export failed: ${reason.message}` : 'Image export failed.');
    } finally {
      setIsExportingImage(false);
    }
  };

  const updateInvoice = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => {
    setInvoice((current) => ({ ...current, [key]: value }));
  };

  const renderStoreFields = () => (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={`${labelClass} sm:col-span-2`}>
          <span lang={i18n.language}>{t('posPage.fields.name')}</span>
          <input className={fieldClass} value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} required autoComplete="organization" />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.tagline')}</span>
          <input className={fieldClass} value={storeForm.tagline} onChange={(event) => setStoreForm({ ...storeForm, tagline: event.target.value })} placeholder={t('posPage.fields.optional')} lang={i18n.language} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.taxId')}</span>
          <input className={fieldClass} value={storeForm.taxId} onChange={(event) => setStoreForm({ ...storeForm, taxId: event.target.value })} placeholder={t('posPage.fields.optional')} lang={i18n.language} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          <span lang={i18n.language}>{t('posPage.fields.address')}</span>
          <textarea className={fieldClass} rows={2} value={storeForm.address} onChange={(event) => setStoreForm({ ...storeForm, address: event.target.value })} placeholder={t('posPage.fields.addressPlaceholder')} lang={i18n.language} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.phone')}</span>
          <input className={fieldClass} type="tel" value={storeForm.phone} onChange={(event) => setStoreForm({ ...storeForm, phone: event.target.value })} autoComplete="tel" />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.email')}</span>
          <input className={fieldClass} type="email" value={storeForm.email} onChange={(event) => setStoreForm({ ...storeForm, email: event.target.value })} autoComplete="email" />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.prefix')}</span>
          <input className={fieldClass} value={storeForm.invoicePrefix} onChange={(event) => setStoreForm({ ...storeForm, invoicePrefix: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) })} maxLength={10} placeholder={t('posPage.fields.prefixPlaceholder')} lang={i18n.language} required />
          <span lang={i18n.language} className="mt-1 block font-normal text-slate-500">{t('posPage.fields.prefixHint')}</span>
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.currency')}</span>
          <input className={fieldClass} value={storeForm.currency} onChange={(event) => setStoreForm({ ...storeForm, currency: event.target.value.toUpperCase() })} maxLength={3} placeholder="INR" required />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.taxLabel')}</span>
          <input className={fieldClass} value={storeForm.taxLabel} onChange={(event) => setStoreForm({ ...storeForm, taxLabel: event.target.value })} placeholder={t('posPage.fields.taxPlaceholder')} lang={i18n.language} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.taxRate')}</span>
          <input className={fieldClass} type="number" min="0" max="100" step="0.01" value={storeForm.taxRate || ''} placeholder="0" onChange={(event) => setStoreForm({ ...storeForm, taxRate: Number(event.target.value) })} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.additionalLabel')}</span>
          <input className={fieldClass} value={storeForm.additionalTaxLabel} onChange={(event) => setStoreForm({ ...storeForm, additionalTaxLabel: event.target.value })} placeholder={t('posPage.fields.additionalPlaceholder')} lang={i18n.language} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.additionalRate')}</span>
          <input className={fieldClass} type="number" min="0" max="100" step="0.01" value={storeForm.additionalTaxRate || ''} placeholder="0" onChange={(event) => setStoreForm({ ...storeForm, additionalTaxRate: Number(event.target.value) })} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.chargeLabel')}</span>
          <input className={fieldClass} value={storeForm.chargeLabel} onChange={(event) => setStoreForm({ ...storeForm, chargeLabel: event.target.value })} placeholder={t('posPage.fields.chargePlaceholder')} lang={i18n.language} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.chargeAmount', { currency: storeForm.currency || 'INR' })}</span>
          <input className={fieldClass} type="number" min="0" step="0.01" value={storeForm.chargeAmount || ''} placeholder="0" onChange={(event) => setStoreForm({ ...storeForm, chargeAmount: Number(event.target.value) })} />
        </label>
        <label className={labelClass}>
          <span lang={i18n.language}>{t('posPage.fields.calculation')}</span>
          <select className={fieldClass} value={storeForm.taxMode} onChange={(event) => setStoreForm({ ...storeForm, taxMode: event.target.value as StoreProfile['taxMode'] })}>
            <option lang={i18n.language} value="exclusive">{t('posPage.fields.exclusive')}</option>
            <option lang={i18n.language} value="inclusive">{t('posPage.fields.inclusive')}</option>
          </select>
        </label>
      </div>
      <p lang={i18n.language} className="text-[11px] leading-relaxed text-slate-500">
        {t('posPage.fields.taxHint')}
      </p>
    </>
  );

  const renderInventoryPanel = () => (
    <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h3 lang={i18n.language} className="text-base font-bold text-slate-900">{t('posPage.inventory')}</h3>
        <p lang={i18n.language} className="mt-1 text-xs text-slate-500">{t('posPage.inventoryDescription')}</p>
      </div>

      <form onSubmit={addOrUpdateItem} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <h4 lang={i18n.language} className="text-xs font-bold text-slate-800">{t(editingItemId ? 'posPage.fields.editItem' : 'posPage.fields.addItem')}</h4>
          {editingItemId && <button type="button" lang={i18n.language} aria-label={t('posPage.fields.cancelEdit')} className="text-slate-400 hover:text-slate-700" onClick={() => { setEditingItemId(null); setItemForm(EMPTY_ITEM); }}><X className="h-4 w-4" /></button>}
        </div>
        <label className={labelClass}><span lang={i18n.language}>{t('posPage.fields.itemName')}</span>
          <input className={fieldClass} value={itemForm.name} onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })} placeholder={t('posPage.fields.itemPlaceholder')} lang={i18n.language} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}><span lang={i18n.language}>{t('posPage.fields.price')}</span>
            <input className={fieldClass} type="number" min="0" step="0.01" value={itemForm.price} onChange={(event) => setItemForm({ ...itemForm, price: event.target.value })} placeholder="0.00" required />
          </label>
          <label className={labelClass}><span lang={i18n.language}>{t('posPage.fields.unit')}</span>
            <select className={fieldClass} value={itemForm.unit} onChange={(event) => setItemForm({ ...itemForm, unit: event.target.value as ProductUnit })}>
              {PRODUCT_UNITS.map((unit) => <option lang={i18n.language} key={unit.value} value={unit.value}>{t(`posPage.units.${unit.value}`)}</option>)}
            </select>
          </label>
        </div>
        <label className={labelClass}><span lang={i18n.language}>{t('posPage.fields.sku')}</span>
          <input className={fieldClass} value={itemForm.sku} onChange={(event) => setItemForm({ ...itemForm, sku: event.target.value })} placeholder={t('posPage.fields.optional')} lang={i18n.language} />
        </label>
        <button type="submit" lang={i18n.language} className={primaryButtonClass}><Save className="h-3.5 w-3.5" />{t(editingItemId ? 'posPage.fields.update' : 'posPage.fields.add')}</button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label lang={i18n.language} className="sr-only" htmlFor="pos-inventory-search">{t('posPage.fields.search')}</label>
          <input id="pos-inventory-search" lang={i18n.language} className={fieldClass} value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder={t('posPage.fields.searchPlaceholder')} />
          <span lang={i18n.language} className="shrink-0 text-xs text-slate-500">{t('posPage.fields.items', { count: inventory.length })}</span>
        </div>
        {filteredInventory.length ? filteredInventory.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">{item.name}</p>
              <p className="break-words text-[10px] text-slate-500">{item.sku ? `${item.sku} · ` : ''}{formatMoney(item.price, (store ?? storeForm).currency)} / {item.unit}</p>
            </div>
            <button type="button" lang={i18n.language} className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-700" aria-label={t('posPage.fields.edit', { name: item.name })} onClick={() => editItem(item)}><Pencil className="h-3.5 w-3.5" /></button>
            <button type="button" lang={i18n.language} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={t('posPage.fields.delete', { name: item.name })} onClick={() => removeItem(item)}><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        )) : (
          <p lang={i18n.language} className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-500">
            {t(inventory.length ? 'posPage.fields.noMatches' : 'posPage.fields.empty')}
          </p>
        )}
      </div>
    </section>
  );

  if (!store || step === 'setup') {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <input ref={importInputRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => void handleImport(event.target.files?.[0])} />
        <section className="rounded-[1.75rem] border border-stone-200 bg-[var(--theme-surface)] p-4 shadow-[0_24px_70px_-48px_var(--theme-card-shadow-color)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><Building2 className="h-5 w-5" /></span>
              <div>
                <p lang={i18n.language} className="text-xs font-bold uppercase tracking-wider text-indigo-700">{t('posPage.step')}</p>
                <h2 lang={i18n.language} className="mt-1 text-xl font-extrabold text-slate-900">{t(store ? 'posPage.review' : 'posPage.create')}</h2>
                <p lang={i18n.language} className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{t('posPage.intro')}</p>
              </div>
            </div>
            <button type="button" lang={i18n.language} className={secondaryButtonClass} disabled={storageBusy} onClick={() => importInputRef.current?.click()} title={t('posPage.importHint')}><FileUp className="h-3.5 w-3.5" />{t('posPage.import')}</button>
          </div>
        </section>
        {(error || notice) && (
          <div role={error ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}
        {savedProfilesPanel()}
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
          <fieldset disabled={storageBusy} className="min-w-0">
            <section className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div>
                <h3 lang={i18n.language} className="text-base font-bold text-slate-900">{t('posPage.profile')}</h3>
                <p lang={i18n.language} className="mt-1 text-xs text-slate-500">{t('posPage.profileDescription')}</p>
              </div>
              <div className="space-y-4">{renderStoreFields()}</div>
            </section>
          </fieldset>
          <fieldset disabled={storageBusy} className="min-w-0">
            {renderInventoryPanel()}
          </fieldset>
        </div>
        <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div lang={i18n.language} className="max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900">{t('posPage.backupTitle')}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{t('posPage.backupDescription')}</p>
            {!canContinueToBilling && <p className="mt-2 text-xs font-semibold text-amber-800">{t('posPage.needItem')}</p>}
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <button type="button" lang={i18n.language} className={secondaryButtonClass} disabled={storageBusy} onClick={downloadSetup}><Archive className="h-3.5 w-3.5" />{t('posPage.downloadProfile')}</button>
            <button type="button" lang={i18n.language} className={primaryButtonClass} onClick={continueToBilling} disabled={storageBusy || !canContinueToBilling}><FilePlus2 className="h-3.5 w-3.5" />{t(store ? 'posPage.returnToBill' : 'posPage.continue')}</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <input ref={importInputRef} type="file" accept=".json,application/json" className="hidden" onChange={(event) => void handleImport(event.target.files?.[0])} />
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pos-invoice-print-area, #pos-invoice-print-area * { visibility: visible !important; }
          #pos-invoice-print-area { position: fixed !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 28px !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      {savedProfilesPanel(true)}

      {(error || notice) && (
        <div role={error ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || notice}
        </div>
      )}
      <fieldset disabled={storageBusy} className="min-w-0 space-y-5">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Prepare the customer bill</h3>
              <p className="mt-1 text-xs text-slate-500">Bill {invoice.number} · Select items from inventory, enter customer details, and review the total before sharing.</p>
            </div>
        </div>

          <div className="flex flex-col gap-2 rounded-xl border border-orange-200 bg-orange-50/50 p-3 sm:flex-row">
            <select className={`${fieldClass} mt-0 min-w-0 flex-1`} value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)} aria-label="Select an item from inventory">
              <option value="">Select an item from inventory...</option>
              {inventory.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.price, store.currency)} / {item.unit}</option>)}
            </select>
            <button type="button" className={primaryButtonClass} onClick={addInvoiceItem} disabled={!inventory.length}><FilePlus2 className="h-3.5 w-3.5" />Add item</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr><th className="px-3 py-2">Item</th><th className="px-3 py-2">Price / unit</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2 text-right">Amount</th><th className="px-2 py-2"><span className="sr-only">Remove</span></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-3 py-2.5"><p className="font-semibold text-slate-800">{line.name}</p><p className="text-[10px] text-slate-500">{line.sku ? `${line.sku} · ` : ''}{line.unit}</p></td>
                    <td className="px-3 py-2.5 text-slate-600">{formatMoney(line.unitPrice, store.currency)}</td>
                    <td className="px-3 py-2.5"><input className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-xs" type="number" min="0.001" step="any" value={line.quantity || ''} placeholder="0" aria-label={`Quantity of ${line.name}`} onChange={(event) => updateLine(line.id, Math.max(0, Number(event.target.value)))} /></td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800">{formatMoney(line.quantity * line.unitPrice, store.currency)}</td>
                    <td className="px-2 py-2.5"><button type="button" className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Remove ${line.name} from bill`} onClick={() => removeLine(line.id)}><X className="h-3.5 w-3.5" /></button></td>
                  </tr>
                ))}
                {!invoice.lines.length && <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Add items from inventory to build this bill.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>Bill number
              <input className={fieldClass} value={invoice.number} onChange={(event) => updateInvoice('number', event.target.value)} />
            </label>
            <label className={labelClass}>Bill date
              <input className={fieldClass} type="date" value={invoice.date} onChange={(event) => updateInvoice('date', event.target.value)} />
            </label>
            <label className={labelClass}>Customer name
              <input className={fieldClass} value={invoice.customerName} onChange={(event) => updateInvoice('customerName', event.target.value)} placeholder="Walk-in customer" />
            </label>
            <label className={labelClass}>Customer contact
              <input className={fieldClass} value={invoice.customerContact} onChange={(event) => updateInvoice('customerContact', event.target.value)} placeholder="Phone or email" />
            </label>
          </div>
          <details lang={i18n.language} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 print:hidden">
            <summary className="cursor-pointer text-sm font-bold text-amber-950">
              {t('posBill.taxSummary', { primary: store.taxRate, additional: store.additionalTaxRate, charge: formatMoney(store.chargeAmount, store.currency) })}
              <span className="mt-1 block text-xs font-normal text-amber-800">{t(`posPage.fields.${store.taxMode}`)} · {t('posBill.editTaxes')}</span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{t('posBill.taxHint')}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>{t('posPage.fields.taxRate')}
                <input className={fieldClass} type="number" min="0" max="100" step="0.01" value={store.taxRate || ''} placeholder="0" onChange={(event) => updateBillingSetting('taxRate', Math.min(100, Math.max(0, Number(event.target.value))))} />
              </label>
              <label className={labelClass}>{t('posPage.fields.additionalRate')}
                <input className={fieldClass} type="number" min="0" max="100" step="0.01" value={store.additionalTaxRate || ''} placeholder="0" onChange={(event) => updateBillingSetting('additionalTaxRate', Math.min(100, Math.max(0, Number(event.target.value))))} />
              </label>
              <label className={labelClass}>{t('posPage.fields.chargeAmount', { currency: store.currency })}
                <input className={fieldClass} type="number" min="0" step="0.01" value={store.chargeAmount || ''} placeholder="0" onChange={(event) => updateBillingSetting('chargeAmount', Math.max(0, Number(event.target.value)))} />
              </label>
              <label className={labelClass}>{t('posPage.fields.taxLabel')}
                <input className={fieldClass} value={store.taxLabel} onChange={(event) => updateBillingSetting('taxLabel', event.target.value)} />
              </label>
              <label className={labelClass}>{t('posPage.fields.additionalLabel')}
                <input className={fieldClass} value={store.additionalTaxLabel} onChange={(event) => updateBillingSetting('additionalTaxLabel', event.target.value)} />
              </label>
              <label className={labelClass}>{t('posPage.fields.chargeLabel')}
                <input className={fieldClass} value={store.chargeLabel} onChange={(event) => updateBillingSetting('chargeLabel', event.target.value)} />
              </label>
            </div>
          </details>
          <div className="rounded-2xl bg-stone-800 p-3 shadow-lg sm:p-4 print:bg-transparent print:p-0 print:shadow-none">
          <div lang={i18n.language} className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-100">{t('posBill.preview')}</h3>
            {!editingNote && <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-700" onClick={() => { setNoteDraft(invoice.notes); setEditingNote(true); }}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />{t(invoice.notes ? 'posBill.editNote' : 'posBill.addNote')}
            </button>}
          </div>
          <div ref={invoiceRef} id="pos-invoice-print-area" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 text-slate-800 sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row">
              <div>
                <h4 className="text-xl font-extrabold">{store.name}</h4>
                {store.tagline && <p className="mt-1 text-xs text-slate-500">{store.tagline}</p>}
                {store.address && <p className="mt-2 whitespace-pre-line text-xs text-slate-600">{store.address}</p>}
                <p className="mt-1 text-xs text-slate-600">{[store.phone, store.email].filter(Boolean).join(' · ')}</p>
                {store.taxId && <p className="mt-1 text-xs text-slate-600">{store.taxLabel || 'Tax ID'}: {store.taxId}</p>}
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Bill</p>
                <p className="mt-1 text-sm font-bold">{invoice.number}</p>
                <p className="mt-1 text-xs text-slate-500">{invoice.date}</p>
              </div>
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-500">BILL TO</p>
              <p className="mt-1 font-semibold">{invoice.customerName || 'Walk-in customer'}</p>
              {invoice.customerContact && <p className="mt-0.5 text-slate-600">{invoice.customerContact}</p>}
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr><th className="px-3 py-2">Description</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {totals.lines.map(({ line, gross }) => (
                    <tr key={line.id}>
                      <td className="px-3 py-2.5">{line.name}{line.sku && <span className="ml-1 text-[10px] text-slate-500">({line.sku})</span>}</td>
                      <td className="px-3 py-2.5 text-right">{line.quantity} {line.unit}</td>
                      <td className="px-3 py-2.5 text-right">{formatMoney(line.unitPrice, store.currency)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{formatMoney(gross, store.currency)}</td>
                    </tr>
                  ))}
                  {!totals.lines.length && <tr><td colSpan={4} className="px-3 py-7 text-center text-slate-400">No items added</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="ml-auto w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between gap-4"><span className="text-slate-500">Subtotal</span><span>{formatMoney(totals.subtotal, store.currency)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">{store.taxLabel || 'Tax'} ({store.taxRate}%){store.taxMode === 'inclusive' ? ' included' : ''}</span><span>{formatMoney(totals.tax, store.currency)}</span></div>
              {store.additionalTaxRate > 0 && <div className="flex justify-between gap-4"><span className="text-slate-500">{store.additionalTaxLabel || 'Additional tax'} ({store.additionalTaxRate}%){store.taxMode === 'inclusive' ? ' included' : ''}</span><span>{formatMoney(totals.additionalTax, store.currency)}</span></div>}
              {totals.charge > 0 && <div className="flex justify-between gap-4"><span className="text-slate-500">{store.chargeLabel || 'Other charge'}</span><span>{formatMoney(totals.charge, store.currency)}</span></div>}
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-sm font-extrabold"><span>Total</span><span>{formatMoney(totals.total, store.currency)}</span></div>
            </div>
            {invoice.notes && <div className="border-t border-slate-200 pt-3 text-xs"><p className="font-bold">Note</p><p className="mt-1 whitespace-pre-line text-slate-600">{invoice.notes}</p></div>}
            <p className="border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">Created locally with MyDailyUtils POS & Bill Studio</p>
          </div>
          {editingNote && (
            <div lang={i18n.language} className="mt-3 space-y-2 rounded-xl bg-white p-3 print:hidden">
              <label htmlFor="pos-bill-note" className={labelClass}>{t('posBill.note')}</label>
              <textarea id="pos-bill-note" autoFocus className={fieldClass} rows={2} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder={t('posBill.notePlaceholder')} />
              <p className="text-xs text-stone-600">{t('posBill.noteHint')}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={primaryButtonClass} onClick={() => { updateInvoice('notes', noteDraft); setEditingNote(false); }}>{t('posBill.noteSave')}</button>
                <button type="button" className={secondaryButtonClass} onClick={() => setEditingNote(false)}>{t('posBill.noteCancel')}</button>
              </div>
            </div>
          )}
          </div>
          <div lang={i18n.language} className="grid gap-3 sm:grid-cols-2 print:hidden">
            <div className="min-w-0 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <h3 className="text-sm font-bold text-stone-900">{t('posBill.shareTitle')}</h3>
              <p className="mt-1 text-xs text-stone-600">{t('posBill.shareDescription')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={shareButtonClass} onClick={() => window.print()} disabled={editingNote}><Printer className="h-3.5 w-3.5" />{t('posBill.print')}</button>
                <button type="button" className={shareButtonClass} onClick={() => void exportImage()} disabled={isExportingImage || editingNote}>
                  <FileImage className="h-3.5 w-3.5" />{t(isExportingImage ? 'posBill.preparing' : 'posBill.image')}
                </button>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <h3 className="text-sm font-bold text-stone-900">{t('posBill.backupTitle')}</h3>
              <p className="mt-1 text-xs text-stone-600">{t('posBill.backupDescription')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={backupButtonClass} onClick={() => downloadWorkspace()} disabled={editingNote}><Save className="h-3.5 w-3.5" />{t('posBill.saveJson')}</button>
                <button type="button" className={backupButtonClass} onClick={startNewInvoice} disabled={editingNote}><FilePlus2 className="h-3.5 w-3.5" />{t('posBill.saveNext')}</button>
              </div>
            </div>
          </div>
      </section>
      </fieldset>
    </div>
  );
};

export default PosInvoiceStudio;
