import React from 'react';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { getPopularTools } from '../lib/homePageVariants';
import { getToolCopy } from '../lib/localizedTool';

export const NotFoundPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const tools = getPopularTools();

  return (
    <InfoPageLayout
      title={t('notFoundTitle')}
      subtitle={t('notFoundSubtitle')}
      description={t('notFoundDescription')}
      contentLanguage={i18n.language}
      noindex
    >
      <section className="space-y-4 text-center">
        <p>{t('notFoundBody')}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {tools.map((tool) => {
            const copy = getToolCopy(tool, i18n.language);
            return (
              <li key={tool.id}>
                <Link
                  to={tool.path}
                  lang={copy.language}
                  className="inline-block rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 transition hover:border-orange-300 hover:text-orange-800"
                >
                  {copy.title}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
        >
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          {t('backHome')}
        </Link>
      </section>
    </InfoPageLayout>
  );
};

export default NotFoundPage;
