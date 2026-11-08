import React, { useState } from 'react';
import { HomeTopBanner } from '../components/home/HomeTopBanner';
import { HomeToolsGrid } from '../components/home/HomeToolsGrid';
import { PageMetadata } from '../components/common/PageMetadata';
import { buildHomeJsonLd } from '../lib/structuredData';

export const HomePage2: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-full space-y-3 bg-[var(--theme-background)] pb-12">
      <PageMetadata
        title="Free Online Tools & Calculators | PDF, Images, Tax & More"
        description="Free online tools for everyday tasks: income tax, EMI and SIP calculators, age and date tools, unit converter, PDF and image tools, text and password utilities. Files and numbers are processed in your browser."
        jsonLd={buildHomeJsonLd()}
      />
      <HomeTopBanner query={query} onQueryChange={setQuery} />
      <HomeToolsGrid query={query} />
    </div>
  );
};

export default HomePage2;
