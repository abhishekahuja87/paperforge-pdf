import React, { useState } from 'react';
import { HomeTopBanner } from '../components/home/HomeTopBanner';
import { HomeToolsGrid } from '../components/home/HomeToolsGrid';
import { PageMetadata } from '../components/common/PageMetadata';

export const HomePage2: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-4 pb-12">
      <PageMetadata
        title="Free Browser-Based PDF, Image & Data Tools"
        description="Use free PDF, image, data, display, and business tools in your browser. Selected files are processed on your device and are not uploaded to MyDailyUtils for processing."
      />
      <HomeTopBanner query={query} onQueryChange={setQuery} />
      <HomeToolsGrid query={query} />
    </div>
  );
};

export default HomePage2;
