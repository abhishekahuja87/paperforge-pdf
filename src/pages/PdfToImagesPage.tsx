import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PdfToImages } from '../components/tools/PdfToImages';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const PdfToImagesPage: React.FC = () => {
  const steps = [
    {
      title: 'Upload PDF Document',
      description: 'Select or drag your PDF file into the upload area above.',
    },
    {
      title: 'Render Pages',
      description: 'Click Convert Pages to PNG to render each page into high-resolution images in browser memory.',
    },
    {
      title: 'Download Images',
      description: 'Save individual page images directly to your device with one click.',
    },
  ];

  const faqs = [
    {
      question: `Is converting PDF to images safe on ${siteConfig.name}?`,
      answer:
        'Yes. All image rendering is executed locally on your device via HTML5 canvas and Web Workers. Your document is never uploaded or transferred over the network.',
    },
    {
      question: 'What is the quality of the converted images?',
      answer:
        'Pages are rendered at high resolution (2.0x scale, ~150-300 DPI equivalent) to ensure clear text and sharp illustrations.',
    },
    {
      question: 'What image format is produced?',
      answer:
        'Pages are extracted as lossless PNG images to preserve text readability and transparent layers.',
    },
    {
      question: 'Is there a limit on how many pages I can convert?',
      answer:
        'No artificial limits are imposed. The conversion capacity depends entirely on your device’s available browser memory.',
    },
  ];

  return (
    <ToolLayout
      title="Convert PDF to Images"
      subtitle="Extract and render every page of your PDF into crisp, high-resolution PNG images directly in your browser."
      seoContent={<ToolGuide toolName="PDF to Images" steps={steps} faqs={faqs} />}
    >
      <PdfToImages />
    </ToolLayout>
  );
};

export default PdfToImagesPage;