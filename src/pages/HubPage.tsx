import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { HomeToolCard } from '../components/home/HomeVariantTools';
import { COLLECTIONS } from '../config/homeSections';
import { TOOLS, type ToolItem } from '../config/tools';
import type { Hub } from '../content/hubs';

const BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

/** The tools of one collection, in the order the home page lists them. */
export const hubTools = (hub: Hub): ToolItem[] => (COLLECTIONS.find((collection) => collection.id === hub.collection)?.tools ?? [])
  .map((id) => BY_ID.get(id)).filter((tool): tool is ToolItem => Boolean(tool && tool.isAvailable));

export const HubPage: React.FC<{ hub: Hub }> = ({ hub }) => {
  const tools = useMemo(() => hubTools(hub), [hub]);
  return (
    <InfoPageLayout title={hub.title} subtitle={hub.subtitle} description={hub.description} contentLanguage="en">
      {hub.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">All {tools.length} tools</h2>
        <div className="grid gap-2 sm:grid-cols-2">{tools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
      </section>
      <p>
        See also <Link to="/guides" className="font-semibold text-indigo-700 underline">how-to guides</Link> and{' '}
        <Link to="/why-trust-us" className="font-semibold text-indigo-700 underline">why you can trust these tools</Link>.
      </p>
    </InfoPageLayout>
  );
};

export default HubPage;
