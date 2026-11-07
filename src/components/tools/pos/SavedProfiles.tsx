import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SavedProfile } from '../../../lib/pos/profileStorage';

interface Props {
  profiles: SavedProfile[];
  activeLabel: string;
  hasChanges: boolean;
  busy: boolean;
  storageFailed: boolean;
  compact?: boolean;
  shopName?: string;
  onEdit?: () => void;
  onDownload?: () => void;
  onImport: () => void;
  onSaveNew: () => void;
  onLoad: (id: string) => void;
  onReplace: (profile: SavedProfile) => void;
  onDelete: (profile: SavedProfile) => void;
  onRefresh: () => void;
}

const buttonClass = 'rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50';

export function SavedProfiles({ profiles, activeLabel, hasChanges, busy, storageFailed, compact = false, shopName, onEdit, onDownload, onImport, onSaveNew, onLoad, onReplace, onDelete, onRefresh }: Props) {
  const { t, i18n } = useTranslation();
  const controls = (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-stone-600">{t('posStorage.description')}</p>
      {compact && <p className="text-xs text-stone-600">{t('posBill.importHint')}</p>}
      <div className="flex flex-wrap gap-2">
        {onEdit && <button type="button" className={buttonClass} disabled={busy} onClick={onEdit}>{t('posStorage.editProfile')}</button>}
        {onDownload && <button type="button" className={buttonClass} disabled={busy} onClick={onDownload}>{t('posPage.downloadProfile')}</button>}
        <button type="button" className={buttonClass} disabled={busy} onClick={onSaveNew}>{t('posStorage.saveNew')}</button>
        <button type="button" className={buttonClass} disabled={busy} onClick={onImport}>{t('posStorage.import')}</button>
        <button type="button" className={buttonClass} disabled={busy} onClick={onRefresh}>{t('posStorage.refresh')}</button>
      </div>
      {profiles.length === 0 ? (!busy && !storageFailed && <p className="text-xs text-stone-500">{t('posStorage.empty')}</p>) : (
        <ul className="space-y-2">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div className="min-w-0">
                <p className="break-all text-xs font-semibold text-stone-800">{profile.name}</p>
                <p className="mt-1 text-xs text-stone-500">{t('posStorage.updated', { date: new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.updatedAt)), count: profile.profile.inventory.length })}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} disabled={busy} onClick={() => onLoad(profile.id)}>{t('posStorage.load')}</button>
                <button type="button" className={buttonClass} disabled={busy} onClick={() => onReplace(profile)}>{t('posStorage.replace')}</button>
                <button type="button" className={buttonClass} disabled={busy} onClick={() => onDelete(profile)}>{t('posStorage.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <section lang={i18n.language} className={`space-y-2 rounded-2xl border border-stone-200 bg-white shadow-sm ${compact ? 'p-3 sm:px-4' : 'p-4 sm:p-5'}`}>
      <div>
        <h3 className="break-words text-base font-bold text-stone-900">{compact ? shopName : t('posStorage.title')}</h3>
        <p className="mt-1 break-words text-xs text-stone-700">
          <strong>{t('posStorage.current')}</strong> {activeLabel}
          {hasChanges && <span className="ml-2 text-amber-700">{t('posStorage.modified')}</span>}
        </p>
      </div>
      {storageFailed && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{t('posStorage.failure')}</p>}
      {compact ? (
        <details>
          <summary className="cursor-pointer text-xs font-semibold text-orange-800">{t('posStorage.manage')}</summary>
          <div className="mt-4">{controls}</div>
        </details>
      ) : controls}
    </section>
  );
}
