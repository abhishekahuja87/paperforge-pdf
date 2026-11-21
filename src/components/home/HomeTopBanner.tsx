import React, { useMemo } from 'react';
import { ArrowRight, Baby, Briefcase, Calculator, Code2, Dumbbell, FileText, GraduationCap, Image as ImageIcon, Presentation, Printer, Receipt, Search, Share2, TrendingUp, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COLLECTIONS } from '../../config/homeSections';
import { HERO_TAGS, HERO_TILES, type HeroTile } from '../../config/heroTiles';
import { TOOLS } from '../../config/tools';

interface HomeTopBannerProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const ICONS: Record<HeroTile['icon'], LucideIcon> = {
  file: FileText, image: ImageIcon, receipt: Receipt, trend: TrendingUp, calculator: Calculator, sport: Dumbbell, print: Printer,
  briefcase: Briefcase, display: Presentation, school: GraduationCap, kids: Baby, share: Share2, code: Code2,
};

const tag = 'inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-stone-700';

export const HomeTopBanner: React.FC<HomeTopBannerProps> = ({ query, onQueryChange }) => {
  const { t } = useTranslation();
  // Every available tool page (the same list that fills the sitemap), rounded down to ten so the label stays true as tools are added.
  const toolTotal = useMemo(() => Math.floor(TOOLS.filter((tool) => tool.isAvailable).length / 10) * 10, []);
  const counts = useMemo(() => {
    const available = new Set(TOOLS.filter((tool) => tool.isAvailable).map((tool) => tool.id));
    return new Map(COLLECTIONS.map((collection) => [collection.id, collection.tools.filter((id) => available.has(id)).length]));
  }, []);

  return (
    <section className="relative overflow-hidden px-4 py-5 sm:py-8" aria-label={t('findTool')}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-10">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <ul className="flex flex-wrap justify-center gap-1.5 lg:justify-start" aria-label={t('homeTags', { defaultValue: 'What to expect' })}>
            {HERO_TAGS.map((text) => <li key={text} className={tag}>{text}</li>)}
            <li><Link to="/why-trust-us" className={`${tag} gap-1 text-orange-800 hover:border-orange-400`}>{t('homeTagsMore', { defaultValue: 'Why is it free?' })}<ArrowRight className="h-3 w-3" aria-hidden="true" /></Link></li>
          </ul>

          <h1 className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.03em] text-stone-900 sm:text-4xl">
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

          <p className="mt-3 text-xs text-stone-600">
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

        <nav className="flex flex-col" aria-label={t('homeBrowse.label', { count: toolTotal, defaultValue: 'Browse {{count}}+ tools' })}>
          <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-stone-500 lg:text-left">
            {t('homeBrowse.label', { count: toolTotal, defaultValue: 'Browse {{count}}+ tools' })}
          </p>
          <ul className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:auto-rows-fr">
            {HERO_TILES.map((tile, index) => {
              const Icon = ICONS[tile.icon];
              return (
                <li key={tile.to} className={index === HERO_TILES.length - 1 ? 'col-span-2 sm:col-span-3' : undefined}>
                  <Link to={tile.to} className="flex h-full min-h-14 items-center gap-2.5 rounded-xl border border-orange-200 bg-white px-3 py-2 shadow-sm transition hover:border-orange-400 hover:bg-orange-50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold leading-4 text-stone-900">{tile.label}</span>
                      <span className="block text-[11px] text-stone-500">{counts.get(tile.collection) ?? 0} {t('homeTools', { defaultValue: 'tools' })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
};
