import React from 'react';
import { FlattenPdf } from '../components/tools/FlattenPdf';

export const FlattenPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <FlattenPdf />
    </div>
  );
};

export default FlattenPage;