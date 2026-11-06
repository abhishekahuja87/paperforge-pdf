import React from 'react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { PdfToImages } from '../components/tools/PdfToImages';
import { ToolGuide } from '../components/common/ToolGuide';
import { siteConfig } from '../config/site';

export const PdfToImagesPage: React.FC = () => {

  const faqs = [
    {
      question: `Is converting PDF to images safe on ${siteConfig.name}?`,
      answer:
        'PDF pages are rendered in your browser and are not uploaded to MyDailyUtils for processing. The website makes separate requests for resources and advertising.',
    },
    {
      question: 'What is the quality of the converted images?',
      answer:
        'Pages are rendered as PNG images at the tool’s selected scale. Larger scales create larger images and use more memory; check the results at the size you need.',
    },
    {
      question: 'What image format is produced?',
      answer:
        'Pages are extracted as lossless PNG images to preserve text readability and transparent layers.',
    },
    {
      question: 'Is there a limit on how many pages I can convert?',
      answer:
        'There is no fixed page limit in the interface, but large documents and high render scales may take longer or exceed available browser memory.',
    },
  ];

  return (
    <ToolLayout
      title="Convert PDF to Images"
      subtitle="Extract and render every page of your PDF into crisp, high-resolution PNG images directly in your browser."
      seoContent={<ToolGuide toolName="PDF to Images" faqs={faqs} />}
    >
      <PdfToImages />
    </ToolLayout>
  );
};

export default PdfToImagesPage;