import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HERO_TAGS } from '../../config/heroTiles';

const tag = 'inline-flex items-center rounded-full border border-orange-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-stone-700';

/** The small "what to expect" tags (free, no set-up, nothing uploaded...) with a link that explains why. Used on the home hero and the topic pages. */
export const PromiseTags: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label={t('homeTags', { defaultValue: 'What to expect' })}>
      {HERO_TAGS.map((text) => <li key={text} className={tag}>{text}</li>)}
      <li><Link to="/free-no-limits" className={`${tag} gap-1 text-orange-800 hover:border-orange-400`}>{t('homeTagsMore', { defaultValue: 'Why is it free?' })}<ArrowRight className="h-3 w-3" aria-hidden="true" /></Link></li>
    </ul>
  );
};
