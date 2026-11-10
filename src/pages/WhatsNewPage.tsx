import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { UPDATES, formatUpdateDate } from '../config/updates';

export const WhatsNewPage: React.FC = () => {
  const dates = Array.from(new Set(UPDATES.map((update) => update.date)));
  return (
    <InfoPageLayout
      title="What's new"
      subtitle="Improvements to the tools, newest first."
      description="A dated list of what has been added or improved on MyDailyUtils tools and calculators."
      contentLanguage="en"
    >
      {dates.map((date) => (
        <section key={date} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">{formatUpdateDate(date)}</h2>
          <ul className="space-y-4">
            {UPDATES.filter((update) => update.date === date).map((update) => (
              <li key={`${update.path}-${update.title}`}>
                <p className="text-sm font-semibold text-slate-900">
                  <Link to={update.path} className="text-indigo-700 underline">{update.tool}</Link>: {update.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{update.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </InfoPageLayout>
  );
};

export default WhatsNewPage;
