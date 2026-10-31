import React from 'react';
import { PdfToImages } from '../components/tools/PdfToImages';

export const PdfToImagesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PdfToImages />
    </div>
  );
};

export default PdfToImagesPage;