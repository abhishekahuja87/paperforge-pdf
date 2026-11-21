import React, { useState } from 'react';
import { HomeTopBanner } from '../components/home/HomeTopBanner';
import { HomeToolsGrid } from '../components/home/HomeToolsGrid';
import { InstallBar } from '../components/home/InstallBar';
import { HomeMyTools } from '../components/home/HomeMyTools';
import { PageMetadata } from '../components/common/PageMetadata';
import { buildHomeJsonLd } from '../lib/structuredData';

export const HomePage2: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-full space-y-3 bg-[var(--theme-background)] pb-12">
      <PageMetadata
        title="Free Online Tools & Calculators | PDF, Images, Tax & More"
        description="Free PDF, photo and everyday tools with no limits or sign-up: merge, split, fill and compress PDFs, resize photos, scan QR codes, tax and EMI calculators. Files stay on your device."
        jsonLd={buildHomeJsonLd()}
      />
      <HomeTopBanner query={query} onQueryChange={setQuery} />
      {query.trim() === '' && (
        <div className="mx-auto max-w-6xl space-y-3 px-4">
          <InstallBar />
          <HomeMyTools />
        </div>
      )}
      <HomeToolsGrid query={query} />
    </div>
  );
};

export default HomePage2;
