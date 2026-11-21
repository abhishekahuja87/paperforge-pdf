import React, { useMemo } from 'react';
import { ArrowRight, Calculator, FileText, Image as ImageIcon, QrCode, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCollections } from '../../lib/homePageVariants';
import { PromisePill } from '../common/PromisePill';

interface HomeTopBannerProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const HomeTopBanner: React.FC<HomeTopBannerProps> = ({
  query,
  onQueryChange,
}) => {
  const { t } = useTranslation();
  // Rounded down to the nearest ten so the headline stays true as tools are added.
  const browse = [
    { to: '/pdf-tools', icon: FileText, label: t('homeBrowse.pdf', { defaultValue: 'PDF tools' }) },
    { to: '/photo-and-image-tools', icon: ImageIcon, label: t('homeBrowse.photo', { defaultValue: 'Photo tools' }) },
    { to: '/qr-and-sharing-tools', icon: QrCode, label: t('homeBrowse.qr', { defaultValue: 'QR and sharing' }) },
    { to: '/everyday-tools', icon: Calculator, label: t('homeBrowse.everyday', { defaultValue: 'Everyday tools' }) },
  ];
  const toolTotal = useMemo(() => Math.floor(getCollections().reduce((sum, group) => sum + group.tools.length, 0) / 10) * 10, []);

  return (
    <section className="relative overflow-hidden px-4 py-5 sm:py-6" aria-label={t('findTool')}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-3 flex justify-center"><PromisePill /></div>
        <h1 className="text-2xl font-black leading-[1.1] tracking-[-0.03em] text-stone-900 sm:text-3xl">
          {t('homeHeading')}
          <span className="block text-orange-600">{t('homeHeadingAccent')}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">
          {t('homeDescription')}
        </p>

        <label className="relative mx-auto mt-4 block max-w-lg text-left text-stone-800">
          <span className="sr-only">{t('searchTools')}</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border-2 border-orange-200 bg-white py-3 pl-11 pr-4 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        <nav aria-label={t('homeBrowse.label', { count: toolTotal, defaultValue: 'Browse {{count}}+ tools' })} className="mx-auto mt-4 max-w-lg">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('homeBrowse.label', { count: toolTotal, defaultValue: 'Browse {{count}}+ tools' })}</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {browse.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <Link to={to} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-orange-200 bg-white px-2 py-2 text-xs font-bold text-stone-800 shadow-sm transition hover:border-orange-400 hover:bg-orange-50">
                  <Icon className="h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-4 text-xs text-stone-600">
          {t('requestPrompt')}{' '}
          <Link
            to="/contact"
            className="group inline-flex items-center gap-1 font-bold text-orange-700 underline decoration-orange-300 underline-offset-4 transition hover:text-orange-900"
          >
            {t('requestLink')}
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </p>

      </div>
    </section>
  );
};
