import React, { useMemo } from 'react';
import { ArrowRight, Gift, Layers, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HOME_COLLECTION_BORDER, HOME_COLLECTION_STYLES, getCollections } from '../../lib/homePageVariants';
import { ToolIcon } from '../common/ToolIcon';

interface HomeTopBannerProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export const HomeTopBanner: React.FC<HomeTopBannerProps> = ({
  query,
  onQueryChange,
}) => {
  const { t } = useTranslation();
  const topics = useMemo(() => getCollections().filter((group) => group.tools.length > 0), []);
  // Rounded down to the nearest ten so the headline stays true as tools are added.
  const toolTotal = Math.floor(topics.reduce((sum, group) => sum + group.tools.length, 0) / 10) * 10;
  const trust = [
    { icon: ShieldCheck, text: t('homeHero.private', { defaultValue: 'Files stay in your browser' }) },
    { icon: Gift, text: t('homeHero.free', { defaultValue: 'Free, no sign-up' }) },
    { icon: Layers, text: t('homeHero.count', { count: toolTotal, defaultValue: '{{count}}+ tools' }) },
  ];
  return (
  <section className="relative overflow-hidden px-4 py-6 sm:py-9" aria-label={t('findTool')}>
    <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />

    <div className="relative mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
      <div className="min-w-0 text-center lg:text-left">
        <h1 className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-stone-900 sm:text-4xl lg:text-5xl">
          {t('homeHeading')}
          <span className="block text-orange-600">{t('homeHeadingAccent')}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600 lg:mx-0 lg:text-base lg:leading-7">
          {t('homeDescription')}
        </p>

        <label className="relative mx-auto mt-5 block max-w-lg text-left text-stone-800 lg:mx-0">
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

      {/* Wide screens only: the space beside the search holds what the site offers, with every topic one click away. */}
      <aside aria-label={t('homeHero.topics', { defaultValue: 'Browse by topic' })} className="mt-0 hidden rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm backdrop-blur lg:block">
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 border-b border-stone-100 pb-3">
          {trust.map(({ icon: Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <Icon className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{t('homeHero.topics', { defaultValue: 'Browse by topic' })}</p>
        <ul className="grid grid-cols-2 gap-2">
          {topics.map((group) => (
            <li key={group.id}>
              <a href={`#topic-${group.id}`} className={`group flex items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2 transition hover:shadow-sm ${HOME_COLLECTION_BORDER[group.id] ?? HOME_COLLECTION_BORDER.other}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${HOME_COLLECTION_STYLES[group.id] ?? HOME_COLLECTION_STYLES.other}`}>
                  <ToolIcon name={group.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-extrabold text-stone-900 group-hover:text-orange-800">{t(`homeCollections.${group.id}.name`)}</span>
                  <span className="block text-[11px] text-stone-500">{t('homeSections.toolCount', { count: group.tools.length + group.presets.length })}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  </section>
  );
};
