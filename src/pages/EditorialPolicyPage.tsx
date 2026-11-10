import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { EDITORIAL } from '../content/editorial';

export const EditorialPolicyPage: React.FC = () => (
  <InfoPageLayout title={EDITORIAL.title} subtitle={EDITORIAL.subtitle} description={EDITORIAL.description} contentLanguage="en">
    {EDITORIAL.sections.map((section) => (
      <section key={section.heading} className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>
    ))}
    <p>
      See also <Link to="/about" className="font-semibold text-indigo-700 underline">About</Link>,{' '}
      <Link to="/privacy" className="font-semibold text-indigo-700 underline">Privacy Policy</Link> and{' '}
      <Link to="/contact" className="font-semibold text-indigo-700 underline">Contact</Link>.
    </p>
  </InfoPageLayout>
);

export default EditorialPolicyPage;
