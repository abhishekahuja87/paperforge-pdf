import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { TRUST } from '../content/trust';

export const TrustPage: React.FC = () => (
  <InfoPageLayout title={TRUST.title} subtitle={TRUST.subtitle} description={TRUST.description} contentLanguage="en">
    {TRUST.sections.map((section) => (
      <section key={section.heading} className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
    ))}
    <p>
      See also <Link to="/guides/how-to-check-a-tool-keeps-your-files-private" className="font-semibold text-indigo-700 underline">how to check a tool keeps your files private</Link>,{' '}
      <Link to="/privacy" className="font-semibold text-indigo-700 underline">Privacy Policy</Link>,{' '}
      <Link to="/editorial-policy" className="font-semibold text-indigo-700 underline">how we check our tools</Link>,{' '}
      <Link to="/whats-new" className="font-semibold text-indigo-700 underline">What&apos;s new</Link> and{' '}
      <Link to="/contact" className="font-semibold text-indigo-700 underline">Contact</Link>.
    </p>
  </InfoPageLayout>
);

export default TrustPage;
