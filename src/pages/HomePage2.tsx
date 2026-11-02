import React, { useState } from 'react';
import { HomeTopBanner } from '../components/home/HomeTopBanner';
import { HomeToolsGrid } from '../components/home/HomeToolsGrid';

export const HomePage2: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-4 pb-12">
      <HomeTopBanner query={query} onQueryChange={setQuery} />
      <HomeToolsGrid query={query} />
    </div>
  );
};

export default HomePage2;
