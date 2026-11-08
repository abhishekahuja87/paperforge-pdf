import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { TOOLS } from '../config/tools';
import { getGuide } from '../content/guides';
import { NotFoundPage } from './NotFoundPage';

export const GuidePage: React.FC = () => {
  const { slug } = useParams();
  const guide = getGuide(slug);
  if (!guide) return <NotFoundPage />;
  const tools = guide.tools
    .map((id) => TOOLS.find((tool) => tool.id === id && tool.isAvailable))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  return (
    <InfoPageLayout title={guide.title} subtitle={guide.description} description={guide.description} contentLanguage="en">
      {guide.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-xl font-bold text-stone-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      {tools.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-stone-900">Try it</h2>
          <ul className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <li key={tool.id}>
                <Link to={tool.path} className="inline-block rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 transition hover:border-orange-300 hover:text-orange-800">{tool.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p><Link to="/guides" className="text-sm font-semibold text-orange-700 underline">All guides</Link></p>
    </InfoPageLayout>
  );
};

export default GuidePage;
