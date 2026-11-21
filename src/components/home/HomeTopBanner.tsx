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
  // Every working tool page: the main tools plus the ready-made sheets and templates (the same list that fills the sitemap), rounded down to ten.
  const { counts, toolTotal } = useMemo(() => {
    const available = new Set(TOOLS.filter((tool) => tool.isAvailable).map((tool) => tool.id));
    const perGroup = new Map(COLLECTIONS.map((collection) => [collection.id, collection.tools.filter((id) => available.has(id)).length]));
    return { counts: perGroup, toolTotal: Math.floor(available.size / 10) * 10 };
  }, []);

  return (
    <section className="relative overflow-hidden px-4 py-5 sm:py-8" aria-label={t('findTool')}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-amber-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-stretch lg:gap-10">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <ul className="flex flex-wrap justify-center gap-1.5 lg:justify-start" aria-label={t('homeTags', { defaultValue: 'What to expect' })}>
            {HERO_TAGS.map((text) => <li key={text} className={tag}>{text}</li>)}
            <li><Link to="/free-no-limits" className={`${tag} gap-1 text-orange-800 hover:border-orange-400`}>{t('homeTagsMore', { defaultValue: 'Why is it free?' })}<ArrowRight className="h-3 w-3" aria-hidden="true" /></Link></li>
          </ul>

          <h1 className="mt-3 text-2xl font-black leading-[1.1] tracking-[-0.03em] text-stone-900 sm:text-4xl">
            {t('homeHeading')}
            <span className="block text-orange-600">{t('homeHeadingAccent')}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600 lg:mx-0 lg:text-base lg:leading-7">
            {t('homeDescription')}
          </p>

          <label className="relative mt-5 block w-full text-left text-stone-800 sm:mx-auto sm:max-w-lg lg:mx-0">
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

          <p className="mt-3 w-full rounded-xl border border-orange-200 bg-white/70 px-3 py-3 text-center text-xs text-stone-600 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:text-center lg:text-left">
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

        <nav className="flex flex-col" aria-label={`Browse ${toolTotal}+ tools and templates`}>
          <p className="mb-3 text-center text-xl font-black tracking-tight text-stone-900 lg:text-left lg:text-2xl">
            {t('homeBrowse.heading', { defaultValue: 'Browse' })} <span className="text-orange-600">{toolTotal}+</span> {t('homeBrowse.tools', { defaultValue: 'tools and templates' })}
            <span className="mt-0.5 block text-xs font-semibold tracking-normal text-stone-500">{t('homeBrowse.hint', { defaultValue: 'Pick a topic to see everything in it' })}</span>
          </p>
          <ul className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:auto-rows-fr xl:grid-cols-4">
            {HERO_TILES.map((tile) => {
              const Icon = ICONS[tile.icon];
              return (
                <li key={tile.to}>
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
