import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { FREE_NO_LIMITS } from '../content/freeNoLimits';

const TOOL_LINKS: Array<[string, string]> = [
  ['/make-pdf-fillable', 'Make PDF fillable'], ['/smart-split-pdf', 'Smart split PDF'], ['/bulk-image-tools', 'Bulk image tools'],
  ['/pdf-bates-numbering', 'Bates numbering'], ['/social-image-resizer', 'Social image sizes'], ['/gif-maker', 'GIF maker'],
  ['/redact-pdf', 'Redact PDF'], ['/compare-pdf-and-text', 'Compare PDFs'], ['/merge-pdf', 'Merge PDF'], ['/compress-pdf', 'Compress PDF'],
];

export const FreeNoLimitsPage: React.FC = () => (
  <InfoPageLayout title={FREE_NO_LIMITS.title} subtitle={FREE_NO_LIMITS.subtitle} description={FREE_NO_LIMITS.description} contentLanguage="en">
    {FREE_NO_LIMITS.sections.map((section) => (
      <section key={section.heading} className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
    ))}
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-slate-900">Try them</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {TOOL_LINKS.map(([to, label]) => (
          <li key={to}><Link to={to} className="font-semibold text-indigo-700 underline">{label}</Link></li>
        ))}
      </ul>
      <p>
        See also <Link to="/why-trust-us" className="font-semibold text-indigo-700 underline">why trust us</Link> and <Link to="/pdf-tools" className="font-semibold text-indigo-700 underline">all PDF tools</Link>.
      </p>
    </section>
  </InfoPageLayout>
);

export default FreeNoLimitsPage;
