import React, { type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { type StoreProfile } from '../../../lib/pos/types';
import { fieldClass, labelClass } from './styles';

interface StoreFieldsProps {
  setStoreForm: Dispatch<SetStateAction<StoreProfile>>;
  storeForm: StoreProfile;
}

export const StoreFields: React.FC<StoreFieldsProps> = ({ setStoreForm, storeForm }) => {
  const { t, i18n } = useTranslation();
  return (
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
};
