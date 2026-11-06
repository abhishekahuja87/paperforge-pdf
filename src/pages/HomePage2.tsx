import React, { useState } from 'react';
import { HomeTopBanner } from '../components/home/HomeTopBanner';
import { HomeToolsGrid } from '../components/home/HomeToolsGrid';
import { PageMetadata } from '../components/common/PageMetadata';

export const HomePage2: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-full space-y-3 bg-[var(--theme-background)] pb-12">
      <PageMetadata
        title="Everyday Tools & Utilities"
        description="Find useful browser-based tools and utilities for files, data, and everyday tasks. Request a free utility if you cannot find the one you need."
      />
      <HomeTopBanner query={query} onQueryChange={setQuery} />
      <HomeToolsGrid query={query} />
    </div>
  );
};

export default HomePage2;
