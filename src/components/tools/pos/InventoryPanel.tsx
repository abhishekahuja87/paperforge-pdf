import React, { type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Save, Trash2, X } from 'lucide-react';
import { formatMoney } from '../../../lib/pos/workspace';
import { PRODUCT_UNITS, type InventoryItem, type ProductUnit, type StoreProfile } from '../../../lib/pos/types';
import { EMPTY_ITEM, type ItemForm } from '../../../lib/pos/studioForm';
import { fieldClass, labelClass, primaryButtonClass } from './styles';

interface InventoryPanelProps {
  addOrUpdateItem: (event: React.FormEvent<HTMLFormElement>) => void;
  editItem: (item: InventoryItem) => void;
  editingItemId: string | null;
  filteredInventory: InventoryItem[];
  inventory: InventoryItem[];
  itemForm: ItemForm;
  itemSearch: string;
  removeItem: (item: InventoryItem) => void;
  setEditingItemId: (id: string | null) => void;
  setItemForm: Dispatch<SetStateAction<ItemForm>>;
  setItemSearch: (value: string) => void;
  store: StoreProfile | null;
  storeForm: StoreProfile;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ addOrUpdateItem, editItem, editingItemId, filteredInventory, inventory, itemForm, itemSearch, removeItem, setEditingItemId, setItemForm, setItemSearch, store, storeForm }) => {
  const { t, i18n } = useTranslation();
  return (
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
};
