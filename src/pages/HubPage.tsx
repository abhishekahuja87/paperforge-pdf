import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { HomeToolCard } from '../components/home/HomeVariantTools';
import { COLLECTIONS } from '../config/homeSections';
import { TOOLS, type ToolItem } from '../config/tools';
import type { Hub } from '../content/hubs';
import { HUB_EXTRAS } from '../content/hubExtras';
import { HUB_FAQS } from '../content/hubFaqs';
import { hubGuides } from '../content/hubGuides';
import { HERO_TILES } from '../config/heroTiles';

const BY_ID = new Map(TOOLS.map((tool) => [tool.id, tool]));

/** The tools of one collection, in the order the home page lists them. */
export const hubTools = (hub: Hub): ToolItem[] => (COLLECTIONS.find((collection) => collection.id === hub.collection)?.tools ?? [])
  .map((id) => BY_ID.get(id)).filter((tool): tool is ToolItem => Boolean(tool && tool.isAvailable));

export const HubPage: React.FC<{ hub: Hub }> = ({ hub }) => {
  const tools = useMemo(() => hubTools(hub), [hub]);
  const extras = HUB_EXTRAS[hub.path];
  const intro = hub.sections.slice(0, 1);
  const rest = hub.sections.slice(1);
  const faqSet = HUB_FAQS[hub.path];
  const guides = useMemo(() => hubGuides(hub), [hub]);
  const related = (faqSet?.related ?? []).map((path) => HERO_TILES.find((tile) => tile.to === path)).filter((tile): tile is NonNullable<typeof tile> => Boolean(tile));
  return (
    <InfoPageLayout title={hub.title} subtitle={hub.subtitle} description={hub.description} contentLanguage="en" compact>
      {intro.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      {extras && extras.tasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">What can I do here?</h2>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-left text-[13px] leading-5">
              <thead className="sr-only sm:table-header-group sm:not-sr-only">
                <tr className="bg-stone-50 text-xs font-bold uppercase tracking-wide text-stone-500">
                  <th className="px-3 py-2">I want to</th><th className="px-3 py-2">Use</th><th className="px-3 py-2">What you get</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {extras.tasks.map((row) => {
                  const tool = BY_ID.get(row.tool);
                  return (
                    <tr key={row.task} className="block px-3 py-2 sm:table-row sm:px-0 sm:py-0">
                      <td className="block font-semibold text-stone-900 sm:table-cell sm:px-3 sm:py-2">{row.task}</td>
                      <td className="block sm:table-cell sm:px-3 sm:py-2">{tool ? <Link to={tool.path} className="font-semibold text-indigo-700 underline">{row.name}</Link> : row.name}</td>
                      <td className="block text-stone-600 sm:table-cell sm:px-3 sm:py-2">{row.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {extras && extras.situations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Ideas for your situation</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {extras.situations.map((item) => (
              <div key={item.who} className="rounded-xl border border-stone-200 bg-white p-3">
                <h3 className="text-sm font-bold text-stone-900">{item.who}</h3>
                <p className="mt-1 text-[13px] leading-6 text-stone-700">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {guides.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">How-to guides for this section</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.slug} className="rounded-xl border border-stone-200 bg-white p-3">
                <Link to={`/guides/${guide.slug}`} className="text-sm font-bold text-indigo-700 underline">{guide.title}</Link>
                <p className="mt-1 text-[13px] leading-6 text-stone-600">{guide.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {faqSet && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Common questions</h2>
          <div className="space-y-2">
            {faqSet.faqs.map((item) => (
              <details key={item.q} className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                <summary className="cursor-pointer text-sm font-semibold text-stone-900">{item.q}</summary>
                <p className="mt-2 text-[13px] leading-6 text-stone-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      {rest.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      ))}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">All {tools.length} tools</h2>
        <div className="grid gap-2 sm:grid-cols-2">{tools.map((tool) => <HomeToolCard key={tool.id} tool={tool} compact />)}</div>
      </section>
      {related.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Related sections</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((tile) => <Link key={tile.to} to={tile.to} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-stone-800 hover:border-orange-300">{tile.label}</Link>)}
          </div>
        </section>
      )}
      <p>
        See also <Link to="/guides" className="font-semibold text-indigo-700 underline">how-to guides</Link> and{' '}
        <Link to="/why-trust-us" className="font-semibold text-indigo-700 underline">why you can trust these tools</Link>.
      </p>
    </InfoPageLayout>
  );
};

export default HubPage;
