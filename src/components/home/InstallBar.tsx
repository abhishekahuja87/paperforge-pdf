import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isIosSafari, isStandalone, promptInstall, useCanInstall } from '../../lib/install';

const KEY = 'mdu_install_hidden_until';
const HIDE_DAYS = 30;

/** A slim "install the app" bar for the home page. Android and computers get the browser's install button; iPhone and iPad get the Share steps. */
export const InstallBar: React.FC = () => {
  const { t } = useTranslation();
  const canInstall = useCanInstall();
  const [hidden, setHidden] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try {
      setHidden(isStandalone() || Number(localStorage.getItem(KEY) ?? '0') > Date.now());
      setIos(isIosSafari());
    } catch { setHidden(isStandalone()); }
  }, []);

  if (hidden || (!canInstall && !ios)) return null;
  const hide = () => {
    setHidden(true);
    try { localStorage.setItem(KEY, String(Date.now() + HIDE_DAYS * 86_400_000)); } catch { /* storage blocked: the bar returns next visit */ }
  };
  return (
    <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-orange-200 bg-white/90 px-3 py-2 text-xs text-stone-700 shadow-sm">
      <span className="min-w-0 flex-1">
        {canInstall
          ? t('install.text', { defaultValue: 'Add MyDailyUtils to your home screen. It opens in one tap and works offline for most tools.' })
          : <span className="inline-flex flex-wrap items-center gap-1">{t('install.ios', { defaultValue: 'To install: tap' })} <Share className="h-3.5 w-3.5" aria-label="Share" /> {t('install.iosThen', { defaultValue: 'then Add to Home Screen.' })}</span>}
      </span>
      {canInstall && (
        <button type="button" onClick={() => void promptInstall().then((accepted) => { if (accepted) setHidden(true); })} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-orange-700 px-3 py-1.5 font-bold text-white hover:bg-orange-800"><Download className="h-3.5 w-3.5" aria-hidden="true" />{t('install.button', { defaultValue: 'Install' })}</button>
      )}
      <button type="button" onClick={hide} aria-label={t('install.dismiss', { defaultValue: 'Hide for now' })} className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100"><X className="h-4 w-4" aria-hidden="true" /></button>
    </div>
  );
};
