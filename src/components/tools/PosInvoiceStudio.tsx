import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Building2, FilePlus2, FileUp } from 'lucide-react';
import { downloadBlob, safeFileBaseName } from '../../lib/browserTools';
import { deleteSavedProfile, getSavedProfile, listSavedProfiles, replaceSavedProfile, saveNewProfile, type SavedProfile } from '../../lib/pos/profileStorage';
import { SavedProfiles } from './pos/SavedProfiles';
import { calculateInvoiceTotals, createId, createProfileFile, createWorkspaceFile, parsePosJson } from '../../lib/pos/workspace';
import { DEFAULT_STORE_PROFILE, type InventoryItem, type InvoiceDraft, type PosProfileFile, type PosWorkspace, type StoreProfile } from '../../lib/pos/types';
import { EMPTY_ITEM, newInvoiceForStore, profileSnapshot, validateStore, type ItemForm, type PosStudioStep, type ProfileSource } from '../../lib/pos/studioForm';
import { normalizeCanvasColors } from '../../lib/pos/canvasColors';
import { secondaryButtonClass, primaryButtonClass } from './pos/styles';
import { StoreFields } from './pos/StoreFields';
import { InventoryPanel } from './pos/InventoryPanel';
import { BillingSection } from './pos/BillingSection';

export type { PosStudioStep } from '../../lib/pos/studioForm';

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
              <div className="space-y-4"><StoreFields setStoreForm={setStoreForm} storeForm={storeForm} /></div>
            </section>
          </fieldset>
          <fieldset disabled={storageBusy} className="min-w-0">
            <InventoryPanel addOrUpdateItem={addOrUpdateItem} editItem={editItem} editingItemId={editingItemId} filteredInventory={filteredInventory} inventory={inventory} itemForm={itemForm} itemSearch={itemSearch} removeItem={removeItem} setEditingItemId={setEditingItemId} setItemForm={setItemForm} setItemSearch={setItemSearch} store={store} storeForm={storeForm} />
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
      <BillingSection addInvoiceItem={addInvoiceItem} downloadWorkspace={downloadWorkspace} editingNote={editingNote} exportImage={exportImage} inventory={inventory} invoice={invoice} invoiceRef={invoiceRef} isExportingImage={isExportingImage} noteDraft={noteDraft} removeLine={removeLine} selectedItemId={selectedItemId} setEditingNote={setEditingNote} setNoteDraft={setNoteDraft} setSelectedItemId={setSelectedItemId} startNewInvoice={startNewInvoice} store={store} totals={totals} updateBillingSetting={updateBillingSetting} updateInvoice={updateInvoice} updateLine={updateLine} />
      </fieldset>
    </div>
  );
};

export default PosInvoiceStudio;
