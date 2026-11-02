import React, { useState } from 'react';
import { HomeTopBanner } from '../components/home/HomeTopBanner';
import { HomeToolsGrid } from '../components/home/HomeToolsGrid';
import { PageMetadata } from '../components/common/PageMetadata';

export const HomePage2: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-4 pb-12">
      <PageMetadata
        title="Online Tools & Utilities | PDF, Images & More"
        description="Explore browser-based tools and utilities for files, data, and everyday tasks. PDF, images, and more, with supported file processing done locally in your browser."
      />
      <HomeTopBanner query={query} onQueryChange={setQuery} />
      <HomeToolsGrid query={query} />
    </div>
  );
};

export default HomePage2;
