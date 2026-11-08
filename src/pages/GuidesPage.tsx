import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { GUIDES } from '../content/guides';

export const GuidesPage: React.FC = () => (
  <InfoPageLayout
    title="Guides"
    subtitle="Plain-language how-to guides for PDFs, images, tax, money, dates and everyday calculations."
    description="Step-by-step guides on photo and PDF size for online forms, income tax, EMI, SIP, FD and RD, gratuity, GST invoices, age on cut-off dates, passwords and more."
    contentLanguage="en"
  >
    <ul className="space-y-5">
      {GUIDES.map((guide) => (
        <li key={guide.slug}>
          <h2 className="text-base font-bold text-stone-900">
            <Link to={`/guides/${guide.slug}`} className="hover:text-orange-700 hover:underline">{guide.title}</Link>
          </h2>
          <p className="mt-1 text-sm text-stone-600">{guide.description}</p>
        </li>
      ))}
    </ul>
  </InfoPageLayout>
);

export default GuidesPage;
